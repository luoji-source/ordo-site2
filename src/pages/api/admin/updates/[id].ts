import type { APIRoute } from 'astro';
import { db, badRequest, notFound, ok } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const GET: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;
  const row = await db(ctx).prepare(`SELECT * FROM updates WHERE id = ?`).bind(id).first();
  if (!row) return notFound('Update not found');
  return ok(row);
};

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;
  const body = (await ctx.request.json().catch(() => null)) as any;
  if (!body) return badRequest('Invalid JSON');

  const keys = ['lang','title','date','product_id','version','batch','body_md','is_published'];
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
    .prepare(`UPDATE updates SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values)
    .run();

  return ok({ id });
};

export const DELETE: APIRoute = async (ctx) => {
  const auth = requireAdmin(ctx);
  if (auth instanceof Response) return auth;

  const { id } = ctx.params;
  const r = await db(ctx).prepare(`DELETE FROM updates WHERE id = ?`).bind(id).run();
  if (r.success !== true) return notFound('Update not found');
  return ok({ id });
};
