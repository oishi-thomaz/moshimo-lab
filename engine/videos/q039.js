import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #039 香水（曲・瑛人・2019年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・配信開始 2019年4月21日、日本レコード協会のストリーミング認定 トリプル・プラチナ（3億回以上。2025年1月度。riaj.or.jp/data/st/search/ で「香水」）
// 物語：曲が描く状況（別れた恋人から久しぶりに連絡 → 会ってみると相手は昔のまま → やり直す気はないのに気持ちが揺れる → 決め手は相手の香り）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回し・ブランド名は使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 夜、スマホに別れた恋人の名前 → 2 しばらくぶりに会う・未練はないはず → 3 しぐさも付き合っていたときのまま → 4 やり直す気はないのに気持ちが顔を出す
//   → 5 2019年に配信・ストリーミング3億回 → 6 決め手：あの人の甘い香り（香水のびんの3D。ブランドの形はまねない）・タイトルは漢字2文字

const S = quizStage({ bg: '#1e1830', floor: '#241e34', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(3939);

const ME = { skin: '#efcfae', hair: '#2a2420', shirt: '#5a6a8a', pants: '#2a2f3c' };
const EX = { skin: '#f2d4b8', hair: '#4a2e22', shirt: '#d86a8a', pants: '#2a2438', long: true, skirt: true };
const PINK = '#e86a9a';

// ---------- 1段目. 夜の部屋（x=0）。枕元でスマホが光る ----------
{ const fl = box(10, 0.04, 8, mat('#3a3040')); fl.position.set(0, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#4a4058')); wl.position.set(0, 3, -4); qs.add(wl);
  const win = box(2.2, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#141a36' })); win.position.set(2.6, 3.0, -3.88); qs.add(win);
  const bed = box(2.4, 0.5, 3.4, mat('#6a5a7a')); bed.position.set(-0.6, 0.25, -1.6); qs.add(bed); const sheet = box(2.3, 0.14, 2.2, mat('#e8e0ec')); sheet.position.set(-0.6, 0.57, -0.9); qs.add(sheet);
  const pil = box(1.2, 0.2, 0.6, mat('#f4f0f6')); pil.position.set(-0.6, 0.6, -2.9); qs.add(pil);
  const st = box(0.8, 0.7, 0.7, mat('#5a4636')); st.position.set(1.2, 0.35, -2.8); qs.add(st); }
const me1 = makePerson(ME); me1.rotation.x = -Math.PI / 2; me1.position.set(-0.6, 0.78, -0.95); qs.add(me1);
const PHONE = new THREE.Group(); PHONE.position.set(1.2, 0.74, -2.7); qs.add(PHONE);
{ const b = box(0.34, 0.04, 0.6, mat('#1a1a1e')); PHONE.add(b); }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.54), new THREE.MeshBasicMaterial({ color: '#2a2a30' })); SCREEN.rotation.x = -Math.PI / 2; SCREEN.position.y = 0.025; PHONE.add(SCREEN);
const GLOW = new THREE.PointLight(0x9ac8ff, 0, 5, 1.6); GLOW.position.set(1.2, 1.2, -2.6); qs.add(GLOW);
const tNote = tag('寝る前の通知', { size: 70, w: 480, bg: '#14161c', sx: 1.0 }); tNote.position.set(0.7, 1.75, -1.6); qs.add(tNote);
const tEx = tag('別れた恋人から', { size: 68, w: 520, bg: PINK, sx: 1.05 }); tEx.position.set(0.7, 1.75, -1.6); qs.add(tEx);

// ---------- 2段目. カフェのテーブルで向かい合う（x=40） ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#5a4636')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#6a5248')); wl.position.set(KX, 3, -4); qs.add(wl);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 24), mat('#e8dcc8')); tb.position.set(KX, 0.8, -1.4); qs.add(tb); const lg = box(0.08, 0.8, 0.08, mat('#2a2a2e')); lg.position.set(KX, 0.4, -1.4); qs.add(lg);
  for (const s of [-0.25, 0.25]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 14), mat('#ffffff')); cup.position.set(KX + s, 0.9, -1.4); qs.add(cup); }
 }
const me2 = makePerson(ME); me2.position.set(KX + 0.95, -0.32, -1.4); me2.rotation.y = -Math.PI / 2; me2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(me2);
const ex2 = makePerson(EX); ex2.position.set(KX - 0.95, -0.32, -1.4); ex2.rotation.y = Math.PI / 2; ex2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(ex2);
const tAgain = tag('しばらくぶりの再会', { size: 60, w: 600, bg: '#14161c', sx: 1.5 }); tAgain.position.set(KX, 2.7, -1.2); qs.add(tAgain);
const tNo = tag('未練はない…はず', { size: 64, w: 560, bg: PINK, sx: 1.5 }); tNo.position.set(KX, 2.7, -1.2); qs.add(tNo);

// ---------- 3段目. 夜の街を並んで歩く（x=90） ----------
const CX = 90;
{ const rd = box(6, 0.04, 30, mat('#2e2a3a')); rd.position.set(CX, 0.03, -8); qs.add(rd); }
const BLDG3 = []; for (let i = 0; i < 10; i++) { const w = 2.2 + R() * 1.4, h = 4 + R() * 7; const wt = windowTextures(3900 + i, ['#4a3a5a', '#3a3450', '#5a4060'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffb8d0'), emissiveIntensity: 0.6 })); const side = i % 2 ? 1 : -1; b.position.set(CX + side * (4.2 + (i >> 1) * 0.3), h / 2, -2 - (i >> 1) * 4.6); qs.add(b); BLDG3.push(b); }
const SIGNS = []; for (let i = 0; i < 6; i++) { const sg = box(0.12, 1.2, 0.5, new THREE.MeshBasicMaterial({ color: ['#ff6aa8', '#6ad8ff', '#ffd86a'][i % 3] })); sg.position.set(CX + (i % 2 ? 2.95 : -2.95), 2.6, -1 - i * 3); qs.add(sg); SIGNS.push(sg); }
const me3 = makePerson(ME); me3.position.set(CX + 0.35, 0, 0); me3.rotation.y = Math.PI; qs.add(me3);
const ex3 = makePerson(EX); ex3.position.set(CX - 0.35, 0, 0); ex3.rotation.y = Math.PI; qs.add(ex3);
const tSame = tag('付き合っていたときのまま', { size: 52, w: 720, bg: '#14161c', sx: 2.1 }); tSame.position.set(CX, 2.6, -0.4); qs.add(tSame);
const tBack = tag('昔に引き戻される', { size: 62, w: 560, bg: PINK, sx: 1.9 }); tBack.position.set(CX, 2.6, -0.4); qs.add(tBack);

// ---------- 4段目. ひとりのベンチ（x=130）。ゆれる気持ち ----------
const BX = 130;
{ const fl = box(14, 0.04, 10, mat('#2a3030')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const seat = box(2.0, 0.08, 0.5, mat('#6a4a32')); seat.position.set(BX, 0.48, -1.4); qs.add(seat); const back = box(2.0, 0.5, 0.06, mat('#6a4a32')); back.position.set(BX, 0.8, -1.65); qs.add(back);
  for (const s of [-0.9, 0.9]) { const l = box(0.06, 0.48, 0.5, mat('#2a2a2e')); l.position.set(BX + s, 0.24, -1.4); qs.add(l); }
  const pole = box(0.1, 3.6, 0.1, mat('#2a2a2e')); pole.position.set(BX + 1.6, 1.8, -1.9); qs.add(pole); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); bulb.position.set(BX + 1.6, 3.6, -1.9); qs.add(bulb);
  for (let i = 0; i < 5; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 8), mat('#1e3a2e')); tr.position.set(BX - 5 + i * 2.5, 1.6, -6 - (i % 2)); qs.add(tr); } }
const LP4 = new THREE.PointLight(0xffd890, 0, 8, 1.4); LP4.position.set(BX + 1.4, 3.2, -1.4); qs.add(LP4);
const me4 = makePerson(ME); me4.position.set(BX, 0.16, -1.35); me4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(me4);
const HEART = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.3); sh.bezierCurveTo(0.5, 0.05, 0.3, 0.42, 0, 0.18); sh.bezierCurveTo(-0.3, 0.42, -0.5, 0.05, 0, -0.3); return sh; })(), { depth: 0.08, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: PINK })); HEART.position.set(BX + 0.6, 2.1, -1.2); qs.add(HEART);
const tNot = tag('やり直す気はない', { size: 62, w: 560, bg: '#14161c', sx: 1.7 }); tNot.position.set(BX, 2.75, -1.2); qs.add(tNot);
const tYet = tag('なのに、気持ちが…', { size: 62, w: 560, bg: PINK, sx: 1.7 }); tYet.position.set(BX, 2.75, -1.2); qs.add(tYet);

// ---------- 5段目. 2019年に配信・ストリーミング3億回（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#221a34' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 3.2, -1.6); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.35, -1.4); BARS.scale.set(0.8, 0.4, 0.8); qs.add(BARS);
const tYear = tag('2019年に配信された曲', { size: 58, w: 680, bg: '#e6b450', color: '#14161c', sx: 2.9 }); tYear.position.set(FX, 5.6, -1.2); qs.add(tYear);
const tPlay = tag('ストリーミング 3億回超え', { size: 56, w: 740, bg: SONG_GREEN, sx: 3.0 }); tPlay.position.set(FX, 5.6, -1.2); qs.add(tPlay);

// ---------- 6段目. 甘い香り（x=210）。すれちがう人と、ただよう香り、香水のびん ----------
const NX = 210;
{ const rd = box(8, 0.04, 30, mat('#2e2a3a')); rd.position.set(NX, 0.03, -8); qs.add(rd); }
const me6 = makePerson(ME); me6.position.set(NX + 0.6, 0, -1); me6.rotation.y = -Math.PI / 2; qs.add(me6);
const ex6 = makePerson(EX); ex6.position.set(NX - 0.6, 0, -1); ex6.rotation.y = Math.PI / 2; qs.add(ex6);
const BOTTLE = new THREE.Group(); BOTTLE.position.set(NX, 2.0, -1.0); qs.add(BOTTLE);
{ const glass = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.26), new THREE.MeshStandardMaterial({ color: '#f4a8c8', transparent: true, opacity: 0.75, metalness: 0.2, roughness: 0.1 })); BOTTLE.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), mat('#d8c070')); neck.position.y = 0.36; BOTTLE.add(neck);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat('#d8c070')); cap.position.y = 0.5; BOTTLE.add(cap); }
const MIST = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 + R() * 0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb8d8', transparent: true })); m.userData.o = R(); m.userData.y = R(); qs.add(m); MIST.push(m); }
const tSmell = tag('あの人の甘い香り', { size: 62, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.5 }); tSmell.position.set(NX, 3.25, -0.6); qs.add(tSmell);
const tKanji = tag('タイトルは漢字2文字', { size: 58, w: 640, bg: SONG_GREEN, sx: 1.6 }); tKanji.position.set(NX, 2.8, -0.6); qs.add(tKanji);

// ---------- shots ----------
const ALL = [tNote, tEx, tAgain, tNo, tSame, tBack, tNot, tYet, tYear, tPlay, tSmell, tKanji];
function base() { S.reset(); ALL.forEach(x => x.visible = false); GLOW.intensity = 0; LP4.intensity = 0; HEART.visible = false; }
function walk(p, t, k = 1) { const ph = t * 7; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.35 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.35 * k; }

function shotRoom(t) { // 1段目 0〜9：夜、スマホが光った。画面には、別れた恋人の名前（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.5; S.key.intensity = 0.25; S.darken(0.45, '#0a0818');
  const on = 1; SCREEN.material.color.set(on ? '#cfe6ff' : '#2a2a30'); GLOW.intensity = on * (5 + Math.sin(t * 6) * 1.5);
  PHONE.position.y = 0.74 + ((t % 3) < 1.2 ? Math.abs(Math.sin(t * 30)) * 0.02 : 0);
  tNote.userData.pop(1); if (t > 4.6) tNote.visible = false;
  tEx.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(2.8, 2.4, u), lerp(2.6, 2.4, u), lerp(1.8, 1.2, u), 0.2, 0.7, -2.2, 56);
  return qs;
}
function shotCafe(t) { // 2段目 9〜17：しばらくぶりに、ふたりで会うことに。もう、未練なんてない。…はずだった
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.1;
  ex2.userData.head.rotation.x = Math.sin(t * 2) * 0.05; ex2.userData.arms[0].rotation.x = -0.9; me2.userData.arms[1].rotation.x = -0.9;
  me2.userData.head.rotation.y = t > 4.4 ? 0.4 * Math.sin((t - 4.4) * 1.2) : 0;
  tAgain.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tAgain.visible = false;
  tNo.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.3, 0.1, u), lerp(1.9, 1.8, u), lerp(2.8, 2.3, u), KX, 1.3, -1.4, 56);
  return qs;
}
function shotStreet(t) { // 3段目 17〜25：笑い方も、しぐさも、付き合っていたときのまま。話しているうちに、昔に引き戻される
  base(); S.aim(CX, -4); lift(-30); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.4, '#140a20');
  for (const [p, o] of [[me3, 0], [ex3, Math.PI]]) { p.position.z = -t * 0.55; walk(p, t + (o ? 0.4 : 0), 1); }
  ex3.userData.head.rotation.y = 0.4 + Math.sin(t * 1.5) * 0.15; me3.userData.head.rotation.y = -0.35;
  SIGNS.forEach((s, i) => s.material.color.setHSL(((i * 0.17 + t * 0.05) % 1), 0.8, 0.6));
  tSame.position.z = -0.4 - t * 0.55; tBack.position.z = -0.4 - t * 0.55;
  tSame.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSame.visible = false;
  tBack.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + 0.4, lerp(1.8, 1.9, u), 3.4 - t * 0.55, CX, 1.5, -5 - t * 0.55, 58);
  return qs;
}
function shotBench(t) { // 4段目 25〜33：今さらやり直す気なんて、ない。なのに、しまいこんだ気持ちが顔を出す
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 0.6; S.key.intensity = 0.3; S.darken(0.45, '#0a0818'); LP4.intensity = 6;
  me4.userData.head.rotation.x = t < 4.2 ? 0.35 : 0.35 - 0.5 * ease((t - 4.2) / 0.8); me4.userData.arms.forEach(a => a.rotation.x = -0.6);
  HEART.visible = t > 4.4; const k = ease(clamp((t - 4.4) / 0.6)); HEART.scale.setScalar(Math.max(0.01, k * (1 + Math.sin(t * 6) * 0.08))); HEART.rotation.y = Math.sin(t * 2) * 0.4;
  tNot.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tNot.visible = false;
  tYet.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0, u), lerp(1.6, 1.7, u), lerp(3.6, 3.0, u), BX, 1.3, -1.4, 56);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2019年に配信された曲。ストリーミングで、3億回を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t);
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tPlay.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.5, -1.5, 56);
  return qs;
}
function shotScent(t, quiz = 0) { // 6段目 42〜49（決め手）：ふわっとよみがえるのは、あの人の甘い香り。タイトルは、漢字2文字
  base(); S.aim(NX, -2); lift(-30); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.35, '#140a20');
  me6.userData.head.rotation.x = -0.1; ex6.userData.head.rotation.y = -0.3; ex6.userData.arms[0].rotation.x = -0.4;
  BOTTLE.rotation.y = t * 0.8; BOTTLE.position.y = 2.0 + Math.sin(t * 1.6) * 0.05;
  MIST.forEach(m => { const k = (t * 0.18 + m.userData.o) % 1; m.position.set(NX - 0.5 + k * 1.2, 1.6 + m.userData.y * 0.8 + Math.sin(k * 7 + m.userData.o * 9) * 0.15, -1 + Math.cos(k * 5 + m.userData.y * 7) * 0.3); m.material.opacity = Math.sin(k * Math.PI) * 0.8; });
  if (!quiz) { tSmell.userData.pop((t - 0.4) / 0.35); tKanji.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(-0.2, 0, u), lerp(1.9, 1.8, u), lerp(3.4, 3.0, u), NX, 1.8, -1, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotScent(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.2, d);
  S.spot.color.set(0xffd8e8); S.spot.position.set(NX, 6, 2); S.spot.target.position.set(NX, 1, -1); S.spot.intensity = lerp(0, 45, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(1.6, 1.2, k), lerp(1.6, 1.5, k), lerp(3.4, 3.0, k), NX, 1.5, -1, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRoom },
  { a: 9, b: 17, f: shotCafe },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotBench },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotScent(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '夜、スマホが<br>光った。'],
  [5.6, 9.0, '画面には、<br>別れた恋人の名前。'],
  [9.2, 13.2, 'しばらくぶりに、<br>ふたりで会うことに。'],
  [13.2, 17.0, 'もう、未練なんてない。<br>…はずだった。'],
  [17.2, 21.0, '笑い方も、しぐさも、<br>付き合っていたときのまま。'],
  [21.0, 25.0, '話しているうちに、<br>昔に引き戻される。'],
  [25.2, 29.0, '今さらやり直す気なんて、<br>ない。'],
  [29.0, 33.0, 'なのに、しまいこんだ<br>気持ちが顔を出す。'],
  [33.2, 37.4, '2019年に<br>配信された曲。'],
  [37.4, 41.8, 'ストリーミングで、<br>3億回を超えた。'],
  [42.2, 45.4, 'ふわっとよみがえるのは、<br>あの人の甘い香り。'],
  [45.4, 49.0, 'タイトルは、<br>漢字2文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、瑛人の、香水。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q039', v2: true, answer: '香水', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 3939,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [1.0, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '瑛人': 'えいと', '香水': 'こうすい', '未練': 'みれん', '付き合って': 'つきあって', '昔に': 'むかしに', '引き戻される': 'ひきもどされる', '今さら': 'いまさら', '顔を出す': 'かおをだす', '2019年': 'にせんじゅうきゅうねん', '3億回': 'さんおくかい', '甘い香り': 'あまいかおり', '漢字2文字': 'かんじにもじ', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\n夜、スマホが光った。画面には、別れた恋人の名前。しばらくぶりに、ふたりで会うことに。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '令和ソング'],
  },
});
applyQuizCards({ answer: '香水', info: '瑛人｜2019年', answerSize: 150, kind: '曲' });
