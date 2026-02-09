/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        // Bound in Cloudflare Pages Dashboard (Settings → Bindings).
        DB?: D1Database;
        PUBLIC_SITE_NAME?: string;
      };
    };
  }
}
