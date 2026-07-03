# TaskFlowPro - Gestión de Tareas y Proyectos

## Descripción
Aplicación de gestión de tareas con sistema de alarmas, categorías, integración WhatsApp y telemetría de productividad.

## Arquitectura
- **Frontend**: React 18 + TypeScript + MUI 5 + Zustand + React Router + Framer Motion
- **Estado**: Zustand con persistencia en localStorage
- **UI**: Material UI con tema dark personalizado
- **Notificaciones**: Browser Notifications API + Service Worker
- **Integración**: WhatsApp via CallMeBot API

## Estructura
```
taskflow-pro/
├── src/
│   ├── components/     # Layout, UI components
│   ├── pages/          # Dashboard, Tasks, Categories, Settings
│   ├── store/          # Zustand task store
│   ├── services/       # WhatsApp service
│   ├── theme/          # MUI theme configuration
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Alarm worker, utilities
├── public/             # Static assets, PWA files
├── package.json
├── vite.config.ts
├── tsconfig.json
└── taskflowpro.nginx.conf
```

## Despliegue Local
```bash
cd apps/taskflow-pro
npm install
npm run dev
```

## Características
- ✅ CRUD completo de tareas con prioridades
- ✅ Sistema de alarmas con notificaciones del navegador
- ✅ Gestión de categorías
- ✅ Dashboard con estadísticas
- ✅ Integración WhatsApp (CallMeBot)
- ✅ Diseño responsive con sidebar colapsable
- ✅ Tema dark personalizado con efectos neon
- ✅ PWA con service worker
- ✅ Persistencia de datos en localStorage

## Mejoras Fusionadas
- ✅ Código completo de la versión V2 (TypeScript, MUI, Zustand)
- ✅ Configuración Nginx para producción
- ✅ Estructura de carpetas organizada
- ✅ Types TypeScript centralizados
- ✅ Service Worker para alarmas en background
- ✅ Framer Motion para animaciones fluidas
