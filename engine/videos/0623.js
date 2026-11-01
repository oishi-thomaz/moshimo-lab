import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, makePerson, poseWalk, SKIN } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしもオトナのお店がこの世から消えたら？（v2・風刺ネタ回）
// 2026/11/01 ゆうとの依頼：日曜夜に当てにいく攻めた回。ゆうとの台本（おぢ汚水・浄水フィルター）をそのまま形にする
// 数字は使わない（ゆうとの選択：ネタ重視）。キャプションに風刺ネタである旨を書く
// タイトルは「風俗」を避けて「オトナのお店」（表示を絞られにくくする）

const PINK = '#ff5fae', PURPLE = '#c58bff', GOLD = '#ffd27a', BROWN = '#c9a46a', BLUE = '#7fd4ff', GREEN = '#9be86a';

// =====================================================
// シーン：夜の街（原点）／アプリと婚活会場（x=60〜85）／恋愛市場の川（z=-100）
// =====================================================
const S = new THREE.Scene();
S.background = new THREE.Color('#0a0e1c'); S.fog = new THREE.Fog(0x0a0e1c, 45, 170);
const hemi = new THREE.HemisphereLight(0xb9c6ff, 0x2a2434, 1.05); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(12, 30, 22); S.add(sun);
const groundM = mat('#23252f');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundM); ground.rotation.x = -Math.PI / 2; S.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 9), mat('#2d2f3a')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 4); S.add(road);

// ---------- おぢ ----------
const OSHIRT = ['#59606e', '#e9e4da', '#7a6a55', '#8a8f99', '#c9c2b0', '#6b7a5a', '#a35d4f'];
const OPANTS = ['#2b3346', '#3b3f4a', '#5a4a3a', '#1f2430'];
function makeOji(r, extra = {}) {
  const shirt = OSHIRT[Math.floor(r() * OSHIRT.length)];
  const p = makePerson({ skin: SKIN[Math.floor(r() * SKIN.length)], hair: r() < 0.6 ? '#9a9a9a' : '#3a3330', bald: r() < 0.75, shirt, pants: OPANTS[Math.floor(r() * OPANTS.length)], tie: r() < 0.5, scale: 0.95 + r() * 0.1, ...extra });
  const belly = box(0.48, 0.36, 0.18, mat(shirt)); belly.position.set(0, 1.02, 0.18); p.add(belly);
  if (r() < 0.55) { const ms = box(0.17, 0.045, 0.02, mat('#2a2220')); ms.position.set(0, 0.14, 0.196); p.userData.head.add(ms); }
  p.userData.ph = r() * 6.28;
  return p;
}
function slump(p, k) { const { head, arms } = p.userData; head.rotation.x = 0.35 * k; arms[0].rotation.z = -0.05 * k; arms[1].rotation.z = 0.05 * k; }

// ---------- 夜の街：オトナのお店3軒 ----------
const SHOPS = [];
const SIGN_TXT = ['オトナのお店', '♡ OPEN ♡', 'ナイトサロン'];
const SIGN_COL = ['#ff5fae', '#ff7ad9', '#b07bff'];
for (let i = 0; i < 3; i++) {
  const g = new THREE.Group(); g.position.set((i - 1) * 5.6, 0, -3); S.add(g);
  const body = box(4.8, 6.2, 3.4, mat(['#2c2238', '#33263a', '#262236'][i])); body.position.y = 3.1; g.add(body);
  const door = box(1.3, 2.2, 0.1, mat('#120e18')); door.position.set(0, 1.1, 1.72); g.add(door);
  const neonM = new THREE.MeshBasicMaterial({ color: SIGN_COL[i] });
  for (const [w, h, x, y] of [[4.4, 0.12, 0, 5.9], [4.4, 0.12, 0, 4.1], [0.12, 1.9, -2.2, 5.0], [0.12, 1.9, 2.2, 5.0]]) { const n = box(w, h, 0.12, neonM); n.position.set(x, y, 1.75); n.castShadow = false; g.add(n); }
  const sign = textSprite(SIGN_TXT[i], { w: 768, h: 192, size: 110, color: '#fff', stroke: 18, strokeColor: SIGN_COL[i], sx: 4.1 }); sign.position.set(0, 5.0, 1.9); g.add(sign);
  const heart = textSprite('♡', { w: 256, h: 256, size: 200, color: SIGN_COL[i], sx: 1.1 }); heart.position.set(0, 2.9, 1.9); g.add(heart);
  const light = new THREE.PointLight(new THREE.Color(SIGN_COL[i]), 0, 14, 1.6); light.position.set(0, 4, 4); g.add(light);
  const closed = textSprite('閉店', { w: 512, h: 192, size: 120, color: '#fff', bg: 'rgba(30,30,36,.9)', sx: 2.4 }); closed.position.set(0, 2.2, 2.0); g.add(closed);
  SHOPS.push({ g, neonM, sign, heart, light, closed, col: new THREE.Color(SIGN_COL[i]) });
}
const DARK = new THREE.Color('#2a2430');
function shopsOn(k) { // 1：ネオンON、0：消灯
  for (const s of SHOPS) {
    s.neonM.color.copy(DARK).lerp(s.col, k); s.sign.material.opacity = 0.08 + 0.92 * k; s.heart.material.opacity = 0.06 + 0.94 * k;
    s.light.intensity = 26 * k; s.closed.visible = k < 0.5;
  }
}
function shopsSink(u) { for (const s of SHOPS) { s.g.visible = u < 1; s.g.position.y = -6.5 * ease(u); } }
const streetLamp = new THREE.PointLight(0xffe2b0, 10, 22, 1.5); streetLamp.position.set(0, 7, 8); S.add(streetLamp);

// 街のおぢ（お店の前）
const STREET = [];
{ const r = rng(23); for (let i = 0; i < 15; i++) { const p = makeOji(r); const row = Math.floor(i / 5), col = i % 5; p.position.set((col - 2) * 2.0 + (r() - .5) * .6 + (row % 2) * 0.8, 0, 1.6 + row * 1.6 + (r() - .5) * .4); p.rotation.y = Math.PI + (r() - .5) * 0.5; S.add(p); STREET.push(p); } }
function streetFace(front) { for (const p of STREET) p.rotation.y = (front ? 0 : Math.PI) + (p.userData.ph - 3.14) * 0.08; }

// 性欲・孤独・怨念（おぢから立ちのぼる）
const auraM = makeSparkles(500, 0.55, 0xb070ff); S.add(auraM.points);
auraM.init(STREET.map(p => [p.position.x, 1.4, p.position.z]), 1.2, 4);
const WORDS = [['性欲', PINK, -2.3], ['孤独', BLUE, 0], ['怨念', PURPLE, 2.3]].map(([s, c, x]) => {
  const sp = textSprite(s, { w: 512, h: 256, size: 190, color: c, stroke: 20, strokeColor: '#140a1e', sx: 2.2 }); sp.position.set(x, 3, 3.5); S.add(sp); return sp;
});
function words(t, on) { WORDS.forEach((w, i) => { const u = clamp((t - i * 0.55) / 0.5); w.visible = on && u > 0; w.position.y = 2.4 + i * 0.5 + easeOut(clamp((t - i * 0.55) / 3)) * 1.6; const s = 2.2 * easeBack(u); w.scale.set(s, s / 2, 1); }); }

// ---------- マッチングアプリ（x=60） ----------
const APP = new THREE.Group(); APP.position.set(60, 0, -4); S.add(APP);
const phone = box(5.6, 10.4, 0.5, mat('#15161c')); phone.position.y = 5.6; APP.add(phone);
const scrC = document.createElement('canvas'); scrC.width = 540; scrC.height = 1000;
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace;
const scr = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 9.6), new THREE.MeshBasicMaterial({ map: scrT })); scr.position.set(0, 5.6, 0.26); APP.add(scr);
const AGES = [52, 58, 49, 61, 55, 47, 63, 57, 50, 59, 54, 62, 48, 56, 60];
function ojiFace(g, x, y, s, k) {
  g.fillStyle = ['#f1c9a5', '#e8b98f', '#d9a57c'][k % 3]; g.beginPath(); g.ellipse(x, y, 42 * s, 50 * s, 0, 0, 6.29); g.fill();
  g.fillStyle = '#8f8f8f'; g.fillRect(x - 46 * s, y - 22 * s, 12 * s, 26 * s); g.fillRect(x + 34 * s, y - 22 * s, 12 * s, 26 * s);
  if (k % 3 === 0) { g.strokeStyle = '#6a6a6a'; g.lineWidth = 3 * s; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x - 30 * s, y - 38 * s + i * 4 * s); g.quadraticCurveTo(x, y - 52 * s, x + 30 * s, y - 38 * s + i * 4 * s); g.stroke(); } }
  g.fillStyle = '#111'; g.fillRect(x - 18 * s, y - 6 * s, 8 * s, 8 * s); g.fillRect(x + 10 * s, y - 6 * s, 8 * s, 8 * s);
  if (k % 2) { g.fillStyle = '#3a2a22'; g.fillRect(x - 16 * s, y + 18 * s, 32 * s, 7 * s); }
  g.strokeStyle = '#7a3b2e'; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, y + 26 * s, 9 * s, 0.2, 2.9); g.stroke();
}
let lastScr = -1;
function drawScreen(n) {
  n = Math.floor(n); if (n === lastScr) return; lastScr = n;
  const g = scrC.getContext('2d'), w = 540, h = 1000;
  g.fillStyle = '#fff4f8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff5f9e'; g.fillRect(0, 0, w, 110); g.fillStyle = '#fff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♡ マッチング', w / 2, 58);
  for (let i = 0; i < 15; i++) {
    const cx = 18 + (i % 3) * 172, cy = 128 + Math.floor(i / 3) * 172;
    g.fillStyle = i < n ? '#ffffff' : '#ece4ea'; g.fillRect(cx, cy, 160, 160);
    if (i < n) { ojiFace(g, cx + 80, cy + 70, 0.9, i); g.fillStyle = '#333'; g.font = '900 26px "Noto Sans CJK JP", sans-serif'; g.fillText(AGES[i] + '歳', cx + 80, cy + 140); }
  }
  g.fillStyle = '#ff3b6b'; g.fillRect(40, 900, w - 80, 80); g.fillStyle = '#fff'; g.font = '900 40px "Noto Sans CJK JP", sans-serif';
  g.fillText('新規登録 おぢ ' + (n >= 15 ? '99,999+' : String(n * 377)), w / 2, 940);
  scrT.needsUpdate = true;
}
drawScreen(0);
const APPWALK = [];
{ const r = rng(31); for (let i = 0; i < 18; i++) { const p = makeOji(r); p.userData.lane = (r() - .5) * 5; p.userData.off = r() * 14; S.add(p); APPWALK.push(p); } }
function appWalk(t, on) {
  for (const p of APPWALK) {
    p.visible = on; if (!on) continue;
    const z = 10 - ((t * 2.6 + p.userData.off) % 14); const shrink = clamp((z + 3.4) / 1.6);
    p.position.set(60 + p.userData.lane * lerp(0.1, 1, clamp((z + 3.5) / 10)), 0, z); p.rotation.y = Math.PI;
    p.scale.setScalar(shrink + 0.0001); poseWalk(p, t * 9 + p.userData.ph);
  }
}

// ---------- 婚活パーティー会場（x=84） ----------
const VEN = new THREE.Group(); VEN.position.set(84, 0, -6); S.add(VEN);
const vb = box(11, 6.5, 6, mat('#efe2e8')); vb.position.y = 3.25; VEN.add(vb);
const vroof = box(11.6, 0.4, 6.6, mat('#c94f7c')); vroof.position.y = 6.7; VEN.add(vroof);
const vdoor = box(2.6, 3, 0.1, mat('#5a2a3a')); vdoor.position.set(0, 1.5, 3.05); VEN.add(vdoor);
const vsign = textSprite('婚活パーティー', { w: 1024, h: 192, size: 120, color: '#fff', bg: 'rgba(201,79,124,.95)', sx: 7 }); vsign.position.set(0, 5.2, 3.3); VEN.add(vsign);
const vlight = new THREE.PointLight(0xffc0d8, 18, 20, 1.5); vlight.position.set(0, 5, 6); VEN.add(vlight);
const JAM = [];
{ const r = rng(41); for (let i = 0; i < 34; i++) { const p = makeOji(r); p.position.set(84 + (r() - .5) * 9, 0, -2 + r() * 7); p.rotation.y = Math.PI + (r() - .5) * 0.6; S.add(p); JAM.push(p); } }
const kon = textSprite('男性 満員', { w: 512, h: 160, size: 96, color: '#fff', bg: 'rgba(220,40,70,.92)', sx: 3.2 }); kon.position.set(84, 7.8, -2.6); S.add(kon);

// ---------- 恋愛市場の川（z=-100） ----------
const RZ = -100;
const flowC = document.createElement('canvas'); flowC.width = 256; flowC.height = 256;
{ const g = flowC.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); const r = rng(5); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(200,220,255,${0.25 + r() * 0.3})`; g.fillRect(r() * 256, r() * 256, 30 + r() * 60, 3); } }
const flowT = new THREE.CanvasTexture(flowC); flowT.wrapS = flowT.wrapT = THREE.RepeatWrapping; flowT.repeat.set(10, 2);
const waterM = new THREE.MeshLambertMaterial({ color: '#3f9ee0', map: flowT, transparent: true, opacity: 0.94 });
const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 16), waterM); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.06, RZ); S.add(water);
for (const z of [RZ - 8.4, RZ + 8.4]) { const b = box(160, 0.35, 1.0, mat('#4f6b3a')); b.position.set(0, 0.17, z); S.add(b); }
const bankN = new THREE.Mesh(new THREE.PlaneGeometry(160, 40), mat('#2f3a2a')); bankN.rotation.x = -Math.PI / 2; bankN.position.set(0, 0.02, RZ + 28.8); S.add(bankN);
const rsign = textSprite('恋愛市場', { w: 768, h: 192, size: 130, color: '#fff', bg: 'rgba(30,110,170,.92)', sx: 5 }); rsign.position.set(8, 3.4, RZ + 9.6); S.add(rsign);
const rpost = box(0.25, 2.4, 0.25, mat('#6b5a44')); rpost.position.set(8, 1.2, RZ + 9.6); S.add(rpost);
const WCLEAN = new THREE.Color('#3f9ee0'), WMUD = new THREE.Color('#7a6230'), WDOBU = new THREE.Color('#4a3a1c');
function waterQ(q) { // 0 きれい → 1 にごり → 2 ドブ
  waterM.color.copy(WCLEAN).lerp(WMUD, clamp(q)).lerp(WDOBU, clamp(q - 1));
}
// おぢ工場と排水管
const FX = -26;
const FAC = new THREE.Group(); FAC.position.set(FX, 0, RZ + 20); S.add(FAC);
const fb = box(9, 6, 6, mat('#5d6068')); fb.position.y = 3; FAC.add(fb);
const fchim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 7, 12), mat('#4a4c52')); fchim.position.set(3, 8.5, -1); FAC.add(fchim);
const fsign = textSprite('おぢ', { w: 512, h: 256, size: 200, color: '#fff', bg: 'rgba(90,60,40,.95)', sx: 3.2 }); fsign.position.set(0, 4.2, 3.2); FAC.add(fsign);
const smokeP = makeSparkles(200, 1.6, 0x8a6aa0); S.add(smokeP.points); smokeP.init([[FX + 3, 12, RZ + 19]], 0.8, 8);
const PIPE_Z0 = RZ + 17, PIPE_Z1 = RZ + 8.6, PY = 1.3;
const pipeM = mat('#8a8f99');
const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, PIPE_Z0 - PIPE_Z1, 16), pipeM); pipe.rotation.x = Math.PI / 2; pipe.position.set(FX, PY, (PIPE_Z0 + PIPE_Z1) / 2); S.add(pipe);
const plab = textSprite('おぢ排水', { w: 512, h: 160, size: 96, color: '#fff', bg: 'rgba(120,80,40,.92)', sx: 2.6 }); plab.position.set(FX + 1.6, 3.0, PIPE_Z1 + 2.2); S.add(plab);
const streamM = new THREE.MeshBasicMaterial({ color: '#6e4d8a', transparent: true, opacity: 0.9 });
const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, PY, 12), streamM); stream.position.set(FX, PY / 2, PIPE_Z1 - 0.3); S.add(stream);
const stainM = new THREE.MeshBasicMaterial({ color: '#5a3f2a', transparent: true, opacity: 0.85, depthWrite: false });
const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 40), stainM); stain.rotation.x = -Math.PI / 2; stain.position.set(FX, 0.09, PIPE_Z1 - 3); S.add(stain);
const OUT_DIRTY = new THREE.Color('#6e4d8a'), OUT_CLEAN = new THREE.Color('#9fe2ff');
function outflow(on, clean = 0, t = 0) {
  stream.visible = on; streamM.color.copy(OUT_DIRTY).lerp(OUT_CLEAN, clean); streamM.opacity = 0.9 - 0.35 * clean;
  stream.scale.x = stream.scale.z = 1 + Math.sin(t * 20) * 0.05;
}
function stainAt(u) { stain.visible = u > 0.01; const s = 0.5 + u * 14; stain.scale.set(s * 2.2, s, 1); stain.position.x = FX + s * 1.4; stainM.opacity = 0.75 * clamp(u * 3); }
// 浮く魚（腹を上に）
const FISH = [];
{ const r = rng(51); for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const b = box(0.9, 0.3, 0.35, mat('#e8eef2')); g.add(b); const tl = box(0.3, 0.3, 0.05, mat('#cfd8de')); tl.position.x = -0.55; g.add(tl); const e = box(0.08, 0.08, 0.37, mat('#111')); e.position.set(0.3, -0.03, 0); g.add(e); const x = textSprite('×', { w: 128, h: 128, size: 110, color: '#222', sx: 0.35 }); x.position.set(0.3, 0.05, 0.2); g.add(x); g.rotation.z = Math.PI; g.position.set(FX + 2 + r() * 9, 0.18, PIPE_Z1 - 1.5 - r() * 5); g.rotation.y = r() * 6; S.add(g); FISH.push(g); } }
// 浄水フィルター（＝オトナのお店）
const FIL = new THREE.Group(); FIL.position.set(FX, 0, RZ + 13); FIL.rotation.y = Math.PI; S.add(FIL);
const filBody = box(5.2, 5.6, 4, mat('#2c2238')); filBody.position.y = 2.8; FIL.add(filBody);
const filNeonM = new THREE.MeshBasicMaterial({ color: '#ff5fae' });
for (const [w, h, x, y] of [[4.8, 0.14, 0, 5.3], [4.8, 0.14, 0, 3.5], [0.14, 1.9, -2.4, 4.4], [0.14, 1.9, 2.4, 4.4]]) { const n = box(w, h, 0.12, filNeonM); n.position.set(x, y, 2.06); n.castShadow = false; FIL.add(n); }
const filSign = textSprite('オトナのお店', { w: 768, h: 192, size: 110, color: '#fff', stroke: 18, strokeColor: '#ff5fae', sx: 4.4 }); filSign.position.set(0, 4.4, 2.6); filSign.material.depthTest = false; filSign.renderOrder = 6; FIL.add(filSign);
const filLight = new THREE.PointLight(0xff5fae, 30, 16, 1.6); filLight.position.set(0, 4, 5); FIL.add(filLight);
const filLab = textSprite('巨大な浄水フィルター', { w: 1024, h: 192, size: 90, color: '#fff', bg: 'rgba(20,120,190,.95)', sx: 5.2 }); filLab.position.set(FX, 7.6, RZ + 12); S.add(filLab);
const filSpark = makeSparkles(260, 0.5, 0xbfeaff); S.add(filSpark.points); filSpark.init([[FX, 4, RZ + 13], [FX, 0.3, PIPE_Z1 - 1]], 4, 5);
function filter(u) { FIL.visible = u > 0.001; FIL.scale.set(1, Math.max(0.001, easeBack(clamp(u))), 1); }
// 川のおぢ（頭と肩だけ水面から出る）・婚活女性・会いたい人
const RIVER = [];
{ const r = rng(61); for (let i = 0; i < 72; i++) { const p = makeOji(r); let x, z; do { x = -4 + r() * 28; z = RZ - 6 + r() * 12; } while (Math.abs(x - 4) < 1.4 && Math.abs(z - RZ) < 1.4); p.position.set(x, -1.05, z); p.rotation.y = (r() - .5) * 2.4 + Math.PI / 2; S.add(p); RIVER.push(p); } }
function riverOji(on, t) { for (const p of RIVER) { p.visible = on; p.position.y = -1.05 + Math.sin(t * 2.2 + p.userData.ph) * 0.07; } }
const woman = makePerson({ skin: '#f5d3b5', hair: '#3a2620', shirt: '#f29bbb', pants: '#2b3346', long: true }); S.add(woman);
const guy = makePerson({ skin: '#f1c9a5', hair: '#1d1a19', shirt: '#f4f6fa', pants: '#3b4a6a' }); guy.position.set(29, -0.95, RZ); guy.rotation.y = -Math.PI / 2; S.add(guy);
const guySpark = makeSparkles(160, 0.45, 0xfff2c0); S.add(guySpark.points); guySpark.init([[29, 1.2, RZ]], 1.6, 2);
const guyLab = textSprite('本当に会いたい人', { w: 768, h: 160, size: 90, color: '#fff', bg: 'rgba(200,150,40,.92)', sx: 3.8 }); guyLab.position.set(29, 2.9, RZ); S.add(guyLab);
function wade(t, x) { woman.position.set(x, -0.95 + Math.sin(t * 3) * 0.04, RZ); woman.rotation.y = Math.PI / 2; const { arms } = woman.userData; const s = Math.sin(t * 5); arms[0].rotation.x = -1.6 + s * 0.5; arms[1].rotation.x = -1.6 - s * 0.5; arms[0].rotation.z = -0.4 - s * 0.3; arms[1].rotation.z = 0.4 - s * 0.3; }

function reset() {
  for (const p of [...STREET]) { p.visible = true; slump(p, 0); }
  auraM.set(0); words(0, false); appWalk(0, false); riverOji(false, 0);
  woman.visible = guy.visible = guyLab.visible = false; guySpark.set(0); filSpark.set(0); smokeP.set(0);
  FISH.forEach(f => f.visible = false); filter(0); plab.visible = true; filLab.visible = false; outflow(false); stainAt(0); kon.visible = false;
  el.flash.style.opacity = 0; setHud('', '', 0);
}

// =====================================================
// ショット
// =====================================================
const TP = 0.5;
function streetCam(t, d = 0) { look(lerp(0.6, 0, d), lerp(3.2, 3.6, d), lerp(15.5, 17, d), 0, 3.2, -1, 50); }
function shot0(t) { // 0秒＝サムネ：ネオンの店の前におぢ。0.5秒でバチン（全店消灯）
  reset(); lift(120); shopsSink(0); streetFace(false);
  const k = t - TP; shopsOn(k < 0 ? 1 : (k < 0.12 || (k > 0.22 && k < 0.3)) ? 0.6 : 0);
  el.flash.style.opacity = k > 0 ? 0.4 * Math.max(0, 1 - k / 0.25) : 0;
  streetCam(t, ease(clamp(t / 3.2)));
  if (k > 0 && k < 0.5) { cam.position.x += Math.sin(t * 80) * 0.06; }
  return S;
}
function shot1(t) { // お店が沈んで消える
  reset(); lift(120); shopsOn(0); shopsSink(clamp((t - 0.4) / 2.2)); streetFace(false);
  STREET.forEach((p, i) => { p.rotation.y = Math.PI + Math.sin(t * 2 + i) * 0.5 * clamp(t / 1); });
  look(0, lerp(5, 7, ease(clamp(t / 3.3))), lerp(18, 20, ease(clamp(t / 3.3))), 0, 2.4, -2, 50);
  setTop('この世のオトナのお店', t < 2.4 ? 'ぜんぶ消滅' : '0軒', fade(t, 0.15, 3.2, 0.25), PINK);
  return S;
}
function shot2(t) { // 行き場を失うおぢ
  reset(); lift(160); shopsOn(0); shopsSink(1); streetFace(true);
  STREET.forEach(p => slump(p, clamp(t / 1.2)));
  const u = ease(clamp(t / 3.4)); look(lerp(-1, 1, u), 2.0, lerp(10.5, 9.5, u), 0, 1.5, 3, 48);
  setTop('おぢの需要', 'なし', fade(t, 0.15, 3.3, 0.25), '#cfd3dc');
  return S;
}
function shot3(t) { // マッチングアプリにおぢが殺到
  reset(); lift(80); drawScreen(clamp((t - 0.2) / 2.6) * 15); appWalk(t, true);
  const u = ease(clamp(t / 3.4)); look(lerp(63, 62, u), lerp(6, 6.5, u), lerp(14, 16, u), 60, 5, -4, 52);
  setTop('マッチングアプリ', 'おぢ大量登録', fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function shot4(t) { // 婚活パーティーにも
  reset(); lift(80); kon.visible = t > 0.8; const ks = 3.2 * easeBack(clamp((t - 0.8) / 0.4)); kon.scale.set(ks, ks * 160 / 512, 1);
  JAM.forEach((p, i) => { p.position.x += Math.sin(t * 7 + i) * 0.004; poseWalk(p, t * 8 + p.userData.ph, 0.4); });
  const u = ease(clamp(t / 3.4)); look(lerp(88, 86, u), lerp(7, 6, u), lerp(16, 14.5, u), 84, 3, -3, 52);
  setTop('婚活パーティー', 'おぢで満員', fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function shot5(t) { // 性欲・孤独・怨念
  reset(); lift(120); shopsOn(0); shopsSink(1); streetFace(true); STREET.forEach(p => slump(p, 1));
  auraM.set(clamp(t / 4.4) * 0.9); words(t, true);
  hemi.intensity = 0.7;
  const u = ease(clamp(t / 4.4)); look(0, lerp(2.6, 3.4, u), lerp(14, 16, u), 0, 2.8, 3, 52);
  return S;
}
function riverCam(px, py, pz, tx, ty, tz, fov = 50) { look(px, py, pz, tx, ty, tz, fov); }
function shot6(t) { // おぢ排水が恋愛市場へ放流
  reset(); hemi.intensity = 1.05; lift(100); outflow(true, 0, t); stainAt(clamp(t / 4) * 0.35); waterQ(clamp(t / 4) * 0.3);
  flowT.offset.x = -t * 0.08;
  const u = ease(clamp(t / 3.9)); riverCam(lerp(FX + 13, FX + 11, u), lerp(10, 9, u), lerp(RZ + 3, RZ + 2, u), FX + 1, 1.2, RZ + 10, 52);
  setTop('おぢの性欲・孤独・怨念', '恋愛市場へ放流', fade(t, 0.15, 3.8, 0.25), BROWN);
  return S;
}
function shot7(t) { // 水質悪化
  reset(); lift(100); outflow(true, 0, t); stainAt(0.35 + clamp(t / 3.7) * 0.65); waterQ(0.3 + clamp(t / 3.7) * 1.7); flowT.offset.x = -t * 0.08 - 0.3;
  const u = ease(clamp(t / 3.8)); riverCam(lerp(FX + 9, FX + 11, u), lerp(11, 14, u), lerp(RZ - 9, RZ - 12, u), FX + 2, 1, RZ + 9, 50);
  setTop('恋愛市場の水質', t < 1.3 ? 'にごり' : t < 2.6 ? 'くさい' : 'ドブ', fade(t, 0.15, 3.7, 0.25), BROWN);
  return S;
}
function shot8(t) { // 婚活女性がおぢをかき分ける
  reset(); lift(160); waterQ(2); stainAt(1); flowT.offset.x = -t * 0.08 - 0.6; riverOji(true, t); woman.visible = true; wade(t, 2 + t * 0.35);
  RIVER.forEach(p => { const dx = p.position.x - woman.position.x, dz = p.position.z - RZ; const d = Math.hypot(dx, dz); if (d < 2.2) p.position.z += Math.sign(dz || 1) * (2.2 - d) * 0.5; });
  const wx = woman.position.x; riverCam(wx + 4.2, 2.3, RZ + 4.2, wx, 0.7, RZ, 50);
  return S;
}
function shot9(t) { // 本当に会いたい人は遠い
  reset(); lift(140); waterQ(2); stainAt(1); flowT.offset.x = -t * 0.08 - 0.9; riverOji(true, t + 4); woman.visible = true; wade(t + 4, 3.4 + t * 0.25);
  guy.visible = true; guyLab.visible = true; guySpark.set((t * 0.3) % 1);
  const wx = woman.position.x; const u = ease(clamp(t / 3.9)); riverCam(lerp(wx - 5, wx - 3.4, u), lerp(2.6, 3.2, u), RZ + 1.2, 29, 1.2, RZ, lerp(46, 40, u));
  setTop('本当に会いたい人まで', 'おぢ 何百人', fade(t, 0.3, 3.8, 0.25), GOLD);
  return S;
}
function shot10(t) { // 工場排水をそのまま川へ
  reset(); lift(100); waterQ(2); stainAt(1); outflow(true, 0, t); flowT.offset.x = -t * 0.08 - 1.2; smokeP.set((t * 0.25) % 1);
  FISH.forEach((f, i) => { f.visible = true; f.position.y = 0.2 + Math.sin(t * 2 + i) * 0.03; });
  const u = ease(clamp(t / 4.3)); riverCam(lerp(FX - 9, FX - 6, u), lerp(7, 6, u), lerp(RZ + 6, RZ + 4, u), FX + 1, 2, RZ + 12, 52);
  setTop('やってることは', '工場排水の垂れ流し', fade(t, 0.15, 4.2, 0.25), BROWN);
  return S;
}
function shot11(t) { // 結果：ドブ川
  reset(); lift(80); waterQ(2); stainAt(1); outflow(true, 0, t); flowT.offset.x = -t * 0.08 - 1.5; riverOji(true, t); woman.visible = true; wade(t, 6);
  FISH.forEach(f => f.visible = true); smokeP.set((t * 0.25) % 1);
  const u = ease(clamp(t / 6)); riverCam(lerp(-2, 6, u), lerp(34, 40, u), lerp(RZ + 34, RZ + 38, u), 4, 0, RZ - 2, 50);
  setTop('結果', '恋愛市場は ドブ川', fade(t, 0.15, 6.0, 0.25), BROWN);
  return S;
}
function shot12(t) { // そう考えると…（工場の前にお店がせり上がる）
  reset(); lift(100); waterQ(2); stainAt(1); outflow(true, 0, t); flowT.offset.x = -t * 0.08 - 1.8; filter(clamp((t - 1.0) / 1.2));
  if (t > 1.0 && t < 1.25) el.flash.style.opacity = 0.3;
  const u = ease(clamp(t / 3.4)); plab.visible = false; riverCam(lerp(FX + 3.5, FX + 2.5, u), lerp(6, 5.5, u), lerp(RZ + 0.5, RZ - 0.5, u), FX, 3.4, RZ + 13, 52);
  return S;
}
function shot13(t) { // 巨大な浄水フィルターだった
  reset(); lift(100); filter(1); const c = ease(clamp(t / 1.6)); outflow(true, c, t); stainAt(1 - c * 0.85); waterQ(2 - c * 1.6); flowT.offset.x = -t * 0.1 - 2.1;
  filLab.visible = t > 0.6; const fs = 5.2 * easeBack(clamp((t - 0.6) / 0.45)); filLab.scale.set(fs, fs * 192 / 1024, 1);
  filSpark.set(((t - 0.6) * 0.35) % 1);
  const u = ease(clamp(t / 5.5)); plab.visible = false; riverCam(lerp(FX + 1.2, FX + 1.8, u), lerp(5.5, 7, u), lerp(RZ - 0.5, RZ - 3, u), FX, 4.0, RZ + 11, 54);
  setTop('オトナのお店の正体', 'おぢ受け止め装置', fade(t, 0.3, 5.5, 0.25), BLUE);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（消灯したまま＝結果の状態）でループ
  reset(); lift(120); shopsSink(0); shopsOn(0); streetFace(false);
  STREET.forEach(p => slump(p, 0.6));
  streetCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.4, 'ある日、オトナのお店が<br>全部消えた。'],
  [6.5, 9.8, '行き場を失ったのは、<br>需要のないおぢたち。'],
  [9.9, 13.2, 'おぢは一斉に、<br>マッチングアプリへ。'],
  [13.3, 16.6, 'さらに婚活市場にも、<br>どっと流れ込む。'],
  [16.7, 21.0, '長年ためこんだ性欲、孤独、<br>そして怨念。'],
  [21.1, 25.0, 'それが全部、恋愛市場に<br>そのまま放流される。'],
  [25.1, 28.8, '恋愛市場の水質は、<br>みるみる悪化。'],
  [28.9, 32.8, '婚活女性は、大量のおぢを<br>かき分けながら…'],
  [32.9, 36.8, '本当に会いたい人を<br>探すハメになる。'],
  [36.9, 41.2, 'これは工場排水を、<br>そのまま川に流すのと同じ。'],
  [41.3, 47.4, '結果：恋愛市場は、<br>おぢ汚水でドブ川になる。'],
  [47.5, 50.8, 'そう考えると、<br>オトナのお店とは…'],
  [50.9, 56.4, '巨大な浄水フィルター<br>だったのかもしれない。'],
  [56.5, 60.4, 'オトナのお店、<br>必要？いらない？'],
];

const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.5, f: shot1 }, { a: 6.5, b: 9.9, f: shot2 }, { a: 9.9, b: 13.3, f: shot3 },
  { a: 13.3, b: 16.7, f: shot4 }, { a: 16.7, b: 21.1, f: shot5 }, { a: 21.1, b: 25.1, f: shot6 }, { a: 25.1, b: 28.9, f: shot7 },
  { a: 28.9, b: 32.9, f: shot8 }, { a: 32.9, b: 36.9, f: shot9 }, { a: 36.9, b: 41.3, f: shot10 }, { a: 41.3, b: 47.5, f: shot11 },
  { a: 47.5, b: 50.9, f: shot12 }, { a: 50.9, b: 56.5, f: shot13 }, { a: 56.5, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0623',
    v2: true,
    hookLine: 'オトナのお店が、全部消えた。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもオトナのお店が消えたら？',
    titleHtml: 'もしもオトナの<br>お店が消えたら？',
    mood: 'mystery', seed: 623, hits: [0.5, 41.3, 50.9], risers: [36.9, 47.5], impacts: [9.9, 13.3, 21.1, 25.1, 41.3, 50.9],
    sfx: [[0.5, 'buzz'], [3.6, 'whoosh'], [10.2, 'bubble'], [14.1, 'poof'], [21.3, 'whoosh'], [25.4, 'bubble'], [37.1, 'drone'], [48.5, 'whoosh'], [51.4, 'poof']],
    narr: { 'おぢ': 'おじ', '性欲': 'せいよく', '怨念': 'おんねん', 'オトナ': 'おとな' },
    ask: 'オトナのお店、必要？いらない？',
    caption: 'もしもオトナのお店がこの世から消えたら？\n\n行き場を失った需要のないおぢが、マッチングアプリと婚活市場に大量流入。\n長年ためこんだ性欲・孤独・怨念がそのまま恋愛市場に放流され、水質はみるみる悪化。\n婚活女性は大量のおぢをかき分けながら、本当に会いたい人を探すハメに。\nこれは工場排水をそのまま川に流すようなもの。\n\n結果：恋愛市場は、おぢ汚水でドブ川になる。\nそう考えるとオトナのお店とは、おぢを受け止めて恋愛市場への流出を防ぐ、巨大な浄水フィルターだったのかもしれない。\n\nオトナのお店、必要？いらない？ コメントで教えて。\n\n※風刺ネタです。実在の店・人物とは関係ありません',
    hashtags: ['もしもラボ', 'もしも', 'マッチングアプリ', '婚活', 'おぢ'],
    endStats: [['おぢの行き先', 'アプリと婚活', '一斉に流入'], ['恋愛市場の水質', 'ドブ', 'おぢ汚水'], ['オトナのお店の正体', '浄水フィルター', 'かもしれない']],
    sources: '※風刺ネタです。実在の店・人物とは関係ありません',
  },
});
