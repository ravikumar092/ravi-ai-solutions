import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Faq = {
  id: string;
  question: string;
  answer: string;
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

export const listPublicFaqs = createServerFn({ method: "GET" }).handler(
  async (): Promise<Faq[]> => {
    const { data, error } = await supabaseAdmin
      .from("faqs")
      .select("id,question,answer,sort_order,is_active,created_at")
      .eq("is_active", true)
      .order("sort_order");
    if (error) { console.warn("[faqs]", error.message); return []; }
    return (data ?? []) as Faq[];
  }
);

export const listAllFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Faq[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("faqs").select("id,question,answer,sort_order,is_active,created_at").order("sort_order");
    if (error) { console.warn("[faqs]", error.message); return []; }
    return (data ?? []) as Faq[];
  });

const faqInput = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1).max(400),
  answer: z.string().min(1).max(2000),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => faqInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = { question: data.question, answer: data.answer, sort_order: data.sort_order, is_active: data.is_active };
    if (data.id) {
      const { error } = await supabaseAdmin.from("faqs").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("faqs").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("faqs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
