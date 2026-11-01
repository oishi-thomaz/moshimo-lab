import * as THREE from 'three';
import { rng, mat, box, canvasTex } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// FOOD LINEUP：ローポリの食べ物（ブランドなし）と、5つの台座＋メーター（ヤバい順の食べ物回用）
// 食べ物：makeRiceBowl / makeRiceBag / makeOil / makeBread / makeSugar / makeSoy / makeEgg（どのシーンにも置ける。原点は底）
// ラインナップ：fLineup (Scene)、FSLOTS、setFoods(makers[5], names[5])、setFSlot(i, {show, meter, word, glow, t})、fLineupIdle(t)
//   台座の x は -2.2〜2.2（1.1間隔）。カメラの目安 look(0, 2.2, 9.5, 0, 1.4, 0, 50)
// =====================================================
const white = mat('#f6f4ee');
function makeRiceBowl() {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.32, 20, 1, true), mat('#3a5a8a', { side: THREE.DoubleSide })); bowl.position.y = 0.2; g.add(bowl);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), mat('#2c4670')); foot.position.y = 0.03; g.add(foot);
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), white); rice.scale.y = 0.6; rice.position.y = 0.34; g.add(rice);
  return g;
}
function makeRiceBag() {
  const g = new THREE.Group();
  const tex = canvasTex(256, 320, (c, w, h) => { c.fillStyle = '#efe7d2'; c.fillRect(0, 0, w, h); c.fillStyle = '#3f7a4a'; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = '#2b2b2b'; c.font = '900 150px "Noto Sans CJK JP", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('米', w / 2, h * 0.34); });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.3), [mat('#e6dcc3'), mat('#e6dcc3'), mat('#e6dcc3'), mat('#e6dcc3'), new THREE.MeshLambertMaterial({ map: tex }), mat('#e6dcc3')]); b.position.y = 0.41; g.add(b);
  const top = box(0.56, 0.08, 0.26, mat('#d8ccb0')); top.position.y = 0.86; g.add(top);
  return g;
}
function makeOil() {
  const g = new THREE.Group();
  const bodyM = new THREE.MeshLambertMaterial({ color: '#f2c84b', transparent: true, opacity: 0.88, emissive: '#6a4a00', emissiveIntensity: 0.35 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.8, 18), bodyM); b.position.y = 0.4; g.add(b);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.22, 0.2, 18), bodyM); sh.position.y = 0.9; g.add(sh);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 14), mat('#d9473b')); cap.position.y = 1.06; g.add(cap);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.28, 18, 1, true), mat('#fbfaf5')); lab.position.y = 0.42; g.add(lab);
  return g;
}
function makeBread() {
  const g = new THREE.Group();
  const crust = mat('#c98a45'), inner = mat('#f3dfb6');
  const loaf = box(0.8, 0.42, 0.46, crust); loaf.position.y = 0.21; g.add(loaf);
  for (let i = 0; i < 2; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.46, 14, 1, false, 0, Math.PI), crust); d.rotation.x = Math.PI / 2; d.rotation.z = Math.PI / 2; d.position.set(-0.2 + i * 0.4, 0.42, 0); g.add(d); }
  const slice = box(0.08, 0.52, 0.44, inner); slice.position.set(0.52, 0.26, 0); slice.rotation.z = -0.15; g.add(slice);
  return g;
}
function makeSugar() {
  const g = new THREE.Group(); const m = mat('#ffffff');
  const P = [[0, 0, 0], [0.2, 0, 0], [-0.2, 0, 0], [0.1, 0, 0.2], [-0.1, 0, 0.2], [0, 0.18, 0.08], [0.18, 0.18, 0.1], [-0.18, 0.18, 0.1], [0, 0.36, 0.1], [0.1, 0, -0.2], [-0.1, 0, -0.2]];
  for (const [x, y, z] of P) { const c = box(0.17, 0.17, 0.17, m); c.position.set(x, y + 0.09, z); c.rotation.y = (x + z) * 2; g.add(c); }
  return g;
}
function makeSoy() {
  const g = new THREE.Group(); const r = rng(31);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 0.1, 22), mat('#8a5a3a')); dish.position.y = 0.05; g.add(dish);
  const bean = new THREE.SphereGeometry(0.07, 8, 6); const bm = mat('#e3c27a');
  for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.38; const h = (1 - d / 0.4) * 0.28; const m = new THREE.Mesh(bean, bm); m.position.set(Math.cos(a) * d, 0.12 + r() * h, Math.sin(a) * d); m.scale.set(1, 0.85, 1.1); g.add(m); }
  return g;
}
function makeEgg() {
  const g = new THREE.Group(); const e = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), mat('#f1e3cf')); e.scale.y = 1.3; e.position.y = 0.34; g.add(e); return g;
}

// ---------- lineup ----------
const fLineup = new THREE.Scene();
fLineup.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1410'); gr.addColorStop(0.6, '#2b2018'); gr.addColorStop(1, '#140f0b'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
fLineup.add(new THREE.HemisphereLight(0xfff2e0, 0x2a2018, 1.15));
const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(3, 8, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); fLineup.add(key);
const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), mat('#3a2c22')); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; fLineup.add(floor);
const SX = [-2.2, -1.1, 0, 1.1, 2.2], MH = 2.0;
const FSLOTS = SX.map((x) => {
  const g = new THREE.Group(); g.position.set(x, 0, 0); fLineup.add(g);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.32, 28), mat('#5a4636')); ped.position.y = 0.16; ped.receiveShadow = true; g.add(ped);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 6, 32), mat('#ffd27a', { emissive: 0x6a4a10, emissiveIntensity: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.33; g.add(rim);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.34, MH, 0.12), new THREE.MeshLambertMaterial({ color: '#e9d8bf', transparent: true, opacity: 0.14 })); tube.position.set(0, 1.25 + MH / 2, -0.8); g.add(tube);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, MH, 0.12)), new THREE.LineBasicMaterial({ color: '#e9d8bf', transparent: true, opacity: 0.45 })); frame.position.copy(tube.position); g.add(frame);
  const fillM = new THREE.MeshLambertMaterial({ color: '#ffd27a', emissive: 0x4a3410, emissiveIntensity: 0.8 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.1), fillM); fill.geometry.translate(0, 0.5, 0); fill.position.set(0, 1.25, -0.8); fill.scale.y = 0.001; g.add(fill);
  const lab = textSprite('', { size: 64, sx: 1.0, w: 512, h: 128, stroke: 8, depthTest: false }); lab.position.set(0, 0.02, 0.85); lab.renderOrder = 5; g.add(lab);
  const word = textSprite('', { size: 70, sx: 1.0, w: 512, h: 128, stroke: 8, depthTest: false }); word.renderOrder = 6; word.visible = false; g.add(word);
  return { g, ped, rim, fill, fillM, lab, word, hero: null, hs: 1, curWord: '' };
});
function setFoods(makers, names, scales = []) {
  FSLOTS.forEach((s, i) => { if (s.hero) s.g.remove(s.hero); const h = makers[i](); h.position.y = 0.33; h.rotation.y = -0.3; h.traverse(o => { if (o.isMesh) o.castShadow = true; }); s.hs = scales[i] || 1; h.scale.setScalar(s.hs); s.g.add(h); s.hero = h; s.lab.userData.set(names[i]); });
}
const LOW = new THREE.Color('#9fd18a'), MID = new THREE.Color('#ffd166'), HOT = new THREE.Color('#ff5a4f');
function setFSlot(i, { show = 1, meter = 0, word = '', glow = 0, t = 0, label = null } = {}) {
  const s = FSLOTS[i];
  s.hero.visible = show > 0.01; s.hero.scale.setScalar(s.hs * Math.max(0.001, show));
  s.fill.scale.y = Math.max(0.001, Math.min(1.05, meter)) * MH;
  const c = meter < 0.5 ? LOW.clone().lerp(MID, meter / 0.5) : MID.clone().lerp(HOT, Math.min(1, (meter - 0.5) / 0.5));
  s.fillM.color.copy(c); s.fillM.emissive.copy(c).multiplyScalar(0.3 + glow * 0.5 * (0.5 + 0.5 * Math.sin(t * 12)));
  if (word !== s.curWord) { s.word.userData.set(word); s.curWord = word; }
  s.word.visible = !!word; s.word.position.set(0, 1.25 + Math.max(0.05, Math.min(1.05, meter)) * MH + 0.32, -0.8);
  if (label != null) s.lab.userData.set(label);
}
function fLineupIdle(t) { FSLOTS.forEach((s, i) => { if (s.hero && s.hero.visible) s.hero.rotation.y = -0.3 + Math.sin(t * 0.6 + i) * 0.15; s.rim.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(t * 2 + i); }); }

export { makeRiceBowl, makeRiceBag, makeOil, makeBread, makeSugar, makeSoy, makeEgg, fLineup, FSLOTS, setFoods, setFSlot, fLineupIdle };
