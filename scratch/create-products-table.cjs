module.paths.push('c:\\Users\\ravik\\Downloads\\ravi-ai-solutions-1zip\\ravi-ai-solutions-1zip\\node_modules');
const pg = require('pg');
const { Pool } = pg;

// We will try connecting with multiple host configurations.
const hosts = [
  "postgresql://postgres:HXFv2MCe9Ao6bBxq@db.kebcvsamtudldsztgivh.supabase.co:6543/postgres?sslmode=require",
  "postgresql://postgres:HXFv2MCe9Ao6bBxq@[2406:da14:1d62:b400:5a8e:a383:f384:e8b2]:5432/postgres"
];

async function run() {
  let pool;
  let connected = false;

  for (const connStr of hosts) {
    try {
      console.log('Attempting connection to:', connStr.replace('HXFv2MCe9Ao6bBxq', '****'));
      pool = new Pool({
        connectionString: connStr,
        ssl: connStr.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined
      });
      const res = await pool.query('SELECT NOW()');
      console.log('Connected successfully! DB time:', res.rows[0].now);
      connected = true;
      break;
    } catch (e) {
      console.warn('Connection failed:', e.message);
      if (pool) {
        await pool.end();
      }
    }
  }

  if (!connected) {
    console.error('All connection attempts failed.');
    process.exit(1);
  }

  try {
    console.log('Creating table public.products...');
    await pool.query(`
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
    `);

    console.log('Enabling Row Level Security...');
    await pool.query(`ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`);

    console.log('Creating RLS policies...');
    await pool.query(`
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
    `);

    console.log('Setting up updated_at trigger...');
    await pool.query(`
      DROP TRIGGER IF EXISTS products_updated_at ON public.products;
      CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    `);

    console.log('Seeding initial products...');
    const initialProducts = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        category: 'info',
        title: 'The Ravi Kumar AI Lab Playbook',
        description: 'Our comprehensive guide to launching, operating, and scaling a single-person business. From zero to $10k/month system design.',
        price: 'FREE',
        badge: 'Best Seller',
        icon: 'BookOpen',
        icon_color: 'text-green-400',
        features: [
          'Step-by-step validation frameworks',
          'List of 50+ micro-niche ideas',
          'Operational templates & legal guide',
          'Lifetime updates and notifications'
        ],
        cta: 'Download Free PDF',
        sort_order: 10
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        category: 'blueprint',
        title: 'n8n Lead Generator Workflow',
        description: 'A complete pre-packaged n8n blueprint that monitors Zillow/LinkedIn, scores leads using OpenAI, and pushes them to Notion.',
        price: '$29',
        badge: 'Developer Bundle',
        icon: 'Workflow',
        icon_color: 'text-cyan-400',
        features: [
          'Ready-to-import JSON file',
          'Detailed video walkthrough setup',
          'Google Sheets & Notion config schemas',
          'Includes GPT prompt scoring templates'
        ],
        cta: 'Get Import Key',
        sort_order: 20
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        category: 'blueprint',
        title: 'Make.com Social Auto-Scheduler',
        description: 'Schedule, format, and syndicate content across Twitter, LinkedIn, and YouTube using automated GPT pipelines.',
        price: '$19',
        badge: 'Automation Tool',
        icon: 'Zap',
        icon_color: 'text-orange-400',
        features: [
          'Make.com blueprint file',
          'Integrates with Airtable database',
          'Dynamic hook generator integration',
          'Step-by-step setup documentation'
        ],
        cta: 'Get Blueprint',
        sort_order: 30
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        category: 'consulting',
        title: '1-on-1 Strategy Session',
        description: 'A deep dive 60-minute strategy call with Ravi Kumar to architect your systems, debug automation, or build marketing pipelines.',
        price: '$49',
        badge: 'Limited Slots',
        icon: 'MessageSquare',
        icon_color: 'text-violet-400',
        features: [
          '60-minute private Zoom call',
          'Full video recording + transcript',
          'Custom system architecture draft',
          'Follow-up Notion action board'
        ],
        cta: 'Schedule Call',
        sort_order: 40
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        category: 'consulting',
        title: 'Enterprise Agentic System Build',
        description: 'Get a custom AI system, complex database orchestration, or custom agent flow built specifically for your business workflow.',
        price: 'Custom',
        badge: 'Premium Tier',
        icon: 'ShieldCheck',
        icon_color: 'text-yellow-400',
        features: [
          'Full workflow requirements audit',
          'Custom LangChain or CrewAI backend',
          'Integration with existing dashboards',
          '1 month dedicated post-handoff support'
        ],
        cta: 'Get a Quote',
        sort_order: 50
      }
    ];

    for (const prod of initialProducts) {
      await pool.query(`
        INSERT INTO public.products (id, category, title, description, price, badge, icon, icon_color, features, cta, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          badge = EXCLUDED.badge,
          icon = EXCLUDED.icon,
          icon_color = EXCLUDED.icon_color,
          features = EXCLUDED.features,
          cta = EXCLUDED.cta,
          sort_order = EXCLUDED.sort_order;
      `, [
        prod.id,
        prod.category,
        prod.title,
        prod.description,
        prod.price,
        prod.badge,
        prod.icon,
        prod.icon_color,
        prod.features,
        prod.cta,
        prod.sort_order
      ]);
    }

    console.log('Seeding successfully completed!');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
