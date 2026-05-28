import { Loader2 } from "lucide-react";

// ── Shared admin loading primitives ─────────────────────────────────────────

/** Full-area spinner shown while the tab's primary query is in flight */
export function TabLoader({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p className="text-xs font-medium animate-pulse">{label}</p>
    </div>
  );
}

/** Row-shaped skeleton — use in lists */
export function SkeletonRow({ h = "h-16" }: { h?: string }) {
  return (
    <div className={`${h} rounded-xl bg-muted/30 border border-border/30 animate-pulse`} />
  );
}

/** Card-shaped skeleton — use in grids */
export function SkeletonCard({ h = "h-28" }: { h?: string }) {
  return (
    <div className={`${h} rounded-xl bg-muted/30 border border-border/30 animate-pulse`} />
  );
}

/** Repeating skeleton rows */
export function SkeletonRows({ count = 4, h = "h-16" }: { count?: number; h?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} h={h} />
      ))}
    </div>
  );
}

/** Repeating skeleton cards in a grid */
export function SkeletonCards({ count = 3, h = "h-28", cols = "grid-cols-1" }: { count?: number; h?: string; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} h={h} />
      ))}
    </div>
  );
}

/** Stat card skeleton for the dashboard */
export function SkeletonStat() {
  return (
    <div className="rounded-xl border border-border/30 bg-card/30 p-5 animate-pulse space-y-3">
      <div className="h-8 w-8 rounded-lg bg-muted/50" />
      <div className="h-8 w-16 rounded bg-muted/50" />
      <div className="h-3 w-24 rounded bg-muted/40" />
    </div>
  );
}
