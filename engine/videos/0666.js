import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';
import { planTimes } from '../scenes/fitness.js';

// もしも推しが全員いっせいに引退したら？（皮肉回・台本 S61・沼が消えたら・作り直し 0625）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。plan/remake.md の2：0625 推しが消えたら（インスタ8.4万・TikTok 2,900、平均視聴16.7秒）
// 作り直しの入り：消えた→祭壇が空になる→給料日にやることがない の三段を先に。数字は20秒より後。着地は 常連客 という人の姿
// 数字（0625 で確認済み）：推しにお金を使う人の平均 月16,356円（株式会社A3「推し活実態調査」2025年・ネオマーケティング調べ）
// 実在のアイドル・グッズ・ホテル・カフェの見た目は出さない（推しは光る人影。店はすべて架空）

const GOLD = '#ffd27a', PINK = '#ff7ab8';
const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const PEN_COL = ['#ff5fae', '#7fd4ff', '#ffd27a', '#9be86a', '#c58bff'];
const OSHI = () => makeWoman({ shirt: '#ff9ec7', hair: '#2a2030', pants: '#3a3046', skirt: true });

// ---------- A：推し活女子の部屋（原点）：壁いっぱいの祭壇 ----------
const room = makeRoom({ w: 8, d: 6, wall: '#f6e6ef', floor: '#c9a27a' }); S.add(room); room.userData.rw.visible = false;
function photoTex(i) { const c = document.createElement('canvas'); c.width = 200; c.height = 260; const g = c.getContext('2d'); const col = PEN_COL[i % 5];
  const gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, col); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(0, 0, 200, 260);
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(100, 95, 42, 0, 7); g.fill(); g.beginPath(); g.ellipse(100, 230, 70, 80, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(20 + (k * 37) % 170, 20 + (k * 53) % 220, 5, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const FRAMES = [], PHOTOS = [];
for (let i = 0; i < 15; i++) { const x = -2.4 + (i % 5) * 1.2, y = 1.15 + Math.floor(i / 5) * 0.95; const fr = box(0.8, 0.95, 0.05, mat(['#f2c14e', '#ffffff', '#ff9ec7'][i % 3])); fr.position.set(x, y, -2.92); S.add(fr); FRAMES.push(fr);
  const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.8), new THREE.MeshBasicMaterial({ map: photoTex(i) })); ph.position.set(x, y, -2.89); S.add(ph); PHOTOS.push(ph);
  const blank = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.8), mat('#fbfbf8')); blank.position.set(x, y, -2.895); S.add(blank); }
const altar = box(5.8, 0.7, 0.6, mat('#ffffff')); altar.position.set(0, 0.35, -2.6); S.add(altar);
const PENS = []; for (let i = 0; i < 8; i++) { const p = box(0.06, 0.45, 0.06, new THREE.MeshBasicMaterial({ color: PEN_COL[i % 5] })); p.position.set(-2.4 + i * 0.68, 0.95, -2.55); p.rotation.z = (i % 2 ? 1 : -1) * 0.2; S.add(p); PENS.push(p); }
const UCHIWA = []; for (let i = 0; i < 3; i++) { const u = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), mat(PEN_COL[(i + 1) % 5])); u.position.set(-1.0 + i * 1.0, 0.95, -2.42); S.add(u); UCHIWA.push(u); }
const OTA = OSHI(); S.add(OTA);
const sparkA = makeSparkles(320, 0.18, 0xffe9a8); S.add(sparkA.points); sparkA.init(FRAMES.map(f => [f.position.x, f.position.y, f.position.z + 0.2]), 0.4, 1.2);
const kieta = label('推し 全員引退', { w: 900, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(kieta);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.6 }); S.add(katamaru);
const PHONE = makePhone({ w: 0.36, h: 0.72 }); S.add(PHONE.g);
function drawPhone(mode, t) { PHONE.draw(mode + (mode === 'scroll' ? Math.floor(t * 8) : ''), (g, w, h) => { g.fillStyle = '#f4f4f6'; g.fillRect(0, 0, w, h);
  if (mode === 'lottery') { g.fillStyle = '#ff5fae'; g.fillRect(0, 0, w, 150); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('チケット抽選', w / 2, 100); g.fillStyle = '#888'; g.font = '800 54px "Noto Sans CJK JP", sans-serif'; g.fillText('受付はありません', w / 2, 520); }
  else { const off = (t * 300) % 200; for (let i = -1; i < 7; i++) { g.fillStyle = ['#d8dce4', '#e8d8e0', '#d8e4dc'][(i + 3) % 3]; g.fillRect(30, i * 200 + off + 20, w - 60, 160); } } }); }

// ---------- B：リビング（x=60）：親は大喜び ----------
const BX = 60;
const lroom = makeRoom({ w: 8, d: 6, wall: '#efe6d6', floor: '#b48a5e' }); lroom.position.set(BX, 0, 0); lroom.userData.rw.visible = false; S.add(lroom);
const MOM = makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33', pants: '#4a4f60' }); S.add(MOM);
const DAD = makeMan({ shirt: '#59606e', hair: '#5a5a5a' }); S.add(DAD);
const oyaLab = label('親は大喜び', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.5 }); S.add(oyaLab);
const tedori = label('給料が手元に残る', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.8 }); S.add(tedori);
const coinM = mat('#e8b84a'); const COINS = []; for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), coinM); S.add(c); COINS.push(c); }

// ---------- C：カレンダー（部屋の左の壁） ----------
const calC = document.createElement('canvas'); calC.width = 900; calC.height = 700; const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace;
const CAL = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ map: calT })); CAL.rotation.y = Math.PI / 2; CAL.position.set(-3.92, 1.8, -0.6); S.add(CAL);
let calKey = ''; function drawCal(k) { const key = k.toFixed(2); if (key === calKey) return; calKey = key; const g = calC.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 900, 700); g.fillStyle = '#e05a8a'; g.fillRect(0, 0, 900, 110); g.fillStyle = '#fff'; g.font = '900 70px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('週末の予定', 450, 58);
  ['土', '日'].forEach((d, j) => { g.fillStyle = '#333'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.fillText(d, 270 + j * 360, 160); });
  for (let w = 0; w < 4; w++) for (let j = 0; j < 2; j++) { const x = 100 + j * 360, y = 200 + w * 120; g.strokeStyle = '#ccc'; g.lineWidth = 3; g.strokeRect(x, y, 340, 110); const idx = w * 2 + j; if (idx / 8 >= k) { g.fillStyle = PEN_COL[idx % 5]; g.fillRect(x + 10, y + 12, 320, 86); g.fillStyle = '#fff'; g.font = '900 50px "Noto Sans CJK JP", sans-serif'; g.fillText(['遠征', 'ライブ', '遠征', '握手会', 'ライブ', '遠征', 'カフェ', '遠征'][idx], x + 170, y + 56); } }
  calT.needsUpdate = true; }

// ---------- D：お金（x=120）：月の平均 ----------
const DX = 120;
flat(16, 12, '#f2e4ec', DX, 0);
const dWall = box(16, 6, 0.2, mat('#fbe8f0')); dWall.position.set(DX, 3, -4); S.add(dWall);
const D_OTA = OSHI(); S.add(D_OTA);
const BILLS = []; for (let i = 0; i < 16; i++) { const b = box(0.5, 0.02, 0.25, mat(i % 4 === 0 ? '#c8b070' : '#d8c890')); S.add(b); BILLS.push(b); }

// ---------- E：街（x=200）：ホテル・コラボカフェ・グッズ工場 ----------
const EX = 200;
flat(60, 24, '#b8b4ac', EX, -2);
function bldg(x, z, w, h, d, color, name, nameBg) { const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); const b = box(w, h, d, mat(color)); b.position.y = h / 2; g.add(b);
  const WIN = []; const nx = Math.max(2, Math.floor(w / 1.1)), ny = Math.max(1, Math.floor((h - 1.4) / 1.2));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), new THREE.MeshBasicMaterial({ color: '#ffe9a8' })); m.position.set(-w / 2 + (i + 0.5) * w / nx, 1.3 + j * 1.2, d / 2 + 0.02); g.add(m); WIN.push(m); }
  const sign = label(name, { w: 900, size: 100, color: '#fff', bg: nameBg, sx: Math.min(w * 0.85, 4.0) }); sign.position.set(0, h + 0.8, d / 2); g.add(sign);
  return { g, WIN }; }
const HOTEL = bldg(EX, -6, 7, 13, 6, '#c9ccd6', 'もしもホテル', 'rgba(60,90,160,.92)');
const vacant = label('週末なのに 空室だらけ', { w: 1024, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 3.0 }); S.add(vacant);
const fullLab = label('満室', { w: 400, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(fullLab);
// カフェの中（x=260）
const FX = 260;
const croom = makeRoom({ w: 9, d: 7, wall: '#fbe3ee', floor: '#d9b48a' }); croom.position.set(FX, 0, 0); croom.userData.rw.visible = false; S.add(croom);
for (let i = 0; i < 4; i++) { const x = FX - 2.4 + (i % 2) * 3.0, z = -1.8 + Math.floor(i / 2) * 2.4; const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 20), mat('#ffffff')); tb.position.set(x, 0.9, z); S.add(tb); const lg = box(0.1, 0.9, 0.1, mat('#8a8f99')); lg.position.set(x, 0.45, z); S.add(lg); for (const s of [-1, 1]) { const ch = box(0.5, 0.5, 0.5, mat('#ff9ec7')); ch.position.set(x + s * 1.0, 0.25, z); S.add(ch); } }
const cafeSign = label('コラボカフェ', { w: 768, size: 100, color: '#fff', bg: 'rgba(230,90,150,.92)', sx: 1.8 }); cafeSign.position.set(FX, 2.6, -3.2); S.add(cafeSign);
const STAFF = makeWoman({ shirt: '#ffffff', hair: '#3a2620' }); S.add(STAFF);
const karappo = label('空っぽ', { w: 512, size: 120, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(karappo);
// 工場（x=320）
const KX = 320;
const kroom = makeRoom({ w: 12, d: 8, h: 5, wall: '#c9ced6', floor: '#8a8f99' }); kroom.position.set(KX, 0, 0); kroom.userData.rw.visible = false; S.add(kroom);
const belt = box(10, 0.25, 1.4, mat('#2a2d33')); belt.position.set(KX, 1.0, -0.5); S.add(belt);
for (const x of [-4.5, 4.5]) { const leg = box(0.3, 1.0, 1.2, mat('#5a5f6b')); leg.position.set(KX + x, 0.5, -0.5); S.add(leg); }
const ITEMS = []; for (let i = 0; i < 10; i++) { const it = box(0.32, 0.55, 0.06, mat(PEN_COL[i % 5])); S.add(it); ITEMS.push(it); }
const press = box(1.6, 1.2, 1.6, mat('#e0a030')); press.position.set(KX, 2.6, -0.5); S.add(press);
const factSign = label('グッズ工場', { w: 768, size: 100, color: '#fff', bg: 'rgba(80,80,100,.92)', sx: 1.6 }); factSign.position.set(KX - 2.5, 3.8, -3.8); S.add(factSign);
const teishi = label('停止', { w: 400, size: 130, color: '#fff', bg: 'rgba(220,40,40,.95)', sx: 0.9 }); S.add(teishi);
const WORKER = makeMan({ shirt: '#3a5a8a', hair: '#2a2420' }); S.add(WORKER);
// 困った人たち（x=380）：ホテル・カフェ・工場の人が並ぶ
const GX = 380;
flat(14, 10, '#c8c4bc', GX, 0);
const gWall = box(14, 4, 0.2, mat('#e6e2da')); gWall.position.set(GX, 2, -3); S.add(gWall);
const STAND = [makeMan({ shirt: '#2a3a6a', hair: '#2a2420' }), makeWoman({ shirt: '#ffffff', hair: '#3a2620' }), makeMan({ shirt: '#3a5a8a', hair: '#5a5a5a' }), makeWoman({ shirt: '#c8a060', hair: '#6b4a33' })]; STAND.forEach(p => S.add(p));
const SLAB = ['ホテル', 'カフェ', '工場', 'うちわ印刷'].map(s => { const l = label(s, { w: 512, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.85 }); S.add(l); return l; });
const komatta = label('困った', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(komatta);
const joren = label('いちばんの常連客', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,150,40,.97)', sx: 1.9 }); S.add(joren);
const sparkG = makeSparkles(160, 0.2, 0xffe08a); S.add(sparkG.points); sparkG.init([[0, 2.2, 0.2]], 1.0, 1.6);

const PEOPLE = [OTA, MOM, DAD, D_OTA, STAFF, WORKER, ...STAND];
const LABELS = [kieta, katamaru, oyaLab, tedori, vacant, fullLab, karappo, teishi, ...SLAB, komatta, joren];
function poseReset(p) { const u = p.userData; u.arms.forEach(a => a.rotation.set(0, 0, 0)); u.legs.forEach(l => l.rotation.set(0, 0, 0)); u.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.y = 0; }
function seiza(p) { const u = p.userData; u.legs.forEach(l => l.rotation.x = Math.PI / 2); p.position.y = -0.62; u.arms.forEach(a => a.rotation.set(-0.35, 0, 0)); }
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkG.set(0); PHONE.g.visible = false; COINS.forEach(c => c.visible = false); BILLS.forEach(b => b.visible = false);
  PHOTOS.forEach(p => p.visible = false); PENS.forEach(p => p.visible = true); UCHIWA.forEach(u => u.visible = true);
  OTA.position.set(0, 0, -0.6); OTA.rotation.y = Math.PI; drawCal(1);
  MOM.position.set(BX - 0.6, 0, 0); DAD.position.set(BX + 0.6, 0, 0); MOM.rotation.y = 0.3; DAD.rotation.y = -0.3;
  D_OTA.position.set(DX, 0, 0); STAFF.position.set(FX + 2.6, 0, 1.4); STAFF.rotation.y = -0.6; WORKER.position.set(KX + 1.6, 0, 1.2); WORKER.rotation.y = -0.5;
  STAND.forEach((p, i) => { p.position.set(GX - 2.4 + i * 1.6, 0, 0); });
  HOTEL.WIN.forEach(w => w.material.color.set('#ffe9a8'));
  hemi.intensity = 1.2; el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.45;
function altarCam(u = 0) { look(lerp(0.5, 0.3, u), 1.7, lerp(3.8, 3.4, u), 0, 1.75, -2.0, 50); }
function shot0(t) { // 0秒＝サムネ：部屋の壁いっぱいの推しの祭壇から、写真が一斉に消える
  reset(); lift(0); seiza(OTA); OTA.position.set(0.0, -0.62, -0.4); OTA.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0));
  PHOTOS.forEach(p => p.visible = t < TP);
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.3)); el.flash.style.opacity = t < TP + 0.1 ? 0.4 : 0; say(kieta, t, TP + 0.1, 0, 1.75, -1.4, 1.4); }
  altarCam(ease(clamp(t / 3)));
  return S;
}
function sKatamaru(t) { // 推し活女子が、空っぽの祭壇の前で正座のまま固まる。
  reset(); lift(0); seiza(OTA); OTA.position.set(0.0, -0.62, -0.4); OTA.userData.head.rotation.x = -0.15;
  if (t > 1.2) say(katamaru, t, 1.2, 0.5, 1.5, -0.4, 0.5);
  const u = ease(clamp(t / 4)); look(lerp(1.6, 2.2, u), lerp(1.6, 2.0, u), lerp(2.6, 3.4, u), 0, 1.2, -1.4, 50);
  return S;
}
function sOya(t) { // 親は大喜び。
  reset(); lift(150); [MOM, DAD].forEach((p, i) => { const k = t * 6 + i; p.userData.arms[0].rotation.set(0, 0, -2.6 + Math.sin(k) * 0.3); p.userData.arms[1].rotation.set(0, 0, 2.6 - Math.sin(k) * 0.3); p.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.12; });
  say(oyaLab, t, 0.3, BX, 2.6, 0, 1.4);
  look(BX + 0.3, 1.9, 4.6, BX, 1.4, 0, 50);
  return S;
}
function sTedori(t) { // これで給料が手元に残る。
  reset(); lift(150); MOM.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); DAD.userData.arms[1].rotation.set(-1.0, 0, 0.3);
  COINS.forEach((c, i) => { const k = clamp((t - 0.2 - i * 0.08) / 0.5); c.visible = k > 0; c.position.set(BX - 0.6 + (i % 3) * 0.1 - 0.1, 1.05 + Math.floor(i / 3) * 0.05 + (1 - easeOut(k)) * 1.2, 0.45); });
  say(tedori, t, 0.6, BX, 2.6, 0, 1.6);
  look(BX + 0.3, 1.9, 4.6, BX, 1.4, 0, 50);
  return S;
}
function sKyuryo(t) { // 給料日。いつもならチケットの抽選。
  reset(); lift(150); OTA.position.set(0.9, 0, 0.6); OTA.rotation.y = 0.4; OTA.userData.arms[1].rotation.set(-1.4, 0, -0.3); OTA.userData.head.rotation.x = 0.35;
  PHONE.g.visible = true; drawPhone('lottery', t); PHONE.g.position.set(0.75, 1.32, 1.0); PHONE.g.rotation.set(-0.5, 0.4, 0);
  setHud('給料日', '25日', 1); look(2.6, 1.9, 3.8, 0.8, 1.3, 0.6, 46);
  return S;
}
function sNai(t) { // 今日は、することがない。
  reset(); lift(150); OTA.position.set(0.9, 0, 0.6); OTA.rotation.set(0, 0.4, 0); OTA.userData.arms.forEach(a => a.rotation.set(0.05, 0, 0)); OTA.userData.head.rotation.x = 0.1; OTA.userData.head.rotation.y = Math.sin(t * 1.4) * 0.5;
  setHud('給料日', '25日', 1); const u = ease(clamp(t / 3)); look(lerp(2.2, 3.0, u), 2.0, lerp(3.4, 4.2, u), 0.6, 1.3, 0.2, 50);
  return S;
}
function sShumatsu(t, d) { // 週末。カレンダーから、遠征の予定が全部消える。
  reset(); lift(280); drawCal(clamp((t - 0.4) / (d - 1.0))); OTA.position.set(-3.1, 0, 1.0); OTA.rotation.y = -Math.PI / 2; OTA.userData.head.rotation.x = -0.1;
  setHud('週末', '土・日', 1); look(-1.1, 1.9, 0.9, -3.9, 1.8, -0.6, 50);
  return S;
}
function sYoru(t) { // 夜。うちわを作るはずだった手で、ただスマホをスクロール。
  reset(); lift(150); hemi.intensity = 0.7; OTA.position.set(0.4, -0.62, 0.6); seiza(OTA); OTA.rotation.y = 0.5; OTA.userData.arms[1].rotation.set(-1.3, 0, -0.3); OTA.userData.head.rotation.x = 0.45;
  PHONE.g.visible = true; drawPhone('scroll', t); PHONE.g.position.set(0.32, 0.72, 0.95); PHONE.g.rotation.set(-0.7, 0.5, 0);
  setHud('夜', '23:00', 1); look(2.4, 1.7, 3.4, 0.4, 0.8, 0.5, 46);
  return S;
}
function sDemo(t, d) { // でも、本当に困ったのは推し活女子だけじゃなかった。
  reset(); lift(80); const u = ease(clamp(t / d)); look(EX, lerp(3, 6, u), lerp(12, 22, u), EX, 6, -6, 50);
  return S;
}
function sMoney(t, d) { // 推しに使うお金は、使う人で月に平均16,356円。
  reset(); lift(150); D_OTA.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0));
  BILLS.forEach((b, i) => { const k = clamp((t * 1.2 - i * 0.15) % 1.5); b.visible = true; b.position.set(DX + Math.sin(i * 2.1) * 0.6, 1.3 + k * 1.6, 0.4 - k * 2); b.rotation.set(t * 2 + i, i, 0); });
  setTop('推しに使うお金（使う人の平均・2025年）', '月' + Math.round(16356 * ease(clamp((t - 0.3) / 1.4))).toLocaleString('ja-JP') + '円', fade(t, 0.3, d, 0.25), PINK);
  look(DX + 0.4, 1.9, 4.4, DX, 1.6, -0.4, 50);
  return S;
}
function sHotel(t, d) { // 遠征で満室だったホテルが、週末なのに空室だらけ。
  reset(); lift(80); const k = clamp((t - 0.8) / (d - 1.4)); HOTEL.WIN.forEach((w, i) => { const off = ((i * 37) % 100) / 100 < k * 0.85; w.material.color.set(off ? '#4a5060' : '#ffe9a8'); });
  if (t < 0.8) say(fullLab, t, 0.1, EX + 3.0, 4.0, -2.6, 1.0); else say(vacant, t, 0.9, EX, 7.0, -2.4, 3.6);
  look(EX + 1, 5, 16, EX, 6.2, -6, 50);
  return S;
}
function sCafe(t, d) { // コラボカフェは空っぽ。
  reset(); lift(120); STAFF.userData.head.rotation.x = 0.35; STAFF.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0));
  if (t > 0.5) say(karappo, t, 0.5, FX, 2.2, -0.6, 1.0);
  look(FX + 2.0, 3.0, 5.4, FX, 0.8, -0.6, 50);
  return S;
}
function sKojo(t, d) { // グッズ工場の機械が止まる。
  reset(); lift(120); const v = clamp(1 - t / 1.2); ITEMS.forEach((it, i) => { const tt = t < 1.2 ? t - t * t / 2.4 : 0.6; const u = (i / ITEMS.length + tt * 0.25) % 1; it.position.set(KX - 4.5 + u * 9, 1.4, -0.5); });
  press.position.y = 2.6 - (v > 0 ? Math.abs(Math.sin(t * 6)) * 0.4 * v : 0);
  if (t > 1.2) say(teishi, t, 1.2, KX, 3.7, -0.3, 0.9); WORKER.userData.head.rotation.y = 0.4; WORKER.userData.arms.forEach(a => a.rotation.set(0.1, 0, 0));
  look(KX + 2.4, 2.6, 5.6, KX, 1.5, -0.5, 50);
  return S;
}
function standCam(u = 0) { look(GX, lerp(2.4, 2.6, u), lerp(12.0, 12.8, u), GX, 1.5, 0, 50); }
function sKekka(t, d) { // 結果：推しが消えて、推し活女子より先に、
  reset(); lift(150); OTA.position.set(0.4, -0.62, 0.6); seiza(OTA); OTA.rotation.y = 0.5; OTA.userData.head.rotation.x = 0.4; PHONE.g.visible = true; drawPhone('scroll', t); PHONE.g.position.set(0.32, 0.72, 0.95); PHONE.g.rotation.set(-0.7, 0.5, 0);
  const u = ease(clamp(t / d)); look(lerp(2.4, 3.0, u), lerp(1.7, 2.1, u), lerp(3.4, 4.4, u), 0.4, 0.8, 0.4, 46);
  return S;
}
function sSaifu(t, d) { // その財布に食べさせてもらっていた人たちが困った。
  reset(); lift(150); STAND.forEach((p, i) => { p.userData.head.rotation.x = 0.35; p.rotation.x = 0.08; SLAB[i].position.set(p.position.x, 2.35, 0); SLAB[i].visible = true; SLAB[i].userData.size(0.85); });
  if (t > 1.0) say(komatta, t, 1.0, GX, 3.1, -0.3, 1.0);
  standCam(ease(clamp(t / d)));
  return S;
}
function sJoren(t, d) { // 推し活女子は、日本中の週末を予約で埋める、
  reset(); lift(280); drawCal(0); OTA.position.set(-3.1, 0, 1.0); OTA.rotation.y = -Math.PI / 2 - 0.3; OTA.userData.arms[1].rotation.set(-1.5, 0, 0);
  look(-1.1, 1.9, 0.9, -3.9, 1.8, -0.6, 50);
  return S;
}
function sJoren2(t, d) { // いちばんの常連客だった。
  reset(); lift(100); OTA.position.set(0, 0, 0.4); OTA.rotation.y = 0; sparkG.set((t * 0.3) % 1);
  say(joren, t, 0.3, 0, 2.5, 0.4, 1.8);
  look(0.3, 1.8, 3.8, 0, 1.6, 0.2, 50);
  return S;
}
function sAsk(t) { // 推しに使うお金、月いくらまでならあり？（冒頭と同じ構図。写真は消えたまま）
  reset(); lift(0); seiza(OTA); OTA.position.set(0.0, -0.62, -0.4); altarCam(0);
  return S;
}

const NARR = { '推し活女子': 'おしかつじょし', '推し': 'おし', '祭壇': 'さいだん', '正座': 'せいざ', '親': 'おや', '給料日': 'きゅうりょうび', '抽選': 'ちゅうせん', '遠征': 'えんせい', '16,356円': 'いちまんろくせんさんびゃくごじゅうろくえん', '月に': 'つきに', '空室': 'くうしつ', '満室': 'まんしつ', '結果：': '結果、', '常連客': 'じょうれんきゃく', '日本中': 'にほんじゅう', '月いくら': 'つきいくら', '工場': 'こうじょう', '財布': 'さいふ' };
const P = planTimes([
  ['推し活女子が、空っぽの<br>祭壇の前で正座のまま固まる。', sKatamaru],
  ['親は大喜び。', sOya],
  ['これで給料が手元に残る。', sTedori],
  ['給料日。いつもなら<br>チケットの抽選。', sKyuryo],
  ['今日は、することがない。', sNai],
  ['週末。カレンダーから、<br>遠征の予定が全部消える。', sShumatsu],
  ['夜。うちわを作るはずだった<br>手で、ただスマホをスクロール。', sYoru],
  ['でも、本当に困ったのは<br>推し活女子だけじゃなかった。', sDemo],
  ['推しに使うお金は、使う人で<br>月に平均16,356円。', sMoney],
  ['遠征で満室だったホテルが、<br>週末なのに空室だらけ。', sHotel],
  ['コラボカフェは空っぽ。', sCafe],
  ['グッズ工場の機械が止まる。', sKojo],
  ['結果：推しが消えて、<br>推し活女子より先に、', sKekka],
  ['その財布に食べさせて<br>もらっていた人たちが困った。', sSaifu],
  ['推し活女子は、日本中の<br>週末を予約で埋める、', sJoren],
  ['いちばんの常連客だった。', sJoren2],
  ['推しに使うお金、<br>月いくらまでならあり？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0666',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0625',
    hookLine: '部屋の壁いっぱいの推しの祭壇から、写真が一斉に消える。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも推しが全員いっせいに引退したら？',
    titleHtml: 'もしも推しが<br>全員いっせいに<br>引退したら？',
    mood: 'tension', seed: 666, hits: [TP, P.at(12), P.at(15)], risers: [P.at(7)], impacts: [P.at(8, 0.3), P.at(9, 0.9), P.at(11, 1.2), P.at(13, 1.0)],
    sfx: [[TP, 'poof'], [P.at(1, 0.3), 'bubble'], [P.at(2, 0.3), 'bubble'], [P.at(5, 0.4), 'poof'], [P.at(7, 0.2), 'whoosh'], [P.at(8, 0.4), 'bubble'], [P.at(9, 0.9), 'meter', 0.4], [P.at(11, 1.2), 'alarm'], [P.at(15, 0.3), 'bubble']],
    narr: NARR,
    ask: '推しに使うお金、月いくらまでならあり？',
    caption: 'もしも推しが全員いっせいに引退したら？\n\n推し活女子が、空っぽの祭壇の前で正座のまま固まる。\n親は大喜び。これで給料が手元に残る。\n給料日。いつもならチケットの抽選。今日は、することがない。\n週末。カレンダーから、遠征の予定が全部消える。\n夜。うちわを作るはずだった手で、ただスマホをスクロール。\nでも、本当に困ったのは推し活女子だけじゃなかった。\n推しに使うお金は、使う人で月に平均16,356円。\n遠征で満室だったホテルが、週末なのに空室だらけ。コラボカフェは空っぽ。グッズ工場の機械が止まる。\n\n結果：推しが消えて、推し活女子より先に、その財布に食べさせてもらっていた人たちが困った。\n推し活女子は、日本中の週末を予約で埋める、いちばんの常連客だった。\n\n推しに使うお金、月いくらまでならあり？ コメントで教えて。\n\n※風刺ネタです。推しが全員引退するのは、もしもの設定です。登場する人物・店は架空です\n出典：株式会社A3「推し活実態調査」2025年（ネオマーケティング調べ。推しにお金を使う人の平均 月16,356円）',
    hashtags: ['もしもラボ', 'もしも', '推し活', '推し', '遠征'],
    endStats: [['推しに使うお金（使う人の平均）', '月16,356円', 'A3 推し活実態調査 2025年'], ['先に困ったのは', 'ホテル・カフェ・工場', 'もしもの結果'], ['推し活女子の正体', 'いちばんの常連客', '']],
    sources: '出典：株式会社A3「推し活実態調査」2025年（ネオマーケティング調べ）',
  },
});
