"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function EditAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    dailyLimitCents: "",
    vendorWhitelistHash: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    api
      .get<Agent>(`/agents/${agentId}`)
      .then((data) => {
        setAgent(data);
        setForm({
          name: data.name,
          dailyLimitCents: String(data.dailyLimitCents),
          vendorWhitelistHash: data.vendorWhitelistHash,
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("auth_required");
        } else {
          setError(err instanceof Error ? err.message : "Agent not found");
        }
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch(`/agents/${agentId}`, {
        name: form.name.trim(),
        dailyLimitCents: parseInt(form.dailyLimitCents),
        vendorWhitelistHash: form.vendorWhitelistHash.trim(),
      });
      router.push("/agents");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-[#1d1f22]" />
        ))}
      </div>
    );
  }

  if (error === "auth_required") {
    return (
      <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center text-slate-300">
        Authentication required.
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
        {error ?? "Agent not found"}
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl text-slate-100">Edit Agent</h1>
          <p className="mt-1 text-lg text-slate-400">Modify Agent Settings And Limits</p>
        </div>
        <span className={`rounded-md px-3 py-1.5 text-xs uppercase ${
          agent.status === "active" ? "bg-[#2f3f2f] text-[#b6e0b6]"
          : agent.status === "suspended" ? "bg-rose-950/40 text-rose-300"
          : "bg-amber-950/40 text-amber-300"
        }`}>
          {agent.status.replace("_", " ")}
        </span>
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
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Wallet Address (Algorand)</label>
              <input
                readOnly
                value={agent.algoAddress}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#1a1c1f] px-3 font-mono text-xs text-slate-400"
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
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Vendor Whitelist Hash</label>
              <input
                value={form.vendorWhitelistHash}
                onChange={(e) => set("vendorWhitelistHash", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100"
              />
            </div>

            {saveError && <p className="text-sm text-rose-400">{saveError}</p>}

            <div className="flex items-center gap-3 pt-1">
              <Link href="/agents" className="rounded-md border border-slate-500 px-4 py-2 text-xs uppercase text-slate-100">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-4">
          <aside className="rounded-md border border-red-900 bg-red-950/25 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-400">Danger Zone</h2>
            <p className="mt-3 border-t border-red-900 pt-3 text-sm text-red-200/80">
              Suspending this agent stops all future payments immediately.
            </p>
            {agent.status !== "suspended" && (
              <button
                type="button"
                onClick={async () => {
                  await api.post(`/agents/${agentId}/suspend`, {});
                  router.push("/agents");
                }}
                className="mt-4 rounded-md border border-red-600 px-4 py-2 text-xs uppercase text-red-300"
              >
                Suspend Agent
              </button>
            )}
          </aside>

          <aside className="rounded-md border border-slate-700 bg-[#1d1f22] p-4">
            <h2 className="text-xl text-slate-200">Agent Info</h2>
            <div className="mt-3 space-y-2 border-t border-slate-700 pt-3 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Pool ID</span>
                <span className="font-mono text-xs text-slate-300">{agent.poolId.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Spent</span>
                <span className="text-slate-200">${(agent.dailySpentCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-slate-200">{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  );
}
