#!/bin/sh
# Rebuilds the Chile menu book from the print PDF.
# Usage: sh scripts/chile-build.sh "<path to Menú_nuevo_Chile_libertario_2026.pdf>" [python with Pillow]
set -e
PDF="$1"
PY="${2:-python3}"
WORK="${TMPDIR:-/tmp}/chile-menu-build"
rm -rf "$WORK" && mkdir -p "$WORK"
node scripts/chile-extract.mjs "$PDF" "$WORK"
"$PY" scripts/chile-images.py "$WORK" public/chile/img
mkdir -p public/chile/pages
node -e '
const fs = require("fs"), path = require("path");
const [work, out] = process.argv.slice(1);
for (const f of fs.readdirSync(work).filter((f) => /^p\d+\.json$/.test(f))) {
  const text = fs.readFileSync(path.join(work, f), "utf8").replace(/__IMG:([\w-]+)__/g, "/chile/img/$1.webp");
  fs.writeFileSync(path.join(out, f), text);
}' "$WORK" public/chile/pages
pdftotext -bbox-layout "$PDF" "$WORK/words.html"
cp "$WORK/words.html" scripts/chile-words.html
echo "Chile menu rebuilt."
