import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookCallModal } from "@/components/site/BookCallModal";
import { Button } from "@/components/ui/button";
import { Workflow, Sparkles, Database, ArrowRight, ShieldCheck, Download, Code, Play } from "lucide-react";
import { getSettings } from "@/lib/settings.functions";
import { listPublicAutomations } from "@/lib/automations.functions";

export const Route = createFileRoute("/automations")({
  head: () => ({
    meta: [
      { title: "Automation Marketplace — Ravi Kumar AI Lab" },
      { name: "description", content: "Download and deploy premium n8n and Make workflows to automate your marketing, sales, and operations." },
    ],
  }),
  component: AutomationsMarketplace,
});

type AutoCategory = "all" | "leads" | "ai-agents" | "social" | "ops";

const AUTOMATIONS = [
  {
    id: "auto-zillow-notion",
    category: "leads",
    platform: "n8n",
    title: "AI Real Estate Lead Scraper & Scorer",
    description: "Monitors new Zillow/Redfin property listings, passes data to OpenAI to evaluate rental yield potential, and pushes hot opportunities directly to a Notion table.",
    hoursSaved: "12 hrs/week",
    complexity: "Intermediate",
    integrations: ["n8n", "Zillow API", "OpenAI", "Notion"],
    downloads: "420+",
  },
  {
    id: "auto-linkedin-responder",
    category: "leads",
    platform: "n8n",
    title: "LinkedIn Inbound Lead Response Agent",
    description: "Listens for new LinkedIn connection notes, pulls their profile summary, generates a custom icebreaker via Claude 3.5, and saves draft replies to Notion for approval.",
    hoursSaved: "8 hrs/week",
    complexity: "Advanced",
    integrations: ["n8n", "LinkedIn API", "Claude", "Notion", "Slack"],
    downloads: "285+",
  },
  {
    id: "auto-social-scheduler",
    category: "social",
    platform: "Make.com",
    title: "GPT-4 Twitter & LinkedIn Syndicate",
    description: "Takes a raw brain dump from Google Keep, automatically splits it into a Twitter thread and a structured LinkedIn post, runs formatting checks, and schedules it in Buffer.",
    hoursSaved: "6 hrs/week",
    complexity: "Beginner",
    integrations: ["Make.com", "Google Keep", "OpenAI", "Buffer", "Twitter"],
    downloads: "610+",
  },
  {
    id: "auto-support-ticket",
    category: "ops",
    platform: "n8n",
    title: "Self-Healing Customer Support Router",
    description: "Parses inbound emails, extracts sentiment and key topics, drafts a suggested email response using your knowledgebase vector store, and alerts you on Telegram if urgent.",
    hoursSaved: "15 hrs/week",
    complexity: "Advanced",
    integrations: ["n8n", "Supabase Vector", "OpenAI", "SendGrid", "Telegram"],
    downloads: "198+",
  },
  {
    id: "auto-pdf-analyser",
    category: "ai-agents",
    platform: "n8n",
    title: "Autonomous Invoice & Receipt Classifier",
    description: "Triggered whenever an attachment lands in a dedicated Gmail inbox. Uses GPT-4o Vision to extract total, vendor, and tax, then uploads details directly to QuickBooks.",
    hoursSaved: "10 hrs/week",
    complexity: "Intermediate",
    integrations: ["n8n", "Gmail API", "GPT-4o Vision", "QuickBooks"],
    downloads: "340+",
  }
];

function AutomationsMarketplace() {
  const [category, setCategory] = useState<AutoCategory>("all");
  const [modal, setModal] = useState(false);
  const [selectedAuto, setSelectedAuto] = useState("");

  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchAutomations = useServerFn(listPublicAutomations);
  const { data: dbAutomations = [] } = useQuery({
    queryKey: ["public-automations"],
    queryFn: () => fetchAutomations(),
  });

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `Automation Marketplace — ${settings.site_name}`;
    }
  }, [settings]);

  const activeAutomations = dbAutomations.length > 0 ? dbAutomations : AUTOMATIONS;

  const filteredAutomations = activeAutomations.filter(
    (a) => category === "all" || a.category === category
  );

  const handleDeploy = (title: string) => {
    setSelectedAuto(`Automation Deployment: ${title}`);
    setModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Header Block */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">Workflow Directory</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            AI & No-Code <span className="neon-text">Automation Blueprints</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Import tested JSON workflows directly into your n8n or Make.com dashboard. Zero to operational automation in under 10 minutes.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <FilterButton active={category === "all"} onClick={() => setCategory("all")} label="All Blueprints" />
          <FilterButton active={category === "leads"} onClick={() => setCategory("leads")} label="Lead Gen & Outreach" />
          <FilterButton active={category === "ai-agents"} onClick={() => setCategory("ai-agents")} label="AI Agents & RAG" />
          <FilterButton active={category === "social"} onClick={() => setCategory("social")} label="Social & Scraping" />
          <FilterButton active={category === "ops"} onClick={() => setCategory("ops")} label="Business Operations" />
        </div>

        {/* Blueprints Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredAutomations.map((a) => {
            return (
              <div
                key={a.id}
                className="bg-card/40 border border-border hover:border-primary/20 rounded-xl p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur group"
              >
                <div>
                  {/* Top Stats Bar */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                      a.platform === "n8n" ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-violet-500/20 bg-violet-500/5 text-violet-400"
                    }`}>
                      {a.platform}
                    </span>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium px-2 py-0.5 rounded bg-muted/40 border border-border/50">
                        {a.complexity}
                      </span>
                      <span className="font-medium px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10">
                        Saved: {a.hours_saved || (a as any).hoursSaved}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors mb-2 leading-tight">
                    {a.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    {a.description}
                  </p>

                  {/* Integration list */}
                  <div className="mb-6">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2">Integrations:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.integrations.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 text-[10px] border border-border/60 bg-muted/20 rounded text-muted-foreground font-mono"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom interactive row */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Download size={11} /> {a.downloads} downloads
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outlineNeon"
                      size="sm"
                      className="text-xs font-semibold h-8 px-3"
                      onClick={() => handleDeploy(a.title)}
                    >
                      Deploy Blueprint <ArrowRight size={13} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic callout block */}
        <div className="mt-16 bg-card/25 border border-border rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur">
          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Code size={18} className="text-primary animate-pulse" /> Need custom workspace configurations?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              If your database schemas, CRM fields, or custom language models don't match the standard templates, let us build and deploy a bespoke agent system directly on your workspace.
            </p>
          </div>
          <Button
            variant="hero"
            size="sm"
            onClick={() => handleDeploy("Custom Automation Design")}
            className="whitespace-nowrap"
          >
            Hire AI Architect <ArrowRight size={13} className="ml-1.5" />
          </Button>
        </div>
      </main>
      <Footer />
      <BookCallModal open={modal} onOpenChange={setModal} defaultService={selectedAuto} />
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterButton({ active, onClick, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all duration-150 ${
        active
          ? "border-primary/50 bg-primary/8 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
