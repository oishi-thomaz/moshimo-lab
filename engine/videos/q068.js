import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #068 ワンダー 君は太陽（映画・アメリカ・2017年・113分。Prime Video・U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/wonder で2026/11/10確認。Filmarks 4.2・レビュー208,365件 filmarks.com/movies/68660）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/ワンダー_君は太陽。2026/11/10）：
//   ・主人公は10歳の男の子。生まれつき人と違う顔をもつ（Filmarks）。27回の手術を受けるなど入退院をくり返してきた（Wikipedia）
//   ・幼い頃からずっと母と自宅学習をしてきたが、小学校5年生になるときに初めて学校へ通う（Filmarks）
//   ・その外見からじろじろ見られたり避けられたりする（Filmarks）。家族に支えられながら懸命に行動を起こす（Wikipedia）
//   ・クラスメートも彼との交流を通して「人間の内面の価値には外見で推し量れないものがある」ことを学んでいく（Wikipedia）
//   ・2017年のアメリカ映画。原作は R・J・パラシオが2012年に発表した小説（Wikipedia）
// 構成（ヒント6段）：1 10歳の男の子が初めて学校の門をくぐる、視線がいっせいに集まる → 2 ずっと家で母と勉強してきた、生まれつき顔が少しちがう
//   → 3 新しいクラス、じろじろ見られたり避けられたり → 4 支えるのは家族、少しずつ彼の行動がクラスを変える
//   → 5 2017年のアメリカ映画、原作は2012年の小説 → 6 決め手：27回の手術を乗りこえた男の子、見た目より大切なもの・タイトルには太陽
// 顔のちがいは絵で表さない（後ろ姿か、ほかの子と同じ汎用の顔）。人物名・学校名・地名は出さない。結末は言わない。
// 俳優の顔・ポスター・有名な場面の構図（ヘルメットの場面など）は使わない。人は汎用の3D

const S = quizStage({ bg: '#8ab4dc', floor: '#9ab878', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(6868);

const BOY = { skin: '#f4d3b5', hair: '#8a5a32', shirt: '#3a7ad8', pants: '#5a6a7a', scale: 0.72 };
const MOM = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#c94f7c', pants: '#2b3346', long: true };
const DAD = { skin: '#f1c9a5', hair: '#c8a070', shirt: '#e9e4da', pants: '#5a4a3a' };
const SIS = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#8e6bbf', pants: '#2b3346', long: true, skirt: true, scale: 0.88 };
const KID = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#6b4a33', '#c8a070', '#2c2421', '#4a3426'][i % 5], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#e9e4da', '#d97a3a', '#4fa3d1'][i % 6], pants: ['#2b3346', '#6b7a8f', '#5a4a3a'][i % 3], long: i % 3 === 1, skirt: i % 3 === 1, scale: 0.72 + (i % 3) * 0.02 });

// ---------- 1段目. 小学校の門の前（x=0）。小さな男の子が門をくぐる。子どもたちが振り向く ----------
{ const gr = box(24, 0.04, 20, mat('#c8c0a8')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const sch = box(14, 5, 3, mat('#b8604a')); sch.position.set(0, 2.5, -12); qs.add(sch);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 8; i++) { const w = box(1.0, 1.0, 0.05, mat('#e8eef4')); w.position.set(-5.6 + i * 1.6, 1.4 + f * 2, -10.47); qs.add(w); }
  const door = box(2.0, 2.4, 0.1, mat('#5a3a2a')); door.position.set(0, 1.2, -10.45); qs.add(door);
  for (const s of [-1, 1]) { const gp = box(0.4, 2.4, 0.4, mat('#8a8a8a')); gp.position.set(s * 1.8, 1.2, 0); qs.add(gp); const fe = box(6, 1.2, 0.1, mat('#5a5a5e')); fe.position.set(s * 4.8, 0.6, 0); qs.add(fe); }
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.6, 10), mat('#4a8a4a')); t.position.set(-9 + i * 3.6 + (i > 2 ? 1 : 0), 2.4, -8); qs.add(t); const tr = box(0.25, 1.2, 0.25, mat('#5a3a2a')); tr.position.set(t.position.x, 0.6, -8); qs.add(tr); } }
const boy1 = makePerson(BOY); qs.add(boy1);
const BAG1 = box(0.36, 0.42, 0.18, mat('#e2483c')); qs.add(BAG1);
const mom1 = makePerson(MOM); mom1.position.set(-0.9, 0, 2.2); qs.add(mom1);
const KIDS1 = []; for (let i = 0; i < 8; i++) { const p = makePerson(KID(i)); p.position.set(-3 + (i % 4) * 2, 0, -3 - Math.floor(i / 4) * 2.2 + (R() - 0.5) * 0.6); p.rotation.y = Math.PI + (R() - 0.5) * 0.6; qs.add(p); KIDS1.push(p); }
const tFirst = tag('はじめての学校', { size: 68, w: 540, bg: '#14161c', sx: 2.2 }); tFirst.position.set(0.2, 2.4, 0.4); qs.add(tFirst);
const tEyes = tag('視線が、集まる', { size: 70, w: 520, bg: '#e2483c', sx: 2.2 }); tEyes.position.set(0.2, 2.4, 0.4); qs.add(tEyes);

// ---------- 2段目. 家の台所のテーブル（x=40）。母と男の子が、教科書を広げて勉強 ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#c8a878')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#f0e4cc')); wl.position.set(AX, 2.5, -3.2); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: '#cfe6f8' })); win.position.set(AX + 2.4, 2.4, -3.08); qs.add(win);
  const tb = box(2.4, 0.08, 1.3, mat('#a07850')); tb.position.set(AX, 0.75, -1.2); qs.add(tb);
  for (const x of [-1.05, 1.05]) for (const z of [-0.6, 0.6]) { const lg = box(0.08, 0.75, 0.08, mat('#7a5a3a')); lg.position.set(AX + x, 0.37, -1.2 + z); qs.add(lg); }
  for (let i = 0; i < 4; i++) { const b = box(0.36, 0.05 + i * 0.01, 0.26, mat(['#e2483c', '#3f8f6b', '#f2c14e', '#3a7ad8'][i])); b.position.set(AX - 0.6 + (i % 2) * 0.5, 0.82 + Math.floor(i / 2) * 0.06, -1.2 + (i % 2) * 0.1); b.rotation.y = (R() - 0.5) * 0.4; qs.add(b); }
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat('#4fa3d1')); globe.position.set(AX + 0.8, 1.0, -1.5); qs.add(globe); }
const boy2 = makePerson(BOY); boy2.position.set(AX + 0.5, 0.18, -0.4); boy2.rotation.y = Math.PI; qs.add(boy2);
const mom2 = makePerson(MOM); mom2.position.set(AX - 0.6, 0, -2.2); qs.add(mom2);
const tHome = tag('家で、母と勉強', { size: 68, w: 520, bg: '#14161c', sx: 1.6 }); tHome.position.set(AX, 2.45, -1.0); qs.add(tHome);
const tFace = tag('生まれつき、顔が少しちがう', { size: 52, w: 760, bg: '#3a7ad8', sx: 1.9 }); tFace.position.set(AX, 2.45, -1.0); qs.add(tFace);

// ---------- 3段目. 教室（x=80）。後ろの席の男の子を、みんながじろじろ見る。となりの子は机をずらす ----------
const BX = 80;
{ const fl = box(14, 0.04, 12, mat('#c8a070')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#f4f0e4')); wl.position.set(BX, 2.5, -6.2); qs.add(wl);
  const bd = box(5, 1.8, 0.06, mat('#2a4a3a')); bd.position.set(BX, 2.4, -6.05); qs.add(bd); }
const DESKS = [], KIDS3 = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
  const x = BX - 2.4 + c * 1.6, z = -4.4 + r * 1.6;
  const d = box(0.8, 0.06, 0.5, mat('#d8b888')); d.position.set(x, 0.62, z); qs.add(d); DESKS.push(d);
  if (r === 2 && c === 1) continue;
  const p = makePerson(KID(r * 4 + c)); p.position.set(x, 0, z + 0.45); p.rotation.y = Math.PI; p.userData.c = c; p.userData.r = r; qs.add(p); KIDS3.push(p);
}
const boy3 = makePerson(BOY); boy3.position.set(BX - 0.8, 0, -1.2 + 0.45); boy3.rotation.y = Math.PI; qs.add(boy3);
const tStare = tag('じろじろ見られる', { size: 66, w: 560, bg: '#14161c', sx: 1.4 }); tStare.position.set(BX - 0.4, 1.95, -1.0); qs.add(tStare);
const tAvoid = tag('避けられる', { size: 76, w: 420, bg: '#e2483c', sx: 1.1 }); tAvoid.position.set(BX - 0.4, 1.95, -1.0); qs.add(tAvoid);

// ---------- 4段目. 夕方の居間（x=120）と、休み時間の校庭。家族が支え、少しずつクラスが変わる ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#b89a78')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#e8d8c0')); wl.position.set(CX, 2.5, -3.4); qs.add(wl);
  const sofa = box(3.2, 0.5, 1.0, mat('#5a7a9a')); sofa.position.set(CX, 0.25, -2.4); qs.add(sofa); const sb = box(3.2, 0.8, 0.25, mat('#4a6a8a')); sb.position.set(CX, 0.8, -2.85); qs.add(sb);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe0a0', side: THREE.DoubleSide })); lamp.position.set(CX + 2.2, 2.2, -2.6); qs.add(lamp); }
const boy4 = makePerson(BOY); boy4.position.set(CX, 0.2, -1.9); qs.add(boy4);
const mom4 = makePerson(MOM); mom4.position.set(CX - 0.9, 0, -1.6); mom4.rotation.y = 0.5; qs.add(mom4);
const dad4 = makePerson(DAD); dad4.position.set(CX + 0.9, 0, -1.6); dad4.rotation.y = -0.5; qs.add(dad4);
const sis4 = makePerson(SIS); sis4.position.set(CX + 0.3, 0, -0.9); sis4.rotation.y = Math.PI - 0.3; qs.add(sis4);
const PX = 140; // 校庭
{ const gr = box(14, 0.04, 12, mat('#9ab878')); gr.position.set(PX, 0.02, -2); qs.add(gr); }
const boy4b = makePerson(BOY); boy4b.position.set(PX, 0, -1.5); qs.add(boy4b);
const FRIENDS = []; for (let i = 0; i < 6; i++) { const p = makePerson(KID(i + 3)); const a = i * Math.PI * 2 / 6 + 0.3; p.userData.a = a; qs.add(p); FRIENDS.push(p); }
const tFam = tag('家族が、支える', { size: 70, w: 520, bg: '#14161c', sx: 1.6 }); tFam.position.set(CX + 0.3, 2.4, -0.8); qs.add(tFam);
const tClass = tag('クラスが、変わっていく', { size: 60, w: 680, bg: '#3f8f6b', sx: 2.0 }); tClass.position.set(PX + 0.2, 2.2, -0.8); qs.add(tClass);

// ---------- 5段目. 映画館のスクリーン（x=180）。2017年のアメリカ映画、原作は2012年の小説 ----------
const TX = 180;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#1a1420' })); bg.position.set(TX, 4, -4); qs.add(bg);
  for (const s of [-1, 1]) { const cu = box(1.2, 5, 0.2, mat('#2a3a7a')); cu.position.set(TX + s * 3.4, 2.9, -3.7); qs.add(cu); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const st = box(0.6, 0.7, 0.6, mat('#2a3a6a')); st.position.set(TX - 2.7 + i * 0.9, 0.35, 0.6 + r * 1.1); qs.add(st); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f4c860'); gr.addColorStop(1, '#e88a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w / 2, h * 0.55, 70, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a7a4a'; g.fillRect(0, h * 0.8, w, h * 0.2); }) })); SCREEN.position.set(TX, 2.9, -3.6); qs.add(SCREEN);
const BOOK = new THREE.Group(); { const cv = box(0.9, 1.2, 0.12, mat('#3a7ad8')); BOOK.add(cv); const pg = box(0.84, 1.14, 0.1, mat('#f4f0e4')); pg.position.z = 0.02; pg.position.x = 0.03; BOOK.add(pg); } BOOK.position.set(TX + 2.0, 1.6, -1.0); qs.add(BOOK);
const t2017 = tag('2017年 アメリカ映画', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.2 }); t2017.position.set(TX, 5.0, -2.8); qs.add(t2017);
const tNovel = tag('原作は、小説', { size: 72, w: 480, bg: '#3a7ad8', sx: 2.4 }); tNovel.position.set(TX, 5.0, -2.8); qs.add(tNovel);

// ---------- 6段目. 青空の校庭（x=220）。手術の数を示す27の光の粒、そして大きな太陽 ----------
const DX = 220;
{ const gr = box(20, 0.04, 16, mat('#9ab878')); gr.position.set(DX, 0.02, -3); qs.add(gr); }
const boy6 = makePerson(BOY); boy6.position.set(DX, 0, 0); boy6.rotation.y = Math.PI; qs.add(boy6);
const DOTS = []; { const dm = new THREE.MeshBasicMaterial({ color: '#ffffff' }); for (let i = 0; i < 27; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), dm); const c = i % 9, r = Math.floor(i / 9); d.position.set(DX - 1.6 + c * 0.4, 2.6 - r * 0.42, -1.5); qs.add(d); DOTS.push(d); } }
const SUN = new THREE.Group(); { const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 24), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); SUN.add(core); for (let i = 0; i < 12; i++) { const ray = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), new THREE.MeshBasicMaterial({ color: '#ffb83a' })); const a = i * Math.PI / 6; ray.position.set(Math.cos(a) * 2.0, Math.sin(a) * 2.0, 0); ray.rotation.z = a - Math.PI / 2; SUN.add(ray); } } SUN.position.set(DX, 5.6, -8); qs.add(SUN);
const t27 = tag('27回の手術', { size: 76, w: 460, bg: '#14161c', sx: 2.2 }); t27.position.set(DX, 3.6, -1.2); qs.add(t27);
const tSun = tag('タイトルに、太陽', { size: 66, w: 560, bg: '#e6b450', color: '#14161c', sx: 2.5 }); tSun.position.set(DX, 2.0, -1.2); qs.add(tSun);

// ---------- shots ----------
const ALL = [tFirst, tEyes, tHome, tFace, tStare, tAvoid, tFam, tClass, t2017, tNovel, t27, tSun];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotGate(t, quiz = 0) { // 1段目 0〜9：10歳の男の子が初めて学校の門をくぐる。視線がいっせいに集まる（0秒目がサムネ。男の子は後ろ姿）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.25;
  const z = lerp(1.6, -0.6, clamp((t - 0.5) / 4.5)); const moving = t > 0.5 && t < 5.0 && !quiz;
  boy1.position.set(0.2, 0, quiz ? -0.6 : z); boy1.rotation.y = Math.PI; poseWalk(boy1, t * 7, moving ? 0.8 : 0);
  BAG1.position.set(boy1.position.x, 1.0 * 0.72 + 0.2, boy1.position.z + 0.18);
  mom1.userData.arms[1].rotation.x = -0.4; mom1.rotation.y = Math.PI;
  const turn = quiz ? 1 : ease(clamp((t - 4.6) / 0.8));
  KIDS1.forEach((p, i) => { p.rotation.y = lerp(Math.PI + (i % 3 - 1) * 0.3, 0 + (p.position.x - 0.2) * -0.08, clamp(turn * 1.2 - i * 0.03)); });
  if (!quiz) { tFirst.userData.pop(1); if (t > 4.4) tFirst.visible = false; tEyes.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.4, u), lerp(1.7, 1.6, u), lerp(5.6, 4.6, u), 0.0, 1.0, -3, 56);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：ずっと家で母と勉強してきた。生まれつき、顔がほかの子と少しちがう
  base(); S.aim(AX, -1); lift(0); S.hemi.intensity = 1.3; S.darken(0.15, '#f4d8a8');
  mom2.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 2) * 0.15; mom2.userData.head.rotation.x = 0.25;
  boy2.userData.arms.forEach(a => { a.rotation.x = -0.9; }); boy2.userData.head.rotation.x = 0.2;
  if (t > 4.2) { boy2.userData.head.rotation.x = 0.45; }
  tHome.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHome.visible = false; tFace.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.9, 0.7, u), lerp(2.2, 2.1, u), lerp(3.4, 2.8, u), AX, 1.0, -1.4, 58);
  return qs;
}
function shotClass(t) { // 3段目 17〜25：新しいクラス。じろじろ見られたり、避けられたり
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.25;
  const look1 = ease(clamp((t - 0.6) / 0.8));
  KIDS3.forEach((p, i) => { const dx = boy3.position.x - p.position.x, dz = boy3.position.z - p.position.z; if (p.userData.r < 2) p.userData.head.rotation.y = 0; p.rotation.y = lerp(Math.PI, Math.atan2(dx, dz), look1 * (p.userData.r < 2 ? 0.7 : 0.9)); });
  const away = ease(clamp((t - 4.4) / 0.8));
  KIDS3.forEach(p => { if (p.userData.r === 2 && Math.abs(p.position.x - boy3.position.x) < 1.8) { const s = Math.sign(p.position.x - boy3.position.x) || 1; p.position.x = BX - 2.4 + p.userData.c * 1.6 + s * 0.5 * away; } });
  tStare.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStare.visible = false; tAvoid.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.6, 1.2, u), lerp(2.6, 2.4, u), lerp(2.4, 1.8, u), BX - 0.8, 0.9, -1.4, 58);
  return qs;
}
function shotFamily(t) { // 4段目 25〜33：支えるのは家族。少しずつ、彼の行動がクラスを変えていく
  base(); lift(0);
  if (t < 4.2) {
    S.aim(CX, -1); S.hemi.intensity = 1.1; S.darken(0.2, '#f4b878');
    mom4.userData.arms[1].rotation.x = -1.2; dad4.userData.arms[0].rotation.x = -1.2; sis4.userData.arms[0].rotation.x = -0.6 - Math.sin(t * 3) * 0.2;
    tFam.userData.pop((t - 0.5) / 0.35);
    look(CX + 0.4, 1.9, lerp(3.4, 3.0, ease(t / 4)), CX, 1.0, -1.6, 58);
  } else {
    S.aim(PX, -1); S.hemi.intensity = 1.3;
    const k = ease(clamp((t - 4.4) / 1.6));
    FRIENDS.forEach((p, i) => { const r = lerp(4.0, 1.1, k); p.position.set(PX + Math.cos(p.userData.a) * r, 0, -1.5 + Math.sin(p.userData.a) * r); p.rotation.y = Math.atan2(PX - p.position.x, -1.5 - p.position.z); poseWalk(p, t * 7 + i, k < 1 ? 0.8 : 0); if (k >= 1) { p.userData.arms[0].rotation.x = -0.4 - Math.abs(Math.sin(t * 3 + i)) * 0.5; } });
    boy4b.userData.arms[1].rotation.x = -2.6 * ease(clamp((t - 6.0) / 0.4));
    tClass.userData.pop((t - 4.4) / 0.35);
    look(PX + 0.6, 2.6, lerp(3.8, 3.2, ease((t - 4.2) / 4)), PX, 0.7, -1.5, 58);
  }
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2017年のアメリカ映画。原作は2012年の小説
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  BOOK.visible = t > 4.2; BOOK.rotation.y = -0.4 + Math.sin(t) * 0.1;
  t2017.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2017.visible = false; tNovel.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(6.4, 5.6, u), TX, 3.2, -3.6, 58);
  return qs;
}
function shotSun(t) { // 6段目 42〜49（決め手）：27回の手術を乗りこえてきた男の子。見た目より大切なもの、タイトルには太陽
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.4; S.key.intensity = 1.6;
  DOTS.forEach((d, i) => { const k = ease(clamp((t - 0.4 - i * 0.07) / 0.2)); d.scale.setScalar(Math.max(1e-4, k)); d.visible = t < 3.3; });
  const s = ease(clamp((t - 3.3) / 0.8)); SUN.scale.setScalar(Math.max(1e-4, s)); SUN.rotation.z = t * 0.3; SUN.visible = s > 0.01;
  boy6.userData.head.rotation.x = t > 3.4 ? -0.35 : 0;
  t27.userData.pop((t - 0.3) / 0.35); if (t > 3.2) t27.visible = false; tSun.userData.pop((t - 3.6) / 0.3);
  const u = ease(t / 7);
  if (t < 3.3) look(DX + 0.2, 2.1, lerp(5.4, 5.0, u), DX, 2.1, -1.5, 56);
  else look(DX + 0.2, lerp(1.2, 1.0, u), lerp(4.6, 4.2, u), DX, 3.4, -6, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（門の前。視線の先に立つ男の子の後ろ姿）
  shotGate(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.6, d); S.darken(0.4 * d, '#2a2030');
  const k = ease(t / 7);
  look(lerp(0.4, 0.3, k), lerp(1.6, 1.4, k), lerp(4.6, 3.8, k), 0.0, 1.0, -3, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGate(t, 0) },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotClass },
  { a: 25, b: 33, f: shotFamily },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotSun },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '10歳の男の子が、<br>初めて学校の門をくぐる。'],
  [5.6, 9.0, 'みんなの視線が、<br>いっせいに集まった。'],
  [9.2, 13.2, '彼はずっと、家で<br>母親と勉強してきた。'],
  [13.2, 17.0, '生まれつき、顔が<br>ほかの子と少しちがう。'],
  [17.2, 21.0, '新しいクラスでは、<br>じろじろ見られる。'],
  [21.0, 25.0, '避けるように、<br>離れていく子もいる。'],
  [25.2, 29.0, '支えるのは、両親と<br>姉の家族みんな。'],
  [29.0, 33.0, '少しずつ、彼の行動が<br>クラスを変えていく。'],
  [33.2, 37.4, '2017年の<br>アメリカ映画。'],
  [37.4, 41.8, '原作は、2012年に<br>発表された小説。'],
  [42.2, 45.4, '27回の手術を<br>乗りこえてきた男の子。'],
  [45.4, 49.0, '見た目より大切なもの。<br>タイトルには、太陽。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ワンダー<br>君は太陽。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q068', v2: true, answer: 'ワンダー 君は太陽',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 6868,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '10歳': 'じゅっさい', '男の子': 'おとこのこ', '初めて': 'はじめて', '学校': 'がっこう', '門': 'もん', '視線': 'しせん', '集まった': 'あつまった', '彼': 'かれ', '家で': 'いえで', '母親': 'ははおや', '勉強': 'べんきょう', '生まれつき': 'うまれつき', '顔': 'かお', '少し': 'すこし', '新しい': 'あたらしい', '見られる': 'みられる', '避ける': 'さける', '離れて': 'はなれて', '支える': 'ささえる', '両親': 'りょうしん', '姉': 'あね', '家族': 'かぞく', '行動': 'こうどう', '変えて': 'かえて', '2017年': 'にせんじゅうななねん', 'アメリカ映画': 'アメリカえいが', '原作': 'げんさく', '2012年': 'にせんじゅうにねん', '発表': 'はっぴょう', '小説': 'しょうせつ', '27回': 'にじゅうななかい', '手術': 'しゅじゅつ', '乗りこえて': 'のりこえて', '見た目': 'みため', '大切': 'たいせつ', '太陽': 'たいよう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '君は': 'きみは', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n10歳の男の子が、初めて学校の門をくぐる。みんなの視線が、いっせいに集まった。彼はずっと、家で母親と勉強してきた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '泣ける映画'],
  },
});
applyQuizCards({ answer: 'ワンダー<br><span style="font-size:84px">君は太陽</span>', info: 'Prime Video・U-NEXT｜映画・113分', answerSize: 124 });
