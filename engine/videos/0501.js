import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, props, lamp } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers } from '../scenes/field.js';
import { stage, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしもゴキブリが絶滅したら？（blueprint no 15。0015 は別の動画で使用済みのため id 0501）
// 数字：世界のゴキブリ 4,000種以上・屋内に侵入する種は1%未満・国内の記録 約65種・シロアリと同じく物質循環に貢献
//       （鹿児島県立博物館「鹿児島の自然だより」第231号 2025年7月「野外に生息するゴキブリの新知見」）
//       ギンリョウソウの種をモリチャバネゴキブリが食べて運ぶ：種は長さ0.3mm、フンから出た種の生存率52.0%（果実から直接 49.3%）、
//       食べてから3〜10時間でフンに（熊本大学 プレスリリース 2017年7月27日／Uehara & Sugiura, Botanical Journal of the Linnean Society 2017）

// ---------- roach (low-poly) ----------
const roachBody = mat('#6b3b22'), roachDark = mat('#3a2216'), roachLeg = mat('#4a2c1a');
function makeRoach() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), roachBody); b.scale.set(1, 0.28, 0.55); b.position.y = 0.14; g.add(b);
  const wingLine = box(0.85, 0.02, 0.02, roachDark); wingLine.position.set(-0.05, 0.285, 0); g.add(wingLine);
  const pro = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5), roachDark); pro.scale.set(0.9, 0.4, 1.25); pro.position.set(0.4, 0.16, 0); g.add(pro);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), roachDark); head.position.set(0.56, 0.12, 0); g.add(head);
  const ants = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(0.6, 0.15, s * 0.05);
    const l = box(0.75, 0.018, 0.018, roachLeg); l.position.x = 0.37; a.add(l); a.rotation.y = -s * 0.35; a.rotation.z = 0.25; g.add(a); ants.push(a);
  }
  const legs = [];
  for (const s of [-1, 1]) for (const x of [-0.25, 0.05, 0.3]) {
    const p = new THREE.Group(); p.position.set(x, 0.1, s * 0.2);
    const l = box(0.04, 0.03, 0.42, roachLeg); l.position.z = s * 0.2; l.rotation.x = s * 0.45; p.add(l);
    p.rotation.y = x * 1.2 * s; g.add(p); legs.push({ p, s, x });
  }
  g.userData.anim = (t, moving = 1) => {
    legs.forEach((L, i) => { L.p.rotation.y = L.x * 1.2 * L.s + Math.sin(t * 40 + i * 2.1) * 0.35 * moving; });
    ants.forEach((a, i) => { a.rotation.y = (i ? 1 : -1) * -0.35 + Math.sin(t * 7 + i) * 0.12; });
  };
  return g;
}
// roach running on a loop path in the xz plane; returns position
function roachRun(r, t, cx, cz, rx, rz, y, speed, phase, s = 1) {
  const a = phase + t * speed;
  const x = cx + Math.cos(a) * rx + Math.sin(a * 3.1 + phase) * rx * 0.15, z = cz + Math.sin(a) * rz;
  const dx = -Math.sin(a) * rx * speed, dz = Math.cos(a) * rz * speed;
  r.position.set(x, y, z); r.rotation.y = Math.atan2(-dz, dx); r.scale.setScalar(s); r.userData.anim(t, 1);
  return r.position;
}

// ---------- kitchen: button, hand, cook ----------
const KIT = new THREE.Group(); room.add(KIT);
const BTN = new THREE.Vector3(-0.15, 0.95, -2.95);
const btnBase = box(0.42, 0.1, 0.42, mat('#2a2d33')); btnBase.position.set(BTN.x, BTN.y + 0.05, BTN.z); KIT.add(btnBase);
const btnCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 20), mat('#e0352b', { emissive: 0x5a0a06, emissiveIntensity: 0.5 })); btnCap.castShadow = true; KIT.add(btnCap);
const btnLab = textSprite('ゴキブリ絶滅ボタン', { w: 768, h: 128, size: 64, bg: 'rgba(20,22,28,.85)', sx: 0.95 }); btnLab.position.set(BTN.x, BTN.y + 0.45, BTN.z); KIT.add(btnLab);
function setButton(k) { btnCap.position.set(BTN.x, BTN.y + 0.145 - 0.05 * k, BTN.z); }
const hand = new THREE.Group(); KIT.add(hand);
{ const sl = box(0.16, 0.7, 0.16, mat('#4fa3d1')); sl.position.y = 0.45; hand.add(sl); const h = box(0.13, 0.16, 0.15, mat(SKIN[0])); h.position.y = 0.05; hand.add(h); const f = box(0.04, 0.09, 0.04, mat(SKIN[0])); f.position.y = -0.06; hand.add(f); }
hand.rotation.z = -0.35;
function setHand(k) { // k 0 = up out of view, 1 = pressing
  hand.visible = k > 0.01; hand.position.set(BTN.x + 0.05 + (1 - k) * 0.45, BTN.y + 0.24 + (1 - k) * 0.9, BTN.z + 0.02);
}
const cook = makePerson({ skin: SKIN[2], hair: HAIR[3], shirt: '#e9e4da', pants: '#3b3f4a', long: true, scale: 1 }); cook.position.set(0.7, 0, -1.9); cook.rotation.y = -1.3; KIT.add(cook);
const kRoach = [makeRoach(), makeRoach(), makeRoach()]; kRoach.forEach(r => KIT.add(r));
const kitSpark = makeSparkles(160, 0.06); room.add(kitSpark.points);
const KPATH = [[-0.9, -2.95, 0.5, 0.12, 0.97, 1.6, 0, 0.16], [-0.2, -1.7, 0.7, 0.35, 0.01, 1.2, 2, 0.2], [-1.1, -2.1, 0.5, 0.3, 0.01, 1.5, 4, 0.19]];
function kitRoaches(t, vis) { kRoach.forEach((r, i) => { r.visible = vis; if (vis) { const p = KPATH[i]; roachRun(r, t, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]); } }); }
function kitchen(mode = 'night') {
  setRoom({ sets: ['kitchen'] }); KIT.visible = true;
  if (mode === 'night') setLight('night', { ceil: 9, hemi: 0.75, lamp: 1.6 }); else setLight('day', { ceil: 4, hemi: 1.0 });
  lamp.position.set(-0.2, 2.1, -2.4); lamp.color.set('#fff0d8');
}

// ---------- forest floor (added to field) ----------
const P = new THREE.Vector3(-20, 0, 18);
const WOODS = new THREE.Group(); WOODS.position.copy(P); field.add(WOODS);
{
  const r = rng(51);
  const litter = new THREE.Mesh(new THREE.CircleGeometry(9, 28), mat('#6e5232')); litter.rotation.x = -Math.PI / 2; litter.position.y = 0.02; litter.receiveShadow = true; WOODS.add(litter);
  const leafCols = ['#a8642e', '#c9893f', '#8a5a2b', '#b5772f', '#7a4a24', '#d1a04a'];
  for (let i = 0; i < 260; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 8.5;
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.16 + r() * 0.12, 5), mat(leafCols[Math.floor(r() * leafCols.length)], { side: THREE.DoubleSide }));
    l.rotation.x = -Math.PI / 2 + (r() - .5) * 0.4; l.rotation.z = r() * 6; l.position.set(Math.cos(a) * d, 0.04 + r() * 0.03, Math.sin(a) * d); l.receiveShadow = true; WOODS.add(l);
  }
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 4.2, 9), mat('#6b4f3a', { flatShading: true })); log.rotation.z = Math.PI / 2; log.rotation.y = 0.5; log.position.set(-0.6, 0.4, -1.6); log.castShadow = true; WOODS.add(log);
  const logEnd = new THREE.Mesh(new THREE.CircleGeometry(0.42, 9), mat('#b08a5e')); logEnd.position.set(1.22, 0.4, -2.6); logEnd.rotation.y = Math.PI / 2 + 0.5; WOODS.add(logEnd);
  for (let i = 0; i < 14; i++) {
    const a = r() * 6.28, d = 5 + r() * 6; const x = Math.cos(a) * d, z = Math.sin(a) * d - 3;
    const h = 2.5 + r() * 2; const tr = box(0.35, h, 0.35, mat('#5d4434')); tr.position.set(x, h / 2, z); WOODS.add(tr);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + r() * 0.8, 0), mat(r() < .5 ? '#3f7a44' : '#4f8f4a', { flatShading: true })); c.position.set(x, h + 0.8, z); c.castShadow = true; WOODS.add(c);
  }
  for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 5), mat('#4d7f3a', { flatShading: true })); const a = r() * 6.28, d = 3 + r() * 5; f.position.set(Math.cos(a) * d, 0.25, Math.sin(a) * d); WOODS.add(f); }
}
// ghost plants (white, nodding)
const ghostM = new THREE.MeshLambertMaterial({ color: '#f4f2ec', emissive: 0x2a2a2a, emissiveIntensity: 0.4 });
const ghosts = [];
for (const [x, z, s] of [[0.9, 0.4, 1], [1.25, 0.15, 0.85], [0.6, 0.0, 0.9], [1.05, -0.2, 0.75], [-1.6, 0.9, 0.9], [-1.9, 0.6, 0.8]]) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 6), ghostM); stem.position.y = 0.21; g.add(stem);
  for (const h of [0.12, 0.26]) { const sc = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 5), ghostM); sc.position.y = h; g.add(sc); }
  const head = new THREE.Group(); head.position.set(0.0, 0.43, 0); head.rotation.z = -2.55; g.add(head);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.035, 0.22, 7, 1, true), ghostM); bell.material.side = THREE.DoubleSide; bell.position.y = 0.1; head.add(bell);
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), mat('#e8e4d6')); fruit.position.y = 0.06; fruit.visible = false; head.add(fruit);
  g.position.set(x, 0.03, z); g.scale.setScalar(s * 1.4); WOODS.add(g); ghosts.push({ g, head, fruit });
}
const ghostLab = makeLabel('ギンリョウソウ', { sx: 1.5, size: 60, bg: 'rgba(20,22,28,.7)' }); ghostLab.position.set(0.9, 1.0, 0.5); WOODS.add(ghostLab);
const fRoach = []; for (let i = 0; i < 14; i++) { const r = makeRoach(); WOODS.add(r); fRoach.push(r); }
const forestSpark = makeSparkles(500, 0.12); WOODS.add(forestSpark.points);
function forestRoaches(t, vis, gather = 0) {
  fRoach.forEach((r, i) => {
    r.visible = vis; if (!vis) return;
    const ph = i * 1.7, rr = 1.0 + (i % 5) * 0.7;
    const cx = lerp((i % 3 - 1) * 1.6, 0.9, gather), cz = lerp((i % 4 - 1.5) * 0.9, 0.25, gather);
    roachRun(r, t * (0.5 + (i % 3) * 0.15), cx, cz, lerp(rr, 0.55 + (i % 3) * 0.12, gather), lerp(rr * 0.6, 0.4, gather), 0.06, 1.1, ph, 0.13);
  });
}
// seeds in droppings (seed-dispersal visual): small pellets with white dots
const pellets = [];
{ const r = rng(77); for (let i = 0; i < 16; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.07, 3, 6), mat('#2a1a12')); p.rotation.z = Math.PI / 2; p.rotation.y = r() * 6; const x = -2.5 + r() * 5, z = -1.4 + r() * 1.9; p.position.set(x, 0.07, z); p.visible = false; WOODS.add(p); pellets.push({ p, k: r() }); } }
const seedRing = []; for (const pl of pellets) { const s = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.17, 16), new THREE.MeshBasicMaterial({ color: 0x7ff0c8, transparent: true, opacity: 0, side: THREE.DoubleSide })); s.rotation.x = -Math.PI / 2; s.position.copy(pl.p.position); s.position.y = 0.09; WOODS.add(s); seedRing.push(s); }
function showPellets(k, ringOp = 0) { pellets.forEach((x, i) => { x.p.visible = x.k < k; seedRing[i].material.opacity = x.k < k ? ringOp : 0; }); }
function woodsEnv(e) { setFieldEnv(e); setFlowers(1); }
const wp = (x, y, z) => [P.x + x, P.y + y, P.z + z];

// ---------- stage: 100 tiles = all species ----------
const TILES = new THREE.Group(); stage.add(TILES);
const tiles = [];
{
  const tg = new THREE.BoxGeometry(0.82, 0.25, 0.82);
  for (let i = 0; i < 100; i++) {
    const c = i % 10, r = Math.floor(i / 10);
    const m = new THREE.Mesh(tg, mat(i === 33 ? '#e0603a' : (r + c) % 2 ? '#3f8f6b' : '#4fa37a')); m.position.set(-4.05 + c * 0.9, 0.42, -4.05 + r * 0.9); m.castShadow = true; TILES.add(m); tiles.push(m);
  }
}
const tileHouse = makeLabel('家に入る', { sx: 2.4, size: 64, bg: 'rgba(224,96,58,.92)' }); tileHouse.position.set(-1.35, 1.7, -1.35); tileHouse.material.depthTest = false; tileHouse.renderOrder = 6; TILES.add(tileHouse);
const tileForest = makeLabel('森や草地', { sx: 2.6, size: 64, bg: 'rgba(63,143,107,.92)' }); tileForest.position.set(2.2, 1.7, 1.8); tileForest.material.depthTest = false; tileForest.renderOrder = 6; TILES.add(tileForest);
const tileRoach = makeRoach(); tileRoach.scale.setScalar(0.5); stage.add(tileRoach);
function showTiles(k, labels) { tiles.forEach((m, i) => { const u = clamp((k * 110 - i) / 6); m.scale.set(1, Math.max(0.01, u), 1); m.visible = u > 0.01; }); tileHouse.visible = labels > 0; tileForest.visible = labels > 0; tileHouse.material.opacity = labels; tileForest.material.opacity = labels; }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの夜の台所。'],
  [6.2, 10.1, '家のゴキブリが、<br>一斉に消えた。'],
  [10.1, 14, '台所は、<br>すっかり平和に。'],
  [14.2, 18.1, 'でも消えたのは、<br>家の中だけじゃない。'],
  [18.1, 22, '森や草地のゴキブリも、<br>ぜんぶ消えた。'],
  [22.2, 26.1, '家に入ってくる種類は、<br>1%にも満たない。'],
  [26.1, 30, 'ほとんどは、<br>森で暮らしていた。'],
  [30.2, 34.6, 'シロアリと同じように、<br>森の物質循環を支える一員。'],
  [34.6, 39, '白い花ギンリョウソウ。<br>その種を運ぶのもゴキブリ。'],
  [39.2, 43.6, '実を食べて、<br>フンと一緒に種をまく。'],
  [43.6, 47.8, 'フンから出た種の<br>半分以上が生きていた。'],
  [48.1, 52.6, '結果：消えたゴキブリの<br>99%以上は森の住人だった。'],
  [52.6, 55.4, '台所の平和と引きかえに、<br>森の種まき係が1つ減った。'],
  [55.6, 59.4, 'ゴキブリ絶滅ボタン、<br>押す？押さない？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TP = 1.4; // press time
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(0.55, 0.45, u), lerp(1.75, 1.7, u), lerp(-1.25, -1.4, u), BTN.x - 0.05, 0.95, BTN.z - 0.05, 50); }
function shot0(t, T) { // hook: red button, countdown, press at 1.4 -> roaches vanish
  kitchen('night'); cook.visible = false; btnLab.visible = false;
  const press = clamp((t - (TP - 0.35)) / 0.35);
  setHand(t < TP ? ease(press) : clamp(1 - (t - TP - 0.25) / 0.5)); setButton(t < TP ? press : clamp(1 - (t - TP - 0.2) / 0.3));
  kRoach.forEach(r => r.visible = false);
  const r0 = kRoach[0]; r0.visible = t < TP; if (r0.visible) roachRun(r0, t, BTN.x - 0.05, BTN.z + 0.12, 0.38, 0.1, 0.97, 1.4, 1.5, 0.11);
  if (t >= TP && !kitSpark.ready) { kitSpark.init([r0.position.toArray()], 0.12, 0.5); kitSpark.ready = true; }
  kitSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  setHud('絶滅ボタンを押すまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t, T) { // everyday: night kitchen with roaches, cook startled
  lift(270);
  kitchen('night'); cook.visible = true; setHand(0); setButton(0); btnLab.visible = false; btnCap.visible = btnBase.visible = false; kitSpark.set(0);
  kitRoaches(t + 2, true);
  cook.userData.arms[1].rotation.x = -1.2 - Math.sin(t * 6) * 0.15; cook.userData.arms[0].rotation.x = -0.8;
  const u = ease(t / 3.5);
  look(lerp(-1.3, -1.0, u), lerp(2.4, 2.3, u), lerp(2.6, 2.2, u), 0.0, 0.2, -2.0, 55);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t, T) { // +1s kitchen roaches vanish
  lift(270);
  kitchen('night'); cook.visible = true; setHand(0); setButton(1); btnCap.visible = btnBase.visible = false; btnLab.visible = false;
  const tv = 0.6;
  kitRoaches(t + 5, t < tv);
  if (t >= tv && !kitSpark.ready2) { kitSpark.init(kRoach.map(r => r.position.toArray()), 0.15, 0.6); kitSpark.ready2 = true; }
  kitSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  cook.userData.arms[1].rotation.x = t < tv ? -1.2 : lerp(-1.2, 0, clamp((t - 2) / 1));
  cook.userData.arms[0].rotation.x = t < tv ? -0.8 : lerp(-0.8, 0, clamp((t - 2) / 1));
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 8);
  look(lerp(-1.0, -0.6, u), lerp(2.3, 2.4, u), lerp(2.2, 2.6, u), 0.0, 0.2, -2.0, 55);
  hudTime('+1秒');
  setTop('日本で記録されたゴキブリ（2025年）', '約' + countUp(t, 65) + '種', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +1min forest roaches vanish
  lift(380);
  woodsEnv('day'); showPellets(0); ghosts.forEach(g => g.fruit.visible = false); ghostLab.visible = false;
  const tv = 1.2;
  forestRoaches(t, t < tv);
  if (t >= tv && !forestSpark.ready) { forestSpark.init(fRoach.map(r => r.position.toArray()), 0.3, 0.9); forestSpark.ready = true; }
  forestSpark.set(t >= tv ? (t - tv) / 1.6 : 0);
  const u = ease(t / 8);
  look(...wp(lerp(-1.5, 0.5, u), lerp(3.6, 3.0, u), lerp(7.5, 6.5, u)), ...wp(0, 0.2, -0.6), 50);
  hudTime('+1分');
  setTop('世界のゴキブリ（2025年）', comma(countUp(t, 4000)) + '種以上', fade(t, 0.15, 8, 0.25));
  return field;
}
function shot4(t, T) { // +1h 100 tiles
  lift(300); setStageColor('#14213a');
  TILES.visible = true; showTiles(clamp(0.12 + t / 1.8), clamp((t - 2.6) / 0.4));
  tileRoach.visible = true; tileRoach.position.set(-1.35, 0.62, -1.35 + Math.sin(t * 2) * 0.12); tileRoach.rotation.y = Math.PI / 2; tileRoach.userData.anim(t, 1);
  const u = ease(t / 8);
  look(lerp(1.5, -0.5, u), lerp(17, 16.5, u), lerp(15, 14, u), 0, 0, -0.8, 50);
  hudTime('+1時間');
  setTop('家に入らない種類（2025年）', countUp(t, 99, 0.4, 1.6) + '%以上', fade(t, 0.15, 8, 0.25), '#7ff0c8');
  return stage;
}
function shot5(t, T) { // +1day forest: material cycle + ghost plants
  lift(380);
  woodsEnv('day'); forestRoaches(0, false); forestSpark.set(0); showPellets(0); ghosts.forEach(g => g.fruit.visible = false);
  ghostLab.visible = t > 4.4; ghostLab.material.opacity = clamp((t - 4.4) / 0.4);
  const u = ease(t / 9.2);
  look(...wp(lerp(3.2, 2.4, u), lerp(2.6, 1.9, u), lerp(5.0, 3.6, u)), ...wp(lerp(0.2, 0.8, u), lerp(0.3, 0.45, u), lerp(-0.6, 0.0, u)), 50);
  hudTime('+1日');
  setTop('ギンリョウソウの種の長さ（2017年発表）', (countUp(t, 3, 0.3, 1.2) / 10).toFixed(1) + 'mm', fade(t, 0.15, 9.2, 0.25));
  return field;
}
function shot6(t, T) { // +1month seed dispersal memory (roaches eat fruit -> pellets) shown faintly as before, now empty
  lift(380);
  woodsEnv('day'); forestSpark.set(0); ghostLab.visible = false;
  ghosts.forEach(g => g.fruit.visible = true);
  const past = t < 4.4; // first half: how it used to be (roaches gather at fruit), second: pellets with living seeds
  forestRoaches(t, past, past ? clamp(t / 0.7) : 0);
  showPellets(past ? clamp((t - 1.5) / 2.5) : 1, past ? 0 : 0.85 * clamp((t - 4.6) / 0.4));
  const u = ease(t / 8.8);
  look(...wp(lerp(2.6, -0.5, u), lerp(2.0, 4.2, u), lerp(3.4, 6.5, u)), ...wp(lerp(0.9, 0.2, u), 0.2, lerp(0.2, -0.3, u)), 50);
  hudTime('+1か月');
  setTop('フンから出た種の生存率（2017年発表）', (countUp(t, 520, 0.3, 1.6) / 10).toFixed(1) + '%', fade(t, 0.15, 8.8, 0.25), '#7ff0c8');
  return field;
}
function shot7(t, T) { // result: empty forest at dusk, fruits uneaten, no pellets
  lift(380);
  woodsEnv('dusk'); forestRoaches(0, false); forestSpark.set(0); showPellets(0); ghostLab.visible = false;
  ghosts.forEach(g => g.fruit.visible = true);
  const u = ease(t / 7.5);
  look(...wp(lerp(0.5, -1.0, u), lerp(2.6, 4.2, u), lerp(5.0, 7.5, u)), ...wp(0.6, 0.3, -0.2), 50);
  setTop('消えたゴキブリのうち 森や草地などの種類（2025年）', countUp(t, 99, 0.2, 1.3) + '%以上', fade(t, 0.15, 7.5, 0.25), '#7ff0c8');
  return field;
}
function shot8(t, T) { // loop: same kitchen button, already pressed, no roaches
  kitchen('night'); cook.visible = false; btnCap.visible = btnBase.visible = true; btnLab.visible = false; setHand(0); setButton(0); kitSpark.set(0);
  kRoach.forEach(r => r.visible = false);
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', cd(TP), 1, { mono: true });
  return room;
}
function stageOff(f) { TILES.visible = f === shot4; tileRoach.visible = f === shot4; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { stageOff(f); btnCap.visible = btnBase.visible = true; return f(t, T); }; s.f.orig = f; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0501',
    title: 'ゴキブリが絶滅したら？',
    titleHtml: 'ゴキブリが<br>絶滅したら？',
    mood: 'tension', seed: 501, hits: [1.4, 48.1], risers: [6.0],
    narr: { '99%以上': 'きゅうじゅうきゅうパーセント以上', '1%': 'いちパーセント' },
    ask: 'ゴキブリ絶滅ボタン、押す？押さない？',
    caption: 'もしも世界中のゴキブリが一瞬で絶滅したら？\n台所は平和になる。でも世界に4,000種以上いるゴキブリのうち、家に入ってくるのは1%にも満たない。森ではギンリョウソウの種を運ぶ役までしていた。博物館と大学の研究で調べてみた。\n\nゴキブリ絶滅ボタン、押す？押さない？ コメントで教えて。\n\n出典：鹿児島県立博物館「鹿児島の自然だより」第231号（2025年）、熊本大学 プレスリリース（2017年）・Uehara & Sugiura, Botanical Journal of the Linnean Society（2017年）',
    hashtags: ['もしもラボ', 'ゴキブリ', '絶滅', '生き物', '雑学'],
    endStats: [['世界のゴキブリ', '4,000種以上', '2025年'], ['家に入ってくる種類', '1%未満', '2025年'], ['日本で記録された種類', '約65種', '2025年'], ['フンから出た種の生存率', '52.0%', '2017年発表']],
    sources: '出典：鹿児島県立博物館「鹿児島の自然だより」第231号、<br>熊本大学 プレスリリース（2017年）、Botanical Journal of the Linnean Society',
  },
});
