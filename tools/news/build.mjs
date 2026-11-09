// ニュースアカウント：Claude が書いた投稿（news-data ブランチの queue/*.json）から、元記事の写真を取ってきて投稿の材料を作る
//   node tools/news/build.mjs <news-data のフォルダ> out/news
// できるもの：out/news/<id>/meta.json と src_1…（このあと render.py → send.mjs）。写真が1枚も取れなかった回は failed に書く
// queue/*.json の形は ops/make-news.md
import fs from 'node:fs';
import path from 'node:path';
import { getText, article, download } from './lib.mjs';

const DATA = process.argv[2] || 'news-data';
const OUT = process.argv[3] || 'out/news';
const BRAND = process.env.NEWS_BRAND || 'なにこれ通信';
const TAG = (process.env.NEWS_TAG || BRAND).replace(/^#/, '');
const qdir = path.join(DATA, 'queue');
const cands = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'candidates.json'), 'utf8')).items || []; } catch { return []; } })();
const len = s => [...String(s || '')].length;
const result = { ok: [], ng: [] };
fs.mkdirSync(OUT, { recursive: true });

for (const f of fs.existsSync(qdir) ? fs.readdirSync(qdir).filter(x => x.endsWith('.json')).sort() : []) {
  let p;
  try { p = JSON.parse(fs.readFileSync(path.join(qdir, f), 'utf8')); } catch (e) { result.ng.push([f, `JSON が読めない：${e.message}`]); continue; }
  const id = /^n\d{10,12}\d{1,2}$/.test(p.id || '') ? p.id : f.replace(/\.json$/, '');
  try {
    if (!/^n\d{10,12}\d{1,2}$/.test(id)) throw new Error('番号の形が違う（n＋年月日時分10桁＋連番）');
    const title = (p.title || []).map(s => String(s).trim()).filter(Boolean);
    if (title.length < 2 || title.length > 3 || title.some(s => len(s) > 16)) throw new Error(`見出しの形が違う：${JSON.stringify(title)}`);
    if (len(p.body) < 200 || len(p.body) > 700) throw new Error(`本文の長さ ${len(p.body)}字`);
    const pages = (p.pages || []).map(s => String(s).trim()).filter(Boolean);
    if (pages.length < 2 || pages.length > 5 || pages.some(s => len(s) > 110)) throw new Error(`スライドの文の形が違う（2〜5枚・1枚110字まで）：${pages.map(len).join(',')}`);
    const c = cands.find(x => x.key === p.key && (!p.source?.url || x.url === p.source.url || x.link === p.source.url)) || cands.find(x => p.source?.url && (x.url === p.source.url || x.link === p.source.url));
    const src = { url: p.source?.url || c?.url, link: c?.link || p.source?.url, title: c?.title || p.source?.title || '', site: p.source?.site || c?.site || '' };
    if (!src.url) throw new Error('元記事のURLがない');
    let imgs = (Array.isArray(p.imgs) && p.imgs.length ? p.imgs : null) || c?.imgs || [];
    if (!imgs.length) { const { text, url } = await getText(src.url, 25000); imgs = article(text, url).imgs; }
    const dir = path.join(OUT, id); fs.mkdirSync(dir, { recursive: true });
    const files = [], srcOrder = [];
    for (const [k, u] of imgs.entries()) {
      if (files.length >= 5) break;
      const fp = path.join(dir, `src_${files.length + 1}`);
      try { await download(u, fp); files.push(path.basename(fp)); srcOrder.push(k + 1); } catch (e) { console.log(`  ${id} 写真 NG ${u.slice(0, 90)}（${e.message}）`); }
    }
    if (!files.length) { fs.rmSync(dir, { recursive: true, force: true }); throw new Error('写真が1枚も取れない'); }
    const hashtags = [...new Set([TAG, ...(p.hashtags || []).map(h => String(h).replace(/^#/, '').replace(/\s+/g, ''))])].filter(Boolean).slice(0, 5);
    const caption = `${String(p.body).trim()}\n\n${p.ask ? String(p.ask).trim() + '\n\n' : ''}📸 ${src.site}\n\n${hashtags.map(h => '#' + h).join(' ')}`;
    const meta = { id, title, pages, punch: String(p.punch || '').trim(), caption, body: p.body, ask: p.ask, hashtags, category: p.category || '', type: p.type || '', score: Number(p.score) || 0, source: src, srcFiles: files, srcOrder, coverImg: Number(p.coverImg) || null, pageImg: Array.isArray(p.pageImg) ? p.pageImg.map(x => (x ? Number(x) : 0)) : null, brand: BRAND, madeAt: Date.now(), queueFile: f };
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
    result.ok.push([f, id]);
    console.log(`○ ${id}｜${title.join(' / ')}｜${src.site}｜写真 ${files.length}枚`);
  } catch (e) { result.ng.push([f, e.message]); console.log(`× ${f}：${e.message}`); }
}
fs.writeFileSync(path.join(OUT, '.build.json'), JSON.stringify(result));
console.log(`材料 ${result.ok.length}本・だめ ${result.ng.length}本`);
