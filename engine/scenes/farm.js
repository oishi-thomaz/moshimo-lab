import * as THREE from 'three';
import { rng, mat, box, makeSky, makePerson, SKIN, HAIR } from '../lib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// =====================================================
// FARM: 日本の農村（田んぼ・キャベツ畑・農家の家と納屋・小型トラクター・山・電柱）
// Layout (x right, z toward camera): 田んぼ 3列×2段 x -15..15, z -16..0（1枚 9×7m）
//   畑（キャベツの畝）x 3..15, z 3..11 / 家と納屋 x -15..-6, z 4..11 / 農道 x -1..1（z 方向）と z=1.5（x 方向）
// API
//   farm (Scene), setFarmEnv('day'|'dusk'|'gray')
//   setRice(grow 0..1, gold 0..1)  稲の高さと色（gold=1 で黄金色）
//   setVeg(k 0..1)                 キャベツの量（k の割合だけ残る）
//   setWeeds(k 0..1)               耕作放棄：田畑に雑草が伸びる（0 で無し）
//   makeFarmer(r, {hat})           麦わら帽子の農家（makePerson＋帽子）。farmerWork(p, t) で腰をかがめて作業
//   makeTractor() → Group（userData.spin(t) で車輪が回る）。色は架空（ブランド色は使わない）
//   PADDIES: [{x,z,w,d}]  FIELD: {x,z,w,d}
// =====================================================
const farm = new THREE.Scene();
const sky = makeSky(); farm.add(sky);
farm.fog = new THREE.Fog(0xd6e8f4, 70, 260);
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a7a3a, 1.1); farm.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.6); sun.position.set(25, 40, 25); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 }); farm.add(sun);
const groundM = mat('#86a85a');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; farm.add(ground);

const STATIC = new Map();
const sg = (g, m) => { if (!STATIC.has(m)) STATIC.set(m, []); STATIC.get(m).push(g.index ? g.toNonIndexed() : g); };
const levM = mat('#7d9a4e'), roadM = mat('#c2ad86'), soilM = mat('#7a5a3e'), mtM = mat('#5f8a5a', { flatShading: true }), mt2M = mat('#4f7a52', { flatShading: true });
const waterM = new THREE.MeshLambertMaterial({ color: '#8fb6c9', emissive: 0x23485a, emissiveIntensity: 0.35 });

// paddies
const PADDIES = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) PADDIES.push({ x: -10 + i * 10, z: -12 + j * 8, w: 9, d: 7 });
for (const p of PADDIES) {
  const w = new THREE.PlaneGeometry(p.w, p.d); w.rotateX(-Math.PI / 2); w.translate(p.x, 0.05, p.z); sg(w, waterM);
  for (const s of [-1, 1]) {
    const a = new THREE.BoxGeometry(p.w + 1, 0.3, 0.5); a.translate(p.x, 0.15, p.z + s * (p.d / 2 + 0.25)); sg(a, levM);
    const b = new THREE.BoxGeometry(0.5, 0.3, p.d); b.translate(p.x + s * (p.w / 2 + 0.25), 0.15, p.z); sg(b, levM);
  }
}
// farm roads
{ const a = new THREE.BoxGeometry(2, 0.06, 60); a.translate(0, 0.03, -5); sg(a, roadM); const b = new THREE.BoxGeometry(60, 0.06, 2); b.translate(0, 0.03, 1.6); sg(b, roadM); }
// vegetable field
const FIELD = { x: 9, z: 7, w: 12, d: 8 };
{ const s = new THREE.BoxGeometry(FIELD.w, 0.08, FIELD.d); s.translate(FIELD.x, 0.04, FIELD.z); sg(s, mat('#8a6a48')); }
for (let row = 0; row < 6; row++) { const b = new THREE.BoxGeometry(FIELD.w - 1, 0.25, 0.7); b.translate(FIELD.x, 0.12, FIELD.z - 3.2 + row * 1.3); sg(b, soilM); }
// mountains
{
  const r = rng(5);
  for (let i = 0; i < 14; i++) {
    const x = -160 + i * 25 + r() * 10, z = -120 - r() * 40, h = 30 + r() * 35;
    const c = new THREE.ConeGeometry(28 + r() * 15, h, 7); c.translate(x, h / 2 - 2, z); sg(c, i % 2 ? mtM : mt2M);
  }
  // tree clumps
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 30 + r() * 40, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.7 - 8;
    if (z > 14 && Math.abs(x) < 25) continue;
    const ic = new THREE.IcosahedronGeometry(1.6 + r() * 1.2, 0); ic.translate(x, 2.2 + r(), z); sg(ic, r() < .5 ? mtM : mt2M);
    const tr = new THREE.BoxGeometry(0.4, 1.5, 0.4); tr.translate(x, 0.75, z); sg(tr, mat('#6b4f3a'));
  }
}
// utility poles along the road
for (let i = 0; i < 6; i++) {
  const p = new THREE.CylinderGeometry(0.12, 0.15, 8, 6); p.translate(17.5, 4, -20 + i * 8); sg(p, mat('#8f8a80'));
  const c = new THREE.BoxGeometry(1.6, 0.12, 0.12); c.translate(17.5, 7.4, -20 + i * 8); sg(c, mat('#8f8a80'));
}
// farmhouse + barn
const house = new THREE.Group(); house.position.set(-11, 0, 8); farm.add(house);
{
  const body = box(6, 3, 4.5, mat('#e8e0cf')); body.position.y = 1.5; house.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.9, 2.2, 4), mat('#4a4f58', { flatShading: true })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.3, 1, 0.95); roof.position.y = 4.1; roof.castShadow = true; house.add(roof);
  const eaves = box(7, 0.15, 5.4, mat('#3b3f47')); eaves.position.y = 3.05; house.add(eaves);
  for (const x of [-1.6, 1.4]) { const w = box(1.1, 0.9, 0.06, mat('#9fc3d9', { emissive: 0x16303f, emissiveIntensity: 0.3 })); w.position.set(x, 1.8, 2.27); house.add(w); }
  const door = box(1.2, 2, 0.06, mat('#6b4f3a')); door.position.set(0, 1, 2.27); house.add(door);
  const barn = box(4, 2.6, 3.5, mat('#9a7f62')); barn.position.set(6.2, 1.3, -0.5); house.add(barn);
  const broof = box(4.4, 0.18, 4, mat('#7a8088')); broof.position.set(6.2, 2.75, -0.5); broof.rotation.z = 0.12; house.add(broof);
  const bOpen = box(2.4, 2, 0.05, mat('#2e2620')); bOpen.position.set(6.2, 1.0, 1.27); house.add(bOpen);
}
for (const [m, gs] of STATIC) { const mesh = new THREE.Mesh(mergeGeometries(gs), m); mesh.receiveShadow = true; mesh.castShadow = m !== waterM; farm.add(mesh); }

// rice (instanced tufts)
const riceGeo = new THREE.ConeGeometry(0.06, 1, 4); riceGeo.translate(0, 0.5, 0);
const riceM = new THREE.MeshLambertMaterial({ color: '#5fa344', flatShading: true });
const riceSpots = [];
for (const p of PADDIES) for (let ix = 0; ix < 14; ix++) for (let iz = 0; iz < 10; iz++) riceSpots.push([p.x - p.w / 2 + 0.45 + ix * (p.w - 0.9) / 13, p.z - p.d / 2 + 0.45 + iz * (p.d - 0.9) / 9]);
const rice = new THREE.InstancedMesh(riceGeo, riceM, riceSpots.length); rice.castShadow = true; farm.add(rice);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
const RG = new THREE.Color('#5fa344'), RY = new THREE.Color('#d9b542');
function setRice(grow = 1, gold = 0) {
  const r = rng(9);
  riceSpots.forEach(([x, z], i) => {
    const h = Math.max(0.001, (0.2 + 0.5 * grow) * (0.85 + r() * 0.3));
    _e.set((r() - .5) * 0.25, r() * 6, (r() - .5) * 0.25); _q.setFromEuler(_e);
    _m.compose(_p.set(x, 0.05, z), _q, _s.set(1.6, h, 1.6)); rice.setMatrixAt(i, _m);
  });
  rice.instanceMatrix.needsUpdate = true; riceM.color.copy(RG).lerp(RY, gold);
}
// cabbages
const cabGeo = new THREE.IcosahedronGeometry(0.32, 1);
const cabM = new THREE.MeshLambertMaterial({ color: '#9cc76a', flatShading: true });
const cabSpots = []; { const r = rng(17); for (let row = 0; row < 6; row++) for (let k = 0; k < 14; k++) cabSpots.push([FIELD.x - 5.3 + k * 0.82, FIELD.z - 3.2 + row * 1.3, r()]); }
const cabs = new THREE.InstancedMesh(cabGeo, cabM, cabSpots.length); cabs.castShadow = true; farm.add(cabs);
function setVeg(k = 1) {
  cabSpots.forEach(([x, z, q], i) => { const s = q < k ? 1 : 0.0001; _m.compose(_p.set(x, 0.38, z), _q.identity(), _s.set(s, s * 0.8, s)); cabs.setMatrixAt(i, _m); });
  cabs.instanceMatrix.needsUpdate = true;
}
// weeds (abandoned land)
const weedGeo = new THREE.ConeGeometry(0.24, 1, 5); weedGeo.translate(0, 0.5, 0);
const weedM = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
const weedSpots = []; { const r = rng(23); for (let i = 0; i < 1400; i++) { const p = i < 1150 ? PADDIES[i % PADDIES.length] : { x: FIELD.x, z: FIELD.z, w: FIELD.w, d: FIELD.d }; weedSpots.push([p.x + (r() - .5) * p.w, p.z + (r() - .5) * p.d, r(), r(), r()]); } }
const weeds = new THREE.InstancedMesh(weedGeo, weedM, weedSpots.length); weeds.castShadow = true; farm.add(weeds);
const WC = [new THREE.Color('#9aae58'), new THREE.Color('#b5b060'), new THREE.Color('#86a04c'), new THREE.Color('#c2b878')];
weedSpots.forEach((w, i) => weeds.setColorAt(i, WC[Math.floor(w[4] * WC.length)]));
function setWeeds(k = 0) {
  weedSpots.forEach(([x, z, q, h, rot], i) => {
    const u = Math.max(0, Math.min(1, (k - q * 0.6) / 0.4)); const s = Math.max(0.0001, u);
    _e.set(0, rot * 6, (h - .5) * 0.3); _q.setFromEuler(_e);
    _m.compose(_p.set(x, 0, z), _q, _s.set(s * (0.8 + h * 0.6), s * (0.25 + h * 0.45), s * (0.8 + h * 0.6))); weeds.setMatrixAt(i, _m);
  });
  weeds.instanceMatrix.needsUpdate = true; weeds.visible = k > 0;
  waterM.color.copy(WATER).lerp(MUD, Math.min(1, k * 1.2)); waterM.emissiveIntensity = 0.35 * (1 - Math.min(1, k));
}
const WATER = new THREE.Color('#8fb6c9'), MUD = new THREE.Color('#8f7a58');
setRice(0.7, 0); setVeg(1); setWeeds(0);

// farmer (straw hat)
const strawM = mat('#e3c77a'), bandM = mat('#b8483a');
function makeFarmer(r, opt = {}) {
  const shirts = ['#5f7f9a', '#8a6a4a', '#6f8f5a', '#e9e4da', '#9a5f5f', '#4f6f8a'];
  const p = makePerson({ skin: SKIN[Math.floor(r() * SKIN.length)], hair: r() < 0.6 ? '#9a9a9a' : HAIR[Math.floor(r() * 3)], shirt: shirts[Math.floor(r() * shirts.length)], pants: '#4a4f5a', long: r() < 0.4, scale: 0.95 + r() * 0.08 });
  if (opt.hat !== false) {
    const hat = new THREE.Group(); hat.position.y = 0.5; p.userData.head.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 14), strawM); hat.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 12), strawM); crown.position.y = 0.11; hat.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 12), bandM); band.position.y = 0.04; hat.add(band);
  }
  return p;
}
// bending work pose (planting / harvesting)
function farmerWork(p, t, ph = 0) {
  const { legs, arms, head } = p.userData;
  const b = 0.55 + Math.sin(t * 2.2 + ph) * 0.12;
  legs[0].rotation.x = legs[1].rotation.x = 0; p.position.y = 0;
  arms[0].rotation.x = -b - 0.5 - Math.sin(t * 4.4 + ph) * 0.25; arms[1].rotation.x = -b - 0.6 + Math.sin(t * 4.4 + ph) * 0.25;
  head.rotation.x = 0.25;
  p.userData.bend = b;
  if (!p.userData.torsoPivot) {
    // tilt the upper body by moving head/arms/torso into a pivot at hip height
    const piv = new THREE.Group(); piv.position.y = 0.86; p.add(piv);
    p.children.slice().forEach(c => { if (c !== legs[0] && c !== legs[1] && c !== piv) { p.remove(c); c.position.y -= 0.86; piv.add(c); } });
    p.userData.torsoPivot = piv;
  }
  p.userData.torsoPivot.rotation.x = b;
}

// tractor (fictional colours)
const tBody = mat('#5f8fa8'), tDark = mat('#2a2d33'), tSeat = mat('#3b3f47'), tTyre = mat('#1d1f23'), tHub = mat('#e8e2d0');
function makeTractor() {
  const g = new THREE.Group();
  const hood = box(1.6, 0.8, 1.0, tBody); hood.position.set(0.7, 1.0, 0); g.add(hood);
  const cab = box(1.0, 0.5, 1.1, tBody); cab.position.set(-0.4, 0.95, 0); g.add(cab);
  const seat = box(0.45, 0.45, 0.6, tSeat); seat.position.set(-0.5, 1.4, 0); g.add(seat);
  const wheel = box(0.06, 0.4, 0.06, tDark); wheel.position.set(0.0, 1.5, 0); wheel.rotation.z = 0.5; g.add(wheel);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), tDark); pipe.position.set(1.0, 1.65, 0.3); g.add(pipe);
  const rops = box(0.08, 1.4, 0.08, tDark); rops.position.set(-0.95, 1.7, 0.5); g.add(rops); const rops2 = rops.clone(); rops2.position.z = -0.5; g.add(rops2);
  const ropsT = box(0.08, 0.08, 1.08, tDark); ropsT.position.set(-0.95, 2.4, 0); g.add(ropsT);
  const wheels = [];
  for (const [x, r, w] of [[-0.6, 0.7, 0.35], [1.1, 0.42, 0.25]]) for (const s of [-1, 1]) {
    const wg = new THREE.Group(); wg.position.set(x, r, s * 0.72); g.add(wg);
    const ty = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), tTyre); ty.rotation.x = Math.PI / 2; ty.castShadow = true; wg.add(ty);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 10), tHub); hub.rotation.x = Math.PI / 2; wg.add(hub);
    const spoke = box(r * 0.9, 0.08, w + 0.04, tBody); wg.add(spoke); wheels.push({ wg, r });
  }
  g.userData.spin = (dist) => wheels.forEach(w => { w.wg.rotation.z = -dist / w.r; });
  return g;
}

const ENVS = {
  day: { top: '#5c9fe0', bot: '#dff0fb', fog: '#d6e8f4', hi: 1.1, si: 1.6, sc: '#fff4e0', g: '#86a85a', w: '#8fb6c9' },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#d9b49c', hi: 0.9, si: 1.15, sc: '#ffc89a', g: '#7a9a50', w: '#c9a58f' },
  gray: { top: '#7f8994', bot: '#c4c8cc', fog: '#b8bcc2', hi: 1.0, si: 0.7, sc: '#e8e8e8', g: '#8f9a6a', w: '#9aa8ad' },
};
function setFarmEnv(e) {
  const E = ENVS[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  farm.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); groundM.color.set(E.g); WATER.set(E.w); waterM.color.set(E.w);
}
setFarmEnv('day');

export { farm, setFarmEnv, setRice, setVeg, setWeeds, makeFarmer, farmerWork, makeTractor, PADDIES, FIELD, house as farmHouse };
