import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8006',
        changeOrigin: true
      },
      '/status': {
        target: 'http://localhost:8006/health',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/status/, '')
      }
    }
  }
})
