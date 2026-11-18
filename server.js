import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const api = process.env.API_URL || 'http://localhost:3000';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
        const upstream = http.request(new URL(req.url.slice(4), api), {
            method: req.method,
            headers: { ...req.headers, host: new URL(api).host },
        }, response => {
            res.writeHead(response.statusCode, response.headers);
            response.pipe(res);
        });
        upstream.on('error', () => {
            if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Não foi possível conectar à API. Inicie o back-end na porta 3000.' }));
        });
        req.pipe(upstream);
        return;
    }
    try {
        const filename = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
        const relative = filename.replace(/^\/+/, '');
        const target = path.resolve(root, relative);
        const allowed = ['index.html', 'assets', 'components', 'css', 'js', 'pages'];
        if (!target.startsWith(root + path.sep) || !allowed.includes(relative.split('/')[0])) {
            res.writeHead(404).end();
            return;
        }
        const data = await readFile(target);
        res.writeHead(200, { 'Content-Type': `${types[path.extname(target)] || 'application/octet-stream'}${['.html', '.js', '.css'].includes(path.extname(target)) ? '; charset=utf-8' : ''}` });
        res.end(data);
    } catch {
        res.writeHead(404).end('Página não encontrada');
    }
}).listen(process.env.FRONTEND_PORT || 5500, () => console.log('SonoraWare: http://localhost:5500'));
