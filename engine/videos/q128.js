import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #128 群青（曲・YOASOBI・2020年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/22）：
//   ・日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2023年7月度。riaj.or.jp/data/st/search/ で「群青」、
//     配信開始日 2020-09-01・ソニー・ミュージックエンタテインメント）。同じ曲名の CD シングルの認定はなく、ゴールドディスク認定もアルバムだけ（GdProducts で「YOASOBI」）
// 物語：曲が描く状況（変わりばえのしない毎日をなんとなく過ごす → 心の奥にしまいこんだ思い → 絵に出会って手が動きはじめる
//   → うまくいかずにくやしい思いをしながらも、向き合いつづける → すべてをかけてキャンバスに向かう）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   歌詞に出てくる街の名前・色や光の言葉は字幕・札・3D・カバーに出さない。音源・ジャケット・MV の映像や設定・漫画の絵・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 大きな街の変わりばえのしない毎日・なんとなくまわりに合わせる → 2 主人公はある若者・心の奥にしまいこんだ思い
//   → 3 放課後の美術室・1枚の絵の前で足が止まる → 4 筆をとったら夢中に・何度もくやしい思い
//   → 5 2020年の配信シングル・ストリーミング5億回 → 6 決め手：すべてをかけてキャンバスに向かう・タイトルは深いあお色を表す漢字2文字
const S = quizStage({ bg: '#b8c4d4', floor: '#6a6e78', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(12810);

const ME = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#e8e8ec', pants: '#3a4050' };
const ETC = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#5a6070', pants: '#2a2e38' }, { skin: '#f4d3b5', hair: '#5a3a2a', shirt: '#9a8a7a', pants: '#3a3a44', long: true, skirt: true },
  { skin: '#eacbb0', hair: '#1a1a1a', shirt: '#6a6a74', pants: '#2a2e38' }, { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#7a7a84', pants: '#4a4a54', long: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function easel(x, z, ry = 0) { const g = new THREE.Group(); for (const s of [-1, 1]) { const l = box(0.06, 1.9, 0.06, mat('#8a6a44')); l.position.set(s * 0.35, 0.95, 0); l.rotation.z = s * 0.12; g.add(l); }
  const b = box(0.06, 1.8, 0.06, mat('#8a6a44')); b.position.set(0, 0.9, -0.4); b.rotation.x = -0.25; g.add(b); const sh = box(0.9, 0.06, 0.12, mat('#8a6a44')); sh.position.set(0, 0.8, 0.05); g.add(sh);
  g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g); return g; }
// 絵の具で少しずつ塗られていくキャンバス（paint(k) で 0〜1）
function canvasBoard(w = 1.0, h = 1.2) { const c = document.createElement('canvas'); c.width = 256; c.height = 300; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const strokes = []; for (let i = 0; i < 70; i++) strokes.push([R() * 256, R() * 300, 30 + R() * 90, 10 + R() * 22, R() * 0.8 - 0.4, ['#1a2a6a', '#24408a', '#3a5aa8', '#16205a', '#5a7ac0', '#e8e0d0'][i % 6]]);
  let last = -1;
  const draw = (k) => { const n = Math.floor(k * strokes.length); if (n === last) return; last = n; const g = c.getContext('2d'); g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, 256, 300);
    for (let i = 0; i < n; i++) { const [x, y, l, wd, a, col] = strokes[i]; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(-l / 2, -wd / 2, l, wd); g.restore(); } tex.needsUpdate = true; };
  draw(0);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), [mat('#d8d0c0'), mat('#d8d0c0'), mat('#d8d0c0'), mat('#d8d0c0'), new THREE.MeshLambertMaterial({ map: tex }), mat('#d8d0c0')]);
  m.userData.paint = draw; qs.add(m); return m; }

// ---------- 1段目. 大きな街の交差点（x=0）。同じ方向へ歩く人の波。そのなかのひとり ----------
{ const rd = box(24, 0.04, 30, mat('#4a4c54')); rd.position.set(0, 0.03, -6); qs.add(rd);
  for (let i = 0; i < 10; i++) { const st = box(0.6, 0.02, 3, mat('#e8e8e8')); st.position.set(-5 + i * 1.1, 0.06, -2); qs.add(st); }
  for (let i = 0; i < 12; i++) { const h = 6 + R() * 12; const b = box(3.4, h, 3, mat(['#8a8e98', '#9a9ca4', '#7a7e88'][i % 3])); b.position.set(i < 6 ? -8 - R() * 2 : 8 + R() * 2, h / 2, -4 - (i % 6) * 4); qs.add(b);
    for (let k = 0; k < 8; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), gl('#c8d8e8')); w.position.set(b.position.x + (i < 6 ? 1.71 : -1.71), 1 + R() * (h - 1.5), b.position.z - 1 + R() * 2); w.rotation.y = i < 6 ? Math.PI / 2 : -Math.PI / 2; qs.add(w); } } }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#9aaac0', '#e0e6ee')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
const ME1 = person(ME, 0.2, -2.2, Math.PI);
const CROWD1 = []; for (let i = 0; i < 22; i++) CROWD1.push(person(ETC[i % 4], -4.5 + R() * 9, -1 - R() * 10, Math.PI));
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tSame = tag('変わりばえのしない、毎日', { size: 52, w: 720, bg: '#14161c', sx: 2.3 }); qs.add(tSame);
const tAlong = tag('なんとなく、まわりに合わせる', { size: 50, w: 780, bg: SONG_GREEN, sx: 2.4 }); qs.add(tAlong);

// ---------- 2段目. 夕方の部屋（x=50）。机の引き出しの奥に、しまいこんだスケッチブック ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#9a8068')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#d8d0c4')); wl.position.set(AX, 2.2, -4.6); qs.add(wl);
  const wn = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), skyTex('#e88a5a', '#f8d0a0')); wn.position.set(AX + 2.2, 2.4, -4.48); qs.add(wn);
  const dk = box(2.2, 0.1, 1.1, mat('#a07848')); dk.position.set(AX - 0.6, 0.9, -3.6); qs.add(dk); const dl = box(0.6, 0.86, 1.0, mat('#7a5a38')); dl.position.set(AX - 1.4, 0.43, -3.6); qs.add(dl); }
const DRAWER2 = box(0.56, 0.22, 0.9, mat('#8a6a44')); qs.add(DRAWER2);
const BOOK2 = box(0.4, 0.04, 0.5, mat('#3a5a8a')); qs.add(BOOK2);
const ME2 = person(ME, AX - 0.6, -2.7, Math.PI);
const tOne = tag('主人公は、ある若者', { size: 56, w: 580, bg: '#14161c', sx: 1.6 }); tOne.position.set(AX - 0.8, 2.5, -3.2); qs.add(tOne);
const tHidden = tag('しまいこんだ、思い', { size: 58, w: 560, bg: SONG_GREEN, sx: 1.6 }); tHidden.position.set(AX - 0.8, 2.5, -3.2); qs.add(tHidden);

// ---------- 3段目. 放課後の美術室（x=100）。イーゼルが並ぶ。1枚の大きな絵の前で足を止める ----------
const BX = 100;
{ const fl = box(14, 0.04, 12, mat('#b8a888')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(14, 4.6, 0.2, mat('#e8e4da')); wl.position.set(BX, 2.3, -6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), skyTex('#f0a870', '#f8e0b8')); w.position.set(BX - 4 + i * 4, 2.6, -5.88); qs.add(w); }
  for (let i = 0; i < 5; i++) easel(BX - 4 + i * 2, -1.0 + (i % 2) * 0.6, 0.1 * (i - 2)); }
const BIG3 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7), new THREE.MeshLambertMaterial({ map: canvasTex(256, 180, (g) => { const gr = g.createLinearGradient(0, 0, 256, 180); gr.addColorStop(0, '#2a3a7a'); gr.addColorStop(0.5, '#4a7ab8'); gr.addColorStop(1, '#1a2a5a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 180);
  for (let i = 0; i < 40; i++) { g.fillStyle = ['#e8e0d0', '#6a9ad0', '#16204a'][i % 3]; g.globalAlpha = 0.5; g.fillRect(R() * 256, R() * 180, 20 + R() * 40, 4 + R() * 8); } }) }));
BIG3.position.set(BX + 0.4, 2.2, -5.85); qs.add(BIG3);
const FRAME3 = box(2.6, 1.9, 0.06, mat('#5a4a3a')); FRAME3.position.set(BX + 0.4, 2.2, -5.92); qs.add(FRAME3);
const ME3 = person(ME, BX + 0.4, -2.4, Math.PI);
const tRoom = tag('放課後の、美術室', { size: 58, w: 540, bg: '#14161c', sx: 1.9 }); tRoom.position.set(BX + 0.4, 3.6, -4.0); qs.add(tRoom);
const tStop = tag('1枚の絵に、足が止まる', { size: 54, w: 660, bg: SONG_GREEN, sx: 2.2 }); tStop.position.set(BX + 0.4, 3.6, -4.0); qs.add(tStop);

// ---------- 4段目. 夜の美術室（x=150）。キャンバスに向かう。丸めた紙が床に増えていく ----------
const CX = 150;
{ const fl = box(12, 0.04, 10, mat('#8a7a64')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.6, 0.2, mat('#c8c4bc')); wl.position.set(CX, 2.3, -5); qs.add(wl);
  const lp = new THREE.PointLight('#ffe0b0', 5, 6); lp.position.set(CX - 0.4, 2.8, -1.6); qs.add(lp); }
easel(CX, -2.6);
const CAN4 = canvasBoard(1.0, 1.2); CAN4.position.set(CX, 1.42, -2.55); CAN4.rotation.x = -0.1;
const ME4 = person(ME, CX - 0.3, -1.6, Math.PI + 0.2);
const PAPER4 = []; for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat('#f0ece4')); p.position.set(CX - 1.6 + R() * 3.2, 0.1, -1.0 - R() * 1.8); qs.add(p); PAPER4.push(p); }
const tGo = tag('筆をとったら、夢中に', { size: 52, w: 720, bg: '#14161c', sx: 2.2 }); tGo.position.set(CX + 0.3, 2.7, -2.4); qs.add(tGo);
const tBitter = tag('何度も、くやしい思い', { size: 56, w: 620, bg: SONG_GREEN, sx: 2.0 }); tBitter.position.set(CX + 0.3, 2.7, -2.4); qs.add(tBitter);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2020 = tag('2020年の、配信シングル', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2020.position.set(FX, 4.4, -2.0); qs.add(t2020);
const tPlay = tag('ストリーミング 5億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 2.7 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. 夜明け前の屋上（x=250）。大きなキャンバスが、深いあお色で塗られていく ----------
const NX = 250;
{ const fl = box(16, 0.04, 12, mat('#7a7a80')); fl.position.set(NX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 16; i++) { const p = box(0.06, 1.2, 0.06, mat('#9aa0a8')); p.position.set(NX - 7.5 + i, 0.6, -6); qs.add(p); }
  const rl = box(16, 0.06, 0.06, mat('#9aa0a8')); rl.position.set(NX, 1.2, -6); qs.add(rl);
  for (let i = 0; i < 12; i++) { const h = 3 + R() * 9; const b = box(2.4, h, 2, mat('#3a4058')); b.position.set(NX - 16 + i * 3, h / 2 - 4, -24); qs.add(b); } }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), skyTex('#101a4a', '#5a7ab0')); SKY6.position.set(NX, 8, -40); qs.add(SKY6);
easel(NX, -2.8);
const CAN6 = canvasBoard(1.5, 1.2); CAN6.position.set(NX, 1.5, -2.75); CAN6.rotation.x = -0.1;
const ME6 = person(ME, NX + 0.5, -1.8, Math.PI - 0.4);
const tAll = tag('すべてをかけて、キャンバスへ', { size: 50, w: 800, bg: '#14161c', sx: 2.0 }); qs.add(tAll);
const tKanji = tag('タイトルは、深いあお色の漢字2文字', { size: 46, w: 900, bg: SONG_GREEN, sx: 2.1 }); qs.add(tKanji);

// ---------- shots ----------
const ALL = [tSame, tAlong, tOne, tHidden, tRoom, tStop, tGo, tBitter, t2020, tPlay, tAll, tKanji, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotCross(t, quiz = 0) { // 1段目 0〜9：大きな街で、変わりばえのしない毎日。なんとなく、まわりに合わせて過ごしている（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.0;
  CROWD1.forEach((p, i) => { poseWalk(p, t * 5 + i, quiz ? 0 : 0.7); p.position.z = -1 - ((i * 0.47) % 10) - (quiz ? 0 : t * 0.35); });
  ME1.position.z = -2.2 - (quiz ? 0 : t * 0.35); poseWalk(ME1, t * 5, quiz ? 0 : 0.7); ME1.userData.head.rotation.x = 0.3;
  const z = ME1.position.z;
  Q1.position.set(0.95, 2.05, z); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tSame.position.set(0.2, 2.85, z - 0.6); tAlong.position.set(0.2, 2.85, z - 0.6);
  if (!quiz) { tSame.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tSame.visible = false; tAlong.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.0, 0.6, u), lerp(2.4, 2.2, u), z + lerp(3.6, 3.0, u), 0.2, 1.5, z - 1.0, 62);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、ある若者。でも心の奥に、しまいこんだ思いがある
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.9; S.darken(0.15, '#5a3a2a');
  const k = ease(clamp((t - 4.4) / 1.0)); DRAWER2.position.set(AX - 1.4, 0.6, -3.1 + 0.5 * k); BOOK2.position.set(AX - 1.4, 0.73, -3.1 + 0.5 * k);
  ME2.userData.head.rotation.x = t > 4.2 ? 0.5 : 0; ME2.userData.arms[0].rotation.x = t > 4.2 ? -0.7 : 0;
  tOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOne.visible = false; tHidden.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.4, 0.1, u), lerp(2.1, 2.0, u), lerp(1.6, 1.1, u), AX - 0.9, 1.2, -3.2, 62);
  return qs;
}
function shotArtRoom(t) { // 3段目 17〜25：放課後の、美術室。1枚の絵の前で、ふと足が止まった
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.1;
  const stop = ease(clamp((t - 0.4) / 3.6)); ME3.position.set(BX + lerp(-2.4, 0.4, stop), 0, -3.2); ME3.rotation.y = stop < 1 ? Math.PI / 2 + 0.3 : Math.PI; poseWalk(ME3, t * 4, stop < 1 ? 0.7 : 0);
  if (t > 4.3) ME3.userData.head.rotation.x = -0.15;
  tRoom.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRoom.visible = false; tStop.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.4, u), lerp(2.0, 2.0, u), lerp(1.4, 0.8, u), BX + 0.3, 2.0, -5.0, 62);
  return qs;
}
function shotPaint(t) { // 4段目 25〜33：筆をとってみたら、時間を忘れて夢中に。うまくいかなくて、何度もくやしい思いをする
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.55, '#0a0c18');
  CAN4.userData.paint(clamp(t / 4.0) * 0.55);
  ME4.userData.arms[1].rotation.set(-1.8 + Math.sin(t * 7) * 0.25, 0, 0.2);
  PAPER4.forEach((p, i) => { p.visible = t > 4.0 + i * 0.35; });
  if (t > 4.2) { ME4.userData.head.rotation.x = 0.4; ME4.userData.arms[1].rotation.x = -0.4; }
  tGo.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGo.visible = false; tBitter.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.2, 0.9, u), lerp(2.1, 2.0, u), lerp(2.2, 1.6, u), CX + 0.1, 1.5, -2.4, 62);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2020年の配信シングル。ストリーミングは、5億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.9;
  DISC.rotation.z = t * 1.2; BARS.userData.update(t);
  t2020.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2020.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX + lerp(-0.4, 0.3, u), lerp(2.7, 2.6, u), lerp(4.6, 4.0, u), FX, 2.7, -2.2, 62);
  return qs;
}
function shotRoof(t) { // 6段目 42〜49（決め手）：すべてをかけて、キャンバスに向かう。タイトルは、深いあお色を表す漢字2文字
  base(); S.aim(NX, -2); lift(0); S.hemi.intensity = 0.8;
  CAN6.userData.paint(0.3 + 0.7 * clamp(t / 6));
  ME6.userData.arms[1].rotation.set(-2.0 + Math.sin(t * 6) * 0.3, 0, 0.3);
  tAll.position.set(NX, 3.1, -2.6); tKanji.position.set(NX, 3.1, -2.6);
  if (t < 3.6) tAll.userData.pop((t - 0.3) / 0.35); else tKanji.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(NX + lerp(-0.5, -0.1, u), lerp(2.1, 2.1, u), lerp(2.0, 1.6, u), NX, 1.9, -2.8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（交差点に戻る）
  shotCross(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCross(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotArtRoom },
  { a: 25, b: 33, f: shotPaint },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotRoof },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '大きな街で、<br>変わりばえのしない毎日。'],
  [5.6, 9.0, 'なんとなく、まわりに<br>合わせて過ごしている。'],
  [9.2, 13.2, '主人公は、<br>ある若者。'],
  [13.2, 17.0, 'でも心の奥に、<br>しまいこんだ思いがある。'],
  [17.2, 21.0, '放課後の、<br>美術室。'],
  [21.0, 25.0, '1枚の絵の前で、<br>ふと足が止まった。'],
  [25.2, 29.0, '筆をとってみたら、<br>時間を忘れて夢中に。'],
  [29.0, 33.0, 'うまくいかなくて、<br>何度もくやしい思いをする。'],
  [33.2, 37.4, '2020年の、<br>配信シングル。'],
  [37.4, 41.8, 'ストリーミングは、<br>5億回をこえた。'],
  [42.2, 45.4, 'すべてをかけて、<br>キャンバスに向かう。'],
  [45.4, 49.0, 'タイトルは、深いあお色を<br>表す漢字2文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、YOASOBIの、<br>群青。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q128', v2: true, answer: '群青', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 12810,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.4, 'poof', 0.4], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '大きな': 'おおきな', '街': 'まち', '変わりばえ': 'かわりばえ', '毎日': 'まいにち', '合わせて': 'あわせて', '過ごして': 'すごして', '主人公': 'しゅじんこう', '若者': 'わかもの', '心の奥': 'こころのおく', '思い': 'おもい', '放課後': 'ほうかご', '美術室': 'びじゅつしつ', '1枚': 'いちまい', '絵': 'え', '前': 'まえ', '足': 'あし', '止まった': 'とまった', '筆': 'ふで', '時間': 'じかん', '忘れて': 'わすれて', '夢中': 'むちゅう', '何度も': 'なんども', '2020年': 'にせんにじゅうねん', '配信': 'はいしん', '5億回': 'ごおくかい', '向かう': 'むかう', '深い': 'ふかい', '色': 'いろ', '表す': 'あらわす', '漢字2文字': 'かんじにもじ', '曲': 'きょく', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'YOASOBI': 'ヨアソビ', '群青': 'ぐんじょう', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n大きな街で、変わりばえのしない毎日。なんとなく、まわりに合わせて過ごしている。主人公は、ある若者。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '応援ソング'],
  },
});
applyQuizCards({ answer: '群青', info: 'YOASOBI｜2020年', answerSize: 140, kind: '曲' });
