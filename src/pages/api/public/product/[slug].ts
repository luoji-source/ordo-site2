import type { APIRoute } from 'astro';
import { db, hasCloudflareRuntime, notFound, ok } from '@/lib/db';
import { getProductBySlug, listProductMedia, seedIfEmpty } from '@/lib/local-store';

export const GET: APIRoute = async (ctx) => {
  const { slug } = ctx.params;
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';

  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const product = await getProductBySlug(lang as any, slug || '');
    if (!product || !product.is_published) return notFound('Product not found');
    const media = await listProductMedia(product.id);
    return ok({ product, media });
  }

  const product = await db(ctx)
    .prepare(`SELECT * FROM products WHERE slug = ? AND lang = ? AND is_published = 1`)
    .bind(slug, lang)
    .first();

  if (!product) return notFound('Product not found');

  const media = await db(ctx)
    .prepare(`SELECT id, type, r2_key, alt, sort_order FROM product_media WHERE product_id = ? ORDER BY sort_order ASC`)
    .bind((product as any).id)
    .all();

  return ok({ product, media: media.results ?? [] });
};
