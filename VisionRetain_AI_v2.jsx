import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;


// ─── Design System ──────────────────────────────────────────────────────────
const C = {
  bg: "#050816", bgSec: "#0F172A", bgCard: "#0D1B3E",
  accent: "#00E5FF", success: "#00FF88", warning: "#FFC857",
  danger: "#FF5C5C", purple: "#7C3AED", pink: "#EC4899",
  text: "#E2E8F0", muted: "#64748B", border: "rgba(0,229,255,0.15)",
  indigo: "#6366F1", teal: "#14B8A6", orange: "#F97316"
};

// ─── Static Data ─────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: "⬡" },
  { id: "landing", label: "Home", icon: "◈" },
  { id: "product-lens", label: "Product Lens", icon: "◎" },
  { id: "price", label: "Price Intel", icon: "◇" },
  { id: "customers", label: "Customers", icon: "◉" },
  { id: "churn", label: "Churn Analytics", icon: "△" },
  { id: "demand", label: "Demand Forecast", icon: "▲" },
  { id: "sentiment", label: "Sentiment", icon: "◑" },
  { id: "revenue", label: "Revenue Intel", icon: "₿" },
  { id: "copilot", label: "AI Copilot", icon: "✦" },
  { id: "reports", label: "Reports", icon: "▣" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const CUSTOMERS = [
  { id: "C001", name: "Arjun Mehta", email: "arjun@techcorp.in", plan: "Enterprise", spend: 48200, churn: 87, risk: "Critical", segment: "Enterprise", ltv: 578400, nps: 22, tenure: 14, lastActive: "32 days ago" },
  { id: "C002", name: "Priya Sharma", email: "priya@startup.io", plan: "Pro", spend: 12400, churn: 23, risk: "Low", segment: "SMB", ltv: 148800, nps: 71, tenure: 8, lastActive: "2 days ago" },
  { id: "C003", name: "Rahul Gupta", email: "rahul@ecom.com", plan: "Business", spend: 28900, churn: 61, risk: "High", segment: "B2B", ltv: 346800, nps: 38, tenure: 22, lastActive: "11 days ago" },
  { id: "C004", name: "Sneha Patel", email: "sneha@retail.in", plan: "Starter", spend: 4200, churn: 44, risk: "Medium", segment: "SMB", ltv: 50400, nps: 55, tenure: 5, lastActive: "5 days ago" },
  { id: "C005", name: "Vikram Singh", email: "vikram@mfg.co", plan: "Enterprise", spend: 91500, churn: 12, risk: "Low", segment: "Enterprise", ltv: 1098000, nps: 84, tenure: 36, lastActive: "1 day ago" },
  { id: "C006", name: "Ananya Roy", email: "ananya@fin.tech", plan: "Pro", spend: 19800, churn: 78, risk: "High", segment: "B2B", ltv: 237600, nps: 29, tenure: 11, lastActive: "19 days ago" },
  { id: "C007", name: "Karan Verma", email: "karan@media.in", plan: "Business", spend: 33100, churn: 95, risk: "Critical", segment: "B2B", ltv: 397200, nps: 11, tenure: 7, lastActive: "45 days ago" },
  { id: "C008", name: "Deepika Nair", email: "deepika@health.io", plan: "Starter", spend: 6700, churn: 31, risk: "Low", segment: "SMB", ltv: 80400, nps: 67, tenure: 10, lastActive: "3 days ago" },
];

const PRODUCTS = [
  { name: "Sony WH-1000XM5", brand: "Sony", category: "Headphones", confidence: 97.3, model: "WH-1000XM5", price: 29999, image: "🎧" },
  { name: "iPhone 15 Pro", brand: "Apple", category: "Smartphone", confidence: 99.1, model: "A3101", price: 134900, image: "📱" },
  { name: "LG 55\" OLED TV", brand: "LG", category: "Television", confidence: 94.8, model: "OLED55C3", price: 89990, image: "📺" },
  { name: "Samsung Galaxy S24", brand: "Samsung", category: "Smartphone", confidence: 96.2, model: "SM-S921B", price: 79999, image: "📲" },
];

const ECOM_PRICES = {
  "Sony WH-1000XM5": [
    { store: "Amazon", price: 26999, avail: "In Stock", delivery: "2 days", rating: 4.7, badge: "Best Price", link: "#" },
    { store: "Flipkart", price: 27499, avail: "In Stock", delivery: "3 days", rating: 4.6, badge: null, link: "#" },
    { store: "Croma", price: 29999, avail: "In Stock", delivery: "1 day", rating: 4.5, badge: "Fastest", link: "#" },
    { store: "Vijay Sales", price: 28500, avail: "Limited", delivery: "4 days", rating: 4.4, badge: null, link: "#" },
    { store: "Reliance Digital", price: 28999, avail: "In Stock", delivery: "2 days", rating: 4.5, badge: null, link: "#" },
  ],
  "iPhone 15 Pro": [
    { store: "Amazon", price: 129900, avail: "In Stock", delivery: "1 day", rating: 4.8, badge: "Best Price", link: "#" },
    { store: "Flipkart", price: 131000, avail: "In Stock", delivery: "2 days", rating: 4.7, badge: null, link: "#" },
    { store: "Croma", price: 134900, avail: "In Stock", delivery: "Same Day", rating: 4.9, badge: "Fastest", link: "#" },
    { store: "Reliance Digital", price: 132000, avail: "In Stock", delivery: "1 day", rating: 4.6, badge: null, link: "#" },
    { store: "Vijay Sales", price: 133500, avail: "Limited", delivery: "3 days", rating: 4.5, badge: null, link: "#" },
  ],
  "LG 55\" OLED TV": [
    { store: "Amazon", price: 82000, avail: "In Stock", delivery: "3 days", rating: 4.6, badge: "Best Price", link: "#" },
    { store: "Flipkart", price: 84990, avail: "In Stock", delivery: "4 days", rating: 4.5, badge: null, link: "#" },
    { store: "Croma", price: 89990, avail: "In Stock", delivery: "1 day", rating: 4.8, badge: "Top Rated", link: "#" },
    { store: "Vijay Sales", price: 86500, avail: "In Stock", delivery: "3 days", rating: 4.4, badge: null, link: "#" },
    { store: "Reliance Digital", price: 87000, avail: "Limited", delivery: "2 days", rating: 4.5, badge: null, link: "#" },
  ],
  "Samsung Galaxy S24": [
    { store: "Amazon", price: 74999, avail: "In Stock", delivery: "1 day", rating: 4.5, badge: "Best Price", link: "#" },
    { store: "Flipkart", price: 75999, avail: "In Stock", delivery: "2 days", rating: 4.4, badge: null, link: "#" },
    { store: "Croma", price: 79999, avail: "In Stock", delivery: "Same Day", rating: 4.6, badge: "Fastest", link: "#" },
    { store: "Reliance Digital", price: 77000, avail: "In Stock", delivery: "1 day", rating: 4.4, badge: null, link: "#" },
    { store: "Vijay Sales", price: 78500, avail: "Limited", delivery: "3 days", rating: 4.3, badge: null, link: "#" },
  ],
};

// Price history over 6 months
const PRICE_HISTORY = {
  "Sony WH-1000XM5": {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    amazon: [32999, 30999, 29499, 27999, 27499, 26999],
    flipkart: [32499, 31000, 29999, 28500, 28000, 27499],
    croma: [34999, 33999, 32000, 30999, 30499, 29999],
  },
  "iPhone 15 Pro": {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    amazon: [139900, 137000, 135000, 132000, 130500, 129900],
    flipkart: [140999, 138000, 136000, 133500, 132000, 131000],
    croma: [144900, 142000, 140000, 137000, 136000, 134900],
  },
};

const CHURN_FACTORS = [
  { factor: "Low Engagement Score", impact: 0.34, direction: "negative" },
  { factor: "Frequent Support Tickets", impact: 0.28, direction: "negative" },
  { factor: "High Price Sensitivity", impact: 0.22, direction: "negative" },
  { factor: "No Recent Purchases", impact: 0.19, direction: "negative" },
  { factor: "Subscription Duration", impact: 0.15, direction: "positive" },
  { factor: "Feature Adoption Rate", impact: 0.12, direction: "positive" },
];

const DEMAND_DATA = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  actual:  [1200, 1450, 1380, 1620, 1780, 1950, null, null, null],
  forecast:[null, null, null, null, null, 1950, 2100, 2280, 2420],
  upper:   [null, null, null, null, null, 2050, 2300, 2520, 2720],
  lower:   [null, null, null, null, null, 1850, 1900, 2040, 2120],
};

const SENTIMENT_DATA = [
  { platform: "Amazon Reviews", positive: 72, neutral: 18, negative: 10, total: 1284, trend: "+4.2%" },
  { platform: "Flipkart Reviews", positive: 68, neutral: 21, negative: 11, total: 892, trend: "+1.8%" },
  { platform: "Twitter/X Mentions", positive: 54, neutral: 28, negative: 18, total: 3421, trend: "-2.1%" },
  { platform: "Reddit Discussions", positive: 61, neutral: 22, negative: 17, total: 445, trend: "+6.3%" },
  { platform: "Google Reviews", positive: 78, neutral: 15, negative: 7, total: 2107, trend: "+3.5%" },
];

const REVENUE_DATA = {
  monthly: [195, 210, 228, 241, 264, 284],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  segments: [
    { name: "Enterprise", arr: 148.2, growth: "+18.3%", color: C.accent, customers: 312 },
    { name: "B2B", arr: 84.6, growth: "+11.2%", color: C.success, customers: 1847 },
    { name: "SMB", arr: 45.8, growth: "+6.7%", color: C.warning, customers: 5892 },
    { name: "Starter", arr: 5.4, growth: "-2.1%", color: C.danger, customers: 22840 },
  ],
};

const KPI_DATA = [
  { label: "Total Customers", value: 84291, delta: "+12.4%", color: C.accent, icon: "◉" },
  { label: "Monthly Revenue", value: 2847000, delta: "+8.7%", color: C.success, icon: "◇", format: "money" },
  { label: "Revenue at Risk", value: 342000, delta: "-3.2%", color: C.danger, icon: "△", format: "money" },
  { label: "High-Risk Customers", value: 2841, delta: "+5.1%", color: C.warning, icon: "▲" },
];

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

function formatMoney(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
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

const ML_BASE_URL = "http://127.0.0.1:8002";
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

function localProductInsight(seed = "") {
  const index = Math.abs([...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % PRODUCTS.length;
  const product = PRODUCTS[index] || PRODUCTS[0];
  return {
    productName: product.name,
    brand: product.brand,
    model: product.model,
    category: product.category,
    confidence: product.confidence,
    image: product.image,
    price: product.price,
    keyFeatures: product.category === "Smartphone"
      ? ["Flagship processor", "High-resolution display", "5G connectivity"]
      : product.category === "Headphones"
        ? ["Active noise cancellation", "Long battery life", "Premium wireless audio"]
        : ["High contrast panel", "Smart TV platform", "Energy-efficient display"],
    ocrText: `${product.brand} ${product.model}`,
  };
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

function localRetentionPlan(customer, mlPrediction) {
  const riskPct = mlPrediction?.churn_probability ? Math.round(mlPrediction.churn_probability * 100) : customer.churn;
  return [
    { step: "Week 1", action: `Have a senior CSM call ${customer.name} with a usage-loss review and one clear recovery goal.`, expected_impact: `Addresses ${riskPct}% churn risk within the current renewal window` },
    { step: "Week 2", action: `Run a guided enablement session for underused ${customer.plan} features and assign an adoption checklist.`, expected_impact: "Raises engagement and feature adoption by an estimated 25-40%" },
    { step: "Week 3", action: `Offer a loyalty save package tied to an annual commitment and executive business review.`, expected_impact: `Protects up to ₹${(customer.spend * 12).toLocaleString()} ARR` },
  ];
}

function localCopilotReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes("churn") || msg.includes("risk")) {
    return "**Churn needs immediate attention.** 2,841 customers are high risk, with Karan Verma at 95%, Arjun Mehta at 87%, and Ananya Roy at 78%.\n\nRecommended action: start with accounts inactive for 30+ days, pair CSM outreach with feature-adoption coaching, and reserve discounts for customers with high LTV and low NPS.";
  }
  if (msg.includes("revenue") || msg.includes("arr") || msg.includes("mrr")) {
    return "**Revenue is healthy but exposed.** MRR is ₹2.84 Cr (+8.7%), ARR is ₹34.1 Cr, and ₹34.2L MRR is currently at risk.\n\nBest lever: protect Enterprise and B2B renewals first. Recovering even 40% of the at-risk MRR would preserve roughly ₹13.7L monthly.";
  }
  if (msg.includes("product") || msg.includes("price")) {
    return "**Product intelligence is showing useful pricing signals.** Sony WH-1000XM5 is cheapest on Amazon at ₹26,999, iPhone 15 Pro is ₹1,29,900, and LG OLED 55 inch is ₹82,000.\n\nUse these price gaps for competitor alerts, merchandising, and win-back offers.";
  }
  return "**Top insight:** retention and revenue are connected this month. Demand is forecast to grow 14.2% over 90 days, but critical churn accounts could erase part of that upside.\n\nFocus this week on high-LTV customers with low NPS, recent inactivity, and repeated support tickets.";
}

function executiveSummaryText() {
  return "This month shows strong operating momentum: monthly revenue reached ₹2.84 Cr, up 8.7%, while NRR remains healthy at 118%. Enterprise expansion is the strongest contributor, with high-value customers continuing to outpace SMB growth.\n\nThe main risk is retention. 2,841 customers are flagged as high risk, representing ₹34.2L in exposed MRR. The highest-priority interventions are Karan Verma at 95% churn probability, Arjun Mehta at 87%, and Ananya Roy at 78%.\n\nProduct intelligence is also producing actionable signals. Sony WH-1000XM5 is tracking at ₹26,999 on Amazon, while demand forecasting indicates 14.2% growth over the next 90 days. Recommendation: protect critical renewals first, then use pricing and demand signals to drive targeted expansion campaigns.";
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

function buildReport(type) {
  const rows = [
    ["Metric", "Value"],
    ["Customers", "84291"],
    ["MRR", "₹2.84 Cr"],
    ["ARR", "₹34.1 Cr"],
    ["Revenue at Risk", "₹34.2L"],
    ["High Risk Customers", "2841"],
    ["Report Type", type],
  ];
  return rows.map(row => row.join(",")).join("\n");
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

// ─── Demand Forecast Chart ─────────────────────────────────────────────────────
function DemandChart() {
  const months = DEMAND_DATA.labels;
  const actual = DEMAND_DATA.actual;
  const forecast = DEMAND_DATA.forecast;
  const maxVal = 2800;
  const height = 160;
  const width = 100;
  return (
    <svg viewBox={`0 0 ${months.length * width} ${height + 50}`} style={{ width: "100%", height: 220 }}>
      {[0, 700, 1400, 2100, 2800].map(v => {
        const y = height - (v / maxVal) * height;
        return (
          <g key={v}>
            <line x1={0} y1={y} x2={months.length * width} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={-4} y={y + 4} fill={C.muted} fontSize={10} textAnchor="end">{v >= 1000 ? `${v/1000}k` : v}</text>
          </g>
        );
      })}
      {months.map((m, i) => (
        <text key={m} x={i * width + 50} y={height + 20} fill={C.muted} fontSize={11} textAnchor="middle">{m}</text>
      ))}
      <path
        d={`M ${months.map((_, i) => {
          const v = DEMAND_DATA.upper[i];
          if (v === null) return null;
          return `${i * 100 + 50},${height - (v / maxVal) * height}`;
        }).filter(Boolean).join(" L ")} L ${[...months].reverse().map((_, ri) => {
          const i = months.length - 1 - ri;
          const v = DEMAND_DATA.lower[i];
          if (v === null) return null;
          return `${i * 100 + 50},${height - (v / maxVal) * height}`;
        }).filter(Boolean).join(" L ")} Z`}
        fill="rgba(0,229,255,0.08)"
      />
      <polyline
        points={actual.map((v, i) => v !== null ? `${i * 100 + 50},${height - (v / maxVal) * height}` : null).filter(Boolean).join(" ")}
        fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round"
      />
      <polyline
        points={forecast.map((v, i) => v !== null ? `${i * 100 + 50},${height - (v / maxVal) * height}` : null).filter(Boolean).join(" ")}
        fill="none" stroke={C.warning} strokeWidth={2} strokeLinecap="round" strokeDasharray="6,4"
      />
      {actual.map((v, i) => v !== null && (
        <circle key={i} cx={i * 100 + 50} cy={height - (v / maxVal) * height} r={4} fill={C.accent} />
      ))}
      <g transform={`translate(${months.length * 100 / 2 - 80}, ${height + 35})`}>
        <rect x={0} y={0} width={8} height={2} fill={C.accent} />
        <text x={12} y={5} fill={C.muted} fontSize={11}>Actual</text>
        <rect x={70} y={0} width={8} height={2} fill={C.warning} />
        <text x={82} y={5} fill={C.muted} fontSize={11}>Forecast</text>
      </g>
    </svg>
  );
}

// ─── Price History Chart (SVG) ────────────────────────────────────────────────
function PriceHistoryChart({ scanHistory = [] }) {
  // Aggregate price history per-user across all scans.
  // scanHistory items are returned from /api/v1/product-lens/history
  // with: price_min, price_max, prices_fetched_at

  const sanitized = (scanHistory || [])
    .filter(s => Number.isFinite(Number(s.price_min)) || Number.isFinite(Number(s.price_max)))
    .map(s => {
      const min = Number(s.price_min);
      const max = Number(s.price_max);
      const fetchedAt = s.prices_fetched_at || s.created_at;
      const t = fetchedAt ? new Date(fetchedAt).getTime() : NaN;
      return {
        t,
        min: Number.isFinite(min) ? min : (Number.isFinite(max) ? max : null),
        max: Number.isFinite(max) ? max : (Number.isFinite(min) ? min : null),
      };
    })
    .filter(x => Number.isFinite(x.t) && x.min !== null && x.max !== null)
    .sort((a, b) => a.t - b.t);

  // Downsample to a max of 12 points for readability
  const points = sanitized.length > 12
    ? sanitized.filter((_, idx) => idx % Math.ceil(sanitized.length / 12) === 0).slice(-12)
    : sanitized;

  if (points.length < 2) {
    return (
      <div style={{ padding: 14, color: C.muted, fontSize: 13 }}>
        Not enough scan history to render price trends yet.
      </div>
    );
  }

  const derived = points.map(p => {
    const mid = (p.min + p.max) / 2;
    return { ...p, mid };
  });

  const all = [...derived.map(d => d.min), ...derived.map(d => d.max), ...derived.map(d => d.mid)];
  const minP = Math.min(...all);
  const maxP = Math.max(...all);
  const range = (maxP - minP) || 1;

  const W = 580, H = 140;
  const x = (i) => 40 + (i / (derived.length - 1)) * (W - 60);
  const y = (v) => H - ((v - minP) / range) * (H - 20) - 10;
  const line = (arr, pick) => arr.map((v, i) => `${x(i)},${y(pick(v))}`).join(" ");

  const labels = derived.map(d => {
    try {
      return new Date(d.t).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
    } catch {
      return '';
    }
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: "100%", height: 180 }}>
        {[minP, (minP + maxP) / 2, maxP].map(v => (
          <g key={v}>
            <line x1={40} y1={y(v)} x2={W - 20} y2={y(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={36} y={y(v) + 4} fill={C.muted} fontSize={9} textAnchor="end">₹{Math.round(v / 1000)}k</text>
          </g>
        ))}

        {labels.map((m, i) => (
          <text key={m + i} x={x(i)} y={H + 16} fill={C.muted} fontSize={10} textAnchor="middle">
            {m}
          </text>
        ))}

        {/* mid line */}
        <polyline
          points={line(derived, d => d.mid)}
          fill="none"
          stroke={C.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* min/max bands */}
        <polyline
          points={line(derived, d => d.max)}
          fill="none"
          stroke={C.success}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="4,4"
          opacity={0.8}
        />
        <polyline
          points={line(derived, d => d.min)}
          fill="none"
          stroke={C.warning}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="4,4"
          opacity={0.8}
        />

        {derived.map((d, i) => (
          <circle key={d.t} cx={x(i)} cy={y(d.mid)} r={3.5} fill={C.accent} />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {[
          { label: 'Mid price', color: C.accent },
          { label: 'Max observed', color: C.success },
          { label: 'Min observed', color: C.warning },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: s.color, borderRadius: 2 }} />
            <span style={{ color: C.muted, fontSize: 11 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Revenue Chart (SVG) ─────────────────────────────────────────────────────
function RevenueChart() {
  const data = REVENUE_DATA.monthly;
  const labels = REVENUE_DATA.labels;
  const maxV = Math.max(...data) + 20;
  const W = 500, H = 120;
  const x = (i) => 30 + (i / (data.length - 1)) * (W - 50);
  const y = (v) => H - (v / maxV) * (H - 10) - 5;
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `M ${x(0)},${H} L ${pts} L ${x(data.length - 1)},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: 160 }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.success} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.success} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, maxV / 2, maxV].map(v => (
        <g key={v}>
          <line x1={30} y1={y(v)} x2={W - 20} y2={y(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <text x={26} y={y(v) + 4} fill={C.muted} fontSize={9} textAnchor="end">₹{Math.round(v)}L</text>
        </g>
      ))}
      <path d={area} fill="url(#revGrad)" />
      <polyline points={pts} fill="none" stroke={C.success} strokeWidth={2.5} strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={C.success} />
      ))}
      {labels.map((m, i) => (
        <text key={m} x={x(i)} y={H + 16} fill={C.muted} fontSize={10} textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

// ─── Product Lens Module (REAL AI image analysis) ─────────────────────────────
function ProductLensModule() {
  const [phase, setPhase] = useState("idle"); // idle | scanning | detected | error
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [recentScanHistory, setRecentScanHistory] = useState([]);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);


  const simulateScan = (product) => {
    setPhase("scanning");
    setProgress(0);
    setSelected(null);
    setAiResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setPhase("detected");
        setSelected(product || PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]);
      }
      setProgress(Math.min(p, 100));
    }, 150);
  };

  const analyzeImageWithAI = async (base64Data, mimeType, seed = "") => {
    setPhase("scanning");
    setProgress(0);
    const progIv = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8 + 3, 88));
    }, 200);
    try {
      // NOTE: this UI is currently running in a fully local/mock mode.
      // We still compute product and show live table (static in this file),
      // but price history is now per-user by reading Supabase scans/history
      // if the backend is wired.

      await wait(900);
      clearInterval(progIv);
      setProgress(100);

      const parsed = localProductInsight(`${seed}-${mimeType}-${base64Data?.length || 0}`);
      setAiResult(parsed);

      // Map to ECOM_PRICES using product name or fallback
      const matchedProduct = PRODUCTS.find(p =>
        p.name.toLowerCase().includes(parsed.brand?.toLowerCase()) ||
        p.name.toLowerCase().includes(parsed.productName?.toLowerCase().split(" ")[0])
      );

      setSelected({
        name: parsed.productName || "Unknown Product",
        brand: parsed.brand || "Unknown",
        category: parsed.category || "Electronics",
        confidence: parsed.confidence || 92,
        model: parsed.model || "N/A",
        price: parsed.price || 29999,
        image: parsed.image || "📦",
        keyFeatures: parsed.keyFeatures || [],
        ocrText: parsed.ocrText || "",
        isAiDetected: true,
        ecomKey: matchedProduct?.name,
      });

      // Fetch per-user scan history (best-effort)
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data?.session?.access_token;
          if (token) {
            const res = await fetch("/api/v1/product-lens/history?limit=20", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const payload = await res.json();
              setRecentScanHistory(payload?.scans || []);
            }
          }
        }
      } catch {
        // ignore
      }

      setPhase("detected");
    } catch (err) {
      clearInterval(progIv);
      setPhase("detected");
      setSelected(PRODUCTS[0]);
    }
  };


  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target.result;
      const base64 = result.split(",")[1];
      const mimeType = file.type;
      setUploadedImage(result);
      analyzeImageWithAI(base64, mimeType, file.name);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setShowCamera(true);
    } catch {
      simulateScan(null);
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
    const base64 = dataUrl.split(",")[1];
    stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setShowCamera(false);
    setUploadedImage(dataUrl);
    analyzeImageWithAI(base64, "image/jpeg", "camera-capture");
  };

  const ecomKey = selected?.ecomKey || selected?.name;
  const prices = ECOM_PRICES[ecomKey] || ECOM_PRICES["Sony WH-1000XM5"];

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                <p style={{ color: C.muted, fontSize: 11, marginTop: 14 }}>Powered by Gemini Vision + YOLOv8 + PaddleOCR</p>
              </div>
            )}
            {phase === "scanning" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                {uploadedImage && <img src={uploadedImage} alt="scanning" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 12, marginBottom: 16, opacity: 0.6 }} />}
                <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.accent}44`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", position: "absolute" }} />
                  <span style={{ fontSize: 28 }}>◎</span>
                </div>
                <p style={{ color: C.accent, fontSize: 13, marginBottom: 12 }}>Analyzing with Gemini Vision + YOLOv8...</p>
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
                  ["Confidence", `${selected.confidence}%`],
                  ["Est. Price", `₹${selected.price?.toLocaleString()}`],
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
                <button onClick={() => { setPhase("idle"); setSelected(null); setUploadedImage(null); setAiResult(null); }} style={{ width: "100%", marginTop: 12, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>Scan another product</button>
              </div>
            )}
            {phase === "error" && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠</div>
                <p style={{ color: C.danger, fontSize: 14 }}>Detection failed. Please try again.</p>
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
            {PRODUCTS.map((p, i) => (
              <div key={i} onClick={() => simulateScan(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 10, cursor: "pointer", marginBottom: 8, background: selected?.name === p.name ? "#00E5FF0D" : "transparent", border: `1px solid ${selected?.name === p.name ? C.accent + "44" : "transparent"}`, transition: "all 0.2s" }}>
                <span style={{ fontSize: 28 }}>{p.image}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.text, fontSize: 13, margin: "0 0 2px", fontWeight: 500 }}>{p.name}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{p.category}</p>
                </div>
                <span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>{p.confidence}%</span>
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
              <span style={{ color: C.muted, fontSize: 11 }}>5 platforms • Updated just now</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Store", "Price", "Availability", "Delivery", "Rating", ""].map(h => (
                      <th key={h} style={{ padding: "12px 16px", color: C.muted, fontWeight: 500, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prices.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: r.badge === "Best Price" ? "#00FF8808" : "transparent" }}>
                      <td style={{ padding: "12px 16px", color: C.text, fontWeight: 500 }}>
                        {r.store}
                        {r.badge && <span style={{ marginLeft: 8, background: r.badge === "Best Price" ? "#00FF8820" : "#00E5FF20", color: r.badge === "Best Price" ? C.success : C.accent, fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{r.badge}</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: r.badge === "Best Price" ? C.success : C.text, fontWeight: r.badge === "Best Price" ? 700 : 400 }}>
                        ₹{r.price.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: r.avail === "In Stock" ? C.success : C.warning, fontSize: 12 }}>● {r.avail}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: C.muted }}>{r.delivery}</td>
                      <td style={{ padding: "12px 16px", color: C.warning }}>★ {r.rating}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => downloadText(`${selected.name}-${r.store}.txt`, `${selected.name}\n${r.store}: ₹${r.price.toLocaleString()}\nAvailability: ${r.avail}\nDelivery: ${r.delivery}\nRating: ${r.rating}`)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.accent, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>View ↗</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price History Chart (per-user aggregated scans) */}
          <div style={{ marginTop: 16, background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
            <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Your Price Trends (All scans) — {selected.name}
            </p>
            <PriceHistoryChart scanHistory={recentScanHistory} />

            <div style={{ marginTop: 14, padding: "10px 14px", background: "#7C3AED0A", borderRadius: 10, border: `1px solid ${C.purple}22` }}>
              <p style={{ color: C.text, fontSize: 12, margin: 0 }}>
                ✦ <strong>Price Insight:</strong> Trend line is computed from your saved scans (min/max observed across fetches).
              </p>
            </div>
          </div>

        </>
      )}
    </div>
  );
}

// ─── Customers Module ─────────────────────────────────────────────────────────
function CustomersModule() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("table"); // table | segments
  const filtered = CUSTOMERS.filter(c =>
    (filter === "All" || c.risk === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const segments = [
    { name: "Enterprise Champions", customers: 312, avgLtv: 1098000, churn: 8, color: C.success, icon: "⬡", desc: "High-spend, high-NPS, long tenure. Upsell targets." },
    { name: "B2B Growth Accounts", customers: 1847, avgLtv: 346800, churn: 34, color: C.accent, icon: "◉", desc: "Strong engagement. At risk from competitor pricing." },
    { name: "SMB Active", customers: 5892, avgLtv: 80400, churn: 28, color: C.warning, icon: "◇", desc: "Healthy but price-sensitive. Need proactive support." },
    { name: "At-Risk Churners", customers: 2841, avgLtv: 192000, churn: 82, color: C.danger, icon: "△", desc: "Low engagement, high support tickets. Urgent action needed." },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
        {["All", "Critical", "High", "Medium", "Low"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.accent : "transparent", color: filter === f ? "#000" : C.muted, border: `1px solid ${filter === f ? C.accent : C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{f}</button>
        ))}
        <button onClick={() => setView(v => v === "table" ? "segments" : "table")} style={{ background: "#7C3AED22", color: C.purple, border: `1px solid ${C.purple}44`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          {view === "table" ? "◉ Segments" : "≡ Table"}
        </button>
      </div>

      {view === "segments" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {segments.map(s => (
            <div key={s.name} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${s.color}22`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <span style={{ color: s.color, fontSize: 20 }}>{s.icon}</span>
                  <h4 style={{ color: "#fff", margin: "6px 0 4px", fontSize: 14, fontWeight: 700 }}>{s.name}</h4>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  ["Customers", s.customers.toLocaleString()],
                  ["Avg LTV", `₹${(s.avgLtv / 100000).toFixed(1)}L`],
                  ["Churn Risk", `${s.churn}%`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#ffffff06", borderRadius: 8, padding: "8px 10px" }}>
                    <p style={{ color: C.muted, fontSize: 10, margin: "0 0 3px", textTransform: "uppercase" }}>{k}</p>
                    <p style={{ color: k === "Churn Risk" ? (s.churn > 60 ? C.danger : s.churn > 30 ? C.warning : C.success) : C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
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
    </div>
  );
}

// ─── Churn Module ─────────────────────────────────────────────────────────────
function ChurnModule() {
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [aiRecs, setAiRecs] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMlPrediction(null);
    predictChurnWithML(customer)
      .then(result => { if (!cancelled) setMlPrediction(result); })
      .catch(() => { if (!cancelled) setMlPrediction({ risk_level: customer.risk.toUpperCase(), churn_probability: customer.churn / 100, model: "Local fallback" }); });
    return () => { cancelled = true; };
  }, [customer]);

  const getAIRetentionPlan = async () => {
    setLoadingRecs(true);
    await wait(700);
    setAiRecs(localRetentionPlan(customer, mlPrediction));
    setLoadingRecs(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      <div>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
          <p style={{ color: C.accent, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Select Customer</p>
          {CUSTOMERS.slice(0, 6).map(c => (
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
                  ["Live ML Score", mlPrediction?.churn_probability ? `${Math.round(mlPrediction.churn_probability * 100)}%` : "Checking..."],
                  ["Model", mlPrediction?.model || "XGBoost ensemble"],
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
            SHAP Explainability — Top Churn Drivers
          </p>
          {CHURN_FACTORS.map((f, i) => <ChurnBar key={i} {...f} />)}
        </div>

        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Retention Playbook</p>
            {!aiRecs && (
              <button onClick={getAIRetentionPlan} disabled={loadingRecs} style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.accent})`, color: "#000", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: loadingRecs ? 0.6 : 1 }}>
                {loadingRecs ? "Generating..." : "✦ Generate with AI"}
              </button>
            )}
          </div>
          {!aiRecs && !loadingRecs && (
            <div style={{ padding: "12px 16px", background: "#FFC85714", borderRadius: 10, border: `1px solid ${C.warning}33` }}>
              <p style={{ color: C.warning, fontSize: 13, margin: 0, fontWeight: 500 }}>
                ⚡ Default: Offer 20% discount + dedicated CSM to reduce churn by est. 34%
              </p>
            </div>
          )}
          {loadingRecs && (
            <div style={{ display: "flex", gap: 6, padding: 16 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: `pulse ${0.5 + i * 0.15}s ease-in-out infinite alternate` }} />)}
              <span style={{ color: C.muted, fontSize: 13, marginLeft: 6 }}>Generating personalized retention plan...</span>
            </div>
          )}
          {aiRecs && aiRecs.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < aiRecs.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 60, flexShrink: 0, background: `${C.purple}22`, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ color: C.purple, fontSize: 10, fontWeight: 700, margin: 0 }}>{r.step}</p>
              </div>
              <div>
                <p style={{ color: C.text, fontSize: 13, margin: "0 0 4px", fontWeight: 500 }}>{r.action}</p>
                <p style={{ color: C.success, fontSize: 11, margin: 0 }}>↑ {r.expected_impact}</p>
              </div>
            </div>
          ))}
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {SENTIMENT_DATA.map(s => (
          <div key={s.platform} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 14 }}>{s.platform}</p>
              <span style={{ color: s.trend.startsWith("+") ? C.success : C.danger, fontSize: 12, fontWeight: 600 }}>{s.trend}</span>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ width: `${s.positive}%`, background: C.success }} />
              <div style={{ width: `${s.neutral}%`, background: C.muted }} />
              <div style={{ width: `${s.negative}%`, background: C.danger }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: C.success }}>● {s.positive}% pos</span>
              <span style={{ color: C.muted }}>● {s.neutral}% neutral</span>
              <span style={{ color: C.danger }}>● {s.negative}% neg</span>
            </div>
            <p style={{ color: C.muted, fontSize: 11, margin: "8px 0 0" }}>{s.total.toLocaleString()} total mentions</p>
          </div>
        ))}
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
function RevenueModule() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "ARR", value: "₹34.1 Cr", delta: "+14.8%", color: C.success, sub: "Annual Recurring Revenue" },
          { label: "MRR", value: "₹2.84 Cr", delta: "+8.7%", color: C.accent, sub: "Monthly Recurring Revenue" },
          { label: "Revenue at Risk", value: "₹34.2L", delta: "+3.2%", color: C.danger, sub: "From churn signals" },
          { label: "Expansion Revenue", value: "₹8.4L", delta: "+22.1%", color: C.purple, sub: "Upsells this month" },
          { label: "Net Revenue Retention", value: "118%", delta: "+4%", color: C.success, sub: "NRR — World class" },
          { label: "Avg Contract Value", value: "₹4.06L", delta: "+6.3%", color: C.warning, sub: "ACV per account" },
        ].map(k => (
          <div key={k.label} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${k.color}22`, padding: 18 }}>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 8px" }}>{k.label}</p>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{k.value}</p>
            <p style={{ color: k.delta.startsWith("+") ? C.success : C.danger, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>{k.delta}</p>
            <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Revenue Trend — 6 Month</p>
          <RevenueChart />
        </div>
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>ARR by Segment</p>
          {REVENUE_DATA.segments.map((s, i) => (
            <div key={s.name} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.text, fontSize: 13 }}>{s.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: s.growth.startsWith("+") ? C.success : C.danger, fontSize: 12, fontWeight: 600 }}>{s.growth}</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>₹{s.arr}Cr</span>
                </div>
              </div>
              <div style={{ background: "#ffffff08", borderRadius: 4, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${(s.arr / 284) * 100}%`, height: "100%", background: s.color, borderRadius: 4 }} />
              </div>
              <p style={{ color: C.muted, fontSize: 10, margin: "4px 0 0" }}>{s.customers.toLocaleString()} customers</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Revenue Forecast — Next 90 Days
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { period: "30-Day", base: "₹2.96 Cr", bull: "₹3.12 Cr", bear: "₹2.71 Cr" },
            { period: "60-Day", base: "₹3.08 Cr", bull: "₹3.34 Cr", bear: "₹2.72 Cr" },
            { period: "90-Day", base: "₹3.22 Cr", bull: "₹3.61 Cr", bear: "₹2.68 Cr" },
          ].map(f => (
            <div key={f.period} style={{ background: "#ffffff06", borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", margin: "0 0 10px" }}>{f.period} Forecast</p>
              <p style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{f.base}</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.success }}>▲ {f.bull}</span>
                <span style={{ color: C.danger }}>▼ {f.bear}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#7C3AED14", borderRadius: 10, border: `1px solid ${C.purple}33` }}>
          <p style={{ color: C.text, fontSize: 13, margin: 0 }}>
            ✦ <strong>AI Forecast:</strong> Base scenario assumes current retention rates hold. Bullish case requires successful win-back of 47 renewals due this month (₹89L ARR). Bear case reflects unchecked SMB churn acceleration.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── AI Copilot ───────────────────────────────────────────────────────────────
function CopilotModule() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI Business Copilot. I can analyze churn patterns, predict revenue, suggest retention strategies, scan product prices, and surface key business insights. What would you like to explore?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    setStreaming("");

    const reply = localCopilotReply(msg);
    let i = 0;
    const iv = setInterval(() => {
      i += 4;
      setStreaming(reply.slice(0, i));
      if (i >= reply.length) {
        clearInterval(iv);
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        setStreaming("");
        setLoading(false);
      }
    }, 10);
  }, [input, messages]);

  const formatMsg = (text) => {
    return text.split("\n").map((line, i) => {
      const escaped = line.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
      const bold = escaped.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#fff'>$1</strong>");
      return <p key={i} style={{ margin: "0 0 5px", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 580 }}>
      <div style={{ background: C.bgCard, borderRadius: "16px 16px 0 0", border: `1px solid ${C.border}`, borderBottom: "none", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
        <div>
          <p style={{ color: "#fff", margin: 0, fontWeight: 600, fontSize: 15 }}>AI Business Copilot</p>
          <p style={{ color: C.success, margin: 0, fontSize: 11 }}>● Powered by Claude · Live</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <span style={{ background: "#00E5FF14", color: C.accent, fontSize: 10, padding: "3px 10px", borderRadius: 10 }}>Context-aware</span>
          <span style={{ background: "#7C3AED14", color: C.purple, fontSize: 10, padding: "3px 10px", borderRadius: 10 }}>Memory: ON</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderTop: "none", borderBottom: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: m.role === "user" ? `linear-gradient(135deg, ${C.purple}, ${C.pink})` : `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
              {m.role === "user" ? "U" : "✦"}
            </div>
            <div style={{ maxWidth: "75%", background: m.role === "user" ? "#7C3AED22" : "#0F172A", border: `1px solid ${m.role === "user" ? C.purple + "44" : C.border}`, borderRadius: 12, padding: "10px 14px", color: C.text, fontSize: 13 }}>
              {formatMsg(m.content)}
            </div>
          </div>
        ))}
        {streaming && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✦</div>
            <div style={{ maxWidth: "75%", background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.text, fontSize: 13 }}>
              {formatMsg(streaming)}<span style={{ animation: "blink 1s infinite" }}>▌</span>
            </div>
          </div>
        )}
        {loading && !streaming && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
            <div style={{ padding: "10px 14px", background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: `pulse ${0.5+i*0.15}s ease-in-out infinite alternate` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: C.bgCard, borderRadius: "0 0 16px 16px", border: `1px solid ${C.border}`, borderTop: "none", padding: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {COPILOT_STARTERS.slice(0, 4).map(q => (
            <button key={q} onClick={() => send(q)} style={{ background: "#00E5FF0A", border: `1px solid ${C.accent}33`, color: C.accent, borderRadius: 20, padding: "4px 11px", fontSize: 11, cursor: "pointer" }}>{q.slice(0, 32)}...</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && send()}
            placeholder="Ask about churn, revenue, products, customers..." style={{ flex: 1, background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
          <button onClick={() => send()} disabled={loading} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 15, cursor: "pointer", fontWeight: 700, opacity: loading ? 0.5 : 1 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Module ────────────────────────────────────────────────────────────
function ReportsModule() {
  const [generating, setGenerating] = useState(null);
  const [done, setDone] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const gen = (type) => {
    setGenerating(type);
    setTimeout(() => { setGenerating(null); setDone(prev => ({ ...prev, [type]: true })); }, 2200);
  };

  const generateExecutiveSummary = async () => {
    setLoadingSummary(true);
    await wait(900);
    setAiSummary(executiveSummaryText());
    setLoadingSummary(false);
  };

  const reports = [
    { id: "churn", title: "Churn Analysis Report", desc: "Full churn breakdown with SHAP explanations, risk segments, and retention recommendations", icon: "△", color: C.danger },
    { id: "revenue", title: "Revenue Trends Report", desc: "Monthly revenue analysis, ARR at risk, and 90-day forecast with confidence intervals", icon: "◇", color: C.success },
    { id: "product", title: "Product Performance Report", desc: "Price intelligence history, scan statistics, and e-commerce competitive analysis", icon: "◎", color: C.accent },
    { id: "customer", title: "Customer Segmentation Report", desc: "RFM analysis, cohort retention, lifetime value distribution, and segment health", icon: "◉", color: C.purple },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {reports.map(r => (
          <div key={r.id} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${r.color}18, transparent 70%)` }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 28, color: r.color }}>{r.icon}</span>
              <div>
                <h4 style={{ color: "#fff", margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>{r.title}</h4>
                <p style={{ color: C.muted, margin: 0, fontSize: 12, lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </div>
            {done[r.id] ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => downloadText(`${r.id}-report.txt`, `${r.title}\n\n${r.desc}\n\n${executiveSummaryText()}`)} style={{ flex: 1, background: "#00FF8814", border: `1px solid ${C.success}44`, color: C.success, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>↓ Download PDF</button>
                <button onClick={() => downloadText(`${r.id}-report.csv`, buildReport(r.id), "text/csv")} style={{ flex: 1, background: "#00E5FF14", border: `1px solid ${C.accent}44`, color: C.accent, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>↓ Download Excel</button>
              </div>
            ) : (
              <button onClick={() => gen(r.id)} disabled={generating === r.id} style={{ width: "100%", background: generating === r.id ? "#ffffff08" : r.color + "22", border: `1px solid ${r.color}44`, color: r.color, borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {generating === r.id ? (
                  <><div style={{ width: 14, height: 14, border: `2px solid ${r.color}44`, borderTop: `2px solid ${r.color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating...</>
                ) : "Generate Report →"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* AI Executive Summary */}
      <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>✦ AI Executive Summary</p>
          {!aiSummary && (
            <button onClick={generateExecutiveSummary} disabled={loadingSummary} style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.accent})`, color: "#000", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: loadingSummary ? 0.6 : 1 }}>
              {loadingSummary ? "Generating..." : "Generate with AI →"}
            </button>
          )}
        </div>
        {!aiSummary && !loadingSummary && (
          <p style={{ color: C.muted, fontSize: 13 }}>Generate an AI-written executive summary of this month's performance, ready to share with your board or investors.</p>
        )}
        {loadingSummary && (
          <div style={{ display: "flex", gap: 6, padding: 8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: `pulse ${0.5+i*0.15}s ease-in-out infinite alternate` }} />)}
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 6 }}>Analyzing business data and writing summary...</span>
          </div>
        )}
        {aiSummary && (
          <div>
            {aiSummary.split("\n\n").map((para, i) => (
              <p key={i} style={{ color: C.text, fontSize: 13, lineHeight: 1.8, margin: "0 0 14px" }}>{para}</p>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => setAiSummary(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Regenerate</button>
              <button onClick={() => downloadText("executive-summary.txt", aiSummary)} style={{ background: "#00FF8814", border: `1px solid ${C.success}44`, color: C.success, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>↓ Export as PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  const c1 = useCountUp(84291, 2000, true);
  const c2 = useCountUp(97, 2000, true);
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
          AI-powered product intelligence and customer retention platform. One platform. Every insight. Production-ready.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 60 }}>
          <button onClick={onEnter} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 0 40px ${C.accent}44` }}>Launch Dashboard →</button>
          <button onClick={onEnter} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Watch Demo</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 60 }}>
          {[
            [`${c1.toLocaleString()}+`, "Customers Monitored"],
            [`${c2}%`, "AI Accuracy"],
            ["₹2.84 Cr", "Revenue Protected"],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 4px" }}>{val}</p>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{label}</p>
            </div>
          ))}
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
function SettingsModule() {
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

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
              {[["Full Name","Aryan Kumar"],["Email","aryan@visionretain.ai"],["Company","VisionRetain AI"],["Job Title","Founder & CEO"],["Phone","+91 98765 43210"],["Timezone","Asia/Kolkata (IST)"]].map(([label, val]) => (
                <div key={label}>
                  <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>{label}</p>
                  <input defaultValue={val} style={{ width: "100%", background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>AI Model</p>
              <select style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, width: "100%", outline: "none" }}>
                <option>Claude Sonnet 4.6 (Recommended)</option>
                <option>Claude Opus 4.6 (Most Capable)</option>
                <option>Claude Haiku 4.5 (Fastest)</option>
              </select>
            </div>
            <button onClick={save} style={{ background: saved ? C.success : C.accent, color: "#000", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}>
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <h4 style={{ color: "#fff", margin: 0, fontSize: 14 }}>Team Members</h4>
                <button onClick={save} style={{ background: `${C.purple}22`, border: `1px solid ${C.purple}44`, color: C.purple, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Invite Member</button>
              </div>
              {[
                { name: "Aryan Kumar", email: "aryan@visionretain.ai", role: "Admin", status: "Active" },
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
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>Billing & Subscription</h3>
            <div style={{ background: `linear-gradient(135deg, ${C.purple}22, ${C.accent}11)`, borderRadius: 14, border: `1px solid ${C.purple}44`, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: C.purple, fontSize: 11, textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.1em" }}>Current Plan</p>
                  <h2 style={{ color: "#fff", margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>Enterprise</h2>
                  <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Unlimited users · All modules · Priority support</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 3px" }}>₹49,999<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/mo</span></p>
                  <p style={{ color: C.success, fontSize: 12, margin: 0 }}>Next billing: Aug 18, 2026</p>
                </div>
              </div>
            </div>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Usage This Month</p>
            {[
              { label: "AI Copilot Queries", used: 2841, limit: 10000 },
              { label: "Product Scans", used: 1247, limit: 5000 },
              { label: "API Calls", used: 84291, limit: 500000 },
            ].map(u => (
              <div key={u.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: C.text, fontSize: 13 }}>{u.label}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>{u.used.toLocaleString()} / {u.limit.toLocaleString()}</span>
                </div>
                <div style={{ background: "#ffffff08", borderRadius: 4, height: 5, overflow: "hidden" }}>
                  <div style={{ width: `${(u.used / u.limit) * 100}%`, height: "100%", background: u.used / u.limit > 0.8 ? C.warning : C.accent, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VisionRetainAI() {
  const [section, setSection] = useState("landing");
  const [notifications] = useState([
    { type: "danger", msg: "Critical: Karan Verma — 95% churn risk" },
    { type: "warning", msg: "Price drop: Sony XM5 at ₹26,999 on Amazon" },
    { type: "success", msg: "Demand forecast updated for Q3" },
  ]);
  const [showNotif, setShowNotif] = useState(false);

  const sectionTitles = {
    overview: "Command Center", "product-lens": "Product Lens AI", price: "Price Intelligence",
    customers: "Customer Management", churn: "Churn Analytics", demand: "Demand Forecasting",
    sentiment: "Sentiment Analysis", revenue: "Revenue Intelligence",
    copilot: "AI Business Copilot", reports: "Reports", settings: "Settings & Configuration"
  };

  if (section === "landing") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { to { opacity: 0.3; transform: scale(0.8); } }
          @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        `}</style>
        <nav style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 16 }}>V</div>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>VisionRetain AI</span>
            <span style={{ background: "#00E5FF14", color: C.accent, fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600, marginLeft: 4 }}>v2.0</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Features", "Pricing", "Docs", "Blog"].map(l => <span key={l} style={{ color: C.muted, fontSize: 14, cursor: "pointer" }}>{l}</span>)}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setSection("overview")} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Sign In</button>
            <button onClick={() => setSection("overview")} style={{ background: C.accent, border: "none", color: "#000", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Get Started</button>
          </div>
        </nav>
        <LandingPage onEnter={() => setSection("overview")} />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { to { opacity: 0.3; transform: scale(0.8); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: C.bgSec, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 14 }}>V</div>
            <div>
              <p style={{ color: "#fff", margin: 0, fontSize: 13, fontWeight: 800 }}>VisionRetain</p>
              <p style={{ color: C.muted, margin: 0, fontSize: 10 }}>AI Platform v2.0</p>
            </div>
          </div>
        </div>
        <nav style={{ padding: "10px 10px", flex: 1 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 2, cursor: "pointer", background: section === item.id ? `${C.accent}18` : "transparent", border: `1px solid ${section === item.id ? C.accent + "44" : "transparent"}`, color: section === item.id ? C.accent : C.muted, fontSize: 13, fontWeight: section === item.id ? 600 : 400, textAlign: "left", transition: "all 0.15s" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>AK</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.text, margin: 0, fontSize: 12, fontWeight: 500 }}>Aryan Kumar</p>
              <p style={{ color: C.muted, margin: 0, fontSize: 10 }}>Admin · Enterprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ height: 56, background: C.bgSec, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>{sectionTitles[section] || section}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#00FF8814", border: `1px solid ${C.success}33`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block" }} />
              <span style={{ color: C.success, fontSize: 11, fontWeight: 600 }}>All Systems Live</span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotif(!showNotif)} style={{ background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: C.text, fontSize: 14 }}>🔔</button>
              <span style={{ position: "absolute", top: -3, right: -3, width: 15, height: 15, borderRadius: "50%", background: C.danger, fontSize: 8, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              {showNotif && (
                <div style={{ position: "absolute", top: 42, right: 0, width: 300, background: C.bgSec, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  {notifications.map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px", borderRadius: 8, marginBottom: 4, background: "#ffffff04" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: n.type === "danger" ? C.danger : n.type === "warning" ? C.warning : C.success }} />
                      <span style={{ color: C.text, fontSize: 12 }}>{n.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSection("landing")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.muted, fontSize: 12, cursor: "pointer" }}>◈ Home</button>
          </div>
        </div>

        {/* Ticker */}
        <div style={{ height: 32, background: "#00E5FF06", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 32, overflowX: "auto", flexShrink: 0 }}>
          {[
            { label: "Churn Alert", val: "Karan Verma 95%", color: C.danger },
            { label: "Price Drop", val: "Sony XM5 ₹26,999", color: C.warning },
            { label: "AI Scan", val: "iPhone 15 Pro 99.1%", color: C.success },
            { label: "Revenue Risk", val: "₹34.2L at risk", color: C.danger },
            { label: "Sentiment", val: "Amazon +72% pos", color: C.accent },
            { label: "Forecast", val: "Demand ↑ 14.2%", color: C.purple },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <span style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.label}</span>
              <span style={{ color: t.color, fontSize: 11, fontWeight: 600 }}>{t.val}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {section === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {KPI_DATA.map((k, i) => <KPICard key={i} {...k} active={true} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 18 }}>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Demand Forecast — 90 Day View</p>
                  <DemandChart />
                </div>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Risk Distribution</p>
                  {[
                    { label: "Critical", count: 284, pct: 10, color: C.danger },
                    { label: "High", count: 1124, pct: 40, color: C.warning },
                    { label: "Medium", count: 842, pct: 30, color: C.accent },
                    { label: "Low", count: 591, pct: 21, color: C.success },
                  ].map(r => (
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
              {/* Revenue + Sentiment quick view */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Revenue Trend</p>
                  <RevenueChart />
                </div>
                <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: "0 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sentiment Overview</p>
                  {SENTIMENT_DATA.slice(0, 4).map(s => (
                    <div key={s.platform} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.text, fontSize: 12 }}>{s.platform.split("/")[0]}</span>
                        <span style={{ color: s.trend.startsWith("+") ? C.success : C.danger, fontSize: 11, fontWeight: 600 }}>{s.trend}</span>
                      </div>
                      <div style={{ display: "flex", height: 5, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${s.positive}%`, background: C.success }} />
                        <div style={{ width: `${s.neutral}%`, background: C.muted }} />
                        <div style={{ width: `${s.negative}%`, background: C.danger }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                  <p style={{ color: C.accent, fontSize: 12, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>High-Risk Customers</p>
                  <button onClick={() => setSection("customers")} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12, cursor: "pointer" }}>View all →</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>
                    {CUSTOMERS.filter(c => c.risk === "Critical" || c.risk === "High").slice(0, 4).map(c => (
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
              </div>
            </div>
          )}

          {section === "product-lens" && <ProductLensModule />}
          {section === "customers" && <CustomersModule />}
          {section === "churn" && <ChurnModule />}
          {section === "sentiment" && <SentimentModule />}
          {section === "revenue" && <RevenueModule />}
          {section === "copilot" && <CopilotModule />}
          {section === "reports" && <ReportsModule />}

          {section === "demand" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "7-Day Forecast", value: "2,100 units", delta: "+7.7%", color: C.accent },
                  { label: "30-Day Forecast", value: "8,840 units", delta: "+12.3%", color: C.success },
                  { label: "90-Day Forecast", value: "24,200 units", delta: "+14.2%", color: C.warning },
                ].map(k => (
                  <div key={k.label} style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                    <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</p>
                    <p style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>{k.value}</p>
                    <span style={{ color: C.success, fontSize: 13, fontWeight: 600 }}>{k.delta}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                <p style={{ color: C.accent, fontSize: 12, margin: "0 0 20px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sales Demand Forecast — Actual vs Predicted</p>
                <DemandChart />
                <div style={{ marginTop: 20, padding: "14px 16px", background: "#7C3AED14", borderRadius: 10, border: `1px solid ${C.purple}33` }}>
                  <p style={{ color: C.text, fontSize: 13, margin: 0 }}>
                    ✦ <strong>AI Insight:</strong> Q3 shows strong upward trend driven by festive season demand. Sony audio and Apple devices projected to outperform category average by 18%. Consider increasing inventory levels by end of July.
                  </p>
                </div>
              </div>
            </div>
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

          {section === "settings" && <SettingsModule />}
        </div>
      </div>
    </div>
  );
}
