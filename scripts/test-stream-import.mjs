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
 const saved=[];
 const ctx=vm.createContext({
   TextDecoder, console, dgCatalogReady:Promise.resolve(), importedCatalog:[],
   state:{brands:['Ferrari']}, dgCachedModels:null,
   dgNormalizeRecord:(r)=>({release_id:'wiki-'+r.id,brand:'Ferrari'}),
   dgStoreCatalog:async batch=>{if(fail)throw Error('Simulated quota exceeded');assert.ok(batch.length<=750);saved.push(...batch)},
   dgUpdateCatalogStatus:()=>{},save:()=>true,dgRefreshFilters:()=>{}
 });
 vm.runInContext(source+'\nthis.runImport=dgImportWikiReleaseStream;',ctx);
 return {ctx,saved};
}
const good=makeContext();
const result=await good.ctx.runImport(streamOf(bytes));
assert.equal(result.valid,10014);
assert.equal(result.total,10017);
assert.equal(good.saved.length,10014);
assert.equal(good.ctx.importedCatalog.length,10014);
const broken=makeContext(true);
await assert.rejects(()=>broken.ctx.runImport(streamOf(bytes)),/Simulated quota exceeded/);
assert.equal(broken.ctx.importedCatalog.length,0,'Failed writes must not mark the import as fully complete');
console.log('PASS: streamed 10,017 Wiki rows in fixed chunks, excluded tracks, propagated DB failures');
