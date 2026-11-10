import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも客にも店員からの口コミ評価が付いたら？（皮肉回・台本 S59・図星／大人の本音）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。0639 店員が客を出禁にできたら（インスタ 平均の5.4倍）と同じ 言う側が言われる側に回る 立場の入れ替え
// 数字は使わない。実在の口コミサイト・ラーメン店・美容院・タクシー会社の見た目は出さない（全部架空）。叩かれる側は 客という立場（男女の偏りを出さない）

const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
// 星の札（★の数）
function starTag(n) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 200; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.97)'; g.beginPath(); g.roundRect(8, 8, 624, 184, 36); g.fill(); g.strokeStyle = n <= 1 ? '#d62a2a' : '#e8a020'; g.lineWidth = 10; g.stroke();
  g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) { g.fillStyle = i < n ? '#f2b420' : '#d8d8d8'; g.fillText('★', 96 + i * 112, 106); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.renderOrder = 7; sp.scale.set(1.3, 1.3 * 200 / 640, 1); sp.userData.k = 1.3; return sp;
}
function tagPop(sp, t, t0, k = 1.3) { const u = clamp((t - t0) / 0.25); sp.visible = u > 0; const s = k * (u < 1 ? easeOut(u) * 1.15 - 0.15 * u * u : 1); sp.scale.set(s, s * 200 / 640, 1); }
const OJI = () => { const p = makeOji(rng(59), { shirt: '#7a6a55', pants: '#3b3f4a' }); return p; };

// ---------- A：スーパーのレジの列（原点） ----------
flat(14, 14, '#e4e2dc', 0, -1.5);
const aWall = box(14, 3.4, 0.2, mat('#f2f0ea')); aWall.position.set(0, 1.7, -6.5); S.add(aWall);
const REGIS = []; for (const x of [-1.6, 1.6]) { const g = new THREE.Group(); const c = box(1.0, 0.9, 1.8, mat('#d8d8d4')); c.position.y = 0.45; g.add(c); const m = box(0.3, 0.35, 0.4, mat('#2a2e38')); m.position.set(0, 1.1, -0.4); g.add(m); g.position.set(x, 0, -1.6); S.add(g); REGIS.push(g); }
const CLERK = makeWoman({ shirt: '#5a9a6a', hair: '#3a2620' }); S.add(CLERK);
const CLERK2 = makeMan({ shirt: '#5a9a6a', hair: '#2a2420' }); S.add(CLERK2);
const HERO = OJI(); S.add(HERO); const sweat = makeSweat(); HERO.userData.head.add(sweat);
const LINE = [makeWoman({ shirt: '#c9a8d8', hair: '#6b4a33' }), makeMan({ shirt: '#4f6a8f' }), makeWoman({ shirt: '#9fc7a8', hair: '#2a2020' })]; LINE.forEach(p => S.add(p));
const NEXT = makeWoman({ shirt: '#e98a7a', hair: '#8a5a3a', pants: '#3a3f4e' }); S.add(NEXT); // 隣のレジの客
const TAG1 = starTag(1); S.add(TAG1); const TAGS = [4, 5, 4].map(n => { const s = starTag(n); S.add(s); return s; }); const TAG_N = starTag(2); S.add(TAG_N); const TAG_N2 = starTag(4); S.add(TAG_N2);
const pon = label('ポン', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(pon);
const kinou = label('昨日', { w: 400, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.7 }); S.add(kinou);
const chouBun = label('星1と長文', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); S.add(chouBun);
const sumimasen = label('すみません', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.1 }); S.add(sumimasen);
const arigatou = label('ありがとう', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(arigatou);
const egao = label('急に笑顔', { w: 600, size: 110, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.05 }); S.add(egao);

// ---------- B：ラーメン屋の前（x=60）：本日は満席です ----------
const BX = 60;
flat(14, 10, '#b9b4aa', BX, 0);
const shop = box(8, 4.2, 5, mat('#e8d6b0')); shop.position.set(BX, 2.1, -4); S.add(shop);
const noren = new THREE.Group(); for (let i = 0; i < 4; i++) { const n = box(0.6, 0.9, 0.04, mat('#2a3a6a')); n.position.set(BX - 0.95 + i * 0.63, 2.15, -1.47); noren.add(n); } S.add(noren);
const shopDoor = box(2.4, 2.4, 0.05, mat('#6a4a30')); shopDoor.position.set(BX, 1.2, -1.49); S.add(shopDoor);
const shopSign = label('もしもラーメン', { w: 900, size: 110, color: '#fff', bg: 'rgba(42,58,106,.96)', sx: 2.6 }); shopSign.position.set(BX, 3.6, -1.3); S.add(shopSign);
const mansekiC = document.createElement('canvas'); mansekiC.width = 400; mansekiC.height = 560; { const g = mansekiC.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 400, 560); g.strokeStyle = '#d62a2a'; g.lineWidth = 12; g.strokeRect(14, 14, 372, 532); g.fillStyle = '#d62a2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.fillText('本日は', 200, 200); g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.fillText('満席', 200, 320); g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.fillText('です', 200, 430); }
const mansekiT = new THREE.CanvasTexture(mansekiC); mansekiT.colorSpace = THREE.SRGBColorSpace;
const MANSEKI = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.98), new THREE.MeshBasicMaterial({ map: mansekiT })); MANSEKI.position.set(BX + 1.6, 1.4, -1.44); S.add(MANSEKI);
const B_OJI = OJI(); S.add(B_OJI);
const TAG_B = starTag(1); S.add(TAG_B);
const clockB = label('12:00', { w: 512, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.95 }); S.add(clockB);

// ---------- C：スマホの画面（x=120）：美容院の予約・自分への口コミ ----------
const CX = 120;
flat(10, 8, '#c8a878', CX, 0);
const cWall = box(10, 3.2, 0.2, mat('#efe8da')); cWall.position.set(CX, 1.6, -2.4); S.add(cWall);
const C_OJI = OJI(); S.add(C_OJI);
const PHONE = makePhone({ w: 0.9, h: 1.8 }); S.add(PHONE.g);
function drawPhone(mode, t = 0) { PHONE.draw(mode + (mode === 'reviews' ? Math.min(3, Math.floor(t / 0.9)) : ''), (g, w, h) => {
  g.fillStyle = '#f6f6f8'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (mode === 'salon') { g.fillStyle = '#c87aa0'; g.fillRect(0, 0, w, 170); g.fillStyle = '#fff'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.fillText('もしも美容室', w / 2, 70); g.font = '800 40px "Noto Sans CJK JP", sans-serif'; g.fillText('ご予約', w / 2, 132);
    g.fillStyle = '#fff'; g.fillRect(30, 330, w - 60, 360); g.strokeStyle = '#d62a2a'; g.lineWidth = 8; g.strokeRect(30, 330, w - 60, 360); g.fillStyle = '#d62a2a'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.fillText('星2以下の方は', w / 2, 440); g.fillText('受付できません', w / 2, 540); g.fillStyle = '#f2b420'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('★★☆☆☆', w / 2, 630); }
  else { g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, w, 170); g.fillStyle = '#fff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText('あなたへの口コミ', w / 2, 70); g.fillStyle = '#f2b420'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.fillText('★☆☆☆☆', w / 2, 135);
    const n = Math.min(3, Math.floor(t / 0.9) + 1); ['声が大きい', 'お釣りを投げる', '店員を指で呼ぶ'].slice(0, n).forEach((s, i) => { g.fillStyle = '#fff'; g.fillRect(24, 220 + i * 240, w - 48, 210); g.fillStyle = '#d62a2a'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText('★☆☆☆☆', w / 2, 270 + i * 240); g.fillStyle = '#222'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText(s, w / 2, 355 + i * 240); }); }
}); }

// ---------- D：夜の道（x=180）：タクシーが 回送 に ----------
const DX = 180;
flat(40, 20, '#3a3e46', DX, 0, -0.85);
const walk = flat(40, 3, '#8a8a90', DX, 3.5, -0.8, 0.02);
for (let i = 0; i < 6; i++) { const b = box(5, 6 + (i % 3) * 3, 5, mat(['#5a6070', '#4a5060', '#606878'][i % 3])); b.position.set(DX - 15 + i * 6, (6 + (i % 3) * 3) / 2, -8); S.add(b); for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: k % 3 ? '#ffe9a8' : '#3a3e48' })); w.position.set(DX - 16.2 + i * 6 + (k % 3) * 1.2, 2 + Math.floor(k / 3) * 2, -5.48); S.add(w); } }
const lampP = box(0.12, 4, 0.12, mat('#5a5e66')); lampP.position.set(DX + 2.5, 2, 4.6); S.add(lampP); const lampL = new THREE.PointLight(0xffe0b0, 8, 10, 1.4); lampL.position.set(DX + 2.5, 3.8, 4.0); S.add(lampL);
const TAXI = new THREE.Group(); { const b = box(1.7, 0.7, 4.2, mat('#2a3a6a')); b.position.y = 0.6; TAXI.add(b); const c = box(1.5, 0.6, 2.2, mat('#2a3a6a')); c.position.set(0, 1.25, -0.2); TAXI.add(c); const gl = box(1.52, 0.4, 2.0, mat('#1a2030')); gl.position.set(0, 1.27, -0.2); TAXI.add(gl); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), mat('#111')); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.82, 0.32, sz * 1.35); TAXI.add(w); } for (const s of [-1, 1]) { const hl = box(0.3, 0.12, 0.03, new THREE.MeshBasicMaterial({ color: '#fff6d0' })); hl.position.set(s * 0.55, 0.7, 2.11); TAXI.add(hl); } } S.add(TAXI);
const roofC = document.createElement('canvas'); roofC.width = 360; roofC.height = 160; const roofT = new THREE.CanvasTexture(roofC); roofT.colorSpace = THREE.SRGBColorSpace;
let roofKey = ''; function drawRoof(s) { if (s === roofKey) return; roofKey = s; const g = roofC.getContext('2d'); g.fillStyle = s === '回送' ? '#d62a2a' : '#2a8a4a'; g.fillRect(0, 0, 360, 160); g.fillStyle = '#fff'; g.font = '900 100px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 180, 86); roofT.needsUpdate = true; }
const ROOF = new THREE.Sprite(new THREE.SpriteMaterial({ map: roofT, depthTest: false })); ROOF.renderOrder = 6; ROOF.scale.set(1.3, 0.58, 1); S.add(ROOF);
const D_OJI = OJI(); S.add(D_OJI); const TAG_D = starTag(1); S.add(TAG_D);
const clockD = label('21:00', { w: 512, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.95 }); S.add(clockD);

// ---------- E：透明人間のマント（x=240）：部屋でレビューを書く ----------
const EX = 240;
flat(10, 8, '#8a7a6a', EX, 0);
const eWall = box(10, 3.2, 0.2, mat('#d8d0c4')); eWall.position.set(EX, 1.6, -2.4); S.add(eWall);
const E_OJI = OJI(); S.add(E_OJI);
const CAPE = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.5, 18, 1, true), new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); S.add(CAPE);
const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); S.add(hood);
const mantLab = label('透明人間のマント', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.8 }); S.add(mantLab);
const E_PHONE = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(E_PHONE);
const sparkE = makeSparkles(140, 0.16, 0xcfe8ff); S.add(sparkE.points); sparkE.init([[EX, 1.4, 0.2]], 0.7, 1.2);

const PEOPLE = [CLERK, CLERK2, HERO, ...LINE, NEXT, B_OJI, C_OJI, D_OJI, E_OJI];
const LABELS = [pon, kinou, chouBun, sumimasen, arigatou, egao, clockB, clockD, mantLab];
const ALLTAGS = [TAG1, ...TAGS, TAG_N, TAG_N2, TAG_B, TAG_D];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); ALLTAGS.forEach(s => s.visible = false); sweat.userData.set(0); PHONE.g.visible = false; CAPE.visible = hood.visible = false; CAPE.material.opacity = hood.material.opacity = 0.35; sparkE.set(0); E_PHONE.visible = false;
  CLERK.position.set(-1.6, 0, -2.6); CLERK2.position.set(1.6, 0, -2.6);
  HERO.position.set(-1.6, 0, -0.1); HERO.rotation.y = Math.PI; LINE.forEach((p, i) => { p.position.set(-1.6 + (i % 2) * 0.15, 0, 0.9 + i * 0.95); p.rotation.y = Math.PI; });
  NEXT.position.set(1.6, 0, -0.1); NEXT.rotation.y = Math.PI;
  B_OJI.position.set(BX, 0, 0.6); B_OJI.rotation.y = Math.PI; C_OJI.position.set(CX, 0, 0); D_OJI.position.set(DX, 0, 3.6); E_OJI.position.set(EX, 0, 0);
  TAXI.position.set(DX - 14, 0, 0.6); TAXI.rotation.y = Math.PI / 2; drawRoof('空車'); ROOF.visible = false;
  hemi.intensity = 1.25; S.background.set('#a8cce8'); S.fog.color.set('#a8cce8'); el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function tagAt(sp, p, t, t0, k = 1.0, dy = 2.25) { sp.position.set(p.position.x, p.position.y + dy, p.position.z); tagPop(sp, t, t0, k); }
const TP = 0.45;
function lineCam(u = 0) { look(lerp(0.4, 0.2, u), 2.1, lerp(-5.4, -5.1, u), -1.3, 2.25, 0.8, 50); }
function shot0(t) { // 0秒＝サムネ：レジに並ぶ客の頭の上に、星1つの札がポンと浮かぶ
  reset(); lift(0); NEXT.visible = false; HERO.userData.arms[1].rotation.set(-0.4, 0, 0.2);
  tagAt(TAG1, HERO, t, TP, 1.1); LINE.forEach((p, i) => tagAt(TAGS[i], p, t, TP + 0.08 + i * 0.06, 0.85));
  if (t > TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; say(pon, t, TP + 0.05, -0.75, 1.7, -0.6, 0.45); }
  lineCam(ease(clamp(t / 3)));
  return S;
}
function sKinou(t) { // 昨日、ラーメン屋に星1を付けたおじさん。
  reset(); lift(80); HERO.rotation.y = 0.3; HERO.userData.arms[1].rotation.set(-1.3, 0, -0.2); tagAt(TAG1, HERO, t, 0, 1.1);
  say(kinou, t, 0.1, -2.3, 2.7, -0.1, 0.7);
  PHONE.g.visible = true; PHONE.g.scale.setScalar(0.3); drawPhone('reviews', 0); PHONE.g.position.set(-1.55, 1.42, 0.25); PHONE.g.rotation.set(-0.3, 0.3, 0);
  look(-0.6, 1.9, 3.4, -1.6, 1.9, -0.1, 50);
  return S;
}
function sKatamaru(t) { // 自分の頭の上を見上げて固まる。
  reset(); lift(80); HERO.rotation.y = 0.3; HERO.userData.head.rotation.x = -0.55 * easeOut(clamp(t / 0.6)); tagAt(TAG1, HERO, t, 0, 1.1); sweat.userData.set(clamp((t - 0.8) / 0.4), t);
  look(-0.4, 1.6, 3.0, -1.6, 2.2, -0.1, 50);
  return S;
}
function sFuman(t) { // 店員たちの不満から。
  reset(); lift(80); CLERK.rotation.y = 0.0; CLERK.userData.head.rotation.x = 0.2; CLERK2.userData.head.rotation.x = 0.2; HERO.visible = false; LINE.forEach(p => p.visible = false); NEXT.visible = false;
  look(-1.0, 1.8, 0.8, -1.6, 1.5, -2.6, 50);
  return S;
}
function sChoubun(t) { // 少し待たせただけで、星1と長文が届く。
  reset(); lift(80); HERO.visible = false; LINE.forEach(p => p.visible = false); NEXT.visible = false; CLERK.userData.head.rotation.x = 0.35; CLERK.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0));
  PHONE.g.visible = true; PHONE.g.scale.setScalar(0.35); drawPhone('reviews', 0); PHONE.g.position.set(-1.6, 1.25, -2.25); PHONE.g.rotation.set(-0.6, 0, 0);
  say(chouBun, t, 0.4, -1.4, 2.2, -2.4, 1.05);
  look(-0.8, 1.8, 0.4, -1.4, 1.5, -2.6, 50);
  return S;
}
function ramenCam(u = 0) { look(BX + lerp(1.6, 1.2, u), 1.8, lerp(5.2, 4.6, u), BX + 0.6, 1.5, -0.8, 50); }
function sRamen(t) { // お昼。星1のおじさんに、ラーメン屋が
  reset(); lift(100); B_OJI.position.z = 1.5 - clamp(t / 2) * 0.9; tagAt(TAG_B, B_OJI, t, 0, 1.0); const ph = t * 7; B_OJI.userData.legs[0].rotation.x = Math.sin(ph) * 0.4 * (t < 2 ? 1 : 0); B_OJI.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4 * (t < 2 ? 1 : 0);
  say(clockB, t, 0, BX - 2.4, 3.2, -1.3, 0.95); clockB.visible = true; clockB.userData.set('12:00');
  setHud('お昼', 'ラーメン屋', 1); ramenCam(ease(clamp(t / 3)));
  return S;
}
function sManseki(t) { // 本日は満席です。
  reset(); lift(100); B_OJI.position.z = 0.6; tagAt(TAG_B, B_OJI, t, 0, 1.0); B_OJI.userData.head.rotation.y = 0.5;
  const k = easeOut(clamp((t - 0.2) / 0.3)); MANSEKI.scale.setScalar(0.4 + 0.6 * k);
  setHud('お昼', 'ラーメン屋', 1); lift(260); look(BX + 1.6, 1.6, 2.6, BX + 1.3, 1.5, -1.4, 50);
  return S;
}
function sSalon(t) { // 夕方。美容院の予約画面に、星2以下の方は受付できません。
  reset(); lift(100); C_OJI.userData.arms[1].rotation.set(-1.5, 0, -0.3); C_OJI.userData.head.rotation.x = 0.3;
  PHONE.g.visible = true; PHONE.g.scale.setScalar(1); drawPhone('salon'); PHONE.g.position.set(CX, 1.85, 0.9); PHONE.g.rotation.set(0, 0, 0);
  setHud('夕方', '美容院', 1); look(CX + 0.2, 1.9, 3.1, CX, 1.75, 0.6, 50);
  return S;
}
function nightEnv() { hemi.intensity = 0.55; S.background.set('#1a2034'); S.fog.color.set('#1a2034'); }
function sTaxi(t, d) { // 夜。手を挙げたタクシーが、
  reset(); lift(100); nightEnv(); D_OJI.userData.arms[1].rotation.set(0, 0, 2.7); D_OJI.rotation.y = -Math.PI / 2 + 0.3; tagAt(TAG_D, D_OJI, t, 0, 1.0);
  const k = clamp(t / d); TAXI.position.x = DX - 14 + 12 * ease(k); ROOF.visible = true; ROOF.position.set(TAXI.position.x, 1.95, 0.6); drawRoof('空車');
  setHud('夜', '21:00', 1); look(DX + 3.0, 1.9, 8.4, DX - 1.0, 1.4, 2.0, 50);
  return S;
}
function sKaiso(t) { // 目の前で 回送 に変わる。
  reset(); lift(100); nightEnv(); D_OJI.userData.arms[1].rotation.set(0, 0, 2.7 * clamp(1 - (t - 0.8) / 0.5)); D_OJI.rotation.y = -Math.PI / 2 + 0.3; tagAt(TAG_D, D_OJI, t, 0, 1.0);
  TAXI.position.x = DX - 2 + Math.max(0, t - 0.4) * 6; ROOF.visible = true; ROOF.position.set(TAXI.position.x, 1.95, 0.6); drawRoof(t > 0.4 ? '回送' : '空車'); if (t > 0.4 && t < 0.5) el.flash.style.opacity = 0.25;
  setHud('夜', '21:00', 1); look(DX + 3.0, 1.9, 8.4, DX + 0.5, 1.4, 2.0, 50);
  return S;
}
function sReview(t) { // おじさんはスマホで、自分への口コミを開く。
  reset(); lift(100); C_OJI.userData.arms[1].rotation.set(-1.5, 0, -0.3); C_OJI.userData.head.rotation.x = 0.3;
  PHONE.g.visible = true; PHONE.g.scale.setScalar(1); drawPhone('reviews', 0); PHONE.g.position.set(CX, 1.85, 0.9); PHONE.g.rotation.set(0, 0, 0);
  look(CX + 0.2, 1.9, 3.1, CX, 1.75, 0.6, 50);
  return S;
}
function sKoe(t) { // 声が大きい。お釣りを投げる。店員を指で呼ぶ。
  reset(); lift(100); C_OJI.userData.arms[1].rotation.set(-1.5, 0, -0.3); C_OJI.userData.head.rotation.x = 0.3; sweat.userData.set(0);
  PHONE.g.visible = true; PHONE.g.scale.setScalar(1); drawPhone('reviews', t); PHONE.g.position.set(CX, 1.85, 0.9); PHONE.g.rotation.set(0, 0, 0);
  look(CX + 0.1, 1.85, 2.5, CX, 1.8, 0.6, 50);
  return S;
}
function sTsugi(t, d) { // 次の日。おじさんは、すみませんとありがとうを言ってから注文する。
  reset(); lift(80); HERO.position.set(-1.6, 0, -1.0); HERO.rotation.y = Math.PI; HERO.rotation.x = 0.35 * Math.abs(Math.sin(t * 2)); tagAt(TAG1, HERO, t, 0, 1.1);
  LINE.forEach(p => p.visible = false); NEXT.visible = false; CLERK.rotation.y = 0;
  say(sumimasen, t, 0.3, -2.3, 2.55, -1.0, 1.0); if (t > d * 0.5) say(arigatou, t, d * 0.5, -0.9, 2.55, -1.0, 1.0);
  setHud('次の日', 'レジ', 1); look(-0.2, 2.0, 2.6, -1.6, 1.6, -1.6, 50);
  return S;
}
function sTonari(t, d) { // 隣のレジの、態度が悪いと言い続けていた客も、急に笑顔になる。
  reset(); lift(80); HERO.position.set(-1.6, 0, -1.0); HERO.rotation.x = 0.3; tagAt(TAG1, HERO, t, 0, 1.1); LINE.forEach(p => p.visible = false);
  NEXT.position.set(1.6, 0, -1.0); const k = clamp((t - 1.0) / 0.4); NEXT.userData.arms[1].rotation.set(-1.2 * (1 - k), 0, 0.3 * (1 - k)); NEXT.userData.arms[0].rotation.set(0, 0, -0.4 * k); NEXT.userData.head.rotation.z = 0.15 * k;
  TAG_N.position.set(1.6, 2.25, -1.0); TAG_N.visible = t < 1.2; TAG_N.scale.set(0.95, 0.95 * 200 / 640, 1); if (t >= 1.2) tagAt(TAG_N2, NEXT, t, 1.2, 0.95);
  if (t > 1.2) say(egao, t, 1.3, 1.6, 2.85, -1.0, 1.0);
  look(4.4, 2.1, -3.0, 1.6, 1.8, -0.6, 55);
  return S;
}
function sKekka(t, d) { // 結果：星を付けられて、客は初めて、自分も見られている側だと知った。
  reset(); lift(240); HERO.userData.head.rotation.x = 0.2; HERO.rotation.y = Math.PI; tagAt(TAG1, HERO, t, 0, 1.1); LINE.forEach((p, i) => tagAt(TAGS[i], p, t, 0, 0.85)); NEXT.rotation.y = Math.PI; tagAt(TAG_N2, NEXT, t, 0, 0.85);
  CLERK.userData.head.rotation.y = Math.sin(t) * 0.3;
  const u = ease(clamp(t / d)); look(0, lerp(2.2, 2.5, u), -6.2, 0, 2.0, 0.8, lerp(68, 72, u));
  return S;
}
function sMant(t, d) { // 口コミは、書く側だけが着ていた、透明人間のマント
  reset(); lift(100); E_OJI.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); E_OJI.userData.head.rotation.x = 0.3; E_PHONE.visible = true; E_PHONE.position.set(EX, 1.32, 0.45); E_PHONE.rotation.x = -0.5;
  CAPE.visible = hood.visible = true; CAPE.position.set(EX, 1.1, -0.02); hood.position.set(EX, 1.86, -0.02);
  if (t > 0.6) say(mantLab, t, 0.6, EX, 2.6, 0, 1.7);
  look(EX + 1.0, 1.9, 3.4, EX, 1.5, 0, 50);
  return S;
}
function sKamo(t, d) { // だったのかもしれない。（マントが消えて、星1の札が出る）
  reset(); lift(100); E_OJI.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); E_OJI.userData.head.rotation.x = 0.3 - 0.6 * clamp((t - 0.6) / 0.4); E_PHONE.visible = true; E_PHONE.position.set(EX, 1.32, 0.45); E_PHONE.rotation.x = -0.5;
  const k = clamp(t / 0.6); CAPE.visible = hood.visible = k < 1; CAPE.material.opacity = hood.material.opacity = 0.35 * (1 - k); CAPE.position.set(EX, 1.1, -0.02); hood.position.set(EX, 1.86, -0.02); sparkE.set(clamp(t / 1.4));
  tagAt(TAG_B, E_OJI, t, 0.6, 1.0);
  look(EX + 1.0, 1.9, 3.4, EX, 1.5, 0, 50);
  return S;
}
function sAsk(t) { // お店の口コミ、星1つ付けたことある？（冒頭と同じ構図）
  reset(); lift(220); NEXT.visible = false; tagAt(TAG1, HERO, 1, 0, 1.1); LINE.forEach((p, i) => tagAt(TAGS[i], p, 1, 0, 0.85)); lineCam(0);
  return S;
}

const NARR = { '星1': 'ほしいち', '星2': 'ほしに', '星': 'ほし', '長文': 'ちょうぶん', '満席': 'まんせき', '本日': 'ほんじつ', '美容院': 'びよういん', '回送': 'かいそう', '口コミ': 'くちコミ', 'お釣り': 'おつり', '次の日': 'つぎのひ', '隣': 'となり', '結果：': '結果、', '透明人間': 'とうめいにんげん', '星1つ': 'ほしひとつ' };
const P = planTimes([
  ['昨日、ラーメン屋に<br>星1を付けたおじさん。', sKinou],
  ['自分の頭の上を見上げて固まる。', sKatamaru],
  ['店員たちの不満から。', sFuman],
  ['少し待たせただけで、<br>星1と長文が届く。', sChoubun],
  ['お昼。星1のおじさんに、<br>ラーメン屋が', sRamen],
  ['本日は満席です。', sManseki],
  ['夕方。美容院の予約画面に、<br>星2以下の方は受付できません。', sSalon],
  ['夜。手を挙げたタクシーが、', sTaxi],
  ['目の前で 回送 に変わる。', sKaiso],
  ['おじさんはスマホで、<br>自分への口コミを開く。', sReview],
  ['声が大きい。お釣りを投げる。<br>店員を指で呼ぶ。', sKoe],
  ['次の日。おじさんは、<br>すみませんとありがとうを', sTsugi],
  ['言ってから注文する。', (t, d) => sTsugi(t + 2.0, d + 2.0)],
  ['隣のレジの、態度が悪いと<br>言い続けていた客も、', sTonari],
  ['急に笑顔になる。', (t, d) => sTonari(t + 1.6, d)],
  ['結果：星を付けられて、<br>客は初めて、', sKekka],
  ['自分も見られている側だと<br>知った。', (t, d) => sKekka(t + 2.5, d + 2.5)],
  ['口コミは、書く側だけが<br>着ていた、', sMant],
  ['透明人間のマント', (t, d) => sMant(t + 1.0, d)],
  ['だったのかもしれない。', sKamo],
  ['お店の口コミ、<br>星1つ付けたことある？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0667',
    v2: true,
    tt: 'main',
    hookLine: 'レジに並ぶ客の頭の上に、星1つの札がポンと浮かぶ。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも客にも店員からの口コミ評価が付いたら？',
    titleHtml: 'もしも客にも<br>店員からの口コミ<br>評価が付いたら？',
    mood: 'tension', seed: 667, hits: [TP, P.at(15), P.at(19, 0.6)], risers: [P.at(9)], impacts: [P.at(5, 0.2), P.at(6, 0.3), P.at(8, 0.4), P.at(10, 0.3), P.at(19, 0.6)],
    sfx: [[TP, 'poof'], [P.at(1, 0.8), 'buzz'], [P.at(3, 0.4), 'bubble'], [P.at(5, 0.2), 'alarm'], [P.at(6, 0.3), 'alarm'], [P.at(8, 0.4), 'alarm'], [P.at(10, 0.2), 'meter', 0.4], [P.at(14, 0.1), 'bubble'], [P.at(19, 0.6), 'poof']],
    narr: NARR,
    ask: 'お店の口コミ、星1つ付けたことある？',
    caption: 'もしも客にも店員からの口コミ評価が付いたら？\n\n昨日、ラーメン屋に星1を付けたおじさん。自分の頭の上を見上げて固まる。\n店員たちの不満から。少し待たせただけで、星1と長文が届く。\nお昼。星1のおじさんに、ラーメン屋が本日は満席です。\n夕方。美容院の予約画面に、星2以下の方は受付できません。\n夜。手を挙げたタクシーが、目の前で回送に変わる。\nおじさんはスマホで、自分への口コミを開く。声が大きい。お釣りを投げる。店員を指で呼ぶ。\n次の日。おじさんは、すみませんとありがとうを言ってから注文する。\n隣のレジの、態度が悪いと言い続けていた客も、急に笑顔になる。\n\n結果：星を付けられて、客は初めて、自分も見られている側だと知った。\n口コミは、書く側だけが着ていた、透明人間のマントだったのかもしれない。\n\nお店の口コミ、星1つ付けたことある？ コメントで教えて。\n\n※風刺ネタです。客に口コミ評価が付くのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', '口コミ', 'カスハラ', 'お客様は神様'],
    endStats: [['客の頭の上に', '星の札', 'もしもの設定'], ['次の日のおじさん', 'すみません と ありがとう', 'もしもの結果'], ['口コミの正体', '透明人間のマント', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
