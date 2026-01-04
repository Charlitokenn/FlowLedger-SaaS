import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Debtor Aging",
  },
};

const DebtorAgingPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Debtor Aging"
        subtitle={`Here you can view and download the debtors aging report`}
      />
    </section>
  )
}

export default DebtorAgingPage