# Changelog

All notable changes to the Products4ThePeople platform are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## v1.6.0 - 2026-06-09

### Added
- Added product-editor image upload controls so admins can upload an image while editing a listing and immediately add it to that product gallery.
- Added a product-editor media-library browser for selecting existing image assets without leaving the product form.

## v1.5.0 - 2026-06-09

### Added
- Added an Admin Media tab for uploading images/videos, adding hosted media URLs, previewing saved assets, refreshing the media library, and deleting media.
- Added backend media asset storage with PostgreSQL persistence, local fallback persistence, upload serving, and admin media API endpoints.
- Added product listing media assignment so image assets can be attached to catalog product galleries from the admin.
- Added storefront video-section media support so saved video-section assets replace the sample "See It In Action" carousel.
- Added `PUBLIC_API_URL` setup guidance for production upload URLs.

## v1.4.2 — 2026-06-08

### Changed
- Replaced the customer portal demo profiles with email/password sign-in and kept configured admin email/password access for the admin page.
- Removed unused demo profile styles from the storefront authentication modal.

## v1.4.1 — 2026-06-08

### Fixed
- Fixed frontend settings, checkout, customer profile, order tracking, AI, and contact calls so they use `VITE_API_BASE_URL` instead of hard-coded `/api` paths.
- Added GitHub Pages build support for production `VITE_*` secrets, including `VITE_API_BASE_URL`, and documented the GitHub Pages plus IONOS API setup path.

## v1.4.0 — 2026-06-07

### Added
- Added Admin Customers user management for creating customer/admin users, changing roles, and removing users from the customer directory.
- Added admin contact role and delete API endpoints with role preservation across newsletter, profile, and order updates.
- Added storefront profile role syncing so promoted users can receive admin access after sign-in.

## v1.3.2 — 2026-06-05

### Added
- Added a full IONOS production setup walkthrough with SSH, VPS, PostgreSQL, Nginx, PM2, HTTPS, Stripe, Google Login, AI, analytics, deployment, backup, and troubleshooting steps.

## v1.3.1 — 2026-06-05

### Changed
- Moved storefront Blog and Help Center navigation links into the More menu to simplify the top header.

## v1.3.0 — 2026-06-04

### Added
- Expanded Admin Settings into a full integration setup hub for database, Stripe, Medusa, Google login, AI provider keys, analytics pixels, admin credentials, site URLs, tax, and shipping.
- Added readiness status cards so admins can see which platform systems are connected versus still running in simulator or fallback mode.
- Expanded the settings config API to load and save the new setup keys while preserving masked secrets.
- Documented Google OAuth and AI provider keys in `.env.example`.

## v1.2.0 — 2026-06-04

### Added
- Added a Product SEO Generator to the SEO Hub for creating draft educational articles or sales pages from a selected catalog product.
- Added admin API endpoints for product-led article generation and product-led programmatic sales page generation.
- Added generated product content with product-aware titles, internal links, problem/solution positioning, pricing context, keywords, and schema markup.

## v1.1.0 — 2026-06-04

### Added
- Completed the Phase 0 Product Research backend workflow with persisted competitor captures and API-backed competitor registry views.
- Added demand and competitor scan actions from the research dashboard and opportunity detail modal.
- Added score recalculation, expanded research statuses, richer score columns, and filters for score, margin, risk, category, and discovery date.
- Preserved manual AliExpress URLs during supplier intake and moved imported supplier products into the review queue with generated import payload/checklist data.

### Changed
- Admin version badge now reads from the canonical `APP_VERSION` source instead of hard-coded display text.

## v1.0.1 — 2026-06-04

### Fixed
- Improved storefront contrast so the mobile cart button remains visible on light themes.
- Fixed dark-theme product quick-view and detail panels so headings and supporting copy no longer render white on white.

## v1.0.0 — 2026-06-04

### Added
- **Agent Versioning & Release Protocol** — Full semantic versioning system with automated agent enforcement, structured commit conventions, and rollback procedures (`agents/AGENT_VERSIONING_RELEASE_PROTOCOL.md`)
- **AGENTS.md project-level instructions** — Gemini-compatible agent context file loaded automatically on every conversation
- **Version source of truth** — Single canonical version file at `src/lib/version.ts`
- **This changelog** — Tracking all platform changes going forward

### History (Pre-Versioning)

#### Phase 3: Storefront UX & Conversion Features
- Toast notification engine with auto-dismissing slide transitions
- Header search bar with instant product catalog filtering
- Persistent browser-cached wishlist system with checkout transfers
- Add-to-cart micro-animations with scale bounce spring states
- Responsive full-height cart drawer for mobile/tablet
- Brand footer with trust seals and newsletter hooks

#### Phase 2: Google Authentication & Customer Portals
- PostgreSQL-backed customer database with address registries
- Google OAuth button with developer simulation tools
- Interactive slide-out customer account center
- 5-step fulfillment milestone tracker

#### Phase 1: MVP Stabilization & Simulators
- Stripe & Medusa admin settings forms with env hot-reloads
- Zero-config Stripe checkout simulator
- Offline Medusa scaffold on port 4000
- AI copywriter studio with UGC script generators

#### Phase 0: Foundation
- Vite + React + TypeScript admin dashboard
- Product management (CRUD, CSV import/export, status updates)
- Seeded catalog from `Seed.csv` with pricing and variants
- Subdomain routing for beauty, pets, home, fitness niches
- PostgreSQL-backed product, order, and contact capture APIs
- Medusa JS SDK integration with backend connection testing
- Stripe Checkout with hosted payment and shipping collection
- Checkout rules: free shipping over $75, $7 flat rate below
- GitHub Pages CI/CD via GitHub Actions
