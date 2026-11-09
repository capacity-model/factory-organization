#!/bin/sh
# Runs every check. Build first so the published file is never tested stale.
set -e
cd "$(dirname "$0")/.."
node build_standalone.js
for t in tests/engine.test.js tests/page.test.js tests/dist.test.js; do
  printf '%-26s ' "$(basename "$t")"
  node "$t"
done
