"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#151515]">
      <Header onMenuToggle={() => setMobileOpen((prev) => !prev)} />

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-[1700px] min-h-0 gap-6 px-4 py-4 md:px-6">
        <div className="hidden h-full w-[225px] flex-none lg:block">
          <Sidebar />
        </div>

        <main className="scrollbar-hide h-full min-h-0 w-full overflow-y-auto rounded-xl pr-1">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-3 top-3 z-50 h-[calc(100vh-1.5rem)] w-[84vw] max-w-[300px] lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
