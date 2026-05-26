module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const pg = require('pg');
const { Pool } = pg;

const host = 'aws-0-ap-northeast-1.pooler.supabase.com';
const password = 'HXFv2MCe9Ao6bBxq';
const user = 'postgres.kebcvsamtudldsztgivh';

async function test(port) {
  console.log(`Testing port ${port}...`);
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`Port ${port} SUCCESS! DB Time:`, res.rows[0].now);
    await pool.end();
    return true;
  } catch (err) {
    console.log(`Port ${port} FAILED:`, err.message);
    await pool.end();
    return false;
  }
}

async function run() {
  await test(5432);
  await test(6543);
}

run().catch(console.error);
