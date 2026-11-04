import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeDoc, makeMark } from '../scenes/hanko.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしも自転車の違反が全部罰金になったら？（皮肉回・台本 S30・図星／大人の本音）
// 2026/11/03 ゆうと承認。元ネタ：Togetter・ガルちゃんで燃える 歩道の電動ママチャリが怖い・自転車の青切符 の話
// 数字（裏取り済み）：自転車の交通反則通告制度（青切符）2026年4月1日施行・16歳以上が対象。
//  反則金 ながらスマホ（携帯電話使用等・保持）1万2,000円、歩道通行など（通行区分違反）6,000円、信号無視 6,000円（警察庁・大阪府警察 自転車の青切符のページ）
// 全部カメラで見つかる は もしもの設定（いまは警察官が取り締まる。歩道は歩行者を危険にさらした場合などが主な対象）
// 自転車・車は架空（実在のメーカーの見た目にしない）

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff';

const S = new THREE.Scene();
S.background = new THREE.Color('#9fc6e8'); S.fog = new THREE.Fog(0xb8d4ec, 50, 180);
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a7a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1); sun.position.set(10, 20, 14); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#8a9a7a', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }

// ---------- 道（x 方向）：車道 z 1.2〜6、歩道 z -1.6〜1.2、建物 z<-2 ----------
const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 5), mat('#5a5e66', { depthWrite: false })); road.rotation.x = -Math.PI / 2; road.position.set(60, 0.01, 3.6); road.renderOrder = -0.8; S.add(road);
const walkM = mat('#c9c2b0');
const side = box(400, 0.14, 2.8, walkM); side.position.set(60, 0.07, -0.2); S.add(side);
const curb = box(400, 0.16, 0.16, mat('#e6e2d8')); curb.position.set(60, 0.08, 1.22); S.add(curb);
for (let i = 0; i < 60; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.12), mat('#f2f2f2', { depthWrite: false })); l.rotation.x = -Math.PI / 2; l.position.set(-60 + i * 4, 0.02, 3.6); l.renderOrder = -0.7; S.add(l); }
const edge = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.1), mat('#f2f2f2', { depthWrite: false })); edge.rotation.x = -Math.PI / 2; edge.position.set(60, 0.02, 1.6); edge.renderOrder = -0.7; S.add(edge);
{ const r = rng(4); const cols = ['#e8dcc8', '#d0d8e4', '#f0d0c0', '#d8e8d0', '#e0d0e8', '#f4e8c0']; for (let i = 0; i < 40; i++) { const h = 3 + r() * 5, w = 3 + r() * 2; const b = box(w, h, 3, mat(cols[i % 6])); b.position.set(-40 + i * 4.6, h / 2, -3.4); S.add(b); for (let k = 0; k < 2; k++) { const wn = box(w * 0.7, 0.6, 0.05, mat('#9fc6e8')); wn.position.set(b.position.x, 1.4 + k * 1.4, -1.88); if (h > 1.4 + k * 1.4 + 0.6) S.add(wn); } } }

// 自転車（+x が前）
function makeBike({ color = '#c8c0b0', mama = false } = {}) {
  const g = new THREE.Group(); const fm = mat(color), wm = mat('#22242a');
  const wheels = [-0.52, 0.52].map(x => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 24), wm); w.position.set(x, 0.35, 0); g.add(w); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), mat('#9aa0aa')); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.35, 0); g.add(hub); return w; });
  const down = box(0.9, 0.06, 0.06, fm); down.position.set(0, 0.5, 0); down.rotation.z = 0.35; g.add(down);
  const seatPost = box(0.06, 0.45, 0.06, fm); seatPost.position.set(-0.22, 0.65, 0); g.add(seatPost);
  const seat = box(0.26, 0.06, 0.16, mat('#2a2a30')); seat.position.set(-0.24, 0.88, 0); g.add(seat);
  const fork = box(0.06, 0.6, 0.06, fm); fork.position.set(0.48, 0.65, 0); fork.rotation.z = -0.2; g.add(fork);
  const bar = box(0.06, 0.06, 0.5, mat('#9aa0aa')); bar.position.set(0.42, 1.0, 0); g.add(bar);
  if (mama) { const bask = box(0.32, 0.22, 0.36, mat('#e8e8e8')); bask.position.set(0.66, 0.88, 0); g.add(bask); const cs = box(0.34, 0.3, 0.34, mat('#3a6ab2')); cs.position.set(-0.6, 0.95, 0); g.add(cs); const bat = box(0.1, 0.22, 0.1, mat('#3a3f4e')); bat.position.set(-0.3, 0.6, 0); g.add(bat); }
  g.userData.wheels = wheels; return g;
}
function ride(p, t, sp = 10) { poseSit(p); const s = Math.sin(t * sp) * 0.45; p.userData.legs[0].rotation.x = -1.05 + s; p.userData.legs[1].rotation.x = -1.05 - s; p.userData.arms.forEach(a => a.rotation.x = -1.15); }
function makeRider(kind, i = 0) {
  const g = new THREE.Group(); const bike = makeBike({ mama: kind === 'mama', color: kind === 'mama' ? '#d8c8a8' : '#7a8aa8' }); g.add(bike);
  const p = kind === 'mama' ? makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }) : makeMan({ shirt: ['#4f6a8f', '#a8c0a0', '#e8a060'][i % 3], hair: '#1d1a19' });
  p.rotation.y = Math.PI / 2; p.position.set(-0.22, 0.02, 0); g.add(p);
  if (kind === 'mama') { const kid = makeMan({ shirt: '#f2c14e', hair: '#2a1e1a', scale: 0.42 }); kid.rotation.y = Math.PI / 2; kid.position.set(-0.6, 0.72, 0); poseSit(kid); kid.position.y = 0.9; g.add(kid); g.userData.kid = kid; }
  let ph = null; if (kind === 'phone') { ph = box(0.1, 0.18, 0.02, new THREE.MeshBasicMaterial({ color: '#9fd0ff' })); ph.position.set(0.0, -0.62, 0.06); p.userData.arms[1].add(ph); }
  g.userData = { ...g.userData, p, bike, ph }; return g;
}
function rideT(r, t, sp = 10) { ride(r.userData.p, t, sp); r.userData.bike.userData.wheels.forEach(w => w.rotation.z = -t * sp * 0.8); if (r.userData.ph) { r.userData.p.userData.arms[1].rotation.x = -1.7; r.userData.p.userData.head.rotation.x = 0.35; } }
// 車（+x が前）
function makeCar(color = '#e8e8ee') { const g = new THREE.Group(); const b = box(3.6, 0.7, 1.7, mat(color)); b.position.y = 0.55; g.add(b); const c = box(2.0, 0.6, 1.5, mat(color, { transparent: true, opacity: 0.45, depthWrite: false })); c.position.set(-0.2, 1.15, 0); c.renderOrder = 3; g.add(c); const ws = box(0.05, 0.5, 1.4, mat('#2a3440')); ws.position.set(0.81, 1.15, 0); g.add(ws); for (const x of [-1.15, 1.15]) for (const z of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), mat('#22242a')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.32, z); g.add(w); } const drv = makeMan({ shirt: '#59606e', hair: '#1d1a19', scale: 0.7 }); drv.rotation.y = Math.PI / 2; drv.position.set(0.0, 0.3, 0.35); poseSit(drv); drv.position.y = 0.5; g.add(drv); g.userData.drv = drv; return g; }
// 空のカメラ
function makeSkyCam() { const g = new THREE.Group(); const b = box(0.5, 0.36, 0.4, mat('#2a2e3a')); g.add(b); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 14), mat('#15161c')); lens.rotation.x = Math.PI / 2; lens.position.set(0, -0.05, 0.28); g.add(lens); const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); led.position.set(0.17, 0.12, 0.21); g.add(led); for (const s of [-1, 1]) { const arm = box(0.5, 0.04, 0.06, mat('#5a5e66')); arm.position.set(s * 0.45, 0.1, 0); g.add(arm); const rot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 14), mat('#9aa0aa', { transparent: true, opacity: 0.6 })); rot.position.set(s * 0.7, 0.14, 0); g.add(rot); } return g; }

const MAMA = makeRider('mama'); S.add(MAMA);
const YOUNG = makeRider('phone', 1); S.add(YOUNG);
const BIKES = [0, 1, 2].map(i => { const r = makeRider(i === 1 ? 'mama' : 'man', i); S.add(r); return r; });
const CAMS = [0, 1, 2].map(() => { const c = makeSkyCam(); S.add(c); return c; });
const PEDS = [makeWoman({ shirt: '#a8b8e0', hair: '#9a9a9a', scale: 0.92 }), makeMan({ shirt: '#7a8a6a', hair: '#9a9a9a' }), makeWoman({ shirt: '#f2b8a0', hair: '#3a2620' })]; PEDS.forEach(p => S.add(p));
const CARS = [makeCar('#e8e8ee'), makeCar('#5a6a8a'), makeCar('#b84a4a')]; CARS.forEach(c => S.add(c));
const flashBox = label('違反', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.95 }); S.add(flashBox);
const frame = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: '#ff3a3a', depthTest: false, transparent: true }); for (const [w, h, x, y] of [[2.2, 0.06, 0, 0.9], [2.2, 0.06, 0, -0.9], [0.06, 1.8, -1.1, 0], [0.06, 1.8, 1.1, 0]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b.position.set(x, y, 0); b.renderOrder = 9; frame.add(b); } } S.add(frame);
const hikare = label('ひかれそう！', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 1.3 }); S.add(hikare);
const chirin = label('チリンチリン', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(chirin);
const zenbu = label('全部カメラで', { w: 768, size: 110, color: '#fff', bg: 'rgba(40,46,60,.96)', sx: 1.4 }); S.add(zenbu);
const bakkin = makeMark('罰金', { sx: 1.0 }); S.add(bakkin);
const eight = label('朝8時', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.95 }); S.add(eight);
const NOTICE = makeDoc({ title: '罰金の通知', rows: ['違反', '金額'], head: '#c8242c', w: 1.3, h: 1.0 }); S.add(NOTICE);
const yatta = label('静かになった！', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.75 }); S.add(yatta);
const ira = label('イライラ', { w: 512, size: 120, color: '#fff', bg: 'rgba(200,60,40,.96)', sx: 1.0 }); S.add(ira);
const HONK = [0, 1, 2].map(() => { const l = label('プップー！', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 1.2 }); S.add(l); return l; });
const iru = label('歩道にいたからじゃない', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.3 }); S.add(iru);
const ANGER = [0, 1, 2].map(() => { const l = label('ムカッ', { w: 512, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.9 }); S.add(l); return l; });
const sweatD = makeSweat(); CARS[0].userData.drv.userData.head.add(sweatD);

// 法律（x=300、別の場所）
const LX = 300;
const lfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); lfloor.rotation.x = -Math.PI / 2; lfloor.position.set(LX, 0.02, -1); lfloor.renderOrder = -0.8; S.add(lfloor);
const LAW = makeDoc({ title: '自転車の青切符', rows: ['施行', '対象', 'ながらスマホ'], head: '#3a6ab2', w: 2.0, h: 1.7 }); LAW.position.set(LX, 2.0, -1); S.add(LAW);
const lawBg = box(30, 20, 0.2, mat('#2a2e3a')); lawBg.position.set(LX, 5, -6); S.add(lawBg);

function placePeds() { PEDS.forEach((p, i) => { p.position.set(1.2 + i * 1.3, 0.14, -0.4 + (i % 2) * 0.5); p.rotation.y = -Math.PI / 2; }); }
function reset() {
  [MAMA, YOUNG, ...BIKES].forEach(r => { r.visible = true; r.rotation.set(0, 0, 0); });
  PEDS.forEach(p => { poseReset(p); p.visible = true; }); placePeds();
  MAMA.position.set(-2, 0.14, 0.0); YOUNG.position.set(-30, 0.14, 0.2); BIKES.forEach((b, i) => b.position.set(-40 - i * 3, 0.14, 0));
  CARS.forEach((c, i) => { c.position.set(-60 - i * 6, 0, 4.4); c.visible = true; poseSit(c.userData.drv); c.userData.drv.position.y = 0.5; c.userData.drv.userData.arms.forEach(a => a.rotation.x = -1.2); });
  CAMS.forEach(c => c.visible = false); frame.visible = false;
  [flashBox, hikare, chirin, zenbu, bakkin, eight, yatta, ira, iru, ...HONK, ...ANGER].forEach(l => l.visible = false); NOTICE.visible = false;
  NOTICE.userData.fill(0, ''); NOTICE.userData.fill(1, ''); LAW.userData.fill(0, ''); LAW.userData.fill(1, ''); LAW.userData.fill(2, '');
  sweatD.userData.set(0); el.flash.style.opacity = 0; S.background.set('#9fc6e8');
}
const TP = 0.45;
function shootFlash(t, t0) { el.flash.style.opacity = t > t0 && t < t0 + 0.12 ? 0.55 : 0; }
function shot0(t) { // 0秒＝サムネ：歩道を走る電動ママチャリに、空からカメラのフラッシュがパシャッ
  reset(); lift(0); MAMA.position.set(-0.4 + t * 1.6, 0.14, 0.0); rideT(MAMA, t, 12);
  const c = CAMS[0]; c.visible = true; c.position.set(MAMA.position.x + 0.9, 2.55 + Math.sin(t * 3) * 0.05, 0.9); c.rotation.set(0.6, -0.3, 0);
  shootFlash(t, TP); if (t > TP) { frame.visible = true; frame.position.set(MAMA.position.x, 1.0, 0.3); flashBox.position.set(MAMA.position.x - 0.5, 2.15, 0.3); pop(flashBox, t, TP, 0.2, 0.75); }
  const u = ease(clamp(t / 3.0)); look(MAMA.position.x + lerp(1.4, 1.1, u), 1.9, lerp(5.2, 4.9, u), MAMA.position.x + 0.2, 1.3, 0.0, 52);
  return S;
}
function shot1(t) { // 歩く人たちの不満から。
  reset(); lift(60); PEDS.forEach((p, i) => walk(p, t + i, 6, 0.35)); PEDS.forEach(p => p.position.x -= t * 0.5);
  look(3.0, 2.1, 7.6, 2.4, 1.15, -0.2, 52);
  return S;
}
function shot2(t) { // 歩道で後ろからベルを鳴らされて、
  reset(); lift(60); PEDS.forEach((p, i) => { p.position.x -= t * 0.5; walk(p, t + i, 6, 0.35); });
  MAMA.position.set(-3.0 + t * 1.4, 0.14, 0.0); MAMA.rotation.y = 0; rideT(MAMA, t, 12); // 歩行者の後ろから
  chirin.position.set(MAMA.position.x + 0.9, 2.35, 0.0); pop(chirin, t, 0.5, 0.2, 1.3);
  look(1.6, 2.1, 7.6, 0.9, 1.15, -0.2, 52);
  return S;
}
function shot3(t) { // ひかれそうになる
  reset(); lift(60); placePeds(); PEDS.forEach(p => { p.position.x -= 1.2; });
  const P = PEDS[0]; P.rotation.y = 0.4; P.userData.arms.forEach(a => a.rotation.set(-0.4, 0, 0)); P.userData.arms[0].rotation.z = 0.9; P.userData.arms[1].rotation.z = -0.9; P.position.z = -0.9;
  MAMA.position.set(-1.2 + t * 2.2, 0.14, 0.2); rideT(MAMA, t, 14);
  hikare.position.set(P.position.x, 2.35, P.position.z); pop(hikare, t, 0.2, 0.2, 1.25);
  look(0.6, 2.0, 6.6, 0.2, 1.15, -0.3, 52);
  return S;
}
function shot4(t) { // ある日、自転車の違反は全部カメラで見つかって、
  reset(); lift(80); BIKES.forEach((b, i) => { b.position.set(-1.5 + i * 2.6 + t * 1.0, 0.14, -0.1); rideT(b, t + i, 10); });
  CAMS.forEach((c, i) => { c.visible = t > 0.4 + i * 0.4; c.position.set(BIKES[i].position.x + 0.3, 3.4 + Math.sin(t * 3 + i) * 0.06, 0.8); c.rotation.set(0.7, 0, 0); });
  zenbu.position.set(BIKES[1].position.x, 4.3, 0.6); pop(zenbu, t, 1.4, 0.3, 1.35);
  el.flash.style.opacity = [0.6, 1.0, 1.4].some(x => t > x && t < x + 0.08) ? 0.35 : 0;
  look(BIKES[1].position.x + 0.6, 2.6, 8.0, BIKES[1].position.x, 2.0, 0.0, 52);
  return S;
}
function shot5(t) { // 罰金になった
  reset(); lift(80); BIKES.forEach((b, i) => { b.position.set(2.4 + i * 2.6 + 1.0 * 3.0, 0.14, -0.1); rideT(b, 3 + i, 0); });
  CAMS.forEach((c, i) => { c.visible = true; c.position.set(BIKES[i].position.x + 0.3, 3.4, 0.8); c.rotation.set(0.7, 0, 0); });
  bakkin.position.set(BIKES[1].position.x, 2.2, 0.6); pop(bakkin, t, 0.2, 0.2, 1.1); shootFlash(t, 0.2);
  look(BIKES[1].position.x + 0.6, 2.6, 8.0, BIKES[1].position.x, 2.0, 0.0, 52);
  return S;
}
function youngCam(d) { look(YOUNG.position.x + 1.8, 1.9, 4.6, YOUNG.position.x, 1.45, 0.2, 52); }
function shot6(t) { // ながらスマホは1万2,000円
  reset(); lift(60); YOUNG.position.set(-30 + t * 0.9, 0.14, 0.2); rideT(YOUNG, t, 9);
  youngCam(); setTop('ながらスマホ', '1万2,000円', fade(t, 0.4, 3.2, 0.25), RED);
  return S;
}
function shot7(t) { // 歩道を飛ばすと6,000円
  reset(); lift(60); MAMA.position.set(-6 + t * 3.0, 0.14, 0.0); rideT(MAMA, t, 16);
  look(MAMA.position.x + 2.4, 1.9, 5.6, MAMA.position.x, 1.4, 0.0, 52);
  setTop('歩道を飛ばすと', '6,000円', fade(t, 0.3, 2.5, 0.25), RED);
  return S;
}
function shot8(t) { // 朝8時。歩道を急ぐママチャリに、
  reset(); lift(60); MAMA.position.set(-2 + t * 2.6, 0.14, 0.0); rideT(MAMA, t, 16);
  eight.position.set(MAMA.position.x, 2.6, 0.0); pop(eight, t, 0.1, 0.25, 0.95);
  const c = CAMS[0]; c.visible = true; c.position.set(MAMA.position.x + 0.6, 3.2, 0.8); c.rotation.set(0.7, -0.3, 0); shootFlash(t, 1.3);
  look(MAMA.position.x + 2.0, 1.9, 5.4, MAMA.position.x, 1.55, 0.0, 52);
  return S;
}
function shot9(t) { // 罰金の通知が届く
  reset(); lift(60); MAMA.position.set(3.0, 0.14, 0.0); rideT(MAMA, 0, 0); MAMA.userData.p.userData.head.rotation.x = 0.3;
  NOTICE.visible = true; NOTICE.position.set(3.0, 2.05, 0.4); NOTICE.userData.fill(0, '歩道'); NOTICE.userData.fill(1, t > 0.6 ? '6,000円' : '');
  NOTICE.scale.setScalar(easeOut(clamp(t / 0.3)));
  look(4.2, 2.0, 5.2, 3.0, 1.6, 0.0, 52);
  return S;
}
function shot10(t) { // スマホを見ながらこぐ若者にも、1万2,000円
  reset(); lift(60); YOUNG.position.set(-30 + t * 0.9, 0.14, 0.2); rideT(YOUNG, t, 9);
  const c = CAMS[1]; c.visible = true; c.position.set(YOUNG.position.x + 0.5, 3.0, 0.9); c.rotation.set(0.7, -0.3, 0); shootFlash(t, 1.4);
  if (t > 1.4) { bakkin.position.set(YOUNG.position.x, 2.4, 0.4); pop(bakkin, t, 1.4, 0.2, 0.85); }
  youngCam(); setTop('ながらスマホ', '1万2,000円', fade(t, 1.5, 3.4, 0.25), RED);
  return S;
}
function shot11(t) { // 自転車たちは、一斉に車道へ
  reset(); lift(80); const k = ease(clamp((t - 0.3) / 1.6));
  [MAMA, ...BIKES].forEach((b, i) => { b.position.set(-2 + i * 2.4 + t * 1.2, 0.14 * (1 - k), lerp(0.0, 2.2, k)); b.rotation.y = -0.5 * Math.sin(k * Math.PI); rideT(b, t + i, 10); });
  look(3.5, 3.4, 9.0, 2.4, 1.0, 1.0, 52);
  return S;
}
function shot12(t) { // 歩道は静かになった。歩く人は大喜び
  reset(); lift(60); placePeds(); PEDS.forEach((p, i) => { p.rotation.y = 0.3; if (t > 0.8) { p.userData.arms[0].rotation.z = -2.5 + Math.sin(t * 8 + i) * 0.2; p.userData.arms[1].rotation.z = 2.5 - Math.sin(t * 8 + i) * 0.2; } });
  [MAMA, ...BIKES].forEach((b, i) => { b.position.set(-4 + i * 2.6 + t * 1.2, 0, 2.2); rideT(b, t + i, 10); });
  yatta.position.set(2.6, 2.5, -0.3); pop(yatta, t, 1.0, 0.3, 1.7);
  look(3.0, 2.0, 6.4, 2.6, 1.3, 0.0, 52);
  return S;
}
function roadScene(t, speed = 1.0) {
  [MAMA, ...BIKES].forEach((b, i) => { b.position.set(2 + i * 2.6 + t * 1.0, 0, 2.2); rideT(b, t + i, 10); });
  CARS.forEach((c, i) => { c.position.set(-2.4 - i * 4.6 + t * 1.0, 0, 3.0); c.userData.drv.userData.head.rotation.x = -0.1; });
}
function shot13(t) { // ところが今度は、
  reset(); lift(80); roadScene(t);
  look(CARS[0].position.x + 4.5, 2.4, 8.4, CARS[0].position.x + 2.6, 1.2, 2.4, 52);
  return S;
}
function shot14(t) { // 車道のドライバーがイライラし始める
  reset(); lift(60); roadScene(t); const D = CARS[0].userData.drv; D.userData.head.rotation.z = Math.sin(t * 10) * 0.1;
  D.userData.arms.forEach(a => a.rotation.x = -1.2 + Math.sin(t * 12) * 0.15); sweatD.userData.set(1, t);
  ira.position.set(CARS[0].position.x + 0.1, 2.2, 3.0); pop(ira, t, 0.6, 0.25, 1.0);
  look(CARS[0].position.x + 3.2, 2.4, 8.6, CARS[0].position.x + 0.6, 1.2, 3.0, 52);
  return S;
}
function shot15(t) { // 前を走る自転車に、クラクションを鳴らしまくる
  reset(); lift(80); roadScene(t);
  HONK.forEach((l, i) => { l.position.set(CARS[0].position.x + 1.4 + i * 0.5, 2.0 + i * 0.45, 3.0); pop(l, t, 0.3 + i * 0.7, 0.2, 1.0); });
  look(CARS[0].position.x + 3.4, 3.0, 12.5, CARS[0].position.x + 2.6, 1.1, 2.6, 52);
  return S;
}
function shot16(t) { // 自転車が嫌いだったのは、歩道にいたからじゃなかった
  reset(); lift(80); roadScene(t); CARS[0].userData.drv.userData.head.rotation.x = 0.2;
  iru.position.set(CARS[0].position.x + 1.4, 2.6, 3.0); pop(iru, t, 0.8, 0.3, 2.0);
  look(CARS[0].position.x + 2.6, 2.4, 9.0, CARS[0].position.x + 1.4, 1.3, 2.6, 52);
  return S;
}
function shot17(t) { // 結果：自転車を責めていた人は、車道に来た自転車にもっと怒った
  reset(); lift(80); roadScene(t);
  ANGER.forEach((l, i) => { l.position.set(CARS[i].position.x + 0.2, 2.1, 3.0); pop(l, t, 0.4 + i * 0.3, 0.2, 0.9); });
  HONK.forEach((l, i) => { l.position.set(CARS[i].position.x + 1.2, 2.7, 3.0); l.visible = Math.floor(t * 2 + i) % 2 === 0 && t > 1.2; l.userData.size(1.0); });
  const u = ease(clamp(t / 5.9)); look(CARS[1].position.x + 2.0, lerp(4.0, 6.0, u), lerp(10.0, 12.5, u), CARS[1].position.x + 2.0, 0.8, 1.6, 52);
  setTop('結果', 'もっと怒った', fade(t, 0.3, 5.8, 0.25), RED);
  return S;
}
function shot18(t) { // 実は今年4月から、自転車にも本当に反則金が始まっている
  reset(); lift(150); S.background.set('#2a2e3a');
  LAW.userData.fill(0, '2026年4月1日'); LAW.userData.fill(1, t > 1.2 ? '16歳以上' : ''); LAW.userData.fill(2, t > 2.4 ? '1万2,000円' : '');
  look(LX, 2.0, 4.2, LX, 2.0, -1, 50);
  setTop('自転車の反則金', '2026年4月〜', fade(t, 0.4, 4.6, 0.25), BLUE);
  return S;
}
function shot19(t) { // 質問。最後は冒頭と同じ構図
  reset(); lift(200); MAMA.position.set(-0.4 + t * 0.3, 0.14, 0.0); rideT(MAMA, t, 12);
  const c = CAMS[0]; c.visible = true; c.position.set(MAMA.position.x + 0.9, 2.55 + Math.sin(t * 3) * 0.05, 0.9); c.rotation.set(0.6, -0.3, 0);
  frame.visible = true; frame.position.set(MAMA.position.x, 1.0, 0.3);
  look(MAMA.position.x + 1.1, 1.9, 4.9, MAMA.position.x + 0.2, 1.3, 0.0, 52);
  return S;
}

const SUBS = [
  [3.0, 5.4, '歩く人たちの<br>不満から。'],
  [5.5, 8.0, '歩道で後ろから<br>ベルを鳴らされて、'],
  [8.1, 9.9, 'ひかれそうになる。'],
  [10.0, 13.4, 'ある日、自転車の違反は<br>全部カメラで見つかって、'],
  [13.5, 15.0, '罰金になった。'],
  [15.0, 18.2, 'ながらスマホは<br>1万2,000円。'],
  [18.3, 20.8, '歩道を飛ばすと<br>6,000円。'],
  [20.9, 23.1, '朝8時。歩道を急ぐ<br>ママチャリに、'],
  [23.2, 24.8, '罰金の通知が届く。'],
  [24.9, 28.4, 'スマホを見ながらこぐ<br>若者にも、1万2,000円。'],
  [28.5, 31.0, '自転車たちは、<br>一斉に車道へ。'],
  [31.1, 34.6, '歩道は静かになった。<br>歩く人は大喜び。'],
  [34.7, 36.6, 'ところが今度は、'],
  [36.7, 39.4, '車道のドライバーが<br>イライラし始める。'],
  [39.5, 42.9, '前を走る自転車に、<br>クラクションを鳴らしまくる。'],
  [43.0, 46.6, '自転車が嫌いだったのは、<br>歩道にいたからじゃなかった。'],
  [46.7, 49.2, '結果：自転車を<br>責めていた人は、'],
  [49.3, 52.6, '車道に来た自転車に<br>もっと怒った。'],
  [52.7, 54.4, '実は今年4月から、'],
  [54.5, 57.4, '自転車にも本当に<br>反則金が始まっている。'],
  [57.5, 61.6, '自転車、歩道と車道<br>どっちを走るべき？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.5, f: shot1 }, { a: 5.5, b: 8.1, f: shot2 }, { a: 8.1, b: 10.0, f: shot3 }, { a: 10.0, b: 13.5, f: shot4 },
  { a: 13.5, b: 15.0, f: shot5 }, { a: 15.0, b: 18.3, f: shot6 }, { a: 18.3, b: 20.9, f: shot7 }, { a: 20.9, b: 23.2, f: shot8 },
  { a: 23.2, b: 24.9, f: shot9 }, { a: 24.9, b: 28.5, f: shot10 }, { a: 28.5, b: 31.1, f: shot11 }, { a: 31.1, b: 34.7, f: shot12 },
  { a: 34.7, b: 36.7, f: shot13 }, { a: 36.7, b: 39.5, f: shot14 }, { a: 39.5, b: 43.0, f: shot15 }, { a: 43.0, b: 46.7, f: shot16 },
  { a: 46.7, b: 52.7, f: shot17 }, { a: 52.7, b: 57.5, f: shot18 }, { a: 57.5, b: 61.8, f: shot19 }, { a: 61.8, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0650',
    v2: true,
    hookLine: '歩道の電動ママチャリに、空からカメラのフラッシュがパシャッ。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '社会・ルール',
    title: 'もしも自転車の違反が全部罰金になったら？',
    titleHtml: 'もしも自転車の<br>違反が全部<br>罰金になったら？',
    mood: 'tension', seed: 650, hits: [0.45, 46.7, 52.7], risers: [34.7], impacts: [13.3, 15.4, 18.6, 23.3, 26.3, 47.0, 55.0],
    sfx: [[0.45, 'whoosh'], [6.0, 'alarm'], [8.3, 'whoosh'], [10.6, 'whoosh'], [11.4, 'whoosh'], [13.3, 'poof'], [22.2, 'whoosh'], [26.3, 'poof'], [29.0, 'whoosh'], [37.3, 'meter', 0.5], [39.8, 'alarm'], [40.4, 'alarm'], [41.0, 'alarm'], [48.0, 'alarm']],
    narr: { '1万2,000円': 'いちまんにせんえん', '6,000円': 'ろくせんえん', '朝8時': 'あさはちじ', '一斉': 'いっせい', '今年4月': 'ことしのしがつ', '反則金': 'はんそくきん', '結果：': '結果、', '歩道': 'ほどう', '車道': 'しゃどう' },
    ask: '自転車、歩道と車道どっちを走るべき？',
    caption: 'もしも自転車の違反が全部罰金になったら？\n\n歩く人たちの不満から。歩道で後ろからベルを鳴らされて、ひかれそうになる。\nある日、自転車の違反は全部カメラで見つかって、罰金になった。\nながらスマホは1万2,000円。歩道を飛ばすと6,000円。\n朝8時。歩道を急ぐママチャリに、罰金の通知が届く。スマホを見ながらこぐ若者にも、1万2,000円。\n自転車たちは、一斉に車道へ。歩道は静かになった。歩く人は大喜び。\nところが今度は、車道のドライバーがイライラし始める。前を走る自転車に、クラクションを鳴らしまくる。\n自転車が嫌いだったのは、歩道にいたからじゃなかった。\n\n結果：自転車を責めていた人は、車道に来た自転車にもっと怒った。\n実は今年4月から、自転車にも本当に反則金が始まっている。\n\n自転車、歩道と車道どっちを走るべき？ コメントで教えて。\n\n※風刺ネタです。全部カメラで見つかる のは、もしもの設定です\n出典：警察庁・大阪府警察「自転車の交通反則通告制度（青切符）」（2026年4月1日施行・16歳以上。反則金 ながらスマホ 1万2,000円、歩道通行など 6,000円）',
    hashtags: ['もしもラボ', 'もしも', '自転車', '青切符', 'ママチャリ'],
    endStats: [['ながらスマホの反則金', '1万2,000円', '2026年4月〜'], ['歩道通行などの反則金', '6,000円', '2026年4月〜'], ['対象', '16歳以上', '自転車の青切符']],
    sources: '出典：警察庁・大阪府警察「自転車の交通反則通告制度（青切符）」',
  },
});
