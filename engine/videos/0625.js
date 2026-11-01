import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしも推しが消えたら？（v2・風刺回）
// 2026/11/02 ゆうとと決めた台本3。筋は現実寄り：オタク本人は別の趣味に移るだけで平気。困るのは推し活のお金で回っていた側
// 数字（株式会社A3「推し活実態調査」2025年4月・ネオマーケティング調べ）：
//  ・推し活の市場規模 約3.9兆円／年（推計）
//  ・推しにお金を使う人の平均 月16,356円
//  ・推しがいる人 34.8%（推計 約2,828万人）

const GOLD = '#ffd27a', PINK = '#ff7ab8', BLUE = '#7fd4ff', GREEN = '#9be86a', GRAY = '#cfd3dc';

const S = new THREE.Scene();
S.background = new THREE.Color('#0d0b1a'); S.fog = new THREE.Fog(0x0d0b1a, 60, 200);
const hemi = new THREE.HemisphereLight(0xd6d0ff, 0x2a2434, 1.0); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(12, 30, 22); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mat('#211f2c')); ground.rotation.x = -Math.PI / 2; S.add(ground);

// ---------- A：ライブ会場（原点） ----------
const stageB = box(16, 1.4, 7, mat('#1b1830')); stageB.position.set(0, 0.7, -8); S.add(stageB);
const back = box(18, 10, 0.4, mat('#14122a')); back.position.set(0, 5, -11.6); S.add(back);
const spotM = new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.18, depthWrite: false });
const spot = new THREE.Mesh(new THREE.ConeGeometry(2.4, 10, 32, 1, true), spotM); spot.position.set(0, 6.4, -8); S.add(spot);
// 推し（光る人影。特定の誰でもない）
const oshiM = new THREE.MeshBasicMaterial({ color: '#ffe9a8' });
const oshi = new THREE.Group(); { const p = makeWoman({ shirt: '#ffffff', hair: '#2a2030' }); p.traverse(o => { if (o.isMesh) o.material = oshiM; }); p.scale.setScalar(1.25); oshi.add(p); oshi.userData.p = p; }
oshi.position.set(0, 1.4, -8); S.add(oshi);
const oshiPoof = makeSparkles(500, 0.45, 0xffe9a8); S.add(oshiPoof.points); oshiPoof.init([[0, 2.4, -8], [0, 3.4, -8], [0, 1.8, -8]], 1.2, 7);
const stageLight = new THREE.PointLight(0xffe0a0, 40, 18, 1.4); stageLight.position.set(0, 7, -5); S.add(stageLight);
// ファンとペンライト
const FANS = []; const PEN_COL = ['#ff5fae', '#7fd4ff', '#ffd27a', '#9be86a', '#c58bff'];
{ const r = rng(25); for (let i = 0; i < 42; i++) { const row = Math.floor(i / 7), col = i % 7; const f = r() < 0.65 ? makeWoman({ shirt: ['#2b2f3a', '#3a2f4a', '#f2f2f2', '#4a3a5a'][i % 4], hair: ['#3a2620', '#1d1a19', '#6b4a33'][i % 3] }) : makeMan({ shirt: ['#2b2f3a', '#3f3f46'][i % 2] }); f.position.set((col - 3) * 1.5 + (r() - .5) * .4, 0, -1.5 + row * 1.4 + (r() - .5) * .3); f.rotation.y = Math.PI; S.add(f);
  const penM = new THREE.MeshBasicMaterial({ color: PEN_COL[i % 5] }); const pen = box(0.07, 0.5, 0.07, penM); pen.castShadow = false; pen.position.y = -0.75; f.userData.arms[1].add(pen); f.userData.penM = penM; f.userData.penC = new THREE.Color(PEN_COL[i % 5]); FANS.push(f); } }
const PEN_OFF = new THREE.Color('#3a3a44');
function fans(t, on = 1) { FANS.forEach((f, i) => { const a = f.userData.arms[1]; a.rotation.x = -2.7 + (on > 0.5 ? Math.sin(t * 7 + i) * 0.35 : 0.9); f.userData.penM.color.copy(PEN_OFF).lerp(f.userData.penC, on); f.userData.head.rotation.x = on > 0.5 ? -0.2 : 0.25; }); }

// ---------- B：世間（x=-40）：おぢの井戸端 ----------
const WX = -40;
const bench = box(4.2, 0.5, 1, mat('#7a5a3a')); bench.position.set(WX, 0.25, 0); S.add(bench);
const SEKEN = []; { const r = rng(40); for (let i = 0; i < 3; i++) { const p = makeOji(r); p.position.set(WX - 1.4 + i * 1.4, 0, 0.6); S.add(p); SEKEN.push(p); } }
const sekenLab = label('目を覚ませ', { size: 120, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.4 }); sekenLab.position.set(WX, 3.0, 0.8); S.add(sekenLab);
const parkTree = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10), mat('#3f6b3a')); parkTree.position.set(WX + 3.4, 4.2, -3); S.add(parkTree);
const trunk = box(0.4, 3, 0.4, mat('#5a4030')); trunk.position.set(WX + 3.4, 1.5, -3); S.add(trunk);

// ---------- C：オタクの部屋（x=60） ----------
const RX = 60;
const room = makeRoom({ w: 9, d: 7, wall: '#f3e6ef', floor: '#c9a27a' }); room.position.set(RX, 0, 0); S.add(room); room.userData.rw.visible = false;
const shelf = box(4.4, 2.4, 0.6, mat('#ffffff')); shelf.position.set(RX - 1.2, 1.2, -3.1); S.add(shelf);
const GOODS = new THREE.Group(); S.add(GOODS);
{ const r = rng(61); for (let i = 0; i < 18; i++) { const c = PEN_COL[i % 5]; const g = i % 3 === 0 ? box(0.28, 0.5, 0.05, mat(c)) : i % 3 === 1 ? new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), mat(c)) : box(0.3, 0.3, 0.3, mat(c)); g.position.set(RX - 3.1 + (i % 6) * 0.75, 0.55 + Math.floor(i / 6) * 0.8, -2.85); if (i % 3 === 1) g.rotation.x = Math.PI / 2; GOODS.add(g); } }
for (const [x, c] of [[RX + 1.6, '#ff9ec7'], [RX + 3.0, '#9fd0ff']]) { const pst = box(1.1, 1.5, 0.04, mat(c)); pst.position.set(x, 2.3, -3.42); S.add(pst); }
const ota = makeWoman({ shirt: '#ff9ec7', hair: '#2a2030' }); ota.position.set(RX + 0.6, 0, 0.4); S.add(ota);
const COINS = new THREE.Group(); S.add(COINS); const coinM = mat('#e8b84a');
for (let i = 0; i < 24; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20), coinM); c.position.set(RX + 2.0 + (i % 3) * 0.6, 0.04 + Math.floor(i / 3) * 0.085, 0.6); COINS.add(c); }
const POTS = new THREE.Group(); S.add(POTS);
for (let i = 0; i < 3; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 14), mat('#b56a42')); pot.position.set(RX + 1.6 + i * 0.8, 0.22, 1.4); POTS.add(pot); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), mat(['#5aa04a', '#6fb85a', '#4f8f3f'][i])); lf.position.set(RX + 1.6 + i * 0.8, 0.7, 1.4); POTS.add(lf); }
const hobbyLab = label('新しい趣味', { size: 110, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 1.8 }); hobbyLab.position.set(RX + 2.4, 2.0, 1.4); S.add(hobbyLab);
const okLab = label('別に平気', { size: 120, color: '#fff', bg: 'rgba(120,90,200,.92)', sx: 1.6 }); S.add(okLab);

// ---------- D：街（x=140）：工場・カフェ・ホテル・駅・印刷屋 ----------
const TX = 140;
function bldg(x, z, w, h, d, color, name, nameColor) {
  const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
  const b = box(w, h, d, mat(color)); b.position.y = h / 2; g.add(b);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const winOn = new THREE.CanvasTexture(c);
  { const q = c.getContext('2d'); q.fillStyle = '#ffe9a8'; q.fillRect(0, 0, 256, 256); }
  const winM = new THREE.MeshBasicMaterial({ color: '#ffe9a8' });
  const nx = Math.max(2, Math.floor(w / 1.1)), ny = Math.max(1, Math.floor((h - 1.4) / 1.2));
  const WIN = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), winM.clone()); m.position.set(-w / 2 + (i + 0.5) * w / nx, 1.3 + j * 1.2, d / 2 + 0.02); g.add(m); WIN.push(m); }
  const sign = label(name, { size: 100, color: '#fff', bg: nameColor, sx: Math.min(w * 0.85, 4.6) }); sign.position.set(0, h + 0.9, d / 2); g.add(sign);
  return { g, winM, sign, WIN };
}
const FACT = bldg(TX - 18, -6, 8, 5, 6, '#7a808c', 'グッズ工場', 'rgba(80,80,100,.92)');
const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 12), mat('#5a5f6b')); chim.position.set(TX - 15.5, 7, -7.5); S.add(chim);
const CAFE = bldg(TX - 8, -4, 6, 4, 5, '#f4d6e2', 'コラボカフェ', 'rgba(230,90,150,.92)');
const HOTEL = bldg(TX + 1.5, -8, 7, 14, 6, '#c9ccd6', '地方のホテル', 'rgba(60,90,160,.92)');
const PRINT = bldg(TX + 11, -4, 6, 4, 5, '#e6dcc6', 'うちわ印刷', 'rgba(200,120,40,.92)');
// 新幹線（白い車体＋青い帯。窓の中に人）
const TRAIN = new THREE.Group(); TRAIN.position.set(TX, 0, 6); S.add(TRAIN);
{ const body = box(30, 2.6, 2.8, mat('#f2f4f6')); body.position.y = 1.9; TRAIN.add(body); const band = box(30.05, 0.25, 2.85, mat('#1f4fa8')); band.position.y = 1.2; TRAIN.add(band);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), mat('#f2f4f6')); nose.scale.set(3, 0.95, 1); nose.position.set(15.5, 1.75, 0); TRAIN.add(nose); }
const SEATS = []; { const r = rng(91); for (let i = 0; i < 16; i++) { const head = box(0.4, 0.45, 0.4, mat(['#3a2620', '#1d1a19', '#6b4a33'][i % 3])); head.position.set(-13 + i * 1.7, 2.35, 1.3); TRAIN.add(head); SEATS.push(head); } }
const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(29, 0.8), new THREE.MeshBasicMaterial({ color: '#2a3a5a', transparent: true, opacity: 0.55 })); winStrip.position.set(0, 2.4, 1.42); TRAIN.add(winStrip);
const platform = box(40, 1, 4, mat('#9a9ea8')); platform.position.set(TX, 0.5, 9.8); S.add(platform);
const vacant = label('空室あり', { size: 120, color: '#fff', bg: 'rgba(220,60,60,.95)', sx: 2.6 }); vacant.position.set(TX + 1.5, 7.5, -4.6); S.add(vacant);
const seatLab = label('指定席 ガラガラ', { w: 1024, size: 100, color: '#fff', bg: 'rgba(31,79,168,.92)', sx: 4.2 }); seatLab.position.set(TX, 4.6, 7.6); S.add(seatLab);
const shutter = box(5.4, 3.0, 0.1, mat('#9aa0aa')); shutter.position.set(TX + 11, 1.5, -1.45); S.add(shutter);
const closedLab = label('廃業', { size: 130, color: '#fff', bg: 'rgba(30,30,36,.95)', sx: 1.8 }); closedLab.position.set(TX + 11, 2.2, -1.2); S.add(closedLab);
// 工場の中（x=220）：ベルトコンベアとアクスタ
const KX = 220;
const kroom = makeRoom({ w: 14, d: 8, h: 5, wall: '#c9ced6', floor: '#8a8f99' }); kroom.position.set(KX, 0, 0); S.add(kroom); kroom.userData.rw.visible = false;
const belt = box(12, 0.25, 1.4, mat('#2a2d33')); belt.position.set(KX, 1.0, -0.5); S.add(belt);
for (const x of [-5.5, 5.5]) { const leg = box(0.3, 1.0, 1.2, mat('#5a5f6b')); leg.position.set(KX + x, 0.5, -0.5); S.add(leg); }
const ITEMS = []; for (let i = 0; i < 12; i++) { const it = box(0.32, 0.55, 0.06, mat(PEN_COL[i % 5])); S.add(it); ITEMS.push(it); }
const press = box(1.6, 1.2, 1.6, mat('#e0a030')); press.position.set(KX, 2.6, -0.5); S.add(press);
const lampM = new THREE.MeshBasicMaterial({ color: '#2a2a2a' }); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), lampM); lamp.position.set(KX + 2.4, 3.6, -0.5); S.add(lamp);
const stopLab = label('停止', { size: 130, color: '#fff', bg: 'rgba(220,40,40,.95)', sx: 1.6 }); stopLab.position.set(KX + 2.4, 4.4, -0.3); S.add(stopLab);
// カフェの中（x=260）：空の席とパンケーキ
const CX = 260;
const croom = makeRoom({ w: 10, d: 8, wall: '#fbe3ee', floor: '#d9b48a' }); croom.position.set(CX, 0, 0); S.add(croom); croom.userData.rw.visible = false;
const PLATES = [];
for (let i = 0; i < 4; i++) { const x = CX - 3 + (i % 2) * 3.2, z = -2.2 + Math.floor(i / 2) * 2.8; const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 20), mat('#ffffff')); tb.position.set(x, 1.0, z); S.add(tb); const lg = box(0.12, 1.0, 0.12, mat('#8a8f99')); lg.position.set(x, 0.5, z); S.add(lg);
  for (const s of [-1, 1]) { const ch = box(0.6, 0.6, 0.6, mat('#ff9ec7')); ch.position.set(x + s * 1.3, 0.3, z); S.add(ch); }
  const pc = new THREE.Group(); for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20), mat('#e8b070')); p.position.y = 0.06 + k * 0.11; pc.add(p); } const cr = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat('#ffffff')); cr.position.y = 0.42; pc.add(cr); pc.position.set(x, 1.04, z); S.add(pc); PLATES.push(pc); }
const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.0, 16), mat('#5a5f6b')); bin.position.set(CX + 3.2, 0.5, 1.4); S.add(bin);
const staff = makeWoman({ shirt: '#ffffff', hair: '#3a2620' }); staff.position.set(CX + 2.3, 0, 1.4); staff.rotation.y = Math.PI / 2; S.add(staff);
const dumpPc = PLATES[3];
const haiki = label('廃棄', { size: 130, color: '#fff', bg: 'rgba(90,90,100,.95)', sx: 1.4 }); haiki.position.set(CX + 3.2, 2.0, 1.4); S.add(haiki);
// お金の山（x=-90）
const MX = -90;
const mfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#2a2640')); mfloor.rotation.x = -Math.PI / 2; mfloor.position.set(MX, 0.02, 0); S.add(mfloor);
const pile = new THREE.Mesh(new THREE.ConeGeometry(4, 5, 40), mat('#e8b84a')); pile.position.set(MX, 0, -1); S.add(pile);
const pileSp = makeSparkles(260, 0.4, 0xfff2a0); S.add(pileSp.points); pileSp.init([[MX, 3, -1], [MX - 2, 1.5, 0], [MX + 2, 1.5, 0]], 3, 3);
const POURERS = []; { for (let i = 0; i < 6; i++) { const f = makeWoman({ shirt: ['#ff9ec7', '#9fd0ff', '#ffe08a', '#c9a8d8', '#9fdcae', '#f2f2f2'][i] }); const a = -Math.PI * 0.85 + i * (Math.PI * 0.7 / 5); f.position.set(MX + Math.cos(a) * 5.2, 0, -1 - Math.sin(a) * 5.2 * -1); f.lookAt(MX, 0, -1); S.add(f); POURERS.push(f); } }
// 表彰台（スポンサー）
const podium = box(2.4, 1.2, 2.0, mat('#e8b84a')); podium.position.set(MX + 16, 0.6, 0); S.add(podium);
const sash = box(0.08, 0.9, 0.3, mat('#d23a3a')); sash.rotation.z = 0.6;
const banner = label('日本経済　提供：オタク', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 6.4 }); banner.position.set(MX + 16, 4.7, -1.5); S.add(banner);
const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.2, 5), mat('#ffd27a')); S.add(crown);
const podSp = makeSparkles(240, 0.35, 0xffe9a8); S.add(podSp.points); podSp.init([[MX + 16, 3, 0]], 3.4, 3);

function reset() {
  oshi.visible = true; oshi.scale.set(1, 1, 1); oshiPoof.set(0); spot.visible = true; spotM.opacity = 0.18; stageLight.intensity = 40; fans(0, 1);
  sekenLab.visible = false; COINS.visible = true; POTS.visible = false; hobbyLab.visible = false; okLab.visible = false; GOODS.visible = true;
  ota.position.set(RX + 0.6, 0, 0.4); ota.rotation.set(0, 0, 0); ota.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); ota.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); ota.userData.head.rotation.set(0, 0, 0);
  for (const b of [FACT, CAFE, HOTEL, PRINT]) b.WIN.forEach(w => w.material.color.set('#ffe9a8'));
  SEATS.forEach(s => s.visible = true); vacant.visible = false; seatLab.visible = false; shutter.visible = false; closedLab.visible = false; TRAIN.position.x = TX;
  lampM.color.set('#3a3a3a'); stopLab.visible = false; haiki.visible = false; dumpPc.position.set(CX + 0.2, 1.04, 0.6); dumpPc.visible = true;
  pileSp.set(0); podSp.set(0); banner.visible = false; crown.visible = false;
  hemi.intensity = 1.0; S.background.set('#0d0b1a'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function liveCam(t, d = 0) { look(lerp(3.2, 2.4, d), lerp(4.2, 4.6, d), lerp(11, 12.5, d), 0, 3.2, -6, 50); }
function shot0(t) { // 0秒＝サムネ：推しとペンライトの海。0.5秒で推しが消える
  reset(); lift(120); const k = t - TP; const u = clamp(k / 0.3);
  oshi.visible = u < 1; oshi.scale.set(1 - u, 1 + u * 0.6, 1 - u); oshiPoof.set(k > 0 ? clamp(k / 1.8) : 0);
  fans(t, k < 0.4 ? 1 : Math.max(0, 1 - (k - 0.4) * 1.5)); spotM.opacity = k > 0 ? 0.18 * Math.max(0, 1 - k) : 0.18; stageLight.intensity = k > 0 ? 40 * Math.max(0.1, 1 - k) : 40;
  el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.25) : 0;
  liveCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 推しという存在が消えた（静まりかえる会場）
  reset(); lift(120); oshi.visible = false; spot.visible = false; stageLight.intensity = 4; fans(t, 0);
  look(0, lerp(9, 11, ease(clamp(t / 3.3))), lerp(16, 19, ease(clamp(t / 3.3))), 0, 1.5, -4, 50);
  setTop('この世の推し', '0人', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 世間は言う。目を覚ますだろう
  reset(); lift(150); hemi.intensity = 1.2; S.background.set('#9fc4e8');
  SEKEN.forEach((p, i) => { p.userData.head.rotation.x = Math.sin(t * 4 + i) * 0.15; p.userData.arms[1].rotation.x = i === 1 ? -1.2 + Math.sin(t * 6) * 0.2 : 0; });
  pop(sekenLab, t, 0.5, 0.35, 2.0);
  look(WX + 1.2, 2.2, 6.4, WX, 1.6, 0.4, 50);
  setTop('世間の声', 'ほらね', fade(t, 0.15, 3.2, 0.25), GRAY);
  return S;
}
function shot3(t) { // 推しに使っていたお金が残る
  reset(); lift(150); ota.rotation.y = 0.5; ota.userData.head.rotation.x = 0.35;
  COINS.children.forEach((c, i) => { c.visible = i < Math.floor(clamp(t / 2.4) * 24) + 1; });
  look(RX + 3.4, 2.4, 5.0, RX + 1.6, 1.0, 0.4, 50);
  setTop('推しに使うお金（月平均）', comma(Math.round(16356 * ease(clamp((t - 0.3) / 1.6)))) + '円', fade(t, 0.15, 3.3, 0.25), GOLD);
  return S;
}
function shot4(t) { // ところがオタクは意外と平気
  reset(); lift(150); ota.rotation.y = 0.2; ota.userData.arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.9 * clamp(t / 0.6); a.rotation.x = -0.4; });
  okLab.position.set(RX + 0.6, 2.45, 0.6); pop(okLab, t, 0.6);
  look(RX + 1.8, 2.0, 4.6, RX + 0.6, 1.5, 0.4, 48);
  return S;
}
function shot5(t) { // 別の趣味を見つけて普通に暮らす
  reset(); lift(150); POTS.visible = true; ota.position.set(RX + 2.4, 0, 2.3); ota.rotation.y = Math.PI; ota.userData.arms.forEach(a => { a.rotation.x = -0.9 + Math.sin(t * 3) * 0.1; });
  pop(hobbyLab, t, 0.6);
  look(RX + 4.2, 2.6, 6.2, RX + 2.3, 0.9, 1.4, 50);
  return S;
}
function townCam(t, d) { look(TX + lerp(-4, 0, d), lerp(16, 19, d), lerp(50, 54, d), TX - 3, 4, -4, 50); }
function townDim(k) { const blds = [FACT, CAFE, HOTEL, PRINT]; blds.forEach((b, i) => { const u = clamp(k * 4 - i); b.WIN.forEach(w => w.material.color.set('#ffe9a8').lerp(new THREE.Color('#2a2d3a'), u)); }); }
function shot6(t) { // 困ったのはオタク以外の全員
  reset(); lift(80); hemi.intensity = 0.8; S.background.set('#2a2440'); townDim(clamp((t - 0.6) / 2.4));
  SEATS.forEach((s, i) => s.visible = i % 3 === 0);
  townCam(t, ease(clamp(t / 3.4)));
  setTop('困ったのは', 'オタク以外の全員', fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function shot7(t) { // グッズ工場の機械が止まる
  reset(); lift(140); const run = t < 1.4 ? t : 1.4; ITEMS.forEach((it, i) => { it.position.set(KX - 6 + ((run * 2.2 + i * 1.0) % 12), 1.4, -0.5); });
  press.position.y = 2.6 - (t < 1.4 ? Math.abs(Math.sin(t * 6)) * 0.5 : 0);
  lampM.color.set(t > 1.4 ? (Math.floor(t * 4) % 2 ? '#ff3030' : '#601010') : '#3a3a3a'); pop(stopLab, t, 1.5, 0.35, 1.4);
  look(KX + 2.4, 2.4, 6.2, KX, 1.5, -0.5, 52);
  setTop('グッズ工場', t < 1.4 ? '稼働中' : '停止', fade(t, 0.15, 3.3, 0.25), t < 1.4 ? GREEN : '#ff6a6a');
  return S;
}
function shot8(t) { // コラボカフェは空っぽ、パンケーキは廃棄
  reset(); lift(140); const u = ease(clamp((t - 1.0) / 1.2)); dumpPc.position.set(lerp(CX + 2.6, CX + 3.2, u), lerp(1.4, 1.0, u) + Math.sin(u * Math.PI) * 0.6, 1.4); dumpPc.visible = u < 0.98;
  staff.userData.arms.forEach(a => { a.rotation.x = -1.3 + u * 0.6; });
  pop(haiki, t, 2.1, 0.35, 1.3);
  look(CX + 2.6, 3.0, 7.4, CX + 1.4, 1.1, 0.2, 52);
  setTop('コラボカフェ', '客 0人', fade(t, 0.15, 3.5, 0.25), PINK);
  return S;
}
function shot9(t) { // 地方のホテル、週末なのに空室だらけ
  reset(); lift(80); hemi.intensity = 0.7; S.background.set('#1a1830');
  HOTEL.WIN.forEach((w, i) => { const off = ((i * 37) % 11) / 11 < clamp((t - 0.4) / 2.2) * 0.92; w.material.color.set(off ? '#2a2d3a' : '#ffe9a8'); });
  pop(vacant, t, 2.0, 0.35, 2.6); vacant.visible = vacant.visible && (Math.floor(t * 3) % 2 === 0 || t < 2.8);
  look(TX + 6, 7.5, 12, TX + 1.5, 6.5, -8, 52);
  setTop('週末のホテル', t < 2 ? '満室' : '空室だらけ', fade(t, 0.15, 3.6, 0.25), BLUE);
  return S;
}
function shot10(t) { // 新幹線の指定席は空き、うちわの印刷屋は廃業
  reset(); lift(100); hemi.intensity = 0.9; S.background.set('#3a5a8a');
  if (t < 1.9) { SEATS.forEach((s, i) => s.visible = i % 5 === 0); TRAIN.position.x = TX - t * 2; pop(seatLab, t, 0.4, 0.35, 3.4); look(TX + 4, 4, 18, TX, 2.4, 6, 50); }
  else { const k = t - 1.9; shutter.visible = true; shutter.position.y = lerp(4.5, 1.5, ease(clamp(k / 0.6))); pop(closedLab, k, 0.7, 0.35, 1.8); look(TX + 11.5, 3.6, 10, TX + 11, 2.6, -2, 52); }
  return S;
}
function shot11(t) { // 無駄遣いと笑われた課金が日本経済を回していた
  reset(); lift(100); S.background.set('#141228'); pileSp.set((t * 0.3) % 1);
  pile.scale.setScalar(0.4 + 0.6 * easeOut(clamp(t / 2.5)));
  POURERS.forEach((f, i) => { f.userData.arms.forEach(a => { a.rotation.x = -1.4 + Math.sin(t * 5 + i) * 0.25; }); });
  look(MX + 3, 7.5, 14, MX, 2.4, -1, 52);
  setTop('推し活の市場規模（推計）', '約' + (3.9 * ease(clamp((t - 0.3) / 1.6))).toFixed(1) + '兆円/年', fade(t, 0.15, 3.9, 0.25), GOLD);
  return S;
}
function shot12(t) { // 結果：困ったのはオタクではなく日本経済
  reset(); lift(80); hemi.intensity = 0.55; S.background.set('#1a1826'); townDim(1); SEATS.forEach((s, i) => s.visible = i % 5 === 0); shutter.visible = true; vacant.visible = true; vacant.scale.set(2.6, 2.6 * 0.25, 1);
  townCam(t, 0.5 + 0.5 * ease(clamp(t / 6)));
  setTop('結果', '困ったのは日本経済', fade(t, 0.15, 5.9, 0.25), PINK);
  return S;
}
function shot13(t) { // オタクとは、日本経済の最大のスポンサー
  reset(); lift(110); S.background.set('#1a1430'); hemi.intensity = 1.1;
  ota.position.set(MX + 16, 1.2, 0); ota.rotation.y = 0; ota.userData.arms.forEach((a, i) => { a.rotation.x = -2.8; a.rotation.z = (i ? -1 : 1) * 0.25; });
  crown.visible = true; ota.updateMatrixWorld(true); const v = new THREE.Vector3(0, 0.55, 0); ota.userData.head.localToWorld(v); crown.position.copy(v);
  pop(banner, t, 0.5, 0.35, 4.2); podSp.set((t * 0.35) % 1);
  look(MX + 17.0, 3.2, 10.5, MX + 16, 2.9, 0, 52);
  setTop('オタクの正体', '大スポンサー', fade(t, 0.3, 6.0, 0.25), GOLD);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（推しのいないステージ。消えたペンライト）
  reset(); lift(120); oshi.visible = false; spot.visible = false; stageLight.intensity = 6; fans(t, 0);
  liveCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, 'この世から、推しという<br>存在が消えた。'],
  [6.6, 9.9, '世間は言う。これでオタクも<br>やっと目を覚ますだろう。'],
  [10.0, 13.4, '推しに使っていたお金が、<br>そのまま手元に残る。'],
  [13.5, 16.8, 'ところがオタクは、<br>意外と平気。'],
  [16.9, 20.3, '別の趣味を見つけて、<br>普通に暮らし始める。'],
  [20.4, 23.8, '困ったのは、<br>オタク以外の全員だった。'],
  [23.9, 27.3, 'グッズを作っていた<br>工場の機械が止まる。'],
  [27.4, 31.0, 'コラボカフェは空っぽ。<br>パンケーキは廃棄。'],
  [31.1, 34.8, '遠征で満室だったホテルが、<br>週末なのに空室だらけ。'],
  [34.9, 38.5, '新幹線の指定席は空き、<br>うちわの印刷屋は廃業。'],
  [38.6, 42.6, '無駄遣いと笑われた課金が、<br>日本経済を回していた。'],
  [42.7, 49.2, '結果：推しが消えて困ったのは、<br>オタクではなく日本経済。'],
  [49.3, 55.4, 'オタクとは、日本経済に<br>課金し続ける最大のスポンサー。'],
  [55.5, 61.3, '推し活は無駄遣い？<br>それとも経済貢献？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 16.9, f: shot4 }, { a: 16.9, b: 20.4, f: shot5 }, { a: 20.4, b: 23.9, f: shot6 }, { a: 23.9, b: 27.4, f: shot7 },
  { a: 27.4, b: 31.1, f: shot8 }, { a: 31.1, b: 34.9, f: shot9 }, { a: 34.9, b: 38.6, f: shot10 }, { a: 38.6, b: 42.7, f: shot11 },
  { a: 42.7, b: 49.3, f: shot12 }, { a: 49.3, b: 55.5, f: shot13 }, { a: 55.5, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0625',
    v2: true,
    hookLine: '推しが、消えた。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも推しが消えたら？',
    titleHtml: 'もしも推しが<br>消えたら？',
    mood: 'mystery', seed: 625, hits: [0.5, 42.7, 49.3], risers: [38.6], impacts: [6.6, 13.5, 20.4, 23.9, 31.1, 38.6, 42.7, 49.3],
    sfx: [[0.5, 'poof'], [7.0, 'buzz'], [10.4, 'bubble'], [20.8, 'whoosh'], [25.4, 'alarm'], [29.4, 'poof'], [37.0, 'buzz'], [39.0, 'bubble'], [49.6, 'whoosh']],
    narr: { '推し活': 'おしかつ', '推し': 'おし', 'うちわ': 'うちわ', '結果：': '結果、' },
    ask: '推し活は無駄遣い？それとも経済貢献？',
    caption: 'もしもこの世から推しが消えたら？\n\n世間は言う。これでオタクもやっと目を覚ますだろう。\nところがオタクは意外と平気。別の趣味を見つけて普通に暮らし始める。\n困ったのはオタク以外の全員だった。\nグッズ工場は停止、コラボカフェは空っぽ、遠征で満室だったホテルは週末なのに空室だらけ、うちわの印刷屋は廃業。\n無駄遣いと笑われた課金が、日本経済を回していた。\n\n結果：推しが消えて困ったのは、オタクではなく日本経済。\nオタクとは、日本経済に課金し続ける最大のスポンサーだったのかもしれない。\n\n推し活は無駄遣い？それとも経済貢献？ コメントで教えて。\n\n※風刺ネタです\n出典：株式会社A3「推し活実態調査」2025年（推し活の市場規模 約3.9兆円/年・推計、推しに使うお金 月平均16,356円）',
    hashtags: ['もしもラボ', 'もしも', '推し活', 'オタク', '経済'],
    endStats: [['推し活の市場規模（推計）', '約3.9兆円/年', 'A3調べ 2025'], ['推しに使うお金（月平均）', '16,356円', 'お金を使う人'], ['オタクの正体', '日本経済の大スポンサー', 'かもしれない']],
    sources: '出典：株式会社A3「推し活実態調査」2025年（ネオマーケティング調べ）',
  },
});
