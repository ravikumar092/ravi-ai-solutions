const fs = require('fs');

const path = 'C:/Users/ravik/.gemini/antigravity/brain/d23e4ebd-cb8c-4a36-8abd-82534da8a2eb/walkthrough.md';
let content = fs.readFileSync(path, 'utf8');

// Replace table schema field
content = content.replace('desc TEXT NOT NULL,', '"desc" TEXT NOT NULL,');

// Replace insert statement fields
content = content.replace('INSERT INTO public.courses (id, title, desc, level, duration, sort_order)', 'INSERT INTO public.courses (id, title, "desc", level, duration, sort_order)');

fs.writeFileSync(path, content, 'utf8');
console.log('walkthrough.md successfully updated!');
