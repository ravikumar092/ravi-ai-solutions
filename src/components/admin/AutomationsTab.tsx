import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllAutomations, upsertAutomation, deleteAutomation, type Automation } from "@/lib/automations.functions";

export function AutomationsTab() {
  const fetchAll = useServerFn(listAllAutomations);
  const upsert = useServerFn(upsertAutomation);
  const remove = useServerFn(deleteAutomation);
  const qc = useQueryClient();

  const { data: automations = [], isLoading, error, isError } = useQuery({ 
    queryKey: ["admin-automations"], 
    queryFn: () => fetchAll() 
  });
  
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (isError) {
      console.error("admin-automations query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load automations");
    }
  }, [isError, error]);

  const save = useMutation({
    mutationFn: (v: any) => upsert(v),
    onSuccess: () => { 
      toast.success("Automation blueprint saved successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-automations"] }); 
      qc.invalidateQueries({ queryKey: ["public-automations"] }); 
      setEditing(null); 
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save automation"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ id }),
    onSuccess: () => { 
      toast.success("Automation blueprint deleted successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-automations"] }); 
      qc.invalidateQueries({ queryKey: ["public-automations"] }); 
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete automation"),
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "leads": return "Lead Gen & Outreach";
      case "ai-agents": return "AI Agents & RAG";
      case "social": return "Social & Scraping";
      case "ops": return "Business Operations";
      default: return cat;
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_450px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            Automation Blueprints
          </h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add Blueprint
          </Button>
        </div>

        {isLoading && [1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-card/50 animate-pulse" />)}
        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-destructive">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">Failed to load automations</p>
              <p className="opacity-80">{(error as any)?.message ?? "An error occurred"}</p>
            </div>
          </div>
        )}
        {!isLoading && !isError && automations.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No automations in database. Add your first automation blueprint to display.
          </div>
        )}

        {automations.map((a) => (
          <div key={a.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === a.id ? "border-primary/40 bg-card/60" : "border-border hover:border-border/80"} transition-all duration-150`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{a.title}</span>
                <Badge variant="outline" className={`text-[10px] uppercase font-semibold border-primary/20 ${a.platform === "n8n" ? "text-red-400 border-red-500/20 bg-red-500/5" : "text-violet-400 border-violet-500/20 bg-violet-500/5"}`}>
                  {a.platform}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {getCategoryLabel(a.category)}
                </Badge>
                <span className="text-xs font-semibold text-amber-400 px-1.5 py-0.5 rounded border border-amber-900/30 bg-amber-950/20">
                  {a.hours_saved}
                </span>
                {!a.is_active && (
                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{a.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span>Complexity: <strong className="text-indigo-300">{a.complexity}</strong></span>
                <span>Downloads: {a.downloads}</span>
                <span>Integrations: {a.integrations?.length || 0}</span>
                <span>Sort Order: {a.sort_order}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0 justify-center">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted/50" onClick={() => setEditing(a)} title="Edit blueprint">
                <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm(`Delete the blueprint "${a.title}"?`)) del.mutate(a.id); }} title="Delete blueprint">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AutomationForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function AutomationForm({ initial, onSave, onCancel, saving }: { initial: any, onSave: (v: any) => void, onCancel: () => void, saving: boolean }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "leads",
    platform: initial?.platform ?? "n8n",
    hours_saved: initial?.hours_saved ?? "",
    complexity: initial?.complexity ?? "Intermediate",
    downloads: initial?.downloads ?? "0+",
    integrationsRaw: initial?.integrations ? initial.integrations.join(", ") : "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedIntegrations = form.integrationsRaw
      .split(",")
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    onSave({
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      platform: form.platform,
      hours_saved: form.hours_saved,
      complexity: form.complexity,
      downloads: form.downloads,
      integrations: parsedIntegrations,
      sort_order: form.sort_order,
      is_active: form.is_active,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 h-fit sticky top-24 backdrop-blur">
      <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary animate-pulse" />
          {isNew ? "New Automation Blueprint" : "Modify Automation Blueprint"}
        </h3>
        {!isNew && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs px-2">
            Cancel Edit
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <Input required placeholder="e.g. AI Real Estate Lead Scraper" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        
        <Field label="Description">
          <Textarea required placeholder="Describe the workflow triggers, OpenAI actions, and integrations..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Lead Gen & Outreach</SelectItem>
                <SelectItem value="ai-agents">AI Agents & RAG</SelectItem>
                <SelectItem value="social">Social & Scraping</SelectItem>
                <SelectItem value="ops">Business Operations</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Platform">
            <Select value={form.platform} onValueChange={(val) => setForm({ ...form, platform: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="n8n">n8n</SelectItem>
                <SelectItem value="Make.com">Make.com</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Hours Saved">
            <Input required placeholder="e.g. 12 hrs/week" value={form.hours_saved} onChange={e => setForm({ ...form, hours_saved: e.target.value })} />
          </Field>
          <Field label="Complexity">
            <Select value={form.complexity} onValueChange={(val) => setForm({ ...form, complexity: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Downloads count">
            <Input required placeholder="e.g. 150+" value={form.downloads} onChange={e => setForm({ ...form, downloads: e.target.value })} />
          </Field>
        </div>

        <Field label="Integrations (comma separated)">
          <Input required placeholder="n8n, OpenAI, Notion, Slack" value={form.integrationsRaw} onChange={e => setForm({ ...form, integrationsRaw: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3 items-center border-t border-border/20 pt-3">
          <Field label="Sort Order">
            <Input type="number" min="0" max="9999" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Visibility Status</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} id="auto-visibility-switch" />
              <Label htmlFor="auto-visibility-switch" className="text-xs cursor-pointer select-none">
                {form.is_active ? (
                  <span className="flex items-center gap-1 text-emerald-400"><Eye size={13} /> Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} /> Hidden</span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Button variant="hero" type="submit" disabled={saving} className="w-full mt-2">
          {saving ? "Saving Blueprint…" : isNew ? "Add Automation Blueprint" : "Apply Blueprint Updates"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
