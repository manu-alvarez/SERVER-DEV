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
const WWW  = path.join(__dirname, '../../www');

// ── API Keys Vault (GodMode) ──
let apiVault = {};
const vaultPath = path.join(__dirname, 'api_keys_vault.json');
function loadVault() {
  try {
    if (fs.existsSync(vaultPath)) {
      apiVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
      console.log('[Security] API Vault loaded successfully for GodMode');
    }
  } catch (e) {
    console.error('[Security] Failed to load API Vault:', e.message);
  }
}
loadVault();
try {
  fs.watch(vaultPath, (eventType) => {
    if (eventType === 'change') loadVault();
  });
} catch(e) {}

// ── Compression ──
app.use(compression({ level: 6, threshold: 1024 }));

// ── Security Headers ──
app.use((req, res, next) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "media-src 'self' https:",
    "frame-src 'self' https://trello.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  res.setHeader('Content-Security-Policy', csp.join('; '));
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── CORS ──
const ALLOWED_ORIGINS = [
  'https://manuelalvarez.dev',
];
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.manuelalvarez\.dev$/,
];

app.use((req, res, next) => {
  const origin = req.headers.origin || '';

  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://manuelalvarez.dev');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Auth middleware for admin endpoints ──
function requireAdminAuth(req, res, next) {
  const ADMIN_TOKEN = apiVault.GODMODE_MASTER_TOKEN || process.env.ADMIN_API_TOKEN;
  if (!ADMIN_TOKEN) return res.status(500).json({ error: 'Admin auth not configured' });
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: admin token required' });
  }
  next();
}

// ── Runtime config endpoint ──
app.get('/__config', requireAdminAuth, (req, res) => {
  res.json({
    livekitUrl: process.env.LIVEKIT_URL || 'wss://nikolina-1jg7t00i.livekit.cloud',
    nikolinaApi: '/_nikolina/api',
    ateneaApi: '/_atenea',
  });
});

// ── Health check ──
const net = require('net');
function checkPort(port, host = 'host.docker.internal', timeout = 3000) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', (e) => {
      console.error(`[CheckPort Error] ${host}:${port} ->`, e.message);
      resolve(false);
    });
    sock.on('timeout', () => {
      console.error(`[CheckPort Timeout] ${host}:${port}`);
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, host);
  });
}

// [host, port] — Docker containers resolved by name on msbross_net
const BACKEND_MAP = {
  'nikolina-api-hub':       ['nikolina-api-hub',          8001],
  'industrialpro-backend':  ['industrialpro-backend',     8002],
  'elitescout-backend':     ['elitescout-backend',        8003],
  'traductor-backend':      ['traductor-backend',         8004],

  'iaprod-backend':         ['iaprod-backend',            8006],
  'cuentos-magicos':        ['cuentos-magicos-backend',   8007],
  'web-restaurante-atenea': ['atenea-backend',            8009],
  'jartosdto-backend':      ['jartosdto-backend',         8010],
  'gas-station':            ['gas-station-backend',       3005],
  'perfume-trading':        ['perfume-trading',           3000],
  'mapfre':                 ['mapfre',                    3333],
  'txa-fitness-pro':        ['txa-fitness-pro',           3000],
  'it-english-backend':     ['it-english-backend',        8787],
  'msbross-backend':        ['msbross-backend',           8005],
};

app.get('/__health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(BACKEND_MAP).map(async ([name, [host, port]]) => {
      const online = await checkPort(port, host);
      console.log(`[Health] Check ${name} (${host}:${port}) -> ${online ? 'UP' : 'DOWN'}`);
      return { name, port, online };
    })
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
  try { visitsData = JSON.parse(fs.readFileSync(visitsFile, 'utf8')); } catch(e) {}
}
function updateVisits() {
  const now = new Date().toDateString();
  if (visitsData.lastDate !== now) {
    visitsData.today = 0;
    visitsData.lastDate = now;
  }
  visitsData.total++;
  visitsData.today++;
  try {
    const dir = path.dirname(visitsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(visitsFile, JSON.stringify(visitsData));
  } catch(e) {}
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
  'edelweiss', 'expositator-rte', 'iaprod-os', 'jartosdto',
  'logisearch', 'moko-tools', 'msbross', 'gas-station', 'livekit-nikolina',
  'taskflow', 'traductor-pro', 'web-restaurante-atenea', 'it-english-coach',
  'cv', 'logitrack', 'maya', 'assistant'
];

const DOMAIN_APP_MAP = {
  'iaprod.manuelalvarez.dev': 'iaprod-os',
  'jartosdto.manuelalvarez.dev': 'jartosdto',
  'traductor.manuelalvarez.dev': 'traductor-pro',
  'industrial.manuelalvarez.dev': 'industrialpro',
  'combipro.manuelalvarez.dev': 'combipro',
  'cuentos.manuelalvarez.dev': 'cuentos-magicos',
  'gasstation.manuelalvarez.dev': 'gas-station',
  'elitescout.manuelalvarez.dev': 'elitescout',
  'nikolina.manuelalvarez.dev': 'livekit-nikolina',
  'appgen.manuelalvarez.dev': 'app-generator',
  'expositator.manuelalvarez.dev': 'expositator-rte',
  'itenglish.manuelalvarez.dev': 'it-english-coach',
  'logisearch.manuelalvarez.dev': 'logisearch',
  // 'logitrack.manuelalvarez.dev': 'logisearch',
  'mano.manuelalvarez.dev': 'msbross',
  'mokotools.manuelalvarez.dev': 'moko-tools',
  'assistant.manuelalvarez.dev': 'assistant',
  // 'manuelalvarez.dev': 'assistant', // root serves static from www/
  'maya.manuelalvarez.dev': 'maya',
  'atenea.manuelalvarez.dev': 'web-restaurante-atenea',
  'taskflow.manuelalvarez.dev': 'taskflow',
  'edelweiss.manuelalvarez.dev': 'edelweiss',
  'cv.manuelalvarez.dev': 'cv'
};

app.use((req, res, next) => {
  const host = req.hostname;

  if (host === 'mano.manuelalvarez.dev') {
    return res.redirect(302, 'https://play.google.com/store/apps/details?id=com.manoelectricaazul.app');
  }

  if (host === 'maya.manuelalvarez.dev') {
    return res.redirect(302, 'https://manu-alvarez.github.io/TuEnergiaMaya/');
  }

  if (host === 'logitrack.manuelalvarez.dev') {
    return res.redirect(302, 'https://trello.com/b/IRVpzuUt/logitrack-operaciones-de-almacen');
  }


  const mappedApp = DOMAIN_APP_MAP[host];
  if (mappedApp && !req.url.startsWith('/api') && (!req.url.startsWith('/_') || req.url.startsWith('/_next'))) {
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
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
    proxyReq: (proxyReq, req, res) => {
      // ── GODMODE INJECTOR ──
      const godmodeToken = req.headers['x-godmode-token'];
      if (godmodeToken && godmodeToken === apiVault.GODMODE_MASTER_TOKEN) {
        proxyReq.setHeader('x-godmode-active', 'true');
        if (apiVault.LLM_PROVIDERS?.OPENAI?.[0]?.key) proxyReq.setHeader('x-injected-openai', apiVault.LLM_PROVIDERS.OPENAI[0].key);
        if (apiVault.LLM_PROVIDERS?.ANTHROPIC?.[0]?.key) proxyReq.setHeader('x-injected-anthropic', apiVault.LLM_PROVIDERS.ANTHROPIC[0].key);
        if (apiVault.LLM_PROVIDERS?.GOOGLE_GEMINI?.[0]?.key) proxyReq.setHeader('x-injected-google', apiVault.LLM_PROVIDERS.GOOGLE_GEMINI[0].key);
        if (apiVault.LLM_PROVIDERS?.GROQ?.[0]?.key) proxyReq.setHeader('x-injected-groq', apiVault.LLM_PROVIDERS.GROQ[0].key);
        if (apiVault.LLM_PROVIDERS?.MISTRAL?.[0]?.key) proxyReq.setHeader('x-injected-mistral', apiVault.LLM_PROVIDERS.MISTRAL[0].key);
        if (apiVault.OLLAMA_URL) proxyReq.setHeader('x-injected-ollama', apiVault.OLLAMA_URL);
        if (apiVault.LLM_PROVIDERS?.OPENROUTER?.[0]?.key) proxyReq.setHeader('x-injected-openrouter', apiVault.LLM_PROVIDERS.OPENROUTER[0].key);
        
        // Inject other services
        if (apiVault.THEODDS_API_KEY) proxyReq.setHeader('x-injected-theodds', apiVault.THEODDS_API_KEY);
        if (apiVault.TAVILY_API_KEY) proxyReq.setHeader('x-injected-tavily', apiVault.TAVILY_API_KEY);
      }
    },
  },
});

// ── API Proxy Routes ──
app.use('/_nikolina',      createProxyMiddleware(proxyOpts('http://nikolina-api-hub:8001', '/_nikolina', true)));
app.use('/_gas-station',   createProxyMiddleware(proxyOpts('http://gas-station-backend:3005', '/_gas-station')));
app.use('/_industrialpro', createProxyMiddleware(proxyOpts('http://industrialpro-backend:8002', '/_industrialpro')));

app.use('/app/elitescout', createProxyMiddleware({
  target: 'http://elitescout-backend:8003/app/elitescout',
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy error] ${req.url} -> http://elitescout-backend:8003: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'Backend unavailable', detail: err.message });
    },
    proxyReq: (proxyReq, req, res) => {
      const godmodeToken = req.headers['x-godmode-token'];
      if (godmodeToken && godmodeToken === apiVault.GODMODE_MASTER_TOKEN) {
        proxyReq.setHeader('x-godmode-active', 'true');
        if (apiVault.LLM_PROVIDERS?.OPENAI?.[0]?.key) proxyReq.setHeader('x-injected-openai', apiVault.LLM_PROVIDERS.OPENAI[0].key);
      }
    }
  }
}));

app.use('/_iaprod',        createProxyMiddleware(proxyOpts('http://iaprod-backend:8006', '/_iaprod')));
app.use('/_itenglish',     createProxyMiddleware(proxyOpts('http://it-english-backend:8787', '/_itenglish')));
app.use('/_cuentosmagicos',createProxyMiddleware(proxyOpts('http://cuentos-magicos-backend:8007', '/_cuentosmagicos')));
app.use('/_jartosdto',     createProxyMiddleware(proxyOpts('http://jartosdto-backend:8010', '/_jartosdto')));
app.use('/_atenea',        createProxyMiddleware(proxyOpts('http://atenea-backend:8009', '/_atenea')));
app.use('/_traductor',     createProxyMiddleware(proxyOpts('http://traductor-backend:8004', '/_traductor')));
app.use('/_msbross',       createProxyMiddleware(proxyOpts('http://msbross-backend:8005', '/_msbross')));


// ── IT English Coach AI Proxy ──
app.post('/_coach/api/evaluate', express.json(), async (req, res) => {
  try {
    const geminiKey = apiVault?.LLM_PROVIDERS?.GOOGLE_GEMINI?.[0]?.key;
    if (!geminiKey) return res.status(500).json({ error: 'Gemini Key missing in GodMode vault' });

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

// ── TheOdds API Proxy for CombiPro (GodMode Injector) ──
app.use('/_oddsapi', (req, res, next) => {
  const godmodeToken = req.headers['x-godmode-token'];
  const userKey = req.headers['x-user-custom-keys'];
  
  let apiKeyToUse = null;
  if (godmodeToken && godmodeToken === apiVault.GODMODE_MASTER_TOKEN && apiVault.THEODDS_API_KEY) {
    apiKeyToUse = apiVault.THEODDS_API_KEY;
  } else if (userKey) {
    try {
      const keys = JSON.parse(userKey);
      if (keys.theodds) apiKeyToUse = keys.theodds;
    } catch (e) {}
  }
  
  if (!apiKeyToUse && req.query.apiKey) {
    apiKeyToUse = req.query.apiKey;
  }

  // Si no hay API key tras intentar todas las vías, devolver error para evitar fallo en TheOdds
  if (!apiKeyToUse) {
    return res.status(401).json({ error: 'Missing API Key for TheOdds API' });
  }

  // Modificar req.url para asegurar que incluya el apiKey
  // Quitamos cualquier apiKey existente para no duplicar
  const urlObj = new URL(req.url, 'http://localhost');
  urlObj.searchParams.set('apiKey', apiKeyToUse);
  req.url = urlObj.pathname + urlObj.search;

  next();
}, createProxyMiddleware({
  target: 'https://api.the-odds-api.com',
  changeOrigin: true,
  pathRewrite: { '^/_oddsapi': '' },
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy error] TheOdds API: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'Backend unavailable' });
    }
  }
}));

// ── LiveKit WebSocket proxy ──
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

// ── Generic AI Proxy Endpoints for GodMode Ecosystem ──
const createAIProxy = (path, target, extractUserKey, injectGodModeKey) => {
  app.use(path, (req, res, next) => {
    const godmodeToken = req.headers['x-godmode-token'];
    const userKeyHeader = req.headers['x-user-custom-keys'];
    
    let keyToUse = null;
    if (godmodeToken && godmodeToken === apiVault.GODMODE_MASTER_TOKEN) {
      keyToUse = injectGodModeKey();
    } else if (userKeyHeader) {
      try {
        const keys = JSON.parse(userKeyHeader);
        keyToUse = extractUserKey(keys);
      } catch (e) {}
    }
    
    req.proxyAuthKey = keyToUse;
    next();
  }, createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    pathRewrite: { [`^${path}`]: '' },
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.proxyAuthKey) {
          if (path.includes('gemini')) {
            proxyReq.path = proxyReq.path.includes('?') 
              ? `${proxyReq.path}&key=${req.proxyAuthKey}`
              : `${proxyReq.path}?key=${req.proxyAuthKey}`;
          } else {
            proxyReq.setHeader('Authorization', `Bearer ${req.proxyAuthKey}`);
          }
        }
      },
      error: (err, req, res) => {
        console.error(`[AI Proxy error] ${path}: ${err.message}`);
        if (res && res.writeHead) res.status(502).json({ error: 'AI Backend unavailable' });
      }
    }
  }));
};

createAIProxy('/_api/tavily', 'https://api.tavily.com', k => k.tavily, () => apiVault.TAVILY_API_KEY);
createAIProxy('/_api/gemini', 'https://generativelanguage.googleapis.com', k => k.gemini, () => apiVault.GEMINI_API_KEY);
createAIProxy('/_api/openrouter', 'https://openrouter.ai/api', k => k.openrouter, () => apiVault.OPENROUTER_API_KEY);
createAIProxy('/_api/groq', 'https://api.groq.com', k => k.groq, () => apiVault.GROQ_API_KEY);
createAIProxy('/_api/anthropic', 'https://api.anthropic.com', k => k.anthropic, () => apiVault.ANTHROPIC_API_KEY);


// ── Static files & SPA fallback ──
app.use(express.static(WWW, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
  }
}));

app.get(/\/(favicon\.ico|favicon\.svg|vite\.svg|logo\.png|logo\.svg|apple-touch-icon\.png)$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.png'));
});

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
