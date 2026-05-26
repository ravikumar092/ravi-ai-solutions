const fs = require('fs');
module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
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
  const email = `test_signup_admin_${Date.now()}@outlook.com`;
  const password = 'TestPassword123!';
  console.log('Registering via admin API:', email);
  try {
    const res = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test Name'
      }
    });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Exception:', e);
  }
}

run().catch(console.error);
