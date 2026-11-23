// Minimal static server with SPA fallback for the ALMA Tattoo Academy preview.
// Run: node server.js   (then open http://localhost:4173)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const PORT = process.env.PORT || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch (e) {
    res.writeHead(400); return res.end('Bad request');
  }
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  const send = (f) => fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(500); return res.end('Server error'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });

  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return send(file);
    if (path.extname(p)) { res.writeHead(404); return res.end('Not found'); }
    send(path.join(ROOT, 'index.html')); // client-side routes such as /course and /learn/...
  });
}).listen(PORT, () => console.log(`ALMA Tattoo Academy preview: http://localhost:${PORT}`));
