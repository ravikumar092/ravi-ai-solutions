import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, Sparkles, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { adminListAllCommunityPosts, adminUpdateCommunityPost, adminDeleteCommunityPost, type CommunityPost } from "@/lib/community.functions";
import { TabLoader } from "./AdminSkeletons";

export function CommunityTab() {
  const fetchAll = useServerFn(adminListAllCommunityPosts);
  const update = useServerFn(adminUpdateCommunityPost);
  const remove = useServerFn(adminDeleteCommunityPost);
  const qc = useQueryClient();

  const { data: posts = [], isLoading, error, isError } = useQuery({ 
    queryKey: ["admin-community"], 
    queryFn: () => fetchAll() 
  });
  
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (isError) {
      console.error("admin-community query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load community posts");
    }
  }, [isError, error]);

  const save = useMutation({
    mutationFn: (v: any) => update(v),
    onSuccess: () => { 
      toast.success("Community post saved successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-community"] }); 
      qc.invalidateQueries({ queryKey: ["public-community"] }); 
      setEditing(null); 
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save community post"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ id }),
    onSuccess: () => { 
      toast.success("Community post deleted successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-community"] }); 
      qc.invalidateQueries({ queryKey: ["public-community"] }); 
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete community post"),
  });

  function formatRelativeTime(dateStr: string) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    } catch (e) {
      return "Some time ago";
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_450px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            Community Posts Moderation
          </h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add post
          </Button>
        </div>

        {isLoading && <TabLoader label="Loading community posts…" />}
        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-destructive">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">Failed to load community posts</p>
              <p className="opacity-80">{(error as any)?.message ?? "An error occurred"}</p>
            </div>
          </div>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No community posts in database. Visitors can submit them from the community feed.
          </div>
        )}

        {posts.map((p) => (
          <div key={p.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === p.id ? "border-primary/40 bg-card/60" : "border-border hover:border-border/80"} transition-all duration-150`}>
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted border border-border flex-shrink-0 font-bold text-sm">
              {p.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{p.author}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary/80 border-primary/20 bg-primary/5">
                  {p.role}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(p.created_at)}
                </span>
                {!p.is_active && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-900/30">
                    Suspended
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mb-3">{p.content}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><ThumbsUp size={11} /> {p.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare size={11} /> {p.comments_count}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0 justify-center">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted/50" onClick={() => setEditing(p)} title="Moderate post">
                <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm(`Delete the post from "${p.author}"?`)) del.mutate(p.id); }} title="Delete post">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PostModerationForm key={editing?.id ?? "none"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function PostModerationForm({ initial, onSave, onCancel, saving }: { initial: any, onSave: (v: any) => void, onCancel: () => void, saving: boolean }) {
  if (!initial) {
    return (
      <div className="rounded-xl border border-border bg-card/45 p-6 text-center text-xs text-muted-foreground h-fit sticky top-24">
        Select a community post on the left to edit, toggle visibility, or moderate likes and comments.
      </div>
    );
  }

  const [form, setForm] = useState({
    id: initial.id,
    author: initial.author ?? "",
    avatar: initial.avatar ?? "",
    role: initial.role ?? "",
    content: initial.content ?? "",
    likes: initial.likes ?? 0,
    comments_count: initial.comments_count ?? 0,
    is_active: initial.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: form.id,
      author: form.author,
      avatar: form.avatar,
      role: form.role,
      content: form.content,
      likes: form.likes,
      comments_count: form.comments_count,
      is_active: form.is_active,
    });
  };

  const isNew = !initial.id;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 h-fit sticky top-24 backdrop-blur">
      <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary animate-pulse" />
          {isNew ? "New Post" : "Moderate Post"}
        </h3>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs px-2">
          Cancel
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Author Name">
            <Input required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
          </Field>
          <Field label="Avatar Initials">
            <Input required maxLength={4} placeholder="e.g. RK" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
          </Field>
        </div>

        <Field label="Author Role / Tagline">
          <Input required placeholder="e.g. SaaS Builder, Solo Founder" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
        </Field>
        
        <Field label="Post Content">
          <Textarea required placeholder="Post content..." rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Likes Count">
            <Input type="number" min="0" value={form.likes} onChange={e => setForm({ ...form, likes: Number(e.target.value) })} />
          </Field>
          <Field label="Comments Count">
            <Input type="number" min="0" value={form.comments_count} onChange={e => setForm({ ...form, comments_count: Number(e.target.value) })} />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-border/20 pt-4 pb-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold">Post Status</Label>
            <span className="text-[10px] text-muted-foreground">Toggle to hide or suspend post.</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} id="post-status-switch" />
            <Label htmlFor="post-status-switch" className="text-xs cursor-pointer select-none">
              {form.is_active ? (
                <span className="text-emerald-400 flex items-center gap-1"><Eye size={13} /> Active</span>
              ) : (
                <span className="text-rose-500 flex items-center gap-1"><EyeOff size={13} /> Suspended</span>
              )}
            </Label>
          </div>
        </div>

        <Button variant="hero" type="submit" disabled={saving} className="w-full mt-2">
          {saving ? (isNew ? "Adding Post…" : "Updating Post…") : (isNew ? "Add Post" : "Apply Moderation Changes")}
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
