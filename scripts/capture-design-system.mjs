import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173';
const outputDirectory = process.env.SCREENSHOT_OUTPUT_DIR || 'docs/screenshots/design-system';
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: executablePath ? ['--no-sandbox'] : [],
});

try {
  for (const viewport of [
    { name: 'mobile-375', width: 375, height: 900 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/dev/design-system`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${outputDirectory}/${viewport.name}.png`, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
