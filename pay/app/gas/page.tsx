"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Fuel, Pencil, X, ArrowUpCircle } from "lucide-react";
import algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet-react";
import { api, ApiError } from "@/lib/api";
import { getAlgodClient, USDC_ASSET_ID } from "@/lib/algorand";
import { PAYMENT_PROCESSOR_ADDRESS } from "@/lib/constants";
import { useNetwork } from "@/components/providers/NetworkProvider";
import type { GasPool } from "@/lib/types";

const statusClasses: Record<string, string> = {
  healthy: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  low: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  critical: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  empty: "bg-slate-600/30 text-slate-300 border-slate-600/30",
};

function formatUsdc(microUsdc: string): string {
  return `${(Number(microUsdc) / 1_000_000).toFixed(2)} USDC`;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function GasPage() {
  const { activeAddress, transactionSigner } = useWallet();
  const { network } = useNetwork();
  const [pools, setPools] = useState<GasPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUpPool, setTopUpPool] = useState<GasPool | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<GasPool[]>("/gas-pool");
      setPools(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pools");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const totalBalance = pools.reduce((sum, p) => sum + Number(p.balanceUsdc), 0);
  const activePools = pools.filter((p) => p.status !== "empty").length;
  const lowPools = pools.filter((p) => p.status === "low" || p.status === "critical" || p.status === "empty").length;
  const dailyBurn = pools.reduce((sum, p) => sum + p.dailyCapCents, 0);

  async function handleTopUp() {
    if (!topUpPool || !activeAddress || !topUpAmount) return;
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      setTopUpError("Enter a valid USDC amount");
      return;
    }
    setTopUpLoading(true);
    setTopUpError(null);
    try {
      const algod = getAlgodClient(network);
      const suggestedParams = await algod.getTransactionParams().do();
      const microUsdc = BigInt(Math.round(amount * 1_000_000));
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: PAYMENT_PROCESSOR_ADDRESS,
        assetIndex: USDC_ASSET_ID[network],
        amount: microUsdc,
        suggestedParams,
      });
      const txId = txn.txID();
      const signed = await transactionSigner([txn], [0]);
      await algod.sendRawTransaction(signed).do();
      await algosdk.waitForConfirmation(algod, txId, 4);
      await api.post(`/gas-pool/${topUpPool.apiKeyId}/topup`, {
        amountUsdc: microUsdc.toString(),
        txnId: txId,
      });
      setTopUpSuccess(true);
      await fetchPools();
      setTimeout(() => {
        setTopUpPool(null);
        setTopUpAmount("");
        setTopUpSuccess(false);
      }, 2000);
    } catch (err) {
      setTopUpError(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setTopUpLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative space-y-4"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-4xl text-slate-100">Gas Pools</h1>
          </div>
          <div className="h-1 max-w-[520px] rounded-full bg-btn-gradient" />
          <p className="text-xl text-slate-400">
            Manage Gas Sponsorship Pools Powering Agent Payments
          </p>
        </div>
        <Link
          href="/gas/create"
          className="h-10 rounded-md bg-btn-gradient px-4 py-3 text-xs uppercase text-slate-900"
        >
          + Create Pool
        </Link>
      </div>

      <div className="grid gap-2 lg:grid-cols-4">
        {[
          { label: "TOTAL BALANCE", value: loading ? "..." : formatUsdc(String(totalBalance)) },
          { label: "ACTIVE POOLS", value: loading ? "..." : String(activePools) },
          { label: "LOW / CRITICAL", value: loading ? "..." : String(lowPools) },
          { label: "DAILY CAP", value: loading ? "..." : formatUsd(dailyBurn) },
        ].map((card) => (
          <article key={card.label} className="bg-[#202225] p-4">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-1 font-impact text-4xl tracking-tight text-slate-100">{card.value}</p>
          </article>
        ))}
      </div>

      {error === "auth_required" ? (
        <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center text-slate-300">
          Authentication required to view gas pools.
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
          {error}
          <button type="button" onClick={fetchPools} className="ml-3 underline">Retry</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-[#1f1f1f]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-btn-gradient text-sm uppercase tracking-wide text-[#111111]">
                <tr>
                  <th className="px-4 py-3">Pool / API Key</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Daily Cap</th>
                  <th className="px-4 py-3">Alert Threshold</th>
                  <th className="px-4 py-3">Agents</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Fuel className="mx-auto h-8 w-8 text-slate-500" />
                      <p className="mt-3 text-slate-400">No gas pools yet.</p>
                      <Link href="/gas/create" className="mt-3 inline-block rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900">
                        Create Your First Pool
                      </Link>
                    </td>
                  </tr>
                ) : (
                  pools.map((pool) => (
                    <tr key={pool.id} className="border-t border-slate-800 text-slate-200 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-medium">{pool.apiKey?.name ?? "—"}</p>
                        <p className="font-mono text-xs text-slate-500">{pool.apiKey?.keyPrefix}...</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatUsdc(pool.balanceUsdc)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusClasses[pool.status]}`}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatUsd(pool.dailyCapCents)}</td>
                      <td className="px-4 py-3">{formatUsdc(pool.alertThresholdUsdc)}</td>
                      <td className="px-4 py-3">{pool.agents?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => { setTopUpPool(pool); setTopUpError(null); setTopUpAmount(""); }}
                            className="text-slate-200 hover:text-white"
                            aria-label="Top up pool"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </button>
                          <button type="button" className="text-slate-200 hover:text-white" aria-label="Edit pool">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top-up modal */}
      {topUpPool && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-md border border-slate-700 bg-[#1d1f22] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg text-slate-100">Top Up Pool</h3>
              <button type="button" onClick={() => setTopUpPool(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-1 text-sm text-slate-400">Pool: <span className="text-slate-200">{topUpPool.apiKey?.name ?? topUpPool.id}</span></p>
            <p className="mb-4 text-sm text-slate-400">Current: <span className="text-slate-200">{formatUsdc(topUpPool.balanceUsdc)}</span></p>

            {!activeAddress ? (
              <p className="rounded-md border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
                Connect your wallet in the header to top up.
              </p>
            ) : topUpSuccess ? (
              <p className="rounded-md border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                Top-up confirmed on-chain.
              </p>
            ) : (
              <>
                <label className="mb-1 block text-sm text-slate-300">USDC Amount</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                  placeholder="e.g. 100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Sends USDC from your wallet to the payment processor on Algorand {network}.
                </p>
                {topUpError && (
                  <p className="mt-2 text-xs text-rose-400">{topUpError}</p>
                )}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTopUpPool(null)}
                    className="rounded-md border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTopUp}
                    disabled={topUpLoading || !topUpAmount}
                    className="rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900 disabled:opacity-50"
                  >
                    {topUpLoading ? "Signing..." : "Sign & Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
