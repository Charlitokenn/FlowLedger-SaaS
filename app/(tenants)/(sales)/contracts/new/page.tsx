import PageHero from '@/components/ui/pageHero';

export const metadata = {
  title: {
    template: '%s | FlowLedger',
    default: 'New Contract',
  },
};

export default function NewContractPage() {
  return (
    <section>
      <PageHero
        type="hero"
        title="New Contract"
        subtitle="Create a new plot sale contract (UI form pending). For now, use server actions/CreateContract from your internal tooling."
      />

      <div className="text-sm text-muted-foreground">
        Next step: implement a contract creation form that selects an available plot (availability=AVAILABLE and no active contract),
        selects a client, chooses plan (Flat Rate vs Downpayment), and submits to CreateContract.
      </div>
    </section>
  );
}
