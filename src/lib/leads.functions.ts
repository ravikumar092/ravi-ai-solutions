import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendEmail, newLeadEmailHtml } from "@/lib/email.server";

const leadInput = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  help_with: z.string().max(80).optional().or(z.literal("")),
  goal: z.string().max(500).optional().or(z.literal("")),
  stage: z.string().max(120).optional().or(z.literal("")),
  needs: z.string().max(2000).optional().or(z.literal("")),
  best_time: z.string().max(200).optional().or(z.literal("")),
});

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => leadInput.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads").insert({
      first_name: data.first_name, last_name: data.last_name,
      email: data.email, phone: data.phone || null,
      help_with: data.help_with || null, goal: data.goal || null,
      stage: data.stage || null, needs: data.needs || null,
      best_time: data.best_time || null,
    });
    if (error) throw new Error(error.message);
    console.log(`[lead] new submission from ${data.email}`);

    // Email notification if configured
    try {
      const { data: settings } = await supabaseAdmin
        .from("site_settings").select("key,value").in("key", ["notification_email", "notification_enabled"]);
      const map: Record<string, string> = {};
      for (const s of settings ?? []) map[s.key] = s.value;
      if (map.notification_enabled === "true" && map.notification_email) {
        await sendEmail({
          to: map.notification_email,
          subject: `New lead: ${data.first_name} ${data.last_name} — ${data.help_with || "General enquiry"}`,
          html: newLeadEmailHtml(data),
        });
      }
    } catch (e) {
      console.warn("[lead] email notification failed:", e);
    }
    return { ok: true };
  });

export type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  help_with: string | null;
  goal: string | null;
  stage: string | null;
  needs: string | null;
  best_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Lead[]> => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("leads").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Lead[];
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "won", "lost"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLeadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), notes: z.string().max(5000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("leads").update({ notes: data.notes }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const exportLeadsCSV = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string> => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("leads").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const headers = ["id","first_name","last_name","email","phone","help_with","goal","stage","needs","best_time","status","notes","created_at"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = (data ?? []).map((r: any) => headers.map(h => escape(r[h])).join(","));
    return headers.join(",") + "\n" + rows.join("\n");
  });

export const replyToLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    to_email: z.string().email(),
    to_name: z.string(),
    subject: z.string().min(1).max(300),
    body: z.string().min(1).max(5000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <p style="white-space:pre-wrap">${data.body.replace(/</g, "&lt;")}</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999">Ravi Kumar AI Lab — ravikumarailab.com</p>
      </div>`;
    const result = await sendEmail({ to: data.to_email, subject: data.subject, html });
    if (!result.ok) throw new Error(result.reason ?? "Email send failed");
    // Auto-mark as contacted
    await supabaseAdmin.from("leads").update({ status: "contacted" }).eq("id", data.id);
    return { ok: true };
  });
