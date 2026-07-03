import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Esto es VITAL para que los assets carguen bien en subdirectorios de Nginx (msbross.me/app-generator)
})
