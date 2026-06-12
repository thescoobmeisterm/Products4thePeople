# NewFeatures Implementation TODO

Living checklist for implementing the specs in this directory. Mark items complete only after the
feature is implemented and verified. Prefer working top-to-bottom: closest to completion first,
then increasingly large/new platform areas.

Status key:
- `[ ]` Not started
- `[~]` In progress / partial
- `[x]` Implemented and tested

Testing key:
- Build: `npm run build`
- Typecheck: `npx tsc -b --noEmit`
- API: endpoint or local server verification
- Manual: browser/admin/storefront verification

---

## Current Baseline

- Current app version at audit time: `1.6.10`
- Latest implementation batch started: `1.8.0`
- Working tree at audit time: clean
- Implemented foundation: storefront/admin MVP, product CRUD, orders, customers, media library,
  Stripe/Medusa settings, Google sign-in support, Product Research MVP, Experimentation MVP,
  and SEO Hub MVP.

---

## 1. Finish Phase 5: Content & SEO Growth Engine

This is one of the closest specs to completion. Existing code already includes articles,
knowledge-base articles, SEO pages, product-led generators, public article/category pages,
SEO tracking, and dashboard stats.

- `[~]` AI Content Engine
  - `[x]` Article generation endpoint
  - `[x]` Product-led article generation endpoint
  - `[x]` Add richer editorial controls: tone, funnel stage, target persona, CTA style
  - `[x]` Add regenerate/improve actions for existing drafts
  - Test: `[x]` Build `[x]` Typecheck `[x]` API `[x]` Manual

- `[~]` SEO Hub
  - `[x]` Admin SEO Hub tab
  - `[x]` Article, KB, and SEO page admin lists
  - `[x]` SEO dashboard metrics
  - `[ ]` Add keyword/status/filter controls across all content lists
  - `[ ]` Add publish/unpublish workflow for SEO pages and KB articles
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Programmatic SEO
  - `[x]` Category SEO page generation
  - `[x]` Product-led sales page generation
  - `[ ]` Add bulk page generation by niche/category/product collection
  - `[ ]` Add canonical/meta/schema previews before publishing
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Knowledge Base
  - `[x]` KB storage and admin list
  - `[ ]` Public KB detail pages
  - `[ ]` KB category index/search
  - `[ ]` Internal links from product pages to relevant KB content
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Content Performance Dashboard
  - `[x]` Views, conversions, revenue, indexed URL summary
  - `[ ]` Add per-page trend windows
  - `[ ]` Add recommended actions for underperforming content
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 2. Finish Phase 2: Conversion Experimentation Engine

The experimentation MVP is already present with active experiment assignment, variant tracking,
simulation, stats, and winner promotion. Next work should harden it into the full spec.

- `[~]` A/B Testing Framework
  - `[x]` Homepage hero tests
  - `[x]` Product pricing/name tests
  - `[x]` Checkout threshold tests
  - `[ ]` Product title tests separate from pricing
  - `[ ]` Product image/video creative tests
  - `[ ]` Offer/bundle tests
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Experiment Dashboard
  - `[x]` Active/draft/completed experiment list
  - `[x]` Detail modal with core stats
  - `[x]` Confidence/significance display
  - `[ ]` Add test health flags: low traffic, uneven allocation, stale test
  - `[ ]` Add date range and niche filters
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Traffic Allocation
  - `[x]` Percent allocation field
  - `[x]` Local assignment persistence
  - `[ ]` Harden deterministic assignment for anonymous visitors
  - `[ ]` Add guardrails for changing allocation mid-test
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Winner Detection & Promotion
  - `[x]` Manual winner promotion
  - `[x]` Promotion updates storefront/product settings
  - `[ ]` Automatic winner detection job/endpoint
  - `[ ]` Store winner rationale and audit trail
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Analytics Integration
  - `[x]` Visitor/add-to-cart/checkout/purchase/email-capture tracking API
  - `[ ]` Wire checkout/purchase tracking more deeply into real Stripe order completion
  - `[ ]` Add experiment attribution to orders
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 3. Finish Phase 1: Conversion Optimization

Several conversion UX pieces exist, but the full storefront conversion layer is not done.

- `[~]` Homepage Optimization
  - `[x]` Hero/category/product storefront structure
  - `[x]` Trust/footer/newsletter basics
  - `[ ]` Formal best-sellers section by performance/inventory
  - `[ ]` User-generated-content section powered by media/admin content
  - `[ ]` Mission/value section per niche
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[~]` Product Page Optimization
  - `[x]` Product detail pages
  - `[x]` Product media galleries
  - `[ ]` Benefits block from product metadata
  - `[ ]` Product FAQ block
  - `[ ]` Reviews system and review summary
  - `[ ]` Product video section tied to media library
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Cart & Checkout Improvements
  - `[x]` Cart drawer
  - `[x]` Free shipping logic
  - `[ ]` Free shipping progress bar
  - `[ ]` Frequently bought together
  - `[ ]` Cart upsells
  - `[ ]` Sticky add-to-cart on mobile/product pages
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[~]` Trust & Social Proof
  - `[ ]` Social proof purchase/activity notifications
  - `[ ]` Inventory scarcity display
  - `[ ]` Product badges driven by metadata/performance
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[~]` Customer Experience
  - `[x]` Wishlist persistence
  - `[x]` Customer account center
  - `[ ]` Recently viewed products
  - `[ ]` Personalized recommendations
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[ ]` Email Capture & Retention
  - `[ ]` Exit intent popup
  - `[ ]` Mobile offer popup
  - `[ ]` Welcome flow capture storage and admin visibility
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 4. Finish Phase -1: Brand & Design System

The storefront has niche theming, but the full design-system spec is not yet a clean foundation.

- `[~]` Brand Foundations
  - `[x]` Multi-niche storefront theming
  - `[x]` DriveCraft/automotive storefront support
  - `[ ]` Audit each niche against the brand spec
  - `[ ]` Normalize theme variables and naming
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[ ]` Component Standards
  - `[ ]` Standardize buttons
  - `[ ]` Standardize product cards
  - `[ ]` Standardize trust elements
  - `[ ]` Standardize admin panel/card/table patterns where practical
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

- `[ ]` Performance & Visual QA
  - `[ ]` Mobile/desktop layout pass for all storefronts
  - `[ ]` Image sizing and lazy-loading audit
  - `[ ]` Contrast/readability audit
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` Manual

---

## 5. Finish Phase 0: Product Research Tool Backend

Phase 0 is mostly complete. Remaining work should harden integrations and make research outputs
more operational.

- `[~]` Opportunity Dashboard
  - `[x]` Persisted opportunities
  - `[x]` Score/status/filter UI
  - `[x]` Detail modal with scores, pricing, copy, suppliers
  - `[ ]` Add bulk status updates
  - `[ ]` Add archived/blocked cleanup views
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Research Engines
  - `[x]` Gap analysis seeding
  - `[x]` Demand scan action
  - `[x]` Competitor scan/action and registry
  - `[x]` Supplier search/import simulation
  - `[ ]` Plug in real third-party data providers when credentials are available
  - `[ ]` Add research run history detail view
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Import Approval Workflow
  - `[x]` Supplier product import into product draft/review queue
  - `[x]` Import job persistence
  - `[ ]` Add admin approval checklist UI before publish
  - `[ ]` Add compliance/risk blocking rules before publish
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[~]` Winner/Loser Feedback Loop
  - `[ ]` Feed product performance back into opportunity records
  - `[ ]` Mark imported products as testing/winner/loser from analytics
  - `[ ]` Show feedback loop history in opportunity detail
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 6. Implement Phase 3: Winning Product Intelligence System

This is a larger analytics/intelligence layer. Build after the operational Phase 0/1/2/5 gaps are
closed enough to provide reliable source data.

- `[ ]` Executive Dashboard
  - `[ ]` Business health overview
  - `[ ]` Revenue/order/traffic/product performance summaries
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Winning Products Dashboard
  - `[ ]` Product score algorithm
  - `[ ]` Product leaderboard
  - `[ ]` Winner/loser classification
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Creative Intelligence
  - `[ ]` Image/video/UGC performance dashboard
  - `[ ]` Creative winner detection
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Offer Intelligence
  - `[ ]` Offer leaderboard
  - `[ ]` Offer recommendations
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Customer Intelligence
  - `[ ]` High-value customer segment
  - `[ ]` Repeat-buyer segment
  - `[ ]` At-risk customer segment
  - `[ ]` New-customer segment
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Recommendation Center & Alerts
  - `[ ]` Product recommendations
  - `[ ]` Creative recommendations
  - `[ ]` Offer recommendations
  - `[ ]` Inventory alerts
  - `[ ]` Declining product/refund risk alerts
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 7. Implement Phase 4: Affiliate & Creator Ecosystem

This needs new data models, tracking, public/creator surfaces, and admin workflows.

- `[ ]` Affiliate Portal
  - `[ ]` Affiliate accounts
  - `[ ]` Referral links/codes
  - `[ ]` Affiliate performance dashboard
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Commission Engine
  - `[ ]` Commission rules
  - `[ ]` Order attribution
  - `[ ]` Payout status tracking
  - `[ ]` Refund/chargeback handling
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Creator Dashboard
  - `[ ]` Creator profile
  - `[ ]` Assigned products/campaigns
  - `[ ]` Creator performance metrics
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` UGC Submission Portal
  - `[ ]` Upload/submit UGC assets
  - `[ ]` Review/approve workflow
  - `[ ]` Connect approved UGC to storefront/media sections
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Creator Recruitment & Marketplace
  - `[ ]` Creator application flow
  - `[ ]` Admin recruitment pipeline
  - `[ ]` Creator marketplace browsing/filtering
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## 8. Implement Phase 6: Marketplace & Omnichannel Expansion

This is the furthest out and should follow stronger catalog, analytics, inventory, and fulfillment
foundations.

- `[ ]` Marketplace Expansion Hub
  - `[ ]` Admin hub
  - `[ ]` Channel connection status
  - `[ ]` Channel readiness checklist
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Unified Product Catalog
  - `[ ]` Marketplace listing metadata per product
  - `[ ]` Channel-specific titles/descriptions/images
  - `[ ]` Listing validation rules
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Inventory Synchronization
  - `[ ]` Shared inventory ledger
  - `[ ]` Channel inventory sync status
  - `[ ]` Low-stock/oversell protection
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Order Consolidation
  - `[ ]` Marketplace order ingestion model
  - `[ ]` Unified fulfillment status
  - `[ ]` Channel order dashboard
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Marketplace Analytics
  - `[ ]` Channel revenue/profit dashboard
  - `[ ]` Top marketplace products
  - `[ ]` Recommended marketplace actions
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

- `[ ]` Listing Optimization & Supplier Intelligence
  - `[ ]` Listing optimization recommendations
  - `[ ]` Supplier reliability/cost intelligence
  - `[ ]` Inventory forecasting
  - Test: `[ ]` Build `[ ]` Typecheck `[ ]` API `[ ]` Manual

---

## Release Checklist For Each Implementation Batch

Use this only when actual code changes are made.

- `[ ]` Read `agents/AGENT_VERSIONING_RELEASE_PROTOCOL.md`
- `[ ]` Classify change type
- `[ ]` Implement scoped feature batch
- `[ ]` Run `npx tsc -b --noEmit`
- `[ ]` Run `npm run build`
- `[ ]` Perform relevant manual/browser/API checks
- `[ ]` Bump `src/lib/version.ts`
- `[ ]` Update `docs/CHANGELOG.md`
- `[ ]` Commit as `release: vX.Y.Z - <summary>`
- `[ ]` Tag and push
- `[ ]` Verify deployment
