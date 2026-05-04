const BASE_URL = process.env.BRAIN_URL ?? 'https://brain-worker.YOUR_SUBDOMAIN.workers.dev';
const API_KEY = process.env.BRAIN_API_KEY ?? '';

export async function runFetch(projectName: string, options: { q?: string }): Promise<void> {
  if (!API_KEY) {
    process.stderr.write('BRAIN_API_KEY not set — skipping brain fetch\n');
    return;
  }

  try {
    const params = new URLSearchParams({ name: projectName });
    if (options.q) params.set('q', options.q);

    const res = await fetch(`${BASE_URL}/context/project?${params}`, {
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
  } catch (err) {
    process.stderr.write(`brain-cli fetch error: ${err}\n`);
  }
}
