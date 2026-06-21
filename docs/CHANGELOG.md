# Changelog

All notable changes to the Products4ThePeople platform are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## v1.23.0 - 2026-06-20

### Added
- Added a full admin changelog modal beside the version badge, sourced from the canonical `docs/CHANGELOG.md` release history.
- Added last-updated release metadata beside the admin portal version display.

## v1.22.0 - 2026-06-20

### Added
- Added optional Twilio SMS settings in the admin integration manager and documented Twilio SMS environment variables.
- Extended orders with shipping/tracking fields, richer fulfillment statuses, and admin controls for carrier, tracking number, tracking URL, and estimated delivery.
- Added Resend customer/admin notifications for order status and tracking updates, with customer-facing tracking links in order emails.
- Added customer tracking links that open the storefront tracking modal and display carrier tracking details.

## v1.21.0 - 2026-06-20

### Added
- Added product-editor video controls for uploading, attaching hosted URLs, previewing, and deleting listing/testimonial videos.
- Updated the See It In Action storefront carousel to dynamically pull product listing videos and testimonial video-section clips.

## v1.20.0 - 2026-06-20

### Added
- Added Resend-powered order notification emails to all admin contacts whenever a storefront order is created.
- Added sale notification environment settings for enabling notifications, sender address, extra recipients, and the Resend API key.

## v1.19.7 - 2026-06-20

### Fixed
- Hid unpublished storefronts from public category cards, menus, and footer brand links while preserving admin preview access.
- Hid non-active products from public storefront lists, search/category pages, product detail routes, media sections, carts, and wishlists.

## v1.19.6 - 2026-06-20

### Fixed
- Kept storefront product listing thumbnails image-first when listing videos are attached, while still showing a video badge.
- Prevented product detail videos from cropping and removed filename/title text from video cards.

## v1.19.5 - 2026-06-20

### Fixed
- Rendered product listing video assets on storefront product cards and product detail pages.
- Updated admin listing media controls so video assets are visible alongside image assets.

## v1.19.4 - 2026-06-20

### Fixed
- Increased API media upload body limits for larger video uploads and added clearer oversized-upload errors.
- Added frontend upload size validation and updated Plesk/nginx docs to use a 150 MB request body limit.

## v1.19.3 - 2026-06-20

### Fixed
- Fixed product-page lead attribution so joins, wheel claims, checkout leads, and abandoned carts use the open product's store/niche instead of falling back to general.

## v1.19.2 - 2026-06-20

### Fixed
- Updated product detail related products to fall back to other active products from the same store when no matching subcategory products exist.
- Hid the related products section when a store has no other active products to recommend.

## v1.19.1 - 2026-06-19

### Fixed
- Captured email, phone, SMS opt-in, coupon code, source, and storefront metadata for early-discount and wheel leads in the customer database.
- Applied won spin-wheel coupon codes to cart state after successful contact submission and made wheel claims accept email or phone.
- Added lead source, store, phone/SMS, and coupon columns to the admin customer directory.

## v1.19.0 - 2026-06-17

### Added
- Added public knowledge base detail pages with shareable `#kb/<slug>` routes, SEO metadata, schema markup, and view tracking.

## v1.18.0 - 2026-06-16

### Added
- Added bulk programmatic SEO page generation for niche landing pages, product category collections, and product solution pages.

## v1.17.2 - 2026-06-16

### Fixed
- Restored the storefront top bar on product detail pages while hiding only the store hero section.

## v1.17.1 - 2026-06-16

### Fixed
- Hid the storefront header on product detail pages and reduced top spacing so the product gallery and details are the first visible content.

## v1.17.0 - 2026-06-15

### Added
- Added product variation support (e.g. colors, sizes) to the product model and admin editor.
- Storefront product pages now allow users to select variations, dynamically updating the product image gallery.
- Cart and checkout processes now properly support composite variation keys, mapping selected variations to order items.

## v1.16.2 - 2026-06-15

### Fixed
- Fixed FAQ section dark theme styling so FAQ buttons use themed card background and text colors instead of hardcoded white.

## v1.16.1 - 2026-06-15

### Fixed
- Changed product detail FAQs to a nested accordion so each question opens its answer on click.

## v1.16.0 - 2026-06-15

### Added
- Added product-specific FAQ management to the product edit modal with editable question and answer rows.
- Product detail FAQ accordions now render saved listing FAQs before falling back to default shipping and returns answers.

## v1.15.1 - 2026-06-15

### Fixed
- Increased Cover Flow gallery sizing on product detail pages so active images can scale larger on wider browser windows.

## v1.15.0 - 2026-06-15

### Added
- Added batch product image uploads in the product edit modal so multiple selected images upload together and attach to the listing.

## v1.14.0 - 2026-06-15

### Added
- Added product edit controls for listing trust badges and product highlight benefit rows.
- Product detail pages now use saved listing badges and highlight descriptions before falling back to generated defaults.

## v1.13.1 - 2026-06-15

### Fixed
- Limited storefront product card descriptions to a compact preview so long formatted descriptions no longer stretch product tiles.

## v1.13.0 - 2026-06-15

### Added
- Added product-level review management to the admin product edit modal, including reviewer, rating, date, verified buyer, and review text controls.
- Customer product pages now use saved product reviews before falling back to generated niche reviews.

## v1.12.2 - 2026-06-15

### Fixed
- Preserved customer-facing product description formatting for imported content angles, including paragraphs, line breaks, and simple bullet lists.

## v1.12.1 - 2026-06-15

### Fixed
- Updated Cover Flow product gallery images to show the full photo instead of cropping the image inside the card.

## v1.12.0 - 2026-06-14

### Added
- Added a Cover Flow-style product image gallery for listing pages with animated image selection, thumbnail filmstrip, and gallery counter.
- Added a larger modal image viewer with zoom, previous/next controls, thumbnail navigation, and keyboard support.

## v1.11.0 - 2026-06-14

### Added
- Added SEO page publish previews with canonical URL, meta title/description length checks, and formatted schema markup.
- Added a preview-first guard before publishing draft programmatic SEO pages from the admin SEO Hub.

## v1.10.0 - 2026-06-12

### Added
- Added ten new sourced products across beauty, pets, fitness, and home to the starter catalog seed data.
- Added a dedicated live-catalog import CSV for pushing the new product batch into the production API catalog.
- Added publish/unpublish workflows for SEO category pages and knowledge base entries, including draft-only public visibility and sitemap filtering.

## v1.9.1 - 2026-06-12

### Fixed
- Unified storefront and admin authentication so Google-signed-in admins can enter the admin portal without a second login screen.
- Updated admin sign-out to clear both the admin session and storefront customer session.

## v1.9.0 - 2026-06-12

### Added
- Added reusable SEO Hub filters for article, category page, and knowledge base lists with search, niche, status, category, reset controls, and filtered counts.

## v1.8.0 - 2026-06-12

### Added
- Added draft-only SEO article Improve and Regenerate actions with backend validation, editorial control support, and refreshed schema metadata.

## v1.7.0 - 2026-06-11

### Added
- Added SEO article editorial controls for tone, funnel stage, target persona, and CTA style across generic and product-led article generation.

### Fixed
- Added a Google OAuth runtime fallback so sign-in can still load the saved client ID when the newer public config route is not available on the deployed API yet.

## v1.6.10 - 2026-06-11

### Fixed
- Fixed Google sign-in so the storefront can load the saved OAuth client ID from the API at runtime instead of requiring a frontend rebuild.
- Added visible Google sign-in status messages when OAuth is inactive, still loading, or blocked by script/config errors.

## v1.6.9 - 2026-06-11

### Fixed
- Prevented the storefront from flashing starter placeholder products before live backend products finish loading.

## v1.6.8 - 2026-06-11

### Added
- Added product-editor controls to delete uploaded image files from the server-backed media library while removing them from the product gallery.

## v1.6.7 - 2026-06-11

### Fixed
- Fixed uploaded media URLs so new product image uploads use browser-safe `/uploads/` paths by default.
- Normalized older uploaded image URLs during rendering so previously saved localhost or Plesk preview upload links can display through the production `/uploads/` proxy.

## v1.6.6 - 2026-06-11

### Fixed
- Fixed admin settings hydration so saved `.env` values can reload even when a catalog, order, contact, or media request fails during startup.

## v1.6.5 - 2026-06-11

### Fixed
- Fixed API product validation so automotive/DriveCraft and newly-created store keys load from PostgreSQL instead of triggering a storefront fallback on reload.
- Documented the Plesk `dist` ownership repair for Vite copy permission errors during Git plugin deployment.

## v1.6.4 - 2026-06-10

### Fixed
- Fixed Plesk deployment EACCES permission error by setting `build.emptyOutDir: false` in Vite config so the build overwrites in-place instead of trying to delete the `dist/` directory.

## v1.6.2 - 2026-06-10

### Added
- Added a Plesk Git deployment troubleshooting guide with exact Git plugin fields, nginx proxy directives, deploy actions, verification commands, and recovery steps.

## v1.6.1 - 2026-06-10

### Changed
- Bumped the app version so production deployment/cache behavior can be verified after disabling Plesk smart static file processing.

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
