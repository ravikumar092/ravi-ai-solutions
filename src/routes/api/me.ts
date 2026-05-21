import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getSession } from '../../lib/replit-auth.server';

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) return null;
    return session.user;
  } catch {
    return null;
  }
});

export const Route = createFileRoute('/api/me')({
  loader: () => getMe(),
});
