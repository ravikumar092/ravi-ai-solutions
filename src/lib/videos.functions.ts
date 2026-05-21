import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Video = {
  id: string;
  title: string;
  youtube_id: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type VideoListResult = {
  videos: Video[];
  tableMissing: boolean;
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

export const listPublicVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Video[]> => {
    const { data, error } = await supabaseAdmin
      .from("videos")
      .select("id,title,youtube_id,description,sort_order,is_active,created_at")
      .eq("is_active", true)
      .order("sort_order");
    if (error) {
      console.warn("[videos] query failed:", error.message);
      return [];
    }
    return (data ?? []) as Video[];
  },
);

export const listAllVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VideoListResult> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("videos")
      .select("id,title,youtube_id,description,sort_order,is_active,created_at")
      .order("sort_order");
    if (error) {
      const tableMissing =
        error.message.includes("does not exist") ||
        error.message.includes("schema cache") ||
        error.message.includes("relation");
      console.warn("[videos] query failed:", error.message);
      return { videos: [], tableMissing };
    }
    return { videos: (data ?? []) as Video[], tableMissing: false };
  });

const videoInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  youtube_id: z.string().min(1).max(20),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const upsertVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => videoInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("videos")
        .update({
          title: data.title,
          youtube_id: data.youtube_id,
          description: data.description ?? null,
          sort_order: data.sort_order,
          is_active: data.is_active,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("videos")
        .insert({
          title: data.title,
          youtube_id: data.youtube_id,
          description: data.description ?? null,
          sort_order: data.sort_order,
          is_active: data.is_active,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("videos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
