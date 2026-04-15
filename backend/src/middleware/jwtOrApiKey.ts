import { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../lib/jwt'
import { validateApiKey } from '../services/api-key.service'

export async function jwtOrApiKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers['authorization']

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' })
        return
    }

    const token = authHeader.split(' ')[1]

    // SDK API key
    if (token.startsWith('as_')) {
        const apiKey = await validateApiKey(token)
        if (!apiKey) {
            res.status(401).json({ error: 'Invalid API key' })
            return
        }
        req.apiKey = apiKey
        req.userId = apiKey.userId
        next()
        return
    }

    // JWT access token
    const payload = verifyJwt(token)
    if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token' })
        return
    }
    req.userId = payload.userId
    next()
}
