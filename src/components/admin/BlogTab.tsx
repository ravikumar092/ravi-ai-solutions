import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listAllPosts, upsertPost, deletePost } from "@/lib/blog.functions";

export function BlogTab() {
  const fetchAll = useServerFn(listAllPosts);
  const upsert = useServerFn(upsertPost);
  const remove = useServerFn(deletePost);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({ queryKey: ["admin-blog"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { toast.success("Post saved"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); qc.invalidateQueries({ queryKey: ["public-blog"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); qc.invalidateQueries({ queryKey: ["public-blog"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const published = (data as any[]).filter(p => p.is_published);
  const drafts = (data as any[]).filter(p => !p.is_published);

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Blog</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{published.length} published · {drafts.length} drafts</p>
          </div>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> New post
          </Button>
        </div>

        {isLoading && [1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-card/50 animate-pulse" />)}

        {data.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <FileText size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No posts yet. Write your first article or case study.</p>
          </div>
        )}

        {(data as any[]).map((p) => (
          <div key={p.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === p.id ? "border-primary/40" : "border-border"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {p.is_published ? (
                  <Globe size={12} className="text-primary flex-shrink-0" />
                ) : (
                  <FileText size={12} className="text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{p.title}</span>
                <Badge variant={p.is_published ? "default" : "secondary"} className="text-[10px] flex-shrink-0">
                  {p.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{p.excerpt}</p>}
              <p className="text-[11px] text-muted-foreground">
                {p.is_published && p.published_at
                  ? `Published ${new Date(p.published_at).toLocaleDateString()}`
                  : `Created ${new Date(p.created_at).toLocaleDateString()}`}
                {" · "}slug: <code className="bg-muted px-1 rounded">{p.slug}</code>
              </p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(p)}><Pencil size={12} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>

      <PostForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function PostForm({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    is_published: initial?.is_published ?? false,
    sort_order: initial?.sort_order ?? 0,
  });

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">{isNew ? "New post" : "Edit post"}</h3>
        {!isNew && <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="Title">
          <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value, slug: isNew ? autoSlug(e.target.value) : form.slug})} />
        </Field>
        <Field label="Slug (URL)">
          <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated from title" />
        </Field>
        <Field label="Excerpt (optional)">
          <Input value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="One-line summary for the card preview" />
        </Field>
        <Field label="Content (Markdown)">
          <Textarea required rows={10} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your article here… Markdown is supported." className="font-mono text-xs" />
        </Field>
        <div className="flex items-center gap-2">
          <Switch checked={form.is_published} onCheckedChange={v => setForm({...form, is_published: v})} />
          <Label className="text-sm">{form.is_published ? <span className="flex items-center gap-1 text-primary"><Globe size={13}/>Published</span> : <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13}/>Draft</span>}</Label>
        </div>
        <Button variant="hero" type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : isNew ? "Create post" : "Save changes"}</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
