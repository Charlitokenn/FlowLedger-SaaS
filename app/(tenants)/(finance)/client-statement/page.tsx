import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Statement",
  },
};

const ClientStatementPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Client Statement"
        subtitle={`Here you can view and download client statements`}
      />
    </section>
  )
}

export default ClientStatementPage