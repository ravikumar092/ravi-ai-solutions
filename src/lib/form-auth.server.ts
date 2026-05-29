import { createHash, timingSafeEqual } from 'crypto';
import { saveSession, generateSessionId } from './replit-auth.server';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';

const ADMIN_USER_ID = 'form-admin';

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + (process.env.PASSWORD_SALT ?? 'rk-ai-lab-salt'))
    .digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function handleFormLogin(request: Request): Promise<Response> {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { username, password } = body;
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  let localLoginSuccess = false;
  if (adminPassword) {
    const usernameMatch = safeEqual(username.toLowerCase(), adminUsername.toLowerCase());
    const passwordMatch = safeEqual(hashPassword(password), hashPassword(adminPassword));
    if (usernameMatch && passwordMatch) {
      localLoginSuccess = true;
    }
  }

  let finalUserId = ADMIN_USER_ID;
  let extraSessionData: Record<string, any> = {
    isAdmin: true,
    email: null,
    firstName: adminUsername,
    lastName: null,
    profileImageUrl: null,
  };

  if (localLoginSuccess) {
    // Local admin login succeeded
    console.log('[form-auth] Local admin login succeeded');
  } else {
    // Fallback to Supabase Auth check
    console.log('[form-auth] Local admin login failed or not configured. Attempting Supabase Auth...');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (authError || !authData.user) {
        console.error('[form-auth] Supabase Auth sign-in failed:', authError?.message || 'No user data');
        return new Response(JSON.stringify({ error: 'Invalid username or password.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = authData.user;
      
      // Verify user has the admin role in user_roles table
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .limit(1);

      if (roleError) {
        console.error('[form-auth] Error checking admin role:', roleError.message);
        return new Response(JSON.stringify({ error: 'Error validating user privileges.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!roleData || roleData.length === 0) {
        console.warn(`[form-auth] User ${user.email} is authenticated but does not have the admin role.`);
        return new Response(JSON.stringify({ error: 'Access denied: Admin role required.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Supabase Admin login succeeded
      finalUserId = user.id;
      extraSessionData = {
        isAdmin: true,
        email: user.email,
        firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Admin',
        lastName: user.user_metadata?.last_name || null,
        profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.profile_image_url || null,
      };
      console.log(`[form-auth] Supabase admin login succeeded for user: ${user.email}`);
    } catch (err: any) {
      console.error('[form-auth] Unexpected error during Supabase Auth fallback:', err);
      return new Response(JSON.stringify({ error: 'An unexpected error occurred during login.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const sessionId = generateSessionId();
  await saveSession(sessionId, finalUserId, extraSessionData);

  const domain = new URL(request.url).hostname;
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
  const isSecure = (request.url.startsWith('https:') || request.headers.get('x-forwarded-proto') === 'https') && !isLocalhost;
  const sessionCookie = [
    `replit_session=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${7 * 24 * 60 * 60}`,
    ...(isSecure ? ['Secure'] : []),
  ].join('; ');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie,
    },
  });
}
