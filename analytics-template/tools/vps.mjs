// VPS とのやりとり（GitHub Actions の中で動く）。使い方は .github/workflows/vps.yml を参照
import fs from 'node:fs';
import path from 'node:path';

const [action, file] = process.argv.slice(2);
const [BASE, KEY] = String(process.env.MOSHIMO_AN || '').trim().split(/\s+/);
if (!BASE || !KEY) { console.error('Secrets の MOSHIMO_AN が未設定（LINE で 解析設定 と送ると値が届く）'); process.exit(1); }
const H = { 'x-an-key': KEY, 'content-type': 'application/json' };
const call = async (method, p, body) => {
  const r = await fetch(`${BASE}${p}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
};
const readJsonl = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []);
const ym = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 7);

if (action === 'collect') {
  fs.mkdirSync('data/snaps', { recursive: true });
  // 最後に保存した時刻から今までの分を取る（取りこぼしがあっても45日分まで埋める）
  const months = fs.readdirSync('data/snaps').filter(f => f.endsWith('.jsonl')).sort();
  const lastT = months.length ? Math.max(0, ...readJsonl(path.join('data/snaps', months.at(-1))).map(s => s.t)) : 0;
  const hours = lastT ? Math.min(1080, Math.ceil((Date.now() - lastT) / 3600e3) + 2) : 1080;
  const ex = await call('GET', `/an/export?hours=${hours}`);
  const byMonth = {};
  for (const s of ex.snaps) (byMonth[ym(s.t)] = byMonth[ym(s.t)] || []).push(s);
  let added = 0;
  for (const [m, list] of Object.entries(byMonth)) {
    const f = `data/snaps/${m}.jsonl`;
    const have = new Set(readJsonl(f).map(s => s.t));
    const fresh = list.filter(s => !have.has(s.t)).sort((a, b) => a.t - b.t);
    if (fresh.length) fs.appendFileSync(f, fresh.map(s => JSON.stringify(s)).join('\n') + '\n');
    added += fresh.length;
  }
  delete ex.snaps;
  fs.writeFileSync('data/state.json', JSON.stringify(ex, null, 1));
  // インスタのアカウント全体の日別・YouTubeアナリティクスは日付ごとに上書きして貯める
  const merge = (f, obj) => { const cur = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; fs.writeFileSync(f, JSON.stringify({ ...cur, ...obj }, null, 1)); };
  merge('data/ig-days.json', Object.fromEntries(Object.entries(ex.igDays || {}).filter(([, v]) => !v.error)));
  if (ex.ytAnalytics) merge('data/yt-days.json', Object.fromEntries((ex.ytAnalytics.days || []).map(d => [d.day, d])));
  console.log(`snaps +${added}（${hours}時間分を確認）flags ${JSON.stringify(ex.flags)}`);
} else if (action === 'media') {
  console.log('media は次のステップで取る');
} else if (action === 'report' || action === 'control') {
  if (!file || !fs.existsSync(file)) throw new Error(`file がない：${file}`);
  const body = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(JSON.stringify(await call('POST', `/an/${action}`, body)));
} else {
  throw new Error(`action が不明：${action}`);
}
