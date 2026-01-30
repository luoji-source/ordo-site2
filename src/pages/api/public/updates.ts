import type { APIRoute } from 'astro';
import { db, hasCloudflareRuntime, ok } from '@/lib/db';
import { listUpdates, seedIfEmpty } from '@/lib/local-store';

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';
  const productId = url.searchParams.get('productId');

  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const updates = await listUpdates(lang as any);
    return ok(productId ? updates.filter((u) => u.product_id === productId) : updates);
  }

  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const all = await listUpdates(lang as any);
    const filtered = productId ? all.filter((u) => u.product_id === productId) : all;
    return ok(filtered);
  }

  let sql = `SELECT id, lang, title, date, product_id, version, batch, body_md, updated_at
             FROM updates WHERE lang = ? AND is_published = 1`;
  const params: unknown[] = [lang];
  if (productId) {
    sql += ` AND product_id = ?`;
    params.push(productId);
  }
  sql += ` ORDER BY date DESC, datetime(updated_at) DESC LIMIT 100`;

  const rows = await db(ctx).prepare(sql).bind(...params).all();
  return ok(rows.results ?? []);
};
