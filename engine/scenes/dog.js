import * as THREE from 'three';
import { mat, box, clamp } from '../lib.js';

// =====================================================
// DOG: low-poly dogs + dog props（首輪・リード・犬小屋・盲導犬のハーネス）。どのシーン（town / city / room）にも add して使う。
// 大きさは人（約1.8）基準：kind 'shiba' は体長約0.62・高さ約0.5、'lab' は約0.9・0.68、'small' は約0.42・0.32
// API
//   makeDog({ kind:'shiba'|'lab'|'small', coat:'tan'|'cream'|'black'|'white'|'brown', scale }) -> Group (+ userData.legs/head/tail/neck)
//   dogPose(d, 'stand'|'sit'|'lie')           — 静止ポーズ
//   dogWalk(d, phase, amp=1)                  — 歩く脚・しっぽ（毎フレーム呼ぶ）
//   dogIdle(d, t)                             — しっぽふり・頭の小さな動き
//   neckPos(d, out) -> Vector3                — 首輪の位置（ワールド座標。リードの先に使う）
//   makeCollar(color) -> Mesh                 — 首輪（地面に落ちた状態にも使える。dropCollar(c, x, z)）
//   makeLeash(color) -> { mesh, set(a, b, sag) } — a と b（Vector3）をつなぐたるんだリード
//   makeDogHouse(roofColor) -> Group          — 犬小屋（入口は +z）
//   makeHarness() -> Group                    — 盲導犬の白いハーネス（持ち手つき。犬の背中に add するか、地面に置く）
//   handPos(person, out, side=1) -> Vector3   — makePerson の手の位置（リードを持たせる用）
// =====================================================
const COATS = {
  tan: { body: '#d08a45', light: '#f4e2c8', dark: '#9a5d2a' },
  cream: { body: '#e9c98f', light: '#fbf1dc', dark: '#c49a5c' },
  black: { body: '#2f2c2c', light: '#d9c7a8', dark: '#1d1b1b' },
  white: { body: '#f2efe8', light: '#ffffff', dark: '#d6cfc2' },
  brown: { body: '#7a5236', light: '#c9a27a', dark: '#553823' },
};
const KIND = {
  shiba: { L: 0.5, W: 0.22, H: 0.22, leg: 0.24, head: 0.21, snout: 0.1, ear: 'up', tail: 'curl' },
  lab: { L: 0.72, W: 0.28, H: 0.28, leg: 0.34, head: 0.25, snout: 0.14, ear: 'down', tail: 'long' },
  small: { L: 0.32, W: 0.17, H: 0.16, leg: 0.15, head: 0.17, snout: 0.06, ear: 'down', tail: 'curl' },
};
function makeDog(opt = {}) {
  const K = KIND[opt.kind || 'shiba'], C = COATS[opt.coat || 'tan'];
  const g = new THREE.Group();
  const bodyM = mat(C.body), lightM = mat(C.light), darkM = mat(C.dark), blackM = mat('#151515'), whiteM = mat('#ffffff'), tongueM = mat('#e57a86');
  const hip = K.leg + K.H / 2;
  const body = new THREE.Group(); body.position.y = hip; g.add(body);
  const torso = box(K.W, K.H, K.L, bodyM); body.add(torso);
  const belly = box(K.W * 0.85, K.H * 0.25, K.L * 0.8, lightM); belly.position.y = -K.H * 0.42; body.add(belly);
  const chest = box(K.W * 0.8, K.H * 0.7, 0.04, lightM); chest.position.set(0, -K.H * 0.05, K.L / 2 + 0.005); body.add(chest);
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = new THREE.Group(); p.position.set(x * K.W * 0.32, -K.H * 0.35, z * K.L * 0.36);
    const l = box(K.W * 0.28, K.leg + K.H * 0.15, K.W * 0.3, bodyM); l.position.y = -(K.leg + K.H * 0.15) / 2; p.add(l);
    const paw = box(K.W * 0.31, 0.04, K.W * 0.36, lightM); paw.position.set(0, -(K.leg + K.H * 0.15) + 0.02, 0.01); p.add(paw);
    body.add(p); legs.push(p);
  }
  // neck + head
  const neck = new THREE.Group(); neck.position.set(0, K.H * 0.35, K.L / 2 - 0.02); body.add(neck);
  const nk = box(K.W * 0.62, K.H * 0.7, K.W * 0.6, bodyM); nk.position.set(0, K.H * 0.2, 0.02); nk.rotation.x = 0.35; neck.add(nk);
  const head = new THREE.Group(); head.position.set(0, K.H * 0.55, 0.08); neck.add(head);
  const hd = box(K.head, K.head * 0.85, K.head * 0.9, bodyM); head.add(hd);
  const snout = box(K.head * 0.5, K.head * 0.38, K.snout, lightM); snout.position.set(0, -K.head * 0.18, K.head * 0.45 + K.snout / 2); head.add(snout);
  const nose = box(K.head * 0.2, K.head * 0.13, 0.03, blackM); nose.position.set(0, -K.head * 0.06, K.head * 0.45 + K.snout); head.add(nose);
  const tongue = box(K.head * 0.16, 0.012, K.snout * 0.5, tongueM); tongue.position.set(0, -K.head * 0.38, K.head * 0.45 + K.snout * 0.6); tongue.visible = false; head.add(tongue);
  for (const s of [-1, 1]) {
    const e = box(K.head * 0.12, K.head * 0.14, 0.012, blackM); e.position.set(s * K.head * 0.22, K.head * 0.1, K.head * 0.455); head.add(e);
    const sh = box(K.head * 0.045, K.head * 0.045, 0.008, whiteM); sh.position.set(s * K.head * 0.22 + K.head * 0.03, K.head * 0.14, K.head * 0.465); head.add(sh);
    if (K.ear === 'up') {
      const eg = new THREE.ConeGeometry(K.head * 0.2, K.head * 0.42, 4); eg.rotateY(Math.PI / 4);
      const ear = new THREE.Mesh(eg, bodyM); ear.position.set(s * K.head * 0.3, K.head * 0.58, -K.head * 0.05); ear.rotation.z = -s * 0.18; ear.castShadow = true; head.add(ear);
    } else {
      const ear = box(K.head * 0.14, K.head * 0.55, K.head * 0.42, darkM); ear.position.set(s * K.head * 0.55, K.head * 0.02, -K.head * 0.05); ear.rotation.z = s * 0.12; head.add(ear);
    }
  }
  // tail
  const tail = new THREE.Group(); tail.position.set(0, K.H * 0.3, -K.L / 2); body.add(tail);
  const segs = []; let par = tail;
  const n = K.tail === 'long' ? 3 : 2, sl = K.tail === 'long' ? K.L * 0.17 : K.L * 0.16;
  for (let i = 0; i < n; i++) {
    const sp = new THREE.Group(); if (i) sp.position.z = -sl; par.add(sp);
    const sg = box(K.W * 0.2, K.W * 0.2, sl, i === n - 1 ? (K.tail === 'curl' ? lightM : bodyM) : bodyM); sg.position.z = -sl / 2; sp.add(sg);
    segs.push(sp); par = sp;
  }
  g.userData = { body, legs, head, neck, tail, segs, tongue, K, hip, pose: 'stand' };
  g.scale.setScalar(opt.scale || 1);
  dogPose(g, 'stand');
  return g;
}
function dogPose(d, pose) {
  const { body, legs, head, neck, tail, segs, K, hip } = d.userData; d.userData.pose = pose;
  body.rotation.set(0, 0, 0); body.position.set(0, hip, 0); head.rotation.set(0, 0, 0); neck.rotation.set(0, 0, 0);
  legs.forEach(l => l.rotation.set(0, 0, 0));
  const curl = K.tail === 'curl';
  tail.rotation.set(curl ? -1.9 : -0.5, 0, 0); segs.forEach((s, i) => s.rotation.set(i ? (curl ? -1.0 : 0.25) : 0, 0, 0));
  if (pose === 'sit') {
    body.rotation.x = -0.6; body.position.y = hip * 0.82;
    legs[2].rotation.x = 0.6 - 1.45; legs[3].rotation.x = 0.6 - 1.45; legs[0].rotation.x = 0.6; legs[1].rotation.x = 0.6;
    neck.rotation.x = 0.35; head.rotation.x = 0.2;
  } else if (pose === 'lie') {
    body.position.y = K.H * 0.5 + 0.02; legs[0].rotation.x = -1.45; legs[1].rotation.x = -1.45; legs[2].rotation.x = 1.45; legs[3].rotation.x = 1.45;
    neck.rotation.x = 0.2;
  }
}
function dogWalk(d, phase, amp = 1) {
  const { legs, tail, head, body, hip, K, tongue } = d.userData;
  const s = Math.sin(phase) * 0.55 * amp;
  legs[0].rotation.x = s; legs[3].rotation.x = s; legs[1].rotation.x = -s; legs[2].rotation.x = -s;
  tail.rotation.y = Math.sin(phase * 1.5) * 0.45 * amp;
  head.rotation.x = Math.sin(phase * 2) * 0.04 * amp;
  body.position.y = hip + Math.abs(Math.cos(phase)) * 0.015 * amp;
  tongue.visible = amp > 0.3 && K !== KIND.small;
}
function dogIdle(d, t) {
  const { tail, head } = d.userData;
  tail.rotation.y = Math.sin(t * 9) * 0.5;
  head.rotation.y = Math.sin(t * 0.8) * 0.18;
}
const _v = new THREE.Vector3();
function neckPos(d, out = new THREE.Vector3()) {
  d.updateMatrixWorld(true);
  const { neck, K } = d.userData;
  return neck.localToWorld(out.set(0, K.H * 0.25, 0.04));
}
function handPos(p, out = new THREE.Vector3(), side = 1) {
  p.updateMatrixWorld(true);
  const arm = p.userData.arms[side > 0 ? 1 : 0];
  return arm.localToWorld(out.set(0, -0.64, 0.02));
}
function makeCollar(color = '#d9443a') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 16), mat(color));
  m.castShadow = true;
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 10), mat('#f2c14e', { emissive: '#7a5a10', emissiveIntensity: 0.3 }));
  tag.rotation.x = Math.PI / 2; tag.position.set(0, -0.09, 0.01); m.add(tag);
  return m;
}
function dropCollar(c, x, z, y = 0.03) { c.position.set(x, y, z); c.rotation.set(Math.PI / 2, 0, 0.4); }
function makeLeash(color = '#d9443a') {
  const m = mat(color);
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m); mesh.castShadow = true; mesh.frustumCulled = false;
  const pts = Array.from({ length: 9 }, () => new THREE.Vector3());
  function set(a, b, sag = 0.12) {
    for (let i = 0; i < pts.length; i++) {
      const u = i / (pts.length - 1);
      pts[i].lerpVectors(a, b, u); pts[i].y -= Math.sin(u * Math.PI) * sag;
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(curve, 16, 0.012, 5, false);
  }
  return { mesh, set };
}
function makeDogHouse(roofColor = '#b5543c') {
  const g = new THREE.Group();
  const wallM = mat('#d8b98a'), roofM = mat(roofColor, { flatShading: true }), darkM = mat('#2a2420');
  const w = 0.9, d = 1.0, h = 0.7;
  const walls = box(w, h, d, wallM); walls.position.y = h / 2; g.add(walls);
  const hole = box(0.38, 0.46, 0.02, darkM); hole.position.set(0, 0.25, d / 2 + 0.01); g.add(hole);
  const holeTop = new THREE.Mesh(new THREE.CircleGeometry(0.19, 14, 0, Math.PI), darkM); holeTop.position.set(0, 0.48, d / 2 + 0.021); g.add(holeTop);
  for (const s of [-1, 1]) { const r = box(w * 0.62, 0.05, d + 0.16, roofM); r.position.set(s * w * 0.27, h + 0.2, 0); r.rotation.z = -s * 0.62; g.add(r); }
  const gable = new THREE.Mesh(new THREE.ConeGeometry(w * 0.56, 0.42, 3), wallM); gable.rotation.set(0, 0, 0); gable.scale.z = 0.02 / 0.5; gable.position.set(0, h + 0.17, d / 2 - 0.01); g.add(gable);
  const plate = box(0.3, 0.09, 0.02, mat('#f4efe4')); plate.position.set(0, h + 0.1, d / 2 + 0.03); g.add(plate);
  return g;
}
function makeHarness() {
  const g = new THREE.Group(); const wm = mat('#f4f4f2'), ym = mat('#f2c14e');
  const band = box(0.3, 0.04, 0.08, wm); g.add(band);
  for (const s of [-1, 1]) { const strap = box(0.03, 0.2, 0.06, wm); strap.position.set(s * 0.15, -0.09, 0); g.add(strap); }
  const handle = new THREE.Group(); handle.position.set(0, 0.02, -0.02); g.add(handle);
  for (const s of [-1, 1]) { const rod = box(0.025, 0.025, 0.55, wm); rod.position.set(s * 0.1, 0.12, -0.24); rod.rotation.x = -0.45; handle.add(rod); }
  const grip = box(0.24, 0.035, 0.035, ym); grip.position.set(0, 0.24, -0.48); handle.add(grip);
  g.userData = { handle };
  return g;
}

export { makeDog, dogPose, dogWalk, dogIdle, neckPos, handPos, makeCollar, dropCollar, makeLeash, makeDogHouse, makeHarness, COATS as DOG_COATS };
