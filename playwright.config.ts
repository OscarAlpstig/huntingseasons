import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', timeout: 60000, workers: 1,
  use: { headless: true, viewport: { width: 402, height: 874 } },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'iphone-webkit', use: { browserName: 'webkit', isMobile: true, hasTouch: true } },
  ],
});
