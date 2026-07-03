export type Intent =
  | 'route' | 'expert' | 'general'
  | 'container' | 'vessel'
  | 'cbm' | 'cost' | 'dunnage'
  | 'email' | 'freight' | 'websearch'

export interface IntentResult {
  intent: Intent
  confidence: number
  params: Record<string, string>
  raw: string
}

const CONTAINER_PATTERNS = [
  /(?:track|find|check|status|where|rastrear|buscar|ver|localizar)\s*(?:container|contenedor|cont\.?)\s*#?([A-Za-z]{4}\s*\d{7}|\d{11})/i,
  /(?:container|contenedor|cont\.?)\s*(?:num(?:ber|ero)?|#|n\.?)?\s*:?\s*([A-Za-z]{4}\s*\d{7}|\d{11})/i,
  /^([A-Za-z]{4}\s*\d{7}|\d{11})$/,
  /(?:tracking|track|rastreo)\s*(?:n(?:um)?)?\s*([A-Za-z]{4}\s*\d{7}|\d{11})/i,
  /^(?:container|contenedor)\s+([A-Za-z]{4}\s*\d{7}|\d{11})$/i,
]

const VESSEL_PATTERNS = [
  /(?:track|find|check|position|where|rastrear|buscar|ver|localizar)\s*(?:vessel|buque|barco|ship|nave)\s*(?:called|named|name)?\s*[""']?(.+?)[""']?\s*(?:imo\s*(\d{7}))?/i,
  /(?:vessel|buque|barco|ship|nave)\s*:?\s*[""']?(.+?)[""']?(?:\s*imo\s*:?\s*(\d{7}))?/i,
  /^(?:vessel|buque|barco|ship|nave)\s+(.+?)(?:\s+imo\s+(\d{7}))?$/i,
  /imo\s*:?\s*(\d{7})/i,
]

const CBM_PATTERNS = [
  /cbm|volumen|volume|cubic|capacidad|container\s*load/i,
  /cuantos?\s*(?:pallet|palets|cajas|boxes|crates)\s*(?:en|por|per|of)\s*(?:container|contenedor|20|40)/i,
]

const COST_PATTERNS = [
  /cost(?:e|s|o)?\s*(?:por|per|x)\s*(?:pallet|palet|caja|box|unit|unidad)/i,
  /precio\s*(?:por|per|x)\s*(?:pallet|palet|caja|box|unit|unidad)/i,
  /cuanto\s*cuest(?:a|an)\s*(?:por|per|x)/i,
]

const DUNNAGE_PATTERNS = [
  /dunnage|void\s*fill|estiba|sujecion|sujección|trincaje|calzo|separador/i,
  /como\s*(?:asegurar|proteger|fijar|estibar)\s*(?:carga|mercancia)/i,
]

const EMAIL_PATTERNS = [
  /email|correo|mail|plantilla|template.*(?:email|correo)/i,
  /(?:escribir|redactar|enviar)\s*(?:un\s*)?(?:email|correo|mail)/i,
  /(?:negotiation|negociacion|reclamacion|claim|confirmation|confirmacion|clarification|aclaracion)/i,
]

const FREIGHT_PATTERNS = [
  /freight|flete|tarifa|rate|shipping\s*rate|precio\s*(?:maritimo|aereo|terrestre)/i,
  /(?:cuanto\s*cuesta|precio|tarifa|cotizacion)\s*(?:enviar|mandar|shipping|transportar)/i,
]

const WEBSEARCH_PATTERNS = [
  /buscar|search|encuentra|investiga|web|internet/i,
  /que\s*(?:es|son|significa)|como\s*funciona|definicion/i,
]

export function detectIntent(query: string): IntentResult {
  const raw = query.trim()
  const checks: [Intent, RegExp[]][] = [
    ['container', CONTAINER_PATTERNS],
    ['vessel', VESSEL_PATTERNS],
    ['cbm', CBM_PATTERNS],
    ['cost', COST_PATTERNS],
    ['dunnage', DUNNAGE_PATTERNS],
    ['email', EMAIL_PATTERNS],
    ['freight', FREIGHT_PATTERNS],
    ['websearch', WEBSEARCH_PATTERNS],
  ]

  const params: Record<string, string> = {}

  for (const [intent, patterns] of checks) {
    for (const pattern of patterns) {
      const match = raw.match(pattern)
      if (match) {
        if (intent === 'container') {
          params.containerNumber = (match[1] || match[0]).replace(/\s+/g, '').toUpperCase()
        } else if (intent === 'vessel') {
          params.vesselName = (match[1] || '').trim()
          params.imo = (match[2] || '').trim()
        }
        return { intent, confidence: 0.9, params, raw }
      }
    }
  }

  return { intent: 'general', confidence: 0.3, params, raw }
}
