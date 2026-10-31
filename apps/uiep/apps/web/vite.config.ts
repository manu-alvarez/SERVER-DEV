import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * La UI del Control Center se publica DIRECTAMENTE en la superficie estática
 * del proxy (www/app/uiep → dominio uiep.manuelalvarez.dev + /app/uiep), y la
 * API siempre es MISM0 ORIGEN: /_uiep/api (cookie HttpOnly incluida por el
 * navegador). El proxy ya cablea /_uiep → uiep-backend:4000.
 */
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/_uiep': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/_uiep/, ''),
      },
    },
  },
  build: {
    // Output directo a la superficie publicada del repo (traceable commit→deploy).
    outDir: path.resolve(import.meta.dirname, '../../../../www/app/uiep'),
    emptyOutDir: true,
    sourcemap: true,
  },
})
