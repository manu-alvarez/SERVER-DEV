# 🚀 MSBrossAI Ecosystem: Ultimate Workflow Checklist

Esta guía es la "Biblia" de ejecución para cualquier modificación, despliegue o refactorización dentro del ecosistema MSBrossAI. Garantiza calidad **Nivel Producción (Level 99)**, sin interrupciones, y siguiendo las reglas de oro de arquitectura estricta.

---

## 1. Fase de Diagnóstico y Planificación (Anti-Alucinación)
- [ ] **Auditoría de Entorno:** Verificar si el cambio afecta a la BD (`Prisma`), a las rutas internas (`Next.js`) o al enrutamiento global (`proxy_server.js`).
- [ ] **Regla Zero-Mock:** Asegurar que no se usarán datos falsos, endpoints *dummy* ni variables temporales. Todo debe integrarse a lógica real.
- [ ] **Paths Absolutos (El problema de las imágenes):** Recordar siempre que si una app Next.js está bajo un `basePath` (ej. `/app/txafitnesspro`), los binarios y rutas estáticas en código crudo (`unoptimized: true`) **deben llevar el prefijo manual** en su ruta (ej: `/app/txafitnesspro/images/img.png`).
- [ ] **NextAuth Middleware con BasePath (El problema del Matcher):** Nunca usar expresiones regulares complejas o *negative lookaheads* (ej: `/((?!login...).*)`) en el `matcher` de `middleware.ts` cuando la app Next.js corre bajo un `basePath` detrás de un proxy. El enrutador puede interpretar incorrectamente la raíz (`/`). **Solución estricta:** Declarar siempre las rutas seguras explícitamente (ej: `["/", "/dashboard/:path*"]`).
- [ ] **NextAuth Client con BasePath (El problema de signIn):** El componente `<SessionProvider>` de NextAuth *no* hereda automáticamente el `basePath` configurado en `next.config.mjs`. Si no se inyecta la prop explícita `basePath="/ruta/api/auth"`, la función `signIn` y los hooks enviarán peticiones a `/api/auth` provocando errores de colapso HTML (reload invisible) o "String did not match expected pattern".

## 2. Ejecución y Lógica Core (Clean Code)
- [ ] **Tipado Estricto:** Todo el código TypeScript debe tener interfaces claras y validación de nulos (`?`).
- [ ] **Persistencia y Singleton:** Cualquier acceso a BD debe hacerse importando el *Prisma Singleton* (`import { prisma } from "@/lib/db/prisma"`), nunca instanciando nuevos clientes para no agotar conexiones.
- [ ] **Transacciones Atómicas:** Toda escritura multi-paso debe ir encapsulada en `prisma.$transaction()` para evitar corrupciones.
- [ ] **Telemetría y Edge Cases:** Todo endpoint de API debe estar envuelto en un bloque `try/catch` de producción. Los errores deben ser capturados e impresos usando un logger estructurado (Ej. `[TELEMETRY][TIMESTAMP] action=XYZ status=500 error=...`) y devolver un 500 genérico al cliente (protección OWASP).

## 3. Despliegue Local y Compilación (Zero-Downtime)
- [ ] **Build Riguroso:** En Next.js, **siempre** compilar tras hacer cambios de código (y especialmente si se cambian variables de entorno o `next.config.mjs`).
  ```bash
  npm run build
  ```
- [ ] **Reinicio Silencioso (PM2):** Una vez que el build es exitoso, reiniciar la instancia en PM2 para aplicar los cambios sin tirar el servidor.
  ```bash
  pm2 restart <app-name>
  ```
- [ ] **Verificación de Caídas:** Ejecutar `pm2 logs` inmediatamente después para garantizar que no hay excepciones al inicio del proceso.

## 4. Persistencia Global y Buenas Prácticas (La Regla de Oro)
- [ ] **Commit Riguroso:** ¡No dejar código flotando! Todo se documenta y se sube al ecosistema central.
  ```bash
  git add <app-dir>
  git commit -m "feat/fix(app-name): Descripción técnica experta"
  git push
  ```

---
> [!IMPORTANT]
> **Nunca des por terminado un flujo sin confirmar que está 100% operativo en el entorno final.** Si una imagen se rompe, se audita el proxy; si la base de datos no responde, se audita el Singleton; si la UI se desencaja, se re-compila. **Mediocridad: Cero.**
