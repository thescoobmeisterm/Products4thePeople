# Products4ThePeople — Agent Instructions

> **Read this file on every conversation.** It is the canonical source of context, rules, and
> conventions for any AI agent working in this codebase.

---

## Project Overview

**Products4ThePeople** is a multi-niche e-commerce platform targeting viral, high-margin consumer
products across verticals: beauty, pets, home, fitness, and automotive (DriveCraft). The platform
runs as a Vite + React + TypeScript SPA with a PostgreSQL-backed Express API, Medusa JS SDK
integration, and Stripe Checkout.

| Layer       | Stack                               | Entry Point                         |
|-------------|--------------------------------------|-------------------------------------|
| Frontend    | Vite 7, React 19, TypeScript         | `src/main.tsx`, `src/styles.css`    |
| API Server  | Express 5, TypeScript, PostgreSQL    | `server/index.ts`                   |
| Checkout    | Express, Stripe SDK                  | `server/checkout-server.mjs`        |
| Deploy      | GitHub Pages (static), VPS (API)     | `.github/workflows/deploy.yml`      |

### Key URLs

- **Live Site:** `https://products4thepeople.com` (+ subdomain storefronts)
- **GitHub Pages:** Static build served from `dist/`
- **Admin Portal:** Client-side gated behind `VITE_ADMIN_EMAIL`/`VITE_ADMIN_PASSWORD`

---

## ⚠️ Mandatory Protocols

### Versioning & Release

**Before finalizing ANY code changes**, you must follow the full release protocol documented in:

📄 [`agents/AGENT_VERSIONING_RELEASE_PROTOCOL.md`](agents/AGENT_VERSIONING_RELEASE_PROTOCOL.md)

Quick summary:
1. Read current version from `src/lib/version.ts`
2. Classify the change (feat/fix/style/refactor/etc.)
3. Apply changes → verify build → bump version → update changelog
4. Commit as `release: vX.Y.Z — <summary>`
5. Tag + push to GitHub
6. Verify deployment

**An update is NOT complete until all steps succeed.**

### Version File

The single source of truth is:

```
src/lib/version.ts
```

Never hard-code version numbers elsewhere. All admin UI surfaces import from this file.

---

## Project Structure

```
Products4thePeople/
├── agents/                    # Agent protocols & instructions
│   └── AGENT_VERSIONING_RELEASE_PROTOCOL.md
├── docs/                      # Documentation
│   ├── CHANGELOG.md           # Version history (Keep a Changelog format)
│   ├── MEDUSA.md              # Medusa backend setup
│   └── MEDUSA_LIVE_DEPLOYMENT.md
├── NewFeatures/               # Phase specs (roadmap)
│   ├── Phase0_*.md            # Product research tool backend
│   ├── PHASE-1_*.md           # Brand design system
│   ├── PHASE1_*.md            # Conversion optimization
│   ├── PHASE2_*.md            # Experimentation engine
│   ├── PHASE3_*.md            # Winning product intelligence
│   ├── PHASE4_*.md            # Affiliate ecosystem
│   ├── PHASE5_*.md            # Content SEO growth engine
│   └── PHASE6_*.md            # Marketplace omnichannel
├── src/
│   ├── main.tsx               # Monolithic frontend (all views/components)
│   ├── styles.css             # Global styles + brand theming
│   └── lib/
│       ├── api.ts             # API client functions
│       ├── medusa.ts          # Medusa SDK wrapper
│       └── version.ts         # ← CANONICAL VERSION SOURCE
├── server/
│   ├── index.ts               # Express API (products, orders, customers, analytics)
│   └── checkout-server.mjs    # Stripe checkout session server
├── public/                    # Static assets
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages CI/CD
├── package.json               # Dependencies + scripts (version field synced)
├── vite.config.ts             # Vite build configuration
├── Seed.csv                   # Initial product catalog seed data
└── P4tP_EcommercePlatform_FlexBuildSpecs.md  # Platform spec document
```

---

## Architecture Conventions

### Frontend (src/main.tsx)

The frontend is currently a **single-file monolith**. All React components, state management,
routing logic, and utility functions live in `src/main.tsx`. This is intentional for rapid
iteration during the MVP phase.

When adding features:
- Add new components inline within `src/main.tsx`
- Follow the existing pattern of hash-based routing (`#general`, `#beauty`, `#admin`, `#product/...`)
- Use the existing state management patterns (React hooks, local state)
- Import shared utilities from `src/lib/`

### Backend (server/index.ts)

The API server handles:
- Product CRUD + CSV import/export
- Order management
- Customer / contact capture
- Content SEO articles & pages
- Conversion experimentation engine
- Analytics & tracking

All database operations use the `pg` driver with direct SQL queries.

### Styling (src/styles.css)

- Uses CSS custom properties for brand theming per niche
- Dynamic theme variables applied via React storefront render container
- Mobile-first responsive design

---

## Development Commands

```bash
# Install dependencies
npm install

# Start API server (development)
npm run dev:api

# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start checkout server (production)
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

| Variable                | Purpose                        |
|-------------------------|--------------------------------|
| `VITE_ADMIN_EMAIL`      | Admin login email              |
| `VITE_ADMIN_PASSWORD`   | Admin login password           |
| `DATABASE_URL`          | PostgreSQL connection string   |
| `STRIPE_SECRET_KEY`     | Stripe API secret key          |
| `MEDUSA_BACKEND_URL`    | Medusa backend URL             |

---

## Commit Conventions

All commits should follow this format:

```
<type>: <description>
```

Types: `feat`, `fix`, `style`, `refactor`, `perf`, `docs`, `chore`, `breaking`

Release commits specifically:
```
release: vX.Y.Z — <brief summary>
```

---

## Roadmap Priority

Current implementation phases (see `NewFeatures/` for detailed specs):

1. ~~Phase 0: Foundation~~ ✅
2. ~~Phase 1: MVP Stabilization & Simulators~~ ✅
3. ~~Phase 2: Google Auth & Customer Portals~~ ✅
4. ~~Phase 3: Storefront UX & Conversion Features~~ ✅
5. **Phase 0 (Backend):** Product research tool backend ← current focus
6. Phase 1 (Conversion): Conversion optimization implementation
7. Phase 2: Conversion experimentation engine
8. Phase 3: Winning product intelligence system
9. Phase 4: Affiliate creator ecosystem
10. Phase 5: Content SEO growth engine
11. Phase 6: Marketplace omnichannel expansion

---

## Quality Gates

Before any push to `main`:

- [ ] TypeScript compiles without errors (`npx tsc -b --noEmit`)
- [ ] Vite build succeeds (`npm run build`)
- [ ] No console errors in browser during manual testing
- [ ] Version bumped per protocol
- [ ] Changelog updated

---

## Important Notes

1. **Monolith is intentional.** Don't refactor `main.tsx` into separate files unless explicitly asked.
2. **PostgreSQL is required.** The API server expects a running PostgreSQL instance.
3. **Admin auth is client-side MVP.** It's a development gate, not production security.
4. **GitHub Pages serves the static SPA.** The API runs separately on the VPS.
5. **All 6 niche storefronts share the same codebase** with brand theming via CSS custom properties.
