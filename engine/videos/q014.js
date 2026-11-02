import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #014 梨泰院クラス（ドラマ・韓国・全16話。Netflixで見放題、justwatch.com/jp/テレビ番組/itaeweon-keulrasseu で2026/11/2確認。Filmarks 4.2 filmarks.com/dramas/8569/12266）
// 設定：高校で大手外食企業の御曹司を殴った青年は退学に。長年その会社で働いた父も解雇される。のちに父を事件で失い、青年は前科者に。
//       父を奪った大企業への復讐を誓い、ソウルの街で仲間と小さな飲み屋を開く。目標は国内トップの外食チェーン。大物相手に無謀ともいえる戦いを仕掛ける（Netflix の作品紹介・ciatr の作品解説）
// 結末には触れない。作品の映像・俳優・髪形・店の看板やロゴは使わない。暴力や事故の場面は見せない。人と建物は汎用の3D

const S = quizStage({ bg: '#a9b6c8', floor: '#6a6e76', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(1414);
const HERO = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a3448', pants: '#1f2430' };
const HEIR = { skin: '#f5d3b5', hair: '#3a2a20', shirt: '#e9e4da', pants: '#4a4a52', tie: true };
const DAD = { skin: '#e8b98f', hair: '#6a6a6a', shirt: '#5a6a7a', pants: '#3b3f4a' };

// ---------- 1. 高校の中庭（x=0） ----------
{ const sch = box(14, 6, 3, mat('#d8d0c0')); sch.position.set(0, 3, -7); qs.add(sch);
  const wt = windowTextures(14, '#d8d0c0'); wt.map.repeat.set(9, 3.5); const f = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshLambertMaterial({ map: wt.map })); f.position.set(0, 3, -5.49); qs.add(f);
  const clk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32), mat('#f4f1ea')); clk.rotation.x = Math.PI / 2; clk.position.set(0, 6.6, -5.4); qs.add(clk);
  for (const a of [0, 1.9]) { const h = box(0.06, 0.45, 0.04, mat('#222')); h.position.set(Math.sin(a) * 0.2, 6.6 + Math.cos(a) * 0.2, -5.32); h.rotation.z = -a; qs.add(h); }
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), mat('#5a8a4a')); t.position.set(-6 + i * 4, 2.2, -4.2); qs.add(t); const tr = box(0.2, 1.6, 0.2, mat('#5a4030')); tr.position.set(-6 + i * 4, 0.8, -4.2); qs.add(tr); } }
const hero = makePerson(HERO); hero.position.set(-0.75, 0, 0.6); hero.rotation.y = Math.PI / 2 - 0.25; qs.add(hero);
const heir = makePerson(HEIR); heir.position.set(0.85, 0, 0.4); heir.rotation.y = -Math.PI / 2 + 0.25; qs.add(heir);
const dad = makePerson(DAD); dad.position.set(2.3, 0, -2.2); dad.rotation.y = -0.3; qs.add(dad);
const tHeir = tag('大企業の御曹司', { size: 64, w: 500, bg: '#e6b450', color: '#14161c' }); tHeir.position.set(0.7, 2.4, 0.4); qs.add(tHeir);
const tOut = tag('退学', { size: 90, w: 260, bg: '#e2483c' }); tOut.position.set(-0.75, 2.4, 0.6); qs.add(tOut);
const tFired = tag('父はクビ', { size: 72, w: 340, bg: '#e2483c' }); tFired.position.set(2.3, 2.4, -2.2); qs.add(tFired);
const FLASH = new THREE.PointLight(0xffffff, 0, 8, 1); FLASH.position.set(0.1, 1.6, 1.4); qs.add(FLASH);

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
const hero2 = makePerson(HERO); hero2.position.set(30.2, -0.42, -0.6); hero2.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); hero2.userData.arms.forEach(a => a.rotation.x = -0.5); qs.add(hero2);
const FRAME = new THREE.Group(); FRAME.position.set(30, 0, 1.2); qs.add(FRAME);
{ const tex = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d4cc'; g.fillRect(18, 18, w - 36, h - 36); g.fillStyle = '#6a6a6a'; g.beginPath(); g.arc(w / 2, 130, 52, 0, Math.PI * 2); g.fill(); g.fillRect(w / 2 - 80, 190, 160, 120); });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.05), [mat('#2a2a2a'), mat('#2a2a2a'), mat('#2a2a2a'), mat('#2a2a2a'), new THREE.MeshLambertMaterial({ map: tex }), mat('#2a2a2a')]); fr.position.set(0, 0.55, 0); fr.rotation.x = -0.15; FRAME.add(fr);
  const st = box(0.9, 0.24, 0.5, mat('#3a3030')); st.position.y = 0.12; FRAME.add(st);
  const cnd = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10), mat('#f4f1ea')); cnd.position.set(0.32, 0.34, 0.1); FRAME.add(cnd);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf70' })); fl.position.set(0.32, 0.47, 0.1); FRAME.add(fl);
  const flw = box(0.18, 0.12, 0.12, mat('#f4f1ea')); flw.position.set(-0.3, 0.3, 0.1); FRAME.add(flw); }
const CANDLE = new THREE.PointLight(0xffc870, 0, 4, 1.4); CANDLE.position.set(30.3, 0.7, 1.6); qs.add(CANDLE);
const tCon = tag('前科者に', { size: 80, w: 340, bg: '#e2483c' }); tCon.position.set(30.2, 1.95, -0.6); qs.add(tCon);

// ---------- 3. 大企業のビル（x=60） ----------
const TOWER = new THREE.Group(); TOWER.position.set(60, 0, -10); qs.add(TOWER);
{ const wt = windowTextures(1414, '#3a4458'); wt.map.repeat.set(4, 14); wt.emi.repeat.set(4, 14);
  const side = new THREE.MeshLambertMaterial({ map: wt.map, emissive: 0xffffff, emissiveMap: wt.emi, emissiveIntensity: 0.6 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(6, 28, 5), [side, side, mat('#262d3c'), mat('#262d3c'), side, side]); t.position.y = 14; TOWER.add(t);
  const sT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e6b450'; g.lineWidth = 14; g.beginPath(); g.arc(110, h / 2, 70, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#e6b450'; g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('大企業', 200, h / 2 + 6); });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshBasicMaterial({ map: sT })); s.position.set(0, 25.5, 2.52); TOWER.add(s);
  for (const [x, h, z] of [[-6, 12, 2], [6.5, 15, 1], [-10, 8, 4], [10.5, 9, 4]]) { const w2 = windowTextures(Math.floor(x * 10 + 500), '#4a5468'); w2.map.repeat.set(2, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(3.5, h, 3.5), new THREE.MeshLambertMaterial({ map: w2.map })); b.position.set(x, h / 2, z); TOWER.add(b); } }
const hero3 = makePerson(HERO); hero3.position.set(60, 0, 0.6); hero3.rotation.y = Math.PI; qs.add(hero3);
const tVow = tag('復讐を誓う', { size: 76, w: 420, bg: '#e2483c', sx: 3.4 }); tVow.position.set(60, 13.5, -7.3); tVow.material.fog = false; qs.add(tVow);

// ---------- 4. 小さな飲み屋（x=90） ----------
const BAR = new THREE.Group(); BAR.position.set(90, 0, -2.5); qs.add(BAR);
const BULBS = [];
{ const b = box(5, 3.2, 2.5, mat('#4a3a34')); b.position.y = 1.6; BAR.add(b);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); glass.position.set(-0.8, 1.3, 1.26); BAR.add(glass);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), new THREE.MeshBasicMaterial({ color: '#ffe2b0' })); door.position.set(1.4, 1.0, 1.26); BAR.add(door);
  const sT = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd890'; g.font = '900 76px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OPEN', w / 2, h / 2 + 4); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: sT })); sign.position.set(0, 2.75, 1.27); BAR.add(sign);
  for (let i = 0; i < 14; i++) { const u = i / 13; const bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); bl.position.set(lerp(-2.4, 2.4, u), 3.25 - Math.sin(u * Math.PI) * 0.25, 1.35); BAR.add(bl); BULBS.push(bl); }
  for (const [x, h] of [[-5.2, 6], [5.4, 7], [-9, 9], [9.5, 8]]) { const w2 = windowTextures(Math.floor(h * 31), '#6a6e78'); w2.map.repeat.set(2, h / 2); const bb = new THREE.Mesh(new THREE.BoxGeometry(5, h, 3), new THREE.MeshLambertMaterial({ map: w2.map })); bb.position.set(x, h / 2, -0.5); BAR.add(bb); } }
const BARL = new THREE.PointLight(0xffc880, 0, 8, 1.2); BARL.position.set(90, 2.4, 0.5); qs.add(BARL);
const CREW = [HERO, { skin: '#f5d3b5', hair: '#1a1a22', shirt: '#2a2a2a', pants: '#1f2430', long: false }, { skin: '#e8b98f', hair: '#4a3426', shirt: '#7a6a5a', pants: '#3b3f4a' }, { skin: '#f1c9a5', hair: '#2c2421', shirt: '#8a4a4a', pants: '#2b3346', long: true }].map((o, i) => { const p = makePerson(o); p.position.set(88.4 + i * 1.05, 0, 0.6 + (i % 2) * 0.25); qs.add(p); return p; });
const tBar = tag('小さな飲み屋', { size: 70, w: 460, bg: '#e6b450', color: '#14161c' }); tBar.position.set(90, 4.1, -1.2); qs.add(tBar);

// ---------- 5. 店がふえていく地図（x=120） ----------
const MAP = new THREE.Group(); MAP.position.set(120, 0, 0); qs.add(MAP);
{ const board = box(8, 0.1, 6, mat('#e8e2d2')); board.position.y = 0.05; MAP.add(board);
  const tex = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#dfe8d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8c2b0'; g.lineWidth = 10; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, 80 + i * 80 + (i % 2) * 20); g.lineTo(w, 60 + i * 85); g.stroke(); g.beginPath(); g.moveTo(100 + i * 110, 0); g.lineTo(80 + i * 115, h); g.stroke(); } g.fillStyle = '#a8c8e0'; g.beginPath(); g.moveTo(0, 360); g.bezierCurveTo(250, 300, 500, 420, 800, 340); g.lineTo(800, 380); g.bezierCurveTo(500, 460, 250, 340, 0, 400); g.fill(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 5.8), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.y = 0.11; MAP.add(m); }
const SHOPS = [];
for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const b = box(0.4, 0.35, 0.35, mat('#4a3a34')); b.position.y = 0.18; g.add(b); const r = box(0.48, 0.08, 0.42, mat('#e6b450')); r.position.y = 0.39; g.add(r); const a = i === 0 ? [0, 0] : [(R() - 0.5) * 6.6, (R() - 0.5) * 4.6]; g.position.set(120 + a[0], 0.11, a[1]); qs.add(g); SHOPS.push(g); }
const tTop = tag('目指すは国内トップ', { size: 64, w: 600, bg: '#e2483c' }); tTop.position.set(120, 1.2, -1.8); qs.add(tTop);
const tFirst = tag('1号店', { size: 64, w: 260, bg: '#14161c' }); tFirst.position.set(120, 1.2, 0); qs.add(tFirst);

// ---------- shots ----------
const ALL = [tHeir, tOut, tFired, tCon, tVow, tBar, tTop, tFirst];
function base() { S.reset(); ALL.forEach(x => x.visible = false); hero3.visible = true; FLASH.intensity = 0; CANDLE.intensity = 0; BARL.intensity = 0; heir.rotation.x = 0; heir.position.set(0.85, 0, 0.4); }

function shotSchool(t, T) { // 0〜9：大企業の御曹司を殴った高校生（殴る瞬間は見せない）
  base(); S.aim(0, -1); lift(60);
  tHeir.userData.pop((T - 1.9) / 0.35);
  if (T > 2.6) { const k = ease((T - 2.6) / 0.4); heir.rotation.x = -0.22 * k; heir.position.x = 0.85 + 0.35 * k; tHeir.position.x = Math.min(heir.position.x, 0.9); }
  if (T > 2.5 && T < 3.0) { FLASH.intensity = 60 * Math.sin((T - 2.5) / 0.5 * Math.PI); S.darken(0); S.scene.background.lerp(new THREE.Color('#ffffff'), 0.5 * Math.sin((T - 2.5) / 0.5 * Math.PI)); }
  hero.userData.arms[1].rotation.x = T > 2.4 && T < 3.4 ? -1.4 : -0.1;
  if (T > 5.6) { tHeir.visible = false; tOut.userData.pop((T - 5.8) / 0.35); tFired.userData.pop((T - 7.3) / 0.35); }
  const u = ease(T / 9);
  look(lerp(0.1, 0.6, u), lerp(2.2, 2.6, u), lerp(7.2, 8.8, u), lerp(0.05, 0.6, u), lerp(1.5, 1.4, u), lerp(0.4, -0.6, u), 54);
  return qs;
}
function shotCell(t) { // 9〜17：父を失い、前科者に
  base(); S.aim(30, 0); lift(120);
  S.hemi.intensity = 0.7; S.key.intensity = 0.6;
  CANDLE.intensity = 4;
  const bars = t > 4.0;
  BARS.position.y = bars ? -4 + 4 * easeOut(clamp((t - 4.0) / 0.5)) : -4;
  FRAME.visible = !bars; hero2.visible = bars;
  if (bars) tCon.userData.pop((t - 5.4) / 0.35);
  const u = ease(t / 8);
  if (!bars) look(30, lerp(1.4, 1.2, u), lerp(3.4, 2.8, u), 30, 0.6, 1.2, 50);
  else look(30, 1.9, lerp(6.6, 6.0, u), 30.1, 1.1, 0, 54);
  return qs;
}
function shotTower(t) { // 17〜25：すべてを奪った大企業に、復讐を誓う
  base(); S.aim(60, -4); lift(-330);
  S.darken(0.35, '#2a3048');
  tVow.userData.pop((t - 4.2) / 0.35); hero3.visible = t < 3.6;
  const u = ease(t / 8);
  look(lerp(60.9, 60.5, u), lerp(1.1, 0.9, u), lerp(5.6, 4.8, u), 60, lerp(5, 11, u), -10, 60);
  return qs;
}
function shotBar(t) { // 25〜33：ソウルで開いた小さな飲み屋
  base(); S.aim(90, -1); lift(80);
  S.darken(0.55, '#1a2236'); S.hemi.intensity = 0.8; BARL.intensity = 10;
  BULBS.forEach((b, i) => b.visible = t > 0.3 + i * 0.08);
  tBar.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(90.6, 90.2, u), lerp(2.6, 2.3, u), lerp(9.4, 8.0, u), 90.2, 1.9, -1, 54);
  return qs;
}
function shotMap(t) { // 33〜42：仲間と、国内トップの外食チェーンを目指す
  base(); S.aim(120, 0); lift(220);
  SHOPS.forEach((g, i) => { const k = i === 0 ? 1 : easeOut(clamp((t - 3.6 - i * 0.18) / 0.35)); g.visible = k > 0; g.scale.setScalar(Math.max(0.001, k)); });
  tFirst.userData.pop((t - 0.6) / 0.35); if (t > 3.6) tFirst.visible = false;
  tTop.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(120, lerp(5.0, 6.6, u), lerp(4.2, 5.6, u), 120, 0, lerp(0.4, -0.2, u), 54);
  return qs;
}
const DARK = '#070a14';
function nightTwo(t, d) { // 小さな店と巨大なビルを並べる
  S.hemi.intensity = lerp(1.25, 0.35, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK); BARL.intensity = 10;
}
function shotTwist(t) { // 42〜49：小さな店が、巨大企業に挑む
  base(); S.aim(90, -2); lift(lerp(0, -240, ease(t / 7)));
  nightTwo(t, ease(t / 1.3)); BULBS.forEach(b => b.visible = true);
  TOWER.position.set(100, 0, -26);
  const k = ease(t / 7);
  look(lerp(89.0, 87.6, k), lerp(1.6, 2.4, k), lerp(7.0, 11.0, k), lerp(90, 93, k), lerp(2.0, 9.0, k), lerp(-1, -14, k), 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？
  base(); S.aim(90, -2); lift(-240);
  nightTwo(t, 1); BULBS.forEach(b => b.visible = true);
  TOWER.position.set(100, 0, -26);
  const k = ease(t / 7);
  look(lerp(87.6, 87.0, k), lerp(2.4, 2.8, k), lerp(11.0, 13.0, k), 93, lerp(9.0, 10.0, k), -14, 56);
  countdown(t);
  return qs;
}
function resetTower() { TOWER.position.set(60, 0, -10); }

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => { resetTower(); return shotSchool(t, T); } },
  { a: 9, b: 17, f: (t) => { resetTower(); return shotCell(t); } },
  { a: 17, b: 25, f: (t) => { resetTower(); return shotTower(t); } },
  { a: 25, b: 33, f: (t) => { resetTower(); return shotBar(t); } },
  { a: 33, b: 42, f: (t) => { resetTower(); return shotMap(t); } },
  { a: 42, b: 49, f: shotTwist },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '大企業の御曹司を<br>殴った高校生。'],
  [5.6, 9.0, '彼は退学、<br>父も会社をクビに。'],
  [9.2, 13.2, 'さらに、ある事件で<br>父を失い、'],
  [13.2, 17.0, '彼自身も<br>前科者になってしまう。'],
  [17.2, 21.0, 'すべてを奪った<br>大企業に、'],
  [21.0, 25.0, '彼は<br>復讐を誓う。'],
  [25.2, 29.0, '選んだ武器は、'],
  [29.0, 33.0, 'ソウルの街で開いた、<br>小さな飲み屋。'],
  [33.2, 37.4, '仲間と一緒に<br>目指すのは、'],
  [37.4, 41.8, '国内トップの<br>外食チェーン。'],
  [42.2, 45.4, '小さな店が、'],
  [45.4, 49.0, '巨大企業に<br>挑む。'],
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
    hits: [2.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 2.6, 13.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.0, 'poof'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '巨大企業': 'きょだいきぎょう', '大企業': 'だいきぎょう', '御曹司': 'おんぞうし', '殴った': 'なぐった', '高校生': 'こうこうせい', '退学': 'たいがく', '父': 'ちち', '事件': 'じけん', '失い': 'うしない', '彼自身': 'かれじしん', '前科者': 'ぜんかもの', '奪った': 'うばった', '復讐': 'ふくしゅう', '誓う': 'ちかう', '武器': 'ぶき', '飲み屋': 'のみや', '仲間': 'なかま', '目指す': 'めざす', '国内': 'こくない', '外食': 'がいしょく', '挑む': 'いどむ', '梨泰院': 'イテウォン' },
    caption: 'このドラマのタイトル、わかる？\n大企業の御曹司を殴った高校生は退学、父も会社をクビに。前科者になった彼は、すべてを奪った大企業に復讐を誓う。選んだ武器は、ソウルの街で開いた小さな飲み屋。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', '韓ドラ'],
  },
});
applyQuizCards({ answer: '梨泰院クラス', info: 'Netflix｜韓国・全16話', answerSize: 116 });
