'use strict';

const path    = require('path');
const fs      = require('fs');
const express = require('express');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app  = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = 8080;
const WWW  = path.join(__dirname, 'www');

// ── Compression (gzip/brotli for all text responses) ──
app.use(compression({ level: 6, threshold: 1024 }));

// Fallback global routes for favicons
app.get(/\/(favicon\.ico|favicon\.svg|vite\.svg|logo\.png|logo\.svg|apple-touch-icon\.png)$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.png'));
});

// ── Security Headers ──
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Rate Limiting (100 req / min) ──
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── CORS: Restricted in Production ──
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigins = [
    'https://msbross.me', 
    'https://www.msbross.me', 
    'http://localhost:8080', 
    'http://host.docker.internal:8080'
  ];

  let allowOrigin = origin || 'https://msbross.me'; // Allow current origin if valid, else fallback
  
  const isAllowedDomain = origin && (
    origin.endsWith('.manuelalvarez.dev') || 
    origin.endsWith('.msbross.me') || 
    origin === 'https://manuelalvarez.dev' || 
    origin === 'https://msbross.me'
  );

  if (allowedOrigins.includes(origin) || isAllowedDomain) {
    allowOrigin = origin;
  } else if (isDev && origin && (origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://localhost:'))) {
    allowOrigin = origin;
  } else if (origin) {
    // If not allowed, send fallback
    allowOrigin = 'https://msbross.me';
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Runtime config endpoint (so static HTML can learn the tunnel URL) ──
app.get('/__config', (req, res) => {
  res.json({
    livekitUrl: process.env.LIVEKIT_URL || 'wss://nikolina-1jg7t00i.livekit.cloud',
    nikolinaApi: '/_nikolina/api',
    ateneaApi: '/_atenea',
  });
});

// ── IT English Coach AI Endpoint ──
app.post('/_coach/api/evaluate', express.json(), async (req, res) => {
  try {
    const vault = require('./api_keys_vault.json');
    const geminiKey = vault?.LLM_PROVIDERS?.GOOGLE_GEMINI?.[0]?.key;
    if (!geminiKey) return res.status(500).json({ error: 'Gemini Key missing' });

    const { messages = [], system } = req.body;
    const contents = [];
    if (system) {
      contents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${system}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (error) {
    console.error('Coach API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Health check (comprehensive — pings all backends) ──
const net = require('net');
function checkPort(port, host = 'host.docker.internal', timeout = 500) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

const BACKEND_MAP = {
  'nikolina-api-hub': 8001,
  'elitescout-server': 8003,
  'traductor-pro': 8004,
  'msbross-backend': 8005,
  'iaputa-backend': 8006,
  'cuentos-magicos': 8007,
  'web-restaurante-atenea': 8009,
  'jartosdto-backend': 8010,
  'gas-station': 3005,
  'perfume-trading': 3011,
  'mapfre': 3333,
  'txa-fitness-pro': 3456,
};

app.get('/__health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(BACKEND_MAP).map(async ([name, port]) => ({
      name, port, online: await checkPort(port, name),
    }))
  );
  const online = checks.filter(c => c.online).length;
  const total = checks.length;
  res.json({
    status: online === total ? 'healthy' : online > 0 ? 'degraded' : 'down',
    proxy: { uptime: Math.floor(process.uptime()), memMB: Math.round(process.memoryUsage.rss() / 1024 / 1024) },
    services: { online, total },
    backends: checks.reduce((acc, c) => { acc[c.name] = c.online ? 'up' : 'down'; return acc; }, {}),
  });
});

// ── Visit Tracking ──
const visitsFile = path.join(__dirname, 'data', 'visits.json');
let visitsData = { total: 0, today: 0, lastDate: new Date().toDateString() };
if (fs.existsSync(visitsFile)) {
  try { visitsData = JSON.parse(fs.readFileSync(visitsFile, 'utf8')); } catch(e){}
}
function updateVisits() {
  const now = new Date().toDateString();
  if (visitsData.lastDate !== now) {
    visitsData.today = 0;
    visitsData.lastDate = now;
  }
  visitsData.total++;
  visitsData.today++;
  fs.writeFileSync(visitsFile, JSON.stringify(visitsData));
}

app.get('/api/track-visit', (req, res) => {
  updateVisits();
  const buf = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(buf);
});

app.get('/api/visits', (req, res) => {
  const now = new Date().toDateString();
  if (visitsData.lastDate !== now) {
    visitsData.today = 0;
    visitsData.lastDate = now;
  }
  res.json(visitsData);
});

app.get('/api/visits-badge', (req, res) => {
  updateVisits();
  const text = `Visits: ${visitsData.total} | Today: ${visitsData.today}`;
  const width = text.length * 7 + 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20">
    <linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
    <rect width="${width}" height="20" fill="#4c1d95" rx="3"/>
    <rect width="${width}" height="20" fill="url(#b)" rx="3"/>
    <text x="${width/2}" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">${text}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(svg);
});

// ── Static SPAs ──
const NEXT_APPS = [
  'app-generator', 'cuentos-magicos', 'combipro', 'industrialpro',
  'edelweiss', 'expositator-rte', 'iaputa-os', 'jartosdto',
  'logisearch', 'moko-tools', 'msbross', 'gas-station', 'livekit-nikolina',
  'taskflow', 'traductor-pro', 'web-restaurante-atenea', 'it-english-coach',
  'cv', 'logitrack', 'maya', 'assistant'
];

const DOMAIN_APP_MAP = {
  'iaputa.manuelalvarez.dev': 'iaputa-os',
  'jartosdto.manuelalvarez.dev': 'jartosdto',
  'traductor.manuelalvarez.dev': 'traductor-pro',
  'industrial.manuelalvarez.dev': 'industrialpro',
  'combipro.manuelalvarez.dev': 'combipro',
  'cuentos.manuelalvarez.dev': 'cuentos-magicos',
  'gasstation.manuelalvarez.dev': 'gas-station',
  'elitescout.manuelalvarez.dev': 'elitescout',
  'nikolina.manuelalvarez.dev': 'livekit-nikolina',
  'appgenerator.manuelalvarez.dev': 'app-generator',

  'expositator.manuelalvarez.dev': 'expositator-rte',
  'itenglish.manuelalvarez.dev': 'it-english-coach',
  'logisearch.manuelalvarez.dev': 'logisearch',
  'logitrack.manuelalvarez.dev': 'logitrack',
  'mano.manuelalvarez.dev': 'msbross',
  'mokotools.manuelalvarez.dev': 'moko-tools',
  'assistant.manuelalvarez.dev': 'assistant',
  'assitant.manuelalvarez.dev': 'assistant',
  'maya.manuelalvarez.dev': 'maya',
  'atenea.manuelalvarez.dev': 'web-restaurante-atenea',
  'taskflow.manuelalvarez.dev': 'taskflow',
  'edelweiss.manuelalvarez.dev': 'edelweiss',
  'cv.manuelalvarez.dev': 'cv'
};

app.use((req, res, next) => {
  const host = req.hostname;
  
  // Mano Eléctrica Azul redirect to Play Store
  if (host === 'mano.manuelalvarez.dev') {
    return res.redirect(302, 'https://play.google.com/store/apps/details?id=com.manoelectricaazul.app');
  }

  const mappedApp = DOMAIN_APP_MAP[host];
  if (mappedApp && !req.url.startsWith('/api') && !req.url.startsWith('/_')) {
    if (req.url === '/') {
      req.url = `/app/${mappedApp}/`;
    } else if (!req.url.startsWith(`/app/${mappedApp}`)) {
      req.url = `/app/${mappedApp}${req.url}`;
    }
  }
  next();
});

for (const name of NEXT_APPS) {
  const appDir  = path.join(WWW, 'app', name);
  const prefix  = `/app/${name}`;

  app.get(prefix, (req, res, next) => {
    if (req.originalUrl === prefix) {
      return res.redirect(301, prefix + '/');
    }
    next();
  });

  app.use(prefix, express.static(appDir, { 
    index: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html') || path.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache assets for a year
      }
      if (path.endsWith('opengraph-image')) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get(new RegExp(`^/app/${name}/(.*)$`), (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const indexFile = path.join(appDir, 'index.html');
    res.sendFile(indexFile, err => { 
      if (err) {
        console.error(`Error serving ${indexFile}:`, err.message);
        next(); 
      }
    });
  });
}

// ── Proxy helpers ──
const proxyOpts = (target, stripPrefix, ws = false) => ({
  target,
  changeOrigin: true,
  ws,
  pathRewrite: { [`^${stripPrefix}`]: '' },
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy error] ${req.url} -> ${target}: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'Backend unavailable', detail: err.message });
    },
    proxyReqWs: (proxyReq, req, socket) => {
      console.log(`[WebSocket] ${req.url} -> ${target}`);
    },
  },
});

// ── API routes ──
app.use('/_nikolina',      createProxyMiddleware(proxyOpts('http://nikolina-api-hub:8001', '/_nikolina', true)));
app.use('/_gas-station',        createProxyMiddleware(proxyOpts('http://gas-station-backend:3005', '/_gas-station')));
app.use('/_industrialpro',        createProxyMiddleware(proxyOpts('http://industrialpro-backend:8002', '/_industrialpro')));
app.use('/app/elitescout', createProxyMiddleware({
  target: 'http://elitescout-backend:8003/app/elitescout',
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy error] ${req.url} -> http://elitescout-backend:8003: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'Backend unavailable', detail: err.message });
    }
  }
}));




app.use('/_traductor',     createProxyMiddleware(proxyOpts('http://traductor-backend:8004', '/_traductor')));
app.use('/_msbross',       createProxyMiddleware(proxyOpts('http://msbross-backend:8005', '/_msbross')));
app.use('/_iaputa',        createProxyMiddleware(proxyOpts('http://iaputa-backend:8006', '/_iaputa')));
app.use('/_itenglish',     createProxyMiddleware(proxyOpts('http://it-english-backend:8787', '/_itenglish')));
app.use('/_cuentosmagicos',createProxyMiddleware(proxyOpts('http://cuentos-magicos-backend:8007', '/_cuentosmagicos')));
app.use('/_jartosdto',     createProxyMiddleware(proxyOpts('http://jartosdto-backend:8010', '/_jartosdto')));
app.use('/_atenea',        createProxyMiddleware(proxyOpts('http://host.docker.internal:8009', '/_atenea')));

// ── LiveKit WebSocket proxy (for self-hosted LiveKit) ──
app.use('/rtc', createProxyMiddleware({
  target: 'http://host.docker.internal:7880',
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res) => {
      console.error(`[LiveKit WS Error] ${req.url}: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'LiveKit unavailable' });
    },
    proxyReqWs: (proxyReq, req, socket) => {
      console.log(`[LiveKit WS] ${req.url} -> ws://host.docker.internal:7880`);
    },
  },
}));

// ── Static files & SPA fallback ──
app.use(express.static(WWW, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
  }
}));
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.status(404).sendFile(path.join(WWW, 'index.html'));
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(`[Global Error] ${req.method} ${req.url} - ${err.message}`);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ── Start HTTP ──
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MSBrossAI Proxy] Puerto ${PORT} — ${NEXT_APPS.length} apps montadas`);
  console.log(`   Portal: http://localhost:${PORT}/`);
  console.log(`   Apps:   /app/{${NEXT_APPS.join('|')}}/`);
  console.log(`   APIs:   /_nikolina /_atenea /_elitescout /_cuentosmagicos /rtc (LiveKit WS)`);
  console.log(`   Config: /__config   Health: /__health`);
});

// ── Start HTTPS (self-signed for LAN) ──
try {
  const https = require('https');
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: 'msbross-local' }];
  const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
  const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, app);
  httpsServer.listen(8443, '0.0.0.0', () => {
    console.log(`   SSL:     https://0.0.0.0:8443/ (self-signed, LAN only)`);
  });
} catch (e) {
  console.log(`[!] SSL en 8443 no disponible: ${e.message}`);
}
