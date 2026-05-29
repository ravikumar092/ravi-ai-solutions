import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getSession } from '../../lib/replit-auth.server';

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const request = getRequest();
    const cookies = request.headers.get('cookie') ?? '';
    console.log(`[getMe] Request URL: ${request.url}`);
    console.log(`[getMe] Cookies: ${cookies}`);
    const session = await getSession(request);
    console.log(`[getMe] Session found:`, session ? { userId: session.userId, isAdmin: session.isAdmin } : null);
    if (!session) return null;
    return {
      ...session.user,
      isAdmin: session.isAdmin,
    };
  } catch (err: any) {
    console.error('[getMe] Unexpected error checking session:', err.message || err);
    return null;
  }
});

export const Route = createFileRoute('/api/me')({
  loader: () => getMe(),
});

