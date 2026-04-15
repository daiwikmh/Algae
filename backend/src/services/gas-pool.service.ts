import { db } from "../../db/client";
import { PoolStatus } from "../../generated/prisma/enums";
import { logger } from "../lib/logger";


function checkStatus(balanceUSDC: bigint, alertThreshold: bigint): PoolStatus {
    if (balanceUSDC === 0n) return PoolStatus.empty;
    if (balanceUSDC <= alertThreshold / 2n) return PoolStatus.critical;

    if (balanceUSDC <= alertThreshold) return PoolStatus.low;

    return PoolStatus.healthy
}
//logic 
async function verifyOnChainDeposit(
    txnId: string,
    expectedAmt: bigint,
    poolAddr: string
): Promise<boolean> {
    logger.warn('verifying on-chain deposit', { txnId, expectedAmt: expectedAmt.toString(), poolAddr });
    return true;
}

export async function getOnChainBalance(poolAddr: string): Promise<bigint> {
    logger.warn('fetching on-chain balance', { poolAddr });
    return 0n;
}


export async function createGasPool(params: {
    userId: string
    apiKeyId: string
    dailyCapCents: number
    alertThresholdUsdc: bigint
}) {
    try {
        const pool = await db.gasPool.create({
            data: {
                userId: params.userId,
                apiKeyId: params.apiKeyId,
                dailyCapCents: params.dailyCapCents,
                alertThresholdUsdc: params.alertThresholdUsdc,
                balanceUsdc: 0n,
                status: 'empty',
            },
        })
        logger.info(`Gas pool created: ${pool.id}`)
        return pool
    } catch (err: any) {
        if (err.code === 'P2002') {
            throw new Error('Gas pool already exists for this API key')
        }
        throw err
    }
}

export async function getGasPoolById(poolId: string) {
    const pool = await db.gasPool.findUnique({ where: { id: poolId } })

    if (!pool) {
        throw new Error('Gas pool not found')
    }
    return pool
}

export async function getGasPoolBalance(apiKeyId: string) {
    const pool = await db.gasPool.findUnique({ where: { apiKeyId: apiKeyId } })

    if (!pool) {
        throw new Error('Gas pool not found')
    }
    // sync on-chain USDC balance here when ready (getOnChainBalance)

    const estimatedTxnsRemaining = pool.balanceUsdc / 1000n;

    return {
        id: pool.id,
        balanceUsdc: pool.balanceUsdc.toString(),
        dailyCapCents: pool.dailyCapCents,
        alertThresholdUsdc: pool.alertThresholdUsdc.toString(),
        estimatedTxnsRemaining: Number(estimatedTxnsRemaining),
        status: pool.status,
        updatedAt: pool.updatedAt,
    }
}


export async function topUpGasPool(params: {
    apiKeyId: string
    amountUsdc: bigint
    txnId: string
}) {
    const pool = await db.gasPool.findUnique({ where: { apiKeyId: params.apiKeyId } })

    if (!pool) {
        throw new Error('Gas pool not found')
    }

    // verify txnId on-chain before crediting (verifyOnChainDeposit)

    const newBalance = pool.balanceUsdc + params.amountUsdc
    const newStatus = checkStatus(newBalance, pool.alertThresholdUsdc)

    const updated = await db.gasPool.update({
        where: { id: pool.id },
        data: {
            balanceUsdc: newBalance,
            status: newStatus,
        }
    });
    logger.info(`Gas pool topped up : ${params.amountUsdc} USDC`)
    return updated
}

export async function debitFromPool(params: {
    poolId: string
    amountUsdc: bigint
}) {

    const pool = await db.gasPool.findUnique({ where: { id: params.poolId } })

    if (!pool) {
        throw new Error('Gas pool not found')
    }

    if (pool.balanceUsdc < params.amountUsdc) {
        throw new Error('Insufficient balance in gas pool')
    }

    const newBalance = pool.balanceUsdc - params.amountUsdc
    const newStatus = checkStatus(newBalance, pool.alertThresholdUsdc)

    return db.gasPool.update({
        where: { id: params.poolId },
        data: {
            balanceUsdc: newBalance,
            status: newStatus,
        }
    })
}


export async function getGasPoolsByUser(userId: string) {
    return db.gasPool.findMany({
        where: { userId },
        include: {
            apiKey: { select: { id: true, name: true, network: true, keyPrefix: true } },
            agents: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function updatePoolSettings(params: {
    apiKeyId: string
    dailyCapCents?: number
    alertThresholdUsdc?: bigint
}) {
    const pool = await db.gasPool.findUnique({ where: { apiKeyId: params.apiKeyId } })

    if (!pool) {
        throw new Error('Gas pool not found')
    }

    return db.gasPool.update({
        where: { id: pool.id },
        data: {
            ...(params.dailyCapCents !== undefined && { dailyCapCents: params.dailyCapCents }),
            ...(params.alertThresholdUsdc !== undefined && { alertThresholdUsdc: params.alertThresholdUsdc }),
        },

    })
}