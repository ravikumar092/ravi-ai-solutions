import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader, setResponseStatus, setCookie, getCookie } from '@tanstack/react-start/server';
import { deleteSession } from '../../lib/replit-auth.server';

const logoutHandler = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionId = getCookie('replit_session');
  if (sessionId) {
    try {
      await deleteSession(sessionId);
    } catch (e) {
      console.error('[auth/logout] delete session error:', e);
    }
  }
  setCookie('replit_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  setResponseStatus(302);
  setResponseHeader('Location', '/');
  return null;
});

export const Route = createFileRoute('/api/logout')({
  loader: () => logoutHandler(),
});
