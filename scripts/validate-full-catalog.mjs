import fs from 'node:fs';
import { createGunzip } from 'node:zlib';
import readline from 'node:readline';
import assert from 'node:assert/strict';

const releasePath='catalog/wiki-v6.jsonl.gz';
const packPath='catalog/wiki-packs.jsonl.gz';
const statsPath='catalog/wiki-stats.json';
if(!fs.existsSync(releasePath)||!fs.existsSync(packPath)||!fs.existsSync(statsPath)){
  console.warn('SKIP: full Wiki v6 archive not committed yet');
  process.exit(0);
}
const stats=JSON.parse(fs.readFileSync(statsPath,'utf8'));
async function validateCompressed(path,kind){
  const stream=readline.createInterface({
    input:fs.createReadStream(path).pipe(createGunzip()),
    crlfDelay:Infinity
  });
  let rows=0,missing=0,duplicateIds=0,totalMembers=0;
  const ids=new Set();
  for await(const line of stream){
    if(!line.trim())continue;
    rows++;
    const record=JSON.parse(line);
    if(kind==='release'){
      if(!record.id||!record.model_name)missing++;
      if(ids.has(record.id))duplicateIds++;
      ids.add(record.id);
    } else {
      if(record.type!=='pack'||!record.title||!Array.isArray(record.members))missing++;
      totalMembers+=record.members?.length||0;
    }
  }
  return {rows,missing,duplicateIds,totalMembers};
}
const releases=await validateCompressed(releasePath,'release');
const packs=await validateCompressed(packPath,'pack');
assert.equal(releases.rows,stats.releases,'Wiki release archive disagrees with build statistics');
assert.equal(packs.rows,stats.packs,'Wiki packs archive disagrees with build statistics');
assert.ok(releases.rows>=10000,'Wiki archive unexpectedly small');
assert.ok(packs.rows>=100,'Wiki packs unexpectedly small');
assert.equal(releases.missing,0,'Malformed release fields');
assert.equal(packs.missing,0,'Malformed pack fields');
assert.equal(releases.duplicateIds,0,'Duplicate Wiki v6 release IDs');
console.log('PASS Wiki v6 archive integrity:',JSON.stringify({releases:releases.rows,packs:packs.rows,memberRows:packs.totalMembers,generatedAt:stats.generated_at}));
