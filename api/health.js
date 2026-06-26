import { json } from "./_lib.js";

export default function handler(_request, response) {
  json(response, 200, {
    status: "healthy",
    product_lens: {
      vision_configured: Boolean(process.env.GEMINI_API_KEY),
      live_prices_configured: Boolean(process.env.SERPAPI_API_KEY),
      supabase_configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
    },
    timestamp: new Date().toISOString(),
  });
}
