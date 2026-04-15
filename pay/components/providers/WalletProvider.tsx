"use client";

import {
  WalletProvider,
  WalletManager,
  WalletId,
  NetworkId,
  DEFAULT_NETWORK_CONFIG,
  useNetwork as useWalletNetwork,
} from "@txnlab/use-wallet-react";
import { useMemo, useEffect } from "react";
import { useNetwork } from "@/components/providers/NetworkProvider";

type Props = {
  children: React.ReactNode;
};

function WalletNetworkSync() {
  const { network } = useNetwork();
  const { setActiveNetwork } = useWalletNetwork();

  useEffect(() => {
    const target = network === "mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
    setActiveNetwork(target);
  }, [network, setActiveNetwork]);

  return null;
}

export default function AlgoWalletProvider({ children }: Props) {
  const manager = useMemo(
    () =>
      new WalletManager({
        wallets: [WalletId.PERA, WalletId.DEFLY],
        networks: {
          [NetworkId.TESTNET]: DEFAULT_NETWORK_CONFIG[NetworkId.TESTNET],
          [NetworkId.MAINNET]: DEFAULT_NETWORK_CONFIG[NetworkId.MAINNET],
        },
        defaultNetwork: NetworkId.TESTNET,
      }),
    []
  );

  return (
    <WalletProvider manager={manager}>
      <WalletNetworkSync />
      {children}
    </WalletProvider>
  );
}
