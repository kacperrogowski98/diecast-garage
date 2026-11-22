// Current-source validation entry point. Keep a single source of truth for tests
// instead of copying HTML implementation details into this legacy entry point.
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tests=[
  'scripts/validate-app.mjs',
  'scripts/test-catalog.mjs',
  'scripts/test-pack-only-import.mjs',
  'scripts/test-pack-wishlist.mjs',
  'scripts/test-stream-import.mjs',
  'scripts/test-wiki-import-lock.mjs',
  'scripts/test-cloud-3d.mjs',
  'scripts/validate-full-catalog.mjs'
];
for(const test of tests){
  assert.ok(fs.existsSync(test),'Missing required regression suite: '+test);
  console.log('Running '+test);
  const result=spawnSync(process.execPath,[test],{stdio:'inherit',timeout:180000,env:process.env});
  if(result.error)throw result.error;
  assert.equal(result.status,0,test+' failed with status '+result.status);
}
console.log('PASS: current Diecast Garage validation and catalogue regression suites');
