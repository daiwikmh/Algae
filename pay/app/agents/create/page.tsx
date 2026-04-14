"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function CreateAgentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    algoAddress: "",
    dailyLimitCents: "",
    poolId: "",
    vendorWhitelistHash: "",
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
      await api.post("/agents", {
        name: form.name.trim(),
        algoAddress: form.algoAddress.trim(),
        dailyLimitCents: parseInt(form.dailyLimitCents),
        poolId: form.poolId.trim(),
        vendorWhitelistHash: form.vendorWhitelistHash.trim() || "0x0",
      });
      router.push("/agents");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Authentication required.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create agent");
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
        <h1 className="text-4xl text-slate-100">Create Agent</h1>
        <p className="mt-1 text-lg text-slate-400">Add A New Agent Authorized To Initiate Payments</p>
      </div>

      <Link href="/agents" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back To Agents
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Agent Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. Agent-04"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Wallet Address (Algorand)</label>
              <input
                required
                value={form.algoAddress}
                onChange={(e) => set("algoAddress", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="58-char Algorand address"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Daily Limit (USD cents)</label>
              <input
                required
                type="number"
                min="1"
                value={form.dailyLimitCents}
                onChange={(e) => set("dailyLimitCents", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. 500000 = $5,000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Gas Pool ID</label>
              <input
                required
                value={form.poolId}
                onChange={(e) => set("poolId", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="UUID of a funded gas pool"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Vendor Whitelist Hash (optional)</label>
              <input
                value={form.vendorWhitelistHash}
                onChange={(e) => set("vendorWhitelistHash", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. 0x1a2b3c..."
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex items-center gap-3 pt-1">
              <Link href="/agents" className="rounded-md border border-slate-500 px-4 py-2 text-xs uppercase text-slate-100">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-md border border-slate-800 bg-[#1d1f22] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">About Agents</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate-400">
            <li>Agents are authorized entities that initiate USDC payments on behalf of your platform.</li>
            <li>Each agent has a daily spending limit that resets at midnight UTC.</li>
            <li>Agents must be linked to a funded Gas Pool to process transactions.</li>
            <li>Vendor Whitelist restricts which merchants the agent can pay.</li>
          </ul>
        </aside>
      </div>
    </motion.section>
  );
}
