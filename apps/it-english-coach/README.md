# IT English Coach — PWA autohospedable

Curso de inglés **A1 → B2** para **Técnico Junior de Sistemas**. App instalable (PWA),
100 % estática, sin build ni dependencias. Funciona offline (temario, reading, listening)
y usa tu propia API key para las partes con IA (role-play y tutor).

## Contenido del bundle

```
index.html               La app completa (HTML+CSS+JS en un archivo)
manifest.webmanifest     Manifiesto PWA (instalación)
sw.js                    Service worker (offline / app shell)
favicon.svg              Icono vectorial
icon-192.png             Icono 192×192
icon-512.png             Icono 512×512
icon-512-maskable.png    Icono maskable (Android)
apple-touch-icon.png     Icono iOS (180×180)
server.js                (Opcional) servidor Node: sirve la app + proxy CORS
```

## Qué incluye la app

- **Temario**: 12 módulos A1→B2 (50 % general / 50 % IT), con objetivos, vocabulario,
  gramática y frases modelo. El progreso se guarda en el dispositivo.
- **Práctica**: 12 role-plays con IA (helpdesk, redes, Linux, Daily Standup, escalado,
  automatización con IA, entrevista, café, aeropuerto…). Corrección tipo *code review*.
- **Pruebas**:
  - **Reading**: 6 textos con preguntas y corrección al instante.
  - **Listening**: 4 audios con la **voz del dispositivo** (Web Speech API) + preguntas
    y transcripción oculta, más un **Dictado** de 8 frases con comparación palabra a palabra.
- **Tutor IA**: preguntas libres, corrección de emails, vocabulario, simulacros.
- **Ajustes**: eliges proveedor y pegas tus claves.

## Proveedores de IA soportados

En **Ajustes** puedes configurar y elegir uno:

| Proveedor       | Formato          | Base URL por defecto            | Modelo por defecto (editable) |
|-----------------|------------------|---------------------------------|-------------------------------|
| Anthropic       | Claude Messages  | api.anthropic.com               | `claude-sonnet-4-6`           |
| Google Gemini   | Gemini           | generativelanguage.googleapis…  | `gemini-2.5-flash`            |
| OpenRouter      | OpenAI-compatible| openrouter.ai/api/v1            | `openai/gpt-4o-mini`          |
| Mistral         | OpenAI-compatible| api.mistral.ai/v1              | `mistral-small-latest`        |
| Perplexity      | OpenAI-compatible| api.perplexity.ai              | `sonar`                       |
| OpenCode Zen    | OpenAI-compatible| opencode.ai/zen/v1             | `claude-sonnet-4-5`           |
| Personalizado   | OpenAI-compatible| *(la tuya, terminada en /v1)*   | *(la que quieras)*            |

> Los **modelos son editables**: si un nombre queda obsoleto, cámbialo en Ajustes.
> Las **claves se guardan solo en tu navegador** (localStorage) y se envían únicamente
> al proveedor que elijas (o a tu proxy). Temario, Reading y Listening no necesitan clave.

## Despliegue en msbross.me

### Opción A — estático (Nginx/Apache/CDN)
Copia la carpeta a una ruta pública, p. ej. `https://msbross.me/english/`, y listo.
Al ser rutas **relativas**, funciona en cualquier subcarpeta. Requisitos:
- Servir por **HTTPS** (obligatorio para instalar PWA y para el service worker).
- MIME de `.webmanifest` → `application/manifest+json` (Nginx: `application/manifest+json webmanifest;`).

Nginx (ejemplo):
```nginx
location /english/ {
    alias /var/www/msbross/english/;
    types { application/manifest+json webmanifest; }
}
```

### Opción B — con Node + PM2 (sirve la app y hace de proxy)
Útil si algún proveedor bloquea las llamadas directas del navegador (CORS).

```bash
cd english
PORT=8787 node server.js         # prueba local
pm2 start server.js --name it-english
pm2 save
```
Detrás de tu Nginx, proxya `https://msbross.me/english/` → `http://127.0.0.1:8787`.
Luego, en **Ajustes → Proxy URL**, pon `https://msbross.me/english` y las peticiones de IA
pasarán por `/proxy` (que añade CORS). Deja el campo vacío para llamar directo desde el navegador.

`server.js` no tiene dependencias (usa `fetch` nativo de Node 18+). Solo reenvía tus
cabeceras/clave al proveedor; **no almacena** nada. Hosts permitidos por el proxy:
Anthropic, Google, OpenRouter, Mistral, Perplexity y OpenCode Zen.

## Instalar la PWA
- **Android/Chrome**: menú ⋮ → “Instalar aplicación / Añadir a pantalla de inicio”.
- **iOS/Safari**: Compartir → “Añadir a pantalla de inicio”.
- **Escritorio (Chrome/Edge)**: icono de instalar en la barra de direcciones.

## Notas
- El **listening** usa la voz del sistema: la calidad y el acento dependen de las voces
  instaladas en el dispositivo/navegador (elige una `en-*` en Ajustes de la sección).
- Si Anthropic o algún proveedor falla por CORS en el navegador, activa el proxy (Opción B).
- Sin conexión: Temario, Reading y Listening funcionan; Práctica y Tutor necesitan red.
```
