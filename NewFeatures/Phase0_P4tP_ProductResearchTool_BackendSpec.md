# Products4ThePeople Backend Product Research Tool Spec

## Purpose

Build an internal admin tool that continuously evaluates the current product catalog, identifies gaps by niche/storefront, researches demand and competitor signals, and recommends profitable AliExpress products with a one-click import workflow.

This tool should support the Products4ThePeople multi-niche ecommerce platform, shared backend, and rapid product testing strategy.

---

## Core Goal

Help the team answer four questions fast:

1. What products are we missing in each niche?
2. Which products are currently showing demand?
3. Which competitor products appear to be selling well?
4. Which AliExpress listings are worth importing, testing, and scaling?

The tool should turn product research into a repeatable system instead of manual guessing.

---

## Fit With Existing Platform

This feature should live inside the admin dashboard as a new section:

**Admin → Product Research**

It should connect to:

- Product database
- Orders database
- Customer behavior analytics
- Niche/subdomain assignment system
- Import tools
- AI content generation tools
- Offer engine
- Supplier/import pipeline

The existing platform already prioritizes product imports, AliExpress URL import, CSV import, AI product descriptions, SEO metadata, ad scripts, analytics, multi-niche storefronts, and rapid testing. This tool should extend those capabilities rather than replace them.

---

## Main Admin Tabs

### 1. Opportunity Dashboard

Shows a high-level overview of recommended opportunities.

Display cards for:

- Best products to add next
- Product gaps by niche
- Trending product categories
- Products with strong competitor signals
- Products with high margin potential
- Products that fit current store branding
- Products that pair well with existing items
- Products that should be avoided

Each recommendation should include:

- Product name
- Niche
- Suggested storefront/subdomain
- Opportunity score
- Demand score
- Competition score
- Margin score
- Supplier quality score
- Content potential score
- Risk score
- Recommended action

Recommended actions:

- Import now
- Add to watchlist
- Research more
- Skip
- Replace existing product
- Bundle with current product

---

### 2. Catalog Gap Finder

Compares current products against each niche strategy.

For each niche, detect missing product types:

- Entry-level impulse products
- Hero products
- Bundle-friendly products
- Upsell products
- Repeat-purchase products
- Giftable products
- Viral/demo-friendly products
- High-AOV products
- Lightweight/free-shipping products

Example for beauty:

- Current: LED face mask, scalp massager, ice roller
- Gap: skincare storage, beauty fridge, gua sha set, facial steamer, makeup organizer

Example for pets:

- Current: dog water bottle, calming bed, lick mat
- Gap: travel harness, grooming gloves, pet camera, poop bag holder, slow feeder bowl

The tool should show:

- Current catalog coverage
- Missing category clusters
- Suggested products to fill each gap
- Bundle ideas from current + recommended products

---

### 3. Demand Research Engine

The tool should collect demand signals from multiple sources.

Potential sources:

- Internal site search terms
- Product page views
- Add-to-cart rate
- Checkout conversion rate
- Abandoned cart rate
- Wishlist saves
- Customer questions
- Product reviews
- TikTok/Instagram trend notes entered manually
- Google Trends integration if available
- Marketplace search volume if accessible
- Competitor bestseller pages where accessible
- Manual research URLs added by admin

Demand signals to track:

- Search volume trend
- Social content potential
- Pain point strength
- Buyer urgency
- Seasonality
- Giftability
- Repeat purchase potential
- Problem/solution clarity
- Demo potential

Output:

- Demand score from 0–100
- Short demand explanation
- Suggested content angles
- Buyer persona notes
- Seasonality warning if relevant

---

### 4. Competitor Research Engine

Allow admins to add competitor stores and product URLs.

Competitor data to capture when possible:

- Product title
- Product URL
- Price
- Sale price
- Reviews count
- Review rating
- Claimed units sold if visible
- Product images
- Offer style
- Bundles
- Shipping promise
- Upsells
- Landing page structure
- Ad angle notes
- Trust elements
- Product variants

Important: scrape only publicly accessible data and respect robots.txt, marketplace terms, rate limits, and legal restrictions. If direct scraping is not allowed, support manual entry, browser extension capture, or third-party compliant data providers.

Competitor signal score should consider:

- Review count
- Rating quality
- Pricing power
- Number of variants
- Strength of offer
- Number of visible competitors
- Similarity to our niche strategy
- Estimated ability to differentiate

Output:

- Competitor sales signal score from 0–100
- Top competing products
- Price range map
- Differentiation suggestions
- Better positioning angle

---

### 5. AliExpress Product Finder

Search AliExpress for recommended products using generated search terms.

Input methods:

- Product idea from gap finder
- Keyword search
- Competitor product URL
- Existing product match
- Manual AliExpress URL
- Bulk CSV of product ideas

AliExpress data to capture where available:

- Product URL
- Title
- Main images
- Variant images
- Description
- Supplier/store name
- Supplier rating
- Product rating
- Review count
- Units sold if visible
- Price range
- Shipping cost
- Estimated delivery time
- Available variants
- Countries shipped to
- Return policy notes

Ranking criteria:

- Low landed cost
- Strong review count
- Strong product rating
- Supplier reliability
- Good images/video
- Reasonable delivery time
- Clear variant structure
- Margin potential
- Fits niche/storefront
- Avoids restricted or risky claims

---

## One-Click Import Workflow

Each recommended AliExpress product should have an **Import Product** button.

### Import Button States

- `Import Product`
- `Importing...`
- `Needs Review`
- `Imported`
- `Failed`

### Import Flow

When clicked:

1. Fetch product data from AliExpress URL.
2. Save supplier listing to `supplier_products`.
3. Generate optimized product title.
4. Generate SEO description.
5. Generate short product page bullets.
6. Generate TikTok/Reels hook ideas.
7. Generate Meta/TikTok ad copy.
8. Calculate recommended retail price.
9. Suggest compare-at price.
10. Suggest bundles/upsells.
11. Assign niche and subdomain.
12. Download/store product images.
13. Create product draft in backend.
14. Mark product as `Needs Review`.
15. Notify admin to approve/publish.

Do not auto-publish by default. Imported products should enter a review queue first.

---

## Product Scoring System

Every product recommendation should receive a total score from 0–100.

### Suggested Score Formula

```text
Total Opportunity Score =
  Demand Score * 0.25 +
  Margin Score * 0.20 +
  Supplier Score * 0.15 +
  Competition Signal Score * 0.15 +
  Brand Fit Score * 0.10 +
  Content Potential Score * 0.10 -
  Risk Penalty * 0.05
```

### Score Definitions

#### Demand Score
Measures how likely customers are to want the product.

Factors:

- Trend signals
- Internal search data
- Competitor validation
- Social media demo potential
- Problem/solution clarity

#### Margin Score
Measures profit potential.

Factors:

- Product cost
- Shipping cost
- Expected retail price
- Target margin
- Bundle potential

#### Supplier Score
Measures fulfillment confidence.

Factors:

- Supplier rating
- Product rating
- Reviews
- Shipping speed
- Variant clarity
- Image quality

#### Competition Signal Score
Measures whether other sellers appear to be successfully selling similar products.

Factors:

- Review volume
- Offer quality
- Visible demand
- Pricing range
- Market saturation

#### Brand Fit Score
Measures whether the product fits Products4ThePeople niche stores.

Factors:

- Niche alignment
- Storefront fit
- Customer persona fit
- Visual brand fit
- Bundle fit

#### Content Potential Score
Measures how easy it is to create viral or conversion-focused content.

Factors:

- Before/after potential
- Demo clarity
- Problem pain level
- Visual transformation
- TikTok/Reels hook strength

#### Risk Penalty
Subtracts points for product risk.

Risk factors:

- Medical claims
- Beauty/health compliance issues
- Electronics safety concerns
- Fragile shipping
- Long delivery time
- High refund likelihood
- Trademark/copyright concerns
- Overly saturated product
- Low review quality

---

## Recommended Product Statuses

Use statuses to manage the research pipeline.

```text
discovered
researching
watchlist
recommended
imported_draft
approved
published
testing
winner
loser
archived
blocked
```

---

## Database Model

### `product_research_opportunities`

```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
niche TEXT NOT NULL
subdomain TEXT
category TEXT
source TEXT
source_url TEXT
status TEXT DEFAULT 'discovered'
opportunity_score NUMERIC
recommendation_summary TEXT
demand_score NUMERIC
margin_score NUMERIC
supplier_score NUMERIC
competition_score NUMERIC
brand_fit_score NUMERIC
content_score NUMERIC
risk_score NUMERIC
risk_notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `competitor_products`

```sql
id UUID PRIMARY KEY
opportunity_id UUID REFERENCES product_research_opportunities(id)
competitor_name TEXT
competitor_url TEXT
product_title TEXT
price NUMERIC
compare_at_price NUMERIC
rating NUMERIC
review_count INTEGER
sales_signal TEXT
offer_notes TEXT
positioning_notes TEXT
images JSONB
captured_at TIMESTAMP
```

### `supplier_products`

```sql
id UUID PRIMARY KEY
opportunity_id UUID REFERENCES product_research_opportunities(id)
supplier_platform TEXT DEFAULT 'aliexpress'
supplier_name TEXT
supplier_url TEXT
product_url TEXT NOT NULL
title TEXT
price_min NUMERIC
price_max NUMERIC
shipping_cost NUMERIC
rating NUMERIC
review_count INTEGER
orders_count INTEGER
estimated_delivery_days INTEGER
variants JSONB
images JSONB
description_raw TEXT
supplier_score NUMERIC
import_status TEXT DEFAULT 'not_imported'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `research_runs`

```sql
id UUID PRIMARY KEY
run_type TEXT
niche TEXT
query TEXT
status TEXT
started_at TIMESTAMP
completed_at TIMESTAMP
results_count INTEGER
error_message TEXT
metadata JSONB
```

### `product_import_jobs`

```sql
id UUID PRIMARY KEY
supplier_product_id UUID REFERENCES supplier_products(id)
created_product_id UUID
status TEXT DEFAULT 'queued'
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT
import_payload JSONB
```

---

## API Routes

Suggested backend routes:

```text
GET    /admin/product-research/opportunities
POST   /admin/product-research/opportunities
GET    /admin/product-research/opportunities/:id
PATCH  /admin/product-research/opportunities/:id
POST   /admin/product-research/run-gap-analysis
POST   /admin/product-research/run-demand-research
POST   /admin/product-research/run-competitor-research
POST   /admin/product-research/search-aliexpress
POST   /admin/product-research/import-aliexpress
POST   /admin/product-research/watchlist
POST   /admin/product-research/score-product
POST   /admin/product-research/generate-content
```

---

## Admin UX Requirements

### Opportunity Table Columns

- Product
- Niche
- Source
- Score
- Demand
- Margin
- Supplier
- Competition
- Risk
- Status
- Recommended action
- Import button

### Filters

- Niche
- Subdomain
- Score range
- Status
- Risk level
- Supplier platform
- Margin range
- Category
- Date discovered

### Product Detail View

Each opportunity detail page should include:

- Product summary
- Why it is recommended
- Current catalog gap it fills
- Competitor examples
- AliExpress supplier options
- Margin calculator
- AI-generated title/description
- Suggested images
- Suggested price
- Suggested bundles
- Suggested ads/hooks
- Risk notes
- Import button

---

## AI Features

### AI Research Summary

Generate a plain-English summary:

```text
This product is recommended because it fills a gap in the Beauty storefront, has strong visual demo potential, appears to have validated competitor demand, and can likely support a 65%+ gross margin.
```

### AI Product Page Content

Generate:

- Product title
- Short description
- Long description
- Benefit bullets
- FAQ
- SEO title
- SEO description
- Image alt text
- Variant names

### AI Ad/Content Ideas

Generate:

- 10 TikTok hooks
- 5 UGC scripts
- 5 Meta ad angles
- 3 email angles
- 3 bundle ideas
- 3 upsell ideas

### AI Risk Review

Flag:

- Medical claims
- Trademark language
- Restricted product type
- Unrealistic claims
- Safety concerns
- Products likely to cause high refunds

---

## MVP Build Phases

### Phase 1 — Manual Research Assistant

Build first:

- Admin Product Research page
- Manual opportunity entry
- Catalog gap analysis using current products
- AliExpress search URL generation
- Product scoring fields
- Watchlist
- Import from AliExpress URL into draft product

Goal: make manual research faster.

### Phase 2 — Semi-Automated Recommendations

Add:

- Automated gap suggestions
- Competitor URL capture
- AI product summaries
- AI titles/descriptions/hooks
- Supplier comparison table
- One-click import queue

Goal: reduce research time and improve product quality.

### Phase 3 — Automated Research Engine

Add:

- Scheduled research runs
- Trend monitoring
- Competitor monitoring
- Product recommendation alerts
- Performance feedback loop from store analytics
- Winner/loser learning model

Goal: create a self-improving product testing engine.

---

## Winner/Loser Feedback Loop

After a product is imported and tested, feed performance data back into the research score.

Track:

- Product page views
- Add-to-cart rate
- Checkout conversion
- Revenue
- Gross margin
- Refund rate
- Ad CTR
- Ad CPA
- Content views
- Email/SMS engagement

Then update:

- Product status
- Opportunity score logic
- Similar product recommendations
- Supplier ranking
- Niche expansion strategy

---

## Safety, Compliance, and Risk Rules

The tool should avoid recommending or auto-importing products that create unnecessary legal, safety, or policy risk.

Flag or block:

- Counterfeit products
- Trademarked/copyrighted character products
- Medical treatment claims
- FDA-sensitive products
- Unsafe electronics
- Weapons or self-defense products
- Adult products
- Nicotine, alcohol, drugs, supplements
- Products with misleading claims
- Products with suspiciously low reviews or fake review patterns

Products with risk should require manual admin approval before import.

---

## Import Approval Checklist

Before publishing, admin should confirm:

- Supplier looks reliable
- Product images are acceptable
- Pricing creates target margin
- Shipping time is acceptable
- Product does not make risky claims
- Product fits assigned niche
- Product description has been edited
- SEO metadata exists
- Product has at least one content angle
- Product has an upsell or bundle idea

---

## Suggested Initial Product Gap Ideas

### Beauty

- Gua sha set
- Facial steamer
- Makeup organizer
- Skincare fridge
- Silicone face scrubber
- Microcurrent facial device
- Travel makeup brush cleaner
- Heatless styling accessories
- LED acne spot device

### Pets

- Slow feeder bowl
- Dog travel harness
- Grooming glove
- Pet camera
- Portable pet carrier
- Dog raincoat
- Pet nail grinder
- Poop bag holder
- Automatic water fountain

### Home

- Cable organizers
- Motion sensor lights
- Under-sink organizer
- Shower caddy
- Mini portable vacuum
- Smart plugs
- Closet organizers
- Reusable lint remover
- Kitchen drawer organizers

### Fitness

- Recovery massage ball
- Resistance bands
- Knee compression sleeves
- Lifting straps
- Posture corrector
- Shaker bottle organizer
- Ice therapy wrap
- Stretching strap
- Foam roller

---

## Success Metrics

The tool is successful if it improves:

- Time to find testable products
- Number of imported product drafts
- Product launch speed
- Product page quality
- Gross margin
- Add-to-cart rate
- Conversion rate
- Content production speed
- Winning product discovery rate

Target MVP outcome:

```text
Admin can discover, score, review, and import a new AliExpress product draft in under 5 minutes.
```

---

## Developer Notes

- Keep the system modular.
- Do not hard-code AliExpress as the only supplier forever.
- Design supplier adapters so Temu, CJdropshipping, Zendrop, Spocket, Amazon, Etsy, or private suppliers can be added later.
- Store raw supplier data separately from edited product data.
- Imported products should always become editable drafts first.
- Avoid over-automation before the scoring system has enough feedback data.
- Make the first version useful even if some data must be entered manually.

---

## Final Principle

Research → Score → Import Draft → Review → Publish → Test → Learn → Scale
