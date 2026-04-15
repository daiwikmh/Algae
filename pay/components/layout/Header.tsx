"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@txnlab/use-wallet-react";
import { getAlgodClient, USDC_ASSET_ID } from "@/lib/algorand";
import { ALGO_DECIMALS, USDC_DECIMALS } from "@/lib/constants";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNetwork } from "@/components/providers/NetworkProvider";
import Image from "next/image";
import type { Network } from "@/lib/types";

type HeaderProps = {
  onMenuToggle: () => void;
};

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { wallets, activeAddress, isReady } = useWallet();
  const { user, logout } = useAuth();
  const { network, setNetwork } = useNetwork();
  const [algoBalance, setAlgoBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeAddress) {
      setAlgoBalance(null);
      setUsdcBalance(null);
      return;
    }
    const algod = getAlgodClient(network);
    const usdcId = USDC_ASSET_ID[network];
    algod
      .accountInformation(activeAddress)
      .do()
      .then((info) => {
        setAlgoBalance((Number(info.amount) / 10 ** ALGO_DECIMALS).toFixed(3));
        const holding = (info.assets as Array<{ assetId: bigint | number; amount: bigint | number }> | undefined)?.find(
          (a) => Number(a.assetId) === usdcId
        );
        setUsdcBalance(holding ? (Number(holding.amount) / 10 ** USDC_DECIMALS).toFixed(2) : "0.00");
      })
      .catch(() => {});
  }, [activeAddress, network]);

  const activeWallet = wallets?.find((w) => w.isActive);

  function handleDisconnect() {
    activeWallet?.disconnect();
    setShowWallets(false);
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="border-b border-slate-800/80"
    >
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 lg:hidden"
            aria-label="Toggle navigation"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>

          <Image
            src="/logo.svg"
            alt="Logo"
            width={150}
            height={100}
            className=""
          />

          <div className="hidden items-center rounded-lg border border-slate-800 bg-[#212121] p-1 sm:flex">
            {(["testnet", "mainnet"] as Network[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNetwork(n)}
                className={`rounded-md px-4 py-1 text-sm capitalize transition ${
                  network === n
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-sm text-slate-300">
          <nav className="hidden items-center gap-5 md:flex">
            <a href="/docs" className="transition hover:text-white">Docs</a>
            <a href="/support" className="transition hover:text-white">Support</a>
            {user && (
              <span className="text-xs text-slate-500">{user.name ?? user.email}</span>
            )}
            {user && (
              <button
                type="button"
                onClick={logout}
                className="text-xs text-slate-400 transition hover:text-rose-400"
              >
                Logout
              </button>
            )}
          </nav>

          {activeAddress ? (
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-xs md:flex">
                <span className="text-slate-300">{algoBalance ?? "..."} ALGO</span>
                <span className="text-[#f2ad2d]">{usdcBalance ?? "..."} USDC</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWallets((v) => !v)}
                className="rounded-md border border-slate-600 bg-[#212121] px-3 py-1.5 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-400"
              >
                {truncateAddress(activeAddress)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!isReady}
              onClick={() => setShowWallets((v) => !v)}
              className="rounded-md border border-amber-100/20 bg-btn-gradient px-4 py-2 text-sm uppercase text-slate-900 disabled:opacity-50"
            >
              Connect Wallet
            </button>
          )}

          {showWallets && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowWallets(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-slate-700 bg-[#1d1f22] p-3 shadow-xl">
                {activeAddress ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="w-full rounded-md border border-red-700 px-3 py-2 text-xs uppercase text-red-400 hover:bg-red-950/30"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="pb-1 text-xs uppercase tracking-wide text-slate-400">
                      Select Wallet
                    </p>
                    {walletError && (
                      <p className="rounded-md border border-rose-800 bg-rose-950/30 px-2 py-1.5 text-xs text-rose-300">
                        {walletError}
                      </p>
                    )}
                    {wallets?.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => {
                          setWalletError(null);
                          wallet.connect()
                            .then(() => setShowWallets(false))
                            .catch((e: unknown) => {
                              const msg = e instanceof Error ? e.message : "Failed to connect";
                              setWalletError(msg);
                            });
                        }}
                        className="flex w-full items-center gap-3 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                      >
                        {wallet.metadata.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={wallet.metadata.icon}
                            alt={wallet.metadata.name}
                            className="h-5 w-5 rounded"
                          />
                        )}
                        {wallet.metadata.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
