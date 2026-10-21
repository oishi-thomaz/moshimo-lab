import * as THREE from 'three';
import { rng, mat, box, makeSky, clamp, lerp, mergeGeometries } from '../lib.js';

// =====================================================
// DEERPARK: 古都の公園（広い芝生・松や広葉樹・石灯籠・朱色の鳥居・公園の前の道路と横断歩道・向かいの低い建物・奥の山）と、ローポリの鹿。
// 地面 y=0。芝生は z < 9（奥へ広がる）、道路は z = 13（x方向、幅7）、横断歩道は x = 0、鳥居は (0, 9.6)、建物は z > 20。
// 実在の寺社・店の見た目は使わない（鳥居・灯籠は一般的な形）。
// API
//   park (Scene), setParkEnv('day'|'dusk')
//   makeDeer({ kind:'buck'|'doe'|'fawn', scale }) -> Group（userData.legs/neck/head/tail）。鼻先は +z
//   deerWalk(d, phase, amp=1)、deerGraze(d, k)（k=1 で首を下げて草を食べる）、deerBow(d, k)（おじぎ）
//   makeHerd(max, seed, {x0,x1,z0,z1}) -> { setN(n), clear(cx,cz,r), group }  ：InstancedMesh の群れ（数千頭を一度に。立ち・草を食べるの2種）。clear で手前の円の中だけ空ける
//   setLawn(k)    ：芝生の緑 1 → 0 で土がむき出し（草の株も消える）
//   makeCar(color) -> Group（文字なし。setBrake(on)）
//   makeSenbei() -> Mesh（手に持たせる丸いせんべい）
// =====================================================
const park = new THREE.Scene();
const sky = makeSky(); park.add(sky);
park.fog = new THREE.Fog(0xdfe8f2, 60, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5240, 1.1); park.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(25, 45, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 }); sun.shadow.bias = -0.0005;
park.add(sun);

const GRASS = new THREE.Color('#7fae5a'), DIRT = new THREE.Color('#a48a64');
const lawnM = mat('#7fae5a'), roadM = mat('#555b65'), walkM = mat('#cfc9bd'), lineM = mat('#eceee9');
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(400, 260), lawnM); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0, -121); lawn.receiveShadow = true; park.add(lawn);
const front = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mat('#8a8f86')); front.rotation.x = -Math.PI / 2; front.position.set(0, -0.01, 110); front.receiveShadow = true; park.add(front);
const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 7), roadM); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 13); road.receiveShadow = true; park.add(road);
for (const z of [9.0, 17.0]) { const w = box(400, 0.12, 1.8, walkM); w.castShadow = false; w.position.set(0, 0.06, z + (z < 13 ? 0.1 : -0.1)); park.add(w); }
for (let x = -150; x < 150; x += 6) { if (Math.abs(x) < 5) continue; const l = box(2.6, 0.02, 0.16, lineM); l.castShadow = false; l.position.set(x, 0.04, 13); park.add(l); }
for (let i = -4; i <= 4; i++) { const s = box(0.5, 0.02, 6.4, lineM); s.castShadow = false; s.position.set(i * 0.95, 0.04, 13); park.add(s); }

// grass tufts (disappear with setLawn)
const tuftM = mat('#6a9a48', { flatShading: true });
const tufts = new THREE.Group(); park.add(tufts);
{
  const r = rng(91); const geos = [];
  for (let i = 0; i < 900; i++) {
    const g = new THREE.ConeGeometry(0.18 + r() * 0.12, 0.25 + r() * 0.2, 4); g.translate(-45 + r() * 90, 0.12, -60 + r() * 67); geos.push(g);
  }
  const m = new THREE.Mesh(mergeGeometries(geos), tuftM); m.receiveShadow = true; tufts.add(m);
}
// bare patches that grow
const bareM = mat('#9b7f5a');
const bare = [];
{ const r = rng(17); for (let i = 0; i < 70; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(1, 9), bareM); p.rotation.x = -Math.PI / 2; p.position.set(-40 + r() * 80, 0.015 + i * 0.0001, -55 + r() * 62); p.userData.k = r(); p.userData.s = 1.5 + r() * 3.5; p.receiveShadow = true; park.add(p); bare.push(p); } }
function setLawn(k) {
  lawnM.color.copy(DIRT).lerp(GRASS, k);
  tufts.visible = k > 0.15; tufts.scale.y = Math.max(0.01, k);
  bare.forEach(p => { const u = clamp((1 - k) * 1.6 - p.userData.k * 0.6); p.visible = u > 0.02; p.scale.setScalar(Math.max(0.01, u * p.userData.s)); });
}

// trees
const trunkM = mat('#5d4434'), pineM = mat('#3f6f45', { flatShading: true }), leafM = [mat('#5f9a58', { flatShading: true }), mat('#6aa862', { flatShading: true }), mat('#4f8a4a', { flatShading: true })];
function pine(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  const t = box(0.35, 3.2, 0.35, trunkM); t.position.y = 1.6; t.rotation.z = 0.12; g.add(t);
  for (const [y, w, ox] of [[3.0, 2.6, 0.3], [3.8, 2.0, -0.2], [4.5, 1.4, 0.2]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.6, w, 0.6, 7), pineM); c.position.set(ox, y, 0); c.castShadow = true; g.add(c); }
  park.add(g); return g;
}
function tree(x, z, s = 1, k = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  const t = box(0.4, 2.4, 0.4, trunkM); t.position.y = 1.2; g.add(t);
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), leafM[k % 3]); c.position.y = 3.4; c.castShadow = true; g.add(c);
  park.add(g); return g;
}
{
  const r = rng(33);
  for (let i = 0; i < 26; i++) { const x = -55 + r() * 110, z = -70 + r() * 35; (r() < 0.5 ? pine : tree)(x, z, 0.9 + r() * 0.6, i); }
  for (const [x, z] of [[-16, 3], [-24, -6], [17, 2], [26, -9], [-34, -2], [36, 0], [-9, -26], [11, -30]]) (Math.abs(x) % 2 ? pine : tree)(x, z, 1.1, x);
}
// distant gentle hill
const hill = new THREE.Mesh(new THREE.SphereGeometry(60, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#8db36a', { flatShading: true })); hill.scale.set(1.6, 0.42, 0.7); hill.position.set(-30, -2, -130); park.add(hill);
const hill2 = new THREE.Mesh(new THREE.SphereGeometry(60, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#6f9a58', { flatShading: true })); hill2.scale.set(1.4, 0.55, 0.7); hill2.position.set(70, -2, -150); park.add(hill2);

// stone lanterns
const stoneM = mat('#a9a69d');
function lantern(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const b = box(0.7, 0.3, 0.7, stoneM); b.position.y = 0.15; g.add(b);
  const p = box(0.32, 1.1, 0.32, stoneM); p.position.y = 0.85; g.add(p);
  const f = box(0.6, 0.45, 0.6, stoneM); f.position.y = 1.62; g.add(f);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.45, 4), stoneM); roof.rotation.y = Math.PI / 4; roof.position.y = 2.07; roof.castShadow = true; g.add(roof);
  park.add(g); return g;
}
for (const x of [-12, -8, 8, 12]) lantern(x, 7.2);
for (const x of [-20, 20]) lantern(x, -3);

// torii (generic vermilion gate) facing the road
const shuM = mat('#d2452f'), blackM = mat('#26231f');
const torii = new THREE.Group(); torii.position.set(0, 0, 9.6); park.add(torii);
for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 6.4, 10), shuM); p.position.set(s * 2.6, 3.2, 0); p.castShadow = true; torii.add(p); const f = box(0.75, 0.4, 0.75, blackM); f.position.set(s * 2.6, 0.2, 0); torii.add(f); }
{ const k = box(7.0, 0.4, 0.5, shuM); k.position.y = 5.0; torii.add(k); const kasa = box(8.6, 0.45, 0.7, blackM); kasa.position.y = 6.55; torii.add(kasa); const sh = box(8.0, 0.35, 0.6, shuM); sh.position.y = 6.15; torii.add(sh); const g = box(0.35, 1.0, 0.4, shuM); g.position.y = 5.6; torii.add(g); }

// low buildings across the road
const WALL = ['#e9e2d4', '#d8cfbf', '#efe9de', '#cfc6b5'], ROOF = ['#4b4f57', '#5a4a3e', '#3f444d'];
{
  const r = rng(8);
  for (let i = 0; i < 16; i++) {
    const w = 6 + r() * 4, d = 7, h = 4 + r() * 5, x = -60 + i * 8 + r(); const z = 23 + r() * 2;
    const b = box(w, h, d, mat(WALL[i % 4])); b.position.set(x, h / 2, z); park.add(b);
    const rf = box(w + 0.6, 0.35, d + 0.6, mat(ROOF[i % 3])); rf.position.set(x, h + 0.17, z); park.add(rf);
    for (let j = 0; j < 2; j++) { const wnd = box(1.2, 0.9, 0.05, mat('#3c4a5c')); wnd.position.set(x - 1.5 + j * 3, h * 0.6, z - d / 2 - 0.03); park.add(wnd); }
  }
}

// ---------- deer ----------
const COAT = { buck: '#9a6a3e', doe: '#a8774a', fawn: '#b9854f' };
const deerLight = mat('#efe3cf'), deerDark = mat('#3b2a1f'), antM = mat('#d9c9a4'), eyeM = mat('#141414'), whiteM = mat('#ffffff'), spotM = mat('#f1e6d2');
function makeDeer(opt = {}) {
  const kind = opt.kind || 'doe';
  const g = new THREE.Group();
  const coat = mat(COAT[kind]);
  const L = 1.0, W = 0.34, H = 0.38, leg = 0.62;
  const hip = leg + H / 2;
  const body = new THREE.Group(); body.position.y = hip; g.add(body);
  const torso = box(W, H, L, coat); body.add(torso);
  const belly = box(W * 0.8, H * 0.2, L * 0.75, deerLight); belly.position.y = -H * 0.43; body.add(belly);
  const rump = box(W * 0.7, H * 0.55, 0.03, whiteM); rump.position.set(0, 0.02, -L / 2 - 0.01); body.add(rump);
  if (kind === 'fawn') { const r = rng(4); for (let i = 0; i < 10; i++) { const s = box(0.05, 0.02, 0.05, spotM); const side = r() < 0.5 ? -1 : 1; s.position.set(side * (W / 2 + 0.005), 0.02 + r() * 0.12, -0.35 + r() * 0.7); s.rotation.z = Math.PI / 2; body.add(s); } for (let i = 0; i < 8; i++) { const s = box(0.05, 0.02, 0.05, spotM); s.position.set(-0.1 + (i % 2) * 0.2, H / 2 + 0.005, -0.35 + i * 0.09); body.add(s); } }
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = new THREE.Group(); p.position.set(x * W * 0.3, -H * 0.3, z * L * 0.38);
    const l = box(0.08, leg + H * 0.2, 0.09, coat); l.position.y = -(leg + H * 0.2) / 2; p.add(l);
    const hoof = box(0.085, 0.05, 0.1, deerDark); hoof.position.y = -(leg + H * 0.2) + 0.02; p.add(hoof);
    body.add(p); legs.push(p);
  }
  const neck = new THREE.Group(); neck.position.set(0, H * 0.25, L / 2 - 0.05); body.add(neck);
  const nk = box(0.17, 0.5, 0.2, coat); nk.position.set(0, 0.22, 0.06); nk.rotation.x = 0.35; neck.add(nk);
  const head = new THREE.Group(); head.position.set(0, 0.5, 0.16); neck.add(head);
  const hd = box(0.2, 0.2, 0.26, coat); head.add(hd);
  const muzzle = box(0.13, 0.13, 0.16, coat); muzzle.position.set(0, -0.04, 0.2); head.add(muzzle);
  const nose = box(0.08, 0.06, 0.03, deerDark); nose.position.set(0, -0.02, 0.29); head.add(nose);
  for (const s of [-1, 1]) {
    const e = box(0.02, 0.045, 0.045, eyeM); e.position.set(s * 0.1, 0.03, 0.06); head.add(e);
    const ear = box(0.16, 0.07, 0.03, coat); ear.position.set(s * 0.15, 0.1, -0.06); ear.rotation.z = s * 0.35; head.add(ear);
    if (kind === 'buck') {
      const a = new THREE.Group(); a.position.set(s * 0.06, 0.1, -0.04); a.rotation.z = -s * 0.25; a.rotation.x = -0.25; head.add(a);
      const b1 = box(0.035, 0.38, 0.035, antM); b1.position.y = 0.19; a.add(b1);
      const b2 = box(0.03, 0.18, 0.03, antM); b2.position.set(0, 0.2, 0.08); b2.rotation.x = 0.8; a.add(b2);
      const b3 = box(0.03, 0.16, 0.03, antM); b3.position.set(-s * 0.04, 0.42, 0.02); b3.rotation.z = s * 0.4; a.add(b3);
    }
  }
  const tail = new THREE.Group(); tail.position.set(0, H * 0.35, -L / 2); body.add(tail);
  const tl = box(0.08, 0.14, 0.05, coat); tl.position.y = -0.05; tail.add(tl);
  g.userData = { body, legs, neck, head, tail, hip };
  const sc = opt.scale || (kind === 'fawn' ? 0.62 : kind === 'buck' ? 1.08 : 1);
  g.scale.setScalar(sc);
  return g;
}
function deerReset(d) { const u = d.userData; u.legs.forEach(l => l.rotation.set(0, 0, 0)); u.neck.rotation.set(0, 0, 0); u.head.rotation.set(0, 0, 0); u.body.position.y = u.hip; u.body.rotation.set(0, 0, 0); }
function deerWalk(d, phase, amp = 1) {
  const u = d.userData; deerReset(d);
  const s = Math.sin(phase) * 0.5 * amp;
  u.legs[0].rotation.x = s; u.legs[3].rotation.x = s; u.legs[1].rotation.x = -s; u.legs[2].rotation.x = -s;
  u.neck.rotation.x = Math.sin(phase * 2) * 0.04 * amp; u.tail.rotation.x = Math.sin(phase * 1.3) * 0.2;
  u.body.position.y = u.hip + Math.abs(Math.cos(phase)) * 0.02 * amp;
}
function deerGraze(d, k) { const u = d.userData; deerReset(d); u.neck.rotation.x = 1.55 * k; u.head.rotation.x = 0.4 * k; }
function deerBow(d, k) { const u = d.userData; deerReset(d); u.neck.rotation.x = 0.75 * k; u.head.rotation.x = 0.5 * k; u.legs[0].rotation.x = -0.1 * k; u.legs[1].rotation.x = -0.1 * k; }

// instanced herd: two poses, merged low-poly geometry
function deerGeo(graze) {
  const parts = [];
  const add = (w, h, d, x, y, z, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); g.translate(x, y, z); parts.push(g); };
  add(0.34, 0.38, 1.0, 0, 0.81, 0);
  for (const [x, z] of [[-0.1, 0.38], [0.1, 0.38], [-0.1, -0.38], [0.1, -0.38]]) add(0.08, 0.7, 0.09, x, 0.35, z);
  if (graze) { add(0.17, 0.5, 0.2, 0, 0.7, 0.62, 1.1); add(0.2, 0.2, 0.3, 0, 0.4, 0.86, 1.2); }
  else { add(0.17, 0.5, 0.2, 0, 1.15, 0.5, 0.35); add(0.2, 0.2, 0.3, 0, 1.45, 0.66); add(0.4, 0.06, 0.03, 0, 1.56, 0.6); }
  return mergeGeometries(parts);
}
const herdM = [mat('#a1714a'), mat('#93653f'), mat('#ad7c50')];
function makeHerd(max, seed = 1, { x0 = -40, x1 = 40, z0 = -50, z1 = 6 } = {}) {
  const group = new THREE.Group(); park.add(group);
  const meshes = [];
  const r = rng(seed); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const per = Math.ceil(max / 6);
  for (let gi = 0; gi < 2; gi++) for (let ci = 0; ci < 3; ci++) {
    const im = new THREE.InstancedMesh(deerGeo(gi === 1), herdM[ci], per); im.castShadow = true; im.receiveShadow = true;
    for (let i = 0; i < per; i++) { p.set(lerp(x0, x1, r()), 0, lerp(z0, z1, r())); e.set(0, r() * Math.PI * 2, 0); q.setFromEuler(e); const k = 0.75 + r() * 0.35; s.set(k, k, k); m4.compose(p, q, s); im.setMatrixAt(i, m4); }
    im.instanceMatrix.needsUpdate = true; im.count = 0; group.add(im); meshes.push(im);
    im.userData.orig = im.instanceMatrix.array.slice();
  }
  function setN(n) { const each = Math.max(0, Math.min(per, Math.round(n / 6))); meshes.forEach(m => m.count = each); group.visible = n > 0; }
  // clear(cx, cz, r)：(cx,cz) から半径 r の中の群れを消す（手前に個別の鹿や人を置くショット用）。clear() で元に戻す
  let cleared = null;
  function clear(cx, cz, rad) {
    const key = cx === undefined ? null : `${cx},${cz},${rad}`; if (key === cleared) return; cleared = key;
    meshes.forEach(m => { const a = m.instanceMatrix.array, o = m.userData.orig; a.set(o);
      if (key) for (let i = 0; i < per; i++) { const x = o[i * 16 + 12], z = o[i * 16 + 14]; if ((x - cx) ** 2 + (z - cz) ** 2 < rad * rad) for (let j = 0; j < 16; j++) a[i * 16 + j] = 0; }
      m.instanceMatrix.needsUpdate = true; });
  }
  return { group, setN, clear, max };
}

// ---------- car ----------
function makeCar(color = '#e8e6e0') {
  const g = new THREE.Group();
  const b = box(4, 0.9, 1.8, mat(color)); b.position.y = 0.75; g.add(b);
  const c = box(2.2, 0.7, 1.6, mat('#dfe6ee')); c.position.set(-0.2, 1.5, 0); g.add(c);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), hl); l.position.set(2.01, 0.85, s * 0.6); g.add(l); }
  const tlm = new THREE.MeshBasicMaterial({ color: 0x8a2222 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), tlm); l.position.set(-2.01, 0.85, s * 0.6); g.add(l); }
  for (const x of [-1.3, 1.3]) for (const s of [-1, 1]) { const w = box(0.7, 0.7, 0.25, mat('#1b1d22')); w.position.set(x, 0.35, s * 0.85); g.add(w); }
  g.userData.setBrake = (on) => tlm.color.set(on ? 0xff3030 : 0x8a2222);
  park.add(g); return g;
}
function makeSenbei() { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 14), mat('#d9b27a')); m.castShadow = true; return m; }

const ENV = {
  day: { top: '#5c9fe0', bot: '#e3f0f8', fog: '#dfe8f2', hi: 1.1, si: 1.45, sc: '#fff4e0', sp: [25, 45, 30] },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#e0b99f', hi: 0.95, si: 1.25, sc: '#ffc89a', sp: [-40, 22, 20] },
};
function setParkEnv(e) {
  const E = ENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  park.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); sun.position.set(...E.sp);
}
setParkEnv('day'); setLawn(1);

export { park, setParkEnv, makeDeer, deerWalk, deerGraze, deerBow, makeHerd, setLawn, makeCar, makeSenbei, torii };
