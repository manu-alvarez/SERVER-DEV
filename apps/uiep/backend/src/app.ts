import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { registerHealthRoute } from './routes/health';
import { registerGenerateRoute } from './routes/generate';
import { registerTemplatesRoute } from './routes/templates';
import { registerMcpRoute } from './routes/mcp';

/**
 * createApp — construye la aplicación Express sin abrir socket (independiente
 * del runtime), para reutilizarla desde server.ts o las pruebas de node:test.
 *
 * Toda la configuración replica el contrato del backend demo (server.js @ 40a1042):
 * helmet + cors + JSON 2mb + rate-limit 200 req/min.
 */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  registerHealthRoute(app);
  registerGenerateRoute(app);
  registerTemplatesRoute(app);
  registerMcpRoute(app);

  return app;
}
