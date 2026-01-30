import type { APIContext } from 'astro';

/**
 * In Cloudflare Pages/Workers, `ctx.locals.runtime.env` contains D1/R2 bindings.
 * In local Node development (astro dev), those bindings do not exist.
 */
export function hasCloudflareRuntime(ctx: APIContext) {
  return Boolean((ctx as any).locals?.runtime?.env);
}

export function db(ctx: APIContext) {
  const database = (ctx as any).locals?.runtime?.env?.DB;
  if (!database) throw new Error('D1 binding DB is not configured.');
  return database;
}

export function media(ctx: APIContext) {
  const bucket = (ctx as any).locals?.runtime?.env?.MEDIA;
  if (!bucket) throw new Error('R2 binding MEDIA is not configured.');
  return bucket;
}

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return json({ ok: false, error: { message, ...extra } }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return json({ ok: false, error: { message } }, { status: 401 });
}

export function notFound(message = 'Not found') {
  return json({ ok: false, error: { message } }, { status: 404 });
}

export function ok<T>(data: T) {
  return json({ ok: true, data });
}
