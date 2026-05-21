import pg from 'pg';

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

async function getUserFromDb(userId: string) {
  const pool = getPool();
  try {
    const res = await pool.query('SELECT * FROM replit_users WHERE id = $1', [userId]);
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

async function isAdminInDb(userId: string): Promise<boolean> {
  const pool = getPool();
  try {
    const res = await pool.query(
      'SELECT 1 FROM user_admin_roles WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return res.rows.length > 0;
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

    const user = await getUserFromDb(sess.userId);
    const admin = await isAdminInDb(sess.userId);

    return {
      userId: sess.userId,
      isAdmin: admin,
      user: {
        id: sess.userId,
        email: user?.email ?? sess.email ?? null,
        firstName: user?.first_name ?? sess.firstName ?? null,
        lastName: user?.last_name ?? sess.lastName ?? null,
        profileImageUrl: user?.profile_image_url ?? sess.profileImageUrl ?? null,
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
