import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
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