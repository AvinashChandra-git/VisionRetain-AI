# VisionRetain AI

VisionRetain AI is a React + Vercel application for retention analytics, product scanning, price intelligence, and business monitoring. The current production app uses Supabase authentication, Vercel serverless APIs, Google Gemini Vision, SerpApi Google Shopping data, and realistic demo fallback data when the live database has no rows.

Production: https://visionretain-ai.vercel.app

## Current Stack

- React 19 + Vite
- Vercel static hosting and serverless functions
- Supabase Auth and Postgres
- Google OAuth through Supabase
- Google Gemini Vision for Product Lens image analysis
- SerpApi Google Shopping for current price listings
- Local realistic demo data fallback for empty dashboards

## Main Features

| Section | Current behavior |
| --- | --- |
| Overview | Shows KPI cards, risk distribution, high-risk accounts, and scan/customer counts. Uses live Supabase data first, then demo fallback rows. |
| Home | Shows latest Product Lens scan activity and a quick action to scan products. |
| Product Lens | Upload/camera product analysis through Gemini Vision, current shopping matches through SerpApi, and optional persisted scan history in Supabase. |
| Price Intel | Uses Product Lens scanning flow to compare live shopping listings. |
| Customers | Shows searchable customer records, segment cards, risk levels, LTV, NPS, spend, and activity. |
| Churn Analytics | Shows selected customer risk details and calls the live ML endpoint when available. |
| Demand Forecast | Shows realistic forecast cards and SKU demand data when live time-series data is not connected. |
| Sentiment | Includes a local text sentiment analyzer plus realistic aggregate cards. |
| Revenue Intel | Calculates MRR, ARR, revenue at risk, segment revenue, average spend, and a 90-day projection from customer rows. |
| AI Copilot | Shows realistic executive recommendations while a live AI chat backend is not connected. |
| Reports | Shows realistic report entries while generated report backend endpoints are not connected. |
| Settings | Profile update flow, optional phone verification, team/settings UI, and integrations/configuration screens. |

## Data Mode

The app now supports two data modes:

- **Live mode:** Supabase tables contain rows. Dashboard sections use live rows from the database.
- **Demo fallback mode:** Supabase tables are empty or not connected. The app displays realistic static demo data so every section looks populated.

Live data automatically replaces demo data when rows are returned from Supabase. No code change is required.

## Repository Structure

```text
.
├── api/
│   ├── _lib.js
│   ├── dashboard.js
│   ├── health.js
│   └── product-lens/
│       ├── history.js
│       └── scan.js
├── src/
│   ├── App.jsx
│   └── otpAuth.js
├── supabase/
│   ├── schema.sql
│   └── product_lens_setup.sql
├── vercel.json
├── package.json
└── README.md
```

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env
```

Start the Vite dev server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment Variables

Frontend variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_API_BASE_URL=
```

Server/API variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_or_backend_secret
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json

GEMINI_API_KEY=your_gemini_key
GEMINI_VISION_MODEL=gemini-2.5-flash

SERPAPI_API_KEY=your_serpapi_key
PRICE_COUNTRY=in
PRICE_LANGUAGE=en
```

Important:

- Do not expose `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, or `SERPAPI_API_KEY` in the browser.
- Only `VITE_*` values are sent to the frontend.
- In Vercel, set server secrets in Project Settings → Environment Variables.

## Supabase Setup

Run the full schema for customer and Product Lens tables:

```sql
-- Supabase SQL Editor
-- Paste and run supabase/schema.sql
```

For Product Lens only, run:

```sql
-- Supabase SQL Editor
-- Paste and run supabase/product_lens_setup.sql
```

Tables used by the current app:

- `customers`
- `product_scans`
- `price_listings`

Product scans can still show analysis results if persistence is unavailable, but Recent Scans will only persist after `product_scans` exists.

## Authentication

Authentication is handled by Supabase.

Supported flows:

- Email/password sign-in
- Email/password account creation
- Google OAuth sign-in
- Phone OTP sign-in
- Optional phone verification from profile/settings

Supabase configuration checklist:

1. Enable Email provider.
2. Enable Google provider and add the Google OAuth client credentials.
3. Add production and local URLs in Supabase Auth URL configuration.
4. Add the Supabase callback/redirect URL in Google Cloud OAuth settings.

For production, make sure the OAuth redirect does not point to `localhost`.

## Product Lens Flow

1. User uploads an image or opens camera.
2. `/api/v1/product-lens/scan` verifies the Supabase session.
3. Gemini Vision identifies the product.
4. SerpApi fetches current Google Shopping matches when configured.
5. The API attempts to save the scan into `product_scans`.
6. The UI shows the analysis even if scan persistence is not ready.
7. Recent Scans update when persistence succeeds.

## Vercel Deployment

Deploy production:

```bash
npx vercel --prod --yes
```

Vercel routes:

- `/api/v1/dashboard` → `api/dashboard.js`
- `/api/v1/product-lens/scan` → `api/product-lens/scan.js`
- `/api/v1/product-lens/history` → `api/product-lens/history.js`
- `/api/health` → `api/health.js`

Health check:

```bash
curl -I https://visionretain-ai.vercel.app/api/health
```

Expected result:

```text
HTTP/2 200
```

## Git Workflow

The project is currently pushed to:

```text
https://github.com/AvinashChandra-git/VisionRetain-AI.git
```

Commits should be authored as:

```text
Avinash Chandra <AvinashChandra-git@users.noreply.github.com>
```

Set local author:

```bash
git config user.name "Avinash Chandra"
git config user.email "AvinashChandra-git@users.noreply.github.com"
```

Push:

```bash
git push avinash main
```

## Notes

- Demo fallback data is intentionally present so the app looks complete before live customer imports are connected.
- Live Supabase rows always take priority over demo data.
- Dashboard values are derived from customer rows.
- Product Lens scan history depends on the `product_scans` table.
- Real customer analytics require customer rows in the `customers` table.
