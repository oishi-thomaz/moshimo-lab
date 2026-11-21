import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeGlass } from '../scenes/home.js';

// もしも日本から、マルチの勧誘が消えたら？（皮肉回・台本 S121・社会の消えたら）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。久しぶり！ と元同級生を呼び出す勧誘（嫌われ役）が困り、後半でピラミッドのいちばん上の アップ の人にも返す
// 数字は使わない（消費生活相談の件数は出さない。10年は筋の中の数）。実在の会社・商品・ロゴは出さない（段ボールは無地）。違法と決めつけない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#d8e0e8', ground: '#a8a49a' }); hemi.intensity = 1.3;
const MOTO = makeMan({ shirt: '#f2f2ee', hair: '#2a2220', pants: '#3a3f4e' }); S.add(MOTO); // 勧誘する元同級生
const sweatM = makeSweat(); MOTO.userData.head.add(sweatM);
const PEN = box(0.02, 0.16, 0.02, mat('#1a1a1e')); PEN.position.set(0, -0.66, 0.08); MOTO.userData.arms[1].add(PEN);
const YOBI = makeWoman({ shirt: '#9ac0e0', hair: '#3a2620' }); S.add(YOBI); // 呼び出された人
const FRIENDS = [makeMan({ shirt: '#c8a070', hair: '#3a2a1e' }), makeWoman({ shirt: '#e8a0b8', hair: '#5a3a28' }), makeMan({ shirt: '#7a9a6a', hair: '#1d1a19' }), makeWoman({ shirt: '#c8b0e0', hair: '#2a2220' })]; FRIENDS.forEach(p => S.add(p));
const UP = makeOji(rng(121), { shirt: '#f2f2f2', bald: false, hair: '#2a2220' }); S.add(UP); // いちばん上のアップの人
const GLASSES_UP = new THREE.Group(); { for (const s of [-1, 1]) { const g = box(0.11, 0.06, 0.02, mat('#101014')); g.position.set(s * 0.09, 0.05, 0.2); GLASSES_UP.add(g); } } UP.userData.head.add(GLASSES_UP);
const CHAIN = box(0.2, 0.03, 0.02, mat('#e8c040')); CHAIN.position.set(0, 1.3, 0.15); UP.add(CHAIN);

const F = (px, w = 900) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------- A：カフェ（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#e8dcc8', floor: '#9a7a58' });
const cafeL = new THREE.PointLight(0xfff0d8, 8, 10, 1.2); cafeL.position.set(0, 2.8, 1); S.add(cafeL);
const CT = makeTable({ w: 1.1, d: 0.8, h: 0.72, color: '#c9a77a' }); CT.position.set(0, 0, -0.8); S.add(CT);
const CUPS = [-0.3, 0.3].map(x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 12), mat('#f4f2ec')); c.position.set(x * 1.0, 0.8, -0.8 + (x > 0 ? 0.2 : -0.2)); S.add(c); return c; });
const PYR = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), new THREE.MeshBasicMaterial({ map: cv(400, 300, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a2a6a'; g.lineWidth = 5; const rows = 4; for (let r = 0; r < rows; r++) { const n = 2 ** r; for (let i = 0; i < n; i++) { const x = w / 2 + (i - (n - 1) / 2) * (300 / n) * 1.0, y = 40 + r * 70; g.beginPath(); g.arc(x, y, 14 - r * 2, 0, 7); g.stroke(); if (r > 0) { g.beginPath(); g.moveTo(x, y - 12); g.lineTo(w / 2 + (Math.floor(i / 2) - (n / 2 - 1) / 2) * (300 / (n / 2)), y - 58); g.stroke(); } } } g.fillStyle = '#c8242c'; g.font = F(30); g.textAlign = 'center'; g.fillText('あなたもすぐ上に！', w / 2, h - 12); }) })); PYR.rotation.x = -Math.PI / 2; S.add(PYR);
const sparkA = makeSparkles(90, 0.05, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 0.85, -0.8]], 0.4, 0.4);
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(pa);
const kieta = label('勧誘の図 消えた', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(kieta);
const PHONE = makePhone({ w: 0.9, h: 1.75, cw: 540, ch: 1050 }); S.add(PHONE.g);
function chat(mode) { PHONE.draw(mode, (g, w, h) => { g.fillStyle = '#eef0f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a7a5a'; g.fillRect(0, 0, w, 90); g.fillStyle = '#fff'; g.font = F(42); g.textAlign = 'center'; g.fillText('トーク（架空）', w / 2, 60);
  const bub = (y, txt, me, col) => { g.font = F(42, 700); const tw = g.measureText(txt).width + 50; const x = me ? w - tw - 30 : 30; g.fillStyle = col || (me ? '#9be86a' : '#fff'); g.beginPath(); g.roundRect(x, y, tw, 80, 30); g.fill(); g.fillStyle = '#1a1a1e'; g.textAlign = 'left'; g.fillText(txt, x + 25, y + 54); };
  if (mode === 'kanyu') { bub(140, '久しぶり！', false); bub(250, 'お茶しない？', false); bub(380, 'すごい話があって…', false, '#ffe0d0'); }
  if (mode === 'futsu') { bub(140, '久しぶり！', false); bub(260, '久しぶり！元気？', true); bub(380, 'いつ空いてる？', true); }
}); }
const itsumo = label('答えは いつも勧誘', { w: 1000, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(itsumo);

// ---------- B：元同級生の部屋（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.2, wall: '#e6e2da', floor: '#b8a080' });
const ALBUM = new THREE.Group(); { const l = box(0.5, 0.03, 0.4, mat('#2a3a6a')); l.position.x = -0.26; ALBUM.add(l); const r = box(0.5, 0.03, 0.4, mat('#2a3a6a')); r.position.x = 0.26; ALBUM.add(r); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.36), new THREE.MeshBasicMaterial({ map: cv(480, 180, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const x = 20 + (i % 6) * 76, y = 20 + Math.floor(i / 6) * 80; g.fillStyle = '#d8c8b0'; g.fillRect(x, y, 60, 66); g.fillStyle = '#f0d0b0'; g.beginPath(); g.arc(x + 30, y + 28, 14, 0, 7); g.fill(); g.fillStyle = '#3a2a22'; g.fillRect(x + 16, y + 12, 28, 8); } }) })); pg.rotation.x = -Math.PI / 2; pg.position.y = 0.02; ALBUM.add(pg); } S.add(ALBUM);
const LOWT = makeTable({ w: 1.4, d: 0.8, h: 0.42, color: '#a88a68' }); LOWT.position.set(BX, 0, -1.0); S.add(LOWT);
const riyuu = label('連絡する理由が ない', { w: 1000, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(riyuu);
const BOXES = []; { const r = rng(7); for (let i = 0; i < 26; i++) { const b = box(0.62, 0.42, 0.48, mat(['#c8a06a', '#b8905a', '#d0aa76'][i % 3])); const col = i % 7, lay = Math.floor(i / 7); b.position.set(BX - 2.2 + col * 0.68 + (r() - 0.5) * 0.05, 0.21 + lay * 0.43, -2.4 + (r() - 0.5) * 0.08); S.add(b); BOXES.push(b); } }
const urisaki = label('売り先が ない', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(urisaki);

// ---------- C：居酒屋・同窓会（x=120） ----------
const CX = 120;
room({ x: CX, w: 10, d: 7, h: 3.2, wall: '#7a5a42', floor: '#5a4436' });
const izaL = new THREE.PointLight(0xffd8a8, 16, 12, 1.2); izaL.position.set(CX, 2.8, 1.5); S.add(izaL);
const TBL = makeTable({ w: 2.6, d: 1.0, h: 0.42, color: '#b08a63' }); TBL.position.set(CX, 0, -1.0); S.add(TBL);
const GL = []; for (let i = 0; i < 5; i++) { const g = makeGlass({ beer: true, h: 0.2 }); g.position.set(CX - 1.0 + i * 0.5, TBL.userData.topY, -1.0 + (i % 2 ? 0.25 : -0.25)); S.add(g); GL.push(g); }
const tada = label('ただの飲み会', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(tada);
const BANNER = label('同窓会', { w: 640, size: 120, color: '#fff', bg: 'rgba(40,60,110,.97)', sx: 1.2 }); BANNER.position.set(CX, 2.7, -3.3); S.add(BANNER);
const nashi = label('勧誘なしで しゃべる', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(nashi);

// ---------- D：ピラミッドの上（x=180） ----------
const DX = 180;
flat(30, 16, '#c8c4bc', DX, 0);
const STEPS = []; for (let r = 0; r < 4; r++) { const w = 6.4 - r * 1.6; const b = box(w, 0.8, 2.4 - r * 0.4, mat(['#8a94a8', '#9aa4b8', '#aab4c8', '#c8b070'][r])); b.position.set(DX, 0.4 + r * 0.8, -2.0); S.add(b); STEPS.push(b); }
const SMALL = []; { const r = rng(9); for (let i = 0; i < 10; i++) { const p = makeMan({ shirt: ['#7aa0c8', '#c8a070', '#9ac0a0', '#e8a0b8'][i % 4], hair: '#2a2220', scale: 0.8 }); const row = i < 6 ? 0 : 1; p.position.set(DX - 2.6 + (row ? 1.3 : 0) + (i % 6) * (row ? 0.9 : 1.05), row ? 0.8 : 0, -0.6 - row * 1.4); S.add(p); SMALL.push(p); } }
const appu = label('いちばん上の アップ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(200,150,40,.97)', sx: 1.3 }); S.add(appu);
const SNS = makePhone({ w: 1.2, h: 2.3, cw: 540, ch: 1040 }); S.add(SNS.g);
function sns(stop) { SNS.draw('sns' + stop, (g, w, h) => { g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a5e8a'; g.fillRect(0, 0, w, 90); g.fillStyle = '#fff'; g.font = F(42); g.textAlign = 'center'; g.fillText('もしもSNS（架空）', w / 2, 60);
  for (let i = 0; i < 3; i++) { const y = 120 + i * 300; g.fillStyle = '#fff'; g.fillRect(20, y, w - 40, 280); g.fillStyle = '#9ac8f0'; g.fillRect(40, y + 20, w - 80, 190); g.fillStyle = '#c8242c'; g.beginPath(); g.roundRect(110, y + 110, 320, 70, 26); g.fill(); g.fillStyle = '#1a1a1e'; g.beginPath(); g.arc(170, y + 182, 26, 0, 7); g.arc(370, y + 182, 26, 0, 7); g.fill(); g.fillStyle = '#9ac8f0'; g.fillRect(170, y + 120, 170, 30); g.fillStyle = '#2a2e38'; g.font = F(30, 700); g.textAlign = 'left'; g.fillText(['新車きました', '自由な毎日', '仲間に感謝'][i], 40, y + 255); }
  if (stop) { g.fillStyle = 'rgba(30,30,40,.72)'; g.fillRect(0, 90, w, h - 90); g.fillStyle = '#fff'; g.font = F(56); g.textAlign = 'center'; g.fillText('更新が 止まった', w / 2, h / 2); g.font = F(36, 700); g.fillText('最終更新 1か月前', w / 2, h / 2 + 70); }
}); }
const tomaru = label('ぱったり 止まる', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(tomaru);

// ---------- 結果・ひねり ----------
const nefuda = label('久しぶり！ ＝ 付き合いの値札', { w: 1200, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.55 }); S.add(nefuda);
const TAG = new THREE.Group(); { const t = box(0.32, 0.18, 0.01, mat('#fbfaf4')); TAG.add(t); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshBasicMaterial({ map: cv(240, 128, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8242c'; g.font = F(58); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('値札', w / 2, h / 2); }) })); s.position.z = 0.006; TAG.add(s); } S.add(TAG);

const LABELS = [pa, kieta, itsumo, riyuu, urisaki, tada, nashi, appu, tomaru, nefuda];
const PEOPLE = [MOTO, YOBI, ...FRIENDS, UP];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatM.userData.set(0);
  PYR.visible = false; PHONE.g.visible = false; SNS.g.visible = false; ALBUM.visible = false; BOXES.forEach(b => b.visible = false); TAG.visible = false; PEN.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sitAt(p, x, z, ry, dy = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; poseSit(p); p.position.y += dy; }
const TP = 0.35;
function cafe() { sitAt(MOTO, -0.8, -0.8, Math.PI / 2 - 0.2, 0.0); MOTO.userData.arms[1].rotation.set(-1.0, 0, 0.1); sitAt(YOBI, 0.8, -0.8, -Math.PI / 2, 0.0); YOBI.userData.arms.forEach(a => a.rotation.set(-0.4, 0, 0)); }
function cafeCam(u = 0) { look(lerp(0.2, 0.1, u), 2.35, lerp(2.4, 2.1, u), 0, 1.15, -0.8, 50); }
function shot0(t) { // 0秒＝サムネ：カフェの机に広げた、ピラミッドの図の紙がパッと消える
  reset(); lift(0); cafe(); const on = t > TP;
  PYR.visible = !on; PYR.position.set(0, 0.76, -0.8);
  if (on) { sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(pa, t, TP, 0.0, 1.3, -0.8, 0.36); }
  if (t > TP + 0.35) say(kieta, t, TP + 0.35, 0.0, 0.55, -0.1, 0.9);
  cafeCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 久しぶりに会った元同級生が、ペンを握ったまま固まる
  reset(); lift(150); cafe(); MOTO.userData.arms[1].rotation.set(-1.2, 0, 0.1); if (t > d * 0.35) sweatM.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(0.9, 0.7, u), 1.55, lerp(0.9, 0.6, u), -0.8, 1.2, -0.8, 50);
  return S;
}
function sFuman(t, d) { // 呼び出された人たちの不満から。久しぶり！お茶しない？ の答えは、いつも勧誘
  reset(); lift(200); PHONE.g.visible = true; chat('kanyu'); PHONE.g.position.set(BX + 0.0, 1.45, -0.2);
  FRIENDS.slice(0, 2).forEach((p, i) => { p.visible = true; p.position.set(BX - 0.85 + i * 1.7, 0, -1.1); p.rotation.y = (i ? -0.4 : 0.4); p.userData.head.rotation.x = 0.15; });
  if (t > d * 0.62) say(itsumo, t, d * 0.62, BX, 2.6, -0.5, 1.15);
  look(BX, 1.6, 2.4, BX, 1.5, -0.6, 50);
  return S;
}
function s1(t, d) { // 1日目。卒業アルバムを開いても、連絡する理由がなくなる
  reset(); lift(150); sitAt(MOTO, BX, -0.3, Math.PI, -0.18); MOTO.userData.head.rotation.x = 0.4; MOTO.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); PEN.visible = false;
  ALBUM.visible = true; ALBUM.position.set(BX, LOWT.userData.topY, -0.95);
  if (t > d * 0.45) say(riyuu, t, d * 0.45, BX, 1.95, -0.4, 0.95);
  setHud('勧誘が消えて', '1日目', 1);
  look(BX + 0.2, 1.9, -2.6, BX, 1.05, -0.8, 52);
  return S;
}
function s2(t, d) { // 1週間後。部屋いっぱいの洗剤とサプリの段ボールが、売り先をなくす
  reset(); lift(150); BOXES.forEach((b, i) => b.visible = true); MOTO.visible = true; MOTO.position.set(BX + 0.8, 0, -0.6); MOTO.rotation.y = -0.3; MOTO.userData.head.rotation.x = -0.1; MOTO.userData.arms[1].rotation.set(-0.2, 0, 0.5); PEN.visible = false;
  if (t > d * 0.45) say(urisaki, t, d * 0.45, BX - 0.6, 2.45, -1.6, 0.85);
  setHud('勧誘が消えて', '1週間後', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(1.4, 1.0, u), 1.8, lerp(3.8, 3.2, u), BX - 0.3, 1.2, -1.6, 50);
  return S;
}
function s3(t, d) { // 2週間後。元同級生は、10年ぶりに、ただの飲み会に呼ばれる
  reset(); lift(150); sitAt(MOTO, CX, -0.3, Math.PI, -0.18); PEN.visible = false; MOTO.userData.arms[1].rotation.set(-2.4, 0, 0.1);
  FRIENDS.slice(0, 3).forEach((p, i) => { sitAt(p, CX - 0.9 + i * 0.9, -1.75, 0, -0.18); p.userData.arms[1].rotation.set(-2.2, 0, 0.1); });
  if (t > d * 0.4) say(tada, t, d * 0.4, CX - 0.3, 1.55, -1.75, 0.8);
  setHud('勧誘が消えて', '2週間後', 1);
  look(CX + 1.9, 2.2, 1.0, CX, 0.85, -1.0, 52);
  return S;
}
function pyramid() { STEPS.forEach(s => s.visible = true); SMALL.forEach(p => { p.visible = true; p.userData.head.rotation.x = -0.25; }); UP.visible = true; UP.position.set(DX, 3.2, -2.0); UP.rotation.y = 0; UP.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? -0.5 : 0.5)); }
function sDemo(t, d) { // でも、困ったのは、元同級生だけじゃなかった。ピラミッドのいちばん上で、下からの売り上げで暮らしていたアップの人
  reset(); lift(150); pyramid();
  if (t > d * 0.55) say(appu, t, d * 0.55, DX, 5.05, -2.0, 1.4);
  const u = ease(clamp(t / d)); look(DX + lerp(0.6, 0.3, u), lerp(2.0, 3.4, u), lerp(8.6, 6.4, u), DX, lerp(2.4, 3.5, u), -2.0, 50);
  return S;
}
function sSns(t, d) { // 高級車の写真ばかりだったSNSが、ぱったり止まる
  reset(); lift(150); SNS.g.visible = true; SNS.g.position.set(DX, 1.55, 1.5); sns(t > d * 0.5);
  if (t > d * 0.55) say(tomaru, t, d * 0.55, DX, 2.9, 1.7, 1.0);
  look(DX, 1.7, 4.6, DX, 1.75, 1.5, 50);
  return S;
}
function sDosokai(t, d) { // 1か月後。元同級生は、同窓会で、初めて勧誘なしでしゃべる
  reset(); lift(150); MOTO.visible = true; MOTO.position.set(CX - 0.4, 0, 0.2); MOTO.rotation.y = 0.5; MOTO.userData.arms[1].rotation.set(-0.8, 0, 0.3); PEN.visible = false;
  FRIENDS.forEach((p, i) => { p.visible = true; p.position.set(CX + 0.6 + (i % 2) * 0.8, 0, 0.6 - Math.floor(i / 2) * 1.0); p.rotation.y = -1.2 + i * 0.1; });
  if (t > d * 0.45) say(nashi, t, d * 0.45, CX + 0.1, 2.35, 0.2, 1.1);
  setHud('勧誘が消えて', '1か月後', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(0.4, 0.2, u), 1.85, lerp(4.4, 3.8, u), CX + 0.3, 1.55, -0.4, 50);
  return S;
}
function sHenji(t, d) { // 久しぶり！ の連絡に、みんなが普通に返事をするようになる
  reset(); lift(200); PHONE.g.visible = true; chat('futsu'); PHONE.g.position.set(BX, 1.45, -0.2);
  look(BX, 1.6, 2.2, BX, 1.5, -0.6, 50);
  return S;
}
function sKekka(t, d) { // 結果：マルチの勧誘が消えて、戻ってきたのはお金じゃなく、警戒されずに会える友だちだった
  reset(); lift(150); sitAt(MOTO, 0.6, -0.8, -Math.PI / 2, 0); PEN.visible = false; MOTO.userData.arms[1].rotation.set(-0.8, 0, 0.1);
  sitAt(YOBI, -0.6, -0.8, Math.PI / 2, 0); YOBI.userData.arms[1].rotation.set(-0.8, 0, -0.1);
  setTop('結果', '友だちが 戻った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.8, lerp(3.0, 3.6, u), 0, 1.0, -0.9, 50);
  return S;
}
function sNefuda(t, d) { // 久しぶり！の4文字は、友だち付き合いを売り物にする、値札だったのかもしれない
  reset(); lift(200); PHONE.g.visible = true; chat('kanyu'); PHONE.g.position.set(BX, 1.45, -0.2);
  const k = easeOut(clamp((t - d * 0.3) / 0.4)); TAG.visible = k > 0; TAG.position.set(BX + 0.14, 2.0 - (1 - k) * 0.4, -0.08); TAG.rotation.z = -0.2;
  if (t > d * 0.5) say(nefuda, t, d * 0.5, BX, 1.4, 0.05, 1.05);
  look(BX, 1.6, 2.4, BX, 1.6, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); cafe(); cafeCam(0); return S; }

const NARR = { '久しぶり': 'ひさしぶり', '会った': 'あった', '元同級生': 'もとどうきゅうせい', '握った': 'にぎった', '固まる': 'かたまる', '呼び出された': 'よびだされた', '人たち': 'ひとたち', '不満': 'ふまん', 'お茶': 'おちゃ', '答え': 'こたえ', '勧誘': 'かんゆう', '1日目': 'いちにちめ', '卒業アルバム': 'そつぎょうアルバム', '開いて': 'ひらいて', '連絡': 'れんらく', '理由': 'りゆう', '1週間後': 'いっしゅうかんご', '部屋': 'へや', '洗剤': 'せんざい', '段ボール': 'だんボール', '売り先': 'うりさき', '2週間後': 'にしゅうかんご', '10年ぶり': 'じゅうねんぶり', '飲み会': 'のみかい', '呼ばれる': 'よばれる', '困った': 'こまった', '上': 'うえ', '下から': 'したから', '売り上げ': 'うりあげ', '暮らしていた': 'くらしていた', '人': 'ひと', '高級車': 'こうきゅうしゃ', '写真': 'しゃしん', '止まる': 'とまる', '1か月後': 'いっかげつご', '同窓会': 'どうそうかい', '初めて': 'はじめて', '普通に': 'ふつうに', '返事': 'へんじ', '結果：': '結果、', '消えて': 'きえて', '戻って': 'もどって', '警戒': 'けいかい', '友だち': 'ともだち', '4文字': 'よんもじ', '付き合い': 'つきあい', '売り物': 'うりもの', '値札': 'ねふだ' };
const P = planTimes([
  ['久しぶりに会った<br>元同級生が、', (t, d) => sKatamaru(t, 2 * d)],
  ['ペンを握ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['呼び出された人たちの<br>不満から。', (t, d) => sFuman(t, 2 * d)],
  ['久しぶり！お茶しない？ の<br>答えは、いつも勧誘。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。卒業アルバムを<br>開いても、', (t, d) => s1(t, 2 * d)],
  ['連絡する理由がなくなる。', (t, d) => s1(t + d, 2 * d)],
  ['1週間後。部屋いっぱいの<br>洗剤とサプリの段ボールが、', (t, d) => s2(t, 2 * d)],
  ['売り先をなくす。', (t, d) => s2(t + d, 2 * d)],
  ['2週間後。元同級生は、', (t, d) => s3(t, 2 * d)],
  ['10年ぶりに、<br>ただの飲み会に呼ばれる。', (t, d) => s3(t + d, 2 * d)],
  ['でも、困ったのは、<br>元同級生だけじゃなかった。', (t, d) => sDemo(t, 3 * d)],
  ['ピラミッドのいちばん上で、', (t, d) => sDemo(t + d, 3 * d)],
  ['下からの売り上げで<br>暮らしていたアップの人。', (t, d) => sDemo(t + 2 * d, 3 * d)],
  ['高級車の写真ばかりだった<br>SNSが、ぱったり止まる。', sSns],
  ['1か月後。元同級生は、<br>同窓会で、', (t, d) => sDosokai(t, 2 * d)],
  ['初めて勧誘なしでしゃべる。', (t, d) => sDosokai(t + d, 2 * d)],
  ['久しぶり！ の連絡に、みんなが<br>普通に返事をするようになる。', sHenji],
  ['結果：マルチの勧誘が消えて、', (t, d) => sKekka(t, 3 * d)],
  ['戻ってきたのはお金じゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['警戒されずに会える<br>友だちだった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['久しぶり！の4文字は、', (t, d) => sNefuda(t, 3 * d)],
  ['友だち付き合いを<br>売り物にする、', (t, d) => sNefuda(t + d, 3 * d)],
  ['値札だったのかもしれない。', (t, d) => sNefuda(t + 2 * d, 3 * d)],
  ['久しぶりの連絡、<br>マルチだったことある？', sAsk],
], { shot0, endCard, start: 2.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0714',
    v2: true,
    tt: 'main',
    hookLine: 'カフェの机に広げた、ピラミッドの図の紙がパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から、マルチの勧誘が消えたら？',
    titleHtml: 'もしも日本から、<br>マルチの勧誘が<br>消えたら？',
    mood: 'tension', seed: 714, hits: [TP, P.at(17), P.at(22)], risers: [P.at(10)], impacts: [P.at(12, 0.8), P.at(19, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(3, 0.4), 'bubble'], [P.at(4, 0.4), 'whoosh'], [P.at(6, 0.4), 'whoosh'], [P.at(8, 0.4), 'whoosh'], [P.at(13, 1.0), 'alarm'], [P.at(16, 0.4), 'bubble']],
    narr: NARR,
    ask: '久しぶりの連絡、マルチだったことある？',
    caption: 'もしも日本から、マルチの勧誘が消えたら？\n\n久しぶりに会った元同級生が、ペンを握ったまま固まる。\n呼び出された人たちの不満から。久しぶり！お茶しない？ の答えは、いつも勧誘。\n1日目。卒業アルバムを開いても、連絡する理由がなくなる。\n1週間後。部屋いっぱいの洗剤とサプリの段ボールが、売り先をなくす。\n2週間後。元同級生は、10年ぶりに、ただの飲み会に呼ばれる。\nでも、困ったのは、元同級生だけじゃなかった。\nピラミッドのいちばん上で、下からの売り上げで暮らしていたアップの人。\n高級車の写真ばかりだったSNSが、ぱったり止まる。\n1か月後。元同級生は、同窓会で、初めて勧誘なしでしゃべる。\n久しぶり！ の連絡に、みんなが普通に返事をするようになる。\n\n結果：マルチの勧誘が消えて、戻ってきたのはお金じゃなく、警戒されずに会える友だちだった。\n久しぶり！の4文字は、友だち付き合いを売り物にする、値札だったのかもしれない。\n\n久しぶりの連絡、マルチだったことある？ コメントで教えて。\n\n※風刺ネタです。マルチの勧誘が消えるのは、もしもの設定です。お店・SNS・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'マルチ', '勧誘', '社会の消えたら'],
    endStats: [['消えたもの', 'マルチの勧誘', 'もしもの設定'], ['戻ってきたもの', '警戒されずに 会える友だち', 'もしもの結果'], ['久しぶり！の正体', '付き合いの値札', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
