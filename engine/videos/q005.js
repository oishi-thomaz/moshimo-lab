import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #005 きっと、うまくいく（映画・インド・2009年・170分。Netflixで見放題、justwatch.com/jp/映画/3-idiots で2026/11/1確認。Filmarks 4.3）
// 設定：インドの超難関工科大学に入った3人の新入生。写真家になりたいのに父に工学の道を決められた1人、家が貧しく家族の期待を背負う1人、
//       型破りな自由人なのに首席の1人。学長と何度もぶつかる。卒業後に姿を消した親友の行方を10年後に追う（Filmarks 作品ページ・ジョルダン映画・ciatr 作品紹介）
// 作品の映像・衣装・ロゴ・有名な場面の構図は使わず、設定だけを汎用の3Dで見せる。大学名・人物名・合言葉そのものは出さない

const S = quizStage({ bg: '#e9c79a', floor: '#c9a477', fogNear: 30, fogFar: 95 });
const qs = S.scene;
const R = rng(505);

const FARHAN = { skin: '#c98f62', hair: '#1a1410', shirt: '#4f8fc9', pants: '#2b3346' };
const RAJU = { skin: '#b97f55', hair: '#141010', shirt: '#d9a44a', pants: '#5a4a3a' };
const RANCHO = { skin: '#c48a5c', hair: '#141010', shirt: '#e9e4da', pants: '#3b3f4a' };
const DEAN = { skin: '#c48a5c', hair: '#d8d8d8', shirt: '#4a3a3a', pants: '#2a2424', tie: true };
const STU = (i) => ({ skin: ['#c98f62', '#b97f55', '#d9a57c', '#a87048'][i % 4], hair: ['#141010', '#1a1410', '#2c2421'][i % 3], shirt: ['#e05a4f', '#3f8f6b', '#8e6bbf', '#e9e4da', '#2f4a7a', '#d97a3a'][i % 6], pants: ['#2b3346', '#3b3f4a', '#5a4a3a'][i % 3], long: i % 3 === 1, skirt: i % 6 === 4 });
function bag(p, color = '#7a4a2a') { const b = box(0.36, 0.42, 0.2, mat(color)); b.position.set(0, 1.15, -0.24); p.add(b); }
function camera(p) { const c = box(0.26, 0.18, 0.14, mat('#1c1c1c')); c.position.set(0, 0.24, 0.32); p.userData.head.add(c); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), mat('#333')); l.rotation.x = Math.PI / 2; l.position.set(0, 0.24, 0.44); p.userData.head.add(l); p.userData.arms.forEach(a => { a.rotation.x = -1.9; a.rotation.z = 0; }); p.userData.arms[0].rotation.z = -0.35; p.userData.arms[1].rotation.z = 0.35; }

// ---------- 1. 大学の正門と校舎（x=0） ----------
const CAMPUS = new THREE.Group(); CAMPUS.position.set(0, 0, -7); qs.add(CAMPUS);
{ const brick = mat('#b5573c'), stone = mat('#efe2c8');
  const main = box(14, 5.0, 3.4, brick); main.position.y = 2.5; CAMPUS.add(main);
  const tower = box(3.0, 8.0, 3.0, brick); tower.position.set(0, 4.0, 0.4); CAMPUS.add(tower);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone); dome.position.set(0, 8.0, 0.4); dome.castShadow = true; CAMPUS.add(dome);
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 3.6, 12), stone); c.position.set(-6.0 + i * (i < 4 ? 1.1 : 1.1) + (i >= 4 ? 4.6 : 0), 1.8, 1.9); c.castShadow = true; CAMPUS.add(c); }
  for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) { if (i === 4 || i === 5) continue; const w = box(0.7, 0.9, 0.08, mat('#3a4a5e')); w.position.set(-6.3 + i * 1.4, 1.6 + r * 2.0, 1.72); CAMPUS.add(w); }
  const arch = box(1.6, 2.6, 0.1, mat('#3a2a1e')); arch.position.set(0, 1.3, 1.92); CAMPUS.add(arch);
  const clockT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f7efdc'; g.beginPath(); g.arc(w / 2, h / 2, 120, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#3a2a1e'; g.lineWidth = 10; g.stroke(); g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 52); g.moveTo(128, 128); g.lineTo(184, 140); g.stroke(); });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshLambertMaterial({ map: clockT })); clock.position.set(0, 6.2, 1.92); CAMPUS.add(clock);
  const lawn = box(16, 0.04, 6, mat('#7fa650')); lawn.position.set(0, 0.02, 4.4); CAMPUS.add(lawn); }
{ const signT = canvasTex(1024, 192, (g, w, h) => { g.fillStyle = '#2d3a5a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e6b450'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#f7efdc'; g.font = '900 104px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('工 科 大 学', w / 2, h / 2 + 4); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.83), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(0, 4.5, -5.08); qs.add(sign); }
const WALKERS = []; for (let i = 0; i < 12; i++) { const p = makePerson(STU(i)); p.scale.setScalar(0.95); bag(p, ['#7a4a2a', '#2a3a5a', '#5a2a3a'][i % 3]); qs.add(p); WALKERS.push({ p, x0: -6 + (i % 6) * 2.2 + R(), z0: -1.5 - Math.floor(i / 6) * 1.4, sp: 0.35 + R() * 0.3, ph: R() * 10 }); }
const NEW3 = [FARHAN, RAJU, RANCHO].map((o, i) => { const p = makePerson(o); bag(p, ['#2a3a5a', '#6a3a2a', '#3a5a3a'][i]); p.position.set(-0.9 + i * 0.9, 0, 3.6); p.rotation.y = Math.PI; qs.add(p); return p; });
const tElite = tag('超難関の工科大学', { size: 74, bg: '#e2483c' }); tElite.position.set(0, 3.7, 4.0); qs.add(tElite);

// ---------- 2. 寮の部屋：写真家の夢と、貧しい家（x=22） ----------
const DORM = new THREE.Group(); DORM.position.set(22, 0, 0); qs.add(DORM);
{ const back = box(9, 4.2, 0.2, mat('#e3d2b0')); back.position.set(0, 2.1, -2.6); DORM.add(back);
  const fl = box(9, 0.06, 6, mat('#8a6a4a')); fl.position.y = 0.03; DORM.add(fl);
  for (const x of [-3.2, 3.2]) { const bed = box(1.4, 0.5, 2.6, mat('#6a4a30')); bed.position.set(x, 0.25, -1.1); DORM.add(bed); const mt = box(1.3, 0.16, 2.5, mat('#f2ece0')); mt.position.set(x, 0.58, -1.1); DORM.add(mt); }
  // 野生動物の写真（自作の絵：鳥と山）
  const photoT = canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#9fd0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#5b7a4a'; g.beginPath(); g.moveTo(0, h); g.lineTo(150, 180); g.lineTo(290, h); g.fill(); g.beginPath(); g.moveTo(200, h); g.lineTo(380, 150); g.lineTo(w, h); g.fill(); g.strokeStyle = '#1e1e1e'; g.lineWidth = 10; g.beginPath(); g.moveTo(230, 120); g.quadraticCurveTo(260, 92, 290, 118); g.quadraticCurveTo(320, 92, 350, 120); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 18; g.strokeRect(0, 0, w, h); });
  for (const [x, y, r] of [[-2.2, 2.6, 0.06], [-1.0, 2.9, -0.05], [-1.6, 1.8, 0.03]]) { const ph = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshLambertMaterial({ map: photoT })); ph.position.set(x, y, -2.48); ph.rotation.z = r; DORM.add(ph); }
  // 家族の小さな家の写真
  const homeT = canvasTex(360, 280, (g, w, h) => { g.fillStyle = '#e8d8b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#a07a5a'; g.fillRect(100, 130, 160, 110); g.fillStyle = '#6a4a3a'; g.beginPath(); g.moveTo(80, 135); g.lineTo(180, 60); g.lineTo(280, 135); g.fill(); g.fillStyle = '#3a2a1e'; g.fillRect(165, 180, 30, 60); g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.strokeRect(0, 0, w, h); });
  const home = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.62), new THREE.MeshLambertMaterial({ map: homeT })); home.position.set(1.9, 2.5, -2.48); DORM.add(home);
  const book = box(0.6, 0.12, 0.42, mat('#2d3a5a')); book.position.set(-3.0, 0.72, -0.4); DORM.add(book);
  const lamp = new THREE.PointLight(0xffd59a, 3, 7, 1.4); lamp.position.set(0, 3.2, 0); DORM.add(lamp); }
const far2 = makePerson(FARHAN); camera(far2); far2.position.set(20.9, 0, 0.2); far2.rotation.y = 0.35; qs.add(far2);
const raj2 = makePerson(RAJU); raj2.position.set(23.1, 0, 0.2); raj2.rotation.y = -0.35; raj2.userData.arms.forEach(a => { a.rotation.x = -0.6; }); qs.add(raj2);
const tPhoto = tag('夢は写真家', { size: 76, bg: '#e6b450', color: '#14161c' }); tPhoto.position.set(20.9, 2.55, 0.2); qs.add(tPhoto);
const tFather = tag('道は父が決めた', { size: 70, bg: '#e2483c' }); tFather.position.set(20.9, 2.55, 0.2); qs.add(tFather);
const tPoor = tag('家が貧しい', { size: 76 }); tPoor.position.set(23.1, 2.55, 0.2); qs.add(tPoor);
const tHope = tag('家族の期待', { size: 76, bg: '#e2483c' }); tHope.position.set(23.1, 2.55, 0.2); qs.add(tHope);

// ---------- 3. 教室と成績表：自由人なのに首席（x=44） ----------
const CLASS = new THREE.Group(); CLASS.position.set(44, 0, 0); qs.add(CLASS);
const BOARD_T = canvasTex(768, 512, (g, w, h) => {
  g.fillStyle = '#f7f1e2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2d3a5a'; g.fillRect(0, 0, w, 96);
  g.fillStyle = '#ffffff'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('成績順位', w / 2, 50);
  g.textAlign = 'left'; g.font = '800 46px "Noto Sans CJK JP", sans-serif';
  for (let i = 0; i < 6; i++) { const y = 140 + i * 62; if (i === 0) { g.fillStyle = '#e6b450'; g.fillRect(30, y - 28, w - 60, 56); } g.fillStyle = '#1e2430'; g.fillText(`${i + 1}位`, 60, y + 2); g.fillStyle = i === 0 ? '#1e2430' : '#9aa0aa'; g.fillRect(220, y - 8, 380 - i * 22, 16); }
});
{ const back = box(12, 4.4, 0.2, mat('#d8cdb4')); back.position.set(0, 2.2, -3.2); CLASS.add(back);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshLambertMaterial({ map: BOARD_T })); board.position.set(1.4, 2.5, -3.08); CLASS.add(board);
  const bf = box(3.2, 2.2, 0.06, mat('#5a4030')); bf.position.set(1.4, 2.5, -3.12); CLASS.add(bf);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const d = box(1.0, 0.7, 0.6, mat('#7a5a3a')); d.position.set(-3.6 + i * 1.6, 0.35, -0.8 + r * 1.6); CLASS.add(d); } }
const SEATED = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { if (r === 1 && i >= 1) continue; const p = makePerson(STU(i + r * 4 + 2)); p.position.set(40.4 + i * 1.6, -0.25, -0.35 + r * 1.6); p.rotation.y = Math.PI * 0.95; p.userData.legs.forEach(l => { l.rotation.x = -1.4; }); qs.add(p); SEATED.push(p); }
const ran3 = makePerson(RANCHO); ran3.position.set(43.1, 0, 1.4); ran3.rotation.y = 0.4; ran3.userData.arms[0].rotation.z = -2.6; ran3.userData.arms[1].rotation.z = 2.6; ran3.userData.arms.forEach(a => { a.rotation.x = -0.3; }); qs.add(ran3);
const tFree = tag('型破りな自由人', { size: 68, w: 560, bg: '#e6b450', color: '#14161c' }); tFree.position.set(43.2, 2.9, 1.4); qs.add(tFree);
const tTop = tag('なのに首席', { size: 80, bg: '#e2483c' }); tTop.position.set(43.2, 2.9, 1.4); qs.add(tTop);

// ---------- 4. 学長室：点数がすべて（x=66） ----------
const OFFICE = new THREE.Group(); OFFICE.position.set(66, 0, 0); qs.add(OFFICE);
{ const back = box(10, 4.6, 0.2, mat('#6a4a3a')); back.position.set(0, 2.3, -3.2); OFFICE.add(back);
  { const sh = box(1.2, 3.6, 0.5, mat('#4a3020')); sh.position.set(-4.2, 1.8, -2.9); OFFICE.add(sh); }
  for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) { const b = box(0.16, 0.6, 0.36, mat(['#8a2a2a', '#2a4a7a', '#3a6a3a', '#a07a2a'][(i + k) % 4])); b.position.set(-4.65 + i * 0.18, 0.55 + k * 0.85, -2.75); OFFICE.add(b); }
  const desk = box(3.0, 0.95, 1.3, mat('#4a3020')); desk.position.set(0.8, 0.48, -1.0); OFFICE.add(desk);
  const top = box(3.1, 0.06, 1.4, mat('#2a1a10')); top.position.set(0.8, 0.98, -1.0); OFFICE.add(top);
  const paper = box(0.5, 0.02, 0.7, mat('#f7f1e2')); paper.position.set(1.2, 1.02, -0.8); OFFICE.add(paper);
  const scoreT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f7f1e2'; g.fillRect(0, 0, w, h); g.fillStyle = '#d63a2a'; g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('点', w / 2, h / 2 + 8); g.strokeStyle = '#d63a2a'; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, h / 2, 108, 0, Math.PI * 2); g.stroke(); });
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshLambertMaterial({ map: scoreT })); sc.position.set(2.6, 3.1, -3.08); OFFICE.add(sc); }
const dean = makePerson(DEAN); dean.position.set(66.8, 0, -1.9); dean.rotation.y = -0.5; dean.userData.arms[1].rotation.x = -1.5; qs.add(dean);
const ran4 = makePerson(RANCHO); ran4.position.set(65.3, 0, 0.5); ran4.rotation.y = Math.PI * 0.8; qs.add(ran4);
const far4 = makePerson(FARHAN); far4.position.set(64.4, 0, 0.9); far4.rotation.y = Math.PI * 0.78; qs.add(far4);
const raj4 = makePerson(RAJU); raj4.position.set(64.6, 0, -0.3); raj4.rotation.y = Math.PI * 0.72; qs.add(raj4);
const tDean = tag('鬼の学長', { size: 80 }); tDean.position.set(66.8, 3.0, -1.9); qs.add(tDean);
const tScore = tag('点数がすべて', { size: 76, bg: '#e2483c' }); tScore.position.set(66.8, 3.0, -1.9); qs.add(tScore);

// ---------- 5. 10年後：消えた親友をさがす旅（x=88〜） ----------
const ROAD = new THREE.Group(); ROAD.position.set(88, 0, 0); qs.add(ROAD);
{ const rd = box(60, 0.04, 2.6, mat('#4a4a4e')); rd.position.set(6, 0.02, 0); ROAD.add(rd);
  for (let i = 0; i < 24; i++) { const ln = box(0.9, 0.05, 0.12, mat('#f2e6b0')); ln.position.set(-20 + i * 2.6, 0.04, 0); ROAD.add(ln); }
  for (let i = 0; i < 14; i++) { const h = 3 + R() * 3; const m = new THREE.Mesh(new THREE.ConeGeometry(2.2 + R() * 1.5, h, 5), mat(['#b98a5a', '#a87a4a', '#c9a070'][i % 3])); m.position.set(-18 + i * 4.2, h / 2, -9 - R() * 3); ROAD.add(m); }
  for (let i = 0; i < 10; i++) { const tr = box(0.18, 1.4, 0.18, mat('#5a4030')); tr.position.set(-14 + i * 4.8, 0.7, -2.4); ROAD.add(tr); const cr = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), mat('#5d8c3a')); cr.position.set(-14 + i * 4.8, 1.8, -2.4); cr.castShadow = true; ROAD.add(cr); } }
const CAR = new THREE.Group(); qs.add(CAR);
{ const body = box(2.4, 0.6, 1.2, mat('#e9e4da')); body.position.y = 0.5; CAR.add(body);
  const hood = box(0.7, 0.12, 1.1, mat('#d8d2c4')); hood.position.set(0.9, 0.84, 0); CAR.add(hood);
  const glass = box(0.08, 0.45, 1.0, new THREE.MeshLambertMaterial({ color: '#9fd0e8', transparent: true, opacity: 0.5 })); glass.position.set(0.5, 1.02, 0); CAR.add(glass);
  for (const [x, z] of [[-0.8, 0.6], [0.8, 0.6], [-0.8, -0.6], [0.8, -0.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 14), mat('#111')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.24, z); CAR.add(w); }
  const d1 = makePerson(FARHAN); d1.scale.setScalar(0.8); d1.position.set(0.15, 0.2, 0.0); d1.rotation.y = Math.PI / 2; d1.userData.legs.forEach(l => { l.rotation.x = -1.5; }); CAR.add(d1);
  const d2 = makePerson(RAJU); d2.scale.setScalar(0.8); d2.position.set(-0.75, 0.2, 0.0); d2.rotation.y = Math.PI / 2; d2.userData.legs.forEach(l => { l.rotation.x = -1.5; }); CAR.add(d2);
  CAR.userData.p = [d1, d2]; }
// 空いた3つ目の席：消えた親友の写真（顔は描かない。白い人影だけ）
const MISS = new THREE.Group(); qs.add(MISS);
{ const frT = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#f7f1e2'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9b48f'; g.fillRect(18, 18, w - 36, h - 70); g.fillStyle = '#f7f1e2'; g.beginPath(); g.arc(w / 2, 110, 46, 0, Math.PI * 2); g.fill(); g.fillRect(w / 2 - 66, 160, 132, 90); g.fillStyle = '#d63a2a'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('？', w / 2, 112); });
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.875), new THREE.MeshBasicMaterial({ map: frT })); MISS.add(fr); }
const t10 = tag('10年後', { size: 90, bg: '#e6b450', color: '#14161c' }); qs.add(t10);
const tGone = tag('消えた親友', { size: 80, bg: '#e2483c' }); qs.add(tGone);

// ---------- 6〜7. 夜の屋上、3人（x=120） ----------
const ROOF = new THREE.Group(); ROOF.position.set(120, 0, 0); qs.add(ROOF);
const STARS = [];
{ const deck = box(24, 0.2, 14, mat('#5a5048')); deck.position.y = 0.1; ROOF.add(deck);
  const wall = box(24, 0.8, 0.2, mat('#6a6058')); wall.position.set(0, 0.5, -3.2); ROOF.add(wall);
  for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 + R() * 0.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff6dc' })); s.position.set(-9 + R() * 18, 3 + R() * 8, -8 - R() * 4); ROOF.add(s); STARS.push(s); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); moon.position.set(3.2, 6.4, -9); ROOF.add(moon);
  const warm = new THREE.PointLight(0xffc878, 0, 9, 1.4); warm.position.set(0, 2.8, 1.6); ROOF.add(warm); ROOF.userData.warm = warm; }
const THREE6 = [FARHAN, RANCHO, RAJU].map((o, i) => { const p = makePerson(o); p.position.set(119.1 + i * 0.9, 0.2, 0.4); p.rotation.y = (1 - i) * 0.25; qs.add(p); return p; });
// 真ん中の1人が胸に手を当てる
function chest(p, k) { const a = p.userData.arms[1]; a.rotation.x = lerp(0, -0.62, k); a.rotation.z = lerp(0, -0.62, k); }

// ---------- shots ----------
const ALLTAG = [tElite, tPhoto, tFather, tPoor, tHope, tFree, tTop, tDean, tScore, t10, tGone];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); ROOF.userData.warm.intensity = 0; }

function shotCampus(t, T) { // 0〜9：大学の正門（0秒目がサムネ）
  base(); S.aim(0, 0); lift(150);
  WALKERS.forEach((w, i) => { const x = w.x0 + Math.sin(T * w.sp + w.ph) * 1.6; w.p.position.set(x, 0, w.z0); w.p.rotation.y = Math.cos(T * w.sp + w.ph) > 0 ? Math.PI / 2 : -Math.PI / 2; w.p.userData.legs[0].rotation.x = Math.sin(T * 7 + i) * 0.4; w.p.userData.legs[1].rotation.x = -Math.sin(T * 7 + i) * 0.4; });
  NEW3.forEach((p, i) => { const k = ease((T - 3.0) / 3.5); p.position.z = lerp(4.6, 2.6, k); p.position.x = -0.9 + i * 0.9; const ph = T * 7 + i; const mv = T > 3 && T < 6.5 ? 1 : 0; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * mv; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * mv; });
  tElite.userData.pop((T - 2.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.6, 0, u), lerp(4.6, 4.2, u), lerp(14.5, 12.6, u), 0, lerp(3.6, 3.4, u), -4, 54);
  return qs;
}
function shotDorm(t) { // 9〜17：写真家の夢／家が貧しい
  base(); S.aim(22, 0); lift(200);
  tPhoto.userData.pop((t - 0.5) / 0.35);
  if (t > 2.8) { tPhoto.visible = false; tFather.userData.pop((t - 2.9) / 0.35); }
  if (t > 4.3) tFather.visible = false;
  tPoor.userData.pop((t - 4.4) / 0.35);
  if (t > 6.2) { tPoor.visible = false; tHope.userData.pop((t - 6.3) / 0.35); }
  const u = ease(t / 8);
  look(lerp(21.6, 22.4, u), lerp(2.8, 2.6, u), lerp(8.6, 8.0, u), 22, 1.6, -0.6, 52);
  return qs;
}
function shotClass(t) { // 17〜25：型破りな自由人なのに首席
  base(); S.aim(44, 0); lift(200);
  ran3.userData.head.rotation.z = Math.sin(t * 2) * 0.12;
  tFree.userData.pop((t - 0.5) / 0.35);
  if (t > 4.0) { tFree.visible = false; tTop.userData.pop((t - 4.1) / 0.35); }
  const k = ease((t - 3.4) / 1.4);
  look(lerp(43.8, 44.2, k), lerp(2.6, 2.9, k), lerp(8.6, 9.4, k), lerp(43.6, 44.1, k), lerp(1.7, 2.0, k), lerp(0.8, -0.6, k), 54);
  return qs;
}
function shotOffice(t) { // 25〜33：鬼の学長と、ぶつかる
  base(); S.aim(66, -1); lift(200);
  dean.userData.arms[1].rotation.x = -1.5 + Math.sin(t * 5) * 0.12 * (t > 4 ? 1 : 0);
  tDean.userData.pop((t - 0.5) / 0.35);
  if (t > 3.8) { tDean.visible = false; tScore.userData.pop((t - 3.9) / 0.35); }
  const u = ease(t / 8);
  look(lerp(68.2, 67.9, u), lerp(2.8, 3.0, u), lerp(5.8, 6.3, u), 66.1, 1.6, -0.9, 54);
  return qs;
}
function shotRoad(t) { // 33〜42：10年後。消えた親友をさがす
  base(); S.aim(88 + t * 1.6, 0); lift(200);
  const cx = 84 + t * 1.6; CAR.position.set(cx, 0, 0.5); CAR.rotation.y = 0; CAR.position.y = Math.abs(Math.sin(t * 9)) * 0.03;
  MISS.position.set(cx - 0.1, 2.15, 0.8); MISS.rotation.z = Math.sin(t * 2) * 0.05; MISS.visible = t > 4.6; MISS.scale.setScalar(easeOut(clamp((t - 4.6) / 0.4)));
  t10.position.set(cx, 2.55, 0.6); t10.userData.pop((t - 0.4) / 0.35); if (t > 4.4) t10.visible = false;
  tGone.position.set(cx - 0.1, 3.05, 0.8); tGone.userData.pop((t - 5.0) / 0.35);
  look(cx + 0.6, 2.5, 8.0, cx, 1.5, 0, 52);
  return qs;
}
const DARK = '#0b0e1c';
function shotRoof(t) { // 42〜49：夜の屋上、3人。真ん中が胸に手を当てる
  base(); S.aim(120, 0); lift(190);
  const d = ease(t / 1.3);
  S.hemi.intensity = lerp(1.25, 0.22, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  ROOF.userData.warm.intensity = lerp(0, 8, ease((t - 0.5) / 1.2));
  STARS.forEach((s, i) => s.visible = (Math.floor(t * 2 + i) % 7) !== 0);
  chest(THREE6[1], ease((t - 3.4) / 0.8));
  const k = ease(t / 6.5);
  look(120, lerp(2.4, 2.0, k), lerp(7.6, 4.8, k), 120, 1.6, 0.4, lerp(52, 46, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画わかった？
  base(); S.aim(120, 0); lift(190);
  S.hemi.intensity = 0.22; S.key.intensity = 0; S.darken(1, DARK);
  ROOF.userData.warm.intensity = 8; chest(THREE6[1], 1);
  const k = ease(t / 7);
  look(120, lerp(2.0, 5.6, k), lerp(4.8, 9.6, k), 120, lerp(1.6, 1.3, k), 0, lerp(46, 52, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotCampus(t, T) },
  { a: 9, b: 17, f: shotDorm },
  { a: 17, b: 25, f: shotClass },
  { a: 25, b: 33, f: shotOffice },
  { a: 33, b: 42, f: shotRoad },
  { a: 42, b: 49, f: shotRoof },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'インドの、<br>超難関の工科大学。'],
  [5.6, 9.0, '入学してきたのは、<br>3人の新入生。'],
  [9.2, 13.2, '1人は、本当は<br>写真家になりたい。'],
  [13.2, 17.0, '1人は、貧しい家族の<br>期待を背負っている。'],
  [17.2, 21.0, 'そして最後の1人は、<br>型破りな自由人。'],
  [21.0, 25.0, 'なのに、成績は<br>なぜか首席。'],
  [25.2, 29.0, '点数がすべての、<br>鬼のような学長と、'],
  [29.0, 33.0, 'ことあるごとに、<br>ぶつかっていく。'],
  [33.2, 37.4, 'そして、<br>10年後。'],
  [37.4, 41.8, '姿を消した親友の行方を、<br>2人が追いかける。'],
  [42.2, 45.4, '困ったときは、<br>胸に手を当てて、'],
  [45.4, 49.0, 'あの言葉を<br>となえる。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>きっと、うまくいく。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotDorm || f === shotClass || f === shotOffice || f === shotRoad,
  meta: {
    id: 'q005', v2: true, answer: 'きっと、うまくいく',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 505,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 21.0, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '工科大学': 'こうかだいがく', '超難関': 'ちょうなんかん', '3人': 'さんにん', '1人': 'ひとり', '2人': 'ふたり', '首席': 'しゅせき', '学長': 'がくちょう', '10年後': 'じゅうねんご', '型破り': 'かたやぶり', '行方': 'ゆくえ', '背負って': 'せおって' },
    caption: 'この映画のタイトル、わかる？\nインドの超難関の工科大学に入った3人。写真家になりたい1人、貧しい家族の期待を背負う1人、そして型破りなのに首席の1人。10年後、姿を消した親友の行方を追いかける。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'インド映画', '名作映画'],
  },
});
applyQuizCards({ answer: 'きっと、<br>うまくいく', info: 'Netflix｜インド映画・170分', answerSize: 104 });
