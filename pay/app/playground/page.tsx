"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@txnlab/use-wallet-react";
import { Play, RotateCcw, ChevronDown, Terminal, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useNetwork } from "@/components/providers/NetworkProvider";

type CommandResult = {
  id: string;
  command: string;
  status: "running" | "success" | "error";
  output: unknown;
  duration: number;
};

type CommandDef = {
  id: string;
  label: string;
  description: string;
  category: string;
  fields: FieldDef[];
  run: (values: Record<string, string>) => Promise<unknown>;
};

type FieldDef = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
};

const COMMANDS: CommandDef[] = [
  {
    id: "list-agents",
    label: "List Agents",
    category: "Agents",
    description: "Fetch all agents for the authenticated user",
    fields: [],
    run: () => api.get("/agents"),
  },
  {
    id: "list-merchants",
    label: "List Merchants",
    category: "Merchants",
    description: "Fetch all registered merchants",
    fields: [],
    run: () => api.get("/merchants"),
  },
  {
    id: "list-pools",
    label: "List Gas Pools",
    category: "Gas Pools",
    description: "Fetch all gas pools",
    fields: [],
    run: () => api.get("/gas-pool"),
  },
  {
    id: "list-payments",
    label: "List Payments",
    category: "Payments",
    description: "Fetch recent payments",
    fields: [
      { key: "limit", label: "Limit", placeholder: "10" },
      { key: "offset", label: "Offset", placeholder: "0" },
    ],
    run: (v) => api.get(`/payments?limit=${v.limit || 10}&offset=${v.offset || 0}`),
  },
  {
    id: "get-payment",
    label: "Get Payment",
    category: "Payments",
    description: "Fetch a single payment by ID",
    fields: [
      { key: "paymentId", label: "Payment ID", placeholder: "uuid", required: true },
    ],
    run: (v) => api.get(`/payments/${v.paymentId}`),
  },
  {
    id: "initiate-payment",
    label: "Initiate Payment",
    category: "Payments",
    description: "Create a new pending payment",
    fields: [
      { key: "invoiceId", label: "Invoice ID", placeholder: "inv-001", required: true },
      { key: "agentId", label: "Agent ID", placeholder: "uuid", required: true },
      { key: "poolId", label: "Pool ID", placeholder: "uuid", required: true },
      { key: "merchantId", label: "Merchant Ref", placeholder: "e.g. acme-001", required: true },
      { key: "amountUsdCents", label: "Amount (USD cents)", placeholder: "100", required: true },
    ],
    run: (v) =>
      api.post("/payments", {
        invoiceId: v.invoiceId,
        agentId: v.agentId,
        poolId: v.poolId,
        merchantId: v.merchantId,
        amountUsdCents: parseInt(v.amountUsdCents),
        network: "testnet",
      }),
  },
  {
    id: "process-payment",
    label: "Process Payment",
    category: "Payments",
    description: "Submit a pending payment to Algorand",
    fields: [
      { key: "paymentId", label: "Payment ID", placeholder: "uuid", required: true },
    ],
    run: (v) => api.post(`/payments/${v.paymentId}/process`, {}),
  },
  {
    id: "get-agent",
    label: "Get Agent Status",
    category: "Agents",
    description: "Fetch live status for a single agent",
    fields: [
      { key: "agentId", label: "Agent ID", placeholder: "uuid", required: true },
    ],
    run: (v) => api.get(`/agents/${v.agentId}`),
  },
  {
    id: "list-keys",
    label: "List API Keys",
    category: "Settings",
    description: "Fetch all API keys for this account",
    fields: [],
    run: () => api.get("/keys"),
  },
  {
    id: "list-webhooks",
    label: "List Webhooks",
    category: "Webhooks",
    description: "Fetch all registered webhook endpoints",
    fields: [],
    run: () => api.get("/webhooks"),
  },
];

const CATEGORIES = Array.from(new Set(COMMANDS.map((c) => c.category)));

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function PlaygroundPage() {
  const { activeAddress, wallets } = useWallet();
  const { network } = useNetwork();
  const [selected, setSelected] = useState<CommandDef>(COMMANDS[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CommandResult[]>([]);
  const [running, setRunning] = useState(false);
  const [openCategory, setOpenCategory] = useState<string>(CATEGORIES[0]);
  const outputRef = useRef<HTMLDivElement>(null);

  function selectCommand(cmd: CommandDef) {
    setSelected(cmd);
    setValues({});
  }

  async function execute() {
    const required = selected.fields.filter((f) => f.required && !values[f.key]);
    if (required.length > 0) return;

    setRunning(true);
    const entry: CommandResult = {
      id: uid(),
      command: selected.label,
      status: "running",
      output: null,
      duration: 0,
    };
    setResults((prev) => [entry, ...prev]);

    const start = Date.now();
    try {
      const output = await selected.run(values);
      const duration = Date.now() - start;
      setResults((prev) =>
        prev.map((r) =>
          r.id === entry.id ? { ...r, status: "success", output, duration } : r
        )
      );
    } catch (err) {
      const duration = Date.now() - start;
      setResults((prev) =>
        prev.map((r) =>
          r.id === entry.id
            ? {
                ...r,
                status: "error",
                output: { error: err instanceof Error ? err.message : String(err) },
                duration,
              }
            : r
        )
      );
    } finally {
      setRunning(false);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
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
          <h1 className="text-4xl text-slate-100">Playground</h1>
          <p className="mt-1 text-lg text-slate-400">
            Execute API commands live against your account
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#1d1f22] px-3 py-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${activeAddress ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className="font-mono text-slate-300">
            {activeAddress
              ? `${activeAddress.slice(0, 8)}...${activeAddress.slice(-4)}`
              : "Wallet not connected"}
          </span>
          <span className="ml-1 text-slate-500 capitalize">{network}</span>
        </div>
      </div>

      {!activeAddress && (
        <div className="flex items-center gap-3 rounded-md border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>Connect your wallet from the header to run on-chain commands.</span>
          <button
            type="button"
            onClick={() => wallets?.[0]?.connect()}
            className="ml-auto rounded border border-amber-600 px-3 py-1 text-xs uppercase hover:bg-amber-900/30"
          >
            Connect
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Command list */}
        <aside className="space-y-1 rounded-md border border-slate-800 bg-[#1d1f22] p-2">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <button
                type="button"
                onClick={() => setOpenCategory(openCategory === cat ? "" : cat)}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-xs uppercase tracking-wide text-slate-400 hover:text-slate-200"
              >
                {cat}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${openCategory === cat ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openCategory === cat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    {COMMANDS.filter((c) => c.category === cat).map((cmd) => (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => selectCommand(cmd)}
                        className={`flex w-full items-center rounded px-3 py-2 text-left text-sm transition ${
                          selected.id === cmd.id
                            ? "bg-btn-gradient text-slate-900"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </aside>

        {/* Command panel */}
        <div className="space-y-4">
          <div className="rounded-md border border-slate-800 bg-[#1d1f22] p-4">
            <div className="mb-4">
              <p className="text-lg font-medium text-slate-100">{selected.label}</p>
              <p className="text-sm text-slate-400">{selected.description}</p>
            </div>

            {selected.fields.length > 0 && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {selected.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs text-slate-400">
                      {field.label}
                      {field.required && <span className="ml-1 text-rose-400">*</span>}
                    </label>
                    <input
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="h-10 w-full rounded border border-slate-700 bg-[#242629] px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={execute}
                disabled={running}
                className="flex items-center gap-2 rounded-md bg-btn-gradient px-4 py-2 text-sm uppercase tracking-wide text-slate-900 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {running ? "Running..." : "Run"}
              </button>
              <button
                type="button"
                onClick={() => setValues({})}
                className="flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm uppercase tracking-wide text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Output log */}
          <div ref={outputRef} className="space-y-2">
            {results.length === 0 && (
              <div className="flex h-32 items-center justify-center gap-2 rounded-md border border-slate-800 bg-[#1a1c1f] text-sm text-slate-500">
                <Terminal className="h-4 w-4" />
                Output will appear here
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md border border-slate-800 bg-[#1a1c1f] overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          r.status === "running"
                            ? "animate-pulse bg-amber-400"
                            : r.status === "success"
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-200">{r.command}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {r.status === "running" ? "..." : `${r.duration}ms`}
                    </span>
                  </div>
                  <pre className="scrollbar-hide max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
                    {r.status === "running"
                      ? "Running..."
                      : JSON.stringify(r.output, null, 2)}
                  </pre>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
