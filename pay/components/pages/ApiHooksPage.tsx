import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function ApiHooksPage() {
  return (
    <SectionPage
      title="Api Hooks"
      subtitle="Monitor API hook traffic, latency behavior, and rate limit pressure from one operational surface."
      metrics={sectionMetrics.apiHooks}
    />
  );
}
