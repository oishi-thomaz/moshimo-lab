import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes, addKnees, fitReset, poseRun } from '../scenes/fitness.js';
import { makeSet, makeTable, makeGlass, makeBench } from '../scenes/home.js';
import { makeRamen } from '../scenes/yokocho.js';

// もしも 痩せろ と言った彼氏も、同じダイエットをしたら？（皮肉回・台本 S142・男と女のもしも・作り直し 0657）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。元の回 0657 もしも痩せろが連帯責任だったら？ の冒頭を作り直し（plan/remake.md の16）。
// ラーメンをすすりながら お前、ちょっと太った？ と言った彼氏の前で、どんぶりがランニングシューズに変わる回。後半で 細い方がいい と笑っていた先輩 にも返す
// 数字は使わない（体重・BMI は出さない）。体型そのものは笑わず、言う側の行動だけを笑う。彼女はふつうの体型。極端な食事制限は描かない（禁止は夜のラーメン・からあげ・ビールだけ）。実在の店・ロゴは出さない

const GOLD = '#ffd27a', RED = '#ff8a7a';
const { S, flat, room, hemi } = makeSet({ bg: '#9ac4e4', ground: '#7a9a6a' }); hemi.intensity = 1.2;
const BF = addKnees(makeMan({ shirt: '#3a3f4e', pants: '#2b3346', hair: '#1d1a19' })); S.add(BF); const sweatB = makeSweat(); BF.userData.head.add(sweatB);
const GF = addKnees(makeWoman({ shirt: '#f2a8c0', hair: '#3a2018', pants: '#3a4a6a' })); S.add(GF);
const SENPAI = addKnees(makeOji(rng(142), { shirt: '#4a5a7a', bald: false, hair: '#2a2420' })); S.add(SENPAI); const sweatS = makeSweat(); SENPAI.userData.head.add(sweatS);
const FRIENDS = [makeWoman({ shirt: '#a8c8e8', hair: '#2a1a14' }), makeWoman({ shirt: '#c8e0b0', hair: '#5a3a24' })]; FRIENDS.forEach(p => S.add(p));
const CHOP = box(0.02, 0.02, 0.36, mat('#c8a070')); CHOP.position.set(0, -0.64, 0.14); BF.userData.arms[1].add(CHOP);
function makeShoes(c = '#ff6a3a') { const g = new THREE.Group(); for (const s of [-1, 1]) { const b = box(0.16, 0.12, 0.36, mat(c)); b.position.set(s * 0.1, 0.09, 0); g.add(b); const sole = box(0.17, 0.04, 0.37, mat('#f4f4f2')); sole.position.set(s * 0.1, 0.02, 0); g.add(sole); const lace = box(0.1, 0.02, 0.12, mat('#ffffff')); lace.position.set(s * 0.1, 0.16, 0.06); g.add(lace); } return g; }

// ---------- A：2人の部屋（原点・夜） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#e8e0d0', floor: '#b48a5e' });
const TBL = makeTable({ w: 1.4, d: 0.8 }); TBL.position.set(0, 0, -0.6); S.add(TBL);
const RAMEN = makeRamen(); RAMEN.scale.setScalar(1.3); RAMEN.position.set(-0.35, 0.75, -0.6); S.add(RAMEN);
const SHOES = makeShoes(); SHOES.scale.setScalar(1.25); SHOES.position.set(-0.35, 0.75, -0.6); S.add(SHOES);
const sparkA = makeSparkles(150, 0.1, 0xffe08a); S.add(sparkA.points); sparkA.init([[-0.35, 0.95, -0.6]], 0.4, 0.7);
const futotta = label('お前、ちょっと太った？', { w: 1100, size: 88, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.3 }); S.add(futotta);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const KARA = new THREE.Group(); { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.03, 20), mat('#f4f4f2')); KARA.add(pl); const r = rng(5); for (let i = 0; i < 6; i++) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat('#c88a3a', { flatShading: true })); k.position.set((r() - 0.5) * 0.25, 0.07, (r() - 0.5) * 0.25); KARA.add(k); } } KARA.position.set(-0.3, 0.76, -0.6); S.add(KARA);
const BEER = makeGlass({ beer: true, h: 0.26 }); BEER.position.set(0.15, 0.75, -0.55); S.add(BEER);
const kinshi1 = label('夜ラーメン 禁止', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(kinshi1);
const kinshi2 = label('からあげ・ビール 禁止', { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.15 }); S.add(kinshi2);
const BATSU = label('✕', { w: 256, h: 256, size: 220, color: '#e8242c', sx: 0.5 }); S.add(BATSU);
const yaseroW = label('痩せろ', { w: 512, size: 130, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(yaseroW);
const sparkY = makeSparkles(150, 0.1, 0xffffff); S.add(sparkY.points); sparkY.init([[-0.75, 2.2, -0.4]], 0.4, 0.8);
const kieta = label('痩せろ 消滅', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(kieta);

// ---------- B：彼女たち（x=60） ----------
const BX = 60;
room({ x: BX, w: 7, d: 5, h: 3, wall: '#f0e4ea', floor: '#c8a888' });
const futottenai = label('太ってないのに', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(futottenai);
const iwareru = label('痩せろ と言われ続ける', { w: 1100, size: 88, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.25 }); S.add(iwareru);

// ---------- C：朝の川ぞいの道（x=120） ----------
const CX = 120;
flat(60, 4, '#c8b898', CX, 0); flat(60, 6, '#5a8ac0', CX, -6, -0.85);
const TREES = []; { const r = rng(9); for (let i = 0; i < 16; i++) { const g = new THREE.Group(); const tr = box(0.2, 1.2, 0.2, mat('#6a4a30')); tr.position.y = 0.6; g.add(tr); const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.0, 7), mat(['#4a8a4a', '#5a9a5a', '#3a7a4a'][i % 3], { flatShading: true })); c.position.y = 2.0; g.add(c); g.position.set(CX - 20 + i * 2.6 + r() * 0.6, 0, -2.6 - r() * 0.6); S.add(g); TREES.push(g); } }
const haa = label('ハァハァ', { w: 640, size: 110, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 0.7 }); S.add(haa);
const kareshi = label('息切れは 彼氏', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kareshi);
const futari = label('止まってるのは 2人の男', { w: 1100, size: 88, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(futari);
const jibun = label('体力がないのは 自分', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.15 }); S.add(jibun);
const BENCH = makeBench(); BENCH.position.set(CX + 30, 0, -0.8); S.add(BENCH);
const RAMEN2 = makeRamen(); RAMEN2.position.set(0, -0.64, 0.25); RAMEN2.scale.setScalar(0.6);
const yaji = label('客席からの ヤジ', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.05 }); S.add(yaji);

// ---------- D：飲み会（x=180・夜） ----------
const DX = 180;
room({ x: DX, w: 7, d: 5, h: 3, wall: '#6a4a3a', floor: '#5a4030' });
const TBL2 = makeTable({ w: 1.6, d: 0.8, color: '#8a5a34' }); TBL2.position.set(DX, 0, -0.8); S.add(TBL2);
const BEER2 = makeGlass({ beer: true, h: 0.26 }); BEER2.position.set(DX - 0.35, 0.75, -0.6); S.add(BEER2);
const SHOES2 = makeShoes('#3a8aff'); SHOES2.scale.setScalar(1.25); SHOES2.position.set(DX + 0.2, 0.75, -0.65); S.add(SHOES2);
const sparkD = makeSparkles(150, 0.1, 0xffe08a); S.add(sparkD.points); sparkD.init([[DX + 0.2, 0.95, -0.65]], 0.4, 0.7);
const hosoi = label('女の子は 細い方がいい', { w: 1100, size: 88, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.3 }); S.add(hosoi);
const demo = label('困ったのは 彼氏だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const todoku = label('シューズ 到着', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.9 }); S.add(todoku);
const DLAMP = new THREE.PointLight(0xffd8a0, 6, 8, 1.4); DLAMP.position.set(DX, 2.6, 0.5); S.add(DLAMP);

const PEOPLE = [BF, GF, SENPAI, ...FRIENDS];
function makeChair() { const g = new THREE.Group(); const m = mat('#7a5c40'); const st = box(0.46, 0.05, 0.46, m); st.position.y = 0.45; g.add(st); const bk = box(0.46, 0.5, 0.05, m); bk.position.set(0, 0.72, -0.22); g.add(bk); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.04, 0.45, 0.04, m); l.position.set(x * 0.2, 0.225, z * 0.2); g.add(l); } S.add(g); return g; }
const CHAIRS = new Map([[BF, makeChair()], [GF, makeChair()], [SENPAI, makeChair()]]);
const LABELS = [futotta, katamaru, kinshi1, kinshi2, BATSU, yaseroW, kieta, futottenai, iwareru, haa, kareshi, futari, jibun, yaji, hosoi, demo, todoku];
function reset() {
  PEOPLE.forEach(p => { if (p.userData.knees) fitReset(p); poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkY.set(0); sparkD.set(0); el.flash.style.opacity = 0; sweatB.userData.set(0); sweatS.userData.set(0);
  CHAIRS.forEach(c => c.visible = false); RAMEN.visible = false; RAMEN.scale.setScalar(1.3); SHOES.visible = false; KARA.visible = false; BEER.visible = false; CHOP.visible = true; SHOES2.visible = false; RAMEN2.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function seat(p, x, z, ry) { stand(p, x, z, ry); poseSit(p); if (p.userData.knees) p.userData.knees.forEach(k => k.rotation.x = Math.PI / 2); const c = CHAIRS.get(p); if (c) { c.visible = true; c.position.set(x - Math.sin(ry) * 0.05, 0, z - Math.cos(ry) * 0.05); c.rotation.y = ry; } }
function bfSeat(chop = 1) { seat(BF, -0.95, -0.6, Math.PI / 2); BF.userData.arms[1].rotation.set(-1.2 * chop, 0, 0.1); BF.userData.arms[0].rotation.set(-0.9, 0, 0); }
function gfSeat() { seat(GF, 0.95, -0.6, -Math.PI / 2); GF.userData.arms.forEach(a => a.rotation.set(-0.8, 0, 0)); }
const TP = 0.3;
function tableCam(u = 0) { look(lerp(0.1, 0.0, u), lerp(1.7, 1.65, u), lerp(4.0, 3.7, u), 0, 1.3, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：お前、ちょっと太った？ と言った彼氏の前で、どんぶりがパッと消えて、ランニングシューズに変わる
  reset(); lift(0); bfSeat(); gfSeat();
  const k = t < TP ? 0 : easeOut(clamp((t - TP) / 0.25)); RAMEN.visible = k < 1; RAMEN.scale.setScalar(Math.max(0.001, 1.3 * (1 - k))); SHOES.visible = k > 0; SHOES.scale.setScalar(Math.max(0.001, 1.25 * k));
  say(futotta, t, -1, -0.1, 0.45, 0.4, 1.1);
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; }
  tableCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // はしを持ったままの彼氏が、彼女と目が合って固まる
  reset(); lift(140); bfSeat(); gfSeat(); SHOES.visible = true; sweatB.userData.set(1, t); BF.userData.head.rotation.y = 0.1;
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.95, 2.1, -0.6, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.6, lerp(3.0, 2.6, u), -0.3, 1.05, -0.6, 50);
  return S;
}
function sFuman(t, d) { // 彼女たちの不満から。太っていないのに、痩せろと言われ続ける
  reset(); lift(140); stand(GF, BX, -0.4, 0); FRIENDS.forEach((p, i) => stand(p, BX + (i ? 0.9 : -0.9), -0.7, i ? -0.2 : 0.2));
  say(futottenai, t, 0.3, BX, 2.45, -0.2, 1.0); if (t > d * 0.55) say(iwareru, t, d * 0.55, BX, 2.0, 0.1, 1.2);
  look(BX, 1.6, 4.6, BX, 1.3, -0.4, 50);
  return S;
}
function sDay1(t, d) { // 1日目。夜のラーメン、禁止。彼氏のはしが止まる
  reset(); lift(140); bfSeat(); gfSeat(); RAMEN.visible = true; BF.userData.arms[1].rotation.set(-1.2, 0, 0.1 + Math.max(0, 0.3 - t * 0.3));
  if (t > d * 0.3) { say(BATSU, t, d * 0.3, -0.35, 1.05, -0.5, 0.45); say(kinshi1, t, d * 0.3, -0.2, 1.95, -0.4, 0.95); }
  setHud('痩せろ と言った彼氏も', '1日目', 1);
  look(0.2, 1.7, 2.8, -0.3, 1.0, -0.6, 50);
  return S;
}
function sDay3(t, d) { // 3日目。コンビニのからあげも、ビールも、禁止
  reset(); lift(140); bfSeat(0.6); gfSeat(); KARA.visible = true; BEER.visible = true; CHOP.visible = false;
  if (t > d * 0.35) { say(BATSU, t, d * 0.35, -0.1, 1.05, -0.4, 0.55); say(kinshi2, t, d * 0.35, -0.1, 1.95, -0.4, 1.1); }
  setHud('痩せろ と言った彼氏も', '3日目', 1);
  look(0.2, 1.7, 2.8, -0.2, 1.0, -0.6, 50);
  return S;
}
function runner(p, x, z, t, amp = 1) { stand(p, x, z, Math.PI / 2); poseRun(p, t * 9, amp); }
function stopped(p, x, z, t) { stand(p, x, z, Math.PI / 2); p.rotation.order = 'YXZ'; p.rotation.x = 0.3; p.userData.arms.forEach(a => a.rotation.set(-0.7, 0, 0)); p.position.y = -0.05 + Math.sin(t * 6) * 0.01; p.userData.head.rotation.x = -0.4; }
function runCam(x, u = 0) { look(x + lerp(0.3, 0.0, u), 1.6, lerp(7.0, 6.6, u), x, 1.1, -0.4, 50); }
function sWeek(t, d) { // 1週間後。朝のランニング。息を切らしているのは、彼氏のほう
  reset(); lift(140); const x0 = CX - 1.5 + t * 0.6; runner(GF, x0 + 1.4, 0, t, 0.8); runner(BF, x0 - 0.6, 0.3, t * 0.7, 0.5); sweatB.userData.set(1, t); CHOP.visible = false;
  if (t > d * 0.3) say(haa, t, d * 0.3, x0 - 0.6, 2.2, 0.3, 0.65); if (t > d * 0.6) say(kareshi, t, d * 0.6, x0 + 0.5, 2.65, 0, 0.9);
  setHud('痩せろ と言った彼氏も', '1週間後', 1);
  runCam(x0 + 0.3, ease(clamp(t / d)));
  return S;
}
function senpaiSeat() { seat(SENPAI, DX - 0.85, -0.8, Math.PI / 2); SENPAI.userData.arms[1].rotation.set(-1.2, 0, 0.1); SENPAI.userData.head.rotation.x = -0.15; }
function izaCam(u = 0) { look(DX + lerp(0.2, 0.1, u), 1.75, lerp(3.6, 3.2, u), DX - 0.1, 1.15, -0.8, 50); }
function sDemo(t, d) { // でも、困ったのは、彼氏だけじゃなかった
  reset(); lift(140); senpaiSeat(); BEER2.visible = true;
  if (t < d * 0.45) say(hosoi, t, 0.2, DX - 0.1, 2.0, -0.6, 1.1); else say(demo, t, d * 0.45, DX, 2.0, -0.6, 1.2);
  izaCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sSenpai(t, d) { // 飲み会で 女の子は細い方がいい と笑っていた先輩の前にも、シューズが届く
  reset(); lift(140); senpaiSeat(); const ph = t / d; const k = easeOut(clamp((ph - 0.55) / 0.12));
  SHOES2.visible = k > 0; SHOES2.scale.setScalar(Math.max(0.001, 1.25 * k)); if (ph > 0.55) { sparkD.set(clamp((t - d * 0.55) / 1.2)); sweatS.userData.set(1, t); }
  if (ph < 0.55) say(hosoi, t, 0.2, DX - 0.1, 2.0, -0.6, 1.1); else say(todoku, t, d * 0.6, DX + 0.2, 2.15, -0.6, 0.9);
  izaCam(0.5 + 0.5 * ease(clamp(t / d)));
  return S;
}
function sTwoWeeks(t, d) { // 2週間後。彼女はふつうに走っている。後ろで止まっているのは、2人の男
  reset(); lift(140); const x0 = CX + 6; runner(GF, x0 + 0.9 + t * 0.12, -0.2, t, 0.8); stopped(BF, x0 - 0.3, 0.3, t); stopped(SENPAI, x0 - 1.2, 0.1, t); sweatB.userData.set(1, t); sweatS.userData.set(1, t); CHOP.visible = false;
  if (t > d * 0.5) say(futari, t, d * 0.5, x0 + 0.3, 2.45, 0.2, 1.25);
  setHud('痩せろ と言った彼氏も', '2週間後', 1);
  runCam(x0 + 0.3, 0.3);
  return S;
}
function sKizuku(t, d) { // 彼氏は気づく。体力がないのは、自分のほうだった
  reset(); lift(140); const x0 = CX + 6; stopped(BF, x0 - 0.3, 0.3, t); BF.userData.head.rotation.x = -0.1; sweatB.userData.set(1, t); CHOP.visible = false;
  if (t > d * 0.4) say(jibun, t, d * 0.4, x0 - 0.3, 2.25, 0.3, 1.1);
  const u = ease(clamp(t / d)); look(x0 + lerp(0.2, 0.0, u), 1.5, lerp(4.6, 4.2, u), x0 - 0.3, 1.1, 0.2, 50);
  return S;
}
function sKieta(t, d) { // その日から、彼氏の口から 痩せろ が消えた
  reset(); lift(140); bfSeat(0.5); gfSeat(); SHOES.visible = true; CHOP.visible = false; const ph = t / d;
  if (ph < 0.5) say(yaseroW, t, 0.2, -0.75, 2.2, -0.4, 0.6); else { sparkY.set(clamp((t - d * 0.5) / 1.2)); say(kieta, t, d * 0.6, -0.1, 2.25, -0.4, 0.9); }
  tableCam(0.6);
  return S;
}
function sKekka(t, d) { // 結果：痩せろと言った男ほど、最初に音を上げた
  reset(); lift(140); const x0 = CX + 6; runner(GF, x0 + 0.9 + t * 0.12, -0.2, t, 0.8); stopped(BF, x0 - 0.3, 0.3, t); stopped(SENPAI, x0 - 1.2, 0.1, t); sweatB.userData.set(1, t); sweatS.userData.set(1, t); CHOP.visible = false;
  setTop('結果', '音を上げたのは 男', fade(t, 0.3, d, 0.25), GOLD);
  runCam(x0 + 0.3, 0.6);
  return S;
}
function sYaji(t, d) { // 痩せろ は、相手のためじゃなく、自分は走らない人の、客席からのヤジだったのかもしれない
  reset(); lift(140); const bx = CX + 30; seat(BF, bx, -0.8, 0); CHAIRS.get(BF).visible = false; BF.userData.arms[1].rotation.set(-1.2, 0, 0.1); BF.userData.arms[0].rotation.set(-1.0, 0, -0.1);
  RAMEN2.visible = true; BF.userData.arms[0].add(RAMEN2); runner(GF, bx + 2.5 - (t * 1.2) % 5, 1.4, t, 0.8); GF.rotation.y = -Math.PI / 2;
  if (t > d * 0.4) say(yaji, t, d * 0.4, bx, 2.25, -0.6, 1.0);
  const u = ease(clamp(t / d)); look(bx + lerp(0.4, 0.2, u), 1.6, lerp(4.6, 4.0, u), bx, 1.0, -0.4, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); bfSeat(); gfSeat(); SHOES.visible = true; tableCam(0); return S; }

const NARR = { 'はし': 'はし', '彼氏': 'かれし', '彼女': 'かのじょ', '目が合って': 'めがあって', '固まる': 'かたまる', '不満': 'ふまん', '太って': 'ふとって', '痩せろ': 'やせろ', '言われ続ける': 'いわれつづける', '1日目': 'いちにちめ', '夜': 'よる', '禁止': 'きんし', '止まる': 'とまる', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '朝': 'あさ', '息を切らしている': 'いきをきらしている', '困った': 'こまった', '飲み会': 'のみかい', '女の子': 'おんなのこ', '細い方': 'ほそいほう', '笑っていた': 'わらっていた', '先輩': 'せんぱい', '前にも': 'まえにも', '届く': 'とどく', '2週間後': 'にしゅうかんご', '走っている': 'はしっている', '後ろ': 'うしろ', '止まっている': 'とまっている', '2人の男': 'ふたりのおとこ', '気づく': 'きづく', '体力': 'たいりょく', '自分': 'じぶん', 'その日': 'そのひ', '口': 'くち', '消えた': 'きえた', '結果：': '結果、', '言った男': 'いったおとこ', '最初': 'さいしょ', '音を上げた': 'ねをあげた', '相手': 'あいて', '走らない人': 'はしらないひと', '客席': 'きゃくせき', 'ヤジ': 'ヤジ', '恋人': 'こいびと', '言う': 'いう' };
const P = planTimes([
  ['はしを持ったままの彼氏が、', (t, d) => sKatamaru(t, 2 * d)],
  ['彼女と目が合って固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['彼女たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['太っていないのに、<br>痩せろと言われ続ける。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。夜のラーメン、禁止。<br>彼氏のはしが止まる。', sDay1],
  ['3日目。コンビニのからあげも、<br>ビールも、禁止。', sDay3],
  ['1週間後。朝のランニング。', (t, d) => sWeek(t, 2 * d)],
  ['息を切らしているのは、<br>彼氏のほう。', (t, d) => sWeek(t + d, 2 * d)],
  ['でも、困ったのは、<br>彼氏だけじゃなかった。', sDemo],
  ['飲み会で 女の子は細い方がいい<br>と笑っていた先輩の前にも、', (t, d) => sSenpai(t, 2 * d)],
  ['シューズが届く。', (t, d) => sSenpai(t + d, 2 * d)],
  ['2週間後。彼女は<br>ふつうに走っている。', (t, d) => sTwoWeeks(t, 2 * d)],
  ['後ろで止まっているのは、<br>2人の男。', (t, d) => sTwoWeeks(t + d, 2 * d)],
  ['彼氏は気づく。体力がないのは、<br>自分のほうだった。', sKizuku],
  ['その日から、彼氏の口から<br>痩せろ が消えた。', sKieta],
  ['結果：痩せろと言った男ほど、<br>最初に音を上げた。', sKekka],
  ['痩せろ は、<br>相手のためじゃなく、', (t, d) => sYaji(t, 3 * d)],
  ['自分は走らない人の、', (t, d) => sYaji(t + d, 3 * d)],
  ['客席からのヤジだった<br>のかもしれない。', (t, d) => sYaji(t + 2 * d, 3 * d)],
  ['恋人に痩せろと言う、<br>あり？なし？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0744',
    v2: true,
    trial: true,
    remakeOf: '0657',
    tt: 'main',
    hookLine: 'ラーメンをすすりながら お前、ちょっと太った？ と言った彼氏の前で、どんぶりがパッと消えて、ランニングシューズに変わる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも 痩せろ と言った彼氏も、同じダイエットをしたら？',
    titleHtml: 'もしも 痩せろ と<br>言った彼氏も、<br>同じダイエット<br>をしたら？',
    mood: 'tension', seed: 744, hits: [TP, P.at(15), P.at(18)], risers: [P.at(8)], impacts: [P.at(10, 0.3), P.at(12, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.8), 'alarm'], [P.at(5, 0.8), 'alarm'], [P.at(6, 0.4), 'whoosh'], [P.at(10, 0.3), 'poof'], [P.at(14, 1.0), 'poof']],
    narr: NARR,
    ask: '恋人に痩せろと言う、あり？なし？',
    caption: 'もしも 痩せろ と言った彼氏も、同じダイエットをしたら？\n\nはしを持ったままの彼氏が、彼女と目が合って固まる。\n彼女たちの不満から。太っていないのに、痩せろと言われ続ける。\n1日目。夜のラーメン、禁止。彼氏のはしが止まる。\n3日目。コンビニのからあげも、ビールも、禁止。\n1週間後。朝のランニング。息を切らしているのは、彼氏のほう。\nでも、困ったのは、彼氏だけじゃなかった。\n飲み会で 女の子は細い方がいい と笑っていた先輩の前にも、シューズが届く。\n2週間後。彼女はふつうに走っている。後ろで止まっているのは、2人の男。\n彼氏は気づく。体力がないのは、自分のほうだった。\nその日から、彼氏の口から 痩せろ が消えた。\n\n結果：痩せろと言った男ほど、最初に音を上げた。\n痩せろ は、相手のためじゃなく、自分は走らない人の、客席からのヤジだったのかもしれない。\n\n恋人に痩せろと言う、あり？なし？ コメントで教えて。\n\n※風刺ネタです。もしもの設定で、登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'ダイエット', '彼氏', '男と女のもしも'],
    endStats: [['先に音を上げた', '痩せろと言った男', 'もしもの結果'], ['体力がなかったのは', '言った側', 'もしもの結果'], ['痩せろ の正体', '客席からのヤジ', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
