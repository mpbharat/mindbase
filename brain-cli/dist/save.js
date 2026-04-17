const BASE_URL = process.env.BRAIN_URL ?? 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const API_KEY = process.env.BRAIN_API_KEY ?? '';
const AGENT_NAME = process.env.BRAIN_AGENT_NAME ?? 'claude-unknown';
export async function runSave(options) {
    if (!API_KEY) {
        process.stderr.write('BRAIN_API_KEY not set — skipping brain save\n');
        return;
    }
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
    };
    try {
        // 1. Log session
        await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                agent_name: AGENT_NAME,
                summary: options.summary,
                duration_minutes: parseInt(options.duration, 10),
            }),
        });
        // 2. Save memories
        for (const content of options.memory) {
            await fetch(`${BASE_URL}/memory`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content,
                    category: 'decision',
                    importance: 7,
                }),
            });
        }
        // 3. Save "what's next" as a task if provided
        if (options.next) {
            await fetch(`${BASE_URL}/task`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: options.next,
                    project: 'Brain',
                    status: 'active',
                }),
            });
        }
        process.stdout.write(`brain-cli: session saved for ${AGENT_NAME}\n`);
    }
    catch (err) {
        process.stderr.write(`brain-cli save error: ${err}\n`);
    }
}
