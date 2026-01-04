import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Receipts",
  },
};

const ReceiptsPage = () => {
  return (
     <section>
      <PageHero
        type="hero"
        title="Receipts"
        subtitle={`Here you can view, add and edit all your receipts `}
      />
    </section>
  )
}

export default ReceiptsPage