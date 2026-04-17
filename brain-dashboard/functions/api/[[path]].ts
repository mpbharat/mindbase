interface Env {
  BRAIN_API_KEY: string;
  BRAIN_WORKER_URL: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path?: string[] };
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Build worker URL: /api/memories?x=y → BRAIN_WORKER_URL/memories?x=y
  const workerPath = '/' + (params.path ?? []).join('/');
  const workerUrl = `${env.BRAIN_WORKER_URL}${workerPath}${url.search}`;

  // Forward request with API key
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${env.BRAIN_API_KEY}`);

  const workerReq = new Request(workerUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
  });

  return fetch(workerReq);
}
