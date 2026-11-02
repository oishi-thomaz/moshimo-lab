import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';

// もしも幼稚園が専業主婦専用になったら？（皮肉回・台本 S10）
// 2026/11/02 ゆうと承認（専業ママ→専業主婦に修正）。元ネタ：Togetter「預かり保育をやめてほしい、ワーママが風邪を広めるから」
// 数字（裏取り済み）：
//  幼稚園の在園者数 1,339,761人（平成28年度）→ 627,450人（令和8年度 速報）文部科学省 学校基本調査
//  預かり保育を実施している幼稚園 90.9%（令和5年度 幼児教育実態調査）文部科学省

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#9fd0f0'); S.fog = new THREE.Fog(0x9fd0f0, 50, 180);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a6a4a, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#8ab86a', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function kinder(sc = 1, col = '#ffe08a', roof = '#e86a5a') {
  const g = new THREE.Group(); const b = box(6, 2.6, 3, mat(col)); b.position.y = 1.3; g.add(b);
  const r = box(6.6, 0.4, 3.6, mat(roof)); r.position.y = 2.8; g.add(r);
  for (let i = 0; i < 4; i++) { const w = box(0.8, 0.8, 0.05, mat('#bfe4ff')); w.position.set(-2.1 + i * 1.4, 1.5, 1.52); g.add(w); }
  g.scale.setScalar(sc); return g;
}
function kid(c) { const k = (c % 2 ? makeWoman : makeMan)({ shirt: ['#ffb84a', '#6ac0ff', '#ff8ab0', '#8ad06a'][c % 4] }); k.scale.setScalar(0.5); const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 14), mat('#ffd23a')); hat.position.set(0, 1.92, 0); k.add(hat); return k; }
function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; }
function walk(p, t, sp = 8) { const s = Math.sin(t * sp) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }

// ---------- A：幼稚園と門（原点） ----------
const KG = kinder(); KG.position.set(0, 0, -6); S.add(KG);
const kgSign = label('ようちえん', { w: 768, size: 120, color: '#e8503a', bg: 'rgba(255,255,255,.96)', sx: 2.0 }); kgSign.position.set(0, 3.7, -4.2); S.add(kgSign);
const yard = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), mat('#d8c090', { depthWrite: false })); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.02, -2.8); yard.renderOrder = -0.8; S.add(yard);
const postL = box(0.4, 1.8, 0.4, mat('#8a8f99')); postL.position.set(-1.6, 0.9, 0.3); S.add(postL);
const postR = box(0.4, 1.8, 0.4, mat('#8a8f99')); postR.position.set(1.6, 0.9, 0.3); S.add(postR);
const gateL = box(1.4, 1.2, 0.12, mat('#4a8ad0')); gateL.position.y = 0.7; S.add(gateL);
const gateR = box(1.4, 1.2, 0.12, mat('#4a8ad0')); gateR.position.y = 0.7; S.add(gateR);
const reader = box(0.3, 0.42, 0.14, mat('#20242c')); reader.position.set(1.6, 1.25, 0.55); S.add(reader);
const led = box(0.16, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: '#22e06a' })); led.position.set(1.6, 1.36, 0.63); S.add(led);
const senyo = label('専業主婦の子ども専用', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 2.4 }); senyo.position.set(0, 2.4, 0.4); S.add(senyo);
function gate(u) { const o = lerp(0.7, 0, clamp(u)); gateL.position.set(-0.75 - o * 1.2, 0.7, 0.3); gateR.position.set(0.75 + o * 1.2, 0.7, 0.3); }
const HOUSEWIFE = makeWoman({ shirt: '#f2c6d0', hair: '#3a2620' }); S.add(HOUSEWIFE);
const WORKMOM = makeWoman({ shirt: '#2b3346', hair: '#1d1a19' }); S.add(WORKMOM); const bag = box(0.36, 0.28, 0.12, mat('#5a3a2a')); bag.position.set(0.32, 0.8, 0); WORKMOM.add(bag);
const KH = kid(0), KW = kid(1); S.add(KH); S.add(KW);
const PLAY = [0, 1, 2, 3, 4, 5].map(i => { const k = kid(i); S.add(k); return k; });
const kaze = label('これで風邪をもらわない', { w: 1024, size: 96, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 2.2 }); S.add(kaze);

// ---------- B：数字（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#6a9a5a', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -6); bfloor.renderOrder = -0.8; S.add(bfloor);
const barA = box(1.4, 1, 1.2, mat('#ffd06a')); barA.geometry.translate(0, 0.5, 0); barA.position.set(BX - 1.3, 0, -6); S.add(barA);
const barB = box(1.4, 1, 1.2, mat('#ff8a6a')); barB.geometry.translate(0, 0.5, 0); barB.position.set(BX + 1.3, 0, -6); S.add(barB);
const vA = label('134万人', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vA);
const vB = label('63万人', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vB);
// 預かり保育の円（10個中9個が光る）
const DOTS = []; for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), new THREE.MeshBasicMaterial({ color: '#cfd6de' })); d.rotation.x = Math.PI / 2; d.position.set(BX + 30 - 2.0 + (i % 5) * 1.0, 3.2 - Math.floor(i / 5) * 1.0, 0); S.add(d); DOTS.push(d); }
const azukari = label('預かり保育', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 1.8 }); azukari.position.set(BX + 30, 4.6, 0); S.add(azukari);

// ---------- C：掲示板（x=110） ----------
const CX = 110;
const board = box(4.2, 3, 0.2, mat('#7a5a3a')); board.position.set(CX, 2.1, -1); S.add(board);
const boardIn = box(3.8, 2.6, 0.05, mat('#c9a878')); boardIn.position.set(CX, 2.1, -0.88); S.add(boardIn);
const legBL = box(0.15, 1.0, 0.15, mat('#5a3a20')); legBL.position.set(CX - 1.8, 0.5, -1); S.add(legBL);
const legBR = box(0.15, 1.0, 0.15, mat('#5a3a20')); legBR.position.set(CX + 1.8, 0.5, -1); S.add(legBR);
const noticeC = document.createElement('canvas'); noticeC.width = 512; noticeC.height = 640; { const g = noticeC.getContext('2d'); g.fillStyle = '#fffdf5'; g.fillRect(0, 0, 512, 640); g.fillStyle = '#222'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.fillText('閉園のお知らせ', 256, 90); g.font = '700 40px "Noto Sans CJK JP", sans-serif'; ['園児数の減少により', '来年3月をもって', '閉園いたします'].forEach((s, i) => g.fillText(s, 256, 240 + i * 80)); g.font = '700 32px "Noto Sans CJK JP", sans-serif'; g.fillText('園長', 380, 560); }
const noticeT = new THREE.CanvasTexture(noticeC); noticeT.colorSpace = THREE.SRGBColorSpace;
const NOTICE = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.375), new THREE.MeshBasicMaterial({ map: noticeT })); NOTICE.position.set(CX, 2.1, -0.84); S.add(NOTICE);
const pin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#d23a3a')); pin.position.set(CX, 3.2, -0.8); S.add(pin);

// ---------- D：町の幼稚園（x=160） ----------
const DX = 160;
const KGS = [[-5, -6], [0, -9], [5, -6], [-3, -14], [4, -14]].map(([x, z], i) => { const k = kinder(0.55, ['#ffe08a', '#ffd0e0', '#d0f0ff', '#e8ffd0', '#fff0c0'][i]); k.position.set(DX + x, 0, z); S.add(k); return k; });
const XS = KGS.map(k => { const l = label('閉園', { w: 512, size: 130, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 1.3 }); l.position.set(k.position.x, 2.6, k.position.z + 1); S.add(l); return l; });
const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.4), mat('#5a5e66', { depthWrite: false })); road.rotation.x = -Math.PI / 2; road.position.set(DX, 0.03, -1); road.renderOrder = -0.8; S.add(road);
const car = new THREE.Group(); { const b = box(2.0, 0.6, 1.0, mat('#e8e8ee')); b.position.y = 0.5; car.add(b); const t = box(1.2, 0.5, 0.9, mat('#bcd6ee')); t.position.set(-0.1, 1.0, 0); car.add(t); } S.add(car);
const min30 = label('片道30分', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,60,80,.92)', sx: 1.6 }); S.add(min30);

// ---------- E：保育園（x=210） ----------
const EX = 210;
const HOIKU = kinder(1, '#d8f0ff', '#4a8ad0'); HOIKU.position.set(EX, 0, -6); S.add(HOIKU);
const hoSign = label('ほいくえん', { w: 768, size: 120, color: '#2a6ad0', bg: 'rgba(255,255,255,.96)', sx: 2.0 }); hoSign.position.set(EX, 3.7, -4.2); S.add(hoSign);
const WMS = [0, 1, 2].map(i => { const w = makeWoman({ shirt: ['#2b3346', '#4f5a6a', '#3f3f46'][i], hair: ['#1d1a19', '#3a2620', '#1d1a19'][i] }); S.add(w); return w; });
const WKS = [0, 1, 2].map(i => { const k = kid(i + 2); S.add(k); return k; });
const komaranai = label('別に困ってない', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.92)', sx: 1.7 }); komaranai.position.set(EX, 2.8, -1); S.add(komaranai);

// ---------- 結果のラベル ----------
const komatta = label('一番困ったのは…', { w: 1024, size: 110, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.2 }); S.add(komatta);
const okane = label('嫌ってた相手のお金', { w: 1024, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.3 }); S.add(okane);
const coins = makeSparkles(160, 0.22, 0xffd27a); S.add(coins.points); coins.init([[0, 2.2, -4]], 3.5, 2.5);

function reset() {
  [HOUSEWIFE, WORKMOM, KH, KW, ...PLAY, ...WMS, ...WKS].forEach(p => { poseReset(p); p.visible = true; p.rotation.set(0, 0, 0); });
  HOUSEWIFE.position.set(-0.5, 0, 1.6); KH.position.set(0.2, 0, 1.7); WORKMOM.position.set(-0.4, 0, 2.6); KW.position.set(0.3, 0, 2.7);
  PLAY.forEach((k, i) => k.position.set(-3 + i * 1.2, 0, -3.4 + (i % 2) * 0.8));
  gate(0); led.material.color.set('#22e06a'); senyo.visible = false; kaze.visible = false; KG.visible = true; kgSign.material.opacity = 1;
  barA.scale.y = barB.scale.y = 0.001; vA.visible = vB.visible = false; DOTS.forEach(d => d.material.color.set('#cfd6de')); azukari.visible = false;
  NOTICE.visible = true; XS.forEach(l => l.visible = false); min30.visible = false; car.position.set(DX - 30, 0, -1); komaranai.visible = false;
  komatta.visible = false; okane.visible = false; coins.set(0);
  WMS.forEach((w, i) => w.position.set(EX - 2 + i * 2, 0, -1.6)); WKS.forEach((k, i) => k.position.set(EX - 1.4 + i * 2, 0, -1.4));
  hemi.intensity = 1.15; S.background.set('#9fd0f0'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function gateCam(d) { look(lerp(1.2, 0.8, d), 3.6, lerp(8.6, 9.4, d), 0, 1.6, -1.2, 52); }
function shot0(t) { // 0秒＝サムネ：働く母親の前で、門がガシャンと閉まる
  reset(); lift(0); const k = t - TP; HOUSEWIFE.position.set(-0.3, 0, -1.4); KH.position.set(0.4, 0, -1.3); HOUSEWIFE.rotation.y = Math.PI; KH.rotation.y = Math.PI;
  WORKMOM.position.set(-0.4, 0, 1.4); KW.position.set(0.3, 0, 1.5); WORKMOM.rotation.y = Math.PI; KW.rotation.y = Math.PI;
  gate(k > 0 ? 1 - easeOut(clamp(k / 0.35)) : 0.0); gate(k > 0 ? easeOut(clamp(k / 0.35)) : 0); led.material.color.set(k > 0.2 ? '#ff3a3a' : '#22e06a');
  el.flash.style.opacity = k > 0.3 && k < 0.45 ? 0.2 : 0; pop(senyo, t, TP + 0.5, 0.3, 2.4);
  gateCam(ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 幼稚園が、専業主婦の子ども専用になった
  reset(); lift(0); gate(1); led.material.color.set('#ff3a3a'); senyo.visible = true; senyo.scale.set(2.4, 2.4 * senyo.userData.ar, 1);
  HOUSEWIFE.position.set(-0.3, 0, -1.4); KH.position.set(0.4, 0, -1.3); WORKMOM.position.set(-0.4, 0, 1.4); KW.position.set(0.3, 0, 1.5); WORKMOM.rotation.y = Math.PI; KW.rotation.y = Math.PI; WORKMOM.userData.head.rotation.x = 0.3;
  gateCam(1);
  setTop('幼稚園', '専業主婦の家の子だけ', fade(t, 0.15, 3.2, 0.25), PINK);
  return S;
}
function shot2(t) { // 専業主婦は喜ぶ。これで風邪をもらってこない
  reset(); lift(0); gate(1); WORKMOM.visible = KW.visible = false; HOUSEWIFE.position.set(-0.6, 0, -1.6); KH.position.set(0.2, 0, -1.5);
  HOUSEWIFE.userData.arms.forEach(a => a.rotation.x = -2.8 + Math.sin(t * 8) * 0.2); HOUSEWIFE.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
  kaze.position.set(-0.3, 2.75, -1.4); pop(kaze, t, 0.6, 0.3, 1.9);
  look(0.2, 2.2, 4.2, -0.3, 1.8, -1.6, 52);
  return S;
}
function shot3(t) { // 幼稚園の子どもは、10年で134万人から63万人に
  reset(); lift(150); const H = 0.028, u = easeOut(clamp((t - 0.2) / 1.2)); barA.scale.y = Math.max(0.001, 134 * H * u); barB.scale.y = Math.max(0.001, 63 * H * u * clamp((t - 0.6) / 0.8));
  vA.visible = vB.visible = true; vA.position.set(BX - 1.3, barA.scale.y + 0.5, -5.4); vB.position.set(BX + 1.3, barB.scale.y + 0.5, -5.4);
  look(BX, 2.8, 4.8, BX, 2.6, -6, 52);
  setTop('幼稚園の子ども（2016→2026年）', '半分以下', fade(t, 0.15, 3.4, 0.25), RED);
  return S;
}
function shot4(t) { // しかも9割の幼稚園が、預かり保育をしている
  reset(); lift(150); DOTS.forEach((d, i) => { if (i < 9 && t > 0.4 + i * 0.18) d.material.color.set('#5ad08a'); }); pop(azukari, t, 0.2, 0.3, 1.8);
  look(BX + 30, 3.0, 10.5, BX + 30, 3.0, 0, 52);
  setTop('預かり保育をしている幼稚園', '90.9%', fade(t, 0.15, 3.4, 0.25), GREEN);
  return S;
}
function shot5(t) { // 1か月後、園の掲示板に1枚の紙が貼られる
  reset(); lift(60); const u = easeOut(clamp((t - 0.5) / 0.6)); NOTICE.position.set(CX, 2.1 + (1 - u) * 1.5, -0.84 + (1 - u) * 0.6); NOTICE.rotation.z = (1 - u) * 0.4; pin.visible = u > 0.95;
  HOUSEWIFE.position.set(CX - 0.6, 0, 1.8); HOUSEWIFE.rotation.y = Math.PI; KH.position.set(CX + 0.2, 0, 1.9); KH.rotation.y = Math.PI;
  look(CX + 0.4, 2.4, 6.4, CX, 2.0, -0.8, 52);
  return S;
}
function shot6(t) { // 園児が足りないので、来年で閉園します
  reset(); lift(60); HOUSEWIFE.position.set(CX - 0.6, 0, 1.8); HOUSEWIFE.rotation.y = Math.PI; HOUSEWIFE.userData.head.rotation.x = -0.2; KH.position.set(CX + 0.2, 0, 1.9); KH.rotation.y = Math.PI;
  const u = ease(clamp(t / 3)); look(CX, 2.1, lerp(5.0, 3.4, u), CX, 2.1, -0.8, 52);
  return S;
}
function shot7(t) { // 働く母親の家の子どもで、園は成り立っていた
  reset(); lift(0); gate(0); WORKMOM.position.set(2.6, 0, -2.4); KW.position.set(1.6, 0, -2.6); WORKMOM.rotation.y = -0.4;
  PLAY.forEach((k, i) => { k.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.15; });
  look(0.4, 3.4, 8.6, 0, 1.4, -3.4, 52);
  setTop('預かり保育の利用料も', '働く母親の家から', fade(t, 0.15, 3.4, 0.25), GOLD);
  return S;
}
function shot8(t) { // 近くの幼稚園も、次々に閉まっていく
  reset(); lift(110); XS.forEach((l, i) => pop(l, t, 0.4 + i * 0.5, 0.3, 1.3)); hemi.intensity = lerp(1.15, 0.7, clamp(t / 3)); S.background.set('#8aaecc');
  look(DX, 7.0, 7.0, DX, 1.0, -9, 52);
  return S;
}
function shot9(t) { // 専業主婦は毎朝、車で30分かけて遠くの園へ
  reset(); lift(110); car.position.set(DX - 8 + t * 4, 0, -1); min30.position.set(car.position.x, 2.2, -1); pop(min30, t, 0.8, 0.3, 1.6);
  look(car.position.x + 0.6, 3.0, 6.0, car.position.x, 0.8, -1.5, 52);
  return S;
}
function shot10(t) { // 一方、働く母親たちは保育園へ移って困っていない
  reset(); lift(150); WMS.forEach((w, i) => { w.userData.arms[1].rotation.x = -0.6 + Math.sin(t * 3 + i) * 0.4; }); WKS.forEach((k, i) => { k.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.12; });
  pop(komaranai, t, 0.8, 0.3, 1.7);
  look(EX + 0.4, 2.6, 6.6, EX, 1.6, -2.4, 52);
  return S;
}
function emptyKG() { gate(1); PLAY.forEach(k => k.visible = false); KG.children[0].material = KG.children[0].material; WORKMOM.visible = KW.visible = false; }
function shot11(t) { // 一番困ったのは、ルールを作った側だった
  reset(); lift(0); emptyKG(); hemi.intensity = 0.75; S.background.set('#7a8a9a'); HOUSEWIFE.position.set(0.0, 0, 1.6); HOUSEWIFE.rotation.y = Math.PI; KH.position.set(0.7, 0, 1.7); KH.rotation.y = Math.PI;
  HOUSEWIFE.userData.head.rotation.x = 0.4; komatta.position.set(0, 3.0, 1.6); pop(komatta, t, 0.4, 0.3, 2.0);
  look(0.4, 2.2, 5.6, 0, 1.6, 0.6, 52);
  return S;
}
function shot12(t) { // 結果：専業主婦の園は、専業主婦だけじゃ守れない
  reset(); lift(0); emptyKG(); hemi.intensity = 0.7; S.background.set('#6a7686'); kgSign.material.opacity = 0.35; HOUSEWIFE.position.set(0.0, 0, 1.4); KH.position.set(0.7, 0, 1.5);
  HOUSEWIFE.rotation.y = Math.PI; KH.rotation.y = Math.PI; HOUSEWIFE.userData.head.rotation.x = 0.3;
  const u = ease(clamp(t / 5.6)); look(lerp(0.6, 0.2, u), lerp(2.4, 4.4, u), lerp(6.0, 10.4, u), 0, 1.6, -2.4, 52);
  setTop('結果', '専業主婦だけでは無理', fade(t, 0.15, 5.4, 0.25), RED);
  return S;
}
function shot13(t) { // 嫌ってた相手のお金で、居場所が回っていたのかも
  reset(); lift(0); gate(0); WORKMOM.position.set(1.2, 0, -2.4); KW.position.set(1.9, 0, -2.6); HOUSEWIFE.position.set(-1.6, 0, -2.4); KH.position.set(-0.9, 0, -2.6); HOUSEWIFE.rotation.y = 0.6; WORKMOM.rotation.y = -0.6;
  coins.set(clamp((t - 0.4) / 3.6)); okane.position.set(0, 4.7, -3.4); pop(okane, t, 0.6, 0.35, 2.3);
  look(0, 3.0, 6.0, 0, 2.2, -3.4, 52);
  setTop('園を回していたのは', '嫌ってた相手のお金', fade(t, 0.3, 4.0, 0.25), GOLD);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（門が閉まったまま）
  reset(); lift(0); gate(1); led.material.color.set('#ff3a3a'); HOUSEWIFE.position.set(-0.3, 0, -1.4); KH.position.set(0.4, 0, -1.3); HOUSEWIFE.rotation.y = Math.PI; KH.rotation.y = Math.PI;
  WORKMOM.position.set(-0.4, 0, 1.4); KW.position.set(0.3, 0, 1.5); WORKMOM.rotation.y = Math.PI; KW.rotation.y = Math.PI; senyo.visible = true; senyo.scale.set(2.4, 2.4 * senyo.userData.ar, 1);
  gateCam(0);
  return S;
}

const SUBS = [
  [3.2, 6.6, '幼稚園が、専業主婦の<br>子ども専用になった。'],
  [6.7, 10.2, '専業主婦は喜ぶ。<br>これで風邪をもらってこない。'],
  [10.3, 13.9, '幼稚園の子どもは、10年で<br>134万人から63万人に。'],
  [14.0, 17.6, 'しかも9割の幼稚園が、<br>預かり保育をしている。'],
  [17.7, 21.3, '1か月後、園の掲示板に<br>1枚の紙が貼られる。'],
  [21.4, 25.0, '園児が足りないので、<br>来年で閉園します。'],
  [25.1, 28.8, '働く母親の家の子どもで、<br>園は成り立っていた。'],
  [28.9, 32.5, '近くの幼稚園も、<br>次々に閉まっていく。'],
  [32.6, 36.3, '専業主婦は毎朝、車で<br>30分かけて遠くの園へ。'],
  [36.4, 40.0, '一方、働く母親たちは<br>保育園へ移って困っていない。'],
  [40.1, 44.2, '一番困ったのは、<br>ルールを作った側だった。'],
  [44.3, 50.0, '結果：専業主婦の園は、<br>専業主婦だけじゃ守れない。'],
  [50.1, 55.0, '嫌ってた相手のお金で、<br>居場所が回っていたのかも。'],
  [55.1, 61.3, '専業主婦と働く母親、<br>分かり合える？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.7, f: shot1 }, { a: 6.7, b: 10.3, f: shot2 }, { a: 10.3, b: 14.0, f: shot3 },
  { a: 14.0, b: 17.7, f: shot4 }, { a: 17.7, b: 21.4, f: shot5 }, { a: 21.4, b: 25.1, f: shot6 }, { a: 25.1, b: 28.9, f: shot7 },
  { a: 28.9, b: 32.6, f: shot8 }, { a: 32.6, b: 36.4, f: shot9 }, { a: 36.4, b: 40.1, f: shot10 }, { a: 40.1, b: 44.3, f: shot11 },
  { a: 44.3, b: 50.1, f: shot12 }, { a: 50.1, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0634',
    v2: true,
    hookLine: '幼稚園が、専業主婦の子ども専用になった。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも幼稚園が専業主婦専用になったら？',
    titleHtml: 'もしも幼稚園が<br>専業主婦専用に<br>なったら？',
    mood: 'tension', seed: 634, hits: [0.5, 44.3, 50.1], risers: [40.1], impacts: [6.7, 10.3, 14.0, 21.4, 25.1, 28.9, 36.4, 44.3],
    sfx: [[0.5, 'whoosh'], [0.8, 'buzz'], [7.3, 'bubble'], [18.2, 'whoosh'], [29.3, 'buzz'], [29.8, 'buzz'], [30.3, 'buzz'], [37.2, 'bubble'], [50.6, 'whoosh']],
    narr: { '134万人': 'ひゃくさんじゅうよんまんにん', '63万人': 'ろくじゅうさんまんにん', '9割': 'きゅうわり', '結果：': '結果、', '専業主婦': 'せんぎょうしゅふ' },
    ask: '専業主婦と働く母親、分かり合える？',
    caption: 'もしも幼稚園が、専業主婦の家の子ども専用になったら？\n\n専業主婦は喜ぶ。これで風邪をもらってこない。\nでも幼稚園の子どもは、10年で134万人から63万人に。しかも9割の幼稚園が、預かり保育をしている。\n1か月後、園の掲示板に1枚の紙。園児が足りないので、来年で閉園します。\n近くの幼稚園も次々に閉まって、専業主婦は毎朝、車で30分かけて遠くの園へ。\n一方、働く母親たちは保育園へ移って、何も困っていない。\n\n結果：専業主婦の園は、専業主婦だけじゃ守れない。\n嫌ってた相手のお金で、居場所が回っていたのかもしれない。\n\n専業主婦と働く母親、分かり合える？ コメントで教えて。\n\n※風刺ネタです\n出典：文部科学省「学校基本調査」（幼稚園の在園者数 平成28年度 1,339,761人→令和8年度速報 627,450人）／文部科学省「令和5年度 幼児教育実態調査」（預かり保育の実施 90.9%）',
    hashtags: ['もしもラボ', 'もしも', '幼稚園', '専業主婦', 'ワーママ'],
    endStats: [['幼稚園の子ども', '134万→63万人', '2016→2026年'], ['預かり保育をしている園', '90.9%', '2023年度'], ['園を回していたのは', '嫌ってた相手', 'かもしれない']],
    sources: '出典：文部科学省「学校基本調査」「幼児教育実態調査」',
  },
});
