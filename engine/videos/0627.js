import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしもキャバクラが消えたら？（v2・風刺回）
// 2026/11/02 ゆうと：はてな匿名ダイアリー「男がキャバクラに行く意味がわかった」（キャバクラ＝中年男性の心のケア）を元に台本化。表記は「おぢ」
// 数字：接待をする飲食店（風営法1号営業：キャバレー等）の許可数 59,516件（令和6年末・警察庁「令和6年における風俗営業等の現状」）
//  ※1号営業にはキャバクラのほかホストクラブ・接待のあるスナックなども入る。画面では「接待をする飲食店」と言う

const GOLD = '#ffd27a', PINK = '#ff7ab8', BLUE = '#7fd4ff', GREEN = '#9be86a', RED = '#ff6a6a', GRAY = '#cfd3dc', PURPLE = '#c58bff';

const S = new THREE.Scene();
S.background = new THREE.Color('#120c1c'); S.fog = new THREE.Fog(0x120c1c, 40, 160);
const hemi = new THREE.HemisphereLight(0xffe6f4, 0x2a2030, 0.95); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(10, 20, 14); S.add(sun);

// ---------- A：店内（原点） ----------
const club = makeRoom({ w: 14, d: 10, h: 4.4, wall: '#2a1a34', floor: '#3a2430' }); club.userData.rw.visible = false; S.add(club);
const chand = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff3c0' })); chand.position.set(0, 3.8, -1.5); S.add(chand);
const clubLight = new THREE.PointLight(0xffd8f0, 26, 16, 1.4); clubLight.position.set(0, 3.6, 0); S.add(clubLight);
const glitter = makeSparkles(260, 0.18, 0xfff2c0); S.add(glitter.points); glitter.init([[0, 3.8, -1.5]], 5, 0.6);
// ボックス席（ソファ＋テーブル）
function boothAt(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); const s = box(3.4, 0.5, 1.0, mat('#7a2a4a')); s.position.set(0, 0.35, -0.6); g.add(s); const b = box(3.4, 0.9, 0.3, mat('#6a2040')); b.position.set(0, 0.95, -1.05); g.add(b); const tb = box(1.8, 0.5, 0.9, mat('#1a1418')); tb.position.set(0, 0.25, 0.6); g.add(tb); return g; }
boothAt(-3.2, -2.5); boothAt(3.2, -2.5);
// シャンパンタワー（グラスの山）
const TOWER = new THREE.Group(); TOWER.position.set(0, 0.5, 0.2); S.add(TOWER);
const towerTable = box(1.4, 1.0, 1.4, mat('#1a1418')); towerTable.position.set(0, 0.5, 0.2); S.add(towerTable);
const GR = rng(270); const GLASSES = []; const glassM = new THREE.MeshLambertMaterial({ color: '#f6e6a0', transparent: true, opacity: 0.85 });
for (let lv = 0; lv < 4; lv++) { const n = 4 - lv; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.26, 10), glassM); gl.position.set((i - (n - 1) / 2) * 0.28, 0.63 + lv * 0.27, (j - (n - 1) / 2) * 0.28); TOWER.add(gl); GLASSES.push({ m: gl, p: gl.position.clone(), v: new THREE.Vector3((GR() - .5) * 2, GR() * 1.5, (GR() - .5) * 2) }); } }
// おぢとキャスト
const OJI = makeOji(rng(27), { shirt: '#4a4f5c' }); OJI.position.set(-3.6, 0.45, -2.6); S.add(OJI);
const CAST = makeWoman({ shirt: '#e8508a', hair: '#3a2620', skirt: true }); CAST.position.set(-2.6, 0.45, -2.6); S.add(CAST);
const PRAISE = ['すごーい', 'さすがー', '知らなかったー'].map((s, i) => { const l = label(s, { size: 110, color: '#fff', bg: 'rgba(232,80,138,.92)', sx: 1.5 }); S.add(l); return l; });
const dots = label('……', { size: 140, color: '#fff', bg: 'rgba(60,60,70,.9)', sx: 1.2 }); S.add(dots);
const wantLab = label('褒められたい', { size: 110, color: '#fff', bg: 'rgba(120,60,160,.92)', sx: 1.8 }); S.add(wantLab);
const notSake = label('売り物：お酒', { size: 110, color: '#fff', bg: 'rgba(60,60,70,.92)', sx: 2.2 }); S.add(notSake);
const batsu = label('×', { w: 256, h: 256, size: 230, color: '#ff3b3b', sx: 1.2 }); S.add(batsu);
const bottle = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 14), mat('#1f5a3a')); b.position.y = 0.3; bottle.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.22, 10), mat('#1f5a3a')); n.position.y = 0.7; bottle.add(n); } bottle.position.set(-3.2, 0.5, -1.9); S.add(bottle);
const BILLS = []; for (let i = 0; i < 8; i++) { const b = box(0.36, 0.02, 0.18, mat('#9fc7a0')); S.add(b); BILLS.push(b); }
const hearts = makeSparkles(120, 0.3, 0xff8ac0); S.add(hearts.points); hearts.init([[-3.1, 1.6, -2.6]], 0.6, 1.6);

// ---------- B：家（x=60） ----------
const HX = 60;
const home = makeRoom({ w: 9, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); home.position.set(HX, 0, 0); home.userData.rw.visible = false; S.add(home);
const hsofa = box(3.2, 0.6, 1.1, mat('#5a6b8a')); hsofa.position.set(HX - 1.2, 0.3, -2.4); S.add(hsofa);
const htable = box(1.6, 0.8, 1.0, mat('#c9a27a')); htable.position.set(HX + 1.5, 0.4, 0); S.add(htable);
const WIFE = makeWoman({ shirt: '#f2a0b8' }); S.add(WIFE);
const HUS = makeOji(rng(27), { shirt: '#4a4f5c' }); S.add(HUS);
const anshin = label('安心', { size: 130, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 1.4 }); S.add(anshin);
const sanLab = label('同じ話 3回目', { size: 100, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.0 }); S.add(sanLab);
const freeLab = label('相づち 0円', { size: 100, color: '#fff', bg: 'rgba(200,60,60,.92)', sx: 1.8 }); S.add(freeLab);

// ---------- C：居酒屋（x=110）：飲み会と大将のカウンター ----------
const IX = 110;
const izk = makeRoom({ w: 12, d: 8, h: 3.6, wall: '#c8a878', floor: '#6a4a30' }); izk.position.set(IX, 0, 0); izk.userData.rw.visible = false; S.add(izk);
const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 14), new THREE.MeshBasicMaterial({ color: '#ff6a4a' })); lantern.position.set(IX - 4, 2.6, -3.3); S.add(lantern);
const izLight = new THREE.PointLight(0xffc890, 16, 14, 1.4); izLight.position.set(IX, 3, 1); S.add(izLight);
const nTable = box(3, 0.75, 1.4, mat('#5a3a24')); nTable.position.set(IX - 2.4, 0.37, 0.4); S.add(nTable);
const MUGS = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12), mat('#ffd060')); m.position.set(IX - 3.4 + i * 0.66, 0.9, 0.4 + (i % 2 ? 0.3 : -0.3)); S.add(m); MUGS.push(m); }
const BOSS = makeOji(rng(27), { shirt: '#4a4f5c' }); S.add(BOSS);
const JR = [makeMan({ shirt: '#ffffff', hair: '#1d1a19' }), makeWoman({ shirt: '#e9e4da', hair: '#3a2620' })]; JR.forEach(p => S.add(p));
const busou = label('武勇伝の飲み会', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,110,40,.92)', sx: 3.0 }); S.add(busou);
const sasuga = label('さすがです！', { size: 110, color: '#fff', bg: 'rgba(30,140,90,.92)', sx: 1.7 }); S.add(sasuga);
const zero = label('0円', { size: 150, color: '#fff', bg: 'rgba(200,50,60,.95)', sx: 1.0 }); S.add(zero);
const counter = box(5, 1.1, 0.8, mat('#8a6040')); counter.position.set(IX + 2.8, 0.55, -1.6); S.add(counter);
const TAISHO = makeMan({ shirt: '#f4f4f0', hair: '#1d1a19' }); TAISHO.position.set(IX + 2.8, 0, -2.6); S.add(TAISHO);
const band = box(0.44, 0.1, 0.42, mat('#ffffff')); S.add(band);
const soudan = label('人生相談係', { size: 110, color: '#fff', bg: 'rgba(60,90,160,.92)', sx: 2.0 }); S.add(soudan);

// ---------- D：比べる（x=170）：キャスト・部下・嫁 ----------
const CX = 170;
const cfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#241a30', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, 0); cfloor.renderOrder = -0.8; S.add(cfloor);
const C3 = [makeWoman({ shirt: '#e8508a', skirt: true }), makeMan({ shirt: '#ffffff' }), makeWoman({ shirt: '#f2a0b8' })]; C3.forEach((p, i) => { p.position.set(CX - 1.7 + i * 1.7, 0, 0); S.add(p); });
const TAGS = [['時給あり', 'rgba(30,140,90,.95)'], ['無給', 'rgba(200,50,60,.95)'], ['無給', 'rgba(200,50,60,.95)']].map(([s, c]) => { const l = label(s, { size: 120, color: '#fff', bg: c, sx: 1.6 }); S.add(l); return l; });
const NAMES = ['キャスト', '部下', '嫁'].map(s => { const l = label(s, { size: 100, color: '#fff', bg: 'rgba(40,40,50,.85)', sx: 1.4 }); S.add(l); return l; });
// 結果：日本中にばらまかれるご機嫌取り（おぢの周りに人が並んで、みんな「すごいですね」）
const RING = []; { for (let i = 0; i < 8; i++) { const p = i % 2 ? makeWoman({ shirt: ['#e9e4da', '#f2a0b8', '#9fc7a8', '#c9a8d8'][i % 4] }) : makeMan({ shirt: ['#ffffff', '#4f6a8f', '#8a8f99', '#2f4a7a'][i % 4] }); const a = i / 8 * Math.PI * 2; p.position.set(CX + 40 + Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); p.lookAt(CX + 40, 0, 0); S.add(p); RING.push(p); } }
const CENTER = makeOji(rng(27), { shirt: '#4a4f5c' }); CENTER.position.set(CX + 40, 0, 0); S.add(CENTER);
const rfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2234', { depthWrite: false })); rfloor.rotation.x = -Math.PI / 2; rfloor.position.set(CX + 40, 0.02, 0); rfloor.renderOrder = -0.8; S.add(rfloor);
const RING_LAB = RING.map((p, i) => { const l = label(['すごいですね', 'さすがです', 'へぇー'][i % 3], { size: 100, color: '#fff', bg: 'rgba(90,90,100,.9)', sx: 1.5 }); S.add(l); return l; });
// ひねり：承認欲求の回収車
const TRUCK = new THREE.Group(); TRUCK.position.set(CX + 80, 0, 0); S.add(TRUCK);
{ const cab = box(1.8, 1.8, 2.0, mat('#e8508a')); cab.position.set(2.0, 1.2, 0); TRUCK.add(cab); const bed = box(3.8, 2.4, 2.2, mat('#f4f4f0')); bed.position.set(-0.9, 1.5, 0); TRUCK.add(bed);
  for (const x of [-2, 0.2, 2.2]) for (const z of [-1.05, 1.05]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), mat('#1a1a1a')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.42, z); TRUCK.add(w); } }
const truckLab = label('承認欲求 回収車', { w: 1024, size: 100, color: '#fff', bg: 'rgba(232,80,138,.95)', sx: 3.6 }); truckLab.position.set(CX + 80.6, 3.5, 1.2); S.add(truckLab);
const tfloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat('#3a3a44', { depthWrite: false })); tfloor.rotation.x = -Math.PI / 2; tfloor.position.set(CX + 80, 0.02, 0); tfloor.renderOrder = -0.8; S.add(tfloor);
const BUBBLES = []; for (let i = 0; i < 6; i++) { const l = label(['褒めて', 'すごいって言って', '聞いて'][i % 3], { size: 100, color: '#fff', bg: 'rgba(120,60,160,.92)', sx: 1.5 }); S.add(l); BUBBLES.push(l); }
const OJIQ = []; { const r = rng(88); for (let i = 0; i < 4; i++) { const p = makeOji(r); p.position.set(CX + 85 + i * 1.4, 0, 1.6); p.rotation.y = -Math.PI / 2; S.add(p); OJIQ.push(p); } }

function reset() {
  GLASSES.forEach(g => { g.m.position.copy(g.p); g.m.visible = true; }); clubLight.intensity = 26; chand.visible = true; glitter.set(0.5);
  OJI.visible = CAST.visible = true; OJI.rotation.y = 0.35; CAST.rotation.y = -0.6; OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); CAST.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  OJI.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); CAST.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); OJI.userData.head.rotation.set(0, 0, 0);
  PRAISE.forEach(l => l.visible = false); dots.visible = false; wantLab.visible = false; notSake.visible = false; batsu.visible = false; BILLS.forEach(b => b.visible = false); hearts.set(0);
  anshin.visible = false; sanLab.visible = false; freeLab.visible = false; busou.visible = false; sasuga.visible = false; zero.visible = false; soudan.visible = false;
  TAGS.forEach(l => l.visible = false); NAMES.forEach(l => l.visible = false); RING_LAB.forEach(l => l.visible = false); BUBBLES.forEach(l => l.visible = false); truckLab.visible = false;
  for (const p of [WIFE, HUS, BOSS, CENTER]) { p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); } HUS.visible = true; HUS.position.set(HX - 3, 0, 1); BOSS.position.set(IX - 2.4, 0, -0.6); JR.forEach((p, i) => p.position.set(IX - 3.3 + i * 1.8, 0, 1.4));
  hemi.intensity = 0.95; S.background.set('#120c1c'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function clubCam(t, d = 0) { look(lerp(0.8, 0.5, d), lerp(2.4, 2.6, d), lerp(4.2, 4.8, d), -1.6, 1.9, -1.6, 54); }
function collapse(k) { GLASSES.forEach(g => { if (k <= 0) return; const u = Math.min(k, 1.2); g.m.position.set(g.p.x + g.v.x * u, Math.max(-0.4, g.p.y + g.v.y * u - 4.9 * u * u), g.p.z + g.v.z * u); }); }
function shot0(t) { // 0秒＝サムネ：シャンパンタワーとおぢとキャスト。0.5秒でタワーが崩れて明かりが落ちる
  reset(); lift(0); const k = t - TP; collapse(k); clubLight.intensity = k > 0 ? 26 * Math.max(0.15, 1 - k * 1.5) : 26; chand.visible = k < 0.2;
  CAST.visible = k < 0.15; el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.25) : 0;
  if (k < 0) { PRAISE[0].position.set(-2.2, 2.55, -2.2); pop(PRAISE[0], t, 0.05, 0.3, 1.0); }
  clubCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // キャバクラが消えた（暗い店内。店の数カウントダウン）
  reset(); lift(120); collapse(2); clubLight.intensity = 4; chand.visible = false; CAST.visible = false; OJI.visible = false; glitter.set(0);
  look(0, lerp(4.5, 6, ease(clamp(t / 3.3))), lerp(9, 11, ease(clamp(t / 3.3))), 0, 0.8, -1.5, 50);
  setTop('接待をする飲食店（2024年末）', comma(Math.round(59516 * (1 - ease(clamp((t - 0.6) / 2))))) + '軒', fade(t, 0.15, 3.2, 0.25), PINK);
  return S;
}
function shot2(t) { // 嫁は安心
  reset(); lift(150); hemi.intensity = 1.1; S.background.set('#efe6d8');
  WIFE.position.set(HX + 0.6, 0, 0.6); WIFE.rotation.y = 0.3; WIFE.userData.arms.forEach((a, i) => { a.rotation.x = -0.2; a.rotation.z = (i ? -1 : 1) * 0.15; }); WIFE.userData.head.rotation.x = -0.15;
  HUS.visible = false; anshin.position.set(HX + 0.6, 2.5, 0.8); pop(anshin, t, 0.6, 0.35, 1.2);
  look(HX + 2.0, 2.0, 4.8, HX + 0.6, 1.5, 0.6, 50);
  setTop('嫁', 'これで夜遊びも終わり', fade(t, 0.15, 3.2, 0.25), GREEN);
  return S;
}
function shot3(t) { // 売っていたのはお酒じゃない
  reset(); lift(150); notSake.position.set(-3.2, 1.9, -1.8); pop(notSake, t, 0.3, 0.35, 1.7); batsu.position.set(-3.2, 1.9, -1.75); pop(batsu, t, 1.3, 0.3, 0.9);
  look(-1.2, 2.2, 2.8, -3.2, 1.5, -2.2, 50);
  return S;
}
function shot4(t) { // すごーい、さすがー
  reset(); lift(150); CAST.userData.arms[0].rotation.x = -0.8 + Math.sin(t * 8) * 0.2; OJI.userData.head.rotation.x = -0.25; OJI.position.y = 0.45 + Math.abs(Math.sin(t * 3)) * 0.03;
  PRAISE.forEach((l, i) => { l.position.set(-2.0 - i * 0.7, 2.0 + i * 0.45, -2.2); pop(l, t, 0.3 + i * 0.9, 0.3, 1.2); });
  look(-1.0, 1.9, 1.8, -3.0, 1.6, -2.4, 50);
  return S;
}
function shot5(t) { // お金を払って褒めてもらっていた
  reset(); lift(150); BILLS.forEach((b, i) => { const u = ((t * 0.4 + i / 8) % 1); b.visible = true; b.position.set(lerp(-3.4, -2.7, u), 1.3 + Math.sin(u * Math.PI) * 0.6, -2.4); b.rotation.z = u * 3; });
  hearts.set((t * 0.25) % 1); OJI.userData.head.rotation.x = -0.25;
  look(-1.4, 2.0, 1.6, -3.1, 1.5, -2.5, 50);
  setTop('おぢが買っていたもの', '褒め言葉', fade(t, 0.15, 3.4, 0.25), PINK);
  return S;
}
function shot6(t) { // 相手が消えた。褒められたい欲は消えない
  reset(); lift(150); clubLight.intensity = 8; CAST.visible = false; chand.visible = false; OJI.userData.head.rotation.y = 0.6 + Math.sin(t) * 0.2;
  dots.position.set(-2.6, 1.6, -2.4); pop(dots, t, 0.4, 0.3, 0.9); wantLab.position.set(-3.6, 2.4, -2.4); pop(wantLab, t, 1.6, 0.3, 1.4);
  look(-1.6, 1.9, 1.8, -3.2, 1.6, -2.5, 50);
  return S;
}
function nomikai(t) { BOSS.position.set(IX - 2.4, 0, -0.6); BOSS.rotation.y = 0; BOSS.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 6) * 0.5; JR[0].position.set(IX - 3.3, 0, 1.4); JR[0].rotation.y = Math.PI; JR[1].position.set(IX - 1.5, 0, 1.4); JR[1].rotation.y = Math.PI; }
function shot7(t) { // 次の標的は会社の若手。武勇伝の飲み会が復活
  reset(); lift(140); hemi.intensity = 1.0; S.background.set('#c8a878'); nomikai(t);
  busou.position.set(IX - 2.4, 2.6, 0.4); pop(busou, t, 0.5, 0.35, 2.0);
  look(IX + 0.4, 2.4, 4.4, IX - 2.4, 1.3, 0.4, 52);
  setTop('次の標的', '会社の若手', fade(t, 0.15, 3.6, 0.25), GOLD);
  return S;
}
function shot8(t) { // 部下は、さすがですをタダで言わされる
  reset(); lift(150); hemi.intensity = 1.0; S.background.set('#c8a878'); nomikai(t); JR[0].userData.arms.forEach(a => a.rotation.x = -0.4 - Math.abs(Math.sin(t * 6)) * 0.4);
  sasuga.position.set(IX - 3.3, 2.3, 1.4); pop(sasuga, t, 0.4, 0.3, 1.3); zero.position.set(IX - 2.6, 2.05, 1.6); pop(zero, t, 1.5, 0.3, 0.7);
  look(IX - 3.4, 1.9, -2.4, IX - 3.0, 1.5, 1.2, 50);
  return S;
}
function shot9(t) { // 家では嫁が同じ話を3回。相づちは無料
  reset(); lift(150); hemi.intensity = 1.1; S.background.set('#efe6d8');
  HUS.visible = true; HUS.position.set(HX - 1.6, 0.3, -2.3); HUS.rotation.y = 0.5; HUS.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); HUS.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 5) * 0.4;
  WIFE.position.set(HX - 0.6, 0.3, -2.3); WIFE.rotation.y = -0.6; WIFE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); WIFE.userData.head.rotation.x = 0.3 + Math.sin(t * 4) * 0.15;
  sanLab.position.set(HX - 1.6, 2.4, -2.1); pop(sanLab, t, 0.4, 0.3, 1.5); freeLab.position.set(HX - 0.4, 2.0, -1.9); pop(freeLab, t, 1.6, 0.3, 1.4);
  look(HX + 0.6, 1.9, 2.0, HX - 1.1, 1.2, -2.2, 50);
  WIFE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  return S;
}
function shot10(t) { // 居酒屋の大将は人生相談係
  reset(); lift(150); hemi.intensity = 1.0; S.background.set('#c8a878');
  BOSS.position.set(IX + 2.8, 0, -0.5); BOSS.rotation.y = Math.PI; BOSS.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 5) * 0.4;
  TAISHO.userData.arms.forEach(a => { a.rotation.x = -0.9; a.rotation.z = 0; }); TAISHO.updateMatrixWorld(true); const v = new THREE.Vector3(0, 0.46, 0); TAISHO.userData.head.localToWorld(v); band.position.copy(v);
  soudan.position.set(IX + 2.8, 2.9, -2.4); pop(soudan, t, 0.6, 0.35, 1.6);
  look(IX + 4.6, 2.2, 2.6, IX + 2.8, 1.5, -1.6, 50);
  return S;
}
function shot11(t) { // キャストは時給で聞いていた。部下も嫁も無給
  reset(); lift(110);
  C3.forEach((p, i) => { NAMES[i].position.set(p.position.x, 2.35, 0.2); pop(NAMES[i], t, 0.1 + i * 0.15, 0.3, 0.9); TAGS[i].position.set(p.position.x, 2.95, 0.2); pop(TAGS[i], t, 0.6 + i * 0.7, 0.3, 1.0); });
  look(CX, 2.2, 8.6, CX, 1.8, 0, 50);
  return S;
}
function shot12(t) { // 結果：おぢのご機嫌取りが日本中にばらまかれる
  reset(); lift(110); CENTER.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 5) * 0.4;
  RING_LAB.forEach((l, i) => { const p = RING[i]; l.position.set(p.position.x, 2.4, p.position.z); pop(l, t, 0.4 + i * 0.35, 0.3, 1.2); });
  const u = ease(clamp(t / 6)); look(CX + 40 + lerp(-2, 2, u), lerp(7, 8.5, u), lerp(8, 9.5, u), CX + 40, 1.2, 0, 50);
  setTop('結果', 'ご機嫌取りが日本中に', fade(t, 0.15, 5.8, 0.25), PINK);
  return S;
}
function shot13(t) { // キャバクラとは、おぢの承認欲求の回収業者だった
  reset(); lift(110); S.background.set('#1a1430');
  BUBBLES.forEach((l, i) => { const u = ((t * 0.28 + i / 6) % 1); l.visible = true; const s = 1.3 * (1 - u * 0.6); l.scale.set(s, s * l.userData.ar, 1); l.position.set(lerp(CX + 86, CX + 79, u), 2.4 + Math.sin(u * Math.PI) * 1.4, lerp(1.6, 0, u)); });
  pop(truckLab, t, 0.4, 0.35, 2.6);
  look(CX + 81.5, 3.2, 10.5, CX + 81.5, 2.2, 0.4, 52);
  setTop('キャバクラの正体', '承認欲求の回収業者', fade(t, 0.3, 5.8, 0.25), PINK);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（タワーは崩れたまま、キャストのいない店）
  reset(); lift(0); collapse(2); clubLight.intensity = 7; chand.visible = false; CAST.visible = false; glitter.set(0);
  clubCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, '日本中のキャバクラが、<br>この世から消えた。'],
  [6.6, 9.9, '嫁は安心。これで旦那の<br>夜遊びも終わり。'],
  [10.0, 13.3, 'でもキャバクラが<br>売っていたのはお酒じゃない。'],
  [13.4, 16.9, '売っていたのは、<br>すごーい、さすがー。'],
  [17.0, 20.5, 'おぢはお金を払って、<br>褒めてもらっていた。'],
  [20.6, 24.0, 'その相手が消えた。<br>褒められたい欲は消えない。'],
  [24.1, 27.8, '次の標的は、会社の若手。<br>武勇伝の飲み会が復活。'],
  [27.9, 31.5, '部下は、さすがですを<br>タダで言わされる。'],
  [31.6, 35.4, '家では嫁が同じ話を3回。<br>相づちは無料。'],
  [35.5, 38.9, '居酒屋の大将は、<br>カウンター越しの人生相談係。'],
  [39.0, 43.0, 'キャストは時給で聞いていた。<br>部下も嫁も、無給で同じ仕事。'],
  [43.1, 48.9, '結果：おぢのご機嫌取りが、<br>日本中にばらまかれる。'],
  [49.0, 55.0, 'キャバクラとは、おぢの<br>承認欲求の回収業者だった。'],
  [55.1, 61.3, 'キャバクラにお金を使う男、<br>あり？なし？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.4, f: shot3 },
  { a: 13.4, b: 17.0, f: shot4 }, { a: 17.0, b: 20.6, f: shot5 }, { a: 20.6, b: 24.1, f: shot6 }, { a: 24.1, b: 27.9, f: shot7 },
  { a: 27.9, b: 31.6, f: shot8 }, { a: 31.6, b: 35.3, f: shot9 }, { a: 35.3, b: 39.0, f: shot10 }, { a: 39.0, b: 43.1, f: shot11 },
  { a: 43.1, b: 49.0, f: shot12 }, { a: 49.0, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0627',
    v2: true,
    hookLine: 'キャバクラが、全部消えた。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもキャバクラが消えたら？',
    titleHtml: 'もしもキャバクラが<br>消えたら？',
    mood: 'mystery', seed: 627, hits: [0.5, 43.1, 49.0], risers: [39.0], impacts: [10.0, 13.4, 20.6, 24.1, 31.6, 39.0, 43.1, 49.0],
    sfx: [[0.5, 'poof'], [11.3, 'buzz'], [13.8, 'bubble'], [14.8, 'bubble'], [21.0, 'whoosh'], [29.4, 'buzz'], [33.2, 'buzz'], [49.4, 'whoosh']],
    narr: { 'おぢ': 'おじ', '嫁': 'よめ', '旦那': 'だんな', '大将': 'たいしょう', '結果：': '結果、' },
    ask: 'キャバクラにお金を使う男、あり？なし？',
    caption: 'もしも日本中のキャバクラが消えたら？\n\n嫁は安心。これで旦那の夜遊びも終わり…のはずだった。\nでもキャバクラが売っていたのは、お酒じゃない。すごーい、さすがー、知らなかったー。\nおぢはお金を払って褒めてもらっていた。その相手が消えても、褒められたい欲は消えない。\n次の標的は会社の若手。部下は「さすがです」をタダで言わされる。家では嫁が同じ話を3回聞かされる。\nキャストは時給で聞いていた。部下も嫁も、無給で同じ仕事。\n\n結果：おぢのご機嫌取りが、日本中にばらまかれる。\nキャバクラとは、おぢの承認欲求の回収業者だったのかもしれない。\n\nキャバクラにお金を使う男、あり？なし？ コメントで教えて。\n\n※風刺ネタです。実在の店・人物とは関係ありません\n出典：警察庁「令和6年における風俗営業等の現状」（接待をする飲食店 59,516軒・2024年末）',
    hashtags: ['もしもラボ', 'もしも', 'キャバクラ', '承認欲求', 'おぢ'],
    endStats: [['接待をする飲食店（2024年末）', '59,516軒', '警察庁'], ['キャストの相づち', '時給あり', '部下と嫁は無給'], ['キャバクラの正体', '承認欲求の回収業者', 'かもしれない']],
    sources: '出典：警察庁「令和6年における風俗営業等の現状と風俗関係事犯等の取締り状況について」',
  },
});
