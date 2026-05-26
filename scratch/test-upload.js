const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('HAS SERVICE ROLE KEY:', !!SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  try {
    const bucketName = 'product-files';
    console.log('1. Checking buckets...');
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) throw listError;
    
    console.log('Existing buckets:', buckets.map(b => b.name));
    
    const exists = buckets.some(b => b.name === bucketName);
    if (!exists) {
      console.log('Bucket does not exist. Creating...');
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true
      });
      if (createError) throw createError;
      console.log('Bucket created:', data);
    } else {
      console.log('Bucket exists.');
    }

    console.log('2. Trying to upload a dummy file...');
    const filePath = 'test-file-' + Date.now() + '.txt';
    const fileContent = 'Hello World from test script';
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, Buffer.from(fileContent), {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('Upload success! Data:', uploadData);

    console.log('3. Trying to generate signed upload URL...');
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl('products/test-signed-' + Date.now() + '.txt');

    if (signedError) throw signedError;
    console.log('Signed upload URL generated successfully:', signedData);
    
    console.log('Test completed successfully.');
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

run();
