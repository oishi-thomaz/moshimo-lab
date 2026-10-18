import * as THREE from 'three';
import { rng, mat, box, makeSky, clamp, lerp } from '../lib.js';

// =====================================================
// TOWN: 郊外の住宅街（一戸建てが道ぞいに並ぶ）。上から斜めに見下ろす用。
// 地面 y=0、道は x=0（縦）と z=0（横）の十字。家は道の両側に並ぶ（全体で約 ±30）。
// API
//   town (Scene), HOUSES [{g, x, z, q, lit}]（q は 0..1 の乱数。空き家にする順番に使う）
//   setTownEnv('day'|'dusk'|'night')
//   setVacant(k, grow=1) : q < k の家を空き家に（窓の明かりが消え、屋根と壁がくすみ、庭に草）。grow で草の量 0..1
//   人や車は動画側で town.add して動かす（歩道は x=±4.3 / z=±4.3）
// =====================================================
const town = new THREE.Scene();
const sky = makeSky(); town.add(sky);
town.fog = new THREE.Fog(0xdfe8f2, 70, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5240, 1.1); town.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(30, 50, 25); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 }); sun.shadow.bias = -0.0005;
town.add(sun);

const grassM = mat('#7fae6a'), roadM = mat('#545a64'), walkM = mat('#c9ccd1'), lineM = mat('#e9ecef');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), grassM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; town.add(ground);
for (const [w, d] of [[7, 200], [200, 7]]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadM); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; r.receiveShadow = true; town.add(r); }
for (let v = -96; v < 96; v += 6) { const a = box(0.18, 0.02, 2.6, lineM); a.position.set(0, 0.04, v); a.castShadow = false; town.add(a); const b = box(2.6, 0.02, 0.18, lineM); b.position.set(v, 0.04, 0); b.castShadow = false; town.add(b); }
for (const s of [-1, 1]) { const a = box(1.6, 0.12, 200, walkM); a.position.set(s * 4.3, 0.06, 0); a.castShadow = false; town.add(a); const b = box(200, 0.12, 1.6, walkM); b.position.set(0, 0.06, s * 4.3); b.castShadow = false; town.add(b); }

const WALL = ['#efe6d6', '#e6dccb', '#f4f1ea', '#d9cdb8', '#e9e2d8', '#dfe3e6', '#f1e3cf'];
const ROOF = ['#7a4b3a', '#4f5d73', '#5f6b52', '#8a5a44', '#3f4652', '#6c4a5e', '#9a6a3a'];
const DARK = new THREE.Color('#8b8478'), DARKR = new THREE.Color('#5d5a55');
const litC = new THREE.Color('#ffd98a'), offC = new THREE.Color('#2a3140');
const weedM = mat('#5d7f3e', { flatShading: true });
const HOUSES = [];
{
  const r = rng(23);
  const slots = [];
  // 道の両側に区画。十字の4つの角の区画に家を2列ずつ
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    // 縦の道に面した列（j=0）と、その奥の列（j=1）
    const along = 9 + i * 7.5; const off = 9 + j * 8;
    slots.push({ x: sx * off, z: sz * along, face: sx > 0 ? -Math.PI / 2 : Math.PI / 2 });
  }
  for (const s of slots) {
    const g = new THREE.Group(); g.position.set(s.x + (r() - .5) * 0.6, 0, s.z + (r() - .5) * 0.6); g.rotation.y = s.face; town.add(g);
    const w = 4.2 + r() * 1.2, d = 4.2 + r() * 0.8, h = 2.6 + (r() < 0.5 ? 2.4 : 0);
    const wallM = mat(WALL[Math.floor(r() * WALL.length)]), roofM = mat(ROOF[Math.floor(r() * ROOF.length)], { flatShading: true });
    const body = box(w, h, d, wallM); body.position.y = h / 2; g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.35, 1.7, 4), roofM); roof.rotation.y = Math.PI / 4; roof.scale.z = d / w; roof.position.y = h + 0.85; roof.castShadow = true; g.add(roof);
    // 窓（正面 +z 側）：1階2つ、2階建てなら2階にも2つ
    const wins = [];
    const rows = h > 3 ? [1.25, 3.7] : [1.25];
    for (const y of rows) for (const x of [-w * 0.24, w * 0.24]) {
      const m = new THREE.MeshLambertMaterial({ color: '#3a4250', emissive: litC.clone(), emissiveIntensity: 0 });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.85), m); p.position.set(x, y, d / 2 + 0.02); g.add(p); wins.push(m);
    }
    const door = box(0.8, 1.5, 0.08, mat('#6b4f3a')); door.position.set(0, 0.75, d / 2 + 0.03); g.add(door);
    // 庭の草（空き家で伸びる）
    const weeds = new THREE.Group(); g.add(weeds);
    for (let k = 0; k < 9; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.35 + r() * 0.3, 0.9 + r() * 0.9, 5), weedM); c.position.set((r() - .5) * (w + 1.5), 0.4, d / 2 + 0.6 + r() * 1.6); weeds.add(c); }
    weeds.visible = false;
    const fence = box(w + 1.6, 0.6, 0.12, mat('#d8d2c4')); fence.position.set(0, 0.3, d / 2 + 2.6); g.add(fence);
    HOUSES.push({ g, x: g.position.x, z: g.position.z, q: r(), lit: r() < 0.85, wins, wallM, roofM, wall0: wallM.color.clone(), roof0: roofM.color.clone(), weeds });
  }
}
// 街灯
const bulbM = new THREE.MeshBasicMaterial({ color: 0xfff2cf });
for (let v = -60; v <= 60; v += 15) for (const s of [-1, 1]) {
  if (Math.abs(v) < 6) continue;
  const p = box(0.14, 4.2, 0.14, mat('#3b3f47')); p.position.set(s * 5.3, 2.1, v); town.add(p);
  const b = box(0.4, 0.14, 0.4, bulbM); b.position.set(s * 4.8, 4.2, v); town.add(b);
}
const lamps = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffe2b0, 0, 22, 1.3); l.position.set(0, 4, -12 + i * 12); town.add(l); lamps.push(l); }

const ENV = {
  day: { top: '#5c9fe0', bot: '#e4f1fa', fog: '#dfe8f2', hi: 1.15, si: 1.5, sc: '#fff4e0', win: 0, grass: '#7fae6a', lamp: 0 },
  dusk: { top: '#4f6fa8', bot: '#f2b98f', fog: '#d9b49c', hi: 1.0, si: 1.1, sc: '#ffc89a', win: 0.7, grass: '#7a9d63', lamp: 6 },
  night: { top: '#0a1430', bot: '#2a3a66', fog: '#18223e', hi: 0.75, si: 0.45, sc: '#a9bcff', win: 1.6, grass: '#3d5a3c', lamp: 14 },
};
let curEnv = 'day', curVac = 0;
function applyWins() {
  const E = ENV[curEnv];
  for (const h of HOUSES) { const vac = h.q < curVac; for (const m of h.wins) { m.emissiveIntensity = (!vac && h.lit) ? E.win : 0; m.color.copy(vac ? offC : new THREE.Color('#3a4250')); } }
}
function setTownEnv(e) {
  curEnv = e; const E = ENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  town.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); grassM.color.set(E.grass);
  lamps.forEach(l => l.intensity = E.lamp);
  applyWins();
}
function setVacant(k, grow = 1) {
  curVac = k;
  for (const h of HOUSES) {
    const vac = h.q < k;
    h.wallM.color.copy(h.wall0); h.roofM.color.copy(h.roof0);
    if (vac) { h.wallM.color.lerp(DARK, 0.45 * grow); h.roofM.color.lerp(DARKR, 0.5 * grow); }
    h.weeds.visible = vac && grow > 0.05; h.weeds.scale.setScalar(Math.max(0.01, grow));
  }
  applyWins();
}
setTownEnv('day');

export { town, HOUSES, setTownEnv, setVacant };
