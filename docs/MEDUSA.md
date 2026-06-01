# Medusa Integration

This admin UI is Medusa-aware through `@medusajs/js-sdk`.

## Current State

- The app runs locally at `http://localhost:5173`.
- The Medusa connection panel defaults to `http://localhost:9000`.
- Product sync can pull products from Medusa Admin API into the local admin catalog.
- Local storage remains the fallback until a Medusa backend and PostgreSQL database are running.

## Backend Requirement

Medusa requires PostgreSQL for a local backend. This machine currently does not have `psql`,
`createdb`, or Docker available, so the backend cannot run yet.

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
```

An admin API key can be added once the Medusa backend is running and configured.
