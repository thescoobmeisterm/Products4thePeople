import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";
import { z } from "zod";
import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const { Pool } = pg;
const port = Number(process.env.API_PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@products4thepeople.com";
const adminPassword = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "change-this-password";

// Stripe Configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const taxRate = Number(process.env.BASIC_TAX_RATE || 0.06);
const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD || 75);
const flatShipping = Number(process.env.FLAT_SHIPPING || 7);

// Stripe Checkout Simulator Store
interface MockSession {
  id: string;
  customerEmail: string;
  customerName: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  discountCode: string;
  storefront: string;
  successUrl: string;
  cancelUrl: string;
  paymentStatus: "unpaid" | "paid" | "failed";
  status: "open" | "complete" | "expired";
}

const mockSessions = new Map<string, MockSession>();

// Local JSON DB Configuration Fallback
const DB_FILE = path.join(process.cwd(), "server", "db.json");

interface DbSchema {
  products: Record<string, any>;
  orders: Record<string, any>;
  contacts: Record<string, any>;
  customers: Record<string, any>;
}

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { products: {}, orders: {}, contacts: {}, customers: {} };
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      products: parsed.products || {},
      orders: parsed.orders || {},
      contacts: parsed.contacts || {},
      customers: parsed.customers || {},
    };
  } catch {
    return { products: {}, orders: {}, contacts: {}, customers: {} };
  }
}

function writeDb(data: DbSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write JSON DB:", error);
  }
}

// Database Connection & Mode
const pool = new Pool({
  connectionString: databaseUrl || "postgres://localhost/dummy",
});

let usePostgres = false;

// Schemas
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

const contactInputSchema = z.object({
  email: z.string().email(),
  customerName: z.string().optional(),
  niche: z.string().optional(),
  source: z.string().optional(),
});

// App initialization
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

// Auth middleware
function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) {
  const email = String(request.header("x-admin-email") || "");
  const password = String(request.header("x-admin-password") || "");

  if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    response.status(401).json({ error: "Admin authentication required" });
    return;
  }

  next();
}

// REST API Endpoints
app.get("/health", async (_request, response) => {
  if (usePostgres) {
    await pool.query("select 1");
  }
  response.json({ 
    ok: true, 
    service: "p4tp-api", 
    dbMode: usePostgres ? "PostgreSQL" : "Local File (db.json)",
    stripeConfigured: Boolean(stripe)
  });
});

app.get("/api/products", async (_request, response) => {
  const products = await getProductsDb();
  response.json({ products });
});

app.put("/api/products", requireAdmin, async (request, response) => {
  const product = productSchema.parse(request.body);
  await upsertProductDb(product);
  response.json({ product });
});

app.post("/api/products/bulk", requireAdmin, async (request, response) => {
  const products = z.array(productSchema).parse(request.body.products);
  for (const product of products) {
    await upsertProductDb(product);
  }
  response.json({ products });
});

app.post("/api/products/replace", requireAdmin, async (request, response) => {
  const products = z.array(productSchema).parse(request.body.products);
  await replaceProductsDb(products);
  response.json({ products });
});

app.patch("/api/products/:id/status", requireAdmin, async (request, response) => {
  const status = z.enum(["Active", "Review", "Draft"]).parse(request.body.status);
  const products = await getProductsDb();
  const existing = products.find((p: any) => p.id === request.params.id);
  if (!existing) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  const product = productSchema.parse({ ...existing, status });
  await upsertProductDb(product);
  response.json({ product });
});

app.delete("/api/products/:id", requireAdmin, async (request, response) => {
  const product = await deleteProductDb(request.params.id);
  if (!product) {
    response.status(404).json({ error: "Product not found" });
    return;
  }
  response.json({ product });
});

app.get("/api/orders", requireAdmin, async (_request, response) => {
  const orders = await getOrdersDb();
  response.json({ orders });
});

app.post("/api/orders", async (request, response) => {
  const orderInput = createOrderSchema.parse(request.body);
  
  let customerName = orderInput.customerName;
  let address = orderInput.address;

  if (orderInput.stripeSessionId && orderInput.stripeSessionId.startsWith("mock_")) {
    const mockSession = mockSessions.get(orderInput.stripeSessionId);
    if (mockSession) {
      customerName = mockSession.customerName || customerName;
      address = mockSession.cancelUrl || address; // We saved billing address inside cancelUrl during complete redirect
    }
  }

  const order = orderSchema.parse({
    ...orderInput,
    customerName,
    address,
    id: `P4TP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    shipping: orderInput.shipping ?? 0,
    tax: orderInput.tax ?? 0,
    total: orderInput.total ?? orderInput.subtotal,
    paymentStatus: orderInput.paymentStatus ?? "unpaid",
    status: orderInput.paymentStatus === "paid" ? "Ready to fulfill" : "Needs review",
  });

  await upsertOrderDb(order);
  response.status(201).json({ order });
});

app.post("/api/orders/bulk", requireAdmin, async (request, response) => {
  const orders = z.array(orderSchema.extend({ source: z.enum(["local", "medusa"]).optional() })).parse(request.body.orders);
  for (const order of orders) {
    await upsertOrderDb(order);
  }
  response.json({ orders });
});

app.patch("/api/orders/:id/status", requireAdmin, async (request, response) => {
  const status = z.enum(["Ready to fulfill", "Needs review"]).parse(request.body.status);
  const orders = await getOrdersDb();
  const existing = orders.find((o: any) => o.id === request.params.id);
  if (!existing) {
    response.status(404).json({ error: "Order not found" });
    return;
  }

  const order = orderSchema.extend({ source: z.enum(["local", "medusa"]).optional() }).parse({
    ...existing,
    status,
  });
  await upsertOrderDb(order);
  response.json({ order });
});

app.get("/api/contacts", requireAdmin, async (_request, response) => {
  const contacts = await getContactsDb();
  response.json({ contacts });
});

app.post("/api/contacts", async (request, response) => {
  const input = contactInputSchema.parse(request.body);
  const email = input.email.trim().toLowerCase();
  const customerName = input.customerName?.trim() || "Subscriber";
  const source = input.source || "popup";

  if (usePostgres) {
    await pool.query(
      `insert into contacts (email, customer_name, address, payload)
       values ($1, $2, $3, $4)
       on conflict (email) do update set
         customer_name = excluded.customer_name,
         payload = excluded.payload,
         updated_at = now()`,
      [email, customerName, `Subscribed via ${source}`, { email, customerName, source }],
    );
  } else {
    const db = readDb();
    const existing = db.contacts[email] || {};
    db.contacts[email] = {
      email,
      customerName: existing.customerName || customerName,
      address: existing.address || `Subscribed via ${source}`,
      lastOrderId: existing.lastOrderId || null,
      payload: { email, customerName, source },
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
  }

  response.json({ ok: true });
});

// Stripe Checkout Session Integration
app.post("/api/create-checkout-session", async (request, response) => {
  try {
    const { customerName, email, items, storefront, discountCode } = request.body;
    const cleanedEmail = String(email || "").trim();
    const cleanedName = String(customerName || "Customer").trim();

    if (!cleanedEmail || !Array.isArray(items) || items.length === 0) {
      response.status(400).json({ error: "Customer email and at least one cart item are required." });
      return;
    }

    let discountPercent = 0;
    let isFreeShipping = false;
    if (discountCode === "WHEEL10" || discountCode === "WELCOME10") discountPercent = 10;
    else if (discountCode === "WHEEL15") discountPercent = 15;
    else if (discountCode === "WHEEL20") discountPercent = 20;
    else if (discountCode === "FREESHIP") isFreeShipping = true;

    const discountFactor = 1 - (discountPercent / 100);

    const lineItems = items.map((item: any) => {
      const name = String(item.name || "Product").trim();
      const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      const originalUnitAmount = Math.round(Number(item.price || 0) * 100);
      const unitAmount = Math.max(1, Math.round(originalUnitAmount * discountFactor));

      return {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: discountPercent > 0 ? `${name} (${discountPercent}% OFF)` : name,
            metadata: {
              product_id: String(item.productId || ""),
            },
          },
        },
      };
    });

    const subtotal = lineItems.reduce((total, item) => total + item.price_data.unit_amount * item.quantity, 0);
    const tax = Math.round(subtotal * taxRate);
    const shipping = (isFreeShipping || subtotal >= Math.round(freeShippingThreshold * 100)) ? 0 : Math.round(flatShipping * 100);

    if (tax > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: tax,
          product_data: {
            name: "Estimated sales tax",
          },
        },
      });
    }

    const hostHeader = request.headers.host || "localhost:5173";
    const origin = process.env.PUBLIC_SITE_URL || `http://${hostHeader.includes("localhost") ? "localhost:5173" : hostHeader}`;
    const appBase = "/Products4thePeople/";
    const successUrl = `${origin}${appBase}?checkout=success&session_id={CHECKOUT_SESSION_ID}#${storefront || "general"}`;
    const cancelUrl = `${origin}${appBase}?checkout=cancelled#checkout`;

    if (!stripe) {
      const sessionId = `mock_session_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const mockSession: MockSession = {
        id: sessionId,
        customerEmail: cleanedEmail,
        customerName: cleanedName,
        items: items,
        subtotal: subtotal / 100,
        shipping: shipping / 100,
        tax: tax / 100,
        total: (subtotal + tax + shipping) / 100,
        discountCode: discountCode || "",
        storefront: storefront || "general",
        successUrl: successUrl.replace("{CHECKOUT_SESSION_ID}", sessionId),
        cancelUrl: cancelUrl,
        paymentStatus: "unpaid",
        status: "open",
      };

      mockSessions.set(sessionId, mockSession);
      console.log(`[SIMULATOR] Mock Checkout Session Created: ${sessionId}`);

      response.json({ id: sessionId, url: `/api/mock-checkout?session_id=${sessionId}` });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: cleanedEmail,
      client_reference_id: `${storefront || "general"}-${Date.now()}`,
      line_items: lineItems,
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shipping,
              currency: "usd",
            },
            display_name: shipping === 0 ? "Free shipping" : "Standard shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
      ],
      metadata: {
        customer_name: cleanedName,
        storefront: String(storefront || "general"),
        subtotal_cents: String(subtotal),
        shipping_cents: String(shipping),
        tax_cents: String(tax),
        discount_code: String(discountCode || ""),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    response.json({ id: session.id, url: session.url });
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : "Stripe execution failed";
    response.status(500).json({ error: message });
  }
});

app.get("/api/checkout-session", async (request, response) => {
  const sessionId = String(request.query.session_id || "");
  if (!sessionId) {
    response.status(400).json({ error: "session_id query parameter is required." });
    return;
  }

  // Intercept Mock Simulator Session IDs
  const mockSession = mockSessions.get(sessionId);
  if (mockSession) {
    response.json({
      id: mockSession.id,
      paymentStatus: mockSession.paymentStatus,
      status: mockSession.status,
      customerEmail: mockSession.customerEmail,
    });
    return;
  }

  if (!stripe) {
    response.status(500).json({ error: "STRIPE_SECRET_KEY is required to retrieve checkout sessions." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    response.json({
      id: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_details?.email || session.customer_email,
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Stripe session retrieve failed." });
  }
});

// AliExpress Product URL Import
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

app.get("/api/medusa/health", requireAdmin, async (_request, response) => {
  const medusaUrl = getMedusaUrl();
  try {
    const medusaResponse = await fetch(`${medusaUrl}/health`);
    response.status(medusaResponse.ok ? 200 : 502).json({
      ok: medusaResponse.ok,
      medusaUrl,
      status: medusaResponse.status,
    });
  } catch (error) {
    // Graceful fallback: if real Medusa is offline but user connects to mock path, return mock active state
    if (medusaUrl.includes("mock-medusa")) {
      response.json({ ok: true, medusaUrl, status: 200, simulated: true });
    } else {
      response.status(502).json({ error: "Medusa is offline. Tip: Click 'Connect to Simulator' to test with the mock backend!" });
    }
  }
});

app.get("/api/medusa/products", requireAdmin, async (_request, response) => {
  const medusaUrl = getMedusaUrl();
  try {
    const medusaResponse = await fetch(`${medusaUrl}/admin/products?limit=100`, {
      headers: medusaHeaders(),
    });

    if (!medusaResponse.ok) {
      response.status(502).json({ error: `Medusa product fetch returned ${medusaResponse.status}` });
      return;
    }

    response.json(await medusaResponse.json());
  } catch (error) {
    response.status(502).json({ error: "Medusa is offline. Check backend configuration." });
  }
});

// GET /api/mock-checkout serves a highly polished Stripe Checkout Simulation page
app.get("/api/mock-checkout", (request, response) => {
  const sessionId = String(request.query.session_id || "");
  const session = mockSessions.get(sessionId);

  if (!session) {
    response.status(404).send(`
      <html>
        <head>
          <title>Session Not Found - Checkout Simulator</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #f1f5f9; }
            .card { background: #111827; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; max-width: 400px; border: 1px solid #1f2937; }
            h1 { font-size: 24px; color: #ef4444; margin-bottom: 10px; }
            p { color: #9ca3af; margin-bottom: 20px; }
            a { display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Session Not Found</h1>
            <p>The simulated checkout session is invalid or has expired.</p>
            <a href="/Products4thePeople/#general">Return to Storefront</a>
          </div>
        </body>
      </html>
    `);
    return;
  }

  response.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stripe Checkout Simulator - Products4ThePeople</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #0b0f19;
          color: #f1f5f9;
          margin: 0;
          padding: 0;
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
        }
        .container {
          width: 100%;
          max-width: 950px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          background: #111827;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          margin: 20px;
          border: 1px solid #1f2937;
        }
        .order-summary {
          background-color: #1f2937;
          padding: 40px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #374151;
        }
        .payment-details {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .badge {
          align-self: flex-start;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 9999px;
          margin-bottom: 20px;
        }
        h2 { margin: 0 0 10px 0; font-size: 20px; font-weight: 500; color: #9ca3af; }
        h1 { margin: 0 0 30px 0; font-size: 36px; font-weight: 700; color: #ffffff; }
        .item-list { flex: 1; margin-bottom: 30px; overflow-y: auto; max-height: 250px; padding-right: 5px; }
        .item-list::-webkit-scrollbar { width: 6px; }
        .item-list::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #9ca3af; }
        .totals-row.grand-total { border-top: 1px solid #374151; padding-top: 18px; margin-top: 18px; font-size: 22px; font-weight: 600; color: #ffffff; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 14px; font-weight: 500; color: #9ca3af; margin-bottom: 8px; }
        .input-group input {
          width: 100%;
          background: #1f2937;
          border: 1px solid #374151;
          color: #ffffff;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-group input:focus { border-color: #6366f1; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .stripe-notice {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 14px;
          border-radius: 8px;
          font-size: 13px;
          color: #a5b4fc;
          margin-bottom: 25px;
          line-height: 1.5;
        }
        .btn-pay {
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .btn-pay:hover { background: #4f46e5; }
        .btn-pay:active { transform: scale(0.99); }
        .btn-cancel {
          background: transparent;
          color: #9ca3af;
          border: 1px solid #374151;
          border-radius: 8px;
          padding: 12px;
          font-size: 14.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-top: 12px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.03); color: #ffffff; }
        @media (max-width: 768px) {
          .container { grid-template-columns: 1fr; margin: 10px; }
          .order-summary { border-right: none; border-bottom: 1px solid #374151; padding: 30px; }
          .payment-details { padding: 30px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Order Summary Column -->
        <div class="order-summary">
          <div class="badge">Offline Simulation</div>
          <h2>Pay Products4ThePeople</h2>
          <h1>$${session.total.toFixed(2)}</h1>
          
          <div class="item-list">
            ${session.items.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #374151; padding-bottom: 12px;">
                <div>
                  <h4 style="margin: 0; font-size: 14.5px; font-weight: 600; color: #ffffff;">${item.name}</h4>
                  <span style="font-size: 13px; color: #9ca3af;">Qty: ${item.quantity} &bull; $${Number(item.price).toFixed(2)} each</span>
                </div>
                <strong style="font-size: 14.5px; color: #ffffff;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</strong>
              </div>
            `).join('')}
          </div>

          <div class="totals-row">
            <span>Subtotal</span>
            <span>$${session.subtotal.toFixed(2)}</span>
          </div>
          ${session.discountCode ? `
            <div class="totals-row" style="color: #34d399;">
              <span>Discount (${session.discountCode})</span>
              <span>Applied</span>
            </div>
          ` : ''}
          <div class="totals-row">
            <span>Shipping</span>
            <span>${session.shipping === 0 ? 'Free' : '$' + session.shipping.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Sales tax</span>
            <span>$${session.tax.toFixed(2)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total amount</span>
            <span>$${session.total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Details Column -->
        <div class="payment-details">
          <div class="stripe-notice">
            <strong>Stripe Simulation Mode</strong><br>
            Your local server did not find a configured <code>STRIPE_SECRET_KEY</code>. You are using the checkout simulator. No real money will be charged.
          </div>

          <form action="/api/mock-checkout/complete" method="POST">
            <input type="hidden" name="session_id" value="${session.id}">
            
            <div class="input-group">
              <label for="email">Customer Email</label>
              <input type="email" id="email" name="email" value="${session.customerEmail}" required>
            </div>
            
            <div class="input-group">
              <label for="name">Name on Card</label>
              <input type="text" id="name" name="name" value="${session.customerName}" required>
            </div>

            <div class="input-group">
              <label for="card">Card Information</label>
              <input type="text" id="card" value="4242 4242 4242 4242" placeholder="4242 4242 4242 4242" required>
            </div>

            <div class="input-row">
              <div class="input-group">
                <label for="expiry">Expiry Date</label>
                <input type="text" id="expiry" value="12/28" placeholder="MM / YY" required>
              </div>
              <div class="input-group">
                <label for="cvc">CVC</label>
                <input type="text" id="cvc" value="123" placeholder="123" required>
              </div>
            </div>

            <div class="input-group">
              <label for="address">Shipping & Billing Address</label>
              <input type="text" id="address" name="address" value="123 Main St, New York, NY 10001" required>
            </div>

            <button type="submit" class="btn-pay">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Complete simulated payment
            </button>
          </form>
          
          <form action="/api/mock-checkout/cancel" method="POST">
            <input type="hidden" name="session_id" value="${session.id}">
            <button type="submit" class="btn-cancel">
              Cancel checkout and return
            </button>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

// POST /api/mock-checkout/complete processes the simulated payment
app.post("/api/mock-checkout/complete", express.urlencoded({ extended: true }), (request, response) => {
  const sessionId = String(request.body.session_id || "");
  const session = mockSessions.get(sessionId);

  if (!session) {
    response.status(404).send("Mock session not found");
    return;
  }

  // Save details typed in by simulator
  session.customerEmail = String(request.body.email || session.customerEmail).trim();
  session.customerName = String(request.body.name || session.customerName).trim();
  const address = String(request.body.address || "123 Main St, New York, NY 10001").trim();

  // Mark as paid & complete
  session.paymentStatus = "paid";
  session.status = "complete";
  session.cancelUrl = address; // temporarily store billing address in cancelUrl

  console.log(`[SIMULATOR] Mock Checkout Session Completed (PAID): ${sessionId}`);
  response.redirect(session.successUrl);
});

// POST /api/mock-checkout/cancel cancels the simulated checkout
app.post("/api/mock-checkout/cancel", express.urlencoded({ extended: true }), (request, response) => {
  const sessionId = String(request.body.session_id || "");
  const session = mockSessions.get(sessionId);

  if (session) {
    session.paymentStatus = "failed";
    session.status = "expired";
    response.redirect(session.cancelUrl);
  } else {
    response.redirect("/Products4thePeople/#general");
  }
});

// Mock Medusa Integration Simulator Endpoints
app.get("/api/mock-medusa/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/mock-medusa/admin/products", (_request, response) => {
  response.json({
    count: 4,
    products: [
      {
        id: "mock_medusa_prod_1",
        title: "Medusa Smart Massage Roller",
        status: "published",
        subtitle: "Fitness Recovery",
        description: "Intelligent vibrating recovery roller with 4 speed settings for sore muscle relief.",
        handle: "medusa-smart-massage-roller",
        metadata: {
          niche: "Fitness",
          subdomain: "fitness",
          cost_min: 8.5,
          cost_max: 8.5,
          shipping_min: 3.5,
          shipping_max: 3.5,
          priority: 1,
          aliexpress_search_url: "https://www.aliexpress.us/w/wholesale-vibrating-foam-roller.html",
          content_angle: "Sore muscle relief in 90 seconds with targeted vibration massage",
          seo_title: "Medusa Smart Massage Roller | Premium Recovery Gear",
          seo_description: "Targeted vibration foam roller designed for deep tissue massage and muscle recovery.",
          images: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438,https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        },
        images: [
          { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438" },
          { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b" }
        ],
        variants: [
          {
            inventory_quantity: 145,
            prices: [{ amount: 4999 }]
          }
        ]
      },
      {
        id: "mock_medusa_prod_2",
        title: "Medusa Organic Hemp Paw Balm",
        status: "published",
        subtitle: "Premium Pet Wellness",
        description: "All-natural soothing and healing balm for cracked paws, dry noses, and hot spots.",
        handle: "medusa-organic-hemp-paw-balm",
        metadata: {
          niche: "Pets",
          subdomain: "pets",
          cost_min: 2.2,
          cost_max: 2.2,
          shipping_min: 1.5,
          shipping_max: 1.5,
          priority: 2,
          aliexpress_search_url: "https://www.aliexpress.us/w/wholesale-dog-paw-balm-organic.html",
          content_angle: "Heals cracked pet paws overnight with 100% USDA organic hemp oil balm",
          seo_title: "Medusa Organic Hemp Paw Balm | Natural Pet Skincare",
          seo_description: "Soothing cracked paw balm made from organic hemp oil and shea butter. Veterinary formulated.",
          images: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b,https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
        },
        images: [
          { url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b" },
          { url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e" }
        ],
        variants: [
          {
            inventory_quantity: 230,
            prices: [{ amount: 1999 }]
          }
        ]
      },
      {
        id: "mock_medusa_prod_3",
        title: "Medusa LED Neck Lift Massager",
        status: "published",
        subtitle: "Luxury Skincare Tools",
        description: "Sonic vibration microcurrent neck and face contouring beauty device with red/blue LED therapy.",
        handle: "medusa-led-neck-lift-massager",
        metadata: {
          niche: "Beauty",
          subdomain: "beauty",
          cost_min: 5.4,
          cost_max: 5.4,
          shipping_min: 2.5,
          shipping_max: 2.5,
          priority: 3,
          aliexpress_search_url: "https://www.aliexpress.us/w/wholesale-neck-beauty-device-led.html",
          content_angle: "Reduces neck wrinkles and tightens jawline with home microcurrent therapy",
          seo_title: "Medusa LED Neck Lift Massager | Wrinkle Reduction Device",
          seo_description: "Professional grade microcurrent neck contouring beauty device featuring dual light therapy.",
          images: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881,https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
        },
        images: [
          { url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881" },
          { url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796" }
        ],
        variants: [
          {
            inventory_quantity: 90,
            prices: [{ amount: 5999 }]
          }
        ]
      },
      {
        id: "mock_medusa_prod_4",
        title: "Medusa Wireless Sunset Projector",
        status: "published",
        subtitle: "Aesthetic Home Decor",
        description: "USB rechargeable atmospheric projection lamp with smart 16-color remote and rotation.",
        handle: "medusa-wireless-sunset-projector",
        metadata: {
          niche: "Home",
          subdomain: "home",
          cost_min: 3.1,
          cost_max: 3.1,
          shipping_min: 2.0,
          shipping_max: 2.0,
          priority: 4,
          aliexpress_search_url: "https://www.aliexpress.us/w/wholesale-rechargeable-sunset-lamp.html",
          content_angle: "Transforms any dark bedroom into a warm, aesthetic sunset photo studio",
          seo_title: "Medusa Wireless Sunset Projector | Aesthetic Room Decor",
          seo_description: "Create cozy atmospheric vibes with our USB rechargeable smart 16-color sunset projection lamp.",
          images: "https://images.unsplash.com/photo-1513694203232-719a280e022f,https://images.unsplash.com/photo-1556228453-efd6c1ff04f6",
        },
        images: [
          { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f" },
          { url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6" }
        ],
        variants: [
          {
            inventory_quantity: 110,
            prices: [{ amount: 2999 }]
          }
        ]
      }
    ]
  });
});

app.get("/api/mock-medusa/admin/orders", (_request, response) => {
  response.json({
    count: 2,
    orders: [
      {
        id: "mock_medusa_order_1",
        display_id: 1084,
        email: "sarah@gmail.com",
        status: "completed",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        subtotal: 9998,
        total: 10698,
        currency_code: "usd",
        shipping_address: {
          first_name: "Sarah",
          last_name: "Miller",
          address_1: "789 Pine Rd",
          city: "Seattle",
          province: "WA",
          postal_code: "98101"
        },
        items: [
          {
            id: "medusa-item-1",
            title: "Medusa Smart Massage Roller",
            quantity: 2,
            unit_price: 4999
          }
        ]
      },
      {
        id: "mock_medusa_order_2",
        display_id: 1085,
        email: "tom@yahoo.com",
        status: "processing",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        subtotal: 1999,
        total: 2699,
        currency_code: "usd",
        shipping_address: {
          first_name: "Tom",
          last_name: "Baker",
          address_1: "456 Birch Ln",
          city: "Austin",
          province: "TX",
          postal_code: "73301"
        },
        items: [
          {
            id: "medusa-item-2",
            title: "Medusa Organic Hemp Paw Balm",
            quantity: 1,
            unit_price: 1999
          }
        ]
      }
    ]
  });
});

// POST /api/ai/generate copywriting and UGC scripts creator
app.post("/api/ai/generate", requireAdmin, async (request, response) => {
  try {
    const { productId, action } = z.object({
      productId: z.string(),
      action: z.enum(["creative_hooks", "email_flows", "offer_tests", "product_description"])
    }).parse(request.body);

    const products = await getProductsDb();
    const product = products.find((p: any) => p.id === productId);

    if (!product) {
      response.status(404).json({ error: "Product not found to generate copy for." });
      return;
    }

    const name = product.name;
    const angle = product.contentAngle || "high-quality dropship essential";
    const niche = product.niche || "General";

    let result = "";

    if (action === "creative_hooks") {
      result = `### 🎬 TikTok/Reels Video Scripts for "${name}"
Niche Focus: **${niche}** | Core Hook: **${angle}**

---

#### 💡 Hook Scenario 1: "The Wake-Up Call" (Pain Point Hook)
- **Visual (0-3s)**: Extreme close-up of someone showing frustration. Fast cuts, high emotion. Captions: "I was today years old when I realized..."
- **Audio/Voiceover**: "If you're still dealing with this hassle in 2026, stop scrolling immediately. This is your wake-up call."
- **Visual (3-8s)**: Smooth transition displaying the **${name}** in action, solving the problem instantly. Bright, professional UGC lighting.
- **Visual (8-15s)**: Show the product detail close-ups. Floating discount text card: "WHEEL10 for 10% off."
- **Call-to-Action**: "Tap below to upgrade your routine before this collection sells out."

---

#### 💡 Hook Scenario 2: "Unboxing the Aesthetic" (Satisfying UGC)
- **Visual (0-3s)**: ASMR tap on the elegant packaging box. Slide lid off slowly to reveal **${name}**. Satisfying crinkle sounds.
- **Audio/Voiceover**: *Satisfying ambient music* & "No thoughts, just the absolute aesthetic satisfaction of unboxing this beauty..."
- **Visual (3-10s)**: Quick montage of close-ups showing high-end construction materials, neat seams, and functional highlights.
- **Call-to-Action**: "Link in bio to check current inventory in our limited release collections."

---

#### 💡 Hook Scenario 3: "Before vs. After" (Viral UGC Comparison)
- **Visual (0-4s)**: Split-screen or quick cut showing the sad/messy "Before" state of a daily situation.
- **Audio/Voiceover**: "My daily setup before vs. after discovering this game changer. The difference is literally night and day."
- **Visual (4-12s)**: Bright, satisfying "After" visual showing **${name}** completely fixing the situation. Show an aesthetic smile.
- **Call-to-Action**: "Get yours at beauty.products4thepeople.com with free shipping over $75."`;
    } else if (action === "email_flows") {
      result = `### ✉️ Complete Automated Email Sequences for "${name}"
Funnel: **High-Converting Customer Retention & Recovery**

---

#### 🛒 Email 1: Abandoned Cart Recovery (Send 30 mins after exit)
- **Subject Line**: "Wait, did you forget something? 🧐"
- **Header**: "We saved your ${name}!"
- **Body Copy**:
  "Hey there,
  
  We noticed you left your **${name}** sitting in your shopping cart. Don't worry, we've reserved it for the next 24 hours so you don't lose out on this collection's limited batch!
  
  Here is a special incentive to help you make up your mind:
  
  ✨ Use code **WELCOME10** at checkout for an extra **10% OFF** your entire order!
  
  👉 [Resume Checkout Now & Apply WELCOME10](/checkout)"
- **Footer**: "Free shipping automatically applied to all orders over $75."

---

#### 🎉 Email 2: Welcome & Dynamic Discount (Send immediately on subscription)
- **Subject Line**: "Welcome to the Tribe + Your Special Code Inside! 🎁"
- **Header**: "You are officially on the list!"
- **Body Copy**:
  "Hi friend,
  
  Welcome to Products4ThePeople. You are now part of our exclusive community of launch testers and trendsetters.
  
  As promised, here is your dynamic coupon generated from our spinning wheel:
  
  🎟️ Your Code: **WHEEL15** (Enjoy **15% OFF** your first order!)
  
  Explore our trending items:
  - **${name}** (${angle})
  
  👉 [Shop the Trending Collections now](/)"

---

#### 🔄 Email 3: Winback / Customer Loyalty (Send 30 days post-purchase)
- **Subject Line**: "A special treat for our favorite people... ❤️"
- **Body Copy**:
  "Hi,
  
  It's been a month since your **${name}** arrived, and we hope you are absolutely loving it!
  
  To show our appreciation, we want to give you exclusive early access to our upcoming seasonal drops before they go public.
  
  Plus, take **20% OFF** any item in our catalog with code **LOYAL20**:
  
  👉 [Claim 20% Loyalty Discount](/)"`;
    } else if (action === "offer_tests") {
      result = `### 🏷️ High-Yield Offer and Pricing Tests for "${name}"
AOV Target: **+$15.00** | Profit Margin Optimization

---

#### 📈 Offer Tier 1: The "Bundle & Save" (Multi-Unit Upsell)
- **Concept**: Encourage customers to purchase multiple units for family/friends, increasing AOV significantly.
- **Pricing Strategy**:
  - Buy 1: Regular Landed Price ($${product.retailMin.toFixed(2)})
  - Buy 2: Get the 2nd for **20% OFF** ($${(product.retailMin * 1.8).toFixed(2)} total)
  - Buy 3: Get 1 **FREE** ($${(product.retailMin * 2.0).toFixed(2)} total - *Highly Viral Offer!*)
- **Ad Copy Angle**: "One for the bedroom, one for the living room! Gift the absolute best this season."

---

#### 🎁 Offer Tier 2: The "Gift With Purchase" (Cart Bump)
- **Concept**: Cross-sell a complementary item for an extra $4.99 at cart addition.
- **Pricing Strategy**: Add the **${name}** to your cart and unlock the premium matching carrier bag for just **$4.90** (usually $14.99).
- **Technical setup**: Embedded one-click add button inside cart drawer.

---

#### 🚚 Offer Tier 3: Free Shipping Threshold Trigger
- **Concept**: Set flat-rate shipping to $7.00 and free shipping above $75.00.
- **Context**: **${name}** retails at $${product.retailMin.toFixed(2)}. Add a $15.00 accessory to hit the threshold.
- **Ad Copy Angle**: "Add one more essential accessory to your order and unlock FREE standard express shipping instantly!"`;
    } else if (action === "product_description") {
      result = `✨ Optimized Skincare and Wellness Copy for **${name}**:
${angle}. Engineered with clinical-grade materials for optimal performance. Fits flawlessly into your active daily routine.

✨ SEO Optimized Title Tag:
${name} | Premium dropship edition

✨ SEO Meta Description:
Discover the viral ${name}: ${angle}. Order today for fast shipping, 30-day money-back guarantee, and 10% off with coupon WHEEL10!`;
    }

    response.json({ copy: result });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "AI generation failed" });
  }
});

// GET /api/settings/config loads current environment credentials
app.get("/api/settings/config", requireAdmin, (_request, response) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  
  // Mask the secret key for safety
  const maskedStripeKey = stripeKey 
    ? stripeKey.startsWith("sk_") 
      ? `sk_...${stripeKey.substring(stripeKey.length - 4)}` 
      : "••••••••••••••••"
    : "";

  response.json({
    stripeSecretKey: maskedStripeKey,
    hasStripeKey: Boolean(stripeKey),
    medusaBackendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    medusaAdminApiKey: process.env.MEDUSA_ADMIN_API_KEY || "",
  });
});

// POST /api/settings/config writes configurations back to .env
app.post("/api/settings/config", requireAdmin, async (request, response) => {
  try {
    const { stripeSecretKey, medusaBackendUrl, medusaAdminApiKey } = z.object({
      stripeSecretKey: z.string().optional(),
      medusaBackendUrl: z.string().url().optional().or(z.string().length(0)),
      medusaAdminApiKey: z.string().optional(),
    }).parse(request.body);

    const envFile = path.join(process.cwd(), ".env");
    let envContent = "";

    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, "utf-8");
    } else {
      const exampleFile = path.join(process.cwd(), ".env.example");
      if (fs.existsSync(exampleFile)) {
        envContent = fs.readFileSync(exampleFile, "utf-8");
      }
    }

    const lines = envContent.split(/\r?\n/);
    const updatedKeys = new Set<string>();

    const updateOrAdd = (key: string, value: string) => {
      let found = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith(`${key}=`)) {
          lines[i] = `${key}=${value}`;
          found = true;
          break;
        }
      }
      if (!found) {
        lines.push(`${key}=${value}`);
      }
      updatedKeys.add(key);
    };

    // Update Stripe configuration if provided
    if (stripeSecretKey && !stripeSecretKey.startsWith("sk_...") && !stripeSecretKey.startsWith("•••")) {
      updateOrAdd("STRIPE_SECRET_KEY", stripeSecretKey);
      process.env.STRIPE_SECRET_KEY = stripeSecretKey;
      stripe = new Stripe(stripeSecretKey);
      console.log("[CONFIG] Stripe Secret Key updated and reinitialized.");
    } else if (stripeSecretKey === "") {
      updateOrAdd("STRIPE_SECRET_KEY", "");
      process.env.STRIPE_SECRET_KEY = "";
      stripe = null;
      console.log("[CONFIG] Stripe Secret Key cleared.");
    }

    // Update Medusa configuration if provided
    const cleanMedusaUrl = String(medusaBackendUrl || "").trim().replace(/\/$/, "");
    updateOrAdd("MEDUSA_BACKEND_URL", cleanMedusaUrl);
    updateOrAdd("VITE_MEDUSA_BACKEND_URL", cleanMedusaUrl);
    process.env.MEDUSA_BACKEND_URL = cleanMedusaUrl;
    process.env.VITE_MEDUSA_BACKEND_URL = cleanMedusaUrl;

    const cleanMedusaKey = String(medusaAdminApiKey || "").trim();
    updateOrAdd("MEDUSA_ADMIN_API_KEY", cleanMedusaKey);
    updateOrAdd("VITE_MEDUSA_ADMIN_API_KEY", cleanMedusaKey);
    process.env.MEDUSA_ADMIN_API_KEY = cleanMedusaKey;
    process.env.VITE_MEDUSA_ADMIN_API_KEY = cleanMedusaKey;

    console.log("[CONFIG] Medusa configurations updated successfully.");

    // Write updated lines back to .env
    fs.writeFileSync(envFile, lines.join("\n"), "utf-8");

    response.json({
      ok: true,
      message: "Configurations updated in .env and reloaded successfully!",
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to update configurations" });
  }
});

// GET /api/orders/:id retrieves a specific order (for public order tracking timeline)
app.get("/api/orders/:id", async (request, response) => {
  try {
    const orders = await getOrdersDb();
    const order = orders.find((o: any) => o.id === request.params.id);
    if (!order) {
      response.status(404).json({ error: "Order not found" });
      return;
    }
    response.json({ order });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch order details" });
  }
});

// GET /api/orders/customer/:email retrieves order history for a customer
app.get("/api/orders/customer/:email", async (request, response) => {
  try {
    const email = request.params.email.trim().toLowerCase();
    const orders = await getOrdersDb();
    const matched = orders.filter((o: any) => o.email.toLowerCase() === email);
    response.json({ orders: matched });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch customer order history" });
  }
});

// GET /api/customers/:email/profile fetches preferences and saved carts
app.get("/api/customers/:email/profile", async (request, response) => {
  try {
    const email = request.params.email.trim().toLowerCase();
    if (usePostgres) {
      const result = await pool.query("select payload from contacts where email = $1", [email]);
      if (result.rowCount > 0) {
        response.json(result.rows[0].payload);
      } else {
        response.json({ email, preferences: {}, savedCart: {} });
      }
    } else {
      const db = readDb();
      const customer = db.customers[email] || { email, preferences: {}, savedCart: {} };
      response.json(customer);
    }
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch customer profile" });
  }
});

// POST /api/customers/:email/profile saves preferences and carts
app.post("/api/customers/:email/profile", async (request, response) => {
  try {
    const email = request.params.email.trim().toLowerCase();
    const { preferences, savedCart, name } = request.body;

    if (usePostgres) {
      await pool.query(
        `insert into contacts (email, customer_name, address, payload)
         values ($1, $2, $3, $4)
         on conflict (email) do update set
           customer_name = excluded.customer_name,
           payload = excluded.payload,
           updated_at = now()`,
        [
          email, 
          name || "Customer", 
          preferences?.address || "Collected by Portal", 
          { email, name, preferences, savedCart, updatedAt: new Date().toISOString() }
        ]
      );
    } else {
      const db = readDb();
      const existing = db.customers[email] || {};
      db.customers[email] = {
        email,
        name: name || existing.name || "Customer",
        preferences: preferences || existing.preferences || {},
        savedCart: savedCart || existing.savedCart || {},
        updatedAt: new Date().toISOString(),
      };
      
      // Sync to contacts as well for admin directory visibility
      db.contacts[email] = {
        email,
        customerName: name || existing.name || db.contacts[email]?.customerName || "Customer",
        address: preferences?.address || db.contacts[email]?.address || "Subscribed via Account Portal",
        lastOrderId: db.contacts[email]?.lastOrderId || null,
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to save customer profile" });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ error: message });
});

// Serve static frontend assets from dist folder in production
const distPath = path.resolve("dist");
app.use(express.static(distPath));

// Fallback all other GET requests to index.html for React SPA routing
app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api") || (request.headers.accept && !request.headers.accept.includes("text/html"))) {
    next();
    return;
  }
  response.sendFile(path.join(distPath, "index.html"));
});

// Database Abstraction & SQL Helpers
async function getProductsDb() {
  if (usePostgres) {
    const result = await pool.query("select payload from products order by priority asc, name asc");
    return result.rows.map((row) => row.payload);
  } else {
    const db = readDb();
    return Object.values(db.products).sort((a: any, b: any) => (a.priority - b.priority) || a.name.localeCompare(b.name));
  }
}

async function upsertProductDb(product: any) {
  if (usePostgres) {
    await pool.query(
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
  } else {
    const db = readDb();
    db.products[product.id] = product;
    writeDb(db);
  }
}

async function deleteProductDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("delete from products where id = $1 returning payload", [id]);
    return result.rowCount > 0 ? result.rows[0].payload : null;
  } else {
    const db = readDb();
    const product = db.products[id];
    if (product) {
      delete db.products[id];
      writeDb(db);
      return product;
    }
    return null;
  }
}

async function replaceProductsDb(products: any[]) {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("delete from products");
      for (const product of products) {
        await upsertProductDb(product);
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } else {
    const db = readDb();
    db.products = {};
    for (const product of products) {
      db.products[product.id] = product;
    }
    writeDb(db);
  }
}

async function getOrdersDb() {
  if (usePostgres) {
    const result = await pool.query("select payload from orders order by created_at desc");
    return result.rows.map((row) => row.payload);
  } else {
    const db = readDb();
    return Object.values(db.orders).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  }
}

async function upsertOrderDb(order: any) {
  if (usePostgres) {
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
         values ($1, $2, $3, $4, $5, $6)
         on conflict (id) do update set
           customer_email = excluded.customer_email,
           subtotal = excluded.subtotal,
           status = excluded.status,
           created_at = excluded.created_at,
           payload = excluded.payload`,
        [order.id, order.email, order.subtotal, order.status, order.createdAt, order],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } else {
    const db = readDb();
    db.orders[order.id] = order;
    
    // Also save/update contact capture
    const contact = {
      email: order.email,
      customerName: order.customerName,
      address: order.address,
      lastOrderId: order.id,
      payload: order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.contacts[order.email.toLowerCase()] = contact;
    writeDb(db);
  }
}

async function getContactsDb() {
  if (usePostgres) {
    const result = await pool.query(
      `select email, customer_name as "customerName", address, last_order_id as "lastOrderId", updated_at as "updatedAt" 
       from contacts order by updated_at desc`
    );
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.contacts)
      .map((c: any) => ({
        email: c.email,
        customerName: c.customerName,
        address: c.address,
        lastOrderId: c.lastOrderId || null,
        updatedAt: c.updatedAt
      }))
      .sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

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

// Start Server & Check PG Connection Fallback
async function startServer() {
  if (databaseUrl) {
    try {
      const client = await pool.connect();
      client.release();
      usePostgres = true;
      console.log("PostgreSQL database connected successfully. Active mode: Postgres database.");
      await migrate();
    } catch (error) {
      console.warn("Failed to connect to PostgreSQL database. Falling back to local file-based database store (server/db.json). Error:", error instanceof Error ? error.message : error);
    }
  } else {
    console.log("DATABASE_URL is not set. Using local file-based database store (server/db.json).");
  }

  app.listen(port, () => {
    console.log(`P4tP API Server running on http://localhost:${port}`);
    console.log(`Development Stripe endpoints active via Vite proxy on port 5173`);
    console.log(`Database storage mode: ${usePostgres ? "PostgreSQL Database" : "Local File Fallback (server/db.json)"}`);
  });
}

void startServer();
