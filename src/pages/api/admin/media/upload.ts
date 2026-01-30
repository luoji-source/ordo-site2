import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { db, badRequest, ok } from '@/lib/db';
import { media } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const form = await ctx.request.formData().catch(() => null);
  if (!form) return badRequest('Expected multipart/form-data');

  const file = form.get('file');
  if (!(file instanceof File)) return badRequest('file is required');

  const productId = (form.get('productId') as string | null) ?? null;
  const alt = (form.get('alt') as string | null) ?? '';
  const sort_order = Number(form.get('sort_order') ?? 100);

  const id = nanoid();
  const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const key = `media/${id}-${safeName}`;

  await media(ctx).put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream'
    }
  });

  if (productId) {
    await db(ctx)
      .prepare(`INSERT INTO product_media (id, product_id, type, r2_key, alt, sort_order) VALUES (?, ?, 'image', ?, ?, ?)`)
      .bind(id, productId, key, alt, sort_order)
      .run();
  }

  return ok({ id, key, publicUrl: `/cdn/media/${key}` });
};
