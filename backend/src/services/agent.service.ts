import { db } from "../../db/client";

import { AgentStatus } from "../../generated/prisma/enums";
import { logger } from "../lib/logger";


async function registerAgentOnChain(params: {
    agentAddr: string,
    dailyLimitCents: number
    vendorWhitelistHash: string
}): Promise<string> {

    logger.warn('registerAgentOnChain', params);
    return 'TODO: register agent on chain';
}

export async function getAgentStatusOnChain(algoAddr: string): Promise<{
    dailyLimit: bigint,
    dailySpent: bigint,
    lastResetDay: bigint,
}> {
    logger.warn('getAgentStatus', { algoAddr });
    return {
        dailyLimit: BigInt(0),
        dailySpent: BigInt(0),
        lastResetDay: BigInt(0),
    }
}

async function suspendAgentOnChain(algoAddr: string): Promise<void> {
    logger.warn('suspendAgentOnChain', { algoAddr });
}

export function shouldResetDaily(lastResetAt: Date): boolean {
    const now = new Date();
    return (
        now.getUTCFullYear() !== lastResetAt.getUTCFullYear() ||
        now.getUTCMonth() !== lastResetAt.getUTCMonth() ||
        now.getUTCDate() !== lastResetAt.getUTCDate()
    )
}

function calculateStatus(
    dailySpentCents: number,
    dailyLimitCents: number
): AgentStatus {
    if (dailySpentCents >= dailyLimitCents) return 'limit_reached'
    return 'active'
}


export async function createAgent(params: {
    userId: string,
    poolId: string,
    name: string,
    algoAddr: string,
    dailyLimitCents: number,
    vendorWhitelistHash: string
}) {
    try {
        // TODO :  registerAgentOnChain
        const algoTxnId = await registerAgentOnChain({
            agentAddr: params.algoAddr,
            dailyLimitCents: params.dailyLimitCents,
            vendorWhitelistHash: params.vendorWhitelistHash
        });

        const agent = await db.agent.create({
            data: {
                userId: params.userId,
                poolId: params.poolId,
                name: params.name,
                algoAddress: params.algoAddr,
                dailyLimitCents: params.dailyLimitCents,
                vendorWhitelistHash: params.vendorWhitelistHash,
                dailySpentCents: 0,
                status: 'active',
                algoTxnId: algoTxnId, // placeholder_txn_id 
            },
        })
        logger.info(`Agent created ${agent.id}`)
        return agent;
    } catch (err: any) {

        if (err.code === 'P2002' && err.meta?.target?.includes('algoAddress')) {
            throw new Error('An agent exist with same address');
        }
        throw err

    }

}

export async function getAgent(agentId: string) {
    const agent = await db.agent.findUnique({
        where: { id: agentId },
        include: { pool: true },
    })
    if (!agent) throw new Error('Agent not found')
    return agent
}

export async function getAgentsByPool(poolId: string,
    filters?: { limit?: number; offset?: number }

) {
    return db.agent.findMany({
        where: { poolId },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 20,
        skip: filters?.offset ?? 0,
    })
}
export async function getAgentsByUser(userId: string,
    filters?: { limit?: number; offset?: number }
) {
    return db.agent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 20,
        skip: filters?.offset ?? 0,
    })
}

export async function getAgentStatus(agentId: string) {
    const agent = await db.agent.findUnique({
        where: { id: agentId },
    })
    if (!agent) throw new Error('Agent not found')

    // lazy reset
    if (shouldResetDaily(agent.lastResetAt)) {
        await db.agent.update({
            where: { id: agentId },
            data: {
                dailySpentCents: 0,
                lastResetAt: new Date(),
                status: 'active',
            },
        })
        agent.dailySpentCents = 0
        agent.status = 'active'
    }

    const remainingCents = agent.dailyLimitCents - agent.dailySpentCents
    const resetsAt = new Date(agent.lastResetAt)
    resetsAt.setUTCDate(resetsAt.getUTCDate() + 1)
    resetsAt.setUTCHours(0, 0, 0, 0)
    const resetsInSeconds = Math.floor((resetsAt.getTime() - Date.now()) / 1000)

    return {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        algoAddress: agent.algoAddress,
        dailyLimitCents: agent.dailyLimitCents,
        dailySpentCents: agent.dailySpentCents,
        remainingCents,
        resetsInSeconds,
        lastResetAt: agent.lastResetAt,
        poolId: agent.poolId,
    }
}

export async function spendFromAgent(params: {
    agentId: string
    amountCents: number
}) {
    const agent = await db.agent.findUnique({
        where: { id: params.agentId },
    })
    if (!agent) throw new Error('Agent not found')

    // lazy reset
    if (shouldResetDaily(agent.lastResetAt)) {
        await db.agent.update({
            where: { id: params.agentId },
            data: { dailySpentCents: 0, lastResetAt: new Date(), status: 'active' },
        })
        agent.dailySpentCents = 0
    }

    if (agent.status === 'suspended') {
        throw new Error('Agent is suspended')
    }

    const newSpent = agent.dailySpentCents + params.amountCents
    if (newSpent > agent.dailyLimitCents) {
        throw new Error('Agent daily limit exceeded')
    }

    const newStatus = calculateStatus(newSpent, agent.dailyLimitCents)

    return db.agent.update({
        where: { id: params.agentId },
        data: {
            dailySpentCents: newSpent,
            status: newStatus,
        },
    })
}

export async function suspendAgent(agentId: string) {
    const agent = await db.agent.findUnique({ where: { id: agentId } })
    if (!agent) throw new Error('Agent not found')

    await suspendAgentOnChain(agent.algoAddress)

    return db.agent.update({
        where: { id: agentId },
        data: { status: 'suspended' },
    })
}

export async function updateAgent(params: {
    agentId: string
    name?: string
    dailyLimitCents?: number
    vendorWhitelistHash?: string
}) {
    const agent = await db.agent.findUnique({ where: { id: params.agentId } })
    if (!agent) throw new Error('Agent not found')

    return db.agent.update({
        where: { id: params.agentId },
        data: {
            ...(params.name !== undefined && { name: params.name }),
            ...(params.dailyLimitCents !== undefined && { dailyLimitCents: params.dailyLimitCents }),
            ...(params.vendorWhitelistHash !== undefined && { vendorWhitelistHash: params.vendorWhitelistHash }),
        },
    })
}