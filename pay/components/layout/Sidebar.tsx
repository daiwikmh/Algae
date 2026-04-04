"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "@/lib/dummy-data";

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col rounded-xl">
      <div className="space-y-4">
        {navItems.map((item, index) => {
          const active = pathname === item.href;
        //   const ItemIcon = iconByKey[item.key] ?? Circle;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm uppercase tracking-wide transition ${
                  active
                    ? "border-amber-100/30 bg-btn-gradient text-slate-900"
                    : "border-white/30 text-slate-300 hover:border-white/50 hover:text-white"
                }`}
              >
                {/* <ItemIcon
                  className={`h-5 w-5 shrink-0 ${
                    active
                      ? "text-slate-900"
                      : "text-slate-200 group-hover:text-white"
                  }`}
                  strokeWidth={1.9}
                /> */}
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800 pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-lg border border-white/40 px-4 py-3 text-sm font-medium uppercase tracking-wide text-red-500 transition hover:text-red-500/50"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
