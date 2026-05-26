const fs = require('fs');
const path = require('path');

try {
  const pkgPath = require.resolve('@tanstack/start-client-core/package.json');
  console.log('Found package.json at:', pkgPath);
  const pkgDir = path.dirname(pkgPath);
  console.log('Files in package dir:');
  fs.readdirSync(pkgDir).forEach(f => console.log(f));
} catch (e) {
  console.error('Error resolving package:', e.message);
}
