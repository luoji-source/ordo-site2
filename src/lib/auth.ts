import type { APIContext } from 'astro';
import { unauthorized } from './db';

export type AdminIdentity = {
  email?: string;
  jwt?: string;
};

/**
 * Cloudflare Access should protect /admin and /api/admin/*.
 * This MVP checks for Access headers only. For production, verify JWT signature.
 */
export function requireAdmin(ctx: APIContext): AdminIdentity | Response {
  const h = ctx.request.headers;
  const email = h.get('Cf-Access-Authenticated-User-Email') || undefined;
  const jwt = h.get('CF-Access-Jwt-Assertion') || undefined;

  if (!email && !jwt) return unauthorized('Missing Cloudflare Access identity headers.');
  return { email, jwt };
}
