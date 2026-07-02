# Migración de Ecosistema MSBrossAI a VPS Contabo y Nueva Landing Page

El objetivo es desplegar la totalidad del ecosistema `https://msbross.me` (los 20 microservicios de MSBrossAI, orquestación, agentes LiveKit y túneles) en el nuevo servidor VPS proporcionado (`84.247.186.126`), mapeando el dominio `manuelalvarez.dev`. Adicionalmente, se integrará el nuevo diseño de la Landing Page basado en las referencias de AiroApp.

> [!WARNING]
> ## User Review Required
> Necesito tu aprobación y colaboración con un par de credenciales bloqueadas para poder arrancar la ejecución. ¡Lee las preguntas abiertas abajo!

> [!IMPORTANT]
> ## Open Questions
> 1. **Archivo ZIP Protegido:** El archivo `/Users/manu/Downloads/SSH-CONTABO-manuelalvarezdianez-gmail.zip` tiene **contraseña**. Cuando intento extraer la clave privada SSH, me pide una password. ¿Me pasas la contraseña del ZIP o extraes el archivo manualmente y me das la ruta exacta de la clave sin cifrar?
> 2. **Enlaces Bloqueados (401 Unauthorized):** Los enlaces de `airoapp.ai` (`https://1v0x5jsb1n.preview.c35.airoapp.ai/...`) requieren autenticación (devuelven Error 401). ¿Tienes algún token, acceso, o prefieres pasarme capturas de pantalla / código fuente de ese diseño para que yo pueda replicarlo en la nueva Landing Page?

## Proposed Changes

La migración y actualización se dividirá en 3 fases masivas:

---

### Fase 1: Aprovisionamiento del Servidor Contabo (VPS)
Configuraremos el servidor desde cero, replicando exactamente el entorno de macOS local:
- Instalación de Node.js (v20), PM2, Python 3.14 y Redis.
- Transferencia segura del directorio `/Users/manu/Desktop/MSBrossAI` mediante `rsync`.
- Configuración del túnel Cloudflare para que apunte `manuelalvarez.dev` al Proxy Node.js interno (Puerto 8080).

### Fase 2: Reconstrucción del Frontend Principal (Landing Page)
Sustituiremos la antigua landing (`apps/msbross`) por el nuevo diseño basado en AiroApp.

#### [NEW] `apps/msbross-next` (o adaptación de la existente)
Se construirá una SPA en React/Next.js que incluya:
- `/` (Home/Portfolio)
- `/agents` (Catálogo de Agentes de IA)
- `/saas` (Catálogo de Productos)
- `/architecture` (Infografía del Ecosistema)
- `/contact` (Formulario)

*Nota: El diseño exacto dependerá de resolver el acceso a los links de AiroApp.*

### Fase 3: Despliegue de los 20 Microservicios
Una vez el código esté en el VPS:
1. Reconstruiremos todos los entornos virtuales de Python (`venv`) para arquitectura Linux.
2. Compilaremos las apps de Next.js (`npm run build`).
3. Ejecutaremos `pm2 start ecosystem.config.js` e instalaremos el `api_keys_vault.json` en secreto.

## Verification Plan

### Automated Tests
- Ejecutaremos scripts de comprobación de puertos TCP (7880, 8080, 8001-8010) en el VPS.
- Verificaremos que el demonio de Cloudflare está reportando estado `ONLINE` para `manuelalvarez.dev`.

### Manual Verification
- Te pediré que accedas a `https://manuelalvarez.dev` desde tu navegador.
- Validaremos que el nuevo diseño de la landing cargue correctamente.
- Probaremos que los agentes LiveKit respondan sin latencia desde el VPS.
