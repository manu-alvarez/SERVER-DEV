import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Esto es VITAL para que los assets carguen bien en subdirectorios de Nginx (msbross.me/app-generator)
})
