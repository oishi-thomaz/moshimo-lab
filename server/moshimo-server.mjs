// もしもラボ 投稿サーバー（ConoHa VPS で常駐。Node.js 18以上、外部パッケージなし）
//
// 役割
//  1. GitHub Actions から完成動画を受け取って保存し、公開URLで配信する（Instagram と LINE が取りに来る）
//  2. LINE に承認メッセージ（動画＋ボタン）を送る
//  3. 承認されたら Instagram API でリールを予約時刻に投稿し、結果を LINE に送る
//  4. Instagram の長期トークンを30日ごとに自動更新する
//
// 設定は環境変数（/etc/moshimo.env を systemd から読む）。項目は server/moshimo.env.example を参照。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const env = process.env;
const PORT = Number(env.PORT || 8787);
const PREFIX = '/moshimo';
const BASE_URL = (env.BASE_URL || '').replace(/\/$/, '');          // 例 https://example.com/moshimo
const DATA = env.DATA_DIR || '/var/lib/moshimo';
const MEDIA = path.join(DATA, 'media');
const STATE_FILE = path.join(DATA, 'state.json');
const SECRET = env.HOOK_SECRET || '';
const LINE_SECRET = env.LINE_CHANNEL_SECRET || '';
const LINE_TOKEN = env.LINE_CHANNEL_TOKEN || '';
const IG_USER_ID = env.IG_USER_ID || '';
const IG_API = 'https://graph.instagram.com/v25.0';
const POST_TIMES = (env.POST_TIMES || env.POST_TIME || '20:30').split(',').map(x => x.trim()).filter(Boolean).sort(); // 日本時間。例 12:00,20:30
const REMIND_TIMES = (env.REMIND_TIMES || '12:00,18:00').split(',').map(x => x.trim()).filter(Boolean); // 承認待ちが残ってたら再通知する時刻（日本時間）
const MAX_UPLOAD = 300 * 1024 * 1024;

fs.mkdirSync(MEDIA, { recursive: true });

// ---------------- state ----------------
let state = { owner: env.LINE_OWNER_USER_ID || '', igToken: env.IG_TOKEN || '', igTokenAt: 0, items: {} };
try { state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }; } catch {}
if (!state.igToken && env.IG_TOKEN) state.igToken = env.IG_TOKEN;
function save() { fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state, null, 2)); fs.renameSync(STATE_FILE + '.tmp', STATE_FILE); }
const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---------------- time (JST) ----------------
const JST = 9 * 3600e3;
// 投稿時刻：LINE の「投稿時間 12:00,18:00,20:30 10/28まで」で期間つきに変えられる（期間が過ぎたら POST_TIMES に戻る）
const hm2 = s => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);
function postTimesOn(dayStart) { // dayStart: その日の0時（日本時間）のUTCミリ秒
  const o = state.postTimes;
  if (o && o.times && o.times.length && (!o.until || dayStart <= o.until)) return o.times;
  return POST_TIMES;
}
function nextSlot() {
  // 次に空いている投稿枠（POST_TIMES の各時刻 × 日付）。1枠1本
  const taken = new Set(Object.values(state.items).filter(i => (i.status === 'approved' || i.status === 'publishing') && i.publishAt).map(i => i.publishAt));
  const now = Date.now();
  const j = new Date(now + JST);
  const day0 = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST;
  for (let d = 0; d < 400; d++) for (const hm of postTimesOn(day0 + d * 86400e3)) {
    const [hh, mm] = hm.split(':').map(Number);
    const t = day0 + d * 86400e3 + (hh * 60 + mm) * 60e3;
    if (t > now + 5 * 60e3 && !taken.has(t)) return t;
  }
  return now + 86400e3;
}
const fmt = t => { const d = new Date(t + JST); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

// ---------------- helpers ----------------
async function readBody(req, limit = 2e6) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw Object.assign(new Error('too large'), { code: 413 }); chunks.push(c); }
  return Buffer.concat(chunks);
}
function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'content-type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
function authed(req) {
  const got = Buffer.from(String(req.headers['x-moshimo-secret'] || ''));
  const want = Buffer.from(SECRET);
  return SECRET && got.length === want.length && crypto.timingSafeEqual(got, want);
}
const validId = id => /^\d{4}$/.test(id);
const meta = id => { try { return JSON.parse(fs.readFileSync(path.join(MEDIA, `${id}.json`), 'utf8')); } catch { return {}; } };

// ---------------- LINE ----------------
async function line(pathname, body) {
  if (!LINE_TOKEN) return log('LINE token missing');
  const r = await fetch('https://api.line.me' + pathname, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify(body) });
  if (!r.ok) log('LINE error', r.status, await r.text());
}
const push = (messages) => state.owner ? line('/v2/bot/message/push', { to: state.owner, messages: [].concat(messages) }) : log('no LINE owner yet');
const reply = (token, messages) => line('/v2/bot/message/reply', { replyToken: token, messages: [].concat(messages) });
const text = t => ({ type: 'text', text: t.slice(0, 4900) });

function buttons(id) {
  const m = meta(id);
  const title = (m.title || `動画 ${id}`).slice(0, 40);
  return {
    type: 'template', altText: `承認待ち ${id}`,
    template: {
      type: 'buttons', title, text: `承認すると ${fmt(nextSlot())} に投稿する`.slice(0, 60),
      actions: [
        { type: 'postback', label: '承認する', data: `approve:${id}`, displayText: `${id} を承認` },
        { type: 'postback', label: '今すぐ投稿', data: `now:${id}`, displayText: `${id} を今すぐ投稿` },
        { type: 'postback', label: '却下する', data: `reject:${id}`, displayText: `${id} を却下` },
      ],
    },
  };
}
function approvalMessages(id) {
  const m = meta(id);
  return [
    { type: 'video', originalContentUrl: `${BASE_URL}/media/${id}.mp4`, previewImageUrl: `${BASE_URL}/media/${id}_cover.jpg` },
    text(`【承認待ち】${id}\n${m.title || ''}\n\nキャプション：\n${m.caption || ''}\n\n${(m.hashtags || []).map(h => '#' + h).join(' ')}`),
    buttons(id),
  ];
}

async function onPostback(ev) {
  const [act, id] = String(ev.postback.data).split(':');
  const it = state.items[id];
  if (!it) return reply(ev.replyToken, text(`${id} が見つからへん`));
  if (it.status === 'published') return reply(ev.replyToken, text(`${id} はもう投稿済み：${it.permalink || ''}`));
  if (act === 'approve') { it.status = 'approved'; it.publishAt = nextSlot(); save(); return reply(ev.replyToken, text(`OK。${id} は ${fmt(it.publishAt)} に投稿する`)); }
  if (act === 'now') { it.status = 'approved'; it.publishAt = Date.now(); save(); return reply(ev.replyToken, text(`OK。${id} を今から投稿する`)); }
  if (act === 'reject') { it.status = 'rejected'; save(); return reply(ev.replyToken, text(`${id} は却下にした。直したいところがあったら Claude に伝えて`)); }
  if (act === 'retry') { it.status = 'approved'; it.publishAt = Date.now(); it.error = ''; save(); return reply(ev.replyToken, text(`${id} をもう一回投稿してみる`)); }
}

// 「投稿時間 12:00,18:00,20:30 10/28まで」「投稿時間 戻す」
function setPostTimes(msg) {
  const body = msg.replace(/^投稿時間/, '').trim();
  if (/戻す|元に|リセット/.test(body)) { delete state.postTimes; save(); return `投稿時間を ${POST_TIMES.join('、')} に戻した`; }
  const times = (body.match(/\d{1,2}:\d{2}/g) || []).map(x => x.padStart(5, '0')).filter(hm2).sort();
  if (!times.length) return `今の投稿時間：${postTimesOn(Date.now()).join('、')}\n変えるときは 投稿時間 12:00,18:00,20:30 10/28まで のように送って`;
  let until = 0; const m = body.match(/(\d{1,2})\/(\d{1,2})まで/);
  if (m) { const j = new Date(Date.now() + JST); let y = j.getUTCFullYear(); if (Number(m[1]) < j.getUTCMonth() + 1) y++; until = Date.UTC(y, Number(m[1]) - 1, Number(m[2])) - JST; }
  state.postTimes = { times, until }; save();
  return `投稿時間を ${times.join('、')} にした${until ? `（${m[1]}/${m[2]}まで。そのあとは ${POST_TIMES.join('、')} に戻る）` : ''}`;
}
// 「予約 0002 21:30」：その動画をこの時刻に投稿（今日。過ぎていたら明日）
function reserve(msg) {
  const m = msg.match(/(\d{4})\D+(\d{1,2}:\d{2})/);
  if (!m || !hm2(m[2])) return '予約 0002 21:30 のように送って';
  const [, id, hm] = m; const it = state.items[id];
  if (!it) return `${id} が見つからへん`;
  if (it.status === 'published') return `${id} はもう投稿済み`;
  const j = new Date(Date.now() + JST); const day0 = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST;
  const [hh, mm] = hm.split(':').map(Number); let t = day0 + (hh * 60 + mm) * 60e3; if (t < Date.now() + 60e3) t += 86400e3;
  it.status = 'approved'; it.publishAt = t; save();
  return `OK。${id} は ${fmt(t)} に投稿する`;
}
async function onLineWebhook(req, res) {
  const raw = await readBody(req);
  const sig = crypto.createHmac('sha256', LINE_SECRET).update(raw).digest('base64');
  if (!LINE_SECRET || sig !== req.headers['x-line-signature']) return send(res, 401, { ok: false });
  send(res, 200, { ok: true });
  const { events = [] } = JSON.parse(raw.toString('utf8'));
  for (const ev of events) {
    const uid = ev.source && ev.source.userId;
    if (!state.owner && uid && (ev.type === 'follow' || ev.type === 'message')) {
      state.owner = uid; save();
      await reply(ev.replyToken, text('このLINEを、もしもラボの承認と通知の送り先に登録した。'));
      continue;
    }
    if (uid !== state.owner) continue;                               // 持ち主以外は無視
    if (ev.type === 'postback') await onPostback(ev);
    else if (ev.type === 'message' && ev.message.type === 'text' && /^投稿時間/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(setPostTimes(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^予約/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(reserve(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /状態|ステータス/.test(ev.message.text)) {
      const rows = Object.entries(state.items).slice(-8).map(([id, i]) => `${id} ${i.status}${i.publishAt && i.status === 'approved' ? ' ' + fmt(i.publishAt) : ''}`);
      await reply(ev.replyToken, text(rows.length ? rows.join('\n') : 'まだ動画はない'));
    }
  }
}

// ---------------- Instagram ----------------
// インスタ側の一時的なエラー（500番台・通信エラー）は待ってやり直す。GET は5回、POST は retries の回数まで
async function ig(method, p, params = {}, retries = method === 'GET' ? 5 : 0) {
  for (let k = 0; ; k++) {
    try { return await igOnce(method, p, params); }
    catch (e) {
      if (k >= retries || !(e.status >= 500 || e.status === undefined)) throw e;
      log('IG retry', p, String(e.message).slice(0, 120)); await sleep(20000 * (k + 1));
    }
  }
}
async function igOnce(method, p, params = {}) {
  const url = new URL(IG_API + p);
  const opt = { method, headers: { authorization: `Bearer ${state.igToken}` } };
  if (method === 'GET') Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  else { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(params); }
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) { const e = new Error(`IG ${p}: ${r.status} ${JSON.stringify(j.error || j)}`); e.status = r.status; throw e; }
  return j;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function publish(id) {
  const it = state.items[id]; const m = meta(id);
  it.status = 'publishing'; save();
  try {
    const caption = `${m.caption || ''}\n\n${(m.hashtags || []).slice(0, 5).map(h => '#' + h).join(' ')}`.trim();
    const c = await ig('POST', `/${IG_USER_ID}/media`, { media_type: 'REELS', video_url: `${BASE_URL}/media/${id}.mp4`, caption, share_to_feed: true }, 2);
    let status = 'IN_PROGRESS';
    for (let k = 0; k < 40 && status === 'IN_PROGRESS'; k++) { await sleep(15000); status = (await ig('GET', `/${c.id}`, { fields: 'status_code' })).status_code; }
    if (status !== 'FINISHED') throw new Error(`container status ${status}`);
    // 公開：エラーでも実は公開済みのことがあるので、やり直す前にコンテナの状態（PUBLISHED）を確認して二重投稿を防ぐ
    let p = null;
    for (let k = 0; k < 3 && !p; k++) {
      try { p = await ig('POST', `/${IG_USER_ID}/media_publish`, { creation_id: c.id }); }
      catch (e) {
        if (!(e.status >= 500 || e.status === undefined)) throw e;
        await sleep(20000);
        const st = await ig('GET', `/${c.id}`, { fields: 'status_code' }).catch(() => ({}));
        if (st.status_code === 'PUBLISHED') { const list = await ig('GET', `/${IG_USER_ID}/media`, { fields: 'id', limit: 1 }); p = { id: list.data && list.data[0] && list.data[0].id }; }
        else if (k === 2) throw e;
      }
    }
    const info = await ig('GET', `/${p.id}`, { fields: 'permalink' }).catch(() => ({}));
    Object.assign(it, { status: 'published', mediaId: p.id, permalink: info.permalink || '', publishedAt: Date.now() }); save();
    log('published', id, it.permalink);
    await push(text(`投稿した：${id} ${m.title || ''}\n${it.permalink || ''}`));
  } catch (e) {
    Object.assign(it, { status: 'error', error: String(e.message || e) }); save();
    log('publish error', id, e);
    await push([text(`投稿に失敗した：${id}\n${it.error}`.slice(0, 1000)),
      { type: 'template', altText: '再投稿', template: { type: 'confirm', text: `${id} をもう一回投稿する？`, actions: [{ type: 'postback', label: 'もう一回', data: `retry:${id}` }, { type: 'postback', label: 'やめる', data: `reject:${id}` }] } }]);
  }
}

async function refreshToken() {
  if (!state.igToken) return;
  if (Date.now() - (state.igTokenAt || 0) < 30 * 86400e3) return;
  try {
    const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(state.igToken)}`);
    const j = await r.json();
    if (!j.access_token) throw new Error(JSON.stringify(j));
    state.igToken = j.access_token; state.igTokenAt = Date.now(); save();
    log('IG token refreshed');
  } catch (e) { log('token refresh failed', e); await push(text(`Instagramのトークン更新に失敗した。Claudeに伝えて：${String(e).slice(0, 300)}`)); }
}

// 承認待ちが残ってたら REMIND_TIMES に1回ずつ再通知（その時刻から15分以内のときだけ。再起動で連発しない）
async function remind() {
  const now = Date.now(), j = new Date(now + JST);
  const day = `${j.getUTCFullYear()}-${j.getUTCMonth() + 1}-${j.getUTCDate()}`;
  const day0 = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST;
  state.reminded = state.reminded || {};
  for (const hm of REMIND_TIMES) {
    const [hh, mm] = hm.split(':').map(Number);
    const t = day0 + (hh * 60 + mm) * 60e3, key = `${day} ${hm}`;
    if (now < t || now > t + 15 * 60e3 || state.reminded[key]) continue;
    state.reminded[key] = 1;
    for (const k of Object.keys(state.reminded)) if (!k.startsWith(day)) delete state.reminded[k];
    save();
    const pending = Object.entries(state.items).filter(([, it]) => it.status === 'pending').sort((a, b) => a[1].receivedAt - b[1].receivedAt);
    if (!pending.length) continue;
    const [id] = pending[0];
    await push([text(`まだ承認待ちの動画がある（${id}${pending.length > 1 ? ` ほか${pending.length - 1}本` : ''}）。今承認すると ${fmt(nextSlot())} に投稿する。`), buttons(id)]);
  }
}

let busy = false;
setInterval(async () => {
  if (busy) return; busy = true;
  try {
    for (const [id, it] of Object.entries(state.items)) if (it.status === 'approved' && it.publishAt <= Date.now()) await publish(id);
    await refreshToken();
    await remind().catch(e => log('remind failed', e));
  } finally { busy = false; }
}, 30000);
if (!state.igTokenAt && state.igToken) { state.igTokenAt = Date.now(); save(); }

// ---------------- HTTP ----------------
const TYPES = { '.mp4': 'video/mp4', '.json': 'application/json', '.jpg': 'image/jpeg' };
function serveMedia(req, res, file) {
  const p = path.join(MEDIA, file);
  if (!/^\d{4}(\.mp4|\.json|_cover\.jpg)$/.test(file) || !fs.existsSync(p)) return send(res, 404, { ok: false });
  const size = fs.statSync(p).size; const type = TYPES[path.extname(file)];
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    const start = m[1] ? Number(m[1]) : size - Number(m[2]); const end = m[1] && m[2] ? Number(m[2]) : size - 1;
    if (start >= size || end >= size || start > end) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes' });
    return fs.createReadStream(p, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(p).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname.startsWith(PREFIX) ? u.pathname.slice(PREFIX.length) : u.pathname;
    if (p === '/health') return send(res, 200, { ok: true, owner: !!state.owner, ig: !!state.igToken, items: Object.keys(state.items).length });
    if ((req.method === 'GET' || req.method === 'HEAD') && p.startsWith('/media/')) return serveMedia(req, res, p.slice(7));
    if (req.method === 'PUT' && p.startsWith('/upload/')) {
      if (!authed(req)) return send(res, 401, { ok: false });
      const file = p.slice(8);
      if (!/^\d{4}(\.mp4|\.json|_cover\.jpg)$/.test(file)) return send(res, 400, { ok: false, error: 'bad name' });
      const buf = await readBody(req, MAX_UPLOAD);
      fs.writeFileSync(path.join(MEDIA, file + '.part'), buf); fs.renameSync(path.join(MEDIA, file + '.part'), path.join(MEDIA, file));
      return send(res, 200, { ok: true, bytes: buf.length });
    }
    if (req.method === 'POST' && p === '/hook/new') {
      if (!authed(req)) return send(res, 401, { ok: false });
      const { id } = JSON.parse((await readBody(req)).toString('utf8'));
      if (!validId(id) || !fs.existsSync(path.join(MEDIA, `${id}.mp4`))) return send(res, 400, { ok: false, error: 'missing video' });
      const prev = state.items[id];
      if (prev && prev.status === 'published') return send(res, 409, { ok: false, error: 'already published' });
      state.items[id] = { status: 'pending', receivedAt: Date.now() }; save();
      await push(approvalMessages(id));
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && p === '/hook/notice') {
      if (!authed(req)) return send(res, 401, { ok: false });
      const { message } = JSON.parse((await readBody(req)).toString('utf8'));
      await push(text(String(message || '')));
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && p === '/line/webhook') return onLineWebhook(req, res);
    send(res, 404, { ok: false });
  } catch (e) {
    log('error', e);
    if (!res.headersSent) send(res, e.code === 413 ? 413 : 500, { ok: false });
  }
}).listen(PORT, '127.0.0.1', () => log(`moshimo server on 127.0.0.1:${PORT}`));
