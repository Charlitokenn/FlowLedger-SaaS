import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Reconciliation",
  },
};

const ReconciliationPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Reconciliation"
        subtitle={`Here you can create, edit and manage all your reconciliations`}
      />
    </section>
  )
}

export default ReconciliationPage