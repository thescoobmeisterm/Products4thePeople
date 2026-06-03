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
