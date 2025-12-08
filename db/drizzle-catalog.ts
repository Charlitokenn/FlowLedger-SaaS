import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/db/catalog-schema';

if (!process.env.CATALOG_DATABASE_URL) {
  throw new Error('CATALOG_DATABASE_URL is not defined');
}

const sql = neon(process.env.CATALOG_DATABASE_URL);

export const catalogDb = drizzle(sql, { schema });