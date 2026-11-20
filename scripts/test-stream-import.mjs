import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';

const html=fs.readFileSync('index.html','utf8');
const a=html.indexOf('async function dgImportWikiReleaseStream(stream){');
const b=html.indexOf('async function dgFetchWikiV6Catalog(',a);
assert.ok(a>0&&b>a,'Streaming Wiki importer missing');
const source=html.slice(a,b);
const encoder=new TextEncoder();
const rows=Array.from({length:10017},(_,i)=>JSON.stringify({id:'r'+i,model_name:'Ferrari F40',product_type:i<3?'trackset':'vehicle'}));
const bytes=encoder.encode(rows.join('\n'));
function streamOf(data){
 return new ReadableStream({start(controller){
   for(let i=0;i<data.length;i+=1137)controller.enqueue(data.subarray(i,i+1137));
   controller.close();
 }});
}
function makeContext(fail=false){
 const saved=[],markerWrites=[];
 const ctx=vm.createContext({
   DG_WIKI_COMPLETE_KEY:'wiki-complete-test',localStorage:{setItem(key,value){markerWrites.push({key,value})}},
   TextDecoder, console, dgCatalogReady:Promise.resolve(), importedCatalog:[],
   state:{brands:['Ferrari']}, dgCachedModels:null,
   dgNormalizeRecord:(r)=>({release_id:'wiki-'+r.id,brand:'Ferrari'}),
   dgStoreCatalog:async batch=>{if(fail===true)throw Error('Simulated quota exceeded');assert.ok(batch.length<=750);saved.push(...batch)},
   dgUpdateCatalogStatus:()=>{},save:()=>fail!=='save',dgRefreshFilters:()=>{}
 });
 vm.runInContext(source+'\nthis.runImport=dgImportWikiReleaseStream;',ctx);
 return {ctx,saved,markerWrites};
}
const good=makeContext();
const result=await good.ctx.runImport(streamOf(bytes),10017);
assert.equal(result.valid,10014);
assert.equal(result.total,10017);
assert.equal(good.saved.length,10014);
assert.equal(good.ctx.importedCatalog.length,10014);
assert.equal(good.markerWrites.length,1,'A successful streamed import must write one completion marker');
assert.equal(JSON.parse(good.markerWrites[0].value).valid,10014);
assert.equal(JSON.parse(good.markerWrites[0].value).expectedRecords,10017);
const incomplete=makeContext();
await assert.rejects(()=>incomplete.ctx.runImport(streamOf(bytes),10018),/Niekompletne archiwum/);
assert.equal(incomplete.markerWrites.length,0,'Source count mismatch must not confirm completeness');
const broken=makeContext(true);
await assert.rejects(()=>broken.ctx.runImport(streamOf(bytes)),/Simulated quota exceeded/);
assert.equal(broken.ctx.importedCatalog.length,0,'Failed writes must not mark the import as fully complete');
assert.equal(broken.markerWrites.length,0,'Failed imports must not write completion markers');
const failedState=makeContext('save');
await assert.rejects(()=>failedState.ctx.runImport(streamOf(bytes)),/Nie udało się zapisać aktualizacji/);
assert.equal(failedState.markerWrites.length,0,'Local state save failure must not mark the catalogue import complete');
console.log('PASS: streamed 10,017 Wiki rows in fixed chunks, excluded tracks, propagated DB failures');
