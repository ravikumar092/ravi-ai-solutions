const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/@tanstack/react-start/dist/esm/index.js');
const content = fs.readFileSync(filePath, 'utf8');

// Find createServerFn function definition or where it is defined.
// Let's search for "function createServerFn" or similar.
const lines = content.split('\n');
let foundIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function createServerFn(') || lines[i].includes('const createServerFn =')) {
    console.log(`Found match at line ${i}: ${lines[i]}`);
    foundIdx = i;
  }
}

if (foundIdx !== -1) {
  console.log('--- Context ---');
  for (let i = Math.max(0, foundIdx - 20); i < Math.min(lines.length, foundIdx + 150); i++) {
    console.log(`${i}: ${lines[i]}`);
  }
} else {
  // Let's print some occurrences of createServerFn
  console.log('Could not find definition, searching for occurrences:');
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('createServerFn')) {
      console.log(`${i}: ${lines[i]}`);
      count++;
      if (count > 20) break;
    }
  }
}
