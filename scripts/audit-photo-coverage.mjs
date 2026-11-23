import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';

const path='catalog/wiki-v6.jsonl.gz';
if(!fs.existsSync(path))throw new Error('Wiki archive absent: '+path);
const rows=readline.createInterface({input:fs.createReadStream(path).pipe(zlib.createGunzip()),crlfDelay:Infinity});
const counts={total:0,vehicles:0,withImageUrl:0,withPhotoUrl:0,withImages:0,withAnyPhoto:0};
const byYear=new Map();
const byBrand=new Map();
const examples=[];
for await(const line of rows){
 if(!line.trim())continue;
 let r;try{r=JSON.parse(line)}catch{continue}
 counts.total++;
 if(r.product_type&&!['vehicle','monster_truck'].includes(r.product_type))continue;
 counts.vehicles++;
 const imageUrls=[r.image_url,r.photo_url,r.image,r.thumbnail,r.thumb_url,r.picture,...(Array.isArray(r.images)?r.images.map(x=>typeof x==='string'?x:x?.url||x?.src||x?.image_url):[])];
 const hasImage=imageUrls.some(v=>typeof v==='string'&&/^https?:\/\//i.test(v));
 if(r.image_url)counts.withImageUrl++;
 if(r.photo_url)counts.withPhotoUrl++;
 if(Array.isArray(r.images)&&r.images.length)counts.withImages++;
 if(hasImage)counts.withAnyPhoto++;
 const year=String(r.release_year||r.year||'unknown');
 const item=byYear.get(year)||{total:0,photos:0};item.total++;if(hasImage)item.photos++;byYear.set(year,item);
 if(examples.length<7&&hasImage)examples.push({model:r.title||r.model_name||r.casting||r.name||'?',url:imageUrls.find(v=>typeof v==='string'&&/^https?:\/\//i.test(v))?.slice(0,100)});
}
console.log('PHOTO COVERAGE AUDIT (source links, not proof of reachable or correct photographs)');
console.log(JSON.stringify({counts,percentage:counts.vehicles?Number((100*counts.withAnyPhoto/counts.vehicles).toFixed(1)):0,recentYears:[...byYear.entries()].filter(([year])=>Number(year)>=2022).sort((a,b)=>Number(a[0])-Number(b[0])).map(([year,v])=>({year,...v})),examples},null,2));
