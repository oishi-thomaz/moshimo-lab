import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeHanko, makeMark, makeDoc } from '../scenes/hanko.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしも養育費が給料から勝手に引かれたら？（皮肉回・台本 S21・図星／男と女のもしも）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・はてなで定期的に燃える 養育費を払わない元夫 の話
// 数字（裏取り済み）：
//  母子世帯の母で養育費を現在も受けている 28.1%（取り決めをしている 46.7%）
//   こども家庭庁「令和3年度 全国ひとり親世帯等調査」（2021年11月1日現在）
//  法定養育費 子1人あたり月2万円・2026年4月1日施行（改正民法。取り決めがなくても請求できる）
//   政府広報オンライン「法定養育費」・法務省
// 給料からの自動天引きは もしもの設定（今の制度は、強制執行で給料を差し押さえる手続きが要る）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', PINK = '#ff7ab8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); p.scale.setScalar(p.userData.sc || p.scale.x); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
function kid(i) { const p = (i % 2 ? makeMan : makeWoman)({ shirt: ['#f2c14e', '#7fc8f0', '#f29bbb', '#9fdcae'][i % 4], hair: '#2a1e1a', scale: 0.56 }); p.userData.sc = 0.56; return p; }
function makeEnvelope(color = '#fbfaf5') { const g = new THREE.Group(); const b = box(0.5, 0.32, 0.03, mat(color)); g.add(b); const f = box(0.5, 0.05, 0.035, mat('#c8242c')); f.position.y = 0.06; g.add(f); return g; }
function makeHouse(col) {
  const g = new THREE.Group(); const b = box(1.6, 1.3, 1.4, mat(col)); b.position.y = 0.65; g.add(b);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.8, 4), mat('#8a4a3a')); roof.rotation.y = Math.PI / 4; roof.position.y = 1.7; g.add(roof);
  const winM = new THREE.MeshBasicMaterial({ color: '#ffd98a' }); const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), winM); win.position.set(0, 0.8, 0.71); g.add(win);
  g.userData = { body: b, winM, col }; return g;
}

// ---------- A：会社の机（原点）：元夫と給与明細 ----------
const desk = box(2.2, 0.06, 1.0, mat('#e8e4dc')); desk.position.set(0, 0.74, -0.75); S.add(desk);
const deskLeg = box(2.0, 0.74, 0.05, mat('#9aa0aa')); deskLeg.position.set(0, 0.37, -0.3); S.add(deskLeg);
const officeWall = box(14, 3.6, 0.2, mat('#e6e9ee')); officeWall.position.set(0, 1.8, -3.4); S.add(officeWall);
const officeFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#7d8798', { depthWrite: false })); officeFloor.rotation.x = -Math.PI / 2; officeFloor.position.set(0, 0.01, 0); officeFloor.renderOrder = -0.8; S.add(officeFloor);
for (let i = 0; i < 3; i++) { const w = box(1.6, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(-4 + i * 4, 2.0, -3.28); S.add(w); }
const EX = makeSuit({ jacket: '#3a4050', tie: '#5a6a8a' }); S.add(EX);
const SLIP = makeDoc({ title: '給与明細', rows: ['基本給', '控除', '養育費', '手取り'], head: '#3a5a8a', w: 1.25, h: 1.5 }); S.add(SLIP);
const HK = makeHanko(); HK.scale.setScalar(0.5); S.add(HK);
const MARK = makeMark('天引き', { sx: 0.95 }); S.add(MARK);
const sweat = makeSweat(); EX.userData.head.add(sweat);
const tebiki = label('養育費 天引き', { w: 1024, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 2.0 }); S.add(tebiki);
const newRule = label('給料から自動で', { w: 1024, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(newRule);
const harae = label('払えなかった', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 1.6 }); S.add(harae);
const komara = label('困らなかった', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); S.add(komara);
const xMark = label('×', { w: 256, h: 256, size: 230, color: '#ff3a3a', stroke: 18, strokeColor: '#fff', sx: 0.7 }); xMark.material.depthTest = false; xMark.renderOrder = 8; S.add(xMark);

// ---------- B：逃げる父（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(9, 40), mat('#3a3448', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -1); bfloor.renderOrder = -0.8; S.add(bfloor);
const MOMS = [0, 1, 2].map(i => { const m = makeWoman({ shirt: ['#c9a8d8', '#f2b8a0', '#a8d0b0'][i], hair: ['#3a2620', '#1d1a19', '#5a3a28'][i] }); S.add(m); return m; });
const KIDS = [0, 1, 2, 3].map(i => { const k = kid(i); S.add(k); return k; });
const DAD = makeMan({ shirt: '#59606e', hair: '#1d1a19' }); S.add(DAD);
const nigeru = label('父親だけ逃げられる', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 2.2 }); S.add(nigeru);

// ---------- C：母子家庭の家10軒（x=120） ----------
const CX = 120;
const cfloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), mat('#6f8a62', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -2); cfloor.renderOrder = -0.8; S.add(cfloor);
const croad = new THREE.Mesh(new THREE.PlaneGeometry(30, 1.6), mat('#5a5e66', { depthWrite: false })); croad.rotation.x = -Math.PI / 2; croad.position.set(CX, 0.03, -1.6); croad.renderOrder = -0.7; S.add(croad);
const HCOL = ['#f6d0a0', '#d0e8f6', '#f6c0c8', '#d8f0c0', '#efe0f6'];
const HOUSES = []; for (let i = 0; i < 10; i++) { const h = makeHouse(HCOL[i % 5]); const row = Math.floor(i / 5); h.position.set(CX - 4.8 + (i % 5) * 2.4, 0, row ? -4.2 : 0.6); if (!row) h.rotation.y = Math.PI; S.add(h); HOUSES.push(h); }
// 前の列は道を向いて奥（-z）向き、後ろの列は手前向き。窓が見える後ろの列を主に使う
HOUSES.forEach((h, i) => { h.rotation.y = 0; });
const GOT = new Set([1, 5, 8]); // 届いている3軒（10軒のうち約3軒）
const ENVS = HOUSES.map(h => { const e = makeEnvelope(); e.scale.setScalar(1.9); S.add(e); return e; });
const heartsC = makeSparkles(120, 0.22, 0xffd27a); S.add(heartsC.points); heartsC.init(HOUSES.map(h => [h.position.x, 2.2, h.position.z + 0.8]), 0.8, 1.4);
function setHouse(h, lit) { h.userData.winM.color.set(lit ? '#ffd98a' : '#3a3e48'); h.userData.body.material.color.set(lit ? h.userData.col : '#8a8a90'); }

// ---------- D：給料日のオフィス（x=180） ----------
const DX = 180;
const dfloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), mat('#7d8798', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, 0); dfloor.renderOrder = -0.8; S.add(dfloor);
const dwall = box(16, 3.6, 0.2, mat('#e6e9ee')); dwall.position.set(DX, 1.8, -3.2); S.add(dwall);
const ISL = makeDeskIsland(3); ISL.position.set(DX, 0, -0.6); S.add(ISL);
const WORKERS = ISL.userData.seats.map((s, i) => { const p = makeSuit({ old: i % 3 === 0, jacket: ['#2e3442', '#3a4050', '#4a4a52'][i % 3], tie: ['#b23a3a', '#3a6ab2', '#5a8a4a'][i % 3] }); p.position.set(DX + s.x, 0, -0.6 + s.z); p.rotation.y = s.ry; S.add(p); return p; });
const MINUS = WORKERS.map(() => { const l = label('手取り ↓', { w: 512, size: 96, color: '#fff', bg: 'rgba(200,36,44,.95)', sx: 0.95 }); S.add(l); return l; });
const payday = label('給料日', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(payday);

// ---------- E：再婚した家（x=240） ----------
const EXX = 240;
const home = makeRoom({ w: 9, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); home.position.set(EXX, 0, 0); home.userData.rw.visible = false; S.add(home);
const tbl = box(1.8, 0.06, 1.0, mat('#8a5a32')); tbl.position.set(EXX, 0.72, -1.2); S.add(tbl);
const tblLeg = box(1.6, 0.7, 0.8, mat('#6a4a2a')); tblLeg.position.set(EXX, 0.35, -1.2); S.add(tblLeg);
const WIFE2 = makeWoman({ shirt: '#e8a0b0', hair: '#5a3a28' }); S.add(WIFE2);
const EX2 = makeSuit({ jacket: '#3a4050', tie: '#5a6a8a' }); S.add(EX2);
const SLIP2 = makeDoc({ title: '給与明細', rows: ['基本給', '控除', '養育費', '手取り'], head: '#3a5a8a', w: 0.9, h: 1.08 }); S.add(SLIP2);
const dots = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.8 }); S.add(dots);
const sweat2 = makeSweat(); EX2.userData.head.add(sweat2);
const youiku = label('養育費？', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 1.3 }); S.add(youiku);

// ---------- F：婚活の席（x=300） ----------
const FX = 300;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#c8b8a0', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.02, 0); ffloor.renderOrder = -0.8; S.add(ffloor);
const fwall = box(14, 3.6, 0.2, mat('#f2e6d8')); fwall.position.set(FX, 1.8, -3.0); S.add(fwall);
const ftbl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 24), mat('#f4f4f2')); ftbl.position.set(FX, 0.74, -0.8); S.add(ftbl);
const ftblLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.72, 12), mat('#8a8f99')); ftblLeg.position.set(FX, 0.36, -0.8); S.add(ftblLeg);
const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat('#ffffff')); cup1.position.set(FX - 0.3, 0.83, -0.7); S.add(cup1);
const cup2 = cup1.clone(); cup2.position.set(FX + 0.3, 0.83, -0.7); S.add(cup2);
const BATSU = makeMan({ shirt: '#4f6a8f', hair: '#1d1a19' }); S.add(BATSU);
const DATE = makeWoman({ shirt: '#f2c0d0', hair: '#3a2620' }); S.add(DATE);
const kodomo = label('子どもがいます', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.8 }); S.add(kodomo);
const sakini = label('先に言う', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 1.2 }); S.add(sakini);
const nod = label('ちゃんと払ってる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.8 }); S.add(nod);
const SEAT = [0, 1].map(() => { const c = box(0.5, 0.08, 0.5, mat('#30343e')); S.add(c); return c; });

// ---------- G：母子家庭の台所（x=360） ----------
const GX = 360;
const kit = makeRoom({ w: 9, d: 7, wall: '#f2ece0', floor: '#c8a878' }); kit.position.set(GX, 0, 0); kit.userData.rw.visible = false; S.add(kit);
const gtbl = box(1.8, 0.06, 1.0, mat('#a8784a')); gtbl.position.set(GX, 0.72, -1.2); S.add(gtbl);
const gtblLeg = box(1.6, 0.7, 0.8, mat('#8a5a32')); gtblLeg.position.set(GX, 0.35, -1.2); S.add(gtblLeg);
const MOM = makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }); S.add(MOM);
const KID1 = kid(1); S.add(KID1); const KID2 = kid(2); S.add(KID2);
const ENVG = makeEnvelope(); ENVG.scale.setScalar(1.3); S.add(ENVG);
const maitsuki = label('毎月 届く', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 1.4 }); S.add(maitsuki);
const calendar = makeDoc({ title: 'カレンダー', rows: ['1月', '2月', '3月', '4月'], head: '#3a8a5a', w: 1.1, h: 1.4 }); calendar.position.set(GX + 1.5, 2.1, -3.38); S.add(calendar);
const coinsG = makeSparkles(100, 0.18, 0xffd27a); S.add(coinsG.points); coinsG.init([[GX, 1.4, -1.0]], 0.6, 1.0);

// ---------- H：法律（x=420） ----------
const HX = 420;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#3a3448', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, -1); hfloor.renderOrder = -0.8; S.add(hfloor);
const LAW = makeDoc({ title: '法定養育費', rows: ['いつから', '取り決め', '金額'], head: '#c8242c', w: 1.8, h: 1.9 }); LAW.position.set(HX, 1.9, -1.2); S.add(LAW);
const LHK = makeHanko(); LHK.scale.setScalar(0.5); S.add(LHK);
const LMARK = makeMark('施行', { sx: 0.8 }); S.add(LMARK);

// 最初の位置（静止画はどの秒からでも撮るので、作った直後から各場所に置いておく）
MOMS.forEach((m, i) => m.position.set(BX - 1.6 + i * 1.6, 0, -0.4)); KIDS.forEach((k, i) => k.position.set(BX - 2.2 + i * 1.5, 0, 0.3)); DAD.position.set(BX + 1, 0, -0.6);
WIFE2.position.set(EXX + 0.4, 0, -0.4); EX2.position.set(EXX - 1.4, 0, -0.9); SLIP2.position.set(EXX + 0.25, 1.55, 0.05);
BATSU.position.set(FX - 0.85, 0, -0.6); DATE.position.set(FX + 0.85, 0, -0.6); SEAT.forEach((c, i) => c.position.set(FX + (i ? 0.85 : -0.85), 0.47, -0.6));
MOM.position.set(GX - 0.3, 0, -0.5); KID1.position.set(GX + 0.7, 0, -0.3); KID2.position.set(GX - 1.2, 0, -0.2); ENVG.position.set(GX, 1.45, -0.3);
HK.position.set(0, -50, 0); LHK.position.set(HX, -50, 0);
const ALL = [EX, ...MOMS, ...KIDS, DAD, ...WORKERS, WIFE2, EX2, BATSU, DATE, MOM, KID1, KID2];
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  EX.position.set(-0.62, 0, -1.25); EX.rotation.y = 0.25; poseSit(EX);
  SLIP.position.set(0.3, 1.42, -0.25); SLIP.rotation.set(-0.08, -0.12, 0); SLIP.userData.fill(2, ''); SLIP.userData.fill(0, '支給'); SLIP.userData.fill(1, '税・保険'); SLIP.userData.fill(3, '');
  HK.visible = false; MARK.visible = false; sweat.userData.set(0); sweat2.userData.set(0);
  [tebiki, newRule, harae, komara, xMark, nigeru, payday, dots, youiku, kodomo, sakini, nod, maitsuki].forEach(l => l.visible = false);
  MINUS.forEach(l => l.visible = false);
  HOUSES.forEach(h => setHouse(h, true)); ENVS.forEach(e => e.visible = false); heartsC.set(0); coinsG.set(0);
  ENVG.visible = false; LHK.visible = false; LMARK.visible = false; SEAT.forEach(s => s.visible = true);
  LAW.userData.fill(0, ''); LAW.userData.fill(1, ''); LAW.userData.fill(2, '');
  hemi.intensity = 1.2; S.background.set('#2a2e3a'); el.flash.style.opacity = 0;
}
const TP = 0.45;
function slipCam(d = 0) { look(lerp(0.4, 0.3, d), 1.95, lerp(4.1, 4.5, d), 0.05, 1.72, -0.6, 52); }
// 立てた紙に、手前から押す（判子を横向きにして z 方向に動かす）
function slamZ(h, [x, y, z], t, t0, { from = 1.2, up = 1.0, dur = 0.18, dir = [0.55, 0.45, 1] } = {}) {
  let dz; if (t < t0 - dur) dz = from; else if (t < t0) dz = from * (1 - ease((t - (t0 - dur)) / dur)); else if (t < t0 + 0.12) dz = 0; else dz = up * easeOut(clamp((t - t0 - 0.12) / 0.4));
  h.rotation.set(Math.PI / 2, 0, 0); h.position.set(x + dir[0] * dz, y + dir[1] * dz, z + dir[2] * dz); return t >= t0;
}
function stampSlip(t, t0) {
  const hit = slamZ(HK, [0.52, 1.22, -0.2], t, t0, { from: 0.8, dir: [0.1, 0.75, 1] }); HK.visible = t > t0 - 0.6 && t < t0 + 1.0;
  if (hit) { SLIP.userData.fill(2, ''); MARK.position.set(0.52, 1.18, -0.1); MARK.visible = true; const k = t - t0; MARK.userData.size(0.5 * (k < 0.2 ? 1.3 - k * 1.5 : 1)); }
  return hit;
}
function shot0(t) { // 0秒＝サムネ：元夫の給与明細に、赤い 養育費 天引き がドン
  reset(); lift(0);
  const hit = stampSlip(t, TP);
  EX.userData.arms.forEach(a => a.rotation.x = -1.1);
  if (hit) { EX.userData.head.rotation.x = -0.15; sweat.userData.set(clamp((t - TP) / 0.4), t); tebiki.position.set(0.25, 2.45, -0.3); pop(tebiki, t, 1.9, 0.25, 1.3); }
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  slipCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // シングルマザーたちの不満から。
  reset(); lift(60);
  MOMS.forEach((m, i) => { m.position.set(BX - 1.6 + i * 1.6, 0, -0.4); m.rotation.y = 0.15 - i * 0.15; m.userData.arms[1].rotation.x = -0.6; });
  KIDS.forEach((k, i) => { k.position.set(BX - 2.2 + i * 1.5, 0, 0.3); k.rotation.y = 0; k.userData.head.rotation.x = -0.2; });
  MOMS.forEach((m, i) => { m.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.15; });
  DAD.visible = false;
  look(BX, 2.0, 6.2, BX, 1.2, -0.6, 50);
  return S;
}
function shot2(t) { // 離婚すると、父親だけが子育てから逃げられる
  reset(); lift(80);
  MOMS.forEach((m, i) => { m.visible = i === 1; }); const M = MOMS[1]; M.position.set(BX - 0.8, 0, -0.4); M.rotation.y = 0.5; M.userData.arms.forEach(a => a.rotation.x = -0.4);
  KIDS.forEach((k, i) => { k.visible = i < 2; k.position.set(BX - 1.5 + i * 0.7, 0, 0.3); k.rotation.y = 0.9; k.userData.arms[1].rotation.x = -1.6; });
  const u = clamp((t - 0.3) / 3.6); DAD.position.set(BX + 0.6 + u * 5.0, 0, -0.6); DAD.rotation.y = Math.PI / 2; walk(DAD, t, 10, 0.6);
  DAD.userData.head.rotation.y = 0.3;
  nigeru.position.set(BX + 0.3, 3.0, -0.6); pop(nigeru, t, 0.6, 0.3, 1.9);
  look(BX + 0.8, 2.2, 6.8, BX + 0.8, 1.2, -0.6, 50);
  return S;
}
function shot3(t) { // ある日、養育費は給料から自動で引かれることになった
  reset(); lift(300); EX.userData.arms.forEach(a => a.rotation.x = -1.1);
  stampSlip(t, 1.4);
  newRule.position.set(0.25, 2.45, -0.3); pop(newRule, t, 0.3, 0.3, 1.3);
  el.flash.style.opacity = t > 1.4 && t < 1.52 ? 0.3 : 0;
  slipCam(0.5);
  return S;
}
function housesCam(u = 0) { look(CX, lerp(5.5, 7.0, u), lerp(9.5, 10.5, u), CX, 0.8, -1.8, 52); }
function shot4(t) { // 母子家庭で、養育費を今も受け取れているのは28.1%だけ
  reset(); lift(150);
  HOUSES.forEach((h, i) => { const on = GOT.has(i); ENVS[i].visible = on && t > 1.0; ENVS[i].position.set(h.position.x, 0.32 + Math.sin(t * 2 + i) * 0.03, h.position.z + 1.0); ENVS[i].rotation.y = Math.sin(t + i) * 0.15; });
  heartsC.set(0);
  housesCam(ease(clamp(t / 5)));
  setTop('養育費を今も受け取れている母子世帯', '28.1%', fade(t, 0.3, 4.9, 0.25), GOLD);
  return S;
}
function shot5(t) { // 10軒のうち7軒には、届いていなかった
  reset(); lift(150);
  const n = Math.floor(clamp((t - 0.2) / 1.8) * 7 + 0.001); let k = 0;
  HOUSES.forEach((h, i) => { const on = GOT.has(i); ENVS[i].visible = on; ENVS[i].position.set(h.position.x, 0.32, h.position.z + 1.0); if (!on) { if (k < n) setHouse(h, false); k++; } });
  housesCam(1);
  setTop('届いていない', '10軒に7軒', fade(t, 2.0, 3.3, 0.2), RED);
  return S;
}
function shot6(t) { // 給料日。元夫たちの手取りが、一斉に減る
  reset(); lift(120);
  WORKERS.forEach((p, i) => { poseSit(p); p.userData.arms.forEach(a => a.rotation.x = -0.9); if (t > 1.4) p.userData.head.rotation.x = 0.25; });
  ISL.userData.monitors.forEach((m, i) => m.userData.glass.material.color.set(t > 1.4 ? '#e86a6a' : '#6aa8e8'));
  MINUS.forEach((l, i) => { const s = ISL.userData.seats[i]; l.position.set(DX + s.x, 2.15 + (i % 2) * 0.15, -0.6 + s.z * 0.6); pop(l, t, 1.4 + i * 0.06, 0.25, 0.95); });
  payday.position.set(DX, 3.2, -1.6); pop(payday, t, 0.1, 0.3, 1.3);
  el.flash.style.opacity = t > 1.4 && t < 1.5 ? 0.25 : 0;
  look(DX + 0.5, 4.2, 6.0, DX, 1.1, -0.8, 52);
  return S;
}
function shot7(t) { // 払えなかったんじゃない。払わなくても困らなかっただけ
  reset(); lift(300); EX.userData.arms.forEach(a => a.rotation.x = -1.1); SLIP.userData.fill(2, '');
  MARK.position.set(0.52, 1.18, -0.1); MARK.visible = true; MARK.userData.size(0.5);
  harae.position.set(0.25, 2.45, -0.3); harae.visible = t > 0.2; harae.userData.size(1.2);
  xMark.position.set(0.25, 2.45, -0.2); pop(xMark, t, 1.4, 0.2, 0.6);
  if (t > 2.3) { harae.visible = false; xMark.visible = false; komara.position.set(0.25, 2.45, -0.3); pop(komara, t, 2.3, 0.25, 1.2); EX.userData.head.rotation.x = 0.3; sweat.userData.set(1, t); }
  slipCam(1);
  return S;
}
function shot8(t) { // 再婚した家では、新しい妻が明細を見て固まる
  reset(); lift(160);
  WIFE2.position.set(EXX + 0.4, 0, -0.4); WIFE2.rotation.y = -0.3; WIFE2.userData.arms.forEach(a => a.rotation.x = -0.9);
  SLIP2.position.set(EXX + 0.3, 1.18, 0.15); SLIP2.rotation.set(-0.2, -0.3, 0); SLIP2.userData.fill(0, '支給'); SLIP2.userData.fill(1, '税・保険'); SLIP2.userData.fill(2, '天引き');
  EX2.position.set(EXX - 1.1, 0, -1.2); EX2.rotation.y = 0.6; EX2.userData.head.rotation.x = 0.25; sweat2.userData.set(t > 1.6 ? 1 : 0, t);
  if (t > 1.2) { WIFE2.userData.head.rotation.x = 0.15; }
  youiku.position.set(EXX + 0.5, 2.5, -0.4); pop(youiku, t, 0.9, 0.25, 1.2);
  dots.position.set(EXX - 1.1, 2.4, -1.2); pop(dots, t, 2.2, 0.25, 0.7);
  look(EXX - 0.2, 2.3, 5.6, EXX - 0.3, 1.45, -0.7, 50);
  return S;
}
function shot9(t) { // 婚活の場では、バツイチの男が先に子どもの話をするようになる
  reset(); lift(60);
  SEAT[0].position.set(FX - 0.85, 0.47, -0.6); SEAT[1].position.set(FX + 0.85, 0.47, -0.6);
  BATSU.position.set(FX - 0.85, 0, -0.6); BATSU.rotation.y = Math.PI / 2; poseSit(BATSU); BATSU.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 5) * 0.15;
  DATE.position.set(FX + 0.85, 0, -0.6); DATE.rotation.y = -Math.PI / 2; poseSit(DATE);
  kodomo.position.set(FX - 0.45, 2.3, -0.6); pop(kodomo, t, 0.4, 0.3, 1.55);
  sakini.position.set(FX - 0.45, 2.85, -0.6); pop(sakini, t, 1.0, 0.25, 0.95);
  if (t > 2.6) { DATE.userData.head.rotation.x = Math.abs(Math.sin(t * 5)) * 0.2; nod.position.set(FX + 0.55, 1.9, -0.3); pop(nod, t, 2.6, 0.25, 1.35); }
  look(FX, 2.3, 5.4, FX, 1.5, -0.6, 52);
  return S;
}
function shot10(t) { // 一方、母子家庭の家計に、毎月決まったお金がやっと入る
  reset(); lift(170);
  MOM.position.set(GX - 0.3, 0, -0.5); MOM.rotation.y = 0.2; KID1.position.set(GX + 0.7, 0, -0.3); KID1.rotation.y = -0.3; KID2.position.set(GX - 1.2, 0, -0.2); KID2.rotation.y = 0.4;
  const u = easeOut(clamp((t - 0.3) / 0.9)); ENVG.visible = true; ENVG.position.set(GX - 0.3 + (1 - u) * 2.2, 1.05 + (1 - u) * 1.5, -0.05); ENVG.rotation.z = (1 - u) * 1.2;
  MOM.userData.arms.forEach(a => a.rotation.x = lerp(0, -0.75, u));
  if (t > 1.3) { KID1.userData.arms[0].rotation.z = -2.4 + Math.sin(t * 8) * 0.3; KID2.userData.arms[1].rotation.z = 2.4 - Math.sin(t * 8) * 0.3; coinsG.set(clamp((t - 1.3) / 3)); }
  calendar.userData.fill(0, '✓'); calendar.userData.fill(1, t > 2.0 ? '✓' : ''); calendar.userData.fill(2, t > 2.6 ? '✓' : ''); calendar.userData.fill(3, t > 3.2 ? '✓' : '');
  maitsuki.position.set(GX - 0.1, 2.55, -0.4); pop(maitsuki, t, 1.4, 0.3, 1.3);
  look(GX + 0.1, 2.2, 5.6, GX + 0.1, 1.45, -1.0, 52);
  return S;
}
function shot11(t) { // 結果：天引きが始まって、父親をやめられる男はいなくなった
  reset(); lift(150);
  HOUSES.forEach((h, i) => { const k = clamp((t - 0.3 - i * 0.12) / 0.3); setHouse(h, k > 0); ENVS[i].visible = k > 0; ENVS[i].position.set(h.position.x, 0.32 + Math.sin(t * 2 + i) * 0.03, h.position.z + 1.0); });
  heartsC.set(t > 1.5 ? clamp((t - 1.5) / 4) : 0);
  const u = ease(clamp(t / 5.8)); look(CX, lerp(7.0, 9.5, u), lerp(10.5, 13.0, u), CX, 0.8, -1.8, 52);
  setTop('結果', '父親はやめられない', fade(t, 0.3, 5.8, 0.25), GOLD);
  return S;
}
function shot12(t) { // 実は今年4月から、取り決めがなくても子1人月2万円を請求できる
  reset(); lift(240);
  LAW.userData.fill(0, '2026年4月1日'); LAW.userData.fill(1, t > 2.4 ? 'なくてもOK' : ''); LAW.userData.fill(2, t > 3.6 ? '子1人 月2万円' : '');
  const hit = slamZ(LHK, [HX + 0.88, 2.73, -1.15], t, 1.0, { from: 1.0, up: 0.9, dur: 0.2 }); LHK.visible = t > 0.4 && t < 1.5;
  if (hit) { LMARK.position.set(HX + 0.98, 2.78, -0.9); LMARK.visible = true; LMARK.userData.size(0.6); }
  look(HX, 2.0, 3.6, HX, 1.75, -1.2, 50);
  setTop('法定養育費（2026年4月〜）', '子1人 月2万円', fade(t, 3.6, 5.6, 0.25), GOLD);
  return S;
}
function shot13(t) { // 質問。最後は冒頭と同じ構図（天引きのまま）
  reset(); lift(300); EX.userData.arms.forEach(a => a.rotation.x = -1.1); SLIP.userData.fill(2, '');
  MARK.position.set(0.52, 1.18, -0.1); MARK.visible = true; MARK.userData.size(0.5); EX.userData.head.rotation.x = -0.15; sweat.userData.set(1, t);
  tebiki.position.set(0.25, 2.45, -0.3); tebiki.visible = true; tebiki.userData.size(1.3);
  slipCam(0);
  return S;
}

const SUBS = [
  [2.9, 5.4, 'シングルマザーたちの<br>不満から。'],
  [5.5, 9.6, '離婚すると、父親だけが<br>子育てから逃げられる。'],
  [9.7, 13.6, 'ある日、養育費は給料から<br>自動で引かれることになった。'],
  [13.7, 18.6, '母子家庭で、養育費を今も<br>受け取れているのは28.1%だけ。'],
  [18.7, 22.0, '10軒のうち7軒には、<br>届いていなかった。'],
  [22.1, 25.8, '給料日。元夫たちの<br>手取りが、一斉に減る。'],
  [25.9, 30.4, '払えなかったんじゃない。<br>払わなくても困らなかっただけ。'],
  [30.5, 34.6, '再婚した家では、新しい妻が<br>明細を見て固まる。'],
  [34.7, 36.9, '婚活の場では、<br>バツイチの男が'],
  [37.0, 39.6, '先に子どもの話を<br>するようになる。'],
  [39.7, 44.4, '一方、母子家庭の家計に、<br>毎月決まったお金がやっと入る。'],
  [44.5, 47.0, '結果：天引きが始まって、'],
  [47.1, 50.4, '父親をやめられる男は<br>いなくなった。'],
  [50.5, 52.6, '実は今年4月から、'],
  [52.7, 56.0, '取り決めがなくても<br>子1人月2万円を請求できる。'],
  [56.1, 61.3, '養育費を払わない親、<br>給料から天引きするべき？'],
];
const shots = [
  { a: 0, b: 2.9, f: shot0 }, { a: 2.9, b: 5.5, f: shot1 }, { a: 5.5, b: 9.7, f: shot2 }, { a: 9.7, b: 13.7, f: shot3 }, { a: 13.7, b: 18.7, f: shot4 },
  { a: 18.7, b: 22.1, f: shot5 }, { a: 22.1, b: 25.9, f: shot6 }, { a: 25.9, b: 30.5, f: shot7 }, { a: 30.5, b: 34.7, f: shot8 },
  { a: 34.7, b: 39.7, f: shot9 }, { a: 39.7, b: 44.5, f: shot10 }, { a: 44.5, b: 50.5, f: shot11 }, { a: 50.5, b: 56.1, f: shot12 },
  { a: 56.1, b: 61.6, f: shot13 }, { a: 61.6, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0643',
    v2: true,
    hookLine: '元夫の給与明細に、養育費 天引き の赤いハンコがドン。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも養育費が給料から勝手に引かれたら？',
    titleHtml: 'もしも養育費が<br>給料から勝手に<br>引かれたら？',
    mood: 'tension', seed: 643, hits: [0.45, 44.5, 50.5], risers: [39.7], impacts: [11.1, 14.0, 20.0, 23.5, 28.2, 44.8, 54.3],
    sfx: [[0.45, 'poof'], [6.0, 'whoosh'], [11.1, 'poof'], [19.0, 'meter', 0.5], [23.5, 'alarm'], [32.1, 'bubble'], [37.3, 'bubble'], [40.2, 'whoosh'], [45.0, 'whoosh'], [51.5, 'poof']],
    narr: { '28.1%': 'にじゅうはちてんいちパーセント', '10軒': 'じゅっけん', '7軒': 'ななけん', '手取り': 'てどり', '結果：': '結果、', '子1人月2万円': 'こどもひとり、つきにまんえん', '今年4月': 'ことしのしがつ', '明細': 'めいさい', '一斉': 'いっせい', '天引き': 'てんびき' },
    ask: '養育費を払わない親、天引きするべき？',
    caption: 'もしも養育費が給料から勝手に引かれたら？\n\nシングルマザーたちの不満から。離婚すると、父親だけが子育てから逃げられる。\nある日、養育費は給料から自動で引かれることになった。\n母子家庭で、養育費を今も受け取れているのは28.1%だけ。10軒のうち7軒には、届いていなかった。\n給料日。元夫たちの手取りが、一斉に減る。払えなかったんじゃない。払わなくても困らなかっただけ。\n再婚した家では、新しい妻が明細を見て固まる。婚活の場では、バツイチの男が先に子どもの話をするようになる。\n一方、母子家庭の家計に、毎月決まったお金がやっと入る。\n\n結果：天引きが始まって、父親をやめられる男はいなくなった。\n実は今年4月から、取り決めがなくても子1人月2万円を請求できる（法定養育費）。\n\n養育費を払わない親、給料から天引きするべき？ コメントで教えて。\n\n※風刺ネタです。給料からの自動天引きは、もしもの設定です\n出典：こども家庭庁「令和3年度 全国ひとり親世帯等調査」（母子世帯で養育費を現在も受けている 28.1%）、政府広報オンライン「法定養育費」（2026年4月1日施行・子1人月2万円）',
    hashtags: ['もしもラボ', 'もしも', '養育費', 'シングルマザー', '離婚'],
    endStats: [['養育費を今も受け取れている母子世帯', '28.1%', '2021年度調査'], ['取り決めをしている母子世帯', '46.7%', '2021年度調査'], ['法定養育費', '子1人 月2万円', '2026年4月〜']],
    sources: '出典：こども家庭庁「令和3年度 全国ひとり親世帯等調査」、政府広報オンライン「法定養育費」',
  },
});
