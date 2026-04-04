import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function GasPage() {
  return (
    <SectionPage
      title="Gas"
      subtitle="Review liquidity runway, burn profile, and operational cost efficiency from a single place."
      metrics={sectionMetrics.gas}
    />
  );
}
