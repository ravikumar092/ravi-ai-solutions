const fs = require('fs');

const content = fs.readFileSync('supabase_setup.sql', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('CREATE OR REPLACE FUNCTION') || lines[i].includes('CREATE FUNCTION')) {
    console.log(`Line ${i}: ${lines[i]}`);
  }
}
