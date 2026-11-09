// ニュースアカウント（インスタのみ・完全自動）の投稿サーバー。ConoHa VPS で常駐（Node.js 18以上、外部パッケージなし）
//
// 役割
//  1. GitHub Actions（news-build.yml）から投稿画像（1080x1350 の JPEG）とキャプションを受け取って並べておく
//  2. POST_TIMES の時刻ごとに1本、インスタにカルーセル（画像1枚ならふつうの写真）で投稿する。承認は挟まない
//  3. 古くなったネタ（EXPIRE_H 時間より前に届いたもの）は出さずに捨てる
//  4. インスタの長期トークンを20日ごとに自動更新する
//  5. 投稿の数字（閲覧・いいね・保存・シェア）を 24時間・72時間・7日 の時点で記録する（/an/export で取り出す）
//  6. 投稿の失敗・在庫切れ・トークン更新の失敗だけ、SNS司令室の LINE に知らせる（同じ種類は12時間に1回まで）
// 設定は /etc/news.env（server/install-news.sh が作る。項目は server/news.env.example）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const env = process.env;
const VERSION = '2026-11-09a';
const PORT = Number(env.PORT || 8791);
const PREFIX = (env.PREFIX || '/news').replace(/\/$/, '');
const BRAND = env.BRAND || 'ニュース';
const BASE_URL = (env.BASE_URL || '').replace(/\/$/, '');
const DATA = env.DATA_DIR || '/var/lib/news';
const MEDIA = path.join(DATA, 'media');
const STATE_FILE = path.join(DATA, 'state.json');
const SECRET = env.HOOK_SECRET || '';
const IG_USER_ID = env.IG_USER_ID || '';
const IG_API = env.IG_API || 'https://graph.instagram.com/v25.0'; // テストのときだけ差し替える
const POST_TIMES = (env.POST_TIMES || '07:30,12:00,18:00,21:00').split(',').map(s => s.trim()).filter(s => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s)).sort();
const EXPIRE_H = Number(env.EXPIRE_H || 72);
const KEEP_DAYS = Number(env.KEEP_DAYS || 14);
const ALERT_TOKEN = env.ALERT_LINE_TOKEN || '';
const JST = 9 * 3600e3;

fs.mkdirSync(MEDIA, { recursive: true });
let state = { igToken: env.IG_TOKEN || '', igTokenAt: 0, items: {}, slots: {}, paused: false, alerts: {} };
try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch {}
if (!state.igToken && env.IG_TOKEN) state.igToken = env.IG_TOKEN;
if (!state.igTokenAt) state.igTokenAt = Date.now();
const save = () => { fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state, null, 1)); fs.renameSync(STATE_FILE + '.tmp', STATE_FILE); };
const log = (...a) => console.log(new Date().toISOString(), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jstStr = t => { const d = new Date(t + JST); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.toISOString().slice(11, 16)}`; };

// ---------------- 投稿枠 ----------------
function day0(t) { const j = new Date(t + JST); return Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST; }
function times() { return state.postTimes && state.postTimes.length ? state.postTimes : POST_TIMES; }
function slotsOf(d) { return times().map(hm => { const [h, m] = hm.split(':').map(Number); return d + (h * 60 + m) * 60e3; }); }
function nextSlot(after = Date.now()) {
  for (let k = 0; k < 3; k++) for (const t of slotsOf(day0(after) + k * 86400e3)) if (t > after) return t;
  return after + 86400e3;
}
const queued = () => Object.entries(state.items).filter(([, it]) => it.status === 'queued');

function pickNext() {
  const now = Date.now();
  for (const [id, it] of queued()) if (now - it.receivedAt > EXPIRE_H * 3600e3) { it.status = 'expired'; log('expired', id); }
  const q = queued();
  if (!q.length) return null;
  // 新しいネタを優先：36時間以内に届いたものの中で score が高い順、同点なら新しい順。なければ一番古いもの
  const fresh = q.filter(([, it]) => now - it.receivedAt < 36 * 3600e3);
  const pool = fresh.length ? fresh : q;
  pool.sort((a, b) => (b[1].score || 0) - (a[1].score || 0) || b[1].receivedAt - a[1].receivedAt);
  return pool[0][0];
}

// ---------------- Instagram ----------------
async function ig(method, p, params = {}, retries = method === 'GET' ? 4 : 0) {
  for (let k = 0; ; k++) {
    try {
      const url = new URL(IG_API + p);
      const opt = { method, headers: { authorization: `Bearer ${state.igToken}` }, signal: AbortSignal.timeout(60000) };
      if (method === 'GET') Object.entries(params).forEach(([a, v]) => url.searchParams.set(a, v));
      else { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(params); }
      const r = await fetch(url, opt);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) { const e = new Error(`IG ${p}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 400)}`); e.status = r.status; throw e; }
      return j;
    } catch (e) {
      if (k >= retries || !(e.status >= 500 || e.status === undefined)) throw e;
      log('IG retry', p, String(e.message).slice(0, 120)); await sleep(15000 * (k + 1));
    }
  }
}
async function waitReady(cid) {
  let st = 'IN_PROGRESS';
  for (let k = 0; k < 30 && st === 'IN_PROGRESS'; k++) { await sleep(k ? 6000 : 3000); st = (await ig('GET', `/${cid}`, { fields: 'status_code' })).status_code; }
  if (st !== 'FINISHED') throw new Error(`container ${cid} status ${st}`);
}

async function publish(id) {
  const it = state.items[id];
  it.status = 'publishing'; it.tries = (it.tries || 0) + 1; save();
  try {
    const urls = it.slides.map(f => `${BASE_URL}/media/${f}`);
    let creation;
    if (urls.length === 1) {
      creation = (await ig('POST', `/${IG_USER_ID}/media`, { image_url: urls[0], caption: it.caption }, 2)).id;
    } else {
      const kids = [];
      for (const u of urls.slice(0, 10)) kids.push((await ig('POST', `/${IG_USER_ID}/media`, { image_url: u, is_carousel_item: true }, 2)).id);
      for (const c of kids) await waitReady(c);
      creation = (await ig('POST', `/${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: it.caption }, 2)).id;
    }
    await waitReady(creation);
    // 公開。エラーでも実は公開済みのことがあるので、やり直す前に PUBLISHED を確かめて二重投稿を防ぐ
    let p = null;
    for (let k = 0; k < 3 && !p; k++) {
      try { p = await ig('POST', `/${IG_USER_ID}/media_publish`, { creation_id: creation }); }
      catch (e) {
        if (!(e.status >= 500 || e.status === undefined)) throw e;
        await sleep(20000);
        const st = await ig('GET', `/${creation}`, { fields: 'status_code' }).catch(() => ({}));
        if (st.status_code === 'PUBLISHED') { const l = await ig('GET', `/${IG_USER_ID}/media`, { fields: 'id', limit: 1 }); p = { id: l.data?.[0]?.id }; }
        else if (k === 2) throw e;
      }
    }
    const info = await ig('GET', `/${p.id}`, { fields: 'permalink' }).catch(() => ({}));
    Object.assign(it, { status: 'published', mediaId: p.id, permalink: info.permalink || '', publishedAt: Date.now(), error: '' }); save();
    log('published', id, it.permalink);
    return true;
  } catch (e) {
    const msg = String(e.message || e);
    // 画像の取得失敗・一時的なエラーは次の枠でもう一度（3回まで）。それ以外（中身の問題）は捨てる
    const again = it.tries < 3 && !/\b(2207026|2207009|2207004|36003|9004)\b|aspect ratio|image format/i.test(msg);
    Object.assign(it, { status: again ? 'queued' : 'error', error: msg.slice(0, 500) }); save();
    log('publish error', id, msg);
    await alert('publish', `${BRAND}：投稿に失敗した（${id}）${again ? '。次の枠でもう一度出す' : '。この回は飛ばした'}\n${msg.slice(0, 220)}`);
    return false;
  }
}

async function tick() {
  if (!state.igToken || !IG_USER_ID || state.paused) return;
  const now = Date.now();
  for (const t of slotsOf(day0(now))) {
    if (now < t || now > t + 25 * 60e3 || state.slots[t]) continue;
    state.slots[t] = 'taken'; save();
    for (const k of Object.keys(state.slots)) if (Number(k) < now - 3 * 86400e3) delete state.slots[k];
    const id = pickNext();
    if (!id) { log('slot empty', jstStr(t)); state.slots[t] = 'empty'; save(); await alert('empty', `${BRAND}：${jstStr(t)} の枠に出すネタがなかった（朝の運用か news-collect・news-build が止まっているかも）`); return; }
    state.slots[t] = id; save();
    await publish(id);
    return;
  }
}

async function refreshToken() {
  if (!state.igToken || Date.now() - (state.igTokenAt || 0) < 20 * 86400e3) return;
  try {
    const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(state.igToken)}`);
    const j = await r.json();
    if (!j.access_token) throw new Error(JSON.stringify(j).slice(0, 300));
    state.igToken = j.access_token; state.igTokenAt = Date.now(); save(); log('IG token refreshed');
  } catch (e) { log('token refresh failed', e); await alert('token', `${BRAND}：インスタのトークン更新に失敗した。Claude に伝えて：${String(e).slice(0, 200)}`); }
}

// 投稿の数字：24時間・72時間・7日の時点で1回ずつ
const MARKS = [['h24', 24], ['h72', 72], ['d7', 168]];
async function insights() {
  if (!state.igToken) return;
  const now = Date.now();
  for (const [id, it] of Object.entries(state.items)) {
    if (it.status !== 'published' || !it.mediaId) continue;
    for (const [k, h] of MARKS) {
      if (it.stats?.[k] || now - it.publishedAt < h * 3600e3 || now - it.publishedAt > (h + 48) * 3600e3) continue;
      try {
        const base = await ig('GET', `/${it.mediaId}`, { fields: 'like_count,comments_count' });
        const s = { likes: base.like_count || 0, comments: base.comments_count || 0, at: now };
        try {
          const ins = await ig('GET', `/${it.mediaId}/insights`, { metric: 'views,reach,saved,shares,total_interactions' });
          for (const m of ins.data || []) s[m.name] = m.values?.[0]?.value ?? m.total_value?.value ?? null;
        } catch (e) { s.err = String(e.message).slice(0, 120); }
        it.stats = { ...(it.stats || {}), [k]: s }; save();
      } catch (e) { log('insights', id, String(e.message).slice(0, 120)); }
    }
  }
}

function cleanup() {
  const lim = Date.now() - KEEP_DAYS * 86400e3;
  for (const f of fs.readdirSync(MEDIA)) { const p = path.join(MEDIA, f); try { if (fs.statSync(p).mtimeMs < lim) fs.unlinkSync(p); } catch {} }
  for (const [id, it] of Object.entries(state.items)) if ((it.receivedAt || 0) < Date.now() - 120 * 86400e3) delete state.items[id];
  save();
}

// ---------------- SNS司令室への知らせ（失敗・在庫切れ・トークンだけ） ----------------
function alertTo() {
  if (env.ALERT_LINE_TO) return env.ALERT_LINE_TO;
  try { return JSON.parse(fs.readFileSync(env.SNS_STATE || '/var/lib/sns/state.json', 'utf8')).owner || ''; } catch { return ''; }
}
async function alert(kind, text) {
  const to = alertTo();
  if (!ALERT_TOKEN || !to) return;
  if (Date.now() - (state.alerts[kind] || 0) < 12 * 3600e3) return;
  state.alerts[kind] = Date.now(); save();
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ALERT_TOKEN}` }, body: JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, 1000) }] }) });
    if (!r.ok) log('alert push', r.status, await r.text());
  } catch (e) { log('alert push', e); }
}

// ---------------- HTTP ----------------
function safeAuthed(req) {
  const a = Buffer.from(String(req.headers['x-secret'] || '')), b = Buffer.from(SECRET);
  return SECRET.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}
function send(res, code, body, type = 'application/json; charset=utf-8') {
  const b = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(b);
}
function readBody(req, max = 15 * 1024 * 1024) {
  return new Promise((ok, ng) => { const a = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { ng(new Error('too big')); req.destroy(); } else a.push(c); }); req.on('end', () => ok(Buffer.concat(a))); req.on('error', ng); });
}
const validFile = f => /^n\d{10,12}\d{1,2}_\d{1,2}\.jpg$/.test(f);
const validId = id => /^n\d{10,12}\d{1,2}$/.test(String(id || ''));

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname.startsWith(PREFIX) ? u.pathname.slice(PREFIX.length) : u.pathname;
    if (p === '/health') return send(res, 200, { ok: true, v: VERSION, ig: !!state.igToken && !!IG_USER_ID, paused: state.paused, queued: queued().length, next: jstStr(nextSlot()), times: times() });
    if ((req.method === 'GET' || req.method === 'HEAD') && p.startsWith('/media/')) {
      const f = p.slice(7); if (!validFile(f)) return send(res, 404, { ok: false });
      const fp = path.join(MEDIA, f); if (!fs.existsSync(fp)) return send(res, 404, { ok: false });
      const st = fs.statSync(fp); res.writeHead(200, { 'content-type': 'image/jpeg', 'content-length': st.size, 'cache-control': 'public, max-age=86400' });
      if (req.method === 'HEAD') return res.end(); return fs.createReadStream(fp).pipe(res);
    }
    if (!safeAuthed(req)) return send(res, 401, { ok: false });
    if (req.method === 'PUT' && p.startsWith('/upload/')) {
      const f = p.slice(8); if (!validFile(f)) return send(res, 400, { ok: false, error: 'bad name' });
      const buf = await readBody(req);
      if (buf[0] !== 0xff || buf[1] !== 0xd8) return send(res, 400, { ok: false, error: 'not jpeg' });
      fs.writeFileSync(path.join(MEDIA, f + '.part'), buf); fs.renameSync(path.join(MEDIA, f + '.part'), path.join(MEDIA, f));
      return send(res, 200, { ok: true, bytes: buf.length });
    }
    if (req.method === 'POST' && p === '/hook/new') {
      const b = JSON.parse((await readBody(req)).toString('utf8'));
      if (!validId(b.id) || !Array.isArray(b.slides) || !b.slides.length || !b.slides.every(f => validFile(f) && fs.existsSync(path.join(MEDIA, f)))) return send(res, 400, { ok: false, error: 'missing slides' });
      if (state.items[b.id]?.status === 'published') return send(res, 409, { ok: false, error: 'already published' });
      const cap = String(b.caption || '').slice(0, 2150);
      state.items[b.id] = { status: 'queued', receivedAt: Date.now(), slides: b.slides, caption: cap, title: b.title || [], category: b.category || '', type: b.type || '', score: Number(b.score) || 0, source: b.source || {} };
      save(); log('queued', b.id, (b.title || []).join(' '));
      return send(res, 200, { ok: true, queued: queued().length, slot: jstStr(nextSlot()) });
    }
    if (req.method === 'GET' && p === '/an/used') {
      const all = Object.values(state.items);
      return send(res, 200, { urls: all.flatMap(it => [it.source?.url, it.source?.link]).filter(Boolean), titles: all.map(it => it.source?.title).filter(Boolean) });
    }
    if (req.method === 'GET' && p === '/an/queue') {
      const now = Date.now(); const hours = Number(u.searchParams.get('hours') || 24);
      let n = 0; for (let t = nextSlot(now - 1); t < now + hours * 3600e3; t = nextSlot(t)) n++;
      return send(res, 200, { ok: true, queued: queued().length, slotsAhead: n, need: Math.max(0, n - queued().length), times: times(), paused: state.paused, next: jstStr(nextSlot()) });
    }
    if (req.method === 'GET' && p === '/an/export') {
      const days = Number(u.searchParams.get('days') || 30), lim = Date.now() - days * 86400e3;
      const items = Object.entries(state.items).filter(([, it]) => (it.publishedAt || it.receivedAt) > lim).map(([id, it]) => ({ id, status: it.status, title: it.title, category: it.category, type: it.type, score: it.score, site: it.source?.site, url: it.source?.url, receivedAt: it.receivedAt, publishedAt: it.publishedAt, permalink: it.permalink, stats: it.stats, error: it.error }));
      return send(res, 200, { ok: true, brand: BRAND, times: times(), items });
    }
    if (req.method === 'POST' && p === '/an/control') {
      const b = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      if (b.act === 'pause') state.paused = true;
      else if (b.act === 'resume') state.paused = false;
      else if (b.act === 'times' && Array.isArray(b.times) && b.times.every(s => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s))) state.postTimes = [...b.times].sort();
      else if (b.act === 'times-reset') delete state.postTimes;
      else if (b.act === 'drop' && state.items[b.id] && state.items[b.id].status === 'queued') state.items[b.id].status = 'dropped';
      else if (b.act === 'now' && state.items[b.id]) { save(); const ok = await publish(b.id); return send(res, 200, { ok, item: state.items[b.id] }); }
      else return send(res, 400, { ok: false, error: 'unknown act' });
      save(); return send(res, 200, { ok: true, paused: state.paused, times: times() });
    }
    return send(res, 404, { ok: false });
  } catch (e) { log('http', e); send(res, 500, { ok: false, error: String(e.message || e).slice(0, 200) }); }
}).listen(PORT, '127.0.0.1', () => log(`${BRAND} news server ${VERSION} on :${PORT}${PREFIX} times ${times().join(',')}`));

setInterval(() => tick().catch(e => log('tick', e)), 30e3);
setInterval(() => insights().catch(e => log('insights', e)), 60 * 60e3);
setInterval(() => refreshToken().catch(e => log('refresh', e)), 6 * 3600e3);
setInterval(cleanup, 12 * 3600e3);
setTimeout(() => { refreshToken(); insights(); cleanup(); }, 15e3);
