import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";
import { z } from "zod";

dotenv.config();

const { Pool } = pg;
const port = Number(process.env.API_PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@products4thepeople.com";
const adminPassword = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "change-this-password";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. See .env.example for a local PostgreSQL connection string.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

const productSchema = z.object({
  id: z.string().min(1),
  medusaId: z.string().optional(),
  name: z.string().min(1),
  niche: z.string().min(1),
  subdomain: z.enum(["beauty", "pets", "home", "fitness"]),
  costMin: z.number(),
  costMax: z.number(),
  shippingMin: z.number(),
  shippingMax: z.number(),
  retailMin: z.number(),
  retailMax: z.number(),
  marginEst: z.string(),
  priority: z.number(),
  aliexpressSearchUrl: z.string(),
  contentAngle: z.string(),
  status: z.enum(["Active", "Review", "Draft"]),
  inventory: z.number(),
  images: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  source: z.enum(["seed", "local", "medusa"]).optional(),
}).passthrough();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["paid", "unpaid", "pending", "failed"]).optional(),
  stripeSessionId: z.string().optional(),
});

const orderSchema = createOrderSchema.extend({
  id: z.string().min(1),
  status: z.enum(["Ready to fulfill", "Needs review"]),
  createdAt: z.string().min(1),
});

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_request, response) => {
  await pool.query("select 1");
  response.json({ ok: true, service: "p4tp-api" });
});

function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) {
  const email = String(request.header("x-admin-email") || "");
  const password = String(request.header("x-admin-password") || "");

  if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    response.status(401).json({ error: "Admin authentication required" });
    return;
  }

  next();
}

app.get("/api/products", async (_request, response) => {
  const result = await pool.query("select payload from products order by priority asc, name asc");
  response.json({ products: result.rows.map((row) => row.payload) });
});

app.put("/api/products", requireAdmin, async (request, response) => {
  const product = productSchema.parse(request.body);
  await upsertProduct(product);
  response.json({ product });
});

app.post("/api/products/bulk", requireAdmin, async (request, response) => {
  const products = z.array(productSchema).parse(request.body.products);
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const product of products) {
      await upsertProduct(product, client);
    }
    await client.query("commit");
    response.json({ products });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/products/replace", requireAdmin, async (request, response) => {
  const products = z.array(productSchema).parse(request.body.products);
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from products");
    for (const product of products) {
      await upsertProduct(product, client);
    }
    await client.query("commit");
    response.json({ products });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

app.patch("/api/products/:id/status", requireAdmin, async (request, response) => {
  const status = z.enum(["Active", "Review", "Draft"]).parse(request.body.status);
  const result = await pool.query("select payload from products where id = $1", [request.params.id]);
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  const product = productSchema.parse({ ...result.rows[0].payload, status });
  await upsertProduct(product);
  response.json({ product });
});

app.delete("/api/products/:id", requireAdmin, async (request, response) => {
  const result = await pool.query("delete from products where id = $1 returning payload", [request.params.id]);
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Product not found" });
    return;
  }
  response.json({ product: result.rows[0].payload });
});

app.get("/api/orders", requireAdmin, async (_request, response) => {
  const result = await pool.query("select payload from orders order by created_at desc");
  response.json({ orders: result.rows.map((row) => row.payload) });
});

app.post("/api/orders", async (request, response) => {
  const orderInput = createOrderSchema.parse(request.body);
  const order = orderSchema.parse({
    ...orderInput,
    id: `P4TP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    shipping: orderInput.shipping ?? 0,
    tax: orderInput.tax ?? 0,
    total: orderInput.total ?? orderInput.subtotal,
    paymentStatus: orderInput.paymentStatus ?? "unpaid",
    status: orderInput.paymentStatus === "paid" ? "Ready to fulfill" : "Needs review",
  });

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into contacts (email, customer_name, address, last_order_id, payload)
       values ($1, $2, $3, $4, $5)
       on conflict (email) do update set
         customer_name = excluded.customer_name,
         address = excluded.address,
         last_order_id = excluded.last_order_id,
         payload = excluded.payload,
         updated_at = now()`,
      [order.email, order.customerName, order.address, order.id, order],
    );
    await client.query(
      `insert into orders (id, customer_email, subtotal, status, created_at, payload)
       values ($1, $2, $3, $4, $5, $6)`,
      [order.id, order.email, order.subtotal, order.status, order.createdAt, order],
    );
    await client.query("commit");
    response.status(201).json({ order });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/orders/bulk", requireAdmin, async (request, response) => {
  const orders = z.array(orderSchema.extend({ source: z.enum(["local", "medusa"]).optional() })).parse(request.body.orders);
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const order of orders) {
      await upsertOrder(order, client);
    }
    await client.query("commit");
    response.json({ orders });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

app.patch("/api/orders/:id/status", requireAdmin, async (request, response) => {
  const status = z.enum(["Ready to fulfill", "Needs review"]).parse(request.body.status);
  const result = await pool.query("select payload from orders where id = $1", [request.params.id]);
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Order not found" });
    return;
  }

  const order = orderSchema.extend({ source: z.enum(["local", "medusa"]).optional() }).parse({
    ...result.rows[0].payload,
    status,
  });
  await upsertOrder(order);
  response.json({ order });
});

app.get("/api/contacts", requireAdmin, async (_request, response) => {
  const result = await pool.query(
    "select email, customer_name as \"customerName\", address, last_order_id as \"lastOrderId\", updated_at as \"updatedAt\" from contacts order by updated_at desc",
  );
  response.json({ contacts: result.rows });
});

app.get("/api/medusa/health", requireAdmin, async (_request, response) => {
  const medusaUrl = getMedusaUrl();
  const medusaResponse = await fetch(`${medusaUrl}/health`);
  response.status(medusaResponse.ok ? 200 : 502).json({
    ok: medusaResponse.ok,
    medusaUrl,
    status: medusaResponse.status,
  });
});

app.get("/api/medusa/products", requireAdmin, async (_request, response) => {
  const medusaUrl = getMedusaUrl();
  const medusaResponse = await fetch(`${medusaUrl}/admin/products?limit=100`, {
    headers: medusaHeaders(),
  });

  if (!medusaResponse.ok) {
    response.status(502).json({ error: `Medusa product fetch returned ${medusaResponse.status}` });
    return;
  }

  response.json(await medusaResponse.json());
});

app.post("/api/import/aliexpress", requireAdmin, async (request, response) => {
  const { url } = z.object({ url: z.string().url() }).parse(request.body);

  if (!url.includes("aliexpress.com") && !url.includes("aliexpress.us")) {
    response.status(400).json({ error: "Invalid AliExpress URL. Must be a valid aliexpress.com or aliexpress.us product page." });
    return;
  }

  let rawName = "AliExpress Product";
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const itemMatch = path.match(/\/item\/[0-9]+-([^.]+)\.html/);
    if (itemMatch && itemMatch[1]) {
      rawName = itemMatch[1].replace(/-/g, " ");
    } else {
      const parts = path.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        rawName = lastPart.replace(/-/g, " ").replace(/\.html$/, "");
      }
    }
  } catch {
    // Keep default
  }

  const name = rawName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const haystack = name.toLowerCase();

  let niche = "Beauty";
  let subdomain = "beauty" as const;
  let category = "Beauty Tools";
  let contentAngle = "Premium quality skincare essential";

  if (haystack.includes("hair") || haystack.includes("curl") || haystack.includes("scalp") || haystack.includes("wrap")) {
    niche = "Beauty";
    subdomain = "beauty";
    category = "Hair Care";
    contentAngle = "Salon curls and healthy scalp care at home";
  } else if (haystack.includes("led") || haystack.includes("mask") || haystack.includes("light")) {
    niche = "Beauty";
    subdomain = "beauty";
    category = "LED Therapy";
    contentAngle = "Luxury anti-aging spa treatment from home";
  } else if (haystack.includes("clean") || haystack.includes("pore") || haystack.includes("brush") || haystack.includes("vacuum")) {
    niche = "Beauty";
    subdomain = "beauty";
    category = "Cleansing Tools";
    contentAngle = "Deep pore cleaning and refreshing skincare routine";
  } else if (haystack.includes("ice") || haystack.includes("roller") || haystack.includes("eye") || haystack.includes("depuff")) {
    niche = "Beauty";
    subdomain = "beauty";
    category = "Skin Refresh";
    contentAngle = "Instant morning face reset and calming depuff";
  } else if (haystack.includes("dog") || haystack.includes("cat") || haystack.includes("pet")) {
    niche = "Pets";
    subdomain = "pets";
    if (haystack.includes("water") || haystack.includes("seat") || haystack.includes("paw") || haystack.includes("cleaner")) {
      category = "Travel & Cleanup";
      contentAngle = "Stops muddy paw prints and car seat messes instantly";
    } else if (haystack.includes("bed") || haystack.includes("calm") || haystack.includes("lick") || haystack.includes("mat")) {
      category = "Comfort & Enrichment";
      contentAngle = "Supports pet anxiety relief and calm feeding routines";
    } else if (haystack.includes("feeder") || haystack.includes("feed")) {
      category = "Feeding";
      contentAngle = "Smart automatic pet feeding convenience";
    } else if (haystack.includes("collar") || haystack.includes("safety")) {
      category = "Safety";
      contentAngle = "High-visibility pet night walk safety";
    } else {
      category = "Pet Essentials";
      contentAngle = "Everyday pet helper that solves a major owner hassle";
    }
  } else if (haystack.includes("lamp") || haystack.includes("diffuser") || haystack.includes("mop") || haystack.includes("humidifier") || haystack.includes("sunset") || haystack.includes("home")) {
    niche = "Home";
    subdomain = "home";
    category = "Home Essentials";
    contentAngle = "Atmospheric home upgrade with high viral UGC appeal";
  } else if (haystack.includes("posture") || haystack.includes("corrector") || haystack.includes("bands") || haystack.includes("rope") || haystack.includes("fitness") || haystack.includes("gym") || haystack.includes("workout")) {
    niche = "Fitness";
    subdomain = "fitness";
    category = "Fitness Gear";
    contentAngle = "Premium recovery and home workout essential";
  }

  const costMin = Math.round((2 + Math.random() * 8) * 100) / 100;
  const costMax = Math.round((costMin + 2 + Math.random() * 6) * 100) / 100;
  const shippingMin = Math.round((2 + Math.random() * 2) * 100) / 100;
  const shippingMax = Math.round((shippingMin + 1 + Math.random() * 2) * 100) / 100;
  const retailMin = Math.round((costMax + shippingMax) * 3);
  const retailMax = Math.round(retailMin * 1.5);
  const marginEst = `${Math.round(((retailMin - (costMax + shippingMax)) / retailMin) * 100)}%`;

  const imageMap: Record<string, string[]> = {
    "Hair Care": [
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df"
    ],
    "LED Therapy": [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796"
    ],
    "Cleansing Tools": [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
    ],
    "Skin Refresh": [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b"
    ],
    "Travel & Cleanup": [
      "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"
    ],
    "Comfort & Enrichment": [
      "https://images.unsplash.com/photo-1534361960057-19889db9621e",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e"
    ],
    "Home Essentials": [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f",
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6"
    ],
    "Fitness Gear": [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
    ]
  };

  const images = imageMap[category] || [
    "https://images.unsplash.com/photo-1607083206968-13611e3d76db",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc"
  ];

  response.json({
    product: {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      niche,
      subdomain,
      costMin,
      costMax,
      shippingMin,
      shippingMax,
      retailMin,
      retailMax,
      marginEst,
      priority: 99,
      aliexpressSearchUrl: url,
      contentAngle,
      status: "Draft",
      inventory: 150,
      images,
      seoTitle: `${name} | Premium Dropship Solution`,
      seoDescription: `${name}: ${contentAngle}. High quality construction with fast shipping.`,
    }
  });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ error: message });
});

await migrate();

app.listen(port, () => {
  console.log(`P4tP API listening on http://localhost:${port}`);
});

async function migrate() {
  await pool.query(`
    create table if not exists products (
      id text primary key,
      medusa_id text,
      name text not null,
      subdomain text not null,
      status text not null,
      priority numeric not null default 99,
      inventory numeric not null default 0,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    );

    create table if not exists contacts (
      email text primary key,
      customer_name text not null,
      address text not null,
      last_order_id text,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists orders (
      id text primary key,
      customer_email text not null references contacts(email),
      subtotal numeric not null,
      status text not null,
      created_at timestamptz not null,
      payload jsonb not null
    );
  `);
}

async function upsertProduct(product: z.infer<typeof productSchema>, client: pg.Pool | pg.PoolClient = pool) {
  await client.query(
    `insert into products (id, medusa_id, name, subdomain, status, priority, inventory, payload)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       medusa_id = excluded.medusa_id,
       name = excluded.name,
       subdomain = excluded.subdomain,
       status = excluded.status,
       priority = excluded.priority,
       inventory = excluded.inventory,
       payload = excluded.payload,
       updated_at = now()`,
    [
      product.id,
      product.medusaId || null,
      product.name,
      product.subdomain,
      product.status,
      product.priority,
      product.inventory,
      product,
    ],
  );
}

async function upsertOrder(
  order: z.infer<typeof orderSchema> & { source?: "local" | "medusa" },
  client: pg.Pool | pg.PoolClient = pool,
) {
  await client.query(
    `insert into contacts (email, customer_name, address, last_order_id, payload)
     values ($1, $2, $3, $4, $5)
     on conflict (email) do update set
       customer_name = excluded.customer_name,
       address = excluded.address,
       last_order_id = excluded.last_order_id,
       payload = excluded.payload,
       updated_at = now()`,
    [order.email, order.customerName, order.address, order.id, order],
  );
  await client.query(
    `insert into orders (id, customer_email, subtotal, status, created_at, payload)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set
       customer_email = excluded.customer_email,
       subtotal = excluded.subtotal,
       status = excluded.status,
       created_at = excluded.created_at,
       payload = excluded.payload`,
    [order.id, order.email, order.subtotal, order.status, order.createdAt, order],
  );
}

function getMedusaUrl() {
  return (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
}

function medusaHeaders() {
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.MEDUSA_ADMIN_API_KEY) {
    headers.authorization = `Bearer ${process.env.MEDUSA_ADMIN_API_KEY}`;
  }
  return headers;
}
