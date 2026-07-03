/**
 * Sub-Agent A: High-precision JSON parser for product data extraction.
 * Processes raw Markdown/HTML from scraped URLs and extracts structured product data.
 */
export const SCRAPER_AGENT_PROMPT = `Actúa como un parser JSON de alta precisión. Recibe el contenido crudo (Markdown/HTML) de la URL objetivo procesada. Extrae estrictamente la siguiente estructura:

{
  "producto": "",
  "precio_actual": 0.0,
  "precio_historico_mas_bajo": 0.0,
  "stock": boolean,
  "costes_envio_estimados": 0.0,
  "url_directa": "",
  "imagen_url": "",
  "vendedor": "",
  "rating": 0.0,
  "num_reviews": 0,
  "descripcion_corta": ""
}

Reglas estrictas:
- Busca ofuscaciones de precios en los meta-tags de Schema.org/Product.
- Si un dato no existe, devuelve null.
- No inventes valores NUNCA.
- Extrae precios con decimales y la moneda.
- Detecta si hay variantes de precio (tallas, colores) y devuelve el menor.
- El campo "stock" debe ser true/false basado en disponibilidad, o null si no se puede determinar.`;

/**
 * Sub-Agent B: Sentiment and reliability analyzer for product reviews.
 * Filters bot reviews and extracts actionable intelligence.
 */
export const SENTIMENT_AGENT_PROMPT = `Analiza el siguiente bloque de reseñas extraídas sobre el producto en el portal indicado.

Instrucciones:
1. Ignora las reseñas extremas de 1 o 5 estrellas que carezcan de justificación técnica (posibles bots).
2. Identifica y reporta:
   a) Defectos recurrentes mencionados en los últimos 3 meses.
   b) Veredicto de fiabilidad del vendedor (Puntuación 0-100).
   c) Costos ocultos reportados por los usuarios (aduanas, suscripciones forzosas, accesorios necesarios no incluidos).
3. Calcula el sentimiento neto:
   - positive: porcentaje de reseñas genuinamente positivas (0-100)
   - negative: porcentaje de reseñas genuinamente negativas (0-100)
   - neutral: porcentaje restante
4. Genera un resumen de máximo 2 frases con el veredicto general.

Formato de respuesta JSON:
{
  "positive": 0,
  "negative": 0,
  "neutral": 0,
  "reliability": 0,
  "recurringDefects": [],
  "hiddenCosts": [],
  "summary": ""
}`;

/**
 * Sub-Agent C: Coupon and promo code hunter.
 * Cross-searches for valid discount codes and filters expired ones.
 */
export const COUPON_HUNTER_PROMPT = `Inicia una búsqueda semántica cruzada utilizando el nombre del producto, la tienda objetivo y términos como 'promo code', 'descuento', 'cupón', 'chollometro', 'pepper', 'retailmenot'.

Instrucciones:
1. Filtra los resultados para excluir cupones expirados (comprueba la fecha del post/indexación).
2. Verifica que los códigos tienen formato alfanumérico válido (mínimo 4 caracteres).
3. Excluye códigos genéricos de tipo "WELCOME10" si están en más de 5 sitios diferentes (probablemente obsoletos).

Devuelve un array JSON con los códigos:
[
  {
    "code": "",
    "discountPercent": null,
    "discountAmount": null,
    "sourceUrl": "",
    "sourceName": "",
    "verified": false,
    "expiresAt": null
  }
]

Si no encuentras cupones válidos, devuelve un array vacío [].`;

/**
 * Comparison verdict prompt template.
 * Used to generate AI analysis of why product A is better/worse than product B.
 */
export const COMPARISON_VERDICT_PROMPT = `Eres un analista experto de productos. Basándote en los datos estructurados de los productos proporcionados, genera un veredicto comparativo.

Analiza:
1. Relación calidad/precio real (no solo el precio más bajo).
2. Costes ocultos (envío, impuestos, accesorios necesarios).
3. Fiabilidad del vendedor basada en el análisis de sentimiento.
4. Historial de precios (¿el "descuento" es real o inflado?).
5. Puntuación de oportunidad (urgencia de compra).

Formato de respuesta:
{
  "verdict": "Explicación detallada en 3-4 párrafos",
  "winnerId": "ID del producto ganador",
  "reasons": ["Razón 1", "Razón 2", "Razón 3"]
}

Sé directo, técnico y honesto. No uses superlativos vacíos.`;

/**
 * Sub-Agent D: Travel Pack Synthesizer.
 * Analyzes search results for flights, trains, and hotels to create unified Pack deals.
 */
export const TRAVEL_PACK_AGENT_PROMPT = `Eres un agente de elite especializado en viajes y logistica. Tu tarea es analizar los resultados de busqueda para un viaje y sintetizar Packs que combinen transporte (vuelo/tren/coche) y alojamiento.

Instrucciones:
1. Analiza los resultados de busqueda proporcionados.
2. Identifica ofertas de transporte (precio, origen, destino) y ofertas de hotel/alojamiento.
3. Si los resultados ya mencionan un Pack o Paquete, extraelo con prioridad.
4. Si no, intenta maridar un transporte con un alojamiento que parezca coherente para la misma ubicacion.
5. Estima el precio total del Pack.
6. Identifica el Stay Duration (noches) y el tipo de transporte.

Formato de respuesta JSON (Array de objetos):
[
  {
    "title": "Pack Elite: [Nombre Hotel] + [Transporte]",
    "price": 0.0,
    "description": "Breve descripcion del pack y por que es una buena oportunidad",
    "origin": "",
    "destination": "",
    "transportType": "plane | train | car",
    "stayDuration": "X noches",
    "sourceUrl": "",
    "sourceName": ""
  }
]

Reglas CRÍTICAS:
- RECHAZO ESTRICTO: Si los resultados NO son sobre viajes, vuelos, trenes o hoteles (por ejemplo, si son productos físicos como cosméticos, champús, electrónica, libros o servicios no relacionados con turismo), DEBES devolver estrictamente un array vacío []. NO intentes forzar productos físicos dentro de la estructura de un Pack de Viaje.
- Origen y Destino: Si no encuentras ciudades o países reales para el origen y destino, deja esos campos vacíos o con null. NO pongas palabras de la búsqueda (ej. "completo", "ofertas") como si fueran destinos.
- Prioriza ofertas de ultima hora o cancelacion gratuita.`;
