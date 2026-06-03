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
  Heart,
  Home,
  Import,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Mail,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import {
  listMedusaOrders,
  listMedusaProducts,
  testMedusaConnection,
  type MedusaConnection,
  type MedusaOrder,
  type MedusaProduct,
} from "./lib/medusa";
import {
  createOrder,
  getOrders,
  getProducts,
  removeProduct,
  replaceProducts,
  saveProduct as saveApiProduct,
  saveProducts,
  saveOrders,
  testApi,
  updateOrderStatus as updateApiOrderStatus,
  updateProductStatus,
  importAliexpress,
  getContacts,
  type ApiOrder,
} from "./lib/api";
import "./styles.css";

type Niche = "beauty" | "pets" | "home" | "fitness" | "automotive";
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
  images?: string[];
  seoTitle?: string;
  seoDescription?: string;
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
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: "paid" | "unpaid" | "pending" | "failed";
  stripeSessionId?: string;
  status: "Ready to fulfill" | "Needs review";
  createdAt: string;
  source?: "local" | "medusa";
};

type OrderDraft = Omit<Order, "id" | "createdAt" | "status">;

type StorefrontMode = "general" | Niche;

type MarketingLead = {
  id: string;
  email: string;
  name: string;
  source: "popup" | "inline" | "checkout";
  niche: StorefrontMode;
  createdAt: string;
  phone?: string;
  wantsSms?: boolean;
};

type AbandonedCart = {
  id: string;
  email: string;
  name: string;
  niche: StorefrontMode;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  status: "Open" | "Recovered";
  updatedAt: string;
};

type StorefrontNicheConfig = {
  label: string;
  host: string;
  eyebrow: string;
  headline: string;
  offer: string;
  proof: string;
  accent: string;
  soft: string;
  heroImage: string;
  // Brand Design System config
  positioning: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  accentFont?: string;
  collections: string[];
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  secondaryCtaText?: string;
};

const medusaConfigKey = "p4tp-medusa-connection";
const adminSessionKey = "p4tp-admin-session";
const pendingCheckoutKey = "p4tp-pending-checkout";
const leadStorageKey = "p4tp-marketing-leads";
const abandonedCartStorageKey = "p4tp-abandoned-carts";
const emailPopupDismissedKey = "p4tp-email-popup-dismissed";
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@products4thepeople.com";
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "change-this-password";

const marketingConfig = {
  ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || "",
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || "",
  tikTokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID || "",
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    ttq?: {
      load?: (pixelId: string) => void;
      page?: () => void;
      track?: (eventName: string, params?: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
  }
}

const storefrontNiches: Record<StorefrontMode, StorefrontNicheConfig> = {
  general: {
    label: "General Store",
    host: "products4thepeople.com",
    eyebrow: "Products for everyday people",
    headline: "Practical products people actually use, tested niche by niche.",
    offer: "Free shipping over $25 across the whole store",
    proof: "Beauty and pet best-sellers are ready now. Home and fitness collections are queued for launch testing.",
    accent: "#2563EB",
    soft: "#EFF6FF",
    heroImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    positioning: "Discover Products That Make Life Better",
    primaryColor: "#0F172A",
    secondaryColor: "#2563EB",
    accentColor: "#2563EB",
    backgroundColor: "#F8FAFC",
    textColor: "#111827",
    headingFont: "Manrope",
    bodyFont: "Inter",
    accentFont: "Space Grotesk",
    collections: ["Beauty", "Pets", "Home Optimization", "Fitness Gear", "Automotive"],
    heroHeadline: "Discover Products That Make Life Better",
    heroSubheadline: "We've done the research so you don't have to.",
    ctaText: "Explore Categories",
    secondaryCtaText: "Shop Best Sellers",
  },
  beauty: {
    label: "GlowTheory",
    host: "beauty.products4thepeople.com",
    eyebrow: "At-home glow-up tools",
    headline: "Beauty tools for quick routines, calmer mornings, and camera-ready skin.",
    offer: "Free shipping over $25 on beauty bundles",
    proof: "Focused on low-lift tools customers can understand in seconds and use the same day they arrive.",
    accent: "#D87A9D",
    soft: "#FFF9F8",
    heroImage:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    positioning: "Science-Backed Beauty & Self-Care",
    primaryColor: "#F5D7DF",
    secondaryColor: "#E8B4C2",
    accentColor: "#D87A9D",
    backgroundColor: "#FFF9F8",
    textColor: "#1A1A1A",
    headingFont: "Playfair Display",
    bodyFont: "Poppins",
    collections: ["LED Beauty Devices", "Anti-Aging", "Hair Care", "Facial Sculpting", "Self-Care Essentials", "Beauty Bundles"],
    heroHeadline: "Reveal Your Best Self",
    heroSubheadline: "Science-backed beauty tools designed to help you look refreshed, confident, and radiant from home.",
    ctaText: "Shop Collection",
    secondaryCtaText: "View Bundles",
  },
  pets: {
    label: "Wagwell",
    host: "pets.products4thepeople.com",
    eyebrow: "Everyday pet problem solvers",
    headline: "Pet gear that keeps walks, rides, meals, and cleanups easier.",
    offer: "Free shipping over $25 on pet essentials",
    proof: "Built around daily pet-owner pain points: fur, mud, anxiety, feeding, safety, and car mess.",
    accent: "#4CAF50",
    soft: "#FFF8F0",
    heroImage:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
    positioning: "Happier Pets. Easier Lives.",
    primaryColor: "#4CAF50",
    secondaryColor: "#A8D5A2",
    accentColor: "#F7A531",
    backgroundColor: "#FFF8F0",
    textColor: "#1A1A1A",
    headingFont: "Poppins",
    bodyFont: "Poppins",
    collections: ["Travel & Adventure", "Feeding Essentials", "Grooming", "Comfort & Sleep", "Toys & Enrichment", "Pet Wellness"],
    heroHeadline: "Because Every Tail Deserves To Wag",
    heroSubheadline: "Practical products that help pets stay happy and owners stress less.",
    ctaText: "Explore Gear",
    secondaryCtaText: "View Wellness",
  },
  home: {
    label: "NestTheory",
    host: "home.products4thepeople.com",
    eyebrow: "Home upgrades",
    headline: "Small home upgrades with everyday utility and easy gift appeal.",
    offer: "Home storefront ready for product testing",
    proof: "This niche is staged for the next product wave once active home listings are approved.",
    accent: "#8B7355",
    soft: "#F9F7F2",
    heroImage:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
    positioning: "Simplify Every Room",
    primaryColor: "#ECE7E0",
    secondaryColor: "#D8C9B2",
    accentColor: "#8B7355",
    backgroundColor: "#F9F7F2",
    textColor: "#1F1F1F",
    headingFont: "Poppins",
    bodyFont: "Poppins",
    collections: ["Kitchen Organization", "Closet Solutions", "Bathroom Storage", "Workspace Setup", "Entryway Essentials", "Space Saving Products"],
    heroHeadline: "Less Clutter. More Calm.",
    heroSubheadline: "Smart storage and organization products for a cleaner, more intentional home.",
    ctaText: "Organize Now",
    secondaryCtaText: "View Solutions",
  },
  fitness: {
    label: "RecoverLab",
    host: "fitness.products4thepeople.com",
    eyebrow: "Fitness helpers",
    headline: "Fitness helpers for stretching, recovery, hydration, and home workouts.",
    offer: "Fitness storefront ready for product testing",
    proof: "This niche is staged for the next product wave once active fitness listings are approved.",
    accent: "#2563EB",
    soft: "#111827",
    heroImage:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
    positioning: "Recover Faster. Perform Better.",
    primaryColor: "#0D1117",
    secondaryColor: "#111827",
    accentColor: "#2563EB",
    backgroundColor: "#0D1117",
    textColor: "#FFFFFF",
    headingFont: "Oswald",
    bodyFont: "Inter",
    collections: ["Massage Recovery", "Cold Therapy", "Mobility", "Compression", "Sleep Optimization", "Recovery Bundles"],
    heroHeadline: "Train Hard. Recover Smarter.",
    heroSubheadline: "Recovery tools trusted by athletes, lifters, runners, and everyday performers.",
    ctaText: "Start Recovery",
    secondaryCtaText: "View Bundles",
  },
  automotive: {
    label: "DriveCraft",
    host: "automotive.products4thepeople.com",
    eyebrow: "Professional Detailing",
    headline: "Your Vehicle. Showroom Ready.",
    offer: "Free shipping over $50 on detailing kits",
    proof: "Premium detailing products and accessories trusted by enthusiasts.",
    accent: "#E53935",
    soft: "#111318",
    heroImage:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=80",
    positioning: "Professional Results. Garage Convenience.",
    primaryColor: "#0B0D10",
    secondaryColor: "#111318",
    accentColor: "#E53935",
    backgroundColor: "#0B0D10",
    textColor: "#FFFFFF",
    headingFont: "Bebas Neue",
    bodyFont: "Poppins",
    collections: ["Exterior Wash", "Interior Care", "Paint Protection", "Wheels & Tires", "Detailing Tools", "Garage Essentials"],
    heroHeadline: "Your Vehicle. Showroom Ready.",
    heroSubheadline: "Premium detailing products and accessories trusted by enthusiasts.",
    ctaText: "Shop DriveCraft",
    secondaryCtaText: "View Detail Kits",
  },
};

const storefrontHashes: StorefrontMode[] = ["general", "beauty", "pets", "home", "fitness", "automotive"];

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
  makeProduct("Posture Corrector", "Fitness", "fitness", 5, 10, 2, 5, 34, 39, "70-80%", 1, "https://www.aliexpress.us/w/wholesale-posture-corrector.html", "Desk posture reset in 5 minutes a day", "Active", 188),
  makeProduct("Resistance Bands", "Fitness", "fitness", 2, 5, 2, 4, 24, 29, "80-85%", 2, "https://www.aliexpress.us/w/wholesale-resistance-bands.html", "Cardio and strength anywhere", "Active", 250),
  makeProduct("Smart Jump Rope", "Fitness", "fitness", 6, 12, 3, 6, 34, 39, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-smart-jump-rope.html", "Cardio with automatic app jump tracking", "Active", 112),
  makeProduct("Pet Dental Kit", "Pets", "pets", 3, 6, 2, 4, 29, 34, "75-80%", 10, "https://www.aliexpress.us/w/wholesale-pet-dental-kit.html", "Fresh pet breath and healthy gums", "Active", 145),
  makeProduct("Sunset Lamp", "Home", "home", 3, 5, 2, 4, 19, 24, "70-80%", 1, "https://www.aliexpress.us/w/wholesale-sunset-lamp.html", "Bring atmospheric sunset colors into your bedroom", "Active", 220),
  makeProduct("Flame Diffuser", "Home", "home", 6, 12, 3, 6, 34, 39, "65-75%", 2, "https://www.aliexpress.us/w/wholesale-flame-diffuser.html", "Ultrasonic cool mist with realistic flame lighting", "Active", 130),
  makeProduct("Self-Wringing Mop", "Home", "home", 5, 10, 3, 6, 29, 34, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-flat-mop-hands-free.html", "Hands-free self-wringing floor mop", "Active", 95),
  makeProduct("Ceramic Wax Spray", "Automotive", "automotive", 4, 10, 3, 6, 29, 39, "60-70%", 1, "https://www.aliexpress.us/w/wholesale-ceramic-wax-spray.html", "Mirror-like shine and water beading", "Active", 180),
  makeProduct("Microfiber Wash Mitt", "Automotive", "automotive", 1, 3, 2, 4, 14, 19, "70-80%", 2, "https://www.aliexpress.us/w/wholesale-microfiber-wash-mitt.html", "Scratch-free car wash experience", "Active", 350),
  makeProduct("Interior Cleaner Wipes", "Automotive", "automotive", 2, 5, 2, 4, 19, 29, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-interior-detailing-wipes.html", "Restore showroom matte look to dashboard", "Active", 240),
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
  const [products, setProducts] = React.useState<Product[]>(seedProducts);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [marketingLeads, setMarketingLeads] = React.useState<MarketingLead[]>(() => loadMarketingLeads());
  const [abandonedCarts, setAbandonedCarts] = React.useState<AbandonedCart[]>(() => loadAbandonedCarts());
  const [view, setView] = React.useState(() => (isStorefrontHash(window.location.hash) ? "storefront" : "admin"));
  const [isAdminAuthed, setIsAdminAuthed] = React.useState(() => loadAdminSession());
  const [activeNiche, setActiveNiche] = React.useState<"all" | Niche>("all");
  const [query, setQuery] = React.useState("");
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("Connecting to backend storage.");
  const [adminTab, setAdminTab] = React.useState("dashboard");
  const [dbContacts, setDbContacts] = React.useState<any[]>([]);
  
  // AliExpress URL Importer States & Handler
  const [aliexpressUrl, setAliexpressUrl] = React.useState("");
  const [isImportingAliexpress, setIsImportingAliexpress] = React.useState(false);

  // AI Studio Dialog States
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [aiAction, setAiAction] = React.useState<"creative_hooks" | "email_flows" | "offer_tests" | null>(null);

  // System credentials settings state
  const [settingsStripeKey, setSettingsStripeKey] = React.useState("");
  const [settingsMedusaUrl, setSettingsMedusaUrl] = React.useState("http://localhost:9000");
  const [settingsMedusaKey, setSettingsMedusaKey] = React.useState("");
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  const handleImportAliexpress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliexpressUrl.trim()) return;
    setIsImportingAliexpress(true);
    setNotice("Importing product from AliExpress...");
    try {
      const response = await importAliexpress(aliexpressUrl.trim());
      // Open the product editing modal pre-filled with imported details!
      setEditingProduct(response.product as Product);
      setIsFormOpen(true);
      setNotice(`Product details imported successfully! Verify and save.`);
      setAliexpressUrl("");
    } catch (error) {
      setNotice(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
    } finally {
      setIsImportingAliexpress(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setNotice("Saving system configurations in .env...");
    try {
      const adminHeaders = {
        "x-admin-email": "admin@products4thepeople.com",
        "x-admin-password": "change-this-password",
        "Content-Type": "application/json",
      };
      
      const response = await fetch("/api/settings/config", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          stripeSecretKey: settingsStripeKey,
          medusaBackendUrl: settingsMedusaUrl,
          medusaAdminApiKey: settingsMedusaKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save credentials.");
      }

      const data = await response.json();
      setNotice(data.message || "Configurations updated successfully!");
      
      // Refresh current config view
      const configRes = await fetch("/api/settings/config", { headers: adminHeaders });
      if (configRes.ok) {
        const config = await configRes.json();
        setSettingsStripeKey(config.stripeSecretKey || "");
        setSettingsMedusaUrl(config.medusaBackendUrl || "http://localhost:9000");
        setSettingsMedusaKey(config.medusaAdminApiKey || "");
      }
    } catch (error) {
      setNotice(error instanceof Error ? `Config error: ${error.message}` : "Failed to save configuration.");
    } finally {
      setIsSavingConfig(false);
    }
  };
  const [medusaConnection, setMedusaConnection] = React.useState<MedusaConnection>(() => loadMedusaConnection());
  const [medusaStatus, setMedusaStatus] = React.useState<"Not connected" | "Connected" | "Unavailable">("Not connected");
  const [isSyncingMedusa, setIsSyncingMedusa] = React.useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [productResponse, orderResponse, contactResponse] = await Promise.all([getProducts(), getOrders(), getContacts()]);
        if (!isMounted) return;

        if (productResponse.products.length === 0) {
          const seeded = seedProducts.map((product) => ({ ...product, source: "seed" as const }));
          await replaceProducts(seeded);
          setProducts(seeded);
          setNotice("Backend connected. Starter catalog seeded.");
        } else {
          setProducts(productResponse.products);
          setNotice("Backend connected. Catalog, orders, and contacts loaded.");
        }

        setOrders(orderResponse.orders.map(normalizeStoredOrder));
        setDbContacts(contactResponse.contacts);

        // Fetch current system environmental configurations
        try {
          const adminHeaders = {
            "x-admin-email": "admin@products4thepeople.com",
            "x-admin-password": "change-this-password",
          };
          const configRes = await fetch("/api/settings/config", { headers: adminHeaders });
          if (configRes.ok && isMounted) {
            const config = await configRes.json();
            setSettingsStripeKey(config.stripeSecretKey || "");
            setSettingsMedusaUrl(config.medusaBackendUrl || "http://localhost:9000");
            setSettingsMedusaKey(config.medusaAdminApiKey || "");
          }
        } catch (e) {
          console.warn("Failed to load environment credentials from settings endpoint:", e);
        }
      } catch (error) {
        if (!isMounted) return;
        setNotice(
          error instanceof Error
            ? `Backend unavailable: ${error.message}. Showing starter catalog until the API is running.`
            : "Backend unavailable. Showing starter catalog until the API is running.",
        );
      }
    }

    void loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem(leadStorageKey, JSON.stringify(marketingLeads));
  }, [marketingLeads]);

  React.useEffect(() => {
    localStorage.setItem(abandonedCartStorageKey, JSON.stringify(abandonedCarts));
  }, [abandonedCarts]);

  React.useEffect(() => {
    initializeMarketingTracking();
    trackMarketingEvent("page_view", { page_title: "Products4ThePeople Admin" });
  }, []);

  React.useEffect(() => {
    const syncViewFromHash = () => {
      setView(isStorefrontHash(window.location.hash) ? "storefront" : "admin");
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
  const openAbandonedCarts = abandonedCarts.filter((cart) => cart.status === "Open");
  const recoveredAbandonedCarts = abandonedCarts.filter((cart) => cart.status === "Recovered");

  const saveProduct = async (form: ProductForm) => {
    if (editingProduct) {
      const updatedProduct = { ...form, id: editingProduct.id };
      try {
        const response = await saveApiProduct(updatedProduct);
        setProducts((current) =>
          current.map((product) => (product.id === editingProduct.id ? response.product : product)),
        );
        setNotice(`${form.name} updated in PostgreSQL.`);
      } catch (error) {
        setNotice(error instanceof Error ? `Product update failed: ${error.message}` : "Product update failed.");
        return;
      }
    } else {
      const id = uniqueId(slugify(form.name), products);
      const newProduct = { ...form, id, source: "local" as const };
      try {
        const response = await saveApiProduct(newProduct);
        setProducts((current) => [response.product, ...current]);
        setNotice(`${form.name} added to PostgreSQL.`);
      } catch (error) {
        setNotice(error instanceof Error ? `Product create failed: ${error.message}` : "Product create failed.");
        return;
      }
    }
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const updateStatus = async (id: string, status: ProductStatus) => {
    try {
      const response = await updateProductStatus(id, status);
      setProducts((current) => current.map((product) => (product.id === id ? response.product : product)));
      setNotice("Product status updated in PostgreSQL.");
    } catch (error) {
      setNotice(error instanceof Error ? `Status update failed: ${error.message}` : "Status update failed.");
    }
  };

  const deleteProduct = async (id: string) => {
    const product = products.find((item) => item.id === id);
    try {
      await removeProduct(id);
      setProducts((current) => current.filter((item) => item.id !== id));
      setNotice(product ? `${product.name} deleted from PostgreSQL.` : "Product deleted from PostgreSQL.");
    } catch (error) {
      setNotice(error instanceof Error ? `Product delete failed: ${error.message}` : "Product delete failed.");
    }
  };

  const resetCatalog = async () => {
    const seeded = seedProducts.map((product) => ({ ...product, source: "seed" as const }));
    try {
      const response = await replaceProducts(seeded);
      setProducts(response.products);
      setNotice("Catalog reset to the starter seed products in PostgreSQL.");
    } catch (error) {
      setNotice(error instanceof Error ? `Catalog reset failed: ${error.message}` : "Catalog reset failed.");
    }
  };

  const importCsv = async (file: File) => {
    const imported = parseSeedCsv(await file.text(), products);
    if (imported.length === 0) {
      setNotice("No valid products found in that CSV.");
      return;
    }
    const importedWithSource = imported.map((product) => ({ ...product, source: "local" as const }));
    try {
      const response = await saveProducts(importedWithSource);
      setProducts((current) => mergeProducts(current, response.products));
      setNotice(`${imported.length} products imported from ${file.name} into PostgreSQL.`);
    } catch (error) {
      setProducts((current) => mergeProducts(current, importedWithSource));
      setNotice(
        error instanceof Error
          ? `CSV import saved locally only because backend failed: ${error.message}`
          : "CSV import saved locally only because backend failed.",
      );
    }
  };

  const exportCsv = () => {
    downloadCsv(products);
    setNotice(`${products.length} products exported.`);
  };

  const placeOrder = async (order: OrderDraft) => {
    const response = await createOrder(order);
    const savedOrder: Order = { ...normalizeStoredOrder(response.order), source: "local" };
    setOrders((current) => [savedOrder, ...current]);
    captureMarketingLead({
      email: order.email,
      name: order.customerName,
      source: "checkout",
      niche: "general",
    });
    setAbandonedCarts((current) =>
      current.map((cart) =>
        cart.email.toLowerCase() === order.email.toLowerCase() && cart.status === "Open"
          ? { ...cart, status: "Recovered" as const, updatedAt: new Date().toISOString() }
          : cart,
      ),
    );
    return savedOrder.id;
  };

  const loginAdmin = (email: string, password: string) => {
    if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return false;
    }

    localStorage.setItem(adminSessionKey, JSON.stringify({ email: adminEmail, signedInAt: new Date().toISOString() }));
    setIsAdminAuthed(true);
    setNotice("Admin session started.");
    return true;
  };

  const logoutAdmin = () => {
    localStorage.removeItem(adminSessionKey);
    setIsAdminAuthed(false);
    window.location.hash = "#admin-login";
  };

  const captureMarketingLead = async (lead: Omit<MarketingLead, "id" | "createdAt">) => {
    const normalizedEmail = lead.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) return;

    setMarketingLeads((current) => upsertMarketingLead(current, { ...lead, email: normalizedEmail }));
    
    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          customerName: lead.name || "Subscriber",
          source: lead.source,
          niche: lead.niche,
        }),
      });
    } catch (e) {
      console.warn("Failed to sync newsletter contact capture to API backend:", e);
    }

    trackMarketingEvent("generate_lead", {
      content_name: lead.source,
      niche: lead.niche,
    });
  };

  const captureAbandonedCart = (cart: Omit<AbandonedCart, "id" | "status" | "updatedAt">) => {
    const normalizedEmail = cart.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail) || cart.items.length === 0) return;

    setAbandonedCarts((current) =>
      upsertAbandonedCart(current, {
        ...cart,
        email: normalizedEmail,
      }),
    );
  };

  const testBackend = async () => {
    try {
      await testApi();
      await testMedusaConnection(medusaConnection);
      setMedusaStatus("Connected");
      setNotice(`API and Medusa are reachable. Medusa is at ${medusaConnection.baseUrl}.`);
    } catch (error) {
      setMedusaStatus("Unavailable");
      setNotice(error instanceof Error ? error.message : "Backend is unavailable.");
    }
  };

  const syncFromMedusa = async () => {
    setIsSyncingMedusa(true);
    try {
      const response = await listMedusaProducts(medusaConnection);
      const imported = response.products.map(mapMedusaProduct);
      const saved = await saveProducts(imported);
      setProducts((current) => mergeProducts(current, saved.products));
      setMedusaStatus("Connected");
      setNotice(`${imported.length} Medusa products synced into PostgreSQL.`);
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

  const syncOrdersFromMedusa = async () => {
    setIsSyncingOrders(true);
    try {
      const response = await listMedusaOrders(medusaConnection);
      const imported = response.orders.map(mapMedusaOrder);
      const saved = await saveOrders(imported);
      setOrders((current) => mergeOrders(current, saved.orders.map(normalizeStoredOrder)));
      setMedusaStatus("Connected");
      setNotice(`${imported.length} Medusa orders synced into PostgreSQL.`);
    } catch (error) {
      setMedusaStatus("Unavailable");
      setNotice(
        error instanceof Error
          ? `Medusa order sync failed: ${error.message}`
          : "Medusa order sync failed. Check backend URL, CORS, and admin authentication.",
      );
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      const response = await updateApiOrderStatus(id, status);
      setOrders((current) => current.map((order) => (order.id === id ? normalizeStoredOrder({ ...order, ...response.order }) : order)));
      setNotice("Order status updated in PostgreSQL.");
    } catch (error) {
      setNotice(error instanceof Error ? `Order status update failed: ${error.message}` : "Order status update failed.");
    }
  };

  if (view === "storefront") {
    return (
      <Storefront
        products={products.filter((product) => product.status === "Active")}
        initialMode={getStorefrontModeFromHash()}
        onBackToAdmin={() => {
          setIsAdminAuthed(loadAdminSession());
          window.location.hash = "#dashboard";
          setView("admin");
        }}
        onPlaceOrder={placeOrder}
        onCaptureLead={captureMarketingLead}
        onCaptureAbandonedCart={captureAbandonedCart}
      />
    );
  }

  if (!isAdminAuthed) {
    return (
      <AdminLogin
        onLogin={loginAdmin}
        onStorefront={() => {
          window.location.hash = "#general";
          setView("storefront");
        }}
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
          {navItems.map(([label, Icon]) => {
            const tabId = label.toLowerCase().replace(" ", "-");
            const isActive = adminTab === tabId;
            return (
              <a
                className={isActive ? "active" : ""}
                href={`#${tabId}`}
                key={label}
                onClick={(e) => {
                  e.preventDefault();
                  setAdminTab(tabId);
                }}
              >
                <Icon size={18} />
                {label}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <ShieldCheck size={18} />
          <strong>Protected admin</strong>
          <span>Storefront routes stay public. Admin tools require this session gate before rendering.</span>
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
              window.location.hash = "#general";
              setView("storefront");
            }}>
              <ShoppingBag size={17} />
              View storefront
            </button>
            <button type="button" onClick={logoutAdmin}>
              <LogOut size={17} />
              Sign out
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

        {adminTab === "dashboard" && (
          <>
            <section className="metrics-grid" id="dashboard">
              <Metric icon={Package} label="Products" value={products.length.toString()} trend={`${filteredProducts.length} visible`} />
              <Metric icon={CheckCircle2} label="Active listings" value={activeCount.toString()} trend={`${reviewCount} in review`} />
              <Metric icon={CircleDollarSign} label="Avg. min profit" value={money(averageProfit)} trend="Before ad spend" />
              <Metric icon={Mail} label="Captured emails" value={(marketingLeads.length + dbContacts.length).toString()} trend={`${openAbandonedCarts.length} open carts`} />
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
              <button 
                type="button" 
                onClick={() => {
                  setMedusaConnection({ baseUrl: "http://localhost:4000/api/mock-medusa", apiKey: "mock_key" });
                  setNotice("Auto-configured URL to local simulated Medusa backend.");
                }}
                style={{ background: "#374151", color: "#ffffff", border: "1px solid #4b5563" }}
              >
                Connect to Simulator
              </button>
              <button className="primary" type="button" onClick={syncFromMedusa} disabled={isSyncingMedusa}>
                {isSyncingMedusa ? "Syncing" : "Sync products"}
              </button>
            </section>
            
            <article className="panel wide" id="order-management" style={{ marginTop: '16px' }}>
              <div className="panel-header">
                <div>
                  <p>Fulfillment worklist</p>
                  <h2>Urgent Orders ({orders.filter(o => o.status === "Ready to fulfill").length})</h2>
                </div>
                <ClipboardList size={22} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.status === "Ready to fulfill").length === 0 ? (
                      <tr>
                        <td colSpan={7}>No urgent orders to fulfill. Go to the Orders tab to see all orders.</td>
                      </tr>
                    ) : orders.filter(o => o.status === "Ready to fulfill").slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id}</strong>
                          <span>{formatDate(order.createdAt)}</span>
                        </td>
                        <td>
                          <strong>{order.customerName}</strong>
                          <span>{order.email}</span>
                        </td>
                        <td className="hook">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                        <td>
                          <strong>{money(order.total)}</strong>
                          <span>{money(order.subtotal)} subtotal</span>
                        </td>
                        <td>{titleCase(order.paymentStatus)}</td>
                        <td>
                          <select
                            className={`status-select ${order.status === "Ready to fulfill" ? "active" : "review"}`}
                            value={order.status}
                            onChange={(event) => updateOrderStatus(order.id, event.target.value as Order["status"])}
                          >
                            <option>Ready to fulfill</option>
                            <option>Needs review</option>
                          </select>
                        </td>
                        <td>{order.source === "medusa" ? "Medusa" : "Storefront"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        )}

        {adminTab === "products" && (
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
        )}

        {adminTab === "imports" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'start' }}>
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
                <button className="primary full" type="button" onClick={() => importInputRef.current?.click()}>
                  Start CSV import
                </button>
                
                <hr style={{ border: '0', borderTop: '1px solid #e5eaee', margin: '8px 0' }} />
                
                <ActionRow icon={Globe2} title="AliExpress URL import" detail="Paste any product link to auto-parse details, images, and content angles." />
                <form onSubmit={handleImportAliexpress} style={{ display: 'grid', gap: '6px' }}>
                  <div className="coupon-input-wrap" style={{ marginTop: '0' }}>
                    <input
                      value={aliexpressUrl}
                      onChange={(event) => setAliexpressUrl(event.target.value)}
                      placeholder="https://www.aliexpress.com/item/..."
                      disabled={isImportingAliexpress}
                      style={{ background: '#f7f9fa', border: '1px solid #dce3e7', borderRadius: '8px', padding: '8px 10px', flex: 1 }}
                    />
                    <button className="primary" type="submit" disabled={isImportingAliexpress || !aliexpressUrl.trim()}>
                      {isImportingAliexpress ? "Importing..." : "Import"}
                    </button>
                  </div>
                </form>
              </div>
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
          </div>
        )}

        {adminTab === "orders" && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <article className="panel" id="orders">
              <div className="panel-header">
                <div>
                  <p>Orders</p>
                  <h2>Backend queue</h2>
                </div>
                <button type="button" onClick={syncOrdersFromMedusa} disabled={isSyncingOrders}>
                  <ShoppingCart size={17} />
                  {isSyncingOrders ? "Syncing" : "Sync orders"}
                </button>
              </div>
              <div className="queue-list">
                <QueueRow label="Total orders" value={orders.length.toString()} />
                <QueueRow label="Ready to fulfill" value={orders.filter((order) => order.status === "Ready to fulfill").length.toString()} />
                <QueueRow label="Needs review" value={orders.filter((order) => order.status === "Needs review").length.toString()} />
                <QueueRow label="Revenue captured" value={money(orders.filter((order) => order.paymentStatus === "paid").reduce((total, order) => total + order.total, 0))} />
              </div>
            </article>

            <article className="panel wide" id="order-management">
              <div className="panel-header">
                <div>
                  <p>Order management</p>
                  <h2>Fulfillment worklist</h2>
                </div>
                <ClipboardList size={22} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7}>No orders yet. Storefront checkout and Medusa sync both feed this queue.</td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id}</strong>
                          <span>{formatDate(order.createdAt)}</span>
                        </td>
                        <td>
                          <strong>{order.customerName}</strong>
                          <span>{order.email}</span>
                        </td>
                        <td className="hook">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                        <td>
                          <strong>{money(order.total)}</strong>
                          <span>{money(order.subtotal)} subtotal</span>
                        </td>
                        <td>{titleCase(order.paymentStatus)}</td>
                        <td>
                          <select
                            className={`status-select ${order.status === "Ready to fulfill" ? "active" : "review"}`}
                            value={order.status}
                            onChange={(event) => updateOrderStatus(order.id, event.target.value as Order["status"])}
                          >
                            <option>Ready to fulfill</option>
                            <option>Needs review</option>
                          </select>
                        </td>
                        <td>{order.source === "medusa" ? "Medusa" : "Storefront"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {adminTab === "customers" && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <article className="panel" id="customers">
              <div className="panel-header">
                <div>
                  <p>Customers</p>
                  <h2>Funnel insights</h2>
                </div>
                <Users size={22} />
              </div>
              <div className="queue-list">
                <QueueRow label="Database leads & customers" value={dbContacts.length.toString()} />
                <QueueRow label="LocalStorage emails" value={marketingLeads.length.toString()} />
                <QueueRow label="Open abandoned carts" value={openAbandonedCarts.length.toString()} />
                <QueueRow label="Recovered carts" value={recoveredAbandonedCarts.length.toString()} />
              </div>
            </article>

            <article className="panel wide" id="customer-directory">
              <div className="panel-header">
                <div>
                  <p>Customer directory</p>
                  <h2>Persistent leads & buyers ({dbContacts.length})</h2>
                </div>
                <Users size={22} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email address</th>
                      <th>Customer name</th>
                      <th>Fulfillment address / Source</th>
                      <th>Last Order ID</th>
                      <th>Capture Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbContacts.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No customer profiles in database yet. Try checking out on the storefront or subscribing to the email wheel!</td>
                      </tr>
                    ) : dbContacts.map((contact) => (
                      <tr key={contact.email}>
                        <td><strong>{contact.email}</strong></td>
                        <td>{contact.customerName}</td>
                        <td className="hook">{contact.address}</td>
                        <td><strong>{contact.lastOrderId || "None"}</strong></td>
                        <td>{formatDate(contact.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {adminTab === "funnels" && (
          <article className="panel" id="funnels">
            <div className="panel-header">
              <div>
                <p>Funnels</p>
                <h2>Capture flows</h2>
              </div>
              <Mail size={22} />
            </div>
            <div className="flow">
              {["Landing Page (#general / #beauty)", "Spinning Wheel Offer Popup", "Product Detail Page", "Cart Upsell", "Stripe Checkout Session", "Payment Confirmed Order Capture"].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </article>
        )}

        {adminTab === "analytics" && (
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
              <span>GA4 {pixelStatus(marketingConfig.ga4MeasurementId)}</span>
              <span>Meta Pixel {pixelStatus(marketingConfig.metaPixelId)}</span>
              <span>TikTok Pixel {pixelStatus(marketingConfig.tikTokPixelId)}</span>
              <span>{totalInventory.toLocaleString()} inventory units</span>
            </div>
          </article>
        )}

        {adminTab === "ai-studio" && (
          <article className="panel" id="ai-studio">
            <div className="panel-header">
              <div>
                <p>AI Studio</p>
                <h2>Content ops (Interactive Copywriter)</h2>
              </div>
              <Bot size={22} />
            </div>
            <div className="import-stack">
              <ActionRow 
                icon={Activity} 
                title="Creative hooks" 
                detail="Generate 3-8 short-form ideas per niche daily." 
                onClick={() => {
                  setAiAction("creative_hooks");
                  setIsAiOpen(true);
                }}
              />
              <ActionRow 
                icon={Mail} 
                title="Email flows" 
                detail="Welcome, abandon cart, post-purchase, and winback." 
                onClick={() => {
                  setAiAction("email_flows");
                  setIsAiOpen(true);
                }}
              />
              <ActionRow 
                icon={CreditCard} 
                title="Offer tests" 
                detail="Discounts, bundles, BOGO, and free-shipping thresholds." 
                onClick={() => {
                  setAiAction("offer_tests");
                  setIsAiOpen(true);
                }}
              />
            </div>
          </article>
        )}

        {adminTab === "settings" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
            <article className="panel" id="settings-readiness">
              <div className="panel-header">
                <div>
                  <p>Platform readiness</p>
                  <h2>Core systems</h2>
                </div>
                <Settings size={22} />
              </div>
              <div className="readiness-grid" style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#68777d' }}><Database size={16} style={{ color: '#176c61' }} /> Medusa SDK active</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#68777d' }}><Truck size={16} style={{ color: '#176c61' }} /> Inventory tracking enabled</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#68777d' }}><CreditCard size={16} style={{ color: settingsStripeKey ? '#10b981' : '#f59e0b' }} /> {settingsStripeKey ? 'Stripe live checkout wired' : 'Stripe simulator mode active (no secret key)'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#68777d' }}><Mail size={16} style={{ color: '#176c61' }} /> exit-intent funnels active</span>
              </div>
            </article>

            <article className="panel" id="settings-setup">
              <div className="panel-header">
                <div>
                  <p>Integration Manager</p>
                  <h2>Stripe & Medusa setup</h2>
                </div>
                <Globe2 size={22} />
              </div>
              <form onSubmit={handleSaveConfig} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16} /> Stripe configuration</h3>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Stripe Secret Key (sk_...)</span>
                    <input
                      type="password"
                      value={settingsStripeKey}
                      onChange={(e) => setSettingsStripeKey(e.target.value)}
                      placeholder="sk_test_..."
                      style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }}
                    />
                    <span style={{ fontSize: '11px', color: '#68777d' }}>Keep blank to automatically use the Stripe Simulator during checkout testing.</span>
                  </label>
                </div>

                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={16} /> Medusa configuration</h3>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Medusa Backend URL</span>
                    <input
                      type="text"
                      value={settingsMedusaUrl}
                      onChange={(e) => setSettingsMedusaUrl(e.target.value)}
                      placeholder="http://localhost:9000"
                      style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Admin API Key</span>
                    <input
                      type="password"
                      value={settingsMedusaKey}
                      onChange={(e) => setSettingsMedusaKey(e.target.value)}
                      placeholder="api_key_..."
                      style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }}
                    />
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isSavingConfig}
                  className="primary full"
                  style={{ background: '#176c61', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {isSavingConfig ? "Saving credentials..." : "Save & Apply Configurations"}
                </button>
              </form>
            </article>
          </div>
        )}
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

      {isAiOpen && (
        <AiStudioDialog
          products={products}
          action={aiAction}
          onClose={() => {
            setIsAiOpen(false);
            setAiAction(null);
          }}
        />
      )}
    </main>
  );
}

function AdminLogin({
  onLogin,
  onStorefront,
}: {
  onLogin: (email: string, password: string) => boolean;
  onStorefront: () => void;
}) {
  const [email, setEmail] = React.useState(adminEmail);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <ShieldCheck size={28} />
          <div>
            <p>Products4ThePeople.com</p>
            <h1>Admin Login</h1>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (onLogin(email, password)) return;
            setError("Invalid admin email or password.");
          }}
        >
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary full" type="submit">
            <LogIn size={17} />
            Sign in
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" onClick={onStorefront}>
            <ShoppingBag size={17} />
            View storefront
          </button>
          <span>Set `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` in `.env` before sharing this build.</span>
        </div>
      </section>
    </main>
  );
}

function AiStudioDialog({
  products,
  action,
  onClose,
}: {
  products: Product[];
  action: "creative_hooks" | "email_flows" | "offer_tests" | null;
  onClose: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = React.useState(() => products[0]?.id || "");
  const [loading, setLoading] = React.useState(false);
  const [output, setOutput] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const getActionTitle = () => {
    if (action === "creative_hooks") return "Creative UGC Video Hooks";
    if (action === "email_flows") return "Email Campaign Flows";
    if (action === "offer_tests") return "AOV Pricing & Offer Tests";
    return "AI Studio Copywriter";
  };

  const handleGenerate = async () => {
    if (!selectedProductId || !action) return;
    setLoading(true);
    setOutput("");
    try {
      const adminHeaders = {
        "x-admin-email": "admin@products4thepeople.com",
        "x-admin-password": "change-this-password",
      };
      
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminHeaders
        },
        body: JSON.stringify({
          productId: selectedProductId,
          action: action
        })
      });

      if (!response.ok) {
        throw new Error("Copy generation failed.");
      }

      const data = await response.json();
      setOutput(data.copy || "No copy generated.");
    } catch (e) {
      setOutput(e instanceof Error ? `Generation error: ${e.message}` : "Copy generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dialog-panel" style={{ background: '#111827', width: '100%', maxWidth: '680px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1f2937', color: '#f1f5f9', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <header className="dialog-header" style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#176c61', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Studio</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 600 }}>{getActionTitle()}</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '24px', lineHeight: '20px' }}>&times;</button>
        </header>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Select Product Catalog Item</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '8px', padding: '10px', fontSize: '14px', outline: 'none' }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.niche})</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !selectedProductId}
              className="primary"
              style={{ alignSelf: 'flex-end', height: '40px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', background: '#176c61', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              {loading ? "Generating..." : "Generate ✨"}
            </button>
          </div>

          <div style={{ flex: 1, minHeight: '280px', background: '#0b0f19', borderRadius: '12px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#9ca3af' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #1f2937', borderTopColor: '#176c61', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span>AI Copywriter is crafting creative assets...</span>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : output ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f2937', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Generated Copy Results</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{ background: 'rgba(23,108,97,0.1)', color: '#176c61', border: '1px solid rgba(23,108,97,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copied ? "Copied! ✓" : "Copy to Clipboard"}
                  </button>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace', fontSize: '13.5px', color: '#e2e8f0', overflowY: 'auto', maxHeight: '350px', lineHeight: '1.5' }}>{output}</pre>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '14px', textAlign: 'center', padding: '40px' }}>
                Choose a product and click "Generate" to write highly engaging TikTok hooks, scarcity email campaigns, or dynamic pricing offers in real-time.
              </div>
            )}
          </div>
        </div>

        <footer style={{ padding: '16px 20px', background: '#1f2937', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid #4b5563', color: '#9ca3af', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
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
           images: [],
           seoTitle: "",
           seoDescription: "",
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
          <Field label="Image URLs" wide>
            <textarea
              value={(form.images || []).join("\n")}
              onChange={(event) =>
                setField("images", event.target.value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))
              }
              placeholder="One image URL per line"
            />
          </Field>
          <Field label="SEO title" wide>
            <input value={form.seoTitle || ""} onChange={(event) => setField("seoTitle", event.target.value)} />
          </Field>
          <Field label="SEO description" wide>
            <textarea value={form.seoDescription || ""} onChange={(event) => setField("seoDescription", event.target.value)} />
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
  initialMode,
  onBackToAdmin,
  onPlaceOrder,
  onCaptureLead,
  onCaptureAbandonedCart,
}: {
  products: Product[];
  initialMode: StorefrontMode;
  onBackToAdmin: () => void;
  onPlaceOrder: (order: OrderDraft) => Promise<string>;
  onCaptureLead: (lead: Omit<MarketingLead, "id" | "createdAt">) => void;
  onCaptureAbandonedCart: (cart: Omit<AbandonedCart, "id" | "status" | "updatedAt">) => void;
}) {
  const [activeNiche, setActiveNiche] = React.useState<StorefrontMode>(initialMode);
  const [activeSubcategory, setActiveSubcategory] = React.useState("All");
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [productQuantities, setProductQuantities] = React.useState<Record<string, number>>({});
  const [email, setEmail] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [checkoutStatus, setCheckoutStatus] = React.useState<"idle" | "redirecting" | "confirming">("idle");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [detailProductId, setDetailProductId] = React.useState(() => getProductIdFromHash());
  const [leadEmail, setLeadEmail] = React.useState("");
  const [leadName, setLeadName] = React.useState("");
  const [leadPhone, setLeadPhone] = React.useState("");
  const [wantsSms, setWantsSms] = React.useState(false);
  const [isEmailPopupOpen, setIsEmailPopupOpen] = React.useState(false);

  // Google Auth & Customer Portal States
  const [currentUser, setCurrentUser] = React.useState<{ email: string; name: string; avatar?: string; isAdmin?: boolean } | null>(() => {
    try {
      const stored = localStorage.getItem("p4tp_customer");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [isPortalOpen, setIsPortalOpen] = React.useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = React.useState(false);
  const [trackOrderId, setTrackOrderId] = React.useState("");
  const [trackingOrderResult, setTrackingOrderResult] = React.useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = React.useState(false);
  const [customerOrders, setCustomerOrders] = React.useState<any[]>([]);
  const [preferences, setPreferences] = React.useState<{ address?: string; phone?: string; notifyShipping?: boolean }>({});
  const [savedCartAvailable, setSavedCartAvailable] = React.useState<Record<string, number> | null>(null);

  // Dynamic Spinning Wheel & Coupon Engine States
  const [wheelState, setWheelState] = React.useState<"idle" | "spinning" | "won">("idle");
  const [wheelResult, setWheelResult] = React.useState<{ label: string; code: string } | null>(null);
  const [wheelRotation, setWheelRotation] = React.useState(0);
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [couponInput, setCouponInput] = React.useState("");
  const [couponError, setCouponError] = React.useState("");

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");

  // Wishlist (persisted per user)
  const [wishlist, setWishlist] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("p4tp_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Mobile Cart Drawer
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  // Add-to-cart animation
  const [addedProductId, setAddedProductId] = React.useState<string | null>(null);
  const [cartBounce, setCartBounce] = React.useState(false);

  // Toast notifications
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: "success" | "error" | "info"; exiting?: boolean }>>([]);

  const addToast = React.useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);

  // Persist wishlist
  React.useEffect(() => {
    localStorage.setItem("p4tp_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    const product = products.find((p) => p.id === productId);
    if (product) {
      const isAdding = !wishlist.includes(productId);
      addToast(isAdding ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`, "info");
    }
  };

  const wheelSegments = [
    { label: "10% OFF", code: "WHEEL10" },
    { label: "Free Shipping", code: "FREESHIP" },
    { label: "15% OFF", code: "WHEEL15" },
    { label: "Try Again", code: "TRYAGAIN" },
    { label: "20% OFF", code: "WHEEL20" },
    { label: "10% OFF", code: "WELCOME10" },
  ];

  const spinWheel = () => {
    if (wheelState !== "idle") return;
    setWheelState("spinning");
    
    // Choose a winning segment index (0, 1, 2, 4, or 5; skip TRYAGAIN for premium UX)
    const winnable = [0, 1, 2, 4, 5];
    const winningIndex = winnable[Math.floor(Math.random() * winnable.length)];
    const prize = wheelSegments[winningIndex];

    const spins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full spins
    const targetDeg = (spins * 360) - (winningIndex * 60) - 30; // 60 deg per segment (360/6)

    setWheelRotation(targetDeg);

    setTimeout(() => {
      setWheelState("won");
      setWheelResult(prize);
    }, 4000);
  };

  const abandonedCartSignatureRef = React.useRef("");
  const config = storefrontNiches[activeNiche];

  React.useEffect(() => {
    const syncStorefrontFromHash = () => {
      const productId = getProductIdFromHash();
      setDetailProductId(productId);
      if (productId) {
        const product = products.find((item) => item.id === productId);
        if (product) setActiveNiche(product.subdomain);
        return;
      }
      setActiveNiche(getStorefrontModeFromHash());
      setActiveSubcategory("All");
    };
    window.addEventListener("hashchange", syncStorefrontFromHash);
    syncStorefrontFromHash();
    return () => window.removeEventListener("hashchange", syncStorefrontFromHash);
  }, [initialMode, products]);

  React.useEffect(() => {
    trackMarketingEvent("page_view", {
      page_title: storefrontNiches[activeNiche].host,
      niche: activeNiche,
    });
  }, [activeNiche]);

  // Load customer profile, saved preferences, cart, and historical orders on sign-in
  React.useEffect(() => {
    if (!currentUser) {
      setCustomerOrders([]);
      setPreferences({});
      setSavedCartAvailable(null);
      return;
    }

    const loadCustomerData = async () => {
      try {
        const adminHeaders = {
          "x-admin-email": "admin@products4thepeople.com",
          "x-admin-password": "change-this-password",
        };

        // Pre-fill checkout form inputs with logged in profile credentials
        setEmail(currentUser.email);
        setCustomerName(currentUser.name);

        // Fetch saved profile & cart from database
        const profileRes = await fetch(`/api/customers/${encodeURIComponent(currentUser.email)}/profile`, { headers: adminHeaders });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setPreferences(profile.preferences || {});
          
          const savedCart = profile.savedCart || {};
          const savedItemCount = Object.keys(savedCart).length;
          const currentItemCount = Object.keys(cart).length;
          
          if (savedItemCount > 0 && currentItemCount === 0) {
            // Auto-restore saved cart if current cart is empty
            setCart(savedCart);
            addToast("Your saved cart has been automatically restored!", "success");
          } else if (savedItemCount > 0 && JSON.stringify(savedCart) !== JSON.stringify(cart)) {
            // Keep saved cart available for manual restore if current cart has elements
            setSavedCartAvailable(savedCart);
          }
        }

        // Fetch order history from database
        const ordersRes = await fetch(`/api/orders/customer/${encodeURIComponent(currentUser.email)}`, { headers: adminHeaders });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setCustomerOrders(data.orders || []);
        }
      } catch (e) {
        console.warn("Failed to load customer profile and order history:", e);
      }
    };

    void loadCustomerData();
  }, [currentUser]);

  // Sync cart in background when cart is modified
  React.useEffect(() => {
    if (!currentUser || Object.keys(cart).length === 0) return;
    
    const syncCart = async () => {
      try {
        const adminHeaders = {
          "x-admin-email": "admin@products4thepeople.com",
          "x-admin-password": "change-this-password",
          "Content-Type": "application/json",
        };
        await fetch(`/api/customers/${encodeURIComponent(currentUser.email)}/profile`, {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            name: currentUser.name,
            preferences: preferences,
            savedCart: cart
          }),
        });
      } catch (e) {
        console.warn("Failed to auto-sync cart updates to profile:", e);
      }
    };

    const delaySync = setTimeout(syncCart, 1000); // debounce sync by 1s
    return () => clearTimeout(delaySync);
  }, [cart, currentUser, preferences]);

  React.useEffect(() => {
    if (localStorage.getItem(emailPopupDismissedKey) === "true") return;
    const delayTimer = window.setTimeout(() => {
      setIsEmailPopupOpen(true);
    }, 15000);

    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY < 20) {
        setIsEmailPopupOpen(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.clearTimeout(delayTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const detailProduct = detailProductId ? products.find((product) => product.id === detailProductId) : null;

  React.useEffect(() => {
    const metadata = detailProduct ? getProductSeo(detailProduct) : getStorefrontSeo(config);
    document.title = metadata.title;
    setMetaDescription(metadata.description);
  }, [config, detailProduct]);

  React.useEffect(() => {
    return () => {
      document.title = "Products4ThePeople";
      setMetaDescription("Products4ThePeople commerce command center and storefront.");
    };
  }, []);

  React.useEffect(() => {
    if (!detailProductId) return;
    if (!products.some((product) => product.id === detailProductId)) {
      window.location.hash = `#${activeNiche}`;
    }
  }, [activeNiche, detailProductId, products]);

  React.useEffect(() => {
    if (detailProduct) {
      setProductQuantities((current) => ({ ...current, [detailProduct.id]: current[detailProduct.id] || 1 }));
    }
  }, [detailProduct]);

  React.useEffect(() => {
    const checkoutParams = new URLSearchParams(window.location.search);
    const checkoutResult = checkoutParams.get("checkout");
    const sessionId = checkoutParams.get("session_id");

    if (checkoutResult === "cancelled") {
      addToast("Checkout was cancelled. Your cart is still here when you are ready.", "info");
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#general"}`);
      return;
    }

    if (checkoutResult !== "success" || !sessionId) return;

    const confirmPaidOrder = async () => {
      setCheckoutStatus("confirming");
      try {
        const pendingOrder = readPendingCheckout();
        const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!response.ok) throw new Error("Could not verify Stripe payment status.");
        const session = (await response.json()) as { paymentStatus?: Order["paymentStatus"]; customerEmail?: string };

        if (!pendingOrder) {
          setConfirmation(`Stripe checkout returned with payment status: ${normalizePaymentStatus(session.paymentStatus)}.`);
          return;
        }

        const paymentStatus = normalizePaymentStatus(session.paymentStatus);
        const orderId = await onPlaceOrder({
          ...pendingOrder,
          email: session.customerEmail || pendingOrder.email,
          paymentStatus,
          stripeSessionId: sessionId,
        });
        if (paymentStatus === "paid") {
          trackMarketingEvent("purchase", {
            currency: "USD",
            transaction_id: orderId,
            value: pendingOrder.total,
          });
        }
        localStorage.removeItem(pendingCheckoutKey);
        setCart({});
        setCustomerName("");
        setEmail("");
        addToast(`Order ${orderId} confirmed. Payment status: ${paymentStatus}.`, "success");
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Checkout confirmation failed.", "error");
      } finally {
        setCheckoutStatus("idle");
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#general"}`);
      }
    };

    void confirmPaidOrder();
  }, [onPlaceOrder]);

  const storefrontProducts = products.filter((product) => activeNiche === "general" || product.subdomain === activeNiche);
  const subcategories = getSubcategories(storefrontProducts);
  const searchLower = searchQuery.trim().toLowerCase();
  const visibleProducts = storefrontProducts.filter(
    (product) => {
      const matchesSubcategory = activeSubcategory === "All" || getProductSubcategory(product) === activeSubcategory;
      const matchesSearch = !searchLower || product.name.toLowerCase().includes(searchLower) || product.niche.toLowerCase().includes(searchLower) || product.contentAngle.toLowerCase().includes(searchLower);
      return matchesSubcategory && matchesSearch;
    },
  );
  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);
      return product ? { product, quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => {
      if (!item) return false;
      if (activeNiche !== "general" && item.product.subdomain !== activeNiche) return false;
      return true;
    });
  const subtotal = cartItems.reduce((total, item) => total + item.product.retailMin * item.quantity, 0);
  const totalCartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  let discountPercent = 0;
  if (appliedCoupon === "WHEEL10" || appliedCoupon === "WELCOME10") discountPercent = 0.1;
  else if (appliedCoupon === "WHEEL15") discountPercent = 0.15;
  else if (appliedCoupon === "WHEEL20") discountPercent = 0.2;

  const discountAmount = roundMoney(subtotal * discountPercent);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const shipping = (appliedCoupon === "FREESHIP" || subtotal >= 25 || subtotal === 0) ? 0 : 7;
  const tax = subtotal > 0 ? roundMoney(discountedSubtotal * 0.06) : 0;
  const total = roundMoney(discountedSubtotal + shipping + tax);

  React.useEffect(() => {
    if (!isValidEmail(email) || cartItems.length === 0) return;

    const signature = JSON.stringify({
      email: email.trim().toLowerCase(),
      items: cartItems.map((item) => [item.product.id, item.quantity]),
      subtotal,
    });
    if (abandonedCartSignatureRef.current === signature) return;
    abandonedCartSignatureRef.current = signature;

    onCaptureAbandonedCart({
      email,
      name: customerName,
      niche: activeNiche,
      subtotal,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.retailMin,
      })),
    });
  }, [activeNiche, cartItems, customerName, email, onCaptureAbandonedCart, subtotal]);

  const addToCart = (productId: string, quantity = 1) => {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + Math.max(1, quantity) }));
    const product = products.find((item) => item.id === productId);
    if (product) {
      trackMarketingEvent("add_to_cart", {
        content_ids: [product.id],
        content_name: product.name,
        currency: "USD",
        value: product.retailMin * Math.max(1, quantity),
      });
      addToast(`${product.name} added to cart`, "success");
    }
    // Animation
    setAddedProductId(productId);
    setCartBounce(true);
    setTimeout(() => setAddedProductId(null), 1500);
    setTimeout(() => setCartBounce(false), 500);
    setIsCartDrawerOpen(true);
  };

  const switchStorefront = (mode: StorefrontMode) => {
    setActiveNiche(mode);
    setActiveSubcategory("All");
    setConfirmation("");
    window.location.hash = `#${mode}`;
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(null);
    setActiveNiche(product.subdomain);
    setActiveSubcategory("All");
    window.location.hash = `#product/${product.id}`;
  };

  const setQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  };

  const submitLead = (event: React.FormEvent<HTMLFormElement>, source: MarketingLead["source"]) => {
    event.preventDefault();
    if (!isValidEmail(leadEmail)) return;

    onCaptureLead({
      email: leadEmail,
      name: leadName,
      source,
      niche: activeNiche,
      phone: leadPhone || undefined,
      wantsSms: wantsSms || undefined,
    });
    addToast("You're on the list! Watch for offers and launch tests.", "success");
    setLeadEmail("");
    setLeadName("");
    setLeadPhone("");
    setWantsSms(false);
    setIsEmailPopupOpen(false);
    localStorage.setItem(emailPopupDismissedKey, "true");
  };

  const dismissEmailPopup = () => {
    setIsEmailPopupOpen(false);
    localStorage.setItem(emailPopupDismissedKey, "true");
  };

  // Google Identity Services & Mock Authentication Helpers
  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (window as any).VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        // ignore
      }
    };
  }, [isAuthOpen]);

  const syncProfileToBackend = async (email: string, name: string, preferences: any, savedCart: any) => {
    try {
      const adminHeaders = {
        "x-admin-email": "admin@products4thepeople.com",
        "x-admin-password": "change-this-password",
        "Content-Type": "application/json",
      };
      await fetch(`/api/customers/${encodeURIComponent(email)}/profile`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ name, preferences, savedCart }),
      });
    } catch (e) {
      console.warn("Failed to sync profile to backend:", e);
    }
  };

  const handleGoogleCredentialResponse = (response: any) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const user = {
        email: payload.email,
        name: payload.name || payload.given_name || "Customer",
        avatar: payload.picture,
        isAdmin: payload.email.toLowerCase() === adminEmail.toLowerCase(),
      };

      setCurrentUser(user);
      localStorage.setItem("p4tp_customer", JSON.stringify(user));
      setIsAuthOpen(false);
      addToast(`Signed in as ${user.name} via Google`, "success");

      if (user.isAdmin) {
        localStorage.setItem(adminSessionKey, JSON.stringify({ email: user.email, signedInAt: new Date().toISOString() }));
        addToast(`Admin authentication active! Welcome back.`, "success");
      }
    } catch (e) {
      console.error("Failed to parse Google credentials:", e);
    }
  };

  const handleMockLogin = (emailInput: string, nameInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanName = nameInput.trim() || "Customer";
    if (!isValidEmail(cleanEmail)) return;

    const user = {
      email: cleanEmail,
      name: cleanName,
      avatar: "", // empty will fall back to SVG initials
      isAdmin: cleanEmail === adminEmail.toLowerCase(),
    };

    setCurrentUser(user);
    localStorage.setItem("p4tp_customer", JSON.stringify(user));
    setIsAuthOpen(false);
    
    // If logging in as admin, also sync admin authed session!
    if (user.isAdmin) {
      localStorage.setItem(adminSessionKey, JSON.stringify({ email: cleanEmail, signedInAt: new Date().toISOString() }));
      setConfirmation(`Admin authentication active! Welcome back.`);
    } else {
      addToast(`Signed in as ${cleanName}`, "success");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("p4tp_customer");
    localStorage.removeItem(adminSessionKey);
    setCurrentUser(null);
    setCart({});
    setEmail("");
    setCustomerName("");
    setIsPortalOpen(false);
    addToast("Signed out successfully.", "info");
  };

  const handleSavePreferences = async (addressInput: string, phoneInput: string, notifyVal: boolean) => {
    if (!currentUser) return;
    setConfirmation("Saving preferences in profile...");
    const updatedPref = { address: addressInput.trim(), phone: phoneInput.trim(), notifyShipping: notifyVal };
    setPreferences(updatedPref);
    
    await syncProfileToBackend(currentUser.email, currentUser.name, updatedPref, cart);
    addToast("Saved account preferences successfully!", "success");
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) return;
    setTrackingLoading(true);
    setTrackingOrderResult(null);
    try {
      const adminHeaders = {
        "x-admin-email": "admin@products4thepeople.com",
        "x-admin-password": "change-this-password",
      };
      const response = await fetch(`/api/orders/${encodeURIComponent(trackOrderId.trim())}`, { headers: adminHeaders });
      if (!response.ok) {
        throw new Error("Order not found. Please double-check your code.");
      }
      const data = await response.json();
      setTrackingOrderResult(data.order);
    } catch (e) {
      setConfirmation(e instanceof Error ? e.message : "Tracking failed.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartItems.length === 0) return;

    const orderDraft: OrderDraft = {
      customerName,
      email,
      address: "Collected by Stripe Checkout",
      subtotal,
      shipping,
      tax,
      total,
      paymentStatus: "pending",
      items: cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.retailMin,
      })),
    };

    onCaptureLead({
      email,
      name: customerName,
      source: "checkout",
      niche: activeNiche,
    });
    trackMarketingEvent("begin_checkout", {
      currency: "USD",
      value: total,
      num_items: cartItems.reduce((count, item) => count + item.quantity, 0),
    });
    setCheckoutStatus("redirecting");
    setConfirmation("");
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          items: orderDraft.items,
          totals: { subtotal, shipping, tax, total },
          storefront: activeNiche,
          discountCode: appliedCoupon,
        }),
      });
      const session = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !session.url) throw new Error(session.error || "Stripe checkout is unavailable.");

      localStorage.setItem(pendingCheckoutKey, JSON.stringify(orderDraft));
      window.location.assign(session.url);
    } catch (error) {
      setCheckoutStatus("idle");
      setConfirmation(error instanceof Error ? error.message : "Stripe checkout could not be started.");
    }
  };

  return (
    <main
      className={`storefront storefront-${activeNiche}`}
      style={
        {
          "--store-accent": config.accentColor,
          "--store-soft": config.soft,
          "--store-primary": config.primaryColor,
          "--store-bg": config.backgroundColor,
          "--store-text": config.textColor,
          "--store-font-heading": config.headingFont,
          "--store-font-body": config.bodyFont,
          "--store-header-bg": config.backgroundColor + "f0",
          "--store-border": config.textColor + "1a",
          "--store-hero": `linear-gradient(90deg, rgba(17, 25, 29, 0.8), rgba(17, 25, 29, 0.18)), url(${config.heroImage})`,
        } as React.CSSProperties
      }
    >
      <header className="storefront-header">
        <button
          className="storefront-brand"
          type="button"
          onClick={() => switchStorefront("general")}
        >
          <Store size={24} />
          <span>{config.label}</span>
        </button>
        <div className="storefront-search">
          <Search size={15} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            type="search"
          />
          {searchQuery && (
            <button className="search-clear" type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <nav aria-label="Storefront navigation">
          <button type="button" onClick={() => switchStorefront(activeNiche)}>
            Shop
          </button>
          <a href="#checkout">Checkout</a>
          
          <details className="more-shops" open={isMoreOpen} onToggle={(e) => setIsMoreOpen(e.currentTarget.open)}>
            <summary>More</summary>
            <div>
              {/* Customer Portal & Authentication */}
              {currentUser ? (
                <button 
                  type="button" 
                  onClick={() => { setIsPortalOpen(true); setIsMoreOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#176c61', fontWeight: 600 }}
                >
                  <User size={13} />
                  <span>{currentUser.name} (Account)</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { setIsAuthOpen(true); setIsMoreOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#176c61', fontWeight: 600 }}
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>
              )}
              <button type="button" onClick={() => { setIsTrackOrderOpen(true); setIsMoreOpen(false); }}>
                Track Order
              </button>
              
              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5eaee' }} />
              
              {/* Shop Switchers */}
              <button
                type="button"
                onClick={() => { switchStorefront("general"); setIsMoreOpen(false); }}
              >
                General Store
              </button>
              {(["beauty", "pets", "home", "fitness", "automotive"] as const).map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => { switchStorefront(niche); setIsMoreOpen(false); }}
                >
                  {storefrontNiches[niche].label}
                </button>
              ))}
              {currentUser?.isAdmin && (
                <button type="button" onClick={() => { onBackToAdmin(); setIsMoreOpen(false); }}>
                  Admin
                </button>
              )}
            </div>
          </details>

          <button
            className="cart-toggle-btn"
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {totalCartCount > 0 && (
              <span className={`cart-count-badge${cartBounce ? " cart-badge-bounce" : ""}`}>{totalCartCount}</span>
            )}
          </button>
        </nav>
      </header>

      <section className="store-hero">
        <div>
          <p>{config.eyebrow}</p>
          <h1>{config.heroHeadline}</h1>
          <p className="hero-subheadline" style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '640px', margin: '8px 0 24px' }}>
            {config.heroSubheadline}
          </p>
          <div className="hero-ctas" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button className="primary" onClick={() => {
              document.querySelector(".shop-grid")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} style={{ minHeight: '44px', padding: '0 24px', fontWeight: 600 }}>
              {config.ctaText}
            </button>
            {config.secondaryCtaText && (
              <button className="secondary" onClick={() => {
                document.querySelector(".subcategory-filter")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }} style={{ minHeight: '44px', padding: '0 24px', fontWeight: 600 }}>
                {config.secondaryCtaText}
              </button>
            )}
          </div>
          <small style={{ display: 'block', marginTop: '10px', opacity: 0.8 }}>{config.proof}</small>
          <span style={{ display: 'inline-block', marginTop: '4px', fontWeight: 600, color: 'var(--store-accent)' }}>{config.offer}</span>
        </div>
      </section>

      <section className="email-capture-band" aria-label="Email offers">
        <div>
          <p>Test offer list</p>
          <h2>Get early discounts before the next product drop.</h2>
        </div>
        <form onSubmit={(event) => submitLead(event, "inline")}>
          <input
            value={leadName}
            onChange={(event) => setLeadName(event.target.value)}
            placeholder="First name"
          />
          <input
            value={leadEmail}
            onChange={(event) => setLeadEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
          />
          <button className="primary" type="submit">
            Join
          </button>
        </form>
      </section>

      {confirmation && <div className="store-notice">{confirmation}</div>}

      {!detailProduct && (
      <section className="store-layout" id="shop">
        <div>
          <div className="store-section-head">
            <div>
              <p>{config.host}</p>
              <h2>{config.label} products</h2>
            </div>
          </div>

          <div className="subcategory-filter" aria-label="Product subcategory filters">
            {subcategories.map((subcategory) => (
              <button
                className={activeSubcategory === subcategory ? "active" : ""}
                key={subcategory}
                type="button"
                onClick={() => setActiveSubcategory(subcategory)}
              >
                {subcategory}
                <span>
                  {subcategory === "All"
                    ? storefrontProducts.length
                    : storefrontProducts.filter((product) => getProductSubcategory(product) === subcategory).length}
                </span>
              </button>
            ))}
          </div>

          {searchQuery && (
            <p className="search-results-count">
              {visibleProducts.length} result{visibleProducts.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}

          <div className="shop-grid">
            {visibleProducts.length === 0 ? (
              <div className="empty-store">
                <Package size={36} />
                <h3>{config.label} catalog is ready for products.</h3>
                <p>Add active products to this niche in the admin catalog and they will appear here.</p>
              </div>
            ) : visibleProducts.map((product) => (
              <article className="shop-card" key={product.id}>
                {product.priority === 1 && (
                  <span className="best-seller-badge" style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    zIndex: 3,
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none'
                  }}>
                    🔥 Best Seller
                  </span>
                )}
                <button className="product-image product-image-button" type="button" onClick={() => openProduct(product)}>
                  <img src={getProductImages(product)[0]} alt="" />
                </button>
                <button
                  className={`wishlist-btn${wishlist.includes(product.id) ? " wishlisted" : ""}`}
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={wishlist.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={16} />
                </button>
                <div className="shop-card-body">
                  <span>{product.niche}</span>
                  <h3>
                    <button type="button" onClick={() => openProduct(product)}>
                      {product.name}
                    </button>
                  </h3>
                <p>{getConsumerCopy(product)}</p>
                  <div className="shop-price">
                    <strong>{money(product.retailMin)}</strong>
                    <small>{product.inventory} in stock</small>
                  </div>
                  <div className="shop-actions">
                    <button type="button" onClick={() => setSelectedProduct(product)}>
                      Quick view
                    </button>
                    <button
                      className={`primary${addedProductId === product.id ? " added" : ""}`}
                      type="button"
                      onClick={() => addToCart(product.id)}
                    >
                      {addedProductId === product.id ? (
                        <><CheckCircle2 size={17} /> Added</>  
                      ) : (
                        <><ShoppingCart size={17} /> Add</>  
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {window.location.hash === "#checkout" && (
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
              <div className="checkout-empty">
                <ShoppingBag size={28} />
                <strong>Your cart is empty.</strong>
                <span>Add a product to see checkout totals, free-shipping progress, and the Stripe handoff.</span>
              </div>
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

          {cartItems.length > 0 && (
            <>
              <div className="coupon-input-wrap">
                <input
                  value={couponInput}
                  onChange={(event) => {
                    setCouponInput(event.target.value);
                    setCouponError("");
                  }}
                  placeholder="Promo code"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = couponInput.trim().toUpperCase();
                    if (["WHEEL10", "WELCOME10", "WHEEL15", "WHEEL20", "FREESHIP"].includes(code)) {
                      setAppliedCoupon(code);
                      setCouponInput("");
                      addToast(`Coupon ${code} applied successfully!`, "success");
                    } else {
                      setCouponError("Invalid promo code.");
                    }
                  }}
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="auth-error" style={{ fontSize: '0.8rem', padding: '6px 8px', marginTop: '6px', marginBottom: '6px' }}>{couponError}</p>}
              
              {appliedCoupon && (
                <div className="applied-coupon-badge" style={{ marginBottom: '12px' }}>
                  <span>🏷️ <strong>{appliedCoupon}</strong> ({
                    appliedCoupon === "FREESHIP" ? "Free Shipping" : 
                    appliedCoupon === "WHEEL20" ? "20% OFF" :
                    appliedCoupon === "WHEEL15" ? "15% OFF" : "10% OFF"
                  })</span>
                  <button type="button" onClick={() => {
                    setAppliedCoupon(null);
                    addToast("Coupon removed.", "info");
                  }}>✕</button>
                </div>
              )}
            </>
          )}

          <div className="totals">
            <span>Subtotal <strong>{money(subtotal)}</strong></span>
            {discountAmount > 0 && (
              <span style={{ color: 'var(--store-accent, #176c61)' }}>
                Discount ({discountPercent * 100}%) <strong>-{money(discountAmount)}</strong>
              </span>
            )}
            <span>Shipping <strong>{shipping === 0 ? "Free" : money(shipping)}</strong></span>
            <span>Estimated tax <strong>{money(tax)}</strong></span>
            <span>Total <strong>{money(total)}</strong></span>
          </div>
          {cartItems.length > 0 && subtotal < 25 && (
            <p className="checkout-progress">{money(25 - subtotal)} away from free shipping.</p>
          )}

          <form className="checkout-form" onSubmit={submitOrder}>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" required />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
            <p className="checkout-note">Shipping address and payment details are collected securely by Stripe.</p>
            <button className="primary full" type="submit" disabled={cartItems.length === 0 || checkoutStatus !== "idle"}>
              {checkoutStatus === "redirecting" ? "Opening secure checkout" : checkoutStatus === "confirming" ? "Confirming payment" : "Pay with Stripe"}
            </button>
          </form>
        </aside>
        )}
      </section>
      )}

      {detailProduct && (
        <ProductDetailPage
          product={detailProduct}
          products={products}
          quantity={productQuantities[detailProduct.id] || 1}
          onBack={() => {
            window.location.hash = `#${detailProduct.subdomain}`;
          }}
          onOpenProduct={openProduct}
          onQuantityChange={(quantity) =>
            setProductQuantities((current) => ({ ...current, [detailProduct.id]: quantity }))
          }
          onAddToCart={(quantity) => {
            addToCart(detailProduct.id, quantity);
          }}
          isWishlisted={wishlist.includes(detailProduct.id)}
          onToggleWishlist={() => toggleWishlist(detailProduct.id)}
        />
      )}

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onViewDetails={() => openProduct(selectedProduct)}
          onAddToCart={() => {
            addToCart(selectedProduct.id);
          }}
        />
      )}

      {isEmailPopupOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="email-capture-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-capture-title"
          >
            <button className="email-popup-close" type="button" onClick={dismissEmailPopup} aria-label="Close email signup">
              <X size={18} />
            </button>
            
            {/* Left Column: Spinning Wheel */}
            <div className="wheel-container">
              <div className="wheel-pointer" style={{ color: config.accent }}>
                <svg viewBox="0 0 24 30" fill="currentColor" width="24" height="30">
                  <path d="M12 30 L2 10 A12 12 0 0 1 22 10 Z" />
                </svg>
              </div>
              <div className="wheel-center-pin" style={{ borderColor: config.accent, color: config.accent }}>
                P4TP
              </div>
              <div 
                className="wheel-svg-wrap" 
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                <svg viewBox="0 0 200 200" width="100%" height="100%">
                  {/* Outer Rim */}
                  <circle cx="100" cy="100" r="95" fill="none" stroke={config.accent} strokeWidth="8" />
                  <circle cx="100" cy="100" r="91" fill="none" stroke="#fff" strokeWidth="2" />
                  
                  {/* Wedges */}
                  {wheelSegments.map((seg, i) => {
                    const startAngle = i * 60;
                    const endAngle = (i + 1) * 60;
                    const radStart = (startAngle - 90) * Math.PI / 180;
                    const radEnd = (endAngle - 90) * Math.PI / 180;
                    const x1 = 100 + 90 * Math.cos(radStart);
                    const y1 = 100 + 90 * Math.sin(radStart);
                    const x2 = 100 + 90 * Math.cos(radEnd);
                    const y2 = 100 + 90 * Math.sin(radEnd);
                    
                    const pathData = `M 100,100 L ${x1},${y1} A 90,90 0 0,1 ${x2},${y2} Z`;
                    const fill = i % 2 === 0 ? config.soft : "#ffffff";
                    
                    return (
                      <g key={i} className="wheel-segment">
                        <path d={pathData} fill={fill} stroke="#dce3e7" strokeWidth="1" />
                        <g transform={`rotate(${startAngle + 30}, 100, 100)`}>
                          <text
                            x="100"
                            y="45"
                            fill={config.accent}
                            fontSize="7.5"
                            fontWeight="900"
                            textAnchor="middle"
                            transform="rotate(90, 100, 45)"
                          >
                            {seg.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* Right Column: Copy & Actions */}
            <div className="wheel-content-side">
              {wheelState === "idle" && (
                <>
                  <span className="wheel-badge">🎡 Spin & Win</span>
                  <h2 id="email-capture-title" style={{ fontSize: '1.4rem', fontWeight: 900 }}>Try Your Luck!</h2>
                  <p style={{ color: '#52636a', lineHeight: 1.4, margin: '6px 0 12px' }}>
                    Spin the wheel to unlock an exclusive discount of up to 20% off your entire order today.
                  </p>
                  <button 
                    className="primary full" 
                    type="button" 
                    onClick={spinWheel}
                    style={{ minHeight: '44px', fontSize: '1rem' }}
                  >
                    🎰 SPIN NOW
                  </button>
                </>
              )}
              
              {wheelState === "spinning" && (
                <>
                  <span className="wheel-badge">💫 Spinning...</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Fingers Crossed!</h2>
                  <p style={{ color: '#52636a', lineHeight: 1.4, margin: '6px 0 12px' }}>
                    The wheel is spinning. Get ready to claim your exclusive discount code...
                  </p>
                  <button 
                    className="primary full" 
                    type="button" 
                    disabled 
                    style={{ minHeight: '44px', fontSize: '1rem', background: '#ccc', borderColor: '#ccc' }}
                  >
                    🔄 Spinning...
                  </button>
                </>
              )}
              
              {wheelState === "won" && (
                <>
                  <span className="wheel-badge">🎉 Congratulations!</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>You Won {wheelResult?.label}!</h2>
                  <p style={{ color: '#52636a', lineHeight: 1.4, margin: '6px 0' }}>
                    Enter your email to unlock your exclusive promo code and apply it to your cart.
                  </p>
                  
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!isValidEmail(leadEmail) || !wheelResult) return;
                      
                      onCaptureLead({
                        email: leadEmail,
                        name: leadName,
                        source: "popup",
                        niche: activeNiche,
                        phone: leadPhone || undefined,
                        wantsSms: wantsSms || undefined,
                      });

                      if (wheelResult.code !== "TRYAGAIN") {
                        setAppliedCoupon(wheelResult.code);
                        setConfirmation(`Coupon ${wheelResult.code} applied! Your ${wheelResult.label} discount is active.`);
                      }

                      setIsEmailPopupOpen(false);
                      localStorage.setItem(emailPopupDismissedKey, "true");
                    }}
                    style={{ display: 'grid', gap: '8px', marginTop: '4px' }}
                  >
                    <input
                      value={leadName}
                      onChange={(event) => setLeadName(event.target.value)}
                      placeholder="First name"
                      style={{ background: '#f7f9fa' }}
                    />
                    <input
                      value={leadEmail}
                      onChange={(event) => setLeadEmail(event.target.value)}
                      placeholder="Email address"
                      required
                      type="email"
                      style={{ background: '#f7f9fa' }}
                    />
                    <input
                      value={leadPhone}
                      onChange={(event) => setLeadPhone(event.target.value)}
                      placeholder="Phone number (optional for SMS offers)"
                      type="tel"
                      style={{ background: '#f7f9fa' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#52636a', margin: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={wantsSms}
                        onChange={(event) => setWantsSms(event.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <span>Get shop notifications & offers via SMS</span>
                    </label>
                    <button className="primary full" type="submit" style={{ minHeight: '44px', fontWeight: 900 }}>
                      🎁 CLAIM DISCOUNT
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Centered Customer Portal Authentication Modal */}
      {isAuthOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAuthOpen(false)}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-close-btn" type="button" onClick={() => setIsAuthOpen(false)} aria-label="Close authentication">
              <X size={18} />
            </button>
            <div className="auth-header">
              <div className="auth-logo" style={{ background: config.accent }}>
                <User size={24} color="#fff" />
              </div>
              <h2 id="auth-modal-title">Customer Portal</h2>
              <p>Sign in to sync your cart, view order history, and save shipping preferences.</p>
            </div>

            <div className="auth-body">
              {/* Live Google Auth Button placeholder */}
              <div className="live-google-section">
                <div id="google-signin-btn" style={{ minHeight: '44px' }}></div>
                {!(import.meta.env.VITE_GOOGLE_CLIENT_ID || (window as any).VITE_GOOGLE_CLIENT_ID) && (
                  <p className="auth-info-note">
                    Live Google OAuth is inactive (no <code>VITE_GOOGLE_CLIENT_ID</code> in environment). Using Google Auth simulator.
                  </p>
                )}
              </div>

              <div className="auth-divider">
                <span>or continue with a demo profile</span>
              </div>

              {/* Demo Logins */}
              <div className="demo-users-grid">
                <button
                  type="button"
                  className="demo-user-card"
                  onClick={() => handleMockLogin("jane@example.com", "Jane Customer")}
                >
                  <div className="demo-avatar" style={{ background: config.soft, color: config.accent }}>JC</div>
                  <div className="demo-details">
                    <strong>Jane Customer</strong>
                    <span>jane@example.com</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="demo-user-card"
                  onClick={() => handleMockLogin(adminEmail, "Admin Developer")}
                >
                  <div className="demo-avatar" style={{ background: "#fee2e2", color: "#ef4444" }}>AD</div>
                  <div className="demo-details">
                    <strong>Admin Developer</strong>
                    <span>{adminEmail}</span>
                  </div>
                </button>
              </div>

              <div className="auth-divider">
                <span>or sign in with any email</span>
              </div>

              {/* Custom login form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const emailVal = (target.elements.namedItem("customEmail") as HTMLInputElement).value;
                  const nameVal = (target.elements.namedItem("customName") as HTMLInputElement).value;
                  handleMockLogin(emailVal, nameVal);
                }}
                className="custom-login-form"
              >
                <div className="input-group">
                  <label htmlFor="customName">Full Name</label>
                  <input id="customName" name="customName" placeholder="e.g. Sarah Connor" required />
                </div>
                <div className="input-group">
                  <label htmlFor="customEmail">Email Address</label>
                  <input id="customEmail" name="customEmail" type="email" placeholder="e.g. sarah@example.com" required />
                </div>
                <button type="submit" className="primary full" style={{ minHeight: '44px' }}>
                  🔑 Sign In with Simulated Credentials
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Slide-out Customer Account Portal Drawer */}
      {isPortalOpen && currentUser && (
        <div className="drawer-backdrop" onClick={() => setIsPortalOpen(false)}>
          <div className="portal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-profile">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder" style={{ background: config.accent, color: '#fff' }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3>{currentUser.name}</h3>
                  <p>{currentUser.email}</p>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={() => setIsPortalOpen(false)} aria-label="Close portal">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Saved Cart restore notification card */}
              {savedCartAvailable && (
                <div className="cart-sync-banner">
                  <div className="banner-content">
                    <ShoppingBag size={18} style={{ color: config.accent }} />
                    <div>
                      <strong>Saved Cart Found</strong>
                      <p>You have a saved cart with items from another session.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="restore-cart-btn"
                    onClick={() => {
                      setCart(savedCartAvailable);
                      setSavedCartAvailable(null);
                      addToast("Your saved cart has been successfully restored!", "success");
                    }}
                  >
                    Restore Cart
                  </button>
                </div>
              )}

              {/* Saved shipping preferences form */}
              <div className="portal-section">
                <h4>📍 Shipping & Account Preferences</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const addressVal = (form.elements.namedItem("address") as HTMLInputElement).value;
                    const phoneVal = (form.elements.namedItem("phone") as HTMLInputElement).value;
                    const notifyVal = (form.elements.namedItem("notifyShipping") as HTMLInputElement).checked;
                    handleSavePreferences(addressVal, phoneVal, notifyVal);
                  }}
                  className="portal-form"
                >
                  <div className="input-group">
                    <label htmlFor="prefAddress">Default Shipping Address</label>
                    <input
                      id="prefAddress"
                      name="address"
                      defaultValue={preferences.address || ""}
                      placeholder="Street, City, Zip Code"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="prefPhone">Phone Number</label>
                    <input
                      id="prefPhone"
                      name="phone"
                      defaultValue={preferences.phone || ""}
                      placeholder="e.g. +1 555 123 4567"
                    />
                  </div>
                  <div className="checkbox-group">
                    <input
                      id="prefNotify"
                      name="notifyShipping"
                      type="checkbox"
                      defaultChecked={preferences.notifyShipping ?? true}
                    />
                    <label htmlFor="prefNotify">Notify me by email on shipment updates</label>
                  </div>
                  <button type="submit" className="save-prefs-btn" style={{ background: config.accent }}>
                    💾 Save Preferences
                  </button>
                </form>
              </div>

              {/* Order History list */}
              <div className="portal-section">
                <h4>📦 Historical Purchases</h4>
                {customerOrders.length === 0 ? (
                  <p className="no-orders-msg">You haven't placed any orders yet. Once you complete checkout, your order history will appear here!</p>
                ) : (
                  <div className="order-history-list">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="order-history-card">
                        <div className="order-card-header">
                          <div>
                            <strong>Order #{order.id.slice(0, 8)}...</strong>
                            <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-card-items">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="order-card-item">
                              <span>{item.name} (x{item.quantity})</span>
                              <span>{money(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-card-footer">
                          <span>Total: <strong>{money(order.total)}</strong></span>
                          <button
                            type="button"
                            className="track-order-shortcut-btn"
                            onClick={() => {
                              setTrackOrderId(order.id);
                              setTrackingOrderResult(order);
                              setIsTrackOrderOpen(true);
                            }}
                          >
                            🗺️ Track Shipment
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              {/* Wishlist */}
              <div className="portal-section">
                <h4>❤️ Wishlist ({wishlist.length})</h4>
                {wishlist.length === 0 ? (
                  <p className="no-orders-msg">Your wishlist is empty. Tap the heart icon on any product to save it here.</p>
                ) : (
                  <div className="wishlist-section">
                    {wishlist.map((productId) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="wishlist-item">
                          <img src={getProductImages(product)[0]} alt="" />
                          <div className="wishlist-item-info">
                            <strong>{product.name}</strong>
                            <span>{money(product.retailMin)}</span>
                          </div>
                          <div className="wishlist-item-actions">
                            <button
                              type="button"
                              className="move-to-cart-btn"
                              onClick={() => {
                                addToCart(productId);
                                toggleWishlist(productId);
                              }}
                            >
                              Add to Cart
                            </button>
                            <button
                              type="button"
                              className="remove-wishlist-btn"
                              onClick={() => toggleWishlist(productId)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            <div className="drawer-footer">
              <button type="button" className="signout-btn" onClick={handleSignOut}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Centered Public Shipment Tracker Modal */}
      {isTrackOrderOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsTrackOrderOpen(false)}>
          <div
            className="tracker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracker-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="tracker-close-btn" type="button" onClick={() => setIsTrackOrderOpen(false)} aria-label="Close tracking">
              <X size={18} />
            </button>
            <div className="tracker-header">
              <h2 id="tracker-modal-title">📦 Shipment Fulfillment Tracker</h2>
              <p>Paste your Order Reference Code to inspect real-time shipping milestones.</p>
            </div>

            <div className="tracker-body">
              <form onSubmit={handleTrackOrder} className="tracker-search-form">
                <input
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                  placeholder="Paste your order code here (e.g. order_12345...)"
                  required
                />
                <button type="submit" disabled={trackingLoading} style={{ background: config.accent }}>
                  {trackingLoading ? "Searching..." : "🔍 Track Order"}
                </button>
              </form>

              {trackingLoading && (
                <div className="tracker-spinner-wrap">
                  <div className="tracker-spinner"></div>
                  <p>Searching database records...</p>
                </div>
              )}

              {trackingOrderResult && (
                <div className="tracking-result-wrap">
                  <div className="tracking-summary">
                    <div>
                      <strong>Order Reference Code:</strong>
                      <span className="reference-code">{trackingOrderResult.id}</span>
                    </div>
                    <div>
                      <strong>Fulfillment Status:</strong>
                      <span className={`status-badge status-${trackingOrderResult.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {trackingOrderResult.status}
                      </span>
                    </div>
                  </div>

                  {/* Shipment milestones timeline */}
                  <div className="timeline-container">
                    {[
                      { key: "Placed", label: "Order Placed", desc: "Order draft captured successfully", icon: "✓" },
                      { key: "Paid", label: "Payment Captured", desc: "Stripe transaction verified", icon: "$" },
                      { key: "Fulfilled", label: "Fulfillment Verified", desc: "Items packed and ready at sorting facility", icon: "📦" },
                      { key: "In Transit", label: "Shipped & In Transit", desc: "Package picked up by courier", icon: "🚚" },
                      { key: "Delivered", label: "Delivered", desc: "Package left at delivery point", icon: "🏠" },
                    ].map((step, idx) => {
                      const isComplete = (() => {
                        const status = trackingOrderResult.status;
                        if (status === "Delivered") return true;
                        if (status === "Shipped" || status === "In Transit") {
                          return idx <= 3;
                        }
                        if (status === "Ready to Fulfill" || status === "Paid") {
                          return idx <= 1;
                        }
                        if (status === "Placed" || status === "Pending") {
                          return idx <= 0;
                        }
                        return idx <= 0;
                      })();

                      return (
                        <div key={idx} className={`timeline-node ${isComplete ? "node-active" : ""}`}>
                          <div className="timeline-icon-circle" style={isComplete ? { background: config.accent, borderColor: config.accent } : {}}>
                            <span>{step.icon}</span>
                          </div>
                          <div className="timeline-details">
                            <h5>{step.label}</h5>
                            <p>{isComplete ? step.desc : "Pending milestones"}</p>
                          </div>
                          {idx < 4 && <div className="timeline-connector-bar" style={isComplete ? { background: config.accent } : {}}></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Storefront Footer */}
      <footer className="storefront-footer">
        <div className="footer-grid">
          <div className="footer-column">
            <h4>Products4thePeople</h4>
            <p style={{ fontSize: '0.84rem', margin: '8px 0 16px', color: '#8c9ba5' }}>
              Premium hyper-niche direct-to-consumer store network. Curated quality products at your fingertips.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#5a6b74' }}>
              &copy; {new Date().getFullYear()} Products4thePeople. All rights reserved.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <button type="button" onClick={() => {
              setSearchQuery("");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>Shop Home</button>
            <button type="button" onClick={() => setIsTrackOrderOpen(true)}>Track Shipment</button>
          </div>

          <div className="footer-column">
            <h4>Customer Care</h4>
            <button type="button" onClick={() => setIsPortalOpen(true)}>
              {currentUser ? "My Account & Wishlist" : "Customer Log In / Register"}
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); addToast("Help Center stub: support@products4thepeople.com", "info"); }}>Support Email</a>
          </div>

          <div className="footer-column">
            <h4>Curated Niches</h4>
            {Object.keys(storefrontNiches).map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => {
                  switchStorefront(niche as StorefrontMode);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {storefrontNiches[niche as StorefrontMode].label}
              </button>
            ))}
          </div>

          <div className="footer-column" style={{ minWidth: '220px' }}>
            <h4>Weekly Product Drops</h4>
            <p style={{ fontSize: '0.84rem', color: '#8c9ba5' }}>Subscribe to get exclusive early launch access.</p>
            <form onSubmit={(event) => submitLead(event, "inline")} className="footer-newsletter">
              <input
                value={leadEmail}
                onChange={(event) => setLeadEmail(event.target.value)}
                placeholder="Email address"
                required
                type="email"
                aria-label="Newsletter email"
              />
              <button type="submit">Join</button>
            </form>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p>Secure global shopping guaranteed.</p>
          <div className="trust-badges">
            <div className="trust-badge">
              <ShieldCheck size={16} />
              <span>Stripe Verified</span>
            </div>
            <div className="trust-badge">
              <Truck size={16} />
              <span>Free Delivery &gt;$25</span>
            </div>
            <div className="trust-badge">
              <RotateCcw size={16} />
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Cart Drawer */}
      {isCartDrawerOpen && (
        <>
          <div className="cart-drawer-backdrop" onClick={() => setIsCartDrawerOpen(false)} />
          <aside className="cart-drawer">
            <div className="cart-drawer-header">
              <span>🛒 Shopping Cart</span>
              <button type="button" onClick={() => setIsCartDrawerOpen(false)} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>
            
            <div className="cart-drawer-body">
              {cartItems.length === 0 ? (
                <div className="checkout-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <ShoppingBag size={32} style={{ marginBottom: '12px', color: '#8c9ba5' }} />
                  <strong>Your cart is empty.</strong>
                  <span>Add some amazing products to get started!</span>
                </div>
              ) : (
                <div className="cart-drawer-lines">
                  {cartItems.map(({ product, quantity }) => (
                    <div className="cart-drawer-line" key={product.id}>
                      <div className="wishlist-item-info" style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: '#52636a' }}>{money(product.retailMin)} each</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          aria-label={`${product.name} quantity`}
                          min="0"
                          type="number"
                          value={quantity}
                          onChange={(event) => setQuantity(product.id, Number(event.target.value))}
                          style={{ width: '48px', padding: '4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #e5eaee' }}
                        />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => setQuantity(product.id, 0)}
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div className="coupon-input-wrap">
                    <input
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        setCouponError("");
                      }}
                      placeholder="Promo code"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = couponInput.trim().toUpperCase();
                        if (["WHEEL10", "WELCOME10", "WHEEL15", "WHEEL20", "FREESHIP"].includes(code)) {
                          setAppliedCoupon(code);
                          setCouponInput("");
                          addToast(`Coupon ${code} applied successfully!`, "success");
                        } else {
                          setCouponError("Invalid promo code.");
                        }
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="auth-error" style={{ fontSize: '0.8rem', padding: '6px 8px', marginTop: '6px' }}>{couponError}</p>}
                  
                  {appliedCoupon && (
                    <div className="applied-coupon-badge" style={{ marginTop: '12px' }}>
                      <span>🏷️ <strong>{appliedCoupon}</strong> ({
                        appliedCoupon === "FREESHIP" ? "Free Shipping" : 
                        appliedCoupon === "WHEEL20" ? "20% OFF" :
                        appliedCoupon === "WHEEL15" ? "15% OFF" : "10% OFF"
                      })</span>
                      <button type="button" onClick={() => {
                        setAppliedCoupon(null);
                        addToast("Coupon removed.", "info");
                      }}>✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="totals">
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  {discountAmount > 0 && (
                    <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--store-accent, #176c61)' }}>
                      <span>Discount ({discountPercent * 100}%)</span>
                      <strong>-{money(discountAmount)}</strong>
                    </div>
                  )}
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Shipping</span>
                    <strong>{shipping === 0 ? "Free" : money(shipping)}</strong>
                  </div>
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Estimated tax</span>
                    <strong>{money(tax)}</strong>
                  </div>
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '8px', borderTop: '1px solid #e5eaee', paddingTop: '8px' }}>
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>

                {subtotal < 25 && (
                  <p className="checkout-progress" style={{ fontSize: '0.8rem', color: '#52636a', marginBottom: '12px', textAlign: 'center' }}>
                    {money(25 - subtotal)} away from free shipping.
                  </p>
                )}

                <form className="checkout-form" onSubmit={(e) => {
                  submitOrder(e);
                  setIsCartDrawerOpen(false);
                }}>
                  <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" required />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
                  <p className="checkout-note" style={{ fontSize: '0.75rem', color: '#8c9ba5', margin: '8px 0', textAlign: 'center' }}>
                    Shipping address and payment details are collected securely by Stripe.
                  </p>
                  <button className="primary full" type="submit" disabled={checkoutStatus !== "idle"}>
                    {checkoutStatus === "redirecting" ? "Opening secure checkout..." : checkoutStatus === "confirming" ? "Confirming payment..." : "Pay with Stripe"}
                  </button>
                </form>
              </div>
            )}
          </aside>
        </>
      )}

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}${toast.exiting ? " toast-exit" : ""}`}
          >
            <span>{toast.message}</span>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </main>
  );
}

function ProductQuickView({
  product,
  onClose,
  onViewDetails,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onViewDetails: () => void;
  onAddToCart: () => void;
}) {
  const images = getProductImages(product);

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="store-product-modal" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <div className="quick-view-media" aria-hidden="true">
          <img src={images[0]} alt="" />
        </div>
        <div className="quick-view-copy">
          <div className="modal-header">
            <div>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{product.niche}</span>
                {product.priority === 1 && (
                  <span style={{
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    🔥 Best Seller
                  </span>
                )}
              </p>
              <h2 id="quick-view-title">{product.name}</h2>
            </div>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <p className="quick-view-lede">
            {getConsumerCopy(product)}
          </p>

          <div className="quick-view-stats">
            <span>
              Price <strong>{money(product.retailMin)}</strong>
            </span>
            <span>
              Availability <strong>{product.inventory > 0 ? "In stock" : "Limited"}</strong>
            </span>
            <span>
              Shipping <strong>Free over $25</strong>
            </span>
            <span>
              Category <strong>{product.niche}</strong>
            </span>
          </div>

          <div className="quick-view-notes">
            {getProductBenefits(product).map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>

          <div className="quick-view-actions">
            <button className="primary" type="button" onClick={onAddToCart}>
              <ShoppingCart size={17} />
              Add to cart
            </button>
            <button type="button" onClick={onViewDetails}>
              View details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailPage({
  product,
  products,
  quantity,
  onBack,
  onOpenProduct,
  onQuantityChange,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: {
  product: Product;
  products: Product[];
  quantity: number;
  onBack: () => void;
  onOpenProduct: (product: Product) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: (quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  const [activeImage, setActiveImage] = React.useState(0);
  const images = getProductImages(product);
  const subcategory = getProductSubcategory(product);
  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.status === "Active" && getProductSubcategory(item) === subcategory)
    .slice(0, 4);

  React.useEffect(() => {
    setActiveImage(0);
  }, [product.id]);

  return (
    <section className="product-detail-page" aria-labelledby="product-detail-title">
      <button className="detail-back" type="button" onClick={onBack}>
        Back to {storefrontNiches[product.subdomain].label}
      </button>

      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="gallery-main">
            <img src={images[activeImage]} alt={product.name} />
          </div>
          <div className="gallery-thumbs" aria-label={`${product.name} image gallery`}>
            {images.map((image, index) => (
              <button
                className={activeImage === index ? "active" : ""}
                key={`${product.id}-${image}`}
                type="button"
                onClick={() => setActiveImage(index)}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{subcategory}</span>
            {product.priority === 1 && (
              <span style={{
                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                🔥 Best Seller
              </span>
            )}
          </div>
          <h2 id="product-detail-title">{product.name}</h2>
          <p>{getConsumerCopy(product)}</p>

          <div className="detail-price-row">
            <strong>{money(product.retailMin)}</strong>
            <small>{product.inventory} in stock</small>
          </div>

          <div className="quantity-row">
            <span>Quantity</span>
            <div className="quantity-stepper">
              <button type="button" onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>
                -
              </button>
              <input
                aria-label={`${product.name} quantity`}
                min="1"
                type="number"
                value={quantity}
                onChange={(event) => onQuantityChange(Math.max(1, Number(event.target.value) || 1))}
              />
              <button type="button" onClick={() => onQuantityChange(quantity + 1)}>
                +
              </button>
            </div>
          </div>

          <button className="primary detail-cart-button" type="button" onClick={() => onAddToCart(quantity)}>
            <ShoppingCart size={18} />
            Add to cart
          </button>

          <button
            className={`wishlist-detail-btn${isWishlisted ? " wishlisted" : ""}`}
            type="button"
            onClick={onToggleWishlist}
          >
            <Heart size={16} />
            {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
          </button>

          <div className="detail-notes">
            {getProductBenefits(product).map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
            <span>Free shipping over $25</span>
            <span>Category: {product.niche}</span>
          </div>
        </div>
      </div>

      <section className="related-products" aria-labelledby="related-title">
        <div className="store-section-head">
          <div>
            <p>{subcategory}</p>
            <h2 id="related-title">Related products</h2>
          </div>
        </div>
        <div className="related-grid">
          {relatedProducts.length === 0 ? (
            <div className="empty-store">
              <Package size={30} />
              <h3>No related products yet.</h3>
              <p>Add more active products in {subcategory} to populate this section.</p>
            </div>
          ) : (
            relatedProducts.map((relatedProduct) => (
              <button className="related-card" key={relatedProduct.id} type="button" onClick={() => onOpenProduct(relatedProduct)}>
                <img src={getProductImages(relatedProduct)[0]} alt="" />
                <span>{getProductSubcategory(relatedProduct)}</span>
                <strong>{relatedProduct.name}</strong>
                <small>{money(relatedProduct.retailMin)}</small>
              </button>
            ))
          )}
        </div>
      </section>
    </section>
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
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`action-row ${onClick ? "clickable" : ""}`} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {onClick && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#176c61', fontWeight: 600 }}>Generate ✨</span>}
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

function loadMarketingLeads() {
  try {
    const stored = localStorage.getItem(leadStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as MarketingLead[];
    return Array.isArray(parsed) ? parsed.filter((lead) => isValidEmail(lead.email)) : [];
  } catch {
    return [];
  }
}

function loadAbandonedCarts() {
  try {
    const stored = localStorage.getItem(abandonedCartStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as AbandonedCart[];
    return Array.isArray(parsed) ? parsed.filter((cart) => isValidEmail(cart.email)) : [];
  } catch {
    return [];
  }
}

function upsertMarketingLead(current: MarketingLead[], lead: Omit<MarketingLead, "id" | "createdAt">): MarketingLead[] {
  const existing = current.find((item) => item.email.toLowerCase() === lead.email.toLowerCase());
  if (existing) {
    return current.map((item) =>
      item.id === existing.id
        ? { ...item, ...lead, name: lead.name || item.name, source: lead.source, niche: lead.niche }
        : item,
    );
  }

  return [
    {
      ...lead,
      id: `LEAD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];
}

function upsertAbandonedCart(current: AbandonedCart[], cart: Omit<AbandonedCart, "id" | "status" | "updatedAt">): AbandonedCart[] {
  const existing = current.find((item) => item.email.toLowerCase() === cart.email.toLowerCase() && item.status === "Open");
  if (existing) {
    return current.map((item) =>
      item.id === existing.id
        ? { ...item, ...cart, name: cart.name || item.name, updatedAt: new Date().toISOString() }
        : item,
    );
  }

  return [
    {
      ...cart,
      id: `CART-${Date.now().toString(36).toUpperCase()}`,
      status: "Open" as const,
      updatedAt: new Date().toISOString(),
    },
    ...current,
  ];
}

function normalizeStoredOrder(order: Order | Partial<Order> | ApiOrder): Order {
  const subtotal = numeric(order.subtotal, 0);
  const shipping = numeric(order.shipping, 0);
  const tax = numeric(order.tax, 0);
  const total = numeric(order.total, subtotal);
  return {
    id: value(order.id) || `P4TP-${Date.now().toString(36).toUpperCase()}`,
    customerName: value(order.customerName),
    email: value(order.email),
    address: value(order.address),
    items: Array.isArray(order.items) ? order.items as Order["items"] : [],
    subtotal: total && !order.total ? total : subtotal,
    shipping,
    tax,
    total: total || subtotal + shipping + tax,
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    stripeSessionId: value(order.stripeSessionId) || undefined,
    status: order.status === "Ready to fulfill" || order.status === "Needs review" ? order.status : "Needs review",
    createdAt: value(order.createdAt) || new Date().toISOString(),
    source: order.source === "medusa" ? "medusa" : "local",
  };
}

function loadAdminSession() {
  try {
    const stored = localStorage.getItem(adminSessionKey);
    if (!stored) return false;
    const parsed = JSON.parse(stored) as { email?: string; signedInAt?: string };
    return parsed.email === adminEmail && Boolean(parsed.signedInAt);
  } catch {
    return false;
  }
}

function mergeOrders(current: Order[], imported: Array<Order | Partial<Order> | ApiOrder>) {
  const byId = new Map(current.map((order) => [order.id, order]));
  imported.map(normalizeStoredOrder).forEach((order) => byId.set(order.id, order));
  return Array.from(byId.values()).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

function mapMedusaOrder(order: MedusaOrder): Order {
  const subtotal = centsToDollars(order.subtotal ?? order.total ?? 0);
  const total = centsToDollars(order.total ?? order.subtotal ?? 0);
  const customerName = [
    order.shipping_address?.first_name,
    order.shipping_address?.last_name,
  ].map(value).filter(Boolean).join(" ") || value(order.email) || "Medusa customer";
  const address = [
    order.shipping_address?.address_1,
    order.shipping_address?.city,
    order.shipping_address?.province,
    order.shipping_address?.postal_code,
  ].map(value).filter(Boolean).join(", ");

  return {
    id: order.display_id ? `MEDUSA-${order.display_id}` : order.id,
    customerName,
    email: value(order.email),
    address,
    items: (order.items || []).map((item) => ({
      productId: value(item.id) || "medusa-item",
      name: value(item.title) || "Medusa item",
      quantity: Number(item.quantity ?? 1),
      price: centsToDollars(item.unit_price ?? 0),
    })),
    subtotal,
    shipping: Math.max(total - subtotal, 0),
    tax: 0,
    total,
    paymentStatus: normalizePaymentStatus(order.status === "canceled" ? "failed" : "paid"),
    status: order.status === "canceled" ? "Needs review" : "Ready to fulfill",
    createdAt: value(order.created_at) || new Date().toISOString(),
    source: "medusa",
  };
}

function centsToDollars(valueToConvert: unknown) {
  const amount = numeric(valueToConvert, 0);
  return amount > 999 ? amount / 100 : amount;
}

function readPendingCheckout(): OrderDraft | null {
  try {
    const stored = localStorage.getItem(pendingCheckoutKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as OrderDraft;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizePaymentStatus(status: unknown): Order["paymentStatus"] {
  const normalized = value(status).toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "unpaid") return "unpaid";
  if (normalized === "failed") return "failed";
  return "pending";
}

function initializeMarketingTracking() {
  if (marketingConfig.ga4MeasurementId) {
    appendMarketingScript("ga4-script", `https://www.googletagmanager.com/gtag/js?id=${marketingConfig.ga4MeasurementId}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", marketingConfig.ga4MeasurementId);
  }

  if (marketingConfig.metaPixelId) {
    const fbq = window.fbq as ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
    if (!fbq) {
      const fbqQueue: unknown[] = [];
      const queuedFbq = ((...args: unknown[]) => {
        fbqQueue.push(args);
      }) as ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
      queuedFbq.queue = fbqQueue;
      queuedFbq.loaded = true;
      queuedFbq.version = "2.0";
      window.fbq = queuedFbq;
      window._fbq = queuedFbq;
      appendMarketingScript("meta-pixel-script", "https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq?.("init", marketingConfig.metaPixelId);
    window.fbq?.("track", "PageView");
  }

  if (marketingConfig.tikTokPixelId) {
    window.ttq = window.ttq || {
      track: () => undefined,
      page: () => undefined,
    };
    appendMarketingScript(
      "tiktok-pixel-script",
      `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${marketingConfig.tikTokPixelId}&lib=ttq`,
    );
    window.ttq.page?.();
  }
}

function appendMarketingScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.async = true;
  script.id = id;
  script.src = src;
  document.head.appendChild(script);
}

function trackMarketingEvent(eventName: "page_view" | "generate_lead" | "add_to_cart" | "begin_checkout" | "purchase", params: Record<string, unknown> = {}) {
  window.gtag?.("event", eventName, params);

  const metaEvent = {
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    generate_lead: "Lead",
    page_view: "PageView",
    purchase: "Purchase",
  }[eventName];
  window.fbq?.("track", metaEvent, params);

  const tikTokEvent = {
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    generate_lead: "SubmitForm",
    page_view: "PageView",
    purchase: "CompletePayment",
  }[eventName];
  window.ttq?.track?.(tikTokEvent, params);
}

function pixelStatus(pixelId: string) {
  return pixelId ? "configured" : "missing";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

function isStorefrontHash(hash: string) {
  const normalized = hash.replace("#", "").toLowerCase();
  if (!normalized) return true;
  const adminHashes = ["admin", "dashboard", "import", "orders", "customers", "funnels", "analytics", "ai", "settings"];
  const isAdmin = adminHashes.includes(normalized) || normalized.startsWith("admin-");
  return !isAdmin;
}

function getStorefrontModeFromHash(): StorefrontMode {
  const normalized = window.location.hash.replace("#", "").toLowerCase();
  if (storefrontHashes.includes(normalized as StorefrontMode)) return normalized as StorefrontMode;
  return "general";
}

function getProductIdFromHash() {
  const normalized = window.location.hash.replace("#", "");
  return normalized.startsWith("product/") ? decodeURIComponent(normalized.replace("product/", "")) : null;
}

function toForm(product: Product): ProductForm {
  const { id: _id, ...form } = product;
  return form;
}

function countByNiche(products: Product[], niche: Niche) {
  return products.filter((product) => product.subdomain === niche).length;
}

function getSubcategories(products: Product[]) {
  const categories = Array.from(new Set(products.map(getProductSubcategory)));
  return ["All", ...categories.sort((first, second) => first.localeCompare(second))];
}

function getProductSubcategory(product: Product) {
  const haystack = `${product.name} ${product.contentAngle} ${product.niche}`.toLowerCase();

  if (product.subdomain === "beauty") {
    if (matchesAny(haystack, ["led", "mask", "neck"])) return "LED Beauty Devices";
    if (matchesAny(haystack, ["anti-aging", "wrinkle", "aging", "lift"])) return "Anti-Aging";
    if (matchesAny(haystack, ["hair", "curl", "scalp", "satin", "wrap", "growth", "brush", "massager"])) return "Hair Care";
    if (matchesAny(haystack, ["sculpt", "ice", "roller", "massage", "gua sha"])) return "Facial Sculpting";
    if (matchesAny(haystack, ["self-care", "clean", "pore", "cleansing", "vacuum", "patches", "eye"])) return "Self-Care Essentials";
    return "Beauty Bundles";
  }

  if (product.subdomain === "pets") {
    if (matchesAny(haystack, ["travel", "car", "seat", "water bottle", "outdoor"])) return "Travel & Adventure";
    if (matchesAny(haystack, ["feed", "feeder", "bowl", "bottle"])) return "Feeding Essentials";
    if (matchesAny(haystack, ["groom", "hair", "remover", "fur", "cleaner", "paw", "brush"])) return "Grooming";
    if (matchesAny(haystack, ["bed", "sleep", "calm", "anxious", "blanket"])) return "Comfort & Sleep";
    if (matchesAny(haystack, ["toy", "laser", "lick", "mat", "enrichment"])) return "Toys & Enrichment";
    return "Pet Wellness";
  }

  if (product.subdomain === "fitness") {
    if (matchesAny(haystack, ["massage", "roller", "gun", "sore", "muscle"])) return "Massage Recovery";
    if (matchesAny(haystack, ["cold", "ice", "plunge", "cryo", "freeze"])) return "Cold Therapy";
    if (matchesAny(haystack, ["mobility", "stretching", "stretch", "yoga", "mat"])) return "Mobility";
    if (matchesAny(haystack, ["compression", "sleeve", "wrap", "band"])) return "Compression";
    if (matchesAny(haystack, ["sleep", "pillow", "recovery sleep"])) return "Sleep Optimization";
    return "Recovery Bundles";
  }

  if (product.subdomain === "home") {
    if (matchesAny(haystack, ["kitchen", "spice", "pantry", "drawer", "fridge"])) return "Kitchen Organization";
    if (matchesAny(haystack, ["closet", "hanger", "wardrobe", "shoe"])) return "Closet Solutions";
    if (matchesAny(haystack, ["bathroom", "shower", "vanity", "soap"])) return "Bathroom Storage";
    if (matchesAny(haystack, ["workspace", "desk", "monitor", "stand"])) return "Workspace Setup";
    if (matchesAny(haystack, ["entryway", "key", "coat", "rack"])) return "Entryway Essentials";
    return "Space Saving Products";
  }

  if (product.subdomain === "automotive") {
    if (matchesAny(haystack, ["wash", "shampoo", "foam", "soap", "mitt", "bucket"])) return "Exterior Wash";
    if (matchesAny(haystack, ["interior", "wipe", "dashboard", "leather", "vacuum"])) return "Interior Care";
    if (matchesAny(haystack, ["paint", "wax", "ceramic", "sealant", "coating", "spray"])) return "Paint Protection";
    if (matchesAny(haystack, ["wheel", "tire", "rim", "tire shine"])) return "Wheels & Tires";
    if (matchesAny(haystack, ["tool", "towel", "brush", "applicator"])) return "Detailing Tools";
    return "Garage Essentials";
  }

  return "Featured";
}

function getProductImages(product: Product) {
  if (product.images?.length) return product.images;
  const fallback = productImageFallbacks[getProductSubcategory(product)] || productImageFallbacks.Featured;
  return fallback.map((url) => `${url}&auto=format&fit=crop&w=1200&q=80`);
}

function getConsumerCopy(product: Product) {
  const subcategory = getProductSubcategory(product);
  const angle = product.contentAngle.trim();
  if (angle) {
    if (product.subdomain === "beauty") return `${angle}. Easy to add to a daily routine and simple enough to demo at a glance.`;
    if (product.subdomain === "pets") return `${angle}. Built for everyday pet-owner messes, outings, and calmer routines.`;
    if (product.subdomain === "home") return `${angle}. A practical home upgrade with a clear use case and giftable price point.`;
    return `${angle}. A simple fitness helper for home workouts, recovery, or active days.`;
  }

  if (product.subdomain === "beauty") return `A ${subcategory.toLowerCase()} pick for fast routines, easy gifting, and visible everyday value.`;
  if (product.subdomain === "pets") return `A ${subcategory.toLowerCase()} pick for pet owners who want less friction in daily care.`;
  if (product.subdomain === "home") return "A useful home upgrade selected for simple setup and everyday value.";
  return "A fitness helper selected for straightforward use and clear routine support.";
}

function getProductBenefits(product: Product) {
  const subcategory = getProductSubcategory(product);
  if (product.subdomain === "beauty") {
    if (subcategory === "Hair Care") return ["Protects styling time", "Low-friction morning or overnight routine", "Strong bundle fit with beauty add-ons"];
    if (subcategory === "LED Beauty Devices") return ["Premium at-home spa positioning", "Strong visual demo potential", "Easy upgrade path into beauty bundles"];
    if (subcategory === "Self-Care Essentials") return ["Clear before-and-after story", "Simple routine education", "Accessible price for first-time buyers"];
    return ["Quick refresh use case", "Compact and giftable", "Easy add-on for beauty bundles"];
  }

  if (product.subdomain === "pets") {
    if (subcategory === "Travel & Adventure") return ["Solves a visible daily mess", "Great for walks, cars, and errands", "Easy pet-owner gift"];
    if (subcategory === "Comfort & Sleep") return ["Supports calmer downtime", "Clear emotional purchase driver", "Pairs well with pet essentials"];
    if (subcategory === "Feeding Essentials") return ["Convenience-led daily routine", "Useful for busy households", "Strong practical value"];
    if (subcategory === "Pet Wellness") return ["Clear night-walk safety angle", "Simple visual demo", "Impulse-friendly accessory"];
    return ["Keeps pets engaged", "Easy indoor-use story", "Great checkout add-on"];
  }

  if (product.subdomain === "home") return ["Simple setup", "Everyday utility", "Giftable home upgrade"];
  if (product.subdomain === "automotive") return ["Professional garage results", "Premium detailing performance", "Enthusiast trusted quality"];
  return ["Routine support", "Easy to use at home", "Clear demo potential"];
}

function getProductSeo(product: Product) {
  return {
    title: product.seoTitle?.trim() || `${product.name} | Products4ThePeople`,
    description:
      product.seoDescription?.trim() ||
      product.contentAngle ||
      `Shop ${product.name} from Products4ThePeople with simple checkout and fast fulfillment updates.`,
  };
}

function getStorefrontSeo(config: StorefrontNicheConfig) {
  return {
    title: `${config.label} | Products4ThePeople`,
    description: config.headline,
  };
}

function setMetaDescription(content: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

const productImageFallbacks: Record<string, string[]> = {
  // Beauty (GlowTheory)
  "LED Beauty Devices": [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?",
  ],
  "Anti-Aging": [
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?",
  ],
  "Hair Care": [
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?",
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?",
  ],
  "Facial Sculpting": [
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?",
  ],
  "Self-Care Essentials": [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?",
  ],
  "Beauty Bundles": [
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?",
  ],

  // Pets (Wagwell)
  "Travel & Adventure": [
    "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?",
  ],
  "Feeding Essentials": [
    "https://images.unsplash.com/photo-1558944351-cfb7eaa395f6?",
  ],
  "Grooming": [
    "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?",
  ],
  "Comfort & Sleep": [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?",
    "https://images.unsplash.com/photo-1534361960057-19889db9621e?",
  ],
  "Toys & Enrichment": [
    "https://images.unsplash.com/photo-1534361960057-19889db9621e?",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?",
  ],
  "Pet Wellness": [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?",
  ],

  // Fitness (RecoverLab)
  "Massage Recovery": [
    "https://images.unsplash.com/photo-1519826310-790ab6143b66?",
  ],
  "Cold Therapy": [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?",
  ],
  "Mobility": [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?",
  ],
  "Compression": [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?",
  ],
  "Sleep Optimization": [
    "https://images.unsplash.com/photo-1511295742364-927d44afca6b?",
  ],
  "Recovery Bundles": [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?",
  ],

  // Home (NestTheory)
  "Kitchen Organization": [
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?",
  ],
  "Closet Solutions": [
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?",
  ],
  "Bathroom Storage": [
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?",
  ],
  "Workspace Setup": [
    "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?",
  ],
  "Entryway Essentials": [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?",
  ],
  "Space Saving Products": [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?",
  ],

  // Automotive (DriveCraft)
  "Exterior Wash": [
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?",
  ],
  "Interior Care": [
    "https://images.unsplash.com/photo-1563720223185-11003d516935?",
  ],
  "Paint Protection": [
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?",
  ],
  "Wheels & Tires": [
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?",
  ],
  "Detailing Tools": [
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?",
  ],
  "Garage Essentials": [
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?",
  ],

  Featured: [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?",
    "https://images.unsplash.com/photo-1607083206968-13611e3d76db?",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?",
  ],
};

function matchesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
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
        normalizeStatus(value(row.status) || "draft"),
        numeric(row.inventory, 0),
      );
      return {
        ...product,
        id: uniqueId(product.id, existingProducts),
        images: parseImageList(row.images || row.image_urls || row.image_url),
        seoTitle: value(row.seo_title),
        seoDescription: value(row.seo_description),
      };
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
    images: parseImageList(metadata.images || metadata.image_urls || metadata.image_url || product.images?.map((image) => image.url)),
    seoTitle: value(metadata.seo_title || metadata.title_tag),
    seoDescription: value(metadata.seo_description || metadata.meta_description),
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
    "images",
    "seo_title",
    "seo_description",
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
      (product.images || []).join("|"),
      product.seoTitle || "",
      product.seoDescription || "",
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

function parseImageList(valueToParse: unknown) {
  if (Array.isArray(valueToParse)) return valueToParse.map(value).filter(Boolean);
  return value(valueToParse)
    .split(/[\n|,]/)
    .map((url) => url.trim())
    .filter(Boolean);
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
