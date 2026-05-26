-- Create automations table
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'leads' | 'ai-agents' | 'social' | 'ops'
  platform TEXT NOT NULL, -- 'n8n' | 'Make.com'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hours_saved TEXT NOT NULL,
  complexity TEXT NOT NULL, -- 'Beginner' | 'Intermediate' | 'Advanced'
  integrations TEXT[] NOT NULL DEFAULT '{}',
  downloads TEXT NOT NULL DEFAULT '0+',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Policies for automations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automations' AND policyname = 'Anyone views active automations') THEN
        CREATE POLICY "Anyone views active automations" ON public.automations FOR SELECT
          USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automations' AND policyname = 'Admins insert automations') THEN
        CREATE POLICY "Admins insert automations" ON public.automations FOR INSERT
          WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automations' AND policyname = 'Admins update automations') THEN
        CREATE POLICY "Admins update automations" ON public.automations FOR UPDATE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automations' AND policyname = 'Admins delete automations') THEN
        CREATE POLICY "Admins delete automations" ON public.automations FOR DELETE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

DROP TRIGGER IF EXISTS automations_updated_at ON public.automations;
CREATE TRIGGER automations_updated_at BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed automations
INSERT INTO public.automations (id, category, platform, title, description, hours_saved, complexity, integrations, downloads, sort_order)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'leads',
    'n8n',
    'AI Real Estate Lead Scraper & Scorer',
    'Monitors new Zillow/Redfin property listings, passes data to OpenAI to evaluate rental yield potential, and pushes hot opportunities directly to a Notion table.',
    '12 hrs/week',
    'Intermediate',
    ARRAY['n8n', 'Zillow API', 'OpenAI', 'Notion'],
    '420+',
    10
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'leads',
    'n8n',
    'LinkedIn Inbound Lead Response Agent',
    'Listens for new LinkedIn connection notes, pulls their profile summary, generates a custom icebreaker via Claude 3.5, and saves draft replies to Notion for approval.',
    '8 hrs/week',
    'Advanced',
    ARRAY['n8n', 'LinkedIn API', 'Claude', 'Notion', 'Slack'],
    '285+',
    20
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'social',
    'Make.com',
    'GPT-4 Twitter & LinkedIn Syndicate',
    'Takes a raw brain dump from Google Keep, automatically splits it into a Twitter thread and a structured LinkedIn post, runs formatting checks, and schedules it in Buffer.',
    '6 hrs/week',
    'Beginner',
    ARRAY['Make.com', 'Google Keep', 'OpenAI', 'Buffer', 'Twitter'],
    '610+',
    30
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'ops',
    'n8n',
    'Self-Healing Customer Support Router',
    'Parses inbound emails, extracts sentiment and key topics, drafts a suggested email response using your knowledgebase vector store, and alerts you on Telegram if urgent.',
    '15 hrs/week',
    'Advanced',
    ARRAY['n8n', 'Supabase Vector', 'OpenAI', 'SendGrid', 'Telegram'],
    '198+',
    40
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'ai-agents',
    'n8n',
    'Autonomous Invoice & Classifier',
    'Triggered whenever an attachment lands in a dedicated Gmail inbox. Uses GPT-4o Vision to extract total, vendor, and tax, then uploads details directly to QuickBooks.',
    '10 hrs/week',
    'Intermediate',
    ARRAY['n8n', 'Gmail API', 'GPT-4o Vision', 'QuickBooks'],
    '340+',
    50
  )
ON CONFLICT (id) DO NOTHING;


-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  desc TEXT NOT NULL,
  level TEXT NOT NULL, -- 'Beginner' | 'Intermediate' | 'Advanced'
  duration TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies for courses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Anyone views active courses') THEN
        CREATE POLICY "Anyone views active courses" ON public.courses FOR SELECT
          USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Admins insert courses') THEN
        CREATE POLICY "Admins insert courses" ON public.courses FOR INSERT
          WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Admins update courses') THEN
        CREATE POLICY "Admins update courses" ON public.courses FOR UPDATE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Admins delete courses') THEN
        CREATE POLICY "Admins delete courses" ON public.courses FOR DELETE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  content TEXT NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies for lessons
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Anyone views lessons of active courses') THEN
        CREATE POLICY "Anyone views lessons of active courses" ON public.lessons FOR SELECT
          USING (EXISTS (
            SELECT 1 FROM public.courses WHERE id = lessons.course_id AND (is_active = true OR public.has_role(auth.uid(), 'admin'))
          ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins insert lessons') THEN
        CREATE POLICY "Admins insert lessons" ON public.lessons FOR INSERT
          WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins update lessons') THEN
        CREATE POLICY "Admins update lessons" ON public.lessons FOR UPDATE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins delete lessons') THEN
        CREATE POLICY "Admins delete lessons" ON public.lessons FOR DELETE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

DROP TRIGGER IF EXISTS lessons_updated_at ON public.lessons;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed Courses
INSERT INTO public.courses (id, title, desc, level, duration, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'n8n Automation Mastery', 'Learn to build self-healing backend workflows, sync custom databases, and connect APIs like a professional software engineer without writing complex code.', 'Intermediate', '4h 15m', 10),
  ('30000000-0000-0000-0000-000000000002', 'AI Agents & Custom LLM Orchestration', 'Architect custom multi-agent networks using LangChain and CrewAI. Implement sequential reasoning, planning modules, and autonomous research cycles.', 'Advanced', '5h 40m', 20),
  ('30000000-0000-0000-0000-000000000003', 'The Ravi Kumar AI Lab System', 'Learn to build landing pages that convert, capture leads into CRM pipelines, configure waitlists, and setup Stripe monetization for zero overhead.', 'Beginner', '2h 50m', 30)
ON CONFLICT (id) DO NOTHING;

-- Seed Lessons
INSERT INTO public.lessons (id, course_id, title, duration, content, locked, sort_order)
VALUES
  -- n8n mastery lessons
  ('30000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000001', 'Introduction to n8n & Node Architecture', '15 mins', 'In this lesson, you will learn the fundamental anatomy of an n8n node, triggers, actions, and how data schemas are passed from step to step in JSON format. We will set up your first local Docker instance of n8n.', false, 10),
  ('30000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000001', 'Connecting Third-Party APIs (Notion, Slack)', '45 mins', 'Learn how to configure OAuth credentials, save API authorization keys, and write simple JSON payloads to trigger Slack notifications and Notion database page creation automatically on webhook events.', false, 20),
  ('30000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000001', 'Advanced Error Handling & Webhooks', '50 mins', 'Master error-catch nodes in n8n. If an external API fails, learn how to configure automated retry logic, save logs to Supabase, and send alert emails to keep your business workflows self-healing.', false, 30),
  ('30000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000001', 'Deploying n8n to Production (Self-Hosted Docker)', '1h 10m', 'Locked Content. Upgrade to Pro in our Store tab to unlock deployment secrets using Docker Compose, SSL certification setup, and database backup scripts on digital servers.', true, 40),

  -- AI agents lessons
  ('30000000-0000-0000-0000-000000000201', '30000000-0000-0000-0000-000000000002', 'Introduction to LLM Agent Reasonings', '30 mins', 'Learn about the ReAct framework, structured prompting, and configuring agent memory buffers. Understand when to use simple linear pipelines vs. dynamic agent loops.', false, 10),
  ('30000000-0000-0000-0000-000000000202', '30000000-0000-0000-0000-000000000002', 'Building Multi-Agent Teams with CrewAI', '1h 20m', 'Locked Content. Upgrade to Pro to learn how to assign distinct roles, backstories, and specific toolsets to separate collaborative AI agents to solve complex developer research tasks.', true, 20),
  ('30000000-0000-0000-0000-000000000203', '30000000-0000-0000-0000-000000000002', 'Deploying Custom Agents to Slack & Discord', '1h 45m', 'Locked Content. Complete guide on hosting your Python agentic backend, listening to Slack events, and replying asynchronously with formatting.', true, 30),

  -- Solo founder lessons
  ('30000000-0000-0000-0000-000000000301', '30000000-0000-0000-0000-000000000003', 'Designing Landing Pages that Convert', '40 mins', 'Step-by-step analysis of landing page structure. We cover visual branding, credibility components, Bento grid styling, and embedding waitlist call-to-actions to capture user emails immediately.', false, 10),
  ('30000000-0000-0000-0000-000000000302', '30000000-0000-0000-0000-000000000003', 'Setting up Waitlists & Leads Capture CRM', '35 mins', 'We create a Supabase database client, set up custom public API handlers, and route submissions to the admin dashboard, verifying database schemas and configurations.', false, 20),
  ('30000000-0000-0000-0000-000000000303', '30000000-0000-0000-0000-000000000003', 'Integrating Stripe Checkout & Monetization', '55 mins', 'Setup Stripe developer keys, configure product line items, launch customer portal access, and handle paid webhook events to automatically deliver downloads to buyers.', false, 30)
ON CONFLICT (id) DO NOTHING;


-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Policies for community_posts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Anyone views active community posts') THEN
        CREATE POLICY "Anyone views active community posts" ON public.community_posts FOR SELECT
          USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Anyone inserts community posts') THEN
        CREATE POLICY "Anyone inserts community posts" ON public.community_posts FOR INSERT
          WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Admins update community posts') THEN
        CREATE POLICY "Admins update community posts" ON public.community_posts FOR UPDATE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Admins delete community posts') THEN
        CREATE POLICY "Admins delete community posts" ON public.community_posts FOR DELETE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

DROP TRIGGER IF EXISTS community_posts_updated_at ON public.community_posts;
CREATE TRIGGER community_posts_updated_at BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed community_posts
INSERT INTO public.community_posts (id, author, avatar, role, content, likes, comments_count, created_at)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    'Alex Rivers',
    'AR',
    'SaaS Builder',
    '🚀 Just launched my waitlist page and captured 84 signups in the first 24 hours. The n8n auto-responder email workflow works like magic. Huge thanks to Ravi Kumar''s tutorial on connecting Resend + Google Sheets!',
    18,
    3,
    now() - INTERVAL '2 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Maria Chen',
    'MC',
    'Agency Founder',
    'Quick question for the group: What''s your average monthly server cost for running self-hosted n8n instances on Railway or Render? Trying to optimize my retainer margins for Q3.',
    12,
    9,
    now() - INTERVAL '5 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'David Vance',
    'DV',
    'Indie Creator',
    'Sharing my win: Signed my second consulting client for $1,200/mo to automate their lead pipeline. Leveraging templates and AI agents makes delivery super fast. Keep building, guys!',
    31,
    5,
    now() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;
