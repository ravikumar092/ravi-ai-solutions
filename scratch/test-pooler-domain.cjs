const dns = require('dns').promises;

const domains = [
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.co',
  'aws-0-ap-northeast-1.supabase.co',
  'aws-0-ap-northeast-1.supabase.com',
  'ap-northeast-1.pooler.supabase.com',
  'ap-northeast-1.pooler.supabase.co',
  'db.kebcvsamtudldsztgivh.supabase.co'
];

async function run() {
  for (const domain of domains) {
    try {
      const address = await dns.lookup(domain);
      console.log(`Domain: ${domain} resolves to:`, address.address);
    } catch (e) {
      console.log(`Domain: ${domain} failed:`, e.message);
    }
  }
}

run().catch(console.error);
