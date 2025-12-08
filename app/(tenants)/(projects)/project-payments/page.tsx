import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Project Payments",
  },
};

const ProjectPaymentsPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Project Payments"
        subtitle={`Here you can manage all your projects' payments`}
      />
    </section>
  )
}

export default ProjectPaymentsPage