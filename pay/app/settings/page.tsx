"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import type { ApiKey, ApiKeyCreated } from "@/lib/types";

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", companyName: "", network: "testnet" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ApiKey[]>("/keys");
      setKeys(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("auth_required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load keys");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.delete(`/keys/${revokeTarget.id}`);
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch {
      // silent — key stays in list
    } finally {
      setRevoking(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const result = await api.post<ApiKeyCreated>("/keys/register", {
        name: createForm.name.trim(),
        companyName: createForm.companyName.trim(),
        network: createForm.network,
      });
      setNewKey(result);
      setKeys((prev) => [result, ...prev]);
      setCreateForm({ name: "", companyName: "", network: "testnet" });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative space-y-4"
    >
      <div>
        <h1 className="text-4xl text-slate-100">Settings</h1>
        <p className="mt-1 text-lg text-slate-400">Manage Your API Keys And Organization Preferences</p>
      </div>

      {/* Newly created key — show once */}
      {newKey && (
        <div className="rounded-md border border-emerald-800 bg-emerald-950/30 p-4">
          <p className="text-sm font-semibold text-emerald-300">API Key Created — Copy Now</p>
          <p className="mt-1 text-xs text-emerald-200/70">This key will not be shown again.</p>
          <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-700/40 bg-black/30 px-3 py-2">
            <code className="flex-1 break-all font-mono text-xs text-emerald-200">{newKey.key}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(newKey.key)}
              className="shrink-0 text-xs uppercase text-emerald-400 hover:text-emerald-200"
            >
              Copy
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-emerald-500 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* API Keys section */}
      <section className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">API Keys</h2>
          <button
            type="button"
            onClick={() => { setShowCreate((v) => !v); setCreateError(null); }}
            className="rounded-md bg-btn-gradient px-3 py-1.5 text-xs uppercase text-slate-900"
          >
            + Generate Key
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3 border-b border-slate-800 pb-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Name</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100 placeholder:text-slate-500"
                  placeholder="e.g. Production Key"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Company</label>
                <input
                  required
                  value={createForm.companyName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100 placeholder:text-slate-500"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Network</label>
                <select
                  value={createForm.network}
                  onChange={(e) => setCreateForm((p) => ({ ...p, network: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-sm text-slate-100"
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>
            </div>
            {createError && <p className="text-xs text-rose-400">{createError}</p>}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-slate-600 px-3 py-1.5 text-xs uppercase text-slate-300">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="rounded-md bg-btn-gradient px-3 py-1.5 text-xs uppercase text-slate-900 disabled:opacity-50">
                {creating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        )}

        {error === "auth_required" ? (
          <p className="mt-4 text-sm text-slate-400">Authentication required to view API keys.</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-400">{error}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-800" />
              ))
            ) : keys.length === 0 ? (
              <p className="text-sm text-slate-400">No API keys yet.</p>
            ) : (
              keys.map((key) => (
                <div
                  key={key.id}
                  className="grid items-center gap-3 lg:grid-cols-[1fr_200px_100px_80px]"
                >
                  <div>
                    <p className="text-2xl text-slate-100">{key.name}</p>
                    <p className="text-sm text-slate-400">{key.companyName} · {key.network}</p>
                  </div>
                  <p className="font-mono text-sm text-slate-500">{key.keyPrefix}...</p>
                  <p className="text-sm text-slate-500">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex justify-start lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(key)}
                      className="rounded-md border border-red-600 px-4 py-2 text-xs uppercase text-red-400"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
        <h2 className="border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          Account
        </h2>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">Edit your display name and avatar.</p>
          <Link href="/settings/edit-profile" className="rounded-md border border-slate-500 px-4 py-2 text-xs uppercase text-slate-100">
            Edit Profile
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-red-900 bg-red-950/25 p-4">
        <h2 className="border-b border-red-900 pb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
          Danger Zone
        </h2>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-red-300">Delete Organization</p>
            <p className="max-w-2xl text-sm text-red-200/75">
              Permanently delete your organization, all agents, pools and payment history.
            </p>
          </div>
          <button type="button" className="rounded-md border border-red-600 px-4 py-2 text-xs uppercase text-red-400">
            Delete Org.
          </button>
        </div>
      </section>

      {/* Revoke modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-md border border-red-900 bg-red-950/70 p-4 shadow-xl backdrop-blur-sm">
            <h3 className="border-b border-red-900 pb-2 text-sm font-semibold uppercase tracking-wide text-red-400">
              Revoke API Key?
            </h3>
            <div className="mt-3">
              <p className="text-3xl text-slate-100">{revokeTarget.name}</p>
              <p className="text-sm text-slate-300">{revokeTarget.companyName}</p>
            </div>
            <div className="mt-3 rounded-md border border-slate-700 bg-[#2a2d31] px-3 py-2 text-sm text-slate-500">
              {revokeTarget.keyPrefix}...
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-md border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revoking}
                className="rounded-md border border-red-600 px-4 py-2 text-xs uppercase text-red-400 disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Revoke Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
