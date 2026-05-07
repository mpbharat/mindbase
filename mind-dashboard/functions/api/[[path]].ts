export async function onRequest(context: any): Promise<Response> {
  try {
    const env = context.env;
    const workerUrl = env.MIND_WORKER_URL;
    const apiKey = env.MIND_API_KEY;

    if (!workerUrl || workerUrl.includes('YOUR_SUBDOMAIN')) {
      return new Response(JSON.stringify({
        error: 'MIND_WORKER_URL not configured. Set it as a Pages environment variable or in wrangler.toml.',
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'MIND_API_KEY not configured. Run: echo "<key>" | wrangler pages secret put MIND_API_KEY --project-name=<project>',
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const params = context.params;
    const request = context.request;
    const url = new URL(request.url);
    const workerPath = '/' + (params.path ?? []).join('/');
    const res = await fetch(`${workerUrl}${workerPath}${url.search}`, {
      method: request.method,
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    });
    return res;
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
