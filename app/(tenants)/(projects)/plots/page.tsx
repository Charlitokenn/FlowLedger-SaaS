import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Plots",
  },
};

const PlotsPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Plots"
        subtitle={`Here you can view, add and edit your projects' plots`}
      />
    </section>
  )
}

export default PlotsPage