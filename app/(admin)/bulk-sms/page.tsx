import PageHero from '@/components/ui/pageHero'
import React from 'react'

const BulkSMSPage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Bulk SMS"
        subtitle={`Here you can manage Bulk SMS settings and send messages`}
      />
    </section>
  )
}

export default BulkSMSPage