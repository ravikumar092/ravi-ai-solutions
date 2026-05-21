import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin Login — Ravi Kumar AI Lab" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 backdrop-blur p-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access the admin dashboard.
        </p>
        <div className="mt-6">
          <a href="/api/login">
            <Button variant="hero" className="w-full gap-2">
              <LogIn size={16} />
              Log in
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
