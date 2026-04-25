# Mr Du

Next.js rebuild of `mr-du.vercel.app` with public product pages and a lightweight CMS backed by Supabase and signed Cloudinary uploads.

## Routes

- `/` homepage
- `/products` collection overview
- `/products/[category]` category listing
- `/products/[category]/[slug]` product detail
- `/gioi-thieu` about page
- `/lien-he` contact/lead form
- `/admin` CMS for product CRUD and Cloudinary image upload. This route is hidden from public navigation and marked `noindex`; write/upload actions require `ADMIN_PASSWORD`.

## Environment

Copy `.env.example` to `.env.local` and fill values from Vercel/Supabase/Cloudinary.

```bash
vercel link
vercel env pull .env.local
```

The site renders from local seed data when Supabase env is missing. CMS writes and lead submissions require:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Cloudinary upload in `/admin` requires:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` for signed server uploads

Unsigned browser uploads are intentionally not used by the CMS.

## Supabase

Run `supabase/schema.sql` in Supabase SQL editor for a fresh project. The schema is normalized:

- `categories`
- `subcategories`
- `products`
- `leads`

Products/categories use public read policies. Product mutations and lead inserts are performed by Next.js route handlers with `SUPABASE_SERVICE_ROLE_KEY`; do not add public write policies for CMS tables.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run dev
```

## Deploy

```bash
vercel pull
npm run build
vercel deploy
vercel deploy --prod
```

If the Vercel project already connects GitHub, pushing this repo to the connected branch will trigger deployment automatically.

## Post-Deploy Checks

```bash
npm run check:connections
npm run check:vercel-git
```

Smoke-test `/`, `/products`, one category, one product detail, `/lien-he`, `/admin`, `/api/products`, CMS create/delete, and Cloudinary upload after every production deploy.
