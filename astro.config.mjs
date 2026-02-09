import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  // Used for canonical URLs, hreflang, and sitemap generation.
  site: 'https://ordoinc.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
});
