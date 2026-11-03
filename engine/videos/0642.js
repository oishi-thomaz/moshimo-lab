import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';

// もしもパパ活のお手当に税金がかかったら？（皮肉回・台本 S20・図星）
// 2026/11/03 ゆうと承認。元ネタ：Togetter・なんJで燃える パパ活の手渡しは税金がかからない？ の話
// お金と税金の話として描く（性的な描写・未成年を思わせる描写は入れない。登場するのは大人だけ、場所は昼の喫茶店）
// 数字（裏取り済み）：
//  暦年課税の贈与税：1年間にもらった財産の合計から基礎控除 110万円を引き、残り200万円以下は10%（国税庁 タックスアンサー No.4408）
//   https://www.nta.go.jp/taxes/shiraberu/taxanswer/zoyo/4408.htm
//  贈与税の申告書 第一表には、贈与者の住所・氏名・フリガナを書く欄がある（国税庁 贈与税の申告の手引き 令和7年分）
//   https://www.nta.go.jp/taxes/tetsuzuki/shinsei/shinkoku/zoyo/tebiki2025/pdf/009.pdf
//  月10万円×12か月＝120万円は単純計算（110万円を10万円超える。税額は (120−110)×10%＝1万円）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', PINK = '#ff7ab8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff4e6, 0x4a4040, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); }
function sit(p, y = -0.36) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = y; }
function envelope(sc = 1) { const g = new THREE.Group(); const b = box(0.62, 0.03, 0.36, mat('#f6f2e6')); g.add(b); const f = box(0.62, 0.032, 0.12, mat('#e8e0cc')); f.position.set(0, 0.002, -0.12); g.add(f); g.scale.setScalar(sc); return g; }

// ---------- A：昼の喫茶店（原点） ----------
const cfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#a07a56', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(0, 0.01, -1); cfloor.renderOrder = -0.8; S.add(cfloor);
const cwall = box(14, 3.6, 0.2, mat('#efe2cc')); cwall.position.set(0, 1.8, -4.4); S.add(cwall);
const cwin = box(5.0, 1.6, 0.05, mat('#bfe4ff')); cwin.position.set(-1.6, 2.0, -4.28); S.add(cwin);
const cafeSign = label('喫茶もしも', { w: 768, size: 110, color: '#6a3a1a', bg: 'rgba(255,248,230,.96)', sx: 1.6 }); cafeSign.position.set(2.6, 2.9, -4.2); S.add(cafeSign);
function table(x, z) { const g = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28), mat('#6a4a32')); top.position.y = 0.74; g.add(top); const leg = box(0.08, 0.72, 0.08, mat('#3a2a20')); leg.position.y = 0.36; g.add(leg); g.position.set(x, 0, z); S.add(g); return g; }
function chair(x, z, ry) { const g = new THREE.Group(); const seat = box(0.46, 0.06, 0.46, mat('#4a3a2e')); seat.position.y = 0.46; g.add(seat); const back = box(0.46, 0.5, 0.06, mat('#4a3a2e')); back.position.set(0, 0.74, -0.22); g.add(back); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); return g; }
const TBL = table(0, -1.2);
const CH = [chair(-0.78, -1.78, 0.9), chair(0.78, -1.78, -0.9)];
const OJI = makeOji(rng(5), { shirt: '#59606e', bald: true }); S.add(OJI);
const GIRL = makeWoman({ shirt: '#e8d0e0', hair: '#4a3020', pants: '#3a3f55' }); S.add(GIRL);
const ENV = envelope(1.0); S.add(ENV);
const otelab = label('お手当', { w: 512, size: 110, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.9 }); S.add(otelab);
const HK = makeHanko(); HK.scale.setScalar(0.62); S.add(HK);
const KAZEI = makeMark('課税', { sub: '税務署', sx: 0.95 }); S.add(KAZEI);
const coffee = [[-0.3, -1.0], [0.3, -1.4]].map(([x, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat('#ffffff')); c.position.set(x, 0.83, z); S.add(c); return c; });
// 真面目に働く人たち
const WORKERS = [0, 1, 2, 3].map(i => { const p = (i % 2 ? makeWoman : makeMan)({ shirt: ['#ffffff', '#c8d8f0', '#e9e4da', '#f0d8c8'][i], hair: '#2a2220' }); if (!(i % 2)) { const tie = box(0.08, 0.38, 0.02, mat('#2f4a7a')); tie.position.set(0, 1.24, 0.15); p.add(tie); } S.add(p); return p; });
const naze = label('なぜ税金がない', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 1.7 }); S.add(naze);
const SLIP = makeDoc({ title: '給与明細', rows: ['所得税', '住民税', '社会保険'], head: '#3f7fd0', w: 1.3, h: 1.4 }); S.add(SLIP);
const kyuryo = label('給料からは天引き', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,90,150,.95)', sx: 1.9 }); S.add(kyuryo);

// ---------- B：税務署（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), mat('#b8b2a6', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -1); bfloor.renderOrder = -0.8; S.add(bfloor);
const office = box(7, 4.2, 3, mat('#d8d2c4')); office.position.set(BX, 2.1, -5.2); S.add(office);
for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const w = box(0.8, 0.7, 0.05, mat('#7fa8c8')); w.position.set(BX - 2.6 + i * 1.04, 1.6 + j * 1.3, -3.68); S.add(w); }
const zSign = label('もしも税務署', { w: 1024, size: 120, color: '#fff', bg: 'rgba(50,70,110,.96)', sx: 2.4 }); zSign.position.set(BX, 4.0, -3.4); S.add(zSign);
const TODOKE = makeDoc({ title: 'お手当の届出', rows: ['もらった人', '金額', '渡した人'], head: '#c8242c', w: 1.2, h: 1.5 }); S.add(TODOKE);
const GIRL2 = makeWoman({ shirt: '#e8d0e0', hair: '#4a3020', pants: '#3a3f55' }); S.add(GIRL2);

// ---------- C：110万円の線（x=110） ----------
const CX = 110;
const cfl = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); cfl.rotation.x = -Math.PI / 2; cfl.position.set(CX, 0.02, -1); cfl.renderOrder = -0.8; S.add(cfl);
const COINS = []; for (let i = 0; i < 12; i++) { const c = box(0.9, 0.24, 0.6, mat(i < 11 ? '#e8d8a0' : '#ff8a6a')); c.position.set(CX, 0.12 + i * 0.26, -1); S.add(c); COINS.push(c); }
const line110 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.06), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, depthTest: false })); line110.renderOrder = 6; line110.position.set(CX, 0.12 + 10.5 * 0.26 + 0.13, -0.6); S.add(line110);
const lb110 = label('110万円', { w: 512, size: 110, color: '#ff6a6a', stroke: 12, strokeColor: '#1a1a22', sx: 1.0 }); lb110.position.set(CX + 1.35, line110.position.y + 0.25, -0.6); S.add(lb110);
const lbMonth = label('1か月 10万円', { w: 768, size: 100, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.3 }); lbMonth.position.set(CX - 1.4, 0.4, -0.5); S.add(lbMonth);
const lb120 = label('1年で120万円', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.6 }); S.add(lb120);
const zoyo = label('贈与税', { w: 512, size: 120, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 1.1 }); S.add(zoyo);

// ---------- D：おぢの名前が並ぶ（x=160） ----------
const DX = 160;
const dfl = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat('#3a3448', { depthWrite: false })); dfl.rotation.x = -Math.PI / 2; dfl.position.set(DX, 0.02, -1); dfl.renderOrder = -0.8; S.add(dfl);
const SHINKOKU = makeDoc({ title: '贈与税の申告書', rows: ['もらった人', '金額', '渡した人の住所', '渡した人の名前'], head: '#3a5a8a', w: 1.6, h: 2.0 }); S.add(SHINKOKU);
const nameHL = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.3), new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.45, depthTest: false })); nameHL.renderOrder = 6; S.add(nameHL);
const DOCS = []; for (let i = 0; i < 12; i++) { const d = makeDoc({ title: '贈与税の申告書', rows: ['渡した人の名前'], head: '#3a5a8a', w: 0.9, h: 0.7 }); d.userData.fill(0, '●● ●●'); d.position.set(DX - 2.1 + (i % 4) * 1.4, 0.9 + Math.floor(i / 4) * 0.9, -2); S.add(d); DOCS.push(d); }
const zurari = label('渡した人の名前', { w: 768, size: 110, color: '#fff', bg: 'rgba(58,90,138,.95)', sx: 1.7 }); S.add(zurari);

// ---------- E：おぢたちが消える（x=210） ----------
const EX = 210;
const efl = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat('#a07a56', { depthWrite: false })); efl.rotation.x = -Math.PI / 2; efl.position.set(EX, 0.02, -1); efl.renderOrder = -0.8; S.add(efl);
const ewall = box(16, 3.6, 0.2, mat('#efe2cc')); ewall.position.set(EX, 1.8, -4.4); S.add(ewall);
const OJIS = [0, 1, 2, 3, 4].map(i => { const o = makeOji(rng(40 + i)); o.position.set(EX - 2.0 + i * 1.0, 0, -1.6 + (i % 2) * 0.5); S.add(o); return o; });
const FAMS = OJIS.map(() => { const l = label('家族にバレる', { w: 768, size: 96, color: '#fff', bg: 'rgba(90,90,110,.92)', sx: 1.05 }); S.add(l); return l; });
const poofs = OJIS.map((o) => { const p = makeSparkles(70, 0.14, 0xfff2c0); S.add(p.points); p.init([[o.position.x, 1.2, o.position.z]], 0.7, 1.2); return p; });
const shitagokoro = label('下心', { w: 512, size: 140, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 1.0 }); S.add(shitagokoro);
const kakurete = label('隠れて渡せる', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(kakurete);
const nego = label('値上げ交渉', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,90,140,.95)', sx: 1.5 }); S.add(nego);
const batsu = label('×', { w: 256, h: 256, size: 240, color: '#ff3b3b', sx: 0.9 }); S.add(batsu);
const negiru = label('これで値切れる', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.95)', sx: 1.6 }); S.add(negiru);

const PEOPLE = [OJI, GIRL, GIRL2, ...WORKERS, ...OJIS];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  OJI.position.set(0.72, 0, -1.72); OJI.rotation.y = -0.9; sit(OJI); OJI.userData.arms.forEach(a => a.rotation.x = -0.9);
  GIRL.position.set(-0.72, 0, -1.72); GIRL.rotation.y = 0.9; sit(GIRL); GIRL.userData.arms.forEach(a => a.rotation.x = -0.8);
  ENV.visible = true; ENV.position.set(0, 0.79, -0.95); ENV.rotation.set(0, 0, 0); otelab.visible = false; HK.visible = false; KAZEI.visible = false; TBL.visible = true; CH.forEach(c => c.visible = true); coffee.forEach(c => c.visible = true);
  WORKERS.forEach(w => w.visible = false); naze.visible = false; SLIP.visible = false; kyuryo.visible = false;
  TODOKE.visible = false; GIRL2.visible = false; COINS.forEach(c => c.visible = false); lb120.visible = zoyo.visible = false; line110.visible = lb110.visible = lbMonth.visible = false;
  SHINKOKU.visible = false; nameHL.visible = false; DOCS.forEach(d => d.visible = false); zurari.visible = false;
  FAMS.forEach(f => f.visible = false); poofs.forEach(p => p.set(0)); shitagokoro.visible = kakurete.visible = false; nego.visible = batsu.visible = negiru.visible = false;
  cafeSign.visible = true; hemi.intensity = 1.2; S.background.set('#2a2e3a'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.45;
function tableCam(d = 0) { look(lerp(0.2, 0.1, d), 2.1, lerp(2.4, 2.1, d), 0, 1.25, -1.4, 50); }
function stampEnv(t, t0) { // 封筒に税務署のハンコ
  const hit = hankoSlam(HK, [0, 0.82, -0.95], t, t0, { from: 0.32, up: 0.7, dur: 0.18 }); HK.visible = t < t0 + 0.9;
  if (hit) { KAZEI.visible = true; KAZEI.position.set(0, 1.36, -0.85); KAZEI.userData.size(0.6 * (t - t0 < 0.2 ? 1.35 - (t - t0) * 1.75 : 1)); }
  return hit;
}
function shot0(t) { // 0秒＝サムネ：お手当の封筒に、税務署の赤いハンコがドン
  reset(); lift(0); otelab.position.set(-0.05, 0.98, -0.75); otelab.visible = t < TP; otelab.userData.size(0.5);
  OJI.userData.arms[1].rotation.x = -1.2; const hit = stampEnv(t, TP);
  if (hit) { OJI.userData.head.rotation.x = -0.15; GIRL.userData.head.rotation.x = -0.15; }
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  tableCam(ease(clamp(t / 2.8)));
  return S;
}
function workCam() { look(0.2, 2.2, 3.6, 0, 1.5, -1.0, 52); }
function shot1(t) { // 真面目に働く人たちの不満から
  reset(); lift(60); TBL.visible = false; CH.forEach(c => c.visible = false); OJI.visible = GIRL.visible = ENV.visible = false; coffee.forEach(c => c.visible = false);
  WORKERS.forEach((w, i) => { w.visible = true; w.position.set(-1.8 + i * 1.2, 0, -1.2 + (i % 2) * 0.3); w.userData.arms[0].rotation.set(-1.2, 0, 0.6); w.userData.arms[1].rotation.set(-1.2, 0, -0.6); w.userData.head.rotation.z = Math.sin(t * 2 + i) * 0.06; });
  SLIP.visible = true; SLIP.position.set(0, 2.55, -1.6); kyuryo.position.set(0, 1.65, -1.2); pop(kyuryo, t, 0.9, 0.3, 1.6);
  workCam();
  return S;
}
function shot2(t) { // 手渡しの現金だけ、なぜ税金がない
  reset(); lift(0); OJI.userData.arms[1].rotation.x = -1.3; const u = easeOut(clamp((t - 0.3) / 0.8)); ENV.position.set(lerp(0.4, -0.3, u), 0.79 + Math.sin(u * Math.PI) * 0.15, -1.2);
  naze.position.set(0, 2.25, -1.7); pop(naze, t, 1.1, 0.3, 1.1);
  tableCam(0.6);
  return S;
}
function shot3(t) { // ある日、パパ活のお手当は
  reset(); lift(0); otelab.visible = true; otelab.position.set(-0.05, 1.22, -0.75); otelab.userData.size(0.45);
  look(0.1, 1.75, 0.8, 0, 1.0, -1.2, 48);
  return S;
}
function shot4(t) { // 全部、税務署に届けることになった
  reset(); lift(110); TBL.visible = false; CH.forEach(c => c.visible = false); OJI.visible = GIRL.visible = ENV.visible = false; coffee.forEach(c => c.visible = false);
  GIRL2.visible = true; GIRL2.position.set(BX + 0.6, 0, -1.4); GIRL2.rotation.y = Math.PI; TODOKE.visible = true; TODOKE.position.set(BX - 0.5, 1.75, -1.0); TODOKE.rotation.y = 0.15;
  const u = ease(clamp(t / 2.8)); look(BX + lerp(0.6, 0.2, u), lerp(2.0, 2.8, u), lerp(3.4, 6.4, u), BX, lerp(1.6, 2.4, u), -2.6, 52);
  return S;
}
function stack(t, n, k) { COINS.forEach((c, i) => { c.visible = i < n; if (i === n - 1 && k < 1) c.position.y = 0.12 + i * 0.26 + (1 - easeOut(k)) * 1.5; else c.position.y = 0.12 + i * 0.26; }); }
function coinCam() { look(CX + 0.6, 2.6, 6.8, CX, 2.0, -1, 52); }
function shot5(t) { // 人からもらったお金は、1年で110万円を超えると
  reset(); lift(150); line110.visible = lb110.visible = t > 0.5; const n = Math.min(11, 1 + Math.floor(t * 4)); stack(t, n, (t * 4) % 1);
  coinCam();
  setTop('もらったお金の基礎控除（1年）', '110万円', fade(t, 0.15, 4.4, 0.25), GOLD);
  return S;
}
function shot6(t) { // 贈与税がかかる
  reset(); lift(150); line110.visible = lb110.visible = true; stack(t, 11, 1); zoyo.position.set(CX, 3.9, -0.6); pop(zoyo, t, 0.3, 0.3, 1.1);
  coinCam();
  setTop('110万円を超えた分に', '贈与税（10%〜）', fade(t, 0.15, 2.8, 0.25), RED);
  return S;
}
function shot7(t) { // 月10万円のお手当なら、1年で120万円。ちょうど超える
  reset(); lift(150); line110.visible = lb110.visible = true; const n = Math.min(12, 1 + Math.floor(t * 4.2)); stack(t, n, (t * 4.2) % 1);
  lb120.position.set(CX, 0.12 + n * 0.26 + 0.55, -0.6); lb120.visible = n >= 12; lb120.userData.size(1.4);
  el.flash.style.opacity = n >= 12 && t < 3.0 ? 0 : 0;
  coinCam();
  setTop('月10万円×12か月（単純計算）', '120万円', fade(t, 0.15, 4.0, 0.25), PINK);
  return S;
}
function shot8(t) { // パパ活女子は、お手当の値上げ交渉をやめる
  reset(); lift(0); GIRL.userData.head.rotation.x = 0.2; GIRL.userData.arms[0].rotation.x = -1.4;
  nego.position.set(-0.72, 2.15, -1.72); pop(nego, t, 0.3, 0.3, 0.9); batsu.position.set(-0.72, 2.15, -1.6); pop(batsu, t, 1.4, 0.2, 0.5);
  look(-0.1, 1.75, 0.6, -0.72, 1.45, -1.72, 50);
  return S;
}
function shot9(t) { // おぢは喜ぶ。これで値切れる
  reset(); lift(0); OJI.userData.arms.forEach(a => a.rotation.x = -2.6 + Math.sin(t * 8) * 0.2); OJI.position.y = -0.36 + Math.abs(Math.sin(t * 5)) * 0.06;
  cafeSign.visible = false; negiru.position.set(0.72, 2.2, -1.72); pop(negiru, t, 0.4, 0.3, 1.0);
  look(0.1, 1.75, 0.6, 0.72, 1.45, -1.72, 50);
  return S;
}
function docCam() { look(DX - 0.25, 2.0, 3.2, DX - 0.3, 1.8, -1.6, 50); }
function shot10(t) { // ところが届け出の紙には、渡した人の名前を書く欄がある
  reset(); lift(60); TBL.visible = false; OJI.visible = GIRL.visible = ENV.visible = false;
  SHINKOKU.visible = true; SHINKOKU.position.set(DX, 2.3, -1.6);
  nameHL.visible = t > 1.4 && Math.floor(t * 3) % 2 === 0 || t > 2.6; nameHL.position.set(DX + 0.05, 1.58, -1.55);
  docCam();
  return S;
}
function shot11(t) { // おぢの名前が、税務署の書類にずらりと並ぶ
  reset(); lift(250); DOCS.forEach((d, i) => { d.visible = t > 0.2 + i * 0.2; });
  zurari.position.set(DX, 3.05, -1.9); pop(zurari, t, 0.3, 0.3, 1.5);
  look(DX, 1.95, 4.2, DX, 1.8, -2, 52);
  return S;
}
function shot12(t) { // 家族にバレるのが怖くて、おぢたちが一斉に姿を消す
  reset(); lift(60); TBL.visible = false; OJI.visible = GIRL.visible = ENV.visible = false;
  OJIS.forEach((o, i) => { const t0 = 1.6 + i * 0.25; o.userData.head.rotation.x = 0.3; o.userData.arms.forEach(a => a.rotation.x = -0.3); FAMS[i].position.set(o.position.x, 2.45 + (i % 2) * 0.35, o.position.z); pop(FAMS[i], t, 0.3 + i * 0.12, 0.25, 1.05); if (t > t0) { o.visible = false; FAMS[i].visible = false; poofs[i].set(clamp((t - t0) / 1.2)); } });
  look(EX, 2.3, 5.6, EX, 1.5, -1.4, 52);
  return S;
}
function shot13(t) { // 結果：お手当に税金がついて、消えたのはおぢの下心だった
  reset(); lift(0); S.background.set('#22242e'); hemi.intensity = 0.9; OJI.visible = false; KAZEI.visible = false; KAZEI.position.set(0, 1.36, -0.85); KAZEI.userData.size(0.6);
  GIRL.userData.head.rotation.y = 0.5; shitagokoro.position.set(0.72, 1.6, -1.72); pop(shitagokoro, t, 0.6, 0.3, 0.75); shitagokoro.material.opacity = 1 - clamp((t - 2.8) / 1.2);
  const u = ease(clamp(t / 5.8)); look(lerp(0.1, 0.3, u), lerp(2.05, 2.7, u), lerp(1.6, 3.6, u), 0, 1.2, -1.4, 50);
  setTop('結果', '消えたのはおぢの下心', fade(t, 0.15, 5.6, 0.25), RED);
  return S;
}
function shot14(t) { // パパ活の本当の値打ちは、隠れて渡せることだったのかもしれない
  reset(); lift(0); hemi.intensity = lerp(1.2, 0.6, clamp(t / 2)); S.background.set('#1a1c26'); OJI.userData.arms[1].rotation.x = -1.3; ENV.position.set(0.25, 0.79, -1.1);
  kakurete.position.set(0, 2.25, -1.9); pop(kakurete, t, 1.0, 0.3, 1.0);
  tableCam(0.5);
  return S;
}
function shot15(t) { // 質問。最後は冒頭と同じ構図（封筒に課税のハンコ）
  reset(); lift(0); KAZEI.visible = true; KAZEI.position.set(0, 1.36, -0.85); KAZEI.userData.size(0.6); OJI.userData.arms[1].rotation.x = -1.2; OJI.userData.head.rotation.x = -0.15; GIRL.userData.head.rotation.x = -0.15;
  tableCam(0);
  return S;
}

const SUBS = [
  [2.9, 5.7, '真面目に働く人たちの<br>不満から。'],
  [5.8, 9.2, '手渡しの現金だけ、<br>なぜ税金がない。'],
  [9.3, 11.4, 'ある日、パパ活のお手当は'],
  [11.5, 14.9, '全部、税務署に<br>届けることになった。'],
  [15.0, 18.9, '人からもらったお金は、<br>1年で110万円を超えると'],
  [19.0, 20.7, '贈与税がかかる。'],
  [20.8, 26.5, '月10万円のお手当なら、1年で<br>120万円。ちょうど超える。'],
  [26.6, 30.6, 'パパ活女子は、<br>お手当の値上げ交渉をやめる。'],
  [30.7, 33.4, 'おぢは喜ぶ。<br>これで値切れる。'],
  [33.5, 38.0, 'ところが届け出の紙には、<br>渡した人の名前を書く欄がある。'],
  [38.1, 42.1, 'おぢの名前が、<br>税務署の書類にずらりと並ぶ。'],
  [42.2, 46.4, '家族にバレるのが怖くて、<br>おぢたちが一斉に姿を消す。'],
  [46.5, 52.6, '結果：お手当に税金がついて、<br>消えたのはおぢの下心だった。'],
  [52.7, 55.1, 'パパ活の本当の値打ちは、'],
  [55.2, 57.9, '隠れて渡せることだった<br>のかもしれない。'],
  [58.0, 61.9, 'パパ活、<br>アリ？ナシ？'],
];
const shots = [
  { a: 0.0, b: 2.9, f: shot0 }, { a: 2.9, b: 5.8, f: shot1 }, { a: 5.8, b: 9.3, f: shot2 }, { a: 9.3, b: 11.5, f: shot3 }, { a: 11.5, b: 15.0, f: shot4 },
  { a: 15.0, b: 19.0, f: shot5 }, { a: 19.0, b: 20.8, f: shot6 }, { a: 20.8, b: 26.6, f: shot7 }, { a: 26.6, b: 30.7, f: shot8 },
  { a: 30.7, b: 33.5, f: shot9 }, { a: 33.5, b: 38.1, f: shot10 }, { a: 38.1, b: 42.2, f: shot11 }, { a: 42.2, b: 46.5, f: shot12 },
  { a: 46.5, b: 52.7, f: shot13 }, { a: 52.7, b: 58.0, f: shot14 }, { a: 58.0, b: 62.2, f: shot15 }, { a: 62.2, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0642',
    v2: true,
    hookLine: 'お手当の封筒に、税務署のハンコがドン。',
    series: '図星',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしもパパ活のお手当に税金がかかったら？',
    titleHtml: 'もしもパパ活の<br>お手当に税金が<br>かかったら？',
    mood: 'mystery', seed: 642, hits: [0.45, 46.5, 52.7], risers: [42.2], impacts: [11.5, 15.0, 19.0, 23.4, 33.5, 38.1, 46.5],
    sfx: [[0.45, 'poof'], [6.2, 'whoosh'], [11.8, 'whoosh'], [21.8, 'meter', 0.4], [28.0, 'poof'], [34.9, 'alarm'], [38.4, 'whoosh'], [43.8, 'poof'], [44.1, 'poof'], [44.4, 'poof'], [53.7, 'whoosh']],
    narr: { 'パパ活': 'パパかつ', 'お手当': 'おてあて', '110万円': 'ひゃくじゅうまんえん', '120万円': 'ひゃくにじゅうまんえん', '月10万円': 'つきじゅうまんえん', '1年': 'いちねん', '贈与税': 'ぞうよぜい', '下心': 'したごころ', '値切れる': 'ねぎれる', '結果：': '結果、', '欄': 'らん' },
    ask: 'パパ活、アリ？ナシ？',
    caption: 'もしもパパ活のお手当に、税金がかかったら？\n\n真面目に働く人たちの不満から。手渡しの現金だけ、なぜ税金がない。\nある日、パパ活のお手当は全部、税務署に届けることになった。\n人からもらったお金は、1年で110万円を超えると贈与税がかかる。月10万円のお手当なら、1年で120万円（単純計算）。ちょうど超える。\nパパ活女子は値上げ交渉をやめる。おぢは喜ぶ。これで値切れる。\nところが届け出の紙には、渡した人の名前を書く欄がある。おぢの名前が、税務署の書類にずらりと並ぶ。\n家族にバレるのが怖くて、おぢたちが一斉に姿を消す。\n\n結果：お手当に税金がついて、消えたのはおぢの下心だった。\nパパ活の本当の値打ちは、隠れて渡せることだったのかもしれない。\n\nパパ活、アリ？ナシ？ コメントで教えて。\n\n※風刺ネタです。お金と税金の話で、パパ活をすすめるものではありません\n出典：国税庁 タックスアンサー No.4408「贈与税の計算と税率（暦年課税）」（基礎控除 年110万円）／国税庁「贈与税の申告の手引き」（申告書に贈与者の住所・氏名を書く欄）',
    hashtags: ['もしもラボ', 'もしも', 'パパ活', '贈与税', '税金'],
    endStats: [['贈与税の基礎控除', '年110万円', '国税庁 No.4408'], ['月10万円×12か月', '120万円', '単純計算'], ['申告書の欄', '渡した人の名前', '国税庁 申告の手引き']],
    sources: '出典：国税庁 タックスアンサー No.4408／贈与税の申告の手引き',
  },
});
