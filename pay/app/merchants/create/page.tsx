"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function CreateMerchantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    algoAddress: "",
    merchantRef: "",
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
      await api.post("/merchants", {
        name: form.name.trim(),
        algoAddress: form.algoAddress.trim(),
        merchantRef: form.merchantRef.trim(),
      });
      router.push("/merchants");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Authentication required.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create merchant");
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
        <h1 className="text-4xl text-slate-100">Register Merchant</h1>
        <p className="mt-1 text-lg text-slate-400">
          Add an Algorand address as a payment recipient
        </p>
      </div>

      <Link
        href="/merchants"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back To Merchants
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Merchant Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. Acme Store"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Merchant Ref</label>
              <input
                required
                value={form.merchantRef}
                onChange={(e) => set("merchantRef", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 font-mono text-slate-100 placeholder:text-slate-500"
                placeholder="e.g. acme-001"
                pattern="[a-zA-Z0-9_\-]+"
                title="Alphanumeric with dashes and underscores only"
              />
              <p className="mt-1 text-xs text-slate-500">
                Used as the merchantId in SDK payment calls. Alphanumeric, dashes, underscores only.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Algorand Address</label>
              <input
                required
                value={form.algoAddress}
                onChange={(e) => set("algoAddress", e.target.value)}
                className="h-12 w-full rounded-md border border-slate-700 bg-[#242629] px-3 font-mono text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="58-character Algorand address"
              />
            </div>

            {error && (
              <div className="rounded-md border border-rose-700 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-md border border-amber-100/20 bg-btn-gradient text-sm uppercase tracking-wide text-slate-900 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Merchant"}
            </button>
          </form>
        </section>

        <aside className="space-y-3 text-sm text-slate-400">
          <div className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">How it works</p>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li>The Merchant Ref is the ID you pass as <code className="text-amber-300">merchantId</code> in SDK calls.</li>
              <li>The Algorand Address is where USDC lands when a payment settles.</li>
              <li>One merchant per address — each address can only be registered once.</li>
            </ul>
          </div>
          <div className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">SDK usage</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-2 text-xs text-amber-200">{`await client.payments.initiate({
  merchantId: "acme-001",
  ...
})`}</pre>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}
