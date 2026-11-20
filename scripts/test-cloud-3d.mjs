import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf("const DG_MODEL_BUCKET='diecast-models';");
const end=html.indexOf('async function open3D(id){',start);
assert.ok(start>0&&end>start,'3D storage adapter is missing');
const calls=[];
const payload=new Blob([new Uint8Array([0x67,0x6c,0x54,0x46])],{type:'model/gltf-binary'});
const ctx=vm.createContext({
 dgCloudUser:{id:'test-user-uuid'},
 dgRequireUser(){if(!ctx.dgCloudUser)throw new Error('Login required')},
 dgSupabaseClient:{storage:{from(bucket){assert.equal(bucket,'diecast-models');return{
   async upload(path,file,options){calls.push({action:'upload',path,size:file.size,options});return {error:null}},
   async download(path){calls.push({action:'download',path});return {data:payload,error:null}}
 }}}}
});
vm.runInContext(html.slice(start,end)+'\nthis.adapter=dgCloud3DAccess();this.toPath=dgCloud3DPath;',ctx);
assert.equal(ctx.toPath('wiki-v6-ferrari/f40'),'test-user-uuid/glb/wiki-v6-ferrari%2Ff40.glb');
await ctx.adapter.upload('f40',payload);
const restored=await ctx.adapter.download('f40');
assert.equal(restored.size,payload.size);
assert.equal(calls.length,2);
assert.equal(calls[0].path,'test-user-uuid/glb/f40.glb');
assert.equal(calls[0].options.contentType,'model/gltf-binary');
assert.equal(calls[0].options.upsert,true);
ctx.dgCloudUser=null;
assert.equal(ctx.dgCloud3DAccess(),null,'No cloud buttons when logged out');
const sql=fs.readFileSync('supabase/migrations/20261120_private_glb_storage.sql','utf8');
assert.ok(sql.includes("'diecast-models'")&&sql.includes('public=false')&&sql.includes('auth.uid()::text'),'GLB bucket must remain private, per user');
const viewer=fs.readFileSync('viewer3d.js','utf8');
assert.ok(viewer.includes('dg3dCloudUpload')&&viewer.includes('dg3dCloudDownload')&&viewer.includes('cloud.download(releaseId)'),'Viewer cloud actions are missing');
console.log('PASS: private GLB cloud upload/download, auth guard, object paths and RLS policy');
