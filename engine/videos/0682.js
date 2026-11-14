import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, lamp } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers, setFruit, makeBug } from '../scenes/field.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { lab, setLabLight, setMice, researcher } from '../scenes/mouselab.js';
import { makeFly, makeSwarm } from '../scenes/spider.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { planTimes } from '../scenes/fitness.js';

// もしもハエが一匹残らず消えたら？（絶滅ボタン・台本 S86・作り直し 0701）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。plan/remake.md の6：絶滅ボタンの説明から入らず、消えた瞬間→困る人（生ゴミ・畑・森）を3秒ごと。数字は20秒より後
// 数字（一次資料で確認・2026/11/14）：
//  トラコーマ：失明・視覚障害 約190万人。感染者の目や鼻の分泌物に触れたハエがうつす（WHO ファクトシート Trachoma）
//  作物の花への訪問の25〜50%はハチ以外の虫（Rader ほか PNAS 113(1):146, 2016。PubMed の抄録で確認）
//  人の病気の遺伝子の77%（929個中714個）がショウジョウバエにもある（Reiter ほか Genome Research 11:1114, 2001。PubMed の抄録で確認）

const RED = '#ff8a7a', GOLD = '#ffd27a', GREEN = '#7ff0c8';
const FS = 1.5;

// ---------- 台所（room）：生ゴミの袋・ハエ・絶滅ボタン・ハエたたきの父さん ----------
const KIT = new THREE.Group(); room.add(KIT);
const BAG = new THREE.Group(); { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), new THREE.MeshLambertMaterial({ color: '#d8e4d0', transparent: true, opacity: 0.85, flatShading: true })); b.scale.set(1, 0.85, 0.8); b.position.y = 0.22; BAG.add(b); const knot = box(0.08, 0.1, 0.08, mat('#d8e4d0')); knot.position.y = 0.47; BAG.add(knot); for (const [x, z, c] of [[-0.08, 0.05, '#e2a04a'], [0.07, -0.02, '#7fae4a'], [0.0, 0.1, '#c9473c']]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(c)); f.position.set(x, 0.2, z); BAG.add(f); } }
BAG.position.set(-0.55, 0.94, -2.95); KIT.add(BAG);
const BTN = new THREE.Vector3(0.25, 0.945, -2.95);
const btn = makeXButton({ label: 'ハエ絶滅ボタン' }); btn.position.copy(BTN); KIT.add(btn);
const DAD = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#5a7aa8', pants: '#3b3f4a', scale: 1 }); KIT.add(DAD);
const SWAT = new THREE.Group(); { const h = box(0.03, 0.5, 0.03, mat('#e0c040')); h.position.y = -0.25; SWAT.add(h); const net = box(0.2, 0.22, 0.015, mat('#3fa0d8')); net.position.y = -0.6; SWAT.add(net); } SWAT.position.set(0, -0.62, 0.05); DAD.userData.arms[1].add(SWAT);
const kFly = []; for (let i = 0; i < 9; i++) { const f = makeFly(); f.scale.setScalar(FS); KIT.add(f); kFly.push(f); }
const KF = []; { const r = rng(9); for (let i = 0; i < 9; i++) KF.push([-0.55 + (r() - 0.5) * 0.3, 1.25 + r() * 0.3, -2.9 + (r() - 0.5) * 0.25, 0.12 + r() * 0.15, 1.4 + r() * 1.2]); }
function kitFlies(t, vis) { kFly.forEach((f, i) => { f.visible = vis; if (!vis) return; const [x, y, z, r, s] = KF[i]; const a = t * s + i * 1.7; f.position.set(x + Math.cos(a) * r, y + Math.sin(a * 2.3) * 0.06, z + Math.sin(a) * r * 0.6); f.rotation.y = -a - Math.PI / 2; f.userData.flap(t + i); }); }
const kitSpark = makeSparkles(200, 0.07); room.add(kitSpark.points); kitSpark.init(KF.map(k => [k[0], k[1], k[2]]), 0.2, 0.5);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.35 }); room.add(katamaru);
const negai = label('ハエなんか いらない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); room.add(negai);
const NEGAI3 = ['うるさい', '汚い'].map(s => { const l = label(s, { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.6 }); room.add(l); return l; });
const zero = label('たかるハエ 0匹', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); room.add(zero);
function kitchen() { setRoom({ sets: ['kitchen'] }); KIT.visible = true; setLight('day', { ceil: 6, hemi: 1.05 }); lamp.position.set(-0.2, 2.1, -2.4); }

// ---------- 地球：トラコーマ ----------
const HOT = [];
{ const r = rng(31); const g = new THREE.SphereGeometry(0.13, 8, 6);
  const zones = [[6, 14, 34, 10, 40], [9, 16, -12, 40, 45], [-6, 4, 29, 10, 18], [12, 17, 42, 6, 8], [-26, -18, 123, 12, 7], [-12, -2, -50, 12, 5], [25, 34, 64, 8, 6]];
  for (const [la0, la1, lo0, span, n] of zones) for (let i = 0; i < n; i++) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true })); m.position.copy(latLon(la0 + r() * (la1 - la0), lo0 + r() * span, 10.08)); earth.add(m); HOT.push({ m, k: r() }); } }
function hotVis(k) { for (const x of HOT) { x.m.visible = k > 0.001; x.m.material.opacity = clamp((k - x.k * 0.4) / 0.6); } }
const gFly = makeSwarm(140, 7, { x0: -6, x1: 6, y0: -2, y1: 5, z0: 9, z1: 13, size: 0.09 }); space.add(gFly.mesh);
const tasukaru = label('助かる人もいる', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 7 }); space.add(tasukaru);

// ---------- 畑と森（field） ----------
const fSwarm = makeSwarm(60, 3, { x0: -3, x1: 3, y0: 0.35, y1: 1.1, z0: -2, z1: 2.5, size: 0.06 }); field.add(fSwarm.mesh);
const bees = []; for (let i = 0; i < 2; i++) { const b = makeBug('bee'); b.scale.setScalar(0.8); field.add(b); bees.push(b); }
function fieldBees(t) { bees.forEach((b, i) => { const a = t * (0.7 + i * 0.2) + i * 2.1; b.position.set(Math.cos(a) * (1.2 + i * 0.5), 0.8 + Math.sin(t * 2 + i) * 0.15, -0.6 + Math.sin(a) * 1.0); b.rotation.y = -a; b.userData.flap(t + i); }); }
const sukunai = label('来る虫が 少ない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.6 }); field.add(sukunai);
const hana = label('ハチ以外 25〜50%', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); field.add(hana);
// 森のはずれ（x=-20）：死がいとフン
const FX = -20, FZ = -6;
const DEAD = new THREE.Group(); { const m = mat('#8a7a6a'); const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), m); body.scale.set(1.5, 0.75, 0.9); body.position.y = 0.16; DEAD.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), m); hd.position.set(0.38, 0.14, 0); DEAD.add(hd); for (const [x, z] of [[-0.18, -0.1], [-0.18, 0.1], [0.15, -0.1], [0.15, 0.1]]) { const l = box(0.04, 0.2, 0.04, m); l.position.set(x, 0.36, z); DEAD.add(l); } const tail = box(0.35, 0.03, 0.03, m); tail.position.set(-0.5, 0.06, 0); DEAD.add(tail); } DEAD.rotation.y = 0.6; DEAD.position.set(FX, 0, FZ); field.add(DEAD);
const DUNG = []; { const r = rng(12); for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.09 + r() * 0.05, 7, 5), mat('#5a3e26')); d.scale.y = 0.55; d.position.set(FX + 0.6 + r() * 0.8, 0.04, FZ + 0.3 + r() * 0.8); field.add(d); DUNG.push(d); } }
const LEAVES = []; { const r = rng(14); for (let i = 0; i < 40; i++) { const l = box(0.12, 0.01, 0.08, mat(['#a0743a', '#c08a3a', '#7a5a2a'][i % 3])); l.position.set(FX - 1.5 + r() * 3.5, 0.01 + i * 0.0004, FZ - 1 + r() * 3); l.rotation.y = r() * 3; field.add(l); LEAVES.push(l); } }
const katazukanai = label('なかなか 片付かない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(110,80,50,.96)', sx: 1.5 }); field.add(katazukanai);
const soujiin = label('地球の清掃員', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); field.add(soujiin);
const FLY_BIG = makeFly(); FLY_BIG.scale.setScalar(5); field.add(FLY_BIG);
const CAP = new THREE.Group(); { const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#3a7fd0')); CAP.add(c); const v = box(0.2, 0.02, 0.14, mat('#3a7fd0')); v.position.set(0, 0, 0.14); CAP.add(v); } field.add(CAP);

// ---------- 研究室（lab） ----------
const VIALS = [];
{ const glassM = new THREE.MeshLambertMaterial({ color: '#dff2ff', transparent: true, opacity: 0.35 }); const plugM = mat('#e9dcc0'), foodM = mat('#d9a24a');
  for (let i = 0; i < 10; i++) { const x = 0.55 + (i % 5) * 0.2, z = -1.05 - Math.floor(i / 5) * 0.2;
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 12), glassM); v.position.set(x, 1.09, z); lab.add(v);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.06, 12), plugM); p.position.set(x, 1.27, z); lab.add(p);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.06, 12), foodM); f.position.set(x, 0.96, z); lab.add(f);
    const sw = makeSwarm(7, 20 + i, { x0: x - 0.03, x1: x + 0.03, y0: 1.0, y1: 1.18, z0: z - 0.03, z1: z + 0.03, size: 0.014 }); lab.add(sw.mesh); VIALS.push({ x, z, sw }); } }
const rack = box(1.15, 0.04, 0.5, mat('#9aa4ae')); rack.position.set(0.95, 0.94, -1.15); lab.add(rack);
const labSpark = makeSparkles(200, 0.04); lab.add(labSpark.points); labSpark.init(VIALS.map(v => [v.x, 1.1, v.z]), 0.08, 0.35);
function vials(n, t) { VIALS.forEach(v => v.sw.set(n, t)); }
const aibou = label('研究の相棒', { w: 640, size: 110, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 0.75 }); lab.add(aibou);
const inai = label('いなくなる', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); lab.add(inai);
function labDress() { setLabLight('day'); setMice(1); researcher.position.set(1.95, 0, -0.35); researcher.rotation.y = -0.9; }

const LABELS = [katamaru, negai, ...NEGAI3, zero, tasukaru, sukunai, hana, katazukanai, soujiin, aibou, inai];
function reset() {
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; kitSpark.set(0); labSpark.set(0);
  btn.userData.labelOn(false); btn.userData.press(1); btn.userData.hand(0);
  DAD.visible = true; DAD.position.set(1.0, 0, -2.0); DAD.rotation.set(0, -0.9, 0); DAD.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); DAD.userData.head.rotation.set(0, 0, 0);
  FLY_BIG.visible = false; CAP.visible = false; DEAD.visible = true; DUNG.forEach(d => d.visible = true);
  hotVis(0); gFly.set(0, 0); fSwarm.set(0, 0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.45;
function hookCam(u = 0) { look(lerp(-0.15, -0.15, u), lerp(2.05, 2.0, u), lerp(-0.55, -0.75, u), -0.15, lerp(1.62, 1.58, u), -2.95, 50); }
function swatPose(k = 1) { DAD.userData.arms[1].rotation.set(-2.6 * k, 0, -0.2); }
function shot0(t) { // 0秒＝サムネ：台所の生ゴミにたかるハエが、パッと一斉に消える（赤いボタンを押した瞬間）
  reset(); lift(0); kitchen(); const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); swatPose(1);
  kitFlies(t, t < TP);
  kitSpark.set(t >= TP ? (t - TP) / 1.0 : 0); el.flash.style.opacity = t >= TP ? 0.45 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  setHud('絶滅ボタンを押すまで', xCountdown(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  hookCam(ease(clamp(t / 3)) * 0.3);
  return room;
}
function dadCam(u = 0) { look(lerp(0.0, -0.2, u), 1.75, lerp(0.2, -0.3, u), 0.85, 1.45, -2.1, 50); }
function sDad(t, d) { // ハエたたきを構えた父さん、振る相手がいなくて固まる
  reset(); lift(120); kitchen(); kitFlies(0, false); swatPose(1); DAD.userData.head.rotation.y = Math.sin(t * 2.2) * 0.45;
  if (t > d * 0.45) say(katamaru, t, d * 0.45, 0.95, 2.05, -2.0, 0.32);
  dadCam(ease(clamp(t / d)));
  return room;
}
function sNegai(t, d) { // みんなの願いから。うるさい、汚い、ハエなんかいらない
  reset(); lift(120); kitchen(); kitFlies(t, true); btn.userData.press(0); swatPose(0.6 + 0.4 * Math.abs(Math.sin(t * 4)));
  NEGAI3.forEach((l, i) => { if (t > 0.4 + i * d * 0.25) say(l, t, 0.4 + i * d * 0.25, -0.55 + i * 0.7, 1.95, -2.7, 0.5); });
  if (t > d * 0.62) say(negai, t, d * 0.62, -0.2, 1.68, -2.6, 1.15);
  setHud('ハエが消える前', '回想', 1);
  look(-0.1, 1.75, -0.6, -0.2, 1.4, -2.9, 50);
  return room;
}
function sDay1(t, d) { // 1日目。生ゴミの袋に、もう一匹もたからない
  reset(); lift(120); kitchen(); kitFlies(0, false); DAD.visible = false;
  if (t > d * 0.4) say(zero, t, d * 0.4, -0.55, 1.75, -2.8, 0.85);
  setHud('ハエが消えて', '1日目', 1);
  const u = ease(clamp(t / d)); look(lerp(-0.2, -0.4, u), lerp(1.65, 1.55, u), lerp(-1.7, -1.95, u), -0.55, 1.15, -2.95, 50);
  return room;
}
function fieldEnv() { setFieldEnv('day'); setFlowers(1); setFruit(1); }
function sMonth(t, d) { // 1か月後。畑の花に、来る虫が少ない
  reset(); lift(300); fieldEnv(); fieldBees(t);
  if (t > d * 0.45) say(sukunai, t, d * 0.45, 0, 2.0, -0.5, 1.5);
  setHud('ハエが消えて', '1か月後', 1);
  const u = ease(clamp(t / d)); look(lerp(-2.5, -1.8, u), lerp(2.6, 2.4, u), lerp(7.0, 6.2, u), 0, 0.5, 0.3, 50);
  return field;
}
function forestCam(u = 0) { look(FX + lerp(1.6, 1.2, u), lerp(1.5, 1.3, u), FZ + lerp(3.4, 2.8, u), FX + 0.4, 0.2, FZ + 0.4, 50); }
function sHalf(t, d) { // 半年後。森の死がいとフンが、なかなか片付かない
  reset(); lift(160); setFieldEnv('dusk');
  if (t > d * 0.45) say(katazukanai, t, d * 0.45, FX + 0.4, 0.85, FZ + 0.4, 1.1);
  setHud('ハエが消えて', '半年後', 1);
  forestCam(ease(clamp(t / d)));
  return field;
}
function earthCam(t, d) { const u = ease(clamp(t / d)); look(0, lerp(4, 2, u), lerp(40, 35, u), 0, -2.5, 0, 45); }
function sTasukaru(t, d) { // でも、ハエが消えて助かる人もいる
  reset(); lift(0); setEarthNight(0); earth.rotation.y = faceLon(22) + 0.2 - t * 0.04; hotVis(clamp(t / 1.2));
  if (t > d * 0.4) say(tasukaru, t, d * 0.4, 0, 7, 12, 6.0);
  earthCam(t, d * 3);
  return space;
}
function sTrachoma(t, d) { // 目の病気トラコーマで失明・視覚障害の人は、世界で約190万人。その運び屋がハエ
  reset(); lift(0); setEarthNight(0); earth.rotation.y = faceLon(22) + 0.2 - (t + 2) * 0.04; hotVis(1);
  gFly.set(t > d * 0.62 ? 140 : 0, t);
  setTop('トラコーマで失明・視覚障害（WHO）', '約' + countUp(t, 190, 0.6, 1.0) + '万人', fade(t, 0.5, d, 0.25), RED); setHud('世界', 'WHO ファクトシート', 1);
  earthCam(t + 2, d * 3);
  return space;
}
function sHana(t, d) { // ところが、作物の花に来る虫の25〜50%はハチ以外。ハエもその1つ
  reset(); lift(300); fieldEnv(); fieldBees(t + 8); fSwarm.set(60, t);
  const v = t < 2.2 ? countUp(t, 25, 0.8, 1.0) + '%' : '25〜50%';
  setTop('作物の花に来る、ハチ以外の虫（2016年）', v, fade(t, 0.6, d, 0.25), GOLD); setHud('Rader ほか', 'PNAS 2016年', 1);
  const u = ease(clamp(t / d)); look(lerp(-1.6, -1.0, u), lerp(2.0, 1.8, u), lerp(5.0, 4.4, u), 0, 0.6, 0.3, 50);
  return field;
}
function labCam(u, a, b) { look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0.95, 1.05, -1.15, 50); }
function sLab(t, d) { // そして研究室。人の病気の遺伝子の77%が、ハエにもある
  reset(); lift(160); labDress(); vials(7, t);
  setTop('人の病気の遺伝子が、ショウジョウバエにも（2001年）', countUp(t, 77, 0.8, 1.2) + '%', fade(t, 0.6, d, 0.25), GREEN); setHud('Reiter ほか', 'Genome Research 2001年', 1);
  labCam(ease(clamp(t / d)), [0.1, 1.75, 1.0], [0.3, 1.7, 0.7]);
  return lab;
}
function sAibou(t, d) { // 病気の研究の相棒が、いなくなる
  reset(); lift(160); labDress(); const tv = 0.8; vials(t < tv ? 7 : 0, t); labSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  researcher.userData.head.rotation.y = t > 1.6 ? Math.sin(t * 2) * 0.5 : 0;
  say(aibou, t, 0.2, 0.95, 1.65, -1.15, 0.6); if (t > d * 0.5) say(inai, t, d * 0.5, 0.95, 1.45, -1.0, 0.55);
  labCam(ease(clamp(t / d)), [0.3, 1.7, 0.7], [0.4, 1.8, 0.9]);
  return lab;
}
function sKekka(t, d) { // 結果：ハエが消えて、病気の運び屋は消えた。でも、花の運び屋と、森の掃除屋と、研究の相棒も消えた
  reset(); lift(160); setFieldEnv('dusk');
  const lines = ['病気の運び屋は 消えた', '花の運び屋も', '森の掃除屋も', '研究の相棒も'];
  setTop('結果', t < d * 0.25 ? '病気の運び屋が消えた' : '相棒も一緒に消えた', fade(t, 0.3, d, 0.25), t < d * 0.25 ? RED : GOLD);
  const u = ease(clamp(t / d)); look(FX + lerp(1.2, 2.2, u), lerp(1.3, 2.2, u), FZ + lerp(2.8, 4.5, u), FX + 0.4, 0.2, FZ + 0.4, 50);
  return field;
}
function sSouji(t, d) { // ハエは、嫌われながら働いていた、地球の清掃員だったのかもしれない
  reset(); lift(160); setFieldEnv('day'); FLY_BIG.visible = true; FLY_BIG.position.set(FX + 0.4, 0.55, FZ + 0.4); FLY_BIG.rotation.y = 0.6; FLY_BIG.userData.flap(t);
  CAP.visible = true; CAP.position.set(FX + 0.4, 0.72, FZ + 0.42); CAP.scale.setScalar(0.7); CAP.rotation.y = 0.6;
  if (t > d * 0.5) say(soujiin, t, d * 0.5, FX + 0.4, 1.35, FZ + 0.4, 0.9);
  look(FX + 1.5, 1.2, FZ + 3.0, FX + 0.4, 0.75, FZ + 0.4, 50);
  return field;
}
function sAsk(t) { // 冒頭と同じ構図（ハエは消えたまま）
  reset(); lift(0); kitchen(); kitFlies(0, false); swatPose(1); btn.userData.press(1); btn.userData.hand(0); setHud('絶滅ボタンを押すまで', xCountdown(0), 1, { mono: true, color: '#ff6b6b' }); hookCam(0); return room;
}

const NARR = { '一匹': 'いっぴき', '構えた': 'かまえた', '父さん': 'とうさん', '固まる': 'かたまる', '願い': 'ねがい', '汚い': 'きたない', '1日目': 'いちにちめ', '生ゴミ': 'なまゴミ', '袋': 'ふくろ', '1か月後': 'いっかげつご', '畑': 'はたけ', '半年後': 'はんとしご', '死がい': 'しがい', '片付かない': 'かたづかない', '助かる': 'たすかる', '失明': 'しつめい', '視覚障害': 'しかくしょうがい', '約190万人': 'やく190万人', '運び屋': 'はこびや', '作物': 'さくもつ', '25〜50%': '25から50パーセント', '77%': '77パーセント', '遺伝子': 'いでんし', '相棒': 'あいぼう', '結果：': '結果、', '掃除屋': 'そうじや', '嫌われ': 'きらわれ', '清掃員': 'せいそういん', '絶滅ボタン': 'ぜつめつボタン', '研究室': 'けんきゅうしつ' };
const P = planTimes([
  ['ハエたたきを構えた父さん、<br>振る相手がいなくて固まる。', sDad],
  ['みんなの願いから。<br>うるさい、汚い、', (t, d) => sNegai(t, 2 * d)],
  ['ハエなんかいらない。', (t, d) => sNegai(t + d, 2 * d)],
  ['1日目。生ゴミの袋に、<br>もう一匹もたからない。', sDay1],
  ['1か月後。畑の花に、<br>来る虫が少ない。', sMonth],
  ['半年後。森の死がいとフンが、<br>なかなか片付かない。', sHalf],
  ['でも、ハエが消えて<br>助かる人もいる。', sTasukaru],
  ['目の病気トラコーマで<br>失明・視覚障害の人は、', (t, d) => sTrachoma(t, 3 * d)],
  ['世界で約190万人。', (t, d) => sTrachoma(t + d, 3 * d)],
  ['その運び屋がハエ。', (t, d) => sTrachoma(t + 2 * d, 3 * d)],
  ['ところが、作物の花に来る虫の<br>25〜50%はハチ以外。', (t, d) => sHana(t, 2 * d)],
  ['ハエもその1つ。', (t, d) => sHana(t + d, 2 * d)],
  ['そして研究室。人の病気の<br>遺伝子の77%が、ハエにもある。', sLab],
  ['病気の研究の相棒が、<br>いなくなる。', sAibou],
  ['結果：ハエが消えて、<br>病気の運び屋は消えた。', (t, d) => sKekka(t, 3 * d)],
  ['でも、花の運び屋と、<br>森の掃除屋と、', (t, d) => sKekka(t + d, 3 * d)],
  ['研究の相棒も消えた。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['ハエは、嫌われながら<br>働いていた、', (t, d) => sSouji(t, 2 * d)],
  ['地球の清掃員<br>だったのかもしれない。', (t, d) => sSouji(t + d, 2 * d)],
  ['次に絶滅ボタンを<br>押したい生き物は？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0682',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0701',
    hookLine: '台所の生ゴミにたかるハエが、パッと一斉に消える。',
    series: '絶滅ボタン',
    hookType: 'H2',
    cat: '生き物・動物',
    title: 'もしもハエが一匹残らず消えたら？',
    titleHtml: 'もしもハエが<br>一匹残らず<br>消えたら？',
    mood: 'tension', seed: 682, hits: [TP, P.at(14), P.at(18)], risers: [P.at(6)], impacts: [P.at(8, 0.4), P.at(10, 1.0), P.at(12, 1.0)],
    sfx: [[0.1, 'buzz'], [TP, 'poof'], [P.at(0, 0.6), 'whoosh'], [P.at(5, 0.6), 'meter', 0.3], [P.at(9, 0.4), 'buzz'], [P.at(13, 0.8), 'poof']],
    narr: NARR,
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしもハエが一匹残らず消えたら？\n\nハエたたきを構えた父さん、振る相手がいなくて固まる。\nみんなの願いから。うるさい、汚い、ハエなんかいらない。\n1日目。生ゴミの袋に、もう一匹もたからない。\n1か月後。畑の花に、来る虫が少ない。\n半年後。森の死がいとフンが、なかなか片付かない。\nでも、ハエが消えて助かる人もいる。\n目の病気トラコーマで失明・視覚障害の人は、世界で約190万人。その運び屋がハエ（WHO）。\nところが、作物の花に来る虫の25〜50%はハチ以外。ハエもその1つ（2016年の研究）。\nそして研究室。人の病気の遺伝子の77%が、ハエ（ショウジョウバエ）にもある（2001年の研究）。\n病気の研究の相棒が、いなくなる。\n\n結果：ハエが消えて、病気の運び屋は消えた。でも、花の運び屋と、森の掃除屋と、研究の相棒も消えた。\nハエは、嫌われながら働いていた、地球の清掃員だったのかもしれない。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：WHO ファクトシート Trachoma、Rader ほか PNAS（2016年）、Reiter ほか Genome Research（2001年）',
    hashtags: ['もしもラボ', 'もしも', 'ハエ', '絶滅ボタン', '生き物'],
    endStats: [['トラコーマで失明・視覚障害', '約190万人', 'WHO'], ['作物の花に来るハチ以外の虫', '25〜50%', '2016年'], ['人の病気の遺伝子がハエにも', '77%', '2001年']],
    sources: '出典：WHO ファクトシート Trachoma、<br>PNAS（2016年）、Genome Research（2001年）',
  },
});
