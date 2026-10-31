# UIEP

- **Qué es**: Plataforma de ingeniería de agentes (AgentSpec, runtime, RAG, memoria, workflows, integraciones MCP/HTTP, consola operativa).
- **Dominio**: uiep.manuelalvarez.dev
- **Repo**: manu-alvarez/SERVER-DEV (apps/uiep)
- **Tecnología**: FastAPI+Express? No: Express+Node 22 (backend), React 19+MUI (consola), Ollama qwen3.5:4b + nomic-embed-text
- **Arquitectura**: 4 planos (control/ejecución/modelo/datos) + observabilidad/reliability/governance
- **Despliegue**: compose uiep-backend + estático www/app/uiep; verificación de binario servido
- **Estado real**: 1.0.0 congelada (tag) + 1.0.1 en producción; 137/137 tests; backup diario + iCloud
- **BUILD-INFO**: n/a (build del monorepo)
- **Actualización**: commit → VPS git reset + compose/static sync
- **Limitaciones conocidas**: —
