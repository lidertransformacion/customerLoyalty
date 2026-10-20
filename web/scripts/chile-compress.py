"""Re-encodes the cut Chile photos: name@2x.jpg (1500 px) and name.jpg (900 px), progressive.
Usage: python chile-compress.py public/menu/cl"""
import glob
import os
import sys

from PIL import Image

folder = sys.argv[1]
for big in glob.glob(os.path.join(folder, "*@2x.jpg")):
    im = Image.open(big).convert("RGB")
    for path, width in ((big, 1500), (big.replace("@2x.jpg", ".jpg"), 900)):
        out = im if im.width <= width else im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        out.save(path, "JPEG", quality=74, optimize=True, progressive=True)
