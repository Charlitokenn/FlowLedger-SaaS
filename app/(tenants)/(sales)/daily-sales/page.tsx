import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Sales",
  },
};

const SalesPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Daily Sales"
        subtitle={`Here you can manage all your daily sales `}
      />
    </section>
  )
}

export default SalesPage