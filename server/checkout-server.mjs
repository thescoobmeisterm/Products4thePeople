import "dotenv/config";
import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT || 4242);
const appBase = normalizeBase(process.env.PUBLIC_APP_BASE || "/Products4thePeople/");
const publicSiteUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const taxRate = Number(process.env.BASIC_TAX_RATE || 0.06);
const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD || 75);
const flatShipping = Number(process.env.FLAT_SHIPPING || 7);

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", getOrigin(request));

    if (request.method === "POST" && url.pathname === "/api/create-checkout-session") {
      await createCheckoutSession(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/checkout-session") {
      await getCheckoutSession(url, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    serveStatic(url, response);
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
  }
});

server.listen(port, () => {
  console.log(`Products4ThePeople checkout server listening on http://localhost:${port}${appBase}`);
});

async function createCheckoutSession(request, response) {
  if (!stripe) {
    sendJson(response, 500, { error: "STRIPE_SECRET_KEY is required to create checkout sessions." });
    return;
  }

  const body = await readJson(request);
  const items = Array.isArray(body.items) ? body.items : [];
  const customerName = cleanText(body.customerName, "Customer");
  const email = cleanText(body.email, "");
  const storefront = cleanText(body.storefront, "general").replace(/[^a-z-]/g, "") || "general";
  const discountCode = cleanText(body.discountCode, "");

  if (!email || items.length === 0) {
    sendJson(response, 400, { error: "Customer email and at least one cart item are required." });
    return;
  }

  let discountPercent = 0;
  let isFreeShipping = false;
  if (discountCode === "WHEEL10" || discountCode === "WELCOME10") discountPercent = 10;
  else if (discountCode === "WHEEL15") discountPercent = 15;
  else if (discountCode === "WHEEL20") discountPercent = 20;
  else if (discountCode === "FREESHIP") isFreeShipping = true;

  const discountFactor = 1 - (discountPercent / 100);

  const lineItems = items.map((item) => {
    const name = cleanText(item.name, "Product");
    const quantity = clampInteger(item.quantity, 1, 99);
    const originalUnitAmount = dollarsToCents(Number(item.price || 0));
    const unitAmount = Math.max(1, Math.round(originalUnitAmount * discountFactor));
    if (unitAmount <= 0) throw new Error(`${name} needs a valid price.`);

    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: discountPercent > 0 ? `${name} (${discountPercent}% OFF)` : name,
          metadata: {
            product_id: cleanText(item.productId, ""),
          },
        },
      },
    };
  });

  const subtotal = lineItems.reduce((total, item) => total + item.price_data.unit_amount * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate);
  const shipping = (isFreeShipping || subtotal >= dollarsToCents(freeShippingThreshold)) ? 0 : dollarsToCents(flatShipping);

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

  const origin = publicSiteUrl || getOrigin(request);
  const successUrl = `${origin}${appBase}?checkout=success&session_id={CHECKOUT_SESSION_ID}#${storefront}`;
  const cancelUrl = `${origin}${appBase}?checkout=cancelled#checkout`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: `${storefront}-${Date.now()}`,
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
      customer_name: customerName,
      storefront,
      subtotal_cents: String(subtotal),
      shipping_cents: String(shipping),
      tax_cents: String(tax),
      discount_code: discountCode,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  sendJson(response, 200, { id: session.id, url: session.url });
}

async function getCheckoutSession(url, response) {
  if (!stripe) {
    sendJson(response, 500, { error: "STRIPE_SECRET_KEY is required to read checkout sessions." });
    return;
  }

  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    sendJson(response, 400, { error: "session_id is required." });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  sendJson(response, 200, {
    id: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
    customerEmail: session.customer_details?.email || session.customer_email,
  });
}

function serveStatic(url, response) {
  if (url.pathname === "/") {
    redirect(response, appBase);
    return;
  }

  const relativePath = decodeURIComponent(url.pathname.startsWith(appBase) ? url.pathname.slice(appBase.length) : url.pathname.slice(1));
  const filePath = safeJoin(distDir, relativePath || "index.html");
  const targetPath = existsSync(filePath) && !filePath.endsWith("\\") ? filePath : join(distDir, "index.html");
  const contentType = contentTypes[extname(targetPath)] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(targetPath).pipe(response);
}

function safeJoin(base, path) {
  const target = normalize(join(base, path));
  if (!target.startsWith(normalize(base))) return join(base, "index.html");
  return target;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function getOrigin(request) {
  const host = request.headers.host || `localhost:${port}`;
  const protocol = request.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${host}`;
}

function cleanText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function clampInteger(value, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function dollarsToCents(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function normalizeBase(value) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
