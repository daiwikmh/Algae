"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Funnel, SlidersHorizontal, Plus, X, CheckCircle2, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Payment, PaymentStatus, Agent, GasPool, Merchant } from "@/lib/types";

const paymentProcessSteps = ["INITIATE", "VALIDATE", "PROCESS", "SETTLE", "WEBHOOK"] as const;
const STATUS_FILTERS = ["All", "settled", "pending", "processing", "failed"] as const;

const statusClasses: Record<string, string> = {
  settled: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  pending: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  failed: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  processing: "bg-blue-500/20 text-blue-200 border-blue-400/30",
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

function genInvoiceId(): string {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type NewPaymentStep = "form" | "processing" | "done" | "error";

interface NewPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewPaymentModal({ onClose, onSuccess }: NewPaymentModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pools, setPools] = useState<GasPool[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [step, setStep] = useState<NewPaymentStep>("form");
  const [txnId, setTxnId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    invoiceId: genInvoiceId(),
    agentId: "",
    poolId: "",
    merchantId: "",
    amountUsd: "",
    network: "testnet" as "mainnet" | "testnet",
  });

  useEffect(() => {
    Promise.all([
      api.get<Agent[]>("/agents"),
      api.get<GasPool[]>("/gas-pool"),
      api.get<Merchant[]>("/merchants"),
    ])
      .then(([a, p, m]) => {
        setAgents(a);
        setPools(p);
        setMerchants(m);
        if (a[0]) setForm((f) => ({ ...f, agentId: a[0].id, poolId: a[0].poolId }));
        if (m[0]) setForm((f) => ({ ...f, merchantId: m[0].merchantRef }));
      })
      .catch(() => {})
      .finally(() => setLoadingDeps(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(form.amountUsd) * 100);
    if (!amountCents || amountCents < 1) return;

    setStep("processing");
    setErrorMsg(null);

    try {
      const payment = await api.post<Payment>("/payments", {
        invoiceId: form.invoiceId,
        agentId: form.agentId,
        poolId: form.poolId,
        merchantId: form.merchantId,
        amountUsdCents: amountCents,
        network: form.network,
      });

      const settled = await api.post<Payment>(`/payments/${payment.id}/process`, {});
      setTxnId(settled.algoTxnId);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg rounded-md border border-slate-700 bg-[#1d1f22] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg text-slate-100">New Payment</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {loadingDeps ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Invoice ID</label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={form.invoiceId}
                        onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
                        className="h-10 flex-1 rounded-md border border-slate-700 bg-[#242629] px-3 font-mono text-sm text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, invoiceId: genInvoiceId() }))}
                        className="rounded-md border border-slate-600 px-3 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Agent</label>
                      <select
                        required
                        value={form.agentId}
                        onChange={(e) => {
                          const agent = agents.find((a) => a.id === e.target.value);
                          setForm((f) => ({ ...f, agentId: e.target.value, poolId: agent?.poolId ?? f.poolId }));
                        }}
                        className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100"
                      >
                        <option value="">Select agent</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Gas Pool</label>
                      <select
                        required
                        value={form.poolId}
                        onChange={(e) => setForm((f) => ({ ...f, poolId: e.target.value }))}
                        className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100"
                      >
                        <option value="">Select pool</option>
                        {pools.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.apiKey?.name ?? p.id.slice(0, 8)} ({p.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Merchant</label>
                    <select
                      required
                      value={form.merchantId}
                      onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100"
                    >
                      <option value="">Select merchant</option>
                      {merchants.map((m) => (
                        <option key={m.id} value={m.merchantRef}>{m.name} ({m.merchantRef})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Amount (USD)</label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.amountUsd}
                        onChange={(e) => setForm((f) => ({ ...f, amountUsd: e.target.value }))}
                        placeholder="0.00"
                        className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100 placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Network</label>
                      <select
                        value={form.network}
                        onChange={(e) => setForm((f) => ({ ...f, network: e.target.value as "mainnet" | "testnet" }))}
                        className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100"
                      >
                        <option value="testnet">Testnet</option>
                        <option value="mainnet">Mainnet</option>
                      </select>
                    </div>
                  </div>

                  {agents.length === 0 || merchants.length === 0 || pools.length === 0 ? (
                    <p className="rounded-md border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                      You need at least one agent, gas pool, and merchant before initiating a payment.
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={agents.length === 0 || merchants.length === 0 || pools.length === 0}
                    className="h-11 w-full rounded-md border border-amber-100/20 bg-btn-gradient text-sm uppercase tracking-wide text-slate-900 disabled:opacity-40"
                  >
                    Initiate and Settle Payment
                  </button>
                </>
              )}
            </form>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-slate-300">Processing payment on Algorand...</p>
              <p className="text-xs text-slate-500">Submitting transaction and waiting for confirmation</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-lg text-slate-100">Payment Settled</p>
              {txnId && (
                <p className="break-all font-mono text-xs text-slate-400">{txnId}</p>
              )}
              <div className="flex gap-3">
                {txnId && (
                  <a
                    href={`https://${form.network === "mainnet" ? "" : "testnet."}algoexplorer.io/tx/${txnId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-600 px-4 py-2 text-xs text-slate-300 hover:border-slate-400"
                  >
                    View on Explorer
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { onSuccess(); onClose(); }}
                  className="rounded-md border border-amber-100/20 bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4 py-4">
              <div className="rounded-md border border-rose-800 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                {errorMsg}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="rounded-md border border-slate-600 px-4 py-2 text-xs text-slate-300 hover:border-slate-400"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-700 px-4 py-2 text-xs text-slate-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const LIMIT = 20;

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
      });
      if (statusFilter !== "All") params.set("status", statusFilter as PaymentStatus);
      const data = await api.get<Payment[]>(`/payments?${params}`);
      setPayments(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load payments");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = search.trim()
    ? payments.filter((p) =>
        p.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
        p.algoTxnId?.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  return (
    <>
      <AnimatePresence>
        {showNewPayment && (
          <NewPaymentModal
            onClose={() => setShowNewPayment(false)}
            onSuccess={fetchPayments}
          />
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl text-slate-100">Payments</h1>
            <p className="mt-1 text-lg text-slate-400">
              Initiate And Process USDC Payments With Gas Sponsorship
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewPayment(true)}
            className="flex items-center gap-2 rounded-md border border-amber-100/20 bg-btn-gradient px-4 py-2.5 text-sm uppercase tracking-wide text-slate-900"
          >
            <Plus className="h-4 w-4" />
            New Payment
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {paymentProcessSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-md bg-[#202225] px-4 py-2 text-xs uppercase tracking-wide text-slate-300">
                {step}
              </div>
              {index < paymentProcessSteps.length - 1 && (
                <span className="text-xl text-slate-400">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-700 bg-white px-4 text-sm text-black placeholder:text-slate-500 sm:w-72"
              placeholder="Search invoice ID or txn hash"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen((v) => !v)}
              className="grid h-10 w-11 place-items-center rounded-md border border-slate-500 text-slate-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          {isFilterOpen && (
            <aside className="absolute right-0 top-2 z-10 w-44 rounded-md bg-[#242629] p-3">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase text-slate-300">
                <Funnel className="h-3.5 w-3.5" />
                <span>Status</span>
              </div>
              <div className="space-y-1">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setPage(0); setIsFilterOpen(false); }}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-xs uppercase transition ${
                      statusFilter === s
                        ? "bg-btn-gradient text-slate-900"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {error === "auth_required" ? (
            <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center">
              <p className="text-slate-300">Authentication required to view payments.</p>
            </div>
          ) : error ? (
            <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
              {error}
              <button type="button" onClick={fetchPayments} className="ml-3 underline">
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-800 bg-[#1f1f1f]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-btn-gradient text-sm uppercase tracking-wide text-[#111111]">
                    <tr>
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Network</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Txn ID</th>
                      <th className="px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-t border-slate-800">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          No payments found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => router.push(`/payments/${p.invoiceId}`)}
                          className="cursor-pointer border-t border-slate-800 text-slate-200 hover:bg-white/5"
                        >
                          <td className="px-4 py-3 font-mono text-xs">{p.invoiceId}</td>
                          <td className="px-4 py-3 font-medium">{formatUsd(p.amountUsdCents)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClasses[p.status]}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 uppercase text-xs text-slate-400">{p.network}</td>
                          <td className="px-4 py-3 text-slate-300">{p.agent?.name ?? p.agentId.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {p.algoTxnId ? `${p.algoTxnId.slice(0, 8)}...` : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{timeAgo(p.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40 hover:text-slate-200"
                >
                  Previous
                </button>
                <span>Page {page + 1}</span>
                <button
                  type="button"
                  disabled={payments.length < LIMIT}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40 hover:text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}
