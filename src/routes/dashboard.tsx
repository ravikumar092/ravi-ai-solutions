import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trophy, Flame, Coins, Bookmark, ShoppingBag, Settings,
  CheckSquare, Package, Calendar, CreditCard, Download, Gift,
  User, LogOut,
} from "lucide-react";
import { getSettings } from "@/lib/settings.functions";
import { getUserPurchases } from "@/lib/purchases.functions";
import { getMe } from "@/routes/api/me";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "User Dashboard — Ravi Kumar AI Lab" },
      { name: "description", content: "Access your solo founder metrics, saved AI ideas, courses, and purchased templates in one clean command center." },
    ],
  }),
  component: UserDashboard,
});

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

function formatAmount(amount: number, currency: string = "USD") {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function UserDashboard() {
  const navigate = useNavigate();
  const fetchSettings = useServerFn(getSettings);
  const fetchPurchases = useServerFn(getUserPurchases);
  const fetchMe = useServerFn(getMe);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetchMe(),
    staleTime: 60 * 1000,
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["user-purchases"],
    queryFn: () => fetchPurchases(),
    staleTime: 30 * 1000,
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `User Dashboard — ${settings.site_name}`;
    }
    if (settings?.meta_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Validate startup idea using Offer Validator", done: true },
    { id: 2, text: "Map SaaS expenses in the Pricing Calculator", done: true },
    { id: 3, text: "Set up free waitlist form via n8n & Google Sheets", done: false },
    { id: 4, text: "Publish a Twitter build-in-public post", done: false },
    { id: 5, text: "Join the Weekly Build Challenge in the Community feed", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const displayName = (currentUser as any)?.firstName || (currentUser as any)?.email?.split("@")[0] || "Builder";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* User profile header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Founder Hub</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome back, <span className="text-primary font-semibold">{displayName}</span>. Here's your workspace overview.
              </p>
              {(currentUser as any)?.email && (
                <p className="text-xs text-muted-foreground/60">{(currentUser as any).email}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {currentUser && (
              <Button variant="outlineNeon" size="sm" className="text-xs uppercase tracking-wider h-8" onClick={handleLogout}>
                <LogOut size={13} className="mr-1" /> Logout
              </Button>
            )}
            <Button variant="outlineNeon" size="sm" className="text-xs uppercase tracking-wider h-8">
              <Settings size={13} className="mr-1" /> Settings
            </Button>
          </div>
        </div>

        {/* Top level stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Flame className="text-orange-500" size={18} />} title="Build Streak" value="5 Days" subtext="Top 8% of builders" />
          <StatCard icon={<Trophy className="text-yellow-500" size={18} />} title="Founder XP" value="1,240 Pts" subtext="Level 4 Builder" />
          <StatCard icon={<Coins className="text-cyan-500" size={18} />} title="AI Credits" value="84 / 100" subtext="Renews in 12 days" />
          <StatCard
            icon={<ShoppingBag className="text-violet-500" size={18} />}
            title="Owned Assets"
            value={purchases.length > 0 ? `${purchases.length} Item${purchases.length > 1 ? "s" : ""}` : "0 Items"}
            subtext={purchases.length > 0 ? "Digital products" : "No purchases yet"}
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left panel: Tasks & Checklist */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <CheckSquare size={17} className="text-primary" /> Daily Action Checklist
                </h2>
                <span className="text-xs text-muted-foreground">
                  {tasks.filter(t => t.done).length} / {tasks.length} Done
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-border/60 transition duration-150">
                    <Checkbox id={`task-${t.id}`} checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                    <label htmlFor={`task-${t.id}`} className={`text-xs select-none cursor-pointer ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {t.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved AI Outputs */}
            <div className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Bookmark size={17} className="text-primary" /> Saved Idea Generations
                </h2>
              </div>
              <div className="space-y-4">
                <SavedGenerationItem
                  title="Automated Real Estate Scraper"
                  niche="Real estate agents"
                  date="May 20, 2026"
                  snippet="n8n workflow that monitors Zillow listings, scores them based on ROI criteria using OpenAI, and drops hot leads directly into a Notion board."
                />
                <SavedGenerationItem
                  title="Video Hook Optimizer SaaS"
                  niche="Tiktok & Reels creators"
                  date="May 18, 2026"
                  snippet="AI validator checking script hooks against viral database templates. Provides immediate engagement scoring."
                />
              </div>
            </div>
          </div>

          {/* Right panel: Purchases & Challenge */}
          <div className="space-y-6">
            {/* PURCHASED PRODUCTS - Real data from DB */}
            <div className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur space-y-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border/50 pb-2">
                <Package size={17} className="text-primary" /> My Purchases
              </h2>

              {purchasesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : !currentUser ? (
                <div className="text-center py-6 space-y-2">
                  <ShoppingBag size={32} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">Sign in to view your purchases.</p>
                  <a href="/products" className="text-[11px] text-primary hover:underline">
                    Browse Products →
                  </a>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <ShoppingBag size={32} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">No purchases yet.</p>
                  <a href="/products" className="text-[11px] text-primary hover:underline">
                    Browse Products →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {(purchases as any[]).map((purchase: any) => (
                    <PurchaseItem key={purchase.id} purchase={purchase} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur text-center space-y-4">
              <Trophy size={36} className="text-yellow-500 mx-auto" />
              <h3 className="font-display text-base font-bold">Weekly Accountability Challenge</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build a landing page and capture your first lead in 48 hours. Submit your challenge link to win 100 extra AI credits!
              </p>
              <Button size="sm" variant="hero" className="w-full text-xs uppercase tracking-wider">
                Join Challenge
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, title, value, subtext }: { icon: React.ReactNode; title: string; value: string; subtext: string }) {
  return (
    <div className="bg-card/40 border border-border rounded-xl p-5 backdrop-blur flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-muted/40 border border-border flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{title}</p>
        <p className="text-2xl font-bold font-display mt-0.5">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

function SavedGenerationItem({ title, niche, date, snippet }: { title: string; niche: string; date: string; snippet: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/5 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-xs text-foreground">{title}</h4>
          <p className="text-[10px] text-muted-foreground">Niche: {niche}</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{date}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{snippet}</p>
      <div className="flex gap-2 pt-1.5">
        <Button size="xs" variant="outlineNeon" className="text-[10px] h-6 px-2.5">Load Configuration</Button>
      </div>
    </div>
  );
}

function PurchaseItem({ purchase }: { purchase: any }) {
  const isFree = purchase.status === "free" || Number(purchase.amount) === 0;
  const hasFile = !!(purchase.file_url || purchase.product_file_url);

  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3 space-y-2.5 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{purchase.product_title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isFree ? (
              <span className="inline-flex items-center gap-1 text-[9px] bg-violet-950/40 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5 font-medium uppercase">
                <Gift size={8} /> Free
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium uppercase">
                ✓ Paid
              </span>
            )}
            {hasFile && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-sky-950/40 text-sky-400 border border-sky-500/20 rounded-full px-2 py-0.5">
                <Download size={8} /> File
              </span>
            )}
          </div>
        </div>
        <span className={`text-sm font-bold font-display whitespace-nowrap ${isFree ? "text-violet-400" : "text-primary"}`}>
          {isFree ? "FREE" : formatAmount(purchase.amount, purchase.currency)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {hasFile && (
          <a
            href={purchase.file_url || purchase.product_file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={purchase.file_name || purchase.product_file_name || "Product File"}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-[10px] font-semibold transition-colors"
          >
            <Download size={11} /> Download
          </a>
        )}
        <Link
          to={`/purchases/${purchase.id}`}
          className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-semibold transition-colors text-center"
        >
          Setup & Details
        </Link>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/20">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          {formatDate(purchase.created_at)}
        </div>
        {!isFree && (
          <div className="flex items-center gap-1 font-mono">
            <CreditCard size={10} />
            {purchase.razorpay_payment_id?.substring(0, 12)}…
          </div>
        )}
      </div>
    </div>
  );
}
