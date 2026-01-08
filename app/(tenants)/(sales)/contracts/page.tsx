import PageHero from '@/components/ui/pageHero';
import { GetContracts } from '@/lib/actions/tenants/contracts.actions';
import { ContractsTable } from "./columns";
import { AddContractForm } from "@/components/forms/contracts/add-contract-form";
import appConfig from "@/lib/app-config";

export const metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: 'Contracts',
  },
};

export default async function ContractsPage() {
  const results = await GetContracts();

    return (
        <section>
            <PageHero
                type="hero"
                title="Contracts"
                subtitle="Create and manage all plot sales contracts"
                showButton
                buttonText="New Contract"
                sheetTitle="New Contract"
                sheetContent={<AddContractForm />}
                hideBulkUploaderHeader={true}
                hideBulkUploaderFooter={true}
                bulkUploaderClass="max-w-full"
                hideSheetHeader={true}
                hideSheetFooter={true}
                sheetSaveButtonText="Save Contract"
                sheetSizeClass="max-w-full"
            />
            <ContractsTable data={results.data ?? []} />
        </section>
    )
}
