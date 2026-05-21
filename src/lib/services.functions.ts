import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  price: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listPublicServices = createServerFn({ method: "GET" }).handler(
  async (): Promise<Service[]> => {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id,title,description,icon,price,image_url,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  },
);

export const listAllServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Service[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id,title,description,icon,price,image_url,sort_order,is_active")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  });

const serviceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  icon: z.string().max(60).nullable().optional(),
  price: z.string().max(60).nullable().optional(),
  image_url: z.string().url().nullable().optional().or(z.literal("")),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => serviceInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      title: data.title,
      description: data.description,
      icon: data.icon ?? null,
      price: data.price ?? null,
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
