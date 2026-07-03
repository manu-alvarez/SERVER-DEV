#!/usr/bin/env node
/*
 * IT English Coach — optional static server + AI proxy (zero dependencies).
 *
 * Why: some AI providers block direct browser (CORS) calls. If you set a
 * "Proxy URL" in the app's Ajustes, requests are sent to /proxy on THIS server,
 * which forwards them to the real provider and adds permissive CORS headers.
 * Your API keys still come from the app (sent per request); this server only
 * forwards them — it does not store them.
 *
 * Run:   PORT=8787 node server.js
 * PM2:   pm2 start server.js --name it-english
 * Then set the Proxy URL in the app to e.g. https://msbross.me/english
 * (whatever public URL maps to this server). Leave it empty to call providers
 * directly from the browser.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// Only these hosts may be proxied (safety allow-list).
const ALLOW = [
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
  "openrouter.ai",
  "api.mistral.ai",
  "api.perplexity.ai",
  "opencode.ai",
];

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access, x-title, http-referer"
  );
}

async function handleProxy(req, res, target) {
  let host;
  try { host = new URL(target).host; } catch { res.writeHead(400); return res.end("bad url"); }
  if (!ALLOW.some((h) => host === h || host.endsWith("." + h))) {
    res.writeHead(403); return res.end("host not allowed");
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks);
    const fwd = {};
    for (const h of ["content-type", "authorization", "x-api-key", "anthropic-version",
      "anthropic-dangerous-direct-browser-access", "x-title", "http-referer"]) {
      if (req.headers[h]) fwd[h] = req.headers[h];
    }
    try {
      const r = await fetch(target, {
        method: req.method,
        headers: fwd,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });
      const buf = Buffer.from(await r.arrayBuffer());
      cors(res);
      res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
      res.writeHead(r.status);
      res.end(buf);
    } catch (e) {
      cors(res);
      res.writeHead(502);
      res.end(JSON.stringify({ error: "proxy_failed", detail: String(e) }));
    }
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname.replace(/^\/+/, ""));
  if (rel === "" ) rel = "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA-ish fallback to index.html for unknown non-file paths
      if (!path.extname(rel)) {
        return fs.readFile(path.join(ROOT, "index.html"), (e2, d2) => {
          if (e2) { res.writeHead(404); return res.end("not found"); }
          res.setHeader("Content-Type", MIME[".html"]);
          res.writeHead(200); res.end(d2);
        });
      }
      res.writeHead(404); return res.end("not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.writeHead(200); res.end(data);
  });
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/proxy") {
    if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
    const target = u.searchParams.get("url");
    if (!target) { res.writeHead(400); return res.end("missing url"); }
    return handleProxy(req, res, target);
  }
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end("method not allowed"); }
  serveStatic(req, res, u.pathname);
}).listen(PORT, () => console.log(`IT English Coach on http://localhost:${PORT}`));
