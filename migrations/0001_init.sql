-- D1 migration: initial schema

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','preview','proven')),
  version TEXT NOT NULL,
  batch TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_md TEXT NOT NULL,
  price_text TEXT,
  cta_mode TEXT NOT NULL DEFAULT 'email' CHECK (cta_mode IN ('email','external','none')),
  cta_value TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 100,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(slug, lang)
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','video')),
  r2_key TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh','en')),
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(slug, lang)
);

CREATE TABLE IF NOT EXISTS updates (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL CHECK (lang IN ('zh','en')),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  product_id TEXT,
  version TEXT,
  batch TEXT,
  body_md TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_list ON products(lang, status, is_published, sort_order, updated_at);
CREATE INDEX IF NOT EXISTS idx_media_product ON product_media(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_updates_list ON updates(lang, is_published, date);
