# Tu Energía Maya

- **Qué es**: App de energía maya diaria (kin diario Dreamspell).
- **Dominio**: maya.manuelalvarez.dev · **Pages**: https://manu-alvarez.github.io/TuEnergiaMaya/
- **Repo**: manu-alvarez/TuEnergiaMaya
- **Tecnología**: SPA estática (repo separado TuEnergiaMaya)
- **Arquitectura**: estático sin backend
- **Despliegue**: GH Pages (gh-pages) ← repo separado; el dominio VPS hace 302 deliberado a Pages
- **Estado real**: activo (Pages viva; estático VPS como instancia disponible)
- **BUILD-INFO**: n/a (build del monorepo)
- **Actualización**: build en el repo origen → copiar a www/app/maya → commit → VPS git reset
- **Limitaciones conocidas**: la copia VPS y Pages pueden divergir hasta añadir BUILD-INFO al flujo
