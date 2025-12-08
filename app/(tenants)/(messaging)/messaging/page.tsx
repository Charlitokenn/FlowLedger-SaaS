import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Messaging",
  },
};

const MessagingPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Messaging"
        subtitle={`Here you can send reminder messages to clients and contacts`} />
    </section>
  )
}

export default MessagingPage