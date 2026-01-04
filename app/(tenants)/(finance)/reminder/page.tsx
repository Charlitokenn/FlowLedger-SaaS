import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
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