import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Workflow,
  Bot,
  Sparkles,
  ArrowRight,
  Youtube,
  Zap,
  Cpu,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Quote,
  ChevronDown,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  Loader2,
  Mail
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookCallModal } from "@/components/site/BookCallModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listPublicServices } from "@/lib/services.functions";
import { listPublicVideos } from "@/lib/videos.functions";
import { listPublicTestimonials } from "@/lib/testimonials.functions";
import { listPublicFaqs } from "@/lib/faqs.functions";
import { listPublicPosts } from "@/lib/blog.functions";
import { submitLead } from "@/lib/leads.functions";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Solo Entrepreneur — Build Smarter. Automate More. Earn Online." },
      { name: "description", content: "The ultimate builder platform, AI tools, cloneable workflows, courses, and accountability community for solo founders, creators, and indie hackers by Ravi Kumar." },
      { property: "og:title", content: "The Solo Entrepreneur — Build Smarter. Automate More. Earn Online." },
      { property: "og:description", content: "Upgrade your solo enterprise with interactive startup validators, pricing models, n8n templates, and community challenges." },
    ],
  }),
  component: Landing,
});

const ICONS: Record<string, any> = { Workflow, Bot, Cpu, Sparkles, Zap };

function Landing() {
  const [modal, setModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const fetchServices = useServerFn(listPublicServices);
  const fetchVideos = useServerFn(listPublicVideos);
  const fetchTestimonials = useServerFn(listPublicTestimonials);
  const fetchFaqs = useServerFn(listPublicFaqs);
  const fetchPosts = useServerFn(listPublicPosts);

  const { data: services } = useQuery({ queryKey: ["public-services"], queryFn: () => fetchServices() });
  const { data: videos } = useQuery({ queryKey: ["public-videos"], queryFn: () => fetchVideos() });
  const { data: testimonials } = useQuery({ queryKey: ["public-testimonials"], queryFn: () => fetchTestimonials() });
  const { data: faqs } = useQuery({ queryKey: ["public-faqs"], queryFn: () => fetchFaqs() });
  const { data: posts } = useQuery({ queryKey: ["public-blog"], queryFn: () => fetchPosts() });

  const handleBuyService = (serviceTitle: string) => {
    setSelectedService(serviceTitle);
    setModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Header />
      <main>
        {/* Hero Section */}
        <Hero onBook={() => { setSelectedService(""); setModal(true); }} />

        {/* Bento Grid Platform Ecosystem */}
        <BentoGrid />

        {/* Dynamic Services Packages */}
        <Services services={services ?? []} onBuy={handleBuyService} />

        {/* Client Testimonials */}
        {(testimonials ?? []).length > 0 && <Testimonials testimonials={testimonials ?? []} />}

        {/* Video Tutorial Library */}
        <Tutorials videos={videos ?? []} />

        {/* Blog / Articles */}
        {(posts ?? []).length > 0 && <BlogSection posts={posts ?? []} />}

        {/* Professional Profile */}
        <About />

        {/* Lead Capture Funnel (Free Ebook Download) */}
        <LeadCapture />

        {/* Frequently Asked Questions */}
        {(faqs ?? []).length > 0 && <FaqSection faqs={faqs ?? []} />}

        {/* Live Calendly Scheduler */}
        <Schedule />
      </main>
      <Footer />
      <BookCallModal open={modal} onOpenChange={setModal} defaultService={selectedService} />
    </div>
  );
}

/* ── HERO ── */
function Hero({ onBook }: { onBook: () => void }) {
  const r = useReveal<HTMLDivElement>();

  useEffect(() => { r.current?.classList.add("in"); }, [r]);

  return (
    <section className="relative pt-40 pb-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-85" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

      <div ref={r} className="reveal relative mx-auto max-w-5xl px-6 text-center">
        {/* Glow Accent */}
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium uppercase tracking-wider mb-8 select-none animate-fade-in">
          <Zap size={12} className="animate-pulse" />
          Build Smarter &nbsp;·&nbsp; Automate More &nbsp;·&nbsp; Earn Online
        </div>

        <h1 className="font-display text-5xl md:text-[4.75rem] font-bold leading-[1.03] tracking-[-0.03em] mb-8">
          The Ultimate Platform for<br />
          <span className="neon-text font-black">Solo Entrepreneurs</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          Scale your micro-business with high-utility AI tools, production-ready n8n workflows, practical prompt libraries, and a community of active builders.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 relative z-10">
          <Button variant="hero" size="lg" onClick={onBook} className="h-12 px-8 text-sm font-semibold w-full sm:w-auto">
            Book a System Architecture Call <ArrowRight size={15} />
          </Button>
          <Button variant="outlineNeon" size="lg" asChild className="h-12 px-8 text-sm w-full sm:w-auto">
            <a href="#ecosystem">Explore Ecosystem</a>
          </Button>
        </div>

        {/* Credibility Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/30 max-w-4xl mx-auto">
          {[
            { value: "13+", label: "Years Experience" },
            { value: "5,000+", label: "Active Founders" },
            { value: "20+", label: "Cloneable Workflows" },
            { value: "$2M+", label: "Client Revenue Generated" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card/30 backdrop-blur-sm py-6 text-center">
              <p className="font-display text-3xl font-extrabold neon-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BENTO GRID ── */
function BentoGrid() {
  const r = useReveal<HTMLDivElement>();
  return (
    <section id="ecosystem" className="py-24 border-t border-border bg-muted/5 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div ref={r} className="reveal mx-auto max-w-7xl px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">Platform Pillars</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            An Operating System for <span className="neon-text">Modern Builders</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Five interconnected hubs designed to help you build software products, optimize digital margins, and grow solo-operating leverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Box 1: AI Tools (Large) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-border bg-card/45 p-8 transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors pointer-events-none">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-primary mb-4 bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/25">
                  Interactive Engine
                </span>
                <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                  AI Tools Hub <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  Validate your startup hypotheses, structure pricing tiers, and outline step-by-step launch roadmaps inside our interactive AI-first calculator playground.
                </p>
              </div>
              <div className="mt-8 flex gap-3">
                <Button size="xs" variant="outlineNeon" asChild className="text-[11px] h-7 px-3.5">
                  <Link to="/tools">Launch Generators</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Box 2: Store (Medium) */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/45 p-8 transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-8 text-green-500/10 pointer-events-none">
              <BookOpen size={100} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-green-400 mb-4 bg-green-500/5 px-2.5 py-0.5 rounded-full border border-green-500/20">
                  Digital Store
                </span>
                <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                  Products Store <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-green-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download premium strategy books, operational worksheets, and checklists built to skip months of trial.
                </p>
              </div>
              <div className="mt-8">
                <Button size="xs" variant="outlineNeon" asChild className="text-[11px] h-7 px-3.5 border-green-500/30 hover:border-green-400 text-green-400 hover:bg-green-500/5">
                  <Link to="/products">Browse Store</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Box 3: Automations (Medium) */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/45 p-8 transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-8 text-cyan-500/10 pointer-events-none">
              <Workflow size={100} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-cyan-400 mb-4 bg-cyan-500/5 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  No-Code Blueprints
                </span>
                <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                  Automations <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Import pre-tested n8n & Make JSON scenario files that automate web scraping, leads routing, and newsletter posts.
                </p>
              </div>
              <div className="mt-8">
                <Button size="xs" variant="outlineNeon" asChild className="text-[11px] h-7 px-3.5 border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-500/5">
                  <Link to="/automations">Get Blueprints</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Box 4: Learning Courses & Community (Large) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-border bg-card/45 p-8 transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-8 text-violet-500/10 pointer-events-none">
              <GraduationCap size={120} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-violet-400 mb-4 bg-violet-500/5 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  Academy & Network
                </span>
                <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                  LMS & Founder Feed <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-violet-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  Acquire automation building skills step-by-step through our workspace video academy, then interact with 5,000+ creators tracking streaks and co-building on the community feed.
                </p>
              </div>
              <div className="mt-8 flex gap-3">
                <Button size="xs" variant="outlineNeon" asChild className="text-[11px] h-7 px-3.5 border-violet-500/30 hover:border-violet-400 text-violet-400 hover:bg-violet-500/5">
                  <Link to="/courses">LMS Academy</Link>
                </Button>
                <Button size="xs" variant="outlineNeon" asChild className="text-[11px] h-7 px-3.5 border-violet-500/30 hover:border-violet-400 text-violet-400 hover:bg-violet-500/5">
                  <Link to="/community">Community Feed</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── SERVICES ── */
const SERVICE_INCLUDES: Record<string, string[]> = {
  "1-on-1 Coaching Session": [
    "60-minute focused session",
    "Your stack: n8n, Make, LangChain, etc.",
    "Architecture review & feedback",
    "Clear action plan to take away",
  ],
  "Live Workshop": [
    "Small-group live format",
    "Hands-on workflow building",
    "Real agentic systems, no fluff",
    "Recording included",
  ],
  "AI & Agentic Consulting": [
    "Full stack & process audit",
    "Tool selection (no-code or coded)",
    "Custom agent architecture",
    "Production delivery & handoff",
  ],
};

const STATIC_SERVICES = [
  {
    id: "static-1",
    icon: "Workflow",
    title: "1-on-1 Coaching Session",
    description: "A focused session on your automation stack or agentic system — n8n, Make, LangChain, or custom code. Walk away with clarity and a concrete plan.",
    price: "$49",
    image_url: null,
    popular: false,
    cta: "Book Session",
  },
  {
    id: "static-2",
    icon: "Sparkles",
    title: "Live Workshop",
    description: "Small-group sessions covering practical AI automation and agentic coding. Hands-on workflows and agent systems you can implement the same day.",
    price: "$29",
    image_url: null,
    popular: true,
    cta: "Join Workshop",
  },
  {
    id: "static-3",
    icon: "Bot",
    title: "AI & Agentic Consulting",
    description: "For businesses ready to automate at scale. I audit your processes, design the right architecture, and deliver production-ready agentic systems.",
    price: "Custom",
    image_url: null,
    popular: false,
    cta: "Get a Quote",
  },
];

function Services({ services, onBuy }: { services: any[]; onBuy: (title: string) => void }) {
  const r = useReveal<HTMLDivElement>();
  const displayServices = services.length > 0 ? services : STATIC_SERVICES;

  return (
    <section id="services" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Packages</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
              Pick your package.<br className="hidden md:block" /> Start this week.
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed md:text-right">
            Every engagement is focused on outcomes — not hours on a retainer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayServices.map((s: any) => {
            const Icon = (s.icon && ICONS[s.icon]) || Sparkles;
            const isPopular = s.popular;
            const includes = SERVICE_INCLUDES[s.title] ?? [];
            return (
              <div
                key={s.id}
                className={`relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                  isPopular
                    ? "service-card-featured border-primary/30"
                    : "bg-card/50 border-border hover:border-border/80"
                }`}
              >
                {s.image_url && (
                  <div className="h-40 w-full overflow-hidden border-b border-border">
                    <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  {isPopular && (
                    <span className="absolute top-5 right-5 text-[10px] font-semibold tracking-widest uppercase text-primary border border-primary/30 rounded-full px-2.5 py-1 bg-primary/10">
                      Popular
                    </span>
                  )}

                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-5 ${
                    isPopular ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon size={17} />
                  </div>

                  <h3 className="font-display text-xl font-bold mb-2 pr-14">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>

                  {includes.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <Check size={13} className="text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-6 border-t border-border/50 flex items-end justify-between gap-4 mt-6">
                    <div>
                      <p className={`font-display text-3xl font-bold ${isPopular ? "neon-text" : "text-foreground"}`}>
                        {s.price || s.price_label}
                      </p>
                      {s.price !== "Custom" && s.price_label !== "Custom" && (
                        <p className="text-xs text-muted-foreground mt-0.5">per session</p>
                      )}
                    </div>
                    <Button
                      variant={isPopular ? "hero" : "outlineNeon"}
                      size="sm"
                      className="flex-shrink-0 text-xs px-4 h-9"
                      onClick={() => onBuy(s.title)}
                    >
                      {s.cta || "Get Started"} <ArrowRight size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Not sure which fits?</span>
          <button
            onClick={() => onBuy("")}
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            Book a free 15-min call →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── LEAD CAPTURE FUNNEL ── */
function LeadCapture() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const r = useReveal<HTMLDivElement>();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitLead({
        first_name: firstName,
        last_name: "Subscriber",
        email: email,
        phone: "",
        help_with: "Free Ebook Download",
        goal: "Download The Solo Founder Playbook",
        stage: "Waitlist / Lead",
        needs: "Subscribed via landing page Free Ebook form.",
        best_time: "",
      });
      toast.success("Check your inbox! We've sent your copy of The Solo Founder Playbook.");
      setEmail("");
      setFirstName("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to register email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 border-t border-border bg-card/20 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div ref={r} className="reveal mx-auto max-w-4xl px-6 relative z-10">
        <div className="bg-card/40 border border-border rounded-2xl p-8 md:p-12 backdrop-blur text-center space-y-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <BookOpen size={22} className="animate-bounce" />
          </div>
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Get the <span className="neon-text">Solo Founder Playbook</span> (Free)
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Step-by-step blueprints, stack suggestions, checklists, and 50+ micro-niche ideas to launch your solo business and hit $10k MRR. Over 3,500 builders have downloaded it.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-3 pt-4 text-left">
            <div>
              <Label htmlFor="lead-name" className="sr-only">First Name</Label>
              <Input
                id="lead-name"
                required
                placeholder="First Name"
                className="h-10 text-xs bg-muted/30"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-email" className="sr-only">Email Address</Label>
              <Input
                id="lead-email"
                type="email"
                required
                placeholder="you@email.com"
                className="h-10 text-xs bg-muted/30"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" variant="hero" disabled={submitting} className="h-10 px-5 text-xs font-semibold uppercase tracking-wider">
              {submitting ? <Loader2 size={13} className="animate-spin" /> : "Download" }
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground">Zero spam. Pure leverage. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  );
}

/* ── TUTORIALS ── */
function Tutorials({ videos }: { videos: any[] }) {
  const r = useReveal<HTMLDivElement>();
  return (
    <section id="tutorials" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Tutorials</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
              Learn by watching<br className="hidden md:block" /> real builds.
            </h2>
          </div>
          <a
            href="https://www.youtube.com/@RaviKumarAILab"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 animate-pulse"
          >
            <Youtube size={15} className="text-red-500" />
            View all on YouTube →
          </a>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/20 p-14 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Youtube size={22} className="text-red-500" />
            </div>
            <p className="font-semibold mb-1">No tutorials yet</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Videos will appear here once added from the admin panel. In the meantime, check the YouTube channel.
            </p>
            <a
              href="https://www.youtube.com/@RaviKumarAILab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <Youtube size={14} className="text-red-500" /> Visit YouTube channel →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.slice(0, 6).map((v: any) => (
              <a
                key={v.id}
                href={`https://youtube.com/watch?v=${v.youtube_id}`}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-border bg-card/40 overflow-hidden hover:border-primary/20 transition-all duration-200 flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-background/30 group-hover:bg-background/10 transition-colors flex items-center justify-center">
                    <div className="h-11 w-11 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center group-hover:bg-primary/90 group-hover:border-primary transition-all duration-200">
                      <Play size={16} className="text-foreground group-hover:text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {v.title}
                  </h3>
                  {v.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">{v.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── ABOUT ── */
const TOOLS = ["n8n", "Make", "LangChain", "CrewAI", "AutoGen", "OpenAI", "Cursor", "Claude"];

function About() {
  const r = useReveal<HTMLDivElement>();
  return (
    <section id="about" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-20 items-center">
        <div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">Founder</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08] mb-6">
            Meet Ravi Kumar
          </h2>
          <p className="text-muted-foreground leading-relaxed text-[15px] mb-4">
            13+ years of full-stack engineering across startups and digital enterprise models. Today, I build and document autonomous systems to help creators, freelancers, and builders work smarter and unlock solo business scale.
          </p>
          <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
            Every pipeline, n8n schema, and agent layout showcased here is derived directly from client setups or public co-building workshops.
          </p>

          <div className="mb-8">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Favorite Stack Tools</p>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <span key={tool} className="px-3 py-1 text-xs border border-border rounded-md text-muted-foreground bg-muted/30">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <a
            href="https://www.youtube.com/@RaviKumarAILab"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Youtube size={15} className="text-red-500" />
            Watch Co-Builds on YouTube →
          </a>
        </div>

        <a
          href="https://www.youtube.com/@RaviKumarAILab"
          target="_blank"
          rel="noreferrer"
          className="relative aspect-video rounded-xl overflow-hidden border border-border bg-card group block"
        >
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
              <Youtube size={26} className="text-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <p className="font-display text-base font-semibold">The Solo Entrepreneur channel</p>
            <p className="text-xs text-muted-foreground mt-0.5">By Ravi Kumar — AI automation blueprints</p>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ── SCHEDULE ── */
function Schedule() {
  const r = useReveal<HTMLDivElement>();
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);
  return (
    <section id="schedule" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Calendar</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            Schedule a consultation.
          </h2>
          <p className="mt-4 text-muted-foreground text-[15px] max-w-lg">
            Pick an open slot. We'll map your system stack, pinpoint manual overhead, and outline where automation generates maximum yield.
          </p>
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-card/30">
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/ravikumar-devforge?background_color=181a1f&text_color=f5f7fa&primary_color=4ade80"
            style={{ minWidth: "320px", height: "700px" }}
          />
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ── */
function Testimonials({ testimonials }: { testimonials: any[] }) {
  const r = useReveal<HTMLDivElement>();
  return (
    <section id="testimonials" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Proof</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            What builders say.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card/40 p-6 flex flex-col gap-4 hover:border-primary/20 transition-colors">
              <Quote size={18} className="text-primary/40 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-muted-foreground flex-1 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {t.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BLOG ── */
function BlogSection({ posts }: { posts: any[] }) {
  const r = useReveal<HTMLDivElement>();
  const shown = posts.slice(0, 3);
  return (
    <section id="blog" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Insights</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            Latest writing.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((p) => (
            <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="rounded-xl border border-border bg-card/40 p-6 flex flex-col gap-3 hover:border-primary/20 transition-colors group">
              <FileText size={15} className="text-primary/50" />
              <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
              {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
              <p className="text-xs text-muted-foreground mt-auto pt-2">
                {p.published_at ? new Date(p.published_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" }) : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FaqSection({ faqs }: { faqs: any[] }) {
  const r = useReveal<HTMLDivElement>();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section id="faq" className="py-24 border-t border-border">
      <div ref={r} className="reveal mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">FAQ</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            Common questions.
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-card/40 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/20 transition-colors"
                onClick={() => setOpenId(openId === f.id ? null : f.id)}
              >
                <span className="font-medium text-sm pr-4">{f.question}</span>
                <ChevronDown size={15} className={`flex-shrink-0 text-muted-foreground transition-transform ${openId === f.id ? "rotate-180" : ""}`} />
              </button>
              {openId === f.id && (
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
