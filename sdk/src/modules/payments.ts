import { AlgopayClient } from '../client'
import {
    Payment,
    InitiatePaymentParams,
    ListPaymentsParams,
} from '../types'
import {
    sanitizeId,
    sanitizePositiveInt,
} from '../lib/sanitize'

const VALID_STATUSES = ['pending', 'processing', 'settled', 'failed']
const VALID_NETWORKS = ['mainnet', 'testnet']

export class PaymentsModule {
    constructor(private readonly client: AlgopayClient) { }

    initiate(params: InitiatePaymentParams): Promise<Payment> {
        sanitizeId(params.invoiceId, 'invoiceId')
        sanitizeId(params.agentId, 'agentId')
        sanitizeId(params.poolId, 'poolId')
        sanitizeId(params.merchantId, 'merchantId')
        sanitizePositiveInt(params.amountUsdCents, 'amountUsdCents')
        if (params.amountUsdCents < 1) {
            throw new Error('amountUsdCents must be at least 1')
        }
        if (params.network && !VALID_NETWORKS.includes(params.network)) {
            throw new Error('Invalid network')
        }
        return this.client.post<Payment>('/payments', params)
    }

    process(paymentId: string): Promise<Payment> {
        return this.client.post<Payment>(
            `/payments/${sanitizeId(paymentId, 'paymentId')}/process`
        )
    }

    get(paymentId: string): Promise<Payment> {
        return this.client.get<Payment>(
            `/payments/${sanitizeId(paymentId, 'paymentId')}`
        )
    }

    getByInvoice(invoiceId: string): Promise<Payment> {
        return this.client.get<Payment>(
            `/payments/invoice/${sanitizeId(invoiceId, 'invoiceId')}`
        )
    }

    list(params?: ListPaymentsParams): Promise<Payment[]> {
        if (params?.status && !VALID_STATUSES.includes(params.status)) {
            throw new Error(`Invalid status filter: ${params.status}`)
        }
        return this.client.get<Payment[]>(
            '/payments',
            params as Record<string, string | number | undefined>
        )
    }

    listByAgent(agentId: string): Promise<Payment[]> {
        return this.client.get<Payment[]>(
            `/payments/agent/${sanitizeId(agentId, 'agentId')}`
        )
    }
}