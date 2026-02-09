import type { APIRoute } from 'astro';
import { db, hasCloudflareRuntime, notFound, ok } from '@/lib/db';
import { getProductBySlug, listProductMedia, seedIfEmpty } from '@/lib/local-store';

export const GET: APIRoute = async (ctx) => {
  const { slug } = ctx.params;
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';

  if (!slug) return notFound('Missing slug');

  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const product = await getProductBySlug(lang as any, slug);
    if (!product) return notFound('Product not found');
    const mediaRows = await listProductMedia(product.id);
    const media = (mediaRows ?? []).map((m: any) => ({ ...m, url: '/' + String(m.r2_key || '').replace(/^\/+/, '') }));
    return ok({ product, media });
  }

  const row = await db(ctx)
    .prepare(
      `SELECT id, slug, lang, name, status, version, batch, summary, body_md, price_text, cta_mode, cta_value, is_published, sort_order, updated_at
       FROM products WHERE lang = ? AND slug = ? LIMIT 1`
    )
    .bind(lang, slug)
    .first();

  if (!row) return notFound('Product not found');

  const mediaRows = await db(ctx)
    .prepare(`SELECT id, product_id, type, r2_key, alt, sort_order, updated_at FROM product_media WHERE product_id = ? ORDER BY sort_order ASC`)
    .bind((row as any).id)
    .all();

  const media = (mediaRows.results ?? []).map((m: any) => ({ ...m, url: '/' + String(m.r2_key || '').replace(/^\/+/, '') }));

  return ok({ product: row, media });
};
