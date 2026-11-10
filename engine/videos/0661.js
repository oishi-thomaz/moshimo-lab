import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSuit, makeChair, makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, poseRun, makeStairs, planTimes } from '../scenes/fitness.js';

// もしもエレベーターをやめて毎日階段にしたら？（台本 S66・人体の限界）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）
// 数字（一次資料で確認済み 2026/11/10）：
//  Song Z ほか. Daily stair climbing, disease susceptibility, and risk of atherosclerotic cardiovascular disease: A prospective cohort study.
//   Atherosclerosis 2023（doi:10.1016/j.atherosclerosis.2023.117300、UK Biobank の論文ページで確認）
//   UK Biobank の成人 458,860人・追跡の中央値12.5年。1日の階段 0回と比べた ASCVD のハザード比 6〜10回 0.84（0.82–0.87）、1〜5回 0.97（差なし）
//   はじめ上っていて途中でやめた人は、2回とも5回未満の人と比べて HR 1.32（1.06–1.65）
//  1回（1階分）＝約10段：UK Biobank の質問票 field 943「a flight of stairs (approx 10 steps)」
//  観察研究（関連）なので、階段で病気が防げるとは言わない（画面に 観察研究 と出す）

const GOLD = '#ffd27a', RED = '#ff6a5a', GREEN = '#9be86a', BLUE = '#7fd4ff';
const S = new THREE.Scene();
S.background = new THREE.Color('#9fc8e8'); S.fog = new THREE.Fog(0x9fc8e8, 60, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(8, 16, 10); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 600), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.95; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const OJI = () => addKnees(makeSuit({ old: true, bald: true, jacket: '#3a4256', tie: '#c8423a' }));

// ---------- A：会社のエレベーターホール（原点） ----------
flat(14, 10, '#c9c4b8', 0, 1);
const wallA = box(14, 4.2, 0.2, mat('#e4e0d8')); wallA.position.set(0, 2.1, -2); S.add(wallA);
const DOORS = []; for (const x of [-1.6, 1.6]) { const fr = box(1.9, 2.5, 0.08, mat('#8a8e98')); fr.position.set(x, 1.25, -1.88); S.add(fr); for (const s of [-1, 1]) { const d = box(0.82, 2.3, 0.04, mat('#c8ccd4')); d.position.set(x + s * 0.42, 1.18, -1.82); S.add(d); DOORS.push(d); } const ind = box(0.9, 0.3, 0.04, mat('#1a1c22')); ind.position.set(x, 2.8, -1.86); S.add(ind); }
const panel = box(0.22, 0.45, 0.05, mat('#9aa0aa')); panel.position.set(0, 1.25, -1.86); S.add(panel);
const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); btn.rotation.x = Math.PI / 2; btn.position.set(0, 1.32, -1.82); S.add(btn);
function makePaper(lines, { w = 1.0, h = 1.3, color = '#d62a2a' } = {}) {
  const c = document.createElement('canvas'); c.width = 600; c.height = Math.round(600 * h / w); const g = c.getContext('2d');
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = color; g.lineWidth = 14; g.strokeRect(20, 20, c.width - 40, c.height - 40);
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([s, px, y]) => { g.font = `900 ${px}px "Noto Sans CJK JP", sans-serif`; g.fillText(s, c.width / 2, c.height * y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
}
const STOP = makePaper([['使用中止', 130, 0.38], ['階段を', 80, 0.62], ['ご利用ください', 70, 0.78]], { w: 1.15, h: 1.3 }); S.add(STOP);
const A_OJI = OJI(); S.add(A_OJI); const sweatA = makeSweat(); A_OJI.userData.head.add(sweatA);
const QUEUE = [0, 1, 2, 3, 4].map(i => { const p = i % 2 ? makeWoman({ shirt: ['#e9e4da', '#9fc7a8'][i % 2], hair: '#3a2620' }) : makeSuit({ jacket: ['#4a5060', '#5a4a3a', '#3a4a5a'][i % 3], tie: '#3a6ab2' }); S.add(p); return p; });
const stairDoor = box(1.1, 2.3, 0.06, mat('#3a8a5a')); stairDoor.position.set(5.2, 1.15, -1.86); S.add(stairDoor);
const stairSign = label('階段', { w: 400, size: 110, color: '#fff', bg: 'rgba(52,150,90,.96)', sx: 0.75 }); stairSign.position.set(5.2, 2.75, -1.7); S.add(stairSign);
const bang = label('バン', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(bang);
const yokome = label('横目に', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.95 }); S.add(yokome);

// ---------- B：会社のビル（x=60）：5階の窓が光る ----------
const BX = 60;
flat(30, 20, '#9a9a96', BX, 2);
const FLOOR_H = 3.2;
const bldg = box(12, FLOOR_H * 5 + 0.6, 8, mat('#d8dde4')); bldg.position.set(BX, (FLOOR_H * 5 + 0.6) / 2, -6); S.add(bldg);
const WINS = []; for (let f = 0; f < 5; f++) for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: '#7ea6c8' })); w.position.set(BX - 4.4 + i * 2.2, 1.9 + f * FLOOR_H, -1.98); S.add(w); WINS.push({ w, f }); }
const fiveF = label('5F', { w: 400, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); fiveF.position.set(BX + 7.2, 1.9 + 4 * FLOOR_H, -1.6); S.add(fiveF);
const B_OJI = OJI(); S.add(B_OJI);
const zetsu = label('絶望', { w: 400, size: 120, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.8 }); S.add(zetsu);

// ---------- C：階段室（x=120） ----------
const CX = 120, N = 18, RISE = 0.17, RUN = 0.3, TOPY = N * RISE;
flat(12, 12, '#b9b4aa', CX, 2);
const STAIRS = makeStairs({ n: N, rise: RISE, run: RUN, w: 1.8 }); STAIRS.position.set(CX, 0, 0); S.add(STAIRS);
const cwall = box(0.2, 8, 14, mat('#e2ded6')); cwall.position.set(CX - 1.4, 4, -2); S.add(cwall);
const landing = box(4, TOPY, 4, mat('#b9b4aa')); landing.position.set(CX, TOPY / 2 - 0.002, -N * RUN - 2); S.add(landing);
const floorSign = label('3F', { w: 400, size: 140, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 0.9 }); floorSign.position.set(CX - 1.25, TOPY + 2.9, -N * RUN - 1.2); S.add(floorSign);
const C_OJI = OJI(); S.add(C_OJI); const sweatC = makeSweat(); C_OJI.userData.head.add(sweatC);
const haa = label('ハァ…ハァ…', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.25 }); S.add(haa);
const ut = label('うっ', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(ut);
const kinniku = label('筋肉痛', { w: 512, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.95 }); S.add(kinniku);
const COUNTER = label('0段', { w: 600, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.2 }); S.add(COUNTER);
const sparkC = makeSparkles(100, 0.18, 0xfff2c0); S.add(sparkC.points); sparkC.init([[CX + 0.3, TOPY + 2.2, -N * RUN - 0.4]], 1.0, 1.4);

// ---------- D：健康診断の結果（x=180） ----------
const DX = 180;
flat(10, 8, '#8a8070', DX, 0);
const dwall = box(10, 3.6, 0.2, mat('#e6e2da')); dwall.position.set(DX, 1.8, -2.4); S.add(dwall);
const desk = box(1.8, 0.08, 0.9, mat('#e8e4dc')); desk.position.set(DX, 0.74, -1.0); S.add(desk);
const dleg = box(1.7, 0.7, 0.05, mat('#9aa0aa')); dleg.position.set(DX, 0.37, -0.6); S.add(dleg);
const KENSHIN = makePaper([['健康診断の結果', 64, 0.16], ['運動', 150, 0.45], ['しましょう', 90, 0.68]], { w: 0.7, h: 0.95, color: '#2a5ab0' }); S.add(KENSHIN);
const chair = makeChair(); chair.position.set(DX, 0, -0.1); chair.rotation.y = Math.PI; S.add(chair);
const D_OJI = OJI(); S.add(D_OJI);
const jikan = label('時間がない', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(jikan);
const clockD = label('22:00', { w: 600, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.0 }); clockD.position.set(DX + 1.7, 2.6, -2.2); S.add(clockD);

// ---------- E：45万人の研究（x=240） ----------
const EX = 240;
flat(60, 40, '#a8b090', EX, -8);
const CROWD = []; { const r = rng(66); for (let i = 0; i < 70; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#e9e4da'][i % 5], hair: ['#3a2620', '#9a9a9a', '#6b4a33'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c'][i % 5], hair: ['#1d1a19', '#9a9a9a', '#4a3426'][i % 3], bald: r() < 0.2 }); p.position.set(EX - 9 + (i % 10) * 2 + (r() - 0.5) * 0.6, 0, -2 - Math.floor(i / 10) * 2.2 + (r() - 0.5) * 0.6); p.rotation.y = (r() - 0.5) * 0.6; S.add(p); CROWD.push(p); } }
const year = label('12年半', { w: 600, size: 130, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 1.5 }); S.add(year);
const kansatsu = label('観察研究', { w: 600, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(kansatsu);
const HEARTS = []; { const sh = new THREE.Shape(); sh.moveTo(0, 0.25); sh.bezierCurveTo(0, 0.5, 0.5, 0.5, 0.5, 0.2); sh.bezierCurveTo(0.5, -0.05, 0.2, -0.2, 0, -0.45); sh.bezierCurveTo(-0.2, -0.2, -0.5, -0.05, -0.5, 0.2); sh.bezierCurveTo(-0.5, 0.5, 0, 0.5, 0, 0.25);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }); for (let i = 0; i < 2; i++) { const h = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: i ? '#3fb27a' : '#e0404a' })); S.add(h); HEARTS.push(h); } }

const OJIS = [A_OJI, B_OJI, C_OJI, D_OJI];
const LABELS = [bang, yokome, zetsu, haa, ut, kinniku, COUNTER, jikan, year, kansatsu];
function reset() {
  OJIS.forEach(p => { fitReset(p); p.visible = true; });
  LABELS.forEach(l => { l.visible = false; l.material.opacity = 1; }); sweatA.userData.set(0); sweatC.userData.set(0); sparkC.set(0);
  STOP.visible = false; QUEUE.forEach(p => p.visible = false); HEARTS.forEach(h => h.visible = false);
  A_OJI.position.set(0.3, 0, 0.6); A_OJI.rotation.set(0, 0, 0);
  B_OJI.position.set(BX + 1, 0, 6); B_OJI.rotation.y = Math.PI;
  D_OJI.visible = true; D_OJI.position.set(DX, 0, -0.1); C_OJI.position.set(CX, 0, 2); KENSHIN.position.set(DX, 0.79, -0.95); KENSHIN.rotation.set(-Math.PI / 2, 0, 0); C_OJI.rotation.order = 'YXZ';
  floorSign.userData.set('3F'); WINS.forEach(o => o.w.material.color.set('#7ea6c8'));
  el.flash.style.opacity = 0; hemi.intensity = 1.25;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function climb(p, s, ph, amp = 1) { const [y, z] = STAIRS.userData.at(s); p.position.set(CX + 0.3, y, z - RUN * 0.5); p.rotation.y = Math.PI; poseRun(p, ph, amp); }
function stairCam(s, d = 6.4, dy = 0.9) { const [y, z] = STAIRS.userData.at(s); const ty = y + 1.2, tz = z - RUN * 0.5; look(CX + 0.3 + d, ty + dy, tz + 1.4, CX + 0.3, ty, tz, 50); }
const TP = 0.45;
function lobbyCam(u = 0) { look(lerp(1.2, 1.0, u), 1.9, lerp(5.4, 5.0, u), 0.35, 1.95, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：エレベーターのボタンに 使用中止 の紙がバンと貼られる
  reset(); lift(60); A_OJI.position.set(1.3, 0, 0.5); A_OJI.rotation.y = -0.35; A_OJI.userData.arms[1].rotation.set(-1.2, 0, 0.3);
  STOP.visible = true; const k = easeOut(clamp(t / TP)); STOP.position.set(0, 1.4, lerp(-0.6, -1.8, k)); STOP.scale.setScalar(lerp(1.25, 1, k)); STOP.rotation.z = lerp(0.25, -0.05, k);
  if (t > TP) { say(bang, t, TP, -1.0, 2.35, -1.5, 0.75); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; A_OJI.userData.arms[1].rotation.set(-0.3, 0, 0); A_OJI.userData.head.rotation.x = -0.1; }
  lobbyCam(ease(clamp(t / 3)));
  return S;
}
function sMiage(t) { // 5階の職場を見上げて、
  reset(); lift(0); B_OJI.userData.head.rotation.x = -0.5; WINS.forEach(o => { if (o.f === 4) o.w.material.color.set(t % 0.6 < 0.3 ? '#ffe08a' : '#7ea6c8'); });
  pop(fiveF, t, 0.4, 0.3, 1.4);
  const u = ease(clamp(t / 3)); look(BX + 3.5, lerp(1.2, 0.9, u), lerp(14, 13, u), BX, 9, -4, 52);
  return S;
}
function sZetsubo(t) { // 営業のおじさんが絶望する。
  reset(); lift(150); B_OJI.rotation.y = 0; B_OJI.position.set(BX + 1, 0, 6); B_OJI.userData.head.rotation.x = 0.4; B_OJI.rotation.x = 0.2; B_OJI.userData.arms.forEach(a => a.rotation.set(0.1, 0, 0));
  say(zetsu, t, 0.5, BX + 1.7, 2.3, 6, 0.8);
  look(BX + 2.2, 1.9, 10.2, BX + 1, 1.3, 6, 46);
  return S;
}
function sIibun(t) { // おじさんの言い分から。
  reset(); lift(150); D_OJI.position.set(DX, -0.36, -0.1); D_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); D_OJI.userData.knees.forEach(k => k.rotation.x = Math.PI / 2); D_OJI.rotation.y = Math.PI;
  KENSHIN.position.set(DX, 0.79, -0.95); KENSHIN.rotation.x = -Math.PI / 2;
  look(DX + 1.2, 2.3, 2.6, DX, 1.2, -0.9, 50);
  return S;
}
function sKenshin(t) { // 健康診断で運動しろと言われても、時間がない。
  reset(); lift(150); D_OJI.position.set(DX, -0.36, -0.1); D_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); D_OJI.userData.knees.forEach(k => k.rotation.x = Math.PI / 2); D_OJI.rotation.y = Math.PI;
  D_OJI.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); KENSHIN.position.set(DX, 1.35, -0.62); KENSHIN.rotation.set(0, Math.PI, 0);
  if (t > 1.4) { say(jikan, t, 1.4, DX - 0.9, 2.35, -1.0, 1.2); D_OJI.userData.head.rotation.y = Math.sin(t * 6) * 0.3; }
  look(DX + 0.4, 1.8, -2.25, DX, 1.3, 0, 52);
  return S;
}
function sDay1(t, d) { // 1日目。3階で息が切れて、
  reset(); lift(80); const s = Math.min(N - 3, 6 + t * 2.4); climb(C_OJI, s, t * 9, 0.8); sweatC.userData.set(clamp(t / 1), t);
  setHud('1日目', '3階', 1); stairCam(s);
  return S;
}
function sTesuri(t) { // 手すりにしがみつく。
  reset(); lift(80); const s = N - 3; climb(C_OJI, s, 0, 0.2); C_OJI.rotation.x = 0.45; C_OJI.position.x = CX + 0.75; C_OJI.userData.arms[1].rotation.set(-1.0, 0, -0.5); C_OJI.userData.arms[0].rotation.set(-0.6, 0, 0.2); C_OJI.userData.head.rotation.x = -0.2 + Math.sin(t * 8) * 0.06; sweatC.userData.set(1, t);
  say(haa, t, 0.4, CX - 0.3, STAIRS.userData.at(s)[0] + 2.3, STAIRS.userData.at(s)[1], 1.1);
  setHud('1日目', '3階', 1); stairCam(s, 5.2, 0.6);
  return S;
}
function sDay3(t) { // 3日目。前の日の筋肉痛で、
  reset(); lift(80); const s = 3 + Math.floor(t * 1.2); climb(C_OJI, s, 0, 0.15); C_OJI.userData.legs[0].rotation.x = -0.5; C_OJI.userData.knees[0].rotation.x = 0.6; C_OJI.rotation.x = 0.25; C_OJI.userData.arms[1].rotation.set(-0.5, 0, -0.6);
  say(kinniku, t, 0.5, CX - 0.2, STAIRS.userData.at(s)[0] + 2.5, STAIRS.userData.at(s)[1], 0.95);
  setHud('3日目', 'ふくらはぎ', 1); stairCam(s, 5.4, 0.6);
  return S;
}
function sKoe(t) { // 1段ごとに声が出る。
  reset(); lift(80); const ph = t * 1.4; const s = 5 + Math.floor(ph); const u = ph % 1; climb(C_OJI, s + easeOut(clamp(u / 0.4)), 0, 0.15); C_OJI.userData.legs[0].rotation.x = -0.5 * (1 - clamp(u / 0.4)); C_OJI.rotation.x = 0.25; C_OJI.userData.head.rotation.x = u < 0.4 ? -0.3 : 0;
  ut.position.set(CX - 0.3, STAIRS.userData.at(s)[0] + 2.4, STAIRS.userData.at(s)[1]); ut.visible = u < 0.55; ut.userData.size(0.7 * (1 + 0.15 * (1 - clamp(u / 0.2))));
  setHud('3日目', 'ふくらはぎ', 1); stairCam(s, 5.4, 0.6);
  return S;
}
function sWeek(t, d) { // 1週間後。エレベーター待ちの列を横目に、階段へ。
  reset(); lift(60); QUEUE.forEach((p, i) => { p.visible = true; p.position.set(-1.6 + (i % 2) * 0.5 - 0.25, 0, 0.2 + Math.floor(i / 1) * 0.55); p.rotation.y = Math.PI; p.userData.head.rotation.x = 0.3; });
  const k = clamp(t / (d - 0.4)); A_OJI.position.set(lerp(-2.0, 5.2, k), 0, lerp(1.6, -1.0, clamp((k - 0.75) / 0.25))); A_OJI.rotation.y = Math.PI / 2; poseRun(A_OJI, t * 9, 0.55); A_OJI.rotation.x = 0.05; A_OJI.userData.head.rotation.y = k < 0.45 ? 0.9 : 0;
  if (t > 0.8 && t < 2.6) say(yokome, t, 0.8, A_OJI.position.x, 2.6, A_OJI.position.z, 0.95);
  setHud('1週間後', '階段へ', 1); look(1.8, 2.6, 8.6, 1.6, 1.3, -0.5, 52);
  return S;
}
function s50(t, d) { // 5階分の階段は、だいたい50段。
  reset(); lift(80); const s = clamp(t / (d - 0.6)) * (N - 1); climb(C_OJI, s, t * 10, 0.85); floorSign.userData.set('5F');
  const n = Math.round(clamp(t / (d - 0.6)) * 50); COUNTER.visible = true; COUNTER.userData.set(n + '段'); const [y, z] = STAIRS.userData.at(s); COUNTER.position.set(CX - 0.4, y + 2.6, z - 0.4);
  setHud('1階分', '約10段', 1); stairCam(s, 6.4, 0.9);
  return S;
}
function crowdCam(u) { look(EX, lerp(6, 9, u), lerp(10, 14, u), EX, 0.5, -6, 52); }
function sStudy(t, d) { // イギリスの45万人以上を、
  reset(); lift(250); crowdCam(ease(clamp(t / d)) * 0.6);
  setTop('イギリス UK Biobank の大人', '45万8,860人', fade(t, 0.3, d, 0.25), BLUE);
  return S;
}
function sYears(t, d) { // 12年半追いかけた研究がある。
  reset(); lift(250); crowdCam(0.6 + ease(clamp(t / d)) * 0.4); CROWD.forEach((p, i) => { p.userData.legs[0].rotation.x = Math.sin(t * 6 + i) * 0.3; p.userData.legs[1].rotation.x = -Math.sin(t * 6 + i) * 0.3; });
  say(year, t, 0.3, EX - 2.5, 4.2, -4, 1.6); say(kansatsu, t, 0.8, EX + 3, 4.2, -4, 1.3);
  setTop('追跡の中央値（2023年の論文）', '12.5年', fade(t, 0.3, d, 0.25), BLUE);
  return S;
}
function sOver(t, d) { // 1日に5階分を超えて上る人は、
  reset(); lift(80); const s = clamp(t / d) * (N - 1); climb(C_OJI, s, t * 10, 0.85); floorSign.userData.set('6F');
  setHud('1日', '6〜10階分', 1); stairCam(s);
  return S;
}
function s16(t, d) { // 心臓や血管の病気のなりやすさが約16%低かった。
  reset(); lift(80); climb(C_OJI, N - 0.2, 0, 0.1); C_OJI.rotation.y = Math.PI / 2; C_OJI.userData.arms[1].rotation.set(0, 0, 2.6); floorSign.userData.set('6F');
  const [y, z] = STAIRS.userData.at(N); HEARTS[1].visible = true; HEARTS[1].position.set(CX - 0.3, y + 2.5 + Math.sin(t * 3) * 0.05, z - 0.5); HEARTS[1].rotation.y = Math.PI / 2 + t * 0.8; HEARTS[1].scale.setScalar(easeOut(clamp((t - 0.3) / 0.4)) * 1.1);
  sparkC.set(clamp((t - 0.4) / 1.6));
  setTop('心臓・血管の病気のなりやすさ', '約16%低い', fade(t, 0.3, d, 0.25), GREEN); setHud('0回の人と比べて', '観察研究', 1);
  stairCam(N - 0.2, 5.6, 0.7);
  return S;
}
function sStop(t, d) { // ところが、途中で上るのをやめた人は、
  reset(); lift(150); A_OJI.position.set(1.6, 0, 0.2); A_OJI.rotation.y = -0.5; A_OJI.userData.head.rotation.x = 0.1; QUEUE.forEach((p, i) => { p.visible = i < 3; p.position.set(-1.6 + i * 0.5, 0, 0.0 + i * 0.3); p.rotation.y = Math.PI; });
  const k = clamp(t / 1.2); A_OJI.position.x = lerp(4.6, 1.6, ease(k)); A_OJI.rotation.y = k < 1 ? -Math.PI / 2 : Math.PI; if (k < 1) poseRun(A_OJI, t * 9, 0.5); A_OJI.rotation.x = 0;
  look(2.0, 2.0, 6.0, 0.6, 1.4, -1.0, 50);
  return S;
}
function s32(t, d) { // もともと上らない人より32%高かった。
  reset(); lift(150); A_OJI.position.set(0.9, 0, 0.0); A_OJI.rotation.y = Math.PI; QUEUE.forEach((p, i) => { p.visible = i < 3; p.position.set(-1.6 + i * 0.5, 0, 0.0 + i * 0.3); p.rotation.y = Math.PI; });
  HEARTS[0].visible = true; HEARTS[0].position.set(0.9, 2.75 + Math.sin(t * 9) * 0.04, 0.3); HEARTS[0].rotation.y = Math.sin(t * 2) * 0.3; HEARTS[0].scale.setScalar(easeOut(clamp((t - 0.3) / 0.3)) * (1 + 0.06 * Math.sin(t * 12)));
  if (t > 0.3 && t < 0.4) el.flash.style.opacity = 0.25;
  setTop('心臓・血管の病気のなりやすさ', '32%高い', fade(t, 0.3, d, 0.25), RED); setHud('ずっと5階分未満の人と比べて', '観察研究', 1);
  look(2.2, 2.2, 6.4, 0.4, 1.7, -1.0, 50);
  return S;
}
function sKekka(t, d) { // 結果：1日50段で、
  reset(); lift(80); const s = clamp(t / d) * (N - 1); climb(C_OJI, s, t * 10, 0.85); floorSign.userData.set('5F');
  COUNTER.visible = true; COUNTER.userData.set('1日50段'); const [y, z] = STAIRS.userData.at(s); COUNTER.position.set(CX - 0.4, y + 2.6, z - 0.4);
  stairCam(s);
  return S;
}
function sIiwake(t, d) { // 運動する時間がない は言い訳にならなくなった。
  reset(); lift(150); D_OJI.position.set(DX, -0.36, -0.1); D_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); D_OJI.userData.knees.forEach(k => k.rotation.x = Math.PI / 2); D_OJI.rotation.y = Math.PI;
  KENSHIN.position.set(DX, 0.79, -0.95); KENSHIN.rotation.set(-Math.PI / 2, 0, 0);
  jikan.position.set(DX - 0.6, 2.35, -1.0); jikan.visible = t < 1.2; jikan.userData.size(1.2);
  if (t > 1.2) { const k = clamp((t - 1.2) / 0.3); jikan.visible = k < 1; jikan.material.opacity = 1 - k; }
  D_OJI.userData.head.rotation.x = 0.25;
  look(DX + 0.4, 1.8, -2.25, DX, 1.3, 0, 52);
  return S;
}
function sDaiji(t, d) { // 大事なのは、上り始めることより、
  reset(); lift(80); const s = 2 + clamp(t / d) * 4; climb(C_OJI, s, t * 7, 0.55); stairCam(s, 6.0, 0.8);
  return S;
}
function sYamenai(t, d) { // やめないこと。
  reset(); lift(80); const s = 6 + clamp(t / d) * 4; climb(C_OJI, s, t * 7, 0.55); setHud('2週間後', '今日も階段', 1); const u = ease(clamp(t / d)); stairCam(s, lerp(6.0, 7.2, u), lerp(0.8, 1.6, u));
  return S;
}
function sAsk(t) { // あなたは今日、何階分上った？（冒頭と同じ構図。紙は貼られたまま）
  reset(); lift(60); A_OJI.position.set(1.3, 0, 0.5); A_OJI.rotation.y = -0.35; STOP.visible = true; STOP.position.set(0, 1.4, -1.8); STOP.scale.setScalar(1); STOP.rotation.z = -0.05;
  lobbyCam(0);
  return S;
}

const NARR = { '5階': 'ごかい', '3階': 'さんがい', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '50段': 'ごじゅうだん', '45万人': 'よんじゅうごまんにん', '12年半': 'じゅうにねんはん', '約16%': 'やくじゅうろくパーセント', '32%': 'さんじゅうにパーセント', '1日': 'いちにち', '1段': 'いちだん', '結果：': '結果、', '5階分': 'ごかいぶん', '何階分': 'なんがいぶん', '言い分': 'いいぶん', '横目': 'よこめ', '上る': 'のぼる', '上らない': 'のぼらない', '上った': 'のぼった', '上り始める': 'のぼりはじめる' };
const P = planTimes([
  ['5階の職場を見上げて、', sMiage],
  ['営業のおじさんが絶望する。', sZetsubo],
  ['おじさんの言い分から。', sIibun],
  ['健康診断で運動しろと<br>言われても、時間がない。', sKenshin],
  ['1日目。3階で息が切れて、', sDay1],
  ['手すりにしがみつく。', sTesuri],
  ['3日目。前の日の筋肉痛で、', sDay3],
  ['1段ごとに声が出る。', sKoe],
  ['1週間後。エレベーター待ちの<br>列を横目に、階段へ。', sWeek],
  ['5階分の階段は、<br>だいたい50段。', s50],
  ['イギリスの45万人以上を、', sStudy],
  ['12年半追いかけた研究がある。', sYears],
  ['1日に5階分を超えて<br>上る人は、', sOver],
  ['心臓や血管の病気の<br>なりやすさが約16%低かった。', s16],
  ['ところが、途中で<br>上るのをやめた人は、', sStop],
  ['もともと上らない人より<br>32%高かった。', s32],
  ['結果：1日50段で、', sKekka],
  ['運動する時間がない は<br>言い訳にならなくなった。', sIiwake],
  ['大事なのは、<br>上り始めることより、', sDaiji],
  ['やめないこと。', sYamenai],
  ['あなたは今日、何階分上った？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0661',
    v2: true,
    tt: 'main',
    hookLine: '会社のエレベーターのボタンに、使用中止の紙がバンと貼られる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしもエレベーターをやめて毎日階段にしたら？',
    titleHtml: 'もしもエレベーター<br>をやめて毎日<br>階段にしたら？',
    mood: 'tension', seed: 661, hits: [TP, P.at(13, 0.3), P.at(15, 0.3)], risers: [P.at(12)], impacts: [P.at(9, 1.5), P.at(10, 0.4), P.at(13, 0.3), P.at(15, 0.3), P.at(16, 0.2)],
    sfx: [[TP, 'poof'], [P.at(1, 0.5), 'whoosh'], [P.at(4, 0.5), 'meter', 0.4], [P.at(7, 0.1), 'buzz'], [P.at(8, 0.2), 'whoosh'], [P.at(11, 0.3), 'bubble'], [P.at(14, 0.2), 'meter', 0.5], [P.at(15, 0.3), 'alarm'], [P.at(17, 1.2), 'poof']],
    narr: NARR,
    ask: 'あなたは今日、何階分上った？',
    caption: 'もしもエレベーターをやめて毎日階段にしたら？\n\n5階の職場を見上げて、営業のおじさんが絶望する。\nおじさんの言い分から。健康診断で運動しろと言われても、時間がない。\n1日目。3階で息が切れて、手すりにしがみつく。\n3日目。前の日の筋肉痛で、1段ごとに声が出る。\n1週間後。エレベーター待ちの列を横目に、階段へ。\n5階分の階段は、だいたい50段（1階分＝約10段）。\nイギリスの45万人以上（UK Biobank の大人458,860人）を、12年半（追跡の中央値12.5年）追いかけた研究がある。\n1日に5階分を超えて（6〜10階分）上る人は、まったく上らない人より、心臓や血管の病気（動脈硬化性の心血管疾患）のなりやすさが約16%低かった。\nところが、途中で上るのをやめた人は、ずっと1日5階分未満の人より32%高かった。\n※観察研究で、関連を見たものです。階段で病気が防げると決まったわけではありません\n\n結果：1日50段で、運動する時間がない は言い訳にならなくなった。\n大事なのは、上り始めることより、やめないこと。\n\nあなたは今日、何階分上った？ コメントで教えて。\n\n出典：Song Z ほか. Atherosclerosis 2023「Daily stair climbing, disease susceptibility, and risk of atherosclerotic cardiovascular disease」（UK Biobank）',
    hashtags: ['もしもラボ', 'もしも', '階段', '運動不足', '健康'],
    endStats: [['1日6〜10階分上る人（0回と比べて）', '約16%低い', '観察研究・2023年'], ['途中でやめた人（ずっと5階分未満と比べて）', '32%高い', '観察研究・2023年'], ['5階分の階段', '約50段', '1階分＝約10段']],
    sources: '出典：Song Z ほか. Atherosclerosis 2023（UK Biobank 458,860人・追跡12.5年）',
  },
});
