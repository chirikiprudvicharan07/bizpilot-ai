import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Boxes,
  Brain,
  BriefcaseBusiness,
  ChartSpline,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Headphones,
  LayoutDashboard,
  Lock,
  Menu,
  Mic,
  PackageCheck,
  PanelLeftClose,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  LogOut,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import type { Mesh } from "three";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth, type BusinessProfile } from "./auth/AuthContext";
import { db } from "./firebase/config";
import { AuthPage, LandingPage } from "./pages/AuthPages";
import { BusinessSetupPage } from "./pages/BusinessSetup";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import "./styles.css";

type ModuleKey =
  | "Dashboard"
  | "AI Assistant"
  | "Customers"
  | "Orders"
  | "Inventory"
  | "Invoices"
  | "Reports"
  | "Analytics"
  | "Knowledge Base"
  | "Automation"
  | "Employees"
  | "Settings";

type Customer = { id: string; name: string; email: string; orders: number; loyalty: number; note: string };
type Order = { id: string; customer: string; amount: number; status: "Pending" | "In delivery" | "Completed" | "Cancelled" };
type InventoryItem = { id: string; item: string; stock: number; supplier: string; threshold: number };
type Invoice = { id: string; customer: string; amount: number; status: "Draft" | "Sent" | "Paid"; date: string };
type Report = { id: string; title: string; summary: string; date: string };
type Employee = { id: string; name: string; role: string; access: string };
type KnowledgeDoc = { id: string; title: string; category: string; answer: string };
type AutomationRule = { id: string; name: string; status: "Active" | "Paused"; trigger: string };
type ActivityLog = { id: string; text: string; time: string };
type ChatMessage = { role: "owner" | "ai"; text: string };

type BusinessData = {
  customers: Customer[];
  orders: Order[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  reports: Report[];
  employees: Employee[];
  knowledge: KnowledgeDoc[];
  automation: AutomationRule[];
  activities: ActivityLog[];
};

const modules: { name: ModuleKey; icon: LucideIcon }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "AI Assistant", icon: Bot },
  { name: "Customers", icon: Users },
  { name: "Orders", icon: ClipboardList },
  { name: "Inventory", icon: Boxes },
  { name: "Invoices", icon: ReceiptText },
  { name: "Reports", icon: FileSpreadsheet },
  { name: "Analytics", icon: ChartSpline },
  { name: "Knowledge Base", icon: FileText },
  { name: "Automation", icon: WandSparkles },
  { name: "Employees", icon: BriefcaseBusiness },
  { name: "Settings", icon: Settings },
];

const workflowSteps = [
  "Customer places order",
  "AI checks inventory",
  "Availability confirmed",
  "Order created",
  "Invoice generated",
  "Stock updated",
  "Delivery scheduled",
  "Customer confirmation sent",
  "Owner notified",
];

const themeCapabilities = [
  { title: "AI Employee Copilot", detail: "Automates admin tasks, summaries, orders, and follow-ups." },
  { title: "AI Customer Support Agent", detail: "Answers customer questions from business context and policies." },
  { title: "AI Knowledge Assistant", detail: "Searches policies, supplier terms, reports, and documents." },
  { title: "AI Document Generation", detail: "Creates invoices, reports, purchase orders, and exports." },
  { title: "Autonomous Workflow Agents", detail: "Runs order-to-invoice and low-stock workflows end to end." },
  { title: "AI Personalization Engine", detail: "Recommends offers based on loyalty, orders, and behavior." },
];

const initialData: BusinessData = {
  customers: [
    { id: "CUS-1001", name: "Northstar Cafe", email: "ops@northstar.example", orders: 44, loyalty: 92, note: "Offer recurring wholesale plan" },
    { id: "CUS-1002", name: "Urban Deli", email: "hello@urbandeli.example", orders: 29, loyalty: 84, note: "High invoice velocity" },
    { id: "CUS-1003", name: "Bloom Bakery", email: "team@bloombakery.example", orders: 18, loyalty: 76, note: "Recommend festive bundles" },
  ],
  orders: [
    { id: "ORD-2418", customer: "Northstar Cafe", amount: 106240, status: "In delivery" },
    { id: "ORD-2417", customer: "Urban Deli", amount: 61420, status: "Pending" },
    { id: "ORD-2416", customer: "Bloom Bakery", amount: 77190, status: "Completed" },
  ],
  inventory: [
    { id: "INV-1001", item: "Arabica Coffee Beans", stock: 18, supplier: "BeanWorks", threshold: 25 },
    { id: "INV-1002", item: "Compostable Cups", stock: 320, supplier: "GreenPack", threshold: 120 },
    { id: "INV-1003", item: "Chocolate Syrup", stock: 11, supplier: "SweetLine", threshold: 20 },
    { id: "INV-1004", item: "Thermal Receipt Rolls", stock: 8, supplier: "PrintPro", threshold: 18 },
  ],
  invoices: [
    { id: "BPI-4281", customer: "Northstar Cafe", amount: 106240, status: "Paid", date: "2026-07-03" },
    { id: "BPI-4280", customer: "Urban Deli", amount: 61420, status: "Sent", date: "2026-07-02" },
  ],
  reports: [
    {
      id: "REP-9001",
      title: "Daily Business Report",
      summary: "Revenue is rising, stock risk exists on 3 products, and repeat customers are driving profit.",
      date: "2026-07-03",
    },
  ],
  employees: [
    { id: "EMP-01", name: "Priya Sharma", role: "Owner", access: "Full access" },
    { id: "EMP-02", name: "Arjun Mehta", role: "Manager", access: "Operations" },
    { id: "EMP-03", name: "Nisha Rao", role: "Employee", access: "Orders and support" },
  ],
  knowledge: [
    { id: "DOC-01", title: "Refund Policy", category: "Customer Support", answer: "Refunds are accepted within 7 days for unopened goods." },
    { id: "DOC-02", title: "Supplier Terms", category: "Operations", answer: "Critical suppliers require restock orders 48 hours before stockout." },
  ],
  automation: [
    { id: "AUTO-01", name: "Order to invoice", status: "Active", trigger: "New customer order" },
    { id: "AUTO-02", name: "Daily business summary", status: "Active", trigger: "Every day at 8 PM" },
    { id: "AUTO-03", name: "Low-stock escalation", status: "Active", trigger: "Stock below threshold" },
  ],
  activities: [
    { id: "ACT-01", text: "Generated invoice BPI-4281 for Northstar Cafe", time: "09:10" },
    { id: "ACT-02", text: "Detected low stock risk for Arabica Coffee Beans", time: "10:20" },
    { id: "ACT-03", text: "Resolved 42 support messages with 97% confidence", time: "11:05" },
    { id: "ACT-04", text: "Scheduled delivery route for 18 orders", time: "12:30" },
  ],
};

const storageKey = "bizpilot-ai-business-data-v2";
const aiProvider = ((import.meta.env.VITE_AI_PROVIDER as string | undefined) || "grok").toLowerCase();
const groqEnabled = import.meta.env.VITE_GROQ_ENABLED === "true";
const groqModel = (import.meta.env.VITE_GROQ_MODEL as string | undefined) || "llama-3.3-70b-versatile";
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || "gemini-1.5-flash";
const xaiApiKey = import.meta.env.VITE_XAI_API_KEY as string | undefined;
const xaiModel = (import.meta.env.VITE_XAI_MODEL as string | undefined) || "grok-4.3";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function statusForItem(item: InventoryItem) {
  if (item.stock <= Math.ceil(item.threshold / 2)) return "Critical";
  if (item.stock < item.threshold) return "Low stock";
  return "Healthy";
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function askGemini(prompt: string, data: BusinessData, profile: BusinessProfile | null) {
  if (!geminiApiKey || geminiApiKey.includes("replace-with")) return null;

  const businessContext = {
    customers: data.customers,
    orders: data.orders,
    inventory: data.inventory.map((item) => ({ ...item, status: statusForItem(item) })),
    invoices: data.invoices,
    reports: data.reports,
    knowledge: data.knowledge,
    automation: data.automation,
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: businessPrompt(prompt, data, profile),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 420,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}`);
  }

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("\n").trim() || null;
}

function businessPrompt(prompt: string, data: BusinessData, profile: BusinessProfile | null) {
  const businessContext = {
    businessId: profile?.businessId,
    businessName: profile?.businessName,
    businessType: profile?.businessType,
    customers: data.customers,
    orders: data.orders,
    inventory: data.inventory.map((item) => ({ ...item, status: statusForItem(item) })),
    invoices: data.invoices,
    reports: data.reports,
    knowledge: data.knowledge,
    automation: data.automation,
  };

  return `You are BizPilot AI, an autonomous AI employee for an Indian small business. Use INR currency, be concise, and give practical next actions. Business data: ${JSON.stringify(
    businessContext,
  )}\n\nOwner request: ${prompt}`;
}

async function askGrok(prompt: string, data: BusinessData, profile: BusinessProfile | null) {
  if (!xaiApiKey || xaiApiKey.includes("replace-with")) return null;

  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${xaiApiKey}`,
    },
    body: JSON.stringify({
      model: xaiModel,
      input: [
        {
          role: "system",
          content: "You are BizPilot AI, a concise autonomous business agent for Indian small businesses.",
        },
        {
          role: "user",
          content: businessPrompt(prompt, data, profile),
        },
      ],
      store: false,
      temperature: 0.35,
      max_output_tokens: 420,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error ${response.status}`);
  }

  const result = await response.json();
  const outputText = result?.output_text;
  const outputParts = result?.output?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? []);
  return outputText?.trim() || outputParts?.map((part: { text?: string }) => part.text ?? "").join("\n").trim() || null;
}

async function askGroq(prompt: string, data: BusinessData, profile: BusinessProfile | null) {
  if (!groqEnabled) return null;

  const response = await fetch("/api/groq/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        {
          role: "system",
          content: "You are BizPilot AI, a concise autonomous business agent for Indian small businesses.",
        },
        {
          role: "user",
          content: businessPrompt(prompt, data, profile),
        },
      ],
      temperature: 0.35,
      max_completion_tokens: 420,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error ${response.status}`);
  }

  const result = await response.json();
  return result?.choices?.[0]?.message?.content?.trim() || null;
}

function liveProviderLabel() {
  if (aiProvider === "groq") return groqEnabled ? `Groq live: ${groqModel}` : "Groq not connected";
  if (aiProvider === "grok") return xaiApiKey && !xaiApiKey.includes("replace-with") ? `Grok live: ${xaiModel}` : "Grok not connected";
  if (aiProvider === "gemini") return geminiApiKey && !geminiApiKey.includes("replace-with") ? `Gemini live: ${geminiModel}` : "Gemini not connected";
  return "Local assistant";
}

function hasLiveProvider() {
  if (aiProvider === "groq") return groqEnabled;
  if (aiProvider === "grok") return Boolean(xaiApiKey && !xaiApiKey.includes("replace-with"));
  if (aiProvider === "gemini") return Boolean(geminiApiKey && !geminiApiKey.includes("replace-with"));
  return false;
}

async function askLiveProvider(prompt: string, data: BusinessData, profile: BusinessProfile | null) {
  if (aiProvider === "groq") return askGroq(prompt, data, profile);
  if (aiProvider === "grok") return askGrok(prompt, data, profile);
  if (aiProvider === "gemini") return askGemini(prompt, data, profile);
  return null;
}

const tenantCollections = [
  "customers",
  "orders",
  "inventory",
  "invoices",
  "reports",
  "employees",
  "knowledge",
  "automation",
  "activities",
] as const;

type TenantCollection = (typeof tenantCollections)[number];
const businessDataTimeoutMs = 10000;

function timeoutAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });
}

function useBusinessData(businessId?: string) {
  const initialTenantData = (() => {
    try {
      const saved = localStorage.getItem(businessId ? `${storageKey}-${businessId}` : storageKey);
      return saved ? ({ ...initialData, ...JSON.parse(saved) } as BusinessData) : initialData;
    } catch {
      return initialData;
    }
  })();
  const hasLocalCache = (() => {
    try {
      return Boolean(localStorage.getItem(businessId ? `${storageKey}-${businessId}` : storageKey));
    } catch {
      return false;
    }
  })();
  const [data, setData] = useState<BusinessData>(initialTenantData);
  const [dataLoading, setDataLoading] = useState(Boolean(businessId) && !hasLocalCache);
  const [dataError, setDataError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!businessId) {
      setDataLoading(false);
      setDataError("Business ID is missing. Please complete Business Setup again.");
      return;
    }
    if (!db) {
      setDataLoading(false);
      setDataError("");
      return;
    }
    const database = db;
    const targetBusinessId = businessId;
    let active = true;

    async function loadTenantData() {
      setDataLoading(true);
      setDataError("");
      try {
        const { loaded, hasRemoteData } = await Promise.race([
          (async () => {
            const nextData = { ...initialData };
            let foundRemoteData = false;
            const snapshots = await Promise.all(
              tenantCollections.map(async (name) => ({
                name,
                snapshot: await getDocs(collection(database, "businesses", targetBusinessId, name)),
              })),
            );
            snapshots.forEach(({ name, snapshot }) => {
              const records = snapshot.docs.map((item) => item.data());
              if (records.length) {
                foundRemoteData = true;
                (nextData[name] as Array<Record<string, unknown>>) = records;
              }
            });
            return { loaded: nextData, hasRemoteData: foundRemoteData };
          })(),
          timeoutAfter(
            businessDataTimeoutMs,
            "Unable to load business data. Please check your internet connection or Firebase configuration.",
          ),
        ]);
        if (!active) return;
        setData(loaded);
        localStorage.setItem(`${storageKey}-${targetBusinessId}`, JSON.stringify(loaded));
        if (!hasRemoteData) {
          void persistBusinessData(targetBusinessId, initialData, initialData).catch((error) =>
            console.error("[Firestore] Unable to seed tenant data", error),
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load business data. Please check your internet connection or Firebase configuration.";
        console.error("[Firestore] Unable to load tenant data", {
          message,
          businessId: targetBusinessId,
          collections: tenantCollections,
          error,
        });
        if (!active) return;
        try {
          const cached = localStorage.getItem(`${storageKey}-${targetBusinessId}`);
          if (cached) setData({ ...initialData, ...JSON.parse(cached) });
        } catch (cacheError) {
          console.error("[Firestore] Unable to read cached tenant data", cacheError);
        }
        setDataError(message);
      } finally {
        if (active) setDataLoading(false);
      }
    }

    void loadTenantData();
    return () => {
      active = false;
    };
  }, [businessId, loadAttempt]);

  async function persistBusinessData(targetBusinessId: string, next: BusinessData, previous: BusinessData) {
    if (!db) return;
    const database = db;
    const batch = writeBatch(database);
    tenantCollections.forEach((name) => {
      const nextItems = next[name] as Array<{ id: string }>;
      const previousItems = previous[name] as Array<{ id: string }>;
      nextItems.forEach((item) => {
        batch.set(doc(database, "businesses", targetBusinessId, name, item.id), item, { merge: true });
      });
      previousItems
        .filter((oldItem) => !nextItems.some((item) => item.id === oldItem.id))
        .forEach((oldItem) => {
          batch.delete(doc(database, "businesses", targetBusinessId, name, oldItem.id));
        });
    });
    await batch.commit();
  }

  const setTenantData: React.Dispatch<React.SetStateAction<BusinessData>> = (updater) => {
    setData((current) => {
      const next = typeof updater === "function" ? (updater as (value: BusinessData) => BusinessData)(current) : updater;
      if (businessId) {
        localStorage.setItem(`${storageKey}-${businessId}`, JSON.stringify(next));
        void persistBusinessData(businessId, next, current).catch((error) => console.error("Unable to save tenant data", error));
      }
      return next;
    });
  };

  function log(text: string) {
    setTenantData((current) => ({
      ...current,
      activities: [{ id: makeId("ACT"), text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...current.activities].slice(0, 12),
    }));
  }

  function retryLoad() {
    setLoadAttempt((attempt) => attempt + 1);
  }

  return { data, setData: setTenantData, log, dataLoading, dataError, retryLoad };
}

function AiOrb() {
  const mesh = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || !ring.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.35;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.18;
    ring.current.rotation.z = state.clock.elapsedTime * 0.45;
  });

  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.4, 4]} />
        <meshStandardMaterial color="#54e6c7" emissive="#163f37" roughness={0.22} metalness={0.72} wireframe />
      </mesh>
      <mesh ref={ring} rotation={[1.25, 0.4, 0]}>
        <torusGeometry args={[1.95, 0.012, 12, 160]} />
        <meshBasicMaterial color="#7aa2ff" />
      </mesh>
      <pointLight position={[3, 2, 4]} intensity={90} color="#a8ffef" />
      <pointLight position={[-3, -2, -2]} intensity={50} color="#ffca6e" />
    </group>
  );
}

function OrbScene() {
  return (
    <div className="orb-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5], fov: 42 }}>
        <ambientLight intensity={0.8} />
        <Suspense fallback={null}>
          <AiOrb />
        </Suspense>
      </Canvas>
    </div>
  );
}

function MetricCard({ label, value, delta, icon: Icon }: { label: string; value: string; delta: string; icon: LucideIcon }) {
  return (
    <motion.article className="metric-card" whileHover={{ y: -4 }}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </motion.article>
  );
}

function MiniChart({ revenue }: { revenue: number }) {
  const bars = [0.42, 0.54, 0.48, 0.64, 0.59, 0.78, 0.72, 0.91, 0.82, 1, 0.88, 0.96].map((value) =>
    Math.max(28, Math.round((revenue / 16000) * value)),
  );
  return (
    <div className="chart" aria-label="Revenue trend chart">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          initial={{ height: 8 }}
          animate={{ height }}
          transition={{ duration: 0.55, delay: index * 0.04 }}
        />
      ))}
    </div>
  );
}

function WorkflowRunner({
  data,
  setData,
  onNotify,
  log,
}: {
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  onNotify: (message: string) => void;
  log: (message: string) => void;
}) {
  const [activeStep, setActiveStep] = useState(0);

  function runWorkflow() {
    const customer = data.customers[0]?.name ?? "Walk-in Customer";
    const orderId = makeId("ORD");
    const invoiceId = makeId("BPI");
    setActiveStep(workflowSteps.length - 1);
    setData((current) => ({
      ...current,
      orders: [{ id: orderId, customer, amount: 81340, status: "In delivery" }, ...current.orders],
      invoices: [{ id: invoiceId, customer, amount: 81340, status: "Sent", date: today() }, ...current.invoices],
      inventory: current.inventory.map((item, index) => (index === 0 ? { ...item, stock: Math.max(0, item.stock - 4) } : item)),
    }));
    log(`Autonomous workflow created ${orderId}, ${invoiceId}, updated stock, and notified owner`);
    onNotify("Full order-to-invoice workflow completed.");
  }

  return (
    <section className="panel workflow-panel">
      <div className="section-heading">
        <div>
          <p>Autonomous workflow</p>
          <h2>Order-to-invoice agent</h2>
        </div>
        <button className="icon-button" type="button" onClick={runWorkflow} aria-label="Run workflow">
          <Zap size={18} />
        </button>
      </div>
      <div className="workflow-list">
        {workflowSteps.map((step, index) => {
          const done = index <= activeStep;
          return (
            <motion.div className={`workflow-step ${done ? "done" : ""}`} key={step} layout>
              <span>{done ? <Check size={15} /> : index + 1}</span>
              <p>{step}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function AssistantPanel({
  data,
  setData,
  businessProfile,
  onNotify,
  log,
}: {
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  businessProfile: BusinessProfile | null;
  onNotify: (message: string) => void;
  log: (message: string) => void;
}) {
  type AssistantTask = { id: string; title: string; status: "Queued" | "Running" | "Done"; result: string };

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "owner", text: "Generate today's business report and highlight risk." },
    {
      role: "ai",
      text: "Report prepared. Revenue is up, profit remains healthy, and low-stock items need attention.",
    },
  ]);
  const [input, setInput] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [tasks, setTasks] = useState<AssistantTask[]>([
    {
      id: "TASK-01",
      title: "Daily business summary",
      status: "Done",
      result: "Revenue, stock, invoice, and support insights are ready.",
    },
  ]);
  const [generatedOutput, setGeneratedOutput] = useState("No generated output yet.");

  const lowStock = data.inventory.filter((item) => item.stock < item.threshold);
  const revenue = data.orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.amount, 0);
  const pendingOrders = data.orders.filter((order) => order.status === "Pending");
  const openInvoices = data.invoices.filter((invoice) => invoice.status !== "Paid");
  const topCustomer = [...data.customers].sort((a, b) => b.loyalty - a.loyalty)[0];

  const suggestedPrompts = [
    "Generate today's business report",
    "Reply to a customer asking about refund policy",
    "Predict sales for the next 30 days",
    "Create invoice for pending order",
    "Find low stock and restock automatically",
    "Recommend a personalized offer",
  ];

  function queueTask(title: string, result: string) {
    const task = { id: makeId("TASK"), title, status: "Done" as const, result };
    setTasks((items) => [task, ...items].slice(0, 6));
    setGeneratedOutput(result);
    return task;
  }

  function addAiTask(action: string) {
    let response = "I analyzed the request, checked business data, and queued the next action.";
    if (action === "Invoice") {
      const order = data.orders.find((item) => item.status !== "Cancelled") ?? data.orders[0];
      if (order) {
        const id = makeId("BPI");
        setData((current) => ({
          ...current,
          invoices: [{ id, customer: order.customer, amount: order.amount, status: "Draft", date: today() }, ...current.invoices],
        }));
        response = `Created draft invoice ${id} for ${order.customer} worth ${currency(order.amount)}.`;
        log(`AI generated draft invoice ${id}`);
      }
    }
    if (action === "Report") {
      const id = makeId("REP");
      setData((current) => ({
        ...current,
        reports: [
          {
            id,
            title: "AI Daily Business Report",
            summary: `Revenue: ${currency(current.orders.reduce((sum, order) => sum + order.amount, 0))}. Low stock items: ${lowStock.length}.`,
            date: today(),
          },
          ...current.reports,
        ],
      }));
      response = `Generated report ${id} with revenue, order, inventory, and customer insights.`;
      log(`AI generated report ${id}`);
    }
    if (action === "Predict sales") {
      response = `Forecast complete. Expected 30-day revenue is ${currency(Math.round(revenue * 1.22))}. Best opportunity: follow up with ${topCustomer?.name ?? "top repeat customers"}.`;
    }
    if (action === "Restock") {
      setData((current) => ({
        ...current,
        inventory: current.inventory.map((item) => (item.stock < item.threshold ? { ...item, stock: item.threshold + 40 } : item)),
      }));
      response = `Restock orders prepared for ${lowStock.map((item) => item.item).join(", ") || "all monitored inventory"}.`;
      log("AI completed restock planning");
    }
    if (action === "Support reply") {
      const policy = data.knowledge.find((item) => item.title.toLowerCase().includes("refund"));
      response = `Customer reply drafted: "Thanks for reaching out. ${policy?.answer ?? "We checked your request and will help you quickly."} We can also connect you with the store manager if needed."`;
      log("AI drafted customer support reply");
    }
    if (action === "Knowledge search") {
      response = `Knowledge answer: ${data.knowledge.map((item) => `${item.title}: ${item.answer}`).join(" ")}`;
      log("AI searched knowledge base");
    }
    if (action === "Personalize") {
      response = `${topCustomer?.name ?? "Your best customer"} should receive a loyalty offer: 8% off repeat bulk orders plus priority delivery.`;
      log("AI generated personalized offer");
    }
    if (action === "Workflow") {
      const customer = topCustomer?.name ?? "Priority Customer";
      const orderId = makeId("ORD");
      const invoiceId = makeId("BPI");
      setData((current) => ({
        ...current,
        orders: [{ id: orderId, customer, amount: 89900, status: "In delivery" }, ...current.orders],
        invoices: [{ id: invoiceId, customer, amount: 89900, status: "Sent", date: today() }, ...current.invoices],
        inventory: current.inventory.map((item, index) => (index === 0 ? { ...item, stock: Math.max(0, item.stock - 5) } : item)),
      }));
      response = `Autonomous workflow completed: created ${orderId}, generated ${invoiceId}, updated inventory, scheduled delivery, and notified the owner.`;
      log(`AI executed workflow ${orderId}`);
    }
    const task = queueTask(action, response);
    setMessages((items) => [...items, { role: "owner", text: action }, { role: "ai", text: response }]);
    onNotify(`${task.id} completed: ${action}.`);
  }

  async function answerPrompt(prompt: string) {
    const normalized = prompt.toLowerCase();
    if (normalized.includes("invoice")) return addAiTask("Invoice");
    if (normalized.includes("report") || normalized.includes("summary")) return addAiTask("Report");
    if (normalized.includes("predict") || normalized.includes("forecast") || normalized.includes("sales")) return addAiTask("Predict sales");
    if (normalized.includes("stock") || normalized.includes("restock") || normalized.includes("inventory")) return addAiTask("Restock");
    if (normalized.includes("refund") || normalized.includes("support") || normalized.includes("customer")) return addAiTask("Support reply");
    if (normalized.includes("knowledge") || normalized.includes("policy") || normalized.includes("document")) return addAiTask("Knowledge search");
    if (normalized.includes("personal") || normalized.includes("recommend") || normalized.includes("offer")) return addAiTask("Personalize");
    if (normalized.includes("workflow") || normalized.includes("automatic") || normalized.includes("autonomous")) return addAiTask("Workflow");

    const hasLiveAI = hasLiveProvider();
    if (hasLiveAI) {
      setMessages((items) => [...items, { role: "owner", text: prompt }]);
      setIsThinking(true);
      try {
        const liveAnswer = await askLiveProvider(prompt, data, businessProfile);
        if (liveAnswer) {
          queueTask(`${aiProvider.toUpperCase()} business answer`, liveAnswer);
          setMessages((items) => [...items, { role: "ai", text: liveAnswer }]);
          log(`${aiProvider.toUpperCase()} answered: ${prompt}`);
          onNotify(`${aiProvider.toUpperCase()} answered using live API.`);
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Live AI request failed";
        setMessages((items) => [...items, { role: "ai", text: `${message}. I switched to local BizPilot reasoning.` }]);
        onNotify("Live AI failed, local assistant used.");
      } finally {
        setIsThinking(false);
      }
    }

    const response = `Business snapshot: ${data.customers.length} customers, ${data.orders.length} orders, ${lowStock.length} stock risks, ${openInvoices.length} open invoices, and ${pendingOrders.length} pending orders. Suggested next action: run an autonomous workflow or generate a report.`;
    queueTask("Business analysis", response);
    setMessages((items) => [...items, ...(hasLiveAI ? [] : [{ role: "owner" as const, text: prompt }]), { role: "ai", text: response }]);
    log(`AI answered: ${prompt}`);
    onNotify("AI assistant answered using current business data.");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const prompt = input.trim();
    setInput("");
    void answerPrompt(prompt);
  }

  function simulateVoice() {
    setVoiceListening((listening) => !listening);
    const voicePrompt = "Generate today's report and restock low inventory";
    setInput(voicePrompt);
    onNotify("Voice prompt captured.");
  }

  return (
    <section className="panel assistant-panel">
      <div className="section-heading">
        <div>
          <p>AI employee</p>
          <h2>BizPilot Command</h2>
        </div>
        <button className={`voice-pill ${voiceListening ? "listening" : ""}`} type="button" onClick={simulateVoice}>
          <Mic size={15} />
          {voiceListening ? "Listening" : "Voice ready"}
        </button>
      </div>
      <div className="assistant-stats">
        <span>{lowStock.length} stock risks</span>
        <span>{openInvoices.length} open invoices</span>
        <span>{pendingOrders.length} pending orders</span>
        <span>{liveProviderLabel()}</span>
      </div>
      <div className="chat-window">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.text}
          </div>
        ))}
        {isThinking && (
          <div className="message ai thinking-message">
            {aiProvider.toUpperCase()} is thinking
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      <div className="quick-actions">
        {["Invoice", "Report", "Predict sales", "Restock", "Support reply", "Knowledge search", "Personalize", "Workflow"].map((action) => (
          <button type="button" key={action} onClick={() => addAiTask(action)}>
            {action}
          </button>
        ))}
      </div>
      <div className="suggested-prompts">
        {suggestedPrompts.map((prompt) => (
          <button type="button" key={prompt} onClick={() => setInput(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="assistant-workbench">
        <div>
          <div className="mini-heading">
            <span>Execution queue</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <div className="task-row" key={task.id}>
                <Check size={15} />
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.result}</p>
                </div>
                <span>{task.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mini-heading">
            <span>Generated output</span>
            <button
              className="mini-button"
              type="button"
              onClick={() => downloadText(`bizpilot-ai-output-${today()}.txt`, generatedOutput)}
            >
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="generated-output">{generatedOutput}</div>
        </div>
      </div>
      <form className="prompt-bar" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask BizPilot to execute a business task..."
        />
        <button type="submit" aria-label="Send message">
          <Sparkles size={16} />
        </button>
      </form>
    </section>
  );
}

function DashboardView({
  data,
  setData,
  businessProfile,
  onNavigate,
  onNotify,
  log,
}: {
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  businessProfile: BusinessProfile | null;
  onNavigate: (module: ModuleKey) => void;
  onNotify: (message: string) => void;
  log: (message: string) => void;
}) {
  const revenue = data.orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.amount, 0);
  const lowStock = data.inventory.filter((item) => item.stock < item.threshold).length;
  const metrics = [
    { label: "Revenue", value: currency(revenue), delta: "+18.4%", icon: CircleDollarSign },
    { label: "Orders", value: String(data.orders.length), delta: `${data.orders.filter((order) => order.status === "Pending").length} pending`, icon: PackageCheck },
    { label: "AI Score", value: lowStock ? "87" : "96", delta: lowStock ? "stock risk" : "optimized", icon: Brain },
    { label: "Business Health", value: lowStock > 2 ? "Watch" : "Stable", delta: `${lowStock} alerts`, icon: Gauge },
  ];

  function runDailyReport() {
    const id = makeId("REP");
    setData((current) => ({
      ...current,
      reports: [
        {
          id,
          title: "Daily Business Report",
          summary: `Revenue ${currency(revenue)} from ${current.orders.length} orders. ${lowStock} inventory items need attention.`,
          date: today(),
        },
        ...current.reports,
      ],
    }));
    log(`Generated daily report ${id}`);
    onNavigate("Reports");
    onNotify("Daily business report generated.");
  }

  function createInvoice() {
    const order = data.orders[0];
    if (!order) return;
    const id = makeId("BPI");
    setData((current) => ({
      ...current,
      invoices: [{ id, customer: order.customer, amount: order.amount, status: "Draft", date: today() }, ...current.invoices],
    }));
    log(`Created invoice ${id} for ${order.customer}`);
    onNavigate("Invoices");
    onNotify("Invoice draft created.");
  }

  return (
    <div className="view-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            Autonomous AI employee
          </div>
          <h1>BizPilot AI</h1>
          <p>Your first AI employee for every small business.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={runDailyReport}>
              Run daily report
            </button>
            <button className="secondary-button" type="button" onClick={createInvoice}>
              Create invoice
            </button>
          </div>
        </div>
        <OrbScene />
      </section>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <section className="panel theme-panel">
        <div className="section-heading">
          <div>
            <p>Theme 2</p>
            <h2>AI Automation & Intelligent Agents</h2>
          </div>
          <Sparkles size={20} />
        </div>
        <div className="theme-grid">
          {themeCapabilities.map((capability) => (
            <div className="theme-card" key={capability.title}>
              <strong>{capability.title}</strong>
              <p>{capability.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <div>
            <p>Analytics</p>
            <h2>Revenue forecast</h2>
          </div>
          <strong>{currency(Math.round(revenue * 1.22))} next 30 days</strong>
        </div>
        <MiniChart revenue={revenue} />
      </section>

      <WorkflowRunner data={data} setData={setData} onNotify={onNotify} log={log} />
      <AssistantPanel data={data} setData={setData} businessProfile={businessProfile} onNotify={onNotify} log={log} />

      <section className="panel activity-panel">
        <div className="section-heading">
          <div>
            <p>Live operations</p>
            <h2>Recent activity</h2>
          </div>
          <Activity size={20} />
        </div>
        {data.activities.map((activity) => (
          <div className="activity-row" key={activity.id}>
            <span />
            <p>{activity.text}</p>
            <small>{activity.time}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

function CreateForm({
  active,
  onClose,
  onCreate,
}: {
  active: ModuleKey;
  onClose: () => void;
  onCreate: (values: Record<string, string>) => void;
}) {
  const fields: Record<string, string[]> = {
    Customers: ["Name", "Email", "Note"],
    Orders: ["Customer", "Amount in INR"],
    Inventory: ["Item", "Stock", "Supplier"],
    Invoices: ["Customer", "Amount in INR"],
    Reports: ["Title", "Summary"],
    "Knowledge Base": ["Title", "Category", "Answer"],
    Automation: ["Name", "Trigger"],
    Employees: ["Name", "Role", "Access"],
  };
  const selected = fields[active] ?? ["Title", "Summary"];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onCreate(Object.fromEntries(formData.entries()) as Record<string, string>);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={submit}>
        <div className="section-heading">
          <div>
            <p>Create</p>
            <h2>{active}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form">
            <X size={18} />
          </button>
        </div>
        {selected.map((field) => (
          <label className="field" key={field}>
            <span>{field}</span>
            <input name={field} required placeholder={field} />
          </label>
        ))}
        <button className="primary-button" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}

function ModuleView({
  active,
  data,
  setData,
  onNotify,
  log,
}: {
  active: ModuleKey;
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  onNotify: (message: string) => void;
  log: (message: string) => void;
}) {
  const [creating, setCreating] = useState(false);

  function create(values: Record<string, string>) {
    setData((current) => {
      if (active === "Customers") {
        return {
          ...current,
          customers: [
            { id: makeId("CUS"), name: values.Name, email: values.Email, note: values.Note, loyalty: 70, orders: 0 },
            ...current.customers,
          ],
        };
      }
      if (active === "Orders") {
        return {
          ...current,
          orders: [{ id: makeId("ORD"), customer: values.Customer, amount: Number(values["Amount in INR"]), status: "Pending" }, ...current.orders],
        };
      }
      if (active === "Inventory") {
        return {
          ...current,
          inventory: [
            { id: makeId("INV"), item: values.Item, stock: Number(values.Stock), supplier: values.Supplier, threshold: 20 },
            ...current.inventory,
          ],
        };
      }
      if (active === "Invoices") {
        return {
          ...current,
          invoices: [{ id: makeId("BPI"), customer: values.Customer, amount: Number(values["Amount in INR"]), status: "Draft", date: today() }, ...current.invoices],
        };
      }
      if (active === "Reports") {
        return { ...current, reports: [{ id: makeId("REP"), title: values.Title, summary: values.Summary, date: today() }, ...current.reports] };
      }
      if (active === "Knowledge Base") {
        return {
          ...current,
          knowledge: [{ id: makeId("DOC"), title: values.Title, category: values.Category, answer: values.Answer }, ...current.knowledge],
        };
      }
      if (active === "Automation") {
        return {
          ...current,
          automation: [{ id: makeId("AUTO"), name: values.Name, trigger: values.Trigger, status: "Active" }, ...current.automation],
        };
      }
      if (active === "Employees") {
        return {
          ...current,
          employees: [{ id: makeId("EMP"), name: values.Name, role: values.Role, access: values.Access }, ...current.employees],
        };
      }
      return current;
    });
    log(`Created new ${active} record`);
    onNotify(`${active} record saved.`);
    setCreating(false);
  }

  function remove(kind: keyof BusinessData, id: string) {
    setData((current) => ({ ...current, [kind]: (current[kind] as Array<{ id: string }>).filter((item) => item.id !== id) }));
    log(`Deleted ${active} record ${id}`);
    onNotify("Record deleted.");
  }

  const list = (() => {
    if (active === "Customers") {
      return data.customers.map((item) => (
        <RecordRow key={item.id} title={item.name} meta={`${item.email} - Loyalty ${item.loyalty}`} action={<DeleteButton onClick={() => remove("customers", item.id)} />} />
      ));
    }
    if (active === "Orders") {
      return data.orders.map((item) => (
        <RecordRow
          key={item.id}
          title={`${item.id} - ${item.customer}`}
          meta={`${currency(item.amount)} - ${item.status}`}
          action={
            <button
              className="mini-button"
              type="button"
              onClick={() => {
                setData((current) => ({
                  ...current,
                  orders: current.orders.map((order) => (order.id === item.id ? { ...order, status: "Completed" } : order)),
                }));
                log(`Completed order ${item.id}`);
                onNotify(`${item.id} marked completed.`);
              }}
            >
              Complete
            </button>
          }
        />
      ));
    }
    if (active === "Inventory") {
      return data.inventory.map((item) => (
        <RecordRow
          key={item.id}
          title={item.item}
          meta={`${item.stock} units - ${statusForItem(item)} - ${item.supplier}`}
          action={
            <button
              className="mini-button"
              type="button"
              onClick={() => {
                setData((current) => ({
                  ...current,
                  inventory: current.inventory.map((stockItem) => (stockItem.id === item.id ? { ...stockItem, stock: stockItem.stock + 50 } : stockItem)),
                }));
                log(`Restocked ${item.item}`);
                onNotify(`${item.item} restocked.`);
              }}
            >
              Restock
            </button>
          }
        />
      ));
    }
    if (active === "Invoices") {
      return data.invoices.map((item) => (
        <RecordRow
          key={item.id}
          title={`${item.id} - ${item.customer}`}
          meta={`${currency(item.amount)} - ${item.status} - ${item.date}`}
          action={<button className="mini-button" type="button" onClick={() => downloadText(`${item.id}.txt`, `${item.id}\n${item.customer}\n${currency(item.amount)}\n${item.status}`)}>Export</button>}
        />
      ));
    }
    if (active === "Reports" || active === "Analytics") {
      return data.reports.map((item) => (
        <RecordRow
          key={item.id}
          title={`${item.title} - ${item.date}`}
          meta={item.summary}
          action={<button className="mini-button" type="button" onClick={() => downloadText(`${item.id}.txt`, `${item.title}\n${item.summary}`)}>Download</button>}
        />
      ));
    }
    if (active === "Knowledge Base") {
      return data.knowledge.map((item) => <RecordRow key={item.id} title={`${item.title} - ${item.category}`} meta={item.answer} action={<ChevronRight size={18} />} />);
    }
    if (active === "Automation") {
      return data.automation.map((item) => (
        <RecordRow
          key={item.id}
          title={item.name}
          meta={`${item.trigger} - ${item.status}`}
          action={
            <button
              className="mini-button"
              type="button"
              onClick={() => {
                setData((current) => ({
                  ...current,
                  automation: current.automation.map((rule) => (rule.id === item.id ? { ...rule, status: rule.status === "Active" ? "Paused" : "Active" } : rule)),
                }));
                onNotify(`${item.name} toggled.`);
              }}
            >
              Toggle
            </button>
          }
        />
      ));
    }
    if (active === "Employees") {
      return data.employees.map((item) => <RecordRow key={item.id} title={`${item.name} - ${item.role}`} meta={item.access} action={<DeleteButton onClick={() => remove("employees", item.id)} />} />);
    }
    return [
      <RecordRow key="api" title="Live AI provider" meta={liveProviderLabel()} action={<Lock size={18} />} />,
      <RecordRow key="firebase" title="Firebase" meta="Ready for auth, Firestore, and storage credentials." action={<ShieldCheck size={18} />} />,
      <RecordRow key="local" title="Local persistence" meta="Enabled through browser localStorage." action={<Check size={18} />} />,
    ];
  })();

  return (
    <div className="module-shell">
      <section className="panel module-main">
        <div className="section-heading">
          <div>
            <p>Module</p>
            <h2>{active}</h2>
          </div>
          {active !== "Analytics" && active !== "Settings" && (
            <button className="primary-button small" type="button" onClick={() => setCreating(true)}>
              <Plus size={16} />
              Create
            </button>
          )}
        </div>
        <div className="records">{list}</div>
      </section>
      <section className="panel insight-panel">
        <div className="section-heading">
          <div>
            <p>AI recommendation</p>
            <h2>Next best action</h2>
          </div>
          <Brain size={20} />
        </div>
        <p className="large-copy">
          BizPilot recommends completing pending orders, exporting open invoices, and restocking products below threshold before demand rises.
        </p>
        <div className="insight-list">
          <span>Customers {data.customers.length}</span>
          <span>Open invoices {data.invoices.filter((item) => item.status !== "Paid").length}</span>
          <span>Stock alerts {data.inventory.filter((item) => item.stock < item.threshold).length}</span>
        </div>
      </section>
      {creating && <CreateForm active={active} onClose={() => setCreating(false)} onCreate={create} />}
    </div>
  );
}

function RecordRow({ title, meta, action }: { title: string; meta: string; action: React.ReactNode }) {
  return (
    <motion.div className="record-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      {action}
    </motion.div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="mini-button danger" type="button" onClick={onClick} aria-label="Delete record">
      <Trash2 size={15} />
    </button>
  );
}

function SearchResults({
  query,
  data,
  onNavigate,
}: {
  query: string;
  data: BusinessData;
  onNavigate: (module: ModuleKey) => void;
}) {
  if (!query.trim()) return null;
  const haystack: { module: ModuleKey; title: string; meta: string }[] = [
    ...data.customers.map((item) => ({ module: "Customers" as ModuleKey, title: item.name, meta: item.email })),
    ...data.orders.map((item) => ({ module: "Orders" as ModuleKey, title: item.id, meta: item.customer })),
    ...data.inventory.map((item) => ({ module: "Inventory" as ModuleKey, title: item.item, meta: item.supplier })),
    ...data.invoices.map((item) => ({ module: "Invoices" as ModuleKey, title: item.id, meta: item.customer })),
    ...data.reports.map((item) => ({ module: "Reports" as ModuleKey, title: item.title, meta: item.summary })),
  ];
  const results = haystack.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  return (
    <div className="search-results">
      {results.length ? (
        results.map((item) => (
          <button key={`${item.module}-${item.title}`} type="button" onClick={() => onNavigate(item.module)}>
            <strong>{item.title}</strong>
            <span>{item.module} - {item.meta}</span>
          </button>
        ))
      ) : (
        <p>No matches found</p>
      )}
    </div>
  );
}

function BusinessDataError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">
          <ShieldCheck size={23} />
        </div>
        <p>Business data error</p>
        <h1>Unable to load business data</h1>
        <span className="auth-alert">
          {message || "Unable to load business data. Please check your internet connection or Firebase configuration."}
        </span>
        <div className="auth-actions">
          <button className="primary-button" type="button" onClick={onRetry}>
            Retry
          </button>
          <button className="secondary-button" type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      </section>
    </main>
  );
}

const moduleRoutes: Record<ModuleKey, string> = {
  Dashboard: "/dashboard",
  "AI Assistant": "/ai",
  Customers: "/customers",
  Orders: "/orders",
  Inventory: "/inventory",
  Invoices: "/invoices",
  Reports: "/reports",
  Analytics: "/analytics",
  "Knowledge Base": "/knowledge-base",
  Automation: "/automation",
  Employees: "/employees",
  Settings: "/settings",
};

const pathModules: Record<string, ModuleKey> = Object.entries(moduleRoutes).reduce(
  (acc, [module, path]) => ({ ...acc, [path]: module as ModuleKey }),
  {} as Record<string, ModuleKey>,
);

function WorkspaceApp() {
  const { businessProfile, logout } = useAuth();
  const { data, setData, log, dataLoading, dataError, retryLoad } = useBusinessData(businessProfile?.businessId);
  const [active, setActive] = useState<ModuleKey>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("BizPilot is running locally with persistent business data.");
  const [search, setSearch] = useState("");
  const location = useLocation();
  const routerNavigate = useNavigate();
  const ActiveIcon = modules.find((item) => item.name === active)?.icon ?? LayoutDashboard;

  useEffect(() => {
    setActive(pathModules[location.pathname] ?? "Dashboard");
  }, [location.pathname]);

  function notify(message: string) {
    setNotice(message);
  }

  function navigate(module: ModuleKey) {
    setActive(module);
    setSidebarOpen(false);
    setSearch("");
    routerNavigate(moduleRoutes[module]);
  }

  async function handleLogout() {
    await logout();
    routerNavigate("/login");
  }

  if (dataLoading) return <LoadingSkeleton label="Loading business data" />;
  if (dataError) return <BusinessDataError message={dataError} onRetry={retryLoad} />;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          {businessProfile?.logoUrl ? (
            <img className="business-logo" src={businessProfile.logoUrl} alt={`${businessProfile.businessName} logo`} />
          ) : (
            <div className="brand-mark">
              <Bot size={22} />
            </div>
          )}
          <div>
            <strong>{businessProfile?.businessName ?? "BizPilot AI"}</strong>
            <span>{businessProfile?.ownerName ?? "AI employee OS"}</span>
          </div>
          <button className="mobile-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <nav>
          {modules.map(({ name, icon: Icon }) => (
            <button
              className={active === name ? "active" : ""}
              key={name}
              type="button"
              onClick={() => {
                navigate(name);
                notify(`${name} opened.`);
              }}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
        </nav>
        <div className="security-card">
          <ShieldCheck size={20} />
          <strong>{businessProfile?.plan ?? "Starter"} plan</strong>
          <span>Online. Tenant ID: {businessProfile?.businessId.slice(0, 8)}...</span>
          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <button type="button" aria-label="Close menu" className="scrim" onClick={() => setSidebarOpen(false)} />}

      <section className="content-shell">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="page-title">
            <ActiveIcon size={21} />
            <div>
              <span>Workspace</span>
              <strong>{active}</strong>
            </div>
          </div>
          <div className="search-wrap">
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers, invoices, orders..." />
            </label>
            <SearchResults query={search} data={data} onNavigate={navigate} />
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button" onClick={() => notify(`${data.activities.length} recent activities available.`)} aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => {
                navigate("Settings");
                notify("Security settings opened.");
              }}
              aria-label="Security settings"
            >
              <Lock size={18} />
            </button>
          </div>
        </header>

        <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="content">
          {active === "Dashboard" || active === "AI Assistant" ? (
            <DashboardView data={data} setData={setData} businessProfile={businessProfile} onNavigate={navigate} onNotify={notify} log={log} />
          ) : (
            <ModuleView active={active} data={data} setData={setData} onNotify={notify} log={log} />
          )}
        </motion.div>
      </section>
      <button
        className="floating-agent"
        type="button"
        aria-label="Open AI assistant"
        onClick={() => {
          navigate("AI Assistant");
          notify("AI Assistant opened.");
        }}
      >
        <Headphones size={21} />
      </button>
      {notice && (
        <button className="toast" type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">
          <X size={14} />
          {notice}
        </button>
      )}
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/business-setup" element={<BusinessSetupPage />} />
        <Route path="/dashboard" element={<WorkspaceApp />} />
        <Route path="/orders" element={<WorkspaceApp />} />
        <Route path="/customers" element={<WorkspaceApp />} />
        <Route path="/inventory" element={<WorkspaceApp />} />
        <Route path="/invoices" element={<WorkspaceApp />} />
        <Route path="/reports" element={<WorkspaceApp />} />
        <Route path="/analytics" element={<WorkspaceApp />} />
        <Route path="/settings" element={<WorkspaceApp />} />
        <Route path="/automation" element={<WorkspaceApp />} />
        <Route path="/ai" element={<WorkspaceApp />} />
        <Route path="/knowledge-base" element={<WorkspaceApp />} />
        <Route path="/employees" element={<WorkspaceApp />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
