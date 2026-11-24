import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net|danyjoy\.github\.io)/,r=>r.abort());
try {
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#sortFilter').inputValue(),'photos','Catalog should show photograph-bearing models first by default');
 assert.equal(await page.locator('#photoFilter option[value="local"]').count(),1,'User should be able to browse only releases with bundled images');

 const photoPipeline=await page.evaluate(()=>{
   const raw={id:'DB10-CHECK',title:'Aston Martin DB10',release_year:2025,image_url:'https://example.com/aston-db10.jpg'};
   const normalized=dgNormalizeRecord(raw,'hotwheels-wiki-v6',0);
   const fandom='https://static.wikia.nocookie.net/hotwheels/images/a/aa/aston.jpg/revision/latest?cb=100';
   const candidates=dgSourcePhotoCandidates(fandom);
   const shared={release_id:'a',image_url:fandom,images:[]},alternate={release_id:'b',image_url:'https://example.com/aston-alt.jpg'};
   dgHeroUsedImages=new Set();
   const first=dgImageCandidates(shared,[shared,alternate]);
   dgHeroUsedImages.add(first[0]);
   const next=dgImageCandidates(alternate,[shared,alternate]);
   return {normalizedPhoto:normalized.image_url,candidates,first,next};
 });
 assert.equal(photoPipeline.normalizedPhoto,'https://example.com/aston-db10.jpg','Source image_url must survive Wiki normalization');
 assert.equal(photoPipeline.candidates[0],'https://static.wikia.nocookie.net/hotwheels/images/a/aa/aston.jpg','Fandom photo should try its canonical original file first');
 assert.equal(photoPipeline.candidates.length,2,'Original Fandom image should retain revision URL as a secondary option');
 assert.ok(photoPipeline.next[0].includes('aston-alt'),'Another edition must prefer its own photo over shared casting fallback');
 const localPhotos=await page.evaluate(()=>{
  const oldManifest=dgLocalPhotoManifest, oldUsed=dgHeroUsedImages;
  try{
   dgLocalPhotoManifest={'wiki-v6-ferrari': './car-photos/wiki-v6-ferrari.webp', 'wiki-v6-lambo':'./car-photos/wiki-v6-lambo.webp'};
   dgHeroUsedImages=new Set();
   const a={release_id:'wiki-v6-ferrari',image_url:'https://static.wikia.nocookie.net/hotwheels/images/a/aa/ferrari.jpg'};
   const b={release_id:'wiki-v6-lambo',image_url:'https://static.wikia.nocookie.net/hotwheels/images/a/aa/lambo.jpg'};
   const own=dgImageCandidates(a,[a]);
   const related=dgImageCandidates({release_id:'wiki-v6-missing',image_url:''},[a]);
   const unrelated=dgImageCandidates({release_id:'wiki-v6-missing',image_url:''},[b]);
   return {own:own[0],related:related[0],unrelated:unrelated[0]};
  }finally{dgLocalPhotoManifest=oldManifest;dgHeroUsedImages=oldUsed}
 });
 assert.ok(localPhotos.own.endsWith('/car-photos/wiki-v6-ferrari.webp'),'Verified local photo should outrank remote CDN');
 assert.ok(localPhotos.related.endsWith('/car-photos/wiki-v6-ferrari.webp'),'Only same-casting variants may supply fallback');
 assert.ok(localPhotos.unrelated.endsWith('/car-photos/wiki-v6-lambo.webp'),'Other casting must not inherit Ferrari image');
 const studioPriority=await page.evaluate(()=>{
  const previousStudio=dgShowroomPhotoManifest;
  const previousLocal=dgLocalPhotoManifest;
  const previousUsed=dgHeroUsedImages;
  try{
    dgShowroomPhotoManifest={'wiki-v6-lambo':'./showroom-photos/wiki-v6-lambo.webp'};
    dgLocalPhotoManifest={'wiki-v6-lambo':'./car-photos/wiki-v6-lambo.webp'};
    dgHeroUsedImages=new Set();
    const car={release_id:'wiki-v6-lambo',image_url:'https://static.wikia.nocookie.net/hotwheels/images/1/10/lambo.jpg'};
    return {first:dgImageCandidates(car,[car])[0],second:dgImageCandidates(car,[car])[1]};
  }finally{dgShowroomPhotoManifest=previousStudio;dgLocalPhotoManifest=previousLocal;dgHeroUsedImages=previousUsed}
 });
 assert.ok(studioPriority.first.endsWith('/showroom-photos/wiki-v6-lambo.webp'),'Standardized dark studio photos must outrank raw source images');
 assert.ok(studioPriority.second.endsWith('/car-photos/wiki-v6-lambo.webp'),'Unaltered source photo must remain available');


 const photoIdentity=await page.evaluate(()=>{
  const url1='https://static.wikia.nocookie.net/hotwheels/images/a/aa/f1.jpg/revision/latest?cb=123';
  const url2='https://static.wikia.nocookie.net/hotwheels/images/a/aa/f1.jpg';
  const sigsEqual=dgPhotoSignature(url1)===dgPhotoSignature(url2);
  const queryDistinct=dgPhotoSignature('https://img.example.com/image?id=1')!==dgPhotoSignature('https://img.example.com/image?id=2');
  const old=view;
  view='garage';
  const local='data:image/png;base64,AAAA';
  const item={collectionId:'photo-check',releaseId:'photo-check',id:'photo-check',status:'owned',photo:local};
  state.items.push(item);
  let markup='';
  try{markup=card({key:'photo-check',variants:[{release_id:'photo-check',canonical_name:'Porsche 918 Spyder',brand:'Porsche',release_year:2015}]})}
  finally{state.items.pop();view=old;}
  return {sigsEqual,queryDistinct,usesCollectorPhoto:markup.includes(local)};
 });
 assert.ok(photoIdentity.sigsEqual,'Fandom revision addresses must count as the same image');
 assert.ok(photoIdentity.queryDistinct,'Distinct query-based image services must not be deduplicated together');
 assert.ok(photoIdentity.usesCollectorPhoto,'Owned model cards should prefer collector-uploaded images');
 const variantLabels=await page.evaluate(()=>{
  const model={release_id:'wiki-v6-variant-a',canonical_name:'Ferrari F40',brand:'Ferrari',image_url:'https://img.example.com/f40-red.jpg'};
  const other={release_id:'wiki-v6-variant-b',canonical_name:'Ferrari F40',brand:'Ferrari',image_url:'https://img.example.com/f40-yellow.jpg'};
  dgHeroUsedImages=new Set();
  const markup=card({key:'f40-variants',variants:[model,other]});
  const el=document.createElement('div');el.innerHTML=markup;
  const img=el.querySelector('img[data-dg-candidates]');
  return {owners:JSON.parse(img.dataset.dgOwnedSignatures),candidates:JSON.parse(img.dataset.dgCandidates)};
 });
 assert.ok(variantLabels.owners.includes('https://img.example.com/f40-red.jpg'),'Selected release image must be identified as its own');
 assert.ok(!variantLabels.owners.includes('https://img.example.com/f40-yellow.jpg'),'Other color variants must not masquerade as the selected release');
 assert.ok(variantLabels.candidates.includes('https://img.example.com/f40-yellow.jpg'),'Variant may still serve as disclosed fallback');


 console.log('PASS: real photo URL import, Fandom fallback and per-variant image prioritization');
 const imageVisualRules=await page.evaluate(()=>{
   const sheet=Array.from(document.styleSheets).filter(s=>{try{return Array.from(s.cssRules).some(r=>r.cssText?.includes('dg-image-uncut'))}catch{return false}}).flatMap(s=>{try{return Array.from(s.cssRules).map(r=>r.cssText)}catch{return []}}).join('\n');
   return {noMultiply:!sheet.includes('mix-blend-mode: multiply'),hasPhotoHero:sheet.includes('img.dg-image-ready')};
 });
 assert.ok(imageVisualRules.noMultiply,'Source photographs must not be darkened by multiply blending');
 assert.ok(imageVisualRules.hasPhotoHero,'Source photos need a fully visible showroom state');
 console.log('PASS: showroom does not darken source photographs');


 const visual=await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=120;c.height=80;
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,120,80);
  ctx.fillStyle='#f04444';ctx.fillRect(24,27,72,28);
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=c.toDataURL('image/png')});
  dgPolishCarImage(img);
  const cutout=img.dataset.dgCutout==='1';
  const portraitCanvas=document.createElement('canvas');portraitCanvas.width=70;portraitCanvas.height=140;
  portraitCanvas.getContext('2d').fillRect(10,10,50,120);
  const portrait=new Image();
  await new Promise((resolve,reject)=>{portrait.onload=resolve;portrait.onerror=reject;portrait.src=portraitCanvas.toDataURL('image/png')});
  const stage=document.createElement('div');stage.className='carart';stage.innerHTML='<span class="dg-photo-label">Zdjęcie źródłowe</span>';stage.append(portrait);document.body.append(stage);
  portrait.dataset.dgCandidates='[]';
  dgPolishCarImage(portrait);
  const result={cutout,portraitReplaced:Boolean(stage.querySelector('.dg-image-placeholder')),label:stage.querySelector('.dg-photo-label')?.textContent||''};stage.remove();return result;
 });
 assert.equal(visual.cutout,true,'Studio image should remove connected white photo background');
 assert.equal(visual.portraitReplaced,true,'Tall blister-card photo must not be shown as a loose car');
 assert.ok(visual.label.includes('Brak poprawnego zdjęcia'),'Tall source photo must be replaced after all valid car-photo candidates fail');
 console.log('PASS: dark showroom image cutout and packaging-source safeguards');
 // Even a rejected image URL must never display a giant browser broken-image icon.
 const broken=await page.evaluate(async()=>{
   const host=document.createElement('div');host.className='carart';
   host.innerHTML=dgCarPlaceholder()+'<span class="dg-photo-label">Zdjęcie źródłowe</span>';
   const img=document.createElement('img');img.alt='Broken test';img.setAttribute('crossorigin','anonymous');
   img.dataset.dgOriginal='http://127.0.0.1:8000/not-a-real-car-image-404.png';
   img.onerror=()=>dgCarImageFallback(img);img.onload=()=>dgPolishCarImage(img);
   host.append(img);document.body.append(host);img.src=img.dataset.dgOriginal;
   await new Promise(resolve=>setTimeout(resolve,500));
   const valid=host.querySelectorAll('img').length===0&&host.querySelectorAll('.dg-image-placeholder').length===1&&host.querySelector('.dg-photo-label')?.textContent==='Brak poprawnego zdjęcia';
   host.remove();return valid;
 });
 assert.ok(broken,'Failed car photos must use exactly one silhouette and never display broken image glyph');
 console.log('PASS: failed image URLs fallback to showroom silhouette without browser error icons');

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
 await page.waitForFunction(()=>Boolean(document.querySelector('#dg3dClose')||document.querySelector('#modalRoot')?.textContent?.includes('Garaż 3D niedostępny')));
 if(await page.locator('#dg3dClose').count()){
   assert.ok((await page.locator('#modalRoot').innerText()).includes('Nie pokazujemy już sztucznych samochodów'),'Garage must disclose absent real meshes');
   assert.equal(await page.locator('#dg3dStage canvas').count(),0,'Garage must never render fake 3D car meshes');
   await page.locator('#dg3dClose').click();
   console.log('PASS: collection inventory has no fake 3D models');
 }else{
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
   await page.waitForFunction(()=>Boolean(document.querySelector('#dg3dClose')||document.querySelector('#modalRoot')?.textContent?.includes('Podgląd zestawu niedostępny')));
   if(await page.locator('#dg3dClose').count()){
     assert.equal(await page.locator('#dg3dStage canvas').count(),0,'Multipack must never display generic Minecraft-style 3D');
     assert.ok((await page.locator('#modalRoot').innerText()).includes('Nie pokazujemy już sztucznych samochodów'));
     await page.locator('#dg3dClose').click();
     console.log('PASS: multipack shows honest vehicle inventory instead of fake 3D');
   }else{
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
