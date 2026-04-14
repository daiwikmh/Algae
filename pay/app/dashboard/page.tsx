"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { api, ApiError } from "@/lib/api";
import type { Payment, GasPool } from "@/lib/types";

const statusClasses: Record<string, string> = {
  settled: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  failed: "bg-rose-500/20 text-rose-300 border-rose-400/30",
  processing: "bg-blue-500/20 text-blue-300 border-blue-400/30",
};

const STATUS_FILTERS = ["All", "settled", "pending", "processing", "failed"];

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatUsdc(micro: string): string {
  return `${(Number(micro) / 1_000_000).toFixed(2)} USDC`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pools, setPools] = useState<GasPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "9", offset: String(page * 9) });
      if (statusFilter !== "All") params.set("status", statusFilter);
      const [paymentsData, poolsData] = await Promise.allSettled([
        api.get<Payment[]>(`/payments?${params}`),
        api.get<GasPool[]>("/gas-pool"),
      ]);
      if (paymentsData.status === "fulfilled") setPayments(paymentsData.value);
      if (poolsData.status === "fulfilled") setPools(poolsData.value);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search.trim()
    ? payments.filter((p) => p.invoiceId.toLowerCase().includes(search.toLowerCase()))
    : payments;

  const settled = payments.filter((p) => p.status === "settled").length;
  const failed = payments.filter((p) => p.status === "failed").length;
  const pending = payments.filter((p) => p.status === "pending" || p.status === "processing").length;
  const totalVolumeCents = payments.reduce((s, p) => s + p.amountUsdCents, 0);

  const totalPoolBalance = pools.reduce((s, p) => s + Number(p.balanceUsdc), 0);
  const mainPool = pools[0];
  const poolPct = mainPool
    ? Math.round((Number(mainPool.balanceUsdc) / (Number(mainPool.dailyCapCents) * 100 || 1)) * 100)
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Volume", value: formatUsd(totalVolumeCents), meta: `${payments.length} PAYMENTS` },
          { title: "Settled", value: String(settled), meta: `${payments.length ? Math.round((settled / payments.length) * 100) : 0}% SUCCESS RATE` },
          { title: "Failed", value: String(failed), meta: `${payments.length ? Math.round((failed / payments.length) * 100) : 0}% FAILURE RATE` },
          { title: "Pending / Processing", value: String(pending), meta: "AWAITING CONFIRMATION" },
        ].map((card) => (
          <AnimatedSection key={card.title}>
            <div className="bg-[#212121] p-4">
              <p className="text-sm uppercase tracking-wide text-slate-400">{card.title}</p>
              <p className="mt-2 font-impact text-4xl uppercase leading-none text-slate-100">
                {loading ? "..." : card.value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[#f2ad2d]">
                {card.meta}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection>
        <div className="bg-[#212121] p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { setStatusFilter(filter); setPage(0); }}
                  className={`rounded-md px-3 py-2 text-sm uppercase tracking-wide transition ${
                    filter === statusFilter
                      ? "bg-teal-500/20 text-teal-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-white px-4 py-2 text-sm text-black placeholder:text-slate-500 sm:w-64"
              placeholder="Search Invoice ID"
            />
          </div>
        </div>
      </AnimatedSection>

      <div className="grid gap-4 xl:grid-cols-[1fr_325px]">
        <AnimatedSection>
          <div className="overflow-hidden bg-[#212121]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-btn-gradient uppercase text-slate-900">
                  <tr>
                    <th className="px-3 py-3">Invoice ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Network</th>
                    <th className="px-3 py-3">Agent</th>
                    <th className="px-3 py-3">TxID</th>
                    <th className="px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-3 py-3">
                            <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/payments/${p.invoiceId}`)}
                        className="cursor-pointer border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
                      >
                        <td className="px-3 py-3 font-mono text-xs">{p.invoiceId}</td>
                        <td className="px-3 py-3 font-semibold">{formatUsd(p.amountUsdCents)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs ${statusClasses[p.status]}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs uppercase text-slate-400">{p.network}</td>
                        <td className="px-3 py-3">{p.agent?.name ?? p.agentId.slice(0, 8)}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-400">
                          {p.algoTxnId ? `${p.algoTxnId.slice(0, 6)}...` : "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-400">{timeAgo(p.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-3 py-3 text-sm text-slate-400">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40 hover:border-slate-500 hover:text-slate-200"
              >
                Previous
              </button>
              <span>Page {page + 1}</span>
              <button
                type="button"
                disabled={payments.length < 9}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40 hover:border-slate-500 hover:text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-lg bg-btn-gradient p-2 text-black">
            <p className="text-sm uppercase tracking-wide">Gas Pool</p>
            <p className="mt-1 font-impact text-5xl tracking-tight">
              {loading ? "..." : formatUsdc(String(totalPoolBalance))}
            </p>
            {mainPool && (
              <p className="text-right text-sm">{pools.length} pool{pools.length !== 1 ? "s" : ""}</p>
            )}

            <div className="mt-2 flex flex-col rounded-lg bg-black p-4 text-white">
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-[#d4d19d] transition-all"
                  style={{ width: `${Math.min(poolPct, 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm">
                {mainPool
                  ? `${mainPool.status} · ${mainPool.agents?.length ?? 0} agents linked`
                  : "No pools configured"}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Active Pools</p>
                  <p className="font-medium">{pools.filter((p) => p.status !== "empty").length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Low / Critical</p>
                  <p className="font-medium">
                    {pools.filter((p) => p.status === "low" || p.status === "critical").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Empty</p>
                  <p className="font-medium">{pools.filter((p) => p.status === "empty").length}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </motion.section>
  );
}
