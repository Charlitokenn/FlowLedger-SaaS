import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function HomePage() {
  const authData = await auth();

  if (authData.userId) {
    redirect('/auth/callback');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Welcome to My SaaS App
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Multi-tenant platform for your business
        </p>
        <UserButton />
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border-2 border-blue-600 px-8 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}