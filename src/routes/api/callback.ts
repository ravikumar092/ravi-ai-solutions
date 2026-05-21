import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader, setResponseStatus, setCookie } from '@tanstack/react-start/server';
import { saveSession, generateSessionId } from '../../lib/replit-auth.server';
import pg from 'pg';
import * as oidc from 'openid-client';
import memoize from 'memoizee';

const { Pool } = pg;
let _pool: InstanceType<typeof Pool> | undefined;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

const getOidcConfig = memoize(
  async () => oidc.discovery(
    new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
    process.env.REPL_ID!
  ),
  { maxAge: 3600 * 1000 }
);

const callbackHandler = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const domain = new URL(request.url).hostname;
  const callbackURL = `https://${domain}/api/callback`;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.authorizationCodeGrant(config, new URL(request.url), {
      redirect_uri: callbackURL,
    } as any);
    const claims = tokens.claims();
    if (!claims?.sub) throw new Error('No sub in claims');

    const userId = String(claims.sub);
    const email = (claims.email as string) ?? null;
    const firstName = (claims.first_name as string) ?? null;
    const lastName = (claims.last_name as string) ?? null;
    const profileImageUrl = (claims.profile_image_url as string) ?? null;

    const pool = getPool();
    await pool.query(
      `INSERT INTO replit_users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email, first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name, profile_image_url = EXCLUDED.profile_image_url,
         updated_at = NOW()`,
      [userId, email, firstName, lastName, profileImageUrl]
    );

    const sessionId = generateSessionId();
    await saveSession(sessionId, userId, { email, firstName, lastName, profileImageUrl });

    const isSecure = !domain.includes('localhost');
    setCookie('replit_session', sessionId, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    setResponseStatus(302);
    setResponseHeader('Location', '/admin');
  } catch (e) {
    console.error('[auth/callback] error:', e);
    setResponseStatus(302);
    setResponseHeader('Location', '/login?error=auth_failed');
  }
  return null;
});

export const Route = createFileRoute('/api/callback')({
  loader: () => callbackHandler(),
});
