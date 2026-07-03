import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const removeCrossOrigin: Plugin = {
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '').replace(/crossorigin="anonymous"/g, '');
  }
};

export default defineConfig({
  base: './',
  plugins: [react(), removeCrossOrigin],
  server: { port: 8887 },
  preview: { port: 8887 },
  build: {
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  },
});
