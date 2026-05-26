module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const fs = require('fs');
const pg = require('pg');
const { Pool } = pg;

const connStrings = [
  "postgresql://postgres:HXFv2MCe9Ao6bBxq@[2406:da14:1d62:b400:5a8e:a383:f384:e8b2]:5432/postgres",
  "postgresql://postgres:HXFv2MCe9Ao6bBxq@[2406:da14:1d62:b400:5a8e:a383:f384:e8b2]:6543/postgres?sslmode=require",
  "postgresql://postgres:HXFv2MCe9Ao6bBxq@db.kebcvsamtudldsztgivh.supabase.co:6543/postgres?sslmode=require"
];

async function run() {
  let pool;
  let success = false;
  
  for (const connStr of connStrings) {
    try {
      console.log(`Connecting to: ${connStr.replace('HXFv2MCe9Ao6bBxq', '****')}`);
      pool = new Pool({
        connectionString: connStr,
        ssl: connStr.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 5000
      });
      const res = await pool.query('SELECT NOW()');
      console.log('Connected successfully! DB time:', res.rows[0].now);
      success = true;
      break;
    } catch (e) {
      console.warn(`Connection failed for ${connStr.substring(0, 50)}... : ${e.message}`);
      if (pool) {
        await pool.end();
      }
    }
  }

  if (!success) {
    console.error('All connection attempts failed.');
    process.exit(1);
  }

  try {
    // Read supabase_setup.sql
    console.log('Reading supabase_setup.sql...');
    const sqlContent = fs.readFileSync('supabase_setup.sql', 'utf-8');

    // We only need to run the migrations starting from Migration 4 (Add products table)
    // to avoid duplicating or conflicting with earlier migrations that already exist.
    // Migration 4 starts at around line 118 of the SQL setup file.
    // Let's locate "-- ── MIGRATION 4: Add products table ──" and run everything from there.
    const migration4Marker = '-- ── MIGRATION 4: Add products table ──';
    const markerIndex = sqlContent.indexOf(migration4Marker);
    if (markerIndex === -1) {
      throw new Error(`Could not find marker "${migration4Marker}" in supabase_setup.sql`);
    }

    const migrationSql = sqlContent.substring(markerIndex);
    console.log('Running Migration 4 & 5 DDL/DML statements...');
    
    // We can run the sql using pool.query(migrationSql).
    await pool.query(migrationSql);
    console.log('Migration execution completed successfully!');

  } catch (err) {
    console.error('Error during migration run:', err);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
