import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads.functions";
import { getSettings } from "@/lib/settings.functions";
import { ArrowRight, CalendarDays, MessageSquare } from "lucide-react";

type Mode = "calendly" | "form";

const DEFAULT_CALENDLY = "https://calendly.com/ravikumar-devforge";

export function BookCallModal({
  open,
  onOpenChange,
  defaultService = "",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultService?: string;
}) {
  const submit = useServerFn(submitLead);
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings(), staleTime: 5 * 60 * 1000 });
  const calendlyUrl = (settings?.calendly_url || DEFAULT_CALENDLY)
    + "?embed_type=Inline&background_color=181a1f&text_color=f5f7fa&primary_color=4ade80&hide_gdpr_banner=1";
  const [mode, setMode] = useState<Mode>("calendly");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    help_with: "",
    goal: "",
    stage: "",
    needs: "",
    best_time: "",
  });

  useEffect(() => {
    if (open && defaultService) {
      setForm((f) => ({ ...f, help_with: defaultService }));
    }
    if (!open) {
      setMode("calendly");
      setForm({ first_name: "", last_name: "", email: "", phone: "", help_with: "", goal: "", stage: "", needs: "", best_time: "" });
    }
  }, [open, defaultService]);


  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submit({ data: form });
      toast.success("Request received — I'll be in touch shortly.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Book a Call</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Pick a slot on Calendly or send a message and I'll reach out to schedule.
            </DialogDescription>
          </DialogHeader>

          {/* Mode switcher */}
          <div className="flex gap-2 mt-5">
            <ModeButton
              active={mode === "calendly"}
              icon={<CalendarDays size={14} />}
              label="Schedule on Calendly"
              sublabel="Pick a time that works"
              onClick={() => setMode("calendly")}
            />
            <ModeButton
              active={mode === "form"}
              icon={<MessageSquare size={14} />}
              label="Send a message"
              sublabel="I'll reach out to confirm"
              onClick={() => setMode("form")}
            />
          </div>
        </div>

        {/* Calendly embed */}
        {mode === "calendly" && (
          <div className="px-6 py-5">
            <div className="rounded-xl overflow-hidden border border-border bg-muted/10" style={{ height: "620px" }}>
              <iframe
                src={calendlyUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Schedule a meeting"
                allow="fullscreen"
              />
            </div>
          </div>
        )}

        {/* Contact form */}
        {mode === "form" && (
          <form onSubmit={onSubmit} className="px-6 py-5 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name">
                <Input required value={form.first_name} onChange={(e) => set("first_name")(e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input required value={form.last_name} onChange={(e) => set("last_name")(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email")(e.target.value)} />
              </Field>
              <Field label="Phone (optional)">
                <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
              </Field>
            </div>

            <Field label="I need help with...">
              <Select value={form.help_with} onValueChange={set("help_with")}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-on-1 Coaching Session ($49)">1-on-1 Coaching Session ($49)</SelectItem>
                  <SelectItem value="Live Workshop ($29)">Live Workshop ($29)</SelectItem>
                  <SelectItem value="AI & Agentic Consulting">AI & Agentic Consulting</SelectItem>
                  <SelectItem value="n8n / Make Automation">n8n / Make Automation</SelectItem>
                  <SelectItem value="Custom Agent Development">Custom Agent Development</SelectItem>
                  <SelectItem value="LangChain / CrewAI / AutoGen">LangChain / CrewAI / AutoGen</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="What's your goal?">
              <Input value={form.goal} onChange={(e) => set("goal")(e.target.value)} placeholder="e.g. Automate lead follow-up with n8n" />
            </Field>

            <Field label="What stage are you at?">
              <Select value={form.stage} onValueChange={set("stage")}>
                <SelectTrigger><SelectValue placeholder="Select a stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Just starting out">Just starting out</SelectItem>
                  <SelectItem value="Learning and exploring AI">Learning and exploring AI</SelectItem>
                  <SelectItem value="Already building something">Already building something</SelectItem>
                  <SelectItem value="Growing an existing business">Growing an existing business</SelectItem>
                  <SelectItem value="Need help with a specific problem">Need help with a specific problem</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tell me about your needs">
              <Textarea rows={3} value={form.needs} onChange={(e) => set("needs")(e.target.value)} placeholder="Any context you'd like to share before the call…" />
            </Field>

            <Field label="Best time to reach you">
              <Input placeholder="e.g. Weekdays 2–5pm PT" value={form.best_time} onChange={(e) => set("best_time")(e.target.value)} />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">I'll reply within 24 hours.</p>
              <Button type="submit" variant="hero" disabled={loading} className="gap-2">
                {loading ? "Sending…" : (<>Send message <ArrowRight size={15} /></>)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active, icon, label, sublabel, onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
        active
          ? "border-primary/50 bg-primary/8 text-foreground"
          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground"
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${active ? "text-primary" : ""}`}>{icon}</span>
      <div>
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-[11px] mt-0.5 text-muted-foreground">{sublabel}</p>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
