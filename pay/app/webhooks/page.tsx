"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Webhook, WebhookDelivery, WebhookEvent } from "@/lib/types";

const ALL_EVENTS: WebhookEvent[] = ["payment_settled", "payment_failed", "pool_low"];

const eventLabel: Record<WebhookEvent, string> = {
  payment_settled: "Payment Settled",
  payment_failed: "Payment Failed",
  pool_low: "Pool Low",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<Set<WebhookEvent>>(new Set(["payment_settled"]));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Webhook[]>("/webhooks");
      setWebhooks(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load webhooks");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newEvents.size === 0) {
      setCreateError("Select at least one event");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const webhook = await api.post<Webhook>("/webhooks", {
        url: newUrl.trim(),
        events: Array.from(newEvents),
      });
      setWebhooks((prev) => [webhook, ...prev]);
      setShowCreate(false);
      setNewUrl("");
      setNewEvents(new Set(["payment_settled"]));
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(webhookId: string) {
    try {
      await api.delete(`/webhooks/${webhookId}`);
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      if (deliveriesFor === webhookId) setDeliveriesFor(null);
    } catch {
      // silent
    }
  }

  async function handleRotateSecret(webhookId: string) {
    try {
      await api.post(`/webhooks/${webhookId}/rotate-secret`, {});
    } catch {
      // silent
    }
  }

  async function toggleDeliveries(webhookId: string) {
    if (deliveriesFor === webhookId) {
      setDeliveriesFor(null);
      return;
    }
    setDeliveriesFor(webhookId);
    if (deliveries[webhookId]) return;
    setLoadingDeliveries(webhookId);
    try {
      const data = await api.get<WebhookDelivery[]>(`/webhooks/${webhookId}/deliveries`);
      setDeliveries((prev) => ({ ...prev, [webhookId]: data }));
    } catch {
      setDeliveries((prev) => ({ ...prev, [webhookId]: [] }));
    } finally {
      setLoadingDeliveries(null);
    }
  }

  async function handleRetry(deliveryId: string, webhookId: string) {
    try {
      const updated = await api.post<WebhookDelivery>(`/webhooks/deliveries/${deliveryId}/retry`, {});
      setDeliveries((prev) => ({
        ...prev,
        [webhookId]: prev[webhookId]?.map((d) => d.id === deliveryId ? updated : d) ?? [],
      }));
    } catch {
      // silent
    }
  }

  const successRate = webhooks.length === 0 ? null : null; // computed from deliveries when loaded

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-4xl text-slate-100">Webhooks</h1>
          <p className="mt-1 text-lg text-slate-400">
            Receive Real-Time Events For Payments And Pool Activity
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="flex h-10 items-center gap-2 rounded-md bg-btn-gradient px-4 text-xs uppercase text-slate-900"
        >
          <Plus className="h-4 w-4" />
          Register Webhook
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <section className="rounded-md border border-slate-700 bg-[#1d1f22] p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Endpoint URL</label>
              <input
                required
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="https://your-server.com/webhook"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Events</label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => {
                      setNewEvents((prev) => {
                        const next = new Set(prev);
                        next.has(ev) ? next.delete(ev) : next.add(ev);
                        return next;
                      });
                    }}
                    className={`rounded-md border px-3 py-1.5 text-xs uppercase transition ${
                      newEvents.has(ev)
                        ? "border-amber-400/30 bg-btn-gradient text-slate-900"
                        : "border-slate-600 text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {eventLabel[ev]}
                  </button>
                ))}
              </div>
            </div>

            {createError && <p className="text-sm text-rose-400">{createError}</p>}

            <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900 disabled:opacity-50"
              >
                {creating ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error === "auth_required" ? (
        <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center text-slate-300">
          Authentication required to view webhooks.
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-900 bg-rose-950/20 px-6 py-8 text-center text-sm text-rose-300">
          {error}
          <button type="button" onClick={fetchWebhooks} className="ml-3 underline">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md border border-slate-800 bg-[#1d1f22]" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-[#1f1f1f] px-6 py-16 text-center">
          <p className="text-slate-400">No webhooks registered.</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-3 rounded-md bg-btn-gradient px-4 py-2 text-xs uppercase text-slate-900"
          >
            Register Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-md border border-slate-800 bg-[#1d1f22]">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${wh.active ? "bg-emerald-400" : "bg-slate-500"}`} />
                    <p className="truncate font-mono text-sm text-slate-200">{wh.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev) => (
                      <span key={ev} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {eventLabel[ev]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{timeAgo(wh.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleDeliveries(wh.id)}
                    className="flex items-center gap-1 rounded-md border border-slate-600 px-3 py-1.5 text-xs uppercase text-slate-300 hover:border-slate-400"
                  >
                    Deliveries
                    {deliveriesFor === wh.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotateSecret(wh.id)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-slate-600 text-slate-300 hover:border-slate-400"
                    aria-label="Rotate secret"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(wh.id)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-red-800 text-red-400 hover:bg-red-950/30"
                    aria-label="Delete webhook"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Deliveries panel */}
              {deliveriesFor === wh.id && (
                <div className="border-t border-slate-800">
                  {loadingDeliveries === wh.id ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">Loading deliveries...</div>
                  ) : (deliveries[wh.id] ?? []).length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">No deliveries yet.</div>
                  ) : (
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-slate-800 text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Event</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">HTTP</th>
                          <th className="px-4 py-2">Retries</th>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {(deliveries[wh.id] ?? []).map((d) => (
                          <tr key={d.id} className="border-t border-slate-800/60 text-slate-300">
                            <td className="px-4 py-2">{eventLabel[d.event]}</td>
                            <td className="px-4 py-2">
                              <span className={d.success ? "text-emerald-400" : "text-rose-400"}>
                                {d.success ? "OK" : "FAILED"}
                              </span>
                            </td>
                            <td className="px-4 py-2">{d.httpStatus ?? "—"}</td>
                            <td className="px-4 py-2">{d.retries}</td>
                            <td className="px-4 py-2 text-slate-500">{timeAgo(d.createdAt)}</td>
                            <td className="px-4 py-2">
                              {!d.success && (
                                <button
                                  type="button"
                                  onClick={() => handleRetry(d.id, wh.id)}
                                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
