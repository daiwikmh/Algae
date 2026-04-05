import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function AgentsPage() {
  return (
    <SectionPage
      title="Agents"
      subtitle="Observe agent health and escalations in one view with the same layout shell and transitions."
      metrics={sectionMetrics.agents}
    />
  );
}
