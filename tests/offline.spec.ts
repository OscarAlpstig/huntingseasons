import { test, expect, chromium, webkit, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

let server: Server;
let origin: string;
let version = 1;
let unavailablePlanningChunk = false;
let weatherExpired = false;
let weatherFails = false;
let slowMapResponse = false;
let networkUnavailable = false;
const base = '/huntingseasons/';

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    if (networkUnavailable) { req.socket.destroy(); return; }
    const url = new URL(req.url!, 'http://localhost');
    if (!url.pathname.startsWith(base)) { res.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(base.length));
    if (relative === 'jaktplanering' || relative === 'installera') {
      res.writeHead(301, { Location: `${base}${relative}/${url.search}` }).end(); return;
    }
    if (relative.includes('..')) { res.writeHead(403).end(); return; }
    const path = relative.endsWith('/') || !relative ? `${relative}index.html` : relative;
    if (path === '__test-weather.json') {
      if (weatherFails) { res.writeHead(503).end(); return; }
      const date = Date.now() + (weatherExpired ? -24 : 1) * 3600000;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ geometry: { coordinates: [18.0686, 59.3293] }, timeSeries: Array.from({ length: 7 }, (_, i) => ({
        time: new Date(date + i * 3600000).toISOString(), data: { wind_from_direction: 90, wind_speed: 2, wind_speed_of_gust: 4, precipitation_amount_mean: 0.4, probability_of_precipitation: 70, symbol_code: 18 },
      })) })); return;
    }
    if (unavailablePlanningChunk && /assets\/JaktplaneringPage-.*\.js$/.test(path)) { res.writeHead(404).end(); return; }
    try {
      let content = await readFile(join(process.cwd(), 'dist', path));
      if (version === 2 && path === 'index.html') content = Buffer.from(content.toString().replace('<title>', '<title>Version 2 · '));
      if (version === 2 && path === 'sw.js') {
        const updated = content.toString().replace(/(url:"index.html",revision:")[^"]+/, '$1test-offline-update-v2');
        if (updated === content.toString()) throw new Error('No SW revision changed');
        content = Buffer.from(updated);
      }
      // Browser-level route mocks don't cover SW-owned fetches in WebKit.
      // Route only the test worker's SMHI traffic to our deterministic server.
      if (path === 'sw.js') content = Buffer.from(`self.addEventListener('fetch',event=>{if(new URL(event.request.url).hostname==='opendata-download-metfcst.smhi.se')event.respondWith(fetch('${base}__test-weather.json',{cache:'no-store'}));});\n${content}`);
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      if (slowMapResponse && path.endsWith('.hsmap')) {
        res.write(content.subarray(0, 16));
        const timer = setTimeout(() => res.end(content.subarray(16)), 5000);
        res.on('close', () => clearTimeout(timer)); return;
      }
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
  weatherExpired = expired; weatherFails = false;
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
  await page.getByRole('link', { name: 'Installera', exact: true }).click();
  await expect(page.getByText('Appen är redo offline på den här enheten.', { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
}

test('kallstart offline med båda sidor, sparat väder och karta utan externa tiles', async ({ browserName }) => {
  version = 1;
  const profile = await mkdtemp(join(tmpdir(), 'huntingseasons-offline-test-'));
  const browserType = browserName === 'webkit' ? webkit : chromium;
  let context = await browserType.launchPersistentContext(profile, { headless: true, viewport: { width: 402, height: 874 } });
  try {
    await mockWeather(context);
    let page = context.pages()[0];
    await ready(page);
    const manifest = await (await page.request.get(origin + base + 'manifest.webmanifest')).json();
    expect(manifest.scope).toBe(base); expect(manifest.start_url).toBe(base);
    expect(manifest.name).toBe('Hunting Seasons');
    expect(manifest.icons[0].src).toBe('logo.png');
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
    context = await browserType.launchPersistentContext(profile, { headless: true, viewport: { width: 402, height: 874 } });
    networkUnavailable = true;
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
    await page.getByRole('link', { name: 'Installera', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'iPhone', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Android', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Installera', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Installera', exact: true })).toBeVisible();
    await mockWeather(context);
    networkUnavailable = false;
    await context.setOffline(false);
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await expect(page.getByText('Prognosen är uppdaterad.', { exact: false })).toBeVisible();
    weatherFails = true;
    await context.route('https://opendata-download-metfcst.smhi.se/**', (route) => route.abort());
    await page.getByRole('button', { name: 'Uppdatera prognos', exact: true }).click();
    await expect(page.getByText('Sparad prognos – kan inte uppdateras.', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
  } finally { networkUnavailable = false; await context.close(); await rm(profile, { recursive: true, force: true }); }
});

test('avbruten karthämtning och felaktig import skapar inget sparat område', async ({ browser }) => {
  version = 1;
  const context = await browser.newContext();
  await mockWeather(context);
  const page = await context.newPage();
  try {
    await ready(page);
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await page.getByText('Kartlager', { exact: true }).click();
    await page.getByText('Spara karta offline', { exact: true }).click();
    slowMapResponse = true;
    await page.getByRole('button', { name: 'Spara området', exact: true }).click();
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.getByText('Nedladdningen avbröts. Inget nytt område sparades.', { exact: true })).toBeVisible();
    expect(await page.locator('.offline-maps li').count()).toBe(0);
    slowMapResponse = false;
    await page.getByLabel('Importera eget kartpaket').setInputFiles({ name: 'fel.hsmap', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await expect(page.getByText('Området kunde inte sparas.', { exact: false })).toBeVisible();
    expect(await page.locator('.offline-maps li').count()).toBe(0);
  } finally { slowMapResponse = false; await context.close(); }
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
  networkUnavailable = true;
  await context.setOffline(true);
  await context.unroute('https://opendata-download-metfcst.smhi.se/**');
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'ingen sparad prognos' })).toBeVisible();
  expect(await page.locator('.scent-direction-line').count()).toBe(0);
  networkUnavailable = false;
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
    expect(await page.title()).toBe('Hunting Seasons');
    await page.getByRole('button', { name: 'Uppdatera appen', exact: true }).click();
    await expect(page).toHaveTitle('Version 2 · Hunting Seasons');
    expect(await page.evaluate(async () => (await caches.open('another-project-cache')).match('/other-project/test').then((value) => Boolean(value)))).toBe(true);
  } finally { version = 1; await context.close(); }
});

test('saknad sidfil efter publicering visar återhämtning i stället för en tom app', async ({ browser }) => {
  version = 1;
  unavailablePlanningChunk = true;
  const context = await browser.newContext();
  await mockWeather(context);
  const page = await context.newPage();
  try {
    await page.goto(origin + base);
    await expect(page.getByRole('heading', { name: 'Jakttider', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Sidan kunde inte laddas', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Huvudnavigation' })).toBeVisible();
    unavailablePlanningChunk = false;
    await page.getByRole('button', { name: 'Hämta senaste versionen', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Vind & vittring', exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Prognosen är uppdaterad.', { exact: false })).toBeVisible();
  } finally { unavailablePlanningChunk = false; await context.close(); }
});

test('mobil visar väderförklaringen bara efter ikontryck och täcker inte vädervärden', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true });
  await mockWeather(context);
  const page = await context.newPage();
  try {
    await ready(page);
    await page.getByRole('link', { name: 'Vind & vittring', exact: true }).click();
    await expect(page.getByText('Prognosen är uppdaterad.', { exact: false })).toBeVisible();
    const cards = page.locator('.forecast-hour');
    const label = cards.first().getByRole('tooltip', { includeHidden: true });
    const icon = cards.first().getByRole('button', { name: 'Visa väderförklaring: Regn', exact: true });
    await expect(label).toBeHidden();
    await cards.nth(1).locator('.forecast-hour-select').click({ position: { x: 8, y: 8 } });
    await expect(label).toBeHidden();
    const selectedTime = await page.getByLabel('Prognostid', { exact: true }).inputValue();
    await icon.click();
    await expect(label).toBeVisible();
    expect(await page.getByLabel('Prognostid', { exact: true }).inputValue()).toBe(selectedTime);
    const textBounds = await label.boundingBox();
    const windBounds = await cards.first().locator('strong').boundingBox();
    expect(textBounds!.y + textBounds!.height).toBeLessThanOrEqual(windBounds!.y);
    await icon.click();
    await expect(label).toBeHidden();
    await icon.click();
    await page.getByRole('heading', { name: 'Vind & vittring', exact: true }).click();
    await expect(label).toBeHidden();
  } finally { await context.close(); }
});
