import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { loginPublicUser, syncSupabaseSession } from "@/lib/purchases.functions";

export const Route = createFileRoute("/signin")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: typeof s.mode === "string" ? s.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — Ravi Kumar AI Lab" },
      { name: "description", content: "Sign in to your account to access your purchased products, downloads, and dashboard." },
    ],
  }),
  component: SigninPage,
});

function SigninPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/signin" });
  const redirectTo = (search as any).redirect || "/dashboard";
  const mode = (search as any).mode;
  const loginUser = useServerFn(loginPublicUser);
  const syncSession = useServerFn(syncSupabaseSession);
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    
    async function checkOAuthSession() {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token && active) {
          setLoading(true);
          console.log("[signin] Found active Supabase OAuth session, syncing...");
          const result = await syncSession({ accessToken: session.access_token });
          if (result?.success && result.sessionId) {
            document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            
            // Log out from Supabase client to clean local storage
            await supabase.auth.signOut();
            
            await qc.invalidateQueries({ queryKey: ["current-user"] });
            if (mode === "signup") {
              toast.success("Welcome aboard! 🎉");
            } else {
              toast.success("Welcome back! 👋");
            }
            navigate({ to: redirectTo });
          }
        }
      } catch (err: any) {
        console.error("[signin] OAuth sync error:", err);
        toast.error(err.message || "Failed to sync Google session.");
        setLoading(false);
      }
    }

    checkOAuthSession();

    let authListener: any;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session?.access_token) {
          setLoading(true);
          try {
            console.log("[signin] Supabase onAuthStateChange SIGNED_IN, syncing...");
            const result = await syncSession({ accessToken: session.access_token });
            if (result?.success && result.sessionId) {
              document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
              
              // Sign out from Supabase client
              await supabase.auth.signOut();
              
              await qc.invalidateQueries({ queryKey: ["current-user"] });
              if (mode === "signup") {
                toast.success("Welcome aboard! 🎉");
              } else {
                toast.success("Welcome back! 👋");
              }
              navigate({ to: redirectTo });
            }
          } catch (err: any) {
            console.error("[signin] OAuth state change sync error:", err);
            toast.error(err.message || "Failed to sync Google session.");
            setLoading(false);
          }
        }
      });
      authListener = subscription;
    });

    return () => {
      active = false;
      if (authListener) authListener.unsubscribe();
    };
  }, [syncSession, redirectTo, navigate, qc, mode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/signin?redirect=" + encodeURIComponent(redirectTo),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google sign-in.");
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (result?.success && result.sessionId) {
        document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        await qc.invalidateQueries({ queryKey: ["current-user"] });
        toast.success("Welcome back! 👋");
        navigate({ to: redirectTo });
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <LogIn size={24} className="text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Sign in to access your dashboard &amp; downloads
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signin-password" className="text-xs font-semibold text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-11 gap-2 mt-2 text-sm font-semibold"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <><span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Signing in…</>
                ) : (
                  <><LogIn size={16} /> Sign In <ArrowRight size={14} /></>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outlineNeon"
              className="w-full h-11 gap-3 text-sm font-semibold hover:border-primary/45"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.93 1 12 1 7.42 1 3.52 3.63 1.67 7.43l3.85 2.99C6.44 7.48 9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.14-1.97 3.74-4.87 3.74-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.52 14.58c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.67 7.07C.86 8.7.4 10.53.4 12.5s.46 3.8.1.27l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.02.68-2.33 1.09-3.99 1.09-3.15 0-5.81-2.13-6.76-5.01L1.67 16.32C3.52 20.12 7.42 23 12 23z"
                />
              </svg>
              Google
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Create one free
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Admin?{" "}
            <Link to="/login" className="text-muted-foreground/70 hover:text-foreground underline">
              Admin login →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
