# IMEISnap — Vercel API and admin panel

Next.js on Vercel, with Turso/libSQL for persistent model records and image bytes. No Cloudflare account, Workers runtime, D1, or paid image API is required. Local development uses a SQLite file through the same database client.

## Local testing

Use Node.js 22.13 or newer:

```sh
npm ci
# On a new checkout, copy .env.example to .env and set strong admin/session secrets.
# This workspace already has .env; preserve it.
npm run db:migrate
npm test
npm run dev
```

Open http://localhost:3000. Sign in with `ADMIN_PASSWORD` from `.env`. In this workspace the generated password is also in the ignored `ADMIN-CREDENTIALS.txt`. Create an API key in the admin panel. The integration suite uses a temporary local database and mocked external pages; it does not prove live Wikimedia availability.

## Deploy to Vercel

1. Create a free Turso database at https://turso.tech and obtain its database URL and auth token. Store them as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Image bytes are saved as database BLOBs, so no separate image-storage subscription is needed.
2. Apply migrations to that remote database by setting those two variables in your terminal and running `npm run db:migrate`. Existing shell variables override `.env`. Migrations are recorded and safe to rerun. Do not point preview deployments at a production database unless sharing their data is intentional.
3. Import your repository into Vercel. If your repository contains the parent workspace, set **Root Directory** to `imeisnap-api`. Select **Next.js** and Node.js **22.x**. The included `vercel.json` sets the build command.
4. Add these Vercel environment variables before deploying:

| Variable | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | Remote `libsql://...` database URL |
| `TURSO_AUTH_TOKEN` | Database token |
| `ADMIN_PASSWORD` | At least 16 random characters |
| `SESSION_SECRET` | At least 32 random characters |
| `IMEI_MODEL_PATH` | `model` (optional) |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep secrets out of Git and client-side environment variables.

5. Deploy, open the resulting Vercel URL, sign in, and create an API key. Vercel production requires a remote database; local SQLite files are not durable serverless storage.

Vercel Hobby is free within its quotas **for personal, non-commercial use**: https://vercel.com/docs/plans/hobby. Commercial use requires a paid Vercel plan. Turso has its own free quotas: https://turso.tech/pricing. No unlimited-free hosting is promised. This repository has not yet been deployed to a Vercel account.

## API

```sh
curl 'http://localhost:3000/api/v1/image?model=SM-S918B' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

The JSON response includes `model`, `cached`, `image_url`, `mime_type`, `bytes`, `source_url`, `attribution`, `license`, `license_url`, `reviewed`, and `stored_at`. Repeat a successful lookup to see `cached: true`.

Append `&format=image` to receive image bytes directly. Returned image URLs also require the API key. Keep application keys on your backend; never ship a privileged key in public frontend JavaScript.

```sh
curl -X POST 'http://localhost:3000/api/v1/imei' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"imei":"YOUR_VALID_15_DIGIT_IMEI"}'
```

IMEI lookup initially uses admin-managed TAC mappings (first eight digits). Full IMEIs are not stored. There is no universal free IMEI provider included. To connect a supplier later, set `IMEI_PROVIDER_URL`, `IMEI_PROVIDER_TOKEN`, and `IMEI_MODEL_PATH`. The included adapter POSTs `{ "imei": "..." }` using Bearer authentication. Suppliers with different contracts need an adapter change in `lib/imei.ts`.

## Sources and limitations

Android model numbers use the bundled Google Play supported-device index. Refresh it with `npm run devices:update` and redeploy. Apple model numbers use Apple's public identification page. Images are scraped from exact Wikimedia Commons categories and file pages; no paid search APIs or restricted search endpoints are used.

Only supported licensed JPEG, PNG, and WebP files up to 256 KB are accepted. The admin can review, replace, and delete images, manage aliases/TAC mappings, and create/revoke API keys. Automatic matching is heuristic and needs review; coverage is not universal. Attribution and licensing must be preserved when reusing an image.

The application caps cached image bytes at 400 MB, API calls at 60/minute per key, source lookups at 5/minute and 100 per 24-hour window. Missing images are cached for one hour. Upstream failures are not cached as missing images. Hosting/database quotas apply independently.

The optional `CORS_ORIGIN` permits one exact frontend origin. `SCRAPER_USER_AGENT` lets you identify your own deployment/contact URL to public sources.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The old Cloudflare/Sites helper files are retained as historical scaffolding; the default development, test, build and start commands now target Vercel/Node.js. Do not follow the previous Workers/Miniflare startup instructions.
