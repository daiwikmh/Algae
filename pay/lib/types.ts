export type Network = "mainnet" | "testnet";

export type PaymentStatus = "pending" | "processing" | "settled" | "failed";

export type PoolStatus = "healthy" | "low" | "critical" | "empty";

export type AgentStatus = "active" | "limit_reached" | "suspended";

export interface TimelineEvent {
  step: string;
  status: "done" | "pending" | "failed";
  timestamp: number;
  detail?: string;
}

export interface Agent {
  id: string;
  name: string;
  algoAddress: string;
  dailyLimitCents: number;
  dailySpentCents: number;
  vendorWhitelistHash: string;
  status: AgentStatus;
  poolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GasPool {
  id: string;
  apiKeyId: string;
  balanceUsdc: string; // BigInt serialized as string
  dailyCapCents: number;
  alertThresholdUsdc: string;
  status: PoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  userId: string;
  agentId: string;
  poolId: string;
  merchantId: string | null;
  status: PaymentStatus;
  amountUsdCents: number;
  amountUsdc: string | null; // microUSDC as string
  algoTxnId: string | null;
  blockRound: number | null;
  confirmedAt: string | null;
  gasSponsored: boolean;
  gasFeeAlgo: string | null;
  network: Network;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
  pool?: GasPool;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiKey {
  id: string;
  name: string;
  companyName: string;
  network: Network;
  keyPrefix: string;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; // plaintext — only returned at creation
}

export interface GasPoolApiKey {
  id: string;
  name: string;
  network: Network;
  keyPrefix: string;
}

export interface GasPool {
  id: string;
  apiKeyId: string;
  balanceUsdc: string; // BigInt serialized, microUSDC
  dailyCapCents: number;
  alertThresholdUsdc: string;
  status: PoolStatus;
  createdAt: string;
  updatedAt: string;
  apiKey?: GasPoolApiKey;
  agents?: { id: string }[];
}

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  algoAddress: string;
  merchantRef: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent = "payment_settled" | "payment_failed" | "pool_low";

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  paymentId: string | null;
  event: WebhookEvent;
  httpStatus: number | null;
  retries: number;
  success: boolean;
  payload: unknown;
  deliveredAt: string | null;
  createdAt: string;
}
