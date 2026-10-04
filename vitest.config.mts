import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Business logic and Mongoose models only: Vitest cannot render async
    // Server Components, so pages are checked through ui-checker instead.
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    // mongodb-memory-server downloads mongod on its first run.
    hookTimeout: 120_000,
  },
});
