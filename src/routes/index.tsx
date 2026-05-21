import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Workflow, Bot, Sparkles, ArrowRight, Youtube, Zap, Cpu, Check, ChevronLeft, ChevronRight, Play, Quote, ChevronDown, FileText } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookCallModal } from "@/components/site/BookCallModal";
import { Button } from "@/components/ui/button";
import { listPublicServices } from "@/lib/services.functions";
import { listPublicVideos } from "@/lib/videos.functions";
import { listPublicTestimonials } from "@/lib/testimonials.functions";
import { listPublicFaqs } from "@/lib/faqs.functions";
import { listPublicPosts } from "@/lib/blog.functions";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ravi Kumar AI Lab — AI Automation & Agentic Systems" },
      { name: "description", content: "Senior Full Stack Developer & AI Systems Architect. n8n, Make, custom AI agents, and agentic coding tools for modern business automation." },
      { property: "og:title", content: "Ravi Kumar AI Lab — AI Automation & Agentic Systems" },
      { property: "og:description", content: "n8n, Make, LangChain, custom AI agents, and full-stack agentic automation for your business." },
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
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero onBook={() => { setSelectedService(""); setModal(true); }} />
        <Services services={services ?? []} onBuy={handleBuyService} />
        {(testimonials ?? []).length > 0 && <Testimonials testimonials={testimonials ?? []} />}
        <Tutorials videos={videos ?? []} />
        {(posts ?? []).length > 0 && <BlogSection posts={posts ?? []} />}
        <About />
        {(faqs ?? []).length > 0 && <FaqSection faqs={faqs ?? []} />}
        <Schedule />
      </main>
      <Footer />
      <BookCallModal open={modal} onOpenChange={setModal} defaultService={selectedService} />
    </div>
  );
}

/* ── CAROUSEL SLIDES ── */
const SLIDES = [
  {
    tag: "No-code automation",
    headline: "Workflows that run while you sleep.",
    body: "n8n and Make pipelines built end-to-end — from triggers to actions — deployed and maintained for your business.",
    tools: ["n8n", "Make", "Zapier"],
    icon: Workflow,
  },
  {
    tag: "Agentic AI systems",
    headline: "Agents that think, decide, and act.",
    body: "Custom AI agents built with LangChain, CrewAI, and AutoGen that handle multi-step reasoning and real-world tasks autonomously.",
    tools: ["LangChain", "CrewAI", "AutoGen"],
    icon: Bot,
  },
  {
    tag: "Full-stack AI apps",
    headline: "From prompt to production-ready.",
    body: "Full-stack agentic applications — APIs, databases, agent orchestration, and interfaces — built to scale with your business.",
    tools: ["OpenAI", "Claude", "Cursor"],
    icon: Cpu,
  },
  {
    tag: "YouTube tutorials",
    headline: "Learn AI automation for free.",
    body: "Practical, no-fluff breakdowns of real implementations published on YouTube. Watch the exact techniques I use for clients.",
    tools: ["Tutorials", "Live builds", "Deep dives"],
    icon: Youtube,
  },
];

/* ── HERO ── */
function Hero({ onBook }: { onBook: () => void }) {
  const r = useReveal<HTMLDivElement>();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((a) => (a + 1) % SLIDES.length), []);
  const prev = useCallback(() => setActive((a) => (a - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => { r.current?.classList.add("in"); }, [r]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next, paused]);

  const slide = SLIDES[active];
  const SlideIcon = slide.icon;

  return (
    <section className="relative pt-40 pb-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div ref={r} className="reveal relative mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">
          AI Systems Architect &nbsp;·&nbsp; 13+ Years Full-Stack
        </p>

        <h1 className="font-display text-5xl md:text-[4.5rem] font-bold leading-[1.04] tracking-[-0.03em] mb-7">
          Build autonomous systems<br className="hidden md:block" /> that work{" "}
          <span className="accent-text accent-line">while you sleep</span>.
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
          I design and ship AI workflows, agentic pipelines, and custom automation using n8n, Make, LangChain, CrewAI, and more — tailored to your business.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Button variant="hero" size="lg" onClick={onBook} className="h-11 px-7 text-sm font-semibold">
            Book a Free Discovery Call <ArrowRight size={15} />
          </Button>
          <Button variant="outlineNeon" size="lg" asChild className="h-11 px-7 text-sm">
            <a href="#services">View Packages</a>
          </Button>
        </div>

        {/* ── Carousel ── */}
        <div
          className="relative rounded-xl border border-border bg-card/50 backdrop-blur p-6 md:p-8 text-left overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-border overflow-hidden rounded-t-xl">
            <div
              className="h-full bg-primary transition-none"
              style={{
                width: `${((active + 1) / SLIDES.length) * 100}%`,
                transition: paused ? "none" : "width 4.5s linear",
              }}
            />
          </div>

          <div className="flex items-start gap-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <SlideIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary mb-2">{slide.tag}</p>
              <h3 className="font-display text-lg md:text-xl font-bold mb-2 leading-snug">{slide.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{slide.body}</p>
              <div className="flex flex-wrap gap-2">
                {slide.tools.map((t) => (
                  <span key={t} className="px-2.5 py-1 text-xs border border-border rounded-md text-muted-foreground bg-muted/40">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setPaused(true); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={() => { prev(); setPaused(true); }} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => { next(); setPaused(true); }} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
          {[
            { value: "13+", label: "Years Experience" },
            { value: "50+", label: "Projects Delivered" },
            { value: "10+", label: "Tools & Frameworks" },
          ].map((stat) => (
            <div key={stat.label} className="bg-background/80 py-5 text-center">
              <p className="font-display text-2xl font-bold neon-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
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
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Services</p>
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
                    ? "service-card-featured"
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
                    <span className="absolute top-5 right-5 text-[10px] font-semibold tracking-widest uppercase text-neon border border-primary/30 rounded-full px-2.5 py-1 bg-primary/10">
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
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
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
            {videos.map((v: any) => (
              <a
                key={v.id}
                href={`https://youtube.com/watch?v=${v.youtube_id}`}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-border bg-card/40 overflow-hidden hover:border-border/80 transition-all duration-200 flex flex-col"
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
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {v.title}
                  </h3>
                  {v.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{v.description}</p>
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
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">About</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08] mb-6">
            I build the systems.<br className="hidden md:block" /> You run the business.
          </h2>
          <p className="text-muted-foreground leading-relaxed text-[15px] mb-4">
            13+ years of full-stack engineering across startups and enterprises. Today, I focus exclusively on autonomous AI systems — connecting the right tools, whether that's a no-code n8n workflow or a fully custom agentic app.
          </p>
          <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
            I document everything I build on YouTube — real implementations, not slides.
          </p>

          <div className="mb-8">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Tools I work with</p>
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
            Ravi Kumar AI Lab on YouTube →
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
            <p className="font-display text-base font-semibold">Ravi Kumar AI Lab</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI automation & agentic systems</p>
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
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Booking</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            Schedule a consultation.
          </h2>
          <p className="mt-4 text-muted-foreground text-[15px] max-w-lg">
            Pick a slot that works for you. We'll talk through your stack, goals, and where automation creates the most leverage.
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
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Testimonials</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            What clients say.
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
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">Articles</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
            Latest writing.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card/40 p-6 flex flex-col gap-3 hover:border-primary/20 transition-colors group">
              <FileText size={15} className="text-primary/50" />
              <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
              {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
              <p className="text-xs text-muted-foreground mt-auto pt-2">
                {p.published_at ? new Date(p.published_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" }) : ""}
              </p>
            </div>
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
