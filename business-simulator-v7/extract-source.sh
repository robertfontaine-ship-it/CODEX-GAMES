#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
tar -xzf business-simulator-v7-source.tar.gz
echo "V7 source extracted. Run: npm install && npm run check && npm run dev"
