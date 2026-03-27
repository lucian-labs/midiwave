const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const LOG_FILE = path.join(__dirname, 'midiwave.log');
const PROFILES_FILE = path.join(__dirname, 'data', 'profiles.json');

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Clear log on startup
fs.writeFileSync(LOG_FILE, `[midiwave] Server started ${new Date().toISOString()}\n`);

function fileLog(line) {
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const server = http.createServer((req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ─── POST /log ───
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const entries = parsed.batch || [parsed];
        for (const { level, args } of entries) {
          const tag = { log: ' LOG', warn: 'WARN', error: ' ERR', info: 'INFO' }[level] || ' LOG';
          const colorTag = { log: '\x1b[36m LOG\x1b[0m', warn: '\x1b[33mWARN\x1b[0m', error: '\x1b[31m ERR\x1b[0m', info: '\x1b[34mINFO\x1b[0m' }[level] || ' LOG';
          const ts = new Date().toTimeString().slice(0, 8);
          const msg = args.join(' ');
          console.log(`${ts} ${colorTag}  ${msg}`);
          fileLog(`${ts} ${tag}  ${msg}`);
        }
      } catch {}
      res.writeHead(200);
      res.end();
    });
    return;
  }

  // ─── GET /profiles ───
  if (req.method === 'GET' && req.url === '/profiles') {
    try {
      if (fs.existsSync(PROFILES_FILE)) {
        const data = fs.readFileSync(PROFILES_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      }
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ─── POST /profiles ───
  if (req.method === 'POST' && req.url === '/profiles') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
        const count = data.profiles ? Object.keys(data.profiles).length : 0;
        fileLog(`[midiwave] Saved ${count} profiles to ${PROFILES_FILE}`);
        res.writeHead(200);
        res.end('ok');
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ─── Serve index.html (re-read on each request for live editing) ───
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
});

server.listen(PORT, () => {
  console.log(`\x1b[36m[midiwave]\x1b[0m http://localhost:${PORT}`);
  console.log(`\x1b[36m[midiwave]\x1b[0m Profiles → ${PROFILES_FILE}`);
  console.log(`\x1b[36m[midiwave]\x1b[0m Logs → ${LOG_FILE}\n`);
  fileLog(`[midiwave] Listening on http://localhost:${PORT}`);
});
