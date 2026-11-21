import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('let dgWikiFetchInProgress=false;');
const end=html.indexOf('function dgInitCatalogImport()',start);
assert.ok(start>0&&end>start,'Wiki import lock not found');
const source=html.slice(start,end);
let calls=0,resolveFetch;
const wait=new Promise(resolve=>{resolveFetch=resolve});
const messages=[];
const button={disabled:false,textContent:''};
const ctx=vm.createContext({
 document:{getElementById:()=>button},
 localStorage:{setItem(){}},
 DG_WIKI_CHECK_KEY:'wiki-check',
 fetch:async()=>{calls++;await wait;throw Error('Simulated temporary offline')},
 toast:(s)=>messages.push(s),
 dgUpdateCatalogStatus:()=>{},
 console
});
vm.runInContext(source+'\nthis.fetchWiki=dgFetchWikiV6Catalog',ctx);
const first=ctx.fetchWiki(false);
assert.equal(button.disabled,true,'First import must lock UI');
const second=await ctx.fetchWiki(false);
assert.equal(second,false,'Concurrent import must be refused');
assert.equal(calls,1,'A concurrent import must not issue a second network request');
assert.ok(messages.some(s=>s.includes('już trwa')));
resolveFetch();
await first;
assert.equal(button.disabled,false,'UI must unlock after a failed import');
assert.equal(ctx.dgWikiFetchInProgress,false,'Import lock must clear after errors');
await ctx.fetchWiki(true);
assert.equal(calls,2,'New import must be allowed after prior attempt finishes');
console.log('PASS: Wiki importer prevents concurrent downloads, unlocks after error and permits retry');
