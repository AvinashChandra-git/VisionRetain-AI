import { isMissingColumn, isMissingTable, json, requireUser, supabaseSelect } from "../_lib.js";

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
  try {
    json(response, 200, { scans: await supabaseSelect("product_scans", query.toString()) });
  } catch (error) {
    if (isMissingColumn(error, "owner_id")) {
      try {
        const legacyQuery = new URLSearchParams({
          select: "id,product_name,brand,model,category,confidence,identity_status,objects,price_min,price_max,currency,prices_fetched_at,created_at",
          order: "created_at.desc",
          limit: String(limit),
        });
        return json(response, 200, { scans: await supabaseSelect("product_scans", legacyQuery.toString()), schema_mode: "legacy" });
      } catch (legacyError) {
        if (!isMissingTable(legacyError, "product_scans")) console.error("Legacy scan history load failed", legacyError);
      }
    } else if (!isMissingTable(error, "product_scans")) {
      console.error("Scan history load failed", error);
    }
    json(response, 200, { scans: [] });
  }
}
