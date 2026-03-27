import { getIndexerClient, USDC_ASSET_ID } from "./algorand";
import { centsToMicroUsdc, microUsdcToCents } from "./payment";
import type { Network, PaymentProof, PaymentRequest } from "@/types/payment";

export class AlgopayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AlgopayError";
  }
}

export async function validatePayment(
  tx_id: string,
  expected: PaymentRequest,
  network: Network,
): Promise<PaymentProof> {
  const indexer = getIndexerClient(network);

  let txInfo: Record<string, unknown>;
  try {
    const result = await indexer.lookupTransactionByID(tx_id).do();
    txInfo = result.transaction as unknown as Record<string, unknown>;
  } catch {
    throw new AlgopayError("PAYMENT_NOT_FOUND", `tx ${tx_id} not found in indexer`);
  }

  if (txInfo["tx-type"] !== "axfer") {
    throw new AlgopayError("WRONG_TYPE", "transaction is not an asset transfer");
  }

  const axfer = txInfo["asset-transfer-transaction"] as Record<string, unknown>;

  if ((axfer["asset-id"] as number) !== USDC_ASSET_ID[network]) {
    throw new AlgopayError("WRONG_ASSET", "asset is not USDC");
  }

  if ((axfer["receiver"] as string) !== expected.merchant_address) {
    throw new AlgopayError("WRONG_RECIPIENT", "recipient does not match merchant address");
  }

  const actual = BigInt(axfer["amount"] as number);
  const required = centsToMicroUsdc(expected.amount_usd_cents);
  if (actual < required) {
    throw new AlgopayError(
      "INSUFFICIENT_AMOUNT",
      `received ${actual} microUSDC, expected at least ${required}`,
    );
  }

  const noteB64 = txInfo["note"] as string | undefined;
  const noteStr = noteB64
    ? new TextDecoder().decode(Buffer.from(noteB64, "base64"))
    : "";
  if (noteStr !== expected.payment_id) {
    throw new AlgopayError("WRONG_NOTE", "note does not match payment_id");
  }

  const confirmedRound = txInfo["confirmed-round"] as number;
  const blockResult = await indexer.lookupBlock(confirmedRound).do();
  const blockTs = blockResult.timestamp as number;

  if (blockTs > expected.expires_at) {
    throw new AlgopayError(
      "PAYMENT_EXPIRED",
      `payment confirmed at ${blockTs}, expired at ${expected.expires_at}`,
    );
  }

  return {
    payment_id: expected.payment_id,
    tx_id,
    block_round: confirmedRound,
    confirmed_at: blockTs,
    payer_address: txInfo["sender"] as string,
    amount_usd_cents: microUsdcToCents(actual),
  };
}
