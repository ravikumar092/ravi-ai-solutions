import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  // Load .env manually in Node server environment
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach((line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
          }
        }));
      }
    } catch (_) {
      try {
        // Fallback for bundlers supporting dynamic import
        Promise.all([import('fs'), import('path')]).then((([fs, path]) => {
          const envPath = path.resolve(process.cwd(), '.env');
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split('\n').forEach((line => {
              const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
              if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
              }
            }));
          }
        })).catch(() => {});
      } catch (_) {}
    }
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (typeof window === 'undefined') {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      const errorMsg = "SUPABASE_SERVICE_ROLE_KEY environment variable is not configured. Please add this key to your Vercel Project Settings under Environment Variables so that the admin backend can authenticate requests.";
      console.error(`[Supabase] Critical Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Validate that the key is actually a service_role key (and not an anon/publishable key)
    try {
      const parts = SUPABASE_SERVICE_ROLE_KEY.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload?.role !== 'service_role') {
          const errorMsg = `SUPABASE_SERVICE_ROLE_KEY is set to a key with role '${payload?.role || 'unknown'}' instead of 'service_role'. Please replace it with your secret service_role key from your Supabase Dashboard -> Project Settings -> API.`;
          console.error(`[Supabase] Critical Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      }
    } catch (e: any) {
      if (e.message?.includes("service_role")) {
        throw e;
      }
      // Fail-silent on JSON parsing of invalid keys to avoid crashing on other issues, but log it
      console.warn(`[Supabase] Failed to parse and validate SUPABASE_SERVICE_ROLE_KEY format:`, e.message || e);
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_SERVICE_ROLE_KEY ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    console.error(`[Supabase] Missing env vars: ${missing.join(', ')}`);
    throw new Error(`Missing Supabase env vars: ${missing.join(', ')}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
