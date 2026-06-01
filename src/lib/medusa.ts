import Medusa from "@medusajs/js-sdk";

export type MedusaConnection = {
  baseUrl: string;
  apiKey: string;
};

export type MedusaProduct = {
  id: string;
  title: string;
  status?: string;
  subtitle?: string | null;
  description?: string | null;
  handle?: string | null;
  metadata?: Record<string, unknown> | null;
  images?: Array<{ url?: string | null }> | null;
  variants?: Array<{
    inventory_quantity?: number | null;
    prices?: Array<{ amount?: number | null }> | null;
  }>;
};

export type MedusaOrder = {
  id: string;
  email?: string | null;
  status?: string | null;
  display_id?: number | null;
  created_at?: string | null;
  total?: number | null;
  subtotal?: number | null;
  currency_code?: string | null;
  shipping_address?: {
    first_name?: string | null;
    last_name?: string | null;
    address_1?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
  } | null;
  items?: Array<{
    id?: string | null;
    title?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
  }> | null;
};

type MedusaProductListResponse = {
  products: MedusaProduct[];
  count: number;
};

type MedusaOrderListResponse = {
  orders: MedusaOrder[];
  count: number;
};

export function createMedusaSdk({ baseUrl, apiKey }: MedusaConnection) {
  return new Medusa({
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey: apiKey || undefined,
    auth: {
      type: "jwt",
      jwtTokenStorageMethod: "memory",
    },
  });
}

export async function listMedusaProducts(connection: MedusaConnection) {
  const sdk = createMedusaSdk(connection) as unknown as {
    admin: {
      product: {
        list: (query?: Record<string, unknown>) => Promise<MedusaProductListResponse>;
      };
    };
  };

  return sdk.admin.product.list({
    limit: 100,
    fields: "id,title,subtitle,description,status,handle,metadata,*variants,*images",
  });
}

export async function listMedusaOrders(connection: MedusaConnection) {
  const sdk = createMedusaSdk(connection) as unknown as {
    admin: {
      order: {
        list: (query?: Record<string, unknown>) => Promise<MedusaOrderListResponse>;
      };
    };
  };

  return sdk.admin.order.list({
    limit: 100,
    fields: "id,email,status,display_id,created_at,total,subtotal,currency_code,shipping_address,*items",
  });
}

export async function testMedusaConnection(connection: MedusaConnection) {
  const response = await fetch(`${connection.baseUrl.replace(/\/$/, "")}/health`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Medusa health check returned ${response.status}`);
  }
}
