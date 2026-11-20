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
console.log('PASS: pack wishlist persists, normalizes backup and supports older states');
