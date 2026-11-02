// メニューは最初は閉じた状態（下のメニューの文字を押すと開く）。4つの LINE（SNS司令室・もしもラボ・タイトル当てクイズ・いつわ劇場）にリッチメニューを入れる。VPS で root のまま1回打つ
//   node setup-richmenu.mjs <このリポジトリのコミット>   （画像はそのコミットの server/richmenu/*.png を使う）
// 何度やっても大丈夫：前にこのスクリプトが入れたメニュー（名前が auto- で始まる）は消してから入れ直す。
// ついでに、各アカウントの LINE の ID（@xxxx）を /var/lib/sns/accounts.json に書く（SNS司令室の 承認待ち から各 LINE を開くボタンに使う）
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const REF = process.argv[2] || 'main';
const RAW = `https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/${REF}/server/richmenu`;
const W = 2500, H = 1686;
// 押すと、トークにその文字が出て（displayText）、メニューは閉じる（inputOption: closeRichMenu）。返ってくるカードがメニューに隠れないように
const msg = (x, y, w, h, text) => ({ bounds: { x, y, width: w, height: h }, action: { type: 'postback', data: `menu:${text}`, displayText: text, inputOption: 'closeRichMenu' } });
const C = [0, 833, 1666, W]; // 3列の境目
const R = [0, 843, H];        // 2段の境目
const grid6 = texts => texts.map((t, i) => msg(C[i % 3], R[Math.floor(i / 3)], C[i % 3 + 1] - C[i % 3], R[Math.floor(i / 3) + 1] - R[Math.floor(i / 3)], t));
const wide1plus3 = (top, texts) => { const n = texts.length, X = [...Array(n + 1).keys()].map(i => Math.round(W * i / n)); return [msg(0, 0, W, R[1], top), ...texts.map((t, i) => msg(X[i], R[1], X[i + 1] - X[i], H - R[1], t))]; };

const MENUS = [
  { key: 'sns', env: '/etc/sns.env', bar: '司令室メニュー', areas: grid6(['ストック', '承認待ち', '今日の投稿', 'いま回ってる', 'いまの数字', '使い方']) },
  { key: 'moshimo', env: '/etc/moshimo.env', bar: 'メニュー', areas: wide1plus3('承認待ち', ['投稿した', '数字', '収益', '通数']) },
  { key: 'quiz', env: '/etc/quiz.env', bar: 'メニュー', areas: wide1plus3('承認待ち', ['投稿した', '数字', '通数']) },
  { key: 'itsuwa', env: '/etc/itsuwa.env', bar: 'メニュー', areas: wide1plus3('承認待ち', ['投稿した', '数字', '通数']) },
];

const tokenOf = f => { try { return ((fs.readFileSync(f, 'utf8').match(/^LINE_CHANNEL_TOKEN=(.+)$/m) || [])[1] || '').trim(); } catch { return ''; } };
async function api(token, method, url, body, type = 'application/json') {
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': type } : {}) }, body: body ? (type === 'application/json' ? JSON.stringify(body) : body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url.replace('https://', '').split('/').slice(2).join('/')} → ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : {};
}

const ids = {};
let failed = 0;
for (const m of MENUS) {
  const token = tokenOf(m.env);
  if (!token) { console.log(`× ${m.key}：${m.env} に LINE_CHANNEL_TOKEN がない`); failed++; continue; }
  try {
    const info = await api(token, 'GET', 'https://api.line.me/v2/bot/info');
    if (m.key !== 'sns') ids[m.key] = { basicId: info.basicId, name: info.displayName };
    const list = (await api(token, 'GET', 'https://api.line.me/v2/bot/richmenu/list')).richmenus || [];
    for (const old of list.filter(x => String(x.name).startsWith('auto-'))) await api(token, 'DELETE', `https://api.line.me/v2/bot/richmenu/${old.richMenuId}`);
    const { richMenuId } = await api(token, 'POST', 'https://api.line.me/v2/bot/richmenu', { size: { width: W, height: H }, selected: false, name: `auto-${m.key}`, chatBarText: m.bar, areas: m.areas });
    const img = await fetch(`${RAW}/${m.key}.png`);
    if (!img.ok) throw new Error(`画像が取れない（${img.status}）`);
    await api(token, 'POST', `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, Buffer.from(await img.arrayBuffer()), 'image/png');
    await api(token, 'POST', `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`);
    console.log(`○ ${info.displayName}（${info.basicId}）にメニューを入れた`);
  } catch (e) { console.log(`× ${m.key}：${e.message}`); failed++; }
}
if (Object.keys(ids).length) {
  fs.mkdirSync('/var/lib/sns', { recursive: true });
  fs.writeFileSync('/var/lib/sns/accounts.json', JSON.stringify(ids, null, 2));
  try { execSync('chown -R www-data:www-data /var/lib/sns'); } catch {}
}
console.log(failed ? `${failed}個うまくいかなかった。上の × の行を Claude に貼って` : '全部入った。LINE を開き直すと下にメニューが出る');
