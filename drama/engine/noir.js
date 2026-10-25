// いつわ劇場「ホワイト案件」の画づくり：夜の黒紺＋赤一色、スクリーントーン、頭身高めのキャラ、チャット、タイマー、コマ割り
import { W, H, clamp, lerp, inv, ease, easeOut, back, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, FONT, SERIF } from './core.js';

export const C = {
  ink: '#07080d', navy: '#10162a', navy2: '#1a2340', navy3: '#25304f', cold: '#8ea3c0', fog: '#c9d3e2',
  red: '#e3263b', red2: '#ff4257', skin: '#e8d3c0', skinS: '#b9a39a', paper: '#e9e4da', warm: '#ffcf8a',
};

// ---------- スクリーントーン ----------
const tones = {};
function tonePattern(g, color, step = 9, r = 2.2) {
  const k = `${color}|${step}|${r}`;
  if (!tones[k]) { const c = document.createElement('canvas'); c.width = c.height = step; const x = c.getContext('2d'); x.fillStyle = color; x.beginPath(); x.arc(step / 2, step / 2, r, 0, 7); x.fill(); tones[k] = c; }
  const p = g.createPattern(tones[k], 'repeat'); return p;
}
// 今のパスをトーンで塗る
export function toneFill(g, color = 'rgba(0,0,0,.35)', step = 9, r = 2.2) { g.save(); g.fillStyle = tonePattern(g, color, step, r); g.fill(); g.restore(); }
export function toneRect(g, x, y, w, h, color = 'rgba(0,0,0,.3)', step = 9, r = 2.2) { g.save(); g.fillStyle = tonePattern(g, color, step, r); g.fillRect(x, y, w, h); g.restore(); }

// ---------- 人物（頭身高め・白目のある目・トーンの影） ----------
export const CAST2 = {
  yuuma: { hair: 'messy', hairC: '#16171d', top: '#3a3f4c', top2: '#2c303b', hood: true, bottom: '#1f2330', shoes: '#d8d8d8', tall: 1 },
  jin: { hair: 'buzz', hairC: '#1b1b1f', top: '#141519', top2: '#0e0f12', bottom: '#202227', shoes: '#111', tall: 1.05, scar: true, tattoo: true },
  mom: { hair: 'tied', hairC: '#3b2a24', top: '#8f8478', top2: '#7a7065', bottom: '#4a4550', shoes: '#ccc', tall: 0.95, female: true },
  miku: { hair: 'pony', hairC: '#20171a', top: '#2e3b63', top2: '#24304f', bottom: '#2e3b63', shoes: '#eee', tall: 0.9, female: true, jersey: true },
  officer: { hair: 'police', hairC: '#1b1b1f', top: '#1e2a44', top2: '#162036', bottom: '#1e2a44', shoes: '#111', tall: 1.0 },
  sakaguchi: { hair: 'parted', hairC: '#5a5450', top: '#b9a88c', top2: '#a39276', bottom: '#3a3a44', shoes: '#2a2018', tall: 1.0, glasses: true, cardigan: true },
  takumi: { hair: 'parted', hairC: '#3a2a20', top: '#b8b2a6', top2: '#a49e92', bottom: '#2a2e38', shoes: '#ddd', tall: 1.0 },
};
const INK = '#141218';

function eyes(g, x, y, r, o) {
  const look = (o.look || 0) * r * 0.07, up = (o.lookY || 0) * r * 0.05;
  const open = o.eyes === 'closed' ? 0 : o.eyes === 'wide' ? 1.25 : o.eyes === 'narrow' ? 0.55 : 1;
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.36 + (o.turn || 0) * r * 0.3, ey = y + r * 0.1;
    if (open === 0) { line(g, ex - r * 0.14, ey, ex + r * 0.14, ey + r * 0.02, r * 0.05, INK); continue; }
    g.save(); g.beginPath(); g.ellipse(ex, ey, r * 0.17, r * 0.105 * open, 0, 0, 7); g.fillStyle = '#f4f1ea'; g.fill(); g.clip();
    circ(g, ex + look, ey + up, r * (open > 1.1 ? 0.055 : 0.075), INK);
    g.restore();
    // 上まぶた
    g.beginPath(); g.ellipse(ex, ey, r * 0.18, r * 0.11 * open, 0, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = r * 0.055; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
    // まゆ
    const br = o.brow || 0, by = ey - r * 0.24 - (open > 1.1 ? r * 0.05 : 0);
    line(g, ex - r * 0.15, by + s * br * r * 0.06, ex + r * 0.15, by - s * br * r * 0.06, r * 0.045, INK);
    if (o.bags) { g.beginPath(); g.arc(ex, ey + r * 0.13, r * 0.11, Math.PI * 0.15, Math.PI * 0.85); g.lineWidth = r * 0.02; g.strokeStyle = 'rgba(40,30,40,.5)'; g.stroke(); }
  }
}
function mouth(g, x, y, r, o) {
  const mx = x + (o.turn || 0) * r * 0.3, my = y + r * 0.52, m = o.mouth || 'line', talk = o.talk || 0;
  if (talk > 0.05) { ell(g, mx, my, r * 0.1, r * (0.03 + 0.09 * talk), '#5a2a30'); return; }
  if (m === 'open') { ell(g, mx, my + r * 0.02, r * 0.11, r * 0.12, '#5a2a30'); return; }
  if (m === 'grit') { fillRR(g, mx - r * 0.14, my - r * 0.04, r * 0.28, r * 0.09, r * 0.03, '#f4f1ea'); g.lineWidth = r * 0.03; g.strokeStyle = INK; rr(g, mx - r * 0.14, my - r * 0.04, r * 0.28, r * 0.09, r * 0.03); g.stroke(); return; }
  if (m === 'smile') { g.beginPath(); g.arc(mx, my - r * 0.1, r * 0.13, Math.PI * 0.25, Math.PI * 0.75); g.lineWidth = r * 0.04; g.strokeStyle = INK; g.stroke(); return; }
  if (m === 'frown') { g.beginPath(); g.arc(mx, my + r * 0.12, r * 0.12, Math.PI * 1.25, Math.PI * 1.75); g.lineWidth = r * 0.04; g.strokeStyle = INK; g.stroke(); return; }
  line(g, mx - r * 0.09, my, mx + r * 0.09, my, r * 0.04, INK);
}
function hairBack(g, x, y, r, P) {
  const c = P.hairC;
  if (P.hair === 'tied') { circ(g, x + r * 0.2, y - r * 1.0, r * 0.32, c); }
  if (P.hair === 'pony') { g.save(); g.translate(x + r * 0.7, y - r * 0.5); g.rotate(0.5); ell(g, 0, r * 0.45, r * 0.22, r * 0.6, c); g.restore(); }
}
function hairFront(g, x, y, r, P, t = 0) {
  const c = P.hairC, tt = t * r * 0.2;
  g.fillStyle = c; g.beginPath();
  if (P.hair === 'messy') {
    g.moveTo(x - r * 1.02, y + r * 0.05);
    g.quadraticCurveTo(x - r * 1.1, y - r * 1.25, x + tt, y - r * 1.18);
    g.quadraticCurveTo(x + r * 1.12, y - r * 1.25, x + r * 1.02, y + r * 0.05);
    // 前髪のぎざぎざ
    const pts = [[0.95, -0.25], [0.7, -0.45], [0.55, -0.15], [0.3, -0.5], [0.1, -0.2], [-0.15, -0.55], [-0.35, -0.22], [-0.6, -0.48], [-0.8, -0.18], [-0.95, -0.3]];
    for (const [px, py] of pts) g.lineTo(x + px * r + tt, y + py * r);
    g.closePath(); g.fill();
  } else if (P.hair === 'buzz') {
    g.moveTo(x - r * 0.98, y - r * 0.15); g.quadraticCurveTo(x - r * 1.0, y - r * 1.1, x, y - r * 1.08); g.quadraticCurveTo(x + r * 1.0, y - r * 1.1, x + r * 0.98, y - r * 0.15);
    g.quadraticCurveTo(x, y - r * 0.72, x - r * 0.98, y - r * 0.15); g.closePath(); g.fill();
    g.save(); g.clip(); toneRect(g, x - r, y - r * 1.2, r * 2, r, 'rgba(255,255,255,.12)', 6, 1.2); g.restore();
  } else if (P.hair === 'tied' || P.hair === 'pony') {
    g.moveTo(x - r * 1.0, y + r * 0.1); g.quadraticCurveTo(x - r * 1.05, y - r * 1.15, x + tt, y - r * 1.12); g.quadraticCurveTo(x + r * 1.05, y - r * 1.15, x + r * 1.0, y + r * 0.1);
    g.lineTo(x + r * 0.85, y - r * 0.35); g.quadraticCurveTo(x + r * 0.2 + tt, y - r * 0.7, x - r * 0.3 + tt, y - r * 0.42); g.quadraticCurveTo(x - r * 0.7, y - r * 0.55, x - r * 0.85, y - r * 0.3); g.closePath(); g.fill();
  } else if (P.hair === 'parted') {
    g.moveTo(x - r * 1.0, y); g.quadraticCurveTo(x - r * 1.05, y - r * 1.2, x - r * 0.1, y - r * 1.12); g.quadraticCurveTo(x + r * 1.1, y - r * 1.1, x + r * 1.0, y);
    g.lineTo(x + r * 0.8, y - r * 0.45); g.quadraticCurveTo(x - r * 0.2, y - r * 0.85, x - r * 0.9, y - r * 0.35); g.closePath(); g.fill();
  } else if (P.hair === 'police') {
    g.moveTo(x - r * 1.05, y - r * 0.35); g.quadraticCurveTo(x - r * 1.0, y - r * 1.3, x, y - r * 1.28); g.quadraticCurveTo(x + r * 1.0, y - r * 1.3, x + r * 1.05, y - r * 0.35); g.closePath();
    g.fillStyle = '#1e2a44'; g.fill(); fillRR(g, x - r * 1.15, y - r * 0.45, r * 2.3, r * 0.2, r * 0.08, '#0d1220'); circ(g, x, y - r * 0.85, r * 0.13, '#c9a24a');
  }
}
// 頭（顔のトーン影・光の向き）
export function head(g, P, x, y, r, o = {}) {
  g.save();
  hairBack(g, x, y, r, P);
  // 首
  fillRR(g, x - r * 0.3, y + r * 0.6, r * 0.6, r * 0.6, r * 0.15, C.skinS);
  // 顔（少し縦長）
  g.beginPath(); g.ellipse(x, y, r * 0.95, r * 1.08, 0, 0, 7); g.fillStyle = C.skin; g.fill();
  // あご線の影（トーン）
  const side = o.lightFrom === 'left' ? 1 : -1;
  g.save(); g.beginPath(); g.ellipse(x, y, r * 0.95, r * 1.08, 0, 0, 7); g.clip();
  g.beginPath(); g.ellipse(x + side * r * 0.75, y + r * 0.1, r * 0.6, r * 1.3, 0, 0, 7); toneFill(g, 'rgba(40,30,50,.55)', 8, 2);
  if (o.under) { const gr = g.createLinearGradient(0, y + r * 1.1, 0, y - r * 0.4); gr.addColorStop(0, 'rgba(210,230,255,.0)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
  g.restore();
  // 耳
  ell(g, x - r * 0.93, y + r * 0.12, r * 0.13, r * 0.2, C.skin); ell(g, x + r * 0.93, y + r * 0.12, r * 0.13, r * 0.2, C.skin);
  // 鼻
  line(g, x + (o.turn || 0) * r * 0.32 + r * 0.03, y + r * 0.22, x + (o.turn || 0) * r * 0.32 - r * 0.03, y + r * 0.36, r * 0.035, 'rgba(90,60,60,.55)');
  eyes(g, x, y, r, o); mouth(g, x, y, r, o);
  if (P.scar) line(g, x - r * 0.62, y - r * 0.2, x - r * 0.4, y + r * 0.25, r * 0.04, 'rgba(150,60,70,.8)');
  if (P.glasses) { const gx = x + (o.turn || 0) * r * 0.3; g.save(); g.lineWidth = r * 0.05; g.strokeStyle = '#2a2420'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(gx + sd * r * 0.36, y + r * 0.1, r * 0.25, r * 0.19, 0, 0, 7); g.stroke(); } line(g, gx - r * 0.11, y + r * 0.08, gx + r * 0.11, y + r * 0.08, r * 0.04, '#2a2420'); if (o.glint) { g.globalAlpha = o.glint; g.fillStyle = 'rgba(255,255,255,.85)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(gx + sd * r * 0.36, y + r * 0.1, r * 0.24, r * 0.18, 0, 0, 7); g.fill(); } } g.restore(); }
  if (o.sweat) { const sx = x + r * 0.85, sy = y - r * 0.3 + ((o.sweat * 0.6) % 1) * r * 0.4; poly(g, [[sx, sy - r * 0.2], [sx - r * 0.08, sy], [sx + r * 0.08, sy]], '#bfe0ff'); circ(g, sx, sy, r * 0.08, '#bfe0ff'); }
  hairFront(g, x, y, r, P, o.turn || 0);
  g.restore();
}

// 全身（足元 x,y・s=大きさ）。頭身5.5
export function figure(g, P, o = {}) {
  const s = (o.s || 1) * (P.tall || 1), x = o.x || 0, y = o.y || 0;
  const r = 44 * s;
  const legL = 250 * s, bodyH = 230 * s;
  const hipY = y - legL, shY = hipY - bodyH;
  const bob = o.walk != null ? Math.abs(Math.sin(o.walk * Math.PI)) * -5 * s : 0;
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.shadow !== false) ell(g, x, y + 4 * s, 80 * s, 12 * s, 'rgba(0,0,0,.35)');
  const sw = o.walk != null ? Math.sin(o.walk * Math.PI * 2) * 20 : 0;
  for (const side of [-1, 1]) {
    const lx = x + side * 22 * s, ang = side * sw * Math.PI / 180;
    const fx = lx + Math.sin(ang) * legL, fy = hipY + Math.cos(ang) * legL + bob;
    line(g, lx, hipY + bob, fx, fy - 8 * s, 40 * s, P.bottom, 'butt'); ell(g, fx + 6 * s, fy - 6 * s, 28 * s, 12 * s, P.shoes);
  }
  const bw = 140 * s, by = shY + bob;
  g.beginPath(); g.moveTo(x - bw * 0.5, by + 30 * s); g.quadraticCurveTo(x - bw * 0.52, by, x - bw * 0.25, by - 6 * s); g.lineTo(x + bw * 0.25, by - 6 * s);
  g.quadraticCurveTo(x + bw * 0.52, by, x + bw * 0.5, by + 30 * s); g.lineTo(x + bw * 0.44, hipY + 16 * s + bob); g.lineTo(x - bw * 0.44, hipY + 16 * s + bob); g.closePath();
  g.fillStyle = P.top; g.fill();
  g.save(); g.clip(); g.beginPath(); g.rect(x + (o.lightFrom === 'left' ? 0 : -bw), by - 10 * s, bw, bodyH + 40 * s); toneFill(g, 'rgba(0,0,0,.45)', 9, 2.4); g.restore();
  if (P.hood) { g.beginPath(); g.ellipse(x, by + 4 * s, bw * 0.34, 26 * s, 0, 0, Math.PI); g.fillStyle = P.top2; g.fill(); line(g, x - 12 * s, by + 18 * s, x - 14 * s, by + 80 * s, 4 * s, '#d9d9d9'); line(g, x + 12 * s, by + 18 * s, x + 14 * s, by + 80 * s, 4 * s, '#d9d9d9'); }
  if (P.jersey) { line(g, x, by, x, hipY + bob, 4 * s, '#e9e9e9'); line(g, x - bw * 0.48, by + 40 * s, x - bw * 0.44, hipY, 6 * s, '#e9e9e9'); line(g, x + bw * 0.48, by + 40 * s, x + bw * 0.44, hipY, 6 * s, '#e9e9e9'); }
  if (P.hair === 'police') { fillRR(g, x + 20 * s, by + 40 * s, 30 * s, 36 * s, 4 * s, '#c9a24a'); line(g, x - bw * 0.45, by + 150 * s, x + bw * 0.45, by + 150 * s, 14 * s, '#0c1120', 'butt'); }
  // 腕
  const A = o.arms || [6, 0, 6, 0];
  const arm = (sx, sy, a1, a2, side) => {
    const r1 = a1 * Math.PI / 180 * side, r2 = (a1 + a2) * Math.PI / 180 * side, L = 230 * s;
    const ex = sx + Math.sin(r1) * L * 0.5, ey = sy + Math.cos(r1) * L * 0.5, hx = ex + Math.sin(r2) * L * 0.5, hy = ey + Math.cos(r2) * L * 0.5;
    line(g, sx, sy, ex, ey, 34 * s, P.top2); line(g, ex, ey, hx, hy, 30 * s, P.top2); circ(g, hx, hy, 17 * s, C.skin);
    if (P.tattoo && side > 0) { line(g, hx - 10 * s, hy - 26 * s, hx + 8 * s, hy - 14 * s, 3 * s, '#2a2a3a'); }
    if (o.gloves) circ(g, hx, hy, 18 * s, '#1d1d22');
    return [hx, hy];
  };
  const hl = arm(x - bw * 0.42, by + 20 * s, A[0], A[1], -1), hr = arm(x + bw * 0.42, by + 20 * s, A[2], A[3], 1);
  head(g, P, x + (o.turn || 0) * 6 * s, shY - r * 1.15 + bob, r, o);
  if (o.phone) { fillRR(g, hr[0] - 12 * s, hr[1] - 34 * s, 24 * s, 44 * s, 4 * s, '#0e0f14'); fillRR(g, hr[0] - 9 * s, hr[1] - 31 * s, 18 * s, 36 * s, 3 * s, '#cfe3ff'); glow(g, hr[0], hr[1] - 14 * s, 160 * s, 'rgba(170,200,255,1)', 0.35); }
  g.restore();
  return { headY: shY - r * 1.15, hl, hr };
}

// 顔のアップ（下からスマホの光）
export function close(g, P, o = {}) {
  const x = o.x ?? 540, y = o.y ?? 760, r = 66 * (o.s || 4);
  g.save();
  // 肩
  g.beginPath(); g.moveTo(x - r * 2.1, y + r * 3.2); g.quadraticCurveTo(x - r * 2.0, y + r * 1.25, x - r * 0.5, y + r * 1.05); g.lineTo(x + r * 0.5, y + r * 1.05); g.quadraticCurveTo(x + r * 2.0, y + r * 1.25, x + r * 2.1, y + r * 3.2); g.closePath();
  g.fillStyle = P.top; g.fill(); g.save(); g.clip(); g.beginPath(); g.rect(x - r * 2.2, y + r, r * 2.2, r * 3); toneFill(g, 'rgba(0,0,0,.45)', 10, 2.6); g.restore();
  if (P.hood) { g.beginPath(); g.ellipse(x, y + r * 1.1, r * 0.75, r * 0.3, 0, 0, Math.PI); g.fillStyle = P.top2; g.fill(); }
  head(g, P, x, y, r, o);
  if (o.phoneLight) { // 下からの青白い光
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y + r * 2.4, r * 0.2, x, y + r * 1.2, r * 2.4); gr.addColorStop(0, 'rgba(130,170,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 2, r * 6, r * 6); g.restore();
  }
  g.restore();
}

// ---------- 効果 ----------
// 集中線
export function speedLines(g, cx, cy, { n = 80, inner = 360, color = 'rgba(255,255,255,.85)', seed = 1, t = 0 } = {}) {
  const R = rng(seed + Math.floor(t * 12));
  g.save(); g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, w = 0.004 + R() * 0.012, r0 = inner * (0.8 + R() * 0.5);
    g.beginPath(); g.moveTo(cx + Math.cos(a - w) * 1600, cy + Math.sin(a - w) * 1600); g.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a + w) * 1600, cy + Math.sin(a + w) * 1600); g.fill();
  }
  g.restore();
}
// 擬音（筆っぽい太字＋白フチ）
export function sfxText(g, s, x, y, { size = 150, rot = -0.12, color = C.red, alpha = 1, shake = 0, t = 0 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.translate(x + noise1(t * 30, 1) * shake, y + noise1(t * 30, 2) * shake); g.rotate(rot);
  g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.22; g.strokeStyle = '#05060a'; g.strokeText(s, 0, 0);
  g.lineWidth = size * 0.1; g.strokeStyle = '#f4f1ea'; g.strokeText(s, 0, 0);
  g.fillStyle = color; g.fillText(s, 0, 0); g.restore();
}
// コマ割り：panels=[{x,y,w,h,draw, rot}] を黒い枠と白い溝で描く
export function panels(g, list, bg = '#05060a') {
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (const P of list) {
    if ((P.alpha ?? 1) <= 0) continue;
    g.save(); g.globalAlpha = P.alpha ?? 1;
    const dx = P.slide ? (1 - P.slide) * (P.from === 'right' ? 700 : -700) : 0;
    g.translate(P.x + P.w / 2 + dx, P.y + P.h / 2); g.rotate(P.rot || 0); g.translate(-P.w / 2, -P.h / 2);
    g.fillStyle = '#f4f1ea'; g.fillRect(-8, -8, P.w + 16, P.h + 16);
    g.save(); g.beginPath(); g.rect(0, 0, P.w, P.h); g.clip(); P.draw(g, P.w, P.h); g.restore();
    g.lineWidth = 5; g.strokeStyle = '#05060a'; g.strokeRect(0, 0, P.w, P.h);
    g.restore();
  }
}
// 赤寄せ・色抜け・ノイズ（感情の色）
export function mood(g, { red = 0, desat = 0, dark = 0, flicker = 0, t = 0 } = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (desat > 0) { g.globalCompositeOperation = 'saturation'; g.globalAlpha = desat; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); }
  if (red > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = red; g.fillStyle = '#ff3040'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.globalAlpha = red * 0.25; g.fillStyle = '#5a0010'; g.fillRect(0, 0, W, H); }
  if (dark > 0) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = dark; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  if (flicker > 0 && Math.sin(t * 53) > 0.6) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.25 * flicker; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  g.restore();
}

// ---------- チャット ----------
// カラスのアイコン
export function crowIcon(g, x, y, r) {
  circ(g, x, y, r, '#0b0b10'); g.lineWidth = r * 0.08; g.strokeStyle = C.red; g.beginPath(); g.arc(x, y, r * 0.96, 0, 7); g.stroke();
  g.save(); g.translate(x, y); g.scale(r / 50, r / 50);
  poly(g, [[-30, 8], [-6, -10], [6, -26], [20, -24], [32, -16], [20, -12], [14, 2], [28, 22], [6, 14], [-12, 24], [-8, 10]], C.red);
  circ(g, 14, -18, 3, '#0b0b10');
  g.restore();
}
function avatar(g, from, x, y, r) {
  if (from === 'karasu') return crowIcon(g, x, y, r);
  const col = { mom: '#d79a7a', senpai: '#7a9ad7', me: '#6a7385' }[from] || '#666';
  circ(g, x, y, r, col); text2(g, { mom: '母', senpai: '先', me: '俺' }[from] || '', x, y + 2, r * 1.0, '#fff');
}
function text2(g, s, x, y, size, color, align = 'center', weight = 800) { g.save(); g.font = `${weight} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, x, y); g.restore(); }
function wrap(g, s, maxW) { const out = []; let cur = ''; for (const ch of s) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; }

// msgs: [{t, from, text?, img?(g,w,h), h?, read?}] t=表示時刻(秒・このチャットの時間軸)。title=相手名
// 画面上部に「スマホの画面」として描く。返り値なし
export function chat(g, msgs, t, { title = 'カラス', x = 70, y = 150, w = 940, h = 900, typing = null, alpha = 1, glow: gl = 1, scroll = true } = {}) {
  g.save(); g.globalAlpha = alpha;
  // 画面
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50;
  fillRR(g, x, y, w, h, 46, '#0d1019'); g.shadowColor = 'transparent';
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.08)'; rr(g, x, y, w, h, 46); g.stroke();
  // ヘッダ
  fillRR(g, x, y, w, 110, 46, '#141927'); g.fillStyle = '#141927'; g.fillRect(x, y + 60, w, 50);
  if (title === 'カラス') crowIcon(g, x + 80, y + 56, 30); else avatar(g, title === '母' ? 'mom' : 'senpai', x + 80, y + 56, 30);
  text2(g, title, x + 130, y + 56, 38, '#e9edf5', 'left');
  line(g, x, y + 110, x + w, y + 110, 2, 'rgba(255,255,255,.06)', 'butt');
  // 吹き出し
  g.save(); rr(g, x, y + 112, w, h - 112, 0); g.clip();
  g.font = `800 46px ${FONT}`;
  const shown = msgs.filter(m => t >= m.t);
  // 下から積む
  let cy = y + h - 40;
  const lay = [];
  for (let i = shown.length - 1; i >= 0; i--) {
    const m = shown[i]; const mine = m.from === 'me';
    let bh, lines = [];
    if (m.img) bh = m.h || 420; else { lines = String(m.text).split('\n').flatMap(x => wrap(g, x, w * 0.62)); bh = lines.length * 62 + 44; }
    cy -= bh; lay.push({ m, mine, bh, lines, y: cy }); cy -= 34;
  }
  if (typing && t >= typing[0] && t < typing[1]) {
    // 入力中…
    const ty = y + h - 40 - 70; for (const L of lay) L.y -= 100;
    fillRR(g, x + 130, ty, 150, 70, 35, '#252b3b');
    for (let k = 0; k < 3; k++) circ(g, x + 170 + k * 36, ty + 35 + Math.sin(t * 9 + k) * 6, 9, '#9aa5bb');
  }
  for (const L of lay) {
    const { m, mine, bh, lines } = L;
    const age = t - m.t, pop = back(clamp(age / 0.22)), a = clamp(age / 0.12);
    g.save(); g.globalAlpha *= a;
    const bw = m.img ? w * 0.66 : Math.min(w * 0.66, Math.max(...lines.map(s => g.measureText(s).width)) + 56);
    const bx = mine ? x + w - 40 - bw : x + 130;
    g.translate(bx + (mine ? bw : 0), L.y + bh / 2); g.scale(lerp(0.85, 1, pop), lerp(0.85, 1, pop)); g.translate(-(bx + (mine ? bw : 0)), -(L.y + bh / 2));
    if (!mine) avatar(g, m.from, x + 70, L.y + 32, 30);
    const col = mine ? '#2f6bd8' : (m.from === 'karasu' ? '#1c1f2b' : '#e9ecf2');
    fillRR(g, bx, L.y, bw, bh, 30, col);
    if (m.from === 'karasu') { g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.85); rr(g, bx, L.y, bw, bh, 30); g.stroke(); }
    if (m.img) { g.save(); rr(g, bx + 12, L.y + 12, bw - 24, bh - 24, 22); g.clip(); g.translate(bx + 12, L.y + 12); m.img(g, bw - 24, bh - 24, t); g.restore(); }
    else lines.forEach((s, i) => text2(g, s, bx + 28, L.y + 44 + i * 62, 46, mine ? '#fff' : (m.from === 'karasu' ? '#f1f1f4' : '#1a1d26'), 'left'));
    if (mine) text2(g, m.read === false ? '' : (m.read ? '既読' : ''), bx - 14, L.y + bh - 18, 24, '#9aa5bb', 'right', 500);
    g.restore();
  }
  g.restore();
  g.restore();
}

// ---------- タイマー（残り時間） ----------
export function timer(g, secLeft, { y = 250, alpha = 1, t = 0 } = {}) {
  if (alpha <= 0) return;
  const s = Math.max(0, Math.floor(secLeft)), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss2 = s % 60;
  const str = `${hh}:${String(mm).padStart(2, '0')}:${String(ss2).padStart(2, '0')}`;
  const urgent = clamp(1 - secLeft / 1800);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha;
  const pulse = urgent > 0.6 ? (Math.sin(t * 8) * 0.5 + 0.5) * 0.4 : 0;
  fillRR(g, 540 - 190, y - 46, 380, 92, 46, `rgba(10,10,16,${0.82})`);
  g.lineWidth = 4; g.strokeStyle = mix('#8ea3c0', '#ff2a40', urgent); rr(g, 540 - 190, y - 46, 380, 92, 46); g.stroke();
  if (pulse) { g.globalAlpha = alpha * pulse; fillRR(g, 540 - 190, y - 46, 380, 92, 46, '#ff2a40'); g.globalAlpha = alpha; }
  g.font = `800 26px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = mix('#8ea3c0', '#ff6a78', urgent); g.fillText('21:00まで', 540 - 160, y + 1);
  g.font = `600 54px "Noto Sans CJK JP", sans-serif`; g.fillStyle = mix('#f1f3f8', '#ff4257', urgent); g.textAlign = 'right'; g.fillText(str, 540 + 165, y + 3);
  g.restore();
}

// ---------- 字幕（黒い帯＋白文字、赤い傍線） ----------
function runs(s) { const out = []; const re = /\[\[([a-z]):([^\]]*)\]\]/g; let i = 0, m; while ((m = re.exec(s))) { if (m.index > i) out.push([s.slice(i, m.index), 0]); out.push([m[2], 1]); i = re.lastIndex; } if (i < s.length) out.push([s.slice(i), 0]); return out; }
export function subBand(g, s, { y = 1290, size = 60, alpha = 1, who = null, names = {} } = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha;
  g.font = `800 ${size}px ${FONT}`; g.textBaseline = 'middle';
  const chars = []; for (const [str, em] of runs(s)) for (const ch of str) chars.push([ch, em, g.measureText(ch).width]);
  const total = chars.reduce((a, c) => a + c[2], 0), maxW = 900;
  // 区切りの良いところで割る（target＝前半の幅の目安、restMax＝後半に許す幅）
  const split = (cs, target, restMax) => {
    const tot = cs.reduce((a, c) => a + c[2], 0); let best = 1, bs = -1e9, acc = 0; const txt = cs.map(c => c[0]).join('');
    for (let i = 1; i < cs.length - 1; i++) { acc += cs[i - 1][2]; const p = txt[i - 1], c = txt[i]; if ('、。！？…ーっゃゅょ」'.includes(c)) continue; let sc = -Math.abs(acc - target) / 40; if ('、。！？…'.includes(p)) sc += 30; else if ('はがをにでのとへもや'.includes(p) && !/[ぁ-ん]/.test(c)) sc += 10; else if ('はがをにでのとへもや'.includes(p)) sc += 3; else if (/[ぁ-ん]/.test(p) && /[一-龯ァ-ヴ0-9]/.test(c)) sc += 6; else if (/[ぁ-ん]/.test(p) && /[ぁ-ん]/.test(c)) sc -= 25; else sc -= 8; if (acc > maxW + 30 || tot - acc > restMax + 30) sc -= 100; if (sc > bs) { bs = sc; best = i; } }
    return [cs.slice(0, best), cs.slice(best)];
  };
  let lines = [chars];
  if (total > maxW * 1.9) { const [a, rest] = split(chars, total / 3, maxW * 2); lines = [a, ...split(rest, (total - a.reduce((x, c) => x + c[2], 0)) / 2, maxW)]; }
  else if (total > maxW) lines = split(chars, total / 2, maxW);
  const lh = size * 1.45, bandH = lines.length * lh + 34, y0 = y - bandH / 2;
  const bw = Math.max(...lines.map(l => l.reduce((a, c) => a + c[2], 0))) + 80;
  g.fillStyle = 'rgba(4,5,9,.78)'; g.fillRect(540 - bw / 2, y0, bw, bandH);
  if (who && names[who]) { g.font = `800 30px ${FONT}`; const nw = g.measureText(names[who]).width + 34; g.fillStyle = C.red; g.fillRect(540 - bw / 2, y0 - 44, nw, 44); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(names[who], 540 - bw / 2 + 17, y0 - 21); g.font = `800 ${size}px ${FONT}`; }
  g.textAlign = 'left';
  lines.forEach((ln, li) => {
    const lw = ln.reduce((a, c) => a + c[2], 0); let xx = 540 - lw / 2; const yy = y0 + 17 + lh / 2 + li * lh;
    for (const [ch, em, cw] of ln) { g.fillStyle = em ? '#ffffff' : '#e6e8ee'; g.fillText(ch, xx, yy); if (em) { g.fillStyle = C.red; g.fillRect(xx, yy + size * 0.56, cw, 7); } xx += cw; }
  });
  g.restore();
}
