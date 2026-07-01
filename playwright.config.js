const { defineConfig } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:8082';

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'cmd /c npm run web -- --port 8082',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
