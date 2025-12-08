'use client';

import { useRouter } from 'next/navigation';

interface SerializedOrganization {
    id: string;
    name: string;
    slug: string | null;
    imageUrl: string;
    role: string;
}

interface Props {
    organizations: SerializedOrganization[];
}

export default function OrganizationSelector({ organizations }: Props) {
    const router = useRouter();

    const handleSelect = (slug: string | null) => {
        if (!slug) return;

        const hostname = window.location.hostname;

        // Development
        if (hostname.includes('localhost')) {
            router.push(`/dashboard?org=${slug}`);
            return;
        }

        // Production
        const baseHost = hostname.split('.').slice(1).join('.');
        window.location.href = `https://${slug}.${baseHost}/dashboard`;
    };

    return (
        <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-xl" >
            <h1 className="mb-6 text-center text-2xl font-bold text-gray-900" >
                Select an Organization
            </h1>

            < div className="space-y-3" >
                {
                    organizations.map((org) => (
                        <button
                            key={org.id}
                            onClick={() => handleSelect(org.slug)}
                            className="w-full rounded-lg border border-gray-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
                        >
                            <div className="flex items-center justify-between" >
                                <div>
                                    <div className="font-semibold text-gray-900" >
                                        {org.name}
                                    </div>
                                    < div className="text-sm text-gray-500" >
                                        {org.role}
                                    </div>
                                </div>
                                < svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </button>
                    ))
                }
            </div>

            < div className="mt-6 text-center" >
                <button
                    onClick={() => router.push('/onboarding/create-organization')}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Create new organization
                </button>
            </div>
        </div>
    );
}