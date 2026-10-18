import * as THREE from 'three';
import { rng, mat, box, makeSky, makePerson, SKIN, HAIR } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// DELIVERY: 宅配の玄関先と配送車（架空の もしも便。実在の宅配会社の色・ロゴ・制服には似せない）
// porch (Scene)：一戸建ての玄関（ドア・ステップ・表札・インターホン・窓・植木鉢）＋前の道路＋向かいの家。地面 y=0
//   玄関ドアの中心は (0, 0, -2)、ステップ上面 y=0.2（DOORSTEP）。道路は z=4.5〜11.5（x 方向）、歩道 z=3〜4.5
// API
//   makeParcel(w, h, d) -> Mesh（段ボール＋テープ）
//   makeVan({ band }) -> Group（白い配送車＋帯・文字なし・x+ が前・荷台の扉 setDoor(0..1)・ハザード setHazard(on)）
//   makeCourier(seed) -> 配達員（makePerson＋帽子。グレーと紺の架空の服）
//   makePile(scene, { cols, rows, layers, size, x, z }) -> { mesh, setN(k), max }（段ボールの山。下の段から積む）
//   setPorchEnv('day'|'dusk'|'night')、canopy（玄関のひさし。タイトルにかかる構図では visible=false）
// =====================================================
const porch = new THREE.Scene();
const sky = makeSky(); porch.add(sky);
porch.fog = new THREE.Fog(0xdfe8f2, 40, 140);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5240, 1.15); porch.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.4); sun.position.set(12, 22, 16); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); sun.shadow.bias = -0.0005; porch.add(sun);
const porchLamp = new THREE.PointLight(0xffd9a0, 0, 9, 1.4); porchLamp.position.set(1.1, 2.6, -1.4); porch.add(porchLamp);

const grassM = mat('#86ad6f'), roadM = mat('#545a64'), walkM = mat('#c9ccd1'), lineM = mat('#e9ecef'), stoneM = mat('#bdb6aa');
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), grassM); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; porch.add(gnd);
const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 7), roadM); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 8); road.receiveShadow = true; porch.add(road);
for (let v = -60; v < 60; v += 6) { const l = box(2.6, 0.02, 0.18, lineM); l.position.set(v, 0.04, 8); l.castShadow = false; porch.add(l); }
for (const z of [3.75, 12.25]) { const w = box(300, 0.12, 1.5, walkM); w.position.set(0, 0.06, z); w.castShadow = false; porch.add(w); }
// 玄関までの敷石
const path = box(1.6, 0.06, 4.6, stoneM); path.position.set(0, 0.03, 0.75); path.castShadow = false; porch.add(path);

// ---- 家（正面 z=-2） ----
const wallM = mat('#efe6d6'), trimM = mat('#d8cdb9'), roofM = mat('#5b6577', { flatShading: true }), doorM = mat('#7a5a40'), glassM = new THREE.MeshLambertMaterial({ color: '#40495a', emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0 });
const house = new THREE.Group(); porch.add(house);
const body = box(12, 5.6, 7, wallM); body.position.set(0, 2.8, -5.5); house.add(body);
const roof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.4, 4), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 0.68); roof.position.set(0, 6.8, -5.5); roof.castShadow = true; house.add(roof);
const canopy = box(2.4, 0.14, 1.3, trimM); canopy.position.set(0, 2.75, -1.4); house.add(canopy);
const door = box(1.05, 2.2, 0.1, doorM); door.position.set(0, 1.3, -1.97); house.add(door);
const knob = box(0.08, 0.08, 0.08, mat('#d8c27a')); knob.position.set(0.38, 1.25, -1.9); house.add(knob);
const frame = box(1.3, 2.4, 0.06, trimM); frame.position.set(0, 1.3, -1.99); house.add(frame);
const step = box(2.2, 0.2, 1.3, stoneM); step.position.set(0, 0.1, -1.35); house.add(step);
const DOORSTEP = new THREE.Vector3(0, 0.2, -1.2);
const plate = textSprite('MOSHIMO', { w: 256, h: 96, size: 40, bg: '#f7f3ea', color: '#5a4a3a', radius: 8, sx: 0.5 }); plate.position.set(-1.0, 1.75, -1.9); house.add(plate);
const intercom = box(0.16, 0.24, 0.06, mat('#e9ecef')); intercom.position.set(-1.0, 1.3, -1.94); house.add(intercom);
for (const x of [-3.6, 3.6]) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3), glassM); w.position.set(x, 1.7, -1.98); house.add(w);
  const sill = box(2.0, 0.08, 0.2, trimM); sill.position.set(x, 1.0, -1.9); house.add(sill);
  const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), glassM); w2.position.set(x, 4.2, -1.98); house.add(w2);
}
const potM = mat('#b0643f'), leafM = mat('#4f8a4a', { flatShading: true });
for (const x of [-1.6, 1.6]) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 8), potM); pot.position.set(x, 0.22, -1.3); pot.castShadow = true; house.add(pot);
  const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), leafM); lf.position.set(x, 0.75, -1.3); lf.castShadow = true; house.add(lf);
}
// 低い塀（道路側、入口だけあける）
for (const s of [-1, 1]) { const f = box(4.6, 0.7, 0.2, mat('#d8d2c4')); f.position.set(s * 3.3, 0.35, 2.7); house.add(f); }
// 両どなりと向かいの家（背景）
{
  const r = rng(77);
  const WALL = ['#e6dccb', '#f4f1ea', '#d9cdb8', '#dfe3e6', '#f1e3cf'], ROOF = ['#7a4b3a', '#4f5d73', '#5f6b52', '#8a5a44'];
  const add = (x, z, face) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; porch.add(g);
    const w = 6 + r() * 2, h = 4.6 + r() * 1.4;
    const b = box(w, h, 6, mat(WALL[Math.floor(r() * WALL.length)])); b.position.y = h / 2; g.add(b);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, 6) / 2 + 0.3, 2, 4), mat(ROOF[Math.floor(r() * ROOF.length)], { flatShading: true })); rf.rotation.y = Math.PI / 4; rf.scale.z = 6 / w; rf.position.y = h + 1; rf.castShadow = true; g.add(rf);
    for (const xx of [-w * 0.25, w * 0.25]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), mat('#40495a')); wn.position.set(xx, 1.8, 3.02); g.add(wn); }
  };
  for (const x of [-13, 13]) add(x, -5, 0);
  for (const x of [-14, -5, 4, 13]) add(x, 17, Math.PI);
}

// ---- 段ボール ----
const cardM = mat('#c89a62'), cardDark = mat('#b2864f'), tapeM = mat('#e7d3a8');
function makeParcel(w = 0.6, h = 0.4, d = 0.45) {
  const g = new THREE.Group();
  const b = box(w, h, d, cardM); b.position.y = h / 2; g.add(b);
  const tp = box(w * 0.18, 0.012, d * 1.01, tapeM); tp.position.y = h + 0.006; tp.castShadow = false; g.add(tp);
  const lab = box(w * 0.3, 0.012, d * 0.25, mat('#f5f5f0')); lab.position.set(w * 0.25, h + 0.008, d * 0.22); lab.castShadow = false; g.add(lab);
  return g;
}

// ---- 配送車（白い車体＋帯。架空の もしも便） ----
function makeVan({ band = '#7a6bb8' } = {}) {
  const g = new THREE.Group();
  const white = mat('#f3f4f6'), bandM = mat(band), dark = mat('#2a2d33'), glass = mat('#5c6f86');
  const cargo = box(3.6, 2.3, 2.0, white); cargo.position.set(-0.6, 1.55, 0); g.add(cargo);
  const cab = box(1.5, 1.7, 1.9, white); cab.position.set(1.95, 1.25, 0); g.add(cab);
  const ws = box(0.06, 0.8, 1.6, glass); ws.position.set(2.71, 1.55, 0); g.add(ws);
  for (const s of [-1, 1]) {
    const sw = box(0.8, 0.6, 0.04, glass); sw.position.set(2.0, 1.6, s * 0.97); g.add(sw);
    const bd = box(3.62, 0.28, 0.04, bandM); bd.position.set(-0.6, 1.0, s * 1.01); g.add(bd);
  }
  const bumper = box(0.2, 0.3, 2.0, dark); bumper.position.set(2.75, 0.55, 0); g.add(bumper);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), hl); l.position.set(2.71, 0.95, s * 0.65); g.add(l); }
  const hz = []; const hzM = new THREE.MeshBasicMaterial({ color: 0xffa21a });
  for (const [x, s] of [[2.72, -1], [2.72, 1], [-2.42, -1], [-2.42, 1]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), hzM); l.position.set(x, 0.8, s * 0.82); g.add(l); hz.push(l); }
  for (const x of [-1.7, 1.9]) for (const s of [-1, 1]) { const w = box(0.75, 0.75, 0.28, mat('#1b1d22')); w.position.set(x, 0.38, s * 0.9); g.add(w); }
  // 荷台の後ろの扉（x- 側）。開くと中に荷物
  const doorG = new THREE.Group(); doorG.position.set(-2.4, 1.55, 0.98); g.add(doorG);
  const rd = box(0.06, 2.2, 1.95, white); rd.position.set(0, 0, -0.975); doorG.add(rd);
  const inside = new THREE.Group(); g.add(inside);
  { const r = rng(5); for (let i = 0; i < 10; i++) { const p = makeParcel(0.45 + r() * 0.2, 0.3 + r() * 0.2, 0.4 + r() * 0.15); p.position.set(-2.0 + (i % 3) * 0.55, 0.45 + Math.floor(i / 3) * 0.42, -0.5 + (i % 2) * 0.6); inside.add(p); } }
  g.userData = {
    setDoor(k) { doorG.rotation.y = -k * 1.7; },
    setHazard(on) { hz.forEach(l => l.visible = !!on); },
    inside,
  };
  g.userData.setHazard(false);
  return g;
}

// ---- 配達員（架空の服：グレーのシャツ・紺のズボン・紺の帽子） ----
function makeCourier(seed = 1) {
  const r = rng(seed);
  const p = makePerson({ skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * 3)], shirt: '#8d96a3', pants: '#2b3346' });
  const cap = box(0.45, 0.12, 0.44, mat('#2b3346')); cap.position.y = 0.5; p.userData.head.add(cap);
  const brim = box(0.4, 0.04, 0.2, mat('#2b3346')); brim.position.set(0, 0.45, 0.28); p.userData.head.add(brim);
  return p;
}
// 両手で荷物を前に抱えるポーズ（arms を前に）
function carryPose(p, k = 1) { const { arms } = p.userData; arms.forEach(a => { a.rotation.x = -1.25 * k; }); }

// ---- 段ボールの山（InstancedMesh） ----
function makePile(scene, { cols = 10, rows = 10, layers = 6, size = 0.9, x = 0, z = 0, gap = 0.04 } = {}) {
  const max = cols * rows * layers;
  const geo = new THREE.BoxGeometry(size, size * 0.7, size * 0.85);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), max);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const r = rng(cols * 31 + layers);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  const cols3 = ['#c89a62', '#b98c56', '#d3a870', '#bf9259'];
  let i = 0;
  for (let l = 0; l < layers; l++) for (let ro = 0; ro < rows; ro++) for (let co = 0; co < cols; co++) {
    const px = x + (co - (cols - 1) / 2) * (size + gap) + (r() - .5) * 0.06;
    const pz = z + (ro - (rows - 1) / 2) * (size * 0.85 + gap) + (r() - .5) * 0.06;
    const py = 0.3 + size * 0.35 + l * size * 0.7;
    m.makeRotationY((r() - .5) * 0.12); m.setPosition(px, py, pz); mesh.setMatrixAt(i, m);
    c.set(cols3[Math.floor(r() * cols3.length)]); mesh.setColorAt(i, c); i++;
  }
  mesh.count = 0; scene.add(mesh);
  return { mesh, max, setN(k) { mesh.count = Math.max(0, Math.min(max, Math.round(k))); }, height: (n) => 0.3 + Math.ceil(n / (cols * rows)) * size * 0.7 };
}

const ENV = {
  day: { top: '#5c9fe0', bot: '#e4f1fa', fog: '#dfe8f2', hi: 1.15, si: 1.4, sc: '#fff4e0', win: 0, lamp: 0 },
  dusk: { top: '#4f6fa8', bot: '#f2b98f', fog: '#d9b49c', hi: 1.05, si: 1.1, sc: '#ffc89a', win: 0.6, lamp: 1.2 },
  night: { top: '#14234a', bot: '#3a4c7a', fog: '#26314f', hi: 0.85, si: 0.5, sc: '#b3c3ff', win: 1.3, lamp: 0.9 },
};
function setPorchEnv(e) {
  const E = ENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  porch.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc);
  glassM.emissiveIntensity = E.win; porchLamp.intensity = E.lamp;
}
setPorchEnv('day');

export { porch, canopy, DOORSTEP, makeParcel, makeVan, makeCourier, carryPose, makePile, setPorchEnv, cardM, cardDark };
