// ニュースアカウント：ネタの候補を集めて candidates.json に書く（GitHub Actions の news-collect.yml。Claude も Gemini も使わない）
//   NEWS_BASE_URL=... NEWS_SECRET=... node tools/news/collect.mjs <出力ファイル>
// 候補ごとに元記事を開いて、本文（2,500字まで）と写真の候補URLを取っておく。写真が1枚も取れない記事・本文が短い記事は入れない
// need：次の朝の運用（9:23）の後、さらに26時間分の投稿枠を埋めるのに足りない本数（在庫を引いて＋予備2本、最大10本）
import fs from 'node:fs';
import { collect, getText, article } from './lib.mjs';

const OUT = process.argv[2] || 'candidates.json';
const BASE = (process.env.NEWS_BASE_URL || '').replace(/\/$/, '');
const SECRET = process.env.NEWS_SECRET || '';
const H = { 'x-secret': SECRET };

async function getJson(p) {
  const r = await fetch(`${BASE}${p}`, { headers: H, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${p} HTTP ${r.status}`);
  return r.json();
}

let used = { urls: [], titles: [] }, queue = { queued: 0, slotsAhead: 0, times: [] };
try { used = await getJson('/an/used'); } catch (e) { console.log('使ったネタが聞けない', e.message); }
try { queue = await getJson('/an/queue?hours=26'); } catch (e) { console.log('在庫が聞けない', e.message); }
const need = Math.max(0, Math.min(10, (queue.slotsAhead || 0) - (queue.queued || 0) + 2));

const cands = await collect(used);
const items = [];
let i = 0;
async function worker() {
  while (i < cands.length && items.length < 40) {
    const c = cands[i++];
    try {
      const { text: html, url } = await getText(c.link, 25000);
      const a = article(html, url);
      const imgs = [...new Set([...a.imgs, ...c.imgs])].slice(0, 8);
      if (a.text.length < 350 || !imgs.length) continue;
      items.push({ key: `c${items.length + 1}`, title: c.title, site: a.siteName && a.siteName.length < 30 ? a.siteName : c.site, feed: c.feed, url, link: c.link, date: c.date ? new Date(c.date).toISOString() : '', desc: c.desc, text: a.text.slice(0, 2500), imgs });
    } catch (e) { console.log(`× ${c.title.slice(0, 60)}（${e.message}）`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
items.forEach((x, k) => { x.key = `c${k + 1}`; });
const out = { at: new Date().toISOString(), need, queued: queue.queued || 0, slotsAhead: queue.slotsAhead || 0, times: queue.times || [], items };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`候補 ${items.length}本・書く本数 ${need}（在庫 ${out.queued}・26時間の枠 ${out.slotsAhead}）`);
