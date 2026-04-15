import { AlgopayClient } from '../client'
import {
    Agent,
    AgentStatusResult,
    CreateAgentParams,
    UpdateAgentParams,
    ListAgentsParams,
} from '../types'
import {
    sanitizeId,
    sanitizeString,
    sanitizePositiveInt,
} from '../lib/sanitize'

export class AgentsModule {
    constructor(private readonly client: AlgopayClient) { }

    create(params: CreateAgentParams): Promise<Agent> {
        sanitizeId(params.poolId, 'poolId')
        sanitizeString(params.name, 'name')
        sanitizeString(params.algoAddress, 'algoAddress')
        sanitizePositiveInt(params.dailyLimitCents, 'dailyLimitCents')
        sanitizeString(params.vendorWhitelistHash, 'vendorWhitelistHash')
        return this.client.post<Agent>('/agents', params)
    }

    list(params?: ListAgentsParams): Promise<Agent[]> {
        return this.client.get<Agent[]>('/agents', params as Record<string, number | undefined>)
    }

    listByPool(poolId: string, params?: ListAgentsParams): Promise<Agent[]> {
        return this.client.get<Agent[]>(
            `/agents/pool/${sanitizeId(poolId, 'poolId')}`,
            params as Record<string, number | undefined>
        )
    }

    getStatus(agentId: string): Promise<AgentStatusResult> {
        return this.client.get<AgentStatusResult>(
            `/agents/${sanitizeId(agentId, 'agentId')}`
        )
    }

    update(agentId: string, params: UpdateAgentParams): Promise<Agent> {
        sanitizeId(agentId, 'agentId')
        if (params.name !== undefined) sanitizeString(params.name, 'name')
        if (params.dailyLimitCents !== undefined) {
            sanitizePositiveInt(params.dailyLimitCents, 'dailyLimitCents')
        }
        if (params.vendorWhitelistHash !== undefined) {
            sanitizeString(params.vendorWhitelistHash, 'vendorWhitelistHash')
        }
        return this.client.patch<Agent>(
            `/agents/${sanitizeId(agentId, 'agentId')}`,
            params
        )
    }

    suspend(agentId: string): Promise<Agent> {
        return this.client.post<Agent>(
            `/agents/${sanitizeId(agentId, 'agentId')}/suspend`
        )
    }
}