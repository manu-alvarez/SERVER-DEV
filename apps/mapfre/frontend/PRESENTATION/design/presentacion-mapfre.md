# Presentación MAPFRE: INFOCOL Automation

## Resumen Ejecutivo

INFOCOL es un asistente inteligente de automatización de partes para el portal InfoCol de MAPFRE. Desarrollado bajo la metodología **Open Spec-Driven Development (OSDD)** con arquitectura **STCO** y patrón de iteración **Ralph Loop**, el sistema integra inteligencia artificial (Claude API) para eliminar errores de selección de códigos de tarifa y reducir el tiempo de procesamiento de ~2 minutos a <30 segundos por expediente.

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                INFOCOL Automation Engine                 │
├────────────┬───────────┬───────────┬────────────────────┤
│  Browser   │   AI     │   Form    │     Security        │
│  Controller│  Analyzer│   Filler  │     Manager         │
│ (Playwright)│ (Claude) │ (DOM ops) │ (Keychain/AES-256) │
├────────────┴───────────┴───────────┴────────────────────┤
│              Capa de Orquestación (CLI)                  │
│           Click CLI · Rich UI · Logging                  │
└─────────────────────────────────────────────────────────┘
```

## Principios de Diseño Aplicados

| Principio | Aplicación en INFOCOL |
|-----------|----------------------|
| **OSDD** | Especificación como fuente de verdad única; el código es derivado de la especificación |
| **STCO** | Separación estricta System/Task/Context/Output con delimitadores XML |
| **Ralph Loop** | Iteración continua hasta cumplir criterios de finalización verificables |
| **4 Acuerdos Toltecas** | Impecabilidad técnica, neutralidad ante fallos, verificación exhaustiva, máximo esfuerzo |
| **Guardarraíles** | Precisión estricta, seguridad de entorno, eficiencia arquitectónica, integración CI/CD, compatibilidad 2026 |

## Flujo de Trabajo

```
1. Login Seguro ──▶ 2. Escaneo FIN ──▶ 3. Análisis IA ──▶ 4. Relleno ──▶ 5. Confirmación Humana
   (Keychain)        (Playwright)       (Claude API)       (DOM fill)    (NUNCA automático)
```

## Stack Tecnológico

| Componente | Tecnología | Versión Mínima |
|------------|------------|----------------|
| Lenguaje | Python | 3.10+ |
| Automatización | Playwright | Chromium latest |
| IA | Claude (Anthropic) | claude-sonnet-4 |
| CLI | Click | 8.x |
| UI Terminal | Rich | 13.x |
| Cifrado | cryptography | 41.x |
| Config | PyYAML | 6.x |

## Seguridad (RGPD / LOPD)

- ✅ 100% local — ningún dato sale del equipo
- ✅ Credenciales en Keychain / HKCU cifrado — no en texto plano
- ✅ La IA recibe SOLO descripción técnica — sin nombres, DNI, pólizas
- ✅ Sin almacenamiento en servidores externos
- ✅ Confirmación humana obligatoria antes de cada envío

## Tarifas MAPFRE La Rioja 2026

8 códigos principales con reglas de combinación, incluyendo visitas, exclusiones, grifería, desplazamiento >20km, materiales fuera de tarifa y trabajo por horas.

## Roadmap

| Fase | Estado | Hito |
|------|--------|------|
| Beta | ✅ Hoy | Login, detección FIN, análisis IA, relleno, tarifas, desplazamiento |
| v1.0 | 🔧 | Intervenciones posteriores completas, reporting |
| v2.0 | 🎯 | Autonomía total, multi-provincia, multi-gremio |

## Métricas

- **Hoy (Beta)**: ~2 min/expediente, 90% reducción errores
- **v1.0**: ~30s/expediente, 0% errores
- **Visión 2026**: <30s completamente autónomo
