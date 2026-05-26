import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type Automation = {
  id: string;
  category: string;
  platform: string;
  title: string;
  description: string;
  hours_saved: string;
  complexity: string;
  integrations: string[];
  downloads: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const listPublicAutomations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Automation[]> => {
    const { data, error } = await supabaseAdmin
      .from("automations")
      .select("id,category,platform,title,description,hours_saved,complexity,integrations,downloads,sort_order,is_active,created_at,updated_at")
      .eq("is_active", true)
      .order("sort_order");
    if (error) {
      console.warn("[automations] listPublicAutomations db error:", error.message);
      return [];
    }
    return (data ?? []) as Automation[];
  }
);

export const listAllAutomations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Automation[]> => {
    await requireAdminAuth();
    const { data, error } = await supabaseAdmin
      .from("automations")
      .select("id,category,platform,title,description,hours_saved,complexity,integrations,downloads,sort_order,is_active,created_at,updated_at")
      .order("sort_order");
    if (error) {
      console.warn("[automations] listAllAutomations db error:", error.message);
      return [];
    }
    return (data ?? []) as Automation[];
  }
);

const automationInput = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1).max(60),
  platform: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  hours_saved: z.string().min(1).max(60),
  complexity: z.string().min(1).max(60),
  integrations: z.array(z.string()).default([]),
  downloads: z.string().min(1).max(60).default("0+"),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const upsertAutomation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => automationInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      category: data.category,
      platform: data.platform,
      title: data.title,
      description: data.description,
      hours_saved: data.hours_saved,
      complexity: data.complexity,
      integrations: data.integrations,
      downloads: data.downloads,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("automations")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("automations")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin
      .from("automations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
