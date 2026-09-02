const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const publicPort = Number(process.env.PUBLIC_PORT || 80);
const backendPort = Number(process.env.BACKEND_PORT || 3001);
const buildDirectory = path.join(__dirname, 'frontend', 'build');
const backendPrefixes = ['/api', '/uploads', '/images'];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const isBackendRequest = (pathname) =>
  backendPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const proxyToBackend = (request, response, requestUrl) => {
  const proxyRequest = http.request(
    {
      hostname: '127.0.0.1',
      port: backendPort,
      path: `${requestUrl.pathname}${requestUrl.search}`,
      method: request.method,
      headers: {
        ...request.headers,
        host: `127.0.0.1:${backendPort}`
      }
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on('error', () => {
    if (!response.headersSent) {
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    response.end(JSON.stringify({ success: false, message: 'Backend no disponible' }));
  });

  request.pipe(proxyRequest);
};

const serveFrontend = (request, response, requestUrl) => {
  const requestedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const candidate = path.resolve(buildDirectory, relativePath);
  const buildRoot = path.resolve(buildDirectory);
  const filePath = candidate.startsWith(`${buildRoot}${path.sep}`) ? candidate : path.join(buildRoot, 'index.html');

  fs.stat(filePath, (statError, fileStats) => {
    const fallback = path.join(buildRoot, 'index.html');
    const selectedPath = !statError && fileStats.isFile() ? filePath : fallback;

    fs.readFile(selectedPath, (readError, content) => {
      if (readError) {
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Frontend no compilado. Ejecute publish.ps1.');
        return;
      }

      response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(selectedPath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': selectedPath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      response.end(content);
    });
  });
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (isBackendRequest(requestUrl.pathname)) {
    proxyToBackend(request, response, requestUrl);
    return;
  }

  serveFrontend(request, response, requestUrl);
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`Gateway publico escuchando en http://0.0.0.0:${publicPort}`);
  console.log(`Backend interno: http://127.0.0.1:${backendPort}`);
});

server.on('error', (error) => {
  console.error(`No se pudo iniciar el gateway: ${error.message}`);
  process.exitCode = 1;
});