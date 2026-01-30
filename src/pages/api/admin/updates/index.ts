import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { db, badRequest, ok } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const GET: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';
  const rows = await db(ctx)
    .prepare(`SELECT id, lang, title, date, product_id, version, batch, is_published, updated_at FROM updates WHERE lang = ? ORDER BY date DESC, datetime(updated_at) DESC`)
    .bind(lang)
    .all();
  return ok(rows.results ?? []);
};

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const body = (await ctx.request.json().catch(() => null)) as any;
  if (!body) return badRequest('Invalid JSON');

  const id = nanoid();
  const {
    lang = 'zh',
    title,
    date = new Date().toISOString().slice(0, 10),
    product_id = null,
    version = null,
    batch = null,
    body_md = '',
    is_published = 0
  } = body;

  if (!title) return badRequest('title is required');

  await db(ctx)
    .prepare(`INSERT INTO updates (id, lang, title, date, product_id, version, batch, body_md, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, lang, title, date, product_id, version, batch, body_md, is_published ? 1 : 0)
    .run();

  return ok({ id });
};
