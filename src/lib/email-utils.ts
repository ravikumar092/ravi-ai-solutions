export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "RESEND_API_KEY not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Ravi Kumar AI Lab <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, reason: err };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message };
  }
}

export function newLeadEmailHtml(lead: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  help_with?: string | null;
  goal?: string | null;
  stage?: string | null;
  needs?: string | null;
  best_time?: string | null;
}) {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0d0f14;color:#f5f7fa;padding:32px">
<div style="max-width:560px;margin:0 auto;background:#181a1f;border-radius:12px;padding:32px;border:1px solid #2a2d35">
  <h2 style="margin:0 0 4px;color:#4ade80;font-size:18px">New lead from your website</h2>
  <p style="margin:0 0 24px;color:#888;font-size:13px">${new Date().toLocaleString()}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    ${row("Name", `${lead.first_name} ${lead.last_name}`)}
    ${row("Email", `<a href="mailto:${lead.email}" style="color:#4ade80">${lead.email}</a>`)}
    ${lead.phone ? row("Phone", lead.phone) : ""}
    ${lead.help_with ? row("Interested in", lead.help_with) : ""}
    ${lead.goal ? row("Goal", lead.goal) : ""}
    ${lead.stage ? row("Stage", lead.stage) : ""}
    ${lead.needs ? row("Needs", lead.needs) : ""}
    ${lead.best_time ? row("Best time", lead.best_time) : ""}
  </table>
  <div style="margin-top:24px">
    <a href="mailto:${lead.email}" style="background:#4ade80;color:#0d0f14;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Reply to ${lead.first_name}</a>
  </div>
</div>
</body></html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:#888;width:120px;vertical-align:top;font-size:13px">${label}</td>
    <td style="padding:8px 0;color:#f5f7fa;font-size:13px">${value}</td>
  </tr>`;
}
