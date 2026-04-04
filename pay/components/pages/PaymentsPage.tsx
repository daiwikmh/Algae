import SectionPage from "@/components/pages/SectionPage";
import { sectionMetrics } from "@/lib/dummy-data";

export default function PaymentsPage() {
  return (
    <SectionPage
      title="Payments"
      subtitle="Track settlement quality, monitor pending invoices, and keep throughput stable across chains."
      metrics={sectionMetrics.payments}
    />
  );
}
