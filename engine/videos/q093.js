import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #093 呪術廻戦（アニメ・日本・第1期 2020年10月〜。Netflix・Disney+・U-NEXT・Hulu・FOD・Prime Video などで見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/zhou-shu-hui-zhan で2026/11/15確認（Filmarks の動画配信欄も Netflix・U-NEXT・DMM TV ほか見放題）。
//   Filmarks 第1期 4.1・レビュー73,234件 filmarks.com/animes/1304/1731）
// 確かめた事実（Filmarks 第1期の作品紹介、ja.wikipedia.org/wiki/呪術廻戦 の 概要・あらすじ 始まり。2026/11/15）：
//   ・常人離れした身体能力を持つ高校生。祖父に育てられ、祖父が亡くなった夜、学校に眠る呪物の封印が解かれ、人を襲う化物（呪霊）が現れる（Wikipedia）
//   ・人間の負の感情から生まれた化け物を、呪術を使って祓う呪術師の戦いを描いたダークファンタジー（Wikipedia）
//   ・取り残された先輩を救うため校舎へ乗り込み、力を得るため自ら呪物（指）を食べる（Wikipedia・Filmarks）
//   ・魂に呪いを宿してしまう。その後、呪術高専に入学する（Filmarks・Wikipedia）。宿したのは千年前の術師で「史上最強の呪術師」（Wikipedia 登場人物・両面宿儺）
//   ・原作は週刊少年ジャンプの漫画。アニメ第1期は2020年10月から（Wikipedia・Filmarks）
// 構成（ヒント6段）：1 夜の学校で封印がとけた・人を襲う化け物 → 2 主人公は運動神経ずば抜けた高校生・祖父を亡くしたばかり
//   → 3 人の負の感情から化け物が生まれる世界・それを退治するひみつの仕事 → 4 先輩を救うため校舎へ・力を得るため不気味な指を食べた
//   → 5 2020年から放送の日本のテレビアニメ・少年漫画が原作のダークファンタジー → 6 決め手：体に宿したのは千年前の最強の術師・呪いを学ぶ学校へ
// 後の戦い・誰が死ぬか・結末は言わない。人物名・技の名前・地名は出さない。キャラクターの髪型・顔の模様・衣装・アニメの絵・ロゴ・有名な構図は使わない。人は汎用の3D
const S = quizStage({ bg: '#14121e', floor: '#1e1c26', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(9393);

const BOY = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#1e2230', pants: '#1e2230' };
const SEN = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#2a2e3a', pants: '#2a2e3a' };
const CROWD = [{ skin: '#f1c9a5', hair: '#2c2421', shirt: '#4a5a6a', pants: '#2b3346', tie: true }, { skin: '#f4d3b5', hair: '#4a3426', shirt: '#8a6a5a', pants: '#3b3f4a', long: true, skirt: true }, { skin: '#e8b98f', hair: '#1d1a19', shirt: '#5a4a6a', pants: '#2b2f3a' }];
const PURPLE = '#8a4ad8', VIOLET = '#5a2aa8';

// 化け物（黒いかたまりに目がたくさん。汎用）
function monster(s = 1) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#1a1424', emissive: '#2a0e3a', roughness: 0.9 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m); b.scale.set(1.1, 1.3, 0.9); b.position.y = 1.3; g.add(b);
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.0, 8), m); t.position.set(-0.8 + i * 0.4, 0.3, 0.3); t.rotation.x = Math.PI; g.add(t); }
  for (let i = 0; i < 6; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09 + R() * 0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#f2e84e' })); e.position.set(-0.55 + (i % 3) * 0.55 + R() * 0.1, 1.4 + Math.floor(i / 3) * 0.4, 0.86); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), mat('#121212')); p.position.set(e.position.x, e.position.y, 0.95); g.add(p); }
  g.scale.setScalar(s); return g; }
function smoke(n, col = PURPLE) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 })); s.userData.o = i / n; qs.add(s); a.push(s); } return a; }
function sealBox() { const g = new THREE.Group(); const b = box(0.4, 0.3, 0.3, mat('#5a3a20')); g.add(b);
  const paper = box(0.12, 0.36, 0.32, mat('#f4ecd8')); g.add(paper); const ink = box(0.04, 0.2, 0.33, mat('#c8202c')); g.add(ink);
  const lid = box(0.42, 0.06, 0.32, mat('#6a4a28')); lid.position.y = 0.18; g.add(lid); g.userData.lid = lid; return g; }
function schoolBuilding(x, z, col = '#c8c0b0') { const g = new THREE.Group(); const b = box(12, 5, 3, mat(col)); b.position.y = 2.5; g.add(b);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const w = box(0.9, 0.9, 0.05, new THREE.MeshBasicMaterial({ color: '#2a3048' })); w.position.set(-5 + i * 1.25, 1.4 + r * 2, 1.53); g.add(w); }
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 20), mat('#f4f4f0')); clock.rotation.x = Math.PI / 2; clock.position.set(0, 5.6, 1.4); g.add(clock);
  const tw = box(1.6, 1.4, 2.6, mat(col)); tw.position.set(0, 5.6, 0); g.add(tw);
  g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 夜の学校（x=0）。校庭の古い箱の封がやぶれ、紫の煙 → 化け物 ----------
schoolBuilding(0, -10);
{ const gr = box(30, 0.04, 16, mat('#3a3428')); gr.position.set(0, 0.02, -3); qs.add(gr);
  for (let i = 0; i < 4; i++) { const t = new THREE.Group(); const tk = box(0.25, 2, 0.25, mat('#3a2a1a')); tk.position.y = 1; t.add(tk); const c = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), mat('#1e2e22')); c.position.y = 2.4; t.add(c); t.position.set(-7 + i * 4.6, 0, -6.5); qs.add(t); } }
const MOON1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), new THREE.MeshBasicMaterial({ color: '#f4f0d8', fog: false })); MOON1.position.set(-6, 12, -30); qs.add(MOON1);
const BOX1 = sealBox(); BOX1.position.set(0, 0.17, -1.6); qs.add(BOX1);
const SMOKE1 = smoke(10);
const MON1 = monster(1.3); MON1.position.set(0.3, 0, -4.6); qs.add(MON1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); Q1.position.set(0.6, 1.0, -1.8); qs.add(Q1);
const tSeal = tag('夜の学校で、封印がとけた', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tSeal.position.set(0, 2.2, -2.8); qs.add(tSeal);
const tMon = tag('人を襲う、化け物', { size: 60, w: 560, bg: '#c8202c', sx: 1.9 }); tMon.position.set(0, 3.6, -3.4); qs.add(tMon);

// ---------- 2段目. 校庭のトラック（x=40）。ひとりだけ、ありえない速さ → 夜の部屋、祖父の写真と花 ----------
const AX = 40;
{ const gr = box(30, 0.04, 16, mat('#5a7a3a')); gr.position.set(AX, 0.02, -3); qs.add(gr);
  const tr = box(30, 0.03, 3.2, mat('#b8583a')); tr.position.set(AX, 0.05, -1.6); qs.add(tr);
  for (let i = 0; i < 4; i++) { const ln = box(30, 0.01, 0.04, mat('#f4f4f0')); ln.position.set(AX, 0.07, -0.1 - i * 0.8); qs.add(ln); }
  schoolBuilding(AX, -12, '#d8d0c0');
  // 部屋（右側）
  const fl = box(6, 0.04, 6, mat('#8a6a4a')); fl.position.set(AX + 16, 0.06, -1.5); qs.add(fl);
  const wl = box(6, 4, 0.2, mat('#d8ccb8')); wl.position.set(AX + 16, 2, -4.2); qs.add(wl);
  const st = box(1.4, 0.8, 0.5, mat('#4a3424')); st.position.set(AX + 16, 0.4, -3.6); qs.add(st);
  const fr = box(0.5, 0.62, 0.04, mat('#2a2018')); fr.position.set(AX + 16, 1.12, -3.6); qs.add(fr);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), new THREE.MeshBasicMaterial({ map: canvasTex(160, 208, (g, w, h) => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8b8b8'; g.fillRect(40, 30, 80, 24); g.fillStyle = '#e8b98f'; g.fillRect(44, 50, 72, 70); g.fillStyle = '#121212'; g.fillRect(60, 76, 10, 12); g.fillRect(90, 76, 10, 12); g.fillStyle = '#6a5a4a'; g.fillRect(30, 124, 100, 84); }) }));
  pic.position.set(AX + 16, 1.12, -3.57); qs.add(pic);
  for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.25, 10), mat('#c8d8e0')); v.position.set(AX + 16 + s * 0.5, 0.93, -3.5); qs.add(v); for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#f4f4f0')); f.position.set(AX + 16 + s * 0.5 + (k - 1) * 0.06, 1.12 + (k % 2) * 0.05, -3.5); qs.add(f); } } }
const RUN2 = [BOY, ...CROWD.slice(0, 2)].map((o, i) => { const p = makePerson(o); p.rotation.y = Math.PI / 2; p.position.set(AX - 5, 0, -0.5 - i * 0.8); qs.add(p); return p; });
const LINES2 = []; for (let i = 0; i < 4; i++) { const l = box(0.6, 0.03, 0.03, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); qs.add(l); LINES2.push(l); }
const boy2 = makePerson(BOY); boy2.position.set(AX + 15.0, 0.06, -2.0); boy2.rotation.y = Math.PI - 0.6; qs.add(boy2);
const tFast = tag('運動神経ばつぐんの、高校生', { size: 52, w: 760, bg: '#14161c', sx: 1.9 }); qs.add(tFast);
const tGrand = tag('祖父を、亡くしたばかり', { size: 56, w: 660, bg: '#4a5a8a', sx: 1.8 }); tGrand.position.set(AX + 16, 2.25, -3.0); qs.add(tGrand);

// ---------- 3段目. 夜の街（x=80）。うつむく人々から黒いもや → 化け物になる。屋上に黒い服の人影 ----------
const BX = 80;
{ const gr = box(30, 0.04, 16, mat('#2a2a30')); gr.position.set(BX, 0.02, -3); qs.add(gr);
  for (let i = 0; i < 8; i++) { const h = 5 + R() * 5; const b = box(2.4, h, 2.4, mat(['#2a2e3a', '#323646', '#262a34'][i % 3])); b.position.set(BX - 9 + i * 2.6, h / 2, -9); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.3, 0.3, 0.05, new THREE.MeshBasicMaterial({ color: R() > 0.4 ? '#ffd890' : '#3a3e4a' })); w.position.set(BX - 9.7 + i * 2.6 + (k % 3) * 0.7, 1.5 + Math.floor(k / 3) * 1.5 + R() * 2, -7.78); qs.add(w); } } }
const P3 = CROWD.map((o, i) => { const p = makePerson(o); p.position.set(BX - 1.6 + i * 1.6, 0, -2.2 - (i % 2) * 0.6); p.rotation.y = [0.3, 0, -0.3][i]; qs.add(p); return p; });
const MIST3 = P3.map(() => smoke(6, '#3a2a4a'));
const MON3 = monster(0.8); MON3.position.set(BX + 0.2, 0, -5); qs.add(MON3);
const SHADOW3 = makePerson(SEN); SHADOW3.position.set(BX + 3.4, 0, -3.2); SHADOW3.rotation.y = -0.6; qs.add(SHADOW3);
const tNeg = tag('負の感情から、化け物', { size: 58, w: 620, bg: '#14161c', sx: 2.2 }); tNeg.position.set(BX, 3.2, -2.6); qs.add(tNeg);
const tJob = tag('退治する、ひみつの仕事', { size: 56, w: 660, bg: VIOLET, sx: 2.3 }); tJob.position.set(BX, 3.2, -2.6); qs.add(tJob);

// ---------- 4段目. 夜の校舎の廊下（x=120）。走る主人公 → 手の中の紫に光る小さな包み ----------
const CX = 120;
{ const fl = box(3.4, 0.04, 30, mat('#4a4a50')); fl.position.set(CX, 0.02, -10); qs.add(fl);
  for (const s of [-1, 1]) { const w = box(0.2, 3.2, 30, mat('#8a8a84')); w.position.set(CX + s * 1.7, 1.6, -10); qs.add(w);
    for (let i = 0; i < 8; i++) { const win = box(0.05, 1.0, 1.2, new THREE.MeshBasicMaterial({ color: '#1a2038' })); win.position.set(CX + s * 1.58, 1.8, -2 - i * 3.2); qs.add(win); } }
  const ce = box(3.4, 0.1, 30, mat('#6a6a64')); ce.position.set(CX, 3.2, -10); qs.add(ce);
  for (let i = 0; i < 6; i++) { const l = box(0.8, 0.05, 0.2, new THREE.MeshBasicMaterial({ color: i % 2 ? '#3a3a30' : '#e8e8d0' })); l.position.set(CX, 3.12, -2 - i * 4); qs.add(l); } }
const boy4 = makePerson(BOY); boy4.position.set(CX, 0, -2); qs.add(boy4);
const MON4 = monster(0.9); MON4.position.set(CX, 0, -16); qs.add(MON4);
const sen4 = makePerson(CROWD[1]); sen4.position.set(CX + 0.9, -0.3, -12); sen4.rotation.y = -0.8; sen4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(sen4);
const PKG4 = new THREE.Group(); { const c = box(0.14, 0.05, 0.08, mat('#f4ecd8')); PKG4.add(c); const r = box(0.03, 0.06, 0.09, mat('#c8202c')); PKG4.add(r); const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: PURPLE, transparent: true, opacity: 0.35 })); PKG4.add(glow); }
qs.add(PKG4);
const tSave = tag('先輩を救いに、校舎へ', { size: 56, w: 640, bg: '#14161c', sx: 1.7 }); qs.add(tSave);
const tEat = tag('不気味な指を、食べた', { size: 58, w: 640, bg: '#c8202c', sx: 1.4 }); qs.add(tEat);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2020年・日本のアニメ ----------
const TX = 180;
{ const fl = box(10, 0.04, 10, mat('#3a3028')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#4a4038')); wl.position.set(TX, 3, -4); qs.add(wl);
  const rack = box(3.4, 0.6, 0.6, mat('#2a2018')); rack.position.set(TX, 0.3, -3.5); qs.add(rack); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1030'); gr.addColorStop(1, '#5a2a8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0a0812'; g.beginPath(); g.arc(470, 230, 110, 0, 7); g.fill(); g.fillStyle = '#f2e84e'; for (const [x, y] of [[430, 200], [500, 190], [470, 250]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
  g.fillStyle = '#0a0812'; g.beginPath(); g.arc(170, 170, 26, 0, 7); g.fill(); g.fillRect(144, 196, 52, 120); g.fillStyle = '#8a4ad8'; g.fillRect(196, 210, 70, 10); }) }));
TV5.position.set(TX, 1.6, -3.5); qs.add(TV5);
{ const fr = box(3.36, 1.96, 0.08, mat('#121216')); fr.position.set(TX, 1.6, -3.56); qs.add(fr); }
const t2020 = tag('2020年〜 日本のアニメ', { size: 54, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2020.position.set(TX, 3.3, -3.2); qs.add(t2020);
const tDark = tag('ダークファンタジー', { size: 60, w: 560, bg: VIOLET, sx: 2.1 }); tDark.position.set(TX, 3.3, -3.2); qs.add(tDark);

// ---------- 6段目. 主人公のまわりに紫の炎と 千年前 の札 → 山の中の古い学校の門へ ----------
const DX = 220;
{ const gr = box(20, 0.04, 20, mat('#2a2a22')); gr.position.set(DX, 0.02, -4); qs.add(gr);
  // 山の中の古い学校（瓦屋根の建物と門）
  const hall = box(7, 3, 3, mat('#6a4a34')); hall.position.set(DX, 1.5, -11); qs.add(hall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.6, 4), mat('#2a2a30')); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.5); roof.position.set(DX, 3.8, -11); qs.add(roof);
  for (const s of [-1, 1]) { const p = box(0.35, 3.6, 0.35, mat('#3a2a20')); p.position.set(DX + s * 1.6, 1.8, -6); qs.add(p); }
  const beam = box(4.4, 0.35, 0.5, mat('#2a2a30')); beam.position.set(DX, 3.7, -6); qs.add(beam); const beam2 = box(3.6, 0.2, 0.3, mat('#3a2a20')); beam2.position.set(DX, 3.2, -6); qs.add(beam2);
  for (let i = 0; i < 10; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 8), mat('#1a2a1e')); t.position.set(DX - 9 + i * 2, 2, -14 - (i % 2) * 2); qs.add(t); } }
const boy6 = makePerson(BOY); boy6.position.set(DX, 0, -2.2); boy6.rotation.y = 0; qs.add(boy6);
const FLAME6 = []; for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? PURPLE : '#c88aff', transparent: true, opacity: 0.75 })); f.userData = { a: i / 14 * Math.PI * 2 }; qs.add(f); FLAME6.push(f); }
const CROWN6 = tag('千年前', { size: 64, w: 300, bg: '#2a1440', color: '#c88aff', sx: 0.75 }); CROWN6.position.set(DX, 2.55, -2.2); qs.add(CROWN6);
const tKing = tag('体に宿した、最強の術師', { size: 54, w: 700, bg: VIOLET, sx: 1.9 }); tKing.position.set(DX, 3.3, -2.8); qs.add(tKing);
const tSchool = tag('呪いを学ぶ、学校へ', { size: 60, w: 600, bg: '#c8202c', sx: 2.2 }); tSchool.position.set(DX, 4.6, -6.2); qs.add(tSchool);

// ---------- shots ----------
const ALL = [tSeal, tMon, tFast, tGrand, tNeg, tJob, tSave, tEat, t2020, tDark, tKing, tSchool, Q1, CROWN6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FLAME6.forEach(f => f.visible = false); MIST3.flat().forEach(m => m.visible = false); SMOKE1.forEach(m => m.visible = false); }

function shotSeal(t, quiz = 0) { // 1段目 0〜9：夜の学校で、封印がとけた。人を襲う化け物が、あらわれる（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#06040e');
  const op = quiz ? 1 : ease(clamp((t - 0.8) / 0.8)); BOX1.userData.lid.position.y = 0.18 + op * 0.25; BOX1.userData.lid.rotation.z = op * 0.6; BOX1.rotation.z = quiz ? 0 : Math.sin(t * 25) * 0.04 * (t < 0.8 ? 1 : 0);
  SMOKE1.forEach((s, i) => { const k = (t * 0.35 + s.userData.o) % 1; s.visible = op > 0.1; s.position.set(Math.sin(i * 2.1 + t) * 0.3 * k, 0.4 + k * 3, -1.6 - k * 1.2); s.scale.setScalar(0.6 + k * 2.2); s.material.opacity = 0.55 * (1 - k); });
  const rise = quiz ? 1 : ease(clamp((t - 4.0) / 1.2)); MON1.position.y = lerp(-3.6, 0, rise); MON1.rotation.y = Math.sin(t * 0.7) * 0.15;
  Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (t > 4.0 && !quiz) Q1.visible = false;
  if (!quiz) { tSeal.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSeal.visible = false; tMon.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0, u), lerp(1.1, 1.6, u), lerp(0.9, 2.4, u), 0.1, lerp(0.7, 1.9, u), -3, 64);
  return qs;
}
function shotTrack(t) { // 2段目 9〜17：主人公は、運動神経がずば抜けた高校生。育ててくれた祖父を、亡くしたばかり
  base(); lift(0);
  if (t < 4.0) { S.aim(AX, -2); S.hemi.intensity = 1.25; S.scene.background.set('#8ab4d8'); S.scene.fog.color.set('#8ab4d8');
    RUN2.forEach((p, i) => { const sp = i === 0 ? 3.4 : 1.5; p.position.set(AX - 5 + t * sp, 0, -0.5 - i * 0.8); poseWalk(p, t * (i === 0 ? 14 : 9), 1.2); });
    LINES2.forEach((l, i) => { l.visible = true; l.position.set(RUN2[0].position.x - 0.6 - i * 0.15, 0.8 + i * 0.3, -0.5); });
    tFast.position.set(RUN2[0].position.x - 0.3, 2.6, -1.0); tFast.userData.pop((t - 0.4) / 0.35);
    look(RUN2[0].position.x + 0.6, 1.8, 3.2, RUN2[0].position.x - 0.3, 1.1, -1.0, 62);
  } else { S.aim(AX + 16, -2); S.hemi.intensity = 0.55; S.darken(0.45, '#0a0a12'); LINES2.forEach(l => l.visible = false);
    boy2.userData.head.rotation.x = 0.35;
    tGrand.userData.pop((t - 4.3) / 0.35);
    const u = ease((t - 4) / 4); look(AX + 16 + lerp(1.0, 0.8, u), 1.8, lerp(1.2, 0.8, u), AX + 15.7, 1.1, -3.4, 62);
  }
  return qs;
}
function shotCity(t) { // 3段目 17〜25：人の負の感情から、化け物が生まれる世界。それを退治する、ひみつの仕事がある
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#06060c');
  P3.forEach((p, i) => { p.userData.head.rotation.x = 0.45; });
  MIST3.forEach((arr, j) => arr.forEach((s, i) => { s.visible = true; const k = (t * 0.3 + s.userData.o) % 1; s.position.set(P3[j].position.x + Math.sin(i + t) * 0.2, 2.0 + k * 2.2, P3[j].position.z - k * 2.2); s.scale.setScalar(0.5 + k * 1.5); s.material.opacity = 0.5 * (1 - k); }));
  const g = ease(clamp((t - 1.4) / 2.0)); MON3.scale.setScalar(Math.max(0.01, 0.8 * g)); MON3.position.y = 0;
  SHADOW3.visible = t > 4.2; SHADOW3.position.x = BX + lerp(4.4, 2.6, ease(clamp((t - 4.2) / 1.2))); poseWalk(SHADOW3, t * 6, t < 5.4 ? 0.8 : 0);
  tNeg.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNeg.visible = false; tJob.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.4, u), lerp(2.2, 2.4, u), lerp(3.6, 3.2, u), BX + 0.3, 1.6, -3.4, 64);
  return qs;
}
function shotHall(t) { // 4段目 25〜33：取り残された先輩を救うため、校舎へ乗り込む。力を得るため、不気味な指を食べた
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 0.45; S.darken(0.55, '#06060c');
  if (t < 4.0) { const z = lerp(-1, -8, t / 4); boy4.position.set(CX, 0, z); boy4.rotation.y = Math.PI; poseWalk(boy4, t * 13, 1.2); PKG4.visible = false;
    tSave.position.set(CX, 2.6, z - 2.2); tSave.userData.pop((t - 0.4) / 0.35);
    look(CX + 0.4, 1.7, z + 2.6, CX, 1.3, z - 4, 64);
  } else { const z = -9.5; boy4.position.set(CX, 0, z); boy4.rotation.y = 0.15; poseWalk(boy4, 0, 0); boy4.userData.head.rotation.x = 0.35;
    const k = ease(clamp((t - 4.4) / 1.2)); boy4.userData.arms[1].rotation.x = lerp(-0.8, -1.6, k);
    PKG4.visible = t < 6.6; PKG4.position.set(CX + 0.3, lerp(1.05, 1.55, k), z + 0.42); PKG4.rotation.y = t;
    MON4.position.z = -14; S.darken(0.55 + 0.2 * clamp((t - 6) / 1), '#14061e');
    tEat.position.set(CX, 2.3, z - 0.4); tEat.userData.pop((t - 4.3) / 0.35);
    look(CX + 0.5, 1.6, z + 2.4, CX - 0.1, 1.45, z, 62);
  }
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2020年から放送の、日本のテレビアニメ。少年漫画が原作の、ダークファンタジー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2020.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2020.visible = false; tDark.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(1.6, 1.8, u), lerp(3.4, 2.8, u), TX, 1.3, -3.5, 62);
  return qs;
}
function shotKing(t) { // 6段目 42〜49（決め手）：体に宿したのは、千年前の最強の術師。呪いを学ぶ、学校に入学する
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#0a0614');
  const turn = t > 3.3;
  boy6.rotation.y = turn ? Math.PI : 0; boy6.userData.head.rotation.x = turn ? 0 : -0.1;
  if (turn) { const k = ease(clamp((t - 3.4) / 3.0)); boy6.position.z = lerp(-2.2, -4.2, k); poseWalk(boy6, t * 6, k < 1 ? 0.8 : 0); } else boy6.position.z = -2.2;
  FLAME6.forEach((f, i) => { f.visible = !turn; const a = f.userData.a + t * 2; f.position.set(DX + Math.cos(a) * 0.8, 0.2 + ((t * 0.8 + i * 0.13) % 1) * 1.6, -2.2 + Math.sin(a) * 0.5); f.scale.setScalar(0.6 + Math.sin(t * 9 + i) * 0.15); f.material.opacity = 0.55; });
  CROWN6.visible = !turn && t > 0.8; if (CROWN6.visible) { CROWN6.userData.pop((t - 0.8) / 0.3); CROWN6.position.y = 2.6 + Math.sin(t * 2) * 0.04; }
  tKing.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tKing.visible = false; tSchool.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  if (!turn) look(DX + lerp(-0.3, 0.3, u), 1.8, lerp(1.6, 1.3, u), DX, 1.7, -2.2, 64);
  else look(DX + 0.3, lerp(1.6, 1.9, ease((t - 3.3) / 3.7)), lerp(1.4, 1.0, ease((t - 3.3) / 3.7)), DX, 2.4, -8, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（夜の学校に戻る）
  shotSeal(6.0, 1);
  ALL.forEach(x => x.visible = false);
  const k = ease(t / 7);
  look(0, 1.6, lerp(2.6, 2.0, k), 0.1, 1.9, -3, 64);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotSeal(t, 0) },
  { a: 9, b: 17, f: shotTrack },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotHall },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotKing },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜の学校で、<br>古い封印がとけた。'],
  [5.6, 9.0, '人を襲う化け物が、<br>あらわれる。'],
  [9.2, 13.2, '主人公は、運動神経が<br>ずば抜けた高校生。'],
  [13.2, 17.0, '育ててくれた祖父を、<br>亡くしたばかり。'],
  [17.2, 21.0, '人の負の感情から、<br>化け物が生まれる世界。'],
  [21.0, 25.0, 'それを退治する、<br>ひみつの仕事がある。'],
  [25.2, 29.0, '取り残された先輩を<br>救うため、校舎へ。'],
  [29.0, 33.0, '力を得るため、<br>不気味な指を食べた。'],
  [33.2, 37.4, '2020年から放送の、<br>日本のテレビアニメ。'],
  [37.4, 41.8, '少年漫画が原作の、<br>ダークファンタジー。'],
  [42.2, 45.4, '体に宿したのは、千年前の<br>最強の術師。'],
  [45.4, 49.0, '呪いを学ぶ、<br>学校に入学する。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>呪術廻戦。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q093', v2: true, answer: '呪術廻戦',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'tension', seed: 9393,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '呪術廻戦': 'じゅじゅつかいせん', '夜': 'よる', '学校': 'がっこう', '古い': 'ふるい', '封印': 'ふういん', '人': 'ひと', '襲う': 'おそう', '化け物': 'ばけもの', '主人公': 'しゅじんこう', '運動神経': 'うんどうしんけい', '抜けた': 'ぬけた', '高校生': 'こうこうせい', '育てて': 'そだてて', '祖父': 'そふ', '亡くした': 'なくした', '負の感情': 'ふのかんじょう', '生まれる': 'うまれる', '世界': 'せかい', '退治': 'たいじ', '仕事': 'しごと', '取り残された': 'とりのこされた', '先輩': 'せんぱい', '救う': 'すくう', '校舎': 'こうしゃ', '力': 'ちから', '得る': 'える', '不気味': 'ぶきみ', '指': 'ゆび', '食べた': 'たべた', '2020年': 'にせんにじゅうねん', '放送': 'ほうそう', '日本': 'にほん', '少年漫画': 'しょうねんまんが', '原作': 'げんさく', '体': 'からだ', '宿した': 'やどした', '呪い': 'のろい', '千年前': 'せんねんまえ', '最強': 'さいきょう', '術師': 'じゅつし', '学ぶ': 'まなぶ', '入学': 'にゅうがく', '作品': 'さくひん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\n夜の学校で、古い封印がとけた。人を襲う化け物が、あらわれる。主人公は、運動神経がずば抜けた高校生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'ディズニープラス', 'アニメ好き', 'ダークファンタジー'],
  },
});
applyQuizCards({ answer: '呪術廻戦', info: 'Netflix・Disney+｜日本のアニメ・第1期〜', answerSize: 128 });
