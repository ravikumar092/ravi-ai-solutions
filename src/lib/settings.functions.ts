import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteSettings = {
  calendly_url: string;
  youtube_url: string;
  notification_email: string;
  notification_enabled: string;
  hero_tagline: string;
  contact_email: string;
};

const DEFAULTS: SiteSettings = {
  calendly_url: "https://calendly.com/ravikumar-devforge",
  youtube_url: "https://www.youtube.com/@RaviKumarAILab",
  notification_email: "",
  notification_enabled: "false",
  hero_tagline:
    "I design and ship AI workflows, agentic pipelines, and custom automation using n8n, Make, LangChain, CrewAI, and more — tailored to your business.",
  contact_email: "",
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key,value");
    if (error) {
      console.warn("[settings] query failed:", error.message);
      return DEFAULTS;
    }
    const map: any = { ...DEFAULTS };
    for (const row of data ?? []) {
      if (row.key in map) map[row.key] = row.value;
    }
    return map as SiteSettings;
  }
);

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.record(z.string(), z.string()).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const upserts = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(upserts, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
