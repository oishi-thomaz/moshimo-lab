import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeGlass } from '../scenes/home.js';
import { makeYokocho, makeRegister, makeSlip, makeWallet, makeCard, setYokochoEnv } from '../scenes/yokocho.js';

// もしも日本から、奢りが消えたら？（皮肉回・台本 S126・社会の消えたら）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。奢って見返りを求めるおぢ（強い側）が困る回。後半で財布を出すふりの人にも返す両叩き
// 数字は使わない（2人は筋の中の数）。店は架空（のれんは 酒・やきとり など一般の言葉だけ）。奢られる側を笑う形にしない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#2a2438', ground: '#4a4440' }); hemi.intensity = 1.25;
const OJI = makeOji(rng(26), { shirt: '#6a7088', bald: true }); S.add(OJI);
const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const KOH = [makeMan({ shirt: '#5a7aa8', hair: '#2a2220' }), makeWoman({ shirt: '#c8a0b8', hair: '#3a2620' }), makeMan({ shirt: '#7a9a6a', hair: '#3a2a1e' })]; KOH.forEach(p => S.add(p));
const FURI = makeMan({ shirt: '#8a8a90', hair: '#4a3a30', pants: '#3a3a40' }); S.add(FURI); // 財布を出すふりの人（男女どちらとも言わない）
const BAG = box(0.34, 0.26, 0.12, mat('#3a3e4a')); S.add(BAG);
// 財布・カード・伝票
const WALLET = makeWallet(); WALLET.position.set(0, -0.68, 0.1); OJI.userData.arms[1].add(WALLET);
const CARD = makeCard(); CARD.position.set(0, -0.7, 0.12); OJI.userData.arms[0].add(CARD);
const SLIP_H = makeSlip({ w: 0.2, h: 0.33 }); SLIP_H.position.set(0, -0.72, 0.12); OJI.userData.arms[1].add(SLIP_H); SLIP_H.userData.fill('1人分');
const SLIP = makeSlip({ w: 0.5, h: 0.8 }); S.add(SLIP);
const PIECES = [0, 1, 2, 3].map(() => { const m = makeSlip({ w: 0.3, h: 0.48 }); m.userData.fill('1人分'); S.add(m); return m; });

// ---------- A：居酒屋のお会計（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#6a4e3a', floor: '#5a4436' });
const izaL = new THREE.PointLight(0xffd8a8, 16, 12, 1.2); izaL.position.set(0, 2.8, 2.0); S.add(izaL);
const REG = makeRegister(); REG.position.set(0.15, 0, -0.9); S.add(REG);
for (let i = 0; i < 4; i++) { const sh = box(0.9, 0.06, 0.3, mat('#4a3628')); sh.position.set(-2.6 + (i % 2) * 5.2, 1.6 + Math.floor(i / 2) * 0.6, -2.8); S.add(sh); }
const sparkA = makeSparkles(90, 0.06, 0xfff2c0); S.add(sparkA.points); sparkA.init([[-0.55, 1.2, -0.2]], 0.4, 0.6);
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(pa);
const wareta = label('伝票が 人数分に', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(wareta);
const motto = label('奢ったんだから もう一軒', { w: 1200, size: 88, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.7 }); S.add(motto);
const human = label('断れない…', { w: 640, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.9 }); S.add(human);

// ---------- B：居酒屋の席（x=60） ----------
const BX = 60;
room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#7a5a42', floor: '#5a4436' });
const izaB = new THREE.PointLight(0xffd8a8, 16, 12, 1.2); izaB.position.set(BX, 2.8, 1.5); S.add(izaB);
const TBL = makeTable({ w: 2.6, d: 1.0, h: 0.42, color: '#b08a63' }); TBL.position.set(BX, 0, -1.0); S.add(TBL);
const GL = []; for (let i = 0; i < 6; i++) { const g = makeGlass({ beer: true, h: 0.2 }); g.position.set(BX - 1.0 + (i % 3) * 1.0, TBL.userData.topY, -1.25 + Math.floor(i / 3) * 0.5); S.add(g); GL.push(g); }
const ogoru = label('奢るよ！', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.8 }); S.add(ogoru);
const tsukaenai = label('使えない', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(tsukaenai);
const demo = label('困ったのは おぢだけじゃない', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.85 }); S.add(demo);
const furi = label('財布を出す ふり', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(furi);
const jibun = label('自分の分', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.85 }); S.add(jibun);
const TSLIP = makeSlip({ w: 0.36, h: 0.56 }); TSLIP.userData.fill('1人分'); S.add(TSLIP);
const ikitai = label('行きたい人だけ', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(ikitai);
const hayai = label('早く終わる', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.0 }); S.add(hayai);
const kiteru = label('奢らなくても 来てくれる', { w: 1100, size: 92, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.6 }); S.add(kiteru);

// ---------- C：夜の横丁（x=120） ----------
const CX = 120;
const YK = makeYokocho(S, { x: CX, z: 0, n: 5 });
const mouikken = label('もう一軒…', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.95 }); S.add(mouikken);
const riyuu = label('誘う理由が ない', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(riyuu);
const warikan = label('割り勘で もう一軒', { w: 1000, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.45 }); S.add(warikan);

// ---------- D：駅前（x=180） ----------
const DX = 180;
flat(30, 14, '#8a8680', DX, 0);
const EKI = box(9, 4.2, 3, mat('#c8c2b6')); EKI.position.set(DX, 2.1, -4.5); S.add(EKI);
const ekiSign = label('もしも台駅', { w: 768, size: 110, color: '#fff', bg: 'rgba(40,60,110,.97)', sx: 1.6 }); ekiSign.position.set(DX, 3.6, -2.9); S.add(ekiSign);
const GATE = []; for (let i = 0; i < 4; i++) { const g = box(0.2, 1.0, 1.2, mat('#7a8090')); g.position.set(DX - 1.5 + i * 1.0, 0.5, -2.6); S.add(g); GATE.push(g); }
const ekiL = new THREE.PointLight(0xfff0d0, 12, 14, 1.2); ekiL.position.set(DX, 3.5, 1); S.add(ekiL);
const otsu = label('おつかれでした〜', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(otsu);
const assari = label('あっさり', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.85 }); S.add(assari);

// ---------- 結果・ひねり ----------
const kari = label('借りを返す夜が 減った', { w: 1100, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.65 }); S.add(kari);
const yoyaku = label('奢り ＝ 時間の予約金', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.65 }); S.add(yoyaku);

const LABELS = [pa, wareta, motto, human, ogoru, tsukaenai, demo, furi, jibun, ikitai, hayai, kiteru, mouikken, riyuu, warikan, otsu, assari, kari, yoyaku];
const PEOPLE = [OJI, ...KOH, FURI];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0);
  WALLET.visible = false; CARD.visible = false; SLIP_H.visible = false; SLIP.visible = false; PIECES.forEach(p => p.visible = false); TSLIP.visible = false; BAG.visible = false;
  GL.forEach(g => { g.visible = true; g.userData.setLevel(1); });
  YK.userData.shops.forEach(s => { s.userData.setNoren(1); s.userData.light(1); });
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 6) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * 0.45; p.userData.legs[1].rotation.x = -s * 0.45; p.userData.arms[0].rotation.x = -s * 0.3; p.userData.arms[1].rotation.x = s * 0.3; }
function sitAt(p, x, z, ry) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; poseSit(p); p.position.y -= 0.18; }
const TP = 0.35;
function regScene() { // お会計の前：おぢ（レジの前）と後輩3人
  stand(OJI, -0.55, -0.15, 0.25); OJI.userData.arms[1].rotation.set(-1.15, 0, 0.1); OJI.userData.arms[0].rotation.set(-0.5, 0, 0);
  KOH.forEach((p, i) => stand(p, 1.0 + i * 0.75, 0.35 + i * 0.25, -0.45));
}
function regCam(u = 0) { look(lerp(0.9, 0.75, u), 1.75, lerp(5.6, 5.2, u), 0.3, 1.3, -0.4, 50); }
function piecesAt(k) { // 伝票が人数分に割れて、4枚が扇に広がる
  PIECES.forEach((m, i) => { m.visible = true; const a = (i - 1.5) * 0.42 * k; m.position.set(0.25 + (i - 1.5) * 0.36 * k, 1.5 + 0.12 * k - Math.abs(i - 1.5) * 0.08 * k, -0.6); m.rotation.set(0, 0, -a * 0.5); });
}
function shot0(t) { // 0秒＝サムネ：おれが払う と出したおぢの財布が、パッと消えて伝票が人数分に割れる
  reset(); lift(0); regScene(); const on = t > TP;
  WALLET.visible = !on; SLIP.visible = !on; SLIP.position.set(0.25, 1.5, -0.6); SLIP.userData.fill('御会計');
  if (on) { piecesAt(easeOut(clamp((t - TP) / 0.35))); sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(pa, t, TP, -0.75, 1.95, 0.1, 0.36); }
  if (t > TP + 0.35) say(wareta, t, TP + 0.35, 0.3, 0.75, 0.4, 1.05);
  regCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // カードを出しかけたおぢが、伝票を持ったまま固まる
  reset(); lift(150); regScene(); OJI.userData.arms[0].rotation.set(-1.0, 0, 0.2); CARD.visible = true; SLIP_H.visible = true; OJI.userData.arms[1].rotation.set(-1.3, 0, 0.05);
  PIECES.slice(1).forEach((m, i) => { m.visible = false; }); if (t > d * 0.35) sweatO.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(0.1, -0.1, u), 1.7, lerp(3.4, 3.0, u), -0.4, 1.4, -0.2, 50);
  return S;
}
function sFuman(t, d) { // 奢られた人たちの不満から。奢ったんだから、もう一軒、と言われる
  reset(); lift(150); regScene(); OJI.userData.arms[1].rotation.set(-0.3, 0, 0.1); OJI.userData.arms[0].rotation.set(-1.6, 0, 0.3); OJI.rotation.y = 0.7;
  KOH.forEach(p => { p.userData.head.rotation.x = 0.3; });
  if (t > d * 0.35) say(motto, t, d * 0.35, 0.3, 2.3, 0, 1.4);
  if (t > d * 0.7) say(human, t, d * 0.7, 1.7, 2.1, 0.6, 0.8);
  look(0.6, 1.9, 5.2, 0.4, 1.3, -0.2, 50);
  return S;
}
function tableScene(n = 3) { sitAt(OJI, BX, -0.3, Math.PI); KOH.forEach((p, i) => { if (i < n) sitAt(p, BX - 0.9 + i * 0.9, -1.75, 0); }); }
function tableCam(u = 0) { look(BX + lerp(2.6, 2.2, u), 2.4, lerp(1.6, 1.2, u), BX, 0.8, -1.0, 52); }
function s1(t, d) { // 1軒目。おぢの 奢るよ が使えない
  reset(); lift(150); sitAt(OJI, BX, -1.75, 0); KOH.forEach((p, i) => sitAt(p, BX - 0.9 + i * 0.9, -0.3, Math.PI)); KOH[1].position.x = BX + 0.9; KOH[2].visible = false;
  sitAt(KOH[2], BX - 0.9, -1.75, 0);
  OJI.userData.arms[1].rotation.set(-2.6, 0, 0.2);
  if (t > d * 0.15) say(ogoru, t, d * 0.15, BX - 0.2, 1.95, -1.75, 0.7);
  if (t > d * 0.55) say(tsukaenai, t, d * 0.55, BX + 0.35, 1.6, -1.55, 0.7);
  setHud('奢りが消えて', '1軒目', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(0.3, 0.1, u), 1.9, lerp(2.6, 2.2, u), BX, 1.05, -1.5, 50);
  return S;
}
function s2(t, d) { // 2軒目。誘う理由が、なくなる
  reset(); lift(150); const sh = YK.userData.shops[2];
  stand(OJI, CX - 0.6, 1.2, 0.6); OJI.userData.arms[1].rotation.set(-1.4, 0, -0.5);
  KOH.forEach((p, i) => { stand(p, CX + 0.6 + i * 0.8 + t * 0.5, 1.8 + i * 0.2, Math.PI / 2); walk(p, t + i); });
  if (t > d * 0.1) say(mouikken, t, d * 0.1, CX - 0.6, 2.4, 1.2, 0.8);
  if (t > d * 0.55) say(riyuu, t, d * 0.55, CX + 0.6, 2.75, 1.6, 1.1);
  setHud('奢りが消えて', '2軒目', 1);
  look(CX + 0.3, 1.9, 6.6, CX + 0.2, 1.5, 0, 50);
  return S;
}
function s3(t, d) { // 帰り道。駅で、みんながあっさり手を振る
  reset(); lift(150);
  stand(OJI, DX + 0.55, 2.7, Math.PI * 1.05); OJI.userData.arms[1].rotation.set(-0.1, 0, 0.15);
  KOH.forEach((p, i) => { stand(p, DX - 1.5 + i * 0.9, -1.5 - Math.min(t * 0.25, 0.6), 0.05); p.userData.arms[1].rotation.set(-2.9, 0, -0.2 + Math.sin(t * 9 + i) * 0.25); });
  if (t > d * 0.2) say(otsu, t, d * 0.2, DX - 1.0, 2.45, -1.5, 1.1);
  if (t > d * 0.6) say(assari, t, d * 0.6, DX + 0.55, 2.2, 2.7, 0.55);
  setHud('奢りが消えて', '帰り道', 1);
  look(DX + 0.4, 1.9, 7.4, DX - 0.2, 1.3, -0.6, 50);
  return S;
}
function sDemo(t, d) { // でも、困ったのは、おぢだけじゃなかった
  reset(); lift(150); tableScene(2); sitAt(FURI, BX + 0.9, -1.75, 0); FURI.userData.head.rotation.x = 0.15;
  if (t > d * 0.4) say(demo, t, d * 0.4, BX, 2.1, -1.2, 1.6);
  const u = ease(clamp(t / d)); look(BX + lerp(1.2, 0.6, u), 2.2, lerp(3.4, 2.8, u), BX + 0.2, 1.0, -1.2, 52);
  return S;
}
function sFuri(t, d) { // 毎回、財布を出すふりだけしていた人の前にも、自分の分の伝票
  reset(); lift(170); tableScene(2); sitAt(FURI, BX + 0.9, -1.75, 0); BAG.visible = true; BAG.position.set(BX + 1.25, 0.42, -1.55);
  FURI.userData.arms[0].rotation.set(-0.7, 0, -0.5); FURI.userData.head.rotation.x = 0.25;
  if (t < d * 0.5) say(furi, t, 0.2, BX + 0.9, 1.55, -1.75, 0.8);
  const k = clamp((t - d * 0.45) / 0.45); if (k > 0) { TSLIP.visible = true; TSLIP.position.set(BX + 0.9, TBL.userData.topY + 0.02 + (1 - easeOut(k)) * 1.2, -1.35); TSLIP.rotation.set(-Math.PI / 2 * easeOut(k), 0, 0.2); }
  if (t > d * 0.62) { say(jibun, t, d * 0.62, BX + 0.9, 1.85, -1.2, 0.75); FURI.userData.head.rotation.x = 0.5; }
  look(BX + 1.6, 1.9, 1.3, BX + 0.9, 0.85, -1.55, 50);
  return S;
}
function sIkkagetsu(t, d) { // 1か月後。飲み会は、行きたい人だけで、早く終わる
  reset(); lift(150); tableScene(3); GL.forEach((g, i) => { g.visible = i % 3 !== 0 || i === 0; g.userData.setLevel(1 - clamp(t / d) * 0.7); });
  if (t > d * 0.2) say(ikitai, t, d * 0.2, BX, 1.75, -1.75, 1.1);
  if (t > d * 0.6) say(hayai, t, d * 0.6, BX + 0.3, 1.25, -0.3, 0.85);
  setHud('奢りが消えて', '1か月後', 1);
  tableCam(ease(clamp(t / d)));
  return S;
}
function sKizuku(t, d) { // おぢは気づく。奢らなくても来てくれる後輩が、2人いた
  reset(); lift(150); sitAt(OJI, BX, -0.3, Math.PI); sitAt(KOH[0], BX - 0.55, -1.75, 0); sitAt(KOH[2], BX + 0.55, -1.75, 0);
  OJI.userData.head.rotation.x = 0.1; KOH[0].userData.arms[1].rotation.set(-1.0, 0, 0); KOH[2].userData.arms[0].rotation.set(-1.0, 0, 0);
  if (t > d * 0.45) say(kiteru, t, d * 0.45, BX - 0.3, 1.75, -1.75, 1.05);
  const u = ease(clamp(t / d)); look(BX + lerp(1.9, 1.6, u), 1.9, lerp(1.4, 1.0, u), BX - 0.1, 0.9, -1.1, 52);
  return S;
}
function sWarikan(t, d) { // その2人と、割り勘で、もう一軒
  reset(); lift(150); const x0 = CX - 3.5 + t * 0.5;
  [OJI, KOH[0], KOH[2]].forEach((p, i) => { stand(p, x0 + i * 0.75, 1.4 + (i === 1 ? 0.35 : 0), Math.PI / 2 - 0.25); walk(p, t + i * 0.7); });
  if (t > d * 0.3) say(warikan, t, d * 0.3, x0 + 0.75, 2.45, 1.4, 1.3);
  look(CX - 1.6 + t * 0.3, 1.9, 6.4, CX - 2.2 + t * 0.45, 1.4, 0.4, 50);
  return S;
}
function sKekka(t, d) { // 結果：奢りが消えて、減ったのはおぢの出費と、借りを返すために付き合う夜だった
  reset(); lift(150); const sh = YK.userData.shops[1]; sitAt(OJI, CX - 3.6, 1.0, 0); OJI.position.y = -0.3; WALLET.visible = true; OJI.userData.arms[1].rotation.set(-0.9, 0, 0.1);
  stand(KOH[0], CX - 4.4, 1.2, 0.4); stand(KOH[2], CX - 2.8, 1.2, -0.4);
  if (t > d * 0.55) say(kari, t, d * 0.55, CX - 3.6, 2.5, 1.0, 1.55);
  setTop('結果', '付き合う夜が 減った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(CX - 3.6 + lerp(0.3, 0.6, u), lerp(1.7, 1.9, u), lerp(4.6, 5.4, u), CX - 3.6, 1.35, 0.6, 50);
  return S;
}
function sYoyaku(t, d) { // 奢りは、気前じゃなく、相手の時間を前払いで買う、予約金だったのかもしれない
  reset(); lift(150); regScene(); OJI.userData.arms[1].rotation.set(-1.2, 0, 0.1); WALLET.visible = true;
  const k = clamp((t - d * 0.3) / 0.4); if (k > 0.5) say(yoyaku, t, d * 0.3 + 0.2, -0.3, 2.2, 0, 1.35);
  look(0.1, 1.75, 3.6, -0.3, 1.45, -0.2, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); regScene(); piecesAt(1); regCam(0); return S; }

const NARR = { 'カード': 'カード', '出しかけた': 'だしかけた', 'おぢ': 'おぢ', '伝票': 'でんぴょう', '持った': 'もった', '固まる': 'かたまる', '奢られた': 'おごられた', '人たち': 'ひとたち', '不満': 'ふまん', '奢った': 'おごった', '一軒': 'いっけん', '言われる': 'いわれる', '1軒目': 'いっけんめ', '奢る': 'おごる', '使えない': 'つかえない', '2軒目': 'にけんめ', '誘う': 'さそう', '理由': 'りゆう', '帰り道': 'かえりみち', '駅': 'えき', '手を振る': 'てをふる', '困った': 'こまった', '毎回': 'まいかい', '財布': 'さいふ', '出す': 'だす', '人の前': 'ひとのまえ', '自分の分': 'じぶんのぶん', '1か月後': 'いっかげつご', '飲み会': 'のみかい', '行きたい': 'いきたい', '早く': 'はやく', '終わる': 'おわる', '気づく': 'きづく', '来て': 'きて', '後輩': 'こうはい', '2人': 'ふたり', '割り勘': 'わりかん', '結果：': '結果、', '奢り': 'おごり', '消えて': 'きえて', '減った': 'へった', '出費': 'しゅっぴ', '借り': 'かり', '返す': 'かえす', '付き合う': 'つきあう', '夜': 'よる', '気前': 'きまえ', '相手': 'あいて', '時間': 'じかん', '前払い': 'まえばらい', '買う': 'かう', '予約金': 'よやくきん' };
const P = planTimes([
  ['カードを出しかけたおぢが、', (t, d) => sKatamaru(t, 2 * d)],
  ['伝票を持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['奢られた人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['奢ったんだから、もう一軒、<br>と言われる。', (t, d) => sFuman(t + d, 2 * d)],
  ['1軒目。<br>おぢの 奢るよ が使えない。', s1],
  ['2軒目。<br>誘う理由が、なくなる。', s2],
  ['帰り道。駅で、<br>みんながあっさり手を振る。', s3],
  ['でも、困ったのは、', (t, d) => sDemo(t, 2 * d)],
  ['おぢだけじゃなかった。', (t, d) => sDemo(t + d, 2 * d)],
  ['毎回、財布を出すふりだけ<br>していた人の前にも、', (t, d) => sFuri(t, 2 * d)],
  ['自分の分の伝票。', (t, d) => sFuri(t + d, 2 * d)],
  ['1か月後。飲み会は、', (t, d) => sIkkagetsu(t, 2 * d)],
  ['行きたい人だけで、<br>早く終わる。', (t, d) => sIkkagetsu(t + d, 2 * d)],
  ['おぢは気づく。', (t, d) => sKizuku(t, 2 * d)],
  ['奢らなくても来てくれる<br>後輩が、2人いた。', (t, d) => sKizuku(t + d, 2 * d)],
  ['その2人と、<br>割り勘で、もう一軒。', sWarikan],
  ['結果：奢りが消えて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのはおぢの出費と、', (t, d) => sKekka(t + d, 3 * d)],
  ['借りを返すために<br>付き合う夜だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['奢りは、気前じゃなく、', (t, d) => sYoyaku(t, 2 * d)],
  ['相手の時間を前払いで買う、<br>予約金だったのかもしれない。', (t, d) => sYoyaku(t + d, 2 * d)],
  ['奢られたら、<br>もう一軒付き合う？', sAsk],
], { shot0, endCard, start: 2.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0711',
    v2: true,
    tt: 'main',
    hookLine: 'おれが払う と出したおぢの財布が、パッと消えて伝票が人数分に割れる。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から、奢りが消えたら？',
    titleHtml: 'もしも日本から、<br>奢りが<br>消えたら？',
    mood: 'tension', seed: 711, hits: [TP, P.at(16), P.at(20)], risers: [P.at(7)], impacts: [P.at(10, 0.5), P.at(18, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.8), 'alarm'], [P.at(5, 0.3), 'whoosh'], [P.at(6, 0.3), 'whoosh'], [P.at(10, 0.4), 'whoosh'], [P.at(15, 0.2), 'whoosh']],
    narr: NARR,
    ask: '奢られたら、もう一軒付き合う？',
    caption: 'もしも日本から、奢りが消えたら？\n\nカードを出しかけたおぢが、伝票を持ったまま固まる。\n奢られた人たちの不満から。奢ったんだから、もう一軒、と言われる。\n1軒目。おぢの 奢るよ が使えない。\n2軒目。誘う理由が、なくなる。\n帰り道。駅で、みんながあっさり手を振る。\nでも、困ったのは、おぢだけじゃなかった。\n毎回、財布を出すふりだけしていた人の前にも、自分の分の伝票。\n1か月後。飲み会は、行きたい人だけで、早く終わる。\nおぢは気づく。奢らなくても来てくれる後輩が、2人いた。\nその2人と、割り勘で、もう一軒。\n\n結果：奢りが消えて、減ったのはおぢの出費と、借りを返すために付き合う夜だった。\n奢りは、気前じゃなく、相手の時間を前払いで買う、予約金だったのかもしれない。\n\n奢られたら、もう一軒付き合う？ コメントで教えて。\n\n※風刺ネタです。奢りが消えるのは、もしもの設定です。お店・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '奢り', '飲み会', '社会の消えたら'],
    endStats: [['消えたもの', '奢り', 'もしもの設定'], ['減ったもの', '借りを返すために 付き合う夜', 'もしもの結果'], ['奢りの正体', '時間の予約金', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
