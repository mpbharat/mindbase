const BASE_URL = process.env.MIND_URL ?? '';
const API_KEY = process.env.MIND_API_KEY ?? '';

export async function runFetch(projectName: string, options: { q?: string }): Promise<void> {
  if (!API_KEY) {
    process.stderr.write('MIND_API_KEY not set — skipping mind fetch\n');
    return;
  }

  try {
    const params = new URLSearchParams({ name: projectName });
    if (options.q) params.set('q', options.q);

    const res = await fetch(`${BASE_URL}/context/project?${params}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    if (res.status === 404) {
      process.stderr.write(`mind-cli: project "${projectName}" not found\n`);
      return;
    }

    if (!res.ok) {
      process.stderr.write(`mind-cli: /context/project returned ${res.status}\n`);
      return;
    }

    const context = await res.text();
    process.stdout.write(context + '\n');
  } catch (err) {
    process.stderr.write(`mind-cli fetch error: ${err}\n`);
  }
}
