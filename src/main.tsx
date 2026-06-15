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
  MessageSquare,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Star,
  TrendingUp,
  Gauge,
  BookOpen,
  AlertTriangle,
  Eye,
  Layers,
  ZoomIn,
} from "lucide-react";
import {
  listMedusaOrders,
  listMedusaProducts,
  testMedusaConnection,
  type MedusaConnection,
  type MedusaOrder,
  type MedusaProduct,
} from "./lib/medusa";
import { APP_VERSION } from "./lib/version";
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
  createContact,
  updateContactRole,
  deleteContact,
  getMediaAssets,
  getAdminMediaAssets,
  addMediaUrl,
  uploadMediaAsset,
  deleteMediaAsset,
  getOpportunities,
  createOpportunity,
  getOpportunityDetails,
  updateOpportunity,
  getCompetitors,
  createCompetitor,
  runGapAnalysis,
  runDemandResearch,
  runCompetitorResearch,
  searchAliExpress,
  importSupplierProduct,
  setWatchlistStatus,
  scoreResearchProduct,
  generateContentForOpportunity,
  getExperiments,
  getExperimentDetails,
  createExperiment,
  updateExperimentStatus,
  trackExperimentConversion,
  promoteExperimentVariant,
  simulateExperimentTraffic,
  getActiveExperiments,
  getArticles,
  getArticleDetails,
  getAdminArticles,
  createArticle,
  generateArticle,
  generateArticleFromProduct,
  updateArticle,
  improveArticle,
  deleteArticle,
  getKbArticles,
  getAdminKbArticles,
  createKbArticle,
  updateKbArticle,
  getSeoPages,
  getSeoPageDetails,
  getAdminSeoPages,
  createSeoPage,
  generateSeoPage,
  generateSeoPageFromProduct,
  updateSeoPage,
  trackSeoHit,
  getSeoDashboard,
  type Article,
  type KnowledgeArticle,
  type MediaAsset,
  type SeoPage,
  type SeoDashboardStats,
  type ApiOrder,
  type ResearchOpportunity,
  type CompetitorProduct,
  type SupplierProduct,
  type Experiment,
  type ExperimentVariant,
} from "./lib/api";
import "./styles.css";

type Niche = "beauty" | "pets" | "home" | "fitness" | "automotive";
type ProductStatus = "Active" | "Review" | "Draft";

type Product = {
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
  status: ProductStatus;
  inventory: number;
  images?: string[];
  trustBadges?: string[];
  productHighlights?: ProductHighlight[];
  reviews?: ProductReview[];
  seoTitle?: string;
  seoDescription?: string;
  source?: "seed" | "local" | "medusa";
};

type ProductForm = Omit<Product, "id">;

type ProductHighlight = {
  id: string;
  label: string;
  description: string;
};

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

type StorefrontMode = string;

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
  logo?: string;
  status?: "draft" | "review" | "active";
};

const medusaConfigKey = "p4tp-medusa-connection";
const adminSessionKey = "p4tp-admin-session";
const pendingCheckoutKey = "p4tp-pending-checkout";
const leadStorageKey = "p4tp-marketing-leads";
const abandonedCartStorageKey = "p4tp-abandoned-carts";
const emailPopupDismissedKey = "p4tp-email-popup-dismissed";
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@products4thepeople.com";
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "change-this-password";
const storefrontApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${storefrontApiBaseUrl}${normalized}`;
}

function adminRequestHeaders(extra: Record<string, string> = {}) {
  return {
    "x-admin-email": adminEmail,
    "x-admin-password": adminPassword,
    ...extra,
  };
}

function saveAdminSession(email = adminEmail) {
  localStorage.setItem(
    adminSessionKey,
    JSON.stringify({ email: email.trim().toLowerCase(), isAdmin: true, signedInAt: new Date().toISOString() }),
  );
}

function clearUnifiedAuthSession() {
  localStorage.removeItem(adminSessionKey);
  localStorage.removeItem("p4tp_customer");
}

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
    label: "Products4thePeople",
    host: "products4thepeople.com",
    eyebrow: "Products for everyday people",
    headline: "Practical products people actually use, tested brand by brand.",
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
    logo: "./Logos/Product4thePeople_Logo.png",
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
    logo: "./Logos/GlowTheory_Logo.png",
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
    logo: "./Logos/WagWell_Logo.png",
  },
  home: {
    label: "NestTheory",
    host: "home.products4thepeople.com",
    eyebrow: "Home upgrades",
    headline: "Small home upgrades with everyday utility and easy gift appeal.",
    offer: "Home storefront ready for product testing",
    proof: "This storefront is staged for the next product wave once active NestTheory listings are approved.",
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
    proof: "This storefront is staged for the next product wave once active RecoverLab listings are approved.",
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
    logo: "./Logos/RecoverLab_Logo.png",
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
    logo: "./Logos/DriveCraft_Logo.png",
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
  makeProduct("13-Piece Makeup Brush Set", "Beauty", "beauty", 4.9, 4.9, 2.99, 2.99, 17.99, 17.99, "$10.10 est.", 10, "https://www.aliexpress.us/item/3256811770072335.html", "Soft full-face brush set for foundation contour blush highlight and eyeshadow", "Active", 180),
  makeProduct("Dog Water Bottle", "Pets", "pets", 3, 8, 3, 6, 19, 39, "70-85%", 1, "https://www.aliexpress.us/w/wholesale-dog-water-bottle.html", "Every dog owner needs this", "Active", 392),
  makeProduct("Calming Dog Bed", "Pets", "pets", 12, 25, 8, 20, 49, 99, "55-70%", 2, "https://www.aliexpress.us/w/wholesale-calming-dog-bed.html", "Help anxious pets relax", "Active", 88),
  makeProduct("Pet Hair Remover Roller", "Pets", "pets", 2, 6, 3, 6, 19, 34, "70-85%", 3, "https://www.aliexpress.us/w/wholesale-pet-hair-remover.html", "Remove fur instantly", "Active", 305),
  makeProduct("Automatic Pet Feeder", "Pets", "pets", 20, 45, 10, 20, 79, 149, "50-65%", 4, "https://www.aliexpress.us/w/wholesale-automatic-pet-feeder.html", "Feed pets automatically", "Review", 61),
  makeProduct("Dog Seat Cover", "Pets", "pets", 8, 18, 6, 12, 39, 79, "60-75%", 5, "https://www.aliexpress.us/w/wholesale-dog-car-seat-cover.html", "Keep car clean with dogs", "Active", 144),
  makeProduct("LED Dog Collar", "Pets", "pets", 2, 5, 2, 4, 14, 29, "75-85%", 6, "https://www.aliexpress.us/w/wholesale-led-dog-collar.html", "Night walk safety", "Draft", 520),
  makeProduct("Lick Mat", "Pets", "pets", 2, 6, 3, 5, 19, 34, "70-85%", 7, "https://www.aliexpress.us/w/wholesale-dog-lick-mat.html", "Calm dogs with enrichment", "Active", 274),
  makeProduct("Cat Laser Toy", "Pets", "pets", 2, 7, 3, 5, 19, 39, "70-85%", 8, "https://www.aliexpress.us/w/wholesale-cat-laser-toy.html", "Keep cats entertained", "Review", 219),
  makeProduct("Dog Paw Cleaner", "Pets", "pets", 3, 8, 3, 6, 19, 39, "70-85%", 9, "https://www.aliexpress.us/w/wholesale-dog-paw-cleaner.html", "Stop muddy paw prints", "Active", 333),
  makeProduct("Extra Large Plush Dog Bed", "Pets", "pets", 36.9, 36.9, 0, 0, 52.99, 52.99, "$30.17 est.", 11, "https://www.aliexpress.us/item/3256811658856601.html", "Oversized plush bed mat for large dogs crates kennels and cozy living-room naps", "Active", 80),
  makeProduct("Spin Carpet Cat Scratching Post", "Pets", "pets", 12.16, 12.16, 0, 0, 23.99, 23.99, "$11.83 est.", 12, "https://www.aliexpress.us/item/3256805622822820.html", "Wooden climbing frame with sisal scratching and a rotating play ball", "Active", 120),
  makeProduct("Dog Training Waist Treat Bag", "Pets", "pets", 6.61, 6.61, 0, 0, 13.78, 13.78, "$7.12 est.", 13, "https://www.aliexpress.us/item/3256807361435225.html", "Hands-free treat pouch for walks outdoor training and quick rewards", "Active", 220),
  makeProduct("Pet Hair Shedding Comb", "Pets", "pets", 8.06, 8.06, 0, 0, 14.99, 14.99, "$6.93 est.", 14, "https://www.aliexpress.us/item/3256811756959518.html", "Detangling grooming brush for loose fur undercoat knots and mats", "Active", 190),
  makeProduct("Cotton Rope Cat Hammock", "Pets", "pets", 30.83, 30.83, 0, 0, 55.87, 55.87, "$25.04 est.", 15, "https://www.aliexpress.us/item/3256811371082916.html", "Hand-woven hanging cat hammock for elevated lounging in multi-cat homes", "Active", 75),
  makeProduct("Posture Corrector", "Fitness", "fitness", 5, 10, 2, 5, 34, 39, "70-80%", 1, "https://www.aliexpress.us/w/wholesale-posture-corrector.html", "Desk posture reset in 5 minutes a day", "Active", 188),
  makeProduct("Resistance Bands", "Fitness", "fitness", 2, 5, 2, 4, 24, 29, "80-85%", 2, "https://www.aliexpress.us/w/wholesale-resistance-bands.html", "Cardio and strength anywhere", "Active", 250),
  makeProduct("Smart Jump Rope", "Fitness", "fitness", 6, 12, 3, 6, 34, 39, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-smart-jump-rope.html", "Cardio with automatic app jump tracking", "Active", 112),
  makeProduct("Mini Percussion Massage Gun", "Fitness", "fitness", 41.02, 41.02, 0, 0, 60.89, 60.89, "$19.87 est.", 4, "https://www.aliexpress.us/item/3256811844401796.html", "Portable handheld massage gun for back neck shoulder leg and post-workout recovery", "Active", 95),
  makeProduct("Mouth Tape Sleep Strips", "Fitness", "fitness", 2.57, 7.25, 4.36, 4.36, 22.99, 32.87, "$20.42-$25.62 est.", 5, "https://www.aliexpress.us/item/3256812145970867.html", "Travel-friendly sleep strips that support gentle nasal-breathing routines", "Active", 260),
  makeProduct("Resistance Bands With Handles", "Fitness", "fitness", 5.64, 5.64, 2.99, 2.99, 25.6, 25.6, "$18.97 est.", 6, "https://www.aliexpress.us/item/3256811825124429.html", "Handled workout bands for at-home strength training and compact travel workouts", "Active", 210),
  makeProduct("Pet Dental Kit", "Pets", "pets", 3, 6, 2, 4, 29, 34, "75-80%", 10, "https://www.aliexpress.us/w/wholesale-pet-dental-kit.html", "Fresh pet breath and healthy gums", "Active", 145),
  makeProduct("Sunset Lamp", "Home", "home", 3, 5, 2, 4, 19, 24, "70-80%", 1, "https://www.aliexpress.us/w/wholesale-sunset-lamp.html", "Bring atmospheric sunset colors into your bedroom", "Active", 220),
  makeProduct("Flame Diffuser", "Home", "home", 6, 12, 3, 6, 34, 39, "65-75%", 2, "https://www.aliexpress.us/w/wholesale-flame-diffuser.html", "Ultrasonic cool mist with realistic flame lighting", "Active", 130),
  makeProduct("Self-Wringing Mop", "Home", "home", 5, 10, 3, 6, 29, 34, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-flat-mop-hands-free.html", "Hands-free self-wringing floor mop", "Active", 95),
  makeProduct("48-Piece Food Storage Containers", "Home", "home", 18.28, 18.28, 0, 0, 35, 35, "$16.73 est.", 4, "https://www.aliexpress.us/item/3256810417338983.html", "Kitchen container set for pantry prep leftovers and cleaner food storage", "Active", 140),
  makeProduct("Ceramic Wax Spray", "Automotive", "automotive", 4, 10, 3, 6, 29, 39, "60-70%", 1, "https://www.aliexpress.us/w/wholesale-ceramic-wax-spray.html", "Mirror-like shine and water beading", "Active", 180),
  makeProduct("Microfiber Wash Mitt", "Automotive", "automotive", 1, 3, 2, 4, 14, 19, "70-80%", 2, "https://www.aliexpress.us/w/wholesale-microfiber-wash-mitt.html", "Scratch-free car wash experience", "Active", 350),
  makeProduct("Interior Cleaner Wipes", "Automotive", "automotive", 2, 5, 2, 4, 19, 29, "65-75%", 3, "https://www.aliexpress.us/w/wholesale-interior-detailing-wipes.html", "Restore showroom matte look to dashboard", "Active", 240),
];

const navItems = [
  ["Dashboard", LayoutDashboard],
  ["Stores", Store],
  ["Products", Package],
  ["Research", Search],
  ["Experimentation", Sparkles],
  ["Imports", Import],
  ["Orders", ClipboardList],
  ["Customers", Users],
  ["Media", Play],
  ["Funnels", Mail],
  ["Analytics", BarChart3],
  ["AI Studio", Bot],
  ["SEO Hub", Globe2],
  ["Settings", Settings],
] as const;

function makeProduct(
  name: string,
  niche: string,
  subdomain: string,
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function normalizeMediaUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  const uploadPath = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.+)$/i)?.[1];
  if (uploadPath) return uploadPath;
  try {
    const parsed = new URL(trimmed);
    if ((parsed.hostname.endsWith(".plesk.page") || parsed.hostname === "70.35.207.102") && parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    // Relative paths are expected for local uploads.
  }
  return trimmed;
}

function App() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isBackendLoading, setIsBackendLoading] = React.useState(true);
  const [stores, setStores] = React.useState<Record<string, StorefrontNicheConfig>>(() => {
    try {
      const stored = localStorage.getItem("p4tp-stores-config");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stores config:", e);
    }
    const initialStores = { ...storefrontNiches };
    Object.keys(initialStores).forEach((key) => {
      if (!initialStores[key].status) {
        initialStores[key].status = "active";
      }
    });
    return initialStores;
  });

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [marketingLeads, setMarketingLeads] = React.useState<MarketingLead[]>(() => loadMarketingLeads());
  const [abandonedCarts, setAbandonedCarts] = React.useState<AbandonedCart[]>(() => loadAbandonedCarts());
  const [view, setView] = React.useState(() => (isStorefrontHash(window.location.hash) ? "storefront" : "admin"));
  const [isAdminAuthed, setIsAdminAuthed] = React.useState(() => loadAdminSession());
  const [activeNiche, setActiveNiche] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("Connecting to backend storage.");
  const [adminTab, setAdminTab] = React.useState("dashboard");
  const [seoArticles, setSeoArticles] = React.useState<Article[]>([]);
  const [seoKbArticles, setSeoKbArticles] = React.useState<KnowledgeArticle[]>([]);
  const [seoPages, setSeoPages] = React.useState<SeoPage[]>([]);
  const [seoDashboard, setSeoDashboard] = React.useState<SeoDashboardStats | null>(null);
  const [seoLoading, setSeoLoading] = React.useState(false);
  const [seoImprovingArticleId, setSeoImprovingArticleId] = React.useState("");
  const [seoGenTopic, setSeoGenTopic] = React.useState("");
  const [seoGenKeyword, setSeoGenKeyword] = React.useState("");
  const [seoGenNiche, setSeoGenNiche] = React.useState("beauty");
  const [seoGenTone, setSeoGenTone] = React.useState<"expert" | "friendly" | "premium" | "urgent">("expert");
  const [seoGenFunnelStage, setSeoGenFunnelStage] = React.useState<"awareness" | "consideration" | "decision">("consideration");
  const [seoGenPersona, setSeoGenPersona] = React.useState("");
  const [seoGenCtaStyle, setSeoGenCtaStyle] = React.useState<"soft" | "direct" | "limited_offer">("direct");
  const [seoPageGenCategory, setSeoPageGenCategory] = React.useState("");
  const [seoPageGenKeywords, setSeoPageGenKeywords] = React.useState("");
  const [seoPageGenNiche, setSeoPageGenNiche] = React.useState("beauty");
  const [seoProductGenId, setSeoProductGenId] = React.useState("");
  const [seoProductGenType, setSeoProductGenType] = React.useState<"article" | "sales_page">("article");
  const [seoProductGenAngle, setSeoProductGenAngle] = React.useState("");
  const [seoProductGenerating, setSeoProductGenerating] = React.useState(false);
  const [kbNewTitle, setKbNewTitle] = React.useState("");
  const [kbNewContent, setKbNewContent] = React.useState("");
  const [kbNewCategory, setKbNewCategory] = React.useState<"faq" | "tutorial" | "product_guide">("faq");
  const [kbNewNiche, setKbNewNiche] = React.useState("beauty");
  const [seoSitemapPreview, setSeoSitemapPreview] = React.useState("");
  const [seoSubTab, setSeoSubTab] = React.useState<"overview" | "articles" | "pages" | "kb" | "sitemap">("overview");
  const [seoFilterQuery, setSeoFilterQuery] = React.useState("");
  const [seoFilterNiche, setSeoFilterNiche] = React.useState("all");
  const [seoFilterStatus, setSeoFilterStatus] = React.useState("all");
  const [seoFilterKbCategory, setSeoFilterKbCategory] = React.useState("all");
  const [seoPreviewPageId, setSeoPreviewPageId] = React.useState("");
  const [seoPreviewedPageIds, setSeoPreviewedPageIds] = React.useState<string[]>([]);
  const [dbContacts, setDbContacts] = React.useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([]);
  const [mediaTitle, setMediaTitle] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState("");
  const [mediaKind, setMediaKind] = React.useState<"image" | "video">("image");
  const [mediaPlacement, setMediaPlacement] = React.useState<"library" | "listing" | "video_section">("library");
  const [mediaProductId, setMediaProductId] = React.useState("");
  const [mediaHandle, setMediaHandle] = React.useState("");
  const [mediaCaption, setMediaCaption] = React.useState("");
  const [mediaTag, setMediaTag] = React.useState("");
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [isSavingMedia, setIsSavingMedia] = React.useState(false);
  const [listingMediaProductId, setListingMediaProductId] = React.useState("");
  const [listingMediaAssetId, setListingMediaAssetId] = React.useState("");
  const [newCustomerEmail, setNewCustomerEmail] = React.useState("");
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerRole, setNewCustomerRole] = React.useState<"customer" | "admin">("customer");

  // Stores Manager Dialog States & Handlers
  const [editingStoreKey, setEditingStoreKey] = React.useState<string | null>(null);
  const [isStoreFormOpen, setIsStoreFormOpen] = React.useState(false);

  const saveStore = (key: string, storeData: StorefrontNicheConfig) => {
    setStores((current) => {
      const copy = { ...current, [key]: storeData };
      return copy;
    });
    setEditingStoreKey(null);
    setIsStoreFormOpen(false);
    setNotice(`Store "${storeData.label}" successfully saved.`);
  };

  const deleteStore = (key: string) => {
    if (["general", "beauty", "pets", "home", "fitness", "automotive"].includes(key)) {
      setNotice("Safety Alert: Default system stores cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the store "${stores[key]?.label || key}"? This cannot be undone.`)) {
      setStores((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
      setNotice(`Store "${key}" deleted.`);
    }
  };

  // Persist stores changes to localStorage
  React.useEffect(() => {
    localStorage.setItem("p4tp-stores-config", JSON.stringify(stores));
  }, [stores]);

  // Auto-switch empty Active stores to Review status
  React.useEffect(() => {
    if (isBackendLoading) return;
    let updated = false;
    const newStores = { ...stores };
    Object.keys(newStores).forEach((key) => {
      if (key === "general") return;
      const store = newStores[key];
      if (store.status === "active") {
        const activeProductCount = products.filter(
          (p) => p.subdomain === key && p.status === "Active"
        ).length;
        if (activeProductCount === 0) {
          store.status = "review";
          updated = true;
        }
      }
    });
    if (updated) {
      setStores(newStores);
      setNotice("Notice: One or more storefronts switched from Active to Review due to having 0 active products.");
    }
  }, [isBackendLoading, products, stores]);
  
  // AliExpress URL Importer States & Handler
  const [aliexpressUrl, setAliexpressUrl] = React.useState("");
  const [isImportingAliexpress, setIsImportingAliexpress] = React.useState(false);

  // AI Studio Dialog States
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [aiAction, setAiAction] = React.useState<"creative_hooks" | "email_flows" | "offer_tests" | null>(null);

  // System credentials settings state
  const [settingsStripeKey, setSettingsStripeKey] = React.useState("");
  const [settingsDatabaseUrl, setSettingsDatabaseUrl] = React.useState("");
  const [settingsMedusaUrl, setSettingsMedusaUrl] = React.useState("http://localhost:9000");
  const [settingsMedusaKey, setSettingsMedusaKey] = React.useState("");
  const [settingsGoogleClientId, setSettingsGoogleClientId] = React.useState("");
  const [settingsOpenAiKey, setSettingsOpenAiKey] = React.useState("");
  const [settingsAdminEmail, setSettingsAdminEmail] = React.useState(adminEmail);
  const [settingsAdminPassword, setSettingsAdminPassword] = React.useState("");
  const [settingsPublicSiteUrl, setSettingsPublicSiteUrl] = React.useState("");
  const [settingsPublicAppBase, setSettingsPublicAppBase] = React.useState("");
  const [settingsGa4Id, setSettingsGa4Id] = React.useState("");
  const [settingsMetaPixelId, setSettingsMetaPixelId] = React.useState("");
  const [settingsTiktokPixelId, setSettingsTiktokPixelId] = React.useState("");
  const [settingsTaxRate, setSettingsTaxRate] = React.useState("0.06");
  const [settingsFreeShipping, setSettingsFreeShipping] = React.useState("75");
  const [settingsFlatShipping, setSettingsFlatShipping] = React.useState("7");
  const [settingsConfigStatus, setSettingsConfigStatus] = React.useState<Record<string, any>>({});
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  const normalizedSeoQuery = seoFilterQuery.trim().toLowerCase();
  const seoFilteredArticles = React.useMemo(() => {
    return seoArticles.filter((art) => {
      const searchable = [art.title, art.slug, art.summary, art.content, art.keywords, art.niche, art.status].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalizedSeoQuery || searchable.includes(normalizedSeoQuery);
      const matchesNiche = seoFilterNiche === "all" || art.niche === seoFilterNiche;
      const matchesStatus = seoFilterStatus === "all" || art.status === seoFilterStatus;
      return matchesQuery && matchesNiche && matchesStatus;
    });
  }, [normalizedSeoQuery, seoArticles, seoFilterNiche, seoFilterStatus]);

  const seoFilteredPages = React.useMemo(() => {
    return seoPages.filter((page) => {
      const pageStatus = page.status || "published";
      const searchable = [page.title, page.slug, page.category_name, page.description, page.seo_title, page.seo_description, page.niche, pageStatus].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalizedSeoQuery || searchable.includes(normalizedSeoQuery);
      const matchesNiche = seoFilterNiche === "all" || page.niche === seoFilterNiche;
      const matchesStatus = seoFilterStatus === "all" || pageStatus === seoFilterStatus;
      return matchesQuery && matchesNiche && matchesStatus;
    });
  }, [normalizedSeoQuery, seoPages, seoFilterNiche, seoFilterStatus]);

  const seoFilteredKbArticles = React.useMemo(() => {
    return seoKbArticles.filter((kb) => {
      const searchable = [kb.title, kb.slug, kb.content, kb.category, kb.niche, kb.status].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalizedSeoQuery || searchable.includes(normalizedSeoQuery);
      const matchesNiche = seoFilterNiche === "all" || kb.niche === seoFilterNiche;
      const matchesStatus = seoFilterStatus === "all" || kb.status === seoFilterStatus;
      const matchesCategory = seoFilterKbCategory === "all" || kb.category === seoFilterKbCategory;
      return matchesQuery && matchesNiche && matchesStatus && matchesCategory;
    });
  }, [normalizedSeoQuery, seoFilterKbCategory, seoFilterNiche, seoFilterStatus, seoKbArticles]);

  const renderSeoContentFilters = ({
    resultCount,
    totalCount,
    showStatus = true,
    showKbCategory = false,
  }: {
    resultCount: number;
    totalCount: number;
    showStatus?: boolean;
    showKbCategory?: boolean;
  }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.6fr) repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end', margin: '14px 0', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
      <label style={{ display: 'grid', gap: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Search content</span>
        <input
          value={seoFilterQuery}
          onChange={(e) => setSeoFilterQuery(e.target.value)}
          placeholder="Title, slug, keyword, content..."
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
        />
      </label>
      <label style={{ display: 'grid', gap: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Niche</span>
        <select value={seoFilterNiche} onChange={(e) => setSeoFilterNiche(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
          <option value="all">All niches</option>
          <option value="beauty">Beauty</option>
          <option value="pets">Pets</option>
          <option value="home">Home</option>
          <option value="fitness">Fitness</option>
          <option value="automotive">Automotive</option>
        </select>
      </label>
      {showStatus && (
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Status</span>
          <select value={seoFilterStatus} onChange={(e) => setSeoFilterStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      )}
      {showKbCategory && (
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Category</span>
          <select value={seoFilterKbCategory} onChange={(e) => setSeoFilterKbCategory(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
            <option value="all">All categories</option>
            <option value="faq">FAQ</option>
            <option value="tutorial">Tutorial</option>
            <option value="product_guide">Product Guide</option>
          </select>
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{resultCount} / {totalCount}</span>
        <button
          type="button"
          onClick={() => {
            setSeoFilterQuery("");
            setSeoFilterNiche("all");
            setSeoFilterStatus("all");
            setSeoFilterKbCategory("all");
          }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>
    </div>
  );

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

  const applySettingsConfig = (config: any) => {
    setSettingsStripeKey(config.stripeSecretKey || "");
    setSettingsDatabaseUrl(config.databaseUrl || "");
    setSettingsMedusaUrl(config.medusaBackendUrl || "http://localhost:9000");
    setSettingsMedusaKey(config.medusaAdminApiKey || "");
    setSettingsGoogleClientId(config.googleClientId || "");
    setSettingsOpenAiKey(config.openAiApiKey || "");
    setSettingsAdminEmail(config.adminEmail || adminEmail);
    setSettingsAdminPassword(config.adminPassword || "");
    setSettingsPublicSiteUrl(config.publicSiteUrl || "");
    setSettingsPublicAppBase(config.publicAppBase || "");
    setSettingsGa4Id(config.ga4MeasurementId || "");
    setSettingsMetaPixelId(config.metaPixelId || "");
    setSettingsTiktokPixelId(config.tiktokPixelId || "");
    setSettingsTaxRate(config.basicTaxRate || "0.06");
    setSettingsFreeShipping(config.freeShippingThreshold || "75");
    setSettingsFlatShipping(config.flatShipping || "7");
    setSettingsConfigStatus(config);
  };

  const loadSettingsConfig = async () => {
    const configRes = await fetch(apiUrl("/settings/config"), { headers: adminRequestHeaders() });
    if (!configRes.ok) return false;
    const config = await configRes.json();
    applySettingsConfig(config);
    return true;
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setNotice("Saving system configurations in .env...");
    try {
      const adminHeaders = adminRequestHeaders({ "Content-Type": "application/json" });
      
      const response = await fetch(apiUrl("/settings/config"), {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          databaseUrl: settingsDatabaseUrl,
          stripeSecretKey: settingsStripeKey,
          medusaBackendUrl: settingsMedusaUrl,
          medusaAdminApiKey: settingsMedusaKey,
          googleClientId: settingsGoogleClientId,
          openAiApiKey: settingsOpenAiKey,
          adminEmail: settingsAdminEmail,
          adminPassword: settingsAdminPassword,
          publicSiteUrl: settingsPublicSiteUrl,
          publicAppBase: settingsPublicAppBase,
          ga4MeasurementId: settingsGa4Id,
          metaPixelId: settingsMetaPixelId,
          tiktokPixelId: settingsTiktokPixelId,
          basicTaxRate: settingsTaxRate,
          freeShippingThreshold: settingsFreeShipping,
          flatShipping: settingsFlatShipping,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Failed to save credentials (${response.status}). ${detail}`.trim());
      }

      const data = await response.json();
      setNotice(data.message || "Configurations updated successfully!");
      
      // Refresh current config view
      await loadSettingsConfig();
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
        await loadSettingsConfig();
      } catch (e) {
        console.warn("Failed to load environment credentials from settings endpoint:", e);
      }

      try {
        const [productResponse, orderResponse, contactResponse, mediaResponse] = await Promise.all([getProducts(), getOrders(), getContacts(), getMediaAssets()]);
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
        setMediaAssets(mediaResponse.assets || []);
        setIsBackendLoading(false);

      } catch (error) {
        if (!isMounted) return;
        setProducts(seedProducts);
        setIsBackendLoading(false);
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

  React.useEffect(() => {
    if (adminTab !== "seo-hub") return;
    const load = async () => {
      setSeoLoading(true);
      try {
        const [artRes, kbRes, pageRes, dashRes] = await Promise.all([
          getAdminArticles(),
          getAdminKbArticles(),
          getAdminSeoPages(),
          getSeoDashboard()
        ]);
        setSeoArticles(artRes.articles || []);
        setSeoKbArticles(kbRes.articles || []);
        setSeoPages(pageRes.pages || []);
        setSeoDashboard(dashRes);
      } catch (e) {
        console.warn("Failed to load SEO dashboard:", e);
      } finally {
        setSeoLoading(false);
      }
    };
    void load();
  }, [adminTab]);

  React.useEffect(() => {
    if (products.length === 0) {
      if (seoProductGenId) setSeoProductGenId("");
      return;
    }
    if (!seoProductGenId || !products.some((product) => product.id === seoProductGenId)) {
      setSeoProductGenId(products[0].id);
    }
  }, [products, seoProductGenId]);

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
  const adminContactCount = dbContacts.filter((contact) => contact.role === "admin").length;

  const changeContactRole = async (email: string, role: "customer" | "admin") => {
    if (email.toLowerCase() === adminEmail.toLowerCase() && role !== "admin") {
      setNotice("The primary admin email must remain an admin.");
      return;
    }
    try {
      const response = await updateContactRole(email, role);
      setDbContacts((current) =>
        current.map((contact) => (contact.email === email ? { ...contact, ...response.contact, role } : contact)),
      );
      setNotice(`${email} is now a ${role}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Role update failed: ${error.message}` : "Role update failed.");
    }
  };

  const addCustomerUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = newCustomerEmail.trim().toLowerCase();
    const name = newCustomerName.trim() || "Customer";
    if (!email) return;
    try {
      const response = await createContact({
        email,
        customerName: name,
        source: "admin",
        role: newCustomerRole,
      });
      const contact = {
        ...response.contact,
        email,
        customerName: response.contact?.customerName || name,
        address: response.contact?.address || "Added from Admin Customers",
        lastOrderId: response.contact?.lastOrderId || null,
        role: response.contact?.role || newCustomerRole,
        updatedAt: response.contact?.updatedAt || new Date().toISOString(),
      };
      setDbContacts((current) => [contact, ...current.filter((item) => item.email !== email)]);
      setNewCustomerEmail("");
      setNewCustomerName("");
      setNewCustomerRole("customer");
      setNotice(`${email} added as ${contact.role}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Customer add failed: ${error.message}` : "Customer add failed.");
    }
  };

  const resetMediaForm = () => {
    setMediaTitle("");
    setMediaUrl("");
    setMediaKind("image");
    setMediaPlacement("library");
    setMediaProductId("");
    setMediaHandle("");
    setMediaCaption("");
    setMediaTag("");
    setMediaFile(null);
  };

  const saveMediaAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = mediaTitle.trim() || mediaFile?.name.trim();
    if (!title || (!mediaFile && !mediaUrl.trim())) return;
    setIsSavingMedia(true);
    try {
      const baseInput = {
        title,
        kind: mediaKind,
        placement: mediaPlacement,
        productId: mediaProductId || undefined,
        handle: mediaHandle.trim() || undefined,
        caption: mediaCaption.trim() || undefined,
        tag: mediaTag.trim() || undefined,
      };
      const response = mediaFile
        ? await uploadMediaAsset({
            ...baseInput,
            fileName: mediaFile.name,
            mimeType: mediaFile.type || (mediaKind === "video" ? "video/mp4" : "image/jpeg"),
            dataUrl: await readFileAsDataUrl(mediaFile),
          })
        : await addMediaUrl({
            ...baseInput,
            url: mediaUrl.trim(),
          });
      setMediaAssets((current) => [response.asset, ...current.filter((asset) => asset.id !== response.asset.id)]);
      resetMediaForm();
      setNotice(`${response.asset.title} added to the media library.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Media save failed: ${error.message}` : "Media save failed.");
    } finally {
      setIsSavingMedia(false);
    }
  };

  const refreshMediaAssets = async () => {
    try {
      const response = await getAdminMediaAssets();
      setMediaAssets(response.assets || []);
      setNotice("Media library refreshed.");
    } catch (error) {
      setNotice(error instanceof Error ? `Media refresh failed: ${error.message}` : "Media refresh failed.");
    }
  };

  const removeMediaAsset = async (id: string) => {
    const asset = mediaAssets.find((item) => item.id === id);
    if (!asset || !window.confirm(`Delete "${asset.title}" from the media library?`)) return;
    try {
      await deleteMediaAsset(id);
      setMediaAssets((current) => current.filter((item) => item.id !== id));
      setNotice(`${asset.title} deleted from the media library.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Media delete failed: ${error.message}` : "Media delete failed.");
    }
  };

  const assignMediaToProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const asset = mediaAssets.find((item) => item.id === listingMediaAssetId && item.kind === "image");
    const product = products.find((item) => item.id === listingMediaProductId);
    if (!asset || !product) return;
    const nextImages = Array.from(new Set([normalizeMediaUrl(asset.url), ...(product.images || []).map(normalizeMediaUrl)]));
    const updatedProduct = { ...product, images: nextImages };
    try {
      const response = await saveApiProduct(updatedProduct);
      setProducts((current) => current.map((item) => (item.id === product.id ? response.product : item)));
      setNotice(`${asset.title} added to ${product.name}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Listing media update failed: ${error.message}` : "Listing media update failed.");
    }
  };

  const removeContact = async (email: string) => {
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      setNotice("The primary admin email cannot be removed.");
      return;
    }
    if (!window.confirm(`Remove ${email} from the customer directory? This also removes their saved profile data.`)) return;
    try {
      await deleteContact(email);
      setDbContacts((current) => current.filter((contact) => contact.email !== email));
      setNotice(`${email} removed from the customer directory.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Customer removal failed: ${error.message}` : "Customer removal failed.");
    }
  };

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

    saveAdminSession(adminEmail);
    setIsAdminAuthed(true);
    setNotice("Admin session started.");
    return true;
  };

  const logoutAdmin = () => {
    clearUnifiedAuthSession();
    setIsAdminAuthed(false);
    window.location.hash = "#admin-login";
  };

  const captureMarketingLead = async (lead: Omit<MarketingLead, "id" | "createdAt">) => {
    const normalizedEmail = lead.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) return;

    setMarketingLeads((current) => upsertMarketingLead(current, { ...lead, email: normalizedEmail }));
    
    try {
      await fetch(apiUrl("/contacts"), {
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

  const isSetupValuePresent = (value?: string) => Boolean(value && value.trim() && !value.includes("replace_me") && !value.includes("change-this-password"));
  const setupItems = [
    {
      label: "Database",
      detail: settingsConfigStatus.databaseMode || (settingsConfigStatus.hasDatabaseUrl ? "PostgreSQL configured" : "Local fallback active"),
      ready: Boolean(settingsConfigStatus.hasDatabaseUrl || isSetupValuePresent(settingsDatabaseUrl)),
      icon: Database,
    },
    {
      label: "Stripe Checkout",
      detail: settingsConfigStatus.hasStripeKey || isSetupValuePresent(settingsStripeKey) ? "Live checkout key saved" : "Simulator mode active",
      ready: Boolean(settingsConfigStatus.hasStripeKey || isSetupValuePresent(settingsStripeKey)),
      icon: CreditCard,
    },
    {
      label: "Google Login",
      detail: settingsConfigStatus.hasGoogleClientId || isSetupValuePresent(settingsGoogleClientId) ? "OAuth client configured" : "Auth simulator active",
      ready: Boolean(settingsConfigStatus.hasGoogleClientId || isSetupValuePresent(settingsGoogleClientId)),
      icon: User,
    },
    {
      label: "AI Tools",
      detail: settingsConfigStatus.hasOpenAiApiKey || isSetupValuePresent(settingsOpenAiKey) ? "AI provider key saved" : "Template AI mode active",
      ready: Boolean(settingsConfigStatus.hasOpenAiApiKey || isSetupValuePresent(settingsOpenAiKey)),
      icon: Bot,
    },
    {
      label: "Medusa",
      detail: settingsConfigStatus.hasMedusaAdminApiKey || isSetupValuePresent(settingsMedusaKey) ? "Backend and admin key configured" : "Mock Medusa available",
      ready: Boolean(isSetupValuePresent(settingsMedusaUrl) && (settingsConfigStatus.hasMedusaAdminApiKey || isSetupValuePresent(settingsMedusaKey))),
      icon: Database,
    },
    {
      label: "Analytics",
      detail: isSetupValuePresent(settingsGa4Id) || isSetupValuePresent(settingsMetaPixelId) || isSetupValuePresent(settingsTiktokPixelId) ? "Tracking IDs configured" : "No pixels connected",
      ready: Boolean(isSetupValuePresent(settingsGa4Id) || isSetupValuePresent(settingsMetaPixelId) || isSetupValuePresent(settingsTiktokPixelId)),
      icon: LineChart,
    },
  ];
  const setupReadyCount = setupItems.filter((item) => item.ready).length;

  if (view === "storefront" && isBackendLoading) {
    return (
      <main className="store-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f9fa', color: '#11191d', padding: '24px' }}>
        <section style={{ display: 'grid', gap: '12px', justifyItems: 'center', textAlign: 'center' }}>
          <Store size={34} />
          <div>
            <p style={{ margin: '0 0 4px', color: '#68777d', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Products4ThePeople</p>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>Loading storefront</h1>
          </div>
        </section>
      </main>
    );
  }

  if (view === "storefront") {
    return (
      <Storefront
        products={products.filter((product) => product.status === "Active")}
        initialMode={getStorefrontModeFromHash()}
        stores={stores}
        orders={orders}
        mediaAssets={mediaAssets}
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
          window.location.hash = "#products4thepeople";
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
            <h1>Commerce Command Center <span style={{ fontSize: '0.45em', opacity: 0.6, fontWeight: 'normal', backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px', verticalAlign: 'middle', display: 'inline-block' }}>v{APP_VERSION}</span></h1>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={() => {
              window.location.hash = "#products4thepeople";
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

        {adminTab === "research" && (
          <ResearchWorkspace products={products} setProducts={setProducts} setNotice={setNotice} />
        )}

        {adminTab === "experimentation" && (
          <ExperimentationWorkspace
            products={products}
            setProducts={setProducts}
            stores={stores}
            setStores={setStores}
            setNotice={setNotice}
          />
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
                <QueueRow label="Admin users" value={adminContactCount.toString()} />
                <QueueRow label="LocalStorage emails" value={marketingLeads.length.toString()} />
                <QueueRow label="Open abandoned carts" value={openAbandonedCarts.length.toString()} />
                <QueueRow label="Recovered carts" value={recoveredAbandonedCarts.length.toString()} />
              </div>
            </article>

            <article className="panel" id="customer-add">
              <div className="panel-header">
                <div>
                  <p>User management</p>
                  <h2>Add customer or admin</h2>
                </div>
                <Plus size={22} />
              </div>
              <form onSubmit={addCustomerUser} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(180px, 0.8fr) minmax(140px, 0.5fr) auto', gap: '10px', alignItems: 'end', marginTop: '16px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Email</span>
                  <input
                    type="email"
                    value={newCustomerEmail}
                    onChange={(event) => setNewCustomerEmail(event.target.value)}
                    placeholder="customer@example.com"
                    required
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Name</span>
                  <input
                    value={newCustomerName}
                    onChange={(event) => setNewCustomerName(event.target.value)}
                    placeholder="Customer name"
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Role</span>
                  <select
                    value={newCustomerRole}
                    onChange={(event) => setNewCustomerRole(event.target.value as "customer" | "admin")}
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button type="submit" className="primary" style={{ minHeight: '40px', borderRadius: '8px', border: 'none', background: '#176c61', color: 'white', fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}>
                  Add User
                </button>
              </form>
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
                      <th>Role</th>
                      <th>Capture Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbContacts.length === 0 ? (
                      <tr>
                        <td colSpan={7}>No customer profiles in database yet. Try checking out on the storefront or subscribing to the email wheel!</td>
                      </tr>
                    ) : dbContacts.map((contact) => (
                      <tr key={contact.email}>
                        <td><strong>{contact.email}</strong></td>
                        <td>{contact.customerName}</td>
                        <td className="hook">{contact.address}</td>
                        <td><strong>{contact.lastOrderId || "None"}</strong></td>
                        <td>
                          <select
                            className={`status-select ${contact.role === "admin" ? "active" : "review"}`}
                            value={contact.role || "customer"}
                            onChange={(event) => changeContactRole(contact.email, event.target.value as "customer" | "admin")}
                            disabled={contact.email?.toLowerCase() === adminEmail.toLowerCase()}
                          >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{formatDate(contact.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeContact(contact.email)}
                            disabled={contact.email?.toLowerCase() === adminEmail.toLowerCase()}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: contact.email?.toLowerCase() === adminEmail.toLowerCase() ? 'not-allowed' : 'pointer', opacity: contact.email?.toLowerCase() === adminEmail.toLowerCase() ? 0.55 : 1 }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {adminTab === "media" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(460px, 1.25fr)', gap: '16px', alignItems: 'start' }}>
            <article className="panel" id="media-upload">
              <div className="panel-header">
                <div>
                  <p>Media manager</p>
                  <h2>Upload or add URL</h2>
                </div>
                <Play size={22} />
              </div>
              <form onSubmit={saveMediaAsset} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>File upload</span>
                  <input
                    accept="image/*,video/*"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setMediaFile(file);
                      if (file) {
                        if (!mediaTitle.trim()) setMediaTitle(file.name.replace(/\.[^.]+$/, ""));
                        if (file.type.startsWith("video/")) setMediaKind("video");
                        if (file.type.startsWith("image/")) setMediaKind("image");
                      }
                    }}
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', background: '#ffffff', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#68777d' }}>Use this for product photos, gallery images, and short video-section clips.</span>
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Hosted media URL</span>
                  <input
                    value={mediaUrl}
                    onChange={(event) => setMediaUrl(event.target.value)}
                    placeholder="https://..."
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Title</span>
                    <input
                      value={mediaTitle}
                      onChange={(event) => setMediaTitle(event.target.value)}
                      placeholder="Hero demo clip"
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Kind</span>
                    <select
                      value={mediaKind}
                      onChange={(event) => setMediaKind(event.target.value as "image" | "video")}
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Placement</span>
                    <select
                      value={mediaPlacement}
                      onChange={(event) => setMediaPlacement(event.target.value as MediaAsset["placement"])}
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    >
                      <option value="library">Library only</option>
                      <option value="listing">Product listing</option>
                      <option value="video_section">Video section</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Product</span>
                    <select
                      value={mediaProductId}
                      onChange={(event) => setMediaProductId(event.target.value)}
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    >
                      <option value="">No product link</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Creator handle</span>
                    <input
                      value={mediaHandle}
                      onChange={(event) => setMediaHandle(event.target.value)}
                      placeholder="@creator"
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tag</span>
                    <input
                      value={mediaTag}
                      onChange={(event) => setMediaTag(event.target.value)}
                      placeholder="Beauty, Demo, UGC"
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    />
                  </label>
                </div>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Caption</span>
                  <textarea
                    value={mediaCaption}
                    onChange={(event) => setMediaCaption(event.target.value)}
                    placeholder="Short caption for the video section or internal note."
                    rows={3}
                    style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={resetMediaForm} style={{ border: '1px solid #dce3e7', background: '#ffffff', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                    Clear
                  </button>
                  <button className="primary" type="submit" disabled={isSavingMedia || (!mediaFile && !mediaUrl.trim())} style={{ border: 'none', background: '#176c61', color: '#ffffff', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
                    {isSavingMedia ? "Saving..." : "Save media"}
                  </button>
                </div>
              </form>
            </article>

            <div style={{ display: 'grid', gap: '16px' }}>
              <article className="panel" id="listing-media">
                <div className="panel-header">
                  <div>
                    <p>Listing media</p>
                    <h2>Add image to product gallery</h2>
                  </div>
                  <Package size={22} />
                </div>
                <form onSubmit={assignMediaToProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end', marginTop: '16px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Product</span>
                    <select
                      value={listingMediaProductId}
                      onChange={(event) => setListingMediaProductId(event.target.value)}
                      required
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    >
                      <option value="">Choose product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Image asset</span>
                    <select
                      value={listingMediaAssetId}
                      onChange={(event) => setListingMediaAssetId(event.target.value)}
                      required
                      style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                    >
                      <option value="">Choose image</option>
                      {mediaAssets.filter((asset) => asset.kind === "image").map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.title}</option>
                      ))}
                    </select>
                  </label>
                  <button className="primary" type="submit" style={{ border: 'none', background: '#176c61', color: '#ffffff', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                    Attach
                  </button>
                </form>
              </article>

              <article className="panel wide" id="media-library">
                <div className="panel-header">
                  <div>
                    <p>Media library</p>
                    <h2>{mediaAssets.length} saved assets</h2>
                  </div>
                  <button type="button" onClick={refreshMediaAssets} style={{ border: '1px solid #dce3e7', background: '#ffffff', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>
                    Refresh
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {mediaAssets.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '24px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
                      No media assets yet. Upload a file or paste a hosted URL to start building the library.
                    </div>
                  ) : mediaAssets.map((asset) => {
                    const product = asset.productId ? products.find((item) => item.id === asset.productId) : null;
                    return (
                      <div key={asset.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', display: 'grid', gridTemplateRows: '150px auto' }}>
                        <div style={{ background: '#0f172a', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                          {asset.kind === "video" ? (
                            <video src={normalizeMediaUrl(asset.url)} controls muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={normalizeMediaUrl(asset.url)} alt={asset.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ padding: '12px', display: 'grid', gap: '8px' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13.5px', color: '#111827' }}>{asset.title}</strong>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{asset.kind} / {asset.placement}{product ? ` / ${product.name}` : ""}</span>
                          </div>
                          {(asset.handle || asset.caption) && (
                            <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: 1.45 }}>{asset.handle ? `${asset.handle}: ` : ""}{asset.caption}</p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={normalizeMediaUrl(asset.url)} target="_blank" rel="noreferrer" style={{ color: '#176c61', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
                              Open
                            </a>
                            <button type="button" onClick={() => removeMediaAsset(asset.id)} style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.75fr) minmax(420px, 1.25fr)', gap: '16px', alignItems: 'start' }}>
            <article className="panel" id="settings-readiness">
              <div className="panel-header">
                <div>
                  <p>Setup readiness</p>
                  <h2>{setupReadyCount}/{setupItems.length} systems connected</h2>
                </div>
                <Settings size={22} />
              </div>
              <div className="readiness-grid" style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                {setupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #edf2f5' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'grid', placeItems: 'center', background: item.ready ? '#dcfce7' : '#fef3c7', color: item.ready ? '#166534' : '#92400e' }}>
                        <Icon size={15} />
                      </span>
                      <span style={{ display: 'grid', gap: '2px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#1f2937' }}>{item.label}</strong>
                        <small style={{ color: '#68777d', fontSize: '12px' }}>{item.detail}</small>
                      </span>
                      <span style={{ borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, background: item.ready ? '#dcfce7' : '#fef3c7', color: item.ready ? '#166534' : '#92400e' }}>
                        {item.ready ? 'Ready' : 'Setup'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', color: '#64748b', fontSize: '12.5px', lineHeight: 1.5 }}>
                Database, Google OAuth, admin credentials, and Vite public keys require an API restart or production rebuild after saving.
              </div>
            </article>

            <article className="panel" id="settings-setup">
              <div className="panel-header">
                <div>
                  <p>Integration Manager</p>
                  <h2>Connection setup</h2>
                </div>
                <Globe2 size={22} />
              </div>
              <form onSubmit={handleSaveConfig} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} /> Admin & database</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'grid', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Admin Email</span>
                      <input type="email" value={settingsAdminEmail} onChange={(e) => setSettingsAdminEmail(e.target.value)} placeholder="admin@products4thepeople.com" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Admin Password</span>
                      <input type="password" value={settingsAdminPassword} onChange={(e) => setSettingsAdminPassword(e.target.value)} placeholder="Set a strong password" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                    </label>
                  </div>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>PostgreSQL Database URL</span>
                    <input type="password" value={settingsDatabaseUrl} onChange={(e) => setSettingsDatabaseUrl(e.target.value)} placeholder="postgres://user:password@host:5432/products4thepeople" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                    <span style={{ fontSize: '11px', color: '#68777d' }}>Leave blank for local file fallback. Restart the API after changing this.</span>
                  </label>
                </div>

                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16} /> Payments & commerce</h3>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Stripe Secret Key</span>
                    <input type="password" value={settingsStripeKey} onChange={(e) => setSettingsStripeKey(e.target.value)} placeholder="sk_test_..." style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                    <span style={{ fontSize: '11px', color: '#68777d' }}>Keep blank to use the checkout simulator during testing.</span>
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Medusa Backend URL</span>
                    <input type="text" value={settingsMedusaUrl} onChange={(e) => setSettingsMedusaUrl(e.target.value)} placeholder="http://localhost:9000" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Medusa Admin API Key</span>
                    <input type="password" value={settingsMedusaKey} onChange={(e) => setSettingsMedusaKey(e.target.value)} placeholder="api_key_..." style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                  </label>
                </div>

                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><Bot size={16} /> Login, AI & analytics</h3>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Google OAuth Client ID</span>
                    <input type="text" value={settingsGoogleClientId} onChange={(e) => setSettingsGoogleClientId(e.target.value)} placeholder="1234567890-abc.apps.googleusercontent.com" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>AI Provider API Key</span>
                    <input type="password" value={settingsOpenAiKey} onChange={(e) => setSettingsOpenAiKey(e.target.value)} placeholder="sk-..." style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>GA4 ID</span><input type="text" value={settingsGa4Id} onChange={(e) => setSettingsGa4Id(e.target.value)} placeholder="G-..." style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Meta Pixel</span><input type="text" value={settingsMetaPixelId} onChange={(e) => setSettingsMetaPixelId(e.target.value)} placeholder="Pixel ID" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>TikTok Pixel</span><input type="text" value={settingsTiktokPixelId} onChange={(e) => setSettingsTiktokPixelId(e.target.value)} placeholder="Pixel ID" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                  </div>
                </div>

                <div style={{ background: '#f7f9fa', border: '1px solid #e1e7eb', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                  <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600, color: '#176c61', display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={16} /> Site, tax & shipping</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Public Site URL</span><input type="text" value={settingsPublicSiteUrl} onChange={(e) => setSettingsPublicSiteUrl(e.target.value)} placeholder="https://products4thepeople.com" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Public App Base</span><input type="text" value={settingsPublicAppBase} onChange={(e) => setSettingsPublicAppBase(e.target.value)} placeholder="/Products4thePeople/" style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Tax Rate</span><input type="number" step="0.001" value={settingsTaxRate} onChange={(e) => setSettingsTaxRate(e.target.value)} style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Free Shipping</span><input type="number" step="0.01" value={settingsFreeShipping} onChange={(e) => setSettingsFreeShipping(e.target.value)} style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                    <label style={{ display: 'grid', gap: '6px' }}><span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Flat Shipping</span><input type="number" step="0.01" value={settingsFlatShipping} onChange={(e) => setSettingsFlatShipping(e.target.value)} style={{ background: '#ffffff', border: '1px solid #dce3e7', borderRadius: '8px', padding: '10px', fontSize: '14px', width: '100%', outline: 'none' }} /></label>
                  </div>
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

        {adminTab === "seo-hub" && (
          <>
            {/* Sub-tab navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              {(["overview", "articles", "pages", "kb", "sitemap"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSeoSubTab(tab)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: seoSubTab === tab ? 700 : 500,
                    background: seoSubTab === tab ? '#ffffff' : 'transparent',
                    color: seoSubTab === tab ? '#176c61' : '#64748b',
                    boxShadow: seoSubTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {seoLoading && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Loading SEO data…</p>}

            {/* Overview Tab */}
            {!seoLoading && seoSubTab === "overview" && (
              <>
                <article className="panel" style={{ marginBottom: '20px' }}>
                  <div className="panel-header">
                    <div>
                      <p>Product SEO Generator</p>
                      <h2>Turn a product into content</h2>
                    </div>
                    <Sparkles size={22} />
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const selectedProductId = seoProductGenId || products[0]?.id || "";
                      if (!selectedProductId) {
                        setNotice("Add or import a product before generating product-led SEO content.");
                        return;
                      }
                      setSeoProductGenerating(true);
                      try {
                        if (seoProductGenType === "article") {
                          const res = await generateArticleFromProduct(selectedProductId, seoProductGenAngle, {
                            tone: seoGenTone,
                            funnelStage: seoGenFunnelStage,
                            persona: seoGenPersona,
                            ctaStyle: seoGenCtaStyle,
                          });
                          setSeoArticles((prev) => [res.article, ...prev]);
                          setSeoSubTab("articles");
                          setNotice(`Generated draft article: ${res.article.title}`);
                        } else {
                          const res = await generateSeoPageFromProduct(selectedProductId, seoProductGenAngle);
                          setSeoPages((prev) => [res.page, ...prev]);
                          setSeoSubTab("pages");
                          setNotice(`Generated sales page: ${res.page.title}`);
                        }
                        setSeoProductGenAngle("");
                      } catch (err) {
                        console.error("Product SEO generation failed:", err);
                        setNotice(err instanceof Error ? `Product SEO generation failed: ${err.message}` : "Product SEO generation failed.");
                      } finally {
                        setSeoProductGenerating(false);
                      }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}
                  >
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Product</span>
                      <select
                        value={seoProductGenId}
                        onChange={(e) => setSeoProductGenId(e.target.value)}
                        disabled={products.length === 0}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}
                      >
                        {products.length === 0 ? (
                          <option value="">No products available</option>
                        ) : (
                          products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.subdomain || product.niche})
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Output</span>
                      <select
                        value={seoProductGenType}
                        onChange={(e) => setSeoProductGenType(e.target.value as "article" | "sales_page")}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}
                      >
                        <option value="article">Educational article</option>
                        <option value="sales_page">Sales page</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Problem / Angle</span>
                      <input
                        value={seoProductGenAngle}
                        onChange={(e) => setSeoProductGenAngle(e.target.value)}
                        placeholder="e.g. reduce morning routine time, cleaner car interiors, easier pet grooming"
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tone</span>
                      <select value={seoGenTone} onChange={(e) => setSeoGenTone(e.target.value as typeof seoGenTone)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="expert">Expert</option>
                        <option value="friendly">Friendly</option>
                        <option value="premium">Premium</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Funnel Stage</span>
                      <select value={seoGenFunnelStage} onChange={(e) => setSeoGenFunnelStage(e.target.value as typeof seoGenFunnelStage)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="awareness">Awareness</option>
                        <option value="consideration">Consideration</option>
                        <option value="decision">Decision</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>CTA Style</span>
                      <select value={seoGenCtaStyle} onChange={(e) => setSeoGenCtaStyle(e.target.value as typeof seoGenCtaStyle)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="soft">Soft</option>
                        <option value="direct">Direct</option>
                        <option value="limited_offer">Limited offer</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Target Persona</span>
                      <input value={seoGenPersona} onChange={(e) => setSeoGenPersona(e.target.value)} maxLength={120} placeholder="e.g. first-time skincare buyers" style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <button
                      type="submit"
                      disabled={seoProductGenerating || products.length === 0}
                      className="primary"
                      style={{ gridColumn: '1 / -1', padding: '10px', borderRadius: '8px', border: 'none', background: '#176c61', color: 'white', fontWeight: 600, fontSize: '14px', cursor: products.length === 0 ? 'not-allowed' : 'pointer', opacity: products.length === 0 ? 0.65 : 1 }}
                    >
                      {seoProductGenerating ? 'Generating...' : 'Generate From Product'}
                    </button>
                  </form>
                </article>

                <section className="metrics-grid" id="seo-metrics">
                  <Metric icon={Eye} label="Organic Views" value={seoDashboard?.summary.totalViews?.toLocaleString() || "0"} trend="All content pages" />
                  <Metric icon={TrendingUp} label="Conversions" value={seoDashboard?.summary.totalConversions?.toLocaleString() || "0"} trend="From organic traffic" />
                  <Metric icon={CircleDollarSign} label="SEO Revenue" value={`$${(seoDashboard?.summary.totalRevenue || 0).toFixed(2)}`} trend="Attributed to content" />
                  <Metric icon={Globe2} label="Indexed URLs" value={seoDashboard?.summary.indexedUrls?.toLocaleString() || "0"} trend="Sitemap entries" />
                </section>

                {seoDashboard?.leaderboard && seoDashboard.leaderboard.length > 0 && (
                  <article className="panel" style={{ marginTop: '20px' }}>
                    <div className="panel-header">
                      <div>
                        <p>Content performance</p>
                        <h2>Leaderboard</h2>
                      </div>
                      <BarChart3 size={22} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Title</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Niche</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Views</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Conv.</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seoDashboard.leaderboard.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.name}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ background: item.type === 'article' ? '#dbeafe' : '#fef3c7', color: item.type === 'article' ? '#1e40af' : '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>{item.type}</span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.niche}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>{item.views.toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.conversions}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#176c61' }}>${item.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}
              </>
            )}

            {/* Articles Tab */}
            {!seoLoading && seoSubTab === "articles" && (
              <>
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <p>AI Content Engine</p>
                      <h2>Generate Blog Article</h2>
                    </div>
                    <Bot size={22} />
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!seoGenTopic.trim()) return;
                      setSeoLoading(true);
                      try {
                        const res = await generateArticle(seoGenNiche, seoGenTopic, seoGenKeyword, {
                          tone: seoGenTone,
                          funnelStage: seoGenFunnelStage,
                          persona: seoGenPersona,
                          ctaStyle: seoGenCtaStyle,
                        });
                        setSeoArticles((prev) => [res.article, ...prev]);
                        setSeoGenTopic("");
                        setSeoGenKeyword("");
                        setSeoGenPersona("");
                      } catch (err) {
                        console.error("Article generation failed:", err);
                      } finally {
                        setSeoLoading(false);
                      }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}
                  >
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Niche</span>
                      <select value={seoGenNiche} onChange={(e) => setSeoGenNiche(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="beauty">Beauty</option>
                        <option value="pets">Pets</option>
                        <option value="home">Home</option>
                        <option value="fitness">Fitness</option>
                        <option value="automotive">Automotive</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Target Keyword</span>
                      <input value={seoGenKeyword} onChange={(e) => setSeoGenKeyword(e.target.value)} placeholder="e.g. led face mask" style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Topic / Prompt</span>
                      <input value={seoGenTopic} onChange={(e) => setSeoGenTopic(e.target.value)} placeholder="e.g. Benefits of LED light therapy for anti-aging" required style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tone</span>
                      <select value={seoGenTone} onChange={(e) => setSeoGenTone(e.target.value as typeof seoGenTone)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="expert">Expert</option>
                        <option value="friendly">Friendly</option>
                        <option value="premium">Premium</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Funnel Stage</span>
                      <select value={seoGenFunnelStage} onChange={(e) => setSeoGenFunnelStage(e.target.value as typeof seoGenFunnelStage)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="awareness">Awareness</option>
                        <option value="consideration">Consideration</option>
                        <option value="decision">Decision</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>CTA Style</span>
                      <select value={seoGenCtaStyle} onChange={(e) => setSeoGenCtaStyle(e.target.value as typeof seoGenCtaStyle)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="soft">Soft</option>
                        <option value="direct">Direct</option>
                        <option value="limited_offer">Limited offer</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Target Persona</span>
                      <input value={seoGenPersona} onChange={(e) => setSeoGenPersona(e.target.value)} maxLength={120} placeholder="e.g. busy pet parents" style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <button type="submit" disabled={seoLoading} className="primary" style={{ gridColumn: '1 / -1', padding: '10px', borderRadius: '8px', border: 'none', background: '#176c61', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      {seoLoading ? 'Generating…' : 'Generate AI Article'}
                    </button>
                  </form>
                </article>

                <article className="panel" style={{ marginTop: '16px' }}>
                  <div className="panel-header">
                    <div>
                      <p>Content Library</p>
                      <h2>Articles ({seoFilteredArticles.length}/{seoArticles.length})</h2>
                    </div>
                    <BookOpen size={22} />
                  </div>
                  {renderSeoContentFilters({ resultCount: seoFilteredArticles.length, totalCount: seoArticles.length })}
                  {seoArticles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No articles yet. Generate your first one above.</p>
                  ) : seoFilteredArticles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No articles match the current filters.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Title</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Niche</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Views</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seoFilteredArticles.map((art) => (
                            <tr key={art.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{art.title}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{art.niche}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ background: art.status === 'published' ? '#dcfce7' : art.status === 'draft' ? '#fef3c7' : '#f1f5f9', color: art.status === 'published' ? '#166534' : art.status === 'draft' ? '#92400e' : '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>{art.status}</span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{art.views}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {art.status === 'draft' && (
                                  <>
                                    <button type="button" disabled={Boolean(seoImprovingArticleId)} onClick={async () => {
                                      setSeoImprovingArticleId(`${art.id}:improve`);
                                      try {
                                        const res = await improveArticle(art.id, "improve", {
                                          tone: seoGenTone,
                                          funnelStage: seoGenFunnelStage,
                                          persona: seoGenPersona,
                                          ctaStyle: seoGenCtaStyle,
                                        });
                                        setSeoArticles((prev) => prev.map((a) => a.id === art.id ? res.article : a));
                                        setNotice(`Improved draft: ${res.article.title}`);
                                      } catch (err) {
                                        console.error(err);
                                        setNotice(err instanceof Error ? `Draft improvement failed: ${err.message}` : "Draft improvement failed.");
                                      } finally {
                                        setSeoImprovingArticleId("");
                                      }
                                    }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #7c3aed', background: '#f5f3ff', color: '#6d28d9', fontSize: '12px', fontWeight: 600, cursor: seoImprovingArticleId ? 'not-allowed' : 'pointer', opacity: seoImprovingArticleId === `${art.id}:improve` ? 0.65 : 1 }}>
                                      {seoImprovingArticleId === `${art.id}:improve` ? 'Improving...' : 'Improve'}
                                    </button>
                                    <button type="button" disabled={Boolean(seoImprovingArticleId)} onClick={async () => {
                                      setSeoImprovingArticleId(`${art.id}:regenerate`);
                                      try {
                                        const res = await improveArticle(art.id, "regenerate", {
                                          tone: seoGenTone,
                                          funnelStage: seoGenFunnelStage,
                                          persona: seoGenPersona,
                                          ctaStyle: seoGenCtaStyle,
                                        });
                                        setSeoArticles((prev) => prev.map((a) => a.id === art.id ? res.article : a));
                                        setNotice(`Regenerated draft: ${res.article.title}`);
                                      } catch (err) {
                                        console.error(err);
                                        setNotice(err instanceof Error ? `Draft regeneration failed: ${err.message}` : "Draft regeneration failed.");
                                      } finally {
                                        setSeoImprovingArticleId("");
                                      }
                                    }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: seoImprovingArticleId ? 'not-allowed' : 'pointer', opacity: seoImprovingArticleId === `${art.id}:regenerate` ? 0.65 : 1 }}>
                                      {seoImprovingArticleId === `${art.id}:regenerate` ? 'Regenerating...' : 'Regenerate'}
                                    </button>
                                    <button type="button" onClick={async () => {
                                      try {
                                        const res = await updateArticle(art.id, { status: 'published', published_at: new Date().toISOString() });
                                        setSeoArticles((prev) => prev.map((a) => a.id === art.id ? res.article : a));
                                      } catch (err) { console.error(err); }
                                    }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #176c61', background: '#f0fdf4', color: '#176c61', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
                                  </>
                                )}
                                <button type="button" onClick={async () => {
                                  try {
                                    await deleteArticle(art.id);
                                    setSeoArticles((prev) => prev.filter((a) => a.id !== art.id));
                                  } catch (err) { console.error(err); }
                                }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              </>
            )}

            {/* Programmatic Pages Tab */}
            {!seoLoading && seoSubTab === "pages" && (
              <>
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <p>Category SEO</p>
                      <h2>Generate Landing Page</h2>
                    </div>
                    <Layers size={22} />
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!seoPageGenCategory.trim()) return;
                      setSeoLoading(true);
                      try {
                        const res = await generateSeoPage(seoPageGenNiche, seoPageGenCategory, seoPageGenKeywords);
                        setSeoPages((prev) => [res.page, ...prev]);
                        setSeoPageGenCategory("");
                        setSeoPageGenKeywords("");
                      } catch (err) {
                        console.error("Page generation failed:", err);
                      } finally {
                        setSeoLoading(false);
                      }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}
                  >
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Niche</span>
                      <select value={seoPageGenNiche} onChange={(e) => setSeoPageGenNiche(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="beauty">Beauty</option>
                        <option value="pets">Pets</option>
                        <option value="home">Home</option>
                        <option value="fitness">Fitness</option>
                        <option value="automotive">Automotive</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Keywords</span>
                      <input value={seoPageGenKeywords} onChange={(e) => setSeoPageGenKeywords(e.target.value)} placeholder="e.g. face masks, skincare" style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Category Name</span>
                      <input value={seoPageGenCategory} onChange={(e) => setSeoPageGenCategory(e.target.value)} placeholder="e.g. Face Masks" required style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <button type="submit" disabled={seoLoading} className="primary" style={{ gridColumn: '1 / -1', padding: '10px', borderRadius: '8px', border: 'none', background: '#176c61', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      {seoLoading ? 'Generating…' : 'Generate Category Page'}
                    </button>
                  </form>
                </article>

                <article className="panel" style={{ marginTop: '16px' }}>
                  <div className="panel-header">
                    <div>
                      <p>Landing Pages</p>
                      <h2>Category Pages ({seoFilteredPages.length}/{seoPages.length})</h2>
                    </div>
                    <Layers size={22} />
                  </div>
                  {renderSeoContentFilters({ resultCount: seoFilteredPages.length, totalCount: seoPages.length })}
                  {seoPages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No category pages generated yet.</p>
                  ) : seoFilteredPages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No category pages match the current filters.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Title</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Slug</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Niche</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Views</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Conv.</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seoFilteredPages.map((page) => {
                            const pageStatus = page.status || "published";
                            const canonicalUrl = `https://products4thepeople.com/#/c/${page.slug}`;
                            const schemaPreview = page.schema_markup
                              ? JSON.stringify(page.schema_markup, null, 2)
                              : "{}";
                            const seoTitle = page.seo_title || page.title;
                            const seoDescription = page.seo_description || page.description;
                            const hasPreviewed = seoPreviewedPageIds.includes(page.id);
                            const isPreviewOpen = seoPreviewPageId === page.id;
                            const canPublish = pageStatus === "published" || hasPreviewed;
                            return (
                              <React.Fragment key={page.id}>
                                <tr style={{ borderBottom: isPreviewOpen ? 'none' : '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{page.title}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>/c/{page.slug}</code>
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{page.niche}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ background: pageStatus === 'published' ? '#dcfce7' : '#fef3c7', color: pageStatus === 'published' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>{pageStatus}</span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{page.views}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{page.conversions}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                      <button type="button" onClick={() => {
                                        setSeoPreviewPageId((current) => current === page.id ? "" : page.id);
                                        setSeoPreviewedPageIds((prev) => prev.includes(page.id) ? prev : [...prev, page.id]);
                                      }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #2563eb', background: isPreviewOpen ? '#dbeafe' : '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                        {isPreviewOpen ? 'Hide Preview' : 'Preview'}
                                      </button>
                                      <button type="button" disabled={!canPublish} title={!canPublish ? "Preview canonical, meta, and schema before publishing." : undefined} onClick={async () => {
                                        if (!canPublish) {
                                          setNotice("Preview canonical, meta, and schema before publishing this SEO page.");
                                          return;
                                        }
                                        try {
                                          const nextStatus = pageStatus === 'published' ? 'draft' : 'published';
                                          const res = await updateSeoPage(page.id, { status: nextStatus, published_at: nextStatus === 'published' ? new Date().toISOString() : undefined });
                                          setSeoPages((prev) => prev.map((p) => p.id === page.id ? res.page : p));
                                          setNotice(`${nextStatus === 'published' ? 'Published' : 'Unpublished'} SEO page: ${res.page.title}`);
                                        } catch (err) {
                                          console.error(err);
                                          setNotice(err instanceof Error ? `SEO page status update failed: ${err.message}` : "SEO page status update failed.");
                                        }
                                      }} style={{ padding: '4px 12px', borderRadius: '6px', border: pageStatus === 'published' ? '1px solid #f59e0b' : '1px solid #176c61', background: !canPublish ? '#f8fafc' : pageStatus === 'published' ? '#fffbeb' : '#f0fdf4', color: !canPublish ? '#94a3b8' : pageStatus === 'published' ? '#92400e' : '#176c61', fontSize: '12px', fontWeight: 600, cursor: canPublish ? 'pointer' : 'not-allowed' }}>
                                        {!canPublish ? 'Preview First' : pageStatus === 'published' ? 'Unpublish' : 'Publish'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isPreviewOpen && (
                                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td colSpan={7} style={{ padding: '0 12px 14px' }}>
                                      <div style={{ display: 'grid', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>Publish Preview</strong>
                                          <code style={{ display: 'block', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#334155', overflowX: 'auto' }}>Canonical: {canonicalUrl}</code>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                            <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Meta Title ({seoTitle.length}/60)</p>
                                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', lineHeight: 1.4 }}>{seoTitle}</p>
                                          </div>
                                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                            <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Meta Description ({seoDescription.length}/160)</p>
                                            <p style={{ margin: 0, color: '#0f172a', fontSize: '13px', lineHeight: 1.4 }}>{seoDescription}</p>
                                          </div>
                                        </div>
                                        <div>
                                          <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Schema Markup</p>
                                          <pre style={{ margin: 0, maxHeight: '180px', overflow: 'auto', background: '#0f172a', color: '#e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: 1.5 }}>{schemaPreview}</pre>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              </>
            )}

            {/* Knowledge Base Tab */}
            {!seoLoading && seoSubTab === "kb" && (
              <>
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <p>Help Center</p>
                      <h2>Add FAQ / Guide</h2>
                    </div>
                    <BookOpen size={22} />
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!kbNewTitle.trim() || !kbNewContent.trim()) return;
                      setSeoLoading(true);
                      try {
                        const slug = kbNewTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        const res = await createKbArticle({ title: kbNewTitle, slug, content: kbNewContent, category: kbNewCategory, niche: kbNewNiche, status: 'published' });
                        setSeoKbArticles((prev) => [res.article, ...prev]);
                        setKbNewTitle("");
                        setKbNewContent("");
                      } catch (err) {
                        console.error("KB article creation failed:", err);
                      } finally {
                        setSeoLoading(false);
                      }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}
                  >
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Category</span>
                      <select value={kbNewCategory} onChange={(e) => setKbNewCategory(e.target.value as any)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="faq">FAQ</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="product_guide">Product Guide</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Niche</span>
                      <select value={kbNewNiche} onChange={(e) => setKbNewNiche(e.target.value)} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <option value="beauty">Beauty</option>
                        <option value="pets">Pets</option>
                        <option value="home">Home</option>
                        <option value="fitness">Fitness</option>
                        <option value="automotive">Automotive</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Title / Question</span>
                      <input value={kbNewTitle} onChange={(e) => setKbNewTitle(e.target.value)} placeholder="e.g. How do I use an LED face mask?" required style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Answer / Content</span>
                      <textarea value={kbNewContent} onChange={(e) => setKbNewContent(e.target.value)} placeholder="Write the answer or guide content here..." required rows={4} style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', resize: 'vertical', fontFamily: 'inherit' }} />
                    </label>
                    <button type="submit" disabled={seoLoading} className="primary" style={{ gridColumn: '1 / -1', padding: '10px', borderRadius: '8px', border: 'none', background: '#176c61', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      {seoLoading ? 'Adding…' : 'Add Knowledge Base Entry'}
                    </button>
                  </form>
                </article>

                <article className="panel" style={{ marginTop: '16px' }}>
                  <div className="panel-header">
                    <div>
                      <p>Knowledge Base</p>
                      <h2>Entries ({seoFilteredKbArticles.length}/{seoKbArticles.length})</h2>
                    </div>
                    <BookOpen size={22} />
                  </div>
                  {renderSeoContentFilters({ resultCount: seoFilteredKbArticles.length, totalCount: seoKbArticles.length, showKbCategory: true })}
                  {seoKbArticles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No knowledge base entries yet.</p>
                  ) : seoFilteredKbArticles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No knowledge base entries match the current filters.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                      {seoFilteredKbArticles.map((kb) => (
                        <div key={kb.id} style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px' }}>{kb.title}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <span style={{ background: kb.status === 'published' ? '#dcfce7' : '#fef3c7', color: kb.status === 'published' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{kb.status}</span>
                              <span style={{ background: kb.category === 'faq' ? '#dbeafe' : kb.category === 'tutorial' ? '#fef3c7' : '#f3e8ff', color: kb.category === 'faq' ? '#1e40af' : kb.category === 'tutorial' ? '#92400e' : '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{kb.category}</span>
                              <button type="button" onClick={async () => {
                                try {
                                  const nextStatus = kb.status === 'published' ? 'draft' : 'published';
                                  const res = await updateKbArticle(kb.id, { status: nextStatus });
                                  setSeoKbArticles((prev) => prev.map((entry) => entry.id === kb.id ? res.article : entry));
                                  setNotice(`${nextStatus === 'published' ? 'Published' : 'Unpublished'} KB entry: ${res.article.title}`);
                                } catch (err) {
                                  console.error(err);
                                  setNotice(err instanceof Error ? `KB status update failed: ${err.message}` : "KB status update failed.");
                                }
                              }} style={{ padding: '3px 9px', borderRadius: '6px', border: kb.status === 'published' ? '1px solid #f59e0b' : '1px solid #176c61', background: kb.status === 'published' ? '#fffbeb' : '#f0fdf4', color: kb.status === 'published' ? '#92400e' : '#176c61', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                {kb.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>{kb.content.substring(0, 200)}{kb.content.length > 200 ? '…' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </>
            )}

            {/* Sitemap Tab */}
            {!seoLoading && seoSubTab === "sitemap" && (
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p>Dynamic XML</p>
                    <h2>Sitemap Preview</h2>
                  </div>
                  <Globe2 size={22} />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/sitemap.xml');
                        const text = await res.text();
                        setSeoSitemapPreview(text);
                      } catch (err) {
                        setSeoSitemapPreview('Failed to load sitemap.');
                      }
                    }}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #176c61', background: '#f0fdf4', color: '#176c61', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
                  >
                    Load Live Sitemap
                  </button>
                  {seoSitemapPreview && (
                    <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '20px', borderRadius: '10px', fontSize: '12px', overflow: 'auto', maxHeight: '500px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {seoSitemapPreview}
                    </pre>
                  )}
                </div>
              </article>
            )}
          </>
        )}

        {adminTab === "stores" && (
          <article className="panel" id="stores-manager">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p>Multi-Store Network</p>
                <h2>Storefronts Manager</h2>
              </div>
              <button 
                type="button" 
                className="primary" 
                onClick={() => { setEditingStoreKey(null); setIsStoreFormOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add Store
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5eaee', color: '#68777d', fontSize: '13px', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>Store Name / Identifier</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Domain / Host</th>
                    <th style={{ padding: '12px 16px' }}>Branding</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Active Products</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Total Products</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(stores).map((key) => {
                    const store = stores[key];
                    const allProducts = products.filter(p => p.subdomain === key);
                    const activeProducts = allProducts.filter(p => p.status === "Active");
                    const isDefault = ["general", "beauty", "pets", "home", "fitness", "automotive"].includes(key);
                    
                    let statusColor = "#68777d";
                    let statusBg = "#f0f3f5";
                    if (store.status === "active") {
                      statusColor = "#10b981";
                      statusBg = "#ecfdf5";
                    } else if (store.status === "review") {
                      statusColor = "#f59e0b";
                      statusBg = "#fffbeb";
                    }
                    
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #e5eaee', fontSize: '14.5px' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f7f9fa', border: '1px solid #dce3e7', display: 'flex', alignItems: 'center', justifySelf: 'center', overflow: 'hidden' }}>
                              {store.logo ? (
                                <img src={store.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                              ) : (
                                <Store size={16} style={{ color: '#8c9ba5', margin: '0 auto' }} />
                              )}
                            </div>
                            <div>
                              <strong>{store.label}</strong>
                              <div style={{ fontSize: '11px', color: '#8c9ba5' }}>key: {key}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '11.5px', 
                            fontWeight: 700, 
                            color: statusColor, 
                            backgroundColor: statusBg,
                            textTransform: 'uppercase' 
                          }}>
                            {store.status || "draft"}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#4b5563', fontFamily: 'monospace' }}>
                          {store.host}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: store.accentColor || '#2563EB', 
                              border: '1px solid #d5dde2' 
                            }} />
                            <span style={{ fontSize: '12px', color: '#68777d' }}>{store.headingFont} / {store.bodyFont}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: activeProducts.length > 0 ? '#111827' : '#ef4444' }}>
                          {activeProducts.length}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#4b5563' }}>
                          {allProducts.length}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => {
                                window.location.hash = `#${getHashFromMode(key, stores)}`;
                                setView("storefront");
                              }}
                              style={{ padding: '4px 10px', fontSize: '12.5px', minHeight: '30px' }}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStoreKey(key);
                                setIsStoreFormOpen(true);
                              }}
                              style={{ padding: '4px 10px', fontSize: '12.5px', minHeight: '30px' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isDefault}
                              onClick={() => deleteStore(key)}
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '12.5px', 
                                minHeight: '30px', 
                                color: isDefault ? '#c3cbd0' : '#ef4444', 
                                borderColor: isDefault ? '#e5eaee' : '#fecaca',
                                cursor: isDefault ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </section>

      {isFormOpen && (
        <ProductDialog
          product={editingProduct}
          stores={stores}
          mediaAssets={mediaAssets}
          onMediaCreated={(asset) => {
            setMediaAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
          }}
          onMediaDeleted={(assetId) => {
            setMediaAssets((current) => current.filter((item) => item.id !== assetId));
          }}
          onCancel={() => {
            setEditingProduct(null);
            setIsFormOpen(false);
          }}
          onSave={saveProduct}
        />
      )}

      {isStoreFormOpen && (
        <StoreDialog
          storeKey={editingStoreKey}
          store={editingStoreKey ? stores[editingStoreKey] : null}
          onCancel={() => {
            setEditingStoreKey(null);
            setIsStoreFormOpen(false);
          }}
          onSave={saveStore}
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
      const adminHeaders = adminRequestHeaders();
      
      const response = await fetch(apiUrl("/ai/generate"), {
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
  stores,
  mediaAssets,
  onMediaCreated,
  onMediaDeleted,
  onCancel,
  onSave,
}: {
  product: Product | null;
  stores: Record<string, StorefrontNicheConfig>;
  mediaAssets: MediaAsset[];
  onMediaCreated: (asset: MediaAsset) => void;
  onMediaDeleted: (assetId: string) => void;
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
           trustBadges: [],
           productHighlights: [],
           reviews: [],
           seoTitle: "",
           seoDescription: "",
         },
  );

  const setField = <Key extends keyof ProductForm>(key: Key, value: ProductForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const [imageUploadFiles, setImageUploadFiles] = React.useState<File[]>([]);
  const [imageUploadInputKey, setImageUploadInputKey] = React.useState(0);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [deletingMediaAssetId, setDeletingMediaAssetId] = React.useState("");
  const [imageManagerNotice, setImageManagerNotice] = React.useState("");
  const imageAssets = mediaAssets.filter((asset) => asset.kind === "image");
  const findImageAssetByUrl = (url: string) => imageAssets.find((asset) => normalizeMediaUrl(asset.url) === normalizeMediaUrl(url));

  const addImageToProduct = (url: string) => {
    const nextImages = Array.from(new Set([normalizeMediaUrl(url), ...(form.images || []).map(normalizeMediaUrl)]));
    setField("images", nextImages);
  };

  const addImagesToProduct = (urls: string[]) => {
    const normalizedUrls = urls.map(normalizeMediaUrl).filter(Boolean);
    const nextImages = Array.from(new Set([...normalizedUrls, ...(form.images || []).map(normalizeMediaUrl)]));
    setField("images", nextImages);
  };

  const removeImageFromProduct = (url: string) => {
    setField("images", (form.images || []).filter((image) => normalizeMediaUrl(image) !== normalizeMediaUrl(url)));
  };

  const deleteImageFromServer = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete "${asset.title}" from the media library and server uploads?`)) return;
    setDeletingMediaAssetId(asset.id);
    setImageManagerNotice("");
    try {
      await deleteMediaAsset(asset.id);
      removeImageFromProduct(asset.url);
      onMediaDeleted(asset.id);
      setImageManagerNotice("Image deleted from the server and removed from this product.");
    } catch (error) {
      setImageManagerNotice(error instanceof Error ? error.message : "Image delete failed.");
    } finally {
      setDeletingMediaAssetId("");
    }
  };

  const productReviews = form.reviews || [];

  const setReviewField = <Key extends keyof ProductReview>(index: number, key: Key, value: ProductReview[Key]) => {
    setField(
      "reviews",
      productReviews.map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, [key]: value } : review,
      ),
    );
  };

  const addReview = () => {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
    setField("reviews", [
      ...productReviews,
      {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `review_${Date.now()}`,
        author: "",
        rating: 5,
        date: today,
        text: "",
        verified: true,
      },
    ]);
  };

  const removeReview = (index: number) => {
    setField("reviews", productReviews.filter((_review, reviewIndex) => reviewIndex !== index));
  };

  const effectiveTrustBadges = form.trustBadges?.length ? form.trustBadges : getDefaultProductTrustBadges(form);
  const productHighlights = form.productHighlights?.length ? form.productHighlights : getDefaultProductHighlights(form);

  const setHighlightField = <Key extends keyof ProductHighlight>(index: number, key: Key, value: ProductHighlight[Key]) => {
    setField(
      "productHighlights",
      productHighlights.map((highlight, highlightIndex) =>
        highlightIndex === index ? { ...highlight, [key]: value } : highlight,
      ),
    );
  };

  const addHighlight = () => {
    setField("productHighlights", [
      ...productHighlights,
      {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `highlight_${Date.now()}`,
        label: "",
        description: "",
      },
    ]);
  };

  const removeHighlight = (index: number) => {
    setField("productHighlights", productHighlights.filter((_highlight, highlightIndex) => highlightIndex !== index));
  };

  const uploadProductImage = async () => {
    if (imageUploadFiles.length === 0) return;
    setIsUploadingImage(true);
    setImageManagerNotice("");
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageUploadFiles) {
        const response = await uploadMediaAsset({
          title: `${form.name || product?.name || "Product"} image`,
          kind: "image",
          placement: "listing",
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          dataUrl: await readFileAsDataUrl(file),
          productId: product?.id,
          caption: form.name || product?.name || undefined,
          tag: form.niche || product?.niche || "Product",
        });
        onMediaCreated(response.asset);
        uploadedUrls.push(response.asset.url);
      }
      addImagesToProduct(uploadedUrls);
      setImageUploadFiles([]);
      setImageUploadInputKey((current) => current + 1);
      setImageManagerNotice(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded and added to this product.`);
    } catch (error) {
      setImageManagerNotice(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          const reviews = (form.reviews || [])
            .map((review) => ({
              ...review,
              author: review.author.trim(),
              date: review.date.trim(),
              text: review.text.trim(),
              rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
            }))
            .filter((review) => review.author && review.date && review.text);
          const trustBadges = (form.trustBadges?.length ? form.trustBadges : effectiveTrustBadges)
            .map((badge) => badge.trim())
            .filter(Boolean);
          const productHighlights = (form.productHighlights?.length ? form.productHighlights : getDefaultProductHighlights(form))
            .map((highlight) => ({
              ...highlight,
              label: highlight.label.trim(),
              description: highlight.description.trim(),
            }))
            .filter((highlight) => highlight.label && highlight.description);
          if (form.name.trim()) onSave({ ...form, name: form.name.trim(), trustBadges, productHighlights, reviews });
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
          <Field label="Subdomain / Store">
            <select value={form.subdomain} onChange={(event) => setField("subdomain", event.target.value)}>
              {Object.keys(stores).map((key) => (
                <option key={key} value={key}>
                  {stores[key].label} ({key})
                </option>
              ))}
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
          <Field label="Product image upload & browser" wide>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: '10px', alignItems: 'center' }}>
                <input
                  accept="image/*"
                  key={imageUploadInputKey}
                  multiple
                  type="file"
                  onChange={(event) => setImageUploadFiles(Array.from(event.target.files || []))}
                  style={{ border: '1px solid #dce3e7', borderRadius: '8px', padding: '9px 10px', fontSize: '13px', background: '#ffffff' }}
                />
                <button
                  type="button"
                  onClick={uploadProductImage}
                  disabled={imageUploadFiles.length === 0 || isUploadingImage}
                  style={{ border: 'none', background: '#176c61', color: '#ffffff', borderRadius: '8px', minHeight: '38px', padding: '0 14px', fontWeight: 700, cursor: imageUploadFiles.length === 0 || isUploadingImage ? 'not-allowed' : 'pointer', opacity: imageUploadFiles.length === 0 || isUploadingImage ? 0.6 : 1 }}
                >
                  {isUploadingImage ? `Uploading ${imageUploadFiles.length}...` : imageUploadFiles.length > 1 ? `Upload ${imageUploadFiles.length}` : "Upload"}
                </button>
              </div>
              {imageUploadFiles.length > 1 && (
                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                  {imageUploadFiles.length} images selected for batch upload.
                </span>
              )}
              {imageManagerNotice && (
                <div style={{ border: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', fontWeight: 600 }}>
                  {imageManagerNotice}
                </div>
              )}
              {(form.images || []).length > 0 && (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Current product images</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                    {(form.images || []).map((image) => {
                      const matchedAsset = findImageAssetByUrl(image);
                      const isDeleting = matchedAsset?.id === deletingMediaAssetId;
                      return (
                        <div key={image} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                          <img src={normalizeMediaUrl(image)} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', background: '#f1f5f9' }} />
                          <button
                            type="button"
                            onClick={() => removeImageFromProduct(image)}
                            style={{ width: '100%', border: 'none', borderTop: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', minHeight: '30px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Remove from product
                          </button>
                          {matchedAsset && (
                            <button
                              type="button"
                              onClick={() => deleteImageFromServer(matchedAsset)}
                              disabled={isDeleting}
                              style={{ width: '100%', border: 'none', borderTop: '1px solid #e2e8f0', background: '#fef2f2', color: '#dc2626', minHeight: '30px', fontSize: '12px', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.65 : 1 }}
                            >
                              {isDeleting ? "Deleting..." : "Delete file"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Browse media library</span>
                {imageAssets.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '14px', color: '#64748b', fontSize: '12px' }}>
                    No saved image assets yet. Upload above or use the Media tab to build the library.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', maxHeight: '260px', overflow: 'auto', paddingRight: '2px' }}>
                    {imageAssets.map((asset) => {
                      const normalizedAssetUrl = normalizeMediaUrl(asset.url);
                      const isSelected = Boolean(form.images?.map(normalizeMediaUrl).includes(normalizedAssetUrl));
                      const isDeleting = asset.id === deletingMediaAssetId;
                      return (
                        <div key={asset.id} style={{ border: isSelected ? '2px solid #176c61' : '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                          <button
                            type="button"
                            onClick={() => addImageToProduct(normalizedAssetUrl)}
                            disabled={isSelected || isDeleting}
                            style={{ width: '100%', border: 'none', background: '#ffffff', padding: 0, cursor: isSelected || isDeleting ? 'default' : 'pointer', textAlign: 'left' }}
                          >
                            <img src={normalizedAssetUrl} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', background: '#f1f5f9' }} />
                            <span style={{ display: 'block', padding: '7px 8px', color: isSelected ? '#176c61' : '#334155', fontSize: '11.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isSelected ? "Added" : asset.title}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteImageFromServer(asset)}
                            disabled={isDeleting}
                            style={{ width: '100%', border: 'none', borderTop: '1px solid #e2e8f0', background: '#fef2f2', color: '#dc2626', minHeight: '28px', fontSize: '11.5px', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.65 : 1 }}
                          >
                            {isDeleting ? "Deleting..." : "Delete file"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Field>
          <Field label="SEO title" wide>
            <input value={form.seoTitle || ""} onChange={(event) => setField("seoTitle", event.target.value)} />
          </Field>
          <Field label="SEO description" wide>
            <textarea value={form.seoDescription || ""} onChange={(event) => setField("seoDescription", event.target.value)} />
          </Field>
          <Field label="Listing trust badges" wide>
            <textarea
              value={effectiveTrustBadges.join("\n")}
              onChange={(event) =>
                setField("trustBadges", event.target.value.split(/\r?\n/).map((badge) => badge.trim()).filter(Boolean))
              }
              placeholder="One checkmark badge per line"
            />
          </Field>
          <div className="field wide-field">
            <span>Product highlights & benefits</span>
            <div className="product-review-editor">
              <div className="product-review-editor-header">
                <p>Edit the title and description shown in the customer product-page benefits accordion.</p>
                <button type="button" onClick={addHighlight}>Add highlight</button>
              </div>
              <div className="product-review-editor-list">
                {productHighlights.map((highlight, index) => (
                  <div className="product-review-editor-card" key={highlight.id || index}>
                    <div className="product-review-editor-row two-column">
                      <label>
                        <span>Highlight title</span>
                        <input value={highlight.label} onChange={(event) => setHighlightField(index, "label", event.target.value)} placeholder="Simple setup" />
                      </label>
                      <label>
                        <span>Description</span>
                        <input value={highlight.description} onChange={(event) => setHighlightField(index, "description", event.target.value)} placeholder="Engineered for professional-grade performance and daily reliability." />
                      </label>
                    </div>
                    <div className="product-review-editor-actions">
                      <span />
                      <button type="button" onClick={() => removeHighlight(index)}>Remove highlight</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="field wide-field">
            <span>Customer reviews</span>
            <div className="product-review-editor">
              <div className="product-review-editor-header">
                <p>{productReviews.length ? `${productReviews.length} custom reviews will show on the customer product page.` : "No custom reviews yet. The storefront will use generated niche reviews until you add one."}</p>
                <button type="button" onClick={addReview}>Add review</button>
              </div>
              {productReviews.length > 0 && (
                <div className="product-review-editor-list">
                  {productReviews.map((review, index) => (
                    <div className="product-review-editor-card" key={review.id || index}>
                      <div className="product-review-editor-row">
                        <label>
                          <span>Reviewer</span>
                          <input value={review.author} onChange={(event) => setReviewField(index, "author", event.target.value)} placeholder="Sarah M." />
                        </label>
                        <label>
                          <span>Date</span>
                          <input value={review.date} onChange={(event) => setReviewField(index, "date", event.target.value)} placeholder="June 15, 2026" />
                        </label>
                        <label>
                          <span>Rating</span>
                          <select value={review.rating} onChange={(event) => setReviewField(index, "rating", Number(event.target.value))}>
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <option key={rating} value={rating}>{rating} stars</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="product-review-editor-text">
                        <span>Review text</span>
                        <textarea value={review.text} onChange={(event) => setReviewField(index, "text", event.target.value)} placeholder="Write the customer review shown on the product page." />
                      </label>
                      <div className="product-review-editor-actions">
                        <label>
                          <input
                            type="checkbox"
                            checked={review.verified}
                            onChange={(event) => setReviewField(index, "verified", event.target.checked)}
                          />
                          Verified buyer
                        </label>
                        <button type="button" onClick={() => removeReview(index)}>Remove review</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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

function StoreDialog({
  storeKey,
  store,
  onCancel,
  onSave,
}: {
  storeKey: string | null;
  store: StorefrontNicheConfig | null;
  onCancel: () => void;
  onSave: (key: string, store: StorefrontNicheConfig) => void;
}) {
  const [key, setKey] = React.useState(storeKey || "");
  const [form, setForm] = React.useState<StorefrontNicheConfig>(() =>
    store
      ? { ...store }
      : {
          label: "",
          host: "",
          eyebrow: "Early bird special",
          headline: "Premium products curated for you.",
          offer: "Free shipping over $25",
          proof: "Handpicked premium products.",
          accent: "#2563EB",
          soft: "#EFF6FF",
          heroImage: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
          positioning: "Discover Products That Make Life Better",
          primaryColor: "#0F172A",
          secondaryColor: "#2563EB",
          accentColor: "#2563EB",
          backgroundColor: "#F8FAFC",
          textColor: "#111827",
          headingFont: "Manrope",
          bodyFont: "Inter",
          collections: ["Best Sellers", "New Arrivals"],
          heroHeadline: "Discover Products That Make Life Better",
          heroSubheadline: "We've done the research so you don't have to.",
          ctaText: "Explore Categories",
          logo: "./Logos/Product4thePeople_Logo.png",
          status: "draft",
        }
  );

  const setField = <Key extends keyof StorefrontNicheConfig>(keyName: Key, value: StorefrontNicheConfig[Key]) => {
    setForm((current) => ({ ...current, [keyName]: value }));
  };

  React.useEffect(() => {
    if (!storeKey) {
      setField("host", key ? `${key.toLowerCase()}.products4thepeople.com` : "");
    }
  }, [key]);

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          const finalKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
          if (form.label.trim() && finalKey) {
            onSave(finalKey, {
              ...form,
              label: form.label.trim(),
              host: form.host.trim() || `${finalKey}.products4thepeople.com`,
            });
          }
        }}
      >
        <div className="modal-header">
          <div>
            <p>Store manager</p>
            <h2>{storeKey ? `Edit Store: ${store?.label}` : "Add Store"}</h2>
          </div>
          <button type="button" onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="form-grid" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '4px' }}>
          <Field label="Store Identifier / Subdomain (e.g. 'garden')">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!!storeKey}
              placeholder="e.g. garden"
              required
            />
          </Field>

          <Field label="Store Name (Label)">
            <input
              value={form.label}
              onChange={(e) => setField("label", e.target.value)}
              placeholder="e.g. GardenGrow"
              required
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status || "draft"}
              onChange={(e) => setField("status", e.target.value as any)}
            >
              <option value="draft">Draft (Admin only)</option>
              <option value="review">Review (URL only)</option>
              <option value="active">Active (Visible to everyone)</option>
            </select>
          </Field>

          <Field label="Domain / Hostname">
            <input
              value={form.host}
              onChange={(e) => setField("host", e.target.value)}
              placeholder="e.g. garden.products4thepeople.com"
              required
            />
          </Field>

          <Field label="Logo URL / Path">
            <input
              value={form.logo || ""}
              onChange={(e) => setField("logo", e.target.value)}
              placeholder="e.g. ./Logos/Product4thePeople_Logo.png or https://example.com/logo.png"
            />
          </Field>

          <Field label="Accent Color">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => {
                  setField("accentColor", e.target.value);
                  setField("accent", e.target.value);
                  setField("secondaryColor", e.target.value);
                }}
                style={{ width: '44px', height: '40px', padding: '0', border: '1px solid #d5dde2', borderRadius: '8px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) => {
                  setField("accentColor", e.target.value);
                  setField("accent", e.target.value);
                  setField("secondaryColor", e.target.value);
                }}
                placeholder="#2563EB"
                style={{ flex: 1 }}
              />
            </div>
          </Field>

          <Field label="Background Color">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={form.backgroundColor}
                onChange={(e) => setField("backgroundColor", e.target.value)}
                style={{ width: '44px', height: '40px', padding: '0', border: '1px solid #d5dde2', borderRadius: '8px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={form.backgroundColor}
                onChange={(e) => setField("backgroundColor", e.target.value)}
                placeholder="#F8FAFC"
                style={{ flex: 1 }}
              />
            </div>
          </Field>

          <Field label="Text Color">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={form.textColor}
                onChange={(e) => setField("textColor", e.target.value)}
                style={{ width: '44px', height: '40px', padding: '0', border: '1px solid #d5dde2', borderRadius: '8px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={form.textColor}
                onChange={(e) => setField("textColor", e.target.value)}
                placeholder="#111827"
                style={{ flex: 1 }}
              />
            </div>
          </Field>

          <Field label="Heading Font">
            <select value={form.headingFont} onChange={(e) => setField("headingFont", e.target.value)}>
              <option value="Manrope">Manrope</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Bebas Neue">Bebas Neue</option>
              <option value="Oswald">Oswald</option>
              <option value="Poppins">Poppins</option>
              <option value="Inter">Inter</option>
            </select>
          </Field>

          <Field label="Body Font">
            <select value={form.bodyFont} onChange={(e) => setField("bodyFont", e.target.value)}>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
            </select>
          </Field>

          <Field label="Headline">
            <input value={form.headline} onChange={(e) => setField("headline", e.target.value)} />
          </Field>

          <Field label="Hero Image URL">
            <input value={form.heroImage} onChange={(e) => setField("heroImage", e.target.value)} />
          </Field>

          <Field label="Eyebrow Text">
            <input value={form.eyebrow} onChange={(e) => setField("eyebrow", e.target.value)} />
          </Field>

          <Field label="Offer Text">
            <input value={form.offer} onChange={(e) => setField("offer", e.target.value)} />
          </Field>

          <Field label="Proof / Subtitle">
            <input value={form.proof} onChange={(e) => setField("proof", e.target.value)} />
          </Field>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save Store
          </button>
        </div>
      </form>
    </div>
  );
}

type ProductReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
};

function getDefaultReviews(product: Product): ProductReview[] {
  const isBeauty = product.subdomain === "beauty" || product.subdomain === "glowtheory";
  const isPets = product.subdomain === "pets" || product.subdomain === "wagwell";
  const isHome = product.subdomain === "home" || product.subdomain === "nesttheory";
  const isFitness = product.subdomain === "fitness" || product.subdomain === "recoverlab";
  const isAuto = product.subdomain === "automotive" || product.subdomain === "drivecraft";

  if (isBeauty) {
    return [
      { id: "rev_b1", author: "Sarah M.", rating: 5, date: "May 12, 2026", text: `Absolutely love this ${product.name}! It has become a key part of my daily self-care routine. The quality is top notch.`, verified: true },
      { id: "rev_b2", author: "Jessica K.", rating: 5, date: "April 28, 2026", text: `Seen so much difference after using this. Shipping was super fast too. Highly recommend to anyone on the fence!`, verified: true },
      { id: "rev_b3", author: "Elena R.", rating: 4, date: "April 15, 2026", text: `Works exactly as described. Very premium feel. It took a few days to arrive but the customer service was very helpful.`, verified: true },
    ];
  } else if (isPets) {
    return [
      { id: "rev_p1", author: "David T.", rating: 5, date: "May 20, 2026", text: `My dog is absolutely obsessed with this! Very durable and makes our routine so much easier.`, verified: true },
      { id: "rev_p2", author: "Megan L.", rating: 5, date: "May 05, 2026", text: `Best purchase I've made for my pet this year. Highly recommended by Wagwell community for a reason.`, verified: true },
      { id: "rev_p3", author: "Robert H.", rating: 4, date: "April 22, 2026", text: `Good quality construction and feels sturdy. My cat was a bit skeptical at first but now loves it.`, verified: true },
    ];
  } else if (isFitness) {
    return [
      { id: "rev_f1", author: "Marcus G.", rating: 5, date: "May 25, 2026", text: `Essential recovery gear! The ${product.name} has significantly cut down my soreness after heavy leg days.`, verified: true },
      { id: "rev_f2", author: "Chloe S.", rating: 5, date: "May 14, 2026", text: `Professional grade results right from my living room. Fits perfectly in my gym bag.`, verified: true },
      { id: "rev_f3", author: "Alex P.", rating: 4, date: "May 01, 2026", text: `Sturdy build and powerful performance. The battery life is amazing. A must-have for runners.`, verified: true },
    ];
  } else if (isHome) {
    return [
      { id: "rev_h1", author: "Linda W.", rating: 5, date: "May 18, 2026", text: `Makes organizing my space so satisfying! The design is clean, minimalist, and functions perfectly.`, verified: true },
      { id: "rev_h2", author: "Daniel B.", rating: 5, date: "May 10, 2026", text: `Brings so much calm and order to the clutter. Will be buying a second set for the guest room!`, verified: true },
      { id: "rev_h3", author: "Rachel S.", rating: 4, date: "April 30, 2026", text: `Very nice neutral aesthetic. Durable material. Helps keep everything neat and accessible.`, verified: true },
    ];
  } else if (isAuto) {
    return [
      { id: "rev_a1", author: "Jason C.", rating: 5, date: "May 22, 2026", text: `Incredible detailing results! My paint looks completely showroom ready. Extremely easy to use.`, verified: true },
      { id: "rev_a2", author: "Brian F.", rating: 5, date: "May 11, 2026", text: `Enthusiast approved! Sturdy bottle, professional quality compound. Makes cleaning a breeze.`, verified: true },
      { id: "rev_a3", author: "Tom E.", rating: 4, date: "May 03, 2026", text: `Leaves a brilliant shine and nice slick coating. Very satisfied with the DriveCraft collection.`, verified: true },
    ];
  }
  return [
    { id: "rev_g1", author: "Chris M.", rating: 5, date: "May 15, 2026", text: `Great product, high quality, and fast shipping. Fully satisfied.`, verified: true },
    { id: "rev_g2", author: "Anna J.", rating: 5, date: "April 29, 2026", text: `Amazing value. Exactly what I was looking for.`, verified: true },
    { id: "rev_g3", author: "John D.", rating: 4, date: "April 20, 2026", text: `Solid construction, works well. Recommended.`, verified: true },
  ];
}

function Storefront({
  products: originalProducts,
  initialMode,
  stores,
  orders,
  mediaAssets,
  onBackToAdmin,
  onPlaceOrder,
  onCaptureLead,
  onCaptureAbandonedCart,
}: {
  products: Product[];
  initialMode: StorefrontMode;
  stores: Record<string, StorefrontNicheConfig>;
  orders: Order[];
  mediaAssets: MediaAsset[];
  onBackToAdmin: () => void;
  onPlaceOrder: (order: OrderDraft) => Promise<string>;
  onCaptureLead: (lead: Omit<MarketingLead, "id" | "createdAt">) => void;
  onCaptureAbandonedCart: (cart: Omit<AbandonedCart, "id" | "status" | "updatedAt">) => void;
}) {
  const [activeNiche, setActiveNiche] = React.useState<StorefrontMode>(initialMode);
  const [activeSubcategory, setActiveSubcategory] = React.useState("All");
  const [detailProductId, setDetailProductId] = React.useState(() => getProductIdFromHash());

  const [activeVariants, setActiveVariants] = React.useState<Record<string, { experiment: Experiment; variant: ExperimentVariant }>>({});

  React.useEffect(() => {
    let isMounted = true;
    const loadActiveTests = async () => {
      try {
        const res = await getActiveExperiments();
        if (!isMounted || !res.experiments) return;
        
        const assignments: Record<string, { experiment: Experiment; variant: ExperimentVariant }> = {};
        
        for (const exp of res.experiments) {
          const matchesNiche = exp.niche === "global" || exp.niche === activeNiche;
          const matchesProduct = exp.test_type === "product_pricing" && exp.target_id === detailProductId;
          
          if (matchesNiche || matchesProduct) {
            const storageKey = `p4tp_experiment_${exp.id}`;
            let variantId = localStorage.getItem(storageKey);
            
            if (!variantId && exp.variants && exp.variants.length > 0) {
              const control = exp.variants.find((v: any) => v.is_control) || exp.variants[0];
              if (Math.random() * 100 <= exp.traffic_allocation) {
                const randomIndex = Math.floor(Math.random() * exp.variants.length);
                const assigned = exp.variants[randomIndex];
                variantId = assigned.id;
              } else {
                variantId = control.id;
              }
              localStorage.setItem(storageKey, variantId);
              void trackExperimentConversion(exp.id, "visitor", variantId).catch(() => {});
            }
            
            const assignedVariant = exp.variants.find((v: any) => v.id === variantId);
            if (assignedVariant) {
              assignments[exp.id] = { experiment: exp, variant: assignedVariant };
            }
          }
        }
        setActiveVariants(assignments);
      } catch (e) {
        console.warn("Failed to load active A/B tests:", e);
      }
    };
    
    void loadActiveTests();
    return () => {
      isMounted = false;
    };
  }, [activeNiche, detailProductId]);

  const triggerTrack = React.useCallback((action: "add_to_cart" | "checkout" | "purchase" | "email_capture", revenue?: number) => {
    Object.values(activeVariants).forEach(({ experiment, variant }) => {
      void trackExperimentConversion(experiment.id, action, variant.id, revenue).catch(() => {});
    });
  }, [activeVariants]);

  const overriddenProducts = React.useMemo(() => {
    return originalProducts.map(product => {
      let retailMin = product.retailMin;
      let name = product.name;
      
      Object.values(activeVariants).forEach(({ experiment, variant }) => {
        if (experiment.test_type === "product_pricing" && experiment.target_id === product.id) {
          const newPrice = Number(variant.changes.price || variant.changes.retailMin);
          if (newPrice > 0) retailMin = newPrice;
          if (variant.changes.name) name = variant.changes.name;
        }
      });
      
      return {
        ...product,
        retailMin,
        name
      };
    });
  }, [originalProducts, activeVariants]);

  const products = overriddenProducts;
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [productQuantities, setProductQuantities] = React.useState<Record<string, number>>({});
  const [email, setEmail] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [checkoutStatus, setCheckoutStatus] = React.useState<"idle" | "redirecting" | "confirming">("idle");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
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
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPasswordInput, setAuthPasswordInput] = React.useState("");
  const [authName, setAuthName] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const staticGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || (window as any).VITE_GOOGLE_CLIENT_ID || "");
  const [runtimeGoogleClientId, setRuntimeGoogleClientId] = React.useState(staticGoogleClientId);
  const [googleAuthStatus, setGoogleAuthStatus] = React.useState<"idle" | "loading" | "ready" | "inactive" | "error">(
    staticGoogleClientId ? "idle" : "loading",
  );
  const [googleAuthMessage, setGoogleAuthMessage] = React.useState("");
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

  // SEO Content Page States
  const [contentPage, setContentPage] = React.useState<"shop" | "blog" | "blog-detail" | "kb" | "category">("shop");
  const [blogArticles, setBlogArticles] = React.useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = React.useState<Article | null>(null);
  const [kbArticles, setKbArticles] = React.useState<KnowledgeArticle[]>([]);
  const [currentSeoPage, setCurrentSeoPage] = React.useState<SeoPage | null>(null);
  const [kbSearchQuery, setKbSearchQuery] = React.useState("");
  const [kbExpandedId, setKbExpandedId] = React.useState<string | null>(null);
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

  // Reviews state and helpers for dynamic submission
  const [customReviews, setCustomReviews] = React.useState<Record<string, ProductReview[]>>(() => {
    try {
      const stored = localStorage.getItem("p4tp_custom_reviews");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem("p4tp_custom_reviews", JSON.stringify(customReviews));
  }, [customReviews]);

  const getProductReviewsList = React.useCallback((product: Product) => {
    const productReviews = product.reviews || [];
    const defaults = productReviews.length > 0 ? productReviews : getDefaultReviews(product);
    const customs = customReviews[product.id] || [];
    return [...customs, ...defaults];
  }, [customReviews]);

  const getProductAverageRating = React.useCallback((product: Product) => {
    const list = getProductReviewsList(product);
    if (list.length === 0) return 5.0;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  }, [getProductReviewsList]);

  // Calculate dynamic sales count for best sellers
  const getProductSalesCount = React.useCallback((productId: string) => {
    let count = orders
      ? orders
          .flatMap(o => o.items || [])
          .filter(i => i.productId === productId)
          .reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0;

    if (count === 0) {
      // Seed a realistic deterministic count based on product ID name hash
      let hash = 0;
      for (let i = 0; i < productId.length; i++) {
        hash = productId.charCodeAt(i) + ((hash << 5) - hash);
      }
      count = Math.abs(hash % 38) + 4; // Between 4 and 41 sales
    }
    return count;
  }, [orders]);

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
  const config = stores[activeNiche] || stores["general"];

  // Load content page data
  React.useEffect(() => {
    if (contentPage === "blog") {
      getArticles(activeNiche === "general" ? undefined : activeNiche)
        .then((res) => setBlogArticles(res.articles || []))
        .catch(() => {});
      document.title = `Blog | ${config.label}`;
      setMetaDescription(`Read the latest articles and guides from ${config.label}.`);
    } else if (contentPage === "blog-detail") {
      const slug = window.location.hash.replace("#blog/", "");
      getArticleDetails(decodeURIComponent(slug))
        .then((res) => {
          setCurrentArticle(res.article);
          if (res.article) {
            document.title = res.article.seo_title || res.article.title;
            setMetaDescription(res.article.seo_description || res.article.summary || '');
            void trackSeoHit("article", res.article.slug, "view").catch(() => {});
            injectJsonLd({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: res.article.title,
              description: res.article.seo_description || res.article.summary,
              datePublished: res.article.published_at,
              dateModified: res.article.updated_at,
            });
          }
        })
        .catch(() => setCurrentArticle(null));
    } else if (contentPage === "kb") {
      getKbArticles(activeNiche === "general" ? undefined : activeNiche)
        .then((res) => setKbArticles(res.articles || []))
        .catch(() => {});
      document.title = `Help Center | ${config.label}`;
      setMetaDescription(`Find answers, guides, and tutorials from ${config.label}.`);
    } else if (contentPage === "category") {
      const slug = window.location.hash.replace("#c/", "");
      getSeoPageDetails(decodeURIComponent(slug))
        .then((res) => {
          setCurrentSeoPage(res.page);
          if (res.page) {
            document.title = res.page.seo_title || res.page.title;
            setMetaDescription(res.page.seo_description || res.page.description || '');
            void trackSeoHit("seo_page", res.page.slug, "view").catch(() => {});
            injectJsonLd({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: res.page.title,
              description: res.page.seo_description || res.page.description,
            });
          }
        })
        .catch(() => setCurrentSeoPage(null));
    }
    return () => removeJsonLd();
  }, [contentPage, activeNiche]);

  React.useEffect(() => {
    const syncStorefrontFromHash = () => {
      const hash = window.location.hash.replace("#", "");

      // Blog routes
      if (hash === "blog") {
        setContentPage("blog");
        setDetailProductId(null);
        return;
      }
      if (hash.startsWith("blog/")) {
        setContentPage("blog-detail");
        setDetailProductId(null);
        return;
      }
      // Knowledge base routes
      if (hash === "kb") {
        setContentPage("kb");
        setDetailProductId(null);
        return;
      }
      // Category page routes
      if (hash.startsWith("c/")) {
        setContentPage("category");
        setDetailProductId(null);
        return;
      }

      // Default product/shop routes
      setContentPage("shop");
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
    const currentConfig = stores[activeNiche] || stores["general"];
    trackMarketingEvent("page_view", {
      page_title: currentConfig.host,
      niche: activeNiche,
    });
  }, [activeNiche, stores]);

  // Enforce access rules/gates for Draft status
  React.useEffect(() => {
    const store = stores[activeNiche];
    if (store && store.status === "draft" && !currentUser?.isAdmin) {
      setActiveNiche("general");
      window.location.hash = "#products4thepeople";
      addToast(`Access Denied: "${store.label}" is currently in draft mode.`, "error");
    }
  }, [activeNiche, stores, currentUser, addToast]);

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
        const adminHeaders = adminRequestHeaders();

        // Pre-fill checkout form inputs with logged in profile credentials
        setEmail(currentUser.email);
        setCustomerName(currentUser.name);

        // Fetch saved profile & cart from database
        const profileRes = await fetch(apiUrl(`/customers/${encodeURIComponent(currentUser.email)}/profile`), { headers: adminHeaders });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const profileIsAdmin = profile.role === "admin" || currentUser.email.toLowerCase() === adminEmail.toLowerCase();
          if (profileIsAdmin !== Boolean(currentUser.isAdmin)) {
            const nextUser = { ...currentUser, isAdmin: profileIsAdmin };
            setCurrentUser(nextUser);
            localStorage.setItem("p4tp_customer", JSON.stringify(nextUser));
            if (profileIsAdmin) {
              saveAdminSession(currentUser.email);
            }
          }
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
        const ordersRes = await fetch(apiUrl(`/orders/customer/${encodeURIComponent(currentUser.email)}`), { headers: adminHeaders });
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
        const adminHeaders = adminRequestHeaders({ "Content-Type": "application/json" });
        await fetch(apiUrl(`/customers/${encodeURIComponent(currentUser.email)}/profile`), {
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
      window.location.hash = `#${getHashFromMode(activeNiche, stores)}`;
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
        const response = await fetch(apiUrl(`/checkout-session?session_id=${encodeURIComponent(sessionId)}`));
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
          triggerTrack("purchase", pendingOrder.total);
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
  }, [onPlaceOrder, triggerTrack]);

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
  const videoSectionAssets = mediaAssets.filter((asset) => {
    if (asset.placement !== "video_section") return false;
    if (asset.productId) {
      const product = products.find((item) => item.id === asset.productId);
      return activeNiche === "general" || product?.subdomain === activeNiche;
    }
    return activeNiche === "general" || !asset.productId;
  });
  const ugcItems = videoSectionAssets.length > 0
    ? videoSectionAssets.map((asset) => {
        const product = asset.productId ? products.find((item) => item.id === asset.productId) : null;
        return {
          id: asset.id,
          handle: asset.handle || "@products4thepeople",
          caption: asset.caption || asset.title,
          mediaUrl: normalizeMediaUrl(asset.url),
          kind: asset.kind,
          productName: product?.name || asset.title,
          product,
          tag: asset.tag || product?.niche || (asset.kind === "video" ? "Video" : "Demo"),
        };
      })
    : [
        {
          id: "ugc_1",
          handle: "@glow_beauty_routine",
          caption: "This LED neck lifter is now part of my morning routine.",
          mediaUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
          kind: "image" as const,
          productName: "LED Neck Lift Massager",
          product: null,
          tag: "Beauty",
        },
        {
          id: "ugc_2",
          handle: "@pup_adventure_life",
          caption: "The portable feeding bottle is a lifesaver for road trips.",
          mediaUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80",
          kind: "image" as const,
          productName: "Portable Pet Water Bottle",
          product: null,
          tag: "Pets",
        },
        {
          id: "ugc_3",
          handle: "@recover_athlete_lab",
          caption: "Soreness gone in minutes with this massage roller.",
          mediaUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
          kind: "image" as const,
          productName: "Medusa Smart Massage Roller",
          product: null,
          tag: "Recovery",
        },
        {
          id: "ugc_4",
          handle: "@organized_home_nest",
          caption: "Finally organized my kitchen drawers.",
          mediaUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
          kind: "image" as const,
          productName: "Drawer Organizer",
          product: null,
          tag: "Kitchen",
        },
        {
          id: "ugc_5",
          handle: "@detailing_car_craft",
          caption: "Showroom finish using the microfiber spray wash.",
          mediaUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=400&q=80",
          kind: "image" as const,
          productName: "Microfiber Detailing Spray Wash",
          product: null,
          tag: "Garage",
        },
      ];
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

  let freeShippingLimit = 25;
  Object.values(activeVariants).forEach(({ experiment, variant }) => {
    if (experiment.test_type === "checkout_threshold") {
      const threshold = Number(variant.changes.freeShippingThreshold || variant.changes.threshold);
      if (threshold > 0) freeShippingLimit = threshold;
    }
  });

  let discountPercent = 0;
  if (appliedCoupon === "WHEEL10" || appliedCoupon === "WELCOME10") discountPercent = 0.1;
  else if (appliedCoupon === "WHEEL15") discountPercent = 0.15;
  else if (appliedCoupon === "WHEEL20") discountPercent = 0.2;

  const discountAmount = roundMoney(subtotal * discountPercent);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const shipping = (appliedCoupon === "FREESHIP" || subtotal >= freeShippingLimit || subtotal === 0) ? 0 : 7;
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
      triggerTrack("add_to_cart");
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
    window.location.hash = `#${getHashFromMode(mode, stores)}`;
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
    triggerTrack("email_capture");
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
    if (!isAuthOpen) return;
    let isMounted = true;

    async function loadPublicAuthConfig() {
      if (staticGoogleClientId) {
        setRuntimeGoogleClientId(staticGoogleClientId);
        return;
      }

      setGoogleAuthStatus("loading");
      try {
        let config: any = null;
        const publicResponse = await fetch(apiUrl("/public-config"));
        if (publicResponse.ok) {
          config = await publicResponse.json();
        } else if (publicResponse.status === 404) {
          const settingsResponse = await fetch(apiUrl("/settings/config"), { headers: adminRequestHeaders() });
          if (!settingsResponse.ok) throw new Error(`Google OAuth config unavailable (${settingsResponse.status})`);
          config = await settingsResponse.json();
        } else {
          throw new Error(`Google OAuth config unavailable (${publicResponse.status})`);
        }
        if (!isMounted) return;

        const clientId = String(config.googleClientId || "").trim();
        setRuntimeGoogleClientId(clientId);
        if (!clientId) {
          setGoogleAuthStatus("inactive");
          setGoogleAuthMessage("Live Google OAuth is inactive. Use email and password sign-in below.");
        }
      } catch (error) {
        if (!isMounted) return;
        setRuntimeGoogleClientId("");
        setGoogleAuthStatus("error");
        setGoogleAuthMessage(error instanceof Error ? error.message : "Google OAuth config could not be loaded.");
      }
    }

    void loadPublicAuthConfig();
    return () => {
      isMounted = false;
    };
  }, [isAuthOpen, staticGoogleClientId]);

  React.useEffect(() => {
    const clientId = runtimeGoogleClientId.trim();
    if (!isAuthOpen || !clientId) return;

    setGoogleAuthStatus("loading");
    setGoogleAuthMessage("");

    const renderGoogleButton = () => {
      const google = (window as any).google;
      const buttonTarget = document.getElementById("google-signin-btn");
      if (!google || !buttonTarget) return;

      try {
        buttonTarget.innerHTML = "";
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          buttonTarget,
          { theme: "outline", size: "large", width: buttonTarget.offsetWidth || 320 }
        );
        setGoogleAuthStatus("ready");
      } catch (error) {
        setGoogleAuthStatus("error");
        setGoogleAuthMessage(
          error instanceof Error
            ? error.message
            : "Google sign-in could not initialize. Check the OAuth client origin in Google Cloud.",
        );
      }
    };

    if ((window as any).google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = renderGoogleButton;
    script.onerror = () => {
      setGoogleAuthStatus("error");
      setGoogleAuthMessage("Google sign-in script could not load. Check browser blockers and network access.");
    };

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [isAuthOpen, runtimeGoogleClientId]);

  const syncProfileToBackend = async (email: string, name: string, preferences: any, savedCart: any) => {
    try {
      const adminHeaders = adminRequestHeaders({ "Content-Type": "application/json" });
      await fetch(apiUrl(`/customers/${encodeURIComponent(email)}/profile`), {
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
        saveAdminSession(user.email);
        addToast(`Admin authentication active! Welcome back.`, "success");
      }
    } catch (e) {
      console.error("Failed to parse Google credentials:", e);
    }
  };

  const handleEmailPasswordLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanName = authName.trim() || cleanEmail.split("@")[0] || "Customer";
    const isPrimaryAdmin = cleanEmail === adminEmail.toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setAuthError("Enter a valid email address.");
      return;
    }

    if (!authPasswordInput.trim()) {
      setAuthError("Enter your password.");
      return;
    }

    if (isPrimaryAdmin && authPasswordInput !== adminPassword) {
      setAuthError("Admin password does not match the configured admin credentials.");
      return;
    }

    const user = {
      email: cleanEmail,
      name: cleanName,
      avatar: "", // empty will fall back to SVG initials
      isAdmin: isPrimaryAdmin,
    };

    setCurrentUser(user);
    localStorage.setItem("p4tp_customer", JSON.stringify(user));
    setIsAuthOpen(false);
    setAuthEmail("");
    setAuthPasswordInput("");
    setAuthName("");
    setAuthError("");
    
    // If logging in as admin, also sync admin authed session!
    if (user.isAdmin) {
      saveAdminSession(cleanEmail);
      setConfirmation(`Admin authentication active! Welcome back.`);
    } else {
      addToast(`Signed in as ${cleanName}`, "success");
    }
  };

  const handleSignOut = () => {
    clearUnifiedAuthSession();
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
      const response = await fetch(apiUrl(`/orders/${encodeURIComponent(trackOrderId.trim())}`), { headers: adminRequestHeaders() });
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
    triggerTrack("checkout");
    setCheckoutStatus("redirecting");
    setConfirmation("");
    try {
      const response = await fetch(apiUrl("/create-checkout-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          items: orderDraft.items,
          totals: { subtotal, shipping, tax, total },
          storefront: activeNiche,
          discountCode: appliedCoupon,
          shippingThreshold: freeShippingLimit,
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

  let heroHeadline = config.heroHeadline;
  let heroSubheadline = config.heroSubheadline;
  let heroImage = config.heroImage;
  let ctaText = config.ctaText;

  Object.values(activeVariants).forEach(({ experiment, variant }) => {
    if (experiment.test_type === "homepage_hero") {
      if (variant.changes.heroHeadline) heroHeadline = variant.changes.heroHeadline;
      if (variant.changes.heroSubheadline) heroSubheadline = variant.changes.heroSubheadline;
      if (variant.changes.heroImage) heroImage = variant.changes.heroImage;
      if (variant.changes.ctaText) ctaText = variant.changes.ctaText;
    }
  });

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
          "--store-hero": `linear-gradient(90deg, rgba(17, 25, 29, 0.8), rgba(17, 25, 29, 0.18)), url(${heroImage})`,
          "--store-card-bg": activeNiche === "fitness" || activeNiche === "automotive" ? (config.secondaryColor || "#111827") : "#ffffff",
          "--store-card-text": config.textColor,
        } as React.CSSProperties
      }
    >
      <header className="storefront-header">
        <button
          className="storefront-brand"
          type="button"
          onClick={() => switchStorefront("general")}
        >
          {config.logo ? (
            <img 
              src={config.logo} 
              alt={config.label} 
              style={{ height: "30px", width: "auto", objectFit: "contain", display: "block" }} 
            />
          ) : (
            <>
              <Store size={24} />
              <span>{config.label}</span>
            </>
          )}
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
              {currentUser?.isAdmin && (
                <button 
                  type="button" 
                  onClick={() => { onBackToAdmin(); setIsMoreOpen(false); }}
                  style={{ fontWeight: 700, color: 'var(--store-accent, #176c61)' }}
                >
                  Admin Panel
                </button>
              )}
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
              <button type="button" onClick={() => { window.location.hash = '#blog'; setIsMoreOpen(false); }}>
                Blog
              </button>
              <button type="button" onClick={() => { window.location.hash = '#kb'; setIsMoreOpen(false); }}>
                Help Center
              </button>
              
              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5eaee' }} />
              
              {/* Shop Switchers */}
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8c9ba5', padding: '4px 8px 2px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                More Stores
              </span>
              <button
                type="button"
                onClick={() => { switchStorefront("general"); setIsMoreOpen(false); }}
              >
                Products4thePeople
              </button>
              {Object.keys(stores)
                .filter((key) => key !== "general")
                .filter((key) => currentUser?.isAdmin || stores[key].status === "active")
                .map((niche) => {
                  const s = stores[niche];
                  const labelSuffix = currentUser?.isAdmin && s.status !== "active" ? ` (${titleCase(s.status || "draft")})` : "";
                  return (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => { switchStorefront(niche); setIsMoreOpen(false); }}
                    >
                      {s.label}{labelSuffix}
                    </button>
                  );
                })}
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
          <h1>{heroHeadline}</h1>
          <p className="hero-subheadline" style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '640px', margin: '8px 0 24px' }}>
            {heroSubheadline}
          </p>
          <div className="hero-ctas" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button className="primary" onClick={() => {
              document.querySelector(".shop-grid")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} style={{ minHeight: '44px', padding: '0 24px', fontWeight: 600 }}>
              {ctaText}
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

      {/* Trust Bar Component */}
      <section className="trust-bar" aria-label="Customer trust indicators">
        <div className="trust-item">
          <ShieldCheck size={24} />
          <div className="trust-text">
            <strong>Secure Checkout</strong>
            <span>SSL encrypted payments</span>
          </div>
        </div>
        <div className="trust-item">
          <RotateCcw size={24} />
          <div className="trust-text">
            <strong>30-Day Guarantee</strong>
            <span>100% money back refund</span>
          </div>
        </div>
        <div className="trust-item">
          <Truck size={24} />
          <div className="trust-text">
            <strong>Fast Shipping</strong>
            <span>Free delivery over $25</span>
          </div>
        </div>
        <div className="trust-item">
          <MessageSquare size={24} />
          <div className="trust-text">
            <strong>Responsive Support</strong>
            <span>24/7 dedicated help desk</span>
          </div>
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

      {contentPage !== "shop" && (
        <section style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
          {/* Blog List */}
          {contentPage === "blog" && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--store-text, #111827)', margin: '0 0 8px' }}>{config.label} Blog</h1>
                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Guides, tips, and insights curated for you.</p>
              </div>
              {blogArticles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No published articles yet. Check back soon!</p>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {blogArticles.map((art) => (
                    <a
                      key={art.id}
                      href={`#blog/${art.slug}`}
                      style={{ display: 'block', padding: '24px', background: 'var(--store-card-bg, #fff)', border: '1px solid var(--store-border, #e5eaee)', borderRadius: '14px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s, transform 0.2s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--store-accent, #176c61)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{art.niche}</span>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 8px', color: 'var(--store-text, #111827)' }}>{art.title}</h2>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>{art.summary || art.content?.substring(0, 160) + '…'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString() : ''}</span>
                        <span>·</span>
                        <span>{art.views} views</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Blog Detail */}
          {contentPage === "blog-detail" && currentArticle && (
            <article>
              <button type="button" onClick={() => { window.location.hash = '#blog'; }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--store-accent, #176c61)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: '0', marginBottom: '20px' }}>
                ← Back to Blog
              </button>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--store-accent, #176c61)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{currentArticle.niche}</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--store-text, #111827)', margin: '0 0 12px', lineHeight: '1.3' }}>{currentArticle.title}</h1>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '28px' }}>
                {currentArticle.published_at && <span>{new Date(currentArticle.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                <span>·</span>
                <span>{currentArticle.views} views</span>
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--store-text, #374151)', whiteSpace: 'pre-wrap' }}>
                {currentArticle.content}
              </div>
              {currentArticle.keywords && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--store-border, #e5eaee)' }}>
                  {currentArticle.keywords.split(',').map((kw, i) => (
                    <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{kw.trim()}</span>
                  ))}
                </div>
              )}
            </article>
          )}
          {contentPage === "blog-detail" && !currentArticle && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Article not found.</p>
              <button type="button" onClick={() => { window.location.hash = '#blog'; }} style={{ marginTop: '12px', background: 'var(--store-accent, #176c61)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Browse Blog</button>
            </div>
          )}

          {/* Knowledge Base */}
          {contentPage === "kb" && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--store-text, #111827)', margin: '0 0 8px' }}>Help Center</h1>
                <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 20px' }}>Find answers to common questions and browse our guides.</p>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                    placeholder="Search help articles…"
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--store-border, #e2e8f0)', fontSize: '0.9rem', background: 'var(--store-card-bg, #fff)' }}
                  />
                </div>
              </div>
              {kbArticles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No knowledge base entries yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {kbArticles
                    .filter((kb) => {
                      if (!kbSearchQuery.trim()) return true;
                      const q = kbSearchQuery.toLowerCase();
                      return kb.title.toLowerCase().includes(q) || kb.content.toLowerCase().includes(q);
                    })
                    .map((kb) => (
                      <div key={kb.id} style={{ background: 'var(--store-card-bg, #fff)', border: '1px solid var(--store-border, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                        <button
                          type="button"
                          onClick={() => setKbExpandedId(kbExpandedId === kb.id ? null : kb.id)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}
                        >
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--store-accent, #176c61)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kb.category.replace('_', ' ')}</span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0 0', color: 'var(--store-text, #111827)' }}>{kb.title}</h3>
                          </div>
                          {kbExpandedId === kb.id ? <ChevronUp size={18} style={{ color: '#94a3b8', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                        </button>
                        {kbExpandedId === kb.id && (
                          <div style={{ padding: '0 20px 20px', fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--store-text, #4b5563)', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--store-border, #e2e8f0)' }}>
                            <div style={{ paddingTop: '16px' }}>{kb.content}</div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* Category Landing Page */}
          {contentPage === "category" && currentSeoPage && (
            <>
              <div style={{ background: 'linear-gradient(135deg, var(--store-accent, #176c61), #0f766e)', padding: '40px 32px', borderRadius: '16px', color: 'white', marginBottom: '32px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>{currentSeoPage.niche}</span>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 12px' }}>{currentSeoPage.title}</h1>
                <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0, lineHeight: '1.6', maxWidth: '600px' }}>{currentSeoPage.description}</p>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--store-text, #111827)' }}>Products in "{currentSeoPage.category_name}"</h2>
              <div className="shop-grid">
                {products
                  .filter((p) => {
                    const catLower = currentSeoPage.category_name.toLowerCase();
                    return p.niche.toLowerCase().includes(catLower) || p.name.toLowerCase().includes(catLower) || p.contentAngle.toLowerCase().includes(catLower);
                  })
                  .map((product) => (
                    <article className="shop-card" key={`cat-${product.id}`}>
                      <button className="product-image product-image-button" type="button" onClick={() => openProduct(product)}>
                        <img src={getProductImages(product)[0]} alt="" />
                      </button>
                      <div className="shop-card-body">
                        <span>{product.niche}</span>
                        <h3><button type="button" onClick={() => openProduct(product)}>{product.name}</button></h3>
                        <FormattedProductCopy product={product} variant="card" />
                        <div className="shop-price">
                          <strong>{money(product.retailMin)}</strong>
                          <small>{product.inventory} in stock</small>
                        </div>
                        <div className="shop-actions">
                          <button type="button" onClick={() => setSelectedProduct(product)}>Quick view</button>
                          <button className="primary" type="button" onClick={() => addToCart(product.id)}>
                            <ShoppingCart size={17} /> Add
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </>
          )}
          {contentPage === "category" && !currentSeoPage && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <Globe2 size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Category page not found.</p>
              <button type="button" onClick={() => { window.location.hash = `#${getHashFromMode(activeNiche, stores)}`; }} style={{ marginTop: '12px', background: 'var(--store-accent, #176c61)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Back to Shop</button>
            </div>
          )}
        </section>
      )}

      {contentPage === "shop" && !detailProduct && (
        <>
          {/* Shop By Category Section (General store only) */}
          {activeNiche === "general" && activeSubcategory === "All" && !searchQuery && (
            <section className="category-section" aria-label="Shop by category">
              <h2>Shop By Category</h2>
              <p className="subtitle">Curated collections vetted for quality and value</p>
              <div className="category-grid">
                <button className="category-card" onClick={() => switchStorefront("beauty")} type="button">
                  <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80" alt="GlowTheory Beauty" />
                  <div className="category-card-overlay">
                    <span>GlowTheory</span>
                    <h3>Beauty & Self-Care</h3>
                  </div>
                </button>
                <button className="category-card" onClick={() => switchStorefront("pets")} type="button">
                  <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80" alt="Wagwell Pets" />
                  <div className="category-card-overlay">
                    <span>Wagwell</span>
                    <h3>Pet Supplies</h3>
                  </div>
                </button>
                <button className="category-card" onClick={() => switchStorefront("home")} type="button">
                  <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80" alt="NestTheory Home" />
                  <div className="category-card-overlay">
                    <span>NestTheory</span>
                    <h3>Home Organization</h3>
                  </div>
                </button>
                <button className="category-card" onClick={() => switchStorefront("fitness")} type="button">
                  <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80" alt="RecoverLab Fitness" />
                  <div className="category-card-overlay">
                    <span>RecoverLab</span>
                    <h3>Fitness & Recovery</h3>
                  </div>
                </button>
                <button className="category-card" onClick={() => switchStorefront("automotive")} type="button">
                  <img src="https://images.unsplash.com/photo-1605558202076-1682209015d4?auto=format&fit=crop&w=600&q=80" alt="DriveCraft Automotive" />
                  <div className="category-card-overlay">
                    <span>DriveCraft</span>
                    <h3>Automotive Detailing</h3>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Best Sellers Section */}
          {activeSubcategory === "All" && !searchQuery && storefrontProducts.length > 0 && (
            <section className="category-section" aria-label="Trending best sellers" style={{ borderTop: '1px solid var(--store-border, #e5eaee)', paddingTop: '40px' }}>
              <h2>Trending Best Sellers</h2>
              <p className="subtitle">Our most popular, customer-favorite products</p>
              <div className="shop-grid">
                {storefrontProducts
                  .slice()
                  .sort((a, b) => {
                    if (a.priority === 1 && b.priority !== 1) return -1;
                    if (b.priority === 1 && a.priority !== 1) return 1;
                    return getProductSalesCount(b.id) - getProductSalesCount(a.id);
                  })
                  .slice(0, 4)
                  .map((product) => (
                    <article className="shop-card" key={`best-${product.id}`} style={{ position: 'relative' }}>
                      <span className="card-badge badge-best-seller">
                        🔥 {getProductSalesCount(product.id)} Sold
                      </span>
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
                        <FormattedProductCopy product={product} variant="card" />
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
                  ))
                }
              </div>
            </section>
          )}

          {/* UGC Video Simulator Carousel */}
          {activeSubcategory === "All" && !searchQuery && (
            <section className="ugc-section" aria-label="Customer product demonstrations">
              <div className="ugc-section-container">
                <h2>See It In Action</h2>
                <p className="subtitle">Real customers, real results. Tap to shop featured gear.</p>
                <div className="ugc-carousel">
                  {videoSectionAssets.length > 0 && ugcItems.map((ugc) => {
                    const matchedProd = ugc.product || products.find(p => p.name.toLowerCase().includes(ugc.productName.toLowerCase()) || ugc.productName.toLowerCase().includes(p.name.toLowerCase()));
                    return (
                      <button
                        key={ugc.id}
                        className="ugc-card"
                        type="button"
                        onClick={() => {
                          if (matchedProd) {
                            openProduct(matchedProd);
                          } else {
                            addToast(`Opening ${ugc.productName} catalog page`, "info");
                          }
                        }}
                      >
                        <span className="ugc-tag">{ugc.tag}</span>
                        {ugc.kind === "video" ? (
                          <video src={ugc.mediaUrl} muted playsInline preload="metadata" />
                        ) : (
                          <img src={ugc.mediaUrl} alt="" />
                        )}
                        <div className="ugc-play-overlay">
                          <div className="ugc-play-btn">
                            <Play size={18} fill="#11191d" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                        <div className="ugc-info">
                          <span className="ugc-handle">{ugc.handle}</span>
                          <span className="ugc-caption">{ugc.caption}</span>
                        </div>
                      </button>
                    );
                  })}
                  {videoSectionAssets.length === 0 && [
                    {
                      id: "ugc_1",
                      handle: "@glow_beauty_routine",
                      caption: "Honestly this LED neck lifter is key to my morning routine! ✨",
                      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
                      productName: "LED Neck Lift Massager",
                      tag: "Beauty"
                    },
                    {
                      id: "ugc_2",
                      handle: "@pup_adventure_life",
                      caption: "The portable feeding bottle is a lifesaver for roadtrips! 🐶🎒",
                      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80",
                      productName: "Portable Pet Water Bottle",
                      tag: "Pets"
                    },
                    {
                      id: "ugc_3",
                      handle: "@recover_athlete_lab",
                      caption: "Soreness gone in minutes. Highly recommend this massage roller! 🏋️‍♂️💪",
                      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
                      productName: "Medusa Smart Massage Roller",
                      tag: "Recovery"
                    },
                    {
                      id: "ugc_4",
                      handle: "@organized_home_nest",
                      caption: "Finally organized my kitchen drawers! So satisfying 🍳✨",
                      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
                      productName: "Drawer Organizer",
                      tag: "Kitchen"
                    },
                    {
                      id: "ugc_5",
                      handle: "@detailing_car_craft",
                      caption: "Showroom finish using the microfiber spray wash! 🧼🏎️",
                      image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=400&q=80",
                      productName: "Microfiber Detailing Spray Wash",
                      tag: "Garage"
                    }
                  ].map((ugc) => {
                    const matchedProd = products.find(p => p.name.toLowerCase().includes(ugc.productName.toLowerCase()) || ugc.productName.toLowerCase().includes(p.name.toLowerCase()));
                    return (
                      <button
                        key={ugc.id}
                        className="ugc-card"
                        type="button"
                        onClick={() => {
                          if (matchedProd) {
                            openProduct(matchedProd);
                          } else {
                            addToast(`Opening ${ugc.productName} catalog page`, "info");
                          }
                        }}
                      >
                        <span className="ugc-tag">{ugc.tag}</span>
                        <img src={ugc.image} alt="" />
                        <div className="ugc-play-overlay">
                          <div className="ugc-play-btn">
                            <Play size={18} fill="#11191d" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                        <div className="ugc-info">
                          <span className="ugc-handle">{ugc.handle}</span>
                          <span className="ugc-caption">{ugc.caption}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Brand Mission Section */}
          {activeSubcategory === "All" && !searchQuery && (
            <section className="mission-section" aria-label="Our brand mission">
              <h2>Vetted for Quality. Built for Living.</h2>
              <p>
                At {config.label}, we believe in curation over clutter. We source, test, and vet every single product in our catalog to ensure it delivers on construction, durability, and practical utility. When you shop with us, you're shopping products that have been approved by experts and everyday families alike.
              </p>
            </section>
          )}

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
                {(() => {
                  if (product.inventory > 0 && product.inventory < 20) {
                    return (
                      <span className="card-badge badge-limited">
                        ⚠️ Only {product.inventory} Left
                      </span>
                    );
                  }
                  if (product.priority === 1) {
                    return (
                      <span className="card-badge badge-best-seller">
                        🔥 Best Seller
                      </span>
                    );
                  }
                  if (product.priority === 2 || getProductSalesCount(product.id) > 15) {
                    return (
                      <span className="card-badge badge-trending">
                        ⚡ Trending
                      </span>
                    );
                  }
                  if (product.source === "medusa" || product.id.charCodeAt(product.id.length - 1) % 2 === 0) {
                    return (
                      <span className="card-badge badge-new">
                        ✨ New
                      </span>
                    );
                  }
                  return null;
                })()}
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
                <FormattedProductCopy product={product} variant="card" />
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
          {cartItems.length > 0 && (
            <div className="shipping-progress-container" style={{ margin: '12px 0 6px' }}>
              <div className="shipping-progress-text">
                {subtotal >= freeShippingLimit ? (
                  <span>🎉 <strong>Free Shipping Unlocked!</strong></span>
                ) : (
                  <span>Add <strong>{money(freeShippingLimit - subtotal)}</strong> for free shipping</span>
                )}
                <span>{Math.min(100, Math.round((subtotal / freeShippingLimit) * 100))}%</span>
              </div>
              <div className="shipping-progress-bar-bg">
                <div 
                  className="shipping-progress-bar-fill" 
                  style={{ width: `${Math.min(100, (subtotal / freeShippingLimit) * 100)}%` }} 
                />
              </div>
            </div>
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
      </>
      )}


      {detailProduct && (
        <ProductDetailPage
          product={detailProduct}
          products={products}
          quantity={productQuantities[detailProduct.id] || 1}
          stores={stores}
          onBack={() => {
            window.location.hash = `#${getHashFromMode(detailProduct.subdomain, stores)}`;
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
          getReviewsList={getProductReviewsList}
          getAverageRating={getProductAverageRating}
          onAddReview={(productId, review) => {
            setCustomReviews(current => ({
              ...current,
              [productId]: [review, ...(current[productId] || [])]
            }));
            addToast("Review submitted successfully! Thank you.", "success");
          }}
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
                      triggerTrack("email_capture");

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
                {googleAuthStatus === "loading" && (
                  <p className="auth-info-note">
                    Loading Google sign-in...
                  </p>
                )}
                {(googleAuthStatus === "inactive" || googleAuthStatus === "error") && (
                  <p className="auth-info-note">
                    {googleAuthMessage || "Live Google OAuth is inactive. Use email and password sign-in below."}
                  </p>
                )}
              </div>

              <div className="auth-divider">
                <span>Email sign in</span>
              </div>

              <form
                onSubmit={handleEmailPasswordLogin}
                className="custom-login-form"
              >
                <div className="input-group">
                  <label htmlFor="customName">Full Name</label>
                  <input id="customName" name="customName" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="e.g. Sarah Connor" />
                </div>
                <div className="input-group">
                  <label htmlFor="customEmail">Email Address</label>
                  <input id="customEmail" name="customEmail" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="e.g. sarah@example.com" required />
                </div>
                <div className="input-group">
                  <label htmlFor="customPassword">Password</label>
                  <input id="customPassword" name="customPassword" type="password" value={authPasswordInput} onChange={(event) => setAuthPasswordInput(event.target.value)} placeholder="Enter your password" required />
                </div>
                {authError && <div className="auth-error" role="alert">{authError}</div>}
                <p className="auth-info-note">
                  Use your configured admin email and password for admin access. Customer accounts can sign in with email and password until Google OAuth is connected.
                </p>
                <button type="submit" className="primary full" style={{ minHeight: '44px' }}>
                  Sign In
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
            <h4>{config.label}</h4>
            <p style={{ fontSize: '0.84rem', margin: '8px 0 16px', color: '#8c9ba5' }}>
              {config.positioning}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#5a6b74' }}>
              &copy; {new Date().getFullYear()} {config.label}. All rights reserved.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <button type="button" onClick={() => {
              setSearchQuery("");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>Shop Home</button>
            <button type="button" onClick={() => setIsTrackOrderOpen(true)}>Track Shipment</button>
            <button type="button" onClick={() => { window.location.hash = '#blog'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Blog</button>
            <button type="button" onClick={() => { window.location.hash = '#kb'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Help Center</button>
          </div>

          <div className="footer-column">
            <h4>Customer Care</h4>
            <button type="button" onClick={() => setIsPortalOpen(true)}>
              {currentUser ? "My Account & Wishlist" : "Customer Log In / Register"}
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); addToast("Help Center stub: support@products4thepeople.com", "info"); }}>Support Email</a>
          </div>

          <div className="footer-column">
            <h4>Explore Brands</h4>
            {Object.keys(stores)
              .filter((key) => currentUser?.isAdmin || stores[key].status === "active")
              .map((niche) => {
                const s = stores[niche];
                const labelSuffix = currentUser?.isAdmin && s.status !== "active" ? ` (${titleCase(s.status || "draft")})` : "";
                return (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => {
                      switchStorefront(niche);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {s.label}{labelSuffix}
                  </button>
                );
              })}
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
              {cartItems.length > 0 && (
                <div className="shipping-progress-container">
                  <div className="shipping-progress-text">
                    {subtotal >= freeShippingLimit ? (
                      <span>🎉 <strong>Congratulations!</strong> You've unlocked Free Shipping!</span>
                    ) : (
                      <span>Spend <strong>{money(freeShippingLimit - subtotal)}</strong> more for <strong>FREE SHIPPING</strong></span>
                    )}
                    <span>{Math.min(100, Math.round((subtotal / freeShippingLimit) * 100))}%</span>
                  </div>
                  <div className="shipping-progress-bar-bg">
                    <div 
                      className="shipping-progress-bar-fill" 
                      style={{ width: `${Math.min(100, (subtotal / freeShippingLimit) * 100)}%` }} 
                    />
                  </div>
                </div>
              )}
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

          <FormattedProductCopy product={product} variant="quick" />

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

function FormattedProductCopy({ product, variant }: { product: Product; variant: "card" | "quick" | "detail" }) {
  const copy = getConsumerCopy(product);
  return <FormattedText text={copy} className={`product-copy product-copy-${variant}`} />;
}

function FormattedText({ text, className }: { text: string; className: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((line) => /^([-*•]|\d+[.)])\s+/.test(line));
        if (isList) {
          return (
            <ul key={`${blockIndex}-${block.slice(0, 20)}`}>
              {lines.map((line, lineIndex) => (
                <li key={`${lineIndex}-${line.slice(0, 20)}`}>{line.replace(/^([-*•]|\d+[.)])\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${blockIndex}-${block.slice(0, 20)}`}>
            {lines.map((line, lineIndex) => (
              <React.Fragment key={`${lineIndex}-${line.slice(0, 20)}`}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ProductCoverflowGallery({ product, images }: { product: Product; images: string[] }) {
  const [activeImage, setActiveImage] = React.useState(0);
  const [isZoomOpen, setIsZoomOpen] = React.useState(false);
  const totalImages = images.length;

  React.useEffect(() => {
    setActiveImage(0);
    setIsZoomOpen(false);
  }, [product.id]);

  React.useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsZoomOpen(false);
      if (event.key === "ArrowLeft") setActiveImage((current) => (current - 1 + totalImages) % totalImages);
      if (event.key === "ArrowRight") setActiveImage((current) => (current + 1) % totalImages);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, totalImages]);

  const goToImage = (index: number) => setActiveImage((index + totalImages) % totalImages);
  const goToPrevious = () => goToImage(activeImage - 1);
  const goToNext = () => goToImage(activeImage + 1);

  return (
    <>
      <div className="product-gallery coverflow-gallery">
        <div className="coverflow-stage" aria-label={`${product.name} image gallery`}>
          {images.map((image, index) => {
            const distance = index - activeImage;
            const absDistance = Math.abs(distance);
            const isActive = index === activeImage;
            return (
              <button
                aria-label={`View ${product.name} image ${index + 1}`}
                className={`coverflow-card${isActive ? " active" : ""}`}
                key={`${product.id}-${image}-${index}`}
                onClick={() => isActive ? setIsZoomOpen(true) : goToImage(index)}
                style={{
                  transform: `translateX(${distance * 42}%) translateZ(${-absDistance * 84}px) rotateY(${distance * -34}deg) scale(${isActive ? 1 : Math.max(0.72, 0.88 - absDistance * 0.05)})`,
                  zIndex: 20 - absDistance,
                  opacity: absDistance > 3 ? 0 : 1,
                  pointerEvents: absDistance > 3 ? "none" : "auto"
                }}
                type="button"
              >
                <img src={image} alt={isActive ? product.name : ""} />
              </button>
            );
          })}
          {totalImages > 1 && (
            <>
              <button className="coverflow-nav prev" type="button" onClick={(event) => { event.stopPropagation(); goToPrevious(); }} aria-label="Previous image">
                <ChevronLeft size={20} />
              </button>
              <button className="coverflow-nav next" type="button" onClick={(event) => { event.stopPropagation(); goToNext(); }} aria-label="Next image">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <button className="coverflow-zoom" type="button" onClick={(event) => { event.stopPropagation(); setIsZoomOpen(true); }} aria-label="Open larger image viewer">
            <ZoomIn size={18} />
            <span>Zoom</span>
          </button>
        </div>

        <div className="coverflow-filmstrip" aria-label={`${product.name} image thumbnails`}>
          {images.map((image, index) => (
            <button
              className={activeImage === index ? "active" : ""}
              key={`${product.id}-thumb-${image}-${index}`}
              type="button"
              onClick={() => goToImage(index)}
              aria-label={`Select image ${index + 1}`}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
        <div className="coverflow-counter" aria-live="polite">
          {activeImage + 1} / {totalImages}
        </div>
      </div>

      {isZoomOpen && (
        <div className="modal-backdrop image-viewer-backdrop" role="presentation" onClick={() => setIsZoomOpen(false)}>
          <div
            className="image-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-viewer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-viewer-header">
              <div>
                <p>Gallery</p>
                <h2 id="image-viewer-title">{product.name}</h2>
              </div>
              <button type="button" onClick={() => setIsZoomOpen(false)} aria-label="Close image viewer">
                <X size={20} />
              </button>
            </div>
            <div className="image-viewer-stage">
              {totalImages > 1 && (
                <button className="image-viewer-nav prev" type="button" onClick={goToPrevious} aria-label="Previous image">
                  <ChevronLeft size={24} />
                </button>
              )}
              <img src={images[activeImage]} alt={product.name} />
              {totalImages > 1 && (
                <button className="image-viewer-nav next" type="button" onClick={goToNext} aria-label="Next image">
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <div className="image-viewer-footer">
              <span>{activeImage + 1} of {totalImages}</span>
              <div>
                {images.map((image, index) => (
                  <button
                    className={activeImage === index ? "active" : ""}
                    key={`${product.id}-zoom-thumb-${image}-${index}`}
                    type="button"
                    onClick={() => goToImage(index)}
                    aria-label={`Select large image ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductDetailPage({
  product,
  products,
  quantity,
  stores,
  onBack,
  onOpenProduct,
  onQuantityChange,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  getReviewsList,
  getAverageRating,
  onAddReview,
}: {
  product: Product;
  products: Product[];
  quantity: number;
  stores: Record<string, StorefrontNicheConfig>;
  onBack: () => void;
  onOpenProduct: (product: Product) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: (quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  getReviewsList: (product: Product) => ProductReview[];
  getAverageRating: (product: Product) => number;
  onAddReview: (productId: string, review: ProductReview) => void;
}) {
  const [activeAccordion, setActiveAccordion] = React.useState<"benefits" | "reviews" | "faq" | null>("benefits");
  const [showSticky, setShowSticky] = React.useState(false);

  // Review form states
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formRating, setFormRating] = React.useState(5);
  const [formAuthor, setFormAuthor] = React.useState("");
  const [formText, setFormText] = React.useState("");

  const images = getProductImages(product);
  const subcategory = getProductSubcategory(product);
  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.status === "Active" && getProductSubcategory(item) === subcategory)
    .slice(0, 4);

  const reviewsList = getReviewsList(product);
  const averageRating = getAverageRating(product);

  React.useEffect(() => {
    const handleScroll = () => {
      // Toggle sticky bar when scrolled past 320px on mobile viewports
      if (window.scrollY > 320 && window.innerWidth <= 768) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleAccordion = (section: "benefits" | "reviews" | "faq") => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuthor.trim() || !formText.trim()) return;

    const newReview: ProductReview = {
      id: `rev_custom_${Date.now()}`,
      author: formAuthor.trim(),
      rating: formRating,
      date: "Today",
      text: formText.trim(),
      verified: true
    };

    onAddReview(product.id, newReview);
    
    // Reset form
    setFormAuthor("");
    setFormText("");
    setFormRating(5);
    setIsFormOpen(false);
    
    // Automatically open reviews tab to show the new review
    setActiveAccordion("reviews");
  };

  // Calculate review percentages for bar graphs
  const totalReviewsCount = reviewsList.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 represents 5 stars, index 4 represents 1 star
  reviewsList.forEach(r => {
    const starIndex = 5 - Math.round(r.rating);
    if (starIndex >= 0 && starIndex < 5) {
      ratingDistribution[starIndex]++;
    }
  });

  return (
    <section className="product-detail-page" aria-labelledby="product-detail-title">
      <button className="detail-back" type="button" onClick={onBack}>
        Back to {(stores[product.subdomain] || stores["general"]).label}
      </button>

      <div className="product-detail-grid">
        <ProductCoverflowGallery product={product} images={images} />

        <div className="product-detail-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{subcategory}</span>
            {product.priority === 1 && (
              <span className="card-badge badge-best-seller" style={{ position: 'relative', top: 'auto', left: 'auto', display: 'inline-flex', padding: '2px 6px', fontSize: '0.62rem' }}>
                🔥 Best Seller
              </span>
            )}
          </div>
          <h2 id="product-detail-title">{product.name}</h2>
          
          {/* Visual Rating Ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 12px' }}>
            <div className="review-stars" style={{ fontSize: '0.9rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ color: i < Math.round(averageRating) ? '#f39c12' : '#ccc' }}>★</span>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => {
                setActiveAccordion("reviews");
                setTimeout(() => {
                  document.querySelector(".accordion-container")?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              style={{ fontSize: '0.8rem', color: '#52636a', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
            >
              {averageRating} ({totalReviewsCount} Review{totalReviewsCount !== 1 ? 's' : ''})
            </button>
          </div>

          <FormattedProductCopy product={product} variant="detail" />

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
            {getProductTrustBadges(product).map((benefit) => (
              <span key={benefit}>✓ {benefit}</span>
            ))}
          </div>

          {/* Expandable Accordion Tabs Section */}
          <div className="accordion-container">
            {/* 1. Key Benefits */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion("benefits")} type="button">
                <span>📋 Product Highlights & Benefits</span>
                {activeAccordion === "benefits" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeAccordion === "benefits" && (
                <div className="accordion-content">
                  <ul style={{ paddingLeft: '16px', margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {getProductHighlights(product).map((highlight) => (
                      <li key={highlight.id} style={{ color: '#52636a' }}>
                        <strong>{highlight.label}</strong>: {highlight.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2. Customer Reviews */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion("reviews")} type="button">
                <span>⭐ Verified Reviews ({totalReviewsCount})</span>
                {activeAccordion === "reviews" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeAccordion === "reviews" && (
                <div className="accordion-content">
                  {/* Reviews Summary Dashboard */}
                  <div className="reviews-summary">
                    <div className="rating-score">
                      <h3>{averageRating}</h3>
                      <div className="stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < Math.round(averageRating) ? '#f39c12' : '#ccc' }}>★</span>
                        ))}
                      </div>
                      <span>Based on {totalReviewsCount} reviews</span>
                    </div>

                    <div className="rating-bars">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = ratingDistribution[5 - stars];
                        const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                        return (
                          <div className="rating-bar-row" key={stars}>
                            <span className="label">{stars} star</span>
                            <div className="rating-bar-bg">
                              <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="percentage">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review writing trigger */}
                  {!isFormOpen ? (
                    <button className="write-review-btn" onClick={() => setIsFormOpen(true)} type="button">
                      ✍️ Write A Product Review
                    </button>
                  ) : (
                    <form className="review-form" onSubmit={handleReviewSubmit}>
                      <label>Your Overall Rating</label>
                      <div className="review-star-picker">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            className={star <= formRating ? "active" : ""}
                            onClick={() => setFormRating(star)}
                            aria-label={`Rate ${star} star`}
                          >
                            <span style={{ fontSize: '1.4rem' }}>★</span>
                          </button>
                        ))}
                      </div>

                      <label htmlFor="reviewAuthor">Your Name</label>
                      <input 
                        id="reviewAuthor"
                        value={formAuthor} 
                        onChange={(e) => setFormAuthor(e.target.value)} 
                        placeholder="e.g. Alex M." 
                        required 
                      />

                      <label htmlFor="reviewText">Review Comments</label>
                      <textarea 
                        id="reviewText"
                        value={formText} 
                        onChange={(e) => setFormText(e.target.value)} 
                        placeholder="What did you like or dislike? How is the quality?" 
                        rows={3} 
                        required 
                      />

                      <div className="review-form-actions">
                        <button className="cancel" type="button" onClick={() => setIsFormOpen(false)}>
                          Cancel
                        </button>
                        <button className="submit" type="submit">
                          Submit Review
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  <div className="review-list" style={{ marginTop: '20px' }}>
                    {reviewsList.map((review) => (
                      <div className="review-item" key={review.id}>
                        <div className="review-item-header">
                          <div className="review-author-info">
                            <span className="review-author-name">
                              {review.author}
                              {review.verified && <span className="verified-badge">✓ Verified Buyer</span>}
                            </span>
                            <span className="review-date">{review.date}</span>
                          </div>
                          <div className="review-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} style={{ color: i < review.rating ? '#f39c12' : '#ccc' }}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="review-text">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. FAQ & Shipping */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion("faq")} type="button">
                <span>🚚 Shipping Policies & Product FAQs</span>
                {activeAccordion === "faq" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeAccordion === "faq" && (
                <div className="accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#11191d', marginBottom: '2px' }}>When will my order ship?</strong>
                    <span style={{ fontSize: '0.82rem' }}>All orders are processed and shipped from our fulfillment center within 24-48 hours. Shipping usually takes 3 to 7 business days.</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#11191d', marginBottom: '2px' }}>How do I track my delivery?</strong>
                    <span style={{ fontSize: '0.82rem' }}>Once shipped, you will receive a tracking reference code. You can paste this code into the Order Tracking tab in the menu to track milestones in real-time.</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#11191d', marginBottom: '2px' }}>What is your return policy?</strong>
                    <span style={{ fontSize: '0.82rem' }}>We offer a 30-day money-back guarantee. If you are not fully satisfied, return your item in original packaging for a full, hassle-free refund.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className={`sticky-cart-bar${showSticky ? " visible" : ""}`}>
        <div className="sticky-cart-info">
          <img src={images[0]} alt="" />
          <div className="sticky-cart-text">
            <strong>{product.name}</strong>
            <span>{money(product.retailMin)}</span>
          </div>
        </div>
        <div className="sticky-cart-action">
          <button type="button" onClick={() => onAddToCart(quantity)}>
            <ShoppingCart size={15} />
            <span>Add</span>
          </button>
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
    if (stored) {
      const parsed = JSON.parse(stored) as { email?: string; signedInAt?: string; isAdmin?: boolean };
      if (Boolean(parsed.signedInAt) && (parsed.email?.toLowerCase() === adminEmail.toLowerCase() || parsed.isAdmin)) {
        return true;
      }
    }

    const customerStored = localStorage.getItem("p4tp_customer");
    if (!customerStored) return false;
    const customer = JSON.parse(customerStored) as { email?: string; isAdmin?: boolean };
    const customerIsAdmin = customer.isAdmin || customer.email?.toLowerCase() === adminEmail.toLowerCase();
    if (customerIsAdmin && customer.email) {
      saveAdminSession(customer.email);
      return true;
    }
    return false;
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
  const adminHashes = ["admin", "dashboard", "import", "orders", "customers", "media", "funnels", "analytics", "ai", "settings", "seo-hub"];
  const isAdmin = adminHashes.includes(normalized) || normalized.startsWith("admin-");
  return !isAdmin;
}

function loadStoresConfig(): Record<string, StorefrontNicheConfig> {
  try {
    const stored = localStorage.getItem("p4tp-stores-config");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse stores config:", e);
  }
  return storefrontNiches;
}

function getHashFromMode(mode: string, storesList: Record<string, StorefrontNicheConfig>): string {
  if (mode === "general") return "products4thepeople";
  if (mode === "beauty") return "glowtheory";
  if (mode === "pets") return "wagwell";
  if (mode === "home") return "nesttheory";
  if (mode === "fitness") return "recoverlab";
  if (mode === "automotive") return "drivecraft";
  return mode;
}

function getModeFromHash(hash: string, storesList: Record<string, StorefrontNicheConfig>): string {
  const normalized = hash.toLowerCase();
  if (normalized === "products4thepeople" || normalized === "general") return "general";
  if (normalized === "glowtheory" || normalized === "beauty") return "beauty";
  if (normalized === "wagwell" || normalized === "pets") return "pets";
  if (normalized === "nesttheory" || normalized === "home") return "home";
  if (normalized === "recoverlab" || normalized === "fitness") return "fitness";
  if (normalized === "drivecraft" || normalized === "automotive") return "automotive";
  
  if (storesList[normalized]) return normalized;
  
  const foundKey = Object.keys(storesList).find(key => {
    const store = storesList[key];
    return key.toLowerCase() === normalized ||
           store.label.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized ||
           store.host.split(".")[0] === normalized;
  });
  
  return foundKey || "general";
}

function getStorefrontModeFromHostname(): StorefrontMode {
  const host = window.location.hostname.toLowerCase();
  const stores = loadStoresConfig();
  
  const matchedKey = Object.keys(stores).find(key => {
    const store = stores[key];
    return host === store.host.toLowerCase() || host.startsWith(`${key.toLowerCase()}.`);
  });
  
  if (matchedKey) return matchedKey;

  if (host.startsWith("beauty") || host.startsWith("glowtheory")) return "beauty";
  if (host.startsWith("pets") || host.startsWith("wagwell")) return "pets";
  if (host.startsWith("home") || host.startsWith("nesttheory")) return "home";
  if (host.startsWith("fitness") || host.startsWith("recoverlab")) return "fitness";
  if (host.startsWith("automotive") || host.startsWith("drivecraft")) return "automotive";
  
  return "general";
}

function getStorefrontModeFromHash(): StorefrontMode {
  const normalized = window.location.hash.replace("#", "").toLowerCase();
  const stores = loadStoresConfig();
  return getModeFromHash(normalized, stores);
}

function getProductIdFromHash() {
  const normalized = window.location.hash.replace("#", "");
  return normalized.startsWith("product/") ? decodeURIComponent(normalized.replace("product/", "")) : null;
}

function toForm(product: Product): ProductForm {
  const { id: _id, ...form } = product;
  return form;
}

function countByNiche(products: Product[], niche: string) {
  return products.filter((product) => product.subdomain === niche).length;
}

function getSubcategories(products: Product[]) {
  const categories = Array.from(new Set(products.map(getProductSubcategory)));
  return ["All", ...categories.sort((first, second) => first.localeCompare(second))];
}

function getProductSubcategory(product: Product | ProductForm) {
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
  if (product.images?.length) return product.images.map(normalizeMediaUrl).filter(Boolean);
  const fallback = productImageFallbacks[getProductSubcategory(product)] || productImageFallbacks.Featured;
  return fallback.map((url) => `${url}&auto=format&fit=crop&w=1200&q=80`);
}

function getConsumerCopy(product: Product) {
  const subcategory = getProductSubcategory(product);
  const angle = product.contentAngle.trim();
  if (angle) {
    const hasExistingFormatting = /[\r\n]|(^|\n)\s*([-*•]|\d+[.)])\s+/.test(angle);
    if (hasExistingFormatting) return angle;
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

function getProductBenefits(product: Product | ProductForm) {
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

function getDefaultProductTrustBadges(product: Product | ProductForm) {
  return [...getProductBenefits(product).slice(0, 2), "Secure Checkout"];
}

function getProductTrustBadges(product: Product) {
  const customBadges = (product.trustBadges || []).map((badge) => badge.trim()).filter(Boolean);
  return customBadges.length > 0 ? customBadges : getDefaultProductTrustBadges(product);
}

function getDefaultProductHighlights(product: Product | ProductForm): ProductHighlight[] {
  return [
    ...getProductBenefits(product).map((benefit) => ({
      id: benefit.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `highlight-${benefit.length}`,
      label: benefit,
      description: "Engineered for professional-grade performance and daily reliability.",
    })),
    {
      id: "free-shipping",
      label: "Free Shipping",
      description: "Automatically qualifies for free shipping (minimum $25 checkout).",
    },
  ];
}

function getProductHighlights(product: Product) {
  const customHighlights = (product.productHighlights || [])
    .map((highlight) => ({
      ...highlight,
      label: highlight.label.trim(),
      description: highlight.description.trim(),
    }))
    .filter((highlight) => highlight.label && highlight.description);
  return customHighlights.length > 0 ? customHighlights : getDefaultProductHighlights(product);
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

function injectJsonLd(data: Record<string, any>) {
  removeJsonLd();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "p4tp-jsonld";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function removeJsonLd() {
  const existing = document.getElementById("p4tp-jsonld");
  if (existing) existing.remove();
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

function normalizeSubdomain(valueToNormalize: string): string {
  const normalized = slugify(valueToNormalize);
  if (normalized.includes("pet")) return "pets";
  if (normalized.includes("home")) return "home";
  if (normalized.includes("fit")) return "fitness";
  if (normalized.includes("auto") || normalized.includes("car")) return "automotive";
  
  const stores = loadStoresConfig();
  const matchedKey = Object.keys(stores).find(key => 
    normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)
  );
  if (matchedKey) return matchedKey;
  
  return "beauty";
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// ==========================================
// Phase 0: Product Research Tool UI Components
// ==========================================

interface ResearchWorkspaceProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setNotice: (notice: string) => void;
}

function ResearchWorkspace({ products, setProducts, setNotice }: ResearchWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<"opportunities" | "gaps" | "demand" | "competitors" | "aliexpress">("opportunities");
  const [opportunities, setOpportunities] = React.useState<ResearchOpportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [nicheFilter, setNicheFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [scoreFilter, setScoreFilter] = React.useState("all");
  const [marginFilter, setMarginFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [selectedOppId, setSelectedOppId] = React.useState<string | null>(null);

  // AliExpress search states
  const [aliexpressQuery, setAliexpressQuery] = React.useState("");
  const [aliexpressResults, setAliexpressResults] = React.useState<SupplierProduct[]>([]);
  const [searchingAliExpress, setSearchingAliExpress] = React.useState(false);
  const [importingSupplierId, setImportingSupplierId] = React.useState<string | null>(null);
  const [importStep, setImportStep] = React.useState(0);
  const [importingOpportunityId, setImportingOpportunityId] = React.useState<string | undefined>(undefined);

  // Demand states
  const [manualTrendKeyword, setManualTrendKeyword] = React.useState("");
  const [manualTrendUrl, setManualTrendUrl] = React.useState("");
  const [manualTrendNiche, setManualTrendNiche] = React.useState("Beauty");

  // Competitor states
  const [competitorStoreName, setCompetitorStoreName] = React.useState("");
  const [competitorProductUrl, setCompetitorProductUrl] = React.useState("");
  const [competitorProductTitle, setCompetitorProductTitle] = React.useState("");
  const [competitorPrice, setCompetitorPrice] = React.useState("");
  const [competitorNiche, setCompetitorNiche] = React.useState("Beauty");
  const [competitorsList, setCompetitorsList] = React.useState<CompetitorProduct[]>([]);

  const loadOpps = async () => {
    setLoadingOpps(true);
    try {
      const res = await getOpportunities();
      setOpportunities(res.opportunities || []);
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to load opportunities: ${e.message}` : "Failed to load opportunities");
    } finally {
      setLoadingOpps(false);
    }
  };

  const loadCompetitors = async () => {
    try {
      const res = await getCompetitors();
      setCompetitorsList(res.competitors || []);
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to load competitors: ${e.message}` : "Failed to load competitors");
    }
  };

  React.useEffect(() => {
    void loadOpps();
    void loadCompetitors();
  }, []);

  const handleGapAnalysis = async () => {
    setLoadingOpps(true);
    try {
      const res = await runGapAnalysis();
      setNotice(res.message);
      void loadOpps();
    } catch (e) {
      setNotice(e instanceof Error ? `Gap analysis failed: ${e.message}` : "Gap analysis failed");
    } finally {
      setLoadingOpps(false);
    }
  };

  const handleToggleWatchlist = async (id: string, currentStatus: string) => {
    try {
      const isWatched = currentStatus !== "watchlist";
      await setWatchlistStatus(id, isWatched);
      setOpportunities(prev => 
        prev.map(opp => opp.id === id ? { ...opp, status: isWatched ? "watchlist" : "discovered" } : opp)
      );
      setNotice(isWatched ? "Added opportunity to watchlist" : "Removed opportunity from watchlist");
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to update watchlist: ${e.message}` : "Watchlist update failed");
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateOpportunity(id, { status: newStatus });
      setOpportunities(prev => 
        prev.map(opp => opp.id === id ? { ...opp, status: newStatus } : opp)
      );
      setNotice(`Opportunity status updated to ${newStatus}`);
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to update status: ${e.message}` : "Status update failed");
    }
  };

  const handleDemandScan = async (id: string) => {
    try {
      const res = await runDemandResearch(id);
      setOpportunities(prev => prev.map(opp => opp.id === id ? res.opportunity : opp));
      setNotice(res.message);
    } catch (e) {
      setNotice(e instanceof Error ? `Demand research failed: ${e.message}` : "Demand research failed");
    }
  };

  const handleCompetitorScan = async (id: string) => {
    try {
      const res = await runCompetitorResearch(id);
      setOpportunities(prev => prev.map(opp => opp.id === id ? res.opportunity : opp));
      setCompetitorsList(prev => [...(res.competitors || []), ...prev]);
      setNotice(res.message);
    } catch (e) {
      setNotice(e instanceof Error ? `Competitor research failed: ${e.message}` : "Competitor research failed");
    }
  };

  const handleAliExpressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliexpressQuery.trim()) return;
    setSearchingAliExpress(true);
    try {
      const res = await searchAliExpress(aliexpressQuery);
      setAliexpressResults(res.suppliers || []);
      setNotice(`Found ${res.suppliers?.length || 0} AliExpress listings matching "${aliexpressQuery}"`);
    } catch (e) {
      setNotice(e instanceof Error ? `Search failed: ${e.message}` : "AliExpress search failed");
    } finally {
      setSearchingAliExpress(false);
    }
  };

  const triggerImportFlow = async (supplierProductId: string, oppId?: string) => {
    setImportingSupplierId(supplierProductId);
    setImportingOpportunityId(oppId);
    setImportStep(1);

    // Simulate step-by-step intake progress bar
    const totalSteps = 15;
    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 180));
      setImportStep(step);
    }

    try {
      const res = await importSupplierProduct(supplierProductId, oppId);
      setNotice(res.message);
      
      // Update local catalog products list
      const productRes = await fetch(apiUrl("/products"));
      if (productRes.ok) {
        const prodData = await productRes.json();
        setProducts(prodData.products || []);
      }

      // Reload opportunities to sync status
      void loadOpps();
      setSelectedOppId(null);
    } catch (e) {
      setNotice(e instanceof Error ? `Import workflow failed: ${e.message}` : "Import failed");
    } finally {
      setImportingSupplierId(null);
      setImportingOpportunityId(undefined);
      setImportStep(0);
    }
  };

  const handleAddManualTrend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTrendKeyword.trim()) return;

    try {
      const nicheMap: Record<string, string> = {
        "Beauty": "beauty",
        "Pets": "pets",
        "Home": "home",
        "Fitness": "fitness"
      };
      
      await createOpportunity({
        name: manualTrendKeyword,
        niche: manualTrendNiche,
        subdomain: nicheMap[manualTrendNiche] || "beauty",
        category: "Manual Entry",
        source: "logged_trend",
        source_url: manualTrendUrl || `https://trends.google.com/trends/explore?q=${encodeURIComponent(manualTrendKeyword)}`,
        opportunity_score: 70,
        demand_score: 75,
        margin_score: 75,
        supplier_score: 65,
        competition_score: 60,
        brand_fit_score: 80,
        content_score: 75,
        risk_score: 10,
        risk_notes: "Logged manually by administrator"
      });

      setManualTrendKeyword("");
      setManualTrendUrl("");
      setNotice(`Manually logged "${manualTrendKeyword}" as a discovered research opportunity.`);
      void loadOpps();
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to log opportunity: ${e.message}` : "Failed to log opportunity");
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorStoreName.trim()) return;

    try {
      const res = await createCompetitor({
        opportunity_id: null,
        competitor_name: competitorStoreName,
        competitor_url: competitorProductUrl,
        product_title: competitorProductTitle || `Competitor product - ${competitorStoreName}`,
        price: Number(competitorPrice) || 0,
        sales_signal: "Manual capture",
        offer_notes: `Assigned niche: ${competitorNiche}`,
        positioning_notes: "Manual competitor capture. Review visible pricing, offer structure, variants, and trust elements.",
        images: [],
      });

      setCompetitorsList([res.competitor, ...competitorsList]);
      setCompetitorStoreName("");
      setCompetitorProductUrl("");
      setCompetitorProductTitle("");
      setCompetitorPrice("");
      setNotice(`Registered competitor store: ${competitorStoreName}`);
    } catch (error) {
      setNotice(error instanceof Error ? `Competitor capture failed: ${error.message}` : "Competitor capture failed");
    }
  };

  // Filter opportunities list
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (opp.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === "all" || opp.niche.toLowerCase() === nicheFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || opp.status === statusFilter;
    const matchesScore = scoreFilter === "all" ||
      (scoreFilter === "high" && opp.opportunity_score >= 75) ||
      (scoreFilter === "medium" && opp.opportunity_score >= 55 && opp.opportunity_score < 75) ||
      (scoreFilter === "low" && opp.opportunity_score < 55);
    const matchesMargin = marginFilter === "all" ||
      (marginFilter === "high" && opp.margin_score >= 75) ||
      (marginFilter === "medium" && opp.margin_score >= 55 && opp.margin_score < 75) ||
      (marginFilter === "low" && opp.margin_score < 55);
    const matchesRisk = riskFilter === "all" ||
      (riskFilter === "low" && opp.risk_score < 15) ||
      (riskFilter === "medium" && opp.risk_score >= 15 && opp.risk_score < 30) ||
      (riskFilter === "high" && opp.risk_score >= 30);
    const matchesCategory = categoryFilter === "all" || (opp.category || "General") === categoryFilter;
    const createdMs = new Date(opp.created_at).getTime();
    const nowMs = Date.now();
    const matchesDate = dateFilter === "all" ||
      (dateFilter === "7" && nowMs - createdMs <= 7 * 24 * 60 * 60 * 1000) ||
      (dateFilter === "30" && nowMs - createdMs <= 30 * 24 * 60 * 60 * 1000);
    return matchesSearch && matchesNiche && matchesStatus && matchesScore && matchesMargin && matchesRisk && matchesCategory && matchesDate;
  });

  const categoryOptions = Array.from(new Set(opportunities.map(opp => opp.category || "General"))).sort();

  const researchStatuses: ResearchOpportunity["status"][] = [
    "discovered",
    "researching",
    "watchlist",
    "recommended",
    "imported_draft",
    "approved",
    "published",
    "testing",
    "winner",
    "loser",
    "archived",
    "blocked",
  ];

  // Score badge color helper
  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) return "status active"; // Green-ish
    if (score >= 55) return "status review"; // Yellow-ish
    return "status draft"; // Grey-ish
  };

  // Status mapping UI class
  const getStatusClass = (status: string) => {
    if (status === "watchlist") return "status review";
    if (status === "imported_draft") return "status active";
    if (status === "researching") return "status active";
    return "status draft";
  };

  const opportunityMetrics = {
    total: opportunities.length,
    watchlist: opportunities.filter(o => o.status === "watchlist").length,
    gaps: opportunities.filter(o => o.status !== "imported_draft").length,
    imported: opportunities.filter(o => o.status === "imported_draft").length
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Tab Selector Segmented Controls */}
      <div className="segmented" style={{ marginBottom: '0px' }}>
        <button className={activeSubTab === "opportunities" ? "active" : ""} onClick={() => setActiveSubTab("opportunities")} type="button">
          <Gauge size={16} style={{ marginRight: '6px' }} />
          Opportunity Dashboard
        </button>
        <button className={activeSubTab === "gaps" ? "active" : ""} onClick={() => setActiveSubTab("gaps")} type="button">
          <Layers size={16} style={{ marginRight: '6px' }} />
          Catalog Gap Finder
        </button>
        <button className={activeSubTab === "demand" ? "active" : ""} onClick={() => setActiveSubTab("demand")} type="button">
          <TrendingUp size={16} style={{ marginRight: '6px' }} />
          Demand Research
        </button>
        <button className={activeSubTab === "competitors" ? "active" : ""} onClick={() => setActiveSubTab("competitors")} type="button">
          <Users size={16} style={{ marginRight: '6px' }} />
          Competitor Registry
        </button>
        <button className={activeSubTab === "aliexpress" ? "active" : ""} onClick={() => setActiveSubTab("aliexpress")} type="button">
          <Search size={16} style={{ marginRight: '6px' }} />
          AliExpress Finder
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. OPPORTUNITY DASHBOARD SUB-TAB */}
      {/* ========================================== */}
      {activeSubTab === "opportunities" && (
        <>
          <section className="metrics-grid">
            <ResearchMetric icon={Search} label="Opportunities Discovered" value={opportunityMetrics.total.toString()} trend="Continuous evaluations" />
            <ResearchMetric icon={Star} label="Watchlisted Gaps" value={opportunityMetrics.watchlist.toString()} trend="High priority review" />
            <ResearchMetric icon={AlertTriangle} label="Open Catalog Gaps" value={opportunityMetrics.gaps.toString()} trend="Missing niche listings" />
            <ResearchMetric icon={CheckCircle2} label="Imported Drafts" value={opportunityMetrics.imported.toString()} trend="Waiting in catalog review" />
          </section>

          <article className="panel wide">
            <div className="panel-header">
              <div>
                <p>Catalog Intake Queue</p>
                <h2>Profitable Product Recommendations</h2>
              </div>
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gap opportunities"
                  />
                </label>
                <button type="button" onClick={handleGapAnalysis} disabled={loadingOpps} style={{ backgroundColor: '#f3f4f6' }}>
                  <RotateCcw size={17} />
                  Run Gap Analysis
                </button>
              </div>
            </div>

            <div className="segmented" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0px', background: 'transparent', border: '0' }}>
              <select 
                value={nicheFilter} 
                onChange={(e) => setNicheFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Niches</option>
                <option value="Beauty">Beauty</option>
                <option value="Pets">Pets</option>
                <option value="Home">Home</option>
                <option value="Fitness">Fitness</option>
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Statuses</option>
                {researchStatuses.map(status => (
                  <option value={status} key={status}>{titleCase(status.replace("_", " "))}</option>
                ))}
              </select>
              <select 
                value={scoreFilter} 
                onChange={(e) => setScoreFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Scores</option>
                <option value="high">75+ High Score</option>
                <option value="medium">55-74 Medium Score</option>
                <option value="low">Below 55 Low Score</option>
              </select>
              <select 
                value={riskFilter} 
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Risk</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              <select 
                value={marginFilter} 
                onChange={(e) => setMarginFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Margins</option>
                <option value="high">75+ Margin Score</option>
                <option value="medium">55-74 Margin Score</option>
                <option value="low">Below 55 Margin Score</option>
              </select>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">All Categories</option>
                {categoryOptions.map(category => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #dce3e7', borderRadius: '8px', background: '#fff', fontSize: '0.9rem' }}
              >
                <option value="all">Any Discovery Date</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>

            <div className="table-wrap" style={{ marginTop: '14px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Niche / Category</th>
                    <th>Source Signal</th>
                    <th>Opp Score</th>
                    <th>Demand</th>
                    <th>Margin</th>
                    <th>Supplier</th>
                    <th>Competition</th>
                    <th>Risk</th>
                    <th>Intake Pipeline Status</th>
                    <th>Action Plan</th>
                    <th>Execution</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOpps ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '24px' }}>Loading evaluated product opportunities...</td>
                    </tr>
                  ) : filteredOpps.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '24px' }}>
                        No research opportunities found. Click "Run Gap Analysis" to parse missing catalog listings!
                      </td>
                    </tr>
                  ) : filteredOpps.map((opp) => (
                    <tr key={opp.id}>
                      <td>
                        <strong>{opp.name}</strong>
                        <span>Discovered {new Date(opp.created_at).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <strong>{opp.niche}</strong>
                        <span>{opp.category || "General"}</span>
                      </td>
                      <td>
                        <a href={opp.source_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', color: '#176c61', gap: '4px' }}>
                          <Globe2 size={14} />
                          {opp.source === "gap_analysis" ? "Catalog Gap Logs" : (opp.source === "logged_trend" ? "Manual Review" : opp.source || "External")}
                        </a>
                      </td>
                      <td>
                        <span className={getScoreBadgeClass(opp.opportunity_score)} style={{ width: 'max-content', padding: '4px 10px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                          {opp.opportunity_score} / 100
                        </span>
                      </td>
                      <td>{opp.demand_score}</td>
                      <td>{opp.margin_score}</td>
                      <td>{opp.supplier_score}</td>
                      <td>{opp.competition_score}</td>
                      <td>
                        <span className={opp.risk_score >= 30 ? "status draft" : opp.risk_score >= 15 ? "status review" : "status active"}>
                          {opp.risk_score}
                        </span>
                      </td>
                      <td>
                        <select 
                          className={`status-select ${opp.status}`}
                          value={opp.status}
                          onChange={(e) => handleStatusChange(opp.id, e.target.value)}
                        >
                          {researchStatuses.map(status => (
                            <option value={status} key={status}>{titleCase(status.replace("_", " "))}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.85rem' }}>
                          {opp.status === "blocked" ? "Skip" : opp.status === "watchlist" ? "Add to watchlist" : opp.status === "imported_draft" ? "Needs Review" : opp.opportunity_score >= 75 && opp.risk_score < 30 ? "Import now" : opp.risk_score >= 30 ? "Research more" : "Research & import"}
                        </strong>
                        <span style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          {opp.status === "imported_draft" ? "Draft created in product review queue" : "Validate demand, competitor signals, suppliers, and margins"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            type="button" 
                            onClick={() => handleToggleWatchlist(opp.id, opp.status)} 
                            title={opp.status === "watchlist" ? "Remove from Watchlist" : "Add to Watchlist"}
                            style={{ padding: '0 8px', color: opp.status === "watchlist" ? "#eab308" : "#9ca3af" }}
                          >
                            <Star size={17} fill={opp.status === "watchlist" ? "#eab308" : "none"} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSelectedOppId(opp.id)}
                            style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }}
                          >
                            <Eye size={15} style={{ marginRight: '4px' }} />
                            Details
                          </button>
                          <button type="button" onClick={() => handleDemandScan(opp.id)}>
                            Demand
                          </button>
                          <button type="button" onClick={() => handleCompetitorScan(opp.id)}>
                            Competitors
                          </button>
                          {opp.status !== "imported_draft" && (
                            <button 
                              className="primary" 
                              type="button"
                              onClick={() => {
                                setAliexpressQuery(opp.name);
                                setActiveSubTab("aliexpress");
                                void searchAliExpress(opp.name, opp.id).then(res => {
                                  setAliexpressResults(res.suppliers || []);
                                });
                              }}
                            >
                              Find Suppliers
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}

      {/* ========================================== */}
      {/* 2. CATALOG GAP FINDER SUB-TAB */}
      {/* ========================================== */}
      {activeSubTab === "gaps" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Niche Analysis</p>
                <h2>Current Catalog Coverage</h2>
              </div>
              <Layers size={22} />
            </div>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {["Beauty", "Pets", "Home", "Fitness"].map(niche => {
                const nicheProducts = products.filter(p => p.niche.toLowerCase() === niche.toLowerCase() || p.subdomain?.toLowerCase() === niche.toLowerCase());
                return (
                  <div key={niche} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#111827' }}>{niche} Storefront</strong>
                      <span className="status active" style={{ fontSize: '0.75rem' }}>{nicheProducts.length} Active Items</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {nicheProducts.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: '#6b7280', italic: 'true' } as any}>No products in catalog yet.</span>
                      ) : nicheProducts.map(p => (
                        <span key={p.id} style={{ background: '#fff', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#374151' }}>
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Target Gap Recommendations</p>
                <h2>Missing Products By Niche</h2>
              </div>
              <Plus size={22} />
            </div>

            <p style={{ fontSize: '0.88rem', color: '#52636a', lineHeight: '1.45', marginBottom: '14px' }}>
              The following gap items are recommended for dropship test launches. Click <strong>Add to Research</strong> to seed them into the Opportunity Dashboard.
            </p>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { name: "Gua Sha Set", niche: "Beauty", reason: "Entry-level low shipping cost impulse buy" },
                { name: "Slow Feeder Bowl", niche: "Pets", reason: "High-margin solution-based design" },
                { name: "Cable Organizers", niche: "Home", reason: "Viral TikTok/Reels home office essential" },
                { name: "Foam Roller", niche: "Fitness", reason: "Evergreen muscle recovery hero product" },
                { name: "Pet Camera", niche: "Pets", reason: "Premium high-AOV smart monitoring gear" },
                { name: "Facial Steamer", niche: "Beauty", reason: "Premium facial skin prep bundle element" },
                { name: "Sunset Lamp", niche: "Home", reason: "Classic viral bedroom decoration" }
              ].map(gap => {
                const oppExists = opportunities.some(o => o.name.toLowerCase() === gap.name.toLowerCase());
                return (
                  <div key={gap.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: '#111827' }}>
                        {gap.name} <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>({gap.niche})</span>
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{gap.reason}</span>
                    </div>
                    
                    <button 
                      className={oppExists ? "" : "primary"}
                      type="button"
                      disabled={oppExists}
                      onClick={async () => {
                        const nicheMap: Record<string, string> = { "Beauty": "beauty", "Pets": "pets", "Home": "home", "Fitness": "fitness" };
                        await createOpportunity({
                          name: gap.name,
                          niche: gap.niche,
                          subdomain: nicheMap[gap.niche] || "beauty",
                          category: "Skin Refresh",
                          source: "gap_finder",
                          source_url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(gap.name)}`,
                          opportunity_score: 75,
                          demand_score: 80,
                          margin_score: 80,
                          supplier_score: 70,
                          competition_score: 65,
                          brand_fit_score: 85,
                          content_score: 80,
                          risk_score: 10,
                          risk_notes: "Low risk standard gap suggestion."
                        });
                        setNotice(`Added "${gap.name}" to Opportunity Dashboard`);
                        void loadOpps();
                      }}
                      style={{ minHeight: '34px', fontSize: '0.82rem' }}
                    >
                      {oppExists ? "Research Seeding" : "Add to Research"}
                    </button>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. DEMAND RESEARCH SUB-TAB */}
      {/* ========================================== */}
      {activeSubTab === "demand" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'start' }}>
          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Demand Analytics Logs</p>
                <h2>Simulated Customer Intent Tracking</h2>
              </div>
              <TrendingUp size={22} />
            </div>

            <p style={{ fontSize: '0.88rem', color: '#52636a', lineHeight: '1.45', marginBottom: '14px' }}>
              We capture search volume queries from the store index storefronts. Search keywords that have zero catalog hits are flagged here.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Search Query</th>
                    <th>Weekly Searches</th>
                    <th>Niche Target</th>
                    <th>Trend Signal</th>
                    <th>Catalog Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { query: "heatless curls hair band", count: 1840, niche: "Beauty", trend: "+45% Rising", status: "Missing (Catalog Gap)" },
                    { query: "calming dog bed large", count: 1220, niche: "Pets", trend: "+12% Steady", status: "Covered" },
                    { query: "aesthetic desk drawer inserts", count: 950, niche: "Home", trend: "+28% Rising", status: "Missing (Catalog Gap)" },
                    { query: "resistance bands with handles", count: 830, niche: "Fitness", trend: "-5% Declining", status: "Covered" },
                    { query: "led acne treatment spot tool", count: 710, niche: "Beauty", trend: "+60% Hyper-growth", status: "Missing (Catalog Gap)" }
                  ].map(term => (
                    <tr key={term.query}>
                      <td><strong>{term.query}</strong></td>
                      <td>{term.count.toLocaleString()} queries</td>
                      <td>{term.niche}</td>
                      <td style={{ color: term.trend.includes("+") ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{term.trend}</td>
                      <td>
                        <span className={term.status.includes("Missing") ? "status review" : "status active"}>
                          {term.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Trend Registry</p>
                <h2>Manual Social Signal Capture</h2>
              </div>
              <BookOpen size={20} />
            </div>

            <form onSubmit={handleAddManualTrend} className="import-stack">
              <label className="field">
                <span>Trend Product Keyword</span>
                <input 
                  value={manualTrendKeyword} 
                  onChange={(e) => setManualTrendKeyword(e.target.value)} 
                  placeholder="e.g. Microcurrent face device"
                  required
                />
              </label>

              <label className="field">
                <span>TikTok / Instagram Target URL</span>
                <input 
                  value={manualTrendUrl} 
                  onChange={(e) => setManualTrendUrl(e.target.value)} 
                  placeholder="https://tiktok.com/@creator/video/..."
                />
              </label>

              <label className="field">
                <span>Assigned Store Niche</span>
                <select value={manualTrendNiche} onChange={(e) => setManualTrendNiche(e.target.value)}>
                  <option>Beauty</option>
                  <option>Pets</option>
                  <option>Home</option>
                  <option>Fitness</option>
                </select>
              </label>

              <button className="primary full" type="submit">
                Log Social Trend to Research
              </button>
            </form>
          </article>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. COMPETITOR BENCHMARKING SUB-TAB */}
      {/* ========================================== */}
      {activeSubTab === "competitors" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'start' }}>
          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Competitor Intelligence</p>
                <h2>Tracked Competitor Listings</h2>
              </div>
              <Users size={22} />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>Niche / Domain</th>
                    <th>Product Title</th>
                    <th>Retail Price</th>
                    <th>Sales Signal</th>
                    <th>Actionable Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorsList.map(comp => (
                    <tr key={comp.id}>
                      <td>
                        <strong>{comp.competitor_name}</strong>
                        <a href={comp.competitor_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#176c61' }}>
                          Visit Store
                        </a>
                      </td>
                      <td>{comp.offer_notes?.replace("Assigned niche: ", "") || "Manual"}</td>
                      <td>{comp.product_title}</td>
                      <td><strong>${comp.price}</strong></td>
                      <td>
                        <span className={(comp.sales_signal || "").includes("High") ? "status active" : "status review"}>
                          {comp.sales_signal || "Manual capture"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                          Offer bundle discount or 2-day delivery promise to differentiate.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p>Registry Panel</p>
                <h2>Register Competitor Store</h2>
              </div>
              <Plus size={20} />
            </div>

            <form onSubmit={handleAddCompetitor} className="import-stack">
              <label className="field">
                <span>Competitor Store Name</span>
                <input 
                  value={competitorStoreName} 
                  onChange={(e) => setCompetitorStoreName(e.target.value)} 
                  placeholder="e.g. SkinLuxury Inc"
                  required
                />
              </label>

              <label className="field">
                <span>Competitor Product Title</span>
                <input 
                  value={competitorProductTitle} 
                  onChange={(e) => setCompetitorProductTitle(e.target.value)} 
                  placeholder="e.g. LED Facial Sculptor"
                />
              </label>

              <label className="field">
                <span>Product Page URL</span>
                <input 
                  value={competitorProductUrl} 
                  onChange={(e) => setCompetitorProductUrl(e.target.value)} 
                  placeholder="https://competitor.com/products/led-mask"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label className="field">
                  <span>Price Point ($)</span>
                  <input 
                    type="number" 
                    value={competitorPrice} 
                    onChange={(e) => setCompetitorPrice(e.target.value)} 
                    placeholder="29.99"
                  />
                </label>

                <label className="field">
                  <span>Niche Store</span>
                  <select value={competitorNiche} onChange={(e) => setCompetitorNiche(e.target.value)}>
                    <option>Beauty</option>
                    <option>Pets</option>
                    <option>Home</option>
                    <option>Fitness</option>
                  </select>
                </label>
              </div>

              <button className="primary full" type="submit">
                Register Competitor
              </button>
            </form>
          </article>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. ALIEXPRESS PRODUCT FINDER SUB-TAB */}
      {/* ========================================== */}
      {activeSubTab === "aliexpress" && (
        <article className="panel wide">
          <div className="panel-header">
            <div>
              <p>Supplier Adapter Database</p>
              <h2>Search AliExpress Wholesale Directory</h2>
            </div>
            <Search size={22} />
          </div>

          <form onSubmit={handleAliExpressSearch} className="toolbar" style={{ marginBottom: '20px' }}>
            <label className="search" style={{ width: '100%', maxWidth: '500px' }}>
              <Search size={17} />
              <input
                value={aliexpressQuery}
                onChange={(e) => setAliexpressQuery(e.target.value)}
                placeholder="Type query to scan AliExpress (e.g. Gua Sha Set, Dog Harness)"
              />
            </label>
            <button className="primary" type="submit" disabled={searchingAliExpress || !aliexpressQuery.trim()}>
              {searchingAliExpress ? "Searching Directory..." : "Search AliExpress"}
            </button>
          </form>

          {searchingAliExpress ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading wholesale suppliers and computing scores...</div>
          ) : aliexpressResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px', color: '#68777d' }}>
              Enter search query to scan AliExpress product adapters and view land costs, shipping options, and margins.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {aliexpressResults.map((sup) => {
                const variants = typeof sup.variants === 'string' ? JSON.parse(sup.variants) : sup.variants;
                return (
                  <div key={sup.id} style={{ background: '#fff', border: '1px solid #dce3e7', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ height: '180px', background: '#f3f4f6', position: 'relative' }}>
                      <img 
                        src={(typeof sup.images === 'string' ? JSON.parse(sup.images) : sup.images)?.[0] || "https://images.unsplash.com/photo-1607083206968-13611e3d76db"} 
                        alt="Product visual representation"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span className="status active" style={{ position: 'absolute', top: '10px', right: '10px', background: '#176c61', color: '#fff', fontWeight: 'bold' }}>
                        Supplier Score: {sup.supplier_score}
                      </span>
                    </div>

                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4em', lineHeight: '1.2' } as any}>
                        {sup.title}
                      </strong>
                      
                      <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        <strong>Platform store:</strong> {sup.supplier_name}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.84rem', marginTop: '4px' }}>
                        <div><strong>Wholesale cost:</strong> ${sup.price_min} - ${sup.price_max}</div>
                        <div><strong>Shipping:</strong> ${sup.shipping_cost === 0 ? "FREE" : sup.shipping_cost}</div>
                        <div><strong>Rating:</strong> ⭐ {sup.rating} ({sup.review_count} reviews)</div>
                        <div><strong>Delivers:</strong> ~{sup.estimated_delivery_days} days</div>
                      </div>

                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: '6px' }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}>
                          Available Variants:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {variants?.map((v: any, index: number) => (
                            <span key={index} style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                              {v.color || v.size || v.model || "Default"} (${v.cost})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                        <button 
                          className="primary full" 
                          type="button"
                          disabled={importingSupplierId === sup.id}
                          onClick={() => triggerImportFlow(sup.id)}
                        >
                          {importingSupplierId === sup.id ? "Intaking Catalog..." : "Import for Review"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      )}

      {/* ========================================== */}
      {/* PRODUCT IMPORT INTAKE PROGRESS BAR CHECKS OVERLAY */}
      {/* ========================================== */}
      {importingSupplierId && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px', padding: '24px', textAlign: 'center' }}>
            <Sparkles size={36} style={{ color: '#176c61', marginBottom: '14px' }} />
            <h3>Processing One-Click Import Pipeline</h3>
            <p style={{ fontSize: '0.88rem', color: '#68777d', marginBottom: '20px' }}>
              Building product draft and creating supplier adapter mapping.
            </p>

            <div style={{ height: '8px', width: '100%', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(importStep / 15) * 100}%`, 
                  background: '#176c61', 
                  borderRadius: '999px', 
                  transition: 'width 0.15s ease-out' 
                }} 
              />
            </div>

            <div style={{ textAlign: 'left', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: '8px', fontSize: '0.84rem', maxHeight: '140px', overflowY: 'auto' }}>
              <div style={{ fontWeight: 'bold', color: '#176c61', marginBottom: '6px' }}>Pipeline execution:</div>
              <div style={{ color: importStep >= 1 ? '#111827' : '#9ca3af' }}>{importStep >= 1 ? "✓" : "○"} 1. Fetching AliExpress details...</div>
              <div style={{ color: importStep >= 3 ? '#111827' : '#9ca3af' }}>{importStep >= 3 ? "✓" : "○"} 2. Saving supplier platform adapter...</div>
              <div style={{ color: importStep >= 6 ? '#111827' : '#9ca3af' }}>{importStep >= 6 ? "✓" : "○"} 3. Auto-generating SEO titles & descriptions...</div>
              <div style={{ color: importStep >= 9 ? '#111827' : '#9ca3af' }}>{importStep >= 9 ? "✓" : "○"} 4. Simulating ad copy & UGC scripts hooks...</div>
              <div style={{ color: importStep >= 12 ? '#111827' : '#9ca3af' }}>{importStep >= 12 ? "✓" : "○"} 5. Computing target retail margins...</div>
              <div style={{ color: importStep >= 15 ? '#111827' : '#9ca3af' }}>{importStep >= 15 ? "✓" : "○"} 6. Adding draft product into storefronts...</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DETAILED OPPORTUNITY MODAL VIEW */}
      {/* ========================================== */}
      {selectedOppId && (
        <OpportunityDetailModal 
          id={selectedOppId} 
          onClose={() => setSelectedOppId(null)} 
          onImport={triggerImportFlow} 
        />
      )}
    </div>
  );
}

interface DetailModalProps {
  id: string;
  onClose: () => void;
  onImport: (supplierProductId: string, oppId: string) => Promise<void>;
}

function OpportunityDetailModal({ id, onClose, onImport }: DetailModalProps) {
  const [opportunity, setOpportunity] = React.useState<ResearchOpportunity | null>(null);
  const [competitors, setCompetitors] = React.useState<CompetitorProduct[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeModalTab, setActiveModalTab] = React.useState<"scores" | "copy" | "pricing" | "suppliers">("scores");
  const [aiContent, setAiContent] = React.useState<any | null>(null);
  const [generatingAi, setGeneratingAi] = React.useState(false);
  const [updatingResearch, setUpdatingResearch] = React.useState(false);

  // Editable Margin Calculator values
  const [calcCost, setCalcCost] = React.useState("5.99");
  const [calcShipping, setCalcShipping] = React.useState("2.99");
  const [calcRetail, setCalcRetail] = React.useState("29.99");
  const [calcCompare, setCalcCompare] = React.useState("49.99");

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await getOpportunityDetails(id);
      setOpportunity(res.opportunity);
      setCompetitors(res.competitors || []);
      setSuppliers(res.suppliers || []);

      if (res.suppliers?.length > 0) {
        const s = res.suppliers[0];
        setCalcCost(String(s.price_min || "5.99"));
        setCalcShipping(String(s.shipping_cost || "2.99"));
      }
      
      // Auto-recalculate retail recommendation
      if (res.opportunity) {
        const baseCost = res.suppliers?.[0]?.price_min || 6;
        const baseShip = res.suppliers?.[0]?.shipping_cost || 3;
        setCalcRetail(String(Math.round((baseCost + baseShip) * 3)));
        setCalcCompare(String(Math.round((baseCost + baseShip) * 4.5)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadDetails();
  }, [id]);

  const handleGenerateCopy = async () => {
    setGeneratingAi(true);
    try {
      const res = await generateContentForOpportunity(id);
      setAiContent(res.content);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleModalDemandScan = async () => {
    setUpdatingResearch(true);
    try {
      const res = await runDemandResearch(id);
      setOpportunity(res.opportunity);
    } finally {
      setUpdatingResearch(false);
    }
  };

  const handleModalCompetitorScan = async () => {
    setUpdatingResearch(true);
    try {
      const res = await runCompetitorResearch(id);
      setOpportunity(res.opportunity);
      setCompetitors(res.competitors || []);
    } finally {
      setUpdatingResearch(false);
    }
  };

  const handleRescore = async () => {
    if (!opportunity) return;
    setUpdatingResearch(true);
    try {
      const res = await scoreResearchProduct({
        demand_score: opportunity.demand_score,
        margin_score: opportunity.margin_score,
        supplier_score: opportunity.supplier_score,
        competition_score: opportunity.competition_score,
        brand_fit_score: opportunity.brand_fit_score,
        content_score: opportunity.content_score,
        risk_score: opportunity.risk_score,
      });
      const updateRes = await updateOpportunity(opportunity.id, { opportunity_score: res.score });
      setOpportunity(updateRes.opportunity);
    } finally {
      setUpdatingResearch(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: '500px', padding: '40px', textAlign: 'center' }}>
          Intaking opportunity matrix configurations...
        </div>
      </div>
    );
  }

  if (!opportunity) return null;

  // Compute margins
  const costVal = Number(calcCost) || 0;
  const shipVal = Number(calcShipping) || 0;
  const retailVal = Number(calcRetail) || 0;
  const totalLanded = costVal + shipVal;
  const profitVal = retailVal - totalLanded;
  const marginPct = retailVal > 0 ? Math.round((profitVal / retailVal) * 100) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '0px', padding: '0px', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#176c61', fontWeight: 'bold' }}>
              Catalog Research details
            </span>
            <h2 style={{ fontSize: '1.4rem', marginTop: '2px' }}>{opportunity.name}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={handleModalDemandScan} disabled={updatingResearch} style={{ minHeight: '34px', fontSize: '0.78rem' }}>
              Run Demand
            </button>
            <button type="button" onClick={handleModalCompetitorScan} disabled={updatingResearch} style={{ minHeight: '34px', fontSize: '0.78rem' }}>
              Scan Competitors
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ minHeight: '34px', width: '34px', borderRadius: '50%', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '16px', padding: '0 20px', background: '#fff' }}>
          <button 
            type="button" 
            className={activeModalTab === "scores" ? "primary" : ""}
            onClick={() => setActiveModalTab("scores")}
            style={{ border: '0', borderBottom: activeModalTab === "scores" ? '2px solid #176c61' : 'none', minHeight: '44px', borderRadius: '0', background: 'transparent', color: activeModalTab === "scores" ? '#176c61' : '#4b5563', padding: '0 4px' }}
          >
            Opportunity Score Breakdown
          </button>
          <button 
            type="button" 
            className={activeModalTab === "pricing" ? "primary" : ""}
            onClick={() => setActiveModalTab("pricing")}
            style={{ border: '0', borderBottom: activeModalTab === "pricing" ? '2px solid #176c61' : 'none', minHeight: '44px', borderRadius: '0', background: 'transparent', color: activeModalTab === "pricing" ? '#176c61' : '#4b5563', padding: '0 4px' }}
          >
            Margin Calculator & Competitors
          </button>
          <button 
            type="button" 
            className={activeModalTab === "copy" ? "primary" : ""}
            onClick={() => setActiveModalTab("copy")}
            style={{ border: '0', borderBottom: activeModalTab === "copy" ? '2px solid #176c61' : 'none', minHeight: '44px', borderRadius: '0', background: 'transparent', color: activeModalTab === "copy" ? '#176c61' : '#4b5563', padding: '0 4px' }}
          >
            AI Content Previews
          </button>
          <button 
            type="button" 
            className={activeModalTab === "suppliers" ? "primary" : ""}
            onClick={() => setActiveModalTab("suppliers")}
            style={{ border: '0', borderBottom: activeModalTab === "suppliers" ? '2px solid #176c61' : 'none', minHeight: '44px', borderRadius: '0', background: 'transparent', color: activeModalTab === "suppliers" ? '#176c61' : '#4b5563', padding: '0 4px' }}
          >
            Wholesale Suppliers
          </button>
        </div>

        {/* Modal Content Area */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '500px', flex: 1 }}>
          
          {/* TAB 1: SCORES BREAKDOWN */}
          {activeModalTab === "scores" && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Research Recommendation Summary</h3>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', color: '#166534', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                  {opportunity.recommendation_summary || "This catalog gap demonstrates highly profitable margins and strong social UGC conversion hooks potential."}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: "Demand Validation Score", val: opportunity.demand_score },
                    { label: "Supplier Capacity Score", val: opportunity.supplier_score },
                    { label: "Gross Margin Profile Score", val: opportunity.margin_score },
                    { label: "Competition Strength Score", val: opportunity.competition_score },
                    { label: "Store Brand Fit Score", val: opportunity.brand_fit_score },
                    { label: "UGC Video Content Score", val: opportunity.content_score }
                  ].map(sc => (
                    <div key={sc.label} style={{ border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#68777d' }}>{sc.label}</span>
                      <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{sc.val} / 100</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#111827', marginBottom: '8px' }}>Opportunity Score Evaluation</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#176c61', textAlign: 'center', margin: '20px 0' }}>
                      {opportunity.opportunity_score} <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>/ 100</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#4b5563', textAlign: 'center', lineHeight: '1.4' }}>
                      Formula evaluates Demand (25%), Margin (20%), Suppliers (15%), Competition (15%), Brand Fit (10%), and Content Potential (10%) with a Risk Penalty.
                    </p>
                    <button type="button" onClick={handleRescore} disabled={updatingResearch} style={{ width: '100%', marginTop: '10px', minHeight: '34px' }}>
                      Recalculate Score
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={18} style={{ color: '#ea580c', flex: '0 0 auto', marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#ea580c', display: 'block' }}>Compliance & Risk Flags</strong>
                      <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                        {opportunity.risk_notes || "Low risk. Verified standard dropship safety standards."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & MARGINS */}
          {activeModalTab === "pricing" && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Gross Margin Modeler</h3>
                
                <div className="import-stack">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label className="field">
                      <span>Supplier Cost ($)</span>
                      <input type="number" step="0.01" value={calcCost} onChange={(e) => setCalcCost(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Shipping Rate ($)</span>
                      <input type="number" step="0.01" value={calcShipping} onChange={(e) => setCalcShipping(e.target.value)} />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label className="field">
                      <span>Retail Price ($)</span>
                      <input type="number" step="0.01" value={calcRetail} onChange={(e) => setCalcRetail(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Compare-at Price ($)</span>
                      <input type="number" step="0.01" value={calcCompare} onChange={(e) => setCalcCompare(e.target.value)} />
                    </label>
                  </div>

                  <div style={{ background: '#f9fafb', border: '1px solid #dce3e7', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#68777d' }}>Total Landed Cost:</span>
                      <strong>${totalLanded.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#68777d' }}>Estimated Profit:</span>
                      <strong>${profitVal.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '6px', fontWeight: 'bold' }}>
                      <span style={{ color: '#111827' }}>Gross Markup Margin:</span>
                      <span style={{ color: marginPct >= 60 ? '#16a34a' : '#d97706' }}>
                        {marginPct}% {marginPct >= 60 ? "✓ High Profit" : "!"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Competitor Analysis Pages</h3>
                
                <div style={{ display: 'grid', gap: '10px' }}>
                  {competitors.length === 0 ? (
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px dashed #c3cbd0', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
                      No competitor listings synced yet. Scan signals above.
                    </div>
                  ) : competitors.map(comp => (
                    <div key={comp.id} style={{ border: '1px solid #e5e7eb', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{comp.competitor_name}</strong>
                        <strong style={{ color: '#176c61' }}>${comp.price}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>{comp.product_title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#4b5563', marginTop: '4px', italic: 'true' } as any}>
                        <strong>Competitor offer:</strong> {comp.offer_notes || "None listed"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI CONTENT PREVIEWS */}
          {activeModalTab === "copy" && (
            <div>
              {!aiContent && !generatingAi ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '12px' }}>
                    Generate optimized marketing copies, title options, benefit bullets lists, and short-form UGC video hooks.
                  </p>
                  <button className="primary" type="button" onClick={handleGenerateCopy}>
                    Generate AI Copywrite Kit
                  </button>
                </div>
              ) : generatingAi ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Drafting and formatting AI marketing assets...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#111827', margin: '0 0 6px' }}>Store Page Copy</h4>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', background: '#f9fafb', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Suggested Title:</strong> {aiContent.title}</div>
                      <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
                      <div><strong>Benefit Bullets:</strong></div>
                      <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
                        {aiContent.bullets?.map((b: string, i: number) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{b}</li>
                        ))}
                      </ul>
                      <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
                      <div><strong>Short Description:</strong> {aiContent.shortDescription}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#111827', margin: '0 0 6px' }}>UGC Viral Hooks Scenario</h4>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', background: '#f9fafb', fontSize: '0.84rem' }}>
                      <ol style={{ margin: '0', paddingLeft: '20px', display: 'grid', gap: '6px' }}>
                        {aiContent.hooks?.map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WHOLESALE SUPPLIERS */}
          {activeModalTab === "suppliers" && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>AliExpress Wholesale Options</h3>
              
              <div style={{ display: 'grid', gap: '14px' }}>
                {suppliers.length === 0 ? (
                  <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px dashed #c3cbd0', textAlign: 'center', fontSize: '0.88rem', color: '#6b7280' }}>
                    No AliExpress listings linked to this opportunity. Click "Search AliExpress" in the main workspace directory.
                  </div>
                ) : suppliers.map(sup => (
                  <div key={sup.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <div style={{ maxWidth: '70%' }}>
                      <strong style={{ fontSize: '0.94rem', color: '#111827', display: 'block' }}>{sup.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>
                        Supplier: {sup.supplier_name} | Rating: ⭐ {sup.rating} | Shipping Cost: ${sup.shipping_cost}
                      </div>
                    </div>
                    
                    <button 
                      className="primary"
                      type="button"
                      onClick={() => onImport(sup.id, opportunity.id)}
                      style={{ minHeight: '34px', fontSize: '0.82rem' }}
                    >
                      Import this Supplier Option
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ minHeight: '38px' }}>
            Close Review
          </button>
          {suppliers.length > 0 && opportunity.status !== "imported_draft" && (
            <button 
              className="primary" 
              type="button" 
              onClick={() => onImport(suppliers[0].id, opportunity.id)}
              style={{ minHeight: '38px' }}
            >
              One-Click Import (Draft product)
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

interface ExperimentationWorkspaceProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stores: Record<string, StorefrontNicheConfig>;
  setStores: React.Dispatch<React.SetStateAction<Record<string, StorefrontNicheConfig>>>;
  setNotice: (notice: string) => void;
}

function ExperimentationWorkspace({ products, setProducts, stores, setStores, setNotice }: ExperimentationWorkspaceProps) {
  const [experiments, setExperiments] = React.useState<Experiment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedExperiment, setSelectedExperiment] = React.useState<Experiment | null>(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Form states
  const [testName, setTestName] = React.useState("");
  const [testType, setTestType] = React.useState<"homepage_hero" | "product_pricing" | "checkout_threshold">("homepage_hero");
  const [targetId, setTargetId] = React.useState("");
  const [trafficAllocation, setTrafficAllocation] = React.useState(100);
  const [confidenceThreshold, setConfidenceThreshold] = React.useState(95);

  // Variant fields
  // homepage_hero
  const [controlHeroHeadline, setControlHeroHeadline] = React.useState("");
  const [controlHeroSubheadline, setControlHeroSubheadline] = React.useState("");
  const [controlHeroImage, setControlHeroImage] = React.useState("");
  const [controlCtaText, setControlCtaText] = React.useState("");
  
  const [variantHeroHeadline, setVariantHeroHeadline] = React.useState("");
  const [variantHeroSubheadline, setVariantHeroSubheadline] = React.useState("");
  const [variantHeroImage, setVariantHeroImage] = React.useState("");
  const [variantCtaText, setVariantCtaText] = React.useState("");

  // product_pricing
  const [controlPrice, setControlPrice] = React.useState("");
  const [controlName, setControlName] = React.useState("");
  const [variantPrice, setVariantPrice] = React.useState("");
  const [variantName, setVariantName] = React.useState("");

  // checkout_threshold
  const [controlThreshold, setControlThreshold] = React.useState("25");
  const [variantThreshold, setVariantThreshold] = React.useState("35");

  const [simulatingId, setSimulatingId] = React.useState<string | null>(null);
  const [promotingId, setPromotingId] = React.useState<string | null>(null);

  const loadAllExperiments = async () => {
    setLoading(true);
    try {
      const res = await getExperiments();
      setExperiments(res.experiments || []);
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to load experiments: ${e.message}` : "Failed to load experiments");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadAllExperiments();
  }, []);

  // Update target fields when testType or targetId changes
  React.useEffect(() => {
    if (testType === "homepage_hero") {
      const storeKeys = Object.keys(stores);
      const storeKey = targetId || storeKeys[0] || "general";
      if (!targetId && storeKeys.length > 0) {
        setTargetId(storeKey);
      }
      const store = stores[storeKey];
      if (store) {
        setControlHeroHeadline(store.heroHeadline || store.headline || "");
        setControlHeroSubheadline(store.heroSubheadline || store.eyebrow || "");
        setControlHeroImage(store.heroImage || "");
        setControlCtaText(store.ctaText || "Shop Now");
      }
    } else if (testType === "product_pricing") {
      const prodId = targetId || products[0]?.id || "";
      if (!targetId && products.length > 0) {
        setTargetId(prodId);
      }
      const prod = products.find(p => p.id === prodId);
      if (prod) {
        setControlPrice(String(prod.retailMin));
        setControlName(prod.name);
      }
    } else if (testType === "checkout_threshold") {
      setTargetId("global");
      const defaultThreshold = localStorage.getItem("p4tp_free_shipping_threshold") || "25";
      setControlThreshold(defaultThreshold);
    }
  }, [testType, targetId, stores, products]);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      setNotice("Test name is required.");
      return;
    }

    try {
      const expNiche = testType === "homepage_hero" ? targetId : (testType === "checkout_threshold" ? "global" : (products.find(p => p.id === targetId)?.subdomain || "global"));
      
      const controlChanges = testType === "homepage_hero" ? {
        heroHeadline: controlHeroHeadline,
        heroSubheadline: controlHeroSubheadline,
        heroImage: controlHeroImage,
        ctaText: controlCtaText,
      } : testType === "product_pricing" ? {
        price: Number(controlPrice),
        name: controlName,
      } : {
        threshold: Number(controlThreshold),
      };

      const variantChanges = testType === "homepage_hero" ? {
        heroHeadline: variantHeroHeadline,
        heroSubheadline: variantHeroSubheadline,
        heroImage: variantHeroImage,
        ctaText: variantCtaText,
      } : testType === "product_pricing" ? {
        price: Number(variantPrice),
        name: variantName,
      } : {
        threshold: Number(variantThreshold),
      };

      await createExperiment({
        name: testName,
        niche: expNiche,
        test_type: testType,
        target_id: targetId,
        traffic_allocation: trafficAllocation,
        confidence_threshold: confidenceThreshold,
        start_date: new Date().toISOString(),
        variants: [
          { name: "Control (A)", changes: controlChanges, is_control: true },
          { name: "Variant (B)", changes: variantChanges, is_control: false }
        ]
      });

      setNotice(`Experiment "${testName}" created successfully!`);
      setTestName("");
      setVariantHeroHeadline("");
      setVariantHeroSubheadline("");
      setVariantHeroImage("");
      setVariantCtaText("");
      setVariantPrice("");
      setVariantName("");
      setVariantThreshold("35");
      setShowCreateForm(false);
      void loadAllExperiments();
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to create experiment: ${e.message}` : "Failed to create experiment");
    }
  };

  const handleStartStop = async (id: string, currentStatus: Experiment["status"]) => {
    try {
      const nextStatus = currentStatus === "active" ? "completed" : "active";
      await updateExperimentStatus(id, nextStatus);
      setNotice(`Experiment status updated to ${nextStatus}.`);
      void loadAllExperiments();
      if (selectedExperiment?.id === id) {
        const details = await getExperimentDetails(id);
        setSelectedExperiment(details.experiment);
      }
    } catch (e) {
      setNotice(e instanceof Error ? `Failed to update experiment: ${e.message}` : "Failed to update experiment");
    }
  };

  const handleSimulate = async (id: string) => {
    setSimulatingId(id);
    try {
      const res = await simulateExperimentTraffic(id);
      setNotice("Traffic simulation completed with realistic distribution.");
      void loadAllExperiments();
      if (selectedExperiment?.id === id) {
        const details = await getExperimentDetails(id);
        setSelectedExperiment(details.experiment);
      }
    } catch (e) {
      setNotice(e instanceof Error ? `Simulation failed: ${e.message}` : "Simulation failed");
    } finally {
      setSimulatingId(null);
    }
  };

  const handlePromote = async (expId: string, variantId: string) => {
    setPromotingId(variantId);
    try {
      const res = await promoteExperimentVariant(expId, variantId);
      setNotice(`Variant promoted successfully! Applied changes live.`);
      
      const experiment = res.experiment;
      const variant = res.variant;

      if (experiment.test_type === "homepage_hero" && experiment.niche) {
        const storeKey = experiment.niche;
        const currentStore = stores[storeKey];
        if (currentStore) {
          const updatedStore = {
            ...currentStore,
            heroHeadline: variant.changes.heroHeadline || currentStore.heroHeadline,
            heroSubheadline: variant.changes.heroSubheadline || currentStore.heroSubheadline,
            heroImage: variant.changes.heroImage || currentStore.heroImage,
            ctaText: variant.changes.ctaText || currentStore.ctaText,
          };
          setStores(curr => ({ ...curr, [storeKey]: updatedStore }));
        }
      } else if (experiment.test_type === "product_pricing" && experiment.target_id) {
        const prodId = experiment.target_id;
        const newPrice = Number(variant.changes.price || variant.changes.retailMin);
        const newName = variant.changes.name;
        
        setProducts(curr => curr.map(p => {
          if (p.id === prodId) {
            return {
              ...p,
              retailMin: newPrice > 0 ? newPrice : p.retailMin,
              retailMax: newPrice > 0 ? newPrice : p.retailMax,
              name: newName || p.name
            };
          }
          return p;
        }));
      } else if (experiment.test_type === "checkout_threshold") {
        const newThreshold = Number(variant.changes.threshold || variant.changes.freeShippingThreshold);
        if (newThreshold > 0) {
          localStorage.setItem("p4tp_free_shipping_threshold", String(newThreshold));
        }
      }

      void loadAllExperiments();
      if (selectedExperiment?.id === expId) {
        const details = await getExperimentDetails(expId);
        setSelectedExperiment(details.experiment);
      }
    } catch (e) {
      setNotice(e instanceof Error ? `Promotion failed: ${e.message}` : "Promotion failed");
    } finally {
      setPromotingId(null);
    }
  };

  const activeTests = experiments.filter(e => e.status === "active");
  const completedTests = experiments.filter(e => e.status === "completed");

  const totalVisitors = experiments.reduce((sum, exp) => 
    sum + (exp.variants?.reduce((vSum, v) => vSum + (v.visitors || 0), 0) || 0), 0
  );

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Tab Header Banner */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow" style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>A/B Testing Framework</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '4px' }}>Conversion Experimentation Engine</h2>
        </div>
        <button 
          className="primary" 
          type="button" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px' }}
        >
          <Plus size={18} />
          {showCreateForm ? "Close Builder" : "Create New A/B Test"}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #e5eaee', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Experiments</span>
            <Activity size={18} />
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 900 }}>{activeTests.length}</strong>
          <small style={{ color: '#94a3b8' }}>{experiments.length} total experiments configured</small>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #e5eaee', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total Test Visitors</span>
            <Users size={18} />
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 900 }}>{totalVisitors.toLocaleString()}</strong>
          <small style={{ color: '#94a3b8' }}>Real-time user assignments</small>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #e5eaee', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Successful Promotions</span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <strong style={{ fontSize: '1.8rem', fontWeight: 900 }}>{completedTests.length}</strong>
          <small style={{ color: '#94a3b8' }}>Variants promoted to production</small>
        </div>
      </div>

      {/* Creation Form */}
      {showCreateForm && (
        <article className="panel" style={{ background: '#fff', border: '1px solid #e5eaee', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="panel-header" style={{ marginBottom: '20px' }}>
            <h2>New Experiment Configuration</h2>
            <p>Establish splits, control baselines, and test modifications.</p>
          </div>
          <form onSubmit={handleCreateExperiment} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Experiment Name</label>
                <input 
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. Red Sign-up Button Hero Test"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Test Template Category</label>
                <select
                  value={testType}
                  onChange={e => {
                    setTestType(e.target.value as any);
                    setTargetId("");
                  }}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  <option value="homepage_hero">Homepage Hero Layout</option>
                  <option value="product_pricing">Product Pricing and Title</option>
                  <option value="checkout_threshold">Free Shipping Checkout Threshold</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Target Selection</label>
                {testType === "homepage_hero" ? (
                  <select
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    {Object.entries(stores).map(([key, config]) => (
                      <option key={key} value={key}>{config.label} ({key}.products4thepeople.com)</option>
                    ))}
                  </select>
                ) : testType === "product_pricing" ? (
                  <select
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ${p.retailMin}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value="Global Storewide Threshold"
                    disabled
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  <span>Traffic Split Allocation</span>
                  <span style={{ color: '#6366f1' }}>{trafficAllocation}% active test / {100 - trafficAllocation}% raw control</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={trafficAllocation}
                    onChange={e => setTrafficAllocation(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#6366f1' }}
                  />
                  <span style={{ fontWeight: 'bold', width: '36px', textAlign: 'right' }}>{trafficAllocation}%</span>
                </div>
              </div>
            </div>

            {/* Template Specific Inputs */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'grid', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', color: '#1e293b' }}>
                Variant Configuration Details
              </h3>

              {testType === "homepage_hero" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Control A */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#475569' }}>Control Configuration (A)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Headline</label>
                      <input value={controlHeroHeadline} onChange={e => setControlHeroHeadline(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Subheadline</label>
                      <input value={controlHeroSubheadline} onChange={e => setControlHeroSubheadline(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Image (URL)</label>
                      <input value={controlHeroImage} onChange={e => setControlHeroImage(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>CTA Button Text</label>
                      <input value={controlCtaText} onChange={e => setControlCtaText(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  {/* Variant B */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#6366f1' }}>Variant Configuration (B)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Headline</label>
                      <input value={variantHeroHeadline} onChange={e => setVariantHeroHeadline(e.target.value)} placeholder="Enter test headline..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Subheadline</label>
                      <input value={variantHeroSubheadline} onChange={e => setVariantHeroSubheadline(e.target.value)} placeholder="Enter test subheadline..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Hero Image (URL)</label>
                      <input value={variantHeroImage} onChange={e => setVariantHeroImage(e.target.value)} placeholder="Enter image URL..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>CTA Button Text</label>
                      <input value={variantCtaText} onChange={e => setVariantCtaText(e.target.value)} placeholder="Shop Now" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>
              )}

              {testType === "product_pricing" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Control A */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#475569' }}>Control Configuration (A)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Product Name</label>
                      <input value={controlName} onChange={e => setControlName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Price ($)</label>
                      <input type="number" step="0.01" value={controlPrice} onChange={e => setControlPrice(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  {/* Variant B */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#6366f1' }}>Variant Configuration (B)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Product Name</label>
                      <input value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="Enter modified name..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Price ($)</label>
                      <input type="number" step="0.01" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} placeholder="e.g. 19.99" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                    </div>
                  </div>
                </div>
              )}

              {testType === "checkout_threshold" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Control A */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#475569' }}>Control Configuration (A)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Free Shipping Limit ($)</label>
                      <input type="number" value={controlThreshold} onChange={e => setControlThreshold(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  {/* Variant B */}
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#6366f1' }}>Variant Configuration (B)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Free Shipping Limit ($)</label>
                      <input type="number" value={variantThreshold} onChange={e => setVariantThreshold(e.target.value)} placeholder="e.g. 35" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="secondary" type="button" onClick={() => setShowCreateForm(false)} style={{ minHeight: '38px' }}>Cancel</button>
              <button className="primary" type="submit" style={{ minHeight: '38px' }}>Create and Save Draft</button>
            </div>
          </form>
        </article>
      )}

      {/* Experiments List Panel */}
      <article className="panel wide" style={{ background: '#fff', border: '1px solid #e5eaee', borderRadius: '16px', padding: '24px' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <p>Active and past tests</p>
            <h2>Experiment Inventory</h2>
          </div>
          <Layers size={22} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Category Type</th>
                <th>Target</th>
                <th>Traffic Size</th>
                <th>Confidence Reached</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No experiments created yet. Select "Create New A/B Test" above to define your first A/B testing campaign.
                  </td>
                </tr>
              ) : (
                experiments.map(exp => {
                  const totalExpVisitors = exp.variants?.reduce((sum, v) => sum + (v.visitors || 0), 0) || 0;
                  
                  // Compute stats
                  const ctrl = exp.variants?.find(v => v.is_control);
                  const vart = exp.variants?.find(v => !v.is_control);
                  let confidenceScoreStr = "N/A (No Traffic)";
                  let isWinner = false;
                  
                  if (ctrl && vart && ctrl.visitors > 5 && vart.visitors > 5) {
                    const stats = computeABStats(ctrl, vart);
                    confidenceScoreStr = `${stats.confidence.toFixed(1)}%`;
                    isWinner = stats.confidence >= exp.confidence_threshold;
                  }

                  const getStatusBadge = (status: Experiment["status"]) => {
                    if (status === "active") return <span className="status active">Active</span>;
                    if (status === "completed") return <span className="status draft" style={{ background: '#e2e8f0', color: '#475569' }}>Completed</span>;
                    return <span className="status review">Draft</span>;
                  };

                  const getCategoryLabel = (type: Experiment["test_type"]) => {
                    if (type === "homepage_hero") return "Hero Banner";
                    if (type === "product_pricing") return "Pricing / Title";
                    return "Free Shipping Threshold";
                  };

                  const getTargetLabel = (type: Experiment["test_type"], target: string | undefined) => {
                    if (type === "homepage_hero") return `${target} niche`;
                    if (type === "product_pricing") return products.find(p => p.id === target)?.name || `Product: ${target}`;
                    return "Storewide (Global)";
                  };

                  return (
                    <tr key={exp.id}>
                      <td>
                        <strong>{exp.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Created {new Date(exp.created_at).toLocaleDateString()}</div>
                      </td>
                      <td>{getCategoryLabel(exp.test_type)}</td>
                      <td>{getTargetLabel(exp.test_type, exp.target_id)}</td>
                      <td>{totalExpVisitors.toLocaleString()} views</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: isWinner ? '#10b981' : '#475569' }}>
                          {confidenceScoreStr}
                        </span>
                      </td>
                      <td>{getStatusBadge(exp.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="secondary" 
                            type="button" 
                            onClick={async () => {
                              const details = await getExperimentDetails(exp.id);
                              setSelectedExperiment(details.experiment);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }}
                          >
                            Analyze
                          </button>
                          
                          <button
                            className={exp.status === "active" ? "secondary danger-button" : "primary"}
                            type="button"
                            onClick={() => handleStartStop(exp.id, exp.status)}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }}
                          >
                            {exp.status === "active" ? "Stop" : "Launch"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Details / Drawer Modal */}
      {selectedExperiment && (() => {
        const ctrl = selectedExperiment.variants?.find(v => v.is_control) || {
          id: "ctrl", experiment_id: selectedExperiment.id, name: "Control", visitors: 0, add_to_cart_count: 0, checkout_count: 0, purchase_count: 0, revenue: 0, emails_captured: 0, is_control: true, changes: {}
        };
        const vart = selectedExperiment.variants?.find(v => !v.is_control) || {
          id: "vart", experiment_id: selectedExperiment.id, name: "Variant B", visitors: 0, add_to_cart_count: 0, checkout_count: 0, purchase_count: 0, revenue: 0, emails_captured: 0, is_control: false, changes: {}
        };

        const stats = computeABStats(ctrl, vart);
        
        const getRate = (count: number, total: number) => {
          if (total <= 0) return "0.0%";
          return `${((count / total) * 100).toFixed(2)}%`;
        };

        const getLift = (ctrlRate: number, vartRate: number) => {
          if (ctrlRate <= 0) return vartRate > 0 ? "+100%" : "0.0%";
          const lift = ((vartRate - ctrlRate) / ctrlRate) * 100;
          const sign = lift > 0 ? "+" : "";
          return `${sign}${lift.toFixed(1)}%`;
        };

        const getLiftColor = (ctrlRate: number, vartRate: number) => {
          if (vartRate > ctrlRate) return '#10b981'; // green
          if (vartRate < ctrlRate) return '#ef4444'; // red
          return '#475569';
        };

        const isSigWinner = stats.confidence >= selectedExperiment.confidence_threshold && stats.zScore > 0;
        const isSigLoser = stats.confidence >= selectedExperiment.confidence_threshold && stats.zScore < 0;

        return (
          <div className="modal-backdrop" role="presentation" style={{ zIndex: 1000 }}>
            <div 
              className="panel" 
              role="dialog" 
              aria-modal="true"
              style={{ width: '90%', maxWidth: '950px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
                <div>
                  <span className="eyebrow" style={{ color: '#6366f1', fontWeight: 'bold' }}>Experiment Detailed Analysis</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>{selectedExperiment.name}</h2>
                </div>
                <button type="button" onClick={() => setSelectedExperiment(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Status Indicator */}
              {selectedExperiment.status === "completed" && selectedExperiment.winner_variant_id && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  <span>
                    <strong>Experiment Completed:</strong> The winning variant has been promoted as the live default storefront settings.
                  </span>
                </div>
              )}

              {/* Grid of Results */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Detailed Stats Table */}
                  <div className="table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ margin: 0 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th>Metric</th>
                          <th>Control (A)</th>
                          <th>Variant (B)</th>
                          <th>Lift %</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Visitors (Views)</strong></td>
                          <td>{ctrl.visitors.toLocaleString()}</td>
                          <td>{vart.visitors.toLocaleString()}</td>
                          <td style={{ color: getLiftColor(ctrl.visitors, vart.visitors) }}>
                            {getLift(ctrl.visitors, vart.visitors)}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Add to Cart Rate</strong></td>
                          <td>{ctrl.add_to_cart_count} ({getRate(ctrl.add_to_cart_count, ctrl.visitors)})</td>
                          <td>{vart.add_to_cart_count} ({getRate(vart.add_to_cart_count, vart.visitors)})</td>
                          <td style={{ fontWeight: 'bold', color: getLiftColor(ctrl.add_to_cart_count / (ctrl.visitors || 1), vart.add_to_cart_count / (vart.visitors || 1)) }}>
                            {getLift(ctrl.add_to_cart_count / (ctrl.visitors || 1), vart.add_to_cart_count / (vart.visitors || 1))}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Checkout Initiated</strong></td>
                          <td>{ctrl.checkout_count} ({getRate(ctrl.checkout_count, ctrl.visitors)})</td>
                          <td>{vart.checkout_count} ({getRate(vart.checkout_count, vart.visitors)})</td>
                          <td style={{ color: getLiftColor(ctrl.checkout_count / (ctrl.visitors || 1), vart.checkout_count / (vart.visitors || 1)) }}>
                            {getLift(ctrl.checkout_count / (ctrl.visitors || 1), vart.checkout_count / (vart.visitors || 1))}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Purchases (Conversion)</strong></td>
                          <td>{ctrl.purchase_count} ({getRate(ctrl.purchase_count, ctrl.visitors)})</td>
                          <td>{vart.purchase_count} ({getRate(vart.purchase_count, vart.visitors)})</td>
                          <td style={{ fontWeight: 'bold', color: getLiftColor(ctrl.purchase_count / (ctrl.visitors || 1), vart.purchase_count / (vart.visitors || 1)) }}>
                            {getLift(ctrl.purchase_count / (ctrl.visitors || 1), vart.purchase_count / (vart.visitors || 1))}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Revenue Captured</strong></td>
                          <td>${Number(ctrl.revenue).toFixed(2)}</td>
                          <td>${Number(vart.revenue).toFixed(2)}</td>
                          <td style={{ fontWeight: 'bold', color: getLiftColor(ctrl.revenue, vart.revenue) }}>
                            {getLift(ctrl.revenue, vart.revenue)}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Average Order Value (AOV)</strong></td>
                          <td>
                            ${ctrl.purchase_count > 0 ? (ctrl.revenue / ctrl.purchase_count).toFixed(2) : "0.00"}
                          </td>
                          <td>
                            ${vart.purchase_count > 0 ? (vart.revenue / vart.purchase_count).toFixed(2) : "0.00"}
                          </td>
                          <td style={{ color: getLiftColor(ctrl.purchase_count > 0 ? ctrl.revenue / ctrl.purchase_count : 0, vart.purchase_count > 0 ? vart.revenue / vart.purchase_count : 0) }}>
                            {getLift(ctrl.purchase_count > 0 ? ctrl.revenue / ctrl.purchase_count : 0, vart.purchase_count > 0 ? vart.revenue / vart.purchase_count : 0)}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Revenue Per Visitor</strong></td>
                          <td>
                            ${ctrl.visitors > 0 ? (ctrl.revenue / ctrl.visitors).toFixed(2) : "0.00"}
                          </td>
                          <td>
                            ${vart.visitors > 0 ? (vart.revenue / vart.visitors).toFixed(2) : "0.00"}
                          </td>
                          <td style={{ fontWeight: 'bold', color: getLiftColor(ctrl.visitors > 0 ? ctrl.revenue / ctrl.visitors : 0, vart.visitors > 0 ? vart.revenue / vart.visitors : 0) }}>
                            {getLift(ctrl.visitors > 0 ? ctrl.revenue / ctrl.visitors : 0, vart.visitors > 0 ? vart.revenue / vart.visitors : 0)}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Email Captures</strong></td>
                          <td>{ctrl.emails_captured} ({getRate(ctrl.emails_captured, ctrl.visitors)})</td>
                          <td>{vart.emails_captured} ({getRate(vart.emails_captured, vart.visitors)})</td>
                          <td style={{ color: getLiftColor(ctrl.emails_captured / (ctrl.visitors || 1), vart.emails_captured / (vart.visitors || 1)) }}>
                            {getLift(ctrl.emails_captured / (ctrl.visitors || 1), vart.emails_captured / (vart.visitors || 1))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Variant configuration changes details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', background: '#f8fafc' }}>
                      <strong>Control Config Changes:</strong>
                      <pre style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap', color: '#475569', fontSize: '0.75rem' }}>
                        {JSON.stringify(ctrl.changes, null, 2)}
                      </pre>
                    </div>
                    <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', background: '#f8fafc' }}>
                      <strong>Variant Config Changes:</strong>
                      <pre style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap', color: '#6366f1', fontSize: '0.75rem' }}>
                        {JSON.stringify(vart.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Z-Test Confidence Panel */}
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <TrendingUp size={16} />
                      Statistical Evaluation
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Z-Test Score:</span>
                      <strong style={{ fontSize: '1.25rem' }}>{stats.zScore.toFixed(4)}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>p-Value (Probability):</span>
                      <strong style={{ fontSize: '1.25rem' }}>{stats.pValue.toFixed(6)}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Confidence Reached:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${stats.confidence}%`, 
                              background: stats.confidence >= selectedExperiment.confidence_threshold ? '#10b981' : '#f59e0b',
                              borderRadius: '4px' 
                            }} 
                          />
                        </div>
                        <strong style={{ fontSize: '0.95rem' }}>{stats.confidence.toFixed(1)}%</strong>
                      </div>
                      <small style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Required: {selectedExperiment.confidence_threshold}%</small>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>Result Status & Recommendation:</span>
                      {isSigWinner ? (
                        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }}>
                          🏆 <strong>Winner Detected!</strong> Variant B outperforms Control with statistical significance. Promote Variant B to live production.
                        </div>
                      ) : isSigLoser ? (
                        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }}>
                          ⚠️ <strong>Control Winner.</strong> Control outperforms Variant B with statistical significance. Recommendation: Keep Control and archive Variant B.
                        </div>
                      ) : (
                        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', color: '#92400e', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }}>
                          ⏳ <strong>Inconclusive.</strong> Traffic volume or conversion differences do not meet the {selectedExperiment.confidence_threshold}% significance threshold. Let the test run longer.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'grid', gap: '10px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', margin: 0 }}>
                      Control Options
                    </h3>
                    
                    <button 
                      className="primary full" 
                      type="button" 
                      onClick={() => handleSimulate(selectedExperiment.id)}
                      disabled={simulatingId === selectedExperiment.id || selectedExperiment.status === "completed"}
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    >
                      {simulatingId === selectedExperiment.id ? "Simulating..." : "Run Traffic Simulation"}
                    </button>

                    <button 
                      className="primary full" 
                      type="button" 
                      onClick={() => handlePromote(selectedExperiment.id, vart.id)}
                      disabled={promotingId === vart.id || selectedExperiment.status === "completed" || vart.visitors < 2}
                      style={{ minHeight: '38px', background: isSigWinner ? '#10b981' : '#6366f1', borderColor: isSigWinner ? '#10b981' : '#6366f1', fontSize: '0.85rem' }}
                    >
                      {promotingId === vart.id ? "Promoting..." : "One-Click Promote Variant B"}
                    </button>

                    {selectedExperiment.status === "active" && (
                      <button 
                        className="secondary danger-button full" 
                        type="button" 
                        onClick={() => handleStartStop(selectedExperiment.id, selectedExperiment.status)}
                        style={{ minHeight: '38px', fontSize: '0.85rem' }}
                      >
                        Stop Experiment (Archive)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button className="secondary" type="button" onClick={() => setSelectedExperiment(null)} style={{ minHeight: '38px' }}>
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function computeABStats(control: ExperimentVariant, variant: ExperimentVariant) {
  const nA = control.visitors;
  const nB = variant.visitors;
  const cA = control.purchase_count;
  const cB = variant.purchase_count;
  
  if (nA <= 0 || nB <= 0) {
    return { zScore: 0, pValue: 1, confidence: 0, isSignificant: false };
  }
  
  const pA = cA / nA;
  const pB = cB / nB;
  
  const pPooled = (cA + cB) / (nA + nB);
  if (pPooled <= 0 || pPooled >= 1) {
    return { zScore: 0, pValue: 1, confidence: 0, isSignificant: false };
  }
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / nA + 1 / nB));
  if (se === 0) {
    return { zScore: 0, pValue: 1, confidence: 0, isSignificant: false };
  }
  
  const zScore = (pB - pA) / se;
  const absZ = Math.abs(zScore);
  
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.39894228;
  const p = d * Math.exp(-0.5 * absZ * absZ) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pValue = p * 2;
  const confidence = Math.max(0, Math.min(100, (1 - pValue) * 100));
  
  return {
    zScore,
    pValue,
    confidence,
    isSignificant: confidence >= 95
  };
}

function ResearchMetric({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      {trend && <small>{trend}</small>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
