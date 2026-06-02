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

## Running Progress Log

### 🚀 Phase 3: Storefront UX & Conversion Features (June 2026)
- **Toast Notification Engine**: State-driven visual card popups (`toasts`, `addToast`) for transactional alerts (coupons, logins, orders) with automatic dismissing and beautiful entrance/exit slide transitions.
- **Header Search Bar**: Instant product catalog queries filtering items dynamically by name, niche, benefits, and category tags.
- **Persistent Wishlist**: Browser-cached wishlist system complete with quick hearts on product cards/details and a specialized portal collection interface supporting instant checkout transfers.
- **Add-to-Cart Micro-Animations**: Interactivity rewards including scale bounce spring states on cart indicators and localized button lockouts ("Added ✓").
- **Responsive Cart Drawer**: Full-height sidebar drawer sliding out on mobile/tablet devices, equipped with active item updates, promo calculations, and inline secure checkout forms.
- **Brand Footer Section**: Sleek 5-column layout presenting store networks, trust seals (Stripe Verified, Free Delivery), support portals, and active newsletter hooks.

### 🔐 Phase 2: Google Authentication & Customer Portals (June 2026)
- **Integrated Customer Database**: Extended backend SQL schemas with customer models, address registries, notification matrices, and synced state-based cart backups.
- **Google OAuth Button & Emulator Drawer**: Unified auth layouts allowing live Google Auth button sign-in backed by quick developer simulation tools (mocking admins, Jane Customer, and custom accounts).
- **Interactive Account Center**: Slide-out customer portal listing saved preferences, delivery targets, and chronological order histories.
- **Fulfillment Milestone Tracker**: Gorgeous 5-step visual delivery timeline (Placed -> Paid -> Packaged -> Shipped -> Delivered) updating in real-time matching order databases.

### 🔌 Phase 1: MVP Stabilization & Simulators (June 2026)
- **Stripe & Medusa Settings Forms**: Active dynamic administrative environment tools allowing instant `.env` reads, secret keys masking, environment hot-reloads, and client reinitializations.
- **Zero-Config Stripe Checkout Simulator**: Pre-templated mock payment gateways matching Stripe styles, facilitating full order summaries, mock credit cards, and sandbox checkout callbacks.
- **Offline Medusa Scaffold**: Mock backend endpoints on port 4000 allowing admin dashboards to verify connections, synchronize catalogs, and fetch processing queues out-of-the-box.
- **AI Copywriter Studio**: Dynamic UGC script generators and product email copy engines utilizing custom generation logic in Express backend environments.

