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

export type PaymentFlowStep =
  | "INITIATE"
  | "VALIDATE"
  | "PROCESS"
  | "SETTLE"
  | "WEBHOOK";

export type PaymentListRow = {
  id: string;
  dailyLimit: string;
  status: InvoiceStatus;
  dailyUsed: string;
  lastActivity: string;
  actionTime: string;
};

export type PaymentDetails = {
  id: string;
  badgeStatuses: InvoiceStatus[];
  flow: Array<"INITIATED" | "PROCESSING" | "SETTLED" | "WEBHOOK SENT">;
  currentFlow: "INITIATED" | "PROCESSING" | "SETTLED" | "WEBHOOK SENT";
  transactionDetails: {
    agentId: string;
    poolId: string;
    chain: string;
    amount: string;
    timestamp: string;
    gasSponsored: boolean;
  };
  blockchainInfo: {
    transactionHash: string;
    blockNumberRound: string;
    confirmationTime: string;
  };
  logs: {
    paymentInitiated: string;
    processingStarted: string;
    confirmed: string;
    webhookTriggered: string;
  };
};

export const profile = {
  walletAlias: "as_live_xk29...f4m2l",
  initials: "JD",
};

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

export const paymentProcessSteps: PaymentFlowStep[] = [
  "INITIATE",
  "VALIDATE",
  "PROCESS",
  "SETTLE",
  "WEBHOOK",
];

export const paymentListRows: PaymentListRow[] = [
  {
    id: "INV-2024-0091",
    dailyLimit: "$1,000.00",
    status: "Settled",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
    actionTime: "4.7s",
  },
  {
    id: "INV-2024-0090",
    dailyLimit: "$250.00",
    status: "Pending",
    dailyUsed: "Ethereum",
    lastActivity: "Agent-02",
    actionTime: "-",
  },
  {
    id: "INV-2024-0089",
    dailyLimit: "$5,000.00",
    status: "Failed",
    dailyUsed: "Base",
    lastActivity: "Agent-01",
    actionTime: "-",
  },
  {
    id: "INV-2024-0088",
    dailyLimit: "$840.00",
    status: "Processing",
    dailyUsed: "Algorand",
    lastActivity: "Agent-03",
    actionTime: "-",
  },
  {
    id: "INV-2024-0087",
    dailyLimit: "$320.00",
    status: "Settled",
    dailyUsed: "Solana",
    lastActivity: "Agent-01",
    actionTime: "3.9s",
  },
  {
    id: "INV-2024-0084",
    dailyLimit: "$3,400.00",
    status: "Settled",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
    actionTime: "4.2s",
  },
  {
    id: "INV-2024-0083",
    dailyLimit: "$500.00",
    status: "Pending",
    dailyUsed: "Base",
    lastActivity: "Agent-02",
    actionTime: "-",
  },
];

export const paymentDetailById: Record<string, PaymentDetails> = {
  "INV-2024-0091": {
    id: "INV-2024-0091",
    badgeStatuses: ["Settled", "Failed", "Processing"],
    flow: ["INITIATED", "PROCESSING", "SETTLED", "WEBHOOK SENT"],
    currentFlow: "SETTLED",
    transactionDetails: {
      agentId: "-",
      poolId: "-",
      chain: "-",
      amount: "-",
      timestamp: "-",
      gasSponsored: true,
    },
    blockchainInfo: {
      transactionHash: "-",
      blockNumberRound: "-",
      confirmationTime: "-",
    },
    logs: {
      paymentInitiated: "-",
      processingStarted: "-",
      confirmed: "-",
      webhookTriggered: "-",
    },
  },
};

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

export type AgentStatus = "Settled" | "Pending" | "Failed" | "Processing" | "Completed";

export type AgentRow = {
  id: string;
  dailyLimit: string;
  status: AgentStatus;
  dailyUsed: string;
  lastActivity: string;
};

export type AgentFormData = {
  name: string;
  walletAddress: string;
  dailyLimitCents: string;
  poolAssignment: string;
  vendorWhitelistHash: string;
  state: "ACTIVE" | "SUSPENDED";
};

export const showAgentsEmptyState = false;

export const agentRows: AgentRow[] = [
  {
    id: "INV-2024-0091",
    dailyLimit: "$1,000.00",
    status: "Settled",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
  },
  {
    id: "INV-2024-0091",
    dailyLimit: "$1,000.00",
    status: "Pending",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
  },
  {
    id: "INV-2024-0091",
    dailyLimit: "$1,000.00",
    status: "Failed",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
  },
  {
    id: "INV-2024-0091",
    dailyLimit: "$1,000.00",
    status: "Processing",
    dailyUsed: "Algorand",
    lastActivity: "Agent-01",
  },
  {
    id: "INV-2024-0092",
    dailyLimit: "$2,500.00",
    status: "Completed",
    dailyUsed: "Ethereum",
    lastActivity: "Agent-02",
  },
  {
    id: "INV-2024-0093",
    dailyLimit: "$750.00",
    status: "Pending",
    dailyUsed: "Bitcoin",
    lastActivity: "Agent-03",
  },
  {
    id: "INV-2024-0094",
    dailyLimit: "$1,250.00",
    status: "Failed",
    dailyUsed: "Ripple",
    lastActivity: "Agent-04",
  },
];

export const agentsHeaderStatuses: AgentStatus[] = ["Settled", "Failed", "Processing"];

export const agentsOverviewCards = [
  { label: "TOTAL AGENTS", value: "420 USDC" },
  { label: "ACTIVE AGENTS", value: "420 USDC" },
  { label: "SUSPENDED AGENTS", value: "420 USDC" },
  { label: "TOTAL DAILY LIMIT USED", value: "420 USDC" },
];

export const agentById: Record<string, AgentFormData> = {
  "INV-2024-0091": {
    name: "Agent-04",
    walletAddress: "ABCDEF123...XYZ",
    dailyLimitCents: "500000",
    poolAssignment: "Pool-Beta",
    vendorWhitelistHash: "0x1a2b3c...",
    state: "ACTIVE",
  },
  "INV-2024-0092": {
    name: "Agent-02",
    walletAddress: "ABCDEF222...XYZ",
    dailyLimitCents: "250000",
    poolAssignment: "Pool-Gamma",
    vendorWhitelistHash: "0x2a3b4c...",
    state: "ACTIVE",
  },
  "INV-2024-0093": {
    name: "Agent-03",
    walletAddress: "ABCDEF333...XYZ",
    dailyLimitCents: "75000",
    poolAssignment: "Pool-Delta",
    vendorWhitelistHash: "0x3a4b5c...",
    state: "ACTIVE",
  },
  "INV-2024-0094": {
    name: "Agent-04",
    walletAddress: "ABCDEF444...XYZ",
    dailyLimitCents: "125000",
    poolAssignment: "Pool-Epsilon",
    vendorWhitelistHash: "0x4a5b6c...",
    state: "SUSPENDED",
  },
};

export const editAgentRecentChanges = [
  { title: "Daily limit updated: $500 -> $1,000", meta: "Admin - 2h ago" },
  { title: "Pool reassigned to Pool-Beta", meta: "Admin - 1d ago" },
  { title: "Agent created", meta: "System - 7d ago" },
];

export type GasPoolStatus = "Healthy" | "Moderate" | "High Risk";

export type GasPoolRow = {
  id: string;
  balance: string;
  status: GasPoolStatus;
  dailyCap: string;
  burnRate: string;
  linkedAgents: string;
};

export type GasPoolDetails = {
  currentBalance: string;
  transactionsTopUps: string;
  agentsLinked: string;
  spendHistory: string;
  allowedMerchants: string;
};

export const gasHeaderPills = [
  { label: "12% POOLED USED", tone: "ok" },
  { label: "55% POOLS USED", tone: "warn" },
  { label: "92% POOLS USED", tone: "danger" },
] as const;

export const gasOverviewCards = [
  { label: "TOTAL BALANCE", value: "420 USDC" },
  { label: "ACTIVE POOLS", value: "420 USDC" },
  { label: "LOW POOLS", value: "420 USDC" },
  { label: "DAILY BURN RATE", value: "420 USDC" },
];

export const gasPoolRows: GasPoolRow[] = [
  { id: "INV-2024-0091", balance: "$1,000.00", status: "Healthy", dailyCap: "Algorand", burnRate: "Agent-01", linkedAgents: "Agent-01" },
  { id: "INV-2024-0092", balance: "$2,500.00", status: "Moderate", dailyCap: "Ethereum", burnRate: "Agent-02", linkedAgents: "Agent-02" },
  { id: "INV-2024-0093", balance: "$750.00", status: "Healthy", dailyCap: "Bitcoin", burnRate: "Agent-03", linkedAgents: "Agent-03" },
  { id: "INV-2024-0094", balance: "$1,200.00", status: "High Risk", dailyCap: "Cardano", burnRate: "Agent-04", linkedAgents: "Agent-04" },
  { id: "INV-2024-0095", balance: "$3,000.00", status: "Moderate", dailyCap: "Polkadot", burnRate: "Agent-05", linkedAgents: "Agent-05" },
  { id: "INV-2024-0096", balance: "$1,500.00", status: "Healthy", dailyCap: "Ripple", burnRate: "Agent-06", linkedAgents: "Agent-06" },
  { id: "INV-2024-0097", balance: "$2,200.00", status: "High Risk", dailyCap: "Solana", burnRate: "Agent-07", linkedAgents: "Agent-07" },
  { id: "INV-2024-0098", balance: "$1,800.00", status: "Moderate", dailyCap: "Chainlink", burnRate: "Agent-08", linkedAgents: "Agent-08" },
  { id: "INV-2024-0099", balance: "$900.00", status: "Healthy", dailyCap: "Litecoin", burnRate: "Agent-09", linkedAgents: "Agent-09" },
];

export const gasPoolDetailById: Record<string, GasPoolDetails> = {
  "INV-2024-0091": {
    currentBalance: "-",
    transactionsTopUps: "-",
    agentsLinked: "-",
    spendHistory: "-",
    allowedMerchants: "-",
  },
};

export const gasCreateNetworks = ["ALGORAND", "ETHEREUM", "BASE", "SOLANA"];

export type SettingsApiKeyStatus = "ACTIVE" | "REVOKED";

export type SettingsApiKeyRow = {
  id: string;
  name: string;
  emailRole: string;
  createdAt: string;
  status: SettingsApiKeyStatus;
  maskedApiKey: string;
};

export const settingsTabs = ["GENERAL", "API KEYS", "WEBHOOKS", "BILLING", "TEAM"];

export const settingsOrganizationProfile = {
  initials: "JD",
  name: "John Doe",
  subtitle: "john@algopay.io · Administrator",
};

export const settingsApiKeyRows: SettingsApiKeyRow[] = [
  {
    id: "key-1",
    name: "John Doe",
    emailRole: "john@algopay.io · Administrator",
    createdAt: "Created: Jan 12, 2024",
    status: "ACTIVE",
    maskedApiKey: "as_live_xk29...f4m2jkjk",
  },
  {
    id: "key-2",
    name: "Jane Smith",
    emailRole: "jane@algopay.io · Manager",
    createdAt: "Created: Feb 02, 2024",
    status: "ACTIVE",
    maskedApiKey: "as_live_ja89...l0p7skss",
  },
  {
    id: "key-3",
    name: "Mike Johnson",
    emailRole: "mike@algopay.io · Developer",
    createdAt: "Created: Mar 15, 2024",
    status: "REVOKED",
    maskedApiKey: "as_live_mi11...z9q1abca",
  },
];
