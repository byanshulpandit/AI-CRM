import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  // Tests share one backend + one seeded admin user (password/profile/theme
  // mutations). Parallel workers race on that shared state; run serially.
  workers: 1,

  reporter: [['html', { open: 'never' }], ['list']],

  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',

    headless: true,

    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    actionTimeout: 15000,

    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',

    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',

    reuseExistingServer: true,

    timeout: 120000,
  },
});