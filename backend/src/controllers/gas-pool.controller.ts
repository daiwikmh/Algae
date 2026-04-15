import type { Request, Response } from 'express'
import { z } from 'zod'
import {
    createGasPool,
    getGasPoolBalance,
    getGasPoolsByUser,
    topUpGasPool,
    updatePoolSettings,
} from '../services/gas-pool.service'
import { logger } from '../lib/logger'

const CreatePoolSchema = z.object({
    apiKeyId: z.string().uuid(),
    dailyCapCents: z.number().int().min(0),
    alertThresholdUsdc: z.string().regex(/^\d+$/),
})

const TopUpSchema = z.object({
    amountUsdc: z.string().regex(/^\d+$/),
    txnId: z.string().min(1),
})

const UpdateSettingsSchema = z.object({
    dailyCapCents: z.number().int().min(0).optional(),
    alertThresholdUsdc: z.string().regex(/^\d+$/).optional(),
})

export async function list(req: Request, res: Response): Promise<void> {
    try {
        const pools = await getGasPoolsByUser(req.userId!)
        res.json(pools)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to list gas pools', err)
            res.status(500).json({ error: err.message })
        }
    }
}

export async function create(req: Request, res: Response): Promise<void> {
    const parsed = CreatePoolSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    try {
        const pool = await createGasPool({
            userId: req.userId!,
            apiKeyId: parsed.data.apiKeyId,
            dailyCapCents: parsed.data.dailyCapCents,
            alertThresholdUsdc: BigInt(parsed.data.alertThresholdUsdc),
        })
        res.status(201).json(pool)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to create gas pool', err)
            res.status(400).json({ error: err.message })
        }
    }
}

export async function getBalance(req: Request, res: Response): Promise<void> {
    try {
        const apiKeyId = req.params.apiKeyId
        const balance = await getGasPoolBalance(apiKeyId)
        res.json(balance)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to get gas pool balance', err)
            res.status(404).json({ error: err.message })
        }
    }
}

export async function topUp(req: Request, res: Response): Promise<void> {
    const parsed = TopUpSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    try {
        const apiKeyId = req.params.apiKeyId
        const pool = await topUpGasPool({
            apiKeyId,
            amountUsdc: BigInt(parsed.data.amountUsdc),
            txnId: parsed.data.txnId,
        })
        res.json(pool)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to top up gas pool', err)
            res.status(400).json({ error: err.message })
        }
    }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
    const parsed = UpdateSettingsSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    try {
        const apiKeyId = req.params.apiKeyId
        const pool = await updatePoolSettings({
            apiKeyId,
            dailyCapCents: parsed.data.dailyCapCents,
            alertThresholdUsdc: parsed.data.alertThresholdUsdc
                ? BigInt(parsed.data.alertThresholdUsdc)
                : undefined,
        })
        res.json(pool)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to update pool settings', err)
            res.status(400).json({ error: err.message })
        }
    }
}