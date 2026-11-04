import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc, makeMark } from '../scenes/hanko.js';
import { makeSuit, poseClear, poseSit, poseCheer, makeSweat } from '../scenes/office.js';

// もしも結婚式のご祝儀が消えたら？（皮肉回・台本 S22・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・Togetter で定期的に燃える ご祝儀3万円は高い・呼ばれたくない結婚式 の話
// 数字（裏取り済み）：
//  挙式・披露宴・ウエディングパーティー総額 平均343.9万円／ご祝儀総額 平均205.6万円／招待客 平均52.0人
//   リクルート「ゼクシィ結婚トレンド調査2024」（全国推計値。2023年4月〜2024年3月に挙式・披露宴をした人）
//   https://souken.zexy.net/data/trend2024/XY_MT24_report.pdf
//  約6割は 205.6÷343.9≒0.598 の単純計算（画面に（単純計算）と出す）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', PINK = '#ff7ab8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2e2a36'); S.fog = new THREE.Fog(0x2e2a36, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff6ea, 0x4a4050, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#2c2834', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
// ご祝儀袋（白い袋に赤と金の水引）
function makeShugi() { const g = new THREE.Group(); const b = box(0.36, 0.56, 0.04, mat('#fbfaf5')); g.add(b); const band = box(0.37, 0.06, 0.045, mat('#c8242c')); band.position.y = -0.04; g.add(band); const band2 = box(0.37, 0.025, 0.046, mat('#e8c060')); band2.position.y = 0.0; g.add(band2); const knot = box(0.12, 0.1, 0.05, mat('#e8c060')); knot.position.y = -0.03; g.add(knot); return g; }
function makeBride() {
  const p = makeWoman({ shirt: '#fbfbff', pants: '#fbfbff', hair: '#3a2620', skirt: true });
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.0, 20, 1, true), mat('#fbfbff', { side: THREE.DoubleSide })); dress.position.y = 0.5; p.add(dress);
  const veil = box(0.5, 0.7, 0.06, mat('#eef2ff', { transparent: true, opacity: 0.85 })); veil.position.set(0, 0.25, -0.22); p.userData.head.add(veil);
  const tiara = box(0.3, 0.05, 0.05, mat('#e8c060')); tiara.position.set(0, 0.56, 0.12); p.userData.head.add(tiara);
  return p;
}
function makeRoundTable(x, z) { const g = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 28), mat('#fbfaf5')); top.position.y = 0.74; g.add(top); const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 1.0, 0.7, 28), mat('#f2eee6')); cloth.position.y = 0.37; g.add(cloth); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#f29bbb')); fl.position.y = 0.92; g.add(fl); g.position.set(x, 0, z); S.add(g); return g; }

// ---------- A：受付（原点） ----------
const afloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#c8b8a0', { depthWrite: false })); afloor.rotation.x = -Math.PI / 2; afloor.position.set(0, 0.01, 0); afloor.renderOrder = -0.8; S.add(afloor);
const awall = box(14, 3.6, 0.2, mat('#f2e8dc')); awall.position.set(0, 1.8, -3.0); S.add(awall);
for (const x of [-3.5, 3.5]) { const c = box(0.4, 3.4, 0.4, mat('#e8dcc8')); c.position.set(x, 1.7, -2.7); S.add(c); }
const desk = box(3.0, 0.76, 0.9, mat('#fbfaf5')); desk.position.set(0, 0.38, -0.8); S.add(desk);
const deskSkirt = box(3.04, 0.2, 0.94, mat('#e8c060')); deskSkirt.position.set(0, 0.66, -0.8); S.add(deskSkirt);
const tray = new THREE.Group(); { const b = box(1.4, 0.05, 0.9, mat('#c8242c')); tray.add(b); for (const [w, d, x, z] of [[1.4, 0.06, 0, 0.45], [1.4, 0.06, 0, -0.45], [0.06, 0.9, 0.7, 0], [0.06, 0.9, -0.7, 0]]) { const e = box(w, 0.1, d, mat('#a81c24')); e.position.set(x, 0.05, z); tray.add(e); } } tray.position.set(0, 0.79, -0.75); S.add(tray);
const PILE = []; { const r = rng(5); for (let i = 0; i < 24; i++) { const s = makeShugi(); const lay = Math.floor(i / 8); s.rotation.set(-Math.PI / 2 + (r() - .5) * 0.2, (r() - .5) * 0.6, 0); s.position.set(-0.5 + (i % 4) * 0.33 + (r() - .5) * 0.06, 0.84 + lay * 0.05 + (i % 8 >= 4 ? 0.025 : 0), -0.95 + (i % 8 >= 4 ? 0.36 : 0) + (r() - .5) * 0.05); s.userData.p0 = s.position.clone(); S.add(s); PILE.push(s); } }
const standSh = []; for (let i = 0; i < 5; i++) { const s = makeShugi(); s.scale.setScalar(1.4); s.position.set(-0.6 + i * 0.3, 1.25 + Math.abs(i - 2) * -0.06, -1.05); s.rotation.set(-0.25, (i - 2) * 0.15, (i - 2) * -0.12); S.add(s); standSh.push(s); }
const uke = label('受付', { w: 512, size: 120, color: '#fff', bg: 'rgba(180,140,60,.96)', sx: 0.9 }); uke.position.set(0, 2.2, -2.85); S.add(uke);
const RECEP = makeWoman({ shirt: '#3a3f6e', hair: '#1d1a19' }); RECEP.position.set(0.9, 0, -1.7); S.add(RECEP);
const poofA = makeSparkles(160, 0.18, 0xffe6a0); S.add(poofA.points); poofA.init(PILE.map(p => [p.position.x, p.position.y + 0.1, p.position.z]), 0.2, 1.4);
const fuyou = label('ご祝儀 不要', { w: 768, size: 120, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.5 }); S.add(fuyou);
const tebura = label('手ぶらでOK', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(tebura);
const GUEST = makeWoman({ shirt: '#7a9ad0', hair: '#5a3a28', skirt: true, pants: '#7a9ad0' }); S.add(GUEST);

// ---------- B：料理と引き出物（x=60） ----------
const BX = 60;
const btbl = makeRoundTable(BX, -1); btbl.position.set(BX, 0, -1);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.04, 24), mat('#ffffff')); plate.position.set(BX - 0.35, 0.8, -0.6); S.add(plate);
const steak = box(0.3, 0.08, 0.2, mat('#8a4a2a')); steak.position.set(BX - 0.35, 0.86, -0.6); S.add(steak);
const veg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#5aa04a')); veg.position.set(BX - 0.2, 0.87, -0.5); S.add(veg);
const giftBag = new THREE.Group(); { const b = box(0.5, 0.55, 0.22, mat('#e8dcc8')); b.position.y = 0.28; giftBag.add(b); const h = box(0.3, 0.2, 0.02, mat('#a08a6a')); h.position.y = 0.62; giftBag.add(h); const rib = box(0.52, 0.05, 0.23, mat('#c8242c')); rib.position.y = 0.45; giftBag.add(rib); } giftBag.position.set(BX + 0.4, 0.77, -0.75); S.add(giftBag);
const labRyori = label('料理', { w: 384, size: 110, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 0.7 }); labRyori.position.set(BX - 0.4, 1.45, -0.6); S.add(labRyori);
const labHiki = label('引き出物', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 0.95 }); labHiki.position.set(BX + 0.45, 1.75, -0.7); S.add(labHiki);
const sanman = label('3万円', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.1 }); S.add(sanman);
const takai = label('高すぎる', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(takai);
const FRIENDS = [0, 1].map(i => { const f = makeWoman({ shirt: ['#f2b8a0', '#a8d0b0'][i], hair: ['#2a1e1a', '#5a3a28'][i], skirt: true, pants: ['#f2b8a0', '#a8d0b0'][i] }); S.add(f); return f; });

// ---------- C：独身女子の部屋（x=120） ----------
const CX = 120;
const croom = makeRoom({ w: 9, d: 7, wall: '#f6e6ee', floor: '#c8a878' }); croom.position.set(CX, 0, 0); croom.userData.rw.visible = false; S.add(croom);
const bedC = box(2.0, 0.45, 1.4, mat('#f2c0d0')); bedC.position.set(CX + 2.0, 0.22, -2.2); S.add(bedC);
const SINGLE = makeWoman({ shirt: '#f29bbb', hair: '#3a2620' }); S.add(SINGLE);
const invite = makeDoc({ title: '招待状', rows: ['ご祝儀'], head: '#e8a0b0', w: 0.8, h: 0.62, cw: 384 }); S.add(invite);
const yatta = label('行く！', { w: 512, size: 130, color: '#fff', bg: 'rgba(255,90,140,.96)', sx: 1.0 }); S.add(yatta);
const heartsC = makeSparkles(120, 0.2, 0xffb0d0); S.add(heartsC.points); heartsC.init([[CX, 2.2, -0.8]], 1.4, 1.4);
// 招待状が来なかった友達（同じ部屋、ベッド側）
const FRIEND2 = makeWoman({ shirt: '#a8b8e0', hair: '#1d1a19' }); S.add(FRIEND2);
const phoneF = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(phoneF);
const hotto = label('ほっ…', { w: 512, size: 130, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 0.9 }); S.add(hotto);
const sabishi = label('…さみしい', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 1.3 }); S.add(sabishi);
const mail0 = label('招待状 0通', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); S.add(mail0);

// ---------- D：花嫁と見積もり（x=180） ----------
const DX = 180;
const droom = makeRoom({ w: 10, d: 7, wall: '#f2ece0', floor: '#b8a07a' }); droom.position.set(DX, 0, 0); droom.userData.rw.visible = false; S.add(droom);
const BRIDE = makeBride(); S.add(BRIDE);
const GROOM = makeSuit({ jacket: '#22242c', tie: '#c8c8d0' }); S.add(GROOM);
const EST = makeDoc({ title: '見積書', rows: ['挙式', '披露宴', '合計'], head: '#3a3f6e', w: 1.1, h: 1.15 }); S.add(EST);
const sweatB = makeSweat(); BRIDE.userData.head.add(sweatB);
const aozame = label('青ざめる', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.3 }); S.add(aozame);

// ---------- E：棒グラフ（x=240） ----------
const EX = 240;
const efloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -1); efloor.renderOrder = -0.8; S.add(efloor);
function bar(x, color) { const b = box(1.3, 1, 1.0, mat(color)); b.geometry.translate(0, 0.5, 0); b.position.set(x, 0, -1); S.add(b); return b; }
const BT = bar(EX - 0.9, '#8a92a8'), BG = bar(EX + 0.9, '#e8c060');
const BT_G = box(1.32, 1, 1.02, mat('#e8c060')); BT_G.geometry.translate(0, 0.5, 0); BT_G.position.set(EX - 0.9, 0, -1); S.add(BT_G); // 総額のうちご祝儀の分
const H_T = 3.0, H_G = 3.0 * 205.6 / 343.9;
const labTot = label('総額', { w: 384, size: 110, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 0.75 }); S.add(labTot);
const labGo = label('ご祝儀', { w: 512, size: 110, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 0.95 }); S.add(labGo);
const labGuest = label('ゲストの財布', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.35 }); S.add(labGuest);

// ---------- F：披露宴会場（x=300）：52人 ----------
const FX = 300;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), mat('#b89a7a', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.01, -2); ffloor.renderOrder = -0.8; S.add(ffloor);
const fwall = box(22, 4, 0.2, mat('#f2e8dc')); fwall.position.set(FX, 2, -8.5); S.add(fwall);
const highTable = box(3.2, 0.8, 0.8, mat('#fbfaf5')); highTable.position.set(FX, 0.4, -7.2); S.add(highTable);
const TABLES = []; const SEATS = [];
{ const pos = [[-4.2, -4.6], [0, -4.6], [4.2, -4.6], [-4.2, -1.6], [0, -1.6], [4.2, -1.6], [-2.1, 1.2], [2.1, 1.2]];
  const r = rng(9); let n = 0;
  pos.forEach(([x, z], ti) => { TABLES.push(makeRoundTable(FX + x, z)); const k = ti < 4 ? 7 : 6; for (let j = 0; j < k && n < 52; j++, n++) { const a = j / k * Math.PI * 2 + 0.3; const p = (r() < 0.5 ? makeWoman : makeMan)({ shirt: ['#3a3f6e', '#7a9ad0', '#f2b8a0', '#a8d0b0', '#2e3442', '#c9a8d8', '#8a8f99'][Math.floor(r() * 7)], hair: ['#1d1a19', '#3a2620', '#5a3a28'][Math.floor(r() * 3)] }); p.position.set(FX + x + Math.cos(a) * 1.25, 0, z + Math.sin(a) * 1.25); p.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); p.userData.ti = ti; S.add(p); SEATS.push(p); } });
}
// 減らす順（会社の上司・バイト仲間・数合わせの友達…）。最後に残るのは前の2卓の一部
const KEEP = new Set(); SEATS.forEach((p, i) => { if (p.userData.ti >= 6 || (p.userData.ti === 4 && i % 2 === 0)) KEEP.add(i); });
const DROP = SEATS.map((p, i) => i).filter(i => !KEEP.has(i));
const BRIDE2 = makeBride(); BRIDE2.position.set(FX - 0.5, 0.8, -7.3); BRIDE2.scale.setScalar(0.95); S.add(BRIDE2);
const GROOM2 = makeSuit({ jacket: '#22242c', tie: '#c8c8d0' }); GROOM2.position.set(FX + 0.5, 0.8, -7.3); S.add(GROOM2);
const stage = box(4.0, 0.8, 1.4, mat('#e8dcc8')); stage.position.set(FX, 0.4, -7.6); S.add(stage);
const poofF = makeSparkles(200, 0.2, 0xfff2c0); S.add(poofF.points); poofF.init(DROP.map(i => [SEATS[i].position.x, 1.2, SEATS[i].position.z]), 0.3, 1.2);
const coinsF = makeSparkles(160, 0.18, 0xffd27a); S.add(coinsF.points); coinsF.init([...KEEP].map(i => [SEATS[i].position.x, 1.6, SEATS[i].position.z]), 0.3, 1.6);
const warikan = label('割り勘パーティー', { w: 1024, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.4 }); S.add(warikan);
const honto = label('本当にお祝いしたい人', { w: 1024, size: 100, color: '#fff', bg: 'rgba(255,90,140,.96)', sx: 2.4 }); S.add(honto);

// ---------- G：招待リスト（x=360） ----------
const GX = 360;
const gfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); gfloor.rotation.x = -Math.PI / 2; gfloor.position.set(GX, 0.02, -1); gfloor.renderOrder = -0.8; S.add(gfloor);
const LIST = makeDoc({ title: '招待リスト', rows: ['会社の上司', 'バイト仲間', '数合わせ', '親友', '家族'], head: '#e8a0b0', w: 2.0, h: 2.5 }); LIST.position.set(GX, 2.0, -1); S.add(LIST);
const LMARKS = [0, 1, 2].map(i => { const m = makeMark('×', { sx: 0.5, ring: false }); S.add(m); return m; });

const ALL = [RECEP, GUEST, ...FRIENDS, SINGLE, FRIEND2, BRIDE, GROOM];
// 最初の位置（どの秒からでも撮れるように各場所に置いておく）
GUEST.position.set(1.5, 0, 0.6); FRIENDS.forEach((f, i) => f.position.set(BX - 0.8 + i * 1.6, 0, 0.3)); SINGLE.position.set(CX - 0.5, 0, -0.6); FRIEND2.position.set(CX + 1.8, 0, -1.2);
BRIDE.position.set(DX - 0.4, 0, -0.8); GROOM.position.set(DX + 1.0, 0, -1.2); EST.position.set(DX - 0.35, 1.25, -0.35); invite.position.set(CX - 0.3, 1.35, -0.25); phoneF.position.set(CX + 1.8, 1.3, -0.9);
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  RECEP.rotation.y = 0; PILE.forEach(s => { s.visible = true; s.position.copy(s.userData.p0); }); standSh.forEach(s => s.visible = true); poofA.set(0);
  [fuyou, tebura, sanman, takai, yatta, hotto, sabishi, mail0, aozame, labTot, labGo, labGuest, warikan, honto].forEach(l => l.visible = false);
  heartsC.set(0); sweatB.userData.set(0); poofF.set(0); coinsF.set(0); SEATS.forEach(p => { p.visible = true; poseReset(p); });
  SEATS.forEach(p => { p.rotation.y = p.userData.ry0 ?? (p.userData.ry0 = p.rotation.y); });
  BT.scale.y = BG.scale.y = BT_G.scale.y = 0.001; BT_G.visible = false; BG.visible = BT.visible = true;
  LMARKS.forEach(m => m.visible = false); EST.userData.fill(0, ''); EST.userData.fill(1, ''); EST.userData.fill(2, '');
  invite.userData.fill(0, ''); el.flash.style.opacity = 0;
}
SEATS.forEach(p => { p.userData.ry0 = p.rotation.y; });
const TP = 0.45;
function deskCam(d = 0) { look(lerp(0.2, 0.1, d), 2.15, lerp(3.4, 3.7, d), 0, 1.28, -0.9, 52); }
function shot0(t) { // 0秒＝サムネ：受付のご祝儀袋の山が消えて、空のお盆だけが残る
  reset(); lift(0);
  const gone = t > TP; PILE.forEach((s, i) => { s.visible = !gone; }); standSh.forEach(s => s.visible = !gone);
  poofA.set(gone ? clamp((t - TP) / 1.4) : 0);
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  RECEP.userData.head.rotation.x = gone ? 0.35 : 0; if (gone) RECEP.userData.arms.forEach(a => a.rotation.x = -0.4);
  deskCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // 呼ばれる側の不満から。
  reset(); lift(80); FRIENDS.forEach((f, i) => { f.position.set(BX - 0.8 + i * 1.6, 0, 0.3); f.rotation.y = i ? -0.5 : 0.5; f.userData.arms[1].rotation.x = -0.5; f.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.15; });
  takai.position.set(BX, 2.4, 0.2); pop(takai, t, 0.6, 0.3, 1.2);
  look(BX, 2.0, 4.6, BX, 1.2, -0.4, 52);
  return S;
}
function shot2(t) { // 料理と引き出物で3万円は高すぎる
  reset(); lift(120); FRIENDS.forEach(f => f.visible = false);
  sanman.position.set(BX, 2.4, -0.7); pop(sanman, t, 1.4, 0.25, 1.1);
  if (t > 2.2) { takai.position.set(BX, 2.95, -0.7); pop(takai, t, 2.2, 0.25, 1.05); }
  look(BX, 2.0, 3.2, BX, 1.3, -0.8, 50);
  return S;
}
function shot3(t) { // ある日、結婚式からご祝儀が消えた
  reset(); lift(0); PILE.forEach(s => s.visible = false); standSh.forEach(s => s.visible = false);
  fuyou.position.set(0, 1.6, -0.75); pop(fuyou, t, 0.5, 0.3, 1.3);
  RECEP.userData.head.rotation.x = 0.35;
  deskCam(0.6);
  return S;
}
function shot4(t) { // 手ぶらで行っていい
  reset(); lift(310); PILE.forEach(s => s.visible = false); standSh.forEach(s => s.visible = false);
  const k = clamp(t / 1.8); GUEST.position.set(1.8 - k * 1.6, 0, 0.5); GUEST.rotation.y = -Math.PI / 2; walk(GUEST, t, 8, 0.5); GUEST.userData.arms[0].rotation.z = 0.5; GUEST.userData.arms[1].rotation.z = -0.5;
  tebura.position.set(0.4, 2.35, 0.3); pop(tebura, t, 0.2, 0.3, 1.2);
  look(0.6, 2.1, 5.8, 0.3, 1.45, -0.3, 52);
  return S;
}
function shot5(t) { // 招待状が届いた独身女子は大喜び
  reset(); lift(80); SINGLE.position.set(CX - 0.3, 0, -0.6); SINGLE.rotation.y = 0; invite.userData.fill(0, '不要');
  if (t > 0.8) { poseCheer(SINGLE, t); invite.position.set(CX - 0.3, 1.75 + Math.abs(Math.sin(t * 6)) * 0.12, -0.25); heartsC.set(clamp((t - 0.8) / 2)); } else { SINGLE.userData.arms.forEach(a => a.rotation.x = -1.1); invite.position.set(CX - 0.3, 1.3, -0.25); }
  yatta.position.set(CX + 0.5, 2.55, -0.6); pop(yatta, t, 0.9, 0.25, 0.95);
  look(CX, 2.1, 4.2, CX - 0.1, 1.45, -0.6, 52);
  return S;
}
function shot6(t) { // 一方、式の見積もりを見た花嫁が青ざめる
  reset(); lift(300); BRIDE.position.set(DX - 0.4, 0, -0.8); BRIDE.rotation.y = 0.2; BRIDE.userData.arms.forEach(a => a.rotation.x = -1.0);
  GROOM.position.set(DX + 1.0, 0, -1.2); GROOM.rotation.y = -0.4;
  EST.position.set(DX - 0.3, 1.1, -0.12); EST.rotation.set(-0.5, 0.2, 0); EST.userData.fill(0, '○○万円'); EST.userData.fill(1, t > 0.8 ? '○○○万円' : ''); EST.userData.fill(2, t > 1.4 ? '？？？万円' : '');
  if (t > 1.6) { BRIDE.userData.head.rotation.x = -0.15; sweatB.userData.set(1, t); aozame.position.set(DX + 0.35, 2.35, -0.8); pop(aozame, t, 1.7, 0.25, 1.2); }
  look(DX + 0.3, 2.7, 3.7, DX + 0.1, 1.25, -0.7, 52);
  return S;
}
function barsCam() { look(EX, 2.4, 8.4, EX, 2.0, -1, 50); }
function shot7(t) { // 結婚式の総額は平均343.9万円
  reset(); lift(310); BG.visible = false; BT.scale.y = Math.max(0.001, H_T * easeOut(clamp((t - 0.2) / 1.2)));
  labTot.position.set(EX - 0.9, BT.scale.y + 0.35, -0.4); labTot.visible = true;
  barsCam(); setTop('結婚式の総額（平均）', '343.9万円', fade(t, 0.4, 3.3, 0.25), GOLD);
  return S;
}
function shot8(t) { // ご祝儀は平均205.6万円
  reset(); lift(310); BT.scale.y = H_T; BG.scale.y = Math.max(0.001, H_G * easeOut(clamp((t - 0.2) / 1.2)));
  labTot.position.set(EX - 0.9, H_T + 0.35, -0.4); labTot.visible = true; labGo.position.set(EX + 0.9, BG.scale.y + 0.35, -0.4); labGo.visible = true;
  barsCam(); setTop('ご祝儀の総額（平均）', '205.6万円', fade(t, 0.4, 2.9, 0.25), GOLD);
  return S;
}
function shot9(t) { // 費用の約6割は、ゲストの財布から出ていた
  reset(); lift(310); BT.scale.y = H_T; BG.scale.y = H_G; BT_G.visible = true; BT_G.scale.y = Math.max(0.001, H_G * easeOut(clamp((t - 0.3) / 1.0)));
  labTot.position.set(EX - 0.9, H_T + 0.35, -0.4); labTot.visible = true; labGo.position.set(EX + 0.9, H_G + 0.35, -0.4); labGo.visible = true;
  labGuest.position.set(EX - 0.9, H_G * 0.5, -0.3); pop(labGuest, t, 1.3, 0.25, 1.25);
  barsCam(); setTop('ゲストの財布から（単純計算）', '約6割', fade(t, 1.2, 3.3, 0.25), GOLD);
  return S;
}
function hallCam(u = 0) { look(FX, lerp(10.5, 11.5, u), lerp(9.5, 10.5, u), FX, 0.4, -2.4, 50); }
function shot10(t) { // 招待客を、平均52人から半分に減らすことに
  reset(); lift(150); const k = clamp((t - 1.4) / 1.6); const n = Math.floor(k * 26);
  DROP.slice(0, n).forEach(i => SEATS[i].visible = false); poofF.set(t > 1.4 && t < 3.2 ? (t - 1.4) / 1.8 : 0);
  hallCam(ease(clamp(t / 3.4)));
  setTop('招待客（平均）', t < 1.4 ? '52人' : '52人 → 半分', fade(t, 0.3, 3.3, 0.25), GOLD);
  return S;
}
function listCam() { look(GX, 2.0, 4.2, GX, 2.0, -1, 50); }
function shot11(t) { // 会社の上司、昔のバイト仲間、
  reset(); lift(300); [0, 1].forEach(i => { const on = t > 0.4 + i * 1.0; LMARKS[i].visible = on; LMARKS[i].position.set(GX + 0.35, 2.55 - i * 0.43, -0.9); LMARKS[i].userData.size(on && t < 0.6 + i * 1.0 ? 0.6 : 0.42); });
  el.flash.style.opacity = (t > 0.4 && t < 0.5) || (t > 1.4 && t < 1.5) ? 0.18 : 0;
  listCam(); return S;
}
function shot12(t) { // 数合わせの友達から名前が消えていく
  reset(); lift(300); [0, 1, 2].forEach(i => { const on = i < 2 || t > 0.5; LMARKS[i].visible = on; LMARKS[i].position.set(GX + 0.35, 2.55 - i * 0.43, -0.9); LMARKS[i].userData.size(i === 2 && t < 0.7 ? 0.6 : 0.42); });
  el.flash.style.opacity = t > 0.5 && t < 0.6 ? 0.18 : 0;
  listCam(); return S;
}
function shot13(t) { // 最後に残ったのは、本当にお祝いしたい人だけ
  reset(); lift(150); DROP.forEach(i => SEATS[i].visible = false); TABLES.forEach((tb, i) => tb.visible = i >= 4 && i !== 5 ? true : i === 4);
  [...KEEP].forEach((i, j) => { const p = SEATS[i]; if (t > 0.8 && j % 2 === 0) poseCheer(p, t + j); });
  honto.position.set(FX, 3.6, -1.0); pop(honto, t, 0.6, 0.3, 2.3);
  look(FX, 7.5, 8.6, FX, 0.6, -2.6, 50);
  return S;
}
function friendRoom(t) { FRIEND2.position.set(CX + 0.3, 0, -0.7); FRIEND2.rotation.y = 0; FRIEND2.userData.arms[1].rotation.x = -1.2; FRIEND2.userData.head.rotation.x = 0.3; phoneF.position.set(CX + 0.48, 1.32, -0.3); SINGLE.visible = false; invite.visible = false; }
function shot14(t) { // 招待状が来なかった友達は、
  reset(); lift(80); friendRoom(t); invite.visible = false;
  mail0.position.set(CX + 0.3, 2.55, -0.7); pop(mail0, t, 0.4, 0.3, 1.35);
  look(CX + 0.3, 2.1, 4.0, CX + 0.3, 1.45, -0.7, 52);
  return S;
}
function shot15(t) { // ほっとしたような、少し寂しいような
  reset(); lift(80); friendRoom(t); invite.visible = false;
  if (t < 1.4) { FRIEND2.userData.head.rotation.x = -0.1; hotto.position.set(CX + 0.3, 2.55, -0.7); pop(hotto, t, 0.1, 0.25, 0.9); }
  else { FRIEND2.userData.head.rotation.x = 0.4; sabishi.position.set(CX + 0.3, 2.55, -0.7); pop(sabishi, t, 1.4, 0.25, 1.2); }
  look(CX + 0.3, 2.1, 3.6, CX + 0.3, 1.45, -0.7, 52);
  return S;
}
function shot16(t) { // 結果：ご祝儀が消えて、消えたのは数合わせの席だった
  reset(); lift(150); DROP.forEach(i => SEATS[i].visible = false);
  TABLES.forEach((tb, i) => { const gone = i < 4 || i === 5; tb.visible = !gone || t < 1.0 + i * 0.25; });
  hallCam(1 - ease(clamp(t / 4.6)));
  setTop('結果', '数合わせの席が消えた', fade(t, 0.3, 4.6, 0.25), GOLD);
  return S;
}
function shot17(t) { // 結婚式は、ゲストが割り勘で開くパーティー／だったのかもしれない
  reset(); lift(150); DROP.forEach(i => SEATS[i].visible = false); TABLES.forEach((tb, i) => tb.visible = !(i < 4 || i === 5));
  coinsF.set(clamp((t - 0.3) / 3.0)); [...KEEP].forEach(i => { SEATS[i].userData.arms[1].rotation.x = -1.4; });
  warikan.position.set(FX, 3.6, -1.0); pop(warikan, t, 1.0, 0.3, 2.3);
  look(FX, 7.5, 8.6, FX, 0.6, -2.6, 50);
  return S;
}
function shot18(t) { // 質問。最後は冒頭と同じ構図（空のお盆）
  reset(); lift(0); PILE.forEach(s => s.visible = false); standSh.forEach(s => s.visible = false);
  RECEP.userData.head.rotation.x = 0.35; RECEP.userData.arms.forEach(a => a.rotation.x = -0.4);
  deskCam(0);
  return S;
}

const SUBS = [
  [3.0, 5.0, '呼ばれる側の<br>不満から。'],
  [5.1, 8.2, '料理と引き出物で<br>3万円は高すぎる。'],
  [8.3, 11.0, 'ある日、結婚式から<br>ご祝儀が消えた。'],
  [11.1, 12.9, '手ぶらで行っていい。'],
  [13.0, 15.6, '招待状が届いた<br>独身女子は大喜び。'],
  [15.7, 19.0, '一方、式の見積もりを見た<br>花嫁が青ざめる。'],
  [19.1, 22.4, '結婚式の総額は<br>平均343.9万円。'],
  [22.5, 25.5, 'ご祝儀は<br>平均205.6万円。'],
  [25.6, 29.0, '費用の約6割は、ゲストの<br>財布から出ていた。'],
  [29.1, 32.5, '招待客を、平均52人から<br>半分に減らすことに。'],
  [32.6, 35.2, '会社の上司、<br>昔のバイト仲間、'],
  [35.3, 38.2, '数合わせの友達から<br>名前が消えていく。'],
  [38.3, 41.5, '最後に残ったのは、本当に<br>お祝いしたい人だけ。'],
  [41.6, 43.9, '招待状が来なかった<br>友達は、'],
  [44.0, 46.9, 'ほっとしたような、<br>少し寂しいような。'],
  [47.0, 51.6, '結果：ご祝儀が消えて、<br>消えたのは数合わせの席だった。'],
  [51.7, 54.8, '結婚式は、ゲストが割り勘で<br>開くパーティー'],
  [54.9, 56.8, 'だったのかもしれない。'],
  [56.9, 61.5, '結婚式のご祝儀3万円、<br>高い？妥当？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.1, f: shot1 }, { a: 5.1, b: 8.3, f: shot2 }, { a: 8.3, b: 11.1, f: shot3 }, { a: 11.1, b: 13.0, f: shot4 },
  { a: 13.0, b: 15.7, f: shot5 }, { a: 15.7, b: 19.1, f: shot6 }, { a: 19.1, b: 22.5, f: shot7 }, { a: 22.5, b: 25.6, f: shot8 },
  { a: 25.6, b: 29.1, f: shot9 }, { a: 29.1, b: 32.6, f: shot10 }, { a: 32.6, b: 35.3, f: shot11 }, { a: 35.3, b: 38.3, f: shot12 },
  { a: 38.3, b: 41.6, f: shot13 }, { a: 41.6, b: 44.0, f: shot14 }, { a: 44.0, b: 47.0, f: shot15 }, { a: 47.0, b: 51.7, f: shot16 },
  { a: 51.7, b: 56.9, f: shot17 }, { a: 56.9, b: 61.8, f: shot18 }, { a: 61.8, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0644',
    v2: true,
    hookLine: '受付のご祝儀袋の山が消えて、空のお盆だけが残る。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも結婚式のご祝儀が消えたら？',
    titleHtml: 'もしも結婚式の<br>ご祝儀が<br>消えたら？',
    mood: 'tension', seed: 644, hits: [0.45, 47.0, 51.7], risers: [44.0], impacts: [6.5, 19.6, 22.9, 26.9, 30.5, 47.2],
    sfx: [[0.45, 'poof'], [8.8, 'poof'], [14.0, 'bubble'], [17.4, 'alarm'], [30.5, 'poof'], [33.0, 'whoosh'], [34.0, 'whoosh'], [35.8, 'whoosh'], [39.0, 'bubble'], [48.0, 'poof'], [52.3, 'bubble']],
    narr: { '3万円': 'さんまんえん', '343.9万円': 'さんびゃくよんじゅうさんてんきゅうまんえん', '205.6万円': 'にひゃくごてんろくまんえん', '約6割': 'やくろくわり', '52人': 'ごじゅうににん', 'ご祝儀': 'ごしゅうぎ', '引き出物': 'ひきでもの', '見積もり': 'みつもり', '数合わせ': 'かずあわせ', '割り勘': 'わりかん', '結果：': '結果、', '妥当': 'だとう', '一方': 'いっぽう', '手ぶら': 'てぶら' },
    ask: '結婚式のご祝儀3万円、高い？妥当？',
    caption: 'もしも結婚式のご祝儀が消えたら？\n\n呼ばれる側の不満から。料理と引き出物で3万円は高すぎる。\nある日、結婚式からご祝儀が消えた。手ぶらで行っていい。\n招待状が届いた独身女子は大喜び。一方、式の見積もりを見た花嫁が青ざめる。\n結婚式の総額は平均343.9万円。ご祝儀は平均205.6万円。費用の約6割は、ゲストの財布から出ていた（単純計算）。\n招待客を、平均52人から半分に減らすことに。会社の上司、昔のバイト仲間、数合わせの友達から名前が消えていく。\n最後に残ったのは、本当にお祝いしたい人だけ。\n招待状が来なかった友達は、ほっとしたような、少し寂しいような。\n\n結果：ご祝儀が消えて、消えたのは数合わせの席だった。\n結婚式は、ゲストが割り勘で開くパーティーだったのかもしれない。\n\n結婚式のご祝儀3万円、高い？妥当？ コメントで教えて。\n\n※風刺ネタです\n出典：リクルート「ゼクシィ結婚トレンド調査2024」（挙式・披露宴・ウエディングパーティー総額 平均343.9万円、ご祝儀総額 平均205.6万円、招待客 平均52.0人。全国推計値）。約6割は 205.6÷343.9 の単純計算',
    hashtags: ['もしもラボ', 'もしも', 'ご祝儀', '結婚式', '結婚式あるある'],
    endStats: [['結婚式の総額（平均）', '343.9万円', '2024年調査'], ['ご祝儀の総額（平均）', '205.6万円', '2024年調査'], ['招待客（平均）', '52.0人', '2024年調査']],
    sources: '出典：リクルート「ゼクシィ結婚トレンド調査2024」',
  },
});
