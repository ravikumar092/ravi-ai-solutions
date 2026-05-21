import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Mail, ExternalLink, Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSettings, updateSettings } from "@/lib/settings.functions";

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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };
  const setToggle = (k: string) => (v: boolean) => {
    setForm(f => ({ ...f, [k]: v ? "true" : "false" }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: () => saveSettings({ data: form }),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); setDirty(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

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
          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
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
        <Field label="Hero tagline">
          <Input value={form.hero_tagline ?? ""} onChange={set("hero_tagline")} placeholder="One-liner describing what you do…" />
          <p className="text-[11px] text-muted-foreground mt-1">Shown below the main headline on the homepage. (Requires page reload to reflect.)</p>
        </Field>
        <Field label="Public contact email">
          <Input type="email" value={form.contact_email ?? ""} onChange={set("contact_email")} placeholder="hello@yourdomain.com" />
        </Field>
      </Section>

      {dirty && (
        <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          <Save size={14} /> {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      )}
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
