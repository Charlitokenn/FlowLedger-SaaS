import PageHero from '@/components/ui/pageHero'
import React from 'react'

const RevenuePage = () => {
  return (
    <section>
      <PageHero
        type="hero"
        title="Revenue"
        subtitle={`Here you can view and manage revenue reports`}
      />
    </section>
  )
}

export default RevenuePage