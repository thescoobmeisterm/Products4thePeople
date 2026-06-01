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
- Browser persistence through local storage until the backend is connected
- Medusa JS SDK integration with backend connection testing and product sync

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Then open `http://localhost:5173`.

## Medusa Backend

See [docs/MEDUSA.md](docs/MEDUSA.md) for the backend scaffold steps. PostgreSQL is required before
the Medusa server can run locally.

## Build

```powershell
npm.cmd run build
```
