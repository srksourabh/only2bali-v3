import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest needs the same `@/` alias that tsconfig gives the compiler.
 *
 * Until now every test imported by relative path, so this never came up. The
 * first test to reach into a module that imports `@/lib/db` failed with
 * "Cannot find package '@/lib/db'" — a missing alias, not a broken test.
 */
export default defineConfig({
  test: { testTimeout: 60_000 },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
