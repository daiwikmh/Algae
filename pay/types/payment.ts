export type Network = "mainnet" | "testnet";
export type SourceChain = "ETH" | "BASE" | "AVAX" | "POL" | "ARB" | "OPT" | "SOL";

export interface PaymentRequest {
  payment_id: string;
  merchant_address: string;
  amount_usd_cents: number;
  asset_id: number;
  expires_at: number;
  network: Network;
}

export interface PaymentProof {
  payment_id: string;
  tx_id: string;
  block_round: number;
  confirmed_at: number;
  payer_address: string;
  amount_usd_cents: number;
}

export interface BridgeQuote {
  source_chain: SourceChain;
  source_token_address: string;
  amount_usd_cents: number;
  calldata: unknown;
  estimated_fee_usd: number;
  estimated_receive_microusdc: bigint;
}

export interface AgentConfig {
  agent_address: string;
  daily_limit_usd_cents: number;
  vendor_whitelist_hash: string;
}
