import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.css':'text/css' };
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const target = path.resolve(root,relative);
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(await fs.readFile(target));
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(4174,'127.0.0.1',resolve));
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const errors = [];
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('diecast_garage_supabase_config_v1', JSON.stringify({
      url:'https://mock-project.supabase.co', key:'mock-public-anon-key-for-browser-tests'
    }));
    const cloud = { snapshot:null, garage:[], wishlist:[], calls:[], conflict:false };
    window.__mockCloud = cloud;
    const resultFor = (table) => {
      if (table === 'diecast_garage_data') return {data:cloud.snapshot,error:null};
      if (table === 'user_garage_items') return {data:cloud.garage,error:null};
      if (table === 'user_wishlist_items') return {data:cloud.wishlist,error:null};
      return {data:[],error:null};
    };
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({data:{session:{user:{id:'mock-user-1',email:'collector@example.test'}}},error:null}),
          onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}),
          signOut: async () => ({error:null})
        },
        from: (table) => ({
          select: () => ({
            eq: () => {
              const result = resultFor(table);
              return {
                maybeSingle: async () => result,
                then: (resolve,reject) => Promise.resolve(result).then(resolve,reject)
              };
            }
          }),
          upsert: async (row) => {
            cloud.snapshot = {payload:row.payload,updated_at:row.updated_at};
            return {error:null};
          }
        }),
        rpc: async (name,args) => {
          cloud.calls.push({name,args});
          if (cloud.conflict) return {data:null,error:{code:'40001',message:'SYNC_CONFLICT: cloud collection changed since it was read'}};
          const updated_at = '2026-11-19T11:00:00.000Z';
          cloud.snapshot = {payload:args.p_payload,updated_at};
          cloud.garage = args.p_items.filter(item => item.status === 'owned').map(item => ({client_item_id:item.collectionId,item_data:item}));
          cloud.wishlist = args.p_items.filter(item => item.status === 'wishlist').map(item => ({client_item_id:item.collectionId,item_data:item}));
          return {data:[{updated_at,garage_count:cloud.garage.length,wishlist_count:cloud.wishlist.length}],error:null};
        },
        storage: {
          from: () => ({
            upload: async () => ({error:null}),
            download: async () => ({data:new Blob(['mock-photo'],{type:'image/png'}),error:null})
          })
        }
      })
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route => route.abort());
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.querySelector('#catalogStatus')?.textContent.includes('Pobrano indeks online'),null,{timeout:120000});
  await page.locator('.tab[data-view="catalog"]').click();
  await page.locator('#search').fill('Ferrari');
  await page.waitForFunction(() => document.querySelectorAll('#content .car').length > 0);
  await page.locator('#content .car').first().getByRole('button',{name:/Garaż/}).click();
  await page.locator('#cloudBtn').click();
  await page.waitForFunction(() => document.querySelector('#dgCloudStatus')?.textContent.includes('Zalogowano'));
  await page.locator('#modalRoot').getByRole('button',{name:/Wyślij tę kolekcję do chmury/}).click();
  await page.waitForFunction(() => document.querySelector('#dgCloudStatus')?.textContent.includes('Zsynchronizowano'));
  const firstPush = await page.evaluate(() => window.__mockCloud.calls[0]);
  assert.equal(firstPush.name,'sync_diecast_garage','Client should call the atomic sync RPC');
  assert.equal(firstPush.args.p_expected_updated_at,null,'First push should expect an empty cloud snapshot');
  assert.ok(firstPush.args.p_items.some(item => item.status === 'owned'),'Push should include the locally owned car');

  await page.locator('#modalRoot').getByRole('button',{name:/Pobierz kolekcję z chmury/}).click();
  await page.waitForFunction(() => document.querySelector('#dgCloudStatus')?.textContent.includes('Pobrano 1 modeli'));
  const afterPull = await page.evaluate(() => JSON.parse(localStorage.getItem('diecast_garage_mvp_02')));
  assert.equal(afterPull.items.filter(item => item.status === 'owned').length,1,'Pull should restore normalized garage items');

  await page.evaluate(() => {
    window.__mockCloud.snapshot.updated_at = '2026-11-19T12:00:00.000Z';
    window.__mockCloud.conflict = true;
  });
  await page.locator('#modalRoot').getByRole('button',{name:/Wyślij tę kolekcję do chmury/}).click();
  await page.waitForFunction(() => document.querySelector('#dgCloudStatus')?.textContent.includes('zmieniła się w trakcie zapisu'));
  const afterConflict = await page.evaluate(() => JSON.parse(localStorage.getItem('diecast_garage_mvp_02')));
  assert.equal(afterConflict.items.filter(item => item.status === 'owned').length,1,'A rejected stale write must not erase local collection data');
  assert.equal(await page.evaluate(() => window.__mockCloud.calls.length),2,'Exactly two atomic write attempts should be made');
  assert.deepEqual(errors,[],'Cloud sync browser test should not emit uncaught JavaScript errors');
  console.log('Cloud sync client test passed: atomic push, normalized pull and stale-write conflict handling (mock Supabase).');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
