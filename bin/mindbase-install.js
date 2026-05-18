#!/usr/bin/env node
'use strict';

/**
 * npx mindbase-install
 *
 * Checks prerequisites, fetches the mindbase-install skill from GitHub,
 * then launches Claude Code to guide the user through the full setup.
 */

const { execSync, spawnSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = 'https://raw.githubusercontent.com/mpbharat/mindbase/main';
const SKILL_URL = `${REPO}/skills/mindbase-install.md`;

function ok(msg) { console.log('  ✓ ' + msg); }
function info(msg) { console.log('  · ' + msg); }
function fail(msg) { console.error('\n  ✗ ' + msg + '\n'); }

function hasCommand(cmd) {
  try { execSync(cmd, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => https.get(u, { headers: { 'User-Agent': 'mindbase-install/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location);
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} from ${u}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
    get(url);
  });
}

async function main() {
  console.log('\n┌─────────────────────────────────────┐');
  console.log('│          Mind Installer            │');
  console.log('│  Persistent memory for Claude       │');
  console.log('└─────────────────────────────────────┘\n');

  // ── 1. Check Claude Code CLI ──────────────────────────────────────────────
  if (!hasCommand('claude --version')) {
    fail('Claude Code CLI not found.');
    console.error('  Install it from: https://claude.ai/code');
    console.error('  Then re-run:     npx mindbase-install\n');
    process.exit(1);
  }
  ok('Claude Code CLI');

  // ── 2. Check Node version ─────────────────────────────────────────────────
  const nodeMajor = parseInt(process.version.slice(1));
  if (nodeMajor < 18) {
    fail(`Node.js 18+ required (you have ${process.version}). Update at nodejs.org`);
    process.exit(1);
  }
  ok('Node.js ' + process.version);

  // ── 3. Check / install wrangler ───────────────────────────────────────────
  if (!hasCommand('npx wrangler --version')) {
    info('Installing Wrangler CLI...');
    execSync('npm install -g wrangler', { stdio: 'inherit' });
  }
  ok('Wrangler CLI');

  // ── 4. Fetch mindbase-install skill from GitHub ──────────────────────────────
  info('Fetching Brain install skill...');
  let skill;
  try {
    skill = await fetch(SKILL_URL);
  } catch (e) {
    fail('Could not fetch install skill: ' + e.message);
    console.error('  Check your internet connection and try again.\n');
    process.exit(1);
  }

  // Save to ~/.claude/skills/ so Claude can reference it
  const skillDir = path.join(os.homedir(), '.claude', 'skills');
  const skillPath = path.join(skillDir, 'mindbase-install.md');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillPath, skill);
  ok('Install skill saved to ~/.claude/skills/mindbase-install.md');

  // ── 5. Write Claude Code settings.json (auto-approve tools) ─────────────
  const claudeDir = path.join(os.homedir(), '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  fs.mkdirSync(claudeDir, { recursive: true });

  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}

  settings.permissions = settings.permissions || {};
  settings.permissions.allow = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebFetch'];
  settings.permissions.defaultMode = 'dontAsk';

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  ok('Claude Code permissions configured (auto-approve)');

  // ── 6. Launch Claude Code with the skill injected ────────────────────────
  console.log('\n' + '─'.repeat(43));
  console.log('  Handing off to Claude Code...');
  console.log('  Claude will guide you through every step.');
  console.log('─'.repeat(43) + '\n');

  const systemAppend = [
    'BRAIN INSTALL MODE.',
    `The mindbase-install skill has been saved to ${skillPath}.`,
    'Read it in full, then execute it immediately — start with',
    '"I\'m using the mindbase-install skill" and walk through every phase.',
    'Do not wait for the user to ask. Begin Phase 1 now.',
  ].join(' ');

  const result = spawnSync(
    'claude',
    ['--append-system-prompt', systemAppend, 'Run the mindbase-install skill.'],
    { stdio: 'inherit', shell: false }
  );

  process.exit(result.status ?? 0);
}

main().catch(e => {
  console.error('\n  Error:', e.message);
  process.exit(1);
});
