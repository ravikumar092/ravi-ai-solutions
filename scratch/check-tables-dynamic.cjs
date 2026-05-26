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
  const potentialTables = [
    'services', 'videos', 'testimonials', 'blog_posts', 'faqs', 'leads', 'site_settings',
    'products', 'automations', 'courses', 'lessons', 'community_posts'
  ];

  for (const table of potentialTables) {
    const { data, error } = await sb.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table "${table}": error: ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": exists.`);
    }
  }
}

run().catch(console.error);
