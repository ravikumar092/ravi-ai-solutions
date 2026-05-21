import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const listPublicPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPost[]> => {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id,title,slug,excerpt,content,is_published,published_at,sort_order,created_at,updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (error) { console.warn("[blog]", error.message); return []; }
    return (data ?? []) as BlogPost[];
  }
);

export const listAllPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlogPost[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id,title,slug,excerpt,content,is_published,published_at,sort_order,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) { console.warn("[blog]", error.message); return []; }
    return (data ?? []) as BlogPost[];
  });

const postInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  slug: z.string().max(300).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => postInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const slug = data.slug || slugify(data.title);
    const now = new Date().toISOString();
    const payload: any = {
      title: data.title, slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      is_published: data.is_published,
      sort_order: data.sort_order,
    };
    if (data.is_published && !data.id) payload.published_at = now;
    if (data.id) {
      // If publishing for first time, set published_at
      const { data: existing } = await supabaseAdmin.from("blog_posts").select("is_published,published_at").eq("id", data.id).single();
      if (data.is_published && existing && !existing.is_published) payload.published_at = now;
      const { error } = await supabaseAdmin.from("blog_posts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin.from("blog_posts").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
