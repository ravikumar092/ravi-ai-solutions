import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type Product = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  badge: string | null;
  icon: string;
  icon_color: string | null;
  features: string[];
  cta: string;
  sort_order: number;
  is_active: boolean;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS = "id,category,title,description,price,currency,badge,icon,icon_color,features,cta,sort_order,is_active,file_url,file_name,created_at,updated_at";

export const listPublicProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(SELECT_COLS)
      .eq("is_active", true)
      .order("sort_order");
    if (error) {
      console.warn("[products] listPublicProducts db error:", error.message);
      return [];
    }
    return (data ?? []) as Product[];
  }
);

export const listAllProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    await requireAdminAuth();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(SELECT_COLS)
      .order("sort_order");
    if (error) {
      console.warn("[products] listAllProducts db error:", error.message);
      return [];
    }
    return (data ?? []) as Product[];
  }
);

const productInput = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.string().min(1).max(60),
  currency: z.string().min(1).max(10).default("USD"),
  badge: z.string().max(60).nullable().optional(),
  icon: z.string().min(1).max(60),
  icon_color: z.string().max(60).nullable().optional(),
  features: z.array(z.string()).default([]),
  cta: z.string().min(1).max(60),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
  file_url: z.string().url().nullable().optional(),
  file_name: z.string().max(255).nullable().optional(),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      category: data.category,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      badge: data.badge || null,
      icon: data.icon,
      icon_color: data.icon_color || null,
      features: data.features,
      cta: data.cta,
      sort_order: data.sort_order,
      is_active: data.is_active,
      file_url: data.file_url || null,
      file_name: data.file_name || null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Generate a signed upload URL so the client can upload a file directly to Supabase Storage
export const getProductFileUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ fileName: z.string().min(1).max(255) }).parse(d)
  )
  .handler(async ({ data }) => {
    try {
      await requireAdminAuth();
      const ext = data.fileName.split(".").pop() ?? "bin";
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `products/${safeName}`;

      const bucketName = "product-files";
      try {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === bucketName);
        if (!exists) {
          console.log(`[Supabase] Creating missing storage bucket: ${bucketName}`);
          await supabaseAdmin.storage.createBucket(bucketName, {
            public: true,
          });
        }
      } catch (e: any) {
        console.warn("[Supabase] Failed to check/create bucket:", e.message || e);
        if (e.message?.includes("environment variable is not configured")) {
          throw e;
        }
      }

      const { data: signed, error } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUploadUrl(path);

      if (error || !signed) {
        throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown"}`);
      }

      // Build the public URL once uploaded
      const { data: publicData } = supabaseAdmin.storage
        .from("product-files")
        .getPublicUrl(path);

      return {
        signedUrl: signed.signedUrl,
        token: signed.token,
        path,
        publicUrl: publicData.publicUrl,
      };
    } catch (error: any) {
      console.error("[products.functions] getProductFileUploadUrl error:", error);
      throw new Error(error.message || "An unexpected error occurred during file upload initialization.");
    }
  });

export const diagnoseSupabaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminAuth();
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let keyStatus = "Missing";
    let keyRole = "N/A";
    let keyPrefix = "N/A";

    if (SUPABASE_SERVICE_ROLE_KEY) {
      keyStatus = "Present";
      keyPrefix = SUPABASE_SERVICE_ROLE_KEY.substring(0, 8) + "...";
      try {
        const parts = SUPABASE_SERVICE_ROLE_KEY.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          keyRole = payload?.role || "unknown";
        } else {
          keyRole = "Invalid JWT Format";
        }
      } catch (e: any) {
        keyRole = `Error decoding: ${e.message}`;
      }
    }

    return {
      supabaseUrl: SUPABASE_URL ? "Configured" : "Missing",
      serviceRoleKeyStatus: keyStatus,
      serviceRoleKeyPrefix: keyPrefix,
      decodedRole: keyRole,
      envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes("supabase") || k.toLowerCase().includes("service"))
    };
  }
);

