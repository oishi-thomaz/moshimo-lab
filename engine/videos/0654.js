import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, hudTime, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, poseOneLeg, makeTimer, makeSink, makeToothbrush, makeWallSet, planTimes } from '../scenes/fitness.js';

// もしも毎日片足立ちを1分続けたら？（台本 S44・人体の限界）
// 2026/11/04 ゆうと承認。0531 腕立て の あなたは今何回できる？ と同じ、その場で試したくなる問い
// 数字（一次資料で確認済み）：
//  Araujo CG ほか. Br J Sports Med 2022;56(17):975-980（doi:10.1136/bjsports-2021-105360、PubMed 35728834）
//   51〜75歳の1,702人（2008〜2020年）。片足で10秒立てなかったのは20.4%。中央値7年の追跡で死亡は 立てた人4.6%・立てなかった人17.5%
//   年齢・性別・BMI・持病をそろえた危険度（HR）は1.84倍
//  日本整形外科学会 ロコモ チャレンジ！ ロコトレ資料（locomo-joa.jp/assets/files/locotre.pdf）：片脚立ち 左右とも1分間で1セット・1日3セット、
//   転倒しないよう必ずつかまるものがある場所で、床につかない程度に片脚を上げる
//  練習で死亡リスクが下がるとは言わない（研究は 立てるかどうか と死亡の関係）
// 安全：机や壁に手をついてOK・足は高く上げすぎない（字幕と画面の札で必ず出す）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', BLUE = '#7fd4ff';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 30, 150);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(7, 14, 10); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.95; S.add(ground);

function me() { return addKnees(makeMan({ shirt: '#4f8fb3', pants: '#3a3f4e', hair: '#2a211c' })); }

// ---------- A：洗面所（原点）：壁は z=0、洗面台の前に立つ ----------
const BATH = makeWallSet({ w: 7, h: 3.2, color: '#e6eef2', floor: '#c9c2b4' }); S.add(BATH);
const tilesB = new THREE.Group(); S.add(tilesB); for (let i = 0; i < 12; i++) { const l = box(0.02, 3.2, 0.01, mat('#cdd8de')); l.position.set(-3.3 + i * 0.6, 1.6, 0.005); tilesB.add(l); }
const SINK = makeSink(); SINK.position.set(0, 0, 0.3); S.add(SINK);
const towel = box(0.5, 0.7, 0.05, mat('#f0a0a8')); towel.position.set(1.0, 1.25, 0.05); S.add(towel);
const ME = me(); S.add(ME); const sweatM = makeSweat(); ME.userData.head.add(sweatM);
const BRUSH = makeToothbrush(); BRUSH.position.set(0, -0.62, 0.12); BRUSH.rotation.x = -1.3; ME.userData.arms[1].add(BRUSH);
const TIMER = makeTimer({ w: 1.0, h: 0.44 }); TIMER.position.set(-2.0, 1.55, 0.06); S.add(TIMER);
const LR = [label('左 1分', { w: 500, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.85 }), label('右 1分', { w: 500, size: 100, color: '#fff', bg: 'rgba(230,110,60,.96)', sx: 0.85 })]; LR.forEach(l => S.add(l));
const guraLab = label('ぐらっ', { w: 500, size: 120, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.95 }); guraLab.material.depthTest = false; guraLab.renderOrder = 8; S.add(guraLab);

// ---------- B：実家の段差（x=60） ----------
const BX = 60;
const ROOM = makeRoom({ w: 9, d: 7, wall: '#efe6d6', floor: '#b8966a' }); ROOM.position.set(BX, 0, -1); ROOM.userData.rw.visible = false; S.add(ROOM);
const stepB = box(2.4, 0.18, 1.0, mat('#8a6a48')); stepB.position.set(BX - 0.6, 0.09, -1.6); S.add(stepB);
const PARENT = addKnees(makePerson({ skin: '#eac3a0', hair: '#c8c8c8', shirt: '#9a7a58', pants: '#4a4a52', scale: 0.92 })); S.add(PARENT);
const CHILD = addKnees(makeWoman({ shirt: '#e07a6a', pants: '#2b3346' })); S.add(CHILD);
const hatena = label('？', { w: 260, size: 200, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.5 }); hatena.material.depthTest = false; hatena.renderOrder = 8; S.add(hatena);
const abunai = label('あぶない！', { w: 700, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.2 }); S.add(abunai);

// ---------- C：カレンダー（x=120） ----------
const CX = 120;
const calC = document.createElement('canvas'); calC.width = 1024; calC.height = 900;
const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace; let calKey = -1;
function drawCal(n) {
  if (n === calKey) return; calKey = n; const g = calC.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 1024, 900); g.fillStyle = '#3480e6'; g.fillRect(0, 0, 1024, 150);
  g.fillStyle = '#fff'; g.font = '900 84px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('片足立ち 左右1分', 512, 78);
  for (let i = 0; i < 30; i++) {
    const cx = 74 + (i % 7) * 146, cy = 230 + Math.floor(i / 7) * 146;
    g.strokeStyle = '#c8ccd4'; g.lineWidth = 4; g.strokeRect(cx - 66, cy - 62, 132, 128);
    g.fillStyle = '#6a7080'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText(String(i + 1), cx - 30, cy - 34);
    if (i < n) { g.strokeStyle = '#c8242c'; g.lineWidth = 12; g.beginPath(); g.arc(cx + 10, cy + 14, 36, 0, 7); g.stroke(); }
  }
  calT.needsUpdate = true;
}
const cal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0), new THREE.MeshBasicMaterial({ map: calT })); cal.position.set(CX, 2.2, -1); S.add(cal);
const calFrame = box(3.56, 3.16, 0.06, mat('#3a3e4a')); calFrame.position.set(CX, 2.2, -1.04); S.add(calFrame);

// ---------- F：研究の人たち（x=180） ----------
const FX = 180;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.01, -3); ffloor.renderOrder = -0.8; S.add(ffloor);
const CROWD = (() => { const n = 1702, cols = 46; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mat('#c8ccd8'), n); const M = new THREE.Matrix4(); const r = rng(54); const col = new THREE.Color('#c8ccd8'); for (let i = 0; i < n; i++) { M.makeTranslation(FX - 8.2 + (i % cols) * 0.36 + (r() - 0.5) * 0.08, 0.28, -2.4 - Math.floor(i / cols) * 0.36); m.setMatrixAt(i, M); m.setColorAt(i, col); } S.add(m); return m; })();
const RED20 = new Set(); { const r = rng(17); for (let i = 0; i < 1702; i++) if (r() < 0.204) RED20.add(i); }
let crowdKey = -1;
function crowdRed(k) { const kk = Math.round(k * 20); if (kk === crowdKey) return; crowdKey = kk; const c = new THREE.Color(), a = new THREE.Color('#c8ccd8'), b = new THREE.Color('#ff5a5a'); for (let i = 0; i < 1702; i++) CROWD.setColorAt(i, RED20.has(i) ? c.copy(a).lerp(b, kk / 20) : a); CROWD.instanceColor.needsUpdate = true; }
const FRONT = Array.from({ length: 5 }, (_, i) => { const p = addKnees(makePerson({ skin: ['#f1c9a5', '#eac3a0', '#d9a87e', '#f5d3b5', '#e0b08a'][i], hair: ['#8a8a8a', '#3a3330', '#c8c8c8', '#5a4a3a', '#9a9a9a'][i], shirt: ['#4f6a8f', '#9a7a58', '#6b7a5a', '#a35d4f', '#59606e'][i], pants: '#2b3346', bald: i === 2, scale: 0.95 })); S.add(p); return p; });
const tatenai = label('10秒 立てなかった', { w: 1000, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.75 }); S.add(tatenai);

// ---------- H：死亡リスク（x=240） ----------
const HX = 240;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#2e3446', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, -1); hfloor.renderOrder = -0.8; S.add(hfloor);
const HB = [['立てた人', '#7fd4ff', -1.2], ['立てなかった人', '#ff5a5a', 1.2]].map(([name, col, dx]) => {
  const b = box(1.5, 1, 0.8, mat(col)); b.geometry.translate(0, 0.5, 0); b.position.set(HX + dx, 0.3, -1); S.add(b);
  const n = label(name, { w: 800, size: 90, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.4 }); n.position.set(HX + dx, 0.6, -0.4); S.add(n);
  const v = label('', { w: 700, size: 120, color: col, stroke: 16, strokeColor: '#1a1a22', sx: 1.2 }); v.material.depthTest = false; v.renderOrder = 9; S.add(v);
  return { b, n, v, dx };
});
function setHB(k1, k2) { const H = 1.1; const h1 = Math.max(0.001, H * k1), h2 = Math.max(0.001, H * (1 + 0.84 * k2) * (k1 > 0.99 ? 1 : k1)); HB[0].b.scale.y = h1; HB[1].b.scale.y = h2; HB.forEach(B => B.b.visible = k1 > 0.01); HB[0].v.visible = k1 > 0.9; HB[0].v.position.set(HX - 1.2, 0.3 + h1 + 0.35, -0.5); HB[0].v.userData.set('1倍'); HB[1].v.visible = k1 > 0.9; HB[1].v.position.set(HX + 1.2, 0.3 + h2 + 0.35, -0.5); HB[1].v.userData.set(k2 < 0.01 ? '1倍' : `${(1 + 0.84 * k2).toFixed(2)}倍`); }
const hTitle = label('約7年後の死亡リスク', { w: 1000, size: 86, color: '#e8ecf4', sx: 2.0 }); hTitle.position.set(HX, 3.25, -1); S.add(hTitle);
const hNote = label('※年齢・性別・BMI・持病をそろえた比較', { w: 1500, size: 70, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 2.75 }); hNote.position.set(HX, 3.7, -1); S.add(hNote);

// ---------- I：整形外科の学会のすすめ（x=300） ----------
const IX = 300;
const ifloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); ifloor.rotation.x = -Math.PI / 2; ifloor.position.set(IX, 0.02, -1); ifloor.renderOrder = -0.8; S.add(ifloor);
const DOC = makeDoc({ title: '片脚立ちのすすめ', rows: ['時間', '回数'], head: '#3a8a5a', w: 2.6, h: 1.9 }); DOC.position.set(IX, 2.4, -1.2); S.add(DOC);
const docStand = box(0.1, 1.5, 0.1, mat('#5a5e68')); docStand.position.set(IX, 0.75, -1.25); S.add(docStand);
const GUIDE = me(); S.add(GUIDE);
const clocks = [0, 1, 2].map(i => { const l = label(['朝', '昼', '夜'][i], { w: 300, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.55 }); l.position.set(IX - 1.0 + i * 1.0, 0.95, -0.4); S.add(l); return l; });

// ---------- J：机に手をついて（x=360） ----------
const JX = 360;
const JR = makeRoom({ w: 9, d: 7, wall: '#efe6d6', floor: '#b8966a' }); JR.position.set(JX, 0, -1); JR.userData.rw.visible = false; S.add(JR);
const desk = box(1.4, 0.06, 0.7, mat('#9a7a58')); desk.position.set(JX - 0.35, 0.82, -1.0); S.add(desk);
for (const [dx, dz] of [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]]) { const l = box(0.06, 0.8, 0.06, mat('#7a5a38')); l.position.set(JX - 0.35 + dx, 0.4, -1.0 + dz); S.add(l); }
const HOLD = me(); S.add(HOLD);
const teOK = label('手をついてOK', { w: 800, size: 100, color: '#fff', bg: 'rgba(58,168,106,.96)', sx: 1.35 }); S.add(teOK);
const sukoshi = label('床から少しだけ', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,214,90,.97)', sx: 1.45 }); S.add(sukoshi);
const takasugi = label('高く上げすぎない', { w: 1000, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); S.add(takasugi);
const arrowUp = label('↕', { w: 220, size: 160, color: '#ffd27a', stroke: 14, strokeColor: '#2a1a00', sx: 0.38 }); arrowUp.material.depthTest = false; arrowUp.renderOrder = 8; S.add(arrowUp);

// ---------- K：7年後の分かれ道（x=420） ----------
const KX = 420;
const kfloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat('#5a7a4a', { depthWrite: false })); kfloor.rotation.x = -Math.PI / 2; kfloor.position.set(KX, 0.01, -8); kfloor.renderOrder = -0.8; S.add(kfloor);
const roadM = mat('#c8b898', { depthWrite: false });
const road0 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), roadM); road0.rotation.x = -Math.PI / 2; road0.position.set(KX, 0.02, 1.0); road0.renderOrder = -0.7; S.add(road0);
for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14), roadM); r.rotation.x = -Math.PI / 2; r.rotation.z = s * 0.45; r.position.set(KX + s * 3.0, 0.02, -4.8); r.renderOrder = -0.7; S.add(r); }
const signL = label('10秒 立てた', { w: 800, size: 96, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.3 }); signL.position.set(KX - 1.35, 1.55, -2.6); S.add(signL);
const signR = label('立てなかった', { w: 800, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.3 }); signR.position.set(KX + 1.35, 1.55, -2.6); S.add(signR);
const nen7 = label('7年後', { w: 500, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.95 }); nen7.position.set(KX, 2.35, -3.0); S.add(nen7);
const FORK = me(); S.add(FORK);
const sparkK = makeSparkles(80, 0.16, 0xfff2c0); S.add(sparkK.points); sparkK.init([[KX, 1.2, 0.2]], 1.0, 1.3);
const trees = [-6, -4.5, 4.5, 6, -7, 7].map((dx, i) => { const g = new THREE.Group(); const tr = box(0.2, 1.0, 0.2, mat('#7a5a38')); tr.position.y = 0.5; g.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), mat('#3a7a3a')); lf.position.y = 1.5; g.add(lf); g.position.set(KX + dx, 0, -2 - i * 1.6); S.add(g); return g; });

// ---------- 共通 ----------
const KNEE = [ME, PARENT, CHILD, ...FRONT, GUIDE, HOLD, FORK];
const LABELS = [...LR, guraLab, hatena, abunai, tatenai, teOK, sukoshi, takasugi, arrowUp];
function reset() {
  KNEE.forEach(p => { fitReset(p); p.visible = true; });
  ME.position.set(0, 0, 1.05); ME.rotation.y = Math.PI * 0.78; BRUSH.visible = false; sweatM.userData.set(0);
  PARENT.position.set(BX - 0.6, 0, -0.8); CHILD.position.set(BX + 1.1, 0, 0.0);
  FRONT.forEach((p, i) => p.position.set(FX - 2.4 + i * 1.2, 0, 0.2));
  GUIDE.position.set(IX + 1.75, 0, -0.6); HOLD.position.set(JX + 0.45, 0, -1.0); FORK.position.set(KX, 0, 0.6);
  LABELS.forEach(l => l.visible = false); TIMER.userData.set('10.0'); crowdRed(0); setHB(0, 0); sparkK.set(0);
  DOC.userData.fill(0, ''); DOC.userData.fill(1, ''); hemi.intensity = 1.25; el.flash.style.opacity = 0;
}
// 洗面所を横から（片足が見える角度。カメラは +x 側）
function bathCam(u = 0, zoom = 0, ty = 1.05) { const d = lerp(5.2, 4.8, u) - zoom; look(-0.35 + 0.62 * d, ty + 0.1 * d, 0.85 + 0.78 * d, -0.35, ty, 0.85, 46); }
const fmt1 = (x) => Math.max(0, x).toFixed(1);

function shot0(t) { // 0秒＝サムネ：歯みがき中に片足でぐらっ、10.0 のタイマーが途中で止まる
  reset(); lift(0); BRUSH.visible = true;
  const down = t >= 0.5; const remain = 10 - Math.min(0.5, Math.max(0, t - 0.08)) * 8.5;
  if (!down) poseOneLeg(ME, 1, { side: 1, wobble: 0.5 + clamp(t / 0.5) * 1.6, t, arms: 'brush', lift: 0.6 });
  else { poseOneLeg(ME, 0.15, { side: 1, wobble: 0.3, t, arms: 'brush', lift: 0.6 }); ME.rotation.z = -0.06; ME.userData.arms[0].rotation.set(0, 0, -0.9); }
  TIMER.userData.set(down ? fmt1(10 - 0.42 * 8.5) : fmt1(remain), down ? RED : '#7dff8a');
  el.flash.style.opacity = down && t < 0.62 ? 0.22 : 0;
  if (down) { guraLab.position.set(0.55, 2.05, 1.3); pop(guraLab, t, 0.5, 0.25, 0.95); }
  bathCam(ease(clamp(t / 3)), 0, 1.5);
  return S;
}
function parentCam(u = 0) { look(BX + lerp(0.6, 0.3, u), 2.0, lerp(5.6, 5.0, u), BX - 0.1, 1.15, -0.6, 48); }
function sOya(t, d) { // 年をとった親を見て思った。
  reset(); lift(150);
  const k = clamp((t - 0.4) / 0.6); PARENT.rotation.y = 0.1; PARENT.userData.legs[1].rotation.x = -0.5 * clamp(t / 0.4); PARENT.userData.knees[1].rotation.x = 0.6 * clamp(t / 0.4);
  PARENT.rotation.x = 0.28 * Math.sin(Math.min(k, 1) * Math.PI * 0.9); PARENT.userData.arms.forEach((a, i) => a.rotation.set(-0.8 * k, 0, (i ? -1 : 1) * 0.5 * k));
  CHILD.rotation.y = -0.9; CHILD.userData.arms[1].rotation.set(-1.3 * k, 0, 0);
  abunai.position.set(BX - 0.4, 2.35, -0.6); pop(abunai, t, 0.7, 0.25, 1.2);
  parentCam(ease(clamp(t / d))); return S;
}
function sKarada(t, d) { // 転ばない体は、今から作れるの？
  reset(); lift(150); PARENT.rotation.y = 0.3; PARENT.userData.head.rotation.x = 0.2;
  CHILD.rotation.y = -0.3; CHILD.userData.head.rotation.x = 0.15; CHILD.userData.arms[1].rotation.set(-0.4, 0, -0.3);
  hatena.position.set(BX + 1.1, 2.3, 0.1); pop(hatena, t, 0.5, 0.3);
  look(BX + 1.6, 1.9, 4.4, BX + 0.7, 1.3, -0.3, 48); return S;
}
function sMainichi(t, d) { // 毎日、片足立ちを左右1分ずつ。
  reset(); lift(150); const right = t > d * 0.5; poseOneLeg(ME, 1, { side: right ? 0 : 1, wobble: 0.5, t, arms: 'out', lift: 0.6 });
  TIMER.userData.set('1:00', '#7dff8a');
  LR[0].position.set(-0.35, 1.95, 1.6); LR[1].position.set(0.65, 1.95, 1.2); pop(LR[0], t, 0.2); pop(LR[1], t, d * 0.5);
  bathCam(0.4); return S;
}
function sCal(t, d) { // それを30日続ける。
  reset(); lift(260); drawCal(Math.floor(clamp((t - 0.3) / (d - 0.8)) * 30));
  look(CX, 2.4, 7.2, CX, 2.5, -1, 50); return S;
}
function sDay1(t, d) { // 1日目。目を開けているのに、10秒でぐらつく。
  reset(); lift(250); const sec = Math.min(10, t * 3.2); const w = 0.4 + sec / 10 * 1.8;
  poseOneLeg(ME, sec >= 10 ? 0.3 : 1, { side: 1, wobble: w, t, arms: 'out', lift: 0.6 }); sweatM.userData.set(clamp(sec / 8), t);
  TIMER.userData.set(fmt1(sec), sec >= 10 ? RED : '#7dff8a');
  if (sec >= 10) { guraLab.position.set(0.55, 1.95, 1.3); pop(guraLab, t, 10 / 3.2, 0.25, 0.95); }
  hudTime('1日目'); bathCam(0.5, ease(clamp(t / d)) * 0.4); return S;
}
function sDaiji(t, d) { // 実はこの10秒が、思っていたより大事だった。
  reset(); lift(150); poseOneLeg(ME, 0.3, { side: 1, wobble: 0.5, t, arms: 'out', lift: 0.6 }); TIMER.userData.set('10.0', GOLD);
  const u = ease(clamp(t / d)); look(lerp(-0.4, -1.5, u), lerp(1.7, 1.6, u), lerp(4.2, 2.6, u), lerp(-0.9, -2.0, u), lerp(1.3, 1.55, u), 0.05, 46); return S;
}
function studyCam(u = 0) { look(FX, lerp(4.6, 5.0, u), lerp(8.6, 9.4, u), FX, 0.6, -2.6, 50); }
function sStudy(t, d) { // 51〜75歳の1,702人に、
  reset(); lift(170); FRONT.forEach(p => p.visible = false); studyCam(ease(clamp(t / d)) * 0.5);
  setTop('51〜75歳', '1,702人', fade(t, 0.5, d - 0.1, 0.25), BLUE); return S;
}
function sStand(t, d) { // 片足で10秒立ってもらった研究。
  reset(); lift(170); FRONT.forEach((p, i) => poseOneLeg(p, clamp((t - 0.2 - i * 0.12) / 0.4), { side: 1, wobble: 0.6, t: t + i, arms: 'out' }));
  studyCam(0.5 + ease(clamp(t / d)) * 0.5); return S;
}
function sFive(t, d) { // 5人に1人は、10秒立てなかった。
  reset(); lift(170); crowdRed(clamp((t - 0.8) / 1.0));
  FRONT.forEach((p, i) => { const fall = i === 3 && t > 0.8; poseOneLeg(p, fall ? 0 : 1, { side: 1, wobble: fall ? 0 : 0.5, t: t + i, arms: 'out', lift: 0.6 }); if (fall) { p.userData.arms.forEach((a, j) => a.rotation.set(-0.6, 0, (j ? -1 : 1) * 0.8)); p.rotation.z = 0.08; } });
  tatenai.position.set(FX - 2.4 + 3 * 1.2, 2.05, 0.5); pop(tatenai, t, 1.0, 0.3, 1.3);
  studyCam(1); setTop('10秒 立てなかった人', '20.4%', fade(t, 1.0, d - 0.1, 0.25), RED); return S;
}
function hbCam() { look(HX, 2.0, 8.6, HX, 1.75, -1, 46); }
function sNanen(t, d) { // 約7年後、年齢などの条件をそろえても、
  reset(); lift(250); setHB(easeOut(clamp((t - 0.2) / 1.2)), 0); hbCam(); return S;
}
function sBai(t, d) { // 立てなかった人の死亡リスクは1.84倍。
  reset(); lift(250); setHB(1, easeOut(clamp((t - 0.2) / 1.4))); hbCam();
  setTop('立てなかった人の死亡リスク', '1.84倍', fade(t, 1.4, d - 0.1, 0.25), RED); return S;
}
function sGakkai(t, d) { // 整形外科の学会が勧めるのは、
  reset(); lift(200); GUIDE.rotation.y = -0.5; GUIDE.userData.arms[0].rotation.set(-1.3, 0, 0.3);
  look(IX + 0.55, 2.2, 7.0, IX + 0.55, 1.75, -1, 48); return S;
}
function sSanKai(t, d) { // 左右1分ずつを1日3回。
  reset(); lift(200); DOC.userData.fill(0, t > 0.2 ? '左右 1分ずつ' : ''); DOC.userData.fill(1, t > 1.0 ? '1日 3回' : ''); GUIDE.rotation.y = -0.5; GUIDE.userData.arms[0].rotation.set(-1.3, 0, 0.3);
  clocks.forEach((c, i) => pop(c, t, 1.2 + i * 0.3, 0.25, 0.55));
  look(IX + 0.55, 2.2, 7.0, IX + 0.55, 1.75, -1, 48); return S;
}
function holdCam(u = 0) { look(JX - 0.15, 1.55, lerp(4.9, 4.5, u), JX - 0.15, 1.0, -1.0, 46); }
function sTe(t, d) { // 机や壁に手をついてOK。
  reset(); lift(260); HOLD.rotation.y = -Math.PI / 2; poseOneLeg(HOLD, clamp(t / 0.5), { side: 1, wobble: 0.1, t, arms: 'desk', lift: 0.4 });
  teOK.position.set(JX - 0.55, 1.35, -0.6); pop(teOK, t, 0.4, 0.3, 1.15);
  holdCam(ease(clamp(t / d))); return S;
}
function sAgesugi(t, d) { // 足は高く上げすぎない。
  reset(); lift(260); HOLD.rotation.y = -Math.PI / 2; poseOneLeg(HOLD, 1, { side: 1, wobble: 0.1, t, arms: 'desk', lift: 0.4 });
  takasugi.position.set(JX - 0.55, 1.35, -0.6); pop(takasugi, t, 0.2, 0.3, 1.3); sukoshi.position.set(JX + 0.3, 0.42, -0.4); pop(sukoshi, t, 0.9, 0.3, 1.0);
  holdCam(1); return S;
}
function sWeek2(t, d) { // 2週目。歯みがきの間、ぐらつかずに立っていられる。
  reset(); lift(250); BRUSH.visible = true; poseOneLeg(ME, 1, { side: 1, wobble: 0.05, t, arms: 'brush', lift: 0.6 });
  TIMER.userData.set(`0:${String(Math.min(59, Math.floor(20 + t * 9))).padStart(2, '0')}`, '#7dff8a');
  hudTime('2週目'); bathCam(0.5, 0.2); return S;
}
function forkCam(u = 0) { look(KX + lerp(0.3, 0.1, u), lerp(3.0, 3.4, u), lerp(6.6, 7.4, u), KX, 1.25, -1.4, 48); }
function sKekka1(t, d) { // 結果：片足で10秒立てるかどうかが、
  reset(); lift(200); FORK.rotation.y = Math.PI + 0.45; poseOneLeg(FORK, 1, { side: 1, wobble: 0.15, t, arms: 'out', lift: 0.6 });
  signL.visible = signR.visible = true; nen7.visible = false; forkCam(ease(clamp(t / d)) * 0.5); return S;
}
function sKekka2(t, d) { // 7年後の分かれ道だった。
  reset(); lift(200); FORK.rotation.y = Math.PI + 0.45; poseOneLeg(FORK, 1, { side: 1, wobble: 0.1, t, arms: 'out', lift: 0.6 }); sparkK.set(clamp((t - 0.2) / 3));
  signL.visible = signR.visible = true; pop(nen7, t, 0.3, 0.3); forkCam(0.5 + ease(clamp(t / d)) * 0.5);
  setTop('結果', '7年後の分かれ道', fade(t, 0.3, d - 0.1, 0.25), GREEN); return S;
}
function sHamigaki(t, d) { // 歯みがきの2分は、そのまま練習の時間になる。
  reset(); lift(250); BRUSH.visible = true; poseOneLeg(ME, 1, { side: t > d * 0.5 ? 0 : 1, wobble: 0.08, t, arms: 'brush', lift: 0.6 });
  const sec = Math.max(0, 120 - t * 9); TIMER.userData.set(`${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`, '#7dff8a');
  bathCam(0.6); return S;
}
function sAsk(t, d) { // 質問：今やってみて。片足で何秒立てた？（冒頭と同じ構図）
  reset(); lift(250); BRUSH.visible = true; poseOneLeg(ME, 1, { side: 1, wobble: 0.8, t, arms: 'brush', lift: 0.6 }); TIMER.userData.set(fmt1(Math.min(10, t * 2.5)), '#7dff8a');
  bathCam(0); return S;
}

const NARR = { '51〜75歳': 'ごじゅういちからななじゅうごさい', '1,702人': 'せんななひゃくににん', '10秒': 'じゅうびょう', '5人に1人': 'ごにんにひとり', '約7年後': 'やくななねんご', '7年後': 'ななねんご', '1.84倍': 'いってんはちよんばい', '左右1分': 'さゆういっぷん', '1日3回': 'いちにちさんかい', '1日目': 'いちにちめ', '2週目': 'にしゅうめ', '30日': 'さんじゅうにち', '2分': 'にふん', '何秒': 'なんびょう', '片足': 'かたあし', '整形外科': 'せいけいげか', '結果：': '結果、', '分かれ道': 'わかれみち', '歯みがき': 'はみがき' };
const P = planTimes([
  ['年をとった親を<br>見て思った。', sOya],
  ['転ばない体は、<br>今から作れるの？', sKarada],
  ['毎日、片足立ちを<br>左右1分ずつ。', sMainichi],
  ['それを30日続ける。', sCal],
  ['1日目。目を開けているのに、<br>10秒でぐらつく。', sDay1],
  ['実はこの10秒が、思って<br>いたより大事だった。', sDaiji],
  ['51〜75歳の1,702人に、', sStudy],
  ['片足で10秒<br>立ってもらった研究。', sStand],
  ['5人に1人は、<br>10秒立てなかった。', sFive],
  ['約7年後、年齢などの<br>条件をそろえても、', sNanen],
  ['立てなかった人の<br>死亡リスクは1.84倍。', sBai],
  ['整形外科の学会が<br>勧めるのは、', sGakkai],
  ['左右1分ずつを<br>1日3回。', sSanKai],
  ['机や壁に手をついてOK。', sTe],
  ['足は高く<br>上げすぎない。', sAgesugi],
  ['2週目。歯みがきの間、<br>ぐらつかずに立っていられる。', sWeek2],
  ['結果：片足で10秒<br>立てるかどうかが、', sKekka1],
  ['7年後の分かれ道だった。', sKekka2],
  ['歯みがきの2分は、<br>そのまま練習の時間になる。', sHamigaki],
  ['今やってみて。<br>片足で何秒立てた？', sAsk],
], { shot0, endCard, start: 2.9, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0654',
    v2: true,
    hookLine: '歯みがき中の人が片足でぐらっと揺れて、10.0 のタイマーが途中で止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日片足立ちを1分続けたら？',
    titleHtml: 'もしも毎日<br>片足立ちを<br>1分続けたら？',
    mood: 'hopeful', seed: 654, hits: [0.5, P.at(16), P.at(17)], risers: [P.at(5)],
    impacts: [P.at(6, 1.0), P.at(8, 1.2), P.at(10, 1.6), P.at(12, 1.0), P.at(17, 0.3)],
    sfx: [[0.5, 'alarm'], [P.at(0, 0.7), 'whoosh'], [P.at(1, 0.6), 'bubble'], [P.at(4, 3.1), 'whoosh'], [P.at(8, 0.8), 'poof'], [P.at(12, 1.2), 'bubble'], [P.at(12, 1.5), 'bubble'], [P.at(12, 1.8), 'bubble'], [P.at(13, 0.4), 'bubble'], [P.at(14, 0.2), 'bubble']],
    narr: NARR,
    ask: '今やってみて。片足で何秒立てた？',
    caption: 'もしも毎日片足立ちを1分続けたら？\n\n年をとった親を見て思った。転ばない体は、今から作れるの？\n毎日、片足立ちを左右1分ずつ。それを30日続ける。\n1日目。目を開けているのに、10秒でぐらつく。\n実はこの10秒が、思っていたより大事だった。\n51〜75歳の1,702人に、片足で10秒立ってもらった研究。5人に1人は、10秒立てなかった。\n約7年後、年齢などの条件をそろえても、立てなかった人の死亡リスクは1.84倍。\n整形外科の学会が勧めるのは、左右1分ずつを1日3回。机や壁に手をついてOK。足は高く上げすぎない。\n2週目。歯みがきの間、ぐらつかずに立っていられる。\n\n結果：片足で10秒立てるかどうかが、7年後の分かれ道だった。\n歯みがきの2分は、そのまま練習の時間になる。\n\n今やってみて。片足で何秒立てた？ コメントで教えて。\n\n※転ばないよう、つかまれる物のそばでやってください。研究は 立てるかどうか と死亡の関係を見たもので、練習で死亡リスクが下がると示したものではありません\n出典：Araujo ほか British Journal of Sports Medicine 2022（51〜75歳の1,702人。10秒立てなかった20.4%、中央値7年の追跡で死亡リスク1.84倍）、日本整形外科学会 ロコモ チャレンジ！ ロコトレ（片脚立ち 左右1分・1日3回）',
    hashtags: ['もしもラボ', '片足立ち', 'バランス', '転倒予防', '健康'],
    endStats: [['片足で10秒立てなかった人', '20.4%', '51〜75歳・1,702人'], ['立てなかった人の死亡リスク', '1.84倍', '約7年後・条件をそろえて'], ['学会のすすめ', '左右1分×1日3回', '机につかまってOK']],
    sources: '出典：Araujo ほか British Journal of Sports Medicine 2022、日本整形外科学会 ロコトレ',
  },
});
