module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
  const idx = trimmed.indexOf('=');
  const key = trimmed.substring(0, idx).trim();
  const val = trimmed.substring(idx + 1).trim().replace(/^"/, '').replace(/"$/, '');
  env[key] = val;
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  console.log('Testing saving to site_settings table...');
  const key = 'test_key_' + Date.now();
  const value = 'test_value_' + Date.now();
  
  // Insert/upsert into site_settings
  const { data: upsertData, error: upsertError } = await sb
    .from('site_settings')
    .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' })
    .select();

  if (upsertError) {
    console.error('❌ site_settings upsert FAILED:', upsertError.message);
  } else {
    console.log('✅ site_settings upsert SUCCEEDED:', upsertData);
  }

  // Delete test setting
  if (!upsertError) {
    const { error: deleteError } = await sb
      .from('site_settings')
      .delete()
      .eq('key', key);
    if (deleteError) {
      console.warn('Warning: Failed to clean up test site setting:', deleteError.message);
    } else {
      console.log('✅ Cleaned up test site setting successfully.');
    }
  }

  console.log('\nTesting saving to blog_posts table...');
  const testTitle = 'Test Post ' + Date.now();
  const testSlug = 'test-post-' + Date.now();
  
  const { data: insertData, error: insertError } = await sb
    .from('blog_posts')
    .insert([{
      title: testTitle,
      slug: testSlug,
      content: '<p>Test content</p>',
      is_published: false,
      published_at: null,
      sort_order: 0
    }])
    .select();

  if (insertError) {
    console.error('❌ blog_posts insert FAILED:', insertError.message);
  } else {
    console.log('✅ blog_posts insert SUCCEEDED:', insertData);
    const createdId = insertData[0].id;

    // Try updating
    const { data: updateData, error: updateError } = await sb
      .from('blog_posts')
      .update({ title: testTitle + ' Updated' })
      .eq('id', createdId)
      .select();

    if (updateError) {
      console.error('❌ blog_posts update FAILED:', updateError.message);
    } else {
      console.log('✅ blog_posts update SUCCEEDED:', updateData);
    }

    // Clean up
    const { error: deleteError } = await sb
      .from('blog_posts')
      .delete()
      .eq('id', createdId);
    if (deleteError) {
      console.warn('Warning: Failed to clean up test blog post:', deleteError.message);
    } else {
      console.log('✅ Cleaned up test blog post successfully.');
    }
  }
}

run().catch(console.error);
