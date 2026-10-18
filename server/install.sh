#!/usr/bin/env bash
# もしもラボ 投稿サーバーのインストール（ConoHa VPS で sudo bash install.sh）
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
const POST_TIME = env.POST_TIME || '20:30';                        // 日本時間
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
function nextSlot() {
  const [hh, mm] = POST_TIME.split(':').map(Number);
  const taken = new Set(Object.values(state.items).filter(i => i.status === 'approved' && i.publishAt).map(i => i.publishAt));
  const now = Date.now();
  const j = new Date(now + JST);
  let t = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate(), hh, mm) - JST;
  if (t <= now + 5 * 60e3) t += 86400e3;
  while (taken.has(t)) t += 86400e3;                                // 1日1本
  return t;
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

function approvalMessages(id) {
  const m = meta(id);
  const title = (m.title || `動画 ${id}`).slice(0, 40);
  return [
    { type: 'video', originalContentUrl: `${BASE_URL}/media/${id}.mp4`, previewImageUrl: `${BASE_URL}/media/${id}_cover.jpg` },
    text(`【承認待ち】${id}\n${m.title || ''}\n\nキャプション：\n${m.caption || ''}\n\n${(m.hashtags || []).map(h => '#' + h).join(' ')}`),
    {
      type: 'template', altText: `承認待ち ${id}`,
      template: {
        type: 'buttons', title, text: `承認すると ${fmt(nextSlot())} に投稿する`.slice(0, 60),
        actions: [
          { type: 'postback', label: '承認する', data: `approve:${id}`, displayText: `${id} を承認` },
          { type: 'postback', label: '今すぐ投稿', data: `now:${id}`, displayText: `${id} を今すぐ投稿` },
          { type: 'postback', label: '却下する', data: `reject:${id}`, displayText: `${id} を却下` },
        ],
      },
    },
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
    else if (ev.type === 'message' && ev.message.type === 'text' && /状態|ステータス/.test(ev.message.text)) {
      const rows = Object.entries(state.items).slice(-8).map(([id, i]) => `${id} ${i.status}${i.publishAt && i.status === 'approved' ? ' ' + fmt(i.publishAt) : ''}`);
      await reply(ev.replyToken, text(rows.length ? rows.join('\n') : 'まだ動画はない'));
    }
  }
}

// ---------------- Instagram ----------------
async function ig(method, p, params = {}) {
  const url = new URL(IG_API + p);
  const opt = { method, headers: { authorization: `Bearer ${state.igToken}` } };
  if (method === 'GET') Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  else { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(params); }
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`IG ${p}: ${r.status} ${JSON.stringify(j.error || j)}`);
  return j;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function publish(id) {
  const it = state.items[id]; const m = meta(id);
  it.status = 'publishing'; save();
  try {
    const caption = `${m.caption || ''}\n\n${(m.hashtags || []).slice(0, 5).map(h => '#' + h).join(' ')}`.trim();
    const c = await ig('POST', `/${IG_USER_ID}/media`, { media_type: 'REELS', video_url: `${BASE_URL}/media/${id}.mp4`, caption, share_to_feed: true });
    let status = 'IN_PROGRESS';
    for (let k = 0; k < 40 && status === 'IN_PROGRESS'; k++) { await sleep(15000); status = (await ig('GET', `/${c.id}`, { fields: 'status_code' })).status_code; }
    if (status !== 'FINISHED') throw new Error(`container status ${status}`);
    const p = await ig('POST', `/${IG_USER_ID}/media_publish`, { creation_id: c.id });
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

let busy = false;
setInterval(async () => {
  if (busy) return; busy = true;
  try {
    for (const [id, it] of Object.entries(state.items)) if (it.status === 'approved' && it.publishAt <= Date.now()) await publish(id);
    await refreshToken();
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
# 投稿時刻（日本時間）
POST_TIME=20:30
MOSHIMO_EOF
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/moshimo.env
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
