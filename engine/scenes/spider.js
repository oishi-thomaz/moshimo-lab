import * as THREE from 'three';
import { rng, clamp, mat, box } from '../lib.js';

// =====================================================
// SPIDER：ローポリのクモ・クモの巣・ハエ・虫の群れ（どのシーンにも足せる部品）
// API
//   makeSpider({ color }) -> Group（.userData.anim(t, moving)）。体長 約0.3（scale で調整）
//   makeWeb({ r, spokes, rings }) -> Group（ローカルの xy 平面に張る。.userData.set(k) で 0..1 の出方、
//                                 .userData.shake(t) で揺れ）
//   makeFly() -> Group（.userData.flap(t)）
//   makeSwarm(n, seed, { x0,x1, y0,y1, z0,z1, size, color }) -> { mesh, set(count, t) }
//       InstancedMesh の小さな虫の群れ。count 匹だけ表示して、箱の中をふらふら飛ばす
// =====================================================
function makeSpider({ color = '#3a2c22' } = {}) {
  const g = new THREE.Group();
  const bodyM = mat(color), legM = mat('#2a2018');
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bodyM); abd.scale.set(1.05, 0.9, 1.25); abd.position.set(0, 0.07, -0.11); g.add(abd);
  const mark = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#a0763e')); mark.scale.set(1, 0.4, 1.4); mark.position.set(0, 0.155, -0.12); g.add(mark);
  const ceph = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bodyM); ceph.scale.set(1, 0.7, 1.1); ceph.position.set(0, 0.06, 0.04); g.add(ceph);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), mat('#111')); e.position.set(s * 0.025, 0.09, 0.11); g.add(e); }
  const legs = [];
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const hip = new THREE.Group(); hip.position.set(s * 0.05, 0.06, 0.08 - i * 0.04);
    hip.rotation.y = s * (-0.9 + i * 0.55) + (s < 0 ? Math.PI : 0);
    const up = box(0.17, 0.02, 0.02, legM); up.geometry.translate(0.085, 0, 0); up.rotation.z = 0.7; hip.add(up);
    const knee = new THREE.Group(); knee.position.set(0.17 * Math.cos(0.7), 0.17 * Math.sin(0.7), 0); hip.add(knee);
    const lo = box(0.22, 0.016, 0.016, legM); lo.geometry.translate(0.11, 0, 0); lo.rotation.z = -1.25; knee.add(lo);
    g.add(hip); legs.push({ hip, i, s });
  }
  g.userData.anim = (t, moving = 0) => { legs.forEach(L => { L.hip.rotation.x = Math.sin(t * 14 + L.i * 1.7 + (L.s > 0 ? 0 : 1.5)) * 0.18 * moving; }); abd.rotation.x = Math.sin(t * 2) * 0.04; };
  return g;
}

// web: ribbons (thin quads) so it reads at 720p. local xy plane, center at origin.
function makeWeb({ r = 0.6, spokes = 14, rings = 9, w = 0.007, color = 0xf4f6fa } = {}) {
  const g = new THREE.Group();
  const pos = [];
  const seg = (ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w, ny = dx / L * w;
    pos.push(ax + nx, ay + ny, 0, ax - nx, ay - ny, 0, bx + nx, by + ny, 0, ax - nx, ay - ny, 0, bx - nx, by - ny, 0, bx + nx, by + ny, 0);
  };
  const rr = rng(9);
  const ang = Array.from({ length: spokes }, (_, i) => i / spokes * Math.PI * 2 + (rr() - .5) * 0.15);
  const len = ang.map(() => r * (0.85 + rr() * 0.25));
  ang.forEach((a, i) => seg(0, 0, Math.cos(a) * len[i], Math.sin(a) * len[i]));
  for (let k = 1; k <= rings; k++) {
    const f = 0.12 + 0.86 * k / rings;
    for (let i = 0; i < spokes; i++) {
      const j = (i + 1) % spokes;
      seg(Math.cos(ang[i]) * len[i] * f, Math.sin(ang[i]) * len[i] * f, Math.cos(ang[j]) * len[j] * f, Math.sin(ang[j]) * len[j] * f);
    }
  }
  // anchor threads to the edges
  for (const a of [0.4, 2.0, 3.5, 5.1]) seg(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(geo, m); g.add(mesh);
  const n = pos.length / 18;
  g.userData.set = (k) => { g.visible = k > 0.01; m.opacity = 0.85 * clamp(k * 1.5); geo.setDrawRange(0, Math.floor(n * clamp(k)) * 6); };
  g.userData.shake = (t, a = 0.02) => { mesh.rotation.x = Math.sin(t * 3.1) * a; mesh.rotation.y = Math.sin(t * 2.3) * a; };
  return g;
}

function makeFly() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat('#1e2226')); b.scale.set(1.6, 1, 1); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), mat('#7a2a22')); h.position.x = 0.045; g.add(h);
  const wm = new THREE.MeshBasicMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.06), wm); w.geometry.translate(0, 0, s * 0.03); w.rotation.x = Math.PI / 2; w.position.y = 0.02; g.add(w); wings.push(w); }
  g.userData.flap = (t) => { const a = Math.sin(t * 70) * 0.7; wings[0].rotation.x = Math.PI / 2 + a; wings[1].rotation.x = Math.PI / 2 - a; };
  return g;
}

function makeSwarm(n, seed = 1, { x0 = -1, x1 = 1, y0 = 0, y1 = 2, z0 = -1, z1 = 1, size = 0.03, color = '#22262b' } = {}) {
  const geo = new THREE.SphereGeometry(size, 6, 4); geo.scale(1.6, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color, emissive: 0x050505 }), n);
  mesh.frustumCulled = false;
  const r = rng(seed);
  const D = Array.from({ length: n }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), z0 + r() * (z1 - z0), r() * 6.28, 0.6 + r() * 1.4, 0.15 + r() * 0.35]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  function set(count, t) {
    mesh.count = Math.max(0, Math.min(n, Math.floor(count)));
    for (let i = 0; i < mesh.count; i++) {
      const [x, y, z, ph, sp, rad] = D[i];
      const a = ph + t * sp * 2;
      p.set(x + Math.cos(a) * rad, y + Math.sin(a * 1.7 + ph) * rad * 0.5, z + Math.sin(a) * rad);
      e.set(0, -a, 0); q.setFromEuler(e); m.compose(p, q, s); mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.visible = mesh.count > 0;
  }
  set(0, 0);
  return { mesh, set };
}

export { makeSpider, makeWeb, makeFly, makeSwarm };
