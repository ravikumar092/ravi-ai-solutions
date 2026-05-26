import { useState } from "react";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { 
  ArrowLeft, Calendar, Download, CheckCircle2, ExternalLink, 
  HelpCircle, Star, Sparkles, BookOpen, Workflow, Zap, 
  MessageSquare, ShieldCheck, CheckSquare, Clock, User, Clipboard, Check
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { getSettings } from "@/lib/settings.functions";
import { toast } from "sonner";

// Fetch purchase and product details on the server
const fetchPurchaseDetails = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ purchaseId: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getSession } = await import("../lib/replit-auth.server");
    const request = getRequest();
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      throw new Error("Unauthorized");
    }

    const isAdmin = session.isAdmin === true;
    let query = supabaseAdmin.from("purchases").select("*").eq("id", data.purchaseId);
    if (!isAdmin) {
      query = query.eq("customer_email", session.user.email);
    }
    const { data: purchase, error: purchaseError } = await query.maybeSingle();

    if (purchaseError || !purchase) {
      console.warn(`[purchases/$purchaseId] purchase not found for id ${data.purchaseId}:`, purchaseError?.message);
      return null;
    }

    // Now query the product details using the product_id from the purchase
    let productDetails = null;
    try {
      const { data: prod, error: prodError } = await supabaseAdmin
        .from("products")
        .select("id,category,title,description,price,badge,icon,icon_color,features,cta,file_url,file_name")
        .eq("id", purchase.product_id)
        .maybeSingle();
      if (!prodError && prod) {
        productDetails = prod;
      }
    } catch (e) {
      console.error("[purchases/$purchaseId] failed to fetch product:", e);
    }

    const settings = await getSettings();

    return {
      purchase,
      product: productDetails,
      calendlyUrl: settings.calendly_url || "https://calendly.com/ravikumar-devforge",
    };
  });

export const Route = createFileRoute("/purchases/$purchaseId")({
  head: ({ loaderData }: any) =>
    loaderData?.purchase
      ? {
          meta: [
            { title: `${loaderData.purchase.product_title} — Ravi Kumar AI Lab` },
            { name: "description", content: `Access and download your purchased asset: ${loaderData.purchase.product_title}.` },
          ],
        }
      : { title: "Purchase Details — Ravi Kumar AI Lab" },
  loader: async ({ params, location }) => {
    try {
      const details = await fetchPurchaseDetails({ data: { purchaseId: params.purchaseId } });
      if (!details || !details.purchase) throw notFound();
      return details;
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        throw redirect({
          to: "/signin",
          search: {
            redirect: location.pathname,
          },
        });
      }
      throw err;
    }
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-primary mb-4 font-display">404</p>
          <h1 className="text-xl font-semibold mb-2 font-display">Purchase Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            We couldn't find a record for this purchase ID or you do not have permission to view it.
          </p>
          <Link to="/dashboard" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Go to Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  ),
  component: PurchaseDetailPage,
});

const CategoryIconMap: Record<string, any> = {
  info: BookOpen,
  blueprint: Workflow,
  consulting: MessageSquare,
};

function PurchaseDetailPage() {
  const { purchase, product, calendlyUrl } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const category = product?.category || "info";
  const Icon = CategoryIconMap[category] || ShieldCheck;
  const iconColor = product?.icon_color || "text-primary";

  // List next steps dynamically based on category
  const [steps, setSteps] = useState(() => {
    if (category === "consulting") {
      return [
        { id: 1, text: "Book your strategy call via the Calendly widget/link below", done: false },
        { id: 2, text: "Complete the intake questions in the Calendly scheduler", done: false },
        { id: 3, text: "Prepare your list of top 3 system bottlenecks or questions", done: false },
        { id: 4, text: "Check your email for the calendar invitation and Zoom details", done: false },
      ];
    } else if (category === "blueprint") {
      return [
        { id: 1, text: "Download the workflow schema file using the download button", done: false },
        { id: 2, text: "Open your n8n or Make.com dashboard", done: false },
        { id: 3, text: "Create a new canvas and click 'Import from File' (JSON)", done: false },
        { id: 4, text: "Configure credentials (API keys) for nodes like OpenAI, Notion, or Slack", done: false },
        { id: 5, text: "Enable the workflow and run an initial test execution", done: false },
      ];
    } else {
      // info / guides
      return [
        { id: 1, text: "Download the Playbook PDF using the download button", done: false },
        { id: 2, text: "Read Chapter 1 to master the offer validation framework", done: false },
        { id: 3, text: "Explore the List of 50+ micro-niche ideas to select yours", done: false },
        { id: 4, text: "Check the LMS courses tab to view step-by-step videos", done: false },
      ];
    }
  });

  const toggleStep = (id: number) => {
    setSteps(steps.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(purchase.id);
    setCopied(true);
    toast.success("Purchase ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmountDisplay = (amount: number, currency: string = "USD") => {
    const symbolMap: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
    const symbol = symbolMap[currency] || "$";
    return `${symbol}${Number(amount).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-5xl mx-auto w-full">
        {/* Breadcrumb / Back button */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            Transaction: Completed
          </span>
        </div>

        {/* Hero Success Badge */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/30 text-primary mb-4 animate-bounce">
            <Sparkles size={26} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Asset Secured Successfully!
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Thank you for your purchase. Follow the action plan below to configure and get started with your asset.
          </p>
        </div>

        {/* Main Purchase Card */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left panel: Asset Detail & Download */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Product description card */}
            <div className="relative bg-card/40 border border-border rounded-2xl p-6 backdrop-blur space-y-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl bg-muted/40 border border-border flex items-center justify-center ${iconColor} flex-shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-primary border border-primary/20 bg-primary/5 rounded-full px-2.5 py-0.5">
                    {category === "info" ? "Ebook & Guide" : category === "blueprint" ? "Automation Blueprint" : "Consultation Call"}
                  </span>
                  <h2 className="font-display text-xl font-bold text-foreground pt-1.5">{purchase.product_title}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {product?.description || "Access credentials, download keys, and next steps for your purchased resources below."}
                  </p>
                </div>
              </div>

              {/* Download Section (If file exists) */}
              {(purchase.file_url || product?.file_url) ? (
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-3.5 py-2.5">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>Your downloadable asset is ready.</span>
                  </div>
                  
                  <a
                    href={purchase.file_url || product?.file_url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={purchase.file_name || product?.file_name || "Product File"}
                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-xl py-3 px-4 shadow-lg shadow-primary/20 transition duration-150 group"
                  >
                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                    Download {purchase.file_name || product?.file_name || "Product File"}
                  </a>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Size might vary depending on contents. Access anytime from your dashboard.
                  </p>
                </div>
              ) : category === "consulting" ? (
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-violet-400 bg-violet-950/20 border border-violet-500/20 rounded-lg px-3.5 py-2.5">
                    <Calendar size={15} className="shrink-0" />
                    <span>Please schedule your strategy session below.</span>
                  </div>
                  <a
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl py-3 px-4 shadow-lg shadow-violet-500/20 transition duration-150"
                  >
                    <Calendar size={16} />
                    Schedule Call on Calendly <ExternalLink size={13} />
                  </a>
                </div>
              ) : null}
            </div>

            {/* Checklist next steps */}
            <div className="bg-card/40 border border-border rounded-2xl p-6 backdrop-blur space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
                  <CheckSquare size={17} className="text-primary" /> Action Checklist
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {steps.filter(s => s.done).length} / {steps.length} Done
                </span>
              </div>
              <div className="space-y-2.5 pt-1.5">
                {steps.map((s) => (
                  <div 
                    key={s.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20 hover:border-border/50 transition duration-150"
                  >
                    <Checkbox 
                      id={`step-${s.id}`} 
                      checked={s.done} 
                      onCheckedChange={() => toggleStep(s.id)} 
                    />
                    <label 
                      htmlFor={`step-${s.id}`} 
                      className={`text-xs select-none cursor-pointer leading-tight ${s.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {s.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendly Inline Widget (Only for Consulting category) */}
            {category === "consulting" && (
              <div className="bg-card/40 border border-border rounded-2xl p-6 backdrop-blur space-y-4">
                <h3 className="font-display text-base font-bold border-b border-border/30 pb-2">
                  Select Calendar Date
                </h3>
                <div className="w-full h-[600px] border border-border/30 rounded-xl overflow-hidden bg-card/60">
                  <iframe 
                    src={calendlyUrl} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    title="Calendly Scheduler"
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}
            
          </div>

          {/* Right panel: Purchase Meta & support details */}
          <div className="space-y-6">
            
            {/* Transaction metadata */}
            <div className="bg-card/40 border border-border rounded-2xl p-5 backdrop-blur space-y-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/20 pb-2">
                Order Summary
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Purchase ID</span>
                  <div className="flex items-center gap-1 bg-muted/30 border border-border/20 rounded-lg p-2 font-mono">
                    <span className="truncate flex-1 text-[10px] text-foreground">{purchase.id}</span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Copy ID"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground font-semibold">Amount Paid</span>
                  <span className="font-bold text-primary font-display">{purchase.amount === 0 ? "FREE" : formatAmountDisplay(purchase.amount, purchase.currency)}</span>
                </div>

                <div className="flex justify-between border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">
                    {new Date(purchase.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground">Payment Gateway</span>
                  <span className="font-medium text-foreground font-mono truncate max-w-[120px]" title={purchase.razorpay_payment_id}>
                    {purchase.razorpay_payment_id === "free" ? "Free Claim" : `Razorpay (${purchase.razorpay_payment_id.substring(0, 8)})`}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground">Customer Email</span>
                  <span className="font-medium text-foreground truncate max-w-[130px]">{purchase.customer_email}</span>
                </div>
              </div>
            </div>

            {/* Quick Support Card */}
            <div className="bg-card/40 border border-border rounded-2xl p-5 backdrop-blur text-center space-y-3.5">
              <HelpCircle size={28} className="text-primary mx-auto" />
              <h3 className="font-display text-sm font-semibold">Need Help Setting Up?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you encounter any issues downloading your asset, or need custom configurations for your workspace, reach out directly to support.
              </p>
              <a 
                href="mailto:ravikumar@devforge.dev" 
                className="inline-flex justify-center items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                Send Email to Support →
              </a>
            </div>

            {/* Back Button */}
            <Link to="/dashboard" className="block">
              <Button variant="outlineNeon" className="w-full text-xs uppercase tracking-wider py-5 font-bold h-auto">
                Go to Founder Hub
              </Button>
            </Link>
            
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
