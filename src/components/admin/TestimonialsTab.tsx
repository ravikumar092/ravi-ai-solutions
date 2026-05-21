import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listAllTestimonials, upsertTestimonial, deleteTestimonial } from "@/lib/testimonials.functions";

export function TestimonialsTab() {
  const fetchAll = useServerFn(listAllTestimonials);
  const upsert = useServerFn(upsertTestimonial);
  const remove = useServerFn(deleteTestimonial);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({ queryKey: ["admin-testimonials"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { toast.success("Testimonial saved"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); qc.invalidateQueries({ queryKey: ["public-testimonials"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); qc.invalidateQueries({ queryKey: ["public-testimonials"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold">Testimonials</h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add testimonial
          </Button>
        </div>

        {isLoading && [1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-card/50 animate-pulse" />)}

        {data.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No testimonials yet. Add your first client quote.</p>
          </div>
        )}

        {data.map((t: any) => (
          <div key={t.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === t.id ? "border-primary/40" : "border-border"}`}>
            {t.image_url ? (
              <img src={t.image_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                {t.name?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{t.name}</span>
                {t.role && <span className="text-xs text-muted-foreground">· {t.role}</span>}
                {!t.is_active && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 italic">"{t.quote}"</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(t)}><Pencil size={12} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Delete?")) del.mutate(t.id); }}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>

      <TestimonialForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function TestimonialForm({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    role: initial?.role ?? "",
    quote: initial?.quote ?? "",
    image_url: initial?.image_url ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">{isNew ? "New testimonial" : "Edit testimonial"}</h3>
        {!isNew && <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="Client name"><Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Field label="Role / Company"><Input value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. CEO at Acme" /></Field>
        <Field label="Quote">
          <Textarea required rows={4} value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} placeholder="What did they say about working with you?" />
        </Field>
        <Field label="Photo URL (optional)">
          <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://…" />
          {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-12 w-12 rounded-full object-cover border border-border" onError={(e: any) => { e.target.style.display="none"; }} />}
        </Field>
        <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} /></Field>
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer ${form.is_active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`} onClick={() => setForm({...form, is_active: !form.is_active})}>
          <div>
            <p className="text-sm font-medium">{form.is_active ? "Visible on site" : "Hidden from site"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{form.is_active ? "Shows in the testimonials section" : "Won't appear publicly"}</p>
          </div>
          <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} onClick={e => e.stopPropagation()} />
        </div>
        <Button variant="hero" type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : isNew ? "Add testimonial" : "Save changes"}</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
