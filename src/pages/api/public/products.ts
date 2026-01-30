import type { APIRoute } from 'astro';
import { db, hasCloudflareRuntime, ok } from '@/lib/db';
import { listProducts, seedIfEmpty } from '@/lib/local-store';

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const lang = url.searchParams.get('lang') || 'zh';
  const status = url.searchParams.get('status');

  if (!hasCloudflareRuntime(ctx)) {
    await seedIfEmpty();
    const items = await listProducts(lang as any, { status: status || undefined, publishedOnly: true });
    return ok(items);
  }

  let sql = `SELECT id, slug, lang, name, status, version, batch, summary, price_text, cta_mode, is_published, sort_order, updated_at
             FROM products WHERE lang = ? AND is_published = 1`;
  const params: unknown[] = [lang];
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY sort_order ASC, datetime(updated_at) DESC`;

  const rows = await db(ctx).prepare(sql).bind(...params).all();
  return ok(rows.results ?? []);
};
