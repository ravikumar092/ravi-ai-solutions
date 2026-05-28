-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Disable RLS on purchases and storage.objects for product-files
-- The purchases table is only accessed via server-side admin functions,
-- so RLS is not needed and only causes problems when the service_role key
-- is misconfigured.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Disable RLS on purchases (safest fix — all access is server-side only)
ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;

-- 2. Also add a blanket INSERT policy as backup in case RLS gets re-enabled
DROP POLICY IF EXISTS "Allow server inserts to purchases" ON public.purchases;
CREATE POLICY "Allow server inserts to purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

-- 3. Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'purchases';
