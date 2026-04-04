import type { Request, Response } from 'express'
import { z } from 'zod'
import {
    initiatePayment,
    processPayment,
    getPayment,
    getPaymentsByUser,
    getPaymentsByAgent,
    getPaymentByInvoice,
} from '../services/payment.service'
import { logger } from '../lib/logger'

const InitiateSchema = z.object({
    invoiceId: z.string().min(1),
    agentId: z.string().uuid(),
    poolId: z.string().uuid(),
    merchantId: z.string().min(1),
    amountUsdCents: z.number().int().min(1),
    network: z.enum(['mainnet', 'testnet']).default('testnet'),
})
const PaymentStatusEnum = z.enum([
    'pending',
    'processing',
    'settled',
    'failed',
])

export async function initiate(req: Request, res: Response): Promise<void> {
    const parsed = InitiateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    try {
        const payment = await initiatePayment({
            userId: req.userId!,
            agentId: parsed.data.agentId,
            poolId: parsed.data.poolId,
            invoiceId: parsed.data.invoiceId,
            merchantId: parsed.data.merchantId,
            amountUsdcCents: parsed.data.amountUsdCents,
            network: parsed.data.network,
        })
        res.status(201).json(payment)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to initiate payment', err)
            res.status(400).json({ error: err.message })
        }
    }
}

export async function process(req: Request, res: Response): Promise<void> {
    try {
        const payment = await processPayment(req.params.paymentId)
        res.json(payment)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to process payment', err)
            res.status(400).json({ error: err.message })
        }
    }
}

export async function getById(req: Request, res: Response): Promise<void> {
    try {
        const payment = await getPayment(req.params.paymentId)
        res.json(payment)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to get payment', err)
            res.status(404).json({ error: err.message })
        }
    }
}

export async function getByInvoice(req: Request, res: Response): Promise<void> {
    try {
        const payment = await getPaymentByInvoice(req.params.invoiceId)
        res.json(payment)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to get payment by invoice', err)
            res.status(404).json({ error: err.message })
        }
    }
}

export async function listByUser(req: Request, res: Response): Promise<void> {
    try {
        const statusParsed = PaymentStatusEnum.safeParse(req.query.status)
        const status = statusParsed.success ? statusParsed.data : undefined
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

        const payments = await getPaymentsByUser(req.userId!, {
            status: status,
            limit,
            offset,
        })
        res.json(payments)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to list payments', err)
            res.status(500).json({ error: err.message })
        }
    }
}

export async function listByAgent(req: Request, res: Response): Promise<void> {
    try {
        const payments = await getPaymentsByAgent(req.params.agentId)
        res.json(payments)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to list payments by agent', err)
            res.status(500).json({ error: err.message })
        }
    }
}