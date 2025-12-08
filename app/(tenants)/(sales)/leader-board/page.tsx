import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Leader Board",
  },
};

const LeaderBoardPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Leader Board"
        subtitle="View top performers and their achievements"
      />
    </section>
  )
}
export default LeaderBoardPage