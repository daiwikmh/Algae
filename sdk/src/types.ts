export interface AlgopayConfig {
    apiKey: string
    baseUrl?: string
    network?: 'mainnet' | 'testnet'
    timeoutMs?: number
}

export type Network = 'mainnet' | 'testnet'
export type PaymentStatus = 'pending' | 'processing' | 'settled' | 'failed'
export type AgentStatus = 'active' | 'limit_reached' | 'suspended'
export type PoolStatus = 'healthy' | 'low' | 'critical' | 'empty'
export type WebhookEvent = 'payment_settled' | 'payment_failed' | 'pool_low'


export interface GasPool {
    id: string
    userId: string
    apiKeyId: string
    balanceUsdc: string
    dailyCapCents: number
    alertThresholdUsdc: string
    status: PoolStatus
    createdAt: string
    updatedAt: string
}

export interface GasPoolBalance {
    id: string
    balanceUsdc: string
    dailyCapCents: number
    alertThresholdUsdc: string
    estimatedTxnsRemaining: number
    status: PoolStatus
    updatedAt: string
}

export interface CreateGasPoolParams {
    apiKeyId: string
    dailyCapCents: number
    alertThresholdUsdc: string
}

export interface TopUpGasPoolParams {
    amountUsdc: string
    txnId: string
}

export interface UpdateGasPoolParams {
    dailyCapCents?: number
    alertThresholdUsdc?: string
}

export interface Agent {
    id: string
    userId: string
    poolId: string
    name: string
    algoAddress: string
    dailyLimitCents: number
    dailySpentCents: number
    vendorWhitelistHash: string
    status: AgentStatus
    lastResetAt: string
    algoTxnId: string | null
    createdAt: string
    updatedAt: string
}

export interface AgentStatusResult {
    id: string
    name: string
    status: AgentStatus
    algoAddress: string
    dailyLimitCents: number
    dailySpentCents: number
    remainingCents: number
    resetsInSeconds: number
    lastResetAt: string
    poolId: string
}

export interface CreateAgentParams {
    poolId: string
    name: string
    algoAddress: string
    dailyLimitCents: number
    vendorWhitelistHash: string
}

export interface UpdateAgentParams {
    name?: string
    dailyLimitCents?: number
    vendorWhitelistHash?: string
}

export interface ListAgentsParams {
    limit?: number
    offset?: number
}

export interface Payment {
    id: string
    invoiceId: string
    userId: string
    agentId: string
    poolId: string
    merchantId: string | null
    status: PaymentStatus
    amountUsdCents: number
    amountUsdc: string | null
    algoTxnId: string | null
    blockRound: number | null
    confirmedAt: string | null
    gasSponsored: boolean
    gasFeeAlgo: string | null
    network: Network
    timeline: TimelineEvent[]
    createdAt: string
    updatedAt: string
}

export interface TimelineEvent {
    step: string
    status: 'done' | 'pending' | 'failed'
    timestamp: number
    detail?: string
}

export interface InitiatePaymentParams {
    invoiceId: string
    agentId: string
    poolId: string
    merchantId: string
    amountUsdCents: number
    network?: Network
}

export interface ListPaymentsParams {
    status?: PaymentStatus
    limit?: number
    offset?: number
}

export interface Webhook {
    id: string
    url: string
    events: WebhookEvent[]
    active: boolean
    createdAt: string
}

export interface RegisterWebhookParams {
    url: string
    events: WebhookEvent[]
}

export interface UpdateWebhookParams {
    url?: string
    events?: WebhookEvent[]
    active?: boolean
}

export interface WebhookDelivery {
    id: string
    webhookId: string
    paymentId: string | null
    event: WebhookEvent
    httpStatus: number | null
    retries: number
    success: boolean
    payload: object
    deliveredAt: string | null
    createdAt: string
}

export interface AlgopayError {
    error: string
    code?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    limit: number
    offset: number
}
