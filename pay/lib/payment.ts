import { v4 as uuidv4 } from "uuid";
import { USDC_ASSET_ID } from "./algorand";
import type { Network, PaymentRequest } from "@/types/payment";

export function createPaymentRequest(params: {
  merchant_address: string;
  amount_usd_cents: number;
  network: Network;
  ttl_seconds?: number;
}): PaymentRequest {
  const { merchant_address, amount_usd_cents, network, ttl_seconds = 900 } = params;
  return {
    payment_id: uuidv4(),
    merchant_address,
    amount_usd_cents,
    asset_id: USDC_ASSET_ID[network],
    expires_at: Math.floor(Date.now() / 1000) + ttl_seconds,
    network,
  };
}

// 100 cents = $1 = 1_000_000 microUSDC
export function centsToMicroUsdc(usd_cents: number): bigint {
  return BigInt(usd_cents) * 10000n;
}

export function microUsdcToCents(microusdc: bigint): number {
  return Number(microusdc / 10000n);
}

export function encodeNote(payment_id: string): Uint8Array {
  return new TextEncoder().encode(payment_id);
}
