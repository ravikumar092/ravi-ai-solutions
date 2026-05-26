module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const dns = require('dns');

const host = 'db.kebcvsamtudldsztgivh.supabase.co';

dns.resolve6(host, (err, addresses) => {
  if (err) {
    console.error('AAAA resolution failed:', err.message);
  } else {
    console.log('Resolved AAAA addresses:', addresses);
  }
});
