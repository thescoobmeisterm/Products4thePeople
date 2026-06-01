# Products4ThePeople Ecommerce Platform (Flexible Build Spec)

## Purpose

Develop a scalable, AI-extendable ecommerce platform for:

**Products4ThePeople.com**

The system should leverage an existing open-source ecommerce framework (recommended: MedusaJS or similar), while allowing Antigravity to:

* modify architecture
* optimize performance
* extend features
* replace components where beneficial

⚠️ IMPORTANT:
This is a **guideline, not a constraint**.
Antigravity should make improvements where appropriate.

---

# CORE PHILOSOPHY

* Speed > perfection
* Modular > rigid
* Scalable > temporary
* Testability > complexity

---

# FOUNDATION (FLEXIBLE)

## Suggested Base (Not Required)

* MedusaJS (preferred)
* Vendure (alternative)
* Custom Node/Next stack (if better)

Antigravity may:

* fork
* hybridize
* or rebuild portions

---

# SYSTEM ARCHITECTURE

## REQUIRED CONCEPT

A **shared backend with multiple niche storefronts**

### Subdomains:

* beauty.products4thepeople.com
* pets.products4thepeople.com
* home.products4thepeople.com
* fitness.products4thepeople.com

### Backend:

Must support:

* products (shared)
* orders (shared)
* customers (shared)
* inventory (shared)
* analytics (shared)

### Frontend:

Each subdomain:

* displays only assigned products
* has niche-specific branding
* shares checkout system

---

# FLEXIBLE TECH STACK

Antigravity can choose best options, but suggested:

Frontend:

* Next.js (preferred)
* or equivalent SSR framework

Backend:

* Node.js / TypeScript
* or framework-native backend (Medusa/Vendure)

Database:

* PostgreSQL (preferred)
* or equivalent

Caching:

* Redis (optional but recommended)

---

# CRITICAL FEATURES (NON-NEGOTIABLE)

## 1. PRODUCT IMPORT SYSTEM

Must support:

### URL Import (HIGH PRIORITY)

* input: AliExpress product URL
* auto-fetch:

  * title
  * images
  * description
  * variants
  * pricing

### CSV Import

Fields:

* name
* description
* cost
* shipping_cost
* retail_price
* images
* variants
* category
* subdomain

### Manual Entry

* full admin control
* AI-assisted generation

---

## 2. SALES FUNNEL SYSTEM

### Email Capture

* spinning discount wheel
* exit intent trigger
* delay trigger
* mobile optimized

### Funnel Flow

1. Landing page
2. Email capture
3. Product page
4. Cart upsell
5. Checkout
6. Post-purchase upsell

---

## 3. ECOMMERCE CORE

Cart:

* save for later
* persistent cart
* multi-device sync

Checkout:

* one-page checkout
* Stripe integration
* Apple Pay / Google Pay

Customer:

* accounts
* order history
* wishlist

---

## 4. OFFER ENGINE

Support:

* discounts
* bundles
* BOGO
* free shipping thresholds

Antigravity may enhance:

* dynamic pricing
* AI-driven offers

---

## 5. CONTENT OPTIMIZATION

System should support:

* video-first product pages
* fast media loading
* mobile-first design

Business requirement:

* high-volume content testing (TikTok/Reels)

---

# AI INTEGRATION (EXTENSIBLE)

Implement or allow:

* AI product descriptions
* AI SEO metadata
* AI ad script generation
* AI email flows

Antigravity may:

* enhance with better models
* optimize prompts
* automate workflows

---

# PRODUCT DATABASE (INITIAL SEED)

## BEAUTY

* LED Face Mask
* Heatless Curlers
* Ice Roller
* Scalp Massager
* Cleansing Brush
* Satin Hair Wrap
* LED Neck Mask
* Blackhead Vacuum
* Eye Patches

## PETS

* Dog Water Bottle
* Calming Dog Bed
* Pet Hair Remover
* Automatic Feeder
* Dog Seat Cover
* LED Dog Collar
* Lick Mat
* Cat Laser Toy
* Paw Cleaner

AliExpress pattern:
https://www.aliexpress.us/w/wholesale-[product].html

---

# ADMIN DASHBOARD

Must include:

* product manager
* order manager
* customer manager
* analytics dashboard
* import tools

Antigravity may enhance UX/UI.

---

# MARKETING INTEGRATIONS

Support:

* TikTok Pixel
* Meta Pixel
* Google Analytics
* Pinterest Pixel

---

# PERFORMANCE TARGETS

* load time under 2 seconds
* mobile optimized
* CDN enabled
* scalable infrastructure

---

# POS READINESS

Prepare for:

* Stripe Terminal
* local sales
* inventory sync

(No need to fully implement yet)

---

# LAUNCH STRATEGY

## Phase 1

Launch:
beauty.products4thepeople.com

## Phase 2

Launch:
pets.products4thepeople.com

---

# EXECUTION SYSTEM (BUSINESS SIDE)

## Content Engine

* 3–8 videos/day per niche

## Testing

* multiple hooks per product
* kill underperformers fast

## Scaling

* push winning products
* increase AOV via bundles

---

# FLEXIBILITY CLAUSE

Antigravity is encouraged to:

* improve architecture
* replace inefficient components
* optimize performance
* enhance UI/UX
* introduce better tools or frameworks

As long as core requirements are preserved.

---

# END GOAL

A system that:

* launches products rapidly
* scales winning products
* captures customer data
* supports multi-niche expansion
* evolves into a long-term ecommerce brand

---

# CORE PRINCIPLE

Test → Optimize → Scale
