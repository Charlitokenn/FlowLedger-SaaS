import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Receipts",
  },
};

const ReceiptsPage = () => {
  return (
     <section>
      <PageHero
        type="hero"
        title="Receipts"
        subtitle={`Here you can view, add and edit all your receipts `}
      />
    </section>
  )
}

export default ReceiptsPage