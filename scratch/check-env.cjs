console.log('Environment variable keys:', Object.keys(process.env).filter(k => !k.toLowerCase().includes('key') && !k.toLowerCase().includes('token') && !k.toLowerCase().includes('pass')));
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
}
