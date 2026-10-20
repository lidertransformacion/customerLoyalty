#!/bin/sh
# Rebuilds the Chile menu photographs from the print PDF.
# 1. extracts every spread into layers (print/chile, not published)
# 2. cuts each chapter's and each product's photograph into public/menu/cl
#    and writes their living-photo specs to src/core/chile-photos.ts
# Usage: sh scripts/chile-build.sh "<Menú_nuevo_Chile_libertario_2026.pdf>" [python with Pillow]
set -e
PDF="$1"
PY="${2:-python3}"
WORK="${TMPDIR:-/tmp}/chile-menu-build"
rm -rf "$WORK" && mkdir -p "$WORK" print/chile/pages print/chile/img
node scripts/chile-extract.mjs "$PDF" "$WORK"
"$PY" scripts/chile-images.py "$WORK" print/chile/img
"$PY" scripts/chile-images.py "$WORK" print/chile/img-full full
mkdir -p public/chile && cp -R print/chile/pages print/chile/img public/chile/
node -e '
const fs = require("fs"), path = require("path");
const [work, out] = process.argv.slice(1);
for (const f of fs.readdirSync(work).filter((f) => /^p\d+\.json$/.test(f))) {
  fs.writeFileSync(path.join(out, f), fs.readFileSync(path.join(work, f), "utf8").replace(/__IMG:([\w-]+)__/g, "/chile/img/$1.webp"));
}' "$WORK" print/chile/pages
npx vite-node scripts/chile-photos.ts "$PY"
echo "Chile photographs rebuilt."
