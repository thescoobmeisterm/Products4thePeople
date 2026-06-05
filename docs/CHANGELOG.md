# Changelog

All notable changes to the Products4ThePeople platform are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
