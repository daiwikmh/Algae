import { db } from "../../db/client"
import { PaymentStatus } from "../../generated/prisma/enums"
import { logger } from "../lib/logger"
import { shouldResetDaily } from "./agent.service"
import { createAuditLog } from "./audit.service"
import { triggerWebhook } from "./webhook.service"
import {
    submitOnChainPayment,
    getGasFeeAlgo as fetchGasFeeAlgo,
} from "../lib/payment-processor"

interface TimelineEvent {
    step: string
    status: 'done' | 'pending' | 'failed'
    timestamp: number
    detail?: string
}

function addTimelineEvent(
    timeline: TimelineEvent[],
    event: TimelineEvent
): TimelineEvent[] {
    return [...timeline, event]
}

export async function initiatePayment(params: {
    invoiceId: string
    userId: string
    agentId: string
    poolId: string
    merchantId: string
    amountUsdcCents: number
    network: 'mainnet' | 'testnet'
}) {
    const agent = await db.agent.findUnique({
        where: { id: params.agentId },
    })
    if (!agent) {
        throw new Error('Agent not found')
    }
    if (agent.status === 'suspended') throw new Error('Agent is suspended')

    const remaining = agent.dailyLimitCents - agent.dailySpentCents
    if (params.amountUsdcCents > remaining) {
        throw new Error('Agent daily limit exceeded')
    }

    const pool = await db.gasPool.findUnique({
        where: { id: params.poolId },
    })
    if (!pool) throw new Error('Gas pool not found')
    if (pool.status === 'empty') throw new Error('Gas pool is empty')

    const amountUsdc = BigInt(params.amountUsdcCents) * 10000n

    let timeline: TimelineEvent[] = []
    timeline = addTimelineEvent(timeline, {
        step: 'Payment initiated',
        status: 'done',
        timestamp: Date.now(),
        detail: `Invoice ${params.invoiceId}`,
    })
    try {
        const payment = await db.payment.create({
            data: {
                invoiceId: params.invoiceId,
                userId: params.userId,
                agentId: params.agentId,
                poolId: params.poolId,
                merchantId: params.merchantId,
                status: 'pending',
                amountUsdCents: params.amountUsdcCents,
                amountUsdc: amountUsdc.toString(),
                network: params.network,
                gasSponsored: true,
                timeline: timeline as any,
            },
        })
        logger.info(`payment initiated`, { paymentId: payment.id, invoiceId: params.invoiceId })
        return payment
    } catch (err: any) {
        if (err.code === 'P2002') {
            throw new Error('Payment for this invoice already exists')
        }
        throw err
    }
}

export async function processPayment(paymentId: string) {
    const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: { agent: true, pool: true }
    })
    if (!payment) throw new Error('Payment not found')
    if (payment.status !== 'pending') {
        throw new Error(`Payment already ${payment.status}`)
    }

    let timeline = payment.timeline as unknown as TimelineEvent[]

    await db.payment.update({
        where: { id: paymentId },
        data: { status: 'processing' },
    })

    try {

        await db.$transaction(async (tx) => {
            const agent = await tx.agent.findUnique({
                where: { id: payment.agentId },
            })
            if (!agent) throw new Error('Agent not found')
            if (agent.status === 'suspended') throw new Error('Agent is suspended')

            let currentSpent = agent.dailySpentCents
            if (shouldResetDaily(agent.lastResetAt)) {
                await tx.agent.update({
                    where: { id: payment.agentId },
                    data: { dailySpentCents: 0, lastResetAt: new Date(), status: 'active' },
                })
                currentSpent = 0
            }

            const newSpent = currentSpent + payment.amountUsdCents
            if (newSpent > agent.dailyLimitCents) {
                throw new Error('Agent daily limit exceeded')
            }
            const newAgentStatus = newSpent >= agent.dailyLimitCents ? 'limit_reached' : 'active'

            await tx.agent.update({
                where: { id: payment.agentId },
                data: { dailySpentCents: newSpent, status: newAgentStatus },
            })

            const pool = await tx.gasPool.findUnique({
                where: { id: payment.poolId },
            })
            if (!pool) throw new Error('Gas pool not found')

            const amountUsdc = BigInt(payment.amountUsdc ?? '0')
            if (pool.balanceUsdc < amountUsdc) {
                throw new Error('Insufficient balance in gas pool')
            }

            const newBalance = pool.balanceUsdc - amountUsdc
            const newPoolStatus =
                newBalance === 0n ? 'empty'
                    : newBalance <= pool.alertThresholdUsdc / 2n ? 'critical'
                        : newBalance <= pool.alertThresholdUsdc ? 'low'
                            : 'healthy'

            await tx.gasPool.update({
                where: { id: payment.poolId },
                data: { balanceUsdc: newBalance, status: newPoolStatus },
            })
        })

        timeline = addTimelineEvent(timeline, {
            step: 'Amount limit checked',
            status: 'done',
            timestamp: Date.now(),
        })
        timeline = addTimelineEvent(timeline, {
            step: 'Gas pool debited',
            status: 'done',
            timestamp: Date.now(),
        })

        if (!payment.merchantId) throw new Error('Payment has no merchantId')

        const { txnId, blockRound } = await submitOnChainPayment({
            amountUsdc: BigInt(payment.amountUsdc ?? '0'),
            invoiceId: payment.invoiceId,
            merchantId: payment.merchantId,
            network: payment.network,
        })

        timeline = addTimelineEvent(timeline, {
            step: 'Submitted to Algorand',
            status: 'done',
            timestamp: Date.now(),
            detail: `TxID: ${txnId}`,
        })

        const gasFeeAlgo = await fetchGasFeeAlgo({ txnId, network: payment.network })

        timeline = addTimelineEvent(timeline, {
            step: 'Payment settled',
            status: 'done',
            timestamp: Date.now(),
            detail: `Block: ${blockRound}`,
        })

        const settled = await db.payment.update({
            where: { id: paymentId },
            data: {
                status: 'settled',
                algoTxnId: txnId,
                blockRound,
                confirmedAt: new Date(),
                gasFeeAlgo,
                timeline: timeline as any,
            },
        })

        await triggerWebhook({
            userId: payment.userId,
            event: 'payment_settled',
            paymentId: payment.id,
            payload: {
                event: 'payment_settled',
                payment_id: payment.id,
                invoice_id: payment.invoiceId,
                txn_id: txnId,
                amount_usdc: payment.amountUsdc,
                finality_ms: Date.now() - payment.createdAt.getTime(),
                gas_sponsored: true,
            },
        })

        await createAuditLog({
            userId: payment.userId,
            action: 'payment_settled',
            metadata: {
                paymentId: payment.id,
                invoiceId: payment.invoiceId,
                amountUsdCents: payment.amountUsdCents,
            },
        })

        logger.info(`Payment settled: ${paymentId}`)
        return settled

    } catch (err: any) {
        timeline = addTimelineEvent(timeline, {
            step: 'Payment failed',
            status: 'failed',
            timestamp: Date.now(),
            detail: err.message,
        })
        await db.payment.update({
            where: { id: paymentId },
            data: {
                status: 'failed',
                timeline: timeline as any,
            },
        })

        await triggerWebhook({
            userId: payment.userId,
            event: 'payment_failed',
            paymentId: payment.id,
            payload: {
                event: 'payment_failed',
                payment_id: payment.id,
                invoice_id: payment.invoiceId,
                error: err.message,
            },
        })
        logger.error(`Payment failed: ${paymentId}`, err)
        throw err
    }
}

export async function getPayment(paymentId: string) {
    const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: { agent: true, pool: true },
    })
    if (!payment) throw new Error('Payment not found')
    return payment
}

export async function getPaymentByInvoice(invoiceId: string) {
    const payment = await db.payment.findUnique({
        where: { invoiceId },
    })
    if (!payment) throw new Error('Payment not found')
    return payment
}

export async function getPaymentsByUser(
    userId: string,
    filters?: {
        status?: PaymentStatus
        limit?: number
        offset?: number
    }
) {
    return db.payment.findMany({
        where: {
            userId,
            ...(filters?.status && { status: filters.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 20,
        skip: filters?.offset ?? 0,
        include: { agent: true },
    })
}

export async function getPaymentsByAgent(agentId: string) {
    return db.payment.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
    })
}