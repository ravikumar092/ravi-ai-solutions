module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const dns = require('dns');

const hosts = [
  'db.kebcvsamtudldsztgivh.supabase.co',
  'db.kebcvsamtudldsztgivh.supabase.com',
  'kebcvsamtudldsztgivh.supabase.co',
  'kebcvsamtudldsztgivh.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com' // typical pooler format
];

async function run() {
  for (const host of hosts) {
    try {
      const ip = await new Promise((resolve, reject) => {
        dns.lookup(host, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`Host: ${host} resolves to: ${ip}`);
    } catch (e) {
      console.log(`Host: ${host} failed to resolve: ${e.message}`);
    }
  }
}

run().catch(console.error);
