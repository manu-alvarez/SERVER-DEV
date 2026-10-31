import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { registerHealthRoute } from './routes/health';
import { registerGenerateRoute } from './routes/generate';
import { registerTemplatesRoute } from './routes/templates';
import { registerMcpRoute } from './routes/mcp';
import { registerSpecsRoute } from './routes/specs';
import { registerModelGatewayRoute } from './routes/model-gateway';

/**
 * createApp — construye la aplicación Express sin abrir socket (independiente
 * del runtime), para reutilizarla desde server.ts o las pruebas de node:test.
 *
 * Toda la configuración replica el contrato del backend demo (server.js @ 40a1042):
 * helmet + cors + JSON 2mb + rate-limit 200 req/min.
 */

/** Topología de producción auditada (Fase 0.2):
 *  cliente → Traefik (edge; sin forwardedHeaders configurados → reemplaza el
 *  X-Forwarded-For entrante no confiable por la IP real del cliente) →
 *  msbross-proxy (único salto TCP hacia este backend; http-proxy-middleware sin
 *  `xfwd`, reenvía cabeceras intactas) → Express en msbross_net (172.20.0.0/16).
 *
 *  Regla de confianza: SOLO peers de la subred interna de msbross_net. req.ip
 *  resuelve a la IP que Traefik registró (cliente real); prefijos XFF suplantados
 *  por el cliente quedarían a la izquierda y se ignoran; si el puerto quedara
 *  expuesto directamente, el peer no estaría en la subred y se usaría su IP de
 *  socket (conservador). Nota: si la subred de msbross_net cambiara, ajustar aquí.
 */
const PRODUCTION_TRUST_PROXY = '172.20.0.0/16';

export function createApp(options: { trustProxy?: string | number | boolean } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // req.ip = IP real del cliente (registrada por Traefik) cuando la petición
  // llega desde la subred confiable → rate-limit por cliente, no por proxy.
  app.set('trust proxy', options.trustProxy ?? PRODUCTION_TRUST_PROXY);
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
  registerSpecsRoute(app);
  registerModelGatewayRoute(app);

  return app;
}
