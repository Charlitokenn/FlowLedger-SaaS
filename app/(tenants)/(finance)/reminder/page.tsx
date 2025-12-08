import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Reminder",
  },
};

const ReminderPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Reminder"
        subtitle={`Here you can follow up and provide comments on the due, overdue and upcoming installments`}
      />
    </section>
  )
}

export default ReminderPage