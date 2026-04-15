"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Network } from "@/lib/types";

interface NetworkContextValue {
  network: Network;
  setNetwork: (n: Network) => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  network: "testnet",
  setNetwork: () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

export default function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<Network>("testnet");

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}
