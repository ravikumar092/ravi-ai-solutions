import { supabaseAdmin } from '@/integrations/supabase/admin-client';

// ─── Supabase-backed session store ───────────────────────────────────────────
// Replaces the in-memory + file-system store that broke on Vercel serverless
// (each cold-start had an empty Map and couldn't write to the read-only FS).
// Sessions are stored in the `sessions` table in Supabase, which is shared
// across all serverless function instances.
// ─────────────────────────────────────────────────────────────────────────────

function addLog(msg: string) {
  console.log(msg);
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).__server_logs) {
      (globalThis as any).__server_logs = [];
    }
    (globalThis as any).__server_logs.push(`[${new Date().toISOString()}] ${msg}`);
  }
}

export async function getLocalSession(sid: string): Promise<any | null> {
  try {
    addLog(`[session-store] getLocalSession querying sid: ${sid}`);
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('sess, expire')
      .eq('sid', sid)
      .single();

    if (error) {
      addLog(`[session-store] Supabase getLocalSession error: ${error.message || error}`);
      return null;
    }
    if (!data) {
      addLog(`[session-store] No session data found in Supabase for sid: ${sid}`);
      return null;
    }

    addLog(`[session-store] Found data in Supabase: sess=${JSON.stringify(data.sess)}, expire=${data.expire}`);

    // Check expiry
    if (new Date(data.expire).getTime() < Date.now()) {
      addLog(`[session-store] Session expired for sid: ${sid}`);
      // Expired — delete async, don't await
      deleteLocalSession(sid).catch(() => {});
      return null;
    }

    return data.sess;
  } catch (err: any) {
    addLog(`[session-store] getLocalSession exception: ${err.message || err}`);
    return null;
  }
}

export async function saveLocalSession(sid: string, sess: any, expire: Date): Promise<void> {
  try {
    addLog(`[session-store] saveLocalSession saving sid: ${sid}, sess=${JSON.stringify(sess)}, expire=${expire.toISOString()}`);
    const { error } = await supabaseAdmin
      .from('sessions')
      .upsert({ sid, sess, expire: expire.toISOString() }, { onConflict: 'sid' });
    if (error) {
      addLog(`[session-store] Supabase saveLocalSession error: ${error.message || error}`);
    } else {
      addLog(`[session-store] Supabase saveLocalSession success for sid: ${sid}`);
    }
  } catch (err: any) {
    addLog(`[session-store] saveLocalSession exception: ${err.message || err}`);
  }
}

export async function deleteLocalSession(sid: string): Promise<void> {
  try {
    addLog(`[session-store] deleteLocalSession deleting sid: ${sid}`);
    const { error } = await supabaseAdmin.from('sessions').delete().eq('sid', sid);
    if (error) {
      addLog(`[session-store] Supabase deleteLocalSession error: ${error.message || error}`);
    } else {
      addLog(`[session-store] Supabase deleteLocalSession success for sid: ${sid}`);
    }
  } catch (err: any) {
    addLog(`[session-store] deleteLocalSession exception: ${err.message || err}`);
  }
}
