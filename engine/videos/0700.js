import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも1か月、お酒を1滴も飲まなかったら？（人体の限界・台本 S105・作り直し 0648）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。plan/remake.md の9：宣言の一文を使わず、0秒で缶が消えて手が固まる晩酌おじさんから入る
// 数字（一次資料で確認・2026/11/19。UCL Discovery の本文 PDF）：Mehta G ほか BMJ Open 2018;8:e020673
//  英国。1か月禁酒した94人と飲み続けた47人。禁酒した組でインスリン抵抗性（HOMA）−25.9%・上の血圧 −6.6%・体重 −1.5%。飲み続けた組は大きな変化なし
//  やめれば病気が治るとは言わない。缶は無地（実在のビールの見た目は使わない）。お酒をおいしそうに見せる絵は長く映さない
// 場面の多くは 0648 から流用（冷蔵庫・飲み会・研究・メーター）

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

// ---------- L：晩酌の居間（x=-60） ----------
const LX = -60;
const living = makeRoom({ w: 9, d: 7, wall: '#efe2cc', floor: '#b8966a' }); living.position.set(LX, 0, -1); living.userData.rw.visible = false; S.add(living);
const TBL = box(1.6, 0.06, 0.9, mat('#a87a4a')); TBL.position.set(LX, 0.74, -1.2); S.add(TBL);
for (const [dx, dz] of [[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]]) { const l = box(0.06, 0.74, 0.06, mat('#7a5a38')); l.position.set(LX + dx, 0.37, -1.2 + dz); S.add(l); }
const CHAIR = box(0.5, 0.08, 0.5, mat('#6a4a30')); CHAIR.position.set(LX - 0.2, 0.45, -0.35); S.add(CHAIR);
const CHB = box(0.5, 0.6, 0.06, mat('#6a4a30')); CHB.position.set(LX - 0.2, 0.8, -0.1); S.add(CHB);
const PLATES = [[-0.5, -1.3, '#f4f4f2'], [0.15, -1.45, '#f4f4f2'], [0.55, -1.15, '#e8e0d0']].map(([dx, dz, c]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.04, 16), mat(c)); p.position.set(LX + dx, 0.79, dz); S.add(p); const f = box(0.16, 0.05, 0.12, mat(['#c8603a', '#5ab04a', '#e8c070'][Math.round((dx + 0.5) * 2) % 3])); f.position.set(LX + dx, 0.83, dz); S.add(f); return p; });
const OJI_L = makeOji(rng(7), { shirt: '#8a8f99', bald: true }); S.add(OJI_L); const sweatL = makeSweat(); OJI_L.userData.head.add(sweatL);
const HCAN = makeCan(); HCAN.scale.setScalar(1.25); HCAN.position.set(0, -0.68, 0.12); OJI_L.userData.arms[1].add(HCAN);
const sparkL = makeSparkles(110, 0.06, 0xffe6a0); S.add(sparkL.points);
const shu = label('シュッ', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(shu);
const kusuri = label('毎晩の1本は 薬', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(kusuri);
const nagai = label('晩ごはん 長い…', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(nagai);
const clkC = document.createElement('canvas'); clkC.width = 256; clkC.height = 256; const clkT = new THREE.CanvasTexture(clkC); clkT.colorSpace = THREE.SRGBColorSpace; let clkKey = -1;
function drawClock(m) { const mm = Math.round(m); if (mm === clkKey) return; clkKey = mm; const g = clkC.getContext('2d'); g.fillStyle = '#fbfaf5'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#3a3e4a'; g.lineWidth = 10; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#3a3e4a'; g.fillRect(128 + Math.sin(a) * 100 - 4, 128 - Math.cos(a) * 100 - 4, 8, 8); } const ha = (19 + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2; g.lineCap = 'round'; g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ha) * 60, 128 - Math.cos(ha) * 60); g.stroke(); g.lineWidth = 7; g.strokeStyle = '#c8242c'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ma) * 92, 128 - Math.cos(ma) * 92); g.stroke(); clkT.needsUpdate = true; }
const CLOCK = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshBasicMaterial({ map: clkT })); CLOCK.position.set(LX - 1.6, 2.55, -4.43); S.add(CLOCK);
const maegari = label('あしたの体から 前借り', { w: 1100, size: 92, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); S.add(maegari);
const ugoki = label('体の中では…', { w: 768, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.05 }); S.add(ugoki);
const karuku = label('体が 軽くなった', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(karuku);

const ALL = [OJI, OJI_B, ...COW, OJI_E, OJI_H, OJI_L];
const NEWL = [shu, kusuri, nagai, maegari, ugoki, karuku];
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  OJI.position.set(1.4, 0, -1.4); OJI.rotation.y = -0.6; OJI_B.position.set(BX - 0.8, 0, -1.0); OJI_E.position.set(EX + 1.2, 0, -1.0); OJI_E.rotation.y = -0.4; OJI_H.position.set(HX, 0, -1.0);
  COW.forEach((p, i) => { p.position.set(EX - 1.0 + i * 0.8, 0, -1.6); p.rotation.y = 0.5; });
  CANS.forEach(c => c.visible = false); poofA.set(0); doorPivot.rotation.y = 0; frLight.intensity = 0;
  [kinshu, nai, saiken, ikou, warui, kawaranai, ...NEWL].forEach(l => l.visible = false); sweatO.userData.set(0); sweatB.userData.set(0); sweatL.userData.set(0);
  ml.forEach(l => l.visible = false); g20.forEach(l => l.visible = false); BIGC.forEach(c => c.visible = false);
  METERS.forEach((m, i) => { m.g.visible = true; setMeter(i, 0); }); sparkH.set(0); sparkL.set(0); phone.visible = false;
  lab94.visible = lab47.visible = true; C47.visible = true;
  hemi.intensity = 1.2; nightLamp.intensity = 0; kitchen.visible = true; el.flash.style.opacity = 0;
  OJI_L.position.set(LX - 0.2, 0, -0.45); OJI_L.rotation.y = 0; poseSit(OJI_L); OJI_L.position.y += 0.1; HCAN.visible = true; drawClock(0); CLOCK.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function canArm(k = 1) { OJI_L.userData.arms[1].rotation.set(-1.45 * k, 0, 0.15); OJI_L.userData.arms[0].rotation.set(-0.9, 0, -0.1); }
function liveCam(u = 0) { look(LX + lerp(0.9, 0.7, u), 1.95, lerp(4.3, 3.9, u), LX + 0.05, 1.55, -0.7, 50); }
sparkL.init([[LX + 0.12, 1.2, 0.15]], 0.18, 0.6);
function shot0(t) { // 0秒＝サムネ：晩酌のおじさんの手の中で、ビールの缶がシュッと消える
  reset(); lift(0); canArm(1); const gone = t > TP; HCAN.visible = !gone; nightLamp.intensity = 2; nightLamp.position.set(LX - 1.5, 2.6, 0.5);
  if (gone) { sparkL.set(clamp((t - TP) / 0.8)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(shu, t, TP, LX + 0.75, 1.55, -0.1, 0.42); OJI_L.userData.head.rotation.x = -0.1; }
  liveCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 缶を持つ形のまま、おじさんの手が空中で固まる
  reset(); lift(120); canArm(1); HCAN.visible = false; nightLamp.intensity = 2; nightLamp.position.set(LX - 1.5, 2.6, 0.5); if (t > d * 0.4) sweatL.userData.set(1, t); OJI_L.userData.head.rotation.x = 0.25;
  const u = ease(clamp(t / d)); look(LX + lerp(0.8, 0.6, u), 1.75, lerp(2.9, 2.5, u), LX + 0.0, 1.45, -0.5, 50);
  return S;
}
function sKusuri(t, d) { // 本人の言い分から。毎晩の1本は、薬みたいなもんだ
  reset(); lift(120); canArm(0.9); OJI_L.userData.head.rotation.x = -0.15; nightLamp.intensity = 2; nightLamp.position.set(LX - 1.5, 2.6, 0.5);
  if (t > d * 0.35) say(kusuri, t, d * 0.35, LX - 0.1, 2.3, -0.5, 1.0);
  liveCam(0.6);
  return S;
}
function sReizouko(t, d) { // 1日目の夜。手が勝手に、冷蔵庫を開ける
  reset(); lift(60); hemi.intensity = 0.5; nightLamp.intensity = 4; nightLamp.position.set(-2, 2.6, 0);
  const k = easeOut(clamp((t - 0.6) / 0.7)); doorPivot.rotation.y = -1.9 * k; frLight.intensity = 5 * k;
  OJI.position.set(1.0, 0, -1.2); OJI.rotation.y = -0.9; OJI.userData.arms[1].rotation.x = -1.4 * (t < d * 0.6 ? 1 : 0.6);
  if (t > d * 0.65) { OJI.userData.head.rotation.x = 0.25; say(nai, t, d * 0.65, 0.9, 2.45, -1.2, 0.8); }
  setHud('お酒を1滴も飲まない', '1日目', 1);
  look(0.6, 2.0, 3.2, 0.3, 1.45, -2.0, 52);
  return S;
}
function sNagai(t, d) { // 3日目。晩ごはんの時間が、やけに長い
  reset(); lift(220); HCAN.visible = false; OJI_L.userData.arms[1].rotation.set(-1.0, 0, 0.1); OJI_L.userData.arms[0].rotation.set(-1.0, 0, -0.1); OJI_L.userData.head.rotation.x = 0.3;
  CLOCK.visible = true; drawClock(Math.min(55, t * 18));
  if (t > d * 0.45) say(nagai, t, d * 0.45, LX + 0.15, 1.95, -0.3, 0.8);
  setHud('お酒を1滴も飲まない', '3日目', 1);
  look(LX + 0.7, 2.0, 3.4, LX - 0.45, 1.6, -1.4, 50);
  return S;
}
function sNomikai(t, d) { // 1週間後。飲み会を断ると、上司に 付き合い悪いな と言われる
  reset(); lift(80); kitchen.visible = false;
  COW.forEach((p, i) => { p.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 4 + i) * 0.1; });
  say(ikou, t, 0.2, EX - 0.6, 2.5, -1.6, 1.2);
  if (t > d * 0.35) { OJI_E.userData.head.rotation.y = Math.sin(t * 9) * 0.35; OJI_E.userData.arms[1].rotation.set(-1.4, 0, -0.3); }
  if (t > d * 0.6) { ikou.visible = false; say(warui, t, d * 0.6, EX - 0.6, 2.5, -1.6, 1.6); }
  setHud('お酒を1滴も飲まない', '1週間後', 1);
  look(EX, 2.1, 4.4, EX + 0.1, 1.4, -1.2, 52);
  return S;
}
function sUgoki(t, d) { // でも、体の中では、もう数字が動き始めていた
  reset(); lift(150); METERS.forEach((m, i) => setMeter(i, 0.08 * Math.max(0, Math.sin(t * 3 + i)))); METERS.forEach(m => m.val.visible = false);
  say(ugoki, t, 0.3, GX, 3.75, -1, 1.1);
  meterCam();
  return S;
}
function studyCam(u = 0) { look(FX - 1.0, lerp(5.6, 6.0, u), lerp(6.5, 7.0, u), FX - 1.0, 0.6, -2.6, 52); }
function sStudy(t, d) { // 1か月やめたイギリスの研究では、94人の体が変わった
  reset(); lift(150); C47.visible = false; lab47.visible = false;
  studyCam(ease(clamp(t / d))); if (t > d * 0.5) setTop('1か月お酒をやめた人（英国・2018年）', '94人', fade(t, d * 0.5, d, 0.25), BLUE);
  return S;
}
function meterCam() { look(GX, 2.0, 7.2, GX, 2.0, -1, 50); }
function sInsulin(t, d) { // 血糖を下げる力の悪さが、25.9%下がった
  reset(); lift(150); METERS[1].g.visible = METERS[2].g.visible = false; setMeter(0, easeOut(clamp((t - d * 0.4) / 1.2)));
  meterCam(); setTop('インスリン抵抗性（2018年）', '−25.9%', fade(t, d * 0.45, d, 0.25), GREEN); setHud('Mehta ほか', 'BMJ Open 2018年', 1);
  return S;
}
function sKetsuatsu(t, d) { // 上の血圧は6.6%、体重も1.5%減った
  reset(); lift(150); setMeter(0, 1); setMeter(1, easeOut(clamp((t - 0.3) / 1.0))); setMeter(2, easeOut(clamp((t - d * 0.5) / 1.0)));
  meterCam(); setHud('Mehta ほか', 'BMJ Open 2018年', 1);
  return S;
}
function sKawaranai(t, d) { // 飲み続けた人たちは、ほとんど変わらなかった
  reset(); lift(150); say(kawaranai, t, 0.5, FX + 2.6, 2.2, -1.0, 1.8);
  look(FX + 0.55, 8.0, 11.0, FX + 0.55, 0.4, -2.6, 52);
  return S;
}
function sKekka(t, d) { // 結果：1か月やめて、体は数字で分かるほど軽くなった。減ったのは、飲み会の誘いだけだった
  reset(); lift(80); const late = t > d * 0.6;
  if (!late) { sparkH.set(clamp((t - 0.4) / 3.5)); const k = clamp((t - 0.8) / 0.6); OJI_H.userData.arms[0].rotation.z = -2.5 * k; OJI_H.userData.arms[1].rotation.z = 2.5 * k; OJI_H.position.y = Math.abs(Math.sin(t * 5)) * 0.08 * k; if (t > 1.0) say(karuku, t, 1.0, HX, 2.55, -1.0, 1.15); look(HX, 2.0, lerp(4.2, 5.0, ease(clamp(t / d))), HX, 1.35, -1.0, 52); }
  else { phone.visible = true; OJI_H.rotation.y = 0.4; OJI_H.userData.head.rotation.y = 0.6; OJI_H.userData.arms[1].rotation.x = -1.1; look(HX + 0.5, 2.0, 4.0, HX + 0.5, 1.45, -0.9, 52); }
  setTop('結果', late ? '減ったのは 誘いだけ' : '体は 軽くなった', fade(t, 0.3, d, 0.25), GREEN);
  return S;
}
function sMaegari(t, d) { // 毎晩の1本は、薬じゃなく、あしたの体から前借りしていた1本だったのかもしれない
  reset(); lift(120); canArm(1); OJI_L.userData.head.rotation.x = -0.1; nightLamp.intensity = 2; nightLamp.position.set(LX - 1.5, 2.6, 0.5);
  if (t > d * 0.45) say(maegari, t, d * 0.45, LX + 0.0, 2.3, -0.5, 1.4);
  liveCam(0.8);
  return S;
}
function sAsk(t) { reset(); lift(0); canArm(1); HCAN.visible = false; OJI_L.userData.head.rotation.x = -0.1; nightLamp.intensity = 2; nightLamp.position.set(LX - 1.5, 2.6, 0.5); liveCam(0); return S; }

const NARR = { '缶': 'かん', '持つ': 'もつ', '形': 'かたち', '手': 'て', '空中': 'くうちゅう', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '毎晩': 'まいばん', '1本': 'いっぽん', '薬': 'くすり', '1日目': 'いちにちめ', '夜': 'よる', '勝手に': 'かってに', '冷蔵庫': 'れいぞうこ', '開ける': 'あける', '3日目': 'みっかめ', '晩ごはん': 'ばんごはん', '時間': 'じかん', '長い': 'ながい', '1週間後': 'いっしゅうかんご', '飲み会': 'のみかい', '断る': 'ことわる', '上司': 'じょうし', '付き合い': 'つきあい', '悪い': 'わるい', '体': 'からだ', '中': 'なか', '数字': 'すうじ', '動き始めていた': 'うごきはじめていた', '1か月': 'いっかげつ', '研究': 'けんきゅう', '94人': 'きゅうじゅうよにん', '変わった': 'かわった', '血糖': 'けっとう', '下げる': 'さげる', '力': 'ちから', '下がった': 'さがった', '25.9%': 'にじゅうごてんきゅうパーセント', '上の血圧': 'うえのけつあつ', '6.6%': 'ろくてんろくパーセント', '体重': 'たいじゅう', '1.5%': 'いってんごパーセント', '減った': 'へった', '飲み続けた': 'のみつづけた', '変わらなかった': 'かわらなかった', '結果：': '結果、', '分かる': 'わかる', '軽く': 'かるく', '誘い': 'さそい', '前借り': 'まえがり', '何日': 'なんにち' };
const P = planTimes([
  ['缶を持つ形のまま、おじさんの<br>手が空中で固まる。', sKatamaru],
  ['本人の言い分から。毎晩の<br>1本は、薬みたいなもんだ。', sKusuri],
  ['1日目の夜。手が勝手に、<br>冷蔵庫を開ける。', sReizouko],
  ['3日目。晩ごはんの時間が、<br>やけに長い。', sNagai],
  ['1週間後。飲み会を断ると、', (t, d) => sNomikai(t, 2 * d)],
  ['上司に 付き合い悪いな<br>と言われる。', (t, d) => sNomikai(t + d, 2 * d)],
  ['でも、体の中では、<br>もう数字が動き始めていた。', sUgoki],
  ['1か月やめたイギリスの<br>研究では、', (t, d) => sStudy(t, 2 * d)],
  ['94人の体が変わった。', (t, d) => sStudy(t + d, 2 * d)],
  ['血糖を下げる力の悪さが、<br>25.9%下がった。', sInsulin],
  ['上の血圧は6.6%、<br>体重も1.5%減った。', sKetsuatsu],
  ['飲み続けた人たちは、<br>ほとんど変わらなかった。', sKawaranai],
  ['結果：1か月やめて、体は<br>数字で分かるほど軽くなった。', (t, d) => sKekka(t, 2 * d)],
  ['減ったのは、飲み会の<br>誘いだけだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['毎晩の1本は、薬じゃなく、<br>あしたの体から前借りしていた', (t, d) => sMaegari(t, 2 * d)],
  ['1本だったのかもしれない。', (t, d) => sMaegari(t + d, 2 * d)],
  ['お酒、何日やめられる？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0700',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0648',
    hookLine: '晩酌のおじさんの手の中で、ビールの缶がシュッと消える。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月、お酒を1滴も飲まなかったら？',
    titleHtml: 'もしも1か月、<br>お酒を1滴も<br>飲まなかったら？',
    mood: 'hopeful', seed: 700, hits: [TP, P.at(12), P.at(14)], risers: [P.at(6)], impacts: [P.at(8, 0.5), P.at(9, 1.0), P.at(10, 0.4), P.at(10, 1.6)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(2, 1.0), 'whoosh'], [P.at(3, 0.8), 'meter', 0.3], [P.at(5, 0.3), 'alarm'], [P.at(14, 0.5), 'whoosh']],
    narr: NARR,
    ask: 'お酒、何日やめられる？',
    caption: 'もしも1か月、お酒を1滴も飲まなかったら？\n\n缶を持つ形のまま、おじさんの手が空中で固まる。\n本人の言い分から。毎晩の1本は、薬みたいなもんだ。\n1日目の夜。手が勝手に、冷蔵庫を開ける。\n3日目。晩ごはんの時間が、やけに長い。\n1週間後。飲み会を断ると、上司に 付き合い悪いな と言われる。\nでも、体の中では、もう数字が動き始めていた。\n1か月やめたイギリスの研究では、94人の体が変わった。\n血糖を下げる力の悪さが、25.9%下がった。\n上の血圧は6.6%、体重も1.5%減った。\n飲み続けた人たちは、ほとんど変わらなかった。\n\n結果：1か月やめて、体は数字で分かるほど軽くなった。減ったのは、飲み会の誘いだけだった。\n毎晩の1本は、薬じゃなく、あしたの体から前借りしていた1本だったのかもしれない。\n\nお酒、何日やめられる？ コメントで教えて。\n\n出典：Mehta ほか BMJ Open 2018（英国。1か月禁酒した94人と飲み続けた47人。インスリン抵抗性 −25.9%・上の血圧 −6.6%・体重 −1.5%）',
    hashtags: ['もしもラボ', '禁酒', 'お酒', '晩酌', '人体の限界'],
    endStats: [['インスリン抵抗性', '−25.9%', '1か月禁酒・94人'], ['上の血圧', '−6.6%', '1か月禁酒・94人'], ['体重', '−1.5%', '1か月禁酒・94人']],
    sources: '出典：Mehta ほか BMJ Open 2018',
  },
});
