"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function CreateGasPoolPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    apiKeyId: "",
    dailyCapCents: "",
    alertThresholdUsdc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dailyCapCents = parseInt(form.dailyCapCents);
      const alertMicroUsdc = String(Math.round(parseFloat(form.alertThresholdUsdc) * 1_000_000));
      await api.post("/gas-pool", {
        apiKeyId: form.apiKeyId.trim(),
        dailyCapCents,
        alertThresholdUsdc: alertMicroUsdc,
      });
      router.push("/gas");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Authentication required.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create pool");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-4xl text-slate-100">Create Gas Pool</h1>
        <p className="mt-1 text-lg text-slate-400">
          Set Up A New Gas Sponsorship Pool For Your Agents
        </p>
      </div>

      <Link href="/gas" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back To Gas Pools
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">API Key ID</label>
              <input
                required
                value={form.apiKeyId}
                onChange={(e) => set("apiKeyId", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="UUID of an existing API key"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Daily Cap (USD cents)</label>
              <input
                required
                type="number"
                min="0"
                value={form.dailyCapCents}
                onChange={(e) => set("dailyCapCents", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. 500000 = $5,000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Alert Threshold (USDC)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.alertThresholdUsdc}
                onChange={(e) => set("alertThresholdUsdc", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. 50"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
              <Link
                href="/gas"
                className="rounded-md border border-slate-500 px-4 py-2 text-xs uppercase text-slate-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Pool"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-4">
          <aside className="rounded-md border border-slate-700 bg-[#1d1f22] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              How Gas Pools Work
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li>1. Create a pool linked to an API key</li>
              <li>2. Top up the pool with USDC via your wallet</li>
              <li>3. Assign agents to this pool</li>
              <li>4. Gas is auto-sponsored per transaction</li>
            </ol>
          </aside>

          <aside className="rounded-md border border-emerald-900 bg-emerald-950/30 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Initial Funding Required
            </h2>
            <p className="mt-3 text-sm text-emerald-100/80">
              After creation, top up this pool with USDC from your connected wallet before agents can process transactions.
            </p>
          </aside>
        </div>
      </div>
    </motion.section>
  );
}
