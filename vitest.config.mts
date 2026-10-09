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
    globalSetup: ["src/server/test/global-setup.ts"],
    // mongod starts slowly under parallel workers on a shared CI runner.
    hookTimeout: 120_000,
  },
});
