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
  seoTitle?: string;
  seoDescription?: string;
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
};

export type ApiOrder = ApiOrderInput & {
  id: string;
  status: "Ready to fulfill" | "Needs review";
  createdAt: string;
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
  created_at: string;
  updated_at: string;
};

export type CompetitorProduct = {
  id: string;
  opportunity_id: string;
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
  opportunity_id: string;
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

export async function importAliexpress(url: string) {
  return apiFetch<{ product: ApiProduct }>("/import/aliexpress", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getContacts() {
  return apiFetch<{ contacts: any[] }>("/contacts");
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
  return apiFetch<{ opportunity: ResearchOpportunity; competitors: CompetitorProduct[]; suppliers: SupplierProduct[] }>(`/admin/product-research/opportunities/${encodeURIComponent(id)}`);
}

export async function updateOpportunity(id: string, updates: Partial<ResearchOpportunity>) {
  return apiFetch<{ opportunity: ResearchOpportunity }>(`/admin/product-research/opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
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

export async function generateContentForOpportunity(id: string) {
  return apiFetch<{ content: any }>("/admin/product-research/generate-content", {
    method: "POST",
    body: JSON.stringify({ id }),
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

export async function simulateExperimentTraffic(id: string) {
  return apiFetch<{ success: boolean; message: string; variants: ExperimentVariant[] }>("/admin/experiments/run-simulation", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
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
