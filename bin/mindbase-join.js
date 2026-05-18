#!/usr/bin/env node
'use strict';

/**
 * npx mindbase-join
 *
 * Connect a second machine to an existing Brain instance.
 * Only needs MIND_URL and MIND_API_KEY — no infra setup required.
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
    const get = (u) => https.get(u, { headers: { 'User-Agent': 'mindbase-join/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location);
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
    get(url);
  });
}

async function main() {
  console.log('\n┌─────────────────────────────────────┐');
  console.log('│         Brain Join                  │');
  console.log('│  Connect this machine to your Brain │');
  console.log('└─────────────────────────────────────┘\n');

  console.log('  You need two things from your first machine:');
  console.log('  · MIND_URL  (your Cloudflare Worker URL)');
  console.log('  · MIND_API_KEY  (the key you generated during install)\n');

  // ── 1. Check Claude Code CLI ──────────────────────────────────────────────
  if (!hasCommand('claude --version')) {
    fail('Claude Code CLI not found.');
    console.error('  Install it from: https://claude.ai/code');
    console.error('  Then re-run:     npx mindbase-join\n');
    process.exit(1);
  }
  ok('Claude Code CLI');

  // ── 2. Check Node version ─────────────────────────────────────────────────
  if (parseInt(process.version.slice(1)) < 18) {
    fail(`Node.js 18+ required (you have ${process.version})`);
    process.exit(1);
  }
  ok('Node.js ' + process.version);

  // ── 3. Fetch mindbase-install skill (contains the mindbase-join section) ────────
  info('Fetching Brain skill...');
  let skill;
  try {
    skill = await fetch(SKILL_URL);
  } catch (e) {
    fail('Could not fetch skill: ' + e.message);
    process.exit(1);
  }

  const skillDir = path.join(os.homedir(), '.claude', 'skills');
  const skillPath = path.join(skillDir, 'mindbase-install.md');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillPath, skill);
  ok('Skill ready');

  // ── 4. Write Claude Code settings.json (auto-approve tools) ─────────────
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

  // ── 5. Launch Claude to handle the join ──────────────────────────────────
  console.log('\n' + '─'.repeat(43));
  console.log('  Launching Claude Code...');
  console.log('─'.repeat(43) + '\n');

  const systemAppend = [
    'BRAIN JOIN MODE.',
    `The mindbase-install skill is at ${skillPath}.`,
    'Read it and execute ONLY the "Machine 2 — mindbase-join" section.',
    'Ask the user for their MIND_URL and MIND_API_KEY,',
    'build mind-cli, set their agent name, add shell exports,',
    'and write mind-sync into ~/.claude/CLAUDE.md.',
    'Start immediately.',
  ].join(' ');

  const result = spawnSync(
    'claude',
    ['--append-system-prompt', systemAppend, 'Run mindbase-join to connect this machine to my existing Brain.'],
    { stdio: 'inherit', shell: false }
  );

  process.exit(result.status ?? 0);
}

main().catch(e => {
  console.error('\n  Error:', e.message);
  process.exit(1);
});
