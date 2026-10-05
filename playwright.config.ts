import { defineConfig, devices } from "@playwright/test";

const PORTA = 3100;

/**
 * Testes de ponta a ponta no navegador, com o app em modo memória (sem API):
 * cobrem as telas e os fluxos do balcão. A regra da reserva com o banco é testada no backend.
 * No CI usa o Chromium do Playwright; na máquina, o Chrome instalado.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], channel: process.env.CI ? undefined : "chrome" } },
    { name: "computador", use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" } },
  ],
  webServer: {
    // Build próprio em modo memória (NEXT_PUBLIC_API_URL vazio) numa pasta separada da do dev.
    command: `pnpm exec next build && pnpm exec next start -p ${PORTA}`,
    env: { NEXT_PUBLIC_API_URL: "", NEXT_DIST_DIR: ".next-e2e", MSYS_NO_PATHCONV: "1" },
    url: `http://localhost:${PORTA}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
