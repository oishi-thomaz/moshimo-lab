import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #078 あなたの番です（ドラマ・日本・2019年・全20話。Hulu・Netflix で見放題（Prime Video も）、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/anatanofan-desu で2026/11/12確認（Filmarks の動画配信欄も Prime Video・Hulu・Netflix 見放題）。
//   Filmarks シーズン1 4.0・レビュー37,105件 filmarks.com/dramas/6055/8586）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/あなたの番です。2026/11/12）：
//   ・とあるマンションに引っ越してきた年の差婚の新婚夫婦。引っ越したその日の住民会で、殺したい人の名前を紙に書き、
//     クジのように引くゲームが始まる（Filmarks・JustWatch・Wikipedia）
//   ・紙に書かれた人間が次々と殺され始める。隣人たちの疑心暗鬼の渦に飲み込まれる夫婦が連続殺人の謎に挑む（Filmarks・JustWatch）
//   ・日本テレビ系、2019年4月14日から9月8日まで全20話。2クール・半年間の放送（Wikipedia）
//   ・2019年の新語・流行語大賞にタイトルがノミネート（Wikipedia）
//   ・着想は、年齢や職業など何もかもが違う人たちが同じマンションに住んでいるというだけで集まる住民会（Wikipedia）
// 構成（ヒント6段）：1 住民会で始まったちょっとしたゲーム、紙に名前を書いて箱から引く → 2 主人公は年の差婚の新婚夫婦、買ったばかりのマンションへ
//   → 3 年齢も仕事もバラバラな住民たち、誰もが隣人を疑い始める → 4 紙に書かれていたのは消えてほしい人の名前、書かれた人が次々と事件に
//   → 5 2019年の日本のドラマ・半年間全20話、タイトルが流行語大賞にノミネート → 6 決め手：交換殺人ゲーム・タイトルは順番を告げる言葉
// 犯人・黒幕・誰が亡くなるか・結末は言わない。人物名・マンション名・地名は出さない。紙の文字は書かない（線だけ）。
// 俳優の顔・ポスター・ロゴ・有名な場面の構図は使わない。事件そのものの場面は見せない。人は汎用の3D

const S = quizStage({ bg: '#1a1e2a', floor: '#2a2a30', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(7878);

const WIFE = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#e9e4da', pants: '#8a9ab0', long: true, skirt: true };
const HUS = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#4fa3d1', pants: '#2b3346' };
const RES = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5', '#d9a57c'][i % 4], hair: ['#1d1a19', '#9a9a9a', '#4a3426', '#2c2421', '#6b4a33'][i % 5], shirt: ['#59606e', '#c94f7c', '#3f8f6b', '#f2c14e', '#2b2f3a', '#8e6bbf', '#d97a3a'][i % 7], pants: ['#2b3346', '#3b3f4a', '#5a4a3a'][i % 3], long: i % 3 === 1, skirt: i % 3 === 1, tie: i % 4 === 0 });

function slip() { return new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), new THREE.MeshBasicMaterial({ map: canvasTex(120, 160, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3a44'; g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(26, 46 + i * 34); g.lineTo(94 - i * 8, 50 + i * 34); g.stroke(); } }), side: THREE.DoubleSide })); }
function ballotBox() { const g = new THREE.Group(); const b = box(0.6, 0.5, 0.6, mat('#e9e4da')); b.position.y = 0.25; g.add(b); const sl = box(0.3, 0.02, 0.05, mat('#14161c')); sl.position.y = 0.51; g.add(sl); return g; }

// ---------- 1段目. マンションの集会室（x=0）。長机を囲む住民、紙に名前を書いて箱へ ----------
{ const fl = box(14, 0.04, 12, mat('#8a8070')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 4.5, 0.2, mat('#d8d4c8')); wl.position.set(0, 2.25, -5.6); qs.add(wl);
  const clk = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), new THREE.MeshBasicMaterial({ color: '#f4f0e4' })); clk.position.set(-5.4, 3.4, -5.48); qs.add(clk);
  const tb = box(4.6, 0.08, 1.4, mat('#c8b898')); tb.position.set(0, 0.76, -2.6); qs.add(tb);
  for (const x of [-2.1, 2.1]) for (const z of [-3.2, -2.0]) { const lg = box(0.08, 0.74, 0.08, mat('#59606e')); lg.position.set(x, 0.37, z); qs.add(lg); }
  for (let i = 0; i < 4; i++) { const lp = box(1.4, 0.05, 0.4, new THREE.MeshBasicMaterial({ color: '#f4f8ff' })); lp.position.set(-3 + i * 2, 4.4, -2.6); qs.add(lp); } }
const MEET = []; for (let i = 0; i < 8; i++) { const p = makePerson(RES(i)); const side = i < 4 ? -1 : 1; p.position.set(-1.6 + (i % 4) * 1.05, -0.4, -2.6 + side * 1.05); p.rotation.y = side < 0 ? 0 : Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); MEET.push(p); }
const BOX1 = ballotBox(); BOX1.position.set(0, 0.8, -2.6); qs.add(BOX1);
const SLIPS1 = []; for (let i = 0; i < 6; i++) { const s = slip(); qs.add(s); SLIPS1.push(s); }
const tGame = tag('住民会のゲーム', { size: 64, w: 500, bg: '#14161c', sx: 1.8 }); tGame.position.set(0, 2.3, -2.6); qs.add(tGame);
const tDraw = tag('名前を書いて、引く', { size: 60, w: 580, bg: '#8a1f2c', sx: 2.0 }); tDraw.position.set(0, 2.3, -2.6); qs.add(tDraw);

// ---------- 2段目. 新しい部屋（x=40）。段ボールに囲まれた、年の差の新婚夫婦 ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#c8a878')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 4, 0.2, mat('#f4f0e8')); wl.position.set(AX, 2, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(260, 180, (g, w, h) => { g.fillStyle = '#9ac4e8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const bh = 40 + (i * 37) % 90; g.fillStyle = '#b8c4d0'; g.fillRect(i * 30, h - bh, 24, bh); } }) })); win.position.set(AX + 2.2, 2.2, -3.88); qs.add(win);
  for (let i = 0; i < 7; i++) { const b = box(0.6, 0.45, 0.5, mat('#c89a5a')); b.position.set(AX - 3 + (i % 4) * 0.7, 0.23 + Math.floor(i / 4) * 0.45, -3.2 + (i % 2) * 0.4); qs.add(b); const tp = box(0.61, 0.02, 0.08, mat('#e8d8a8')); tp.position.set(b.position.x, b.position.y + 0.23, b.position.z); qs.add(tp); } }
const wife2 = makePerson(WIFE); wife2.position.set(AX - 0.45, 0, -1.6); wife2.rotation.y = 0.3; qs.add(wife2);
const hus2 = makePerson(HUS); hus2.position.set(AX + 0.45, 0, -1.6); hus2.rotation.y = -0.3; qs.add(hus2);
const KEY = new THREE.Group(); { const r = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), mat('#e6b450')); KEY.add(r); const s = box(0.03, 0.18, 0.02, mat('#e6b450')); s.position.y = -0.14; KEY.add(s); } qs.add(KEY);
const HEARTS2 = []; for (let i = 0; i < 5; i++) { const h = tag('♥', { size: 80, w: 120, h: 120, bg: '#e86a9a', sx: 0.34 }); qs.add(h); HEARTS2.push(h); }
const tCouple = tag('年の差の新婚夫婦', { size: 60, w: 560, bg: '#14161c', sx: 1.9 }); tCouple.position.set(AX, 2.65, -1.8); qs.add(tCouple);
const tMove = tag('買ったばかりの部屋', { size: 58, w: 580, bg: '#3a7ad8', sx: 1.9 }); tMove.position.set(AX, 2.65, -1.8); qs.add(tMove);

// ---------- 3段目. 夜のマンション（x=80）。窓ごとに違う住民、こちらをうかがう ----------
const BX = 80;
const WINP = [];
{ const gr = box(30, 0.04, 30, mat('#2a2a30')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  const bd = box(10, 11, 3, mat('#a8a49a')); bd.position.set(BX, 5.5, -10); qs.add(bd);
  for (let f = 0; f < 4; f++) for (let i = 0; i < 4; i++) { const lit = (f * 4 + i) % 3 !== 2; const w = box(1.6, 1.4, 0.05, new THREE.MeshBasicMaterial({ color: lit ? '#f4d890' : '#2a3040' })); w.position.set(BX - 3.6 + i * 2.4, 1.8 + f * 2.5, -8.47); qs.add(w);
    const bl = box(1.9, 0.08, 0.5, mat('#8a867c')); bl.position.set(BX - 3.6 + i * 2.4, 1.05 + f * 2.5, -8.25); qs.add(bl);
    if (lit) WINP.push([BX - 3.6 + i * 2.4, 1.1 + f * 2.5]); } }
const SIL = []; for (let i = 0; i < 9; i++) { const p = makePerson(RES(i + 3)); const [x, y] = WINP[i % WINP.length]; p.position.set(x, y - 0.55, -8.62); p.scale.setScalar(0.9); qs.add(p); SIL.push(p); }
const EYES = []; for (let i = 0; i < 6; i++) { const e = tag('？', { size: 90, w: 140, h: 140, bg: '#8a1f2c', sx: 0.5 }); qs.add(e); EYES.push(e); }
const tNeighbors = tag('となりの住民たち', { size: 62, w: 560, bg: '#14161c', sx: 2.0 }); tNeighbors.position.set(BX, 6.4, -2); qs.add(tNeighbors);
const tDoubt = tag('隣人を、疑う', { size: 66, w: 460, bg: '#8a1f2c', sx: 1.8 }); tDoubt.position.set(BX, 6.4, -2); qs.add(tDoubt);

// ---------- 4段目. 夜のエントランスの掲示板（x=120）。貼り出された1枚の紙 ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#5a5a60')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(12, 4.5, 0.2, mat('#c8c4b8')); wl.position.set(CX, 2.25, -4); qs.add(wl);
  const brd = box(3.2, 2.0, 0.08, mat('#8a6a48')); brd.position.set(CX, 2.0, -3.85); qs.add(brd);
  const cork = box(3.0, 1.8, 0.02, mat('#c8a070')); cork.position.set(CX, 2.0, -3.8); qs.add(cork);
  for (let i = 0; i < 3; i++) { const n = box(0.6, 0.45, 0.01, mat(['#f4f0e4', '#e8f0f8', '#f8f0d8'][i])); n.position.set(CX - 1.0 + i * 0.5, 2.5 - (i % 2) * 0.6, -3.78); n.rotation.z = (i - 1) * 0.08; qs.add(n); }
  const mb = box(2.4, 1.2, 0.4, mat('#9a9aa0')); mb.position.set(CX + 3.4, 1.2, -3.7); qs.add(mb); }
const PAPER4 = slip(); PAPER4.scale.set(2.6, 2.6, 1); PAPER4.position.set(CX + 0.6, 1.95, -3.76); qs.add(PAPER4);
const PIN = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#e2483c')); PIN.position.set(CX + 0.6, 2.33, -3.72); qs.add(PIN);
const wife4 = makePerson(WIFE); wife4.position.set(CX - 0.75, 0, -1.6); wife4.rotation.y = Math.PI; qs.add(wife4);
const hus4 = makePerson(HUS); hus4.position.set(CX - 0.05, 0, -1.6); hus4.rotation.y = Math.PI; qs.add(hus4);
const tWho = tag('書いた名前は…', { size: 64, w: 480, bg: '#14161c', sx: 1.8 }); tWho.position.set(CX, 3.3, -3.0); qs.add(tWho);
const tNext = tag('次々と、事件が', { size: 64, w: 500, bg: '#8a1f2c', sx: 1.8 }); tNext.position.set(CX, 3.3, -3.0); qs.add(tNext);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2019年の日本のドラマ、全20話 ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2e3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { g.fillStyle = '#14182a'; g.fillRect(0, 0, w, h); for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) { g.fillStyle = (f + i) % 3 ? '#f4d890' : '#2a3040'; g.fillRect(150 + i * 92, 70 + f * 92, 60, 52); } }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const CAL = []; for (let i = 0; i < 6; i++) { const c = tag(['4月', '5月', '6月', '7月', '8月', '9月'][i], { size: 70, w: 180, h: 140, bg: '#f4f0e4', color: '#14161c', sx: 0.62 }); c.position.set(TX - 1.85 + i * 0.74, 3.9, -3.2); qs.add(c); CAL.push(c); }
const t2019 = tag('2019年 日本のドラマ', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2019.position.set(TX, 4.85, -3.0); qs.add(t2019);
const tBuzz = tag('流行語大賞にノミネート', { size: 54, w: 700, bg: '#8a1f2c', sx: 2.6 }); tBuzz.position.set(TX, 4.85, -3.0); qs.add(tBuzz);

// ---------- 6段目. 暗い部屋の箱（x=220）。引いた紙が、ひとりずつにまわってくる ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#1a1a20')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.08, 28), mat('#3a2a24')); tb.position.set(DX, 0.8, -1.8); qs.add(tb);
  const lg = box(0.2, 0.8, 0.2, mat('#2a1e18')); lg.position.set(DX, 0.4, -1.8); qs.add(lg); }
const BOX6 = ballotBox(); BOX6.position.set(DX, 0.84, -1.8); qs.add(BOX6);
const CARD6 = slip(); CARD6.scale.set(2.2, 2.2, 1); qs.add(CARD6);
const HANDS = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const p = makePerson(RES(i)); p.position.set(DX + Math.sin(a) * 2.1, 0, -1.8 + Math.cos(a) * 2.1); p.rotation.y = a + Math.PI; qs.add(p); HANDS.push(p); }
const SPOT6 = new THREE.SpotLight(0xffe0c0, 0, 10, 0.4, 0.5, 1); SPOT6.position.set(DX, 5, -1.8); SPOT6.target.position.set(DX, 0.8, -1.8); qs.add(SPOT6); qs.add(SPOT6.target);
const tSwap = tag('交換殺人ゲーム', { size: 64, w: 500, bg: '#8a1f2c', sx: 1.9 }); tSwap.position.set(DX, 2.9, -1.8); qs.add(tSwap);
const tTurn = tag('次は、だれの番？', { size: 62, w: 540, bg: '#14161c', sx: 1.9 }); tTurn.position.set(DX, 2.9, -1.8); qs.add(tTurn);

// ---------- shots ----------
const ALL = [tGame, tDraw, tCouple, tMove, tNeighbors, tDoubt, tWho, tNext, t2019, tBuzz, tSwap, tTurn];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SLIPS1.forEach(s => s.visible = false); HEARTS2.forEach(h => h.visible = false); EYES.forEach(e => e.visible = false); CAL.forEach(c => c.visible = false); CARD6.visible = false; KEY.visible = false; SPOT6.intensity = 0; }

function shotMeeting(t, quiz = 0) { // 1段目 0〜9：住民会で始まった、ちょっとしたゲーム。紙に名前を書いて、箱から1枚ずつ引く（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.15;
  MEET.forEach((p, i) => { p.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 5 + i) * (t < 4.2 ? 0.15 : 0); p.userData.head.rotation.x = 0.3; });
  SLIPS1.forEach((s, i) => { s.visible = true; const k = quiz ? 0.5 : ((t * 0.35 + i / 6) % 1); const fromX = -1.6 + (i % 4) * 1.05, fromZ = -2.6 + (i < 3 ? -0.6 : 0.6);
    s.position.set(lerp(fromX, 0, ease(k)), 0.84 + Math.sin(k * Math.PI) * 0.6, lerp(fromZ, -2.6, ease(k))); s.rotation.set(-Math.PI / 2 + Math.sin(k * Math.PI) * 1.2, 0, i); });
  if (t > 4.4 && !quiz) { MEET[5].userData.arms[1].rotation.x = -2.2; }
  if (!quiz) { tGame.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tGame.visible = false; tDraw.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.4, 1.9, u), lerp(3.8, 3.6, u), lerp(1.6, 1.1, u), 0, 1.0, -2.6, 58);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、年の差婚の新婚夫婦。買ったばかりのマンションに引っ越してきた
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.35;
  wife2.userData.arms[1].rotation.x = -0.4; hus2.userData.arms[0].rotation.x = -0.4;
  HEARTS2.forEach((h, i) => { h.visible = t < 4.2; const k = (t * 0.4 + i * 0.2) % 1; h.position.set(AX - 0.6 + i * 0.3, 2.0 + k * 0.5, -1.7); });
  if (t > 4.2) { hus2.userData.arms[1].rotation.x = -2.2; KEY.visible = true; KEY.position.set(AX + 0.78, 2.35 + Math.sin(t * 3) * 0.04, -1.5); KEY.rotation.z = Math.sin(t * 4) * 0.4; wife2.userData.arms.forEach(a => a.rotation.x = -1.0); } else KEY.visible = false;
  tCouple.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCouple.visible = false; tMove.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.4, 0.2, u), lerp(1.8, 1.7, u), lerp(3.0, 2.5, u), AX, 1.4, -1.8, 58);
  return qs;
}
function shotBuilding(t) { // 3段目 17〜25：同じマンションに住む、年齢も仕事もバラバラな人々。誰もが、隣人を疑い始める
  base(); S.aim(BX, -9); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#05060a');
  SIL.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.8 + i * 1.3) * 0.6; });
  if (t > 4.2) EYES.forEach((e, i) => { const [x, y] = WINP[(i * 2) % WINP.length]; e.visible = true; e.userData.pop((t - 4.4 - i * 0.18) / 0.3); e.position.set(x + 0.55, y + 1.0, -8.2); });
  tNeighbors.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNeighbors.visible = false; tDoubt.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.0, 0.6, u), lerp(4.0, 5.0, u), lerp(6.0, 4.6, u), BX, 5.4, -9, 62);
  return qs;
}
function shotBoard(t) { // 4段目 25〜33：紙に書かれていたのは、消えてほしい人の名前。そして、書かれた人が次々と事件に
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.45, '#0a0608');
  wife4.userData.arms[0].rotation.x = t > 4.2 ? -1.0 : 0; wife4.userData.head.rotation.x = -0.15;
  hus4.position.x = CX - 0.05 + (t > 4.2 ? 0.1 : 0); hus4.userData.head.rotation.y = t > 4.2 ? 0.5 : 0;
  if (t > 4.2) { S.spot.intensity = 30; S.spot.position.set(CX, 4.5, -1); S.spot.target.position.set(CX + 0.6, 2, -3.8); }
  tWho.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWho.visible = false; tNext.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.9, 0.7, u), lerp(2.8, 2.7, u), lerp(2.2, 1.6, u), CX, 1.6, -3.4, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2019年の日本のドラマ。半年間・全20話。タイトルは流行語大賞にノミネート
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  CAL.forEach((c, i) => { if (t > 1.0 + i * 0.35 && t < 4.2) { c.visible = true; c.userData.pop((t - 1.0 - i * 0.35) / 0.3); } });
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t2019.visible = false; tBuzz.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.6, 4.8, u), TX, 2.8, -3.4, 58);
  return qs;
}
function shotBox(t) { // 6段目 42〜49（決め手）：始まったのは、交換殺人ゲーム。タイトルは、順番を告げる言葉
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.35; S.darken(0.75, '#05050a'); SPOT6.intensity = 40;
  const turn = Math.floor(t * 1.4) % 6; HANDS.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = 0); p.userData.head.rotation.x = 0.35; });
  HANDS[turn].userData.arms[1].rotation.x = -1.0;
  CARD6.visible = true; const a = turn / 6 * Math.PI * 2; CARD6.position.set(DX + Math.sin(a) * 0.9, 1.6 + Math.sin(t * 3) * 0.05, -1.8 + Math.cos(a) * 0.9); CARD6.rotation.y = a;
  tSwap.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tSwap.visible = false; tTurn.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.3, u), lerp(4.6, 4.3, u), lerp(2.2, 1.8, u), DX, 1.0, -1.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（集会室に戻る）
  shotMeeting(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.15, 0.6, d); S.darken(0.4 * d, '#1a1020');
  const k = ease(t / 7);
  look(lerp(1.9, 1.6, k), 3.6, lerp(1.1, 0.7, k), 0, 1.0, -2.6, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotMeeting(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotBuilding },
  { a: 25, b: 33, f: shotBoard },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotBox },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '住民会で始まった、<br>ちょっとしたゲーム。'],
  [5.6, 9.0, '紙に名前を書いて、<br>箱から1枚ずつ引く。'],
  [9.2, 13.2, '主人公は、<br>年の差婚の新婚夫婦。'],
  [13.2, 17.0, '買ったばかりの<br>マンションに引っ越してきた。'],
  [17.2, 21.0, '同じ建物に住む、年齢も<br>仕事もバラバラな人々。'],
  [21.0, 25.0, '誰もが、隣人を<br>疑い始める。'],
  [25.2, 29.0, '紙に書かれていたのは、<br>消えてほしい人の名前。'],
  [29.0, 33.0, 'そして、書かれた人が<br>次々と事件に。'],
  [33.2, 37.4, '2019年の日本のドラマ。<br>半年間、全20話。'],
  [37.4, 41.8, 'タイトルは、流行語大賞に<br>ノミネートされた。'],
  [42.2, 45.4, '始まったのは、<br>交換殺人ゲーム。'],
  [45.4, 49.0, 'タイトルは、<br>順番を告げる言葉。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>あなたの番です。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q078', v2: true, answer: 'あなたの番です',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 7878,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '住民会': 'じゅうみんかい', '始まった': 'はじまった', '紙': 'かみ', '名前': 'なまえ', '書いて': 'かいて', '箱': 'はこ', '1枚ずつ': 'いちまいずつ', '引く': 'ひく', '主人公': 'しゅじんこう', '年の差婚': 'としのさこん', '新婚夫婦': 'しんこんふうふ', '買った': 'かった', '引っ越して': 'ひっこして', '同じ': 'おなじ', '建物': 'たてもの', '住む': 'すむ', '年齢': 'ねんれい', '仕事': 'しごと', '人々': 'ひとびと', '誰もが': 'だれもが', '隣人': 'りんじん', '疑い始める': 'うたがいはじめる', '書かれて': 'かかれて', '消えて': 'きえて', '人': 'ひと', '書かれた': 'かかれた', '次々と': 'つぎつぎと', '事件': 'じけん', '2019年': 'にせんじゅうきゅうねん', '日本': 'にほん', '半年間': 'はんとしかん', '全20話': 'ぜんにじゅうわ', '流行語大賞': 'りゅうこうごたいしょう', '交換殺人': 'こうかんさつじん', '順番': 'じゅんばん', '告げる': 'つげる', '言葉': 'ことば', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '番': 'ばん', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n住民会で始まった、ちょっとしたゲーム。紙に名前を書いて、箱から1枚ずつ引く。主人公は、年の差婚の新婚夫婦。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'ネトフリ', 'ドラマ好き', 'ミステリー'],
  },
});
applyQuizCards({ answer: 'あなたの番です', info: 'Hulu・Netflix｜日本のドラマ・全20話', answerSize: 112 });
