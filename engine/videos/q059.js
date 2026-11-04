import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #059 半沢直樹（ドラマ・日本・2013年・TBS 日曜劇場・全10話。U-NEXTで見放題、
//   justwatch.com/jp/テレビ番組/ban-ze-zhi-shu で2026/11/4確認。Filmarks 2013年版 4.3・レビュー31,644件 filmarks.com/dramas/1867/3411）
// 確かめた事実（Filmarks の各話タイトル・ja.wikipedia.org/wiki/半沢直樹。2026/11/4）：
//   ・主人公は大手銀行の支店の融資課長。支店長が押し切って無担保で5億円を融資、相手の会社は粉飾決算が発覚して倒産し、融資が焦げ付く
//   ・支店長はその責任を主人公に押し付けようとした。第1話「5億を取り戻せるか？」「出世か？友情か？」
//   ・決め台詞「やられたらやり返す、倍返しだ!!」が流行語に。最終回の視聴率は42.2%
//   ・TBS系 日曜劇場、2013年7月7日〜9月22日、全10話。原作 池井戸潤
// 構成（ヒント6段）：1 5億円の融資が焦げ付いた、取引先が倒産 → 2 銀行の融資課長、責任を押しつけられる → 3 大きな銀行の支店、出世か友情か
//   → 4 5億円を自分で取り戻す、相手が上司でも → 5 2013年の日本のドラマ・全10話、最終回42.2% → 6 決め手：やられたらやり返す、倍返しだ
// 「倍返し」は6段目まで出さない。銀行名・支店名・人物名・地名・社名は出さない。結末（土下座など）は言わない。俳優・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1e2430', floor: '#2a2e38', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5959);

const HERO = { skin: '#eccaa8', hair: '#141414', shirt: '#2a3044', pants: '#1e2026', tie: true };
const CHIEF = { skin: '#e8c4a0', hair: '#5a5a5a', shirt: '#3a3a3e', pants: '#2a2a2e', tie: true, scale: 1.05 };
const SUIT = (i) => ({ skin: '#eccaa8', hair: ['#1a1614', '#3a3a3a', '#6a6a6a', '#2a2420'][i % 4], shirt: ['#2a3044', '#3a3a40', '#2a2e36', '#40404a'][i % 4], pants: '#1e2026', tie: true });

// ---------- 1段目. 夜の会議室（x=0）。積まれた札束が崩れ、赤い矢印が落ちる ----------
{ const fl = box(12, 0.04, 10, mat('#3a3a40')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#4a4e58')); wl.position.set(0, 3, -4); qs.add(wl);
  const tb = box(3.4, 0.08, 1.4, mat('#5a4030')); tb.position.set(0, 0.9, -1.2); qs.add(tb); for (const x of [-1.5, 1.5]) { const lg = box(0.1, 0.9, 1.2, mat('#3a2a20')); lg.position.set(x, 0.45, -1.2); qs.add(lg); }
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(360, 220, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c4ba'; g.lineWidth = 2; for (let y = 30; y < h; y += 30) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); } g.strokeStyle = '#d83a32'; g.lineWidth = 8; g.beginPath(); g.moveTo(20, 40); g.lineTo(120, 60); g.lineTo(200, 50); g.lineTo(260, 150); g.lineTo(340, 200); g.stroke(); }) })); chart.position.set(0, 3.0, -3.88); qs.add(chart); }
const CASH = []; for (let i = 0; i < 30; i++) { const c = box(0.36, 0.08, 0.18, mat(['#c8b888', '#d8c898', '#b8a878'][i % 3])); c.userData = { x: -0.8 + (i % 5) * 0.4, y: 0.98 + Math.floor(i / 10) * 0.09, z: -1.4 + (Math.floor(i / 5) % 2) * 0.22, vx: (R() - 0.5) * 1.6, vz: 0.6 + R() * 1.2, vr: (R() - 0.5) * 6, o: R() }; qs.add(c); CASH.push(c); }
const ARROW = new THREE.Group(); qs.add(ARROW);
{ const sh = box(0.3, 1.6, 0.1, new THREE.MeshBasicMaterial({ color: '#e2483c' })); sh.position.y = 0.6; ARROW.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 3), new THREE.MeshBasicMaterial({ color: '#e2483c' })); hd.rotation.z = Math.PI; hd.position.y = -0.4; ARROW.add(hd); }
const h1 = makePerson(HERO); h1.position.set(-0.95, 0, 0.4); h1.rotation.y = 2.6; qs.add(h1);
const t5 = tag('5億円の融資が、焦げついた', { size: 56, w: 760, bg: '#e2483c', sx: 2.2 }); t5.position.set(0, 2.05, -0.6); qs.add(t5);
const tBank = tag('取引先が、倒産', { size: 70, w: 480, bg: '#14161c', sx: 1.6 }); tBank.position.set(0, 2.05, -0.6); qs.add(tBank);

// ---------- 2段目. 支店長室（x=40）。責任を押しつけられる課長 ----------
const OX = 40;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(OX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#d8d0c0')); wl.position.set(OX, 3, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), new THREE.MeshBasicMaterial({ color: '#8aa8c8' })); win.position.set(OX, 3.0, -3.88); qs.add(win);
  const desk = box(2.6, 0.9, 1.0, mat('#4a3020')); desk.position.set(OX + 0.6, 0.45, -2.2); qs.add(desk); }
const chief = makePerson(CHIEF); chief.position.set(OX + 0.8, 0, -1.4); chief.rotation.y = -0.5; qs.add(chief);
const h2 = makePerson(HERO); h2.position.set(OX - 0.9, 0, -0.4); h2.rotation.y = 0.6; qs.add(h2);
const PAPERS = []; for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), new THREE.MeshBasicMaterial({ map: canvasTex(64, 90, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8b4aa'; for (let y = 14; y < h - 8; y += 9) g.fillRect(6, y, w - 12, 2); g.strokeStyle = '#d83a32'; g.lineWidth = 3; g.strokeRect(w - 20, 6, 14, 14); }), side: THREE.DoubleSide })); p.userData.o = i; qs.add(p); PAPERS.push(p); }
const tLoan = tag('銀行の融資課長', { size: 70, w: 500, bg: '#14161c', sx: 1.45 }); tLoan.position.set(OX - 0.5, 2.55, -0.4); qs.add(tLoan);
const tBlame = tag('責任を押しつけられた', { size: 60, w: 620, bg: '#e2483c', sx: 1.6 }); tBlame.position.set(OX - 0.2, 2.55, -0.4); qs.add(tBlame);

// ---------- 3段目. 銀行の支店のフロア（x=80）。ささやき合う行員たち ----------
const BX = 80;
{ const fl = box(18, 0.04, 14, mat('#c8c4bc')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  const wl = box(18, 6, 0.2, mat('#e8e4dc')); wl.position.set(BX, 3, -9); qs.add(wl);
  const ctr = box(10, 1.1, 0.8, mat('#6a5a4a')); ctr.position.set(BX, 0.55, -2.6); qs.add(ctr); const top = box(10.2, 0.06, 0.9, mat('#3a3030')); top.position.set(BX, 1.12, -2.6); qs.add(top);
  for (let i = 0; i < 5; i++) { const d = box(1.4, 0.75, 0.7, mat('#8a7a6a')); d.position.set(BX - 4 + i * 2, 0.37, -5.4); qs.add(d); const pc = box(0.5, 0.36, 0.05, mat('#2a2e38')); pc.position.set(BX - 4 + i * 2, 0.95, -5.5); qs.add(pc); }
  for (let i = 0; i < 3; i++) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshBasicMaterial({ color: '#2a4a7a' })); sg.position.set(BX - 3 + i * 3, 3.6, -8.88); qs.add(sg); } }
const CLERKS = []; for (let i = 0; i < 8; i++) { const p = makePerson(SUIT(i)); p.position.set(BX - 4.2 + (i % 4) * 2.8 + (i > 3 ? 1.2 : 0), 0, -4.4 - (i > 3 ? 2 : 0) + (i % 2) * 0.3); p.rotation.y = (i % 2 ? -0.7 : 0.7); qs.add(p); CLERKS.push(p); }
const h3 = makePerson(HERO); h3.position.set(BX, 0, -0.8); qs.add(h3);
const tBr = tag('大きな銀行の支店', { size: 64, w: 560, bg: '#14161c', sx: 2.4 }); tBr.position.set(BX, 3.3, -2); qs.add(tBr);
const tFr = tag('出世か、友情か', { size: 70, w: 500, bg: '#e6b450', color: '#14161c', sx: 2.3 }); tFr.position.set(BX, 3.3, -2); qs.add(tFr);

// ---------- 4段目. 夜の廊下を進む課長（x=120）。5億円を取り戻す ----------
const CX = 120;
{ const fl = box(6, 0.04, 40, mat('#3a3a42')); fl.position.set(CX, 0.02, -14); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 5, 40, mat('#5a5e68')); wl.position.set(CX + s * 3, 2.5, -14); qs.add(wl); }
  for (let i = 0; i < 9; i++) { const lp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: '#ffe0a8' })); lp.position.set(CX, 4.9, 2 - i * 4); qs.add(lp); }
  const door = box(2.4, 3.4, 0.2, mat('#4a3020')); door.position.set(CX, 1.7, -24); qs.add(door); }
const h4 = makePerson(HERO); h4.position.set(CX, 0, 0); qs.add(h4);
const FILE = box(0.32, 0.42, 0.06, mat('#c8a050')); qs.add(FILE);
const tBack = tag('5億円を、取り戻す', { size: 64, w: 560, bg: '#14161c', sx: 1.5 }); qs.add(tBack);
const tBoss = tag('相手が、上司でも', { size: 66, w: 540, bg: '#e2483c', sx: 1.5 }); qs.add(tBoss);

// ---------- 5段目. テレビの前（x=160）。2013年の日本のドラマ・全10話・最終回42.2% ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a22' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a4a6a'); gr.addColorStop(1, '#121620'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.88)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(46 + (i % 5) * 105, 100 + Math.floor(i / 5) * 90, 22, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const BAR = new THREE.Group(); BAR.position.set(TX + 2.0, 0, -0.4); qs.add(BAR);
const BARM = box(0.6, 1, 0.3, mat('#e2483c')); BAR.add(BARM);
const tJP = tag('2013年 日本のドラマ', { size: 62, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const t10 = tag('全10話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t10.position.set(TX, 4.6, -1.2); qs.add(t10);
const t42 = tag('最終回の視聴率 42.2%', { size: 58, w: 680, bg: '#e2483c', sx: 3.0 }); t42.position.set(TX, 3.75, -1.0); qs.add(t42);

// ---------- 6段目. 指を突きつける課長（x=200）。赤い光が走る ----------
const DX = 200;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#6a1a1a'); gr.addColorStop(1, '#0e0608'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,90,60,.45)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 20, h / 2 + Math.sin(a) * 20); g.lineTo(w / 2 + Math.cos(a) * w, h / 2 + Math.sin(a) * w); g.stroke(); } }) })); bg.position.set(DX, 4, -4); qs.add(bg); }
const h6 = makePerson(HERO); h6.position.set(DX, 0, 0.6); qs.add(h6);
const tYara = tag('やられたら、やり返す', { size: 62, w: 620, bg: '#14161c', sx: 1.7 }); tYara.position.set(DX, 2.85, 0.4); qs.add(tYara);
const tBai = tag('倍返しだ！', { size: 96, w: 520, bg: '#e2483c', sx: 1.6 }); tBai.position.set(DX, 2.35, 0.6); qs.add(tBai);

// ---------- shots ----------
const ALL = [t5, tBank, tLoan, tBlame, tBr, tFr, tBack, tBoss, tJP, t10, t42, tYara, tBai];
function base() { S.reset(); ALL.forEach(x => x.visible = false); PAPERS.forEach(p => p.visible = false); ARROW.visible = false; }

function shotMeeting(t) { // 1段目 0〜9：5億円の融資が焦げついた。取引先が倒産（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 0.95; S.darken(0.4, '#0a0c12');
  const k = Math.max(0, t - 0.2);
  CASH.forEach(c => { const u = c.userData, tt = Math.max(0, k - u.o * 0.6); const y = u.y + 1.6 * tt - 2.8 * tt * tt; const land = y < 0.05; c.position.set(u.x + u.vx * Math.min(tt, 1.4), land ? 0.05 : y, u.z + u.vz * Math.min(tt, 1.4)); c.rotation.set(land ? 0 : u.vr * tt, u.vr * tt * 0.5, 0); });
  ARROW.visible = true; h1.userData.head.rotation.x = -0.1; h1.userData.arms.forEach((a, i) => a.rotation.x = t > 1.0 ? -0.5 - (i ? 0.4 : 0) : 0); ARROW.position.set(1.5, lerp(4.4, 3.0, ease(Math.min(1, t / 1.2))), -3.2); ARROW.rotation.z = 0.25;
  t5.userData.pop(1); if (t > 4.6) t5.visible = false;
  tBank.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.6, 2.4, u), lerp(4.6, 3.8, u), 0, 1.2, -1.0, 56);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：銀行の融資課長。責任を押しつけられた
  base(); S.aim(OX, -1); lift(-40); S.hemi.intensity = 1.1;
  chief.userData.arms[0].rotation.x = t > 4.2 ? -1.5 : -0.3; chief.userData.head.rotation.x = -0.1;
  h2.userData.head.rotation.x = t > 4.4 ? 0.3 : 0;
  PAPERS.forEach((p, i) => { p.visible = t > 4.4; const k = clamp((t - 4.4 - i * 0.12) / 0.8); p.position.set(lerp(OX + 0.5, OX - 0.8 + (i - 2.5) * 0.12, k), lerp(1.4, 0.05, k * k) + (k < 1 ? Math.sin(k * Math.PI) * 0.6 : 0), lerp(-1.0, -0.1 + (i % 2) * 0.2, k)); p.rotation.set(k < 1 ? t * 3 + i : -Math.PI / 2, i, 0); });
  tLoan.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLoan.visible = false;
  tBlame.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(OX + lerp(0.2, 0, u), lerp(2.0, 1.9, u), lerp(4.8, 4.0, u), OX, 1.5, -0.9, 56);
  return qs;
}
function shotFloor(t) { // 3段目 17〜25：大きな銀行の支店。出世か、友情か
  base(); S.aim(BX, -3); lift(-30); S.hemi.intensity = 1.2;
  CLERKS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.3; p.userData.head.rotation.x = 0.1; p.userData.arms[i % 2].rotation.x = -0.4 - Math.sin(t * 2 + i) * 0.2; });
  h3.userData.head.rotation.y = Math.sin(t * 0.7) * 0.4;
  tBr.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBr.visible = false;
  tFr.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.8, 0.4, u), lerp(3.2, 3.0, u), lerp(5.4, 4.6, u), BX, 1.5, -3, 58);
  return qs;
}
function shotHall(t) { // 4段目 25〜33：5億円を取り戻す。相手が上司でも
  base(); S.aim(CX, -6); lift(-40); S.hemi.intensity = 0.8; S.darken(0.45, '#0a0c14');
  const z = 0 - t * 1.0; h4.position.set(CX, 0, z); h4.rotation.y = Math.PI; poseWalk(h4, t * 4.2, 0.8);
  FILE.position.set(CX - 0.38, 0.9, z); FILE.rotation.y = Math.PI;
  tBack.position.set(CX, 2.5, z); tBoss.position.set(CX, 2.5, z);
  tBack.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBack.visible = false;
  tBoss.userData.pop((t - 4.2) / 0.35);
  look(CX + 0.8, 1.9, z + 4.4, CX, 1.5, z - 3, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2013年の日本のドラマ。全10話。最終回の視聴率42.2%
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  BAR.visible = false;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  t10.userData.pop((t - 4.2) / 0.35); t42.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, 2.8, lerp(8.0, 7.2, u), TX + 0.4, 2.7, -1.5, 56);
  return qs;
}
function shotPoint(t, quiz = 0) { // 6段目 42〜49（決め手）：やられたらやり返す。倍返しだ
  base(); S.aim(DX, 1); lift(-30); S.hemi.intensity = 1.0; S.key.intensity = 1.6;
  const p = ease(clamp((t - 3.0) / 0.4));
  h6.userData.arms[0].rotation.x = -1.55 * p; h6.userData.arms[0].rotation.z = 0.05; h6.userData.head.rotation.x = -0.05;
  if (!quiz) { tYara.userData.pop((t - 0.4) / 0.35); tBai.userData.pop((t - 3.4) / 0.25); }
  const u = ease(t / 7);
  if (!quiz) look(DX + lerp(0.3, 0.1, u) + (t > 3.4 && t < 3.7 ? Math.sin(t * 90) * 0.03 : 0), lerp(2.0, 1.9, u), lerp(4.8, 3.6, u), DX, 1.75, 0.4, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の廊下）
  shotHall(5.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.2, d);
  S.spot.color.set(0xffe0c0); S.spot.position.set(CX, 6, -1); S.spot.target.position.set(CX, 1, -5); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(CX + lerp(1.0, 0.6, k), lerp(1.9, 1.8, k), lerp(-0.4, -1.2, k), CX, 1.5, -8, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotMeeting },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotFloor },
  { a: 25, b: 33, f: shotHall },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotPoint(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '5億円の融資が、<br>焦げついた。'],
  [5.6, 9.0, '取引先の会社が、<br>倒産したのだ。'],
  [9.2, 13.2, '主人公は、<br>銀行の融資課長。'],
  [13.2, 17.0, '上司は、その責任を<br>彼に押しつけた。'],
  [17.2, 21.0, '舞台は、<br>大きな銀行の支店。'],
  [21.0, 25.0, '出世か、友情か。<br>行員たちの思惑が渦巻く。'],
  [25.2, 29.0, '彼は、5億円を<br>自分の手で取り戻すと決めた。'],
  [29.0, 33.0, '相手が上司でも、<br>引き下がらない。'],
  [33.2, 37.4, '2013年の日本のドラマ。<br>全10話。'],
  [37.4, 41.8, '最終回の視聴率は、<br>42.2%。'],
  [42.2, 45.4, 'やられたら、<br>やり返す。'],
  [45.4, 49.0, '倍返しだ。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、半沢直樹。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q059', v2: true, answer: '半沢直樹',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 5959,
    hits: [5.6, 13.2, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.5, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.3, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '5億円': 'ごおくえん', '融資': 'ゆうし', '焦げついた': 'こげついた', '取引先': 'とりひきさき', '会社': 'かいしゃ', '倒産': 'とうさん', '主人公': 'しゅじんこう', '銀行': 'ぎんこう', '融資課長': 'ゆうしかちょう', '上司': 'じょうし', '責任': 'せきにん', '彼': 'かれ', '押しつけた': 'おしつけた', '舞台': 'ぶたい', '大きな': 'おおきな', '支店': 'してん', '出世': 'しゅっせ', '友情': 'ゆうじょう', '行員': 'こういん', '思惑': 'おもわく', '渦巻く': 'うずまく', '自分の手': 'じぶんのて', '取り戻す': 'とりもどす', '決めた': 'きめた', '相手': 'あいて', '引き下がらない': 'ひきさがらない', '2013年': 'にせんじゅうさんねん', '日本': 'にほん', '全10話': 'ぜんじゅうわ', '最終回': 'さいしゅうかい', '視聴率': 'しちょうりつ', '42.2%': 'よんじゅうにてんにパーセント', 'やり返す': 'やりかえす', '倍返し': 'ばいがえし', '半沢直樹': 'はんざわなおき', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n5億円の融資が、焦げついた。取引先の会社が、倒産したのだ。主人公は、銀行の融資課長。上司は、その責任を彼に押しつけた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'ドラマ好き', '名作ドラマ', '日曜劇場'],
  },
});
applyQuizCards({ answer: '半沢直樹', info: 'U-NEXT｜日本のドラマ・全10話', answerSize: 150 });
