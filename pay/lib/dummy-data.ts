export type NavItem = {
  label: string;
  href: string;
  key: string;
};

export type GasCard = {
  id: string;
  title: string;
  value: string;
  meta: string;
};

export type InvoiceStatus = "Settled" | "Pending" | "Failed" | "Processing";

export type Invoice = {
  id: string;
  amount: string;
  status: InvoiceStatus;
  chain: string;
  agent: string;
  time: string;
  txid: string;
  timestamp: string;
};

export const profile = {
  walletAlias: "as_live_xk29...f4m2l",
  initials: "JD",
};

export const navItems: NavItem[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "payments", label: "Payments", href: "/payments" },
  { key: "agents", label: "Agents", href: "/agents" },
  { key: "gas", label: "Gas", href: "/gas" },
  { key: "webhooks", label: "Web Hooks", href: "/webhooks" },
  { key: "apihooks", label: "Api Hooks", href: "/api-hooks" },
  { key: "settings", label: "Settings", href: "/settings" },
];

export const networkTabs = ["Testnet", "Mainnet"];

export const topGasCards: GasCard[] = [
  { id: "pool-01", title: "Gas Pool", value: "420 USDC", meta: "~8,400 TXNS · REMAINING" },
  { id: "pool-02", title: "Gas Pool", value: "420 USDC", meta: "~8,400 TXNS · REMAINING" },
  { id: "pool-03", title: "Gas Pool", value: "420 USDC", meta: "~8,400 TXNS · REMAINING" },
  { id: "pool-04", title: "Gas Pool", value: "420 USDC", meta: "~8,400 TXNS · REMAINING" },
];

export const filters = ["All", "Settled", "Pending", "Failed", "Processing"];

export const invoices: Invoice[] = [
  { id: "INV-2024-0091", amount: "$1,000.00", status: "Settled", chain: "Algorand", agent: "Agent-01", time: "4.7s", txid: "7KXP2...F84Q", timestamp: "2h ago" },
  { id: "INV-2024-0090", amount: "$250.00", status: "Pending", chain: "Ethereum", agent: "Agent-02", time: "-", txid: "Pending...", timestamp: "14m ago" },
  { id: "INV-2024-0089", amount: "$5,000.00", status: "Failed", chain: "Base", agent: "Agent-01", time: "-", txid: "-", timestamp: "1h ago" },
  { id: "INV-2024-0088", amount: "$840.00", status: "Processing", chain: "Algorand", agent: "Agent-03", time: "-", txid: "-", timestamp: "45m ago" },
  { id: "INV-2024-0087", amount: "$320.00", status: "Settled", chain: "Solana", agent: "Agent-01", time: "3.9s", txid: "X9P1...K22Z", timestamp: "3h ago" },
  { id: "INV-2024-0086", amount: "$1,200.00", status: "Settled", chain: "Algorand", agent: "Agent-02", time: "5.1s", txid: "M3QR...8HKL", timestamp: "5h ago" },
  { id: "INV-2024-0085", amount: "$75.00", status: "Failed", chain: "Ethereum", agent: "Agent-03", time: "-", txid: "-", timestamp: "6h ago" },
  { id: "INV-2024-0084", amount: "$3,400.00", status: "Settled", chain: "Algorand", agent: "Agent-01", time: "4.2s", txid: "P7YN...3GTX", timestamp: "8h ago" },
  { id: "INV-2024-0083", amount: "$500.00", status: "Pending", chain: "Base", agent: "Agent-02", time: "-", txid: "Pending...", timestamp: "9h ago" },
];

export const quickStats = [
  { title: "Burn Rate", value: "34 USDC/DAY" },
  { title: "Cost / Txn", value: "0.05 USDC" },
  { title: "Txns Today", value: "286" },
];

export const sectionMetrics = {
  payments: [
    { label: "Total Volume", value: "$193,220" },
    { label: "Settlement Rate", value: "94.2%" },
    { label: "Pending Review", value: "18" },
  ],
  agents: [
    { label: "Active Agents", value: "12" },
    { label: "Healthy Agents", value: "10" },
    { label: "Escalations", value: "3" },
  ],
  gas: [
    { label: "Current Liquidity", value: "420 USDC" },
    { label: "Projected Runway", value: "~12 Days" },
    { label: "Avg Daily Burn", value: "34 USDC" },
  ],
  webhooks: [
    { label: "Deliveries", value: "12,408" },
    { label: "Success", value: "98.8%" },
    { label: "Retries", value: "84" },
  ],
  apiHooks: [
    { label: "Requests", value: "309,011" },
    { label: "P95 Latency", value: "186ms" },
    { label: "Rate-Limited", value: "0.7%" },
  ],
  settings: [
    { label: "Connected Wallets", value: "4" },
    { label: "Roles", value: "6" },
    { label: "Active API Keys", value: "19" },
  ],
};
