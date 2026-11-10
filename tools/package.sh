#!/usr/bin/env bash
# Builds dist/copy-readable-url-<version>.zip from the committed HEAD: only the
# files the browser loads, inside a copy-readable-url/ directory.
set -euo pipefail

cd "$(dirname "$0")/.."

FILES=(manifest.json _locales background.js decode.js idn.js offscreen.html offscreen.js LICENSE)

if [[ -n "$(git status --porcelain -- "${FILES[@]}")" ]]; then
  echo "Uncommitted changes in extension files; commit them first." >&2
  exit 1
fi

version=$(git show HEAD:manifest.json | jq -r .version)
out="dist/copy-readable-url-$version.zip"
mkdir -p dist
git archive --format=zip --prefix=copy-readable-url/ -o "$out" HEAD -- "${FILES[@]}"
echo "$out"
