import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard, setTop } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #004 愛の不時着（ドラマ・韓国・全16話。Netflixで見放題、netflix.com/jp/title/81159258 で2026/11/1確認。Filmarks 4.5）
// 設定：韓国の財閥令嬢がパラグライダーの事故で北朝鮮に不時着し、堅物の将校の家で身分を隠して暮らす（Netflix 作品紹介・Filmarks 作品ページ）
// 作品の映像・衣装・ロゴ・有名な場面の構図は使わず、設定だけを汎用の3Dで見せる。軍服は作品と違う色、国旗や実在の記章は出さない

const S = quizStage({ bg: '#8fb3d6', floor: '#5f7d4a', fogNear: 30, fogFar: 95 });
const qs = S.scene;
const R = rng(404);

const HEIRESS = { skin: '#f5d3b5', hair: '#3a2a22', shirt: '#f2f2f0', pants: '#e8e4da', long: true };
const OFFICER = { skin: '#efcfae', hair: '#141414', shirt: '#4e5a3c', pants: '#4e5a3c' };
const SOLDIER = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f1c9a5', '#d9a57c'][i % 4], hair: '#1a1a1a', shirt: '#5b6646', pants: '#5b6646' });
const AUNT = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5'][i % 4], hair: ['#2c2421', '#1a1a22', '#4a3426', '#2c2421'][i % 4], shirt: ['#c94f6a', '#4f8fc9', '#d9a44a', '#7a5ca8'][i % 4], pants: ['#3b3f4a', '#5a4a3a', '#2b3346', '#4a3a4a'][i % 4], long: true, skirt: true });
function cap(p, color = '#3e4830') { const h = p.userData.head; const c = box(0.46, 0.12, 0.46, mat(color)); c.position.y = 0.53; h.add(c); const v = box(0.42, 0.03, 0.2, mat('#2a2f22')); v.position.set(0, 0.47, 0.28); h.add(v); }
function tree(x, z, s = 1, c = '#2f5a34') { const g = new THREE.Group(); const tr = box(0.22 * s, 1.2 * s, 0.22 * s, mat('#5a4030')); tr.position.y = 0.6 * s; g.add(tr); for (let k = 0; k < 3; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry((1.0 - k * 0.22) * s, 1.3 * s, 8), mat(c)); cn.position.y = (1.4 + k * 0.7) * s; cn.castShadow = true; g.add(cn); } g.position.set(x, 0, z); qs.add(g); return g; }

// パラグライダー（白いキャノピー＋ひも＋人）
function glider() {
  const g = new THREE.Group();
  // キャノピー：正面から見て弓なりの翼（白に金の帯）
  const W = new THREE.MeshLambertMaterial({ color: '#ffffff' }), Y = new THREE.MeshLambertMaterial({ color: '#e6b450' });
  for (let i = -3; i <= 3; i++) { const an = i * 0.24; const seg = box(0.72, 0.1, 0.95, Math.abs(i) === 1 ? Y : W); seg.position.set(Math.sin(an) * 2.3, 1.2 + Math.cos(an) * 2.0, 0); seg.rotation.z = -an; seg.castShadow = true; g.add(seg); }
  const lm = new THREE.LineBasicMaterial({ color: '#dddddd' });
  for (const i of [-3, -1.5, 1.5, 3]) { const an = i * 0.24; const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.sin(an) * 2.3, 1.2 + Math.cos(an) * 2.0 - 0.05, 0), new THREE.Vector3(0, 1.35, 0)]); g.add(new THREE.Line(geo, lm)); }
  const p = makePerson(HEIRESS); p.scale.setScalar(0.9); p.position.y = -0.2; p.userData.arms.forEach(a => { a.rotation.x = -2.6; }); g.add(p);
  g.userData.person = p;
  return g;
}

// ---------- 1. 空と竜巻（x=0） ----------
const SKY = new THREE.Group(); SKY.position.set(0, 0, 0); qs.add(SKY);
for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(2.2 + R() * 1.6, 3 + R() * 2.5, 6), mat(['#6f8a5a', '#5d7a4c', '#7c946a'][i % 3])); m.position.set(-14 + i * 3.6, 1.2, -9 - R() * 4); SKY.add(m); }
const TWIST = new THREE.Group(); TWIST.position.set(2.6, 0, -3.4); qs.add(TWIST);
const DEBRIS = [];
for (let k = 0; k < 7; k++) { const r = 0.5 + k * 0.42; const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.14 + k * 0.02, 6, 28), new THREE.MeshLambertMaterial({ color: '#4a505a', transparent: true, opacity: 0.72 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.6 + k * 0.95; TWIST.add(ring); }
for (let i = 0; i < 40; i++) { const d = box(0.12, 0.06, 0.12, mat(['#3d3f45', '#6a5a46', '#4a6a3a'][i % 3])); d.userData.a = R() * Math.PI * 2; d.userData.h = 0.4 + R() * 6.2; d.userData.r = 0.6 + d.userData.h * 0.36; TWIST.add(d); DEBRIS.push(d); }
const G1 = glider(); G1.position.set(-1.2, 2.6, -1); qs.add(G1);
const tStorm = tag('突然の竜巻', { size: 80, bg: '#e2483c' }); tStorm.position.set(1.0, 6.4, -2); qs.add(tStorm);

// ---------- 2. 森と境界線（x=22） ----------
const FOREST = []; for (let i = 0; i < 16; i++) FOREST.push(tree(15.5 + (i % 8) * 1.9 + R() * 0.6, -3.5 - Math.floor(i / 8) * 2.2 - R() * 0.6, 0.9 + R() * 0.5));
const bigTree = tree(22, -1.2, 1.6, '#2a5230');
const G2 = glider(); G2.position.set(22.6, 3.2, -1.1); G2.rotation.z = -0.5; G2.scale.setScalar(0.85); qs.add(G2);
const FENCE = new THREE.Group(); FENCE.position.set(22, 0, 2.6); qs.add(FENCE);
{ for (let i = 0; i < 10; i++) { const p = box(0.12, 1.6, 0.12, mat('#6c6f66')); p.position.set(-6.3 + i * 1.4, 0.8, 0); FENCE.add(p); }
  for (let k = 0; k < 4; k++) { const w = box(12.6, 0.025, 0.025, mat('#b9bcb4')); w.position.set(0, 0.35 + k * 0.38, 0); FENCE.add(w); }
  const signT = canvasTex(512, 192, (g, w, h) => { g.fillStyle = '#f2d24a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, 18); g.fillRect(0, h - 18, w, 18); g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('立入禁止', w / 2, h / 2 - 22); g.font = '800 40px "Noto Sans CJK JP", sans-serif'; g.fillText('軍事境界線', w / 2, h / 2 + 36); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(-1.4, 1.15, 0.08); FENCE.add(sign); }
const tLine = tag('境界線の向こう', { size: 76, bg: '#e6b450', color: '#14161c' }); tLine.position.set(22, 5.2, -1); qs.add(tLine);

// ---------- 3. 将校に見つかる（x=44） ----------
for (let i = 0; i < 10; i++) tree(38 + (i % 5) * 2.6 + R(), -3.6 - Math.floor(i / 5) * 2.4, 0.9 + R() * 0.4);
const her3 = makePerson(HEIRESS); her3.position.set(43.2, 0, 0.2); her3.rotation.y = 0.7; her3.userData.arms.forEach(a => { a.rotation.x = -2.9; }); qs.add(her3);
const off3 = makePerson(OFFICER); cap(off3); off3.position.set(45.0, 0, -0.4); off3.rotation.y = -1.1; off3.userData.arms[1].rotation.x = -1.4; qs.add(off3);
const SOL3 = [[46.2, -1.4], [46.6, 0.4], [45.8, 1.2]].map(([x, z], i) => { const p = makePerson(SOLDIER(i)); cap(p, '#4a5538'); p.position.set(x, 0, z); p.rotation.y = -1.3; qs.add(p); return p; });
const tOff = tag('北の軍の将校', { size: 76 }); tOff.position.set(44.6, 3.15, -0.2); qs.add(tOff);
const tHard = tag('しかも堅物', { size: 76, bg: '#e2483c' }); tHard.position.set(44.6, 3.15, -0.2); qs.add(tHard);
const tHer = tag('財閥令嬢', { size: 76, bg: '#e6b450', color: '#14161c' }); tHer.position.set(43.6, 2.55, 0.4); qs.add(tHer);

// ---------- 4. 将校の家（x=66） ----------
const HOUSE = new THREE.Group(); HOUSE.position.set(66, 0, -2.6); qs.add(HOUSE);
{ const wall = box(5.2, 2.2, 3.2, mat('#e8e0cf')); wall.position.y = 1.1; HOUSE.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.4, 4), mat('#5a4636')); roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.62); roof.position.y = 2.9; HOUSE.add(roof);
  const door = box(0.9, 1.6, 0.08, mat('#6a4a30')); door.position.set(0.6, 0.8, 1.62); HOUSE.add(door);
  const win = box(1.0, 0.7, 0.06, mat('#ffe8a8')); win.position.set(-1.4, 1.3, 1.62); HOUSE.add(win);
  const wood = box(1.4, 0.5, 0.6, mat('#7a5a3a')); wood.position.set(-2.2, 0.25, 2.2); HOUSE.add(wood); }
const her4 = makePerson({ ...HEIRESS, shirt: '#b98a6a', pants: '#5a4a3a' }); her4.position.set(65.2, 0, 0.6); her4.rotation.y = 0.4; qs.add(her4);
const off4 = makePerson(OFFICER); cap(off4); off4.position.set(67.2, 0, 0.4); off4.rotation.y = -0.5; qs.add(off4);
const tHide = tag('身分を隠して同居', { size: 74, bg: '#e6b450', color: '#14161c' }); tHide.position.set(66.2, 3.75, -0.6); qs.add(tHide);
const tHome = tag('帰る方法がない', { size: 74, bg: '#e2483c' }); tHome.position.set(66.2, 3.75, -0.6); qs.add(tHome);

// ---------- 5. 近所の奥さんたちと部下（x=88） ----------
for (let i = 0; i < 3; i++) { const h = box(3.2, 1.9, 2.4, mat(['#e3dccb', '#d9d2c0', '#ebe4d3'][i])); h.position.set(82 + i * 6, 0.95, -5); qs.add(h); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.0, 4), mat('#5a4636')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.7); rf.position.set(82 + i * 6, 2.4, -5); qs.add(rf); }
const AUNTS = [[86.2, -0.8], [86.9, 0.2], [85.9, 0.9], [87.3, -1.2]].map(([x, z], i) => { const p = makePerson(AUNT(i)); p.position.set(x, 0, z); p.rotation.y = 0.9 + (R() - 0.5) * 0.5; qs.add(p); return p; });
const SUBS4 = [[89.2, -0.6], [89.9, 0.4], [88.9, 1.0], [90.2, -1.2]].map(([x, z], i) => { const p = makePerson(SOLDIER(i + 1)); cap(p, '#4a5538'); p.position.set(x, 0, z); p.rotation.y = -0.9 + (R() - 0.5) * 0.4; qs.add(p); return p; });
const her5 = makePerson({ ...HEIRESS, shirt: '#b98a6a', pants: '#5a4a3a' }); her5.position.set(88, 0, -1.6); qs.add(her5);
const tAunt = tag('近所の奥さんたち', { size: 70 }); tAunt.position.set(86.7, 2.75, 0.2); qs.add(tAunt);
const tSub = tag('部下たち', { size: 70 }); tSub.position.set(89.5, 2.4, 0.4); qs.add(tSub);
const tBare = tag('バレたら終わり', { size: 78, bg: '#e2483c' }); tBare.position.set(88, 3.85, -1.6); qs.add(tBare);

// ---------- 6〜7. 夜、2人（x=110） ----------
const NIGHT = new THREE.Group(); NIGHT.position.set(110, 0, 0); qs.add(NIGHT);
const BULBS = [];
{ for (let i = 0; i < 14; i++) { const x = -3.2 + i * 0.5, y = 3.1 - Math.sin((i / 13) * Math.PI) * 0.45; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd98a' })); b.position.set(x, y, -0.6); NIGHT.add(b); BULBS.push(b); }
  const p1 = box(0.1, 3.3, 0.1, mat('#4a3a2a')); p1.position.set(-3.3, 1.65, -0.6); NIGHT.add(p1);
  const p2 = box(0.1, 3.3, 0.1, mat('#4a3a2a')); p2.position.set(3.4, 1.65, -0.6); NIGHT.add(p2);
  const warm = new THREE.PointLight(0xffc878, 0, 9, 1.4); warm.position.set(0, 2.6, 0.6); NIGHT.add(warm); NIGHT.userData.warm = warm; }
const her6 = makePerson(HEIRESS); her6.position.set(109.45, 0, 0.3); her6.rotation.y = 0.9; qs.add(her6);
const off6 = makePerson(OFFICER); cap(off6); off6.position.set(110.55, 0, 0.3); off6.rotation.y = -0.9; qs.add(off6);
const tWorld = tag('住む世界がちがう2人', { size: 72, bg: '#e6b450', color: '#14161c' }); tWorld.position.set(110, 2.75, 0.6); qs.add(tWorld);

// ---------- shots ----------
const ALLTAG = [tStorm, tLine, tOff, tHard, tHer, tHide, tHome, tAunt, tSub, tBare, tWorld];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); NIGHT.userData.warm.intensity = 0; }

function shotStorm(t, T) { // 0〜9：パラグライダーが竜巻にのまれる（0秒目がサムネ）
  base(); S.aim(1, -2); lift(170);
  S.hemi.intensity = 0.95; S.darken(0.42, '#2a3240');
  TWIST.rotation.y = T * 2.6;
  DEBRIS.forEach((d, i) => { const a = d.userData.a + T * (2.2 + (i % 5) * 0.3); d.position.set(Math.cos(a) * d.userData.r, d.userData.h, Math.sin(a) * d.userData.r); d.rotation.set(T * 3 + i, T * 2, 0); });
  const pull = easeOut(clamp(T / 9));
  G1.position.set(lerp(-1.6, 1.2, pull) + Math.sin(T * 5) * 0.12, lerp(0.9, 2.6, pull) + Math.sin(T * 3.1) * 0.25, lerp(-1, -2.2, pull));
  G1.rotation.z = Math.sin(T * 4.2) * 0.35 + pull * 0.6; G1.rotation.y = T * 0.6;
  tStorm.userData.pop((T - 5.4) / 0.3);
  const u = ease(T / 9);
  look(lerp(-1.6, -0.6, u), lerp(3.2, 4.0, u), lerp(11.6, 10.4, u), lerp(0.4, 1.4, u), lerp(2.6, 3.4, u), -2.2, 54);
  return qs;
}
function shotFence(t) { // 9〜17：森の木に引っかかる。そこは境界線の向こう
  base(); S.aim(22, 0); lift(220);
  S.hemi.intensity = 1.05;
  G2.rotation.z = -0.5 + Math.sin(t * 2) * 0.04;
  if (t > 4.0) tLine.userData.pop((t - 4.1) / 0.35);
  const k = ease((t - 3.0) / 2.0);
  look(lerp(24.6, 20.6, k), lerp(4.6, 2.6, k), lerp(6.0, 8.6, k), lerp(22.4, 21.4, k), lerp(3.4, 1.4, k), lerp(-1.1, 1.6, k), 52);
  return qs;
}
function shotFound(t) { // 17〜25：見つけたのは北の軍の将校。しかも堅物
  base(); S.aim(44, 0); lift(220);
  tHer.userData.pop((t - 0.4) / 0.35);
  tOff.userData.pop((t - 0.9) / 0.35);
  if (t > 4.2) { tOff.visible = false; tHard.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 8);
  look(lerp(43.8, 44.4, u), lerp(2.8, 2.6, u), lerp(8.2, 7.4, u), 44.2, 1.7, -0.2, 50);
  return qs;
}
function shotHouse(t) { // 25〜33：帰る方法がない。身分を隠して将校の家で暮らす
  base(); S.aim(66, -1); lift(220);
  tHome.userData.pop((t - 0.6) / 0.35);
  if (t > 4.0) { tHome.visible = false; tHide.userData.pop((t - 4.1) / 0.35); }
  const u = ease(t / 8);
  look(lerp(64.4, 65.6, u), lerp(3.4, 3.0, u), lerp(9.6, 8.6, u), 66.2, 1.8, -0.8, 52);
  return qs;
}
function shotVillage(t) { // 33〜42：近所の奥さんたちに部下たち。バレたら終わり
  base(); S.aim(88, -1); lift(220);
  AUNTS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.25; });
  tAunt.userData.pop((t - 0.6) / 0.35);
  tSub.userData.pop((t - 1.6) / 0.35);
  if (t > 4.6) tBare.userData.pop((t - 4.7) / 0.35);
  const u = ease(t / 9);
  look(lerp(87.4, 88.4, u), lerp(3.9, 3.6, u), lerp(12.2, 11.4, u), 88.0, 1.7, -0.4, 52);
  return qs;
}
const DARK = '#0a0d18';
function shotNight(t) { // 42〜49：夜、2人だけが灯りに照らされる
  base(); S.aim(110, 0); lift(190);
  const d = ease(t / 1.3);
  S.hemi.intensity = lerp(1.25, 0.18, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  NIGHT.userData.warm.intensity = lerp(0, 9, ease((t - 0.6) / 1.2));
  BULBS.forEach((b, i) => b.material.color.set(Math.floor(t * 3 + i) % 4 === 0 ? '#fff2c8' : '#ffd98a'));
  const k = ease(t / 6.5);
  look(lerp(110, 110, k), lerp(2.6, 2.0, k), lerp(7.6, 4.4, k), 110, lerp(1.7, 1.75, k), 0.3, lerp(50, 44, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマわかった？
  base(); S.aim(110, 0); lift(190);
  S.hemi.intensity = 0.18; S.key.intensity = 0; S.darken(1, DARK);
  NIGHT.userData.warm.intensity = 9;
  const k = ease(t / 7);
  look(110, lerp(2.0, 6.0, k), lerp(4.4, 9.6, k), 110, lerp(1.75, 1.4, k), 0, lerp(44, 50, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotStorm(t, T) },
  { a: 9, b: 17, f: shotFence },
  { a: 17, b: 25, f: shotFound },
  { a: 25, b: 33, f: shotHouse },
  { a: 33, b: 42, f: shotVillage },
  { a: 42, b: 49, f: shotNight },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '韓国の財閥令嬢が、<br>パラグライダーで飛んだ。'],
  [5.6, 9.0, 'そこへ、<br>突然の竜巻。'],
  [9.2, 13.2, '落ちたのは、<br>森の木の上。'],
  [13.2, 17.0, 'そこは、境界線の<br>向こう側だった。'],
  [17.2, 21.0, '見つけたのは、<br>北の軍の将校。'],
  [21.0, 25.0, 'しかも、<br>かなりの堅物。'],
  [25.2, 29.0, '韓国へ帰る方法は、<br>すぐには見つからない。'],
  [29.0, 33.0, '身分を隠して、<br>彼の家で暮らすことに。'],
  [33.2, 37.4, '近所の奥さんたちに、<br>部下たち。'],
  [37.4, 41.8, '正体がバレたら、<br>ただでは済まない。'],
  [42.2, 45.2, '住む世界が<br>ちがう2人。'],
  [45.2, 49.0, 'なのに、<br>目が離せなくなっていく。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>愛の不時着。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotFence || f === shotFound || f === shotHouse || f === shotVillage,
  meta: {
    id: 'q004', v2: true, answer: '愛の不時着',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 404,
    hits: [5.6, 17.2, 56.4], risers: [52.0],
    impacts: [0.3, 5.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '財閥令嬢': 'ざいばつれいじょう', '竜巻': 'たつまき', '将校': 'しょうこう', '堅物': 'かたぶつ', '境界線': 'きょうかいせん', '2人': 'ふたり', '正体': 'しょうたい', '身分': 'みぶん' },
    caption: 'このドラマのタイトル、わかる？\n韓国の財閥令嬢がパラグライダーで竜巻にのまれ、落ちた先は境界線の向こう側。見つけたのは北の軍の堅物な将校。身分を隠して、彼の家で暮らすことに。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', '恋愛ドラマ'],
  },
});
applyQuizCards({ answer: '愛の不時着', info: 'Netflix｜韓国・全16話' });
