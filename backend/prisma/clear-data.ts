/**
 * Deletes every row from every application table, keeping the schema and the
 * migration history. Use it once to remove demo data before going live.
 *
 *   npm run db:clear -- --yes
 *
 * The super admin / admin accounts from .env are recreated the next time the API
 * starts; every other account is created by an admin from inside the app.
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const target = new URL(url);
  const label = `${target.hostname}${target.pathname}`;

  if (!process.argv.includes('--yes')) {
    console.error(`This permanently deletes ALL data in ${label}.`);
    console.error('Re-run with --yes to confirm:  npm run db:clear -- --yes');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length === 0) {
      console.log(`No tables found in ${label}; nothing to clear.`);
      return;
    }
    const list = tables.map((t) => `"public"."${t.tablename.replace(/"/g, '""')}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    console.log(`Cleared ${tables.length} tables in ${label}. Restart the API to recreate the .env admin accounts.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
