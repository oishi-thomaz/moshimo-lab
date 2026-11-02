import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #020 HEARTSTOPPER ハートストッパー（ドラマ・イギリス・シーズン1〜3。Netflixで見放題、justwatch.com/jp/テレビ番組/heartstopper で2026/11/2確認。Filmarks シーズン1 4.4 filmarks.com/dramas/12117/16723）
// 設定（シーズン1の始まりだけ）：イギリスの男子校。内気なチャーリーは、ゲイだと周りに知られてからいじめを受けている。新学年のクラス替えで、となりの席になったのは
//       ひとつ上の学年で、ラグビー部の人気者ニック。ふたりは友だちになり、やがてお互いに惹かれ合う。原作はアリス・オズマンの同名の漫画で、23か国以上で翻訳。
//       漫画を取り入れたようなイラストの演出がある（Filmarks の作品ページ・ciatr の作品解説・JustWatch）
// 構成（ヒント6段）：1 となりの席に座ったのは学校いちの人気者 → 2 ある噂が広まってから、ひとりで過ごす内気な彼 → 3 男子校のグラウンド、ラグビー部のひとつ上の先輩
//       → 4 友だちになり、友情以上の気持ちが芽生える → 5 イギリスの青春ラブストーリー、原作は世界で翻訳された漫画 → 6 決め手：画面に漫画のようなイラストが舞う、男の子どうしの恋
// 結末には触れない。いじめの場面は直接見せない。作品の映像・俳優・原作の絵・ロゴは使わない。登場人物の名前・学校名は出さない。人と学校は汎用の3D

const S = quizStage({ bg: '#b8d0e4', floor: '#8a9a7a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2020);
const SHY = { skin: '#f4dccb', hair: '#2a2420', shirt: '#f4f4f0', pants: '#3a3f4a', tie: true, scale: 0.94 };
const STAR = { skin: '#f1c9a5', hair: '#c9a46a', shirt: '#f4f4f0', pants: '#3a3f4a', tie: true, scale: 1.05 };
function blazer(p, c = '#2a3450') { const b = box(0.54, 0.5, 0.31, mat(c)); b.position.set(0, 1.2, -0.01); p.add(b); }

// ---------- 1. 教室（x=0）。0秒目がサムネ ----------
{ const fl = box(14, 0.1, 12, mat('#9a8468')); fl.position.set(0, 0.05, -2); qs.add(fl);
  const back = box(14, 4, 0.2, mat('#e8e2d4')); back.position.set(0, 2, -6); qs.add(back);
  const board = box(6, 1.8, 0.08, mat('#2f4a3a')); board.position.set(0, 2.2, -5.85); qs.add(board);
  const side = box(0.2, 4, 12, mat('#e8e2d4')); side.position.set(-5.5, 2, -2); qs.add(side);
  const side2 = box(0.2, 4, 12, mat('#e8e2d4')); side2.position.set(5.5, 2, -2); qs.add(side2);
  const front = box(14, 4, 0.2, mat('#ddd6c6')); front.position.set(0, 2, 3.6); qs.add(front);
  const ceil = box(14, 0.2, 12, mat('#f0ece4')); ceil.position.set(0, 4.0, -2); ceil.castShadow = false; qs.add(ceil);
  for (const x of [-0.4, 0.45]) { const ch = box(0.5, 0.08, 0.5, mat('#7a5a3a')); ch.position.set(x, 0.46, -1.1); qs.add(ch); const cl = box(0.06, 0.44, 0.06, mat('#5a5a5a')); cl.position.set(x, 0.22, -1.1); qs.add(cl); }
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: '#e8f4ff' })); w.position.set(-5.39, 2.3, -3.6 + i * 2.6); w.rotation.y = Math.PI / 2; qs.add(w); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { if (r === 1 && c === 1) continue; const d = box(1.6, 0.08, 0.7, mat('#c8a878')); d.position.set(-2.4 + c * 2.4, 0.78, -3.6 + r * 1.8); qs.add(d); for (const x of [-0.7, 0.7]) { const l = box(0.06, 0.74, 0.6, mat('#5a5a5a')); l.position.set(d.position.x + x, 0.38, d.position.z); qs.add(l); } } }
const DESK = box(1.6, 0.08, 0.7, mat('#c8a878')); DESK.position.set(0, 0.78, -1.8); qs.add(DESK);
const shy1 = makePerson(SHY); blazer(shy1); shy1.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); shy1.position.set(-0.4, -0.38, -1.15); shy1.rotation.y = Math.PI; qs.add(shy1);
const star1 = makePerson(STAR); blazer(star1); qs.add(star1);
const tStar = tag('学校いちの人気者', { size: 64, w: 560, bg: '#e6b450', color: '#14161c' , sx: 1.40 }); tStar.position.set(-0.05, 2.0, -1.3); qs.add(tStar);

// ---------- 2. 廊下、ひとりの彼（x=30） ----------
{ const fl = box(6, 0.1, 30, mat('#b8b0a0')); fl.position.set(30, 0.05, -8); qs.add(fl);
  for (const s of [-1, 1]) { const w = box(0.2, 3.4, 30, mat('#d8d0c0')); w.position.set(30 + s * 3, 1.7, -8); qs.add(w);
    for (let i = 0; i < 18; i++) { const lk = box(0.1, 1.8, 0.7, mat(i % 2 ? '#4a6a8a' : '#3e5c7a')); lk.position.set(30 + s * 2.85, 0.9, 2 - i * 0.74); qs.add(lk); } } }
const shy2 = makePerson(SHY); blazer(shy2); shy2.position.set(30.6, 0, -1.0); shy2.rotation.y = Math.PI + 0.1; qs.add(shy2);
const bag = box(0.36, 0.42, 0.16, mat('#4a3a30')); bag.position.set(0, 1.15, -0.22); shy2.add(bag);
const GROUP = [0, 1, 2, 3].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#efcfae', '#d9a57c'][i], hair: ['#4a3426', '#1d1a19', '#8a5a3a', '#2c2421'][i], shirt: '#f4f4f0', pants: '#3a3f4a', tie: true }); blazer(p); p.position.set(28.4 + (i % 2) * 0.8, 0, -6.5 - Math.floor(i / 2) * 0.8); p.rotation.y = i % 2 ? -0.8 : 0.8; qs.add(p); return p; });
const tAlone = tag('内気な彼', { size: 72, w: 340, bg: '#14161c' , sx: 0.85 }); tAlone.position.set(30.6, 2.4, -1.0); qs.add(tAlone);

// ---------- 3. 男子校のグラウンド（x=60） ----------
{ const g = box(40, 0.05, 40, mat('#6aa04a')); g.position.set(60, 0.03, -12); qs.add(g);
  for (let i = 0; i < 6; i++) { const ln = box(30, 0.02, 0.12, mat('#f4f4f0')); ln.position.set(60, 0.07, -2 - i * 4); qs.add(ln); }
  for (const x of [55.5, 64.5]) { const p = box(0.18, 6, 0.18, mat('#f4f4f0')); p.position.set(x, 3, -22); qs.add(p); }
  const cb = box(9, 0.18, 0.18, mat('#f4f4f0')); cb.position.set(60, 2.6, -22); qs.add(cb);
  const sch = box(26, 9, 4, mat('#a8604a')); sch.position.set(60, 4.5, -32); qs.add(sch);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: '#dfe8ee' })); w.position.set(49.6 + i * 2.6, 2 + r * 2.6, -29.98); qs.add(w); }
  const tw = box(4, 13, 4, mat('#9a5440')); tw.position.set(60, 6.5, -31.5); qs.add(tw); }
const TEAM = [0, 1, 2, 3].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#efcfae', '#d9a57c'][i], hair: ['#4a3426', '#1d1a19', '#8a5a3a', '#2c2421'][i], shirt: i % 2 ? '#2a5a3a' : '#f4f4f0', pants: '#f4f4f0' }); p.position.set(56 + i * 2.6, 0, -10 - (i % 2) * 2); qs.add(p); return p; });
const star3 = makePerson({ ...STAR, shirt: '#2a5a3a', pants: '#f4f4f0', tie: false }); star3.position.set(60, 0, -3.5); qs.add(star3);
const BALL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat('#8a5a34')); BALL.scale.set(1, 0.68, 0.68); qs.add(BALL);
const tRugby = tag('ラグビー部', { size: 72, w: 380, bg: '#2a5a3a' , sx: 0.95 }); tRugby.position.set(60, 2.45, -3.5); qs.add(tRugby);
const tSenior = tag('ひとつ上の先輩', { size: 64, w: 500, bg: '#e6b450', color: '#14161c' , sx: 1.25 }); tSenior.position.set(60, 2.45, -3.5); qs.add(tSenior);

// ---------- 4・クイズ. 夕方のベンチ（x=90） ----------
{ const g = box(30, 0.05, 30, mat('#6a9a4a')); g.position.set(90, 0.03, -8); qs.add(g);
  const seat = box(2.4, 0.1, 0.6, mat('#8a6a48')); seat.position.set(90, 0.5, -1.0); qs.add(seat);
  const bk = box(2.4, 0.5, 0.08, mat('#8a6a48')); bk.position.set(90, 0.85, -1.3); qs.add(bk);
  for (const x of [-1.05, 1.05]) { const l = box(0.08, 0.5, 0.5, mat('#3a3a3a')); l.position.set(90 + x, 0.25, -1.0); qs.add(l); }
  for (let i = 0; i < 7; i++) { const x = 90 + (i - 3) * 3.4 + (R() - 0.5), z = -8 - R() * 5; const t = box(0.4, 2.4, 0.4, mat('#5a4030')); t.position.set(x, 1.2, z); qs.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), mat('#4a7a3a')); c.position.set(x, 3.2, z); qs.add(c); } }
const SUN = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#ffd8a0', side: THREE.DoubleSide })); SUN.position.set(93, 4.4, -20); SUN.material.fog = false; qs.add(SUN);
function sitAt(p, x) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.set(x, -0.3, -0.95); }
const shy4 = makePerson(SHY); blazer(shy4); sitAt(shy4, 89.6); qs.add(shy4);
const star4 = makePerson(STAR); blazer(star4); sitAt(star4, 90.45); qs.add(star4);
const tFriend = tag('友だちに', { size: 72, w: 340, bg: '#14161c' , sx: 0.85 }); tFriend.position.set(90, 2.3, -1.0); qs.add(tFriend);
const tMore = tag('友情以上の気持ち', { size: 64, w: 560, bg: '#e2607c' , sx: 1.40 }); tMore.position.set(90, 2.3, -1.0); qs.add(tMore);

// ---------- 5. イギリスの街角（x=120） ----------
{ const g = box(30, 0.05, 30, mat('#8a8a8a')); g.position.set(120, 0.03, -8); qs.add(g);
  for (let i = 0; i < 6; i++) { const h = 5 + R() * 2; const b = box(3.2, h, 3, mat(['#a8604a', '#c8b89a', '#8a5a48', '#d8d0c0'][i % 4])); b.position.set(113 + i * 3.3, h / 2, -7); qs.add(b);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), new THREE.MeshBasicMaterial({ color: '#e8eef2' })); w.position.set(113 + i * 3.3 - 0.7 + k * 1.4, 2 + r * 2, -5.49); qs.add(w); } }
  // 赤い電話ボックスと赤い二階建てバス（汎用の形。ロゴや文字は出さない）
  const pb = box(1.0, 2.6, 1.0, mat('#c8282a')); pb.position.set(117.6, 1.3, -3.4); qs.add(pb);
  const pbt = box(1.1, 0.2, 1.1, mat('#b82024')); pbt.position.set(117.6, 2.7, -3.4); qs.add(pbt);
  for (let r = 0; r < 4; r++) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.36), new THREE.MeshBasicMaterial({ color: '#dfe8ee' })); gl.position.set(117.6, 0.9 + r * 0.42, -2.89); qs.add(gl); }
  const bus = new THREE.Group(); bus.position.set(123.2, 0, -3.2); qs.add(bus);
  const bb = box(5.4, 3.6, 2.0, mat('#c8282a')); bb.position.y = 2.2; bus.add(bb);
  for (const y of [1.7, 3.2]) for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshBasicMaterial({ color: '#2a3440' })); w.position.set(-1.9 + i * 1.25, y, 1.01); bus.add(w); }
  for (const x of [-1.8, 1.8]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.1, 16), mat('#1a1a1a')); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.42, 0); bus.add(wh); } }
const tUK = tag('イギリス', { size: 76, w: 340, bg: '#14161c' }); tUK.position.set(118.2, 4.7, -3.2); qs.add(tUK);
const tLove = tag('青春ラブストーリー', { size: 64, w: 600, bg: '#e2607c' }); tLove.position.set(120.8, 3.8, -3.0); qs.add(tLove);
const tComic = tag('原作は人気の漫画', { size: 62, w: 560, bg: '#e6b450', color: '#14161c' }); tComic.position.set(120.2, 4.7, -3.0); qs.add(tComic);

// ---------- 6. 漫画のようなイラストが舞う（x=150） ----------
{ const g = box(30, 0.05, 30, mat('#7aaa5a')); g.position.set(150, 0.03, -8); qs.add(g);
  const t = box(0.6, 3, 0.6, mat('#5a4030')); t.position.set(148.2, 1.5, -3); qs.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 10), mat('#5a8a3a')); c.position.set(148.2, 4.0, -3); qs.add(c); }
const shy6 = makePerson(SHY); blazer(shy6); shy6.position.set(149.6, 0, -1.2); shy6.rotation.y = 0.5; qs.add(shy6);
const star6 = makePerson(STAR); blazer(star6); star6.position.set(150.5, 0, -1.2); star6.rotation.y = -0.5; qs.add(star6);
function doodle(kind, col) { return canvasTex(128, 128, (g, w, h) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 0) { g.beginPath(); g.moveTo(64, 104); g.bezierCurveTo(10, 66, 22, 18, 64, 42); g.bezierCurveTo(106, 18, 118, 66, 64, 104); g.stroke(); }
  else if (kind === 1) { g.beginPath(); g.moveTo(64, 12); g.lineTo(76, 52); g.lineTo(116, 64); g.lineTo(76, 76); g.lineTo(64, 116); g.lineTo(52, 76); g.lineTo(12, 64); g.lineTo(52, 52); g.closePath(); g.stroke(); }
  else { g.beginPath(); g.ellipse(64, 64, 22, 46, 0.6, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(40, 96); g.lineTo(88, 32); g.stroke(); } }); }
const DOODLES = []; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: doodle(i % 3, ['#ffffff', '#ffe0ec', '#fff2b8', '#d8f4ff'][i % 4]), transparent: true, depthTest: false })); s.renderOrder = 7; s.userData.p = [150 + (R() - 0.5) * 3.6, 0.7 + R() * 1.9, -0.6 + (R() - 0.5) * 1.2, R() * 6]; qs.add(s); DOODLES.push(s); }
const tDood = tag('漫画みたいな絵が舞う', { size: 60, w: 640, bg: '#14161c' , sx: 1.60 }); tDood.position.set(150.05, 2.6, -1.0); qs.add(tDood);
const tBoys = tag('男の子どうしの恋', { size: 64, w: 560, bg: '#e2607c' , sx: 1.40 }); tBoys.position.set(150.05, 2.25, -0.9); qs.add(tBoys);

// ---------- shots ----------
const ALL = [tStar, tAlone, tRugby, tSenior, tFriend, tMore, tUK, tLove, tComic, tDood, tBoys];
function base() { S.reset(); ALL.forEach(x => x.visible = false); DOODLES.forEach(d => d.visible = false); }
function doodles(T, k = 1) { DOODLES.forEach((d, i) => { const [x, y, z, ph] = d.userData.p; const a = clamp(k * 3 - i * 0.12); d.visible = a > 0; const s = 0.42 * easeOut(a) * (1 + 0.1 * Math.sin(T * 3 + ph)); d.scale.set(s, s, 1); d.position.set(x + Math.sin(T * 0.8 + ph) * 0.15, y + ((T * 0.25 + ph) % 1) * 0.4, z); d.material.rotation = Math.sin(T + ph) * 0.4; }); }

function shotSeat(t, T) { // 0〜9：となりの席に座ったのは、学校いちの人気者（0秒目がサムネ）
  base(); S.aim(0, -2); lift(60);
  S.hemi.intensity = 1.5; S.key.intensity = 0.6;
  const k = clamp((T - 0.2) / 3.0);
  star1.position.set(lerp(2.6, 0.45, ease(k)), k < 1 ? 0 : -0.38, lerp(0.2, -1.15, ease(k))); star1.rotation.y = k < 1 ? -2.3 : Math.PI; star1.userData.legs.forEach(l => l.rotation.x = k < 1 ? 0 : -Math.PI / 2); if (k < 1) poseWalk(star1, T * 7, 1); star1.rotation.y = k < 1 ? Math.atan2(0.45 - 2.6, -1.15 - 0.2) : Math.PI;
  if (k >= 1) star1.position.y = -0.38;
  star1.userData.head.rotation.y = k >= 1 ? 0.5 : 0;
  shy1.userData.head.rotation.y = T > 1.0 ? lerp(0, -0.5, ease((T - 1.0) / 0.8)) : 0; shy1.userData.head.rotation.x = 0.15;
  tStar.userData.pop((T - 5.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.3, 0.05, u), lerp(1.75, 1.6, u), lerp(-4.9, -4.3, u), 0.05, 1.05, -1.2, 54);
  return qs;
}
function shotHall(t) { // 9〜17：ある噂が広まってから、ひとりで過ごす内気な彼
  base(); S.aim(30, -3); lift(80);
  S.hemi.intensity = 1.1; S.key.intensity = 0.7;
  shy2.userData.head.rotation.x = 0.35; poseWalk(shy2, t * 5, 0.5); shy2.position.z = lerp(-1.0, -1.8, t / 8);
  GROUP.forEach((p, i) => { p.userData.head.rotation.y = t > 3.6 ? (i % 2 ? 0.6 : -0.6) : 0; });
  tAlone.userData.pop((t - 0.8) / 0.35);
  tAlone.position.set(30.6, 2.4, shy2.position.z);
  const u = ease(t / 8);
  look(lerp(31.4, 31.0, u), lerp(1.8, 1.9, u), lerp(2.4, 1.6, u), 30.0, 1.2, -6, 56);
  return qs;
}
function shotField(t, T) { // 17〜25：男子校のグラウンド。人気者は、ラグビー部のひとつ上の先輩
  base(); S.aim(60, -6); lift(80);
  S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  TEAM.forEach((p, i) => { p.position.x = 56 + i * 2.6 + Math.sin(T * 1.4 + i) * 0.6; poseWalk(p, T * 6 + i, 0.8); });
  const thr = clamp((t - 0.4) / 1.0); star3.userData.arms[1].rotation.x = -Math.PI * 0.7 * (1 - thr) - 0.3;
  BALL.position.set(lerp(60.3, 59.2, thr), lerp(1.8, 4.5, thr) - thr * thr * 1.5, lerp(-3.5, -9, thr)); BALL.rotation.z = T * 6;
  tRugby.userData.pop((t - 1.2) / 0.35); if (t > 3.8) tRugby.visible = false;
  tSenior.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(61.6, 61.0, u), lerp(1.7, 1.9, u), lerp(1.4, 0.6, u), 60, 1.6, -8, 58);
  return qs;
}
function sunset(d) { S.darken(0.35 * d, '#e8905a'); S.hemi.intensity = lerp(1.25, 0.95, d); S.key.intensity = lerp(1.5, 0.9, d); S.key.color.setHex(0xffc890); }
function shotBench(t) { // 25〜33：ふたりは友だちに。やがて、友情以上の気持ちが芽生える
  base(); SUN.position.set(93, 4.4, -20); S.aim(90, -1); lift(80);
  sunset(1);
  shy4.userData.head.rotation.y = t > 4.4 ? 0.35 : 0; star4.userData.head.rotation.y = t > 4.8 ? -0.35 : 0;
  shy4.userData.arms[1].rotation.x = -0.4; star4.userData.arms[0].rotation.x = -0.4;
  tFriend.userData.pop((t - 0.8) / 0.35); if (t > 3.8) tFriend.visible = false;
  tMore.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(90.6, 90.2, u), lerp(1.5, 1.4, u), lerp(3.6, 2.8, u), 90, 1.1, -1.0, 56);
  return qs;
}
function shotUK(t) { // 33〜42：イギリス発の青春ラブストーリー。原作は世界で翻訳された漫画
  base(); S.aim(120, -4); lift(60);
  S.hemi.intensity = 1.25;
  tUK.userData.pop((t - 0.5) / 0.35); tLove.userData.pop((t - 1.4) / 0.35); if (t > 4.0) { tUK.visible = false; tLove.visible = false; }
  tComic.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(lerp(120.8, 120.2, u), lerp(2.2, 2.6, u), lerp(6.8, 5.6, u), 120.2, 2.9, -4, 56);
  return qs;
}
function shotDoodle(t, T) { // 42〜49：決め手。漫画のようなイラストが舞う、男の子どうしの恋
  base(); S.aim(150, -1); lift(80);
  S.hemi.intensity = 1.3; S.key.intensity = 1.2; S.key.color.setHex(0xfff0dc);
  doodles(T, clamp((t - 0.3) / 1.5));
  shy6.userData.head.rotation.x = -0.1; star6.userData.head.rotation.x = -0.1;
  tDood.userData.pop((t - 0.6) / 0.35); tBoys.userData.pop((t - 3.4) / 0.35);
  const u = ease(t / 7);
  look(lerp(150.3, 150.1, u), lerp(1.6, 1.5, u), lerp(3.8, 3.2, u), 150.05, 1.45, -1.2, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：このドラマ、わかった？（夕方のベンチ）
  base(); S.aim(90, -1); lift(-40);
  sunset(1);
  shy4.userData.head.rotation.y = 0.35; star4.userData.head.rotation.y = -0.35; SUN.position.set(90.6, 2.6, 22);
  const u = ease(t / 7);
  look(lerp(90.0, 90.0, u), lerp(1.0, 1.2, u), lerp(-5.2, -6.0, u), 90, 1.2, 0, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotSeat(t, T) },
  { a: 9, b: 17, f: shotHall },
  { a: 17, b: 25, f: (t, T) => shotField(t, T) },
  { a: 25, b: 33, f: shotBench },
  { a: 33, b: 42, f: shotUK },
  { a: 42, b: 49, f: (t, T) => shotDoodle(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '新しい学年。<br>となりの席に座ったのは、'],
  [5.6, 9.0, '学校いちの、<br>人気者だった。'],
  [9.2, 13.2, '内気な彼は、<br>ある噂が広まってから、'],
  [13.2, 17.0, 'ずっと、<br>ひとりで過ごしてきた。'],
  [17.2, 21.0, '舞台は、<br>男の子だけの学校。'],
  [21.0, 25.0, '人気者は、ラグビー部の<br>ひとつ上の先輩。'],
  [25.2, 29.0, 'ふたりは、<br>友だちになる。'],
  [29.0, 33.0, 'やがて、友情以上の<br>気持ちが芽生える。'],
  [33.2, 37.4, 'イギリス発の、<br>青春ラブストーリー。'],
  [37.4, 41.8, '原作は、世界で<br>翻訳された人気の漫画。'],
  [42.2, 45.4, '画面には、漫画みたいな<br>イラストが舞う。'],
  [45.4, 49.0, '胸がときめく、<br>男の子どうしの恋。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ハートストッパー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q020', v2: true, answer: 'HEARTSTOPPER ハートストッパー',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 2020,
    hits: [5.6, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 5.6, 29.0, 42.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '新しい学年': 'あたらしいがくねん', '席': 'せき', '座った': 'すわった', '学校': 'がっこう', '人気者': 'にんきもの', '内気': 'うちき', '彼': 'かれ', '噂': 'うわさ', '広まって': 'ひろまって', '過ごして': 'すごして', '舞台': 'ぶたい', '男の子': 'おとこのこ', 'ラグビー部': 'ラグビーぶ', '先輩': 'せんぱい', '友だち': 'ともだち', '友情以上': 'ゆうじょういじょう', '気持ち': 'きもち', '芽生える': 'めばえる', 'イギリス発': 'イギリスはつ', '青春': 'せいしゅん', '原作': 'げんさく', '世界': 'せかい', '翻訳': 'ほんやく', '人気': 'にんき', '漫画': 'まんが', '画面': 'がめん', '舞う': 'まう', '胸': 'むね', '恋': 'こい' },
    caption: 'このドラマのタイトル、わかる？\n新しい学年。となりの席に座ったのは、学校いちの人気者だった。内気な彼は、ある噂が広まってから、ずっとひとりで過ごしてきた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', '青春ドラマ'],
  },
});
applyQuizCards({ answer: 'HEARTSTOPPER<br><span style="font-size:76px">ハートストッパー</span>', info: 'Netflix｜イギリス・シーズン1〜3', answerSize: 96 });
