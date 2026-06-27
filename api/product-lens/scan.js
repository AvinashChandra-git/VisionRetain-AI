import crypto from "node:crypto";
import {
  isMissingColumn,
  json,
  parseGeminiJson,
  requireUser,
  supabaseInsert,
  titleRelevance,
} from "../_lib.js";

const visionPrompt = `Analyze this image for product intelligence. Detect every clearly visible
physical object, then identify the primary retail product as precisely as visual evidence permits.
Never guess a brand, model, variant, capacity, or generation. OCR visible labels and model numbers.
Use identity_status exact only when a unique model/SKU is visible or unmistakable, probable when
brand and product line are strongly supported, category_only when only the generic object type is
supported, and unknown when unusable. Confidence is an evidence-quality estimate from 0 to 100.
Return JSON only with product_name, brand, model, category, confidence, identity_status, features,
ocr_text, objects (array of {label, confidence}), shopping_query. Do not include prices.`;

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, 405, { detail: "Method not allowed" });
  const user = await requireUser(request, response);
  if (!user) return;
  if (!process.env.GEMINI_API_KEY) {
    return json(response, 503, { detail: "Product recognition is not configured. Add GEMINI_API_KEY in Vercel." });
  }
  const { image_base64, mime_type = "image/jpeg" } = request.body || {};
  if (!image_base64) return json(response, 400, { detail: "Image is required" });
  const imageBytes = Buffer.from(image_base64, "base64");
  if (imageBytes.length > 2_000_000) return json(response, 413, { detail: "Image is too large after compression" });

  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: visionPrompt }, { inline_data: { mime_type, data: image_base64 } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );
  if (!geminiResponse.ok) {
    const error = await geminiResponse.text();
    console.error("Gemini failed", error);
    return json(response, 502, { detail: "Vision provider could not analyze this image" });
  }
  let identification;
  try {
    const gemini = await geminiResponse.json();
    identification = parseGeminiJson(gemini.candidates[0].content.parts[0].text);
  } catch {
    return json(response, 502, { detail: "Vision provider returned invalid data" });
  }

  const fetchedAt = new Date().toISOString();
  let listings = [];
  let priceStatus = "unconfigured";
  let priceMessage = "Add SERPAPI_API_KEY in Vercel to retrieve current shopping listings.";
  if (process.env.SERPAPI_API_KEY) {
    const search = new URLSearchParams({
      engine: "google_shopping",
      q: identification.shopping_query,
      api_key: process.env.SERPAPI_API_KEY,
      gl: process.env.PRICE_COUNTRY || "in",
      hl: process.env.PRICE_LANGUAGE || "en",
      num: "20",
    });
    const shoppingResponse = await fetch(`https://serpapi.com/search.json?${search}`);
    if (shoppingResponse.ok) {
      const shopping = await shoppingResponse.json();
      const minimum = ["exact", "probable"].includes(identification.identity_status) ? 0.62 : 0.35;
      listings = (shopping.shopping_results || []).map(item => ({
        store: item.source || "Unknown store",
        title: item.title,
        price: item.extracted_price,
        currency: (process.env.PRICE_COUNTRY || "in") === "in" ? "INR" : item.currency || "USD",
        product_url: item.product_link || item.link,
        source_url: shopping.search_metadata?.google_shopping_url,
        availability: item.delivery || "Check retailer",
        rating: item.rating,
        reviews: item.reviews,
        relevance: titleRelevance(item.title || "", identification),
        fetched_at: fetchedAt,
      })).filter(item => Number.isFinite(item.price) && item.product_url && item.relevance >= minimum)
        .sort((a, b) => a.price - b.price).slice(0, 12);
      if (listings[0]) listings[0].badge = "Best current price";
      priceStatus = listings.length ? "live" : "no_verified_matches";
      priceMessage = listings.length ? null : "No sufficiently relevant current listings were found.";
    } else {
      priceStatus = "provider_error";
      priceMessage = "The live shopping provider is temporarily unavailable.";
    }
  }

  const prices = listings.map(item => item.price);
  const scanPayload = {
    owner_id: user.id,
    image_sha256: crypto.createHash("sha256").update(imageBytes).digest("hex"),
    product_name: identification.product_name,
    brand: identification.brand,
    model: identification.model,
    category: identification.category,
    confidence: identification.confidence,
    identity_status: identification.identity_status,
    objects: identification.objects || [],
    features: identification.features || [],
    ocr_text: identification.ocr_text,
    price_min: prices.length ? Math.min(...prices) : null,
    price_max: prices.length ? Math.max(...prices) : null,
    currency: listings[0]?.currency || null,
    prices_fetched_at: listings.length ? fetchedAt : null,
    provider_metadata: { vision_model: model, price_status: priceStatus },
  };
  let scan;
  let persistence = { status: "saved", message: null };
  try {
    scan = await supabaseInsert("product_scans", scanPayload);
  } catch (error) {
    if (isMissingColumn(error, "owner_id")) {
      const { owner_id, ...legacyPayload } = scanPayload;
      try {
        scan = await supabaseInsert("product_scans", legacyPayload);
      } catch (legacyError) {
        console.error("Legacy product scan persistence failed", legacyError);
        persistence = {
          status: "unavailable",
          message: "Scan history is not connected yet. Run supabase/product_lens_setup.sql in the Supabase SQL Editor to save future scans.",
        };
      }
    } else {
      console.error("Product scan persistence failed", error);
      persistence = {
        status: "unavailable",
        message: "Scan history is not connected yet. Run supabase/product_lens_setup.sql in the Supabase SQL Editor to save future scans.",
      };
    }
  }
  if (scan?.id) {
    try {
      await Promise.all(listings.map(async item => {
        const listingPayload = {
          scan_id: scan.id,
          owner_id: user.id,
          store: item.store,
          title: item.title,
          price: item.price,
          currency: item.currency,
          product_url: item.product_url,
          source_url: item.source_url,
          availability: item.availability,
          rating: item.rating,
          relevance: item.relevance,
          fetched_at: fetchedAt,
        };
        try {
          return await supabaseInsert("price_listings", listingPayload);
        } catch (error) {
          if (!isMissingColumn(error, "owner_id")) throw error;
          const { owner_id, ...legacyListingPayload } = listingPayload;
          return supabaseInsert("price_listings", legacyListingPayload);
        }
      }));
    } catch (error) {
      console.error("Some price listings could not be persisted", error);
    }
  }
  json(response, 200, {
    scan_id: scan?.id || `unsaved-${Date.now()}`,
    identification,
    pricing: { status: priceStatus, message: priceMessage, fetched_at: listings.length ? fetchedAt : null, listings },
    persistence,
    accuracy_note: "Exact identity requires visible model/SKU evidence. Verify retailer titles before purchase.",
  });
}
