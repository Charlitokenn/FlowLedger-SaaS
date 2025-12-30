const config = {
    appDetails: {
        name: "Land Flow",
        brand: "LandFlow",
        supportEmail: "hello@landflow.com",
        description: "#1 Real Estate Management Software",
        authorName: "Charles Nkonoki",
        authorUrl: "https://landflow.com",
        creatorName: "Charles Nkonoki",
        openGraph: {
            url: "https://landflow.com",
            title: "Land Flow",
            description: "#1 Real Estate Management Software",
            siteName: "Land Flow",
        },
        twitter: {
            title: "Land Flow",
            description: "#1 Real Estate Management Software",
            images: [`/og.jpg`],
            creator: "@landflow",
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