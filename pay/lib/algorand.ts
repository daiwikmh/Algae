import algosdk from "algosdk";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import type { Network } from "@/types/payment";

export const USDC_ASSET_ID: Record<Network, number> = {
  mainnet: 31566704,
  testnet: 10458941,
};

const NODE_URLS: Record<Network, string> = {
  mainnet: "https://mainnet-api.algonode.cloud",
  testnet: "https://testnet-api.algonode.cloud",
};

const INDEXER_URLS: Record<Network, string> = {
  mainnet: "https://mainnet-idx.algonode.cloud",
  testnet: "https://testnet-idx.algonode.cloud",
};

export function getAlgodClient(network: Network): algosdk.Algodv2 {
  return new algosdk.Algodv2("", NODE_URLS[network], 443);
}

export function getIndexerClient(network: Network): algosdk.Indexer {
  return new algosdk.Indexer("", INDEXER_URLS[network], 443);
}

export function getAlgorandClient(network: Network): AlgorandClient {
  return network === "mainnet"
    ? AlgorandClient.mainNet()
    : AlgorandClient.testNet();
}
