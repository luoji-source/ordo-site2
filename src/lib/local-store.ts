// Local store (used for development and for environments without Cloudflare D1 bindings).
// This file is bundled by Vite/Astro, so keep it runtime-safe for Cloudflare Workers.
//
// Data source: repo-root/.localdata/db.json (compiled into this file for portability).
//
// NOTE:
// - Public API routes expect DB-like shapes (e.g. `content_json` is a string).
// - `local` below provides convenient parsed content for DEV-rendered pages.

export type Lang = "en" | "zh";

// Home page content is currently a simple string map.
// Keep it flexible so adding/removing fields won't break builds.
export type PublicPageContent = Record<string, string>;

export type SiteConfig = {
  brand: string;
  localeDefault: Lang;
  orderEmail?: string;
};

export type LocalStore = {
  site: SiteConfig;
  products: any[];
  updates: any[];
  pages: any[];
  media: any[];
};

// Seed data (generated from .localdata/db.json)
const db = {
  products: [{"id": "prd-001", "slug": "sample-product", "lang": "zh", "name": "示例产品", "status": "在售", "version": "v1", "batch": "A", "summary": "用于验证本地管理后台与前台展示。", "body_md": "## 产品说明\n\n这里是示例产品详情（Markdown）。\n", "price_text": "询价", "cta_mode": "contact", "is_published": 1, "sort_order": 1, "updated_at": "2026-01-19T07:51:19.834Z"}, {"id": "prd-001-en", "slug": "sample-product", "lang": "en", "name": "Sample Product", "status": "Available", "version": "v1", "batch": "A", "summary": "A sample item to validate local admin + storefront.", "body_md": "## Description\n\nThis is sample product body (Markdown).\n", "price_text": "Contact for pricing", "cta_mode": "contact", "is_published": 1, "sort_order": 1, "updated_at": "2026-01-19T07:51:19.834Z"}],
  updates: [{"id": "upd-001", "lang": "zh", "title": "网站本地开发模式已启用", "date": "2026-01-19", "product_id": null, "version": "v1", "batch": "A", "body_md": "本地开发使用 JSON 数据，不依赖 Cloudflare D1/R2。", "is_published": 1, "updated_at": "2026-01-19T07:51:19.834Z"}, {"id": "upd-001-en", "lang": "en", "title": "Local dev mode enabled", "date": "2026-01-19", "product_id": null, "version": "v1", "batch": "A", "body_md": "Local development uses a JSON store and does not require Cloudflare D1/R2.", "is_published": 1, "updated_at": "2026-01-19T07:51:19.834Z"}],
  pages: [{"id": "page-home-zh", "slug": "home", "lang": "zh", "updated_at": "2026-01-19T07:51:19.834Z", "content_json": "{\n  \"heroTitle\": \"ORDO\",\n  \"heroSubtitle\": \"值得受尊敬的规则与器具。\",\n  \"ctaPrimaryText\": \"联系购买\",\n  \"ctaPrimaryHref\": \"/contact\",\n  \"blocks\": [\n    {\n      \"type\": \"text\",\n      \"title\": \"销售网站（本地开发模式）\",\n      \"body\": \"当前为本地 JSON 数据模式：可在管理页编辑内容并自动写入 .localdata/db.json。\"\n    }\n  ]\n}"}, {"id": "page-home-en", "slug": "home", "lang": "en", "updated_at": "2026-01-19T07:51:19.834Z", "content_json": "{\n  \"heroTitle\": \"ORDO\",\n  \"heroSubtitle\": \"Rules and instruments worthy of respect.\",\n  \"ctaPrimaryText\": \"Contact\",\n  \"ctaPrimaryHref\": \"/contact\",\n  \"blocks\": [\n    {\n      \"type\": \"text\",\n      \"title\": \"Local Development Mode\",\n      \"body\": \"This project is running with a local JSON store. Use the Admin page to edit content; data is saved to .localdata/db.json.\"\n    }\n  ]\n}"}],
  media: [],
} as const;

// Some pages/components expect a `site` config even in DEV mode.
const site: SiteConfig = {
  brand: "ORDO",
  localeDefault: "en",
  // Optional. Base.astro has a fallback if this is missing.
  orderEmail: "orders@ordoinc.com",
};

export function getLocalStore(): LocalStore {
  return {
    site,
    products: Array.isArray(db.products) ? [...db.products] : [],
    updates: Array.isArray(db.updates) ? [...db.updates] : [],
    pages: Array.isArray(db.pages) ? [...db.pages] : [],
    media: Array.isArray(db.media) ? [...db.media] : [],
  };
}

// In the "no Cloudflare runtime" branch we seed from the bundled local JSON.
// If you later want to generate/overwrite data, implement it here.
let _seeded = false;
export async function seedIfEmpty(): Promise<void> {
  if (_seeded) return;
  _seeded = true;
  // no-op: we already have bundled seed data
}

// DB-like row (matches what the public API expects).
export type PublicPageRow = {
  id: string;
  slug: string;
  lang: Lang;
  updated_at: string;
  content_json: string;
};

export async function getPage(slug: string, lang: Lang): Promise<PublicPageRow | null> {
  const pages = Array.isArray(db.pages) ? db.pages : [];
  const row = (pages as any[]).find((p) => p?.slug === slug && p?.lang === lang);
  return (row ?? null) as PublicPageRow | null;
}

// Convenience data for DEV-rendered pages (parsed content_json).
const homeEnRow = (db.pages as any[]).find((p) => p?.slug === "home" && p?.lang === "en");
const homeZhRow = (db.pages as any[]).find((p) => p?.slug === "home" && p?.lang === "zh");

export const local = {
  home: {
    en: (homeEnRow?.content_json ? (JSON.parse(homeEnRow.content_json) as PublicPageContent) : {}),
    zh: (homeZhRow?.content_json ? (JSON.parse(homeZhRow.content_json) as PublicPageContent) : {}),
  },
  products: {
    en: (db.products as any[]).filter((p) => p?.lang === "en"),
    zh: (db.products as any[]).filter((p) => p?.lang === "zh"),
  },
  updates: {
    en: (db.updates as any[]).filter((u) => u?.lang === "en"),
    zh: (db.updates as any[]).filter((u) => u?.lang === "zh"),
  },
} as const;
