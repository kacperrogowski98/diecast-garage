#!/usr/bin/env python3
"""Fail the Pages build if the studio processor destroys car colors or accepts
photos where the car cannot be safely isolated."""
import importlib.util
from pathlib import Path
from PIL import Image, ImageDraw

spec=importlib.util.spec_from_file_location("studio",Path("scripts/standardize-showroom-photos.py"))
studio=importlib.util.module_from_spec(spec);spec.loader.exec_module(studio)

white=Image.new("RGB",(640,360),"white")
d=ImageDraw.Draw(white)
d.rounded_rectangle((96,125,550,250),radius=35,fill=(217,26,41))
d.rectangle((183,112,390,148),fill=(13,36,52))
car=studio.edge_cutout(white)
assert car is not None,"Bright studio background should be removable"
assert car.getbbox(),"Car alpha mask is empty"
assert car.getpixel((car.width//2,car.height//2))[0]>100,"Model red paint was incorrectly recolored"
bg=studio.background()
assert bg.size==(900,560)
final=studio.showroom(car,bg)
assert final.size==(900,560),"Every hero photo must have an identical frame"
assert final.getpixel((0,0))[:3]==bg.getpixel((0,0))[:3],"Studio corners must match background"

# A real-world/complex backdrop must not be shown as a false cutout.
complex_img=Image.new("RGB",(640,360),(25,55,78))
d=ImageDraw.Draw(complex_img)
d.rectangle((40,50,580,280),fill=(63,101,121))
assert studio.edge_cutout(complex_img) is None,"Textured/dark photo should not be claimed as isolated car"

transparent=Image.new("RGBA",(480,300),(0,0,0,0))
ImageDraw.Draw(transparent).ellipse((70,90,420,245),fill=(35,131,229,255))
assert studio.edge_cutout(transparent) is not None,"Existing transparent cutout must be preserved"
print("PASS: one-stage showroom rendering, safe white-background removal, car color preservation and rejection of unsuitable scenes")
