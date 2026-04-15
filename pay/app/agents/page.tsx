"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Ban, Bot, Pencil } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Agent } from "@/lib/types";

const statusClasses: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  limit_reached: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  suspended: "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const LIMIT = 20;

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [suspending, setSuspending] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Agent[]>(
        `/agents?limit=${LIMIT}&offset=${page * LIMIT}`
      );
      setAgents(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load agents");
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function handleSuspend(agentId: string) {
    setSuspending(agentId);
    try {
      await api.post(`/agents/${agentId}/suspend`, {});
      setAgents((prev) =>
        prev.map((a) => a.id === agentId ? { ...a, status: "suspended" } : a)
      );
    } catch {
      // silent — agent stays in current state
    } finally {
      setSuspending(null);
    }
  }

  const activeCount = agents.filter((a) => a.status === "active").length;
  const suspendedCount = agents.filter((a) => a.status === "suspended").length;
  const limitReached = agents.filter((a) => a.status === "limit_reached").length;
  const totalDailyLimit = agents.reduce((s, a) => s + a.dailyLimitCents, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-4xl text-slate-100">Agents</h1>
          <p className="mt-1 text-lg text-slate-400">
            Manage Entities Authorized To Initiate Payments
          </p>
        </div>
        <Link
          href="/agents/create"
          className="h-10 rounded-md bg-btn-gradient px-4 py-3 text-xs uppercase text-slate-900"
        >
          + Create Agent
        </Link>
      </div>

      <div className="grid gap-2 lg:grid-cols-4">
        {[
          { label: "TOTAL AGENTS", value: loading ? "..." : String(agents.length) },
          { label: "ACTIVE", value: loading ? "..." : String(activeCount) },
          { label: "SUSPENDED", value: loading ? "..." : String(suspendedCount) },
          { label: "DAILY LIMIT TOTAL", value: loading ? "..." : formatUsd(totalDailyLimit) },
        ].map((card) => (
          <article key={card.label} className="bg-[#202225] p-4">
            <p className="text-sm uppercase text-slate-400">{card.label}</p>
            <p className="mt-1 font-impact text-4xl tracking-tight text-slate-100">{card.value}</p>
          </article>
        ))}
      </div>

      {error === "auth_required" ? (
        <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center text-slate-300">
          Authentication required to view agents.
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
          {error}
          <button type="button" onClick={fetchAgents} className="ml-3 underline">Retry</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-[#1f1f1f]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-btn-gradient text-sm uppercase tracking-wide text-[#111111]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Algo Address</th>
                  <th className="px-4 py-3">Daily Limit</th>
                  <th className="px-4 py-3">Daily Spent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16">
                      <div className="mx-auto max-w-md text-center">
                        <Bot className="mx-auto h-10 w-10 text-slate-500" />
                        <h2 className="mt-4 text-4xl text-slate-100">No agents yet</h2>
                        <p className="mt-2 text-slate-400">
                          Create your first agent to start processing payments.
                        </p>
                        <Link
                          href="/agents/create"
                          className="mt-5 inline-block rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900"
                        >
                          + Create Your First Agent
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} className="border-t border-slate-800 text-slate-200 hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{agent.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {agent.algoAddress.slice(0, 8)}...{agent.algoAddress.slice(-4)}
                      </td>
                      <td className="px-4 py-3">{formatUsd(agent.dailyLimitCents)}</td>
                      <td className="px-4 py-3">{formatUsd(agent.dailySpentCents)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClasses[agent.status]}`}>
                          {agent.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/agents/${agent.id}/edit`} className="text-slate-200 hover:text-white" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {agent.status !== "suspended" && (
                            <button
                              type="button"
                              onClick={() => handleSuspend(agent.id)}
                              disabled={suspending === agent.id}
                              className="text-slate-200 hover:text-rose-400 disabled:opacity-40"
                              aria-label="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
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
            <span>Page {page + 1}{limitReached > 0 && ` · ${limitReached} at limit`}</span>
            <button
              type="button"
              disabled={agents.length < LIMIT}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40 hover:text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
