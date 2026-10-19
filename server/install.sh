#!/usr/bin/env bash
# もしもラボ 投稿サーバーのインストール（ConoHa VPS で sudo bash install.sh https://ドメイン/moshimo [合言葉]）
# 何度実行しても大丈夫。/etc/moshimo.env が既にあれば上書きしない。
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash install.sh で実行して"; exit 1; fi

# Node.js 18以上
NODE_OK=0
if command -v node >/dev/null; then v=$(node -p 'process.versions.node.split(".")[0]'); [ "$v" -ge 18 ] && NODE_OK=1; fi
if [ $NODE_OK = 0 ]; then
  echo "Node.js 22 を入れる"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
NODE_BIN=$(command -v node)

mkdir -p /opt/moshimo-lab/server
cat > /opt/moshimo-lab/server/moshimo-server.mjs <<'MOSHIMO_EOF'
// もしもラボ 投稿サーバー（ConoHa VPS で常駐。Node.js 18以上、外部パッケージなし）
//
// 役割
//  1. GitHub Actions から完成動画を受け取って保存し、公開URLで配信する（Instagram と LINE が取りに来る）
//  2. LINE に承認メッセージ（動画＋ボタン）を送る
//  3. 承認されたら Instagram API でリールを予約時刻に投稿し、結果を LINE に送る
//  4. Instagram の長期トークンを30日ごとに自動更新する
//  5. 同じ動画を YouTube（ショート）にも同時に投稿する（LINE の YouTube設定 で接続したとき）
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
    else if (ev.type === 'message' && ev.message.type === 'text' && /^(youtube|ユーチューブ)/i.test(ev.message.text.trim())) {
      await reply(ev.replyToken, text(ytCommand(ev.message.text.trim())));
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
    await push(text(`投稿した：${id} ${m.title || ''}\n${it.permalink || ''}`));
    await youtube(id);
  } catch (e) {
    Object.assign(it, { status: 'error', error: String(e.message || e) }); save();
    log('publish error', id, e);
    await push([text(`投稿に失敗した：${id}\n${it.error}`.slice(0, 1000)),
      { type: 'template', altText: '再投稿', template: { type: 'confirm', text: `${id} をもう一回投稿する？`, actions: [{ type: 'postback', label: 'もう一回', data: `retry:${id}` }, { type: 'postback', label: 'やめる', data: `reject:${id}` }] } }]);
    await youtube(id); // インスタが失敗しても YouTube は予定どおり出す
  }
}

// ---------------- YouTube ----------------
// 接続：LINE で「YouTube」→ 手順。「YouTube設定 クライアントID シークレット」→ 許可のリンクが届く → 開いて許可 → 接続完了
// 投稿：インスタに投稿するのと同じタイミングで、同じ動画をショートとして公開。説明欄にキャプション、最初のコメントに質問を書く
// 過去分：接続した時点でインスタに投稿済みの動画は、2日に分けて上げる（「YouTube 0031」で1本だけすぐ上げることもできる）
const YT_SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl';
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
  const q = new URLSearchParams({ client_id: state.yt.clientId, redirect_uri: ytRedirect(), response_type: 'code', scope: YT_SCOPE, access_type: 'offline', prompt: 'consent', state: state.yt.oauthState });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
function ytCommand(msg) {
  const parts = msg.split(/\s+/).filter(Boolean);
  const idArg = (msg.match(/(?:^|\s)(\d{4})(?:\s|$)/) || [])[1];
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
  state.yt.refresh = j.refresh_token; delete state.yt.oauthState; ytAccess = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; save();
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
async function youtube(id) {
  const it = state.items[id];
  if (!it || !state.yt?.refresh || it.yt?.videoId || it.yt?.uploading || it.yt?.skipped) return;
  const file = path.join(MEDIA, `${id}.mp4`);
  if (!fs.existsSync(file)) { it.yt = { error: '動画ファイルがVPSにない' }; delete it.ytAt; save(); return push(text(`YouTubeに上げられへん：${id} の動画ファイルがない`)); }
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
    await push(text(`YouTubeにも投稿した：${id} ${m.title || ''}\nhttps://youtube.com/shorts/${videoId}`));
  } catch (e) {
    it.yt = { error: String(e.message || e).slice(0, 500) }; save();
    log('youtube error', id, e);
    await push([text(`YouTubeへの投稿に失敗した：${id}\n${it.yt.error}`),
      { type: 'template', altText: 'YouTube再投稿', template: { type: 'confirm', text: `${id} をYouTubeにもう一回上げる？`, actions: [{ type: 'postback', label: 'もう一回', data: `ytretry:${id}` }, { type: 'postback', label: 'やめる', data: `ytskip:${id}` }] } }]);
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
    for (const [id, it] of Object.entries(state.items)) if (it.ytAt && it.ytAt <= Date.now()) await youtube(id);
    await refreshToken();
    await remind().catch(e => log('remind failed', e));
  } finally { busy = false; }
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
    if (req.method === 'GET' && p === '/yt/callback') return ytCallback(u, res);
    send(res, 404, { ok: false });
  } catch (e) {
    log('error', e);
    if (!res.headersSent) send(res, e.code === 413 ? 413 : 500, { ok: false });
  }
}).listen(PORT, '127.0.0.1', () => log(`moshimo server on 127.0.0.1:${PORT}`));
MOSHIMO_EOF

cat > /etc/systemd/system/moshimo.service <<'MOSHIMO_EOF'
[Unit]
Description=moshimo-lab posting server
After=network-online.target

[Service]
EnvironmentFile=/etc/moshimo.env
ExecStart=/usr/bin/node /opt/moshimo-lab/server/moshimo-server.mjs
Restart=always
RestartSec=5
User=www-data
Group=www-data
StateDirectory=moshimo
MemoryMax=200M

[Install]
WantedBy=multi-user.target
MOSHIMO_EOF
sed -i "s#/usr/bin/node#$NODE_BIN#" /etc/systemd/system/moshimo.service

if [ ! -f /etc/moshimo.env ]; then
cat > /etc/moshimo.env <<'MOSHIMO_EOF'
# /etc/moshimo.env にコピーして値を入れる（chmod 600）
PORT=8787
# 外から見えるURL（nginx の location /moshimo/ の先）。末尾スラッシュなし
BASE_URL=https://あなたのドメイン/moshimo
DATA_DIR=/var/lib/moshimo
# GitHub Actions と共有する合言葉（長いランダム文字列。GitHub の Secrets にも同じ値を入れる）
HOOK_SECRET=
# LINE Developers の Messaging API チャネル
LINE_CHANNEL_SECRET=
LINE_CHANNEL_TOKEN=
# 空でOK。公式アカウントを友だち追加して何か送ると、自動でゆうとのIDが登録される
LINE_OWNER_USER_ID=
# Instagram（Instagramログインの長期トークンと、プロアカウントのユーザーID）
IG_USER_ID=
IG_TOKEN=
# 投稿時刻（日本時間）。1日2本にするときは POST_TIMES=12:00,20:30
POST_TIMES=20:30
# 承認待ちが残ってたら再通知する時刻（日本時間）
REMIND_TIMES=12:00,18:00
MOSHIMO_EOF
  SECRET="${2:-$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)}"
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/moshimo.env
  if [ -n "${1:-}" ]; then sed -i "s#^BASE_URL=.*#BASE_URL=$1#" /etc/moshimo.env; fi
  chmod 600 /etc/moshimo.env
  echo
  echo "HOOK_SECRET（GitHubのSecretsにも同じ値を入れる）: $SECRET"
fi

systemctl daemon-reload
systemctl enable --now moshimo
systemctl restart moshimo
sleep 1
curl -fsS http://127.0.0.1:8787/moshimo/health && echo && echo "サーバーは動いてる"
echo
echo "nginx を使ってる場合は、HTTPSの server ブロックに次を追記して nginx -s reload："
cat <<'MOSHIMO_EOF'
# 既存の server { listen 443 ssl; server_name あなたのドメイン; ... } の中に追記する
location /moshimo/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 300m;
    proxy_request_buffering off;
    proxy_read_timeout 300s;
}
MOSHIMO_EOF
