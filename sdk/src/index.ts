import { AlgopayClient } from './client'
import { GasPoolModule } from './modules/gas-pool'
import { AgentsModule } from './modules/agents'
import { PaymentsModule } from './modules/payments'
import { WebhooksModule } from './modules/webhooks'
import { AlgopayConfig } from './types'

export class Algopay {
    readonly gasPool: GasPoolModule
    readonly agents: AgentsModule
    readonly payments: PaymentsModule
    readonly webhooks: WebhooksModule

    constructor(config: AlgopayConfig) {
        if (!config || typeof config !== 'object') {
            throw new TypeError('Algopay: config must be an object')
        }

        const client = new AlgopayClient(config)

        this.gasPool = new GasPoolModule(client)
        this.agents = new AgentsModule(client)
        this.payments = new PaymentsModule(client)
        this.webhooks = new WebhooksModule(client)

        Object.freeze(this)
    }
}

export { AlgopayRequestError } from './client'
export * from './types'
