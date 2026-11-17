import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { highway, setHighwayEnv, makeHwCar, laneX } from '../scenes/highway.js';
import { makeSet, makeKotatsu } from '../scenes/home.js';

// もしも煽り運転すると、車の屋根に 煽ってます と出たら？（皮肉回・台本 S98・図星／大人の本音）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。0639 出禁・S96 と同じ 嫌われ役が札を付けられる 型を運転で。後半で 追い越し車線をふさぐ側 にも返す両叩き
// 数字は使わない（妨害運転の件数・罰則の数字は出さない）。実在の車種・ロゴ・ナンバー・道路の名前は出さない。事故やぶつかる絵は出さない
// 車は左側通行に合わせて、z = -2.2（右の追い越し車線）・-5.6・-9.0（左）を +x へ走らせる。カメラは後ろから見て、右が中央分離帯

const S = highway; setHighwayEnv('day');
const GOLD = '#ffd27a', RED = '#ff5a5a';
const LN = [-2.2, -5.6, -9.0];
function carWithDriver(color, drv) { const c = makeHwCar(color); if (drv) { const head = box(0.42, 0.44, 0.4, mat('#f1c9a5')); head.position.set(0.2, 1.55, 0.35); c.add(head); const hair = box(0.44, 0.12, 0.42, mat(drv)); hair.position.set(0.2, 1.8, 0.35); c.add(hair); } S.add(c); return c; }
const AORI = carWithDriver('#3a3e48', '#9a9a9a'); // 煽る車（温厚そうなおじさん）
const MAE = carWithDriver('#e8e4dc', '#3a2620'); // 煽られる前の車
const NORO = carWithDriver('#7a9a6a', '#4a3426'); // 追い越し車線をのろのろ
const TRAFFIC = ['#c84a4a', '#4a7ac8', '#e8c23a', '#9aa0aa', '#5a8a5a', '#d87a3a', '#8a5ab0', '#f4f4f2'].map(c => carWithDriver(c, '#2a2220'));
function roofSign(text, bg) { const l = label(text, { w: 768, size: 110, color: '#fff', bg, sx: 3.0 }); S.add(l); return l; }
const SIGN_A = roofSign('煽ってます', 'rgba(214,30,40,.98)');
const SIGN_N = roofSign('道ふさいでます', 'rgba(230,120,20,.98)');
const SIGNS_T = [0, 1, 2].map(() => roofSign('煽ってます', 'rgba(214,30,40,.98)'));
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.6 }); S.add(pa);
const shakan = label('すっと 車間', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 3.2 }); S.add(shakan);
const hidari = label('あわてて 左へ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 3.2 }); S.add(hidari);
const shizuka = label('静かに 流れる', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 3.6 }); S.add(shizuka);
const dake = label('煽る車 だけじゃない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 4.2 }); S.add(dake);
const mouhitori = label('もう一人の 自分', { w: 900, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 3.8 }); S.add(mouhitori);
function placeSign(sg, car, k = 1, t = 0) { sg.visible = k > 0; car.updateMatrixWorld(); const v = new THREE.Vector3(-0.2, 2.6, 0); car.localToWorld(v); sg.position.copy(v); const s = sg.userData.sx * sg.userData.fit * (k >= 1 ? 1 : easeOut(k)); sg.scale.set(s * 0.8, s * 0.8 * sg.userData.ar, 1); }

// ---------- 車の中（別のセット。x=-400 の空中） ----------
const IX = -400, IY = 50;
const CAB = new THREE.Group(); CAB.position.set(IX, IY, 0); S.add(CAB);
{ const fl = box(3, 0.1, 3, mat('#2a2e38')); CAB.add(fl); const dash = box(2.4, 0.5, 0.6, mat('#3a3e48')); dash.position.set(0, 1.0, -1.0); CAB.add(dash); const seat = box(0.7, 0.5, 0.7, mat('#4a4f5a')); seat.position.set(0, 0.45, 0.3); CAB.add(seat); const back = box(0.7, 1.0, 0.15, mat('#4a4f5a')); back.position.set(0, 1.0, 0.7); CAB.add(back); const glass = box(2.4, 0.9, 0.04, new THREE.MeshBasicMaterial({ color: '#cfe4f4', transparent: true, opacity: 0.35 })); glass.position.set(0, 1.75, -1.25); glass.rotation.x = -0.4; CAB.add(glass); const roof = box(2.4, 0.06, 1.6, mat('#3a3e48')); roof.position.set(0, 2.3, -0.2); CAB.add(roof); }
const WHEEL = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 24), mat('#1a1c22')); WHEEL.position.set(0, 1.2, -0.35); WHEEL.rotation.x = -0.5; CAB.add(WHEEL);
const HORN = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), mat('#5a5f6a')); HORN.rotation.x = Math.PI / 2; HORN.position.copy(WHEEL.position); HORN.rotation.x = Math.PI / 2 - 0.5; CAB.add(HORN);
const LEVER = box(0.22, 0.03, 0.03, mat('#5a5f6a')); LEVER.position.set(-0.28, 1.18, -0.35); CAB.add(LEVER);
const MIRROR = new THREE.Group(); { const f = box(0.42, 0.14, 0.04, mat('#1a1c22')); MIRROR.add(f); const c = document.createElement('canvas'); c.width = 256; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#9ab8d0'; g.fillRect(0, 0, 256, 80); g.fillStyle = '#d61e28'; g.fillRect(40, 18, 176, 44); g.fillStyle = '#fff'; g.font = '900 30px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('煽ってます', 128, 51); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.11), new THREE.MeshBasicMaterial({ map: tx })); m.position.z = 0.025; MIRROR.add(m); } MIRROR.position.set(0.3, 1.95, -0.95); MIRROR.scale.setScalar(1.6); CAB.add(MIRROR);
const DRV = makeOji(rng(12), { shirt: '#6a7a8a', bald: true }); CAB.add(DRV); DRV.position.set(0, 0.25, 0.3); DRV.rotation.y = Math.PI; // 前は -z
const sweat = makeSweat(); DRV.userData.head.add(sweat);
const pita = label('ピタッ', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.4 }); S.add(pita);
const sotto = label('そっと 戻す', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.6 }); S.add(sotto);
const kao = label('顔が 見えないと 思って', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.85 }); S.add(kao);
const PASS = new THREE.PointLight(0xfff6d0, 0, 3); S.add(PASS);

// ---------- 家と試着室（makeSet の別シーン） ----------
const H = makeSet({ bg: '#efe6d6', ground: '#c9b8a0' }); const HS = H.S; H.hemi.intensity = 1.3;
H.room({ x: 0, w: 8, d: 6, h: 3, wall: '#efe6d6', floor: '#c9b8a0' });
const KOT = makeKotatsu(); KOT.position.set(0, 0, -1.4); HS.add(KOT);
const PAPA = makeOji(rng(12), { shirt: '#6a7a8a', bald: true }); HS.add(PAPA);
const KID = makeMan({ shirt: '#f2a03a', hair: '#2a1a14', scale: 0.6 }); HS.add(KID);
const MAMA = makeWoman({ shirt: '#8fb87a', hair: '#3a2620', scale: 0.95 }); HS.add(MAMA);
const onkou = label('温厚な お父さん', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); HS.add(onkou);
// 試着室（x=30）
const FX = 30; H.room({ x: FX, w: 8, d: 6, h: 3.2, wall: '#f2eef4', floor: '#d8d0c8' });
const BOOTH = new THREE.Group(); { const bk = box(1.4, 2.4, 0.08, mat('#e8e0ea')); bk.position.set(0, 1.2, -0.7); BOOTH.add(bk); for (const s of [-1, 1]) { const sd = box(0.08, 2.4, 1.4, mat('#e8e0ea')); sd.position.set(s * 0.7, 1.2, 0); BOOTH.add(sd); } const rod = box(1.5, 0.04, 0.04, mat('#b8bec6')); rod.position.set(0, 2.45, 0.7); BOOTH.add(rod); } BOOTH.position.set(FX, 0, -1.6); HS.add(BOOTH);
const CURTAIN = box(1.4, 2.3, 0.04, mat('#c8486a')); HS.add(CURTAIN);
const DOOR = box(1.1, 1.0, 0.1, mat('#3a3e48')); HS.add(DOOR); const DWIN = box(0.9, 0.5, 0.11, new THREE.MeshBasicMaterial({ color: '#2a3442' })); HS.add(DWIN);
const PAPA2 = makeOji(rng(12), { shirt: '#6a7a8a', bald: true }); HS.add(PAPA2);
const curtain = label('試着室の カーテン', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,72,106,.97)', sx: 1.2 }); HS.add(curtain);
const tsuyoki = label('強気', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); HS.add(tsuyoki);

const HW_LABELS = [SIGN_A, SIGN_N, ...SIGNS_T, pa, shakan, hidari, shizuka, dake, mouhitori, pita, sotto, kao];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); }
function reset() {
  HW_LABELS.forEach(l => l.visible = false); [onkou, curtain, tsuyoki].forEach(l => l.visible = false); PAPA2.visible = false; el.flash.style.opacity = 0; sweat.userData.set(0); PASS.intensity = 0;
  [AORI, MAE, NORO, ...TRAFFIC].forEach(c => { c.visible = false; c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); });
  clearP(DRV); poseSit(DRV); DRV.position.set(0, -0.15, 0.3); DRV.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); LEVER.rotation.z = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function car(c, x, z) { c.visible = true; c.position.set(x, 0, z); }
const TP = 0.3;
function behind(x, z, u = 0, h = 3.6, back = 11) { look(x - back + u * 1.0, h, z + 1.4, x + 4, 0.2, z - 0.3, 50); }
function tailScene(t, gap = 4.6) { const x = t * 2; car(MAE, x + 4.0 + gap, LN[1]); car(AORI, x, LN[1]); car(TRAFFIC[0], x - 18, LN[0]); car(TRAFFIC[1], x + 22, LN[2]); return x; }
function shot0(t) { // 0秒＝サムネ：前の車に張り付く車の屋根に、赤い 煽ってます の電光板がパッと点く
  reset(); lift(0); const x = tailScene(t, 0.6);
  if (t > TP) { placeSign(SIGN_A, AORI, clamp((t - TP) / 0.2), t); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; }
  look(x - 6.5 + ease(clamp(t / 3)) * 0.3, 6.2, LN[1] + 1.3, x + 2.5, 1.9, LN[1] - 0.2, 50);
  return S;
}
function cabCam(u = 0) { look(IX - lerp(0.45, 0.35, u), IY + 2.05, lerp(1.4, 1.2, u), IX + 0.15, IY + 1.8, -0.7, 50); }
function sMirror(t, d) { // 運転席の温厚そうなおじさんが、ミラーに映る自分の屋根を見て固まる
  reset(); lift(120); DRV.userData.head.rotation.x = -0.25; if (t > d * 0.4) sweat.userData.set(1, t);
  cabCam(ease(clamp(t / d)));
  return S;
}
function sKao(t, d) { // 煽られた人たちの不満から。顔が見えないと思って、やりたい放題
  reset(); lift(120); const x = tailScene(t, 0.6); placeSign(SIGN_A, AORI);
  if (t > 0.4) say(kao, t, 0.4, MAE.position.x - 1.0, 3.0, LN[1] - 2.0, 3.4);
  look(x + 12, 2.6, LN[1] - 5, x + 3, 1.4, LN[1], 50);
  return S;
}
function sGap(t, d) { // 1台目。屋根が光った車が、すっと車間をあける
  reset(); lift(120); const g = lerp(0.6, 8, easeOut(clamp((t - 0.3) / (d * 0.6)))); const x = tailScene(t, g); placeSign(SIGN_A, AORI);
  if (t > d * 0.5) say(shakan, t, d * 0.5, x + 4 + g / 2, 1.5, LN[1], 2.4);
  setHud('屋根の札', '1台目', 1);
  look(x - 9, 8, LN[1] + 3, x + 4, 0.3, LN[1], 50);
  return S;
}
function sPass(t, d) { // 2台目。パッシングしかけた手が、ピタッと止まる
  reset(); lift(120); const k = clamp((t - 0.2) / (d * 0.35)); DRV.userData.arms[0].rotation.set(lerp(-1.3, -1.45, k), 0, lerp(0, 0.35, k)); LEVER.rotation.z = k > 0.95 ? 0 : 0;
  if (t > d * 0.45) { pita.visible = true; pita.position.set(IX - 0.3, IY + 1.6, -0.35); pop(pita, t, d * 0.45, 0.25, 0.3); }
  setHud('屋根の札', '2台目', 1);
  look(IX - 1.4, IY + 1.65, -1.4, IX - 0.1, IY + 1.4, -0.2, 50);
  return S;
}
function sHorn(t, d) { // 3台目。クラクションに伸びた手を、そっとハンドルに戻す
  reset(); lift(120); const k = t < d * 0.4 ? clamp(t / (d * 0.4)) : 1 - clamp((t - d * 0.5) / (d * 0.3)); DRV.userData.arms[1].rotation.set(lerp(-1.3, -1.5, k), 0, lerp(0, -0.3, k));
  if (t > d * 0.55) { sotto.position.set(IX + 0.1, IY + 2.0, -0.4); pop(sotto, t, d * 0.55, 0.25, 0.4); }
  setHud('屋根の札', '3台目', 1);
  look(IX + 1.4, IY + 1.65, -1.4, IX, IY + 1.4, -0.2, 50);
  return S;
}
function noroScene(t, glow, sw = 0) { const x = t * 1.2; car(NORO, x, lerp(LN[0], LN[1], sw)); NORO.rotation.y = -Math.sin(sw * Math.PI) * 0.15; [0, 1, 2].forEach(i => car(TRAFFIC[2 + i], x - 7 - i * 6.5, LN[0])); car(TRAFFIC[5], x + 10, LN[2]); if (glow > 0) placeSign(SIGN_N, NORO, glow); return x; }
function sDake(t, d) { // でも、屋根が光ったのは、煽る車だけじゃなかった
  reset(); lift(120); const x = noroScene(t, 0);
  if (t > d * 0.4) say(dake, t, d * 0.4, x - 8, 4.2, LN[0], 3.6);
  look(x - 26, 5.0, LN[0] + 3, x - 4, 1.0, LN[0] - 0.5, 50);
  return S;
}
function sNoro(t, d) { // 追い越し車線を、ずっとのろのろ走る車の屋根にも 道ふさいでます
  reset(); lift(120); const x = noroScene(t, clamp((t - d * 0.45) / 0.2)); if (t > d * 0.45) el.flash.style.opacity = t < d * 0.45 + 0.08 ? 0.2 : 0;
  look(x - 14, 4.5, LN[0] + 2.4, x - 1, 1.3, LN[0] - 0.3, 50);
  return S;
}
function sHidari(t, d) { // マイペースな運転手が、あわてて左に寄る
  reset(); lift(120); const sw = easeOut(clamp((t - 0.3) / (d * 0.55))); const x = noroScene(t, 1, sw);
  if (t > d * 0.55) say(hidari, t, d * 0.55, x, 4.2, NORO.position.z, 2.6);
  look(x - 14, 5.5, LN[0] + 3.5, x - 1, 1.0, LN[1] + 0.5, 50);
  return S;
}
function sNagare(t, d) { // 1か月後。高速道路が、なぜか静かに流れ始める
  reset(); lift(120); TRAFFIC.forEach((c, i) => car(c, laneX(t, 9, i * 40, 1, 320), LN[i % 3])); car(AORI, laneX(t, 9, 22, 1, 320), LN[1]);
  if (t > d * 0.45) say(shizuka, t, d * 0.45, 0, 7.5, -5.6, 5.0);
  setHud('屋根の札', '1か月後', 1);
  look(-22, 14, 16, 0, 0, -5.6, 50);
  return S;
}
function sPapa(t, d) { // おじさんは家に帰ると、いつもの温厚なお父さんに戻る
  reset(); lift(120); clearP(PAPA); PAPA.position.set(-0.3, 0, -0.5); PAPA.rotation.y = 0.2; PAPA.userData.arms[1].rotation.set(-1.3, 0, 0.6);
  KID.position.set(0.45, 0, -0.35); KID.rotation.y = -0.8; KID.userData.arms[0].rotation.set(-2.6 + Math.sin(t * 6) * 0.2, 0, 0);
  MAMA.position.set(0.9, 0, -1.9); MAMA.rotation.y = -0.4;
  if (t > d * 0.4) say(onkou, t, d * 0.4, 0.0, 2.3, -0.6, 0.85);
  look(0.3, 1.75, 3.3, 0.1, 1.2, -0.8, 50);
  return HS;
}
function sKekka(t, d) { // 結果：煽り運転に札が付いて、消えたのは車間の詰まりじゃなく、顔が見えないときだけ出てくる、もう一人の自分だった
  reset(); lift(120); const x = tailScene(t, 8); placeSign(SIGN_A, AORI);
  if (t > d * 0.55) say(mouhitori, t, d * 0.55, x, 3.7, LN[1], 3.0);
  setTop('結果', 'もう一人の自分', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); behind(x, LN[1], u, 4.0, 10 + u * 3);
  return S;
}
function sCurtain(t, d) { // 車のドアは、温厚な人が強気になれる、試着室のカーテンだったのかもしれない
  reset(); lift(120); const k = clamp((t - d * 0.3) / 0.6);
  PAPA2.visible = true; PAPA2.position.set(FX, 0, -1.6); PAPA2.rotation.y = 0; clearP(PAPA2); PAPA2.userData.arms[1].rotation.set(-2.3 * (1 - k * 0.0), 0, 0);
  CURTAIN.position.set(FX - 0.7 + 0.7 * easeOut(k) * 1, 1.25, -0.88); CURTAIN.scale.x = Math.max(0.02, easeOut(k)); CURTAIN.position.x = FX - 0.7 + 0.7 * CURTAIN.scale.x;
  DOOR.position.set(FX + 1.6, 0.9, -1.0); DWIN.position.set(FX + 1.6, 1.15, -0.99); DOOR.visible = DWIN.visible = true;
  if (k > 0.6) say(curtain, t, d * 0.3 + 0.4, FX, 2.45, -0.8, 1.0); else if (t > 0.2) say(tsuyoki, t, 0.2, FX, 2.55, -1.4, 0.45);
  look(FX + 0.7, 1.75, 3.8, FX + 0.4, 1.35, -1.0, 50);
  return HS;
}
function sAsk(t) { reset(); lift(0); const x = tailScene(0, 0.6); placeSign(SIGN_A, AORI); look(x - 6.5, 6.2, LN[1] + 1.3, x + 2.5, 1.9, LN[1] - 0.2, 50); return S; }

const NARR = { '運転席': 'うんてんせき', '温厚': 'おんこう', '映る': 'うつる', '自分': 'じぶん', '屋根': 'やね', '固まる': 'かたまる', '煽られた': 'あおられた', '不満': 'ふまん', '顔': 'かお', '見えない': 'みえない', '思って': 'おもって', '放題': 'ほうだい', '1台目': 'いちだいめ', '光った': 'ひかった', '車間': 'しゃかん', '2台目': 'にだいめ', '手': 'て', '止まる': 'とまる', '3台目': 'さんだいめ', '伸びた': 'のびた', '戻す': 'もどす', '煽る': 'あおる', '車': 'くるま', '追い越し車線': 'おいこししゃせん', '走る': 'はしる', '道ふさいでます': 'みちふさいでます', '運転手': 'うんてんしゅ', '左': 'ひだり', '寄る': 'よる', '1か月後': 'いっかげつご', '高速道路': 'こうそくどうろ', '静か': 'しずか', '流れ始める': 'ながれはじめる', '家': 'いえ', '帰る': 'かえる', '戻る': 'もどる', '結果：': '結果、', '煽り運転': 'あおりうんてん', '札': 'ふだ', '付いて': 'ついて', '詰まり': 'つまり', '出てくる': 'でてくる', '一人': 'ひとり', '強気': 'つよき', '試着室': 'しちゃくしつ' };
const P = planTimes([
  ['運転席の温厚そうなおじさんが、', (t, d) => sMirror(t, 2 * d)],
  ['ミラーに映る自分の屋根を<br>見て固まる。', (t, d) => sMirror(t + d, 2 * d)],
  ['煽られた人たちの不満から。', (t, d) => sKao(t, 2 * d)],
  ['顔が見えないと思って、<br>やりたい放題。', (t, d) => sKao(t + d, 2 * d)],
  ['1台目。屋根が光った車が、<br>すっと車間をあける。', sGap],
  ['2台目。パッシングしかけた<br>手が、ピタッと止まる。', sPass],
  ['3台目。クラクションに伸びた<br>手を、そっとハンドルに戻す。', sHorn],
  ['でも、屋根が光ったのは、<br>煽る車だけじゃなかった。', sDake],
  ['追い越し車線を、ずっと<br>のろのろ走る車の屋根にも、', (t, d) => sNoro(t, 2 * d)],
  ['道ふさいでます。', (t, d) => sNoro(t + d, 2 * d)],
  ['マイペースな運転手が、<br>あわてて左に寄る。', sHidari],
  ['1か月後。高速道路が、<br>なぜか静かに流れ始める。', sNagare],
  ['おじさんは家に帰ると、<br>いつもの温厚なお父さんに戻る。', sPapa],
  ['結果：煽り運転に札が付いて、', (t, d) => sKekka(t, 3 * d)],
  ['消えたのは車間の<br>詰まりじゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['顔が見えないときだけ出てくる、<br>もう一人の自分だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['車のドアは、温厚な人が<br>強気になれる、', (t, d) => sCurtain(t, 2 * d)],
  ['試着室のカーテン<br>だったのかもしれない。', (t, d) => sCurtain(t + d, 2 * d)],
  ['煽られたこと、ある？', sAsk],
], { shot0, endCard, start: 3.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0694',
    v2: true,
    tt: 'main',
    hookLine: '前の車に張り付く車の屋根に、赤い 煽ってます の電光板がパッと点く。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも煽り運転すると、車の屋根に 煽ってます と出たら？',
    titleHtml: 'もしも煽り運転<br>すると、車の屋根に<br>煽ってます<br>と出たら？',
    mood: 'tension', seed: 694, hits: [TP, P.at(5, 1.0), P.at(9, 0.2), P.at(13)], risers: [P.at(7)], impacts: [P.at(15, 0.6)],
    sfx: [[TP, 'alarm'], [P.at(0, 0.8), 'meter', 0.3], [P.at(4, 0.6), 'whoosh'], [P.at(10, 0.5), 'whoosh'], [P.at(17, 0.4), 'poof']],
    narr: NARR,
    ask: '煽られたこと、ある？',
    caption: 'もしも煽り運転すると、車の屋根に 煽ってます と出たら？\n\n運転席の温厚そうなおじさんが、ミラーに映る自分の屋根を見て固まる。\n煽られた人たちの不満から。顔が見えないと思って、やりたい放題。\n1台目。屋根が光った車が、すっと車間をあける。\n2台目。パッシングしかけた手が、ピタッと止まる。\n3台目。クラクションに伸びた手を、そっとハンドルに戻す。\nでも、屋根が光ったのは、煽る車だけじゃなかった。\n追い越し車線を、ずっとのろのろ走る車の屋根にも 道ふさいでます。\nマイペースな運転手が、あわてて左に寄る。\n1か月後。高速道路が、なぜか静かに流れ始める。\nおじさんは家に帰ると、いつもの温厚なお父さんに戻る。\n\n結果：煽り運転に札が付いて、消えたのは車間の詰まりじゃなく、顔が見えないときだけ出てくる、もう一人の自分だった。\n車のドアは、温厚な人が強気になれる、試着室のカーテンだったのかもしれない。\n\n煽られたこと、ある？ コメントで教えて。\n\n※風刺ネタです。屋根に札が出るのは、もしもの設定です。登場する人物・車は架空です',
    hashtags: ['もしもラボ', 'もしも', '煽り運転', '高速道路', '運転あるある'],
    endStats: [['屋根に出るのは', '煽ってます', 'もしもの設定'], ['消えたのは', 'もう一人の自分', 'もしもの結果'], ['車のドアの正体', '試着室のカーテン', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
