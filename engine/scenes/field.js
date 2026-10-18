import * as THREE from 'three';
import { rng, mat, box, canvasTex, makeSky } from '../lib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// =====================================================
// FIELD: countryside — flower meadow, orchard, vegetable rows, greenhouse, pond, forest edge.
// Layout (x right, z toward camera): meadow around (0,0); orchard x -14..-4, z -10..-2;
// greenhouse at (10, -8); veg rows x 4..14, z 0..8; pond at (-8, 8); forest ring at r≈40.
// API
//   field (Scene), setFieldEnv('day'|'dusk'|'night'), makeBug('bee'|'mosquito'|'butterfly'|'bird')
//   flowers: InstancedMesh (setFlowers(k) 0..1 = bloom), fruits: [{m, k}] (setFruit(k) 0..1)
//   greenhouse (Group), pond (Mesh), fish [] (Group)
// =====================================================
const field = new THREE.Scene();
const sky = makeSky(); field.add(sky);
field.fog = new THREE.Fog(0xcfe3f2, 60, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a7a3a, 1.1); field.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.6); sun.position.set(30, 40, 20); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 }); field.add(sun);
const groundM = mat('#7fb35a');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; field.add(ground);

const STATIC = new Map();
const sg = (g, m) => { if (!STATIC.has(m)) STATIC.set(m, []); STATIC.get(m).push(g.index ? g.toNonIndexed() : g); };
const trunkM = mat('#6b4f3a'), leafM = mat('#4f8f4a', { flatShading: true }), leaf2 = mat('#5fa356', { flatShading: true }), pineM = mat('#3e7a4a', { flatShading: true }), soilM = mat('#7a5a3e'), pathM = mat('#c9b48a');
// forest ring + hills
{
  const r = rng(3);
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2, d = 38 + r() * 40, x = Math.cos(a) * d, z = Math.sin(a) * d - 10;
    const h = 4 + r() * 5;
    const c = new THREE.ConeGeometry(1.6 + r(), h, 6); c.translate(x, h / 2 + 1, z); sg(c, pineM);
    const tr = new THREE.BoxGeometry(0.4, 1.2, 0.4); tr.translate(x, 0.6, z); sg(tr, trunkM);
  }
  for (let i = 0; i < 7; i++) { const a = -0.4 - i * 0.35, d = 120; const hg = new THREE.SphereGeometry(30 + r() * 20, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); hg.scale(1.6, 0.45, 1); hg.translate(Math.cos(a) * d * 1.3, -2, Math.sin(a) * d); sg(hg, mat('#6c9e58', { flatShading: true })); }
  // path
  const p = new THREE.BoxGeometry(2.2, 0.04, 60); p.translate(1.5, 0.02, 0); sg(p, pathM);
}
// orchard
const fruits = [];
const fruitM = mat('#d8423a'), blossomM = mat('#f7d6e0', { flatShading: true });
const blossoms = [];
{
  const r = rng(8);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x = -15 + i * 3.4 + (r() - .5), z = -11 + j * 3.4 + (r() - .5);
    const tr = new THREE.BoxGeometry(0.3, 1.6, 0.3); tr.translate(x, 0.8, z); sg(tr, trunkM);
    const c = new THREE.IcosahedronGeometry(1.4, 0); c.translate(x, 2.4, z); sg(c, r() < .5 ? leafM : leaf2);
    const bl = new THREE.Mesh(new THREE.IcosahedronGeometry(1.48, 0), blossomM); bl.position.set(x, 2.4, z); bl.visible = false; field.add(bl); blossoms.push(bl);
    for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), fruitM); const a = r() * 6.28, h = r() * 1.2 - 0.3; f.position.set(x + Math.cos(a) * 1.25, 2.4 + h, z + Math.sin(a) * 1.25); field.add(f); fruits.push({ m: f, k: r() }); }
  }
}
// vegetable / strawberry rows
const berries = [];
{
  const r = rng(12);
  for (let row = 0; row < 5; row++) {
    const z = 1 + row * 1.6;
    const b = new THREE.BoxGeometry(10, 0.3, 0.9); b.translate(9, 0.15, z); sg(b, soilM);
    for (let k = 0; k < 14; k++) {
      const x = 4.4 + k * 0.7; const l = new THREE.IcosahedronGeometry(0.28, 0); l.translate(x, 0.45, z); sg(l, leaf2);
      const be = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 6), fruitM); be.rotation.x = Math.PI; be.position.set(x + 0.15, 0.4, z + 0.3); field.add(be); berries.push({ m: be, k: r() });
    }
  }
}
// greenhouse
const greenhouse = new THREE.Group(); field.add(greenhouse); greenhouse.position.set(11, 0, -9);
{
  const gm = new THREE.MeshLambertMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const half = new THREE.CylinderGeometry(2.6, 2.6, 9, 16, 1, true, 0, Math.PI); half.rotateZ(Math.PI / 2); const gh = new THREE.Mesh(half, gm); gh.position.y = 0.2; greenhouse.add(gh);
  const fr = mat('#e8ecef'); for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 4, 16, Math.PI), fr); a.position.set(-4.5 + i * 1.8, 0.2, 0); a.rotation.y = Math.PI / 2; greenhouse.add(a); }
  for (const s of [-1, 1]) { const end = new THREE.Mesh(new THREE.CircleGeometry(2.6, 16, 0, Math.PI), gm); end.position.set(s * 4.5, 0.2, 0); end.rotation.y = Math.PI / 2; greenhouse.add(end); }
}
// pond
const pond = new THREE.Mesh(new THREE.CircleGeometry(4.5, 24), new THREE.MeshLambertMaterial({ color: '#3f86b8', emissive: 0x0d3550, emissiveIntensity: 0.4 }));
pond.rotation.x = -Math.PI / 2; pond.position.set(-8, 0.03, 9); pond.scale.set(1.3, 1, 1); field.add(pond);
{
  const r = rng(21);
  for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = 4.6 + r() * 0.6; const s = new THREE.DodecahedronGeometry(0.3 + r() * 0.3, 0); s.translate(-8 + Math.cos(a) * d * 1.3, 0.1, 9 + Math.sin(a) * d); sg(s, mat('#9a9389', { flatShading: true })); }
  for (let i = 0; i < 6; i++) { const l = new THREE.CylinderGeometry(0.5, 0.5, 0.03, 10); l.translate(-10 + r() * 5, 0.06, 7 + r() * 4); sg(l, mat('#4f9a52')); }
  for (let i = 0; i < 18; i++) { const g = new THREE.BoxGeometry(0.06, 1 + r(), 0.06); g.translate(-13 + r() * 3, 0.5, 6 + r() * 6); sg(g, mat('#6d8f3c')); }
}
const fish = [];
for (let i = 0; i < 4; i++) { const f = new THREE.Group(); const b = box(0.5, 0.16, 0.18, mat('#e88a3a')); f.add(b); const t = box(0.16, 0.14, 0.04, mat('#e88a3a')); t.position.x = -0.32; f.add(t); f.position.set(-8, -0.02, 9); field.add(f); fish.push(f); }
for (const [m, gs] of STATIC) { const mesh = new THREE.Mesh(mergeGeometries(gs), m); mesh.castShadow = true; mesh.receiveShadow = true; field.add(mesh); }

// flower meadow (instanced)
const FL = 900;
const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), FL);
const stems = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.4, 0.03), mat('#4f8a3a'), FL);
const flData = [];
{
  const r = rng(31); const cols = ['#f7d14a', '#f28ab2', '#ffffff', '#b58ae6', '#f5a04a', '#ff6f6f'];
  const m = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < FL; i++) {
    let x, z; do { x = -10 + r() * 20; z = -4 + r() * 14; } while (x > 3.8 && z > 0 || Math.hypot((x + 8) / 1.3, z - 9) < 5.3);
    flData.push([x, z, r()]);
    m.makeTranslation(x, 0.2, z); stems.setMatrixAt(i, m);
    c.set(cols[Math.floor(r() * cols.length)]); flowers.setColorAt(i, c);
  }
  field.add(stems); field.add(flowers);
}
const _m = new THREE.Matrix4();
function setFlowers(k) { // k: 1 = full bloom, 0 = wilted / none
  for (let i = 0; i < FL; i++) { const [x, z, q] = flData[i]; const s = Math.max(0.0001, Math.min(1, (k - q * 0.3) / 0.7)); _m.makeScale(s, s, s); _m.setPosition(x, 0.42 - (1 - s) * 0.3, z); flowers.setMatrixAt(i, _m); }
  flowers.instanceMatrix.needsUpdate = true;
}
function setFruit(k) { for (const f of fruits) f.m.visible = f.k < k; for (const b of berries) b.m.visible = b.k < k; }
function setBlossom(on) { for (const b of blossoms) b.visible = on; }
setFlowers(1); setFruit(1);

// bugs
function makeBug(kind) {
  const g = new THREE.Group();
  const wingM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  if (kind === 'bee') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat('#f2b632')); b.scale.set(1.5, 1, 1); g.add(b);
    for (const x of [-0.05, 0.08]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.121, 0.121, 0.04, 10), mat('#2a2218')); s.rotation.z = Math.PI / 2; s.position.x = x; s.scale.set(1, 1, 1); g.add(s); }
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat('#2a2218')); h.position.x = 0.2; g.add(h);
  } else if (kind === 'mosquito') {
    const b = box(0.24, 0.035, 0.035, mat('#2a2622')); g.add(b);
    const h = box(0.05, 0.05, 0.05, mat('#2a2622')); h.position.x = 0.14; g.add(h);
    const pr = box(0.1, 0.01, 0.01, mat('#2a2622')); pr.position.set(0.21, -0.02, 0); pr.rotation.z = -0.4; g.add(pr);
    for (const s of [-1, 1]) for (const x of [-0.06, 0.02, 0.08]) { const l = box(0.008, 0.16, 0.008, mat('#2a2622')); l.position.set(x, -0.07, s * 0.04); l.rotation.x = s * 0.5; g.add(l); }
  } else if (kind === 'butterfly') {
    const b = box(0.2, 0.03, 0.03, mat('#2a2622')); g.add(b); wingM.color.set('#f2a03a'); wingM.opacity = 0.95;
  } else if (kind === 'bird') {
    const b = box(0.5, 0.14, 0.16, mat('#1f2a3a')); g.add(b); const be = box(0.1, 0.06, 0.06, mat('#e2b24a')); be.position.x = 0.3; g.add(be); wingM.color.set('#2a3548'); wingM.opacity = 1;
  }
  const ws = kind === 'butterfly' ? 0.22 : kind === 'bird' ? 0.5 : 0.16;
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(ws * 0.8, ws), wingM); w.geometry.translate(0, 0, s * ws / 2); w.rotation.x = Math.PI / 2; w.position.y = 0.05; g.add(w); wings.push(w); }
  g.userData.flap = (t) => { const a = Math.sin(t * (kind === 'bird' ? 12 : 60)) * 0.7; wings[0].rotation.x = Math.PI / 2 + a; wings[1].rotation.x = Math.PI / 2 - a; };
  return g;
}

const ENVS = {
  day: { top: '#5c9fe0', bot: '#dff0fb', fog: '#d6e8f4', hi: 1.1, si: 1.6, sc: '#fff4e0', g: '#7fb35a' },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#d9b49c', hi: 0.85, si: 1.1, sc: '#ffc89a', g: '#6f9a50' },
  night: { top: '#040a1a', bot: '#1a2850', fog: '#0f1830', hi: 0.4, si: 0.3, sc: '#9fb4ff', g: '#2f4a2a' },
  gray: { top: '#8a929c', bot: '#c9ccd0', fog: '#b8bcc2', hi: 0.9, si: 0.6, sc: '#e8e8e8', g: '#8a9a6a' },
};
function setFieldEnv(e) {
  const E = ENVS[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  field.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); groundM.color.set(E.g);
}
setFieldEnv('day');

export { field, setFieldEnv, makeBug, flowers, setFlowers, fruits, setFruit, setBlossom, greenhouse, pond, fish, berries, groundM };
