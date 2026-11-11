import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #070 トイ・ストーリー（映画・アメリカ・1995年（日本は1996年）・81分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/toisutori で2026/11/11確認（Filmarks の動画配信欄もディズニープラス見放題）。
//   Filmarks 4.0・レビュー256,128件 filmarks.com/movies/36365）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/トイ・ストーリー。2026/11/11）：
//   ・おもちゃたちは生きていて動いたり話したりできるが、子どもに知られてはいけないというルールを守っている（Wikipedia）
//   ・カウボーイ人形が、持ち主の男の子の一番のお気に入り。誕生日に最新式のスペース・レンジャーが現れ、主役の座が奪われそうになる（Filmarks）
//   ・張り合ううち、おもちゃいじめが趣味の少年に捕まって大ピンチ。脱出作戦で力を合わせるうちに友情の絆が芽生える（Filmarks）
//   ・1995年のアメリカ映画（日本公開1996年3月23日）。劇場用長編として世界初のフルCGアニメーション。ピクサー制作（Wikipedia）
// 構成（ヒント6段）：1 人がいなくなると、おもちゃたちがこっそり動き出す → 2 主人公は持ち主のいちばんのお気に入り、誕生日に新しいおもちゃ
//   → 3 新入りは最新式の人気者、主人公は焦る → 4 張り合ううち少年に捕まる、脱出のため力を合わせる
//   → 5 1995年のアメリカ映画、世界初の長編フルCGアニメ → 6 決め手：カウボーイ人形とスペース・レンジャー、おもちゃたちの友情
// キャラクターの見た目（服の柄・色の組み合わせ・顔）・決めぜりふ・ロゴ・有名な場面の構図は使わない。人もおもちゃも汎用の3D。結末は言わない

const S = quizStage({ bg: '#9ac4e8', floor: '#c8a878', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(7070);

const DOLL = { skin: '#f1c9a5', hair: '#6b4a33', shirt: '#d84a3a', pants: '#5a7aa8', scale: 0.5 };
const NEWT = { skin: '#f4d3b5', hair: '#3a3a3a', shirt: '#e8ecf4', pants: '#b8c0d0', scale: 0.5 };
const KIDP = { skin: '#f4d3b5', hair: '#8a5a32', shirt: '#3a7ad8', pants: '#5a6a7a', scale: 0.8 };
const BULLY = { skin: '#e8b98f', hair: '#1d1a19', shirt: '#3a3a3a', pants: '#2b2b30', scale: 0.85 };

// 子ども部屋（壁・床・窓・ベッド・本棚）
function room(x, wall = '#d8e8f4', lamp = false) {
  const fl = box(16, 0.04, 12, mat('#c8a070')); fl.position.set(x, 0.02, -1); qs.add(fl);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.02, 32), mat('#e8c060')); rug.position.set(x, 0.05, -0.6); qs.add(rug);
  const wl = box(16, 6, 0.2, mat(wall)); wl.position.set(x, 3, -5); qs.add(wl);
  const sl = box(0.2, 6, 12, mat(wall)); sl.position.set(x - 6, 3, -1); qs.add(sl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: '#cfe6f8' })); win.position.set(x + 2.6, 3.0, -4.88); qs.add(win);
  const bed = box(2.0, 0.6, 3.2, mat('#4a7ac8')); bed.position.set(x - 4.4, 0.3, -2.6); qs.add(bed);
  const pil = box(1.2, 0.2, 0.6, mat('#f4f0e4')); pil.position.set(x - 4.4, 0.7, -3.8); qs.add(pil);
  const shelf = box(1.6, 2.4, 0.5, mat('#a07850')); shelf.position.set(x + 5.4, 1.2, -4.6); qs.add(shelf);
  for (let i = 0; i < 6; i++) { const b = box(0.18, 0.5, 0.36, mat(['#e2483c', '#3f8f6b', '#f2c14e', '#3a7ad8'][i % 4])); b.position.set(x + 4.9 + i * 0.2, 1.65, -4.5); qs.add(b); }
}
// 汎用のおもちゃ（積み木・ボール・ロボット・くま・車）
function blocks(x, z) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = box(0.4, 0.4, 0.4, mat(['#e2483c', '#f2c14e', '#3a7ad8'][i])); b.position.set((i - 1) * 0.42, 0.2, 0); g.add(b); } const t = box(0.4, 0.4, 0.4, mat('#3f8f6b')); t.position.set(0, 0.6, 0); g.add(t); g.position.set(x, 0, z); qs.add(g); return g; }
function ball(x, z) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), mat('#e2483c')); b.position.set(x, 0.32, z); qs.add(b); return b; }
function robot(x, z) { const g = new THREE.Group(); const bd = box(0.5, 0.6, 0.34, mat('#9aa4b4')); bd.position.y = 0.55; g.add(bd); const hd = box(0.4, 0.34, 0.34, mat('#b8c0d0')); hd.position.y = 1.05; g.add(hd); for (const s of [-1, 1]) { const e = box(0.08, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: '#ffd84a' })); e.position.set(s * 0.09, 1.08, 0.18); g.add(e); const lg = box(0.14, 0.26, 0.16, mat('#6a7484')); lg.position.set(s * 0.13, 0.13, 0); g.add(lg); } const an = box(0.04, 0.2, 0.04, mat('#e2483c')); an.position.y = 1.32; g.add(an); g.position.set(x, 0, z); qs.add(g); return g; }
function bear(x, z) { const g = new THREE.Group(); const c = mat('#a8703a'); const bd = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), c); bd.position.y = 0.32; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), c); hd.position.y = 0.8; g.add(hd); for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), c); ear.position.set(s * 0.17, 0.99, 0); g.add(ear); const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat('#121212')); e.position.set(s * 0.08, 0.84, 0.21); g.add(e); } g.position.set(x, 0, z); qs.add(g); return g; }
function car(x, z) { const g = new THREE.Group(); const bd = box(0.9, 0.26, 0.46, mat('#f2c14e')); bd.position.y = 0.24; g.add(bd); const tp = box(0.5, 0.2, 0.42, mat('#e2a83a')); tp.position.set(-0.05, 0.47, 0); g.add(tp); for (const sx of [-0.3, 0.3]) for (const sz of [-0.24, 0.24]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14), mat('#24262b')); w.rotation.x = Math.PI / 2; w.position.set(sx, 0.11, sz); g.add(w); } g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 子ども部屋（x=0）。男の子が部屋を出ていく。床のおもちゃたちが動き出す ----------
room(0);
const door = box(1.2, 2.4, 0.1, mat('#f4f0e4')); door.position.set(-2.4, 1.2, -4.86); qs.add(door);
const kid1 = makePerson(KIDP); qs.add(kid1);
const TOYS1 = [robot(-0.9, -0.4), bear(0.9, -0.6), blocks(0.1, -1.8), car(-1.6, 0.6), ball(1.6, 0.5)];
const hero1 = makePerson(DOLL); hero1.position.set(0.1, 0, 0.5); qs.add(hero1);
const tEmpty = tag('だれもいない部屋', { size: 62, w: 580, bg: '#14161c', sx: 2.0 }); tEmpty.position.set(0, 1.55, -0.5); qs.add(tEmpty);
const tMove = tag('おもちゃが、動き出す', { size: 60, w: 640, bg: '#e2483c', sx: 2.2 }); tMove.position.set(0, 1.55, -0.5); qs.add(tMove);

// ---------- 2段目. ベッドの上のお気に入り（x=40）→ 誕生日のプレゼント ----------
const AX = 40;
room(AX, '#f0e4d0');
const hero2 = makePerson(DOLL); hero2.position.set(AX - 4.4, 0.6, -2.6); qs.add(hero2);
const HEART2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshBasicMaterial({ color: '#ff6a7a' })); qs.add(HEART2);
const kid2 = makePerson(KIDP); kid2.position.set(AX - 2.9, 0, -1.6); kid2.rotation.y = -1.2; qs.add(kid2);
const CAKE = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24), mat('#f4e4d0')); c.position.y = 0.2; CAKE.add(c); const ic = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24), mat('#ff8aa0')); ic.position.y = 0.42; CAKE.add(ic); for (let i = 0; i < 5; i++) { const cd = box(0.04, 0.2, 0.04, mat('#5ab0e0')); const a = i * Math.PI * 2 / 5; cd.position.set(Math.cos(a) * 0.3, 0.55, Math.sin(a) * 0.3); CAKE.add(cd); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); fl.position.set(cd.position.x, 0.68, cd.position.z); CAKE.add(fl); } const tb = box(1.6, 0.06, 1.0, mat('#a07850')); tb.position.y = -0.03; CAKE.add(tb); } CAKE.position.set(AX + 0.4, 0.8, -1.8); qs.add(CAKE);
{ const tl = box(1.5, 0.77, 0.9, mat('#8a6a48')); tl.position.set(AX + 0.4, 0.385, -1.8); qs.add(tl); }
const GIFT = new THREE.Group(); { const b = box(0.8, 0.6, 0.8, mat('#3a7ad8')); b.position.y = 0.3; GIFT.add(b); const r1 = box(0.82, 0.62, 0.12, mat('#f2c14e')); r1.position.y = 0.3; GIFT.add(r1); const r2 = box(0.12, 0.62, 0.82, mat('#f2c14e')); r2.position.y = 0.3; GIFT.add(r2); } GIFT.position.set(AX + 1.8, 0, -0.8); qs.add(GIFT);
const LID = box(0.86, 0.12, 0.86, mat('#3a7ad8')); qs.add(LID);
const GLOW2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4b0', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); GLOW2.rotation.x = Math.PI; GLOW2.position.set(AX + 1.8, 1.8, -0.8); qs.add(GLOW2);
const tFav = tag('いちばんのお気に入り', { size: 58, w: 640, bg: '#14161c', sx: 1.3 }); tFav.position.set(AX - 4.3, 2.05, -2.6); qs.add(tFav);
const tBday = tag('ところが、誕生日', { size: 62, w: 560, bg: '#e2483c', sx: 2.0 }); tBday.position.set(AX + 0.8, 2.6, -1.2); qs.add(tBday);

// ---------- 3段目. ピカピカの新入りを囲むおもちゃたち（x=80）。主人公はひとり離れて ----------
const BX = 80;
room(BX, '#e0d8f0');
const STAGE = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 24), mat('#f2c14e')); STAGE.position.set(BX + 0.8, 0.15, -1.6); qs.add(STAGE);
const new3 = makePerson(NEWT); new3.position.set(BX + 0.8, 0.3, -1.6); qs.add(new3);
const SHINE = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: '#fff4b0' })); qs.add(s); SHINE.push(s); }
const FANS = [robot(BX + 0.2, -2.8), bear(BX + 2.0, -0.6), car(BX + 1.0, -0.2), blocks(BX + 2.4, -2.6)];
const hero3 = makePerson(DOLL); hero3.position.set(BX - 1.3, 0, 0.9); hero3.rotation.y = 2.5; qs.add(hero3);
const tNew = tag('最新式の、新入り', { size: 62, w: 560, bg: '#14161c', sx: 2.0 }); tNew.position.set(BX + 0.2, 1.95, -1.0); qs.add(tNew);
const tStar = tag('みんなの、人気者に', { size: 60, w: 600, bg: '#8e6bbf', sx: 2.1 }); tStar.position.set(BX + 0.2, 1.95, -1.0); qs.add(tStar);

// ---------- 4段目. 言い争うふたり（x=120）→ 少年の部屋で捕まる（x=140） ----------
const CX = 120;
room(CX);
const hero4 = makePerson(DOLL); hero4.position.set(CX - 0.5, 0, -0.8); hero4.rotation.y = Math.PI / 2; qs.add(hero4);
const new4 = makePerson(NEWT); new4.position.set(CX + 0.5, 0, -0.8); new4.rotation.y = -Math.PI / 2; qs.add(new4);
const PX = 140;
{ const fl = box(14, 0.04, 12, mat('#6a5a4a')); fl.position.set(PX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#4a4a50')); wl.position.set(PX, 3, -5); qs.add(wl);
  for (let i = 0; i < 8; i++) { const sc = box(0.3 + R() * 0.3, 0.1, 0.3, mat(['#9aa4b4', '#e2483c', '#6a7484'][i % 3])); sc.position.set(PX - 3 + R() * 6, 0.05, -2.5 + R() * 3); sc.rotation.y = R() * 3; qs.add(sc); } }
const bully = makePerson(BULLY); bully.position.set(PX, 0, -2.8); qs.add(bully);
const hero4b = makePerson(DOLL); hero4b.position.set(PX - 0.5, 0, -0.6); qs.add(hero4b);
const new4b = makePerson(NEWT); new4b.position.set(PX + 0.5, 0, -0.6); qs.add(new4b);
const SHADOW = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false })); SHADOW.rotation.x = -Math.PI / 2; SHADOW.position.set(PX, 0.06, -0.8); qs.add(SHADOW);
const tRival = tag('張り合うふたり', { size: 64, w: 520, bg: '#14161c', sx: 1.4 }); tRival.position.set(CX, 1.75, -0.8); qs.add(tRival);
const tCaught = tag('少年に、捕まる', { size: 64, w: 520, bg: '#e2483c', sx: 1.8 }); tCaught.position.set(PX, 2.0, -0.6); qs.add(tCaught);

// ---------- 5段目. 映画館のスクリーン（x=180）。1995年のアメリカ映画、世界初の長編フルCGアニメ ----------
const TX = 180;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#1a1420' })); bg.position.set(TX, 4, -4); qs.add(bg);
  for (const s of [-1, 1]) { const cu = box(1.2, 5, 0.2, mat('#7a2a3a')); cu.position.set(TX + s * 3.4, 2.9, -3.7); qs.add(cu); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const st = box(0.6, 0.7, 0.6, mat('#6a2a3a')); st.position.set(TX - 2.7 + i * 0.9, 0.35, 0.6 + r * 1.1); qs.add(st); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { g.fillStyle = '#0c1a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,200,255,.55)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = '#9ae0ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(200, 230); g.lineTo(280, 110); g.lineTo(360, 230); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(280, 110); g.lineTo(300, 200); g.stroke(); }) })); SCREEN.position.set(TX, 2.9, -3.6); qs.add(SCREEN);
const t1995 = tag('1995年 アメリカ映画', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.2 }); t1995.position.set(TX, 5.0, -2.8); qs.add(t1995);
const tCG = tag('世界初の長編フルCGアニメ', { size: 54, w: 780, bg: '#3a7ad8', sx: 3.6 }); tCG.position.set(TX, 5.0, -2.8); qs.add(tCG);

// ---------- 6段目. 窓辺の棚の上（x=220）。カウボーイハットの人形と、宇宙のヘルメットの人形が並ぶ ----------
const DX = 220;
room(DX, '#f4e8c8');
{ const tb = box(3.2, 0.1, 1.4, mat('#a07850')); tb.position.set(DX, 1.0, -2.0); qs.add(tb); const tl = box(3.0, 0.95, 1.2, mat('#8a6a48')); tl.position.set(DX, 0.47, -2.0); qs.add(tl); }
const hero6 = makePerson(DOLL); hero6.position.set(DX - 0.5, 1.05, -2.0); qs.add(hero6);
const HAT = new THREE.Group(); { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 24), mat('#8a5a2a')); HAT.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.2, 18), mat('#8a5a2a')); crown.position.y = 0.11; HAT.add(crown); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.04, 18), mat('#3a2418')); band.position.y = 0.04; HAT.add(band); } qs.add(HAT);
const new6 = makePerson(NEWT); new6.position.set(DX + 0.5, 1.05, -2.0); qs.add(new6);
const HELM = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.45, metalness: 0.3, roughness: 0.1 })); qs.add(HELM);
const PACK = box(0.3, 0.32, 0.12, mat('#9aa4b4')); qs.add(PACK);
const STARS = []; for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: '#ffe680' })); s.userData.a = i * 0.9; s.userData.r = 0.9 + (i % 3) * 0.25; qs.add(s); STARS.push(s); }
const tCow = tag('カウボーイ人形と', { size: 62, w: 560, bg: '#8a5a2a', sx: 1.7 }); tCow.position.set(DX, 2.75, -1.8); qs.add(tCow);
const tSpace = tag('スペース・レンジャー', { size: 58, w: 640, bg: '#3a7ad8', sx: 1.9 }); tSpace.position.set(DX, 2.75, -1.8); qs.add(tSpace);

// ---------- shots ----------
const ALL = [tEmpty, tMove, tFav, tBday, tNew, tStar, tRival, tCaught, t1995, tCG, tCow, tSpace];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }
const hop = (t, t0, i) => Math.max(0, Math.sin(clamp((t - t0 - i * 0.12) * 5, 0, Math.PI))) * 0.25;

function shotRoom(t, quiz = 0) { // 1段目 0〜9：人がいなくなると、おもちゃたちがこっそり動き出す（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.2;
  const k = clamp((t - 0.3) / 3.4); const out = quiz || t > 3.8;
  kid1.visible = !out; kid1.position.set(lerp(-0.6, -2.4, k), 0, lerp(-1.2, -4.4, k)); kid1.rotation.y = Math.PI + 0.4; poseWalk(kid1, t * 7, out ? 0 : 0.8);
  door.rotation.y = 0; door.position.x = out ? -2.4 : -3.6;
  const live = quiz ? 1 : ease(clamp((t - 4.6) / 0.6));
  TOYS1.forEach((g, i) => { g.position.y = quiz ? 0 : hop(t, 4.7, i) * 1.4; g.rotation.y = live * Math.sin(t * 2 + i) * 0.5; });
  hero1.rotation.x = lerp(-Math.PI / 2, 0, live); hero1.position.y = lerp(0.1, 0, live); hero1.rotation.y = Math.PI * 0.85 * live;
  hero1.userData.arms[1].rotation.x = live > 0.9 ? -2.4 : 0;
  if (!quiz) { tEmpty.userData.pop(1); if (t > 4.4) tEmpty.visible = false; tMove.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(1.7, 1.4, u), lerp(4.6, 3.8, u), 0.0, 0.6, -1.0, 60);
  return qs;
}
function shotFav(t) { // 2段目 9〜17：主人公は持ち主のいちばんのお気に入り。ところが誕生日に新しいおもちゃが届く
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.25;
  kid2.userData.arms[0].rotation.x = -0.6;
  HEART2.visible = t < 4.0; HEART2.position.set(AX - 4.4, 1.78 + Math.sin(t * 3) * 0.06, -2.6);
  const open = ease(clamp((t - 5.0) / 0.6));
  LID.position.set(AX + 1.8 + open * 0.7, 0.66 + open * 0.3, -0.8); LID.rotation.z = -open * 0.9;
  GLOW2.visible = open > 0.05; GLOW2.material.opacity = 0.45 * open;
  tFav.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFav.visible = false; tBday.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.0) look(AX - 3.0, lerp(2.4, 2.2, u), lerp(1.4, 1.0, u), AX - 4.3, 1.0, -2.6, 58);
  else look(AX + 0.8, 2.4, lerp(3.6, 3.0, u), AX + 1.0, 1.0, -1.2, 58);
  return qs;
}
function shotStar(t) { // 3段目 17〜25：新入りは最新式でピカピカの人気者。主人公は居場所を奪われそうで焦る
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.2;
  new3.userData.arms[0].rotation.x = -2.6 + Math.sin(t * 3) * 0.2; new3.rotation.y = Math.sin(t * 0.8) * 0.3;
  SHINE.forEach((s, i) => { const a = t * 1.6 + i * 0.63; s.position.set(BX + 0.8 + Math.cos(a) * 0.8, 0.5 + (i % 4) * 0.25, -1.6 + Math.sin(a) * 0.8); s.rotation.y = t * 3; });
  FANS.forEach((g, i) => { g.position.y = Math.max(0, Math.sin(t * 6 + i * 1.3)) * 0.12; g.rotation.y = Math.atan2(BX + 0.8 - g.position.x, -1.6 - g.position.z); });
  hero3.userData.head.rotation.x = t > 4.2 ? 0.35 : 0;
  tNew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNew.visible = false; tStar.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX - lerp(2.2, 1.9, u), lerp(1.5, 1.4, u), lerp(3.2, 2.8, u), BX + 0.5, 0.7, -1.4, 60);
  return qs;
}
function shotRival(t) { // 4段目 25〜33：張り合ううちに、ふたりはおもちゃいじめの少年に捕まる。脱出のため、力を合わせるしかない
  base(); lift(0);
  if (t < 4.2) {
    S.aim(CX, -1); S.hemi.intensity = 1.2;
    hero4.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 8) * 0.3; new4.userData.arms[0].rotation.x = -1.4 + Math.cos(t * 8) * 0.3;
    tRival.userData.pop((t - 0.5) / 0.35);
    look(CX + 0.1, 1.2, lerp(3.0, 2.6, ease(t / 4)), CX, 0.7, -0.8, 58);
  } else {
    S.aim(PX, -1); S.hemi.intensity = 0.65; S.darken(0.35, '#1a1418');
    S.spot.color.set(0xff6a4a); S.spot.position.set(PX, 6, 1); S.spot.target.position.set(PX, 0, -0.8); S.spot.intensity = 30;
    const k = ease(clamp((t - 4.4) / 1.0)); bully.position.z = lerp(-2.8, -1.8, k); bully.userData.arms.forEach(a => a.rotation.x = -1.3 * k);
    SHADOW.scale.setScalar(lerp(0.6, 1.1, k));
    hero4b.rotation.y = Math.PI * 0.9; new4b.rotation.y = -Math.PI * 0.9; hero4b.userData.arms[0].rotation.x = t > 6 ? -1.2 : 0; new4b.userData.arms[1].rotation.x = t > 6 ? -1.2 : 0;
    tCaught.userData.pop((t - 4.4) / 0.35);
    look(PX + 0.3, 1.0, lerp(2.8, 2.4, ease((t - 4.2) / 4)), PX, 1.0, -1.4, 62);
  }
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1995年のアメリカ映画。世界で初めての長編フルCGアニメ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  t1995.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t1995.visible = false; tCG.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(6.4, 5.6, u), TX, 3.2, -3.6, 58);
  return qs;
}
function shotDuo(t) { // 6段目 42〜49（決め手）：カウボーイ人形と、スペース・レンジャー。おもちゃたちの友情の物語
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.6;
  const hk = ease(clamp((t - 0.4) / 0.5)); HAT.position.set(hero6.position.x, 1.05 + 1.0 * 0.5 + 0.5 * 0.5 + 0.02 + (1 - hk) * 0.6, -2.0); HAT.visible = hk > 0.01;
  const sk = ease(clamp((t - 3.4) / 0.5)); HELM.position.set(new6.position.x, 1.05 + 0.87, -2.0); HELM.visible = t > 3.3; HELM.scale.setScalar(Math.max(1e-4, sk));
  PACK.position.set(new6.position.x, 1.05 + 0.6, -2.2); PACK.visible = t > 3.3;
  const fr = t > 5.0; hero6.userData.arms[1].rotation.x = fr ? -0.3 : 0; hero6.userData.arms[1].rotation.z = fr ? 0.5 : 0; new6.userData.arms[0].rotation.z = fr ? -0.5 : 0;
  STARS.forEach(s => { const a = s.userData.a + t * 1.2; s.position.set(DX + Math.cos(a) * s.userData.r, 1.7 + Math.sin(a * 1.3) * 0.25, -2.0 + Math.sin(a) * 0.4); s.visible = t > 5.0; });
  tCow.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tCow.visible = false; tSpace.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + 0.1, lerp(1.9, 1.8, u), lerp(2.6, 2.2, u), DX, 1.6, -2.0, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（子ども部屋に戻る。おもちゃたちが動き出したあと）
  shotRoom(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.2, 0.6, d); S.darken(0.4 * d, '#2a2030');
  const k = ease(t / 7);
  look(lerp(0.2, 0.1, k), lerp(1.4, 1.2, k), lerp(3.8, 3.2, k), 0.0, 0.6, -1.0, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotFav },
  { a: 17, b: 25, f: shotStar },
  { a: 25, b: 33, f: shotRival },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotDuo },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '子ども部屋から、<br>人がいなくなると…'],
  [5.6, 9.0, 'おもちゃたちが、<br>こっそり動き出す。'],
  [9.2, 13.2, '主人公は、持ち主の<br>いちばんのお気に入り。'],
  [13.2, 17.0, 'ところが誕生日に、<br>新しいおもちゃが届く。'],
  [17.2, 21.0, '新入りは、最新式の<br>ピカピカの人気者。'],
  [21.0, 25.0, '主人公は、居場所を<br>奪われそうで焦る。'],
  [25.2, 29.0, '張り合ううちに、ふたりは<br>少年に捕まってしまう。'],
  [29.0, 33.0, '脱出するには、<br>力を合わせるしかない。'],
  [33.2, 37.4, '1995年の、<br>アメリカ映画。'],
  [37.4, 41.8, '世界で初めての、<br>長編フルCGアニメ。'],
  [42.2, 45.4, 'カウボーイ人形と、<br>スペース・レンジャー。'],
  [45.4, 49.0, 'おもちゃたちの、<br>友情の物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>トイ・ストーリー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q070', v2: true, answer: 'トイ・ストーリー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 7070,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '子ども部屋': 'こどもべや', '人': 'ひと', '動き出す': 'うごきだす', '主人公': 'しゅじんこう', '持ち主': 'もちぬし', '誕生日': 'たんじょうび', '新しい': 'あたらしい', '届く': 'とどく', '新入り': 'しんいり', '最新式': 'さいしんしき', '人気者': 'にんきもの', '居場所': 'いばしょ', '奪われ': 'うばわれ', '焦る': 'あせる', '張り合う': 'はりあう', '少年': 'しょうねん', '捕まって': 'つかまって', '脱出': 'だっしゅつ', '力': 'ちから', '合わせる': 'あわせる', '1995年': 'せんきゅうひゃくきゅうじゅうごねん', 'アメリカ映画': 'アメリカえいが', '世界': 'せかい', '初めて': 'はじめて', '長編': 'ちょうへん', 'フルCG': 'フルシージー', '人形': 'にんぎょう', '友情': 'ゆうじょう', '物語': 'ものがたり', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n子ども部屋から人がいなくなると、おもちゃたちがこっそり動き出す。主人公は、持ち主のいちばんのお気に入り。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'ピクサー', '映画好き', 'アニメ映画'],
  },
});
applyQuizCards({ answer: 'トイ・ストーリー', info: 'Disney+｜アニメ映画・81分', answerSize: 116 });
