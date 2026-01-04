const config = {
    appDetails: {
        name: "Ardhi Flow",
        brand: "ArdhiFlow",
        supportEmail: "hello@ardhiflow.com",
        description: "#1 Real Estate Management Software",
        authorName: "Charles Nkonoki",
        authorUrl: "https://ardhiflow.com",
        creatorName: "Charles Nkonoki",
        openGraph: {
            url: "https://ardhiflow.com",
            title: "Ardhi Flow",
            description: "#1 Real Estate Management Software",
            siteName: "Ardhi Flow",
        },
        twitter: {
            title: "Ardhi Flow",
            description: "#1 Real Estate Management Software",
            images: [`/og.jpg`],
            creator: "@ardhiflow",
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