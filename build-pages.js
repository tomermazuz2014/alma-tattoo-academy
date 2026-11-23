// Builds the GitHub Pages copy of the site into docs/.
// Pages serves this repo under /alma-tattoo-academy/, so root-absolute URLs get that prefix.
// 404.html is a copy of index.html: GitHub serves it for deep links such as /course, and the
// client-side router reads location.pathname, so direct links work after a refresh.
// Run: node build-pages.js
const fs = require('fs');
const path = require('path');

const BASE = '/alma-tattoo-academy';
const SRC = path.join(__dirname, 'site');
const OUT = path.join(__dirname, 'docs');

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });

const appPath = path.join(OUT, 'app.js');
const app = fs.readFileSync(appPath, 'utf8');
if (!app.includes("var BASE = '';")) throw new Error('BASE placeholder not found in app.js');
fs.writeFileSync(appPath, app.replace("var BASE = '';", `var BASE = '${BASE}';`));

const indexPath = path.join(OUT, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8').replace(/(href|src)="\//g, `$1="${BASE}/`);
fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(OUT, '404.html'), html);

console.log(`Built ${OUT} with BASE=${BASE}`);
