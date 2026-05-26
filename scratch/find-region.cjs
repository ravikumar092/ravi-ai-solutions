process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const fs = require('fs');
const pg = require('pg');
const { Pool } = pg;

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ca-central-1',
  'sa-east-1'
];

async function tryConnect(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.kebcvsamtudldsztgivh:HXFv2MCe9Ao6bBxq@${host}:6543/postgres`;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000 // 4 seconds timeout
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`Region ${region} (Host: ${host}) SUCCESS! DB time:`, res.rows[0].now);
    return pool;
  } catch (e) {
    // Log the error. If it is "tenant not found", PgBouncer responded, so PgBouncer is up but this tenant is not in this region.
    // If it is connection timeout/refused, the host itself is unreachable.
    console.log(`Region ${region} failed: ${e.message.substring(0, 120)}`);
    await pool.end();
    return null;
  }
}

async function run() {
  console.log('Probing regions for tenant kebcvsamtudldsztgivh...');
  let activePool = null;
  let activeRegion = null;

  for (const region of regions) {
    const pool = await tryConnect(region);
    if (pool) {
      activePool = pool;
      activeRegion = region;
      break;
    }
  }

  if (!activePool) {
    console.error('Could not find any working region/connection.');
    process.exit(1);
  }

  console.log(`\n🎉 Found working region: ${activeRegion}`);
  
  try {
    // Read migrations from supabase_setup.sql starting from Migration 4
    console.log('Reading migrations from supabase_setup.sql...');
    const sqlContent = fs.readFileSync('supabase_setup.sql', 'utf-8');
    const marker = '-- ── MIGRATION 4: Add products table ──';
    const index = sqlContent.indexOf(marker);
    if (index === -1) {
      throw new Error(`Could not find marker "${marker}" in supabase_setup.sql`);
    }

    const migrationSql = sqlContent.substring(index);
    console.log('Executing database migrations (DDL & DML)...');
    
    // Execute the SQL migration statements on the active connection pool
    await activePool.query(migrationSql);
    console.log('✅ DATABASE MIGRATIONS APPLIED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Error executing migrations:', err);
  } finally {
    await activePool.end();
  }
  console.log('Done.');
}

run().catch(console.error);
