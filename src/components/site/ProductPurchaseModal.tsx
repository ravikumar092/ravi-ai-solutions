import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  registerPublicUser,
  loginPublicUser,
  claimFreeProduct,
} from "@/lib/purchases.functions";
import {
  CreditCard, CheckCircle2, Loader2, Sparkles, LogIn, UserPlus,
  Eye, EyeOff, AlertCircle, Download, Gift,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency?: string;
  category: string;
  file_url?: string | null;
  file_name?: string | null;
}

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

function isFreeProduct(price: string) {
  if (!price) return false;
  const upper = price.trim().toUpperCase();
  if (upper === "FREE" || upper === "0" || upper === "$0") return true;
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  return !isNaN(numeric) && numeric === 0;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function ProductPurchaseModal({
  open,
  onOpenChange,
  product,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  currentUser: any;
}) {
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const registerUser = useServerFn(registerPublicUser);
  const loginUser = useServerFn(loginPublicUser);
  const claimFree = useServerFn(claimFreeProduct);
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Auth states
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Payment / claim states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [purchaseId, setPurchaseId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);

  // Reset states when closed
  useEffect(() => {
    if (!open) {
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthError(null);
      setAuthLoading(false);
      setSubmitting(false);
      setSuccess(false);
      setPurchaseId("");
      setDownloadUrl(null);
      setDownloadName(null);
    }
  }, [open]);

  // Release body pointer-events lock set by Radix UI when Razorpay overlay is active
  useEffect(() => {
    if (submitting) {
      document.body.style.pointerEvents = "auto";
    } else {
      document.body.style.pointerEvents = "";
    }
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, [submitting]);

  // Auto-navigate to purchase detail page after success
  useEffect(() => {
    if (success && purchaseId) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        navigate({ to: `/purchases/${purchaseId}` });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [success, purchaseId, navigate, onOpenChange]);

  if (!product) return null;

  const isProductFree = isFreeProduct(product.price);
  const currency = product.currency || "USD";
  const priceNumeric = parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
  const displayPrice = isProductFree ? "FREE" : formatPriceDisplay(product.price, currency);

  // ---------- Auth submit ----------
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      let result;
      if (authMode === "register") {
        if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
          throw new Error("All fields are required for registration.");
        }
        if (authPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        result = await registerUser({
          name: authName,
          email: authEmail,
          password: authPassword,
        });
      } else {
        if (!authEmail.trim() || !authPassword.trim()) {
          throw new Error("Email and password are required.");
        }
        result = await loginUser({
          email: authEmail,
          password: authPassword,
        });
      }

      if (result && result.success && result.sessionId) {
        document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        await qc.invalidateQueries({ queryKey: ["current-user"] });
        toast.success(authMode === "register" ? "Account created!" : "Logged in!");
      }
    } catch (err: any) {
      console.error("[checkout-auth] Auth failure:", err);
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ---------- Free claim ----------
  const handleClaimFree = async () => {
    if (!currentUser) {
      toast.error("You must be registered to claim this product.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await claimFree({ product_id: product.id });
      if (result && result.success) {
        setPurchaseId(result.purchaseId);
        setDownloadUrl(result.fileUrl ?? null);
        setDownloadName(result.fileName ?? null);
        setSuccess(true);
        // Refresh purchases cache
        qc.invalidateQueries({ queryKey: ["user-purchases"] });
        if (result.alreadyClaimed) {
          toast.info("You've already claimed this product. Here's your download link.");
        } else {
          toast.success("Product claimed successfully!");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to claim product.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Paid checkout ----------
  const handlePaymentSubmit = async () => {
    if (!currentUser) {
      toast.error("You must be registered to make payments.");
      return;
    }
    setSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Razorpay SDK failed to load. Are you offline?");

      // Razorpay only supports UPI for INR transactions. Convert USD to INR.
      let paymentCurrency = currency;
      let paymentAmount = priceNumeric;
      if (paymentCurrency === "USD") {
        paymentCurrency = "INR";
        paymentAmount = Math.round(priceNumeric * 83); // 1 USD = 83 INR
      }

      const order = await createOrder({ amount: paymentAmount, currency: paymentCurrency });
      if (!order || !order.id) throw new Error("Failed to initialize transaction order.");

      const options = {
        key: "rzp_test_SsrTNCIouAETfu",
        amount: order.amount,
        currency: order.currency,
        name: "Ravi Kumar AI Lab",
        description: product.title,
        order_id: order.id,
        prefill: {
          name: currentUser.firstName || "Customer",
          email: currentUser.email || "",
        },
        theme: { color: "#4ade80" },
        modal: {
          ondismiss: () => { setSubmitting(false); },
        },
        handler: async function (response: any) {
          setSubmitting(true);
          try {
            const result = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              product_id: product.id,
              product_title: product.title,
              amount: paymentAmount,
              currency: paymentCurrency,
              customer_name: currentUser.firstName || "Customer",
              customer_email: currentUser.email || "",
            });

            if (result && result.success) {
              setPurchaseId(result.purchaseId);
              setDownloadUrl(result.fileUrl ?? null);
              setDownloadName(result.fileName ?? null);
              setSuccess(true);
              qc.invalidateQueries({ queryKey: ["user-purchases"] });
              toast.success("Payment completed successfully!");
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to verify transaction.");
          } finally {
            setSubmitting(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong initiating checkout.");
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // ===================== RENDER =====================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-6 backdrop-blur">

        {/* ── SUCCESS VIEW ── */}
        {success ? (
          <div className="text-center py-6 space-y-5">
            <div className={`inline-flex items-center justify-center h-14 w-14 rounded-full border ${isProductFree ? "bg-violet-950/40 border-violet-500/30 text-violet-400" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"}`}>
              {isProductFree ? <Gift size={28} className="animate-pulse" /> : <CheckCircle2 size={32} className="animate-pulse" />}
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold flex items-center justify-center gap-1.5">
                <Sparkles size={16} className="text-primary" />
                {isProductFree ? "Product Claimed!" : "Payment Successful!"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isProductFree
                  ? `You've successfully claimed "${product.title}". It's now available in your dashboard.`
                  : `Thank you for purchasing "${product.title}". Transaction recorded for ${currentUser?.email}.`}
              </p>
            </div>

            {/* Download Button (if file attached) */}
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={downloadName || true}
                className="inline-flex items-center justify-center gap-2 w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-semibold text-sm rounded-lg py-3 px-4 transition-colors"
              >
                <Download size={16} />
                Download {downloadName || "File"}
              </a>
            )}

            <div className="rounded-lg bg-muted/10 border border-border p-3 max-w-xs mx-auto text-[10px] text-muted-foreground space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Purchase ID:</span>
                <span className="text-foreground">{purchaseId.substring(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="text-foreground font-semibold">{isProductFree ? "Free" : displayPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Account:</span>
                <span className="text-foreground truncate max-w-[150px]">{currentUser?.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1.5 pb-0.5">
              <Loader2 className="animate-spin text-primary" size={14} />
              <span className="font-semibold">Securing access & redirecting...</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="hero"
                onClick={() => { onOpenChange(false); navigate({ to: `/purchases/${purchaseId}` }); }}
                className="w-full text-xs"
              >
                View Purchase Details →
              </Button>
              <Button variant="outlineNeon" onClick={() => onOpenChange(false)} className="w-full text-xs">
                Continue Browsing
              </Button>
            </div>
          </div>

        ) : !currentUser ? (
          /* ── AUTH VIEW ── */
          <>
            <DialogHeader className="pb-3 border-b border-border/30">
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                {isProductFree ? (
                  <><Gift className="text-violet-400" size={20} /> Claim Free Product</>
                ) : authMode === "register" ? (
                  <><UserPlus className="text-primary" size={20} /> Register Account</>
                ) : (
                  <><LogIn className="text-primary" size={20} /> Account Sign In</>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {isProductFree
                  ? "Create a free account or sign in to claim and download this product."
                  : "Register or sign in to complete your purchase."}
              </DialogDescription>
            </DialogHeader>

            {/* Free product banner */}
            {isProductFree && (
              <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2.5">
                <Gift size={16} className="text-violet-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-violet-300">{product.title}</p>
                  <p className="text-[10px] text-violet-400/70">100% Free — just create an account</p>
                </div>
              </div>
            )}

            {authError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 pt-4">
              {authMode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name" className="text-xs font-semibold text-muted-foreground">Your Name</Label>
                  <Input id="auth-name" required placeholder="e.g. John Doe" value={authName} onChange={(e) => setAuthName(e.target.value)} disabled={authLoading} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                <Input id="auth-email" required type="email" placeholder="e.g. john@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} disabled={authLoading} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-password" className="text-xs font-semibold text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="auth-password"
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    disabled={authLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {authMode === "register" && (
                  <span className="text-[9px] text-muted-foreground">Must be at least 6 characters.</span>
                )}
              </div>

              <div className="pt-2">
                <Button variant={isProductFree ? "outlineNeon" : "hero"} type="submit" disabled={authLoading} className="w-full h-10 text-xs font-semibold gap-2">
                  {authLoading ? (
                    <><Loader2 className="animate-spin" size={14} /> Processing…</>
                  ) : authMode === "register" ? (
                    isProductFree
                      ? <><Gift size={14} /> Create Account & Claim Free</>
                      : <><UserPlus size={14} /> Register & Continue</>
                  ) : (
                    isProductFree
                      ? <><LogIn size={14} /> Sign In & Claim Free</>
                      : <><LogIn size={14} /> Sign In & Continue</>
                  )}
                </Button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setAuthError(null); }}
                  className="text-[11px] text-primary hover:underline"
                >
                  {authMode === "register" ? "Already have an account? Sign In" : "New here? Create a Free Account"}
                </button>
              </div>
            </form>
          </>

        ) : isProductFree ? (
          /* ── FREE CLAIM VIEW ── */
          <>
            <DialogHeader className="pb-3 border-b border-border/30">
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Gift className="text-violet-400" size={20} />
                Claim Free Product
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                This product is free — claim it instantly and download from your dashboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              {/* Product summary */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{product.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                </div>
                <span className="text-lg font-bold font-display text-violet-400 ml-4 flex-shrink-0">FREE</span>
              </div>

              {/* Logged-in account */}
              <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
                  <span className="text-muted-foreground font-medium">Logged In Account</span>
                  <button onClick={handleLogout} className="text-[10px] text-rose-400 hover:underline">Log Out</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-semibold">Name</span>
                    <span className="font-medium text-foreground">{currentUser.firstName || "User"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-semibold">Email</span>
                    <span className="font-medium text-foreground truncate block max-w-[150px]">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* What they get */}
              {product.file_url && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-3 py-2.5 text-xs text-emerald-400">
                  <Download size={14} className="flex-shrink-0" />
                  <span>A downloadable file is included with this product</span>
                </div>
              )}

              <Button
                variant="hero"
                onClick={handleClaimFree}
                disabled={submitting}
                className="w-full h-11 text-sm font-semibold gap-2"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {submitting ? (
                  <><Loader2 className="animate-spin" size={16} /> Claiming…</>
                ) : (
                  <><Gift size={16} /> Claim Free Product</>
                )}
              </Button>
              <p className="text-[9px] text-muted-foreground text-center">
                No payment required. Product saved to your dashboard.
              </p>
            </div>
          </>

        ) : (
          /* ── PAID CHECKOUT VIEW ── */
          <>
            <DialogHeader className="pb-3 border-b border-border/30">
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <CreditCard className="text-primary" size={20} />
                Checkout Order
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Confirm purchase details to launch Razorpay overlay.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              {/* Product Card */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground leading-tight">{product.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 max-w-[280px]">{product.description}</p>
                  {product.file_url && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
                      <Download size={9} /> Downloadable file included
                    </span>
                  )}
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className="text-lg font-bold font-display tracking-tight neon-text">{displayPrice}</span>
                  <span className="text-[9px] text-muted-foreground block">One-time payment</span>
                </div>
              </div>

              {/* Account info */}
              <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
                  <span className="text-muted-foreground font-medium">Logged In Account</span>
                  <button onClick={handleLogout} className="text-[10px] text-rose-400 hover:underline">Log Out</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-semibold">Name</span>
                    <span className="font-medium text-foreground">{currentUser.firstName || "Customer"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-semibold">Email</span>
                    <span className="font-medium text-foreground truncate block max-w-[150px]">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <div className="pt-2">
                <Button
                  variant="hero"
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="w-full h-11 text-sm font-semibold gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="animate-spin" size={16} /> Initializing Checkout…</>
                  ) : (
                    <>Pay {displayPrice} with Razorpay</>
                  )}
                </Button>
                <span className="text-[9px] text-muted-foreground text-center block mt-2">
                  Clicking will open Razorpay's overlay payment gateway on the same page.
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
