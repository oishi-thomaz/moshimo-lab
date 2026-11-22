import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #126 アイアンマン（映画・アメリカ・2008年製作・125分。Prime Video・Hulu で見放題、
//   Filmarks の動画配信欄（Hulu・Netflix・Prime Video・U-NEXT 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/映画/aianman
//   （見放題：Amazon Prime Video・Disney Plus・Hulu・Netflix・U-NEXT）で2026/11/22確認。Filmarks 4.0・レビュー214,487件 filmarks.com/movies/24598）
// 確かめた事実（映画.com eiga.com/movie/53456 の解説・あらすじ。2026/11/22）：
//   ・マーベル・コミックの人気作品を映画化、全米で大ヒットを記録したアメコミ映画。2008年製作／125分／アメリカ
//   ・巨大軍事企業の社長はアフガニスタンでテロ組織に捕われ、新兵器の開発を強制される
//   ・敵の目を盗んで戦闘用パワードスーツを開発し、敵地から脱出する
// 構成（ヒント6段）：1 遠い国で武装した集団に捕まった男・目をさますと暗い洞くつの中 → 2 主人公は巨大な軍事企業の社長・新しい兵器を作れと命じられる
//   → 3 見張りの目が光る洞くつ・ガラクタを集めてこっそり何かを作りはじめる → 4 目的は生きてここを出ること・カギは自分の発明
//   → 5 2008年のアメリカ映画・全米で大ヒットしたヒーロー映画 → 6 決め手：鉄のパワードスーツを着て戦う・原作はマーベル・コミック
// 作っているものの中身（スーツ）は6段目まで見せない。胸の装置・顔のマスクの形・赤と金の色・登場人物の名前・国名（5段目より前）・脱出の場面・結末は出さない。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図はなぞらない。6段目のスーツは銀色の汎用のロボットの形にする。人は汎用の3D
const S = quizStage({ bg: '#1a1612', floor: '#4a3a2a', fogNear: 18, fogFar: 70 });
const qs = S.scene;
const R = rng(12610);

const HERO = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#3a3a44', pants: '#2a2a30' };
const SUIT = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#2a2e3a', pants: '#2a2e3a', tie: true };
const GUARD = { skin: '#c8a080', hair: '#2a2420', shirt: '#6a6a50', pants: '#4a4a3a' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function rock(x, y, z, s, c = '#5a4a3a') { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat(c)); r.position.set(x, y, z); r.rotation.set(R() * 3, R() * 3, R() * 3); qs.add(r); return r; }
function cave(x) { const fl = box(14, 0.04, 14, mat('#4a3a2a')); fl.position.set(x, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 22; i++) rock(x - 7 + i * 0.66, 0.6 + R() * 3.4, -6.5 - R() * 0.6, 0.9 + R() * 0.8, ['#4a3a2a', '#5a4834', '#3e3224'][i % 3]);
  for (let i = 0; i < 10; i++) { rock(x - 6.2 - R() * 0.6, R() * 4, -5 + i, 1.0 + R() * 0.6); rock(x + 6.2 + R() * 0.6, R() * 4, -5 + i, 1.0 + R() * 0.6); }
  for (let i = 0; i < 14; i++) rock(x - 6.5 + i, 4.6 + R() * 0.4, -4 + R() * 6, 1.2 + R() * 0.5, '#3a2e22'); }
function bulb(x, y, z) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl('#ffe0a0')); b.position.set(x, y, z); qs.add(b); const w = box(0.01, 1.2, 0.01, mat('#222')); w.position.set(x, y + 0.6, z); qs.add(w);
  const l = new THREE.PointLight('#ffc878', 6, 7); l.position.set(x, y - 0.1, z); qs.add(l); return l; }

// ---------- 1段目. 暗い洞くつ（x=0）。簡易ベッドで目をさます男。入口に見張りの影 ----------
cave(0);
const BULB1 = bulb(0.4, 2.8, -2.4);
const COT1 = box(0.9, 0.4, 2.1, mat('#6a6050')); COT1.position.set(-0.3, 0.2, -2.7); qs.add(COT1);
const MAN1 = person(HERO, -0.3, -1.75, 0);
const GUARD1 = [person(GUARD, 2.6, -0.2, -2.4), person(GUARD, 3.3, 0.4, -2.2)];
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tCaught = tag('遠い国で、捕まった男', { size: 56, w: 640, bg: '#14161c', sx: 2.2 }); tCaught.position.set(0, 2.15, -3.0); qs.add(tCaught);
const tCave = tag('目をさますと、洞くつ', { size: 56, w: 640, bg: '#e24050', sx: 2.2 }); tCave.position.set(0, 2.5, -3.0); qs.add(tCave);

// ---------- 2段目. 大きな会社の発表会（x=50）。スーツの社長が、ミサイルの模型の前で手を広げる ----------
const AX = 50;
{ const fl = box(18, 0.04, 14, mat('#2a2e3a')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const st = box(8, 0.6, 3.4, mat('#3a3e4a')); st.position.set(AX, 0.3, -4.2); qs.add(st);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), gl('#2a4a7a')); sc.position.set(AX, 3.2, -6.2); qs.add(sc);
  for (let i = 0; i < 6; i++) { const l = box(0.1, 0.1, 0.1, gl('#bfe0ff')); l.position.set(AX - 4 + i * 1.6, 5.4, -6.1); qs.add(l); } }
const MIS2 = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 16), mat('#c8ccd4')); b.rotation.z = Math.PI / 2; MIS2.add(b);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 16), mat('#c8ccd4')); n.rotation.z = -Math.PI / 2; n.position.x = 1.5; MIS2.add(n);
  for (let i = 0; i < 4; i++) { const f = box(0.5, 0.04, 0.3, mat('#8a8e98')); f.position.x = -1.0; f.rotation.x = i * Math.PI / 2; f.position.y = Math.sin(i * Math.PI / 2) * 0.2; f.position.z = Math.cos(i * Math.PI / 2) * 0.2; MIS2.add(f); } }
MIS2.position.set(AX + 1.3, 1.7, -5.2); MIS2.scale.setScalar(0.7); qs.add(MIS2);
const BOSS2 = person(SUIT, AX - 1.0, -3.8, 0.2); BOSS2.position.y = 0.6;
const CROWD2 = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) CROWD2.push(person([GUARD, SUIT, HERO][(r + i) % 3], AX - 3.6 + i * 1.4 + r * 0.4, 0.6 + r * 1.1, Math.PI));
const tBoss = tag('巨大な軍事企業の、社長', { size: 54, w: 700, bg: '#14161c', sx: 2.4 }); tBoss.position.set(AX - 0.4, 3.4, -4.0); qs.add(tBoss);
const tOrder = tag('兵器を作れと、命じられる', { size: 52, w: 720, bg: '#e24050', sx: 2.4 }); tOrder.position.set(AX - 0.4, 3.4, -4.0); qs.add(tOrder);

// ---------- 3段目. 洞くつの作業台（x=100）。ガラクタと工具。こっそり手を動かす男。入口の見張り ----------
const BX = 100;
cave(BX);
bulb(BX - 0.4, 2.6, -2.6);
const BENCH3 = box(2.8, 0.1, 1.2, mat('#6a5a44')); BENCH3.position.set(BX, 0.95, -2.8); qs.add(BENCH3);
for (const [dx, dz] of [[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]]) { const l = box(0.1, 0.95, 0.1, mat('#4a3a2a')); l.position.set(BX + dx, 0.47, -2.8 + dz); qs.add(l); }
const JUNK3 = []; for (let i = 0; i < 12; i++) { const j = (i % 3 === 0 ? new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), mat('#8a8a90')) : box(0.1 + R() * 0.3, 0.06 + R() * 0.2, 0.1 + R() * 0.3, mat(['#7a7a80', '#9a8a6a', '#5a5a60'][i % 3])));
  j.position.set(BX - 1.2 + R() * 2.4, 1.05, -3.2 + R() * 0.8); j.rotation.y = R() * 3; qs.add(j); JUNK3.push(j); }
for (let i = 0; i < 6; i++) { const c = box(0.8, 0.6, 0.6, mat('#5a6a4a')); c.position.set(BX + 3 + (i % 2) * 0.9, 0.3 + Math.floor(i / 2) * 0.6, -4.4); qs.add(c); }
const MAN3 = person(HERO, BX - 0.2, -1.9, Math.PI);
const GUARD3 = person(GUARD, BX + 3.4, 0.6, -2.6);
const SPARK3 = []; for (let i = 0; i < 10; i++) { const s = box(0.03, 0.03, 0.03, gl('#ffd070')); qs.add(s); SPARK3.push(s); }
const tWatch = tag('見張りの目が光る、洞くつ', { size: 52, w: 720, bg: '#14161c', sx: 2.1 }); tWatch.position.set(BX, 2.8, -3.0); qs.add(tWatch);
const tSecret = tag('こっそり、何かを作る', { size: 56, w: 620, bg: '#e24050', sx: 1.9 }); tSecret.position.set(BX, 2.8, -3.0); qs.add(tSecret);

// ---------- 4段目. 洞くつの奥の出口（x=150）。光のさす外を見つめる男。足もとに図面 ----------
const CX = 150;
cave(CX);
const OUT4 = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), gl('#f4e0b0')); OUT4.position.set(CX + 0.6, 1.8, -5.6); qs.add(OUT4);
const RAY4 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
RAY4.visible = false;
const PLAN4 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(256, 180, (g) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, 256, 180); g.strokeStyle = '#3a5a8a'; g.lineWidth = 3;
  g.strokeRect(20, 20, 216, 140); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(30 + i * 34, 30); g.lineTo(50 + i * 30, 150); g.stroke(); } g.beginPath(); g.arc(128, 90, 34, 0, Math.PI * 2); g.stroke(); }) }));
PLAN4.rotation.x = -Math.PI / 2; PLAN4.position.set(CX - 0.6, 0.06, -2.0); qs.add(PLAN4);
const MAN4 = person(HERO, CX + 0.2, -2.6, Math.PI);
const tOut = tag('目的は、生きてここを出ること', { size: 50, w: 800, bg: '#14161c', sx: 2.5 }); tOut.position.set(CX + 0.2, 3.0, -3.2); qs.add(tOut);
const tKey = tag('カギは、自分の発明', { size: 56, w: 580, bg: '#e24050', sx: 2.0 }); tKey.position.set(CX + 0.2, 3.0, -3.2); qs.add(tKey);

// ---------- 5段目. 映画館の客席（x=200）。満席の観客と、光るスクリーン ----------
const TX = 200;
{ const fl = box(16, 0.04, 14, mat('#3a1a1e')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.4), gl('#6a8ab0')); sc.position.set(TX, 3.4, -7); qs.add(sc);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.7, 0.9, 0.6, mat('#7a2a30')); st.position.set(TX - 4 + i * 1.0, 0.45, -2 + r * 1.2); qs.add(st);
    const p = makePerson([GUARD, SUIT, HERO][(r + i) % 3]); p.scale.setScalar(0.8); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.45); p.position.set(TX - 4 + i * 1.0, 0.0, -2 + r * 1.2 - 0.1); qs.add(p); } }
const t2008 = tag('2008年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.0 }); t2008.position.set(TX, 3.0, -2.0); qs.add(t2008);
const tHit = tag('全米で大ヒット、ヒーロー映画', { size: 50, w: 780, bg: '#e24050', sx: 2.2 }); tHit.position.set(TX, 3.0, -2.0); qs.add(tHit);

// ---------- 6段目. 夕焼けの空（x=250）。銀色のパワードスーツが、足から炎を出して飛ぶ ----------
const DX = 250;
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(0.6, '#e88a5a'); gr.addColorStop(1, '#f8d090'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY6.position.set(DX, 6, -40); qs.add(SKY6);
for (let i = 0; i < 14; i++) { const h = 2 + R() * 6; const d = box(3, h, 3, mat('#8a6a4a')); d.position.set(DX - 20 + i * 3, h / 2 - 3, -22 - R() * 6); qs.add(d); }
const ARMOR = new THREE.Group(); { const m = new THREE.MeshPhongMaterial({ color: '#b8bec8', specular: '#ffffff', shininess: 60 });
  const tor = box(0.6, 0.7, 0.36, m); tor.position.y = 1.2; ARMOR.add(tor); const hd = box(0.4, 0.42, 0.4, m); hd.position.y = 1.78; ARMOR.add(hd);
  const vis = box(0.3, 0.06, 0.02, gl('#9ae0ff')); vis.position.set(0, 1.82, 0.205); ARMOR.add(vis);
  for (const s of [-1, 1]) { const a = box(0.18, 0.62, 0.2, m); a.position.set(s * 0.42, 1.18, 0); ARMOR.add(a); const l = box(0.22, 0.82, 0.24, m); l.position.set(s * 0.15, 0.42, 0); ARMOR.add(l); } }
ARMOR.position.set(DX, 1.0, -4); qs.add(ARMOR);
const FLAME6 = [-1, 1].map(s => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 12), new THREE.MeshBasicMaterial({ color: '#ffd080', transparent: true, opacity: 0.85 })); f.rotation.x = Math.PI; f.position.set(s * 0.15, -0.3, 0); ARMOR.add(f); return f; });
const tSuit = tag('鉄のパワードスーツで、戦う', { size: 52, w: 760, bg: '#14161c', sx: 2.5 }); qs.add(tSuit);
const tMarvel = tag('原作は、マーベル・コミック', { size: 52, w: 760, bg: '#e6b450', color: '#14161c', sx: 2.5 }); qs.add(tMarvel);

// ---------- shots ----------
const ALL = [tCaught, tCave, tBoss, tOrder, tWatch, tSecret, tOut, tKey, t2008, tHit, tSuit, tMarvel, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPARK3.forEach(s => s.visible = false); }

function shotCave(t, quiz = 0) { // 1段目 0〜9：遠い国で、武装した集団に捕まった男。目をさますと、そこは暗い洞くつの中（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.4;
  BULB1.intensity = 6 + Math.sin(t * 13) * 0.8;
  const up = quiz ? 1 : ease(clamp((t - 4.6) / 1.2)); MAN1.rotation.set(-Math.PI / 2 * (1 - up), -0.3 * up, 0); MAN1.position.set(lerp(-0.3, 0.5, up), lerp(0.42, 0.0, up), lerp(-1.75, -2.4, up));
  MAN1.userData.head.rotation.y = up * 0.5;
  GUARD1.forEach((g, i) => { g.position.x = 2.6 + i * 0.7 + Math.sin(t * 0.6 + i) * 0.1; });
  Q1.position.set(0.75, 1.15, -2.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tCaught.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tCaught.visible = false; tCave.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.4, 1.0, u), lerp(2.3, 2.1, u), lerp(1.4, 0.8, u), 0.1, 0.9, -2.6, 62);
  return qs;
}
function shotLaunch(t) { // 2段目 9〜17：主人公は、巨大な軍事企業の社長。捕まって、新しい兵器を作れと命じられる
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.9;
  const later = t > 4.2;
  BOSS2.userData.arms.forEach((a, i) => a.rotation.z = later ? 0 : (i ? 1 : -1) * (1.2 + Math.sin(t * 3) * 0.1));
  if (later) { S.darken(0.6, '#1a1008'); BOSS2.userData.head.rotation.x = 0.3; }
  MIS2.rotation.x = t * 0.4;
  CROWD2.forEach((p, i) => p.userData.arms[i % 2].rotation.x = later ? 0 : -2.4 + Math.sin(t * 8 + i) * 0.3);
  tBoss.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBoss.visible = false; tOrder.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.4, 0.2, u), lerp(2.6, 2.4, u), lerp(2.6, 1.8, u), AX + 0.2, 2.0, -4.2, 62);
  return qs;
}
function shotBench(t) { // 3段目 17〜25：見張りの目が光る洞くつ。ガラクタを集めて、こっそり何かを作りはじめる
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.3;
  MAN3.userData.arms[0].rotation.x = -1.3 + Math.sin(t * 9) * 0.2; MAN3.userData.arms[1].rotation.x = -1.1; MAN3.userData.head.rotation.x = 0.4;
  if (t > 4.0) { MAN3.userData.head.rotation.y = Math.sin(t * 1.5) > 0.6 ? 0.8 : 0; SPARK3.forEach((s, i) => { const k = (t * 2 + i / 10) % 1; s.visible = true; s.position.set(BX - 0.1 + Math.sin(i * 7) * k * 0.6, 1.1 + k * 0.5, -2.7 + Math.cos(i * 3) * k * 0.4); }); }
  GUARD3.rotation.y = -2.6 + Math.sin(t * 0.8) * 0.4;
  tWatch.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWatch.visible = false; tSecret.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.4, 0.8, u), lerp(2.4, 2.2, u), lerp(2.0, 1.4, u), BX - 0.2, 1.3, -2.8, 62);
  return qs;
}
function shotExit(t) { // 4段目 25〜33：目的は、生きてここを出ること。カギをにぎるのは、自分の発明
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.35; S.key.intensity = 0.3;
  MAN4.userData.head.rotation.x = t > 4.2 ? 0.6 : -0.1;
  
  tOut.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOut.visible = false; tKey.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(CX - 0.3, 1.8, lerp(1.6, 1.0, u), CX + 0.4, 1.8, -5.0, 62);
  else look(CX - 0.9, 2.6, 0.6, CX - 0.3, 0.7, -2.3, 62);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2008年の、アメリカ映画。全米で大ヒットした、ヒーロー映画
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#0a0608');
  t2008.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2008.visible = false; tHit.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.6, 0.4, u), lerp(2.8, 2.7, u), lerp(2.4, 1.8, u), TX, 2.6, -5.0, 62);
  return qs;
}
function shotFly(t) { // 6段目 42〜49（決め手）：鉄のパワードスーツを着て、戦う。原作は、マーベル・コミック
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 1.4;
  const k = ease(clamp(t / 6)); ARMOR.position.set(DX + lerp(-0.4, 0.4, k), lerp(0.4, 2.2, k) + Math.sin(t * 3) * 0.05, -4); ARMOR.rotation.y = Math.sin(t * 0.8) * 0.3;
  FLAME6.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 30 + i) * 0.3; });
  tSuit.position.set(DX, ARMOR.position.y + 2.7, -4); tMarvel.position.copy(tSuit.position);
  if (t < 3.6) tSuit.userData.pop((t - 0.3) / 0.35); else tMarvel.userData.pop((t - 3.7) / 0.3);
  look(DX + 0.3, ARMOR.position.y + 1.3, 0.2, DX, ARMOR.position.y + 1.4, -4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（洞くつに戻る）
  shotCave(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCave(t, 0) },
  { a: 9, b: 17, f: shotLaunch },
  { a: 17, b: 25, f: shotBench },
  { a: 25, b: 33, f: shotExit },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotFly },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '遠い国で、武装した集団に<br>捕まった男。'],
  [5.6, 9.0, '目をさますと、そこは<br>暗い洞くつの中。'],
  [9.2, 13.2, '主人公は、<br>巨大な軍事企業の社長。'],
  [13.2, 17.0, '新しい兵器を作れと、<br>命じられる。'],
  [17.2, 21.0, '見張りの目が光る、<br>洞くつの作業場。'],
  [21.0, 25.0, 'ガラクタを集めて、<br>こっそり何かを作りはじめる。'],
  [25.2, 29.0, '目的は、生きて<br>ここを出ること。'],
  [29.0, 33.0, 'カギをにぎるのは、<br>自分の発明。'],
  [33.2, 37.4, '2008年の、<br>アメリカ映画。'],
  [37.4, 41.8, '全米で大ヒットした、<br>ヒーロー映画。'],
  [42.2, 45.4, '鉄のパワードスーツを着て、<br>戦う！'],
  [45.4, 49.0, '原作は、<br>マーベル・コミック。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>アイアンマン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q126', v2: true, answer: 'アイアンマン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 12610,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'drone', 0.5], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'buzz', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.4, 'alarm', 0.3], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '遠い国': 'とおいくに', '武装': 'ぶそう', '集団': 'しゅうだん', '捕まった': 'つかまった', '男': 'おとこ', '目': 'め', '暗い': 'くらい', '洞くつ': 'どうくつ', '中': 'なか', '主人公': 'しゅじんこう', '巨大': 'きょだい', '軍事企業': 'ぐんじきぎょう', '社長': 'しゃちょう', '新しい': 'あたらしい', '兵器': 'へいき', '作れ': 'つくれ', '命じられる': 'めいじられる', '見張り': 'みはり', '光る': 'ひかる', '作業場': 'さぎょうば', '集めて': 'あつめて', '何か': 'なにか', '作り': 'つくり', '目的': 'もくてき', '生きて': 'いきて', '出る': 'でる', '自分': 'じぶん', '発明': 'はつめい', '2008年': 'にせんはちねん', 'アメリカ映画': 'アメリカえいが', '全米': 'ぜんべい', '大ヒット': 'だいヒット', 'ヒーロー映画': 'ヒーローえいが', '鉄': 'てつ', '着て': 'きて', '戦う': 'たたかう', '原作': 'げんさく', '映画': 'えいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n遠い国で、武装した集団に捕まった男。目をさますと、そこは暗い洞くつの中。主人公は、巨大な軍事企業の社長。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'アイアンマン', info: 'Prime Video・Hulu｜映画・125分', answerSize: 124 });
