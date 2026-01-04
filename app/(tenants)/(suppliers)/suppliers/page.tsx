import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template:`%s | ${appConfig.appDetails.brand}`,
    default: "Suppliers",
  },
};

const SuppliersPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Suppliers"
        subtitle={`Here you can manage all suppliers`}
      />
    </section>
  )
}

export default SuppliersPage