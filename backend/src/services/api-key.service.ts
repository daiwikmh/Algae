import crypto from 'crypto';
import bcrypt from 'bcryptjs'
import { db } from '../../db/client';
import { CreateApiKeyRequest, CreateApiKeyResponse, ValidateApiKeyResponse } from '../types/api';


function generateKey(): string {
    const raw = crypto.randomBytes(32).toString('hex');
    return `as_${raw}`;
}

export async function createApikey(input: CreateApiKeyRequest, userId: string): Promise<CreateApiKeyResponse> {
    const key = generateKey();
    const hash = await bcrypt.hash(key, 10);
    const keyPrefix = key.substring(0, 8)

    const record = await db.apiKey.create({
        data: {
            key: hash,
            keyPrefix,
            name: input.name,
            companyName: input.companyName,
            network: input.network ?? 'testnet',
            userId
        },
    })
    return {
        id: record.id,
        key: key,
        name: record.name,
        companyName: record.companyName,
        network: record.network,
        createdAt: record.createdAt.toISOString(),
    }
}

export async function validateApiKey(
    rawKey: string
): Promise<ValidateApiKeyResponse | null> {
    const keyPrefix = rawKey.substring(0, 8)

    const records = await db.apiKey.findMany({
        where: { keyPrefix },
        include: { user: true },
    })

    for (const record of records) {
        const match = await bcrypt.compare(rawKey, record.key)
        if (match) {
            return {
                id: record.id,
                userId: record.userId,
                name: record.name,
                companyName: record.companyName,
                network: record.network,
                createdAt: record.createdAt.toISOString(),
            }
        }
    }

    return null
}

export async function revokeApiKey(
    key: string,
    userId: string
): Promise<boolean> {
    const records = await db.apiKey.findMany({
        where: { userId },
    })

    for (const it of records) {
        const match = await bcrypt.compare(key, it.key)
        if (match) {
            await db.apiKey.delete({ where: { id: it.id } })
            return true
        }
    }

    return false
}


export async function revokeApiKeyById(keyId: string, userId: string): Promise<boolean> {
    const result = await db.apiKey.deleteMany({ where: { id: keyId, userId } })
    return result.count > 0
}

export async function getUserApiKeys(userId: string) {
    return db.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            companyName: true,
            network: true,
            keyPrefix: true,
            createdAt: true,
        },
    })
}