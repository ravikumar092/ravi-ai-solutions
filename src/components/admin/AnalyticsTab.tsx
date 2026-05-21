import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listLeads } from "@/lib/leads.functions";

function BarRow({ label, value, max, color = "bg-primary" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}</span>
    </div>
  );
}

export function AnalyticsTab() {
  const fetchLeads = useServerFn(listLeads);
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads() });

  if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse">Loading analytics…</div>;

  // Leads by status
  const byStatus: Record<string, number> = {};
  for (const l of leads as any[]) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
  const maxStatus = Math.max(...Object.values(byStatus), 1);

  // Leads by service
  const byService: Record<string, number> = {};
  for (const l of leads as any[]) {
    const k = l.help_with || "Unspecified";
    byService[k] = (byService[k] ?? 0) + 1;
  }
  const topServices = Object.entries(byService).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxService = Math.max(...topServices.map(([, v]) => v), 1);

  // Leads over last 30 days
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  for (const l of leads as any[]) {
    const day = l.created_at?.slice(0, 10);
    if (day && day in days) days[day]++;
  }
  const dayEntries = Object.entries(days);
  const maxDay = Math.max(...Object.values(days), 1);

  // Summary
  const won = (leads as any[]).filter(l => l.status === "won").length;
  const total = leads.length;
  const convRate = total > 0 ? Math.round((won / total) * 100) : 0;
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = (leads as any[]).filter(l => new Date(l.created_at) > weekAgo).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Analytics</h2>
        <p className="text-sm text-muted-foreground">Derived from your leads data.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: total },
          { label: "This Week", value: thisWeek },
          { label: "Won", value: won },
          { label: "Conversion Rate", value: `${convRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card/50 p-5">
            <p className="font-display text-3xl font-bold neon-text">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 30-day chart */}
      <div className="rounded-xl border border-border bg-card/30 p-5">
        <h3 className="font-semibold text-sm mb-5">Leads — last 30 days</h3>
        <div className="flex items-end gap-1 h-28">
          {dayEntries.map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-primary/30 hover:bg-primary/60 rounded-sm transition-colors cursor-default"
                style={{ height: `${Math.max((count / maxDay) * 100, count > 0 ? 8 : 2)}%` }}
                title={`${day}: ${count} lead${count !== 1 ? "s" : ""}`}
              />
              {/* tooltip */}
              {count > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {count}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{dayEntries[0]?.[0]?.slice(5)}</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By status */}
        <div className="rounded-xl border border-border bg-card/30 p-5">
          <h3 className="font-semibold text-sm mb-5">Leads by status</h3>
          <div className="space-y-3">
            {[["new", "bg-primary"], ["contacted", "bg-blue-500"], ["won", "bg-emerald-500"], ["lost", "bg-muted-foreground"]].map(([status, color]) => (
              <BarRow key={status} label={status} value={byStatus[status] ?? 0} max={maxStatus} color={color} />
            ))}
          </div>
        </div>

        {/* By service */}
        <div className="rounded-xl border border-border bg-card/30 p-5">
          <h3 className="font-semibold text-sm mb-5">Top services requested</h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {topServices.map(([label, value]) => (
                <BarRow key={label} label={label} value={value} max={maxService} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
