// ニュースアカウント：ネタ集めと記事の読み取りの共通部品（collect.mjs・build.mjs が使う。Claude も Gemini も使わない）
import fs from 'node:fs';
export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const MAX_AGE_H = Number(process.env.NEWS_MAX_AGE_H || 96);
const log = (...a) => console.log(...a);

// ---------------- 取ってくる ----------------
export async function getText(url, ms = 20000) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return { text: await r.text(), url: r.url || url };
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export const decode = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e.toLowerCase()] ?? m));
export const strip = s => decode(String(s || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return m ? decode(m[1]).trim() : ''; };
export const normUrl = u => { try { const x = new URL(u); x.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ref'].forEach(k => x.searchParams.delete(k)); return (x.host.replace(/^www\./, '') + x.pathname.replace(/\/$/, '') + (x.search || '')).toLowerCase(); } catch { return String(u || '').toLowerCase(); } };

export function parseFeed(xml, feed) {
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

export async function collect(used) {
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

// ---------------- 記事を読む ----------------
export function article(html, pageUrl) {
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

export async function download(url, file) {
  const r = await fetch(url, { headers: { 'user-agent': UA, referer: new URL(url).origin + '/' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct = r.headers.get('content-type') || '';
  if (!/image\//.test(ct)) throw new Error(`not image ${ct}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 25000) throw new Error('小さすぎる');
  fs.writeFileSync(file, buf);
}

