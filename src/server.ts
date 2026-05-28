import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleCallback, handleLogout } from "./lib/auth-handlers";
import { handleFormLogin } from "./lib/form-auth.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Handle auth routes directly before TanStack Router
    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleFormLogin(request).catch(() =>
        new Response(JSON.stringify({ error: "Server error. Please try again." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    if (url.pathname === "/api/debug-auth") {
      try {
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key] = value;
        });

        const cookieHeader = request.headers.get("cookie") ?? "";
        const cookies: Record<string, string> = {};
        cookieHeader.split(";").forEach((c) => {
          const parts = c.split("=");
          if (parts.length === 2) {
            cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
          }
        });

        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let keyInfo = "Not configured";
        if (key) {
          try {
            const parts = key.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
              keyInfo = `Configured (Role: ${payload?.role}, Issuer: ${payload?.iss}, Ref: ${payload?.ref})`;
            } else {
              keyInfo = `Configured (Invalid format - parts: ${parts.length})`;
            }
          } catch (e: any) {
            keyInfo = `Configured (Error parsing JWT: ${e.message})`;
          }
        }

        // Test Supabase connection
        let dbStatus = "Unknown";
        try {
          const { supabaseAdmin } = await import("./integrations/supabase/admin-client");
          const testSid = `vercel-test-${Date.now()}`;
          
          // Test insert
          const { error: insertError } = await supabaseAdmin.from("sessions").insert({
            sid: testSid,
            sess: { vercelTest: true },
            expire: new Date(Date.now() + 60000).toISOString()
          });

          let insertResult = "Success";
          if (insertError) {
            insertResult = `Failed: ${insertError.message} (${insertError.code})`;
          }

          // Test select
          const { data: rows, error: selectError } = await supabaseAdmin.from("sessions").select("sid, expire");
          let selectResult = "";
          if (selectError) {
            selectResult = `Failed: ${selectError.message}`;
          } else {
            selectResult = `Rows count: ${rows?.length || 0} (${JSON.stringify(rows)})`;
          }

          // Test cleanup
          await supabaseAdmin.from("sessions").delete().eq("sid", testSid);

          dbStatus = `Insert: ${insertResult} | Select: ${selectResult}`;
        } catch (e: any) {
          dbStatus = `Exception: ${e.message}`;
        }

        return new Response(
          JSON.stringify({
            url: request.url,
            method: request.method,
            headers,
            cookies,
            env: {
              SUPABASE_URL: process.env.SUPABASE_URL,
              VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
              SUPABASE_SERVICE_ROLE_KEY_STATUS: keyInfo,
            },
            database: dbStatus,
          }, null, 2),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }
    if (url.pathname === "/api/callback") {
      return handleCallback(request).catch(() =>
        new Response(null, { status: 302, headers: { Location: "/login?error=server_error" } })
      );
    }
    if (url.pathname === "/api/logout") {
      return handleLogout(request).catch(() =>
        new Response(null, { status: 302, headers: { Location: "/" } })
      );
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
