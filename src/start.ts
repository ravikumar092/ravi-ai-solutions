import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { initDb } from "./lib/db-init";

if (typeof window === 'undefined') {
  initDb();
}

const errorMiddleware = typeof createMiddleware === 'function'
  ? createMiddleware().server(async ({ next, request }) => {
      try {
        return await next();
      } catch (error) {
        if (error != null && typeof error === "object" && "statusCode" in error) {
          throw error;
        }
        console.error(error);

        let req = request;
        if (!req) {
          try {
            const { getRequest } = await import('@tanstack/react-start/server');
            req = getRequest();
          } catch (e) {}
        }

        if (req) {
          try {
            const url = new URL(req.url, 'http://localhost');
            if (url.pathname.startsWith('/_serverFn') || url.pathname.startsWith('/api/')) {
              throw error;
            }
          } catch (e) {}
        }

        return new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    })
  : undefined;

export const startInstance = createStart(() => ({
  requestMiddleware: errorMiddleware ? [errorMiddleware] : [],
}));
