import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #055 ザ・グローリー ～輝かしき復讐～（ドラマ・韓国・2022年〜2023年・パート1・2で全16話。Netflixで見放題、
//   justwatch.com/jp/テレビ番組/the-glory で2026/11/4確認。Filmarks 4.1・レビュー40,172件 filmarks.com/dramas/12849/17705）
// 確かめた事実（Filmarks のエピソード紹介・ja.wikipedia.org/wiki/ザ・グローリー_〜輝かしき復讐〜。2026/11/4）：
//   ・高校の同級生からのひどいいじめに苦しみ、誰にも頼れない。自主退学に追い込まれ、人生の新たな使命（復讐）を見いだす
//   ・16年ぶりに加害者たちと再会。リーダーは今は気象キャスターで、建設会社代表の妻
//   ・第4話：加害者は娘の新しい担任の名前を知り衝撃を受ける（主人公は小学校の教師）。囲碁（加害者の夫の趣味・仲間との出会い）
//   ・2022年12月30日からNetflixで配信、全16話（パート2は2023年）
// 構成（ヒント6段）：1 高校の同級生からのひどいいじめ、誰も助けてくれない → 2 学校を去り、人生をかけた計画が始まる → 3 長い年月、加害者は幸せに暮らす
//   → 4 リーダーは今やお天気キャスター、復讐の相手は全員 → 5 2022年の韓国ドラマ・全16話 → 6 決め手：加害者の娘の担任の先生に、白と黒の碁石
// 「担任」「囲碁」は6段目まで出さない。いじめの中身（暴力の描写）は見せない・言わない。人物名・結末は出さない。人は汎用の3D

const S = quizStage({ bg: '#1e2028', floor: '#2a2a30', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(5555);

const GIRL = { skin: '#f0d4bc', hair: '#141414', shirt: '#e8e8ec', pants: '#2a3048', long: true, skirt: true };
const WOMAN = { skin: '#f0d4bc', hair: '#141414', shirt: '#1e2026', pants: '#1e2026', long: true };
const RICH = { skin: '#f2d6c0', hair: '#4a2a1a', shirt: '#e8c8d0', pants: '#e8c8d0', long: true, skirt: true };

// ---------- 1段目. 放課後の教室（x=0）。ひとりの少女を囲む同級生 ----------
{ const fl = box(12, 0.04, 10, mat('#8a6a4a')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#c8ccc0')); wl.position.set(0, 2.5, -4); qs.add(wl);
  const bb = box(4.4, 1.6, 0.06, mat('#2a4a3a')); bb.position.set(0, 2.6, -3.88); qs.add(bb);
  for (const x of [-4.5, 4.5]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.2), new THREE.MeshBasicMaterial({ color: '#e8a070' })); win.position.set(x, 2.6, -3.88); qs.add(win); }
  for (let i = 0; i < 6; i++) { const x = -3 + (i % 3) * 3, z = -2.4 + Math.floor(i / 3) * 2.6; if (i === 4) continue; const d = box(0.9, 0.06, 0.6, mat('#c8a070')); d.position.set(x, 0.75, z); qs.add(d); const lg = box(0.7, 0.72, 0.5, mat('#6a6a70')); lg.position.set(x, 0.36, z); qs.add(lg); } }
const DESK = new THREE.Group(); DESK.position.set(0, 0, 0.2); qs.add(DESK);
{ const d = box(0.9, 0.06, 0.6, mat('#c8a070')); d.position.y = 0.75; DESK.add(d); const lg = box(0.7, 0.72, 0.5, mat('#6a6a70')); lg.position.y = 0.36; DESK.add(lg); }
const g1 = makePerson(GIRL); g1.position.set(0, -0.32, 0.75); g1.rotation.y = Math.PI; g1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(g1);
const BULLIES = []; for (let i = 0; i < 4; i++) { const p = makePerson({ skin: '#f0d4bc', hair: ['#3a2418', '#141414', '#5a3a24', '#141414'][i], shirt: '#e8e8ec', pants: '#2a3048', long: i !== 2, skirt: i !== 2 }); const a = Math.PI * (0.15 + i * 0.23); p.position.set(Math.cos(a) * 1.5, 0, 0.6 - Math.sin(a) * 1.3); p.rotation.y = Math.atan2(-p.position.x, 0.6 - p.position.z); qs.add(p); BULLIES.push(p); }
const PAPERS = []; for (let i = 0; i < 12; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ color: '#f4f2ea', side: THREE.DoubleSide })); p.userData = { x: (R() - 0.5) * 2.4, z: 0.4 + (R() - 0.5) * 1.6, o: R() * 6 }; qs.add(p); PAPERS.push(p); }
const tBully = tag('同級生からの、いじめ', { size: 60, w: 620, bg: '#e2483c', sx: 1.85 }); tBully.position.set(0, 2.3, 0.9); qs.add(tBully);
const tAlone = tag('誰も助けてくれない', { size: 62, w: 600, bg: '#14161c', sx: 1.85 }); tAlone.position.set(0, 2.3, 0.9); qs.add(tAlone);

// ---------- 2段目. 夜の校門（x=40）。学校を去る少女 ----------
const SX = 40;
{ const fl = box(16, 0.04, 14, mat('#2a2c34')); fl.position.set(SX, 0.02, -3); qs.add(fl);
  const sc = box(12, 6, 3, mat('#5a5a64')); sc.position.set(SX, 3, -9); qs.add(sc);
  for (let i = 0; i < 12; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: i % 5 === 2 ? '#ffe2a8' : '#2a2c36' })); w.position.set(SX - 5 + (i % 6) * 2, 2 + Math.floor(i / 6) * 2, -7.48); qs.add(w); }
  for (const s of [-1, 1]) { const gp = box(0.6, 2.4, 0.6, mat('#8a8a90')); gp.position.set(SX + s * 2.2, 1.2, -3); qs.add(gp); } }
const g2 = makePerson(GIRL); g2.position.set(SX, 0, -2); qs.add(g2);
const BAG2 = box(0.36, 0.3, 0.12, mat('#3a2a2a')); BAG2.position.set(0.32, 0.8, 0); g2.add(BAG2);
const RAIN = []; for (let i = 0; i < 140; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), new THREE.MeshBasicMaterial({ color: '#a8b8d0', transparent: true, opacity: 0.55 })); d.userData = { x: (R() - 0.5) * 12, z: (R() - 0.5) * 8 - 1, o: R() }; qs.add(d); RAIN.push(d); }
const tQuit = tag('学校を、去った', { size: 70, w: 480, bg: '#14161c', sx: 1.25 }); tQuit.position.set(SX, 2.5, -1.4); qs.add(tQuit);
const tPlan = tag('人生をかけた計画', { size: 64, w: 560, bg: '#e2483c', sx: 1.35 }); tPlan.position.set(SX, 2.5, -1.4); qs.add(tPlan);

// ---------- 3段目. 小さな部屋の壁（x=80）。年月と、幸せそうな写真 ----------
const PX = 80;
{ const fl = box(10, 0.04, 8, mat('#3a3034')); fl.position.set(PX, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#5a5458')); wl.position.set(PX, 2.5, -3); qs.add(wl);
  const tb = box(1.6, 0.06, 0.8, mat('#6a5a48')); tb.position.set(PX, 0.78, -1.6); qs.add(tb); const lg = box(1.4, 0.74, 0.6, mat('#4a3a30')); lg.position.set(PX, 0.38, -1.6); qs.add(lg);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe0a0', side: THREE.DoubleSide })); lamp.position.set(PX - 0.6, 1.1, -1.7); qs.add(lamp); }
const PHOTOS = []; for (let i = 0; i < 5; i++) { const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), new THREE.MeshBasicMaterial({ map: canvasTex(140, 110, (g, w, h) => { g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, w, h); g.fillStyle = ['#e8b8c8', '#b8d0e8', '#e8d8a8', '#c8e0c0', '#d8c0e8'][i]; g.fillRect(8, 8, w - 16, h - 28); g.fillStyle = '#4a3020'; g.fillRect(56, 26, 28, 28); g.fillStyle = '#f0d0b8'; g.fillRect(60, 32, 20, 20); g.fillStyle = '#e2483c'; g.fillRect(w / 2 - 2, h - 16, 4, 10); }) })); ph.position.set(PX - 2.0 + i * 1.0, 2.6 + (i % 2) * 0.5, -2.88); ph.rotation.z = (R() - 0.5) * 0.2; qs.add(ph); PHOTOS.push(ph); }
const STRINGS = []; for (let i = 0; i < 4; i++) { const a = PHOTOS[i].position, b = PHOTOS[i + 1].position; const len = a.distanceTo(b); const st = box(len, 0.015, 0.01, mat('#d83a3a')); st.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, -2.86); st.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); qs.add(st); STRINGS.push(st); }
const CAL = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(180, 200, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c83a3a'; g.fillRect(0, 0, w, 36); g.strokeStyle = '#3a3a3a'; g.lineWidth = 3; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { const x = 12 + c * 27, y = 50 + r * 28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18, y + 18); g.moveTo(x + 18, y); g.lineTo(x, y + 18); g.stroke(); } }) })); CAL.position.set(PX + 3.0, 2.3, -2.88); qs.add(CAL);
const w3 = makePerson(WOMAN); w3.position.set(PX, -0.32, -0.9); w3.rotation.y = Math.PI; w3.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(w3);
const tYears = tag('長い年月が過ぎた', { size: 64, w: 560, bg: '#14161c', sx: 2.0 }); tYears.position.set(PX, 3.85, -2.6); qs.add(tYears);
const tHappy = tag('いじめた側は、幸せに', { size: 60, w: 640, bg: '#e2483c', sx: 2.2 }); tHappy.position.set(PX, 3.85, -2.6); qs.add(tHappy);

// ---------- 4段目. テレビ局のお天気コーナー（x=120） ----------
const WX = 120;
{ const fl = box(14, 0.04, 10, mat('#2a2c38')); fl.position.set(WX, 0.02, -1); qs.add(fl); }
const MAP = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a8ad8'); gr.addColorStop(1, '#2a5aa8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#6ab06a'; g.beginPath(); g.ellipse(300, 170, 90, 130, 0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(270, 120, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(340, 210, 38, 22, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(365, 200, 26, 18, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.font = 'bold 40px sans-serif'; g.fillText('☀ 25°', 40, 70); }) })); MAP.position.set(WX + 0.6, 2.6, -2.6); qs.add(MAP);
const ANCHOR = makePerson(RICH); ANCHOR.position.set(WX - 1.4, 0, -1.4); ANCHOR.rotation.y = 0.3; qs.add(ANCHOR);
const CAMS = []; for (let i = 0; i < 2; i++) { const c = new THREE.Group(); const b = box(0.5, 0.4, 0.8, mat('#2a2a2e')); b.position.y = 1.6; c.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12), mat('#141414')); l.rotation.x = Math.PI / 2; l.position.set(0, 1.6, -0.5); c.add(l); const tr = box(0.06, 1.4, 0.06, mat('#3a3a3e')); tr.position.y = 0.7; c.add(tr); c.position.set(WX - 3 + i * 6, 0, 1.4); c.rotation.y = i ? 0.4 : -0.4; qs.add(c); CAMS.push(c); }
const ONAIR = tag('ON AIR', { size: 70, w: 320, bg: '#e2483c', sx: 1.0 }); ONAIR.position.set(WX + 0.9, 3.75, -2.5); qs.add(ONAIR);
const tCaster = tag('リーダーは、お天気キャスター', { size: 54, w: 800, bg: '#14161c', sx: 1.75 }); tCaster.position.set(WX - 0.6, 2.55, -1.2); qs.add(tCaster);
const tAll = tag('復讐の相手は、全員', { size: 62, w: 600, bg: '#e2483c', sx: 1.5 }); tAll.position.set(WX - 0.6, 2.55, -1.2); qs.add(tAll);

// ---------- 5段目. テレビの前（x=160）。2022年の韓国ドラマ・全16話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#16161c' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a3a48'); gr.addColorStop(1, '#0e0e14'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(40 + (i % 8) * 62, 110 + Math.floor(i / 8) * 70, 20, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tKR = tag('2022年 韓国ドラマ', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t16 = tag('全16話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t16.position.set(TX, 4.6, -1.2); qs.add(t16);
const tRev = tag('静かで、周到な復讐', { size: 60, w: 600, bg: '#e2483c', sx: 2.8 }); tRev.position.set(TX, 3.75, -1.0); qs.add(tRev);

// ---------- 6段目. 小学校の教室と、碁盤（x=200） ----------
const DX = 200;
{ const fl = box(14, 0.04, 10, mat('#9a7a5a')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#e0e4d8')); wl.position.set(DX, 2.5, -4); qs.add(wl);
  const bb = box(5, 1.8, 0.06, mat('#2a4a3a')); bb.position.set(DX, 2.6, -3.88); qs.add(bb);
  for (let i = 0; i < 4; i++) { const ch = box(0.5, 0.5, 0.5, mat(['#e85a4a', '#f2c14e', '#3a7ad8', '#6ab06a'][i % 4])); ch.position.set(DX - 3.5 + i * 1.6, 0.25, -0.2); qs.add(ch); } }
const T6 = makePerson(WOMAN); T6.position.set(DX - 1.2, 0, -2.6); qs.add(T6);
const KIDS = []; for (let i = 0; i < 3; i++) { const k = makePerson({ skin: '#f2d6c0', hair: '#2a1a14', shirt: ['#f2c14e', '#e88aa0', '#8ac0e8'][i], pants: '#3a3a5a', long: i === 1, skirt: i === 1, scale: 0.6 }); k.position.set(DX - 2.6 + i * 1.2, 0, -0.6); k.rotation.y = Math.PI; qs.add(k); KIDS.push(k); }
const GOBAN = new THREE.Group(); GOBAN.position.set(DX + 0.9, 0, 1.4); qs.add(GOBAN);
{ const bd = box(1.3, 0.25, 1.3, mat('#d8b070')); bd.position.y = 0.6; GOBAN.add(bd); for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) { const lg = box(0.14, 0.48, 0.14, mat('#a8783a')); lg.position.set(x, 0.24, z); GOBAN.add(lg); }
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8b070'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; for (let i = 0; i < 13; i++) { const p = 14 + i * 19; g.beginPath(); g.moveTo(p, 14); g.lineTo(p, h - 14); g.moveTo(14, p); g.lineTo(w - 14, p); g.stroke(); } }) })); grid.rotation.x = -Math.PI / 2; grid.position.y = 0.73; GOBAN.add(grid); }
const STONES = []; for (let i = 0; i < 16; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), mat(i % 2 ? '#f4f4f0' : '#141414')); st.scale.y = 0.5; const gx = Math.floor(R() * 13), gz = Math.floor(R() * 13); st.position.set(-0.55 + gx * 0.09, 0.75, -0.55 + gz * 0.09); GOBAN.add(st); STONES.push(st); }
const tHomeroom = tag('加害者の娘の担任に', { size: 60, w: 600, bg: '#e2483c', sx: 3.0 }); tHomeroom.position.set(DX, 3.6, -1.6); qs.add(tHomeroom);
const tGo = tag('白と黒の碁石', { size: 70, w: 460, bg: '#14161c', sx: 2.2 }); tGo.position.set(DX + 0.8, 2.85, -1.2); qs.add(tGo);

// ---------- shots ----------
const ALL = [tBully, tAlone, tQuit, tPlan, tYears, tHappy, ONAIR, tCaster, tAll, tKR, t16, tRev, tHomeroom, tGo];
function base() { S.reset(); ALL.forEach(x => x.visible = false); PAPERS.forEach(p => p.visible = false); RAIN.forEach(d => d.visible = false); }

function shotClass(t) { // 1段目 0〜9：高校の同級生からのひどいいじめ。誰も助けてくれない（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-40); S.hemi.intensity = 0.8; S.key.intensity = 0.9; S.darken(0.45, '#1a1010');
  BULLIES.forEach((p, i) => { p.userData.head.rotation.x = Math.sin(t * 4 + i) * 0.1; p.userData.arms[i % 2].rotation.x = -0.7 + Math.sin(t * 3 + i) * 0.2; p.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.03; });
  g1.userData.head.rotation.x = 0.45; g1.userData.arms.forEach(a => a.rotation.x = -0.9);
  PAPERS.forEach(p => { p.visible = true; const f = (t * 0.25 + p.userData.o) % 1; p.position.set(p.userData.x, 2.4 - f * 2.3, p.userData.z); p.rotation.set(t + p.userData.o, p.userData.o, Math.sin(t + p.userData.o)); });
  tBully.userData.pop(1); if (t > 4.6) tBully.visible = false;
  tAlone.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.2, 0, u), lerp(2.4, 2.3, u), lerp(4.8, 4.0, u), 0, 1.55, 0.4, 56);
  return qs;
}
function shotGate(t) { // 2段目 9〜17：少女は学校を去った。人生をかけた計画が始まる
  base(); S.aim(SX, -2); lift(-40); S.hemi.intensity = 0.7; S.darken(0.65, '#06080e');
  RAIN.forEach(d => { d.visible = true; const k = (t * 1.6 + d.userData.o) % 1; d.position.set(d.userData.x + SX, 7 - k * 7, d.userData.z); });
  poseWalk(g2, t * 2.6, 0.5); g2.position.z = -2.4 + t * 0.22; g2.userData.head.rotation.x = 0.25;
  tQuit.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tQuit.visible = false;
  tPlan.userData.pop((t - 4.2) / 0.35); tPlan.position.z = g2.position.z + 0.6; tQuit.position.z = g2.position.z + 0.6;
  const u = ease(t / 8);
  look(SX + lerp(0.6, 0.3, u), lerp(1.9, 1.8, u), lerp(3.2, 2.8, u), SX, 1.6, -3, 56);
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：長い年月が過ぎた。いじめた側は幸せに
  base(); S.aim(PX, -1); lift(-40); S.hemi.intensity = 0.8; S.key.intensity = 0.7; S.darken(0.4, '#0e0c10');
  w3.userData.head.rotation.x = -0.15;
  tYears.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tYears.visible = false;
  tHappy.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(PX + lerp(0.6, 0.3, u), lerp(2.3, 2.5, u), lerp(3.8, 3.0, u), PX, 2.4, -2.9, 58);
  return qs;
}
function shotStudio(t) { // 4段目 25〜33：リーダーは今やお天気キャスター。復讐の相手は全員
  base(); S.aim(WX, -1); lift(-40); S.hemi.intensity = 1.2;
  ANCHOR.userData.arms[1].rotation.x = -1.2; ANCHOR.userData.arms[1].rotation.z = -0.5 + Math.sin(t * 1.4) * 0.15; ANCHOR.userData.head.rotation.y = 0.2;
  ONAIR.userData.pop(1); ONAIR.visible = Math.sin(t * 4) > -0.3;
  tCaster.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCaster.visible = false;
  tAll.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(WX + lerp(-0.2, -0.4, u), lerp(2.2, 2.1, u), lerp(4.6, 4.0, u), WX - 0.6, 1.25, -2, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年の韓国ドラマ。全16話。静かで周到な復讐
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  t16.userData.pop((t - 4.2) / 0.35); tRev.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.8, 7.0, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotSchool(t, quiz = 0) { // 6段目 42〜49（決め手）：加害者の娘の担任に。白と黒の碁石
  base(); S.aim(DX, -1); lift(-30); S.hemi.intensity = 1.25;
  T6.userData.arms[0].rotation.x = -1.6; T6.userData.head.rotation.y = 0.3;
  STONES.forEach((s, i) => { s.visible = !quiz || i < 16; });
  if (!quiz) { tHomeroom.userData.pop((t - 0.4) / 0.35); tGo.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(DX + lerp(0.5, 0.3, u), lerp(2.6, 2.5, u), lerp(6.8, 6.2, u), DX, 1.3, -1.4, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（碁盤のアップ）
  shotSchool(7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.2, d); S.key.intensity = lerp(1.5, 0.2, d);
  S.spot.color.set(0xfff0d8); S.spot.position.set(DX + 0.9, 4.5, 3.3); S.spot.target.position.set(DX + 0.9, 0.7, 1.4); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(DX + 0.9 + lerp(0.4, 0.2, k), lerp(2.2, 1.9, k), lerp(3.6, 3.2, k), DX + 0.9, 0.75, 1.4, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotClass },
  { a: 9, b: 17, f: shotGate },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotStudio },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotSchool(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '高校の同級生からの、<br>ひどいいじめ。'],
  [5.6, 9.0, '誰にも、<br>助けてもらえなかった。'],
  [9.2, 13.2, '少女は、学校を<br>去るしかなかった。'],
  [13.2, 17.0, 'その日から、<br>人生をかけた計画が始まる。'],
  [17.2, 21.0, '長い年月が過ぎ、<br>少女は大人になった。'],
  [21.0, 25.0, 'いじめた側は、何もなかった<br>ように幸せに暮らしている。'],
  [25.2, 29.0, 'リーダーは今や、<br>テレビのお天気キャスター。'],
  [29.0, 33.0, '復讐の相手は、<br>あのときの全員。'],
  [33.2, 37.4, '2022年の韓国ドラマ。<br>全16話。'],
  [37.4, 41.8, '静かで、周到な、<br>復讐の物語。'],
  [42.2, 45.4, '彼女は、加害者の娘の<br>担任の先生になる。'],
  [45.4, 49.0, '白と黒の碁石が、<br>物語の鍵。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ザ・グローリー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q055', v2: true, answer: 'ザ・グローリー ～輝かしき復讐～',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 5555,
    hits: [5.6, 13.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'drone'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '高校': 'こうこう', '同級生': 'どうきゅうせい', '誰にも': 'だれにも', '助けて': 'たすけて', '少女': 'しょうじょ', '学校': 'がっこう', '去る': 'さる', '人生': 'じんせい', '計画': 'けいかく', '始まる': 'はじまる', '長い年月': 'ながいねんげつ', '過ぎ': 'すぎ', '大人': 'おとな', '側': 'がわ', '幸せ': 'しあわせ', '暮らしている': 'くらしている', '今や': 'いまや', 'お天気': 'おてんき', '復讐': 'ふくしゅう', '相手': 'あいて', '全員': 'ぜんいん', '2022年': 'にせんにじゅうにねん', '韓国': 'かんこく', '全16話': 'ぜんじゅうろくわ', '静か': 'しずか', '周到': 'しゅうとう', '物語': 'ものがたり', '彼女': 'かのじょ', '加害者': 'かがいしゃ', '娘': 'むすめ', '担任': 'たんにん', '先生': 'せんせい', '白と黒': 'しろとくろ', '碁石': 'ごいし', '鍵': 'かぎ', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n高校の同級生からの、ひどいいじめ。誰にも、助けてもらえなかった。少女は、学校を去るしかなかった。その日から、人生をかけた計画が始まる。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'サスペンス'],
  },
});
applyQuizCards({ answer: 'ザ・グローリー<br><span style="font-size:64px">～輝かしき復讐～</span>', info: 'Netflix｜韓国ドラマ・全16話', answerSize: 116 });
