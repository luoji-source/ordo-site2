import type { APIRoute } from 'astro';

/**
 * Plan A: no R2.
 *
 * This route keeps backward compatibility for old URLs:
 *   /cdn/media/<key>
 *
 * We now serve media as static assets under /public/media, so we simply
 * redirect to the corresponding static path:
 *   /<key>
 *
 * Example:
 *   /cdn/media/media/abc.jpg  ->  /media/abc.jpg
 */
export const GET: APIRoute = async ({ params }) => {
  const key = (params as any).key as string | undefined;
  if (!key) return new Response('Not found', { status: 404 });

  // Basic sanitation: disallow path traversal
  if (key.includes('..')) return new Response('Bad request', { status: 400 });

  const location = `/${key.replace(/^\/+/, '')}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
