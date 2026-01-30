import type { APIRoute } from 'astro';
import { media, notFound } from '@/lib/db';

export const GET: APIRoute = async (ctx) => {
  const key = (ctx.params.key || '').replace(/^\/+/, '');
  if (!key) return notFound('Missing key');

  const obj = await media(ctx).get(key);
  if (!obj) return notFound('Media not found');

  const headers = new Headers();
  if (obj.httpMetadata?.contentType) headers.set('content-type', obj.httpMetadata.contentType);
  if (obj.httpEtag) headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(obj.body, { headers });
};
