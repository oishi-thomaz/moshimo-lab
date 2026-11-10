import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSuit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも残クレが消えたら？（皮肉回・台本 S62・社会の消えたら）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。元ネタ：ガルちゃん「「残クレのなにが悪いんでしょうね」新車のアルファードを購入した世帯年収500万円・35歳夫婦。」
//  https://girlschannel.net/topics/6327864/（2026/11/05、633コメント）
// 数字は使わない（総額の金額は出さない）。実在の車名・メーカーの見た目は出さない（高級ミニバン とだけ言う。車はローポリの架空の形）
// 行き先は現実の規模：普通の車に静かに散るだけ（どこかに車があふれる絵は描かない）

const S = new THREE.Scene();
S.background = new THREE.Color('#a8d0ee'); S.fog = new THREE.Fog(0xa8d0ee, 50, 200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a6a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8aa070', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); m.renderOrder = ro; S.add(m); return m; }

// 車（ローポリの架空の形）。big：背の高い高級ミニバン（メッキのグリル）、普通：小さめの車
function makeCar({ big = false, color = '#f4f4f2' } = {}) {
  const g = new THREE.Group(); const body = mat(color), glass = mat('#22303e'), chrome = mat('#d8dde4'), tire = mat('#1a1a1e'), light = new THREE.MeshBasicMaterial({ color: '#fff6d0' });
  const L = big ? 4.9 : 3.9, W = big ? 1.85 : 1.6, H = big ? 1.95 : 1.45;
  const lower = box(W, H * 0.48, L, body); lower.position.y = 0.32 + H * 0.24; g.add(lower);
  const cabinL = big ? L * 0.86 : L * 0.6;
  const cabin = box(W * 0.96, H * 0.46, cabinL, body); cabin.position.set(0, 0.32 + H * 0.48 + H * 0.23, big ? -L * 0.05 : -L * 0.08); g.add(cabin);
  for (const s of [-1, 1]) { const w = box(0.02, H * 0.3, cabinL * 0.9, glass); w.position.set(s * W * 0.485, cabin.position.y + 0.02, cabin.position.z); g.add(w); }
  const ws = box(W * 0.86, H * 0.32, 0.02, glass); ws.position.set(0, cabin.position.y + 0.02, cabin.position.z + cabinL / 2 + 0.005); g.add(ws);
  if (big) { const gr = box(W * 0.8, H * 0.3, 0.05, chrome); gr.position.set(0, 0.32 + H * 0.26, L / 2 + 0.02); g.add(gr); for (let i = 0; i < 4; i++) { const b = box(W * 0.78, 0.03, 0.02, mat('#8a9098')); b.position.set(0, 0.32 + H * 0.16 + i * 0.09, L / 2 + 0.05); g.add(b); } }
  for (const s of [-1, 1]) { const hl = box(0.3, 0.1, 0.03, light); hl.position.set(s * W * 0.36, 0.32 + H * 0.4, L / 2 + 0.02); g.add(hl); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), tire); wh.rotation.z = Math.PI / 2; wh.position.set(sx * W * 0.47, 0.34, sz * L * 0.32); g.add(wh); }
  g.userData.H = H;
  return g;
}
function makeHouse(color = '#efe6d6', roof = '#7a4a3a') {
  const g = new THREE.Group(); const b = box(7, 5.2, 6, mat(color)); b.position.set(0, 2.6, -4); g.add(b);
  const r = box(7.6, 0.5, 6.8, mat(roof)); r.position.set(0, 5.45, -4); g.add(r);
  const door = box(1.0, 2.0, 0.05, mat('#6a4a30')); door.position.set(-2.2, 1.0, -0.98); g.add(door);
  for (const [x, y] of [[0.6, 1.7], [2.4, 1.7], [0.6, 3.9], [2.4, 3.9], [-2.2, 3.9]]) { const w = box(1.1, 0.9, 0.05, mat('#9ec2e0')); w.position.set(x, y, -0.98); g.add(w); }
  return g;
}

// ---------- A：わが家の駐車場（原点） ----------
const HOME = makeHouse('#f2ead8', '#5a4a44'); S.add(HOME);
flat(3.4, 6, '#b8b4ac', 0, 2.5, -0.85);
const NEXT = makeHouse('#e4ecf0', '#4a5a6a'); NEXT.position.set(9, 0, 0); S.add(NEXT);
flat(3.4, 6, '#b8b4ac', 9, 2.5, -0.85);
const road = flat(80, 6, '#5a5e66', 4, 8.5, -0.85);
const fence = new THREE.Group(); for (let i = 0; i < 9; i++) { const p = box(0.12, 1.2, 0.12, mat('#d8d2c4')); p.position.set(4.4, 0.6, -0.4 + i * 0.6); fence.add(p); } { const rl = box(0.08, 0.1, 5.0, mat('#d8d2c4')); rl.position.set(4.4, 1.05, 2.0); fence.add(rl); } S.add(fence);
const VAN = makeCar({ big: true, color: '#f6f6f4' }); VAN.position.set(0, 0, 2.4); S.add(VAN);
const SMALL = makeCar({ color: '#8aa0b8' }); SMALL.position.set(0, 0, 2.6); S.add(SMALL);
const NEXTCAR = makeCar({ color: '#8aa0b8' }); NEXTCAR.position.set(9, 0, 2.6); S.add(NEXTCAR);
const OTTO = makeMan({ shirt: '#9cc0e0', pants: '#9cc0e0', hair: '#2a2420' }); S.add(OTTO);
const sweat = makeSweat(); OTTO.userData.head.add(sweat);
const TSUMA = makeWoman({ shirt: '#e9b8c8', hair: '#5a3a28' }); S.add(TSUMA);
const NB = [makeWoman({ shirt: '#c9a8d8', hair: '#6b4a33' }), makeMan({ shirt: '#5d8c3a', hair: '#3a3330' })]; NB.forEach(p => S.add(p));
const sparkA = makeSparkles(260, 0.3, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 1.2, 2.4], [0, 0.6, 4.2], [0, 1.6, 0.8]], 1.6, 2.2);
const kieta = label('残クレ 消滅', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.7 }); S.add(kieta);
const gaan = label('ガーン', { w: 512, size: 120, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.95 }); S.add(gaan);
const dekai = label('あの家だけ でかい', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.2 }); S.add(dekai);
const onaji = label('年収は同じくらい', { w: 900, size: 96, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.9 }); S.add(onaji);
const otonari = label('お隣と同じ', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.35 }); S.add(otonari);
const week = label('1週間後', { w: 640, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 1.1 }); S.add(week);
const mearage = label('見上げられる目線', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,150,40,.97)', sx: 2.0 }); S.add(mearage);
const pride = label('5年分のプライド', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.0 }); S.add(pride);
const sparkP = makeSparkles(160, 0.22, 0xffd27a); S.add(sparkP.points); sparkP.init([[0, 2.9, 4.6]], 1.2, 1.6);
// 指定席券（チケット）
function makeTicket() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 460; const g = c.getContext('2d');
  g.fillStyle = '#fbf3dc'; g.beginPath(); g.roundRect(10, 10, 1004, 440, 30); g.fill(); g.strokeStyle = '#c8342c'; g.lineWidth = 10; g.strokeRect(36, 36, 952, 388);
  g.fillStyle = '#c8342c'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('指定席券', 512, 150);
  g.fillStyle = '#2a1a00'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('ご近所の一番高い席', 512, 280); g.font = '800 54px "Noto Sans CJK JP", sans-serif'; g.fillText('有効期間 5年', 512, 370);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.renderOrder = 7; sp.scale.set(2.6, 2.6 * 460 / 1024, 1); return sp;
}
const TICKET = makeTicket(); S.add(TICKET);

// ---------- B：車屋（x=100）。架空の店 ----------
const BX = 100;
flat(16, 12, '#e8e8ec', BX, 0, -0.85);
const bWall = box(16, 5, 0.2, mat('#f6f6f8')); bWall.position.set(BX, 2.5, -4); S.add(bWall);
const bSign = label('もしもモータース', { w: 900, size: 100, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 3.0 }); bSign.position.set(BX, 3.7, -3.8); S.add(bSign);
const SHOWVAN = makeCar({ big: true, color: '#1e2228' }); SHOWVAN.position.set(BX - 3.8, 0, -1.4); SHOWVAN.rotation.y = 0.7; S.add(SHOWVAN);
const desk = box(2.4, 0.74, 1.0, mat('#d8d0c0')); desk.position.set(BX + 0.6, 0.37, 0); S.add(desk);
const SALES = makeSuit({ tie: '#2a5ab0' }); S.add(SALES);
const B_OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(B_OTTO);
const B_TSUMA = makeWoman({ shirt: '#e9b8c8', hair: '#5a3a28' }); S.add(B_TSUMA);
const tsukizuki = label('月々いくら？', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.5 }); S.add(tsukizuki);
function makeBoard() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 560; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 900, 560); g.fillStyle = '#c8342c'; g.fillRect(0, 0, 900, 130);
  g.fillStyle = '#fff'; g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('総額', 450, 70);
  g.fillStyle = '#1a1a1a'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.fillText('〇〇〇万円', 450, 300);
  g.font = '700 48px "Noto Sans CJK JP", sans-serif'; g.fillStyle = '#666'; g.fillText('（最後に残りを一括）', 450, 450);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.12), new THREE.MeshBasicMaterial({ map: t }));
}
const BOARD = makeBoard(); S.add(BOARD);

// ---------- C：台所のテーブル（x=150） ----------
const CX = 150;
flat(12, 10, '#c8a878', CX, 0, -0.85);
const cWall = box(12, 4, 0.2, mat('#efe8da')); cWall.position.set(CX, 2, -3); S.add(cWall);
const table = box(2.2, 0.74, 1.2, mat('#a8743a')); table.position.set(CX, 0.37, 0); S.add(table);
const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), mat('#ffffff')); paper.rotation.x = -Math.PI / 2; paper.position.set(CX, 0.75, 0); S.add(paper);
const C_OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(C_OTTO);
const C_TSUMA = makeWoman({ shirt: '#e9b8c8', hair: '#5a3a28' }); S.add(C_TSUMA);
const dots = [0, 1].map(() => { const l = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.6 }); S.add(l); return l; });
const karui = label('家計 かるい', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.5 }); S.add(karui);
const COINS = []; { const cg = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), cm = mat('#e8b84a'); for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(cg, cm); S.add(c); COINS.push(c); } }

// ---------- D：スーパーの駐車場（x=220） ----------
const DX = 220;
flat(40, 30, '#6a6e76', DX, -4, -0.85);
const LOT = []; { const r = rng(62); const cols = ['#f4f4f2', '#1e2228', '#8aa0b8', '#c9c2b0', '#a83a3a', '#5a6a7a'];
  for (let i = 0; i < 18; i++) { const x = DX - 12 + (i % 9) * 3, z = -2 - Math.floor(i / 9) * 7; for (let k = 0; k < 2; k++) { }
    const big = i % 3 !== 1; const c = cols[Math.floor(r() * cols.length)];
    const B = makeCar({ big: true, color: c }), N = makeCar({ color: c });
    for (const v of [B, N]) { v.position.set(x, 0, z); S.add(v); }
    LOT.push({ B, N, big, tm: r() }); }
  for (let i = 0; i <= 9; i++) for (const z of [-2, -9]) { const ln = flat(0.1, 5, '#f4f4f2', DX - 13.5 + i * 3, z, -0.8); } }
const mart = box(30, 6, 6, mat('#e8e2d4')); mart.position.set(DX, 3, -18); S.add(mart);
const martSign = label('もしもマート', { w: 900, size: 110, color: '#fff', bg: 'rgba(200,60,50,.95)', sx: 3.6 }); martSign.position.set(DX, 5.2, -14.8); S.add(martSign);
const shizuka = label('静かに減っていく', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.0 }); S.add(shizuka);
const D_OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(D_OTTO);

const PEOPLE = [OTTO, TSUMA, ...NB, SALES, B_OTTO, B_TSUMA, C_OTTO, C_TSUMA, D_OTTO];
const LABELS = [kieta, gaan, dekai, onaji, otonari, week, mearage, pride, tsukizuki, ...dots, karui, shizuka];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); TICKET.visible = false; sparkA.set(0); sparkP.set(0); sweat.userData.set(0);
  VAN.visible = false; SMALL.visible = false; NEXTCAR.visible = true; VAN.position.set(0, 0, 2.4); VAN.scale.setScalar(1);
  OTTO.position.set(1.7, 0, 4.4); OTTO.rotation.y = -0.5; TSUMA.visible = false; TSUMA.position.set(-1.9, 0, 4.2);
  NB[0].position.set(5.4, 0, 3.4); NB[1].position.set(6.2, 0, 2.9); NB.forEach(p => p.rotation.y = -1.2);
  SALES.position.set(BX + 0.6, 0, -1.0); B_OTTO.position.set(BX + 0.25, 0, 1.0); B_TSUMA.position.set(BX + 1.05, 0, 1.0); B_OTTO.rotation.y = Math.PI; B_TSUMA.rotation.y = Math.PI; BOARD.visible = false;
  C_OTTO.position.set(CX - 0.4, 0, 0.9); C_TSUMA.position.set(CX + 0.45, 0, 0.9); C_OTTO.rotation.y = Math.PI; C_TSUMA.rotation.y = Math.PI; COINS.forEach(c => c.visible = false);
  D_OTTO.visible = false;
  LOT.forEach(o => { o.B.visible = o.big; o.N.visible = !o.big; });
  el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function kneel(p, k, t = 0) { const u = p.userData; u.legs.forEach(l => l.rotation.x = 1.45 * k); p.position.y = -0.62 * k; p.rotation.x = 0.35 * k; u.arms.forEach(a => a.rotation.set(-0.7 * k, 0, 0)); u.head.rotation.x = 0.45 * k + Math.sin(t * 30) * 0.01 * k; }
function slouch(p, k) { p.rotation.x = 0.28 * k; p.userData.head.rotation.x = 0.35 * k; p.userData.arms.forEach(a => a.rotation.set(0.1 * k, 0, 0)); }
const TP = 0.45;
function homeCam(u = 0) { look(lerp(5.2, 4.6, u), lerp(2.7, 2.5, u), lerp(13.0, 12.2, u), 0.5, 1.3, 2.6, 50); }
function shot0(t) { // 0秒＝サムネ：家の駐車場のピカピカの高級ミニバン。0.45秒でポンと消える
  reset(); lift(120); VAN.visible = t < TP; OTTO.rotation.y = -0.6; OTTO.userData.arms[1].rotation.set(-1.2, 0, 0.2);
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.4)); el.flash.style.opacity = t < TP + 0.12 ? 0.45 : 0; OTTO.userData.head.rotation.x = -0.15; say(kieta, t, TP + 0.1, 0.2, 2.1, 4.6, 1.4); }
  if (t < TP) { VAN.scale.setScalar(1 + Math.sin(t * 20) * 0.004); }
  homeCam(ease(clamp(t / 3)));
  return S;
}
function sPajama(t) { // 35歳の夫が、パジャマのまま
  reset(); lift(300); OTTO.position.set(0.6, 0, 3.2); OTTO.rotation.y = 0.1; OTTO.userData.head.rotation.y = Math.sin(t * 2.4) * 0.5; OTTO.userData.arms.forEach(a => a.rotation.set(-0.25, 0, 0));
  look(1.8, 1.9, 8.6, 0.2, 1.3, 2.4, 50);
  return S;
}
function sKuzure(t) { // 空っぽの駐車場で膝から崩れる。
  reset(); lift(300); OTTO.position.set(0.6, 0, 3.2); OTTO.rotation.y = 0.1; kneel(OTTO, easeOut(clamp((t - 0.3) / 0.5)), t); sweat.userData.set(clamp((t - 0.8) / 0.4), t);
  if (t > 1.0) say(gaan, t, 1.0, 1.4, 2.0, 3.2, 0.9);
  look(3.2, 1.8, 9.0, 0.5, 0.9, 2.8, 50);
  return S;
}
function sGokinjo(t) { // ご近所の不満から。
  reset(); lift(0); VAN.visible = true; NB[0].userData.head.rotation.y = -0.2; NB[1].userData.head.rotation.y = 0.15; NB[0].userData.arms[1].rotation.set(-0.6, 0, -0.3);
  lift(120); look(9.4, 2.2, 10.4, 3.4, 1.4, 2.6, 50);
  return S;
}
function sNenshu(t) { // 年収は同じくらいのはずなのに、あの家だけ車がでかい。
  reset(); lift(0); VAN.visible = true; NB[1].userData.arms[1].rotation.set(-1.4, 0, 0.3);
  say(onaji, t, 0.3, 9, 3.6, 2.6, 2.9); if (t > 1.6) say(dekai, t, 1.6, 0, 4.0, 2.6, 3.2);
  const u = ease(clamp(t / 4)); lift(100); look(4.5, lerp(4.0, 4.4, u), lerp(24, 25.5, u), 4.5, 2.0, 2.4, 50);
  return S;
}
function sMonth(t) { // 1日目。車屋で 月々いくら？ と聞くと、
  reset(); lift(0); B_OTTO.userData.arms[1].rotation.set(-1.1, 0, 0.2);
  say(tsukizuki, t, 0.4, BX + 0.0, 2.25, 1.2, 1.3);
  look(BX - 0.6, 2.0, 5.2, BX + 0.4, 1.4, -0.2, 50);
  return S;
}
function sSougaku(t) { // 総額を言われる。
  reset(); lift(0); BOARD.visible = true; const k = easeOut(clamp((t - 0.2) / 0.35)); BOARD.position.set(BX + 0.6, 1.95, -0.62); BOARD.scale.setScalar(0.3 + 0.7 * k);
  SALES.userData.arms[0].rotation.set(-1.5, 0, 0.2); SALES.userData.arms[1].rotation.set(-1.5, 0, -0.2);
  B_OTTO.userData.head.rotation.x = -0.1; if (t > 0.6) { B_OTTO.position.z = 1.0 + 0.15 * easeOut(clamp((t - 0.6) / 0.3)); el.flash.style.opacity = t < 0.7 ? 0.25 : 0; }
  look(BX + 0.6, 1.9, 4.6, BX + 0.6, 1.75, -0.4, 50);
  return S;
}
function sDamaru(t) { // 3日目。総額の数字を見て、夫婦そろって黙る。
  reset(); lift(0); poseSit(C_OTTO); poseSit(C_TSUMA); C_OTTO.position.y += 0.06; C_TSUMA.position.y += 0.06;
  C_OTTO.userData.head.rotation.x = 0.5; C_TSUMA.userData.head.rotation.x = 0.45; C_OTTO.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); C_TSUMA.userData.arms.forEach(a => a.rotation.set(-0.8, 0, 0));
  if (t > 1.2) { say(dots[0], t, 1.2, CX - 0.45, 1.95, 1.0, 0.55); say(dots[1], t, 1.5, CX + 0.5, 1.9, 1.0, 0.55); }
  look(CX + 0.1, 2.6, -2.2, CX, 0.9, 0.5, 52);
  return S;
}
function sWeek(t) { // 1週間後。夫婦が選んだのは、
  reset(); lift(0); SMALL.visible = true; const k = ease(clamp(t / 2.2)); SMALL.position.set(lerp(-14, 0, k), 0, lerp(8.5, 2.6, clamp((k - 0.6) / 0.4)));
  SMALL.rotation.y = k < 0.6 ? Math.PI / 2 : lerp(Math.PI / 2, 0, clamp((k - 0.6) / 0.4));
  OTTO.position.set(1.7, 0, 5.6); OTTO.rotation.y = -0.9; TSUMA.visible = true; TSUMA.position.set(2.5, 0, 5.4); TSUMA.rotation.y = -0.9;
  say(week, t, 0.1, -1.2, 3.3, 2.6, 1.0);
  look(5.5, 2.8, 13, 0.6, 1.2, 3.2, 50);
  return S;
}
function sOtonari(t) { // お隣と同じ普通の車。
  reset(); lift(0); SMALL.visible = true; OTTO.position.set(2.2, 0, 4.4); OTTO.rotation.y = 0.2; TSUMA.visible = true; TSUMA.position.set(3.0, 0, 4.4); TSUMA.rotation.y = -0.2;
  OTTO.position.set(-1.6, 0, 0.6); TSUMA.position.set(-1.0, 0, 0.2); OTTO.rotation.y = TSUMA.rotation.y = Math.PI / 2; NB.forEach(p => p.visible = false);
  say(otonari, t, 0.4, 4.5, 2.9, 2.6, 1.3);
  look(-6.5, 2.8, 12.5, 5.0, 1.0, 2.6, 50);
  return S;
}
function sLot(t, d) { // スーパーの駐車場から、でかい車が静かに減っていく。
  reset(); lift(0); LOT.forEach(o => { if (!o.big) return; const gone = t > 0.4 + o.tm * (d - 1.2); o.B.visible = !gone; o.N.visible = gone; });
  if (t > 1.2) say(shizuka, t, 1.2, DX, 5.0, -4, 2.2);
  look(DX + 2, 9, 13, DX, 0.8, -5, 50);
  return S;
}
function sMiwake(t) { // どの家の車か、もう見分けがつかない。
  reset(); lift(0); LOT.forEach(o => { o.B.visible = false; o.N.visible = true; }); D_OTTO.visible = true; D_OTTO.position.set(DX + 1.5, 0, 1.6); D_OTTO.rotation.y = Math.PI; D_OTTO.userData.head.rotation.y = Math.sin(t * 2) * 0.6;
  const u = ease(clamp(t / 3.5)); look(DX + lerp(4, 2, u), lerp(4.5, 6, u), lerp(9, 11, u), DX, 0.8, -4, 50);
  return S;
}
function sKizuku(t) { // 夫は気づく。
  reset(); lift(0); SMALL.visible = true; OTTO.position.set(1.6, 0, 4.6); OTTO.rotation.y = -0.3; OTTO.userData.head.rotation.x = 0.15;
  const u = ease(clamp(t / 2.5)); look(lerp(3.2, 2.8, u), 1.9, lerp(8.2, 7.4, u), 1.4, 1.6, 4.4, 46);
  return S;
}
function sMesen(t) { // 欲しかったのは車ではなく、見上げられる目線だった。（回想：運転席の高い位置から見下ろす夫と、見上げるご近所）
  reset(); lift(0); VAN.visible = true; NEXTCAR.visible = true;
  OTTO.position.set(1.4, 0, 4.3); OTTO.rotation.y = 0.5; OTTO.rotation.x = -0.12; OTTO.userData.head.rotation.x = -0.3; OTTO.userData.arms[0].rotation.set(-0.2, 0, 0.7); OTTO.userData.arms[1].rotation.set(-0.2, 0, -0.7);
  NB[0].position.set(3.4, 0, 5.4); NB[1].position.set(4.1, 0, 4.8); NB.forEach(p => { p.rotation.y = -1.4; p.userData.head.rotation.x = -0.4; });
  if (t > 1.3) say(mearage, t, 1.3, 1.6, 3.4, 3.6, 1.9);
  lift(200); look(6.2, 1.0, 11.0, 1.6, 1.9, 3.2, 50);
  hemi.intensity = 1.05;
  return S;
}
function sKarui(t) { // 家計は軽くなった。
  reset(); lift(0); poseSit(C_OTTO); poseSit(C_TSUMA); C_OTTO.position.y += 0.06; C_TSUMA.position.y += 0.06; C_TSUMA.userData.arms[1].rotation.set(-1.0, 0, 0);
  COINS.forEach((c, i) => { c.visible = true; const k = clamp((t - 0.2 - i * 0.06) / 0.4); c.position.set(CX - 0.3 + (i % 6) * 0.12, 0.76 + Math.floor(i / 6) * 0.032 + (1 - easeOut(k)) * 1.2, 0.1); c.visible = k > 0; });
  if (t > 1.0) say(karui, t, 1.0, CX, 2.35, 0.2, 1.4);
  look(CX + 0.1, 2.4, -2.4, CX, 0.95, 0.4, 50);
  return S;
}
function sSesuji(t) { // 夫の背すじも、少し丸くなった。
  reset(); lift(0); SMALL.visible = true; const z = 4.6 + t * 0.5; OTTO.position.set(2.2, 0, z); OTTO.rotation.y = 0; const ph = t * 6; OTTO.userData.legs[0].rotation.x = Math.sin(ph) * 0.35; OTTO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.35;
  slouch(OTTO, easeOut(clamp((t - 0.4) / 1.0)));
  lift(220); look(6.4, 1.9, z + 3.2, 2.2, 1.15, z, 46);
  return S;
}
function sKekka(t) { // 結果：残クレが消えて、夫は5年分のプライドを手放した。
  reset(); lift(260); SMALL.visible = true; OTTO.position.set(1.8, 0, 4.6); OTTO.rotation.y = -0.3; slouch(OTTO, 1);
  pride.position.set(1.8, 2.9, 4.6); pride.visible = t < 2.2; if (t < 2.2) pop(pride, t, 0.3, 0.3, 1.9);
  if (t > 2.2) { sparkP.set(clamp((t - 2.2) / 1.6)); }
  const u = ease(clamp(t / 5.5)); look(lerp(4.0, 5.0, u), lerp(2.2, 2.6, u), lerp(9.6, 11.0, u), 1.4, 1.5, 3.6, 50);
  return S;
}
function sSeki(t) { // 残クレは、ご近所の一番高い席を、5年だけ借りる指定席券
  reset(); lift(200); VAN.visible = false; NEXTCAR.visible = true; SMALL.visible = true;
  OTTO.position.set(1.8, 0, 4.6); OTTO.rotation.y = -0.3; slouch(OTTO, 1); OTTO.userData.head.rotation.x = -0.1;
  TICKET.visible = true; const k = easeOut(clamp((t - 0.3) / 0.4)); TICKET.position.set(0.4, 3.6 + (1 - k) * 0.6, 3.0); TICKET.scale.set(2.6 * k, 2.6 * 460 / 1024 * k, 1);
  look(3.4, 2.4, 10.0, 0.9, 2.2, 3.2, 50);
  return S;
}
function sKamo(t) { // だったのかもしれない。
  reset(); lift(200); SMALL.visible = true; OTTO.position.set(1.8, 0, 4.6); OTTO.rotation.y = -0.3; slouch(OTTO, 1);
  TICKET.visible = true; TICKET.position.set(0.4, 3.6 + t * 0.25, 3.0); TICKET.material.opacity = clamp(1 - t / 2.4); TICKET.scale.set(2.6, 2.6 * 460 / 1024, 1);
  const u = ease(clamp(t / 2.5)); look(lerp(3.4, 4.0, u), 2.4, lerp(10.0, 10.8, u), 0.9, 2.0, 3.2, 50);
  return S;
}
function sAsk(t) { // 車、見栄で選んだことある？（冒頭と同じ構図。駐車場には普通の車）
  reset(); lift(260); TICKET.material.opacity = 1; SMALL.visible = true; OTTO.rotation.y = -0.6;
  homeCam(0);
  return S;
}

const NARR = { '35歳': 'さんじゅうごさい', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '月々': 'つきづき', '総額': 'そうがく', '残クレ': 'ざんクレ', '結果：': '結果、', '5年分': 'ごねんぶん', '5年': 'ごねん', '指定席券': 'していせきけん', '見分け': 'みわけ', '背すじ': 'せすじ', '一番': 'いちばん', '目線': 'めせん', '膝': 'ひざ', '家計': 'かけい' };
const P = planTimes([
  ['35歳の夫が、パジャマのまま', sPajama],
  ['空っぽの駐車場で<br>膝から崩れる。', sKuzure],
  ['ご近所の不満から。', sGokinjo],
  ['年収は同じくらいのはずなのに、<br>あの家だけ車がでかい。', sNenshu],
  ['1日目。車屋で 月々いくら？<br>と聞くと、', sMonth],
  ['総額を言われる。', sSougaku],
  ['3日目。総額の数字を見て、<br>夫婦そろって黙る。', sDamaru],
  ['1週間後。夫婦が選んだのは、', sWeek],
  ['お隣と同じ普通の車。', sOtonari],
  ['スーパーの駐車場から、<br>でかい車が静かに減っていく。', sLot],
  ['どの家の車か、<br>もう見分けがつかない。', sMiwake],
  ['夫は気づく。', sKizuku],
  ['欲しかったのは車ではなく、<br>見上げられる目線だった。', sMesen],
  ['家計は軽くなった。', sKarui],
  ['夫の背すじも、少し丸くなった。', sSesuji],
  ['結果：残クレが消えて、夫は<br>5年分のプライドを手放した。', sKekka],
  ['残クレは、ご近所の<br>一番高い席を、', sSeki],
  ['5年だけ借りる指定席券', (t) => sSeki(t + 1.5)],
  ['だったのかもしれない。', sKamo],
  ['車、見栄で選んだことある？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0660',
    v2: true,
    tt: 'main',
    hookLine: '家の駐車場のピカピカの高級ミニバンが、ポンと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも残クレが消えたら？',
    titleHtml: 'もしも残クレが<br>消えたら？',
    mood: 'tension', seed: 660, hits: [TP, P.at(15), P.at(17)], risers: [P.at(11)], impacts: [P.at(1, 0.8), P.at(5, 0.6), P.at(9, 0.4), P.at(12, 1.3), P.at(15, 2.2)],
    sfx: [[TP, 'poof'], [P.at(1, 0.8), 'whoosh'], [P.at(5, 0.6), 'alarm'], [P.at(6, 1.2), 'meter', 0.3], [P.at(7, 0.2), 'whoosh'], [P.at(9, 0.4), 'poof'], [P.at(13, 0.2), 'bubble'], [P.at(15, 2.2), 'poof'], [P.at(17, 0.1), 'bubble']],
    narr: NARR,
    ask: '車、見栄で選んだことある？',
    caption: 'もしも残クレが消えたら？\n\n35歳の夫が、パジャマのまま空っぽの駐車場で膝から崩れる。\nご近所の不満から。年収は同じくらいのはずなのに、あの家だけ車がでかい。\n1日目。車屋で月々いくら？と聞くと、総額を言われる。\n3日目。総額の数字を見て、夫婦そろって黙る。\n1週間後。夫婦が選んだのは、お隣と同じ普通の車。\nスーパーの駐車場から、でかい車が静かに減っていく。どの家の車か、もう見分けがつかない。\n夫は気づく。欲しかったのは車ではなく、見上げられる目線だった。\n家計は軽くなった。夫の背すじも、少し丸くなった。\n\n結果：残クレが消えて、夫は5年分のプライドを手放した。\n残クレは、ご近所の一番高い席を、5年だけ借りる指定席券だったのかもしれない。\n\n車、見栄で選んだことある？ コメントで教えて。\n\n※風刺ネタです。残クレが消えるのは、もしもの設定です。登場する人物・車・店は架空です',
    hashtags: ['もしもラボ', 'もしも', '残クレ', 'ミニバン', '見栄'],
    endStats: [['消えたもの', '残クレ', 'もしもの設定'], ['夫婦が選んだのは', 'お隣と同じ普通の車', ''], ['残クレの正体', '5年だけの指定席券', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
