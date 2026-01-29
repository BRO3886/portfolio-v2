#!/usr/bin/env bash
set -euo pipefail

echo "Building..."
npm run build

echo "Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name portfolio-v2

echo "Done."
