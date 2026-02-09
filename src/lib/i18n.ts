// Minimal i18n helpers used across pages.
// Keep this file dependency-free so Astro SSR can import it safely.

export type Lang = 'en' | 'zh';

/**
 * Derive language from a URL (supports /en/* and /zh/*).
 * Defaults to 'en' when unknown.
 */
export function getLangFromUrl(url: URL | string): Lang {
  const pathname = typeof url === 'string'
    ? new URL(url, 'http://local').pathname
    : url.pathname;

  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  return first === 'zh' ? 'zh' : 'en';
}
