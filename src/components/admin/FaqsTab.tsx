import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listAllFaqs, upsertFaq, deleteFaq } from "@/lib/faqs.functions";
import { TabLoader } from "./AdminSkeletons";

export function FaqsTab() {
  const fetchAll = useServerFn(listAllFaqs);
  const upsert = useServerFn(upsertFaq);
  const remove = useServerFn(deleteFaq);
  const qc = useQueryClient();

  const { data = [], isLoading, error, isError } = useQuery({ 
    queryKey: ["admin-faqs"], 
    queryFn: () => fetchAll() 
  });
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (isError) {
      console.error("admin-faqs query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load FAQs");
    }
  }, [isError, error]);

  const save = useMutation({
    mutationFn: (v: any) => upsert(v),
    onSuccess: () => {
      toast.success("FAQ saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-faqs"] });
      qc.invalidateQueries({ queryKey: ["public-faqs"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save FAQ"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ id }),
    onSuccess: () => {
      toast.success("FAQ deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-faqs"] });
      qc.invalidateQueries({ queryKey: ["public-faqs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete FAQ"),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold">FAQ</h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add question
          </Button>
        </div>

        {isLoading && <TabLoader label="Loading FAQs…" />}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-destructive">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">Failed to load FAQs</p>
              <p className="opacity-80">{(error as any)?.message ?? "An error occurred"}</p>
            </div>
          </div>
        )}

        {data.length === 0 && !isLoading && !isError && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No FAQs yet. Add common questions visitors ask.</p>
          </div>
        )}

        {(data as any[]).map((f) => (
          <div key={f.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === f.id ? "border-primary/40" : "border-border"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{f.question}</span>
                {!f.is_active && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(f)}><Pencil size={12} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Delete?")) del.mutate(f.id); }}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>

      <FaqForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function FaqForm({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">{isNew ? "New FAQ" : "Edit FAQ"}</h3>
        {!isNew && <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="Question"><Input required value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder="e.g. What tools do you use?" /></Field>
        <Field label="Answer"><Textarea required rows={5} value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} placeholder="Detailed answer…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} /></Field>
          <div className="flex items-end gap-2 pb-0.5">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
            <Label className="text-sm">{form.is_active ? <span className="flex items-center gap-1"><Eye size={13}/>Visible</span> : <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13}/>Hidden</span>}</Label>
          </div>
        </div>
        <Button variant="hero" type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : isNew ? "Add FAQ" : "Save changes"}</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
