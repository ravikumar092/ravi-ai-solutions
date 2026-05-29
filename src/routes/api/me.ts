import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getSession } from '../../lib/replit-auth.server';

function addLog(msg: string) {
  console.log(msg);
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).__server_logs) {
      (globalThis as any).__server_logs = [];
    }
    (globalThis as any).__server_logs.push(`[${new Date().toISOString()}] ${msg}`);
  }
}

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const request = getRequest();
    const cookies = request.headers.get('cookie') ?? '';
    addLog(`[getMe] Request URL: ${request.url}`);
    addLog(`[getMe] Cookies: ${cookies}`);
    const session = await getSession(request);
    addLog(`[getMe] Session found: ${session ? JSON.stringify({ userId: session.userId, isAdmin: session.isAdmin }) : "null"}`);
    if (!session) return null;
    return {
      ...session.user,
      isAdmin: session.isAdmin,
    };
  } catch (err: any) {
    addLog(`[getMe] Unexpected error checking session: ${err.message || err}`);
    return null;
  }
});

export const Route = createFileRoute('/api/me')({
  loader: () => getMe(),
});

