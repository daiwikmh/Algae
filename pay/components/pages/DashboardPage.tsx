"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { filters, invoices, quickStats, topGasCards } from "@/lib/dummy-data";

const statusClasses: Record<string, string> = {
  Settled: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  Pending: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  Failed: "bg-rose-500/20 text-rose-300 border-rose-400/30",
  Processing: "bg-blue-500/20 text-blue-300 border-blue-400/30",
};

export default function DashboardPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topGasCards.map((card) => (
          <AnimatedSection key={card.id}>
            <div className=" bg-[#212121] p-4">
              <p className="text-sm uppercase tracking-wide text-slate-400">
                {card.title}
              </p>
              <p className="mt-2 text-5xl uppercase leading-none text-slate-100">
                {card.value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[#f2ad2d]">
                {card.meta}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection>
        <div className="bg-[#212121] p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter, idx) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm uppercase tracking-wide transition ${
                    idx === 0
                      ? "bg-teal-500/20 text-teal-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-slate-400 uppercase hover:bg-slate-800 hover:text-slate-100"
              >
                Chain
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-slate-400 uppercase hover:bg-slate-800 hover:text-slate-100"
              >
                Date
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-slate-400 uppercase hover:bg-slate-800 hover:text-slate-100"
              >
                Agent
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="w-full rounded-md border border-slate-700 bg-white px-4 py-2 text-sm text-black placeholder:text-slate-500 sm:w-64"
                placeholder="Search Invoice ID"
              />
              <button
                type="button"
                className="rounded-md border border-amber-100/20 uppercase bg-btn-gradient px-4 py-2 text-sm text-slate-900"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid gap-4 xl:grid-cols-[1fr_325px]">
        <AnimatedSection>
          <div className="overflow-hidden bg-[#212121]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-btn-gradient uppercase text-slate-900">
                  <tr>
                    <th className="px-3 py-3">Invoice ID</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Chain</th>
                    <th className="px-3 py-3">Agent</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">TxID</th>
                    <th className="px-3 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-3">{invoice.id}</td>
                      <td className="px-3 py-3 font-semibold">
                        {invoice.amount}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                            statusClasses[invoice.status]
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">{invoice.chain}</td>
                      <td className="px-3 py-3">{invoice.agent}</td>
                      <td className="px-3 py-3">{invoice.time}</td>
                      <td className="px-3 py-3">{invoice.txid}</td>
                      <td className="px-3 py-3">{invoice.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-3 py-3 text-sm text-slate-400">
              <button
                type="button"
                className="rounded-md border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-slate-200"
              >
                Previous
              </button>
              <span>Page 1 of 184</span>
              <button
                type="button"
                className="rounded-md border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="rounded-lg bg-btn-gradient text-black p-2">
            <p className="text-sm uppercase tracking-wide">
              Gas Pool
            </p>
            <p className="mt-1 text-5xl tracking-tighter">420.00 USDC</p>
            <p className="text-right text-sm">≈ 24,580 ALGO</p>

            <div className="bg-black p-4 rounded-lg text-white mt-2 flex flex-col">

                <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 w-[72%] rounded-full bg-[#d4d19d]" />
                </div>

                <p className="mt-3 text-sm">
                72% remaining · ~12 days at current burn rate
                </p>

                <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-3">
                {quickStats.map((item) => (
                    <div
                    key={item.title}
                    className=""
                    >
                    <p className="text-slate-400 text-xs">{item.title}</p>
                    <p className="text-base tracking-tighter font-medium">
                        {item.value}
                    </p>
                    </div>
                ))}
                </div>

                <div className="flex justify-end">
                    <button
                    type="button"
                    className="mt-5 w-fit rounded-md border border-amber-100/20 bg-btn-gradient px-4 py-2 text-sm font-medium text-black uppercase"
                    >
                    Connect Wallet
                    </button>
                </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </motion.section>
  );
}
