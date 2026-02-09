import type { APIRoute } from 'astro';
import { db, badRequest, notFound, ok } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const GET: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;

  const product = await db(ctx).prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first();
  if (!product) return notFound('Product not found');

  const media = await db(ctx)
    .prepare(`SELECT id, type, r2_key, alt, sort_order FROM product_media WHERE product_id = ? ORDER BY sort_order ASC`)
    .bind(id)
    .all();

  return ok({ product, media: media.results ?? [] });
};

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;
  const body = (await ctx.request.json().catch(() => null)) as any;
  if (!body) return badRequest('Invalid JSON');

  const keys = [
    'slug','lang','name','status','version','batch','summary','body_md','price_text','cta_mode','is_published','sort_order'
  ];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const k of keys) {
    if (k in body) {
      updates.push(`${k} = ?`);
      const v = k === 'is_published' ? (body[k] ? 1 : 0) : body[k];
      values.push(v);
    }
  }

  if (updates.length === 0) return badRequest('No fields to update');

  values.push(id);
  await db(ctx)
    .prepare(`UPDATE products SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values)
    .run();

  // Optional: update product_media rows (Plan A: static assets under /public/media).
  // We keep the legacy column name `r2_key` but treat it as a static path.
  if (Array.isArray(body.media)) {
    await db(ctx).prepare(`DELETE FROM product_media WHERE product_id = ?`).bind(id).run();
    for (const item of body.media) {
      const path = String(item?.path ?? item?.r2_key ?? '').trim();
      if (!path) continue;
      const alt = item?.alt ? String(item.alt) : null;
      const sortOrder = Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : 100;
      const mediaId = String(item?.id ?? '');
      // If caller supplies an id, keep it, otherwise generate.
      const idToUse = mediaId && mediaId.startsWith('med-') ? mediaId : `med-${Math.random().toString(36).slice(2, 12)}`;
      await db(ctx)
        .prepare(
          `INSERT INTO product_media (id, product_id, type, r2_key, alt, sort_order, updated_at)
           VALUES (?, ?, 'image', ?, ?, ?, datetime('now'))`
        )
        .bind(idToUse, id, path.replace(/^\/+/, ''), alt, sortOrder)
        .run();
    }
  }

  return ok({ id });
};

export const DELETE: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;

  const r = await db(ctx).prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
  if (r.success !== true) return notFound('Product not found');
  return ok({ id });
};
