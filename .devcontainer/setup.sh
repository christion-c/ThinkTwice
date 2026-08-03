#!/usr/bin/env bash

set -euo pipefail

WORKSPACE="/workspace"

echo "Preparing ThinkTwice development environment..."

# Named Docker volumes are initially owned by root.
# Give the dev-container user permission to write dependencies into them.
sudo mkdir -p \
  "$WORKSPACE/apps/backend/node_modules" \
  "$WORKSPACE/apps/frontend/node_modules" \
  "$WORKSPACE/services/ml/.venv"

sudo chown -R "$(id -u):$(id -g)" \
  "$WORKSPACE/apps/backend/node_modules" \
  "$WORKSPACE/apps/frontend/node_modules" \
  "$WORKSPACE/services/ml/.venv"

echo "Installing backend dependencies..."

cd "$WORKSPACE/apps/backend"
npm ci

echo "Installing frontend dependencies..."

cd "$WORKSPACE/apps/frontend"
npm ci

echo "Installing ML dependencies..."

cd "$WORKSPACE/services/ml"

if [[ ! -f "requirements.txt" ]]; then
  echo "ERROR: services/ml/requirements.txt does not exist."
  exit 1
fi

python -m venv .venv

.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt

echo "Verifying backend TypeScript..."

cd "$WORKSPACE/apps/backend"
npm run typecheck

echo "ThinkTwice development environment is ready."