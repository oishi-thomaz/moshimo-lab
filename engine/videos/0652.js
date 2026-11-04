import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, hudTime, el } from '../story.js';
import { makeMan, label, pop } from '../satire-kit.js';
import { addKnees, setThighHeat, fitReset, poseWallSit, makeTimer, fmtMS, makeWallSet, makeBPMonitor, planTimes } from '../scenes/fitness.js';
import { makeSweat } from '../scenes/office.js';

// もしも毎日空気椅子を30日続けたら？（台本 S42・人体の限界）
// 2026/11/04 ゆうと承認。30日続けたら の型（0531 腕立て・0614 ラン）
// 数字（一次資料で確認済み）：
//  Edwards JJ ほか. Br J Sports Med 2023;57(20):1317-1326（doi:10.1136/bjsports-2022-106503、PubMed 37491419）
//   270件のランダム化比較試験・15,827人。安静時の上／下の血圧：アイソメトリック（じっと止まる運動）−8.24/−4.00 mmHg、
//   有酸素運動 −4.49/−2.53、筋トレ（ダイナミック）−4.55/−3.04。上の血圧の効き目の順位（SUCRA）はアイソメトリックが1位（98.3%）、
//   種類別では wall squat（空気椅子）が上の血圧で1位（90.4%）
//  1日2分を30日 は もしもの設定（研究のやり方そのものではない）と画面とキャプションに出す
// 安全：息を止めない・血圧が高い人／心臓に持病がある人は先に医師に相談（字幕と画面の札で必ず出す）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', BLUE = '#7fd4ff';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 30, 140);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 14, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.95; S.add(ground);

function you(seed = 3) { const p = addKnees(makeMan({ shirt: '#e05a4f', pants: '#2b3346', hair: '#2a211c' })); return p; }

// ---------- A：リビングの壁と空気椅子（原点） ----------
const WALL = makeWallSet({ w: 9, h: 3.3, color: '#ece4d4', floor: '#b8966a' }); S.add(WALL);
const plant = new THREE.Group(); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 12), mat('#c86a4a')); pot.position.y = 0.2; plant.add(pot); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat('#5a9a5a')); lf.position.y = 0.75; plant.add(lf); } plant.position.set(-2.1, 0, 0.45); S.add(plant);
const pic = box(0.9, 0.65, 0.04, mat('#5a7a9a')); pic.position.set(-2.4, 2.0, 0.03); S.add(pic);
const A = you(); S.add(A); const sweatA = makeSweat(); A.userData.head.add(sweatA);
const TIMER = makeTimer({ w: 1.1, h: 0.48 }); TIMER.position.set(-1.0, 1.3, 0.62); TIMER.rotation.y = 1.13; S.add(TIMER);
const tPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 8), mat('#3a3e46')); tPole.position.set(-1.0, 0.55, 0.62); S.add(tPole); const tFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.05, 16), mat('#3a3e46')); tFoot.position.set(-1.0, 0.025, 0.62); S.add(tFoot);
const heat = label('太ももが燃える', { w: 900, size: 100, color: '#fff', bg: 'rgba(220,60,40,.96)', sx: 1.5 }); S.add(heat);
const muri = [label('ジム', { w: 400, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.6 }), label('ランニング', { w: 700, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.05 })]; muri.forEach(l => S.add(l));
const batsu = [0, 1].map(() => { const l = label('✕', { w: 260, size: 200, color: '#ff4a4a', stroke: 16, strokeColor: '#fff', sx: 0.42 }); l.material.depthTest = false; l.renderOrder = 8; S.add(l); return l; });
const hatena = label('？', { w: 260, size: 200, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.55 }); hatena.material.depthTest = false; hatena.renderOrder = 8; S.add(hatena);
const ikiOK = label('息は止めない', { w: 900, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.45 }); S.add(ikiOK);
const breath = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); S.add(m); return m; });
const BP = makeBPMonitor(); BP.scale.setScalar(0.62); S.add(BP);
const bpTable = box(1.4, 0.7, 0.7, mat('#9a7a58')); S.add(bpTable);

// ---------- C：カレンダー（x=60） ----------
const CX = 60;
const calC = document.createElement('canvas'); calC.width = 1024; calC.height = 900;
const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace; let calKey = -1;
function drawCal(n) {
  if (n === calKey) return; calKey = n; const g = calC.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 1024, 900); g.fillStyle = '#3480e6'; g.fillRect(0, 0, 1024, 150);
  g.fillStyle = '#fff'; g.font = '900 88px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('壁で空気椅子 2分', 512, 78);
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
const moshi = label('※1日2分×30日は もしもの設定', { w: 1400, size: 80, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 2.9 }); moshi.position.set(CX, 4.05, -0.9); S.add(moshi);

// ---------- F：2023年の分析（x=120） ----------
const FX = 120;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.01, -3); ffloor.renderOrder = -0.8; S.add(ffloor);
const CROWD = (() => { const n = 1600, cols = 50; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mat('#7fd4ff'), n); const M = new THREE.Matrix4(); const r = rng(52); for (let i = 0; i < n; i++) { M.makeTranslation(FX - 9 + (i % cols) * 0.36 + (r() - 0.5) * 0.08, 0.28, -2 - Math.floor(i / cols) * 0.36); m.setMatrixAt(i, M); } S.add(m); return m; })();
const PAPERS = new THREE.Group(); S.add(PAPERS); for (let i = 0; i < 27; i++) { const p = box(0.9, 0.04, 1.2, mat(i % 3 ? '#f4f4ef' : '#e3e6ee')); p.position.set(FX + (i % 3 - 1) * 1.05, 0.6 + Math.floor(i / 3) * 0.05, 0.9); p.rotation.y = (i * 0.37) % 0.3 - 0.15; PAPERS.add(p); }
const papBase = box(3.4, 0.58, 1.6, mat('#5a4a3a')); papBase.position.set(FX, 0.29, 0.9); S.add(papBase);
const lab270 = label('270の研究', { w: 700, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.3 }); lab270.position.set(FX, 1.75, 0.9); S.add(lab270);

// ---------- G：一番下げた運動（x=180） ----------
const GX = 180;
const gfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#3a3448', { depthWrite: false })); gfloor.rotation.x = -Math.PI / 2; gfloor.position.set(GX, 0.02, -1); gfloor.renderOrder = -0.8; S.add(gfloor);
const PODS = [-1.75, 0, 1.75].map((dx, i) => { const p = box(1.6, i === 1 ? 0.9 : 0.5, 1.3, mat(i === 1 ? '#c89a3a' : '#5a6070')); p.position.set(GX + dx, (i === 1 ? 0.9 : 0.5) / 2, -1); S.add(p); return p; });
const RUN = you(); S.add(RUN); const LIFTER = you(); S.add(LIFTER); const STILL = you(); S.add(STILL); STILL.userData.y0 = 0.9;
const dumb = new THREE.Group(); const _dumbHold = () => LIFTER.userData.arms[1].add(dumb); { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), mat('#9aa0aa')); bar.rotation.z = Math.PI / 2; dumb.add(bar); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), mat('#2a2e36')); w.rotation.z = Math.PI / 2; w.position.x = s * 0.52; dumb.add(w); } } dumb.position.set(-0.32, -0.66, 0.05); dumb.scale.setScalar(0.85); _dumbHold();
const miniWall = box(0.12, 1.9, 1.3, mat('#ece4d4')); miniWall.position.set(GX - 0.42, 0.9 + 0.95, -1.0); S.add(miniWall);
const nRun = label('走る', { w: 400, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.8 }); nRun.position.set(GX - 1.75, 2.6, -0.6); S.add(nRun);
const nLift = label('筋トレ', { w: 500, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); nLift.position.set(GX + 1.75, 2.6, -0.6); S.add(nLift);
const nStill = label('じっと止まる運動', { w: 1000, size: 100, color: '#2a1a00', bg: 'rgba(255,214,90,.97)', sx: 1.75 }); nStill.position.set(GX, 3.05, -0.6); S.add(nStill);
const crown = label('上の血圧 1位', { w: 900, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.5 }); crown.position.set(GX, 3.7, -0.6); S.add(crown);
const spot = new THREE.SpotLight(0xfff0c0, 0, 14, 0.4, 0.5, 1); spot.position.set(GX, 7, 2); spot.target.position.set(GX, 1, -1); S.add(spot); S.add(spot.target);

// ---------- H：上の血圧の下がり方（x=240） ----------
const HX = 240;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#2e3446', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, -1); hfloor.renderOrder = -0.8; S.add(hfloor);
const zeroLine = box(5.2, 0.05, 0.05, mat('#ffffff')); zeroLine.position.set(HX, 3.6, -1); S.add(zeroLine);
const zLab = label('0', { w: 200, size: 90, color: '#fff', sx: 0.3 }); zLab.position.set(HX - 2.9, 3.6, -1); S.add(zLab);
const BARS = [['じっと止まる運動', 8.24, '#ffb040', -1.2], ['走るなど 有酸素運動', 4.49, '#7fd4ff', 1.2]].map(([name, v, col, dx]) => {
  const b = box(1.5, 1, 0.8, mat(col)); b.geometry.translate(0, -0.5, 0); b.position.set(HX + dx, 3.6, -1); S.add(b);
  const n = label(name, { w: 900, size: 84, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.55 }); n.position.set(HX + dx, 4.15, -0.7); S.add(n);
  const val = label('', { w: 600, size: 120, color: col, stroke: 16, strokeColor: '#1a1a22', sx: 1.1 }); val.material.depthTest = false; val.renderOrder = 9; S.add(val);
  return { b, n, val, v, dx };
});
function setBar(i, k) { const B = BARS[i]; const h = Math.max(0.001, B.v * 0.24 * k); B.b.scale.y = h; B.b.visible = k > 0.005; B.val.visible = k > 0.05; B.val.position.set(HX + B.dx, 3.6 - h - 0.42, -0.4); B.val.userData.set(`−${(B.v * k).toFixed(k > 0.99 ? 2 : 1)}`); }
const mm = label('上の血圧の下がり方（mmHg・2023年の分析）', { w: 1500, size: 72, color: '#e8ecf4', sx: 3.2 }); mm.position.set(HX, 5.0, -0.4); S.add(mm);

// ---------- J：医師に相談（x=300） ----------
const JX = 300;
const jfloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat('#dfe6ec', { depthWrite: false })); jfloor.rotation.x = -Math.PI / 2; jfloor.position.set(JX, 0.02, -1); jfloor.renderOrder = -0.8; S.add(jfloor);
const jwall = box(12, 3.4, 0.2, mat('#f4f6f8')); jwall.position.set(JX, 1.7, -3.2); S.add(jwall);
const cross = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: '#3aa86a' }); const a = box(0.7, 0.22, 0.04, m); const b = box(0.22, 0.7, 0.04, m); cross.add(a, b); } cross.position.set(JX + 1.6, 1.5, -3.08); S.add(cross);
const DOC = makeMan({ shirt: '#f4f4f2', pants: '#7a8494', hair: '#3a3330' }); DOC.position.set(JX + 0.8, 0, -1.4); DOC.rotation.y = -0.6; S.add(DOC);
const steth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16, Math.PI), mat('#2a2e36')); steth.position.set(0, 1.32, 0.15); steth.rotation.z = Math.PI; DOC.add(steth);
const PAT = you(); S.add(PAT);
const isha = label('血圧が高い人・心臓に持病がある人', { w: 1400, size: 80, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 2.75 }); isha.position.set(JX, 2.75, -1.0); S.add(isha);
const isha2 = label('先に医師に相談', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.55 }); isha2.position.set(JX, 2.2, -1.0); S.add(isha2);

// ---------- K：結果（x=360） ----------
const KX = 360;
const KWALL = makeWallSet({ w: 9, h: 3.3, color: '#ece4d4', floor: '#b8966a' }); KWALL.position.set(KX, 0, -1.2); S.add(KWALL);
const K = you(); S.add(K);
const sparkK = makeSparkles(70, 0.14, 0xfff2c0); S.add(sparkK.points); sparkK.init([[KX, 1.2, -0.6]], 1.4, 1.4);
const BPK = makeBPMonitor(); BPK.scale.setScalar(0.62); BPK.position.set(KX - 2.1, 0.7, -0.45); BPK.rotation.y = 0.7; S.add(BPK);
const tableK = box(1.4, 0.7, 0.7, mat('#9a7a58')); tableK.position.set(KX - 2.1, 0.35, -0.5); tableK.rotation.y = 0.7; S.add(tableK);
const TIMERK = makeTimer({ w: 1.1, h: 0.48 }); TIMERK.position.set(KX - 1.0, 1.3, -0.56); TIMERK.rotation.y = 1.13; { const p2 = tPole.clone(); p2.position.set(KX - 1.0, 0.55, -0.56); S.add(p2); const f2 = tFoot.clone(); f2.position.set(KX - 1.0, 0.025, -0.56); S.add(f2); } S.add(TIMERK);

// ---------- 共通 ----------
const PEOPLE = [A, RUN, LIFTER, STILL, PAT, K, DOC];
const LABELS = [heat, ...muri, ...batsu, hatena, ikiOK, crown];
function reset() {
  PEOPLE.forEach(p => { if (p.userData.knees) fitReset(p); else { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); } p.visible = true; });
  A.position.set(0, 0, 0.2); A.rotation.y = 0; sweatA.userData.set(0);
  LABELS.forEach(l => l.visible = false); breath.forEach(b => b.visible = false);
  BP.visible = false; bpTable.visible = false; BP.userData.set('—');
  TIMER.userData.set('2:00'); TIMERK.userData.set('2:00'); TIMER.visible = tPole.visible = tFoot.visible = true;
  RUN.position.set(GX - 1.75, 0.5, -1); LIFTER.position.set(GX + 1.75, 0.5, -1); STILL.position.set(GX, 0.9, -1.3);
  [RUN, LIFTER, STILL].forEach(p => p.rotation.y = 0); RUN.visible = LIFTER.visible = true; dumb.visible = false; miniWall.visible = false; nRun.visible = nLift.visible = nStill.visible = false; spot.intensity = 0;
  BARS.forEach((B, i) => setBar(i, 0)); PAT.position.set(JX - 0.8, 0, -1.2); PAT.rotation.y = 0.6;
  K.position.set(KX, 0, -1.0); sparkK.set(0); BPK.userData.set('—');
  hemi.intensity = 1.25; el.flash.style.opacity = 0;
}
// 空気椅子の人と壁を斜め前から（太ももの水平が見える角度）
function wallCam(u = 0, zoom = 0, ty = 1.0) { const d = lerp(5.0, 4.7, u) - zoom * 1.2; look(-0.25 + 0.906 * d, ty + 0.1 * d, 0.35 + 0.423 * d, -0.25, ty, 0.35, 44); }
function wallSit(p, t, { k = 1, shake = 0, hot = 0 } = {}) { poseWallSit(p, k, shake, t); setThighHeat(p, hot); }
function blow(t, head) { breath.forEach((b, i) => { const u = ((t * 0.7 + i / 3) % 1); b.visible = true; b.position.set(head.x + 0.05, head.y - 0.05 + u * 0.12, head.z + 0.3 + u * 0.9); b.scale.setScalar(1.0 + u * 2.2); b.material.opacity = 0.75 * (1 - u); }); }

function shot0(t) { // 0秒＝サムネ：壁で空気椅子の太ももがぷるぷる、2:00 のタイマーが走り出す
  reset(); lift(0);
  wallSit(A, t, { shake: t > 0.08 ? 1 : 0.3, hot: clamp((t - 0.6) / 2.4) * 0.5 });
  const run = Math.max(0, t - 0.15); TIMER.userData.set(fmtMS(120 - run * 1.0 - (run > 0 ? 0.51 : 0)), t > 0.15 ? '#ff6a5a' : '#7dff8a');
  el.flash.style.opacity = t > 0.15 && t < 0.27 ? 0.22 : 0;
  sweatA.userData.set(clamp((t - 1.2) / 0.5), t);
  wallCam(ease(clamp(t / 3.0)), 0, 1.25);
  return S;
}
function standNoTimer() { TIMER.visible = tPole.visible = tFoot.visible = false; }
function sNegai(t) { // 運動が続かない人の願いから。
  reset(); standNoTimer(); lift(200); A.position.set(0.3, 0, 1.0); A.rotation.y = 0.25; A.userData.head.rotation.x = 0.25; A.userData.arms[0].rotation.set(-0.3, 0, 0.2);
  look(1.9, 1.9, 5.4, 0.0, 1.35, 0.6, 50); return S;
}
function sMuri(t) { // 走るのもジムもムリ。
  reset(); standNoTimer(); lift(200); A.position.set(0.3, 0, 1.0); A.rotation.y = 0.25; A.userData.head.rotation.y = Math.sin(t * 8) * 0.35;
  muri[0].position.set(-0.5, 2.3, 1.0); muri[1].position.set(0.95, 2.3, 1.0); pop(muri[0], t, 0.1); pop(muri[1], t, 0.5);
  batsu[0].position.set(-0.12, 2.5, 1.1); batsu[1].position.set(1.3, 2.5, 1.1); pop(batsu[0], t, 0.8, 0.25); pop(batsu[1], t, 1.1, 0.25);
  look(1.9, 2.0, 5.6, 0.2, 1.55, 0.6, 50); return S;
}
function sKabe(t) { // 壁さえあればできる運動はないの？
  reset(); standNoTimer(); lift(200); A.position.set(0.2, 0, 1.1); A.rotation.y = Math.PI * (1 - 0.15 * ease(clamp(t / 1.0))); A.userData.arms[1].rotation.set(-1.4, 0, 0);
  hatena.position.set(0.4, 2.55, 0.9); pop(hatena, t, 0.8, 0.3);
  look(2.4, 2.0, 5.6, -0.2, 1.45, 0.2, 50); return S;
}
function sMainichi(t) { // 毎日、壁で空気椅子を2分。
  reset(); lift(400); wallSit(A, t, { k: easeOut(clamp(t / 0.9)), shake: 0.2 }); TIMER.userData.set('2:00');
  wallCam(0.6); return S;
}
function sCal(t, d) { // それを30日続ける。
  reset(); lift(260); drawCal(Math.floor(clamp((t - 0.3) / (d - 0.8)) * 30));
  look(CX, 2.4, 7.2, CX, 2.5, -1, 50); return S;
}
function sDay1(t) { // 1日目。30秒で太ももが燃える。
  reset(); lift(400); const sec = Math.min(30, t * 12); wallSit(A, t, { shake: 0.6 + sec / 30, hot: sec / 30 });
  TIMER.userData.set(fmtMS(120 - sec), '#ff6a5a'); sweatA.userData.set(clamp(sec / 20), t);
  if (sec >= 30) { heat.position.set(0.0, 0.8, 0.72); pop(heat, t, 2.5, 0.3, 1.15); }
  hudTime('1日目'); wallCam(0.3, ease(clamp(t / 3)) * 0.35); return S;
}
function sAshi(t, d) { // でも本当に変わるのは、脚じゃなかった。
  reset(); lift(400); wallSit(A, t, { shake: 0.7, hot: 0.8 }); TIMER.userData.set('1:28', '#ff6a5a');
  BP.visible = bpTable.visible = true; standNoTimer(); bpTable.position.set(-1.0, 0.35, 0.75); bpTable.rotation.y = 1.13; BP.position.set(-1.0, 0.7, 0.75); BP.rotation.y = 1.13; BP.scale.setScalar(0.75);
  const k = clamp((t - 0.8) / 0.6); BP.position.y = 0.7 + (1 - easeOut(k)) * -0.8; BP.userData.set(k > 0.9 ? '？' : '—', '', '#c8242c');
  const u = ease(clamp(t / d)); look(lerp(3.2, 3.6, u), lerp(1.3, 1.7, u), lerp(2.3, 3.6, u), lerp(-0.3, -1.0, u), lerp(0.75, 0.95, u), 0.6, 50); return S;
}
function studyCam(u = 0) { look(FX, lerp(5.4, 6.2, u), lerp(8.2, 9.2, u), FX, 0.2, -3.0, 52); }
function sStudy(t, d) { // 2023年、270の研究・1万5,827人をまとめた分析
  reset(); lift(330); studyCam(ease(clamp(t / d)));
  setTop('2023年の分析・まとめた人数', '15,827人', fade(t, 0.6, d - 0.1, 0.25), BLUE); return S;
}
function rankSet(t, { still = 0, name = 0, crownOn = -1 } = {}) {
  dumb.visible = true; miniWall.visible = true;
  RUN.position.set(GX - 1.75, 0.5, -1); RUN.rotation.y = -0.3; { const U = RUN.userData; const ph = t * 9; const s = Math.sin(ph); U.legs[0].rotation.x = s * 0.6; U.legs[1].rotation.x = -s * 0.6; U.knees[0].rotation.x = 0.4 + Math.max(0, Math.sin(ph + 1.2)) * 0.9; U.knees[1].rotation.x = 0.4 + Math.max(0, Math.sin(ph + 1.2 + Math.PI)) * 0.9; U.arms[0].rotation.x = -s * 0.9; U.arms[1].rotation.x = s * 0.9; RUN.position.y = 0.5 + Math.abs(Math.cos(ph)) * 0.05; }
  LIFTER.position.set(GX + 1.75, 0.5, -1); LIFTER.rotation.y = 0.3; { const k = 0.5 + 0.5 * Math.sin(t * 4); LIFTER.userData.arms.forEach((a, i) => a.rotation.set(-0.4 - 2.4 * k, 0, 0)); }
  STILL.position.set(GX - 0.22, 0.9, -1.0); STILL.rotation.y = Math.PI / 2; wallSit(STILL, t, { shake: 0.2 });
  nRun.visible = true; nLift.visible = true; nRun.scale.set(0.8 * nRun.userData.fit, 0.8 * nRun.userData.fit * nRun.userData.ar, 1); nLift.scale.set(1.0 * nLift.userData.fit, 1.0 * nLift.userData.fit * nLift.userData.ar, 1);
  if (name >= 0) pop(nStill, t, name, 0.3);
  spot.intensity = 60 * still; hemi.intensity = 1.25 - 0.55 * still;
  if (crownOn >= 0) pop(crown, t, crownOn, 0.3);
}
function rankCam(u = 0) { look(GX + lerp(0, 0.6, u), lerp(3.6, 3.3, u), lerp(10.5, 9.6, u), GX, 1.7, -1, 50); }
function sRank1(t, d) { // 血圧を一番下げた運動は、
  reset(); lift(250); rankSet(t, { name: -1 }); rankCam(ease(clamp(t / d)) * 0.3); return S;
}
function sRank2(t, d) { // 走るでも筋トレでもなく、
  reset(); lift(250); rankSet(t, { name: -1 }); batsu[0].position.set(GX - 1.75, 1.6, -0.3); batsu[1].position.set(GX + 1.75, 1.6, -0.3); pop(batsu[0], t, 0.3, 0.25); pop(batsu[1], t, 1.0, 0.25);
  rankCam(0.3); return S;
}
function sRank3(t, d) { // じっと止まる運動だった。
  reset(); lift(250); rankSet(t, { still: clamp(t / 0.5), name: 0.3 }); rankCam(0.3 + ease(clamp(t / d)) * 0.7); return S;
}
function sWallSquat(t, d) { // その中で、上の血圧を下げる1位が、空気椅子。
  reset(); lift(290); rankSet(t, { still: 1, name: -1, crownOn: 1.2 }); nStill.visible = true; nStill.userData.set(t > 1.0 ? '空気椅子' : 'じっと止まる運動'); nRun.visible = nLift.visible = false; RUN.visible = LIFTER.visible = false;
  look(GX + 2.4, 3.0, 6.0, GX, 2.3, -1.2, 50);
  setTop('種類別 上の血圧を下げる1位', '空気椅子', fade(t, 1.3, d - 0.1, 0.25), GOLD); return S;
}
function barCam() { look(HX, 3.6, 9.4, HX, 3.4, -1, 50); }
function sBar1(t, d) { // じっと止まる運動で、上の血圧は平均で約8下がった。
  reset(); lift(330); setBar(0, easeOut(clamp((t - 0.6) / 1.6))); BARS[1].b.visible = false; BARS[1].n.visible = false;
  barCam(); setTop('じっと止まる運動・上の血圧', '約−8', fade(t, 2.2, d - 0.1, 0.25), GOLD); return S;
}
function sBar2(t, d) { // 走るなどの有酸素運動は約4.5。
  reset(); lift(330); setBar(0, 1); BARS[1].n.visible = true; setBar(1, easeOut(clamp((t - 0.3) / 1.2)));
  barCam(); setTop('有酸素運動・上の血圧', '約−4.5', fade(t, 1.4, d - 0.1, 0.25), BLUE); return S;
}
function sWeek2(t, d) { // 2週目。2分たっても、脚が震えにくくなってくる。
  reset(); lift(400); const sec = Math.min(120, 100 + t * 12); wallSit(A, t, { shake: 0.08 });
  TIMER.userData.set(fmtMS(120 - sec), sec >= 120 ? '#7dff8a' : '#ff6a5a');
  hudTime('2週目'); wallCam(0.6, 0.25 - ease(clamp(t / d)) * 0.25); return S;
}
function sIki(t, d) { // ただし息は止めない。
  reset(); lift(400); wallSit(A, t, { shake: 0.1 }); TIMER.userData.set('1:05', '#ff6a5a');
  const h = new THREE.Vector3(); A.userData.head.getWorldPosition(h); h.y += 0.2; blow(t, h);
  standNoTimer(); ikiOK.position.set(-0.75, 1.5, 0.45); pop(ikiOK, t, 0.3, 0.3);
  look(3.0, 1.6, 2.8, -0.3, 1.15, 0.5, 50); return S;
}
function sIsha(t, d) { // 血圧が高い人・心臓に持病がある人は、先に医師に相談。
  reset(); lift(180); DOC.userData.arms[1].rotation.set(-0.9 + Math.sin(t * 3) * 0.1, 0, 0); PAT.userData.head.rotation.x = 0.1 * Math.sin(t * 2);
  isha.visible = true; isha.scale.set(2.75 * isha.userData.fit, 2.75 * isha.userData.fit * isha.userData.ar, 1); pop(isha2, t, 0.8, 0.3);
  look(JX, 2.2, 7.0, JX, 1.55, -1.2, 50); return S;
}
function sKekka(t, d) { // 結果：血圧を一番下げたのは、動かない2分の運動だった。
  reset(); lift(400); K.position.set(KX, 0, -0.98); wallSit(K, t, { shake: 0.05 }); TIMERK.userData.set('0:00', '#7dff8a');
  sparkK.set(clamp((t - 0.3) / 3.5)); BPK.userData.set('↓', '平均 約−8', '#1a6a3a');
  const u = ease(clamp(t / d)); look(KX + lerp(3.7, 3.3, u), 1.55, lerp(1.7, 1.4, u), KX - 0.45, 0.95, -0.63, 50);
  setTop('結果', '動かない2分が1位', fade(t, 0.3, d - 0.1, 0.25), GREEN); return S;
}
function sJimi(t, d) { // 一番効いたのは、一番地味な運動だった。
  reset(); lift(400); K.position.set(KX, 0, -0.98); wallSit(K, t, { shake: 0.04 }); TIMERK.userData.set('0:00', '#7dff8a'); BPK.userData.set('↓', '平均 約−8', '#1a6a3a');
  const u = ease(clamp(t / d)); look(KX + lerp(2.6, 2.0, u), lerp(2.0, 2.4, u), lerp(5.4, 6.6, u), KX - 0.9, 1.0, -0.8, 50); return S;
}
function sAsk(t) { // 質問：最後は冒頭と同じ構図
  reset(); lift(330); wallSit(A, t, { shake: 0.8 }); TIMER.userData.set('2:00'); wallCam(0, 0, 1.0); return S;
}

const NARR = { '空気椅子': 'くうきいす', '2分': 'にふん', '30日': 'さんじゅうにち', '1日目': 'いちにちめ', '30秒': 'さんじゅうびょう', '2023年': 'にせんにじゅうさんねん', '270の研究': 'にひゃくななじゅうのけんきゅう', '1万5,827人': 'いちまんごせんはっぴゃくにじゅうななにん', '1位': 'いちい', '約8': 'やくはち', '約4.5': 'やくよんてんご', '2週目': 'にしゅうめ', '結果：': '結果、', '有酸素運動': 'ゆうさんそうんどう', '何秒': 'なんびょう', '太もも': 'ふともも', '地味': 'じみ' };
const P = planTimes([
  ['運動が続かない人の<br>願いから。', sNegai],
  ['走るのもジムもムリ。', sMuri],
  ['壁さえあればできる<br>運動はないの？', sKabe],
  ['毎日、壁で空気椅子を2分。', sMainichi],
  ['それを30日続ける。', sCal],
  ['1日目。30秒で<br>太ももが燃える。', sDay1],
  ['でも本当に変わるのは、<br>脚じゃなかった。', sAshi],
  ['2023年、270の研究・<br>1万5,827人をまとめた分析。', sStudy],
  ['血圧を一番下げた運動は、', sRank1],
  ['走るでも筋トレでもなく、', sRank2],
  ['じっと止まる運動だった。', sRank3],
  ['その中で、上の血圧を<br>下げる1位が、空気椅子。', sWallSquat],
  ['じっと止まる運動で、<br>上の血圧は平均で約8下がった。', sBar1],
  ['走るなどの有酸素運動は<br>約4.5。', sBar2],
  ['2週目。2分たっても、<br>脚が震えにくくなってくる。', sWeek2],
  ['ただし息は止めない。', sIki],
  ['血圧が高い人・心臓に持病が<br>ある人は、先に医師に相談。', sIsha],
  ['結果：血圧を一番下げたのは、<br>動かない2分の運動だった。', sKekka],
  ['一番効いたのは、<br>一番地味な運動だった。', sJimi],
  ['空気椅子、あなたは<br>何秒もつ？', sAsk],
], { shot0, endCard, start: 2.9, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0652',
    v2: true,
    hookLine: '壁で空気椅子の太ももがぷるぷる震えて、2:00 のタイマーが走り出す。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日空気椅子を30日続けたら？',
    titleHtml: 'もしも毎日<br>空気椅子を<br>30日続けたら？',
    mood: 'hopeful', seed: 652, hits: [0.15, P.at(17), P.at(18)], risers: [P.at(6)],
    impacts: [P.at(7, 1.0), P.at(10, 0.4), P.at(11, 1.2), P.at(12, 2.2), P.at(13, 1.4), P.at(17, 0.3)],
    sfx: [[0.15, 'alarm'], [P.at(1, 0.8), 'whoosh'], [P.at(1, 1.1), 'whoosh'], [P.at(2, 0.8), 'bubble'], [P.at(5, 0.4), 'meter', 0.5], [P.at(6, 0.8), 'bubble'], [P.at(9, 0.3), 'whoosh'], [P.at(9, 1.0), 'whoosh'], [P.at(15, 0.3), 'bubble'], [P.at(16, 0.8), 'bubble']],
    narr: NARR,
    ask: '空気椅子、あなたは何秒もつ？',
    caption: 'もしも毎日空気椅子を30日続けたら？\n\n運動が続かない人の願いから。走るのもジムもムリ。壁さえあればできる運動はないの？\n毎日、壁で空気椅子を2分。それを30日続ける。\n1日目。30秒で太ももが燃える。\nでも本当に変わるのは、脚じゃなかった。\n2023年、270の研究・1万5,827人をまとめた分析。血圧を一番下げた運動は、走るでも筋トレでもなく、じっと止まる運動だった。その中で、上の血圧を下げる1位が、空気椅子。\nじっと止まる運動で、上の血圧は平均で約8下がった。走るなどの有酸素運動は約4.5。\n2週目。2分たっても、脚が震えにくくなってくる。\nただし息は止めない。血圧が高い人・心臓に持病がある人は、先に医師に相談。\n\n結果：血圧を一番下げたのは、動かない2分の運動だった。\n一番効いたのは、一番地味な運動だった。\n\n空気椅子、あなたは何秒もつ？ コメントで教えて。\n\n※1日2分×30日は もしもの設定です（研究のやり方そのものではありません）。数字は2週間以上の運動の研究をまとめた平均（mmHg）\n出典：Edwards ほか British Journal of Sports Medicine 2023（270件のランダム化比較試験・15,827人の分析。じっと止まる運動 上の血圧 −8.24・有酸素運動 −4.49 mmHg、種類別で上の血圧1位は空気椅子）',
    hashtags: ['もしもラボ', '空気椅子', '血圧', '30日チャレンジ', '筋トレ'],
    endStats: [['じっと止まる運動・上の血圧', '−8.24', 'mmHg・270の研究の平均'], ['走るなど有酸素運動・上の血圧', '−4.49', 'mmHg・270の研究の平均'], ['種類別 上の血圧を下げる1位', '空気椅子', '2023年の分析']],
    sources: '出典：Edwards ほか British Journal of Sports Medicine 2023（270件・15,827人）<br>※1日2分×30日は もしもの設定',
  },
});
