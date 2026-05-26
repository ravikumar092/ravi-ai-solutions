const fs = require('fs');

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

async function run() {
  const url = env.SUPABASE_URL + '/rest/v1/';
  console.log('Fetching OpenAPI spec from:', url);
  const res = await fetch(url, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  if (!res.ok) {
    throw new Error('HTTP Error: ' + res.status + ' ' + res.statusText);
  }
  const spec = await res.json();
  console.log('API Title:', spec.info?.title);
  console.log('Paths available:');
  const paths = Object.keys(spec.paths);
  paths.forEach(p => console.log('  ', p));
}

run().catch(console.error);
