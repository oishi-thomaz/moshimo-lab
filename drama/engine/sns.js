// 「#拡散希望」のSNS・配信まわりの画面部品（架空の投稿アプリ。実在のアプリに似せない）
import { W, H, clamp, lerp, inv, ease, easeOut, back, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, FONT } from './core.js';

export const K = { orange: '#ff6a2b', orange2: '#ff8a52', blue: '#4a8ef0', bg: '#0d1117', card: '#151b25', line: '#232b38', text: '#e9edf3', sub: '#8a94a6', red: '#ff3b4a' };

// 数を短く（12,345 → 1.2万）
export const short = n => n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + '万' : Math.round(n).toLocaleString('ja-JP');

// アプリのアイコン（吹き出し＋2本の矢印＝拡散）
export function appIcon(g, x, y, r) {
  fillRR(g, x - r, y - r, r * 2, r * 2, r * 0.45, K.orange);
  g.save(); g.translate(x, y); g.scale(r / 50, r / 50);
  fillRR(g, -30, -26, 60, 44, 16, '#fff'); poly(g, [[-14, 16], [-24, 32], [0, 16]], '#fff');
  g.lineWidth = 7; g.strokeStyle = K.orange; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-16, -4); g.lineTo(14, -4); g.moveTo(6, -12); g.lineTo(14, -4); g.lineTo(6, 4); g.stroke();
  g.restore();
}
// アバター
export function avatar(g, kind, x, y, r) {
  if (kind === 'eye') { // @正義の目
    circ(g, x, y, r, '#0b0d12'); g.lineWidth = r * 0.08; g.strokeStyle = K.orange; g.beginPath(); g.arc(x, y, r * 0.95, 0, 7); g.stroke();
    g.save(); g.beginPath(); g.ellipse(x, y, r * 0.62, r * 0.34, 0, 0, 7); g.fillStyle = '#f2f2f2'; g.fill(); g.clip(); circ(g, x, y, r * 0.24, K.orange); circ(g, x, y, r * 0.11, '#0b0d12'); g.restore();
    return;
  }
  if (kind === 'cafe') { circ(g, x, y, r, '#6a4a32'); text(g, 'CAFE', x, y + r * 0.05, { size: r * 0.5, color: '#fff', weight: 900 }); return; }
  if (kind === 'onizuka') { circ(g, x, y, r, K.orange); text(g, '鬼', x, y + r * 0.05, { size: r * 1.1, color: '#fff', weight: 900 }); return; }
  const cols = ['#5a6a88', '#7a5a6a', '#4a7a6a', '#8a7a4a', '#6a5a8a', '#4a6a8a'];
  circ(g, x, y, r, cols[Math.abs(kind | 0) % cols.length]);
  circ(g, x, y - r * 0.18, r * 0.36, 'rgba(255,255,255,.75)'); ell(g, x, y + r * 0.55, r * 0.62, r * 0.42, 'rgba(255,255,255,.75)');
}
function wrap(g, s, maxW) { const out = []; for (const para of String(s).split('\n')) { let cur = ''; for (const ch of para) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; } out.push(cur); } return out; }
// 投稿カード。返り値＝高さ。o: {name, handle, avatar, text, img(g,w,h), imgH, rt, likes, views, time, hot}
export function postCard(g, x, y, w, o) {
  g.save(); g.font = `800 44px ${FONT}`;
  const lines = wrap(g, o.text || '', w - 70), imgH = o.img ? (o.imgH || w * 0.62) : 0;
  const h = 150 + lines.length * 62 + (imgH ? imgH + 30 : 0) + 90;
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; fillRR(g, x, y, w, h, 34, K.card); g.shadowColor = 'transparent';
  if (o.hot) { g.lineWidth = 4; g.strokeStyle = rgba(K.orange, 0.85); rr(g, x, y, w, h, 34); g.stroke(); }
  avatar(g, o.avatar ?? 0, x + 70, y + 72, 38);
  text(g, o.name, x + 125, y + 56, { size: 38, color: K.text, align: 'left', weight: 800 });
  text(g, `${o.handle}・${o.time || '2時間'}`, x + 125, y + 98, { size: 28, color: K.sub, align: 'left', weight: 500 });
  lines.forEach((s, i) => { g.font = `800 44px ${FONT}`; const tags = s.split(/(#\S+)/); let xx = x + 36; for (const part of tags) { if (!part) continue; g.fillStyle = part.startsWith('#') ? K.blue : K.text; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(part, xx, y + 170 + i * 62); xx += g.measureText(part).width; } });
  let yy = y + 150 + lines.length * 62;
  if (o.img) { g.save(); rr(g, x + 30, yy, w - 60, imgH, 22); g.clip(); g.translate(x + 30, yy); o.img(g, w - 60, imgH); g.restore(); yy += imgH + 30; }
  // 返信・拡散・いいね・表示
  const stat = (i, label, n, col) => { const sx = x + 40 + i * (w - 80) / 4; text(g, label, sx, yy + 40, { size: 30, color: col, align: 'left', weight: 800 }); g.font = `800 30px ${FONT}`; text(g, short(n), sx + g.measureText(label).width + 10, yy + 40, { size: 30, color: col, align: 'left', weight: 800 }); };
  stat(0, '返信', (o.rt || 0) * 0.18, K.sub); stat(1, '拡散', o.rt || 0, K.orange); stat(2, 'いいね', o.likes || 0, K.sub); stat(3, '表示', o.views || 0, K.sub);
  g.restore();
  return h;
}
// 大きな拡散カウンター（炎上の数字）
export function bigCounter(g, x, y, n, { label = '拡散', alpha = 1, size = 150 } = {}) {
  if (alpha <= 0) return; g.save(); g.globalAlpha = alpha;
  text(g, label, x, y - size * 0.75, { size: size * 0.28, color: K.orange2, weight: 800 });
  g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.16; g.strokeStyle = '#05060a'; g.strokeText(short(n), x, y); g.fillStyle = K.orange; g.fillText(short(n), x, y);
  g.restore();
}
// トレンド一覧
export function trendList(g, x, y, w, items, t, { title = 'トレンド' } = {}) {
  fillRR(g, x, y, w, 120 + items.length * 140, 34, K.card);
  text(g, title, x + 40, y + 62, { size: 40, color: K.text, align: 'left', weight: 800 });
  items.forEach((it, i) => {
    const a = clamp((t - (it.t || 0)) / 0.3); if (a <= 0) return;
    g.save(); g.globalAlpha = a; const yy = y + 120 + i * 140;
    line(g, x + 30, yy, x + w - 30, yy, 2, K.line, 'butt');
    text(g, `${i + 1}位・トレンド`, x + 40, yy + 40, { size: 26, color: K.sub, align: 'left', weight: 500 });
    text(g, it.name, x + 40, yy + 88, { size: 46, color: it.hot ? K.orange : K.text, align: 'left', weight: 800 });
    text(g, `${short(it.n)}件の投稿`, x + w - 40, yy + 88, { size: 28, color: K.sub, align: 'right', weight: 500 });
    g.restore();
  });
}
// スマホの枠（中を描く関数つき）
export function phoneFrame(g, x, y, w, h, draw, { rot = 0 } = {}) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50; fillRR(g, 0, 0, w, h, 60, '#0b0c10'); g.shadowColor = 'transparent';
  g.save(); rr(g, 16, 16, w - 32, h - 32, 46); g.clip(); fillRR(g, 16, 16, w - 32, h - 32, 46, K.bg); g.translate(16, 16); draw(g, w - 32, h - 32); g.restore();
  fillRR(g, w / 2 - 70, 30, 140, 30, 15, '#0b0c10');
  g.restore();
}
// 生配信の画面（video=映像を描く関数、comments=[{t,name,text}]）
export function liveView(g, x, y, w, h, { t = 0, viewers = 0, video, comments = [], title = 'ジャスティス鬼塚【生】通り魔の犯人の家に突撃' } = {}) {
  g.save(); rr(g, x, y, w, h, 30); g.clip();
  g.fillStyle = '#000'; g.fillRect(x, y, w, h);
  if (video) { g.save(); g.translate(x, y); video(g, w, h); g.restore(); }
  vgrad(g, x, y, w, 200, [[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]);
  vgrad(g, x, y + h - h * 0.5, w, h * 0.5, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.8)']]);
  fillRR(g, x + 30, y + 30, 120, 56, 10, K.red); text(g, 'LIVE', x + 90, y + 59, { size: 32, color: '#fff', weight: 900 });
  fillRR(g, x + 165, y + 30, 230, 56, 10, 'rgba(0,0,0,.55)'); text(g, `視聴 ${short(viewers)}`, x + 280, y + 59, { size: 32, color: '#fff', weight: 800 });
  text(g, title, x + 30, y + 130, { size: 30, color: '#fff', align: 'left', weight: 800 });
  // コメント（下から積む）
  const shown = comments.filter(c => t >= c.t).slice(-6);
  shown.forEach((c, i) => {
    const k = shown.length - 1 - i, yy = y + h - 70 - k * 76, a = clamp((t - c.t) / 0.2);
    g.save(); g.globalAlpha = a * (1 - k * 0.1);
    avatar(g, c.av ?? (i + 2), x + 60, yy, 24);
    text(g, c.name, x + 100, yy - 14, { size: 24, color: '#c9d0dc', align: 'left', weight: 500 });
    text(g, c.text, x + 100, yy + 18, { size: 34, color: '#fff', align: 'left', weight: 800 });
    g.restore();
  });
  g.restore();
}
// インターホンのモニター（外のカメラ映像）
export function intercom(g, x, y, s, { t = 0, video, ring = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  fillRR(g, -260, -190, 520, 380, 30, '#e9e6df'); fillRR(g, -230, -160, 360, 270, 10, '#0b0c10');
  g.save(); rr(g, -220, -150, 340, 250, 8); g.clip(); g.translate(-220, -150); if (video) video(g, 340, 250); g.restore();
  text(g, '録画', -50, 140, { size: 24, color: '#5a5a5a', weight: 800 });
  for (let i = 0; i < 3; i++) { circ(g, 190, -110 + i * 80, 26, '#d0ccc4'); }
  if (ring > 0 && Math.sin(t * 12) > 0) circ(g, 190, -110, 14, K.red);
  g.restore();
}
// テレビのニュース
export function newsTV(g, x, y, w, { t = 0, head = '', sub = '', draw } = {}) {
  const h = w * 0.6;
  fillRR(g, x - 20, y - 20, w + 40, h + 40, 20, '#0b0c10');
  g.save(); rr(g, x, y, w, h, 6); g.clip(); vgrad(g, x, y, w, h, [[0, '#2a3a5a'], [1, '#14203a']]); if (draw) { g.translate(x, y); draw(g, w, h); g.translate(-x, -y); } g.restore();
  fillRR(g, x, y + h - 150, w, 150, 0, 'rgba(240,240,240,.95)'); fillRR(g, x, y + h - 150, 150, 50, 0, '#c8102e'); text(g, '速報', x + 75, y + h - 125, { size: 30, color: '#fff', weight: 900 });
  text(g, head, x + 30, y + h - 70, { size: 46, color: '#111', align: 'left', weight: 900 });
  if (sub) text(g, sub, x + w - 30, y + h - 125, { size: 26, color: '#444', align: 'right', weight: 600 });
}
// 発信・通話の画面
export function callScreen(g, w, h, { t = 0, name = '', sub = '', mode = 'calling', av = 0 } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#1a2234'], [1, '#0b0f1a']]);
  avatar(g, av, w / 2, h * 0.28, 110);
  text(g, name, w / 2, h * 0.28 + 190, { size: 56, color: '#fff', weight: 800 });
  text(g, mode === 'calling' ? '発信中…' : sub, w / 2, h * 0.28 + 260, { size: 34, color: '#9aa5bb', weight: 500 });
  if (mode === 'calling') { const p = (t * 1.2) % 1; g.save(); g.globalAlpha = 1 - p; g.lineWidth = 6; g.strokeStyle = '#7ce0a0'; g.beginPath(); g.arc(w / 2, h * 0.28, 120 + p * 120, 0, 7); g.stroke(); g.restore(); }
  circ(g, w / 2, h * 0.64, 70, K.red); fillRR(g, w / 2 - 34, h * 0.64 - 9, 68, 18, 9, '#fff');
}
