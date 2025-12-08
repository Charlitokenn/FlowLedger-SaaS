import { ReusableAdvancedDataTable, ReusableDataTable } from '@/components/data-table/reusable-data-table';
import PageHero from '@/components/ui/pageHero'
import { GetAllContacts } from '@/lib/actions/tenants/contacts.actions';

const TenantsPage = async () => {
  const { data } = await GetAllContacts()

  const columns = [
    {
      id: "fullName",
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      id: "mobileNumber",
      accessorKey: "mobileNumber",
      header: "Mobile Number",
    },
    {
      id: "idType",
      accessorKey: "idType",
      header: "Id Type",
    },
  ];
  
  return (
    <section>
      <PageHero
        type="hero"
        title="Tenants"
        subtitle={`Here you can view and manage tenants`}
      />
      <ReusableAdvancedDataTable data={data ?? []} columns={columns} pageCount={data?.length ?? 0} />
    </section>

  )
}

export default TenantsPage