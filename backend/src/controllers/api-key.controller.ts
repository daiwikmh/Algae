import { Request, Response } from 'express'
import { z } from 'zod'
import { createApikey, getUserApiKeys, revokeApiKey, revokeApiKeyById } from '../services/api-key.service'

const CreateSchema = z.object({
    name: z.string().min(1),
    companyName: z.string().min(1),
    network: z.enum(['mainnet', 'testnet']).default('testnet'),
})

export async function register(req: Request, res: Response): Promise<void> {
    const parsed = CreateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return
    }
    const result = await createApikey(parsed.data, req.userId!)
    res.status(201).json(result)
}

export async function revoke(req: Request, res: Response): Promise<void> {
    const key = req.headers['authorization']?.split(' ')[1]
    if (!key) {
        res.status(400).json({ error: 'No key provided' })
        return
    }
    const success = await revokeApiKey(key, req.userId!)
    if (!success) {
        res.status(404).json({ error: 'API key not found' })
        return
    }
    res.status(200).json({ success: true, message: 'API key revoked' })
}

export async function validate(req: Request, res: Response): Promise<void> {
    res.status(200).json(req.apiKey)
}

export async function revokeById(req: Request, res: Response): Promise<void> {
    try {
        const success = await revokeApiKeyById(req.params.keyId, req.userId!)
        if (!success) {
            res.status(404).json({ error: 'API key not found' })
            return
        }
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to revoke key' })
    }
}

export async function listKeys(req: Request, res: Response): Promise<void> {
    try {
        const keys = await getUserApiKeys(req.userId!)
        res.json(keys)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch keys' })
    }
}