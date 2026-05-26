import { useServerFn as useOriginalServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

export function useServerFn(serverFn: any) {
  const originalFn = useOriginalServerFn(serverFn);

  return useCallback(
    async (...args: any[]) => {
      console.log("[useServerFn wrapper] called for", serverFn?.name || "anonymous fn", "with args:", args);
      
      // If we have exactly one argument
      if (args.length === 1 && args[0] !== undefined) {
        const arg = args[0];

        // If the argument is an object (and not null)
        if (typeof arg === "object" && arg !== null) {
          // If the object does not have 'data' key, or has other keys, wrap it
          const keys = Object.keys(arg);
          const validStartKeys = ["data", "headers", "signal", "fetch"];
          const hasOtherKeys = keys.some((k) => !validStartKeys.includes(k));

          if (hasOtherKeys || !("data" in arg)) {
            console.log("[useServerFn wrapper] wrapping object argument in { data: ... }:", arg);
            return originalFn({ data: arg });
          }
        } else {
          // Primitive value
          console.log("[useServerFn wrapper] wrapping primitive argument in { data: ... }:", arg);
          return originalFn({ data: arg });
        }
      }

      console.log("[useServerFn wrapper] passing args to originalFn directly:", args);
      return originalFn(...args);
    },
    [originalFn, serverFn]
  );
}

