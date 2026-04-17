# Claude Desktop Setup Prompts

Paste each of these into Claude Desktop (with Chrome access) in order.
Complete each one fully before moving to the next.

---

## Prompt 1: Create Neon Database

```
Open Chrome and go to https://neon.tech

Sign up or log in with Google.

Once inside the dashboard:
1. Click "New Project"
2. Project name: "brain"
3. Database name: "brain"
4. Region: choose the closest to Dubai (AWS eu-central-1 Frankfurt or eu-west-1 Ireland)
5. Click "Create Project"

Once created:
- Find the connection string. It looks like: postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/brain?sslmode=require
- Copy it exactly, including the password
- Tell me the full connection string so I can save it
```

---

## Prompt 2: Enable pgvector on Neon

```
In the Neon dashboard, find the SQL Editor for the "brain" project.

Run this SQL:
CREATE EXTENSION IF NOT EXISTS vector;

Tell me when it completes successfully or if there is any error.
```

---

## Prompt 3: Create Cloudflare Account + Enable Workers AI

```
Open Chrome and go to https://cloudflare.com

Sign up or log in.

Once inside the Cloudflare dashboard:
1. Check if YOUR_DOMAIN.com is already added as a domain. If not, tell me — we'll handle it separately.
2. In the left sidebar, go to "Workers & Pages" — confirm it's available
3. In the left sidebar, go to "AI" — click it and enable Workers AI if there's an activation button
4. Go to "Workers & Pages" > "Overview" > click your account name in the top right > "My Profile" > "API Tokens"
5. Click "Create Token"
6. Use the template "Edit Cloudflare Workers"
7. For "Account Resources": select your account
8. For "Zone Resources": select "All zones" OR specifically "YOUR_DOMAIN.com"
9. Click "Continue to summary" > "Create Token"
10. Copy the token — it only shows once

Tell me the API token value.
```

---

## Prompt 4: Add YOUR_DOMAIN.com to Cloudflare (if not already there)

```
In the Cloudflare dashboard:
1. Click "Add a site" or "Add domain"
2. Enter: YOUR_DOMAIN.com
3. Select the Free plan
4. Cloudflare will scan existing DNS records — click "Continue"
5. Cloudflare will give you 2 nameservers (e.g. aiden.ns.cloudflare.com and nina.ns.cloudflare.com)
6. Copy both nameserver addresses

Now go to wherever YOUR_DOMAIN.com is registered (GoDaddy, Namecheap, etc.)
Log into that registrar and update the nameservers to the two Cloudflare nameservers.

Tell me:
- Both Cloudflare nameserver addresses
- Which registrar YOUR_DOMAIN.com is on
- Whether you were able to update the nameservers

Note: DNS propagation can take up to 24 hours. We can continue with other setup steps in the meantime.
```

---

## Prompt 5: Authenticate Wrangler CLI (run this in terminal, NOT Claude Desktop)

> Run this yourself in the Mac terminal:

```bash
cd ~//Documents/Claude/LifeOS/brain-worker
npm install
npx wrangler login
```

This opens a browser window — click "Allow" to authenticate. Once done, run:

```bash
npx wrangler whoami
```

Expected output: your Cloudflare account name and ID. Share the account ID with me.

---

## Prompt 6: Set Worker Secrets via Wrangler (run in terminal)

> Run these yourself in the Mac terminal after Wrangler is authenticated.
> Replace the values with what you got from Prompts 1 and 3.

```bash
cd ~//Documents/Claude/LifeOS/brain-worker

# Set Neon connection string (paste when prompted)
npx wrangler secret put DATABASE_URL

# Set brain API key — generate one first:
openssl rand -hex 32
# Copy the output, then:
npx wrangler secret put BRAIN_API_KEY
```

Save the BRAIN_API_KEY value — you'll need it in your shell profile and on Ubuntu.

---

## Prompt 7: Configure brain subdomain on Cloudflare

```
In the Cloudflare dashboard:
1. Click on "YOUR_DOMAIN.com" domain
2. Go to "DNS" > "Records"
3. Check if there's already a record for "brain" subdomain — if yes, tell me what it points to
4. If not, we'll create it after deploying the Worker (Cloudflare creates it automatically via wrangler.toml routes)

Also:
5. Go to "Workers & Pages" in the left sidebar
6. Click "Overview"
7. Tell me your Cloudflare Account ID (shown in the right sidebar or URL bar)
```

---

## Prompt 8: Update wrangler.toml with Account ID (run in terminal)

> After getting the Account ID from Prompt 7, add it to wrangler.toml:

```bash
# Edit brain-worker/wrangler.toml and add this line near the top:
# account_id = "your-account-id-here"
```

Or paste this into Claude Code CLI:

```
Open brain-worker/wrangler.toml and add the line:
account_id = "YOUR_ACCOUNT_ID"
after the compatibility_date line.
```

---

## Prompt 9: Run the database schema (Claude Desktop)

```
Open Chrome and go to https://console.neon.tech

Navigate to your "brain" project > SQL Editor.

Paste and run the entire contents of this file:
[paste the contents of db/schema.sql here]

Tell me if all statements complete without errors.
```

---

## Prompt 10: Verify everything is ready (checklist)

```
Please confirm each of the following:

[ ] Neon "brain" database created and connection string saved
[ ] pgvector extension enabled (CREATE EXTENSION vector ran successfully)
[ ] db/schema.sql ran — all 7 tables created (projects, agents, agent_states, agent_tasks, memories, backlog_items, sessions)
[ ] Cloudflare account active, Workers AI enabled
[ ] YOUR_DOMAIN.com nameservers pointing to Cloudflare
[ ] Wrangler authenticated (npx wrangler whoami works)
[ ] DATABASE_URL secret set in Wrangler
[ ] BRAIN_API_KEY secret set in Wrangler (and you have a copy)
[ ] account_id in wrangler.toml

Once all are confirmed, tell me and we'll run: npm run deploy in brain-worker/
```

---

## After Deployment: Ubuntu Setup Prompt

Send this to Claude Desktop or Claude on Ubuntu:

```
I need to set up the brain-cli on this Ubuntu machine.

Run these commands:

git clone https://github.com/mpbharat/brain.git ~/brain
cd ~/brain/brain-cli
npm install
npm run build

Then add these to ~/.bashrc:
export BRAIN_API_KEY="PASTE_YOUR_KEY_HERE"
export BRAIN_AGENT_NAME="claude-ubuntu"
export BRAIN_AGENT_TYPE="claude-code"
export BRAIN_URL="https://brain.YOUR_DOMAIN.com"

Then install the hooks:
cp ~/brain/hooks/settings.json ~/.claude/settings.json
sed -i "s|/path/to/brain-cli|$HOME/brain/brain-cli|g" ~/.claude/settings.json

Then install the Claude Code skill:
mkdir -p ~/.claude/skills/brain-sync
cp ~/brain/skills/claude-code/brain-sync.md ~/.claude/skills/brain-sync/SKILL.md

Then install the Hermes skill:
mkdir -p ~/.hermes/skills/brain-sync
cp ~/brain/skills/hermes/brain-sync.md ~/.hermes/skills/brain-sync/SKILL.md

Then test it:
source ~/.bashrc
BRAIN_API_KEY=$BRAIN_API_KEY BRAIN_AGENT_NAME=$BRAIN_AGENT_NAME node ~/brain/brain-cli/dist/index.js context

It should print a <brain-context> block. Tell me what it shows.
```
