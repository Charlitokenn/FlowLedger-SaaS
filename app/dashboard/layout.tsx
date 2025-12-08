import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">My SaaS App</h1>
                        <OrganizationSwitcher
                            hideSlug={false}
                            afterSelectOrganizationUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: 'flex items-center',
                                },
                            }}
                        />
                    </div>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </nav>
            <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </div>
    );
}