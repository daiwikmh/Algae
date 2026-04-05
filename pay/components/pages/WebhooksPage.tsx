import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function WebhooksPage() {
  return (
    <SectionPage
      title="Web Hooks"
      subtitle="Watch delivery success and retries over time while preserving the shared dashboard shell structure."
      metrics={sectionMetrics.webhooks}
    />
  );
}
