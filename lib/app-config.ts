const config = {
    appDetails: {
        name: "Flow Ledger",
        brand: "FlowLedger",
        supportEmail: "hello@flowledger.com",
        description: "#1 Real Estate Management Software",
        authorName: "Charles Nkonoki",
        authorUrl: "https://flowledger.com",
        creatorName: "Charles Nkonoki",
        openGraph: {
            url: "https://flowledger.com",
            title: "Flow Ledger",
            description: "#1 Real Estate Management Software",
            siteName: "Flow Ledger",
        },
        twitter: {
            title: "Flow Ledger",
            description: "#1 Real Estate Management Software",
            images: [`/og.jpg`],
            creator: "@flowledger",
        },
        icon: {
            icon: "/icon.png",
        }
    },
    env: {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
        clerkSecretKey: process.env.CLERK_SECRET_KEY!,
        apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
        databaseUrl: process.env.DATABASE_URL!,
        upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL!,
        upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
    },
}

export default config;