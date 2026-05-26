import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, AlertCircle, BarChart3, Rocket, BadgeHelp, Play, BookOpen, Loader2 } from "lucide-react";
import { getSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "AI Tools Hub — Ravi Kumar AI Lab" },
      { name: "description", content: "Interactive AI generators and validators for solo founders. Generate startup ideas, validate offers, compute SaaS pricing, and outline plans." },
    ],
  }),
  component: ToolsHub,
});

type ToolType = "generator" | "validator" | "calculator" | "planner";

function ToolsHub() {
  const [activeTool, setActiveTool] = useState<ToolType>("generator");
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `AI Tools Hub — ${settings.site_name}`;
    }
    if (settings?.meta_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Title Block */}
        {(() => {
          const toolsTitle = settings?.tools_title || "AI-First Solopreneur Tools";
          const toolsTitleWords = toolsTitle.split(" ");
          const toolsHighlightCount = Math.min(Math.ceil(toolsTitleWords.length * 0.4), 2);
          const toolsMainTitle = toolsTitleWords.slice(0, -toolsHighlightCount).join(" ");
          const toolsHighlightTitle = toolsTitleWords.slice(-toolsHighlightCount).join(" ");

          return (
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">Founder Suite</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {toolsMainTitle}{" "}
                <span className="neon-text">{toolsHighlightTitle}</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {settings?.tools_desc || "Free high-utility calculators and mockup validation streams to speed up your ideation, pricing, and system architectures."}
              </p>
            </div>
          );
        })()}

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <TabButton active={activeTool === "generator"} onClick={() => setActiveTool("generator")} label="Idea Generator" icon={<Sparkles size={14} />} />
          <TabButton active={activeTool === "validator"} onClick={() => setActiveTool("validator")} label="Offer Validator" icon={<CheckCircle2 size={14} />} />
          <TabButton active={activeTool === "calculator"} onClick={() => setActiveTool("calculator")} label="Pricing Calculator" icon={<BarChart3 size={14} />} />
          <TabButton active={activeTool === "planner"} onClick={() => setActiveTool("planner")} label="SaaS Roadmap Planner" icon={<Rocket size={14} />} />
        </div>

        {/* Display Tool */}
        <div className="grid lg:grid-cols-[1fr_450px] gap-8 items-start">
          <div className="bg-card/40 border border-border rounded-xl p-6 md:p-8 backdrop-blur">
            {activeTool === "generator" && <IdeaGenerator />}
            {activeTool === "validator" && <OfferValidator />}
            {activeTool === "calculator" && <PricingCalculator />}
            {activeTool === "planner" && <SaaSPlanner />}
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">About the Hub</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As a solo founder, speed is your unfair advantage. These tools help you formulate hypotheses rapidly, validate cash-flow projections, and design clean tech stacks before writing code.
              </p>
              <div className="flex items-start gap-2.5 text-xs text-primary bg-primary/5 border border-primary/10 rounded-lg p-3">
                <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
                <span>Need a fully custom AI system or custom dashboard database integration? Reach out via our booking menu above!</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resources & Workflows</h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2">
                  <BookOpen size={13} className="text-muted-foreground" />
                  <a href="/products" className="hover:text-primary transition underline underline-offset-2">
                    Download {settings?.ebook_title || "Ravi Kumar AI Lab Playbook"} (Free)
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Play size={13} className="text-muted-foreground" />
                  <a href="/courses" className="hover:text-primary transition underline underline-offset-2">Watch n8n Automation Tutorials</a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all duration-150 ${
        active
          ? "border-primary/50 bg-primary/8 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── TOOL: STARTUP IDEA GENERATOR ── */
function IdeaGenerator() {
  const [niche, setNiche] = useState("");
  const [monetization, setMonetization] = useState("saas");
  const [skills, setSkills] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setOutput("");

    let current = "";
    const segments = [
      `[Analyzing Niche: "${niche}" · Monetization: "${monetization}"]\n\n`,
      `🤖 Ravi Kumar AI Lab AI Engine online...\n`,
      `🔍 Mapping micro-SaaS opportunities for ${niche} creators...\n`,
      `💡 IDEA 1: AI-Powered Niche Validator\n`,
      `   - Value Prop: Scrapes social engagement to score product validation in ${niche}.\n`,
      `   - Tech Stack: n8n, OpenAI Assistant API, Supabase, Next.js.\n`,
      `   - MVP Timeline: 48 hours.\n\n`,
      `💡 IDEA 2: Automations-as-a-Service for ${niche}\n`,
      `   - Value Prop: Pre-packaged workflows that solve the top 3 manual headaches of ${niche} pros.\n`,
      `   - Tech Stack: n8n, Make.com, Notion.\n`,
      `   - Monetization: Buy-once cloneable bundle, or a recurring retainer ($499/mo).\n\n`,
      `⚡ Execution Checklist:\n`,
      `   1. Validate: Set up a landing page with a waitlist form.\n`,
      `   2. Build: Create a working n8n blueprint to prove core tech utility.\n`,
      `   3. Launch: Post a loom breakdown on Twitter/LinkedIn.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < segments.length) {
        current += segments[i];
        setOutput(current);
        i++;
      } else {
        clearInterval(interval);
        setGenerating(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Startup Idea Generator</h2>
        <p className="text-xs text-muted-foreground">Input your target market and skills to output tailored solo-founder opportunities.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Your Target Niche / Market</Label>
          <Input required placeholder="e.g. Real estate agents, local bakeries, video editors" value={niche} onChange={e => setNiche(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Monetization Model</Label>
            <Select value={monetization} onValueChange={setMonetization}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">Micro-SaaS (Monthly Recurring)</SelectItem>
                <SelectItem value="info">Info Product (Ebooks, courses)</SelectItem>
                <SelectItem value="service">Productized Service (Retainer)</SelectItem>
                <SelectItem value="community">Paid Community / Mastermind</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Your Primary Skills</Label>
            <Input placeholder="e.g. Design, n8n, React, SEO" value={skills} onChange={e => setSkills(e.target.value)} />
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={generating} className="w-full gap-2">
          {generating ? <><Loader2 size={14} className="animate-spin" /> Analyzing market...</> : <><Sparkles size={14} /> Generate Idea Stream</>}
        </Button>
      </form>

      {output && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[220px]">
          {output}
        </div>
      )}
    </div>
  );
}

/* ── TOOL: BUSINESS OFFER VALIDATOR ── */
function OfferValidator() {
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setOutput("");

    let current = "";
    const segments = [
      `[Validating Offer: "${offer}" · Audience: "${audience}" · Price: "${price}"]\n\n`,
      `📊 Offer Health Check Index...\n`,
      `✓ Price-to-Value Ratio: Good. Charging ${price} to ${audience} is viable.\n`,
      `⚠️ Friction Point: "${audience}" might have restricted budgets. Highlight time saved and immediate ROI.\n\n`,
      `📈 Score Card:\n`,
      `   - Scalability: 8/10\n`,
      `   - Time leverage: 9/10 (highly automatable with n8n)\n`,
      `   - Market Urgency: 7/10\n\n`,
      `💡 Refinement Recommendation:\n`,
      `   Instead of just offering "${offer}", package it as a guaranteed outcome. e.g. "We deploy a lead response agent that hooks up in 24 hours, or you pay nothing."`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < segments.length) {
        current += segments[i];
        setOutput(current);
        i++;
      } else {
        clearInterval(interval);
        setGenerating(false);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Business Offer Validator</h2>
        <p className="text-xs text-muted-foreground">Test how sellable your digital service or SaaS idea is before investing time building it.</p>
      </div>

      <form onSubmit={handleValidate} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Describe your core offer / product</Label>
          <Textarea required placeholder="e.g. I build n8n automations that scrape LinkedIn leads and write personalized drafts to Notion." value={offer} onChange={e => setOffer(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target Audience</Label>
            <Input required placeholder="e.g. Sales agency owners" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Planned Pricing</Label>
            <Input required placeholder="e.g. $299/mo or $1,500 setup" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={generating} className="w-full gap-2">
          {generating ? <><Loader2 size={14} className="animate-spin" /> Scoring parameters...</> : <><CheckCircle2 size={14} /> Validate Offer</>}
        </Button>
      </form>

      {output && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[180px]">
          {output}
        </div>
      )}
    </div>
  );
}

/* ── TOOL: PRICING CALCULATOR ── */
function PricingCalculator() {
  const [currency, setCurrency] = useState("USD");
  const [traffic, setTraffic] = useState(10000);
  const [conversion, setConversion] = useState(1.5);
  const [price, setPrice] = useState(49);
  const [expenses, setExpenses] = useState(150);

  const signups = Math.round(traffic * (conversion / 100));
  const mrr = signups * price;
  const netProfit = mrr - expenses;
  const breakEvenCustomers = Math.ceil(expenses / price);

  const symbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] || "$";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Pricing & MRR Calculator</h2>
        <p className="text-xs text-muted-foreground">Adjust conversion rates and traffic to calculate your monthly recurring revenue and profit margins.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Select Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full bg-background border-border text-xs">
              <SelectValue placeholder="USD" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Monthly Landing Page Traffic</Label>
          <Input type="number" value={traffic} onChange={e => setTraffic(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Conversion Rate (%)</Label>
          <Input type="number" step="0.1" value={conversion} onChange={e => setConversion(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Monthly Price point ({symbol})</Label>
          <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Monthly Tool / Server Expenses ({symbol})</Label>
          <Input type="number" value={expenses} onChange={e => setExpenses(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/30 mt-6">
        <div className="bg-muted/30 p-4 text-center">
          <p className="text-lg font-bold text-foreground">{signups}</p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Signups/mo</p>
        </div>
        <div className="bg-muted/30 p-4 text-center">
          <p className="text-lg font-bold neon-text">{symbol}{mrr.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Est. MRR</p>
        </div>
        <div className="bg-muted/30 p-4 text-center">
          <p className="text-lg font-bold text-foreground">{symbol}{netProfit.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Net Profit</p>
        </div>
        <div className="bg-muted/30 p-4 text-center">
          <p className="text-lg font-bold text-foreground">{breakEvenCustomers}</p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1">Breakeven Users</p>
        </div>
      </div>
    </div>
  );
}

/* ── TOOL: SAAS PLANNER ── */
function SaaSPlanner() {
  const [tech, setTech] = useState("nocode");
  const [hours, setHours] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");

  const handlePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setOutput("");

    let current = "";
    const segments = [
      `[Generating Custom SaaS Roadmap · Stack type: ${tech} · Dev: ${hours} hrs/week]\n\n`,
      `📅 Phase 1 (Week 1): Setup & Mockup\n`,
      `   - Action: Register domain, spawn basic Next.js templates or setup n8n instances.\n`,
      `   - Cost: ~$25 (Domain + hosting).\n\n`,
      `📅 Phase 2 (Week 2): Core Backend & DB Integration\n`,
      `   - Action: Integrate Supabase auth, design tables for users and orders.\n`,
      `   - Automation: Setup an n8n scenario sending signup notifications to Slack.\n\n`,
      `📅 Phase 3 (Week 3): Stripe Checklist\n`,
      `   - Action: Configure Stripe checkout URLs and webhook handlers in n8n.\n`,
      `   - Cost: Free (until revenue share).\n\n`,
      `📅 Phase 4 (Week 4): Launch & Cold Outreach\n`,
      `   - Action: Direct outreach to 100 potential users. Implement feedback cycles.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < segments.length) {
        current += segments[i];
        setOutput(current);
        i++;
      } else {
        clearInterval(interval);
        setGenerating(false);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">SaaS Roadmap Planner</h2>
        <p className="text-xs text-muted-foreground">Estimate your launch timeline and development milestones based on your available time.</p>
      </div>

      <form onSubmit={handlePlan} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Development Stack</Label>
            <Select value={tech} onValueChange={setTech}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nocode">No-code (n8n, Make, Bubble)</SelectItem>
                <SelectItem value="react">React / Next.js / Supabase</SelectItem>
                <SelectItem value="python">Python API / LangChain / LangGraph</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dev Hours / Week</Label>
            <Input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} />
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={generating} className="w-full gap-2">
          {generating ? <><Loader2 size={14} className="animate-spin" /> Planning milestones...</> : <><Rocket size={14} /> Generate Roadmap</>}
        </Button>
      </form>

      {output && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[180px]">
          {output}
        </div>
      )}
    </div>
  );
}
