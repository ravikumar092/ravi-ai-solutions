const http = require('http');
const { toJSON } = require('seroval');

const sessionCookie = 'replit_session=eef894197b505f41f0507c329596cc073081ea558bf5759a076975ab2f2e0e91';

const fnInfo = {
  file: '/src/lib/settings.functions.ts?tss-serverfn-split',
  export: 'updateSettings_createServerFn_handler'
};
const fnId = Buffer.from(JSON.stringify(fnInfo)).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const form = {
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

// In TanStack Start, the server expects:
// payload = { data: form } (wrapped)
const payload = {
  data: form
};

let jsonPayload;
try {
  jsonPayload = toJSON(payload);
  console.log('Serialized toJSON payload:', JSON.stringify(jsonPayload, null, 2));
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
        console.log('Response Headers:', res.headers);
        console.log('Response Data:', data);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('Request Error:', err);
      resolve();
    });

    req.write(bodyText);
    req.end();
  });
}

async function run() {
  if (jsonPayload) {
    await makeRequest(JSON.stringify(jsonPayload));
  }
}

run();
