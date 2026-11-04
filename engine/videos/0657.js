import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { poseClear, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも痩せろが連帯責任だったら？（皮肉回・台本 S49・図星／男と女のもしも）
// 2026/11/04 ゆうと承認（投稿サーバーで ok）。元ネタ：増田「彼氏にお前太り過ぎ、少し痩せろと言われるが困る。もうダイエットはしたくないよ。」
//  https://anond.hatelabo.jp/20261029072347（2026/10/29、148users）
// 数字は使わない（体重・BMI は出さない）。体型そのものは笑わず、言う側の行動だけを笑う。極端な食事制限は描かない（禁止は夜のラーメン・からあげ・ビールだけ）
// 店・商品は架空（実在のコンビニ・ラーメン店・ビールの見た目に似せない）

const GOLD = '#ffd27a', RED = '#ff5a5a';
const S = new THREE.Scene();
S.background = new THREE.Color('#9fc8e8'); S.fog = new THREE.Fog(0x9fc8e8, 40, 180);
const hemi = new THREE.HemisphereLight(0xffffff, 0x6a6a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), mat('#8aa070', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
const KARE = () => makeMan({ shirt: '#4f6a8f', pants: '#3b3f4a', hair: '#1d1a19' });
const KANO = () => makeWoman({ shirt: '#f29bbb', hair: '#4a3020', pants: '#2b3346' });
function point(p, k = 1) { p.userData.arms[1].rotation.set(-1.45 * k, 0, 0.25 * k); }
// 二人三脚：彼女（左）と彼氏（右）。内側の足（彼女の右足・彼氏の左足）がひもで結ばれて同じ動き
const ROPE_M = mat('#d8242c');
function makeRope() { const g = new THREE.Group(); const r = box(0.56, 0.07, 0.25, ROPE_M); g.add(r); const k = box(0.09, 0.1, 0.06, ROPE_M); k.position.set(0, 0.02, 0.15); g.add(k); return g; }
function legs3(a, b, ph, amp = 0.5, { drag = 0 } = {}) {
  const s = Math.sin(ph) * amp;
  a.userData.legs[1].rotation.x = s; b.userData.legs[0].rotation.x = s; // 内側（結ばれた足）
  a.userData.legs[0].rotation.x = -s; b.userData.legs[1].rotation.x = -s * (1 - drag);
  a.userData.arms[0].rotation.x = s * 0.6; a.userData.arms[1].rotation.x = -s * 0.2;
  b.userData.arms[1].rotation.x = s * 0.6 * (1 - drag); b.userData.arms[0].rotation.x = -s * 0.2;
  return s;
}
function placeRope(rope, a, b, s) { // 内側の足首の間
  const ax = a.position.x + 0.12 * a.scale.x, bx = b.position.x - 0.12 * b.scale.x;
  rope.position.set((ax + bx) / 2, 0.16 + Math.max(a.position.y, b.position.y), (a.position.z + b.position.z) / 2 - 0.74 * Math.sin(s));
  rope.scale.x = Math.max(0.3, (bx - ax + 0.3) / 0.56);
}

// ---------- A：歩道（原点）。両側に低い建物と木 ----------
const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 400), mat('#5a5e66', { depthWrite: false })); road.rotation.x = -Math.PI / 2; road.position.set(9, 0.01, -100); road.renderOrder = -0.85; S.add(road);
const walkway = new THREE.Mesh(new THREE.PlaneGeometry(5, 400), mat('#c9c2b0', { depthWrite: false })); walkway.rotation.x = -Math.PI / 2; walkway.position.set(0, 0.02, -100); walkway.renderOrder = -0.8; S.add(walkway);
{ const r = rng(49); const cols = ['#e8d8c0', '#c9d6e0', '#e0c8b8', '#d8e0c8', '#f0e6d6'];
  for (let i = 0; i < 26; i++) { const h = 3 + r() * 6, w = 4 + r() * 3; const b = box(w, h, 4, mat(cols[i % 5])); b.position.set(-6.5 - r() * 1.5, h / 2, 20 - i * 9); S.add(b); const wnd = box(w * 0.7, 0.9, 0.05, mat('#7a9ab8')); wnd.position.set(b.position.x + 2.02, h * 0.62, b.position.z); wnd.rotation.y = Math.PI / 2; S.add(wnd); }
  for (let i = 0; i < 20; i++) { const tr = new THREE.Group(); const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.8, 8), mat('#6a4a30')); tk.position.y = 0.9; tr.add(tk); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), mat('#5a9a5a')); lf.position.y = 2.3; tr.add(lf); tr.position.set(3.2, 0, 16 - i * 10); S.add(tr); }
}
const A_KANO = KANO(); S.add(A_KANO); const A_KARE = KARE(); S.add(A_KARE);
const ROPE = makeRope(); S.add(ROPE);
const sweat = makeSweat(); A_KARE.userData.head.add(sweat);
const futori = label('お前太りすぎ', { w: 900, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.6 }); S.add(futori);
const gyu = label('ギュッ', { w: 512, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(gyu);
const yasero = label('痩せろ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.95 }); S.add(yasero);
const futtenai = label('太ってない', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.1 }); S.add(futtenai);
const rentai = label('連帯責任', { w: 640, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(rentai);
const onaji = label('言った人も 同じダイエット', { w: 1200, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.3 }); S.add(onaji);
const start = label('スタート', { w: 640, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(start);
const hah = label('ハァ…ハァ…', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.25 }); S.add(hah);
const futsu = label('ふつうに歩いてる', { w: 900, size: 100, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.6 }); S.add(futsu);
const hikizu = label('引きずられる', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(hikizu);
const jibun = label('体力がないのは…自分', { w: 1100, size: 96, color: '#fff', bg: 'rgba(60,70,110,.96)', sx: 2.0 }); S.add(jibun);
const give = label('ギブアップ', { w: 768, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(give);
const kakegoe = label('掛け声だけ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.3 }); S.add(kakegoe);
const week = label('1週間後', { w: 640, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 1.1 }); S.add(week);
const sparkA = makeSparkles(90, 0.16, 0xffd0d0); S.add(sparkA.points); sparkA.init([[0, 0.2, 0.4]], 0.5, 0.9);
// メガホン（掛け声）
const MEGA = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.07, 0.5, 12, 1, true), new THREE.MeshLambertMaterial({ color: '#f2c14e', side: THREE.DoubleSide })); c.rotation.x = -Math.PI / 2; c.position.z = 0.25; MEGA.add(c); const h = box(0.06, 0.18, 0.06, mat('#2a2a30')); h.position.set(0, -0.1, 0.05); MEGA.add(h); } S.add(MEGA);
const bench = new THREE.Group(); { const st = box(1.8, 0.1, 0.5, mat('#9a6a40')); st.position.y = 0.48; bench.add(st); for (const x of [-0.75, 0.75]) { const l = box(0.1, 0.48, 0.45, mat('#3a3a40')); l.position.set(x, 0.24, 0); bench.add(l); } } S.add(bench);

// ---------- B：ラーメン屋のカウンター（x=100）。架空の店 ----------
const BX = 100;
const shopBack = box(10, 5, 0.2, mat('#e8d6b0')); shopBack.position.set(BX, 2.5, -2.4); S.add(shopBack);
const shopFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), mat('#6a5040', { depthWrite: false })); shopFloor.rotation.x = -Math.PI / 2; shopFloor.position.set(BX, 0.03, 0); shopFloor.renderOrder = -0.75; S.add(shopFloor);
const counter = box(6, 1.0, 0.9, mat('#a8743a')); counter.position.set(BX, 0.5, -0.6); S.add(counter);
const counterTop = box(6.2, 0.08, 1.1, mat('#d8a868')); counterTop.position.set(BX, 1.04, -0.6); S.add(counterTop);
const noren = new THREE.Group(); for (let i = 0; i < 4; i++) { const n = box(0.9, 1.0, 0.04, mat('#2a3a6a')); n.position.set(BX - 1.4 + i * 0.95, 3.6, -2.25); noren.add(n); } S.add(noren);
const shopSign = label('夜のラーメン', { w: 900, size: 110, color: '#fff', bg: 'rgba(42,58,106,.96)', sx: 2.2 }); shopSign.position.set(BX, 4.0, -2.2); S.add(shopSign);
function makeBowl() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.22, 0.26, 18), mat('#c8342c')); b.position.y = 0.13; g.add(b);
  const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 18), mat('#e8b060')); soup.position.y = 0.25; g.add(soup);
  for (let i = 0; i < 5; i++) { const n = box(0.4, 0.02, 0.03, mat('#f6e08a')); n.position.set(0, 0.265, -0.12 + i * 0.06); n.rotation.y = 0.2 * (i % 2 ? 1 : -1); g.add(n); }
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#fff6d8')); egg.scale.y = 0.6; egg.position.set(0.15, 0.28, 0.08); g.add(egg);
  const nori = box(0.16, 0.2, 0.01, mat('#1a2a1a')); nori.position.set(-0.2, 0.33, -0.1); nori.rotation.x = -0.3; g.add(nori);
  return g;
}
const BOWL = makeBowl(); BOWL.position.set(BX + 0.4, 1.08, -0.5); BOWL.scale.setScalar(1.3); S.add(BOWL);
const steam = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); S.add(m); return m; });
const B_KARE = KARE(); S.add(B_KARE); const B_KANO = KANO(); S.add(B_KANO);
const ROPE_B = makeRope(); S.add(ROPE_B);
function banMark() { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color: '#e0242c', depthTest: false })); g.add(ring); const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: '#e0242c', depthTest: false })); bar.rotation.z = -Math.PI / 4; g.add(bar); g.children.forEach(c => c.renderOrder = 9); return g; }
const BAN = [0, 1, 2].map(() => { const b = banMark(); S.add(b); return b; });
const kinshi = label('禁止', { w: 512, size: 140, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kinshi);
const tomaru = label('止まる', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.8 }); S.add(tomaru);

// ---------- C：架空のコンビニのレジ横（x=200）：からあげとビール ----------
const CX = 200;
const cWall = box(10, 5, 0.2, mat('#f4f4f2')); cWall.position.set(CX, 2.5, -2.4); S.add(cWall);
const cFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), mat('#d8d8d4', { depthWrite: false })); cFloor.rotation.x = -Math.PI / 2; cFloor.position.set(CX, 0.03, 0); cFloor.renderOrder = -0.75; S.add(cFloor);
const cCounter = box(5, 1.0, 0.9, mat('#e0e0e4')); cCounter.position.set(CX, 0.5, -0.6); S.add(cCounter);
const hotCase = new THREE.Group(); { const base = box(1.6, 0.3, 0.7, mat('#c8342c')); base.position.y = 0.15; hotCase.add(base); const gl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.7), new THREE.MeshLambertMaterial({ color: '#fff0c8', transparent: true, opacity: 0.35, depthWrite: false })); gl.position.y = 0.7; hotCase.add(gl); const roof = box(1.62, 0.08, 0.72, mat('#c8342c')); roof.position.y = 1.12; hotCase.add(roof); for (let i = 0; i < 3; i++) { const cup = box(0.34, 0.3, 0.2, mat('#fbfaf5')); cup.position.set(-0.5 + i * 0.5, 0.46, 0); hotCase.add(cup); for (let k = 0; k < 4; k++) { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), mat('#d8902a')); n.position.set(-0.5 + i * 0.5 + (k % 2 - 0.5) * 0.12, 0.66 + Math.floor(k / 2) * 0.06, (k % 2) * 0.05); hotCase.add(n); } } }
hotCase.position.set(CX - 0.9, 1.04, -0.6); S.add(hotCase);
const caseSign = label('からあげ', { w: 640, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.1 }); caseSign.position.set(CX - 0.9, 2.65, -0.5); S.add(caseSign);
const CAN = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 16), mat('#e8c060')); c.position.y = 0.25; CAN.add(c); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.05, 16), mat('#c9ced8')); top.position.y = 0.52; CAN.add(top); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.16, 16), mat('#fbfaf5')); band.position.y = 0.25; CAN.add(band); }
CAN.position.set(CX + 0.9, 1.08, -0.5); CAN.scale.setScalar(1.3); S.add(CAN);
const canSign = label('ビール', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); canSign.position.set(CX + 0.9, 2.35, -0.5); S.add(canSign);
const C_KARE = KARE(); S.add(C_KARE);
const shobon = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.6 }); S.add(shobon);

// ---------- D：日本中のカップル（x=300）。痩せろ の吹き出しが消える ----------
const DX = 300;
const dFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat('#c9c2b0', { depthWrite: false })); dFloor.rotation.x = -Math.PI / 2; dFloor.position.set(DX, 0.03, -6); dFloor.renderOrder = -0.75; S.add(dFloor);
const COUPLES = []; { const r = rng(9); const shirts = ['#4f6a8f', '#3f8f6b', '#8e6bbf', '#d97a3a', '#59606e', '#2f4a7a']; const wsh = ['#f29bbb', '#f2c14e', '#e9e4da', '#4fa3d1', '#c94f7c', '#5d8c3a'];
  for (let i = 0; i < 9; i++) { const m = makeMan({ shirt: shirts[i % 6], hair: '#2a2420' }), w = makeWoman({ shirt: wsh[i % 6], hair: r() < 0.5 ? '#3a2620' : '#6b4a33' }); const x = DX - 6 + (i % 3) * 6, z = -2 - Math.floor(i / 3) * 6; w.position.set(x - 0.4, 0, z); m.position.set(x + 0.4, 0, z); m.rotation.y = -0.4; w.rotation.y = 0.4; S.add(m); S.add(w);
    const b = label('痩せろ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.95 }); S.add(b); b.position.set(x + 0.7, 2.55, z);
    COUPLES.push({ m, w, b, x, z }); } }
const sparkD = makeSparkles(240, 0.2, 0xffffff); S.add(sparkD.points); sparkD.init(COUPLES.map(c => [c.x + 0.7, 2.55, c.z]), 0.6, 1.2);
const kieta = label('痩せろ が消えた', { w: 1024, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.6 }); S.add(kieta);

const PEOPLE = [A_KANO, A_KARE, B_KARE, B_KANO, C_KARE];
const LABELS = [futori, gyu, yasero, futtenai, rentai, onaji, start, hah, futsu, hikizu, jibun, give, kakegoe, week, kinshi, tomaru, shobon, kieta];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkD.set(0); BAN.forEach(b => b.visible = false); sweat.userData.set(0);
  A_KANO.position.set(-0.36, 0, 0); A_KARE.position.set(0.36, 0, 0); ROPE.visible = true; MEGA.visible = false; bench.visible = false;
  B_KANO.position.set(BX - 0.6, 0, 0.6); B_KARE.position.set(BX + 0.12, 0, 0.6); B_KANO.rotation.y = Math.PI; B_KARE.rotation.y = Math.PI;
  C_KARE.position.set(CX, 0, 0.7); C_KARE.rotation.y = Math.PI; steam.forEach(m => m.visible = false); bHide(); MEGA.rotation.set(0, 0, 0);
  COUPLES.forEach(c => { c.b.visible = true; c.b.userData.size(0.95); });
  el.flash.style.opacity = 0;
}
const TP = 0.45; // 0.45秒で足首がひもで結ばれる
// カメラ：2人を正面から。d は距離、ty は見る高さ（大きいほど人が下に来る）
function aCam(u = 0, z0 = 0, d = 5.6, ty = 1.6) { look(lerp(0.5, 0.25, u), 1.7, z0 + d - 0.4 * u, 0, ty, z0, 50); }
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function tieRope(t, t0 = TP) { ROPE.visible = t > t0; const k = clamp((t - t0) / 0.15); ROPE.scale.y = 1 + (1 - k) * 1.5; ROPE.scale.z = 1 + (1 - k) * 1.5; }
function shot0(t) { // 0秒＝サムネ：彼氏が お前太りすぎ と言った瞬間、2人の足首が赤いひもでギュッと結ばれる
  reset(); lift(0); A_KARE.rotation.y = -0.35; A_KANO.rotation.y = 0.3; point(A_KARE, 1); A_KANO.userData.head.rotation.x = 0.15;
  futori.position.set(0.8, 2.27, 0.1); futori.visible = true; futori.userData.size(1.35);
  placeRope(ROPE, A_KANO, A_KARE, 0); tieRope(t);
  if (t > TP) { say(gyu, t, TP, -0.7, 0.6, 0.5, 0.75); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  aCam(ease(clamp(t / 3)), 0, 6.0, 1.85);
  return S;
}
function sFuman(t) { // 彼女たちの不満から。
  reset(); lift(0); ROPE.visible = false; A_KANO.rotation.y = 0.2; A_KARE.rotation.y = -0.35; A_KANO.userData.head.rotation.x = 0.25; A_KANO.userData.arms.forEach(a => a.rotation.set(0.05, 0, 0));
  look(-0.8, 1.7, 4.4, -0.25, 1.45, 0, 50);
  return S;
}
function sIware(t) { // 太っていないのに、彼氏に痩せろと言われ続ける。
  reset(); lift(0); ROPE.visible = false; A_KANO.rotation.y = 0.3; A_KARE.rotation.y = -0.35; point(A_KARE, 1); A_KANO.userData.head.rotation.x = 0.25;
  say(futtenai, t, 0.2, -0.55, 2.55, 0.2, 0.95);
  say(yasero, t, 1.3, 0.6, 2.25, 0.3, 0.85); if (t > 1.6) yasero.userData.size(0.85 * (1 + 0.1 * Math.sin(t * 18)));
  aCam(0.5, 0, 5.4, 1.45);
  return S;
}
function sRentai(t) { // ある日、痩せろは連帯責任になった。
  reset(); lift(0); A_KARE.rotation.y = -0.2; A_KANO.rotation.y = 0.2; placeRope(ROPE, A_KANO, A_KARE, 0); tieRope(t, 0.4);
  say(rentai, t, 0.4, 0, 2.5, 0.2, 1.3); el.flash.style.opacity = t > 0.4 && t < 0.5 ? 0.3 : 0;
  aCam(0.5, 0, 5.4, 1.35);
  return S;
}
function sOnaji(t) { // 言った男も、同じダイエットをする。
  reset(); lift(0); A_KARE.rotation.y = -0.15; A_KANO.rotation.y = 0.15; placeRope(ROPE, A_KANO, A_KARE, 0); A_KARE.userData.head.rotation.x = 0.2;
  say(onaji, t, 0.3, 0, 2.5, 0.2, 2.0); sweat.userData.set(clamp((t - 1) / 0.5), t);
  aCam(0.7, 0, 5.6, 1.4);
  return S;
}
function walkPair(t, sp = 7, amp = 0.5, opt) { const ph = t * sp; const s = legs3(A_KANO, A_KARE, ph, amp, opt); A_KANO.position.y = A_KARE.position.y = Math.abs(Math.cos(ph)) * 0.03; return s; }
function sStart(t) { // 二人三脚のスタート。
  reset(); lift(0); const z = t * 1.2; A_KANO.position.z = A_KARE.position.z = z; const s = walkPair(t); placeRope(ROPE, A_KANO, A_KARE, s);
  say(start, t, 0.2, 0, 2.5, z + 0.2, 1.0);
  look(0.8, 1.6, z + 5.4, 0, 1.4, z, 50);
  return S;
}
// ラーメン（斜め前から。彼氏・どんぶり・禁止のマーク）
function bHide() { B_KARE.visible = B_KANO.visible = ROPE_B.visible = false; }
function steamOn(t, x, y, z) { steam.forEach((m, i) => { m.visible = true; const k = ((t * 0.6 + i * 0.25) % 1); m.position.set(x + Math.sin(k * 6 + i) * 0.1, y + k * 0.8, z); m.material.opacity = 0.5 * (1 - k); m.scale.setScalar(0.8 + k); }); }
function sRamen(t) { // 夜のラーメン、禁止。
  reset(); lift(0); B_KARE.visible = B_KANO.visible = ROPE_B.visible = true; B_KARE.rotation.y = Math.PI - 0.5; B_KANO.rotation.y = Math.PI - 0.3; B_KARE.position.set(BX + 0.3, 0, 0.75); B_KANO.position.set(BX - 0.42, 0, 0.75);
  B_KARE.userData.arms[1].rotation.x = -1.2 * clamp(t / 0.6); B_KARE.userData.arms[0].rotation.x = -1.0 * clamp(t / 0.6);
  placeRope(ROPE_B, B_KANO, B_KARE, 0); steamOn(t, BX + 0.4, 1.5, -0.5);
  if (t > 1.0) { BAN[0].visible = true; BAN[0].position.set(BX + 0.4, 1.4, -0.2); BAN[0].scale.setScalar(easeOut(clamp((t - 1.0) / 0.2)) * 0.6); say(kinshi, t, 1.0, BX + 0.4, 2.35, -0.2, 0.75); el.flash.style.opacity = t < 1.1 ? 0.3 : 0; }
  look(BX + 2.0, 2.1, 4.6, BX + 0.1, 1.45, -0.3, 50);
  return S;
}
function sTomaru(t) { // 彼氏の足が止まる。
  reset(); lift(0); B_KARE.visible = B_KANO.visible = ROPE_B.visible = true; B_KARE.rotation.y = 0; B_KANO.rotation.y = 0; B_KARE.position.set(BX + 0.12, 0, 1.6); B_KANO.position.set(BX - 0.6, 0, 1.6);
  const s = legs3(B_KANO, B_KARE, t * 7, 0.45 * clamp(1 - t / 0.8)); placeRope(ROPE_B, B_KANO, B_KARE, s);
  B_KARE.userData.head.rotation.y = Math.PI * 0.45 * clamp((t - 0.6) / 0.4); BAN[0].visible = true; BAN[0].position.set(BX + 0.4, 1.4, -0.2); BAN[0].scale.setScalar(0.6); steamOn(t, BX + 0.4, 1.5, -0.5);
  say(tomaru, t, 0.8, BX - 0.25, 2.55, 1.7, 0.75);
  look(BX + 1.4, 1.75, 6.6, BX, 1.35, 0.6, 50);
  return S;
}
// からあげとビール
function sKaraage(t) { // コンビニのからあげ、禁止。
  reset(); lift(0); C_KARE.position.set(CX + 0.35, 0, 0.8); C_KARE.rotation.y = Math.PI + 0.6; C_KARE.userData.arms[1].rotation.x = -1.3 * clamp(t / 0.6);
  if (t > 1.0) { BAN[1].visible = true; BAN[1].position.set(CX - 0.9, 1.65, -0.1); BAN[1].scale.setScalar(easeOut(clamp((t - 1.0) / 0.2)) * 0.75); el.flash.style.opacity = t < 1.1 ? 0.3 : 0; }
  look(CX + 0.3, 2.0, 4.8, CX - 0.3, 1.5, -0.3, 50);
  return S;
}
function sBeer(t) { // そしてビールも、禁止。
  reset(); lift(0); C_KARE.position.set(CX, 0, 0.75); C_KARE.rotation.y = Math.PI - 0.3; C_KARE.userData.arms[0].rotation.x = -1.3 * clamp(t / 0.6); BAN[1].visible = true; BAN[1].position.set(CX - 0.9, 1.65, -0.1); BAN[1].scale.setScalar(0.75);
  if (t > 0.9) { BAN[2].visible = true; BAN[2].position.set(CX + 0.9, 1.42, -0.1); BAN[2].scale.setScalar(easeOut(clamp((t - 0.9) / 0.2)) * 0.6); el.flash.style.opacity = t < 1.0 ? 0.3 : 0; }
  if (t > 1.6) { C_KARE.userData.head.rotation.x = 0.35; say(shobon, t, 1.6, CX - 0.3, 2.55, 0.9, 0.5); }
  look(CX - 0.4, 2.0, 5.0, CX + 0.1, 1.5, -0.3, 50);
  return S;
}
// 1週間後
function sWeek(t) { // 1週間後。息を切らしているのは、彼氏のほう。
  reset(); lift(0); const z = t * 0.9; A_KANO.position.z = A_KARE.position.z = z; const s = walkPair(t, 6, 0.45, { drag: 0.5 }); placeRope(ROPE, A_KANO, A_KARE, s);
  A_KARE.rotation.x = 0.25; A_KARE.userData.head.rotation.x = 0.3; A_KARE.userData.arms.forEach(a => a.rotation.set(0.1, 0, 0)); sweat.userData.set(1, t);
  say(week, t, 0.1, -0.5, 2.6, z + 0.3, 0.9);
  if (t > 1.4) say(hah, t, 1.4, 0.55, 2.25, z + 0.4, 1.0);
  look(1.0, 1.65, z + 5.4, 0, 1.4, z, 50);
  return S;
}
function sFutsu(t) { // 彼女は普通に歩いている。
  reset(); lift(0); const z = t * 1.1; A_KANO.position.z = A_KARE.position.z = z; const s = walkPair(t, 7, 0.5, { drag: 0.7 }); placeRope(ROPE, A_KANO, A_KARE, s);
  A_KARE.rotation.x = 0.3; A_KARE.userData.head.rotation.x = 0.35; sweat.userData.set(1, t);
  say(futsu, t, 0.3, -0.3, 2.5, z + 0.2, 1.4);
  look(-1.3, 1.65, z + 5.0, -0.1, 1.4, z, 50);
  return S;
}
function sHikizu(t) { // ひもに引きずられているのは、彼氏。
  reset(); lift(0); const z = t * 1.1; A_KANO.position.z = z; A_KARE.position.z = z - 0.15; const s = walkPair(t, 7, 0.5, { drag: 1 }); placeRope(ROPE, A_KANO, A_KARE, s);
  A_KARE.rotation.x = -0.35; A_KARE.userData.legs[1].rotation.x = -0.6; A_KARE.userData.arms.forEach(a => a.rotation.set(-0.6, 0, 0)); A_KARE.position.y = 0.05; sweat.userData.set(1, t);
  say(hikizu, t, 0.4, 0.3, 2.5, z + 0.2, 1.15);
  look(2.6, 1.6, z + 4.6, 0.1, 1.3, z, 50);
  return S;
}
function sKizuku(t) { // 彼氏は気づく。体力がないのは、自分のほうだった。
  reset(); lift(0); A_KARE.rotation.x = 0.35; A_KARE.userData.arms[0].rotation.set(-0.7, 0, 0.3); A_KARE.userData.arms[1].rotation.set(-0.7, 0, -0.3); A_KARE.userData.head.rotation.x = 0.25; sweat.userData.set(1, t);
  A_KANO.rotation.y = 0.5; placeRope(ROPE, A_KANO, A_KARE, 0);
  say(jibun, t, 0.8, 0.1, 2.45, 0.3, 1.75);
  look(0.9, 1.6, 4.8, 0.15, 1.35, 0, 50);
  return S;
}
// 日本中
function sNihon(t) { // その日から、日本中の男の口から、痩せろが消えた。
  reset(); lift(0); A_KARE.visible = A_KANO.visible = false; ROPE.visible = false;
  COUPLES.forEach((c, i) => { const ti = 0.8 + i * 0.15; c.b.visible = t < ti; c.b.userData.size(1.3); c.b.position.y = 2.6; });
  sparkD.set(clamp((t - 0.8) / 2.0));
  if (t > 2.4) say(kieta, t, 2.4, DX, 4.6, -4, 3.2);
  look(DX + lerp(2.5, 1.5, ease(clamp(t / 4))), 6.0, 7.5, DX, 1.4, -6, 50);
  return S;
}
function sKekka(t) { // 結果：痩せろと言った男ほど、最初に音を上げた。
  reset(); lift(120); A_KARE.position.set(0.5, -0.76, 0.3); A_KARE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); A_KARE.rotation.x = 0.2; A_KARE.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); A_KARE.userData.head.rotation.x = 0.35; sweat.userData.set(1, t);
  ROPE.visible = false;
  A_KANO.rotation.y = 0.6; A_KANO.userData.head.rotation.x = 0.2;
  say(give, t, 0.5, 0.35, 1.9, 0.4, 1.15);
  const u = ease(clamp(t / 5)); look(lerp(0.8, 1.4, u), lerp(1.6, 2.1, u), lerp(4.6, 5.6, u), 0.1, 1.1, 0, 50);
  return S;
}
function sKakegoe(t) { // 痩せろは、自分は走らない人の掛け声
  reset(); lift(140); ROPE.visible = false; bench.visible = true; bench.position.set(-0.6, 0, -0.6);
  A_KARE.position.set(-0.6, -0.39, -0.5); A_KARE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); A_KARE.rotation.y = 0.6; A_KARE.userData.arms[1].rotation.set(-1.5, 0, 0); A_KARE.userData.arms[0].rotation.set(-1.3, 0, 0);
  MEGA.visible = true; MEGA.rotation.set(0, 0.6, 0); MEGA.position.set(-0.6 + Math.sin(0.6) * 0.32, 1.38, -0.5 + Math.cos(0.6) * 0.32);
  A_KANO.position.set(-0.4 + t * 0.7, 0, -3.2); A_KANO.rotation.y = Math.PI / 2; const ph = t * 8; A_KANO.userData.legs[0].rotation.x = Math.sin(ph) * 0.6; A_KANO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.6; A_KANO.userData.arms[0].rotation.x = -Math.sin(ph) * 0.6; A_KANO.userData.arms[1].rotation.x = Math.sin(ph) * 0.6;
  say(yasero, t, 0.3, 0.3, 2.15, 0.2, 0.85);
  if (t > 1.2) say(kakegoe, t, 1.2, -0.55, 2.6, -0.3, 1.2);
  look(0.6, 1.7, 5.4, 0.3, 1.4, -0.4, 50);
  return S;
}
function sKamo(t) { // だったのかもしれない。
  reset(); lift(220); ROPE.visible = false; A_KANO.visible = false; bench.visible = true; bench.position.set(-0.6, 0, -0.6);
  A_KARE.position.set(-0.6, -0.39, -0.5); A_KARE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); A_KARE.userData.head.rotation.x = 0.3; MEGA.visible = true; MEGA.position.set(0.1, 0.56, -0.6); MEGA.rotation.set(0, 0, Math.PI / 2);
  const u = ease(clamp(t / 3)); look(lerp(0.4, 0.8, u), 1.6, lerp(4.4, 5.4, u), -0.3, 1.1, -0.5, 50);
  return S;
}
function sAsk(t) { // 恋人に痩せろと言う、あり？なし？（冒頭と同じ構図）
  reset(); lift(0); A_KARE.rotation.y = -0.35; A_KANO.rotation.y = 0.3; point(A_KARE, 1); placeRope(ROPE, A_KANO, A_KARE, 0);
  futori.position.set(0.8, 2.27, 0.1); futori.visible = true; futori.userData.size(1.35);
  aCam(0, 0, 6.0, 1.85);
  return S;
}

const NARR = { '痩せろ': 'やせろ', '1週間後': 'いっしゅうかんご', '二人三脚': 'ににんさんきゃく', '結果：': '結果、', '音を上げた': 'ねをあげた', '掛け声': 'かけごえ', '日本中': 'にほんじゅう', '連帯責任': 'れんたいせきにん', '息を切らして': 'いきをきらして', '引きずられて': 'ひきずられて', '体力': 'たいりょく' };
const P = planTimes([
  ['彼女たちの不満から。', sFuman],
  ['太っていないのに、彼氏に<br>痩せろと言われ続ける。', sIware],
  ['ある日、痩せろは<br>連帯責任になった。', sRentai],
  ['言った男も、<br>同じダイエットをする。', sOnaji],
  ['二人三脚のスタート。', sStart],
  ['夜のラーメン、禁止。', sRamen],
  ['彼氏の足が止まる。', sTomaru],
  ['コンビニのからあげ、禁止。', sKaraage],
  ['そしてビールも、禁止。', sBeer],
  ['1週間後。息を切らして<br>いるのは、彼氏のほう。', sWeek],
  ['彼女は普通に歩いている。', sFutsu],
  ['ひもに引きずられて<br>いるのは、彼氏。', sHikizu],
  ['彼氏は気づく。体力が<br>ないのは、自分のほうだった。', sKizuku],
  ['その日から、日本中の男の<br>口から、痩せろが消えた。', sNihon],
  ['結果：痩せろと言った男ほど、<br>最初に音を上げた。', sKekka],
  ['痩せろは、自分は<br>走らない人の掛け声', sKakegoe],
  ['だったのかもしれない。', sKamo],
  ['恋人に痩せろと言う、<br>あり？なし？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0657',
    v2: true,
    hookLine: '彼氏が お前太りすぎ と言った瞬間、2人の足首が赤いひもでギュッと結ばれる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも痩せろが連帯責任だったら？',
    titleHtml: 'もしも痩せろが<br>連帯責任<br>だったら？',
    mood: 'tension', seed: 657, hits: [0.45, P.at(14), P.at(15)], risers: [P.at(9)], impacts: [P.at(2, 0.4), P.at(5, 1.0), P.at(7, 1.0), P.at(8, 0.9), P.at(13, 2.4), P.at(14, 0.5)],
    sfx: [[0.45, 'poof'], [P.at(1, 1.4), 'bubble'], [P.at(2, 0.4), 'poof'], [P.at(4, 0.2), 'whoosh'], [P.at(5, 1.0), 'alarm'], [P.at(6, 0.8), 'buzz'], [P.at(7, 1.0), 'alarm'], [P.at(8, 0.9), 'alarm'], [P.at(9, 1.4), 'meter', 0.3], [P.at(11, 0.4), 'whoosh'], [P.at(13, 1.0), 'poof'], [P.at(14, 0.5), 'poof']],
    narr: NARR,
    ask: '恋人に痩せろと言う、あり？なし？',
    caption: 'もしも痩せろが連帯責任だったら？\n\n彼女たちの不満から。太っていないのに、彼氏に痩せろと言われ続ける。\nある日、痩せろは連帯責任になった。言った男も、同じダイエットをする。\n二人三脚のスタート。\n夜のラーメン、禁止。彼氏の足が止まる。\nコンビニのからあげ、禁止。そしてビールも、禁止。\n1週間後。息を切らしているのは、彼氏のほう。彼女は普通に歩いている。ひもに引きずられているのは、彼氏。\n彼氏は気づく。体力がないのは、自分のほうだった。\nその日から、日本中の男の口から、痩せろが消えた。\n\n結果：痩せろと言った男ほど、最初に音を上げた。\n痩せろは、自分は走らない人の掛け声だったのかもしれない。\n\n恋人に痩せろと言う、あり？なし？ コメントで教えて。\n\n※風刺ネタです。痩せろが連帯責任になるのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', 'ダイエット', '体型いじり', 'カップル'],
    endStats: [['禁止になったのは', 'ラーメン・からあげ・ビール', ''], ['1週間後に息を切らしたのは', '彼氏', 'もしもの結果'], ['痩せろの正体', '走らない人の掛け声', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
