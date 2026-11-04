import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #046 7番房の奇跡（映画・韓国・2013年／日本公開2014年・127分・ヒューマンドラマ。Prime Video・Hulu・U-NEXT で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/7beonbangyi-seonmul）で2026/11/4確認。Filmarks 4.2・レビュー85,130件 filmarks.com/movies/56140）
// 確かめた事実（ja.wikipedia「7番房の奇跡」・en.wikipedia「Miracle in Cell No. 7」。2026/11/4）：
//   ・知的年齢が6歳程度の父イ・ヨングは、しっかり者の娘イェスンを愛情深く育てていた。店のかばん（セーラームーンのかばん）を給料が出たら買うと娘に約束していた
//   ・ある日、身に覚えのない罪で逮捕され、刑務所の7番房へ。同房の囚人たちは最初は乱暴だが、彼の純真さに触れて変わり、娘を房に連れてくる作戦を立てる
//   ・韓国で1,281万人以上を動員。日本公開2014年1月25日
// 構成（ヒント6段）：1 ショーウィンドウのかばんを毎日ながめる父と娘・買ってあげる約束だった → 2 子どもの心を持つ父・しっかり者の娘とふたり暮らし
//   → 3 身に覚えのない罪で逮捕・こわもてだらけの雑居房 → 4 もう一度娘に会いたい・仲間たちの作戦 → 5 2013年の韓国映画・韓国で1200万人以上
//   → 6 決め手：房の番号は7番、父と娘の涙の物語
// 事件の中身・裁判・結末には絶対に触れない。人物名・キャラクター名・ブランドは字幕にも札にも出さない。作品の映像・俳優・ポスター・
//   有名な場面の構図（気球・面会の場面など）は使わない。人と部屋は汎用の3D

const S = quizStage({ bg: '#2a2e3a', floor: '#3a3a40', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(4646);

const DAD = { skin: '#ecc9a6', hair: '#1a1a1a', shirt: '#7a8aa0', pants: '#3a3a44' };
const GIRL = { skin: '#f2d4b8', hair: '#1a1a1a', shirt: '#f2c14e', pants: '#e86a8a', long: true, skirt: true, scale: 0.58 };
const CON = (i) => ({ skin: ['#e8c4a0', '#d8a880', '#ecc9a6', '#c8946a', '#e0b890'][i % 5], hair: ['#1a1a1a', '#2a2420', '#3a3a3a', '#1a1a1a', '#4a3a2a'][i % 5], shirt: '#5a6a5a', pants: '#4a5a4a', bald: i === 2 });

// ---------- 1段目. 夕方の商店街（x=0）。ショーウィンドウのかばん ----------
{ const fl = box(12, 0.04, 9, mat('#5a5048')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(12, 7, 0.4, mat('#8a6a4e')); wl.position.set(0, 3.5, -3.6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshBasicMaterial({ color: '#fff2d8' })); win.position.set(0, 1.9, -3.38); qs.add(win);
  const fr = box(3.6, 0.12, 0.2, mat('#3a2a20')); fr.position.set(0, 3.05, -3.3); qs.add(fr); const fr2 = fr.clone(); fr2.position.y = 0.78; qs.add(fr2);
  const aw = box(4.4, 0.12, 1.2, mat('#c84a3a')); aw.position.set(0, 3.5, -2.9); aw.rotation.x = 0.25; qs.add(aw);
  for (const x of [-1.2, 1.2]) { const sh = box(0.8, 0.06, 0.4, mat('#c8b890')); sh.position.set(x, 1.3, -3.25); qs.add(sh); const b = box(0.4, 0.4, 0.2, mat(x < 0 ? '#4fa3d1' : '#8a5a3a')); b.position.set(x, 1.55, -3.25); qs.add(b); } }
const BAG = new THREE.Group(); { const b = box(0.62, 0.7, 0.3, mat('#f2c14e')); BAG.add(b); const fl = box(0.64, 0.36, 0.06, mat('#e86a8a')); fl.position.set(0, 0.17, 0.17); BAG.add(fl); const st = new THREE.Mesh(new THREE.CircleGeometry(0.09, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' })); st.position.set(0, 0.17, 0.205); BAG.add(st); } BAG.position.set(0, 1.85, -3.2); qs.add(BAG);
const BAGLIGHT = new THREE.PointLight(0xfff0c8, 0, 4, 1.3); BAGLIGHT.position.set(0, 2.6, -2.4); qs.add(BAGLIGHT);
const dad1 = makePerson(DAD); dad1.position.set(-0.45, 0, -1.4); dad1.rotation.y = Math.PI; qs.add(dad1);
const girl1 = makePerson(GIRL); girl1.position.set(0.35, 0, -1.4); girl1.rotation.y = Math.PI; qs.add(girl1);
const tLook = tag('毎日ながめる かばん', { size: 64, w: 620, bg: '#14161c', sx: 1.8 }); tLook.position.set(0, 2.5, -2.2); qs.add(tLook);
const tPromise = tag('買ってあげる約束', { size: 70, w: 560, bg: '#e86a8a', sx: 1.8 }); tPromise.position.set(0, 2.5, -2.2); qs.add(tPromise);

// ---------- 2段目. 小さな家（x=40）。ちゃぶ台で笑う父と娘 ----------
const KX = 40;
{ const fl = box(8, 0.04, 7, mat('#b89a6a')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(9, 6, 0.2, mat('#d8c8a8')); wl.position.set(KX, 3, -3.6); qs.add(wl);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24), mat('#7a4a2a')); tb.position.set(KX, 0.4, -1.2); qs.add(tb); const lg = box(0.1, 0.36, 0.1, mat('#5a3a20')); lg.position.set(KX, 0.2, -1.2); qs.add(lg);
  for (let i = 0; i < 2; i++) { const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.1, 14), mat('#f4f4f0')); bw.position.set(KX - 0.3 + i * 0.6, 0.49, -1.2); qs.add(bw); }
  const dr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(180, 140, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.lineWidth = 5; g.strokeStyle = '#e2483c'; g.beginPath(); g.arc(60, 70, 22, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#4fa3d1'; g.beginPath(); g.arc(120, 74, 14, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#3a3a3a'; g.beginPath(); g.moveTo(60, 92); g.lineTo(60, 128); g.moveTo(120, 88); g.lineTo(120, 120); g.stroke(); g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(150, 26, 14, 0, Math.PI * 2); g.fill(); }) })); dr.position.set(KX + 1.2, 2.2, -3.48); qs.add(dr); }
const dad2 = makePerson(DAD); dad2.position.set(KX - 0.75, -0.42, -1.2); dad2.rotation.y = Math.PI / 2; dad2.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(dad2);
const girl2 = makePerson(GIRL); girl2.position.set(KX + 0.75, -0.02, -1.2); girl2.rotation.y = -Math.PI / 2; girl2.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(girl2);
const tChild = tag('心は 子どものまま', { size: 70, w: 560, bg: '#14161c', sx: 1.6 }); tChild.position.set(KX, 1.8, -1.4); qs.add(tChild);
const tTwo = tag('しっかり者の娘と ふたり', { size: 58, w: 660, bg: '#f2c14e', color: '#14161c', sx: 1.7 }); tTwo.position.set(KX, 1.8, -1.4); qs.add(tTwo);

// ---------- 3段目. 刑務所の雑居房（x=90）。こわもての囚人たち ----------
const CX = 90;
function cell(cx, cz) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); qs.add(g);
  const fl = box(7, 0.04, 6, mat('#6a6a62')); fl.position.set(0, 0.02, -1); g.add(fl);
  const wl = box(7, 4, 0.2, mat('#8a8a80')); wl.position.set(0, 2, -4); g.add(wl);
  for (const s of [-1, 1]) { const sw = box(0.2, 4, 6, mat('#7a7a70')); sw.position.set(s * 3.5, 2, -1); g.add(sw); }
  const hw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: '#c8d8e8' })); hw.position.set(1.4, 3.2, -3.88); g.add(hw);
  for (let i = 0; i < 4; i++) { const b = box(0.05, 0.5, 0.05, mat('#3a3a3a')); b.position.set(1.1 + i * 0.2, 3.2, -3.86); g.add(b); }
  const mat1 = box(1.8, 0.1, 0.9, mat('#5a6a7a')); mat1.position.set(-2.0, 0.08, -3.2); g.add(mat1);
  return g;
}
cell(CX, 0);
const CONS = []; for (let i = 0; i < 5; i++) { const p = makePerson(CON(i)); const a = (i / 4) * Math.PI * 0.9 + Math.PI * 0.05; p.position.set(CX - 2.2 + i * 1.1, -0.42, -2.6 + Math.sin(a) * 0.4); p.userData.legs.forEach(l => l.rotation.x = -1.5); p.userData.arms.forEach(a2 => a2.rotation.x = -0.9); qs.add(p); CONS.push(p); }
const dad3 = makePerson({ ...DAD, shirt: '#5a6a5a', pants: '#4a5a4a' }); dad3.position.set(CX, 0, 1.2); dad3.rotation.y = Math.PI; qs.add(dad3);
const BARS = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 8), mat('#2a2a2e')); b.position.set(CX - 3.3 + i * 0.6, 2, 2.0); qs.add(b); BARS.push(b); }
const tCell = tag('身に覚えのない罪', { size: 70, w: 560, bg: '#b23a3a', sx: 2.2 }); tCell.position.set(CX, 2.7, -0.4); qs.add(tCell);
const tTough = tag('こわもてだらけの雑居房', { size: 58, w: 700, bg: '#14161c', sx: 2.5 }); tTough.position.set(CX, 2.7, -0.4); qs.add(tTough);

// ---------- 4段目. 夜の房（x=130）。輪になって作戦会議 ----------
const BX = 130;
cell(BX, 0);
const PLAN = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(240, 180, (g, w, h) => { g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3a3a'; g.lineWidth = 3; g.strokeRect(20, 20, 90, 60); g.strokeRect(130, 20, 90, 60); g.strokeRect(20, 100, 200, 60); g.strokeStyle = '#e2483c'; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(40, 150); g.lineTo(120, 130); g.lineTo(175, 60); g.stroke(); g.setLineDash([]); g.fillStyle = '#e2483c'; g.beginPath(); g.arc(175, 55, 9, 0, Math.PI * 2); g.fill(); }) })); PLAN.rotation.x = -Math.PI / 2; PLAN.position.set(BX, 0.08, -1.4); qs.add(PLAN);
const RING4 = []; for (let i = 0; i < 6; i++) { const p = makePerson(i === 5 ? { ...DAD, shirt: '#5a6a5a', pants: '#4a5a4a' } : CON(i)); const a = i / 6 * Math.PI * 2 + 0.5; p.position.set(BX + Math.cos(a) * 1.25, -0.42, -1.4 + Math.sin(a) * 1.0); p.rotation.y = -a - Math.PI / 2; p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); RING4.push(p); }
const BULB = new THREE.PointLight(0xffe0a0, 0, 7, 1.4); BULB.position.set(BX, 3.2, -1.4); qs.add(BULB);
{ const bl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); bl.position.set(BX, 3.4, -1.4); qs.add(bl); }
const tMeet = tag('もう一度 娘に会いたい', { size: 62, w: 640, bg: '#14161c', sx: 1.7 }); tMeet.position.set(BX, 1.9, -1.4); qs.add(tMeet);
const tPlan = tag('房の仲間たちの 作戦', { size: 62, w: 620, bg: '#4fa3d1', sx: 1.7 }); tPlan.position.set(BX, 1.9, -1.4); qs.add(tPlan);

// ---------- 5段目. 満員の映画館（x=170）。2013年の韓国映画 ----------
const FX = 170;
{ const scr = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), new THREE.MeshBasicMaterial({ map: canvasTex(360, 168, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4e8d0'); gr.addColorStop(1, '#e8d0b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(226,72,60,.85)'; g.beginPath(); g.arc(150, 84, 46, Math.PI, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(46,92,170,.85)'; g.beginPath(); g.arc(150, 84, 46, 0, Math.PI); g.fill(); g.fillStyle = '#3a2a20'; g.fillRect(230, 50, 10, 70); g.fillRect(260, 70, 8, 50); }) })); scr.position.set(FX, 3.6, -6); qs.add(scr); }
const SEATS = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const p = makePerson({ skin: '#1a1a20', hair: '#121216', shirt: '#1a1a20', pants: '#1a1a20', long: (r + c) % 3 === 0 }); p.position.set(FX - 4 + c * 1.0 + (r % 2) * 0.5, -0.42 + r * 0.35, -2 + r * 1.2); p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); SEATS.push(p); }
const tKR = tag('2013年 韓国映画', { size: 70, w: 560, bg: '#e2483c', sx: 3.0 }); tKR.position.set(FX, 6.4, -4); qs.add(tKR);
const tMil = tag('韓国で 1200万人以上', { size: 62, w: 640, bg: '#14161c', sx: 3.2 }); tMil.position.set(FX, 6.4, -4); qs.add(tMil);

// ---------- 6段目. 房の扉（x=210）。7の札と、手をつなぐ父と娘 ----------
const NX = 210;
{ const wl = box(10, 7, 0.4, mat('#8a8a80')); wl.position.set(NX, 3.5, -3); qs.add(wl); const fl = box(10, 0.04, 8, mat('#6a6a62')); fl.position.set(NX, 0.02, 0); qs.add(fl);
  const door = box(2.2, 3.2, 0.2, mat('#4a5a6a')); door.position.set(NX, 1.6, -2.75); qs.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ color: '#1a1a20' })); win.position.set(NX, 2.5, -2.64); qs.add(win);
  for (let i = 0; i < 4; i++) { const b = box(0.04, 0.4, 0.04, mat('#c8c8c8')); b.position.set(NX - 0.3 + i * 0.2, 2.5, -2.62); qs.add(b); } }
const PLATE = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(200, 200, (g, w, h) => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2a2a'; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#b23a3a'; g.font = 'bold 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', w / 2, h / 2 + 8); }) })); PLATE.position.set(NX + 1.8, 2.7, -2.76); qs.add(PLATE);
const dad6 = makePerson({ ...DAD, shirt: '#5a6a5a', pants: '#4a5a4a' }); dad6.position.set(NX + 0.05, 0, 0.4); qs.add(dad6);
const girl6 = makePerson(GIRL); girl6.position.set(NX + 0.7, 0, 0.4); qs.add(girl6);
const BAG6 = BAG.clone(); BAG6.scale.setScalar(0.55); BAG6.position.set(NX + 0.7, 0.78, 0.22); qs.add(BAG6);
const HEARTS = []; for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, -0.15); s.bezierCurveTo(-0.25, 0.03, -0.15, 0.2, 0, 0.09); s.bezierCurveTo(0.15, 0.2, 0.25, 0.03, 0, -0.15); return s; })()), new THREE.MeshBasicMaterial({ color: '#ff8aa0', side: THREE.DoubleSide, transparent: true })); h.userData.o = i / 6; qs.add(h); HEARTS.push(h); }
const tSeven = tag('房の番号は 7番', { size: 74, w: 520, bg: '#b23a3a', sx: 2.4 }); tSeven.position.set(NX + 0.5, 3.75, -1.6); qs.add(tSeven);
const tTear = tag('父と娘の 涙の物語', { size: 66, w: 600, bg: '#14161c', sx: 2.6 }); tTear.position.set(NX + 0.5, 3.75, -1.6); qs.add(tTear);

// ---------- shots ----------
const ALL = [tLook, tPromise, tChild, tTwo, tCell, tTough, tMeet, tPlan, tKR, tMil, tSeven, tTear];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BAGLIGHT.intensity = 0; BULB.intensity = 0; HEARTS.forEach(h => h.visible = false); }

function shotShop(t) { // 1段目 0〜9：ショーウィンドウのかばんを、毎日ながめる父と娘。給料が出たら、買ってあげる約束だった（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.9; S.darken(0.25, '#3a2a30');
  BAGLIGHT.intensity = 6; BAG.rotation.y = Math.sin(t * 0.8) * 0.25;
  dad1.userData.head.rotation.x = -0.05; girl1.userData.head.rotation.x = -0.25;
  dad1.userData.arms[1].rotation.x = t > 4.8 ? -0.5 : 0; girl1.userData.arms[0].rotation.x = t > 4.8 ? -0.5 : -0.9 + 0.2 * Math.sin(t * 4);
  if (t > 4.8) { dad1.userData.head.rotation.y = -0.5; girl1.userData.head.rotation.y = 0.5; girl1.userData.head.rotation.x = -0.4; }
  tLook.userData.pop(1); if (t > 4.6) tLook.visible = false;
  tPromise.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(1.9, 1.9, u), lerp(2.8, 2.2, u), 0, 1.6, -3.2, 58);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：父は、6歳くらいの子どもの心を持つ。しっかり者の娘と、ふたり暮らし
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.25; S.darken(0.05, '#e8c8a0');
  const b = Math.max(0, Math.sin(t * 6)) * 0.05; dad2.position.y = -0.42 + b; dad2.userData.head.rotation.x = -0.2 + 0.15 * Math.sin(t * 6); dad2.userData.arms[1].rotation.x = -1.2 + 0.3 * Math.sin(t * 6);
  girl2.userData.arms[0].rotation.x = -0.9; girl2.userData.head.rotation.z = 0.1 * Math.sin(t * 3);
  tChild.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tChild.visible = false;
  tTwo.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.3, 0.1, u), lerp(1.5, 1.45, u), lerp(2.9, 2.5, u), KX, 0.45, -1.2, 58);
  return qs;
}
function shotCell(t) { // 3段目 17〜25：ある日、身に覚えのない罪で逮捕された。送られたのは、こわもてだらけの雑居房
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 0.8; S.darken(0.3, '#1a1c20');
  const w = ease(clamp(t / 3)); dad3.position.z = lerp(1.6, 0.2, w); const ph = t * 7; dad3.userData.legs[0].rotation.x = Math.sin(ph) * 0.4 * (1 - w); dad3.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4 * (1 - w); dad3.userData.head.rotation.x = 0.2;
  CONS.forEach((p, i) => { p.userData.head.rotation.x = 0.1; p.userData.head.rotation.y = t > 4.2 ? Math.sin(i) * 0.2 : 0; });
  tCell.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tCell.visible = false;
  tTough.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(2.2, 2.4, u), lerp(4.6, 3.8, u), CX, 1.2, -1.8, 60);
  return qs;
}
function shotPlan(t) { // 4段目 25〜33：父の願いは、もう一度、娘に会うこと。同じ房の仲間たちが、ある作戦を立てる
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.6, '#08080c');
  BULB.intensity = 10;
  RING4.forEach((p, i) => { p.userData.head.rotation.x = 0.4; p.userData.arms[i % 2].rotation.x = -1.0 - 0.2 * Math.sin(t * 3 + i); });
  tMeet.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tMeet.visible = false;
  tPlan.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.4, 0, u), lerp(3.4, 3.1, u), lerp(2.6, 2.0, u), BX, 0.6, -1.4, 58);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2013年の、韓国映画。韓国で、1200万人以上が観た
  base(); S.aim(FX, -2); lift(-30); S.hemi.intensity = 0.6; S.darken(0.6, '#08080c');
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  tMil.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, lerp(3.4, 3.8, u), lerp(6.4, 5.8, u), FX, 3.4, -5, 58);
  return qs;
}
function shotDoor(t, quiz = 0) { // 6段目 42〜49（決め手）：房の番号は、7番。父と娘の、涙の物語
  base(); S.aim(NX, -1); lift(-30); S.hemi.intensity = 0.9; S.darken(0.2, '#2a2420');
  dad6.userData.arms[0].rotation.x = -0.25; girl6.userData.arms[1].rotation.x = -0.6; dad6.userData.head.rotation.x = 0.3; dad6.userData.head.rotation.y = -0.4; girl6.userData.head.rotation.x = -0.4; girl6.userData.head.rotation.y = 0.4;
  HEARTS.forEach((h, i) => { h.visible = !quiz; const k = (t * 0.25 + h.userData.o) % 1; h.position.set(NX + 0.4 + Math.sin(k * 7 + i) * 0.6, 2.1 + k * 1.4, 0.6); h.material.opacity = 1 - k; });
  if (!quiz) { tSeven.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tSeven.visible = false; tTear.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.7, 0.5, u), lerp(1.5, 1.6, u), lerp(4.0, 3.5, u), NX + 0.5, 2.15, -1.5, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（手をつなぐ父と娘）
  shotDoor(t + 7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.9, 0.2, d);
  S.spot.color.set(0xffe8c8); S.spot.position.set(NX + 0.4, 6, 3.4); S.spot.target.position.set(NX + 0.4, 0.8, 0.4); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.8, 0.5, k), lerp(1.5, 1.4, k), lerp(3.8, 3.2, k), NX + 0.4, 1.1, 0.4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotShop },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotCell },
  { a: 25, b: 33, f: shotPlan },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: (t) => shotDoor(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ショーウィンドウのかばんを、<br>毎日ながめる父と娘。'],
  [5.6, 9.0, '給料が出たら、<br>買ってあげる約束だった。'],
  [9.2, 13.2, '父は、6歳くらいの<br>子どもの心を持つ。'],
  [13.2, 17.0, 'しっかり者の娘と、<br>ふたり暮らし。'],
  [17.2, 21.0, 'ある日、身に覚えのない罪で<br>逮捕された。'],
  [21.0, 25.0, '送られたのは、<br>こわもてだらけの雑居房。'],
  [25.2, 29.0, '父の願いは、もう一度、<br>娘に会うこと。'],
  [29.0, 33.0, '同じ房の仲間たちが、<br>ある作戦を立てる。'],
  [33.2, 37.4, '2013年の、<br>韓国映画。'],
  [37.4, 41.8, '韓国で、1200万人以上が<br>観た。'],
  [42.2, 45.4, '房の番号は、<br>7番。'],
  [45.4, 49.0, '父と娘の、<br>涙の物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、7番房の奇跡。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q046', v2: true, answer: '7番房の奇跡',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 4646,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [4.8, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '7番房の奇跡': 'ななばんぼうのきせき', '7番': 'ななばん', '6歳': 'ろくさい', '2013年': 'にせんじゅうさんねん', '1200万人以上': 'せんにひゃくまんにんいじょう', 'ショーウィンドウ': 'ショーウィンドウ', '毎日': 'まいにち', '父と娘': 'ちちとむすめ', '給料': 'きゅうりょう', '約束': 'やくそく', '子どもの心': 'こどものこころ', 'しっかり者': 'しっかりもの', 'ふたり暮らし': 'ふたりぐらし', '身に覚えのない罪': 'みにおぼえのないつみ', '逮捕': 'たいほ', '送られた': 'おくられた', 'こわもて': 'こわもて', '雑居房': 'ざっきょぼう', '願い': 'ねがい', 'もう一度': 'もういちど', '娘に会う': 'むすめにあう', '同じ房': 'おなじぼう', '仲間': 'なかま', '作戦': 'さくせん', '立てる': 'たてる', '韓国映画': 'かんこくえいが', '韓国で': 'かんこくで', '観た': 'みた', '房の番号': 'ぼうのばんごう', '涙の物語': 'なみだのものがたり', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nショーウィンドウのかばんを、毎日ながめる父と娘。給料が出たら、買ってあげる約束だった。父は、6歳くらいの子どもの心を持つ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '韓国映画', '泣ける映画'],
  },
});
applyQuizCards({ answer: '7番房の奇跡', info: 'Prime Video・Hulu｜韓国映画・127分', answerSize: 124 });
