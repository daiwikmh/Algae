"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldAlert, XCircle, Clock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Payment, TimelineEvent } from "@/lib/types";

const statusStyles: Record<string, string> = {
  settled: "bg-[#2d3d2c] text-[#c8e9bf]",
  failed: "bg-[#3d2626] text-[#f0a1a1]",
  processing: "bg-[#3f2f1f] text-[#f2b27a]",
  pending: "bg-[#2a2d3a] text-[#a0b4d4]",
};

const FLOW_STEPS = ["INITIATED", "PROCESSING", "SETTLED", "WEBHOOK SENT"] as const;

function flowStepFromStatus(status: string): string {
  if (status === "settled") return "SETTLED";
  if (status === "processing") return "PROCESSING";
  if (status === "failed") return "FAILED";
  return "INITIATED";
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function TimelineIcon({ status }: { status: TimelineEvent["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-lime-400" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-rose-400" />;
  return <Clock className="h-4 w-4 text-amber-400" />;
}

export default function PaymentDetailsPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    api
      .get<Payment>(`/payments/invoice/${invoiceId}`)
      .then(setPayment)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("auth_required");
        } else {
          setError(err instanceof Error ? err.message : "Payment not found");
        }
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  function copyTxId() {
    if (!payment?.algoTxnId) return;
    navigator.clipboard.writeText(payment.algoTxnId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-md border border-slate-800 bg-[#1d1f22]" />
        ))}
      </div>
    );
  }

  if (error === "auth_required") {
    return (
      <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center text-slate-300">
        Authentication required to view payment details.
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
        {error ?? "Payment not found"}
      </div>
    );
  }

  const currentFlowStep = flowStepFromStatus(payment.status);
  const timeline = (payment.timeline ?? []) as TimelineEvent[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-4xl text-slate-100">Payment Details</h1>
            <span className={`rounded-md px-3 py-1 text-xs uppercase ${statusStyles[payment.status]}`}>
              {payment.status}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm text-slate-400">
            {payment.invoiceId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!payment.algoTxnId}
            onClick={copyTxId}
            className="h-10 rounded-md border border-slate-500 px-4 text-xs uppercase text-slate-100 disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy Tx ID"}
          </button>
          {payment.algoTxnId && (
            <a
              href={`https://${payment.network === "mainnet" ? "" : "testnet."}algoexplorer.io/tx/${payment.algoTxnId}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center rounded-md border border-slate-500 px-4 text-xs uppercase text-slate-100"
            >
              View on Explorer
            </a>
          )}
          {payment.status === "failed" && (
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-md bg-btn-gradient px-4 text-xs uppercase text-slate-900"
            >
              <ShieldAlert className="h-4 w-4" />
              Retry Payment
            </button>
          )}
        </div>
      </div>

      {/* Flow stepper */}
      <div className="flex flex-wrap items-center gap-3">
        {FLOW_STEPS.map((step, index) => {
          const isCurrent = step === currentFlowStep;
          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`rounded-md px-4 py-2 text-xs uppercase ${
                  isCurrent ? "bg-[#2f332e] text-[#d5e4ce]" : "bg-[#232528] text-slate-400"
                }`}
              >
                {step}
              </div>
              {index < FLOW_STEPS.length - 1 && (
                <span className="text-xl text-slate-400">→</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-slate-800 bg-[#1d1f22]">
          <div className="border-b border-slate-800 bg-white/4 px-4 py-3 text-lg text-slate-100">
            Transaction Details
          </div>
          <div className="space-y-3 px-4 py-5 text-sm">
            {[
              { label: "INVOICE ID", value: payment.invoiceId },
              { label: "AGENT", value: payment.agent?.name ?? payment.agentId },
              { label: "POOL ID", value: payment.poolId },
              { label: "MERCHANT ID", value: payment.merchantId ?? "—" },
              { label: "NETWORK", value: payment.network.toUpperCase() },
              { label: "AMOUNT", value: formatUsd(payment.amountUsdCents) },
              { label: "AMOUNT USDC", value: payment.amountUsdc ? `${(Number(payment.amountUsdc) / 1_000_000).toFixed(6)} USDC` : "—" },
              { label: "CREATED AT", value: formatTs(payment.createdAt) },
              {
                label: "GAS SPONSORED",
                value: (
                  <span className="flex items-center gap-2 text-[#d5efcd]">
                    <CheckCircle2 className="h-4 w-4 text-lime-400" />
                    {payment.gasSponsored ? "Yes" : "No"}
                  </span>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[180px_1fr] text-slate-400">
                <span>{label}</span>
                <span className="text-slate-200 break-all">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-800 bg-[#1d1f22]">
          <div className="border-b border-slate-800 bg-white/4 px-4 py-3 text-lg text-slate-100">
            Blockchain Info
          </div>
          <div className="space-y-3 px-4 py-5 text-sm">
            {[
              { label: "TRANSACTION ID", value: payment.algoTxnId ?? "—" },
              { label: "BLOCK ROUND", value: payment.blockRound != null ? String(payment.blockRound) : "—" },
              { label: "CONFIRMED AT", value: formatTs(payment.confirmedAt) },
              { label: "GAS FEE", value: payment.gasFeeAlgo ? `${payment.gasFeeAlgo} μALGO` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[180px_1fr] text-slate-400">
                <span>{label}</span>
                <span className="break-all font-mono text-xs text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Timeline */}
      <section className="rounded-md border border-slate-800 bg-[#1d1f22]">
        <div className="border-b border-slate-800 bg-white/4 px-4 py-3 text-lg text-slate-100">
          Timeline
        </div>
        {timeline.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No timeline events.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
                <TimelineIcon status={event.status} />
                <div>
                  <p className="text-slate-200">{event.step}</p>
                  {event.detail && <p className="mt-0.5 font-mono text-xs text-slate-400">{event.detail}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.section>
  );
}
