import PageHero from '@/components/ui/pageHero'

const TenantsPage = async () => {

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