-- Create products table
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

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Anyone views active products" ON public.products FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert products" ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update products" ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete products" ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial products
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
