import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Application script not found');
const names=['DG_BRANDS','DG_BRAND_ALIASES','DG_FANTASY_TERMS','DG_SUPERCAR_TERMS'];
const functions=['dgSafeHttpUrl','dgSlug','dgNormWords','dgInferBrand','dgHasPhrase','dgClassify','dgRarity','dgYear','dgNormalizeRecord','dgExtractRows','dgReadCatalogFile'];
const statements=[];
for(const name of names){const match=script.match(new RegExp('const '+name+'=[^\\n]+'));assert.ok(match,'Missing '+name);statements.push(match[0]);}
for(const name of functions){
 const pos=script.indexOf('function '+name+'(');
 assert.ok(pos>=0,'Missing '+name);
 const begin=script.indexOf('{',pos);let depth=0,end=-1;
 for(let i=begin;i<script.length;i++){if(script[i]==='{')depth++;if(script[i]==='}'&&--depth===0){end=i+1;break}}
 assert.ok(end>begin,'Unclosed '+name);statements.push(script.slice(pos,end));
}
const ctx=vm.createContext({URL,location:{href:'https://example.com/diecast-garage/'}});
vm.runInContext(statements.join('\n'),ctx);
assert.equal(ctx.dgRarity('Super Treasure Hunt'),'sth');
assert.equal(ctx.dgRarity('Treasure Hunt'),'th');
assert.equal(ctx.dgRarity(null),'other');
assert.equal(ctx.dgClassify('Ferrari F40','Ferrari','HW Exotics'),'supercar_hypercar');
assert.equal(ctx.dgClassify('Porsche 911 GT3 RS','Porsche','HW Exotics'),'supercar_hypercar');
const sample=ctx.dgNormalizeRecord({id:'JBB06_1',title:"'15 LAND ROVER DEFENDER DOUBLE CAB",release_year:2025,series_name:'HW Dirt',assortment:'Mainline',oem:'Land Rover',rarity:null,sku:'JBB06'},'diecastdb',0);
assert.equal(sample.release_year,2025);
assert.equal(sample.brand,'Land Rover');
assert.equal(sample.assortment,'mainline');
assert.ok(sample.release_id.includes('diecastdb-'));
const historical=ctx.dgNormalizeRecord({Casting:'Ferrari F40',Year:1995,'Photo / Color':'Red'},'hotwheels-data',1);
assert.equal(historical.brand,'Ferrari');
assert.equal(historical.release_year,1995);
assert.equal(historical.vehicle_class,'supercar_hypercar');
assert.equal(historical.source,'hotwheels-data');
const file={name:'HotApi.json',text:async()=>['{"Casting":"Ferrari F40","Year":1995}','{"Casting":"Porsche 911 GT3 RS","Year":2021}'].join('\\n')};
const jsonl=await ctx.dgReadCatalogFile(file);
assert.equal(jsonl.length,2);
assert.equal(jsonl[0].canonical_name,'Ferrari F40');
assert.equal(jsonl[1].brand,'Porsche');
const scan=ctx.dgExtractRows({fields:['id','title','release_year','assortment'],cars:[['ABC','Ferrari F40',1989,'Mainline'] ]},'scan-index.json');
assert.equal(scan.rows[0].title,'Ferrari F40');
console.log('PASS: catalogue normalization, rarity, supercar recognition, historical-source attribution');
