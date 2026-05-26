module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const dns = require('dns').promises;

const host = 'db.kebcvsamtudldsztgivh.supabase.co';
const restHost = 'kebcvsamtudldsztgivh.supabase.co';

async function query(hostname) {
  console.log(`\n=== DNS Queries for ${hostname} ===`);
  const types = ['CNAME', 'TXT', 'NS', 'AAAA', 'SRV'];
  for (const type of types) {
    try {
      const records = await dns.resolve(hostname, type);
      console.log(`${type}:`, records);
    } catch (e) {
      console.log(`${type} failed:`, e.message);
    }
  }
}

async function run() {
  await query(host);
  await query(restHost);
}

run().catch(console.error);
