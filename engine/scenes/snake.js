import * as THREE from 'three';
import { rng, mat } from '../lib.js';

// =====================================================
// SNAKE：ローポリのヘビと草むら（どのシーンにも足せる）
// API
//   makeSnake({ len, r, color, belly, spots }) → Group（原点＝胴の真ん中の地面。頭は +x 向き）
//     .userData.pose(t, { coil, speed, amp, lift })  coil 0 = S字で這う / 1 = とぐろを巻く、lift = 鎌首を持ち上げる 0..1
//     .userData.tongue(on)  舌を出す
//   makeGrass(n, seed, { x0, x1, z0, z1, h, color, color2, hole: [x, z, r] })（hole の中は草が短い＝主役を隠さない） → InstancedMesh の草むら（.userData.sway(t) で揺れる）
// =====================================================
function makeSnake({ len = 2.2, r = 0.075, color = '#6f8a3a', belly = '#d9c98a', spots = '#3e4f22', n = 34 } = {}) {
  const g = new THREE.Group();
  const segs = [];
  const geo = new THREE.SphereGeometry(1, 10, 7);
  const mA = mat(color), mB = mat(spots), mH = mat(color);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1); // 0 = head, 1 = tail tip
    const rr = r * (u < 0.08 ? 0.85 + u * 2 : u > 0.7 ? Math.max(0.18, 1 - (u - 0.7) / 0.3 * 0.82) : 1);
    const m = new THREE.Mesh(geo, i % 4 === 2 ? mB : mA); m.scale.set(rr * 1.25, rr * 0.82, rr); m.castShadow = true; g.add(m); segs.push({ m, rr, u });
  }
  // head
  const head = new THREE.Group(); g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), mH); skull.scale.set(r * 2.1, r * 0.95, r * 1.45); skull.position.x = r * 0.7; skull.castShadow = true; head.add(skull);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 8, 6), mat('#f4e27a')); e.position.set(r * 1.4, r * 0.45, s * r * 0.95); head.add(e);
    const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 6, 5), mat('#111')); p.position.set(r * 1.6, r * 0.5, s * r * 1.08); head.add(p);
  }
  const tongue = new THREE.Group(); head.add(tongue); tongue.position.set(r * 2.7, -r * 0.1, 0);
  for (const s of [-1, 1]) { const tq = new THREE.Mesh(new THREE.BoxGeometry(r * 1.4, r * 0.08, r * 0.1), mat('#d23a4a')); tq.position.set(r * 0.6, 0, s * r * 0.15); tq.rotation.y = -s * 0.35; tongue.add(tq); }
  const sp = len / n;
  const pt = new THREE.Vector3(), nx = new THREE.Vector3();
  function path(s, t, o) { // s: distance from head along the body
    const { coil = 0, speed = 1, amp = 0.22, lift = 0 } = o;
    // S-curve (crawl)
    const k = 2 * Math.PI / (len * 0.55);
    const cx = len * 0.45 - s, cz = amp * Math.sin(k * s - t * 3 * speed);
    // coil: spiral
    const turns = 2.1, R0 = r * 2.2, R1 = len / (2 * Math.PI * turns) * 1.6;
    const a = s / len * turns * 2 * Math.PI; const R = R0 + (R1 - R0) * (s / len);
    const kx = Math.cos(a + 1.2) * R, kz = Math.sin(a + 1.2) * R;
    const x = cx + (kx - cx) * coil, z = cz + (kz - cz) * coil;
    const y = lift * Math.max(0, 1 - s / (len * 0.28)) * len * 0.22 + coil * (1 - s / len) * r * 1.2;
    return pt.set(x, y, z);
  }
  g.userData.pose = (t, o = {}) => {
    let prev = null;
    segs.forEach((S, i) => {
      const p = path(i * sp, t, o).clone();
      S.m.position.set(p.x, p.y + S.rr * 0.8, p.z);
      if (prev) { nx.subVectors(prev, p); S.m.rotation.y = Math.atan2(-nx.z, nx.x); }
      prev = p;
    });
    const h = path(0, t, o).clone(), h2 = path(sp * 1.5, t, o).clone();
    head.position.set(h.x, h.y + r * 0.85, h.z);
    nx.subVectors(h, h2); head.rotation.y = Math.atan2(-nx.z, nx.x); head.rotation.z = (o.lift || 0) * 0.15;
    tongue.visible = (o.tongue ?? true) && Math.sin(t * 5) > 0.3;
  };
  g.userData.tongue = (on) => { tongue.visible = on; };
  g.userData.pose(0);
  return g;
}

function makeGrass(n = 600, seed = 1, { x0 = -2, x1 = 2, z0 = -2, z1 = 2, h = 0.3, color = '#5f9a3e', color2 = '#86b85a', hole = null } = {}) {
  const geo = new THREE.ConeGeometry(0.035, 1, 3); geo.translate(0, 0.5, 0);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n);
  const r = rng(seed), D = [], M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const c1 = new THREE.Color(color), c2 = new THREE.Color(color2), c = new THREE.Color();
  for (let i = 0; i < n; i++) { let x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), hh = h * (0.5 + r() * 0.9); if (hole) { const d = Math.hypot(x - hole[0], z - hole[1]); if (d < hole[2]) hh *= 0.25 + 0.75 * (d / hole[2]) ** 2; } D.push([x, z, hh, r() * 6.28, (r() - 0.5) * 0.5]); m.setColorAt(i, c.copy(c1).lerp(c2, r())); }
  const sway = (t) => {
    D.forEach(([x, z, hh, ph, lean], i) => { e.set(lean + Math.sin(t * 1.6 + ph) * 0.08, ph, Math.sin(t * 1.3 + ph) * 0.1); q.setFromEuler(e); M.compose(ps.set(x, 0, z), q, sc.set(1, hh, 1)); m.setMatrixAt(i, M); });
    m.instanceMatrix.needsUpdate = true;
  };
  sway(0); m.userData.sway = sway; m.receiveShadow = true;
  return m;
}

export { makeSnake, makeGrass };
