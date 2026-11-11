#!/usr/bin/env bash
set -euo pipefail

echo "Building..."
npm run build

echo "Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "Done."
