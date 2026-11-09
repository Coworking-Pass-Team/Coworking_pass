import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["tests/**/*.test.ts"], environment: "node", env: { JWT_SECRET: "mD8v6qL2xK9rB4hF7sW5jN0pT3yC1zAa" } },
});
