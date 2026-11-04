import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしもタバコ休憩の分だけ給料が引かれたら？（皮肉回・台本 S24・図星／大人の本音）
// 2026/11/03 ゆうと承認。元ネタ：なんJ・ガルちゃんで定期的に燃える タバコ休憩はずるい 論争
// 数字（裏取り済み）：
//  習慣的に喫煙している者の割合 男性24.8%・女性6.2%・総数14.8%（厚生労働省「令和4年 国民健康・栄養調査」）
//  1か月約13時間は 10分×4回×20日＝800分 の単純計算（画面に（単純計算）と出す）
// 給料から引くのは もしもの設定。タイマーの時間は演出（金額は出さない）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function makeTimer(sx = 1.2) { const l = label('00:00', { w: 512, size: 130, color: '#ff4a4a', bg: 'rgba(18,20,26,.96)', sx }); return l; }
function smokePose(p, t, ph = 0) { p.userData.arms[1].rotation.x = -1.9 + Math.sin(t * 1.3 + ph) * 0.15; p.userData.arms[1].rotation.z = 0.35; }
function makeCig(p) { const c = box(0.03, 0.03, 0.16, mat('#f4f4f2')); c.position.set(0, -0.66, 0.08); p.userData.arms[1].add(c); const tip = box(0.032, 0.032, 0.03, new THREE.MeshBasicMaterial({ color: '#ff6a2a' })); tip.position.set(0, -0.66, 0.17); p.userData.arms[1].add(tip); return c; }

// ---------- A：会社の廊下と喫煙所（原点） ----------
const afloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat('#7d8798', { depthWrite: false })); afloor.rotation.x = -Math.PI / 2; afloor.position.set(0, 0.01, 0); afloor.renderOrder = -0.8; S.add(afloor);
const awall = box(16, 3.6, 0.2, mat('#e6e9ee')); awall.position.set(0, 1.8, -3.4); S.add(awall);
// 喫煙所（ガラスの箱）
const booth = new THREE.Group(); S.add(booth); booth.position.set(0, 0, -2.0);
const glassM = new THREE.MeshLambertMaterial({ color: '#bfd8e8', transparent: true, opacity: 0.32, depthWrite: false });
{ const back = box(3.4, 2.6, 0.06, mat('#c9ced8')); back.position.set(0, 1.3, -1.3); booth.add(back);
  for (const x of [-1.7, 1.7]) { const s = box(0.06, 2.6, 2.6, glassM); s.position.set(x, 1.3, 0); booth.add(s); }
  const front = box(3.4, 2.6, 0.04, glassM); front.position.set(0, 1.3, 1.3); front.renderOrder = 2; booth.add(front);
  const roof = box(3.5, 0.12, 2.7, mat('#9aa0aa')); roof.position.set(0, 2.66, 0); booth.add(roof);
  for (const x of [-1.7, 1.7]) for (const z of [-1.3, 1.3]) { const f = box(0.08, 2.6, 0.08, mat('#8a8f99')); f.position.set(x, 1.3, z); booth.add(f); }
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 14), mat('#5a5e66')); ash.position.set(0, 0.45, -0.2); booth.add(ash);
}
const boothSign = label('喫煙所', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.95 }); boothSign.position.set(0, 2.95, -0.6); S.add(boothSign);
const TIMER = makeTimer(0.95); TIMER.position.set(0.62, 2.3, -0.55); S.add(TIMER);
const minus = label('給料 マイナス', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.15 }); minus.position.set(-0.62, 2.3, -0.55); S.add(minus);
const SMOKERS = [0, 1, 2].map(i => { const p = makeOji(rng(30 + i), { shirt: ['#59606e', '#8a8f99', '#6b7a5a'][i] }); S.add(p); makeCig(p); return p; });
const smoke = makeSparkles(140, 0.35, 0xc8ccd4); S.add(smoke.points); smoke.init([[-0.7, 2.0, -2.0], [0.0, 2.0, -2.3], [0.7, 2.0, -2.0]], 0.5, 0.8);
const wallClock = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); let k = ''; m.userData.draw = (h, mi) => { const key = h + ':' + mi.toFixed(1); if (key === k) return; k = key; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 256); g.fillStyle = '#2a2e3a'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); const hand = (a, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); g.stroke(); }; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#2a2e3a'; g.fillRect(128 + Math.sin(a) * 96 - 4, 128 - Math.cos(a) * 96 - 4, 8, 8); } hand(((h % 12) + mi / 60) / 12 * Math.PI * 2, 56, 12, '#1a1d24'); hand(mi / 60 * Math.PI * 2, 86, 7, '#c8242c'); tex.needsUpdate = true; }; return m; })();
wallClock.position.set(3.2, 2.3, -3.28); S.add(wallClock);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.7 }); S.add(katamaru);
const hiruyasumi = label('吸うのは昼休みだけ', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.1 }); S.add(hiruyasumi);
const newRule = label('休憩の分は給料から', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 2.2 }); S.add(newRule);

// ---------- B：オフィス（x=60）：吸わない人たち ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat('#7d8798', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, 0); bfloor.renderOrder = -0.8; S.add(bfloor);
const bwall = box(16, 3.6, 0.2, mat('#e6e9ee')); bwall.position.set(BX, 1.8, -3.2); S.add(bwall);
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(BX - 4 + i * 4, 2.0, -3.08); S.add(w); }
const ISL = makeDeskIsland(3); ISL.position.set(BX, 0, -0.6); S.add(ISL);
const WK = ISL.userData.seats.map((s, i) => { const p = i % 2 ? makeSuit({ woman: true, jacket: ['#3a3f4e', '#5a4a6a', '#3a5a6a'][i % 3] }) : makeSuit({ jacket: ['#2e3442', '#3a4050', '#4a4a52'][i % 3], tie: ['#b23a3a', '#3a6ab2', '#5a8a4a'][i % 3] }); p.position.set(BX + s.x, 0, -0.6 + s.z); p.rotation.y = s.ry; p.userData.ry0 = s.ry; S.add(p); return p; });
const TIMERS = WK.map(() => { const l = makeTimer(0.75); S.add(l); return l; });
const zurui = label('ずるい', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 1.0 }); S.add(zurui);
const DOWN = WK.map(() => { const l = label('給料 ↓', { w: 512, size: 100, color: '#fff', bg: 'rgba(200,36,44,.95)', sx: 0.85 }); S.add(l); return l; });
const zero = label('ひと息 0分', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 1.4 }); S.add(zero);

// ---------- C：4人に1人（x=120） ----------
const CX = 120;
const cfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -1); cfloor.renderOrder = -0.8; S.add(cfloor);
const FOUR = [0, 1, 2, 3].map(i => { const p = makeSuit({ jacket: ['#2e3442', '#3a4050', '#4a4a52', '#2e3a4a'][i], tie: '#5a6a8a', old: i === 2 }); p.position.set(CX - 2.1 + i * 1.4, 0, -1); S.add(p); return p; });
const cig4 = makeCig(FOUR[2]);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 32), new THREE.MeshBasicMaterial({ color: '#ff3a3a', depthWrite: false, transparent: true })); ring.rotation.x = -Math.PI / 2; ring.position.set(CX - 2.1 + 2 * 1.4, 0.05, -1); ring.renderOrder = -0.7; S.add(ring);
const smoke4 = makeSparkles(60, 0.3, 0xc8ccd4); S.add(smoke4.points); smoke4.init([[CX + 0.7, 2.1, -0.8]], 0.3, 0.9);

// ---------- D：1か月の合計（x=180） ----------
const DX = 180;
const dfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, -1); dfloor.renderOrder = -0.8; S.add(dfloor);
const BIGT = label('00時間', { w: 1024, size: 220, color: '#ff4a4a', bg: 'rgba(18,20,26,.96)', sx: 3.0 }); BIGT.position.set(DX, 2.6, -1); S.add(BIGT);
const calc = label('10分 × 4回 × 20日', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 2.6 }); calc.position.set(DX, 1.35, -1); S.add(calc);
const CIGS = []; for (let i = 0; i < 20; i++) { const c = box(0.08, 0.08, 0.5, mat('#f4f4f2')); c.rotation.y = Math.PI / 2; c.position.set(DX - 1.9 + (i % 10) * 0.42, 0.25 + Math.floor(i / 10) * 0.12, -0.2 + Math.floor(i / 10) * 0.0); const f = box(0.085, 0.085, 0.14, mat('#e0a050')); f.position.z = 0.2; c.add(f); S.add(c); CIGS.push(c); }

// ---------- E：トイレ・給湯室・化粧室（x=240） ----------
const EX = 240;
const efloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), mat('#dfe4ea', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -1); efloor.renderOrder = -0.8; S.add(efloor);
const ewall = box(20, 3.6, 0.2, mat('#f2f4f6')); ewall.position.set(EX, 1.8, -3.2); S.add(ewall);
for (const x of [-2.6, 2.6]) { const p = box(0.12, 2.6, 3.0, mat('#c9ced8')); p.position.set(EX + x, 1.3, -1.7); S.add(p); }
// トイレ（左）
const toilet = new THREE.Group(); { const b = box(0.5, 0.42, 0.6, mat('#ffffff')); b.position.y = 0.21; toilet.add(b); const tank = box(0.5, 0.5, 0.2, mat('#ffffff')); tank.position.set(0, 0.6, -0.32); toilet.add(tank); } toilet.position.set(EX - 4.2, 0, -2.4); S.add(toilet);
const T_P = makeMan({ shirt: '#4f6a8f' }); S.add(T_P); const phoneT = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(phoneT);
// 給湯室（中）
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.35, 14), mat('#c9ced8')); pot.position.set(EX - 0.3, 1.13, -2.7); S.add(pot);
const sink = box(2.2, 0.95, 0.7, mat('#d6dbe4')); sink.position.set(EX, 0.47, -2.75); S.add(sink);
const K_A = makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }); S.add(K_A); const K_B = makeMan({ shirt: '#a8c0a0', hair: '#1d1a19' }); S.add(K_B);
const cupA = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 10), mat('#ffffff')); S.add(cupA);
// 化粧直し（右）
const mirror = box(1.2, 1.0, 0.04, mat('#d8ecfb')); mirror.position.set(EX + 4.2, 1.7, -3.08); S.add(mirror);
const M_P = makeWoman({ shirt: '#f29bbb', hair: '#5a3a28' }); S.add(M_P); const compact = box(0.16, 0.03, 0.12, mat('#e8c060')); S.add(compact);
const SIGNS = [['トイレ', -4.2], ['給湯室', 0], ['化粧室', 4.2]].map(([s, x]) => { const l = label(s, { w: 512, size: 110, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 0.95 }); l.position.set(EX + x, 2.95, -2.9); S.add(l); return l; });
const ETIM = [makeTimer(0.8), makeTimer(0.8), makeTimer(0.8)]; ETIM.forEach(l => S.add(l));
const chat = label('でさ〜', { w: 384, size: 110, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 0.75 }); S.add(chat);

const ALL = [...SMOKERS, ...WK, ...FOUR, T_P, K_A, K_B, M_P];
// 最初の位置
SMOKERS.forEach((p, i) => p.position.set(-0.8 + i * 0.8, 0, -2.1 + (i === 1 ? -0.3 : 0)));
T_P.position.set(EX - 4.2, 0, -2.0); phoneT.position.set(EX - 4.2, 1.4, -1.7); cupA.position.set(EX - 0.45, 1.15, -1.35); compact.position.set(EX + 4.2, 1.6, -1.9); K_A.position.set(EX - 0.6, 0, -1.6); K_B.position.set(EX + 0.6, 0, -1.6); M_P.position.set(EX + 4.2, 0, -2.2);
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  SMOKERS.forEach((p, i) => { p.position.set(-0.8 + i * 0.8, 0, -2.1 + (i === 1 ? -0.3 : 0)); p.rotation.y = (i - 1) * -0.35; });
  WK.forEach(p => { p.rotation.y = p.userData.ry0; poseSit(p); });
  FOUR.forEach((p, i) => p.position.set(CX - 2.1 + i * 1.4, 0, -1));
  [katamaru, hiruyasumi, newRule, zurui, zero, chat].forEach(l => l.visible = false); TIMERS.forEach(l => l.visible = false); DOWN.forEach(l => l.visible = false); ETIM.forEach(l => l.visible = false);
  TIMER.visible = true; TIMER.userData.set('00:00'); minus.visible = true; smoke.set(0); smoke4.set(0); ring.visible = false; CIGS.forEach(c => c.visible = false);
  wallClock.userData.draw(10, 0); el.flash.style.opacity = 0;
}
function smokeAll(t) { SMOKERS.forEach((p, i) => smokePose(p, t, i)); smoke.set(((t * 0.25) % 1) * 0.98 + 0.01); }
function boothCam(d = 0) { look(lerp(0.3, 0.15, d), 2.0, lerp(4.5, 4.9, d), 0.0, 1.95, -1.4, 52); }
const TP = 0.45;
function shot0(t) { // 0秒＝サムネ：喫煙所のドアの上で、タイマーと 給料マイナス の数字が動き出す
  reset(); lift(0); smokeAll(t);
  const run = Math.max(0, t - TP) * 140; TIMER.userData.set(mmss(run));
  minus.visible = true; minus.userData.size(1.15 * (t > TP && t < TP + 0.25 ? 1.12 : 1));
  if (t > TP) { el.flash.style.opacity = t < TP + 0.12 ? 0.3 : 0; SMOKERS.forEach(p => p.userData.head.rotation.x = -0.35); }
  boothCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // 吸わない人たちの不満から。
  reset(); lift(110); TIMER.visible = false; minus.visible = false;
  WK.forEach((p, i) => { p.userData.head.rotation.y = (i % 2 ? -1 : 1) * 0.5 * clamp(t / 0.8); });
  look(BX + 0.5, 3.4, 5.2, BX, 1.1, -0.8, 52);
  return S;
}
function shot2(t) { // 1日に何回も抜けて同じ給料は、ずるい
  reset(); lift(60); TIMER.visible = false; minus.visible = false; smokeAll(t);
  const p = SMOKERS[1]; p.position.set(-0.2 + clamp(t / 3) * 3.2, 0, 0.6); p.rotation.y = Math.PI / 2; const s = Math.sin(t * 8) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s;
  zurui.position.set(1.4, 2.6, 0.3); pop(zurui, t, 1.8, 0.25, 1.0);
  boothCam(0.5);
  return S;
}
function shot3(t) { // ある日、タバコ休憩の時間は給料から引かれることになった
  reset(); lift(0); smokeAll(t); TIMER.userData.set(mmss(t * 60));
  newRule.position.set(0, 2.95, -0.5); pop(newRule, t, 0.6, 0.3, 1.9); boothSign.visible = false;
  boothCam(0.8);
  return S;
}
function shot4(t) { // タバコを吸う男性は24.8%。4人に1人
  reset(); lift(150); ring.visible = t > 0.8; smokePose(FOUR[2], t); smoke4.set(((t * 0.3) % 1) * 0.98 + 0.01);
  FOUR.forEach((p, i) => p.userData.head.rotation.y = Math.sin(t + i) * 0.2);
  look(CX, 2.6, 6.4, CX, 1.2, -1, 50);
  setTop('習慣的にタバコを吸う男性', '24.8%', fade(t, 0.3, 3.8, 0.25), GOLD);
  return S;
}
function shot5(t) { // 喫煙所の前で、ヤニカスたちが時計を見て固まる
  reset(); lift(60); TIMER.visible = false; minus.visible = false;
  SMOKERS.forEach((p, i) => { p.position.set(0.6 + i * 0.75, 0, 0.6 - i * 0.2); p.rotation.y = 0.9; p.userData.head.rotation.x = -0.25; smokePose(p, 0, i); });
  wallClock.userData.draw(10, 6 + t * 2);
  if (t > 1.2) { katamaru.position.set(1.4, 2.55, 0.4); pop(katamaru, t, 1.2, 0.25, 0.7); }
  look(0.8, 2.3, 5.0, 2.0, 1.7, -1.2, 52);
  return S;
}
function shot6(t) { // 1回10分を1日4回なら、1か月で約13時間（単純計算）
  reset(); lift(150); const n = Math.floor(clamp((t - 0.2) / 2.4) * 20); CIGS.forEach((c, i) => c.visible = i < n);
  const h = Math.min(13, Math.floor(clamp((t - 0.4) / 2.6) * 13.99)); BIGT.userData.set(`約${h}時間`);
  look(DX, 2.1, 5.4, DX, 1.8, -1, 50);
  setTop('1か月（単純計算）', '約13時間', fade(t, 2.9, 4.7, 0.25), RED);
  return S;
}
function shot7(t) { // ヤニカスは決めた。吸うのは昼休みだけ
  reset(); lift(60); TIMER.visible = false; minus.visible = false;
  SMOKERS.forEach((p, i) => { p.position.set(0.6 + i * 0.75, 0, 0.6 - i * 0.2); p.rotation.y = 0.9; p.userData.arms.forEach(a => a.rotation.x = 0.0); p.userData.head.rotation.x = 0.1; });
  wallClock.userData.draw(12, 0);
  hiruyasumi.position.set(1.6, 2.65, 0.0); pop(hiruyasumi, t, 0.8, 0.3, 1.9);
  look(1.4, 2.3, 5.8, 1.7, 1.7, -1.0, 52);
  return S;
}
function officeCam(u = 0) { look(BX + 0.5, lerp(3.4, 3.8, u), lerp(5.2, 5.8, u), BX, 1.1, -0.8, 52); }
function shot8(t) { // ところが次の日、
  reset(); lift(110); WK.forEach(p => p.userData.head.rotation.x = 0.15);
  officeCam(0);
  return S;
}
function shot9(t) { // 吸わない人の頭の上でもタイマーが動き出す
  reset(); lift(110);
  WK.forEach((p, i) => { const l = TIMERS[i]; l.position.set(p.position.x, 2.35, p.position.z); pop(l, t, 0.3 + i * 0.12, 0.2, 0.75); l.userData.set(mmss(Math.max(0, t - 0.3 - i * 0.12) * 40 + i * 7)); if (t > 1.0) p.userData.head.rotation.x = -0.3; });
  officeCam(clamp(t / 3.4));
  return S;
}
function boothsCam(x) { look(EX + x, 2.2, 3.4, EX + x, 1.4, -2.2, 52); }
function shot10(t) { // トイレでスマホ。
  reset(); lift(80); T_P.position.set(EX - 4.2, 0, -2.2); T_P.userData.arms.forEach(a => a.rotation.x = -1.1); T_P.userData.arms[0].rotation.z = -0.25; T_P.userData.arms[1].rotation.z = 0.25; T_P.userData.head.rotation.x = 0.45; phoneT.position.set(EX - 4.2, 1.28, -1.62); phoneT.rotation.x = -0.7; phoneT.scale.setScalar(1.6);
  ETIM[0].position.set(EX - 4.2, 2.35, -2.2); pop(ETIM[0], t, 0.5, 0.2, 0.8); ETIM[0].userData.set(mmss(480 + t * 60));
  boothsCam(-4.2); return S;
}
function shot11(t) { // 給湯室で雑談。
  reset(); lift(80); K_A.rotation.y = 0.8; K_B.rotation.y = -0.8; K_A.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 6) * 0.2; K_B.userData.head.rotation.x = Math.abs(Math.sin(t * 4)) * 0.15;
  cupA.position.set(EX - 0.45, 1.15, -1.35);
  chat.position.set(EX - 0.6, 2.3, -1.6); pop(chat, t, 0.2, 0.2, 0.75);
  ETIM[1].position.set(EX + 0.6, 2.4, -1.6); pop(ETIM[1], t, 0.5, 0.2, 0.8); ETIM[1].userData.set(mmss(600 + t * 60));
  boothsCam(0); return S;
}
function shot12(t) { // 長めの化粧直し。
  reset(); lift(80); M_P.rotation.y = 0; M_P.position.set(EX + 4.2, 0, -2.3); M_P.userData.arms[1].rotation.x = -2.0; M_P.userData.arms[0].rotation.x = -1.4; compact.position.set(EX + 3.95, 1.45, -1.85); compact.rotation.x = 1.2; compact.scale.setScalar(1.5);
  ETIM[2].position.set(EX + 4.2, 2.45, -2.3); pop(ETIM[2], t, 0.4, 0.2, 0.8); ETIM[2].userData.set(mmss(720 + t * 60));
  boothsCam(4.2); return S;
}
function shot13(t) { // ずるいと言っていた人の給料も、一緒に減っていく
  reset(); lift(110);
  WK.forEach((p, i) => { TIMERS[i].visible = true; TIMERS[i].userData.size(0.75); TIMERS[i].position.set(p.position.x, 2.35, p.position.z); TIMERS[i].userData.set(mmss(200 + t * 50 + i * 13));
    const d = DOWN[i]; d.position.set(p.position.x, 2.85, p.position.z); pop(d, t, 0.6 + i * 0.1, 0.2, 0.85); p.userData.head.rotation.x = 0.3; });
  officeCam(1); return S;
}
function shot14(t) { // 職場から、ひと息つく時間が全部消えた
  reset(); lift(110); WK.forEach(p => { p.userData.arms.forEach(a => a.rotation.x = -0.9); p.userData.head.rotation.x = 0.05; });
  zero.position.set(BX, 2.7, -0.6); pop(zero, t, 0.6, 0.3, 1.4);
  hemi.intensity = lerp(1.2, 0.85, clamp(t / 3));
  officeCam(0.5);
  const r = S; return r;
}
function shot15(t) { // 結果：タバコ休憩を責めた人の休憩も、ちゃんと休憩だった
  reset(); lift(110); hemi.intensity = 1.2;
  WK.forEach((p, i) => { TIMERS[i].visible = true; TIMERS[i].userData.size(0.75); TIMERS[i].position.set(p.position.x, 2.35, p.position.z); TIMERS[i].userData.set(mmss(300 + i * 13)); });
  const u = ease(clamp(t / 5.7)); look(BX + 0.5, lerp(3.8, 6.0, u), lerp(5.8, 7.6, u), BX, 1.0, -0.8, 52);
  setTop('結果', '休憩も休憩だった', fade(t, 0.3, 5.6, 0.25), GOLD);
  return S;
}
function shot16(t) { // 誰かのサボりを数えると、自分のサボりも数えられる
  reset(); lift(110); const p = WK[0], q = WK[1];
  p.userData.arms[1].rotation.x = -1.5; p.rotation.y = p.userData.ry0 + 0.6;
  TIMERS[1].visible = true; TIMERS[1].userData.size(0.75); TIMERS[1].position.set(q.position.x, 2.35, q.position.z); TIMERS[1].userData.set(mmss(420 + t * 40));
  TIMERS[0].position.set(p.position.x, 2.35, p.position.z); pop(TIMERS[0], t, 1.8, 0.2, 0.75); TIMERS[0].userData.set(mmss(Math.max(0, t - 1.8) * 40));
  if (t > 1.8) p.userData.head.rotation.x = -0.3;
  officeCam(1);
  return S;
}
function shot17(t) { // 質問。最後は冒頭と同じ構図
  reset(); lift(0); smokeAll(t); TIMER.userData.set(mmss(372 + t * 140)); SMOKERS.forEach(p => p.userData.head.rotation.x = -0.35);
  boothCam(0);
  return S;
}

const SUBS = [
  [3.0, 5.2, '吸わない人たちの<br>不満から。'],
  [5.3, 9.2, '1日に何回も抜けて<br>同じ給料は、ずるい。'],
  [9.3, 13.2, 'ある日、タバコ休憩の時間は<br>給料から引かれることになった。'],
  [13.3, 17.2, 'タバコを吸う男性は<br>24.8%。4人に1人。'],
  [17.3, 20.8, '喫煙所の前で、ヤニカスたちが<br>時計を見て固まる。'],
  [20.9, 25.6, '1回10分を1日4回なら、<br>1か月で約13時間（単純計算）。'],
  [25.7, 28.9, 'ヤニカスは決めた。<br>吸うのは昼休みだけ。'],
  [29.0, 30.9, 'ところが次の日、'],
  [31.0, 34.4, '吸わない人の頭の上でも<br>タイマーが動き出す。'],
  [34.5, 36.0, 'トイレでスマホ。'],
  [36.1, 37.6, '給湯室で雑談。'],
  [37.7, 39.4, '長めの化粧直し。'],
  [39.5, 43.2, 'ずるいと言っていた人の<br>給料も、一緒に減っていく。'],
  [43.3, 46.6, '職場から、ひと息つく<br>時間が全部消えた。'],
  [46.7, 52.4, '結果：タバコ休憩を責めた人の<br>休憩も、ちゃんと休憩だった。'],
  [52.5, 56.4, '誰かのサボりを数えると、<br>自分のサボりも数えられる。'],
  [56.5, 61.3, 'タバコ休憩、<br>ずるいと思う？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.3, f: shot1 }, { a: 5.3, b: 9.3, f: shot2 }, { a: 9.3, b: 13.3, f: shot3 }, { a: 13.3, b: 17.3, f: shot4 },
  { a: 17.3, b: 20.9, f: shot5 }, { a: 20.9, b: 25.7, f: shot6 }, { a: 25.7, b: 29.0, f: shot7 }, { a: 29.0, b: 31.0, f: shot8 },
  { a: 31.0, b: 34.5, f: shot9 }, { a: 34.5, b: 36.1, f: shot10 }, { a: 36.1, b: 37.7, f: shot11 }, { a: 37.7, b: 39.5, f: shot12 },
  { a: 39.5, b: 43.3, f: shot13 }, { a: 43.3, b: 46.7, f: shot14 }, { a: 46.7, b: 52.5, f: shot15 }, { a: 52.5, b: 56.5, f: shot16 },
  { a: 56.5, b: 61.6, f: shot17 }, { a: 61.6, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0646',
    v2: true,
    hookLine: '喫煙所のドアの上で、タイマーと 給料マイナス が動き出す。',
    series: '大人の本音',
    hookType: 'H1',
    cat: '社会・仕事',
    title: 'もしもタバコ休憩の分だけ給料が引かれたら？',
    titleHtml: 'もしもタバコ休憩の<br>分だけ給料が<br>引かれたら？',
    mood: 'tension', seed: 646, hits: [0.45, 46.7, 52.5], risers: [29.0], impacts: [10.0, 13.8, 23.5, 31.4, 34.6, 36.2, 37.8, 46.9],
    sfx: [[0.45, 'alarm'], [7.0, 'whoosh'], [10.0, 'poof'], [18.6, 'meter', 0.5], [21.2, 'whoosh'], [26.5, 'bubble'], [31.4, 'alarm'], [40.1, 'poof'], [44.0, 'meter', 0.4], [54.3, 'alarm']],
    narr: { '24.8%': 'にじゅうよんてんはちパーセント', '4人に1人': 'よにんにひとり', '1回10分': 'いっかいじゅっぷん', '1日4回': 'いちにちよんかい', '1か月': 'いっかげつ', '約13時間': 'やくじゅうさんじかん', '1日に何回も': 'いちにちになんかいも', 'ヤニカス': 'ヤニカス', '喫煙所': 'きつえんじょ', '給湯室': 'きゅうとうしつ', '化粧直し': 'けしょうなおし', '結果：': '結果、', 'ひと息': 'ひといき' },
    ask: 'タバコ休憩、ずるいと思う？',
    caption: 'もしもタバコ休憩の分だけ給料が引かれたら？\n\n吸わない人たちの不満から。1日に何回も抜けて同じ給料は、ずるい。\nある日、タバコ休憩の時間は給料から引かれることになった。\nタバコを吸う男性は24.8%。4人に1人。\n喫煙所の前で、ヤニカスたちが時計を見て固まる。1回10分を1日4回なら、1か月で約13時間（単純計算）。\nヤニカスは決めた。吸うのは昼休みだけ。\nところが次の日、吸わない人の頭の上でもタイマーが動き出す。\nトイレでスマホ。給湯室で雑談。長めの化粧直し。\nずるいと言っていた人の給料も、一緒に減っていく。職場から、ひと息つく時間が全部消えた。\n\n結果：タバコ休憩を責めた人の休憩も、ちゃんと休憩だった。\n誰かのサボりを数えると、自分のサボりも数えられる。\n\nタバコ休憩、ずるいと思う？ コメントで教えて。\n\n※風刺ネタです。約13時間は 10分×4回×20日 の単純計算\n出典：厚生労働省「令和4年 国民健康・栄養調査」（習慣的に喫煙している者 男性24.8%・女性6.2%）',
    hashtags: ['もしもラボ', 'もしも', 'タバコ休憩', '喫煙所', '職場あるある'],
    endStats: [['習慣的にタバコを吸う男性', '24.8%', '2022年'], ['同じ調査の女性', '6.2%', '2022年'], ['1回10分×1日4回×20日', '約13時間', '単純計算']],
    sources: '出典：厚生労働省「令和4年 国民健康・栄養調査」',
  },
});
