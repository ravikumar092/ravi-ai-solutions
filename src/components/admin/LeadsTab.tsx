import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Download, Search, Filter, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { listLeads, updateLeadStatus, updateLeadNotes, deleteLead, exportLeadsCSV, replyToLead } from "@/lib/leads.functions";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary/15 text-primary border-primary/20",
  contacted: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  lost: "bg-muted text-muted-foreground border-border",
};

export function LeadsTab() {
  const fetchLeads = useServerFn(listLeads);
  const updateStatus = useServerFn(updateLeadStatus);
  const updateNotes = useServerFn(updateLeadNotes);
  const removeLeads = useServerFn(deleteLead);
  const exportCSV = useServerFn(exportLeadsCSV);
  const sendReply = useServerFn(replyToLead);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads() });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [replyState, setReplyState] = useState<{ id: string; email: string; name: string } | null>(null);
  const [replyForm, setReplyForm] = useState({ subject: "", body: "" });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (leads as any[]).filter((l) => {
      const matchSearch = !q || `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    return (leads as any[]).reduce((acc: any, l: any) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: any }) => updateStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
  });

  const saveNotes = useMutation({
    mutationFn: (v: { id: string; notes: string }) => updateNotes({ data: v }),
    onSuccess: () => { toast.success("Notes saved"); qc.invalidateQueries({ queryKey: ["admin-leads"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeLeads({ data: { id } }),
    onSuccess: () => { toast.success("Lead deleted"); qc.invalidateQueries({ queryKey: ["admin-leads"] }); },
  });

  const reply = useMutation({
    mutationFn: (v: any) => sendReply({ data: v }),
    onSuccess: () => {
      toast.success("Reply sent and lead marked as contacted");
      setReplyState(null);
      setReplyForm({ subject: "", body: "" });
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send — check Resend API key in Settings"),
  });

  const handleExport = async () => {
    try {
      const csv = await exportCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["new","contacted","won","lost"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border p-4 text-left transition-all ${statusFilter === s ? "border-primary/40 bg-primary/5" : "border-border bg-card/40 hover:border-border/80"}`}
          >
            <p className="text-2xl font-bold font-display">{counts[s] ?? 0}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-muted border border-border rounded-md px-3 h-9 text-sm text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <Button size="sm" variant="outlineNeon" className="h-9 gap-1.5 text-xs" onClick={handleExport}>
            <Download size={13} /> Export CSV
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}{search || statusFilter !== "all" ? " (filtered)" : ""}</p>

      {/* Reply modal */}
      {replyState && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Reply to {replyState.name}</h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setReplyState(null)}><X size={13} /></Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">To</label>
                <p className="text-sm text-muted-foreground border border-border rounded-md px-3 py-2 bg-muted/30">{replyState.email}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Subject</label>
                <Input value={replyForm.subject} onChange={e => setReplyForm(f => ({...f, subject: e.target.value}))} placeholder="Re: Your enquiry" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Message</label>
                <Textarea rows={6} value={replyForm.body} onChange={e => setReplyForm(f => ({...f, body: e.target.value}))} placeholder="Write your reply…" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setReplyState(null)}>Cancel</Button>
              <Button
                variant="hero" size="sm" className="gap-1.5"
                disabled={!replyForm.subject || !replyForm.body || reply.isPending}
                onClick={() => reply.mutate({ id: replyState.id, to_email: replyState.email, to_name: replyState.name, ...replyForm })}
              >
                <Send size={13} /> {reply.isPending ? "Sending…" : "Send reply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead list */}
      <div className="space-y-2">
        {isLoading && [1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-card/50 animate-pulse" />)}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {search || statusFilter !== "all" ? "No leads match your filters." : "No leads yet."}
          </div>
        )}

        {filtered.map((l: any) => {
          const isOpen = expanded === l.id;
          const localNotes = notesMap[l.id] ?? l.notes ?? "";
          return (
            <div key={l.id} className="rounded-xl border border-border bg-card/40 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  {l.first_name?.[0]}{l.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{l.first_name} {l.last_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[l.status]}`}>{l.status}</span>
                    {l.notes && <span className="text-[10px] text-muted-foreground border border-border/50 px-2 py-0.5 rounded-full">has notes</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <a href={`mailto:${l.email}`} className="hover:text-primary transition-colors">{l.email}</a>
                    {l.help_with && <><span>·</span><span className="truncate max-w-[160px]">{l.help_with}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-muted-foreground hidden md:block">
                    {new Date(l.created_at).toLocaleDateString()}
                  </span>
                  <select
                    value={l.status}
                    onChange={(e) => setStatus.mutate({ id: l.id, status: e.target.value })}
                    className="bg-muted border border-border rounded-md px-2 py-1 text-xs"
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                  <Button
                    size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => { setReplyState({ id: l.id, email: l.email, name: l.first_name }); setReplyForm({ subject: `Re: Your enquiry`, body: `Hi ${l.first_name},\n\n` }); }}
                  >
                    <Send size={11} /> Reply
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setExpanded(isOpen ? null : l.id)}
                  >
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                    onClick={() => { if (confirm("Delete this lead?")) del.mutate(l.id); }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border bg-muted/10">
                  <div className="px-4 py-4 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                    {[["Phone", l.phone], ["Goal", l.goal], ["Stage", l.stage], ["Best time", l.best_time], ["Needs", l.needs]].map(([label, val]) =>
                      val ? (
                        <div key={label}>
                          <p className="text-muted-foreground mb-0.5">{label}</p>
                          <p className="text-foreground">{val}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                  <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground font-medium">Internal notes</p>
                    <Textarea
                      rows={3}
                      placeholder="Add private notes about this lead…"
                      value={localNotes}
                      onChange={e => setNotesMap(m => ({...m, [l.id]: e.target.value}))}
                      className="text-xs"
                    />
                    <Button
                      size="sm" variant="outlineNeon" className="h-7 text-xs gap-1.5"
                      onClick={() => saveNotes.mutate({ id: l.id, notes: localNotes })}
                      disabled={saveNotes.isPending}
                    >
                      Save notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
