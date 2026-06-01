# Medusa Integration

This admin UI is Medusa-aware through `@medusajs/js-sdk`, while the MVP persistence layer is a
PostgreSQL API in `server/index.ts`.

## Current State

- The app runs locally at `http://localhost:5173`.
- The Products4ThePeople API runs at `http://localhost:4000`.
- The Medusa connection panel defaults to `http://localhost:9000`.
- Product sync can pull products from Medusa Admin API and persist them into PostgreSQL.
- Order sync can pull Medusa orders and persist them into PostgreSQL.
- Checkout confirmations write orders and contact capture records through the Order API.

## Backend Requirement

The MVP API requires PostgreSQL through `DATABASE_URL`. Medusa also requires PostgreSQL for a local
backend. This machine currently does not have `psql`, `createdb`, or Docker available on PATH, so a
live Postgres-backed run cannot be verified here yet.

## Products4ThePeople API

Copy `.env.example` to `.env`, set `DATABASE_URL`, then run:

```powershell
npm.cmd run dev:api
```

The API exposes:

```text
GET    /api/products
PUT    /api/products
POST   /api/products/bulk
POST   /api/products/replace
PATCH  /api/products/:id/status
DELETE /api/products/:id
GET    /api/orders
POST   /api/orders
POST   /api/orders/bulk
PATCH  /api/orders/:id/status
GET    /api/contacts
GET    /api/medusa/health
GET    /api/medusa/products
```

## Recommended Scaffold

After PostgreSQL is installed and running:

```powershell
npx.cmd create-medusa-app@latest p4tp-medusa --directory-path apps --use-npm --no-browser
```

The Medusa backend will be created under:

```text
apps/p4tp-medusa/apps/backend
```

Medusa should run at:

```text
http://localhost:9000
http://localhost:9000/app
```

## Admin UI Configuration

Copy `.env.example` to `.env` and set:

```text
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_ADMIN_API_KEY=
DATABASE_URL=postgres://postgres:postgres@localhost:5432/products4thepeople
VITE_API_BASE_URL=/api
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_KEY=
```

An admin API key can be added once the Medusa backend is running and configured.
