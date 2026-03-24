# Geesun Crafts

Premium art & craft e-commerce storefront built with:
- Next.js App Router
- Tailwind CSS v4
- Supabase (Auth + Postgres + Storage)
- Razorpay-ready payment APIs
- Event-driven backend hooks for future n8n automation

## Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill keys.

## Supabase

Run `supabase/schema.sql` in Supabase SQL editor, then configure auth/storage.

## Bulk product seed

1. Add/adjust products in `data/products.ts` (`imagePath` should point to local files).
2. Ensure `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run:

```bash
npm run seed:products
```

Optional:
- `SUPABASE_PRODUCTS_BUCKET` (default: `products`)
- `SUPABASE_PRODUCTS_FOLDER` (default: `catalog`)

## Docs

Project setup and architecture notes are in `docs/PROJECT_SETUP.md`.
