const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('createServerFn')) {
        console.log(`Found createServerFn in: ${fullPath}`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('createServerFn') && (lines[i].includes('function') || lines[i].includes('='))) {
            console.log(`Lines ${i-5} to ${i+45}:`);
            for (let j = Math.max(0, i-5); j < Math.min(lines.length, i+45); j++) {
              console.log(`${j}: ${lines[j]}`);
            }
          }
        }
      }
    }
  }
}

searchDir(path.join(__dirname, '../node_modules/@tanstack/start-client-core'));
