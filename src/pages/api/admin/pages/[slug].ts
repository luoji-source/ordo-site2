import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { db, badRequest, notFound, ok } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const GET: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { slug } = ctx.params;
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';

  const row = await db(ctx)
    .prepare(`SELECT id, slug, lang, content_json, updated_at FROM pages WHERE slug = ? AND lang = ?`)
    .bind(slug, lang)
    .first();
  if (!row) return notFound('Page not found');

  return ok(row);
};

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { slug } = ctx.params;
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';

  const body = (await ctx.request.json().catch(() => null)) as any;
  if (!body || typeof body.content_json !== 'string') return badRequest('content_json (string) is required');

  const exists = await db(ctx)
    .prepare(`SELECT id FROM pages WHERE slug = ? AND lang = ?`)
    .bind(slug, lang)
    .first();

  if (exists) {
    await db(ctx)
      .prepare(`UPDATE pages SET content_json = ?, updated_at = datetime('now') WHERE slug = ? AND lang = ?`)
      .bind(body.content_json, slug, lang)
      .run();
    return ok({ slug, lang });
  }

  const id = nanoid();
  await db(ctx)
    .prepare(`INSERT INTO pages (id, slug, lang, content_json) VALUES (?, ?, ?, ?)`)
    .bind(id, slug, lang, body.content_json)
    .run();

  return ok({ id, slug, lang });
};
