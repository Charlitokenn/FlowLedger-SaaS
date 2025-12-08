import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './database/catalog-schema.ts',
    out: './migrations-catalog',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.CATALOG_DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
