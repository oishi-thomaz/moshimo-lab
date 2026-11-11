import * as THREE from 'three';
import { clamp, lerp, mat, box } from '../lib.js';

// =====================================================
// home：皮肉回の 家・学校・お店の小物（0670〜0679 から）
//  makeSet({bg, ground})：空と地面と光だけのシーン。flat(w,d,色,x,z) で地面に重ねる面（チラつかない順で描く）、
//    room({x, z, w, d, h, wall, floor, left, right}) で床＋奥の壁＋左右の壁の部屋（userData.walls）
//  makeKotatsu()：こたつ（天板・布団・みかん）。makeCounter({w})：台所（流し・コンロ・吊り戸棚。userData.stove・sink は上の位置）
//  makePot(色)：鍋（userData.lid）。makeDishes(n)：皿の山（userData.setN(k)）。makeMochiGrill()：餅を焼く網
//  makeFridge()：冷蔵庫（userData.open(k) で扉が開いて中が光る。userData.shelf に物を置ける）
//  makeMirror(w, h)：鏡（洗面台つき）。makeTub()：湯船（userData.setWater(k)）。makeSteam(n)：湯気（userData.set(k, t)）
//  makeBed()：ベッドと布団。makeAlarm()：デジタルの目覚まし（userData.set(文字, 色)）
//  makePipeChair(色)：パイプ椅子。makeTent()：運動会のテント（userData.setUp(k) で立つ）。makeLotBox()：くじの箱
//  makeGift({color, ribbon})：リボンの箱（userData.tag は値札。tagOut(k) で飛び出す）
//  makePochi(色)：ポチ袋。makeShaker(色)・makeProteinBag()：シェイカーとプロテインの袋（文字なし）
//  makeBench()：駅前のベンチ。makeTrash()：ゴミ箱（userData.lid）。makeGlass({beer})：グラス
//  makeTable({w, d, color})：4本脚のテーブル。makeShelf({w, h, colors})：商品の並んだ棚
// =====================================================

function makeSet({ bg = '#a8cce8', ground = '#8a9078', fogFar = 240 } = {}) {
  const S = new THREE.Scene();
  S.background = new THREE.Color(bg); S.fog = new THREE.Fog(new THREE.Color(bg), 60, fogFar);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(1600, 800), mat(ground, { depthWrite: false })); gr.rotation.x = -Math.PI / 2; gr.renderOrder = -0.9; S.add(gr);
  function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
  function room({ x = 0, z = 0, w = 9, d = 7, h = 3.2, wall = '#efe6d6', floor = '#b48a5e', left = true, right = false } = {}) {
    const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
    const fl = box(w, 0.1, d + 8, mat(floor)); fl.position.set(0, -0.05, 4); fl.castShadow = false; g.add(fl);
    const bw = box(w, h, 0.14, mat(wall)); bw.position.set(0, h / 2, -d / 2); g.add(bw);
    const walls = [bw];
    if (left) { const lw = box(0.14, h, d, mat(wall)); lw.position.set(-w / 2, h / 2, 0); g.add(lw); walls.push(lw); }
    if (right) { const rw = box(0.14, h, d, mat(wall)); rw.position.set(w / 2, h / 2, 0); g.add(rw); walls.push(rw); }
    const sk = box(w, 0.1, 0.04, mat('#b8ab98')); sk.position.set(0, 0.05, -d / 2 + 0.09); g.add(sk);
    g.userData = { walls, w, d, h };
    return g;
  }
  return { S, hemi, sun, ground: gr, flat, room };
}

function makeKotatsu({ futon = '#c0504a' } = {}) {
  const g = new THREE.Group();
  const f = box(2.0, 0.42, 2.0, mat(futon)); f.position.y = 0.21; g.add(f);
  const top = box(1.5, 0.06, 1.5, mat('#8a5a34')); top.position.y = 0.45; g.add(top);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.1, 14), mat('#d8c8a8')); bowl.position.set(0.3, 0.53, -0.3); g.add(bowl);
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), mat('#f08a2b', { flatShading: true })); m.position.set(0.24 + (i - 1) * 0.12, 0.62, -0.3 + (i % 2) * 0.06); g.add(m); }
  g.userData = { top, topY: 0.48 };
  return g;
}

function makeCounter({ w = 4.2, color = '#ece8e0' } = {}) {
  const g = new THREE.Group();
  const c = box(w, 0.9, 0.7, mat(color)); c.position.y = 0.45; g.add(c);
  const tp = box(w, 0.05, 0.74, mat('#9aa0a8')); tp.position.y = 0.92; g.add(tp);
  const sink = box(0.8, 0.04, 0.45, mat('#c0c6cc')); sink.position.set(-w / 2 + 0.9, 0.95, 0); g.add(sink);
  const tap = box(0.05, 0.4, 0.05, mat('#b8bec6')); tap.position.set(-w / 2 + 0.9, 1.15, -0.28); g.add(tap);
  const stove = box(0.9, 0.03, 0.55, mat('#22252b')); stove.position.set(w / 2 - 0.9, 0.95, 0); g.add(stove);
  for (let i = 0; i < 3; i++) { const d = box(w / 3 - 0.1, 0.04, 0.05, mat('#b8ab98')); d.position.set(-w / 3 + i * w / 3, 0.62, 0.36); g.add(d); }
  const up = box(w * 0.8, 0.7, 0.4, mat(color)); up.position.set(-0.2, 2.35, -0.15); g.add(up);
  g.userData = { stove: new THREE.Vector3(w / 2 - 0.9, 0.97, 0), sink: new THREE.Vector3(-w / 2 + 0.9, 0.97, 0) };
  return g;
}
function makePot(color = '#3b3f47') {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.24, 18), mat(color)); b.position.y = 0.12; g.add(b);
  const inside = new THREE.Mesh(new THREE.CircleGeometry(0.23, 18), mat('#2a1612')); inside.rotation.x = -Math.PI / 2; inside.position.y = 0.2; g.add(inside);
  for (const s of [-1, 1]) { const h = box(0.1, 0.04, 0.05, mat('#222')); h.position.set(s * 0.31, 0.2, 0); g.add(h); }
  const lid = new THREE.Group(); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 18), mat('#9aa0a8')); lid.add(l); const k = box(0.06, 0.05, 0.06, mat('#222')); k.position.y = 0.04; lid.add(k); lid.position.y = 0.26; g.add(lid);
  g.userData = { lid, inside };
  return g;
}
function makeDishes(n = 12) {
  const g = new THREE.Group(); const D = [];
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.04, 16), mat(i % 3 ? '#f4f2ec' : '#c8d8e8')); d.position.set((i % 2) * 0.02, 0.03 + i * 0.045, 0); g.add(d); D.push(d); }
  g.userData.setN = (k) => D.forEach((d, i) => d.visible = i < Math.round(k * n));
  return g;
}
function makeMochiGrill() {
  const g = new THREE.Group();
  const net = box(0.5, 0.02, 0.4, mat('#555b62')); net.position.y = 0.04; g.add(net);
  const M = []; for (let i = 0; i < 4; i++) { const m = box(0.14, 0.06, 0.1, mat('#f6f2e6')); m.position.set(-0.15 + (i % 2) * 0.28, 0.08, -0.09 + Math.floor(i / 2) * 0.18); g.add(m); M.push(m); }
  g.userData.puff = (k) => M.forEach((m, i) => { m.scale.y = 1 + k * (1.4 + i * 0.2); m.material.color.set(k > 0.6 ? '#f0e2c0' : '#f6f2e6'); });
  return g;
}
function makeFridge() {
  const g = new THREE.Group();
  const body = box(1.0, 2.0, 0.8, mat('#f3f4f6')); body.position.y = 1.0; g.add(body);
  const inner = box(0.9, 1.85, 0.05, new THREE.MeshBasicMaterial({ color: '#fdfbf0' })); inner.position.set(0, 1.0, 0.36); g.add(inner);
  const shelf = new THREE.Group(); shelf.position.set(0, 0, 0.5); g.add(shelf);
  for (const y of [0.55, 1.05, 1.5]) { const s = box(0.88, 0.03, 0.4, mat('#dfe6ea')); s.position.set(0, y, 0.25); g.add(s); }
  const door = new THREE.Group(); door.position.set(0.5, 0, 0.41); g.add(door);
  const dm = box(1.0, 1.98, 0.08, mat('#f6f7f9')); dm.position.set(-0.5, 1.0, 0.04); door.add(dm);
  const hd = box(0.05, 0.45, 0.06, mat('#b8bec6')); hd.position.set(-0.9, 1.25, 0.11); door.add(hd);
  const light = new THREE.PointLight(0xfff6dd, 0, 3, 1.5); light.position.set(0, 1.2, 1.0); g.add(light);
  g.userData = { door, shelf, open(k) { door.rotation.y = 1.9 * clamp(k); light.intensity = 6 * clamp(k); inner.visible = k > 0.02; } };
  g.userData.open(0);
  return g;
}
function makeMirror(w = 1.0, h = 1.2) {
  const g = new THREE.Group();
  const fr = box(w + 0.1, h + 0.1, 0.05, mat('#c8ccd4')); fr.position.y = 1.7; g.add(fr);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#cfe4ee' })); gl.position.set(0, 1.7, 0.03); g.add(gl);
  const sink = box(w + 0.2, 0.18, 0.5, mat('#f4f4f2')); sink.position.set(0, 0.86, 0.25); g.add(sink);
  const ped = box(0.4, 0.78, 0.35, mat('#e8e8e4')); ped.position.set(0, 0.39, 0.2); g.add(ped);
  g.userData = { glass: gl };
  return g;
}
function makeTub() {
  const g = new THREE.Group();
  const W = 1.6, D = 0.85, H = 0.6, T = 0.08, m = mat('#f4f6f8');
  const fl = box(W, T, D, m); fl.position.y = T / 2; g.add(fl);
  for (const s of [-1, 1]) { const a = box(W, H, T, m); a.position.set(0, H / 2, s * (D / 2 - T / 2)); g.add(a); const b = box(T, H, D, m); b.position.set(s * (W / 2 - T / 2), H / 2, 0); g.add(b); }
  const wm = new THREE.MeshLambertMaterial({ color: '#7fc8ee', emissive: 0x1a5f8f, emissiveIntensity: 0.25 });
  const water = box(W - 2 * T, 1, D - 2 * T, wm); water.castShadow = false; g.add(water);
  g.userData = { water, H, setWater(k) { const h = Math.max(0.001, (H - 0.1) * clamp(k)); water.scale.y = h; water.position.y = T + h / 2; water.visible = k > 0.01; } };
  g.userData.setWater(0);
  return g;
}
function makeSteam(n = 18, { w = 1.4, d = 0.6, h = 1.4, color = '#ffffff' } = {}) {
  const g = new THREE.Group(); const P = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (i % 3) * 0.05, 8, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false })); m.userData.o = [((i * 0.618) % 1 - 0.5) * w, ((i * 0.37) % 1 - 0.5) * d, (i * 0.13) % 1]; g.add(m); P.push(m); }
  g.userData.set = (k, t = 0) => { g.visible = k > 0.01; P.forEach(p => { const [x, z, ph] = p.userData.o; const u = (t * 0.25 + ph) % 1; p.position.set(x + Math.sin(t + ph * 6) * 0.08, u * h, z); p.material.opacity = 0.28 * clamp(k) * (1 - u); p.scale.setScalar(0.8 + u * 1.2); }); };
  g.userData.set(0);
  return g;
}
function makeBed({ blanket = '#5d7fb3' } = {}) {
  const g = new THREE.Group();
  const fr = box(1.6, 0.4, 2.4, mat('#8a6a4c')); fr.position.y = 0.2; g.add(fr);
  const hb = box(1.6, 1.0, 0.1, mat('#7a5c40')); hb.position.set(0, 0.55, -1.2); g.add(hb);
  const mt = box(1.5, 0.22, 2.3, mat('#f3f1ec')); mt.position.y = 0.5; g.add(mt);
  const pl = box(0.9, 0.16, 0.42, mat('#ffffff')); pl.position.set(0, 0.69, -0.85); g.add(pl);
  const bl = box(1.55, 0.12, 1.5, mat(blanket)); bl.position.set(0, 0.66, 0.35); g.add(bl);
  g.userData = { blanket: bl, topY: 0.61 };
  return g;
}
function makeAlarm() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const body = box(0.9, 0.46, 0.3, mat('#26282e')); body.position.y = 0.23; g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.38), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 0.23, 0.155); g.add(scr);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat('#c8ccd4')); b.position.set(s * 0.3, 0.5, 0); g.add(b); }
  let key = '';
  g.userData.set = (s, color = '#ff5a4a') => { const k = s + color; if (k === key) return; key = k; const x = c.getContext('2d'); x.fillStyle = '#0d0f12'; x.fillRect(0, 0, 512, 256); x.fillStyle = color; x.font = '700 190px "Noto Sans CJK JP", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 256, 136); tex.needsUpdate = true; };
  g.userData.set('2:00');
  return g;
}
function makePipeChair(color = '#5a6a8a') {
  const g = new THREE.Group(); const m = mat('#b8bec8');
  const seat = box(0.42, 0.05, 0.42, mat(color)); seat.position.y = 0.45; g.add(seat);
  const back = box(0.42, 0.3, 0.04, mat(color)); back.position.set(0, 0.75, -0.2); g.add(back);
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) { const l = box(0.03, 0.45, 0.03, m); l.position.set(x, 0.225, z); g.add(l); }
  for (const x of [-0.19, 0.19]) { const p = box(0.03, 0.45, 0.03, m); p.position.set(x, 0.68, -0.2); g.add(p); }
  return g;
}
function makeTent({ color = '#3f7fd0', w = 3.6, d = 2.6, h = 2.4 } = {}) {
  const g = new THREE.Group(); const pm = mat('#c8ccd4');
  const P = [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].map(([x, z]) => { const p = box(0.06, h, 0.06, pm); p.position.set(x, h / 2, z); g.add(p); return p; });
  const roof = new THREE.Group(); g.add(roof);
  const r1 = box(w + 0.2, 0.05, d / 2 + 0.25, mat(color)); r1.position.set(0, 0.2, -d / 4); r1.rotation.x = 0.28; roof.add(r1);
  const r2 = box(w + 0.2, 0.05, d / 2 + 0.25, mat(color)); r2.position.set(0, 0.2, d / 4); r2.rotation.x = -0.28; roof.add(r2);
  g.userData.setUp = (k) => { const kk = clamp(k); P.forEach(p => { p.scale.y = Math.max(0.01, kk); p.position.y = h * kk / 2; }); roof.position.y = h * kk; roof.rotation.z = (1 - kk) * 0.25; };
  g.userData.setUp(1);
  return g;
}
function makeLotBox() {
  const g = new THREE.Group();
  const b = box(0.42, 0.38, 0.42, mat('#f4f0e6')); b.position.y = 0.19; g.add(b);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), mat('#2a2a2a')); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.385; g.add(hole);
  const band = box(0.43, 0.08, 0.43, mat('#d23a3a')); band.position.y = 0.26; g.add(band);
  return g;
}
function makeGift({ color = '#c8242c', ribbon = '#f2c14e', s = 0.5 } = {}) {
  const g = new THREE.Group();
  const b = box(s, s * 0.7, s, mat(color)); b.position.y = s * 0.35; g.add(b);
  const r1 = box(s + 0.01, s * 0.71, s * 0.14, mat(ribbon)); r1.position.y = s * 0.35; g.add(r1);
  const r2 = box(s * 0.14, s * 0.71, s + 0.01, mat(ribbon)); r2.position.y = s * 0.35; g.add(r2);
  for (const sgn of [-1, 1]) { const bw = new THREE.Mesh(new THREE.TorusGeometry(s * 0.12, s * 0.04, 6, 12), mat(ribbon)); bw.position.set(sgn * s * 0.12, s * 0.76, 0); bw.rotation.y = Math.PI / 2; bw.rotation.x = sgn * 0.5; g.add(bw); }
  const tag = new THREE.Group(); const tb = box(s * 0.5, s * 0.28, 0.01, mat('#fffaf0')); tag.add(tb); const hole = box(0.02, 0.02, 0.015, mat('#888')); hole.position.set(-s * 0.2, 0, 0); tag.add(hole);
  const str = box(s * 0.3, 0.006, 0.006, mat('#d8d0b8')); str.position.set(-s * 0.35, 0, 0); tag.add(str);
  g.add(tag);
  g.userData = { tag, tagOut(k) { const kk = clamp(k); tag.visible = kk > 0.01; tag.position.set(s * 0.25 + kk * s * 0.35, s * 0.76 + kk * s * 0.35, s * 0.2); tag.rotation.z = -0.4 + kk * 0.4; tag.scale.setScalar(0.3 + 0.7 * kk); } };
  g.userData.tagOut(0);
  return g;
}
function makePochi(color = '#e85a7a') {
  const g = new THREE.Group();
  const b = box(0.16, 0.26, 0.02, mat(color)); b.position.y = 0.13; g.add(b);
  const f = box(0.16, 0.06, 0.022, mat('#fff1c8')); f.position.y = 0.22; g.add(f);
  const k = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), mat('#f2c14e')); k.position.set(0, 0.12, 0.012); g.add(k);
  return g;
}
function makeShaker(color = '#3a7fd0') {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.28, 14), new THREE.MeshLambertMaterial({ color: '#e8eef4', transparent: true, opacity: 0.85 })); b.position.y = 0.14; g.add(b);
  const milk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.066, 0.16, 14), mat('#e8d8c0')); milk.position.y = 0.09; g.add(milk);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.06, 14), mat(color)); cap.position.y = 0.31; g.add(cap);
  const sp = box(0.03, 0.05, 0.03, mat(color)); sp.position.set(0.03, 0.36, 0); g.add(sp);
  g.userData = { milk };
  return g;
}
function makeProteinBag(color = '#2a2e3a') {
  const g = new THREE.Group();
  const b = box(0.42, 0.55, 0.16, mat(color)); b.position.y = 0.275; g.add(b);
  const top = box(0.42, 0.06, 0.08, mat('#c8ccd4')); top.position.y = 0.58; g.add(top);
  const band = box(0.36, 0.14, 0.01, mat('#f2c14e')); band.position.set(0, 0.32, 0.085); g.add(band);
  return g;
}
function makeBench() {
  const g = new THREE.Group(); const wm = mat('#9a6a3a'), mm = mat('#55595f');
  for (let i = 0; i < 3; i++) { const s = box(2.2, 0.05, 0.12, wm); s.position.set(0, 0.45, -0.15 + i * 0.15); g.add(s); }
  for (let i = 0; i < 2; i++) { const s = box(2.2, 0.1, 0.04, wm); s.position.set(0, 0.62 + i * 0.16, -0.26); g.add(s); }
  for (const x of [-0.95, 0.95]) { const l = box(0.06, 0.45, 0.4, mm); l.position.set(x, 0.225, 0); g.add(l); }
  return g;
}
function makeTrash({ color = '#6a7a6a' } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.8, 16), mat(color)); b.position.y = 0.4; g.add(b);
  const lid = new THREE.Group(); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 16), mat('#4a5a4a')); lid.add(l); lid.position.set(0, 0.82, -0.3); const lw = new THREE.Group(); lw.position.set(0, 0, 0.3); l.position.z = 0.3; lid.add(lw); g.add(lid);
  g.userData = { lid, open(k) { lid.rotation.x = -1.6 * clamp(k); } };
  return g;
}
function makeGlass({ beer = true, h = 0.2 } = {}) {
  const g = new THREE.Group();
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, h, 12), new THREE.MeshLambertMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.45, depthWrite: false })); gl.position.y = h / 2; g.add(gl);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.047, h * 0.8, 12), mat(beer ? '#f2b33a' : '#c8e8ff')); liq.position.y = h * 0.4; g.add(liq);
  const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.055, h * 0.12, 12), mat('#fffaf0')); foam.position.y = h * 0.85; foam.visible = beer; g.add(foam);
  g.userData = { setLevel(k) { const kk = clamp(k); liq.scale.y = Math.max(0.01, kk); liq.position.y = h * 0.4 * kk; foam.visible = beer && kk > 0.2; foam.position.y = h * 0.8 * kk + 0.01; } };
  return g;
}
function makeTable({ w = 1.6, d = 0.9, h = 0.72, color = '#c9a77a' } = {}) {
  const g = new THREE.Group();
  const t = box(w, 0.06, d, mat(color)); t.position.y = h; g.add(t);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.06, h, 0.06, mat('#6a5a48')); l.position.set(x * (w / 2 - 0.08), h / 2, z * (d / 2 - 0.08)); g.add(l); }
  g.userData = { topY: h + 0.03 };
  return g;
}
function makeShelf({ w = 3, h = 2, colors = ['#e85a5a', '#5a9ae8', '#f2c14e', '#6ac46a', '#c58bff'], rows = 3, seed = 1 } = {}) {
  const g = new THREE.Group();
  const back = box(w, h, 0.1, mat('#e8e2d6')); back.position.set(0, h / 2, -0.25); g.add(back);
  const items = [];
  for (let r = 0; r < rows; r++) {
    const y = 0.25 + r * (h - 0.3) / rows; const s = box(w, 0.05, 0.5, mat('#d8d0c0')); s.position.set(0, y, 0); g.add(s);
    for (let i = 0; i < Math.floor(w / 0.32); i++) { const c = colors[(i * 7 + r * 3 + seed) % colors.length]; const it = box(0.24, 0.3 + ((i + r + seed) % 3) * 0.06, 0.24, mat(c)); it.position.set(-w / 2 + 0.2 + i * 0.32, y + 0.18, 0.02); g.add(it); items.push(it); }
  }
  g.userData = { items };
  return g;
}

export { makeSet, makeKotatsu, makeCounter, makePot, makeDishes, makeMochiGrill, makeFridge, makeMirror, makeTub, makeSteam, makeBed, makeAlarm, makePipeChair, makeTent, makeLotBox, makeGift, makePochi, makeShaker, makeProteinBag, makeBench, makeTrash, makeGlass, makeTable, makeShelf };
