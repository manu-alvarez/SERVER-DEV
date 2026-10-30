import { createApp } from './app';

// Punto de entrada del contenedor de producción (CMD ["node", "dist/server.js"]).
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
