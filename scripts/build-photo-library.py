#!/usr/bin/env python3
"""Build a small, verified loose-car photo cache for the static app.

Only links already present in the community Wiki archive are used. Never infer
photos from vehicle names or use photos of unrelated releases.
The cache is best-effort; missing/blocked source files are not synthesized.
"""
from __future__ import annotations
import concurrent.futures
import gzip
import io
import json
import os
import re
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image, ImageOps

SRC=Path("catalog/wiki-v6.jsonl.gz")
OUT=Path("_site/car-photos")
MANIFEST=Path("_site/catalog/local-car-photos.json")
MAX_PHOTOS=110
MAX_BYTES=7*1024*1024
BRANDS=("ferrari","lamborghini","mclaren","porsche","bugatti","pagani",
        "koenigsegg","aston martin","rimac","maserati","lotus","mercedes-amg")
SKIP=re.compile(r"blister|carded|cardback|packaging|package[-_ ]front|on[-_ ]card|logo|catalogue|scan",re.I)
def slug(x):
    import unicodedata
    x=unicodedata.normalize("NFD",str(x).lower())
    x="".join(c for c in x if unicodedata.category(c)!="Mn")
    return re.sub(r"[^a-z0-9]+","-",x).strip("-")[:90] or "unknown"

def sources(raw):
    vals=[raw.get("photo_url"),raw.get("image_url"),raw.get("image")]
    if isinstance(raw.get("images"),list):
        vals.extend(v if isinstance(v,str) else (v.get("url") or v.get("src")) for v in raw["images"] if isinstance(v,(str,dict)))
    result=[]
    for val in vals:
        if not isinstance(val,str) or not val.startswith("https://") or SKIP.search(val):
            continue
        if val.startswith("https://static.wikia.nocookie.net/"):
            result.extend([re.sub(r"/revision/latest.*$","",val),val])
        else: result.append(val)
    return list(dict.fromkeys(result))

def process(entry):
    key, urls=entry
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"DiecastGarage-CommunityImageCache/1.0 (non-commercial personal project)","Accept":"image/avif,image/webp,image/png,image/jpeg,*/*"})
            with urllib.request.urlopen(req, timeout=9) as response:
                data=response.read(MAX_BYTES+1)
            if len(data)>MAX_BYTES or len(data)<900: continue
            img=Image.open(io.BytesIO(data))
            img.load()
            if img.width<130 or img.height<70 or img.height>img.width*1.35:
                continue
            img=ImageOps.exif_transpose(img)
            img.thumbnail((740,550),Image.Resampling.LANCZOS)
            # Avoid repainting white vehicles: only transparent originals can
            # be placed seamlessly on dark. Leave any opaque originals intact.
            if img.mode in ("RGBA","LA"):
                img=img.convert("RGBA")
            else: img=img.convert("RGB")
            OUT.mkdir(parents=True,exist_ok=True)
            path=OUT/(key+".webp")
            img.save(path,"WEBP",quality=84,method=5)
            if path.stat().st_size<800: path.unlink(missing_ok=True);continue
            return key, "./car-photos/"+key+".webp"
        except (OSError,ValueError,urllib.error.URLError,TimeoutError):
            continue
    return key,None

def main():
    if not SRC.exists(): raise SystemExit("Missing source catalog")
    rows=[]
    with gzip.open(SRC,"rt",encoding="utf-8") as src:
        for line in src:
            try: r=json.loads(line)
            except (ValueError,TypeError):continue
            if r.get("product_type") not in (None,"vehicle","monster_truck"):continue
            name=str(r.get("title") or r.get("model_name") or r.get("casting") or "")
            year=int(r.get("release_year") or r.get("year") or 0) if str(r.get("release_year") or r.get("year") or 0).isdigit() else 0
            candidates=sources(r)
            if not candidates or not r.get("id"):continue
            key="wiki-v6-"+slug(r["id"])
            priority=(3 if any(b in name.lower() for b in BRANDS) else 0)+(2 if year>=2020 else 0)+(1 if year>=2024 else 0)
            rows.append((priority,year,name.lower(),key,candidates))
    rows.sort(key=lambda row:(-row[0],-row[1],row[2]))
    seen=set();selected=[]
    # Try a capped number of images to protect GitHub Actions time & bandwidth.
    for _,year,name,key,urls in rows:
        if key in seen:continue
        seen.add(key)
        selected.append((key,urls))
        if len(selected)>=MAX_PHOTOS:break
    output={}
    OUT.mkdir(parents=True,exist_ok=True);MANIFEST.parent.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for key,local in pool.map(process,selected):
            if local:output[key]=local
    MANIFEST.write_text(json.dumps(output,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"PHOTO CACHE: {len(output)} / {len(selected)} selected release images verified and stored locally")
    if len(output)<15: print("WARNING: Source CDN blocked most or all image downloads; remote-image fallback remains enabled")
if __name__=="__main__":main()
