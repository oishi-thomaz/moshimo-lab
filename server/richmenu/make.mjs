// リッチメニューの画像を作る（2500×1686）。手元で node server/richmenu/make.mjs → rsvg-convert で PNG にする
// 押せる場所（areas）は setup-richmenu.mjs と同じ並び。アイコンは Feather Icons（MIT）の形
import fs from 'node:fs';

const W = 2500, H = 1686, G = 28; // 余白
const FONT = "Noto Sans CJK JP, Noto Sans JP, sans-serif";
const ICON = {
  stock: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  yen: '<polyline points="6 3 12 11 18 3"/><line x1="12" y1="11" x2="12" y2="21"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="17" y2="17"/>',
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// 1枚のボタン：角丸の面・アイコン・大きい文字・小さい説明
function tile({ x, y, w, h, bg, fg, sub, icon, label, note, big }) {
  const r = 44, cx = x + w / 2;
  const iconSize = big ? 220 : 170;
  const labelSize = big ? 150 : 112;
  const noteSize = big ? 60 : 50;
  const block = iconSize + 40 + labelSize + 30 + noteSize;
  const top = y + (h - block) / 2;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${bg}"/>
  <g transform="translate(${cx - iconSize / 2} ${top}) scale(${iconSize / 24})" fill="none" stroke="${fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g>
  <text x="${cx}" y="${top + iconSize + 40 + labelSize * 0.88}" font-family="${FONT}" font-weight="900" font-size="${labelSize}" fill="${fg}" text-anchor="middle">${esc(label)}</text>
  <text x="${cx}" y="${top + iconSize + 40 + labelSize + 30 + noteSize * 0.88}" font-family="${FONT}" font-weight="500" font-size="${noteSize}" fill="${sub}" text-anchor="middle">${esc(note)}</text>`;
}
const svg = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;

// 3×2 の6マス（SNS司令室）
function grid6(cells) {
  const cw = (W - G * 4) / 3, ch = (H - G * 3) / 2;
  return cells.map((c, i) => tile({ x: G + (i % 3) * (cw + G), y: G + Math.floor(i / 3) * (ch + G), w: cw, h: ch, ...c })).join('');
}
// 上に大きい1マス＋下にnマス（各アカウント。もしもラボは収益を足して4マス）
function wide1plus3(top, cells) {
  const n = cells.length, tw = W - G * 2, th = (H - G * 3) * 0.5, cw = (W - G * (n + 1)) / n, ch = H - G * 3 - th;
  return tile({ x: G, y: G, w: tw, h: th, big: true, ...top }) + cells.map((c, i) => tile({ x: G + i * (cw + G), y: G * 2 + th, w: cw, h: ch, ...c })).join('');
}

const out = {};
// SNS司令室：紺の地に、ボタンごとに色の違う面
const dark = '#0B1A2B', card = '#132A42', white = '#F8FAFC', soft = '#9FB3C8';
out.sns = svg(dark, grid6([
  { bg: '#0F766E', fg: white, sub: '#CCFBF1', icon: 'stock', label: 'ストック', note: 'まだ投稿してない動画' },
  { bg: '#BE123C', fg: white, sub: '#FFE4E6', icon: 'check', label: '承認待ち', note: '3アカウント分' },
  { bg: '#1D4ED8', fg: white, sub: '#DBEAFE', icon: 'calendar', label: '今日の投稿', note: '予定と今の再生' },
  { bg: '#B45309', fg: white, sub: '#FEF3C7', icon: 'trend', label: 'いま回ってる', note: '直近3時間で伸びた動画' },
  { bg: card, fg: '#5EEAD4', sub: soft, icon: 'chart', label: 'いまの数字', note: 'フォロワーと24時間の再生' },
  { bg: card, fg: white, sub: soft, icon: 'help', label: '使い方', note: 'まとめの時間とボタン' },
]));
// 各アカウント：アカウントの色の大きい 承認待ち ＋ 白い3マス
for (const [key, color, light] of [['moshimo', '#0F766E', '#CCFBF1'], ['quiz', '#B45309', '#FEF3C7'], ['itsuwa', '#9F1239', '#FFE4E6']]) {
  out[key] = svg('#EEF2F6', wide1plus3(
    { bg: color, fg: '#FFFFFF', sub: light, icon: 'check', label: '承認待ち', note: key === 'moshimo' ? 'このアカウントの動画と台本' : 'このアカウントの動画' },
    [
      { bg: '#FFFFFF', fg: color, sub: '#64748B', icon: 'calendar', label: '今日の投稿', note: '予定と結果' },
      { bg: '#FFFFFF', fg: color, sub: '#64748B', icon: 'chart', label: '数字', note: 'フォロワーと再生' },
      key === 'moshimo' ? { bg: '#FFFFFF', fg: color, sub: '#64748B', icon: 'yen', label: '収益', note: 'TikTokの収益' } : { bg: '#FFFFFF', fg: color, sub: '#64748B', icon: 'msg', label: '通数', note: '今月の送信数' },
    ]));
}
const dir = new URL('.', import.meta.url).pathname;
for (const [k, v] of Object.entries(out)) fs.writeFileSync(`${dir}${k}.svg`, v);
console.log(Object.keys(out).join(' '));
