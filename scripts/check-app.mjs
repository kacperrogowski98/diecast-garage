import fs from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
const syncMigration = fs.readFileSync('supabase/migrations/20261118_atomic_collection_sync.sql', 'utf8');
const syncVerification = fs.readFileSync('supabase/verify_sync_setup.sql', 'utf8');
const serviceWorker = fs.readFileSync('sw.js', 'utf8');

assert.match(html, /<html lang="pl">/i, 'Polish document language is present');
assert.ok(html.includes('<title>Diecast Garage · v1.15</title>'), 'Current app release title must be v1.15');
assert.ok(html.includes('PERSONAL COLLECTION MANAGER · v1.15') && html.includes('Diecast Garage · v1.15 ·'), 'Visible app version labels must match the release title');
assert.ok(serviceWorker.includes('diecast-garage-shell-v1.15.0'), 'PWA shell cache must be versioned with the current release');
assert.match(html, /id="content"/, 'Main app content mount exists');
assert.match(html, /id="assortmentFilter"/, 'Catalogue assortment filter exists');
assert.match(html, /id="sortFilter"/, 'Catalogue sort control exists');
assert.match(html, /sortFilter==='year_desc'/, 'Catalogue supports newest-release sorting');
assert.match(html, /sortFilter==='year_asc'/, 'Catalogue supports oldest-release sorting');
assert.match(html, /sortFilter==='brand'/, 'Catalogue supports brand sorting');
assert.match(html, /function saveClassificationOverride\(id\)/, 'Collectors can correct automatic model classification');
assert.match(html, /state\.custom\.map\(x=>\(\{\.\.\.x,\.\.\.\(state\.overrides\?\.\[x\.custom_id\]\|\|\{\}\)/, 'Custom model classification overrides must be applied when rendering the catalogue');
assert.match(html, /classification_status:'user_reviewed'/, 'User classification corrections must be explicitly marked as reviewed');
assert.match(html, /DG_CATALOG_REFRESH_INTERVAL=7\*24\*60\*60\*1000/, 'Catalogue refresh cadence must follow the upstream weekly update');
assert.match(html, /dgCatalogNeedsRefresh\(\)/, 'Catalogue must check its refresh timestamp at startup');
assert.match(html, /assortmentFilter==='all'\|\|x\.assortment===assortmentFilter/, 'Catalogue results are filtered by assortment');
assert.match(html, /getElementById\('assortmentFilter'\)\.addEventListener\('change'/, 'Assortment filter updates the catalogue');
assert.match(html, /getElementById\('sortFilter'\)\.addEventListener\('change'/, 'Sort control updates the catalogue');
assert.match(html, /dgFetchOnlineCatalog/, 'Online catalogue importer is wired');
assert.match(html, /marek rozpoznanych.*kandydatów Supercar\/Hypercar/, 'Catalogue import status must report recognized brands and supercar candidates');
assert.ok(html.includes('function addCustomPack()'), 'Collectors must be able to create custom multipacks');
assert.ok(html.includes('function removeCustomPack('), 'Collectors must be able to delete custom multipacks');
assert.ok(html.includes('function editCustomPack('), 'Collectors must be able to edit custom multipacks');
assert.ok(html.includes('function editPackItem(') && html.includes('function savePackItem(') && html.includes('function removePackItem('), 'Collectors must be able to edit and remove owned multipack copies');
assert.match(html, /Twoja kolekcja \(\$\{ownedPacks\.length\}\)/, 'Pack details must show owned copies');
assert.ok(html.includes('customPacks=Array.isArray'), 'Custom multipacks must survive local state and backup normalization');
assert.match(html, /dgSyncMeta\(\)/, 'Cloud sync metadata must be tracked per user');
assert.match(html, /W chmurze są zmiany nowsze/, 'Cloud push must warn before overwriting a newer snapshot');
assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/, 'PWA service worker is registered');
assert.equal(manifest.start_url, './', 'PWA start URL must work under a GitHub Pages subpath');
assert.equal(manifest.scope, './', 'PWA scope must work under a GitHub Pages subpath');
assert.ok(manifest.icons.some(icon => icon.src === './icon-192.png' && icon.sizes === '192x192'), 'PWA manifest must include a 192px PNG icon');
assert.ok(fs.existsSync('icon-192.png'), 'PWA raster icon file must exist');
assert.match(serviceWorker, /icon-192\.png/, 'Service worker must cache the raster install icon');
assert.match(schema, /enable row level security/ig, 'RLS must be enabled in the schema');
assert.match(schema, /auth\.uid\(\)\s*=\s*user_id/i, 'User rows must be scoped to the authenticated user');
assert.match(schema, /client_item_id text not null/i, 'Normalized sync tables need stable client IDs');
assert.match(schema, /Users read own Diecast Garage photos/i, 'Private photo bucket must have owner-scoped read policy');
assert.match(schema, /bucket_id = 'diecast-photos'/i, 'Photo policies must be restricted to the private bucket');
assert.ok(schema.includes('function public.sync_diecast_garage'), 'Schema must expose atomic snapshot and normalized item sync');
assert.match(schema, /item_data jsonb not null/i, 'Normalized rows must preserve complete client item data');
assert.ok(html.includes("rpc('sync_diecast_garage'"), 'Client must use the atomic sync RPC when available');
assert.ok(syncMigration.includes('pg_advisory_xact_lock'), 'Atomic sync must serialize writes per user');
assert.ok(syncMigration.includes('is distinct from p_expected_updated_at'), 'Atomic sync must reject stale snapshots');
assert.match(syncMigration, /grant select, insert, update on public\.diecast_garage_data to authenticated/i, 'Authenticated users need explicit snapshot privileges for the invoker RPC');
assert.match(syncMigration, /grant select, insert, update, delete on public\.user_garage_items to authenticated/i, 'Authenticated users need explicit normalized garage privileges');
assert.match(syncVerification, /has_table_privilege/, 'Supabase verification must check table grants');
assert.ok(schema.endsWith(syncMigration), 'Full schema and incremental sync migration must stay aligned');
assert.match(syncVerification, /has_function_privilege/, 'Supabase verification script must check RPC permissions');
assert.match(syncVerification, /relrowsecurity/, 'Supabase verification script must check row-level security');
assert.match(html, /p_expected_updated_at/, 'Atomic sync must compare the cloud snapshot version');

const inlineScripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs, body]) => !/\bsrc\s*=/.test(attrs) && body.trim());
assert.ok(inlineScripts.length >= 2, 'Expected app and service-worker inline scripts');
for (let i = 0; i < inlineScripts.length; i++) {
  const tmp = `/tmp/diecast-garage-inline-${i}.js`;
  fs.writeFileSync(tmp, inlineScripts[i][2]);
  const check = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  assert.equal(check.status, 0, `Inline script ${i} has a syntax error: ${check.stderr}`);
}

const swCheck = spawnSync(process.execPath, ['--check', 'sw.js'], { encoding: 'utf8' });
assert.equal(swCheck.status, 0, `Service worker has a syntax error: ${swCheck.stderr}`);

const start = html.indexOf('const DG_BRANDS=');
const end = html.indexOf('async function dgReadCatalogFile', start);
assert.ok(start >= 0 && end > start, 'Catalogue normalizer source must be present');
const context = { location: { href: 'https://app.test/' }, URL };
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
assert.equal(context.testNormalize({title: "Custom '70 Honda N600", year: '1970', assortment: 'mainline'}, 'diecastdb', 1, {}).brand, 'Honda', 'Brand inference must find OEM names after custom prefixes');
assert.equal(normalized.release_year, 2025, 'Year must map from scan-index year field');
assert.equal(normalized.assortment, 'mainline', 'Collection key must be retained');
assert.equal(normalized.source_record_id, 'JBB06_1', 'Upstream source ID must be retained');
const gallery = context.testNormalize({...sample, images: ['https://findmyhw.com/media/images/JBB06_1/JBB06_1_1.webp', 'https://findmyhw.com/media/images/JBB06_1/JBB06_1_2.webp', 'javascript:alert(1)']}, 'diecastdb', 0, {});
assert.equal(gallery.images.length, 2, 'All safe upstream gallery images must be preserved');
assert.equal(gallery.image_url, gallery.images[0], 'Primary image must remain the first gallery image');
assert.ok(gallery.images.every(url => url.startsWith('https://')), 'Unsafe image URL schemes must be excluded from the gallery');
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
