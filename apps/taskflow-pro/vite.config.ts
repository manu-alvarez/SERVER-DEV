import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const removeCrossOrigin: Plugin = {
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '').replace(/crossorigin="anonymous"/g, '');
  }
};

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), removeCrossOrigin],
  server: { port: 8887 },
  preview: { port: 8887 },
});
