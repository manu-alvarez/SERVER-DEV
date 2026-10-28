# UIEP — Universal Intelligence Engineering Platform

Plataforma universal de ingeniería de creación/generación de agentes, subagentes, sistemas agenticos, MCP, frameworks, plantillas de estructuras de trabajo, plantillas de código de archivos, Harness y tests adversariales.

## Arquitectura

- **Monorepo:** pnpm + Turborepo + TypeScript
- **Paquetes:** `@uiep/auth-system`, `@uiep/design-engine`, `@uiep/entity-registry`, `@uiep/entity-schema`, `@uiep/framework-adapter`, `@uiep/memory-system`, `@uiep/meta-generator`, `@uiep/monitoring`, `@uiep/plugin-system`, `@uiep/ui`
- **Frontend:** React 19 + Vite + Tailwind v4 + `@xyflow/react` + Zustand
- **Backend:** Express (Node.js) — usa los paquetes `@uiep/*` para generación local
- **Motor:** Generación de código y estructuras sin dependencia de APIs de pago externas

## Despliegue local

```bash
cd apps/uiep
pnpm install

# Backend (puerto 4000)
cd backend
npm install
npm run dev

# Frontend (puerto 3000)
cd ../apps/web
npm install
npm run dev
```

## Despliegue con Docker

```bash
cd apps/uiep
docker compose up --build
```

## Capacidades

- Diseñador visual de agentes y subagentes (xyflow)
- Generador de código y estructuras de trabajo
- Galería de plantillas reutilizables
- Servidores MCP (Model Context Protocol)
- Tests adversariales (inyección de prompt, fuga de datos, bypass de seguridad)
- Harness de pruebas
- Todo ejecutado localmente
