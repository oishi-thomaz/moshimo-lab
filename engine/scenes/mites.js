import * as THREE from 'three';
import { rng, mat, box } from '../lib.js';

// =====================================================
// MITES：ダニ・マダニ・トコジラミなど「小さな這う虫」の部品（どのシーンにも足せる）と、積もる落ち葉
// API
//   makeMite({ kind: 'dust' | 'tick' }) -> Group（8本脚。dust＝白っぽい室内ダニ、tick＝赤茶のマダニ）
//       .userData.anim(t, moving)  脚を動かす。体長 約0.3（scale で調整）。前は +z
//   makeBedBug() -> Group（6本脚・平たい赤茶の楕円・触角。.userData.anim(t, moving)。体長 約0.3。前は +z）
//   makeCrawlers(n, seed, { x0,x1, z0,z1, y, size, color, legs }) -> { mesh, set(count, t, speed) }
//       InstancedMesh の「面の上を這う」小さな虫。y の高さの平面をうろうろ歩く（脚つきの簡易形）
//   makeLitter(n, seed, { x0,x1, z0,z1, y, size }) -> { mesh, set(k) }
//       落ち葉。k=0 で無し、k=1 で全部。k が上がるほど上に重なって厚く積もる
// =====================================================
function legs8(g, legM, len, y, spread, n = 4) {
  const L = [];
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    const p = new THREE.Group(); p.position.set(s * spread, y, 0.07 - i * 0.05);
    const a = box(len, 0.018, 0.018, legM); a.position.x = s * len / 2; a.rotation.z = s * -0.35; p.add(a);
    p.rotation.y = s * (0.9 - i * 0.6); g.add(p); L.push({ p, s, i, base: p.rotation.y });
  }
  return L;
}
function animLegs(L, t, moving) {
  for (const l of L) { const ph = t * 14 + l.i * 1.6 + (l.s > 0 ? Math.PI : 0); l.p.rotation.y = l.base + (moving ? Math.sin(ph) * 0.28 : 0); l.p.rotation.z = moving ? Math.max(0, Math.sin(ph)) * 0.25 * l.s : 0; }
}
function makeMite({ kind = 'dust' } = {}) {
  const g = new THREE.Group();
  const tick = kind === 'tick';
  const bodyM = mat(tick ? '#6b2a1c' : '#efe2c8'), legM = mat(tick ? '#3a1d14' : '#d9c7a4');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), bodyM); body.scale.set(tick ? 1.05 : 0.95, tick ? 0.45 : 0.75, tick ? 1.3 : 1.25); body.position.y = 0.06; g.add(body);
  if (tick) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), mat('#2a120c')); sh.scale.set(1.1, 0.4, 1); sh.position.set(0, 0.09, 0.07); g.add(sh); }
  const cap = box(0.05, 0.035, 0.06, mat(tick ? '#2a120c' : '#c9b48c')); cap.position.set(0, 0.05, 0.15); g.add(cap);
  if (!tick) { const bm = mat('#bfae8a'); for (let i = 0; i < 6; i++) { const b = box(0.008, 0.06, 0.008, bm); b.position.set((i % 2 ? 1 : -1) * 0.05, 0.12, 0.06 - Math.floor(i / 2) * 0.07); b.rotation.z = (i % 2 ? -1 : 1) * 0.5; g.add(b); } }
  const L = legs8(g, legM, tick ? 0.15 : 0.12, 0.05, 0.07);
  g.userData.anim = (t, moving = true) => { animLegs(L, t, moving); body.position.y = 0.06 + (moving ? Math.abs(Math.sin(t * 14)) * 0.004 : 0); };
  g.userData.anim(0, false);
  return g;
}
function makeBedBug() {
  const g = new THREE.Group();
  const bodyM = mat('#8a3b22'), darkM = mat('#5a2414'), legM = mat('#6b3420');
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 8), bodyM); abd.scale.set(1.15, 0.32, 1.25); abd.position.set(0, 0.05, -0.04); g.add(abd);
  for (let i = 0; i < 4; i++) { const st = box(0.2 - i * 0.025, 0.004, 0.006, darkM); st.position.set(0, 0.086, -0.0 - i * 0.045); g.add(st); }
  const th = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), bodyM); th.scale.set(1.5, 0.35, 0.7); th.position.set(0, 0.05, 0.1); g.add(th);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), darkM); hd.scale.set(1, 0.6, 1.3); hd.position.set(0, 0.05, 0.15); g.add(hd);
  for (const s of [-1, 1]) { const an = box(0.008, 0.008, 0.11, legM); an.position.set(s * 0.03, 0.06, 0.2); an.rotation.y = s * 0.45; g.add(an); }
  const L = legs8(g, legM, 0.13, 0.04, 0.08, 3);
  g.userData.anim = (t, moving = true) => animLegs(L, t, moving);
  g.userData.anim(0, false);
  return g;
}
function makeCrawlers(n, seed = 1, { x0 = -1, x1 = 1, z0 = -1, z1 = 1, y = 0, size = 0.03, color = '#efe2c8', legs = '#cbb894' } = {}) {
  const body = new THREE.SphereGeometry(size, 7, 5); body.scale(0.9, 0.55, 1.2); body.translate(0, size * 0.5, 0);
  const parts = [body];
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const l = new THREE.BoxGeometry(size * 1.4, size * 0.18, size * 0.18); l.translate(s * size * 1.1, size * 0.25, size * (0.5 - i * 0.35)); l.rotateY(s * (0.5 - i * 0.3)); parts.push(l); }
  // merge manually (no dependency): use body only for color, legs darker via second mesh
  const legGeo = new THREE.BufferGeometry();
  { const geos = parts.slice(1).map(gg => gg.toNonIndexed()); const tot = geos.reduce((a, gg) => a + gg.attributes.position.count, 0); const pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3); let o = 0; for (const gg of geos) { pos.set(gg.attributes.position.array, o * 3); nor.set(gg.attributes.normal.array, o * 3); o += gg.attributes.position.count; } legGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); legGeo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); }
  const mesh = new THREE.InstancedMesh(body, new THREE.MeshLambertMaterial({ color }), n);
  const legMesh = new THREE.InstancedMesh(legGeo, new THREE.MeshLambertMaterial({ color: legs }), n);
  mesh.frustumCulled = false; legMesh.frustumCulled = false; mesh.add(legMesh);
  const r = rng(seed);
  const D = Array.from({ length: n }, () => [x0 + r() * (x1 - x0), z0 + r() * (z1 - z0), r() * 6.28, 0.3 + r() * 0.7, 0.04 + r() * 0.12, 0.8 + r() * 0.5]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  function set(count, t, speed = 1) {
    const c = Math.max(0, Math.min(n, Math.floor(count))); mesh.count = c; legMesh.count = c;
    for (let i = 0; i < c; i++) {
      const [x, z, ph, sp, rad, s] = D[i];
      const a = ph + t * sp * speed;
      p.set(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad);
      e.set(0, -a + (sp > 0.6 ? Math.PI : 0), 0); q.setFromEuler(e); sc.setScalar(s); m.compose(p, q, sc); mesh.setMatrixAt(i, m); legMesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true; legMesh.instanceMatrix.needsUpdate = true; mesh.visible = c > 0;
  }
  set(0, 0);
  return { mesh, set };
}
function makeLitter(n, seed = 1, { x0 = -2, x1 = 2, z0 = -2, z1 = 2, y = 0, size = 0.12 } = {}) {
  const geo = new THREE.CircleGeometry(size, 6); geo.scale(1, 0.6, 1); geo.rotateX(-Math.PI / 2);
  const cols = ['#a0522d', '#c27a2c', '#8b5a2b', '#d19a3a', '#7a4a26', '#b5652a'].map(c => new THREE.Color(c));
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), n);
  mesh.frustumCulled = false;
  const r = rng(seed); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const D = Array.from({ length: n }, (_, i) => [x0 + r() * (x1 - x0), z0 + r() * (z1 - z0), r() * 6.28, (r() - 0.5) * 0.5, 0.7 + r() * 0.7, i / n]);
  D.forEach((d, i) => mesh.setColorAt(i, cols[Math.floor(r() * cols.length)]));
  function set(k) {
    const c = Math.floor(n * Math.max(0, Math.min(1, k))); mesh.count = c;
    for (let i = 0; i < c; i++) { const [x, z, ry, tilt, s, f] = D[i]; p.set(x, y + 0.005 + f * 0.25, z); e.set(tilt, ry, tilt * 0.5); q.setFromEuler(e); sc.setScalar(s); m.compose(p, q, sc); mesh.setMatrixAt(i, m); }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.visible = c > 0;
  }
  set(0);
  return { mesh, set };
}

export { makeMite, makeBedBug, makeCrawlers, makeLitter };
