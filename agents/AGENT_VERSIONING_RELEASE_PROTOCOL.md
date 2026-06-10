# AGENT VERSIONING & RELEASE PROTOCOL

> **Applies to:** Every AI agent session operating on the Products4ThePeople codebase.
> **Authority:** This document is the single source of truth for how version numbers are managed,
> changelogs are maintained, commits are formatted, and releases are shipped.

---

## 1 · Purpose

Ensure every AI agent update is **traceable**, **versioned**, and **synchronized** with GitHub
deployments so that the team always knows exactly what is running in production and can roll back
safely if needed.

---

## 2 · Versioning Scheme

### 2.1 Format

```
MAJOR.MINOR.PATCH
```

| Segment | Increments when…                                                       | Examples          |
|---------|-------------------------------------------------------------------------|-------------------|
| MAJOR   | Breaking changes, architectural rewrites, or platform migrations        | `1.0.0 → 2.0.0`  |
| MINOR   | New features, significant UI changes, new API endpoints, new pages      | `1.2.0 → 1.3.0`  |
| PATCH   | Bug fixes, copy changes, style tweaks, dependency bumps, doc updates    | `1.3.0 → 1.3.1`  |

> **Default rule:** If you are unsure, increment PATCH. Err on the side of caution.

### 2.2 Single Source of Truth

The canonical version lives in **one file only**:

```
src/lib/version.ts
```

```typescript
/** Canonical app version — bump on every release */
export const APP_VERSION = "1.0.0";

/** ISO-8601 timestamp of the last release */
export const APP_UPDATED_AT = "2026-06-04T18:23:00-04:00";
```

All UI surfaces (Admin footer, Settings panel, API health endpoints) **must import from this file**.
Never hard-code version strings elsewhere.

### 2.3 Package.json Sync

`package.json` → `"version"` field must stay in sync with `APP_VERSION` (without the `v` prefix).
This is enforced in Step 3 of the Release Workflow.

---

## 3 · Change Classification

Before starting work, classify the change so you know which version segment to bump.

| Classification       | Version Bump | Examples                                                                     |
|----------------------|--------------|------------------------------------------------------------------------------|
| `feat`               | MINOR        | New admin panel page, new API endpoint, new storefront section               |
| `fix`                | PATCH        | Bug fix, typo correction, broken link                                        |
| `style`              | PATCH        | CSS-only changes, color updates, spacing fixes                               |
| `refactor`           | PATCH        | Code restructuring with no behavior change                                   |
| `perf`               | PATCH        | Performance improvements                                                     |
| `docs`               | PATCH        | Documentation-only changes                                                   |
| `chore`              | PATCH        | Dependency updates, config changes, tooling                                  |
| `breaking`           | MAJOR        | Removing APIs, changing DB schemas incompatibly, dropping features            |

---

## 4 · Release Workflow

Every completed update must follow **all seven steps in order**. The update is **not complete**
until every step succeeds.

### Step 1 — Pre-Flight Checklist

Before touching code, verify:

- [ ] You have read this protocol
- [ ] You know the current version (`src/lib/version.ts`)
- [ ] You know what type of change you're making (see §3)
- [ ] The working tree is clean (`git status`)

### Step 2 — Apply Code Changes

Make your changes across the codebase. Follow project conventions:

- **Frontend:** `src/main.tsx`, `src/styles.css`, `src/lib/*`
- **Backend:** `server/index.ts`, `server/checkout-server.mjs`
- **Config:** `vite.config.ts`, `tsconfig.json`, `.env.example`
- **Docs:** `docs/*`, `README.md`, `NewFeatures/*`

### Step 3 — Verify Build Health

Run the full verification suite:

```bash
# Type check
npx tsc -b --noEmit

# Build
npm run build
```

**Do not proceed if any check fails.** Fix the issue first.

### Step 4 — Bump Version

Update **both** files atomically:

1. `src/lib/version.ts` — Update `APP_VERSION` and `APP_UPDATED_AT`
2. `package.json` — Update `"version"` field to match

```typescript
// src/lib/version.ts
export const APP_VERSION = "1.3.0";  // ← new version
export const APP_UPDATED_AT = "2026-06-04T22:30:00-04:00";  // ← current timestamp
```

### Step 5 — Update Changelog

Append a new entry to the **top** of `docs/CHANGELOG.md`:

```markdown
## v1.3.0 — 2026-06-04

### Added
- New conversion experimentation engine with A/B variant tracking
- Winning product intelligence dashboard

### Fixed
- Stripe checkout session not collecting shipping address

### Changed
- Upgraded Stripe SDK to v22.2.0
```

Use [Keep a Changelog](https://keepachangelog.com/) categories:
`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

### Step 6 — Commit & Tag

Use structured commit messages:

```bash
git add -A
git commit -m "release: v1.3.0 — <brief summary>"
git tag v1.3.0
```

Commit message examples:
- `release: v1.3.0 — conversion experimentation engine`
- `release: v1.3.1 — fix Stripe checkout shipping collection`
- `release: v2.0.0 — platform migration to Medusa backend`

### Step 7 — Push & Verify Deployment

```bash
git push origin main
git push origin v1.3.0
```

After push, confirm:
- [ ] GitHub Actions build passes (`.github/workflows/deploy.yml`)
- [ ] Application is accessible and healthy
- [ ] Version displayed in Admin portal matches the new version
- [ ] Changelog is accurate and accessible

---

## 5 · Admin Portal Display Requirements

### Desktop — Footer

```
Products4ThePeople Admin · v1.3.0
```

### Mobile — Settings Menu

```
Version v1.3.0
Last Updated: 2026-06-04 22:30 UTC
```

### API Health Endpoint (Optional)

```json
{
  "status": "ok",
  "version": "1.3.0",
  "updatedAt": "2026-06-04T22:30:00-04:00"
}
```

---

## 6 · Failure Handling & Rollback

If any step fails:

1. **Stop** the release process immediately
2. **Log** the error with full context
3. **Preserve** the previous version — do not leave the version in an incremented but un-shipped state
4. **Revert** if partial changes were committed:

```bash
git revert HEAD
git tag -d v1.3.0           # delete local tag
git push origin :v1.3.0     # delete remote tag if pushed
```

5. **Notify** the administrator with:
   - What failed
   - Which step failed
   - The error message
   - What was reverted

---

## 7 · Required File Structure

```
Products4thePeople/
├── agents/
│   └── AGENT_VERSIONING_RELEASE_PROTOCOL.md   ← this file
├── docs/
│   └── CHANGELOG.md                           ← version history
├── src/
│   └── lib/
│       └── version.ts                         ← canonical version source
├── .github/
│   └── workflows/
│       └── deploy.yml                         ← CI/CD pipeline
└── package.json                               ← version field (synced)
```

---

## 8 · Agent Enforcement Policy

The AI development agent **MUST**, on every session that produces code changes:

1. Read current version from `src/lib/version.ts`
2. Classify the change (§3)
3. Apply code changes (Step 2)
4. Verify build health (Step 3)
5. Bump version appropriately (Step 4)
6. Update changelog (Step 5)
7. Commit with structured message & tag (Step 6)
8. Push to GitHub & verify deployment (Step 7)
9. Confirm displayed version matches repository version

**An update is NOT considered complete until all steps succeed.**

---

## 9 · Multi-Session Batching

When multiple changes happen in a single session:

- Batch all changes into **one version bump**
- The version bump reflects the **highest priority change** (MAJOR > MINOR > PATCH)
- The changelog entry lists all changes made in the session
- Only one commit + tag at the end of the session

---

## 10 · Definition of Done

An agent update is complete only when:

| ✓ | Criteria                                          |
|---|---------------------------------------------------|
| ☐ | Code changes applied and working                  |
| ☐ | Build passes with no errors                       |
| ☐ | Version incremented in `src/lib/version.ts`       |
| ☐ | Version synced in `package.json`                  |
| ☐ | Changelog updated in `docs/CHANGELOG.md`          |
| ☐ | Git committed with `release: vX.Y.Z` format       |
| ☐ | Git tag created                                   |
| ☐ | Pushed to GitHub                                  |
| ☐ | Deployment verified                               |
| ☐ | Admin portal displays correct version             |

Failure of any criterion means the release is **incomplete**.
