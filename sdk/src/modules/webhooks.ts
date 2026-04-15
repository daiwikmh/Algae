import { AlgopayClient } from '../client'
import {
    Webhook,
    WebhookDelivery,
    RegisterWebhookParams,
    UpdateWebhookParams,
} from '../types'
import {
    sanitizeId,
    sanitizeUrl,
    sanitizeWebhookEvents,
} from '../lib/sanitize'

export class WebhooksModule {
    constructor(private readonly client: AlgopayClient) { }

    register(
        params: RegisterWebhookParams
    ): Promise<Webhook & { secret: string }> {
        sanitizeUrl(params.url, 'url')
        sanitizeWebhookEvents(params.events)
        return this.client.post<Webhook & { secret: string }>(
            '/webhooks',
            params
        )
    }

    list(): Promise<Webhook[]> {
        return this.client.get<Webhook[]>('/webhooks')
    }

    update(
        webhookId: string,
        params: UpdateWebhookParams
    ): Promise<Webhook> {
        sanitizeId(webhookId, 'webhookId')
        if (params.url !== undefined) sanitizeUrl(params.url, 'url')
        if (params.events !== undefined) sanitizeWebhookEvents(params.events)
        if (
            params.active !== undefined &&
            typeof params.active !== 'boolean'
        ) {
            throw new TypeError('active must be a boolean')
        }
        return this.client.patch<Webhook>(
            `/webhooks/${sanitizeId(webhookId, 'webhookId')}`,
            params
        )
    }

    delete(webhookId: string): Promise<{ success: boolean }> {
        return this.client.delete<{ success: boolean }>(
            `/webhooks/${sanitizeId(webhookId, 'webhookId')}`
        )
    }

    getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
        return this.client.get<WebhookDelivery[]>(
            `/webhooks/${sanitizeId(webhookId, 'webhookId')}/deliveries`
        )
    }

    retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
        return this.client.post<WebhookDelivery>(
            `/webhooks/deliveries/${sanitizeId(deliveryId, 'deliveryId')}/retry`
        )
    }

    rotateSecret(
        webhookId: string
    ): Promise<Webhook & { secret: string }> {
        return this.client.post<Webhook & { secret: string }>(
            `/webhooks/${sanitizeId(webhookId, 'webhookId')}/rotate-secret`
        )
    }
}