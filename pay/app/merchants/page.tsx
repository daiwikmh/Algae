"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Plus, Store, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Merchant } from "@/lib/types";

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Merchant[]>("/merchants");
      setMerchants(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load merchants");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  async function handleDelete(merchantId: string) {
    setDeleting(merchantId);
    try {
      await api.delete(`/merchants/${merchantId}`);
      setMerchants((prev) => prev.filter((m) => m.id !== merchantId));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  function copyRef(ref: string) {
    navigator.clipboard.writeText(ref);
    setCopied(ref);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-slate-100">Merchants</h1>
          <p className="mt-1 text-lg text-slate-400">
            Register Algorand addresses that can receive payments
          </p>
        </div>
        <Link
          href="/merchants/create"
          className="flex items-center gap-2 rounded-md border border-amber-100/20 bg-btn-gradient px-4 py-2.5 text-sm uppercase tracking-wide text-slate-900"
        >
          <Plus className="h-4 w-4" />
          New Merchant
        </Link>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-slate-400">
          Loading...
        </div>
      )}

      {error && error !== "auth_required" && (
        <div className="rounded-md border border-rose-700 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && merchants.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-md border border-slate-800 bg-[#1d1f22] text-slate-400">
          <Store className="h-8 w-8 opacity-40" />
          <p className="text-sm">No merchants yet — register one to start accepting payments</p>
          <Link href="/merchants/create" className="text-sm text-amber-300 hover:underline">
            Register first merchant
          </Link>
        </div>
      )}

      {!loading && merchants.length > 0 && (
        <div className="overflow-hidden rounded-md border border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-[#1a1c1f] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Merchant Ref</th>
                <th className="px-4 py-3 text-left">Algo Address</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-[#1d1f22]">
              {merchants.map((m) => (
                <tr key={m.id} className="transition hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-100">{m.name}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copyRef(m.merchantRef)}
                      className="flex items-center gap-1.5 rounded bg-slate-800 px-2 py-1 font-mono text-xs text-amber-300 hover:bg-slate-700"
                    >
                      {m.merchantRef}
                      <Copy className="h-3 w-3" />
                      {copied === m.merchantRef && (
                        <span className="text-emerald-400">Copied</span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {m.algoAddress.slice(0, 10)}...{m.algoAddress.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}
