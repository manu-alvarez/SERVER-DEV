# Edelweiss (VisionPlay) - Estimulación Visual Infantil

## Descripción
Aplicación PWA para estimulación visual infantil con 5 modos de estimulación y parental lock.

## Arquitectura
- **Frontend**: React 18 + Vite 7 + Tailwind 3 + Framer Motion 12
- **PWA**: Service worker custom
- **i18n**: Español/Inglés

## Características
- ✅ 5 modos de estimulación (Alto Contraste, Seguimiento, Enfoque, Descanso, Formas)
- ✅ Parental Lock (double-tap + hold para salir)
- ✅ i18n ES/EN
- ✅ Kiosk mode
- ✅ Estadísticas de uso
- ✅ PWA con service worker

## Mejoras Fusionadas
- ✅ Bug vibration.js corregido (navigator.navigator → navigator)
- ✅ i18n.js dead code eliminado
- ✅ Framer Motion 6→12
- ✅ Vite 4→7
- ✅ ErrorBoundary añadido
- ✅ Modo de progreso para padres
