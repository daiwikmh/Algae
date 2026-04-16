"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot,
  FlaskConical,
  Fuel,
  HandCoins,
  Home,
  LogOut,
  Settings,
  Store,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const sidebarItems = [
  { key: "home", label: "Home", href: "/" },
  { key: "payments", label: "Payments", href: "/payments" },
  { key: "agents", label: "Agents", href: "/agents" },
  { key: "merchants", label: "Merchants", href: "/merchants" },
  { key: "gas", label: "Gas", href: "/gas" },
  { key: "playground", label: "Playground", href: "/playground" },
  // { key: "webhooks", label: "Web Hooks", href: "/webhooks" },
  { key: "apihooks", label: "Api Hooks", href: "/api-hooks" },
  { key: "settings", label: "Settings", href: "/settings" },
];

const iconByKey: Record<string, LucideIcon> = {
  home: Home,
  payments: HandCoins,
  agents: Bot,
  merchants: Store,
  gas: Fuel,
  playground: FlaskConical,
  webhooks: Webhook,
  apihooks: Webhook,
  settings: Settings,
};

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-full w-full flex-col bg-[#212121] lg:bg-[#151515] p-4 md:p-0 mt-16 lg:mt-0 pb-16 lg:pb-0 rounded-xl">
      <div className="space-y-4">
        {sidebarItems.map((item, index) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const ItemIcon = iconByKey[item.key] ?? Home;

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
                <ItemIcon
                  className={`h-5 w-5 shrink-0 ${
                    active
                      ? "text-slate-900"
                      : "text-slate-200 group-hover:text-white"
                  }`}
                  strokeWidth={1.9}
                />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-4 rounded-lg border border-white/40 px-4 py-3 text-sm font-medium uppercase tracking-wide text-red-500 transition hover:text-red-500/50"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.9} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
