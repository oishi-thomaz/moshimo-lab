import * as THREE from 'three';
import { rng, clamp, mat, box } from '../lib.js';

// =====================================================
// HORNET：スズメバチと巣、軒下のセット、ニホンミツバチの巣箱と熱殺蜂球、毛虫（どのシーンにも足せる部品）
// API
//   makeHornet() → Group（長さ約1・+x が頭。userData.anim(t) で羽ばたき）。scale で大きさ（実寸感なら 0.06 前後）
//   makeHornetNest() → Group（直径約1のマーブル模様の巣・下に出入り口。原点が巣の上端＝軒に吊るす点）
//   makeEave({ wall, roof }) → Group（家の壁・窓・軒の出・雨どい。幅6×高さ3.2、軒は y=3.1、前に1.4m 出る。原点は壁の足元中央、前は +z）
//     .userData.nestAt … 巣を吊るすローカル位置（Vector3）
//   makeHive() → Group（重箱式の木の巣箱と台。高さ約1.25、出入り口は前面 +z の y≈0.55）
//   makeBeeBall(n) → { g, set(k, t, heat) } … ミツバチがかたまって作る球（k 0..1 で集まる・heat 0..1 で赤く光る）
//   makeCaterpillars(spots) → { mesh, set(k, t) } … spots [[x,y,z],...] の上に毛虫（k の割合だけ表示）
// =====================================================
function makeHornet() {
  const g = new THREE.Group();
  const orange = mat('#e07a1f'), dark = mat('#2a1d14'), yel = mat('#f0b427'), brown = mat('#6b3a1c');
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), orange); head.position.x = 0.5; head.scale.set(0.9, 1, 1.1); g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), dark); e.position.set(0.56, 0.05, s * 0.12); e.scale.set(0.7, 1.2, 0.8); g.add(e); }
  const thor = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), dark); thor.position.x = 0.25; g.add(thor);
  const abd = new THREE.Group(); abd.position.x = -0.12; g.add(abd);
  const a0 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), yel); a0.scale.set(1.5, 1, 1); abd.add(a0);
  for (const x of [-0.18, 0.0, 0.17]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.236, 0.236, 0.07, 14), brown); s.rotation.z = Math.PI / 2; s.position.x = x; s.scale.set(1, 1 - Math.abs(x) * 0.9, 1 - Math.abs(x) * 0.9); abd.add(s); }
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), dark); sting.rotation.z = Math.PI / 2; sting.position.x = -0.5; abd.add(sting);
  for (const s of [-1, 1]) for (const x of [0.15, 0.27, 0.38]) { const l = box(0.025, 0.25, 0.025, brown); l.position.set(x, -0.18, s * 0.1); l.rotation.x = s * 0.4; g.add(l); }
  const wm = new THREE.MeshBasicMaterial({ color: 0xf2e6c8, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), wm); w.scale.set(1.3, 0.45, 1); w.geometry.translate(-0.12, 0.32 * s, 0); w.rotation.x = Math.PI / 2; w.position.set(0.25, 0.16, 0); g.add(w); wings.push(w); }
  g.userData.anim = (t) => { const a = Math.sin(t * 60) * 0.6; wings[0].rotation.x = Math.PI / 2 + a; wings[1].rotation.x = Math.PI / 2 - a; abd.rotation.z = Math.sin(t * 4) * 0.08; };
  return g;
}

function makeHornetNest() {
  const g = new THREE.Group();
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#c79a64'; x.fillRect(0, 0, 256, 256);
    const r = rng(12);
    for (let i = 0; i < 40; i++) { x.strokeStyle = r() < 0.5 ? '#8a5d34' : '#e6c08c'; x.lineWidth = 3 + r() * 7; x.beginPath(); const y0 = i * 6.4; x.moveTo(0, y0); for (let k = 0; k <= 8; k++) x.lineTo(k * 32, y0 + Math.sin(k * 1.3 + i) * 10); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), new THREE.MeshLambertMaterial({ map: tex })); ball.scale.set(1, 1.15, 1); ball.position.y = -0.55; ball.castShadow = true; g.add(ball);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.12, 8), mat('#8a5d34')); stem.position.y = -0.04; g.add(stem);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), mat('#1a120c')); hole.rotation.x = Math.PI / 2 + 0.6; hole.position.set(0, -1.07, 0.16); g.add(hole);
  return g;
}

function makeEave({ wall = '#efe6d6', roof = '#5a4636' } = {}) {
  const g = new THREE.Group();
  const w = box(6, 3.2, 0.3, mat(wall)); w.position.set(0, 1.6, 0); w.receiveShadow = true; g.add(w);
  const base = box(6.1, 0.3, 0.36, mat('#9a948a')); base.position.set(0, 0.15, 0); g.add(base);
  const sof = box(6.6, 0.12, 1.5, mat('#d9cfbf')); sof.position.set(0, 3.12, 0.6); g.add(sof);
  const rf = box(6.8, 0.16, 1.9, mat(roof)); rf.position.set(0, 3.32, 0.55); rf.rotation.x = 0.18; g.add(rf);
  const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.8, 8), mat('#8d9399')); gut.rotation.z = Math.PI / 2; gut.position.set(0, 3.1, 1.45); g.add(gut);
  const fr = box(1.6, 1.2, 0.08, mat('#e8ecef')); fr.position.set(-1.6, 1.7, 0.17); g.add(fr);
  const gl = box(1.45, 1.05, 0.04, mat('#8fb4cf', { emissive: 0x1a2a3a, emissiveIntensity: 0.3 })); gl.position.set(-1.6, 1.7, 0.21); g.add(gl);
  const mul = box(0.04, 1.05, 0.05, mat('#e8ecef')); mul.position.set(-1.6, 1.7, 0.23); g.add(mul);
  const sill = box(1.8, 0.08, 0.25, mat('#d9dde1')); sill.position.set(-1.6, 1.08, 0.25); g.add(sill);
  g.userData.nestAt = new THREE.Vector3(1.1, 3.06, 0.75);
  return g;
}

function makeHive() {
  const g = new THREE.Group();
  const wood = mat('#b98a56'), dark = mat('#8a633b');
  const stand = box(0.7, 0.3, 0.7, mat('#7d756b')); stand.position.y = 0.15; g.add(stand);
  for (let i = 0; i < 4; i++) { const b = box(0.55, 0.2, 0.55, i % 2 ? wood : dark); b.position.y = 0.42 + i * 0.205; b.castShadow = true; g.add(b); }
  const lid = box(0.72, 0.08, 0.72, mat('#6b5a48')); lid.position.y = 1.27; g.add(lid);
  const ent = box(0.22, 0.03, 0.03, mat('#1a120c')); ent.position.set(0, 0.36, 0.28); g.add(ent);
  return g;
}

function makeBeeBall(n = 160) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.026, 6, 4); geo.scale(1.6, 1, 1);
  const m = new THREE.MeshLambertMaterial({ color: '#b8862e', emissive: 0x000000 });
  const mesh = new THREE.InstancedMesh(geo, m, n); mesh.frustumCulled = false; g.add(mesh);
  const r = rng(44);
  const D = Array.from({ length: n }, () => { const u = r() * 2 - 1, a = r() * 6.28, s = Math.sqrt(1 - u * u); return [s * Math.cos(a), u, s * Math.sin(a), r() * 6.28, 0.6 + r() * 0.5, -0.5 + r() * 1.0, r() * 0.6, -0.2 + r() * 0.5]; });
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const hot = new THREE.Color('#ff5a1f');
  function set(k, t, heat = 0) {
    for (let i = 0; i < n; i++) {
      const [x, y, z, ph, far, fx, fy, fz] = D[i];
      const rad = 0.2 + (i % 3) * 0.025 + Math.sin(t * 9 + ph) * 0.006;
      const tx = x * rad, ty = y * rad, tz = z * rad;
      const ox = fx * far, oy = fy * far * 0.6 - 0.15, oz = fz * far;
      p.set(ox + (tx - ox) * k, oy + (ty - oy) * k, oz + (tz - oz) * k);
      e.set(0, ph + t * (1 - k) * 2, y * 0.6); q.setFromEuler(e); mtx.compose(p, q, one); mesh.setMatrixAt(i, mtx);
    }
    mesh.instanceMatrix.needsUpdate = true;
    m.emissive.copy(hot).multiplyScalar(0.55 * heat);
  }
  set(0, 0);
  return { g, set };
}

function makeCaterpillars(spots) {
  const geo = new THREE.CapsuleGeometry(0.05, 0.2, 3, 6); geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#b8d83a', emissive: 0x1a2a00 }), spots.length); mesh.frustumCulled = false; mesh.castShadow = true;
  const r = rng(71); const K = spots.map(() => r()), A = spots.map(() => r() * 6.28);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  function set(k, t = 0) {
    let c = 0;
    spots.forEach((s, i) => {
      if (K[i] >= k) return;
      p.set(s[0] + Math.cos(A[i] + t * 0.2) * 0.08, s[1], s[2] + Math.sin(A[i] + t * 0.2) * 0.08);
      e.set(0, A[i] + t * 0.2, 0); q.setFromEuler(e); const w = 1 + Math.sin(t * 5 + i) * 0.12; sc.set(w, 1, 1); mtx.compose(p, q, sc); mesh.setMatrixAt(c++, mtx);
    });
    mesh.count = c; mesh.instanceMatrix.needsUpdate = true; mesh.visible = c > 0;
  }
  set(0);
  return { mesh, set };
}

export { makeHornet, makeHornetNest, makeEave, makeHive, makeBeeBall, makeCaterpillars };
