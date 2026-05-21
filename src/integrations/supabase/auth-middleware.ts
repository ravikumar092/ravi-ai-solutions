export async function requireAdminAuth(): Promise<{ userId: string }> {
  const { getWebRequest } = await import('@tanstack/react-start/server');
  const { getSession } = await import('../../lib/replit-auth-db');
  const request = getWebRequest();
  const session = await getSession(request);
  if (!session?.userId) throw new Error('Unauthorized');
  if (!session.isAdmin) throw new Error('Forbidden: admin required');
  return { userId: session.userId };
}

export { requireAdminAuth as requireSupabaseAuth };
