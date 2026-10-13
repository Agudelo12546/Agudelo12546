import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // En CI las variables vienen del entorno.
}

// Requiere la Supabase local corriendo (pnpm db:start) y .env.local (pnpm env:local).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "es-CO",
  },
  projects: [
    {
      name: "movil",
      use: {
        ...devices["Pixel 7"],
        // Chromium preinstalado en el entorno de la nube; en tu computador usa el de Playwright.
        launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
