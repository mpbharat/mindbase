#!/usr/bin/env node
/**
 * Brain Drive Bootstrap
 * Crawls ~/Documents/Claude/, classifies docs with claude-haiku-4-5,
 * uploads keepers to R2 via PUT /drive/:r2_key, registers via POST /artifact.
 *
 * Usage:
 *   node brain-drive-bootstrap.mjs            # dry-run (no uploads)
 *   node brain-drive-bootstrap.mjs --upload   # actually upload
 */

import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';

const DRY_RUN = !process.argv.includes('--upload');
const BRAIN_URL = 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const BRAIN_API_KEY = 'BRAIN_API_KEY_PLACEHOLDER';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_DIR = path.join(process.env.HOME, 'Documents/Claude');

// Project name → brain project_id
const PROJECT_IDS = {
  zaasu: 2, 'kps': 3, mart: 3, anchor: 1, personal: 6,
  health: 4, lifeos: 8, dhiya: 5, evolvevia: 9, linkedin: 10,
  dhis: 11, 'data-extraction': 12, 'lead-research': 13, outreach: 14,
  junoa: 7, 'kps-brain': 3, 'kps brain': 3,
};

// Folder → project_id mapping (top-level dirs)
const FOLDER_PROJECT = {
  'Zaasu': 2, 'Mart': 3, 'Anchor': 1, 'Personal': 6,
  'LifeOS': 8, 'EvolveViaAI': 9, 'LinkedIn': 10,
  'Dhis': 11, 'JunoAtlas': 7, 'KPS Brain': 3,
};

// File extensions to consider — no .json (too many data files) or .csv
const ALLOWED_EXT = new Set(['.md', '.txt', '.html', '.pdf']);

// Paths/patterns to always skip
const SKIP_PATTERNS = [
  'node_modules', '.git', 'dist', '.next', 'build', 'coverage',
  'private_', '.env', 'secret', 'credentials', '.DS_Store',
  'package-lock.json', 'yarn.lock', 'pnpm-lock',
  // Python / iOS / Flutter packages
  '/venv/', '/site-packages/', 'ios/pods', '/pods/',
  'routing/go_router', '/pub-cache/', '/.pub/',
  // Generated / brainstorm / temp
  '.superpowers/brainstorm', '.superpowers/plans',
  '/collected_jsons/', '/raw/',
  // Changelogs and third-party READMEs deep in deps
  'changelog.md', 'changelog.txt',
  // KPS mart web duplicated data files
  'brand_details.json', 'project_details.json', 'brands_list.json',
  'btamrecommendations.json', 'dbfurnitures.json', 'extractedfurnitures.json',
  'configurator/jackson',
  // n8n workflow JSON (large, not useful for agents)
  'n8n-workflows',
  // iOS / Android build artifacts
  'ios/pods', 'android/.gradle', '.dart_tool',
  // Jupyter / notebooks data
  '/notebooks/',
  // Zaasu audit raw results
  'tests/ai-audit/results/raw',
  // Mart AI client training files (confidential client docs)
  'mart ai/ai training files',
];

function shouldSkipPath(p) {
  const lower = p.toLowerCase();
  return SKIP_PATTERNS.some(pat => lower.includes(pat));
}

function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldSkipPath(full)) continue;
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXT.has(ext)) {
        const stat = fs.statSync(full);
        if (stat.size > 200 && stat.size < 500_000) { // skip tiny/empty + huge files
          results.push({ filePath: full, size: stat.size });
        }
      }
    }
  }
  return results;
}

function guessProjectId(filePath) {
  const rel = filePath.replace(CLAUDE_DIR + '/', '');
  const topFolder = rel.split('/')[0];
  return FOLDER_PROJECT[topFolder] ?? 8; // default to LifeOS
}

function makeR2Key(filePath) {
  const rel = filePath.replace(CLAUDE_DIR + '/', '').replace(/\//g, '_');
  return `bootstrap_${Date.now()}_${rel}`.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function classify(client, filePath, size) {
  const rel = filePath.replace(CLAUDE_DIR + '/', '');
  let preview = '';
  try {
    const buf = await readFile(filePath);
    preview = buf.toString('utf8', 0, 300).replace(/\s+/g, ' ').trim();
  } catch { /* binary */ }

  const prompt = `You are classifying files for an AI agent memory system called Brain Drive.
File: ${rel} (${size} bytes)
Preview: ${preview || '(binary/unreadable)'}

Should this file be stored as a Brain Drive artifact that AI agents would reference during sessions?

Good candidates: project plans, specs, design docs, backlogs, architecture docs, session notes, reference docs, dashboards.
Bad candidates: source code files, lock files, auto-generated files, temp files, private/sensitive files.

Reply with JSON only: {"keep": true/false, "description": "one line description if keeping, else empty"}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { keep: false, description: '' };
  } catch {
    return { keep: false, description: '' };
  }
}

async function upload(filePath, r2Key, contentType) {
  const body = await readFile(filePath);
  const res = await fetch(`${BRAIN_URL}/drive/${r2Key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${BRAIN_API_KEY}`,
      'Content-Type': contentType,
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

async function registerArtifact(name, description, r2Key, contentType, sizeBytes, projectId, r2Key2) {
  const res = await fetch(`${BRAIN_URL}/artifact`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BRAIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      r2_key: r2Key,
      content_type: contentType,
      size_bytes: sizeBytes,
      project_id: projectId,
      agent_name: 'claude-mac:brain-drive-bootstrap',
    }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { '.md': 'text/markdown', '.txt': 'text/plain', '.html': 'text/html',
    '.pdf': 'application/pdf', '.csv': 'text/csv', '.json': 'application/json' }[ext]
    || 'application/octet-stream';
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  console.log(`\nBrain Drive Bootstrap — ${DRY_RUN ? 'DRY RUN' : 'UPLOADING'}`);
  console.log(`Scanning: ${CLAUDE_DIR}\n`);

  const files = walkDir(CLAUDE_DIR);
  console.log(`Found ${files.length} candidate files\n`);

  const keepers = [];
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const { filePath, size } = files[i];
    const rel = filePath.replace(CLAUDE_DIR + '/', '');
    process.stdout.write(`[${i + 1}/${files.length}] ${rel} ... `);

    try {
      const result = await classify(client, filePath, size);
      if (result.keep) {
        console.log(`✓ KEEP — ${result.description}`);
        keepers.push({ filePath, size, description: result.description, projectId: guessProjectId(filePath) });
      } else {
        console.log('✗ skip');
        skipped++;
      }
    } catch (e) {
      console.log(`⚠ error: ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Keepers: ${keepers.length} | Skipped: ${skipped}`);
  console.log('\nFiles to upload:');
  keepers.forEach(k => console.log(`  ${k.filePath.replace(CLAUDE_DIR + '/', '')} [project_id=${k.projectId}]`));

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Run with --upload to actually upload.');
    return;
  }

  console.log('\nUploading...');
  let uploaded = 0;
  let failed = 0;

  for (const { filePath, size, description, projectId } of keepers) {
    const name = path.basename(filePath);
    const rel = filePath.replace(CLAUDE_DIR + '/', '');
    const r2Key = makeR2Key(filePath);
    const ct = contentType(filePath);

    process.stdout.write(`  Uploading ${rel} ... `);
    try {
      await upload(filePath, r2Key, ct);
      await registerArtifact(name, description, r2Key, ct, size, projectId);
      console.log('✓');
      uploaded++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`);
}

main().catch(console.error);
