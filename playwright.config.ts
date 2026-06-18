import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3003";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1, // pages SSR-fetch the live API; tolerate a transient hiccup
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.STORE_CLOSED_OVERRIDE,
    timeout: 120_000,
    env: { STORE_CLOSED_OVERRIDE: process.env.STORE_CLOSED_OVERRIDE ?? "" },
  },
});
