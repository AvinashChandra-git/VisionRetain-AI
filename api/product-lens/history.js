import { json, requireUser, supabaseSelect } from "../_lib.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { detail: "Method not allowed" });
  const user = await requireUser(request, response);
  if (!user) return;
  const limit = Math.min(Number(request.query.limit) || 10, 50);
  const query = new URLSearchParams({
    select: "id,product_name,brand,model,category,confidence,identity_status,objects,price_min,price_max,currency,prices_fetched_at,created_at",
    owner_id: `eq.${user.id}`,
    order: "created_at.desc",
    limit: String(limit),
  });
  json(response, 200, { scans: await supabaseSelect("product_scans", query.toString()) });
}
