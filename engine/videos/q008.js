import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #008 Lupin/ルパン（ドラマ・フランス。Netflixで見放題、justwatch.com/jp/テレビ番組/lupin で2026/11/1確認。Filmarks パート1 4.0）
// 設定：パリの美術館に管理人の姿で現れ、王妃の首飾りをねらう男。変装の名人。少年のころ父から怪盗紳士の本を贈られた。
//       父は裕福な雇い主の一家に宝石の首飾りを盗んだ罪を着せられた。その一家への報復に乗り出す
//       （Filmarks・JustWatch の作品紹介、France.fr のロケ地紹介、Woman&Home の作品紹介）
// 作品の映像・衣装・ロゴ・有名な場面の構図、実在の美術館の外観（ガラスのピラミッドなど）は使わない。シルクハットや片眼鏡のような怪盗の定番の姿も出さない

const S = quizStage({ bg: '#1c2030', floor: '#3a3430', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(808);

const CLEAN = { skin: '#7a5236', hair: '#141010', shirt: '#4a6a8a', pants: '#4a6a8a' };
const SUITM = { skin: '#7a5236', hair: '#141010', shirt: '#22242c', pants: '#22242c', tie: true };
const FATHER = { skin: '#6e4a30', hair: '#1a1410', shirt: '#e9e4da', pants: '#3a3a40' };
const SON = { skin: '#7a5236', hair: '#141010', shirt: '#d97a3a', pants: '#2b3346', scale: 0.62 };
const RICH = { skin: '#efcfae', hair: '#9a9a9a', shirt: '#3a2a3a', pants: '#2a2028', tie: true };
const COP = { skin: '#efcfae', hair: '#2c2421', shirt: '#24324f', pants: '#1c2232' };
function capOn(p, c = '#1c2232') { const h = p.userData.head; const k = box(0.44, 0.12, 0.44, mat(c)); k.position.y = 0.52; h.add(k); }
function mop(p) { const st = box(0.04, 1.5, 0.04, mat('#c9a26a')); st.position.set(0, -0.3, 0.12); st.rotation.x = 0.3; p.userData.arms[1].add(st); const hd = box(0.4, 0.08, 0.16, mat('#d8d8d8')); hd.position.set(0, -1.05, 0.34); p.userData.arms[1].add(hd); p.userData.arms[1].rotation.x = -0.35; }

// 宝石の首飾り（金の輪と石）
function necklace(s = 1) { const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3, emissive: '#3a2a08' }); const gem = new THREE.MeshStandardMaterial({ color: '#e8f4ff', metalness: 0.2, roughness: 0.05, emissive: '#6a8aaa' });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28 * s, 0.022 * s, 8, 40), gold); g.add(ring);
  for (let i = 0; i < 14; i++) { const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7; const d = new THREE.Mesh(new THREE.OctahedronGeometry((i === 6 || i === 7 ? 0.06 : 0.035) * s), gem); d.position.set(Math.cos(a + Math.PI) * 0.3 * s, Math.sin(a + Math.PI) * 0.3 * s, 0.01); g.add(d); }
  return g; }

// ---------- 1〜2. 夜の美術館（x=0） ----------
const GAL = new THREE.Group(); GAL.position.set(0, 0, 0); qs.add(GAL);
const SPARK = [];
{ const wall = mat('#5a4a40');
  const back = box(16, 6, 0.3, wall); back.position.set(0, 3, -4); GAL.add(back);
  for (const x of [-7.6, 7.6]) { const sw = box(0.3, 6, 10, wall); sw.position.set(x, 3, 0); GAL.add(sw); }
  const flT = canvasTex(512, 512, (g, w, h) => { const c = w / 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#6a5040' : '#7a6050'; g.fillRect(x * c, y * c, c, c); } });
  flT.wrapS = flT.wrapT = THREE.RepeatWrapping; flT.repeat.set(4, 3);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ map: flT })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.02; GAL.add(fl);
  // 額縁（中は抽象的な色面だけ）
  const PAL = [['#8a6a3a', '#3a5a6a'], ['#6a3a3a', '#d8b878'], ['#2a4a3a', '#c8a86a'], ['#4a3a6a', '#d89a6a']];
  [[-5, 2.8, 2.0, 2.6], [-2.2, 3.0, 1.4, 1.8], [2.4, 3.0, 1.6, 2.0], [5.2, 2.8, 2.2, 2.8]].forEach(([x, y, w, h], i) => { const pt = canvasTex(256, 320, (g, W, H) => { g.fillStyle = PAL[i][0]; g.fillRect(0, 0, W, H); g.fillStyle = PAL[i][1]; g.beginPath(); g.arc(W * 0.5, H * 0.45, W * 0.28, 0, Math.PI * 2); g.fill(); g.fillRect(0, H * 0.72, W, H * 0.28); }); const fr = box(w + 0.24, h + 0.24, 0.08, mat('#b08a3a')); fr.position.set(x, y, -3.8); GAL.add(fr); const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: pt })); pic.position.set(x, y, -3.75); GAL.add(pic); });
  // 展示ケース
  const ped = box(1.0, 1.1, 1.0, mat('#2a2a30')); ped.position.set(0, 0.55, -0.6); GAL.add(ped);
  const glass = box(0.96, 0.9, 0.96, new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, depthWrite: false })); glass.position.set(0, 1.56, -0.6); GAL.add(glass);
  const stand = box(0.5, 0.5, 0.06, mat('#3a1a2a')); stand.position.set(0, 1.36, -0.66); stand.rotation.x = -0.2; GAL.add(stand);
  const nk = necklace(0.9); nk.position.set(0, 1.5, -0.6); nk.rotation.x = -0.2; GAL.add(nk); GAL.userData.nk = nk;
  const caseL = new THREE.SpotLight(0xfff2d8, 0, 8, 0.35, 0.5, 1.2); caseL.position.set(0, 5.4, 0.6); caseL.target.position.set(0, 1.4, -0.6); GAL.add(caseL); GAL.add(caseL.target); GAL.userData.caseL = caseL;
  for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.userData.p = new THREE.Vector3((R() - 0.5) * 0.7, 1.3 + R() * 0.5, -0.6 + (R() - 0.5) * 0.2); GAL.add(s); SPARK.push(s); }
  const rope = box(3.2, 0.04, 0.04, mat('#a02a2a')); rope.position.set(0, 0.8, 0.6); GAL.add(rope);
  for (const x of [-1.6, 1.6]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.9, 10), mat('#b08a3a')); pole.position.set(x, 0.45, 0.6); GAL.add(pole); } }
const cleaner = makePerson(CLEAN); capOn(cleaner, '#3a5a7a'); mop(cleaner); cleaner.position.set(1.1, 0, 0.9); cleaner.rotation.y = -2.2; qs.add(cleaner);
const suited = makePerson(SUITM); suited.position.set(1.1, 0, 0.9); suited.rotation.y = -0.5; qs.add(suited);
const tNeck = tag('王妃の首飾り', { size: 76, bg: '#e6b450', color: '#14161c' }); tNeck.position.set(0, 2.55, -0.6); qs.add(tNeck);
const tCl = tag('清掃員？', { size: 80 }); tCl.position.set(1.1, 2.5, 0.9); qs.add(tCl);
const tMaster = tag('変装の名人', { size: 80, bg: '#e2483c' }); tMaster.position.set(1.1, 2.5, 0.9); qs.add(tMaster);
// 変装の早変わり用の煙
const PUFF = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshLambertMaterial({ color: '#d8d8e0', transparent: true, opacity: 0.8 })); m.userData.d = new THREE.Vector3((R() - 0.5) * 1.4, R() * 1.8, (R() - 0.5) * 1.0); qs.add(m); PUFF.push(m); }

// ---------- 3. 少年のころ、屋敷の書斎（x=24） ----------
const LIB = new THREE.Group(); LIB.position.set(24, 0, 0); qs.add(LIB);
{ const back = box(10, 4.6, 0.2, mat('#5a3a2a')); back.position.set(0, 2.3, -3); LIB.add(back);
  for (let k = 0; k < 4; k++) for (let i = 0; i < 26; i++) { const b = box(0.16, 0.55 + (i % 3) * 0.06, 0.3, mat(['#7a2a2a', '#2a4a6a', '#3a5a3a', '#8a6a2a', '#4a3a5a'][(i * 3 + k) % 5])); b.position.set(-4.2 + i * 0.33, 0.5 + k * 0.95, -2.75); LIB.add(b); }
  for (let k = 0; k < 4; k++) { const sh = box(9, 0.06, 0.4, mat('#3a2418')); sh.position.set(0, 0.2 + k * 0.95, -2.75); LIB.add(sh); }
  const lamp = new THREE.PointLight(0xffc878, 5, 7, 1.4); lamp.position.set(0, 2.8, 0.4); LIB.add(lamp); }
const dad3 = makePerson(FATHER); dad3.position.set(23.4, 0, 0.2); dad3.rotation.y = 0.6; dad3.userData.arms[1].rotation.x = -1.0; qs.add(dad3);
const son3 = makePerson(SON); son3.position.set(24.5, 0, 0.6); son3.rotation.y = -0.9; son3.userData.arms.forEach(a => { a.rotation.x = -0.9; }); qs.add(son3);
const BOOK = new THREE.Group(); qs.add(BOOK);
{ const cov = box(0.34, 0.46, 0.08, mat('#2a3a6a')); BOOK.add(cov); const band = box(0.35, 0.06, 0.085, mat('#e6b450')); band.position.y = 0.12; BOOK.add(band); }
const tGift = tag('父からの贈り物', { size: 70, bg: '#e6b450', color: '#14161c' }); tGift.position.set(24.0, 2.4, 0.3); qs.add(tGift);
const tThief = tag('怪盗紳士の物語', { size: 70 }); tThief.position.set(24.0, 2.4, 0.3); qs.add(tThief);

// ---------- 4. 無実の罪（x=48） ----------
const MAN = new THREE.Group(); MAN.position.set(48, 0, 0); qs.add(MAN);
{ const back = box(12, 5, 0.3, mat('#d8ccb4')); back.position.set(0, 2.5, -3.6); MAN.add(back);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.6, 14), mat('#efe6d4')); c.position.set(-4.4 + i * 2.2, 2.3, -3.2); c.castShadow = true; MAN.add(c); }
  const chand = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); chand.position.set(0, 4.2, -1); MAN.add(chand);
  const rug = box(6, 0.02, 3, mat('#7a2a2a')); rug.position.set(0, 0.03, -0.4); MAN.add(rug); }
const rich4 = makePerson(RICH); rich4.position.set(49.6, 0, -1.2); rich4.rotation.y = -0.8; rich4.userData.arms[0].rotation.x = -1.5; qs.add(rich4);
const dad4 = makePerson(FATHER); dad4.position.set(47.4, 0, 0.2); dad4.rotation.y = 0.5; qs.add(dad4);
const COPS4 = [[46.6, 0.0], [48.2, 0.6]].map(([x, z]) => { const p = makePerson(COP); capOn(p); p.position.set(x, 0, z); p.rotation.y = 0.4; qs.add(p); return p; });
const tRich = tag('裕福な雇い主', { size: 70 }); tRich.position.set(49.6, 2.5, -1.2); qs.add(tRich);
const tFalse = tag('無実の罪', { size: 84, bg: '#e2483c' }); tFalse.position.set(47.7, 2.45, 0.2); qs.add(tFalse);

// ---------- 5. 報復の計画（x=72） ----------
const PLAN = new THREE.Group(); PLAN.position.set(72, 0, 0); qs.add(PLAN);
const BOARD_T = canvasTex(1024, 640, (g, w, h) => {
  g.fillStyle = '#c8b090'; g.fillRect(0, 0, w, h);
  const cards = [[120, 90], [420, 70], [760, 110], [200, 380], [560, 360], [850, 420]];
  g.strokeStyle = '#c02a2a'; g.lineWidth = 6; g.beginPath(); cards.forEach(([x, y], i) => { if (i === 0) g.moveTo(x + 70, y + 90); else g.lineTo(x + 70, y + 90); }); g.lineTo(cards[0][0] + 70, cards[0][1] + 90); g.moveTo(cards[1][0] + 70, cards[1][1] + 90); g.lineTo(cards[4][0] + 70, cards[4][1] + 90); g.stroke();
  cards.forEach(([x, y], i) => { g.fillStyle = '#f7f1e2'; g.fillRect(x, y, 140, 180); g.fillStyle = '#9aa0aa'; g.beginPath(); g.arc(x + 70, y + 70, 36, 0, Math.PI * 2); g.fill(); g.fillRect(x + 30, y + 110, 80, 50); g.fillStyle = '#c02a2a'; g.beginPath(); g.arc(x + 70, y + 8, 10, 0, Math.PI * 2); g.fill(); if (i === 2) { g.strokeStyle = '#c02a2a'; g.lineWidth = 8; g.strokeRect(x - 10, y - 10, 160, 200); g.lineWidth = 6; } });
});
{ const back = box(10, 4.4, 0.2, mat('#3a3a40')); back.position.set(0, 2.2, -3); PLAN.add(back);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.5), new THREE.MeshLambertMaterial({ map: BOARD_T })); bd.position.set(0, 2.3, -2.88); PLAN.add(bd);
  const desk = box(3.0, 0.9, 1.2, mat('#4a3020')); desk.position.set(0, 0.45, -1.6); PLAN.add(desk);
  const lamp = new THREE.PointLight(0xffe0b0, 8, 8, 1.2); lamp.position.set(-0.6, 2.6, 1.6); PLAN.add(lamp); }
const man5 = makePerson(SUITM); man5.position.set(71.0, 0, 0.6); man5.rotation.y = 0.5; man5.userData.arms[0].rotation.x = -0.5; qs.add(man5);
const tRev = tag('報復のはじまり', { size: 68, w: 520, bg: '#e2483c' }); tRev.position.set(72.1, 2.5, 0.2); qs.add(tRev);

// ---------- 6〜7. 夜のパリの屋根（x=96） ----------
const ROOF = new THREE.Group(); ROOF.position.set(96, 0, 0); qs.add(ROOF);
const WINS = [];
{ for (let i = 0; i < 9; i++) { const h = 3 + (i % 3) * 0.6; const b = box(2.4, h, 2.4, mat(['#b8a890', '#a89880', '#c0b098'][i % 3])); b.position.set(-9 + i * 2.5, h / 2, -6 - (i % 2) * 1.5); ROOF.add(b); const rf = box(2.5, 0.9, 2.5, mat('#4a5a6a')); rf.position.set(-9 + i * 2.5, h + 0.45, -6 - (i % 2) * 1.5); ROOF.add(rf); for (let k = 0; k < 3; k++) { const w = box(0.4, 0.6, 0.05, new THREE.MeshBasicMaterial({ color: (i + k) % 3 ? '#2a3040' : '#ffd98a' })); w.position.set(-9.7 + i * 2.5 + k * 0.7, h - 1.0, -4.78 - (i % 2) * 1.5); ROOF.add(w); WINS.push(w); } }
  const deck = box(8, 0.3, 4, mat('#4a5a6a')); deck.position.set(0, 0.15, 0); ROOF.add(deck);
  const chim = box(0.5, 1.2, 0.5, mat('#8a6a5a')); chim.position.set(-1.8, 0.9, -0.8); ROOF.add(chim);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); moon.position.set(2.6, 7.0, -10); ROOF.add(moon);
  const rim = new THREE.PointLight(0xb8c8ff, 0, 8, 1.4); rim.position.set(1.6, 3.4, 1.6); ROOF.add(rim); ROOF.userData.rim = rim; }
const man6 = makePerson({ ...SUITM, shirt: '#2a2a30' }); man6.position.set(96.4, 0.3, 0.3); man6.rotation.y = -0.5; qs.add(man6);
const NK6 = necklace(0.5); NK6.position.set(96.7, 1.2, 0.6); qs.add(NK6);

// ---------- shots ----------
const ALLTAG = [tNeck, tCl, tMaster, tGift, tThief, tRich, tFalse, tRev];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); GAL.userData.caseL.intensity = 0; ROOF.userData.rim.intensity = 0; PUFF.forEach(m => m.visible = false); }
function galleryLight(T) { S.hemi.intensity = 0.45; S.key.intensity = 0.35; S.darken(0.55, '#0c0e16'); GAL.userData.caseL.intensity = 40; GAL.userData.nk.rotation.y = Math.sin(T * 0.8) * 0.25; SPARK.forEach((s, i) => { s.position.copy(s.userData.p); const tw = (Math.sin(T * 6 + i * 1.7) + 1) / 2; s.scale.setScalar(0.3 + tw * 1.2); s.visible = tw > 0.5; }); }

function shotGallery(t, T) { // 0〜9：夜の美術館、首飾りを見つめる清掃員（0秒目がサムネ）
  base(); S.aim(0, 0); lift(150); galleryLight(T);
  cleaner.visible = true; suited.visible = false;
  cleaner.userData.arms[1].rotation.x = -0.35 + Math.sin(T * 3) * 0.12;
  tNeck.userData.pop((T - 5.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(-1.0, -0.6, u), lerp(2.6, 2.3, u), lerp(8.2, 6.4, u), 0.4, lerp(1.7, 1.6, u), -0.2, 54);
  return qs;
}
function shotDisguise(t) { // 9〜17：その正体は、変装の名人
  base(); S.aim(0, 0); lift(200); galleryLight(9 + t);
  const sw = 3.9;
  cleaner.visible = t < sw; suited.visible = t >= sw; cleaner.rotation.y = lerp(-2.2, -0.5, ease((t - 1.0) / 1.2));
  const pk = clamp((t - (sw - 0.3)) / 0.9);
  PUFF.forEach((m, i) => { m.visible = pk > 0 && pk < 1; m.position.set(1.1 + m.userData.d.x * (0.4 + pk), 0.2 + m.userData.d.y * (0.6 + pk * 0.4), 0.9 + m.userData.d.z * (0.4 + pk)); m.material.opacity = 0.85 * (1 - pk); m.scale.setScalar(0.6 + pk * 1.2); });
  tCl.userData.pop((t - 0.6) / 0.35);
  if (t > sw - 0.3) tCl.visible = false;
  tMaster.userData.pop((t - sw - 0.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(0.6, 0.9, u), lerp(2.3, 2.1, u), lerp(6.8, 6.0, u), 0.9, 1.5, 0.2, 54);
  return qs;
}
function shotLibrary(t) { // 17〜25：少年のころ、父から贈られた本
  base(); S.aim(24, 0); lift(200);
  S.hemi.intensity = 0.7; S.key.intensity = 0.5;
  const k = ease((t - 0.8) / 1.6);
  BOOK.position.set(lerp(23.75, 24.25, k), lerp(1.12, 0.92, k), lerp(0.55, 0.85, k)); BOOK.rotation.set(-0.3, 0.3, 0);
  tGift.userData.pop((t - 1.0) / 0.35);
  if (t > 4.0) { tGift.visible = false; tThief.userData.pop((t - 4.1) / 0.35); }
  const u = ease(t / 8);
  look(lerp(24.5, 24.2, u), lerp(2.0, 1.9, u), lerp(6.6, 6.0, u), 24.0, 1.3, 0, 52);
  return qs;
}
function shotFramed(t) { // 25〜33：父は、雇い主の一家に罪を着せられた
  base(); S.aim(48, 0); lift(200);
  S.hemi.intensity = 0.9;
  dad4.userData.head.rotation.x = t > 4 ? 0.3 : 0;
  tRich.userData.pop((t - 0.6) / 0.35);
  tFalse.userData.pop((t - 4.1) / 0.35);
  const u = ease(t / 8);
  look(lerp(48.8, 48.2, u), lerp(2.6, 2.4, u), lerp(7.8, 7.0, u), 48.4, 1.5, -0.4, 54);
  return qs;
}
function shotPlan(t) { // 33〜42：大人になった今、報復が始まる
  base(); S.aim(72, 0); lift(200);
  S.hemi.intensity = 0.85; S.key.intensity = 0.6; S.darken(0.25, '#0c0e16');
  tRev.userData.pop((t - 4.5) / 0.35);
  const u = ease(t / 9);
  look(lerp(73.4, 72.6, u), lerp(2.4, 2.3, u), lerp(7.0, 6.0, u), 72.0, 1.9, -1.2, 54);
  return qs;
}
const DARK = '#080b16';
function shotRoof(t) { // 42〜49：夜のパリの屋根
  base(); S.aim(96, 0); lift(190);
  const d = ease(t / 1.2);
  S.hemi.intensity = lerp(1.25, 0.22, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  ROOF.userData.rim.intensity = lerp(0, 7, ease((t - 0.3) / 1));
  NK6.rotation.y = t * 1.4; NK6.position.y = 1.25 + Math.sin(t * 2) * 0.03;
  man6.userData.arms[1].rotation.x = -1.1;
  const k = ease(t / 6.5);
  look(lerp(97.6, 96.8, k), lerp(1.8, 1.8, k), lerp(5.6, 3.8, k), 96.4, lerp(1.7, 1.6, k), 0.2, 52);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマわかった？
  base(); S.aim(96, 0); lift(190);
  S.hemi.intensity = 0.22; S.key.intensity = 0; S.darken(1, DARK); ROOF.userData.rim.intensity = 7;
  NK6.rotation.y = (t + 7) * 1.4; man6.userData.arms[1].rotation.x = -1.1;
  const k = ease(t / 7);
  look(lerp(96.8, 96.4, k), lerp(1.8, 4.6, k), lerp(3.8, 8.6, k), 96.4, lerp(1.6, 1.8, k), 0, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotGallery(t, T) },
  { a: 9, b: 17, f: shotDisguise },
  { a: 17, b: 25, f: shotLibrary },
  { a: 25, b: 33, f: shotFramed },
  { a: 33, b: 42, f: shotPlan },
  { a: 42, b: 49, f: shotRoof },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '夜の、<br>パリの美術館。'],
  [5.6, 9.0, '清掃員が見つめる先に、<br>王妃の首飾り。'],
  [9.2, 13.2, 'でも、<br>その正体は、'],
  [13.2, 17.0, '姿を自由に変える、<br>変装の名人。'],
  [17.2, 21.0, '少年のころ、<br>父から贈られた1冊の本。'],
  [21.0, 25.0, 'それは、<br>怪盗紳士の物語。'],
  [25.2, 29.0, 'その父は、<br>裕福な雇い主の一家に、'],
  [29.0, 33.0, '首飾りを盗んだ罪を、<br>着せられた。'],
  [33.2, 37.4, '大人になった今、<br>計画は整った。'],
  [37.4, 41.8, 'その一家への、<br>報復が始まる。'],
  [42.2, 45.4, 'あの本の主人公のように、'],
  [45.4, 49.0, 'あくまでも、<br>スマートに。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>Lupin／ルパン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotDisguise || f === shotLibrary || f === shotFramed || f === shotPlan,
  meta: {
    id: 'q008', v2: true, answer: 'Lupin/ルパン',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 808,
    hits: [5.6, 13.2, 56.4], risers: [52.0],
    impacts: [0.3, 13.2, 29.0, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '王妃': 'おうひ', '首飾り': 'くびかざり', '清掃員': 'せいそういん', '正体': 'しょうたい', '変装': 'へんそう', '贈られた': 'おくられた', '1冊': 'いっさつ', '怪盗紳士': 'かいとうしんし', '雇い主': 'やといぬし', '一家': 'いっか', '着せられた': 'きせられた', '報復': 'ほうふく', '整った': 'ととのった', 'Lupin／ルパン': 'ルパン' },
    caption: 'このドラマのタイトル、わかる？\n夜のパリの美術館。王妃の首飾りを見つめる清掃員の正体は、変装の名人。少年のころ父から贈られたのは、怪盗紳士の物語。父に罪を着せた裕福な一家への報復が始まる。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'フランスドラマ'],
  },
});
applyQuizCards({ answer: 'Lupin／ルパン', info: 'Netflix｜フランスのドラマ', answerSize: 100 });
