#!/usr/bin/env node
/**
 * serve-dashboard.mjs — 情报大屏静态服务器（纯 node 零依赖）
 * 用法：node serve-dashboard.mjs [port]   默认 8737，根目录 ../memory/intel/dashboard
 * 用途：供 portal 代理；路径穿越防护；仅 GET/HEAD。
 */
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2]) || 8737
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../memory/intel/dashboard')
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`index.html 不存在：${ROOT}（先运行 gen-intel-dashboard.mjs）`)
  process.exit(1)
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath))
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return } // 防穿越
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 not found'); return }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  if (req.method === 'HEAD') { res.end(); return }
  fs.createReadStream(file).pipe(res)
}).listen(PORT, '127.0.0.1', () => console.log(`intel dashboard serving ${ROOT} at http://127.0.0.1:${PORT} (loopback only)`))
