import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, makeOji, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeKotatsu, makePochi, makeFridge, makeShelf, makeCounter } from '../scenes/home.js';

// もしもお年玉を親が預かれなくなったら？（皮肉回・台本 S70・図星／大人の本音）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：毎年正月に燃える お年玉は親が預かるべき？ の議論（ガルちゃん・知恵袋の定番。年末年始の前に出せる季節ネタ）
// 数字は使わない（お年玉の平均額は出さない）。親という立場を叩くので男女の偏りなし（母も父も気づく）
// 三段は 1月2日に数える→3日に自分で買う→4日に親戚に配った分が戻らない。言い換えは お年玉のおかえし。店・家は架空

const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.4;
const MOM = makeWoman({ shirt: '#e9b8c8', hair: '#4a3020', pants: '#4a4f60' }); S.add(MOM);
const DAD = makeMan({ shirt: '#59606e', hair: '#2c2421' }); S.add(DAD);
const KID = makeMan({ shirt: '#f2c14e', hair: '#1d1a19', pants: '#3a5a8a', scale: 0.6 }); S.add(KID);
const REL = [makeOji(rng(3), { shirt: '#7a6a55' }), makeWoman({ shirt: '#9fc7a8', hair: '#8a8a8a', pants: '#5a4a3a' })]; REL.forEach(p => S.add(p));

// ---------- A：親戚の家の居間（原点）：ポチ袋と透明な壁 ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3, wall: '#e8dcc0', floor: '#c9c48a' });
for (let i = 0; i < 4; i++) { const f = box(1.6, 2.2, 0.05, mat('#efe6cf')); f.position.set(-2.4 + i * 1.6, 1.1, -2.9); S.add(f); const fr = box(1.6, 2.2, 0.02, mat('#6b4a2f')); fr.scale.set(1.02, 1.02, 1); fr.position.set(-2.4 + i * 1.6, 1.1, -2.93); S.add(fr); }
const KOTA = makeKotatsu(); KOTA.position.set(0, 0, -0.6); S.add(KOTA);
const POCHI = makePochi('#e85a7a'); POCHI.scale.setScalar(1.6); S.add(POCHI);
const WALL = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), new THREE.MeshBasicMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); S.add(WALL);
const WALLF = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.9, 1.0)), new THREE.LineBasicMaterial({ color: '#d0f6ff' })); S.add(WALLF);
const sparkA = makeSparkles(120, 0.12, 0xbff4ff); S.add(sparkA.points);
const bachin = label('バチン', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,160,220,.96)', sx: 0.9 }); S.add(bachin);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.45 }); S.add(katamaru);
const azukaru = label('預かっておくね', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.5 }); S.add(azukaru);
const modoranai = label('二度と戻らない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(modoranai);

// ---------- B：子ども部屋（x=60）：数える ----------
const BX = 60;
const roomB = room({ x: BX, w: 6, d: 5, h: 3, wall: '#e6eef6', floor: '#b48a5e' });
const BILLS = []; for (let i = 0; i < 6; i++) { const b = box(0.32, 0.01, 0.16, mat(i % 2 ? '#c8b070' : '#d8c890')); S.add(b); BILLS.push(b); }
const POCHIS = [0, 1, 2].map(i => { const p = makePochi(['#e85a7a', '#5a9ae8', '#6ac46a'][i]); p.rotation.x = -Math.PI / 2; S.add(p); return p; });
const kazoeru = label('自分で数える', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(kazoeru);

// ---------- C：おもちゃ屋（x=120） ----------
const CX = 120;
flat(12, 8, '#e8e0d0', CX, 0);
const cWall = box(12, 3.2, 0.2, mat('#fff4e0')); cWall.position.set(CX, 1.6, -2.6); S.add(cWall);
const SHELF = makeShelf({ w: 4, h: 2.2, seed: 3 }); SHELF.position.set(CX, 0, -2.2); S.add(SHELF);
const shopSign = label('もしもトイ', { w: 640, size: 100, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 1.4 }); shopSign.position.set(CX, 2.85, -2.3); S.add(shopSign);
const WALLET = box(0.24, 0.16, 0.05, mat('#3a7fd0')); S.add(WALLET);
const jibunde = label('自分で買う', { w: 640, size: 110, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 1.1 }); S.add(jibunde);

// ---------- D：台所（x=180）：母が気づく・冷蔵庫のお肉 ----------
const DX = 180;
const roomD = room({ x: DX, w: 7, d: 5, h: 3, wall: '#efeae0', floor: '#cfd2d8' });
const CNT = makeCounter({ w: 3.6 }); CNT.position.set(DX - 0.8, 0, -2.0); S.add(CNT);
const FRIDGE = makeFridge(); FRIDGE.position.set(DX + 1.9, 0, -1.9); S.add(FRIDGE);
const MEAT = new THREE.Group(); { const tray = box(0.5, 0.05, 0.32, mat('#f4f4f2')); MEAT.add(tray); const m = box(0.42, 0.08, 0.26, mat('#d84a5a')); m.position.y = 0.06; MEAT.add(m); for (let i = 0; i < 5; i++) { const f = box(0.36, 0.01, 0.02, mat('#f8e8e8')); f.position.set(0, 0.105, -0.1 + i * 0.05); MEAT.add(f); } } MEAT.position.set(0, 1.12, 0.3); FRIDGE.userData.shelf.add(MEAT); MEAT.position.set(0, 1.12, -0.15);
const CAL = label('1月4日', { w: 512, size: 110, color: '#c8242c', bg: 'rgba(255,255,255,.97)', sx: 0.8 }); CAL.position.set(DX - 1.3, 2.3, -2.3); S.add(CAL);
const FLY = [0, 1, 2, 3].map(i => { const p = makePochi(['#e85a7a', '#5a9ae8', '#6ac46a', '#f2c14e'][i]); p.scale.setScalar(1.6); S.add(p); return p; });
const kaettekonai = label('1円も 帰ってこない', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(kaettekonai);
const kyonen = label('去年の分で 何を買った？', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.1 }); S.add(kyonen);
const doko = label('ねえ、去年の分は？', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.6 }); S.add(doko);
const oniku = label('ちょっといいお肉', { w: 900, size: 100, color: '#fff', bg: 'rgba(216,74,90,.97)', sx: 1.6 }); S.add(oniku);
const sweatM = makeSweat(); MOM.userData.head.add(sweatM);
const sweatD = makeSweat(); DAD.userData.head.add(sweatD);

// ---------- E：次の年・結果（原点の居間を使う） ----------
const sagaru = label('そっと下がる', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(sagaru);
const ARROW = new THREE.Group(); { const m = mat('#3a7fd0'); const sh = box(0.12, 0.6, 0.04, m); sh.position.y = 0.3; ARROW.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), m); hd.rotation.z = Math.PI; hd.position.y = -0.1; ARROW.add(hd); } S.add(ARROW);
const heru = label('一番減ったのは 親', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(heru);
const okaeshi = label('お年玉のおかえし', { w: 900, size: 100, color: '#fff', bg: 'rgba(232,90,122,.97)', sx: 1.6 }); S.add(okaeshi);

const PEOPLE = [MOM, DAD, KID, ...REL];
const LABELS = [bachin, katamaru, azukaru, modoranai, kazoeru, jibunde, kaettekonai, kyonen, doko, oniku, sagaru, heru, okaeshi];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatM.userData.set(0); sweatD.userData.set(0);
  WALL.visible = WALLF.visible = false; POCHI.visible = true; BILLS.forEach(b => b.visible = false); POCHIS.forEach(p => p.visible = false); WALLET.visible = false; FLY.forEach(p => p.visible = false); ARROW.visible = false; FRIDGE.userData.open(0);
  // 居間：親戚は奥、子どもは手前、母は右
  REL[0].position.set(-0.9, 0, -1.5); REL[1].position.set(0.5, 0, -1.6); REL.forEach(p => { poseSit(p); p.position.y = -0.34; });
  KID.position.set(-0.25, 0, 0.75); KID.rotation.y = 0.2; MOM.position.set(0.85, 0, 0.75); MOM.rotation.y = -0.6;
  POCHI.position.set(-0.02, 0.68, 0.95); POCHI.rotation.set(0, 0.3, 0); POCHI.visible = true;
  DAD.position.set(1.8, 0, -0.6); DAD.rotation.y = -0.6; poseSit(DAD); DAD.position.y = -0.34;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function livingCam(u = 0) { look(lerp(0.4, 0.3, u), lerp(1.9, 1.8, u), lerp(5.6, 5.0, u), 0.25, lerp(1.25, 1.1, u), 0.0, 46); }
function reach(k) { MOM.userData.arms[1].rotation.set(-1.4 * k, 0, -0.6 * k); MOM.userData.arms[0].rotation.set(-0.2, 0, 0); }
function shot0(t) { // 0秒＝サムネ：子どものポチ袋に伸びた母の手が、透明な壁でバチンと弾かれる
  reset(); lift(0); KID.userData.arms[0].rotation.set(-1.0, 0, -0.2);
  const k = t < TP ? clamp(0.8 + t / TP * 0.2) : Math.max(0.3, 1 - (t - TP) / 0.25 * 0.7); reach(k);
  WALL.visible = WALLF.visible = true; WALL.position.set(0.4, 1.0, 0.85); WALL.rotation.y = Math.PI / 2 - 0.2; WALLF.position.copy(WALL.position); WALLF.rotation.copy(WALL.rotation);
  WALL.material.opacity = t < TP ? 0.18 : 0.35 + 0.4 * clamp(1 - (t - TP) / 0.6);
  if (t > TP) { sparkA.init([[0.4, 1.0, 0.85]], 0.3, 0.8); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(bachin, t, TP, 0.6, 1.5, 0.9, 0.6); }
  livingCam(ease(clamp(t / 3)) * 0.4);
  return S;
}
function sKatamaru(t, d) { // 親戚の前で、母の笑顔が固まる。
  reset(); lift(120); reach(0.3); WALL.visible = WALLF.visible = true; WALL.position.set(0.4, 1.0, 0.85); WALL.rotation.y = Math.PI / 2 - 0.2; WALLF.position.copy(WALL.position); WALLF.rotation.copy(WALL.rotation); WALL.material.opacity = 0.3;
  if (t > 1.0) say(katamaru, t, 1.0, 1.0, 2.25, 0.75, 0.42);
  const u = ease(clamp(t / d)); look(lerp(-0.4, -0.2, u), 1.75, lerp(3.4, 2.9, u), 0.6, 1.45, 0.5, 50);
  return S;
}
function sFuman(t, d) { // 子どもたちの不満から。預かっておくね のお金は、二度と戻ってこなかった。
  reset(); lift(120); REL.forEach(p => p.visible = false); DAD.visible = false; reach(1.0); POCHI.position.set(0.55, 1.1, 0.95);
  if (t < d * 0.55) say(azukaru, t, 0.3, 0.6, 2.05, 0.75, 1.1); else say(modoranai, t, d * 0.55, 0.3, 2.05, 0.75, 1.2);
  KID.userData.head.rotation.x = -0.15; KID.rotation.y = -0.6;
  look(0.3, 1.6, 4.0, 0.3, 1.3, 0.6, 50);
  return S;
}
function sDay2(t, d) { // 1月2日。子どもが自分で、ポチ袋の中身を数える。
  reset(); lift(120); MOM.visible = DAD.visible = false; KID.position.set(BX, 0, -0.6); poseSit(KID); KID.position.y = -0.24; KID.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); KID.userData.head.rotation.x = 0.5;
  POCHIS.forEach((p, i) => { p.visible = true; p.position.set(BX - 0.45 + i * 0.3, 0.02, -0.1); });
  BILLS.forEach((b, i) => { const k = clamp((t - 0.3 - i * 0.3) / 0.25); b.visible = k > 0; b.position.set(BX + 0.25 + (i % 3) * 0.05, 0.01 + i * 0.012, 0.0 + (i % 2) * 0.03); });
  if (t > 1.6) say(kazoeru, t, 1.6, BX, 1.6, -0.4, 1.1);
  setHud('お正月', '1月2日', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(0.4, 0.2, u), lerp(1.7, 1.5, u), lerp(2.0, 1.6, u), BX, 0.5, -0.4, 50);
  return S;
}
function sDay3(t, d) { // 1月3日。子どもがおもちゃ屋で、自分で財布を開く。
  reset(); lift(120); MOM.visible = DAD.visible = false; KID.position.set(CX, 0, -0.6); KID.rotation.y = 0; KID.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); KID.userData.head.rotation.x = 0.4;
  WALLET.visible = true; WALLET.position.set(CX, 0.62, -0.2); WALLET.rotation.x = -0.6 * clamp((t - 0.5) / 0.4);
  if (t > 1.2) say(jibunde, t, 1.2, CX, 1.6, -0.4, 1.0);
  setHud('お正月', '1月3日', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(0.6, 0.3, u), 1.6, lerp(3.4, 2.9, u), CX, 0.9, -1.0, 50);
  return S;
}
function kitCam(u = 0) { look(DX + lerp(0.2, 0.0, u), 1.8, lerp(4.4, 3.9, u), DX - 0.2, 1.35, -1.0, 50); }
function sDay4(t, d) { // 1月4日。母は気づく。親戚に配った分が、1円も帰ってこない。
  reset(); lift(120); DAD.visible = KID.visible = false; MOM.position.set(DX - 0.6, 0, -0.4); MOM.rotation.y = 0; MOM.userData.head.rotation.x = 0.2 * clamp(t / 1); sweatM.userData.set(clamp((t - 1) / 0.6), t);
  FLY.forEach((p, i) => { const k = clamp((t - 0.4 - i * 0.25) / 1.4); p.visible = k > 0 && k < 1; p.position.set(DX - 0.6 + (i - 1.5) * 0.4 + k * (i - 1.5) * 1.2, 1.5 + k * 1.6, -0.4 - k * 1.0); p.rotation.z = k * 4 * (i % 2 ? 1 : -1); });
  if (t > d * 0.5) say(kaettekonai, t, d * 0.5, DX - 0.3, 2.45, -0.4, 1.7);
  setHud('お正月', '1月4日', 1); kitCam(ease(clamp(t / d)) * 0.6);
  return S;
}
function sDad(t, d) { // 父も気づく。去年の 預かったお年玉 で、何を買ったのか。
  reset(); lift(120); KID.visible = false; MOM.position.set(DX - 0.9, 0, -0.4); DAD.position.set(DX + 0.4, 0, -0.2); DAD.rotation.y = -0.3; DAD.position.y = 0; DAD.userData.legs.forEach(l => l.rotation.x = 0); DAD.userData.arms[1].rotation.set(-2.2, 0, 0.6); DAD.userData.head.rotation.z = 0.2; sweatD.userData.set(clamp((t - 0.8) / 0.6), t);
  say(kyonen, t, 0.5, DX - 0.1, 2.5, -0.4, 1.8);
  kitCam(0.6 + ease(clamp(t / d)) * 0.4);
  return S;
}
function sDoko(t, d) { // 子どもは聞く。ねえ、去年の分はどこ？
  reset(); lift(120); DAD.visible = false; MOM.position.set(DX - 0.4, 0, -0.5); MOM.rotation.y = 0.5; KID.position.set(DX + 0.6, 0, 0.3); KID.rotation.y = -0.9; KID.userData.head.rotation.x = -0.35; KID.userData.arms[1].rotation.set(-1.2, 0, 0);
  say(doko, t, 0.4, DX + 0.2, 1.75, 0.3, 1.2);
  look(DX + 0.3, 1.5, 3.4, DX + 0.1, 1.15, -0.2, 50);
  return S;
}
function sOniku(t, d) { // 母は答えられない。冷蔵庫の中の、ちょっといいお肉。
  reset(); lift(120); DAD.visible = KID.visible = false; MOM.position.set(DX + 0.9, 0, -0.6); MOM.rotation.y = 0.9; MOM.userData.head.rotation.x = 0.3; sweatM.userData.set(1, t);
  FRIDGE.userData.open(easeOut(clamp((t - 0.6) / 0.6)));
  if (t > d * 0.5) say(oniku, t, d * 0.5, DX + 1.9, 2.4, -1.2, 1.4);
  const u = ease(clamp(t / d)); look(DX + lerp(1.0, 1.7, u), 1.7, lerp(3.4, 1.4, u), DX + 1.9, 1.2, -1.9, 50);
  return S;
}
function sNextYear(t, d) { // 次の年。親戚どうしで、お年玉の額がそっと下がる。
  reset(); lift(120); MOM.userData.arms[1].rotation.set(-1.1, 0, 0); REL[0].userData.arms[1].rotation.set(-1.0, 0, 0);
  POCHI.position.set(0.0, 0.8, -0.4); POCHI.scale.setScalar(1.6 * (1 - 0.45 * easeOut(clamp((t - 0.8) / 1.2))));
  ARROW.visible = t > 1.0; ARROW.position.set(0.55, lerp(2.0, 1.6, clamp((t - 1.0) / 0.8)), -0.4); if (t > 1.6) say(sagaru, t, 1.6, 0.0, 2.4, -0.4, 1.2);
  setHud('次の年', 'お正月', 1); livingCam(1);
  return S;
}
function sKekka(t, d) { // 結果：お年玉を預かれなくなって、一番お金が減ったのは子どもではなく親だった。
  reset(); lift(120); REL.forEach(p => p.visible = false); KID.position.set(-0.6, 0, 0.6); KID.userData.arms[0].rotation.set(0, 0, -2.4); KID.userData.arms[1].rotation.set(0, 0, 2.4); KID.position.y = Math.abs(Math.sin(t * 5)) * 0.08;
  MOM.position.set(0.5, 0, 0.6); MOM.rotation.y = 0; MOM.userData.head.rotation.x = 0.35; DAD.position.set(1.4, 0, 0.5); DAD.rotation.y = 0; DAD.position.y = 0; DAD.userData.legs.forEach(l => l.rotation.x = 0); DAD.userData.head.rotation.x = 0.35;
  if (t > d * 0.45) say(heru, t, d * 0.45, 0.9, 2.45, 0.5, 1.7);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.5, u), lerp(2.2, 1.9, u), lerp(5.8, 4.6, u), 0.4, 1.3, 0.4, 50);
  return S;
}
function sOkaeshi(t, d) { // 預かっておくね は、親が自分に払っていた、お年玉のおかえし
  reset(); lift(120); REL.forEach(p => p.visible = false); DAD.visible = false; KID.visible = false; MOM.position.set(0.3, 0, 0.6); MOM.rotation.y = 0;
  MOM.userData.arms[1].rotation.set(-0.9, 0, -0.2); POCHI.position.set(0.32, 0.95 + Math.sin(t * 2) * 0.03, 1.15); POCHI.rotation.set(0, 0, 0);
  if (t > 1.0) say(okaeshi, t, 1.0, 0.3, 2.12, 0.6, 1.2);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.5, u), 1.7, lerp(4.4, 3.8, u), 0.3, 1.4, 0.6, 50);
  return S;
}
function sAsk(t) { // 子どものころのお年玉、親に預けてた？（冒頭と同じ構図。手は弾かれたまま）
  reset(); lift(0); KID.userData.arms[0].rotation.set(-1.0, 0, -0.2); reach(0.3);
  WALL.visible = WALLF.visible = true; WALL.position.set(0.4, 1.0, 0.85); WALL.rotation.y = Math.PI / 2 - 0.2; WALLF.position.copy(WALL.position); WALLF.rotation.copy(WALL.rotation); WALL.material.opacity = 0.35;
  livingCam(0);
  return S;
}

const NARR = { '親戚': 'しんせき', '母': 'はは', '父': 'ちち', '笑顔': 'えがお', '不満': 'ふまん', '預かっておくね': 'あずかっておくね', '預かった': 'あずかった', '預かれなく': 'あずかれなく', '二度と': 'にどと', '1月2日': 'いちがつふつか', '1月3日': 'いちがつみっか', '1月4日': 'いちがつよっか', '中身': 'なかみ', '1円': 'いちえん', '去年': 'きょねん', 'お年玉': 'おとしだま', '冷蔵庫': 'れいぞうこ', '次の年': 'つぎのとし', '額': 'がく', '結果：': '結果、', '一番': 'いちばん', '子ども': 'こども' };
const P = planTimes([
  ['親戚の前で、<br>母の笑顔が固まる。', sKatamaru],
  ['子どもたちの不満から。', (t, d) => sFuman(t, 2.6 * d)],
  ['預かっておくね のお金は、<br>二度と戻ってこなかった。', (t, d) => sFuman(t + 1.0, 2.6 * d)],
  ['1月2日。子どもが自分で、<br>ポチ袋の中身を数える。', sDay2],
  ['1月3日。子どもがおもちゃ屋で、<br>自分で財布を開く。', sDay3],
  ['1月4日。母は気づく。', (t, d) => sDay4(t, 2.4 * d)],
  ['親戚に配った分が、<br>1円も帰ってこない。', (t, d) => sDay4(t + 1.2, 2.4 * d)],
  ['父も気づく。', (t, d) => sDad(t, 2.6 * d)],
  ['去年の 預かったお年玉 で、<br>何を買ったのか。', (t, d) => sDad(t + 1.0, 2.6 * d)],
  ['子どもは聞く。<br>ねえ、去年の分はどこ？', sDoko],
  ['母は答えられない。冷蔵庫の<br>中の、ちょっといいお肉。', sOniku],
  ['次の年。親戚どうしで、<br>お年玉の額がそっと下がる。', sNextYear],
  ['結果：お年玉を<br>預かれなくなって、', (t, d) => sKekka(t, 2 * d)],
  ['一番お金が減ったのは<br>子どもではなく親だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['預かっておくね は、親が<br>自分に払っていた、', sOkaeshi],
  ['お年玉のおかえし', (t, d) => sOkaeshi(t + 2.5, d)],
  ['だったのかもしれない。', (t, d) => sOkaeshi(t + 4.5, d + 2)],
  ['子どものころのお年玉、<br>親に預けてた？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0674',
    v2: true,
    tt: 'main',
    hookLine: '子どものポチ袋に伸びた母の手が、透明な壁でバチンと弾かれる。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもお年玉を親が預かれなくなったら？',
    titleHtml: 'もしもお年玉を<br>親が預かれなく<br>なったら？',
    mood: 'tension', seed: 674, hits: [TP, P.at(12), P.at(15)], risers: [P.at(7)], impacts: [P.at(6, 0.5), P.at(10, 1.4), P.at(11, 1.6)],
    sfx: [[TP, 'poof'], [P.at(0, 1.0), 'buzz'], [P.at(3, 0.4), 'bubble'], [P.at(4, 0.6), 'whoosh'], [P.at(5, 0.5), 'whoosh'], [P.at(7, 0.6), 'meter', 0.4], [P.at(10, 0.7), 'whoosh'], [P.at(11, 1.0), 'poof']],
    narr: NARR,
    ask: '子どものころのお年玉、親に預けてた？',
    caption: 'もしもお年玉を親が預かれなくなったら？\n\n親戚の前で、母の笑顔が固まる。\n子どもたちの不満から。預かっておくね のお金は、二度と戻ってこなかった。\n1月2日。子どもが自分で、ポチ袋の中身を数える。\n1月3日。子どもがおもちゃ屋で、自分で財布を開く。\n1月4日。母は気づく。親戚に配った分が、1円も帰ってこない。\n父も気づく。去年の 預かったお年玉 で、何を買ったのか。\n子どもは聞く。ねえ、去年の分はどこ？\n母は答えられない。冷蔵庫の中の、ちょっといいお肉。\n次の年。親戚どうしで、お年玉の額がそっと下がる。\n\n結果：お年玉を預かれなくなって、一番お金が減ったのは子どもではなく親だった。\n預かっておくね は、親が自分に払っていた、お年玉のおかえしだったのかもしれない。\n\n子どものころのお年玉、親に預けてた？ コメントで教えて。\n\n※風刺ネタです。親が預かれなくなるのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', 'お年玉', 'お正月', '親あるある'],
    endStats: [['変わったこと', '親が預かれない', 'もしもの設定'], ['一番お金が減ったのは', '親', 'もしもの結果'], ['預かっておくね の正体', 'お年玉のおかえし', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
