import { NextRequest, NextResponse } from "next/server";

interface AIDestination {
  name: string;
  country: string;
  lat: number;
  lon: number;
  hotelName: string;
  accommodationType: string;
  pricePerNight: number;
  amenities: string[];
  familyScore: number;
  familyNotes: string;
  stars: number;
  image: string;
  imageUrl?: string;
  url?: string;
  flightPrice?: number;
  trainPrice?: number;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function tavilySearch(query: string, apiKey: string): Promise<{ results: any[]; images: string[] }> {
  const res = await fetchWithTimeout("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 10,
      include_images: true,
      include_image_descriptions: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  const data = await res.json();
  return {
    results: data.results || [],
    images: data.images || [],
  };
}

const DEFAULT_PRICES: Record<string, number> = {
  salou: 145, tarragona: 120, barcelona: 190, valencia: 140,
  "costa dorada": 135, "costa brava": 160,
  pirineos: 110, ordessa: 105, huesca: 100, lleida: 95, andorra: 150,
  mallorca: 190, menorca: 175, ibiza: 210, tenerife: 200,
  biarritz: 220, toulouse: 160, carcassonne: 135,
  "la londe": 160, "baux-de-provence": 250, provence: 200,
  madrid: 160, zaragoza: 105, "san sebastian": 195, paris: 250,
  londres: 280, roma: 210, lisboa: 185, olot: 110, arnes: 95,
};

function fallbackPrice(name: string): number {
  const key = Object.entries(DEFAULT_PRICES).find(([k]) => name.toLowerCase().includes(k));
  return key ? key[1] : 120;
}

async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=600&origin=*`,
      { method: "GET" },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0] as any;
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

function picsumUrl(name: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(name.replace(/\s+/g, ""))}/600/400`;
}

function getBookingUrl(name: string, dateFrom?: string, dateTo?: string): string {
  const checkin = dateFrom || "";
  const checkout = dateTo || "";
  const ss = encodeURIComponent(name);
  return `https://www.booking.com/searchresults.html?ss=${ss}&checkin=${checkin}&checkout=${checkout}&group_adults=2&group_children=1&age=3&lang=es`;
}

async function groqExtract(searchResults: any[], apiKey: string): Promise<AIDestination[]> {
  const simplified = searchResults.slice(0, 6).map((r: any) => ({
    title: r.title || "",
    content: (r.content || "").slice(0, 500),
    url: r.url || "",
  }));

  const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Extract travel destinations into JSON.
Each object: name (city), country, lat (number), lon (number), hotelName, accommodationType ("hotel","apartamento","casa"), pricePerNight (number EUR, TOTAL per night for family of 3, min 80), amenities (array).
Return ONLY: { "destinations": [...] }`,
        },
        { role: "user", content: JSON.stringify(simplified) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq error: ${res.status} — ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  let content: any = {};
  try {
    content = JSON.parse(data.choices[0]?.message?.content || "{}");
  } catch {
    content = {};
  }
  const destinations: AIDestination[] = content.destinations || [];

  const urlMap = new Map<string, string>();
  for (const s of simplified) {
    const titleLower = s.title.toLowerCase();
    for (const d of destinations) {
      if (
        titleLower.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(titleLower.split("—")[0]?.trim()?.toLowerCase() || "")
      ) {
        if (s.url) urlMap.set(d.name.toLowerCase(), s.url);
      }
    }
  }

  return destinations.map((d) => {
    const matchedUrl = urlMap.get(d.name.toLowerCase());
    return {
      ...d,
      accommodationType: d.accommodationType || "hotel",
      pricePerNight: d.pricePerNight && d.pricePerNight >= 80 ? d.pricePerNight : fallbackPrice(d.name),
      imageUrl: "",
      url: matchedUrl || "",
      stars: d.stars || 4,
      image: "🌍",
      familyScore: 0.8,
      familyNotes: "",
    };
  });
}

function heuristicFamilyScore(amenities: string[], name = "", hotelName = ''): number {
  const text = [name, hotelName, ...amenities].join(" ").toLowerCase();
  let score = 0.4;
  if (/cuna|crib|baby|infantil|niños|children|kids/i.test(text)) score += 0.15;
  if (/parque|playground|club|kids.?club/i.test(text)) score += 0.15;
  if (/piscina|pool|swimming/i.test(text)) score += 0.1;
  if (/restaurante|restaurant|comida|meal|buffet|men.? infantil/i.test(text)) score += 0.1;
  if (/playa|beach|costa|resort/i.test(text)) score += 0.05;
  if (/familiar|family|tranquilo|quiet/i.test(text)) score += 0.1;
  if (/village|club|camping|aparthotel/i.test(text)) score += 0.05;
  return Math.min(1, Math.max(0.3, Math.round(score * 100) / 100));
}

async function geminiRequest(prompt: string, key: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    },
    20000
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function openrouterScore(destinations: AIDestination[], apiKey: string): Promise<{ name: string; familyScore: number; familyNotes: string }[] | null> {
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Evalúa cada hotel para Manu, Arantxa y su hija Edelweiss (3.5 años). Devuelve JSON array: [{ "name", "familyScore": 0-1, "familyNotes" }]. Datos: ${JSON.stringify(
                destinations
              )}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
      15000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);
    const arr = Array.isArray(content) ? content : content.destinations || content.scores || [];
    return arr.filter((s: any) => s.name);
  } catch {
    return null;
  }
}

async function geminiScore(destinations: AIDestination[], geminiKeys: string[], openrouterKey: string): Promise<AIDestination[]> {
  if (destinations.length === 0) return [];

  const prompt = `Evalúa cada hotel para Manu, Arantxa y su hija Edelweiss (3.5 años) desde Mequinenza.
Asigna familyScore 0.0-1.0 y familyNotes en español.
Responde SOLO JSON array [{ "name", "familyScore", "familyNotes" }].
Datos: ${JSON.stringify(destinations, null, 2)}`;

  let text = "";
  if (geminiKeys.length > 0) {
    for (let attempt = 0; attempt < geminiKeys.length; attempt++) {
      const key = geminiKeys[attempt % geminiKeys.length];
      await new Promise((r) => setTimeout(r, attempt * 500));
      try {
        text = await geminiRequest(prompt, key);
        break;
      } catch {
        continue;
      }
    }
  }

  let scores: { name: string; familyScore: number; familyNotes: string }[] = [];
  if (!text) {
    const or = await openrouterScore(destinations, openrouterKey);
    if (or) scores = or;
  } else {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      scores = JSON.parse(cleaned);
    } catch {
      try {
        const match = cleaned.match(/\[[\s\S]*\]/);
        scores = match ? JSON.parse(match[0]) : [];
      } catch {
        scores = [];
      }
    }
  }

  const scoreMap = new Map(scores.map((s) => [s.name, s]));
  return destinations.map((d) => ({
    ...d,
    familyScore: scoreMap.get(d.name)?.familyScore ?? heuristicFamilyScore(d.amenities, d.name, d.hotelName),
    familyNotes: scoreMap.get(d.name)?.familyNotes ?? "",
  }));
}

async function fetchRealFlightPrices(destinations: AIDestination[], dateFrom: string, tavilyKey: string, groqKey: string): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  const query = `vuelos a ${destinations
    .map((d) => d.name)
    .slice(0, 3)
    .join(" ")} desde Zaragoza ${dateFrom || ""} billete ida y vuelta familia`;
  try {
    const res = await fetchWithTimeout("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "basic", max_results: 5 }),
    });
    if (!res.ok) return priceMap;
    const data = await res.json();
    const groq = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Extract real flight prices for families (3 pax) round trip. Return JSON: { "prices": [{"name": "city", "priceEur": number}] }. Use 180 as fallback.`,
          },
          {
            role: "user",
            content: JSON.stringify(data.results?.slice(0, 5) || []),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!groq.ok) return priceMap;
    const gData = await groq.json();
    const parsed = JSON.parse(gData.choices[0].message.content);
    const prices = parsed.prices || parsed.flights || parsed.destinations || [];
    if (Array.isArray(prices)) {
      prices.forEach((p: any) => {
        if (p.name && p.priceEur) priceMap.set(p.name.toLowerCase(), p.priceEur);
      });
    }
  } catch {
    /* ignore */
  }
  return priceMap;
}

async function fetchRealTrainPrices(destinations: AIDestination[], tavilyKey: string, groqKey: string): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  const query = `tren a ${destinations
    .map((d) => d.name)
    .slice(0, 3)
    .join(" ")} desde Zaragoza billete familia`;
  try {
    const res = await fetchWithTimeout("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "basic", max_results: 5 }),
    });
    if (!res.ok) return priceMap;
    const data = await res.json();
    const groq = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Extract real train prices for families (3 pax) round trip. Return JSON: { "prices": [{"name": "city", "priceEur": number}] }. Use 80 as fallback.`,
          },
          {
            role: "user",
            content: JSON.stringify(data.results?.slice(0, 5) || []),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!groq.ok) return priceMap;
    const gData = await groq.json();
    const parsed = JSON.parse(gData.choices[0].message.content);
    const prices = parsed.prices || parsed.trains || parsed.destinations || [];
    if (Array.isArray(prices)) {
      prices.forEach((p: any) => {
        if (p.name && p.priceEur) priceMap.set(p.name.toLowerCase(), p.priceEur);
      });
    }
  } catch {
    /* ignore */
  }
  return priceMap;
}

function enrichWithImages(destinations: AIDestination[]): AIDestination[] {
  const emojiMap: Record<string, string> = {
    playa: "🏖️", costa: "🏖️", salou: "🏖️", valencia: "🌊",
    montaña: "⛰️", pirineos: "⛰️", ordesa: "⛰️", pireneus: "⛰️",
    ciudad: "🏙️", barcelona: "🏙️", madrid: "🏙️", zaragoza: "🏙️",
    rural: "🌿", isla: "🏝️", mallorca: "🏝️", menorca: "🏝️",
    francia: "🇫🇷", biarritz: "🇫🇷", andorra: "🏔️",
    paris: "🗼", londres: "🇬🇧", roma: "🇮🇹", lisboa: "🇵🇹",
  };
  return destinations.map((d) => {
    const lower = d.name.toLowerCase();
    const found = Object.entries(emojiMap).find(([key]) => lower.includes(key));
    return {
      ...d,
      stars: d.stars || 4,
      image: found ? found[1] : "🌍",
      amenities: d.amenities?.length ? d.amenities : ["piscina", "restaurante_ninos"],
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, dateFrom, dateTo, accommodationType } = body;

    const tavilyKey = process.env.TAVILY_KEY || process.env.TAVILY_API_KEY || "";
    const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY || "";
    const geminiKeys = [
      process.env.GEMINI_KEY || process.env.GEMINI_API_KEY || "",
      process.env.GEMINI_KEY_2 || process.env.GEMINI_API_KEY_2 || "",
      process.env.GEMINI_KEY_3 || process.env.GEMINI_API_KEY_3 || "",
    ].filter(Boolean);
    const openrouterKey = process.env.OPENROUTER_KEY || "";

    if (!tavilyKey) throw new Error("TAVILY_API_KEY is not configured on server.");
    if (!groqKey) throw new Error("GROQ_API_KEY is not configured on server.");

    const accomFilter = accommodationType && accommodationType !== "all" ? ` ${accommodationType}` : "";
    const searchQuery = destination
      ? `${accomFilter || "hoteles"} familiares en ${destination} vacaciones con niños parque infantil`
      : `${accomFilter || "hoteles"} familiares costa dorada pirineos sur francia vacaciones niños parque infantil`;

    const { results } = await tavilySearch(searchQuery, tavilyKey);
    if (results.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const extracted = await groqExtract(results, groqKey);
    if (extracted.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const scored = await geminiScore(extracted, geminiKeys, openrouterKey);
    const enriched = enrichWithImages(scored);

    // Fetch real transport prices
    const [flightPrices, trainPrices] = await Promise.all([
      fetchRealFlightPrices(enriched, dateFrom, tavilyKey, groqKey),
      fetchRealTrainPrices(enriched, tavilyKey, groqKey),
    ]);

    // Fetch real images from Wikipedia for each destination (max 3 concurrent)
    const withImages: AIDestination[] = [];
    const BATCH_SIZE = 3;
    for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
      const batch = enriched.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (d) => {
          const lower = d.name.toLowerCase();
          const realFlight = flightPrices.get(lower);
          const realTrain = trainPrices.get(lower);
          const wikiImg = await fetchWikipediaImage(d.name);
          return {
            ...d,
            flightPrice: realFlight || undefined,
            trainPrice: realTrain || undefined,
            imageUrl: wikiImg || picsumUrl(d.name),
            url: d.url || getBookingUrl(d.name, dateFrom, dateTo),
          };
        })
      );
      withImages.push(...batchResults);
    }

    const sorted = withImages.sort((a, b) => (b.familyScore ?? 0) - (a.familyScore ?? 0));

    return NextResponse.json({ success: true, data: sorted });
  } catch (error: any) {
    console.error("Family travel backend API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
