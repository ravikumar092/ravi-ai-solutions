import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin Login — Ravi Kumar AI Lab" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show error from URL query param (e.g. ?error=auth_failed)
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlError = search?.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        redirect: "manual",
      });

      if (res.status === 200 || res.status === 0) {
        // Success — server sets cookie and returns redirect
        window.location.href = "/admin";
        return;
      }

      let msg = "Invalid username or password.";
      try {
        const body = await res.json();
        if (body?.error) msg = body.error;
      } catch {}
      setError(msg);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 backdrop-blur p-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access the admin dashboard.
        </p>

        {(error || urlError) && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error ?? (urlError === "auth_failed" ? "Login failed. Please try again." : urlError)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
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
            className="w-full gap-2 mt-2"
            disabled={loading || !username || !password}
          >
            <LogIn size={16} />
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
