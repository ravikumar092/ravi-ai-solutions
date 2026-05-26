const fs = require('fs');
const path = require('path');

const filesToUpdate = [];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('from "@tanstack/react-start"') && content.includes('useServerFn')) {
        filesToUpdate.push(fullPath);
      }
    }
  }
}

searchDir(path.join(__dirname, '../src'));
console.log('Files with incorrect useServerFn imports:', filesToUpdate);
