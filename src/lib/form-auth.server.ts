import { createHash, timingSafeEqual } from 'crypto';
import { saveSession, generateSessionId } from './replit-auth.server';

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

  if (!adminPassword) {
    console.error('[form-auth] ADMIN_PASSWORD env var is not set');
    return new Response(
      JSON.stringify({ error: 'Admin credentials not configured on the server.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const usernameMatch = safeEqual(username.toLowerCase(), adminUsername.toLowerCase());
  const passwordMatch = safeEqual(hashPassword(password), hashPassword(adminPassword));

  if (!usernameMatch || !passwordMatch) {
    return new Response(JSON.stringify({ error: 'Invalid username or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Store isAdmin=true directly in the session — no user_roles table required
  const sessionId = generateSessionId();
  await saveSession(sessionId, ADMIN_USER_ID, {
    isAdmin: true,
    email: null,
    firstName: adminUsername,
    lastName: null,
    profileImageUrl: null,
  });

  const domain = new URL(request.url).hostname;
  const isSecure = !domain.includes('localhost');
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
