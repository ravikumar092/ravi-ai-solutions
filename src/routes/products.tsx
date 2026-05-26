import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookCallModal } from "@/components/site/BookCallModal";
import { ProductPurchaseModal } from "@/components/site/ProductPurchaseModal";
import { Button } from "@/components/ui/button";
import { ShoppingBag, BookOpen, Workflow, MessageSquare, ArrowRight, ShieldCheck, Zap, Star, Code, Globe, Database } from "lucide-react";
import { getSettings } from "@/lib/settings.functions";
import { listPublicProducts } from "@/lib/products.functions";
import { getMe } from "@/routes/api/me";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const formatPriceDisplay = (price: string, currency: string = "USD") => {
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return price;
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${numeric}`;
};

const IconMap: Record<string, any> = { BookOpen, Workflow, Zap, MessageSquare, ShieldCheck, Code, Globe, Database, ShoppingBag };


export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Store & Resources — Ravi Kumar AI Lab" },
      { name: "description", content: "Premium checklists, ebooks, and pre-packaged automation templates to scale your solo business." },
    ],
  }),
  component: ProductsStore,
});

type Category = "all" | "info" | "blueprint" | "consulting";

const PRODUCTS = [
  {
    id: "prod-playbook",
    category: "info",
    title: "The Ravi Kumar AI Lab Playbook",
    description: "Our comprehensive guide to launching, operating, and scaling a single-person business. From zero to $10k/month system design.",
    price: "FREE",
    badge: "Best Seller",
    icon: BookOpen,
    iconColor: "text-green-400",
    features: [
      "Step-by-step validation frameworks",
      "List of 50+ micro-niche ideas",
      "Operational templates & legal guide",
      "Lifetime updates and notifications"
    ],
    cta: "Download Free PDF"
  },
  {
    id: "prod-lead-workflow",
    category: "blueprint",
    title: "n8n Lead Generator Workflow",
    description: "A complete pre-packaged n8n blueprint that monitors Zillow/LinkedIn, scores leads using OpenAI, and pushes them to Notion.",
    price: "$29",
    badge: "Developer Bundle",
    icon: Workflow,
    iconColor: "text-cyan-400",
    features: [
      "Ready-to-import JSON file",
      "Detailed video walkthrough setup",
      "Google Sheets & Notion config schemas",
      "Includes GPT prompt scoring templates"
    ],
    cta: "Get Import Key"
  },
  {
    id: "prod-content-scheduler",
    category: "blueprint",
    title: "Make.com Social Auto-Scheduler",
    description: "Schedule, format, and syndicate content across Twitter, LinkedIn, and YouTube using automated GPT pipelines.",
    price: "$19",
    badge: "Automation Tool",
    icon: Zap,
    iconColor: "text-orange-400",
    features: [
      "Make.com blueprint file",
      "Integrates with Airtable database",
      "Dynamic hook generator integration",
      "Step-by-step setup documentation"
    ],
    cta: "Get Blueprint"
  },
  {
    id: "prod-coaching",
    category: "consulting",
    title: "1-on-1 Strategy Session",
    description: "A deep dive 60-minute strategy call with Ravi Kumar to architect your systems, debug automation, or build marketing pipelines.",
    price: "$49",
    badge: "Limited Slots",
    icon: MessageSquare,
    iconColor: "text-violet-400",
    features: [
      "60-minute private Zoom call",
      "Full video recording + transcript",
      "Custom system architecture draft",
      "Follow-up Notion action board"
    ],
    cta: "Schedule Call"
  },
  {
    id: "prod-custom-agent",
    category: "consulting",
    title: "Enterprise Agentic System Build",
    description: "Get a custom AI system, complex database orchestration, or custom agent flow built specifically for your business workflow.",
    price: "Custom",
    badge: "Premium Tier",
    icon: ShieldCheck,
    iconColor: "text-yellow-400",
    features: [
      "Full workflow requirements audit",
      "Custom LangChain or CrewAI backend",
      "Integration with existing dashboards",
      "1 month dedicated post-handoff support"
    ],
    cta: "Get a Quote"
  }
];

function ProductsStore() {
  const [category, setCategory] = useState<Category>("all");
  const [modal, setModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState<any | null>(null);

  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchProducts = useServerFn(listPublicProducts);
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => fetchProducts(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchMe = useServerFn(getMe);
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetchMe(),
  });

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `Store & Resources — ${settings.site_name}`;
    }
    if (settings?.meta_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  const activeProducts = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  const filteredProducts = activeProducts.filter(
    (p: any) => category === "all" || p.category === category
  );

  const handleAction = (p: any) => {
    const upper = (p.price || "").trim().toUpperCase();
    const isFree = upper === "FREE" || upper === "0" || (!isNaN(parseFloat(p.price)) && parseFloat(p.price) === 0);
    const isPriced = p.price && (p.price.startsWith("$") || !isNaN(parseFloat(p.price.replace(/[^0-9.]/g, ""))));
    const isCustom = upper === "CUSTOM" || upper === "QUOTE";

    if (isCustom || (!isFree && !isPriced)) {
      // Consulting / custom pricing → book a call
      setSelectedProduct(p.title);
      setModal(true);
    } else {
      // Free or paid → purchase / claim modal
      setPurchaseProduct(p);
      setPurchaseModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Banner Block */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">Store & Blueprints</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Premium Assets for <span className="neon-text">Ravi Kumar AI Lab</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Download production-ready templates, educational resources, and secure 1-on-1 strategy sessions to bypass weeks of trial and error.
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <CategoryButton active={category === "all"} onClick={() => setCategory("all")} label="All Products" />
          <CategoryButton active={category === "info"} onClick={() => setCategory("info")} label="Ebooks & Guides" />
          <CategoryButton active={category === "blueprint"} onClick={() => setCategory("blueprint")} label="Automation Blueprints" />
          <CategoryButton active={category === "consulting"} onClick={() => setCategory("consulting")} label="Consultation & Audits" />
        </div>

        {/* Store Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const dynamicProducts = filteredProducts.map((p) => {
              if (p.id === "prod-playbook") {
                return {
                  ...p,
                  title: settings?.ebook_title || p.title,
                  description: settings?.ebook_desc || p.description,
                };
              }
              return p;
            });
            return dynamicProducts.map((p) => {
              const Icon = typeof p.icon === "string" ? (IconMap[p.icon] || ShoppingBag) : p.icon;
              const iconColor = p.icon_color || p.iconColor || "text-primary";
              return (
              <div
                key={p.id}
                className="relative bg-card/40 border border-border hover:border-primary/20 rounded-xl p-6 flex flex-col transition-all duration-300 backdrop-blur group"
              >
                {/* Badge */}
                {p.badge && (
                  <span className="absolute top-5 right-5 text-[9px] font-semibold tracking-wider uppercase text-primary border border-primary/20 rounded-full px-2.5 py-0.5 bg-primary/5">
                    {p.badge}
                  </span>
                )}

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-10 w-10 rounded-lg bg-muted/40 border border-border flex items-center justify-center ${iconColor} flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors leading-tight">
                      {p.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1 capitalize">{p.category === 'info' ? 'Book / Resource' : p.category === 'blueprint' ? 'System Blueprint' : 'Coaching & Service'}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  {p.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-8 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Star size={11} className="text-primary mt-1 flex-shrink-0 fill-primary/10" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer block */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-2xl font-bold font-display tracking-tight neon-text">
                      {formatPriceDisplay(p.price, p.currency)}
                    </span>
                    {p.price !== "FREE" && p.price !== "Custom" && (
                      <span className="text-[10px] text-muted-foreground block">One-time payment</span>
                    )}
                  </div>
                  <Button
                    variant="outlineNeon"
                    size="sm"
                    className="text-xs font-semibold h-9"
                    onClick={() => handleAction(p)}
                  >
                    {p.cta} <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
              );
            });
          })()}
        </div>

        {/* Guarantees */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 border-t border-border/30 pt-12">
          <div className="text-center p-4">
            <h4 className="font-display text-sm font-semibold mb-2">Instant Safe Download</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">All blueprints and PDF worksheets are delivered to your email instantly after booking checkouts.</p>
          </div>
          <div className="text-center p-4">
            <h4 className="font-display text-sm font-semibold mb-2">No-Code Import Friendly</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Workflows are formatted for easy copy-paste import directly to any n8n or Make.com dashboard.</p>
          </div>
          <div className="text-center p-4">
            <h4 className="font-display text-sm font-semibold mb-2">Dedicated Founder Support</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Need help configuring a workspace? Reach out via our booking page and schedule custom adjustments.</p>
          </div>
        </div>
      </main>
      <Footer />
      <BookCallModal open={modal} onOpenChange={setModal} defaultService={selectedProduct} />
      <ProductPurchaseModal open={purchaseModal} onOpenChange={setPurchaseModal} product={purchaseProduct} currentUser={user} />
    </div>
  );
}

interface CategoryButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function CategoryButton({ active, onClick, label }: CategoryButtonProps) {
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
