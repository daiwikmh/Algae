import type { Request, Response } from 'express'
import { z } from 'zod'
import {
    createMerchant,
    getMerchantsByUser,
    getMerchant,
    deleteMerchant,
} from '../services/merchant.service'
import { logger } from '../lib/logger'

const CreateSchema = z.object({
    name: z.string().min(1),
    algoAddress: z.string().min(1),
    merchantRef: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'merchantRef must be alphanumeric with dashes/underscores'),
})

export async function create(req: Request, res: Response): Promise<void> {
    const parsed = CreateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    try {
        const merchant = await createMerchant({
            userId: req.userId!,
            name: parsed.data.name,
            algoAddress: parsed.data.algoAddress,
            merchantRef: parsed.data.merchantRef,
        })
        res.status(201).json(merchant)
    } catch (err) {
        if (err instanceof Error) {
            logger.error('Failed to create merchant', err)
            res.status(400).json({ error: err.message })
        }
    }
}

export async function list(req: Request, res: Response): Promise<void> {
    try {
        const merchants = await getMerchantsByUser(req.userId!)
        res.json(merchants)
    } catch (err) {
        logger.error('Failed to list merchants', err as Error)
        res.status(500).json({ error: 'Failed to list merchants' })
    }
}

export async function get(req: Request, res: Response): Promise<void> {
    try {
        const merchant = await getMerchant(req.params.merchantId, req.userId!)
        res.json(merchant)
    } catch (err) {
        res.status(404).json({ error: 'Merchant not found' })
    }
}

export async function remove(req: Request, res: Response): Promise<void> {
    try {
        await deleteMerchant(req.params.merchantId, req.userId!)
        res.status(204).send()
    } catch (err) {
        res.status(404).json({ error: 'Merchant not found' })
    }
}
