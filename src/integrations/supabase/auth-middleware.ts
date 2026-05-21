import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getSession } from '../../lib/replit-auth-db';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await getSession(request);

    if (!session?.userId) {
      throw new Error('Unauthorized');
    }

    if (!session.isAdmin) {
      throw new Error('Forbidden: admin required');
    }

    return next({
      context: {
        supabase: null,
        userId: session.userId,
        claims: { sub: session.userId },
      },
    });
  },
);

export { requireSupabaseAuth as requireAdminAuth };
