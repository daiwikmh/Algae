import {
  AllbridgeCoreSdk,
  ChainSymbol,
  FeePaymentMethod,
  Messenger,
  type ChainDetailsMap,
  type SendParams,
  type TokenWithChainDetails,
  type NodeRpcUrls,
} from "@allbridge/bridge-core-sdk";
import type { BridgeQuote, Network, SourceChain } from "@/types/payment";

// Allbridge chain symbol map
const CHAIN_MAP: Record<SourceChain, ChainSymbol> = {
  ETH: ChainSymbol.ETH,
  BASE: ChainSymbol.BAS,
  AVAX: ChainSymbol.AVA,
  POL: ChainSymbol.POL,
  ARB: ChainSymbol.ARB,
  OPT: ChainSymbol.OPT,
  SOL: ChainSymbol.SOL,
};

function getSdk(nodeRpcUrls: NodeRpcUrls): AllbridgeCoreSdk {
  return new AllbridgeCoreSdk(nodeRpcUrls);
}

function findUsdcToken(
  tokens: TokenWithChainDetails[],
  chain: ChainSymbol,
): TokenWithChainDetails {
  const token = tokens.find(
    (t) =>
      t.chainSymbol === chain &&
      (t.symbol === "USDC" || t.symbol.startsWith("USDC")),
  );
  if (!token) throw new Error(`USDC not found on chain ${chain}`);
  return token;
}

export async function getBridgeQuote(params: {
  source_chain: SourceChain;
  source_address: string;
  amount_usd_cents: number;
  destination_address: string;
  network: Network;
  node_rpc_urls: NodeRpcUrls;
}): Promise<BridgeQuote> {
  const {
    source_chain,
    source_address,
    amount_usd_cents,
    destination_address,
    node_rpc_urls,
  } = params;

  const sdk = getSdk(node_rpc_urls);
  const chainDetails: ChainDetailsMap = await sdk.chainDetailsMap();

  const srcSymbol = CHAIN_MAP[source_chain];
  const srcTokens = Object.values(chainDetails)
    .flatMap((c) => c.tokens)
    .filter((t): t is TokenWithChainDetails => !!t);

  const sourceToken = findUsdcToken(srcTokens, srcSymbol);
  const destToken = findUsdcToken(srcTokens, ChainSymbol.ALG);

  // amount in token units (USDC has 6 decimals, so cents * 10000 = microUSDC, but Allbridge wants string in full units)
  const amount = (amount_usd_cents / 100).toFixed(2);

  const receiveAmount = await sdk.getAmountToBeReceived(
    amount,
    sourceToken,
    destToken,
    Messenger.ALLBRIDGE,
  );

  const sendParams: SendParams = {
    amount,
    fromAccountAddress: source_address,
    toAccountAddress: destination_address,
    sourceToken,
    destinationToken: destToken,
    messenger: Messenger.ALLBRIDGE,
    gasFeePaymentMethod: FeePaymentMethod.WITH_NATIVE_CURRENCY,
  };

  const rawTx = await sdk.bridge.rawTxBuilder.send(sendParams);

  return {
    source_chain,
    source_token_address: sourceToken.tokenAddress,
    amount_usd_cents,
    calldata: rawTx,
    estimated_fee_usd: 0,
    estimated_receive_microusdc: BigInt(
      Math.floor(parseFloat(receiveAmount) * 1_000_000),
    ),
  };
}

export async function getBridgeTransferStatus(
  tx_id: string,
  source_chain: SourceChain,
  node_rpc_urls: NodeRpcUrls,
): Promise<"pending" | "complete" | "failed"> {
  const sdk = getSdk(node_rpc_urls);
  const srcSymbol = CHAIN_MAP[source_chain];

  try {
    const status = await sdk.getTransferStatus(srcSymbol, tx_id);
    if (!status) return "pending";
    // status.statusName varies; map to simple states
    const name = (status as { statusName?: string }).statusName ?? "";
    if (name === "Complete") return "complete";
    if (name === "Failed") return "failed";
    return "pending";
  } catch {
    return "pending";
  }
}
