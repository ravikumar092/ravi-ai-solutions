import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type CommunityPost = {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  likes: number;
  comments_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const listPublicCommunityPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommunityPost[]> => {
    const { data, error } = await supabaseAdmin
      .from("community_posts")
      .select("id,author,avatar,role,content,likes,comments_count,is_active,created_at,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[community] listPublicCommunityPosts db error:", error.message);
      return [];
    }
    return (data ?? []) as CommunityPost[];
  }
);

export const adminListAllCommunityPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommunityPost[]> => {
    await requireAdminAuth();
    const { data, error } = await supabaseAdmin
      .from("community_posts")
      .select("id,author,avatar,role,content,likes,comments_count,is_active,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[community] adminListAllCommunityPosts db error:", error.message);
      return [];
    }
    return (data ?? []) as CommunityPost[];
  }
);

const communityPostInput = z.object({
  author: z.string().min(1).max(100),
  avatar: z.string().min(1).max(60),
  role: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
});

export const createCommunityPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => communityPostInput.parse(d))
  .handler(async ({ data }) => {
    const payload = {
      author: data.author,
      avatar: data.avatar,
      role: data.role,
      content: data.content,
      likes: 0,
      comments_count: 0,
      is_active: true,
    };

    const { data: row, error } = await supabaseAdmin
      .from("community_posts")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const communityPostUpdateInput = z.object({
  id: z.string().uuid().optional(),
  author: z.string().min(1).max(100),
  avatar: z.string().min(1).max(60),
  role: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  likes: z.number().int().min(0).default(0),
  comments_count: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const adminUpdateCommunityPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => communityPostUpdateInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      author: data.author,
      avatar: data.avatar,
      role: data.role,
      content: data.content,
      likes: data.likes,
      comments_count: data.comments_count,
      is_active: data.is_active,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("community_posts")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("community_posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const adminDeleteCommunityPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin
      .from("community_posts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
