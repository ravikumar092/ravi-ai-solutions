module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const dns = require('dns');
const pg = require('pg');
const { Pool } = pg;

const host = 'aws-0-ap-south-1.pooler.supabase.com';

async function run() {
  console.log('Resolving host:', host);
  try {
    const ip = await new Promise((resolve, reject) => {
      dns.lookup(host, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    console.log('Resolved to IP:', ip);
  } catch (err) {
    console.error('Resolution failed:', err.message);
    return;
  }

  // The database username is typically: postgres.kebcvsamtudldsztgivh
  // Let's format the connection string for pooler mode (port 6543 or 5432)
  const connectionString = 'postgresql://postgres.kebcvsamtudldsztgivh:HXFv2MCe9Ao6bBxq@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

  console.log('Attempting pg connection to pooler...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection SUCCESS! DB Time:', res.rows[0].now);
  } catch (err) {
    console.error('Connection FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
