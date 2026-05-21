import pg from 'pg';
import { createHash, timingSafeEqual } from 'crypto';
import { saveSession, generateSessionId } from './replit-auth.server';

const { Pool } = pg;
let _pool: InstanceType<typeof Pool> | undefined;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + (process.env.PASSWORD_SALT ?? 'rk-ai-lab-salt')).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

async function ensureAdminUser(username: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO replit_users (id, email, first_name, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id) DO NOTHING`,
    [username, null, username]
  );
  await pool.query(
    `INSERT INTO user_admin_roles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [username]
  );
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
    return new Response(JSON.stringify({ error: 'Admin credentials not configured. Set ADMIN_PASSWORD.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const usernameMatch = safeEqual(username.toLowerCase(), adminUsername.toLowerCase());
  const passwordHash = hashPassword(password);
  const expectedHash = hashPassword(adminPassword);
  const passwordMatch = safeEqual(passwordHash, expectedHash);

  if (!usernameMatch || !passwordMatch) {
    return new Response(JSON.stringify({ error: 'Invalid username or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await ensureAdminUser(adminUsername);

  const sessionId = generateSessionId();
  await saveSession(sessionId, adminUsername, {
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
