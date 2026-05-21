import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader, setResponseStatus } from '@tanstack/react-start/server';
import * as oidc from 'openid-client';
import memoize from 'memoizee';

const getOidcConfig = memoize(
  async () => oidc.discovery(
    new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
    process.env.REPL_ID!
  ),
  { maxAge: 3600 * 1000 }
);

const loginHandler = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const domain = new URL(request.url).hostname;
  const callbackURL = `https://${domain}/api/callback`;

  try {
    const config = await getOidcConfig();
    const redirectUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackURL,
      scope: 'openid email profile offline_access',
      prompt: 'login consent',
    });
    setResponseStatus(302);
    setResponseHeader('Location', redirectUrl.href);
  } catch (e) {
    console.error('[auth/login] error:', e);
    setResponseStatus(302);
    setResponseHeader('Location', '/login?error=config_failed');
  }
  return null;
});

export const Route = createFileRoute('/api/login')({
  loader: () => loginHandler(),
});
