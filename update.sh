#!/usr/bin/env bash
# LifeOS Brain Update — run on any machine to pull latest brain changes
# Usage: bash update.sh
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== LifeOS Brain Update ==="

# --- 1. Pull latest ---
echo "[1/2] Pulling from git..."
cd "$REPO_DIR"
git pull origin main
echo "  ✓ Up to date"

# --- 2. Rebuild brain-cli if source changed ---
echo ""
echo "[2/2] Rebuilding brain-cli..."
cd "$REPO_DIR/brain-cli"
npm install --silent
npm run build
echo "  ✓ brain-cli rebuilt"

echo ""
echo "=== Done ==="
echo "Skills are updated automatically (symlinked from repo)."
echo "Start a new Claude Code session to pick up changes."
