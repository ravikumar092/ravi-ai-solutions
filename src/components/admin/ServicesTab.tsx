import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listAllServices, upsertService, deleteService } from "@/lib/services.functions";

export function ServicesAdmin() {
  const fetchAll = useServerFn(listAllServices);
  const upsert = useServerFn(upsertService);
  const remove = useServerFn(deleteService);
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useQuery({ queryKey: ["admin-services"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { toast.success("Service saved"); qc.invalidateQueries({ queryKey: ["admin-services"] }); qc.invalidateQueries({ queryKey: ["public-services"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-services"] }); qc.invalidateQueries({ queryKey: ["public-services"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold">Services</h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add service
          </Button>
        </div>

        {isLoading && [1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-card/50 animate-pulse" />)}
        {!isLoading && (services as any[]).length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No services yet.</div>
        )}

        {(services as any[]).map((s) => (
          <div key={s.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === s.id ? "border-primary/40" : "border-border"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {s.icon && <span className="text-lg">{s.icon}</span>}
                <span className="font-medium text-sm">{s.title}</span>
                {s.price && <Badge variant="outline" className="text-[10px]">{s.price}</Badge>}
                {!s.is_active && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(s)}><Pencil size={12} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Delete this service?")) del.mutate(s.id); }}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>

      <ServiceForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function ServiceForm({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    icon: initial?.icon ?? "",
    price: initial?.price ?? "",
    image_url: initial?.image_url ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">{isNew ? "New service" : "Edit service"}</h3>
        {!isNew && <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="Title"><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Description"><Textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Icon (emoji)"><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🤖" /></Field>
          <Field label="Price"><Input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$2,500" /></Field>
        </div>
        <Field label="Image URL (optional)"><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
          <div className="flex items-end gap-2 pb-0.5">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">{form.is_active ? <span className="flex items-center gap-1"><Eye size={13} />Visible</span> : <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} />Hidden</span>}</Label>
          </div>
        </div>
        <Button variant="hero" type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : isNew ? "Add service" : "Save changes"}</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
