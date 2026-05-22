#!/usr/bin/env bash
set -euo pipefail

echo "==> Building lib/api-client-react declarations..."
cd lib/api-client-react
npx tsc -p tsconfig.json
cd ../..

echo "==> Building frontend (Vite)..."
pnpm --filter @workspace/cloudberry run build

echo "==> Building API server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Production build complete."
