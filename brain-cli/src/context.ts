const BASE_URL = process.env.BRAIN_URL ?? 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const API_KEY = process.env.BRAIN_API_KEY ?? '';
const AGENT_NAME = process.env.BRAIN_AGENT_NAME ?? 'claude-unknown';

export async function runContext(): Promise<void> {
  if (!API_KEY) {
    process.stderr.write('BRAIN_API_KEY not set — skipping brain context\n');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/context?agent=${encodeURIComponent(AGENT_NAME)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    if (!res.ok) {
      process.stderr.write(`brain-cli: /context returned ${res.status}\n`);
      return;
    }

    const context = await res.text();
    // Print to stdout — Claude Code session hook captures and injects this
    process.stdout.write(context + '\n');
  } catch (err) {
    // Never crash the session
    process.stderr.write(`brain-cli context error: ${err}\n`);
  }
}
