const pg = require('pg');
const { Pool } = pg;

const connectionString = "postgresql://postgres:HXFv2MCe9Ao6bBxq@[2406:da14:1d62:b400:5a8e:a383:f384:e8b2]:5432/postgres";

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log('Running migration: ALTER TABLE public.services ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'USD\';');
    await pool.query('ALTER TABLE public.services ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'USD\';');
    console.log('✅ Services migration applied successfully!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
