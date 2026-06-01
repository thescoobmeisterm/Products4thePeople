# Products4ThePeople

Multi-niche ecommerce launch platform for Products4ThePeople.com.

## Current Build

This first implementation is a Vite + React + TypeScript admin dashboard seeded from
`Seed.csv`.

It includes:

- Product management with add, edit, delete, status updates, CSV import, CSV export, and reset
- Seeded catalog with pricing, margins, variants, sourcing links, and content angles
- Subdomain routing visibility for beauty, pets, home, and fitness
- Admin dashboard surfaces for imports, orders, customers, funnels, analytics, AI tools, and settings
- Admin login gate for non-storefront routes
- PostgreSQL-backed product, order, and contact capture APIs
- Medusa JS SDK integration with backend connection testing plus product and order sync
- Stripe Checkout session creation with hosted payment, customer email, phone, and shipping address collection
- Basic checkout rules: free shipping over `$75`, `$7` flat shipping below that, and a configurable estimated tax line

## Admin Access

Admin routes are gated by the MVP login screen. Storefront hashes such as `#general`, `#beauty`, and
`#product/...` remain public.

Copy `.env.example` to `.env` and set:

```text
VITE_ADMIN_EMAIL=admin@products4thepeople.com
VITE_ADMIN_PASSWORD=change-this-password
```

This is a client-side MVP gate for local/admin-preview use. Production should enforce admin sessions
in the backend before exposing real product, order, or customer data.

## Run Locally

Start PostgreSQL and create a `products4thepeople` database, then copy `.env.example` to `.env`.

Run the API in one terminal:

```powershell
npm.cmd run dev:api
```

Run the Vite app in another terminal:

```powershell
npm.cmd install
npm.cmd run dev
```

Then open `http://localhost:5173`.

## Real Checkout

Copy `.env.example` to `.env`, set `STRIPE_SECRET_KEY` to a Stripe test secret key, then run:

```powershell
npm.cmd run build
npm.cmd start
```

Open `http://localhost:4242/Products4thePeople/`. The storefront posts carts to
`/api/create-checkout-session`, redirects customers to Stripe Checkout, and verifies
`/api/checkout-session` when Stripe redirects back. Confirmed orders are written through the Order
API into PostgreSQL and contact capture is upserted by customer email.

The tax rule is a simple configurable estimate (`BASIC_TAX_RATE`, default `0.06`) rather than a
jurisdiction-aware tax engine.

## Medusa Backend

See [docs/MEDUSA.md](docs/MEDUSA.md) for the backend scaffold steps. PostgreSQL is required before
the Medusa server can run locally.

## Build

```powershell
npm.cmd run build
```
