import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { porch, canopy, DOORSTEP, makeParcel, makeVan, makeCourier, carryPose, makePile, setPorchEnv } from '../scenes/delivery.js';
import { makeDoc, makeMark } from '../scenes/hanko.js';
import { poseClear, makeSweat } from '../scenes/office.js';

// もしも宅配の再配達が有料になったら？（皮肉回・台本 S32・図星／大人の本音）
// 2026/11/03 ゆうと承認。plan/reserve.txt の 0030（説明型）を皮肉で作り直し。元ネタ：Togetter で燃える 居留守・再配達 の話
// 数字（裏取り済み）：宅配便の再配達率 約8.4%（2025年4月）・宅配便の取扱個数 年間約50億個（令和5年度）
//  国土交通省「宅配便の再配達率に関するサンプル調査」（2025年6月23日公表）
//  約4億個は 50億×8.4% の単純計算（画面に（単純計算）と出す）
// 有料にするのは もしもの設定。配送車・制服は架空（実在の宅配会社の色・ロゴに似せない）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a';
const S = porch;
const DX = DOORSTEP.x, DZ = DOORSTEP.z;

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
// 追加料金のシール（箱の前に貼る赤い札）
function makeSticker(text = '追加料金') { const l = label(text, { w: 768, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); return l; }

const BOX = makeParcel(0.9, 0.62, 0.7); S.add(BOX);
const STICK = makeSticker(); S.add(STICK);
const COUR = makeCourier(3); S.add(COUR); const sweatC = makeSweat(); COUR.userData.head.add(sweatC);
const terminal = box(0.16, 0.24, 0.05, mat('#2a2e3a')); terminal.position.set(0, -0.6, 0.1); COUR.userData.arms[1].add(terminal);
const VAN = makeVan(); S.add(VAN);
// 開いた玄関（ドアの前に暗い入口を重ねる）
const doorway = box(1.02, 2.18, 0.04, new THREE.MeshBasicMaterial({ color: '#2a2018' })); doorway.position.set(0, 1.3, -1.9); S.add(doorway);
const RES = makeMan({ shirt: '#8a9aa8', hair: '#1d1a19' }); S.add(RES); // 居留守の人
const towel = box(0.46, 0.14, 0.44, mat('#ffffff')); towel.position.set(0, 0.5, 0); RES.userData.head.add(towel);
const RES2 = makeWoman({ shirt: '#f2c0d0', hair: '#5a3a28' }); S.add(RES2); // 寝起きの人（パジャマ）
const pinpon = label('ピンポーン', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(pinpon);
const dots = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.7 }); S.add(dots);
const zaitaku = label('家にいる', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 0.95 }); S.add(zaitaku);
const shitei = label('19〜21時 指定', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(shitei);
const fuzai = label('いない', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.9 }); S.add(fuzai);
const SLIP = makeDoc({ title: '再配達', rows: ['料金'], head: '#c8242c', w: 1.1, h: 0.85, cw: 384 }); S.add(SLIP);
const HMARK = makeMark('有料', { sx: 0.8 }); S.add(HMARK);
const furo = label('風呂上がり', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.2 }); S.add(furo);
const neoki = label('寝起き', { w: 512, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.9 }); S.add(neoki);
const PARCELS = []; for (let i = 0; i < 10; i++) { const p = makeParcel(0.55 + (i % 3) * 0.1, 0.36, 0.45); p.rotation.y = (i % 4) * 0.2 - 0.3; S.add(p); PARCELS.push(p); }
const STICKS = PARCELS.map(() => { const l = makeSticker(); S.add(l); return l; });
const tsumiagaru = label('追加料金が積み上がる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 2.1 }); S.add(tsumiagaru);
const nidome = label('2度行かない', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(nidome);
const owari = label('今日の配達 おわり', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.9 }); S.add(owari);
const denakatta = label('出なかっただけ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 1.5 }); S.add(denakatta);
const sparkC = makeSparkles(100, 0.18, 0xfff2c0); S.add(sparkC.points); sparkC.init([[-1.8, 2.0, 3.75]], 0.8, 1.0);

// データ用（家の横の空き地 x=40）：段ボールの山
const PX = 40;
const pfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#7a8a6a', { depthWrite: false })); pfloor.rotation.x = -Math.PI / 2; pfloor.position.set(PX, 0.03, -2); pfloor.renderOrder = -0.8; S.add(pfloor);
const PILE = makePile(S, { cols: 10, rows: 11, layers: 5, size: 0.7, x: PX, z: -4.3 }); // 11列＋赤1列＝再配達 約8.4%（12列に1列）
const RED_PILE = makePile(S, { cols: 10, rows: 1, layers: 5, size: 0.7, x: PX, z: -0.1 });
PILE.mesh.frustumCulled = false; RED_PILE.mesh.frustumCulled = false;
RED_PILE.mesh.material = new THREE.MeshLambertMaterial({ color: '#ffffff' }); { const c = new THREE.Color('#e84a4a'); for (let i = 0; i < RED_PILE.max; i++) RED_PILE.mesh.setColorAt(i, c); RED_PILE.mesh.instanceColor.needsUpdate = true; }
const L_RE = label('再配達', { w: 512, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.0 }); S.add(L_RE);

const ALL = [COUR, RES, RES2];
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  setPorchEnv('day'); canopy.visible = true;
  BOX.visible = true; BOX.position.set(DX + 0.15, DOORSTEP.y, DZ + 0.15); BOX.rotation.y = 0.1; STICK.visible = false;
  COUR.position.set(DX + 1.3, 0, DZ + 0.9); COUR.rotation.y = -0.9; sweatC.userData.set(0);
  VAN.position.set(-4.5, 0, 7.6); VAN.userData.setDoor(0);
  doorway.visible = false; RES.visible = false; RES2.visible = false; RES.position.set(DX, DOORSTEP.y, -1.6); RES2.position.set(DX + 0.5, DOORSTEP.y, -1.6); towel.visible = false;
  [pinpon, dots, zaitaku, shitei, fuzai, furo, neoki, tsumiagaru, nidome, owari, denakatta, L_RE].forEach(l => l.visible = false); SLIP.visible = false; HMARK.visible = false;
  PARCELS.forEach(p => p.visible = false); STICKS.forEach(l => l.visible = false); sparkC.set(0); PILE.setN(0); RED_PILE.setN(0);
  SLIP.userData.fill(0, ''); el.flash.style.opacity = 0;
}
const TP = 0.45;
function stickOn(t, t0, sx = 0.95) { STICK.position.set(BOX.position.x, BOX.position.y + 0.33, BOX.position.z + 0.42); const k = t - t0; STICK.visible = k > 0; STICK.userData.size(sx * (k > 0 && k < 0.15 ? 1.5 - k * 3.3 : 1)); }
function boxCam(d = 0) { look(lerp(1.0, 0.8, d), 1.55, lerp(DZ + 2.9, DZ + 3.2, d), DX + 0.15, 1.05, DZ - 0.1, 52); }
function shot0(t) { // 0秒＝サムネ：玄関前の段ボールに、追加料金 の赤いシールがバン
  reset(); lift(0); COUR.userData.arms[1].rotation.x = t < TP ? lerp(-0.6, -1.4, clamp(t / TP)) : -0.9;
  stickOn(t, TP); el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.3 : 0;
  boxCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // ドライバーたちの不満から。
  reset(); lift(60); COUR.position.set(DX - 0.9, 0.2, DZ - 0.1); COUR.rotation.y = Math.PI * 0.9; COUR.userData.arms[1].rotation.x = -1.6; sweatC.userData.set(clamp(t / 0.6), t);
  look(DX + 1.4, 2.0, DZ + 4.6, DX - 0.4, 1.3, DZ - 0.4, 52);
  return S;
}
function shot2(t) { // 家にいるのに出てこない、
  reset(); lift(60); COUR.position.set(DX - 0.9, 0.2, DZ - 0.1); COUR.rotation.y = Math.PI * 0.9; COUR.userData.arms[1].rotation.x = t < 0.8 ? -2.0 : -0.4;
  pinpon.position.set(DX - 1.0, 2.4, DZ - 0.3); pop(pinpon, t, 0.2, 0.25, 1.1);
  zaitaku.position.set(-2.4, 2.6, -1.4); pop(zaitaku, t, 1.0, 0.25, 0.95);
  if (t > 1.8) { dots.position.set(DX - 0.9, 2.95, DZ - 0.1); pop(dots, t, 1.8, 0.2, 0.65); }
  look(DX - 1.0, 2.2, DZ + 6.2, DX - 1.6, 1.6, DZ - 0.6, 52);
  return S;
}
function shot3(t) { // 指定した時間にいない
  reset(); lift(60); setPorchEnv('dusk'); COUR.position.set(DX - 0.9, 0.2, DZ - 0.1); COUR.rotation.y = Math.PI * 0.9; COUR.userData.head.rotation.x = 0.25;
  shitei.position.set(DX + 0.3, 2.75, DZ + 0.2); pop(shitei, t, 0.2, 0.25, 1.25);
  fuzai.position.set(DX - 0.9, 2.2, DZ - 0.1); pop(fuzai, t, 1.2, 0.25, 0.9);
  look(DX + 1.4, 2.0, DZ + 4.6, DX - 0.4, 1.4, DZ - 0.4, 52);
  return S;
}
function shot4(t) { // ある日、宅配の再配達は有料になった
  reset(); lift(80); SLIP.visible = true; SLIP.position.set(DX + 0.2, 1.65, DZ + 0.5); SLIP.userData.fill(0, t > 1.4 ? '有料' : '');
  HMARK.position.set(DX + 0.55, 1.5, DZ + 0.6); pop(HMARK, t, 1.4, 0.15, 0.6); el.flash.style.opacity = t > 1.4 && t < 1.5 ? 0.3 : 0;
  look(DX + 0.5, 1.9, DZ + 4.2, DX + 0.2, 1.45, DZ + 0.3, 50);
  return S;
}
function pileCam(u = 0) { look(PX + 1.5, lerp(7.5, 8.2, u), lerp(8.4, 9.2, u), PX, 0.8, -2.6, 52); }
function shot5(t) { // 宅配便は年に約50億個。そのうち約8.4%が再配達
  reset(); lift(300); PILE.setN(Math.round(PILE.max * easeOut(clamp((t - 0.2) / 1.6))));
  if (t > 2.2) { RED_PILE.setN(Math.round(RED_PILE.max * easeOut(clamp((t - 2.2) / 0.8)))); L_RE.position.set(PX + 3.8, 2.6, -0.1); pop(L_RE, t, 2.6, 0.25, 1.0); }
  pileCam(ease(clamp(t / 4.5)));
  setTop(t < 2.2 ? '宅配便の取扱個数（2023年度）' : '再配達の割合（2025年4月）', t < 2.2 ? '年 約50億個' : '約8.4%', fade(t, 0.3, 4.3, 0.25), t < 2.2 ? GOLD : RED);
  return S;
}
function shot6(t) { // 単純計算で、年に約4億個を運び直している
  reset(); lift(300); PILE.setN(PILE.max); RED_PILE.setN(RED_PILE.max); L_RE.visible = true; L_RE.position.set(PX + 3.8, 2.6, -0.1); L_RE.userData.size(1.0);
  pileCam(1);
  setTop('運び直し（単純計算）', '年 約4億個', fade(t, 0.3, 4.0, 0.25), RED);
  return S;
}
function shot7(t) { // 有料の初日。
  reset(); lift(60); COUR.position.set(DX - 0.9, 0.2, DZ - 0.1); COUR.rotation.y = Math.PI * 0.9; COUR.userData.arms[1].rotation.x = -2.0;
  pinpon.position.set(DX - 1.0, 2.4, DZ - 0.3); pop(pinpon, t, 0.3, 0.25, 1.1); stickOn(1, 0);
  look(DX + 1.4, 2.0, DZ + 4.6, DX - 0.4, 1.3, DZ - 0.4, 52);
  return S;
}
function shot8(t) { // 居留守を使っていた人が、インターホンに飛びつく
  reset(); lift(60); COUR.position.set(DX - 1.0, 0.2, DZ + 0.1); COUR.rotation.y = Math.PI * 0.75; stickOn(1, 0);
  const k = easeOut(clamp((t - 0.5) / 0.4)); doorway.visible = t > 0.5; RES.visible = t > 0.5; RES.position.set(DX + 0.1, DOORSTEP.y, lerp(-2.0, -1.45, k)); RES.userData.arms[1].rotation.x = -1.4; RES.userData.arms[0].rotation.x = -1.2; RES.position.y = DOORSTEP.y + Math.sin(k * Math.PI) * 0.25;
  if (t > 1.2) { RES.userData.head.rotation.x = -0.1; }
  canopy.visible = false;
  look(DX + 1.2, 1.9, DZ + 4.2, DX - 0.2, 1.35, DZ - 0.5, 52);
  return S;
}
function shot9(t) { // 風呂上がりでも、寝起きでも、とりあえず玄関へ
  reset(); lift(60); canopy.visible = false; doorway.visible = true; stickOn(1, 0);
  if (t < 2.0) { RES.visible = true; towel.visible = true; RES.position.set(DX + 0.0, DOORSTEP.y, -1.5); RES.userData.arms[0].rotation.x = -2.6; furo.position.set(DX - 0.2, 2.6, -1.3); pop(furo, t, 0.2, 0.25, 1.1); }
  else { RES2.visible = true; RES2.position.set(DX + 0.0, DOORSTEP.y, -1.5); RES2.userData.arms[0].rotation.x = -2.5; RES2.userData.head.rotation.z = 0.2; neoki.position.set(DX - 0.2, 2.6, -1.3); pop(neoki, t, 2.0, 0.25, 0.85); }
  look(DX + 0.8, 1.8, DZ + 3.6, DX, 1.35, DZ - 0.4, 52);
  return S;
}
function shot10(t) { // ネットで買い物しすぎる人ほど、追加料金が積み上がる
  reset(); lift(60); BOX.visible = true; stickOn(1, 0); canopy.visible = false;
  const n = Math.floor(clamp((t - 0.2) / 2.6) * 10 + 0.001);
  PARCELS.forEach((p, i) => { p.visible = i < n; const col = i % 4, lay = Math.floor(i / 4); p.position.set(DX - 1.1 + col * 0.72 + (lay % 2) * 0.3, DOORSTEP.y + 0.62 * 0 + lay * 0.37, DZ + 0.75); STICKS[i].visible = p.visible; STICKS[i].userData.size(0.62); STICKS[i].position.set(p.position.x, p.position.y + 0.2, p.position.z + 0.3); });
  tsumiagaru.position.set(DX, 2.7, DZ + 0.4); pop(tsumiagaru, t, 2.2, 0.3, 1.9);
  look(DX + 0.3, 2.1, DZ + 4.6, DX, 1.2, DZ + 0.3, 52);
  return S;
}
function shot11(t) { // 一方ドライバーは、同じ家に2度行かなくてよくなる
  reset(); lift(80); BOX.visible = false; COUR.position.set(-2.4 + t * 0.4, 0.12, 3.75); COUR.rotation.y = 0.9; walk(COUR, t, 6, 0.35); VAN.position.set(-4.5, 0, 7.6);
  nidome.position.set(-1.8, 2.45, 3.75); pop(nidome, t, 0.8, 0.3, 1.25); sparkC.set(clamp((t - 0.8) / 3));
  look(-0.4, 2.0, 7.4, -1.6, 1.4, 3.8, 52);
  return S;
}
function shot12(t) { // 1日の配達が、夕方に終わるようになる
  reset(); lift(80); setPorchEnv('dusk'); BOX.visible = false; VAN.position.set(-4.5 + t * 2.2, 0, 7.6); COUR.visible = false;
  owari.position.set(VAN.position.x + 0.5, 3.4, 7.6); pop(owari, t, 0.8, 0.3, 1.8);
  look(VAN.position.x + 1.5, 2.4, 13.0, VAN.position.x + 0.5, 1.6, 7.6, 52);
  return S;
}
function shot13(t) { // 結果：有料になって、家にいるのに出ない人がいなくなった
  reset(); lift(60); canopy.visible = false; doorway.visible = true; RES.visible = true; RES.position.set(DX + 0.1, DOORSTEP.y, -1.4); carryPose(RES, 1); BOX.position.set(DX + 0.1, DOORSTEP.y + 0.72, -0.95);
  COUR.position.set(DX + 0.6, 0.2, DZ + 0.6); COUR.rotation.y = -2.6; COUR.userData.arms[0].rotation.x = -0.4;
  const u = ease(clamp(t / 6.0)); look(DX + lerp(1.2, 2.0, u), lerp(1.9, 2.6, u), DZ + lerp(4.2, 6.4, u), DX + 0.1, 1.35, DZ - 0.4, 52);
  setTop('結果', '出ない人ゼロ', fade(t, 0.3, 5.9, 0.25), GOLD);
  return S;
}
function shot14(t) { // 届かなかったんじゃない。出なかっただけだったのかもしれない
  reset(); lift(60); canopy.visible = false; doorway.visible = true; RES.visible = true; RES.position.set(DX + 0.1, DOORSTEP.y, -1.4); carryPose(RES, 1); BOX.position.set(DX + 0.1, DOORSTEP.y + 0.72, -0.95);
  RES.userData.head.rotation.x = 0.25;
  if (t > 2.4) { denakatta.position.set(DX + 0.1, 2.75, -1.2); pop(denakatta, t, 2.4, 0.3, 1.45); }
  look(DX + 1.0, 1.9, DZ + 3.8, DX + 0.1, 1.45, DZ - 0.4, 52);
  return S;
}
function shot15(t) { // 質問。最後は冒頭と同じ構図（追加料金のシールが貼られた箱）
  reset(); lift(0); COUR.userData.arms[1].rotation.x = -0.9; stickOn(1, 0);
  boxCam(0);
  return S;
}

const SUBS = [
  [3.0, 5.2, 'ドライバーたちの<br>不満から。'],
  [5.3, 8.0, '家にいるのに<br>出てこない、'],
  [8.1, 10.8, '指定した時間にいない。'],
  [10.9, 14.2, 'ある日、宅配の再配達は<br>有料になった。'],
  [14.3, 18.8, '宅配便は年に約50億個。<br>そのうち約8.4%が再配達。'],
  [18.9, 23.0, '単純計算で、年に約4億個を<br>運び直している。'],
  [23.1, 25.4, '有料の初日。'],
  [25.5, 29.4, '居留守を使っていた人が、<br>インターホンに飛びつく。'],
  [29.5, 33.6, '風呂上がりでも、寝起きでも、<br>とりあえず玄関へ。'],
  [33.7, 37.8, 'ネットで買い物しすぎる人ほど、<br>追加料金が積み上がる。'],
  [37.9, 42.0, '一方ドライバーは、同じ家に<br>2度行かなくてよくなる。'],
  [42.1, 45.8, '1日の配達が、<br>夕方に終わるようになる。'],
  [45.9, 48.4, '結果：有料になって、'],
  [48.5, 51.9, '家にいるのに出ない人が<br>いなくなった。'],
  [52.0, 54.4, '届かなかったんじゃない。'],
  [54.5, 57.4, '出なかっただけだったのかも<br>しれない。'],
  [57.5, 61.6, '再配達、<br>有料にするべき？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.3, f: shot1 }, { a: 5.3, b: 8.1, f: shot2 }, { a: 8.1, b: 10.9, f: shot3 }, { a: 10.9, b: 14.3, f: shot4 },
  { a: 14.3, b: 18.9, f: shot5 }, { a: 18.9, b: 23.1, f: shot6 }, { a: 23.1, b: 25.5, f: shot7 }, { a: 25.5, b: 29.5, f: shot8 },
  { a: 29.5, b: 33.7, f: shot9 }, { a: 33.7, b: 37.9, f: shot10 }, { a: 37.9, b: 42.1, f: shot11 }, { a: 42.1, b: 45.9, f: shot12 },
  { a: 45.9, b: 52.0, f: shot13 }, { a: 52.0, b: 57.5, f: shot14 }, { a: 57.5, b: 61.8, f: shot15 }, { a: 61.8, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0651',
    v2: true,
    hookLine: '玄関前の段ボールに、追加料金 の赤いシールがバン。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '身近なもの・インフラ',
    title: 'もしも宅配の再配達が有料になったら？',
    titleHtml: 'もしも宅配の<br>再配達が<br>有料になったら？',
    mood: 'tension', seed: 651, hits: [0.45, 45.9, 52.0], risers: [42.1], impacts: [12.3, 15.0, 17.0, 20.0, 26.0, 36.0, 46.2],
    sfx: [[0.45, 'poof'], [5.6, 'alarm'], [7.3, 'whoosh'], [12.3, 'poof'], [23.5, 'alarm'], [26.0, 'whoosh'], [30.0, 'whoosh'], [31.6, 'whoosh'], [34.5, 'poof'], [35.5, 'poof'], [36.5, 'poof'], [39.0, 'bubble'], [43.0, 'whoosh']],
    narr: { '約50億個': 'やくごじゅうおくこ', '約8.4%': 'やくはってんよんパーセント', '約4億個': 'やくよんおくこ', '2度': 'にど', '1日': 'いちにち', '居留守': 'いるす', '風呂上がり': 'ふろあがり', '寝起き': 'ねおき', '結果：': '結果、', '再配達': 'さいはいたつ', '宅配便': 'たくはいびん' },
    ask: '再配達、有料にするべき？',
    caption: 'もしも宅配の再配達が有料になったら？\n\nドライバーたちの不満から。家にいるのに出てこない、指定した時間にいない。\nある日、宅配の再配達は有料になった。\n宅配便は年に約50億個。そのうち約8.4%が再配達。単純計算で、年に約4億個を運び直している。\n有料の初日。居留守を使っていた人が、インターホンに飛びつく。風呂上がりでも、寝起きでも、とりあえず玄関へ。\nネットで買い物しすぎる人ほど、追加料金が積み上がる。\n一方ドライバーは、同じ家に2度行かなくてよくなる。1日の配達が、夕方に終わるようになる。\n\n結果：有料になって、家にいるのに出ない人がいなくなった。\n届かなかったんじゃない。出なかっただけだったのかもしれない。\n\n再配達、有料にするべき？ コメントで教えて。\n\n※風刺ネタです。再配達の有料化は、もしもの設定です\n出典：国土交通省「宅配便の再配達率に関するサンプル調査」（2025年6月公表。2025年4月の再配達率 約8.4%）、国土交通省 宅配便の取扱個数（2023年度 約50億個）。約4億個は 50億×8.4% の単純計算',
    hashtags: ['もしもラボ', 'もしも', '再配達', '宅配便', '居留守'],
    endStats: [['宅配便の取扱個数', '年 約50億個', '2023年度'], ['再配達の割合', '約8.4%', '2025年4月'], ['運び直し', '年 約4億個', '単純計算']],
    sources: '出典：国土交通省「宅配便の再配達率に関するサンプル調査」',
  },
});
