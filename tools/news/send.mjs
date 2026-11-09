// できた投稿（out/news/<id>/）をニュースの投稿サーバーに送る。サーバーが投稿枠の時間にインスタへ出す
//   NEWS_BASE_URL=https://ドメイン/news NEWS_SECRET=... node tools/news/send.mjs out/news
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.NEWS_BASE_URL || '').replace(/\/$/, '');
const SECRET = process.env.NEWS_SECRET || '';
const dir = process.argv[2] || 'out/news';
if (!BASE || !SECRET) { console.error('NEWS_BASE_URL / NEWS_SECRET が未設定'); process.exit(2); }

async function put(file) {
  const buf = fs.readFileSync(file);
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(`${BASE}/upload/${path.basename(file)}`, { method: 'PUT', headers: { 'x-secret': SECRET, 'content-type': 'image/jpeg' }, body: buf, signal: AbortSignal.timeout(60000) });
      if (r.ok) return; throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
    } catch (e) { if (k === 2) throw e; await new Promise(r => setTimeout(r, 4000)); }
  }
}
let ok = 0, ng = 0;
const sent = [], bad = [];
for (const d of fs.readdirSync(dir)) {
  const mp = path.join(dir, d, 'meta.json');
  if (!fs.existsSync(mp)) continue;
  const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
  if (m.invalid || !m.slides?.length) { console.log(`× ${m.id} 送らない（${m.invalid || '画像なし'}）`); bad.push([m.queueFile || m.id, m.invalid || '画像なし']); continue; }
  try {
    for (const s of m.slides) await put(path.join(dir, d, s));
    const body = { id: m.id, slides: m.slides, caption: m.caption, title: m.title, category: m.category, type: m.type, score: m.score, source: m.source };
    const r = await fetch(`${BASE}/hook/new`, { method: 'POST', headers: { 'x-secret': SECRET, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`HTTP ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
    console.log(`○ ${m.id} 送った（${m.slides.length}枚・次の枠 ${j.slot || '?'}）`); ok++; sent.push([m.queueFile || m.id, m.id, m.source?.url || '']);
  } catch (e) { console.log(`× ${m.id} 送れない：${e.message}`); ng++; }
}
fs.writeFileSync(path.join(dir, '.sent.json'), JSON.stringify({ sent, bad }));
console.log(`送った ${ok}本・失敗 ${ng}本`);
if (ng && !ok) process.exit(1);
