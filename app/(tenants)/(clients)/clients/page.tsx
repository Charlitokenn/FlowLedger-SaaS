import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Clients",
  },
};

const ClientsPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Clients"
        subtitle={`Here you can manage your clients `}
<<<<<<< HEAD
        sheetContent={undefined} sheetTitle={""}
=======
>>>>>>> 0d397c2b15884b55d37500b36a7e185f7b9bfede
      />
    </section>
  )
}

export default ClientsPage