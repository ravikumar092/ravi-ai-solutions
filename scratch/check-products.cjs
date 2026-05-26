module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
  const idx = trimmed.indexOf('=');
  const key = trimmed.substring(0, idx).trim();
  const val = trimmed.substring(idx + 1).trim().replace(/^"/, '').replace(/"$/, '');
  env[key] = val;
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  console.log('Querying Table "products"...');
  const { data, error } = await sb.from('products').select('*').limit(1);
  if (error) {
    console.error('Error querying products table:', error);
  } else {
    console.log('Successfully queried products table. Data:', data);
  }
}

run().catch(console.error);
