import * as THREE from 'three';
import { mat, box, clamp } from '../lib.js';

// =====================================================
// PETS: low-poly house cat + pet props (bowl, cat bed, toy ball). Add to any scene (room / city / field).
// Sizes are in room units (person ≈ 1.8 tall): a cat is ≈ 0.55 long, 0.38 tall when standing.
// API
//   makeCat({ coat:'orange'|'gray'|'white'|'black'|'calico', scale }) -> Group (+ userData.legs/head/tail)
//   catPose(cat, 'stand'|'sit'|'loaf'|'sleep')   — static pose
//   catWalk(cat, phase, amp=1)                   — walking legs + tail sway (call every frame)
//   catBreath(cat, t)                            — small idle motion (tail + head)
//   makeBowl({ color, food }) -> Group (+ userData.setFood(0..1))
//   makeCatBed(color) -> Group, makeToyBall(color) -> Mesh
// =====================================================
const COATS = {
  orange: { body: '#e39a52', dark: '#b8682e', belly: '#f6dcc0', eye: '#1b1b1b' },
  gray: { body: '#8d949e', dark: '#626973', belly: '#d9dde2', eye: '#1b1b1b' },
  white: { body: '#f3efe8', dark: '#d8d0c4', belly: '#ffffff', eye: '#1b1b1b' },
  black: { body: '#2b2c31', dark: '#1c1d21', belly: '#3a3b41', eye: '#e6d35a' },
  calico: { body: '#f3efe8', dark: '#c47a3a', belly: '#ffffff', eye: '#1b1b1b', patch: '#2f2a28' },
};
function makeCat(opt = {}) {
  const C = COATS[opt.coat || 'orange'];
  const g = new THREE.Group();
  const bodyM = mat(C.body), darkM = mat(C.dark), bellyM = mat(C.belly), eyeM = mat(C.eye, C.eye !== '#1b1b1b' ? { emissive: C.eye, emissiveIntensity: 0.4 } : {}), noseM = mat('#e88a8a'), whiteM = mat('#ffffff');
  const body = new THREE.Group(); body.position.y = 0.2; g.add(body);
  const torso = box(0.22, 0.2, 0.46, bodyM); body.add(torso);
  const belly = box(0.18, 0.04, 0.38, bellyM); belly.position.y = -0.1; body.add(belly);
  // stripes / patches
  for (let i = 0; i < 3; i++) { const s = box(0.225, 0.04, 0.05, darkM); s.position.set(0, 0.08, -0.12 + i * 0.12); body.add(s); }
  if (C.patch) { const p = box(0.226, 0.12, 0.16, mat(C.patch)); p.position.set(0.0, 0.05, -0.1); body.add(p); }
  // legs (pivot at hip)
  const legs = [];
  for (const [x, z] of [[-0.07, 0.17], [0.07, 0.17], [-0.07, -0.17], [0.07, -0.17]]) {
    const p = new THREE.Group(); p.position.set(x, -0.06, z);
    const l = box(0.065, 0.16, 0.07, bodyM); l.position.y = -0.08; p.add(l);
    const paw = box(0.07, 0.03, 0.08, bellyM); paw.position.set(0, -0.155, 0.01); p.add(paw);
    body.add(p); legs.push(p);
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 0.13, 0.25); body.add(head);
  const hd = box(0.2, 0.17, 0.16, bodyM); head.add(hd);
  const muzzle = box(0.1, 0.06, 0.05, bellyM); muzzle.position.set(0, -0.045, 0.09); head.add(muzzle);
  const nose = box(0.025, 0.018, 0.012, noseM); nose.position.set(0, -0.02, 0.118); head.add(nose);
  const earGeo = new THREE.ConeGeometry(0.045, 0.09, 4); earGeo.rotateY(Math.PI / 4);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(earGeo, bodyM); e.position.set(s * 0.06, 0.12, -0.01); e.rotation.z = -s * 0.15; e.castShadow = true; head.add(e);
    const ey = box(0.025, 0.035, 0.012, eyeM); ey.position.set(s * 0.045, 0.02, 0.083); head.add(ey);
    const sh = box(0.01, 0.01, 0.006, whiteM); sh.position.set(s * 0.045 + 0.006, 0.03, 0.09); head.add(sh);
  }
  // tail: 3 segments
  const tail = new THREE.Group(); tail.position.set(0, 0.06, -0.23); body.add(tail);
  let parent = tail; const segs = [];
  for (let i = 0; i < 3; i++) {
    const sgp = new THREE.Group(); if (i > 0) sgp.position.z = -0.11; parent.add(sgp);
    const sg = box(0.045, 0.045, 0.12, i === 2 ? darkM : bodyM); sg.position.z = -0.055; sgp.add(sg);
    segs.push(sgp); parent = sgp;
  }
  g.userData = { body, legs, head, tail, segs, pose: 'stand' };
  g.scale.setScalar(opt.scale || 1);
  catPose(g, 'stand');
  return g;
}
function catPose(c, pose) {
  const { body, legs, head, tail, segs } = c.userData; c.userData.pose = pose;
  body.rotation.set(0, 0, 0); body.position.set(0, 0.2, 0); head.rotation.set(0, 0, 0); head.position.set(0, 0.13, 0.25);
  legs.forEach(l => { l.rotation.set(0, 0, 0); l.visible = true; });
  tail.rotation.set(0.5, 0, 0); segs.forEach((s, i) => s.rotation.set(i ? -0.25 : 0, 0, 0));
  if (pose === 'sit') {
    body.rotation.x = -0.65; body.position.set(0, 0.2, 0.02);
    legs[2].rotation.x = 0.65 - 1.4; legs[3].rotation.x = 0.65 - 1.4; legs[0].rotation.x = 0.65; legs[1].rotation.x = 0.65;
    head.rotation.x = 0.55; tail.rotation.set(1.4, 0, 0); segs[1].rotation.set(0, 0.5, 0); segs[2].rotation.set(0, 0.6, 0);
  } else if (pose === 'loaf') {
    body.position.y = 0.12; legs.forEach(l => { l.rotation.x = 1.5; });
    tail.rotation.set(1.3, 0.9, 0); segs[1].rotation.set(0, 0.7, 0); segs[2].rotation.set(0, 0.7, 0);
  } else if (pose === 'sleep') {
    body.position.y = 0.11; body.rotation.z = Math.PI / 2 - 0.25; body.position.x = 0.02;
    legs.forEach((l, i) => { l.rotation.x = i < 2 ? 0.9 : -0.9; });
    head.rotation.set(0.3, 0, -0.2); tail.rotation.set(1.2, 1.2, 0); segs[1].rotation.set(0, 0.8, 0); segs[2].rotation.set(0, 0.8, 0);
  }
}
function catWalk(c, phase, amp = 1) {
  const { legs, tail, head, body } = c.userData;
  const s = Math.sin(phase) * 0.6 * amp;
  legs[0].rotation.x = s; legs[3].rotation.x = s; legs[1].rotation.x = -s; legs[2].rotation.x = -s;
  tail.rotation.set(0.9, Math.sin(phase * 0.5) * 0.4, 0); head.rotation.y = Math.sin(phase * 0.25) * 0.08;
  body.position.y = 0.2 + Math.abs(Math.cos(phase)) * 0.012 * amp;
}
function catBreath(c, t) {
  const { tail, head, body, segs } = c.userData; const p = c.userData.pose;
  if (p === 'sit' || p === 'loaf' || p === 'stand') { segs[2].rotation.y = 0.6 + Math.sin(t * 2.2) * 0.35; head.rotation.y = Math.sin(t * 0.7) * 0.15; }
  if (p === 'sleep') body.scale.set(1, 1 + Math.sin(t * 2.4) * 0.03, 1);
}

function makeBowl({ color = '#e2675a', food = 1 } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.07, 18), mat(color)); b.position.y = 0.035; b.castShadow = true; g.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 6, 20), mat('#ffffff')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.07; g.add(rim);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#a8683a', { flatShading: true })); f.scale.y = 0.45; f.position.y = 0.06; g.add(f);
  g.userData.setFood = (k) => { f.visible = k > 0.01; f.scale.set(clamp(k), 0.45 * clamp(k), clamp(k)); };
  g.userData.setFood(food);
  return g;
}
function makeCatBed(color = '#c9a7d8') {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.06, 20), mat(color)); base.position.y = 0.03; base.receiveShadow = true; g.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.07, 8, 22), mat(color)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.09; rim.castShadow = true; g.add(rim);
  const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 20), mat('#f4ecdf')); cush.position.y = 0.075; g.add(cush);
  return g;
}
function makeToyBall(color = '#f2c14e') { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), mat(color, { flatShading: true })); m.castShadow = true; return m; }

export { makeCat, catPose, catWalk, catBreath, makeBowl, makeCatBed, makeToyBall, COATS };
