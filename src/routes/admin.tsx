import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, LayoutGrid, Youtube, Users, MessageSquare,
  FileText, HelpCircle, Settings, TrendingUp, LogOut, Menu, X,
} from "lucide-react";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { TestimonialsTab } from "@/components/admin/TestimonialsTab";
import { BlogTab } from "@/components/admin/BlogTab";
import { FaqsTab } from "@/components/admin/FaqsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { LeadsTab } from "@/components/admin/LeadsTab";
import { ServicesAdmin } from "@/components/admin/ServicesTab";
import { VideosAdmin } from "@/components/admin/VideosTab";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Ravi Kumar AI Lab" }] }),
  component: AdminPage,
});

type Section =
  | "dashboard" | "services" | "videos" | "testimonials"
  | "blog" | "faqs" | "leads" | "settings" | "analytics";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "leads",        label: "Leads",        icon: Users },
  { id: "analytics",   label: "Analytics",    icon: TrendingUp },
  { id: "services",    label: "Services",     icon: LayoutGrid },
  { id: "videos",      label: "Videos",       icon: Youtube },
  { id: "testimonials",label: "Testimonials", icon: MessageSquare },
  { id: "blog",        label: "Blog",         icon: FileText },
  { id: "faqs",        label: "FAQ",          icon: HelpCircle },
  { id: "settings",    label: "Settings",     icon: Settings },
];

function AdminPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) nav({ to: "/login" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) nav({ to: "/login" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [nav]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
    </div>
  );

  const handleNav = (s: string) => {
    setSection(s as Section);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-40 w-56 bg-card/80 backdrop-blur border-r border-border
        flex flex-col transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          <Link to="/" className="font-display text-sm font-bold">
            <span className="neon-text">Ravi Kumar</span>
            <span className="text-muted-foreground"> Admin</span>
          </Link>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                section === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border flex-shrink-0">
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs"
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/login" }); }}
          >
            <LogOut size={13} /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur flex items-center gap-3 px-4 lg:hidden flex-shrink-0">
          <button className="text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm capitalize">{section}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {section === "dashboard"    && <DashboardTab onNav={handleNav} />}
          {section === "services"     && <ServicesAdmin />}
          {section === "videos"       && <VideosAdmin />}
          {section === "testimonials" && <TestimonialsTab />}
          {section === "blog"         && <BlogTab />}
          {section === "faqs"         && <FaqsTab />}
          {section === "leads"        && <LeadsTab />}
          {section === "settings"     && <SettingsTab />}
          {section === "analytics"    && <AnalyticsTab />}
        </main>
      </div>
    </div>
  );
}
