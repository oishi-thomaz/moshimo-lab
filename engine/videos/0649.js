import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';

// もしも実家から子供部屋おじさんが消えたら？（皮肉回・台本 S29・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：なんJ・はてなで定期的に燃える 子供部屋おじさん の話
// 数字（裏取り済み）：親と同居の壮年未婚者（35〜44歳）288万人（2016年9月）。男性は 35〜39歳 89万人＋40〜44歳 87万人＝約176万人
//  総務省統計研修所 西文彦「親と同居の未婚者の最近の状況」（労働力調査の特別集計）。画面に 2016年 と出す

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff6ea, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), mat('#5a6a4a', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
function walk(p, t, sp = 8, a = 0.5) { const s = Math.sin(t * sp) * a; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s * 0.7; p.userData.arms[1].rotation.x = s * 0.7; }
function makeKOji(seed = 7) { const p = makeOji(rng(seed), { shirt: '#6a7a8a', bald: false, hair: '#2a2420' }); return p; }
function makeOldDad() { return makeOji(rng(3), { shirt: '#8a7a6a', bald: true }); }
function makeOldMom() { return makeWoman({ shirt: '#b8a0c0', hair: '#9a9a9a', scale: 0.92 }); }

// ---------- A：実家の断面（原点）：2階に子供部屋、1階に親 ----------
const H = new THREE.Group(); S.add(H);
const wallM = mat('#efe6d8'), floorM = mat('#b48a5e');
{ const back = box(6, 5.2, 0.15, wallM); back.position.set(0, 2.6, -1.6); H.add(back);
  for (const x of [-3, 3]) { const s = box(0.15, 5.2, 3.2, wallM); s.position.set(x, 2.6, 0); H.add(s); }
  const f1 = box(6, 0.12, 3.2, floorM); f1.position.set(0, 0.06, 0); H.add(f1);
  const f2 = box(6, 0.18, 3.2, floorM); f2.position.set(0, 2.6, 0); H.add(f2);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.4, 1.6, 4, 1), mat('#8a4a3a')); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.6; roof.position.set(0, 6.0, 0); roof.visible = false; H.add(roof);
  const sky = box(1.6, 1.0, 0.05, mat('#9fc6e8')); sky.position.set(1.6, 4.0, -1.5); H.add(sky); }
// 2階：子供部屋（ポスター・勉強机・布団）
const poster = box(0.8, 1.0, 0.03, mat('#f29bbb')); poster.position.set(-1.8, 4.0, -1.5); H.add(poster);
const poster2 = box(0.6, 0.8, 0.03, mat('#7fd4ff')); poster2.position.set(-0.8, 4.2, -1.5); H.add(poster2);
const kDesk = box(1.2, 0.7, 0.6, mat('#d9c7a8')); kDesk.position.set(-1.9, 3.05, -1.1); H.add(kDesk);
const kMon = box(0.6, 0.4, 0.05, mat('#22252c')); kMon.position.set(-1.9, 3.65, -1.2); H.add(kMon);
const FUTON = new THREE.Group(); { const m = box(1.0, 0.14, 1.9, mat('#f3f1ec')); m.position.y = 0.07; FUTON.add(m); const b = box(1.02, 0.12, 1.3, mat('#5d7fb3')); b.position.set(0, 0.2, 0.25); FUTON.add(b); const pl = box(0.6, 0.12, 0.3, mat('#ffffff')); pl.position.set(0, 0.2, -0.75); FUTON.add(pl); } FUTON.rotation.y = Math.PI / 2; FUTON.position.set(0.9, 2.7, -0.2); H.add(FUTON);
const KOJI = makeKOji(); S.add(KOJI); // 寝ている子供部屋おじさん
const poofA = makeSparkles(180, 0.18, 0xfff2c0); S.add(poofA.points); poofA.init([[0.9, 3.0, -0.2]], 1.0, 1.4);
// 1階：居間
const tbl = box(1.4, 0.4, 0.9, mat('#8a5a32')); tbl.position.set(0, 0.32, -0.4); H.add(tbl);
const DAD = makeOldDad(); S.add(DAD); const MOM = makeOldMom(); S.add(MOM);
const itsumade = label('いつまで家にいるの', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 2.1 }); S.add(itsumade);
const hoken = label('老後の保険', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(hoken);
const sorry = label('甘えていたのは どっちも', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 2.3 }); S.add(sorry);

// ---------- B：住宅街から出ていく（x=60） ----------
const BX = 60;
const broad = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), mat('#5a5e66', { depthWrite: false })); broad.rotation.x = -Math.PI / 2; broad.position.set(BX, 0.02, 1.5); broad.renderOrder = -0.8; S.add(broad);
function makeHouse(col) { const g = new THREE.Group(); const b = box(2.4, 2.2, 2.2, mat(col)); b.position.y = 1.1; g.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), mat('#8a4a3a')); r.rotation.y = Math.PI / 4; r.position.y = 2.7; g.add(r); const d = box(0.6, 1.1, 0.05, mat('#7a5a3a')); d.position.set(0, 0.55, 1.11); g.add(d); const w = box(0.6, 0.4, 0.05, mat('#ffd98a')); w.position.set(0.7, 1.6, 1.11); g.add(w); return g; }
const BH = [0, 1, 2, 3].map(i => { const h = makeHouse(['#f6d0a0', '#d0e8f6', '#f6c0c8', '#d8f0c0'][i]); h.position.set(BX - 4.5 + i * 3.0, 0, -1.2); S.add(h); return h; });
const LEAVERS = [0, 1, 2, 3].map(i => { const p = makeKOji(10 + i); const bag = box(0.4, 0.35, 0.25, mat('#3a3f4e')); bag.position.set(0, -0.6, 0.12); p.userData.arms[1].add(bag); S.add(p); return p; });
const zenin = label('全員 出ていった', { w: 1024, size: 100, color: '#fff', bg: 'rgba(40,46,60,.96)', sx: 1.9 }); S.add(zenin);

// ---------- C：288万人（x=120） ----------
const CX = 120;
const cfloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), mat('#343a4c', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -2); cfloor.renderOrder = -0.8; S.add(cfloor);
const N = 288; const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), new THREE.MeshLambertMaterial({ color: '#ffffff' }), N); S.add(crowd);
{ const M = new THREE.Matrix4(); const cMen = new THREE.Color('#5aa0f0'), cW = new THREE.Color('#f29bbb'); for (let i = 0; i < N; i++) { M.makeTranslation(CX - 4.0 + (i % 24) * 0.34, 0.28, -5.0 + Math.floor(i / 24) * 0.36); crowd.setMatrixAt(i, M); crowd.setColorAt(i, i < 176 ? cMen : cW); } crowd.instanceColor.needsUpdate = true; }
const crowdW = new THREE.Color('#c8ccd4');
function crowdColor(men) { const cMen = new THREE.Color('#5aa0f0'); for (let i = 0; i < N; i++) crowd.setColorAt(i, men && i < 176 ? cMen : crowdW); crowd.instanceColor.needsUpdate = true; }

// ---------- D：台所と居間（x=180）：母・父 ----------
const DX = 180;
const droom = makeRoom({ w: 10, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); droom.position.set(DX, 0, 0); droom.userData.rw.visible = false; S.add(droom);
const dtbl = box(1.8, 0.7, 1.0, mat('#8a5a32')); dtbl.position.set(DX, 0.35, -1.4); S.add(dtbl);
const PLATES = [0, 1, 2, 3].map(i => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.05, 18), mat('#ffffff')); p.position.set(DX - 0.6 + i * 0.4, 0.73, -1.35); S.add(p); const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), mat(['#e8a050', '#c86a3a', '#e8d070', '#7ab050'][i])); f.scale.y = 0.5; f.position.set(DX - 0.6 + i * 0.4, 0.78, -1.35); S.add(f); return [p, f]; });
const LAUNDRY = []; for (let i = 0; i < 10; i++) { const l = box(0.5, 0.08, 0.36, mat(['#9fc7e8', '#ffffff', '#f2c14e', '#c9a8d8', '#9fdcae'][i % 5])); l.position.set(DX + 2.2, 0.06 + i * 0.08, -1.6); S.add(l); LAUNDRY.push(l); }
const D_MOM = makeOldMom(); S.add(D_MOM); const D_DAD = makeOldDad(); S.add(D_DAD);
const hanbun = label('半分に', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(hanbun);
const ENV = new THREE.Group(); { const b = box(0.6, 0.38, 0.03, mat('#fbfaf5')); ENV.add(b); const f = box(0.6, 0.06, 0.035, mat('#c8242c')); f.position.y = 0.08; ENV.add(f); } S.add(ENV);
const ireru = label('家に入れていたお金', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.0 }); S.add(ireru);
const stopX = label('×', { w: 256, h: 256, size: 230, color: '#ff3a3a', stroke: 18, strokeColor: '#fff', sx: 0.8 }); stopX.material.depthTest = false; stopX.renderOrder = 8; S.add(stopX);
const KAKEI = makeDoc({ title: '家計', rows: ['年金', '家に入る', '残り'], head: '#3a8a5a', w: 1.6, h: 1.4 }); S.add(KAKEI);
const ana = label('穴', { w: 256, h: 256, size: 200, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.6 }); S.add(ana);
// 電球・米袋・スマホ
const stool = box(0.5, 0.5, 0.5, mat('#a07e5c')); S.add(stool);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3c0' })); bulb.position.set(DX - 1.6, 3.1, -1.6); S.add(bulb);
const cord = box(0.02, 0.3, 0.02, mat('#ddd')); cord.position.set(DX - 1.6, 3.3, -1.6); S.add(cord);
const rice = box(0.5, 0.65, 0.25, mat('#f4ecd8')); S.add(rice);
const riceLab = label('米 10kg', { w: 384, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 0.7 }); S.add(riceLab);
const phone = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(phone);
const hatena = label('？', { w: 256, h: 256, size: 230, color: '#ffd27a', stroke: 18, strokeColor: '#2a1a00', sx: 0.6 }); S.add(hatena);
const tanomu = label('頼める人がいない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 1.9 }); S.add(tanomu);
const nightLamp = new THREE.PointLight(0x9fb4ff, 0, 8, 1.5); nightLamp.position.set(DX, 2.6, 0); S.add(nightLamp);
const dare = label('…誰も来ない', { w: 768, size: 110, color: '#fff', bg: 'rgba(40,46,80,.95)', sx: 1.4 }); S.add(dare);

// ---------- E：おじさんの一人暮らし（x=240） ----------
const EX = 240;
const eroom = makeRoom({ w: 6, d: 5, wall: '#e8e4dc', floor: '#9a8a70' }); eroom.position.set(EX, 0, 0); eroom.userData.rw.visible = false; S.add(eroom);
const smallTbl = box(0.9, 0.35, 0.6, mat('#7a6a5a')); smallTbl.position.set(EX, 0.17, -0.6); S.add(smallTbl);
const bento = box(0.4, 0.08, 0.3, mat('#2a2a30')); bento.position.set(EX, 0.4, -0.6); S.add(bento);
const bentoTop = box(0.38, 0.03, 0.28, mat('#e8d070')); bentoTop.position.set(EX, 0.45, -0.6); S.add(bentoTop);
const PILE = []; for (let i = 0; i < 12; i++) { const l = box(0.5, 0.1, 0.36, mat(['#6a7a8a', '#3a3f4e', '#8a8f99'][i % 3])); l.position.set(EX - 1.6 + (i % 3) * 0.08, 0.06 + i * 0.1, -1.6); l.rotation.y = i * 0.3; S.add(l); PILE.push(l); }
const E_OJI = makeKOji(); S.add(E_OJI); const sweatE = makeSweat(); E_OJI.userData.head.add(sweatE);
const RENT = makeDoc({ title: '家賃', rows: ['今月'], head: '#c8242c', w: 0.9, h: 0.7, cw: 384 }); S.add(RENT);
const kaji = label('家事', { w: 384, size: 120, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 0.75 }); S.add(kaji);
const momMeal = label('母のごはん', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(momMeal);
const bubbleDots = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05 + i * 0.025, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); S.add(d); return d; });
const mealPlate = new THREE.Group(); { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.05, 20), mat('#ffffff')); mealPlate.add(p); const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat('#e8a050')); f.scale.y = 0.5; f.position.y = 0.06; mealPlate.add(f); const r = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), mat('#ffffff')); r.position.set(0.22, 0.08, 0.1); mealPlate.add(r); } S.add(mealPlate);

const ALL = [KOJI, DAD, MOM, ...LEAVERS, D_MOM, D_DAD, E_OJI];
KOJI.position.set(0.9, 2.78, -0.2); DAD.position.set(-0.7, 0.12, -0.5); MOM.position.set(0.7, 0.12, -0.5);
LEAVERS.forEach((p, i) => p.position.set(BX - 4.5 + i * 3.0, 0, 0.2)); D_MOM.position.set(DX + 0.5, 0, -0.6); D_DAD.position.set(DX - 0.8, 0, -0.6); E_OJI.position.set(EX, 0, -0.1);
ENV.position.set(DX, 1.2, -0.3); KAKEI.position.set(DX, 1.8, -0.6); RENT.position.set(EX + 0.8, 1.6, -0.5); mealPlate.position.set(EX + 0.6, 2.6, -0.6);
stool.position.set(DX - 1.6, 0.25, -1.6); rice.position.set(DX + 1.2, 0.35, -0.8); riceLab.position.set(DX + 1.2, 1.2, -0.8); phone.position.set(DX - 0.6, 1.3, -0.4);
function reset() {
  ALL.forEach(p => { poseReset(p); p.visible = true; });
  KOJI.rotation.set(-Math.PI / 2, 0, Math.PI / 2); KOJI.position.set(1.85, 2.95, -0.2); FUTON.visible = true; poofA.set(0);
  DAD.position.set(-0.7, 0.12, -0.5); DAD.rotation.y = 0.3; poseSit(DAD); DAD.position.y = -0.18; MOM.position.set(0.7, 0.12, -0.5); MOM.rotation.y = -0.3; poseSit(MOM); MOM.position.y = -0.18;
  [itsumade, hoken, sorry, zenin, hanbun, ireru, stopX, ana, hatena, tanomu, dare, kaji, momMeal, riceLab].forEach(l => l.visible = false);
  bubbleDots.forEach(d => d.visible = false); mealPlate.visible = false; crowdColor(false); crowd.visible = true;
  PLATES.forEach(([p, f]) => { p.visible = f.visible = true; }); LAUNDRY.forEach(l => l.visible = true);
  ENV.visible = false; KAKEI.visible = false; KAKEI.userData.fill(0, ''); KAKEI.userData.fill(1, ''); KAKEI.userData.fill(2, ''); RENT.visible = false; RENT.userData.fill(0, '');
  stool.visible = false; bulb.material.color.set('#fff3c0'); rice.visible = false; phone.visible = false; nightLamp.intensity = 0; hemi.intensity = 1.2; sweatE.userData.set(0);
  D_MOM.position.set(DX + 0.5, 0, -0.6); D_DAD.position.set(DX - 0.8, 0, -0.6);
  el.flash.style.opacity = 0;
}
const TP = 0.45;
function houseCam(d = 0) { look(lerp(0.4, 0.3, d), lerp(3.5, 3.3, d), lerp(7.0, 7.5, d), 0.1, 3.05, -0.2, 52); }
function shot0(t) { // 0秒＝サムネ：実家の2階の子供部屋から、40代の男が布団ごと消える
  reset(); lift(0); const gone = t > TP; KOJI.visible = FUTON.visible = !gone; poofA.set(gone ? clamp((t - TP) / 1.5) : 0);
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  if (gone) { DAD.userData.head.rotation.x = -0.45; MOM.userData.head.rotation.x = -0.45; }
  houseCam(ease(clamp(t / 3.0)));
  return S;
}
function shot1(t) { // 親たちの不満から。
  reset(); lift(200); DAD.userData.head.rotation.x = -0.3; MOM.userData.head.rotation.x = -0.3; MOM.userData.arms[1].rotation.x = -1.2;
  look(0.2, 2.6, 5.2, 0, 1.6, -0.4, 52);
  return S;
}
function shot2(t) { // いい年して、いつまで家にいるの
  reset(); lift(150); MOM.userData.arms[1].rotation.x = -2.2; MOM.userData.head.rotation.x = -0.4; DAD.userData.head.rotation.x = -0.4;
  itsumade.position.set(0.4, 2.2, 0.4); pop(itsumade, t, 0.4, 0.3, 2.0);
  houseCam(1);
  return S;
}
function shot3(t) { // ある日、実家から子供部屋おじさんが全員出ていった
  reset(); lift(80);
  LEAVERS.forEach((p, i) => { const k = clamp((t - i * 0.3) / 3.0); p.position.set(BX - 4.5 + i * 3.0 + k * 0.6, 0, 0.0 + k * 1.6); p.rotation.y = 0.3; walk(p, t + i, 7, 0.45); });
  zenin.position.set(BX, 3.5, -0.6); pop(zenin, t, 1.2, 0.3, 2.8);
  look(BX, 3.0, 9.6, BX, 1.8, -0.6, 52);
  return S;
}
function crowdCam(u = 0) { look(CX, lerp(5.4, 6.0, u), lerp(5.2, 5.8, u), CX, 0.3, -3.2, 52); }
function shot4(t) { // 35〜44歳で親と暮らす未婚の人は288万人
  reset(); lift(150); crowdCam(ease(clamp(t / 4)));
  setTop('親と暮らす未婚の35〜44歳（2016年）', '288万人', fade(t, 0.3, 4.0, 0.25), GOLD);
  return S;
}
function shot5(t) { // うち男性は約176万人
  reset(); lift(150); crowdColor(t > 0.5); crowdCam(1);
  setTop('うち男性（2016年）', '約176万人', fade(t, 0.4, 3.0, 0.25), BLUE);
  return S;
}
function kitchenCam(x = 0) { look(DX + x, 2.1, 4.6, DX + x, 1.3, -1.0, 52); }
function shot6(t) { // 母は喜ぶ。
  reset(); lift(80); D_MOM.position.set(DX + 0.8, 0, -0.7); poseClear(D_MOM); D_MOM.userData.arms[0].rotation.z = -2.4 + Math.sin(t * 8) * 0.2; D_MOM.userData.arms[1].rotation.z = 2.4 - Math.sin(t * 8) * 0.2; D_DAD.visible = false;
  kitchenCam(0.6); return S;
}
function shot7(t) { // 洗濯物も晩ごはんも、半分になる
  reset(); lift(80); D_DAD.visible = false; const k = clamp((t - 0.5) / 1.2);
  LAUNDRY.forEach((l, i) => l.visible = i < 10 - Math.round(k * 5)); PLATES.forEach(([p, f], i) => { const on = i < 2 || k < 0.6; p.visible = f.visible = on; });
  hanbun.position.set(DX + 1.0, 2.2, -1.2); pop(hanbun, t, 1.6, 0.25, 1.0);
  kitchenCam(0.6); return S;
}
function shot8(t) { // ところが1か月後、毎月家に入れていたお金が止まる
  reset(); lift(80); D_DAD.visible = false; D_MOM.userData.arms.forEach(a => a.rotation.x = -1.1); D_MOM.position.set(DX, 0, -0.7);
  ENV.visible = true; ENV.position.set(DX, 1.4, -0.3); ireru.position.set(DX, 2.55, -0.5); pop(ireru, t, 0.4, 0.3, 1.9);
  if (t > 2.2) { stopX.position.set(DX, 1.45, -0.2); pop(stopX, t, 2.2, 0.2, 0.75); D_MOM.userData.head.rotation.x = 0.3; }
  kitchenCam(0); return S;
}
function shot9(t) { // 年金暮らしの家計に、穴があく
  reset(); lift(150); D_DAD.visible = false; D_MOM.visible = false; KAKEI.visible = true; KAKEI.position.set(DX, 1.8, -0.6);
  KAKEI.userData.fill(0, '年金だけ'); KAKEI.userData.fill(1, '0円'); KAKEI.userData.fill(2, t > 1.4 ? '足りない' : '');
  ana.position.set(DX + 0.6, 1.2, -0.4); pop(ana, t, 1.4, 0.2, 0.6);
  look(DX, 1.9, 3.4, DX, 1.8, -0.6, 50); return S;
}
function shot10(t) { // 電球の交換、
  reset(); lift(80); D_MOM.visible = false; stool.visible = true; D_DAD.position.set(DX - 1.6, 0.5, -1.6); D_DAD.userData.arms[1].rotation.x = -2.9; D_DAD.rotation.z = Math.sin(t * 7) * 0.06; D_DAD.userData.arms[0].rotation.z = 0.9;
  bulb.material.color.set(Math.floor(t * 5) % 2 ? '#3a3a30' : '#fff3c0');
  look(DX - 0.6, 2.2, 4.6, DX - 1.5, 1.7, -1.6, 52); return S;
}
function shot11(t) { // 重い米袋、
  reset(); lift(80); D_DAD.visible = false; rice.visible = true; riceLab.visible = true; D_MOM.position.set(DX + 1.2, 0, -0.35); D_MOM.rotation.y = 0; D_MOM.rotation.x = 0.35; D_MOM.userData.arms.forEach(a => a.rotation.x = -0.9); D_MOM.userData.head.rotation.x = 0.2;
  rice.position.set(DX + 1.2, 0.35 + Math.abs(Math.sin(t * 3)) * 0.05, 0.0); riceLab.position.set(DX + 1.2, 1.35, 0.1);
  look(DX + 0.8, 1.9, 4.0, DX + 1.0, 1.0, -0.4, 52); return S;
}
function shot12(t) { // スマホの設定。
  reset(); lift(80); D_MOM.visible = false; D_DAD.position.set(DX - 0.4, 0, -0.6); D_DAD.userData.arms[1].rotation.x = -1.6; D_DAD.userData.head.rotation.x = 0.2; phone.visible = true; phone.position.set(DX - 0.4, 1.45, -0.05);
  hatena.position.set(DX + 0.1, 2.35, -0.6); pop(hatena, t, 0.4, 0.2, 0.6);
  look(DX, 2.0, 3.6, DX - 0.3, 1.5, -0.6, 52); return S;
}
function shot13(t) { // 頼める人がいない
  reset(); lift(80); stool.visible = true; rice.visible = true;
  D_DAD.position.set(DX - 0.6, 0, -0.6); D_DAD.rotation.y = 0.3; D_MOM.position.set(DX + 0.6, 0, -0.6); D_MOM.rotation.y = -0.3; [D_DAD, D_MOM].forEach(p => p.userData.head.rotation.x = 0.3);
  tanomu.position.set(DX, 2.5, -0.6); pop(tanomu, t, 0.3, 0.3, 1.9);
  kitchenCam(0); return S;
}
function shot14(t) { // 夜中に父が転んでも、すぐ駆けつける人がいない
  reset(); lift(80); D_MOM.visible = false; hemi.intensity = 0.35; nightLamp.intensity = 4;
  const k = easeOut(clamp((t - 0.4) / 0.5)); D_DAD.position.set(DX + 1.4, 0.2 * k, 0.4); D_DAD.rotation.z = 1.4 * k; D_DAD.position.y = 0.22 * k; D_DAD.userData.arms[1].rotation.x = -2.0 * k;
  dare.position.set(DX + 1.4, 1.8, 0.2); pop(dare, t, 1.8, 0.3, 1.3);
  look(DX + 1.6, 2.6, 4.4, DX + 1.4, 0.6, 0.0, 52); return S;
}
function aptCam(d = 0) { look(EX + 0.3, 2.0, lerp(3.8, 4.2, d), EX, 1.2, -0.6, 52); }
function shot15(t) { // 一方おじさんは、一人暮らしの家賃と家事に追われる
  reset(); lift(80); E_OJI.position.set(EX - 0.3, 0, -0.1); E_OJI.rotation.y = 0.3; E_OJI.userData.arms[1].rotation.x = -1.1; sweatE.userData.set(clamp((t - 1.2) / 0.4), t);
  RENT.visible = true; RENT.position.set(EX + 0.6, 1.55, -0.1); RENT.userData.fill(0, t > 0.6 ? '払う' : '');
  kaji.position.set(EX - 1.0, 1.8, -1.2); pop(kaji, t, 1.6, 0.25, 0.75);
  aptCam(clamp(t / 3.5)); return S;
}
function shot16(t) { // 毎日母のごはんを食べていたことに、初めて気づく
  reset(); lift(80); poseSit(E_OJI); E_OJI.position.set(EX - 0.4, -0.2, -0.1); E_OJI.rotation.y = 0.6; E_OJI.userData.arms[1].rotation.x = -1.0; E_OJI.userData.head.rotation.x = 0.25;
  bubbleDots.forEach((d, i) => { d.position.set(EX - 0.15 + i * 0.18, 1.5 + i * 0.22, -0.2); d.visible = t > 0.5 + i * 0.2; });
  mealPlate.visible = t > 1.2; mealPlate.position.set(EX + 0.5, 2.35, -0.3); mealPlate.rotation.x = 0.6;
  momMeal.position.set(EX + 0.5, 2.85, -0.3); pop(momMeal, t, 1.3, 0.3, 1.2);
  aptCam(1); return S;
}
function shot17(t) { // 結果：子供部屋おじさんは、親の老後の保険でもあった
  reset(); lift(0); KOJI.visible = FUTON.visible = false; DAD.userData.head.rotation.x = 0.3; MOM.userData.head.rotation.x = 0.3;
  hoken.position.set(0.9, 3.5, 0.2); pop(hoken, t, 0.8, 0.3, 1.4);
  const u = ease(clamp(t / 5.0)); look(0.3, lerp(3.1, 3.5, u), lerp(7.5, 9.5, u), 0.1, 2.45, -0.2, 52);
  setTop('結果', '親の老後の保険', fade(t, 0.3, 5.1, 0.25), GOLD); return S;
}
function shot18(t) { // 甘えていたのは、どっちもだったのかもしれない
  reset(); lift(80); poseSit(E_OJI); E_OJI.position.set(EX - 0.4, -0.2, -0.1); E_OJI.rotation.y = 0.6; E_OJI.userData.head.rotation.x = 0.35;
  sorry.position.set(EX, 2.55, -0.4); pop(sorry, t, 0.4, 0.3, 2.2);
  aptCam(1); return S;
}
function shot19(t) { // 質問。最後は冒頭と同じ構図（空いた子供部屋）
  reset(); lift(0); KOJI.visible = FUTON.visible = false; DAD.userData.head.rotation.x = -0.45; MOM.userData.head.rotation.x = -0.45;
  houseCam(0); return S;
}

const SUBS = [
  [3.0, 5.0, '親たちの不満から。'],
  [5.1, 8.4, 'いい年して、<br>いつまで家にいるの。'],
  [8.5, 12.4, 'ある日、実家から子供部屋<br>おじさんが全員出ていった。'],
  [12.5, 16.6, '35〜44歳で親と暮らす<br>未婚の人は288万人。'],
  [16.7, 19.8, 'うち男性は<br>約176万人。'],
  [19.9, 21.6, '母は喜ぶ。'],
  [21.7, 25.0, '洗濯物も晩ごはんも、<br>半分になる。'],
  [25.1, 29.0, 'ところが1か月後、毎月<br>家に入れていたお金が止まる。'],
  [29.1, 31.8, '年金暮らしの家計に、<br>穴があく。'],
  [31.9, 33.4, '電球の交換、'],
  [33.5, 34.9, '重い米袋、'],
  [35.0, 36.6, 'スマホの設定。'],
  [36.7, 38.6, '頼める人がいない。'],
  [38.7, 42.2, '夜中に父が転んでも、<br>すぐ駆けつける人がいない。'],
  [42.3, 45.8, '一方おじさんは、一人暮らしの<br>家賃と家事に追われる。'],
  [45.9, 49.6, '毎日母のごはんを食べていた<br>ことに、初めて気づく。'],
  [49.7, 54.6, '結果：子供部屋おじさんは、<br>親の老後の保険でもあった。'],
  [54.7, 58.0, '甘えていたのは、どっちも<br>だったのかもしれない。'],
  [58.1, 61.8, '実家暮らしの大人、<br>あり？なし？'],
];
const shots = [
  { a: 0, b: 3.0, f: shot0 }, { a: 3.0, b: 5.1, f: shot1 }, { a: 5.1, b: 8.5, f: shot2 }, { a: 8.5, b: 12.5, f: shot3 }, { a: 12.5, b: 16.7, f: shot4 },
  { a: 16.7, b: 19.9, f: shot5 }, { a: 19.9, b: 21.7, f: shot6 }, { a: 21.7, b: 25.1, f: shot7 }, { a: 25.1, b: 29.1, f: shot8 },
  { a: 29.1, b: 31.9, f: shot9 }, { a: 31.9, b: 33.5, f: shot10 }, { a: 33.5, b: 35.0, f: shot11 }, { a: 35.0, b: 36.7, f: shot12 },
  { a: 36.7, b: 38.7, f: shot13 }, { a: 38.7, b: 42.3, f: shot14 }, { a: 42.3, b: 45.9, f: shot15 }, { a: 45.9, b: 49.7, f: shot16 },
  { a: 49.7, b: 54.7, f: shot17 }, { a: 54.7, b: 58.1, f: shot18 }, { a: 58.1, b: 62.0, f: shot19 }, { a: 62.0, b: 65.2, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.2, camera: cam,
  meta: {
    id: '0649',
    v2: true,
    hookLine: '実家の2階の子供部屋から、40代の男が布団ごと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも実家から子供部屋おじさんが消えたら？',
    titleHtml: 'もしも実家から<br>子供部屋おじさんが<br>消えたら？',
    mood: 'emotional', seed: 649, hits: [0.45, 49.7, 54.7], risers: [38.7], impacts: [13.0, 17.2, 27.3, 30.5, 49.9],
    sfx: [[0.45, 'poof'], [5.5, 'alarm'], [9.0, 'whoosh'], [20.3, 'bubble'], [23.0, 'poof'], [27.3, 'poof'], [32.2, 'buzz'], [39.3, 'whoosh'], [43.5, 'meter', 0.4], [47.5, 'bubble']],
    narr: { '35〜44歳': 'さんじゅうごからよんじゅうよんさい', '288万人': 'にひゃくはちじゅうはちまんにん', '約176万人': 'やくひゃくななじゅうろくまんにん', '1か月後': 'いっかげつご', '子供部屋': 'こどもべや', '晩ごはん': 'ばんごはん', '米袋': 'こめぶくろ', '結果：': '結果、', '一人暮らし': 'ひとりぐらし', '駆けつける': 'かけつける', '甘えて': 'あまえて', '実家暮らし': 'じっかぐらし' },
    ask: '実家暮らしの大人、あり？なし？',
    caption: 'もしも実家から子供部屋おじさんが消えたら？\n\n親たちの不満から。いい年して、いつまで家にいるの。\nある日、実家から子供部屋おじさんが全員出ていった。\n35〜44歳で親と暮らす未婚の人は288万人。うち男性は約176万人（2016年）。\n母は喜ぶ。洗濯物も晩ごはんも、半分になる。\nところが1か月後、毎月家に入れていたお金が止まる。年金暮らしの家計に、穴があく。\n電球の交換、重い米袋、スマホの設定。頼める人がいない。\n夜中に父が転んでも、すぐ駆けつける人がいない。\n一方おじさんは、一人暮らしの家賃と家事に追われる。毎日母のごはんを食べていたことに、初めて気づく。\n\n結果：子供部屋おじさんは、親の老後の保険でもあった。\n甘えていたのは、どっちもだったのかもしれない。\n\n実家暮らしの大人、あり？なし？ コメントで教えて。\n\n※風刺ネタです\n出典：総務省統計研修所 西文彦「親と同居の未婚者の最近の状況」（2016年9月。親と同居の壮年未婚者 35〜44歳 288万人、男性 35〜39歳 89万人・40〜44歳 87万人）',
    hashtags: ['もしもラボ', 'もしも', '子供部屋おじさん', '実家暮らし', '親の老後'],
    endStats: [['親と暮らす未婚の35〜44歳', '288万人', '2016年'], ['うち男性', '約176万人', '2016年'], ['子供部屋おじさんは', '親の老後の保険', 'でもあった']],
    sources: '出典：総務省統計研修所 西文彦「親と同居の未婚者の最近の状況」',
  },
});
