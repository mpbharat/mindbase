#!/usr/bin/env node
'use strict';

/**
 * npx mindbase-update
 *
 * Pull latest Mindbase code and rebuild.
 *
 * Modes:
 *   npx mindbase-update          — rebuild CLI only (safe on any machine)
 *   npx mindbase-update --full   — also redeploy worker + dashboard (main machine)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FULL = process.argv.includes('--full');
const BRAIN_DIR = path.join(os.homedir(), 'brain');

function ok(msg)   { console.log('  ✓ ' + msg); }
function info(msg) { console.log('  · ' + msg); }
function step(msg) { console.log('\n' + msg); }
function fail(msg) { console.error('\n  ✗ ' + msg); process.exit(1); }

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd: cwd || BRAIN_DIR, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function runOrFail(cmd, cwd, label) {
  try {
    execSync(cmd, { cwd: cwd || BRAIN_DIR, stdio: 'inherit' });
  } catch {
    fail(`${label} failed — run manually: cd ${cwd || BRAIN_DIR} && ${cmd}`);
  }
}

// ── Check brain dir exists ────────────────────────────────────────────────────
if (!fs.existsSync(BRAIN_DIR)) {
  fail(`~/brain not found. Run: npx mindbase-join first`);
}

console.log('\n  Mindbase Update\n  ──────────────');

// ── 1. Git pull ───────────────────────────────────────────────────────────────
step('1. Pulling latest code...');
runOrFail('git pull', BRAIN_DIR, 'git pull');
ok('Code updated');

// ── 2. Rebuild mind-cli ───────────────────────────────────────────────────────
step('2. Rebuilding CLI...');
const cliDir = path.join(BRAIN_DIR, 'mind-cli');
runOrFail('npm install --silent', cliDir, 'npm install (mind-cli)');
runOrFail('npm run build', cliDir, 'npm run build (mind-cli)');
ok('mind-cli rebuilt');

// Ensure brain-cli symlink still points to mind-cli (backward compat)
const brainCli = path.join(BRAIN_DIR, 'brain-cli');
if (!fs.existsSync(brainCli)) {
  fs.symlinkSync(cliDir, brainCli);
  ok('brain-cli symlink created (backward compat)');
}

if (!FULL) {
  console.log('\n  ✓ CLI updated. Brain sync is live.\n');
  console.log('  To also redeploy worker + dashboard (main machine):');
  console.log('    npx mindbase-update --full\n');
  process.exit(0);
}

// ── Full mode: redeploy worker + dashboard ────────────────────────────────────
step('3. Rebuilding worker dependencies...');
const workerDir = path.join(BRAIN_DIR, 'mind-worker');
runOrFail('npm install --silent', workerDir, 'npm install (mind-worker)');
ok('Worker dependencies ready');

step('4. Deploying worker...');
if (!run('npx wrangler --version', workerDir)) {
  fail('wrangler not found — run: npm install -g wrangler');
}
runOrFail('npx wrangler deploy', workerDir, 'wrangler deploy');
ok('Worker deployed');

step('5. Rebuilding and deploying dashboard...');
const dashDir = path.join(BRAIN_DIR, 'mind-dashboard');
runOrFail('npm install --silent', dashDir, 'npm install (mind-dashboard)');
runOrFail('npm run deploy', dashDir, 'dashboard deploy');
ok('Dashboard deployed');

console.log('\n  ✓ Full update complete. Worker, dashboard, and CLI are live.\n');
