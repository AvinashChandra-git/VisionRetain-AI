const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function json(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json");
  response.send(JSON.stringify(payload));
}

export async function requireUser(request, response) {
  const authorization = request.headers.authorization || "";
  if (!authorization.startsWith("Bearer ") || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    json(response, 401, { detail: "Authentication required" });
    return null;
  }
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: authorization,
    },
  });
  if (!authResponse.ok) {
    json(response, 401, { detail: "Invalid or expired session" });
    return null;
  }
  return authResponse.json();
}

function serviceHeaders(prefer = "") {
  const headers = {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

export async function supabaseSelect(table, query = "") {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: serviceHeaders(),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Supabase select from ${table} failed`, detail);
    const error = new Error(`Could not read ${table} from the database`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  return response.json();
}

export async function supabaseInsert(table, payload) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase persistence is not configured");
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders("return=representation"),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Supabase insert into ${table} failed`, detail);
    const error = new Error(`Could not save ${table} to the database`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  const rows = await response.json();
  return rows[0] || null;
}

export function isMissingColumn(error, column) {
  const detail = String(error?.detail || error?.message || "").toLowerCase();
  return detail.includes("42703") || detail.includes(`'${column.toLowerCase()}'`) || detail.includes(`\"${column.toLowerCase()}\"`);
}

export function isMissingTable(error, table) {
  const detail = String(error?.detail || error?.message || "").toLowerCase();
  return detail.includes("42p01") || detail.includes(table.toLowerCase());
}

export function parseGeminiJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Invalid vision response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function titleRelevance(title, identification) {
  const query = [identification.brand, identification.model, identification.product_name]
    .filter(Boolean).join(" ").toLowerCase();
  const ignored = new Set(["the", "with", "for", "and", "new", "buy", "online", "best"]);
  const wanted = new Set((query.match(/[a-z0-9]+/g) || []).filter(token => token.length > 1 && !ignored.has(token)));
  const found = new Set(title.toLowerCase().match(/[a-z0-9]+/g) || []);
  if (!wanted.size) return 0;
  let score = [...wanted].filter(token => found.has(token)).length / wanted.size;
  if (identification.model) {
    const models = identification.model.toLowerCase().match(/[a-z0-9]+/g) || [];
    if (models.some(token => !found.has(token))) score *= 0.45;
  }
  return Math.round(score * 10000) / 10000;
}
