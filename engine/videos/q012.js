import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #012 ストレンジャー・シングス 未知の世界（ドラマ・アメリカ・シーズン1〜5。Netflixで見放題、justwatch.com/jp/テレビ番組/stranger-things で2026/11/2確認。Filmarks シーズン1 4.3 filmarks.com/dramas/389/1303）
// 設定（シーズン1の始まりだけ）：1980年代、アメリカの小さな町。ゲーム好きの中学生4人組のひとりが姿を消す。残る3人が捜しはじめ、少年の母親と町の保安官も行方を追う。
//       町には秘密の研究所があり、ひそかに実験が行われている。突然現れた少女には特別な力がある（Netflix の作品紹介・シネマトゥデイの作品ページ）
// 怪物の姿・少女の見た目・電飾の壁・自転車の並走・ロゴの赤い文字など、作品の映像や有名な場面の構図は使わない。人が傷つく描写は出さない

const S = quizStage({ bg: '#26324a', floor: '#2c3a2e', fogNear: 14, fogFar: 46 });
const qs = S.scene;
const R = rng(1212);
const BOY = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#d9a57c', '#f5d3b5'][i], hair: ['#6b4a33', '#1d1a19', '#2c2421', '#8a5a3a'][i], shirt: ['#3f6b8f', '#a8463a', '#5a7a4a', '#c79a3a'][i], pants: ['#3b3f4a', '#2b3346', '#4a4038', '#2f3540'][i], scale: 0.82 });
const TREE_M = mat('#1f3a2a'), TRUNK_M = mat('#3a2a20');
function tree(x, z, h = 4) { const g = new THREE.Group(); const t = box(0.3, 1.2, 0.3, TRUNK_M); t.position.y = 0.6; g.add(t); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2 - k * 0.28, 1.6, 8), TREE_M); c.position.y = 1.4 + k * 0.85; c.castShadow = true; g.add(c); } g.scale.setScalar(h / 4); g.position.set(x, 0, z); qs.add(g); return g; }
function forest(cx, n, spread = 14, clear = 3) { for (let i = 0; i < n; i++) { const x = cx + (R() - 0.5) * spread * 2, z = -2 - R() * 14; if (Math.abs(x - cx) < clear && z > -6) continue; tree(x, z, 3.2 + R() * 2.4); } }
function flashlight() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), mat('#2a2a2a')); b.rotation.z = Math.PI / 2; g.add(b); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.1, 12), mat('#c8c8c8')); h.rotation.z = Math.PI / 2; h.position.x = 0.19; g.add(h); return g; }

// ---------- 1. 夜の道（x=0）。少年がひとり。0秒目がサムネ ----------
{ const road = box(5, 0.04, 60, mat('#3a3d44')); road.position.set(0, 0.02, -10); qs.add(road);
  for (let i = 0; i < 12; i++) { const l = box(0.14, 0.05, 1.2, mat('#d8c060')); l.position.set(0, 0.04, 8 - i * 3); qs.add(l); } }
for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1; tree(side * (3.6 + R() * 6), 6 - i * 1.6 - R(), 3.4 + R() * 2.6); }
const pole = box(0.14, 4.4, 0.14, mat('#4a4a50')); pole.position.set(2.9, 2.2, -1.5); qs.add(pole);
const arm = box(1.2, 0.1, 0.1, mat('#4a4a50')); arm.position.set(2.4, 4.35, -1.5); qs.add(arm);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); bulb.position.set(1.85, 4.2, -1.5); qs.add(bulb);
const LAMP = new THREE.SpotLight(0xffd890, 0, 14, 0.62, 0.45, 0.8); LAMP.position.set(1.85, 4.2, -1.5); LAMP.target.position.set(1.0, 0, -1.2); LAMP.castShadow = true; qs.add(LAMP); qs.add(LAMP.target);
const boy = makePerson(BOY(0)); boy.position.set(0.9, 0, -1.2); boy.rotation.y = 0.2; qs.add(boy);
const FL0 = flashlight(); FL0.position.set(0.9, 0.06, -0.8); FL0.rotation.y = 0.7; qs.add(FL0);
const BEAM0 = new THREE.SpotLight(0xfff2c8, 0, 8, 0.35, 0.6, 1.2); qs.add(BEAM0); qs.add(BEAM0.target);
const tMissing = tag('行方不明', { size: 84, bg: '#e2483c' }); tMissing.position.set(0.9, 2.15, -1.0); qs.add(tMissing);

// ---------- 2. 森を捜す3人（x=30） ----------
forest(30, 40, 12, 3.5);
const SEEK = [1, 2, 3].map((k, i) => { const p = makePerson(BOY(k)); p.position.set(29 + i * 1.0, 0, 1.0 - (i % 2) * 0.5); qs.add(p); const f = flashlight(); f.rotation.y = -Math.PI / 2; f.position.set(0.18, 0.75, 0.3); p.userData.arms[1].add(f); f.position.set(0, -0.62, 0.12); const sp = new THREE.SpotLight(0xfff2c8, 0, 10, 0.32, 0.6, 1.1); qs.add(sp); qs.add(sp.target); p.userData.beam = sp; return p; });
const tThree = tag('仲間3人', { size: 80, bg: '#e6b450', color: '#14161c' }); tThree.position.set(30, 2.4, 0.6); qs.add(tThree);

// ---------- 3. 母親と保安官（x=60） ----------
const HOUSE = new THREE.Group(); HOUSE.position.set(60, 0, -3.5); qs.add(HOUSE);
{ const w = box(6, 3, 4, mat('#8a7a5a')); w.position.y = 1.5; HOUSE.add(w);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), mat('#4a3a34')); roof.position.y = 3.9; roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7; HOUSE.add(roof);
  for (const x of [-1.8, 1.8]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), new THREE.MeshBasicMaterial({ color: '#ffd890' })); wn.position.set(x, 1.8, 2.01); HOUSE.add(wn); }
  const door = box(0.9, 1.9, 0.06, mat('#5a3a2a')); door.position.set(0, 0.95, 2.02); HOUSE.add(door);
  const porch = box(3.2, 0.2, 1.4, mat('#6a5a44')); porch.position.set(0, 0.1, 2.7); HOUSE.add(porch); }
const PORCH = new THREE.PointLight(0xffd890, 6, 7, 1.2); PORCH.position.set(60, 2.6, 0); qs.add(PORCH);
const mom = makePerson({ skin: '#f1c9a5', hair: '#4a3020', shirt: '#6a7a5a', pants: '#3b3f4a', long: true }); mom.position.set(59.3, 0.2, -0.6); qs.add(mom);
const sheriff = makePerson({ skin: '#e8b98f', hair: '#4a3426', shirt: '#b49a6a', pants: '#4a4a3a' }); sheriff.position.set(61.0, 0, 0.6); sheriff.rotation.y = -0.6; qs.add(sheriff);
{ const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 20), mat('#7a6040')); brim.position.y = 0.52; sheriff.userData.head.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 16), mat('#7a6040')); crown.position.y = 0.63; sheriff.userData.head.add(crown); }
const CAR = new THREE.Group(); CAR.position.set(63.6, 0, 1.4); CAR.rotation.y = -0.25; qs.add(CAR);
{ const body = box(1.9, 0.7, 4.0, mat('#e8e2d2')); body.position.y = 0.55; CAR.add(body); const cab = box(1.7, 0.6, 2.0, mat('#3a4050')); cab.position.set(0, 1.18, -0.2); CAR.add(cab); const stripe = box(1.92, 0.18, 4.02, mat('#6a4a2a')); stripe.position.y = 0.6; CAR.add(stripe);
  for (const [x, z] of [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 16), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); CAR.add(w); }
  const lr = box(0.9, 0.14, 0.3, new THREE.MeshBasicMaterial({ color: '#e8b040' })); lr.position.set(0, 1.55, -0.2); CAR.add(lr); CAR.userData.lr = lr.material; }
const tMom = tag('母親', { size: 72, w: 260, bg: '#e6b450', color: '#14161c' }); tMom.position.set(59.3, 2.35, -0.6); qs.add(tMom);
const tSher = tag('保安官', { size: 72, w: 320, bg: '#e6b450', color: '#14161c' }); tSher.position.set(61.0, 2.35, 0.6); qs.add(tSher);

// ---------- 4. 町の秘密の研究所（x=90） ----------
const LAB = new THREE.Group(); LAB.position.set(90, 0, -7); qs.add(LAB);
const LAB_WIN = [];
{ const b = box(12, 4.2, 5, mat('#6a707a')); b.position.y = 2.1; LAB.add(b); const t = box(4, 2, 4, mat('#5a606a')); t.position.set(-2.5, 5.2, -0.5); LAB.add(t);
  for (let i = 0; i < 8; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: '#cfe0ee' })); w.position.set(-4.9 + i * 1.4, 2.8, 2.51); LAB.add(w); LAB_WIN.push(w.material); }
  const door = box(1.6, 2.2, 0.08, mat('#3a3e46')); door.position.set(0, 1.1, 2.53); LAB.add(door); }
for (let i = 0; i < 15; i++) { const p = box(0.08, 2.0, 0.08, mat('#8a8e96')); p.position.set(83 + i * 1.0, 1.0, -1.5); qs.add(p); }
for (const y of [0.5, 1.1, 1.7]) { const w = box(14, 0.03, 0.03, mat('#8a8e96')); w.position.set(90, y, -1.5); qs.add(w); }
const signT = canvasTex(512, 300, (g, w, h) => { g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c4302b'; g.fillRect(0, 0, w, 96); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('関係者以外', w / 2, 50); g.fillStyle = '#c4302b'; g.font = '900 104px "Noto Sans CJK JP", sans-serif'; g.fillText('立入禁止', w / 2, 200); });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(88.4, 2.35, -1.42); qs.add(sign); { const sp = box(0.08, 2.0, 0.08, mat('#8a8e96')); sp.position.set(88.4, 1.0, -1.48); qs.add(sp); }
const FLOOD = new THREE.SpotLight(0xdfe8ff, 0, 30, 0.5, 0.5, 1.0); FLOOD.position.set(95, 7, 2); FLOOD.target.position.set(90, 0, -3); qs.add(FLOOD); qs.add(FLOOD.target);
const tLab = tag('秘密の研究所', { size: 70, w: 500, bg: '#e2483c' }); tLab.position.set(89.4, 4.6, -1.5); qs.add(tLab);
const tExp = tag('ひそかに実験', { size: 70, w: 460, bg: '#14161c' }); tExp.position.set(89.4, 4.6, -1.5); qs.add(tExp);
forest(90, 24, 14, 9);

// ---------- 5. 突然現れた少女（x=120） ----------
forest(120, 34, 12, 4);
const girl = makePerson({ skin: '#f3d2b4', hair: '#5a3a26', shirt: '#7a8a9a', pants: '#5a6270', scale: 0.8 }); girl.position.set(120, 0, 0); qs.add(girl);
const FLOAT = [];
for (let i = 0; i < 7; i++) { const m = i % 3 === 0 ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + R() * 0.1), mat('#8a8a80')) : i % 3 === 1 ? box(0.26, 0.26, 0.26, mat('#a8463a')) : new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), mat('#d8d0c0')); const a = i / 7 * Math.PI * 2; m.userData.a = a; m.userData.r = 1.1 + (i % 2) * 0.35; m.userData.y = 0.1; qs.add(m); FLOAT.push(m); }
const GLOW = new THREE.PointLight(0xa8c8ff, 0, 6, 1.2); GLOW.position.set(120, 0.6, 1.2); qs.add(GLOW);
const tPower = tag('特別な力', { size: 80, bg: '#e2483c' }); tPower.position.set(120, 2.35, 0); qs.add(tPower);

// ---------- shots ----------
const ALL = [tMissing, tThree, tMom, tSher, tLab, tExp, tPower];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FLOAT.forEach(m => m.visible = false); LAMP.intensity = 0; BEAM0.intensity = 0; SEEK.forEach(p => p.userData.beam.intensity = 0); PORCH.intensity = 0; FLOOD.intensity = 0; GLOW.intensity = 0; S.hemi.intensity = 0.55; S.key.intensity = 0.25; }
const flick = (T) => (Math.sin(T * 31) * Math.sin(T * 17.3) > 0.25 ? 0.15 : 1);
function beam(sp, x, y, z, tx, tz, k = 30) { sp.position.set(x, y, z); sp.target.position.set(tx, 0, tz); sp.intensity = k; }

function shotRoad(t, T) { // 0〜9：夜の道に少年がひとり → 消える
  base(); S.aim(0, -2); lift(0);
  const gone = T > 6.15;
  const fl = T > 5.5 && T < 6.6 ? flick(T) : 1;
  LAMP.intensity = 90 * fl; bulb.material.color.set(fl < 0.5 ? '#3a3020' : '#ffe2a0');
  boy.visible = !gone; boy.rotation.y = 0.2 + Math.sin(T * 0.8) * 0.3;
  FL0.visible = gone; if (gone) beam(BEAM0, 0.9, 0.12, -0.8, 3.2, 1.4, 22);
  if (!gone) { beam(BEAM0, 0.9, 1.0, -1.0, 0.6, 2.5, 18); }
  tMissing.userData.pop((T - 6.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(-0.2, 0.1, u), lerp(1.9, 1.6, u), lerp(6.0, 4.8, u), 0.8, lerp(2.1, 1.5, u), -1.6, 54);
  return qs;
}
function shotSearch(t) { // 9〜17：仲間3人が懐中電灯で捜す
  base(); S.aim(30, 0); lift(80);
  SEEK.forEach((p, i) => { const z = lerp(1.6, -0.8, ease(t / 7)) - (i % 2) * 0.6; p.position.set(29 + i * 1.0, 0, z); p.rotation.y = Math.PI + Math.sin(t * 0.9 + i * 2) * 0.35; poseWalk(p, t * 6 + i, 0.8); p.userData.arms[1].rotation.x = -1.3; const a = p.rotation.y; beam(p.userData.beam, p.position.x, 1.0, p.position.z, p.position.x + Math.sin(a) * 6, p.position.z + Math.cos(a) * 6, 26); });
  tThree.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(30.5, 30.0, u), lerp(2.6, 2.3, u), lerp(7.6, 6.4, u), 30, 1.3, -1, 54);
  return qs;
}
function shotHome(t) { // 17〜25：母親と保安官も行方を追う
  base(); S.aim(60, -1); lift(60);
  PORCH.intensity = 8; CAR.userData.lr.color.set(Math.floor(t * 3) % 2 ? '#e8b040' : '#6a4a20');
  mom.rotation.y = Math.sin(t * 0.7) * 0.4;
  tMom.userData.pop((t - 4.2) / 0.35); tSher.userData.pop((t - 4.5) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.6, 60.4, u), lerp(2.6, 2.3, u), lerp(9.0, 7.6, u), 60.6, 1.4, -0.6, 54);
  return qs;
}
function shotLab(t) { // 25〜33：町の秘密の研究所
  base(); S.aim(90, -4); lift(260);
  FLOOD.intensity = 60;
  const red = t > 4.0;
  LAB_WIN.forEach((m, i) => m.color.set(red && (Math.floor(t * 4) + i) % 3 === 0 ? '#e2483c' : '#cfe0ee'));
  if (!red) tLab.userData.pop((t - 0.6) / 0.35); else tExp.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(87.0, 88.0, u), lerp(1.6, 2.2, u), lerp(6.0, 4.6, u), 90, lerp(3.4, 3.8, u), -6, 56);
  return qs;
}
function shotGirl(t) { // 33〜42：突然現れた少女。物が浮かぶ
  base(); S.aim(120, 0); lift(60);
  const k = easeOut(clamp((t - 4.4) / 1.4));
  FLOAT.forEach((m, i) => { m.visible = true; const a = m.userData.a + t * 0.6 * k; m.position.set(120 + Math.cos(a) * (m.userData.r + 0.25), lerp(m.userData.y, 1.3 + Math.sin(t * 2 + i) * 0.25, k), Math.sin(a) * 0.35 - 0.45); m.rotation.set(t * 0.8 + i, t * 0.6, 0); });
  GLOW.intensity = 4 * k;
  girl.userData.arms.forEach(a => a.rotation.x = lerp(0, -1.2, k));
  tPower.userData.pop((t - 5.0) / 0.35);
  const u = ease(t / 9);
  look(lerp(120.6, 120.3, u), lerp(1.8, 1.6, u), lerp(6.2, 4.8, u), 120, 1.1, 0, 54);
  return qs;
}
const DARK = '#05070e';
function roadNight(T, d) {
  S.hemi.intensity = lerp(0.55, 0.3, d); S.key.intensity = lerp(0.25, 0, d); S.darken(d * 0.85, DARK);
  const fl = flick(T); LAMP.intensity = 90 * fl; bulb.material.color.set(fl < 0.5 ? '#3a3020' : '#ffe2a0');
  boy.visible = false; FL0.visible = true; beam(BEAM0, 0.9, 0.12, -0.8, 3.2, 1.4, 26);
}
function seekOnRoad(T) { // 3人が道の奥から懐中電灯で近づいてくる
  SEEK.forEach((p, i) => { const z = -14 + (T - 42) * 0.55 - (i % 2) * 0.7; p.position.set(-1.0 + i * 1.0, 0, z); p.rotation.y = 0 + Math.sin(T * 0.9 + i * 2) * 0.3; poseWalk(p, T * 6 + i, 0.8); p.userData.arms[1].rotation.x = -1.3; const a = p.rotation.y; beam(p.userData.beam, p.position.x, 1.0, p.position.z, p.position.x + Math.sin(a) * 6, p.position.z + Math.cos(a) * 6, 30); });
}
function shotTwist(t, T) { // 42〜49：落ちた懐中電灯。街灯が点滅する
  base(); S.aim(0, -2); lift(0);
  roadNight(T, ease(t / 1.3)); seekOnRoad(T);
  const k = ease(t / 7);
  look(lerp(0.0, 0.3, k), lerp(0.9, 2.6, k), lerp(1.8, 6.4, k), lerp(1.0, 0.6, k), lerp(0.2, 1.0, k), lerp(-1.0, -4.0, k), 54);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：このドラマ、わかった？
  base(); S.aim(0, -2); lift(0);
  roadNight(T, 1); seekOnRoad(T);
  const k = ease(t / 7);
  look(lerp(0.3, 0.6, k), lerp(2.6, 3.6, k), lerp(6.4, 8.4, k), 0.6, lerp(1.0, 1.4, k), lerp(-4.0, -5.0, k), 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotRoad(t, T) },
  { a: 9, b: 17, f: shotSearch },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotLab },
  { a: 33, b: 42, f: shotGirl },
  { a: 42, b: 49, f: (t, T) => shotTwist(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '1980年代、<br>アメリカの小さな町。'],
  [5.6, 9.0, 'ひとりの少年が、<br>突然姿を消した。'],
  [9.2, 13.2, 'ゲーム好きの<br>仲間3人は、'],
  [13.2, 17.0, '自分たちで<br>捜しはじめる。'],
  [17.2, 21.0, '少年の母親と、<br>町の保安官も'],
  [21.0, 25.0, '必死に<br>行方を追う。'],
  [25.2, 29.0, '町には、<br>秘密の研究所。'],
  [29.0, 33.0, 'そこでは、ひそかに<br>実験が行われていた。'],
  [33.2, 37.4, 'そして、突然現れた<br>不思議な少女。'],
  [37.4, 41.8, '彼女には、<br>特別な力があった。'],
  [42.2, 45.4, '少年は、<br>どこへ消えたのか。'],
  [45.4, 49.0, '小さな町に<br>隠された秘密とは。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ストレンジャー・シングス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotSearch || f === shotHome || f === shotGirl,
  meta: {
    id: 'q012', v2: true, answer: 'ストレンジャー・シングス 未知の世界',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 1212,
    hits: [6.2, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 6.2, 37.4, 56.4],
    sfx: [[0.2, 'whoosh'], [6.1, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.1, 'alarm'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '1980年代': 'せんきゅうひゃくはちじゅうねんだい', '少年': 'しょうねん', '突然': 'とつぜん', '姿': 'すがた', '仲間3人': 'なかまさんにん', '捜し': 'さがし', '母親': 'ははおや', '保安官': 'ほあんかん', '必死': 'ひっし', '行方': 'ゆくえ', '研究所': 'けんきゅうじょ', '実験': 'じっけん', '行われて': 'おこなわれて', '現れた': 'あらわれた', '不思議': 'ふしぎ', '少女': 'しょうじょ', '彼女': 'かのじょ', '特別': 'とくべつ', '隠された': 'かくされた', '秘密': 'ひみつ' },
    caption: 'このドラマのタイトル、わかる？\n1980年代、アメリカの小さな町。ひとりの少年が突然姿を消した。ゲーム好きの仲間3人、母親、町の保安官が行方を追う。町には秘密の研究所。そして突然現れた、特別な力を持つ少女。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'SF'],
  },
});
applyQuizCards({ answer: 'ストレンジャー・<br>シングス<br><span style="font-size:64px">未知の世界</span>', info: 'Netflix｜アメリカ・シーズン1〜5', answerSize: 96 });
