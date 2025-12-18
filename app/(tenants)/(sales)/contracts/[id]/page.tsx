import PageHero from '@/components/ui/pageHero';
import { GetContractDetails } from '@/lib/actions/tenants/contracts.actions';

export const metadata = {
  title: {
    template: '%s | FlowLedger',
    default: 'Contract Details',
  },
};

export default async function ContractDetailsPage({ params }: { params: { id: string } }) {
  const res = await GetContractDetails({ contractId: params.id });

  return (
    <section>
      <PageHero type="hero" title="Contract Details" subtitle="Installments and payment history" />

      {!res.success ? (
        <div className="text-sm text-destructive">{res.error}</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded border p-3">
            <div className="font-medium">Summary</div>
            <div className="text-sm text-muted-foreground">
              Status: {res.data.status} • Plot: {res.data.plot?.plotNumber ?? '-'} • Client: {res.data.client?.fullName ?? '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              Plan: {res.data.purchasePlan} • Total: {String(res.data.totalContractValue)} • Financed: {String(res.data.financedAmount)}
            </div>
          </div>

          <div className="rounded border p-3">
            <div className="font-medium mb-2">Installments</div>
            <div className="space-y-1">
              {res.data.installments.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <div>
                    #{i.installmentNo} • Due {i.dueDate} • {i.status}
                  </div>
                  <div>
                    Due {String(i.amountDue)} / Paid {String(i.amountPaid)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border p-3">
            <div className="font-medium mb-2">Payments</div>
            <div className="space-y-1">
              {res.data.payments.length ? (
                res.data.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <div>
                      {p.receivedAt} • {p.direction}
                    </div>
                    <div>{String(p.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No payments yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
