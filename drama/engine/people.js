// 登場人物のイラスト（丸い頭・点の目・やわらかい体）。足元 (x,y) を基準に描く。
import { rr, fillRR, circ, ell, poly, line, rgba, glow } from './core.js';

export const SKIN = '#f3dcc2';
const INK = '#2b2530';

// 人物の定義（服・髪）
export const PEOPLE = {
  mio: { hair: 'bob', hairC: '#3a2722', top: '#e9dcc4', top2: '#c9b48f', inner: '#6f8fa8', bottom: '#2f3a52', shoes: '#dcd3c4', cheek: 0.35 },
  shiba: { hair: 'short', hairC: '#1f1c1e', top: '#8c949c', top2: '#6d747c', bottom: '#38404c', shoes: '#2a2a2e', strings: true, stubble: true, plaster: true },
  koto: { hair: 'pigtails', hairC: '#5a3a2a', top: '#f4d77c', top2: '#e8bf52', bottom: '#f4d77c', shoes: '#f0a6a0', child: true, dots: '#fff6d8', cheek: 0.55 },
  man: { hair: 'cap', hairC: '#1f1c1e', capC: '#26324a', top: '#2c3a55', top2: '#1f2a40', bottom: '#2c3a55', shoes: '#1e1e22', mask: true, stripe: '#c8d2c0', plaster: true },
  tenant: { hair: 'short', hairC: '#4a3a30', top: '#a65d4f', top2: '#874a3f', bottom: '#3a3a44', shoes: '#2a2a2e' },
  tenant2: { hair: 'bob', hairC: '#6b5446', top: '#5f7d6a', top2: '#4c6656', bottom: '#4a4652', shoes: '#2a2a2e' },
};

// 腕：肩から（a1 = 下向きから外への角度・度）ひじで a2 曲げる
function arm(g, sx, sy, a1, a2, L, w, sleeve, skin, s, plaster) {
  const r1 = a1 * Math.PI / 180, r2 = (a1 + a2) * Math.PI / 180;
  const ex = sx + Math.sin(r1) * L * 0.52, ey = sy + Math.cos(r1) * L * 0.52;
  const hx = ex + Math.sin(r2) * L * 0.5, hy = ey + Math.cos(r2) * L * 0.5;
  line(g, sx, sy, ex, ey, w, sleeve); line(g, ex, ey, hx, hy, w * 0.92, sleeve);
  circ(g, hx, hy, w * 0.62, skin);
  if (plaster) { g.save(); g.translate(hx, hy); g.rotate(-r2); fillRR(g, -w * 0.5, w * 0.15, w * 0.55, w * 0.32, 4, '#e9c79a'); g.restore(); }
  return [hx, hy];
}

// 顔のパーツ
export function face(g, hx, hy, r, P, o = {}) {
  const turn = o.turn || 0, lx = (o.lookX || 0) * r * 0.08, ly = (o.lookY || 0) * r * 0.06;
  const fx = hx + turn * r * 0.33;
  const ey = hy + r * 0.08 + ly, sep = r * 0.36 * (1 - Math.abs(turn) * 0.25);
  const eyes = o.eyes || 'dot';
  const blink = o.blink;
  for (const side of [-1, 1]) {
    const ex = fx + side * sep + lx;
    if (blink || eyes === 'closed') { line(g, ex - r * 0.09, ey, ex + r * 0.09, ey, r * 0.045, INK); }
    else if (eyes === 'wide') { circ(g, ex, ey, r * 0.15, '#fff'); g.lineWidth = r * 0.03; g.strokeStyle = INK; g.beginPath(); g.arc(ex, ey, r * 0.15, 0, 7); g.stroke(); circ(g, ex + lx * 0.5, ey, r * 0.075, INK); }
    else if (eyes === 'squint') { g.beginPath(); g.arc(ex, ey + r * 0.04, r * 0.09, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = r * 0.045; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); }
    else circ(g, ex, ey, r * 0.085, INK);
    // まゆ：brow > 0 で怒り、< 0 で困り
    const br = o.brow || 0, by = ey - r * 0.26 - Math.abs(br) * r * 0.03;
    const tilt = side * br * r * 0.07;
    line(g, ex - r * 0.1, by + tilt, ex + r * 0.1, by - tilt, r * 0.045, INK);
  }
  if (P.cheek && !P.mask) { circ(g, fx - sep * 1.25, ey + r * 0.24, r * 0.11, rgba('#f19a8e', P.cheek)); circ(g, fx + sep * 1.25, ey + r * 0.24, r * 0.11, rgba('#f19a8e', P.cheek)); }
  if (P.stubble && !P.mask) for (let i = 0; i < 9; i++) circ(g, fx + (i - 4) * r * 0.09, hy + r * 0.62 + Math.abs(i - 4) * -r * 0.03, r * 0.018, rgba('#3a3036', 0.45));
  if (P.mask) {
    rr(g, fx - r * 0.62, hy + r * 0.18, r * 1.24, r * 0.62, r * 0.28); g.fillStyle = '#eef0f2'; g.fill();
    line(g, fx - r * 0.5, hy + r * 0.38, fx + r * 0.5, hy + r * 0.38, r * 0.025, '#c9ced4'); line(g, fx - r * 0.5, hy + r * 0.56, fx + r * 0.5, hy + r * 0.56, r * 0.025, '#c9ced4');
    return;
  }
  const my = hy + r * 0.46, mo = o.mouth || 'line', talk = o.talk || 0;
  if (talk > 0.05) { ell(g, fx, my + r * 0.02, r * 0.11, r * 0.05 + r * 0.12 * talk, '#7a3a3e'); }
  else if (mo === 'smile') { g.beginPath(); g.arc(fx, my - r * 0.08, r * 0.14, Math.PI * 0.2, Math.PI * 0.8); g.lineWidth = r * 0.045; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); }
  else if (mo === 'frown') { g.beginPath(); g.arc(fx, my + r * 0.12, r * 0.13, Math.PI * 1.2, Math.PI * 1.8); g.lineWidth = r * 0.045; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); }
  else if (mo === 'o') ell(g, fx, my + r * 0.02, r * 0.08, r * 0.1, '#7a3a3e');
  else if (mo === 'shout') { ell(g, fx, my + r * 0.05, r * 0.16, r * 0.18, '#7a3a3e'); ell(g, fx, my + r * 0.13, r * 0.1, r * 0.06, '#d77a7a'); }
  else line(g, fx - r * 0.09, my, fx + r * 0.09, my, r * 0.042, INK);
  if (o.sweat) { const sx = hx + r * 0.78, sy = hy - r * 0.2 + (o.sweat % 1) * r * 0.2; poly(g, [[sx, sy - r * 0.16], [sx - r * 0.07, sy], [sx + r * 0.07, sy]], '#9fd3ff'); circ(g, sx, sy, r * 0.07, '#9fd3ff'); }
}

function hairBack(g, hx, hy, r, P, turn) {
  const c = P.hairC;
  if (P.hair === 'bob') { rr(g, hx - r * 1.1 + turn * r * 0.1, hy - r * 1.02, r * 2.2, r * 1.85, r * 0.85); g.fillStyle = c; g.fill(); }
  if (P.hair === 'pigtails') {
    for (const s of [-1, 1]) { ell(g, hx + s * r * 1.12, hy + r * 0.25, r * 0.36, r * 0.52, c, s * 0.35); circ(g, hx + s * r * 0.92, hy - r * 0.05, r * 0.11, '#f0868e'); }
  }
}
function hairFront(g, hx, hy, r, P, turn) {
  const c = P.hairC, t = turn * r * 0.25;
  if (P.hair === 'bob') {
    g.beginPath(); g.moveTo(hx - r * 1.05, hy + r * 0.1); g.quadraticCurveTo(hx - r * 1.1, hy - r * 1.15, hx + t, hy - r * 1.08);
    g.quadraticCurveTo(hx + r * 1.1, hy - r * 1.12, hx + r * 1.05, hy + r * 0.1);
    g.lineTo(hx + r * 0.82, hy - r * 0.2); g.quadraticCurveTo(hx + r * 0.3 + t, hy - r * 0.5, hx - r * 0.15 + t, hy - r * 0.28);
    g.quadraticCurveTo(hx - r * 0.55 + t, hy - r * 0.48, hx - r * 0.82, hy - r * 0.15); g.closePath(); g.fillStyle = c; g.fill();
    ell(g, hx - r * 0.35 + t, hy - r * 0.78, r * 0.32, r * 0.08, 'rgba(255,255,255,.12)', -0.3);
  } else if (P.hair === 'short') {
    g.beginPath(); g.moveTo(hx - r * 0.98, hy - r * 0.05); g.quadraticCurveTo(hx - r * 1.05, hy - r * 1.12, hx + t, hy - r * 1.1);
    g.quadraticCurveTo(hx + r * 1.08, hy - r * 1.1, hx + r * 0.98, hy - r * 0.05); g.lineTo(hx + r * 0.86, hy - r * 0.4);
    g.quadraticCurveTo(hx + t, hy - r * 0.62, hx - r * 0.86, hy - r * 0.4); g.closePath(); g.fillStyle = c; g.fill();
  } else if (P.hair === 'pigtails') {
    g.beginPath(); g.moveTo(hx - r * 0.98, hy + r * 0.05); g.quadraticCurveTo(hx - r * 1.05, hy - r * 1.12, hx + t, hy - r * 1.08);
    g.quadraticCurveTo(hx + r * 1.08, hy - r * 1.1, hx + r * 0.98, hy + r * 0.05); g.lineTo(hx + r * 0.8, hy - r * 0.3);
    g.quadraticCurveTo(hx + t, hy - r * 0.42, hx - r * 0.8, hy - r * 0.3); g.closePath(); g.fillStyle = c; g.fill();
  } else if (P.hair === 'cap') {
    g.beginPath(); g.moveTo(hx - r * 1.02, hy - r * 0.18); g.quadraticCurveTo(hx - r * 1.02, hy - r * 1.15, hx, hy - r * 1.12); g.quadraticCurveTo(hx + r * 1.02, hy - r * 1.15, hx + r * 1.02, hy - r * 0.18); g.closePath(); g.fillStyle = P.capC; g.fill();
    rr(g, hx - r * 1.15 + t, hy - r * 0.3, r * 2.3, r * 0.2, r * 0.1); g.fillStyle = '#1a2235'; g.fill();
    circ(g, hx, hy - r * 1.1, r * 0.07, '#1a2235');
  }
}

// 人物1人。o: x,y（足元）, s（大きさ）, turn, eyes, brow, mouth, talk, arms:[左a1,a2,右a1,a2], walk（歩きの位相）, crouch, blink, sweat, hold
export function person(g, P, o = {}) {
  const s = (o.s || 1) * (P.child ? 0.62 : 1), x = o.x || 0, y = o.y || 0, turn = o.turn || 0;
  const hs = P.child ? 1.32 : 1;
  const r = 66 * s * hs;
  const crouch = o.crouch || 0;
  const legL = 180 * s * (1 - crouch * 0.45), bodyH = 205 * s;
  const hipY = y - legL, shY = hipY - bodyH;
  const bob = o.walk != null ? Math.abs(Math.sin(o.walk * Math.PI)) * -6 * s : 0;
  const hx = x + turn * 6 * s, hy = shY - r * 0.92 + bob + (o.headDy || 0) * s;
  g.save();
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  // 影
  ell(g, x, y + 4 * s, 95 * s, 16 * s, 'rgba(0,0,0,.18)');
  // 脚
  const sw = o.walk != null ? Math.sin(o.walk * Math.PI * 2) * 22 : 0;
  for (const side of [-1, 1]) {
    const lx = x + side * 30 * s, kx = lx + (crouch ? side * 38 * s : 0), ang = side * sw * Math.PI / 180;
    const fx = lx + Math.sin(ang) * legL, fy = hipY + Math.cos(ang) * legL + bob;
    if (crouch) { line(g, lx, hipY + bob, kx, hipY + legL * 0.5, 44 * s, P.bottom, 'round'); line(g, kx, hipY + legL * 0.5, lx, y - 8 * s, 42 * s, P.bottom); ell(g, lx + side * 6 * s, y - 6 * s, 30 * s, 14 * s, P.shoes); }
    else { line(g, lx, hipY + bob, fx, fy - 10 * s, 44 * s, P.bottom, 'butt'); ell(g, fx + turn * 10 * s, fy - 8 * s, 32 * s, 15 * s, P.shoes); }
  }
  // 体
  const bw = 150 * s, by = shY + bob;
  g.beginPath(); g.moveTo(x - bw * 0.5, by + 25 * s); g.quadraticCurveTo(x - bw * 0.52, by, x - bw * 0.3, by - 4 * s);
  g.lineTo(x + bw * 0.3, by - 4 * s); g.quadraticCurveTo(x + bw * 0.52, by, x + bw * 0.5, by + 25 * s);
  g.lineTo(x + bw * 0.46, hipY + 22 * s + bob); g.quadraticCurveTo(x, hipY + 34 * s + bob, x - bw * 0.46, hipY + 22 * s + bob); g.closePath();
  g.fillStyle = P.top; g.fill();
  if (P.inner) { poly(g, [[x - 18 * s, by - 2 * s], [x + 18 * s, by - 2 * s], [x + 10 * s, hipY + 20 * s + bob], [x - 10 * s, hipY + 20 * s + bob]], P.inner); line(g, x - 20 * s, by, x - 14 * s, hipY + 20 * s + bob, 5 * s, P.top2); line(g, x + 20 * s, by, x + 14 * s, hipY + 20 * s + bob, 5 * s, P.top2); }
  if (P.strings) { line(g, x - 14 * s, by + 8 * s, x - 16 * s, by + 70 * s, 4 * s, '#e6e6e6'); line(g, x + 14 * s, by + 8 * s, x + 16 * s, by + 70 * s, 4 * s, '#e6e6e6'); rr(g, x - 45 * s, hipY - 60 * s + bob, 90 * s, 46 * s, 12 * s); g.fillStyle = P.top2; g.fill(); }
  if (P.stripe) { line(g, x - bw * 0.48, by + 95 * s, x + bw * 0.48, by + 95 * s, 12 * s, P.stripe, 'butt'); fillRR(g, x + 20 * s, by + 30 * s, 34 * s, 22 * s, 3 * s, '#e8e8e8'); }
  if (P.dots) for (let i = 0; i < 7; i++) circ(g, x + ((i * 37) % 100 - 50) * s, by + 30 * s + ((i * 53) % 150) * s, 6 * s, P.dots);
  // 首
  // 腕
  const A = o.arms || [8, 0, 8, 0];
  const aw = 34 * s, L = 200 * s;
  const handL = arm(g, x - bw * 0.43, by + 18 * s, -A[0], -A[1], L, aw, P.top2, SKIN, s, false);
  const handR = arm(g, x + bw * 0.43, by + 18 * s, A[2], A[3], L, aw, P.top2, SKIN, s, P.plaster && o.showPlaster !== false);
  // 頭
  hairBack(g, hx, hy, r, P, turn);
  if (P.hair !== 'cap') { circ(g, hx - r * 0.96 + turn * r * 0.3, hy + r * 0.08, r * 0.17, SKIN); circ(g, hx + r * 0.96 + turn * r * 0.3, hy + r * 0.08, r * 0.17, SKIN); }
  circ(g, hx, hy, r, SKIN);
  face(g, hx, hy, r, P, o);
  hairFront(g, hx, hy, r, P, turn);
  if (o.hold === 'phoneLight') { glow(g, handR[0], handR[1] - 10 * s, 120 * s, 'rgba(255,240,200,.9)', 0.7); fillRR(g, handR[0] - 14 * s, handR[1] - 30 * s, 28 * s, 46 * s, 5 * s, '#1c1c22'); circ(g, handR[0], handR[1] - 22 * s, 6 * s, '#fffbe8'); }
  if (o.hold === 'flashlight') { fillRR(g, handR[0] - 12 * s, handR[1] - 40 * s, 24 * s, 60 * s, 6 * s, '#3a3f4a'); circ(g, handR[0], handR[1] - 40 * s, 14 * s, '#fff6d0'); glow(g, handR[0], handR[1] - 40 * s, 160 * s, 'rgba(255,240,190,1)', 0.55); }
  if (o.hold === 'clipboard') { g.save(); g.translate(handL[0] + 10 * s, handL[1] - 30 * s); g.rotate(-0.15); fillRR(g, -40 * s, -55 * s, 80 * s, 110 * s, 6 * s, '#b58a5a'); fillRR(g, -33 * s, -45 * s, 66 * s, 92 * s, 3 * s, '#f4f1ea'); for (let i = 0; i < 4; i++) line(g, -24 * s, (-28 + i * 20) * s, 24 * s, (-28 + i * 20) * s, 4 * s, '#c8c3b6'); g.restore(); }
  if (o.hold === 'mug') { fillRR(g, handR[0] - 20 * s, handR[1] - 34 * s, 40 * s, 44 * s, 8 * s, '#d9e4ea'); }
  g.restore();
  return { hx, hy, r, handL, handR };
}

// 顔だけの大写し（肩から上）
export function bust(g, P, o = {}) {
  const x = o.x ?? 540, y = o.y ?? 900, s = o.s || 4;
  const r = 66 * s * (P.child ? 1.1 : 1);
  g.save();
  // 肩
  const shY = y + r * 1.05;
  g.beginPath(); g.moveTo(x - r * 1.7, shY + r * 1.6); g.quadraticCurveTo(x - r * 1.75, shY, x - r * 0.4, shY - r * 0.1); g.lineTo(x + r * 0.4, shY - r * 0.1); g.quadraticCurveTo(x + r * 1.75, shY, x + r * 1.7, shY + r * 1.6); g.closePath(); g.fillStyle = P.top; g.fill();
  if (P.inner) poly(g, [[x - r * 0.28, shY - r * 0.1], [x + r * 0.28, shY - r * 0.1], [x + r * 0.15, shY + r * 1.6], [x - r * 0.15, shY + r * 1.6]], P.inner);
  if (P.stripe) line(g, x - r * 1.72, shY + r * 0.9, x + r * 1.72, shY + r * 0.9, r * 0.14, P.stripe, 'butt');
  if (P.strings) { line(g, x - r * 0.2, shY, x - r * 0.24, shY + r * 0.9, r * 0.05, '#e6e6e6'); line(g, x + r * 0.2, shY, x + r * 0.24, shY + r * 0.9, r * 0.05, '#e6e6e6'); }
  rr(g, x - r * 0.28, y + r * 0.6, r * 0.56, r * 0.5, r * 0.1); g.fillStyle = '#e6cbb0'; g.fill();
  hairBack(g, x, y, r, P, o.turn || 0);
  if (P.hair !== 'cap') { circ(g, x - r * 0.96, y + r * 0.08, r * 0.17, SKIN); circ(g, x + r * 0.96, y + r * 0.08, r * 0.17, SKIN); }
  circ(g, x, y, r, SKIN);
  face(g, x, y, r, P, o);
  hairFront(g, x, y, r, P, o.turn || 0);
  g.restore();
  return { r };
}
