-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: purchases table RLS — allow service_role to insert/select/update/delete
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop any conflicting INSERT-blocking policy if it exists
DROP POLICY IF EXISTS "Service role full access to purchases" ON public.purchases;

-- Step 2: Create a permissive policy for the service_role on all operations
CREATE POLICY "Service role full access to purchases"
  ON public.purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Also ensure the SELECT policy for regular users exists (idempotent)
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.purchases
  FOR SELECT
  USING (auth.jwt() ->> 'email' = customer_email OR public.has_role(auth.uid(), 'admin'));

-- Verification: list all policies on purchases table
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'purchases';
