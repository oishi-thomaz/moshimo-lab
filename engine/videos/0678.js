import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, makeOji, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeKotatsu, makeCounter, makePot, makeDishes, makeMochiGrill } from '../scenes/home.js';

// もしも夫の実家に帰省したら、夫も台所に立つ決まりだったら？（皮肉回・台本 S76・図星／男と女のもしも）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：年末年始の帰省前に毎年燃える 義実家の帰省・嫁だけ台所 の話題（ガルちゃん・はてな匿名ダイアリーの季節ネタ）
// 数字は使わない（15人・朝6時は筋の中の数）。家・人物は架空
// 男叩き（実家で動かない夫）、後半で 息子に甘い義母 にも返し、最後は 義母が一番休めた。三段は 30日の黒豆→31日の皿洗い→1日の雑煮。言い換えは 年に一度の合宿

const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.4;
const OTTO = makeMan({ shirt: '#59606e', hair: '#1d1a19', pants: '#3a3f4a' }); S.add(OTTO);
const TSUMA = makeWoman({ shirt: '#e9b8c8', hair: '#4a3020', pants: '#4a4f60' }); S.add(TSUMA);
const GIBO = makeWoman({ shirt: '#9fc7a8', hair: '#8a8a8a', pants: '#5a4a3a' }); S.add(GIBO);
const GIFU = makeOji(rng(76), { shirt: '#7a6a55' }); S.add(GIFU);
const APRON = (p, c) => { const a = box(0.44, 0.7, 0.04, mat(c)); a.position.set(0, 1.0, 0.16); p.add(a); return a; };
const apO = APRON(OTTO, '#f2c14e'); const apG = APRON(GIBO, '#e8e2d4');

// ---------- 義実家（原点）：左に居間、右に台所 ----------
const KX = 1.4; // 台所の中心
const KOX = -1.1; // こたつ
const home = room({ x: 0, w: 10, d: 6, h: 3, wall: '#e8dcc0', floor: '#c9c48a' });
const KOTA = makeKotatsu(); KOTA.position.set(KOX, 0, -0.2); S.add(KOTA);
const TV = new THREE.Group(); { const b = box(1.3, 0.8, 0.12, mat('#16181d')); b.position.y = 1.0; TV.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: '#f6c86a' })); s.position.set(0, 1.0, 0.07); TV.add(s); const st = box(1.0, 0.6, 0.4, mat('#6a4a2f')); st.position.y = 0.3; TV.add(st); } TV.position.set(-2.4, 0, -2.6); TV.rotation.y = 0.5; S.add(TV);
const kitchenFloor = flat(3.4, 6, '#d8d8d4', KX + 0.2, 0, -0.7, 0.012);
const CNT = makeCounter({ w: 2.8 }); CNT.position.set(KX, 0, -2.55); S.add(CNT);
const POT = makePot(); POT.position.set(KX + 0.5, 0.97, -2.55); S.add(POT);
const BEANS = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), mat('#1a1418')); BEANS.rotation.x = -Math.PI / 2; BEANS.position.set(KX + 0.5, 1.18, -2.55); S.add(BEANS);
const DISH = makeDishes(16); DISH.position.set(KX - 0.75, 0.95, -2.5); S.add(DISH);
const DISH2 = makeDishes(16); DISH2.position.set(KX - 0.35, 0.95, -2.45); S.add(DISH2);
const MOCHI = makeMochiGrill(); MOCHI.position.set(KX + 0.5, 0.97, -2.55); S.add(MOCHI);
const YUNOMI = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.11, 12), mat('#3f6d55')); S.add(YUNOMI);
const STEAM = []; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); S.add(m); STEAM.push(m); }
const sparkA = makeSparkles(120, 0.12, 0xfff2c0); S.add(sparkA.points);
const TEARS = [0, 1].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#7fd0ff' })); d.scale.y = 1.5; S.add(d); return d; });
const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);

const daidokoro = label('夫も台所へ', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(daidokoro);
const potsun = label('ポツン', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.6 }); S.add(potsun);
const watashidake = label('私だけが 台所', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.4 }); S.add(watashidake);
const kuromame = label('黒豆', { w: 384, size: 110, color: '#fff', bg: 'rgba(42,30,36,.96)', sx: 0.6 }); S.add(kuromame);
const juugo = label('15人分', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(juugo);
const rokuji = label('朝6時', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 0.8 }); S.add(rokuji);
const hajimete = label('初めて こたつで正月', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.8 }); S.add(hajimete);
const uchinoko = label('うちの子に こんなこと', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.0 }); S.add(uchinoko);
const hitoride = label('毎年これを ひとりで？', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(hitoride);
const yasumeta = label('一番休めたのは 義母', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(yasumeta);
const gasshuku = label('年に一度の合宿', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.6 }); S.add(gasshuku);

const PEOPLE = [OTTO, TSUMA, GIBO, GIFU];
const LABELS = [daidokoro, potsun, watashidake, kuromame, juugo, rokuji, hajimete, uchinoko, hitoride, yasumeta, gasshuku];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); TEARS.forEach(d => d.visible = false); STEAM.forEach(m => m.visible = false);
  apO.visible = true; apG.visible = true; POT.visible = false; BEANS.visible = false; DISH.visible = DISH2.visible = false; DISH.userData.setN(1); DISH2.userData.setN(1); MOCHI.visible = false; MOCHI.userData.puff(0);
  // こたつ：夫は手前、義父は奥
  OTTO.position.set(KOX, 0, -1.1); OTTO.rotation.y = 0; poseSit(OTTO); OTTO.position.y = -0.36; apO.visible = false;
  GIFU.position.set(KOX - 0.9, 0, -0.2); GIFU.rotation.y = Math.PI / 2; poseSit(GIFU); GIFU.position.y = -0.36;
  TSUMA.position.set(KX - 0.5, 0, -1.9); TSUMA.rotation.y = Math.PI; GIBO.position.set(KX + 0.5, 0, -1.9); GIBO.rotation.y = Math.PI;
  YUNOMI.position.set(KOX + 0.25, KOTA.userData.topY + 0.055, -0.55);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p) { p.userData.legs.forEach(l => l.rotation.x = 0); p.position.y = 0; }
function steam(t) { STEAM.forEach((m, i) => { m.visible = true; const u = (t * 0.5 + i / 3) % 1; m.position.set(KOX + 0.25 + Math.sin(t + i) * 0.03, KOTA.userData.topY + 0.15 + u * 0.4, -0.55); m.material.opacity = 0.5 * (1 - u); }); }
const TP = 0.4;
function wideCam(u = 0) { look(lerp(0.0, -0.1, u), lerp(2.4, 2.2, u), lerp(6.0, 5.5, u), -0.05, lerp(1.5, 1.15, u), -1.0, 50); }
function shot0(t) { // 0秒＝サムネ：義実家のこたつに入った夫が、台所へビュンと吸い込まれる
  reset(); lift(0);
  const k = easeOut(clamp((t - 0.05) / TP)); if (t > 0.05) { stand(OTTO); OTTO.position.set(lerp(KOX, KX, k), Math.sin(k * Math.PI) * 0.5, lerp(-1.1, -1.9, k)); OTTO.rotation.y = lerp(0, Math.PI, k); OTTO.rotation.z = -0.4 * Math.sin(k * Math.PI); OTTO.userData.arms.forEach(a => a.rotation.set(-2.6, 0, 0)); apO.visible = k > 0.9; }
  steam(t + 1);
  if (t > TP) { sparkA.init([[KOX, 1.0, -1.1]], 0.4, 0.8); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.25 : 0; say(daidokoro, t, TP + 0.1, KX, 2.35, -1.6, 0.9); }
  wideCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sPotsun(t, d) { // こたつに残った夫の湯のみが、ポツンと置き去り。
  reset(); lift(120); OTTO.visible = false; steam(t); GIFU.userData.head.rotation.y = 0.4;
  if (t > 0.8) say(potsun, t, 0.8, KOX + 0.25, KOTA.userData.topY + 0.5, -0.55, 0.45);
  const u = ease(clamp(t / d)); look(lerp(KOX + 0.5, KOX + 0.4, u), lerp(1.3, 1.1, u), lerp(1.4, 1.0, u), KOX + 0.25, 0.6, -0.6, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。義実家では、私だけが台所にいる。
  reset(); lift(120); stand(OTTO); OTTO.visible = true; OTTO.position.set(KOX, 0, -1.1); poseSit(OTTO); OTTO.position.y = -0.36; apO.visible = false;
  TSUMA.rotation.y = -0.6; TSUMA.position.set(KX - 0.4, 0, -1.6); TSUMA.userData.head.rotation.y = -0.4;
  if (t > d * 0.4) say(watashidake, t, d * 0.4, KX - 0.4, 2.35, -1.6, 1.2);
  wideCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function kitCam(u = 0) { look(KX + lerp(0.2, 0.0, u), 1.85, lerp(1.4, 0.9, u), KX + 0.3, 1.3, -2.3, 50); }
function sDec30(t, d) { // 12月30日。夫は義母と並んで、おせちの黒豆を煮る。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX + 0.25, 0, -1.9); OTTO.rotation.y = Math.PI; apO.visible = true; GIBO.position.set(KX - 0.6, 0, -1.9); TSUMA.visible = false;
  POT.visible = true; BEANS.visible = true; OTTO.userData.arms[1].rotation.set(-1.3 + Math.sin(t * 4) * 0.1, 0, -0.3);
  say(kuromame, t, 0.8, KX + 0.5, 1.6, -2.5, 0.45);
  setHud('夫も台所', '12月30日', 1); look(KX + 3.8, 1.85, -0.9, KX + 0.2, 1.3, -2.1, 50);
  return S;
}
function sDec31(t, d) { // 12月31日。夫は親戚15人分の皿を、ひとりで洗う。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX - 0.6, 0, -1.9); OTTO.rotation.y = Math.PI; apO.visible = true; TSUMA.visible = false; GIBO.visible = false;
  DISH.visible = DISH2.visible = true; DISH.userData.setN(1 - 0.5 * clamp(t / d)); OTTO.userData.arms.forEach(a => a.rotation.set(-1.0 + Math.sin(t * 7) * 0.1, 0, 0)); sweatO.userData.set(clamp((t - 1) / 0.6), t);
  say(juugo, t, 0.5, KX - 0.55, 1.9, -2.5, 0.6);
  setHud('夫も台所', '12月31日', 1); look(KX + 3.0, 1.85, -0.9, KX - 0.6, 1.3, -2.1, 50);
  return S;
}
function sJan1(t, d) { // 1月1日。夫は朝6時に起きて、雑煮の餅を焼く。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX + 0.5, 0, -1.9); OTTO.rotation.y = Math.PI; apO.visible = true; TSUMA.visible = false; GIBO.visible = false; OTTO.userData.head.rotation.x = 0.3;
  MOCHI.visible = true; MOCHI.userData.puff(clamp((t - 0.8) / 1.6));
  say(rokuji, t, 0.4, KX + 0.5, 2.1, -2.6, 0.6);
  setHud('夫も台所', '1月1日', 1); look(KX + 3.6, 1.85, -0.9, KX + 0.3, 1.25, -2.1, 50);
  return S;
}
function sKotatsu(t, d) { // 妻はこたつで、初めて義父と正月のテレビを見る。
  reset(); lift(120); OTTO.visible = false; TSUMA.position.set(KOX, 0, -1.1); TSUMA.rotation.y = 0; poseSit(TSUMA); TSUMA.position.y = -0.36; TSUMA.userData.head.rotation.y = -0.5;
  GIFU.userData.head.rotation.y = -0.6;
  if (t > d * 0.35) say(hajimete, t, d * 0.35, KOX, 1.85, -0.9, 1.4);
  const u = ease(clamp(t / d)); look(lerp(KOX + 0.6, KOX + 0.4, u), 1.7, lerp(2.4, 2.0, u), KOX - 0.2, 1.0, -0.6, 50);
  return S;
}
function sUchinoko(t, d) { // 義母は言う。うちの子に、こんなことさせて。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX - 0.2, 0, -1.6); OTTO.rotation.y = -Math.PI / 2 - 0.2; apO.visible = true; TSUMA.visible = false;
  GIBO.position.set(KX + 0.9, 0, -1.4); GIBO.rotation.y = -Math.PI / 2 + 0.3; GIBO.rotation.y = Math.PI * 1.45; GIBO.userData.arms[1].rotation.set(-0.8, 0, 0.3);
  say(uchinoko, t, 0.4, KX + 0.5, 2.15, -1.5, 1.4);
  look(KX + 0.3, 1.8, 1.9, KX + 0.4, 1.4, -1.7, 50);
  return S;
}
function sHitori(t, d) { // 夫は答える。母さん、毎年これをひとりでやってたの？
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX - 0.2, 0, -1.6); OTTO.rotation.y = Math.PI * 0.6; apO.visible = true; TSUMA.visible = false;
  GIBO.position.set(KX + 0.9, 0, -1.4); GIBO.rotation.y = Math.PI * 1.45; DISH.visible = true; DISH2.visible = true;
  if (t > d * 0.35) say(hitoride, t, d * 0.35, KX + 0.2, 2.15, -1.6, 1.4);
  look(KX + 0.4, 1.8, 1.9, KX + 0.35, 1.4, -1.7, 50);
  return S;
}
function sNaku(t, d) { // 義母が、初めて少し泣く。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX - 0.2, 0, -1.6); OTTO.rotation.y = Math.PI * 0.6; apO.visible = true; TSUMA.visible = false;
  GIBO.position.set(KX + 0.9, 0, -1.4); GIBO.rotation.y = Math.PI * 1.45; GIBO.userData.head.rotation.x = 0.25; GIBO.userData.arms[0].rotation.set(-1.9, 0, 0.3);
  GIBO.updateMatrixWorld(); TEARS.forEach((dr, i) => { dr.visible = t > 0.6; const u = ((t - 0.6) * 0.6 + i * 0.5) % 1; const v = new THREE.Vector3((i ? 1 : -1) * 0.085, 1.62 - u * 0.25, 0.22); GIBO.localToWorld(v); dr.position.copy(v); });
  const u = ease(clamp(t / d)); look(KX + lerp(0.4, 0.5, u), 1.75, lerp(1.2, 0.6, u), KX + 0.9, 1.55, -1.4, 50);
  return S;
}
function sKekka(t, d) { // 結果：夫も台所に立つことになって、一番休めたのは、妻ではなく義母だった。
  reset(); lift(120); stand(OTTO); OTTO.position.set(KX + 0.5, 0, -1.9); OTTO.rotation.y = Math.PI; apO.visible = true; MOCHI.visible = true; MOCHI.userData.puff(1);
  TSUMA.position.set(KOX, 0, -1.1); TSUMA.rotation.y = 0; poseSit(TSUMA); TSUMA.position.y = -0.36;
  GIBO.position.set(KOX + 0.9, 0, -0.2); GIBO.rotation.y = -Math.PI / 2; poseSit(GIBO); GIBO.position.y = -0.36; apG.visible = false; GIBO.userData.head.rotation.z = 0.15;
  if (t > d * 0.55) say(yasumeta, t, d * 0.55, KOX + 0.5, 2.0, -0.3, 1.5);
  wideCam(1 - ease(clamp(t / d)) * 0.4);
  return S;
}
function sGasshuku(t, d) { // 帰省は、嫁と義母が、息子のこたつを守るための、年に一度の合宿
  reset(); lift(120); OTTO.userData.head.rotation.x = -0.1; steam(t); TSUMA.userData.arms.forEach(a => a.rotation.set(-1.0 + Math.sin(t * 6) * 0.1, 0, 0)); GIBO.userData.arms.forEach(a => a.rotation.set(-1.0 + Math.sin(t * 6 + 1) * 0.1, 0, 0)); POT.visible = true;
  if (t > d * 0.5) say(gasshuku, t, d * 0.5, 0.3, 2.45, -1.2, 1.5);
  wideCam(0.6);
  return S;
}
function sAsk(t) { // 夫の実家の帰省、台所に立つのは誰？（冒頭と同じ構図。夫は台所に立ったまま）
  reset(); lift(0); stand(OTTO); OTTO.position.set(KX, 0, -1.9); OTTO.rotation.y = Math.PI; apO.visible = true; steam(t); wideCam(0);
  return S;
}

const NARR = { '義実家': 'ぎじっか', '夫': 'おっと', '妻': 'つま', '湯のみ': 'ゆのみ', '不満': 'ふまん', '台所': 'だいどころ', '12月30日': 'じゅうにがつさんじゅうにち', '12月31日': 'じゅうにがつさんじゅういちにち', '1月1日': 'いちがつついたち', '義母': 'ぎぼ', '義父': 'ぎふ', '黒豆': 'くろまめ', '煮る': 'にる', '親戚': 'しんせき', '15人分': 'じゅうごにんぶん', '皿': 'さら', '朝6時': 'あさろくじ', '雑煮': 'ぞうに', '餅': 'もち', '正月': 'しょうがつ', '母さん': 'かあさん', '毎年': 'まいとし', '結果：': '結果、', '一番': 'いちばん', '帰省': 'きせい', '嫁': 'よめ', '息子': 'むすこ', '合宿': 'がっしゅく', '年に一度': 'ねんにいちど' };
const P = planTimes([
  ['こたつに残った夫の湯のみが、<br>ポツンと置き去り。', sPotsun],
  ['妻たちの不満から。義実家では、<br>私だけが台所にいる。', sFuman],
  ['12月30日。夫は義母と並んで、<br>おせちの黒豆を煮る。', sDec30],
  ['12月31日。夫は親戚15人分の<br>皿を、ひとりで洗う。', sDec31],
  ['1月1日。夫は朝6時に起きて、<br>雑煮の餅を焼く。', sJan1],
  ['妻はこたつで、初めて義父と<br>正月のテレビを見る。', sKotatsu],
  ['義母は言う。うちの子に、<br>こんなことさせて。', sUchinoko],
  ['夫は答える。母さん、毎年<br>これをひとりでやってたの？', sHitori],
  ['義母が、初めて少し泣く。', sNaku],
  ['結果：夫も台所に<br>立つことになって、', (t, d) => sKekka(t, 2 * d)],
  ['一番休めたのは、<br>妻ではなく義母だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['帰省は、嫁と義母が、<br>息子のこたつを守るための、', sGasshuku],
  ['年に一度の合宿', (t, d) => sGasshuku(t + 3.0, d)],
  ['だったのかもしれない。', (t, d) => sGasshuku(t + 5.0, d)],
  ['夫の実家の帰省、<br>台所に立つのは誰？', sAsk],
], { shot0, endCard, start: 4.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0678',
    v2: true,
    tt: 'main',
    hookLine: '義実家のこたつに入った夫が、台所へビュンと吸い込まれる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも夫の実家に帰省したら、夫も台所に立つ決まりだったら？',
    titleHtml: 'もしも夫の実家に<br>帰省したら、夫も<br>台所に立つ<br>決まりだったら？',
    mood: 'emotional', seed: 678, hits: [TP, P.at(9), P.at(12)], risers: [P.at(6)], impacts: [P.at(3, 0.5), P.at(4, 0.4), P.at(7, 1.4), P.at(10, 0.6)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.8), 'poof'], [P.at(1, 0.6), 'buzz'], [P.at(2, 0.6), 'bubble'], [P.at(3, 0.5), 'bubble'], [P.at(4, 0.4), 'alarm'], [P.at(6, 0.4), 'meter', 0.3], [P.at(12, 0.3), 'whoosh']],
    narr: NARR,
    ask: '夫の実家の帰省、台所に立つのは誰？',
    caption: 'もしも夫の実家に帰省したら、夫も台所に立つ決まりだったら？\n\nこたつに残った夫の湯のみが、ポツンと置き去り。\n妻たちの不満から。義実家では、私だけが台所にいる。\n12月30日。夫は義母と並んで、おせちの黒豆を煮る。\n12月31日。夫は親戚15人分の皿を、ひとりで洗う。\n1月1日。夫は朝6時に起きて、雑煮の餅を焼く。\n妻はこたつで、初めて義父と正月のテレビを見る。\n義母は言う。うちの子に、こんなことさせて。\n夫は答える。母さん、毎年これをひとりでやってたの？\n義母が、初めて少し泣く。\n\n結果：夫も台所に立つことになって、一番休めたのは、妻ではなく義母だった。\n帰省は、嫁と義母が、息子のこたつを守るための、年に一度の合宿だったのかもしれない。\n\n夫の実家の帰省、台所に立つのは誰？ コメントで教えて。\n\n※風刺ネタです。夫も台所に立つ決まりは、もしもの設定です。登場する人物・家は架空です',
    hashtags: ['もしもラボ', 'もしも', '帰省', '義実家', 'お正月'],
    endStats: [['決まり', '夫も台所に立つ', 'もしもの設定'], ['一番休めたのは', '義母', 'もしもの結果'], ['帰省の正体', '年に一度の合宿', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
