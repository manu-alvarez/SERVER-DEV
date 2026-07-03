# EXPERIENCE: User Interaction Design

## Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│                  START SESSION                          │
│  $ infocol run                                         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│  🔐 Credenciales                                      │
│  ┌────────────────────────────────────────────────┐   │
│  │  Usuario: [______]                             │   │
│  │  Contraseña: [______]                          │   │
│  │  [Guardar de forma segura]                     │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│  ⏳ Iniciando sesión en InfoCol...                     │
│  [████████████████░░░░░░░░░░] 65%                     │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│  📋 Expedientes FIN encontrados: 3                    │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  # │ ID          │ Description          │ Notas│   │
│  │  ──┼─────────────┼──────────────────────┼──────│   │
│  │  1 │ V67391281   │ Fuga baño           │ Urg  │   │
│  │  2 │ V67391291   │ Rotura tubería cocina│      │   │
│  │  3 │ V67391301   │ Cambio grifo lavabo │      │   │
│  │    │             │                      │      │   │
│  │  [Procesar todos] [Seleccionar...]      │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│  Procesando expediente 1/3: V67391281                 │
│  ┌────────────────────────────────────────────────┐   │
│  │  📖 Leyendo descripción... ✓                   │   │
│  │  🤖 Analizando con IA... ████████░░ 80%       │   │
│  │  📊 Códigos seleccionados:                     │   │
│  │     • YYDDDYT + XADDD2T (Exclusión con cala)   │   │
│  │     • FADDD8T (Desplazamiento 25km → 12.50€)  │   │
│  │     • SMDDDIT (Material: 45.00€)              │   │
│  │  ✅ Formulario rellenado                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ⚠️  REVISA EL FORMULARIO ANTES DE ACEPTAR            │
│                                                       │
│  InfoCol - MAPFRE España                               │
│  📋 Expediente: V67391281                             │
│  📍 Actividad: FONTANERÍA                             │
│  ✅ Descripción: rellenada                             │
│  ✅ Preguntas: respondidas                             │
│  ✅ Códigos tarifa: aplicados                          │
│  ✅ Desplazamiento: calculado                          │
│  ⏸  Esperando Aceptar manual...                       │
│                                                       │
│  ┌──────────┐  ┌──────────┐                           │
│  │  Siguiente│  │  Salir   │                           │
│  └──────────┘  └──────────┘                           │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│  📊 Resumen de sesión                                  │
│  ─────────────────────────────────────                 │
│  Total expedientes:  3                                 │
│  Procesados:         3                                 │
│  Errores:            0                                 │
│  Tiempo total:       4m 32s                            │
│  Tiempo medio:       1m 31s                            │
│                                                       │
│  Gracias por usar INFOCOL.                             │
└────────────────────────────────────────────────────────┘
```

## CLI Commands

```bash
infocol run              # Start automation session
infocol config           # Configure credentials and settings
infocol config --show    # Show current config (masked)
infocol status           # Check system readiness
infocol logs             # View recent logs
infocol --help           # Show help
```

## Color Scheme (Rich Console)

- Headers: Cyan bold
- Success: Green
- Warning: Yellow
- Error: Red
- Info: Blue
- Code blocks: Magenta
- Status: White
