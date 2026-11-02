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
  { key: 'moshimo', name: 'もしもラボ', color: '#0F766E', state: env.MOSHIMO_STATE || '/var/lib/moshimo/state.json', queue: 'plan/queue.txt', rendered: 'state/rendered.txt' },
  { key: 'quiz', name: 'タイトル当てクイズ', color: '#B45309', state: env.QUIZ_STATE || '/var/lib/quiz/state.json', queue: 'plan/quiz-queue.txt', rendered: 'state/quiz-rendered.txt' },
  { key: 'itsuwa', name: 'いつわ劇場', color: '#9F1239', state: env.ITSUWA_STATE || '/var/lib/itsuwa/state.json', drama: true },
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

// ---- LINE ----
async function reply(token, messages) {
  const r = await fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify({ replyToken: token, messages: [].concat(messages).slice(0, 5) }) });
  if (!r.ok) { const t = await r.text(); log('reply failed', r.status, t.slice(0, 300)); return false; }
  return true;
}
const text = t => ({ type: 'text', text: t });
const HELP = 'ストック と送ると、まだ投稿してない動画を3アカウント分カードで返す。\n1日3回（8:00・13:00・22:30）のまとめは自動で届く。';

// LINE Developers の 検証 で送られてくるテスト用の偽ユーザー（これを持ち主にしない）
const DUMMY = /^Udeadbeef/i;
if (DUMMY.test(state.owner || '')) { log('owner was the test user, cleared'); state.owner = env.LINE_OWNER_USER_ID || ''; save(); }
async function onEvent(ev) {
  const uid = ev.source && ev.source.userId;
  log('event', ev.type, ev.message ? ev.message.type : '', uid ? uid.slice(0, 6) + '…' : '-', uid && uid === state.owner ? 'owner' : 'not-owner');
  if (!uid || DUMMY.test(uid) || /^0+$|^f+$/i.test(ev.replyToken || '')) return;
  if (ev.type === 'follow' && !state.owner) { state.owner = uid; save(); log('owner set (follow)'); }
  if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text') return;
  if (!state.owner) { state.owner = uid; save(); log('owner set'); }
  // 友だちになっている人（＝ゆうと）からの メッセージにはそのまま返す。持ち主の照合で返事が止まらないように、ここでは弾かない
  const msg = ev.message.text.trim();
  if (/^(ストック|すとっく|在庫|stock)/i.test(msg)) {
    try { const m = await stockMessage(); if (!(await reply(ev.replyToken, m))) await reply(ev.replyToken, text('カードが送れへんかった。もう一回 ストック と送ってみて。')); }
    catch (e) { log('stock error', e); await reply(ev.replyToken, text(`ストックが集められへんかった（${String(e.message).slice(0, 80)}）`)); }
    return;
  }
  await reply(ev.replyToken, text(HELP));
}

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
if (process.argv.includes('--stock')) { stockMessage().then(m => { console.log(JSON.stringify(m, null, 1)); process.exit(0); }); }
