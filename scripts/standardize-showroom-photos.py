#!/usr/bin/env python3
"""Create honest, consistent showroom images from existing *real* Hot Wheels photos.

No generative image synthesis. Real model pixels remain untouched apart from
conservative edge-connected background removal, scaling and light edge cleanup.
Sources that cannot be safely cut out are excluded from the showroom manifest
and remain available unchanged via the original photo catalogue.
"""
from __future__ import annotations
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

SOURCE=Path("_site/catalog/local-car-photos.json")
SOURCE_DIR=Path("_site/car-photos")
OUTPUT_DIR=Path("_site/showroom-photos")
MANIFEST=Path("_site/catalog/showroom-photos.json")
WIDTH,HEIGHT=900,560

def background():
    # Single, neutral navy/graphite stage for every edition.
    result=Image.new("RGB",(WIDTH,HEIGHT))
    px=result.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            distance=((x-WIDTH*.5)/(WIDTH*.62))**2+((y-HEIGHT*.42)/(HEIGHT*.86))**2
            glow=max(0,1-min(1,math.sqrt(distance)))
            px[x,y]=(int(11+30*glow),int(17+39*glow),int(27+53*glow))
    return result.convert("RGBA")

def edge_cutout(original):
    src=ImageOps.exif_transpose(original).convert("RGBA")
    src.thumbnail((940,690),Image.Resampling.LANCZOS)
    w,h=src.size
    if w<120 or h<65 or h>w*1.25:
        return None
    alpha=src.getchannel("A")
    transparent=alpha.histogram()[:200]
    ratio=sum(transparent)/(w*h)
    if .05<ratio<.83:
        return src
    # Ignore complex backgrounds: only remove nearly neutral/white edge fields.
    points=[(0,0),(w-1,0),(0,h-1),(w-1,h-1),
            (w//2,0),(w//2,h-1),(0,h//2),(w-1,h//2)]
    samples=[src.getpixel(p)[:3] for p in points]
    neutral=[p for p in samples if min(p)>=215 and max(p)-min(p)<32]
    if len(neutral)<6:
        return None
    # Separate just the light, edge-connected background, not the body of a car.
    # Restrict the fill to the true background color with a conservative tolerance.
    work=src.copy()
    for pt in points:
        r,g,b,a=work.getpixel(pt)
        if min((r,g,b))>=215 and max(r,g,b)-min(r,g,b)<32:
            ImageDraw.floodfill(work,pt,(255,255,255,0),thresh=27)
    a=work.getchannel("A")
    # Photos with too little background removed are not standardized; avoid
    # placing a visible white rectangle in front of the dark showroom stage.
    gone=sum(a.histogram()[:100])/(w*h)
    if gone<.10 or gone>.83:
        return None
    box=a.point(lambda x:255 if x>80 else 0).getbbox()
    if not box or box[2]-box[0]<w*.28 or box[3]-box[1]<h*.11:
        return None
    work=work.crop(box)
    # Slightly feather the outer cut-out edge, without editing the model pixels.
    smooth=work.getchannel("A").filter(ImageFilter.GaussianBlur(.55))
    work.putalpha(smooth)
    return work

def showroom(car,stage):
    result=stage.copy()
    subject=car.copy()
    subject.thumbnail((int(WIDTH*.83),int(HEIGHT*.68)),Image.Resampling.LANCZOS)
    x=(WIDTH-subject.width)//2
    y=int(HEIGHT*.56-subject.height*.5)
    shadow=Image.new("RGBA",result.size,(0,0,0,0))
    draw=ImageDraw.Draw(shadow)
    base=int(y+subject.height*.91)
    draw.ellipse((int(WIDTH*.19),base-7,int(WIDTH*.81),base+34),fill=(0,0,0,118))
    shadow=shadow.filter(ImageFilter.GaussianBlur(22))
    result=Image.alpha_composite(result,shadow)
    result.alpha_composite(subject,(x,y))
    return result.convert("RGB")

def main():
    if not SOURCE.exists():
        raise SystemExit("Original photo manifest is missing")
    originals=json.loads(SOURCE.read_text(encoding="utf8"))
    OUTPUT_DIR.mkdir(parents=True,exist_ok=True)
    MANIFEST.parent.mkdir(parents=True,exist_ok=True)
    stage=background()
    output={}
    errors=0
    for key,location in originals.items():
        if not isinstance(location,str):continue
        source=SOURCE_DIR/(key+".webp")
        if not source.exists():continue
        try:
            with Image.open(source) as im:
                foreground=edge_cutout(im)
            if foreground is None:
                continue
            save=OUTPUT_DIR/(key+".webp")
            showroom(foreground,stage).save(save,"WEBP",quality=86,method=4)
            if save.stat().st_size>2000:
                output[key]="./showroom-photos/"+key+".webp"
        except (OSError,ValueError,MemoryError):
            errors+=1
    MANIFEST.write_text(json.dumps(output,ensure_ascii=False,separators=(",",":")),encoding="utf8")
    print(f"SHOWROOM STUDIO: {len(output)}/{len(originals)} photo subjects standardized, {errors} processing failures; original sources preserved")
if __name__=="__main__":
    main()
