const BASE_URL = process.env.MIND_URL ?? '';
const API_KEY = process.env.MIND_API_KEY ?? '';
const AGENT_NAME = process.env.MIND_AGENT_NAME ?? 'claude-unknown';
export async function runContext() {
    if (!API_KEY) {
        process.stderr.write('MIND_API_KEY not set — skipping mind context\n');
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/context/overview?agent=${encodeURIComponent(AGENT_NAME)}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        if (!res.ok) {
            process.stderr.write(`mind-cli: /context returned ${res.status}\n`);
            return;
        }
        const context = await res.text();
        // Print to stdout — Claude Code session hook captures and injects this
        process.stdout.write(context + '\n');
    }
    catch (err) {
        // Never crash the session
        process.stderr.write(`mind-cli context error: ${err}\n`);
    }
}
