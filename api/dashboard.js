import { json, requireUser, supabaseSelect } from "./_lib.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { detail: "Method not allowed" });
  if (!await requireUser(request, response)) return;
  const [metrics, customers] = await Promise.all([
    supabaseSelect("dashboard_metrics", "select=*&order=sort_order.asc"),
    supabaseSelect("customers", "select=*&order=updated_at.desc"),
  ]);
  json(response, 200, { metrics, customers, fetched_at: new Date().toISOString() });
}
