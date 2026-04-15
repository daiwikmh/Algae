import Link from "next/link";
import "./docs.css";

const sections = [
  {
    label: "Overview",
    items: [{ title: "Introduction", href: "/docs" }],
  },
  {
    label: "API Reference",
    items: [
      {
        title: "Authentication",
        href: "/docs/auth",
        children: [
          { title: "GitHub OAuth", href: "/docs/auth#github" },
          { title: "Google OAuth", href: "/docs/auth#google" },
          { title: "Token Refresh", href: "/docs/auth#refresh" },
        ],
      },
      {
        title: "API Keys",
        href: "/docs/api-keys",
        children: [
          { title: "Register", href: "/docs/api-keys#register" },
          { title: "Validate", href: "/docs/api-keys#validate" },
          { title: "Revoke", href: "/docs/api-keys#revoke" },
        ],
      },
      {
        title: "Gas Pools",
        href: "/docs/gas-pool",
        children: [
          { title: "Create", href: "/docs/gas-pool#create" },
          { title: "Balance", href: "/docs/gas-pool#balance" },
          { title: "Top Up", href: "/docs/gas-pool#topup" },
        ],
      },
      {
        title: "Agents",
        href: "/docs/agents",
        children: [
          { title: "Create", href: "/docs/agents#create" },
          { title: "List", href: "/docs/agents#list" },
          { title: "Update / Suspend", href: "/docs/agents#update" },
        ],
      },
      {
        title: "Payments",
        href: "/docs/payments",
        children: [
          { title: "Initiate", href: "/docs/payments#initiate" },
          { title: "Process", href: "/docs/payments#process" },
          { title: "Query", href: "/docs/payments#query" },
        ],
      },
      {
        title: "Webhooks",
        href: "/docs/webhooks",
        children: [
          { title: "Register", href: "/docs/webhooks#register" },
          { title: "Events", href: "/docs/webhooks#events" },
          { title: "Deliveries", href: "/docs/webhooks#deliveries" },
        ],
      },
      {
        title: "Audit Logs",
        href: "/docs/audit",
      },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen">
      <nav className="w-full border-b border-zinc-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-zinc-900 tracking-tight">
              Algopay
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-500 text-sm">Docs</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 bg-zinc-50">
              v1
            </span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-56 shrink-0 border-r border-zinc-100 py-6 px-4 hidden md:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2 px-3">
                {section.label}
              </div>
              {section.items.map((item) => (
                <div key={item.href}>
                  <Link href={item.href} className="sidebar-link">
                    {item.title}
                  </Link>
                  {"children" in item && (item as any).children && (
                    <div className="ml-4 mt-0.5 mb-1">
                      {(item as any).children.map((child: { title: string; href: string }) => (
                        <Link
                          key={child.href + child.title}
                          href={child.href}
                          className="sidebar-link text-xs !py-1 !text-zinc-400 hover:!text-indigo-600"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-8 py-10 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
