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
  variants?: Array<{
    inventory_quantity?: number | null;
    prices?: Array<{ amount?: number | null }> | null;
  }>;
};

type MedusaProductListResponse = {
  products: MedusaProduct[];
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
    fields: "id,title,subtitle,description,status,handle,metadata,*variants",
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
