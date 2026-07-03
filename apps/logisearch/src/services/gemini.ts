// AI Service — Logistics analysis with multi-provider fallback
// Uses aiProvider for automatic key rotation and fallback (Gemini → OpenRouter → Groq)
import { sendToAI } from './aiProvider'

// Core: send prompt to AI (with automatic key rotation + fallback)
export async function sendToGemini(prompt: string): Promise<string> {
  return sendToAI(prompt)
}

// Helper: parse JSON from Gemini response (handles markdown code blocks and conversational text)
function parseGeminiJSON(text: string): Record<string, unknown> | null {
  try {
    // Attempt to extract JSON from code blocks or raw braces
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const cleaned = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error('Failed to parse Gemini JSON:', error);
    return null;
  }
}

// Analyze route — works for national and international shipments
export async function analyzeRoute(origin: string, destination: string, mode: string, cargo: string = '') {
  const prompt = `
You are a senior logistics expert with deep knowledge of both NATIONAL and INTERNATIONAL shipping routes, regulations, and costs.

Analyze this shipment route and provide accurate, current data:

ORIGIN: ${origin}
DESTINATION: ${destination}
TRANSPORT MODE: ${mode === 'mar' ? 'Maritime/Sea' : mode === 'aire' ? 'Air freight' : 'Road/Land'}
CARGO: ${cargo || 'General merchandise'}

Determine if this is a NATIONAL (within same country) or INTERNATIONAL shipment.

Provide your response ONLY as valid JSON (no markdown, no explanation):
{
  "type": "national" or "international",
  "transitTime": "estimated transit time including units",
  "distance": "distance with units (km for land, nm for sea)",
  "mainRoute": "recommended primary route description",
  "bestSeason": "best season/period for shipping",
  "considerations": ["consideration 1", "consideration 2", "consideration 3", "consideration 4"],
  "estimatedCost": {
    "standard": "estimated price range in USD or EUR",
    "express": "estimated express price range"
  },
  "regulations": {
    "requiredDocuments": ["document 1", "document 2"],
    "customsRequired": true/false,
    "specialPermits": ["permit if needed"],
    "applicableRegulations": ["regulation 1", "regulation 2"]
  },
  "risks": ["risk 1", "risk 2"]
}

Use real, accurate data. If costs are variable, provide realistic ranges based on current market rates.
IMPORTANT: All text values in the JSON MUST be in Spanish (Castellano).
`
  const result = await sendToGemini(prompt)
  return parseGeminiJSON(result)
}

// Compare carriers — adapts to national vs international
export async function compareCarriers(origin: string, destination: string, mode: string) {
  const prompt = `
You are a logistics industry expert. Compare the top carriers/transport companies for this route:

ROUTE: ${origin} → ${destination}
MODE: ${mode === 'mar' ? 'Maritime' : mode === 'aire' ? 'Air freight' : 'Road/Land'}

If this is an INTERNATIONAL maritime route, consider: Maersk, MSC, COSCO, Hapag-Lloyd, ONE, Evergreen, CMA CGM, ZIM, Yang Ming.
If this is an INTERNATIONAL air route, consider: Lufthansa Cargo, Emirates SkyCargo, Cargolux, Qatar Airways Cargo, Turkish Cargo, Korean Air Cargo.
If this is a NATIONAL or EUROPEAN road route, consider: DB Schenker, DHL, Kuehne+Nagel, XPO Logistics, SEUR, Rhenus, GEFCO, Palletways, MRW Transporte.

Provide ONLY valid JSON (no markdown):
[
  {
    "name": "carrier name",
    "rating": 4.5,
    "transitTime": "estimated transit time",
    "priceLevel": "$ to $$$$",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1"],
    "services": ["service 1", "service 2"],
    "recommended": true/false,
    "contact": {
      "phone": "Real phone number string",
      "email": "Real or likely email (e.g. info@carrier.com)",
      "website": "Real official URL (e.g. https://www.carrier.com)"
    }
  }
]

Return exactly 5 carriers. Use real company data. It is CRITICAL that you provide realistic contact information (phone, email, website) for each carrier.
IMPORTANT: All text values (transitTime, strengths, weaknesses, services) MUST be in Spanish (Castellano).
`
  const result = await sendToGemini(prompt)
  const parsed = parseGeminiJSON(result)
  return Array.isArray(parsed) ? parsed : null
}

// Generate RFQ — fully compliant with trade regulations
export async function generateCustomRFQ(origin: string, destination: string, mode: string, cargoDetails: string) {
  const today = new Date()
  const deadline = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
  const dateStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const deadlineStr = deadline.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const prompt = `
You are a senior freight forwarder. Generate a professional RFQ (Request for Quotation) that fully complies with applicable trade regulations.

SHIPMENT DETAILS:
- Origin: ${origin}
- Destination: ${destination}
- Mode: ${mode === 'mar' ? 'Marítimo' : mode === 'aire' ? 'Aéreo' : 'Terrestre'}
- Cargo description: ${cargoDetails}
- Date: ${dateStr}
- Quotation deadline: ${deadlineStr}

Generate the RFQ in Spanish, professional tone, with these sections:

1. HEADER: "SOLICITUD DE COTIZACIÓN (RFQ)" with reference number (format: RFQ-YYYY-NNNN)
2. DATOS DEL SOLICITANTE: [Company placeholder for user to fill]
3. DESCRIPCIÓN DE LA CARGA: Based on the cargo details provided
4. RUTA Y MODALIDAD: Origin, destination, mode
5. REQUISITOS DE SERVICIO:
   - Incoterm preferred (recommend the most appropriate)
   - Insurance requirements
   - Packaging specifications
   - Special handling if needed
6. DOCUMENTACIÓN REQUERIDA: List ALL documents required by regulation for this specific route
   - For international: B/L or AWB, Commercial Invoice, Packing List, Certificate of Origin, customs declarations
   - For EU: EUR.1, T2L if applicable
   - For national: CMR, delivery note (albarán)
7. CONDICIONES:
   - Payment terms
   - Validity of quotation
   - Liability and insurance
8. NORMATIVA APLICABLE: Reference the specific regulations that apply
   - Incoterms® 2020 ICC
   - CMR Convention (road), Hague-Visby Rules (sea), Montreal Convention (air)
   - EU customs regulations if applicable
   - National transport regulations if applicable
9. FECHA LÍMITE DE RESPUESTA: ${deadlineStr}
10. DATOS DE CONTACTO: [Placeholder]

The document must be production-ready and legally sound for real business use.
`
  return sendToGemini(prompt)
}

// Analyze Incoterms with full regulatory context
export async function analyzeIncoterms(incoterm: string, productType: string = '') {
  const prompt = `
You are an international trade law expert. Explain the Incoterm® ${incoterm} (Incoterms® 2020, ICC) for ${productType || 'general merchandise'}.

Provide ONLY valid JSON (no markdown):
{
  "code": "${incoterm}",
  "name": "full official name",
  "group": "group (C, D, E, or F)",
  "description": "brief description",
  "sellerResponsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"],
  "buyerResponsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"],
  "riskTransferPoint": "exact point where risk transfers from seller to buyer",
  "costTransferPoint": "exact point where cost transfers",
  "recommendedFor": ["suitable scenario 1", "suitable scenario 2"],
  "notRecommendedFor": ["unsuitable scenario"],
  "transportModes": ["applicable transport modes"],
  "insuranceRequired": true/false,
  "documentsRequired": ["document 1", "document 2"]
}
IMPORTANT: All text values MUST be in Spanish (Castellano).
`
  const result = await sendToGemini(prompt)
  return parseGeminiJSON(result)
}

// Analyze regulations for a specific route
export async function analyzeRegulations(origin: string, destination: string, cargoType: string = '') {
  const prompt = `
You are a customs and trade compliance expert. Analyze the regulatory requirements for shipping from ${origin} to ${destination}.

Cargo type: ${cargoType || 'General merchandise'}

Provide ONLY valid JSON (no markdown):
{
  "shipmentType": "national" or "international",
  "customsRequired": true/false,
  "requiredDocuments": [
    { "name": "document name", "mandatory": true/false, "description": "brief description", "officialUrl": "Real URL to official source or template" }
  ],
  "applicableRegulations": [
    { "name": "regulation name", "reference": "official reference number", "description": "brief description", "officialUrl": "Real URL to BOE, EUR-Lex, etc." }
  ],
  "duties": {
    "estimatedDutyRate": "percentage or range",
    "vatApplicable": true/false,
    "vatRate": "percentage"
  },
  "restrictions": ["restriction if any"],
  "specialRequirements": ["requirement if any"],
  "estimatedCustomsClearanceTime": "estimated time"
}
IMPORTANT: Provide REAL URLs (officialUrl) pointing to official government/administration websites whenever possible.
IMPORTANT: All text values MUST be in Spanish (Castellano).
`
  const result = await sendToGemini(prompt)
  return parseGeminiJSON(result)
}

// Ask LogiSearch Expert (General Open Query)
export async function askExpert(query: string) {
    const prompt = `
You are LogiSearch AI, an elite logistics, freight, and international trade expert.
A user is asking you a direct question: "${query}"

Respond as a highly knowledgeable consultant.
Your answer MUST:
1. Be directly answering the user's question with deep expertise.
2. If the user's question is COMPLETELY UNRELATED to logistics, supply chain, freight, transportation, or international trade, you MUST politely decline to answer, briefly stating that your expertise is exclusively in logistics and you cannot assist with other topics.
3. Include concrete facts, official regulations, realistic timelines, or current industry prices.
4. INCLUDE LINKS: Provide real URLs to official documentation (e.g. BOE, Customs, Carrier sites, Trade Associations) formatted in standard markdown.
5. If applicable, mention real carrier names or contacts.
6. Provide a well-structured Markdown response (use headings, bold text, lists).

IMPORTANT: Respond entirely in Spanish (Castellano). Make your response rich, helpful, and highly professional.
`
  // Return raw string (not JSON)
  return sendToGemini(prompt)
}

// Ask LogiSearch General Assistant (Unrestricted)
export async function askGeneral(query: string) {
  const prompt = `
You are LogiSearch AI, a highly capable assistant.
A user is asking you a general question: "${query}"

Respond helpfully and intelligently to the user. You are NOT restricted to logistics in this mode.
You can answer any question. 
If applicable, include facts, links, and structure your answer in standard Markdown.
IMPORTANT: Respond entirely in Spanish (Castellano). Make your response helpful and polite.
`
  return sendToGemini(prompt)
}
