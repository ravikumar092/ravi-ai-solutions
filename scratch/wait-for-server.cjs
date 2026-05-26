const http = require('http');

function check() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/', (res) => {
      console.log(`Server is up! Status: ${res.statusCode}`);
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

async function run() {
  console.log('Waiting for dev server to start...');
  for (let i = 0; i < 40; i++) {
    const ok = await check();
    if (ok) {
      console.log('Dev server ready!');
      return;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.error('Server failed to start within 40 seconds.');
}

run();
