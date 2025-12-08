import { config } from 'dotenv';
import { resolve } from 'path';

// Load env first so ENCRYPTION_KEY is available
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined (after loading .env.local)');
  }

  // Import encryption only AFTER env is loaded
  const { encrypt } = await import('../lib/encryption');

  const urls = [
    process.env.TENANT_DB_URL_1,
    process.env.TENANT_DB_URL_2,
  ];

  urls.forEach((url, index) => {
    if (!url) {
      console.error(`TENANT_DB_URL_${index + 1} is not set`);
      return;
    }

    const encrypted = encrypt(url);
    console.log(`Encrypted TENANT_DB_URL_${index + 1}:`);
    console.log(encrypted);
    console.log('---');
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});