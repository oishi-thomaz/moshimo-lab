import * as THREE from 'three';
import { rng, mat, box, makeSky, makePerson, SKIN, HAIR } from '../lib.js';

// =====================================================
// HIGHWAY: 片側3車線の高速道路（x 方向にまっすぐ）＋道ばたの物流倉庫。
// 道の中心は z=0（中央分離帯）。+x へ進む車線は z = 2.2 / 5.6 / 9.0、-x へ進む車線は z = -2.2 / -5.6 / -9.0。
// 倉庫（荷物の積み下ろし口つき）は道の手前側 z = +34 あたり、x = -10〜30。
// API
//   highway (Scene), setHighwayEnv('day'|'dusk'|'night')
//   makeTruck({kind:'box'|'tanker'|'flat'|'garbage', color, driver:true}) → Group（前が +x）。userData: setHazard(on), setDriver(on), driver(Person), cabPos
//   makeHwCar(color) → Group（前が +x）
//   LANES（z の配列）、laneX(t, speed, off, dir, len) で流れる x 位置
//   WAREHOUSE（倉庫 Group）、DOCKS（積み下ろし口の中心 [{x,z}]）、makeCrate(color) で段ボール、makeCratePile(n, seed) で山（setN(k)）
// =====================================================
const highway = new THREE.Scene();
const sky = makeSky(); highway.add(sky);
highway.fog = new THREE.Fog(0xdfe8f2, 90, 360);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5240, 1.15); highway.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-30, 60, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 220 }); sun.shadow.bias = -0.0005;
highway.add(sun); highway.add(sun.target);

const grassM = mat('#86ad6c'), roadM = mat('#4a4f58'), shoulderM = mat('#5a5f68'), lineM = new THREE.MeshBasicMaterial({ color: 0xe9ecef }), yellowM = new THREE.MeshBasicMaterial({ color: 0xf2c14e });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), grassM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; highway.add(ground);
const LEN = 900;
{
  const road = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 23), roadM); road.rotation.x = -Math.PI / 2; road.position.y = 0.03; road.receiveShadow = true; highway.add(road);
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 1.4), shoulderM); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.035, s * 10.9); sh.receiveShadow = true; highway.add(sh);
    // 外側の白線（実線）
    const e = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 0.18), lineM); e.rotation.x = -Math.PI / 2; e.position.set(0, 0.05, s * 10.6); highway.add(e);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 0.18), lineM); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.05, s * 0.75); highway.add(m);
    // 車線の破線
    for (const z of [3.9, 7.3]) for (let x = -LEN / 2; x < LEN / 2; x += 12) { const d = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.16), lineM); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.05, s * z); highway.add(d); }
    // ガードレール
    const rail = box(LEN, 0.32, 0.12, mat('#d9dde2')); rail.position.set(0, 0.75, s * 11.8); highway.add(rail);
    for (let x = -LEN / 2; x < LEN / 2; x += 4) { const p = box(0.12, 0.75, 0.12, mat('#b9bec5')); p.position.set(x, 0.38, s * 11.85); p.castShadow = false; highway.add(p); }
  }
  // 中央分離帯
  const med = box(LEN, 0.85, 0.6, mat('#c9ccd1')); med.position.set(0, 0.43, 0); highway.add(med);
  const medG = box(LEN, 0.3, 0.4, mat('#6f9a58')); medG.position.set(0, 0.95, 0); highway.add(medG);
  // 遠くの山と木
  const r = rng(41);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(40 + r() * 50, 30 + r() * 40, 6), mat(r() < 0.5 ? '#6f9466' : '#7aa070', { flatShading: true }));
    m.position.set(-500 + i * 40 + r() * 20, 10, -170 - r() * 80); highway.add(m);
  }
  for (let i = 0; i < 140; i++) {
    const side = r() < 0.5 ? -1 : 1; const x = -260 + r() * 520, z = side * (16 + r() * 50);
    if (side > 0 && x > -30 && x < 50 && z < 60) continue; // 倉庫の場所はあける
    const h = 2 + r() * 2.5; const tr = box(0.4, h, 0.4, mat('#5d4434')); tr.position.set(x, h / 2, z); highway.add(tr);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + r() * 1.2, 0), mat(r() < 0.5 ? '#3f7a44' : '#4f8f4a', { flatShading: true })); c.position.set(x, h + 1, z); c.castShadow = true; highway.add(c);
  }
  // 案内標識のゲート（架空の地名）
  const gate = new THREE.Group(); gate.position.set(60, 0, 0); highway.add(gate);
  for (const z of [-12.4, 12.4]) { const p = box(0.5, 8, 0.5, mat('#8a9099')); p.position.set(0, 4, z); gate.add(p); }
  const beam = box(0.5, 0.5, 25, mat('#8a9099')); beam.position.set(0, 7.8, 0); gate.add(beam);
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#1f7a4a'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(10, 10, 492, 236);
  g.fillStyle = '#fff'; g.font = '900 78px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('もしも台', 256, 110); g.font = '700 64px "Noto Sans CJK JP", sans-serif'; g.fillText('15 km', 256, 200);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  for (const z of [-5.6, 5.6]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: tex })); s.position.set(-0.3, 6.2, z); s.rotation.y = -Math.PI / 2; gate.add(s); const b = box(0.1, 3.3, 6.5, mat('#1f7a4a')); b.position.set(0, 6.2, z); gate.add(b); }
}
const LANES = [2.2, 5.6, 9.0, -2.2, -5.6, -9.0];
// 流れる車の x 位置（dir=+1 なら +x へ）。len の範囲でループ
const laneX = (t, speed, off, dir = 1, len = 320) => { const v = ((t * speed + off) % len + len) % len - len / 2; return dir * v; };

// ---------- trucks ----------
const hazM = () => new THREE.MeshBasicMaterial({ color: 0x5a3a10 });
function makeTruck({ kind = 'box', color = '#e9ecef', cab = '#e9ecef', driver = true } = {}) {
  const g = new THREE.Group();
  const cabM = mat(cab), dark = mat('#23262c'), glass = mat('#9fc2d8', { emissive: 0x1a2a38, emissiveIntensity: 0.3 });
  const L = kind === 'garbage' ? 5.8 : 10.5; // 全長
  const cx = L / 2 - 1.2; // キャブの中心 x
  // キャブ：下半分＋屋根＋柱。窓はすけるガラス（中の運転手が見える）
  const cabB = box(2.2, 1.45, 2.4, cabM); cabB.position.set(cx, 1.28, 0); g.add(cabB);
  const cabR = box(2.2, 0.3, 2.4, cabM); cabR.position.set(cx, 3.0, 0); g.add(cabR);
  const cabK = box(0.2, 1.0, 2.4, cabM); cabK.position.set(cx - 1.0, 2.35, 0); g.add(cabK);
  for (const [x, z] of [[1.04, 1.12], [1.04, -1.12], [-0.1, 1.12], [-0.1, -1.12]]) { const p = box(0.14, 1.0, 0.16, cabM); p.position.set(cx + x, 2.35, z); g.add(p); }
  const bump = box(0.3, 0.5, 2.4, dark); bump.position.set(cx + 1.2, 0.75, 0); g.add(bump);
  const glassT = new THREE.MeshLambertMaterial({ color: '#bcd8ea', transparent: true, opacity: 0.28, depthWrite: false });
  const ws = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 2.1), glassT); ws.position.set(cx + 1.08, 2.35, 0); g.add(ws);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.0, 0.04), glassT); sw.position.set(cx + 0.02, 2.35, s * 1.18); g.add(sw); }
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
  for (const s of [-1, 1]) { const l = box(0.06, 0.25, 0.45, hl); l.position.set(cx + 1.13, 1.2, s * 0.8); l.castShadow = false; g.add(l); }
  const chassis = box(L - 0.4, 0.4, 1.9, dark); chassis.position.set(0, 0.75, 0); g.add(chassis);
  const bodyLen = L - 2.6, bx = -L / 2 + bodyLen / 2 + 0.1;
  let cargo;
  if (kind === 'box' || kind === 'garbage') {
    cargo = box(bodyLen, kind === 'garbage' ? 2.4 : 3.0, 2.45, mat(color)); cargo.position.set(bx, kind === 'garbage' ? 2.15 : 2.45, 0); g.add(cargo);
    const stripe = box(bodyLen + 0.02, 0.18, 2.47, mat('#2f4a7a')); stripe.position.set(bx, 1.3, 0); g.add(stripe);
    if (kind === 'garbage') { const hop = box(0.9, 1.8, 2.3, mat('#59606e')); hop.position.set(-L / 2 + 0.2, 1.6, 0); hop.rotation.z = 0.25; g.add(hop); }
  } else if (kind === 'tanker') {
    cargo = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, bodyLen, 14), mat(color)); cargo.rotation.z = Math.PI / 2; cargo.position.set(bx, 2.25, 0); cargo.castShadow = true; g.add(cargo);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.17, 0.3, 14), mat('#e05a4f')); band.rotation.z = Math.PI / 2; band.position.set(bx, 2.25, 0); g.add(band);
  } else {
    cargo = box(bodyLen, 0.2, 2.4, mat('#6b5440')); cargo.position.set(bx, 1.05, 0); g.add(cargo);
    const r = rng(L * 7);
    for (let i = 0; i < 6; i++) { const c = box(1.0, 0.8 + r() * 0.5, 1.0, mat(['#c9a46a', '#b58b55', '#d8b57c'][i % 3])); c.position.set(bx - bodyLen / 2 + 0.8 + (i % 3) * 1.6, 1.55, (i < 3 ? -0.55 : 0.55)); g.add(c); }
  }
  const wheels = [];
  const wx = kind === 'garbage' ? [cx, -L / 2 + 1.2] : [cx, -L / 2 + 1.5, -L / 2 + 2.7];
  for (const x of wx) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 12), mat('#1b1d22')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.55, s * 1.05); w.castShadow = true; g.add(w); wheels.push(w); }
  // ハザード（前2つ・後ろ2つ）
  const haz = [];
  for (const [x, s] of [[cx + 1.14, -1], [cx + 1.14, 1], [-L / 2 - 0.02, -1], [-L / 2 - 0.02, 1]]) { const m = hazM(); const h = box(0.06, 0.22, 0.3, m); h.position.set(x, 1.0, s * 1.05); h.castShadow = false; g.add(h); haz.push(m); }
  // 運転手（運転席は右ハンドル：-z 側から見て右 = +z 寄り）
  const d = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#3f6aa0', pants: '#2b3346', scale: 0.95 });
  d.position.set(cx + 0.3, 0.9, 0.55); d.rotation.y = Math.PI / 2;
  d.userData.legs.forEach(l => l.rotation.x = -1.4); d.userData.arms.forEach(a => a.rotation.x = -1.2);
  g.add(d); d.visible = driver;
  const seat = box(0.25, 1.0, 0.6, mat('#3a3f48')); seat.position.set(cx - 0.45, 2.1, 0.55); g.add(seat);
  g.userData = {
    driver: d, wheels, L, cabPos: new THREE.Vector3(cx + 0.3, 2.5, 0.55),
    setHazard(on) { haz.forEach(m => m.color.set(on ? 0xffa200 : 0x5a3a10)); },
    setDriver(on) { d.visible = on; },
    roll(dist) { wheels.forEach(w => w.rotation.y = dist / 0.55); },
  };
  return g;
}
function makeHwCar(color) {
  const g = new THREE.Group();
  const b = box(4, 0.9, 1.8, mat(color)); b.position.y = 0.75; g.add(b);
  const c = box(2.2, 0.7, 1.6, mat('#dfe6ee')); c.position.set(-0.2, 1.5, 0); g.add(c);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), tl = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
  for (const s of [-1, 1]) { const l = box(0.05, 0.18, 0.35, hl); l.position.set(2.01, 0.85, s * 0.6); l.castShadow = false; g.add(l); const k = box(0.05, 0.18, 0.35, tl); k.position.set(-2.01, 0.85, s * 0.6); k.castShadow = false; g.add(k); }
  for (const x of [-1.3, 1.3]) for (const s of [-1, 1]) { const w = box(0.7, 0.7, 0.25, mat('#1b1d22')); w.position.set(x, 0.35, s * 0.85); g.add(w); }
  return g;
}

// ---------- warehouse ----------
const WAREHOUSE = new THREE.Group(); WAREHOUSE.position.set(10, 0, 40); highway.add(WAREHOUSE);
const DOCKS = [];
{
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(70, 34), mat('#9aa0a8')); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.04, -6); pad.receiveShadow = true; WAREHOUSE.add(pad);
  const body = box(56, 11, 18, mat('#dfe3e8')); body.position.set(0, 5.5, 6); WAREHOUSE.add(body);
  const roof = box(57, 0.6, 19, mat('#8f99a6')); roof.position.set(0, 11.2, 6); WAREHOUSE.add(roof);
  const plat = box(56, 1.2, 3, mat('#b9c0c8')); plat.position.set(0, 0.6, -4.5); WAREHOUSE.add(plat);
  const awn = box(56, 0.3, 5, mat('#59606e')); awn.position.set(0, 6.5, -5.5); WAREHOUSE.add(awn);
  for (let i = 0; i < 8; i++) {
    const x = -24.5 + i * 7;
    const door = box(4.4, 4.6, 0.12, mat('#3b4250')); door.position.set(x, 3.5, -3.02); WAREHOUSE.add(door);
    const shut = box(4.2, 1.2, 0.14, mat('#c9ccd1')); shut.position.set(x, 5.2, -3.05); WAREHOUSE.add(shut);
    const num = document.createElement('canvas'); num.width = 128; num.height = 128; const g = num.getContext('2d'); g.fillStyle = '#f2c14e'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1b1d22'; g.font = '900 90px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 64, 70);
    const t = new THREE.CanvasTexture(num); t.colorSpace = THREE.SRGBColorSpace;
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: t })); n.position.set(x, 6.25, -3.2); n.rotation.y = Math.PI; WAREHOUSE.add(n);
    DOCKS.push({ x, z: -3 });
  }
  // 白線（トラックを停める枠）
  for (let i = 0; i <= 8; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 14), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 })); l.rotation.x = -Math.PI / 2; l.position.set(-28 + i * 7, 0.06, -13); WAREHOUSE.add(l); }
}
const crateGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
const CRATE_COLS = ['#c9a46a', '#b58b55', '#d8b57c', '#c29a5c'];
function makeCrate(color) { const m = new THREE.Mesh(crateGeo, mat(color || CRATE_COLS[0])); m.castShadow = true; m.receiveShadow = true; return m; }
// n 個の段ボールを積んだ山。setN(k) で 0..1 の割合だけ見せる（下から積み上がる）
function makeCratePile(n = 120, seed = 3, { cols = 8, rows = 5 } = {}) {
  const g = new THREE.Group(); const r = rng(seed); const items = [];
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(i / (cols * rows)), k = i % (cols * rows);
    const c = makeCrate(CRATE_COLS[Math.floor(r() * 4)]);
    c.position.set((k % cols) * 0.95 - cols * 0.475 + (r() - .5) * 0.08, 0.35 + layer * 0.72, Math.floor(k / cols) * 0.95 + (r() - .5) * 0.08);
    c.rotation.y = (r() - .5) * 0.15; g.add(c); items.push(c);
  }
  g.userData.setN = (k) => { const m = Math.round(k * n); items.forEach((c, i) => c.visible = i < m); };
  return g;
}

const ENV = {
  day: { top: '#5c9fe0', bot: '#e4f1fa', fog: '#dfe8f2', hi: 1.15, si: 1.5, sc: '#fff4e0', grass: '#86ad6c' },
  dusk: { top: '#4f6fa8', bot: '#f2b98f', fog: '#d9b49c', hi: 1.0, si: 1.15, sc: '#ffc89a', grass: '#7a9d63' },
  night: { top: '#0d1a3a', bot: '#33456f', fog: '#1d2848', hi: 0.8, si: 0.5, sc: '#a9bcff', grass: '#3d5a3c' },
};
function setHighwayEnv(e) {
  const E = ENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  highway.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); grassM.color.set(E.grass);
}
setHighwayEnv('day');

export { highway, setHighwayEnv, makeTruck, makeHwCar, LANES, laneX, WAREHOUSE, DOCKS, makeCrate, makeCratePile, sun as hwSun };
