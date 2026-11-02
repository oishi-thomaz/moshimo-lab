import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';

// もしも男が年下を好きになれなかったら？（皮肉回・台本 S09）
// 2026/11/02 ゆうと承認。元ネタ：はてな匿名ダイアリー「どうして男は年下と恋愛したがるのか」（はてブ ホッテントリ）
// 数字は使わない（皮肉と状況だけで見せる回）

const PINK = '#ff7ab8', GOLD = '#ffd27a', BLUE = '#7fd4ff', GRAY = '#cfd3dc', RED = '#ff6a6a', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#1a1626'); S.fog = new THREE.Fog(0x1a1626, 40, 180);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3444, 1.05); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(10, 20, 14); S.add(sun);

// ---------- A：おぢの部屋（原点）：大きなスマホ ----------
const room = makeRoom({ w: 10, d: 8, wall: '#3a3448', floor: '#5a4a3a' }); room.userData.rw.visible = false; S.add(room);
const OJI = makeOji(rng(28), { shirt: '#4a4f5c' }); OJI.position.set(-0.7, 0, 0.9); OJI.rotation.y = 0.35; S.add(OJI);
const big = makePhone({ w: 2.4, h: 4.8 }); big.g.position.set(0.9, 2.6, -0.4); big.g.rotation.y = -0.35; S.add(big.g);
const bigLight = new THREE.PointLight(0xffc0e0, 10, 8, 1.5); bigLight.position.set(0.4, 2.6, 1.2); S.add(bigLight);
const poof = makeSparkles(260, 0.18, 0xff9ec7); S.add(poof.points); poof.init([[0.9, 2.6, -0.2]], 1.4, 2);
function face(g, x, y, s, young, k) {
  g.fillStyle = ['#f5d3b5', '#f1c9a5', '#e8b98f'][k % 3]; g.beginPath(); g.ellipse(x, y, 40 * s, 48 * s, 0, 0, 6.29); g.fill();
  g.fillStyle = young ? ['#3a2620', '#6b4a33', '#a0703a'][k % 3] : ['#6a5a50', '#8a7a70', '#4a3a30'][k % 3];
  g.beginPath(); g.ellipse(x, y - 30 * s, 46 * s, 30 * s, 0, Math.PI, 0); g.fill(); g.fillRect(x - 46 * s, y - 30 * s, 14 * s, (young ? 80 : 50) * s); g.fillRect(x + 32 * s, y - 30 * s, 14 * s, (young ? 80 : 50) * s);
  g.fillStyle = '#111'; g.fillRect(x - 16 * s, y - 4 * s, 7 * s, 9 * s); g.fillRect(x + 9 * s, y - 4 * s, 7 * s, 9 * s);
  if (!young) { g.strokeStyle = 'rgba(120,80,60,.5)'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x - 22 * s, y + 10 * s); g.lineTo(x - 14 * s, y + 14 * s); g.moveTo(x + 22 * s, y + 10 * s); g.lineTo(x + 14 * s, y + 14 * s); g.stroke(); }
  g.strokeStyle = '#a0403a'; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, y + 22 * s, 8 * s, 0.2, 2.9); g.stroke();
}
const AGE_Y = [22, 24, 21, 26, 23, 25], AGE_O = [52, 55, 50, 54, 53, 51];
function appScreen(young, t = 0) {
  big.draw((young ? 'y' : 'o') + Math.floor(t * 2), (g, w, h) => {
    g.fillStyle = '#fff4f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5f9e'; g.fillRect(0, 0, w, 120);
    g.fillStyle = '#fff'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(young ? 'おすすめの相手' : '同い年以上のみ', w / 2, 62);
    for (let i = 0; i < 6; i++) { const cx = 30 + (i % 2) * 250, cy = 150 + Math.floor(i / 2) * 290; g.fillStyle = '#fff'; g.fillRect(cx, cy, 230, 270); face(g, cx + 115, cy + 110, 1.3, young, i);
      g.fillStyle = '#333'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText((young ? AGE_Y : AGE_O)[i] + '歳', cx + 115, cy + 235); }
  });
}
const youngLab = label('20代', { size: 130, color: '#fff', bg: 'rgba(255,95,158,.92)', sx: 1.2 }); S.add(youngLab);

// ---------- B：カフェ（x=50）：同い年の女性とのデート ----------
const CX = 50;
const cafe = makeRoom({ w: 10, d: 8, wall: '#e8dccb', floor: '#a07a55' }); cafe.position.set(CX, 0, 0); cafe.userData.rw.visible = false; S.add(cafe);
const ctable = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 24), mat('#ffffff')); ctable.position.set(CX, 0.95, 0); S.add(ctable);
const cleg = box(0.12, 0.95, 0.12, mat('#6a6a70')); cleg.position.set(CX, 0.47, 0); S.add(cleg);
const cups = [new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.16, 12), mat('#ffffff')), new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.16, 12), mat('#ffffff'))]; cups[0].position.set(CX - 0.3, 1.07, 0); cups[1].position.set(CX + 0.3, 1.07, 0); cups.forEach(c => S.add(c));
for (const x of [-1.05, 1.05]) { const ch = box(0.6, 0.5, 0.6, mat('#7a5a3a')); ch.position.set(CX + x, 0.25, 0); S.add(ch); }
const DOJI = makeOji(rng(28), { shirt: '#4a4f5c' }); DOJI.position.set(CX - 1.05, 0.5, 0); DOJI.rotation.y = Math.PI / 2; DOJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); S.add(DOJI);
const LADY = makeWoman({ shirt: '#c9b8a0', hair: '#6a5a50' }); LADY.position.set(CX + 1.05, 0.5, 0); LADY.rotation.y = -Math.PI / 2; LADY.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); S.add(LADY);
const sheet = box(0.5, 0.7, 0.03, mat('#ffffff')); S.add(sheet);
const QS = ['年収は？', '持ち家は？', '健康診断の結果は？', '親の介護はどうする？'].map(s => { const l = label(s, { w: 1024, size: 100, color: '#fff', bg: 'rgba(80,90,120,.95)', sx: 2.4 }); S.add(l); return l; });
const busou = label('昔はな…', { size: 120, color: '#fff', bg: 'rgba(200,110,40,.92)', sx: 1.4 }); S.add(busou);
const de = label('…で？', { size: 130, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 1.2 }); S.add(de);
// 若さの後光（年下の前でだけ光っていたもの）
const halo = makeSparkles(260, 0.22, 0xff9ec7); S.add(halo.points); halo.init([[CX - 1.05, 1.9, 0]], 1.0, 1.2);
const hosei = label('若さの補正 OFF', { w: 1024, size: 100, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.6 }); S.add(hosei);

// ---------- C：スーパーの売り場（x=100）：値札と見切りシール ----------
const MX = 100;
const mroom = makeRoom({ w: 14, d: 8, wall: '#f4f4f0', floor: '#d8d4c8' }); mroom.position.set(MX, 0, 0); mroom.userData.rw.visible = false; S.add(mroom);
const shelfM = mat('#c9ced8');
for (const y of [0.0, 1.2]) { const sh = box(9, 0.12, 1.2, shelfM); sh.position.set(MX, y + 0.06, -2.6); S.add(sh); }
const sback = box(9, 2.6, 0.1, mat('#e4e8ee')); sback.position.set(MX, 1.3, -3.2); S.add(sback);
const SHELF = []; { const r = rng(61); for (let i = 0; i < 5; i++) { const p = makeOji(r); p.position.set(MX - 3.6 + i * 1.8, 0.12, -2.6); p.scale.setScalar(0.9); S.add(p); SHELF.push(p); } }
const TAGS = SHELF.map((p, i) => { const l = label(i === 2 ? '値段：要相談' : '50代', { size: 100, color: '#333', bg: 'rgba(255,240,120,.95)', sx: 1.1 }); l.position.set(p.position.x, 0.5, -1.9); S.add(l); return l; });
const mikiri = label('見切り品', { size: 130, color: '#fff', bg: 'rgba(230,40,40,.95)', sx: 1.4 }); mikiri.position.set(MX, 2.6, -2.2); S.add(mikiri);
const SHOPPERS = [makeWoman({ shirt: '#c9b8a0', hair: '#6a5a50' }), makeWoman({ shirt: '#9fc7a8', hair: '#5a4a40' })]; SHOPPERS.forEach(p => S.add(p));
const BASK = SHOPPERS.map(() => { const b = box(0.5, 0.3, 0.35, mat('#d23a3a')); S.add(b); return b; });
const erabu = label('選ばれる側', { size: 120, color: '#fff', bg: 'rgba(30,110,170,.95)', sx: 2.0 }); erabu.position.set(MX, 3.5, -2.2); S.add(erabu);

// ---------- D：街（x=150）：快適な20代と、飲み会の席 ----------
const TX = 150;
const street = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), mat('#5a5f6b', { depthWrite: false })); street.rotation.x = -Math.PI / 2; street.position.set(TX, 0.01, 0); street.renderOrder = -0.8; S.add(street);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#3a3a40', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
for (let i = 0; i < 4; i++) { const b = box(5, 7 + i % 2 * 3, 4, mat(['#8a8f99', '#a0a6b0', '#7a808c', '#9aa0aa'][i])); b.position.set(TX - 9 + i * 6, (7 + i % 2 * 3) / 2, -7); S.add(b); }
const GIRL = makeWoman({ shirt: '#f2a0b8', hair: '#3a2620', skirt: true }); S.add(GIRL);
const PASSOJI = [makeOji(rng(5)), makeOji(rng(9))]; PASSOJI.forEach(p => S.add(p));
const kaiteki = label('快適', { size: 140, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 1.3 }); S.add(kaiteki);
const IX = 200;
const izk = makeRoom({ w: 10, d: 7, wall: '#c8a878', floor: '#6a4a30' }); izk.position.set(IX, 0, 0); izk.userData.rw.visible = false; S.add(izk);
const itable = box(3.6, 0.75, 1.4, mat('#5a3a24')); itable.position.set(IX, 0.37, 0); S.add(itable);
const BOSS = makeOji(rng(28), { shirt: '#4a4f5c' }); BOSS.position.set(IX - 1.2, 0, -1.2); S.add(BOSS);
const JRW = makeWoman({ shirt: '#ffffff', hair: '#3a2620' }); JRW.position.set(IX + 1.6, 0, 1.2); JRW.rotation.y = Math.PI; S.add(JRW);
const JRM = makeMan({ shirt: '#4f6a8f' }); JRM.position.set(IX - 1.0, 0, 1.2); JRM.rotation.y = Math.PI; S.add(JRM);
const tonari = label('隣に座らせる係 廃止', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,60,90,.92)', sx: 3.0 }); tonari.position.set(IX, 2.9, 0); S.add(tonari);
// 結果：ベンチのおぢ
const BX = 250;
const bench = box(2.4, 0.45, 0.8, mat('#7a5a3a')); bench.position.set(BX, 0.22, 0); S.add(bench);
const LONE = makeOji(rng(28), { shirt: '#4a4f5c' }); LONE.position.set(BX, 0.45, 0); LONE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); LONE.userData.head.rotation.x = 0.4; S.add(LONE);
const loneLight = new THREE.PointLight(0xffe0b0, 8, 10, 1.4); loneLight.position.set(BX, 5, 2); S.add(loneLight);

function reset() {
  appScreen(true, 0); poof.set(0); youngLab.visible = false; OJI.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); OJI.userData.head.rotation.set(0, 0, 0);
  QS.forEach(l => l.visible = false); busou.visible = false; de.visible = false; halo.set(0); hosei.visible = false; sheet.visible = false;
  DOJI.userData.head.rotation.set(0, 0, 0); DOJI.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); LADY.userData.head.rotation.set(0, 0, 0); LADY.userData.arms.forEach(a => a.rotation.set(0, 0, 0));
  GIRL.position.set(TX - 1.5, 0, 1); SHOPPERS.forEach((p, i) => p.position.set(MX - 4 + i * 2.2, 0, -0.6)); BASK.forEach(b => b.position.set(MX, -5, 0)); PASSOJI.forEach((p, i) => p.position.set(TX + 2 + i * 1.5, 0, -0.8)); mikiri.visible = false; erabu.visible = false; kaiteki.visible = false; tonari.visible = false;
  hemi.intensity = 1.05; S.background.set('#1a1626'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function roomCam(t, d = 0) { look(lerp(0.3, 0.1, d), lerp(2.2, 2.3, d), lerp(5.4, 6.0, d), 0.1, 2.1, -0.2, 54); }
function shot0(t) { // 0秒＝サムネ：おぢのアプリに20代の写真。0.5秒で全部消えて同年代に
  reset(); lift(60); const k = t - TP; appScreen(k < 0, t); poof.set(k > 0 ? clamp(k / 1.2) : 0);
  OJI.userData.arms[1].rotation.x = -1.2; OJI.userData.head.rotation.x = k > 0.2 ? -0.25 : 0;
  el.flash.style.opacity = k > 0 ? 0.4 * Math.max(0, 1 - k / 0.25) : 0;
  roomCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // ある日、男は年下を好きになれなくなった
  reset(); lift(60); appScreen(false, t); OJI.userData.arms[1].rotation.x = -1.2; OJI.userData.head.rotation.y = Math.sin(t * 3) * 0.3;
  roomCam(t, 1);
  setTop('男が好きになれる相手', '同い年以上だけ', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 50代のおぢのアプリから20代の写真が全部消える
  reset(); lift(60); const sw = Math.floor(t * 2) % 2 === 0 && t < 1.6; appScreen(sw, t); youngLab.position.set(0.9, 5.4, -0.2); pop(youngLab, t, 0.2, 0.3, 1.0); youngLab.visible = t < 1.6;
  look(0.8, 2.7, 4.2, 0.9, 2.6, -0.4, 50);
  setTop('アプリのおすすめ', t < 1.6 ? '20代' : '全部 50代', fade(t, 0.15, 3.2, 0.25), PINK);
  return S;
}
function dateCam(t) { look(CX + 0.4, 2.7, 4.8, CX, 1.75, 0, 50); }
function shot3(t) { // 初めて同い年の女性とマッチする
  reset(); lift(40); hemi.intensity = 1.15; S.background.set('#e8dccb'); DOJI.userData.arms[1].rotation.x = -0.6 + Math.sin(t * 3) * 0.2;
  look(lerp(CX + 1.4, CX + 0.4, ease(clamp(t / 3.4))), 2.7, lerp(5.6, 4.8, ease(clamp(t / 3.4))), CX, 1.75, 0, 50);
  setTop('マッチした相手', '同い年', fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function askShot(t, from) { reset(); lift(40); hemi.intensity = 1.15; S.background.set('#e8dccb'); LADY.userData.arms[1].rotation.x = -1.2; LADY.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.62, 0.1); LADY.userData.arms[1].localToWorld(v); sheet.visible = true; sheet.position.copy(v); sheet.rotation.set(-0.4, -Math.PI / 2, 0);
  DOJI.userData.head.rotation.x = 0.15 + Math.sin(t * 2) * 0.05;
  for (let i = from; i < from + 2; i++) { QS[i].position.set(CX + 0.3, 2.75 + (i - from) * 0.42, 0.2); pop(QS[i], t, 0.3 + (i - from) * 1.3, 0.3, 1.5); }
  dateCam(t); return S; }
function shot4(t) { return askShot(t, 0); } // 年収は？持ち家は？
function shot5(t) { return askShot(t, 2); } // 健康診断は？介護は？
function shot6(t) { // 同い年の女性は、男を見る目が厳しい
  reset(); lift(40); hemi.intensity = 1.15; S.background.set('#e8dccb'); LADY.userData.head.rotation.y = -0.2; LADY.userData.arms.forEach(a => { a.rotation.x = -0.3; a.rotation.z = 0; });
  look(CX - 2.2, 1.9, 1.6, CX + 1.05, 1.6, 0, 46);
  setTop('同い年の女性の目', '厳しい', fade(t, 0.15, 3.3, 0.25), RED);
  return S;
}
function shot7(t) { // 若い子の前で通じた武勇伝が、一言も通じない
  reset(); lift(40); hemi.intensity = 1.15; S.background.set('#e8dccb'); DOJI.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 6) * 0.4;
  busou.position.set(CX - 0.9, 2.65, 0.2); pop(busou, t, 0.3, 0.3, 0.9); de.position.set(CX + 0.9, 2.65, 0.2); pop(de, t, 1.8, 0.3, 0.8); LADY.userData.head.rotation.z = t > 1.8 ? 0.25 : 0;
  dateCam(t); return S;
}
function shot8(t) { // 若さで埋めていた差が、全部むき出しになる
  reset(); lift(40); hemi.intensity = 1.0; S.background.set('#e8dccb'); halo.set(t < 1.4 ? 0.45 : 0); pop(hosei, t, 1.5, 0.3, 1.5); hosei.position.set(CX - 1.05, 2.65, 0.2);
  look(CX - 0.6, 2.0, 3.4, CX - 1.05, 1.85, 0, 50);
  return S;
}
function shot9(t) { // おぢは初めて、市場での自分の値段を知る
  reset(); lift(110); hemi.intensity = 1.2; S.background.set('#f4f4f0'); pop(mikiri, t, 1.2, 0.3, 1.3);
  look(MX, 2.4, 5.6, MX, 1.4, -2.4, 52);
  setTop('おぢの値段', '要相談', fade(t, 0.15, 3.5, 0.25), GOLD);
  return S;
}
function shot10(t) { // 一方、20代の女性は話しかけられなくなって快適
  reset(); lift(150); hemi.intensity = 1.2; S.background.set('#9fc4e8');
  GIRL.position.set(TX - 1.5 + t * 0.7, 0, 1); GIRL.rotation.y = Math.PI / 2; const s = Math.sin(t * 8) * 0.5; GIRL.userData.legs[0].rotation.x = s; GIRL.userData.legs[1].rotation.x = -s;
  PASSOJI.forEach((p, i) => { p.position.set(TX + 2 - t * 0.9 + i * 1.5, 0, -0.8 - i * 0.4); p.rotation.y = -Math.PI / 2; const q = Math.sin(t * 7 + i) * 0.5; p.userData.legs[0].rotation.x = q; p.userData.legs[1].rotation.x = -q; });
  kaiteki.position.set(GIRL.position.x, 2.5, 1); pop(kaiteki, t, 1.0, 0.3, 1.1);
  look(TX + 0.5, 2.2, 7, TX + 0.5, 1.3, 0, 50);
  return S;
}
function shot11(t) { // 職場の飲み会からも、隣に座らされる係が消えた
  reset(); lift(150); hemi.intensity = 1.0; S.background.set('#c8a878'); BOSS.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 4) * 0.3;
  pop(tonari, t, 0.6, 0.35, 2.1);
  look(IX + 0.6, 3.0, 5.4, IX, 1.2, 0, 52);
  return S;
}
function shot12(t) { // 結果：年下が好きだったのは、比べられたくなかったから
  reset(); lift(110); hemi.intensity = 0.6; S.background.set('#141220');
  const u = ease(clamp(t / 6)); look(BX + lerp(2.4, 1.6, u), lerp(2.4, 2.0, u), lerp(5, 3.6, u), BX, 1.2, 0, 50);
  setTop('結果', '比べられたくなかった', fade(t, 0.15, 5.8, 0.25), RED);
  return S;
}
function shot13(t) { // 選ぶ側だと思っていた人が、初めて選ばれる側に回る
  reset(); lift(110); hemi.intensity = 1.2; S.background.set('#f4f4f0');
  SHOPPERS.forEach((p, i) => { p.position.set(MX - 4 + t * 0.9 + i * 2.2, 0, -0.6 + i * 0.5); p.rotation.y = Math.PI / 2 - 0.4; p.userData.head.rotation.y = -0.9; const s = Math.sin(t * 6 + i) * 0.4; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s;
    p.userData.arms[0].rotation.x = -0.5; p.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.66, 0.1); p.userData.arms[0].localToWorld(v); BASK[i].position.copy(v); });
  pop(erabu, t, 0.6, 0.35, 2.0); pop(mikiri, t, 0, 0.01, 1.3);
  look(MX + 1, 2.4, 6.4, MX, 1.4, -2.0, 52);
  setTop('おぢの立場', '選ばれる側', fade(t, 0.3, 5.8, 0.25), BLUE);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（アプリは同年代のまま）
  reset(); lift(60); appScreen(false, 0); OJI.userData.arms[1].rotation.x = -1.2; OJI.userData.head.rotation.x = 0.2;
  roomCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, 'ある日、男は年下を<br>好きになれなくなった。'],
  [6.6, 9.9, '50代のおぢのアプリから、<br>20代の写真が全部消える。'],
  [10.0, 13.4, 'そして初めて、<br>同い年の女性とマッチする。'],
  [13.5, 17.0, '最初の質問。<br>年収は？持ち家は？'],
  [17.1, 20.6, '健康診断の結果は？<br>親の介護はどうする？'],
  [20.7, 24.2, '同い年の女性は、<br>男を見る目が厳しい。'],
  [24.3, 27.9, '若い子の前で通じた武勇伝が、<br>一言も通じない。'],
  [28.0, 31.6, '若さで埋めていた差が、<br>全部むき出しになる。'],
  [31.7, 35.3, 'おぢは初めて、<br>市場での自分の値段を知る。'],
  [35.4, 39.0, '一方、20代の女性は<br>話しかけられなくなって快適。'],
  [39.1, 42.8, '職場の飲み会からも、<br>隣に座らされる係が消えた。'],
  [42.9, 48.8, '結果：年下が好きだったのは、<br>比べられたくなかったから。'],
  [48.9, 55.0, '選ぶ側だと思っていた人が、<br>初めて選ばれる側に回る。'],
  [55.1, 61.3, '年の差恋愛、<br>あり？なし？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 17.1, f: shot4 }, { a: 17.1, b: 20.7, f: shot5 }, { a: 20.7, b: 24.3, f: shot6 }, { a: 24.3, b: 28.0, f: shot7 },
  { a: 28.0, b: 31.7, f: shot8 }, { a: 31.7, b: 35.4, f: shot9 }, { a: 35.4, b: 39.1, f: shot10 }, { a: 39.1, b: 42.9, f: shot11 },
  { a: 42.9, b: 48.9, f: shot12 }, { a: 48.9, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0628',
    v2: true,
    hookLine: '男は、年下を好きになれなくなった。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも男が年下に興味がなかったら？',
    titleHtml: 'もしも男が年下に<br>興味がなかったら？',
    mood: 'mystery', seed: 628, hits: [0.5, 42.9, 48.9], risers: [39.1], impacts: [10.0, 13.5, 17.1, 24.3, 31.7, 42.9, 48.9],
    sfx: [[0.5, 'poof'], [10.3, 'bubble'], [13.8, 'buzz'], [17.4, 'buzz'], [26.1, 'buzz'], [32.9, 'alarm'], [49.4, 'whoosh']],
    narr: { 'おぢ': 'おじ', '結果：': '結果、' },
    ask: '年の差恋愛、あり？なし？',
    caption: 'もしも男が、同い年以上しか好きになれなかったら？\n\n50代のおぢのアプリから、20代の写真が全部消える。初めてマッチした同い年の女性からの質問は、年収は？持ち家は？健康診断の結果は？親の介護はどうする？\n若い子の前で通じた武勇伝が一言も通じない。若さで埋めていた差が全部むき出しになる。\n一方、20代の女性は話しかけられなくなって快適。\n\n結果：年下が好きだったのは、比べられたくなかったから。\n選ぶ側だと思っていた人が、初めて選ばれる側に回る。\n\n年の差恋愛、あり？なし？ コメントで教えて。\n\n※風刺ネタです',
    hashtags: ['もしもラボ', 'もしも', '年の差恋愛', 'マッチングアプリ', 'おぢ'],
    endStats: [['おぢのアプリ', '同い年以上だけ', '20代は消えた'], ['最初の質問', '年収・持ち家・介護', '同い年は厳しい'], ['おぢの立場', '選ばれる側', 'かもしれない']],
    sources: '※風刺ネタです',
  },
});
