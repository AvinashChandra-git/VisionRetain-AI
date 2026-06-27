import { isMissingColumn, isMissingTable, json, requireUser, supabaseSelect } from "./_lib.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { detail: "Method not allowed" });
  const user = await requireUser(request, response);
  if (!user) return;
  const query = new URLSearchParams({
    select: "*",
    owner_id: `eq.${user.id}`,
    order: "updated_at.desc",
  });
  try {
    const customers = await supabaseSelect("customers", query.toString());
    json(response, 200, { metrics: [], customers, fetched_at: new Date().toISOString() });
  } catch (error) {
    if (isMissingColumn(error, "owner_id")) {
      try {
        const legacyQuery = new URLSearchParams({
          select: "*",
          order: "updated_at.desc",
        });
        const customers = await supabaseSelect("customers", legacyQuery.toString());
        return json(response, 200, {
          metrics: [],
          customers,
          schema_mode: "legacy",
          fetched_at: new Date().toISOString(),
        });
      } catch (legacyError) {
        console.error("Legacy dashboard load failed", legacyError);
      }
    }
    if (!isMissingTable(error, "customers")) console.error("Dashboard load failed", error);
    json(response, 200, { metrics: [], customers: [], fetched_at: new Date().toISOString() });
  }
}
