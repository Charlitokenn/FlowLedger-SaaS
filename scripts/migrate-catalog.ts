import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function runMigrations() {
  console.log('🚀 Running catalog database migrations...');
  
  const sql = neon(process.env.CATALOG_DATABASE_URL!);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './migrations-catalog' });

  console.log('✅ Migrations completed');
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});