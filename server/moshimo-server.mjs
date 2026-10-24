// もしもラボ 投稿サーバー（ConoHa VPS で常駐。Node.js 18以上、外部パッケージなし）
//
// 役割
//  1. GitHub Actions から完成動画を受け取って保存し、公開URLで配信する（Instagram と LINE が取りに来る）
//  2. LINE に承認メッセージ（動画＋ボタン）を送る
//  3. 承認されたら Instagram API でリールを予約時刻に投稿し、結果を LINE に送る
//  4. Instagram の長期トークンを30日ごとに自動更新する
//  5. 同じ動画を YouTube（ショート）にも同時に投稿する（LINE の YouTube設定 で接続したとき）
//  6. インスタ・YouTube・TikTok の数字を毎時記録し、急に伸びたら LINE に知らせる。毎朝の解析の日報を預かって LINE に送る
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
  return r.ok;
}
const push = (messages) => state.owner ? line('/v2/bot/message/push', { to: state.owner, messages: [].concat(messages) }) : log('no LINE owner yet');
const reply = (token, messages) => line('/v2/bot/message/reply', { replyToken: token, messages: [].concat(messages) });
const text = t => ({ type: 'text', text: t.slice(0, 4900) });

// 承認カード（LINE の Flex Message）。表紙・タイトル・長さ・投稿予定・質問・主な数字・ボタンを1枚にまとめる
const mmss = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
function card(id, head = '承認待ち') {
  const m = meta(id);
  const title = m.title || `動画 ${id}`;
  const len = m.duration ? mmss(Math.max(0, Number(m.duration) - 5)) : '';
  const where = state.yt?.refresh ? 'インスタ＋YouTube' : 'インスタ';
  const row = (k, v, color = '#111111') => ({ type: 'box', layout: 'horizontal', spacing: 'md', contents: [
    { type: 'text', text: String(k).slice(0, 40), size: 'sm', color: '#888888', flex: 5, wrap: true },
    { type: 'text', text: String(v).slice(0, 40), size: 'sm', color, weight: 'bold', flex: 4, align: 'end', wrap: true }] });
  const stats = (m.endStats || []).slice(0, 5).map(([k, v]) => row(k, v));
  const body = [
    { type: 'text', text: `${head}・${id}`, size: 'xs', color: '#1DB446', weight: 'bold' },
    { type: 'text', text: title, size: 'lg', weight: 'bold', wrap: true, margin: 'sm' },
    { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
      row('長さ', len || '—'), row('投稿先', where), row('承認すると', fmt(nextSlot()), '#1DB446')] },
  ];
  if (m.ask) body.push({ type: 'separator', margin: 'lg' }, { type: 'text', text: '最後の質問', size: 'xs', color: '#888888', margin: 'lg' }, { type: 'text', text: m.ask, size: 'md', weight: 'bold', wrap: true, margin: 'xs' });
  if (stats.length) body.push({ type: 'separator', margin: 'lg' }, { type: 'text', text: '動画の数字', size: 'xs', color: '#888888', margin: 'lg' }, { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'sm', contents: stats });
  return {
    type: 'flex', altText: `${head} ${id} ${title}`.slice(0, 380),
    contents: {
      type: 'bubble', size: 'mega',
      hero: { type: 'image', url: `${BASE_URL}/media/${id}_cover.jpg`, size: 'full', aspectRatio: '4:5', aspectMode: 'cover', action: { type: 'uri', uri: `${BASE_URL}/media/${id}.mp4` } },
      body: { type: 'box', layout: 'vertical', contents: body },
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
        { type: 'button', style: 'primary', color: '#1DB446', height: 'sm', action: { type: 'postback', label: '承認する', data: `approve:${id}`, displayText: `${id} を承認` } },
        { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
          { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: '今すぐ投稿', data: `now:${id}`, displayText: `${id} を今すぐ投稿` } },
          { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: '却下する', data: `reject:${id}`, displayText: `${id} を却下` } }] },
        { type: 'button', style: 'link', height: 'sm', action: { type: 'postback', label: 'キャプションを見る', data: `cap:${id}`, displayText: `${id} のキャプション` } }] },
    },
  };
}
const buttons = id => card(id);
function captionText(id) { const m = meta(id); return `${m.caption || ''}\n\n${(m.hashtags || []).map(h => '#' + h).join(' ')}`.trim(); }
// カードが LINE に弾かれたときの予備（前と同じ文字＋ボタン）
function plainApproval(id) {
  const m = meta(id);
  return [text(`【承認待ち】${id}\n${m.title || ''}\n\n${captionText(id)}`.slice(0, 4900)),
    { type: 'template', altText: `承認待ち ${id}`, template: { type: 'buttons', title: (m.title || `動画 ${id}`).slice(0, 40), text: `承認すると ${fmt(nextSlot())} に投稿する`.slice(0, 60),
      actions: [{ type: 'postback', label: '承認する', data: `approve:${id}` }, { type: 'postback', label: '今すぐ投稿', data: `now:${id}` }, { type: 'postback', label: '却下する', data: `reject:${id}` }] } }];
}
async function pushApproval(id) {
  const ok = await push(approvalMessages(id));
  if (ok === false) { log('flex card rejected, sending plain'); await push([approvalMessages(id)[0], ...plainApproval(id)]); }
}
function approvalMessages(id) {
  return [
    { type: 'video', originalContentUrl: `${BASE_URL}/media/${id}.mp4`, previewImageUrl: `${BASE_URL}/media/${id}_cover.jpg` },
    card(id),
  ];
}

// 投稿したカード（インスタとYouTubeの結果を1通にまとめる。無料プランの通数を節約）
function postedCard(id, r) {
  const m = meta(id); const title = m.title || `動画 ${id}`;
  const ok = (x) => x && x.ok;
  const allOk = ok(r.ig) && (ok(r.yt) || !r.yt);
  const head = allOk ? '投稿した' : (ok(r.ig) || ok(r.yt)) ? '一部だけ投稿できた' : '投稿に失敗した';
  const color = allOk ? '#1DB446' : '#E0453A';
  const row = (k, x) => ({ type: 'box', layout: 'horizontal', spacing: 'md', contents: [
    { type: 'text', text: k, size: 'sm', color: '#888888', flex: 4 },
    { type: 'text', text: !x ? '—' : x.ok ? '投稿済み' : x.skip ? '上げない設定' : '失敗', size: 'sm', weight: 'bold', flex: 5, align: 'end', color: !x || x.skip ? '#888888' : x.ok ? '#1DB446' : '#E0453A' }] });
  const body = [
    { type: 'text', text: `${head}・${id}`, size: 'xs', color, weight: 'bold' },
    { type: 'text', text: title, size: 'lg', weight: 'bold', wrap: true, margin: 'sm' },
    { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [row('インスタ', r.ig), row('YouTube', r.yt), { type: 'box', layout: 'horizontal', contents: [
      { type: 'text', text: '時刻', size: 'sm', color: '#888888', flex: 4 }, { type: 'text', text: fmt(Date.now()), size: 'sm', weight: 'bold', flex: 5, align: 'end' }] }] },
  ];
  const errs = [r.ig && !r.ig.ok && r.ig.error ? `インスタ：${r.ig.error}` : '', r.yt && !r.yt.ok && r.yt.error ? `YouTube：${r.yt.error}` : ''].filter(Boolean).join('\n');
  if (errs) body.push({ type: 'separator', margin: 'lg' }, { type: 'text', text: errs.slice(0, 300), size: 'xxs', color: '#E0453A', wrap: true, margin: 'md' });
  const btns = [];
  if (r.ig && r.ig.ok && r.ig.url) btns.push({ type: 'button', style: 'primary', color: '#C13584', height: 'sm', action: { type: 'uri', label: 'インスタで見る', uri: r.ig.url } });
  if (r.yt && r.yt.ok && r.yt.url) btns.push({ type: 'button', style: 'primary', color: '#E62117', height: 'sm', action: { type: 'uri', label: 'YouTubeで見る', uri: r.yt.url } });
  if (r.ig && !r.ig.ok) btns.push({ type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: 'インスタにもう一回', data: `retry:${id}`, displayText: `${id} をもう一回投稿` } });
  if (r.yt && !r.yt.ok && !r.yt.skip) btns.push({ type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
    { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: 'YouTubeもう一回', data: `ytretry:${id}`, displayText: `${id} をYouTubeにもう一回` } },
    { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: 'YouTubeはやめる', data: `ytskip:${id}`, displayText: `${id} はYouTubeに上げない` } }] });
  const bubble = { type: 'bubble', size: 'mega',
    hero: { type: 'image', url: `${BASE_URL}/media/${id}_cover.jpg`, size: 'full', aspectRatio: '4:5', aspectMode: 'cover' },
    body: { type: 'box', layout: 'vertical', contents: body } };
  if (btns.length) bubble.footer = { type: 'box', layout: 'vertical', spacing: 'sm', contents: btns };
  return { type: 'flex', altText: `${head} ${id} ${title}`.slice(0, 380), contents: bubble };
}
function postedText(id, r) {
  const m = meta(id); const l = (k, x) => !x ? '' : x.ok ? `${k}：${x.url || '投稿済み'}` : `${k}：失敗 ${x.error || ''}`;
  return text([`投稿した：${id} ${m.title || ''}`, l('インスタ', r.ig), l('YouTube', r.yt)].filter(Boolean).join('\n'));
}
async function pushPosted(id, r) {
  const failed = (r.ig && !r.ig.ok) || (r.yt && !r.yt.ok && !r.yt.skip);
  logPosted(id, r);
  if (!failed) return; // うまくいったときは送らない（次のまとめに入る）
  const ok = await push(postedCard(id, r));
  if (ok === false) { log('posted card rejected, sending text'); await push(postedText(id, r)); }
}

// ---------------- 通数の節約（LINE無料プランは月200通。返事は無料、1回の送信で吹き出し5つまで1通） ----------------
// 承認カードと「投稿した」は1件ずつ送らず、朝のまとめ（日報と同じ1通）と夕方（新着があるときだけ）にまとめて送る。
const DIGEST_EVENING = env.DIGEST_EVENING || '17:00';
const DIGEST_FALLBACK = env.DIGEST_FALLBACK || '08:30'; // 日報が来なかった日はこの時刻に承認・投稿だけ送る
const pendingIds = () => Object.entries(state.items).filter(([, it]) => it.status === 'pending').sort((a, b) => a[1].receivedAt - b[1].receivedAt).map(([id]) => id);
function approvalCarousel(ids) {
  if (!ids.length) return null;
  const bubbles = ids.slice(0, 12).map(id => card(id).contents);
  return { type: 'flex', altText: `承認待ち ${ids.length}本：${ids.slice(0, 5).join('、')}`.slice(0, 380), contents: bubbles.length === 1 ? bubbles[0] : { type: 'carousel', contents: bubbles } };
}
function postedCarousel(list) {
  if (!list.length) return null;
  const bubbles = list.slice(-12).map(x => postedCard(x.id, x.r).contents);
  return { type: 'flex', altText: `投稿した ${list.length}本`.slice(0, 380), contents: bubbles.length === 1 ? bubbles[0] : { type: 'carousel', contents: bubbles } };
}
function logPosted(id, r) { state.postedLog = [...(state.postedLog || []), { id, r, t: Date.now() }].filter(x => x.t > Date.now() - 7 * 86400e3).slice(-40); save(); }
function digestMessages() {
  const out = [];
  const pend = pendingIds(); const posted = (state.postedLog || []).filter(x => x.t > (state.digestAt || 0));
  const notes = state.notices || [];
  if (notes.length) out.push(text(notes.map(n => `・${n.m}`).join('\n').slice(0, 4800)));
  const pc = postedCarousel(posted); if (pc) out.push(pc);
  const ac = approvalCarousel(pend); if (ac) out.push(ac);
  return out;
}
function markDigest() { state.digestAt = Date.now(); state.notices = []; state.digestSeen = Object.fromEntries(pendingIds().map(id => [id, 1])); save(); }
const dayKey = (t = Date.now()) => { const j = new Date(t + JST); return `${j.getUTCFullYear()}-${j.getUTCMonth() + 1}-${j.getUTCDate()}`; };
const atToday = hm => { const j = new Date(Date.now() + JST); const [hh, mm] = hm.split(':').map(Number); return Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST + (hh * 60 + mm) * 60e3; };
async function pushDigest(extra = []) {
  const msgs = [...extra, ...digestMessages()].slice(0, 5);
  if (!msgs.length) return false;
  try { await pushChecked(msgs); }
  catch (e) { log('digest push failed', e.message); await push(text(`まとめのカードが送れへんかった。承認待ち：${pendingIds().join('、') || 'なし'}\n「承認待ち」と送るとカードで返事する`)); }
  markDigest(); return true;
}
// 朝（日報と一緒に送れなかった日）と夕方（朝より後に新しい承認待ちが届いたときだけ）
async function digestTick() {
  const now = Date.now(), dk = dayKey();
  state.digestDone = state.digestDone || {};
  if (now >= atToday(DIGEST_FALLBACK) && now < atToday(DIGEST_FALLBACK) + 3 * 3600e3 && !state.digestDone[`m:${dk}`]) {
    state.digestDone[`m:${dk}`] = 1; save();
    if (!(state.digestAt > atToday('05:00'))) await pushDigest();
  }
  if (now >= atToday(DIGEST_EVENING) && now < atToday(DIGEST_EVENING) + 3 * 3600e3 && !state.digestDone[`e:${dk}`]) {
    state.digestDone[`e:${dk}`] = 1; save();
    const fresh = pendingIds().filter(id => !(state.digestSeen || {})[id]);
    if (fresh.length) await pushDigest();
  }
  for (const k of Object.keys(state.digestDone)) if (!k.endsWith(dk)) delete state.digestDone[k];
}

async function onPostback(ev) {
  const [act, id] = String(ev.postback.data).split(':');
  const it = state.items[id];
  if (!it) return reply(ev.replyToken, text(`${id} が見つからへん`));
  if (act === 'cap') return reply(ev.replyToken, text(captionText(id) || 'キャプションがない'));
  if (act === 'ytskip') { it.yt = { ...(it.yt || {}), skipped: true }; save(); return reply(ev.replyToken, text(`${id} はYouTubeに上げへんことにした`)); }
  if (act === 'ytretry') { it.yt = {}; save(); await reply(ev.replyToken, text(`${id} をYouTubeにもう一回上げてみる`)); return youtube(id); }
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
// 「インスタトークン 〜」：解析の権限を足して作り直したトークンに差し替える
async function setIgToken(msg) {
  const tok = msg.replace(/^インスタトークン/, '').trim();
  if (tok.length < 50) return 'インスタトークン の後ろにスペースを空けてトークンを貼って送って';
  const old = state.igToken; state.igToken = tok;
  try { await igOnce('GET', `/${IG_USER_ID}`, { fields: 'username' }); }
  catch (e) { state.igToken = old; return `このトークンは使えへんかった（元のままにした）：${errMsg(e).slice(0, 200)}`; }
  state.igTokenAt = Date.now(); state.an.igIns = 'unknown'; state.an.igInsCheck = 0; save();
  let ins = '';
  try { await igOnce('GET', `/${IG_USER_ID}/insights`, { metric: 'reach', period: 'day', metric_type: 'total_value' }); ins = '再生数や保存数（インサイト）も取れる。'; }
  catch (e) { ins = isPermErr(e) ? 'ただ、インサイトの権限（instagram_business_manage_insights）が入ってない。アプリの権限に足してからトークンを作り直して' : `インサイトの確認でエラー：${errMsg(e).slice(0, 150)}`; }
  return `インスタのトークンを差し替えた。${ins}`;
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
    else if (ev.type === 'message' && ev.message.type === 'text' && /^通数$/.test(ev.message.text.trim())) {
      const g = async u => { const r = await fetch(`https://api.line.me/v2/bot/message/${u}`, { headers: { authorization: `Bearer ${LINE_TOKEN}` } }); return r.json(); };
      const [q, c] = await Promise.all([g('quota').catch(() => ({})), g('quota/consumption').catch(() => ({}))]);
      await reply(ev.replyToken, text(`今月の送信：${c.totalUsage ?? '?'}通 / ${q.value ?? '?'}通\n（返事は数えられない。まとめは朝と、新着がある日の夕方だけ）`));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(承認待ち|承認)$/.test(ev.message.text.trim())) {
      const ac = approvalCarousel(pendingIds());
      await reply(ev.replyToken, ac ? [ac] : text('承認待ちの動画はない'));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(投稿|投稿した)$/.test(ev.message.text.trim())) {
      const pc = postedCarousel((state.postedLog || []).filter(x => x.t > Date.now() - 86400e3));
      await reply(ev.replyToken, pc ? [pc] : text('この24時間に投稿した動画はない'));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^投稿時間/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(setPostTimes(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^予約/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(reserve(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(youtube|ユーチューブ)/i.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(ytCommand(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(tiktok|ティックトック)/i.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(ttCommand(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^インスタトークン/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(await setIgToken(ev.message.text.trim())));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^解析設定/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, [text('GitHub の moshimo-analytics → Settings → Secrets and variables → Actions → New repository secret\n名前：MOSHIMO_AN\n値：次の吹き出しの1行をそのまま貼る'), text(`${BASE_URL} ${state.an.key}`)]);
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(解析|数字)$/.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(anSummary()));
    }
    else if (ev.type === 'message' && ev.message.type === 'text' && /状態|ステータス/.test(ev.message.text)) {
      const yts = i => !state.yt?.refresh ? '' : i.yt?.videoId ? ' / YT済' : i.yt?.error ? ' / YT失敗' : i.ytAt ? ` / YT ${fmt(i.ytAt)}` : '';
      const rows = Object.entries(state.items).slice(-10).map(([id, i]) => `${id} ${i.status}${i.publishAt && i.status === 'approved' ? ' ' + fmt(i.publishAt) : ''}${yts(i)}`);
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
    const yr = await youtube(id, true);
    await pushPosted(id, { ig: { ok: true, url: it.permalink }, yt: yr });
  } catch (e) {
    Object.assign(it, { status: 'error', error: String(e.message || e) }); save();
    log('publish error', id, e);
    const yr = await youtube(id, true); // インスタが失敗しても YouTube は予定どおり出す
    await pushPosted(id, { ig: { ok: false, error: it.error.slice(0, 200) }, yt: yr });
  }
}

// ---------------- YouTube ----------------
// 接続：LINE で「YouTube」→ 手順。「YouTube設定 クライアントID シークレット」→ 許可のリンクが届く → 開いて許可 → 接続完了
// 投稿：インスタに投稿するのと同じタイミングで、同じ動画をショートとして公開。説明欄にキャプション、最初のコメントに質問を書く
// 過去分：接続した時点でインスタに投稿済みの動画は、2日に分けて上げる（「YouTube 0031」で1本だけすぐ上げることもできる）
const YT_SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly'; // 最後のは解析用（視聴維持率など）
const YT_TIMES = ['09:00', '11:00', '14:00', '16:00', '19:30', '22:30']; // 過去分を上げる時刻（インスタの投稿時刻とずらす）
const ytRedirect = () => `${BASE_URL}/yt/callback`;
let ytAccess = { token: '', exp: 0 };
async function ytToken() {
  if (ytAccess.token && Date.now() < ytAccess.exp - 60e3) return ytAccess.token;
  const y = state.yt || {};
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: y.clientId, client_secret: y.clientSecret, refresh_token: y.refresh, grant_type: 'refresh_token' }) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) { const e = new Error(`YouTubeのログインが切れた：${JSON.stringify(j).slice(0, 200)}`); e.auth = true; throw e; }
  ytAccess = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return ytAccess.token;
}
async function yt(method, url, body, headers = {}) {
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${await ytToken()}`, ...headers }, body });
  if (!r.ok) { const e = new Error(`YouTube ${r.status}: ${(await r.text()).slice(0, 300)}`); e.status = r.status; throw e; }
  return r;
}
function ytAuthUrl() {
  state.yt.oauthState = crypto.randomBytes(16).toString('hex'); save();
  const q = new URLSearchParams({ client_id: state.yt.clientId, redirect_uri: ytRedirect(), response_type: 'code', scope: YT_SCOPE, access_type: 'offline', prompt: 'select_account consent', state: state.yt.oauthState });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
function ytCommand(msg) {
  const parts = msg.split(/\s+/).filter(Boolean);
  const idArg = (msg.match(/(?:^|\s)(\d{4})(?:\s|$)/) || [])[1];
  if (/再接続/.test(msg)) {
    if (!state.yt?.clientId) return 'まだYouTubeの設定がない。YouTube と送ると手順が出る';
    return `解析用の権限（視聴維持率・登録者の増減）を足すために、もう一回許可して。Google Cloud で YouTube Analytics API を有効にしてから開いてな。\n今の投稿はそのまま続く。\n\n${ytAuthUrl()}`;
  }
  if (/設定/.test(msg)) {
    const [cid, sec] = parts.slice(1).filter(x => !/設定/.test(x));
    if (!cid || !sec || !/apps\.googleusercontent\.com$/.test(cid)) return 'YouTube設定 クライアントID シークレット の形で送って（間はスペース）';
    state.yt = { ...(state.yt || {}), clientId: cid, clientSecret: sec, refresh: '' }; save();
    return `次のリンクを開いて、もしもラボのチャンネルを持ってるGoogleアカウントで許可して。チャンネルを選ぶ画面が出たら、もしもラボのチャンネルを選ぶ。\n確認されていないアプリと出たら、詳細 → 移動 で進めてOK（自分で作ったアプリやから大丈夫）。\n\n${ytAuthUrl()}`;
  }
  if (idArg) {
    if (!state.yt?.refresh) return 'まだYouTubeにつながってない。YouTube と送ると手順が出る';
    if (!fs.existsSync(path.join(MEDIA, `${idArg}.mp4`))) return `${idArg} の動画ファイルがVPSにない`;
    if (!state.items[idArg]) state.items[idArg] = { status: 'manual', receivedAt: Date.now() };
    const it = state.items[idArg];
    if (it.yt?.videoId) return `${idArg} はもうYouTubeに上げてある：https://youtube.com/shorts/${it.yt.videoId}`;
    it.yt = {}; it.ytAt = Date.now(); save();
    return `${idArg} を今からYouTubeに上げる`;
  }
  if (state.yt?.refresh) return `YouTubeは接続済み（${state.yt.channel || 'チャンネル'}）。インスタと同じタイミングで投稿してる。\n1本だけ上げたいときは YouTube 0031 のように送って`;
  return `YouTubeの接続で使うリダイレクトURI：\n${ytRedirect()}\n\nGoogle Cloud でOAuthクライアントID（ウェブアプリケーション）を作るときに、承認済みのリダイレクトURIにこれを入れて。できたら このLINEに\nYouTube設定 クライアントID シークレット\nと送る`;
}
async function ytCallback(u, res) {
  const html = t => send(res, 200, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:24px;font-size:18px">${t}</body>`, 'text/html; charset=utf-8');
  const y = state.yt || {};
  if (!y.clientId || !y.oauthState || !u.searchParams.get('code') || u.searchParams.get('state') !== y.oauthState) return html('リンクが古いか、まだ設定されてない。LINEで YouTube設定 からやり直して。');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: u.searchParams.get('code'), client_id: y.clientId, client_secret: y.clientSecret, redirect_uri: ytRedirect(), grant_type: 'authorization_code' }) });
  const j = await r.json().catch(() => ({}));
  if (!j.refresh_token) { log('yt auth failed', j); return html('接続に失敗した。LINEで YouTube設定 からやり直して。'); }
  state.yt.refresh = j.refresh_token; state.yt.scopeV2 = /yt-analytics/.test(j.scope || YT_SCOPE); delete state.yt.oauthState; ytAccess = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; save();
  try { const c = await (await yt('GET', 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true')).json(); state.yt.channel = c.items?.[0]?.snippet?.title || ''; save(); } catch (e) { log('yt channel', e); }
  const n = scheduleBackfill();
  await push(text(`YouTubeにつながった（${state.yt.channel || 'チャンネル名は取れなかった'}）。これからはインスタと同時にYouTubeにも投稿する。${n ? `\nインスタに投稿済みの${n.count}本は ${n.from}〜${n.to} に2日に分けて上げる。` : ''}`));
  return html(`YouTubeにつながった（${state.yt.channel || ''}）。LINEに戻ってOK。`);
}
// インスタに投稿済みでまだYouTubeにない動画を、YT_TIMES の時刻に2日に分けて並べる
function scheduleBackfill() {
  const ids = Object.entries(state.items).filter(([id, i]) => i.status === 'published' && !i.yt?.videoId && !i.ytAt && fs.existsSync(path.join(MEDIA, `${id}.mp4`)))
    .sort((a, b) => (a[1].publishedAt || 0) - (b[1].publishedAt || 0)).map(([id]) => id);
  if (!ids.length) return null;
  const per = Math.ceil(ids.length / 2);
  const now = Date.now(); const j = new Date(now + JST);
  const day0 = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST;
  const daySlots = d => YT_TIMES.map(hm => { const [hh, mm] = hm.split(':').map(Number); return day0 + d * 86400e3 + (hh * 60 + mm) * 60e3; }).filter(t => t > now + 10 * 60e3);
  let d = daySlots(0).length >= Math.min(per, 4) ? 0 : 1; // 今日の枠が少なければ明日から
  const slots = [];
  while (slots.length < ids.length && d < 10) {
    const ds = daySlots(d); const take = Math.min(per, ids.length - slots.length);
    // 1日の枠より本数が多いときは、枠の間に30分ずらして詰める
    for (let k = 0; k < take; k++) slots.push(ds[k % ds.length] + Math.floor(k / ds.length) * 30 * 60e3);
    d++;
  }
  ids.forEach((id, k) => { state.items[id].ytAt = slots[k]; });
  save();
  return { count: ids.length, from: fmt(slots[0]), to: fmt(slots[ids.length - 1]) };
}
function ytMeta(m) {
  // タイトル：問いかけのタイトル（続きが気になる形）＋ショートの発見に効くタグ。100字以内
  const title = `${m.ytTitle || m.title || 'もしもラボ'} #shorts #雑学`.slice(0, 100);
  // 説明欄：1行目にコメントを呼ぶ質問、その下にキャプション（数字と出典）、最後にタグ（先頭3つがタイトルの上に出る）
  const head = m.ask ? `${m.ask} コメントで教えて👇\n\n` : '';
  const tagLine = [...new Set(['もしもラボ', 'shorts', ...(m.hashtags || [])])].slice(0, 8).map(h => '#' + h).join(' ');
  const desc = `${head}${String(m.caption || '').replace(/[<>]/g, '')}\n\n${tagLine}`.slice(0, 4900);
  const tags = [...new Set(['もしもラボ', ...(m.hashtags || []), 'もしも', '雑学', 'shorts'])].slice(0, 15);
  return { title, desc, tags };
}
async function youtube(id, quiet = false) {
  const it = state.items[id];
  if (!it || !state.yt?.refresh) return undefined;
  if (it.yt?.videoId) return { ok: true, url: `https://youtube.com/shorts/${it.yt.videoId}` };
  if (it.yt?.skipped) return { skip: true };
  if (it.yt?.uploading) return undefined;
  const done = async (r) => { if (!quiet) await pushPosted(id, { yt: r }); return r; };
  const file = path.join(MEDIA, `${id}.mp4`);
  if (!fs.existsSync(file)) { it.yt = { error: '動画ファイルがVPSにない' }; delete it.ytAt; save(); return done({ ok: false, error: '動画ファイルがVPSにない' }); }
  const m = meta(id); const { title, desc, tags } = ytMeta(m);
  it.yt = { uploading: true }; delete it.ytAt; save();
  try {
    const buf = fs.readFileSync(file);
    let videoId = '';
    for (let k = 0; k < 3 && !videoId; k++) {
      try {
        const init = await yt('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          JSON.stringify({ snippet: { title, description: desc, tags, categoryId: '27', defaultLanguage: 'ja', defaultAudioLanguage: 'ja' }, status: { privacyStatus: 'public', selfDeclaredMadeForKids: false, embeddable: true } }),
          { 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-type': 'video/mp4', 'x-upload-content-length': String(buf.length) });
        const up = await yt('PUT', init.headers.get('location'), buf, { 'content-type': 'video/mp4' });
        videoId = (await up.json()).id;
      } catch (e) { if (e.auth || !(e.status >= 500 || e.status === undefined) || k === 2) throw e; log('yt retry', id, e.message); await sleep(30000 * (k + 1)); }
    }
    it.yt = { videoId, at: Date.now() }; save();
    log('youtube', id, videoId);
    if (m.ask) await yt('POST', 'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', JSON.stringify({ snippet: { videoId, topLevelComment: { snippet: { textOriginal: `${m.ask} コメントで教えて！` } } } }), { 'content-type': 'application/json' }).catch(e => log('yt comment', e.message));
    return done({ ok: true, url: `https://youtube.com/shorts/${videoId}` });
  } catch (e) {
    it.yt = { error: String(e.message || e).slice(0, 500) }; save();
    log('youtube error', id, e);
    return done({ ok: false, error: it.yt.error.slice(0, 200) });
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
    void id; // 催促はやめた（朝・夕方のまとめで代わりにする）
  }
}

// ---------------- 解析（3媒体の数字を1時間ごとに記録） ----------------
// インスタ・YouTube・TikTok のフォロワーと動画ごとの再生などを毎時5分に取って metrics.jsonl に1行ずつ貯める。
// 急に伸びた動画はすぐ LINE に知らせる。毎朝の解析（Claude）は非公開リポジトリの GitHub Actions 経由で
// /an/export を取りに来て、日報を /an/report で預ける（指定の時刻に LINE へ送る）。
const MET_FILE = path.join(DATA, 'metrics.jsonl');
const TT_USER = (env.TT_USERNAME || 'moshimo__lab').replace(/^@/, '');
const TT_SCOPE = 'user.info.basic,user.info.stats,video.list';
state.an = state.an || {};
if (!state.an.key) state.an.key = crypto.randomBytes(24).toString('hex');
const ymd = t => new Date(t + JST).toISOString().slice(0, 10);
const jstHour = t => new Date(t + JST).getUTCHours();
const dayStart = t => { const j = new Date(t + JST); return Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()) - JST; };
const num = v => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? null : Number(v));
const isPermErr = e => /\(#10\)|\(#200\)|permission|OAuthException|"code":190|"code":10,|"code":200/i.test(String(e && e.message));
const errMsg = e => String((e && e.message) || e).slice(0, 300);
async function timed(p, ms = 60000) { return Promise.race([p, sleep(ms).then(() => { throw new Error('timeout'); })]); }

// --- Instagram ---
const IG_MEDIA_METRICS = ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'ig_reels_avg_watch_time', 'ig_reels_video_view_total_time', 'reels_skip_rate'];
const insVal = d => (d ? (d.values && d.values[0] ? d.values[0].value : d.total_value ? d.total_value.value : null) : null);
async function igMediaInsights(id) {
  try {
    const j = await igOnce('GET', `/${id}/insights`, { metric: IG_MEDIA_METRICS.join(',') });
    return Object.fromEntries((j.data || []).map(d => [d.name, insVal(d)]));
  } catch (e) {
    if (isPermErr(e) && !/metric/i.test(e.message)) throw e;
    // 開発中の指標がまとめて取るとエラーになることがあるので、1つずつ取り直す
    const out = {};
    for (const m of IG_MEDIA_METRICS) {
      try { const j = await igOnce('GET', `/${id}/insights`, { metric: m }); if (j.data && j.data[0]) out[m] = insVal(j.data[0]); } catch (e2) { if (isPermErr(e2) && !/metric/i.test(e2.message)) throw e2; }
    }
    return out;
  }
}
async function collectIG(now) {
  if (!state.igToken || !IG_USER_ID) return { error: 'インスタ未設定' };
  const out = { media: {} };
  const me = await igOnce('GET', `/${IG_USER_ID}`, { fields: 'username,followers_count,follows_count,media_count' });
  Object.assign(out, { followers: num(me.followers_count), follows: num(me.follows_count), posts: num(me.media_count) });
  const list = await igOnce('GET', `/${IG_USER_ID}/media`, { fields: 'id,caption,timestamp,permalink,like_count,comments_count,media_product_type', limit: 50 });
  const ourIds = Object.fromEntries(Object.entries(state.items).filter(([, i]) => i.mediaId).map(([id, i]) => [i.mediaId, id]));
  let insightsOk = state.an.igIns !== 'no_permission' || now - (state.an.igInsCheck || 0) > 6 * 3600e3; // 権限なしでも6時間ごとに再確認
  state.an.igInsCheck = now;
  for (const m of list.data || []) {
    const t = Date.parse(m.timestamp);
    const rec = { t, id: ourIds[m.id] || null, likes: num(m.like_count), comments: num(m.comments_count), type: m.media_product_type || '', cap: String(m.caption || '').split('\n')[0].slice(0, 40) };
    // 2週間以内の投稿は毎時、それより古いものは6時間ごとに中身の数字（再生・保存・シェア・視聴時間）も取る
    if (insightsOk && (now - t < 14 * 86400e3 || jstHour(now) % 6 === 5)) {
      try { Object.assign(rec, await igMediaInsights(m.id)); state.an.igIns = 'ok'; }
      catch (e) { if (isPermErr(e)) { state.an.igIns = 'no_permission'; insightsOk = false; } else rec.insErr = errMsg(e).slice(0, 120); }
    }
    out.media[m.id] = rec;
  }
  out.insights = state.an.igIns || 'unknown';
  return out;
}
// アカウント全体の1日分（インスタの集計は最大48時間遅れるので、前日と前々日を毎朝取り直す）
const IG_ACCT_METRICS = ['views', 'reach', 'accounts_engaged', 'total_interactions', 'likes', 'comments', 'shares', 'saves', 'follows_and_unfollows', 'profile_links_taps'];
async function igAccountDay(d0) {
  const p = { metric_type: 'total_value', period: 'day', since: Math.floor(d0 / 1000), until: Math.floor((d0 + 86400e3) / 1000) - 1 };
  const out = {};
  try {
    const j = await igOnce('GET', `/${IG_USER_ID}/insights`, { ...p, metric: IG_ACCT_METRICS.join(',') });
    for (const d of j.data || []) out[d.name] = insVal(d);
  } catch (e) {
    if (isPermErr(e) && !/metric/i.test(e.message)) throw e;
    for (const m of IG_ACCT_METRICS) { try { const j = await igOnce('GET', `/${IG_USER_ID}/insights`, { ...p, metric: m }); if (j.data && j.data[0]) out[m] = insVal(j.data[0]); } catch {} }
  }
  return out;
}

// --- YouTube ---
const ytJson = async (url) => (await yt('GET', url)).json();
async function collectYT() {
  if (!state.yt || !state.yt.refresh) return { error: 'YouTube未接続' };
  const ch = await ytJson('https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&mine=true');
  const c = ch.items && ch.items[0];
  if (!c) return { error: 'チャンネルが見つからない' };
  const out = { subs: num(c.statistics.subscriberCount), views: num(c.statistics.viewCount), videos: num(c.statistics.videoCount), media: {} };
  const upl = c.contentDetails && c.contentDetails.relatedPlaylists && c.contentDetails.relatedPlaylists.uploads;
  if (!upl) return out;
  const pl = await ytJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${upl}`);
  const ids = (pl.items || []).map(i => i.contentDetails.videoId).filter(Boolean);
  if (!ids.length) return out;
  const vs = await ytJson(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,status&id=${ids.join(',')}`);
  const ourIds = Object.fromEntries(Object.entries(state.items).filter(([, i]) => i.yt && i.yt.videoId).map(([id, i]) => [i.yt.videoId, id]));
  for (const v of vs.items || []) {
    if (v.status && v.status.privacyStatus !== 'public') continue;
    out.media[v.id] = { t: Date.parse(v.snippet.publishedAt), id: ourIds[v.id] || null, views: num(v.statistics.viewCount), likes: num(v.statistics.likeCount), comments: num(v.statistics.commentCount), cap: String(v.snippet.title || '').slice(0, 40) };
  }
  return out;
}
// YouTube アナリティクス（視聴維持率・登録者の増減。2〜3日遅れて確定する）
async function ytAnalytics() {
  const end = ymd(Date.now() - 86400e3), start = ymd(Date.now() - 28 * 86400e3), start7 = ymd(Date.now() - 7 * 86400e3);
  const base = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&endDate=${end}`;
  const rows = j => (j.rows || []).map(r => Object.fromEntries((j.columnHeaders || []).map((h, k) => [h.name, r[k]])));
  const days = rows(await ytJson(`${base}&startDate=${start}&dimensions=day&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares`));
  const videos = rows(await ytJson(`${base}&startDate=${start7}&dimensions=video&sort=-views&maxResults=25&metrics=views,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares`));
  return { days, videos7d: videos, at: Date.now() };
}

// --- TikTok ---
// 接続：LINE で「TikTok」→ 手順。「TikTok設定 クライアントキー シークレット」→ 許可のリンク → 開いて許可 → 接続完了
// 接続していない間は、プロフィールの埋め込み用ページからフォロワー数と動画ごとの再生数を取る
const ttRedirect = () => `${BASE_URL}/tt/callback`;
let ttAccess = { token: '', exp: 0 };
async function ttTokenReq(params) {
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: state.tt.clientKey, client_secret: state.tt.clientSecret, ...params }) });
  return r.json().catch(() => ({}));
}
async function ttToken() {
  if (ttAccess.token && Date.now() < ttAccess.exp - 60e3) return ttAccess.token;
  const j = await ttTokenReq({ grant_type: 'refresh_token', refresh_token: state.tt.refresh });
  if (!j.access_token) { const e = new Error(`TikTokのログインが切れた：${JSON.stringify(j).slice(0, 200)}`); e.auth = true; throw e; }
  ttAccess = { token: j.access_token, exp: Date.now() + (j.expires_in || 86400) * 1000 };
  if (j.refresh_token && j.refresh_token !== state.tt.refresh) { state.tt.refresh = j.refresh_token; save(); }
  return ttAccess.token;
}
async function ttApi(method, url, body) {
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${await ttToken()}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j.error && j.error.code && j.error.code !== 'ok')) throw new Error(`TikTok ${r.status}: ${JSON.stringify(j.error || j).slice(0, 200)}`);
  return j.data || {};
}
async function collectTT() {
  if (state.tt && state.tt.refresh) {
    const u = (await ttApi('GET', 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,follower_count,following_count,likes_count,video_count')).user || {};
    const out = { src: 'api', followers: num(u.follower_count), follows: num(u.following_count), hearts: num(u.likes_count), videos: num(u.video_count), media: {} };
    let cursor = 0;
    for (let page = 0; page < 3; page++) {
      const d = await ttApi('POST', 'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,view_count,like_count,comment_count,share_count,duration', { max_count: 20, ...(cursor ? { cursor } : {}) });
      for (const v of d.videos || []) out.media[v.id] = { t: num(v.create_time) * 1000, id: null, views: num(v.view_count), likes: num(v.like_count), comments: num(v.comment_count), shares: num(v.share_count), dur: num(v.duration), cap: String(v.title || v.video_description || '').split('\n')[0].slice(0, 40) };
      if (!d.has_more || !d.cursor) break; cursor = d.cursor;
    }
    return out;
  }
  // 公式APIは法人の審査が要るので、プロフィールの埋め込み用ページ（公開）から読む。動画ごとの再生数とフォロワー数が取れる（大きい数は丸められている）
  return ttEmbed();
}
async function ttEmbed() {
  const r = await fetch(`https://www.tiktok.com/embed/@${TT_USER}`, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'accept-language': 'ja,en;q=0.8' } });
  const html = await r.text();
  const m = html.match(/<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return { src: 'embed', error: `埋め込みページが読めない（${r.status}）` };
  const vids = []; let u = null;
  const walk = o => { if (!o || typeof o !== 'object') return; if (o.id && /^\d{15,}$/.test(String(o.id)) && o.playCount != null) vids.push(o); if (o.followerCount != null && o.uniqueId) u = o; for (const v of Object.values(o)) walk(v); };
  walk(JSON.parse(m[1]));
  if (!u && !vids.length) return { src: 'embed', error: '埋め込みページに数字がない' };
  const out = { src: 'embed', followers: u ? num(u.followerCount) : null, follows: u ? num(u.followingCount) : null, hearts: u ? num(u.heartCount) : null, media: {} };
  for (const v of vids) if (!v.privateItem) out.media[v.id] = { t: Number(BigInt(v.id) >> 32n) * 1000, id: null, views: num(v.playCount), cap: String(v.desc || '').split('\n').join(' ').slice(0, 300) };
  return out;
}
function ttCommand(msg) {
  const parts = msg.split(/\s+/).filter(Boolean);
  if (/設定/.test(msg)) {
    const [key, sec] = parts.slice(1).filter(x => !/設定/.test(x));
    if (!key || !sec) return 'TikTok設定 クライアントキー シークレット の形で送って（間はスペース）';
    state.tt = { ...(state.tt || {}), clientKey: key, clientSecret: sec, refresh: '', oauthState: crypto.randomBytes(16).toString('hex') }; save();
    const q = new URLSearchParams({ client_key: key, scope: TT_SCOPE, response_type: 'code', redirect_uri: ttRedirect(), state: state.tt.oauthState });
    return `次のリンクを開いて、もしもラボのTikTokアカウント（@${TT_USER}）でログインして許可して。\n\nhttps://www.tiktok.com/v2/auth/authorize/?${q}`;
  }
  if (state.tt && state.tt.refresh) return `TikTokは接続済み（${state.tt.name || TT_USER}）。動画ごとの再生数まで取ってる`;
  return `TikTokの接続で使うリダイレクトURI：\n${ttRedirect()}\n\nTikTok for Developers でアプリを作るときに Login Kit のリダイレクトURIにこれを入れて。できたら このLINEに\nTikTok設定 クライアントキー シークレット\nと送る`;
}
async function ttCallback(u, res) {
  const html = t => send(res, 200, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:24px;font-size:18px">${t}</body>`, 'text/html; charset=utf-8');
  const t = state.tt || {};
  if (!t.clientKey || !t.oauthState || !u.searchParams.get('code') || u.searchParams.get('state') !== t.oauthState) return html('リンクが古いか、まだ設定されてない。LINEで TikTok設定 からやり直して。');
  const j = await ttTokenReq({ code: u.searchParams.get('code'), grant_type: 'authorization_code', redirect_uri: ttRedirect() });
  if (!j.refresh_token) { log('tt auth failed', j); return html(`接続に失敗した（${String(j.error_description || j.error || '').slice(0, 100)}）。LINEで TikTok設定 からやり直して。`); }
  state.tt.refresh = j.refresh_token; delete state.tt.oauthState; ttAccess = { token: j.access_token, exp: Date.now() + (j.expires_in || 86400) * 1000 }; save();
  try { const d = await ttApi('GET', 'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count'); state.tt.name = (d.user && d.user.display_name) || ''; save(); } catch (e) { log('tt user', e.message); }
  await push(text(`TikTokにつながった（${state.tt.name || TT_USER}）。これからは動画ごとの再生数も毎時取る。`));
  return html('TikTokにつながった。LINEに戻ってOK。');
}

// --- 毎時の記録とバズ検知 ---
async function lineQuota() {
  if (!LINE_TOKEN) return null;
  const get = async p => (await fetch('https://api.line.me' + p, { headers: { authorization: `Bearer ${LINE_TOKEN}` } })).json().catch(() => ({}));
  const [q, c] = await Promise.all([get('/v2/bot/message/quota'), get('/v2/bot/message/quota/consumption')]);
  return { type: q.type || '', limit: q.value == null ? null : q.value, used: c.totalUsage == null ? null : c.totalUsage };
}
const PLAT = { ig: 'インスタ', yt: 'YouTube', tt: 'TikTok' };
const viewsOf = r => (r ? (r.views != null ? r.views : null) : null);
const median = a => { const s = a.filter(x => x > 0).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const kfmt = n => (n == null ? '-' : n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万` : n.toLocaleString('ja-JP'));
// 通知に出すのは短いタイトルだけ。TikTok は手動投稿で番号がないので、キャプションとタイトル・ハッシュタグの重なりで回を当てる
const bigr = s => { const t = String(s || '').replace(/#\S+/g, '').replace(/[\s　？?！!、。,.「」『』…・〜~]/g, '').replace(/^もしも/, ''); const b = new Set(); for (let i = 0; i < t.length - 1; i++) b.add(t.slice(i, i + 2)); return b; };
const GENERIC_TAGS = /^(もしもラボ|もしも|雑学|shorts|もしもシリーズ|シミュレーション)$/;
function titleOf(p, mid, r) {
  let id = r && r.id;
  if (!id && r && r.cap) {
    const head = bigr(String(r.cap).split('#')[0].slice(0, 80)); let best = null, bs = 0;
    const freq = {}; for (const iid of Object.keys(state.items)) for (const h of new Set(meta(iid).hashtags || [])) freq[h] = (freq[h] || 0) + 1;
    for (const iid of Object.keys(state.items)) {
      const m = meta(iid); const tb = bigr(m.title); if (tb.size < 3) continue;
      let n = 0; for (const g of tb) if (head.has(g)) n++;
      const sc = n / tb.size + (m.hashtags || []).filter(h => !GENERIC_TAGS.test(h) && freq[h] === 1 && String(r.cap).includes('#' + h)).length * 0.5; // その回にしかないタグが入っていれば強い手がかり
      if (sc > bs) { bs = sc; best = iid; }
    }
    if (bs >= 0.45) id = best;
  }
  if (id && meta(id).title) return meta(id).title.replace(/^もしも/, '');
  return String((r && r.cap) || mid).split(/[…？?！!。\n#]/)[0].replace(/^もしも/, '').slice(0, 24);
}
// ---- LINE の見やすいカード（Flex Message） ----
const PCOL = { ig: '#D6246E', yt: '#E52D27', tt: '#111111' };
const tag = (label, color) => ({ type: 'box', layout: 'vertical', flex: 0, width: '64px', backgroundColor: color, cornerRadius: '4px', paddingAll: '3px', contents: [{ type: 'text', text: label, size: 'xxs', color: '#ffffff', align: 'center', weight: 'bold' }] });
const nz = (v, d = '-') => { const t = String(v ?? '').trim(); return t || d; };
const deltaColor = v => (/^\+/.test(String(v)) ? '#0A7D3C' : /^[-−▲]/.test(String(v)) ? '#C62828' : '#666666');
function bubble(title, subtitle, bodyContents, foot) {
  const b = { type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#1F2937', paddingAll: '14px', contents: [{ type: 'text', text: title, color: '#ffffff', weight: 'bold', size: 'lg', wrap: true }, ...(subtitle ? [{ type: 'text', text: subtitle, color: '#CBD5E1', size: 'xs', wrap: true }] : [])] },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'md', contents: bodyContents } };
  if (foot) b.footer = { type: 'box', layout: 'vertical', paddingAll: '10px', contents: [{ type: 'text', text: foot, size: 'xxs', color: '#999999', align: 'center', wrap: true }] };
  return b;
}
function flexAlert(alerts, now) {
  const rows = [];
  alerts.slice(0, 12).forEach((a, i) => {
    if (i) rows.push({ type: 'separator' });
    const value = a.kind === 'followers' ? `+${a.gain}人/時` : a.kind === 'milestone' ? `${kfmt(a.ms)}突破` : `+${kfmt(a.gain)}/時`;
    const main = a.kind === 'followers' ? 'フォロワー' : a.title;
    const sub = a.kind === 'followers' ? `今 ${kfmt(a.total)}人` : `累計 ${kfmt(a.total)}再生${a.kind === 'velocity' ? (a.accel ? `・直前の${a.accel}倍に加速` : a.ageH != null && a.ageH <= 12 ? `・投稿${a.ageH}時間` : '') : ''}`;
    rows.push({ type: 'box', layout: 'vertical', spacing: 'xs', contents: [
      { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [tag(PLAT[a.p], PCOL[a.p]), { type: 'text', text: value, weight: 'bold', size: 'md', color: '#0A7D3C', align: 'end' }] },
      { type: 'text', text: nz(main), size: 'sm', weight: 'bold', wrap: true, color: '#111111' },
      { type: 'text', text: sub, size: 'xs', color: '#888888' }] });
  });
  return { type: 'flex', altText: `バズりだした：${alerts.map(a => a.kind === 'followers' ? `${PLAT[a.p]}フォロワー` : a.title).join('、')}`.slice(0, 390), contents: bubble('🔥 バズりだした', `${fmt(now)} 時点・直近1時間`, rows, '次の手は解析のときにClaudeが打つ') };
}
// 日報カード：{ title, subtitle, sections: [{ head, rows: [{ label, value, delta, sub, tag }] } | { head, text } | { head, items: [..] }], foot }
const TAGC = { インスタ: PCOL.ig, YouTube: PCOL.yt, TikTok: PCOL.tt };
function flexReport(card) {
  const secs = [];
  (card.sections || []).slice(0, 12).forEach((sec, i) => {
    if (i) secs.push({ type: 'separator' });
    const c = sec.head ? [{ type: 'text', text: nz(sec.head), size: 'xs', color: '#6B7280', weight: 'bold' }] : [];
    for (const r of (sec.rows || []).slice(0, 12)) {
      const left = r.tag ? [tag(nz(r.tag), TAGC[r.tag] || '#4B5563'), { type: 'text', text: nz(r.label), size: 'sm', wrap: true, flex: 5, margin: 'sm', color: '#111111' }]
        : [{ type: 'text', text: nz(r.label), size: 'sm', wrap: true, flex: 5, color: '#111111' }];
      c.push({ type: 'box', layout: 'horizontal', alignItems: 'center', contents: [...left,
        { type: 'text', text: nz(r.value), size: 'sm', weight: 'bold', align: 'end', flex: 3, color: '#111111' },
        ...(r.delta != null && r.delta !== '' ? [{ type: 'text', text: String(r.delta), size: 'xs', align: 'end', flex: 2, color: deltaColor(r.delta) }] : [])] });
      if (r.sub) c.push({ type: 'text', text: String(r.sub), size: 'xxs', color: '#888888', wrap: true });
    }
    if (sec.text) c.push({ type: 'text', text: String(sec.text).slice(0, 1500), size: 'sm', wrap: true, color: '#111111' });
    for (const it of (sec.items || []).slice(0, 10)) c.push({ type: 'text', text: `・${it}`.slice(0, 600), size: 'sm', wrap: true, color: '#111111' });
    if (c.length) secs.push({ type: 'box', layout: 'vertical', spacing: 'sm', contents: c }); else if (secs.length) secs.pop();
  });
  return { type: 'flex', altText: String(card.title || '日報').slice(0, 390), contents: bubble(nz(card.title, '日報'), card.subtitle ? String(card.subtitle) : '', secs.length ? secs : [{ type: 'text', text: '-', size: 'sm' }], card.foot ? String(card.foot) : '') };
}
async function pushReport(r) {
  // 日報と一緒に、前回のまとめ以降に投稿した分と承認待ちを同じ1通で送る
  const dg = digestMessages();
  if (r.card) { try { await pushChecked([flexReport(r.card), ...dg].slice(0, 5)); markDigest(); return; } catch (e) { log('flex report failed', e.message); } }
  const body = splitLine(r.message || (r.card && JSON.stringify(r.card)) || '');
  try { await pushChecked([...body.slice(0, 5 - Math.min(dg.length, 3)), ...dg.slice(0, 3)].slice(0, 5)); markDigest(); }
  catch (e) { log('report+digest failed', e.message); await push(body); }
}
async function pushChecked(msg) {
  if (!state.owner || !LINE_TOKEN) throw new Error('no owner/token');
  const res = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify({ to: state.owner, messages: [].concat(msg) }) });
  if (!res.ok) throw new Error(`LINE ${res.status} ${(await res.text()).slice(0, 300)}`);
}
async function detectBuzz(snap) {
  const prev = state.an.prev; const now = snap.t;
  const cur = { t: now, v: {}, f: {} };
  for (const p of ['ig', 'yt', 'tt']) {
    const s = snap[p] || {};
    cur.f[p] = s.followers != null ? s.followers : s.subs != null ? s.subs : null;
    cur.v[p] = Object.fromEntries(Object.entries(s.media || {}).map(([k, r]) => [k, viewsOf(r)]).filter(([, v]) => v != null));
  }
  // 前回の数字がない動画（取れなかった時間など）は前回の値を引き継ぐ
  if (prev) for (const p of ['ig', 'yt', 'tt']) { for (const [k, v] of Object.entries(prev.v[p] || {})) if (cur.v[p][k] == null && snap[p] && !snap[p].error) cur.v[p][k] = v; if (cur.f[p] == null) cur.f[p] = prev.f[p]; }
  state.an.prev = cur;
  if (!prev || now - prev.t > 3 * 3600e3) return;
  // バズりだした の判定（2026/10/24 ゆうとの指摘で厳しくした）
  //  再生：1時間の伸びが媒体ごとの下限以上 かつ その動画の直前6時間の平均の2.5倍以上（＝今まさに加速してる）
  //        記録が足りない新しい動画（投稿12時間以内）は下限の2倍以上。同じ動画は24時間に1回まで
  //  節目：累計10万・50万・100万・300万を超えたとき（1回だけ）
  //  フォロワー：1時間の増加が媒体ごとの下限以上（6時間に1回まで）
  const FLOOR = { ig: 3000, tt: 8000, yt: 1000 }, ACCEL = 2.5, FFLOOR = { ig: 100, tt: 1000, yt: 500 };
  const hrs = (now - prev.t) / 3600e3;
  const vh = state.an.vh = state.an.vh || {};
  const alerts = []; state.an.alerted = state.an.alerted || {};
  const once = (key, ms) => { if (state.an.alerted[key] && now - state.an.alerted[key] < ms) return false; state.an.alerted[key] = now; return true; };
  for (const p of ['ig', 'yt', 'tt']) {
    const s = snap[p] || {};
    for (const [k, v] of Object.entries(cur.v[p])) {
      const key = `${p}:${k}`; const h = (vh[key] = (vh[key] || []).filter(([t]) => now - t <= 8 * 3600e3));
      const pv = prev.v[p][k]; h.push([now, v]);
      if (pv == null) continue;
      const gain = Math.round((v - pv) / hrs);
      const rec = s.media && s.media[k]; const ageH = rec && rec.t ? (now - rec.t) / 3600e3 : 999;
      const past = h.filter(([t]) => t <= prev.t && now - t <= 7 * 3600e3);
      let hit = false, accel = null;
      if (past.length >= 3 && past[past.length - 1][0] - past[0][0] >= 3 * 3600e3) {
        const avg = (past[past.length - 1][1] - past[0][1]) / ((past[past.length - 1][0] - past[0][0]) / 3600e3);
        accel = avg > 0 ? Math.round(gain / avg * 10) / 10 : null;
        hit = gain >= FLOOR[p] && gain >= ACCEL * Math.max(avg, 1);
      } else if (ageH <= 12) hit = gain >= FLOOR[p] * 2;
      if (hit && once(`v:${p}:${k}`, 24 * 3600e3)) alerts.push({ t: now, p, k, kind: 'velocity', gain, accel, ageH: Math.round(ageH), total: v, title: titleOf(p, k, rec) });
      for (const ms of [100000, 500000, 1000000, 3000000]) if (pv < ms && v >= ms && once(`m:${p}:${k}:${ms}`, 365 * 86400e3)) alerts.push({ t: now, p, k, kind: 'milestone', ms, total: v, title: titleOf(p, k, rec) });
    }
    const f0 = prev.f[p], f1 = cur.f[p];
    if (f0 != null && f1 != null) {
      const fg = Math.round((f1 - f0) / hrs);
      if (fg >= FFLOOR[p] && once(`f:${p}`, 6 * 3600e3)) alerts.push({ t: now, p, kind: 'followers', gain: fg, total: f1 });
    }
  }
  for (const key of Object.keys(vh)) if (!vh[key].length || now - vh[key][vh[key].length - 1][0] > 8 * 3600e3) delete vh[key];
  delete state.an.gains;
  for (const [k, t] of Object.entries(state.an.alerted)) if (now - t > 30 * 86400e3 && !k.startsWith('m:')) delete state.an.alerted[k];
  if (!alerts.length) return;
  state.an.alerts = [...(state.an.alerts || []), ...alerts].slice(-100); save();
  // 伸びが大きい順。同じ動画の 勢い と 節目 は1行にまとめる
  const seen = new Set(); const list = alerts.sort((x, y) => (y.gain || 0) - (x.gain || 0)).filter(a => { const k = `${a.p}:${a.k || 'f'}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const big = list.filter(a => a.kind === 'milestone' && a.ms >= 100000);
  if (!big.length) return; // 勢いとフォロワーの伸びは日報で見る。10万回以上の節目だけすぐ送る
  try { await pushChecked(flexAlert(big, now)); }
  catch (e) { log('flex alert failed', e.message); await push(text(`【伸びてる】\n${big.map(a => a.kind === 'followers' ? `${PLAT[a.p]} フォロワー +${a.gain}/時（今 ${kfmt(a.total)}）` : `${PLAT[a.p]} ${a.title} +${kfmt(a.gain || 0)}/時（累計 ${kfmt(a.total)}）`).join('\n')}`)); }
}
let collecting = false;
async function collect() {
  if (collecting) return; collecting = true;
  const now = Date.now(); const snap = { t: now };
  try {
    for (const [p, f] of [['ig', () => collectIG(now)], ['yt', collectYT], ['tt', collectTT]]) {
      try { snap[p] = await timed(f(), 240000); }
      catch (e) { snap[p] = { error: errMsg(e) }; log('collect', p, errMsg(e)); }
    }
    // 1日1回（5時台）：インスタのアカウント全体の数字・YouTubeアナリティクス・LINEの送信数
    const today = ymd(now);
    if (jstHour(now) >= 5 && state.an.dailyDone !== today) {
      state.an.dailyDone = today;
      if (state.igToken && IG_USER_ID) {
        state.an.igDays = state.an.igDays || {};
        for (const back of [1, 2]) { const d0 = dayStart(now) - back * 86400e3; try { state.an.igDays[ymd(d0)] = await timed(igAccountDay(d0)); } catch (e) { state.an.igDays[ymd(d0)] = { error: errMsg(e) }; } }
        for (const k of Object.keys(state.an.igDays).sort().slice(0, -60)) delete state.an.igDays[k];
      }
      if (state.yt && state.yt.refresh) { try { state.an.ytA = await timed(ytAnalytics()); state.an.ytAerr = ''; } catch (e) { state.an.ytAerr = errMsg(e); } }
      try { state.an.line = await lineQuota(); } catch {}
    }
    fs.appendFileSync(MET_FILE, JSON.stringify(snap) + '\n');
    state.an.last = now; save();
    await detectBuzz(snap).catch(e => log('buzz', e));
    // 45日より古い記録は消す（月1回くらい）
    if (fs.statSync(MET_FILE).size > 40e6) {
      const keep = fs.readFileSync(MET_FILE, 'utf8').split('\n').filter(l => { try { return JSON.parse(l).t > now - 45 * 86400e3; } catch { return false; } });
      fs.writeFileSync(MET_FILE, keep.join('\n') + '\n');
    }
  } finally { collecting = false; }
}
function readSnaps(since) {
  if (!fs.existsSync(MET_FILE)) return [];
  return fs.readFileSync(MET_FILE, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(s => s && s.t >= since);
}
function exportData(hours) {
  const now = Date.now();
  const items = Object.fromEntries(Object.entries(state.items).map(([id, i]) => { const m = meta(id); return [id, { status: i.status, title: m.title || '', ask: m.ask || '', hashtags: m.hashtags || [], mediaId: i.mediaId || '', permalink: i.permalink || '', publishedAt: i.publishedAt || 0, publishAt: i.publishAt || 0, yt: i.yt && i.yt.videoId ? i.yt.videoId : '' }]; }));
  return {
    now, items, snaps: readSnaps(now - hours * 3600e3),
    igDays: state.an.igDays || {}, ytAnalytics: state.an.ytA || null, ytAnalyticsError: state.an.ytAerr || '',
    alerts: (state.an.alerts || []).filter(a => a.t > now - 7 * 86400e3), line: state.an.line || null,
    flags: { igInsights: state.an.igIns || 'unknown', yt: !!(state.yt && state.yt.refresh), ytScope: !!(state.yt && state.yt.scopeV2), tt: state.tt && state.tt.refresh ? 'api' : 'embed' },
    postTimesToday: postTimesOn(dayStart(now)), postTimesDefault: POST_TIMES, postTimesOverride: state.postTimes || null,
  };
}
// 日報を預かって指定の時刻に送る（1回の送信で吹き出し最大5つ。LINEの通数は1通）
function splitLine(msg) {
  const out = []; let cur = '';
  for (const para of String(msg).split(/\n(?=【)|\n\n/)) { const add = (cur ? cur + '\n\n' : '') + para; if (add.length > 4800 && cur) { out.push(cur); cur = para; } else cur = add; }
  if (cur) out.push(cur);
  return out.slice(0, 5).map(t => text(t));
}
async function flushOutbox() {
  const box = state.an.outbox || []; if (!box.length) return;
  const due = box.filter(r => r.at <= Date.now()); if (!due.length) return;
  state.an.outbox = box.filter(r => r.at > Date.now()); save();
  for (const r of due) await pushReport(r);
}
function anSummary() {
  const s = readSnaps(Date.now() - 26 * 3600e3); if (!s.length) return 'まだ数字が貯まってない（毎時5分に取ってる）';
  const last = s[s.length - 1], first = s[0];
  const f = (x, k) => (x && x[k] != null ? x[k] : null);
  const d = (a, b) => (a == null || b == null ? '' : `（${a - b >= 0 ? '+' : ''}${a - b}）`);
  const sumV = x => Object.values((x && x.media) || {}).reduce((a, r) => a + (r.views || 0), 0);
  const rows = [['ig', 'followers', 'インスタ'], ['yt', 'subs', 'YouTube'], ['tt', 'followers', 'TikTok']].map(([p, k, name]) => {
    const L = last[p] || {}; if (L.error) return `${name}：${L.error}`;
    return `${name}：${kfmt(f(L, k))}${d(f(L, k), f(first[p], k))} 再生累計 ${kfmt(sumV(L))}${first.t < last.t ? `（+${kfmt(sumV(L) - sumV(first[p]))}）` : ''}`;
  });
  return `${fmt(first.t)}→${fmt(last.t)} の動き\n${rows.join('\n')}${state.an.igIns === 'no_permission' ? '\n※インスタの再生数は権限が足りなくて取れてない' : ''}`;
}

let busy = false;
setInterval(async () => {
  if (busy) return; busy = true;
  try {
    for (const [id, it] of Object.entries(state.items)) if (it.status === 'approved' && it.publishAt <= Date.now()) await publish(id);
    for (const [id, it] of Object.entries(state.items)) if (it.ytAt && it.ytAt <= Date.now()) await youtube(id);
    await refreshToken();
    await remind().catch(e => log('remind failed', e));
    await digestTick().catch(e => log('digest failed', e));
    await flushOutbox().catch(e => log('outbox failed', e));
  } finally { busy = false; }
  // 毎時5分に3媒体の数字を取る（投稿の処理とは別に動かす）
  const now = Date.now(), hourKey = Math.floor(now / 3600e3);
  if (new Date(now).getUTCMinutes() >= 5 && state.an.hourKey !== hourKey) { state.an.hourKey = hourKey; collect().catch(e => log('collect failed', e)); }
}, 30000);
if (!state.igTokenAt && state.igToken) { state.igTokenAt = Date.now(); save(); }
for (const it of Object.values(state.items)) if (it.yt?.uploading) { it.yt = {}; it.ytAt = Date.now() + 60e3; } // 再起動で途中になった YouTube 投稿はやり直す
save();

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
    if (p === '/health') return send(res, 200, { ok: true, owner: !!state.owner, ig: !!state.igToken, yt: !!state.yt?.refresh, items: Object.keys(state.items).length });
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
      state.items[id] = { status: 'pending', receivedAt: Date.now() }; save(); // 承認カードはまとめて送る（朝・夕方・「承認待ち」と送ったとき）
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && p === '/hook/notice') {
      if (!authed(req)) return send(res, 401, { ok: false });
      const { message } = JSON.parse((await readBody(req)).toString('utf8'));
      state.notices = [...(state.notices || []), { m: String(message || '').slice(0, 800), t: Date.now() }].slice(-10); save(); // 次のまとめに入れる
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && p === '/line/webhook') return onLineWebhook(req, res);
    if (req.method === 'GET' && p === '/yt/callback') return ytCallback(u, res);
    if (req.method === 'GET' && p === '/tt/callback') return ttCallback(u, res);
    if (p.startsWith('/an/')) {
      const got = Buffer.from(String(req.headers['x-an-key'] || u.searchParams.get('key') || '')), want = Buffer.from(state.an.key);
      if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return send(res, 401, { ok: false });
      if (req.method === 'GET' && p === '/an/export') return send(res, 200, exportData(Math.min(24 * 45, Number(u.searchParams.get('hours')) || 30)));
      if (req.method === 'POST' && p === '/an/collect') { await collect(); return send(res, 200, { ok: true, last: state.an.last }); }
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      if (req.method === 'POST' && p === '/an/report') {
        if (!body.message && !body.card) return send(res, 400, { ok: false, error: 'message or card' });
        const at = Number(body.at) || 0; const r = { at, message: body.message ? String(body.message) : '', card: body.card || null };
        if (at > Date.now() + 60e3) { state.an.outbox = [...(state.an.outbox || []), r]; save(); return send(res, 200, { ok: true, scheduled: fmt(at) }); }
        await pushReport(r); return send(res, 200, { ok: true, sent: true });
      }
      if (req.method === 'POST' && p === '/an/control') {
        const out = {};
        if (body.postTimes) out.postTimes = setPostTimes(`投稿時間 ${body.postTimes}`);
        if (body.notice) { await push(text(String(body.notice))); out.notice = true; }
        if (body.validate) { // LINE に送らずにカードの形が正しいかだけ確かめる
          const sample = [flexAlert([{ p: 'tt', kind: 'velocity', gain: 12000, base: 800, total: 29000, title: 'ゴキブリが絶滅したら？' }, { p: 'tt', kind: 'followers', gain: 100, total: 21000 }], Date.now())];
          if (body.card) sample.push(flexReport(body.card));
          const vr = await fetch('https://api.line.me/v2/bot/message/validate/push', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${LINE_TOKEN}` }, body: JSON.stringify({ messages: sample }) });
          out.validate = `${vr.status} ${(await vr.text()).slice(0, 500)}`;
        }
        return send(res, 200, { ok: true, ...out });
      }
      return send(res, 404, { ok: false });
    }
    send(res, 404, { ok: false });
  } catch (e) {
    log('error', e);
    if (!res.headersSent) send(res, e.code === 413 ? 413 : 500, { ok: false });
  }
}).listen(PORT, '127.0.0.1', () => log(`moshimo server on 127.0.0.1:${PORT}`));
