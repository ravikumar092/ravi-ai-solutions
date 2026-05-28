-- ── MIGRATION 1: Update set_updated_at function ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── MIGRATION 2: Add image_url to services and create videos table ──
-- Add image_url to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active videos" ON public.videos FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert videos" ON public.videos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update videos" ON public.videos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete videos" ON public.videos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── MIGRATION 3: Add admin features, testimonials, faqs, blog_posts, and site_settings ──
-- Leads: add notes column
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  quote TEXT NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active testimonials" ON public.testimonials FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update testimonials" ON public.testimonials FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete testimonials" ON public.testimonials FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active faqs" ON public.faqs FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert faqs" ON public.faqs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update faqs" ON public.faqs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete faqs" ON public.faqs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published posts" ON public.blog_posts FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert posts" ON public.blog_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update posts" ON public.blog_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete posts" ON public.blog_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Default settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('calendly_url', 'https://calendly.com/ravikumar-devforge', 'Calendly booking URL'),
  ('youtube_url', 'https://www.youtube.com/@RaviKumarAILab', 'YouTube channel URL'),
  ('notification_email', '', 'Email address to receive new lead notifications'),
  ('notification_enabled', 'false', 'Send email notification on new lead (true/false)'),
  ('hero_tagline', 'I design and ship AI workflows, agentic pipelines, and custom automation using n8n, Make, LangChain, CrewAI, and more — tailored to your business.', 'Hero section tagline'),
  ('contact_email', '', 'Public contact email shown in footer')
ON CONFLICT (key) DO NOTHING;

-- ── MIGRATION 4: Add products table ──
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  badge TEXT,
  icon TEXT NOT NULL,
  icon_color TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  cta TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone views active products') THEN
        CREATE POLICY "Anyone views active products" ON public.products FOR SELECT
          USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins insert products') THEN
        CREATE POLICY "Admins insert products" ON public.products FOR INSERT
          WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins update products') THEN
        CREATE POLICY "Admins update products" ON public.products FOR UPDATE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins delete products') THEN
        CREATE POLICY "Admins delete products" ON public.products FOR DELETE
          USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.products (id, category, title, description, price, badge, icon, icon_color, features, cta, sort_order)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'info',
    'The Ravi Kumar AI Lab Playbook',
    'Our comprehensive guide to launching, operating, and scaling a single-person business. From zero to $10k/month system design.',
    'FREE',
    'Best Seller',
    'BookOpen',
    'text-green-400',
    ARRAY['Step-by-step validation frameworks', 'List of 50+ micro-niche ideas', 'Operational templates & legal guide', 'Lifetime updates and notifications'],
    'Download Free PDF',
    10
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'blueprint',
    'n8n Lead Generator Workflow',
    'A complete pre-packaged n8n blueprint that monitors Zillow/LinkedIn, scores leads using OpenAI, and pushes them to Notion.',
    '$29',
    'Developer Bundle',
    'Workflow',
    'text-cyan-400',
    ARRAY['Ready-to-import JSON file', 'Detailed video walkthrough setup', 'Google Sheets & Notion config schemas', 'Includes GPT prompt scoring templates'],
    'Get Import Key',
    20
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'blueprint',
    'Make.com Social Auto-Scheduler',
    'Schedule, format, and syndicate content across Twitter, LinkedIn, and YouTube using automated GPT pipelines.',
    '$19',
    'Automation Tool',
    'Zap',
    'text-orange-400',
    ARRAY['Make.com blueprint file', 'Integrates with Airtable database', 'Dynamic hook generator integration', 'Step-by-step setup documentation'],
    'Get Blueprint',
    30
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'consulting',
    '1-on-1 Strategy Session',
    'A deep dive 60-minute strategy call with Ravi Kumar to architect your systems, debug automation, or build marketing pipelines.',
    '$49',
    'Limited Slots',
    'MessageSquare',
    'text-violet-400',
    ARRAY['60-minute private Zoom call', 'Full video recording + transcript', 'Custom system architecture draft', 'Follow-up Notion action board'],
    'Schedule Call',
    40
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'consulting',
    'Enterprise Agentic System Build',
    'Get a custom AI system, complex database orchestration, or custom agent flow built specifically for your business workflow.',
    'Custom',
    'Premium Tier',
    'ShieldCheck',
    'text-yellow-400',
    ARRAY['Full workflow requirements audit', 'Custom LangChain or CrewAI backend', 'Integration with existing dashboards', '1 month dedicated post-handoff support'],
    'Get a Quote',
    50
  )
ON CONFLICT (id) DO NOTHING;


-- ── MIGRATION 5: Add automations, courses, lessons, and community_posts ──

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

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

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

INSERT INTO public.automations (id, category, platform, title, description, hours_saved, complexity, integrations, downloads, sort_order)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'leads', 'n8n', 'AI Real Estate Lead Scraper & Scorer', 'Monitors new Zillow/Redfin property listings, passes data to OpenAI to evaluate rental yield potential, and pushes hot opportunities directly to a Notion table.', '12 hrs/week', 'Intermediate', ARRAY['n8n', 'Zillow API', 'OpenAI', 'Notion'], '420+', 10),
  ('20000000-0000-0000-0000-000000000002', 'leads', 'n8n', 'LinkedIn Inbound Lead Response Agent', 'Listens for new LinkedIn connection notes, pulls their profile summary, generates a custom icebreaker via Claude 3.5, and saves draft replies to Notion for approval.', '8 hrs/week', 'Advanced', ARRAY['n8n', 'LinkedIn API', 'Claude', 'Notion', 'Slack'], '285+', 20),
  ('20000000-0000-0000-0000-000000000003', 'social', 'Make.com', 'GPT-4 Twitter & LinkedIn Syndicate', 'Takes a raw brain dump from Google Keep, automatically splits it into a Twitter thread and a structured LinkedIn post, runs formatting checks, and schedules it in Buffer.', '6 hrs/week', 'Beginner', ARRAY['Make.com', 'Google Keep', 'OpenAI', 'Buffer', 'Twitter'], '610+', 30),
  ('20000000-0000-0000-0000-000000000004', 'ops', 'n8n', 'Self-Healing Customer Support Router', 'Parses inbound emails, extracts sentiment and key topics, drafts a suggested email response using your knowledgebase vector store, and alerts you on Telegram if urgent.', '15 hrs/week', 'Advanced', ARRAY['n8n', 'Supabase Vector', 'OpenAI', 'SendGrid', 'Telegram'], '198+', 40),
  ('20000000-0000-0000-0000-000000000005', 'ai-agents', 'n8n', 'Autonomous Invoice & Classifier', 'Triggered whenever an attachment lands in a dedicated Gmail inbox. Uses GPT-4o Vision to extract total, vendor, and tax, then uploads details directly to QuickBooks.', '10 hrs/week', 'Intermediate', ARRAY['n8n', 'Gmail API', 'GPT-4o Vision', 'QuickBooks'], '340+', 50)
ON CONFLICT (id) DO NOTHING;


-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  level TEXT NOT NULL,
  duration TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

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
INSERT INTO public.courses (id, title, "desc", level, duration, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'n8n Automation Mastery', 'Learn to build self-healing backend workflows, sync custom databases, and connect APIs like a professional software engineer without writing complex code.', 'Intermediate', '4h 15m', 10),
  ('30000000-0000-0000-0000-000000000002', 'AI Agents & Custom LLM Orchestration', 'Architect custom multi-agent networks using LangChain and CrewAI. Implement sequential reasoning, planning modules, and autonomous research cycles.', 'Advanced', '5h 40m', 20),
  ('30000000-0000-0000-0000-000000000003', 'The Ravi Kumar AI Lab System', 'Learn to build landing pages that convert, capture leads into CRM pipelines, configure waitlists, and setup Stripe monetization for zero overhead.', 'Beginner', '2h 50m', 30)
ON CONFLICT (id) DO NOTHING;

-- Seed Lessons
INSERT INTO public.lessons (id, course_id, title, duration, content, locked, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000001', 'Introduction to n8n & Node Architecture', '15 mins', 'In this lesson, you will learn the fundamental anatomy of an n8n node, triggers, actions, and how data schemas are passed from step to step in JSON format. We will set up your first local Docker instance of n8n.', false, 10),
  ('30000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000001', 'Connecting Third-Party APIs (Notion, Slack)', '45 mins', 'Learn how to configure OAuth credentials, save API authorization keys, and write simple JSON payloads to trigger Slack notifications and Notion database page creation automatically on webhook events.', false, 20),
  ('30000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000001', 'Advanced Error Handling & Webhooks', '50 mins', 'Master error-catch nodes in n8n. If an external API fails, learn how to configure automated retry logic, save logs to Supabase, and send alert emails to keep your business workflows self-healing.', false, 30),
  ('30000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000001', 'Deploying n8n to Production (Self-Hosted Docker)', '1h 10m', 'Locked Content. Upgrade to Pro in our Store tab to unlock deployment secrets using Docker Compose, SSL certification setup, and database backup scripts on digital servers.', true, 40),
  ('30000000-0000-0000-0000-000000000201', '30000000-0000-0000-0000-000000000002', 'Introduction to LLM Agent Reasonings', '30 mins', 'Learn about the ReAct framework, structured prompting, and configuring agent memory buffers. Understand when to use simple linear pipelines vs. dynamic agent loops.', false, 10),
  ('30000000-0000-0000-0000-000000000202', '30000000-0000-0000-0000-000000000002', 'Building Multi-Agent Teams with CrewAI', '1h 20m', 'Locked Content. Upgrade to Pro to learn how to assign distinct roles, backstories, and specific toolsets to separate collaborative AI agents to solve complex developer research tasks.', true, 20),
  ('30000000-0000-0000-0000-000000000203', '30000000-0000-0000-0000-000000000002', 'Deploying Custom Agents to Slack & Discord', '1h 45m', 'Locked Content. Complete guide on hosting your Python agentic backend, listening to Slack events, and replying asynchronously with formatting.', true, 30),
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

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

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

INSERT INTO public.community_posts (id, author, avatar, role, content, likes, comments_count, created_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'Alex Rivers', 'AR', 'SaaS Builder', '🚀 Just launched my waitlist page and captured 84 signups in the first 24 hours. The n8n auto-responder email workflow works like magic. Huge thanks to Ravi Kumar''s tutorial on connecting Resend + Google Sheets!', 18, 3, now() - INTERVAL '2 hours'),
  ('40000000-0000-0000-0000-000000000002', 'Maria Chen', 'MC', 'Agency Founder', 'Quick question for the group: What''s your average monthly server cost for running self-hosted n8n instances on Railway or Render? Trying to optimize my retainer margins for Q3.', 12, 9, now() - INTERVAL '5 hours'),
  ('40000000-0000-0000-0000-000000000003', 'David Vance', 'DV', 'Indie Creator', 'Sharing my win: Signed my second consulting client for $1,200/mo to automate their lead pipeline. Leveraging templates and AI agents makes delivery super fast. Keep building, guys!', 31, 5, now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;


-- ── MIGRATION 4: Set up storage buckets and policies for product-files ──

-- Create the product-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public select access to product-files bucket
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public SELECT access for product-files') THEN
        CREATE POLICY "Public SELECT access for product-files" ON storage.objects FOR SELECT
          USING (bucket_id = 'product-files');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admin CRUD access for product-files') THEN
        CREATE POLICY "Admin CRUD access for product-files" ON storage.objects FOR ALL
          TO authenticated
          USING (bucket_id = 'product-files' AND public.has_role(auth.uid(), 'admin'))
          WITH CHECK (bucket_id = 'product-files' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;



