import type { Metadata } from "next";
import ConditionalShell from "@/components/layout/ConditionalShell";
import AuthProvider from "@/components/providers/AuthProvider";
import WalletProvider from "@/components/providers/WalletProvider";
import NetworkProvider from "@/components/providers/NetworkProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Algopay Dashboard",
  description: "Operational dashboard for payments, gas pools, and agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#212121] text-slate-100 font-inter">
        <NetworkProvider>
          <WalletProvider>
            <AuthProvider>
              <ConditionalShell>{children}</ConditionalShell>
            </AuthProvider>
          </WalletProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
