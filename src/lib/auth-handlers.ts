import * as oidc from 'openid-client';
import memoize from 'memoizee';
import { saveSession, generateSessionId, deleteSession } from './replit-auth.server';

const getOidcConfig = memoize(
  async () =>
    oidc.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    ),
  { maxAge: 3600 * 1000 }
);

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function handleLogin(request: Request): Promise<Response> {
  const domain = new URL(request.url).hostname;
  const callbackURL = `https://${domain}/api/callback`;
  try {
    const config = await getOidcConfig();

    // Generate PKCE code verifier and challenge
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackURL,
      scope: 'openid email profile offline_access',
      prompt: 'login consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Store the code verifier in a short-lived cookie for the callback
    const verifierCookie = [
      `pkce_verifier=${encodeURIComponent(codeVerifier)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=600',
    ].join('; ');

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.href,
        'Set-Cookie': verifierCookie,
      },
    });
  } catch (e) {
    console.error('[auth/login] error:', e);
    return new Response(null, { status: 302, headers: { Location: '/login?error=config_failed' } });
  }
}

export async function handleCallback(request: Request): Promise<Response> {
  const domain = new URL(request.url).hostname;
  const callbackURL = `https://${domain}/api/callback`;
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const codeVerifier = parseCookie(cookieHeader, 'pkce_verifier');
    if (!codeVerifier) {
      console.error('[auth/callback] missing PKCE verifier cookie');
      throw new Error('Missing PKCE verifier');
    }

    const config = await getOidcConfig();
    const tokens = await oidc.authorizationCodeGrant(config, new URL(request.url), {
      redirect_uri: callbackURL,
      pkceCodeVerifier: codeVerifier,
    } as any);
    const claims = tokens.claims();
    if (!claims?.sub) throw new Error('No sub in claims');

    const userId = String(claims.sub);
    const email = (claims.email as string) ?? null;
    const firstName = (claims.first_name as string) ?? null;
    const lastName = (claims.last_name as string) ?? null;
    const profileImageUrl = (claims.profile_image_url as string) ?? null;

    // Note: user upsert into replit_users skipped — using in-memory session store.
    const sessionId = generateSessionId();
    await saveSession(sessionId, userId, { email, firstName, lastName, profileImageUrl });

    const isSecure = request.url.startsWith('https:') || request.headers.get('x-forwarded-proto') === 'https';
    const sessionCookie = [
      `replit_session=${encodeURIComponent(sessionId)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${7 * 24 * 60 * 60}`,
      ...(isSecure ? ['Secure'] : []),
    ].join('; ');

    // Clear the PKCE verifier cookie and set the session cookie
    return new Response(null, {
      status: 302,
      headers: new Headers([
        ['Location', '/admin'],
        ['Set-Cookie', sessionCookie],
        ['Set-Cookie', 'pkce_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'],
      ]),
    });
  } catch (e) {
    console.error('[auth/callback] error:', e);
    return new Response(null, { status: 302, headers: { Location: '/login?error=auth_failed' } });
  }
}

export async function handleLogout(request: Request): Promise<Response> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const sessionId = parseCookie(cookieHeader, 'replit_session');
  if (sessionId) {
    try {
      await deleteSession(sessionId);
    } catch (e) {
      console.error('[auth/logout] error:', e);
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'replit_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}
