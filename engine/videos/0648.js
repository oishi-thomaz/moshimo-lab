import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしも1か月お酒をやめたら？（台本 S27・人体の限界）
// 2026/11/03 ゆうと承認。plan/reserve.txt の 0207（説明型）を作り直し。元ネタ：健康診断の前だけ禁酒 の話
// 数字（裏取り済み）：
//  厚生労働省「健康に配慮した飲酒に関するガイドライン」（2024年2月）：生活習慣病のリスクを高める飲酒量
//   1日あたりの純アルコール摂取量 男性40g以上・女性20g以上。ビール500ml（5%）で純アルコール約20g
//  Mehta G, et al. BMJ Open 2018;8:e020673（英国。1か月禁酒した94人と飲み続けた47人）：
//   禁酒群でインスリン抵抗性（HOMA）−25.9%・収縮期血圧 −6.6%・体重 −1.5%。飲み続けた群は大きな変化なし
// 缶は無地（実在のビールの見た目は使わない）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', BLUE = '#7fd4ff';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
const canGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 14), canM = mat('#d8dde4'), canBand = mat('#e8b84a');
function makeCan() { const g = new THREE.Group(); const b = new THREE.Mesh(canGeo, canM); g.add(b); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.1, 14), canBand); g.add(band); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.03, 14), mat('#b8bec8')); top.position.y = 0.16; g.add(top); return g; }

// ---------- A：台所の冷蔵庫（原点） ----------
const kitchen = makeRoom({ w: 10, d: 7, wall: '#f2ece0', floor: '#c8b898' }); kitchen.userData.rw.visible = false; S.add(kitchen);
const FR = new THREE.Group(); S.add(FR); FR.position.set(0, 0, -2.6);
const frBody = box(1.5, 2.2, 0.9, mat('#eef0f2')); frBody.position.y = 1.1; FR.add(frBody);
const frIn = box(1.36, 1.5, 0.05, mat('#f8fbff')); frIn.position.set(0, 1.42, 0.43); FR.add(frIn);
const frLight = new THREE.PointLight(0xdfefff, 5, 3, 1.4); frLight.position.set(0, 1.9, 0.9); FR.add(frLight);
for (let i = 0; i < 4; i++) { const sh = box(1.36, 0.03, 0.5, mat('#dfe6ee', { transparent: true, opacity: 0.9 })); sh.position.set(0, 0.72 + i * 0.4, 0.66); FR.add(sh); }
const sideL = box(0.07, 1.6, 0.5, mat('#dfe3e8')); sideL.position.set(-0.71, 1.42, 0.66); FR.add(sideL); const sideR = sideL.clone(); sideR.position.x = 0.71; FR.add(sideR);
const veg = box(1.3, 0.3, 0.45, mat('#cfe3d0', { transparent: true, opacity: 0.85 })); veg.position.set(0, 0.48, 0.66); FR.add(veg);
const doorPivot = new THREE.Group(); doorPivot.position.set(0.75, 0, 0.9); FR.add(doorPivot);
const door = box(1.5, 1.7, 0.08, mat('#e6e9ec')); door.position.set(-0.75, 1.42, 0.04); doorPivot.add(door);
const handle = box(0.05, 0.5, 0.06, mat('#9aa0aa')); handle.position.set(-1.38, 1.42, 0.1); doorPivot.add(handle);
const CANS = []; for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) { const c = makeCan(); c.position.set(-0.55 + i * 0.22, 0.89 + row * 0.4, 0.62 + (i % 2) * 0.05); FR.add(c); c.userData.k = i + row * 0.25; CANS.push(c); }
CANS.sort((a, b) => a.userData.k - b.userData.k);
const poofA = makeSparkles(160, 0.14, 0xffe6a0); S.add(poofA.points); poofA.init(CANS.map(c => [c.position.x, c.position.y - 2.6 + 2.6 + 0.0, -2.6 + c.position.z]), 0.12, 0.9);
const OJI = makeOji(rng(7), { shirt: '#8a8f99', bald: true }); S.add(OJI);
const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const kinshu = label('1か月 禁酒', { w: 768, size: 120, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.4 }); S.add(kinshu);
const nai = label('…ない', { w: 512, size: 120, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 0.85 }); S.add(nai);
const nightLamp = new THREE.PointLight(0xffc98a, 0, 8, 1.5); nightLamp.position.set(-2, 2.6, 0); S.add(nightLamp);

// ---------- B：健康診断（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -1); bfloor.renderOrder = -0.8; S.add(bfloor);
const CHECK = makeDoc({ title: '健康診断', rows: ['肝臓', '血糖', '血圧'], head: '#3480e6', w: 1.5, h: 1.6 }); CHECK.position.set(BX + 0.55, 1.7, -0.7); S.add(CHECK);
const OJI_B = makeOji(rng(7), { shirt: '#8a8f99', bald: true }); OJI_B.position.set(BX - 0.8, 0, -1.0); S.add(OJI_B); const sweatB = makeSweat(); OJI_B.userData.head.add(sweatB);
const saiken = label('また再検査…', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.4 }); S.add(saiken);

// ---------- C：カレンダー（x=120） ----------
const CX = 120;
const calC = document.createElement('canvas'); calC.width = 1024; calC.height = 900;
const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace; let calKey = -1;
function drawCal(n) {
  if (n === calKey) return; calKey = n; const g = calC.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 1024, 900); g.fillStyle = '#3480e6'; g.fillRect(0, 0, 1024, 150);
  g.fillStyle = '#fff'; g.font = '900 92px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1滴も飲まない', 512, 78);
  for (let i = 0; i < 30; i++) {
    const cx = 74 + (i % 7) * 146, cy = 230 + Math.floor(i / 7) * 146;
    g.strokeStyle = '#c8ccd4'; g.lineWidth = 4; g.strokeRect(cx - 66, cy - 62, 132, 128);
    g.fillStyle = '#6a7080'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText(String(i + 1), cx - 30, cy - 34);
    if (i < n) { g.strokeStyle = '#c8242c'; g.lineWidth = 12; g.beginPath(); g.arc(cx + 10, cy + 14, 36, 0, 7); g.stroke(); }
  }
  calT.needsUpdate = true;
}
const cal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0), new THREE.MeshBasicMaterial({ map: calT })); cal.position.set(CX, 2.2, -1); S.add(cal);
const calFrame = box(3.56, 3.16, 0.06, mat('#3a3e4a')); calFrame.position.set(CX, 2.2, -1.04); S.add(calFrame);

// ---------- D：飲酒ガイド（x=180） ----------
const DX = 180;
const dfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, -1); dfloor.renderOrder = -0.8; S.add(dfloor);
const GUIDE = makeDoc({ title: '飲酒ガイドライン', rows: ['男性', '1日'], head: '#3a3f6e', w: 1.9, h: 1.3 }); GUIDE.position.set(DX, 3.0, -1.2); S.add(GUIDE);
const BIGC = [0, 1].map(i => { const c = makeCan(); c.scale.setScalar(3.5); c.position.set(DX - 0.65 + i * 1.3, 1.25, -0.6); S.add(c); return c; });
const ml = [0, 1].map(i => { const l = label('500ml', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.7 }); l.position.set(DX - 0.65 + i * 1.3, 1.3, 0.0); S.add(l); return l; });
const g20 = [0, 1].map(i => { const l = label('約20g', { w: 384, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.7 }); l.position.set(DX - 0.65 + i * 1.3, 1.98, 0.0); S.add(l); return l; });

// ---------- E：飲み会の誘い（x=240） ----------
const EX = 240;
const efloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#8a6a4a', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -1); efloor.renderOrder = -0.8; S.add(efloor);
const ewall = box(14, 3.6, 0.2, mat('#d8c0a0')); ewall.position.set(EX, 1.8, -3.2); S.add(ewall);
const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), new THREE.MeshBasicMaterial({ color: '#e84a3a' })); lantern.position.set(EX - 2.2, 2.6, -2.9); S.add(lantern);
const COW = [0, 1].map(i => { const p = makeSuit({ jacket: ['#2e3442', '#3a4050'][i], tie: ['#b23a3a', '#3a6ab2'][i] }); p.position.set(EX - 1.0 + i * 0.8, 0, -1.6); S.add(p); return p; });
const MUGS = COW.map(p => { const m = new THREE.Group(); const b = box(0.16, 0.22, 0.16, new THREE.MeshLambertMaterial({ color: '#f2c14e', transparent: true, opacity: 0.9 })); m.add(b); const f = box(0.17, 0.05, 0.17, mat('#ffffff')); f.position.y = 0.13; m.add(f); m.position.set(0, -0.66, 0.1); p.userData.arms[1].add(m); return m; });
const OJI_E = makeOji(rng(7), { shirt: '#8a8f99', bald: true }); OJI_E.position.set(EX + 1.2, 0, -1.0); S.add(OJI_E);
const ikou = label('一杯行こう', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(ikou);
const warui = label('付き合い悪いな', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 1.75 }); S.add(warui);

// ---------- F：イギリスの研究（x=300） ----------
const FX = 300;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.02, -2); ffloor.renderOrder = -0.8; S.add(ffloor);
function crowd(n, color, x0, z0, cols) { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), mat(color), n); const M = new THREE.Matrix4(); for (let i = 0; i < n; i++) { M.makeTranslation(x0 + (i % cols) * 0.36, 0.3, z0 + Math.floor(i / cols) * 0.36); m.setMatrixAt(i, M); } S.add(m); return m; }
const C94 = crowd(94, '#7fd4ff', FX - 3.3, -4.2, 14);
const C47 = crowd(47, '#c8a070', FX + 2.2, -4.2, 7);
const lab94 = label('1か月やめた 94人', { w: 1024, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 2.0 }); lab94.position.set(FX - 0.95, 1.4, -1.0); S.add(lab94);
const lab47 = label('飲み続けた 47人', { w: 1024, size: 100, color: '#fff', bg: 'rgba(150,100,60,.96)', sx: 1.8 }); lab47.position.set(FX + 3.3, 1.4, -1.0); S.add(lab47);
const kawaranai = label('ほとんど変化なし', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.9 }); S.add(kawaranai);

// ---------- G：3つの数字のメーター（x=360） ----------
const GX = 360;
const gfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); gfloor.rotation.x = -Math.PI / 2; gfloor.position.set(GX, 0.02, -1); gfloor.renderOrder = -0.8; S.add(gfloor);
const METERS = [['インスリン抵抗性', 25.9, '#ff7a6a'], ['上の血圧', 6.6, '#ffb060'], ['体重', 1.5, '#9be86a']].map(([name, pct, col], i) => {
  const g = new THREE.Group(); g.position.set(GX, 2.95 - i * 0.95, -1); S.add(g);
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), new THREE.MeshBasicMaterial({ color: '#1a1a22' })); g.add(bg);
  const fm = new THREE.MeshBasicMaterial({ color: col }); const fill = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.32), fm); fill.geometry.translate(1.55, 0, 0); fill.position.set(-1.55, 0, 0.01); g.add(fill);
  const nm = label(name, { w: 768, size: 96, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.35 }); nm.position.set(-0.85, 0.42, 0.02); g.add(nm);
  const val = label('', { w: 512, size: 110, color: col, stroke: 14, strokeColor: '#1a1a22', sx: 1.0 }); val.material.depthTest = false; val.renderOrder = 9; val.position.set(1.0, 0.42, 0.03); g.add(val);
  return { g, fill, val, pct };
});
function setMeter(i, k) { const m = METERS[i]; m.fill.scale.x = 1 - (m.pct / 100) * k; m.val.userData.set(k > 0.01 ? `−${(m.pct * k).toFixed(1)}%` : ''); }

// ---------- H：結果（x=420） ----------
const HX = 420;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#4a5a6a', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, -1); hfloor.renderOrder = -0.8; S.add(hfloor);
const OJI_H = makeOji(rng(7), { shirt: '#8a8f99', bald: true }); OJI_H.position.set(HX, 0, -1.0); S.add(OJI_H);
const sparkH = makeSparkles(140, 0.18, 0xfff2c0); S.add(sparkH.points); sparkH.init([[HX, 1.4, -1.0]], 1.2, 1.4);
const phone = new THREE.Group(); { const b = box(0.9, 1.7, 0.08, mat('#15161c')); phone.add(b); } S.add(phone);
const pc = document.createElement('canvas'); pc.width = 360; pc.height = 680; const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
{ const g = pc.getContext('2d'); g.fillStyle = '#eef2f6'; g.fillRect(0, 0, 360, 680); g.fillStyle = '#3a3f6e'; g.fillRect(0, 0, 360, 90); g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('飲み会の誘い', 180, 46); g.fillStyle = '#3a3f4e'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.fillText('0件', 180, 360); pt.needsUpdate = true; }
const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.55), new THREE.MeshBasicMaterial({ map: pt })); pscr.position.z = 0.045; phone.add(pscr);
phone.position.set(HX + 1.15, 1.6, -0.6); phone.rotation.y = -0.3;

const ALL = [OJI, OJI_B, ...COW, OJI_E, OJI_H];
OJI.position.set(1.4, 0, -1.4);
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  OJI.position.set(1.4, 0, -1.4); OJI.rotation.y = -0.6; OJI_B.position.set(BX - 0.8, 0, -1.0); OJI_E.position.set(EX + 1.2, 0, -1.0); OJI_E.rotation.y = -0.4; OJI_H.position.set(HX, 0, -1.0);
  COW.forEach((p, i) => { p.position.set(EX - 1.0 + i * 0.8, 0, -1.6); p.rotation.y = 0.5; });
  CANS.forEach(c => c.visible = true); poofA.set(0); doorPivot.rotation.y = -1.9; frLight.intensity = 5;
  [kinshu, nai, saiken, ikou, warui, kawaranai].forEach(l => l.visible = false); sweatO.userData.set(0); sweatB.userData.set(0);
  ml.forEach(l => l.visible = false); g20.forEach(l => l.visible = false); BIGC.forEach(c => c.visible = false);
  METERS.forEach((m, i) => { m.g.visible = true; setMeter(i, 0); }); sparkH.set(0); phone.visible = false;
  CHECK.userData.fill(0, ''); CHECK.userData.fill(1, ''); CHECK.userData.fill(2, ''); GUIDE.userData.fill(0, ''); GUIDE.userData.fill(1, '');
  lab94.visible = lab47.visible = true; C47.visible = true;
  hemi.intensity = 1.2; nightLamp.intensity = 0; kitchen.visible = true; el.flash.style.opacity = 0;
}
const T0 = 0.08, T1 = 0.55;
function fridgeCam(d = 0) { look(lerp(0.35, 0.25, d), 2.05, lerp(2.2, 2.45, d), 0.05, 1.78, -2.3, 52); }
function shot0(t) { // 0秒＝サムネ：冷蔵庫の缶ビールの列が、端から一斉に消える
  reset(); lift(0);
  const k = clamp((t - T0) / (T1 - T0)); const n = Math.floor(k * CANS.length + 0.001); CANS.forEach((c, i) => c.visible = i >= n);
  poofA.set(t > T0 ? clamp((t - T0) / 1.6) : 0); el.flash.style.opacity = t > T1 && t < T1 + 0.12 ? 0.25 : 0;
  OJI.userData.head.rotation.x = t > T1 ? 0.2 : 0;
  fridgeCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // 健康診断の再検査に毎年おびえる人の決意。
  reset(); lift(80); CHECK.userData.fill(0, '再検査'); CHECK.userData.fill(1, t > 0.6 ? '要注意' : ''); CHECK.userData.fill(2, t > 1.2 ? '要注意' : '');
  OJI_B.rotation.y = 0.5; OJI_B.userData.head.rotation.y = 0.6; sweatB.userData.set(clamp((t - 0.8) / 0.4), t);
  saiken.position.set(BX - 0.8, 2.45, -1.0); pop(saiken, t, 1.4, 0.25, 1.25);
  look(BX, 2.0, 4.2, BX, 1.45, -0.9, 52);
  return S;
}
function shot2(t) { // 1か月だけ、お酒をやめてみる
  reset(); lift(80); OJI.rotation.y = -0.3; OJI.position.set(1.2, 0, -1.0); doorPivot.rotation.y = 0; frLight.intensity = 0; CANS.forEach(c => c.visible = false);
  OJI.userData.arms[0].rotation.set(-1.3, 0, 0.9); OJI.userData.arms[1].rotation.set(-1.3, 0, -0.9);
  kinshu.position.set(1.2, 2.5, -1.0); pop(kinshu, t, 0.5, 0.3, 1.3);
  look(0.7, 2.0, 3.6, 0.6, 1.4, -1.6, 52);
  return S;
}
function shot3(t) { // 1か月、1滴も飲まない生活が始まる
  reset(); lift(150); drawCal(Math.floor(clamp((t - 0.4) / 2.4) * 30));
  look(CX, 2.2, 6.4, CX, 2.2, -1, 50);
  return S;
}
function shot4(t) { // 国のガイドで、病気のリスクが上がる量は
  reset(); lift(330); GUIDE.userData.fill(0, t > 0.8 ? '純アルコール' : '');
  look(DX, 2.4, 6.2, DX, 2.1, -1, 50);
  return S;
}
function shot5(t) { // 男性で1日 純アルコール40g
  reset(); lift(330); GUIDE.userData.fill(0, '純アルコール'); GUIDE.userData.fill(1, '40g');
  look(DX, 2.4, 6.2, DX, 2.1, -1, 50);
  setTop('リスクが上がる量（男性・1日）', '純アルコール40g', fade(t, 0.3, 3.8, 0.25), GOLD);
  return S;
}
function shot6(t) { // ビールなら、500mlの缶で2本
  reset(); lift(330); GUIDE.userData.fill(0, '純アルコール'); GUIDE.userData.fill(1, '40g');
  BIGC.forEach((c, i) => { const k = easeOut(clamp((t - 0.3 - i * 0.5) / 0.4)); c.visible = k > 0; c.scale.setScalar(3.5 * Math.max(0.01, k)); ml[i].visible = k > 0.9; if (t > 1.6) pop(g20[i], t, 1.6 + i * 0.2, 0.25, 0.7); });
  look(DX, 2.4, 6.2, DX, 2.1, -1, 50);
  setTop('ビール500ml缶', '2本', fade(t, 0.8, 2.9, 0.25), GOLD);
  return S;
}
function shot7(t) { // 1日目の夜。手が勝手に冷蔵庫を開ける
  reset(); lift(60); hemi.intensity = 0.5; nightLamp.intensity = 4; CANS.forEach(c => c.visible = false);
  const k = easeOut(clamp((t - 0.6) / 0.7)); doorPivot.rotation.y = -1.9 * k; frLight.intensity = 5 * k;
  OJI.position.set(1.0, 0, -1.2); OJI.rotation.y = -0.9; OJI.userData.arms[1].rotation.x = -1.4 * (t < 1.4 ? 1 : 0.6);
  if (t > 1.7) { OJI.userData.head.rotation.x = 0.25; nai.position.set(0.9, 2.45, -1.2); pop(nai, t, 1.8, 0.25, 0.8); }
  look(0.6, 2.0, 3.2, 0.3, 1.45, -2.0, 52);
  return S;
}
function shot8(t) { // 1週間。飲み会を断るたびに、付き合いが悪いと言われる
  reset(); lift(80); kitchen.visible = false;
  COW.forEach((p, i) => { p.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 4 + i) * 0.1; });
  ikou.position.set(EX - 0.6, 2.5, -1.6); pop(ikou, t, 0.3, 0.25, 1.2);
  if (t > 1.4) { OJI_E.userData.head.rotation.y = Math.sin(t * 9) * 0.35; OJI_E.userData.arms[1].rotation.set(-1.4, 0, -0.3); }
  if (t > 2.4) { ikou.visible = false; warui.position.set(EX - 0.6, 2.5, -1.6); pop(warui, t, 2.4, 0.25, 1.6); }
  look(EX, 2.1, 4.4, EX + 0.1, 1.4, -1.2, 52);
  return S;
}
function studyCam(u = 0) { look(FX, lerp(5.2, 5.6, u), lerp(5.5, 6.0, u), FX, 0.6, -2.6, 52); }
function shot9(t) { // 1か月やめたイギリスの研究では、
  reset(); lift(150); C47.visible = false; lab47.visible = false; lab94.position.set(FX - 0.95, 1.4, -1.0);
  studyCam(ease(clamp(t / 2.8))); return S;
}
function shot10(t) { // 94人の体が数字で変わった
  reset(); lift(150); C47.visible = false; lab47.visible = false;
  studyCam(1); setTop('1か月お酒をやめた人', '94人', fade(t, 0.2, 2.8, 0.25), BLUE); return S;
}
function meterCam() { look(GX, 2.0, 7.2, GX, 2.0, -1, 50); }
function shot11(t) { // 血糖を下げる力の悪さ、
  reset(); lift(150); METERS[1].g.visible = METERS[2].g.visible = false; meterCam(); return S;
}
function shot12(t) { // インスリン抵抗性が25.9%下がった
  reset(); lift(150); METERS[1].g.visible = METERS[2].g.visible = false; setMeter(0, easeOut(clamp((t - 0.3) / 1.4)));
  meterCam(); setTop('インスリン抵抗性', '−25.9%', fade(t, 1.0, 3.2, 0.25), GREEN); return S;
}
function shot13(t) { // 上の血圧は6.6%下がり、体重も1.5%減った
  reset(); lift(150); setMeter(0, 1); setMeter(1, easeOut(clamp((t - 0.3) / 1.2))); setMeter(2, easeOut(clamp((t - 2.0) / 1.2)));
  meterCam(); return S;
}
function shot14(t) { // 飲み続けた人たちは、ほとんど変わらなかった
  reset(); lift(150); kawaranai.position.set(FX + 2.6, 2.2, -1.0); pop(kawaranai, t, 1.0, 0.3, 1.8);
  look(FX + 0.55, 8.0, 11.0, FX + 0.55, 0.4, -2.6, 52); return S;
}
function shot15(t) { // 結果：1か月で、体は数字で分かるほど軽くなる
  reset(); lift(80); sparkH.set(clamp((t - 0.4) / 3.5)); OJI_H.userData.arms[0].rotation.z = -2.5 * clamp((t - 0.8) / 0.6); OJI_H.userData.arms[1].rotation.z = 2.5 * clamp((t - 0.8) / 0.6);
  OJI_H.position.y = Math.abs(Math.sin(t * 5)) * 0.08 * clamp((t - 0.8) / 0.6);
  const u = ease(clamp(t / 4.7)); look(HX, 2.0, lerp(4.2, 5.0, u), HX, 1.35, -1.0, 52);
  setTop('結果', '1か月で体は軽くなる', fade(t, 0.3, 4.6, 0.25), GREEN); return S;
}
function shot16(t) { // 減ったのは、飲み会の誘いだけだった
  reset(); lift(80); phone.visible = true; OJI_H.rotation.y = 0.4; OJI_H.userData.head.rotation.y = 0.6; OJI_H.userData.arms[1].rotation.x = -1.1;
  look(HX + 0.5, 2.0, 4.0, HX + 0.5, 1.45, -0.9, 52); return S;
}
function shot17(t) { // 質問。最後は冒頭と同じ構図（缶が消えた冷蔵庫）
  reset(); lift(200); CANS.forEach(c => c.visible = false); OJI.userData.head.rotation.x = 0.2;
  fridgeCam(0); return S;
}

const SUBS = [
  [3.0, 6.0, '健康診断の再検査に<br>毎年おびえる人の決意。'],
  [6.1, 8.9, '1か月だけ、<br>お酒をやめてみる。'],
  [9.0, 12.0, '1か月、1滴も飲まない<br>生活が始まる。'],
  [12.1, 15.0, '国のガイドで、病気の<br>リスクが上がる量は'],
  [15.1, 19.0, '男性で1日<br>純アルコール40g。'],
  [19.1, 22.0, 'ビールなら、<br>500mlの缶で2本。'],
  [22.1, 25.6, '1日目の夜。手が勝手に<br>冷蔵庫を開ける。'],
  [25.7, 30.0, '1週間。飲み会を断るたびに、<br>付き合いが悪いと言われる。'],
  [30.1, 32.8, '1か月やめたイギリスの<br>研究では、'],
  [32.9, 35.8, '94人の体が<br>数字で変わった。'],
  [35.9, 38.6, '血糖を下げる力の悪さ、'],
  [38.7, 42.0, 'インスリン抵抗性が<br>25.9%下がった。'],
  [42.1, 46.4, '上の血圧は6.6%下がり、<br>体重も1.5%減った。'],
  [46.5, 49.6, '飲み続けた人たちは、<br>ほとんど変わらなかった。'],
  [49.7, 54.4, '結果：1か月で、体は<br>数字で分かるほど軽くなる。'],
  [54.5, 57.2, '減ったのは、飲み会の<br>誘いだけだった。'],
  [57.3, 61.6, '1か月お酒やめられる？<br>やめられない？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 6.1, f: shot1 }, { a: 6.1, b: 9.0, f: shot2 }, { a: 9.0, b: 12.1, f: shot3 }, { a: 12.1, b: 15.1, f: shot4 },
  { a: 15.1, b: 19.1, f: shot5 }, { a: 19.1, b: 22.1, f: shot6 }, { a: 22.1, b: 25.7, f: shot7 }, { a: 25.7, b: 30.1, f: shot8 },
  { a: 30.1, b: 32.9, f: shot9 }, { a: 32.9, b: 35.9, f: shot10 }, { a: 35.9, b: 38.7, f: shot11 }, { a: 38.7, b: 42.1, f: shot12 },
  { a: 42.1, b: 46.5, f: shot13 }, { a: 46.5, b: 49.7, f: shot14 }, { a: 49.7, b: 54.5, f: shot15 }, { a: 54.5, b: 57.3, f: shot16 },
  { a: 57.3, b: 61.8, f: shot17 }, { a: 61.8, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0648',
    v2: true,
    hookLine: '冷蔵庫の缶ビールの列が、端から一斉に消える。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月お酒をやめたら？',
    titleHtml: 'もしも1か月<br>お酒を<br>やめたら？',
    mood: 'hopeful', seed: 648, hits: [0.55, 49.7, 54.5], risers: [35.9], impacts: [15.6, 19.8, 20.3, 33.3, 39.6, 42.8, 44.6, 50.0],
    sfx: [[0.1, 'poof'], [4.3, 'alarm'], [7.0, 'whoosh'], [22.8, 'whoosh'], [24.0, 'bubble'], [26.1, 'bubble'], [28.2, 'whoosh'], [47.6, 'bubble']],
    narr: { '1か月': 'いっかげつ', '1滴': 'いってき', '1日': 'いちにち', '1日目': 'いちにちめ', '1週間': 'いっしゅうかん', '40g': 'よんじゅうグラム', '500ml': 'ごひゃくミリリットル', '2本': 'にほん', '94人': 'きゅうじゅうよにん', '25.9%': 'にじゅうごてんきゅうパーセント', '6.6%': 'ろくてんろくパーセント', '1.5%': 'いってんごパーセント', '結果：': '結果、', '純アルコール': 'じゅんアルコール', '再検査': 'さいけんさ', 'インスリン抵抗性': 'インスリンていこうせい' },
    ask: '1か月お酒やめられる？やめられない？',
    caption: 'もしも1か月お酒をやめたら？\n\n健康診断の再検査に毎年おびえる人の決意。1か月だけ、お酒をやめてみる。\n1か月、1滴も飲まない生活が始まる。\n国のガイドで、病気のリスクが上がる量は男性で1日 純アルコール40g。ビールなら、500mlの缶で2本。\n1日目の夜。手が勝手に冷蔵庫を開ける。\n1週間。飲み会を断るたびに、付き合いが悪いと言われる。\n1か月やめたイギリスの研究では、94人の体が数字で変わった。\n血糖を下げる力の悪さ、インスリン抵抗性が25.9%下がった。上の血圧は6.6%下がり、体重も1.5%減った。\n飲み続けた人たちは、ほとんど変わらなかった。\n\n結果：1か月で、体は数字で分かるほど軽くなる。\n減ったのは、飲み会の誘いだけだった。\n\n1か月お酒やめられる？やめられない？ コメントで教えて。\n\n出典：厚生労働省「健康に配慮した飲酒に関するガイドライン」（2024年。生活習慣病のリスクを高める量 男性1日 純アルコール40g・ビール500mlで約20g）、Mehta ほか BMJ Open 2018（英国。1か月禁酒した94人と飲み続けた47人）',
    hashtags: ['もしもラボ', '禁酒', 'お酒', '健康診断', '30日チャレンジ'],
    endStats: [['インスリン抵抗性', '−25.9%', '1か月禁酒・94人'], ['上の血圧', '−6.6%', '1か月禁酒・94人'], ['体重', '−1.5%', '1か月禁酒・94人']],
    sources: '出典：厚生労働省「健康に配慮した飲酒に関するガイドライン」、Mehta ほか BMJ Open 2018',
  },
});
