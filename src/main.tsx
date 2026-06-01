import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  FileUp,
  Globe2,
  Home,
  Import,
  LayoutDashboard,
  LineChart,
  Mail,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { listMedusaProducts, testMedusaConnection, type MedusaConnection, type MedusaProduct } from "./lib/medusa";
import "./styles.css";

type Niche = "beauty" | "pets" | "home" | "fitness";
type ProductStatus = "Active" | "Review" | "Draft";

type Product = {
  id: string;
  medusaId?: string;
  name: string;
  niche: string;
  subdomain: Niche;
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
  status: ProductStatus;
  inventory: number;
  source?: "seed" | "local" | "medusa";
};

type ProductForm = Omit<Product, "id">;

type Order = {
  id: string;
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
  status: "Ready to fulfill" | "Needs review";
  createdAt: string;
};

type StorefrontMode = "general" | Niche;

type StorefrontNicheConfig = {
  label: string;
  host: string;
  eyebrow: string;
  headline: string;
  offer: string;
  accent: string;
  soft: string;
  heroImage: string;
};

const storageKey = "p4tp-admin-products";
const medusaConfigKey = "p4tp-medusa-connection";
const orderStorageKey = "p4tp-orders";

const storefrontNiches: Record<StorefrontMode, StorefrontNicheConfig> = {
  general: {
    label: "General Store",
    host: "products4thepeople.com",
    eyebrow: "Products for everyday people",
    headline: "Useful finds across beauty, pets, home, fitness, and whatever wins next.",
    offer: "Free shipping over $75 across the whole store",
    accent: "#176c61",
    soft: "#eef7f5",
    heroImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
  },
  beauty: {
    label: "Beauty",
    host: "beauty.products4thepeople.com",
    eyebrow: "At-home glow-up tools",
    headline: "Beauty products built for fast routines and visible wins.",
    offer: "Free shipping over $75 on beauty bundles",
    accent: "#c84d7d",
    soft: "#fff1f5",
    heroImage:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
  },
  pets: {
    label: "Pets",
    host: "pets.products4thepeople.com",
    eyebrow: "Everyday pet problem solvers",
    headline: "Smart pet products for cleaner homes and happier routines.",
    offer: "Free shipping over $75 on pet essentials",
    accent: "#247b73",
    soft: "#eefaf7",
    heroImage:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
  },
  home: {
    label: "Home",
    host: "home.products4thepeople.com",
    eyebrow: "Home upgrades",
    headline: "Useful home products will live here as the catalog expands.",
    offer: "Home storefront ready for product testing",
    accent: "#8067b7",
    soft: "#f4efff",
    heroImage:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
  },
  fitness: {
    label: "Fitness",
    host: "fitness.products4thepeople.com",
    eyebrow: "Fitness helpers",
    headline: "Fitness products will live here as the catalog expands.",
    offer: "Fitness storefront ready for product testing",
    accent: "#d06b2f",
    soft: "#fff3eb",
    heroImage:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
  },
};

const seedProducts: Product[] = [
  makeProduct("LED Face Mask", "Beauty", "beauty", 18, 35, 6, 12, 79, 149, "60-75%", 1, "https://www.aliexpress.us/w/wholesale-led-face-mask.html", "Luxury spa results at home", "Active", 126),
  makeProduct("Heatless Curlers", "Beauty", "beauty", 2, 6, 2, 5, 19, 39, "75-85%", 2, "https://www.aliexpress.us/w/wholesale-heatless-curling-rod.html", "Salon curls without heat damage", "Active", 410),
  makeProduct("Ice Roller", "Beauty", "beauty", 3, 7, 3, 6, 24, 39, "70-80%", 3, "https://www.aliexpress.us/w/wholesale-ice-roller-face.html", "Depuff your face in 30 seconds", "Active", 288),
  makeProduct("Scalp Massager", "Beauty", "beauty", 1.5, 5, 2, 5, 19, 34, "75-85%", 4, "https://www.aliexpress.us/w/wholesale-scalp-massager.html", "Hair growth and scalp care", "Review", 345),
  makeProduct("Facial Cleansing Brush", "Beauty", "beauty", 4, 12, 3, 7, 29, 59, "65-80%", 5, "https://www.aliexpress.us/w/wholesale-facial-cleansing-brush.html", "Deep clean skincare routine", "Draft", 160),
  makeProduct("Satin Hair Wrap", "Beauty", "beauty", 1, 4, 2, 4, 18, 29, "80-90%", 6, "https://www.aliexpress.us/w/wholesale-satin-hair-wrap.html", "Protect hair while sleeping", "Active", 530),
  makeProduct("LED Neck Mask", "Beauty", "beauty", 15, 30, 6, 10, 69, 129, "60-70%", 7, "https://www.aliexpress.us/w/wholesale-led-neck-mask.html", "Anti-aging neck care", "Review", 94),
  makeProduct("Blackhead Vacuum", "Beauty", "beauty", 7, 15, 4, 7, 34, 69, "60-75%", 8, "https://www.aliexpress.us/w/wholesale-blackhead-remover-vacuum.html", "Satisfying pore cleaning demo", "Draft", 132),
  makeProduct("Eye Patches", "Beauty", "beauty", 2, 6, 2, 5, 19, 39, "70-85%", 9, "https://www.aliexpress.us/w/wholesale-eye-patches.html", "Morning glow-up routine", "Active", 475),
  makeProduct("Dog Water Bottle", "Pets", "pets", 3, 8, 3, 6, 19, 39, "70-85%", 1, "https://www.aliexpress.us/w/wholesale-dog-water-bottle.html", "Every dog owner needs this", "Active", 392),
  makeProduct("Calming Dog Bed", "Pets", "pets", 12, 25, 8, 20, 49, 99, "55-70%", 2, "https://www.aliexpress.us/w/wholesale-calming-dog-bed.html", "Help anxious pets relax", "Active", 88),
  makeProduct("Pet Hair Remover Roller", "Pets", "pets", 2, 6, 3, 6, 19, 34, "70-85%", 3, "https://www.aliexpress.us/w/wholesale-pet-hair-remover.html", "Remove fur instantly", "Active", 305),
  makeProduct("Automatic Pet Feeder", "Pets", "pets", 20, 45, 10, 20, 79, 149, "50-65%", 4, "https://www.aliexpress.us/w/wholesale-automatic-pet-feeder.html", "Feed pets automatically", "Review", 61),
  makeProduct("Dog Seat Cover", "Pets", "pets", 8, 18, 6, 12, 39, 79, "60-75%", 5, "https://www.aliexpress.us/w/wholesale-dog-car-seat-cover.html", "Keep car clean with dogs", "Active", 144),
  makeProduct("LED Dog Collar", "Pets", "pets", 2, 5, 2, 4, 14, 29, "75-85%", 6, "https://www.aliexpress.us/w/wholesale-led-dog-collar.html", "Night walk safety", "Draft", 520),
  makeProduct("Lick Mat", "Pets", "pets", 2, 6, 3, 5, 19, 34, "70-85%", 7, "https://www.aliexpress.us/w/wholesale-dog-lick-mat.html", "Calm dogs with enrichment", "Active", 274),
  makeProduct("Cat Laser Toy", "Pets", "pets", 2, 7, 3, 5, 19, 39, "70-85%", 8, "https://www.aliexpress.us/w/wholesale-cat-laser-toy.html", "Keep cats entertained", "Review", 219),
  makeProduct("Dog Paw Cleaner", "Pets", "pets", 3, 8, 3, 6, 19, 39, "70-85%", 9, "https://www.aliexpress.us/w/wholesale-dog-paw-cleaner.html", "Stop muddy paw prints", "Active", 333),
];

const navItems = [
  ["Dashboard", LayoutDashboard],
  ["Products", Package],
  ["Imports", Import],
  ["Orders", ClipboardList],
  ["Customers", Users],
  ["Funnels", Mail],
  ["Analytics", BarChart3],
  ["AI Studio", Bot],
  ["Settings", Settings],
] as const;

function makeProduct(
  name: string,
  niche: string,
  subdomain: Niche,
  costMin: number,
  costMax: number,
  shippingMin: number,
  shippingMax: number,
  retailMin: number,
  retailMax: number,
  marginEst: string,
  priority: number,
  aliexpressSearchUrl: string,
  contentAngle: string,
  status: ProductStatus,
  inventory: number,
): Product {
  return {
    id: slugify(name),
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
    priority,
    aliexpressSearchUrl,
    contentAngle,
    status,
    inventory,
  };
}

function App() {
  const [products, setProducts] = React.useState<Product[]>(() => loadProducts());
  const [orders, setOrders] = React.useState<Order[]>(() => loadOrders());
  const [view, setView] = React.useState(() => (window.location.hash === "#storefront" ? "storefront" : "admin"));
  const [activeNiche, setActiveNiche] = React.useState<"all" | Niche>("all");
  const [query, setQuery] = React.useState("");
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("Catalog loaded from local admin storage.");
  const [medusaConnection, setMedusaConnection] = React.useState<MedusaConnection>(() => loadMedusaConnection());
  const [medusaStatus, setMedusaStatus] = React.useState<"Not connected" | "Connected" | "Unavailable">("Not connected");
  const [isSyncingMedusa, setIsSyncingMedusa] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem(orderStorageKey, JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    const syncViewFromHash = () => {
      setView(window.location.hash === "#storefront" ? "storefront" : "admin");
    };
    window.addEventListener("hashchange", syncViewFromHash);
    syncViewFromHash();
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(medusaConfigKey, JSON.stringify(medusaConnection));
  }, [medusaConnection]);

  const filteredProducts = products.filter((product) => {
    const matchesNiche = activeNiche === "all" || product.subdomain === activeNiche;
    const matchesQuery = [product.name, product.niche, product.status, product.contentAngle]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesNiche && matchesQuery;
  });

  const activeCount = products.filter((product) => product.status === "Active").length;
  const reviewCount = products.filter((product) => product.status === "Review").length;
  const averageProfit =
    products.reduce((total, product) => total + product.retailMin - product.costMax - product.shippingMax, 0) /
    Math.max(products.length, 1);
  const totalInventory = products.reduce((total, product) => total + product.inventory, 0);

  const saveProduct = (form: ProductForm) => {
    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id ? { ...form, id: editingProduct.id } : product,
        ),
      );
      setNotice(`${form.name} updated.`);
    } else {
      const id = uniqueId(slugify(form.name), products);
      setProducts((current) => [{ ...form, id }, ...current]);
      setNotice(`${form.name} added.`);
    }
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const updateStatus = (id: string, status: ProductStatus) => {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, status } : product)));
    setNotice("Product status updated.");
  };

  const deleteProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    setProducts((current) => current.filter((item) => item.id !== id));
    setNotice(product ? `${product.name} deleted.` : "Product deleted.");
  };

  const resetCatalog = () => {
    setProducts(seedProducts);
    setNotice("Catalog reset to the starter seed products.");
  };

  const importCsv = async (file: File) => {
    const imported = parseSeedCsv(await file.text(), products);
    if (imported.length === 0) {
      setNotice("No valid products found in that CSV.");
      return;
    }
    setProducts((current) => mergeProducts(current, imported));
    setNotice(`${imported.length} products imported from ${file.name}.`);
  };

  const exportCsv = () => {
    downloadCsv(products);
    setNotice(`${products.length} products exported.`);
  };

  const placeOrder = (order: Omit<Order, "id" | "createdAt" | "status">) => {
    const savedOrder: Order = {
      ...order,
      id: `P4TP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: "Ready to fulfill",
    };
    setOrders((current) => [savedOrder, ...current]);
    return savedOrder.id;
  };

  const testBackend = async () => {
    try {
      await testMedusaConnection(medusaConnection);
      setMedusaStatus("Connected");
      setNotice(`Medusa is reachable at ${medusaConnection.baseUrl}.`);
    } catch (error) {
      setMedusaStatus("Unavailable");
      setNotice(error instanceof Error ? error.message : "Medusa backend is unavailable.");
    }
  };

  const syncFromMedusa = async () => {
    setIsSyncingMedusa(true);
    try {
      const response = await listMedusaProducts(medusaConnection);
      const imported = response.products.map(mapMedusaProduct);
      setProducts((current) => mergeProducts(current, imported));
      setMedusaStatus("Connected");
      setNotice(`${imported.length} Medusa products synced into this admin catalog.`);
    } catch (error) {
      setMedusaStatus("Unavailable");
      setNotice(
        error instanceof Error
          ? `Medusa sync failed: ${error.message}`
          : "Medusa sync failed. Check backend URL, CORS, and admin authentication.",
      );
    } finally {
      setIsSyncingMedusa(false);
    }
  };

  if (view === "storefront") {
    return (
      <Storefront
        products={products.filter((product) => product.status === "Active")}
        onBackToAdmin={() => {
          window.location.hash = "#dashboard";
          setView("admin");
        }}
        onPlaceOrder={placeOrder}
      />
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Products4ThePeople admin">
          <Store size={24} />
          <span>P4tP Admin</span>
        </a>
        <nav aria-label="Admin navigation">
          {navItems.map(([label, Icon], index) => (
            <a className={index === 0 ? "active" : ""} href={`#${label.toLowerCase().replace(" ", "-")}`} key={label}>
              <Icon size={18} />
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-card">
          <Globe2 size={18} />
          <strong>Local admin mode</strong>
          <span>Catalog changes persist in this browser until the Medusa backend is connected.</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Products4ThePeople.com</p>
            <h1>Commerce Command Center</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={() => {
              window.location.hash = "#storefront";
              setView("storefront");
            }}>
              <ShoppingBag size={17} />
              View storefront
            </button>
            <button type="button" onClick={resetCatalog}>
              <RotateCcw size={17} />
              Reset seed
            </button>
            <button type="button" onClick={exportCsv}>
              <Download size={17} />
              Export
            </button>
            <button
              className="primary"
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={17} />
              Add product
            </button>
          </div>
        </header>

        <div className="notice" role="status">
          {notice}
        </div>

        <section className="metrics-grid" id="dashboard">
          <Metric icon={Package} label="Products" value={products.length.toString()} trend={`${filteredProducts.length} visible`} />
          <Metric icon={CheckCircle2} label="Active listings" value={activeCount.toString()} trend={`${reviewCount} in review`} />
          <Metric icon={CircleDollarSign} label="Avg. min profit" value={money(averageProfit)} trend="Before ad spend" />
          <Metric icon={Database} label="Inventory units" value={totalInventory.toLocaleString()} trend="Shared pool" />
        </section>

        <section className="medusa-strip" id="medusa">
          <div>
            <p>Medusa backend</p>
            <h2>{medusaStatus}</h2>
          </div>
          <label>
            <span>Backend URL</span>
            <input
              value={medusaConnection.baseUrl}
              onChange={(event) => setMedusaConnection((current) => ({ ...current, baseUrl: event.target.value }))}
            />
          </label>
          <label>
            <span>Admin API key</span>
            <input
              value={medusaConnection.apiKey}
              onChange={(event) => setMedusaConnection((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder="Optional until backend is running"
            />
          </label>
          <button type="button" onClick={testBackend}>
            Test
          </button>
          <button className="primary" type="button" onClick={syncFromMedusa} disabled={isSyncingMedusa}>
            {isSyncingMedusa ? "Syncing" : "Sync products"}
          </button>
        </section>

        <section className="panel-grid">
          <article className="panel wide" id="products">
            <div className="panel-header">
              <div>
                <p>Product manager</p>
                <h2>Shared catalog</h2>
              </div>
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search catalog"
                  />
                </label>
                <input
                  accept=".csv,text/csv"
                  className="hidden-input"
                  ref={importInputRef}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importCsv(file);
                    event.currentTarget.value = "";
                  }}
                />
                <button type="button" onClick={() => importInputRef.current?.click()}>
                  <FileUp size={17} />
                  Import CSV
                </button>
              </div>
            </div>

            <div className="segmented" aria-label="Storefront filter">
              {[
                ["all", "All niches"],
                ["beauty", "Beauty"],
                ["pets", "Pets"],
                ["home", "Home"],
                ["fitness", "Fitness"],
              ].map(([value, label]) => (
                <button
                  className={activeNiche === value ? "active" : ""}
                  key={value}
                  onClick={() => setActiveNiche(value as "all" | Niche)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Niche</th>
                    <th>Status</th>
                    <th>Retail</th>
                    <th>Landed</th>
                    <th>Margin</th>
                    <th>Inventory</th>
                    <th>Hook</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <span>Priority {product.priority}</span>
                      </td>
                      <td>{product.niche}</td>
                      <td>
                        <select
                          className={`status-select ${product.status.toLowerCase()}`}
                          value={product.status}
                          onChange={(event) => updateStatus(product.id, event.target.value as ProductStatus)}
                        >
                          <option>Active</option>
                          <option>Review</option>
                          <option>Draft</option>
                        </select>
                      </td>
                      <td>
                        {money(product.retailMin)}-{money(product.retailMax)}
                      </td>
                      <td>
                        {money(product.costMin + product.shippingMin)}-{money(product.costMax + product.shippingMax)}
                      </td>
                      <td>{product.marginEst}</td>
                      <td>{product.inventory}</td>
                      <td className="hook">{product.contentAngle}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsFormOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button className="danger-button" type="button" onClick={() => deleteProduct(product.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel" id="imports">
            <div className="panel-header">
              <div>
                <p>Import tools</p>
                <h2>Product intake</h2>
              </div>
              <FileUp size={22} />
            </div>
            <div className="import-stack">
              <ActionRow icon={FileUp} title="CSV import" detail="Upload Seed.csv-shaped product lists into the catalog." />
              <ActionRow icon={Globe2} title="AliExpress URL import" detail="Placeholder for scraper/API enrichment in the backend phase." />
              <ActionRow icon={Sparkles} title="Manual + AI entry" detail="Manual entry works now; AI content generation comes next." />
            </div>
            <button className="primary full" type="button" onClick={() => importInputRef.current?.click()}>
              Start CSV import
            </button>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Storefront routing</p>
                <h2>Subdomains</h2>
              </div>
              <Globe2 size={20} />
            </div>
            <div className="domain-list">
              <DomainRow name="beauty.products4thepeople.com" count={countByNiche(products, "beauty")} status="Phase 1" />
              <DomainRow name="pets.products4thepeople.com" count={countByNiche(products, "pets")} status="Phase 2" />
              <DomainRow name="home.products4thepeople.com" count={countByNiche(products, "home")} status="Ready" />
              <DomainRow name="fitness.products4thepeople.com" count={countByNiche(products, "fitness")} status="Ready" />
            </div>
          </article>

          <article className="panel" id="orders">
            <div className="panel-header">
              <div>
                <p>Orders</p>
                <h2>Shared queue</h2>
              </div>
              <ShoppingCart size={22} />
            </div>
            <div className="queue-list">
              <QueueRow label="Total orders" value={orders.length.toString()} />
              <QueueRow label="Ready to fulfill" value={orders.filter((order) => order.status === "Ready to fulfill").length.toString()} />
              <QueueRow label="Needs review" value="0" />
              <QueueRow label="Revenue captured" value={money(orders.reduce((total, order) => total + order.subtotal, 0))} />
            </div>
          </article>

          <article className="panel" id="funnels">
            <div className="panel-header">
              <div>
                <p>Funnels</p>
                <h2>Capture flows</h2>
              </div>
              <Mail size={22} />
            </div>
            <div className="flow">
              {["Landing", "Email capture", "Product page", "Cart upsell", "Checkout", "Post-purchase"].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </article>

          <article className="panel" id="analytics">
            <div className="panel-header">
              <div>
                <p>Analytics</p>
                <h2>Launch KPIs</h2>
              </div>
              <LineChart size={22} />
            </div>
            <div className="analytics-bars" aria-label="Launch KPI chart">
              <span style={{ height: "58%" }} />
              <span style={{ height: "74%" }} />
              <span style={{ height: "46%" }} />
              <span style={{ height: "88%" }} />
              <span style={{ height: "64%" }} />
              <span style={{ height: "80%" }} />
            </div>
            <div className="integration-row">
              <span>TikTok Pixel</span>
              <span>Meta Pixel</span>
              <span>GA4</span>
              <span>Pinterest</span>
            </div>
          </article>

          <article className="panel" id="ai-studio">
            <div className="panel-header">
              <div>
                <p>AI Studio</p>
                <h2>Content ops</h2>
              </div>
              <Bot size={22} />
            </div>
            <div className="import-stack">
              <ActionRow icon={Activity} title="Creative hooks" detail="Generate 3-8 short-form ideas per niche daily." />
              <ActionRow icon={Mail} title="Email flows" detail="Welcome, abandon cart, post-purchase, and winback." />
              <ActionRow icon={CreditCard} title="Offer tests" detail="Discounts, bundles, BOGO, and free-shipping thresholds." />
            </div>
          </article>

          <article className="panel" id="settings">
            <div className="panel-header">
              <div>
                <p>Platform readiness</p>
                <h2>Core systems</h2>
              </div>
              <Settings size={22} />
            </div>
            <div className="readiness-grid">
              <span><Database size={16} /> Medusa SDK installed</span>
              <span><Truck size={16} /> Inventory fields</span>
              <span><CreditCard size={16} /> Stripe checkout next</span>
              <span><Home size={16} /> PostgreSQL required</span>
            </div>
          </article>
        </section>
      </section>

      {isFormOpen && (
        <ProductDialog
          product={editingProduct}
          onCancel={() => {
            setEditingProduct(null);
            setIsFormOpen(false);
          }}
          onSave={saveProduct}
        />
      )}
    </main>
  );
}

function ProductDialog({
  product,
  onCancel,
  onSave,
}: {
  product: Product | null;
  onCancel: () => void;
  onSave: (product: ProductForm) => void;
}) {
  const [form, setForm] = React.useState<ProductForm>(() =>
    product
      ? toForm(product)
      : {
          name: "",
          niche: "Beauty",
          subdomain: "beauty",
          costMin: 1,
          costMax: 5,
          shippingMin: 2,
          shippingMax: 5,
          retailMin: 19,
          retailMax: 39,
          marginEst: "70-85%",
          priority: 1,
          aliexpressSearchUrl: "",
          contentAngle: "",
          status: "Draft",
          inventory: 0,
        },
  );

  const setField = <Key extends keyof ProductForm>(key: Key, value: ProductForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.name.trim()) onSave({ ...form, name: form.name.trim() });
        }}
      >
        <div className="modal-header">
          <div>
            <p>Product manager</p>
            <h2>{product ? "Edit product" : "Add product"}</h2>
          </div>
          <button type="button" onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="form-grid">
          <Field label="Name">
            <input value={form.name} onChange={(event) => setField("name", event.target.value)} required />
          </Field>
          <Field label="Niche">
            <input value={form.niche} onChange={(event) => setField("niche", event.target.value)} required />
          </Field>
          <Field label="Subdomain">
            <select value={form.subdomain} onChange={(event) => setField("subdomain", event.target.value as Niche)}>
              <option value="beauty">beauty</option>
              <option value="pets">pets</option>
              <option value="home">home</option>
              <option value="fitness">fitness</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setField("status", event.target.value as ProductStatus)}>
              <option>Active</option>
              <option>Review</option>
              <option>Draft</option>
            </select>
          </Field>
          <NumberField label="Cost min" value={form.costMin} onChange={(value) => setField("costMin", value)} />
          <NumberField label="Cost max" value={form.costMax} onChange={(value) => setField("costMax", value)} />
          <NumberField label="Shipping min" value={form.shippingMin} onChange={(value) => setField("shippingMin", value)} />
          <NumberField label="Shipping max" value={form.shippingMax} onChange={(value) => setField("shippingMax", value)} />
          <NumberField label="Retail min" value={form.retailMin} onChange={(value) => setField("retailMin", value)} />
          <NumberField label="Retail max" value={form.retailMax} onChange={(value) => setField("retailMax", value)} />
          <NumberField label="Priority" value={form.priority} onChange={(value) => setField("priority", value)} />
          <NumberField label="Inventory" value={form.inventory} onChange={(value) => setField("inventory", value)} />
          <Field label="Margin estimate">
            <input value={form.marginEst} onChange={(event) => setField("marginEst", event.target.value)} />
          </Field>
          <Field label="AliExpress URL">
            <input value={form.aliexpressSearchUrl} onChange={(event) => setField("aliexpressSearchUrl", event.target.value)} />
          </Field>
          <Field label="Content angle" wide>
            <textarea value={form.contentAngle} onChange={(event) => setField("contentAngle", event.target.value)} />
          </Field>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save product
          </button>
        </div>
      </form>
    </div>
  );
}

function Storefront({
  products,
  onBackToAdmin,
  onPlaceOrder,
}: {
  products: Product[];
  onBackToAdmin: () => void;
  onPlaceOrder: (order: Omit<Order, "id" | "createdAt" | "status">) => string;
}) {
  const [activeNiche, setActiveNiche] = React.useState<StorefrontMode>("general");
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [email, setEmail] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const config = storefrontNiches[activeNiche];

  const visibleProducts = products.filter((product) => activeNiche === "general" || product.subdomain === activeNiche);
  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);
      return product ? { product, quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => Boolean(item));
  const subtotal = cartItems.reduce((total, item) => total + item.product.retailMin * item.quantity, 0);
  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 7;
  const total = subtotal + shipping;

  const addToCart = (productId: string) => {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  };

  const setQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  };

  const submitOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartItems.length === 0) return;
    const orderId = onPlaceOrder({
      customerName,
      email,
      address,
      subtotal: total,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.retailMin,
      })),
    });
    setConfirmation(`Order ${orderId} received.`);
    setCart({});
    setCustomerName("");
    setEmail("");
    setAddress("");
  };

  return (
    <main
      className={`storefront storefront-${activeNiche}`}
      style={
        {
          "--store-accent": config.accent,
          "--store-soft": config.soft,
          "--store-hero": `linear-gradient(90deg, rgba(17, 25, 29, 0.8), rgba(17, 25, 29, 0.18)), url(${config.heroImage})`,
        } as React.CSSProperties
      }
    >
      <header className="storefront-header">
        <button className="storefront-brand" type="button" onClick={() => setActiveNiche("general")}>
          <Store size={24} />
          <span>{config.host}</span>
        </button>
        <nav aria-label="Storefront navigation">
          <a href="#shop">Shop</a>
          <a href="#checkout">Checkout</a>
          <details className="more-shops">
            <summary>More Shops</summary>
            <div>
              <button type="button" onClick={() => setActiveNiche("general")}>
                General Store
              </button>
              {(["beauty", "pets", "home", "fitness"] as const).map((niche) => (
                <button key={niche} type="button" onClick={() => setActiveNiche(niche)}>
                  {storefrontNiches[niche].label}
                </button>
              ))}
              <button type="button" onClick={onBackToAdmin}>
                Admin
              </button>
            </div>
          </details>
        </nav>
      </header>

      <section className="store-hero">
        <div>
          <p>{config.eyebrow}</p>
          <h1>{config.headline}</h1>
          <span>{config.offer}</span>
        </div>
      </section>

      {confirmation && <div className="store-notice">{confirmation}</div>}

      <section className="store-layout" id="shop">
        <div>
          <div className="store-section-head">
            <div>
              <p>{config.host}</p>
              <h2>{config.label} products</h2>
            </div>
          </div>

          <div className="shop-grid">
            {visibleProducts.length === 0 ? (
              <div className="empty-store">
                <Package size={36} />
                <h3>{config.label} catalog is ready for products.</h3>
                <p>Add active products to this niche in the admin catalog and they will appear here.</p>
              </div>
            ) : visibleProducts.map((product) => (
              <article className="shop-card" key={product.id}>
                <div className="product-image" aria-hidden="true">
                  <Package size={42} />
                </div>
                <div className="shop-card-body">
                  <span>{product.niche}</span>
                  <h3>{product.name}</h3>
                  <p>{product.contentAngle || "Customer-ready product from the active catalog."}</p>
                  <div className="shop-price">
                    <strong>{money(product.retailMin)}</strong>
                    <small>{product.inventory} in stock</small>
                  </div>
                  <div className="shop-actions">
                    <button type="button" onClick={() => setSelectedProduct(product)}>
                      Quick view
                    </button>
                    <button className="primary" type="button" onClick={() => addToCart(product.id)}>
                      <ShoppingCart size={17} />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="checkout-panel" id="checkout">
          <div className="panel-header">
            <div>
              <p>Checkout</p>
              <h2>Cart</h2>
            </div>
            <ShoppingCart size={22} />
          </div>

          <div className="cart-lines">
            {cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              cartItems.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{money(product.retailMin)} each</span>
                  </div>
                  <input
                    aria-label={`${product.name} quantity`}
                    min="0"
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(product.id, Number(event.target.value))}
                  />
                </div>
              ))
            )}
          </div>

          <div className="totals">
            <span>Subtotal <strong>{money(subtotal)}</strong></span>
            <span>Shipping <strong>{shipping === 0 ? "Free" : money(shipping)}</strong></span>
            <span>Total <strong>{money(total)}</strong></span>
          </div>

          <form className="checkout-form" onSubmit={submitOrder}>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" required />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Shipping address" required />
            <button className="primary full" type="submit" disabled={cartItems.length === 0}>
              Place order
            </button>
          </form>
        </aside>
      </section>

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {
            addToCart(selectedProduct.id);
            setConfirmation(`${selectedProduct.name} added to cart.`);
          }}
        />
      )}
    </main>
  );
}

function ProductQuickView({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}) {
  const landedMax = product.costMax + product.shippingMax;
  const profit = product.retailMin - landedMax;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="store-product-modal" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <div className="quick-view-media" aria-hidden="true">
          <Package size={58} />
        </div>
        <div className="quick-view-copy">
          <div className="modal-header">
            <div>
              <p>{product.niche}</p>
              <h2 id="quick-view-title">{product.name}</h2>
            </div>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <p className="quick-view-lede">
            {product.contentAngle || "A customer-ready product from the Products4ThePeople catalog."}
          </p>

          <div className="quick-view-stats">
            <span>
              Price <strong>{money(product.retailMin)}</strong>
            </span>
            <span>
              Stock <strong>{product.inventory}</strong>
            </span>
            <span>
              Margin <strong>{product.marginEst}</strong>
            </span>
            <span>
              Min profit <strong>{money(profit)}</strong>
            </span>
          </div>

          <div className="quick-view-notes">
            <span>Subdomain: {product.subdomain}.products4thepeople.com</span>
            <span>Launch priority: {product.priority}</span>
          </div>

          <div className="quick-view-actions">
            {product.aliexpressSearchUrl && (
              <a href={product.aliexpressSearchUrl} target="_blank" rel="noreferrer">
                Source product
              </a>
            )}
            <button className="primary" type="button" onClick={onAddToCart}>
              <ShoppingCart size={17} />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <article className="metric-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

function ActionRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="action-row">
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function DomainRow({ name, count, status }: { name: string; count: number; status: string }) {
  return (
    <div className="domain-row">
      <div>
        <strong>{name}</strong>
        <span>{count} assigned products</span>
      </div>
      <small>{status}</small>
    </div>
  );
}

function QueueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="queue-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "field wide-field" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}

function loadProducts() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return seedProducts;
    const parsed = JSON.parse(stored) as Product[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedProducts;
  } catch {
    return seedProducts;
  }
}

function loadOrders() {
  try {
    const stored = localStorage.getItem(orderStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadMedusaConnection(): MedusaConnection {
  try {
    const stored = localStorage.getItem(medusaConfigKey);
    if (stored) return { baseUrl: "http://localhost:9000", apiKey: "", ...JSON.parse(stored) };
  } catch {
    return { baseUrl: "http://localhost:9000", apiKey: "" };
  }

  return {
    baseUrl: import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000",
    apiKey: import.meta.env.VITE_MEDUSA_ADMIN_API_KEY || "",
  };
}

function toForm(product: Product): ProductForm {
  const { id: _id, ...form } = product;
  return form;
}

function countByNiche(products: Product[], niche: Niche) {
  return products.filter((product) => product.subdomain === niche).length;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueId(base: string, products: Product[]) {
  let id = base || "product";
  let index = 2;
  while (products.some((product) => product.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function parseSeedCsv(csv: string, existingProducts: Product[]) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  if (!headerLine) return [];
  const headers = parseCsvLine(headerLine).map((header) => header.trim());

  return lines
    .map((line) => parseCsvLine(line))
    .filter((cells) => cells.some(Boolean))
    .map((cells, index) => {
      const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""]));
      const name = value(row.name);
      const niche = value(row.niche || row.category) || "General";
      const subdomain = normalizeSubdomain(value(row.subdomain) || niche);
      const product = makeProduct(
        name,
        titleCase(niche),
        subdomain,
        numeric(row.cost_min || row.cost, 0),
        numeric(row.cost_max || row.cost, 0),
        numeric(row.shipping_min || row.shipping_cost, 0),
        numeric(row.shipping_max || row.shipping_cost, 0),
        numeric(row.retail_min || row.retail_price, 0),
        numeric(row.retail_max || row.retail_price, 0),
        value(row.margin_est) || "TBD",
        numeric(row.priority, index + 1),
        value(row.aliexpress_search_url),
        value(row.content_angle || row.description),
        "Draft",
        0,
      );
      return { ...product, id: uniqueId(product.id, existingProducts) };
    })
    .filter((product) => product.name);
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function mergeProducts(current: Product[], imported: Product[]) {
  const byId = new Map(current.map((product) => [product.medusaId || product.id, product]));
  imported.forEach((product) => byId.set(product.medusaId || product.id, product));
  return Array.from(byId.values());
}

function mapMedusaProduct(product: MedusaProduct): Product {
  const metadata = product.metadata || {};
  const firstVariant = product.variants?.[0];
  const firstPrice = firstVariant?.prices?.[0]?.amount;
  const retail = typeof firstPrice === "number" && firstPrice > 0 ? firstPrice / 100 : 0;
  const subdomain = normalizeSubdomain(value(metadata.subdomain || metadata.niche || product.subtitle || "beauty"));

  return {
    id: `medusa-${product.id}`,
    medusaId: product.id,
    name: product.title,
    niche: titleCase(value(metadata.niche || subdomain)),
    subdomain,
    costMin: numeric(metadata.cost_min, 0),
    costMax: numeric(metadata.cost_max, 0),
    shippingMin: numeric(metadata.shipping_min, 0),
    shippingMax: numeric(metadata.shipping_max, 0),
    retailMin: retail,
    retailMax: retail,
    marginEst: value(metadata.margin_est) || "Medusa",
    priority: numeric(metadata.priority, 99),
    aliexpressSearchUrl: value(metadata.aliexpress_search_url),
    contentAngle: value(metadata.content_angle || product.description || product.subtitle),
    status: normalizeStatus(product.status),
    inventory: Number(firstVariant?.inventory_quantity ?? 0),
    source: "medusa",
  };
}

function normalizeStatus(status: unknown): ProductStatus {
  const normalized = value(status).toLowerCase();
  if (normalized === "published") return "Active";
  if (normalized === "proposed") return "Review";
  return "Draft";
}

function downloadCsv(products: Product[]) {
  const headers = [
    "name",
    "niche",
    "subdomain",
    "cost_min",
    "cost_max",
    "shipping_min",
    "shipping_max",
    "retail_min",
    "retail_max",
    "margin_est",
    "priority",
    "aliexpress_search_url",
    "content_angle",
    "status",
    "inventory",
  ];
  const rows = products.map((product) =>
    [
      product.name,
      product.niche,
      product.subdomain,
      product.costMin,
      product.costMax,
      product.shippingMin,
      product.shippingMax,
      product.retailMin,
      product.retailMax,
      product.marginEst,
      product.priority,
      product.aliexpressSearchUrl,
      product.contentAngle,
      product.status,
      product.inventory,
    ].map(escapeCsv),
  );
  const blob = new Blob([[headers.join(","), ...rows.map((row) => row.join(","))].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products4thepeople-products.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function numeric(valueToParse: unknown, fallback: number) {
  const parsed = Number(value(valueToParse));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function value(valueToRead: unknown) {
  return String(valueToRead ?? "").trim();
}

function normalizeSubdomain(valueToNormalize: string): Niche {
  const normalized = slugify(valueToNormalize);
  if (normalized.includes("pet")) return "pets";
  if (normalized.includes("home")) return "home";
  if (normalized.includes("fit")) return "fitness";
  return "beauty";
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

createRoot(document.getElementById("root")!).render(<App />);
