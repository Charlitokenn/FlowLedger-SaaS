import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'shadow-none p-6',
          headerTitle: 'text-xl font-semibold text-primary',
          headerSubtitle: 'text-sm text-slate-500',
          formFieldLabel: 'input-label',
          formFieldInput: 'input-field',
          formFieldError: 'text-sm text-destructive mt-1',
          formButtonPrimaryText: 'text-sm font-medium',
          footerActionText: 'text-sm text-slate-500',
          header: 'mb-1',
          formButtonPrimary: 'auth-button',
          socialButtonsBlockButton: 'border-slate-200 hover:bg-slate-50 text-slate-700 text-sm rounded-lg',
          socialButtonsBlockButtonText: 'text-sm font-medium',
          dividerLine: 'bg-slate-200',
          dividerText: 'text-xs text-slate-200',
        },
      }}
    />
  )
}
