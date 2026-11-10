import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも毎日水を2リットル飲むのを1か月続けたら？（台本 S58・人体の限界）
// 2026/11/10 ゆうと 直してOK：水2Lは美容・ダイエットにも良いと言われている。そのエビデンスを動画に（美容とダイエットそれぞれ）
// 数字（一次資料で確認済み 2026/11/10）：
//  ・水の出入り：健康のため水を飲もう推進委員会のリーフレット（環境省「健康のため水を飲もう」推進運動のページに掲載）。成人男子が比較的安静のとき
//    1日の出入り2.5L（尿・便1.6L、呼吸や汗0.9L）、入る側 食事1.0L・体内でつくられる水0.3L・飲み水1.2L。水分補給は早めに こまめに
//  ・美容：Palma L ほか. Clin Cosmet Investig Dermatol 2015;8:413-421（PubMed 26345226）健康な女性49人（22〜34歳）が1日約2Lを30日足す →
//    肌の表面と奥のうるおい（水分量）が上がった。ふだんの水が少ない組ほど大きい。小さな研究
//  ・ダイエット：Dennis EA ほか. Obesity 2010;18(2):300-307（PubMed 19661958）55〜75歳の48人、食事を減らすダイエット中に毎食前500mlの水を12週間 →
//    水の組は体重の減りが約2kg多い（44%多い）
//  病気の人の水分制限など医療の話には踏み込まない。2リットルが体に悪いとは言わない

const GOLD = '#ffd27a', BLUE = '#7fd4ff', GREEN = '#9be86a', PINK = '#ff9ec7';
const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const WATER = new THREE.MeshLambertMaterial({ color: '#6ab8f0', transparent: true, opacity: 0.75 });
function makeBottle(s = 1) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.62, 18), new THREE.MeshLambertMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.45 })); body.position.y = 0.31; g.add(body); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 18), WATER); w.position.y = 0.26; g.add(w); const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.12, 14), new THREE.MeshLambertMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.5 })); nk.position.y = 0.68; g.add(nk); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 14), mat('#2a6ad8')); cap.position.y = 0.77; g.add(cap); const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.163, 0.163, 0.16, 18, 1, true), mat('#2a6ad8')); lb.position.y = 0.36; g.add(lb); g.scale.setScalar(s); g.userData.water = w; return g; }
function makeFlask() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.4, 14), mat('#e05a8a')); b.position.y = 0.2; g.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), mat('#f4f4f2')); c.position.y = 0.43; g.add(c); return g; }

// ---------- A：オフィス（原点）：机に2リットル ----------
flat(14, 10, '#8a8a90', 0, 0);
const aWall = box(14, 3.2, 0.2, mat('#e6e2da')); aWall.position.set(0, 1.6, -3.0); S.add(aWall);
const ISL = makeDeskIsland(3); ISL.position.set(0, 0, -0.8); S.add(ISL);
const BOTTLE = makeBottle(1.6); S.add(BOTTLE);
const ME = makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }); S.add(ME);
const OTAKU = makeSuit({ glasses: true, jacket: '#4a5a4a', tie: '#3a8a5a' }); S.add(OTAKU); const FLASK = makeFlask(); S.add(FLASK);
const don = label('ドン', { w: 400, size: 130, color: '#fff', bg: 'rgba(42,106,216,.98)', sx: 0.75 }); S.add(don);
const twoL = label('2リットル', { w: 640, size: 110, color: '#fff', bg: 'rgba(42,106,216,.98)', sx: 1.2 }); S.add(twoL);
const karada = label('体にいいらしい', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.6 }); S.add(karada);
const sparkA = makeSparkles(80, 0.14, 0xbfe6ff); S.add(sparkA.points); sparkA.init([[0, 1.3, -0.4]], 0.6, 0.8);

// ---------- B：トイレの前の廊下（x=60） ----------
const BX = 60;
flat(14, 8, '#c8c4bc', BX, 0);
const bWall = box(14, 3.2, 0.2, mat('#e6e2da')); bWall.position.set(BX, 1.6, -2.2); S.add(bWall);
const tDoor = box(1.0, 2.1, 0.08, mat('#7aa0c8')); tDoor.position.set(BX + 3, 1.05, -2.08); S.add(tDoor);
const tSign = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.9 }); tSign.position.set(BX + 3, 2.5, -1.9); S.add(tSign);
const B_ME = makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }); S.add(B_ME);
const count = label('3回目', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.95 }); S.add(count);
const clockB = label('11:30', { w: 512, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.95 }); clockB.position.set(BX - 2.5, 2.5, -2.0); S.add(clockB);

// ---------- C：会議室（x=120） ----------
const CX = 120;
const MR = makeMeetingRoom(); MR.position.set(CX, 0, 0); S.add(MR);
const MEN = [0, 1, 2, 3].map(i => { const p = makeSuit({ jacket: ['#3a3f4e', '#4a4f60', '#56504a', '#2a2e38'][i], old: i === 0, bald: i === 0 }); S.add(p); return p; });
const C_ME = makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }); S.add(C_ME);
const sotto = label('そっと…', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.95 }); S.add(sotto);
// トイレに一番近い席（オフィスの島の端。x=180）
const DX = 180;
flat(14, 10, '#8a8a90', DX, 0);
const dWall = box(14, 3.2, 0.2, mat('#e6e2da')); dWall.position.set(DX, 1.6, -3.0); S.add(dWall);
const ISL2 = makeDeskIsland(3); ISL2.position.set(DX - 1.0, 0, -0.8); S.add(ISL2);
const tDoor2 = box(1.0, 2.1, 0.08, mat('#7aa0c8')); tDoor2.position.set(DX + 3.4, 1.05, -2.88); S.add(tDoor2);
const tSign2 = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.9 }); tSign2.position.set(DX + 3.4, 2.5, -2.7); S.add(tSign2);
const D_ME = makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }); S.add(D_ME);
const chikai = label('トイレに一番近い席', { w: 1024, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(chikai);
const clockD = label('8:30', { w: 512, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.95 }); clockD.position.set(DX - 2.6, 2.5, -2.8); S.add(clockD);

// ---------- E：水の出入り（x=240）：人の形と、出る水・入る水のタンク ----------
const EX = 240;
flat(20, 14, '#2a3448', EX, -2, -0.8);
const eWall = box(20, 8, 0.2, mat('#24304a')); eWall.position.set(EX, 4, -4); S.add(eWall);
function tank(x, color) { const g = new THREE.Group(); const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.2), new THREE.MeshLambertMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.18, depthWrite: false })); glass.position.y = 1.5; g.add(glass); const fill = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), new THREE.MeshLambertMaterial({ color })); g.add(fill); g.position.set(x, 0, -1.5); S.add(g); g.userData.set = (lit) => { const h = Math.max(0.001, 3.0 * lit / 2.5); fill.scale.y = h; fill.position.y = h / 2; }; return g; }
const T_OUT = tank(EX - 1.2, '#4a9ae8'); const T_FOOD = tank(EX + 0.5, '#e8a84a'), T_BODY = tank(EX + 0.5, '#a86ae8'), T_DRINK = tank(EX + 0.5, '#4ae0c8');
const outLab = label('出ていく 2.5L', { w: 768, size: 96, color: '#fff', bg: 'rgba(74,154,232,.96)', sx: 1.4 }); outLab.position.set(EX - 1.2, 3.6, -1.5); S.add(outLab);
const inLab = label('入ってくる', { w: 640, size: 96, color: '#fff', bg: 'rgba(90,96,112,.96)', sx: 1.2 }); inLab.position.set(EX + 0.5, 3.6, -1.5); S.add(inLab);
const fLab = label('食事 1.0L', { w: 512, size: 90, color: '#2a1a00', bg: 'rgba(232,168,74,.97)', sx: 0.95 }); S.add(fLab);
const bLab = label('体内 0.3L', { w: 512, size: 90, color: '#fff', bg: 'rgba(168,106,232,.97)', sx: 0.95 }); S.add(bLab);
const dLab = label('飲み水 1.2L', { w: 600, size: 90, color: '#1a2a2a', bg: 'rgba(74,224,200,.97)', sx: 1.1 }); S.add(dLab);
function setIn(food, body, drink) { T_FOOD.userData.set(food); T_BODY.userData.set(body); T_DRINK.userData.set(drink);
  const hf = 3.0 * food / 2.5, hb = 3.0 * body / 2.5, hd = 3.0 * drink / 2.5; T_BODY.position.y = hf; T_DRINK.position.y = hf + hb;
  T_FOOD.visible = food > 0.001; T_BODY.visible = body > 0.001; T_DRINK.visible = drink > 0.001;
  fLab.visible = food > 0.5; fLab.position.set(EX + 1.65, hf / 2, -1.2); bLab.visible = body > 0.2; bLab.position.set(EX + 1.65, hf + hb / 2 + 0.15, -1.2); dLab.visible = drink > 0.5; dLab.position.set(EX + 1.7, hf + hb + hd / 2 + 0.25, -1.2); }
const BIGB = makeBottle(4.2); BIGB.position.set(EX - 3.6, 0, -1.2); S.add(BIGB);
const twoL2 = label('2L', { w: 400, size: 130, color: '#fff', bg: 'rgba(42,106,216,.98)', sx: 0.7 }); twoL2.position.set(EX - 3.6, 3.9, -1.2); S.add(twoL2);
const muda = label('ムダ？', { w: 400, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.85 }); S.add(muda);

// ---------- F：美容（x=300）：女性49人・30日・肌のうるおい ----------
const FX = 300;
flat(30, 20, '#e8dcd0', FX, -4);
const fWall = box(30, 6, 0.2, mat('#f4e8ee')); fWall.position.set(FX, 3, -9); S.add(fWall);
const WOMEN = []; { const r = rng(49); for (let i = 0; i < 49; i++) { const p = makeWoman({ shirt: ['#f29bbb', '#e9e4da', '#9fc7a8', '#c9a8d8', '#f2c14e', '#8fd0f0', '#e98a7a'][i % 7], hair: ['#3a2620', '#6b4a33', '#2a2020', '#8a5a3a'][i % 4] }); p.position.set(FX - 6 + (i % 7) * 2, 0, -1 - Math.floor(i / 7) * 1.1); p.rotation.y = (r() - 0.5) * 0.4; S.add(p); WOMEN.push(p); const b = makeBottle(0.8); b.position.set(0.32, 0.55, 0.1); p.add(b); } }
const HERO_W = WOMEN[3];
const glow = makeSparkles(160, 0.12, 0xfff0f6); S.add(glow.points); glow.init([[HERO_W.position.x, 1.75, HERO_W.position.z + 0.2]], 0.5, 0.5);
const days30 = label('30日', { w: 400, size: 130, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 0.9 }); S.add(days30);
const uruoi = label('肌のうるおい ↑', { w: 768, size: 100, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.4 }); S.add(uruoi);
const sukunai = label('ふだん水が少ない人ほど', { w: 1024, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.9 }); S.add(sukunai);

// ---------- G：ダイエット（x=360）：毎食前の500ml・体重計 ----------
const GX = 360;
flat(14, 10, '#c8a878', GX, 0);
const gWall = box(14, 3.2, 0.2, mat('#efe8da')); gWall.position.set(GX, 1.6, -2.6); S.add(gWall);
const gTable = box(1.8, 0.74, 1.0, mat('#a8743a')); gTable.position.set(GX - 1.2, 0.37, -0.8); S.add(gTable);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.04, 20), mat('#f4f4f2')); plate.position.set(GX - 1.2, 0.77, -0.8); S.add(plate);
const food = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat('#e8a84a')); food.scale.y = 0.5; food.position.set(GX - 1.2, 0.81, -0.8); S.add(food);
const glass = new THREE.Group(); { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.2, 14), new THREE.MeshLambertMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.5 })); g.position.y = 0.1; glass.add(g); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.16, 14), WATER); w.position.y = 0.08; glass.add(w); } S.add(glass);
const OJI = makeSuit({ old: true, bald: true, jacket: '#5a5a62', tie: '#c8423a' }); S.add(OJI);
const OJI2 = makeSuit({ old: true, jacket: '#5a4a3a', tie: '#3a6ab2' }); S.add(OJI2);
const scale = new THREE.Group(); { const b = box(0.6, 0.08, 0.5, mat('#f4f4f2')); b.position.y = 0.04; scale.add(b); } S.add(scale);
const scale2 = scale.clone(); S.add(scale2);
const ml500 = label('食事の前に500ml', { w: 900, size: 96, color: '#fff', bg: 'rgba(42,106,216,.98)', sx: 1.8 }); S.add(ml500);
const w12 = label('12週間', { w: 512, size: 120, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 1.0 }); S.add(w12);
const minus2 = label('約2kg多く減った', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.8 }); S.add(minus2);
const nomu = label('水あり', { w: 400, size: 110, color: '#fff', bg: 'rgba(42,106,216,.98)', sx: 0.75 }); S.add(nomu);
const nashi = label('水なし', { w: 400, size: 110, color: '#fff', bg: 'rgba(90,96,112,.96)', sx: 0.75 }); S.add(nashi);
const komame = label('こまめに', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(komame);

const PEOPLE = [ME, OTAKU, B_ME, ...MEN, C_ME, D_ME, OJI, OJI2];
const LABELS = [don, twoL, karada, count, sotto, chikai, muda, days30, uruoi, sukunai, ml500, w12, minus2, nomu, nashi, komame];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); glow.set(0); setIn(0, 0, 0);
  { const s = ISL.userData.seats[2]; ME.position.set(s.x, 0, -0.8 + s.z); ME.rotation.y = s.ry; poseSit(ME); BOTTLE.position.set(s.x + 0.35, 0.77, -1.2); }
  OTAKU.position.set(-4.5, 0, 0.8); OTAKU.rotation.y = -1.2; FLASK.visible = false;
  B_ME.position.set(BX - 2, 0, 0); MEN.forEach((p, i) => { const s = MR.userData.seats[i]; p.position.set(CX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  { const s = MR.userData.seats[5]; C_ME.position.set(CX + s.x, 0, s.z); C_ME.rotation.y = s.ry; poseSit(C_ME); }
  { const s = ISL2.userData.seats[5]; D_ME.position.set(DX - 1.0 + s.x, 0, -0.8 + s.z); D_ME.rotation.y = s.ry; poseSit(D_ME); }
  OJI.position.set(GX - 1.2, 0, 0.0); OJI.rotation.y = Math.PI; OJI2.position.set(GX + 1.6, 0, 0.6); scale.position.set(GX + 0.6, 0, 0.6); scale2.position.set(GX + 1.6, 0, 0.6); OJI.visible = true;
  glass.position.set(GX - 0.85, 0.75, -0.6);
  MR.userData.board.set(['定例会議']); el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function walk(p, t, sp = 7, a = 0.45) { const ph = t * sp; p.userData.legs[0].rotation.x = Math.sin(ph) * a; p.userData.legs[1].rotation.x = -Math.sin(ph) * a; p.userData.arms[0].rotation.x = -Math.sin(ph) * a * 0.8; }
const TP = 0.45;
function deskCam(u = 0) { const s = ISL.userData.seats[2]; look(s.x + lerp(3.2, 2.9, u), 1.75, lerp(1.6, 1.3, u), s.x + 0.1, 2.0, -1.4, 50); }
function shot0(t) { // 0秒＝サムネ：会社の机に、2リットルのペットボトルがドンと置かれる
  reset(); lift(0); const s = ISL.userData.seats[2]; const k = easeOut(clamp(t / TP)); BOTTLE.position.y = 0.77 + (1 - k) * 0.35; ME.userData.head.rotation.x = -0.1;
  if (t > TP) { say(don, t, TP, s.x + 0.95, 1.2, -1.1, 0.5); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  deskCam(ease(clamp(t / 3)));
  return S;
}
function sOtaku(t, d) { // 健康オタクの同僚が、水筒を抱えて会議室へ向かう。
  reset(); lift(120); const k = clamp(t / d); OTAKU.position.set(lerp(3.2, -2.0, k), 0, 0.9); OTAKU.rotation.y = -Math.PI / 2; walk(OTAKU, t); OTAKU.userData.arms[1].rotation.set(-1.3, 0, -0.5); FLASK.visible = true; OTAKU.updateMatrixWorld(); { const v = new THREE.Vector3(0.05, 1.05, 0.28); OTAKU.localToWorld(v); FLASK.position.copy(v); }
  look(0.6, 1.9, 5.2, 0.4, 1.3, 0.4, 50);
  return S;
}
function sIibun(t) { // 健康オタクの言い分から。
  reset(); lift(120); OTAKU.position.set(0.6, 0, 1.0); OTAKU.rotation.y = -0.3; FLASK.visible = true; OTAKU.userData.arms[1].rotation.set(-1.3, 0, -0.5); OTAKU.updateMatrixWorld(); { const v = new THREE.Vector3(0.05, 1.05, 0.28); OTAKU.localToWorld(v); FLASK.position.copy(v); } OTAKU.userData.arms[0].rotation.set(-0.6, 0, 0.4);
  look(1.2, 1.8, 4.0, 0.6, 1.5, 1.0, 46);
  return S;
}
function sKarada(t) { // 水を1日2リットル飲むと、体にいいらしい。
  reset(); lift(120); OTAKU.position.set(0.6, 0, 1.0); OTAKU.rotation.y = -0.3; FLASK.visible = true; OTAKU.userData.arms[1].rotation.set(-1.3, 0, -0.5); OTAKU.updateMatrixWorld(); { const v = new THREE.Vector3(0.05, 1.05, 0.28); OTAKU.localToWorld(v); FLASK.position.copy(v); } OTAKU.userData.arms[0].rotation.set(-1.6 - Math.abs(Math.sin(t * 5)) * 0.2, 0, 0.2);
  say(karada, t, 0.4, 0.6, 2.35, 1.0, 1.3);
  look(1.2, 1.8, 4.6, 0.6, 1.6, 1.0, 46);
  return S;
}
function sDay1(t, d) { // 1日目。午前中だけで、トイレに3回。
  reset(); lift(120); const k = clamp(t / (d - 0.6)); B_ME.position.set(lerp(BX - 2, BX + 2.8, ease(k)), 0, lerp(0, -1.6, k * k)); B_ME.rotation.y = Math.PI / 2 - 0.3 * k; walk(B_ME, t, 10, 0.6); B_ME.rotation.x = 0.1;
  if (t > 0.6) say(count, t, 0.6, BX + 1.6, 2.6, -1.4, 0.95);
  setHud('1日目', '午前', 1); look(BX + 0.6, 2.0, 4.6, BX + 0.8, 1.3, -1.0, 50);
  return S;
}
function sDay3(t, d) { // 3日目。会議の途中で、そっとトイレへ抜ける。
  reset(); lift(120); const k = clamp((t - 0.6) / (d - 1.0)); const s = MR.userData.seats[5];
  if (k <= 0) { /* 座ったまま */ } else { poseClear(C_ME); C_ME.position.set(CX + s.x + k * 2.5, 0, s.z + 0.5); C_ME.rotation.y = Math.PI / 2; C_ME.rotation.x = 0.35; walk(C_ME, t, 8, 0.35); }
  MEN.forEach(p => p.userData.head.rotation.y = 0);
  if (t > 0.8) say(sotto, t, 0.8, CX + s.x + 0.6, 2.2, s.z + 0.4, 0.9);
  MR.userData.board.set(['定例会議']); setHud('3日目', '会議中', 1); look(CX + 1.2, 2.7, 3.6, CX + 0.8, 1.0, -0.6, 50);
  return S;
}
function sWeek(t) { // 1週間後。朝イチで、トイレに一番近い席を取る。
  reset(); lift(120); D_ME.userData.head.rotation.y = -0.5 + Math.sin(t * 2) * 0.2; D_ME.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0));
  if (t > 0.8) say(chikai, t, 0.8, DX + 1.5, 2.4, -0.6, 1.6);
  setHud('1週間後', '朝イチ', 1); look(DX + 1.0, 2.3, 4.6, DX + 1.8, 1.2, -1.0, 50);
  return S;
}
function tankCam(u = 0) { look(EX - 0.1, 2.0, lerp(9.2, 8.6, u), EX - 0.1, 1.9, -1.5, 50); }
function sMatte(t, d) { // でも、体は本当に2リットルを待っていたのか。
  reset(); lift(150); say(twoL2, t, 0.2, EX - 3.6, 3.9, -1.2, 0.7); T_OUT.userData.set(0); outLab.visible = false; inLab.visible = false;
  look(EX - 2.4, 2.0, 7.8, EX - 2.4, 1.9, -1.5, 50);
  return S;
}
function sOut(t, d) { // ふつうに暮らすだけで、体から出ていく水は1日2.5リットル。
  reset(); lift(150); T_OUT.userData.set(2.5 * easeOut(clamp((t - 0.3) / 1.2))); outLab.visible = true; inLab.visible = false;
  setTop('体から出ていく水（1日）', '2.5L', fade(t, 0.3, d, 0.25), BLUE); setHud('ふつうに暮らす大人', '安静のとき', 1);
  tankCam(ease(clamp(t / d)));
  return S;
}
function sFood(t, d) { // そのうち1.0リットルは食事から。
  reset(); lift(150); T_OUT.userData.set(2.5); outLab.visible = true; inLab.visible = true; setIn(1.0 * easeOut(clamp((t - 0.2) / 0.8)), 0, 0); setHud('ふつうに暮らす大人', '安静のとき', 1);
  tankCam(1);
  return S;
}
function sBody(t, d) { // 0.3リットルは体の中でつくられる。
  reset(); lift(150); T_OUT.userData.set(2.5); outLab.visible = true; inLab.visible = true; setIn(1.0, 0.3 * easeOut(clamp((t - 0.2) / 0.6)), 0); setHud('ふつうに暮らす大人', '安静のとき', 1);
  tankCam(1);
  return S;
}
function sDrink(t, d) { // 飲み水で足りない分は、約1.2リットル。
  reset(); lift(150); T_OUT.userData.set(2.5); outLab.visible = true; inLab.visible = true; setIn(1.0, 0.3, 1.2 * easeOut(clamp((t - 0.3) / 1.0)));
  setTop('飲み水で足りない分（1日）', '約1.2L', fade(t, 0.3, d, 0.25), GREEN); setHud('ふつうに暮らす大人', '安静のとき', 1);
  tankCam(1);
  return S;
}
function sMuda(t, d) { // じゃあ、残りの水はムダだったのか。
  reset(); lift(150); T_OUT.userData.set(2.5); outLab.visible = true; inLab.visible = true; setIn(1.0, 0.3, 1.2);
  BIGB.userData.water.scale.y = 1; say(twoL2, t, 0, EX - 3.6, 3.9, -1.2, 0.7); twoL2.visible = true; say(muda, t, 0.4, EX - 3.6, 2.6, 0.2, 0.85);
  look(EX - 1.6, 2.2, 9.0, EX - 1.6, 1.9, -1.5, 50);
  return S;
}
function womenCam(u = 0) { look(FX, lerp(4.5, 3.6, u), lerp(9.5, 8.0, u), FX, 1.2, -4, 50); }
function sBiyou(t, d) { // 美容は？ 女性49人が、1日2リットル多く飲んで30日。
  reset(); lift(150); if (t > d * 0.45) say(days30, t, d * 0.45, FX, 3.4, -2, 0.9);
  setTop('健康な女性（22〜34歳）', '49人', fade(t, 0.3, d, 0.25), PINK); setHud('美容', '1日 +2L', 1);
  womenCam(ease(clamp(t / d)) * 0.6);
  return S;
}
function sUruoi(t, d) { // 肌のうるおいが上がった。
  reset(); lift(150); glow.set((t * 0.35) % 1);
  say(uruoi, t, 0.3, HERO_W.position.x, 2.45, HERO_W.position.z, 1.1);
  setHud('30日後', '小さな研究', 1);
  look(HERO_W.position.x + 0.5, 1.8, HERO_W.position.z + 4.4, HERO_W.position.x, 1.6, HERO_W.position.z, 46);
  return S;
}
function sSukunai(t, d) { // ふだん水が少ない人ほど。
  reset(); lift(150); glow.set((t * 0.35 + 0.3) % 1);
  uruoi.visible = true; uruoi.position.set(HERO_W.position.x, 2.45, HERO_W.position.z); uruoi.userData.size(1.1);
  say(sukunai, t, 0.3, HERO_W.position.x, 2.05, HERO_W.position.z + 0.3, 1.5);
  setHud('30日後', '小さな研究', 1);
  look(HERO_W.position.x + 0.5, 1.8, HERO_W.position.z + 4.4, HERO_W.position.x, 1.6, HERO_W.position.z, 46);
  return S;
}
function dietCam(u = 0) { look(GX - 0.2, 2.0, lerp(4.4, 4.0, u), GX - 0.3, 1.2, -0.4, 50); }
function sDiet(t, d) { // ダイエットは？ 食事を減らしている55〜75歳の48人。
  reset(); lift(150); OJI.position.set(GX - 1.2, 0, 0.0); poseSit(OJI); OJI.userData.head.rotation.x = 0.3; OJI2.visible = false;
  setTop('食事を減らすダイエット中（55〜75歳）', '48人', fade(t, 0.3, d, 0.25), GOLD); setHud('ダイエット', '食事を減らす', 1);
  look(GX - 1.4, 1.9, -2.3, GX - 1.2, 1.15, -0.1, 50);
  return S;
}
function sMaeni(t, d) { // 毎食の前に500mlの水を12週間。
  reset(); lift(150); OJI.position.set(GX - 1.2, 0, 0.0); poseSit(OJI); OJI2.visible = false; const k = clamp((t - 0.3) / 0.6); OJI.userData.arms[1].rotation.set(-2.2 * k, 0, -0.3 * k); OJI.userData.head.rotation.x = -0.25 * k; OJI.updateMatrixWorld(); if (k > 0.5) { const v = new THREE.Vector3(0.12, 1.55, 0.3); OJI.localToWorld(v); glass.position.copy(v); }
  say(ml500, t, 0.3, GX - 1.2, 2.3, -0.2, 1.4); if (t > d * 0.55) say(w12, t, d * 0.55, GX - 1.2, 1.95, -0.2, 0.9);
  look(GX - 1.4, 1.9, -2.3, GX - 1.2, 1.3, -0.1, 50);
  return S;
}
function sGumi(t, d) { // 飲んだ組は、
  reset(); lift(150); OJI.position.set(GX + 0.6, 0.08, 0.6); OJI2.position.set(GX + 1.6, 0.08, 0.6); OJI.rotation.y = OJI2.rotation.y = 0;
  say(nomu, t, 0.2, GX + 0.6, 2.3, 0.6, 0.7); say(nashi, t, 0.5, GX + 1.6, 2.3, 0.6, 0.7);
  dietCam(0.3); look(GX + 1.1, 1.9, 5.6, GX + 1.1, 1.3, 0.4, 50);
  return S;
}
function sMinus(t, d) { // 体重が約2kg多く減った。
  reset(); lift(150); OJI.position.set(GX + 0.6, 0.08, 0.6); OJI2.position.set(GX + 1.6, 0.08, 0.6); const k = easeOut(clamp((t - 0.3) / 1.0)); OJI.scale.set(1 - 0.08 * k, 1, 1 - 0.12 * k); OJI.userData.arms[0].rotation.set(0, 0, -2.4 * k);
  nomu.visible = nashi.visible = true; nomu.position.set(GX + 0.6, 2.3, 0.6); nashi.position.set(GX + 1.6, 2.3, 0.6); nomu.userData.size(0.7); nashi.userData.size(0.7);
  setTop('12週間で、水なしの組より', '約2kg多く減った', fade(t, 0.3, d, 0.25), GREEN); setHud('食事を減らすダイエット中', '2010年の研究', 1);
  look(GX + 1.1, 1.9, 5.6, GX + 1.1, 1.3, 0.4, 50);
  return S;
}
function sKekka(t, d) { // 結果：体が待っていたのは約1.2リットル。
  reset(); lift(150); T_OUT.userData.set(2.5); outLab.visible = true; inLab.visible = true; setIn(1.0, 0.3, 1.2);
  tankCam(1 - ease(clamp(t / d)) * 0.5);
  return S;
}
function sMikata(t, d) { // 残りの水は、肌とダイエットの味方だった。
  reset(); lift(150); glow.set((t * 0.35) % 1);
  uruoi.visible = true; uruoi.position.set(HERO_W.position.x, 2.55, HERO_W.position.z); uruoi.userData.size(1.3);
  womenCam(1 - ease(clamp(t / d)) * 0.4);
  return S;
}
function sKomame(t, d) { // 大事なのは量より、こまめに飲むこと。
  reset(); lift(120); const s = ISL.userData.seats[2]; ME.userData.arms[1].rotation.set(-2.0, 0, -0.3); BOTTLE.position.set(s.x + 0.35, 0.77, -1.2);
  say(komame, t, 0.4, s.x - 0.4, 2.2, -1.3, 0.9);
  deskCam(1);
  return S;
}
function sAsk(t) { // あなたは1日、水を何杯飲んでる？（冒頭と同じ構図）
  reset(); lift(0); deskCam(0);
  return S;
}

const NARR = { '2リットル': 'にリットル', '1日': 'いちにち', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '3回': 'さんかい', '2.5リットル': 'にてんごリットル', '1.0リットル': 'いってんれいリットル', '0.3リットル': 'れいてんさんリットル', '約1.2リットル': 'やくいってんにリットル', '49人': 'よんじゅうきゅうにん', '30日': 'さんじゅうにち', '55〜75歳': 'ごじゅうごさいからななじゅうごさい', '48人': 'よんじゅうはちにん', '500ml': 'ごひゃくミリリットル', '12週間': 'じゅうにしゅうかん', '約2kg': 'やくにキロ', '結果：': '結果、', '朝イチ': 'あさイチ', '一番': 'いちばん', '何杯': 'なんばい', '健康オタク': 'けんこうオタク', '言い分': 'いいぶん', '水筒': 'すいとう', '毎食': 'まいしょく', '肌': 'はだ' };
const P = planTimes([
  ['健康オタクの同僚が、水筒を<br>抱えて会議室へ向かう。', sOtaku],
  ['健康オタクの言い分から。', sIibun],
  ['水を1日2リットル飲むと、<br>体にいいらしい。', sKarada],
  ['1日目。午前中だけで、<br>トイレに3回。', sDay1],
  ['3日目。会議の途中で、<br>そっとトイレへ抜ける。', sDay3],
  ['1週間後。朝イチで、トイレに<br>一番近い席を取る。', sWeek],
  ['でも、体は本当に<br>2リットルを待っていたのか。', sMatte],
  ['ふつうに暮らすだけで、体から<br>出ていく水は1日2.5リットル。', sOut],
  ['そのうち1.0リットルは食事から。', sFood],
  ['0.3リットルは<br>体の中でつくられる。', sBody],
  ['飲み水で足りない分は、<br>約1.2リットル。', sDrink],
  ['じゃあ、残りの水は<br>ムダだったのか。', sMuda],
  ['美容は？ 女性49人が、<br>1日2リットル多く飲んで30日。', sBiyou],
  ['肌のうるおいが上がった。', sUruoi],
  ['ふだん水が少ない人ほど。', sSukunai],
  ['ダイエットは？ 食事を<br>減らしている55〜75歳の48人。', sDiet],
  ['毎食の前に500mlの水を12週間。', sMaeni],
  ['飲んだ組は、飲まない組より', sGumi],
  ['体重が約2kg多く減った。', sMinus],
  ['結果：体が待っていたのは<br>約1.2リットル。', sKekka],
  ['残りの水は、肌と<br>ダイエットの味方だった。', sMikata],
  ['大事なのは量より、<br>こまめに飲むこと。', sKomame],
  ['あなたは1日、<br>水を何杯飲んでる？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0665',
    v2: true,
    tt: 'main',
    hookLine: '会社の机に、2リットルのペットボトルがドンと置かれる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日水を2リットル飲むのを1か月続けたら？',
    titleHtml: 'もしも毎日水を<br>2リットル飲むのを<br>1か月続けたら？',
    mood: 'tension', seed: 665, hits: [TP, P.at(19), P.at(20)], risers: [P.at(11)], impacts: [P.at(7, 0.3), P.at(10, 0.3), P.at(12, 0.3), P.at(13, 0.3), P.at(18, 0.3)],
    sfx: [[TP, 'poof'], [P.at(3, 0.6), 'alarm'], [P.at(4, 0.8), 'whoosh'], [P.at(6, 0.2), 'meter', 0.4], [P.at(8, 0.2), 'bubble'], [P.at(9, 0.2), 'bubble'], [P.at(10, 0.3), 'bubble'], [P.at(11, 0.4), 'buzz'], [P.at(13, 0.3), 'bubble'], [P.at(18, 0.3), 'bubble']],
    narr: NARR,
    ask: 'あなたは1日、水を何杯飲んでる？',
    caption: 'もしも毎日水を2リットル飲むのを1か月続けたら？\n\n健康オタクの同僚が、水筒を抱えて会議室へ向かう。\n健康オタクの言い分から。水を1日2リットル飲むと、体にいいらしい。\n1日目。午前中だけで、トイレに3回。\n3日目。会議の途中で、そっとトイレへ抜ける。\n1週間後。朝イチで、トイレに一番近い席を取る。\nでも、体は本当に2リットルを待っていたのか。\nふつうに暮らすだけで、体から出ていく水は1日2.5リットル。そのうち1.0リットルは食事から。0.3リットルは体の中でつくられる。飲み水で足りない分は、約1.2リットル（安静にしている大人。暑い日・運動する日はもっと必要）。\nじゃあ、残りの水はムダだったのか。\n美容は？ 健康な女性49人（22〜34歳）が、1日2リットル多く飲んで30日。肌のうるおいが上がった。ふだん水が少ない人ほど（小さな研究）。\nダイエットは？ 食事を減らしている55〜75歳の48人。毎食の前に500mlの水を12週間。飲んだ組は、飲まない組より体重が約2kg多く減った。\n\n結果：体が待っていたのは約1.2リットル。残りの水は、肌とダイエットの味方だった。\n大事なのは量より、こまめに飲むこと。\n\nあなたは1日、水を何杯飲んでる？ コメントで教えて。\n\n※持病で水分を控えるよう言われている人は、医師の指示に従ってください\n出典：健康のため水を飲もう推進委員会「健康のため水を飲もう」リーフレット（環境省のページに掲載）、Palma L ほか. Clin Cosmet Investig Dermatol 2015、Dennis EA ほか. Obesity 2010',
    hashtags: ['もしもラボ', 'もしも', '水2リットル', '美容', 'ダイエット'],
    endStats: [['飲み水で足りない分（1日・安静の大人）', '約1.2L', '健康のため水を飲もう推進委員会'], ['女性49人・1日+2Lを30日', '肌のうるおい↑', '2015年の研究'], ['毎食前に500mlを12週間', '約2kg多く減った', '2010年の研究']],
    sources: '出典：健康のため水を飲もう推進委員会、Palma L ほか 2015、Dennis EA ほか 2010',
  },
});
