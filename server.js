/**
 * America250 Pro — Servidor Local
 * Resolve o problema de CORS fazendo as chamadas RPC no servidor (Node.js)
 * em vez do browser.
 *
 * Como usar:
 *   node server.js
 *   Acesse: http://localhost:3000
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT       = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ── Solana RPC endpoints (tentados em ordem) ──────────────────────────────
const SOLANA_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
  'https://mainnet.helius-rpc.com/?api-key=',
];

// ── MIME types ────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// ── Helper: fetch via Node https ──────────────────────────────────────────
function nodePost(targetUrl, body) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(targetUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Accept':         'application/json',
        'User-Agent':     'America250Pro/1.0',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Proxy: /api/whales?token=xxx ─────────────────────────────────────────
async function handleWhalesProxy(token, res) {
  if (!token || token.length < 20) {
    res.writeHead(400, corsHeaders('application/json'));
    res.end(JSON.stringify({ error: 'token inválido' }));
    return;
  }

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 'w1',
    method: 'getTokenLargestAccounts',
    params: [token, { commitment: 'confirmed' }],
  });

  let lastError = '';
  for (const rpc of SOLANA_RPCS) {
    try {
      console.log(`[Whales] Tentando ${rpc.slice(0, 40)}…`);
      const data = await nodePost(rpc, body);
      if (data.error) { lastError = data.error.message; continue; }
      const accounts = data?.result?.value;
      if (!accounts || !accounts.length) { lastError = 'sem dados'; continue; }

      console.log(`[Whales] ✅ ${accounts.length} holders via ${rpc.slice(8, 35)}`);
      res.writeHead(200, corsHeaders('application/json'));
      res.end(JSON.stringify({ ok: true, source: rpc, accounts }));
      return;
    } catch(e) {
      lastError = e.message;
      console.warn(`[Whales] ❌ ${rpc.slice(8,35)}: ${e.message}`);
    }
  }

  res.writeHead(502, corsHeaders('application/json'));
  res.end(JSON.stringify({ ok: false, error: 'Todos os RPCs falharam: ' + lastError }));
}

// ── Proxy: /api/price?token=xxx ──────────────────────────────────────────
async function handlePriceProxy(token, res) {
  try {
    const data = await new Promise((resolve, reject) => {
      const u = new url.URL('https://api.dexscreener.com/token-pairs/v1/solana/' + token);
      https.get({ hostname: u.hostname, path: u.pathname + u.search,
        headers: { 'Accept': 'application/json', 'User-Agent': 'America250Pro/1.0' }
      }, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      }).on('error', reject);
    });

    res.writeHead(200, corsHeaders('application/json'));
    res.end(JSON.stringify(data));
  } catch(e) {
    res.writeHead(502, corsHeaders('application/json'));
    res.end(JSON.stringify({ error: e.message }));
  }
}

// ── CORS headers ──────────────────────────────────────────────────────────
function corsHeaders(contentType) {
  return {
    'Content-Type': contentType || 'application/json',
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── Serve static files ────────────────────────────────────────────────────
function serveStatic(filePath, res) {
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Arquivo não encontrado: ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── HTTP Server ───────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed  = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  console.log(`[${req.method}] ${pathname}`);

  // API Routes
  if (pathname === '/api/whales') {
    await handleWhalesProxy(parsed.query.token, res);
    return;
  }
  if (pathname === '/api/price') {
    await handlePriceProxy(parsed.query.token, res);
    return;
  }
  if (pathname === '/api/health') {
    res.writeHead(200, corsHeaders('application/json'));
    res.end(JSON.stringify({ ok: true, version: '1.0', time: new Date().toISOString() }));
    return;
  }

  // Static files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  filePath = path.normalize(filePath); // prevent path traversal

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Proibido');
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      America250 Pro — Servidor Local   ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  URL: http://localhost:${PORT}             ║`);
  console.log('║  Dados de baleias: via Solana RPC real ║');
  console.log('║  Pressione Ctrl+C para parar           ║');
  console.log('╚════════════════════════════════════════╝\n');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ Porta ${PORT} já em uso. Tente: node server.js --port 3001`);
  } else {
    console.error('Erro:', e.message);
  }
});
