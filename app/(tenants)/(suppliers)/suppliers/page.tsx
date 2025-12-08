import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Suppliers",
  },
};

const SuppliersPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Suppliers"
        subtitle={`Here you can manage all suppliers`}
      />
    </section>
  )
}

export default SuppliersPage