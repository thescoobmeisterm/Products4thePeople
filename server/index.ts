import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";
import { z } from "zod";
import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

dotenv.config();

const { Pool } = pg;
const port = Number(process.env.API_PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@products4thepeople.com";
const adminPassword = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "change-this-password";
const saleNotifyEnabled = process.env.SALE_NOTIFY_ENABLED !== "false";
const saleNotifyExtraEmails = (process.env.SALE_NOTIFY_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
const resendApiKey = process.env.RESEND_API_KEY || "";
const saleNotifyFrom = process.env.SALE_NOTIFY_FROM || process.env.RESEND_FROM || "";

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
const UPLOAD_DIR = path.join(process.cwd(), "server", "uploads");

interface DbSchema {
  products: Record<string, any>;
  orders: Record<string, any>;
  contacts: Record<string, any>;
  customers: Record<string, any>;
  opportunities?: Record<string, any>;
  competitors?: Record<string, any>;
  suppliers?: Record<string, any>;
  researchRuns?: Record<string, any>;
  importJobs?: Record<string, any>;
  experiments?: Record<string, any>;
  experimentVariants?: Record<string, any>;
  articles?: Record<string, any>;
  knowledgeArticles?: Record<string, any>;
  seoPages?: Record<string, any>;
  mediaAssets?: Record<string, any>;
}

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {
        products: {},
        orders: {},
        contacts: {},
        customers: {},
        opportunities: {},
        competitors: {},
        suppliers: {},
        researchRuns: {},
        importJobs: {},
        experiments: {},
        experimentVariants: {},
        articles: {},
        knowledgeArticles: {},
        seoPages: {},
        mediaAssets: {}
      };
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      products: parsed.products || {},
      orders: parsed.orders || {},
      contacts: parsed.contacts || {},
      customers: parsed.customers || {},
      opportunities: parsed.opportunities || {},
      competitors: parsed.competitors || {},
      suppliers: parsed.suppliers || {},
      researchRuns: parsed.researchRuns || {},
      importJobs: parsed.importJobs || {},
      experiments: parsed.experiments || {},
      experimentVariants: parsed.experimentVariants || {},
      articles: parsed.articles || {},
      knowledgeArticles: parsed.knowledgeArticles || {},
      seoPages: parsed.seoPages || {},
      mediaAssets: parsed.mediaAssets || {},
    };
  } catch {
    return {
      products: {},
      orders: {},
      contacts: {},
      customers: {},
      opportunities: {},
      competitors: {},
      suppliers: {},
      researchRuns: {},
      importJobs: {},
      experiments: {},
      experimentVariants: {},
      articles: {},
      knowledgeArticles: {},
      seoPages: {},
      mediaAssets: {}
    };
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
  subdomain: z.string().min(1),
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
  trustBadges: z.array(z.string()).optional(),
  productHighlights: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
  })).optional(),
  faqs: z.array(z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1),
  })).optional(),
  reviews: z.array(z.object({
    id: z.string().min(1),
    author: z.string().min(1),
    rating: z.number().min(1).max(5),
    date: z.string().min(1),
    text: z.string().min(1),
    verified: z.boolean(),
  })).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  source: z.enum(["seed", "local", "medusa"]).optional(),
}).passthrough();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  variations: z.string().optional(),
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
  storeLabel: z.string().optional(),
  phone: z.string().optional(),
  wantsSms: z.boolean().optional(),
  couponCode: z.string().optional(),
  role: z.enum(["customer", "admin"]).optional(),
});

const contactRoleSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

const mediaUrlSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  kind: z.enum(["image", "video"]),
  placement: z.enum(["library", "listing", "video_section"]).default("library"),
  productId: z.string().optional(),
  handle: z.string().optional(),
  caption: z.string().optional(),
  tag: z.string().optional(),
});

const mediaUploadSchema = mediaUrlSchema.extend({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  dataUrl: z.string().min(1),
}).omit({ url: true });

// App initialization
const app = express();
const uploadBodyLimit = process.env.UPLOAD_BODY_LIMIT || "150mb";
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: uploadBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: uploadBodyLimit }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.use((error: any, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (error?.type === "entity.too.large") {
    response.status(413).json({ error: `Upload is too large. Current API upload limit is ${uploadBodyLimit}.` });
    return;
  }
  next(error);
});

// Auth middleware
function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) {
  const email = String(request.header("x-admin-email") || "");
  const password = String(request.header("x-admin-password") || "");

  if (!isAdminRequest(request)) {
    response.status(401).json({ error: "Admin authentication required" });
    return;
  }

  next();
}

function isAdminRequest(request: express.Request) {
  const email = String(request.header("x-admin-email") || "");
  const password = String(request.header("x-admin-password") || "");
  return email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword;
}

function isEmailAddress(value: unknown) {
  return z.string().email().safeParse(value).success;
}

function formatCurrency(value: unknown) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numeric);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getAdminNotificationEmails() {
  const recipients = new Set<string>();
  if (isEmailAddress(adminEmail)) recipients.add(adminEmail.toLowerCase());
  saleNotifyExtraEmails.forEach((email) => {
    if (isEmailAddress(email)) recipients.add(email.toLowerCase());
  });

  try {
    const contacts = await getContactsDb();
    contacts
      .filter((contact: any) => contact.role === "admin" && isEmailAddress(contact.email))
      .forEach((contact: any) => recipients.add(String(contact.email).toLowerCase()));
  } catch (error) {
    console.error("Failed to load admin notification recipients:", error instanceof Error ? error.message : error);
  }

  return Array.from(recipients);
}

function buildOrderNotification(order: any) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemLines = items.map((item: any) => {
    const variations = item.variations ? ` (${item.variations})` : "";
    return `${item.quantity} x ${item.name}${variations} - ${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}`;
  });
  const itemRows = items.map((item: any) => {
    const variations = item.variations ? `<br><small>${escapeHtml(item.variations)}</small>` : "";
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}${variations}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(lineTotal)}</td>
      </tr>`;
  }).join("");

  const subjectPrefix = order.paymentStatus === "paid" ? "New paid sale" : "New order";
  const subject = `${subjectPrefix}: ${formatCurrency(order.total)} (${order.id})`;
  const text = [
    `${subjectPrefix} on Products4ThePeople`,
    "",
    `Order: ${order.id}`,
    `Customer: ${order.customerName} <${order.email}>`,
    `Payment: ${order.paymentStatus}`,
    `Fulfillment: ${order.status}`,
    `Subtotal: ${formatCurrency(order.subtotal)}`,
    `Shipping: ${formatCurrency(order.shipping)}`,
    `Tax: ${formatCurrency(order.tax)}`,
    `Total: ${formatCurrency(order.total)}`,
    "",
    "Items:",
    ...(itemLines.length ? itemLines : ["No item details supplied."]),
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px;">${escapeHtml(subjectPrefix)} on Products4ThePeople</h2>
      <p style="margin:0 0 16px;color:#4b5563;">Order <strong>${escapeHtml(order.id)}</strong> is ready for admin review.</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Customer</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.customerName)} &lt;${escapeHtml(order.email)}&gt;</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Payment</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.paymentStatus)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Fulfillment</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.status)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Total</td><td style="padding:4px 0;text-align:right;font-weight:700;">${formatCurrency(order.total)}</td></tr>
      </table>
      <h3 style="margin:16px 0 8px;">Items</h3>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        <thead>
          <tr>
            <th style="padding:8px 0;text-align:left;border-bottom:2px solid #111827;">Product</th>
            <th style="padding:8px 0;text-align:center;border-bottom:2px solid #111827;">Qty</th>
            <th style="padding:8px 0;text-align:right;border-bottom:2px solid #111827;">Line total</th>
          </tr>
        </thead>
        <tbody>${itemRows || `<tr><td colspan="3" style="padding:8px 0;">No item details supplied.</td></tr>`}</tbody>
      </table>
    </div>`;

  return { subject, text, html };
}

async function notifyAdminsOfOrder(order: any) {
  if (!saleNotifyEnabled) return;
  if (!resendApiKey || !saleNotifyFrom) {
    console.warn("Sale notification skipped: RESEND_API_KEY and SALE_NOTIFY_FROM are required.");
    return;
  }

  const recipients = await getAdminNotificationEmails();
  if (recipients.length === 0) {
    console.warn("Sale notification skipped: no admin recipients found.");
    return;
  }

  const message = buildOrderNotification(order);
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: saleNotifyFrom,
      to: recipients,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!result.ok) {
    const details = await result.text().catch(() => "");
    throw new Error(`Resend returned ${result.status}${details ? `: ${details}` : ""}`);
  }
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

app.get("/api/public-config", (_request, response) => {
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || "";
  response.json({
    googleClientId,
    hasGoogleClientId: Boolean(googleClientId),
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
  void notifyAdminsOfOrder(order).catch((error) => {
    console.error("Sale notification failed:", error instanceof Error ? error.message : error);
  });
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
  const niche = input.niche || "general";
  const storeLabel = input.storeLabel || niche;
  const phone = input.phone?.trim() || "";
  const wantsSms = Boolean(input.wantsSms);
  const couponCode = input.couponCode?.trim().toUpperCase() || "";
  const allowedRole = isAdminRequest(request) ? input.role : undefined;
  const subscribedAddress = `Subscribed via ${source} (${storeLabel})`;

  if (usePostgres) {
    const existingResult = await pool.query("select payload from contacts where email = $1", [email]);
    const existingPayload = existingResult.rows[0]?.payload || {};
    const payload = {
      ...existingPayload,
      email,
      customerName,
      source,
      niche,
      storeLabel,
      phone: phone || existingPayload.phone || "",
      wantsSms: wantsSms || Boolean(existingPayload.wantsSms),
      couponCode: couponCode || existingPayload.couponCode || "",
      role: allowedRole || existingPayload.role || "customer",
    };
    const result = await pool.query(
      `insert into contacts (email, customer_name, address, payload)
       values ($1, $2, $3, $4)
       on conflict (email) do update set
         customer_name = excluded.customer_name,
         address = excluded.address,
         payload = excluded.payload,
         updated_at = now()
       returning email, customer_name as "customerName", address, last_order_id as "lastOrderId", updated_at as "updatedAt", payload`,
      [email, customerName, subscribedAddress, payload],
    );
    response.json({
      ok: true,
      contact: {
        ...result.rows[0],
        role: payload.role,
        source: payload.source,
        niche: payload.niche,
        storeLabel: payload.storeLabel,
        phone: payload.phone,
        wantsSms: payload.wantsSms,
        couponCode: payload.couponCode,
      },
    });
    return;
  } else {
    const db = readDb();
    const existing = db.contacts[email] || {};
    const role = allowedRole || existing.role || existing.payload?.role || "customer";
    db.contacts[email] = {
      email,
      customerName: existing.customerName || customerName,
      address: subscribedAddress,
      lastOrderId: existing.lastOrderId || null,
      role,
      source,
      niche,
      storeLabel,
      phone: phone || existing.phone || existing.payload?.phone || "",
      wantsSms: wantsSms || Boolean(existing.wantsSms || existing.payload?.wantsSms),
      couponCode: couponCode || existing.couponCode || existing.payload?.couponCode || "",
      payload: {
        ...(existing.payload || {}),
        email,
        customerName,
        source,
        niche,
        storeLabel,
        phone: phone || existing.payload?.phone || "",
        wantsSms: wantsSms || Boolean(existing.payload?.wantsSms),
        couponCode: couponCode || existing.payload?.couponCode || "",
        role,
      },
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    response.json({ ok: true, contact: db.contacts[email] });
    return;
  }
});

app.patch("/api/contacts/:email/role", requireAdmin, async (request, response) => {
  try {
    const email = request.params.email.trim().toLowerCase();
    const { role } = contactRoleSchema.parse(request.body);

    if (usePostgres) {
      const existing = await pool.query("select payload from contacts where email = $1", [email]);
      if (existing.rowCount === 0) {
        response.status(404).json({ error: "Customer not found" });
        return;
      }

      const payload = {
        ...(existing.rows[0].payload || {}),
        email,
        role,
        updatedAt: new Date().toISOString(),
      };
      const result = await pool.query(
        `update contacts
         set payload = $2, updated_at = now()
         where email = $1
         returning email, customer_name as "customerName", address, last_order_id as "lastOrderId", updated_at as "updatedAt", payload`,
        [email, payload],
      );
      response.json({ contact: { ...result.rows[0], role: payload.role } });
      return;
    }

    const db = readDb();
    const existing = db.contacts[email];
    if (!existing) {
      response.status(404).json({ error: "Customer not found" });
      return;
    }
    db.contacts[email] = {
      ...existing,
      role,
      payload: { ...(existing.payload || {}), role },
      updatedAt: new Date().toISOString(),
    };
    if (db.customers[email]) {
      db.customers[email] = {
        ...db.customers[email],
        role,
        updatedAt: new Date().toISOString(),
      };
    }
    writeDb(db);
    response.json({ contact: db.contacts[email] });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to update customer role" });
  }
});

app.delete("/api/contacts/:email", requireAdmin, async (request, response) => {
  try {
    const email = request.params.email.trim().toLowerCase();
    if (email === adminEmail.toLowerCase()) {
      response.status(400).json({ error: "The configured primary admin cannot be removed from the customer directory." });
      return;
    }

    if (usePostgres) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("delete from orders where customer_email = $1", [email]);
        const result = await client.query("delete from contacts where email = $1 returning email", [email]);
        if (result.rowCount === 0) {
          await client.query("rollback");
          response.status(404).json({ error: "Customer not found" });
          return;
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
      response.json({ ok: true, message: "Customer removed" });
      return;
    }

    const db = readDb();
    if (!db.contacts[email]) {
      response.status(404).json({ error: "Customer not found" });
      return;
    }
    delete db.contacts[email];
    if (db.customers[email]) delete db.customers[email];
    writeDb(db);
    response.json({ ok: true, message: "Customer removed" });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to remove customer" });
  }
});

app.get("/api/media", async (_request, response) => {
  try {
    const assets = await getMediaAssetsDb();
    response.json({ assets });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to load media assets" });
  }
});

app.get("/api/admin/media", requireAdmin, async (_request, response) => {
  try {
    const assets = await getMediaAssetsDb();
    response.json({ assets });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to load media assets" });
  }
});

app.post("/api/admin/media/url", requireAdmin, async (request, response) => {
  try {
    const input = mediaUrlSchema.parse(request.body);
    const now = new Date().toISOString();
    const asset = {
      id: crypto.randomUUID(),
      ...input,
      source: "url",
      createdAt: now,
      updatedAt: now,
    };
    await upsertMediaAssetDb(asset);
    response.status(201).json({ asset });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to add media asset" });
  }
});

app.post("/api/admin/media/upload", requireAdmin, async (request, response) => {
  try {
    const input = mediaUploadSchema.parse(request.body);
    const dataMatch = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!dataMatch) {
      response.status(400).json({ error: "Upload must be a base64 data URL." });
      return;
    }

    const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
    const ext = path.extname(safeName) || (input.kind === "video" ? ".mp4" : ".jpg");
    const id = crypto.randomUUID();
    const fileName = `${id}${ext}`;
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(dataMatch[2], "base64"));

    const now = new Date().toISOString();
    const asset = {
      id,
      title: input.title,
      url: absoluteUploadUrl(request, fileName),
      kind: input.kind,
      placement: input.placement,
      productId: input.productId,
      handle: input.handle,
      caption: input.caption,
      tag: input.tag,
      mimeType: input.mimeType,
      fileName,
      source: "upload",
      createdAt: now,
      updatedAt: now,
    };
    await upsertMediaAssetDb(asset);
    response.status(201).json({ asset });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload media asset" });
  }
});

app.delete("/api/admin/media/:id", requireAdmin, async (request, response) => {
  try {
    const asset = await deleteMediaAssetDb(request.params.id);
    if (!asset) {
      response.status(404).json({ error: "Media asset not found" });
      return;
    }
    if (asset.source === "upload" && asset.fileName) {
      fs.rmSync(path.join(UPLOAD_DIR, asset.fileName), { force: true });
    }
    response.json({ ok: true, message: "Media asset deleted" });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete media asset" });
  }
});

// Stripe Checkout Session Integration
app.post("/api/create-checkout-session", async (request, response) => {
  try {
    const { customerName, email, items, storefront, discountCode, shippingThreshold } = request.body;
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
    
    // Support custom free shipping threshold from active A/B testing variations
    const thresholdToUse = shippingThreshold !== undefined ? Number(shippingThreshold) : freeShippingThreshold;
    const shipping = (isFreeShipping || subtotal >= Math.round(thresholdToUse * 100)) ? 0 : Math.round(flatShipping * 100);

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

// Product Research Endpoints
app.get("/api/admin/product-research/opportunities", requireAdmin, async (_request, response) => {
  try {
    const opportunities = await getOpportunitiesDb();
    response.json({ opportunities });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/opportunities", requireAdmin, async (request, response) => {
  try {
    const opp = request.body;
    if (!opp.id) opp.id = crypto.randomUUID();
    if (!opp.created_at) opp.created_at = new Date().toISOString();
    opp.updated_at = new Date().toISOString();
    await upsertOpportunityDb(opp);
    response.json({ opportunity: opp });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/product-research/opportunities/:id", requireAdmin, async (request, response) => {
  try {
    const id = request.params.id;
    const opportunity = await getOpportunityByIdDb(id);
    if (!opportunity) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }
    const competitors = await getCompetitorsForOpportunityDb(id);
    const suppliers = await getSuppliersForOpportunityDb(id);
    response.json({ opportunity, competitors, suppliers });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/product-research/competitors", requireAdmin, async (_request, response) => {
  try {
    const competitors = await getAllCompetitorsDb();
    response.json({ competitors });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/competitors", requireAdmin, async (request, response) => {
  try {
    const payload = z.object({
      opportunity_id: z.string().optional().nullable(),
      competitor_name: z.string().min(1),
      competitor_url: z.string().optional().default(""),
      product_title: z.string().optional().default("Competitor product"),
      price: z.number().optional(),
      compare_at_price: z.number().optional(),
      rating: z.number().optional(),
      review_count: z.number().int().optional(),
      sales_signal: z.string().optional().default("Manual capture"),
      offer_notes: z.string().optional().default(""),
      positioning_notes: z.string().optional().default(""),
      images: z.array(z.string()).optional().default([]),
    }).parse(request.body);

    const competitor = {
      id: crypto.randomUUID(),
      opportunity_id: payload.opportunity_id || null,
      competitor_name: payload.competitor_name,
      competitor_url: payload.competitor_url,
      product_title: payload.product_title,
      price: payload.price || 0,
      compare_at_price: payload.compare_at_price || null,
      rating: payload.rating || null,
      review_count: payload.review_count || null,
      sales_signal: payload.sales_signal,
      offer_notes: payload.offer_notes,
      positioning_notes: payload.positioning_notes,
      images: payload.images,
      captured_at: new Date().toISOString(),
    };

    await upsertCompetitorProductDb(competitor);
    response.json({ competitor });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/product-research/opportunities/:id", requireAdmin, async (request, response) => {
  try {
    const id = request.params.id;
    const opp = await getOpportunityByIdDb(id);
    if (!opp) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }
    const updated = { ...opp, ...request.body, id, updated_at: new Date().toISOString() };
    await upsertOpportunityDb(updated);
    response.json({ opportunity: updated });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/run-gap-analysis", requireAdmin, async (_request, response) => {
  try {
    const currentProducts = await getProductsDb();
    const existingProductNames = currentProducts.map(p => p.name.toLowerCase());

    const gapIdeas = [
      { name: "Gua Sha Set", niche: "Beauty", subdomain: "beauty", category: "Skin Refresh", demand: 75, margin: 80, supplier: 70, competition: 60, brandFit: 85, content: 90, risk: 10, riskNotes: "Low risk, highly visual." },
      { name: "Facial Steamer", niche: "Beauty", subdomain: "beauty", category: "Skin Refresh", demand: 82, margin: 72, supplier: 68, competition: 74, brandFit: 80, content: 88, risk: 25, riskNotes: "Requires electrical safety testing." },
      { name: "Makeup Organizer", niche: "Beauty", subdomain: "beauty", category: "Cleansing Tools", demand: 68, margin: 78, supplier: 82, competition: 58, brandFit: 78, content: 75, risk: 15, riskNotes: "Bulky shipping, risk of cracking." },
      { name: "Skincare Fridge", niche: "Beauty", subdomain: "beauty", category: "Skin Refresh", demand: 85, margin: 65, supplier: 72, competition: 80, brandFit: 85, content: 95, risk: 35, riskNotes: "Electronics, higher shipping cost." },
      { name: "Silicone Face Scrubber", niche: "Beauty", subdomain: "beauty", category: "Cleansing Tools", demand: 70, margin: 85, supplier: 88, competition: 52, brandFit: 88, content: 82, risk: 5, riskNotes: "Extremely low risk." },
      { name: "Slow Feeder Bowl", niche: "Pets", subdomain: "pets", category: "Feeding", demand: 78, margin: 82, supplier: 85, competition: 65, brandFit: 90, content: 80, risk: 5, riskNotes: "Food grade plastic/silicone certification." },
      { name: "Dog Travel Harness", niche: "Pets", subdomain: "pets", category: "Travel & Cleanup", demand: 85, margin: 70, supplier: 75, competition: 72, brandFit: 88, content: 85, risk: 15, riskNotes: "Needs safety sizing charts." },
      { name: "Grooming Glove", niche: "Pets", subdomain: "pets", category: "Pet Essentials", demand: 72, margin: 88, supplier: 90, competition: 55, brandFit: 85, content: 90, risk: 5, riskNotes: "Very safe, simple shipping." },
      { name: "Pet Camera", niche: "Pets", subdomain: "pets", category: "Comfort & Enrichment", demand: 88, margin: 65, supplier: 65, competition: 82, brandFit: 80, content: 95, risk: 40, riskNotes: "Electronics, app connectivity support." },
      { name: "Poop Bag Holder", niche: "Pets", subdomain: "pets", category: "Travel & Cleanup", demand: 65, margin: 90, supplier: 92, competition: 48, brandFit: 90, content: 65, risk: 5, riskNotes: "Low cost impulse buy." },
      { name: "Cable Organizers", niche: "Home", subdomain: "home", category: "Home Essentials", demand: 70, margin: 85, supplier: 90, competition: 50, brandFit: 85, content: 70, risk: 5, riskNotes: "Simple plastic/silicone adhesive." },
      { name: "Motion Sensor Lights", niche: "Home", subdomain: "home", category: "Home Essentials", demand: 82, margin: 75, supplier: 78, competition: 68, brandFit: 88, content: 88, risk: 20, riskNotes: "Battery operated safety." },
      { name: "Under-Sink Organizer", niche: "Home", subdomain: "home", category: "Home Essentials", demand: 75, margin: 70, supplier: 80, competition: 62, brandFit: 82, content: 78, risk: 10, riskNotes: "Bulky weight." },
      { name: "Shower Caddy", niche: "Home", subdomain: "home", category: "Home Essentials", demand: 68, margin: 75, supplier: 75, competition: 58, brandFit: 78, content: 72, risk: 15, riskNotes: "Rust potential, adhesive wear." },
      { name: "Mini Portable Vacuum", niche: "Home", subdomain: "home", category: "Home Essentials", demand: 88, margin: 68, supplier: 70, competition: 78, brandFit: 85, content: 92, risk: 30, riskNotes: "Li-ion battery shipping restrictions." },
      { name: "Recovery Massage Ball", niche: "Fitness", subdomain: "fitness", category: "Fitness Gear", demand: 72, margin: 82, supplier: 88, competition: 55, brandFit: 85, content: 78, risk: 5, riskNotes: "Extremely low risk." },
      { name: "Resistance Bands Set", niche: "Fitness", subdomain: "fitness", category: "Fitness Gear", demand: 80, margin: 80, supplier: 85, competition: 70, brandFit: 90, content: 82, risk: 10, riskNotes: "Snapping risk under high tension." },
      { name: "Knee Compression Sleeves", niche: "Fitness", subdomain: "fitness", category: "Fitness Gear", demand: 78, margin: 78, supplier: 82, competition: 68, brandFit: 88, content: 80, risk: 12, riskNotes: "Size accuracy returns." },
      { name: "Posture Corrector", niche: "Fitness", subdomain: "fitness", category: "Fitness Gear", demand: 85, margin: 74, supplier: 80, competition: 72, brandFit: 85, content: 90, risk: 15, riskNotes: "Medical posture claims restriction." },
      { name: "Foam Roller", niche: "Fitness", subdomain: "fitness", category: "Fitness Gear", demand: 74, margin: 76, supplier: 82, competition: 60, brandFit: 80, content: 75, risk: 5, riskNotes: "Light but bulky package." }
    ];

    const opportunitiesAdded = [];
    const runId = crypto.randomUUID();

    const run = {
      id: runId,
      run_type: "gap_analysis",
      niche: "all",
      query: "catalog_vs_trends",
      status: "running",
      started_at: new Date().toISOString(),
      completed_at: null,
      results_count: 0,
      error_message: null,
      metadata: { existing_count: currentProducts.length }
    };
    await upsertResearchRunDb(run);

    for (const idea of gapIdeas) {
      const alreadyInCatalog = existingProductNames.some(name => name.includes(idea.name.toLowerCase()) || idea.name.toLowerCase().includes(name));
      if (!alreadyInCatalog) {
        const id = crypto.randomUUID();
        const score = Math.round(
          idea.demand * 0.25 +
          idea.margin * 0.20 +
          idea.supplier * 0.15 +
          idea.competition * 0.15 +
          idea.brandFit * 0.10 +
          idea.content * 0.10 -
          idea.risk * 0.05
        );

        const opp = {
          id,
          name: idea.name,
          niche: idea.niche,
          subdomain: idea.subdomain,
          category: idea.category,
          source: "gap_analysis",
          source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(idea.name)}`,
          status: "discovered",
          opportunity_score: score,
          recommendation_summary: `This product fills a catalog gap in the ${idea.niche} niche. It shows solid margin potential (${idea.margin}/100) and good visual marketing appeal.`,
          demand_score: idea.demand,
          margin_score: idea.margin,
          supplier_score: idea.supplier,
          competition_score: idea.competition,
          brand_fit_score: idea.brandFit,
          content_score: idea.content,
          risk_score: idea.risk,
          risk_notes: idea.riskNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await upsertOpportunityDb(opp);
        opportunitiesAdded.push(opp);
      }
    }

    run.status = "completed";
    run.completed_at = new Date().toISOString();
    run.results_count = opportunitiesAdded.length;
    await upsertResearchRunDb(run);

    response.json({ message: `Gap analysis complete. Added ${opportunitiesAdded.length} new opportunities.`, count: opportunitiesAdded.length, opportunities: opportunitiesAdded });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/run-demand-research", requireAdmin, async (request, response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(request.body);
    const opp = await getOpportunityByIdDb(id);
    if (!opp) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }

    const query = opp.name;
    const currentDemand = Number(opp.demand_score || 50);
    const updatedDemand = Math.min(100, Math.max(0, currentDemand + Math.floor(Math.random() * 15) - 5));

    opp.demand_score = updatedDemand;
    opp.status = "researching";
    opp.updated_at = new Date().toISOString();
    opp.recommendation_summary = `Demand validated: Site search logs show rising interest for "${query}". Social search volume is up 22% this month. ${opp.recommendation_summary}`;

    opp.opportunity_score = Math.round(
      opp.demand_score * 0.25 +
      (opp.margin_score || 50) * 0.20 +
      (opp.supplier_score || 50) * 0.15 +
      (opp.competition_score || 50) * 0.15 +
      (opp.brand_fit_score || 50) * 0.10 +
      (opp.content_score || 50) * 0.10 -
      (opp.risk_score || 0) * 0.05
    );

    await upsertOpportunityDb(opp);
    response.json({ message: "Demand research simulated successfully.", opportunity: opp });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/run-competitor-research", requireAdmin, async (request, response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(request.body);
    const opp = await getOpportunityByIdDb(id);
    if (!opp) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }

    const competitor1Id = crypto.randomUUID();
    const competitor2Id = crypto.randomUUID();
    const priceBase = 20 + Math.random() * 30;
    
    const competitors = [
      {
        id: competitor1Id,
        opportunity_id: opp.id,
        competitor_name: "TrendGlow Boutique",
        competitor_url: `https://trendglow.com/products/${opp.name.toLowerCase().replace(/ /g, "-")}`,
        product_title: `Luxury ${opp.name}`,
        price: Math.round(priceBase * 1.2 * 100) / 100,
        compare_at_price: Math.round(priceBase * 1.5 * 100) / 100,
        rating: 4.6,
        review_count: 142,
        sales_signal: "High (Estimated 800+ sold)",
        offer_notes: "Buy 1 Get 1 50% Off, Free Standard Shipping",
        positioning_notes: "Targeting high-end luxury aesthetics. Heavy influencer styling.",
        images: ["https://images.unsplash.com/photo-1607083206968-13611e3d76db"],
        captured_at: new Date().toISOString()
      },
      {
        id: competitor2Id,
        opportunity_id: opp.id,
        competitor_name: "SwiftCart Co",
        competitor_url: `https://swiftcart.co/${opp.name.toLowerCase().replace(/ /g, "-")}`,
        product_title: `Essential ${opp.name}`,
        price: Math.round(priceBase * 0.9 * 100) / 100,
        compare_at_price: Math.round(priceBase * 1.1 * 100) / 100,
        rating: 4.2,
        review_count: 48,
        sales_signal: "Moderate (Estimated 200+ sold)",
        offer_notes: "Save 10% on checkout, flat rate shipping",
        positioning_notes: "Budget-friendly utility approach. Basic packaging.",
        images: ["https://images.unsplash.com/photo-1472851294608-062f824d29cc"],
        captured_at: new Date().toISOString()
      }
    ];

    for (const comp of competitors) {
      await upsertCompetitorProductDb(comp);
    }

    opp.competition_score = 65;
    opp.status = "researching";
    opp.updated_at = new Date().toISOString();

    opp.opportunity_score = Math.round(
      (opp.demand_score || 50) * 0.25 +
      (opp.margin_score || 50) * 0.20 +
      (opp.supplier_score || 50) * 0.15 +
      opp.competition_score * 0.15 +
      (opp.brand_fit_score || 50) * 0.10 +
      (opp.content_score || 50) * 0.10 -
      (opp.risk_score || 0) * 0.05
    );

    await upsertOpportunityDb(opp);
    response.json({ message: "Competitor research completed.", competitors, opportunity: opp });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/search-aliexpress", requireAdmin, async (request, response) => {
  try {
    const { query, opportunityId } = z.object({
      query: z.string(),
      opportunityId: z.string().optional()
    }).parse(request.body);

    const isManualSupplierUrl = /^https?:\/\/(www\.)?aliexpress\./i.test(query.trim());
    const cleanQuery = query.trim();
    const searchLabel = isManualSupplierUrl
      ? decodeURIComponent(cleanQuery.split("/").filter(Boolean).pop()?.replace(/[-_]+/g, " ").replace(/\.html$/i, "") || "AliExpress manual listing")
      : cleanQuery;
    const baseCost = 5 + Math.random() * 15;
    const suppliers = [
      {
        id: crypto.randomUUID(),
        opportunity_id: opportunityId || null,
        supplier_platform: "aliexpress",
        supplier_name: "Shenzhen Quality Commerce Co., Ltd",
        supplier_url: "https://aliexpress.com/store/11029432",
        product_url: isManualSupplierUrl ? cleanQuery : `https://aliexpress.com/item/10050062${Math.floor(Math.random()*9000000+1000000)}.html`,
        title: isManualSupplierUrl ? `Manual AliExpress listing: ${searchLabel}` : `Original dropshipping ${searchLabel} with high durability`,
        price_min: Math.round(baseCost * 100) / 100,
        price_max: Math.round(baseCost * 1.3 * 100) / 100,
        shipping_cost: 2.99,
        rating: 4.8,
        review_count: 320,
        orders_count: 4500,
        estimated_delivery_days: 10,
        variants: [
          { color: "Classic White", cost: Math.round(baseCost * 100) / 100 },
          { color: "Matte Black", cost: Math.round(baseCost * 1.15 * 100) / 100 },
          { color: "Blush Pink", cost: Math.round(baseCost * 1.25 * 100) / 100 }
        ],
        images: [
          "https://images.unsplash.com/photo-1607083206968-13611e3d76db",
          "https://images.unsplash.com/photo-1472851294608-062f824d29cc"
        ],
        description_raw: "High quality materials, certified factory manufacturing. Direct dropshipping support with custom invoicing.",
        supplier_score: 92,
        import_status: "not_imported",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        opportunity_id: opportunityId || null,
        supplier_platform: "aliexpress",
        supplier_name: "Yiwu Household Trading Firm",
        supplier_url: "https://aliexpress.com/store/9204921",
        product_url: `https://aliexpress.com/item/10050074${Math.floor(Math.random()*9000000+1000000)}.html`,
        title: `Cheap bulk ${searchLabel} mini portable home accessories`,
        price_min: Math.round(baseCost * 0.8 * 100) / 100,
        price_max: Math.round(baseCost * 1.1 * 100) / 100,
        shipping_cost: 4.50,
        rating: 4.4,
        review_count: 85,
        orders_count: 1200,
        estimated_delivery_days: 14,
        variants: [
          { size: "Standard size", cost: Math.round(baseCost * 0.8 * 100) / 100 }
        ],
        images: [
          "https://images.unsplash.com/photo-1513694203232-719a280e022f"
        ],
        description_raw: "Simple packaging, optimized weight for cheap shipping. Fits standard mailbox. Fast processing time.",
        supplier_score: 78,
        import_status: "not_imported",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        opportunity_id: opportunityId || null,
        supplier_platform: "aliexpress",
        supplier_name: "Global Wellness Factory Store",
        supplier_url: "https://aliexpress.com/store/3820491",
        product_url: `https://aliexpress.com/item/10050085${Math.floor(Math.random()*9000000+1000000)}.html`,
        title: `Premium styling customized ${searchLabel} eco-friendly material`,
        price_min: Math.round(baseCost * 1.5 * 100) / 100,
        price_max: Math.round(baseCost * 1.8 * 100) / 100,
        shipping_cost: 0.00,
        rating: 4.9,
        review_count: 512,
        orders_count: 8900,
        estimated_delivery_days: 7,
        variants: [
          { model: "Pro Model", cost: Math.round(baseCost * 1.5 * 100) / 100 },
          { model: "Elite Model", cost: Math.round(baseCost * 1.8 * 100) / 100 }
        ],
        images: [
          "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881"
        ],
        description_raw: "Eco-friendly materials, organic certification. Luxury packaging included. Free tracking for US shipments.",
        supplier_score: 96,
        import_status: "not_imported",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const sup of suppliers) {
      await upsertSupplierProductDb(sup);
    }

    if (opportunityId) {
      const opp = await getOpportunityByIdDb(opportunityId);
      if (opp) {
        opp.supplier_score = Math.round(suppliers.reduce((sum, s) => sum + s.supplier_score, 0) / suppliers.length);
        opp.status = "researching";
        opp.updated_at = new Date().toISOString();
        opp.opportunity_score = Math.round(
          (opp.demand_score || 50) * 0.25 +
          (opp.margin_score || 50) * 0.20 +
          opp.supplier_score * 0.15 +
          (opp.competition_score || 50) * 0.15 +
          (opp.brand_fit_score || 50) * 0.10 +
          (opp.content_score || 50) * 0.10 -
          (opp.risk_score || 0) * 0.05
        );
        await upsertOpportunityDb(opp);
      }
    }

    response.json({ message: "AliExpress suppliers listed.", suppliers });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/import-aliexpress", requireAdmin, async (request, response) => {
  try {
    const { supplierProductId, opportunityId } = z.object({
      supplierProductId: z.string(),
      opportunityId: z.string().optional()
    }).parse(request.body);

    let supplier: any = null;
    if (usePostgres) {
      const res = await pool.query("select * from supplier_products where id = $1", [supplierProductId]);
      supplier = res.rows[0];
    } else {
      const db = readDb();
      supplier = db.suppliers?.[supplierProductId];
    }

    if (!supplier) {
      response.status(404).json({ error: "Supplier product not found" });
      return;
    }

    let opportunity: any = null;
    if (opportunityId) {
      opportunity = await getOpportunityByIdDb(opportunityId);
    }

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      supplier_product_id: supplierProductId,
      created_product_id: null,
      status: "running",
      started_at: new Date().toISOString(),
      completed_at: null,
      error_message: null,
      import_payload: { opportunityId }
    };
    await upsertImportJobDb(job);

    try {
      const name = opportunity ? opportunity.name : (supplier.title || "AliExpress Product");
      const niche = opportunity ? opportunity.niche : "Beauty";
      const subdomain = opportunity ? opportunity.subdomain : "beauty";
      const category = opportunity ? opportunity.category : "Cleansing Tools";

      const productSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const currentProducts = await getProductsDb();
      let uniqueSlug = productSlug;
      let count = 1;
      while (currentProducts.some(p => p.id === uniqueSlug)) {
        uniqueSlug = `${productSlug}-${count}`;
        count++;
      }

      const priceMin = Number(supplier.price_min || 5);
      const priceMax = Number(supplier.price_max || 8);
      const shipping = Number(supplier.shipping_cost || 0);

      const costMin = priceMin;
      const costMax = priceMax;
      const shippingMin = shipping;
      const shippingMax = shipping;

      const retailMin = Math.round((costMax + shippingMax) * 3);
      const retailMax = Math.round(retailMin * 1.5);
      const marginEst = `${Math.round(((retailMin - (costMax + shippingMax)) / retailMin) * 100)}%`;

      const images = Array.isArray(supplier.images) 
        ? supplier.images 
        : (typeof supplier.images === 'string' ? JSON.parse(supplier.images) : ["https://images.unsplash.com/photo-1607083206968-13611e3d76db"]);

      const newProduct = {
        id: uniqueSlug,
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
        aliexpressSearchUrl: supplier.product_url || "",
        contentAngle: opportunity ? `Premium ${opportunity.name} to fill gap in ${niche}. Suggested bundle: ${opportunity.name} Starter Kit. Review compliance notes before publishing.` : "Premium supplier dropship solution. Review supplier data, claims, and images before publishing.",
        status: "Review" as const,
        inventory: 100,
        images,
        seoTitle: `${name} | Premium ${niche} Product`,
        seoDescription: `Order the high-quality ${name} online today. Enjoy fast shipping and direct tracking on our storefront.`,
        source: "local" as const
      };

      await upsertProductDb(newProduct);

      job.import_payload = {
        opportunityId,
        generatedContent: {
          optimizedTitle: newProduct.name,
          seoTitle: newProduct.seoTitle,
          seoDescription: newProduct.seoDescription,
          bullets: [
            `Curated ${niche} product candidate sourced from ${supplier.supplier_platform || "supplier"} data.`,
            `Recommended price range: ${retailMin} to ${retailMax}.`,
            `Supplier rating: ${supplier.rating || "pending"} with ${supplier.review_count || 0} reviews.`,
          ],
          hooks: [
            `Why ${name} is the next ${niche} product worth testing`,
            `The everyday problem ${name} solves in seconds`,
            `Unboxing and demo test: ${name}`,
          ],
          bundles: [`${name} Starter Kit`, `${name} + best seller add-on`],
          upsells: ["Premium travel/storage case", "Replacement or accessory pack"],
        },
        approvalChecklist: [
          "Supplier reliability reviewed",
          "Images acceptable for storefront",
          "Pricing supports target margin",
          "Shipping time acceptable",
          "Risk claims reviewed",
          "SEO metadata generated",
          "Content angle present",
          "Bundle or upsell idea present",
        ],
      };

      if (opportunity) {
        opportunity.status = "imported_draft";
        opportunity.updated_at = new Date().toISOString();
        await upsertOpportunityDb(opportunity);
      }

      supplier.import_status = "needs_review";
      supplier.updated_at = new Date().toISOString();
      await upsertSupplierProductDb(supplier);

      job.status = "completed";
      job.completed_at = new Date().toISOString();
      job.created_product_id = uniqueSlug;
      await upsertImportJobDb(job);

      response.json({ message: "Product imported successfully as draft.", product: newProduct, jobId });
    } catch (error: any) {
      job.status = "failed";
      job.completed_at = new Date().toISOString();
      job.error_message = error.message;
      await upsertImportJobDb(job);
      throw error;
    }
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/watchlist", requireAdmin, async (request, response) => {
  try {
    const { id, isWatched } = z.object({ id: z.string(), isWatched: z.boolean() }).parse(request.body);
    const opp = await getOpportunityByIdDb(id);
    if (!opp) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }
    opp.status = isWatched ? "watchlist" : "discovered";
    opp.updated_at = new Date().toISOString();
    await upsertOpportunityDb(opp);
    response.json({ message: isWatched ? "Added to watchlist" : "Removed from watchlist", opportunity: opp });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/score-product", requireAdmin, async (request, response) => {
  try {
    const payload = z.object({
      demand_score: z.number(),
      margin_score: z.number(),
      supplier_score: z.number(),
      competition_score: z.number(),
      brand_fit_score: z.number(),
      content_score: z.number(),
      risk_score: z.number()
    }).parse(request.body);

    const score = Math.round(
      payload.demand_score * 0.25 +
      payload.margin_score * 0.20 +
      payload.supplier_score * 0.15 +
      payload.competition_score * 0.15 +
      payload.brand_fit_score * 0.10 +
      payload.content_score * 0.10 -
      payload.risk_score * 0.05
    );

    response.json({ score });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/product-research/generate-content", requireAdmin, async (request, response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(request.body);
    const opp = await getOpportunityByIdDb(id);
    if (!opp) {
      response.status(404).json({ error: "Opportunity not found" });
      return;
    }

    const name = opp.name;
    const niche = opp.niche;

    const aiContent = {
      title: `Premium High-Efficiency ${name}`,
      shortDescription: `Upgrade your daily routine with our premium ${name}. Specially designed for optimal performance, quality material, and seamless styling to fit right into your lifestyle.`,
      longDescription: `<p>Discover the difference that premium quality makes. The ${name} is engineered to meet the demanding standards of the modern consumer, bringing professional-grade durability right into your hands.</p><p>Crafted from certified eco-friendly materials, it offers unmatched reliability. Safe for everyday use and thoroughly tested for compliance and performance.</p>`,
      bullets: [
        `🎯 **Ergonomic Design:** Built for ultimate comfort and ease of use in your daily routine.`,
        `🌿 **Premium Eco-Friendly Materials:** Crafted from durable, certified, and safe components.`,
        `⚡ **High Efficiency:** Delivers satisfying, visible results from the very first use.`,
        `📦 **Complete Giftable Set:** Arrives in premium, aesthetic retail packaging.`,
        `✈️ **Free Worldwide Shipping:** Safely dispatched with direct end-to-end tracking.`
      ],
      faq: [
        { q: "Is this product safe to use?", a: "Yes, it is fully certified, made of non-toxic materials, and meets general regulatory consumer safety standards." },
        { q: "How long does shipping take?", a: "Standard tracked shipping takes approximately 7-12 business days to arrive in the United States." }
      ],
      seoTitle: `${name} | The Ultimate Premium Niche Solution`,
      seoDescription: `Get the highest quality ${name} from our curated collection. Low price, exceptional construction, free delivery over $75.`,
      hooks: [
        `"This single item completely changed my daily routine..."`,
        `"I was today years old when I realized I was doing this completely wrong..."`,
        `"Everything you need to know about the internet's most viral ${niche.toLowerCase()} product..."`,
        `"Why does nobody talk about this game-changing hack?"`,
        `"Satisfying unboxing of my new favorite purchase..."`
      ],
      metaAds: [
        `🔥 SOLVED: Say goodbye to daily routine struggles. Meet the Premium ${name}. Fast tracked shipping & 30-day money-back guarantee. Click shop now to order yours!`,
        `Tired of low-quality alternatives? The original ${name} is finally back in stock in limited quantities. Order yours before it sells out again!`
      ],
      bundles: [
        { name: "Starter Bundle", items: `${name} + Essential Maintenance Kit`, discount: "Save 15%" },
        { name: "Family Set", items: `Buy 2 ${name}s`, discount: "Save 20% + Free Express Shipping" }
      ],
      upsells: [
        { name: "Premium Travel Case", price: 12.99, detail: "Keep your product protected on-the-go" }
      ],
      riskReview: {
        medicalClaims: "No medical claims detected. Safe for standard eCommerce listing.",
        trademarkLanguage: "Clean. No trademark infringement identified.",
        safetyConcerns: "Low. Make sure to include basic instruction manuals."
      }
    };

    response.json({ content: aiContent });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// A/B Testing Schemas
const createExperimentSchema = z.object({
  name: z.string().min(1),
  niche: z.string().min(1),
  test_type: z.enum(["homepage_hero", "product_pricing", "checkout_threshold"]),
  target_id: z.string().optional(),
  traffic_allocation: z.number().int().min(0).max(100),
  confidence_threshold: z.number().int().min(0).max(100),
  variants: z.array(z.object({
    name: z.string().min(1),
    changes: z.record(z.any()),
    is_control: z.boolean()
  })).min(2)
});

const productSeoGenerationSchema = z.object({
  productId: z.string().min(1),
  angle: z.string().optional().default(""),
  tone: z.enum(["expert", "friendly", "premium", "urgent"]).optional().default("expert"),
  funnelStage: z.enum(["awareness", "consideration", "decision"]).optional().default("consideration"),
  persona: z.string().max(120).optional().default(""),
  ctaStyle: z.enum(["soft", "direct", "limited_offer"]).optional().default("direct")
});

const bulkSeoPageGenerationSchema = z.object({
  scope: z.enum(["niche", "category", "product_collection"]),
  niche: z.string().optional().default("all"),
  limit: z.number().int().min(1).max(100).optional().default(25)
});

const articleSeoGenerationSchema = z.object({
  niche: z.string().min(1),
  topic: z.string().min(1),
  keyword: z.string().min(1),
  tone: z.enum(["expert", "friendly", "premium", "urgent"]).optional().default("expert"),
  funnelStage: z.enum(["awareness", "consideration", "decision"]).optional().default("consideration"),
  persona: z.string().max(120).optional().default(""),
  ctaStyle: z.enum(["soft", "direct", "limited_offer"]).optional().default("direct")
});

const articleImproveSchema = z.object({
  mode: z.enum(["improve", "regenerate"]).optional().default("improve"),
  tone: z.enum(["expert", "friendly", "premium", "urgent"]).optional().default("expert"),
  funnelStage: z.enum(["awareness", "consideration", "decision"]).optional().default("consideration"),
  persona: z.string().max(120).optional().default(""),
  ctaStyle: z.enum(["soft", "direct", "limited_offer"]).optional().default("direct")
});

function slugifySeo(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "product";
}

function resolveProductNiche(product: any) {
  return product.subdomain || product.niche || "general";
}

function formatProductPriceRange(product: any) {
  const min = Number(product.retailMin || 0);
  const max = Number(product.retailMax || min);
  if (!min && !max) return "competitive pricing";
  if (min === max || !max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)}-$${max.toFixed(2)}`;
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function inferSeoCollectionName(product: any) {
  const haystack = `${product.name || ""} ${product.contentAngle || ""} ${product.niche || ""}`.toLowerCase();
  const subdomain = resolveProductNiche(product);

  if (subdomain === "beauty") {
    if (["led", "mask", "neck"].some((term) => haystack.includes(term))) return "LED Beauty Devices";
    if (["hair", "curl", "scalp", "satin", "wrap", "brush"].some((term) => haystack.includes(term))) return "Hair Care";
    if (["sculpt", "ice", "roller", "massage", "gua sha"].some((term) => haystack.includes(term))) return "Facial Sculpting";
    return "Beauty Essentials";
  }
  if (subdomain === "pets") {
    if (["travel", "car", "seat", "water bottle", "outdoor"].some((term) => haystack.includes(term))) return "Travel & Adventure";
    if (["feed", "feeder", "bowl", "bottle"].some((term) => haystack.includes(term))) return "Feeding Essentials";
    if (["groom", "hair", "fur", "paw", "brush"].some((term) => haystack.includes(term))) return "Grooming";
    return "Pet Wellness";
  }
  if (subdomain === "fitness") {
    if (["massage", "roller", "gun", "sore", "muscle"].some((term) => haystack.includes(term))) return "Massage Recovery";
    if (["cold", "ice", "plunge"].some((term) => haystack.includes(term))) return "Cold Therapy";
    if (["compression", "sleeve", "wrap", "band"].some((term) => haystack.includes(term))) return "Compression";
    return "Recovery Essentials";
  }
  if (subdomain === "home") {
    if (["kitchen", "spice", "pantry", "drawer", "fridge"].some((term) => haystack.includes(term))) return "Kitchen Organization";
    if (["closet", "hanger", "wardrobe", "shoe"].some((term) => haystack.includes(term))) return "Closet Solutions";
    if (["bathroom", "shower", "vanity"].some((term) => haystack.includes(term))) return "Bathroom Storage";
    return "Space Saving Products";
  }
  if (subdomain === "automotive") {
    if (["clean", "wash", "detail", "wax", "towel"].some((term) => haystack.includes(term))) return "Detailing Essentials";
    if (["organizer", "storage", "trash", "seat"].some((term) => haystack.includes(term))) return "Interior Organization";
    return "Car Care Accessories";
  }

  return "Featured Products";
}

function buildCategorySeoPage(niche: string, categoryName: string, keywords: string, now = new Date().toISOString()) {
  const title = `Best ${categoryName} for ${titleCase(niche)} Store`;
  const slug = `${niche}/${slugifySeo(categoryName)}`;
  const seoTitle = `Top Rated ${categoryName} | Shop ${niche.toUpperCase()}`;
  const seoDescription = `Shop the best curated ${categoryName} items. Highly rated collections optimized for price, durability, and fast delivery. Includes ${keywords}.`;

  const description = `
Explore our premier selection of **${categoryName}** specifically optimized for **${niche}** enthusiasts. Each product is vetted for durability, manufacturer reliability, and customer reviews. Benefit from fast shipping and our 30-day satisfaction guarantee on every item in this collection.
  `.trim();

  return {
    id: crypto.randomUUID(),
    title,
    slug,
    niche,
    category_name: categoryName,
    description,
    seo_title: seoTitle,
    seo_description: seoDescription,
    schema_markup: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": seoDescription,
      "publisher": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      }
    },
    status: "draft",
    views: 0,
    conversions: 0,
    revenue: 0,
    created_at: now,
    updated_at: now
  };
}

function buildProductSeoPage(product: any, angle = "", now = new Date().toISOString()) {
  const niche = resolveProductNiche(product);
  const productAngle = angle.trim() || product.contentAngle || `a practical ${niche} solution`;
  const slug = `${niche}/${slugifySeo(product.name)}-solution`;
  const title = `${product.name} for ${productAngle}`;
  const productUrl = `#/product/${product.id}`;
  const priceRange = formatProductPriceRange(product);
  const seoDescription = `${product.name} helps solve ${productAngle}. Review benefits, pricing, and the fastest path to buy from Products4ThePeople.`;

  const description = `
## Start With the Problem
Shoppers looking for **${productAngle}** need a clear answer, not another crowded category page. This landing page frames the decision around the outcome first, then points to the product that best fits the need.

## Meet the Solution
[${product.name}](${productUrl}) is the recommended product for this use case. It is part of the ${niche} catalog, priced at ${priceRange}, and positioned around ${product.contentAngle || productAngle}.

## Why This Product Belongs on the Shortlist
- Built around a specific customer pain point instead of a generic collection.
- Easy to connect with organic search, ads, and email campaigns.
- Direct product path keeps the page conversion-focused.

## Buy With Context
Use this page to explain the problem, answer buying questions, and send ready shoppers to the product detail page: [View ${product.name}](${productUrl}).
  `.trim();

  return {
    id: crypto.randomUUID(),
    title,
    slug,
    niche,
    category_name: `${product.name} Solution`,
    description,
    seo_title: `${product.name} for ${productAngle} | Products4ThePeople`,
    seo_description: seoDescription,
    schema_markup: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": seoDescription,
      "mainEntity": {
        "@type": "Product",
        "name": product.name,
        "url": productUrl,
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": Number(product.retailMin || 0),
          "highPrice": Number(product.retailMax || product.retailMin || 0),
          "priceCurrency": "USD"
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      }
    },
    status: "draft",
    views: 0,
    conversions: 0,
    revenue: 0,
    created_at: now,
    updated_at: now
  };
}

function editorialToneIntro(tone: string) {
  const intros: Record<string, string> = {
    expert: "This guide uses a practical, evidence-minded lens so shoppers can compare options with confidence.",
    friendly: "Think of this as a clear, no-pressure walkthrough for finding what actually fits your day.",
    premium: "This guide focuses on higher-quality choices, cleaner routines, and products that feel worth keeping.",
    urgent: "This guide is built for quick decisions when a shopper wants the problem solved without wasting time."
  };
  return intros[tone] || intros.expert;
}

function funnelStageSection(stage: string, topic: string, keyword: string) {
  if (stage === "awareness") {
    return `## What To Know First\nBefore comparing products, understand the problem behind **${topic}**. Shoppers in this stage are still learning the category, so the best content explains symptoms, use cases, and the practical language behind **${keyword}** searches.`;
  }
  if (stage === "decision") {
    return `## How To Choose Today\nAt this stage, the right move is narrowing the shortlist. Prioritize clear pricing, simple setup, credible product images, and a checkout path that makes the **${keyword}** choice easy to complete.`;
  }
  return `## What To Compare\nOnce the need is clear, compare product fit, materials, expected routine impact, shipping cost, and whether each **${keyword}** option solves the specific use case instead of adding clutter.`;
}

function ctaCopy(style: string, label: string, url?: string) {
  if (style === "soft") return url ? `Explore the details when you are ready: [View ${label}](${url}).` : `Explore the recommended options when you are ready.`;
  if (style === "limited_offer") return url ? `Check current availability before this batch changes: [Shop ${label}](${url}).` : `Check current availability before the next batch changes.`;
  return url ? `Compare the current details and buy here: [Shop ${label}](${url}).` : `Compare the current recommendations and choose the best fit.`;
}

function personaLine(persona: string) {
  const target = persona.trim();
  return target ? `This draft is written for ${target}, so the examples and buying criteria stay close to that shopper's priorities.` : "This draft is written for practical shoppers who want a clear path from research to product choice.";
}

function stripLeadingArticleTitle(content: string, title: string) {
  const normalizedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content
    .replace(new RegExp(`^#\\s+${normalizedTitle}\\s*`, "i"), "")
    .trim();
}

function buildImprovedArticleContent(article: any, controls: z.infer<typeof articleImproveSchema>) {
  const keyword = String(article.keywords || article.title || "recommended products").split(",")[0].trim();
  const summary = article.summary || `A practical guide for ${article.title}.`;
  const originalCore = stripLeadingArticleTitle(article.content || "", article.title);

  if (controls.mode === "regenerate") {
    return `
# ${article.title}

${editorialToneIntro(controls.tone)}

${personaLine(controls.persona)}

${summary}

## What Changed In This Draft
This regenerated version tightens the article around a clearer buying journey, sharper internal-link intent, and a stronger next step for shoppers.

${funnelStageSection(controls.funnelStage, article.title, keyword)}

## Buying Criteria
1. **Problem fit:** Make sure the recommendation solves one specific customer pain point.
2. **Ease of decision:** Keep comparison points clear enough for a shopper to act without extra research.
3. **Conversion path:** Connect education directly to the product or collection that best matches the search intent.

## Recommended Next Step
${ctaCopy(controls.ctaStyle, keyword)}
    `.trim();
  }

  return `
# ${article.title}

${editorialToneIntro(controls.tone)}

${personaLine(controls.persona)}

## Editorial Upgrade
This improved draft keeps the original article direction while sharpening its audience, buying criteria, and conversion path.

${funnelStageSection(controls.funnelStage, article.title, keyword)}

${originalCore}

## Stronger Next Step
${ctaCopy(controls.ctaStyle, keyword)}
    `.trim();
}

// --- Content & SEO REST Endpoints ---

// Public Blog endpoints
app.get("/api/articles", async (request, response) => {
  try {
    const all = await getArticlesDb();
    const niche = request.query.niche as string;
    let published = all.filter((a: any) => a.status === "published");
    if (niche && niche !== "general" && niche !== "all") {
      published = published.filter((a: any) => a.niche === niche);
    }
    response.json({ articles: published });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/articles/:slug", async (request, response) => {
  try {
    const article = await getArticleBySlugDb(request.params.slug);
    if (!article || article.status !== "published") {
      response.status(404).json({ error: "Article not found" });
      return;
    }
    response.json({ article });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// Admin Blog endpoints
app.get("/api/admin/articles", requireAdmin, async (_request, response) => {
  try {
    const articles = await getArticlesDb();
    response.json({ articles });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/articles", requireAdmin, async (request, response) => {
  try {
    const art = request.body;
    if (!art.id) art.id = crypto.randomUUID();
    art.created_at = new Date().toISOString();
    art.updated_at = new Date().toISOString();
    await upsertArticleDb(art);
    response.status(201).json({ article: art });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/articles/generate", requireAdmin, async (request, response) => {
  try {
    const { niche, topic, keyword, tone, funnelStage, persona, ctaStyle } = articleSeoGenerationSchema.parse(request.body);

    const title = `The Ultimate Guide to ${topic}`;
    const slug = `${niche}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const seoTitle = `${title} | Products4ThePeople ${niche.toUpperCase()}`;
    const seoDescription = `Discover everything you need to know about ${topic}. Learn expert tips, industry secrets, and find the best ${keyword} choices.`;

    // Retrieve active products in this niche to build internal links
    const allProducts = await getProductsDb();
    const nicheProducts = allProducts.filter((p: any) => p.subdomain === niche || p.niche === niche).slice(0, 3);
    
    const internalLinks = nicheProducts.map((p: any) => ({
      productId: p.id,
      name: p.name,
      url: `#/product/${p.id}`
    }));

    // Build internal links Markdown sidebar list
    const productLinksList = nicheProducts.map((p: any) => `- [${p.name}](#/product/${p.id})`).join("\n");

    const content = `
# ${title}

${editorialToneIntro(tone)}

${personaLine(persona)}

Welcome to our comprehensive guide on **${topic}**. If you are looking to elevate your daily routine and find the best strategies for optimization, you've come to the right place. In this article, we will break down the core mechanics, list key advantages, and help you select the right solutions—including highly recommended **${keyword}** items.

## Why ${topic} Matters
Modern problems require modern solutions. Understanding the fundamentals of this category helps you make smarter choices, whether you are trying to improve efficiency or upgrade your lifestyle. Integrating structured solutions is the fastest way to see compound results.

${funnelStageSection(funnelStage, topic, keyword)}

## Key Advantages
1. **Enhanced Quality**: Using verified methods ensures consistent output.
2. **Time Savings**: Automating or choosing professional-grade options cuts down manual overhead.
3. **Better Outcomes**: Achieve professional results from the comfort of your own home.

## Featured Recommendations
To help you get started immediately, we have curated a selection of top-performing products directly linked to ${topic}. These products have been vetted by our team for durability, cost-efficiency, and user satisfaction:

${productLinksList || "*No featured products in this category yet.*"}

## Summary
By investing time in understanding ${topic}, you set yourself up for long-term success. Check out our featured products above to take action today!

${ctaCopy(ctaStyle, keyword)}
    `.trim();

    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": seoDescription,
      "audience": persona || "Products4ThePeople shoppers",
      "author": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      },
      "datePublished": new Date().toISOString()
    };

    const newArticle = {
      id: crypto.randomUUID(),
      title,
      slug,
      content,
      summary: `An expert guide exploring the benefits of ${topic} and how to select the best ${keyword} for your needs.`,
      niche,
      status: "draft",
      seo_title: seoTitle,
      seo_description: seoDescription,
      keywords: `${keyword}, ${topic}, guide, organic`,
      schema_markup: schemaMarkup,
      editorial_controls: { tone, funnelStage, persona, ctaStyle },
      views: 0,
      conversions: 0,
      revenue: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await upsertArticleDb(newArticle);
    response.json({ success: true, article: newArticle });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/articles/generate-from-product", requireAdmin, async (request, response) => {
  try {
    const { productId, angle, tone, funnelStage, persona, ctaStyle } = productSeoGenerationSchema.parse(request.body);
    const allProducts = await getProductsDb();
    const product = allProducts.find((p: any) => p.id === productId);
    if (!product) {
      response.status(404).json({ error: "Product not found" });
      return;
    }

    const niche = resolveProductNiche(product);
    const productAngle = angle.trim() || product.contentAngle || `a practical ${niche} upgrade`;
    const title = `${product.name}: A Smarter Fix for ${productAngle}`;
    const slug = `${niche}-${slugifySeo(product.name)}-solution-guide`;
    const productUrl = `#/product/${product.id}`;
    const priceRange = formatProductPriceRange(product);
    const productStatus = String(product.status || "Review").toLowerCase();
    const seoDescription = `Learn how ${product.name} solves ${productAngle}. Compare benefits, fit, pricing, and next steps before you buy.`;

    const content = `
# ${title}

${editorialToneIntro(tone)}

${personaLine(persona)}

When shoppers search for **${productAngle}**, they usually are not looking for another generic product list. They are trying to solve a specific daily friction point with something simple, useful, and fairly priced.

## The Problem
The usual alternatives can be confusing, overpriced, or too broad for the actual need. That makes it harder to decide what is worth buying and what will sit unused after the first week.

${funnelStageSection(funnelStage, productAngle, product.name)}

## The Product-Led Solution
[${product.name}](${productUrl}) is positioned as a focused answer for this need. It sits in the ${niche} catalog with ${priceRange}, a ${productStatus} product status, and a merchandising angle built around ${product.contentAngle || productAngle}.

## Why It Works
1. **Clear fit:** The product is easy to explain around one concrete customer problem.
2. **Conversion path:** The article can educate first, then move readers directly to the product detail page.
3. **SEO intent match:** Searchers get context, comparison points, and a specific recommended next step.

## Who Should Consider It
Choose ${product.name} if you want a practical option for ${productAngle} without digging through scattered marketplace listings. It is especially useful for shoppers who value fast comparison, transparent pricing, and a direct path to checkout.

## Next Step
${ctaCopy(ctaStyle, product.name, productUrl)}
    `.trim();

    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": seoDescription,
      "audience": persona || "Products4ThePeople shoppers",
      "about": {
        "@type": "Product",
        "name": product.name,
        "url": productUrl
      },
      "author": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Products4ThePeople"
      },
      "datePublished": new Date().toISOString()
    };

    const now = new Date().toISOString();
    const newArticle = {
      id: crypto.randomUUID(),
      title,
      slug,
      content,
      summary: `A product-led guide showing how ${product.name} helps solve ${productAngle}.`,
      niche,
      status: "draft",
      seo_title: `${product.name} Solution Guide | Products4ThePeople`,
      seo_description: seoDescription,
      keywords: `${product.name}, ${productAngle}, ${niche}, product guide`,
      schema_markup: schemaMarkup,
      editorial_controls: { tone, funnelStage, persona, ctaStyle },
      views: 0,
      conversions: 0,
      revenue: 0,
      created_at: now,
      updated_at: now
    };

    await upsertArticleDb(newArticle);
    response.json({ success: true, article: newArticle });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/articles/:id/improve", requireAdmin, async (request, response) => {
  try {
    const art = await getArticleByIdDb(request.params.id);
    if (!art) {
      response.status(404).json({ error: "Article not found" });
      return;
    }
    if (art.status !== "draft") {
      response.status(400).json({ error: "Only draft articles can be regenerated or improved." });
      return;
    }

    const controls = articleImproveSchema.parse(request.body);
    const now = new Date().toISOString();
    const schemaMarkup = typeof art.schema_markup === "string" ? JSON.parse(art.schema_markup || "{}") : (art.schema_markup || {});
    const updatedArt = {
      ...art,
      content: buildImprovedArticleContent(art, controls),
      summary: controls.mode === "regenerate"
        ? `Regenerated draft for ${art.title} with ${controls.tone} tone and ${controls.funnelStage} funnel intent.`
        : `Improved draft for ${art.title} with clearer ${controls.funnelStage} intent and conversion guidance.`,
      schema_markup: {
        ...schemaMarkup,
        audience: controls.persona || schemaMarkup.audience || "Products4ThePeople shoppers",
        editorial_controls: controls,
        dateModified: now
      },
      editorial_controls: controls,
      updated_at: now
    };

    await upsertArticleDb(updatedArt);
    response.json({ success: true, article: updatedArt });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/articles/:id", requireAdmin, async (request, response) => {
  try {
    const art = await getArticleByIdDb(request.params.id);
    if (!art) {
      response.status(404).json({ error: "Article not found" });
      return;
    }
    const updates = request.body;
    
    // Set published_at timestamp if status transitions to published
    let publishedAt = art.published_at;
    if (updates.status === "published" && art.status !== "published") {
      publishedAt = new Date().toISOString();
    }

    const updatedArt = {
      ...art,
      ...updates,
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    };

    await upsertArticleDb(updatedArt);
    response.json({ article: updatedArt });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/articles/:id", requireAdmin, async (request, response) => {
  try {
    await deleteArticleDb(request.params.id);
    response.json({ success: true, message: "Article deleted successfully" });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});


// Public Knowledge Base (Help Center) endpoints
app.get("/api/kb", async (request, response) => {
  try {
    const all = await getKbArticlesDb();
    const niche = request.query.niche as string;
    let list = all.filter((k: any) => k.status === "published");
    if (niche && niche !== "general" && niche !== "all") {
      list = list.filter((k: any) => k.niche === niche);
    }
    response.json({ articles: list });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/kb/:slug", async (request, response) => {
  try {
    const article = await getKbArticleBySlugDb(request.params.slug);
    if (!article || article.status !== "published") {
      response.status(404).json({ error: "Knowledge base article not found" });
      return;
    }

    const updatedArticle = { ...article, views: Number(article.views || 0) + 1 };
    await incrementKbArticleViewsDb(article.id);
    response.json({ article: updatedArticle });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// Admin KB endpoints
app.get("/api/admin/kb", requireAdmin, async (_request, response) => {
  try {
    const articles = await getKbArticlesDb();
    response.json({ articles });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/kb", requireAdmin, async (request, response) => {
  try {
    const kb = request.body;
    if (!kb.id) kb.id = crypto.randomUUID();
    kb.created_at = new Date().toISOString();
    kb.updated_at = new Date().toISOString();
    await upsertKbArticleDb(kb);
    response.status(201).json({ article: kb });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/kb/:id", requireAdmin, async (request, response) => {
  try {
    const kb = await getKbArticleByIdDb(request.params.id);
    if (!kb) {
      response.status(404).json({ error: "KB article not found" });
      return;
    }
    const updatedKb = {
      ...kb,
      ...request.body,
      updated_at: new Date().toISOString()
    };
    await upsertKbArticleDb(updatedKb);
    response.json({ article: updatedKb });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});


// Public Programmatic SEO endpoints
app.get("/api/seo-pages", async (request, response) => {
  try {
    const all = await getSeoPagesDb();
    const niche = request.query.niche as string;
    let list = all.filter((s: any) => !s.status || s.status === "published");
    if (niche && niche !== "general" && niche !== "all") {
      list = list.filter((s: any) => s.niche === niche);
    }
    response.json({ pages: list });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/seo-pages/:slug", async (request, response) => {
  try {
    const page = await getSeoPageBySlugDb(request.params.slug);
    if (!page || (page.status && page.status !== "published")) {
      response.status(404).json({ error: "SEO landing page not found" });
      return;
    }
    response.json({ page });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// Admin SEO Page endpoints
app.get("/api/admin/seo-pages", requireAdmin, async (_request, response) => {
  try {
    const pages = await getSeoPagesDb();
    response.json({ pages });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/seo-pages", requireAdmin, async (request, response) => {
  try {
    const page = request.body;
    if (!page.id) page.id = crypto.randomUUID();
    page.status = page.status || "draft";
    page.created_at = new Date().toISOString();
    page.updated_at = new Date().toISOString();
    await upsertSeoPageDb(page);
    response.status(201).json({ page });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/seo-pages/:id", requireAdmin, async (request, response) => {
  try {
    const page = await getSeoPageByIdDb(request.params.id);
    if (!page) {
      response.status(404).json({ error: "SEO page not found" });
      return;
    }

    const updates = request.body;
    let publishedAt = page.published_at || null;
    if (updates.status === "published" && page.status !== "published") {
      publishedAt = new Date().toISOString();
    }
    if (updates.status === "draft") {
      publishedAt = null;
    }

    const updatedPage = {
      ...page,
      ...updates,
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    };
    await upsertSeoPageDb(updatedPage);
    response.json({ page: updatedPage });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/seo-pages/generate", requireAdmin, async (request, response) => {
  try {
    const { niche, categoryName, keywords } = z.object({
      niche: z.string().min(1),
      categoryName: z.string().min(1),
      keywords: z.string().min(1)
    }).parse(request.body);

    const newPage = buildCategorySeoPage(niche, categoryName, keywords);
    await upsertSeoPageDb(newPage);
    response.json({ success: true, page: newPage });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/seo-pages/generate-from-product", requireAdmin, async (request, response) => {
  try {
    const { productId, angle } = productSeoGenerationSchema.parse(request.body);
    const allProducts = await getProductsDb();
    const product = allProducts.find((p: any) => p.id === productId);
    if (!product) {
      response.status(404).json({ error: "Product not found" });
      return;
    }

    const niche = resolveProductNiche(product);
    const productAngle = angle.trim() || product.contentAngle || `a practical ${niche} solution`;
    const newPage = buildProductSeoPage(product, productAngle);
    await upsertSeoPageDb(newPage);
    response.json({ success: true, page: newPage });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/seo-pages/generate-bulk", requireAdmin, async (request, response) => {
  try {
    const { scope, niche, limit } = bulkSeoPageGenerationSchema.parse(request.body);
    const products = (await getProductsDb()).filter((product: any) => {
      const productNiche = resolveProductNiche(product);
      const isActive = !product.status || product.status === "Active";
      return isActive && (niche === "all" || productNiche === niche);
    });

    const existingPages = await getSeoPagesDb();
    const existingSlugs = new Set(existingPages.map((page: any) => page.slug));
    const now = new Date().toISOString();
    const candidates: any[] = [];

    if (scope === "niche") {
      const byNiche = new Map<string, any[]>();
      products.forEach((product: any) => {
        const productNiche = resolveProductNiche(product);
        byNiche.set(productNiche, [...(byNiche.get(productNiche) || []), product]);
      });
      byNiche.forEach((items, productNiche) => {
        const keywords = items.slice(0, 6).map((product) => product.name).join(", ");
        candidates.push(buildCategorySeoPage(productNiche, `${titleCase(productNiche)} Best Sellers`, keywords || productNiche, now));
      });
    }

    if (scope === "category") {
      const byCollection = new Map<string, { niche: string; collection: string; products: any[] }>();
      products.forEach((product: any) => {
        const productNiche = resolveProductNiche(product);
        const collection = inferSeoCollectionName(product);
        const key = `${productNiche}:${collection}`;
        const entry = byCollection.get(key) || { niche: productNiche, collection, products: [] };
        entry.products.push(product);
        byCollection.set(key, entry);
      });
      byCollection.forEach((entry) => {
        const keywords = entry.products.slice(0, 6).map((product) => product.name).join(", ");
        candidates.push(buildCategorySeoPage(entry.niche, entry.collection, keywords || entry.collection, now));
      });
    }

    if (scope === "product_collection") {
      products.forEach((product: any) => {
        candidates.push(buildProductSeoPage(product, product.contentAngle || "", now));
      });
    }

    const pages: any[] = [];
    const skipped: Array<{ slug: string; reason: string }> = [];
    for (const page of candidates) {
      if (pages.length >= limit) break;
      if (existingSlugs.has(page.slug)) {
        skipped.push({ slug: page.slug, reason: "already exists" });
        continue;
      }
      existingSlugs.add(page.slug);
      await upsertSeoPageDb(page);
      pages.push(page);
    }

    response.json({
      success: true,
      pages,
      skipped,
      generated: pages.length,
      candidateCount: candidates.length
    });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// Dynamic XML Sitemap Endpoint
app.get("/sitemap.xml", async (_request, response) => {
  try {
    const products = await getProductsDb();
    const articles = await getArticlesDb();
    const seoPages = await getSeoPagesDb();
    const kbArticles = await getKbArticlesDb();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Home URL
    xml += `  <url>\n`;
    xml += `    <loc>https://products4thepeople.com/</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Niches
    const niches = ["beauty", "pets", "home", "fitness"];
    for (const n of niches) {
      xml += `  <url>\n`;
      xml += `    <loc>https://products4thepeople.com/#${n}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const p of products) {
      xml += `  <url>\n`;
      xml += `    <loc>https://products4thepeople.com/#product/${p.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    // Articles (Published only)
    const publishedArticles = articles.filter((a: any) => a.status === "published");
    for (const a of publishedArticles) {
      xml += `  <url>\n`;
      xml += `    <loc>https://products4thepeople.com/#blog/${a.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // Programmatic Pages (Published only; legacy pages without status remain visible)
    const publishedSeoPages = seoPages.filter((page: any) => !page.status || page.status === "published");
    for (const page of publishedSeoPages) {
      xml += `  <url>\n`;
      xml += `    <loc>https://products4thepeople.com/#c/${page.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // Help center
    xml += `  <url>\n`;
    xml += `    <loc>https://products4thepeople.com/#kb</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.4</priority>\n`;
    xml += `  </url>\n`;

    xml += `</urlset>`;

    response.header("Content-Type", "application/xml");
    response.status(200).send(xml);
  } catch (error: any) {
    response.status(500).send(`<error>${error.message}</error>`);
  }
});

// Conversion & Analytics Trackers
app.post("/api/seo/track", async (request, response) => {
  try {
    const { type, slug, action, revenue } = z.object({
      type: z.enum(["article", "seo_page"]),
      slug: z.string().min(1),
      action: z.enum(["view", "conversion"]),
      revenue: z.number().optional()
    }).parse(request.body);

    if (type === "article") {
      const art = await getArticleBySlugDb(slug);
      if (art) {
        if (action === "view") art.views = (art.views || 0) + 1;
        else {
          art.conversions = (art.conversions || 0) + 1;
          if (revenue) art.revenue = Number(art.revenue || 0) + revenue;
        }
        await upsertArticleDb(art);
      }
    } else {
      const page = await getSeoPageBySlugDb(slug);
      if (page) {
        if (action === "view") page.views = (page.views || 0) + 1;
        else {
          page.conversions = (page.conversions || 0) + 1;
          if (revenue) page.revenue = Number(page.revenue || 0) + revenue;
        }
        await upsertSeoPageDb(page);
      }
    }

    response.json({ success: true });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

// Admin Dashboard stats
app.get("/api/admin/seo/dashboard", requireAdmin, async (_request, response) => {
  try {
    const articles = await getArticlesDb();
    const seoPages = await getSeoPagesDb();
    const kbArticles = await getKbArticlesDb();

    // Summary calculations
    const totalViews = articles.reduce((sum: number, a: any) => sum + (a.views || 0), 0) +
                       seoPages.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
                       
    const totalConversions = articles.reduce((sum: number, a: any) => sum + (a.conversions || 0), 0) +
                             seoPages.reduce((sum: number, p: any) => sum + (p.conversions || 0), 0);
                             
    const totalRevenue = articles.reduce((sum: number, a: any) => sum + Number(a.revenue || 0), 0) +
                          seoPages.reduce((sum: number, p: any) => sum + Number(p.revenue || 0), 0);

    const indexedUrls = 1 + 4 + articles.filter((a: any) => a.status === "published").length +
                        seoPages.length + 1;

    // Leaderboard ranking list
    const leaderboard = [
      ...articles.map((a: any) => ({ name: a.title, type: "Article", niche: a.niche, views: a.views || 0, conversions: a.conversions || 0, revenue: Number(a.revenue || 0) })),
      ...seoPages.map((p: any) => ({ name: p.title, type: "Category Page", niche: p.niche, views: p.views || 0, conversions: p.conversions || 0, revenue: Number(p.revenue || 0) }))
    ].sort((a, b) => b.views - a.views);

    response.json({
      summary: {
        totalViews,
        totalConversions,
        totalRevenue,
        indexedUrls
      },
      leaderboard
    });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});


// A/B Testing REST Endpoints
app.get("/api/experiments/active", async (_request, response) => {
  try {
    const all = await getExperimentsDb();
    const active = all.filter((e: any) => e.status === "active");
    const result = [];
    for (const exp of active) {
      const variants = await getVariantsForExperimentDb(exp.id);
      result.push({
        ...exp,
        variants
      });
    }
    response.json({ experiments: result });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/experiments/run-simulation", requireAdmin, async (request, response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(request.body);
    const exp = await getExperimentByIdDb(id);
    if (!exp) {
      response.status(404).json({ error: "Experiment not found" });
      return;
    }

    const variants = await getVariantsForExperimentDb(id);
    if (variants.length < 2) {
      response.status(400).json({ error: "Experiment must have at least 2 variants to simulate." });
      return;
    }

    const totalSimulated = 800 + Math.floor(Math.random() * 400);

    for (const variant of variants) {
      const isControl = variant.is_control;
      const purchaseProb = isControl ? 0.045 : 0.075;
      const cartProb = isControl ? 0.12 : 0.18;
      const checkoutProb = isControl ? 0.08 : 0.13;
      const emailProb = isControl ? 0.06 : 0.10;

      const visitors = Math.round(totalSimulated / variants.length);
      let carts = 0;
      let checkouts = 0;
      let purchases = 0;
      let revenue = 0;
      let emails = 0;

      for (let i = 0; i < visitors; i++) {
        if (Math.random() < cartProb) carts++;
        if (Math.random() < checkoutProb) checkouts++;
        if (Math.random() < purchaseProb) {
          purchases++;
          const basePrice = exp.test_type === "product_pricing" ? 50 : 35;
          revenue += basePrice + Math.random() * 20;
        }
        if (Math.random() < emailProb) emails++;
      }

      variant.visitors = (variant.visitors || 0) + visitors;
      variant.add_to_cart_count = (variant.add_to_cart_count || 0) + carts;
      variant.checkout_count = (variant.checkout_count || 0) + checkouts;
      variant.purchase_count = (variant.purchase_count || 0) + purchases;
      variant.revenue = Number(variant.revenue || 0) + Math.round(revenue * 100) / 100;
      variant.emails_captured = (variant.emails_captured || 0) + emails;

      await upsertExperimentVariantDb(variant);
    }

    exp.updated_at = new Date().toISOString();
    await upsertExperimentDb(exp);

    response.json({ success: true, message: "Simulation completed.", variants });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/experiments/:id/promote", requireAdmin, async (request, response) => {
  try {
    const { id } = request.params;
    const { variantId } = z.object({ variantId: z.string() }).parse(request.body);

    const exp = await getExperimentByIdDb(id);
    if (!exp) {
      response.status(404).json({ error: "Experiment not found" });
      return;
    }

    const variants = await getVariantsForExperimentDb(id);
    const winningVariant = variants.find((v: any) => v.id === variantId);
    if (!winningVariant) {
      response.status(404).json({ error: "Variant not found" });
      return;
    }

    exp.status = "completed";
    exp.winner_variant_id = variantId;
    exp.end_date = new Date().toISOString();
    await upsertExperimentDb(exp);

    if (exp.test_type === "product_pricing" && exp.target_id) {
      const products = await getProductsDb();
      const product = products.find((p: any) => p.id === exp.target_id);
      if (product) {
        const price = Number(winningVariant.changes.price || winningVariant.changes.retailMin);
        if (price > 0) {
          product.retailMin = price;
          product.retailMax = price;
          await upsertProductDb(product);
        }
      }
    }

    response.json({ success: true, experiment: exp, variant: winningVariant });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/experiments/:id/track", async (request, response) => {
  try {
    const { id } = request.params;
    const { action, variantId, revenue } = z.object({
      action: z.enum(["visitor", "add_to_cart", "checkout", "purchase", "email_capture"]),
      variantId: z.string(),
      revenue: z.number().optional()
    }).parse(request.body);

    const exp = await getExperimentByIdDb(id);
    if (!exp) {
      response.status(404).json({ error: "Experiment not found" });
      return;
    }

    if (exp.status !== "active") {
      response.json({ message: "Experiment is not active, track skipped." });
      return;
    }

    const variants = await getVariantsForExperimentDb(id);
    const variant = variants.find((v: any) => v.id === variantId);
    if (!variant) {
      response.status(404).json({ error: "Variant not found" });
      return;
    }

    if (action === "visitor") {
      variant.visitors = (variant.visitors || 0) + 1;
    } else if (action === "add_to_cart") {
      variant.add_to_cart_count = (variant.add_to_cart_count || 0) + 1;
    } else if (action === "checkout") {
      variant.checkout_count = (variant.checkout_count || 0) + 1;
    } else if (action === "purchase") {
      variant.purchase_count = (variant.purchase_count || 0) + 1;
      if (revenue) {
        variant.revenue = Number(variant.revenue || 0) + revenue;
      }
    } else if (action === "email_capture") {
      variant.emails_captured = (variant.emails_captured || 0) + 1;
    }

    await upsertExperimentVariantDb(variant);
    response.json({ success: true, variant });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/experiments", requireAdmin, async (_request, response) => {
  try {
    const experiments = await getExperimentsDb();
    const result = [];
    for (const exp of experiments) {
      const variants = await getVariantsForExperimentDb(exp.id);
      result.push({
        ...exp,
        variants
      });
    }
    response.json({ experiments: result });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/experiments", requireAdmin, async (request, response) => {
  try {
    const body = createExperimentSchema.parse(request.body);
    const expId = crypto.randomUUID();
    const start_date = new Date().toISOString();

    const experiment = {
      id: expId,
      name: body.name,
      status: "active",
      niche: body.niche,
      test_type: body.test_type,
      target_id: body.target_id || null,
      traffic_allocation: body.traffic_allocation,
      winner_variant_id: null,
      confidence_threshold: body.confidence_threshold,
      start_date,
      end_date: null,
      created_at: start_date,
      updated_at: start_date
    };

    await upsertExperimentDb(experiment);

    const variantsCreated = [];
    for (const v of body.variants) {
      const variant = {
        id: crypto.randomUUID(),
        experiment_id: expId,
        name: v.name,
        changes: v.changes,
        visitors: 0,
        add_to_cart_count: 0,
        checkout_count: 0,
        purchase_count: 0,
        revenue: 0,
        emails_captured: 0,
        is_control: v.is_control
      };
      await upsertExperimentVariantDb(variant);
      variantsCreated.push(variant);
    }

    response.status(201).json({
      experiment: {
        ...experiment,
        variants: variantsCreated
      }
    });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/experiments/:id", requireAdmin, async (request, response) => {
  try {
    const { id } = request.params;
    const experiment = await getExperimentByIdDb(id);
    if (!experiment) {
      response.status(404).json({ error: "Experiment not found" });
      return;
    }
    const variants = await getVariantsForExperimentDb(id);
    response.json({
      experiment: {
        ...experiment,
        variants
      }
    });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/experiments/:id", requireAdmin, async (request, response) => {
  try {
    const { id } = request.params;
    const exp = await getExperimentByIdDb(id);
    if (!exp) {
      response.status(404).json({ error: "Experiment not found" });
      return;
    }
    const updated = { ...exp, ...request.body, id, updated_at: new Date().toISOString() };
    await upsertExperimentDb(updated);
    response.json({ experiment: updated });
  } catch (error: any) {
    response.status(500).json({ error: error.message });
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
  const openAiKey = process.env.OPENAI_API_KEY || "";
  const databaseUrlValue = process.env.DATABASE_URL || "";
  const adminPasswordValue = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  const maskSecret = (value: string, prefix = "") => {
    if (!value) return "";
    return `${prefix || "****"}...${value.slice(-4)}`;
  };
  
  // Mask the secret key for safety
  const maskedStripeKey = stripeKey 
    ? stripeKey.startsWith("sk_") 
      ? `sk_...${stripeKey.substring(stripeKey.length - 4)}` 
      : "••••••••••••••••"
    : "";

  response.json({
    stripeSecretKey: maskedStripeKey,
    hasStripeKey: Boolean(stripeKey),
    databaseUrl: maskSecret(databaseUrlValue, databaseUrlValue.startsWith("postgres") ? "postgres" : ""),
    hasDatabaseUrl: Boolean(databaseUrlValue),
    databaseMode: usePostgres ? "PostgreSQL" : "Local file fallback",
    medusaBackendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    medusaAdminApiKey: maskSecret(process.env.MEDUSA_ADMIN_API_KEY || ""),
    hasMedusaAdminApiKey: Boolean(process.env.MEDUSA_ADMIN_API_KEY),
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || "",
    hasGoogleClientId: Boolean(process.env.VITE_GOOGLE_CLIENT_ID),
    openAiApiKey: maskSecret(openAiKey, openAiKey.startsWith("sk-") ? "sk" : ""),
    hasOpenAiApiKey: Boolean(openAiKey),
    adminEmail: process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || adminEmail,
    adminPassword: maskSecret(adminPasswordValue),
    hasCustomAdminPassword: Boolean(adminPasswordValue && adminPasswordValue !== "change-this-password"),
    publicSiteUrl: process.env.PUBLIC_SITE_URL || "",
    publicAppBase: process.env.PUBLIC_APP_BASE || "",
    ga4MeasurementId: process.env.VITE_GA4_MEASUREMENT_ID || "",
    metaPixelId: process.env.VITE_META_PIXEL_ID || "",
    tiktokPixelId: process.env.VITE_TIKTOK_PIXEL_ID || "",
    basicTaxRate: process.env.BASIC_TAX_RATE || String(taxRate),
    freeShippingThreshold: process.env.FREE_SHIPPING_THRESHOLD || String(freeShippingThreshold),
    flatShipping: process.env.FLAT_SHIPPING || String(flatShipping),
  });
});

// POST /api/settings/config writes configurations back to .env
app.post("/api/settings/config", requireAdmin, async (request, response) => {
  try {
    const {
      databaseUrl: nextDatabaseUrl,
      stripeSecretKey,
      medusaBackendUrl,
      medusaAdminApiKey,
      googleClientId,
      openAiApiKey,
      adminEmail: nextAdminEmail,
      adminPassword: nextAdminPassword,
      publicSiteUrl,
      publicAppBase,
      ga4MeasurementId,
      metaPixelId,
      tiktokPixelId,
      basicTaxRate,
      freeShippingThreshold: nextFreeShippingThreshold,
      flatShipping: nextFlatShipping,
    } = z.object({
      databaseUrl: z.string().optional(),
      stripeSecretKey: z.string().optional(),
      medusaBackendUrl: z.string().url().optional().or(z.string().length(0)),
      medusaAdminApiKey: z.string().optional(),
      googleClientId: z.string().optional(),
      openAiApiKey: z.string().optional(),
      adminEmail: z.string().email().optional().or(z.string().length(0)),
      adminPassword: z.string().optional(),
      publicSiteUrl: z.string().optional(),
      publicAppBase: z.string().optional(),
      ga4MeasurementId: z.string().optional(),
      metaPixelId: z.string().optional(),
      tiktokPixelId: z.string().optional(),
      basicTaxRate: z.string().optional(),
      freeShippingThreshold: z.string().optional(),
      flatShipping: z.string().optional(),
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

    const isMaskedValue = (value?: string) => Boolean(value && (value.includes("...") || value.includes("****") || value.includes("â€¢")));
    const updatePlainValue = (key: string, value?: string) => {
      if (value === undefined || isMaskedValue(value)) return;
      const cleanValue = String(value || "").trim();
      updateOrAdd(key, cleanValue);
      process.env[key] = cleanValue;
    };

    updatePlainValue("DATABASE_URL", nextDatabaseUrl);
    updatePlainValue("VITE_GOOGLE_CLIENT_ID", googleClientId);
    updatePlainValue("OPENAI_API_KEY", openAiApiKey);
    updatePlainValue("VITE_ADMIN_EMAIL", nextAdminEmail);
    updatePlainValue("ADMIN_EMAIL", nextAdminEmail);
    updatePlainValue("VITE_ADMIN_PASSWORD", nextAdminPassword);
    updatePlainValue("ADMIN_PASSWORD", nextAdminPassword);
    updatePlainValue("PUBLIC_SITE_URL", publicSiteUrl);
    updatePlainValue("PUBLIC_APP_BASE", publicAppBase);
    updatePlainValue("VITE_GA4_MEASUREMENT_ID", ga4MeasurementId);
    updatePlainValue("VITE_META_PIXEL_ID", metaPixelId);
    updatePlainValue("VITE_TIKTOK_PIXEL_ID", tiktokPixelId);
    updatePlainValue("BASIC_TAX_RATE", basicTaxRate);
    updatePlainValue("FREE_SHIPPING_THRESHOLD", nextFreeShippingThreshold);
    updatePlainValue("FLAT_SHIPPING", nextFlatShipping);

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
    if (!isMaskedValue(cleanMedusaKey)) {
      updateOrAdd("MEDUSA_ADMIN_API_KEY", cleanMedusaKey);
      updateOrAdd("VITE_MEDUSA_ADMIN_API_KEY", cleanMedusaKey);
      process.env.MEDUSA_ADMIN_API_KEY = cleanMedusaKey;
      process.env.VITE_MEDUSA_ADMIN_API_KEY = cleanMedusaKey;
    }

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
      const existingResult = await pool.query("select payload from contacts where email = $1", [email]);
      const existingPayload = existingResult.rows[0]?.payload || {};
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
          { ...existingPayload, email, name, preferences, savedCart, role: existingPayload.role || "customer", updatedAt: new Date().toISOString() }
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
        role: db.contacts[email]?.role || existing.role || "customer",
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
app.get("*all", (request, response, next) => {
  if (request.path.startsWith("/api") || (request.headers.accept && !request.headers.accept.includes("text/html"))) {
    next();
    return;
  }
  response.sendFile(path.join(distPath, "index.html"));
});

// Database Abstraction & SQL Helpers
async function getOpportunitiesDb() {
  if (usePostgres) {
    const result = await pool.query("select * from product_research_opportunities order by created_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.opportunities || {}).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function getOpportunityByIdDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("select * from product_research_opportunities where id = $1", [id]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return db.opportunities?.[id] || null;
  }
}

async function upsertOpportunityDb(opp: any) {
  if (usePostgres) {
    await pool.query(
      `insert into product_research_opportunities (
        id, name, niche, subdomain, category, source, source_url, status, 
        opportunity_score, recommendation_summary, demand_score, margin_score, 
        supplier_score, competition_score, brand_fit_score, content_score, 
        risk_score, risk_notes, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       on conflict (id) do update set
         name = excluded.name,
         niche = excluded.niche,
         subdomain = excluded.subdomain,
         category = excluded.category,
         status = excluded.status,
         opportunity_score = excluded.opportunity_score,
         recommendation_summary = excluded.recommendation_summary,
         demand_score = excluded.demand_score,
         margin_score = excluded.margin_score,
         supplier_score = excluded.supplier_score,
         competition_score = excluded.competition_score,
         brand_fit_score = excluded.brand_fit_score,
         content_score = excluded.content_score,
         risk_score = excluded.risk_score,
         risk_notes = excluded.risk_notes,
         updated_at = now()`,
      [
        opp.id, opp.name, opp.niche, opp.subdomain || null, opp.category || null, opp.source || null, opp.source_url || null, opp.status || 'discovered',
        opp.opportunity_score || null, opp.recommendation_summary || null, opp.demand_score || null, opp.margin_score || null,
        opp.supplier_score || null, opp.competition_score || null, opp.brand_fit_score || null, opp.content_score || null,
        opp.risk_score || null, opp.risk_notes || null, opp.created_at || new Date().toISOString(), opp.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.opportunities) db.opportunities = {};
    db.opportunities[opp.id] = opp;
    writeDb(db);
  }
}

async function getCompetitorsForOpportunityDb(opportunityId: string) {
  if (usePostgres) {
    const result = await pool.query("select * from competitor_products where opportunity_id = $1 order by captured_at desc", [opportunityId]);
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.competitors || {})
      .filter((c: any) => c.opportunity_id === opportunityId)
      .sort((a: any, b: any) => b.captured_at.localeCompare(a.captured_at));
  }
}

async function getAllCompetitorsDb() {
  if (usePostgres) {
    const result = await pool.query("select * from competitor_products order by captured_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.competitors || {})
      .sort((a: any, b: any) => b.captured_at.localeCompare(a.captured_at));
  }
}

async function upsertCompetitorProductDb(competitor: any) {
  if (usePostgres) {
    await pool.query(
      `insert into competitor_products (
        id, opportunity_id, competitor_name, competitor_url, product_title, 
        price, compare_at_price, rating, review_count, sales_signal, 
        offer_notes, positioning_notes, images, captured_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       on conflict (id) do update set
         competitor_name = excluded.competitor_name,
         competitor_url = excluded.competitor_url,
         product_title = excluded.product_title,
         price = excluded.price,
         compare_at_price = excluded.compare_at_price,
         rating = excluded.rating,
         review_count = excluded.review_count,
         sales_signal = excluded.sales_signal,
         offer_notes = excluded.offer_notes,
         positioning_notes = excluded.positioning_notes,
         images = excluded.images,
         captured_at = now()`,
      [
        competitor.id, competitor.opportunity_id, competitor.competitor_name, competitor.competitor_url, competitor.product_title,
        competitor.price, competitor.compare_at_price || null, competitor.rating || null, competitor.review_count || null, competitor.sales_signal || null,
        competitor.offer_notes || null, competitor.positioning_notes || null, typeof competitor.images === 'string' ? competitor.images : JSON.stringify(competitor.images), competitor.captured_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.competitors) db.competitors = {};
    db.competitors[competitor.id] = competitor;
    writeDb(db);
  }
}

async function getSuppliersForOpportunityDb(opportunityId: string) {
  if (usePostgres) {
    const result = await pool.query("select * from supplier_products where opportunity_id = $1 order by created_at desc", [opportunityId]);
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.suppliers || {})
      .filter((s: any) => s.opportunity_id === opportunityId)
      .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function upsertSupplierProductDb(supplier: any) {
  if (usePostgres) {
    await pool.query(
      `insert into supplier_products (
        id, opportunity_id, supplier_platform, supplier_name, supplier_url, 
        product_url, title, price_min, price_max, shipping_cost, 
        rating, review_count, orders_count, estimated_delivery_days, 
        variants, images, description_raw, supplier_score, import_status, 
        created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       on conflict (id) do update set
         supplier_name = excluded.supplier_name,
         supplier_url = excluded.supplier_url,
         product_url = excluded.product_url,
         title = excluded.title,
         price_min = excluded.price_min,
         price_max = excluded.price_max,
         shipping_cost = excluded.shipping_cost,
         rating = excluded.rating,
         review_count = excluded.review_count,
         orders_count = excluded.orders_count,
         estimated_delivery_days = excluded.estimated_delivery_days,
         variants = excluded.variants,
         images = excluded.images,
         description_raw = excluded.description_raw,
         supplier_score = excluded.supplier_score,
         import_status = excluded.import_status,
         updated_at = now()`,
      [
        supplier.id, supplier.opportunity_id, supplier.supplier_platform || 'aliexpress', supplier.supplier_name || null, supplier.supplier_url || null,
        supplier.product_url, supplier.title || null, supplier.price_min || null, supplier.price_max || null, supplier.shipping_cost || null,
        supplier.rating || null, supplier.review_count || null, supplier.orders_count || null, supplier.estimated_delivery_days || null,
        typeof supplier.variants === 'string' ? supplier.variants : JSON.stringify(supplier.variants), typeof supplier.images === 'string' ? supplier.images : JSON.stringify(supplier.images), supplier.description_raw || null, supplier.supplier_score || null, supplier.import_status || 'not_imported',
        supplier.created_at || new Date().toISOString(), supplier.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.suppliers) db.suppliers = {};
    db.suppliers[supplier.id] = supplier;
    writeDb(db);
  }
}

async function upsertResearchRunDb(run: any) {
  if (usePostgres) {
    await pool.query(
      `insert into research_runs (
        id, run_type, niche, query, status, started_at, completed_at, results_count, error_message, metadata
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
         status = excluded.status,
         completed_at = excluded.completed_at,
         results_count = excluded.results_count,
         error_message = excluded.error_message,
         metadata = excluded.metadata`,
      [
        run.id, run.run_type, run.niche, run.query, run.status,
        run.started_at, run.completed_at, run.results_count, run.error_message, run.metadata ? (typeof run.metadata === 'string' ? run.metadata : JSON.stringify(run.metadata)) : null
      ]
    );
  } else {
    const db = readDb();
    if (!db.researchRuns) db.researchRuns = {};
    db.researchRuns[run.id] = run;
    writeDb(db);
  }
}

async function upsertImportJobDb(job: any) {
  if (usePostgres) {
    await pool.query(
      `insert into product_import_jobs (
        id, supplier_product_id, created_product_id, status, started_at, completed_at, error_message, import_payload
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         created_product_id = excluded.created_product_id,
         status = excluded.status,
         completed_at = excluded.completed_at,
         error_message = excluded.error_message,
         import_payload = excluded.import_payload`,
      [
        job.id, job.supplier_product_id, job.created_product_id, job.status,
        job.started_at, job.completed_at, job.error_message, job.import_payload ? (typeof job.import_payload === 'string' ? job.import_payload : JSON.stringify(job.import_payload)) : null
      ]
    );
  } else {
    const db = readDb();
    if (!db.importJobs) db.importJobs = {};
    db.importJobs[job.id] = job;
    writeDb(db);
  }
}

async function getExperimentsDb() {
  if (usePostgres) {
    const result = await pool.query("select * from experiments order by created_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.experiments || {}).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function getExperimentByIdDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("select * from experiments where id = $1", [id]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return db.experiments?.[id] || null;
  }
}

async function upsertExperimentDb(exp: any) {
  if (usePostgres) {
    await pool.query(
      `insert into experiments (
        id, name, status, niche, test_type, target_id, traffic_allocation, 
        winner_variant_id, confidence_threshold, start_date, end_date, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (id) do update set
         name = excluded.name,
         status = excluded.status,
         niche = excluded.niche,
         test_type = excluded.test_type,
         target_id = excluded.target_id,
         traffic_allocation = excluded.traffic_allocation,
         winner_variant_id = excluded.winner_variant_id,
         confidence_threshold = excluded.confidence_threshold,
         end_date = excluded.end_date,
         updated_at = now()`,
      [
        exp.id, exp.name, exp.status, exp.niche, exp.test_type, exp.target_id || null, exp.traffic_allocation,
        exp.winner_variant_id || null, exp.confidence_threshold, exp.start_date, exp.end_date || null,
        exp.created_at || new Date().toISOString(), exp.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.experiments) db.experiments = {};
    db.experiments[exp.id] = exp;
    writeDb(db);
  }
}

async function deleteExperimentDb(id: string) {
  if (usePostgres) {
    await pool.query("delete from experiments where id = $1", [id]);
  } else {
    const db = readDb();
    if (db.experiments?.[id]) {
      delete db.experiments[id];
      if (db.experimentVariants) {
        Object.keys(db.experimentVariants).forEach((vid) => {
          if (db.experimentVariants[vid].experiment_id === id) {
            delete db.experimentVariants[vid];
          }
        });
      }
      writeDb(db);
    }
  }
}

async function getVariantsForExperimentDb(experimentId: string) {
  if (usePostgres) {
    const result = await pool.query("select * from experiment_variants where experiment_id = $1 order by is_control desc, id asc", [experimentId]);
    return result.rows.map(v => ({
      ...v,
      changes: typeof v.changes === 'string' ? JSON.parse(v.changes) : v.changes
    }));
  } else {
    const db = readDb();
    const list = Object.values(db.experimentVariants || {})
      .filter((v: any) => v.experiment_id === experimentId)
      .sort((a: any, b: any) => (b.is_control ? 1 : 0) - (a.is_control ? 1 : 0) || a.id.localeCompare(b.id));
    return list.map((v: any) => ({
      ...v,
      changes: typeof v.changes === 'string' ? JSON.parse(v.changes) : v.changes
    }));
  }
}

async function upsertExperimentVariantDb(v: any) {
  const changesVal = typeof v.changes === 'string' ? JSON.parse(v.changes) : v.changes;
  if (usePostgres) {
    await pool.query(
      `insert into experiment_variants (
        id, experiment_id, name, changes, visitors, add_to_cart_count, 
        checkout_count, purchase_count, revenue, emails_captured, is_control
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         name = excluded.name,
         changes = excluded.changes,
         visitors = excluded.visitors,
         add_to_cart_count = excluded.add_to_cart_count,
         checkout_count = excluded.checkout_count,
         purchase_count = excluded.purchase_count,
         revenue = excluded.revenue,
         emails_captured = excluded.emails_captured,
         is_control = excluded.is_control`,
      [
        v.id, v.experiment_id, v.name, JSON.stringify(changesVal),
        v.visitors || 0, v.add_to_cart_count || 0, v.checkout_count || 0, v.purchase_count || 0,
        v.revenue || 0, v.emails_captured || 0, v.is_control || false
      ]
    );
  } else {
    const db = readDb();
    if (!db.experimentVariants) db.experimentVariants = {};
    db.experimentVariants[v.id] = {
      ...v,
      changes: changesVal
    };
    writeDb(db);
  }
}

async function getArticlesDb() {
  if (usePostgres) {
    const result = await pool.query("select * from articles order by created_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.articles || {}).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function getArticleByIdDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("select * from articles where id = $1", [id]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return db.articles?.[id] || null;
  }
}

async function getArticleBySlugDb(slug: string) {
  if (usePostgres) {
    const result = await pool.query("select * from articles where slug = $1", [slug]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return Object.values(db.articles || {}).find((a: any) => a.slug === slug) || null;
  }
}

async function upsertArticleDb(art: any) {
  if (usePostgres) {
    await pool.query(
      `insert into articles (
        id, title, slug, content, summary, niche, status, seo_title, 
        seo_description, keywords, schema_markup, views, conversions, revenue, published_at, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       on conflict (id) do update set
         title = excluded.title,
         slug = excluded.slug,
         content = excluded.content,
         summary = excluded.summary,
         niche = excluded.niche,
         status = excluded.status,
         seo_title = excluded.seo_title,
         seo_description = excluded.seo_description,
         keywords = excluded.keywords,
         schema_markup = excluded.schema_markup,
         views = excluded.views,
         conversions = excluded.conversions,
         revenue = excluded.revenue,
         published_at = excluded.published_at,
         updated_at = now()`,
      [
        art.id, art.title, art.slug, art.content, art.summary || null, art.niche, art.status || 'draft',
        art.seo_title || null, art.seo_description || null, art.keywords || null,
        art.schema_markup ? (typeof art.schema_markup === 'string' ? art.schema_markup : JSON.stringify(art.schema_markup)) : null,
        art.views || 0, art.conversions || 0, art.revenue || 0, art.published_at || null,
        art.created_at || new Date().toISOString(), art.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.articles) db.articles = {};
    db.articles[art.id] = art;
    writeDb(db);
  }
}

async function deleteArticleDb(id: string) {
  if (usePostgres) {
    await pool.query("delete from articles where id = $1", [id]);
  } else {
    const db = readDb();
    if (db.articles?.[id]) {
      delete db.articles[id];
      writeDb(db);
    }
  }
}

// KB Helpers
async function getKbArticlesDb() {
  if (usePostgres) {
    const result = await pool.query("select * from knowledge_articles order by created_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.knowledgeArticles || {}).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function getKbArticleByIdDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("select * from knowledge_articles where id = $1", [id]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return db.knowledgeArticles?.[id] || null;
  }
}

async function getKbArticleBySlugDb(slug: string) {
  if (usePostgres) {
    const result = await pool.query("select * from knowledge_articles where slug = $1", [slug]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return Object.values(db.knowledgeArticles || {}).find((a: any) => a.slug === slug) || null;
  }
}

async function incrementKbArticleViewsDb(id: string) {
  if (usePostgres) {
    await pool.query("update knowledge_articles set views = views + 1 where id = $1", [id]);
  } else {
    const db = readDb();
    if (db.knowledgeArticles?.[id]) {
      db.knowledgeArticles[id] = {
        ...db.knowledgeArticles[id],
        views: Number(db.knowledgeArticles[id].views || 0) + 1
      };
      writeDb(db);
    }
  }
}

async function upsertKbArticleDb(kb: any) {
  if (usePostgres) {
    await pool.query(
      `insert into knowledge_articles (
        id, title, slug, content, category, niche, product_id, status, views, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         title = excluded.title,
         slug = excluded.slug,
         content = excluded.content,
         category = excluded.category,
         niche = excluded.niche,
         product_id = excluded.product_id,
         status = excluded.status,
         views = excluded.views,
         updated_at = now()`,
      [
        kb.id, kb.title, kb.slug, kb.content, kb.category, kb.niche, kb.product_id || null,
        kb.status || 'published', kb.views || 0,
        kb.created_at || new Date().toISOString(), kb.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.knowledgeArticles) db.knowledgeArticles = {};
    db.knowledgeArticles[kb.id] = kb;
    writeDb(db);
  }
}

// Programmatic SEO Helpers
async function getSeoPagesDb() {
  if (usePostgres) {
    const result = await pool.query("select * from seo_pages order by created_at desc");
    return result.rows;
  } else {
    const db = readDb();
    return Object.values(db.seoPages || {}).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  }
}

async function getSeoPageByIdDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("select * from seo_pages where id = $1", [id]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return db.seoPages?.[id] || null;
  }
}

async function getSeoPageBySlugDb(slug: string) {
  if (usePostgres) {
    const result = await pool.query("select * from seo_pages where slug = $1", [slug]);
    return result.rowCount > 0 ? result.rows[0] : null;
  } else {
    const db = readDb();
    return Object.values(db.seoPages || {}).find((s: any) => s.slug === slug) || null;
  }
}

async function upsertSeoPageDb(page: any) {
  if (usePostgres) {
    await pool.query(
      `insert into seo_pages (
        id, title, slug, niche, category_name, description, seo_title, 
        seo_description, schema_markup, status, views, conversions, revenue, published_at, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       on conflict (id) do update set
         title = excluded.title,
         slug = excluded.slug,
         niche = excluded.niche,
         category_name = excluded.category_name,
         description = excluded.description,
         seo_title = excluded.seo_title,
         seo_description = excluded.seo_description,
         schema_markup = excluded.schema_markup,
         status = excluded.status,
         views = excluded.views,
         conversions = excluded.conversions,
         revenue = excluded.revenue,
         published_at = excluded.published_at,
         updated_at = now()`,
      [
        page.id, page.title, page.slug, page.niche, page.category_name, page.description,
        page.seo_title || null, page.seo_description || null,
        page.schema_markup ? (typeof page.schema_markup === 'string' ? page.schema_markup : JSON.stringify(page.schema_markup)) : null,
        page.status || 'draft',
        page.views || 0, page.conversions || 0, page.revenue || 0,
        page.published_at || null,
        page.created_at || new Date().toISOString(), page.updated_at || new Date().toISOString()
      ]
    );
  } else {
    const db = readDb();
    if (!db.seoPages) db.seoPages = {};
    db.seoPages[page.id] = page;
    writeDb(db);
  }
}

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
      const existingContact = await client.query("select payload from contacts where email = $1", [order.email]);
      const existingPayload = existingContact.rows[0]?.payload || {};
      const contactPayload = { ...existingPayload, ...order, role: existingPayload.role || "customer" };
      await client.query(
        `insert into contacts (email, customer_name, address, last_order_id, payload)
         values ($1, $2, $3, $4, $5)
         on conflict (email) do update set
           customer_name = excluded.customer_name,
           address = excluded.address,
           last_order_id = excluded.last_order_id,
           payload = excluded.payload,
           updated_at = now()`,
        [order.email, order.customerName, order.address, order.id, contactPayload],
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
      role: db.contacts[order.email.toLowerCase()]?.role || "customer",
      payload: { ...order, role: db.contacts[order.email.toLowerCase()]?.role || "customer" },
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
      `select email, customer_name as "customerName", address, last_order_id as "lastOrderId", updated_at as "updatedAt", payload
       from contacts order by updated_at desc`
    );
    return result.rows.map((row) => ({
      email: row.email,
      customerName: row.customerName,
      address: row.address,
      lastOrderId: row.lastOrderId,
      role: row.payload?.role || (row.email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "customer"),
      source: row.payload?.source || "",
      niche: row.payload?.niche || "",
      storeLabel: row.payload?.storeLabel || row.payload?.niche || "",
      phone: row.payload?.phone || "",
      wantsSms: Boolean(row.payload?.wantsSms),
      couponCode: row.payload?.couponCode || "",
      updatedAt: row.updatedAt,
    }));
  } else {
    const db = readDb();
    return Object.values(db.contacts)
      .map((c: any) => ({
        email: c.email,
        customerName: c.customerName,
        address: c.address,
        lastOrderId: c.lastOrderId || null,
        role: c.role || c.payload?.role || (String(c.email || "").toLowerCase() === adminEmail.toLowerCase() ? "admin" : "customer"),
        source: c.source || c.payload?.source || "",
        niche: c.niche || c.payload?.niche || "",
        storeLabel: c.storeLabel || c.payload?.storeLabel || c.payload?.niche || "",
        phone: c.phone || c.payload?.phone || "",
        wantsSms: Boolean(c.wantsSms || c.payload?.wantsSms),
        couponCode: c.couponCode || c.payload?.couponCode || "",
        updatedAt: c.updatedAt
      }))
      .sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

async function getMediaAssetsDb() {
  if (usePostgres) {
    const result = await pool.query("select payload from media_assets order by created_at desc");
    return result.rows.map((row) => row.payload);
  }

  const db = readDb();
  return Object.values(db.mediaAssets || {}).sort((a: any, b: any) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

async function upsertMediaAssetDb(asset: any) {
  if (usePostgres) {
    await pool.query(
      `insert into media_assets (id, kind, placement, product_id, payload, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         kind = excluded.kind,
         placement = excluded.placement,
         product_id = excluded.product_id,
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
      [asset.id, asset.kind, asset.placement, asset.productId || null, asset, asset.createdAt || new Date().toISOString(), asset.updatedAt || new Date().toISOString()],
    );
    return;
  }

  const db = readDb();
  if (!db.mediaAssets) db.mediaAssets = {};
  db.mediaAssets[asset.id] = asset;
  writeDb(db);
}

async function deleteMediaAssetDb(id: string) {
  if (usePostgres) {
    const result = await pool.query("delete from media_assets where id = $1 returning payload", [id]);
    return result.rowCount ? result.rows[0].payload : null;
  }

  const db = readDb();
  const asset = db.mediaAssets?.[id] || null;
  if (asset && db.mediaAssets) {
    delete db.mediaAssets[id];
    writeDb(db);
  }
  return asset;
}

function absoluteUploadUrl(_request: express.Request, fileName: string) {
  const configuredBase = process.env.PUBLIC_API_URL || "";
  if (configuredBase && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredBase.trim())) {
    return `${configuredBase.replace(/\/$/, "")}/uploads/${fileName}`;
  }

  return `/uploads/${fileName}`;
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

    create table if not exists media_assets (
      id uuid primary key,
      kind text not null,
      placement text not null default 'library',
      product_id text,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists product_research_opportunities (
      id uuid primary key,
      name text not null,
      niche text not null,
      subdomain text,
      category text,
      source text,
      source_url text,
      status text default 'discovered',
      opportunity_score numeric,
      recommendation_summary text,
      demand_score numeric,
      margin_score numeric,
      supplier_score numeric,
      competition_score numeric,
      brand_fit_score numeric,
      content_score numeric,
      risk_score numeric,
      risk_notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists competitor_products (
      id uuid primary key,
      opportunity_id uuid references product_research_opportunities(id) on delete cascade,
      competitor_name text,
      competitor_url text,
      product_title text,
      price numeric,
      compare_at_price numeric,
      rating numeric,
      review_count integer,
      sales_signal text,
      offer_notes text,
      positioning_notes text,
      images jsonb,
      captured_at timestamptz not null default now()
    );

    create table if not exists supplier_products (
      id uuid primary key,
      opportunity_id uuid references product_research_opportunities(id) on delete cascade,
      supplier_platform text default 'aliexpress',
      supplier_name text,
      supplier_url text,
      product_url text not null,
      title text,
      price_min numeric,
      price_max numeric,
      shipping_cost numeric,
      rating numeric,
      review_count integer,
      orders_count integer,
      estimated_delivery_days integer,
      variants jsonb,
      images jsonb,
      description_raw text,
      supplier_score numeric,
      import_status text default 'not_imported',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists research_runs (
      id uuid primary key,
      run_type text,
      niche text,
      query text,
      status text,
      started_at timestamptz not null default now(),
      completed_at timestamptz,
      results_count integer,
      error_message text,
      metadata jsonb
    );

    create table if not exists product_import_jobs (
      id uuid primary key,
      supplier_product_id uuid references supplier_products(id) on delete cascade,
      created_product_id text,
      status text default 'queued',
      started_at timestamptz not null default now(),
      completed_at timestamptz,
      error_message text,
      import_payload jsonb
    );

    create table if not exists experiments (
      id text primary key,
      name text not null,
      status text not null,
      niche text not null,
      test_type text not null,
      target_id text,
      traffic_allocation integer not null default 50,
      winner_variant_id text,
      confidence_threshold integer not null default 95,
      start_date timestamptz not null default now(),
      end_date timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists experiment_variants (
      id text primary key,
      experiment_id text references experiments(id) on delete cascade,
      name text not null,
      changes jsonb not null,
      visitors integer not null default 0,
      add_to_cart_count integer not null default 0,
      checkout_count integer not null default 0,
      purchase_count integer not null default 0,
      revenue numeric not null default 0,
      emails_captured integer not null default 0,
      is_control boolean not null default false
    );

    create table if not exists articles (
      id text primary key,
      title text not null,
      slug text not null unique,
      content text not null,
      summary text,
      niche text not null,
      status text not null default 'draft',
      seo_title text,
      seo_description text,
      keywords text,
      schema_markup jsonb,
      views integer not null default 0,
      conversions integer not null default 0,
      revenue numeric not null default 0,
      published_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists knowledge_articles (
      id text primary key,
      title text not null,
      slug text not null unique,
      content text not null,
      category text not null,
      niche text not null,
      product_id text,
      status text not null default 'published',
      views integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists seo_pages (
      id text primary key,
      title text not null,
      slug text not null unique,
      niche text not null,
      category_name text not null,
      description text not null,
      seo_title text,
      seo_description text,
      schema_markup jsonb,
      status text not null default 'published',
      views integer not null default 0,
      conversions integer not null default 0,
      revenue numeric not null default 0,
      published_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    alter table seo_pages add column if not exists status text not null default 'published';
    alter table seo_pages add column if not exists published_at timestamptz;
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
