import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../services/api-key.service';

export async function authM(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHdr = req.headers['authorization'];

    if (!authHdr || !authHdr.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const key = authHdr.split(' ')[1]
    const apiKey = await validateApiKey(key)


    if (!apiKey) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    req.apiKey = apiKey
    req.userId = apiKey.userId
    next();
}
