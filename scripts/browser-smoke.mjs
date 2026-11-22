import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net|danyjoy\.github\.io)/,r=>r.abort());
try {
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 await page.locator('#addBtn').click();
 await page.locator('#fName').fill('Diecast Smoke Test Ferrari F40');
 await page.locator('#fBrand').fill('Ferrari');
 await page.locator('#fClass').selectOption('supercar_hypercar');
 await page.locator('#fStatus').selectOption('owned');
 await page.locator('#fPrice').fill('24.50');
 await page.locator('#modalRoot .modalfoot .btn.primary').click();
 await page.waitForFunction(()=>document.querySelector('#ownedCount')?.textContent==='1');
 assert.ok((await page.locator('#content').innerText()).includes('Diecast Smoke Test Ferrari F40'));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#ownedCount')?.textContent==='1');
 assert.ok((await page.locator('#content').innerText()).includes('Diecast Smoke Test Ferrari F40'),'Owned car must survive reload and cached release lookup');
 await page.locator('#cloudBtn').click();
 await page.locator('#modalRoot button:has-text("Sprawdź pamięć urządzenia")').click();
 await page.waitForFunction(()=>!document.querySelector('#dgStorageStatus')?.textContent?.includes('Dane lokalne i pliki 3D nie są automatycznie chronione'));
 assert.ok((await page.locator('#dgStorageStatus').innerText()).includes('Backup JSON')|| (await page.locator('#dgStorageStatus').innerText()).includes('backup kolekcji'));
 assert.equal(await page.locator('#modalRoot [data-cloud-auth]').count(),4,'Two collection and two 3D sync actions are required');
 assert.equal(await page.locator('#modalRoot [data-cloud-auth]:disabled').count(),4,'Cloud actions must be disabled when logged out');
 await page.locator('#modalRoot .modalhead button').click();
 await page.locator('[data-view="brands"]').click();
 assert.ok((await page.locator('#content').innerText()).includes('unikalnych modeli w garażu'),'Brand view must report unique casting-family completion');
 await page.locator('[data-view="catalog"]').click();
 assert.equal(await page.locator('#ownershipFilter').count(),1);
 await page.locator('#ownershipFilter').selectOption("owned");
 assert.ok((await page.locator('#resultCount').innerText()).includes("1 wydań"),"Only owned variant must remain visible");
 await page.locator('#ownershipFilter').selectOption("all");
 assert.equal(await page.locator('#rarityFilter').count(),1);
 assert.equal(await page.locator('#sourceFilter').count(),1);
 assert.equal(await page.locator('#photoFilter').count(),1);
 await page.locator('#photoFilter').selectOption('with');
 await page.locator('#photoFilter').selectOption('without');
 await page.locator('#photoFilter').selectOption('all');
 await page.locator('#search').fill('Ferrari F40');
 await page.locator('#brandFilter').selectOption('Ferrari');
 await page.locator('[data-view="garage"]').click();
 assert.equal(await page.locator('#ownedCount').innerText(),'1');
 const stores=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
     const request=indexedDB.open('diecast_garage_catalog_v1',3);
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
   });
   const names=Array.from(db.objectStoreNames);db.close();return names;
 });
 assert.ok(stores.includes('releases')&&stores.includes('wiki_packs')&&stores.includes('meshes3d'),'IndexedDB migration must keep all three stores');
 const meshStored=await page.evaluate(async()=>{
   const request=indexedDB.open('diecast_garage_catalog_v1',3);
   const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
   const transact=(mode,handler)=>new Promise((resolve,reject)=>{
     const tx=db.transaction('meshes3d',mode);
     let result=null;handler(tx.objectStore('meshes3d'),value=>{result=value});
     tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);
   });
   const file=new Blob([new Uint8Array([1,2,3,4])],{type:'model/gltf-binary'});
   await transact('readwrite',(store)=>store.put({release_id:'smoke-test-model',file}));
   const saved=await transact('readonly',(store,done)=>{const req=store.get('smoke-test-model');req.onsuccess=()=>done(req.result)});
   await transact('readwrite',(store)=>store.delete('smoke-test-model'));
   db.close();
   return saved?.file?.size===4;
 });
 assert.ok(meshStored,'3D GLB file must persist as a Blob in IndexedDB');

  await page.locator('#showroomBtn').click();
 await page.waitForFunction(()=>Boolean(document.querySelector('#dg3dStage canvas')||document.querySelector('#modalRoot')?.textContent?.includes('Garaż 3D niedostępny')));
 if(await page.locator('#dg3dStage canvas').count()){
   assert.equal(await page.locator('#dg3dNext').count(),1);
   assert.equal(await page.locator('#dg3dPrev').count(),1);
   assert.ok((await page.locator('#dg3dPageLabel').innerText()).includes('1 / 1'));
   await page.locator('#dg3dClose').click();
   assert.equal(await page.locator('#dg3dStage').count(),0);
   console.log('PASS: 3D showroom rendered with owned models and closed cleanly');
 }else{
   console.warn('WARNING: WebGL unavailable in headless CI; verified 3D fallback screen');
   await page.locator('#modalRoot button:has-text("Zamknij")').click();
 }
 await page.locator('#search').fill('');
 await page.locator('[data-view="packs"]').click();
 await page.locator('button:has-text("2015 ·")').first().click();
 assert.equal(await page.locator('[aria-label="Rok multipacka"]').inputValue(),'2015','Coverage button should select requested year');
 await page.locator('[aria-label="Rok multipacka"]').selectOption('all');
 await page.locator('#packSearchField').fill('');
 await page.locator('[aria-label="Typ zestawu"]').selectOption('5pack');
 assert.ok(await page.locator('#packList .car').count()>0,'5-pack filter must list real packages');
 await page.locator('[aria-label="Źródło zestawu"]').selectOption('starter');
 assert.ok(await page.locator('#packList .car').count()>0,'Starter pack source must be selectable');
 await page.locator('#packList button:has-text("Chcę ten zestaw")').first().click();
 await page.locator('[aria-label="Status multipacka"]').selectOption('wishlist');
 assert.equal(await page.locator('#packList .car').count(),1,'Only wished pack must remain in pack wishlist filter');
 await page.locator('[data-view="wishlist"]').click();
 assert.ok((await page.locator('#content').innerText()).includes('Poszukiwane 5-paki i multipacki'),'Multipacks should be visible on shared Wishlist screen');
 assert.ok(await page.locator('#content button:has-text("Mam ten zestaw")').count()>0);
 await page.locator('[data-view="packs"]').click();
 await page.locator('[aria-label="Status multipacka"]').selectOption('all');
 await page.locator('#packList .btn:has-text("Zawartość")').first().click();
 assert.ok(await page.locator('#modalRoot .modal').count(),'Multipack details should open');
 const pack3d=page.locator('#modalRoot button:has-text("Podgląd zestawu 3D")');
 assert.equal(await pack3d.count(),1,'Pack details must expose 3D preview');
 const packRows=await page.locator('#modalRoot .modal').innerText();
 if(!packRows.includes('Brak udokumentowanej zawartości')){
   await pack3d.click();
   await page.waitForFunction(()=>Boolean(document.querySelector('#dg3dStage canvas')||document.querySelector('#modalRoot')?.textContent?.includes('Podgląd zestawu niedostępny')));
   if(await page.locator('#dg3dStage canvas').count()){
     assert.ok((await page.locator('#dg3dNotice').innerText()).includes('Poglądowa wizualizacja'));
     await page.locator('#dg3dClose').click();
     console.log('PASS: multipack 3D visualization renders and closes');
   }else{
     console.warn('WARNING: WebGL unavailable for multipack preview in CI');
     await page.locator('#modalRoot button:has-text("Zamknij")').click();
   }
 }
 await page.locator('#packList .btn:has-text("Zawartość")').first().click();
 await page.locator('#modalRoot .modalfoot button:has-text("Dodaj do kolekcji")').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).packWishlist.length),0,'Acquired pack must leave wishlist');
 await page.locator('[aria-label="Status multipacka"]').selectOption("owned");
 assert.equal(await page.locator("#packList .car").count(),1,"Only one pack was added to the test collection");
 await page.locator('#packList .btn:has-text("Zawartość")').first().click();
 await page.locator('#modalRoot button:has-text("Edytuj egzemplarz")').first().click();
 assert.equal(await page.locator('#piFrontPreview').count(),1);
 assert.equal(await page.locator('#piBackPreview').count(),1);
 const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLZAAAAAElFTkSuQmCC','base64');
 await page.locator('#piFrontPreview').locator('..').locator('input[type="file"]').setInputFiles({name:'front.png',mimeType:'image/png',buffer:pixel});
 await page.waitForFunction(()=>Boolean(document.querySelector('#piFrontPreview img')));
 await page.locator('#modalRoot button:has-text("Zapisz")').click();
 assert.equal(await page.locator('#modalRoot img[alt="Przód opakowania"]').count(),1);
 console.log('PASS: add multipack, compress and persist front packaging photo');
 await page.locator('#modalRoot .modalhead button').click();
 await page.locator('[aria-label="Status multipacka"]').selectOption('all');
 await page.locator('[aria-label="Źródło zestawu"]').selectOption('all');
 await page.locator('button:has-text("Dodaj własny multipack")').click();
 await page.locator('#customPackName').fill('Test Collector 5-Pack');
 await page.locator('#customPackYear').fill('2025');
 await page.locator('#customPackContents').fill('Ferrari F40\nMcLaren P1');
 await page.locator('#piFrontPreview').locator('..').locator('input[type="file"]').setInputFiles({name:'front.png',mimeType:'image/png',buffer:pixel});
 await page.waitForFunction(()=>Boolean(document.querySelector('#piFrontPreview img')));
 await page.locator('#modalRoot .modalfoot .btn.primary').click();
 const customPhoto=await page.evaluate(()=>{
  const custom=JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).customPacks;
  return custom.find(p=>p.pack_name==='Test Collector 5-Pack')?.frontPhoto||'';
 });
 assert.ok(customPhoto.startsWith('data:image/jpeg;base64,'),'Custom pack image must persist in collection state');
 assert.ok((await page.locator('#packList').innerText()).includes('Test Collector 5-Pack'));
 console.log('PASS: custom 5-pack entry with collector-supplied front photograph');

  assert.ok((await page.locator('#dgConnectionStatus').innerText()).includes('Online'),'Connection badge should initialize online');
  await page.context().setOffline(true);
  await page.waitForFunction(()=>document.querySelector('#dgConnectionStatus')?.textContent?.includes('Offline'));
  await page.context().setOffline(false);
  await page.waitForFunction(()=>document.querySelector('#dgConnectionStatus')?.textContent?.includes('Online'));
  await page.locator('#addBtn').click();
  await page.locator('#fName').fill('Wishlist Test McLaren P1');
  await page.locator('#fBrand').fill('McLaren');
  await page.locator('#fStatus').selectOption('wishlist');
  await page.locator('#fPriority').selectOption('5');
  await page.locator('#fTargetPrice').fill('39.99');
  await page.locator('#modalRoot .modalfoot .btn.primary').click();
  await page.locator('[data-view="wishlist"]').click();
  assert.ok((await page.locator('#content').innerText()).includes('Priorytet: 5/5'),'Wishlist must display selected priority');
  assert.ok((await page.locator('#content').innerText()).includes('39.99 zł'),'Wishlist must display target price');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-view="wishlist"]').click();
  assert.ok((await page.locator('#content').innerText()).includes('Priorytet: 5/5'),'Wishlist priority must survive reload');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).items.find(i=>i.modelSnapshot?.canonical_name==='Wishlist Test McLaren P1')?.targetPrice),'39.99');
  console.log('PASS: wishlist priority and target price persisted and rendered');
  // Recovery must restore a previous collection without requiring a cloud account.
  await page.evaluate(()=>dgWriteRecoverySnapshot());
  const previousCount=Number(await page.locator('#ownedCount').innerText());
  await page.locator('#addBtn').click();
  await page.locator('#fName').fill('Recovery Test Porsche Carrera GT');
  await page.locator('#fBrand').fill('Porsche');
  await page.locator('#fStatus').selectOption('owned');
  await page.locator('#modalRoot .modalfoot .btn.primary').click();
  assert.equal(Number(await page.locator('#ownedCount').innerText()),previousCount+1);
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>dgRestoreRecoverySnapshot());
  await page.waitForFunction(expected=>Number(document.querySelector('#ownedCount')?.textContent)===expected,previousCount);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('diecast_garage_mvp_02')).items.some(i=>i.modelSnapshot?.canonical_name==='Recovery Test Porsche Carrera GT')),false,'Recovery must undo local changes made after the snapshot');
  console.log('PASS: durable IndexedDB recovery restores earlier garage state');

  assert.ok(!errors.length,'Page JavaScript errors: '+errors.join(' | '));
 console.log('PASS browser smoke: mobile viewport, create/save, garage persistence, catalogue filters, 3D showroom fallback');
} catch(error) {
 console.error('BROWSER SMOKE FAILURE:',error?.stack||error);
 try{
   const fs=await import('node:fs/promises');
   await fs.mkdir('test-results',{recursive:true});
   await page.screenshot({path:'test-results/mobile-smoke-failure.png',fullPage:true,timeout:10000});
   await fs.writeFile('test-results/mobile-smoke-error.txt',String(error?.stack||error)+'\nPage errors: '+errors.join(' | '));
   console.error('Saved failure screenshot and error report to test-results/');
 }catch(captureError){console.error('Failed to save diagnostic screenshot:',captureError)}
 throw error;
} finally {await browser.close();}
