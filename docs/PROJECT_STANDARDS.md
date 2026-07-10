# MSBROSS ECOSYSTEM: ESTÁNDARES ESTRICTOS DEL PROYECTO

> [!WARNING]  
> **LEER OBLIGATORIAMENTE ANTES DE TOCAR CUALQUIER CÓDIGO**  
> Este documento contiene las reglas de oro dictadas por el arquitecto del proyecto. Desviarse de ellas o ignorarlas supondrá la ruptura del ecosistema.

## 1. Nomenclatura y Lexicología (PROHIBICIONES ABSOLUTAS)
- **NUNCA** usar el término `IAPUTA OS`, `iaputa`, ni variaciones. La aplicación principal ha sido renombrada globalmente a **`IAProd OS`** (`iaprod-os`).
- **NUNCA** utilizar textos pretenciosos, fantásticos o falsos en las descripciones de la UI (ej. "Modelos cuánticos", "Plataforma holográfica"). Todo el copy debe ser profesional, realista y modesto.

## 2. Reglas de Acceso y Autenticación (Auth)
Las siguientes aplicaciones son de **ACCESO LIBRE Y DIRECTO**. Queda terminantemente prohibido inyectarles pantallas de login, firewalls o sistemas de autenticación de entrada:
1. **Gas Station** (`gasstation.manuelalvarez.dev`)
2. **Industrial Pro** (`industrial.manuelalvarez.dev`)
3. **Livekit Nikolina** (`nikolina.manuelalvarez.dev`)

## 3. UI y Diseño (Responsividad)
- **TODAS las aplicaciones** sin excepción tienen que ser **100% RESPONSIVES**.
- Queda prohibido usar layouts fijos que se rompan en pantallas de teléfono.
- Especial atención a **Expositator RTE** y **App Generator**: Deben utilizar `flex-col` en móviles y pasar a `flex-row` o `grid-columns` solo a partir de breakpoints `md:` o `lg:`.
- No usar alturas fijas `100vh` en Grid si hay componentes interactivos o teclados de móvil; utilizar `min-h-[100dvh]` y flujos scrolleables.

## 4. Dominios y Subdominios (Proxy Traefik)
- El enrutamiento de red es sagrado. **No alterar los puertos locales (8000 a 8011) ni inventar subdominios**.
- Cada aplicación estática reside en `www/app/[nombre_de_carpeta_exacto]` y el proxy (Node.js) se encarga de servirla cuando se invoca su subdominio (ej: `https://appgen.manuelalvarez.dev` -> `/www/app/app-generator`). 
- **OJO con App Generator:** Su URL correcta es `https://appgen.manuelalvarez.dev` (NUNCA `appgenerator.manuelalvarez.dev`).

## 5. Procedimiento de Modificación
1. **Verificar antes de actuar**: Antes de escribir código, leer este documento.
2. **Commit por acción garantizada**: No se acumulan docenas de cambios para un commit basura. Se comitea cada funcionalidad probada y garantizada al 100%.
3. **Despliegue a producción**: El servidor VPS no usa los `dist` antiguos. Si se altera el código de un frontend, debe compilarse de nuevo. 
   - Ejecuta `./scripts/build/build_all.sh` para recompilar **todos** los proyectos que tienen package.json y volcarlos automáticamente usando `sync_www.sh`.
   - Esto empaqueta los archivos limpios en `www/app` sin ensuciar la raíz `www` con carpetas anidadas.
