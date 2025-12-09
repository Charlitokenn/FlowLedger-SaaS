import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (<SignUp
    appearance={{
      elements: {
        rootBox: 'w-full',
        card: 'shadow-none border-0 p-0',
        headerTitle: 'text-xl font-semibold text-slate-900',
        headerSubtitle: 'text-sm text-slate-500',
        formFieldLabel: 'text-sm font-medium text-slate-700',
        formFieldInput: 'rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm',
        footerActionText: 'text-sm text-slate-500',
        header: 'mb-6',
        formButtonPrimary:
          'mt-2 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white py-2.5',
        socialButtonsBlockButton:
          'border-slate-200 hover:bg-slate-50 text-slate-700 text-sm rounded-lg',
        socialButtonsBlockButtonText: 'text-sm font-medium',
        dividerLine: 'bg-slate-200',
        dividerText: 'text-xs text-slate-400',
      },
    }}
  />
  )
}
