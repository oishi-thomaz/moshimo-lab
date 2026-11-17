import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSuit, makeSweat, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeShelf, makeCounter } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも妻のお小遣いも、夫と同じ額だったら？（皮肉回・台本 S102・図星／男と女のもしも）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。男叩きが続いたので女叩き（30〜40代の妻。若い女性は笑われる側にしない）、後半で丸投げの夫に返す両叩き
// 数字は使わない（3万円・8,000円は筋の中の額。お小遣いの平均の調査は出さない）。実在の店・コスメのブランドは出さない。お札は架空の色

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#e0d6cc', ground: '#a8988a' }); hemi.intensity = 1.3;
const TSUMA = makeWoman({ shirt: '#b8687a', hair: '#4a3022', pants: '#3a3f4e', scale: 0.97 }); S.add(TSUMA);
const OTTO = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(OTTO);
const sweatT = makeSweat(); TSUMA.userData.head.add(sweatT);
const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);

// 大きな財布（アップ用）
const WAL = new THREE.Group(); { const b = box(1.6, 1.0, 0.16, mat('#c8486a')); WAL.add(b); const inner = box(1.5, 0.9, 0.05, mat('#f4e8ec')); inner.position.z = 0.09; WAL.add(inner); } S.add(WAL);
const BILLS = []; for (let i = 0; i < 12; i++) { const b = new THREE.Group(); const p = box(0.5, 0.9, 0.012, mat(['#c8b07a', '#d8c898', '#b8a06a'][i % 3])); b.add(p); const w = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), mat('#f4ecd8')); w.position.set(0, 0.18, 0.008); b.add(w); const st = box(0.36, 0.06, 0.014, mat('#8a6a3a')); st.position.set(0, -0.25, 0.002); b.add(st); S.add(b); BILLS.push(b); }
const sanman = label('3万円', { w: 512, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(sanman);
const shu = label('シュッ', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(shu);
const sparkA = makeSparkles(90, 0.06, 0xffffff); S.add(sparkA.points); sparkA.init([[0, 1.55, -0.35]], 0.6, 0.6);
function walletAt(x, y, z, s, n) { WAL.visible = true; WAL.position.set(x, y, z); WAL.scale.setScalar(s); BILLS.forEach((b, i) => { b.visible = i < n; const a = n > 1 ? (i / (n - 1) - 0.5) : 0; b.position.set(x + a * 1.1 * s, y + 0.55 * s - Math.abs(a) * 0.12 * s, z + 0.14 * s + i * 0.004); b.scale.setScalar(s); b.rotation.set(0, 0, -a * 0.5); }); }

// ---------- A：コスメ売り場（原点） ----------
const roomA = room({ x: 0, w: 10, d: 7, h: 3.4, wall: '#f6eef0', floor: '#e4dcd8' });
const SHC = makeShelf({ w: 4.0, h: 2.0, colors: ['#f2a0b8', '#e85a7a', '#f6d0dc', '#c88ae0', '#ffffff'], rows: 4, seed: 9 }); SHC.position.set(-1.5, 0, -3.1); S.add(SHC);
const REGC = makeTable({ w: 1.8, d: 0.7, h: 1.0, color: '#f4f0f2' }); REGC.position.set(0.8, 0, -1.6); S.add(REGC);
const REGM = box(0.5, 0.32, 0.4, mat('#3a4050')); REGM.position.set(1.2, 1.18, -1.65); S.add(REGM);
const COSME = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 10), mat(['#e85a7a', '#f2c0d0', '#c88ae0', '#f4f4f2'][i])); c.position.set(0.3 + i * 0.13, 1.1, -1.5); S.add(c); COSME.push(c); }
const STAFF = makeWoman({ shirt: '#f4f4f4', hair: '#2a1a14' }); STAFF.position.set(0.9, 0, -2.4); S.add(STAFF);
const tarinai = label('足りない', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(tarinai);

// ---------- B：家（x=60）。台所とダイニング ----------
const BX = 60;
const roomB = room({ x: BX, w: 10, d: 7, h: 3.0, wall: '#efe6d6', floor: '#c9b8a0' });
const CNT = makeCounter(); CNT.position.set(BX - 1.6, 0, -3.0); S.add(CNT);
const TBL = makeTable({ w: 1.6, d: 0.9, h: 0.72, color: '#c9a77a' }); TBL.position.set(BX + 0.6, 0, -1.2); S.add(TBL);
const fuman = label('俺は月3万、妻は使い放題', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.55 }); S.add(fuman);
const BENTO = new THREE.Group(); { const b = box(0.5, 0.12, 0.34, mat('#2a2e38')); BENTO.add(b); const rice = box(0.22, 0.02, 0.28, mat('#fbfbf6')); rice.position.set(-0.12, 0.07, 0); BENTO.add(rice); ['#f0a030', '#5ab04a', '#e8503a'].forEach((c, i) => { const o = box(0.08, 0.04, 0.08, mat(c)); o.position.set(0.06 + (i % 2) * 0.1, 0.08, -0.07 + i * 0.07); BENTO.add(o); }); } S.add(BENTO);
const lunch = label('ランチ → お弁当', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(lunch);
const CALC = new THREE.Group(); { const b = box(0.3, 0.04, 0.4, mat('#3a3e48')); CALC.add(b); const sc = box(0.24, 0.01, 0.1, mat('#bfe0a8')); sc.position.set(0, 0.025, -0.12); CALC.add(sc); for (let i = 0; i < 9; i++) { const k = box(0.06, 0.02, 0.05, mat('#e8e8e8')); k.position.set(-0.08 + (i % 3) * 0.08, 0.03, 0.0 + Math.floor(i / 3) * 0.08); CALC.add(k); } } S.add(CALC);
const hiru = label('夫のお昼代…', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.0 }); S.add(hiru);
const nokori = label('残り 8,000円', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(nokori);
const sukunai = label('3万円って 少ない…', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.25 }); S.add(sukunai);

// ---------- C：家計簿（x=120） ----------
const CX = 120;
flat(30, 20, '#6a5a50', CX, -2);
const BACKC = box(14, 6, 0.2, mat('#5a4a42')); BACKC.position.set(CX, 3, -4); S.add(BACKC);
const KAKEIBO = makeDoc({ title: '家計簿', rows: ['子ども', '食費', '日用品', '妻'], head: '#3a8a5a', w: 1.6, h: 1.9 }); KAKEIBO.position.set(CX, 1.3, -0.4); S.add(KAKEIBO);
const BARS = []; ['#5a9ae8', '#f0a030', '#9aa0aa', '#e85a7a'].forEach((c, i) => { const b = box(1, 0.16, 0.02, mat(c)); S.add(b); BARS.push(b); });
const ippou = label('一方、夫', { w: 512, size: 110, color: '#fff', bg: 'rgba(58,66,86,.97)', sx: 0.75 }); S.add(ippou);
const hotondo = label('ほとんど 子どもと食費', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.5 }); S.add(hotondo);
const makase = label('全部 妻に任せきり', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.25 }); S.add(makase);
const MEKAKUSHI = new THREE.Group(); { const band = box(0.46, 0.13, 0.42, mat('#2a2e38')); MEKAKUSHI.add(band); } OTTO.userData.head.add(MEKAKUSHI); MEKAKUSHI.position.set(0, 0.27, 0);
const mekakushi = label('月3万円の 目隠し', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.25 }); S.add(mekakushi);
const omosa = label('妻：3万円の少なさ ／ 夫：家計の重さ', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(omosa);

const LABELS = [sanman, shu, tarinai, fuman, lunch, hiru, nokori, sukunai, ippou, hotondo, makase, mekakushi, omosa];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = false; }
function reset() {
  clearP(TSUMA); clearP(OTTO); LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatT.userData.set(0); sweatO.userData.set(0);
  WAL.visible = false; WAL.rotation.set(0, 0, 0); BILLS.forEach(b => b.visible = false); BENTO.visible = false; BENTO.scale.setScalar(1); BENTO.rotation.set(0, 0, 0); CALC.visible = false; KAKEIBO.visible = false; BARS.forEach(b => b.visible = false); MEKAKUSHI.visible = false; STAFF.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function walCam(u = 0) { look(lerp(0.1, 0.0, u), lerp(1.45, 1.42, u), lerp(4.1, 3.8, u), 0, 1.4, -0.35, 50); }
function shot0(t) { // 0秒＝サムネ：妻の財布の中身が、夫と同じ 3万円 にシュッと減る
  reset(); lift(0); STAFF.visible = false; const k = easeOut(clamp((t - TP) / 0.3)); walletAt(0, 0.7, -0.4, 1, Math.round(lerp(12, 3, k)));
  if (t > TP) { sparkA.set(clamp((t - TP) / 0.7)); say(shu, t, TP, 0.78, 1.25, 0.0, 0.36); }
  if (t > TP + 0.25) say(sanman, t, TP + 0.25, 0, 0.75, 0.0, 0.55);
  walCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // コスメ売り場のレジで、財布を開いた妻が固まる
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(0.3, 0, -0.7); TSUMA.rotation.y = 0.35; TSUMA.userData.arms.forEach((a, i) => a.rotation.set(-1.2, 0, i ? 0.3 : -0.3));
  TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.95, 0.55); TSUMA.localToWorld(v); walletAt(v.x, v.y, v.z, 0.25, 3); WAL.rotation.y = TSUMA.rotation.y;
  if (t > d * 0.45) { sweatT.userData.set(1, t); say(tarinai, t, d * 0.45, 0.3, 2.1, -0.7, 0.5); }
  look(0.6, 1.7, 1.7, 0.4, 1.4, -1.0, 50);
  return S;
}
function homeCam(u = 0) { look(BX + lerp(0.9, 0.7, u), 1.8, lerp(2.4, 2.1, u), BX + 0.4, 1.2, -1.3, 50); }
function sFuman(t, d) { // 夫たちの不満から。俺は月3万、妻は家計から使い放題
  reset(); lift(120); OTTO.visible = true; OTTO.position.set(BX + 0.3, 0, -0.5); OTTO.rotation.y = 0.2; OTTO.userData.arms[1].rotation.set(-1.6, 0, 0.3); OTTO.userData.head.rotation.x = -0.1;
  if (t > 0.4) say(fuman, t, 0.4, BX + 0.3, 2.2, -0.6, 1.2);
  look(BX + 0.5, 1.75, 2.5, BX + 0.3, 1.5, -0.6, 50);
  return S;
}
function sBento(t, d) { // 1日目。妻が、ママ友とのランチを、手作りのお弁当に変える
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(BX - 0.8, 0, -1.7); TSUMA.rotation.y = 0.3; TSUMA.userData.arms.forEach((a, i) => a.rotation.set(-1.25, 0, i ? 0.3 : -0.3));
  TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.0, 0.55); TSUMA.localToWorld(v); BENTO.visible = true; BENTO.position.copy(v); BENTO.rotation.y = 0.3; BENTO.scale.setScalar(1.2);
  if (t > d * 0.4) say(lunch, t, d * 0.4, BX - 0.8, 2.12, -1.7, 0.9);
  setHud('お小遣い 3万円', '1日目', 1);
  look(BX - 0.4, 1.8, 0.9, BX - 0.75, 1.35, -1.7, 50);
  return S;
}
function sCalc(t, d) { // 1週間後。妻が、夫のお昼代を、初めて自分のことのように計算する
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(BX + 0.6, 0, -2.0); poseSit(TSUMA); TSUMA.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); TSUMA.userData.head.rotation.x = 0.3;
  CALC.visible = true; CALC.position.set(BX + 0.6, 0.74, -1.4);
  if (t > d * 0.4) say(hiru, t, d * 0.4, BX + 0.6, 2.1, -2.0, 0.8);
  setHud('お小遣い 3万円', '1週間後', 1);
  homeCam(ease(clamp(t / d)));
  return S;
}
function sNokori(t, d) { // 2週間後。財布の残りは、8,000円
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(BX + 0.6, 0, -2.0); poseSit(TSUMA); TSUMA.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); sweatT.userData.set(1, t);
  walletAt(BX + 0.6, 0.9, -1.35, 0.35, 1); WAL.rotation.x = -0.4;
  if (t > d * 0.35) say(nokori, t, d * 0.35, BX + 0.6, 2.1, -2.0, 0.8);
  setHud('お小遣い 3万円', '2週間後', 1);
  homeCam(1);
  return S;
}
function sSukunai(t, d) { // 妻は気づく。3万円って、こんなに少なかったんだ
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(BX + 0.6, 0, -2.0); poseSit(TSUMA); TSUMA.userData.head.rotation.x = 0.35; TSUMA.userData.arms.forEach(a => a.rotation.set(-0.6, 0, 0));
  walletAt(BX + 0.6, 0.9, -1.35, 0.35, 1); WAL.rotation.x = -0.4;
  if (t > d * 0.4) say(sukunai, t, d * 0.4, BX + 0.6, 2.0, -2.0, 0.95);
  look(BX + 0.6, 1.75, 1.4, BX + 0.6, 1.3, -1.8, 50);
  return S;
}
function ottoDesk() { OTTO.visible = true; OTTO.position.set(BX + 0.6, 0, -2.0); poseSit(OTTO); OTTO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); }
function sIppou(t, d) { // 一方、夫
  reset(); lift(120); ottoDesk(); KAKEIBO.visible = true; KAKEIBO.position.set(BX + 0.6, 0.76, -1.35); KAKEIBO.rotation.set(-Math.PI / 2 + 0.3, 0, 0); KAKEIBO.scale.setScalar(0.3);
  say(ippou, t, 0.15, BX + 0.6, 2.15, -2.0, 0.6);
  homeCam(ease(clamp(t / d)));
  return S;
}
function sKakeibo(t, d) { // 家計簿を初めて開いて、固まる
  reset(); lift(120); ottoDesk(); KAKEIBO.visible = true; KAKEIBO.position.set(BX + 0.6, 0.76, -1.35); KAKEIBO.rotation.set(-Math.PI / 2 + 0.3, 0, 0); KAKEIBO.scale.setScalar(0.3);
  if (t > d * 0.4) sweatO.userData.set(1, t); OTTO.userData.head.rotation.x = 0.3;
  look(BX + 0.6, 1.7, 0.1, BX + 0.6, 1.1, -1.8, 50);
  return S;
}
function kbCam(u = 0) { look(CX + lerp(0.2, 0, u), 1.4, lerp(3.3, 3.0, u), CX, 1.25, -0.4, 50); }
function bars(k) { const W = [0.62, 0.55, 0.25, 0.12]; BARS.forEach((b, i) => { b.visible = true; const w = Math.max(0.01, W[i] * easeOut(clamp(k * 1.5 - i * 0.15))); b.scale.x = w; b.position.set(CX - 0.08 + w / 2, 1.3 + 0.55 - 0.36 * (i + 1) + 0.1, -0.38); }); }
function sHotondo(t, d) { // 妻が使っていたと思っていたお金は、ほとんど子どもと食費だった
  reset(); lift(200); KAKEIBO.visible = true; KAKEIBO.position.set(CX, 1.3, -0.4); KAKEIBO.rotation.set(0, 0, 0); KAKEIBO.scale.setScalar(1);
  bars(clamp((t - 0.4) / 1.6));
  if (t > d * 0.6) say(hotondo, t, d * 0.6, CX, 2.12, 0.3, 1.2);
  kbCam(ease(clamp(t / d)));
  return S;
}
function sMakase(t, d) { // 夫も気づく。家のお金を、全部妻に任せきりだった
  reset(); lift(120); ottoDesk(); OTTO.userData.head.rotation.x = 0.4; OTTO.userData.arms.forEach(a => a.rotation.set(-2.0, 0, 0.3)); sweatO.userData.set(1, t);
  KAKEIBO.visible = true; KAKEIBO.position.set(BX + 0.6, 0.76, -1.35); KAKEIBO.rotation.set(-Math.PI / 2 + 0.3, 0, 0); KAKEIBO.scale.setScalar(0.3);
  if (t > d * 0.4) say(makase, t, d * 0.4, BX + 0.6, 2.15, -2.0, 1.0);
  homeCam(1);
  return S;
}
function sKekka(t, d) { // 結果：同じお小遣いでやりくりして、妻は3万円の少なさを、夫は家計の重さを、初めて知った
  reset(); lift(120); TSUMA.visible = true; TSUMA.position.set(BX + 0.0, 0, -1.2); TSUMA.rotation.y = 0.5; OTTO.visible = true; OTTO.position.set(BX + 1.2, 0, -1.3); OTTO.rotation.y = -0.5;
  KAKEIBO.visible = true; KAKEIBO.position.set(BX + 0.6, 1.3, -1.0); KAKEIBO.rotation.set(-0.2, 0, 0); KAKEIBO.scale.setScalar(0.35);
  TSUMA.userData.arms[1].rotation.set(-1.3, 0, -0.3); OTTO.userData.arms[0].rotation.set(-1.3, 0, 0.3);
  if (t > d * 0.55) say(omosa, t, d * 0.55, BX + 0.6, 2.45, -1.2, 1.5);
  setTop('結果', '初めて知った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(BX + 0.6, lerp(1.8, 2.0, u), lerp(2.6, 3.4, u), BX + 0.6, 1.35, -1.2, 50);
  return S;
}
function sMekakushi(t, d) { // 夫のお小遣いは、家のお金を知らずにいられる、月3万円の目隠しだったのかもしれない
  reset(); lift(120); OTTO.visible = true; OTTO.position.set(BX + 0.3, 0, -0.8); OTTO.rotation.y = 0.15; const k = clamp((t - d * 0.4) / 0.4);
  MEKAKUSHI.visible = k > 0; MEKAKUSHI.position.y = 0.27 + (1 - easeOut(k)) * 0.5;
  if (k > 0.5) say(mekakushi, t, d * 0.4 + 0.2, BX + 0.3, 2.1, -0.8, 0.9);
  walletAt(BX + 0.9, 1.0, -0.4, 0.25, 3);
  look(BX + 0.5, 1.75, 1.6, BX + 0.4, 1.55, -0.7, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); STAFF.visible = false; walletAt(0, 0.7, -0.4, 1, 3); sanman.visible = true; sanman.position.set(0, 0.75, 0.0); sanman.userData.size(0.55); walCam(0); return S; }

const NARR = { 'コスメ': 'コスメ', '売り場': 'うりば', '財布': 'さいふ', '開いた': 'ひらいた', '妻': 'つま', '固まる': 'かたまる', '夫': 'おっと', '不満': 'ふまん', '俺': 'おれ', '月3万': 'つきさんまん', '家計': 'かけい', '使い放題': 'つかいほうだい', '1日目': 'いちにちめ', 'ママ友': 'ままとも', '手作り': 'てづくり', 'お弁当': 'おべんとう', '変える': 'かえる', '1週間後': 'いっしゅうかんご', 'お昼代': 'おひるだい', '初めて': 'はじめて', '自分': 'じぶん', '計算': 'けいさん', '2週間後': 'にしゅうかんご', '残り': 'のこり', '8,000円': 'はっせんえん', '気づく': 'きづく', '3万円': 'さんまんえん', '少なかった': 'すくなかった', '一方': 'いっぽう', '家計簿': 'かけいぼ', '子ども': 'こども', '食費': 'しょくひ', '家': 'いえ', '任せきり': 'まかせきり', '結果：': '結果、', '少なさ': 'すくなさ', '重さ': 'おもさ', '知った': 'しった', 'お小遣い': 'おこづかい', '目隠し': 'めかくし', '妥当': 'だとう' };
const P = planTimes([
  ['コスメ売り場のレジで、<br>財布を開いた妻が固まる。', sKatamaru],
  ['夫たちの不満から。俺は月3万、<br>妻は家計から使い放題。', sFuman],
  ['1日目。妻が、ママ友との<br>ランチを、', (t, d) => sBento(t, 2 * d)],
  ['手作りのお弁当に変える。', (t, d) => sBento(t + d, 2 * d)],
  ['1週間後。妻が、夫のお昼代を、', (t, d) => sCalc(t, 2 * d)],
  ['初めて自分のことのように<br>計算する。', (t, d) => sCalc(t + d, 2 * d)],
  ['2週間後。財布の残りは、<br>8,000円。', sNokori],
  ['妻は気づく。3万円って、<br>こんなに少なかったんだ。', sSukunai],
  ['一方、夫。', sIppou],
  ['家計簿を初めて開いて、固まる。', sKakeibo],
  ['妻が使っていたと思っていた<br>お金は、', (t, d) => sHotondo(t, 2 * d)],
  ['ほとんど子どもと<br>食費だった。', (t, d) => sHotondo(t + d, 2 * d)],
  ['夫も気づく。家のお金を、<br>全部妻に任せきりだった。', sMakase],
  ['結果：同じお小遣いで<br>やりくりして、', (t, d) => sKekka(t, 3 * d)],
  ['妻は3万円の少なさを、<br>夫は家計の重さを、', (t, d) => sKekka(t + d, 3 * d)],
  ['初めて知った。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['夫のお小遣いは、家のお金を<br>知らずにいられる、', (t, d) => sMekakushi(t, 2 * d)],
  ['月3万円の目隠し<br>だったのかもしれない。', (t, d) => sMekakushi(t + d, 2 * d)],
  ['夫のお小遣い、<br>月いくらが妥当？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0693',
    v2: true,
    tt: 'main',
    hookLine: '妻の財布の中身が、夫と同じ 3万円 にシュッと減る。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも妻のお小遣いも、夫と同じ額だったら？',
    titleHtml: 'もしも妻の<br>お小遣いも、<br>夫と同じ額<br>だったら？',
    mood: 'tension', seed: 693, hits: [TP, P.at(13), P.at(17)], risers: [P.at(8)], impacts: [P.at(6, 0.6), P.at(11, 0.5)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.3], [P.at(6, 0.5), 'alarm'], [P.at(9, 0.6), 'meter', 0.3], [P.at(17, 0.5), 'poof']],
    narr: NARR,
    ask: '夫のお小遣い、月いくらが妥当？',
    caption: 'もしも妻のお小遣いも、夫と同じ額だったら？\n\nコスメ売り場のレジで、財布を開いた妻が固まる。\n夫たちの不満から。俺は月3万、妻は家計から使い放題。\n1日目。妻が、ママ友とのランチを、手作りのお弁当に変える。\n1週間後。妻が、夫のお昼代を、初めて自分のことのように計算する。\n2週間後。財布の残りは、8,000円。\n妻は気づく。3万円って、こんなに少なかったんだ。\n一方、夫。\n家計簿を初めて開いて、固まる。\n妻が使っていたと思っていたお金は、ほとんど子どもと食費だった。\n夫も気づく。家のお金を、全部妻に任せきりだった。\n\n結果：同じお小遣いでやりくりして、妻は3万円の少なさを、夫は家計の重さを、初めて知った。\n夫のお小遣いは、家のお金を知らずにいられる、月3万円の目隠しだったのかもしれない。\n\n夫のお小遣い、月いくらが妥当？ コメントで教えて。\n\n※風刺ネタです。妻のお小遣いが夫と同じになるのは、もしもの設定です。金額は物語の中の額で、登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', 'お小遣い', '夫婦', '家計'],
    endStats: [['妻のお小遣い', '夫と同じ 3万円', 'もしもの設定'], ['初めて知ったのは', '少なさと 家計の重さ', 'もしもの結果'], ['夫のお小遣いの正体', '月3万円の目隠し', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
