import * as THREE from 'three';
import { clamp, easeBack, mat, box, makePerson, SKIN } from './lib.js';

// =====================================================
// 風刺回（0623〜）でつかう小物：おぢ・女性・部屋・スマホ・看板・檻
// =====================================================

const OSHIRT = ['#59606e', '#e9e4da', '#7a6a55', '#8a8f99', '#c9c2b0', '#6b7a5a', '#a35d4f'];
const OPANTS = ['#2b3346', '#3b3f4a', '#5a4a3a', '#1f2430'];
// おぢ（はげ・白髪・おなか・ひげ）
function makeOji(r, extra = {}) {
  const shirt = extra.shirt || OSHIRT[Math.floor(r() * OSHIRT.length)];
  const p = makePerson({ skin: SKIN[Math.floor(r() * SKIN.length)], hair: r() < 0.6 ? '#9a9a9a' : '#3a3330', bald: r() < 0.7, shirt, pants: OPANTS[Math.floor(r() * OPANTS.length)], tie: false, scale: 0.95 + r() * 0.1, ...extra });
  const belly = box(0.48, 0.36, 0.18, mat(shirt)); belly.position.set(0, 1.02, 0.18); p.add(belly);
  if (r() < 0.55) { const ms = box(0.17, 0.045, 0.02, mat('#2a2220')); ms.position.set(0, 0.14, 0.196); p.userData.head.add(ms); }
  p.userData.ph = r() * 6.28;
  return p;
}
// 若い女性（髪はまとめ髪・ロングを作り直し：前髪と横の毛を顔にかぶせない）
function makeWoman(opt = {}) {
  const p = makePerson({ skin: opt.skin || '#f5d3b5', hair: opt.hair || '#3a2620', shirt: opt.shirt || '#f29bbb', pants: opt.pants || '#2b3346', long: true, skirt: !!opt.skirt, scale: opt.scale || 0.96 });
  p.userData.ph = 0;
  return p;
}
function makeMan(opt = {}) {
  const p = makePerson({ skin: opt.skin || '#f1c9a5', hair: opt.hair || '#1d1a19', shirt: opt.shirt || '#4f6a8f', pants: opt.pants || '#2b3346', scale: opt.scale || 1, bald: !!opt.bald });
  p.userData.ph = 0;
  return p;
}
// 文字の看板。2026/11/03 ゆうとの指摘（座布団が短くて文字が切れる・角が欠ける）で作り直し：
//  ・文字の幅を測って、左右に文字の高さ0.5個分以上の余白が出るまでキャンバスを横に広げる（文字の大きさは変えない）
//  ・上下も文字の高さの1.55倍以上を確保。座布団は角丸四角で、キャンバスの端から少し内側に描く
//  ・壁や机にめり込んで角が欠けないよう、座布団つきの看板は depthTest なしで手前に描く
//  ・set(s) で文字を変えても同じ幅に収まらないときは、その幅に収まるように文字を縮める
const FONT = (px) => `900 ${px}px "Noto Sans CJK JP", sans-serif`;
const _mc = document.createElement('canvas').getContext('2d');
function label(text, { w = 768, h = 192, size = 110, color = '#fff', bg = null, stroke = 0, strokeColor, sx = 4, radius } = {}) {
  _mc.font = FONT(size);
  const tw = _mc.measureText(text).width + stroke;
  const padX = bg ? size * 0.55 : size * 0.15;
  const H = Math.max(h, Math.ceil(size * (bg ? 1.55 : 1.3)));
  const W = Math.max(w, Math.ceil(tw + padX * 2 + 16));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = (str) => {
    const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
    if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, radius ?? Math.min(28, (H - 16) / 4)); g.fill(); }
    let px = size; g.font = FONT(px);
    while (px > 20 && g.measureText(str).width + stroke > W - padX * 2 - 16) { px -= 4; g.font = FONT(px); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = strokeColor || 'rgba(0,0,0,.6)'; g.strokeText(str, W / 2, H / 2 + px * 0.04); }
    g.fillStyle = color; g.fillText(str, W / 2, H / 2 + px * 0.04); tex.needsUpdate = true;
  };
  draw(text);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: !bg }));
  if (bg) sp.renderOrder = 6;
  const fit = W / w;
  sp.userData.sx = sx; sp.userData.fit = fit; sp.userData.ar = H / W;
  sp.scale.set(sx * fit, sx * fit * H / W, 1);
  let cur = text; sp.userData.set = (str) => { if (str !== cur) { cur = str; draw(str); } };
  // 大きさを決める（sx は元の w のときの横幅。文字の大きさが変わらないように fit を掛ける）
  sp.userData.size = (k) => sp.scale.set(k * fit, k * fit * H / W, 1);
  return sp;
}
function pop(sp, t, t0 = 0, dur = 0.35, sx = null) { const u = clamp((t - t0) / dur); sp.visible = u > 0; const s = (sx ?? sp.userData.sx) * (sp.userData.fit || 1) * easeBack(u); sp.scale.set(s, s * sp.userData.ar, 1); }
// 部屋（床＋奥の壁＋左の壁）
function makeRoom({ w = 8, d = 6, h = 3.4, wall = '#e8e1d6', floor = '#b48a5e' } = {}) {
  const g = new THREE.Group();
  const fl = box(w, 0.1, d, mat(floor)); fl.position.y = -0.05; g.add(fl);
  const bw = box(w, h, 0.12, mat(wall)); bw.position.set(0, h / 2, -d / 2); g.add(bw);
  const lw = box(0.12, h, d, mat(wall)); lw.position.set(-w / 2, h / 2, 0); g.add(lw);
  const rw = box(0.12, h, d, mat(wall)); rw.position.set(w / 2, h / 2, 0); g.add(rw);
  g.userData = { w, d, h, rw };
  return g;
}
// スマホ（画面は canvas。draw(g, w, h) で描き直す）
function makePhone({ w = 1, h = 2, cw = 540, ch = 1080 } = {}) {
  const g = new THREE.Group();
  const body = box(w, h, w * 0.09, mat('#15161c')); g.add(body);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.93), new THREE.MeshBasicMaterial({ map: tex })); scr.position.z = w * 0.046; g.add(scr);
  let key = null;
  function draw(k, fn) { if (k === key) return; key = k; const ctx = c.getContext('2d'); fn(ctx, cw, ch); tex.needsUpdate = true; }
  return { g, draw, scr };
}
// ネオン枠つきの店
function makeShop({ w = 5, h = 6, d = 3.4, body = '#2c2238', neon = '#ff5fae', text = '', textColor = '#fff' } = {}) {
  const g = new THREE.Group();
  const b = box(w, h, d, mat(body)); b.position.y = h / 2; g.add(b);
  const neonM = new THREE.MeshBasicMaterial({ color: neon });
  const top = h - 0.4, bot = h - 2.2;
  for (const [ww, hh, x, y] of [[w - 0.4, 0.12, 0, top], [w - 0.4, 0.12, 0, bot], [0.12, top - bot, -(w - 0.4) / 2, (top + bot) / 2], [0.12, top - bot, (w - 0.4) / 2, (top + bot) / 2]]) { const n = box(ww, hh, 0.12, neonM); n.position.set(x, y, d / 2 + 0.06); n.castShadow = false; g.add(n); }
  const sign = label(text, { size: 120, color: textColor, stroke: 18, strokeColor: neon, sx: w - 0.8 }); sign.position.set(0, (top + bot) / 2, d / 2 + 0.3); sign.material.depthTest = false; sign.renderOrder = 4; g.add(sign);
  const light = new THREE.PointLight(new THREE.Color(neon), 24, 14, 1.6); light.position.set(0, top - 1, d / 2 + 3); g.add(light);
  const col = new THREE.Color(neon), dark = new THREE.Color('#2a2430');
  function on(k) { neonM.color.copy(dark).lerp(col, k); sign.material.opacity = 0.1 + 0.9 * k; light.intensity = 24 * k; }
  return { g, on, sign, neonM, light };
}
// 檻（四角い格子）
function makeCage(w = 6, h = 6, d = 4, color = '#c9ced8') {
  const g = new THREE.Group(); const m = mat(color);
  const n = Math.round(w / 0.6);
  for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n; for (const z of [-d / 2, d / 2]) { const b = box(0.1, h, 0.1, m); b.position.set(x, h / 2, z); g.add(b); } }
  const nd = Math.round(d / 0.6);
  for (let i = 1; i < nd; i++) { const z = -d / 2 + i * d / nd; for (const x of [-w / 2, w / 2]) { const b = box(0.1, h, 0.1, m); b.position.set(x, h / 2, z); g.add(b); } }
  for (const y of [0.05, h]) { const t = box(w + 0.2, 0.14, d + 0.2, m); t.position.y = y; if (y > 1) g.add(t); }
  return g;
}

export { makeOji, makeWoman, makeMan, label, pop, makeRoom, makePhone, makeShop, makeCage };
