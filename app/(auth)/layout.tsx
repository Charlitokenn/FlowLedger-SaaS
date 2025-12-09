"use client"

import config from '@/lib/app-config'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const pathname = usePathname();
  const isSignUp = pathname?.includes('sign-up');
  const isSignIn = pathname?.includes('sign-in');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      {/* Floating back button that does not affect layout height */}
      <div className="fixed left-4 top-4 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between gap-16">
          {/* Left marketing copy */}
          <section className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            {isSignUp ? `Sign up to ${config.appDetails.brand} and meet the ease` : 'Log in to track your finances efficiently.'}
          </h1>
          <p className="mt-6 text-base text-slate-500 leading-relaxed">
            {isSignUp ? `${config.appDetails.brand} is an online software designed to help real estate businesses easily manage their finances.` : `${config.appDetails.brand} lets you keep track of your incomes &amp; outcomes without any hassle.`}
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
    </div>
  )
}

export default AuthLayout
