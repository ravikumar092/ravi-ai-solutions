process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const pg = require('pg');
const { Pool } = pg;

const connectionString = "postgresql://postgres.kebcvsamtudldsztgivh:HXFv2MCe9Ao6bBxq@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function run() {
  console.log('Connecting to pooler:', connectionString.replace('HXFv2MCe9Ao6bBxq', '****'));
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection SUCCESS! Database time:', res.rows[0].now);
    
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables in public schema:', tablesRes.rows.map(r => r.table_name));
  } catch (e) {
    console.error('Connection FAILED:', e);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
