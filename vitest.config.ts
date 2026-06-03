import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "html"]
    },
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"]
  }
});
