import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

/**
 * Vitest config.
 *
 * - jsdom for component tests that need a DOM (RTL).
 * - `globals: true` so `describe/it/expect` are available without imports.
 * - `setupFiles` registers RTL matchers and shared globals.
 * - Path aliases mirror tsconfig so production import paths work in tests.
 * - css.modules.classNameStrategy: 'non-scoped' keeps CSS Module class names
 *   readable in assertions instead of opaque hashes.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: {
      modules: { classNameStrategy: "non-scoped" },
    },
    coverage: {
      reporter: ["text", "html"],
      include: ["src/features/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
      exclude: [
        "**/*.module.css",
        "**/*.d.ts",
        "**/types/**",
        "**/index.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@app": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
});
