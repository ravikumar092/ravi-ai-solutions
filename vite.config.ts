import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "path";
import fs from "fs";
import type { Plugin } from "vite";
import { nitro } from "nitro/vite";

// Load .env file manually into process.env if it exists
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("[vite.config] Failed to load .env manually:", e);
}

function browserStubStorageContext(): Plugin {
  const stubPath = path.resolve(
    process.cwd(),
    "src/lib/browser-stubs/start-storage-context.js"
  );
  return {
    name: "browser-stub-start-storage-context",
    enforce: "pre",
    resolveId(source, _importer, options) {
      if (
        source === "@tanstack/start-storage-context" &&
        options?.ssr !== true
      ) {
        return stubPath;
      }
      return null;
    },
  };
}

function browserStubNodeModules(): Plugin {
  const NODE_ONLY = ["pg", "pg-native", "pg-pool", "pg-types", "postgres-bytea", "postgres-date", "postgres-interval", "ws"];
  return {
    name: "browser-stub-node-modules",
    enforce: "pre",
    resolveId(source, _importer, _options) {
      // Stub pg for ALL environments (browser and SSR worker) since we use
      // in-memory sessions — no actual Postgres connection is needed.
      if (NODE_ONLY.some((m) => source === m || source.startsWith(m + "/"))) {
        return "\0browser-stub:" + source;
      }
      return null;
    },
    load(id) {
      if (id.startsWith("\0browser-stub:")) {
        return "export default {}; export const Pool = class {}; export const Client = class {};";
      }
      return null;
    },
  };
}

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    serverFns: {
      disableCsrfMiddlewareWarning: true,
    },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      watch: {
        ignored: ["**/.local/**"],
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? ""),
    },
    plugins: [
      browserStubStorageContext(),
      browserStubNodeModules(),
      nitro({
        preset: "vercel",
      }),
    ],
  },
});
