import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './frontend/tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5188',
    browserName: 'chromium',
    locale: 'ru-RU',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/orbit.mjs dev',
    url: 'http://127.0.0.1:5188/api/health',
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
