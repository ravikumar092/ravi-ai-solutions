module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const https = require('https');

function getHeaders() {
  return new Promise((resolve) => {
    https.get('https://kebcvsamtudldsztgivh.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYmN2c2FtdHVkbGRzenRnaXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI0OTUsImV4cCI6MjA5NDQxODQ5NX0.PH8it1awkt7_SBCKgIu6QCApoyo9U_9E-AtePZ5oGdc'
      }
    }, (res) => {
      resolve(res.headers);
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function run() {
  const headers = await getHeaders();
  console.log('Headers from Supabase:', headers);
}

run().catch(console.error);
