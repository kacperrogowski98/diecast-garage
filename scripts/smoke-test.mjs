import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await fs.readFile(target);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const pageErrors = [];

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  const manifestResponse = await page.request.get('http://127.0.0.1:4173/manifest.webmanifest');
  assert.equal(manifestResponse.status(), 200, 'PWA manifest should be served');
  const iconResponse = await page.request.get('http://127.0.0.1:4173/icon-192.png');
  assert.equal(iconResponse.status(), 200, 'PWA install icon should be served');
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20000 });

  await page.waitForFunction(
    () => document.querySelector('#catalogStatus')?.textContent.includes('Pobrano indeks online'),
    null,
    { timeout: 120000 }
  );

  const status = await page.locator('#catalogStatus').textContent();
  assert.match(status, /Pobrano indeks online:\s*[\d\s.,]+\s+wydań/i, 'Online catalogue index should import successfully');
  const releaseCount = Number((status.match(/Pobrano indeks online:\\s*([\\d\\s.,]+)\\s+wydań/i)?.[1] || '').replace(/[^\\d]/g, ''));
  assert.ok(releaseCount >= 17000, 'Online index should contain the broad upstream release catalogue');
  assert.match(status, /\\d+ marek rozpoznanych · \\d+ kandydatów Supercar\\/Hypercar/, 'Import summary should show recognized brands and supercar candidates');
  const catalogRefreshedAt = await page.evaluate(() => Number(localStorage.getItem('diecast_garage_catalog_refresh_v1')));
  assert.ok(catalogRefreshedAt > 0, 'Successful catalogue import should record its refresh timestamp');

  await page.locator('.tab[data-view="catalog"]').click();
  await page.locator('#search').fill('Ferrari');
  await page.waitForFunction(() => document.querySelectorAll('#content .car').length > 0);
  const visibleCars = await page.locator('#content .car').count();
  assert.ok(visibleCars > 0, 'Searching the imported catalogue for Ferrari should return model cards');

  const assortmentOptions = await page.locator('#assortmentFilter option').evaluateAll(options => options.map(option => option.value));
  assert.ok(assortmentOptions.includes('mainline') && assortmentOptions.includes('premium') && assortmentOptions.includes('silver-series'), 'Online catalogue should expose Mainline, Premium and Silver Series filters');
  await page.locator('#search').fill('');
  await page.locator('#assortmentFilter').selectOption('premium');
  await page.waitForFunction(() => document.querySelector('#resultCount')?.textContent.includes('wydań'));
  const premiumMeta = await page.locator('#content .car .meta').allTextContents();
  assert.ok(premiumMeta.some(value => value.toLowerCase().includes('premium') || value.toLowerCase().includes('boulevard') || value.toLowerCase().includes('car culture')), 'Premium filter should show Premium assortment releases');
  await page.locator('#assortmentFilter').selectOption('all');
  await page.locator('#search').fill('Ferrari');
  await page.waitForFunction(() => document.querySelectorAll('#content .car').length > 0);

  await page.locator('#content .car').first().getByRole('button', { name: /Szczegóły/ }).click();
  await page.locator('#modalRoot .modal h3').waitFor();
  await page.locator('#dgClassOverride').selectOption('supercar_hypercar');
  await page.getByRole('button', { name: 'Zapisz klasyfikację' }).click();
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).overrides || {}).some(value => value.classification_status === 'user_reviewed' && value.vehicle_class === 'supercar_hypercar'));
  await page.locator('#content .car').first().getByRole('button', { name: /Szczegóły/ }).click();
  await page.locator('#dgClassOverride').waitFor();
  await page.locator('#modalRoot .modal').getByRole('button', { name: '✕' }).click();

  await page.locator('#content .car').first().getByRole('button', { name: /Garaż/ }).click();
  await page.locator('.tab[data-view="garage"]').click();
  await page.waitForFunction(() => document.querySelector('#ownedCount')?.textContent === '1');

  await page.locator('.tab[data-view="packs"]').click();
  await page.getByRole('button', { name: /Dodaj własny multipack/ }).click();
  await page.locator('#customPackName').fill('E2E Test 5-Pack');
  await page.locator('#customPackYear').fill('2026');
  await page.locator('#customPackContents').fill('Ferrari F40\nLamborghini Countach');
  await page.getByRole('button', { name: 'Zapisz zestaw' }).click();
  const customPackCard = page.locator('#content .car').filter({ hasText: 'E2E Test 5-Pack' });
  await customPackCard.waitFor();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('diecast_garage_mvp_02')));
  assert.equal(saved.items.length, 1, 'Owned model should persist in local collection state');
  assert.equal(saved.customPacks.length, 1, 'Custom multipack should persist in local collection state');

  await customPackCard.getByRole('button', { name: 'Zawartość' }).click();
  await page.getByRole('button', { name: 'Edytuj' }).click();
  await page.locator('#customPackName').fill('E2E Edited 5-Pack');
  await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
  await page.locator('#content .car').filter({ hasText: 'E2E Edited 5-Pack' }).waitFor();
  await page.locator('#content .car').filter({ hasText: 'E2E Edited 5-Pack' }).getByRole('button', { name: 'Zawartość' }).click();
  await page.getByRole('button', { name: 'Usuń własny zestaw' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).customPacks.length === 0);
  assert.deepEqual(pageErrors, [], 'The browser should not emit uncaught JavaScript errors');

  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#content').waitFor();
  assert.match(await page.title(), /Diecast Garage/, 'The cached PWA shell should reopen offline');
  await page.waitForFunction(() => document.querySelector('#ownedCount')?.textContent === '1');
  assert.equal(await page.locator('#ownedCount').textContent(), '1', 'The garage collection should persist after an offline restart');

  console.log('Browser smoke test passed: PWA manifest/icons, offline shell, local persistence, online catalogue, search, details, garage and custom multipack CRUD.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
