#!/usr/bin/env node
/**
 * Brain Drive — Project ID Patcher
 * Fetches all artifacts, re-assigns project_id based on r2_key path.
 *
 * Usage: node brain-drive-patch-projects.mjs
 */

const BRAIN_URL = 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const BRAIN_API_KEY = 'BRAIN_API_KEY_PLACEHOLDER';

// Path substring → project_id (checked in order, first match wins)
// More specific paths must come before general ones
const PATH_RULES = [
  // Sub-projects first (more specific)
  ['personal/health',       4],   // Health
  ['personal/dhiya',        5],   // Dhiya
  ['lifeos/reference/dhiya', 5],  // Dhiya reference files in LifeOS
  ['lifeos/reference/health', 4], // Health reference files in LifeOS
  ['mart/mart ai',          7],   // Mart PIM SaaS (AI work)
  ['mart/het anker',        7],   // Mart PIM SaaS
  ['mart/graphtec',         7],   // Mart PIM SaaS
  ['mart/quinti',           7],   // Mart PIM SaaS
  ['mart/mini imports',     7],   // Mart PIM SaaS
  ['mart/import instructions', 7],// Mart PIM SaaS
  ['mart/guides',           7],   // Mart PIM SaaS
  ['mart/juno',             7],   // Mart PIM SaaS
  ['mart/context',          7],   // Mart PIM SaaS
  ['mart/docs',             3],   // KPS/Mart (org-level docs)
  ['mart/reference',        3],   // KPS/Mart
  // Top-level folders
  ['kps brain',            15],   // EBrain
  ['zaasu',                 2],
  ['mart',                  3],
  ['anchor',                1],
  ['personal',              6],
  ['lifeos',                8],
  ['evolvevia',             9],
  ['linkedin',             10],
  ['dhis',                 11],
  ['junoa',                 7],
];

function correctProjectId(r2Key) {
  // Strip prefix, lowercase, normalise separators to space for matching
  const withoutPrefix = r2Key
    .replace(/^bootstrap_\d+_/, '')
    .toLowerCase()
    .replace(/[_\-\/]+/g, ' ');

  for (const [pattern, pid] of PATH_RULES) {
    if (withoutPrefix.includes(pattern.toLowerCase().replace(/[_\-\/]+/g, ' '))) {
      return pid;
    }
  }
  return null; // no change
}

async function main() {
  // Fetch all artifacts
  const res = await fetch(`${BRAIN_URL}/artifacts?limit=500`, {
    headers: { 'Authorization': `Bearer ${BRAIN_API_KEY}` },
  });
  const { artifacts } = await res.json();
  console.log(`Found ${artifacts.length} artifacts\n`);

  let updated = 0, skipped = 0, errors = 0;

  for (const a of artifacts) {
    const correct = correctProjectId(a.r2_key);
    if (correct === null || correct === a.project_id) {
      skipped++;
      continue;
    }

    const rel = a.r2_key.replace(/^bootstrap_\d+_/, '').replace(/_/g, '/');
    process.stdout.write(`  ${rel}\n    project_id: ${a.project_id} → ${correct} ... `);

    try {
      const patch = await fetch(`${BRAIN_URL}/artifact/${a.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${BRAIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: correct }),
      });
      if (patch.ok) {
        console.log('✓');
        updated++;
      } else {
        console.log(`✗ ${patch.status}`);
        errors++;
      }
    } catch (e) {
      console.log(`✗ ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} already correct, ${errors} errors.`);
}

main().catch(console.error);
