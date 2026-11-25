import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, SONG_GREEN, makeDisc, makeBars } from './quiz-kit.js';

// タイトル当てクイズ #142 猫（曲・DISH//・2017年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/25）：
//   ・日本レコード協会のストリーミング認定 トリプル・プラチナ（3億回以上。2023年2月度。riaj.or.jp/data/st/search/ の認定データ
//     f/data/api/StProducts.json で「猫」、トラック・DISH//・配信開始日 2018-06-23・ソニー・ミュージックレーベルズ）
//   ・発売年：BARKS のインタビュー barks.jp/news/836295/ に「あいみょんが楽曲提供したバラード『猫』は、10thシングル『僕たちがやりました』
//     （’17年8月16日発売）のカップリングに収録」（CD シングルが配信より早いので 2017年）
// 物語：曲が描く状況（大切な人が去っていく → ひとり残されて前を向けない → 夕暮れの町でどこを見ても思い出す
//   → もう一度会いたい、気まぐれでいいから戻ってきてほしい → 去った人を気まぐれな動物にたとえる）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   音源・ジャケット・MV の映像や設定・歌手の見た目は使わない。人と動物は汎用の3D
// 構成（ヒント6段）：1 大切な人が部屋を出ていく・残されたのはひとりの青年 → 2 主人公はまだ前を向けない・部屋にはふたり分のカップ
//   → 3 夕暮れの町をひとりで歩く・どこを見ても思い出す → 4 もう一度だけ会いたい・気まぐれでいいから戻ってきて
//   → 5 2017年にシングルのカップリングとして出た曲・ストリーミング3億回 → 6 決め手：タイトルは漢字1文字の動物・去った人はその動物みたい
const S = quizStage({ bg: '#d8c8b8', floor: '#8a8078', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14210);

const HE = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#6a7a8a', pants: '#2a2e38' };
const SHE = { skin: '#f4d3b5', hair: '#4a2a1a', shirt: '#e8c8b0', pants: '#6a5a5a', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function room(x, wall = '#e8dcc8', floor = '#a88a68') { const fl = box(10, 0.04, 8, mat(floor)); fl.position.set(x, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat(wall)); wl.position.set(x, 2, -6); qs.add(wl); const sw = box(0.3, 4, 8, mat(wall)); sw.position.set(x - 4, 2, -3); qs.add(sw); }
function mug(c) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 14), mat(c)); g.add(b); const h = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 12), mat(c)); h.position.set(0.09, 0, 0); g.add(h); return g; }
function cat(c = '#2a2420') { const g = new THREE.Group(); const m = mat(c);
  const bd = box(0.5, 0.22, 0.2, m); bd.position.y = 0.3; g.add(bd); const hd = box(0.2, 0.18, 0.18, m); hd.position.set(0.3, 0.44, 0); g.add(hd);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 4), m); e.position.set(0.3, 0.56, s * 0.06); g.add(e); }
  const legs = []; for (const [x, z] of [[-0.18, -0.07], [-0.18, 0.07], [0.18, -0.07], [0.18, 0.07]]) { const l = box(0.05, 0.2, 0.05, m); l.position.set(x, 0.1, z); g.add(l); legs.push(l); }
  const tl = box(0.04, 0.32, 0.04, m); tl.position.set(-0.28, 0.46, 0); tl.rotation.z = 0.5; g.add(tl);
  g.userData = { legs, tail: tl }; return g; }

// ---------- 1段目. 夕方のアパートの部屋（x=0）。大きなかばんを持って玄関へ向かう人と、立ちつくす青年 ----------
room(0);
{ const dr = box(1.1, 2.2, 0.1, mat('#8a6a4a')); dr.position.set(2.6, 1.1, -5.8); qs.add(dr);
  const wn = box(2.2, 1.6, 0.05, gl('#f0b880')); wn.position.set(-1.4, 2.3, -5.82); qs.add(wn);
  const sf = box(2.0, 0.45, 0.8, mat('#8a9aa8')); sf.position.set(-1.6, 0.3, -4.6); qs.add(sf);
  const lp = new THREE.PointLight('#ffc890', 3, 9); lp.position.set(-1.4, 2.4, -4.6); qs.add(lp); }
const HE1 = person(HE, -0.6, -2.4, 0.6);
const SHE1 = person(SHE, 1.4, -4.0, Math.PI - 0.6);
const BAG1 = box(0.5, 0.4, 0.26, mat('#7a4a2a')); BAG1.position.set(0, -0.72, 0.05); SHE1.userData.arms[1].add(BAG1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tLeave = tag('大切な人が、部屋を出ていく', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tLeave);
const tAlone = tag('残されたのは、ひとりの青年', { size: 50, w: 760, bg: SONG_GREEN, sx: 1.8 }); qs.add(tAlone);

// ---------- 2段目. 同じ部屋のテーブル（x=50）。ならんだ2つのマグカップ。ひとり座ってうつむく青年 ----------
const AX = 50;
room(AX, '#d8ccb8', '#9a7c5c');
{ const tb = box(1.6, 0.06, 0.9, mat('#c8a878')); tb.position.set(AX, 0.74, -3.4); qs.add(tb); for (const [dx, dz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) { const l = box(0.06, 0.72, 0.06, mat('#8a6a48')); l.position.set(AX + dx, 0.36, -3.4 + dz); qs.add(l); }
  const ch = box(0.5, 0.06, 0.5, mat('#8a6a48')); ch.position.set(AX - 0.3, 0.5, -2.1); qs.add(ch);
  const lp = new THREE.PointLight('#ffd8a0', 3, 7); lp.position.set(AX, 2.6, -3.2); qs.add(lp); }
const MUG2a = mug('#e8e4dc'); MUG2a.position.set(AX - 0.3, 0.85, -3.4); qs.add(MUG2a);
const MUG2b = mug('#e8a8a8'); MUG2b.position.set(AX + 0.3, 0.85, -3.5); qs.add(MUG2b);
const HE2 = person(HE, AX - 0.3, -2.2, Math.PI); HE2.userData.legs.forEach(l => l.rotation.x = -1.5); HE2.position.y = -0.32;
const tStuck = tag('主人公は、まだ前を向けない', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tStuck);
const tTwo = tag('部屋には、ふたり分のカップ', { size: 50, w: 760, bg: SONG_GREEN, sx: 1.8 }); qs.add(tTwo);

// ---------- 3段目. 夕暮れの住宅街（x=100）。ブロック塀の道、電柱、ひとりで歩く青年 ----------
const BX = 100;
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#e8906a', '#f8d8a8')); SKY3.position.set(BX, 10, -40); qs.add(SKY3);
{ const rd = box(6, 0.04, 40, mat('#7a7470')); rd.position.set(BX, 0.03, -10); qs.add(rd);
  for (const s of [-1, 1]) { const wl = box(0.3, 1.4, 40, mat('#b8b0a0')); wl.position.set(BX + s * 3, 0.7, -10); qs.add(wl);
    for (let i = 0; i < 5; i++) { const h = box(4, 3 + R() * 2, 4, mat(['#c8b8a0', '#a8a090', '#d0c0b0'][i % 3])); h.position.set(BX + s * 5.4, 1.8, -2 - i * 6); qs.add(h); const rf = box(4.4, 0.4, 4.4, mat('#5a4a44')); rf.position.set(BX + s * 5.4, 3.7 + R(), -2 - i * 6); qs.add(rf); } }
  for (let i = 0; i < 4; i++) { const pl = box(0.16, 6, 0.16, mat('#8a8078')); pl.position.set(BX + 2.6, 3, -2 - i * 8); qs.add(pl); } }
const HE3 = person(HE, BX - 0.6, -3.0, Math.PI);
const tWalk = tag('夕暮れの町を、ひとりで歩く', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tWalk);
const tRemind = tag('どこを見ても、思い出す', { size: 54, w: 680, bg: SONG_GREEN, sx: 1.7 }); qs.add(tRemind);

// ---------- 4段目. 夜の部屋の窓辺（x=150）。月を見上げる青年。少し開けたままの窓 ----------
const CX = 150;
room(CX, '#4a4a5a', '#5a4a40');
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.6), skyTex('#1a2240', '#3a4a70')); SKY4.position.set(CX + 0.4, 2.2, -5.83); qs.add(SKY4);
const MOON4 = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), gl('#f4ecc8')); MOON4.position.set(CX + 1.2, 2.9, -5.82); qs.add(MOON4);
{ const fr = box(4.2, 0.1, 0.12, mat('#d8d0c0')); fr.position.set(CX + 0.4, 0.9, -5.75); qs.add(fr); const fr2 = fr.clone(); fr2.position.y = 3.5; qs.add(fr2);
  const md = box(0.08, 2.6, 0.12, mat('#d8d0c0')); md.position.set(CX + 0.0, 2.2, -5.75); qs.add(md);
  const ml = new THREE.PointLight('#b8c8f0', 2, 8); ml.position.set(CX + 0.4, 2.4, -4.6); qs.add(ml); }
const HE4 = person(HE, CX - 0.2, -4.6, Math.PI);
const tOnce = tag('もう一度だけ、会いたい', { size: 54, w: 680, bg: '#14161c', sx: 1.7 }); qs.add(tOnce);
const tWhim = tag('気まぐれでいいから、戻ってきて', { size: 48, w: 820, bg: SONG_GREEN, sx: 1.85 }); qs.add(tWhim);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2017 = tag('2017年、カップリング曲として', { size: 50, w: 780, bg: '#e6b450', color: '#14161c', sx: 1.85 }); qs.add(t2017);
const tPlay = tag('ストリーミング 3億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 1.8 }); qs.add(tPlay);

// ---------- 6段目. 夕焼けのブロック塀の上（x=250）。塀の上を歩く小さな黒い動物と、見上げる青年 ----------
const NX = 250;
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), skyTex('#e87a5a', '#f8c890')); SKY6.position.set(NX, 10, -30); qs.add(SKY6);
{ const rd = box(20, 0.04, 10, mat('#7a7470')); rd.position.set(NX, 0.03, -2); qs.add(rd);
  const wl = box(14, 1.6, 0.4, mat('#b8b0a0')); wl.position.set(NX, 0.8, -3.6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const h = box(4, 3.4, 4, mat(['#c8b8a0', '#a8a090', '#d0c0b0'][i])); h.position.set(NX - 5 + i * 5, 1.7, -7); qs.add(h); } }
const CAT6 = cat('#1e1a18'); CAT6.position.set(NX - 1.6, 1.6, -3.6); qs.add(CAT6);
const HE6 = person(HE, NX + 0.9, -1.6, -0.6);
const tKanji = tag('タイトルは、漢字1文字の動物', { size: 50, w: 800, bg: '#14161c', sx: 1.85 }); qs.add(tKanji);
const tLike = tag('去った人は、その動物みたい', { size: 50, w: 760, bg: SONG_GREEN, sx: 1.8 }); qs.add(tLike);

// ---------- shots ----------
const ALL = [tLeave, tAlone, tStuck, tTwo, tWalk, tRemind, tOnce, tWhim, t2017, tPlay, tKanji, tLike, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：大切な人が、部屋を出ていく。残されたのは、ひとりの青年（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.0; S.key.color.set('#ffc898');
  const k = clamp((t - 1.0) / 5); SHE1.position.set(lerp(1.4, 2.5, k), 0, lerp(-4.0, -5.4, k)); SHE1.rotation.y = Math.PI - 0.6; poseWalk(SHE1, t * 6, k > 0 && k < 1 ? 0.8 : 0); SHE1.visible = k < 1 || quiz;
  HE1.userData.head.rotation.y = 0.3; HE1.userData.arms[1].rotation.x = t > 2 && t < 4.5 ? -0.8 : 0;
  Q1.position.set(0.5, 1.75, -3.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tLeave, 1.05); pin(tAlone, 1.05);
  if (!quiz) { tLeave.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tLeave.visible = false; tAlone.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.6, -1.2, u), lerp(1.9, 1.8, u), lerp(1.6, 0.8, u), 0.6, 1.3, -3.6, 62);
  return qs;
}
function shotTable(t) { // 2段目 9〜17：主人公は、まだ前を向けない青年。部屋には、ふたり分のマグカップ
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.95; S.key.color.set('#ffd8a8');
  HE2.userData.head.rotation.x = 0.45; HE2.userData.arms.forEach(a => a.rotation.x = -1.1);
  const u = ease(t / 8);
  look(AX + lerp(1.6, 1.3, u), lerp(2.0, 1.9, u), lerp(-5.6, -5.4, u), AX - 0.2, 0.95, -2.9, 62);
  pin(tStuck, 1.05); pin(tTwo, 1.05);
  tStuck.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStuck.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotStreet(t) { // 3段目 17〜25：夕暮れの町を、ひとりで歩く。どこを見ても、あの人を思い出す
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.05; S.key.color.set('#ffb880');
  HE3.position.z = -3.0 - t * 0.35; poseWalk(HE3, t * 5, 0.8); HE3.userData.head.rotation.y = t > 4.3 ? 0.5 : 0;
  const u = ease(t / 8);
  look(BX + lerp(0.4, 0.2, u), lerp(1.8, 1.8, u), HE3.position.z + 3.0, BX - 0.4, 1.4, HE3.position.z - 1.0, 62);
  pin(tWalk, 1.05); pin(tRemind, 1.05);
  tWalk.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWalk.visible = false; tRemind.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotWindow(t) { // 4段目 25〜33：もう一度だけ、会えたらいいのに。気まぐれでいいから、戻ってきてほしい
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.6, '#0a0c18');
  HE4.userData.head.rotation.x = -0.25; HE4.userData.arms[1].rotation.x = t > 4.4 ? -1.3 : 0;
  const u = ease(t / 8);
  look(CX + lerp(-1.4, -1.0, u), lerp(1.7, 1.65, u), lerp(-1.2, -1.8, u), CX + 0.4, 2.0, -5.6, 62);
  pin(tOnce, 1.05); pin(tWhim, 1.05);
  tOnce.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOnce.visible = false; tWhim.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2017年に、シングルのカップリング曲として出た。ストリーミングは、3億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.9; S.scene.background.set('#1e222c'); S.scene.fog.color.set('#1e222c');
  DISC.rotation.z = t * 1.2; BARS.userData.update(t);
  const u = ease(t / 9);
  look(FX + lerp(-0.4, 0.3, u), lerp(2.7, 2.6, u), lerp(4.6, 4.0, u), FX, 2.7, -2.2, 62);
  pin(t2017, 1.05); pin(tPlay, 1.05);
  t2017.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2017.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCat(t) { // 6段目 42〜49（決め手）：タイトルは、漢字1文字の動物。去っていった人は、その動物みたい
  base(); S.aim(NX, -2); lift(0); S.hemi.intensity = 1.0; S.key.color.set('#ffb880');
  CAT6.position.x = NX - 1.6 + t * 0.3; CAT6.userData.legs.forEach((l, i) => l.rotation.z = Math.sin(t * 8 + i * 1.6) * 0.4); CAT6.userData.tail.rotation.z = 0.5 + Math.sin(t * 2) * 0.25;
  HE6.userData.head.rotation.x = -0.15; HE6.rotation.y = -0.6 - t * 0.05;
  const u = ease(t / 7);
  look(NX + lerp(0.8, 0.6, u), lerp(1.7, 1.75, u), lerp(1.6, 1.0, u), CAT6.position.x + 0.3, 1.6, -3.4, 62);
  pin(tKanji, 1.05); pin(tLike, 1.05);
  if (t < 3.6) tKanji.userData.pop((t - 0.3) / 0.35); else tLike.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（夕方の部屋に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotTable },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotWindow },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotCat },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある夕方、大切な人が<br>部屋を出ていく。'],
  [5.6, 9.0, '残されたのは、<br>ひとりの青年。'],
  [9.2, 13.2, '主人公は、まだ<br>前を向けない青年。'],
  [13.2, 17.0, '部屋には、<br>ふたり分のマグカップ。'],
  [17.2, 21.0, '夕暮れの町を、<br>ひとりで歩く。'],
  [21.0, 25.0, 'どこを見ても、<br>あの人を思い出す。'],
  [25.2, 29.0, 'もう一度だけ、<br>会えたらいいのに。'],
  [29.0, 33.0, '気まぐれでいいから、<br>戻ってきてほしい。'],
  [33.2, 37.4, '2017年に、シングルの<br>カップリング曲として出た。'],
  [37.4, 41.8, 'ストリーミングは、<br>3億回をこえた。'],
  [42.2, 45.4, 'タイトルは、<br>漢字1文字の動物。'],
  [45.4, 49.0, '去っていった人は、<br>その動物みたい。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、DISH//の、<br>猫。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q142', v2: true, answer: '猫', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'emotional', seed: 14210,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'カップリング': 'カップリング', '去っていった': 'さっていった', 'DISH//': 'ディッシュ', 'マグカップ': 'マグカップ', '漢字1文字': 'かんじいちもじ', '戻ってきて': 'もどってきて', '2017年': 'にせんじゅうななねん', '思い出す': 'おもいだす', '気まぐれ': 'きまぐれ', '出ていく': 'でていく', '残された': 'のこされた', '向けない': 'むけない', 'ふたり分': 'ふたりぶん', '会えたら': 'あえたら', '聞かせて': 'きかせて', '3億回': 'さんおくかい', '主人公': 'しゅじんこう', '夕暮れ': 'ゆうぐれ', '大切な': 'たいせつな', '当てて': 'あてて', '一度': 'いちど', '夕方': 'ゆうがた', '部屋': 'へや', '青年': 'せいねん', '歩く': 'あるく', '見て': 'みて', '動物': 'どうぶつ', '出た': 'でた', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '前': 'まえ', '町': 'まち', '人': 'ひと', '曲': 'きょく', '猫': 'ねこ' },
    caption: 'この曲のタイトル、わかる？\nある夕方、大切な人が部屋を出ていく。残されたのは、ひとりの青年。主人公は、まだ前を向けない青年。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '失恋ソング'],
  },
});
applyQuizCards({ answer: '猫', info: 'DISH//｜2017年', answerSize: 160, kind: '曲' });
