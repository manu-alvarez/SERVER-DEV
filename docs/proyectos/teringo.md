# Teringo MailOps AI / Neural CockPit

- **Qué es**: Teringo Neural CockPit — interacción, audio espacial háptico, partículas WebGL y triage.
- **Dominio**: teringo.manuelalvarez.dev · **Pages**: https://manu-alvarez.github.io/MSB/apps/teringo/
- **Repo**: manu-alvarez/MSB (apps/teringo)
- **Tecnología**: PWA vanilla 25KB (app.js único); IA vía Ollama LOCAL del visitante (localhost:11434, qwen3.5:4b)
- **Arquitectura**: estático sin backend; sin credenciales
- **Despliegue**: GH Pages del repo MSB (principal, /apps/teringo/) + estático VPS (BUILD-INFO @c9b70e4)
- **Estado real**: activo (Pages viva)
- **BUILD-INFO**: sí (www/app/teringo/BUILD-INFO.json)
- **Actualización**: build en el repo origen → copiar a www/app/teringo → commit → VPS git reset
- **Limitaciones conocidas**: sin backend: la IA requiere el Ollama del visitante
