import PageHero from '@/components/ui/pageHero'

const TenantsPage = async () => {

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
        sheetContent={undefined}
        sheetTitle={''}
      />
    </section>

  )
}

export default TenantsPage