// Zero-dependency local preview. Run from anywhere: bun scripts/serve.js
const path = require('path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const server = Bun.serve({
  hostname: '127.0.0.1', port,
  async fetch(request) {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Bad request', { status: 400 }); }
    if (pathname === '/') pathname = '/index.html';
    const target = path.resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(target);
    if (!(await file.exists())) return new Response('Not found', { status: 404 });
    return new Response(file, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
});
console.log(`ALPHA ZONE local preview: http://127.0.0.1:${server.port}`);
