import pg from 'pg';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';

const { Pool } = pg;

let _pool: InstanceType<typeof Pool> | undefined;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

export type ReplitSession = {
  userId: string;
  isAdmin: boolean;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

async function isAdminInSupabase(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .limit(1);
    if (error) return false;
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSession(request: Request): Promise<ReplitSession | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const sessionId = parseCookieValue(cookieHeader, 'replit_session');
  if (!sessionId) return null;

  const pool = getPool();
  try {
    const res = await pool.query(
      "SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()",
      [sessionId]
    );
    if (!res.rows.length) return null;
    const sess = res.rows[0].sess as any;
    if (!sess?.userId) return null;

    const admin = await isAdminInSupabase(sess.userId);

    return {
      userId: sess.userId,
      isAdmin: admin,
      user: {
        id: sess.userId,
        email: sess.email ?? null,
        firstName: sess.firstName ?? null,
        lastName: sess.lastName ?? null,
        profileImageUrl: sess.profileImageUrl ?? null,
      },
    };
  } catch (e) {
    console.error('[replit-auth] getSession error:', e);
    return null;
  }
}

export async function saveSession(
  sessionId: string,
  userId: string,
  extraData: Record<string, any> = {}
): Promise<void> {
  const pool = getPool();
  const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sess = { userId, ...extraData };
  await pool.query(
    `INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)
     ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3`,
    [sessionId, JSON.stringify(sess), expire]
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.query('DELETE FROM sessions WHERE sid = $1', [sessionId]);
}

export function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
