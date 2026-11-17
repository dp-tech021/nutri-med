/* global document, innerWidth, getComputedStyle, scrollY */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5173';
const outputDirectory = process.env.SCREENSHOT_OUTPUT_DIR || 'docs/screenshots/marketplace';
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath, args: ['--no-sandbox'] } : {}) });
const results = [];
try {
  for (const width of [320, 375, 768, 1024, 1440]) {
    for (const authenticated of [false, true]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      // Synthetic session is isolated to this browser context. No real Auth service is used.
      if (authenticated) await context.addInitScript(() => {
        localStorage.setItem('sb-127-auth-token', JSON.stringify({
          access_token: 'synthetic-qa-token', refresh_token: 'synthetic-qa-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer',
          user: { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated' },
        }));
      });
      await context.route('http://127.0.0.1:54321/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        const data = path.endsWith('/me') ? {
          kind: 'cliente', display_name: 'Cliente sintético com nome público longo', city: '', category: '', about: '',
        } : path.endsWith('/categories') ? [] : { items: [], next_cursor: null };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { level: 1, name: 'Saúde e Serviços Gerais em uma só aplicação.' }).waitFor();
      assert.equal(await page.getByRole('link', { name: 'Encontrar profissional', exact: true }).getAttribute('href'), '/saude');
      assert.equal(await page.getByRole('link', { name: 'Encontrar serviço', exact: true }).getAttribute('href'), '/servicos');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `Home overflow at ${width}, authenticated=${authenticated}`);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus-visible').count(), 1);
      assert.notEqual(await page.locator(':focus-visible').evaluate((el) => getComputedStyle(el).outlineStyle), 'none');
      const nav = page.getByRole('navigation', { name: 'Navegação principal', exact: true });
      if (width < 1024) {
        const toggle = page.locator('.menu-toggle');
        await toggle.focus();
        await page.keyboard.press('Enter');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator(':focus').textContent(), 'Início');
        await page.screenshot({ path: `${outputDirectory}/${width}-${authenticated ? 'account' : 'visitor'}-menu.png`, fullPage: true });
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.equal(await toggle.evaluate((el) => el === document.activeElement), true);
        await toggle.click();
        await page.getByRole('button', { name: 'Fechar menu' }).click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await toggle.click();
      }
      assert.equal(await nav.getByRole('link', { name: 'Painel', exact: true }).count(), authenticated ? 1 : 0);
      assert.equal(await nav.getByRole('link', { name: 'Entrar', exact: true }).count(), authenticated ? 0 : 1);
      assert.equal(await nav.getByRole('link', { name: 'Saúde', exact: true }).getAttribute('href'), '/saude');
      assert.equal(await nav.getByRole('link', { name: 'Serviços', exact: true }).getAttribute('href'), '/servicos');
      await nav.getByRole('link', { name: 'Como funciona' }).click();
      assert.equal(new URL(page.url()).hash, '#como-funciona');
      if (width < 1024) assert.equal(await page.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded'), 'false');
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `${outputDirectory}/${width}-${authenticated ? 'account' : 'visitor'}-home.png`, fullPage: true });
      await page.getByRole('link', { name: 'Encontrar profissional', exact: true }).click();
      await page.getByRole('heading', { name: 'Catálogo de Saúde em preparação' }).waitFor();
      assert.equal(await page.evaluate(() => scrollY), 0, 'Route navigation starts at the top');
      assert.equal(new URL(page.url()).pathname, '/saude');
      assert.equal(await page.getByRole('combobox').count(), 0);
      assert.equal(await page.getByRole('textbox').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${outputDirectory}/${width}-${authenticated ? 'account' : 'visitor'}-health.png`, fullPage: true });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Encontrar serviço', exact: true }).click();
      await page.getByRole('heading', { name: 'Encontre serviços', exact: true }).waitFor();
      await page.getByText('Nenhum serviço encontrado', { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, '/servicos');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      results.push({ width, authenticated, home: 'passed', health: 'passed', catalog: 'passed', keyboard: 'passed', horizontalOverflow: false });
      await context.close();
    }
  }
  await writeFile(`${outputDirectory}/results.json`, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
