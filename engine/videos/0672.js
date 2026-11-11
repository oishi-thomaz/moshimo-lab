import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makePhone, makeShop } from '../satire-kit.js';
import { makeSuit, makeDeskIsland, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBench, makeTrash, makeTable, makeKotatsu } from '../scenes/home.js';

// もしもキャバクラが全部閉店したら？（皮肉回・台本 S68・沼が消えたら・作り直し 0627）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。plan/remake.md の3：0627 キャバクラが消えたら（インスタ18.3万・TikTok 8,700、平均視聴20.7秒）
// 作り直しの入り：消えた → 嫁は大喜び → おぢが行き場を探す（20時の地図・21時のベンチ・22時の帰宅）を3秒ずつ先に。数字は20秒より後
// 数字（0627 で確認済み）：接待をする飲食店（風営法1号営業）の許可数 59,516件（2024年末・警察庁「令和6年における風俗営業等の現状」）
//  1号営業にはキャバクラのほかホストクラブ・接待のあるスナックなども入るので、画面では 接待をする飲食店 と言う
// 店内・キャストは出さない（おぢの姿だけ）。店の名前は架空

const NEON = ['#ff5fae', '#c58bff', '#7fd4ff', '#ffd27a'];
const { S, flat, room, hemi, sun } = makeSet({ bg: '#1a1430', ground: '#3a3640', fogFar: 160 });
hemi.intensity = 1.35; hemi.color.set('#ffe6f4'); sun.intensity = 0.5;
const ojiR = rng(68);
const OJI = makeOji(ojiR, { shirt: '#59606e' }); S.add(OJI);
const WIFE = () => makeWoman({ shirt: '#9fc7a8', hair: '#4a3020', pants: '#4a4f60' });

// ---------- A：夜の街（原点） ----------
flat(40, 14, '#2e2c34', 0, 2);
const SHOPS = ['クラブ 月', 'ラウンジ 夢', 'クラブ 蝶', 'ラウンジ 花'].map((name, i) => { const s = makeShop({ w: 4.2, h: 4.2 + (i % 2) * 0.6, d: 3.2, body: ['#2c2238', '#262a3a', '#30243a', '#262234'][i], neon: NEON[i], text: name }); const side = i % 2 ? 1 : -1; s.g.position.set(side * 4.2, 0, -1.5 - Math.floor(i / 2) * 5.0); s.g.rotation.y = -side * Math.PI / 2; S.add(s.g); return s; });
const sparkA = makeSparkles(300, 0.18, 0xffc8f0); S.add(sparkA.points); sparkA.init(SHOPS.map(s => [s.g.position.x * 0.62, 3.0, s.g.position.z]), 1.6, 1.0);
const streetLamp = new THREE.PointLight(0xfff0d0, 10, 9, 1.3); streetLamp.position.set(0, 3.2, 3.0); S.add(streetLamp);
const heiten = label('全部 閉店', { w: 640, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(heiten);
const PHONE = makePhone({ w: 0.22, h: 0.44 }); S.add(PHONE.g);
function drawMap(t) { PHONE.draw('m' + Math.floor(t * 3), (g, w, h) => { g.fillStyle = '#e8eef0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8d0d8'; g.lineWidth = 18; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 200 + 60); g.lineTo(w, i * 200 + 120); g.stroke(); g.beginPath(); g.moveTo(i * 110, 0); g.lineTo(i * 110 + 40, h); g.stroke(); }
  g.fillStyle = '#888'; g.font = '800 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('見つかりません', w / 2, h / 2); const a = (t * 6) % (Math.PI * 2); g.strokeStyle = '#3a7fd0'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2 + 140, 50, a, a + 4.5); g.stroke(); }); }
const koshin = label('更新', { w: 384, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 0.65 }); S.add(koshin);

// ---------- B：家（x=60）：嫁は大喜び／22時に帰る／週末の相づち ----------
const BX = 60;
const home = room({ x: BX, w: 7, d: 5, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const TABLE = makeTable({ w: 1.4, d: 0.8, color: '#b08a63' }); TABLE.position.set(BX + 0.2, 0, -0.9); S.add(TABLE);
const lamp = new THREE.PointLight(0xffe0b0, 10, 8, 1.4); lamp.position.set(BX, 2.7, 0.2); S.add(lamp);
const B_WIFE = WIFE(); S.add(B_WIFE);
const yorokobi = label('嫁は大喜び', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(yorokobi);
const nomidai = label('飲み代が 家に残る', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(nomidai);
const coinM = mat('#e8b84a'); const COINS = []; for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), coinM); S.add(c); COINS.push(c); }
const kyuryobi = label('給料日のたびに 夜の街へ', { w: 1100, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.1 }); S.add(kyuryobi);
const okiteru = label('まだ起きてる', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.96)', sx: 1.3 }); S.add(okiteru);
const AIZUCHI = ['へぇ〜', 'すごいね', 'そうなんだ'].map(s => { const l = label(s, { w: 640, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 0.9 }); S.add(l); return l; });
const mukyu = label('無給', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(mukyu);

// ---------- C：駅前（x=120）：ベンチに3人 ----------
const CX = 120;
flat(30, 16, '#4a4650', CX, 0);
const station = box(18, 5, 4, mat('#5a5868')); station.position.set(CX, 2.5, -6); S.add(station);
const stSign = label('もしも台駅', { w: 768, size: 100, color: '#fff', bg: 'rgba(40,60,120,.96)', sx: 2.2 }); stSign.position.set(CX, 4.4, -3.9); S.add(stSign);
for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ color: '#ffe9a8' })); w.position.set(CX - 6 + i * 2.4, 2.0, -3.98); S.add(w); }
const BENCH = makeBench(); BENCH.position.set(CX, 0, -1.2); S.add(BENCH);
const BENCH_OJI = [makeOji(rng(5), { shirt: '#7a6a55' }), makeOji(rng(9), { shirt: '#8a8f99' }), makeOji(rng(13), { shirt: '#6b7a5a' })]; BENCH_OJI.forEach(p => S.add(p));
const ikiba = label('行き場がない', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.4 }); S.add(ikiba);
const stLight = new THREE.PointLight(0xfff0d0, 14, 12, 1.4); stLight.position.set(CX, 3.5, 1); S.add(stLight);

// ---------- D：空っぽの席（x=180）：すごーい さすがー ----------
const DX = 180;
flat(10, 8, '#2a1a34', DX, 0);
const dWall = box(10, 4, 0.2, mat('#3a2448')); dWall.position.set(DX, 2, -2.5); S.add(dWall);
const sofa = new THREE.Group(); { const sm = mat('#8a2a5a'); const s1 = box(3.2, 0.45, 0.9, sm); s1.position.y = 0.23; sofa.add(s1); const s2 = box(3.2, 0.7, 0.25, sm); s2.position.set(0, 0.7, -0.35); sofa.add(s2); } sofa.position.set(DX, 0, -1.4); S.add(sofa);
const dLight = new THREE.PointLight(0xffc0e0, 14, 9, 1.3); dLight.position.set(DX, 3, 2); S.add(dLight);
const lowT = makeTable({ w: 1.6, d: 0.7, h: 0.42, color: '#2a2030' }); lowT.position.set(DX, 0, -0.2); S.add(lowT);
const sugoi = label('すごーい', { w: 640, size: 120, color: '#fff', bg: 'rgba(255,95,174,.96)', sx: 1.2 }); S.add(sugoi);
const sasuga = label('さすがー', { w: 640, size: 120, color: '#fff', bg: 'rgba(197,139,255,.96)', sx: 1.2 }); S.add(sasuga);
const osake = label('お酒じゃない', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(osake);
// 6万件の看板の海
const SIGNS = []; { const r = rng(4); for (let i = 0; i < 120; i++) { const m = box(0.9, 0.5, 0.06, new THREE.MeshBasicMaterial({ color: NEON[i % 4] })); m.position.set(DX - 7 + (i % 15) * 1.0 + (r() - 0.5) * 0.2, 1.4 + Math.floor(i / 15) * 0.7, -6 + (r() - 0.5) * 0.3); S.add(m); SIGNS.push(m); } }
const homeraretai = label('褒められたい', { w: 768, size: 110, color: '#fff', bg: 'rgba(255,95,174,.96)', sx: 1.4 }); S.add(homeraretai);

// ---------- E：会社（x=240）：若手が武勇伝を3回 ----------
const EX = 240;
flat(14, 10, '#8a8f99', EX, 0);
const eWall = box(14, 3.4, 0.2, mat('#e6e9ee')); eWall.position.set(EX, 1.7, -3); S.add(eWall);
const ISL = makeDeskIsland(2); ISL.position.set(EX, 0, -0.8); S.add(ISL);
const YOUNG = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(YOUNG); const sweatY = makeSweat(); YOUNG.userData.head.add(sweatY);
const BOSS = makeSuit({ old: true, bald: true, jacket: '#2a2e38' }); S.add(BOSS);
const buyuden = label('昔はな…', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); S.add(buyuden);
const sankaime = label('3回目', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(sankaime);
const eLight = new THREE.PointLight(0xffffff, 10, 12, 1.2); eLight.position.set(EX, 3, 1); S.add(eLight);

// ---------- F：結果（x=300）：自慢話がタダで配られる／有料のゴミ箱 ----------
const FX = 300;
flat(30, 20, '#4a4650', FX, 0);
const TOWNP = []; { const r = rng(21); for (let i = 0; i < 10; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#c9a8d8', '#9fc7a8', '#e9b8c8'][i % 3], hair: '#3a2620' }) : makeMan({ shirt: ['#4f6a8f', '#59606e', '#d97a3a'][i % 3] }); p.position.set(FX - 5 + (i % 5) * 2.5, 0, -2.5 + Math.floor(i / 5) * 2.8); p.rotation.y = (i % 2 ? 1 : -1) * 0.5; S.add(p); TOWNP.push(p); } }
const JIMAN = TOWNP.map((p, i) => { const l = label(['武勇伝', '昔はワル', '年収の話', 'ゴルフの話', '若い頃の話'][i % 5], { w: 640, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.95)', sx: 0.95 }); S.add(l); return l; });
const tada = label('自慢話 タダで配布中', { w: 1100, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.4 }); S.add(tada);
const TRASH = makeTrash({ color: '#8a2a5a' }); TRASH.scale.setScalar(2.2); TRASH.position.set(FX, 0, 3.5); S.add(TRASH);
const yuryo = label('有料', { w: 384, size: 120, color: '#fff', bg: 'rgba(255,95,174,.98)', sx: 0.7 }); S.add(yuryo);
const gomibako = label('自慢話の有料ゴミ箱', { w: 1024, size: 100, color: '#fff', bg: 'rgba(138,42,90,.96)', sx: 2.2 }); S.add(gomibako);
const FALL = ['武勇伝', '昔はワル', '年収の話'].map(s => { const l = label(s, { w: 640, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.95)', sx: 0.8 }); S.add(l); return l; });
const fLight = new THREE.PointLight(0xffd0f0, 16, 14, 1.3); fLight.position.set(FX, 4, 6); S.add(fLight);

const PEOPLE = [OJI, B_WIFE, ...BENCH_OJI, YOUNG, BOSS, ...TOWNP];
const LABELS = [heiten, koshin, yorokobi, nomidai, kyuryobi, okiteru, ...AIZUCHI, mukyu, ikiba, sugoi, sasuga, osake, homeraretai, buyuden, sankaime, tada, ...JIMAN, yuryo, gomibako, ...FALL];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; PHONE.g.visible = false; COINS.forEach(c => c.visible = false); sweatY.userData.set(0);
  SHOPS.forEach(s => s.on(1)); SIGNS.forEach(s => s.visible = false); TRASH.userData.open(0);
  OJI.position.set(0, 0, 1.4); OJI.rotation.y = 0;
  B_WIFE.position.set(BX - 0.4, 0, 0.2);
  BENCH_OJI.forEach((p, i) => { p.position.set(CX - 0.7 + i * 0.7, 0, -1.15); poseSit(p); p.position.y = -0.37 + 0.06; p.userData.head.rotation.x = 0.35; });
  YOUNG.position.set(EX - 0.75, 0, -0.1); YOUNG.rotation.y = Math.PI; poseSit(YOUNG); BOSS.position.set(EX + 0.4, 0, 0.6); BOSS.rotation.y = -0.6;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function streetCam(u = 0) { look(lerp(0.3, 0.2, u), lerp(2.3, 2.1, u), lerp(7.4, 6.6, u), 0.0, lerp(2.35, 2.1, u), -3, 50); }
function shot0(t) { // 0秒＝サムネ：夜の街のキャバクラの看板が、一斉にパッと消える
  reset(); lift(0);
  const k = t < TP ? 1 : 0; SHOPS.forEach(s => s.on(k));
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.4)); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(heiten, t, TP + 0.05, 0.0, 2.55, 1.4, 0.9); OJI.userData.head.rotation.x = -0.25; }
  streetCam(ease(clamp(t / 3)));
  return S;
}
function homeCam(u = 0) { look(BX + lerp(0.6, 0.3, u), 1.8, lerp(4.6, 4.0, u), BX - 0.2, 1.4, -0.6, 50); }
function sYorokobi(t, d) { // 嫁は大喜び。
  reset(); lift(120); B_WIFE.userData.arms[0].rotation.set(0, 0, -2.6 + Math.sin(t * 9) * 0.25); B_WIFE.userData.arms[1].rotation.set(0, 0, 2.6 - Math.sin(t * 9) * 0.25); B_WIFE.position.y = Math.abs(Math.sin(t * 6)) * 0.12;
  say(yorokobi, t, 0.2, BX - 0.4, 2.55, 0.2, 1.3);
  homeCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sNomidai(t, d) { // 今月から、飲み代が家に残る。
  reset(); lift(120); B_WIFE.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0));
  COINS.forEach((c, i) => { c.visible = true; const k = easeOut(clamp((t - 0.1 * i) / 0.6)); c.position.set(BX + 0.0 + (i % 4) * 0.08, lerp(2.5, 0.78 + Math.floor(i / 4) * 0.045, k), -0.85 + (i % 3) * 0.05); });
  say(nomidai, t, 0.5, BX - 0.1, 2.4, -0.2, 1.5);
  homeCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sKyuryobi(t, d) { // 嫁たちの不満から。給料日のたびに、夫が夜の街へ消えていた。
  reset(); lift(120); const k = clamp(t / d); OJI.position.set(0.3, 0, lerp(3.0, -2.0, k)); OJI.rotation.y = Math.PI; const ph = t * 8; OJI.userData.legs[0].rotation.x = Math.sin(ph) * 0.5; OJI.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5;
  say(kyuryobi, t, 0.4, 0.0, 3.4, -1.0, 2.0);
  streetCam(0.4);
  return S;
}
function sMap(t, d) { // 20時。おぢは消えた看板の前で、スマホの地図を何度も更新する。
  reset(); lift(120); SHOPS.forEach(s => s.on(0)); OJI.rotation.y = 0; OJI.position.set(0, 0, 1.2);
  OJI.userData.arms[1].rotation.set(-1.6, 0, 0.2); OJI.userData.head.rotation.x = 0.35; PHONE.g.visible = true; PHONE.g.position.set(0.15, 1.35, 1.75); PHONE.g.rotation.x = -0.45; drawMap(t);
  if (Math.floor(t * 1.2) % 2 === 1) say(koshin, t, Math.floor(t * 1.2) / 1.2, 0.55, 2.05, 1.8, 0.45);
  setHud('閉店した日', '20時', 1);
  look(0.8, 2.0, 4.6, 0.1, 1.5, 1.4, 50);
  return S;
}
function sBench(t, d) { // 21時。行き場のないおぢが、駅前のベンチに3人並ぶ。
  reset(); lift(120); OJI.visible = false;
  BENCH_OJI.forEach((p, i) => { p.visible = t > 0.3 + i * 0.4; });
  if (t > 1.6) say(ikiba, t, 1.6, CX, 2.4, -1.0, 1.4);
  setHud('閉店した日', '21時', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(0.6, 0.2, u), 1.8, lerp(5.0, 4.2, u), CX, 1.1, -1.2, 50);
  return S;
}
function sKitaku(t, d) { // 22時。おぢは家に帰る。嫁が、まだ起きている。
  reset(); lift(120); OJI.position.set(BX + 1.6, 0, 1.0); OJI.rotation.y = -Math.PI / 2 - 0.4; B_WIFE.position.set(BX - 0.6, 0, -0.1); B_WIFE.rotation.y = 0.6; poseSit(B_WIFE);
  lamp.intensity = 6; if (t > d * 0.45) say(okiteru, t, d * 0.45, BX - 0.6, 2.0, -0.1, 1.2);
  OJI.userData.head.rotation.x = t > d * 0.45 ? 0.2 : 0; const sw = t > d * 0.5;
  setHud('閉店した日', '22時', 1);
  look(BX + 0.8, 1.9, 5.6, BX + 0.7, 1.2, 0, 50);
  return S;
}
function seatCam(u = 0) { look(DX + lerp(0.4, 0.2, u), 1.7, lerp(4.4, 3.8, u), DX, 1.1, -1.0, 50); }
function sOsake(t, d) { // でもキャバクラが売っていたのは、お酒じゃなかった。
  reset(); lift(120); OJI.visible = false;
  say(osake, t, 0.5, DX, 2.3, -0.6, 1.3);
  seatCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sSugoi(t, d) { // 売っていたのは、すごーい、さすがー。
  reset(); lift(120); OJI.visible = false;
  say(sugoi, t, 0.6, DX - 0.6, 1.7, -0.9, 1.1); say(sasuga, t, d * 0.55, DX + 0.6, 2.2, -0.9, 1.1);
  seatCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sSixman(t, d) { // 接待をする飲食店の許可は、全国に約6万件。
  reset(); lift(150); OJI.visible = false; const n = Math.round(SIGNS.length * easeOut(clamp((t - 0.3) / 1.4))); SIGNS.forEach((s, i) => s.visible = i < n);
  setTop('接待をする飲食店の許可（全国）', comma(Math.round(59516 * easeOut(clamp((t - 0.3) / 1.4)))) + '件', fade(t, 0.3, d, 0.25), '#ff9ed0'); setHud('警察庁', '2024年末', 1);
  look(DX, 3.6, 5.5, DX, 3.2, -6, 50);
  return S;
}
function sHomeru(t, d) { // 褒められたい欲は、店と一緒には消えない。
  reset(); lift(120); SHOPS.forEach(s => s.on(0)); OJI.position.set(0.3, 0, 1.2); OJI.rotation.y = 0; OJI.userData.head.rotation.x = -0.15;
  say(homeraretai, t, 0.4, 0.3, 2.45, 1.2, 1.3); homeraretai.material.opacity = 0.75 + Math.sin(t * 6) * 0.25;
  look(0.6, 1.8, 4.6, 0.3, 1.6, 1.2, 50);
  return S;
}
function officeCam(u = 0) { look(EX + lerp(1.5, 1.2, u), 2.0, lerp(4.8, 4.3, u), EX, 1.4, 0.1, 50); }
function sBuyuden(t, d) { // 次の日。会社の若手が、おぢの武勇伝を3回聞かされる。
  reset(); lift(120); OJI.visible = false; BOSS.userData.arms[1].rotation.set(-0.6, 0, 0.6 + Math.sin(t * 5) * 0.2);
  say(buyuden, t, 0.3, EX + 0.7, 2.35, 0.6, 0.9); if (t > d * 0.5) say(sankaime, t, d * 0.5, EX - 0.75, 1.75, 0.1, 0.8); sweatY.userData.set(clamp((t - d * 0.5) / 0.6), t);
  setHud('次の日', '会社', 1); officeCam(ease(clamp(t / d)));
  return S;
}
function sAizuchi(t, d) { // 週末。家では嫁が、同じ自慢話に、無給で相づち。
  reset(); lift(120); OJI.position.set(BX + 0.9, 0, -0.1); OJI.rotation.y = -0.9; poseSit(OJI); OJI.userData.arms[1].rotation.set(-0.6, 0, 0.5 + Math.sin(t * 5) * 0.2);
  B_WIFE.position.set(BX - 0.6, 0, -0.1); B_WIFE.rotation.y = 0.9; poseSit(B_WIFE); B_WIFE.userData.head.rotation.x = 0.15 + Math.abs(Math.sin(t * 3)) * 0.2;
  AIZUCHI.forEach((l, i) => say(l, t, 0.4 + i * 0.6, BX - 0.5 + i * 0.25, 1.85 + i * 0.3, -0.1, 0.75));
  if (t > d * 0.6) say(mukyu, t, d * 0.6, BX + 0.9, 2.3, -0.1, 0.6);
  setHud('週末', '家', 1);
  look(BX + 0.2, 2.0, 5.4, BX + 0.1, 1.5, -0.2, 50);
  return S;
}
function townCam(u = 0) { look(FX, lerp(5.0, 4.4, u), lerp(11, 9.5, u), FX, 1.4, -1.0, 50); }
function sKekka(t, d) { // 結果：キャバクラが消えて、おぢの自慢話が、タダで日本中に配られた。
  reset(); lift(120); OJI.visible = false; TRASH.visible = false;
  JIMAN.forEach((l, i) => { const p = TOWNP[i]; say(l, t, 0.3 + i * 0.15, p.position.x, 2.45, p.position.z, 0.95); });
  if (t > d * 0.45) say(tada, t, d * 0.45, FX, 4.0, 0, 2.2);
  townCam(ease(clamp(t / d)));
  return S;
}
function sGomi(t, d) { // キャバクラは、おぢの自慢話を有料で引き取るゴミ箱
  reset(); lift(120); OJI.position.set(FX - 1.6, 0, 3.5); OJI.rotation.y = Math.PI / 2; OJI.userData.arms[1].rotation.set(-0.8, 0, 0); TOWNP.forEach(p => p.visible = false); TRASH.visible = true; TRASH.userData.open(1);
  say(yuryo, t, 0.2, FX, 2.55, 3.6, 0.6);
  FALL.forEach((l, i) => { const k = clamp((t - 0.4 - i * 0.5) / 0.8); l.visible = k > 0 && k < 1; l.position.set(lerp(FX - 1.2, FX, k), lerp(2.6, 1.6, k * k), 3.5); l.userData.size(0.8 * (1 - 0.6 * k)); });
  if (t > d * 0.55) say(gomibako, t, d * 0.55, FX, 3.0, 3.5, 2.0);
  look(FX - 0.3, 2.3, 10.4, FX - 0.4, 1.8, 3.5, 50);
  return S;
}
function sAsk(t) { // キャバクラにお金を使う男、あり？なし？（冒頭と同じ構図。看板は消えたまま）
  reset(); lift(0); SHOPS.forEach(s => s.on(0)); OJI.userData.head.rotation.x = -0.25; streetCam(0);
  return S;
}

const NARR = { '嫁': 'よめ', '大喜び': 'おおよろこび', '飲み代': 'のみだい', '今月': 'こんげつ', '給料日': 'きゅうりょうび', '20時': 'にじゅうじ', '21時': 'にじゅういちじ', '22時': 'にじゅうにじ', '3人': 'さんにん', '6万件': 'ろくまんけん', '接待': 'せったい', '若手': 'わかて', '武勇伝': 'ぶゆうでん', '3回': 'さんかい', '週末': 'しゅうまつ', '自慢話': 'じまんばなし', '無給': 'むきゅう', '相づち': 'あいづち', '日本中': 'にほんじゅう', '結果：': '結果、', '有料': 'ゆうりょう', '行き場': 'いきば', '駅前': 'えきまえ', '褒められたい': 'ほめられたい' };
const P = planTimes([
  ['嫁は大喜び。', sYorokobi],
  ['今月から、飲み代が家に残る。', sNomidai],
  ['嫁たちの不満から。', (t, d) => sKyuryobi(t, 2.6 * d)],
  ['給料日のたびに、<br>夫が夜の街へ消えていた。', (t, d) => sKyuryobi(t + 1.0, 2.6 * d)],
  ['20時。おぢは消えた看板の前で、<br>スマホの地図を何度も更新する。', sMap],
  ['21時。行き場のないおぢが、<br>駅前のベンチに3人並ぶ。', sBench],
  ['22時。おぢは家に帰る。<br>嫁が、まだ起きている。', sKitaku],
  ['でもキャバクラが<br>売っていたのは、', (t, d) => sOsake(t, 2 * d)],
  ['お酒じゃなかった。', (t, d) => sOsake(t + d, 2 * d)],
  ['売っていたのは、<br>すごーい、さすがー。', sSugoi],
  ['接待をする飲食店の許可は、<br>全国に約6万件。', sSixman],
  ['褒められたい欲は、<br>店と一緒には消えない。', sHomeru],
  ['次の日。会社の若手が、<br>おぢの武勇伝を3回聞かされる。', sBuyuden],
  ['週末。家では嫁が、同じ<br>自慢話に、無給で相づち。', sAizuchi],
  ['結果：キャバクラが消えて、<br>おぢの自慢話が、', (t, d) => sKekka(t, 2 * d)],
  ['タダで日本中に配られた。', (t, d) => sKekka(t + d, 2 * d)],
  ['キャバクラは、おぢの自慢話を<br>有料で引き取るゴミ箱', sGomi],
  ['だったのかもしれない。', (t, d) => sGomi(t + 3.5, d + 3.5)],
  ['キャバクラにお金を使う男、<br>あり？なし？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0672',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0627',
    hookLine: '夜の街のキャバクラの看板が、一斉にパッと消える。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもキャバクラが全部閉店したら？',
    titleHtml: 'もしもキャバクラが<br>全部閉店<br>したら？',
    mood: 'tension', seed: 672, hits: [TP, P.at(14), P.at(16)], risers: [P.at(7)], impacts: [P.at(10, 0.4), P.at(12, 1.6), P.at(15, 0.1)],
    sfx: [[TP, 'poof'], [P.at(0, 0.2), 'whoosh'], [P.at(1, 0.2), 'bubble'], [P.at(4, 0.4), 'buzz'], [P.at(5, 0.3), 'meter', 0.3], [P.at(6, 0.8), 'alarm'], [P.at(9, 0.5), 'whoosh'], [P.at(10, 0.3), 'meter', 0.5], [P.at(16, 0.6), 'whoosh']],
    narr: NARR,
    ask: 'キャバクラにお金を使う男、あり？なし？',
    caption: 'もしもキャバクラが全部閉店したら？\n\n嫁は大喜び。今月から、飲み代が家に残る。\n嫁たちの不満から。給料日のたびに、夫が夜の街へ消えていた。\n20時。おぢは消えた看板の前で、スマホの地図を何度も更新する。\n21時。行き場のないおぢが、駅前のベンチに3人並ぶ。\n22時。おぢは家に帰る。嫁が、まだ起きている。\nでもキャバクラが売っていたのは、お酒じゃなかった。売っていたのは、すごーい、さすがー。\n接待をする飲食店の許可は、全国に約6万件（59,516件・2024年末。キャバクラのほかホストクラブ・接待のあるスナックなども入る）。\n褒められたい欲は、店と一緒には消えない。\n次の日。会社の若手が、おぢの武勇伝を3回聞かされる。\n週末。家では嫁が、同じ自慢話に、無給で相づち。\n\n結果：キャバクラが消えて、おぢの自慢話が、タダで日本中に配られた。\nキャバクラは、おぢの自慢話を有料で引き取るゴミ箱だったのかもしれない。\n\nキャバクラにお金を使う男、あり？なし？ コメントで教えて。\n\n※風刺ネタです。閉店はもしもの設定で、登場する人物・店は架空です\n出典：警察庁「令和6年における風俗営業等の現状と風俗関係事犯の取締り状況等について」',
    hashtags: ['もしもラボ', 'もしも', 'キャバクラ', 'おぢ', '夜の街'],
    endStats: [['接待をする飲食店の許可（全国）', '59,516件', '警察庁・2024年末'], ['キャバクラが売っていたもの', 'すごーい、さすがー', 'もしもの結果'], ['キャバクラの正体', '自慢話の有料ゴミ箱', 'かもしれない']],
    sources: '出典：警察庁「令和6年における風俗営業等の現状」（風営法1号営業の許可数）',
  },
});
