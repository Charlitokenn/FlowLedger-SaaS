import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigrations() {
  console.log('🚀 Running catalog database migrations...');
  
  if (!process.env.CATALOG_DATABASE_URL) {
    throw new Error('CATALOG_DATABASE_URL not found in .env.local');
  }
  
  const sql = neon(process.env.CATALOG_DATABASE_URL);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './migrations-catalog' });

  console.log('✅ Migrations completed');
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});