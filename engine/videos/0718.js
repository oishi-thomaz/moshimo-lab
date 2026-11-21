import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも電車で足を広げると、座席が縮んだら？（皮肉回・台本 S123・図星／大人の本音）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。7人掛けに大股開きで2人分を取るおじさんが、左右の座席に はさまれて固まる回。後半で 満員でリュックを背負ったままの人 にも返す
// 数字は使わない（7人掛け・6人は座席の数、1週間は筋の中の数）。電車・会社は架空（実在の路線の色・ロゴなし）。おばあさんは笑われる側にしない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#d8e4ee', ground: '#8a8a84' }); hemi.intensity = 1.3;

// ---------- 車内（原点）：奥の壁に窓、手前向きの7人掛け ----------
const FLOOR = box(14, 0.1, 4.2, mat('#8a8a84')); FLOOR.position.set(0, -0.05, 0.4); S.add(FLOOR);
const WALL = box(14, 2.7, 0.1, mat('#e4e8ec')); WALL.position.set(0, 1.35, -1.25); S.add(WALL);
const WINM = new THREE.MeshBasicMaterial({ color: '#a8d8f4' });
for (let i = 0; i < 4; i++) { const w = box(1.6, 0.85, 0.02, WINM); w.position.set(-4.5 + i * 3.0, 1.75, -1.19); S.add(w); }
const CEIL = box(14, 0.1, 4.2, mat('#f2f2f0')); CEIL.position.set(0, 2.62, 0.4); S.add(CEIL);
const RAIL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 14, 8), mat('#c8ccd4')); RAIL.rotation.z = Math.PI / 2; RAIL.position.set(0, 2.25, 0.05); S.add(RAIL);
for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const b = box(0.03, 0.22, 0.03, mat('#e8e8e8')); b.position.y = -0.11; g.add(b); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), mat('#f2f2f2')); ring.position.y = -0.28; g.add(ring); g.position.set(-3.25 + i * 0.5, 2.25, 0.05); S.add(g); }
const SW = 0.46; // 1人分の幅
const SEATX = (i) => (i - 3) * SW;
const BASE = box(7 * SW + 0.1, 0.38, 0.55, mat('#5a5e66')); BASE.position.set(0, 0.19, -0.92); S.add(BASE);
const CUSH = []; for (let i = 0; i < 7; i++) { const c = box(SW - 0.03, 0.08, 0.52, mat(i % 2 ? '#3a6aa8' : '#335f98')); c.position.set(SEATX(i), 0.42, -0.9); S.add(c); CUSH.push(c); }
const BACK = box(7 * SW + 0.1, 0.5, 0.08, mat('#3a6aa8')); BACK.position.set(0, 0.75, -1.16); S.add(BACK);
for (const s of [-1, 1]) { const ar = box(0.08, 0.7, 0.55, mat('#c8ccd4')); ar.position.set(s * (3.5 * SW + 0.1), 0.6, -0.92); S.add(ar); }
// 縮む座席：おじさんの左右から立ち上がる クッションの壁
const SQ = [-1, 1].map(s => { const g = new THREE.Group(); const b = box(0.12, 0.55, 0.5, mat('#e8707a')); b.position.y = 0.27; g.add(b); const t = box(0.14, 0.06, 0.52, mat('#f4a0a8')); t.position.y = 0.56; g.add(t); S.add(g); g.userData.s = s; return g; });

// 人
const OJI = makeOji(rng(123), { shirt: '#6a6e7a', bald: true }); S.add(OJI); const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const NEWS = box(0.42, 0.3, 0.01, mat('#ece8dc')); S.add(NEWS);
const BAGO = box(0.36, 0.26, 0.14, mat('#3a2a22')); S.add(BAGO);
const SIT = [makeWoman({ shirt: '#9ac0e0' }), makeMan({ shirt: '#c8a070', hair: '#2a2220' }), makeWoman({ shirt: '#e8a0b8', hair: '#5a3a28' }), makeMan({ shirt: '#7a9a6a' })]; SIT.forEach(p => S.add(p));
const STAND = [makeMan({ shirt: '#8aa0b8', hair: '#3a2a1e' }), makeWoman({ shirt: '#c8b0e0', hair: '#2a2220' }), makeMan({ shirt: '#a87a5a', hair: '#1d1a19' })]; STAND.forEach(p => S.add(p));
const BAA = makeWoman({ shirt: '#b8a0c0', hair: '#d8d8d8', scale: 0.9 }); S.add(BAA);
const RUCK = makeMan({ shirt: '#5a8a7a', hair: '#2a2220' }); S.add(RUCK); const sweatR = makeSweat(); RUCK.userData.head.add(sweatR);
const PACK = box(0.42, 0.55, 0.26, mat('#2a3a4a')); S.add(PACK);
const YOUNG = makeWoman({ shirt: '#f2c14e', hair: '#3a2620' }); S.add(YOUNG);

const sparkA = makeSparkles(70, 0.05, 0xffffff); S.add(sparkA.points); sparkA.init([[0, 0.7, -0.7]], 0.5, 0.3);
const kyu = label('キュッ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(kyu);
const chijimu = label('座席が 縮んだ', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.15 }); S.add(chijimu);
const rokunin = label('7人掛けに 6人', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(rokunin);
const demo = label('見ていたのは おじさんだけじゃない', { w: 1300, size: 82, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.65 }); S.add(demo);
const kururi = label('くるっ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(kururi);
const soroete = label('ひざを そろえて', { w: 900, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(soroete);
const umaru = label('隣が すぐ埋まる', { w: 900, size: 96, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.1 }); S.add(umaru);
const ibasho = label('1人分の 居場所', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(ibasho);
const enryo = label('足が長いんじゃない 遠慮が短い', { w: 1300, size: 82, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.65 }); S.add(enryo);

const LABELS = [kyu, chijimu, rokunin, demo, kururi, soroete, umaru, ibasho, enryo];
const PEOPLE = [OJI, ...SIT, ...STAND, BAA, RUCK, YOUNG];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweatR.userData.set(0);
  SQ.forEach(g => g.visible = false); NEWS.visible = false; BAGO.visible = false; PACK.visible = false; WINM.color.set('#a8d8f4'); hemi.intensity = 1.3;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sitP(p, i, dx = 0) { p.visible = true; p.position.set(SEATX(i) + dx, 0.05, -0.85); p.rotation.y = 0; poseSit(p); p.position.y += 0.08; }
function standP(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
// おじさん：3番（真ん中）と4番にまたがって座る。open で股を開く・ひじを張る
function oji(open = 1, elbows = 0) {
  sitP(OJI, 3, SW * 0.5 * open); const L = OJI.userData.legs; L[0].rotation.set(-Math.PI / 2, 0, 0); L[1].rotation.set(-Math.PI / 2, 0, 0);
  L[0].rotation.y = 0.55 * open; L[1].rotation.y = -0.55 * open;
  OJI.userData.arms[0].rotation.set(-0.3, 0, 1.0 * elbows); OJI.userData.arms[1].rotation.set(-0.3, 0, -1.0 * elbows);
}
function squeeze(k, cx, half) { SQ.forEach(g => { g.visible = k > 0.01; g.position.set(cx + g.userData.s * lerp(half + 0.35, half, easeOut(k)), 0.42, -0.85); g.scale.y = Math.max(0.05, easeOut(k)); }); }
function others(skip = []) { [[SIT[0], 0], [SIT[1], 1], [SIT[2], 5], [SIT[3], 6]].forEach(([p, i]) => { if (!skip.includes(i)) sitP(p, i); }); }
function standers(t) { STAND.forEach((p, i) => { standP(p, -1.4 + i * 1.1, 0.35, Math.PI); p.userData.arms[1].rotation.set(-3.0, 0, 0.05); p.rotation.z = Math.sin(t * 1.4 + i) * 0.02; }); }
const TP = 0.35;
function trainCam(u = 0, y = 1.55) { look(lerp(0.4, 0.3, u), y, lerp(2.9, 2.6, u), 0.15, 0.95, -0.9, 52); }
function shot0(t) { // 0秒＝サムネ：電車で大股開きのおじさんの左右の座席が、キュッと縮む
  reset(); lift(0); others(); const k = clamp((t - TP) / 0.25); oji(1 - 0.85 * easeOut(k)); squeeze(k, SEATX(3) + SW * 0.5, 0.34);
  NEWS.visible = true; NEWS.position.set(SEATX(3) + SW * 0.5, 0.72, -0.45); NEWS.rotation.x = -1.0;
  if (t > TP) { sparkA.set(clamp((t - TP) / 0.6)); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(kyu, t, TP, SEATX(3) + SW * 0.5 + 0.6, 1.55, -0.6, 0.4); sweatO.userData.set(1, t); }
  if (t > TP + 0.35) say(chijimu, t, TP + 0.35, SEATX(3) + SW * 0.5, 0.25, -0.3, 0.8);
  look(0.25, 1.5, lerp(3.0, 2.8, ease(clamp(t / 3))), SEATX(3) + SW * 0.5, 1.25, -0.9, 50);
  return S;
}
function sKatamaru(t, d) { // 両ひざを座席にはさまれたおじさんが、新聞を持ったまま固まる
  reset(); lift(150); others(); oji(0.15); squeeze(1, SEATX(3) + SW * 0.5, 0.34); sweatO.userData.set(1, t);
  NEWS.visible = true; NEWS.position.set(SEATX(3) + SW * 0.5, 0.72, -0.45); NEWS.rotation.x = -1.0; OJI.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0));
  const u = ease(clamp(t / d)); look(SEATX(3) + SW * 0.5 + lerp(0.6, 0.4, u), 1.4, lerp(2.3, 2.0, u), SEATX(3) + SW * 0.5, 1.0, -0.8, 50);
  return S;
}
function sFuman(t, d) { // 立っている人たちの不満から。7人掛けに、6人しか座れない（回想：大股開きのまま）
  reset(); lift(150); others(); oji(1); standers(t); STAND.forEach(p => p.userData.head.rotation.x = 0.35);
  if (t > d * 0.55) say(rokunin, t, d * 0.55, 0, 1.7, -0.9, 0.95);
  look(0.3, 2.3, 3.0, 0.15, 0.9, -0.9, 52);
  return S;
}
function sStage(i, t, d) { // 朝 足・昼 ひじ・夜 荷物 → キュッ
  reset(); lift(150); const k = clamp((t - d * 0.4) / 0.25);
  if (i === 0) { others(); standers(t); oji(1 - 0.85 * easeOut(k)); squeeze(k, SEATX(3) + SW * 0.5, 0.34); }
  if (i === 1) { others(); hemi.intensity = 1.4; oji(0.15, 1 - easeOut(k)); squeeze(k, SEATX(3) + SW * 0.5, 0.36); }
  if (i === 2) { WINM.color.set('#1a2440'); hemi.intensity = 1.0; others([0, 1, 5]); oji(0.15); BAGO.visible = true; BAGO.position.set(k < 1 ? SEATX(5) : SEATX(3) + SW * 0.5, k < 1 ? 0.6 : 0.85, k < 1 ? -0.85 : -0.55); squeeze(k, SEATX(4), 0.6); }
  if (k > 0) say(kyu, t, d * 0.4, SEATX(3) + SW * 0.5 + 0.7, 1.55, -0.6, 0.45);
  setHud('座席が縮む', ['朝の通勤', '昼の各駅停車', '夜の終電'][i], 1);
  trainCam(ease(clamp(t / d)), 1.45);
  return S;
}
function sDemo(t, d) { // でも、座席が見ていたのは、おじさんだけじゃなかった。満員の車内でリュックを背負ったままの人のリュックも、くるっと前に回る
  reset(); lift(150); others(); oji(0.15); standers(t); standP(RUCK, 0.9, 0.55, Math.PI * 0.9); RUCK.userData.arms[1].rotation.set(-3.0, 0, 0.05);
  const ph = t / d; const k = clamp((ph - 0.6) / 0.08); PACK.visible = true; RUCK.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.15, lerp(-0.25, 0.25, easeOut(k))); RUCK.localToWorld(v); PACK.position.copy(v); PACK.rotation.y = RUCK.rotation.y;
  if (ph > 0.12 && ph < 0.55) say(demo, t, d * 0.12, 0.3, 2.1, -0.4, 1.4);
  if (k > 0) { say(kururi, t, d * 0.6, 1.05, 1.95, 0.55, 0.42); sweatR.userData.set(1, t); }
  look(1.6, 1.75, 3.2, 0.6, 1.25, -0.2, 50);
  return S;
}
function sSoroete(t, d) { // 1週間後。おじさんは、ひざをそろえて座る
  reset(); lift(150); others(); sitP(OJI, 3); OJI.userData.head.rotation.x = 0.1;
  if (t > d * 0.4) say(soroete, t, d * 0.4, SEATX(3), 1.85, -0.7, 1.0);
  setHud('座席が縮む', '1週間後', 1);
  trainCam(ease(clamp(t / d)), 1.45);
  return S;
}
function sBaa(t, d) { // 空いた1人分に、立っていたおばあさんが座る
  reset(); lift(150); others(); sitP(OJI, 3); const k = clamp(t / (d * 0.6));
  if (k < 1) { standP(BAA, lerp(SEATX(4) + 0.9, SEATX(4), ease(k)), lerp(0.4, -0.3, ease(k)), Math.PI); } else { sitP(BAA, 4); }
  trainCam(ease(clamp(t / d)), 1.45);
  return S;
}
function sUmaru(t, d) { // おじさんの隣の席が、初めてすぐ埋まる
  reset(); lift(150); others([1]); sitP(OJI, 3); sitP(BAA, 4); const k = clamp(t / (d * 0.5));
  if (k < 1) standP(YOUNG, lerp(SEATX(2) - 0.6, SEATX(2), ease(k)), lerp(0.4, -0.3, ease(k)), Math.PI); else sitP(YOUNG, 2);
  if (t > d * 0.55) say(umaru, t, d * 0.55, SEATX(3), 1.85, -0.7, 1.0);
  trainCam(ease(clamp(t / d)), 1.45);
  return S;
}
function sKekka(t, d) { // 結果：座席が縮むようになって、増えたのは席の数じゃなく、座れなかった1人分の居場所だった
  reset(); lift(150); others([1]); sitP(OJI, 3); sitP(BAA, 4); sitP(YOUNG, 2); sitP(SIT[1], 1); standers(t); STAND.forEach((p, i) => p.visible = i === 0);
  if (t > d * 0.6) say(ibasho, t, d * 0.6, SEATX(4), 1.75, -0.6, 0.95);
  setTop('結果', '1人分の居場所が 増えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.0, u), 1.7, lerp(3.0, 3.6, u), 0.1, 1.05, -0.9, 52);
  return S;
}
function sEnryo(t, d) { // 大股開きは、足の長さじゃなく、遠慮の短さだったのかもしれない
  reset(); lift(150); others(); oji(1); OJI.userData.head.rotation.x = -0.1;
  if (t > d * 0.4) say(enryo, t, d * 0.4, SEATX(3) + SW * 0.5, 1.6, -0.6, 1.15);
  look(SEATX(3) + SW * 0.5 + 0.3, 1.4, 2.4, SEATX(3) + SW * 0.5, 1.0, -0.8, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); others(); oji(0.15); squeeze(1, SEATX(3) + SW * 0.5, 0.34); NEWS.visible = true; NEWS.position.set(SEATX(3) + SW * 0.5, 0.72, -0.45); NEWS.rotation.x = -1.0; look(0.25, 1.5, 3.0, SEATX(3) + SW * 0.5, 1.25, -0.9, 50); return S; }

const NARR = { '両ひざ': 'りょうひざ', '座席': 'ざせき', 'はさまれた': 'はさまれた', '新聞': 'しんぶん', '持った': 'もった', '固まる': 'かたまる', '立っている': 'たっている', '人たち': 'ひとたち', '不満': 'ふまん', '7人掛け': 'しちにんがけ', '6人': 'ろくにん', '座れない': 'すわれない', '朝の通勤': 'あさのつうきん', '足': 'あし', '開いた': 'ひらいた', '瞬間': 'しゅんかん', '昼の各駅停車': 'ひるのかくえきていしゃ', '広げた': 'ひろげた', '夜の終電': 'よるのしゅうでん', '荷物': 'にもつ', '隣': 'となり', '置いた': 'おいた', '見ていた': 'みていた', '満員': 'まんいん', '車内': 'しゃない', '背負った': 'せおった', '人': 'ひと', '前': 'まえ', '回る': 'まわる', '1週間後': 'いっしゅうかんご', '座る': 'すわる', '空いた': 'あいた', '1人分': 'ひとりぶん', '席': 'せき', '初めて': 'はじめて', '埋まる': 'うまる', '結果：': '結果、', '縮む': 'ちぢむ', '増えた': 'ふえた', '数': 'かず', '座れなかった': 'すわれなかった', '居場所': 'いばしょ', '大股開き': 'おおまたびらき', '長さ': 'ながさ', '遠慮': 'えんりょ', '短さ': 'みじかさ', '電車': 'でんしゃ', '注意': 'ちゅうい' };
const P = planTimes([
  ['両ひざを座席にはさまれた<br>おじさんが、', (t, d) => sKatamaru(t, 2 * d)],
  ['新聞を持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['立っている人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['7人掛けに、6人しか座れない。', (t, d) => sFuman(t + d, 2 * d)],
  ['朝の通勤。<br>足を開いた瞬間、キュッ。', (t, d) => sStage(0, t, d)],
  ['昼の各駅停車。<br>ひじを広げた瞬間、キュッ。', (t, d) => sStage(1, t, d)],
  ['夜の終電。荷物を<br>隣に置いた瞬間、キュッ。', (t, d) => sStage(2, t, d)],
  ['でも、座席が見ていたのは、<br>おじさんだけじゃなかった。', (t, d) => sDemo(t, 3 * d)],
  ['満員の車内でリュックを<br>背負ったままの人のリュックも、', (t, d) => sDemo(t + d, 3 * d)],
  ['くるっと前に回る。', (t, d) => sDemo(t + 2 * d, 3 * d)],
  ['1週間後。おじさんは、<br>ひざをそろえて座る。', sSoroete],
  ['空いた1人分に、立っていた<br>おばあさんが座る。', sBaa],
  ['おじさんの隣の席が、<br>初めてすぐ埋まる。', sUmaru],
  ['結果：座席が縮むようになって、', (t, d) => sKekka(t, 3 * d)],
  ['増えたのは席の数じゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['座れなかった<br>1人分の居場所だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['大股開きは、<br>足の長さじゃなく、', (t, d) => sEnryo(t, 2 * d)],
  ['遠慮の短さだったのかも<br>しれない。', (t, d) => sEnryo(t + d, 2 * d)],
  ['電車の大股開き、<br>注意できる？できない？', sAsk],
], { shot0, endCard, start: 2.9, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0718',
    v2: true,
    tt: 'main',
    hookLine: '電車で大股開きのおじさんの左右の座席が、キュッと縮む。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '社会・ルール',
    title: 'もしも電車で足を広げると、座席が縮んだら？',
    titleHtml: 'もしも電車で<br>足を広げると、<br>座席が縮んだら？',
    mood: 'tension', seed: 718, hits: [TP, P.at(13), P.at(16)], risers: [P.at(7)], impacts: [P.at(9, 0.3), P.at(15, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.9), 'whoosh'], [P.at(5, 0.9), 'whoosh'], [P.at(6, 0.9), 'whoosh'], [P.at(9, 0.2), 'whoosh'], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: '電車の大股開き、注意できる？できない？',
    caption: 'もしも電車で足を広げると、座席が縮んだら？\n\n両ひざを座席にはさまれたおじさんが、新聞を持ったまま固まる。\n立っている人たちの不満から。7人掛けに、6人しか座れない。\n朝の通勤。足を開いた瞬間、キュッ。\n昼の各駅停車。ひじを広げた瞬間、キュッ。\n夜の終電。荷物を隣に置いた瞬間、キュッ。\nでも、座席が見ていたのは、おじさんだけじゃなかった。\n満員の車内でリュックを背負ったままの人のリュックも、くるっと前に回る。\n1週間後。おじさんは、ひざをそろえて座る。\n空いた1人分に、立っていたおばあさんが座る。\nおじさんの隣の席が、初めてすぐ埋まる。\n\n結果：座席が縮むようになって、増えたのは席の数じゃなく、座れなかった1人分の居場所だった。\n大股開きは、足の長さじゃなく、遠慮の短さだったのかもしれない。\n\n電車の大股開き、注意できる？できない？ コメントで教えて。\n\n※風刺ネタです。座席が縮むのは、もしもの設定です。電車・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '大股開き', '電車', '大人の本音'],
    endStats: [['縮んだもの', '大股開きの 左右の座席', 'もしもの設定'], ['増えたもの', '座れなかった 1人分の居場所', 'もしもの結果'], ['大股開きの正体', '遠慮の短さ', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
