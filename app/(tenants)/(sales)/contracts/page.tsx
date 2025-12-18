import PageHero from '@/components/ui/pageHero';
import Link from 'next/link';
import { GetContracts } from '@/lib/actions/tenants/contracts.actions';

export const metadata = {
  title: {
    template: '%s | FlowLedger',
    default: 'Contracts',
  },
};

export default async function ContractsPage() {
  const res = await GetContracts();

  return (
    <section>
      <PageHero
        type="hero"
        title="Contracts"
        subtitle="Create and manage plot sale contracts, installments, and payments"
      />

      {!res.success ? (
        <div className="text-sm text-destructive">{res.error}</div>
      ) : res.data.length === 0 ? (
        <div className="text-sm text-muted-foreground">No contracts yet.</div>
      ) : (
        <div className="space-y-2">
          {res.data.map((row) => (
            <div key={row.id} className="rounded border p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">
                    <Link href={`/contracts/${row.id}`} className="underline">
                      Contract {String(row.id).slice(0, 8)}
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {row.status} • Plot: {row.plot?.plotNumber ?? '-'} • Client: {row.client?.fullName ?? '-'}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Value: {String(row.totalContractValue)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
