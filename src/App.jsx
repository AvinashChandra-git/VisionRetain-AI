import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getAccessToken,
  getSession,
  onAuthStateChange,
  sendPhoneChangeOtp,
  signInWithGoogle,
  signInWithPassword,
  signInWithPhoneOtp,
  signOut,
  updateUserProfile,
  verifyPhoneChangeOtp,
  verifyPhoneOtp,
} from "./otpAuth";


// ─── Design System
const C = {
  bg: "#050816", bgSec: "#0F172A", bgCard: "#0D1B3E",
  accent: "#00E5FF", success: "#00FF88", warning: "#FFC857",
  danger: "#FF5C5C", purple: "#7C3AED", pink: "#EC4899",
  text: "#E2E8F0", muted: "#64748B", border: "rgba(0,229,255,0.15)",
  indigo: "#6366F1", teal: "#14B8A6", orange: "#F97316"
};

const PHONE_E164 = /^\+[1-9]\d{7,14}$/;

// ─── Static Data ─────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "landing", label: "Home", icon: "🏠" },
  { id: "product-lens", label: "Product Lens", icon: "📷" },
  { id: "price", label: "Price Intel", icon: "💸" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "churn", label: "Churn Analytics", icon: "⚠" },
  { id: "demand", label: "Demand Forecast", icon: "📈" },
  { id: "sentiment", label: "Sentiment", icon: "💬" },
  { id: "revenue", label: "Revenue Intel", icon: "₹" },
  { id: "copilot", label: "AI Copilot", icon: "✨" },
  { id: "reports", label: "Reports", icon: "📄" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const profileStorageKey = (userId) => `visionretain_profile_complete_${userId}`;

function useIsCompactScreen() {
  const [compact, setCompact] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia("(max-width: 820px)").matches : false
  ));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(max-width: 820px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

function isProfileComplete(user) {
  if (!user?.id) return false;
  if (user.user_metadata?.profile_completed) return true;
  return localStorage.getItem(profileStorageKey(user.id)) === "true";
}

function priceStatusMessage(status) {
  if (!status) return "No verified live listings are available for this identification.";
  if (status.status === "unconfigured") return "Live prices are not configured. Add SERPAPI_API_KEY, then restart or redeploy the backend.";
  if (status.status === "provider_error") return "The live shopping provider is temporarily unavailable. Try again in a moment.";
  if (status.status === "no_verified_matches") return "The product was identified, but no sufficiently relevant current shopping listings matched it.";
  return status.message || "No verified live listings are available for this identification.";
}

function EmptyState({ title = "No live data yet", message = "Connect a live data source or add records in Supabase to populate this section." }) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, color: C.muted }}>
      <p style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{message}</p>
    </div>
  );
}

function deriveMetrics(customers) {
  const totalCustomers = customers.length;
  const monthlyRevenue = customers.reduce((sum, c) => sum + Number(c.spend || 0), 0);
  const highRisk = customers.filter(c => ["Critical", "High"].includes(c.risk)).length;
  const revenueAtRisk = customers
    .filter(c => ["Critical", "High"].includes(c.risk))
    .reduce((sum, c) => sum + Number(c.spend || 0), 0);
  return [
    { label: "Total Customers", value: totalCustomers, delta: "Live DB", color: C.accent, icon: "👥" },
    { label: "Monthly Revenue", value: monthlyRevenue, delta: "Live DB", color: C.success, icon: "₹", format: "money" },
    { label: "Revenue at Risk", value: revenueAtRisk, delta: "Live DB", color: C.danger, icon: "⚠", format: "money" },
    { label: "High-Risk Customers", value: highRisk, delta: "Live DB", color: C.warning, icon: "📈" },
  ];
}

function riskDistribution(customers) {
  const levels = [
    { label: "Critical", color: C.danger },
    { label: "High", color: C.warning },
    { label: "Medium", color: C.accent },
    { label: "Low", color: C.success },
  ];
  const total = Math.max(customers.length, 1);
  return levels.map(level => {
    const count = customers.filter(c => c.risk === level.label).length;
    return { ...level, count, pct: Math.round((count / total) * 100) };
  });
}

const COPILOT_STARTERS = [
  "Why are customers churning this month?",
  "Which products have the highest churn impact?",
  "Suggest a retention strategy for critical customers",
  "Predict next month's revenue",
  "Which customer segment needs immediate attention?",
];

// ─── Utility Hooks & Functions ────────────────────────────────────────────────
function useCountUp(target, duration = 1800, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return value;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString()}`;
}

function callClaude(messages, systemPrompt) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  }).then(r => r.json());
}

const DEFAULT_API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:8002"
    : "/api";
const ML_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const USE_SERVERLESS_API = ML_BASE_URL.startsWith("/api");
const apiEndpoint = (path) => USE_SERVERLESS_API ? path : `${ML_BASE_URL}${path}`;
const healthEndpoint = USE_SERVERLESS_API ? "/api/health" : `${ML_BASE_URL}/health`;

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { detail: (await response.text()).slice(0, 240) || `Request failed (${response.status})` };
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

async function imageFileToPayload(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });
  const maxDimension = 1024;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL("image/jpeg", 0.72);
  return {
    image_base64: compressed.split(",")[1],
    mime_type: "image/jpeg",
    filename: file.name,
  };
}

function productIcon(category = "") {
  const value = category.toLowerCase();
  if (value.includes("phone")) return "📱";
  if (value.includes("headphone") || value.includes("audio")) return "🎧";
  if (value.includes("computer") || value.includes("laptop")) return "💻";
  if (value.includes("camera")) return "📷";
  if (value.includes("shoe") || value.includes("footwear")) return "👟";
  if (value.includes("watch")) return "⌚";
  if (value.includes("television") || value.includes("tv")) return "📺";
  return "📦";
}

async function optionalAccessToken() {
  try {
    return await getAccessToken();
  } catch {
    return null;
  }
}

// ─── Supabase Auth (via src/otpAuth.js) ─────────────────────────────────────

// Note: this dashboard currently uses the ML microservice without auth.
// Supabase helpers are imported for future protected API calls.



function customerToFeatures(customer) {
  const inactiveDays = Number(customer.lastActive.match(/\d+/)?.[0] || 1);
  return {
    customer_id: customer.id,
    engagement_score: Math.max(0.05, Math.min(0.95, 1 - customer.churn / 115)),
    days_since_active: inactiveDays,
    support_tickets: customer.churn > 70 ? 7 : customer.churn > 40 ? 4 : 1,
    tenure_months: customer.tenure,
    monthly_spend: customer.spend,
    nps_score: customer.nps,
    feature_adoption_count: customer.plan === "Enterprise" ? 15 : customer.plan === "Business" ? 11 : customer.plan === "Pro" ? 8 : 5,
    plan: customer.plan.toUpperCase(),
    purchase_count_30d: customer.churn > 70 ? 0 : 2,
    purchase_count_90d: customer.churn > 70 ? 1 : 7,
    avg_session_duration_mins: Math.max(5, 45 - customer.churn / 3),
    login_frequency_per_week: Math.max(0.5, 7 - customer.churn / 18),
  };
}

async function predictChurnWithML(customer) {
  const res = await fetch(`${ML_BASE_URL}/predict/churn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customerToFeatures(customer)),
  });
  if (!res.ok) throw new Error("ML churn prediction failed");
  return res.json();
}

function localSentimentAnalysis(text) {
  const lower = text.toLowerCase();
  const positives = ["love", "great", "good", "excellent", "fast", "helpful", "easy", "happy", "recommend", "amazing"];
  const negatives = ["bad", "slow", "expensive", "issue", "problem", "cancel", "angry", "broken", "poor", "frustrated"];
  const pos = positives.filter(w => lower.includes(w)).length;
  const neg = negatives.filter(w => lower.includes(w)).length;
  const score = Math.max(-100, Math.min(100, (pos - neg) * 24 + (lower.includes("but") ? -8 : 0)));
  const sentiment = score > 30 ? "Positive" : score < -30 ? "Negative" : pos && neg ? "Mixed" : "Neutral";
  const intent = score < -35 || lower.includes("cancel") ? "Churn Risk" : score > 45 ? "Promoter" : lower.includes("price") || lower.includes("plan") ? "Upsell Opportunity" : "Support Needed";
  return {
    sentiment,
    score,
    confidence: Math.min(96, 72 + (pos + neg) * 5),
    emotions: score < -30 ? ["frustration", "urgency"] : score > 30 ? ["satisfaction", "trust"] : ["curiosity", "uncertainty"],
    keyTopics: [
      lower.includes("price") || lower.includes("expensive") ? "pricing" : "experience",
      lower.includes("support") || lower.includes("ticket") ? "support" : "features",
    ],
    intent,
    summary: `${sentiment} feedback detected with ${intent.toLowerCase()} intent. Prioritize follow-up on the highlighted topics.`,
  };
}

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Shared Components ────────────────────────────────────────────────────────
function MiniChart({ data, color, width = 80, height = 32 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

function KPICard({ label, value, delta, color, icon, format, active }) {
  const count = useCountUp(value, 1800, active);
  const display = format === "money" ? formatMoney(count) : count.toLocaleString();
  const isUp = delta.startsWith("+");
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${color}22`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: `0 0 30px ${color}11` }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}18, transparent 70%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{display}</p>
        </div>
        <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
        <span style={{ color: isUp ? C.success : C.danger, fontSize: 13, fontWeight: 600 }}>{delta}</span>
        <span style={{ color: C.muted, fontSize: 11 }}>vs last month</span>
        <div style={{ marginLeft: "auto" }}>
          <MiniChart data={[60,72,65,80,78,85,88,91,95]} color={color} />
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    Critical: { bg: "#FF5C5C22", color: C.danger },
    High: { bg: "#FFC85722", color: C.warning },
    Medium: { bg: "#00E5FF22", color: C.accent },
    Low: { bg: "#00FF8822", color: C.success },
  };
  const s = map[level] || map.Low;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {level}
    </span>
  );
}

function ChurnBar({ factor, impact, direction }) {
  const color = direction === "positive" ? C.success : C.danger;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: C.text, fontSize: 13 }}>{factor}</span>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{direction === "positive" ? "+" : "-"}{(impact * 100).toFixed(0)}%</span>
      </div>
      <div style={{ background: "#ffffff08", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${impact * 100 / 0.35 * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// ─── Product Lens Module (REAL AI image analysis) ─────────────────────────────
function ProductLensModule() {
  const compact = useIsCompactScreen();
  const [phase, setPhase] = useState("idle"); // idle | scanning | detected | error
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [prices, setPrices] = useState([]);
  const [priceStatus, setPriceStatus] = useState(null);
  const [pricesFetchedAt, setPricesFetchedAt] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [scanError, setScanError] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);

  const loadRecentScans = useCallback(async () => {
    try {
      const token = await optionalAccessToken();
      if (!token) return;
      const response = await fetch(apiEndpoint("/api/v1/product-lens/history?limit=8"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await readApiResponse(response);
        setRecentScans(data.scans || []);
      }
    } catch {
      // History is supplemental; scanning remains available if persistence is offline.
    }
  }, []);

  useEffect(() => {
    loadRecentScans();
  }, [loadRecentScans]);

  const analyzeImageWithAI = async (file) => {
    setPhase("scanning");
    setProgress(0);
    setScanError("");
    setPrices([]);
    setPriceStatus(null);
    const progIv = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8 + 3, 88));
    }, 200);
    try {
      const token = await optionalAccessToken();
      const body = USE_SERVERLESS_API ? JSON.stringify(await imageFileToPayload(file)) : new FormData();
      if (!USE_SERVERLESS_API) body.append("image", file);
      const response = await fetch(apiEndpoint("/api/v1/product-lens/scan"), {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(USE_SERVERLESS_API ? { "Content-Type": "application/json" } : {}),
        },
        body,
      });
      const result = await readApiResponse(response);
      clearInterval(progIv);
      setProgress(100);
      const parsed = result.identification;
      setAiResult(result);
      setSelected({
        name: parsed.product_name || "Unknown object",
        brand: parsed.brand || "Not verified",
        category: parsed.category || "Unknown",
        confidence: Number(parsed.confidence || 0),
        model: parsed.model || "Not verified",
        image: productIcon(parsed.category),
        keyFeatures: parsed.features || [],
        ocrText: parsed.ocr_text || "",
        objects: parsed.objects || [],
        identityStatus: parsed.identity_status,
        isAiDetected: true,
      });
      setPrices(result.pricing?.listings || []);
      setPriceStatus(result.pricing);
      setPricesFetchedAt(result.pricing?.fetched_at || null);
      setRecentScans(current => [{
        id: result.scan_id || `local-${Date.now()}`,
        product_name: parsed.product_name,
        category: parsed.category,
        confidence: parsed.confidence,
        created_at: new Date().toISOString(),
      }, ...current.filter(item => item.id !== result.scan_id)].slice(0, 8));
      setPhase("detected");
      loadRecentScans();
    } catch (err) {
      clearInterval(progIv);
      const message = err.message === "Failed to fetch"
        ? "Product Lens backend is offline. Start it with npm run dev:all or ./start_all.sh."
        : err.message || "Detection failed";
      setScanError(message);
      setPhase("error");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target.result;
      setUploadedImage(result);
      analyzeImageWithAI(file);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setShowCamera(true);
    } catch {
      setScanError("Camera access was denied. Upload an image instead.");
      setPhase("error");
    }
  };

  const capturePhoto = () => {
    if (!cameraRef.current || !stream) return;
    const canvas = document.createElement("canvas");
    const video = cameraRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setShowCamera(false);
    setUploadedImage(dataUrl);
    canvas.toBlob(blob => {
      if (blob) analyzeImageWithAI(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  const displayPrice = prices.length
    ? `${prices[0].currency === "INR" ? "₹" : `${prices[0].currency} `}${prices[0].price.toLocaleString()}`
    : "No verified live price";

  return (
    <div>
      {showCamera && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <video ref={v => { if (v && stream) { v.srcObject = stream; v.play(); cameraRef.current = v; } }}
            style={{ width: "90vw", maxWidth: 480, borderRadius: 16, border: `2px solid ${C.accent}` }} autoPlay playsInline />
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={capturePhoto} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📸 Capture</button>
            <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); setShowCamera(false); setStream(null); }}
              style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 20 }}>
        {/* Scan Panel */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scan Interface</p>
          </div>
          <div style={{ padding: 20 }}>
            {phase === "idle" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                {uploadedImage ? (
                  <img src={uploadedImage} alt="uploaded" style={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 12, marginBottom: 16 }} />
                ) : (
                  <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.6 }}>◎</div>
                )}
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Point camera at a product or upload an image</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={openCamera} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📷 Camera</button>
                  <button onClick={() => fileRef.current?.click()} style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}>⬆ Upload</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                </div>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 14 }}>Vision recognition + verified live shopping matches</p>
              </div>
            )}
            {phase === "scanning" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                {uploadedImage && <img src={uploadedImage} alt="scanning" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 12, marginBottom: 16, opacity: 0.6 }} />}
                <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.accent}44`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", position: "absolute" }} />
                  <span style={{ fontSize: 28 }}>◎</span>
                </div>
                <p style={{ color: C.accent, fontSize: 13, marginBottom: 12 }}>Identifying objects and checking current listings...</p>
                <div style={{ background: "#ffffff08", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`, transition: "width 0.2s" }} />
                </div>
                <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{Math.round(progress)}% — extracting metadata</p>
              </div>
            )}
            {phase === "detected" && selected && (
              <div>
                {uploadedImage && <img src={uploadedImage} alt="detected" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 12, marginBottom: 14 }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#00E5FF08", borderRadius: 12, border: `1px solid ${C.accent}22`, marginBottom: 14 }}>
                  <span style={{ fontSize: 44 }}>{selected.image}</span>
                  <div>
                    <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>{selected.name}</p>
                    <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{selected.brand} · {selected.category}</p>
                  </div>
                  {selected.isAiDetected && <span style={{ marginLeft: "auto", background: "#7C3AED22", color: C.purple, fontSize: 10, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>AI</span>}
                </div>
                {[
                  ["Brand", selected.brand],
                  ["Model", selected.model],
                  ["Category", selected.category],
                  ["Identity", selected.identityStatus?.replace("_", " ") || "unknown"],
                  ["Confidence estimate", `${selected.confidence.toFixed(1)}%`],
                  ["Best verified price", displayPrice],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>{k}</span>
                    <span style={{ color: k === "Confidence" ? C.success : C.text, fontSize: 13, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                {selected.keyFeatures?.length > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#7C3AED0A", borderRadius: 8, border: `1px solid ${C.purple}22` }}>
                    <p style={{ color: C.purple, fontSize: 11, margin: "0 0 6px", fontWeight: 600 }}>KEY FEATURES</p>
                    {selected.keyFeatures.map((f, i) => (
                      <p key={i} style={{ color: C.text, fontSize: 12, margin: "0 0 2px" }}>• {f}</p>
                    ))}
                  </div>
                )}
                {selected.ocrText && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#00FF8808", borderRadius: 8 }}>
                    <span style={{ color: C.success, fontSize: 12 }}>✓ OCR: "{selected.ocrText.slice(0, 60)}{selected.ocrText.length > 60 ? "..." : ""}"</span>
                  </div>
                )}
                {selected.objects?.length > 0 && (
                  <div style={{ marginTop: 10, color: C.muted, fontSize: 11 }}>
                    Objects found: {selected.objects.map(object => `${object.label} (${Math.round(object.confidence)}%)`).join(", ")}
                  </div>
                )}
                <p style={{ color: C.warning, fontSize: 10, lineHeight: 1.5, margin: "12px 0 0" }}>
                  Exact identity requires visible model/SKU evidence. Always verify the retailer title before purchase.
                </p>
                <button onClick={() => { setPhase("idle"); setSelected(null); setUploadedImage(null); setAiResult(null); setPrices([]); }} style={{ width: "100%", marginTop: 12, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>Scan another product</button>
              </div>
            )}
            {phase === "error" && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠</div>
                <p style={{ color: C.danger, fontSize: 14 }}>{scanError || "Detection failed. Please try again."}</p>
                <button onClick={() => setPhase("idle")} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "8px 20px", marginTop: 12, cursor: "pointer" }}>Retry</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recent Scans</p>
          </div>
          <div style={{ padding: 16 }}>
            {recentScans.length === 0 && (
              <p style={{ color: C.muted, fontSize: 12, padding: 12 }}>No persisted scans yet. Upload an image to begin.</p>
            )}
            {recentScans.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 10, marginBottom: 8, background: "transparent", border: "1px solid transparent" }}>
                <span style={{ fontSize: 28 }}>{productIcon(p.category)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.text, fontSize: 13, margin: "0 0 2px", fontWeight: 500 }}>{p.product_name}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{p.category} · {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>{Number(p.confidence).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price Comparison + History */}
      {selected && phase === "detected" && (
        <>
          <div style={{ marginTop: 20, background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Price Intelligence — {selected.name}
              </p>
              <span style={{ color: C.muted, fontSize: 11 }}>
                {prices.length} verified matches
                {pricesFetchedAt ? ` • ${new Date(pricesFetchedAt).toLocaleString()}` : ""}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Store", "Price", "Availability", "Match", "Rating", ""].map(h => (
                      <th key={h} style={{ padding: "12px 16px", color: C.muted, fontWeight: 500, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prices.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: r.badge ? "#00FF8808" : "transparent" }}>
                      <td style={{ padding: "12px 16px", color: C.text, fontWeight: 500 }}>
                        {r.store}
                        {r.badge && <span style={{ marginLeft: 8, background: "#00FF8820", color: C.success, fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{r.badge}</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: r.badge ? C.success : C.text, fontWeight: r.badge ? 700 : 400 }}>
                        {r.currency === "INR" ? "₹" : `${r.currency} `}{r.price.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: C.warning, fontSize: 12 }}>● {r.availability}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: C.muted }}>{Math.round((r.relevance || 0) * 100)}% title match</td>
                      <td style={{ padding: "12px 16px", color: C.warning }}>{r.rating ? `★ ${r.rating}` : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => window.open(r.product_url, "_blank", "noopener,noreferrer")} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.accent, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>Open ↗</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {prices.length === 0 && (
              <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>
                {priceStatusMessage(priceStatus)}
              </div>
            )}
          </div>

          {/* Price History Chart */}
        </>
      )}
    </div>
  );
}

// ─── Customers Module ─────────────────────────────────────────────────────────
function CustomersModule({ customers = [] }) {
  const compact = useIsCompactScreen();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("table"); // table | segments
  const filtered = customers.filter(c =>
    (filter === "All" || c.risk === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const segments = Object.values(customers.reduce((acc, c) => {
    const name = c.segment || c.plan || "Unsegmented";
    acc[name] ||= { name, customers: 0, ltv: 0, churn: 0 };
    acc[name].customers += 1;
    acc[name].ltv += Number(c.ltv || 0);
    acc[name].churn += Number(c.churn || 0);
    return acc;
  }, {})).map((segment, index) => ({
    ...segment,
    avgLtv: segment.customers ? segment.ltv / segment.customers : 0,
    avgChurn: segment.customers ? segment.churn / segment.customers : 0,
    color: [C.success, C.accent, C.warning, C.danger, C.purple][index % 5],
  }));

  return (
    <div>
      {customers.length === 0 ? (
        <EmptyState
          title="No live customers in the database"
          message="Add real customer rows to Supabase or connect your CRM import. Demo customers are no longer shown."
        />
      ) : (
      <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ flex: compact ? "1 1 100%" : 1, minWidth: 180, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
        {["All", "Critical", "High", "Medium", "Low"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.accent : "transparent", color: filter === f ? "#000" : C.muted, border: `1px solid ${filter === f ? C.accent : C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{f}</button>
        ))}
        <button onClick={() => setView(v => v === "table" ? "segments" : "table")} style={{ background: "#7C3AED22", color: C.purple, border: `1px solid ${C.purple}44`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          {view === "table" ? "◉ Segments" : "≡ Table"}
        </button>
      </div>

      {view === "segments" && (
        <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
          {segments.map(s => (
            <div key={s.name} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${s.color}22`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <span style={{ color: s.color, fontSize: 20 }}>👥</span>
                  <h4 style={{ color: "#fff", margin: "6px 0 4px", fontSize: 14, fontWeight: 700 }}>{s.name}</h4>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Derived from live customer rows.</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  ["Customers", s.customers.toLocaleString()],
                  ["Avg LTV", `₹${(s.avgLtv / 100000).toFixed(1)}L`],
                  ["Churn Risk", `${Math.round(s.avgChurn)}%`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#ffffff06", borderRadius: 8, padding: "8px 10px" }}>
                    <p style={{ color: C.muted, fontSize: 10, margin: "0 0 3px", textTransform: "uppercase" }}>{k}</p>
                    <p style={{ color: k === "Churn Risk" ? (s.avgChurn > 60 ? C.danger : s.avgChurn > 30 ? C.warning : C.success) : C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Customer", "Plan", "Monthly Spend", "LTV", "NPS", "Churn Risk", "Risk Level", "Last Active"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: C.muted, fontWeight: 500, textAlign: "left", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}44, ${C.purple}44)`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 12, fontWeight: 700 }}>
                      {c.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p style={{ color: C.text, margin: "0 0 1px", fontWeight: 500 }}>{c.name}</p>
                      <p style={{ color: C.muted, margin: 0, fontSize: 11 }}>{c.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><span style={{ color: C.text, background: "#ffffff08", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{c.plan}</span></td>
                <td style={{ padding: "12px 16px", color: C.text, fontWeight: 600 }}>₹{c.spend.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", color: C.purple, fontWeight: 600 }}>₹{(c.ltv / 100000).toFixed(1)}L</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ color: c.nps >= 60 ? C.success : c.nps >= 40 ? C.warning : C.danger, fontWeight: 600 }}>{c.nps}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, background: "#ffffff08", borderRadius: 4, height: 5, maxWidth: 70 }}>
                      <div style={{ width: `${c.churn}%`, height: "100%", borderRadius: 4, background: c.churn > 70 ? C.danger : c.churn > 40 ? C.warning : C.success }} />
                    </div>
                    <span style={{ color: c.churn > 70 ? C.danger : c.churn > 40 ? C.warning : C.success, fontSize: 12, fontWeight: 700 }}>{c.churn}%</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><RiskBadge level={c.risk} /></td>
                <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{c.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>No customers found</div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

// ─── Churn Module ─────────────────────────────────────────────────────────────
function ChurnModule({ customers = [] }) {
  const [customer, setCustomer] = useState(customers[0] || null);
  const [aiRecs, setAiRecs] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);

  useEffect(() => {
    if (!customers.length) {
      setCustomer(null);
      return;
    }
    setCustomer(current => current && customers.some(c => c.id === current.id) ? current : customers[0]);
  }, [customers]);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setMlPrediction(null);
    predictChurnWithML(customer)
      .then(result => { if (!cancelled) setMlPrediction(result); })
      .catch(() => { if (!cancelled) setMlPrediction({ error: "Live ML prediction unavailable" }); });
    return () => { cancelled = true; };
  }, [customer]);

  if (!customers.length || !customer) {
    return (
      <EmptyState
        title="No live customers available for churn analysis"
        message="Churn analytics now requires real customer records from the database. Add customers or connect an import before running analysis."
      />
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      <div>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
          <p style={{ color: C.accent, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Select Customer</p>
          {customers.slice(0, 6).map(c => (
            <div key={c.id} onClick={() => { setCustomer(c); setAiRecs(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: customer.id === c.id ? "#00E5FF0D" : "transparent", border: `1px solid ${customer.id === c.id ? C.accent + "44" : "transparent"}` }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}33, ${C.purple}33)`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {c.name.split(" ").map(w => w[0]).join("")}
              </div>
              <div>
                <p style={{ color: C.text, margin: 0, fontSize: 12, fontWeight: 500 }}>{c.name}</p>
                <p style={{ color: C.muted, margin: 0, fontSize: 10 }}>{c.plan}</p>
              </div>
              <span style={{ marginLeft: "auto", color: c.churn > 70 ? C.danger : c.churn > 40 ? C.warning : C.success, fontSize: 12, fontWeight: 700 }}>{c.churn}%</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: "#fff", margin: "0 0 4px", fontSize: 18 }}>{customer.name}</h3>
              <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>{customer.email} · {customer.plan} · {customer.segment}</p>
            </div>
            <RiskBadge level={customer.risk} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 110, height: 110 }}>
              <svg viewBox="0 0 110 110" style={{ position: "absolute", top: 0, left: 0 }}>
                <circle cx={55} cy={55} r={46} fill="none" stroke="#ffffff08" strokeWidth={10} />
                <circle cx={55} cy={55} r={46} fill="none" stroke={customer.churn > 70 ? C.danger : customer.churn > 40 ? C.warning : C.success} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${customer.churn / 100 * 289} 289`} transform="rotate(-90 55 55)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: customer.churn > 70 ? C.danger : customer.churn > 40 ? C.warning : C.success, fontSize: 22, fontWeight: 800 }}>{customer.churn}%</span>
                <span style={{ color: C.muted, fontSize: 10 }}>churn risk</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Monthly Spend", `₹${customer.spend.toLocaleString()}`],
                  ["Lifetime Value", `₹${(customer.ltv / 100000).toFixed(1)}L`],
                  ["NPS Score", customer.nps],
                  ["Tenure", `${customer.tenure} months`],
                  ["Last Active", customer.lastActive],
                  ["Live ML Score", mlPrediction?.churn_probability ? `${Math.round(mlPrediction.churn_probability * 100)}%` : mlPrediction?.error || "Checking..."],
                  ["Model", mlPrediction?.model || (mlPrediction?.error ? "Unavailable" : "Live backend")],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#ffffff05", borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ color: C.muted, fontSize: 11, margin: "0 0 3px" }}>{k}</p>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Live Explainability
          </p>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Explainability is shown only when the live ML backend returns feature drivers. Static SHAP demo factors have been removed.
          </p>
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Retention Playbook</p>
          </div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Retention recommendations require a live AI endpoint connected to your real customer history. No local demo playbook is shown.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sentiment Module ─────────────────────────────────────────────────────────
function SentimentModule() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState("");

  const analyzeText = async () => {
    if (!inputText.trim()) return;
    setAnalyzing(true);
    setResult(null);
    await wait(650);
    setResult(localSentimentAnalysis(inputText));
    setAnalyzing(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <EmptyState
          title="No live sentiment dataset connected"
          message="Static social/review sentiment cards have been removed. Connect a reviews, tickets, or mentions table/API to show live sentiment aggregates."
        />
      </div>

      {/* Real-time Text Analysis */}
      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          ✦ Live Sentiment Analyzer — Powered by AI
        </p>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste a customer review, support ticket, or social mention here..."
          style={{ width: "100%", height: 100, background: "#ffffff06", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        />
        <button onClick={analyzeText} disabled={analyzing || !inputText.trim()} style={{ marginTop: 10, background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (analyzing || !inputText.trim()) ? 0.5 : 1 }}>
          {analyzing ? "Analyzing..." : "Analyze Sentiment →"}
        </button>

        {result && (
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#ffffff06", borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 8px" }}>Sentiment</p>
              <p style={{ color: result.score > 30 ? C.success : result.score < -30 ? C.danger : C.warning, fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{result.sentiment}</p>
              <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Score: {result.score > 0 ? "+" : ""}{result.score}</p>
            </div>
            <div style={{ background: "#ffffff06", borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 8px" }}>Business Intent</p>
              <p style={{ color: result.intent?.includes("Churn") ? C.danger : result.intent?.includes("Upsell") ? C.success : C.accent, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{result.intent}</p>
              <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{result.confidence}% confidence</p>
            </div>
            <div style={{ background: "#ffffff06", borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 8px" }}>Emotions</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {result.emotions?.map(e => (
                  <span key={e} style={{ background: "#7C3AED22", color: C.purple, fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>{e}</span>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", background: "#00E5FF08", borderRadius: 12, padding: 16, border: `1px solid ${C.accent}22` }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 6px" }}>AI Summary</p>
              <p style={{ color: C.text, fontSize: 13, margin: "0 0 10px" }}>{result.summary}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {result.keyTopics?.map(t => (
                  <span key={t} style={{ background: "#00E5FF14", color: C.accent, fontSize: 11, padding: "2px 10px", borderRadius: 10 }}>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Revenue Intelligence Module ──────────────────────────────────────────────
function RevenueModule({ customers = [] }) {
  if (!customers.length) {
    return (
      <EmptyState
        title="No live revenue records"
        message="Revenue intelligence now uses real customer spend from the database. Add customer rows with spend values or connect billing data."
      />
    );
  }
  const monthlyRevenue = customers.reduce((sum, c) => sum + Number(c.spend || 0), 0);
  const annualRevenue = monthlyRevenue * 12;
  const atRiskRevenue = customers
    .filter(c => ["Critical", "High"].includes(c.risk))
    .reduce((sum, c) => sum + Number(c.spend || 0), 0);
  const avgContract = customers.length ? monthlyRevenue / customers.length : 0;
  const bySegment = Object.values(customers.reduce((acc, c) => {
    const segment = c.segment || c.plan || "Unsegmented";
    acc[segment] ||= { name: segment, revenue: 0, customers: 0 };
    acc[segment].revenue += Number(c.spend || 0);
    acc[segment].customers += 1;
    return acc;
  }, {}));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "ARR", value: formatMoney(annualRevenue), color: C.success, sub: "Derived from live customer spend" },
          { label: "MRR", value: formatMoney(monthlyRevenue), color: C.accent, sub: "Sum of live monthly spend" },
          { label: "Revenue at Risk", value: formatMoney(atRiskRevenue), color: C.danger, sub: "Critical + High risk customers" },
          { label: "Customers", value: customers.length.toLocaleString(), color: C.purple, sub: "Live database rows" },
          { label: "Avg Customer Spend", value: formatMoney(avgContract), color: C.success, sub: "Monthly average" },
          { label: "Segments", value: bySegment.length.toLocaleString(), color: C.warning, sub: "From live customer segments" },
        ].map(k => (
          <div key={k.label} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${k.color}22`, padding: 18 }}>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 8px" }}>{k.label}</p>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{k.value}</p>
            <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Revenue by Segment</p>
          {bySegment.map((s) => (
            <div key={s.name} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.text, fontSize: 13 }}>{s.name}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{formatMoney(s.revenue)}</span>
              </div>
              <div style={{ background: "#ffffff08", borderRadius: 4, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${monthlyRevenue ? (s.revenue / monthlyRevenue) * 100 : 0}%`, height: "100%", background: C.accent, borderRadius: 4 }} />
              </div>
              <p style={{ color: C.muted, fontSize: 10, margin: "4px 0 0" }}>{s.customers.toLocaleString()} customers</p>
            </div>
          ))}
        </div>
      </div>

      <EmptyState title="No live revenue forecast connected" message="Forecasts require a time-series billing/order dataset. Static 90-day revenue forecasts have been removed." />
    </div>
  );
}

// ─── AI Copilot ───────────────────────────────────────────────────────────────
function CopilotModule() {
  return (
    <EmptyState
      title="AI Copilot is not connected to a live backend yet"
      message="Local canned Copilot answers have been removed. Add a protected AI chat endpoint connected to your real database before enabling this section."
    />
  );
}

// ─── Reports Module ────────────────────────────────────────────────────────────
function ReportsModule() {
  return (
    <EmptyState
      title="Live reports are not connected yet"
      message="Static/generated report downloads have been removed. Reports need a backend endpoint that builds files from your real database records."
    />
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  const features = [
    { icon: "◎", title: "Product Lens AI", desc: "Real AI image recognition. Upload any product photo — get brand, model, specs, and live price comparison instantly." },
    { icon: "△", title: "Churn Prediction", desc: "XGBoost + Random Forest with SHAP explanations. Identify at-risk customers before they leave." },
    { icon: "◇", title: "Price Intelligence", desc: "Real-time comparison across Amazon, Flipkart, Croma, Vijay Sales. 6-month price history graphs." },
    { icon: "▲", title: "Demand Forecasting", desc: "90-day AI forecasts with confidence intervals. Plan inventory and campaigns ahead of the curve." },
    { icon: "◑", title: "Sentiment Analysis", desc: "Analyze customer reviews, support tickets, and social mentions. Map to churn risk and upsell opportunities." },
    { icon: "✦", title: "AI Copilot", desc: "Ask your data in plain English. Powered by Claude with full business context and memory." },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "80px 40px", textAlign: "center", position: "relative", flex: 1 }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${C.accent}12 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, ${C.purple}12 0%, transparent 50%)`, pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00E5FF14", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block" }} />
          <span style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}>Now with Claude Vision · YOLOv8 · XGBoost · Real-time AI</span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.05, letterSpacing: "-0.03em" }}>Predict Churn.</h1>
        <h1 style={{ fontSize: 56, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.05, letterSpacing: "-0.03em", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scan Products.</h1>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: C.success, margin: "0 0 24px", lineHeight: 1.05, letterSpacing: "-0.03em" }}>Protect Revenue.</h1>
        <p style={{ color: C.muted, fontSize: 18, maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
          AI-powered product intelligence and customer retention platform connected to your live data sources.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 60 }}>
          <button onClick={onEnter} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 0 40px ${C.accent}44` }}>Launch Dashboard →</button>
          <button onClick={onEnter} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Open Workspace</button>
        </div>
      </div>
      <div style={{ padding: "0 40px 80px" }}>
        <p style={{ color: C.accent, fontSize: 12, textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 40 }}>Platform Capabilities</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, transition: "all 0.2s" }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: C.accent }}>{f.icon}</div>
              <h3 style={{ color: "#fff", fontSize: 16, margin: "0 0 8px", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={onEnter} style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: "12px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Explore All Features →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Module ──────────────────────────────────────────────────────────
function SettingsModule({ user, onProfileUpdated }) {
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [settingsPhoneOtp, setSettingsPhoneOtp] = useState("");
  const [settingsPhoneOtpSent, setSettingsPhoneOtpSent] = useState(false);
  const [settingsPhoneVerified, setSettingsPhoneVerified] = useState(() => Boolean(user?.phone));
  const [settingsPhoneBusy, setSettingsPhoneBusy] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    company: "",
    job_title: "",
    phone: "",
    timezone: "",
  });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    setProfileForm({
      full_name: metadata.full_name || metadata.name || "",
      email: user?.email || "",
      company: metadata.company || "",
      job_title: metadata.job_title || "",
      phone: user?.phone || metadata.phone || "",
      timezone: metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    });
    setSettingsPhoneVerified(Boolean(user?.phone));
    setSettingsPhoneOtpSent(false);
    setSettingsPhoneOtp("");
  }, [user?.id, user?.email, user?.phone, user?.user_metadata]);

  const setProfileField = (field, value) => {
    setProfileForm(current => ({ ...current, [field]: value }));
    if (field === "phone") {
      setSettingsPhoneVerified(Boolean(user?.phone && value.trim() === user.phone));
      setSettingsPhoneOtpSent(false);
      setSettingsPhoneOtp("");
    }
  };

  const requestSettingsPhoneOtp = async () => {
    const cleanPhone = profileForm.phone.replace(/\s/g, "");
    setProfileError("");
    if (!PHONE_E164.test(cleanPhone)) {
      setProfileError("Enter phone in international format, for example +919876543210.");
      return;
    }
    setSettingsPhoneBusy(true);
    try {
      await sendPhoneChangeOtp(cleanPhone);
      setProfileForm(current => ({ ...current, phone: cleanPhone }));
      setSettingsPhoneOtpSent(true);
    } catch (err) {
      setProfileError(err?.message || "Could not send phone verification OTP.");
    } finally {
      setSettingsPhoneBusy(false);
    }
  };

  const confirmSettingsPhoneOtp = async () => {
    const cleanPhone = profileForm.phone.replace(/\s/g, "");
    setProfileError("");
    setSettingsPhoneBusy(true);
    try {
      const updatedUser = await verifyPhoneChangeOtp(cleanPhone, settingsPhoneOtp);
      setSettingsPhoneVerified(true);
      setSettingsPhoneOtpSent(false);
      setSettingsPhoneOtp("");
      onProfileUpdated?.(updatedUser);
    } catch (err) {
      setProfileError(err?.message || "Invalid phone verification code.");
    } finally {
      setSettingsPhoneBusy(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError("");
    try {
      const cleanPhone = profileForm.phone.trim().replace(/\s/g, "");
      if (cleanPhone) {
        if (!PHONE_E164.test(cleanPhone)) {
          throw new Error("Enter phone in international format, for example +919876543210.");
        }
        if (!settingsPhoneVerified) {
          throw new Error("Verify your phone number with OTP, or leave phone blank.");
        }
      }
      const updatedUser = await updateUserProfile({
        full_name: profileForm.full_name.trim(),
        company: profileForm.company.trim(),
        job_title: profileForm.job_title.trim(),
        phone: cleanPhone,
        timezone: profileForm.timezone.trim(),
      });
      localStorage.setItem(profileStorageKey(user.id), "true");
      onProfileUpdated?.(updatedUser);
      save();
    } catch (err) {
      setProfileError(err?.message || "Could not save profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const currentMemberName = profileForm.full_name || user?.email?.split("@")[0] || "You";
  const currentMemberEmail = profileForm.email || user?.email || user?.phone || "Signed-in user";

  const TABS = [
    { id: "profile", label: "Profile & Team" },
    { id: "integrations", label: "Integrations" },
    { id: "security", label: "Security & Roles" },
    { id: "notifications", label: "Notifications" },
    { id: "billing", label: "Billing" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
      <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 12, height: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, marginBottom: 3, background: tab === t.id ? `${C.accent}18` : "transparent", border: `1px solid ${tab === t.id ? C.accent + "44" : "transparent"}`, color: tab === t.id ? C.accent : C.muted, fontSize: 13, cursor: "pointer", fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "profile" && (
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>Profile & Team Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                ["full_name", "Full Name", "name", false],
                ["email", "Email", "email", true],
                ["company", "Company", "organization", false],
                ["job_title", "Job Title (optional)", "organization-title", false],
                ["phone", "Phone (optional)", "tel", false],
                ["timezone", "Timezone", "off", false],
              ].map(([field, label, autoComplete, readOnly]) => (
                <label key={field}>
                  <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px", display: "block" }}>{label}</span>
                  <input
                    value={profileForm[field]}
                    onChange={e => setProfileField(field, field === "phone" ? e.target.value.replace(/[^\d+ -]/g, "") : e.target.value)}
                    readOnly={readOnly}
                    autoComplete={autoComplete}
                    style={{ width: "100%", background: readOnly ? "#ffffff04" : "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: readOnly ? C.muted : C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </label>
              ))}
            </div>
            {profileForm.phone.trim() && (
              <div style={{ display: "grid", gridTemplateColumns: settingsPhoneOtpSent ? "minmax(0, 1fr) auto auto" : "minmax(0, 1fr) auto", gap: 10, alignItems: "center", margin: "-4px 0 18px" }}>
                <p style={{ color: settingsPhoneVerified ? C.success : C.muted, fontSize: 12, margin: 0 }}>
                  {settingsPhoneVerified ? "Phone verified" : "Verify this phone number before saving."}
                </p>
                {settingsPhoneOtpSent && (
                  <input aria-label="Phone verification OTP" inputMode="numeric" value={settingsPhoneOtp} onChange={e => setSettingsPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="OTP" style={{ width: 120, background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", textAlign: "center" }} />
                )}
                {!settingsPhoneVerified && (
                  <button type="button" onClick={settingsPhoneOtpSent ? confirmSettingsPhoneOtp : requestSettingsPhoneOtp} disabled={settingsPhoneBusy} style={{ background: `${C.accent}22`, border: `1px solid ${C.accent}44`, color: C.accent, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: settingsPhoneBusy ? "wait" : "pointer" }}>
                    {settingsPhoneBusy ? "Wait..." : settingsPhoneOtpSent ? "Verify OTP" : "Send OTP"}
                  </button>
                )}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>AI Model</p>
              <select style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, width: "100%", outline: "none" }}>
                <option>Claude Sonnet 4.6 (Recommended)</option>
                <option>Claude Opus 4.6 (Most Capable)</option>
                <option>Claude Haiku 4.5 (Fastest)</option>
              </select>
            </div>
            {profileError && <p role="alert" style={{ color: C.danger, background: "#FF5C5C12", border: "1px solid #FF5C5C33", padding: "10px 12px", borderRadius: 8, fontSize: 12, margin: "0 0 14px" }}>{profileError}</p>}
            <button onClick={saveProfile} disabled={savingProfile} style={{ background: saved ? C.success : savingProfile ? C.muted : C.accent, color: "#000", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: savingProfile ? "wait" : "pointer", transition: "background 0.3s" }}>
              {savingProfile ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <h4 style={{ color: "#fff", margin: 0, fontSize: 14 }}>Team Members</h4>
                <button onClick={save} style={{ background: `${C.purple}22`, border: `1px solid ${C.purple}44`, color: C.purple, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Invite Member</button>
              </div>
              {[
                { name: currentMemberName, email: currentMemberEmail, role: "Admin", status: "Active" },
                { name: "Priyanka Mehta", email: "priyanka@visionretain.ai", role: "Analyst", status: "Active" },
                { name: "Rohit Das", email: "rohit@visionretain.ai", role: "Manager", status: "Active" },
                { name: "Neha Verma", email: "neha@visionretain.ai", role: "Business Owner", status: "Pending" },
              ].map(m => (
                <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}33, ${C.purple}33)`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {m.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, margin: 0, fontSize: 13, fontWeight: 500 }}>{m.name}</p>
                    <p style={{ color: C.muted, margin: 0, fontSize: 11 }}>{m.email}</p>
                  </div>
                  <span style={{ background: "#ffffff08", color: C.muted, fontSize: 11, padding: "3px 10px", borderRadius: 8 }}>{m.role}</span>
                  <span style={{ color: m.status === "Active" ? C.success : C.warning, fontSize: 11, fontWeight: 600 }}>● {m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "integrations" && (
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 6px", fontSize: 16 }}>Integrations & API</h3>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 22px" }}>Connect VisionRetain AI to your existing tools and data sources.</p>
            <div style={{ background: "#ffffff06", borderRadius: 12, padding: 18, marginBottom: 20, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <p style={{ color: "#fff", fontWeight: 600, margin: "0 0 3px", fontSize: 14 }}>API Key</p>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Authenticate REST API requests to VisionRetain</p>
                </div>
                <span style={{ background: `${C.success}22`, color: C.success, fontSize: 10, padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "#000000AA", borderRadius: 8, padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: C.accent, border: `1px solid ${C.border}` }}>
                  {apiKeyVisible ? "vr_live_sk_7f8a2b3c9d4e5f6a7b8c9d0e1f2a3b4c" : "vr_live_sk_••••••••••••••••••••••••••••••"}
                </div>
                <button onClick={() => setApiKeyVisible(v => !v)} style={{ background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 12, cursor: "pointer" }}>{apiKeyVisible ? "Hide" : "Show"}</button>
                <button onClick={() => { navigator.clipboard?.writeText("vr_live_sk_7f8a2b3c9d4e5f6a7b8c9d0e1f2a3b4c"); save(); }} style={{ background: `${C.accent}22`, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "9px 14px", color: C.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Copy</button>
                <button onClick={save} style={{ background: `${C.danger}22`, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "9px 14px", color: C.danger, fontSize: 12, cursor: "pointer" }}>Rotate</button>
              </div>
            </div>
            {[
              { name: "Amazon Seller Central", desc: "Sync product prices and sales data", icon: "📦", connected: true },
              { name: "Flipkart Partner API", desc: "Track product listings and inventory", icon: "🛒", connected: true },
              { name: "Google Analytics 4", desc: "Import web traffic and conversion data", icon: "📊", connected: false },
              { name: "Slack", desc: "Send churn alerts and reports to channels", icon: "💬", connected: true },
              { name: "Salesforce CRM", desc: "Sync customer segments and churn scores", icon: "☁️", connected: false },
              { name: "MongoDB Atlas", desc: "Primary database connection", icon: "🍃", connected: true },
              { name: "Redis Cache", desc: "Session and API response caching", icon: "⚡", connected: true },
              { name: "AWS S3", desc: "Product image storage for scans", icon: "🗄️", connected: false },
            ].map(intg => (
              <div key={intg.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{intg.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.text, margin: "0 0 2px", fontWeight: 500, fontSize: 13 }}>{intg.name}</p>
                  <p style={{ color: C.muted, margin: 0, fontSize: 11 }}>{intg.desc}</p>
                </div>
                {intg.connected ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.success, fontSize: 11, fontWeight: 600 }}>● Connected</span>
                    <button onClick={save} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "3px 9px", fontSize: 10, cursor: "pointer" }}>Configure</button>
                  </div>
                ) : (
                  <button onClick={save} style={{ background: `${C.accent}22`, border: `1px solid ${C.accent}44`, color: C.accent, borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Connect</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "security" && (
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>Security & Access Control</h3>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Role-Based Access Control</p>
            {[
              { role: "Admin", perms: ["Full access","Manage team","Billing","API keys","Delete data"], color: C.danger },
              { role: "Business Owner", perms: ["View all modules","Export reports","Manage customers"], color: C.purple },
              { role: "Analyst", perms: ["View analytics","Run predictions","AI Copilot","Export data"], color: C.accent },
              { role: "Manager", perms: ["View customers","View churn","View demand","Basic reports"], color: C.success },
            ].map(r => (
              <div key={r.role} style={{ background: "#ffffff05", borderRadius: 10, padding: 16, marginBottom: 10, border: `1px solid ${r.color}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: r.color, fontWeight: 700, fontSize: 13 }}>{r.role}</span>
                  <button onClick={save} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "3px 9px", fontSize: 10, cursor: "pointer" }}>Edit Permissions</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.perms.map(p => <span key={p} style={{ background: `${r.color}14`, color: r.color, fontSize: 10, padding: "2px 8px", borderRadius: 8 }}>✓ {p}</span>)}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Security Settings</p>
              {[
                ["Two-Factor Authentication", "Require 2FA for all team members", true],
                ["Session Timeout", "Auto-logout after 30 minutes of inactivity", true],
                ["IP Allowlist", "Restrict access to specific IP ranges", false],
                ["Audit Logs", "Track all user actions and API calls", true],
                ["API Rate Limiting", "Max 1000 requests/minute per key", true],
              ].map(([name, desc, enabled]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <p style={{ color: C.text, margin: "0 0 2px", fontSize: 13, fontWeight: 500 }}>{name}</p>
                    <p style={{ color: C.muted, margin: 0, fontSize: 11 }}>{desc}</p>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? C.success : "#ffffff14", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: enabled ? 23 : 3, transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>Notification Preferences</h3>
            {[
              { cat: "Churn Alerts", items: [["Critical churn risk detected (>80%)", true],["High churn risk (60–80%)", true],["Weekly churn summary", true]] },
              { cat: "Price Intelligence", items: [["Price drop on tracked products", true],["Price drop exceeds 10%", true],["New competitor pricing", false]] },
              { cat: "Revenue", items: [["Monthly revenue report ready", true],["Revenue at risk increases 10%+", true],["Enterprise customer churned", true]] },
              { cat: "System", items: [["AI predictions completed", false],["API rate limit warning", true],["New team member joined", true]] },
            ].map(section => (
              <div key={section.cat} style={{ marginBottom: 20 }}>
                <p style={{ color: C.accent, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", fontWeight: 600 }}>{section.cat}</p>
                {section.items.map(([name, on]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.text, fontSize: 13 }}>{name}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["Email","Slack","Push"].map(ch => (
                        <label key={ch} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${on ? C.accent : C.border}`, background: on ? `${C.accent}33` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {on && <span style={{ color: C.accent, fontSize: 9 }}>✓</span>}
                          </div>
                          <span style={{ color: C.muted, fontSize: 10 }}>{ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={save} style={{ background: saved ? C.success : C.accent, color: "#000", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {saved ? "✓ Saved!" : "Save Preferences"}
            </button>
          </div>
        )}

        {tab === "billing" && (
          <EmptyState
            title="Live billing is not connected"
            message="Static plan, price, and usage counters have been removed. Connect Stripe, Razorpay, or your billing table to show live subscription data."
          />
        )}
      </div>
    </div>
  );
}

function AuthScreen() {
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const friendlyAuthError = (err, fallback) => {
    const raw = err?.message || fallback;
    if (raw.toLowerCase().includes("unsupported phone provider")) {
      return "Phone OTP is not enabled in Supabase yet. Enable the Phone provider and configure an SMS provider such as Twilio, MessageBird, Vonage, or TextLocal.";
    }
    if (raw.toLowerCase().includes("invalid login credentials")) {
      return "Incorrect email or password. Check your details or create a new account.";
    }
    if (raw.toLowerCase().includes("email not confirmed")) {
      return "This email account still needs confirmation in Supabase. Use Google sign-in for new accounts, or disable email confirmations in Supabase.";
    }
    return raw;
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(friendlyAuthError(err, "Authentication failed"));
    } finally {
      setBusy(false);
    }
  };

  const submitGoogle = async () => {
    resetFeedback();
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err, "Google sign-in failed"));
      setBusy(false);
    }
  };

  const submitPhone = async (event) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      if (!otpSent) {
        await signInWithPhoneOtp(phone);
        setOtpSent(true);
        setMessage(`OTP sent to ${phone}`);
      } else {
        await verifyPhoneOtp(otp, phone);
      }
    } catch (err) {
      setError(friendlyAuthError(err, "OTP authentication failed"));
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff08",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "12px 14px",
    color: C.text,
    fontSize: 14,
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, ${C.purple}22, transparent 35%), radial-gradient(circle at 80% 80%, ${C.accent}18, transparent 35%), ${C.bg}`, display: "grid", placeItems: "center", padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, margin: "0 auto 12px", borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "grid", placeItems: "center", color: "#020617", fontWeight: 900, fontSize: 24 }}>V</div>
          <h1 style={{ color: "#fff", fontSize: 24, margin: "0 0 7px" }}>VisionRetain AI</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Authenticate to access your dashboard</p>
        </div>

        <div style={{ background: `${C.bgCard}F2`, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 5, borderRadius: 11, background: "#ffffff08", marginBottom: 22 }}>
            {[["password", "Email & Password"], ["otp", "Phone OTP"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setMethod(id); resetFeedback(); }} style={{ border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", background: method === id ? C.accent : "transparent", color: method === id ? "#001018" : C.muted, fontSize: 12, fontWeight: 700 }}>
                {label}
              </button>
            ))}
          </div>

          {method === "password" ? (
            <form onSubmit={submitPassword}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px" }}>Welcome back</h2>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Sign in using your account password</p>
                </div>
              </div>
              <input aria-label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" required style={{ ...inputStyle, marginBottom: 12 }} />
              <input aria-label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" minLength={6} required style={{ ...inputStyle, marginBottom: 14 }} />
              <button disabled={busy} type="submit" style={{ width: "100%", border: "none", borderRadius: 10, padding: 12, background: busy ? C.muted : C.accent, color: "#001018", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Please wait..." : "Sign in"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
                <span style={{ height: 1, background: C.border, flex: 1 }} />
                <span style={{ color: C.muted, fontSize: 11 }}>NEW ACCOUNT</span>
                <span style={{ height: 1, background: C.border, flex: 1 }} />
              </div>
              <button disabled={busy} type="button" onClick={submitGoogle} style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, background: "#fff", color: "#111827", fontWeight: 800, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", display: "inline-grid", placeItems: "center", color: "#4285F4", fontWeight: 900 }}>G</span>
                Sign in with Google
              </button>
            </form>
          ) : (
            <form onSubmit={submitPhone}>
              <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px" }}>{otpSent ? "Enter verification code" : "Sign in with phone"}</h2>
              <p style={{ color: C.muted, fontSize: 12, margin: "0 0 18px" }}>{otpSent ? `Enter the code sent to ${phone}` : "Use an E.164 number, for example +919876543210"}</p>
              <input aria-label="Phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ""))} placeholder="+919876543210" autoComplete="tel" disabled={otpSent} required style={{ ...inputStyle, marginBottom: 12 }} />
              {otpSent && (
                <input aria-label="OTP code" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Enter OTP" autoComplete="one-time-code" required style={{ ...inputStyle, marginBottom: 12, letterSpacing: "0.25em", textAlign: "center" }} />
              )}
              <button disabled={busy} type="submit" style={{ width: "100%", border: "none", borderRadius: 10, padding: 12, background: busy ? C.muted : C.accent, color: "#001018", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Please wait…" : otpSent ? "Verify OTP" : "Send OTP"}
              </button>
              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setOtp(""); resetFeedback(); }} style={{ width: "100%", border: "none", background: "transparent", color: C.accent, padding: "12px 0 0", cursor: "pointer", fontSize: 12 }}>Change phone number</button>
              )}
            </form>
          )}

          {error && <p role="alert" style={{ color: C.danger, background: "#FF5C5C12", border: "1px solid #FF5C5C33", padding: "10px 12px", borderRadius: 8, fontSize: 12, margin: "16px 0 0" }}>{error}</p>}
          {message && <p style={{ color: C.success, background: "#00FF8810", border: "1px solid #00FF8833", padding: "10px 12px", borderRadius: 8, fontSize: 12, margin: "16px 0 0" }}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

function ProfileSetupScreen({ user, onComplete, onSignOut }) {
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
    company: user?.user_metadata?.company || "",
    job_title: user?.user_metadata?.job_title || "",
    phone: user?.phone || user?.user_metadata?.phone || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  });
  const [busy, setBusy] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(() => Boolean(user?.phone));
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%",
    background: "#ffffff08",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "12px 14px",
    color: C.text,
    fontSize: 14,
    outline: "none",
  };

  const setField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (key === "phone") {
      setPhoneVerified(Boolean(user?.phone && value.trim() === user.phone));
      setPhoneOtpSent(false);
      setPhoneOtp("");
    }
  };

  const requestPhoneOtp = async () => {
    const cleanPhone = form.phone.replace(/\s/g, "");
    setError("");
    if (!PHONE_E164.test(cleanPhone)) {
      setError("Enter phone in international format, for example +919876543210.");
      return;
    }
    setPhoneBusy(true);
    try {
      await sendPhoneChangeOtp(cleanPhone);
      setForm(current => ({ ...current, phone: cleanPhone }));
      setPhoneOtpSent(true);
    } catch (err) {
      setError(err?.message || "Could not send phone verification OTP.");
    } finally {
      setPhoneBusy(false);
    }
  };

  const confirmPhoneOtp = async () => {
    const cleanPhone = form.phone.replace(/\s/g, "");
    setError("");
    setPhoneBusy(true);
    try {
      await verifyPhoneChangeOtp(cleanPhone, phoneOtp);
      setPhoneVerified(true);
      setPhoneOtpSent(false);
      setPhoneOtp("");
    } catch (err) {
      setError(err?.message || "Invalid phone verification code.");
    } finally {
      setPhoneBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const cleanProfile = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()])
      );
      if (cleanProfile.phone) {
        cleanProfile.phone = cleanProfile.phone.replace(/\s/g, "");
        if (!PHONE_E164.test(cleanProfile.phone)) {
          throw new Error("Enter phone in international format, for example +919876543210.");
        }
        if (!phoneVerified) {
          throw new Error("Verify your phone number with OTP, or leave phone blank.");
        }
      }
      const updatedUser = await updateUserProfile(cleanProfile);
      localStorage.setItem(profileStorageKey(user.id), "true");
      onComplete(updatedUser);
    } catch (err) {
      setError(err?.message || "Profile could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 560, background: `${C.bgCard}F2`, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
        <div style={{ marginBottom: 22 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Profile Setup</p>
          <h1 style={{ color: "#fff", fontSize: 24, margin: "0 0 8px" }}>Tell us about you</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Complete these details before entering the dashboard.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Full Name</span>
            <input value={form.full_name} onChange={e => setField("full_name", e.target.value)} required autoComplete="name" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Company</span>
            <input value={form.company} onChange={e => setField("company", e.target.value)} required autoComplete="organization" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Job Title <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></span>
            <input value={form.job_title} onChange={e => setField("job_title", e.target.value)} autoComplete="organization-title" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Phone <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></span>
            <input value={form.phone} onChange={e => setField("phone", e.target.value.replace(/[^\d+ -]/g, ""))} placeholder="+919876543210" autoComplete="tel" style={inputStyle} />
          </label>
          {form.phone.trim() && (
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: phoneOtpSent ? "minmax(0, 1fr) auto auto" : "minmax(0, 1fr) auto", gap: 10, alignItems: "end" }}>
              <p style={{ color: phoneVerified ? C.success : C.muted, fontSize: 12, margin: 0 }}>
                {phoneVerified ? "Phone verified" : "Verify this phone number before continuing."}
              </p>
              {phoneOtpSent && (
                <input aria-label="Phone verification OTP" inputMode="numeric" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="OTP" style={{ ...inputStyle, maxWidth: 130, textAlign: "center" }} />
              )}
              {!phoneVerified && (
                <button type="button" onClick={phoneOtpSent ? confirmPhoneOtp : requestPhoneOtp} disabled={phoneBusy} style={{ background: `${C.accent}22`, border: `1px solid ${C.accent}44`, color: C.accent, borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: phoneBusy ? "wait" : "pointer" }}>
                  {phoneBusy ? "Wait..." : phoneOtpSent ? "Verify OTP" : "Send OTP"}
                </button>
              )}
            </div>
          )}
          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Timezone</span>
            <input value={form.timezone} onChange={e => setField("timezone", e.target.value)} required style={inputStyle} />
          </label>
        </div>
        {error && <p role="alert" style={{ color: C.danger, background: "#FF5C5C12", border: "1px solid #FF5C5C33", padding: "10px 12px", borderRadius: 8, fontSize: 12, margin: "16px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
          <button type="button" onClick={onSignOut} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 18px", color: C.muted, cursor: "pointer" }}>Sign out</button>
          <button disabled={busy} type="submit" style={{ background: busy ? C.muted : C.accent, color: "#001018", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Saving..." : "Continue to dashboard"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VisionRetainAI() {
  const [section, setSection] = useState("overview");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const compact = useIsCompactScreen();
  const [customers, setCustomers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [dashboardError, setDashboardError] = useState("");
  const notifications = [];
  const [showNotif, setShowNotif] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    backend: false,
    vision: false,
    prices: false,
    supabase: false,
  });
  const authUser = session?.user;
  const userName = authUser?.user_metadata?.full_name
    || authUser?.email?.split("@")[0]
    || authUser?.phone
    || "User";
  const userInitials = userName
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let mounted = true;
    let subscription;
    getSession()
      .then(currentSession => {
        if (mounted) {
          setSession(currentSession);
          setProfileComplete(isProfileComplete(currentSession?.user));
        }
      })
      .catch(() => {
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    try {
      const result = onAuthStateChange(nextSession => {
        if (mounted) {
          setSession(nextSession);
          setProfileComplete(isProfileComplete(nextSession?.user));
          setAuthLoading(false);
          if (nextSession) setSection("overview");
        }
      });
      subscription = result.data.subscription;
    } catch {
      setAuthLoading(false);
    }
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    fetch(apiEndpoint("/api/v1/dashboard"), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(readApiResponse)
      .then(data => {
        if (!active) return;
        setDashboardError("");
        const liveCustomers = (data.customers || []).map(customer => ({
          ...customer,
          spend: Number(customer.spend || 0),
          churn: Number(customer.churn || 0),
          ltv: Number(customer.ltv || 0),
          nps: Number(customer.nps || 0),
          tenure: Number(customer.tenure || 0),
          lastActive: customer.last_active,
        }));
        setCustomers(liveCustomers);
        if (data.metrics?.length) {
          setKpis(data.metrics.map(metric => ({
            label: metric.label,
            value: Number(metric.value),
            delta: metric.delta,
            color: metric.color,
            icon: metric.icon,
            format: metric.format,
          })));
        } else {
          setKpis(deriveMetrics(liveCustomers));
        }
      })
      .catch(err => {
        if (!active) return;
        setCustomers([]);
        setKpis([]);
        setDashboardError(err?.message || "Could not load live dashboard data.");
      });
    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(healthEndpoint);
        const data = await readApiResponse(response);
        if (active) {
          setSystemHealth({
            backend: true,
            vision: Boolean(data.product_lens?.vision_configured),
            prices: Boolean(data.product_lens?.live_prices_configured),
            supabase: Boolean(data.product_lens?.supabase_configured),
          });
        }
      } catch {
        if (active) {
          setSystemHealth({ backend: false, vision: false, prices: false, supabase: false });
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const allSystemsLive = systemHealth.backend && systemHealth.vision && systemHealth.prices && systemHealth.supabase;
  const liveKpis = kpis.length ? kpis : deriveMetrics(customers);
  const liveRiskDistribution = riskDistribution(customers);
  const highRiskCustomers = customers.filter(c => c.risk === "Critical" || c.risk === "High");

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setSession(null);
      setProfileComplete(false);
      setSection("overview");
    }
  };

  const handleProfileUpdated = (updatedUser) => {
    setSession(current => current
      ? { ...current, user: { ...current.user, ...updatedUser } }
      : current
    );
    setProfileComplete(true);
  };

  const sectionTitles = {
    overview: "Command Center", "product-lens": "Product Lens AI", price: "Price Intelligence",
    customers: "Customer Management", churn: "Churn Analytics", demand: "Demand Forecasting",
    sentiment: "Sentiment Analysis", revenue: "Revenue Intelligence",
    copilot: "AI Business Copilot", reports: "Reports", settings: "Settings & Configuration"
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", color: C.accent, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 42, height: 42, border: `3px solid ${C.accent}33`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
          <span style={{ fontSize: 13 }}>Checking your session…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  if (!profileComplete) {
    return (
      <ProfileSetupScreen
        user={authUser}
        onComplete={handleProfileUpdated}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: compact ? "column" : "row", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { to { opacity: 0.3; transform: scale(0.8); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: compact ? "100%" : 220, background: C.bgSec, borderRight: compact ? "none" : `1px solid ${C.border}`, borderBottom: compact ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: compact ? "row" : "column", flexShrink: 0, position: "sticky", top: 0, height: compact ? "auto" : "100vh", maxHeight: compact ? "46vh" : "100vh", overflowY: compact ? "hidden" : "auto", overflowX: compact ? "auto" : "hidden", zIndex: 20 }}>
        <div style={{ padding: compact ? "12px 14px" : "18px 16px", borderBottom: compact ? "none" : `1px solid ${C.border}`, borderRight: compact ? `1px solid ${C.border}` : "none", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 14 }}>V</div>
            <div>
              <p style={{ color: "#fff", margin: 0, fontSize: 13, fontWeight: 800 }}>VisionRetain</p>
              <p style={{ color: C.muted, margin: 0, fontSize: 10 }}>AI Platform v2.0</p>
            </div>
          </div>
        </div>
        <nav style={{ padding: "10px 10px", flex: 1, display: compact ? "flex" : "block", gap: compact ? 6 : 0, minWidth: compact ? "max-content" : 0 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} style={{ width: compact ? "auto" : "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: compact ? 0 : 2, cursor: "pointer", background: section === item.id ? `${C.accent}18` : "transparent", border: `1px solid ${section === item.id ? C.accent + "44" : "transparent"}`, color: section === item.id ? C.accent : C.muted, fontSize: 13, fontWeight: section === item.id ? 600 : 400, textAlign: "left", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: compact ? "none" : `1px solid ${C.border}`, borderLeft: compact ? `1px solid ${C.border}` : "none", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{userInitials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.text, margin: 0, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
              <p style={{ color: C.muted, margin: 0, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" }}>{authUser?.email || authUser?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ minHeight: 56, background: C.bgSec, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: compact ? "flex-start" : "center", justifyContent: "space-between", padding: compact ? "12px 14px" : "0 24px", flexShrink: 0, gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>{sectionTitles[section] || section}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div title={`Backend: ${systemHealth.backend ? "online" : "offline"} · Vision: ${systemHealth.vision ? "configured" : "missing key"} · Prices: ${systemHealth.prices ? "configured" : "missing key"} · Supabase: ${systemHealth.supabase ? "configured" : "offline"}`} style={{ background: allSystemsLive ? "#00FF8814" : "#FFC85714", border: `1px solid ${allSystemsLive ? C.success : C.warning}33`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: allSystemsLive ? C.success : C.warning, display: "inline-block" }} />
              <span style={{ color: allSystemsLive ? C.success : C.warning, fontSize: 11, fontWeight: 600 }}>
                {allSystemsLive ? "All Systems Live" : systemHealth.backend ? "Setup Required" : "Backend Offline"}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotif(!showNotif)} style={{ background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: C.text, fontSize: 14 }}>🔔</button>
              {notifications.length > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 15, height: 15, borderRadius: "50%", background: C.danger, fontSize: 8, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{notifications.length}</span>}
              {showNotif && (
                <div style={{ position: "absolute", top: 42, right: 0, width: 300, background: C.bgSec, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  {notifications.length === 0 && <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>No live notifications.</p>}
                  {notifications.map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px", borderRadius: 8, marginBottom: 4, background: "#ffffff04" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: n.type === "danger" ? C.danger : n.type === "warning" ? C.warning : C.success }} />
                      <span style={{ color: C.text, fontSize: 12 }}>{n.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleSignOut} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.muted, fontSize: 12, cursor: "pointer" }}>Sign out</button>
          </div>
        </div>

        {dashboardError && (
          <div style={{ background: "#FF5C5C12", borderBottom: `1px solid ${C.danger}33`, color: C.danger, padding: compact ? "8px 14px" : "8px 24px", fontSize: 12 }}>
            {dashboardError}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: compact ? 14 : 24, minWidth: 0 }}>

          {section === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
                {liveKpis.map((k, i) => <KPICard key={i} {...k} active={true} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }}>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Data Status</p>
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>{customers.length.toLocaleString()} live customer rows</p>
                  <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>Charts and forecasts are shown only when matching live time-series endpoints are connected.</p>
                </div>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Risk Distribution</p>
                  {liveRiskDistribution.map(r => (
                    <div key={r.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: C.text, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                          {r.label}
                        </span>
                        <span style={{ color: C.muted, fontSize: 12 }}>{r.count.toLocaleString()} customers</span>
                      </div>
                      <div style={{ background: "#ffffff08", borderRadius: 4, height: 7, overflow: "hidden" }}>
                        <div style={{ width: `${r.pct}%`, height: "100%", background: r.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: "auto" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>High-Risk Customers</p>
                  <button onClick={() => setSection("customers")} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12, cursor: "pointer" }}>View all →</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>
                    {highRiskCustomers.slice(0, 4).map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.danger}44, ${C.warning}44)`, display: "flex", alignItems: "center", justifyContent: "center", color: C.danger, fontSize: 10, fontWeight: 700 }}>
                              {c.name.split(" ").map(w => w[0]).join("")}
                            </div>
                            <span style={{ color: C.text, fontWeight: 500 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 20px", color: C.muted }}>{c.plan}</td>
                        <td style={{ padding: "10px 20px", color: C.text }}>₹{c.spend.toLocaleString()}</td>
                        <td style={{ padding: "10px 20px" }}><RiskBadge level={c.risk} /></td>
                        <td style={{ padding: "10px 20px" }}>
                          <button onClick={() => setSection("churn")} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.accent, borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Analyze</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {highRiskCustomers.length === 0 && (
                  <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>No high-risk customers in the live database.</div>
                )}
              </div>
            </div>
          )}

          {section === "product-lens" && <ProductLensModule />}
          {section === "customers" && <CustomersModule customers={customers} />}
          {section === "churn" && <ChurnModule customers={customers} />}
          {section === "sentiment" && <SentimentModule />}
          {section === "revenue" && <RevenueModule customers={customers} />}
          {section === "copilot" && <CopilotModule />}
          {section === "reports" && <ReportsModule />}

          {section === "demand" && (
            <EmptyState
              title="No live demand forecast connected"
              message="Demand forecasting requires real sales/order time-series data. Static forecast cards and charts have been removed."
            />
          )}

          {section === "price" && (
            <div>
              <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
                <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Scan a Product to Compare Prices
                </p>
                <ProductLensModule />
              </div>
            </div>
          )}

          {section === "settings" && <SettingsModule user={authUser} onProfileUpdated={handleProfileUpdated} />}
        </div>
      </div>
    </div>
  );
}
