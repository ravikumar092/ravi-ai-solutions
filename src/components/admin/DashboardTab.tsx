import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Users, LayoutGrid, Youtube, TrendingUp, MessageSquare, FileText, HelpCircle, ArrowRight, Clock } from "lucide-react";
import { listLeads } from "@/lib/leads.functions";
import { listAllServices } from "@/lib/services.functions";
import { listAllVideos } from "@/lib/videos.functions";

const STATUS_COLOR: Record<string, string> = {
  new: "bg-primary/20 text-primary",
  contacted: "bg-blue-500/20 text-blue-400",
  won: "bg-emerald-500/20 text-emerald-400",
  lost: "bg-muted text-muted-foreground",
};

export function DashboardTab({ onNav }: { onNav: (section: string) => void }) {
  const fetchLeads = useServerFn(listLeads);
  const fetchServices = useServerFn(listAllServices);
  const fetchVideos = useServerFn(listAllVideos);

  const { data: leads = [] } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads() });
  const { data: services = [] } = useQuery({ queryKey: ["admin-services"], queryFn: () => fetchServices() });
  const { data: videosResult } = useQuery({ queryKey: ["admin-videos"], queryFn: () => fetchVideos() });
  const videos = videosResult?.videos ?? [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = leads.filter((l: any) => new Date(l.created_at) > weekAgo);
  const newLeads = leads.filter((l: any) => l.status === "new");
  const recentLeads = [...leads].slice(0, 6);

  const stats = [
    { label: "Total Leads", value: leads.length, icon: Users, sub: `${newThisWeek.length} this week`, action: () => onNav("leads") },
    { label: "New / Unread", value: newLeads.length, icon: TrendingUp, sub: "Need follow-up", action: () => onNav("leads") },
    { label: "Active Services", value: services.filter((s: any) => s.is_active).length, icon: LayoutGrid, sub: `${services.length} total`, action: () => onNav("services") },
    { label: "Tutorials", value: videos.length, icon: Youtube, sub: "YouTube videos", action: () => onNav("videos") },
  ];

  const shortcuts = [
    { label: "Add a service", icon: LayoutGrid, section: "services" },
    { label: "Add a video", icon: Youtube, section: "videos" },
    { label: "Add testimonial", icon: MessageSquare, section: "testimonials" },
    { label: "Write a post", icon: FileText, section: "blog" },
    { label: "Add FAQ", icon: HelpCircle, section: "faqs" },
    { label: "View analytics", icon: TrendingUp, section: "analytics" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={s.action}
            className="text-left rounded-xl border border-border bg-card/50 p-5 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <s.icon size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <ArrowRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Recent leads */}
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Recent Leads</h3>
            <button onClick={() => onNav("leads")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View all →
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No leads yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentLeads.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {l.first_name?.[0]}{l.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.first_name} {l.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.help_with || l.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[l.status] ?? STATUS_COLOR.new}`}>
                      {l.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(l.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Quick Actions</h3>
          </div>
          <div className="p-3 space-y-1">
            {shortcuts.map((sc) => (
              <button
                key={sc.section}
                onClick={() => onNav(sc.section)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-left"
              >
                <sc.icon size={14} />
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
