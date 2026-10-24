// いつわ劇場 renderer: drama/index.html を headless Chromium で開き、静止画 / 無音のmp4 / META を書き出す
//   node drama/tools/render.mjs --ep tower/ep01 --tts tts/tower_ep01/index.json --meta out/drama/ep01.json
//   node drama/tools/render.mjs --ep tower/ep01 --stills 1,5,10 --outdir out/drama/stills
//   node drama/tools/render.mjs --ep tower/ep01 --out out/drama/ep01_video.mp4
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const launch = { args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] };
const guess = ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/usr/bin/google-chrome'];
launch.executablePath = process.env.CHROME_PATH || guess.find(p => fs.existsSync(p));
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
let errs = 0;
page.on('pageerror', e => { errs++; console.error('PAGE EXC', e.message); });
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) console.error('PAGE ERR', m.text()); });
const q = new URLSearchParams({ ep: args.ep || 'tower/ep01' }); if (args.tts) q.set('tts', '/' + args.tts);
await page.goto(`http://127.0.0.1:${port}/drama/index.html?${q}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
if (errs) { console.error('page errors during load'); process.exit(2); }
const meta = await page.evaluate(() => window.META);
const dur = meta.duration;
const grab = async () => Buffer.from((await page.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.93))).split(',')[1], 'base64');
if (args.meta) {
  fs.mkdirSync(path.dirname(args.meta), { recursive: true });
  fs.writeFileSync(args.meta, JSON.stringify({ ...meta, shots: await page.evaluate(() => window.SHOTS_T) }, null, 1));
  console.log('meta ->', args.meta, 'duration', dur.toFixed(2), 'tempo', meta.tempo.toFixed(3));
}
if (args.stills) {
  const out = args.outdir || 'out/drama/stills'; fs.mkdirSync(out, { recursive: true });
  let list = String(args.stills);
  if (list === 'shots') list = (await page.evaluate(() => window.SHOTS_T)).map(([, a, b]) => ((a + b) / 2).toFixed(2)).join(',');
  for (const t of list.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    fs.writeFileSync(`${out}/t${t.toFixed(2).padStart(7, '0')}.jpg`, await grab());
  }
  console.log('stills ->', out);
}
if (args.out) {
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  const fps = Number(args.fps || 30);
  const f0 = Math.round(Number(args.from || 0) * fps), f1 = Math.round(Number(args.to || dur) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '19', '-movflags', '+faststart', args.out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const st = Date.now();
  for (let i = f0; i < f1; i++) {
    await page.evaluate(t => window.renderAt(t), i / fps);
    const buf = await grab();
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${f1} ${((Date.now() - st) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  if (errs) { console.error('page errors during render'); process.exit(3); }
  console.log('video ->', args.out);
}
await browser.close(); server.close();
