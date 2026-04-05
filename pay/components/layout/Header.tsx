"use client";

import { motion } from "framer-motion";
import { profile, networkTabs } from "@/lib/dummy-data";

type HeaderProps = {
  onMenuToggle: () => void;
};

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="border-b border-slate-800/80"
    >
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 lg:hidden"
            aria-label="Toggle navigation"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>

          <div className="space-y-1">
            <p className="text-2xl uppercase leading-none tracking-wide text-slate-100">
              ALGOSTACK.
            </p>
          </div>

          <div className="hidden items-center rounded-lg border border-slate-800 bg-[#212121] p-1 sm:flex">
            {networkTabs.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                className={`rounded-md px-4 py-1 text-sm transition ${
                  idx === 0
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-slate-300">
          <nav className="hidden items-center gap-5 md:flex">
            <a href="#" className="transition hover:text-white">
              Docs
            </a>
            <a href="#" className="transition hover:text-white">
              Support
            </a>
          </nav>
          <span className="hidden text-slate-400 lg:inline">
            {profile.walletAlias}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-900/60 font-semibold text-blue-100">
            {profile.initials}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
