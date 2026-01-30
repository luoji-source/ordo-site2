import type { APIRoute } from 'astro';
import { db, hasCloudflareRuntime, notFound, ok } from '@/lib/db';
import { getPage, seedIfEmpty } from '@/lib/local-store';

export const GET: APIRoute = async (ctx) => {
  const { slug } = ctx.params;
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';

  // Local development (no D1): use JSON store
  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const page = await getPage(lang as any, slug || 'home');
    if (!page) return notFound('Page not found');
    return ok({ slug: page.slug, lang: page.lang, content: page.content, updated_at: page.updated_at });
  }

  const row = await db(ctx)
    .prepare(`SELECT slug, lang, content_json, updated_at FROM pages WHERE slug = ? AND lang = ?`)
    .bind(slug, lang)
    .first();

  if (!row) return notFound('Page not found');

  let content: any = {};
  try {
    content = JSON.parse((row as any).content_json ?? '{}');
  } catch {
    content = {};
  }

  return ok({ slug, lang, content, updated_at: (row as any).updated_at });
};
