import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeGlass, makeGift } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも忘年会の幹事が、一番偉い人の仕事だったら？（皮肉回・台本 S72・図星／大人の本音）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：忘年会シーズン（11月下旬〜）の定番の不満 幹事は若手の仕事・忘年会スルー（はてな・ガルちゃん・Xの季節ネタ）
// 数字は使わない（電話8件・30人・10秒は筋の中の数で、統計ではない）。会社・店は架空
// 男叩き（上司）。三段は 1日目 店探し→3日目 景品→1週間後 出欠に怒らない、当日は挨拶10秒。言い換えは 自分の誕生日会

const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.35;
const BUCHO = makeSuit({ old: true, bald: true, jacket: '#2a2e38', glasses: true }); S.add(BUCHO);
const sweatB = makeSweat(); BUCHO.userData.head.add(sweatB);
const WAKATE = [makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }), makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ jacket: '#56504a', tie: '#5a8a4a' })]; WAKATE.forEach(p => S.add(p));
const KANJI = label('幹事', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(KANJI); // 幹事の札

// ---------- A：オフィス（原点）：2つの机 ----------
const roomA = room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const DESK_W = makeTable({ w: 1.3, d: 0.7, h: TABLE_Y - 0.03, color: '#e8e4dc' }); DESK_W.position.set(-0.75, 0, 0.5); S.add(DESK_W);
const DESK_B = makeTable({ w: 1.8, d: 0.9, h: TABLE_Y - 0.03, color: '#8a6a4c' }); DESK_B.position.set(0.55, 0, -1.4); S.add(DESK_B);
const sparkA = makeSparkles(80, 0.12, 0xfff2c0); S.add(sparkA.points);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const itsumo = label('幹事はいつも若手', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.6 }); S.add(itsumo);
const kimerarenai = label('予算も店も 決められない', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(kimerarenai);
const RECV = box(0.08, 0.26, 0.08, mat('#1a1a1e')); S.add(RECV);
const CALLS = []; for (let i = 0; i < 8; i++) { const l = label('満席', { w: 384, size: 100, color: '#fff', bg: 'rgba(214,30,40,.96)', sx: 0.45 }); S.add(l); CALLS.push(l); }
const SHEET = makeDoc({ title: '忘年会 出欠', rows: ['未回答', '未回答', '未回答', '未回答'], head: '#3a6ab2', w: 0.9, h: 1.1 }); S.add(SHEET);
const okoranai = label('初めて 怒らない', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.5 }); S.add(okoranai);

// ---------- B：昼休みの道（x=60）：景品を買いに走る ----------
const BX = 60;
flat(30, 14, '#b8b4ac', BX, 0);
for (let i = 0; i < 6; i++) { const b = box(4.6, 5 + (i % 3) * 1.5, 4, mat(['#e8e2d4', '#d8dde4', '#efe6d6'][i % 3])); b.position.set(BX - 12 + i * 4.8, (5 + (i % 3) * 1.5) / 2, -6); S.add(b); }
const PRIZES = [0, 1, 2].map(i => { const g = makeGift({ color: ['#c8242c', '#3a7fd0', '#f2c14e'][i], s: 0.3 }); S.add(g); return g; });
const bingo = label('ビンゴの景品', { w: 768, size: 100, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 1.3 }); S.add(bingo);

// ---------- C：居酒屋（x=120）：当日 ----------
const CX = 120;
const roomC = room({ x: CX, w: 10, d: 7, h: 3.2, wall: '#8a6a4a', floor: '#6a5040' });
const izaLight = new THREE.PointLight(0xffd8a8, 18, 12, 1.2); izaLight.position.set(CX, 2.8, 1.5); S.add(izaLight);
const LONG = makeTable({ w: 4.4, d: 1.0, h: 0.42, color: '#b08a63' }); LONG.position.set(CX, 0, -1.0); S.add(LONG);
const GLASSES = []; for (let i = 0; i < 8; i++) { const g = makeGlass({ beer: true, h: 0.2 }); g.position.set(CX - 1.8 + (i % 4) * 1.2, LONG.userData.topY, -1.3 + Math.floor(i / 4) * 0.6); S.add(g); GLASSES.push(g); }
const GUESTS = []; { for (let i = 0; i < 6; i++) { const p = i % 2 ? makeSuit({ woman: true, jacket: ['#5a4a6a', '#3a4256', '#56504a'][i % 3], hair: '#3a2620' }) : makeSuit({ jacket: ['#3a4256', '#56504a', '#4a5a4a'][i % 3] }); S.add(p); GUESTS.push(p); } }
const jubyou = label('挨拶 10秒', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(jubyou);
const kanpai = label('かんぱい！', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(kanpai);
const kizuku = label('空いたグラスに 気づく', { w: 1024, size: 96, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.9 }); S.add(kizuku);
const CALC = box(0.22, 0.03, 0.3, mat('#2a2e38')); S.add(CALC);
const nijikai = label('2次会へ', { w: 512, size: 110, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 0.9 }); S.add(nijikai);
const ikenai = label('行けない', { w: 512, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.9 }); S.add(ikenai);

// ---------- D：会議室（x=180）：次の年 ----------
const DX = 180;
const MR = makeMeetingRoom(); MR.position.set(DX, 0, 0); S.add(MR);
const yameyou = label('今年は やめようか', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(yameyou);

// ---------- E：誕生日会（居酒屋を使う） ----------
const CAKE = new THREE.Group(); { const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.28, 24), mat('#fff6ec')); c1.position.y = 0.14; CAKE.add(c1); const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.05, 24), mat('#e85a7a')); c2.position.y = 0.29; CAKE.add(c2); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const cd = box(0.03, 0.16, 0.03, mat('#7fd4ff')); cd.position.set(Math.cos(a) * 0.3, 0.4, Math.sin(a) * 0.3); CAKE.add(cd); const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffd27a' })); f.position.set(Math.cos(a) * 0.3, 0.5, Math.sin(a) * 0.3); CAKE.add(f); } } S.add(CAKE);
const HAT = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 12), mat('#f2c14e')); HAT.position.set(0, 0.62, 0); BUCHO.userData.head.add(HAT);
const tanjobi = label('自分の誕生日会', { w: 900, size: 100, color: '#fff', bg: 'rgba(232,90,122,.97)', sx: 1.6 }); S.add(tanjobi);
const nakunatta = label('忘年会 1年でなくなる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.9 }); S.add(nakunatta);

const PEOPLE = [BUCHO, ...WAKATE, ...GUESTS];
const LABELS = [KANJI, katamaru, itsumo, kimerarenai, ...CALLS, okoranai, bingo, jubyou, kanpai, kizuku, nijikai, ikenai, yameyou, tanjobi, nakunatta];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatB.userData.set(0);
  RECV.visible = false; SHEET.visible = false; PRIZES.forEach(g => g.visible = false); CALC.visible = false; CAKE.visible = false; HAT.visible = false; GLASSES.forEach(g => { g.visible = true; g.userData.setLevel(1); });
  BUCHO.position.set(0.55, 0, -2.1); poseSit(BUCHO);
  WAKATE.forEach((p, i) => { p.position.set(-0.75 + (i - 1) * 0.9, 0, -0.15); poseSit(p); p.visible = i === 1; });
  GUESTS.forEach((p, i) => { const side = i < 3 ? -1 : 1; p.position.set(CX - 1.5 + (i % 3) * 1.5, 0, -1.0 + side * 0.85); p.rotation.y = side < 0 ? 0 : Math.PI; poseSit(p); p.position.y = -0.2; });
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.4;
function officeCam(u = 0) { look(lerp(0.1, 0.15, u), lerp(2.3, 2.2, u), lerp(3.6, 3.2, u), 0.05, lerp(1.75, 1.45, u), -1.0, 48); }
function shot0(t) { // 0秒＝サムネ：若手の机の 幹事 の札が、部長の机へビュンと飛ぶ
  reset(); lift(0); const k = easeOut(clamp(t / TP)); KANJI.visible = true; KANJI.userData.size(0.6);
  KANJI.position.set(lerp(-0.75, 0.55, k), TABLE_Y + 0.3 + Math.sin(k * Math.PI) * 0.6, lerp(0.5, -1.3, k));
  if (t > TP) { sparkA.init([[0.55, TABLE_Y + 0.4, -1.3]], 0.3, 0.6); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; BUCHO.userData.head.rotation.x = 0.15; }
  officeCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function bossCam(u = 0) { look(lerp(1.0, 0.8, u), 1.7, lerp(0.6, 0.1, u), 0.55, 1.35, -2.0, 50); }
function sKatamaru(t, d) { // 部長が、札を持ったまま固まる。
  reset(); lift(120); BUCHO.userData.arms[1].rotation.set(-1.4, 0, 0.1); BUCHO.updateMatrixWorld(); const v = new THREE.Vector3(0.2, 1.15, 0.45); BUCHO.localToWorld(v); KANJI.visible = true; KANJI.position.copy(v); KANJI.userData.size(0.4);
  if (t > 1.0) say(katamaru, t, 1.0, 1.0, 1.9, -2.0, 0.36);
  bossCam(ease(clamp(t / d)));
  return S;
}
function sFuman(t, d) { // 若手たちの不満から。幹事はいつも若手。予算も店も決められない。
  reset(); lift(120); WAKATE.forEach((p, i) => { p.visible = true; p.position.set(-0.75 + (i - 1) * 0.95, 0, -0.15); poseSit(p); p.userData.head.rotation.x = 0.3; });
  if (t < d * 0.5) say(itsumo, t, 0.3, -0.75, 1.95, 0.2, 1.2); else say(kimerarenai, t, d * 0.5, -0.75, 1.95, 0.2, 1.5);
  look(-0.6, 1.8, 3.6, -0.75, 1.2, 0.0, 50);
  return S;
}
function sDay1(t, d) { // 1日目。部長は、30人が入る店を探して、電話を8件かける。
  reset(); lift(120); BUCHO.userData.arms[1].rotation.set(-2.6, 0, 0.5); BUCHO.updateMatrixWorld(); const v = new THREE.Vector3(0.28, 1.55, 0.12); BUCHO.localToWorld(v); RECV.visible = true; RECV.position.copy(v);
  const n = Math.min(8, Math.floor(clamp((t - 0.4) / (d - 0.8)) * 8 + 0.999)); CALLS.forEach((l, i) => { if (i < n) { say(l, t, 0.4 + i * (d - 0.8) / 8, -0.05 + (i % 4) * 0.4, 2.15 - Math.floor(i / 4) * 0.32, -2.5, 0.34); } });
  setHud('幹事になった部長', '1日目', 1); bossCam(0.5); look(0.75, 1.8, 0.9, 0.55, 1.6, -2.0, 50);
  return S;
}
function sDay3(t, d) { // 3日目。部長は、ビンゴの景品を買いに、昼休みに走る。
  reset(); lift(120); const k = clamp(t / d); BUCHO.position.set(lerp(BX - 3, BX + 1.5, k), 0, 0); BUCHO.position.y = Math.abs(Math.sin(t * 6.5)) * 0.05; BUCHO.rotation.y = Math.PI / 2;
  const ph = t * 6.5; BUCHO.userData.legs[0].rotation.x = Math.sin(ph) * 0.6; BUCHO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.6; BUCHO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0));
  BUCHO.updateMatrixWorld(); PRIZES.forEach((g, i) => { g.visible = true; const v = new THREE.Vector3(0, 0.95 + i * 0.22, 0.5); BUCHO.localToWorld(v); g.position.copy(v); g.rotation.y = Math.PI / 2; });
  say(bingo, t, 0.5, BUCHO.position.x, 2.3, 0, 1.1);
  setHud('幹事になった部長', '3日目', 1); look(BUCHO.position.x + 0.3, 1.6, 4.2, BUCHO.position.x, 1.3, 0, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。部長は、出欠の返事が来ないことに、初めて怒らない。
  reset(); lift(120); SHEET.visible = true; SHEET.position.set(-0.4, 1.75, -2.85);
  BUCHO.userData.head.rotation.x = -0.1; BUCHO.userData.arms.forEach(a => a.rotation.set(-0.5, 0, 0));
  if (t > d * 0.5) say(okoranai, t, d * 0.5, 0.55, 2.3, -2.0, 1.2);
  setHud('幹事になった部長', '1週間後', 1); look(0.4, 1.9, 1.6, 0.2, 1.5, -2.2, 50);
  return S;
}
function partyCam(u = 0) { look(CX + lerp(0.2, -0.2, u), lerp(2.4, 2.2, u), lerp(4.2, 3.6, u), CX - 1.3, 1.2, -1.0, 50); }
function sToujitsu(t, d) { // そして当日。部長は乾杯の挨拶を、10秒で終わらせる。
  reset(); lift(120); GUESTS[3].visible = GUESTS[4].visible = false; BUCHO.position.set(CX - 2.6, 0, -1.0); BUCHO.userData.legs.forEach(l => l.rotation.x = 0); BUCHO.rotation.y = Math.PI / 2 - 0.3; BUCHO.userData.arms[1].rotation.set(-2.2, 0, 0.2);
  if (t > d * 0.45) { say(jubyou, t, d * 0.45, CX - 1.75, 2.2, -1.0, 0.85); say(kanpai, t, d * 0.6, CX - 0.6, 1.75, -1.6, 0.9); GUESTS.forEach(p => p.userData.arms[1].rotation.set(-2.4, 0, 0)); }
  setHud('忘年会', '当日', 1); partyCam(ease(clamp(t / d)));
  return S;
}
function sGlass(t, d) { // 誰よりも先に、空いたグラスに気づく。
  reset(); lift(120); GUESTS[5].visible = false; GUESTS[4].visible = false; GLASSES.forEach((g, i) => g.userData.setLevel(i === 7 ? 0.05 : 0.7)); BUCHO.position.set(CX + 2.55, 0, -1.0); BUCHO.userData.legs.forEach(l => l.rotation.x = 0); BUCHO.rotation.y = -Math.PI / 2; BUCHO.userData.arms[1].rotation.set(-1.0, 0, 0); BUCHO.userData.head.rotation.x = 0.3;
  say(kizuku, t, 0.6, CX + 1.6, 1.95, -1.0, 1.3);
  look(CX + 1.2, 2.0, 2.9, CX + 1.7, 1.1, -1.0, 50);
  return S;
}
function sKaikei(t, d) { // お会計の計算で、部長は2次会に行けない。
  reset(); lift(120); BUCHO.position.set(CX - 0.8, 0, -1.85); BUCHO.rotation.y = 0; poseSit(BUCHO); BUCHO.position.y = -0.2; BUCHO.userData.head.rotation.x = 0.4; BUCHO.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); sweatB.userData.set(1, t);
  CALC.visible = true; CALC.position.set(CX - 0.8, LONG.userData.topY + 0.02, -1.3);
  GUESTS.forEach((p, i) => { const k = easeOut(clamp((t - 0.5 - i * 0.12) / 1.2)); p.visible = k < 0.99 && p.position.z < -1; p.position.y = 0; p.userData.legs.forEach(l => l.rotation.x = 0); p.position.x += k * 3.5; p.rotation.y = Math.PI / 2; });
  say(nijikai, t, 0.6, CX + 2.0, 2.2, -1.0, 0.9); if (t > d * 0.55) say(ikenai, t, d * 0.55, CX - 0.8, 1.85, -1.6, 0.75);
  look(CX - 0.4, 2.0, 1.8, CX - 0.6, 1.05, -1.4, 50);
  return S;
}
function sNextYear(t, d) { // 次の年。部長は言う。今年は、忘年会やめようか。
  reset(); lift(120); const st = MR.userData.seats; BUCHO.position.set(DX + st[2].x, 0, st[2].z); BUCHO.rotation.y = st[2].ry; poseSit(BUCHO);
  WAKATE.forEach((p, i) => { const s = st[[1, 4, 5][i]]; p.visible = true; p.position.set(DX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  MR.userData.board.set(['忘年会']);
  if (t > d * 0.4) say(yameyou, t, d * 0.4, DX + st[2].x, 2.3, st[2].z, 1.4);
  setHud('次の年', '会議', 1);
  const u = ease(clamp(t / d)); look(DX + st[2].x + lerp(1.2, 0.5, u), 2.2, st[2].z + lerp(5.0, 4.2, u), DX + st[2].x, 1.25, st[2].z, 50);
  return S;
}
function sKekka(t, d) { // 結果：一番偉い人が幹事になって、忘年会は1年でなくなった。
  reset(); lift(120); GUESTS.forEach(p => p.visible = false); GLASSES.forEach(g => g.visible = false); BUCHO.position.set(CX, 0, 0.2); BUCHO.rotation.y = Math.PI; BUCHO.visible = false;
  if (t > d * 0.5) say(nakunatta, t, d * 0.5, CX, 2.0, -1.0, 1.8);
  const u = ease(clamp(t / d)); look(CX + lerp(0.4, 0.0, u), lerp(2.4, 2.8, u), lerp(4.2, 6.0, u), CX, 0.8, -1.0, 50);
  return S;
}
function sTanjo(t, d) { // 忘年会は、偉い人が若手にタダで開かせていた、自分の誕生日会
  reset(); lift(120); GLASSES.forEach(g => g.visible = false); BUCHO.position.set(CX, 0, -1.85); poseSit(BUCHO); BUCHO.position.y = -0.2; HAT.visible = true; BUCHO.userData.arms.forEach(a => a.rotation.set(0, 0, 0));
  GUESTS.forEach((p, i) => { p.visible = i !== 1 && i !== 4; if (i < 3) p.position.x = CX - 1.9 + (i % 3) * 1.9; p.userData.arms.forEach((a, j) => a.rotation.set(-1.4, 0, (j ? -1 : 1) * 0.3 * Math.abs(Math.sin(t * 6 + i)))); });
  CAKE.visible = true; CAKE.position.set(CX, LONG.userData.topY, -1.05);
  if (t > d * 0.55) say(tanjobi, t, d * 0.55, CX, 1.95, -1.2, 1.3);
  look(CX, 1.9, 2.4, CX, 0.95, -1.3, 50);
  return S;
}
function sAsk(t) { // 会社の忘年会、あったほうがいい？（冒頭と同じ構図。札は部長の机に）
  reset(); lift(0); KANJI.visible = true; KANJI.position.set(0.55, TABLE_Y + 0.3, -1.3); KANJI.userData.size(0.6); BUCHO.userData.head.rotation.x = 0.15; officeCam(0);
  return S;
}

const NARR = { '幹事': 'かんじ', '部長': 'ぶちょう', '札': 'ふだ', '若手': 'わかて', '不満': 'ふまん', '予算': 'よさん', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '30人': 'さんじゅうにん', '8件': 'はっけん', '景品': 'けいひん', '昼休み': 'ひるやすみ', '出欠': 'しゅっけつ', '初めて': 'はじめて', '当日': 'とうじつ', '乾杯': 'かんぱい', '挨拶': 'あいさつ', '10秒': 'じゅうびょう', '誰よりも': 'だれよりも', '2次会': 'にじかい', '次の年': 'つぎのとし', '今年': 'ことし', '結果：': '結果、', '一番偉い人': 'いちばんえらいひと', '偉い人': 'えらいひと', '1年': 'いちねん', '誕生日会': 'たんじょうびかい', '忘年会': 'ぼうねんかい', '会計': 'かいけい' };
const P = planTimes([
  ['部長が、札を持ったまま固まる。', sKatamaru],
  ['若手たちの不満から。<br>幹事はいつも若手。', (t, d) => sFuman(t, 2 * d)],
  ['予算も店も決められない。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。部長は、30人が入る<br>店を探して、電話を8件かける。', sDay1],
  ['3日目。部長は、ビンゴの景品を<br>買いに、昼休みに走る。', sDay3],
  ['1週間後。部長は、出欠の返事が<br>来ないことに、初めて怒らない。', sWeek],
  ['そして当日。部長は乾杯の<br>挨拶を、10秒で終わらせる。', sToujitsu],
  ['誰よりも先に、<br>空いたグラスに気づく。', sGlass],
  ['お会計の計算で、<br>部長は2次会に行けない。', sKaikei],
  ['次の年。部長は言う。<br>今年は、忘年会やめようか。', sNextYear],
  ['結果：一番偉い人が<br>幹事になって、', (t, d) => sKekka(t, 2 * d)],
  ['忘年会は1年でなくなった。', (t, d) => sKekka(t + d, 2 * d)],
  ['忘年会は、偉い人が若手に<br>タダで開かせていた、', sTanjo],
  ['自分の誕生日会', (t, d) => sTanjo(t + 3.0, d)],
  ['だったのかもしれない。', (t, d) => sTanjo(t + 5.0, d)],
  ['会社の忘年会、<br>あったほうがいい？', sAsk],
], { shot0, endCard, start: 3.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0677',
    v2: true,
    tt: 'main',
    hookLine: '若手の机の 幹事 の札が、部長の机へビュンと飛ぶ。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも忘年会の幹事が、一番偉い人の仕事だったら？',
    titleHtml: 'もしも忘年会の<br>幹事が、一番<br>偉い人の仕事<br>だったら？',
    mood: 'tension', seed: 677, hits: [TP, P.at(10), P.at(13)], risers: [P.at(6)], impacts: [P.at(6, 1.4), P.at(8, 1.0), P.at(9, 1.2)],
    sfx: [[TP, 'whoosh'], [P.at(0, 1.0), 'buzz'], [P.at(3, 0.5), 'alarm'], [P.at(4, 0.3), 'whoosh'], [P.at(5, 0.8), 'meter', 0.3], [P.at(7, 0.4), 'bubble'], [P.at(9, 0.8), 'poof'], [P.at(13, 0.4), 'whoosh']],
    narr: NARR,
    ask: '会社の忘年会、あったほうがいい？',
    caption: 'もしも忘年会の幹事が、一番偉い人の仕事だったら？\n\n部長が、札を持ったまま固まる。\n若手たちの不満から。幹事はいつも若手。予算も店も決められない。\n1日目。部長は、30人が入る店を探して、電話を8件かける。\n3日目。部長は、ビンゴの景品を買いに、昼休みに走る。\n1週間後。部長は、出欠の返事が来ないことに、初めて怒らない。\nそして当日。部長は乾杯の挨拶を、10秒で終わらせる。\n誰よりも先に、空いたグラスに気づく。\nお会計の計算で、部長は2次会に行けない。\n次の年。部長は言う。今年は、忘年会やめようか。\n\n結果：一番偉い人が幹事になって、忘年会は1年でなくなった。\n忘年会は、偉い人が若手にタダで開かせていた、自分の誕生日会だったのかもしれない。\n\n会社の忘年会、あったほうがいい？ コメントで教えて。\n\n※風刺ネタです。一番偉い人が幹事になるのは、もしもの設定です。登場する人物・会社・店は架空です',
    hashtags: ['もしもラボ', 'もしも', '忘年会', '幹事', '会社あるある'],
    endStats: [['幹事になったのは', '一番偉い人', 'もしもの設定'], ['忘年会は', '1年でなくなった', 'もしもの結果'], ['忘年会の正体', '自分の誕生日会', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
