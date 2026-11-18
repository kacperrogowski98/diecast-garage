import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

assert.match(html, /<html lang="pl">/i, 'Polish document language is present');
assert.match(html, /id="content"/, 'Main app content mount exists');
assert.match(html, /dgFetchOnlineCatalog/, 'Online catalogue importer is wired');
assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/, 'PWA service worker is registered');
assert.equal(manifest.start_url, './', 'PWA start URL must work under a GitHub Pages subpath');
assert.equal(manifest.scope, './', 'PWA scope must work under a GitHub Pages subpath');
assert.match(schema, /enable row level security/ig, 'RLS must be enabled in the schema');
assert.match(schema, /auth\.uid\(\)\s*=\s*user_id/i, 'User rows must be scoped to the authenticated user');
assert.match(schema, /client_item_id text not null/i, 'Normalized sync tables need stable client IDs');
assert.match(schema, /Users read own Diecast Garage photos/i, 'Private photo bucket must have owner-scoped read policy');
assert.match(schema, /bucket_id = 'diecast-photos'/i, 'Photo policies must be restricted to the private bucket');

const inlineScripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs, body]) => !/\bsrc\s*=/.test(attrs) && body.trim());
assert.ok(inlineScripts.length >= 2, 'Expected app and service-worker inline scripts');
for (let i = 0; i < inlineScripts.length; i++) {
  const tmp = `/tmp/diecast-garage-inline-${i}.js`;
  fs.writeFileSync(tmp, inlineScripts[i][2]);
  const { spawnSync } = await import('node:child_process');
  const check = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  assert.equal(check.status, 0, `Inline script ${i} has a syntax error: ${check.stderr}`);
}

const start = html.indexOf('const DG_BRANDS=');
const end = html.indexOf('async function dgReadCatalogFile', start);
assert.ok(start >= 0 && end > start, 'Catalogue normalizer source must be present');
const context = { location: { href: 'https://app.test/' } };
vm.runInNewContext(html.slice(start, end) + '\nglobalThis.testNormalize = dgNormalizeRecord; globalThis.testExtract = dgExtractRows; globalThis.testClassify = dgClassify; globalThis.testSafeUrl = dgSafeHttpUrl;', context);

const sample = {
  id: 'JBB06_1',
  title: "'15 LAND ROVER DEFENDER DOUBLE CAB",
  year: '2025',
  assortment: 'mainline',
  sku: 'JBB06',
  number: '179',
  series: 'HW Dirt',
  img: 1,
  color: 'Dark Red'
};
const normalized = context.testNormalize(sample, 'diecastdb', 0, {});
assert.equal(normalized.brand, 'Land Rover', 'Brand inference must recognize model names with a year prefix');
assert.equal(normalized.release_year, 2025, 'Year must map from scan-index year field');
assert.equal(normalized.assortment, 'mainline', 'Collection key must be retained');
assert.equal(normalized.source_record_id, 'JBB06_1', 'Upstream source ID must be retained');
assert.match(normalized.image_url, /findmyhw\.com\/media\/images\//, 'Image URL must use the upstream image convention');

const extracted = context.testExtract({
  fields: ['id', 'title', 'year', 'assortment', 'sku', 'number', 'series', 'rarity', 'img', 'color'],
  cars: [['JBB06_1', "'15 LAND ROVER DEFENDER DOUBLE CAB", '2025', 'mainline', 'JBB06', '179', 'HW Dirt', '', 1, 'Dark Red']]
}, 'scan-index.json');
assert.equal(extracted.rows.length, 1, 'Compact scan index row must be expanded');
assert.equal(extracted.rows[0].title, sample.title, 'Compact scan index columns must map by field name');
assert.equal(context.testClassify('Ferrari 812 Competizione', 'Ferrari', ''), 'supercar_hypercar', 'Known supercar models must enter the Supercar/Hypercar filter');
assert.equal(context.testClassify('Ferrari 499P', 'Ferrari', ''), 'racing', 'Le Mans prototype castings must remain in Racing, not Supercar/Hypercar');
assert.equal(context.testSafeUrl('javascript:alert(1)'), '', 'Imported unsafe URL schemes must be rejected');
assert.equal(context.testSafeUrl(''), '', 'Missing optional URLs must remain empty');

console.log('Diecast Garage checks passed: HTML, inline JavaScript, PWA paths, RLS markers and catalogue adapter.');
