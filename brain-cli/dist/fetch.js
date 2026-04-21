const BASE_URL = process.env.BRAIN_URL ?? 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const API_KEY = process.env.BRAIN_API_KEY ?? '';
export async function runFetch(projectName) {
    if (!API_KEY) {
        process.stderr.write('BRAIN_API_KEY not set — skipping brain fetch\n');
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/context/project?name=${encodeURIComponent(projectName)}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        if (res.status === 404) {
            process.stderr.write(`brain-cli: project "${projectName}" not found\n`);
            return;
        }
        if (!res.ok) {
            process.stderr.write(`brain-cli: /context/project returned ${res.status}\n`);
            return;
        }
        const context = await res.text();
        process.stdout.write(context + '\n');
    }
    catch (err) {
        process.stderr.write(`brain-cli fetch error: ${err}\n`);
    }
}
