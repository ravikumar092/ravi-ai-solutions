import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        amount: z.number().positive(),
        currency: z.string().default("USD"),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_SsrTNCIouAETfu";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "O5lzGm6opF5qTsIS5SI9nYpH";

    const amountInCents = Math.round(data.amount * 100);
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    try {
      console.log(`[purchases] Creating Razorpay order for ${data.currency} ${data.amount} (${amountInCents} smallest units)`);
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: data.currency,
          receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[purchases] Razorpay Order Creation Error:", errorText);
        throw new Error(`Razorpay API responded with status ${response.status}: ${errorText}`);
      }

      const order = await response.json();
      console.log(`[purchases] Razorpay order created successfully: ${order.id}`);
      return order;
    } catch (err: any) {
      console.error("[purchases] Exception in createRazorpayOrder:", err);
      throw new Error(err.message || "Failed to create Razorpay order");
    }
  });

const verificationInput = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  product_id: z.string().min(1),
  product_title: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => verificationInput.parse(d))
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "O5lzGm6opF5qTsIS5SI9nYpH";

    console.log(`[purchases] Verifying Razorpay payment. Order: ${data.razorpay_order_id}, Payment: ${data.razorpay_payment_id}`);

    // Verify payment signature
    const text = data.razorpay_order_id + "|" + data.razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== data.razorpay_signature) {
      console.error("[purchases] Razorpay Signature Verification Failed!");
      throw new Error("Payment signature verification failed");
    }

    console.log(`[purchases] Signature verified. Saving purchase with currency ${data.currency} for ${data.customer_email} to DB...`);

    // Fetch file_url / file_name from the product so we snapshot them at purchase time
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    try {
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("file_url,file_name")
        .eq("id", data.product_id)
        .single();
      fileUrl = prod?.file_url ?? null;
      fileName = prod?.file_name ?? null;
    } catch (_) {}

    // Insert purchase details into Supabase
    const { data: row, error } = await supabaseAdmin
      .from("purchases")
      .insert({
        product_id: data.product_id,
        product_title: data.product_title,
        amount: data.amount,
        currency: data.currency,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
        status: "completed",
        file_url: fileUrl,
        file_name: fileName,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[purchases] Supabase Insert Error:", error.message);
      throw new Error(`Failed to save purchase details: ${error.message}`);
    }

    console.log(`[purchases] Purchase logged successfully. ID: ${row.id}`);
    return { success: true, purchaseId: row.id, fileUrl, fileName };
  });

// Get purchases for the currently logged-in public user
export const getUserPurchases = createServerFn({ method: "GET" }).handler(
  async (): Promise<any[]> => {
    // Resolve the current session from the request (TanStack Start pattern)
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getSession } = await import("./replit-auth.server");
    const request = getRequest();
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      return [];
    }

    const email = session.user.email;
    console.log(`[purchases] Fetching purchases for user: ${email}`);
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[purchases] getUserPurchases db error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch product details for these purchases to get the latest file_url / file_name
    const productIds = Array.from(new Set(data.map(p => p.product_id).filter(Boolean)));
    const productsMap: Record<string, { file_url: string | null; file_name: string | null }> = {};

    if (productIds.length > 0) {
      try {
        const { data: prods } = await supabaseAdmin
          .from("products")
          .select("id,file_url,file_name")
          .in("id", productIds);
        if (prods) {
          prods.forEach(p => {
            productsMap[p.id] = { file_url: p.file_url, file_name: p.file_name };
          });
        }
      } catch (e) {
        console.error("[purchases] failed to fetch latest product files for purchases:", e);
      }
    }

    return data.map(p => ({
      ...p,
      product_file_url: productsMap[p.product_id]?.file_url ?? null,
      product_file_name: productsMap[p.product_id]?.file_name ?? null,
    }));
  }
);

// Claim a free product — requires login, records purchase with amount=0
export const claimFreeProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ product_id: z.string().min(1) }).parse(d)
  )
  .handler(async ({ data }) => {
    // Resolve session
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getSession } = await import("./replit-auth.server");
    const request = getRequest();
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      throw new Error("You must be logged in to claim this product.");
    }

    const email = session.user.email;
    const name = session.user.firstName || email.split("@")[0];

    // Fetch the product details
    const { data: product, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id,title,file_url,file_name")
      .eq("id", data.product_id)
      .single();

    if (prodError || !product) {
      throw new Error("Product not found.");
    }

    // Prevent duplicate claims
    const { data: existing } = await supabaseAdmin
      .from("purchases")
      .select("id,file_url,file_name")
      .eq("product_id", data.product_id)
      .eq("customer_email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already claimed — just return the existing download info
      console.log(`[purchases] Product already claimed by ${email}`);
      return {
        success: true,
        alreadyClaimed: true,
        purchaseId: existing[0].id,
        fileUrl: existing[0].file_url ?? null,
        fileName: existing[0].file_name ?? null,
      };
    }

    console.log(`[purchases] Claiming free product '${product.title}' for ${email}`);

    const claimId = `free_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const { data: row, error } = await supabaseAdmin
      .from("purchases")
      .insert({
        product_id: product.id,
        product_title: product.title,
        amount: 0,
        currency: "USD",
        customer_name: name,
        customer_email: email,
        razorpay_payment_id: claimId,
        razorpay_order_id: claimId,
        razorpay_signature: claimId,
        status: "free",
        file_url: product.file_url ?? null,
        file_name: product.file_name ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[purchases] claimFreeProduct insert error:", error.message);
      throw new Error(`Failed to claim product: ${error.message}`);
    }

    console.log(`[purchases] Free product claimed. Purchase ID: ${row.id}`);
    return {
      success: true,
      alreadyClaimed: false,
      purchaseId: row.id,
      fileUrl: product.file_url ?? null,
      fileName: product.file_name ?? null,
    };
  });

export const adminListPurchases = createServerFn({ method: "GET" }).handler(
  async (): Promise<any[]> => {
    await requireAdminAuth();
    console.log("[purchases] Fetching all purchases for admin view");
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[purchases] adminListPurchases db error:", error.message);
      return [];
    }

    return data ?? [];
  }
);

// Public user registration server function
export const registerPublicUser = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    console.log(`[auth] Registering public user: ${data.email}`);

    // Create user in Supabase Auth via admin API to bypass rate limits and confirm email
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.name,
      },
    });

    if (error) {
      console.error("[auth] Supabase admin.createUser error:", error.message);
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error("Failed to create user account.");
    }

    // Auto-create local session
    const { generateSessionId, saveSession } = await import("./replit-auth.server");
    const sessionId = generateSessionId();
    const sessionData = {
      isAdmin: false,
      email: authData.user.email,
      firstName: data.name,
      lastName: null,
      profileImageUrl: null,
    };

    await saveSession(sessionId, authData.user.id, sessionData);

    console.log(`[auth] Public user registered and logged in: ${data.email}, Session ID: ${sessionId}`);
    return { success: true, sessionId, user: sessionData };
  });

// Public user login server function
export const loginPublicUser = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    console.log(`[auth] Logging in public user: ${data.email}`);

    // Sign in via Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error("[auth] Supabase signIn error:", error.message);
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error("Invalid email or password.");
    }

    // Check if they are admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .limit(1);
    const isAdmin = (roleData?.length ?? 0) > 0;

    const firstName = authData.user.user_metadata?.first_name || authData.user.email?.split("@")[0] || "User";

    // Auto-create local session
    const { generateSessionId, saveSession } = await import("./replit-auth.server");
    const sessionId = generateSessionId();
    const sessionData = {
      isAdmin,
      email: authData.user.email,
      firstName: firstName,
      lastName: null,
      profileImageUrl: null,
    };

    await saveSession(sessionId, authData.user.id, sessionData);

    console.log(`[auth] Public user logged in: ${data.email}, Session ID: ${sessionId}`);
    return { success: true, sessionId, user: sessionData };
  });

export const getPurchaseById = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ purchaseId: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<any | null> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getSession } = await import("./replit-auth.server");
    const request = getRequest();
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      throw new Error("Unauthorized: Please sign in.");
    }

    const isAdmin = session.isAdmin === true;
    let query = supabaseAdmin.from("purchases").select("*").eq("id", data.purchaseId);
    if (!isAdmin) {
      query = query.eq("customer_email", session.user.email);
    }
    const { data: purchase, error } = await query.single();

    if (error) {
      console.warn(`[purchases] getPurchaseById db error for id ${data.purchaseId}:`, error.message);
      return null;
    }

    return purchase;
  });
