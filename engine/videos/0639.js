import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeHanko, hankoSlam, makeMark } from '../scenes/hanko.js';

// もしも店員が客を出禁にできたら？（皮肉回・台本 S15・図星）
// 2026/11/03 ゆうと承認。元ネタ：Togetter・なんJで燃える カスハラ（店員への怒鳴り・土下座の強要）の話
// 数字（裏取り済み）：
//  顧客等からの著しい迷惑行為（カスタマーハラスメント）を受けた労働者 10.8%（パワハラ 19.3%・セクハラ 6.3%）
//  厚生労働省「令和5年度 職場のハラスメントに関する実態調査」 https://www.mhlw.go.jp/content/11909000/001266530.pdf
// 店名・制服は架空（実在のコンビニの配色は使わない）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', PINK = '#ff7ab8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); p.scale.setScalar(p.userData.sc || 1); }
function walk(p, t, sp = 8) { const s = Math.sin(t * sp) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
function clerk(i = 0) { const p = (i % 2 ? makeMan : makeWoman)({ shirt: '#f4f4f4', hair: ['#3a2620', '#1d1a19', '#5a3a28'][i % 3] }); const ap = box(0.52, 0.66, 0.05, mat('#7a5ab0')); ap.position.set(0, 1.05, 0.16); p.add(ap); const tag = box(0.14, 0.08, 0.02, mat('#ffffff')); tag.position.set(0.12, 1.3, 0.19); p.add(tag); return p; }
function crown() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 16, 1, true), mat('#f2c230', { side: THREE.DoubleSide })); g.add(b); for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), mat('#f2c230')); const a = i / 6 * Math.PI * 2; c.position.set(Math.cos(a) * 0.24, 0.14, Math.sin(a) * 0.24); g.add(c); } return g; }

// ---------- A：お店の中（原点） ----------
const sfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#e8e6e0', { depthWrite: false })); sfloor.rotation.x = -Math.PI / 2; sfloor.position.set(0, 0.01, -1); sfloor.renderOrder = -0.8; S.add(sfloor);
const wall = box(14, 3.6, 0.2, mat('#f2efe8')); wall.position.set(0, 1.8, -4.4); S.add(wall);
const SHELF_C = ['#e85a5a', '#f0c040', '#5ab0e8', '#7ad07a', '#c88ae0', '#ffffff'];
{ const r = rng(15); for (let s = 0; s < 2; s++) { const sh = box(3.6, 2.2, 0.5, mat('#d6dbe4')); sh.position.set(-2.1 + s * 4.2, 1.1, -3.9); S.add(sh); for (let i = 0; i < 24; i++) { const g = box(0.34, 0.38, 0.2, mat(SHELF_C[Math.floor(r() * 6)])); g.position.set(-3.6 + s * 4.2 + (i % 8) * 0.43, 0.45 + Math.floor(i / 8) * 0.72, -3.55); S.add(g); } } }
const counter = box(4.2, 1.0, 0.9, mat('#8a7a6a')); counter.position.set(0, 0.5, -1.4); S.add(counter);
const ctop = box(4.3, 0.06, 1.0, mat('#d8d2c6')); ctop.position.set(0, 1.03, -1.4); S.add(ctop);
const reg = box(0.62, 0.36, 0.5, mat('#3a4050')); reg.position.set(-1.0, 1.24, -1.45); S.add(reg);
const shopSign = label('もしもマート', { w: 1024, size: 120, color: '#fff', bg: 'rgba(122,90,176,.96)', sx: 3.0 }); shopSign.position.set(0, 3.15, -4.2); S.add(shopSign);
const CL = clerk(0); S.add(CL);
const OJI = makeOji(rng(7), { shirt: '#59606e', bald: true }); S.add(OJI);
const HK = makeHanko(); HK.scale.setScalar(0.85); S.add(HK);
const MARK = makeMark('出禁', { sx: 1.25 }); S.add(MARK);
const MARK2 = makeMark('出禁', { sx: 1.0 }); S.add(MARK2);
const yell = label('店長を呼べ！', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 1.7 }); S.add(yell);
const dogeza = label('土下座しろ！', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 1.7 }); S.add(dogeza);
const thanks = label('ありがとうございます', { w: 1024, size: 96, color: '#2a6a3a', bg: 'rgba(255,255,255,.96)', sx: 2.2 }); S.add(thanks);
const erai = label('客は偉い', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(erai);
const harau = label('払っている間だけ', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 2.2 }); S.add(harau);
const newRule = label('出禁ハンコ', { w: 768, size: 120, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.7 }); S.add(newRule);
const clerkHK = makeHanko(); clerkHK.scale.setScalar(0.5); clerkHK.rotation.x = Math.PI; clerkHK.position.set(0, -0.68, 0.05); CL.userData.arms[1].add(clerkHK);
const CROWNS = [0, 1, 2].map(() => { const c = crown(); S.add(c); return c; });
const OJIS = [1, 2].map(i => { const o = makeOji(rng(20 + i)); S.add(o); return o; });
const QUEUE = [0, 1, 2, 3].map(i => { const p = (i % 2 ? makeWoman : makeMan)({ shirt: ['#6a8fd0', '#f0a0b0', '#7ab07a', '#e0c070'][i], hair: '#2a2220' }); S.add(p); return p; });
const coins = makeSparkles(80, 0.16, 0xffd27a); S.add(coins.points); coins.init([[0.2, 1.2, -1.0]], 0.4, 0.8);
const hearts = makeSparkles(120, 0.2, 0xffb0d0); S.add(hearts.points); hearts.init([[0.2, 2.2, -2.2]], 1.2, 1.6);
// 我慢メーター（店員の頭の上）
const gauge = new THREE.Group(); S.add(gauge);
const gBg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.26), new THREE.MeshBasicMaterial({ color: '#1a1a22', transparent: true, opacity: 0.88, depthTest: false })); gBg.renderOrder = 8; gauge.add(gBg);
const gFillM = new THREE.MeshBasicMaterial({ color: '#9be86a', depthTest: false, transparent: true }); const gFill = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.18), gFillM); gFill.geometry.translate(0.8, 0, 0); gFill.position.set(-0.8, 0, 0.01); gFill.renderOrder = 9; gauge.add(gFill);
const gCap = label('我慢', { w: 384, h: 160, size: 100, color: '#fff', bg: 'rgba(30,30,40,.9)', sx: 0.62 }); gCap.position.set(-0.55, 0.36, 0); gauge.add(gCap);
const gVal = label('', { w: 512, h: 160, size: 110, color: '#fff', stroke: 14, strokeColor: '#1a1a22', sx: 0.9 }); gVal.material.depthTest = false; gVal.renderOrder = 9; gVal.position.set(0.45, 0.36, 0); gauge.add(gVal);
function setGauge(v, t = 0) { const u = clamp(v / 100); gFill.scale.x = Math.max(0.001, u); gFillM.color.set(u < 0.5 ? '#9be86a' : u < 0.85 ? '#ffd27a' : (Math.floor(t * 6) % 2 ? '#ff2a2a' : '#ff6a5a')); gVal.userData.set(u >= 1 ? '限界' : String(Math.round(v))); }

// ---------- B：10人に1人（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -1); bfloor.renderOrder = -0.8; S.add(bfloor);
const ROW = []; for (let i = 0; i < 10; i++) { const c = clerk(i); c.position.set(BX - 4.05 + i * 0.9, 0, -1 + (i % 2) * 0.5); c.scale.setScalar(0.8); c.userData.sc = 0.8; S.add(c); ROW.push(c); }
const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 32), new THREE.MeshBasicMaterial({ color: '#ff3a3a', depthWrite: false, transparent: true })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = -0.7; S.add(ring);
const BADI = 6; // 赤くなる1人
const bikkuri = label('！', { w: 256, h: 256, size: 220, color: '#ff3a3a', stroke: 16, strokeColor: '#fff', sx: 0.9 }); S.add(bikkuri);

// ---------- C：通り（x=110）コンビニ・スーパー・駅の窓口 ----------
const CX = 110;
const street = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat('#5a5e66', { depthWrite: false })); street.rotation.x = -Math.PI / 2; street.position.set(CX, 0.02, 1); street.renderOrder = -0.8; S.add(street);
const walkway = new THREE.Mesh(new THREE.PlaneGeometry(30, 3), mat('#b8b2a6', { depthWrite: false })); walkway.rotation.x = -Math.PI / 2; walkway.position.set(CX, 0.03, -2.2); walkway.renderOrder = -0.7; S.add(walkway);
function storefront(x, body, name, nameBg) {
  const g = new THREE.Group(); const b = box(3.4, 3.6, 2.6, mat(body)); b.position.y = 1.8; g.add(b);
  const win = box(2.6, 1.6, 0.05, mat('#bfe4ff')); win.position.set(0, 1.2, 1.31); g.add(win);
  const sg = label(name, { w: 768, size: 120, color: '#fff', bg: nameBg, sx: 2.6 }); sg.position.set(0, 2.85, 1.45); g.add(sg);
  g.position.set(x, 0, -4.6); S.add(g);
  const mk = makeMark('出禁', { sx: 1.2 }); mk.position.set(x + 0.9, 2.2, -3.0); S.add(mk);
  return { g, mk, body: b };
}
const SHOPS = [storefront(CX - 4, '#efe6f6', 'もしもマート', 'rgba(122,90,176,.96)'), storefront(CX, '#f6efe0', 'スーパー', 'rgba(220,120,40,.96)'), storefront(CX + 4, '#e6eef6', '駅の窓口', 'rgba(50,110,190,.96)')];
const OJI2 = makeOji(rng(7), { shirt: '#59606e', bald: true }); S.add(OJI2);

// ---------- D：町（x=170） ----------
const DX = 170;
const dfloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat('#7a9a6a', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, -2); dfloor.renderOrder = -0.8; S.add(dfloor);
const roadsX = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.6), mat('#5a5e66', { depthWrite: false })); roadsX.rotation.x = -Math.PI / 2; roadsX.position.set(DX, 0.03, -2); roadsX.renderOrder = -0.7; S.add(roadsX);
const roadsZ = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 40), mat('#5a5e66', { depthWrite: false })); roadsZ.rotation.x = -Math.PI / 2; roadsZ.position.set(DX, 0.035, -2); roadsZ.renderOrder = -0.69; S.add(roadsZ);
const TOWN = []; { const cols = ['#f6d0a0', '#d0e8f6', '#f6c0c8', '#d8f0c0', '#efe0f6', '#fff0c0']; const r = rng(3); let k = 0;
  for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let j = 0; j < 3; j++) { const x = DX + qx * (2.4 + (j % 2) * 2.6), z = -2 + qz * (2.2 + Math.floor(j / 2) * 2.8) + (j === 2 ? 0 : 0); const h = 1.4 + r() * 0.8; const b = box(1.9, h, 1.9, mat(cols[k % 6])); b.position.set(x, h / 2, z); S.add(b); const aw = box(2.0, 0.12, 0.5, mat(['#d04040', '#3a8ad0', '#40a060'][k % 3])); aw.position.set(x, h * 0.6, z - qz * 1.0); S.add(aw); const mk = makeMark('出禁', { sx: 1.1 }); mk.position.set(x, h + 0.7, z); S.add(mk); TOWN.push({ b, aw, mk, col: cols[k % 6], i: k }); k++; } }
TOWN.sort((a, b) => Math.hypot(a.b.position.x - DX, a.b.position.z + 2) - Math.hypot(b.b.position.x - DX, b.b.position.z + 2));
const OJI3 = makeOji(rng(7), { shirt: '#59606e', bald: true }); S.add(OJI3);

// ---------- E：家（x=220） ----------
const EX = 220;
const home = makeRoom({ w: 9, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); home.position.set(EX, 0, 0); home.userData.rw.visible = false; S.add(home);
const tbl = box(1.6, 0.7, 1.0, mat('#8a5a32')); tbl.position.set(EX + 0.8, 0.35, -1.6); S.add(tbl);
const WIFE = makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }); S.add(WIFE);
const OJI4 = makeOji(rng(7), { shirt: '#59606e', bald: true }); S.add(OJI4);
const WHK = makeHanko(); WHK.scale.setScalar(0.62); S.add(WHK);
const dots = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.8 }); S.add(dots);
const memMark = makeMark('出禁', { sx: 0.9 }); S.add(memMark);
const homeMark = makeMark('出禁', { sx: 1.3 }); S.add(homeMark);

const ALL = [CL, OJI, OJI2, OJI3, OJI4, WIFE, ...OJIS, ...QUEUE, ...ROW];
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  CL.position.set(0.1, 0, -2.3); OJI.position.set(0.25, 0, 0.0); OJI.rotation.y = Math.PI;
  OJI.userData.head.rotation.set(0, 0, 0); OJIS.forEach(o => o.visible = false); QUEUE.forEach(q => q.visible = false);
  HK.visible = false; MARK.visible = MARK2.visible = false; yell.visible = dogeza.visible = thanks.visible = erai.visible = harau.visible = newRule.visible = false;
  clerkHK.visible = false; CROWNS.forEach(c => c.visible = false); coins.set(0); hearts.set(0); gauge.visible = false;
  ring.visible = false; bikkuri.visible = false; shopSign.visible = false;
  SHOPS.forEach(s => { s.mk.visible = false; s.body.material.color.set(s.body.userData.c0 || (s.body.userData.c0 = '#' + s.body.material.color.getHexString())); });
  OJI2.position.set(CX, 0, -1.6); TOWN.forEach(o => { o.mk.visible = false; o.b.material.color.set(o.col); }); OJI3.position.set(DX + 0.0, 0, -2.0);
  WIFE.position.set(EX + 1.6, 0, -1.4); WIFE.rotation.y = -0.9; OJI4.position.set(EX - 1.2, 0, -0.6); OJI4.rotation.y = 1.0; WHK.visible = false; dots.visible = false; memMark.visible = false; homeMark.visible = false;
  hemi.intensity = 1.2; S.background.set('#2a2e3a'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const HEAD = () => OJI.position.y + 1.95;
function angry(p, t) { p.userData.arms[1].rotation.x = -2.0 + Math.sin(t * 9) * 0.25; p.userData.arms[0].rotation.x = -0.6; p.userData.head.rotation.x = -0.15 + Math.sin(t * 9) * 0.05; }
function storeCam(d = 0) { look(lerp(2.8, 2.6, d), 2.3, lerp(2.9, 3.2, d), 0.3, 2.12, -0.6, 52); }
const TP = 0.45;
function stamped(k) { // 出禁を押された直後のおぢ（少し縮んで固まる）
  OJI.userData.arms.forEach(a => a.rotation.x = 0); OJI.userData.head.rotation.x = 0.2; OJI.scale.set(1, 1 - 0.12 * Math.exp(-k * 6) * Math.sin(k * 30) - 0.03, 1);
  MARK.position.set(OJI.position.x + 0.05, 2.28, OJI.position.z + 0.25); MARK.visible = true; MARK.userData.size(0.62 * (k < 0.2 ? 1.3 - k * 1.5 : 1));
}
function shot0(t) { // 0秒＝サムネ：レジで怒鳴るおぢの頭に、赤い出禁のハンコがドン
  reset(); lift(0); OJI.rotation.y = Math.PI - 0.8;
  const hit = hankoSlam(HK, [OJI.position.x, HEAD(), OJI.position.z], t, TP, { from: 0.3, up: 1.2, dur: 0.18 }); HK.visible = t < TP + 1.0;
  if (!hit) { angry(OJI, t); yell.position.set(0.15, 1.98, -1.25); yell.visible = true; yell.userData.size(0.9); }
  else stamped(t - TP);
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  CL.userData.head.rotation.x = 0.15;
  storeCam(ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 店で働く人たちの我慢が限界に
  reset(); lift(60); angry(OJI, t); OJI.rotation.y = Math.PI - 0.8; shopSign.visible = false; yell.position.set(0.75, 2.3, -0.3); yell.visible = true; yell.userData.size(1.0);
  gauge.visible = true; gauge.position.set(0.1, 2.75, -2.0); setGauge(lerp(55, 100, easeOut(clamp(t / 2.2))), t);
  CL.userData.head.rotation.x = 0.25; CL.userData.arms.forEach(a => a.rotation.x = -0.4);
  look(1.0, 2.3, 3.4, 0.1, 1.9, -1.6, 52);
  return S;
}
function shot2(t) { // 働く人の10.8%が、客からのハラスメントを受けていた
  reset(); lift(150);
  ROW.forEach((c, i) => { c.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.2; });
  const on = t > 0.9; const c = ROW[BADI];
  if (on) { ring.visible = true; ring.position.set(c.position.x, 0.05, c.position.z); c.userData.head.rotation.x = 0.35; c.userData.arms.forEach(a => a.rotation.x = -0.5); }
  bikkuri.position.set(c.position.x, 2.2, c.position.z); pop(bikkuri, t, 1.0, 0.25, 0.9);
  look(BX, 3.2, 7.4, BX, 1.2, -1, 50);
  setTop('客からのハラスメントを受けた', '10.8%', fade(t, 0.15, 4.0, 0.25), RED);
  return S;
}
function shot3(t) { // ある日、店員はその場で客を出禁にできるようになった
  reset(); lift(80); OJI.visible = false; clerkHK.visible = true; shopSign.visible = true;
  const u = easeOut(clamp((t - 0.4) / 0.7)); CL.userData.arms[1].rotation.x = lerp(0, -2.6, u); CL.userData.head.rotation.x = -0.1;
  newRule.position.set(0.1, 3.3, -2.2); pop(newRule, t, 1.2, 0.3, 1.7);
  hearts.set(t > 1.2 ? clamp((t - 1.2) / 2.4) : 0);
  look(0.6, 2.2, 3.6, 0.1, 2.0, -2.0, 52);
  setTop('新しいルール', '店員が出禁を決める', fade(t, 0.15, 3.7, 0.25), GOLD);
  return S;
}
function shot4(t) { // 客は偉い、と思っていた人たちは最初の日に気づく
  reset(); lift(80); const P = [OJI, ...OJIS]; P.forEach((o, i) => { o.visible = true; o.position.set(-1.2 + i * 1.2, 0, 0.2 + (i === 1 ? -0.3 : 0)); o.rotation.y = Math.PI - 0.3 + i * 0.25; o.userData.arms[0].rotation.z = 0.3; o.userData.arms[1].rotation.z = -0.3; o.userData.head.rotation.x = -0.25; });
  CROWNS.forEach((c, i) => { c.visible = true; c.position.set(P[i].position.x, 2.2 + Math.sin(t * 3 + i) * 0.05, P[i].position.z); c.rotation.y = t; });
  erai.position.set(0, 3.15, 0); pop(erai, t, 0.4, 0.3, 1.6);
  look(0.0, 2.4, 5.6, 0.0, 1.8, -0.4, 52);
  return S;
}
function shot5(t) { // 偉いのは客じゃなく、お金を払っている間だけだった
  reset(); lift(0); OJI.rotation.y = Math.PI - 0.8; OJI.userData.arms[1].rotation.x = t < 1.8 ? -1.2 : 0; coins.set(t > 0.5 && t < 1.8 ? (t - 0.5) / 1.3 : 0);
  const c = CROWNS[0]; c.visible = true; const fall = clamp((t - 2.0) / 0.6); c.position.set(OJI.position.x + fall * 0.6, 2.2 - fall * 2.1, OJI.position.z + fall * 0.4); c.rotation.z = fall * 1.8;
  if (t > 2.3) OJI.userData.head.rotation.x = 0.2;
  harau.position.set(0.55, 2.62, -1.0); pop(harau, t, 0.6, 0.3, 1.5);
  storeCam(0.5);
  return S;
}
function shot6(t) { // 土下座しろと言ったおじさん、コンビニを出禁
  reset(); lift(0); OJI.rotation.y = Math.PI - 0.8; const T0 = 1.7;
  const hit = hankoSlam(HK, [OJI.position.x, HEAD(), OJI.position.z], t, T0, { from: 0.8, up: 1.2, dur: 0.25 }); HK.visible = t > 0.9 && t < T0 + 1.0;
  if (!hit) { OJI.userData.arms[1].rotation.x = -1.4; OJI.userData.arms[1].rotation.z = 0.0; OJI.userData.head.rotation.x = 0.25; dogeza.position.set(0.15, 1.98, -1.25); dogeza.visible = true; dogeza.userData.size(0.9); }
  else stamped(t - T0);
  el.flash.style.opacity = t > T0 && t < T0 + 0.12 ? 0.35 : 0;
  storeCam(0.3);
  setTop('コンビニ', '出禁', fade(t, T0, 3.6, 0.2), RED);
  return S;
}
function shot7(t) { // 次の日は、スーパーも出禁。駅の窓口も出禁
  reset(); lift(110); SHOPS[0].mk.visible = true; SHOPS[0].mk.userData.size(1.2);
  [[1, 0.6], [2, 2.0]].forEach(([i, t0]) => { const s = SHOPS[i]; pop(s.mk, t, t0, 0.2, 1.2); });
  const k = clamp(t / 3.6); OJI2.position.set(CX - 3 + k * 5, 0, -1.4); walk(OJI2, t, 7); OJI2.rotation.y = Math.PI / 2; OJI2.userData.head.rotation.y = 0.7;
  el.flash.style.opacity = (t > 0.6 && t < 0.7) || (t > 2.0 && t < 2.1) ? 0.25 : 0;
  look(CX, 3.4, 8.6, CX, 1.8, -3.0, 52);
  return S;
}
function shot8(t) { // 行ける店が、町から1軒ずつ消えていく
  reset(); lift(110); const n = Math.floor(clamp((t - 0.3) / 2.8) * TOWN.length + 0.001);
  TOWN.forEach((o, i) => { if (i < n) { o.mk.visible = true; o.b.material.color.set('#8a8a90'); } });
  OJI3.userData.head.rotation.y = Math.sin(t * 2) * 0.8; OJI3.rotation.y = 0.4;
  const u = ease(clamp(t / 3.4)); look(DX + lerp(2, 3, u), lerp(6, 13, u), lerp(7, 12, u), DX, 0.6, -2.4, 52);
  return S;
}
function shot9(t) { // 一方、レジの列は静かになり、店員の顔がやわらかくなる
  reset(); lift(60); OJI.visible = false; shopSign.visible = false;
  QUEUE.forEach((q, i) => { q.visible = true; q.position.set(0.3 + (i % 2) * 0.15, 0, 0.1 + i * 0.9); q.rotation.y = Math.PI; });
  gauge.visible = true; gauge.position.set(0.1, 2.75, -2.0); setGauge(lerp(100, 18, easeOut(clamp((t - 0.3) / 2.6))), t);
  CL.userData.head.rotation.z = Math.sin(t * 2) * 0.12; CL.userData.arms[0].rotation.x = -0.5; CL.userData.arms[1].rotation.x = -0.5;
  thanks.position.set(0.1, 3.4, -2.0); pop(thanks, t, 1.4, 0.3, 2.2); hearts.set(t > 1.4 ? clamp((t - 1.4) / 2.8) : 0);
  look(2.2, 2.6, 4.6, 0.1, 1.8, -1.2, 52);
  return S;
}
function homeCam(d = 0) { look(EX + 0.2, 2.3, lerp(5.6, 5.0, d), EX + 0.2, 1.5, -1.0, 52); }
function shot10(t) { // おじさんは家に帰って、妻に怒鳴ろうとして、ふと止まる
  reset(); lift(80); const T0 = 2.0; const k = clamp(t / 1.2);
  OJI4.position.set(EX - 2.4 + k * 1.4, 0, -0.6); if (t < 1.2) walk(OJI4, t, 7);
  else if (t < T0) { OJI4.userData.arms[1].rotation.x = lerp(0, -2.1, clamp((t - 1.2) / 0.5)); OJI4.userData.head.rotation.x = -0.15; }
  else { OJI4.userData.arms[1].rotation.x = -2.1 + clamp((t - T0 - 0.6) / 0.6) * 1.8; OJI4.userData.head.rotation.x = 0.15; dots.position.set(EX - 1.0, 2.6, -0.6); pop(dots, t, T0 + 0.2, 0.25, 0.8); memMark.position.set(EX - 0.3, 2.9, -0.6); pop(memMark, t, T0, 0.2, 0.9); }
  WIFE.userData.head.rotation.y = -0.3;
  homeCam(clamp(t / 4));
  return S;
}
function shot11(t) { // 結果：客が偉かったんじゃない。店員が我慢していただけだった
  reset(); lift(110); S.background.set('#1e2030'); hemi.intensity = 0.85; SHOPS.forEach(s => { s.mk.visible = true; s.mk.userData.size(1.2); });
  OJI2.position.set(CX - 0.6, 0, -0.6); OJI2.rotation.y = Math.PI + 0.5; OJI2.userData.head.rotation.x = 0.35; OJI2.userData.arms.forEach(a => a.rotation.z = 0.0);
  const u = ease(clamp(t / 5.8)); look(CX + lerp(0.4, 0.0, u), lerp(2.4, 3.6, u), lerp(6.8, 11.0, u), CX - 0.3, 1.9, -2.6, 52);
  setTop('結果', '店員が我慢していた', fade(t, 0.15, 5.8, 0.25), RED);
  return S;
}
function shot12(t) { // 次に出禁を言い渡すのは、家の中かもしれない
  reset(); lift(80); OJI4.position.set(EX - 1.0, 0, -0.6); OJI4.rotation.y = 0.8; OJI4.userData.head.rotation.x = 0.1; OJI4.userData.arms.forEach(a => a.rotation.x = 0.05);
  WIFE.position.set(EX + 0.9, 0, -0.9); WIFE.rotation.y = -0.8; WIFE.userData.arms[1].rotation.x = -1.4; WHK.visible = true;
  WHK.position.set(EX + 0.55, 1.45 + Math.sin(t * 2) * 0.03, -0.4); WHK.rotation.set(Math.PI / 2, 0, 0.9);
  homeMark.position.set(EX - 1.0, 2.6, -0.4); pop(homeMark, t, 1.6, 0.25, 0.8);
  el.flash.style.opacity = t > 1.6 && t < 1.7 ? 0.2 : 0;
  look(EX + 0.2, 2.2, 4.8, EX - 0.1, 1.6, -0.8, 52);
  return S;
}
function shot13(t) { // 質問。最後は冒頭と同じ構図（出禁を押されたまま）
  reset(); lift(0); OJI.rotation.y = Math.PI - 0.8; stamped(2); CL.userData.head.rotation.x = 0.15;
  storeCam(0);
  return S;
}

const SUBS = [
  [3.0, 6.2, '店で働く人たちの<br>我慢が限界に。'],
  [6.3, 10.7, '働く人の10.8%が、客からの<br>ハラスメントを受けていた。'],
  [10.8, 15.0, 'ある日、店員はその場で客を<br>出禁にできるようになった。'],
  [15.1, 19.0, '客は偉い、と思っていた<br>人たちは最初の日に気づく。'],
  [19.1, 23.2, '偉いのは客じゃなく、お金を<br>払っている間だけだった。'],
  [23.3, 27.0, '土下座しろと言ったおじさん、<br>コンビニを出禁。'],
  [27.1, 31.0, '次の日は、スーパーも出禁。<br>駅の窓口も出禁。'],
  [31.1, 34.6, '行ける店が、町から<br>1軒ずつ消えていく。'],
  [34.7, 39.0, '一方、レジの列は静かになり、<br>店員の顔がやわらかくなる。'],
  [39.1, 43.6, 'おじさんは家に帰って、妻に<br>怒鳴ろうとして、ふと止まる。'],
  [43.7, 50.0, '結果：客が偉かったんじゃない。<br>店員が我慢していただけだった。'],
  [50.1, 55.4, '次に出禁を言い渡すのは、<br>家の中かもしれない。'],
  [55.5, 61.3, '店員が客を出禁にできる、<br>賛成？反対？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 6.3, f: shot1 }, { a: 6.3, b: 10.8, f: shot2 }, { a: 10.8, b: 15.1, f: shot3 }, { a: 15.1, b: 19.1, f: shot4 },
  { a: 19.1, b: 23.3, f: shot5 }, { a: 23.3, b: 27.1, f: shot6 }, { a: 27.1, b: 31.1, f: shot7 }, { a: 31.1, b: 34.7, f: shot8 },
  { a: 34.7, b: 39.1, f: shot9 }, { a: 39.1, b: 43.7, f: shot10 }, { a: 43.7, b: 50.1, f: shot11 }, { a: 50.1, b: 55.5, f: shot12 },
  { a: 55.5, b: 61.6, f: shot13 }, { a: 61.6, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0639',
    v2: true,
    hookLine: 'レジで怒鳴るおじさんに、出禁のハンコがドン。',
    series: '図星',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも店員が客を出禁にできたら？',
    titleHtml: 'もしも店員が<br>客を出禁に<br>できたら？',
    mood: 'tension', seed: 639, hits: [0.45, 43.7, 50.1], risers: [39.1], impacts: [6.3, 10.8, 23.3, 25.0, 27.7, 29.1, 43.7],
    sfx: [[0.45, 'poof'], [6.9, 'alarm'], [11.4, 'whoosh'], [21.2, 'whoosh'], [25.0, 'poof'], [27.7, 'poof'], [29.1, 'poof'], [31.5, 'meter', 0.5], [36.1, 'bubble'], [41.1, 'whoosh'], [51.7, 'poof']],
    narr: { '10.8%': 'じゅってんはちパーセント', '出禁': 'できん', '1軒': 'いっけん', '結果：': '結果、', '土下座': 'どげざ', '窓口': 'まどぐち' },
    ask: '店員が客を出禁にできる、賛成？反対？',
    caption: 'もしも店員が、その場で客を出禁にできたら？\n\n店で働く人たちの我慢が限界に。働く人の10.8%が、客からのハラスメントを受けていた。\nある日、店員はその場で客を出禁にできるようになった。\n客は偉い、と思っていた人たちは最初の日に気づく。偉いのは客じゃなく、お金を払っている間だけだった。\n土下座しろと言ったおじさん、コンビニを出禁。次の日はスーパーも、駅の窓口も出禁。\n行ける店が、町から1軒ずつ消えていく。\n一方、レジの列は静かになり、店員の顔がやわらかくなる。\n\n結果：客が偉かったんじゃない。店員が我慢していただけだった。\n次に出禁を言い渡すのは、家の中かもしれない。\n\n店員が客を出禁にできる、賛成？反対？ コメントで教えて。\n\n※風刺ネタです\n出典：厚生労働省「令和5年度 職場のハラスメントに関する実態調査」（顧客等からの著しい迷惑行為＝カスタマーハラスメントを受けた労働者 10.8%）',
    hashtags: ['もしもラボ', 'もしも', 'カスハラ', '接客業', '出禁'],
    endStats: [['客からのハラスメントを受けた', '10.8%', '2023年度調査'], ['同じ調査のパワハラ', '19.3%', '2023年度調査'], ['偉かったのは', '払っている間だけ', 'かもしれない']],
    sources: '出典：厚生労働省「令和5年度 職場のハラスメントに関する実態調査」',
  },
});
