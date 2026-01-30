# ORDO Sales Site (Cloudflare Pages + D1 + R2 + Admin)

This repo implements the architecture we discussed:

- **Frontend**: Cloudflare Pages (Astro SSR) — SEO-friendly sales pages.
- **Content**: **D1** (text/structured data) + **R2** (images).
- **Admin**: `/admin` (React) with CRUD for Products, Home page JSON, Updates, and Image Upload.
- **Security**: Protect `/admin` and `/api/admin/*` with **Cloudflare Access**.

> Note: The admin API in this MVP only checks for the presence of Cloudflare Access headers. For production, verify the Access JWT signature.

## 1) Prerequisites

- Node.js 18+
- Wrangler CLI (`npm i -g wrangler`)
- Cloudflare account with Pages, D1, R2 enabled

## 2) Install

```bash
npm install
```

## 3) Create D1 and run migrations

```bash
wrangler d1 create ordo_site_db
# Copy the database_id into wrangler.toml

wrangler d1 execute ordo_site_db --file=./migrations/0001_init.sql
# Optional demo content
wrangler d1 execute ordo_site_db --file=./migrations/0002_seed_demo.sql
```

## 4) Create R2 bucket

```bash
wrangler r2 bucket create ordo-site-media
```

## 5) Local dev (optional)

Astro SSR + Cloudflare bindings are best tested via Wrangler.

```bash
npm run build
wrangler pages dev ./dist
```

## 6) Deploy to Cloudflare Pages

- Create a new Pages project from this repo.
- Build command: `npm run build`
- Output directory: `dist`
- Add bindings in Pages project settings (same as wrangler.toml):
  - D1 binding `DB`
  - R2 binding `MEDIA`

## 7) Configure Cloudflare Access

In Zero Trust dashboard:

- Create an Access Application for `https://<your-domain>/admin/*`
- Add a policy allowing your internal emails.
- Also protect `https://<your-domain>/api/admin/*`

## 8) Using the Admin

- Go to `/admin`
- Create products (zh/en), set Version + Batch, and publish.
- Upload images: the endpoint stores objects in R2 and returns `/cdn/media/<key>` URLs.
- Edit `Home` content: stored as JSON in D1 (slug: `home`, lang: zh/en).

## Public APIs

- `GET /api/public/products?lang=zh|en&status=active|preview|proven`
- `GET /api/public/product/:slug?lang=zh|en`
- `GET /api/public/page/:slug?lang=zh|en`
- `GET /api/public/updates?lang=zh|en&productId=...`

## Admin APIs

- `GET/POST /api/admin/products`
- `GET/PUT/DELETE /api/admin/products/:id`
- `GET/PUT /api/admin/pages/:slug?lang=...`
- `GET/POST /api/admin/updates`
- `GET/PUT/DELETE /api/admin/updates/:id`
- `POST /api/admin/media/upload` (multipart: file, productId?, alt?, sort_order?)

---

## Where to customize

- Navigation & layout: `src/layouts/Base.astro`
- Page templates: `src/pages/...`
- Admin UI: `src/components/admin/AdminApp.tsx`
- Schema: `migrations/0001_init.sql`
