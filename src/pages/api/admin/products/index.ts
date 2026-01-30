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
    .prepare(`SELECT id, slug, lang, name, status, version, batch, summary, price_text, cta_mode, is_published, sort_order, updated_at FROM products WHERE lang = ? ORDER BY sort_order ASC, datetime(updated_at) DESC`)
    .bind(lang)
    .all();
  return ok(rows.results ?? []);
};

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const body = await ctx.request.json().catch(() => null) as any;
  if (!body) return badRequest('Invalid JSON');

  const id = nanoid();
  const {
    slug,
    lang = 'zh',
    name,
    status = 'active',
    version = 'v1.0',
    batch = '2026-Q1',
    summary = '',
    body_md = '',
    price_text = null,
    cta_mode = 'email',
    is_published = 0,
    sort_order = 100
  } = body;

  if (!slug || !name) return badRequest('slug and name are required');

  await db(ctx)
    .prepare(`INSERT INTO products (id, slug, lang, name, status, version, batch, summary, body_md, price_text, cta_mode, is_published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, slug, lang, name, status, version, batch, summary, body_md, price_text, cta_mode, is_published ? 1 : 0, sort_order)
    .run();

  return ok({ id });
};
