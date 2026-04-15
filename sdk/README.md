# algopay-stack `v0.2.0`

Algorand USDC payment SDK for AI agents and businesses. Gas-sponsored transactions, agent spending limits, merchant routing, and webhook delivery — all on Algorand testnet and mainnet.

## Install

```bash
npm install algopay-stack
# or
pnpm add algopay-stack
```

## Requirements

- Node.js >= 18
- An API key from the Algopay dashboard (starts with `as_`)

## Quick Start

```ts
import { Algopay } from 'algopay-stack'

const algopay = new Algopay({
  apiKey: 'as_your_api_key',
  network: 'testnet', // or 'mainnet'
})
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | required | API key from the dashboard |
| `network` | `'testnet' \| 'mainnet'` | `'testnet'` | Algorand network |
| `baseUrl` | `string` | `https://api.algopay.dev/api/v1` | Override API base URL |
| `timeoutMs` | `number` | `10000` | Request timeout in ms (1000–60000) |

## Modules

### `algopay.payments`

```ts
// Initiate a payment
const payment = await algopay.payments.initiate({
  invoiceId: 'inv_123',
  agentId: 'agent-uuid',
  poolId: 'pool-uuid',
  merchantId: 'merchant-uuid',
  amountUsdCents: 1000, // $10.00
  network: 'testnet',
})

// Process (submit on-chain)
await algopay.payments.process(payment.id)

// Poll by payment ID
const status = await algopay.payments.get(payment.id)

// Lookup by invoice ID
const byInvoice = await algopay.payments.getByInvoice('inv_123')

// List payments
const all = await algopay.payments.list({ status: 'settled', limit: 50 })

// List by agent
const agentPayments = await algopay.payments.listByAgent('agent-uuid')
```

### `algopay.agents`

```ts
// Create an agent
const agent = await algopay.agents.create({
  poolId: 'pool-uuid',
  name: 'Agent-01',
  algoAddress: 'ALGO_ADDRESS_58_CHARS',
  dailyLimitCents: 500000, // $5,000/day
  vendorWhitelistHash: '0x0', // '0x0' = unrestricted
})

// Get agent status + remaining limit
const status = await algopay.agents.getStatus(agent.id)

// List agents
const agents = await algopay.agents.list({ limit: 20, offset: 0 })

// Update
await algopay.agents.update(agent.id, { dailyLimitCents: 100000 })

// Suspend / activate
await algopay.agents.suspend(agent.id)
await algopay.agents.activate(agent.id)

// Delete
await algopay.agents.delete(agent.id)
```

### `algopay.gasPool`

Gas pools hold USDC that sponsors Algorand transaction fees for agents.

```ts
// Create a pool
const pool = await algopay.gasPool.create({
  apiKeyId: 'api-key-uuid',
  dailyCapCents: 500000,
  alertThresholdUsdc: '10000000', // 10 USDC in microUSDC
})

// Get balance
const balance = await algopay.gasPool.getBalance(pool.id)
console.log(balance.estimatedTxnsRemaining)

// Top up (after sending USDC on-chain)
await algopay.gasPool.topUp(pool.apiKeyId, {
  amountUsdc: '50000000', // 50 USDC in microUSDC
  txnId: 'ALGO_TXN_ID',
})

// Update limits
await algopay.gasPool.update(pool.id, { dailyCapCents: 1000000 })

// List all pools
const pools = await algopay.gasPool.list()

// Delete
await algopay.gasPool.delete(pool.id)
```

### `algopay.webhooks`

```ts
// Register a webhook
const hook = await algopay.webhooks.register({
  url: 'https://yourapp.com/webhooks/algopay',
  events: ['payment_settled', 'payment_failed', 'pool_low'],
})

// List webhooks
const hooks = await algopay.webhooks.list()

// Update
await algopay.webhooks.update(hook.id, { active: false })

// Get delivery history
const deliveries = await algopay.webhooks.listDeliveries(hook.id)

// Delete
await algopay.webhooks.delete(hook.id)
```

## Error Handling

All methods throw `AlgopayRequestError` on failure.

```ts
import { Algopay, AlgopayRequestError } from 'algopay-stack'

try {
  await algopay.payments.initiate({ ... })
} catch (err) {
  if (err instanceof AlgopayRequestError) {
    console.error(err.message) // human-readable message
    console.error(err.code)   // e.g. 'INVALID_CONFIG', 'TIMEOUT', 'REQUEST_FAILED'
    console.error(err.status) // HTTP status, 0 for network/config errors
  }
}
```

Common error codes:

| Code | Cause |
|------|-------|
| `INVALID_CONFIG` | Bad or missing config options |
| `INVALID_API_KEY` | API key format wrong or too short |
| `TIMEOUT` | Request exceeded `timeoutMs` |
| `NETWORK_ERROR` | Failed after retries |
| `REQUEST_FAILED` | Non-2xx response from API |

## Payment Status Flow

```
pending -> processing -> settled
                      -> failed
```

- `pending` — payment record created
- `processing` — transaction submitted on-chain
- `settled` — confirmed on Algorand
- `failed` — on-chain error or timeout

## Network Notes

- Testnet USDC asset ID: `10458941`
- Mainnet USDC asset ID: `31566704`
- Gas fees are sponsored by the gas pool — agents do not need ALGO balances

## License

MIT
