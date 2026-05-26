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
  console.log('Fetching functions from pg_proc or RPC names...');
  // Since we cannot run raw sql, let's see if we can call a common rpc or see if there is an RPC list
  // Let's try executing a query via postgres REST API on pg_catalog if allowed
  // Actually, PostgREST doesn't expose pg_catalog by default, but let's try:
  const { data: routines, error } = await sb.from('pg_proc').select('*');
  if (error) {
    console.log('Cannot query pg_proc directly:', error.message);
  } else {
    console.log('pg_proc columns or rows:', routines);
  }
}

run().catch(console.error);
