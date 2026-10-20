"""
Merges each photo with its alpha mask and writes web-ready WebP files.

The PDF keeps cut-out plates as an RGB JPEG plus a gray mask; cairo hands
them over separately. Sizes target ~2.2 device pixels per point of the page,
enough for a 3x phone showing one page and a 2x desktop showing a spread.

Usage: python chile-images.py <workdir> <out dir>
"""
import glob
import json
import os
import sys

from PIL import Image

work, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
PX_PER_PT = 2.2
report = []
for page_file in sorted(glob.glob(os.path.join(work, "p*.json")), key=lambda p: int(os.path.basename(p)[1:-5])):
    page = json.load(open(page_file))
    for photo in page["photos"]:
        key = photo["key"]
        content = glob.glob(os.path.join(work, "raw", f"{key}.c.*"))[0]
        im = Image.open(content)
        if im.mode == "CMYK":
            im = im.convert("RGB")
        im = im.convert("RGBA" if photo["alpha"] else "RGB")
        if photo["alpha"]:
            mask = Image.open(glob.glob(os.path.join(work, "raw", f"{key}.m.*"))[0]).convert("L")
            if mask.size != im.size:
                mask = mask.resize(im.size, Image.LANCZOS)
            im.putalpha(mask)
        target_w = min(im.width, round(photo["ptW"] * PX_PER_PT))
        if target_w < im.width:
            im = im.resize((target_w, round(im.height * target_w / im.width)), Image.LANCZOS)
        dest = os.path.join(out, f"{key}.webp")
        im.save(dest, "WEBP", quality=82, method=6, alpha_quality=90)
        report.append((key, photo["w"], im.width, im.height, "alpha" if photo["alpha"] else "", os.path.getsize(dest) // 1024))
for row in report:
    print("%-7s %5d -> %4dx%-4d %-5s %4d KB" % row)
print("total", sum(r[5] for r in report), "KB")
