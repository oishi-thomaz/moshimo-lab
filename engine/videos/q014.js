import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #014 梨泰院クラス（ドラマ・韓国・全16話。Netflixで見放題、justwatch.com/jp/テレビ番組/itaeweon-keulrasseu で2026/11/2確認。Filmarks 4.2 filmarks.com/dramas/8569/12266）
// 設定：高校で大手外食企業の御曹司を殴った青年は退学に。長年その会社で働いた父も解雇される。のちに父を事件で失い、青年は前科者に。
//       父を奪った大企業への復讐を誓い、ソウルの街で仲間と小さな飲み屋を開く。目標は国内トップの外食チェーン。大物相手に無謀ともいえる戦いを仕掛ける（Netflix の作品紹介・ciatr の作品解説）
// 構成：ヒント6段（父を失った高校生 → 退学・前科 → 夜の街の小さな店 → 仲間と復讐 → ソウル・国内トップ → 小さな飲み屋が巨大企業に挑む）。御曹司・会社名・看板の文字は出さない
// 結末には触れない。作品の映像・俳優・髪形・店の看板やロゴは使わない。暴力や事故の場面は見せない。人と建物は汎用の3D

const S = quizStage({ bg: '#a9b6c8', floor: '#6a6e76', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(1414);
const HERO = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a3448', pants: '#1f2430' };

// ---------- 1. 父の遺影の前（x=150） ----------
const MEM = new THREE.Group(); MEM.position.set(150, 0, 0); qs.add(MEM);
{ const back = box(8, 5, 0.2, mat('#3a3634')); back.position.set(0, 2.5, -1.6); MEM.add(back);
  const cloth = box(2.4, 2.2, 0.1, mat('#e9e6e0')); cloth.position.set(0, 1.9, -1.45); MEM.add(cloth);
  const tbl = box(2.2, 0.9, 0.8, mat('#2a2422')); tbl.position.set(0, 0.45, -0.9); MEM.add(tbl);
  const tex = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfcac0'; g.fillRect(18, 18, w - 36, h - 36); g.fillStyle = '#6a6a6a'; g.beginPath(); g.arc(w / 2, 130, 52, 0, Math.PI * 2); g.fill(); g.fillRect(w / 2 - 80, 190, 160, 112); });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.05), [mat('#1a1a1a'), mat('#1a1a1a'), mat('#1a1a1a'), mat('#1a1a1a'), new THREE.MeshLambertMaterial({ map: tex }), mat('#1a1a1a')]); fr.position.set(0, 1.45, -1.1); fr.rotation.x = -0.08; MEM.add(fr);
  const rib = box(0.66, 0.06, 0.06, mat('#111')); rib.position.set(0, 1.86, -1.07); rib.rotation.z = 0.5; MEM.add(rib);
  for (const x of [-0.75, 0.75]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), mat('#f4f1ea')); c.position.set(x, 1.05, -0.75); MEM.add(c); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf70' })); fl.position.set(x, 1.24, -0.75); fl.scale.y = 1.6; MEM.add(fl); }
  for (const x of [-1.05, 1.05]) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 10), mat('#d8d4cc')); v.position.set(x, 1.05, -1.0); MEM.add(v); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat('#f4f1ea')); f.position.set(x + (i - 2) * 0.06, 1.3 + (i % 2) * 0.1, -1.0); MEM.add(f); } } }
const MEML = new THREE.PointLight(0xffc870, 0, 6, 1.4); MEML.position.set(150, 1.4, 0.2); qs.add(MEML);
const hero = makePerson(HERO); hero.position.set(150.7, 0, 0.5); hero.rotation.y = Math.PI + 0.5; qs.add(hero);
{ const col = box(0.36, 0.08, 0.3, mat('#f4f1ea')); col.position.set(0, 1.5, 0.02); hero.add(col); }

// ---------- 2. 父の写真と、鉄格子（x=30） ----------
const CELL = new THREE.Group(); CELL.position.set(30, 0, 0); qs.add(CELL);
{ const back = box(6, 4, 0.2, mat('#7a7a78')); back.position.set(0, 2, -2); CELL.add(back);
  const l = box(0.2, 4, 4, mat('#6e6e6c')); l.position.set(-3, 2, 0); CELL.add(l); const r = l.clone(); r.position.x = 3; CELL.add(r);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: '#cfe0ee' })); win.position.set(0.8, 3.2, -1.89); CELL.add(win);
  for (let i = 0; i < 3; i++) { const b = box(0.04, 0.5, 0.04, mat('#333')); b.position.set(0.5 + i * 0.3, 3.2, -1.86); CELL.add(b); }
  const bed = box(1.9, 0.4, 0.8, mat('#5a6070')); bed.position.set(-1.6, 0.2, -1.4); CELL.add(bed); }
const BARS = new THREE.Group(); qs.add(BARS);
for (let i = 0; i < 13; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4, 8), mat('#2a2a2e')); b.position.set(27.1 + i * 0.48, 2, 1.6); BARS.add(b); }
{ const t = box(6.2, 0.1, 0.1, mat('#2a2a2e')); t.position.set(30, 3.9, 1.6); BARS.add(t); const m = t.clone(); m.position.y = 2.2; BARS.add(m); }
const hero2 = makePerson(HERO); hero2.position.set(30.0, 0, 0.4); qs.add(hero2);
const tOut = tag('退学', { size: 84, w: 240, bg: '#e2483c' }); tOut.position.set(29.25, 3.0, 1.7); qs.add(tOut);
const tCon = tag('前科', { size: 84, w: 240, bg: '#e2483c' }); tCon.position.set(30.75, 3.0, 1.7); qs.add(tCon);

// ---------- 3. 大企業のビル（x=60） ----------
const TOWER = new THREE.Group(); TOWER.position.set(60, 0, -10); qs.add(TOWER);
{ const wt = windowTextures(1414, '#3a4458'); wt.map.repeat.set(4, 14); wt.emi.repeat.set(4, 14);
  const side = new THREE.MeshLambertMaterial({ map: wt.map, emissive: 0xffffff, emissiveMap: wt.emi, emissiveIntensity: 0.6 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(6, 28, 5), [side, side, mat('#262d3c'), mat('#262d3c'), side, side]); t.position.y = 14; TOWER.add(t);
  const sT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e6b450'; g.lineWidth = 14; g.beginPath(); g.arc(110, h / 2, 70, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#e6b450'; g.fillRect(210, h / 2 - 14, 250, 28); });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshBasicMaterial({ map: sT })); s.position.set(0, 25.5, 2.52); TOWER.add(s);
  for (const [x, h, z] of [[-6, 12, 2], [6.5, 15, 1], [-10, 8, 4], [10.5, 9, 4]]) { const w2 = windowTextures(Math.floor(x * 10 + 500), '#4a5468'); w2.map.repeat.set(2, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(3.5, h, 3.5), new THREE.MeshLambertMaterial({ map: w2.map })); b.position.set(x, h / 2, z); TOWER.add(b); } }
const tVow = tag('目的は復讐', { size: 76, w: 420, bg: '#e2483c', sx: 7.4 }); tVow.material.fog = false; qs.add(tVow);

// ---------- 4. 小さな飲み屋（x=90） ----------
const BAR = new THREE.Group(); BAR.position.set(90, 0, -2.5); qs.add(BAR);
const BULBS = [];
{ const b = box(5, 3.2, 2.5, mat('#4a3a34')); b.position.y = 1.6; BAR.add(b);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); glass.position.set(-0.8, 1.3, 1.26); BAR.add(glass);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), new THREE.MeshBasicMaterial({ color: '#ffe2b0' })); door.position.set(1.4, 1.0, 1.26); BAR.add(door);
  const sT = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd890'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w / 2 + (i - 1) * 90, h / 2, 22, 0, Math.PI * 2); g.fill(); } });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: sT })); sign.position.set(0, 2.75, 1.27); BAR.add(sign);
  for (let i = 0; i < 14; i++) { const u = i / 13; const bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); bl.position.set(lerp(-2.4, 2.4, u), 3.25 - Math.sin(u * Math.PI) * 0.25, 1.35); BAR.add(bl); BULBS.push(bl); }
  for (const [x, h] of [[-5.2, 6], [5.4, 7], [-9, 9], [9.5, 8]]) { const w2 = windowTextures(Math.floor(h * 31), '#6a6e78'); w2.map.repeat.set(2, h / 2); const bb = new THREE.Mesh(new THREE.BoxGeometry(5, h, 3), new THREE.MeshLambertMaterial({ map: w2.map })); bb.position.set(x, h / 2, -0.5); BAR.add(bb); } }
const NEON = [];
for (const [x, y, c] of [[-5.2, 3.6, '#e2483c'], [-4.6, 2.4, '#4fa3d1'], [5.0, 4.4, '#d14fa3'], [5.8, 2.8, '#e6b450'], [-8.6, 5.6, '#4fd1a3'], [9.0, 5.0, '#e2483c']]) { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), new THREE.MeshBasicMaterial({ color: c })); n.position.set(x, y, 1.05); BAR.add(n); NEON.push(n); }
const BARL = new THREE.PointLight(0xffc880, 0, 8, 1.2); BARL.position.set(90, 2.4, 0.5); qs.add(BARL);
const CREW = [HERO, { skin: '#f5d3b5', hair: '#1a1a22', shirt: '#2a2a2a', pants: '#1f2430', long: false }, { skin: '#e8b98f', hair: '#4a3426', shirt: '#7a6a5a', pants: '#3b3f4a' }, { skin: '#f1c9a5', hair: '#2c2421', shirt: '#8a4a4a', pants: '#2b3346', long: true }].map((o, i) => { const p = makePerson(o); p.position.set(88.4 + i * 1.05, 0, 0.6 + (i % 2) * 0.25); qs.add(p); return p; });
const tBar = tag('小さな飲み屋', { size: 70, w: 460, bg: '#e6b450', color: '#14161c' }); tBar.position.set(90, 4.0, -1.2); qs.add(tBar);
const tCrew = tag('仲間', { size: 76, w: 260, bg: '#e6b450', color: '#14161c' }); tCrew.position.set(90, 2.75, 0.8); qs.add(tCrew);

// ---------- 5. 店がふえていく地図（x=120） ----------
const MAP = new THREE.Group(); MAP.position.set(120, 0, 0); qs.add(MAP);
{ const board = box(8, 0.1, 6, mat('#e8e2d2')); board.position.y = 0.05; MAP.add(board);
  const tex = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#dfe8d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8c2b0'; g.lineWidth = 10; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, 80 + i * 80 + (i % 2) * 20); g.lineTo(w, 60 + i * 85); g.stroke(); g.beginPath(); g.moveTo(100 + i * 110, 0); g.lineTo(80 + i * 115, h); g.stroke(); } g.fillStyle = '#a8c8e0'; g.beginPath(); g.moveTo(0, 360); g.bezierCurveTo(250, 300, 500, 420, 800, 340); g.lineTo(800, 380); g.bezierCurveTo(500, 460, 250, 340, 0, 400); g.fill(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 5.8), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.y = 0.11; MAP.add(m); }
const SHOPS = [];
for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const b = box(0.4, 0.35, 0.35, mat('#4a3a34')); b.position.y = 0.18; g.add(b); const r = box(0.48, 0.08, 0.42, mat('#e6b450')); r.position.y = 0.39; g.add(r); const a = i === 0 ? [0, 0] : [(R() - 0.5) * 6.6, (R() - 0.5) * 4.6]; g.position.set(120 + a[0], 0.11, a[1]); qs.add(g); SHOPS.push(g); }
const tTop = tag('目指すは国内トップ', { size: 64, w: 600, bg: '#e2483c' }); tTop.position.set(120, 1.2, -1.8); qs.add(tTop);
const tFirst = tag('1号店', { size: 64, w: 260, bg: '#14161c' }); tFirst.position.set(120, 1.2, 0); qs.add(tFirst);
const tSeoul = tag('ソウル', { size: 72, w: 300, bg: '#14161c' }); tSeoul.position.set(120, 1.4, 1.6); qs.add(tSeoul);

// ---------- shots ----------
const ALL = [tOut, tCon, tVow, tBar, tCrew, tTop, tFirst, tSeoul];
const DARK = '#070a14';
function resetTower() { TOWER.position.set(60, 0, -10); }
function base() { S.reset(); ALL.forEach(x => x.visible = false); MEML.intensity = 0; BARL.intensity = 0; resetTower(); BULBS.forEach(b => b.visible = true); NEON.forEach(n => n.visible = true); CREW.forEach(p => { p.visible = true; p.rotation.y = 0; }); }

function shotMemorial(t, T) { // 0〜9：ある事件で、父を失った高校生（0秒目がサムネ）
  base(); S.aim(150, 0); lift(40);
  S.darken(0.55, '#14100c'); S.hemi.intensity = 0.55; S.key.intensity = 0.35;
  MEML.intensity = 5 + Math.sin(T * 9) * 0.6 + Math.sin(T * 13.7) * 0.4;
  hero.userData.head.rotation.x = 0.35; hero.userData.arms.forEach(a => a.rotation.x = 0);
  const u = ease(T / 9);
  look(lerp(149.0, 149.4, u), lerp(1.9, 1.7, u), lerp(5.0, 4.0, u), lerp(150.1, 150.2, u), 1.25, -0.6, 54);
  return qs;
}
function shotCell(t) { // 9〜17：退学、前科。何もかも失った
  base(); S.aim(30, 0); lift(80);
  S.hemi.intensity = 0.7; S.key.intensity = 0.6;
  BARS.position.y = -4 + 4 * easeOut(clamp((t - 0.6) / 0.45));
  hero2.userData.head.rotation.x = t > 4.2 ? lerp(0.25, -0.05, ease((t - 4.2) / 1.5)) : 0.25;
  tOut.userData.pop((t - 0.8) / 0.35); tCon.userData.pop((t - 2.0) / 0.35);
  const u = ease(t / 8);
  look(30, lerp(2.0, 1.85, u), lerp(7.4, 6.8, u), 30, 1.6, 0, 54);
  return qs;
}
function shotBar(t) { // 17〜25：夜の街の片すみで、小さな飲み屋を開く
  base(); S.aim(90, -1); lift(80);
  S.darken(0.6, '#1a2236'); S.hemi.intensity = 0.75; BARL.intensity = t > 3.8 ? 10 : 2;
  BULBS.forEach((b, i) => b.visible = t > 3.8 + i * 0.06);
  CREW.forEach((p, i) => p.visible = i === 0); CREW[0].position.set(91.4, 0, 0.6); CREW[0].rotation.y = -0.4;
  tBar.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(90.8, 90.3, u), lerp(2.6, 2.3, u), lerp(10.0, 8.4, u), 90.2, 1.9, -1, 54);
  return qs;
}
function shotCrew(t) { // 25〜33：仲間が集まる。目的は、ある大企業への復讐
  base(); S.aim(90, -2); lift(lerp(80, -60, ease((t - 3.4) / 3))); TOWER.position.set(100, 0, -26);
  S.darken(0.68, '#141a2c'); S.hemi.intensity = 0.65; S.key.intensity = 0.4; BARL.intensity = 10;
  CREW.forEach((p, i) => { const k = i === 0 ? 1 : easeOut(clamp((t - 0.3 - (i - 1) * 0.8) / 0.6)); p.visible = k > 0; const x0 = 88.4 + i * 1.05; p.position.set(x0 + (i % 2 ? 3 : -3) * (1 - k), 0, 0.6 + (i % 2) * 0.25); p.rotation.y = 0; });
  tCrew.userData.pop((t - 1.2) / 0.35); if (t > 3.6) tCrew.visible = false;
  tVow.position.set(97.5, 17.5, -20); tVow.userData.pop((t - 4.2) / 0.35);
  const k = ease((t - 3.2) / 3.4);
  look(lerp(90.2, 88.4, k), lerp(2.3, 2.6, k), lerp(8.6, 13.0, k), lerp(90.2, 94, k), lerp(1.9, 11, k), lerp(-1, -16, k), lerp(54, 58, k));
  return qs;
}
function shotMap(t) { // 33〜42：舞台はソウル。目指すのは国内トップの外食チェーン
  base(); S.aim(120, 0); lift(220);
  SHOPS.forEach((g, i) => { const k = i === 0 ? 1 : easeOut(clamp((t - 3.6 - i * 0.18) / 0.35)); g.visible = k > 0; g.scale.setScalar(Math.max(0.001, k)); });
  tSeoul.userData.pop((t - 0.4) / 0.35); tFirst.userData.pop((t - 1.0) / 0.35); if (t > 3.6) { tFirst.visible = false; tSeoul.visible = false; }
  tTop.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(120, lerp(5.0, 6.6, u), lerp(4.2, 5.6, u), 120, 0, lerp(0.4, -0.2, u), 54);
  return qs;
}
function nightTwo(t, d) { // 小さな店と巨大なビルを並べる
  S.hemi.intensity = lerp(1.25, 0.35, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK); BARL.intensity = 10;
}
function shotTwist(t) { // 42〜49：父を奪った巨大企業に、小さな飲み屋が挑む（決め手）
  base(); S.aim(90, -2); lift(lerp(0, -240, ease(t / 7)));
  nightTwo(t, ease(t / 1.3));
  TOWER.position.set(100, 0, -26);
  const k = ease(t / 7);
  look(lerp(89.0, 87.6, k), lerp(1.6, 2.4, k), lerp(7.0, 11.0, k), lerp(90, 93, k), lerp(2.0, 9.0, k), lerp(-1, -14, k), 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？
  base(); S.aim(90, -2); lift(-240);
  nightTwo(t, 1);
  TOWER.position.set(100, 0, -26);
  const k = ease(t / 7);
  look(lerp(87.6, 87.0, k), lerp(2.4, 2.8, k), lerp(11.0, 13.0, k), 93, lerp(9.0, 10.0, k), -14, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotMemorial(t, T) },
  { a: 9, b: 17, f: shotCell },
  { a: 17, b: 25, f: shotBar },
  { a: 25, b: 33, f: shotCrew },
  { a: 33, b: 42, f: shotMap },
  { a: 42, b: 49, f: shotTwist },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある事件で、<br>父を失った高校生。'],
  [5.6, 9.0, '彼の人生は、<br>ここから一変する。'],
  [9.2, 13.2, '退学、前科。<br>何もかも失った。'],
  [13.2, 17.0, '残ったのは、<br>ひとつの決意だけ。'],
  [17.2, 21.0, 'やがて彼は、<br>夜の街の片すみで、'],
  [21.0, 25.0, '小さな飲み屋を<br>開く。'],
  [25.2, 29.0, 'ひとり、またひとりと<br>仲間が集まる。'],
  [29.0, 33.0, '目的は、<br>ある大企業への復讐。'],
  [33.2, 37.4, '舞台はソウル。<br>仲間と目指すのは、'],
  [37.4, 41.8, '国内トップの<br>外食チェーン。'],
  [42.2, 45.4, '相手は、父を奪った<br>巨大外食企業。'],
  [45.4, 49.0, '小さな飲み屋が、<br>真っ向から挑む。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>梨泰院クラス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q014', v2: true, answer: '梨泰院クラス',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 1414,
    hits: [9.6, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 9.6, 29.0, 42.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [9.6, 'poof'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '巨大外食企業': 'きょだいがいしょくきぎょう', '大企業': 'だいきぎょう', '高校生': 'こうこうせい', '事件': 'じけん', '父を失った': 'ちちをうしなった', '父を奪った': 'ちちをうばった', '人生': 'じんせい', '一変': 'いっぺん', '退学': 'たいがく', '前科': 'ぜんか', '何もかも': 'なにもかも', '失った': 'うしなった', '決意': 'けつい', '夜の街': 'よるのまち', '片すみ': 'かたすみ', '飲み屋': 'のみや', '開く': 'ひらく', '仲間': 'なかま', '目的': 'もくてき', '復讐': 'ふくしゅう', '舞台': 'ぶたい', '目指す': 'めざす', '国内': 'こくない', '外食': 'がいしょく', '相手': 'あいて', '真っ向': 'まっこう', '挑む': 'いどむ', '梨泰院': 'イテウォン' },
    caption: 'このドラマのタイトル、わかる？\nある事件で、父を失った高校生。退学、前科。何もかも失った彼は、やがて夜の街の片すみで小さな飲み屋を開く。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'ドラマ好き', '名作ドラマ'],
  },
});
applyQuizCards({ answer: '梨泰院クラス', info: 'Netflix｜韓国・全16話', answerSize: 116 });
