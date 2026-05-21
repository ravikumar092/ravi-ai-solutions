import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Globe, FileText, EyeOff,
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Code, Quote, Minus, Link as LinkIcon, Undo, Redo, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    onSuccess: () => {
      toast.success("Post saved");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["public-blog"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["public-blog"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const published = (data as any[]).filter(p => p.is_published);
  const drafts = (data as any[]).filter(p => !p.is_published);

  return (
    <div className="grid lg:grid-cols-[1fr_520px] gap-6 items-start">
      {/* Post list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Blog</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {published.length} published · {drafts.length} drafts
            </p>
          </div>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> New post
          </Button>
        </div>

        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-card/50 animate-pulse" />
        ))}

        {data.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <FileText size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No posts yet. Write your first article.</p>
          </div>
        )}

        {(data as any[]).map((p) => (
          <div
            key={p.id}
            className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === p.id ? "border-primary/40" : "border-border"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {p.is_published
                  ? <Globe size={12} className="text-primary flex-shrink-0" />
                  : <FileText size={12} className="text-muted-foreground flex-shrink-0" />}
                <span className="font-medium text-sm truncate">{p.title}</span>
                <Badge variant={p.is_published ? "default" : "secondary"} className="text-[10px] flex-shrink-0">
                  {p.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              {p.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{p.excerpt}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {p.is_published && p.published_at
                  ? `Published ${new Date(p.published_at).toLocaleDateString()}`
                  : `Created ${new Date(p.created_at).toLocaleDateString()}`}
                {" · "}/blog/<code className="bg-muted px-1 rounded">{p.slug}</code>
              </p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {p.is_published && (
                <a
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                  title="View article"
                >
                  <Eye size={12} />
                </a>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(p)}>
                <Pencil size={12} />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor panel */}
      <PostEditor
        key={editing?.id ?? "new"}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={(v: any) => save.mutate(v)}
        saving={save.isPending}
      />
    </div>
  );
}

function PostEditor({ initial, onSave, onCancel, saving }: any) {
  const isNew = !initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [preview, setPreview] = useState(false);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: { HTMLAttributes: { class: "rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto" } },
      }),
      Placeholder.configure({ placeholder: "Start writing your article here…" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content: initial?.content ?? "",
    editorProps: {
      attributes: {
        class: "min-h-[360px] outline-none prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground",
      },
    },
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    onSave({
      id: initial?.id,
      title,
      slug: slug || autoSlug(title),
      excerpt: excerpt || null,
      content: editor.getHTML(),
      is_published: isPublished,
      sort_order: initial?.sort_order ?? 0,
    });
  };

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-border bg-card/50 flex flex-col sticky top-24 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <h3 className="font-semibold text-sm">{isNew ? "New post" : "Edit post"}</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setPreview(!preview)}>
            {preview ? <><EyeOff size={11} /> Edit</> : <><Eye size={11} /> Preview</>}
          </Button>
          {!isNew && (
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-shrink-0">
        {/* Title */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input
            required
            value={title}
            placeholder="Article title"
            className="font-medium"
            onChange={e => {
              setTitle(e.target.value);
              if (isNew) setSlug(autoSlug(e.target.value));
            }}
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">URL slug</Label>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l px-2 py-2 h-9">/blog/</span>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="auto-from-title"
              className="rounded-l-none text-xs"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Excerpt <span className="text-muted-foreground/50">(shown in cards)</span></Label>
          <Input
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="One-line summary for the card preview"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-y border-border bg-muted/30 flex-shrink-0">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")} title="Bold"
        ><Bold size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")} title="Italic"
        ><Italic size={13} /></ToolBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })} title="Heading 2"
        ><Heading2 size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })} title="Heading 3"
        ><Heading3 size={13} /></ToolBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")} title="Bullet list"
        ><List size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")} title="Numbered list"
        ><ListOrdered size={13} /></ToolBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")} title="Inline code"
        ><Code size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")} title="Code block"
        ><span className="text-[10px] font-mono font-bold">{"</>"}</span></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")} title="Blockquote"
        ><Quote size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false} title="Divider"
        ><Minus size={13} /></ToolBtn>
        <ToolBtn onClick={addLink} active={editor.isActive("link")} title="Add link">
          <LinkIcon size={13} />
        </ToolBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          active={false} title="Undo"
        ><Undo size={13} /></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          active={false} title="Redo"
        ><Redo size={13} /></ToolBtn>
      </div>

      {/* Editor / Preview */}
      <div className="p-4 flex-1">
        {preview ? (
          <div
            className="min-h-[360px] prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          <Label className="text-sm cursor-pointer" onClick={() => setIsPublished(v => !v)}>
            {isPublished
              ? <span className="flex items-center gap-1 text-primary"><Globe size={13} />Published</span>
              : <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} />Draft</span>}
          </Label>
        </div>
        <Button
          variant="hero"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="h-9 text-sm px-5"
        >
          {saving ? "Saving…" : isNew ? "Publish post" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-7 w-7 flex items-center justify-center rounded transition-colors text-xs
        ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
