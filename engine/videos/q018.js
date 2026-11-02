import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #018 ウェンズデー（ドラマ・アメリカ・シーズン1〜2。Netflixで見放題、justwatch.com/jp/テレビ番組/wednesday で2026/11/2確認。Filmarks シーズン1 4.2 filmarks.com/dramas/12292/16967）
// 設定（シーズン1の始まりだけ）：弟をいじめた男子生徒たちが泳ぐプールにピラニアを放ち、ウェンズデー・アダムスは退学に。両親が出会った母校で、
//       周囲になじめない「のけ者」たちが通う全寮制のネヴァーモア学園へ送られる。近くの町では連続殺人と超常現象が起き、彼女は独自に謎を追う。
//       手首から先だけの相棒「ハンド」がいる。監督・製作総指揮はティム・バートン（Filmarks の作品ページ・MOVIE WALKER PRESS の作品解説・THE HOLLYWOOD REPORTER JAPAN のキャスト紹介）
// 構成（ヒント6段）：1 学校のプールに何かが放たれる → 2 退学、両親の母校へ → 3 森の奥の古い全寮制の学校、なじめない子たち → 4 町で続く謎の事件を追う
//       → 5 アメリカのダークなミステリー、監督はティム・バートン → 6 決め手：笑わない少女と、手首だけの相棒（有名な一家の長女）
// 犯人・結末・怪物の正体には触れない。事件の場面・血・被害者は出さない。ピラニアは小さな黒い影だけ。作品の映像・俳優・衣装の再現・有名なダンスの場面・ロゴは使わない。
// 少女のおさげ髪（決め手）は6段目まで出さない（それまでは長い黒髪）。人・建物は汎用の3D

const S = quizStage({ bg: '#8a90a8', floor: '#4a4c58', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(1818);
const GIRL = { skin: '#f4dccb', hair: '#121214', shirt: '#1c1c22', pants: '#1c1c22', long: true, skirt: true, scale: 0.9 };

// ---------- 1. 学校のプール（x=0）。0秒目がサムネ ----------
const POOL = new THREE.Group(); POOL.position.set(0, 0, 0); qs.add(POOL);
{ const deck = box(16, 0.2, 14, mat('#d8d4c8')); deck.position.set(0, -0.06, -3); POOL.add(deck);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({ color: '#3aa0c8', transparent: true, opacity: 0.9 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.07, -5); POOL.add(water);
  for (let i = 0; i < 4; i++) { const ln = box(0.08, 0.06, 8, mat(i % 2 ? '#e2483c' : '#f4f1ea')); ln.position.set(-3 + i * 2, 0.1, -5); POOL.add(ln); }
  const wall = box(18, 6, 0.3, mat('#b8c4cc')); wall.position.set(0, 3, -10); POOL.add(wall);
  for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.2), new THREE.MeshBasicMaterial({ color: '#dfeaf2' })); w.position.set(-7.5 + i * 3, 3.6, -9.84); POOL.add(w); }
  const bleach = box(6, 0.5, 1.2, mat('#7a8a9a')); bleach.position.set(-5.5, 0.25, 0.8); POOL.add(bleach); }
const SWIM = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#f5d3b5'][i], hair: ['#6b4a33', '#c9a46a', '#2c2421'][i], shirt: ['#f1c9a5', '#e8b98f', '#f5d3b5'][i], pants: '#2f4a7a' }); p.position.set(-2 + i * 2, -1.05, -4.5 - (i % 2) * 1.2); qs.add(p); return p; });
const FISH = []; for (let i = 0; i < 9; i++) { const f = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#1a1e24')); b.scale.set(1.6, 0.8, 0.5); f.add(b); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), mat('#1a1e24')); tl.rotation.z = Math.PI / 2; tl.position.x = -0.3; f.add(tl); const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3), mat('#1a1e24')); fin.position.y = 0.12; f.add(fin); f.userData.a = R() * Math.PI * 2; f.userData.r = 0.6 + R() * 2.4; qs.add(f); FISH.push(f); }
const girl1 = makePerson(GIRL); girl1.position.set(2.4, 0, -0.4); girl1.rotation.y = Math.PI + 0.4; qs.add(girl1);
const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.36, 14), mat('#5a6a7a')); qs.add(bucket);

// ---------- 2. 鉄の門と両親（x=30） ----------
const GATE = new THREE.Group(); GATE.position.set(30, 0, -3); qs.add(GATE);
{ for (const x of [-2.6, 2.6]) { const p = box(0.8, 4.2, 0.8, mat('#4a4650')); p.position.set(x, 2.1, 0); GATE.add(p); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 4), mat('#3a3640')); cap.position.set(x, 4.65, 0); cap.rotation.y = Math.PI / 4; GATE.add(cap); }
  for (let i = 0; i < 15; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 6), mat('#1e1c22')); b.position.set(-2.1 + i * 0.3, 1.8 + Math.sin(i / 14 * Math.PI) * 0.3, 0); GATE.add(b); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), mat('#1e1c22')); sp.position.set(b.position.x, b.position.y + 1.9, 0); GATE.add(sp); }
  for (const y of [0.4, 2.8]) { const r = box(4.4, 0.08, 0.08, mat('#1e1c22')); r.position.set(0, y, 0); GATE.add(r); }
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const w = box(2, 2.2, 0.5, mat('#5a5660')); w.position.set(s * (4 + i * 2), 1.1, 0); GATE.add(w); } }
const girl2 = makePerson(GIRL); girl2.position.set(30, 0, -0.6); girl2.rotation.y = Math.PI; qs.add(girl2);
const suit = box(0.5, 0.65, 0.22, mat('#3a2a24')); suit.position.set(30.55, 0.33, -0.55); qs.add(suit);
const MOM = makePerson({ skin: '#f4dccb', hair: '#121214', shirt: '#121216', pants: '#121216', long: true, skirt: true }); MOM.position.set(31.6, 0, 0.8); MOM.rotation.y = Math.PI + 0.3; qs.add(MOM);
const DAD = makePerson({ skin: '#e8b98f', hair: '#1a1a1a', shirt: '#3a3640', pants: '#2a2830', scale: 0.92 }); DAD.position.set(28.5, 0, 0.8); DAD.rotation.y = Math.PI - 0.3; qs.add(DAD);
const tOut = tag('退学', { size: 84, w: 240, bg: '#e2483c' }); tOut.position.set(30, 2.4, -0.6); qs.add(tOut);
const tAlma = tag('両親の母校', { size: 72, w: 420, bg: '#e6b450', color: '#14161c' }); tAlma.position.set(30, 3.9, -2.8); qs.add(tAlma);

// ---------- 3・5. 森の奥の古い学校（x=60） ----------
const SCH = new THREE.Group(); SCH.position.set(60, 0, -16); qs.add(SCH);
const WINS = [];
{ const body = box(16, 7, 5, mat('#5a5462')); body.position.y = 3.5; SCH.add(body);
  for (const x of [-8.5, 8.5, -2.8]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, x === -2.8 ? 13 : 10, 8), mat('#4e4856')); t.position.set(x, (x === -2.8 ? 13 : 10) / 2, 1); SCH.add(t); const c = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.4, 8), mat('#2c2834')); c.position.set(x, (x === -2.8 ? 13 : 10) + 1.7, 1); SCH.add(c); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3, 4), mat('#2c2834')); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.35; roof.position.y = 8.5; SCH.add(roof);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshBasicMaterial({ color: '#ffcf70' })); w.position.set(-6 + i * 2, 2.2 + r * 2.8, 2.52); SCH.add(w); WINS.push(w); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), new THREE.MeshBasicMaterial({ color: '#2a1a14' })); door.position.set(0, 1.4, 2.53); SCH.add(door); }
const TREE_M = mat('#22302a'), TRUNK_M = mat('#2a2220');
function tree(x, z, h) { const g = new THREE.Group(); const t = box(0.3, 1.4, 0.3, TRUNK_M); t.position.y = 0.7; g.add(t); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.3 - k * 0.3, 1.8, 7), TREE_M); c.position.y = 1.6 + k * 0.95; g.add(c); } g.scale.setScalar(h / 4); g.position.set(x, 0, z); qs.add(g); }
for (let i = 0; i < 44; i++) { const x = 60 + (R() - 0.5) * 44, z = -4 - R() * 22; if (Math.abs(x - 60) < 10 && z < -10) continue; if (Math.abs(x - 60) < 3) continue; tree(x, z, 4 + R() * 3); }
const PATH = box(2.4, 0.03, 14, mat('#6a6a72')); PATH.position.set(60, 0.02, -7); qs.add(PATH);
const KIDS = [0, 1, 2, 3, 4].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#d9a57c', '#f5d3b5', '#e8b98f', '#c99a7a'][i], hair: ['#7a3a6a', '#e8e0d0', '#3a6a8a', '#c94f2a', '#1d1a19'][i], shirt: ['#3a3a5a', '#4a2a3a', '#2a4a4a', '#3a2a4a', '#4a4a2a'][i], pants: '#2a2a34', long: i % 2 === 1, skirt: i === 1 || i === 3 }); p.position.set(57.6 + i * 1.2, 0, -8.5 - (i % 2) * 0.8); p.rotation.y = Math.PI; qs.add(p); return p; });
const girl3 = makePerson(GIRL); girl3.position.set(60, 0, -1.5); girl3.rotation.y = Math.PI; qs.add(girl3);
const suit3 = box(0.5, 0.65, 0.22, mat('#3a2a24')); qs.add(suit3);
const tOdd = tag('なじめない子たち', { size: 64, w: 560, bg: '#e6b450', color: '#14161c' }); tOdd.position.set(60, 3.1, -8.8); qs.add(tOdd);
const tUS = tag('アメリカ', { size: 76, w: 340, bg: '#14161c' }); qs.add(tUS);
const tGenre = tag('ダークミステリー', { size: 68, w: 560, bg: '#7a3aa0' }); qs.add(tGenre);
const tDir = tag('監督 ティム・バートン', { size: 60, w: 620, bg: '#e6b450', color: '#14161c' }); qs.add(tDir);
const BOLT = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 9), new THREE.MeshBasicMaterial({ color: '#f4f0ff', transparent: true, opacity: 0 })); BOLT.position.set(66, 10, -24); BOLT.rotation.z = 0.2; BOLT.material.fog = false; qs.add(BOLT);

// ---------- 4. 夜の小さな町（x=90） ----------
const TOWN = new THREE.Group(); TOWN.position.set(90, 0, 0); qs.add(TOWN);
{ const road = box(5, 0.03, 30, mat('#3a3a40')); road.position.set(0, 0.02, -8); TOWN.add(road);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const h = 3.4 + R() * 2; const c = ['#6a5a50', '#5a6068', '#7a6a5a', '#5a5048'][i % 4]; const b = box(3.2, h, 3, mat(c)); b.position.set(s * 4.4, h / 2, 2 - i * 3.6); TOWN.add(b);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), mat('#3a3030')); roof.rotation.y = Math.PI / 4; roof.position.set(s * 4.4, h + 0.7, 2 - i * 3.6); TOWN.add(roof);
    for (let k = 0; k < 2; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), new THREE.MeshBasicMaterial({ color: R() < 0.5 ? '#ffd890' : '#3a3a48' })); w.position.set(s * (4.4 - 1.61), 1.4 + k * 1.4, 2 - i * 3.6); w.rotation.y = -s * Math.PI / 2; TOWN.add(w); } }
  for (const z of [-2, -9]) { const p = box(0.12, 3.6, 0.12, mat('#2a2a2e')); p.position.set(2.2, 1.8, z); TOWN.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); l.position.set(2.0, 3.6, z); TOWN.add(l); } }
const LAMPS = [-2, -9].map(z => { const L = new THREE.PointLight(0xffd890, 0, 9, 1.2); L.position.set(92, 3.4, z); qs.add(L); return L; });
// 黄色いテープと、地面の足あと（事件そのものは見せない）
const TAPE = new THREE.Group(); qs.add(TAPE);
{ const tt = canvasTex(512, 32, (g, w, h) => { g.fillStyle = '#f2c14e'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 16, 0); g.lineTo(i * 32, h); g.lineTo(i * 32 - 16, h); g.fill(); } });
  for (const [x, z, ry, len] of [[90, -6.5, 0, 4.4], [87.8, -8.7, Math.PI / 2, 4.4], [92.2, -8.7, Math.PI / 2, 4.4]]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.14), new THREE.MeshBasicMaterial({ map: tt, side: THREE.DoubleSide })); t.position.set(x, 0.9, z); t.rotation.y = ry; TAPE.add(t); }
  for (const [x, z] of [[87.8, -6.5], [92.2, -6.5], [87.8, -10.9], [92.2, -10.9]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 10), mat('#e2783c')); c.position.set(x, 0.45, z); TAPE.add(c); } }
const PRINTS = []; for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), new THREE.MeshBasicMaterial({ color: '#1a1a20' })); p.rotation.x = -Math.PI / 2; p.scale.set(0.8, 1.3, 1); p.position.set(89.2 + (i % 2) * 0.8 + i * 0.35, 0.04, -8 - i * 0.7); qs.add(p); PRINTS.push(p); }
const girl4 = makePerson(GIRL); girl4.position.set(89.0, 0, -4.4); girl4.rotation.y = Math.PI + 0.2; qs.add(girl4);
const tCase = tag('謎の事件', { size: 80, w: 340, bg: '#e2483c' }); tCase.position.set(90, 2.4, -8.6); qs.add(tCase);

// ---------- 6. 決め手：おさげの少女と、手首だけの相棒（x=120） ----------
const ROOM = new THREE.Group(); ROOM.position.set(120, 0, 0); qs.add(ROOM);
{ const back = box(10, 6, 0.2, mat('#3a3442')); back.position.set(0, 3, -2.4); ROOM.add(back);
  const win = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: '#b8b0d8' })); win.position.set(-1.8, 3.4, -2.28); ROOM.add(win);
  for (let i = 0; i < 6; i++) { const m = box(0.06, 2.2, 0.04, mat('#2a2632')); m.position.set(-1.8, 3.4, -2.25); m.rotation.z = i * Math.PI / 6; ROOM.add(m); }
  const desk = box(2.6, 0.8, 1.2, mat('#2a1e1a')); desk.position.set(1.6, 0.4, -1.4); ROOM.add(desk);
  const tw = box(0.7, 0.35, 0.5, mat('#1a1a1a')); tw.position.set(1.6, 0.98, -1.5); ROOM.add(tw);
  const fl = box(10, 0.04, 6, mat('#2e2a34')); fl.position.set(0, 0.02, 0.4); ROOM.add(fl); }
const girl6 = makePerson({ ...GIRL, long: false }); girl6.position.set(119.6, 0, -0.4); girl6.rotation.y = 0.15; qs.add(girl6);
{ const hm = mat('#121214');
  for (const s of [-1, 1]) { const b = box(0.11, 0.62, 0.11, hm); b.position.set(s * 0.25, -0.02, -0.02); girl6.userData.head.add(b); const tie = box(0.13, 0.05, 0.13, mat('#2a2a2a')); tie.position.set(s * 0.25, -0.26, -0.02); girl6.userData.head.add(tie); }
  const col = box(0.42, 0.07, 0.3, mat('#f4f1ea')); col.position.set(0, 1.47, 0.02); girl6.add(col);
  for (const s of [-1, 1]) { const c = box(0.14, 0.1, 0.02, mat('#f4f1ea')); c.position.set(s * 0.1, 1.42, 0.15); c.rotation.z = s * 0.4; girl6.add(c); } }
// 手首だけの相棒（5本の指で歩く）
const HAND = new THREE.Group(); HAND.scale.setScalar(1.5); qs.add(HAND);
const FING = [];
{ const sk = mat('#f0d4c0'); const palm = box(0.34, 0.09, 0.36, sk); palm.position.y = 0.32; HAND.add(palm);
  const cuff = box(0.3, 0.1, 0.12, mat('#d8c0ae')); cuff.position.set(0, 0.3, -0.22); HAND.add(cuff);
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const x = i === 4 ? 0.2 : -0.13 + i * 0.087; g.position.set(x, 0.3, i === 4 ? -0.02 : 0.16); const up = box(0.065, 0.065, 0.16, sk); up.position.set(0, 0.04, 0.07); g.add(up); const kn = new THREE.Group(); kn.position.set(0, 0.04, 0.15); g.add(kn); const lo = box(0.06, 0.3, 0.06, sk); lo.position.y = -0.15; kn.add(lo); const nail = box(0.045, 0.02, 0.03, mat('#f8e8e0')); nail.position.set(0, -0.29, 0.03); kn.add(nail); g.userData.kn = kn; if (i === 4) { g.rotation.y = 1.2; } HAND.add(g); FING.push(g); } }
const tPony = tag('笑わない少女', { size: 70, w: 480, bg: '#14161c' }); tPony.position.set(120.05, 2.45, -0.4); qs.add(tPony);
const tHand = tag('手首だけの相棒', { size: 66, w: 540, bg: '#e6b450', color: '#14161c', sx: 1.3 }); tHand.position.set(121.0, 1.3, 0.4); qs.add(tHand);

// ---------- shots ----------
const ALL = [tOut, tAlma, tOdd, tUS, tGenre, tDir, tCase, tPony, tHand];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LAMPS.forEach(L => L.intensity = 0); BOLT.material.opacity = 0; WINS.forEach(w => w.visible = true); qs.fog.near = 22; qs.fog.far = 70; }
function dusk(d) { S.darken(d * 0.6, '#1c1a2c'); S.hemi.intensity = lerp(1.25, 0.6, d); S.key.intensity = lerp(1.5, 0.35, d); }

function shotPool(t, T) { // 0〜9：学校のプールに、何かが放たれた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(40);
  S.hemi.intensity = 1.35;
  const pour = clamp((T - 0.0) / 1.2);
  bucket.position.set(2.0, 1.0, -1.1); bucket.rotation.x = -1.2 * pour; girl1.userData.arms.forEach(a => a.rotation.x = -1.3);
  FISH.forEach((f, i) => { const a = f.userData.a + T * (1.4 + (i % 3) * 0.3); f.position.set(Math.cos(a) * f.userData.r * 1.2, 0.03, -5 + Math.sin(a) * f.userData.r); f.rotation.y = -a; });
  SWIM.forEach((p, i) => { const panic = clamp((T - 2.2 - i * 0.3) / 0.6); p.position.y = -1.05 + Math.abs(Math.sin(T * 9 + i)) * 0.25 * panic; p.userData.arms.forEach((a, k) => a.rotation.x = -Math.PI * (0.6 + 0.35 * Math.sin(T * 10 + i + k * 2)) * panic); });
  const u = ease(T / 9);
  look(lerp(4.6, 4.0, u), lerp(3.6, 3.0, u), lerp(2.4, 3.4, u), lerp(0.6, 0.2, u), 0.4, -4.4, 56);
  return qs;
}
function shotGate(t) { // 9〜17：その結果、退学。送られたのは、両親の母校
  base(); S.aim(30, -2); lift(200);
  dusk(0.35);
  tOut.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tOut.visible = false;
  tAlma.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(30, lerp(1.9, 2.4, u), lerp(5.6, 7.0, u), 30, lerp(1.6, 2.2, u), -2, 54);
  return qs;
}
function shotSchool(t, T) { // 17〜25：森の奥の古い全寮制の学校。集まるのは、なじめない子たち
  base(); S.aim(60, -8); lift(60);
  dusk(0.7); qs.fog.near = 14; qs.fog.far = 60;
  girl3.position.set(60, 0, lerp(-1.0, -4.4, ease(t / 7))); poseWalk(girl3, t * 6, t < 7 ? 0.8 : 0); suit3.position.set(girl3.position.x + 0.4, 0.33, girl3.position.z + 0.05);
  KIDS.forEach((p, i) => { p.rotation.y = t > 3.6 ? lerp(Math.PI, 0, ease((t - 3.6 - i * 0.12) / 0.6)) : Math.PI; });
  tOdd.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.6, 60.2, u), lerp(1.8, 2.4, u), lerp(3.4, 2.0, u), 60, lerp(4.4, 3.4, u), -16, 56);
  return qs;
}
function shotTown(t) { // 25〜33：近くの町では、謎の事件が続く。彼女はひとり、真相を追う
  base(); S.aim(90, -6); lift(80);
  S.darken(0.82, '#0c0e1a'); S.hemi.intensity = 0.45; S.key.intensity = 0.15; LAMPS.forEach(L => L.intensity = 9);
  tCase.userData.pop((t - 0.8) / 0.35); if (t > 4.2) tCase.visible = false;
  PRINTS.forEach((p, i) => p.visible = t > 4.4 + i * 0.12);
  girl4.position.set(lerp(89.0, 89.4, ease((t - 4.2) / 3)), 0, lerp(-4.4, -6.0, ease((t - 4.2) / 3))); poseWalk(girl4, t * 6, t > 4.2 && t < 7.2 ? 0.7 : 0);
  girl4.userData.head.rotation.x = 0.35;
  const u = ease(t / 8);
  look(lerp(91.4, 90.8, u), lerp(2.6, 3.0, u), lerp(0.4, -0.6, u), 89.4, 0.8, -8.0, 56);
  return qs;
}
function schoolState() { KIDS.forEach(p => p.rotation.y = 0); girl3.position.set(60, 0, -4.4); poseWalk(girl3, 0, 0); suit3.position.set(60.4, 0.33, -4.35); }
function shotGenre(t, T) { // 33〜42：アメリカ発のダークなミステリー。監督はティム・バートン
  base(); schoolState(); S.aim(60, -12); lift(0);
  dusk(1); S.darken(0.85, '#141226');
  const fl = ((T * 0.7) % 1); BOLT.material.opacity = fl < 0.06 ? 1 : 0; if (fl < 0.06) S.hemi.intensity = 1.4;
  tUS.position.set(59.0, 9.0, 0); tGenre.position.set(60.9, 8.0, 0); tDir.position.set(60, 6.6, 0);
  tUS.userData.pop((t - 0.5) / 0.35); tGenre.userData.pop((t - 1.3) / 0.35); tDir.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(60, lerp(4.0, 5.0, u), lerp(10.0, 8.4, u), 60, lerp(8.0, 8.6, u), -16, 58);
  return qs;
}
function shotPartner(t, T) { // 42〜49：決め手。笑わない少女と、手首だけの相棒
  base(); S.aim(120, 0); lift(80);
  S.darken(0.5, '#1c1a2c'); S.hemi.intensity = 0.9; S.key.intensity = 0.8;
  const k = clamp(t / 3.4);
  HAND.position.set(lerp(122.6, 120.6, ease(k)), 0, lerp(0.8, 0.2, ease(k))); HAND.rotation.y = -Math.PI / 2 + 0.3;
  FING.forEach((g, i) => { g.rotation.x = -0.25 + Math.sin(T * 14 + i * 1.3) * 0.3 * (k < 1 ? 1 : 0.15); });
  HAND.position.y = k < 1 ? Math.abs(Math.sin(T * 14)) * 0.03 : 0;
  tPony.userData.pop((t - 0.4) / 0.35); tHand.userData.pop((t - 3.4) / 0.35);
  const u = ease(t / 7);
  look(lerp(120.5, 120.4, u), lerp(1.7, 1.6, u), lerp(5.6, 5.0, u), 120.3, 1.0, -0.4, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：このドラマ、わかった？（夜の学校）
  base(); schoolState(); S.aim(60, -12); lift(-170);
  dusk(1); S.darken(0.8, '#141226');
  const fl = ((T * 0.5) % 1); BOLT.material.opacity = fl < 0.05 ? 1 : 0;
  const u = ease(t / 7);
  look(60, lerp(3.0, 3.6, u), lerp(6.0, 4.0, u), 60, lerp(6.0, 7.0, u), -16, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotPool(t, T) },
  { a: 9, b: 17, f: shotGate },
  { a: 17, b: 25, f: (t, T) => shotSchool(t, T) },
  { a: 25, b: 33, f: shotTown },
  { a: 33, b: 42, f: (t, T) => shotGenre(t, T) },
  { a: 42, b: 49, f: (t, T) => shotPartner(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '学校のプールに、<br>何かが放たれた。'],
  [5.6, 9.0, 'やったのは、いじめられた<br>弟の姉。'],
  [9.2, 13.2, 'その結果、<br>彼女は退学に。'],
  [13.2, 17.0, '送られたのは、<br>両親が出会った母校。'],
  [17.2, 21.0, '森の奥にある、<br>古い全寮制の学校。'],
  [21.0, 25.0, '集まるのは、どこにも<br>なじめない子たち。'],
  [25.2, 29.0, '近くの町では、<br>謎の事件が続く。'],
  [29.0, 33.0, '彼女はひとり、<br>真相を追いはじめる。'],
  [33.2, 37.4, 'アメリカ発の、<br>ダークなミステリー。'],
  [37.4, 41.8, '監督は、<br>ティム・バートン。'],
  [42.2, 45.4, '笑わない少女と、<br>手首だけの相棒。'],
  [45.4, 49.0, 'あの有名な一家の、<br>長女が主人公。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ウェンズデー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q018', v2: true, answer: 'ウェンズデー',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 1818,
    hits: [5.6, 25.2, 56.4], risers: [52.0],
    impacts: [0.3, 9.6, 25.2, 37.4, 42.2, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'skitter'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '学校': 'がっこう', '放たれた': 'はなたれた', '弟の姉': 'おとうとのあね', '結果': 'けっか', '彼女': 'かのじょ', '退学': 'たいがく', '送られた': 'おくられた', '両親': 'りょうしん', '出会った': 'であった', '母校': 'ぼこう', '森の奥': 'もりのおく', '古い': 'ふるい', '全寮制': 'ぜんりょうせい', '集まる': 'あつまる', '近く': 'ちかく', '町': 'まち', '謎': 'なぞ', '事件': 'じけん', '続く': 'つづく', '真相': 'しんそう', '追い': 'おい', 'アメリカ発': 'アメリカはつ', '監督': 'かんとく', '笑わない': 'わらわない', '少女': 'しょうじょ', '手首': 'てくび', '相棒': 'あいぼう', '有名': 'ゆうめい', '一家': 'いっか', '長女': 'ちょうじょ', '主人公': 'しゅじんこう' },
    caption: 'このドラマのタイトル、わかる？\n学校のプールに、何かが放たれた。騒ぎを起こした少女は退学に。送られたのは、森の奥にある古い全寮制の学校だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'ウェンズデー', info: 'Netflix｜アメリカ・シーズン1〜2', answerSize: 116 });
