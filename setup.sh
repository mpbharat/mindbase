#!/usr/bin/env bash
# LifeOS Brain Setup — run once on a new machine
# Usage: bash setup.sh [mac|ubuntu]
set -e

BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Detect machine type ---
if [[ -z "$1" ]]; then
  if [[ "$(uname)" == "Darwin" ]]; then
    MACHINE="mac"
  else
    MACHINE="ubuntu"
  fi
else
  MACHINE="$1"
fi

if [[ "$MACHINE" == "mac" ]]; then
  HOME_DIR="~/"
  AGENT_PREFIX="claude-mac"
else
  HOME_DIR="/home/YOUR_USERNAME"
  AGENT_PREFIX="claude-ubuntu"
fi

CLAUDE_DIR="$HOME_DIR/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
BRAIN_CLI="$REPO_DIR/brain-cli/dist/index.js"

echo "=== LifeOS Brain Setup ($MACHINE) ==="
echo "Repo: $REPO_DIR"
echo "Agent prefix: $AGENT_PREFIX"
echo ""

# --- 1. Build brain-cli ---
echo "[1/4] Building brain-cli..."
cd "$REPO_DIR/brain-cli"
npm install --silent
npm run build
echo "  ✓ brain-cli built at $BRAIN_CLI"

# --- 2. Symlink skills ---
echo ""
echo "[2/4] Linking skills..."
mkdir -p "$SKILLS_DIR"

SKILLS_SRC="$REPO_DIR/skills/claude-code"

# Directory-based skills (each has its own SKILL.md inside)
for skill_dir in "$SKILLS_SRC"/*/; do
  [[ -d "$skill_dir" ]] || continue
  skill_name="$(basename "$skill_dir")"
  # Skip mac-specific skills on ubuntu and vice versa
  [[ "$skill_name" == *"-mac" && "$MACHINE" != "mac" ]] && continue
  [[ "$skill_name" == *"-ubuntu" && "$MACHINE" != "ubuntu" ]] && continue
  target="$SKILLS_DIR/$skill_name"
  if [[ -L "$target" ]]; then
    echo "  ↻ $skill_name (already linked)"
  elif [[ -d "$target" ]]; then
    echo "  ⚠ $skill_name exists — skipping (manual merge needed)"
  else
    ln -s "$skill_dir" "$target"
    echo "  ✓ $skill_name"
  fi
done

# File-based skills (brain-sync.md → brain-sync/SKILL.md)
for skill_file in "$SKILLS_SRC"/*.md; do
  [[ -f "$skill_file" ]] || continue
  skill_name="$(basename "$skill_file" .md)"
  target="$SKILLS_DIR/$skill_name"
  if [[ -L "$target" || -d "$target" ]]; then
    echo "  ↻ $skill_name (already exists)"
  else
    mkdir -p "$target"
    ln -s "$skill_file" "$target/SKILL.md"
    echo "  ✓ $skill_name"
  fi
done

# --- 3. Install SessionStart hook in settings.json ---
echo ""
echo "[3/4] Installing SessionStart hook..."

SETTINGS_FILE="$CLAUDE_DIR/settings.json"
HOOK_CMD="BRAIN_API_KEY=\"$BRAIN_API_KEY\" BRAIN_URL=\"$BRAIN_URL\" BRAIN_AGENT_NAME=\"$AGENT_PREFIX:\$(basename \$PWD)\" node $BRAIN_CLI context"

if [[ ! -f "$SETTINGS_FILE" ]]; then
  # Create minimal settings.json
  cat > "$SETTINGS_FILE" <<SETTINGS
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOOK_CMD"
          }
        ]
      }
    ]
  }
}
SETTINGS
  echo "  ✓ Created settings.json with SessionStart hook"
else
  echo "  ⚠ settings.json already exists"
  echo "    Manually add this hook command if not present:"
  echo "    $HOOK_CMD"
fi

# --- 4. Copy Ubuntu close-session skill if needed ---
if [[ "$MACHINE" == "ubuntu" ]]; then
  echo ""
  echo "[4/4] Installing Ubuntu close-session skill..."
  mkdir -p "$SKILLS_DIR/close-session"
  cp "$REPO_DIR/ubuntu-close-session-skill.md" "$SKILLS_DIR/close-session/SKILL.md"
  echo "  ✓ close-session skill installed"
else
  echo ""
  echo "[4/4] Skipping Ubuntu-specific skill (mac install)"
fi

# --- Verify ---
echo ""
echo "=== Verification ==="
echo -n "brain-cli: "
BRAIN_API_KEY="$BRAIN_API_KEY" BRAIN_URL="$BRAIN_URL" BRAIN_AGENT_NAME="$AGENT_PREFIX:setup" \
  node "$BRAIN_CLI" context 2>/dev/null | head -1 || echo "FAILED — check BRAIN_API_KEY"

echo ""
echo "=== Done ==="
echo "Start a new Claude Code session. The brain overview will load automatically."
echo ""
echo "To fetch context for a project mid-session:"
echo "  brain-cli fetch \"my-project\""
echo "  brain-cli fetch \"another project\""
