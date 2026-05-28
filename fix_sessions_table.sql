-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Create sessions table for persistent Supabase-backed session storage
-- This replaces the broken in-memory / local-file session store that caused
-- intermittent Unauthorized errors on Vercel serverless deployments.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sessions (
  sid TEXT PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast expiry cleanup
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON public.sessions (expire);

-- Disable RLS (sessions accessed server-side only via service role)
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT COUNT(*) AS session_count FROM public.sessions;
