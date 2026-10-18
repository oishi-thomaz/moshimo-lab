// もしもラボ renderer: loads engine/index.html?v=<id> in headless Chromium and writes an mp4 (no audio).
//
//   node tools/render.mjs --video 0001 --out out/0001_video.mp4 [--fps 30] [--from 0 --to 65]
//   node tools/render.mjs --video 0001 --stills 1,8.6,40 --outdir out/stills
//   node tools/render.mjs --video 0001 --meta out/0001.json        (just dump the video's META)
//
// Chromium: uses $CHROME_PATH if set, otherwise Playwright's default install.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const video = String(args.video || '0001');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
let pageErrors = 0;
page.on('pageerror', e => { pageErrors++; console.error('PAGE EXC', e.message); });
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) console.error('PAGE ERR', m.text()); });
await page.goto(`http://127.0.0.1:${port}/engine/index.html?v=${video}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 180000 });
if (pageErrors) { console.error('page errors during load — aborting'); process.exit(2); }
const clip = { x: 0, y: 0, width: 1080, height: 1920 };
const meta = await page.evaluate(() => window.META || {});
const dur = await page.evaluate(() => window.DURATION);

if (args.meta) {
  fs.mkdirSync(path.dirname(args.meta), { recursive: true });
  fs.writeFileSync(args.meta, JSON.stringify({ ...meta, duration: dur }, null, 2));
  console.log('meta ->', args.meta);
} else if (args.stills) {
  const out = args.outdir || 'out/stills'; fs.mkdirSync(out, { recursive: true });
  for (const t of String(args.stills).split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: `${out}/${video}_t${t.toFixed(2).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 88, clip });
  }
  console.log('stills ->', out);
} else {
  const outFile = args.out || `out/${video}_video.mp4`;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const fps = Number(args.fps || 30);
  const f0 = Math.round(Number(args.from || 0) * fps);
  const f1 = Math.round(Number(args.to || dur) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const st = Date.now();
  for (let i = f0; i < f1; i++) {
    await page.evaluate(t => window.renderAt(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93, clip });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${f1} ${((Date.now() - st) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  if (pageErrors) { console.error('page errors during render'); process.exit(3); }
  console.log('video ->', outFile);
}
await browser.close();
server.close();
