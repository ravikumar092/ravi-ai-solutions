import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "path";
import type { Plugin } from "vite";

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
  const NODE_ONLY = ["pg", "pg-native", "pg-pool", "pg-types", "postgres-bytea", "postgres-date", "postgres-interval"];
  return {
    name: "browser-stub-node-modules",
    enforce: "pre",
    resolveId(source, _importer, options) {
      if (!options?.ssr && NODE_ONLY.some((m) => source === m || source.startsWith(m + "/"))) {
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
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? ""),
    },
    plugins: [browserStubStorageContext(), browserStubNodeModules()],
  },
});
