import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: './',
    build: { outDir: 'dist', assetsDir: 'assets' },
    server: {
        host: true,
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8001',
                changeOrigin: true,
            }
        }
    },
    preview: {
        port: 5174,
    }
})
