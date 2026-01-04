import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Expenses",
  },
};

const ExpensesPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Expenses"
        subtitle={`Here you can view, add and edit all your expenses `}
      />
    </section>
  )
}

export default ExpensesPage