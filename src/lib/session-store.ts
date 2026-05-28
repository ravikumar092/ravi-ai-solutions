import { supabaseAdmin } from '@/integrations/supabase/admin-client';

// ─── Supabase-backed session store ───────────────────────────────────────────
// Replaces the in-memory + file-system store that broke on Vercel serverless
// (each cold-start had an empty Map and couldn't write to the read-only FS).
// Sessions are stored in the `sessions` table in Supabase, which is shared
// across all serverless function instances.
// ─────────────────────────────────────────────────────────────────────────────

export async function getLocalSession(sid: string): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('sess, expire')
      .eq('sid', sid)
      .single();

    if (error || !data) return null;

    // Check expiry
    if (new Date(data.expire).getTime() < Date.now()) {
      // Expired — delete async, don't await
      deleteLocalSession(sid).catch(() => {});
      return null;
    }

    return data.sess;
  } catch (err) {
    console.error('[session-store] getLocalSession error:', err);
    return null;
  }
}

export async function saveLocalSession(sid: string, sess: any, expire: Date): Promise<void> {
  try {
    await supabaseAdmin
      .from('sessions')
      .upsert({ sid, sess, expire: expire.toISOString() }, { onConflict: 'sid' });
  } catch (err) {
    console.error('[session-store] saveLocalSession error:', err);
  }
}

export async function deleteLocalSession(sid: string): Promise<void> {
  try {
    await supabaseAdmin.from('sessions').delete().eq('sid', sid);
  } catch (err) {
    console.error('[session-store] deleteLocalSession error:', err);
  }
}
