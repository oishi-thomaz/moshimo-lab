import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, poseCheer, posePoint, makeSweat } from '../scenes/office.js';

// もしも会社から年功序列が消えたら？（皮肉回・台本 S13・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：はてな匿名ダイアリー・なんJで定期的に燃える 働かないおじさん の話
// 数字（一次資料で確認）：
//  男性の一般労働者の賃金（月の所定内給与）20〜24歳 245.7千円・55〜59歳 445.6千円（男性のピーク。20〜24歳を100とすると181.4）
//  厚生労働省「令和7年 賃金構造基本統計調査 結果の概況」第2表（2026年3月公表）
//  https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2025/dl/14.pdf
//  差 445.6−245.7＝199.9千円 → 約20万円
// 画面に出す金額はこの2つ（とその差）だけ。ほかの人の給料札は数字を出さない

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#1e2432'); S.fog = new THREE.Fog(0x1e2432, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x444a58, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#262c3a', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- A：オフィス（原点）：窓ぎわの席（左）と若手の島 ----------
const ofl = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), mat('#7d8798', { depthWrite: false })); ofl.rotation.x = -Math.PI / 2; ofl.position.set(0, 0.02, 2); ofl.renderOrder = -0.8; S.add(ofl);
const bwall = box(20, 3.4, 0.2, mat('#e6e9ee')); bwall.position.set(0, 1.7, -4); S.add(bwall);
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.5, 0.05, new THREE.MeshBasicMaterial({ color: '#a8cceb' })); w.position.set(-4.6 + i * 2.1, 1.9, -3.87); S.add(w); }
const ISL = makeDeskIsland(2); ISL.position.set(1.6, 0, -0.6); S.add(ISL);
// 窓ぎわの席（1つだけ、窓の前）
const WIN = makeDeskIsland(1); WIN.position.set(-2.4, 0, -2.2); WIN.rotation.y = 0; S.add(WIN);
WIN.userData.monitors.forEach(m => m.visible = false); // 窓ぎわの席は奥の1つだけ使う
const winMon = new THREE.Group(); { const sc = box(0.62, 0.4, 0.04, mat('#22252c')); sc.position.y = 0.26; winMon.add(sc); } S.add(winMon); winMon.position.set(-2.4, 0.77, -2.0);
const newsC = document.createElement('canvas'); newsC.width = 256; newsC.height = 160; { const g = newsC.getContext('2d'); g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#d23a3a'; g.fillRect(0, 0, 256, 34); g.fillStyle = '#fff'; g.font = '900 24px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('ネットニュース', 128, 25); g.fillStyle = '#bbb'; for (let i = 0; i < 4; i++) g.fillRect(16, 50 + i * 26, 224 - (i % 2) * 60, 12); }
const newsT = new THREE.CanvasTexture(newsC); newsT.colorSpace = THREE.SRGBColorSpace;
const news = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), new THREE.MeshBasicMaterial({ map: newsT })); news.position.set(0, 0.26, 0.025); winMon.add(news);
const OJI = makeSuit({ old: true, bald: true, glasses: true, tie: '#7a6a2a' }); S.add(OJI);
const YOUNG = [makeSuit({ tie: '#2a5aa8', hair: '#2a2420' }), makeSuit({ woman: true, hair: '#3a2418', jacket: '#3a4a5a' }), makeSuit({ tie: '#b23a3a' }), makeSuit({ tie: '#3a7a4a', hair: '#4a3020' })];
YOUNG.forEach(p => S.add(p));
const BOSS = makeSuit({ old: true, glasses: true, tie: '#5a2a7a', hair: '#7a7a7a' }); S.add(BOSS);
const clip = box(0.32, 0.42, 0.03, mat('#e8d8a8')); clip.position.set(0.3, 1.0, 0.3); BOSS.add(clip);
// 給料の札
function tag(txt, col) { return label(txt, { w: 640, size: 120, color: '#fff', bg: col, sx: 1.25 }); }
const TAG_O = tag('月44.6万', 'rgba(200,140,40,.96)'); S.add(TAG_O);
const TAG_Y = tag('月24.6万', 'rgba(60,110,200,.96)'); S.add(TAG_Y);
const swapFx = makeSparkles(200, 0.18, 0xffd27a); S.add(swapFx.points); swapFx.init([[-0.4, 2.6, -1.2]], 3.2, 1.4);
const naze = label('なぜ給料が高い？', { w: 1024, size: 100, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 2.0 }); S.add(naze);
const seika = label('成果だけで決まる', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.1 }); S.add(seika);
const shita = label('新人より下', { w: 768, size: 120, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 1.6 }); S.add(shita);
const seitou = label('正当に評価される！', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,160,110,.95)', sx: 2.1 }); S.add(seitou);
const chotto = label('↑ ちょっとだけ', { w: 768, size: 110, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.7 }); S.add(chotto);
const hyouka = label('評価する人', { w: 768, size: 110, color: '#fff', bg: 'rgba(120,70,160,.94)', sx: 1.5 }); S.add(hyouka);
const kotchi = label('お前らも、いつかこっち側', { w: 1024, size: 92, color: '#222', bg: 'rgba(255,255,255,.97)', sx: 2.3 }); S.add(kotchi);
const sweat = makeSweat(); sweat.position.y = 0.22; OJI.userData.head.add(sweat);

// ---------- B：年功のはしご（x=60） ----------
const BX = 60;
const bfl = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#2a2a44', { depthWrite: false })); bfl.rotation.x = -Math.PI / 2; bfl.position.set(BX, 0.02, -3); bfl.renderOrder = -0.8; S.add(bfl);
const STEPS = []; for (let i = 0; i < 7; i++) { const s = box(0.7, 1, 0.8, mat(i < 6 ? '#7fb0e8' : '#e8a84a')); s.geometry.translate(0, 0.5, 0); s.position.set(BX - 2.7 + i * 0.9, 0, -3); S.add(s); STEPS.push(s); }
const nenkou = label('年功序列', { w: 768, size: 130, color: '#fff', bg: 'rgba(60,70,100,.95)', sx: 1.8 }); S.add(nenkou);
const kieta = label('消えた', { w: 512, size: 150, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.3 }); S.add(kieta);
const crumb = makeSparkles(200, 0.2, 0xbfd8ff); S.add(crumb.points); crumb.init([[BX, 2.0, -3]], 5, 2);
// 年齢別の2本の棒
const barA = box(1.4, 1, 1.2, mat('#7fb0e8')); barA.geometry.translate(0, 0.5, 0); barA.position.set(BX + 30 - 1.3, 0, -3); S.add(barA);
const barB = box(1.4, 1, 1.2, mat('#e8a84a')); barB.geometry.translate(0, 0.5, 0); barB.position.set(BX + 30 + 1.3, 0, -3); S.add(barB);
const bfl2 = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2a44', { depthWrite: false })); bfl2.rotation.x = -Math.PI / 2; bfl2.position.set(BX + 30, 0.02, -3); bfl2.renderOrder = -0.8; S.add(bfl2);
const vA = label('24.6万円', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.5 }); S.add(vA);
const vB = label('44.6万円', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.5 }); S.add(vB);
const nA = label('20代前半', { w: 640, size: 100, color: '#ddd', sx: 1.1 }); S.add(nA);
const nB = label('50代後半', { w: 640, size: 100, color: '#ddd', sx: 1.1 }); S.add(nB);
const sa = label('差 約20万円', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.8 }); S.add(sa);
const flow = makeSparkles(160, 0.22, 0xffd27a); S.add(flow.points);

// ---------- C：お金の行き先（x=120） ----------
const CX = 120;
const cfl = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#2e2a40', { depthWrite: false })); cfl.rotation.x = -Math.PI / 2; cfl.position.set(CX, 0.02, -1); cfl.renderOrder = -0.8; S.add(cfl);
const STAR = makeSuit({ tie: '#d0a020', hair: '#1d1a19' }); S.add(STAR);
const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 6), mat('#ffd23a')); crown.position.set(0, 0.56, 0); STAR.userData.head.add(crown);
const CROWD = []; { const r = rng(5); for (let i = 0; i < 8; i++) { const p = makeSuit({ woman: i % 3 === 1, tie: ['#2a5aa8', '#b23a3a', '#3a7a4a'][i % 3], hair: r() < 0.3 ? '#4a3020' : undefined, jacket: i % 3 === 1 ? '#4a4a5a' : undefined }); p.position.set(CX - 3.2 + (i % 4) * 0.9 + (i > 3 ? 4.0 : 0), 0, -1.6 + (i % 2) * 0.6); S.add(p); CROWD.push(p); } }
const ichibu = label('ほんの一部だけ', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.8 }); S.add(ichibu);
const coins = makeSparkles(220, 0.24, 0xffd27a); S.add(coins.points);

// ---------- D：定年までの道（x=170） ----------
const DX = 170;
const road = new THREE.Mesh(new THREE.PlaneGeometry(3, 80), mat('#5a6070', { depthWrite: false })); road.rotation.x = -Math.PI / 2; road.position.set(DX, 0.03, -36); road.renderOrder = -0.8; S.add(road);
const dfl = new THREE.Mesh(new THREE.PlaneGeometry(40, 90), mat('#3a4a3a', { depthWrite: false })); dfl.rotation.x = -Math.PI / 2; dfl.position.set(DX, 0.02, -36); dfl.renderOrder = -0.85; S.add(dfl);
for (let i = 0; i < 16; i++) { const l = box(0.12, 0.02, 1.2, mat('#e8e8e8')); l.position.set(DX, 0.05, -2 - i * 5); S.add(l); }
const teinen = label('定年', { w: 512, size: 150, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.5 }); teinen.position.set(DX, 3.6, -60); S.add(teinen);
const tpole = box(0.2, 3.2, 0.2, mat('#8a8f99')); tpole.position.set(DX, 1.6, -60.2); S.add(tpole);
const RUN = [makeSuit({ tie: '#2a5aa8', hair: '#2a2420' }), makeSuit({ woman: true, hair: '#3a2418', jacket: '#3a4a5a' }), makeSuit({ tie: '#b23a3a' })]; RUN.forEach(p => S.add(p));
const OJI2 = makeSuit({ old: true, bald: true, glasses: true, tie: '#7a6a2a' }); S.add(OJI2);
const ochita = label('一瞬で落ちた', { w: 768, size: 110, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.7 }); S.add(ochita);
const hashiru = label('走り続ける側', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.7 }); S.add(hashiru);
const mirai = label('未来の自分の席', { w: 1024, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.1 }); S.add(mirai);
const spot = new THREE.SpotLight(0xfff2c8, 0, 12, 0.5, 0.5, 1); spot.position.set(-2.4, 4.5, -0.5); spot.target.position.set(-2.4, 0, -2.0); S.add(spot); S.add(spot.target);

const YSEAT = () => ISL.userData.seats.map(s => [s.x + 1.6, s.z - 0.6, s.ry]);
function placeOffice() {
  OJI.visible = true; OJI.position.set(-2.4, 0, -2.9); OJI.rotation.set(0, 0, 0); poseSit(OJI);
  YSEAT().forEach(([x, z, ry], i) => { const p = YOUNG[i]; p.visible = true; p.position.set(x, 0, z); p.rotation.set(0, ry, 0); poseSit(p); });
}
function reset() {
  [OJI, ...YOUNG, BOSS, STAR, ...CROWD, ...RUN, OJI2].forEach(p => { poseClear(p); p.visible = false; });
  [TAG_O, TAG_Y, naze, seika, shita, seitou, chotto, hyouka, kotchi, nenkou, kieta, vA, vB, nA, nB, sa, ichibu, ochita, hashiru, mirai].forEach(l => l.visible = false);
  swapFx.set(0); crumb.set(0); flow.set(0); coins.set(0); sweat.userData.set(0); spot.intensity = 0;
  STEPS.forEach((s, i) => { s.scale.y = 0.8 + i * 0.55; s.position.y = 0; });
  barA.scale.y = barB.scale.y = 0.001; news.visible = true;
  hemi.intensity = 1.15; S.background.set('#1e2432'); el.flash.style.opacity = 0; setHud('', '', 0);
}
// 札の位置：u=0 で元（おじさん44.6万・若手24.6万）、u=1 で入れ替わり
const PO = new THREE.Vector3(-2.2, 2.0, -2.4), PY = new THREE.Vector3(0.7, 2.15, -0.4);
function tags(u, s = 1.25) {
  const e = ease(clamp(u)); TAG_O.visible = TAG_Y.visible = true;
  TAG_O.position.lerpVectors(PO, PY, e); TAG_Y.position.lerpVectors(PY, PO, e);
  TAG_O.position.y += Math.sin(e * Math.PI) * 0.7; TAG_Y.position.y += Math.sin(e * Math.PI) * 0.35;
  TAG_O.userData.size(s); TAG_Y.userData.size(s);
}
function officeCam(d) { look(lerp(-0.7, -0.8, d), 3.1, lerp(7.6, 8.2, d), -0.75, 1.35, -1.4, 52); }
const TP = 0.15;
function shot0(t) { // 0秒＝サムネ：給料の札が、席ごとにくるくる入れ替わる
  reset(); lift(0); placeOffice(); const u = clamp((t - TP) / 0.6); tags(u);
  TAG_O.material.rotation = Math.sin(clamp((t - TP) / 0.6) * Math.PI) * 0.25;
  el.flash.style.opacity = t > TP + 0.25 && t < TP + 0.4 ? 0.25 : 0; swapFx.set(clamp((t - TP) / 1.6));
  OJI.userData.head.rotation.y = t > 0.5 ? 0.4 : 0; YOUNG[0].userData.head.rotation.y = t > 0.6 ? -0.5 : 0;
  officeCam(ease(clamp(t / 2.9)));
  return S;
}
function shot1(t) { // 若手の不満が爆発した
  reset(); lift(0); placeOffice(); tags(0, 1.0);
  YOUNG.forEach((p, i) => { p.userData.head.rotation.y = 0.9 * (p.rotation.y > 1 ? -1 : 1) * 0.6; });
  YOUNG[0].position.y = 0; YOUNG[0].userData.legs.forEach(l => l.rotation.x = 0); YOUNG[0].position.set(0.2, 0, 0.6); YOUNG[0].rotation.y = -0.9; posePoint(YOUNG[0], easeOut(clamp(t / 0.4)));
  el.flash.style.opacity = t > 0.2 && t < 0.32 ? 0.2 : 0;
  look(0.4, 2.6, 6.8, -0.5, 1.5, -1.4, 52);
  return S;
}
function shot2(t) { // 働かない50代の方が、なぜ給料が高い
  reset(); lift(0); placeOffice(); tags(0, 1.15); TAG_Y.visible = false; sweat.userData.set(0);
  OJI.userData.head.rotation.x = 0.1; naze.position.set(-2.4, 3.2, -2.6); pop(naze, t, 0.8, 0.3, 2.0);
  look(-1.6, 2.4, 2.4, -2.4, 1.7, -2.4, 52);
  return S;
}
function stepsCam() { look(BX, 3.2, 9.6, BX, 2.9, -3, 52); }
function shot3(t) { // そして会社から、年功序列が消えた
  reset(); lift(320); const u = easeOut(clamp((t - 1.0) / 0.8));
  STEPS.forEach((s, i) => { s.scale.y = lerp(0.8 + i * 0.55, 1.6, u); });
  nenkou.position.set(BX, 5.2, -3); nenkou.visible = true; nenkou.userData.size(1.8); nenkou.material.opacity = 1 - u * 0.6;
  kieta.position.set(BX + 1.6, 4.8, -2.6); pop(kieta, t, 1.4, 0.3, 1.3); crumb.set(clamp((t - 1.0) / 1.5));
  el.flash.style.opacity = t > 1.0 && t < 1.12 ? 0.25 : 0;
  stepsCam();
  return S;
}
function shot4(t) { // 給料は、やった仕事だけで決まる
  reset(); lift(0); placeOffice(); YOUNG.forEach((p, i) => { p.userData.arms.forEach((a, j) => a.rotation.x = -1.2 + Math.sin(t * 14 + i + j * 2) * 0.12); });
  seika.position.set(1.6, 2.65, -0.6); pop(seika, t, 0.4, 0.3, 2.1);
  look(1.6, 2.6, 4.8, 1.6, 1.4, -0.6, 52);
  return S;
}
function bars(t) { const H = 0.06, u = easeOut(clamp((t - 0.2) / 1.0)), w = easeOut(clamp((t - 1.2) / 1.0));
  barA.scale.y = Math.max(0.001, 24.6 * H * u); barB.scale.y = Math.max(0.001, 44.6 * H * w); barA.visible = u > 0.01; barB.visible = w > 0.01;
  vA.visible = u > 0.5; vB.visible = w > 0.5; vA.position.set(BX + 30 - 1.3, 24.6 * H * u + 0.45, -2.4); vB.position.set(BX + 30 + 1.3, 44.6 * H * w + 0.45, -2.4);
  nA.visible = u > 0.5; nB.visible = w > 0.5; nA.position.set(BX + 30 - 1.3, 24.6 * H * u + 1.05, -2.4); nB.position.set(BX + 30 + 1.3, 44.6 * H * w + 1.05, -2.4); }
function barCam() { look(BX + 30, 2.4, 7.0, BX + 30, 2.0, -3, 52); }
function shot5(t) { // 男性の給料は、20代前半で月24.6万円
  reset(); lift(200); bars(Math.min(t, 1.1)); barB.visible = false; vB.visible = false; nB.visible = false;
  barCam(); setTop('男性の給料（月・2025年）', '20代前半 24.6万円', fade(t, 0.3, 4.8, 0.25), BLUE);
  return S;
}
function shot6(t) { // 50代後半で44.6万円
  reset(); lift(200); bars(t + 1.2); barCam();
  setTop('男性の給料（月・2025年）', '50代後半 44.6万円', fade(t, 0.2, 3.2, 0.25), GOLD);
  return S;
}
function shot7(t) { // その差、約20万円が一晩で動き出す
  reset(); lift(200); bars(9); sa.position.set(BX + 30 - 1.1, 3.35, -2.0); pop(sa, t, 0.3, 0.3, 1.8);
  flow.init([[BX + 30 + 1.3, 2.5, -2.6]], 0.6, 0.6); flow.set(0); const u = clamp((t - 1.0) / 2.0); flow.set(u); flow.points.position.set(-2.6 * ease(u), -1.0 * ease(u), 0);
  barCam(); setHud('経過時間', '一晩', fade(t, 0.05, 3.2, 0.2));
  return S;
}
function shot8(t) { // 窓ぎわでネットニュースを見ていたおじさんの給料が、
  reset(); lift(0); placeOffice(); const u = clamp((t - 0.6) / 3.0);
  look(lerp(-1.4, -1.8, u), 2.2, lerp(2.4, 2.0, u), -2.4, 1.45, -2.2, 52);
  TAG_O.visible = true; TAG_O.position.set(-2.4, 2.35, -2.6); TAG_O.userData.size(1.0);
  return S;
}
function shot9(t) { // 新人より下に
  reset(); lift(0); placeOffice(); tags(1, 1.0); TAG_Y.visible = false; TAG_O.visible = false; sweat.userData.set(1, t);
  shita.position.set(-2.4, 2.4, -2.5); shita.visible = true; shita.userData.size(1.6 * (t < 0.15 ? 1.3 : 1)); OJI.userData.head.rotation.x = 0.3;
  el.flash.style.opacity = t < 0.12 ? 0.25 : 0;
  look(-1.6, 2.2, 2.2, -2.4, 1.6, -2.4, 52);
  return S;
}
function shot10(t) { // 若手は大喜び。これで正当に評価される
  reset(); lift(0); placeOffice(); YOUNG.forEach((p, i) => { poseClear(p); p.rotation.y = 0.1 * i; p.position.z += (p.position.z < -0.6 ? -0.3 : 0.3); poseCheer(p, t + i * 0.3); });
  seitou.position.set(1.6, 3.1, -0.6); pop(seitou, t, 0.5, 0.3, 2.0);
  look(1.6, 2.6, 5.8, 1.6, 1.6, -0.6, 52);
  return S;
}
function shot11(t) { // ところが翌月、若手の給料も思ったほど上がらない
  reset(); lift(0); placeOffice(); YOUNG.forEach(p => { p.userData.head.rotation.x = 0.35; });
  TAG_Y.visible = true; TAG_Y.position.set(1.6, 2.5, -0.6); TAG_Y.userData.size(1.25); chotto.position.set(1.6, 1.75, 0.2); pop(chotto, t, 1.4, 0.3, 1.6);
  setHud('経過時間', '翌月', fade(t, 0.05, 3.9, 0.2));
  look(1.6, 2.6, 5.2, 1.6, 1.7, -0.6, 52);
  return S;
}
function shot12(t) { // 浮いたお金は、ほんの一部の成果を出した人にだけ回った
  reset(); lift(0); STAR.visible = true; STAR.position.set(CX, 0, -1.2); poseCheer(STAR, t * 0.6); CROWD.forEach(p => { p.visible = true; p.rotation.y = (p.position.x < CX ? 0.6 : -0.6); p.userData.head.rotation.x = 0.2; });
  coins.init([[CX - 6, 4, -1], [CX + 6, 4, -1]], 1.0, 0.4); const u = clamp((t - 0.4) / 2.6); coins.set(Math.min(0.95, u)); coins.points.position.set(0, 0, 0);
  // コインは左右から主役へ寄っていく
  const p = coins.points.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setX(i, lerp(x, CX + (x - CX) * 0.05, ease(u))); p.setY(i, lerp(y, 2.0 + (y - 4) * 0.2, ease(u))); } p.needsUpdate = true;
  ichibu.position.set(CX, 3.2, -1.2); pop(ichibu, t, 1.0, 0.3, 1.7);
  look(CX, 2.6, 5.8, CX, 1.9, -1.2, 52);
  return S;
}
function shot13(t) { // しかも、評価するのは結局おじさんの上司
  reset(); lift(0); placeOffice(); BOSS.visible = true; BOSS.position.set(2.6, 0, 0.9); BOSS.rotation.y = -0.9; BOSS.userData.arms[1].rotation.x = -1.0;
  hyouka.position.set(2.2, 2.75, 0.9); pop(hyouka, t, 0.6, 0.3, 1.4);
  look(1.6, 2.5, 6.2, 1.6, 1.6, -0.2, 52);
  return S;
}
function shot14(t) { // おじさんは言う。お前らも、いつかこっち側だぞ
  reset(); lift(0); placeOffice(); OJI.position.set(-1.6, 0, -1.2); OJI.rotation.set(0, 0.8, 0); poseClear(OJI); posePoint(OJI, easeOut(clamp((t - 0.3) / 0.4)));
  kotchi.position.set(-0.6, 2.65, -0.9); pop(kotchi, t, 0.6, 0.3, 2.0);
  look(-0.6, 2.3, 5.2, -0.6, 1.6, -1.0, 52);
  return S;
}
function shot15(t) { // 結果：おじさんは一瞬で落ちた
  reset(); lift(0); OJI2.visible = true; OJI2.position.set(DX + 0.5, 0, -0.4); OJI2.rotation.y = -0.2; poseSit(OJI2); OJI2.position.y = -0.38 * 1 - 0.0; OJI2.userData.head.rotation.x = 0.4;
  RUN.forEach((p, i) => { p.visible = true; p.position.set(DX - 0.6 + i * 0.6, 0, -2.5 - i * 0.7 - t * 1.2); p.rotation.y = Math.PI; const s = Math.sin(t * 10 + i) * 0.7; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s; p.userData.arms[1].rotation.x = s; });
  ochita.position.set(DX + 0.4, 1.75, -0.3); pop(ochita, t, 0.4, 0.3, 1.5);
  look(DX + 0.3, 2.3, 4.4, DX + 0.1, 1.2, -3.0, 52);
  setTop('結果', '一瞬で落ちた', fade(t, 0.15, 2.3, 0.25), RED);
  return S;
}
function shot16(t) { // でも若手も、定年まで走り続ける側になった
  reset(); lift(0); RUN.forEach((p, i) => { p.visible = true; p.position.set(DX - 0.6 + i * 0.6, 0, -6 - i * 0.7 - t * 1.6); p.rotation.y = Math.PI; const s = Math.sin(t * 10 + i) * 0.7; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[0].rotation.x = -s; p.userData.arms[1].rotation.x = s; });
  hashiru.position.set(DX, 3.0, -9 - t * 1.6); pop(hashiru, t, 0.6, 0.3, 1.7);
  look(DX + 0.6, 3.4, -1.0 - t * 1.6, DX, 1.8, -14 - t * 1.6, 52);
  setTop('結果', '若手も走り続ける側', fade(t, 0.15, 3.4, 0.25), RED);
  return S;
}
function shot17(t) { // 働かないおじさんは、未来の自分の席だったのかもしれない
  reset(); lift(0); placeOffice(); OJI.visible = false; news.visible = false; hemi.intensity = 0.7; spot.intensity = 30;
  mirai.position.set(-2.4, 2.5, -2.4); pop(mirai, t, 0.8, 0.35, 2.0);
  YOUNG[2].userData.head.rotation.y = 1.0;
  const u = ease(clamp(t / 4.3)); look(lerp(-0.4, -1.4, u), 2.4, lerp(4.4, 3.2, u), -2.4, 1.4, -2.2, 52);
  return S;
}
function shot18(t) { // 質問。最後は冒頭と同じ構図（札は入れ替わったまま）
  reset(); lift(0); placeOffice(); tags(1); officeCam(0);
  return S;
}

const SUBS = [
  [3.35, 5.28, '若手の不満が<br>爆発した。'],
  [5.33, 8.9, '働かない50代の方が、<br>なぜ給料が高い。'],
  [8.95, 11.7, 'そして会社から、<br>年功序列が消えた。'],
  [11.75, 14.22, '給料は、やった<br>仕事だけで決まる。'],
  [14.27, 19.22, '男性の給料は、<br>20代前半で月24.6万円。'],
  [19.27, 22.58, '50代後半で<br>44.6万円。'],
  [22.63, 25.92, 'その差、約20万円が<br>一晩で動き出す。'],
  [25.97, 29.68, '窓ぎわでネットニュースを<br>見ていたおじさんの給料が、'],
  [29.73, 30.97, '新人より下に。'],
  [31.02, 34.46, '若手は大喜び。<br>これで正当に評価される。'],
  [34.51, 38.49, 'ところが翌月、若手の<br>給料も思ったほど上がらない。'],
  [38.54, 42.81, '浮いたお金は、ほんの一部の<br>成果を出した人にだけ回った。'],
  [42.86, 46.02, 'しかも、評価するのは<br>結局おじさんの上司。'],
  [46.07, 49.35, 'おじさんは言う。お前らも、<br>いつかこっち側だぞ。'],
  [49.4, 51.74, '結果：おじさんは<br>一瞬で落ちた。'],
  [51.79, 55.36, 'でも若手も、定年まで<br>走り続ける側になった。'],
  [55.41, 59.82, '働かないおじさんは、未来の<br>自分の席だったのかも。'],
  [59.87, 62.2, '給料は年齢？<br>それとも成果？'],
];
const shots = [
  { a: 0, b: 3.35, f: shot0 }, { a: 3.35, b: 5.33, f: shot1 }, { a: 5.33, b: 8.95, f: shot2 }, { a: 8.95, b: 11.75, f: shot3 }, { a: 11.75, b: 14.27, f: shot4 }, { a: 14.27, b: 19.27, f: shot5 }, { a: 19.27, b: 22.63, f: shot6 }, { a: 22.63, b: 25.97, f: shot7 }, { a: 25.97, b: 29.73, f: shot8 }, { a: 29.73, b: 31.02, f: shot9 }, { a: 31.02, b: 34.51, f: shot10 }, { a: 34.51, b: 38.54, f: shot11 }, { a: 38.54, b: 42.86, f: shot12 }, { a: 42.86, b: 46.07, f: shot13 }, { a: 46.07, b: 49.4, f: shot14 }, { a: 49.4, b: 51.79, f: shot15 }, { a: 51.79, b: 55.41, f: shot16 }, { a: 55.41, b: 59.87, f: shot17 }, { a: 59.87, b: 62.25, f: shot18 }, { a: 62.25, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0637',
    v2: true,
    hookLine: '会社から、年功序列が消えた。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも会社から年功序列が消えたら？',
    titleHtml: 'もしも会社から<br>年功序列が<br>消えたら？',
    mood: 'tension', seed: 637, hits: [0.3, 49.4, 55.41], risers: [46.07], impacts: [8.95, 14.27, 19.27, 22.63, 29.73, 34.51, 49.4],
    sfx: [[0.3, 'whoosh'], [3.55, 'buzz'], [10.0, 'poof'], [16.6, 'whoosh'], [24.0, 'whoosh'], [29.8, 'alarm'], [31.5, 'bubble'], [36.0, 'meter', 0.3], [39.1, 'bubble'], [39.7, 'bubble'], [40.3, 'bubble'], [46.7, 'buzz'], [52.2, 'whoosh'], [56.2, 'whoosh']],
    narr: { '50代': 'ごじゅうだい', '20代前半': 'にじゅうだいぜんはん', '24.6万円': 'にじゅうよんてんろくまんえん', '44.6万円': 'よんじゅうよんてんろくまんえん', '約20万円': 'やくにじゅうまんえん', '一晩': 'ひとばん', '翌月': 'よくげつ', '結果：': '結果、', '窓ぎわ': 'まどぎわ', '一瞬': 'いっしゅん', 'だったのかも。': 'だったのかもしれない。', '年功序列': 'ねんこうじょれつ' },
    ask: '給料は年齢？それとも成果？',
    caption: 'もしも、会社から年功序列が消えたら？\n\n若手の不満が爆発した。働かない50代の方が、なぜ給料が高い。\nそして会社から、年功序列が消えた。給料は、やった仕事だけで決まる。\n男性の給料は、20代前半で月24.6万円。50代後半で44.6万円。その差、約20万円が一晩で動き出す。\n窓ぎわでネットニュースを見ていたおじさんの給料が、新人より下に。若手は大喜び。これで正当に評価される。\nところが翌月、若手の給料も思ったほど上がらない。浮いたお金は、ほんの一部の成果を出した人にだけ回った。しかも、評価するのは結局おじさんの上司。\nおじさんは言う。お前らも、いつかこっち側だぞ。\n\n結果：おじさんは一瞬で落ちた。でも若手も、定年まで走り続ける側になった。\n働かないおじさんは、未来の自分の席だったのかもしれない。\n\n給料は年齢？それとも成果？ コメントで教えて。\n\n※風刺ネタです\n出典：厚生労働省「令和7年 賃金構造基本統計調査 結果の概況」（男性の一般労働者の賃金 20〜24歳 24万5,700円・55〜59歳 44万5,600円）',
    hashtags: ['もしもラボ', 'もしも', '年功序列', '働かないおじさん', '給料'],
    endStats: [['男性の給料（20代前半）', '月24.6万円', '2025年'], ['男性の給料（50代後半）', '月44.6万円', '2025年・ピーク'], ['その差', '約20万円', '']],
    sources: '出典：厚生労働省「令和7年 賃金構造基本統計調査」',
  },
});
