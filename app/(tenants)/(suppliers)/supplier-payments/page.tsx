import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Supplier Payments",
  },
};

const SupplierPaymentsPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Supplier Payments"
        subtitle={`Here you can manage all supplier payments `}
      />
    </section>
  )
}

export default SupplierPaymentsPage