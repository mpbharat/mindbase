# Ubuntu Brain Setup — Instructions for Claude Code

You are Claude Code running on a new Ubuntu machine. Your job is to set up the mind system so this machine has persistent memory synced with other agents.

Do these steps in order. No need to ask for confirmation — just do them.

---

## Step 1: Clone the mind repo

```bash
git clone https://github.com/mpbharat/mindbase.git /home/$(whoami)/brain
```

---

## Step 2: Build mind-cli

```bash
cd /home/$(whoami)/mind/mind-cli
npm install
npm run build
```

Verify it works:
```bash
MIND_API_KEY="MIND_API_KEY_PLACEHOLDER" \
MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev" \
node /home/$(whoami)/mind/mind-cli/dist/index.js context
```

You should see a `<mind-context>` block printed. If you get an error, stop and report it.

---

## Step 3: Add env vars to ~/.zshrc (or ~/.bashrc if zsh not installed)

Check which shell is default:
```bash
echo $SHELL
```

If zsh:
```bash
cat >> ~/.zshrc << 'EOF'

# Brain — persistent AI agent memory
export MIND_API_KEY="MIND_API_KEY_PLACEHOLDER"
export MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev"
export MIND_AGENT_NAME="claude-ubuntu"
EOF
source ~/.zshrc
```

If bash:
```bash
cat >> ~/.bashrc << 'EOF'

# Brain — persistent AI agent memory
export MIND_API_KEY="MIND_API_KEY_PLACEHOLDER"
export MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev"
export MIND_AGENT_NAME="claude-ubuntu"
EOF
source ~/.bashrc
```

---

## Step 4: Install the Claude Code SessionStart hook

Read the current `~/.claude/settings.json`. It may or may not exist.

**If it does not exist**, create it:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /home/YOUR_USERNAME/mind/mind-cli/dist/index.js context"
          }
        ]
      }
    ]
  }
}
```
Replace `YOUR_USERNAME` with the actual Linux username (run `whoami` to get it).

**If it already exists**, add the `hooks` block to it without removing existing keys. The `hooks.SessionStart` entry must have this exact shape — each array entry needs a nested `hooks` array with `{type, command}` objects (not a flat `command` field at the top level).

---

## Step 5: Install the mind-sync skill

```bash
mkdir -p ~/.claude/skills/mind-sync
cp /home/$(whoami)/brain/skills/claude-code/mind-sync.md ~/.claude/skills/mind-sync/SKILL.md
```

---

## Step 6: Verify everything

Run a final context fetch with env vars loaded:
```bash
source ~/.zshrc  # or ~/.bashrc
node ~/mind/mind-cli/dist/index.js context
```

You should see the full `<mind-context>` block with your projects, memories, and tasks.

---

## What NOT to do

- Do not change `MIND_AGENT_NAME` — it must be `"claude-ubuntu"` so sessions from this machine are identified separately from the Mac
- Do not run `npm install -g` for mind-cli — it's run directly via `node path/to/dist/index.js`
- Do not create a new Cloudflare Worker or Neon DB — the live infrastructure is already deployed and shared

---

## Done

Once Step 6 shows the context block, this machine is set up. The next Claude Code session opened on this Ubuntu machine will automatically pull the brain context at startup.

Report back: "Brain setup complete on Ubuntu. Context loads successfully."
