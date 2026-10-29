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

// ── API Keys Vault ──
let apiVault = {};
const vaultPath = path.join(__dirname, 'api_keys_vault.json');
function loadVault() {
  try {
    if (fs.existsSync(vaultPath)) {
      apiVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
      console.log('[Security] API Vault loaded successfully');
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

// ── Key Rotation Tracker ──
const providerKeyIndices = {
  OPENAI: 0,
  ANTHROPIC: 0,
  GOOGLE_GEMINI: 0,
  GROQ: 0,
  MISTRAL: 0,
  OPENROUTER: 0
};

function rotateVaultKey(provider) {
  const keys = apiVault.LLM_PROVIDERS?.[provider];
  if (keys && keys.length > 1) {
    providerKeyIndices[provider] = (providerKeyIndices[provider] + 1) % keys.length;
    console.warn(`[Proxy Rotation] Rotated ${provider} to key index ${providerKeyIndices[provider]}`);
  }
}

function getVaultKey(provider) {
  if (provider === 'OLLAMA') return apiVault.OLLAMA_URL;
  if (provider === 'TAVILY') return apiVault.TAVILY_API_KEY;
  if (provider === 'THEODDS') return apiVault.THEODDS_API_KEY;
  
  try {
    if (!apiVault.LLM_PROVIDERS) return null;
    const keys = apiVault.LLM_PROVIDERS[provider];
    if (providerKeyIndices[provider] === undefined || isNaN(providerKeyIndices[provider])) {
      providerKeyIndices[provider] = 0;
    }
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      if (provider === 'GOOGLE_GEMINI') return apiVault.GEMINI_API_KEY;
      if (provider === 'GROQ') return apiVault.GROQ_API_KEY;
      if (provider === 'ANTHROPIC') return apiVault.ANTHROPIC_API_KEY;
      if (provider === 'OPENROUTER') return apiVault.OPENROUTER_API_KEY;
      return null;
    }
    
    const idx = providerKeyIndices[provider] % keys.length;
    if (!keys[idx]) {
       console.error(`[getVaultKey] Error: keys[${idx}] is undefined for provider ${provider}! length is ${keys.length}`);
       return null;
    }
    return keys[idx].key; 
  } catch (e) {
    console.error(`[getVaultKey] Fatal error for ${provider}:`, e);
    return null;
  }
}

// ── Compression ──
app.use(compression({ level: 6, threshold: 1024 }));

// ── Security Headers ──

// Anti-cache headers for UIEP and IA Prod OS frontends
if (req.hostname === 'uiep.manuelalvarez.dev' || req.hostname === 'iaprod.manuelalvarez.dev') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
}
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
  const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
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


// ── Contact Message Endpoint ──
const messagesFile = path.join(__dirname, '../../data', 'messages.json');
app.post('/api/contact', express.json(), (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nombre, email y mensaje son campos obligatorios.' });
  }

  const msgEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    name: String(name).slice(0, 100).trim(),
    email: String(email).slice(0, 120).trim(),
    subject: String(subject || 'Mensaje desde manuelalvarez.dev').slice(0, 150).trim(),
    message: String(message).slice(0, 5000).trim(),
  };

  try {
    const dir = path.dirname(messagesFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let existing = [];
    if (fs.existsSync(messagesFile)) {
      try { existing = JSON.parse(fs.readFileSync(messagesFile, 'utf8')); } catch(e) {}
    }
    existing.unshift(msgEntry);
    fs.writeFileSync(messagesFile, JSON.stringify(existing.slice(0, 500), null, 2));
    console.log(`[Contact] Mensaje recibido de ${msgEntry.name} <${msgEntry.email}>`);
    return res.json({ success: true, message: '¡Mensaje recibido correctamente! Manuel se pondrá en contacto pronto.' });
  } catch (err) {
    console.error('[Contact Error]', err);
    return res.status(500).json({ error: 'Error interno al procesar el mensaje.' });
  }
});

// ── Static SPAs ──
const NEXT_APPS = [
  'agent-builder-pro', 'agent-forge', 'app-generator', 'combipro', 'cuadrante-horarios',
  'cuentos-magicos', 'cv', 'edelweiss', 'expositator-rte', 'gas-station',
  'iaprod-os', 'industrialpro', 'intercompiler', 'jartosdto',
  'livekit-nikolina', 'logisearch', 'logitrack', 'maya', 'moko-tools',
  'msbross', 'multi-agent-orch', 'omnidev-os', 'perfume-ean', 'perfume-trading',
  'prompt-generator', 'tarot-maya', 'tarot-rws', 'taskflow', 'teringo',
  'admin-dashboard', 'dev-dashboard',
  'traductor-pro', 'tu-energia-maya', 'uiep', 'web-restaurante-atenea',
  'it-english-coach', 'assistant'
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
  'cv.manuelalvarez.dev': 'cv',
  'uiep.manuelalvarez.dev': 'uiep',
  'tarot.manuelalvarez.dev': 'tarot-rws'
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

  if (host === 'nikolina.manuelalvarez.dev' && req.url.startsWith('/api')) {
    req.url = `/_nikolina${req.url}`;
  }

  

const mappedApp = DOMAIN_APP_MAP[host];
  if (mappedApp && !req.url.startsWith('/api') && (!req.url.startsWith('/_') || req.url.startsWith('/_next'))) {
    if (req.url === '/') {
      req.url = `/app/${mappedApp}/`;
    } else if (!req.url.startsWith(`/app/${mappedApp}`)) {
      req.url = `/app/${mappedApp}${req.url}`;
    }
  }

  // Handle SPA subpaths and assets when accessed via main domain or without mapped subdomain
  if (!mappedApp) {
    const referer = req.headers.referer || '';
    if (req.url.startsWith('/_next/')) {
      if (referer.includes('/app/cuentos-magicos')) {
        req.url = `/app/cuentos-magicos${req.url}`;
      } else if (referer.includes('/app/jartosdto')) {
        req.url = `/app/jartosdto${req.url}`;
      } else if (referer.includes('/app/uiep')) {
        req.url = `/app/uiep${req.url}`;
      }
    }
    if (req.path === '/stories' || req.path.startsWith('/stories/') || req.path === '/create' || req.path.startsWith('/create/')) {
      return res.redirect(302, `/app/cuentos-magicos${req.url}`);
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
    index: 'index.html',
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

  app.get(new RegExp(`^/app/${name}(?:/(.*))?$`), (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const sub = (req.params[0] || '').split('?')[0].replace(/\/+$/, '');
    if (sub) {
      const candidates = [
        path.join(appDir, sub, 'index.html'),
        path.join(appDir, sub + '.html'),
        path.join(appDir, sub)
      ];
      for (const p of candidates) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          return res.sendFile(p);
        }
      }
    }
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
      // ── Auto-inject API keys from vault for all backend requests ──
      const oai = getVaultKey('OPENAI'); if (oai) proxyReq.setHeader('x-injected-openai', oai);
      const ant = getVaultKey('ANTHROPIC'); if (ant) proxyReq.setHeader('x-injected-anthropic', ant);
      const gem = getVaultKey('GOOGLE_GEMINI'); if (gem) proxyReq.setHeader('x-injected-google', gem);
      const gro = getVaultKey('GROQ'); if (gro) proxyReq.setHeader('x-injected-groq', gro);
      const mis = getVaultKey('MISTRAL'); if (mis) proxyReq.setHeader('x-injected-mistral', mis);
      const oll = getVaultKey('OLLAMA'); if (oll) proxyReq.setHeader('x-injected-ollama', oll);
      const opr = getVaultKey('OPENROUTER'); if (opr) proxyReq.setHeader('x-injected-openrouter', opr);
      const odd = getVaultKey('THEODDS'); if (odd) proxyReq.setHeader('x-injected-theodds', odd);
      const tav = getVaultKey('TAVILY'); if (tav) proxyReq.setHeader('x-injected-tavily', tav);
    },
  },
});

// ── API Proxy Routes ──
app.use('/_nikolina',      createProxyMiddleware(proxyOpts('http://nikolina-api-hub:8001', '/_nikolina', true)));
app.use('/_gas-station',   createProxyMiddleware(proxyOpts('http://gas-station-backend:3005', '/_gas-station')));
app.use('/_industrialpro', createProxyMiddleware(proxyOpts('http://industrialpro-backend:8002', '/_industrialpro')));

app.use('/app/elitescout', createProxyMiddleware({
  target: 'http://elitescout-backend:8003/app/elitescout/',
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy error] ${req.url} -> http://elitescout-backend:8003: ${err.message}`);
      if (res && res.writeHead) res.status(502).json({ error: 'Backend unavailable', detail: err.message });
    },
    proxyReq: (proxyReq, req, res) => {
      if (apiVault.LLM_PROVIDERS?.OPENAI?.[0]?.key) proxyReq.setHeader('x-injected-openai', apiVault.LLM_PROVIDERS.OPENAI[0].key);
    }
  }
}));

app.use("/_uiep", createProxyMiddleware(proxyOpts("http://uiep-backend:4000", "/_uiep")));
app.use('/_iaprod',        createProxyMiddleware(proxyOpts('http://iaprod-backend:8006', '/_iaprod')));
app.use('/_itenglish',     createProxyMiddleware(proxyOpts('http://it-english-backend:8787', '/_itenglish')));
app.use('/_cuentosmagicos',createProxyMiddleware(proxyOpts('http://cuentos-magicos-backend:8007', '/_cuentosmagicos')));
app.use('/_jartosdto',     createProxyMiddleware(proxyOpts('http://jartosdto-backend:8010', '/_jartosdto')));
app.use('/_atenea',        createProxyMiddleware(proxyOpts('http://atenea-backend:8009', '/_atenea')));
app.use('/_traductor',     createProxyMiddleware(proxyOpts('http://traductor-backend:8004', '/_traductor')));
app.use('/_msbross',       createProxyMiddleware(proxyOpts('http://msbross-backend:8005', '/_msbross')));
app.use('/_omnidev', createProxyMiddleware({ target: 'http://host.docker.internal:8765', changeOrigin: true, ws: true, pathRewrite: { '^/_omnidev': '' }, on: { error: (err, req, res) => { console.error('[OmniDev Proxy Error]', err.message); if (res && res.writeHead) res.status(502).json({ error: 'OmniDev backend unavailable' }); }, proxyReqWs: (proxyReq, req, socket) => { console.log('[OmniDev WS]', req.url); } } }));


// ── IT English Coach AI Proxy ──
app.post('/_coach/api/evaluate', express.json(), async (req, res) => {
  try {
    const keys = apiVault?.LLM_PROVIDERS?.GOOGLE_GEMINI || [];
    let keysToTry = keys.map(k => k.key);
    if (keysToTry.length === 0 && apiVault?.GEMINI_API_KEY) {
      keysToTry.push(apiVault.GEMINI_API_KEY);
    }
    if (keysToTry.length === 0) return res.status(500).json({ error: 'Gemini Key missing in API vault' });

    const { messages = [], system } = req.body;
    let successText = null;
    let lastStatus = 500;
    
    for (const geminiKey of keysToTry) {
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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (response.ok) {
        const data = await response.json();
        successText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        break; // Success!
      } else {
        lastStatus = response.status;
        console.warn(`[Coach Proxy] Gemini key failed with ${lastStatus}. Rotating...`);
        rotateVaultKey('GOOGLE_GEMINI');
      }
    }
    
    if (successText !== null) {
      return res.json({ text: successText });
    }
    
    console.warn(`[Coach Proxy] ALL Gemini keys failed. Falling back to Ollama VPS!`);
    const ollamaUrl = apiVault.OLLAMA_URL || 'http://172.20.0.1:11434';
    const ollamaMsgs = [];
    if (system) ollamaMsgs.push({ role: 'system', content: system });
    for (const msg of messages) {
      ollamaMsgs.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }
    
    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemma3:4b', messages: ollamaMsgs, stream: false })
    });
    
    if (ollamaRes.ok) {
      const oData = await ollamaRes.json();
      return res.json({ text: oData.message?.content || '' });
    }
    
    throw new Error(`Ollama fallback also failed: ${ollamaRes.status}`);

  } catch (error) {
    console.error('Coach API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── TheOdds API Proxy for CombiPro ──
app.use('/_oddsapi', (req, res, next) => {
  // Always inject vault key, fallback to query param
  let apiKeyToUse = apiVault.THEODDS_API_KEY || req.query.apiKey;

  if (!apiKeyToUse) {
    return res.status(401).json({ error: 'Missing API Key for TheOdds API' });
  }

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

// ── Generic AI Proxy Endpoints ──
const createAIProxy = (path, target, providerName) => {
  app.use(path, (req, res, next) => {
    let keyToUse = getVaultKey(providerName);
    
    req.proxyAuthKey = keyToUse;
    req.proxyProviderName = providerName;
    
    if (keyToUse && path.includes('gemini')) {
      const urlObj = new URL(req.url, 'http://localhost');
      urlObj.searchParams.set('key', keyToUse);
      req.url = urlObj.pathname + urlObj.search;
    }

    next();
  }, createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    pathRewrite: { [`^${path}`]: '' },
    on: {
      proxyRes: (proxyRes, req, res) => {
        if (proxyRes.statusCode === 429 || proxyRes.statusCode === 401) {
          console.warn(`[AI Proxy] Provider ${req.proxyProviderName} returned ${proxyRes.statusCode}. Rotating key.`);
          if (req.proxyProviderName) rotateVaultKey(req.proxyProviderName);
        }
      },
      proxyReq: (proxyReq, req, res) => {
        if (req.proxyAuthKey) {
          proxyReq.setHeader('Authorization', `Bearer ${req.proxyAuthKey}`);
        }
      },
      proxyReqWs: (proxyReq, req, socket, options, head) => {
        if (req.proxyAuthKey) {
          proxyReq.setHeader('Authorization', `Bearer ${req.proxyAuthKey}`);
        }
      },
      error: (err, req, res) => {
        console.error(`[AI Proxy error] ${path}: ${err.message}`);
        if (res && res.writeHead) res.status(502).json({ error: 'AI Backend unavailable' });
      }
    }
  }));
};

// ── Helper for async sleep ──
const delay = ms => new Promise(res => setTimeout(res, ms));

// ── Universal AI Fallback (LLMs) ──
const unifiedLlmHandler = async (req, res) => {
  const fallbackChain = ['GOOGLE_GEMINI', 'NVIDIA', 'CEREBRAS', 'GROQ', 'TOGETHER_AI', 'OLLAMA'];
  let body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  for (const provider of fallbackChain) {
    let key = getVaultKey(provider);
    if (!key && provider !== 'OLLAMA') continue;

    let url, headers = { 'Content-Type': 'application/json' };
    let providerBody = { ...body };

    if (provider === 'GOOGLE_GEMINI') {
      url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${key}`;
      headers['Authorization'] = `Bearer ${key}`;
      // Usar modelo moderno válido por defecto
      providerBody.model = 'gemini-1.5-flash'; 
    } else if (provider === 'NVIDIA') {
      url = 'https://integrate.api.nvidia.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${key}`;
      providerBody.model = 'meta/llama-3.1-8b-instruct';
    } else if (provider === 'GROQ') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${key}`;
      providerBody.model = 'llama-3.3-70b-versatile';
    } else if (provider === 'CEREBRAS') {
      url = 'https://api.cerebras.ai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${key}`;
      providerBody.model = 'llama3.1-8b';
    } else if (provider === 'TOGETHER_AI') {
      url = 'https://api.together.xyz/v1/chat/completions';
      headers['Authorization'] = `Bearer ${key}`;
      providerBody.model = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
    } else if (provider === 'OLLAMA') {
      url = `${apiVault.OLLAMA_URL || 'http://172.20.0.1:11434'}/v1/chat/completions`;
      providerBody.model = 'gemma3:4b';
    }

    try {
      console.log(`[UnifiedProxy] Trying ${provider} for LLM request...`);
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(providerBody),
        // Timeout dinámico ajustado a 25 segundos para fallar rápido a los siguientes
        signal: AbortSignal.timeout(25000) 
      });

      if (fetchRes.ok) {
        res.status(fetchRes.status);
        fetchRes.headers.forEach((val, k) => res.setHeader(k, val));
        
        if (fetchRes.body) {
          const { Readable } = require('stream');
          Readable.fromWeb(fetchRes.body).pipe(res);
        } else {
          res.send(await fetchRes.text());
        }
        return; // Success! Done.
      } else {
        const errorText = await fetchRes.text().catch(() => 'no body');
        console.warn(`[UnifiedProxy] ${provider} failed with HTTP ${fetchRes.status}: ${errorText.substring(0, 150)}`);
        if (fetchRes.status === 429 || fetchRes.status === 401 || fetchRes.status === 403 || fetchRes.status === 404 || fetchRes.status === 400 || fetchRes.status >= 500) {
          if (provider !== 'OLLAMA') rotateVaultKey(provider);
        }
        await delay(300); // 300ms sleep prevent IP burst blocks
      }
    } catch (e) {
      console.warn(`[UnifiedProxy] ${provider} network error: ${e.message}`);
      await delay(300);
    }
  }

  res.status(502).json({ error: 'All AI providers failed including local fallback.' });
};

// ── Universal AI Fallback (Audio TTS) ──
const unifiedAudioHandler = async (req, res) => {
  let body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Rotamos entre claves de OpenAI para TTS
  const maxRetries = 3; 
  for (let i = 0; i < maxRetries; i++) {
    let key = getVaultKey('OPENAI');
    if (!key) break;
    
    try {
      console.log(`[UnifiedAudio] Trying OPENAI TTS (Attempt ${i + 1})...`);
      const fetchRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000) 
      });

      if (fetchRes.ok) {
        res.status(fetchRes.status);
        fetchRes.headers.forEach((val, k) => res.setHeader(k, val));
        if (fetchRes.body) {
          const { Readable } = require('stream');
          Readable.fromWeb(fetchRes.body).pipe(res);
        } else {
          res.send(await fetchRes.buffer());
        }
        return;
      } else {
        const errorText = await fetchRes.text().catch(() => 'no body');
        console.warn(`[UnifiedAudio] OPENAI failed with HTTP ${fetchRes.status}: ${errorText.substring(0, 100)}`);
        if (fetchRes.status === 429 || fetchRes.status === 401 || fetchRes.status === 403 || fetchRes.status === 402) {
          rotateVaultKey('OPENAI');
        } else {
          // If it's a 400 bad request (e.g. text too long), abort early.
          return res.status(fetchRes.status).json({ error: 'OPENAI Audio API error', details: errorText });
        }
        await delay(500);
      }
    } catch (e) {
      console.warn(`[UnifiedAudio] OPENAI network error: ${e.message}`);
      await delay(500);
    }
  }
  res.status(502).json({ error: 'All Audio API keys failed.' });
};

// ── Universal AI Fallback (Images) ──
const unifiedImageHandler = async (req, res) => {
  let body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const fallbackChain = ['OPENAI', 'TOGETHER_AI'];
  
  for (const provider of fallbackChain) {
    let key = getVaultKey(provider);
    if (!key) continue;

    let url, headers = { 'Content-Type': 'application/json' };
    let providerBody = {};

    if (provider === 'OPENAI') {
      url = 'https://api.openai.com/v1/images/generations';
      headers['Authorization'] = `Bearer ${key}`;
      providerBody = { ...body }; // Standard OpenAI payload: {prompt, model, size}
    } else if (provider === 'TOGETHER_AI') {
      url = 'https://api.together.xyz/v1/images/generations';
      headers['Authorization'] = `Bearer ${key}`;
      // Adapt from OpenAI to TogetherAI Image Gen (e.g., Flux)
      providerBody = {
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        prompt: body.prompt || '',
        width: 1024,
        height: 1024,
        steps: 4,
        n: 1,
        response_format: body.response_format || 'b64_json'
      };
    }

    try {
      console.log(`[UnifiedImage] Trying ${provider} for Image request...`);
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(providerBody),
        signal: AbortSignal.timeout(45000) // Images take longer
      });

      if (fetchRes.ok) {
        const json = await fetchRes.json();
        // TogetherAI returns slightly different format in some models, but OpenAI-compatible endpoint usually normalizes it
        return res.json(json);
      } else {
        const errorText = await fetchRes.text().catch(() => 'no body');
        console.warn(`[UnifiedImage] ${provider} failed with HTTP ${fetchRes.status}: ${errorText.substring(0, 100)}`);
        if (fetchRes.status === 429 || fetchRes.status === 401 || fetchRes.status === 403 || fetchRes.status === 400 || fetchRes.status === 402) {
          rotateVaultKey(provider);
        }
        await delay(500);
      }
    } catch (e) {
      console.warn(`[UnifiedImage] ${provider} network error: ${e.message}`);
      await delay(500);
    }
  }

  res.status(502).json({ error: 'All Image generation providers failed.' });
};

// Montar handler (express.json limit 50mb para soportar imágenes en base64 si es necesario)
const jsonParser = express.json({ limit: '50mb' });
app.post('/_api/llm/chat/completions', jsonParser, unifiedLlmHandler);
app.post('/_api/gemini/v1beta/openai/chat/completions', jsonParser, unifiedLlmHandler);
app.post('/_api/audio/speech', jsonParser, unifiedAudioHandler);
app.post('/_api/images/generations', jsonParser, unifiedImageHandler);


createAIProxy('/_api/tavily', 'https://api.tavily.com', 'TAVILY');
createAIProxy('/_api/gemini', 'https://generativelanguage.googleapis.com', 'GOOGLE_GEMINI');
createAIProxy('/_api/openrouter', 'https://openrouter.ai/api', 'OPENROUTER');
createAIProxy('/_api/groq', 'https://api.groq.com', 'GROQ');
createAIProxy('/_api/anthropic', 'https://api.anthropic.com', 'ANTHROPIC');
createAIProxy('/_api/openai', 'https://api.openai.com', 'OPENAI');
createAIProxy('/_api/deepseek', 'https://api.deepseek.com', 'DEEPSEEK');
createAIProxy('/_api/nvidia', 'https://integrate.api.nvidia.com', 'NVIDIA');
createAIProxy('/_api/mistral', 'https://api.mistral.ai', 'MISTRAL');
createAIProxy('/_api/together', 'https://api.together.xyz', 'TOGETHER_AI');
createAIProxy('/_api/cerebras', 'https://api.cerebras.ai', 'CEREBRAS');
createAIProxy('/_api/siliconflow', 'https://api.siliconflow.cn', 'SILICONFLOW');
createAIProxy('/_api/deepinfra', 'https://api.deepinfra.com', 'DEEPINFRA');
createAIProxy('/_api/opencodezen', 'https://api.opencodezen.com', 'OPENCODE_ZEN');


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

app.get(['/apps', '/profile', '/architecture', '/contact', '/bots'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.sendFile(path.join(WWW, 'index.html'));
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
