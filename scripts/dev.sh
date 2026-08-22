#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies..."
  npm install
fi

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

exec npx next dev --port 3000
