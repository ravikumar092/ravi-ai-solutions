import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  price: string | null;
  currency: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export const listPublicServices = createServerFn({ method: "GET" }).handler(
  async (): Promise<Service[]> => {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id,title,description,icon,price,currency,image_url,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  },
);

export const listAllServices = createServerFn({ method: "GET" })
  .handler(async (): Promise<Service[]> => {
    console.log(`[services.functions] listAllServices called`);
    const authUser = await requireAdminAuth();
    console.log(`[services.functions] listAllServices authorized user:`, authUser);
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id,title,description,icon,price,currency,image_url,sort_order,is_active")
      .order("sort_order");
    console.log(`[services.functions] listAllServices db results:`, { dataCount: data?.length, error });
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  });

const serviceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  icon: z.string().max(60).nullable().optional(),
  price: z.string().max(60).nullable().optional(),
  currency: z.string().max(10).default("USD"),
  image_url: z.string().url().nullable().optional().or(z.literal("")),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const upsertService = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => serviceInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      title: data.title,
      description: data.description,
      icon: data.icon ?? null,
      price: data.price ?? null,
      currency: data.currency,
      image_url: data.image_url || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("services").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("services")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
