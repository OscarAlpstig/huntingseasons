import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

let server: Server;
let origin: string;
let version = 1;
const base = '/huntingseasons/';

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    if (!url.pathname.startsWith(base)) { res.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(base.length));
    if (relative.includes('..')) { res.writeHead(403).end(); return; }
    const path = relative.endsWith('/') || !relative ? `${relative}index.html` : relative;
    try {
      let content = await readFile(join(process.cwd(), 'dist', path));
      if (version === 2 && path === 'index.html') content = Buffer.from(content.toString().replace('<title>', '<title>Version 2 · '));
      if (version === 2 && path === 'sw.js') {
        const updated = content.toString().replace(/(url:"index.html",revision:")[^"]+/, '$1test-offline-update-v2');
        if (updated === content.toString()) throw new Error('No SW revision changed');
        content = Buffer.from(updated);
      }
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server');
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });

async function mockWeather(context: BrowserContext, expired = false) {
  await context.route('https://opendata-download-metfcst.smhi.se/**', async (route) => {
    const date = Date.now() + (expired ? -24 : 1) * 3600000;
    await route.fulfill({ json: { geometry: { coordinates: [18.0686, 59.3293] }, timeSeries: Array.from({ length: 7 }, (_, i) => ({
      time: new Date(date + i * 3600000).toISOString(), data: { wind_from_direction: 90, wind_speed: 2, wind_speed_of_gust: 4, precipitation_amount_mean: 0.4, probability_of_precipitation: 70, symbol_code: 18 },
    })) } });
  });
  await context.route(/https:\/\/.*(?:tile\.opentopomap\.org|tile\.openstreetmap\.org|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, (route) => route.abort());
}

async function ready(page: Page) {
  await page.goto(origin + base);
  await page.getByText('Installera appen och använd offline', { exact: true }).click();
  await expect(page.getByText('Appen är redo offline på den här enheten.', { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
}

test('kallstart offline med båda sidor, sparat väder och karta utan externa tiles', async () => {
  version = 1;
  const profile = await mkdtemp(join(tmpdir(), 'huntingseasons-offline-test-'));
  let context = await chromium.launchPersistentContext(profile, { headless: true, viewport: { width: 402, height: 874 } });
  try {
    await mockWeather(context);
    let page = context.pages()[0];
    await ready(page);
    const manifest = await (await page.request.get(origin + base + 'manifest.webmanifest')).json();
    expect(manifest.scope).toBe(base); expect(manifest.start_url).toBe(base);
    await page.getByRole('link', { name: 'Vind & vittring' }).click();
    await expect(page.getByText('Prognosen är uppdaterad.', { exact: false })).toBeVisible();
    await page.getByText('Kartlager', { exact: true }).click();
    await page.getByText('Spara karta offline', { exact: true }).click();
    await page.getByRole('button', { name: 'Spara området', exact: true }).click();
    await expect(page.getByText(/Stockholm-demo är sparad offline/)).toBeVisible();
    await expect(page.getByLabel('Baskarta')).toHaveValue('saved');
    await page.getByText('Kartlager', { exact: true }).click();
    await expect.poll(() => page.locator('.terrain-map-canvas canvas').count()).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => Array.from(document.querySelectorAll<HTMLCanvasElement>('.terrain-map-canvas canvas')).some((canvas) => {
      const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
      if (!pixels) return false;
      let colored = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] && (pixels[i] !== 237 || pixels[i + 1] !== 233 || pixels[i + 2] !== 217)) colored++;
      return colored > 1000;
    }))).toBe(true);
    // Package URLs must never be included in the mandatory app precache.
    expect(await page.evaluate(async () => {
      const names = (await caches.keys()).filter((name) => name.startsWith('huntingseasons-app-'));
      const urls = (await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))).flat();
      return urls.some((url) => url.includes('.hsmap'));
    })).toBe(false);
    await context.close();
    context = await chromium.launchPersistentContext(profile, { headless: true, viewport: { width: 402, height: 874 } });
    await context.setOffline(true);
    page = context.pages()[0];
    const external: string[] = [];
    page.on('request', (request) => { if (/tile\.(?:openstreetmap|opentopomap)/.test(request.url())) external.push(request.url()); });
    await page.goto(origin + base + 'jaktplanering/');
    await expect(page.getByRole('heading', { name: 'Vind & vittring', exact: true })).toBeVisible();
    await expect(page.getByText('Sparad prognos – kan inte uppdateras.', { exact: false })).toBeVisible();
    await expect.poll(() => page.locator('.terrain-map-canvas canvas').count()).toBeGreaterThan(0);
    expect(external).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(402);
    await page.reload();
    await expect(page.getByText('Sparad prognos – kan inte uppdateras.', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Jakttider', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Jakttider', exact: true })).toBeVisible();
    await expect(page.getByLabel('Sol- och måntider för vald dag')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Jakttider', exact: true })).toBeVisible();
    await page.getByText('Installera appen och använd offline', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'iPhone', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Android', exact: true })).toBeVisible();
    await mockWeather(context);
    await context.setOffline(false);
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await expect(page.getByText('Prognosen är uppdaterad.', { exact: false })).toBeVisible();
    await context.route('https://opendata-download-metfcst.smhi.se/**', (route) => route.abort());
    await page.getByRole('button', { name: 'Uppdatera prognos', exact: true }).click();
    await expect(page.getByText('Sparad prognos – kan inte uppdateras.', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
  } finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
});

test('avbruten karthämtning och felaktig import skapar inget sparat område', async ({ browser }) => {
  version = 1;
  const context = await browser.newContext();
  await mockWeather(context);
  const page = await context.newPage();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  try {
    await ready(page);
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await page.getByText('Kartlager', { exact: true }).click();
    await page.getByText('Spara karta offline', { exact: true }).click();
    await context.route('**/*.hsmap', async (route) => { await gate; await route.continue().catch(() => undefined); });
    await page.getByRole('button', { name: 'Spara området', exact: true }).click();
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.getByText('Nedladdningen avbröts. Inget nytt område sparades.', { exact: true })).toBeVisible();
    expect(await page.locator('.offline-maps li').count()).toBe(0);
    release();
    await page.getByLabel('Importera eget kartpaket').setInputFiles({ name: 'fel.hsmap', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await expect(page.getByText('Området kunde inte sparas.', { exact: false })).toBeVisible();
    expect(await page.locator('.offline-maps li').count()).toBe(0);
  } finally { release(); await context.close(); }
});

test('utgången prognos och saknad prognos ger tydlig status utan vittring', async ({ browser }) => {
  const context = await browser.newContext();
  await mockWeather(context, true);
  const page = await context.newPage();
  await ready(page);
  await page.getByRole('link', { name: 'Vind & vittring' }).click();
  await expect(page.getByText('Sparad prognos har löpt ut.', { exact: false })).toBeVisible();
  expect(await page.locator('.scent-direction-line').count()).toBe(0);
  await page.evaluate(async () => {
    const open = indexedDB.open('huntingseasons-offline-v1', 1);
    await new Promise<void>((resolve) => { open.onsuccess = () => {
      const tx = open.result.transaction('records', 'readwrite'); tx.objectStore('records').clear();
      tx.oncomplete = () => { open.result.close(); resolve(); };
    }; });
  });
  await context.setOffline(true);
  await context.unroute('https://opendata-download-metfcst.smhi.se/**');
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'ingen sparad prognos' })).toBeVisible();
  expect(await page.locator('.scent-direction-line').count()).toBe(0);
  await context.close();
});

test('ny service worker uppdateras först efter godkännande och lämnar andra cacher orörda', async ({ browser }) => {
  version = 1;
  const context = await browser.newContext();
  await mockWeather(context);
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(async () => {
      const cache = await caches.open('another-project-cache'); await cache.put('/other-project/test', new Response('keep'));
    });
    version = 2;
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await expect(page.getByRole('button', { name: 'Uppdatera appen', exact: true })).toBeVisible();
    expect(await page.title()).toBe('Jaktsäsong');
    await page.getByRole('button', { name: 'Uppdatera appen', exact: true }).click();
    await expect(page).toHaveTitle('Version 2 · Jaktsäsong');
    expect(await page.evaluate(async () => (await caches.open('another-project-cache')).match('/other-project/test').then((value) => Boolean(value)))).toBe(true);
  } finally { version = 1; await context.close(); }
});
