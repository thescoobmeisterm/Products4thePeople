export type ApiProduct = {
  id: string;
  medusaId?: string;
  name: string;
  niche: string;
  subdomain: string;
  costMin: number;
  costMax: number;
  shippingMin: number;
  shippingMax: number;
  retailMin: number;
  retailMax: number;
  marginEst: string;
  priority: number;
  aliexpressSearchUrl: string;
  contentAngle: string;
  status: "Active" | "Review" | "Draft";
  inventory: number;
  images?: string[];
  trustBadges?: string[];
  productHighlights?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  reviews?: Array<{
    id: string;
    author: string;
    rating: number;
    date: string;
    text: string;
    verified: boolean;
  }>;
  seoTitle?: string;
  seoDescription?: string;
  researchOpportunityId?: string;
  researchImportJobId?: string;
  source?: "seed" | "local" | "medusa";
};

export type ApiOrderInput = {
  customerName: string;
  email: string;
  address: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping?: number;
  tax?: number;
  total?: number;
  paymentStatus?: "paid" | "unpaid" | "pending" | "failed";
  stripeSessionId?: string;
  source?: "local" | "medusa";
  phone?: string;
  wantsSms?: boolean;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
};

export type ApiOrder = ApiOrderInput & {
  id: string;
  status: "Needs review" | "Ready to fulfill" | "Processing" | "Shipped" | "In Transit" | "Delivered" | "Cancelled";
  createdAt: string;
};

export type MediaAsset = {
  id: string;
  title: string;
  url: string;
  kind: "image" | "video";
  placement: "library" | "listing" | "video_section";
  productId?: string;
  handle?: string;
  caption?: string;
  tag?: string;
  mimeType?: string;
  fileName?: string;
  source?: "upload" | "url";
  createdAt: string;
  updatedAt: string;
};

export type OpportunityPerformanceSnapshot = {
  linkedProductIds: string[];
  linkedProductNames: string[];
  orderCount: number;
  unitsSold: number;
  revenue: number;
  paidRevenue: number;
  conversionSignal: "no_data" | "testing" | "winner" | "loser";
  lastOrderAt?: string;
  lastSyncedAt: string;
};

export type OpportunityFeedbackEvent = {
  id: string;
  at: string;
  type: "imported" | "performance_sync" | "status_change";
  message: string;
  status?: ResearchOpportunity["status"];
  snapshot?: OpportunityPerformanceSnapshot;
};

export type ResearchOpportunity = {
  id: string;
  name: string;
  niche: string;
  subdomain?: string;
  category?: string;
  source?: string;
  source_url?: string;
  status: "discovered" | "researching" | "watchlist" | "recommended" | "imported_draft" | "approved" | "published" | "testing" | "winner" | "loser" | "archived" | "blocked";
  opportunity_score: number;
  recommendation_summary?: string;
  demand_score: number;
  margin_score: number;
  supplier_score: number;
  competition_score: number;
  brand_fit_score: number;
  content_score: number;
  risk_score: number;
  risk_notes?: string;
  linked_product_ids?: string[];
  performance_snapshot?: OpportunityPerformanceSnapshot;
  feedback_history?: OpportunityFeedbackEvent[];
  created_at: string;
  updated_at: string;
};

export type CompetitorProduct = {
  id: string;
  opportunity_id?: string | null;
  competitor_name?: string;
  competitor_url?: string;
  product_title?: string;
  price: number;
  compare_at_price?: number;
  rating?: number;
  review_count?: number;
  sales_signal?: string;
  offer_notes?: string;
  positioning_notes?: string;
  images?: string[];
  captured_at: string;
};

export type SupplierProduct = {
  id: string;
  opportunity_id?: string | null;
  supplier_platform: string;
  supplier_name?: string;
  supplier_url?: string;
  product_url: string;
  title?: string;
  price_min?: number;
  price_max?: number;
  shipping_cost?: number;
  rating?: number;
  review_count?: number;
  orders_count?: number;
  estimated_delivery_days?: number;
  variants?: Array<{ color?: string; size?: string; model?: string; cost: number }>;
  images?: string[];
  description_raw?: string;
  supplier_score?: number;
  import_status: "not_imported" | "imported" | "failed" | "needs_review";
  created_at: string;
  updated_at: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const adminHeaders = {
  "x-admin-email": import.meta.env.VITE_ADMIN_EMAIL || "admin@products4thepeople.com",
  "x-admin-password": import.meta.env.VITE_ADMIN_PASSWORD || "change-this-password",
};

export async function getProducts() {
  return apiFetch<{ products: ApiProduct[] }>("/products");
}

export async function saveProduct(product: ApiProduct) {
  return apiFetch<{ product: ApiProduct }>("/products", {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function saveProducts(products: ApiProduct[]) {
  return apiFetch<{ products: ApiProduct[] }>("/products/bulk", {
    method: "POST",
    body: JSON.stringify({ products }),
  });
}

export async function replaceProducts(products: ApiProduct[]) {
  return apiFetch<{ products: ApiProduct[] }>("/products/replace", {
    method: "POST",
    body: JSON.stringify({ products }),
  });
}

export async function updateProductStatus(id: string, status: ApiProduct["status"]) {
  return apiFetch<{ product: ApiProduct }>(`/products/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function removeProduct(id: string) {
  return apiFetch<{ product: ApiProduct }>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getOrders() {
  return apiFetch<{ orders: ApiOrder[] }>("/orders");
}

export async function createOrder(order: ApiOrderInput) {
  return apiFetch<{ order: ApiOrder }>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function saveOrders(orders: Array<ApiOrder & { source?: "local" | "medusa" }>) {
  return apiFetch<{ orders: Array<ApiOrder & { source?: "local" | "medusa" }> }>("/orders/bulk", {
    method: "POST",
    body: JSON.stringify({ orders }),
  });
}

export async function updateOrderStatus(id: string, status: ApiOrder["status"]) {
  return apiFetch<{ order: ApiOrder }>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateOrderTracking(id: string, tracking: Pick<ApiOrderInput, "carrier" | "trackingNumber" | "trackingUrl" | "estimatedDelivery" | "shippedAt" | "deliveredAt">) {
  return apiFetch<{ order: ApiOrder }>(`/orders/${encodeURIComponent(id)}/tracking`, {
    method: "PATCH",
    body: JSON.stringify(tracking),
  });
}

export async function importAliexpress(url: string) {
  return apiFetch<{ product: ApiProduct }>("/import/aliexpress", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getContacts() {
  return apiFetch<{ contacts: any[] }>("/contacts");
}

export async function createContact(input: {
  email: string;
  customerName?: string;
  source?: string;
  niche?: string;
  storeLabel?: string;
  phone?: string;
  wantsSms?: boolean;
  couponCode?: string;
  role?: "customer" | "admin";
}) {
  return apiFetch<{ contact: any }>("/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateContactRole(email: string, role: "customer" | "admin") {
  return apiFetch<{ contact: any }>(`/contacts/${encodeURIComponent(email)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteContact(email: string) {
  return apiFetch<{ ok: boolean; message: string }>(`/contacts/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

export async function getMediaAssets() {
  return apiFetch<{ assets: MediaAsset[] }>("/media");
}

export async function getAdminMediaAssets() {
  return apiFetch<{ assets: MediaAsset[] }>("/admin/media");
}

export async function addMediaUrl(input: Omit<MediaAsset, "id" | "createdAt" | "updatedAt" | "source">) {
  return apiFetch<{ asset: MediaAsset }>("/admin/media/url", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadMediaAsset(input: {
  title: string;
  kind: "image" | "video";
  placement: "library" | "listing" | "video_section";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  productId?: string;
  handle?: string;
  caption?: string;
  tag?: string;
}) {
  return apiFetch<{ asset: MediaAsset }>("/admin/media/upload", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteMediaAsset(id: string) {
  return apiFetch<{ ok: boolean; message: string }>(`/admin/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function testApi() {
  const healthUrl = apiBaseUrl === "/api" ? "/health" : `${apiBaseUrl.replace(/\/api$/, "")}/health`;
  const response = await fetch(healthUrl);
  if (!response.ok) throw new Error(`API health check returned ${response.status}`);
}

export async function getOpportunities() {
  return apiFetch<{ opportunities: ResearchOpportunity[] }>("/admin/product-research/opportunities");
}

export async function createOpportunity(opp: Omit<ResearchOpportunity, "id" | "status" | "created_at" | "updated_at">) {
  return apiFetch<{ opportunity: ResearchOpportunity }>("/admin/product-research/opportunities", {
    method: "POST",
    body: JSON.stringify(opp),
  });
}

export async function getOpportunityDetails(id: string) {
  return apiFetch<{ opportunity: ResearchOpportunity; competitors: CompetitorProduct[]; suppliers: SupplierProduct[]; linkedProducts: ApiProduct[]; importJobs: any[] }>(`/admin/product-research/opportunities/${encodeURIComponent(id)}`);
}

export async function updateOpportunity(id: string, updates: Partial<ResearchOpportunity>) {
  return apiFetch<{ opportunity: ResearchOpportunity }>(`/admin/product-research/opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function getCompetitors() {
  return apiFetch<{ competitors: CompetitorProduct[] }>("/admin/product-research/competitors");
}

export async function createCompetitor(competitor: Omit<CompetitorProduct, "id" | "captured_at">) {
  return apiFetch<{ competitor: CompetitorProduct }>("/admin/product-research/competitors", {
    method: "POST",
    body: JSON.stringify(competitor),
  });
}

export async function runGapAnalysis() {
  return apiFetch<{ message: string; count: number; opportunities: ResearchOpportunity[] }>("/admin/product-research/run-gap-analysis", {
    method: "POST",
  });
}

export async function runDemandResearch(id: string) {
  return apiFetch<{ message: string; opportunity: ResearchOpportunity }>("/admin/product-research/run-demand-research", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function runCompetitorResearch(id: string) {
  return apiFetch<{ message: string; competitors: CompetitorProduct[]; opportunity: ResearchOpportunity }>("/admin/product-research/run-competitor-research", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function searchAliExpress(query: string, opportunityId?: string) {
  return apiFetch<{ message: string; suppliers: SupplierProduct[] }>("/admin/product-research/search-aliexpress", {
    method: "POST",
    body: JSON.stringify({ query, opportunityId }),
  });
}

export async function importSupplierProduct(supplierProductId: string, opportunityId?: string) {
  return apiFetch<{ message: string; product: ApiProduct; jobId: string }>("/admin/product-research/import-aliexpress", {
    method: "POST",
    body: JSON.stringify({ supplierProductId, opportunityId }),
  });
}

export async function setWatchlistStatus(id: string, isWatched: boolean) {
  return apiFetch<{ message: string; opportunity: ResearchOpportunity }>("/admin/product-research/watchlist", {
    method: "POST",
    body: JSON.stringify({ id, isWatched }),
  });
}

export async function scoreResearchProduct(scores: Pick<ResearchOpportunity, "demand_score" | "margin_score" | "supplier_score" | "competition_score" | "brand_fit_score" | "content_score" | "risk_score">) {
  return apiFetch<{ score: number }>("/admin/product-research/score-product", {
    method: "POST",
    body: JSON.stringify(scores),
  });
}

export async function generateContentForOpportunity(id: string) {
  return apiFetch<{ content: any }>("/admin/product-research/generate-content", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function syncOpportunityPerformance(id?: string) {
  return apiFetch<{ message: string; opportunities: ResearchOpportunity[]; opportunity?: ResearchOpportunity }>("/admin/product-research/sync-performance", {
    method: "POST",
    body: JSON.stringify(id ? { id } : {}),
  });
}

export type ExperimentVariant = {
  id: string;
  experiment_id: string;
  name: string;
  changes: Record<string, any>;
  visitors: number;
  add_to_cart_count: number;
  checkout_count: number;
  purchase_count: number;
  revenue: number;
  emails_captured: number;
  is_control: boolean;
};

export type Experiment = {
  id: string;
  name: string;
  status: "draft" | "active" | "completed";
  niche: string;
  test_type: "homepage_hero" | "product_pricing" | "checkout_threshold";
  target_id?: string;
  traffic_allocation: number;
  winner_variant_id?: string | null;
  confidence_threshold: number;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  variants: ExperimentVariant[];
};

export async function getActiveExperiments() {
  return apiFetch<{ experiments: Experiment[] }>("/experiments/active");
}

export async function getExperiments() {
  return apiFetch<{ experiments: Experiment[] }>("/admin/experiments");
}

export async function getExperimentDetails(id: string) {
  return apiFetch<{ experiment: Experiment }>(`/admin/experiments/${encodeURIComponent(id)}`);
}

export async function createExperiment(exp: Omit<Experiment, "id" | "status" | "created_at" | "updated_at" | "variants"> & { variants: Array<Omit<ExperimentVariant, "id" | "experiment_id" | "visitors" | "add_to_cart_count" | "checkout_count" | "purchase_count" | "revenue" | "emails_captured">> }) {
  return apiFetch<{ experiment: Experiment }>("/admin/experiments", {
    method: "POST",
    body: JSON.stringify(exp),
  });
}

export async function updateExperimentStatus(id: string, status: Experiment["status"]) {
  return apiFetch<{ experiment: Experiment }>(`/admin/experiments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function trackExperimentConversion(id: string, action: "visitor" | "add_to_cart" | "checkout" | "purchase" | "email_capture", variantId: string, revenue?: number) {
  return apiFetch<{ success: boolean; variant: ExperimentVariant }>(`/admin/experiments/${encodeURIComponent(id)}/track`, {
    method: "POST",
    body: JSON.stringify({ action, variantId, revenue }),
  });
}

export async function promoteExperimentVariant(id: string, variantId: string) {
  return apiFetch<{ success: boolean; experiment: Experiment; variant: ExperimentVariant }>(`/admin/experiments/${encodeURIComponent(id)}/promote`, {
    method: "POST",
    body: JSON.stringify({ variantId }),
  });
}

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  niche: string;
  status: "draft" | "published" | "archived";
  seo_title?: string;
  seo_description?: string;
  keywords?: string;
  schema_markup?: any;
  editorial_controls?: SeoEditorialControls;
  views: number;
  conversions: number;
  revenue: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: "faq" | "tutorial" | "product_guide";
  niche: string;
  product_id?: string;
  status: "draft" | "published";
  views: number;
  created_at: string;
  updated_at: string;
};

export type SeoPage = {
  id: string;
  title: string;
  slug: string;
  niche: string;
  category_name: string;
  description: string;
  status?: "draft" | "published";
  seo_title?: string;
  seo_description?: string;
  schema_markup?: any;
  views: number;
  conversions: number;
  revenue: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type SeoDashboardStats = {
  summary: {
    totalViews: number;
    totalConversions: number;
    totalRevenue: number;
    indexedUrls: number;
  };
  leaderboard: Array<{
    name: string;
    type: string;
    niche: string;
    views: number;
    conversions: number;
    revenue: number;
  }>;
};

export type SeoEditorialControls = {
  tone?: "expert" | "friendly" | "premium" | "urgent";
  funnelStage?: "awareness" | "consideration" | "decision";
  persona?: string;
  ctaStyle?: "soft" | "direct" | "limited_offer";
};

export type SeoArticleImproveMode = "improve" | "regenerate";

export async function simulateExperimentTraffic(id: string) {
  return apiFetch<{ success: boolean; message: string; variants: ExperimentVariant[] }>("/admin/experiments/run-simulation", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// Blog Articles APIs
export async function getArticles(niche?: string) {
  const query = niche ? `?niche=${encodeURIComponent(niche)}` : "";
  return apiFetch<{ articles: Article[] }>(`/articles${query}`);
}

export async function getArticleDetails(slug: string) {
  return apiFetch<{ article: Article }>(`/articles/${encodeURIComponent(slug)}`);
}

export async function getAdminArticles() {
  return apiFetch<{ articles: Article[] }>("/admin/articles");
}

export async function createArticle(art: Omit<Article, "id" | "views" | "conversions" | "revenue" | "created_at" | "updated_at">) {
  return apiFetch<{ article: Article }>("/admin/articles", {
    method: "POST",
    body: JSON.stringify(art),
  });
}

export async function generateArticle(niche: string, topic: string, keyword: string, controls: SeoEditorialControls = {}) {
  return apiFetch<{ success: boolean; article: Article }>("/admin/articles/generate", {
    method: "POST",
    body: JSON.stringify({ niche, topic, keyword, ...controls }),
  });
}

export async function generateArticleFromProduct(productId: string, angle: string, controls: SeoEditorialControls = {}) {
  return apiFetch<{ success: boolean; article: Article }>("/admin/articles/generate-from-product", {
    method: "POST",
    body: JSON.stringify({ productId, angle, ...controls }),
  });
}

export async function updateArticle(id: string, updates: Partial<Article>) {
  return apiFetch<{ article: Article }>(`/admin/articles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function improveArticle(id: string, mode: SeoArticleImproveMode, controls: SeoEditorialControls = {}) {
  return apiFetch<{ success: boolean; article: Article }>(`/admin/articles/${encodeURIComponent(id)}/improve`, {
    method: "POST",
    body: JSON.stringify({ mode, ...controls }),
  });
}

export async function deleteArticle(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Knowledge Base APIs
export async function getKbArticles(niche?: string) {
  const query = niche ? `?niche=${encodeURIComponent(niche)}` : "";
  return apiFetch<{ articles: KnowledgeArticle[] }>(`/kb${query}`);
}

export async function getKbArticleDetails(slug: string) {
  return apiFetch<{ article: KnowledgeArticle }>(`/kb/${encodeURIComponent(slug)}`);
}

export async function getAdminKbArticles() {
  return apiFetch<{ articles: KnowledgeArticle[] }>("/admin/kb");
}

export async function createKbArticle(kb: Omit<KnowledgeArticle, "id" | "views" | "created_at" | "updated_at">) {
  return apiFetch<{ article: KnowledgeArticle }>("/admin/kb", {
    method: "POST",
    body: JSON.stringify(kb),
  });
}

export async function updateKbArticle(id: string, updates: Partial<KnowledgeArticle>) {
  return apiFetch<{ article: KnowledgeArticle }>(`/admin/kb/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Programmatic SEO APIs
export async function getSeoPages(niche?: string) {
  const query = niche ? `?niche=${encodeURIComponent(niche)}` : "";
  return apiFetch<{ pages: SeoPage[] }>(`/seo-pages${query}`);
}

export async function getSeoPageDetails(slug: string) {
  return apiFetch<{ page: SeoPage }>(`/seo-pages/${encodeURIComponent(slug)}`);
}

export async function getAdminSeoPages() {
  return apiFetch<{ pages: SeoPage[] }>("/admin/seo-pages");
}

export async function createSeoPage(page: Omit<SeoPage, "id" | "views" | "conversions" | "revenue" | "created_at" | "updated_at">) {
  return apiFetch<{ page: SeoPage }>("/admin/seo-pages", {
    method: "POST",
    body: JSON.stringify(page),
  });
}

export async function updateSeoPage(id: string, updates: Partial<SeoPage>) {
  return apiFetch<{ page: SeoPage }>(`/admin/seo-pages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function generateSeoPage(niche: string, categoryName: string, keywords: string) {
  return apiFetch<{ success: boolean; page: SeoPage }>("/admin/seo-pages/generate", {
    method: "POST",
    body: JSON.stringify({ niche, categoryName, keywords }),
  });
}

export async function generateSeoPageFromProduct(productId: string, angle: string) {
  return apiFetch<{ success: boolean; page: SeoPage }>("/admin/seo-pages/generate-from-product", {
    method: "POST",
    body: JSON.stringify({ productId, angle }),
  });
}

export async function generateBulkSeoPages(input: {
  scope: "niche" | "category" | "product_collection";
  niche: string;
  limit: number;
}) {
  return apiFetch<{ success: boolean; pages: SeoPage[]; skipped: Array<{ slug: string; reason: string }>; generated: number; candidateCount: number }>("/admin/seo-pages/generate-bulk", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// SEO Tracking and Analytics
export async function trackSeoHit(type: "article" | "seo_page", slug: string, action: "view" | "conversion", revenue?: number) {
  return apiFetch<{ success: boolean }>("/seo/track", {
    method: "POST",
    body: JSON.stringify({ type, slug, action, revenue }),
  });
}

export async function getSeoDashboard() {
  return apiFetch<SeoDashboardStats>("/admin/seo/dashboard");
}

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...adminHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error || `API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
