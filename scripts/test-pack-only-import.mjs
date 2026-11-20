import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('async function dgFetchWikiPacksOnly(');
const end=html.indexOf('async function dgFetchWikiV6Catalog(',start);
assert.ok(start>0&&end>start,'Separate multipack importer missing');
const source=html.slice(start,end);
const packs=Array.from({length:120},(_,i)=>JSON.stringify({title:'Pack '+i,type:'pack',members:[{model_name:'Ferrari F40'}]})).join('\n');
let requested=[],written=0,rendered=0,wikiPacks=[];
const context=vm.createContext({
 localStorage:{setItem(){ }},
 DG_PACK_CHECK_KEY:'pack-last-check',
 DecompressionStream:class {},
 Response:class{constructor(stream){this.stream=stream}async text(){return packs}},
 fetch:async url=>{requested.push(url);return {ok:true,body:{}}},
 dgNormalizeWikiPack:r=>({pack_id:r.title,pack_name:r.title,contents:r.members}),
 dgStoreWikiPacks:async arr=>{written=arr.length},
 wikiPacks,
 render:()=>rendered++,
 toast:()=>{},
 console
});
vm.runInContext(source+'\nthis.loadPacks=dgFetchWikiPacksOnly;',context);
assert.equal(await context.loadPacks(true),true);
assert.deepEqual(requested,['./catalog/wiki-packs.jsonl.gz']);
assert.equal(written,120);
assert.equal(context.wikiPacks.length,120);
assert.equal(rendered,1);
context.fetch=async url=>({ok:false,status:404});
assert.equal(await context.loadPacks(true),false,'Unavailable pack-only archive should not corrupt existing packs');
assert.equal(context.wikiPacks.length,120);
console.log('PASS: pack-only Wiki import succeeds without downloading 57k vehicle releases and retains data on failure');
