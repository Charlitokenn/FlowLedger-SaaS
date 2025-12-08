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
        subtitle={`Here you can view the leader board scores `}
      />
    </section>
  )
}

export default LeaderBoardPage