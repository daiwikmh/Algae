"use client";

import { usePathname } from "next/navigation";
import AppShell from "./AppShell";
import type { ReactNode } from "react";

export default function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/auth/callback") return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
