import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const loadStart=html.indexOf('function load(){');
const loadEnd=html.indexOf('function save(){',loadStart);
const normStart=html.indexOf('function normalizeBackup(raw){');
const normEnd=html.indexOf('function importData(file){',normStart);
assert.ok(loadStart>0&&loadEnd>loadStart&&normStart>0&&normEnd>normStart,'Missing persistent pack wishlist functions');
let storage=JSON.stringify({items:[],packWishlist:['wiki-pack-abc','wiki-pack-abc','custom-pack-test'],packItems:[],customPacks:[]});
const ctx=vm.createContext({
 KEY:'diecast_garage_mvp_02',STARTER_BRANDS:['Ferrari'],
 localStorage:{getItem(){return storage}},
});
vm.runInContext(html.slice(loadStart,loadEnd)+'\n'+html.slice(normStart,normEnd),ctx);
const loaded=ctx.load();
assert.equal(loaded.packWishlist.length,2,'Wishlist IDs must deduplicate');
assert.ok(loaded.packWishlist.includes('custom-pack-test'));
const backup=ctx.normalizeBackup({app:'Diecast Garage',state:{items:[],packWishlist:['pack-1','pack-1','pack-2']}});
assert.equal(backup.packWishlist.length,2,'Backup restore must keep unique multipack wishlist');
storage=JSON.stringify({items:[]});
assert.equal(ctx.load().packWishlist.length,0,'Old backups must remain compatible');
const progressStart=html.indexOf('function dgOwnedCastingSet(){');
const progressEnd=html.indexOf('let packSearch=',progressStart);
assert.ok(progressStart>0&&progressEnd>progressStart,'Pack completion logic missing');
const progressCtx=vm.createContext({
 state:{items:[{status:'owned',releaseId:'f40'},{status:'wishlist',releaseId:'p1'}]},
 dgReleaseById:id=>({f40:{casting_id:'ferrari-f40'},p1:{casting_id:'mclaren-p1'}}[id]),
 packContents:()=>[{casting_id:'ferrari-f40'},{casting_id:'mclaren-p1'},{model_name_as_source:'Unlinked'}]
});
vm.runInContext(html.slice(progressStart,progressEnd),progressCtx);
const progress=progressCtx.dgPackCollectionProgress('example',progressCtx.dgOwnedCastingSet());
assert.equal(progress.owned,1);
assert.equal(progress.linked,2);
assert.equal(progress.total,3);
console.log('PASS: pack wishlist persists, normalizes backup and supports older states');
