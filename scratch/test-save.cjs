const http = require('http');

const sessionCookie = 'replit_session=eef894197b505f41f0507c329596cc073081ea558bf5759a076975ab2f2e0e91';

// Base64URL encode function ID
const fnInfo = {
  file: '/src/lib/settings.functions.ts?tss-serverfn-split',
  export: 'updateSettings_createServerFn_handler'
};
const fnId = Buffer.from(JSON.stringify(fnInfo)).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

console.log('Server Function ID:', fnId);

const payloadWithData = {
  data: {
    site_name: "Ravi Kumar AI Lab",
    hero_headline: "Build autonomous systems that work while you sleep.",
    hero_tagline: "I design and ship AI workflows, agentic pipelines, and custom automation.",
    founder_name: "Ravi Kumar",
    founder_bio: "Test Bio",
    meta_description: "Test Meta",
    tools_title: "Test Tools Title",
    tools_desc: "Test Tools Desc",
    courses_title: "Test Courses Title",
    courses_desc: "Test Courses Desc",
    community_title: "Test Community Title",
    community_desc: "Test Community Desc",
    ebook_title: "Test Ebook Title",
    ebook_desc: "Test Ebook Desc"
  }
};

const payloadRaw = {
  site_name: "Ravi Kumar AI Lab",
  hero_headline: "Build autonomous systems that work while you sleep.",
  hero_tagline: "I design and ship AI workflows, agentic pipelines, and custom automation.",
  founder_name: "Ravi Kumar",
  founder_bio: "Test Bio",
  meta_description: "Test Meta",
  tools_title: "Test Tools Title",
  tools_desc: "Test Tools Desc",
  courses_title: "Test Courses Title",
  courses_desc: "Test Courses Desc",
  community_title: "Test Community Title",
  community_desc: "Test Community Desc",
  ebook_title: "Test Ebook Title",
  ebook_desc: "Test Ebook Desc"
};

function makeRequest(payload, label) {
  return new Promise((resolve) => {
    console.log(`\n--- Testing payload style: ${label} ---`);
    const bodyStr = JSON.stringify(payload);
    
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/_serverFn/${fnId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'Content-Length': Buffer.byteLength(bodyStr),
        'x-tsr-serverFn': 'true'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('Response Data:', data);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('Request Error:', err);
      resolve();
    });

    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  // Test both formats to see what server receives and responds
  await makeRequest(payloadRaw, 'RAW payload (no data nesting)');
  await makeRequest(payloadWithData, 'NESTED payload (with { data: ... })');
}

run();
