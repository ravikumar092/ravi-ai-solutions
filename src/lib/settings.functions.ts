import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type SiteSettings = {
  calendly_url: string;
  youtube_url: string;
  notification_email: string;
  notification_enabled: string;
  hero_tagline: string;
  contact_email: string;
  site_name: string;
  hero_headline: string;
  founder_name: string;
  founder_bio: string;
  meta_description: string;
  tools_title: string;
  tools_desc: string;
  courses_title: string;
  courses_desc: string;
  community_title: string;
  community_desc: string;
  ebook_title: string;
  ebook_desc: string;
  razorpay_mode: string;
  resend_from_email: string;
};

const DEFAULTS: SiteSettings = {
  calendly_url: "https://calendly.com/ravikumar-devforge",
  youtube_url: "https://www.youtube.com/@RaviKumarAILab",
  notification_email: "",
  notification_enabled: "false",
  hero_tagline:
    "I design and ship AI workflows, agentic pipelines, and custom automation using n8n, Make, LangChain, CrewAI, and more — tailored to your business.",
  contact_email: "",
  site_name: "Ravi Kumar AI Lab",
  hero_headline: "Build autonomous systems that work while you sleep.",
  founder_name: "Ravi Kumar",
  founder_bio: "13+ years of full-stack engineering across startups and digital enterprise models. Today, I build and document autonomous systems to help creators, freelancers, and builders work smarter and unlock solo business scale.",
  meta_description: "The ultimate builder platform, AI tools, cloneable workflows, courses, and accountability community for solo founders, creators, and indie hackers by Ravi Kumar.",
  tools_title: "AI-First Solopreneur Tools",
  tools_desc: "Free high-utility calculators and mockup validation streams to speed up your ideation, pricing, and system architectures.",
  courses_title: "Ravi Kumar AI Lab Learning Platform",
  courses_desc: "Unlock actionable, no-nonsense tutorials. Learn how to construct self-healing systems and scale your earnings as a solo builder.",
  community_title: "Founder Community Feed",
  community_desc: "Collaborate, ask questions, and share automation milestones with 2,000+ builders building in public.",
  ebook_title: "Ravi Kumar AI Lab Playbook",
  ebook_desc: "Step-by-step blueprints, stack suggestions, checklists, and 50+ micro-niche ideas to launch your solo business and hit $10k MRR. Over 3,500 builders have downloaded it.",
  razorpay_mode: "test",
  resend_from_email: "Ravi Kumar AI Lab <onboarding@resend.dev>",
};


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
  .inputValidator((d: unknown) => {
    console.log("[settings.functions] updateSettings validator received:", d);
    try {
      const parsed = z.record(z.string(), z.string()).parse(d);
      console.log("[settings.functions] updateSettings validator success:", parsed);
      return parsed;
    } catch (e: any) {
      console.error("[settings.functions] updateSettings validator error:", e);
      throw e;
    }
  })
  .handler(async ({ data }) => {
    console.log("[settings.functions] updateSettings handler received:", data);
    await requireAdminAuth();
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
