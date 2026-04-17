# Ubuntu Brain Setup — Instructions for Claude Code

You are Claude Code running on Bharat's Ubuntu machine. Your job is to set up the brain system so this machine has persistent memory synced with the Mac and any other agents.

Do these steps in order. No need to ask for confirmation — just do them.

---

## Step 1: Clone the brain repo

```bash
git clone https://github.com/mpbharat/brain.git /home/$(whoami)/brain
```

---

## Step 2: Build brain-cli

```bash
cd /home/$(whoami)/brain/brain-cli
npm install
npm run build
```

Verify it works:
```bash
BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER" \
BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev" \
node /home/$(whoami)/brain/brain-cli/dist/index.js context
```

You should see a `<brain-context>` block printed. If you get an error, stop and report it.

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
export BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
export BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"
export BRAIN_AGENT_NAME="claude-ubuntu"
EOF
source ~/.zshrc
```

If bash:
```bash
cat >> ~/.bashrc << 'EOF'

# Brain — persistent AI agent memory
export BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
export BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"
export BRAIN_AGENT_NAME="claude-ubuntu"
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
            "command": "node /home/YOUR_USERNAME/brain/brain-cli/dist/index.js context"
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

## Step 5: Install the brain-sync skill

```bash
mkdir -p ~/.claude/skills/brain-sync
cp /home/$(whoami)/brain/skills/claude-code/brain-sync.md ~/.claude/skills/brain-sync/SKILL.md
```

---

## Step 6: Verify everything

Run a final context fetch with env vars loaded:
```bash
source ~/.zshrc  # or ~/.bashrc
node ~/brain/brain-cli/dist/index.js context
```

You should see the full `<brain-context>` block with Bharat's projects, memories, and tasks.

---

## What NOT to do

- Do not change `BRAIN_AGENT_NAME` — it must be `"claude-ubuntu"` so sessions from this machine are identified separately from the Mac
- Do not run `npm install -g` for brain-cli — it's run directly via `node path/to/dist/index.js`
- Do not create a new Cloudflare Worker or Neon DB — the live infrastructure is already deployed and shared

---

## Done

Once Step 6 shows the context block, this machine is set up. The next Claude Code session opened on this Ubuntu machine will automatically pull the brain context at startup.

Report back: "Brain setup complete on Ubuntu. Context loads successfully."
