# Integración con Datos Reales — MAPFRE InfoCol

> Guía paso a paso para activar la conexión con el portal real de InfoCol
> Tiempo estimado: 30-45 minutos (incluyendo pruebas)

---

## Índice

1. [Prerrequisitos](#1-prerrequisitos)
2. [Obtener credenciales](#2-obtener-credenciales)
3. [Configurar Keychain](#3-configurar-keychain)
4. [Validar conexión](#4-validar-conexión)
5. [Dry run](#5-dry-run)
6. [Producción](#6-producción)
7. [Monitorización](#7-monitorización)
8. [Rollback](#8-rollback)
9. [Checklist de seguridad](#9-checklist-de-seguridad)

---

## 1. Prerrequisitos

Antes de empezar, asegúrate de tener:

- [x] INFOCOL instalado (ver `README.md` → "Inicio rápido")
- [x] Tests pasando (`pytest tests/ -v` → 15/15)
- [x] Acceso a MAPFRE InfoCol **con permisos de cierre de partes**
- [x] Tu NIF de fontanero colaborador registrado en MAPFRE
- [x] macOS 14+ / Linux Ubuntu 22+ / Windows 11
- [x] Conexión a internet estable (no VPN de empresa a menos que sea requerido)

### Verificación rápida

```bash
infocol status
# Debe mostrar:
#   Python: 3.14.5
#   Chromium: instalado
#   Anthropic SDK: 0.40.0+
#   Keychain: disponible
#   Modo: dry-run
```

Si algún item falla, ver sección "Troubleshooting" del README.

---

## 2. Obtener credenciales

### 2.1 Tipos de credenciales

INFOCOL necesita **tres credenciales** distintas:

| Credencial | Dónde obtenerla | Formato |
|------------|-----------------|---------|
| **Usuario InfoCol** | Tu manager MAPFRE / portal de partners | `MAPFRE\\<nif>` o email |
| **Contraseña InfoCol** | La que usas para entrar al portal | string |
| **API key de Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | `sk-ant-...` |

### 2.2 Solicitar al manager MAPFRE

> Email plantilla (personalizar antes de enviar):

```
Asunto: Solicitud de credenciales para herramienta INFOCOL

Hola [nombre del manager],

Soy Pedro González Martínez, fontanero colaborador con NIF [XXXXX],
activo en la zona de Logroño. He desarrollado una herramienta
(credenciales OSDD, código abierto) que automatiza el cierre de
expedientes en el portal InfoCol.

Para poder realizar las pruebas de integración con el portal real,
necesitaría:

1. Mi usuario actual de InfoCol
2. Confirmación de que sigue siendo válido
3. (Opcional) Acceso a un entorno de pre-producción si existe

La herramienta cumple con RGPD/LOPD:
- No almacena datos personales en la nube
- Sanitiza la información antes de enviarla a la IA
- Conserva credenciales en el llavero del sistema (cifrado)
- Tiene un humano en el loop para cada envío

Quedo a tu disposición para realizar una prueba (dry-run).

Un saludo,
Pedro
```

### 2.3 Obtener la API key de Anthropic

1. Crear cuenta en [console.anthropic.com](https://console.anthropic.com/)
2. Verificar email
3. Ir a "Settings → API Keys"
4. "Create Key" con nombre `INFOCOL-Pedro`
5. Copiar el valor (`sk-ant-api03-...`) — **solo se muestra una vez**
6. Configurar método de pago (necesario para usar Claude)
7. Establecer límite mensual (recomendado: $20/mes para empezar)

---

## 3. Configurar Keychain

### 3.1 Método interactivo (recomendado)

```bash
infocol config set credentials --interactive
```

El comando te pedirá (de uno en uno):

```
? Usuario InfoCol: MAPFRE\12345678Z
? Contraseña InfoCol: ******** (oculto)
? Anthropic API key: sk-ant-... (oculto)
```

Las credenciales se guardan en:
- **macOS**: Keychain Access → buscar "infocol"
- **Linux**: GNOME Keyring / KWallet
- **Windows**: Credential Manager → "INFOCOL_*"

### 3.2 Método manual (avanzado)

Si prefieres configurar el Keychain a mano:

```bash
# macOS
security add-generic-password -s "infocol" -a "username" -w "MAPFRE\12345678Z"
security add-generic-password -s "infocol" -a "password" -w "tu-contraseña"
security add-generic-password -s "infocol" -a "anthropic_api_key" -w "sk-ant-..."

# Linux (con secret-tool)
echo "MAPFRE\\12345678Z" | secret-tool store --label="INFOCOL username" service infocol account username
echo "tu-contraseña" | secret-tool store --label="INFOCOL password" service infocol account password
echo "sk-ant-..." | secret-tool store --label="Anthropic key" service infocol account anthropic_api_key
```

### 3.3 Verificar

```bash
infocol config show
# Debe mostrar (sin revelar valores):
#   infocol.username: ********78Z
#   infocol.password: ************
#   infocol.anthropic_api_key: sk-ant-***...
#   infocol.mode: production
```

---

## 4. Validar conexión

### 4.1 Test de credenciales InfoCol

```bash
infocol config validate
```

Resultado esperado:

```
[1/3] Verificando Keychain...              OK
[2/3] Probando login en InfoCol...         OK
[3/3] Listando partes pendientes...        12 encontradas

Configuración válida. Puedes ejecutar 'infocol run'.
```

Si falla, ver sección "Errores comunes" abajo.

### 4.2 Test de Anthropic API

```bash
infocol config test-claude
```

Resultado esperado:

```
Conectando con Anthropic API...            OK
Modelo: claude-sonnet-4-5
Tokens disponibles: 9,847
Latencia: 412 ms

Test prompt: "Di 'OK' si recibes este mensaje."
Respuesta: "OK"

API key válida y funcional.
```

### 4.3 Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Login failed: 401` | Credenciales InfoCol incorrectas | Verificar con manager |
| `Login failed: 2FA required` | InfoCol pide segundo factor | Ver `docs/A2F.md` (TODO) |
| `Connection timeout` | Red/VPN | Desactivar VPN o configurar proxy |
| `Invalid API key` | Anthropic key mal copiada | Regenerar en console.anthropic.com |
| `Rate limit exceeded` | Demasiadas llamadas | Esperar 60s o subir tier |

---

## 5. Dry run

Antes del primer envío real, **siempre** ejecuta un dry run:

```bash
infocol run --dry-run --limit 3
```

Este comando:
1. Hace login real
2. Descarga los partes pendientes reales
3. Para los 3 primeros:
   - Llama a Claude con la descripción sanitizada
   - Genera el código de tarifa propuesto
   - Rellena el formulario en el portal (con `--dry-run` **NO envía**)
4. Genera un reporte con los cambios que **habría** hecho

Salida esperada:

```
[10:23:15] Login OK                                  user=****78Z
[10:23:18] Fetched 12 pending expedientes
[10:23:20] Processing V67391281 (dry-run)
           Description: "Fuga de agua en tubería del baño..."
           Sanitized:   "Fuga de agua en tubería del baño..."
           Claude suggests: YYDDDYT + XADDD2T
           Confidence: 0.97
           Total: 117.50 €
           Would fill: [type=work, codes=[YYDDDYT, XADDD2T], amount=117.50]
           Status: dry-run OK
[10:23:25] Processing V67391291 (dry-run)
           ...

Session report: LÓGS/session-2026-06-04-1023.json
```

### Revisar el reporte

```bash
cat LOGS/session-2026-06-04-1023.json | python -m json.tool
```

Verifica:
- Las sugerencias de Claude **tienen sentido** (no son inventadas)
- Los importes **coinciden** con lo que cobrarías manualmente
- Las descripciones sanitizadas **no contienen PII**

Si todo está OK, pasa a la siguiente sección.

---

## 6. Producción

### 6.1 Activar modo producción

Edita `config/settings.yaml`:

```yaml
infocol:
  mode: production
  dry_run: false    # ← cambiar de true a false
  
browser:
  headless: true     # true en producción, false solo para debug
  
analyzer:
  model: claude-sonnet-4-5
  temperature: 0
  max_tokens: 1024
  
security:
  require_human_approval: true   # SIEMPRE true en producción
  log_all_calls: true
  audit_retention_days: 365
```

### 6.2 Primer envío real

Empieza con **un solo expediente** para verificar:

```bash
infocol run --id V67391281
```

El comando:
1. Hace login
2. Abre el expediente
3. Llama a Claude
4. Rellena el formulario
5. **Pausa y muestra preview** (porque `require_human_approval: true`)
6. Espera tu confirmación
7. Envía si confirmas

Pantalla de preview:

```
┌─────────────────────────────────────────────┐
│ Expediente V67391281                         │
│                                              │
│ Descripción original:                       │
│ "Fuga de agua en tubería del baño..."       │
│                                              │
│ Descripción sanitizada (enviada a Claude):  │
│ "Fuga de agua en tubería del baño..."        │
│ ✓ No contiene DNI, email, teléfono, póliza  │
│                                              │
│ Códigos sugeridos:                          │
│  • YYDDDYT  Exclusión con cala      50.00 € │
│  • XADDD2T  Mano de obra 2h         45.00 € │
│  • SMDDDIT  Material estándar       22.50 € │
│                                              │
│ Total: 117.50 €                              │
│ Confianza IA: 97%                            │
│                                              │
│ [Cancelar]              [✓ Confirmar y enviar]│
└─────────────────────────────────────────────┘
```

### 6.3 Procesamiento por lotes

Una vez verificado con un parte, puedes procesar varios:

```bash
# Procesar todos los pendientes
infocol run

# Procesar específicos
infocol run --ids V67391281,V67391291,V67391301

# Procesar con límite
infocol run --limit 10

# Procesar y notificar al finalizar
infocol run --limit 20 --notify slack

# Procesar en background (con watchdog)
infocol run --watch --interval 300   # cada 5 min
```

---

## 7. Monitorización

### 7.1 Logs en tiempo real

```bash
# Tail del log de la sesión actual
tail -f LOGS/session-$(date +%Y-%m-%d).log

# Logs con colores y formato
infocol logs --follow

# Solo errores
infocol logs --level error --follow
```

### 7.2 Dashboard frontend

El frontend en `http://localhost:3333/dashboard` muestra:

- **Expedientes Hoy**: contados en las últimas 24h
- **Procesados**: cantidad + tasa de éxito
- **Tiempo Medio**: media aritmética
- **Errores IA**: partes con confianza < 0.85

### 7.3 Monitor del sistema

`http://localhost:3333/monitor` muestra:

- Estado del navegador Playwright
- Latencia de Claude API
- Conectividad con InfoCol
- Cola de pendientes
- Eventos recientes

### 7.4 Alertas

Configurar en `config/settings.yaml`:

```yaml
alerts:
  on_error: true
  on_low_confidence: 0.85
  on_rate_limit: true
  notification_methods:
    - desktop         # Notificación nativa macOS
    - email           # Resumen diario
    # - slack         # Si tienes webhook configurado
```

---

## 8. Rollback

Si algo va mal, puedes revertir al modo dry-run o pausar:

```bash
# Volver a modo dry-run (no toca el portal real)
infocol run --dry-run

# Pausar el watcher (si lo tenías corriendo)
infocol run --watch --pause

# Ver últimas acciones (auditoría)
infocol logs --audit --last 50
```

Si necesitas **revertir un envío** (ya se hizo el submit):

1. Abrir InfoCol manualmente
2. Buscar el expediente en "Procesados hoy"
3. Reabrir el parte
4. Corregir los valores

INFOCOL no envía a InfoCol de forma irreversible gracias al principio de "humano en el loop" — siempre hay un paso de confirmación manual.

---

## 9. Checklist de seguridad

Antes de activar el modo producción, verifica:

- [ ] **Credenciales en Keychain** (no en variables de entorno, no en archivos)
- [ ] **API key de Anthropic** con límite de gasto configurado
- [ ] **HTTPS estricto** al llamar a InfoCol y a Anthropic
- [ ] **Sanitizer activo** en todas las llamadas a Claude
- [ ] **Logs auditables** activos y con retención adecuada
- [ ] **Humano en el loop** activado (`require_human_approval: true`)
- [ ] **Backup cifrado** de `LOGS/` configurado
- [ ] **No hay screenshots** de InfoCol guardados en disco
- [ ] **No hay tokens de sesión** en texto plano
- [ ] **.gitignore** excluye `config/.env`, `*.key`, `secrets/`
- [ ] **Tests pasando** (`pytest tests/ -v` → 15/15)
- [ ] **Dry-run exitoso** (al menos una vez)
- [ ] **Manager MAPFRE informado** del uso de la herramienta

Si todos los items están ✓, puedes activar producción con confianza.

---

## 10. Próximos pasos tras activar

Una vez en producción, considera:

1. **Medir durante 1 semana** el tiempo real vs. el estimado
2. **Recopilar feedback** de las sugerencias de Claude
3. **Ajustar el prompt** si la confianza baja consistentemente
4. **Añadir códigos de tarifa** específicos de tu zona
5. **Documentar excepciones** (casos donde la IA falla)
6. **Hablar con MAPFRE** sobre adopción oficial (¡este es el objetivo!)

---

**¿Problemas?** Consulta la sección "Troubleshooting" del README.md o abre un issue.

**¿Todo OK?** Disfruta de tus 30 segundos por parte en lugar de 2 minutos 🚀
