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
assert.ok(html.includes('<title>Diecast Garage · v1.56</title>'), 'Current app release title must be v1.56');
assert.ok(html.includes('PERSONAL COLLECTION MANAGER · v1.56') && html.includes('Diecast Garage · v1.56 ·'), 'Visible app version labels must match the release title');
assert.ok(serviceWorker.includes('diecast-garage-shell-v1.56.0'), 'PWA shell cache must be versioned with the current release');
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
assert.ok(html.includes('Przy pierwszym uruchomieniu aplikacja automatycznie pobiera szeroki katalog online'), 'Initial catalogue notice must explain automatic first-run download');
assert.match(html, /dgLoadCatalog\(\)\.then\(\(\)=>\{dgRefreshFilters\(\);render\(\);if\(\(!importedCatalog\.length\|\|dgCatalogNeedsRefresh\(\)\)/, 'Startup loads cached catalogue then automatically downloads or refreshes the online index');

assert.match(html, /assortmentFilter==='all'\|\|x\.assortment===assortmentFilter/, 'Catalogue results are filtered by assortment');
assert.match(html, /getElementById\('assortmentFilter'\)\.addEventListener\('change'/, 'Assortment filter updates the catalogue');
assert.match(html, /getElementById\('sortFilter'\)\.addEventListener\('change'/, 'Sort control updates the catalogue');
assert.match(html, /dgFetchOnlineCatalog/, 'Online catalogue importer is wired');
assert.ok(html.includes('https://cdn.jsdelivr.net/gh/danyjoy/diecastDb@main/data/scan-index.json'), 'Catalogue index must have a jsDelivr fallback');
assert.ok(html.includes("let sources=['https://raw.githubusercontent.com/danyjoy/diecastDb/main/data/'+key+'.json','https://cdn.jsdelivr.net/gh/danyjoy/diecastDb@main/data/'+key+'.json','https://danyjoy.github.io/diecastDb/data/'+key+'.json']"), 'Lazy year-file enrichment must retry multiple public mirrors');
assert.match(html, /marek rozpoznanych.*kandydatów Supercar\/Hypercar/, 'Catalogue import status must report recognized brands and supercar candidates');
const seedJsonStart2022 = html.indexOf('const SEED=') + 'const SEED='.length;
const seedJsonEnd2022 = html.indexOf(';' + '\n' + 'const KEY', seedJsonStart2022);
assert.ok(seedJsonStart2022 >= 'const SEED='.length && seedJsonEnd2022 > seedJsonStart2022, 'Seed catalogue JSON can be located for data integrity checks');
const seedData2022 = JSON.parse(html.slice(seedJsonStart2022, seedJsonEnd2022));
const packs2022 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2022-'));
const contents2022 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2022-'));
assert.equal(packs2022.length, 18, '2022 five-pack catalogue includes all 18 distinct package codes/variants in the checklist');
assert.equal(contents2022.length, 90, '2022 five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2022.every(p => contents2022.filter(c => c.pack_id === p.pack_id).length === 5), 'Every 2022 five-pack has exactly five listed contents');
assert.ok(packs2022.every(p => p.source_url === 'https://www.wheelwonderland.com/en/5-packs/2022/'), 'Every 2022 pack retains its source provenance');
const packs2023 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2023-'));
const contents2023 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2023-'));
assert.equal(packs2023.length, 18, '2023 five-pack catalogue includes 18 fully enumerated package codes');
assert.equal(contents2023.length, 90, '2023 five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2023.every(p => contents2023.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2023/'), 'Every 2023 pack has five contents and source provenance');
const packs2024 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2024-'));
const contents2024 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2024-'));
assert.equal(packs2024.length, 17, '2024 five-pack catalogue includes 17 fully enumerated package codes');
assert.equal(contents2024.length, 85, '2024 five-pack catalogue includes 85 vehicle entries');
assert.ok(packs2024.every(p => contents2024.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2024/'), 'Every 2024 pack has five contents and source provenance');
const packs2025 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2025-'));
const contents2025 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2025-'));
assert.equal(packs2025.length, 18, '2025 five-pack catalogue includes 18 complete package codes');
assert.equal(contents2025.length, 90, '2025 five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2025.every(p => contents2025.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2025/'), 'Every 2025 pack has five contents and source provenance');
const packs2026 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2026-'));
const contents2026 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2026-'));
assert.equal(packs2026.length, 17, '2026 five-pack catalogue includes 17 additional complete package codes beyond the separately curated Ferrari pack');
assert.equal(contents2026.length, 85, '2026 additional five-pack catalogue includes 85 vehicle entries');
assert.ok(packs2026.every(p => contents2026.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2026/'), 'Every additional 2026 pack has five contents and source provenance');


assert.ok(html.includes('function packMatchKey(value)'), 'Pack contents use conservative normalized exact-name matching');
assert.ok(html.includes("match_status:'exact'") && html.includes("ids.length>1?'ambiguous':'unmatched'"), 'Pack matching links only unique exact casting matches and flags ambiguity');
assert.ok(html.includes('Połączono z katalogiem') && html.includes('Brak dokładnego dopasowania'), 'Pack details disclose catalogue matching status');
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
vm.runInNewContext(html.slice(start, end) + '\nglobalThis.testNormalize = dgNormalizeRecord; globalThis.testExtract = dgExtractRows; globalThis.testClassify = dgClassify; globalThis.testSafeUrl = dgSafeHttpUrl; globalThis.testBrand = dgInferBrand;', context);

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
assert.equal(context.testBrand('2021 Bugatti Bolide'), 'Bugatti', 'Brand inference must handle year-prefixed hypercars');
assert.equal(context.testBrand('Porsche 911 GT3'), 'Porsche', 'Brand inference must recognize Porsche casting names');
assert.equal(context.testBrand('Mercedes Benz 300 SL'), 'Mercedes-Benz', 'Brand aliases must normalize Mercedes Benz spelling');
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
assert.equal(context.testClassify('McLaren F1 GTR', 'McLaren', ''), 'racing', 'Competition variants of supercars must take precedence over road-car model terms');
assert.equal(context.testClassify('Ford GT', 'Ford', ''), 'supercar_hypercar', 'Road-going Ford GT must remain a Supercar/Hypercar candidate');
assert.equal(context.testClassify('McLaren F1', 'McLaren', ''), 'supercar_hypercar', 'Road-going McLaren F1 must remain a Supercar/Hypercar candidate');
assert.equal(context.testSafeUrl('javascript:alert(1)'), '', 'Imported unsafe URL schemes must be rejected');
assert.equal(context.testSafeUrl(''), '', 'Missing optional URLs must remain empty');

const seedStart = html.indexOf('const SEED=') + 'const SEED='.length;
const seedEnd = html.indexOf(';\nconst KEY', seedStart);
assert.ok(seedStart >= 'const SEED='.length && seedEnd > seedStart, 'Seed catalogue JSON must be present');
const seedData = JSON.parse(html.slice(seedStart, seedEnd));
for (const [packId, year] of [['ferrari-5pack-1994-gift', '1994'], ['ferrari-5pack-1995', '1995'], ['ferrari-5pack-2026', '2026']]) {
  const contents = seedData.pack_contents.filter(item => item.pack_id === packId);
  assert.equal(contents.length, 5, `Ferrari ${year} 5-pack must contain exactly five linked records`);
  assert.ok(contents.every(item => item.source_url.includes(`_(${year})`)), `Ferrari ${year} pack contents must point to the matching source year`);
}

const packs2020 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2020-'));
const contents2020 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2020-'));
assert.equal(packs2020.length, 17, '2020 adds 17 fully enumerated numbered five-packs beyond the already curated Exotics pack');
assert.equal(contents2020.length, 85, '2020 additional five-pack catalogue includes 85 vehicle entries');
assert.ok(packs2020.every(p => contents2020.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2020/'), 'Every additional 2020 pack has five contents and source provenance');
const packs2021 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2021-'));
const contents2021 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2021-'));
assert.equal(packs2021.length, 16, '2021 adds 16 fully enumerated numbered five-packs beyond the already curated Exotics pack');
assert.equal(contents2021.length, 80, '2021 additional five-pack catalogue includes 80 vehicle entries');
assert.ok(packs2021.every(p => contents2021.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2021/'), 'Every additional 2021 pack has five contents and source provenance');
assert.ok(html.includes('function packContentCount(packId)') && html.includes('let contentCount=packContentCount(p.pack_id)'), 'Multipack grid counts contents without resolving catalogue matches');
const renderPacksSource = html.slice(html.indexOf('function renderPacks(content){'), html.indexOf('function packDetails(packId){'));
assert.ok(!renderPacksSource.includes('packContents(p.pack_id)'), 'Multipack grid must not build catalogue match indexes for every pack');


const packs2019 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2019-'));
const contents2019 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2019-'));
assert.equal(packs2019.length, 15, '2019 adds 15 fully enumerated numbered five-packs beyond the curated Exotics pack');
assert.equal(contents2019.length, 75, '2019 additional five-pack catalogue includes 75 vehicle entries');
assert.ok(packs2019.every(p => contents2019.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2019/'), 'Every additional 2019 pack has five contents and source provenance');


const packs2018 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2018-'));
const contents2018 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2018-'));
assert.equal(packs2018.length, 18, '2018 adds 18 complete numbered packs beyond the curated Exotics pack');
assert.equal(contents2018.length, 90, '2018 additional five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2018.every(p => contents2018.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2018/'), 'Every additional 2018 pack has five contents and source provenance');
const packs2017 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2017-'));
const contents2017 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2017-'));
assert.equal(packs2017.length, 19, '2017 adds 19 complete numbered packs beyond the curated Exotics pack');
assert.equal(contents2017.length, 95, '2017 additional five-pack catalogue includes 95 vehicle entries');
assert.ok(packs2017.every(p => contents2017.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2017/'), 'Every additional 2017 pack has five contents and source provenance');


const packs2016 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2016-'));
const contents2016 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2016-'));
assert.equal(packs2016.length, 16, '2016 adds 16 complete numbered packs beyond the curated Exotics pack');
assert.equal(contents2016.length, 80, '2016 additional five-pack catalogue includes 80 vehicle entries');
assert.ok(packs2016.every(p => contents2016.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2016/'), 'Every additional 2016 pack has five contents and source provenance');


for (const [packId,sourceUrl] of [
  ['ferrari-5pack-2002','https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2002/'],
  ['ferrari-5pack-2003','https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2003/'],
  ['ferrari-5pack-2005','https://www.wheelwonderland.com/fr/series/ferrari-5-pack-2005/']
]) {
  const pack = seedData2022.packs.find(p => p.pack_id === packId);
  const contents = seedData2022.pack_contents.filter(c => c.pack_id === packId);
  assert.ok(pack && pack.source_url === sourceUrl && contents.length === 5 && contents.every(c => c.source_url === sourceUrl), packId + ' must have five sourced Ferrari models');
}


const ferrariPackData = [
 ['ferrari-5pack-2009-1',5],['ferrari-5pack-2009-2',5],['ferrari-5pack-2010',5],
 ['ferrari-5pack-2011',5],['ferrari-5pack-2012',5],['ferrari-5pack-2013',5],['ferrari-5pack-2014',5]
];
for (const [packId,expected] of ferrariPackData) {
 const pack=seedData2022.packs.find(p=>p.pack_id===packId);
 const contents=seedData2022.pack_contents.filter(c=>c.pack_id===packId);
 assert.ok(pack && pack.source_url && contents.length===expected && contents.every(c=>c.source_url===pack.source_url),packId+' must be complete and sourced');
}


const packs2015 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2015-'));
const contents2015 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2015-'));
assert.equal(packs2015.length, 16, '2015 adds 16 complete numbered packs beyond the curated Exotics pack');
assert.equal(contents2015.length, 80, '2015 additional five-pack catalogue includes 80 vehicle entries');
assert.ok(packs2015.every(p => contents2015.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2015/'), 'Every additional 2015 pack has five contents and source provenance');


const packs2014 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2014-'));
const contents2014 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2014-'));
assert.equal(packs2014.length, 18, '2014 adds 18 complete numbered packs beyond the curated Ferrari and Exotics packs');
assert.equal(contents2014.length, 90, '2014 additional five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2014.every(p => contents2014.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2014/'), 'Every additional 2014 pack has five contents and source provenance');


const packs2013 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2013-'));
const contents2013 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2013-'));
assert.equal(packs2013.length, 22, '2013 adds 22 complete numbered five-packs beyond the curated Ferrari pack');
assert.equal(contents2013.length, 110, '2013 additional five-pack catalogue includes 110 vehicle entries');
assert.ok(packs2013.every(p => contents2013.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2013/'), 'Every additional 2013 pack has five contents and source provenance');
const packs2012 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2012-'));
const contents2012 = seedData2022.pack_contents.filter(c => c.pack_id.startsWith('hw-5pack-2012-'));
assert.equal(packs2012.length, 16, '2012 adds 16 complete numbered five-packs beyond the curated Ferrari pack');
assert.equal(contents2012.length, 80, '2012 additional five-pack catalogue includes 80 vehicle entries');
assert.ok(packs2012.every(p => contents2012.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2012/'), 'Every additional 2012 five-pack has five contents and source provenance');
const halloweenPack = seedData2022.packs.find(p => p.pack_id === 'hw-6pack-2012-v8296');
assert.ok(halloweenPack && halloweenPack.pack_type === '6-pack' && seedData2022.pack_contents.filter(c => c.pack_id === halloweenPack.pack_id).length === 6, 'The 2012 Halloween six-pack retains all six vehicles as a six-pack');


const packs2010 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2010-'));
const contents2010 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2010-'));
assert.equal(packs2010.length, 18, '2010 adds 18 complete numbered five-packs beyond the curated Ferrari pack');
assert.equal(contents2010.length, 90, '2010 additional five-pack catalogue includes 90 vehicle entries');
assert.ok(packs2010.every(p => contents2010.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2010/'), 'Every additional 2010 pack has five contents and source provenance');
const packs2011 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2011-'));
const contents2011 = seedData2022.pack_contents.filter(c => c.pack_id.startsWith('hw-5pack-2011-'));
assert.equal(packs2011.length, 23, '2011 adds 23 complete numbered five-packs beyond the curated Ferrari and Exotics packs');
assert.equal(contents2011.length, 115, '2011 additional five-pack catalogue includes 115 vehicle entries');
assert.ok(packs2011.every(p => contents2011.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2011/'), 'Every additional 2011 pack has five contents and source provenance');


const packs2009 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2009-'));
const contents2009 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2009-'));
assert.equal(packs2009.length, 16, '2009 adds 16 complete numbered packs beyond the two curated Ferrari assortments');
assert.equal(contents2009.length, 80, '2009 additional five-pack catalogue includes 80 vehicle entries');
assert.ok(packs2009.every(p => contents2009.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2009/'), 'Every additional 2009 pack has five contents and source provenance');


const packs2008 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2008-'));
const contents2008 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2008-'));
assert.equal(packs2008.length, 15, '2008 adds 15 numbered non-Ferrari five-packs');
assert.equal(contents2008.length, 75, '2008 numbered five-pack catalogue includes 75 vehicle entries');
assert.ok(packs2008.every(p => contents2008.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2008/'), 'Every 2008 five-pack has five contents and source provenance');
const ferrari2008 = seedData2022.pack_contents.filter(c => c.pack_id === 'ferrari-5pack-2008');
assert.equal(ferrari2008.length, 5, '2008 Ferrari GT pack has five numbered models');
const packs2007 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2007-'));
const contents2007 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2007-'));
assert.equal(packs2007.length, 10, '2007 adds 10 numbered non-Exotics five-packs');
assert.equal(contents2007.length, 50, '2007 numbered five-pack catalogue includes 50 vehicle entries');
for (const [packId,count,type] of [['hw-8pack-2007-j7099',8,'8-pack'],['hw-7pack-2007-l7883',7,'7-pack'],['hw-6pack-2007-k6169',6,'6-pack']]) {
 const pack=seedData2022.packs.find(p=>p.pack_id===packId);
 assert.ok(pack && pack.pack_type===type && seedData2022.pack_contents.filter(c=>c.pack_id===packId).length===count,packId+' retains its exact non-five-pack size');
}


const packs2006 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2006-'));
const contents2006 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2006-'));
assert.equal(packs2006.length, 13, '2006 adds 13 complete numbered five-packs');
assert.equal(contents2006.length, 65, '2006 five-pack catalogue includes 65 vehicle entries');
assert.ok(packs2006.every(p => contents2006.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2006/'), 'Every 2006 five-pack has five contents and source provenance');
const xray2006 = seedData2022.packs.find(p => p.pack_id === 'hw-6pack-2006-j3304');
assert.ok(xray2006 && xray2006.pack_type === '6-pack' && seedData2022.pack_contents.filter(c => c.pack_id === xray2006.pack_id).length === 6, '2006 X-Raycers assortment is correctly represented as a six-pack');


const packs2005 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2005-'));
const contents2005 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2005-'));
assert.equal(packs2005.length, 11, '2005 adds eleven additional complete numbered five-packs; the Ferrari pack already exists');
assert.equal(contents2005.length, 55, '2005 additional five-pack catalogue includes 55 vehicle entries');
assert.ok(packs2005.every(p => contents2005.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2005/'), 'Every 2005 five-pack has five contents and source provenance');
const dualCool2005 = seedData2022.packs.find(p => p.pack_id === 'hw-6pack-2005-g6912');
assert.ok(dualCool2005 && dualCool2005.pack_type === '6-pack' && seedData2022.pack_contents.filter(c => c.pack_id === dualCool2005.pack_id).length === 6, '2005 Dual Cool assortment is correctly represented as a six-pack');


const packs2004 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2004-'));
const contents2004 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2004-'));
assert.equal(packs2004.length, 12, '2004 adds twelve complete numbered five-packs');
assert.equal(contents2004.length, 60, '2004 five-pack catalogue includes 60 vehicle entries');
assert.ok(packs2004.every(p => contents2004.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/es/5-packs/2004/'), 'Every 2004 five-pack has five contents and source provenance');


const packs2003 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2003-'));
const contents2003 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2003-'));
assert.equal(packs2003.length, 11, '2003 adds eleven complete numbered five-packs');
assert.equal(contents2003.length, 55, '2003 five-pack catalogue includes 55 vehicle entries');
assert.ok(packs2003.every(p => contents2003.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2003/'), 'Every 2003 five-pack has five contents and source provenance');


const packs2002 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2002-'));
const contents2002 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2002-'));
assert.equal(packs2002.length, 12, '2002 adds twelve complete numbered five-packs; Ferrari already exists');
assert.equal(contents2002.length, 60, '2002 additional five-pack catalogue includes 60 vehicle entries');
assert.ok(packs2002.every(p => contents2002.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2002/'), 'Every 2002 five-pack has five contents and source provenance');


const packs2001 = seedData2022.packs.filter(p => p.release_year === 2001 && p.pack_id.startsWith('hw-'));
const contents2001 = seedData2022.pack_contents.filter(p => packs2001.some(pack => pack.pack_id === p.pack_id));
assert.equal(packs2001.length, 12, '2001 adds ten five-packs and two six-packs');
assert.equal(contents2001.length, 62, '2001 pack catalogue includes 62 vehicle entries');
assert.ok(packs2001.every(p => contents2001.filter(c => c.pack_id === p.pack_id).length === (p.pack_type === '6-pack' ? 6 : 5) && p.source_url === 'https://www.wheelwonderland.com/en/5-packs/2001/'), 'Every 2001 pack has the correct vehicle count and source provenance');


const packs2000 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-2000-'));
const contents2000 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-2000-'));
assert.equal(packs2000.length, 13, '2000 adds thirteen complete numbered five-packs');
assert.equal(contents2000.length, 65, '2000 five-pack catalogue includes 65 vehicle entries');
assert.ok(packs2000.every(p => contents2000.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/2000/'), 'Every 2000 five-pack has five contents and source provenance');


const packs1999 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-1999-'));
const contents1999 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-1999-'));
assert.equal(packs1999.length, 12, '1999 adds twelve complete numbered five-packs');
assert.equal(contents1999.length, 60, '1999 five-pack catalogue includes 60 vehicle entries');
assert.ok(packs1999.every(p => contents1999.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/en/5-packs/1999/'), 'Every 1999 five-pack has five contents and source provenance');


const packs1998 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-1998-'));
const contents1998 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-1998-'));
assert.equal(packs1998.length, 11, '1998 adds 11 complete numbered five-packs');
assert.equal(contents1998.length, 55, '1998 five-pack catalogue includes 55 vehicle entries');
assert.ok(packs1998.every(p => contents1998.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1998/'), 'Every 1998 five-pack has five contents and source provenance');


const packs1997 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-1997-'));
const contents1997 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-1997-'));
assert.equal(packs1997.length, 12, '1997 adds 12 complete numbered five-packs');
assert.equal(contents1997.length, 60, '1997 five-pack catalogue includes 60 vehicle entries');
assert.ok(packs1997.every(p => contents1997.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1997/'), 'Every 1997 five-pack has five contents and source provenance');

const packs1996 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-1996-'));
const contents1996 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-1996-'));
assert.equal(packs1996.length, 9, '1996 adds nine complete numbered five-packs');
assert.equal(contents1996.length, 45, '1996 five-pack catalogue includes 45 vehicle entries');
assert.ok(packs1996.every(p => contents1996.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1996/'), 'Every 1996 five-pack has five contents and source provenance');
const superShowCars1996 = seedData2022.packs.find(p => p.pack_id === 'hw-6pack-1996-13502');
assert.ok(superShowCars1996 && superShowCars1996.pack_type === '6-pack' && seedData2022.pack_contents.filter(c => c.pack_id === superShowCars1996.pack_id).length === 6, '1996 Super Show Cars assortment is correctly represented as a six-pack');

const packs1995 = seedData2022.packs.filter(p => p.release_year === 1995 && p.pack_id.startsWith('hw-'));
const contents1995 = seedData2022.pack_contents.filter(c => packs1995.some(p => p.pack_id === c.pack_id));
assert.equal(packs1995.length, 5, '1995 adds three five-packs and two six-packs beyond the existing Ferrari pack');
assert.equal(contents1995.length, 27, '1995 additional multipack catalogue includes 27 vehicle entries');
assert.ok(packs1995.every(p => contents1995.filter(c => c.pack_id === p.pack_id).length === (p.pack_type === '6-pack' ? 6 : 5) && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1995/'), 'Every 1995 multipack has its correct vehicle count and source provenance');

const packs1994 = seedData2022.packs.filter(p => p.release_year === 1994 && p.pack_id.startsWith('hw-'));
const contents1994 = seedData2022.pack_contents.filter(c => packs1994.some(p => p.pack_id === c.pack_id));
assert.equal(packs1994.length, 7, '1994 adds six five-packs and one six-pack beyond existing Ferrari assortments');
assert.equal(contents1994.length, 36, '1994 additional multipack catalogue includes 36 vehicle entries');
assert.ok(packs1994.every(p => contents1994.filter(c => c.pack_id === p.pack_id).length === (p.pack_type === '6-pack' ? 6 : 5) && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1994/'), 'Every 1994 multipack has correct vehicle count and source provenance');

const packs1993 = seedData2022.packs.filter(p => p.pack_id.startsWith('hw-5pack-1993-'));
const contents1993 = seedData2022.pack_contents.filter(p => p.pack_id.startsWith('hw-5pack-1993-'));
assert.equal(packs1993.length, 6, '1993 adds six complete numbered five-packs');
assert.equal(contents1993.length, 30, '1993 five-pack catalogue includes 30 vehicle entries');
assert.ok(packs1993.every(p => contents1993.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1993/'), 'Every 1993 five-pack has five contents and source provenance');

const packs1992 = seedData2022.packs.filter(p => p.release_year === 1992 && p.pack_id.startsWith('hw-'));
const contents1992 = seedData2022.pack_contents.filter(c => packs1992.some(p => p.pack_id === c.pack_id));
assert.equal(packs1992.length, 6, '1992 adds five five-packs and one six-pack');
assert.equal(contents1992.length, 31, '1992 multipack catalogue includes 31 entries');
assert.ok(packs1992.every(p => contents1992.filter(c => c.pack_id === p.pack_id).length === (p.pack_type === '6-pack' ? 6 : 5) && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1992/'), 'Every 1992 pack has correct size and source provenance');
const packs1991 = seedData2022.packs.filter(p => p.release_year === 1991 && p.pack_id.startsWith('hw-'));
const contents1991 = seedData2022.pack_contents.filter(c => packs1991.some(p => p.pack_id === c.pack_id));
assert.equal(packs1991.length, 7, '1991 adds seven complete numbered five-packs');
assert.equal(contents1991.length, 35, '1991 five-pack catalogue includes 35 vehicle entries');
assert.ok(packs1991.every(p => contents1991.filter(c => c.pack_id === p.pack_id).length === 5 && p.source_url === 'https://www.wheelwonderland.com/fr/5-packs/1991/'), 'Every 1991 five-pack has five contents and source provenance');
assert.equal(seedData.pack_contents.length, 2681, 'All seeded multipack content rows must remain accounted for');
const exotics2020 = seedData.pack_contents.filter(item => item.pack_id === 'hw-exotics-5pack-2020');
assert.equal(exotics2020.length, 5, '2020 HW Exotics 5-pack must contain five vehicles');
assert.ok(exotics2020.every(item => item.source_url.includes('community.creations.mattel.com')), '2020 HW Exotics contents must cite the official Mattel source');

for (const [packId, year] of [['hw-exotics-5pack-2017', '2017'], ['hw-exotics-5pack-2019', '2019'], ['hw-exotics-5pack-2021', '2021']]) {
  const contents = seedData.pack_contents.filter(item => item.pack_id === packId);
  assert.equal(contents.length, 5, `HW Exotics ${year} 5-pack must contain exactly five vehicles`);
  assert.ok(contents.every(item => item.source_url.includes('community.creations.mattel.com')), `HW Exotics ${year} contents must cite the official Mattel source`);
}
const exotics2018 = seedData.pack_contents.filter(item => item.pack_id === 'hw-exotics-5pack-2018');
assert.equal(exotics2018.length, 5, '2018 HW Exotics 5-pack must contain exactly five vehicles');
assert.ok(exotics2018.every(item => item.source_url.includes('community.creations.mattel.com')), '2018 HW Exotics contents must cite the official Mattel source');

for (const [packId, year, sourceHost] of [['hw-exotics-5pack-2014', '2014', 'southtexasdiecast.com'], ['hw-exotics-5pack-2015', '2015', 'hwcollectorsnews.com'], ['hw-exotics-5pack-2016', '2016', 'hotwheels.fandom.com']]) {
  const contents = seedData.pack_contents.filter(item => item.pack_id === packId);
  assert.equal(contents.length, 5, `HW Exotics ${year} 5-pack must contain exactly five vehicles`);
  assert.ok(contents.every(item => item.source_url.includes(sourceHost)), `HW Exotics ${year} contents must retain their research source`);
}

for (const [packId, year] of [['hw-exotics-5pack-2007', '2007'], ['hw-exotics-5pack-2011', '2011']]) {
  const contents = seedData.pack_contents.filter(item => item.pack_id === packId);
  assert.equal(contents.length, 5, `HW Exotics ${year} 5-pack must contain exactly five vehicles`);
  assert.ok(contents.every(item => item.source_url.includes('hotwheels.fandom.com')), `HW Exotics ${year} contents must retain the community research source`);
}
const curatedClasses = {
  'Ferrari F50': 'supercar_hypercar',
  'Ferrari F50 Spider': 'supercar_hypercar',
  'Ferrari 156': 'racing',
  '1967 Ferrari 330 P4': 'racing',
  '1969 Ferrari 312 P': 'racing',
  'Ferrari 250 LM': 'racing',
  'Ferrari 250 Testa Rossa': 'racing',
  'Ferrari 330 P4': 'racing',
  'Ferrari Can-Am': 'racing',
  'Ferrari F2004': 'racing',
  'Ferrari P4': 'racing',
  'Ferrari SF-25': 'racing',
  'Ferrari 250': 'sports_or_exotic',
  'Ferrari 208 Turbo': 'sports_or_exotic',
  'Ferrari 328 GTB': 'sports_or_exotic',
  'Ferrari 328 GTS': 'sports_or_exotic',
  'Ferrari 365 GTS/4': 'sports_or_exotic',
  'Ferrari 365 GTS4': 'sports_or_exotic',
  'Ferrari 456M': 'sports_or_exotic',
  'Ferrari 512 M': 'sports_or_exotic',
  'Ferrari F512M': 'sports_or_exotic'
};
for (const [name, expected] of Object.entries(curatedClasses)) {
  const casting = seedData.castings.find(item => item.canonical_name === name);
  assert.ok(casting, `Seed casting ${name} must exist`);
  assert.equal(casting.vehicle_class, expected, `Seed classification for ${name} must remain curated`);
  assert.equal(casting.classification_status, 'curated_seed_review');
}


console.log('Diecast Garage checks passed: HTML, inline JavaScript, PWA paths, RLS markers and catalogue adapter.');
