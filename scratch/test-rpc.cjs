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
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql'];
  for (const rpc of rpcs) {
    try {
      console.log(`Testing RPC "${rpc}"...`);
      const { data, error } = await sb.rpc(rpc, { query: 'SELECT 1' });
      if (error) {
        console.log(`RPC "${rpc}" error:`, error.message);
      } else {
        console.log(`🎉 RPC "${rpc}" succeeded! Result:`, data);
        return; // found a working one!
      }
    } catch (e) {
      console.log(`RPC "${rpc}" exception:`, e.message);
    }
  }
  console.log('No working SQL execution RPC found.');
}

run().catch(console.error);
