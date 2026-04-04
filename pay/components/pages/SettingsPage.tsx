import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function SettingsPage() {
  return (
    <SectionPage
      title="Settings"
      subtitle="Manage keys, roles, and wallets while keeping the same animated layout shell for consistency."
      metrics={sectionMetrics.settings}
    />
  );
}
