import * as THREE from 'three';
import { rng, mat, box, canvasTex, makePerson, SKIN, HAIR } from '../lib.js';

// =====================================================
// FACTORY: a clean food factory (bento line). White walls, light floor, ceiling light panels,
// 2 conveyor lines running along x (front line z=0, back line z=-4), bento trays that fill up as
// they pass the packing stations, workers in white coats / caps / masks on the far side of each line.
// Front line: x -7..7, belt top y=0.9. Camera usually at (0, 3.2, 6.5) looking at (0, 1.1, -1).
// API
//   factory (Scene)
//   makeWorker(r, {skin, hair}) -> Person in white uniform (cap + mask). userData.arms / legs / head like makePerson
//   LINES: [{ z, workers: [{p, x, ph}], trays: [...] }]
//   setLine(dist, {pack = 1}) : move trays by dist (m traveled along the belt); pack: arm motion amount 0..1
//   setWorkers(fn(lineIdx, i, worker) -> bool visible)
//   setFactoryLight('day'|'dim'), factorySign（奥の壁の お弁当ライン の札。タイトルと重なるショットでは visible=false）
// =====================================================
const factory = new THREE.Scene();
factory.background = new THREE.Color('#dfe6ea');
factory.fog = new THREE.Fog(0xdfe6ea, 18, 40);
const hemi = new THREE.HemisphereLight(0xffffff, 0xa9b4bc, 1.35); factory.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 12, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); factory.add(key);

const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#cfdcd6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,100,95,.18)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; factory.add(floor);
const wallM = mat('#f1f4f6');
const back = box(40, 6, 0.3, wallM); back.position.set(0, 3, -9); factory.add(back);
for (const s of [-1, 1]) { const w = box(0.3, 6, 30, wallM); w.position.set(s * 12, 3, 4); factory.add(w); }
const stripe = box(40, 0.25, 0.05, mat('#3fa58f')); stripe.position.set(0, 1.4, -8.83); factory.add(stripe);
// ceiling light panels
const panelM = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.6), panelM); p.position.set(-6 + i * 4, 5.6, -6 + j * 3.5); factory.add(p); }
// wall sign (generic, no brand)
const signTex = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#3fa58f'; g.fillRect(0, h - 14, w, 14); g.fillStyle = '#2b3346'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('お弁当ライン', w / 2, h / 2 - 4); });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: signTex })); sign.position.set(0, 3.6, -8.84); factory.add(sign);

// belt texture (scrolls)
const beltTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#4a515c'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a626e'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 6); });
beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;

const L = 16, X0 = -8; // belt span
const SKINS = SKIN;
const uniM = mat('#f6f8fa'), uniP = mat('#e7ecf0'), capM = mat('#ffffff'), maskM = mat('#cfe3ef'), gloveM = mat('#7fb6e0');
function makeWorker(r, o = {}) {
  const p = makePerson({ skin: o.skin || SKINS[Math.floor(r() * SKINS.length)], hair: o.hair || HAIR[Math.floor(r() * 4)], shirt: '#f6f8fa', pants: '#e7ecf0', scale: 0.95 + r() * 0.1 });
  const h = p.userData.head;
  const cap = box(0.46, 0.2, 0.44, capM); cap.position.set(0, 0.5, -0.01); h.add(cap);
  const capB = box(0.46, 0.3, 0.06, capM); capB.position.set(0, 0.36, -0.2); h.add(capB);
  const mask = box(0.36, 0.16, 0.03, maskM); mask.position.set(0, 0.13, 0.2); h.add(mask);
  for (const a of p.userData.arms) { const gl = box(0.14, 0.14, 0.16, gloveM); gl.position.y = -0.62; a.add(gl); }
  return p;
}

// bento tray: black base + 4 compartments that appear as the tray passes stations
const trayBase = new THREE.BoxGeometry(0.62, 0.08, 0.42);
const baseM = mat('#22252b');
const FOOD = [['#ffffff', -0.15, -0.05, 0.26, 0.26], ['#e9883a', 0.15, -0.09, 0.22, 0.16], ['#5fb35a', 0.15, 0.09, 0.22, 0.14], ['#9a5a34', -0.15, 0.13, 0.26, 0.1]];
function makeTray() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(trayBase, baseM); b.castShadow = true; g.add(b);
  const items = FOOD.map(([c, x, z, w, d]) => { const m = box(w, 0.06, d, mat(c)); m.position.set(x, 0.07, z); g.add(m); return m; });
  g.userData.items = items; return g;
}
const LINES = [];
function buildLine(z, nWorkers, seed) {
  const r = rng(seed);
  const g = new THREE.Group(); g.position.z = z; factory.add(g);
  const frame = box(L, 0.12, 1.0, mat('#b9c2ca')); frame.position.set(0, 0.8, 0); g.add(frame);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(L, 0.04, 0.82), [mat('#4a515c'), mat('#4a515c'), new THREE.MeshLambertMaterial({ map: beltTex }), mat('#4a515c'), mat('#4a515c'), mat('#4a515c')]);
  belt.position.set(0, 0.88, 0); belt.receiveShadow = true; g.add(belt);
  for (let i = 0; i < 9; i++) { const lg = box(0.1, 0.8, 0.8, mat('#9aa4ad')); lg.position.set(-7.6 + i * 1.9, 0.4, 0); g.add(lg); }
  for (const s of [-1, 1]) { const rail = box(L, 0.08, 0.05, mat('#d7dde3')); rail.position.set(0, 0.95, s * 0.44); g.add(rail); }
  const trays = []; for (let i = 0; i < 20; i++) { const t = makeTray(); t.position.y = 0.94; g.add(t); trays.push({ t, off: i * (L / 20) }); }
  const workers = [];
  for (let i = 0; i < nWorkers; i++) {
    const p = makeWorker(r); const x = -5.25 + i * 1.5 + (r() - .5) * 0.15;
    p.position.set(x, 0, -0.85); p.rotation.y = (r() - .5) * 0.2; g.add(p);
    workers.push({ p, x, ph: r() * 6, station: i % 4 });
  }
  const line = { z, g, belt, trays, workers }; LINES.push(line); return line;
}
buildLine(0, 8, 11);
buildLine(-4.2, 8, 23);

function setLine(dist, { pack = 1, t = 0 } = {}) {
  beltTex.offset.x = 0; beltTex.offset.y = (dist / 0.82) % 1;
  for (const ln of LINES) {
    for (const tr of ln.trays) {
      const x = X0 + ((tr.off + dist) % L + L) % L;
      tr.t.position.x = x; tr.t.visible = x > X0 + 0.4 && x < X0 + L - 0.4;
      // stations at x=-4.5, -1.5, 1.5, 4.5 add each compartment, but only if a worker there is visible
      tr.t.userData.items.forEach((m, k) => { m.visible = x > -4.5 + k * 3 && (ln.stationOn ? ln.stationOn[k] : true); });
    }
    for (const w of ln.workers) {
      const a = w.p.userData.arms; const s = Math.sin(t * 5 + w.ph) * pack;
      a[0].rotation.x = -0.9 - 0.35 * s; a[1].rotation.x = -0.9 + 0.35 * s; a[0].rotation.z = 0.15; a[1].rotation.z = -0.15;
      w.p.userData.head.rotation.x = 0.35;
    }
  }
}
// stationOn: once a station loses all its workers, trays passing it stay empty there (call after setWorkers)
function setWorkers(fn) {
  LINES.forEach((ln, li) => {
    const on = [false, false, false, false];
    ln.workers.forEach((w, i) => { w.p.visible = !!fn(li, i, w); if (w.p.visible) on[w.station] = true; });
    ln.stationOn = on;
  });
}
function setFactoryLight(mode) {
  const dim = mode === 'dim';
  hemi.intensity = dim ? 0.8 : 1.35; key.intensity = dim ? 0.6 : 1.1;
  panelM.color.set(dim ? '#9aa3ab' : '#ffffff');
  factory.background.set(dim ? '#aab3ba' : '#dfe6ea'); factory.fog.color.set(dim ? '#aab3ba' : '#dfe6ea');
}

export { factory, makeWorker, LINES, setLine, setWorkers, setFactoryLight, sign as factorySign };
