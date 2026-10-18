import * as THREE from 'three';
import { rng, clamp, lerp, mat, box, canvasTex, makePerson, randPerson, poseWalk, SKIN } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// HYROX風の会場（フィットネスレース）。ブランドのロゴや配色は使わない。
// 8つの種目エリアが x 方向に並び（STN[i].x）、手前 z=RUNZ にランのレーンがある。
// API
//   arena (Scene)
//   STN[i] = { x, name }  i=0..7（SkiErg, Sled Push, Sled Pull, Burpee Broad Jump, Row, Farmers Carry, Lunges, Wall Balls）
//   makeAthlete({ shirt, skin, scale }) -> person（ランナー体型：細め・ランニングシャツ）
//   act(p, i, t, opt) : 種目 i の動きを時間 t で再生（p の位置・姿勢をセット）
//   run(p, x0, x1, t, speed) : ランのレーンを走らせる（x0→x1、速さ m/s）
//   others : ほかの選手（randPerson ×6）。setOthers(t, speed) でレーンを流す
//   finish : ゴールゲート（x=FINX）
//   setClock(text) : ゴールの大時計
// =====================================================
const arena = new THREE.Scene();
arena.background = new THREE.Color('#0f1218');
arena.fog = new THREE.Fog(0x0f1218, 35, 110);
arena.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2f3a, 1.25));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(10, 22, 16); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -50, right: 50, top: 25, bottom: -25, near: 1, far: 90 }); arena.add(key);
arena.add(key.target);

// floor
const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 300; i++) g.fillRect((i * 97) % w, (i * 53) % h, 2, 2); });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(30, 30);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; arena.add(floor);

// back wall with light strips, ceiling truss lights
const wall = box(240, 26, 1, mat('#161a22')); wall.position.set(0, 13, -22); arena.add(wall);
for (let i = 0; i < 12; i++) { const s = box(14, 0.5, 0.2, mat('#ffffff', { emissive: '#9fd8ff', emissiveIntensity: 1.2 })); s.position.set(-77 + i * 14, 9, -21.4); arena.add(s); }
for (let i = 0; i < 10; i++) for (const z of [-8, 4]) { const l = box(3, 0.25, 1.2, mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.5 })); l.position.set(-54 + i * 12, 16, z); arena.add(l); }

// run lane (blue carpet) with barriers
const RUNZ = 7;
const lane = box(130, 0.04, 3.2, mat('#2d4f8a')); lane.position.set(0, 0.02, RUNZ); lane.receiveShadow = true; arena.add(lane);
for (const dz of [-1.75, 1.75]) for (let i = 0; i < 44; i++) {
  const post = box(0.12, 1.0, 0.12, mat(i % 2 ? '#f2c14e' : '#1b1b1b')); post.position.set(-64 + i * 3, 0.5, RUNZ + dz); arena.add(post);
}
for (const dz of [-1.75, 1.75]) { const rail = box(130, 0.08, 0.08, mat('#e9e4da')); rail.position.set(0, 0.95, RUNZ + dz); arena.add(rail); }

// stations
const NAMES = ['SKIERG', 'SLED PUSH', 'SLED PULL', 'BURPEE BROAD JUMP', 'ROW', 'FARMERS CARRY', 'SANDBAG LUNGES', 'WALL BALLS'];
const STN = NAMES.map((name, i) => ({ x: -42 + i * 12, name }));
const turfM = mat('#1f4a33');
for (const s of STN) {
  const turf = box(9, 0.05, 11, turfM); turf.position.set(s.x, 0.025, -1.5); turf.receiveShadow = true; arena.add(turf);
  for (const dx of [-3, 0, 3]) { const ln = box(0.06, 0.06, 11, mat('#e9e4da')); ln.position.set(s.x + dx - 1.5, 0.05, -1.5); arena.add(ln); }
  const sign = textSprite(s.name, { w: 1024, h: 160, size: 96, color: '#ffffff', bg: 'rgba(20,24,32,.85)', sx: 6.5 }); sign.position.set(s.x, 6.5, -9); arena.add(sign);
}
const mDark = mat('#22252b'), mMetal = mat('#9aa3ad'), mBlack = mat('#121417'), mPlate = mat('#30343b'), mYel = mat('#f2c14e');

// 1 SkiErg
const ski = new THREE.Group(); ski.position.set(STN[0].x, 0, -1.6); arena.add(ski);
{ const tower = box(0.42, 2.3, 0.32, mDark); tower.position.y = 1.15; ski.add(tower); const base = box(1.0, 0.1, 1.2, mDark); base.position.set(0, 0.05, 0.3); ski.add(base); const fly = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 20), mMetal); fly.rotation.x = Math.PI / 2; fly.position.set(0, 2.05, 0.18); ski.add(fly); }
const skiRopes = [-1, 1].map(s => { const r = box(0.03, 1, 0.03, mBlack); r.geometry.translate(0, -0.5, 0); r.position.set(s * 0.18, 2.2, 0.2); ski.add(r); return r; });
// 2 sled push
function makeSled(plates = 4) {
  const g = new THREE.Group();
  const base = box(1.0, 0.12, 1.3, mMetal); base.position.y = 0.08; g.add(base);
  for (let i = 0; i < plates; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 22), mPlate); p.position.y = 0.2 + i * 0.09; g.add(p); }
  return g;
}
const sledA = makeSled(5); sledA.position.set(STN[1].x - 1.5, 0, 2.5); arena.add(sledA);
for (const s of [-1, 1]) { const pole = box(0.07, 1.25, 0.07, mMetal); pole.position.set(s * 0.4, 0.75, 0.6); pole.rotation.x = -0.25; sledA.add(pole); }
// 3 sled pull
const sledB = makeSled(3); sledB.position.set(STN[2].x - 1.5, 0, -6); arena.add(sledB);
const rope = box(0.05, 0.05, 1, mat('#c9b8a6')); rope.geometry.translate(0, 0, 0.5); arena.add(rope);
const pullBox = box(1.6, 0.03, 1.6, mat('#f2c14e')); pullBox.position.set(STN[2].x - 1.5, 0.06, 3.0); arena.add(pullBox);
// 5 rower
const row = new THREE.Group(); row.position.set(STN[4].x, 0, -1.0); arena.add(row);
{ const rail = box(0.16, 0.12, 2.6, mMetal); rail.position.set(0, 0.42, 0.3); row.add(rail); const head = box(0.5, 0.7, 0.5, mDark); head.position.set(0, 0.45, -1.2); row.add(head); const legF = box(0.4, 0.4, 0.1, mDark); legF.position.set(0, 0.2, 1.55); row.add(legF); }
const seat = box(0.36, 0.08, 0.36, mBlack); row.add(seat);
const handle = box(0.5, 0.04, 0.04, mBlack); row.add(handle);
// 6 kettlebells
function kb() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mBlack); b.position.y = -0.16; g.add(b); const h = box(0.16, 0.04, 0.04, mBlack); h.position.y = 0.0; g.add(h); return g; }
const bells = [kb(), kb()];
// 7 sandbag
const bag = box(0.75, 0.22, 0.26, mat('#3b4048'));
// 8 wall + ball
const wb = new THREE.Group(); wb.position.set(STN[7].x, 0, -4.2); arena.add(wb);
{ const w = box(2.4, 4.2, 0.25, mat('#e9e4da')); w.position.y = 2.1; wb.add(w); const tgt = box(0.9, 0.12, 0.05, mat('#ff6b6b', { emissive: '#ff6b6b', emissiveIntensity: 0.6 })); tgt.position.set(0, 3.0, 0.15); wb.add(tgt); const lab = textSprite('3m', { w: 256, h: 128, size: 80, color: '#ff6b6b', sx: 0.8 }); lab.position.set(0.85, 3.0, 0.2); wb.add(lab); }
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat('#4a4f58')); arena.add(ball);

// finish gate + big clock
const FINX = 56;
const finish = new THREE.Group(); finish.position.set(FINX, 0, RUNZ); arena.add(finish);
for (const s of [-1, 1]) { const p = box(0.4, 4.6, 0.4, mat('#e9e4da')); p.position.set(0, 2.3, s * 2.4); finish.add(p); }
{ const top = box(0.5, 0.9, 5.2, mat('#e9e4da')); top.position.y = 4.8; finish.add(top); const lab = textSprite('FINISH', { w: 1024, h: 200, size: 140, color: '#121417', sx: 4.6 }); lab.position.set(-0.3, 4.8, 0); lab.material.depthTest = false; lab.renderOrder = 4; finish.add(lab); }
const clock = textSprite('0:00:00', { w: 1024, h: 256, size: 190, color: '#ff6b6b', bg: '#0b0d10', sx: 3.4 }); clock.position.set(FINX, 5.95, RUNZ); clock.material.depthTest = false; clock.renderOrder = 5; arena.add(clock);
clock.visible = false; // 数字は画面の数字表示（setTop）だけに出す（目で追う場所を増やさない）
const setClock = (s) => clock.userData.set(s);

// athletes
function makeAthlete({ shirt = '#e8743b', skin = SKIN[2], scale = 1, bib = true } = {}) {
  const p = makePerson({ skin: '#5b3b2a', hair: '#141414', shirt, pants: '#5b3b2a', scale });
  const skinM = mat('#5b3b2a');
  p.userData.arms.forEach(a => { a.children[0].material = skinM; }); // ランニングシャツ（腕は素肌）
  const shorts = box(0.52, 0.26, 0.3, mat('#16181c')); shorts.position.y = 0.8; p.add(shorts);
  if (bib) { const b = box(0.26, 0.2, 0.02, mat('#ffffff')); b.position.set(0, 1.18, 0.15); p.add(b); }
  p.children.forEach(c => { if (c.isMesh) c.castShadow = true; });
  p.rotation.order = 'YXZ'; // 向きを決めてから前傾（rotation.x がプラスで前に倒れる）
  return p;
}
const others = [];
{ const r = rng(42); for (let i = 0; i < 6; i++) { const p = randPerson(r, { long: false, skirt: false }); arena.add(p); others.push({ p, off: i * 4.2 + r() * 1.5, dz: (r() - .5) * 1.6, ph: r() * 6 }); } }
function setOthers(x0, t, speed = 3.6) { for (const o of others) { o.p.visible = true; o.p.position.set(x0 + o.off + t * speed, 0, RUNZ + o.dz); o.p.rotation.y = Math.PI / 2; poseWalk(o.p, t * 9 + o.ph, 0.9); } }
function hideOthers() { others.forEach(o => o.p.visible = false); }

function reset(p) {
  const U = p.userData; p.rotation.set(0, 0, 0); p.position.y = 0; U.head.rotation.set(0, 0, 0);
  U.legs.forEach(l => l.rotation.set(0, 0, 0)); U.arms.forEach(a => a.rotation.set(0, 0, 0));
  bells.forEach(b => { if (b.parent) b.parent.remove(b); }); if (bag.parent) bag.parent.remove(bag);
  ball.visible = false; rope.visible = false;
}
// ランナーが走る（x0→x1、speed m/s）。足と腕は大きく振る
function run(p, x0, x1, t, speed = 6) {
  reset(p); const x = x0 + Math.sign(x1 - x0) * Math.min(Math.abs(x1 - x0), t * speed);
  p.position.set(x, 0, RUNZ); p.rotation.y = x1 > x0 ? Math.PI / 2 : -Math.PI / 2;
  const ph = t * speed * 2.2; const U = p.userData; const s = Math.sin(ph);
  U.legs[0].rotation.x = s * 0.9; U.legs[1].rotation.x = -s * 0.9; U.arms[0].rotation.x = -s * 1.0; U.arms[1].rotation.x = s * 1.0;
  U.arms.forEach(a => a.rotation.z = 0); p.position.y = Math.abs(Math.cos(ph)) * 0.12; p.rotation.z = 0; p.children[0] && 0;
  return x;
}
// 種目の動き。opt.slow: 0..1（1でつらそう：動きが小さく遅い）
function act(p, i, t, opt = {}) {
  reset(p); const U = p.userData; const sx = STN[i].x; const slow = opt.slow || 0;
  if (i === 0) { // SkiErg: 腕を上から下へ引き、腰を折る
    const c = (t * 1.0) % 1, k = c < 0.45 ? c / 0.45 : 1 - (c - 0.45) / 0.55;
    p.position.set(sx, 0, -0.75); p.rotation.y = Math.PI;
    U.arms.forEach(a => { a.rotation.x = lerp(-2.9, 0.2, k); });
    p.rotation.x = 0; U.head.rotation.x = 0.2 * k; p.position.y = -0.12 * k;
    U.legs.forEach(l => l.rotation.x = -0.35 * k); p.rotation.x = 0.35 * k; // 前傾
    skiRopes.forEach(r => { r.scale.y = lerp(0.35, 1.25, k); });
  }
  if (i === 1) { // Sled push: 前傾して押す。ゆっくり進む
    const speed = lerp(0.9, 0.35, slow);
    const d = (t * speed) % 10;
    sledA.position.set(sx - 1.5, 0, 2.5 - d);
    p.position.set(sx - 1.5, 0, 2.5 - d + 1.75); p.rotation.y = Math.PI; p.rotation.x = 0.62;
    const ph = t * lerp(4.5, 2.2, slow); U.legs[0].rotation.x = 0.6 + Math.sin(ph) * 0.45; U.legs[1].rotation.x = 0.6 - Math.sin(ph) * 0.45;
    U.arms.forEach(a => a.rotation.x = -2.1); p.position.y = -0.18; U.head.rotation.x = -0.6;
  }
  if (i === 2) { // Sled pull: 立ったままロープをたぐる。そりが近づく
    const speed = lerp(0.8, 0.28, slow); const d = Math.min(7.2, t * speed);
    sledB.position.set(sx - 1.5, 0, -6 + d);
    p.position.set(sx - 1.5, 0, 3.0); p.rotation.y = Math.PI; p.rotation.x = -0.28;
    const ph = t * lerp(5, 2.6, slow); U.arms[0].rotation.x = -1.2 + Math.sin(ph) * 0.6; U.arms[1].rotation.x = -1.2 - Math.sin(ph) * 0.6;
    U.legs[0].rotation.x = -0.5; U.legs[1].rotation.x = 0.25; p.position.y = -0.1;
    rope.visible = true; rope.position.set(sx - 1.5, 0.95, sledB.position.z + 0.7); rope.scale.z = Math.max(0.1, 3.0 - 0.45 - (sledB.position.z + 0.7)); rope.rotation.set(-0.08, 0, 0);
  }
  if (i === 3) { // Burpee broad jump: 伏せる→立つ→前へ跳ぶ を繰り返す
    const per = 1.35, c = (t % per) / per, n = Math.floor(t / per);
    const z0 = 3.5 - n * 1.9; let z = z0, y = 0;
    p.rotation.y = Math.PI;
    if (c < 0.35) { const k = Math.sin(c / 0.35 * Math.PI); p.rotation.x = k * 1.45; y = -0.55 * k; U.arms.forEach(a => a.rotation.x = -1.4 * k); }
    else if (c < 0.6) { U.legs.forEach(l => l.rotation.x = -0.6); y = -0.3; U.arms.forEach(a => a.rotation.x = 0.8); }
    else { const k = (c - 0.6) / 0.4; z = z0 - 1.9 * k; y = Math.sin(k * Math.PI) * 0.8; U.arms.forEach(a => a.rotation.x = -2.4 * Math.sin(k * Math.PI)); U.legs.forEach(l => l.rotation.x = -0.5 * Math.sin(k * Math.PI)); }
    p.position.set(sx - 1.5, y, Math.max(-6, z));
  }
  if (i === 4) { // Row: シートが前後し、腕で引く
    const c = (t * lerp(0.62, 0.45, slow)) % 1, k = c < 0.4 ? c / 0.4 : 1 - (c - 0.4) / 0.6;
    const z = lerp(0.95, -0.1, 1 - k) ; seat.position.set(0, 0.52, lerp(0.95, 0.0, k));
    p.position.set(sx, -0.38, -1.0 + lerp(0.95, 0.0, k)); p.rotation.y = Math.PI;
    U.legs.forEach(l => l.rotation.x = lerp(-1.55, -0.6, k)); p.rotation.x = lerp(0.35, -0.3, 1 - k) * 0.6;
    U.arms.forEach(a => a.rotation.x = lerp(-1.6, -0.6, 1 - k));
    handle.position.set(0, 1.05, -1.0 + lerp(0.95, 0.0, k) + lerp(-0.6, 0.15, 1 - k) - 1.0 + 1.0);
    void z;
  }
  if (i === 5) { // Farmers carry: ケトルベルを両手に持って歩く
    const sp = lerp(1.9, 1.1, slow); const z = 4 - (t * sp) % 10;
    p.position.set(sx - 1.5, 0, z); p.rotation.y = Math.PI;
    poseWalk(p, t * 7 * lerp(1, 0.7, slow), 0.8); U.arms.forEach(a => { a.rotation.x = 0; a.rotation.z = 0; });
    U.arms[0].rotation.z = -0.12; U.arms[1].rotation.z = 0.12;
    bells.forEach((b, k) => { U.arms[k].add(b); b.position.set(0, -0.72, 0); });
  }
  if (i === 6) { // Sandbag lunges: 担いで片ひざを深く曲げて進む
    const per = lerp(1.1, 1.6, slow), c = (t % per) / per, n = Math.floor(t / per), side = n % 2;
    const k = Math.sin(c * Math.PI);
    p.position.set(sx - 1.5, -0.32 * k, 4 - (n + c) * 0.75); p.rotation.y = Math.PI;
    U.legs[side].rotation.x = -1.1 * k; U.legs[1 - side].rotation.x = 0.7 * k;
    U.arms.forEach(a => a.rotation.x = -2.6); U.arms[0].rotation.z = -0.4; U.arms[1].rotation.z = 0.4;
    p.add(bag); bag.position.set(0, 1.5, -0.12);
  }
  if (i === 7) { // Wall balls: しゃがむ→投げる。ボールが3mの的まで
    const per = lerp(2.0, 2.6, slow), c = (t % per) / per;
    p.position.set(sx, 0, -3.0); p.rotation.y = Math.PI;
    let bx = sx, by, bz = -3.25;
    if (c < 0.4) { const k = Math.sin(c / 0.4 * Math.PI / 2); p.position.y = -0.45 * k; U.legs.forEach(l => l.rotation.x = -0.9 * k); p.rotation.x = 0.15 * k; U.arms.forEach(a => a.rotation.x = -1.9); by = 1.45 - 0.45 * k; }
    else if (c < 0.55) { const k = (c - 0.4) / 0.15; p.position.y = -0.45 * (1 - k); U.arms.forEach(a => a.rotation.x = lerp(-1.9, -2.9, k)); by = lerp(1.0, 2.2, k); }
    else { const k = (c - 0.55) / 0.45; U.arms.forEach(a => a.rotation.x = -2.6); const h = Math.sin(k * Math.PI); by = 2.2 + 1.0 * h; bz = -3.25 - 0.55 * h; }
    ball.visible = true; ball.position.set(bx, by, bz);
  }
}

export { arena, STN, RUNZ, FINX, makeAthlete, act, run, others, setOthers, hideOthers, finish, setClock, sledA, sledB };
