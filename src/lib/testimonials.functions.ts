import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listPublicTestimonials = createServerFn({ method: "GET" }).handler(
  async (): Promise<Testimonial[]> => {
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select("id,name,role,quote,image_url,sort_order,is_active,created_at")
      .eq("is_active", true)
      .order("sort_order");
    if (error) { console.warn("[testimonials]", error.message); return []; }
    return (data ?? []) as Testimonial[];
  }
);

export const listAllTestimonials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Testimonial[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select("id,name,role,quote,image_url,sort_order,is_active,created_at")
      .order("sort_order");
    if (error) { console.warn("[testimonials]", error.message); return []; }
    return (data ?? []) as Testimonial[];
  });

const testimonialInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  role: z.string().max(120).nullable().optional(),
  quote: z.string().min(1).max(1000),
  image_url: z.string().url().nullable().optional().or(z.literal("")),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const upsertTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => testimonialInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      name: data.name, role: data.role ?? null,
      quote: data.quote, image_url: data.image_url || null,
      sort_order: data.sort_order, is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("testimonials").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("testimonials").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
