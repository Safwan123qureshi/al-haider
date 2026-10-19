import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Only the JSX interaction tests; the pure-logic node:test suites in
    // tests/*.test.js are run separately via `node --test`.
    include: ["tests/**/*.test.jsx"],
    setupFiles: ["./tests/setup.js"],
    globals: false,
  },
});
