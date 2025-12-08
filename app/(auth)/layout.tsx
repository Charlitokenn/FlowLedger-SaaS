"use client"

import config from '@/lib/app-config'
import React from 'react'
import { usePathname } from 'next/navigation'

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const pathname = usePathname();
  const isSignUp = pathname?.includes('sign-up');
  const isSignIn = pathname?.includes('sign-in');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-6xl items-center justify-between gap-16">
        {/* Left marketing copy */}
        <section className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            {isSignUp ? 'Sign up to track your finances efficiently.' : 'Log in to track your finances efficiently.'}
          </h1>
          <p className="mt-6 text-base text-slate-500 leading-relaxed">
            {config.appDetails.brand} lets you keep track of your incomes &amp; outcomes without any hassle.
          </p>
        </section>

        {/* Right auth card with layered background */}
        <section className="flex-1 flex justify-center">
          <div className="relative w-full max-w-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -bottom-3 -left-2 rounded-xl bg-primary opacity-60 -rotate-6"
            />
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
