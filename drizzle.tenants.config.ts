import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './database/tenant-schema.ts',
    out: './migrations-tenants',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});