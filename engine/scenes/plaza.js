import * as THREE from 'three';
import { rng, mat, box, makeSky, canvasTex, randPerson } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// PLAZA: 駅前広場（架空の もしも台駅の駅舎・タイルの広場・ベンチ・植え込み・時計の柱）とローポリのハト
// 地面 y=0。広場は x -16..16 / z -12..10。駅舎は奥（z=-11）、ひさし（ハトがとまる段）は y=4.1・z=-9.6。
// API
//   plaza (Scene), setPlazaEnv('day'|'dusk')
//   makePigeon({coat}) : ハト1羽（体長約0.33m、+x 向き）。userData.anim(t, {walk, peck, fly})、userData.wing(k)
//   makeFlock(n, seed, {x0,x1,z0,z1,y}) : 地面を歩いてつつくハトの群れ。set(count, t, {fly}) で数と動き、birds で一覧
//   LEDGE（ひさしの上のハトの並ぶ位置 y）、BENCHES（座面の位置）、makeDroppings(n, seed, {x0,x1,z0,z1,y}) で白いフンの跡（setK で量）
//   makePlazaPeople(n, seed) : 広場の人。set(k, t, {look}) で人数と動き
// =====================================================
const plaza = new THREE.Scene();
const sky = makeSky(); plaza.add(sky);
plaza.fog = new THREE.Fog(0xdfe8f2, 60, 200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5650, 1.1); plaza.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(18, 30, 14); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 90 }); sun.shadow.bias = -0.0005;
plaza.add(sun);

const tileTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#cfc8bb'; g.fillRect(0, 0, w, h);
  const r = rng(3);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const c = 190 + r() * 22; g.fillStyle = `rgb(${c},${c - 6},${c - 16})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
});
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(16, 12);
const tileM = new THREE.MeshLambertMaterial({ map: tileTex });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(36, 26), tileM); ground.rotation.x = -Math.PI / 2; ground.position.z = -1; ground.receiveShadow = true; plaza.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 10), mat('#545a64')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 17); road.receiveShadow = true; plaza.add(road);
const far = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat('#9aa39a')); far.rotation.x = -Math.PI / 2; far.position.y = -0.02; plaza.add(far);
for (let v = -60; v < 60; v += 5) { const l = box(2.4, 0.02, 0.18, mat('#e9ecef')); l.position.set(v, 0.03, 17); l.castShadow = false; plaza.add(l); }
const curb = box(36, 0.18, 0.4, mat('#b9bcc2')); curb.position.set(0, 0.09, 12); plaza.add(curb);

// station building
const ST = new THREE.Group(); plaza.add(ST);
{
  const wallM = mat('#e6e1d6'), darkM = mat('#5b6370');
  const body = box(22, 7, 5, wallM); body.position.set(0, 3.5, -13.5); ST.add(body);
  const roof = box(23, 0.5, 6, mat('#6b7280')); roof.position.set(0, 7.25, -13.5); ST.add(roof);
  const glassM = new THREE.MeshLambertMaterial({ color: '#7f97ad', emissive: 0xfff1cf, emissiveIntensity: 0 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(12, 3.4, 0.1), glassM); glass.position.set(0, 1.7, -10.95); ST.add(glass);
  ST.userData.glassM = glassM;
  for (const x of [-6.2, -2.1, 2.1, 6.2]) { const p = box(0.35, 3.6, 0.35, darkM); p.position.set(x, 1.8, -10.85); ST.add(p); }
  // eave (ledge where pigeons sit)
  const eave = box(16, 0.3, 1.6, mat('#d4cfc4')); eave.position.set(0, 4.0, -10.2); ST.add(eave);
  for (const x of [-9.5, 9.5]) for (let k = 0; k < 2; k++) { const w = box(2.4, 1.6, 0.1, glassM); w.position.set(x + (k ? 0 : 0), 5.4, -10.95); ST.add(w); }
  const sign = textSprite('もしも台駅', { w: 768, h: 160, size: 104, bg: 'rgba(32,52,92,.95)', radius: 10, sx: 6.2 }); sign.position.set(0, 5.6, -10.8); ST.add(sign);
  ST.userData.sign = sign;
}
const LEDGE = { y: 4.15, z: -10.0, x0: -7.5, x1: 7.5 };

// benches, planters, trees, clock pole
const BENCHES = [];
{
  const woodM = mat('#9a6b44'), legM = mat('#4a4f57');
  for (const [x, z, ry] of [[-7, -3, 0], [7, -3, 0], [-7, 4, Math.PI], [7, 4, Math.PI]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; plaza.add(g);
    const seat = box(2.6, 0.12, 0.6, woodM); seat.position.y = 0.48; g.add(seat);
    const back = box(2.6, 0.5, 0.1, woodM); back.position.set(0, 0.8, -0.28); g.add(back);
    for (const s of [-1, 1]) { const l = box(0.1, 0.48, 0.55, legM); l.position.set(s * 1.1, 0.24, 0); g.add(l); }
    BENCHES.push({ x, z, y: 0.54 });
  }
  const potM = mat('#8d8a82'), leafM = mat('#4f8a4a', { flatShading: true }), trunkM = mat('#6b4f3a');
  for (const [x, z] of [[-12, -6], [12, -6], [-12, 6], [12, 6]]) {
    const pot = box(2.4, 0.6, 2.4, potM); pot.position.set(x, 0.3, z); plaza.add(pot);
    const soil = box(2.2, 0.05, 2.2, mat('#5a4636')); soil.position.set(x, 0.62, z); plaza.add(soil);
    const tr = box(0.25, 2.2, 0.25, trunkM); tr.position.set(x, 1.7, z); plaza.add(tr);
    const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), leafM); lf.position.set(x, 3.4, z); lf.castShadow = true; plaza.add(lf);
  }
  const pole = box(0.18, 3.6, 0.18, legM); pole.position.set(-3.8, 1.8, 1.5); plaza.add(pole);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 20), mat('#f4f4f2')); face.rotation.x = Math.PI / 2; face.position.set(-3.8, 3.7, 1.5); plaza.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 20), legM); rim.position.set(-3.8, 3.7, 1.59); plaza.add(rim);
  const hh = box(0.05, 0.3, 0.02, mat('#222')); hh.position.set(-3.8, 3.8, 1.6); plaza.add(hh);
  const mh = box(0.04, 0.42, 0.02, mat('#222')); mh.position.set(-3.65, 3.62, 1.6); mh.rotation.z = -2.2; plaza.add(mh);
}
// buildings across the road (back of the camera when looking at the station)
{
  const r = rng(9);
  for (let i = 0; i < 9; i++) { const w = 6 + r() * 4, h = 6 + r() * 14; const b = box(w, h, 6, mat(['#c9cfd9', '#b9c3d1', '#d8d2c8', '#aeb9c8'][i % 4])); b.position.set(-34 + i * 8.5, h / 2, 27); plaza.add(b); }
  for (let i = 0; i < 6; i++) { const w = 7, h = 9 + r() * 16; const b = box(w, h, 6, mat(['#c2c8d2', '#d0cabf'][i % 2])); b.position.set(i < 3 ? -26 - i * 8 : 26 + (i - 3) * 8, h / 2, -14); plaza.add(b); }
}

// ---------- pigeon ----------
const COATS = ['#8c95a6', '#7d8697', '#9aa1ae', '#6f7685', '#a7a39d'];
function makePigeon(opt = {}) {
  const g = new THREE.Group();
  const coat = mat(opt.coat || COATS[0], { flatShading: true }), dark = mat('#4b5160', { flatShading: true });
  const neckM = new THREE.MeshLambertMaterial({ color: '#4e7d6a', emissive: 0x3a2a55, emissiveIntensity: 0.25, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 9, 6), coat); body.scale.set(0.3, 0.2, 0.17); body.position.set(0, 0.17, 0); body.castShadow = true; g.add(body);
  const tail = box(0.14, 0.03, 0.09, dark); tail.position.set(-0.17, 0.17, 0); tail.rotation.z = 0.25; g.add(tail);
  const head = new THREE.Group(); head.position.set(0.12, 0.25, 0); g.add(head);
  const neck = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 5), neckM); neck.scale.set(0.12, 0.13, 0.1); neck.position.set(0, -0.02, 0); head.add(neck);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), coat); hd.scale.set(0.09, 0.085, 0.08); hd.position.set(0.03, 0.05, 0); head.add(hd);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 4), mat('#3b3b3b')); beak.rotation.z = -Math.PI / 2; beak.position.set(0.09, 0.045, 0); head.add(beak);
  const cere = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), mat('#f0eee8')); cere.position.set(0.072, 0.058, 0); head.add(cere);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.011, 5, 4), mat('#e2752a')); e.position.set(0.05, 0.065, s * 0.034); head.add(e); }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(0.02, 0.23, s * 0.045); g.add(w);
    const p = box(0.24, 0.025, 0.07, coat); p.position.set(-0.04, 0, s * 0.03); w.add(p);
    const bar = box(0.06, 0.028, 0.065, dark); bar.position.set(-0.11, 0.002, s * 0.03); w.add(bar);
    w.rotation.x = s * 0.15; wings.push({ w, s });
  }
  const legs = [];
  for (const s of [-1, 1]) { const l = box(0.018, 0.08, 0.018, mat('#c9615c')); l.position.set(0.01, 0.04, s * 0.035); g.add(l); legs.push(l); }
  const wing = (k) => wings.forEach(({ w, s }) => { w.rotation.x = s * (0.45 - k * 1.9); });
  g.userData.wing = wing;
  g.userData.anim = (t, o = {}) => {
    const walk = o.walk ?? 0, peck = o.peck ?? 0, fly = o.fly ?? 0;
    const bob = Math.sin(t * 9);
    head.position.x = 0.12 + bob * 0.025 * walk;
    head.rotation.z = -peck * (0.5 + 0.5 * Math.max(0, Math.sin(t * 6))) * 1.1;
    head.position.y = 0.25 - peck * 0.05 * Math.max(0, Math.sin(t * 6));
    legs.forEach((l, i) => { l.rotation.z = Math.sin(t * 9 + i * Math.PI) * 0.5 * walk; l.visible = fly < 0.5; });
    wing(fly > 0 ? 0.5 + 0.5 * Math.sin(t * 28) : 0);
  };
  return g;
}

// flock walking & pecking on the ground
function makeFlock(n, seed, { x0 = -5, x1 = 5, z0 = -3, z1 = 3, y = 0 } = {}) {
  const r = rng(seed); const birds = []; const grp = new THREE.Group(); plaza.add(grp);
  for (let i = 0; i < n; i++) {
    const b = makePigeon({ coat: COATS[Math.floor(r() * COATS.length)] }); grp.add(b);
    birds.push({ b, x: x0 + r() * (x1 - x0), z: z0 + r() * (z1 - z0), a: r() * 6.28, sp: 0.15 + r() * 0.2, ph: r() * 10, s: 0.95 + r() * 0.15 });
  }
  function set(count, t, o = {}) {
    birds.forEach((d, i) => {
      const v = i < count; d.b.visible = v; if (!v) return;
      const ang = d.a + Math.sin(t * 0.3 + d.ph) * 1.2;
      const step = (Math.sin(t * 0.7 + d.ph) + 1) * 0.5; // 0..1 walking speed
      const fly = o.fly ? Math.max(0, t - o.fly - (i % 7) * 0.05) : 0;
      const x = d.x + Math.cos(d.a) * Math.sin(t * d.sp + d.ph) * 0.9, z = d.z + Math.sin(d.a) * Math.sin(t * d.sp + d.ph) * 0.9;
      d.b.position.set(x, y + fly * fly * 2.2, z);
      d.b.rotation.y = -ang;
      d.b.scale.setScalar(d.s);
      d.b.userData.anim(t + d.ph, { walk: step > 0.4 ? 1 : 0, peck: step <= 0.4 ? 1 : 0, fly: fly > 0 ? 1 : 0 });
    });
  }
  return { group: grp, birds, set };
}

// droppings (white splats) on a surface
function makeDroppings(n, seed, { x0, x1, z0, z1, y }) {
  const r = rng(seed); const g = new THREE.Group(); plaza.add(g); const m = mat('#f2f0ea'); const list = [];
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.05 + r() * 0.06, 6), m); d.rotation.x = -Math.PI / 2; d.position.set(x0 + r() * (x1 - x0), y + 0.005, z0 + r() * (z1 - z0)); g.add(d); list.push([d, r()]); }
  g.userData.setK = (k) => list.forEach(([d, q]) => d.visible = q < k);
  return g;
}

// people walking across / standing
function makePlazaPeople(n, seed) {
  const r = rng(seed); const list = [];
  for (let i = 0; i < n; i++) { const p = randPerson(r); plaza.add(p); list.push({ p, x: -14 + r() * 28, z: -7 + r() * 12, dir: r() < 0.5 ? 1 : -1, sp: 0.8 + r() * 0.6, walk: r() < 0.65, ry: r() * 6.28 }); }
  function set(k, t, o = {}) {
    list.forEach((d, i) => {
      d.p.visible = i < k; if (!d.p.visible) return;
      if (d.walk) {
        const x = ((d.x + d.dir * t * d.sp + 16) % 32 + 32) % 32 - 16; d.p.position.set(x, 0, d.z); d.p.rotation.y = d.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        const ph = t * 7.5 + i; d.p.userData.legs.forEach((l, j) => l.rotation.x = Math.sin(ph + j * Math.PI) * 0.5); d.p.userData.arms.forEach((a, j) => a.rotation.x = -Math.sin(ph + j * Math.PI) * 0.4);
      } else { d.p.position.set(d.x, 0, d.z); d.p.rotation.y = d.ry; d.p.userData.legs.forEach(l => l.rotation.x = 0); d.p.userData.arms.forEach(a => a.rotation.x = 0); if (o.look) d.p.userData.head.rotation.y = Math.sin(t * 1.3 + i) * 0.6; }
    });
  }
  return { list, set };
}

const ENV = {
  day: { top: '#5c9fe0', bot: '#e4f1fa', fog: '#dfe8f2', hi: 1.15, si: 1.5, sc: '#fff4e0', glass: 0 },
  dusk: { top: '#4f6fa8', bot: '#f2b98f', fog: '#d9b49c', hi: 0.95, si: 1.1, sc: '#ffc89a', glass: 0.6 },
};
function setPlazaEnv(e) {
  const E = ENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  plaza.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); ST.userData.glassM.emissiveIntensity = E.glass;
}
setPlazaEnv('day');

export { plaza, setPlazaEnv, makePigeon, makeFlock, makeDroppings, makePlazaPeople, LEDGE, BENCHES, ST as station };
