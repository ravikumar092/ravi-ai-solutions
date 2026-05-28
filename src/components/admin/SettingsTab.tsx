import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Mail, ExternalLink, Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getSettings, updateSettings } from "@/lib/settings.functions";
import { diagnoseSupabaseConfig } from "@/lib/products.functions";

export function SettingsTab() {
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) { setForm(data as any); setDirty(false); }
  }, [data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };
  const setToggle = (k: string) => (v: boolean) => {
    setForm(f => ({ ...f, [k]: v ? "true" : "false" }));
    setDirty(true);
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const save = useMutation({
    mutationFn: () => saveSettings(form),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); setDirty(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const handleSave = () => {
    if (form.calendly_url && !isValidUrl(form.calendly_url)) {
      toast.error("Please enter a valid Calendly booking URL starting with http:// or https://");
      return;
    }
    if (form.youtube_url && !isValidUrl(form.youtube_url)) {
      toast.error("Please enter a valid YouTube channel URL starting with http:// or https://");
      return;
    }
    save.mutate();
  };

  if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse">Loading settings…</div>;

  const notificationsEnabled = form.notification_enabled === "true";
  const hasNotificationEmail = !!form.notification_email;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1">Site Settings</h2>
          <p className="text-sm text-muted-foreground">Control key URLs and behaviour without editing code.</p>
        </div>
        {dirty && (
          <Button variant="hero" onClick={handleSave} disabled={save.isPending} className="gap-2">
            <Save size={14} /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>

      {/* Integrations */}
      <Section title="Integrations" description="External URLs used across the site.">
        <Field label="Calendly booking URL">
          <Input value={form.calendly_url ?? ""} onChange={set("calendly_url")} placeholder="https://calendly.com/your-link" />
          <p className="text-[11px] text-muted-foreground mt-1">Used in the "Book a Call" modal and the Schedule section.</p>
        </Field>
        <Field label="YouTube channel URL">
          <Input value={form.youtube_url ?? ""} onChange={set("youtube_url")} placeholder="https://www.youtube.com/@YourChannel" />
        </Field>
      </Section>

      {/* Email notifications */}
      <Section title="Email Notifications" description="Get an email whenever someone fills the Book a Call form.">
        <div className="rounded-xl border border-border bg-card/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Send email on new lead</p>
              <p className="text-xs text-muted-foreground mt-0.5">Requires Resend API key to be configured.</p>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={setToggle("notification_enabled")} />
          </div>

          {notificationsEnabled && (
            <Field label="Notification email address">
              <Input type="email" value={form.notification_email ?? ""} onChange={set("notification_email")} placeholder="you@yourdomain.com" />
            </Field>
          )}

          {notificationsEnabled && !hasNotificationEmail && (
            <div className="flex items-start gap-2 text-amber-400 text-xs">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              <span>Enter an email address above to receive notifications.</span>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" />
              <p className="text-xs font-medium">Resend API key setup</p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>
                Create a free account at{" "}
                <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  resend.com <ExternalLink size={10} />
                </a>
              </li>
              <li>Go to API Keys → Create API Key</li>
              <li>In Replit, open Secrets and add <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> with the value</li>
              <li>Enable the toggle above and set your email address</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Content */}
      <Section title="Content" description="Text shown across the public site.">
        <Field label="Site / Brand Name">
          <Input value={form.site_name ?? ""} onChange={set("site_name")} placeholder="Ravi Kumar AI Lab" />
          <p className="text-[11px] text-muted-foreground mt-1">Updates the website logo, copyrights, and browser tab titles.</p>
        </Field>
        <Field label="Hero Headline">
          <Input value={form.hero_headline ?? ""} onChange={set("hero_headline")} placeholder="Build autonomous systems that work while you sleep." />
          <p className="text-[11px] text-muted-foreground mt-1">Main heading displayed in the hero section.</p>
        </Field>
        <Field label="Hero tagline">
          <Input value={form.hero_tagline ?? ""} onChange={set("hero_tagline")} placeholder="One-liner describing what you do…" />
          <p className="text-[11px] text-muted-foreground mt-1">Shown below the main headline on the homepage.</p>
        </Field>
        <Field label="SEO Meta Description">
          <Textarea value={form.meta_description ?? ""} onChange={set("meta_description")} placeholder="Metadata description for search engines..." rows={2} className="bg-background" />
          <p className="text-[11px] text-muted-foreground mt-1">Main description for SEO purposes.</p>
        </Field>
        <Field label="Founder Name">
          <Input value={form.founder_name ?? ""} onChange={set("founder_name")} placeholder="Ravi Kumar" />
          <p className="text-[11px] text-muted-foreground mt-1">Your name displayed in the About and Meet sections.</p>
        </Field>
        <Field label="Founder Bio">
          <Textarea value={form.founder_bio ?? ""} onChange={set("founder_bio")} placeholder="Founder bio and credentials..." rows={3} className="bg-background" />
          <p className="text-[11px] text-muted-foreground mt-1">Detailed description of your expertise and mission.</p>
        </Field>
        <Field label="Public contact email">
          <Input type="email" value={form.contact_email ?? ""} onChange={set("contact_email")} placeholder="hello@yourdomain.com" />
        </Field>

        <div className="pt-4 border-t border-border/60">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Lead Magnet / Ebook</h4>
          <div className="space-y-4">
            <Field label="Ebook Title">
              <Input value={form.ebook_title ?? ""} onChange={set("ebook_title")} placeholder="Ravi Kumar AI Lab Playbook" />
            </Field>
            <Field label="Ebook Description">
              <Textarea value={form.ebook_desc ?? ""} onChange={set("ebook_desc")} placeholder="Description of the ebook and its contents..." rows={3} className="bg-background" />
            </Field>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Tools Hub</h4>
          <div className="space-y-4">
            <Field label="Tools Page Headline">
              <Input value={form.tools_title ?? ""} onChange={set("tools_title")} placeholder="AI-First Solopreneur Tools" />
            </Field>
            <Field label="Tools Page Subtitle">
              <Textarea value={form.tools_desc ?? ""} onChange={set("tools_desc")} placeholder="Brief details about the tools..." rows={2} className="bg-background" />
            </Field>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Learning Platform / Academy</h4>
          <div className="space-y-4">
            <Field label="Courses Page Headline">
              <Input value={form.courses_title ?? ""} onChange={set("courses_title")} placeholder="Ravi Kumar AI Lab Learning Platform" />
            </Field>
            <Field label="Courses Page Subtitle">
              <Textarea value={form.courses_desc ?? ""} onChange={set("courses_desc")} placeholder="Brief details about the academy..." rows={2} className="bg-background" />
            </Field>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Community Feed</h4>
          <div className="space-y-4">
            <Field label="Community Page Headline">
              <Input value={form.community_title ?? ""} onChange={set("community_title")} placeholder="Founder Community Feed" />
            </Field>
            <Field label="Community Page Subtitle">
              <Textarea value={form.community_desc ?? ""} onChange={set("community_desc")} placeholder="Brief details about the community..." rows={2} className="bg-background" />
            </Field>
          </div>
        </div>
      </Section>

      {dirty && (
        <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          <Save size={14} /> {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      )}

      {/* Diagnostics */}
      <div className="pt-6 border-t border-border">
        <ConfigurationDiagnostics />
      </div>
    </div>
  );
}

function ConfigurationDiagnostics() {
  const diagnose = useServerFn(diagnoseSupabaseConfig);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await diagnose();
      setData(res);
      toast.success("Diagnostics completed successfully");
    } catch (err: any) {
      setError(err.message || "Failed to run diagnostics");
      toast.error("Diagnostics failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">System Diagnostics</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Check backend database and credentials configuration.</p>
      </div>

      <div className="rounded-xl border border-border bg-card/30 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Supabase Configuration Diagnostics</p>
            <p className="text-xs text-muted-foreground mt-0.5">Verify if service keys are configured and valid on the server.</p>
          </div>
          <Button size="sm" variant="outlineNeon" onClick={runDiagnostics} disabled={loading}>
            {loading ? "Running..." : "Run Diagnostics"}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive text-xs">
            {error}
          </div>
        )}

        {data && (
          <div className="rounded border border-border bg-muted/10 p-3 space-y-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Supabase URL: </span>
              <span className={data.supabaseUrl === "Configured" ? "text-emerald-400" : "text-red-400"}>{data.supabaseUrl}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Service Role Key Status: </span>
              <span className={data.serviceRoleKeyStatus === "Present" ? "text-emerald-400" : "text-red-400"}>{data.serviceRoleKeyStatus}</span>
            </div>
            {data.serviceRoleKeyStatus === "Present" && (
              <>
                <div>
                  <span className="text-muted-foreground">Key Prefix: </span>
                  <span>{data.serviceRoleKeyPrefix}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Decoded Role (JWT claims): </span>
                  <span className={data.decodedRole === "service_role" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {data.decodedRole}
                  </span>
                </div>
              </>
            )}
            {data.envKeys && data.envKeys.length > 0 && (
              <div>
                <span className="text-muted-foreground">Configured Env Keys: </span>
                <span>{data.envKeys.join(", ")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
