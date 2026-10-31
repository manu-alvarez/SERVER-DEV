# Cuentos Mágicos

- **Qué es**: Generador de cuentos infantiles con IA (texto, audio, imágenes, video).
- **Dominio**: cuentos.manuelalvarez.dev
- **Repo**: monorepo apps/cuentos-magicos
- **Tecnología**: FastAPI + Celery + Postgres + Redis (compartido) + storage
- **Arquitectura**: backend con colas
- **Despliegue**: compose (3 contenedores) + estático
- **Estado real**: activo (healthy)
- **BUILD-INFO**: n/a (build del monorepo)
- **Actualización**: commit → VPS git reset + compose/static sync
- **Limitaciones conocidas**: —
