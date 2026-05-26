const http = require('http');
const { toJSON } = require('seroval');

const sessionCookie = 'replit_session=eef894197b505f41f0507c329596cc073081ea558bf5759a076975ab2f2e0e91';

const fnInfo = {
  file: '/src/lib/products.functions.ts?tss-serverfn-split',
  export: 'upsertProduct_createServerFn_handler'
};
const fnId = Buffer.from(JSON.stringify(fnInfo)).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const product = {
  category: "blueprint",
  title: "Test Automation Blueprint",
  description: "A temporary test description for verifying database save capabilities.",
  price: "$9",
  badge: "Test Badge",
  icon: "Zap",
  icon_color: "text-amber-400",
  features: ["Feature A", "Feature B"],
  cta: "Get Blueprint",
  sort_order: 99,
  is_active: true
};

const payload = {
  data: product
};

let jsonPayload;
try {
  jsonPayload = toJSON(payload);
} catch (e) {
  console.error('Error serializing:', e);
}

function makeRequest(bodyText) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/_serverFn/${fnId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'Content-Length': Buffer.byteLength(bodyText),
        'x-tsr-serverFn': 'true'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Data:', data);
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', (err) => {
      console.error('Request Error:', err);
      resolve(false);
    });

    req.write(bodyText);
    req.end();
  });
}

async function run() {
  if (jsonPayload) {
    const ok = await makeRequest(JSON.stringify(jsonPayload));
    if (ok) {
      console.log('Test product successfully saved to remote Supabase database!');
    } else {
      console.error('Test product saving failed.');
    }
  }
}

run().catch(console.error);
