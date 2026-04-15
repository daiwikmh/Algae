import { db } from '../../db/client'
import { registerMerchantOnChain } from '../lib/merchant-registry'
import { logger } from '../lib/logger'

export async function createMerchant(params: {
    userId: string
    name: string
    algoAddress: string
    merchantRef: string
}) {
    const existing = await db.merchant.findUnique({ where: { merchantRef: params.merchantRef } })
    if (existing) throw new Error('Merchant ref already exists')

    await registerMerchantOnChain({
        merchantId: params.merchantRef,
        algoAddress: params.algoAddress,
    })

    logger.info('Registered merchant on-chain', { merchantRef: params.merchantRef })

    return db.merchant.create({
        data: {
            userId: params.userId,
            name: params.name,
            algoAddress: params.algoAddress,
            merchantRef: params.merchantRef,
        },
    })
}

export async function getMerchantsByUser(userId: string) {
    return db.merchant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getMerchant(merchantId: string, userId: string) {
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } })
    if (!merchant || merchant.userId !== userId) throw new Error('Merchant not found')
    return merchant
}

export async function deleteMerchant(merchantId: string, userId: string) {
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } })
    if (!merchant || merchant.userId !== userId) throw new Error('Merchant not found')
    await db.merchant.delete({ where: { id: merchantId } })
}
