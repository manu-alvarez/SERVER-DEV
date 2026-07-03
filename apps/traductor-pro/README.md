# Arantxa Translate PRO - Traducción Neural con IA

## Descripción
Traductor neural con 4 modos de traducción, 3 niveles de resumen, 4 herramientas extras, extracción de documentos (PDF/DOCX/TXT) y OCR con Tesseract.js.

## Arquitectura
- **Backend**: Express + TypeScript + Multi-Provider (Groq, OpenAI, Gemini, OpenRouter)
- **Frontend**: React 19 + Vite 7 + MUI 7 + PWA
- **OCR**: Tesseract.js
- **Export**: jsPDF + html2canvas

## Estructura
```
traductor-pro/
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TraducirTab.tsx
│   │   │   ├── ResumirTab.tsx
│   │   │   └── ExtrasTab.tsx
│   └── ...
└── server/
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   └── routes/
    │       ├── process.ts
    │       └── extras.ts

## Instalación y Ejecución Local

1. Instalar dependencias:
   ```bash
   cd apps/traductor-pro
docker-compose up -d --build
```

## Endpoints del Servidor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process` | Traducción/resumen con modo y nivel |
| POST | `/api/extract-text` | Extracción de texto de PDF/DOCX/TXT |
| POST | `/api/keywords` | Extracción de palabras clave |
| POST | `/api/sentiment` | Análisis de sentimiento |
| POST | `/api/ner` | Reconocimiento de entidades nombradas |
| GET | `/health` | Health check |

## Variables de Entorno
Ver `.env.example` en server/

## Mejoras Fusionadas
- ✅ Multi-provider real (Groq, OpenAI, Gemini, OpenRouter) con factory pattern
- ✅ API mismatch corregido (frontend llama a endpoints correctos)
- ✅ Rate limiting implementado
- ✅ Helmet para seguridad HTTP
- ✅ CORS seguro configurado
- ✅ Variables de entorno unificadas
- ✅ PWA con service worker
- ✅ Export a PDF/PNG/clipboard
- ✅ OCR con Tesseract.js
- ✅ Streaming responses para textos largos (planificado)

## Modos de Traducción
1. **Estándar**: Traducción equilibrada y neutra
2. **Original**: Traducción natural y fluida
3. **Profesional**: Traducción técnica y experta
4. **Coloquial**: Traducción sencilla y directa
5. **Resumir**: Resumen sin traducción
6. **Traducir + Resumir**: Traducción + resumen combinados

## Niveles de Resumen
- **Breve**: 1-3 frases
- **Normal**: 3-6 frases
- **Detallado**: Varios párrafos breves
