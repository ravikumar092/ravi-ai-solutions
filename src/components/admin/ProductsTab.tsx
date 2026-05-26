import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, Sparkles, Upload, FileText, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllProducts, upsertProduct, deleteProduct, getProductFileUploadUrl, type Product } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const formatPriceDisplay = (price: string, currency: string = "USD") => {
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return price;
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${numeric}`;
};

export function ProductsAdmin() {
  const fetchAll = useServerFn(listAllProducts);
  const upsert = useServerFn(upsertProduct);
  const remove = useServerFn(deleteProduct);
  const qc = useQueryClient();

  const { data: products = [], isLoading, error, isError } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchAll()
  });

  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (isError) {
      console.error("admin-products query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load products");
    }
  }, [isError, error]);

  const save = useMutation({
    mutationFn: (v: any) => upsert(v),
    onSuccess: () => {
      toast.success("Product saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save product"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ id }),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete product"),
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "info": return "Ebook / Resource";
      case "blueprint": return "System Blueprint";
      case "consulting": return "Coaching & Service";
      default: return cat;
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_480px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            Store Products
          </h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add Product
          </Button>
        </div>

        {isLoading && [1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg bg-card/50 animate-pulse" />)}
        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-destructive">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">Failed to load products</p>
              <p className="opacity-80">{(error as any)?.message ?? "An error occurred"}</p>
            </div>
          </div>
        )}
        {!isLoading && !isError && products.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No products in database. Add your first product to display on the store page.
          </div>
        )}

        {products.map((p) => (
          <div key={p.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === p.id ? "border-primary/40 bg-card/60" : "border-border hover:border-border/80"} transition-all duration-150`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{p.title}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary/80 border-primary/20 bg-primary/5">
                  {getCategoryLabel(p.category)}
                </Badge>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                  {p.price?.toUpperCase() === "FREE" ? "FREE" : formatPriceDisplay(p.price, p.currency)}
                </span>
                {p.badge && (
                  <Badge className="text-[9px] bg-indigo-950 text-indigo-300 border-indigo-900/50 hover:bg-indigo-950">
                    {p.badge}
                  </Badge>
                )}
                {p.file_url && (
                  <Badge className="text-[9px] bg-emerald-950 text-emerald-300 border-emerald-900/50 hover:bg-emerald-950 gap-1">
                    <Download size={8} /> File
                  </Badge>
                )}
                {!p.is_active && (
                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">Hidden</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{p.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                <span>Icon: <code className="text-indigo-400 bg-muted/30 px-1 py-0.5 rounded">{p.icon}</code></span>
                <span>CTA: <code className="text-pink-400 bg-muted/30 px-1 py-0.5 rounded">{p.cta}</code></span>
                <span>Features: {p.features?.length || 0} items</span>
                <span>Order: {p.sort_order}</span>
                {p.file_name && <span>File: <code className="text-emerald-400 bg-muted/30 px-1 py-0.5 rounded">{p.file_name}</code></span>}
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0 justify-center">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted/50" onClick={() => setEditing(p)} title="Edit product">
                <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm(`Delete the product "${p.title}"?`)) del.mutate(p.id); }} title="Delete product">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProductForm key={editing?.id ?? "new"} initial={editing} onCancel={() => setEditing(null)} onSave={(v: any) => save.mutate(v)} saving={save.isPending} />
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, saving }: { initial: any, onSave: (v: any) => void, onCancel: () => void, saving: boolean }) {
  const isNew = !initial?.id;
  const getUploadUrl = useServerFn(getProductFileUploadUrl);

  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "info",
    price: initial?.price ?? "",
    currency: initial?.currency ?? "USD",
    badge: initial?.badge ?? "",
    icon: initial?.icon ?? "BookOpen",
    icon_color: initial?.icon_color ?? "text-green-400",
    featuresRaw: initial?.features ? initial.features.join("\n") : "",
    cta: initial?.cta ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
    file_url: initial?.file_url ?? null as string | null,
    file_name: initial?.file_name ?? null as string | null,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB}MB.`);
      return;
    }

    setUploading(true);
    setUploadProgress("Getting upload URL…");

    try {
      // 1. Get a signed upload URL from the server
      const { signedUrl, token, path, publicUrl } = await getUploadUrl({ fileName: file.name });

      setUploadProgress("Uploading file…");

      // 2. Upload directly to Supabase Storage via the SDK helper
      const { data, error } = await supabase.storage
        .from("product-files")
        .uploadToSignedUrl(path, token, file);

      if (error) {
        throw new Error(error.message);
      }

      setForm(f => ({ ...f, file_url: publicUrl, file_name: file.name }));
      toast.success(`"${file.name}" uploaded successfully.`);
      setUploadProgress(null);
    } catch (err: any) {
      toast.error(err.message || "File upload failed.");
      setUploadProgress(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeFile = () => {
    setForm(f => ({ ...f, file_url: null, file_name: null }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFeatures = form.featuresRaw
      .split("\n")
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0);

    onSave({
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      price: form.price,
      currency: form.currency,
      badge: form.badge || null,
      icon: form.icon,
      icon_color: form.icon_color || null,
      features: parsedFeatures,
      cta: form.cta,
      sort_order: form.sort_order,
      is_active: form.is_active,
      file_url: form.file_url || null,
      file_name: form.file_name || null,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 h-fit sticky top-24 backdrop-blur">
      <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary animate-pulse" />
          {isNew ? "New Product Detail" : "Modify Product Detail"}
        </h3>
        {!isNew && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs px-2">
            Cancel Edit
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <Input required placeholder="e.g. n8n Automation Blueprint" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>

        <Field label="Description">
          <Textarea required placeholder="Describe what makes this resource premium…" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (e.g. 29, FREE)">
            <Input required placeholder="e.g. 29, FREE, Custom" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onValueChange={(val) => setForm({ ...form, currency: val })}>
              <SelectTrigger><SelectValue placeholder="USD ($)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Ebooks &amp; Guides</SelectItem>
                <SelectItem value="blueprint">System Blueprints</SelectItem>
                <SelectItem value="consulting">Coaching &amp; Service</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Promo Badge (optional)">
            <Input placeholder="e.g. Best Seller, New" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Call to Action Text">
            <Input required placeholder="e.g. Download, Get Blueprint" value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} />
          </Field>
          <Field label="Lucide Icon Name">
            <Select value={form.icon} onValueChange={(val) => setForm({ ...form, icon: val })}>
              <SelectTrigger><SelectValue placeholder="Icon" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BookOpen">📖 BookOpen (Ebook)</SelectItem>
                <SelectItem value="Workflow">⚙️ Workflow (System)</SelectItem>
                <SelectItem value="Zap">⚡ Zap (Make/n8n)</SelectItem>
                <SelectItem value="MessageSquare">💬 MessageSquare (Call)</SelectItem>
                <SelectItem value="ShieldCheck">🛡️ ShieldCheck (Custom)</SelectItem>
                <SelectItem value="Code">💻 Code (Code template)</SelectItem>
                <SelectItem value="Globe">🌐 Globe (Website)</SelectItem>
                <SelectItem value="Database">🗄️ Database (Notion/Airtable)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Icon CSS Color Class">
            <Select value={form.icon_color} onValueChange={(val) => setForm({ ...form, icon_color: val })}>
              <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text-green-400">Green (Ebook)</SelectItem>
                <SelectItem value="text-cyan-400">Cyan (n8n)</SelectItem>
                <SelectItem value="text-orange-400">Orange (Make)</SelectItem>
                <SelectItem value="text-violet-400">Violet (Coaching)</SelectItem>
                <SelectItem value="text-yellow-400">Yellow (Enterprise)</SelectItem>
                <SelectItem value="text-rose-400">Rose</SelectItem>
                <SelectItem value="text-primary">Neon Purple</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Included Features (one per line)">
          <Textarea placeholder={"Feature item 1\nFeature item 2\nFeature item 3..."} rows={4} value={form.featuresRaw} onChange={e => setForm({ ...form, featuresRaw: e.target.value })} />
        </Field>

        {/* ── FILE UPLOAD ── */}
        <div className="space-y-2 border-t border-border/20 pt-3">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Download size={12} /> Downloadable File (PDF, ZIP, JSON…)
          </Label>

          {form.file_url ? (
            /* Existing / uploaded file */
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/10 px-3 py-2.5">
              <FileText size={16} className="text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-300 truncate">{form.file_name || "Attached File"}</p>
                <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400/70 hover:underline truncate block">
                  View / Preview ↗
                </a>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            /* Upload area */
            <div
              className={`relative rounded-lg border-2 border-dashed transition-colors ${uploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/10"} cursor-pointer`}
              onClick={() => !uploading && fileRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                {uploading ? (
                  <>
                    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">{uploadProgress || "Uploading…"}</p>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-muted-foreground/60" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Click to upload a file</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF, ZIP, JSON, MP4 — up to 50MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="sr-only"
                accept=".pdf,.zip,.json,.mp4,.mp3,.csv,.xlsx,.docx,.txt,.md"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
          )}

          <p className="text-[9px] text-muted-foreground">
            Users who purchase or claim this product will get a download button in their dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center border-t border-border/20 pt-3">
          <Field label="Sort Order">
            <Input type="number" min="0" max="9999" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Visibility Status</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} id="visibility-switch" />
              <Label htmlFor="visibility-switch" className="text-xs cursor-pointer select-none">
                {form.is_active ? (
                  <span className="flex items-center gap-1 text-emerald-400"><Eye size={13} /> Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} /> Hidden</span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Button variant="hero" type="submit" disabled={saving || uploading} className="w-full mt-2">
          {saving ? "Saving Details…" : uploading ? "Upload in progress…" : isNew ? "Add Product To Store" : "Apply Product Updates"}
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
