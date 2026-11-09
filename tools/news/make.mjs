// ニュースアカウント（インスタのみ・完全自動）：ネタを集めて、選んで、日本語の投稿を作る
//   node tools/news/make.mjs --count 3 --out out/news
//   env: GEMINI_API_KEY（必須）／NEWS_BASE_URL・NEWS_SECRET（投稿サーバー。使ったネタを聞いて重複を避ける）／NEWS_BRAND・NEWS_TAG
// できるもの：out/news/<id>/meta.json と元画像 src_1.jpg…（画像は tools/news/render.py が 1080x1350 の投稿画像にする）
// ルールは docs/NEWS.md。迷ったら出さない（safe:false は捨てる）
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? [...a, [x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : '1']] : a), []));
const COUNT = Math.max(0, Math.min(8, Number(args.count || 3)));
const OUT = args.out || 'out/news';
const KEY = process.env.GEMINI_API_KEY || '';
const BASE = (process.env.NEWS_BASE_URL || '').replace(/\/$/, '');
const SECRET = process.env.NEWS_SECRET || '';
const BRAND = process.env.NEWS_BRAND || 'なにこれ通信';
const TAG = (process.env.NEWS_TAG || BRAND).replace(/^#/, '');
const MAX_AGE_H = Number(process.env.NEWS_MAX_AGE_H || 96);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const IS_MAIN = import.meta.url === `file://${path.resolve(process.argv[1] || '')}`;
if (IS_MAIN && !COUNT) { log('count 0：作るものなし'); process.exit(0); }
if (IS_MAIN && !KEY) { console.error('GEMINI_API_KEY がない'); process.exit(2); }

// ---------------- 取ってくる ----------------
async function getText(url, ms = 20000) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return { text: await r.text(), url: r.url || url };
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decode = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e.toLowerCase()] ?? m));
const strip = s => decode(String(s || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return m ? decode(m[1]).trim() : ''; };
const normUrl = u => { try { const x = new URL(u); x.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ref'].forEach(k => x.searchParams.delete(k)); return (x.host.replace(/^www\./, '') + x.pathname.replace(/\/$/, '') + (x.search || '')).toLowerCase(); } catch { return String(u || '').toLowerCase(); } };

function parseFeed(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = strip(tag(b, 'title'));
    let link = strip(tag(b, 'link'));
    if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); link = m ? decode(m[1]) : ''; }
    const fb = tag(b, 'feedburner:origLink'); if (fb) link = strip(fb);
    const date = Date.parse(strip(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'))) || 0;
    const desc = strip(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded')).slice(0, 400);
    const imgs = [...b.matchAll(/<(?:media:content|media:thumbnail|enclosure)[^>]*url="([^"]+)"/gi)].map(m => decode(m[1]))
      .concat([...b.matchAll(/<img[^>]*src="([^"]+)"/gi)].map(m => decode(m[1])));
    if (title && /^https?:\/\//.test(link)) items.push({ title, link, date, desc, imgs, feed: feed.name, site: feed.site, weight: feed.weight || 1 });
  }
  return items;
}

async function collect(used) {
  const { feeds } = JSON.parse(fs.readFileSync('news/sources.json', 'utf8'));
  const all = [];
  await Promise.all(feeds.map(async f => {
    try { const { text } = await getText(f.url, 20000); const it = parseFeed(text, f); all.push(...it); log(`feed ${f.name}: ${it.length}`); }
    catch (e) { log(`feed ${f.name}: 取れない（${e.message}）→ 飛ばす`); }
  }));
  const now = Date.now();
  const seen = new Set();
  const usedUrls = new Set((used.urls || []).map(normUrl));
  const usedTitles = (used.titles || []).map(t => String(t).toLowerCase());
  const fresh = all.filter(x => {
    const k = normUrl(x.link);
    if (seen.has(k) || usedUrls.has(k)) return false; seen.add(k);
    if (x.date && now - x.date > MAX_AGE_H * 3600e3) return false;
    if (/^watch:|video:|podcast|quiz|horoscope|deal|coupon|% off|sale/i.test(x.title)) return false; // 動画だけの記事・宣伝は写真が取れない
    const t = x.title.toLowerCase();
    if (usedTitles.some(u => u && (u === t))) return false;
    return true;
  });
  // weight つきで混ぜる（同じフィードばかりにならないように）
  const scored = fresh.map(x => ({ x, s: Math.random() ** (1 / x.weight) })).sort((a, b) => b.s - a.s).map(o => o.x);
  log(`候補：全${all.length}件 → 新しくて未使用 ${fresh.length}件`);
  return scored.slice(0, 70);
}

// ---------------- Gemini ----------------
const GBASE = 'https://generativelanguage.googleapis.com/v1beta';
let MODELS = [];
async function pickModels() {
  if (process.env.NEWS_MODEL) return (MODELS = process.env.NEWS_MODEL.split(',').map(s => s.trim()));
  try {
    const r = await fetch(`${GBASE}/models?pageSize=200&key=${KEY}`, { signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    const names = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''))
      .filter(n => /^gemini-[\d.]+-(flash|pro)(-preview[-\d]*)?$/.test(n) || n === 'gemini-flash-latest' || n === 'gemini-pro-latest');
    const ver = n => { const m = n.match(/gemini-([\d.]+)/); return m ? parseFloat(m[1]) : 0; };
    // 文章の質を優先して pro → flash。preview より正式版
    const rank = n => ver(n) * 10 + (/pro/.test(n) ? 3 : 0) - (/preview/.test(n) ? 1 : 0) + (/latest/.test(n) ? 0.5 : 0);
    MODELS = [...new Set(names)].sort((a, b) => rank(b) - rank(a)).slice(0, 4);
  } catch (e) { log('モデル一覧が取れない', e.message); }
  if (!MODELS.length) MODELS = ['gemini-flash-latest', 'gemini-2.5-flash'];
  log('モデル', MODELS.join(' > '));
  return MODELS;
}
async function gemini(prompt, { temp = 0.7 } = {}) {
  let last;
  for (const model of MODELS) {
    for (let k = 0; k < 3; k++) {
      try {
        const r = await fetch(`${GBASE}/models/${model}:generateContent?key=${KEY}`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(120000),
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: temp, responseMimeType: 'application/json' } }),
        });
        const txt = await r.text();
        if (!r.ok) { last = new Error(`${model} HTTP ${r.status} ${txt.slice(0, 200)}`); if (r.status === 429 || r.status >= 500) { await sleep(8000 * (k + 1)); continue; } break; }
        const j = JSON.parse(txt);
        const out = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        return JSON.parse(out.replace(/^```json\s*|```\s*$/g, ''));
      } catch (e) { last = e; await sleep(3000); }
    }
  }
  throw last || new Error('gemini failed');
}

// ---------------- 記事を読む ----------------
function article(html, pageUrl) {
  const meta = p => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]*content=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${p}["']`, 'i')); return m ? decode(m[1]) : ''; };
  const abs = u => { try { return new URL(decode(u), pageUrl).href; } catch { return ''; } };
  const body = (html.match(/<article[\s\S]*?<\/article>/i) || [html])[0];
  const paras = [...body.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)].map(m => strip(m[0])).filter(p => p.length > 40 && !/cookie|subscribe|newsletter|sign up|advertis|all rights reserved|©/i.test(p));
  const text = paras.join('\n').slice(0, 7000);
  const og = meta('og:image') || meta('twitter:image');
  const bad = /logo|icon|avatar|sprite|placeholder|blank|pixel|badge|author|gravatar|emoji|(^|[\/_.-])ads?([\/_.-]|$)|banner|newsletter|\.svg|\.gif/i;
  const imgs = [];
  const add = u => { const a = abs(u); if (a && /^https?:/.test(a) && !bad.test(a) && !imgs.includes(a)) imgs.push(a); };
  if (og) add(og);
  for (const m of body.matchAll(/<img[^>]+>/gi)) {
    const t = m[0];
    const src = (t.match(/\b(?:data-src|data-lazy-src|data-original|src)=["']([^"']+)["']/i) || [])[1];
    const ss = (t.match(/\bsrcset=["']([^"']+)["']/i) || [])[1];
    let best = src;
    if (ss) { const c = ss.split(',').map(s => s.trim().split(/\s+/)).map(([u, w]) => [u, parseInt(w) || 0]).sort((a, b) => b[1] - a[1]); if (c[0]) best = c[0][0]; }
    if (best) add(best);
    if (imgs.length >= 10) break;
  }
  return { text, imgs, ogTitle: meta('og:title'), siteName: meta('og:site_name') };
}

async function download(url, file) {
  const r = await fetch(url, { headers: { 'user-agent': UA, referer: new URL(url).origin + '/' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct = r.headers.get('content-type') || '';
  if (!/image\//.test(ct)) throw new Error(`not image ${ct}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 25000) throw new Error('小さすぎる');
  fs.writeFileSync(file, buf);
}

// ---------------- プロンプト ----------------
const SELECT = (cands, n) => `あなたは日本のインスタグラムで、海外のちょっと変わった話・へぇと言いたくなる話・ほっこりする実話を毎日紹介しているニュースアカウントの編集長です。
下の海外記事の候補から、日本の20〜40代が思わず友だちに送りたくなる（シェアしたくなる）ものを最大${n}本選んでください。

よく伸びる型（実績のある型）
- 身近な物の知らなかった秘密（例：ゲーム機のコントローラーの表面に小さな記号が4万個並んでいる）
- 動物・自然の珍しい光景（白いシャチ、変わった模様の動物、動物の意外な行動）
- 人のやさしさ・恩返しの実話（タクシーやバスの運転手、配達員、店員との心温まる話）
- 一般人のありえない行動やうっかり（ハチの出した液体をハチミツだと思ってなめた、など笑える話）
- ギネス記録・世界に1つだけの物・とんでもない発明や作品
- 科学の意外な事実（写真1枚で伝わるもの）

選ばないもの（必ず外す）
- 人が亡くなる・大けが・残酷な事件、性犯罪、子どもや動物への虐待、自殺、災害の被害
- 政治・選挙・宗教・戦争・民族の対立、特定の国や人種を笑いものにする話
- 一般人を犯罪者扱いする話、芸能人のゴシップ・炎上、誹謗中傷になりうる話
- 医療・健康・お金の話で、真に受けると害が出るもの
- 写真がないと伝わらない話・動画でしか伝わらない話
- 日本のニュース（日本人はもう知っている）

候補（番号｜タイトル｜出どころ｜説明）
${cands.map((c, i) => `${i}｜${c.title}｜${c.site}｜${c.desc.slice(0, 220)}`).join('\n')}

次の JSON だけを返してください：
{"picks":[{"i":番号,"score":1〜10（シェアされそう度）,"type":"上の型のどれか","why":"選んだ理由を20字以内"}]}
score の高い順に並べて、7未満は入れないでください。`;

const WRITE = (c, a) => `あなたは日本のインスタグラムの人気ニュースアカウント「${BRAND}」の書き手です。下の海外記事をもとに、写真付きの投稿を1本作ってください。

記事のタイトル：${c.title}
出どころ：${c.site}
記事の本文（英語のことが多い）：
"""
${a.text}
"""

ルール
- 記事に書いてある事実だけを使う。数字・地名・年・人数は記事どおり。記事にないことを足さない・盛らない。記事の中で不確かなことは「〜とされています」「〜と伝えられています」と書く
- 一般人の名前は出さない（その人、男性、女性、20代の女性 などと書く）。有名人・企業・団体の名前は記事どおりでよい
- 人を馬鹿にしない。笑える話でも本人を見下す書き方はしない
- 下の「出さない話」に当たるときは safe を false にして理由を書く：人が亡くなる・大けが・残酷な事件、性犯罪、子どもや動物への虐待、自殺、災害の被害、政治・選挙・宗教・戦争・民族の対立、一般人を犯罪者扱いする話、医療・健康・お金で真に受けると害が出る話、記事の本文が短すぎて事実が確かめられない話

作るもの
1. title：投稿画像に大きく載せる見出し。2〜3行の配列。1行は14文字以内（記号も1文字）。1行目で状況、最後の行でオチや驚きを言い切る。「」は使ってよい。絵文字・ハッシュタグは入れない。煽りすぎない（嘘や誇張は禁止）
2. body：キャプション本文。です・ます調。280〜450文字。4〜6段落で、段落の間は空行。1段落目の1文目で何が起きたかを言い切る（前置きなし）。2〜4段落目で詳しい事実と、日本人に伝わる補足（例：○○は日本でいう△△）。最後の段落は、軽いひとことで締めて絵文字を1つだけ。ハッシュタグは入れない
3. ask：コメントしたくなる問いかけを1行（例：あなたなら同じことできますか？）。25文字以内
4. hashtags：日本語のハッシュタグを3〜5個（# なし）。1つ目は ${TAG}。2つ目以降は内容に合う、日本で実際に使われている言葉（例：海外ニュース、動物好きな人と繋がりたい、雑学）
5. category：動物・自然／身近な物の秘密／人のやさしさ／うっかり・珍事件／記録・発明／科学 のどれか

次の JSON だけを返してください：
{"safe":true,"skip_reason":"","title":["",""],"body":"","ask":"","hashtags":[""],"category":""}`;

// ---------------- 本体 ----------------
async function main() {
  let used = { urls: [], titles: [] };
  if (BASE && SECRET) {
    try { const r = await fetch(`${BASE}/an/used`, { headers: { 'x-secret': SECRET }, signal: AbortSignal.timeout(20000) }); if (r.ok) used = await r.json(); log(`使ったネタ ${used.urls?.length || 0}件`); }
    catch (e) { log('投稿サーバーに聞けない（重複チェックなしで続ける）', e.message); }
  }
  // 同じ実行の中でも重複させない（ローカルの記録も足す）
  const localUsed = 'state/news-used.txt';
  if (fs.existsSync(localUsed)) used.urls = (used.urls || []).concat(fs.readFileSync(localUsed, 'utf8').split('\n').filter(Boolean));

  const cands = await collect(used);
  if (!cands.length) { log('新しい候補がない'); return; }
  await pickModels();
  const sel = await gemini(SELECT(cands, COUNT * 3), { temp: 0.4 });
  const picks = (sel.picks || []).filter(p => Number.isInteger(p.i) && cands[p.i] && p.score >= 7).sort((a, b) => b.score - a.score);
  log(`選ばれた候補 ${picks.length}件`);
  fs.mkdirSync(OUT, { recursive: true });
  let made = 0;
  const stamp = new Date(Date.now() + 9 * 3600e3).toISOString().replace(/\D/g, '').slice(2, 12);
  for (const p of picks) {
    if (made >= COUNT) break;
    const c = cands[p.i];
    try {
      const { text: html, url: finalUrl } = await getText(c.link, 25000);
      const a = article(html, finalUrl);
      if (a.text.length < 350) { log(`× 本文が短い：${c.title}`); continue; }
      const imgUrls = [...new Set([...a.imgs, ...c.imgs])];
      if (!imgUrls.length) { log(`× 画像なし：${c.title}`); continue; }
      const w = await gemini(WRITE(c, a), { temp: 0.7 });
      if (!w.safe) { log(`× 出さない：${c.title}（${w.skip_reason}）`); continue; }
      const title = (w.title || []).map(s => String(s).trim()).filter(Boolean).slice(0, 3);
      if (title.length < 2 || title.some(s => [...s].length > 16) || !w.body || [...w.body].length < 200) { log(`× 文章の形が違う：${c.title}`, JSON.stringify(title)); continue; }
      const id = `n${stamp}${made + 1}`;
      const dir = path.join(OUT, id); fs.mkdirSync(dir, { recursive: true });
      const files = [];
      for (const u of imgUrls) {
        if (files.length >= 5) break;
        const f = path.join(dir, `src_${files.length + 1}`);
        try { await download(u, f); files.push(path.basename(f)); } catch (e) { log(`  画像 NG ${u.slice(0, 90)}（${e.message}）`); }
      }
      if (!files.length) { log(`× 画像が落とせない：${c.title}`); fs.rmSync(dir, { recursive: true, force: true }); continue; }
      const hashtags = [...new Set([TAG, ...(w.hashtags || []).map(h => String(h).replace(/^#/, '').replace(/\s+/g, ''))])].filter(Boolean).slice(0, 5);
      const site = a.siteName && a.siteName.length < 30 ? a.siteName : c.site;
      const caption = `${w.body.trim()}\n\n${w.ask ? w.ask.trim() + '\n\n' : ''}📸 ${site}\n\n${hashtags.map(h => '#' + h).join(' ')}`;
      const meta = { id, title, caption, body: w.body, ask: w.ask, hashtags, category: w.category, type: p.type, score: p.score, why: p.why, source: { url: finalUrl, link: c.link, title: c.title, site, feed: c.feed, date: c.date }, srcFiles: files, brand: BRAND, madeAt: Date.now() };
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
      fs.mkdirSync('state', { recursive: true }); fs.appendFileSync(localUsed, c.link + '\n');
      made++;
      log(`○ ${id}｜${title.join(' / ')}｜${site}｜score ${p.score}`);
    } catch (e) { log(`× 失敗：${c.title}（${e.message}）`); }
  }
  log(`できた ${made}本`);
}
export { parseFeed, article, normUrl, SELECT, WRITE };
if (IS_MAIN) main().catch(e => { console.error(e); process.exit(1); });
