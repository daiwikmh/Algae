import type { NextConfig } from "next";

// Optional wallet provider deps not installed — stub them all out
const OPTIONAL_WALLET_DEPS = [
  "@agoralabs-sh/avm-web-provider",
  "@blockshake/defly-connect",
  "@walletconnect/modal",
  "@walletconnect/sign-client",
  "lute-connect",
  "magic-sdk",
  "@magic-ext/algorand",
];

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: Object.fromEntries(
      OPTIONAL_WALLET_DEPS.map((dep) => [dep, "./lib/empty-module.ts"])
    ),
  },
};

export default nextConfig;
