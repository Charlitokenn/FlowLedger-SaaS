'use client';

import { CreateOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function CreateOrganizationPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md">
                <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
                    Create Your Organization
                </h1>

                <CreateOrganization
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'shadow-xl',
                        },
                    }}
                    afterCreateOrganizationUrl="/auth/callback"
                />

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        ← Go back
                    </button>
                </div>
            </div>
        </div>
    );
}