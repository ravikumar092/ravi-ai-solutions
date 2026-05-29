import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { syncSupabaseSession } from "@/lib/purchases.functions";
import { toast } from "sonner";
import { CursorGlow } from "@/components/site/CursorGlow";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "shortcut icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const syncSession = useServerFn(syncSupabaseSession);

  useEffect(() => {
    let active = true;

    async function checkOAuthSession() {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token && active) {
          console.log("[root] Found active Supabase OAuth session, syncing...");
          const result = await syncSession({ accessToken: session.access_token });
          if (result?.success && result.sessionId) {
            document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            // Log out from Supabase client to clean local storage
            await supabase.auth.signOut();

            await queryClient.invalidateQueries({ queryKey: ["current-user"] });
            toast.success("Signed in successfully! 👋");
            
            // Redirect to dashboard if they are on home or auth screens
            const currentPath = window.location.pathname;
            if (currentPath === "/" || currentPath === "/signin" || currentPath === "/signup") {
              navigate({ to: "/dashboard" });
            }
          }
        }
      } catch (err: any) {
        console.error("[root] OAuth sync error:", err);
      }
    }

    checkOAuthSession();

    let authListener: any;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session?.access_token) {
          try {
            console.log("[root] Supabase onAuthStateChange SIGNED_IN, syncing...");
            const result = await syncSession({ accessToken: session.access_token });
            if (result?.success && result.sessionId) {
              document.cookie = `replit_session=${encodeURIComponent(result.sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

              // Sign out from Supabase client
              await supabase.auth.signOut();

              await queryClient.invalidateQueries({ queryKey: ["current-user"] });
              toast.success("Signed in successfully! 👋");
              
              const currentPath = window.location.pathname;
              if (currentPath === "/" || currentPath === "/signin" || currentPath === "/signup") {
                navigate({ to: "/dashboard" });
              }
            }
          } catch (err: any) {
            console.error("[root] OAuth state change sync error:", err);
          }
        }
      });
      authListener = subscription;
    });

    return () => {
      active = false;
      if (authListener) authListener.unsubscribe();
    };
  }, [syncSession, queryClient, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <CursorGlow />
      <Outlet />
    </QueryClientProvider>
  );
}
