import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Save, User, FileText, Star, Clock, BarChart2, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSettings, updateSettings } from "@/lib/settings.functions";
import { TabLoader } from "./AdminSkeletons";

export function AboutTab() {
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) { setForm(data as any); setDirty(false); }
  }, [data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: () => saveSettings(form),
    onSuccess: () => {
      toast.success("About page content saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
      setDirty(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  if (isLoading) return <TabLoader label="Loading about page content…" />;

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1">About Page</h2>
          <p className="text-sm text-muted-foreground">
            Edit all content shown on the public <code className="bg-muted px-1 rounded text-xs">/about</code> page.
          </p>
        </div>
        {dirty && (
          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
            <Save size={14} /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>

      {/* Hero section */}
      <Section
        icon={<Star size={15} />}
        title="Hero Section"
        description="The first thing visitors see on the About page."
      >
        <Field label="Page Headline">
          <Input
            value={form.about_headline ?? ""}
            onChange={set("about_headline")}
            placeholder="Designing Autonomous Systems that work while you sleep."
          />
          <p className="text-[11px] text-muted-foreground mt-1">Main heading displayed at the top of the About page.</p>
        </Field>
      </Section>

      {/* Founder profile */}
      <Section
        icon={<User size={15} />}
        title="Founder Profile"
        description="Your personal details shown in the hero and across the site."
      >
        <Field label="Founder Name">
          <Input
            value={form.founder_name ?? ""}
            onChange={set("founder_name")}
            placeholder="Ravi Kumar"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Displayed in the About hero, Meet section, and footer.</p>
        </Field>

        <Field label="Founder Bio">
          <Textarea
            value={form.founder_bio ?? ""}
            onChange={set("founder_bio")}
            placeholder="13+ years of full-stack engineering across startups and digital enterprise models…"
            rows={4}
            className="bg-background"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Short bio shown in the hero paragraph on the About page.</p>
        </Field>

        <Field label="Public Contact Email">
          <Input
            type="email"
            value={form.contact_email ?? ""}
            onChange={set("contact_email")}
            placeholder="hello@yourdomain.com"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Shown in the footer and contact sections.</p>
        </Field>
      </Section>

      {/* Stats */}
      <Section
        icon={<BarChart2 size={15} />}
        title="Stats / Highlights"
        description="The four numbered highlights shown below the hero."
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stat 1 — Number">
            <Input value={form.stat1_number ?? ""} onChange={set("stat1_number")} placeholder="13+" />
          </Field>
          <Field label="Stat 1 — Label">
            <Input value={form.stat1_label ?? ""} onChange={set("stat1_label")} placeholder="Years of Engineering" />
          </Field>
          <Field label="Stat 2 — Number">
            <Input value={form.stat2_number ?? ""} onChange={set("stat2_number")} placeholder="500+" />
          </Field>
          <Field label="Stat 2 — Label">
            <Input value={form.stat2_label ?? ""} onChange={set("stat2_label")} placeholder="Workflows Designed" />
          </Field>
          <Field label="Stat 3 — Number">
            <Input value={form.stat3_number ?? ""} onChange={set("stat3_number")} placeholder="3.5k+" />
          </Field>
          <Field label="Stat 3 — Label">
            <Input value={form.stat3_label ?? ""} onChange={set("stat3_label")} placeholder="Playbook Readers" />
          </Field>
          <Field label="Stat 4 — Number">
            <Input value={form.stat4_number ?? ""} onChange={set("stat4_number")} placeholder="2k+" />
          </Field>
          <Field label="Stat 4 — Label">
            <Input value={form.stat4_label ?? ""} onChange={set("stat4_label")} placeholder="Community Members" />
          </Field>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Leave blank to use the default values.</p>
      </Section>

      {/* Timeline */}
      <Section
        icon={<Clock size={15} />}
        title="Journey / Timeline"
        description="Three career milestones shown in the Builder Journey section."
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestone {i}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year / Period">
                <Input
                  value={form[`timeline${i}_year`] ?? ""}
                  onChange={set(`timeline${i}_year`)}
                  placeholder={i === 1 ? "2023 - Present" : i === 2 ? "2018 - 2023" : "2013 - 2018"}
                />
              </Field>
              <Field label="Title / Role">
                <Input
                  value={form[`timeline${i}_title`] ?? ""}
                  onChange={set(`timeline${i}_title`)}
                  placeholder={i === 1 ? "Founder, AI Lab" : i === 2 ? "Solution Architect" : "Full-Stack Engineer"}
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={form[`timeline${i}_desc`] ?? ""}
                onChange={set(`timeline${i}_desc`)}
                placeholder="Brief description of this career phase…"
                rows={2}
                className="bg-background"
              />
            </Field>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Leave blank to use the default timeline entries.</p>
      </Section>

      {/* Expertise cards */}
      <Section
        icon={<Layers size={15} />}
        title="Core Expertise Cards"
        description="Three skill cards in the Capabilities section."
      >
        {[
          { key: "expertise1", defaultTitle: "Workflow Automation", defaultTools: "n8n, Make.com, Zapier, Webhooks" },
          { key: "expertise2", defaultTitle: "AI & Agentic Workflows", defaultTools: "GPT-4o, Claude 3.5, Pinecone, LangChain" },
          { key: "expertise3", defaultTitle: "Full-Stack Custom Code", defaultTools: "TypeScript, Node.js, Python, Supabase" },
        ].map(({ key, defaultTitle, defaultTools }) => (
          <div key={key} className="rounded-xl border border-border bg-card/20 p-4 space-y-3">
            <Field label="Card Title">
              <Input value={form[`${key}_title`] ?? ""} onChange={set(`${key}_title`)} placeholder={defaultTitle} />
            </Field>
            <Field label="Card Description">
              <Textarea value={form[`${key}_desc`] ?? ""} onChange={set(`${key}_desc`)} placeholder="Brief description of this skill area…" rows={2} className="bg-background" />
            </Field>
            <Field label="Tools / Tags (comma-separated)">
              <Input value={form[`${key}_tools`] ?? ""} onChange={set(`${key}_tools`)} placeholder={defaultTools} />
              <p className="text-[11px] text-muted-foreground mt-1">e.g. <code className="bg-muted px-1 rounded">n8n, Make.com, Zapier</code></p>
            </Field>
          </div>
        ))}
      </Section>

      {/* CTA section */}
      <Section
        icon={<FileText size={15} />}
        title="Call to Action Section"
        description="The bottom CTA block encouraging visitors to book a call."
      >
        <Field label="CTA Headline">
          <Input
            value={form.about_cta_headline ?? ""}
            onChange={set("about_cta_headline")}
            placeholder="Have a workflow bottleneck you need solved?"
          />
        </Field>
        <Field label="CTA Subtext">
          <Textarea
            value={form.about_cta_subtext ?? ""}
            onChange={set("about_cta_subtext")}
            placeholder="Whether you need to scrape data, link your CRM to n8n…"
            rows={2}
            className="bg-background"
          />
        </Field>
        <Field label="CTA Button Label">
          <Input
            value={form.about_cta_button ?? ""}
            onChange={set("about_cta_button")}
            placeholder="Schedule Your Strategy Audit"
          />
        </Field>
      </Section>

      {/* Sticky bottom save */}
      {dirty && (
        <div className="sticky bottom-6">
          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 shadow-lg">
            <Save size={14} /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-primary">{icon}</span>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
