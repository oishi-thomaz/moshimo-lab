import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #132 奏（かなで）（曲・スキマスイッチ・2004年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/23）：
//   ・日本レコード協会のストリーミング認定 ダブル・プラチナ（2億回以上。2025年5月度。riaj.or.jp/data/st/search/ で「奏」、
//     トラック・スキマスイッチ・邦楽・配信開始日 2017-04-01・ユニバーサル ミュージック）
//   ・発売年：ソニーミュージック スキマスイッチのページ sonymusic.co.jp/artist/sukimaswitch/info/425334 に「2004年リリース『奏（かなで）』」
// 物語：曲が描く状況（新しい場所へ旅立つ大切な人との別れ → 言いたいことを飲みこむ → 別れぎわに笑ってみせる
//   → 行かせたくない気持ちと、背中を押したい気持ち → 離れても思いが届くように願う）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   音源・ジャケット・MV の映像や設定・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 春の朝のホーム・ひとりだけ大きなかばん → 2 主人公はここに残る青年・言いたいことが出てこない
//   → 3 もうすぐドアが閉まる・笑ってみせるのがせいいっぱい → 4 そばにいてほしい・でも夢をじゃましたくない
//   → 5 2004年に出た2人組の曲・ストリーミング2億回 → 6 決め手：タイトルは漢字1文字・楽器を鳴らすという意味
const S = quizStage({ bg: '#c8d4e0', floor: '#8a8c90', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(13210);

const HE = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#4a6a8a', pants: '#2a2e38' };
const SHE = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#e8dcc8', pants: '#8a6a5a', long: true, skirt: true };
const ETC = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#5a6070', pants: '#2a2e38' }, { skin: '#eacbb0', hair: '#1a1a1a', shirt: '#7a6a5a', pants: '#3a3a44' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function bag(p) { const b = box(0.5, 0.36, 0.26, mat('#7a4a2a')); b.position.set(0, -0.7, 0.05); p.userData.arms[1].add(b); return b; }
// 電車（文字や会社の色は使わない、無地の車両）
function train() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = box(9.6, 2.8, 2.6, mat('#d8dce0')); c.position.set(i * 10, 1.9, 0); g.add(c);
    const st = box(9.6, 0.25, 2.62, mat('#5a8a6a')); st.position.set(i * 10, 1.2, 0); g.add(st);
    for (let k = 0; k < 6; k++) { const w = box(1.0, 0.8, 0.02, gl('#3a4a5a')); w.position.set(i * 10 - 4 + k * 1.6, 2.4, 1.31); g.add(w); }
    for (const dx of [-2.4, 2.4]) { const d = box(1.1, 2.0, 0.03, mat('#b8bcc0')); d.position.set(i * 10 + dx, 1.6, 1.315); g.add(d); } }
  qs.add(g); return g; }
function platform(x, z) { const p = box(40, 1.0, 5, mat('#a8a8a8')); p.position.set(x, -0.5, z); qs.add(p); const ed = box(40, 0.04, 0.4, mat('#e8c840')); ed.position.set(x, 0.02, z + 1.8); qs.add(ed);
  const tr = box(40, 0.1, 3.4, mat('#5a5048')); tr.position.set(x, -0.95, z + 4.2); qs.add(tr);
  for (let i = 0; i < 4; i++) { const pl = box(0.18, 3.6, 0.18, mat('#6a7078')); pl.position.set(x - 9 + i * 6, 1.8, z - 1.6); qs.add(pl); }
  const rf = box(40, 0.14, 4, mat('#8a9098')); rf.position.set(x, 3.6, z - 0.6); qs.add(rf); }

// ---------- 1段目. 春の朝の駅のホーム（x=0）。並んで立つふたり。ひとりだけが大きなかばんを持つ ----------
platform(0, -2.4);
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), skyTex('#a8c8e8', '#f0f0f0')); SKY1.position.set(0, 10, -30); qs.add(SKY1);
for (let i = 0; i < 6; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.6 + R(), 10, 8), mat(['#f4c8d4', '#f0d0dc', '#e8b8c8'][i % 3])); tr.position.set(-12 + i * 5, 2.4, -14); qs.add(tr); const tk = box(0.3, 2, 0.3, mat('#6a4a3a')); tk.position.set(tr.position.x, 1, -14); qs.add(tk); }
const HE1 = person(HE, -0.35, -1.6, 0.25); const SHE1 = person(SHE, 0.4, -1.6, -0.25); const BAG1 = bag(SHE1);
const PET1 = []; for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), gl('#f8d0dc')); p.userData.o = [R() * 6 - 3, R() * 3, R() * 3]; qs.add(p); PET1.push(p); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tMorn = tag('春の朝、ホームに立つふたり', { size: 50, w: 780, bg: '#14161c', sx: 2.0 }); qs.add(tMorn);
const tBag = tag('ひとりだけ、大きなかばん', { size: 52, w: 720, bg: SONG_GREEN, sx: 1.9 }); qs.add(tBag);

// ---------- 2段目. ホームのベンチ（x=50）。うつむいて、言葉をさがす青年 ----------
const AX = 50;
platform(AX, -2.4);
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), skyTex('#b8d0e8', '#f4f0ec')); SKY2.position.set(AX, 10, -30); qs.add(SKY2);
{ const bn = box(1.8, 0.1, 0.5, mat('#8a6a44')); bn.position.set(AX, 0.45, -3.2); qs.add(bn); for (const s of [-1, 1]) { const l = box(0.08, 0.45, 0.4, mat('#4a4a50')); l.position.set(AX + s * 0.8, 0.22, -3.2); qs.add(l); } }
const HE2 = person(HE, AX - 0.4, -3.15, 0); HE2.userData.legs.forEach(l => l.rotation.x = -1.4); HE2.position.y = -0.38 + 0.47;
const SHE2 = person(SHE, AX + 0.45, -3.15, 0); SHE2.userData.legs.forEach(l => l.rotation.x = -1.4); SHE2.position.y = -0.38 + 0.47;
const BAG2 = box(0.5, 0.36, 0.26, mat('#7a4a2a')); BAG2.position.set(AX + 1.2, 0.18, -3.0); qs.add(BAG2);
const DOTS2 = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#14161c')); qs.add(d); return d; });
const tSend = tag('主人公は、ここに残る青年', { size: 50, w: 760, bg: '#14161c', sx: 1.7 }); tSend.position.set(AX, 2.15, -2.8); qs.add(tSend);
const tWords = tag('言いたいことが、出てこない', { size: 50, w: 740, bg: SONG_GREEN, sx: 1.7 }); tWords.position.set(AX, 2.15, -2.8); qs.add(tWords);

// ---------- 3段目. 電車がホームに入る（x=100）。開いたドアの前で、笑ってみせる青年 ----------
const BX = 100;
platform(BX, -2.4);
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), skyTex('#c0d4e8', '#f4ece4')); SKY3.position.set(BX, 10, -30); qs.add(SKY3);
const TRAIN3 = train(); TRAIN3.position.set(BX - 30, -1.0, 1.8);
const HE3 = person(HE, BX - 0.2, -1.2, Math.PI - 0.0); const SHE3 = person(SHE, BX + 0.4, -0.1, Math.PI + 0.3); bag(SHE3);
const tBell = tag('まもなく、ドアが閉まる', { size: 52, w: 680, bg: '#14161c', sx: 1.35 }); tBell.position.set(BX, 2.45, -0.4); qs.add(tBell);
const tSmile = tag('笑ってみせるのが、せいいっぱい', { size: 48, w: 820, bg: SONG_GREEN, sx: 1.45 }); tSmile.position.set(BX, 2.45, -0.4); qs.add(tSmile);

// ---------- 4段目. 動き出す電車（x=150）。走り出しそうになって、立ち止まる青年 ----------
const CX = 150;
platform(CX, -2.4);
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), skyTex('#c8d8ec', '#f8e8d8')); SKY4.position.set(CX, 10, -30); qs.add(SKY4);
const TRAIN4 = train(); TRAIN4.position.set(CX - 10, -1.0, 1.8);
const HE4 = person(HE, CX, -1.2, Math.PI / 2);
const tStay = tag('そばにいてほしい。でも…', { size: 54, w: 700, bg: '#14161c', sx: 1.8 }); tStay.position.set(CX, 2.6, -1.2); qs.add(tStay);
const tDream = tag('夢を、じゃましたくない', { size: 52, w: 680, bg: SONG_GREEN, sx: 1.9 }); tDream.position.set(CX, 2.6, -1.2); qs.add(tDream);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2004 = tag('2004年に出た、2人組の曲', { size: 54, w: 720, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2004.position.set(FX, 4.4, -2.0); qs.add(t2004);
const tPlay = tag('ストリーミング 2億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 2.6 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. 夕方のからっぽのホーム（x=250）。ひとりで空を見上げる。遠くの線路に、小さくなる電車 ----------
const NX = 250;
platform(NX, -2.4);
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), skyTex('#e88a5a', '#f8d8a8')); SKY6.position.set(NX, 10, -30); qs.add(SKY6);
const NOTES6 = []; for (let i = 0; i < 6; i++) { const n = new THREE.Group(); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), gl(SONG_GREEN)); hd.scale.set(1.3, 1, 1); n.add(hd); const st = box(0.025, 0.36, 0.02, gl(SONG_GREEN)); st.position.set(0.1, 0.18, 0); n.add(st); qs.add(n); NOTES6.push(n); }
const HE6 = person(HE, NX, -1.6, Math.PI);
const tOne = tag('タイトルは、漢字1文字', { size: 54, w: 660, bg: '#14161c', sx: 1.8 }); qs.add(tOne);
const tMean = tag('楽器を鳴らす、という意味', { size: 50, w: 720, bg: SONG_GREEN, sx: 1.9 }); qs.add(tMean);

// ---------- shots ----------
const ALL = [tMorn, tBag, tSend, tWords, tBell, tSmile, tStay, tDream, t2004, tPlay, tOne, tMean, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); NOTES6.forEach(n => n.visible = false); DOTS2.forEach(d => d.visible = false); }

function shotPlat(t, quiz = 0) { // 1段目 0〜9：春の朝、駅のホームに並んで立つふたり。ひとりだけが、大きなかばんを持っている（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.2;
  PET1.forEach((p, i) => { const o = p.userData.o; p.position.set(o[0] + Math.sin(t + i) * 0.3, 3.2 - ((t * 0.4 + o[1]) % 3.2), -1.0 - o[2] * 0.6); p.rotation.z = t * 2 + i; });
  HE1.userData.head.rotation.y = 0.3; SHE1.userData.head.rotation.y = -0.2;
  Q1.position.set(1.0, 1.95, -1.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tMorn.position.set(0.05, 2.75, -1.9); tBag.position.set(0.05, 2.75, -1.9);
  if (!quiz) { tMorn.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tMorn.visible = false; tBag.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(1.7, 1.6, u), lerp(2.6, 2.1, u), 0.05, 1.4, -1.8, 62);
  return qs;
}
function shotBench(t) { // 2段目 9〜17：主人公は、ここに残る青年。言いたいことが、なかなか出てこない
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.1;
  HE2.userData.head.rotation.x = 0.45; HE2.userData.arms.forEach(a => a.rotation.x = -0.7);
  SHE2.userData.head.rotation.y = t > 2 ? -0.5 : 0;
  DOTS2.forEach((d, i) => { d.visible = t > 4.4 + i * 0.4; d.position.set(AX - 0.55 + i * 0.16, 2.05, -3.0); });
  tSend.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSend.visible = false; tWords.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.5, 0.2, u), lerp(1.8, 1.7, u), lerp(1.0, 0.5, u), AX, 1.0, -3.1, 62);
  return qs;
}
function shotTrain(t) { // 3段目 17〜25：まもなく電車のドアが閉まる。笑ってみせるのが、せいいっぱい
  base(); S.aim(BX, -1); lift(0); S.hemi.intensity = 1.1;
  const k = ease(clamp(t / 3.2)); TRAIN3.position.x = lerp(BX - 30, BX - 10, k);
  HE3.userData.head.rotation.x = t > 4.3 ? -0.1 : 0.2; HE3.userData.arms[1].rotation.set(t > 4.6 ? -2.6 + Math.sin(t * 6) * 0.2 : 0, 0, t > 4.6 ? 0.3 : 0);
  SHE3.userData.arms[0].rotation.x = t > 5.0 ? -2.4 : 0;
  tBell.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBell.visible = false; tSmile.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.6, -1.2, u), lerp(1.8, 1.7, u), lerp(-3.8, -3.4, u), BX + 0.1, 1.3, -0.5, 62);
  return qs;
}
function shotGo(t) { // 4段目 25〜33：そばにいてほしい。でも、相手の夢をじゃましたくない
  base(); S.aim(CX, -1); lift(0); S.hemi.intensity = 1.0; S.darken(0.08, '#f0a060');
  TRAIN4.position.set(CX - 10 + t * t * 0.35, -1.0, 1.8);
  const run = t < 3.8; HE4.position.x = CX + (run ? t * 0.45 : 3.8 * 0.45); poseWalk(HE4, t * 7, run ? 1.0 : 0);
  if (!run) { HE4.userData.arms[1].rotation.set(-1.4, 0, 0); HE4.userData.head.rotation.x = 0.15; }
  tStay.position.x = tDream.position.x = HE4.position.x;
  tStay.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStay.visible = false; tDream.userData.pop((t - 4.3) / 0.35);
  look(HE4.position.x - 1.2, 1.9, -4.2, HE4.position.x + 0.4, 1.3, -0.2, 62);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2004年に出た、2人組の曲。ストリーミングは、2億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.9;
  DISC.rotation.z = t * 1.2; BARS.userData.update(t);
  t2004.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2004.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX + lerp(-0.4, 0.3, u), lerp(2.7, 2.6, u), lerp(4.6, 4.0, u), FX, 2.7, -2.2, 62);
  return qs;
}
function shotEve(t) { // 6段目 42〜49（決め手）：タイトルは、漢字1文字。楽器を鳴らす、という意味
  base(); S.aim(NX, -2); lift(0); S.hemi.intensity = 0.9; S.key.color.set('#ffc890');
  HE6.userData.head.rotation.x = -0.35;
  NOTES6.forEach((n, i) => { n.visible = true; const k = ((t * 0.35 + i / 6) % 1); n.position.set(NX - 0.9 + i * 0.36 + Math.sin(t * 2 + i) * 0.1, 2.0 + k * 1.6, -1.8); n.scale.setScalar(Math.sin(k * Math.PI)); });
  tOne.position.set(NX, 3.55, -1.8); tMean.position.set(NX, 3.55, -1.8);
  if (t < 3.6) tOne.userData.pop((t - 0.3) / 0.35); else tMean.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(NX + lerp(0.6, 0.3, u), lerp(1.5, 1.6, u), lerp(2.2, 1.8, u), NX, 2.2, -2.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（春の朝のホームに戻る）
  shotPlat(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPlat(t, 0) },
  { a: 9, b: 17, f: shotBench },
  { a: 17, b: 25, f: shotTrain },
  { a: 25, b: 33, f: shotGo },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotEve },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '春の朝、駅のホームに<br>並んで立つふたり。'],
  [5.6, 9.0, 'ひとりだけが、<br>大きなかばんを持っている。'],
  [9.2, 13.2, '主人公は、<br>ここに残る青年。'],
  [13.2, 17.0, '言いたいことが、<br>なかなか出てこない。'],
  [17.2, 21.0, 'まもなく、<br>電車のドアが閉まる。'],
  [21.0, 25.0, '笑ってみせるのが、<br>せいいっぱい。'],
  [25.2, 29.0, 'ほんとうは、<br>そばにいてほしい。'],
  [29.0, 33.0, 'でも、相手の夢を<br>じゃましたくない。'],
  [33.2, 37.4, '2004年に出た、<br>2人組の曲。'],
  [37.4, 41.8, 'ストリーミングは、<br>2億回をこえた。'],
  [42.2, 45.4, 'タイトルは、<br>漢字1文字。'],
  [45.4, 49.0, '楽器を鳴らす、<br>という意味。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、スキマスイッチの、<br>奏。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q132', v2: true, answer: '奏（かなで）', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'emotional', seed: 13210,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '春': 'はる', '朝': 'あさ', '駅': 'えき', '並んで': 'ならんで', '立つ': 'たつ', '大きな': 'おおきな', '持って': 'もって', '主人公': 'しゅじんこう', '残る': 'のこる', '青年': 'せいねん', '言いたい': 'いいたい', '出てこない': 'でてこない', '電車': 'でんしゃ', '閉まる': 'しまる', '笑って': 'わらって', '相手': 'あいて', '夢': 'ゆめ', '2004年': 'にせんよねん', '出た': 'でた', '2人組': 'ふたりぐみ', '曲': 'きょく', '2億回': 'におくかい', '漢字1文字': 'かんじいちもじ', '楽器': 'がっき', '鳴らす': 'ならす', '意味': 'いみ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'スキマスイッチ': 'スキマスイッチ', '奏': 'かなで', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n春の朝、駅のホームに並んで立つふたり。ひとりだけが、大きなかばんを持っている。主人公は、ここに残る青年。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '旅立ちの歌'],
  },
});
applyQuizCards({ answer: '奏（かなで）', info: 'スキマスイッチ｜2004年', answerSize: 120, kind: '曲' });
