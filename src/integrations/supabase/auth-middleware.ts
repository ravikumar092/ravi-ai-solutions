export async function requireAdminAuth(): Promise<{ userId: string }> {
  // Use getRequest (the correct TanStack Start API); getWebRequest does not exist.
  const { getRequest } = await import('@tanstack/react-start/server');
  const { getSession } = await import('../../lib/replit-auth.server');
  const request = getRequest();
  console.log(`[auth-middleware] requireAdminAuth check. Request URL: ${request.url}`);
  try {
    const session = await getSession(request);
    console.log(`[auth-middleware] requireAdminAuth session:`, session);
    if (!session?.userId) {
      console.log(`[auth-middleware] Unauthorized: no userId`);
      throw new Error('Unauthorized');
    }
    if (!session.isAdmin) {
      console.log(`[auth-middleware] Forbidden: not admin`);
      throw new Error('Forbidden: admin required');
    }
    return { userId: session.userId };
  } catch (err: any) {
    console.error(`[auth-middleware] requireAdminAuth error:`, err.message || err);
    throw err;
  }
}

export { requireAdminAuth as requireSupabaseAuth };
