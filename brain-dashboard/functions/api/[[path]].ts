export async function onRequest(context: any): Promise<Response> {
  try {
    const env = context.env;
    const params = context.params;
    const request = context.request;
    const url = new URL(request.url);
    const workerPath = '/' + (params.path ?? []).join('/');
    const workerUrl = `${env.BRAIN_WORKER_URL}${workerPath}${url.search}`;
    const res = await fetch(workerUrl, {
      method: request.method,
      headers: { 'Authorization': `Bearer ${env.BRAIN_API_KEY}`, 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    });
    return res;
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
