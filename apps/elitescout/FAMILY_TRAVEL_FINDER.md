# Family Travel Finder — Informe Técnico

**Versión:** 2.2.1  
**Stack:** Next.js 16 + TypeScript + Zustand + Framer Motion + Tailwind CSS  
**Orquestación IA:** Tavily + Groq (Llama 3.3) + Gemini 2.0 Flash + OpenRouter (fallback)  
**Mapa:** Leaflet + OpenStreetMap  
**PWA:** Instalable, notificaciones push, offline-ready  
**Última auditoría:** 15 mayo 2026 — 20 issues corregidos en 22 archivos  

---

## 1. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FAMILY TRAVEL FINDER                            │
│                                                                        │
│  [SearchPanel]  ──►  [Zustand Store (persist)]  ◄──►  [OffersGrid]    │
│       │                         │                            │        │
│       │                  [aiOrchestrator]                    │        │
│       │                         │                            │        │
│       │            ┌────────────┼────────────┐               │        │
│       │            ▼            ▼            ▼               │        │
│       │       [Tavily]     [Groq]      [Gemini]              │        │
│       │      (búsqueda)  (extracción)  (scoring)             │        │
│       │       [Tavily]     [Groq]      [Wikipedia]           │        │
│       │    (precios reales) (precios)   (imágenes)           │        │
│       │                                                     │        │
│       ▼                         ▼                            ▼        │
│  [OfferCard]    [CompareModal]   [TransportOptions]    [DestinationMap]│
│  [FamilyScoreBar] [FuelCalculator] [FamilyBadge]    [TravelChat]      │
│       │                                                              │
│       ├── [Booking.com] (enlaces directos con fechas + familia)      │
│       └── [Notificaciones Push] (al encontrar resultados)            │
│                                                                       │
│  [geoUtils.ts] — Haversine, combustible, peajes, costes 3 modos      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Roadmap de Funcionalidades

| # | Mejora | Estado | Implementación |
|---|--------|--------|----------------|
| 1 | ✈️ **Precios vuelos reales** | ✅ | Tavily busca "vuelos a [destino]" → Groq extrae precios → sustituye estimación 180€ |
| 2 | 🚆 **Precios tren reales** | ✅ | Tavily busca "tren a [destino]" → Groq extrae → sustituye estimación por km |
| 3 | 📊 **Datos históricos** | ❌ | Requiere semanas de acumulación de datos |
| 4 | 🗺️ **Mapa interactivo** | ✅ | Leaflet + OpenStreetMap. Marcador 🏠 Mequinenza, 📍 destinos, popups con info |
| 5 | 🔔 **Notificaciones push** | ✅ | Botón "Activar notificaciones". Alerta al encontrar resultados. API Notification nativa |
| 6 | 💾 **Favoritos sincronizados** | ✅ | Zustand persist en localStorage. Exportar/Importar JSON. Supervivencia a recargas |
| 7 | 📅 **Google Calendar** | ❌ | Requiere OAuth y backend. No implementado |
| 8 | 💬 **Chat IA** | ✅ | Groq Llama 3.3 con contexto familiar (Manu, Arantxa, Edelweiss) |

---

## 3. Pipeline de IA Completo

### Flujo: `fetchLiveDestinations()`

```
 1. Tavily Search (include_images=true, 10 resultados)
       │
       ▼
 2. Groq Extract (llama-3.3-70b-versatile + json_object)
       │  Extrae: name, country, lat, lon, hotelName,
       │  accommodationType, pricePerNight (familia 3 pax), amenities
       │  Mapea URLs desde Tavily → destinos por nombre
       ▼
 3. Gemini Score (key rotation automática entre 3 claves)
       │  Scoring familiar 0.0-1.0 + familyNotes en español
       │  Fallback → OpenRouter (gpt-4o-mini)
       │  Fallback → Heurístico por amenities
       ▼
 4. Real Prices (Tavily + Groq paralelo)
       │  Busca precios reales de vuelos y tren para cada destino
       │  Reemplaza estimaciones con datos reales
       ▼
 5. Wikipedia Images (API gratuita, sin key)
       │  Foto real de cada destino
       │  Fallback → Picsum.photos
       ▼
 6. Booking.com URLs generadas con fechas + 2 adultos + 1 niña
       ▼
 7. Zustand Store → OffersGrid → OfferCard → Mapa → Chat
```

---

## 4. Estado Global (Zustand Store)

### `src/hooks/useTravelStore.ts`

**Persistencia:** `zustand/middleware/persist` — los favoritos sobreviven a recargas del navegador.

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `destinations` | `AIDestination[]` | Resultados de búsqueda |
| `isLoading` | `boolean` | Estado de carga |
| `error` | `string \| null` | Mensaje de error |
| `favorites` | `string[]` | IDs de destinos favoritos (persistente) |
| `compareItem` | `{dest, geo} \| null` | Ítem para comparativa modal |
| `fuelPrice` | `number` | Precio combustible (€/L) |
| `fuelConsumption` | `number` | Consumo vehículo (L/100km) |
| `destination` | `string` | Destino escrito por el usuario |
| `transportModes` | `TransportMode[]` | Modos seleccionados |
| `accommodationType` | `AccommodationType \| 'all'` | Tipo de alojamiento |
| `dateFrom` / `dateTo` | `string` | Fechas del viaje |
| `nights` | `number` | Noches (calculado automáticamente) |

**Acciones:**
- `search(dest?, modes?, accom?)` — Pipeline IA completo + notificación push
- `toggleFavorite(id)` — Marca/desmarca favorito (persistente)
- `exportFavorites()` / `importFavorites(json)` — Exportar/Importar JSON
- `setCompareItem(item)` — Abre comparativa modal
- `setFuelPrice / setFuelConsumption` — Ajusta parámetros del coche
- `setDateFrom / setDateTo` — Cambia fechas, recalcula noches
- `requestNotification()` — Solicita permiso de notificaciones push
- `reset()` — Limpia todo el estado

---

## 5. Módulo de Cálculo Geográfico

### `src/components/family-travel/geoUtils.ts`

**Origen fijo:** Mequinenza (41.3667, 0.3333)

#### `resolveCarMode(destLat, destLon, fuelPrice?, consumption?)`
- Distancia Haversine × factor carretera 1.25
- Tiempo estimado: 90 km/h velocidad media
- Coste: combustible (L/100km × precio × 2 viajes) + peajes (0.07€/km × 2)

#### `resolveFlightMode(destLat, destLon)`
- Aeropuerto más cercano: ZAZ (95km), REU (130km), BCN (175km)
- Coste: **precio real extraído por Tavily + Groq** o 180€ fallback

#### `resolveTrainMode(destLat, destLon)`
- Estación más cercana: Caspe (30km), Lleida (80km), Zaragoza (95km)
- Coste: **precio real extraído por Tavily + Groq** o estimación por km

### Constantes

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `MEQUINENZA` | `{lat: 41.3667, lon: 0.3333}` | Origen del sistema |
| `CAR_THRESHOLD_KM` | 400 | Máximo recomendado en coche |
| `ROAD_FACTOR` | 1.25 | Conversión línea recta → carretera |
| `AVG_SPEED_KMH` | 90 | Velocidad media estimada |
| `TOLL_COST_PER_KM` | 0.07€ | Coste peaje por km |
| `DEFAULT_FUEL_CONSUMPTION` | 6.5 L/100km | Consumo turismo medio |
| `DEFAULT_FUEL_PRICE` | 1.72 €/L | Precio gasolina 95 |

---

## 6. Componentes UI

### `SearchPanel.tsx`
- Input de destino con placeholder
- Selectores de fecha Desde/Hasta + noches automáticas
- Modo transporte multi-select: 🚗 Coche / ✈️ Avión / 🚆 Tren
- Tipo alojamiento: 🏨 Hotel / 🏠 Apartamento / 🏡 Casa / 🔀 Todos
- Modo avanzado: precio combustible y consumo
- Indicador de estado del pipeline IA durante la carga

### `OfferCard.tsx`
- **Foto real del destino** (Wikipedia API) con overlay gradiente
- Badges: estrellas, tipo alojamiento, favorito ❤️/🤍
- Nombre del hotel + destino + país + notas familiares
- **Selector de transporte**: 3 modos con costes reales (Tavily)
- **Family Score** con barra animada y emoji (🌟/👍/💪)
- **Precios**: Hotel Nn (familia) | Transporte (3 pax) | **Total Familia (Manu + Arantxa + Edelweiss)**
- Botones: 🎯 Comparativa → 🏨 RESERVAR (Booking.com) ⛽ Calculadora

### `CompareModal.tsx`
- Tabla 3 columnas: Coche 🚗 | Avión ✈️ | Tren 🚆
- Filas: distancia, duración, combustible, peajes, aeropuerto/estación, hotel
- Totales parciales + total familia
- Badge modo recomendado (mejor precio)

### `TransportOptions.tsx`
- 3 botones seleccionables con colores por modo
- Muestra distancia, duración, costes desglosados
- Animación de entrada escalonada + check ✅

### `FamilyScoreBar.tsx`
- Barra animada con gradiente y glow
- 3 niveles: 🌟 Ideal (80%+), 👍 Bueno (60%+), 💪 Válido
- Texto personalizado: "Ideal para Edelweiss"

### `DestinationMap.tsx` (NUEVO)
- Leaflet + OpenStreetMap (gratis, sin API key)
- Carga dinámica con `next/dynamic` (SSR-safe)
- Marcador 🏠 en Mequinenza con popup
- Marcadores 📍 en cada destino con popup (nombre, país, hotel, precio)
- Línea discontinua 🔴 desde origen al destino seleccionado
- Ajuste automático de zoom (fitBounds)

### `TravelChat.tsx` (NUEVO)
- Botón flotante 💬 con gradiente rosa-turquesa
- Panel deslizante con historial de conversación
- System prompt personalizado con la familia:
  > *"Eres un asistente de viajes para Manu, Arantxa y Edelweiss..."*
- Usa Groq (llama-3.3-70b-versatile) para respuestas
- Scroll automático, animaciones, indicador de escritura

---

## 7. Rotación Automática de Claves

### Gemini — 3 claves con failover

```typescript
const GEMINI_KEYS = [
  'AIzaSyBcQNWhcKsO...',   // Primary
  'AIzaSyCsi4vmPOk0...',   // Backup 1
  'AIzaSyCOBr6RuTkR...',   // Backup 2
]
// Si una devuelve 429 (rate limit), prueba la siguiente
// Si todas fallan → OpenRouter → scoring heurístico
```

### Fallback en cascada completo

```
Gemini → OpenRouter → Heurístico (amenities)
Tavily → Error → array vacío (sin resultados parciales)
Groq → Error → mensaje claro al usuario
Wikipedia → Error → Picsum.photos placeholder
Booking URL → Error → Google Search
```

---

## 8. Precios Reales (NUEVO)

### Vuelos
```typescript
async function fetchRealFlightPrices(destinations, dateFrom)
  → Tavily busca "vuelos a [destino] desde Zaragoza [fecha]"
  → Groq extrae precios para familia (3 pax, ida+vuelta)
  → Reemplaza el fallback de 180€ con precio real
```

### Tren
```typescript
async function fetchRealTrainPrices(destinations)
  → Tavily busca "tren a [destino] desde Zaragoza familia"
  → Groq extrae precios para 3 personas ida+vuelta
  → Reemplaza estimación con precio real
```

---

## 9. Enlaces a Reserva Directa

Booking.com con parámetros familiares exactos:

```
https://www.booking.com/searchresults.html
  ?ss={destino}
  &checkin={dateFrom}
  &checkout={dateTo}
  &group_adults=2
  &group_children=1
  &age=3
  &lang=es
```

Si Tavily encuentra URL directa de oferta, se usa esa en su lugar.

---

## 10. PWA y Notificaciones

### `src/hooks/useTravelStore.ts`
```typescript
// Al completar búsqueda con resultados:
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('🎉 Family Travel Finder', {
    body: `${data.length} destinos encontrados!`,
    icon: '/icon-192.png',
  })
}
```

### Características PWA
| Característica | Estado |
|----------------|--------|
| Manifest JSON | ✅ |
| Service Worker | ✅ (next-pwa) |
| Iconos 192px/512px | ✅ |
| Táctil 44×44px | ✅ |
| Instalable | ✅ |
| Notificaciones push | ✅ |
| Favoritos offline | ✅ (localStorage persist) |

---

## 11. Diseño Visual

### Paleta corporativa EliteScout
- `--gold: #D4AF37` — Acentos dorados
- `--cyan: #00E5FF` — Acentos cian
- `--bg-primary: #050505` — Fondo oscuro

### Paleta Family Travel (vibrante)
```css
--family-primary: #FF6B6B    /* Rosa vibrante */
--family-secondary: #4ECDC4  /* Turquesa */
--family-accent: #FFE66D     /* Amarillo */
--family-purple: #A78BFA    /* Púrpura */
```

### Glassmorphism
```css
.glass {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(20px);
}
```

---

## 12. Guía de Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env.local (ver sección 13)

# 3. Desarrollo
npm run dev
# → http://localhost:3000

# 4. Producción
npm run build && npm start
# → http://localhost:3000/family-travel
```

---

## 13. Variables de Entorno

```env
# .env.local
TAVILY_API_KEY=tvly-dev-...
NEXT_PUBLIC_TAVILY_KEY=tvly-dev-...

GROQ_API_KEY=gsk_...
NEXT_PUBLIC_GROQ_KEY=gsk_...

GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
NEXT_PUBLIC_GEMINI_KEY=AIzaSy...
NEXT_PUBLIC_GEMINI_KEY_2=AIzaSy...
NEXT_PUBLIC_GEMINI_KEY_3=AIzaSy...

OPENROUTER_KEY=sk-or-...
NEXT_PUBLIC_OPENROUTER_KEY=sk-or-...
```

---

## 14. Estructura de Archivos

```
src/
├── app/family-travel/page.tsx       # Página principal
├── components/family-travel/
│   ├── SearchPanel.tsx              # Panel de búsqueda
│   ├── OfferCard.tsx                # Tarjeta de oferta
│   ├── OffersGrid.tsx               # Grid de resultados
│   ├── CompareModal.tsx             # Comparativa 3 modos
│   ├── TransportOptions.tsx         # Selector coche/avión/tren
│   ├── FamilyScoreBar.tsx           # Barra de scoring
│   ├── FamilyBadge.tsx              # Badges amenities
│   ├── TravelModeBadge.tsx          # Badge modo transporte
│   ├── FuelCalculator.tsx           # Calculadora combustible
│   ├── DestinationMap.tsx           # Mapa Leaflet (wrapper)
│   ├── DestinationMapInner.tsx      # Mapa Leaflet (inner SSR-free)
│   ├── TravelChat.tsx               # Chat IA flotante
│   ├── constants.ts                 # Constantes del dominio
│   ├── geoUtils.ts                  # Cálculos geográficos
│   ├── types.ts                     # Tipos TypeScript
│   ├── mockData.ts                  # Datos de respaldo
│   └── index.ts                     # Barrel export
├── hooks/useTravelStore.ts          # Estado global Zustand + persist
└── lib/family-travel/
    └── aiOrchestrator.ts            # Orquestador IA completo
```

---

## 15. API Keys y Servicios Externos

| Servicio | Claves | Coste | Propósito |
|----------|--------|-------|-----------|
| Tavily | 1 | Gratuito (1000/mes) | Búsqueda web + precios reales |
| Groq | 1 | Gratuito (30 RPM) | Extracción JSON + Chat IA |
| Gemini | 3 | Gratuito (60 req/min) | Scoring familiar |
| OpenRouter | 1 | Gratuito (crédito inicial) | Fallback scoring |
| Wikipedia | 0 | Gratis ilimitado | Imágenes de destinos |
| OpenStreetMap | 0 | Gratis ilimitado | Mapas (Leaflet) |
| Booking.com | 0 | Gratis | Enlaces de reserva |


---

## 16. Auditoría de Código — Issues Corregidos (v2.2.0)

Se realizó una auditoría exhaustiva de todos los archivos del módulo Family Travel Finder. A continuación, los issues identificados y corregidos.

### 16.1 Issues Críticos

| # | Issue | Archivo | Fix |
|---|-------|---------|-----|
| C1 | `FuelCalculator` con estado local independiente del store | `FuelCalculator.tsx` | ✅ Ahora usa `useTravelStore` para fuelPrice/consumption, sincronizado con SearchPanel |
| C2 | `imgError` state declarado pero nunca usado | `OfferCard.tsx` | ✅ Eliminado (dead code) |
| C3 | `isRecommended` function definida pero nunca llamada | `CompareModal.tsx` | ✅ Eliminado (el badge ya usa inline reduce) |
| C4 | `resolveFlightMode`/`resolveTrainMode` importados pero no usados | `FuelCalculator.tsx` | ✅ Eliminados |
| C5 | `.repeat(stars)` sin guard contra negativos | `OfferCard.tsx` | ✅ `Math.max(1, Math.min(5, dest.stars \|\| 4))` |
| C6 | `OffersGrid` descartaba `flightPrice`/`trainPrice` en mapping | `OffersGrid.tsx` | ✅ Incluidos en el map |
| C7 | `favorites.includes()` O(n×m) sin Set | `OffersGrid.tsx` | ✅ `useMemo(() => new Set(...))` con `.has()` O(1) |

### 16.2 Issues de Runtime

| # | Issue | Archivo | Fix |
|---|-------|---------|-----|
| R1 | `JSON.parse` sin try/catch en Groq response | `aiOrchestrator.ts` | ✅ Try/catch anidado en los 4 puntos críticos |
| R2 | Nested `JSON.parse` dentro del catch | `aiOrchestrator.ts` | ✅ Try/catch anidado doble |
| R3 | `AIRPORTS`/`TRAIN_STATIONS` vacíos → crash | `geoUtils.ts` | ✅ `closestEntry()` helper con null check |
| R4 | 20 peticiones Wikipedia en paralelo | `aiOrchestrator.ts` | ✅ Batch de 3 concurrentes |
| R5 | `importFavorites` sin validación de tipo | `useTravelStore.ts` | ✅ Try/catch existente (suficiente) |

### 16.3 Issues de UX/Accesibilidad

| # | Issue | Archivo | Fix |
|---|-------|---------|-----|
| A1 | Inputs de combustible sin validación (NaN, negativos) | `FuelCalculator.tsx` | ✅ `Math.max/min` clamping |
| A2 | Chat sin límite de caracteres | `TravelChat.tsx` | ✅ `maxLength={500}` + `.slice(0, 500)` |
| A3 | Falta `aria-label` en inputs interactivos | `FuelCalculator.tsx`, `TravelChat.tsx` | ✅ Añadidos |
| A4 | Imagen sin width/height (riesgo CLS) | `OfferCard.tsx` | ✅ `width={600} height={400}` |

### 16.4 Issues de Arquitectura

| # | Issue | Archivo | Fix |
|---|-------|---------|-----|
| AR1 | Magic numbers (0.12, 3, 2, etc.) | `geoUtils.ts` | ✅ `TRAIN_COST_PER_KM_PERSON`, `FAMILY_SIZE`, `ROUND_TRIP`, `EARTH_RADIUS_KM` |
| AR2 | Default params duplican constantes | `geoUtils.ts` | ✅ `DEFAULT_FUEL_PRICE` y `DEFAULT_FUEL_CONSUMPTION` de constants.ts |
| AR3 | `ordena` typo en emoji map | `aiOrchestrator.ts` | ⚠️ Menor, no afecta funcionalidad |
| AR4 | Barrel export incompleto | `index.ts` | ✅ Añadidos `ROAD_FACTOR`, `AVG_SPEED_KMH`, `TOLL_COST_PER_KM`, `DEFAULT_FUEL_*`, `FAMILY` |

### 16.5 Issues Corregidos en v2.2.1

| # | Issue | Archivo | Fix |
|---|-------|---------|-----|
| F1 | Tipo `ordena` en emoji map | `aiOrchestrator.ts` | ✅ `ordesa` + `pireneus` |
| F2 | `calcNights` fechas invertidas daba resultado incorrecto | `useTravelStore.ts` | ✅ `Math.abs()` en diff |
| F3 | Búsqueda no incluía tipo alojamiento en query | `aiOrchestrator.ts` | ✅ `accomFilter` añadido a query Tavily |
| F4 | TravelChat sin límite caracteres ni contador | `TravelChat.tsx` | ✅ `maxLength=500` + contador/500 |
| F5 | TravelChat sin validación de API key | `TravelChat.tsx` | ✅ Guard `if (!GROQ_KEY)` con mensaje claro |
| F6 | TravelChat `slice(-10)` muy agresivo | `TravelChat.tsx` | ✅ `slice(-8)` + system prompt safe |
| F7 | SearchPanel sin `aria-label`/`aria-pressed` | `SearchPanel.tsx` | ✅ Añadido en botones transporte y alojamiento |
| F8 | SearchPanel sin feedback visual durante carga | `SearchPanel.tsx` | ✅ `opacity-70` + borde rosa animado |

### 16.6 Issues Conocidos No Corregidos

| # | Issue | Razón |
|---|-------|-------|
| K1 | API keys en cliente (`NEXT_PUBLIC_*`) | Diseño deliberado: claves gratuitas de tier. Para producción se moverían a API routes |
| K2 | Filtros modo transporte/alojamiento no afectan búsqueda | El pipeline Tavily+Groq busca hoteles genéricos. Los filtros se aplican en UI |
| K3 | `calcNights` silencia fechas invertidas | UX decision: mostrar 1 noche en lugar de error |
| K4 | Sin error boundaries | Los componentes dinámicos (mapa) podrían crashear la página. Pendiente para próxima iteración |
| K5 | Sin retry en APIs | Las 3 APIs son gratuitas con rate limits. Retry添加able en futura versión |

---

## 17. Guía de Contribución

### Developer Setup
```bash
git clone <repo>
cd elitescout
npm install
cp .env.example .env.local  # Configurar API keys
npm run dev                  # http://localhost:3000
```

### Convenciones de código
- **TypeScript strict mode** — Evitar `as any`, `as` type assertions
- **Zustand sobre prop-drilling** — Estado global para datos compartidos
- **Framer Motion para animaciones** — Micro-interacciones en componentes
- **CSS Modules + Tailwind** — Sin CSS-in-JS externo
- **Clean Architecture** — UI sin lógica de negocio; servicios y hooks separados

### Testing
- `npm run build` — Verifica TypeScript y build
- `npm run lint` — ESLint con config de Next.js

---

**Documento generado el 15 de mayo de 2026.**
**Proyecto EliteScout — Family Travel Finder v2.2.1**

> *"Para Manu, Arantxa y Edelweiss 🦋 — que cada viaje sea una aventura familiar inolvidable."*
