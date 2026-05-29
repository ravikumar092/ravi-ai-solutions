import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookCallModal } from "@/components/site/BookCallModal";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/settings.functions";
import { 
  Briefcase, 
  Cpu, 
  Terminal, 
  Workflow, 
  Award, 
  ArrowRight, 
  Code, 
  ChevronRight,
  Database,
  Layers,
  MessageSquare
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Ravi Kumar — AI Architect & Solo Builder" },
      { name: "description", content: "Learn about Ravi Kumar, a full-stack engineer and AI automation architect with 13+ years of experience building autonomous systems." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [modal, setModal] = useState(false);
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings?.founder_name) {
      document.title = `About ${settings.founder_name} — AI Architect & Builder`;
    }
  }, [settings]);

  const founderName = settings?.founder_name || "Ravi Kumar";
  const founderBio = settings?.founder_bio || "13+ years of full-stack engineering across startups and digital enterprise models. Today, I build and document autonomous systems to help creators, freelancers, and builders work smarter and unlock solo business scale.";
  const siteName = settings?.site_name || "Ravi Kumar AI Lab";
  const aboutHeadline = settings?.about_headline || "Designing Autonomous Systems that work while you sleep.";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 pt-28 pb-16 px-6 max-w-7xl mx-auto w-full space-y-24">
        
        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider">
              <Award size={13} className="animate-pulse" /> AI Architect & Solo Builder
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {aboutHeadline}
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-light">
              Hi, I'm <span className="text-foreground font-semibold">{founderName}</span>. {founderBio}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button variant="hero" onClick={() => setModal(true)} className="gap-2">
                Book a Strategy Call <ArrowRight size={15} />
              </Button>
              <a href="/tools">
                <Button variant="outlineNeon" className="gap-2">
                  Explore Free AI Tools <ChevronRight size={15} />
                </Button>
              </a>
            </div>
          </div>

          {/* Profile Photo Display */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group max-w-sm w-full">
              {/* Outer Glowing Border Effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary to-violet-600 opacity-30 blur-lg group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
                <img 
                  src="/founder.jpg" 
                  alt={founderName} 
                  className="w-full h-auto aspect-square object-cover object-top scale-100 group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Visual Label overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-6 pt-12">
                  <p className="text-lg font-display font-bold text-foreground leading-none">{founderName}</p>
                  <p className="text-xs text-primary mt-1 font-mono">13+ Years Full-Stack Engineering</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS / HIGHLIGHTS SECTION */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard number="13+" label="Years of Engineering" />
          <StatCard number="500+" label="Workflows Designed" />
          <StatCard number="3.5k+" label="Playbook Readers" />
          <StatCard number="2k+" label="Community Members" />
        </section>

        {/* CORE EXPERTISE */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">Capabilities</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              My Core <span className="neon-text">Expertise & Stack</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              We construct modular, resilient automation systems and agent networks tailored to eliminate business overhead.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ExpertiseCard 
              icon={<Workflow className="text-primary" size={24} />} 
              title="Workflow Automation" 
              desc="Constructing self-healing pipelines in n8n, Make.com, and Zapier to sync databases, handle leads, and automate client onboarding."
              tools={["n8n", "Make.com", "Zapier", "Webhooks"]}
            />
            <ExpertiseCard 
              icon={<Cpu className="text-primary" size={24} />} 
              title="AI & Agentic Workflows" 
              desc="Deploying intelligent agents, custom prompt engineering, vector databases, and RAG architectures using OpenAI, Anthropic, and LlamaIndex."
              tools={["GPT-4o", "Claude 3.5", "Pinecone", "LangChain"]}
            />
            <ExpertiseCard 
              icon={<Terminal className="text-primary" size={24} />} 
              title="Full-Stack Custom Code" 
              desc="Writing robust, high-performance APIs and integrations. Creating custom scripts to scrape, process, and structure complex datasets."
              tools={["TypeScript", "Node.js", "Python", "Supabase"]}
            />
          </div>
        </section>

        {/* JOURNEY / TIMELINE */}
        <section className="space-y-12 bg-card/15 border border-border/80 rounded-2xl p-8 md:p-12 backdrop-blur">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary">The Timeline</p>
            <h2 className="font-display text-3xl font-bold tracking-tight">The Builder Journey</h2>
            <p className="text-sm text-muted-foreground">
              A quick overview of my path from writing standard enterprise code to building independent AI engines.
            </p>
          </div>

          <div className="relative border-l border-border pl-6 space-y-8 max-w-4xl ml-2">
            <TimelineItem 
              year="2023 - Present" 
              title={`Founder, ${siteName}`} 
              desc="Building autonomous workflows and customizable business templates. Running an educational academy and a community of 2,000+ builders learning to scale using AI-first systems."
            />
            <TimelineItem 
              year="2018 - 2023" 
              title="Enterprise Solution Architect" 
              desc="Designed API integration systems, multi-platform scrapers, and customer pipelines for digital enterprise brands, processing millions of data events monthly."
            />
            <TimelineItem 
              year="2013 - 2018" 
              title="Full-Stack Engineer" 
              desc="Shipped backend models, dashboard UI interfaces, and Postgres database architectures across multiple startup environments."
            />
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="bg-gradient-to-r from-card/80 to-primary/5 border border-border rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6 backdrop-blur">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <MessageSquare size={24} className="animate-bounce" />
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Have a workflow bottleneck you need solved?</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Whether you need to scrap data, link your CRM to n8n, or set up self-answering support bots, let's co-design a solution.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="hero" onClick={() => setModal(true)} className="gap-2 mx-auto">
              Schedule Your Strategy Audit <ArrowRight size={15} />
            </Button>
          </div>
        </section>

      </main>

      <Footer />
      <BookCallModal open={modal} onOpenChange={setModal} defaultService="Strategy Consultation" />
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-card/30 border border-border rounded-xl p-6 text-center backdrop-blur">
      <p className="text-3xl md:text-4xl font-display font-extrabold neon-text">{number}</p>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase">{label}</p>
    </div>
  );
}

interface ExpertiseCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tools: string[];
}

function ExpertiseCard({ icon, title, desc, tools }: ExpertiseCardProps) {
  return (
    <div className="bg-card/40 border border-border hover:border-primary/25 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur group">
      <div className="space-y-4">
        <div className="inline-flex p-3 rounded-lg bg-primary/5 border border-primary/15">
          {icon}
        </div>
        <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-border/40">
        <div className="flex flex-wrap gap-1.5">
          {tools.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[9px] border border-border/50 bg-muted/30 rounded text-muted-foreground font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ year, title, desc }: { year: string; title: string; desc: string }) {
  return (
    <div className="relative group">
      {/* Visual Dot on Timeline Line */}
      <div className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-border border border-background group-hover:bg-primary group-hover:border-primary/50 transition-colors duration-200" />
      
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-primary font-mono tracking-wider uppercase">{year}</span>
        <h4 className="font-display text-base font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">{desc}</p>
      </div>
    </div>
  );
}
