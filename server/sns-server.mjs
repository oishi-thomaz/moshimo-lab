// SNS司令室（まとめ用の LINE 公式アカウント）の返事係。ConoHa VPS で常駐（Node.js 18以上、外部パッケージなし）
//
// 役割：ゆうとが SNS司令室に ストック と送ると、まだ投稿していない動画を3アカウント分（もしもラボ・タイトル当てクイズ・いつわ劇場）
//       カルーセルのカードで返す。予約済み・承認待ち・書き出し前（この順で出る）に分けて出す。返事（reply）なので LINE の通数を使わない。
// 1日3回のまとめは GitHub Actions（moshimo-analytics の summary.yml）が送る。このサーバーは返事だけ。
//
// 数字の出どころ：同じ VPS の各投稿サーバーの記録（/var/lib/moshimo・quiz・itsuwa の state.json）と、
//                 公開リポジトリ oishi-thomaz/moshimo-lab の在庫（plan/queue.txt など）
// 設定は /etc/sns.env（install-sns.sh が作る）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const env = process.env;
const PORT = Number(env.PORT || 8790);
const PREFIX = (env.PREFIX || '/sns').replace(/\/$/, '');
const LINE_SECRET = env.LINE_CHANNEL_SECRET || '';
const LINE_TOKEN = env.LINE_CHANNEL_TOKEN || '';
const DATA = env.DATA_DIR || '/var/lib/sns';
const STATE_FILE = path.join(DATA, 'state.json');
const RAW = 'https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/main';
const API = 'https://api.github.com/repos/oishi-thomaz/moshimo-lab/contents';

fs.mkdirSync(DATA, { recursive: true });
let state = { owner: env.LINE_OWNER_USER_ID || '' };
try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch {}
const save = () => { fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state, null, 2)); fs.renameSync(STATE_FILE + '.tmp', STATE_FILE); };
const log = (...a) => console.log(new Date().toISOString(), ...a);

const ACCOUNTS = [
  { key: 'moshimo', name: 'もしもラボ', color: '#0F766E', state: env.MOSHIMO_STATE || '/var/lib/moshimo/state.json', local: env.MOSHIMO_LOCAL || 'http://127.0.0.1:8787/moshimo', queue: 'plan/queue.txt', rendered: 'state/rendered.txt' },
  { key: 'quiz', name: 'タイトル当てクイズ', color: '#B45309', state: env.QUIZ_STATE || '/var/lib/quiz/state.json', local: env.QUIZ_LOCAL || 'http://127.0.0.1:8789/quiz', queue: 'plan/quiz-queue.txt', rendered: 'state/quiz-rendered.txt', ttDraft: true },
  { key: 'itsuwa', name: 'いつわ劇場', color: '#9F1239', state: env.ITSUWA_STATE || '/var/lib/itsuwa/state.json', local: env.ITSUWA_LOCAL || 'http://127.0.0.1:8788/itsuwa', drama: true, ttDraft: true },
];

// ---- 時刻（日本時間） ----
const JST = 9 * 3600e3;
const jst = t => new Date(t + JST);
const when = t => { const d = jst(t); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.toISOString().slice(11, 16)}`; };

// ---- GitHub（公開リポジトリ）。10分だけ覚えておく ----
const cache = new Map();
async function get(url, json = false) {
  const c = cache.get(url);
  if (c && Date.now() - c.t < 10 * 60e3) return c.v;
  const r = await fetch(url, { headers: { 'user-agent': 'sns-shireishitsu', ...(json ? { accept: 'application/vnd.github+json' } : {}) }, signal: AbortSignal.timeout(15e3) });
  if (!r.ok) throw new Error(`${r.status} ${url.split('/').slice(-2).join('/')}`);
  const v = json ? await r.json() : await r.text();
  cache.set(url, { t: Date.now(), v });
  return v;
}
async function exists(url) { try { await get(url); return true; } catch { return false; } }
const lines = t => String(t || '').split(/\s+/).map(s => s.trim()).filter(Boolean);
async function metaOf(id) {
  try {
    const src = await get(`${RAW}/engine/videos/${id}.js`);
    const i = Math.max(0, src.search(/\bmeta:\s*\{|META\s*=/));
    const part = src.slice(i);
    const pick = k => (part.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)) || [])[1] || '';
    return { title: pick('title'), series: pick('series'), answer: pick('answer'), trial: /\btrial:\s*true/.test(part) };
  } catch { return { title: '' }; }
}
const readState = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

// ---- 在庫を集める ----
async function stockOf(acc) {
  const st = readState(acc.state);
  // タイトルは投稿サーバーの media/<番号>.json にある（state.json には入っていない）
  const mediaDir = path.join(path.dirname(acc.state), 'media');
  const titleOf = (id, it) => { if (it.title) return it.title; try { const m = JSON.parse(fs.readFileSync(path.join(mediaDir, `${id}.json`), 'utf8')); return m.title || ''; } catch { return ''; } };
  const items = Object.entries((st && st.items) || {}).map(([id, it]) => ({ id, ...it, title: titleOf(id, it) }));
  const reserved = items.filter(it => it.status === 'approved').sort((a, b) => (a.publishAt || 0) - (b.publishAt || 0));
  const pending = items.filter(it => it.status === 'pending').sort((a, b) => (a.receivedAt || 0) - (b.receivedAt || 0));
  const out = { acc, reserved, pending, queue: [], note: st ? '' : '投稿サーバーの記録が読めなかった' };
  try {
    if (acc.queue) {
      const done = new Set(lines(await get(`${RAW}/${acc.rendered}`)));
      const ids = lines(await get(`${RAW}/${acc.queue}`)).filter(id => !done.has(id));
      const metas = await Promise.all(ids.slice(0, 40).map(metaOf));
      out.queue = ids.slice(0, 40).map((id, k) => ({ id, ...metas[k] }));
      out.queueTotal = ids.length;
    } else if (acc.drama) {
      // いつわ劇場：作品フォルダの中で、まだ投稿サーバーに送っていない話（台本があるもの・まだないもの）
      const sent = new Set(items.map(it => Number(it.id)));
      // 作品の一覧：GitHub の API（1時間60回まで）。読めないときは docs/ITSUWA-AUTO.md に書いてある今の作品
      let works = [];
      try { works = (await get(`${API}/drama/episodes`, true)).filter(x => x.type === 'dir').map(x => x.name); }
      catch { const doc = await get(`${RAW}/docs/ITSUWA-AUTO.md`); works = [...doc.matchAll(/（([a-z][a-z0-9_-]*)、番号 \d+/g)].map(m => m[1]); }
      const list = [];
      for (const w of works) {
        let cap = ''; try { cap = await get(`${RAW}/drama/episodes/${w}/captions.js`); } catch { continue; }
        const base = Number((cap.match(/ID_BASE\s*=\s*(\d+)/) || [])[1] || 0);
        if (!base || [1, 2, 3, 4, 5].every(n => sent.has(base + n))) continue;
        const capBody = cap.slice(Math.max(0, cap.indexOf('CAPTIONS')));
        const name = ((capBody.match(/全5話｜(\S+)/) || [])[1]) || w;
        for (const n of [1, 2, 3, 4, 5]) {
          if (sent.has(base + n)) continue;
          const has = await exists(`${RAW}/drama/episodes/${w}/ep0${n}.script.js`);
          const t = (capBody.match(new RegExp(`${n}:\\s*\`全5話｜\\S+\\s+(第${n}話|最終話)\\s*([^\\n\`]*)`)) || []);
          list.push({ id: String(base + n), title: `${name} 第${n}話${t[2] ? ' ' + t[2].trim() : ''}`, note: has ? '台本あり・まだ送ってない' : 'これから作る' });
        }
      }
      out.queue = list; out.queueTotal = list.length;
    }
  } catch (e) { out.note = `在庫の一覧が読めなかった（${e.message.slice(0, 60)}）`; }
  return out;
}

// ---- カード ----
const nz = (v, d = '-') => { const t = String(v ?? '').trim(); return t || d; };
const head = t => ({ type: 'text', text: t, size: 'xs', color: '#6B7280', weight: 'bold' });
const line1 = (t, o = {}) => ({ type: 'text', text: nz(t), size: 'sm', wrap: false, adjustMode: 'shrink-to-fit', color: '#111111', ...o });
const short = (s, n = 30) => { const t = String(s || '').replace(/^もしも/, '').replace(/｜この(映画|ドラマ|曲)のタイトルは？$/, '（$1）').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const itemTitle = (acc, it) => short(it.answer ? `${it.answer}（${/ドラマ/.test(it.title) ? 'ドラマ' : /曲/.test(it.title) ? '曲' : '映画'}）` : it.title || it.id);
function bubbleOf(s) {
  const { acc } = s;
  const total = s.reserved.length + s.pending.length + (s.queueTotal || 0);
  const secs = [];
  const sec = (title, rows) => { if (secs.length) secs.push({ type: 'separator' }); secs.push({ type: 'box', layout: 'vertical', spacing: 'sm', contents: [head(title), ...rows] }); };
  const pair = (left, right, col) => ({ type: 'box', layout: 'horizontal', contents: [line1(left, { flex: 1 }), ...(String(right || '').trim() ? [{ type: 'text', text: String(right).trim(), size: 'xs', color: col, weight: 'bold', flex: 0, margin: 'md' }] : [])] });
  sec(`予約済み（${s.reserved.length}本）`, s.reserved.length ? s.reserved.slice(0, 15).map(it => pair(short(it.title || `番号 ${it.id}`), it.publishAt ? when(it.publishAt) : '予約済み', '#1D4ED8')) : [line1('なし', { size: 'xs', color: '#888888' })]);
  sec(`承認待ち（${s.pending.length}本）`, s.pending.length ? s.pending.slice(0, 15).map(it => pair(short(it.title || `番号 ${it.id}`), '承認待ち', '#C62828')) : [line1('なし', { size: 'xs', color: '#888888' })]);
  const qTitle = acc.drama ? `これから送る話（${s.queueTotal || 0}話）` : `書き出し前の在庫（${s.queueTotal || 0}本・上から順に出る）`;
  const qRows = s.queue.slice(0, 30).map((q, k) => acc.drama ? pair(q.title, q.note, '#6B7280') : pair(`${k + 1}. ${itemTitle(acc, q)}`, q.trial ? '挑戦' : q.series || '', '#6B7280'));
  if ((s.queueTotal || 0) > s.queue.slice(0, 30).length) qRows.push(line1(`ほか${s.queueTotal - 30}本`, { size: 'xs', color: '#888888' }));
  sec(qTitle, qRows.length ? qRows : [line1('なし', { size: 'xs', color: '#888888' })]);
  if (s.note) sec('メモ', [{ type: 'text', text: s.note, size: 'xs', color: '#C62828', wrap: true }]);
  return { type: 'bubble', size: 'giga',
    header: { type: 'box', layout: 'vertical', backgroundColor: acc.color, paddingAll: '14px', contents: [line1(acc.name, { color: '#ffffff', weight: 'bold', size: 'lg' }), line1(`まだ投稿してない動画 ${total}本`, { color: '#E5E7EB', size: 'xs' })] },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'md', contents: secs } };
}
async function stockMessage() {
  const all = await Promise.all(ACCOUNTS.map(stockOf));
  return { type: 'flex', altText: `ストック：${all.map(s => `${s.acc.name} ${s.reserved.length + s.pending.length + (s.queueTotal || 0)}本`).join('・')}`, contents: { type: 'carousel', contents: all.map(bubbleOf) } };
}


// =====================================================================
// 数字（承認待ち・今日の投稿・いま回ってる・いまの数字）：同じ VPS の各投稿サーバーの記録を読む
// =====================================================================
const md = t => { const d = jst(t); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
const hm = t => jst(t).toISOString().slice(11, 16);
const dayStart = t => Date.parse(`${jst(t).toISOString().slice(0, 10)}T00:00:00+09:00`);
const kfmt = n => (n == null ? '-' : n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万` : Math.round(n).toLocaleString('ja-JP'));
const sgn = n => (n == null ? '' : n > 0 ? `+${kfmt(n)}` : n < 0 ? `-${kfmt(-n)}` : '±0');
const PLAT = { ig: 'インスタ', yt: 'YouTube', tt: 'TikTok' };
const PCOL = { ig: '#D6246E', yt: '#E52D27', tt: '#111111' };
const bigr = s => { const t = String(s || '').replace(/#\S+/g, '').replace(/[\s　？?！!、。,.「」『』…・〜~｜|]/g, '').replace(/^もしも/, ''); const b = new Set(); for (let i = 0; i < t.length - 1; i++) b.add(t.slice(i, i + 2)); return b; };
function ttScore(it, m) {
  const tb = bigr(it.title); let sc = 0;
  if (tb.size >= 3) { const cb = bigr(String(m.cap || '').split('#')[0]); let n = 0; for (const g of tb) if (cb.has(g)) n++; sc = n / tb.size; }
  if (it.publishAt && Math.abs(m.t - it.publishAt) <= 20 * 60e3) sc += 0.6;
  return sc;
}
function matchMedia(media, it, p) {
  const list = Object.values(media || {});
  const byId = list.find(m => m.id === it.id); if (byId || p !== 'tt') return byId || null;
  let best = null, bs = 0; for (const m of list) { const sc = ttScore(it, m); if (sc > bs) { bs = sc; best = m; } }
  return bs >= 0.5 ? best : null;
}
async function loadLive(acc) {
  const st = readState(acc.state);
  if (!st) return { error: '投稿サーバーの記録が読めなかった' };
  const mediaDir = path.join(path.dirname(acc.state), 'media');
  const titleOf = (id, it) => { if (it.title) return it.title; try { return JSON.parse(fs.readFileSync(path.join(mediaDir, `${id}.json`), 'utf8')).title || ''; } catch { return ''; } };
  const items = Object.entries(st.items || {}).map(([id, it]) => ({ id, ...it, title: titleOf(id, it) }));
  let snaps = [];
  try {
    const r = await fetch(`${acc.local}/an/export?hours=27`, { headers: { 'x-an-key': (st.an && st.an.key) || '' }, signal: AbortSignal.timeout(20e3) });
    if (r.ok) snaps = ((await r.json()).snaps || []).sort((a, b) => a.t - b.t);
  } catch (e) { log('export', acc.key, e.message); }
  return { items, snaps, revenue: st.revenue || null };
}
// もしもラボの TikTok 収益（投稿サーバーに届いている記録から）：最新の日の収益と、その日の月の累計
function revenueLines(r) {
  if (!r || !Array.isArray(r.days)) return null;
  const days = r.days.filter(d => d.reward != null).sort((a, b) => a.date.localeCompare(b.date)); const last = days.at(-1); if (!last) return null;
  const m = last.date.slice(0, 7), sum = days.filter(d => d.date.startsWith(m)).reduce((a, d) => a + d.reward, 0), mo = (r.months || {})[m];
  return { day: `${Number(last.date.slice(5, 7))}/${Number(last.date.slice(8, 10))}`, reward: last.reward, month: `${Number(m.slice(5, 7))}月`, total: mo && mo.reward >= sum ? mo.reward : sum, full: !!(mo && mo.reward >= sum) };
}
const yen = n => (n == null ? '-' : `${Math.floor(n).toLocaleString('ja-JP')}円`);
const ok = (s, p) => s[p] && !s[p].error && (p !== 'tt' || s[p].followers != null || Object.keys(s[p].media || {}).length);
function analyzeLive(acc, L, now = Date.now()) {
  const ser = p => L.snaps.filter(s => ok(s, p));
  const plats = ['ig', 'tt', 'yt'].filter(p => ser(p).length);
  const near = (list, target, tol) => { let b = null; for (const e of list) if (Math.abs(e.t - target) <= tol && (!b || Math.abs(e.t - target) < Math.abs(b.t - target))) b = e; return b; };
  const fol = (s, p) => (s ? (p === 'yt' ? s[p].subs ?? null : s[p].followers ?? null) : null);
  const gain = (p, cur, base) => Object.entries(cur[p].media || {}).map(([k, m]) => { const b = base[p].media || {}; const pv = b[k] ? b[k].views || 0 : (m.t > base.t ? 0 : null); return pv == null ? null : { p, k, m, gain: Math.max(0, (m.views || 0) - pv) }; }).filter(Boolean);
  const out = { foll: [], views24: [], trend: [] };
  for (const p of plats) {
    const list = ser(p), cur = list.at(-1), o = near(list, cur.t - 24 * 3600e3, 10 * 3600e3);
    out.foll.push({ p, now: fol(cur, p), d: o && fol(o, p) != null && fol(cur, p) != null ? fol(cur, p) - fol(o, p) : null });
    out.views24.push({ p, v: o ? gain(p, cur, o).reduce((a, x) => a + x.gain, 0) : null });
    const base = near(list.filter(e => cur.t - e.t >= 50 * 60e3), cur.t - 3 * 3600e3, 2 * 3600e3);
    if (base) {
      const g = gain(p, cur, base).filter(x => x.gain > 0).sort((a, b) => b.gain - a.gain);
      const med = g.length ? g[Math.floor(g.length / 2)].gain : 0, hours = Math.max(1, Math.round((cur.t - base.t) / 3600e3));
      const floor = acc.key === 'moshimo' ? 1000 : 150;
      for (const x of g.slice(0, 3)) if (x.gain >= Math.max(floor * hours / 3, med * 2)) {
        let title = x.m.id && L.items.find(it => it.id === x.m.id)?.title;
        if (!title && p === 'tt') { let best = null, bs = 0; for (const it of L.items) { if (it.status !== 'published') continue; const sc = ttScore(it, x.m); if (sc > bs) { bs = sc; best = it; } } if (bs >= 0.5) title = best.title; }
        out.trend.push({ ...x, hours, title: title || String(x.m.cap || '').split(/[#…？?！!。\n]/)[0].slice(0, 26) || `${md(x.m.t)} ${hm(x.m.t)}の投稿` });
      }
    }
  }
  out.trend.sort((a, b) => b.gain / b.hours - a.gain / a.hours);
  const last = L.snaps.at(-1) || {};
  const d0 = dayStart(now);
  out.today = L.items.filter(it => it.publishAt >= d0 && it.publishAt < d0 + 86400e3 && it.status !== 'rejected').sort((a, b) => a.publishAt - b.publishAt)
    .map(it => ({ ...it, v: Object.fromEntries(['ig', 'tt', 'yt'].map(p => { const m = ok(last, p) ? matchMedia(last[p].media, it, p) : null; return [p, m ? m.views ?? null : null]; })) }));
  out.pending = L.items.filter(it => it.status === 'pending');
  out.at = last.t || 0;
  return out;
}
const tagBox = (label, color) => ({ type: 'box', layout: 'vertical', flex: 0, width: '68px', backgroundColor: color, cornerRadius: '4px', paddingAll: '3px', contents: [{ type: 'text', text: label, size: 'xxs', color: '#ffffff', align: 'center', weight: 'bold' }] });
const dcol = v => (/^\+/.test(String(v)) ? '#0A7D3C' : /^[-−]/.test(String(v)) ? '#C62828' : '#666666');
function numRow(p, label, value, delta) {
  return { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [tagBox(PLAT[p], PCOL[p]), line1(label, { flex: 1, margin: 'md' }),
    { type: 'text', text: nz(value), size: 'sm', weight: 'bold', flex: 0, margin: 'md', color: '#111111' },
    ...(delta ? [{ type: 'text', text: delta, size: 'xs', flex: 0, margin: 'md', color: dcol(delta) }] : [])] };
}
function trendBoxes(list, withAcc) {
  if (!list.length) return [line1('記載なし', { size: 'xs', color: '#888888' })];
  return list.map((x, i) => ({ type: 'box', layout: 'vertical', spacing: 'xs', margin: i ? 'md' : 'none', contents: [
    { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [tagBox(PLAT[x.p], PCOL[x.p]), { type: 'text', text: `+${kfmt(x.gain)}／${x.hours}時間`, size: 'sm', weight: 'bold', color: '#0A7D3C', flex: 1, align: 'end' }] },
    line1(`${withAcc ? `${x.acc}：` : ''}${short(x.title)}`),
    { type: 'text', text: `累計 ${kfmt(x.m.views)}再生`, size: 'xxs', color: '#888888' }] }));
}
const STATUS = { published: ['公開済み', '#0A7D3C'], approved: ['予約済み', '#1D4ED8'], pending: ['承認待ち', '#C62828'] };
function postBoxes(list, acc) {
  return list.slice(0, 10).map((it, i) => {
    const [st, col] = STATUS[it.status] || [it.status, '#666666'];
    const vs = ['ig', 'tt', 'yt'].filter(p => it.v[p] != null).map(p => `${PLAT[p]} ${kfmt(it.v[p])}`);
    return { type: 'box', layout: 'vertical', spacing: 'xs', margin: i ? 'md' : 'none', contents: [
      { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: hm(it.publishAt), size: 'xs', color: '#6B7280', weight: 'bold', flex: 1 }, { type: 'text', text: st, size: 'xs', weight: 'bold', color: col, flex: 0 }] },
      line1(short(it.title || `番号 ${it.id}`)),
      ...(it.status === 'published' ? [{ type: 'text', text: vs.length ? vs.join('・') : '再生はまだ取れてない', size: 'xxs', color: '#888888', wrap: true }] : []),
      ...(acc && acc.ttDraft && it.status === 'published' ? [{ type: 'button', style: 'link', height: 'sm', action: { type: 'postback', label: 'TikTokのキャプションを出す', data: `cap:${acc.key}:${it.id}` } }] : [])] };
  });
}
function card(acc, subtitle, sections, footer) {
  const body = [];
  sections.filter(x => x && x.length).forEach((x, i) => { if (i) body.push({ type: 'separator' }); body.push({ type: 'box', layout: 'vertical', spacing: 'sm', contents: x }); });
  const b = { type: 'bubble', size: 'giga',
    header: { type: 'box', layout: 'vertical', backgroundColor: acc.color, paddingAll: '14px', contents: [line1(acc.name, { color: '#ffffff', weight: 'bold', size: 'lg' }), line1(subtitle, { color: '#E5E7EB', size: 'xs' })] },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'md', contents: body.length ? body : [line1('-')] } };
  if (footer) b.footer = footer;
  return b;
}
const readAccounts = () => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'accounts.json'), 'utf8')); } catch { return {}; } };
const openButton = (acc, text) => {
  const id = (readAccounts()[acc.key] || {}).basicId;
  if (!id) return null;
  return { type: 'box', layout: 'vertical', paddingAll: '10px', contents: [{ type: 'button', style: 'primary', color: acc.color, height: 'sm',
    action: { type: 'uri', label: `${acc.name}のLINEで${text}`.slice(0, 40), uri: `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(text)}` } }] };
};
async function liveAll() { return Promise.all(ACCOUNTS.map(async acc => { const L = await loadLive(acc); return { acc, L, a: L.error ? null : analyzeLive(acc, L) }; })); }
const carousel = (alt, bubbles) => ({ type: 'flex', altText: alt.slice(0, 390), contents: { type: 'carousel', contents: bubbles } });

// ---- 承認（2026/11/02〜 SNS司令室に一本化）：各投稿サーバーに同じ VPS の中から聞いて、ここで承認・修正・却下する ----
const accOf = key => ACCOUNTS.find(a => a.key === key);
const keyOf = acc => { const st = readState(acc.state); return (st && st.an && st.an.key) || ''; };
async function api(acc, method, p, body) {
  const r = await fetch(`${acc.local}${p}`, { method, headers: { 'x-an-key': keyOf(acc), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20e3) });
  const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch {}
  if (!r.ok) throw new Error(`${acc.name} ${r.status} ${t.slice(0, 80)}`);
  return j;
}
const pb = (label, data, display, style = 'secondary', color) => ({ type: 'button', style, height: 'sm', ...(color ? { color } : {}), action: { type: 'postback', label, data, ...(display ? { displayText: display } : {}) } });
function approvalBubble(acc, it, slotText) {
  return { type: 'bubble', size: 'mega',
    hero: { type: 'image', url: it.cover, size: 'full', aspectRatio: '4:5', aspectMode: 'cover', action: { type: 'uri', uri: it.video } },
    body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
      { type: 'box', layout: 'horizontal', contents: [{ type: 'box', layout: 'vertical', flex: 0, backgroundColor: acc.color, cornerRadius: '4px', paddingAll: '4px', paddingStart: '8px', paddingEnd: '8px', contents: [{ type: 'text', text: acc.name, size: 'xxs', color: '#ffffff', weight: 'bold' }] }, { type: 'filler' }] },
      { type: 'text', text: short(it.title, 60), size: 'md', weight: 'bold', wrap: true, maxLines: 3 },
      { type: 'box', layout: 'horizontal', margin: 'md', contents: [{ type: 'text', text: '承認すると', size: 'xs', color: '#888888', flex: 1 }, { type: 'text', text: slotText, size: 'xs', weight: 'bold', color: '#0A7D3C', flex: 0 }] },
      ...(it.len ? [{ type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '長さ', size: 'xs', color: '#888888', flex: 1 }, { type: 'text', text: it.len, size: 'xs', weight: 'bold', flex: 0 }] }] : []),
      { type: 'text', text: '画像を押すと動画が見られる', size: 'xxs', color: '#AAAAAA', margin: 'md' }] },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
      pb('承認する', `ap:${acc.key}:approve:${it.id}`, `${short(it.title, 20)} を承認`, 'primary', acc.color),
      { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [pb('修正して', `fb:${acc.key}:${it.id}`, `${short(it.title, 20)} を修正して`), pb('却下', `ap:${acc.key}:reject:${it.id}`, `${short(it.title, 20)} を却下`)] }] } };
}
// 台本の承認：Claude が書いた台本の候補（投稿サーバーの /an/scripts）。承認・直してOK・見送り
function scriptBubble(acc, x) {
  // 台本は1つの文にまとめる（行ごとに部品を分けると、カルーセルの上限 50KB をすぐ超える）
  const body = (x.lines || []).map((l, i) => `${i + 1}. ${String(l).trim()}`).join('\n');
  const lines = body ? [{ type: 'text', text: body, size: 'xs', color: '#222222', wrap: true, lineSpacing: '3px' }] : [];
  return { type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: acc.color, paddingAll: '12px', spacing: 'xs', contents: [
      line1(`台本 ${x.id}${x.pillar ? `・${x.pillar}` : ''}`, { color: '#E5E7EB', size: 'xxs' }),
      { type: 'text', text: nz(x.title), color: '#ffffff', weight: 'bold', size: 'md', wrap: true, maxLines: 3 }] },
    body: { type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'xs', contents: [
      ...lines,
      ...(x.ask ? [{ type: 'text', text: `質問：${x.ask}`, size: 'xs', color: '#0A7D3C', wrap: true, margin: 'md' }] : []),
      ...(x.note ? [{ type: 'text', text: x.note, size: 'xxs', color: '#888888', wrap: true, margin: 'sm' }] : [])] },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
      pb('この台本でOK', `sc:${acc.key}:ok:${x.id}`, `台本 ${short(x.title, 20)} を承認`, 'primary', acc.color),
      { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [pb('直してOK', `scfb:${acc.key}:${x.id}`, `台本 ${short(x.title, 20)} を直して`), pb('見送り', `sc:${acc.key}:skip:${x.id}`, `台本 ${short(x.title, 20)} は見送り`)] }] } };
}
async function pendingMessage() {
  const all = await Promise.all(ACCOUNTS.map(async acc => { try { const P = await api(acc, 'GET', '/an/pending'); let S = []; try { S = (await api(acc, 'GET', '/an/scripts')).items || []; } catch {} return { acc, P, S }; } catch (e) { return { acc, err: e.message, S: [] }; } }));
  const total = all.reduce((n, x) => n + (x.P ? x.P.items.length : 0), 0);
  const scripts = all.reduce((n, x) => n + x.S.length, 0);
  // 1枚目：アカウントごとの本数と まとめて承認
  const rows = all.map(({ acc, P, err }, i) => ({ type: 'box', layout: 'vertical', spacing: 'sm', margin: i ? 'lg' : 'none', contents: [
    { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [line1(acc.name, { flex: 1, weight: 'bold' }), { type: 'text', text: err ? '読めなかった' : `${P.items.length}本`, size: 'sm', weight: 'bold', flex: 0, color: err ? '#C62828' : P.items.length ? '#C62828' : '#0A7D3C' }] },
    ...(all[i].S.length ? [{ type: 'box', layout: 'horizontal', contents: [line1('台本の返事待ち', { flex: 1, size: 'xs', color: '#555555' }), { type: 'text', text: `${all[i].S.length}本`, size: 'xs', weight: 'bold', flex: 0, color: '#C62828' }] }] : []),
    ...(P && P.items.length > 1 ? [pb(`${acc.name}を全部承認`, `apall:${acc.key}`, `${acc.name}の承認待ちを全部承認`, 'primary', acc.color)] : [])] }));
  const head1 = { type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#16324F', paddingAll: '14px', contents: [line1(`承認待ち ${total}本${scripts ? `＋台本 ${scripts}本` : ''}`, { color: '#ffffff', weight: 'bold', size: 'lg' }), line1('右にスワイプで1本ずつ見られる', { color: '#E5E7EB', size: 'xs' })] },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', contents: rows },
    footer: { type: 'box', layout: 'vertical', paddingAll: '10px', contents: [{ type: 'text', text: '修正して を押すと、直してほしいところを書ける。その回は却下になって、Claude が直してもう一回ここに出す。台本は 直してOK で書いたとおりに Claude が直してから動画にする', size: 'xxs', color: '#888888', wrap: true }] } };
  if (!total && !scripts) return { type: 'flex', altText: '承認待ちはない', contents: head1 };
  const bubbles = [];
  for (const { acc, P } of all) if (P) P.items.forEach((it, k) => bubbles.push(approvalBubble(acc, it, k === 0 ? (P.nextSlot ? when(P.nextSlot) : '-') : '承認した順に次の枠')));
  for (const { acc, S } of all) for (const x of S) bubbles.push(scriptBubble(acc, x));
  // 1つのカルーセルは12枚まで・JSON で 50KB まで（日本語は1文字3バイト）。余裕を見て 40KB で区切る
  const msgs = [], chunks = [[head1]];
  for (const b of bubbles) { const cur = chunks.at(-1); if (cur.length >= 12 || Buffer.byteLength(JSON.stringify([...cur, b])) > 40000) chunks.push([b]); else cur.push(b); }
  for (const c of chunks.slice(0, 5)) msgs.push({ type: 'flex', altText: `承認待ち ${total}本${scripts ? `・台本 ${scripts}本` : ''}`, contents: { type: 'carousel', contents: c } });
  return msgs;
}
async function onApproval(data, uid) {
  const [kind, key, a3, a4] = data.split(':');
  const acc = accOf(key); if (!acc) return text('アカウントがわからへん');
  if (kind === 'ap') { const r = await api(acc, 'POST', '/an/action', { act: a3, id: a4 }); return text(r.message || 'OK'); }
  if (kind === 'cap') { const r = await api(acc, 'GET', `/an/caption?id=${encodeURIComponent(a3)}`); return [text(`${r.title} の TikTok キャプション。次の吹き出しを長押しでコピーして貼って`), text(r.tt || r.full || 'キャプションがない')]; }
  if (kind === 'apall') {
    const P = await api(acc, 'GET', '/an/pending'); const out = [];
    for (const it of P.items) { const r = await api(acc, 'POST', '/an/action', { act: 'approve', id: it.id }); out.push(`・${r.message}`); }
    return text(out.length ? `${acc.name}を全部承認した\n${out.join('\n')}` : '承認待ちはなかった');
  }
  if (kind === 'sc') { const r = await api(acc, 'POST', '/an/scripts', { act: a3, id: a4 }); return text(r.message || 'OK'); }
  if (kind === 'scfb') {
    state.awaitFb = { key, id: a3, kind: 'script', until: Date.now() + 15 * 60e3 }; save();
    return text('台本の直してほしいところを、このまま送って（例：3行目の数字を変えて、オチをもっと強く など）。直したら確認なしで動画にする。15分以内に送ったぶんを記録する。やめるときは やめる と送って');
  }
  if (kind === 'fb') {
    state.awaitFb = { key, id: a3, until: Date.now() + 15 * 60e3 }; save();
    return text('直してほしいところを、このまま送って（例：冒頭の言い回しをもっと皮肉っぽく、数字を大きく見せて など）。15分以内に送ったぶんを記録する。やめるときは やめる と送って');
  }
  return text('わからへんボタンやった');
}
async function onFeedbackText(msg) {
  const f = state.awaitFb; delete state.awaitFb; save();
  if (/^(やめる|キャンセル)$/.test(msg)) return text(`修正の指示はやめた（その${f.kind === 'script' ? '台本' : '回'}はまだ承認待ちのまま）`);
  const acc = accOf(f.key);
  if (f.kind === 'script') { const r = await api(acc, 'POST', '/an/scripts', { act: 'fix', id: f.id, text: msg }); return text(r.ok ? '記録した。次の動画制作の回（10:47 か 16:47）で Claude が直してから動画にする。できた動画はいつもどおり 承認待ち に出る' : `記録できへんかった（${r.error || ''}）`); }
  const r = await api(acc, 'POST', '/an/feedback', { id: f.id, text: msg });
  if (!r.ok) return text(`記録できへんかった（${r.message || r.error || ''}）`);
  return text(`記録した。その回はいったん却下にして、次の動画制作の回（10:47 か 16:47）で Claude が直して、もう一回 承認待ち に出す。\n同じ指摘は今後の台本のルールにも入れる。`);
}
async function todayMessage() {
  const all = await liveAll(), now = Date.now();
  return carousel(`今日の投稿 ${md(now)}`, all.map(({ acc, L, a }) => {
    if (!a) return card(acc, L.error, [[line1('読めなかった', { size: 'xs', color: '#C62828' })]]);
    const sec = a.today.length ? postBoxes(a.today, acc) : [line1(a.pending.length ? `まだ予定なし（承認待ち ${a.pending.length}本）` : '予定なし', { size: 'xs', color: '#C62828' })];
    return card(acc, `${md(now)} の投稿・${a.at ? hm(a.at) + ' 時点' : ''}`, [[head('今日の投稿'), ...sec]]);
  }));
}
async function trendMessage() {
  const all = await liveAll();
  const list = all.flatMap(x => (x.a ? x.a.trend : []).map(t => ({ ...t, acc: x.acc.name }))).sort((a, b) => b.gain / b.hours - a.gain / a.hours).slice(0, 6);
  const b = card({ name: 'いま回ってる動画', color: '#B45309' }, '直近およそ3時間で再生が大きく増えた動画', [[...trendBoxes(list, true)]]);
  return { type: 'flex', altText: `いま回ってる：${list.length ? list.slice(0, 3).map(x => short(x.title, 14)).join('・') : '記載なし'}`, contents: b };
}
async function numbersMessage() {
  const all = await liveAll();
  return carousel('いまの数字', all.map(({ acc, L, a }) => {
    if (!a) return card(acc, L.error, [[line1('読めなかった', { size: 'xs', color: '#C62828' })]]);
    return card(acc, `${a.at ? hm(a.at) + ' 時点' : '-'}`, [
      [head('いま回ってる動画'), ...trendBoxes(a.trend.slice(0, 3), false)],
      [head('フォロワー（24時間の増減）'), ...a.foll.map(f => numRow(f.p, f.p === 'yt' ? '登録者' : 'フォロワー', kfmt(f.now), f.d == null ? '' : sgn(f.d)))],
      [head('再生（24時間で増えた分）'), ...a.views24.filter(v => v.v != null).map(v => numRow(v.p, '再生', kfmt(v.v)))],
      ...(acc.key === 'moshimo' && revenueLines(L.revenue) ? [(r => [head('TikTok の収益（2日ほど遅れて出る）'), numRow('tt', `${r.day} の収益`, yen(r.reward)), numRow('tt', `${r.month}の累計${r.full ? '' : '（記録の合計）'}`, yen(r.total))])(revenueLines(L.revenue))] : []),
    ]);
  }));
}
const HOWTO = [
  'SNS司令室の使い方',
  '',
  '自動で届くもの',
  '・8:00 朝のまとめ（昨日の結果と日報）',
  '・13:00 昼のまとめ',
  '・22:30 夜のまとめ（今日の結果）',
  '・見張りが直したときの連絡',
  '',
  'ボタン',
  '・ストック：まだ投稿してない動画（予約済み・承認待ち・書き出し前）',
  '・承認待ち：3アカウントの承認待ちをここで承認・修正・却下（まとめて承認もできる）。Claude が書いた台本の候補もここに出る（この台本でOK・直してOK・見送り）',
  '・今日の投稿：今日の予定と今の再生。クイズといつわ劇場は TikTok のキャプションもここから出せる',
  '・いま回ってる：直近3時間で伸びてる動画',
  '・いまの数字：フォロワーと24時間の再生',
  '',
  '修正して を押したあとに書いた指示は、Claude が次の動画制作で直してもう一回 承認待ち に出す。',
].join('\n');

// ---- LINE ----
async function reply(token, messages) {
  const r = await fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify({ replyToken: token, messages: [].concat(messages).slice(0, 5) }) });
  if (!r.ok) { const t = await r.text(); log('reply failed', r.status, t.slice(0, 300)); return false; }
  return true;
}
const text = t => ({ type: 'text', text: t });
const HELP = '下のメニューのボタンを押すか、ストック・承認待ち・今日の投稿・いま回ってる・いまの数字・使い方 のどれかを送ってみて。';

// LINE Developers の 検証 で送られてくるテスト用の偽ユーザー（これを持ち主にしない）
const DUMMY = /^Udeadbeef/i;
if (DUMMY.test(state.owner || '')) { log('owner was the test user, cleared'); state.owner = env.LINE_OWNER_USER_ID || ''; save(); }
async function onEvent(ev) {
  if (ev.type === 'postback' && /^menu:/.test(String(ev.postback && ev.postback.data))) ev = { ...ev, type: 'message', message: { type: 'text', text: String(ev.postback.data).slice(5) } };
  const uid = ev.source && ev.source.userId;
  log('event', ev.type, ev.message ? ev.message.type : '', uid ? uid.slice(0, 6) + '…' : '-', uid && uid === state.owner ? 'owner' : 'not-owner');
  if (!uid || DUMMY.test(uid) || /^0+$|^f+$/i.test(ev.replyToken || '')) return;
  if (ev.type === 'follow' && !state.owner) { state.owner = uid; save(); log('owner set (follow)'); }
  if (ev.type === 'postback') {
    try { const m = await onApproval(String(ev.postback.data || ''), uid); await reply(ev.replyToken, m); }
    catch (e) { log('approval error', e); await reply(ev.replyToken, text(`うまくいかへんかった（${String(e.message).slice(0, 100)}）`)); }
    return;
  }
  if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text') return;
  if (!state.owner) { state.owner = uid; save(); log('owner set'); }
  // 友だちになっている人（＝ゆうと）からの メッセージにはそのまま返す。持ち主の照合で返事が止まらないように、ここでは弾かない
  const msg = ev.message.text.trim();
  const isCmd = /^(承認待ち|承認|今日(の投稿)?|(いま|今)回って(る|いる).*|(いま|今)の数字|数字|使い方|ヘルプ|help|ストック|すとっく|在庫|stock)$/i.test(msg);
  if (state.awaitFb && state.awaitFb.until > Date.now() && !isCmd) {
    try { await reply(ev.replyToken, await onFeedbackText(msg)); } catch (e) { log('feedback error', e); await reply(ev.replyToken, text(`記録できへんかった（${String(e.message).slice(0, 80)}）`)); }
    return;
  }
  const CMDS = [[/^(承認待ち|承認)$/, pendingMessage], [/^今日(の投稿)?$/, todayMessage], [/^(いま|今)回って(る|いる)/, trendMessage], [/^(いま|今)の数字$|^数字$/, numbersMessage]];
  for (const [re, fn] of CMDS) if (re.test(msg)) {
    try { const m = await fn(); if (!(await reply(ev.replyToken, m))) await reply(ev.replyToken, text('カードが送れへんかった。もう一回押してみて。')); }
    catch (e) { log('cmd error', e); await reply(ev.replyToken, text(`集められへんかった（${String(e.message).slice(0, 80)}）`)); }
    return;
  }
  if (/^(使い方|ヘルプ|help)$/i.test(msg)) { await reply(ev.replyToken, text(HOWTO)); return; }
  if (/^(ストック|すとっく|在庫|stock)/i.test(msg)) {
    try { const m = await stockMessage(); if (!(await reply(ev.replyToken, m))) await reply(ev.replyToken, text('カードが送れへんかった。もう一回 ストック と送ってみて。')); }
    catch (e) { log('stock error', e); await reply(ev.replyToken, text(`ストックが集められへんかった（${String(e.message).slice(0, 80)}）`)); }
    return;
  }
  await reply(ev.replyToken, text(HELP));
}

// ---- 投稿の失敗だけは SNS司令室から知らせる（各アカウントの LINE は静かにしたので）。5分ごとに記録を見る ----
async function pushOwner(messages) {
  if (!state.owner || !LINE_TOKEN) return false;
  const r = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify({ to: state.owner, messages: [].concat(messages) }) });
  if (!r.ok) log('push failed', r.status, (await r.text()).slice(0, 200));
  return r.ok;
}
async function watchFailures() {
  state.alerted = state.alerted || {};
  const out = [];
  for (const acc of ACCOUNTS) {
    const st = readState(acc.state); if (!st) continue;
    for (const x of (st.postedLog || []).filter(x => x.t > Date.now() - 6 * 3600e3)) {
      const r = x.r || {}, bad = ['ig', 'yt', 'tt'].filter(p => r[p] && !r[p].ok && !r[p].skip);
      const k = `${acc.key}:${x.id}:${x.t}`;
      if (!bad.length || state.alerted[k]) continue;
      state.alerted[k] = Date.now();
      let title = x.id; try { title = JSON.parse(fs.readFileSync(path.join(path.dirname(acc.state), 'media', `${x.id}.json`), 'utf8')).title || x.id; } catch {}
      out.push({ acc, id: x.id, title, why: bad.map(p => p === 'tt' && /pending_share|daily upload cap/i.test(String(r[p].error || '')) ? 'TikTok：下書きの上限（投稿してない下書きは24時間で5本まで）。枠が空いたら自動で送り直す' : `${PLAT[p]}：${String(r[p].error || '失敗').slice(0, 80)}`).join('\n'), ig: bad.includes('ig') });
    }
  }
  for (const k of Object.keys(state.alerted)) if (state.alerted[k] < Date.now() - 3 * 86400e3) delete state.alerted[k];
  save();
  if (!out.length) return;
  const b = { type: 'bubble', size: 'giga', header: { type: 'box', layout: 'vertical', backgroundColor: '#C62828', paddingAll: '14px', contents: [line1('投稿に失敗した', { color: '#ffffff', weight: 'bold', size: 'lg' })] },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'md', contents: out.slice(0, 6).map(o => ({ type: 'box', layout: 'vertical', spacing: 'xs', contents: [line1(`${o.acc.name}：${short(o.title)}`, { weight: 'bold' }), { type: 'text', text: o.why, size: 'xs', color: '#C62828', wrap: true }, ...(o.ig ? [pb('インスタにもう一回', `ap:${o.acc.key}:retry:${o.id}`, `${short(o.title, 20)} をもう一回投稿`)] : [])] })) } };
  await pushOwner({ type: 'flex', altText: `投稿に失敗：${out.map(o => short(o.title, 14)).join('・')}`, contents: b });
}
if (!process.argv.some(a => a.startsWith('--'))) setInterval(() => watchFailures().catch(e => log('watch', e.message)), 5 * 60e3);

// ---- HTTP ----
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === `${PREFIX}/health`) return send(res, 200, { ok: true, owner: !!state.owner, line: !!(LINE_SECRET && LINE_TOKEN) });
    if (u.pathname === `${PREFIX}/line/webhook` && req.method === 'POST') {
      const chunks = []; let size = 0;
      for await (const c of req) { size += c.length; if (size > 1e6) return send(res, 413, { ok: false }); chunks.push(c); }
      const raw = Buffer.concat(chunks);
      const sig = crypto.createHmac('sha256', LINE_SECRET).update(raw).digest('base64');
      const got = String(req.headers['x-line-signature'] || '');
      if (!LINE_SECRET || got.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(sig))) return send(res, 401, { ok: false });
      send(res, 200, { ok: true });
      const body = JSON.parse(raw.toString('utf8'));
      for (const ev of body.events || []) onEvent(ev).catch(e => log('event error', e));
      return;
    }
    send(res, 404, { ok: false });
  } catch (e) { log('error', e); if (!res.headersSent) send(res, 500, { ok: false }); }
}).listen(PORT, '127.0.0.1', () => log(`SNS司令室 server on 127.0.0.1:${PORT}${PREFIX}`));

// 動作確認用：node server.mjs --stock で、LINE に送らずにカードの中身を表示する
const TEST = { '--stock': stockMessage, '--pending': pendingMessage, '--today': todayMessage, '--trend': trendMessage, '--numbers': numbersMessage };
for (const [k, fn] of Object.entries(TEST)) if (process.argv.includes(k)) fn().then(m => { console.log(JSON.stringify(m, null, 1)); process.exit(0); });
