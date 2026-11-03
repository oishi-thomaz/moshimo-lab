import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, poseBelly, poseSlump, makeSweat, TABLE_Y } from '../scenes/office.js';
import { japan, setDots, setMapEnv, makeRing, ll, CITY } from '../scenes/japan.js';

// もしも男にも生理が来たら？（皮肉回・台本 S11・図星）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・Togetter で定期的に燃える 生理で休むのは甘え 論争
// 数字（一次資料で確認）：
//  月経随伴症状による経済損失 年約5,700億円（欠勤 約1,200億円＋仕事の効率低下 約4,500億円）
//  経済産業省ヘルスケア産業課「女性特有の健康課題による経済損失の試算と健康経営の必要性について」令和6年（2024年）2月
//  https://www.meti.go.jp/policy/mono_info_service/healthcare/jyoseinokenko/jyosei_keizaisonshitsu_r2.pdf

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#202634'); S.fog = new THREE.Fog(0x202634, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4650, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#2a2f3c', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- A：会議室（原点） ----------
const MR = makeMeetingRoom(); S.add(MR);
const board = MR.userData.board;
const BOSS = makeSuit({ old: true, bald: true, glasses: true, tie: '#7a2a8a' });
const MEN = [BOSS, makeSuit({ tie: '#2a5aa8' }), makeSuit({ old: true, tie: '#3a7a4a' }), makeSuit({ tie: '#a8682a' }), makeSuit({ hair: '#3a2a22', tie: '#2a2a2a' })];
MEN.forEach(m => S.add(m));
const SWEAT = MEN.map(m => { const s = makeSweat(); s.position.y = 0.22; m.userData.head.add(s); return s; });
const OL = makeSuit({ woman: true, hair: '#2a1c16', jacket: '#4a3a52' }); S.add(OL);
const OL2 = makeSuit({ woman: true, hair: '#4a3020', jacket: '#3a4a5a' }); S.add(OL2);
const zuki = label('ズキッ', { w: 512, size: 130, color: '#fff', stroke: 16, strokeColor: '#c0203a', sx: 1.5 }); S.add(zuki);
const yasumu = label('生理くらいで休むなよ', { w: 1024, size: 96, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 2.5 }); S.add(yasumu);
const chushi = label('会議 中止', { w: 768, size: 130, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 1.9 }); S.add(chushi);
const itteta = label('それ、何年も前から言ってた', { w: 1024, size: 86, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 2.5 }); S.add(itteta);
const ugokanai = label('動かない', { w: 512, size: 110, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 1.2 }); S.add(ugokanai);
const flashFx = makeSparkles(160, 0.18, 0xff8a9a); S.add(flashFx.points); flashFx.init([[0, 1.2, 0.9]], 3.4, 1.6);

// ---------- B：満員電車（x=40）と駅のトイレ（x=40, z=-30） ----------
const TX = 40;
const car = new THREE.Group(); car.position.set(TX, 0, 0); S.add(car);
{ const fl = box(3.2, 0.1, 12, mat('#8a8478')); fl.position.y = -0.05; car.add(fl);
  for (const s of [-1, 1]) { const w = box(0.1, 2.6, 12, mat('#d8dde4')); w.position.set(s * 1.6, 1.3, 0); car.add(w);
    for (let i = 0; i < 4; i++) { const g = box(0.04, 0.8, 1.6, new THREE.MeshBasicMaterial({ color: '#9fc0de' })); g.position.set(s * 1.54, 1.75, -4.5 + i * 3); car.add(g); }
    const bench = box(0.5, 0.45, 10, mat('#4a6a9a')); bench.position.set(s * 1.3, 0.22, 0); car.add(bench);
    const bar = box(0.04, 0.04, 12, mat('#c9ced8')); bar.position.set(s * 0.7, 2.3, 0); car.add(bar);
    for (let i = 0; i < 12; i++) { const st = box(0.03, 0.22, 0.03, mat('#e8e8e8')); st.position.set(s * 0.7, 2.18, -5.5 + i); car.add(st); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), mat('#f2f2f2')); ring.position.set(s * 0.7, 2.02, -5.5 + i); car.add(ring); } }
  const ceilg = box(3.2, 0.08, 12, mat('#eef0f2')); ceilg.position.y = 2.6; car.add(ceilg); }
const RIDERS = []; { const r = rng(11); for (let i = 0; i < 14; i++) { const m = makeSuit({ old: r() < 0.3, bald: r() < 0.2, tie: ['#b23a3a', '#2a5aa8', '#3a7a4a', '#444'][i % 4], hair: r() < 0.3 ? '#4a3a2a' : undefined }); m.position.set(TX + (i % 3 - 1) * 0.62 + (r() - 0.5) * 0.15, 0, -4 + Math.floor(i / 3) * 1.15 + (r() - 0.5) * 0.3); m.rotation.y = (r() - 0.5) * 1.2; S.add(m); const sw = makeSweat(); sw.position.y = 0.22; m.userData.head.add(sw); m.userData.sw = sw; RIDERS.push(m); } }
// 駅のトイレ
const WCZ = -30;
const wcWall = box(14, 3.2, 0.2, mat('#d6dde6')); wcWall.position.set(TX, 1.6, WCZ - 1.2); S.add(wcWall);
const wcFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat('#b8bcc4', { depthWrite: false })); wcFloor.rotation.x = -Math.PI / 2; wcFloor.position.set(TX, 0.02, WCZ + 2); wcFloor.renderOrder = -0.8; S.add(wcFloor);
const wcDoor = box(1.4, 2.3, 0.1, mat('#3a6ab0')); wcDoor.position.set(TX - 4.6, 1.15, WCZ - 1.05); S.add(wcDoor);
const wcSign = label('トイレ　男', { w: 768, size: 120, color: '#fff', bg: 'rgba(40,90,180,.97)', sx: 2.0 }); wcSign.position.set(TX - 4.6, 2.75, WCZ - 0.9); S.add(wcSign);
const QUEUE = []; { const r = rng(21); for (let i = 0; i < 10; i++) { const m = makeSuit({ old: r() < 0.35, bald: r() < 0.25, tie: ['#b23a3a', '#2a5aa8', '#3a7a4a', '#a8682a'][i % 4] }); m.position.set(TX - 3.6 + i * 0.95, 0, WCZ - 0.2 + (i % 2) * 0.12); m.rotation.y = -Math.PI / 2 + 0.25; S.add(m); const sw = makeSweat(); sw.position.y = 0.22; m.userData.head.add(sw); m.userData.sw = sw; QUEUE.push(m); } }

// ---------- C：薬局（x=80） ----------
const PX = 80;
const shelf = box(5.2, 2.6, 0.7, mat('#e8ecf0')); shelf.position.set(PX, 1.3, -2.4); S.add(shelf);
const shelfHead = label('痛み止め', { w: 768, size: 130, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 2.0 }); shelfHead.position.set(PX - 0.6, 3.1, -2.0); S.add(shelfHead);
const BOXES = []; { const cols = ['#ffffff', '#cfe6ff', '#ffe0e8']; for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) { const b = box(0.32, 0.42, 0.22, mat(cols[(i + row) % 3])); b.position.set(PX - 2.2 + i * 0.4, 0.58 + row * 0.78, -1.98); S.add(b); BOXES.push(b); }
  for (let row = 0; row < 3; row++) { const sh = box(5.0, 0.05, 0.6, mat('#c4cad4')); sh.position.set(PX, 0.35 + row * 0.78, -2.05); S.add(sh); } }
const CLOCK = label('9:00', { w: 512, size: 150, color: '#fff', bg: 'rgba(20,20,30,.92)', sx: 1.0 }); CLOCK.position.set(PX + 1.3, 3.75, -2.0); S.add(CLOCK);
const BUYERS = []; { const r = rng(31); for (let i = 0; i < 6; i++) { const m = makeSuit({ old: r() < 0.4, bald: r() < 0.3, tie: ['#b23a3a', '#2a5aa8', '#3a7a4a'][i % 3] }); m.position.set(PX - 2.4 + i * 0.95 + (i > 2 ? 0.2 : 0), 0, -0.9 + (i % 2) * 0.3); m.rotation.y = Math.PI + (i - 2.5) * 0.15; S.add(m); BUYERS.push(m); } }
const karappo = label('売り切れ', { w: 768, size: 130, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.8 }); karappo.position.set(PX, 2.0, -1.4); S.add(karappo);

// ---------- D：損失の積み上げ（x=120） ----------
const DX = 120;
const dfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.02, -5); dfloor.renderOrder = -0.8; S.add(dfloor);
const H1 = 0.07 * 12, H2 = 0.07 * 45; // 1,200億・4,500億（100億＝0.07）
const blk1 = box(2.2, 1, 1.6, mat('#ff9a7a')); blk1.geometry.translate(0, 0.5, 0); blk1.position.set(DX, 0, -5); S.add(blk1);
const blk2 = box(2.2, 1, 1.6, mat('#ff6a8a')); blk2.geometry.translate(0, 0.5, 0); blk2.position.set(DX, H1, -5); S.add(blk2);
const blk3 = box(2.2, 1, 1.6, mat('#7fa8e8', { transparent: true, opacity: 0.85 })); blk3.geometry.translate(0, 0.5, 0); S.add(blk3);
const l1 = label('欠勤 約1,200億円', { w: 1024, size: 96, color: '#fff', stroke: 12, strokeColor: '#111', sx: 2.6 }); S.add(l1);
const l2 = label('効率低下 約4,500億円', { w: 1024, size: 96, color: '#fff', stroke: 12, strokeColor: '#111', sx: 3.0 }); S.add(l2);
const l3 = label('＋男の分', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,110,200,.94)', sx: 1.8 }); S.add(l3);
const EXECS = [makeSuit({ old: true, bald: true, glasses: true, tie: '#7a2a8a' }), makeSuit({ old: true, tie: '#2a5aa8' })]; EXECS.forEach(m => S.add(m));

// ---------- E：オフィス（x=170） ----------
const OX = 170;
const ofloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#7d8798', { depthWrite: false })); ofloor.rotation.x = -Math.PI / 2; ofloor.position.set(OX, 0.02, 0); ofloor.renderOrder = -0.8; S.add(ofloor);
const owall = box(14, 3.2, 0.2, mat('#e6e9ee')); owall.position.set(OX, 1.6, -4.2); S.add(owall);
const ISL = makeDeskIsland(3); ISL.position.set(OX, 0, -1.2); S.add(ISL);
const WORKERS = ISL.userData.seats.map((s, i) => { const p = i % 2 ? makeSuit({ woman: true, hair: ['#2a1c16', '#4a3020', '#1d1a19'][i % 3], jacket: ['#4a3a52', '#3a4a5a', '#5a3a3a'][i % 3] }) : makeSuit({ tie: ['#2a5aa8', '#b23a3a', '#3a7a4a'][i % 3] }); p.position.set(OX + s.x, 0, -1.2 + s.z); p.rotation.y = s.ry; S.add(p); return p; });
const amae = label('甘え', { w: 512, size: 170, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.6 }); amae.position.set(OX, 3.0, -1.2); S.add(amae);
const xmark = label('×', { w: 256, h: 256, size: 240, color: '#e8203a', sx: 1.3 }); xmark.position.set(OX, 3.0, -1.0); xmark.material.depthTest = false; xmark.renderOrder = 8; S.add(xmark);
const gaman = label('我慢させられていた', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.94)', sx: 2.4 }); gaman.position.set(OX, 1.95, -0.8); S.add(gaman);
const itami = label('変えたのは、男の痛み', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.5 }); S.add(itami);
const conf = makeSparkles(180, 0.2, 0xffd27a); S.add(conf.points); conf.init([[0.6, 2.4, -2.8]], 3, 2);

// ---------- 日本地図の点（男） ----------
const tk = ll(...CITY.tokyo);
const ring = makeRing('#ff7a9a', 0.9);

const MPOS = [[-1.7, 1.05], [-0.85, 0.85], [0.0, 0.8], [0.85, 0.85], [1.7, 1.05]];
function placeMen() { MEN.forEach((m, i) => { m.visible = true; m.position.set(MPOS[i][0], 0, MPOS[i][1]); m.rotation.set(0, (i - 2) * -0.12, 0); }); }
function reset() {
  [...MEN, OL, OL2, ...RIDERS, ...QUEUE, ...BUYERS, ...EXECS, ...WORKERS].forEach(p => { poseClear(p); p.visible = true; });
  placeMen(); SWEAT.forEach(s => s.userData.set(0)); [...RIDERS, ...QUEUE].forEach(m => m.userData.sw.userData.set(0));
  OL.position.set(2.9, 0, 0.6); OL.rotation.set(0, -0.6, 0); OL2.position.set(3.5, 0, -0.2); OL2.rotation.set(0, -0.8, 0); OL.visible = OL2.visible = false;
  MR.userData.chairs.forEach(c => c.visible = true);
  [zuki, yasumu, chushi, itteta, ugokanai, karappo, l1, l2, l3, amae, xmark, gaman, itami].forEach(l => l.visible = false);
  board.set(['定例会議'], { color: '#1a2a6a' }); flashFx.set(0); conf.set(0);
  BOXES.forEach(b => b.visible = true); CLOCK.userData.set('9:00');
  blk1.scale.y = blk2.scale.y = blk3.scale.y = 0.001; blk3.visible = false;
  EXECS.forEach((m, i) => { m.position.set(DX - 0.9 + i * 1.8, 0, -1.6); m.rotation.y = Math.PI; });
  hemi.intensity = 1.15; S.background.set('#202634'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.0;
function roomCam(d) { look(lerp(0.3, 0.1, d), 2.1, lerp(7.4, 8.0, d), 0.1, 1.35, -0.4, 52); }
function men(k, t) { MEN.forEach((m, i) => { poseBelly(m, clamp(k - i * 0.04), t + i); SWEAT[i].userData.set(k, t + i * 0.3); }); }
function shot0(t) { // 0秒＝サムネ：会議室の男たちが、一斉にお腹を押さえてうずくまる
  reset(); lift(0); const k = 0.55 + 0.45 * easeOut(clamp((t - TP) / 0.35));
  men(k, t); board.set(['定例会議'], { color: '#1a2a6a' });
  el.flash.style.opacity = t > 0.3 && t < 0.45 ? 0.25 : 0; zuki.position.set(1.0, 1.15, 2.2); zuki.visible = true; zuki.userData.size(1.3 * (t < 0.3 ? 0.85 : 1));
  flashFx.set(clamp((t - 0.3) / 1.6)); roomCam(ease(clamp(t / 2.7)));
  return S;
}
function shot1(t) { // ある朝、日本中の男に生理が来た（地図）
  setMapEnv('dusk'); const u = clamp(t / 2.4), R = u * 220;
  setDots((i, x, z, q) => { const d = Math.hypot(x - tk.x, z - tk.z); const on = d < R; return { color: on ? '#ff5a7a' : '#7fb0e8', s: on ? 1.4 : 1, y: on ? 0.3 : 0 }; });
  ring.visible = true; ring.position.set(tk.x, ring.position.y, tk.z); ring.scale.setScalar(Math.max(0.1, R)); ring.material.opacity = 0.9 * (1 - u);
  look(lerp(-8, -4, ease(clamp(t / 3.4))), lerp(300, 280, ease(clamp(t / 3.4))), lerp(95, 85, ease(clamp(t / 3.4))), -4, 0, -30, 50);
  setTop('日本中の男に', '生理が来た', fade(t, 0.3, 3.3, 0.25), PINK);
  return japan;
}
function shot2(t) { // 前の日まで言っていた。生理くらいで休むなよ（回想・会議室で元気）
  reset(); lift(0); S.background.set('#3a3440'); hemi.intensity = 1.0; MEN.forEach((m, i) => { m.rotation.y = (i - 2) * -0.15; });
  BOSS.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 5) * 0.15; BOSS.userData.head.rotation.x = -0.15;
  OL.visible = true; OL.userData.head.rotation.x = 0.25;
  BOSS.position.set(-0.3, 0, 1.0); yasumu.position.set(0.1, 2.45, 1.0); pop(yasumu, t, 0.4, 0.3, 1.75);
  look(0.2, 2.0, 5.4, 0.1, 1.55, -0.4, 52);
  setHud('', '前の日', fade(t, 0.1, 3.8, 0.2), { color: '#ddd' });
  return S;
}
function shot3(t) { // 1日目。満員電車で冷や汗 → 駅のトイレに男の行列
  reset(); lift(0); setHud('経過時間', '1日目', fade(t, 0.05, 5.0, 0.2));
  wcSign.visible = t >= 2.4; if (t >= 2.4) lift(220);
  if (t < 2.4) {
    RIDERS.forEach((m, i) => { const k = 0.25 + 0.1 * Math.sin(t * 2 + i); m.userData.arms[1].rotation.x = -2.9; m.userData.head.rotation.x = 0.25; m.position.y = 0; m.userData.sw.userData.set(1, t + i * 0.2); m.rotation.x = Math.sin(t * 3 + i) * 0.03; });
    look(TX + 0.3, 1.9, 4.2, TX, 1.5, -2.0, 54);
  } else {
    const u = t - 2.4; QUEUE.forEach((m, i) => { poseBelly(m, 0.85 + 0.15 * Math.sin(t * 3 + i), t + i, { stand: true }); m.userData.sw.userData.set(1, t + i * 0.2); });
    look(TX + lerp(-1.8, -2.4, ease(clamp(u / 2.6))), 2.4, WCZ + 7.0, TX - 3.4, 1.5, WCZ - 0.6, 54);
  }
  return S;
}
function shot4(t) { // 会議は中止。部長は机に突っ伏して動かない
  reset(); lift(0); board.set(['会議 中止'], { color: '#d23a3a' });
  MEN.forEach((m, i) => { if (i) m.visible = false; });
  BOSS.position.set(0, 0, -1.75); BOSS.rotation.set(0, 0, 0); poseSlump(BOSS, easeOut(clamp((t - 0.3) / 0.8))); SWEAT[0].userData.set(1, t);
  ugokanai.position.set(0.55, 1.5, -1.3); pop(ugokanai, t, 1.8, 0.3, 0.8);
  setHud('経過時間', '1日目', fade(t, 0.05, 3.9, 0.2));
  MR.userData.chairs.forEach((c, i) => { c.visible = !(i % 2); });
  look(0.15, 2.7, 3.0, 0.1, 0.35, -1.5, 52);
  return S;
}
function shot5(t) { // 薬局の痛み止めの棚が、昼までに空になる
  reset(); lift(0); const u = clamp((t - 0.3) / 2.8);
  const n = Math.round(BOXES.length * (1 - u)); BOXES.forEach((b, i) => { b.visible = ((i * 7) % BOXES.length) < n; });
  CLOCK.userData.set(['9:00', '10:00', '11:00', '12:00'][Math.min(3, Math.floor(u * 3.99))]);
  BUYERS.forEach((m, i) => { m.userData.arms[1].rotation.x = -1.4 - Math.sin(t * 6 + i) * 0.4; poseBelly(m, 0.6, t, { stand: true }); m.userData.arms[1].rotation.x = -1.5 - Math.sin(t * 6 + i) * 0.4; });
  pop(karappo, t, 3.2, 0.3, 1.8);
  setHud('経過時間', '1日目', fade(t, 0.05, 3.8, 0.2));
  look(PX, 3.4, 5.4, PX, 1.9, -2.0, 52);
  return S;
}
function stack(t, three) {
  const a = easeOut(clamp((t - 0.2) / 0.8)), b = easeOut(clamp((t - 0.9) / 1.0));
  blk1.scale.y = Math.max(0.001, H1 * a); blk2.scale.y = Math.max(0.001, H2 * b); blk2.position.y = H1 * a;
  l1.visible = a > 0.5; l1.position.set(DX + 2.6, H1 / 2 + 0.1, -4.6); l2.visible = b > 0.5; l2.position.set(DX + 2.6, H1 + H2 * b / 2, -4.6);
}
function shot6(t) { // 生理の不調で失われる働きは、女性だけで年5,700億円分
  reset(); lift(300); stack(t);
  EXECS.forEach(m => m.visible = false);
  look(DX + 1.2, 2.6, 7.6, DX + 1.2, 2.3, -5, 54);
  setTop('生理の不調で失われる働き（女性）', '年 約5,700億円', fade(t, 0.3, 5.9, 0.25), RED);
  return S;
}
function shot7(t) { // そこに男の分が乗って、会社は初めて本気で数字を見る
  reset(); lift(300); stack(9);
  const d = easeOut(clamp((t - 0.3) / 0.6)); blk3.visible = true; blk3.scale.y = 2.4; blk3.position.set(DX, H1 + H2 + lerp(5, 0, d), -5);
  l3.position.set(DX + 2.4, H1 + H2 + 1.2 + lerp(5, 0, d), -4.6); l3.visible = true; l1.visible = l2.visible = true;
  EXECS.forEach((m, i) => { m.userData.head.rotation.x = -0.55; m.position.y = 0; if (t > 1.0) { m.userData.arms[0].rotation.x = -0.4; } });
  el.flash.style.opacity = t > 0.85 && t < 1.0 ? 0.2 : 0;
  const u = ease(clamp(t / 4.6)); look(DX + 1.0, lerp(3.2, 3.6, u), lerp(10.0, 11.2, u), DX + 1.0, lerp(3.0, 3.4, u), -5, 54);
  return S;
}
function shot8(t) { // 3日後、会社は生理の休みを有給にすると発表
  reset(); lift(0); board.set(['生理の休み', '有給にします'], { color: '#d23a3a' });
  MEN.forEach((m, i) => { poseBelly(m, 0.6, t + i, { stand: true }); m.userData.head.rotation.x = -0.1; });
  BOSS.position.set(2.5, 0, -0.2); BOSS.rotation.y = -0.4; BOSS.userData.arms[1].rotation.set(-2.2, 0, 0.4); BOSS.userData.arms[0].rotation.set(0,0,0); BOSS.userData.legs.forEach(l=>l.rotation.x=0); BOSS.position.y=0; BOSS.rotation.x=0;
  flashFx.set(clamp((t - 0.3) / 2.5));
  setHud('経過時間', '3日後', fade(t, 0.05, 4.5, 0.2));
  look(0.5, 3.0, 6.2, 0.4, 1.55, -0.8, 52);
  return S;
}
function shot9(t) { // 女性社員は言う。それ、何年も前から言ってたけど
  reset(); lift(150); board.set(['生理の休み', '有給にします'], { color: '#d23a3a' });
  MEN.forEach((m, i) => { m.userData.head.rotation.x = 0.35; poseBelly(m, 0.5, t, { stand: true }); m.userData.head.rotation.x = 0.4; });
  MEN.forEach((m, i) => { m.position.x -= 0.9; if (i === 4) m.visible = false; }); OL.visible = OL2.visible = true; OL.position.set(1.45, 0, 1.9); OL.rotation.y = -0.6; OL2.position.set(2.1, 0, 1.4); OL2.rotation.y = -0.7;
  OL.userData.arms[0].rotation.set(0, 0, 0.3); OL.userData.arms[1].rotation.set(0, 0, -0.3); OL.userData.head.rotation.y = -0.2;
  itteta.position.set(0.85, 2.22, 2.0); pop(itteta, t, 0.6, 0.3, 1.6);
  look(0.45, 3.0, 8.4, 0.45, 1.5, -0.4, 52);
  return S;
}
function shot10(t) { // 結果：生理は甘えじゃなかった。我慢させられていただけだった
  reset(); lift(220); WORKERS.forEach((p, i) => { poseSit(p); });
  pop(amae, t, 0.2, 0.3, 1.6); xmark.visible = t > 1.3; xmark.userData.size(1.3 * (t < 1.45 ? 1.3 : 1)); pop(gaman, t, 2.6, 0.35, 2.4);
  const u = ease(clamp(t / 5.6)); look(OX, 3.0, lerp(6.8, 7.6, u), OX, 2.0, -1.4, 52);
  setTop('結果', '甘えじゃなかった', fade(t, 0.15, 5.6, 0.25), RED);
  return S;
}
function shot11(t) { // 制度を変えたのは、男が痛がったことだったのかもしれない
  reset(); lift(300); board.set(['生理の休み', '有給'], { color: '#d23a3a' }); MEN.forEach((m, i) => { m.visible = i === 0; });
  BOSS.position.set(-0.45, 0, 1.3); BOSS.rotation.y = 0.15; poseBelly(BOSS, 0.9, t, { stand: true }); SWEAT[0].userData.set(1, t);
  itami.position.set(0.25, 2.62, 0.6); pop(itami, t, 0.8, 0.35, 1.75); conf.set(clamp((t - 0.8) / 4));
  look(0.05, 2.0, 5.6, 0.05, 1.75, -1.0, 52);
  return S;
}
function shot12(t) { // 質問。最後は冒頭と同じ構図（男たちはうずくまったまま）
  reset(); lift(0); men(1, t); board.set(['生理の休み', '有給'], { color: '#d23a3a' }); roomCam(0);
  return S;
}

const SUBS = [
  [2.7, 6.1, 'ある朝、日本中の<br>男に生理が来た。'],
  [6.2, 10.1, '前の日まで言っていた。<br>生理くらいで休むなよ。'],
  [10.2, 15.3, '1日目。満員電車で冷や汗、<br>駅のトイレに男の行列。'],
  [15.4, 19.4, '会議は中止。部長は<br>机に突っ伏して動かない。'],
  [19.5, 23.4, '薬局の痛み止めの棚が、<br>昼までに空になる。'],
  [23.5, 29.6, '生理の不調で失われる働きは、<br>女性だけで年5,700億円分。'],
  [29.7, 34.6, 'そこに男の分が乗って、会社は<br>初めて本気で数字を見る。'],
  [34.7, 39.3, '3日後、会社は生理の休みを<br>有給にすると発表。'],
  [39.4, 43.7, '女性社員は言う。それ、<br>何年も前から言ってたけど。'],
  [43.8, 49.6, '結果：生理は甘えじゃなかった。<br>我慢させられていただけだった。'],
  [49.7, 55.2, '制度を変えたのは、<br>男が痛がったことだったのかも。'],
  [55.3, 60.6, '生理の休み、<br>有給にするべき？'],
];
const shots = [
  { a: 0, b: 2.7, f: shot0 }, { a: 2.7, b: 6.2, f: shot1 }, { a: 6.2, b: 10.2, f: shot2 }, { a: 10.2, b: 15.4, f: shot3 },
  { a: 15.4, b: 19.5, f: shot4 }, { a: 19.5, b: 23.5, f: shot5 }, { a: 23.5, b: 29.7, f: shot6 }, { a: 29.7, b: 34.7, f: shot7 },
  { a: 34.7, b: 39.4, f: shot8 }, { a: 39.4, b: 43.8, f: shot9 }, { a: 43.8, b: 49.7, f: shot10 }, { a: 49.7, b: 55.3, f: shot11 },
  { a: 55.3, b: 60.8, f: shot12 }, { a: 60.8, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0635',
    v2: true,
    hookLine: 'ある朝、日本中の男に生理が来た。',
    series: '図星',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも男にも生理が来たら？',
    titleHtml: 'もしも男にも<br>生理が来たら？',
    mood: 'tension', seed: 635, hits: [0.35, 43.8, 49.7], risers: [39.4], impacts: [10.2, 15.4, 23.5, 30.6, 34.7, 43.8],
    sfx: [[0.3, 'whoosh'], [3.0, 'whoosh'], [11.0, 'buzz'], [16.2, 'buzz'], [20.0, 'bubble'], [21.0, 'bubble'], [22.0, 'bubble'], [35.2, 'whoosh'], [40.2, 'bubble'], [45.1, 'whoosh'], [50.5, 'whoosh']],
    narr: { '5,700億円分': 'ごせんななひゃくおくえんぶん', '1日目': 'いちにちめ', '3日後': 'みっかご', '結果：': '結果、', '突っ伏して': 'つっぷして', '冷や汗': 'ひやあせ', 'だったのかも。': 'だったのかもしれない。' },
    ask: '生理の休み、有給にするべき？',
    caption: 'もしも、ある朝、日本中の男に生理が来たら？\n\n前の日まで言っていた。生理くらいで休むなよ。\n1日目。満員電車で冷や汗、駅のトイレに男の行列。会議は中止、部長は机に突っ伏して動かない。薬局の痛み止めは昼までに空っぽ。\n生理の不調で失われる働きは、女性だけで年約5,700億円分（経済産業省の試算）。そこに男の分が乗って、会社は初めて本気で数字を見る。\n3日後、会社は生理の休みを有給にすると発表。女性社員は言う。それ、何年も前から言ってたけど。\n\n結果：生理は甘えじゃなかった。我慢させられていただけだった。\n制度を変えたのは、男が痛がったことだったのかもしれない。\n\n生理の休み、有給にするべき？ コメントで教えて。\n\n※風刺ネタです\n出典：経済産業省「女性特有の健康課題による経済損失の試算と健康経営の必要性について」（2024年2月。月経随伴症状による損失 年約5,700億円＝欠勤 約1,200億円＋仕事の効率低下 約4,500億円）',
    hashtags: ['もしもラボ', 'もしも', '生理', '生理休暇', '職場'],
    endStats: [['生理の不調による損失（女性）', '年 約5,700億円', '2024年'], ['うち仕事の効率低下', '約4,500億円', ''], ['うち欠勤', '約1,200億円', '']],
    sources: '出典：経済産業省「女性特有の健康課題による経済損失の試算と健康経営の必要性について」（2024年2月）',
  },
});
