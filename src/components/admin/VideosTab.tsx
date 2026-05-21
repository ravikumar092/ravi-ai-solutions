import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listAllVideos, upsertVideo, deleteVideo } from "@/lib/videos.functions";

export function VideosAdmin() {
  const fetchAll = useServerFn(listAllVideos);
  const upsert = useServerFn(upsertVideo);
  const remove = useServerFn(deleteVideo);
  const qc = useQueryClient();

  const { data: result, isLoading } = useQuery({ queryKey: ["admin-videos"], queryFn: () => fetchAll() });
  const videos = result?.videos ?? [];
  const tableMissing = result?.tableMissing ?? false;
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { toast.success("Video saved"); qc.invalidateQueries({ queryKey: ["admin-videos"] }); qc.invalidateQueries({ queryKey: ["public-videos"] }); setEditing(null); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-videos"] }); qc.invalidateQueries({ queryKey: ["public-videos"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold">YouTube Tutorials</h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add video
          </Button>
        </div>

        {tableMissing && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300">
              <p className="font-medium mb-1">Videos table not found</p>
              <p className="text-amber-400/80">Run the migration SQL in your Supabase dashboard to create the videos table.</p>
            </div>
          </div>
        )}

        {isLoading && [1,2].map(i => <div key={i} className="h-24 rounded-lg bg-card/50 animate-pulse" />)}
        {!isLoading && !tableMissing && videos.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No videos yet. Add your YouTube tutorial IDs.</div>
        )}

        {videos.map((v: any) => (
          <div key={v.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === v.id ? "border-primary/40" : "border-border"}`}>
            <img
              src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
              alt={v.title}
              className="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-border"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{v.title}</span>
                {!v.is_active && <Badge variant="secondary" className="text-[10px] flex-shrink-0">Hidden</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{v.youtube_id}</p>
              {v.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{v.description}</p>}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(v)}><Pencil size={12} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm("Delete this video?")) del.mutate(v.id); }}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>

      <VideoForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function VideoForm({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    youtube_id: initial?.youtube_id ?? "",
    description: initial?.description ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">{isNew ? "Add video" : "Edit video"}</h3>
        {!isNew && <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="Title"><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="YouTube Video ID">
          <Input required value={form.youtube_id} onChange={e => setForm({ ...form, youtube_id: e.target.value })} placeholder="dQw4w9WgXcQ" />
          <p className="text-[11px] text-muted-foreground mt-1">The part after youtube.com/watch?v=</p>
          {form.youtube_id && (
            <img src={`https://img.youtube.com/vi/${form.youtube_id}/mqdefault.jpg`} alt="preview" className="mt-2 w-full rounded-lg border border-border" onError={(e: any) => { e.target.style.display = "none"; }} />
          )}
        </Field>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
          <div className="flex items-end gap-2 pb-0.5">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">{form.is_active ? <span className="flex items-center gap-1"><Eye size={13} />Visible</span> : <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} />Hidden</span>}</Label>
          </div>
        </div>
        <Button variant="hero" type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : isNew ? "Add video" : "Save changes"}</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
