import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom, makeShop } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしもホストクラブが消えたら？（皮肉回・台本 S25・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：Togetter・ガルちゃんで燃える ホス狂い・売掛 の話
// 数字（裏取り済み）：改正風営法 2025年6月28日施行。接待飲食営業の店が守ること（遵守事項）に
//  客の恋愛感情につけ込んで飲食などを求めることの禁止・料金の虚偽説明の禁止などが入った（警察庁・神奈川県警察 風営法改正のページ）
// 店名・服装は架空（実在の店・グループには似せない）

const GOLD = '#ffd27a', RED = '#ff5a5a', PINK = '#ff7ab8', VIO = '#c08aff';

const S = new THREE.Scene();
S.background = new THREE.Color('#140f1e'); S.fog = new THREE.Fog(0x140f1e, 40, 160);
const hemi = new THREE.HemisphereLight(0xd8c8ff, 0x302040, 0.95); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#1a1424', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
function makeHost(i = 0) { const p = makeMan({ shirt: ['#1a1a22', '#2a2440', '#3a2030'][i % 3], hair: ['#e8d8b0', '#c8a070', '#d0c0d8'][i % 3], pants: '#1a1a22' }); const sh = box(0.2, 0.46, 0.02, mat('#f4f4f2')); sh.position.set(0, 1.22, 0.142); p.add(sh); return p; }
function makeJo(i = 0) { return makeWoman({ shirt: ['#ff7ab8', '#c08aff', '#ffd27a', '#7fd4ff'][i % 4], pants: ['#ff7ab8', '#c08aff', '#ffd27a', '#7fd4ff'][i % 4], hair: ['#c8a070', '#3a2620', '#e8d8b0', '#5a3a28'][i % 4], skirt: true }); }
const glassM = new THREE.MeshBasicMaterial({ color: '#ffd860', transparent: true, opacity: 0.95 });
const glassRim = new THREE.MeshBasicMaterial({ color: '#fff6d0' });
function makeGlass() { const g = new THREE.Group(); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.09, 0.16, 12, 1), glassM); bowl.position.y = 0.2; g.add(bowl); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 16), glassRim); rim.rotation.x = Math.PI / 2; rim.position.y = 0.28; g.add(rim); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), glassM); stem.position.y = 0.06; g.add(stem); const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12), glassM); g.add(ft); return g; }

// ---------- A：店の中のシャンパンタワー（原点） ----------
const afloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#221a30', { depthWrite: false })); afloor.rotation.x = -Math.PI / 2; afloor.position.set(0, 0.01, 0); afloor.renderOrder = -0.8; S.add(afloor);
const awall = box(14, 4, 0.2, mat('#2a1e3a')); awall.position.set(0, 2, -3.2); S.add(awall);
const neonM = new THREE.MeshBasicMaterial({ color: '#ff5fae' });
for (const [w, h, x, y] of [[8, 0.08, 0, 3.4], [8, 0.08, 0, 0.9], [0.08, 2.5, -4, 2.15], [0.08, 2.5, 4, 2.15]]) { const n = box(w, h, 0.06, neonM); n.position.set(x, y, -3.08); S.add(n); }
const tableA = box(2.4, 0.7, 1.4, mat('#3a2c48')); tableA.position.set(0, 0.35, -1.0); S.add(tableA);
const tTop = box(2.5, 0.06, 1.5, mat('#e8d8f0')); tTop.position.set(0, 0.72, -1.0); S.add(tTop);
const GLASSES = []; // 上から順に消えるよう、段の上から並べる
{ const levels = 5; for (let L = levels - 1; L >= 0; L--) { const n = L + 1; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const gl = makeGlass(); gl.position.set((i - (n - 1) / 2) * 0.34, 0.75 + (levels - 1 - L) * 0.27, -1.0 + (j - (n - 1) / 2) * 0.34); gl.userData.lv = levels - 1 - L; S.add(gl); GLASSES.push(gl); } } }
GLASSES.sort((a, b) => b.userData.lv - a.userData.lv);
const bottle = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14), mat('#1a3a2a')); b.position.y = 0.25; bottle.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.2, 10), mat('#1a3a2a')); n.position.y = 0.6; bottle.add(n); const f = box(0.08, 0.08, 0.08, mat('#e8c060')); f.position.y = 0.72; bottle.add(f); }
const HOSTS = [0, 1, 2].map(i => { const h = makeHost(i); S.add(h); return h; });
const poofA = makeSparkles(200, 0.16, 0xffe6a0); S.add(poofA.points); poofA.init(GLASSES.map(g => [g.position.x, g.position.y + 0.2, g.position.z]), 0.15, 1.2);
const glow = new THREE.PointLight(0xff7ab8, 14, 10, 1.4); glow.position.set(0, 3, 0.5); S.add(glow);

// ---------- B：娘を持つ親（x=60） ----------
const BX = 60;
const broom = makeRoom({ w: 9, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); broom.position.set(BX, 0, 0); broom.userData.rw.visible = false; S.add(broom);
const btbl = box(1.8, 0.7, 1.0, mat('#8a5a32')); btbl.position.set(BX, 0.35, -1.2); S.add(btbl);
const DAD = makeOji(rng(3), { shirt: '#8a8f99', bald: false }); S.add(DAD); const MOM = makeWoman({ shirt: '#c9a8d8', hair: '#5a4a40' }); S.add(MOM);
const photo = box(0.5, 0.4, 0.04, mat('#ffd0e0')); photo.position.set(BX, 1.0, -1.2); photo.rotation.x = -0.3; S.add(photo);
const shinpai = label('娘が心配', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 1.2 }); S.add(shinpai);
const BILL = makeDoc({ title: '請求書', rows: ['シャンパン', 'タワー', '合計'], head: '#8a2a5a', w: 1.3, h: 1.4 }); S.add(BILL);
const nanbyaku = label('何百万円', { w: 768, size: 120, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.3 }); S.add(nanbyaku);

// ---------- C：夜の街（x=120）：ホストクラブとキャバクラ ----------
const CX = 120;
const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat('#2a2632', { depthWrite: false })); street.rotation.x = -Math.PI / 2; street.position.set(CX, 0.02, 2); street.renderOrder = -0.8; S.add(street);
const walkw = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), mat('#3a3442', { depthWrite: false })); walkw.rotation.x = -Math.PI / 2; walkw.position.set(CX, 0.03, -1.2); walkw.renderOrder = -0.7; S.add(walkw);
const HOSTSHOP = makeShop({ w: 3.7, h: 5, d: 3.0, body: '#2c2238', neon: '#ff5fae', text: 'ホストクラブ' }); HOSTSHOP.g.position.set(CX - 2.0, 0, -4.4); S.add(HOSTSHOP.g);
const CABA = makeShop({ w: 3.7, h: 5, d: 3.0, body: '#22263a', neon: '#7fd4ff', text: 'キャバクラ' }); CABA.g.position.set(CX + 2.0, 0, -4.4); S.add(CABA.g);
const poofC = makeSparkles(220, 0.3, 0xff9ad0); S.add(poofC.points); poofC.init([[CX - 2.0, 2.6, -3.4]], 2.4, 1.8);
const JOS = [0, 1, 2, 3].map(i => { const j = makeJo(i); S.add(j); return j; });
const tanto = label('担当に会うため', { w: 1024, size: 100, color: '#fff', bg: 'rgba(255,90,140,.96)', sx: 1.9 }); S.add(tanto);
const zero = label('稼ぐ理由 ゼロ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 1.6 }); S.add(zero);
const heart = label('♥', { w: 256, h: 256, size: 220, color: '#ff5fae', stroke: 16, strokeColor: '#fff', sx: 0.8 }); S.add(heart);
const yameru = label('辞めます', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.0 }); S.add(yameru);

// ---------- D：キャバクラの席（x=180） ----------
const DX = 180;
const dfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#1e2236', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, 0); dfloor.renderOrder = -0.8; S.add(dfloor);
const dwall = box(14, 4, 0.2, mat('#262a44')); dwall.position.set(DX, 2, -3.0); S.add(dwall);
const neonD = new THREE.MeshBasicMaterial({ color: '#7fd4ff' }); for (const [w, h, x, y] of [[7, 0.08, 0, 3.2], [7, 0.08, 0, 1.0]]) { const n = box(w, h, 0.06, neonD); n.position.set(DX + x, y, -2.88); S.add(n); }
const sofa = new THREE.Group(); { const b = box(3.0, 0.45, 0.9, mat('#5a2a4a')); b.position.y = 0.3; sofa.add(b); const bk = box(3.0, 0.7, 0.25, mat('#4a2040')); bk.position.set(0, 0.8, -0.4); sofa.add(bk); } sofa.position.set(DX, 0, -1.6); S.add(sofa);
const ltbl = box(1.6, 0.4, 0.7, mat('#2a2440')); ltbl.position.set(DX, 0.2, -0.5); S.add(ltbl);
const OJI = makeOji(rng(11), { shirt: '#59606e', bald: true }); S.add(OJI);
const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const JO1 = makeJo(0); S.add(JO1);
const inai = label('指名の子がいない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 1.9 }); S.add(inai);
const aozame = label('青ざめる', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.2 }); S.add(aozame);

// ---------- E：お金の輪（x=240） ----------
const EX = 240;
const efloor = new THREE.Mesh(new THREE.CircleGeometry(8, 48), mat('#221a30', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -1); efloor.renderOrder = -0.8; S.add(efloor);
const R = 2.3; const NODE = [Math.PI / 2 + Math.PI * 2 / 3 * 2, Math.PI / 2, Math.PI / 2 + Math.PI * 2 / 3];
// 左下＝おぢ、上＝嬢、右下＝ホスト（画面の手前から見て）
const nodePos = (a) => [EX + Math.cos(a) * R * 1.0, 0, -1 - Math.sin(a) * R * 0.55];
const OJI_E = makeOji(rng(11), { shirt: '#59606e', bald: true }); S.add(OJI_E);
const JO_E = makeJo(0); S.add(JO_E);
const HOST_E = makeHost(0); S.add(HOST_E);
const towerE = new THREE.Group(); { for (let L = 0; L < 3; L++) { const n = 3 - L; for (let i = 0; i < n; i++) { const gl = makeGlass(); gl.position.set((i - (n - 1) / 2) * 0.34, L * 0.27, 0); towerE.add(gl); } } } S.add(towerE);
const ringPts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; ringPts.push(new THREE.Vector3(EX + Math.cos(a) * R, 0.08, -1 - Math.sin(a) * R * 0.55)); }
const ringLine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts, true), 96, 0.05, 6, true), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85 })); S.add(ringLine);
const COINS = []; for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), mat('#e8b84a')); c.rotation.x = Math.PI / 2; S.add(c); COINS.push(c); }
const L_OJI = label('おぢ', { w: 384, size: 110, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.75 }); S.add(L_OJI);
const L_JO = label('嬢', { w: 256, size: 110, color: '#fff', bg: 'rgba(255,90,140,.96)', sx: 0.55 }); S.add(L_JO);
const L_HOST = label('ホスト', { w: 512, size: 110, color: '#fff', bg: 'rgba(140,80,220,.96)', sx: 0.95 }); S.add(L_HOST);
const stopX = label('×', { w: 256, h: 256, size: 230, color: '#ff3a3a', stroke: 18, strokeColor: '#fff', sx: 1.0 }); stopX.material.depthTest = false; stopX.renderOrder = 8; S.add(stopX);
const mitsugi = label('貢いでいた相手は？', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(mitsugi);

// ---------- F：法律（x=300） ----------
const FX = 300;
const ffloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#221a30', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.02, -1); ffloor.renderOrder = -0.8; S.add(ffloor);
const LAW = makeDoc({ title: '改正風営法', rows: ['施行', '禁止'], head: '#3a3f6e', w: 2.0, h: 1.5 }); LAW.position.set(FX, 2.0, -1); S.add(LAW);

const ALL = [...HOSTS, DAD, MOM, ...JOS, OJI, JO1, OJI_E, JO_E, HOST_E];
HOSTS.forEach((h, i) => { h.position.set(-1.9 + i * 1.9, 0, -2.2 + (i === 1 ? -0.3 : 0)); });
DAD.position.set(BX - 0.6, 0, -1.9); MOM.position.set(BX + 0.6, 0, -1.9); BILL.position.set(BX, 1.6, -0.8);
JOS.forEach((j, i) => j.position.set(CX - 4 + i * 0.9, 0, -1.4)); OJI.position.set(DX - 0.5, 0, -1.6); JO1.position.set(DX + 0.6, 0, -1.6);
const NP = NODE.map(nodePos); OJI_E.position.set(...NP[0]); JO_E.position.set(...NP[1]); HOST_E.position.set(...NP[2]); towerE.position.set(NP[2][0] + 0.8, 0.0, NP[2][2] + 0.2);
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  HOSTS.forEach((h, i) => { h.position.set(-1.9 + i * 1.9, 0, -2.2 + (i === 1 ? -0.3 : 0)); h.rotation.y = (1 - i) * 0.3; });
  GLASSES.forEach(g => g.visible = true); poofA.set(0); poofC.set(0);
  [shinpai, nanbyaku, tanto, zero, heart, yameru, inai, aozame, L_OJI, L_JO, L_HOST, stopX, mitsugi].forEach(l => l.visible = false);
  HOSTSHOP.g.visible = true; HOSTSHOP.on(1); CABA.on(1); sweatO.userData.set(0); COINS.forEach(c => c.visible = false); ringLine.material.color.set('#ffd27a');
  BILL.userData.fill(0, ''); BILL.userData.fill(1, ''); BILL.userData.fill(2, ''); LAW.userData.fill(0, ''); LAW.userData.fill(1, '');
  hemi.intensity = 0.95; glow.intensity = 14; el.flash.style.opacity = 0;
}
const T0 = 0.05, T1 = 0.55;
function towerCam(d = 0) { look(lerp(0.25, 0.1, d), 1.95, lerp(3.4, 3.7, d), 0, 1.8, -1.0, 52); }
function vanishGlasses(k) { const n = Math.floor(k * GLASSES.length); GLASSES.forEach((g, i) => g.visible = i >= n); }
function shot0(t) { // 0秒＝サムネ：シャンパンタワーのグラスが、上から順に消えていく
  reset(); lift(0);
  const k = clamp((t - T0) / (T1 - T0)); vanishGlasses(k * 0.62); poofA.set(t > T0 ? clamp((t - T0) / 1.8) : 0);
  HOSTS.forEach((h, i) => { h.userData.head.rotation.x = t > 0.3 ? 0.25 : 0; if (t > 0.3) h.userData.arms.forEach(a => a.rotation.x = -0.5); });
  el.flash.style.opacity = t > 0.25 && t < 0.37 ? 0.25 : 0;
  towerCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // 娘を持つ親たちの不満から。
  reset(); lift(80); DAD.rotation.y = 0.3; MOM.rotation.y = -0.3; DAD.userData.head.rotation.x = 0.3; MOM.userData.arms[1].rotation.x = -1.2; MOM.userData.head.rotation.x = 0.2; BILL.visible = false;
  shinpai.position.set(BX, 2.6, -1.8); pop(shinpai, t, 0.5, 0.3, 1.15);
  look(BX, 2.1, 3.6, BX, 1.35, -1.4, 52);
  return S;
}
function shot2(t) { // 恋心につけ込んで、何百万円も使わせる店がある
  reset(); lift(160); BILL.visible = true; BILL.position.set(BX, 1.75, -0.8); DAD.userData.head.rotation.x = -0.1; MOM.userData.arms.forEach(a => a.rotation.x = -0.6);
  BILL.userData.fill(0, '◯◯万円'); BILL.userData.fill(1, t > 0.8 ? '◯◯◯万円' : ''); BILL.userData.fill(2, t > 1.6 ? '？？？万円' : '');
  nanbyaku.position.set(BX, 2.8, -0.7); pop(nanbyaku, t, 2.2, 0.25, 1.2);
  look(BX, 2.0, 3.4, BX, 1.7, -1.0, 50);
  return S;
}
function streetCam(u = 0) { look(CX + lerp(-0.2, 0, u), 3.2, lerp(11.5, 12.0, u), CX, 2.5, -3.0, 52); }
function shot3(t) { // ある日、日本からホストクラブが消えた
  reset(); lift(60); JOS.forEach(j => j.visible = false);
  const gone = t > 1.0; HOSTSHOP.g.visible = !gone; poofC.set(gone ? clamp((t - 1.0) / 1.6) : 0);
  el.flash.style.opacity = t > 1.0 && t < 1.12 ? 0.35 : 0;
  streetCam(0);
  return S;
}
function shot4(t) { // 担当に会うために、夜の店で働いていたホス狂いの女子たち
  reset(); lift(60);
  JOS.forEach((j, i) => { j.position.set(CX + 0.9 + i * 0.7, 0, -1.2 + (i % 2) * 0.4); j.rotation.y = -0.4; j.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 2 + i) * 0.1; });
  tanto.position.set(CX + 1.9, 2.55, -1.0); pop(tanto, t, 0.6, 0.3, 1.8);
  heart.position.set(CX - 2.0, 3.4, -2.6); pop(heart, t, 1.2, 0.3, 0.8);
  streetCam(0.6);
  return S;
}
function shot5(t) { // 稼ぐ理由が、一晩でなくなる
  reset(); lift(60); HOSTSHOP.g.visible = false;
  JOS.forEach((j, i) => { j.position.set(CX + 0.9 + i * 0.7, 0, -1.2 + (i % 2) * 0.4); j.rotation.y = -0.6; j.userData.head.rotation.x = 0.3; });
  zero.position.set(CX + 1.9, 2.55, -1.0); pop(zero, t, 0.4, 0.3, 1.5);
  streetCam(0.6);
  return S;
}
function shot6(t) { // その日から、キャバクラで女の子が次々に辞めていく
  reset(); lift(60); HOSTSHOP.g.visible = false;
  JOS.forEach((j, i) => { const k = clamp((t - i * 0.8) / 2.2); j.position.set(CX + 2.0 - k * 4.5, 0, -2.4 + k * 1.6); j.rotation.y = -Math.PI / 2 - 0.3; j.visible = t > i * 0.8 - 0.1; walk(j, t + i, 8, 0.45); });
  yameru.position.set(CX + 2.0, 2.0, -2.2); pop(yameru, t, 0.3, 0.25, 1.0);
  CABA.on(lerp(1, 0.4, clamp(t / 4)));
  streetCam(1);
  return S;
}
function seatCam() { look(DX + 0.1, 2.1, 4.4, DX + 0.1, 1.35, -1.4, 52); }
function shot7(t) { // 青ざめたのは、キャバクラに通うおぢたち
  reset(); lift(80); poseSit(OJI); OJI.position.set(DX - 0.5, 0.05, -1.6); JO1.visible = false; OJI.userData.head.rotation.x = -0.2; sweatO.userData.set(clamp((t - 0.6) / 0.5), t);
  aozame.position.set(DX - 0.5, 2.4, -1.6); pop(aozame, t, 0.8, 0.3, 1.15);
  seatCam(); return S;
}
function shot8(t) { // 指名していた子が、もう店にいない
  reset(); lift(80); poseSit(OJI); OJI.position.set(DX - 0.5, 0.05, -1.6); JO1.visible = false; OJI.userData.head.rotation.y = -0.8 + Math.sin(t * 2) * 0.3; sweatO.userData.set(1, t);
  inai.position.set(DX + 0.3, 2.35, -1.5); pop(inai, t, 0.5, 0.3, 1.7);
  seatCam(); return S;
}
function ringCam(u = 0) { look(EX, lerp(6.4, 7.0, u), lerp(8.8, 9.4, u), EX, 0.9, -1.0, 52); }
function placeRing() {
  OJI_E.rotation.y = 0.6; JO_E.rotation.y = 0; HOST_E.rotation.y = -0.6;
  L_OJI.position.set(NP[0][0], 2.35, NP[0][2]); L_OJI.visible = true; L_JO.position.set(NP[1][0], 2.3, NP[1][2]); L_JO.visible = true; L_HOST.position.set(NP[2][0], 2.35, NP[2][2]); L_HOST.visible = true;
}
function coinsOn(t, from, to, n, speed = 0.35) { // 輪の上を from→to の向きにコインが流れる（a は反時計回り）
  for (let i = 0; i < n; i++) { const c = COINS[i]; let a0 = NODE[from], a1 = NODE[to]; if (a1 < a0) a1 += Math.PI * 2; const u = ((t * speed + i / n) % 1); const a = a0 + (a1 - a0) * u; c.visible = true; c.position.set(EX + Math.cos(a) * R, 0.5 + Math.sin(u * Math.PI) * 0.4, -1 - Math.sin(a) * R * 0.55); c.rotation.z = t * 4 + i; }
}
function shot9(t) { // 夜の街のお金は、ぐるぐる回っていた
  reset(); lift(150); placeRing();
  for (let i = 0; i < 18; i++) { const c = COINS[i]; const a = (t * 0.9 + i / 18 * Math.PI * 2); c.visible = true; c.position.set(EX + Math.cos(a) * R, 0.5, -1 - Math.sin(a) * R * 0.55); c.rotation.z = t * 4 + i; }
  ringCam(ease(clamp(t / 3.1))); return S;
}
function shot10(t) { // おぢが嬢に使ったお金は、
  reset(); lift(150); placeRing(); OJI_E.userData.arms[1].rotation.x = -1.3; coinsOn(t, 0, 1, 8, 0.6);
  ringCam(1); return S;
}
function shot11(t) { // 嬢を通って、ホストのシャンパンに
  reset(); lift(150); placeRing(); JO_E.userData.arms[1].rotation.x = -1.3; coinsOn(t, 1, 2, 8, 0.6);
  towerE.children.forEach((g, i) => g.scale.setScalar(1 + Math.sin(t * 6 + i) * 0.03));
  ringCam(1); return S;
}
function shot12(t) { // 結果：ホストが消えて止まったのは、
  reset(); lift(150); placeRing(); const gone = t > 0.4; HOST_E.visible = !gone; towerE.visible = !gone; L_HOST.visible = !gone;
  for (let i = 0; i < 18; i++) { const c = COINS[i]; const a = i / 18 * Math.PI * 2; c.visible = true; c.position.set(EX + Math.cos(a) * R, 0.5 - clamp((t - 0.4) / 1.0) * 0.4, -1 - Math.sin(a) * R * 0.55); c.material.color.set(gone ? '#8a8a90' : '#e8b84a'); }
  ringLine.material.color.set(gone ? '#5a5a62' : '#ffd27a'); stopX.position.set(NP[2][0], 1.3, NP[2][2]); pop(stopX, t, 0.4, 0.2, 1.0);
  el.flash.style.opacity = t > 0.4 && t < 0.52 ? 0.3 : 0;
  ringCam(1); setTop('結果', 'お金の輪が止まった', fade(t, 0.3, 6.9, 0.25), GOLD); return S;
}
function shot13(t) { // おぢの財布から始まるお金の輪だった
  reset(); lift(150); placeRing(); HOST_E.visible = false; towerE.visible = false; L_HOST.visible = false; ringLine.material.color.set('#5a5a62');
  COINS.forEach((c, i) => { const a = i / 18 * Math.PI * 2; c.visible = true; c.position.set(EX + Math.cos(a) * R, 0.1, -1 - Math.sin(a) * R * 0.55); c.material.color.set('#8a8a90'); });
  OJI_E.userData.arms[1].rotation.x = -1.0; OJI_E.userData.head.rotation.x = 0.3;
  const u = ease(clamp(t / 3.9)); look(lerp(EX, NP[0][0] + 0.6, u), lerp(5.2, 2.6, u), lerp(7.0, NP[0][2] + 3.4, u), lerp(EX, NP[0][0], u), lerp(1.0, 1.4, u), lerp(-1.0, NP[0][2], u), 52);
  setTop('結果', 'お金の輪が止まった', fade(t, 0, 3.8, 0.25), GOLD); return S;
}
function shot14(t) { // おぢが貢いでいた相手は、本当はホストだったのかもしれない
  reset(); lift(150); placeRing(); L_OJI.visible = false; L_JO.visible = false;
  OJI_E.userData.head.rotation.y = -0.8; OJI_E.rotation.y = 0.9;
  mitsugi.position.set(EX, 3.0, -1.0); pop(mitsugi, t, 0.4, 0.3, 2.0);
  const p = HOST_E; p.userData.arms[1].rotation.z = 0.4; p.userData.arms[1].rotation.x = -1.6 * clamp((t - 2.6) / 0.5);
  if (t > 2.4) { L_HOST.visible = true; L_HOST.userData.size(0.95 * (t < 2.7 ? 1.3 : 1)); }
  ringCam(0.5); return S;
}
function shot15(t) { // 実は2025年6月から、恋心につけ込む営業は法律で禁じられている
  reset(); lift(150); LAW.userData.fill(0, '2025年6月28日'); LAW.userData.fill(1, t > 2.2 ? '恋心につけ込む営業' : '');
  look(FX, 2.0, 3.8, FX, 2.0, -1, 50);
  setTop('改正風営法', '2025年6月 施行', fade(t, 0.4, 4.7, 0.25), GOLD); return S;
}
function shot16(t) { // 質問。最後は冒頭と同じ構図（グラスが消えたタワー）
  reset(); lift(200); vanishGlasses(0.62); HOSTS.forEach(h => { h.userData.head.rotation.x = 0.25; h.userData.arms.forEach(a => a.rotation.x = -0.5); });
  look(0.1, 2.3, 4.6, 0, 1.5, -1.0, 52); return S;
}

const SUBS = [
  [3.0, 5.2, '娘を持つ親たちの<br>不満から。'],
  [5.3, 9.6, '恋心につけ込んで、<br>何百万円も使わせる店がある。'],
  [9.7, 12.9, 'ある日、日本から<br>ホストクラブが消えた。'],
  [13.0, 18.0, '担当に会うために、夜の店で<br>働いていたホス狂いの女子たち。'],
  [18.1, 20.6, '稼ぐ理由が、<br>一晩でなくなる。'],
  [20.7, 25.0, 'その日から、キャバクラで<br>女の子が次々に辞めていく。'],
  [25.1, 28.6, '青ざめたのは、<br>キャバクラに通うおぢたち。'],
  [28.7, 31.6, '指名していた子が、<br>もう店にいない。'],
  [31.7, 34.8, '夜の街のお金は、<br>ぐるぐる回っていた。'],
  [34.9, 37.2, 'おぢが嬢に<br>使ったお金は、'],
  [37.3, 40.6, '嬢を通って、<br>ホストのシャンパンに。'],
  [40.7, 43.6, '結果：ホストが消えて<br>止まったのは、'],
  [43.7, 47.6, 'おぢの財布から始まる<br>お金の輪だった。'],
  [47.7, 50.0, 'おぢが貢いでいた<br>相手は、'],
  [50.1, 53.0, '本当はホストだったの<br>かもしれない。'],
  [53.1, 54.8, '実は2025年6月から、'],
  [54.9, 57.9, '恋心につけ込む営業は<br>法律で禁じられている。'],
  [58.0, 61.8, '夜の街で一番<br>得をしているのは誰？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.3, f: shot1 }, { a: 5.3, b: 9.7, f: shot2 }, { a: 9.7, b: 13.0, f: shot3 }, { a: 13.0, b: 18.1, f: shot4 },
  { a: 18.1, b: 20.7, f: shot5 }, { a: 20.7, b: 25.1, f: shot6 }, { a: 25.1, b: 28.7, f: shot7 }, { a: 28.7, b: 31.7, f: shot8 },
  { a: 31.7, b: 34.9, f: shot9 }, { a: 34.9, b: 37.3, f: shot10 }, { a: 37.3, b: 40.7, f: shot11 }, { a: 40.7, b: 43.7, f: shot12 },
  { a: 43.7, b: 47.7, f: shot13 }, { a: 47.7, b: 53.1, f: shot14 }, { a: 53.1, b: 58.0, f: shot15 }, { a: 58.0, b: 62.0, f: shot16 },
  { a: 62.0, b: 65.2, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.2, camera: cam,
  meta: {
    id: '0647',
    v2: true,
    hookLine: 'シャンパンタワーのグラスが、上から順に消えていく。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもホストクラブが消えたら？',
    titleHtml: 'もしも<br>ホストクラブが<br>消えたら？',
    mood: 'mystery', seed: 647, hits: [0.3, 40.7, 47.7], risers: [37.3], impacts: [10.7, 18.6, 25.6, 32.2, 41.1, 55.6],
    sfx: [[0.1, 'poof'], [6.5, 'meter', 0.4], [10.7, 'poof'], [16.0, 'bubble'], [21.5, 'whoosh'], [22.6, 'whoosh'], [26.0, 'alarm'], [35.2, 'whoosh'], [37.6, 'whoosh'], [41.1, 'poof'], [50.4, 'bubble']],
    narr: { '恋心': 'こいごころ', '何百万円': 'なんびゃくまんえん', 'ホス狂い': 'ホスぐるい', '担当': 'たんとう', '一晩': 'ひとばん', '嬢': 'じょう', '貢いで': 'みついで', '2025年6月': 'にせんにじゅうごねんろくがつ', '結果：': '結果、', '指名': 'しめい', '青ざめた': 'あおざめた' },
    ask: '夜の街で一番得をしているのは誰？',
    caption: 'もしもホストクラブが消えたら？\n\n娘を持つ親たちの不満から。恋心につけ込んで、何百万円も使わせる店がある。\nある日、日本からホストクラブが消えた。\n担当に会うために、夜の店で働いていたホス狂いの女子たち。稼ぐ理由が、一晩でなくなる。\nその日から、キャバクラで女の子が次々に辞めていく。\n青ざめたのは、キャバクラに通うおぢたち。指名していた子が、もう店にいない。\n夜の街のお金は、ぐるぐる回っていた。おぢが嬢に使ったお金は、嬢を通って、ホストのシャンパンに。\n\n結果：ホストが消えて止まったのは、おぢの財布から始まるお金の輪だった。\nおぢが貢いでいた相手は、本当はホストだったのかもしれない。\n実は2025年6月から、恋心につけ込む営業は法律で禁じられている。\n\n夜の街で一番得をしているのは誰？ コメントで教えて。\n\n※風刺ネタです。店名・人物はすべて架空です\n出典：改正風営法（2025年6月28日施行。客の恋愛感情につけ込んだ飲食等の要求の禁止などを遵守事項に追加。警察庁・神奈川県警察）',
    hashtags: ['もしもラボ', 'もしも', 'ホストクラブ', 'ホス狂い', 'キャバクラ'],
    endStats: [['改正風営法の施行', '2025年6月28日', '警察庁'], ['禁止になったこと', '恋心につけ込む営業', '遵守事項'], ['止まったのは', 'お金の輪', 'かもしれない']],
    sources: '出典：改正風営法（2025年6月28日施行）警察庁・神奈川県警察',
  },
});
