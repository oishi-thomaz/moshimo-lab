import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, hudTime, el } from '../story.js';
import { makeMan, label, pop } from '../satire-kit.js';
import { makeSuit, makeChair, makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, poseRun, poseFastWalk, makeTimer, makeStairs, makeEscalator, makeDayStrip, planTimes } from '../scenes/fitness.js';

// もしも毎日3回、1分だけ全力を出したら？（台本 S43・人体の限界）
// 2026/11/04 ゆうと承認。0614 ラン の 運動はほとんどしていないあなた＋寿命の数字 の型
// 数字（一次資料で確認済み）：
//  Stamatakis E ほか. Nature Medicine 2022;28(12):2521-2529（doi:10.1038/s41591-022-02100-x、PubMed 36482104）
//   運動の習慣がない UK Biobank の 25,241人（平均61.8歳）に手首の計測器。平均6.9年の追跡で852人が死亡
//   1〜2分の激しい生活の動き（VILPA）が1日3回（中央値）の人は、ない人より 全死亡・がん死亡が38〜40%、心血管の死亡が48〜49%低い
//  観察研究なので 低い側へ と言い、効果とは言い切らない（画面に 観察研究 と出す）
// 安全：持病がある人は無理せず医師に相談してから（字幕と画面の札で必ず出す）
// 駅名・電車は出さない（架空の駅の階段だけ）

const GOLD = '#ffd27a', RED = '#ff6a5a', GREEN = '#9be86a', BLUE = '#7fd4ff', ORANGE = '#ff8a3a';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(8, 16, 10); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.95; S.add(ground);

function suit(o = {}) { return addKnees(makeSuit({ jacket: '#2e3442', tie: '#c8423a', ...o })); }

// ---------- A：駅の階段とエスカレーター（原点） ----------
const N = 16, RISE = 0.17, RUN = 0.3, TOPY = N * RISE;
const sfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat('#b9b4aa', { depthWrite: false })); sfloor.rotation.x = -Math.PI / 2; sfloor.position.set(0, 0.01, 2); sfloor.renderOrder = -0.8; S.add(sfloor);
const tiles = new THREE.Group(); S.add(tiles); for (let i = 0; i < 7; i++) { const l = box(0.04, 0.005, 14, mat('#a8a39a', { depthWrite: false })); l.position.set(-6 + i * 2, 0.02, 2); l.renderOrder = -0.7; tiles.add(l); }
const STAIRS = makeStairs({ n: N, rise: RISE, run: RUN, w: 2.4 }); S.add(STAIRS);
const ESC = makeEscalator({ n: N, rise: RISE, run: RUN, w: 1.1 }); ESC.position.set(-2.2, 0, 0); S.add(ESC);
const lwall = box(0.2, 6, 16, mat('#d8d4cc')); lwall.position.set(-3.3, 3, -2); S.add(lwall);
const stripe = box(0.05, 0.3, 16, mat('#3a8ad8')); stripe.position.set(-3.18, 2.2, -2); S.add(stripe);
const upper = box(8, TOPY, 6, mat('#a8a39a')); upper.position.set(-0.5, TOPY / 2 - 0.002, -N * RUN - 3); S.add(upper);
const RUNNER = suit(); S.add(RUNNER); const sweatR = makeSweat(); RUNNER.userData.head.add(sweatR);
const WATCH = makeTimer({ w: 1.25, h: 0.52 }); S.add(WATCH);
const watchRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 20), mat('#c8ccd4')); S.add(watchRing);
const upLab = label('階段', { w: 400, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.75 }); S.add(upLab);
const escLab = label('エスカレーター', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.35 }); S.add(escLab);
const RIDERS = [0, 1, 2].map(i => { const p = suit({ jacket: ['#4a5060', '#5a4a3a', '#3a4a5a'][i], tie: '#3a6ab2' }); S.add(p); return p; });
const sparkA = makeSparkles(90, 0.16, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0.35, TOPY + 1.3, -N * RUN - 0.1]], 1.0, 1.4);

// ---------- B：会社（x=70） ----------
const BX = 70;
const bfloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat('#8a8070', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.01, -1); bfloor.renderOrder = -0.8; S.add(bfloor);
const bwall = box(12, 3.6, 0.2, mat('#e6e2da')); bwall.position.set(BX, 1.8, -3.2); S.add(bwall);
const desk = box(1.8, 0.08, 0.9, mat('#e8e4dc')); desk.position.set(BX, 0.74, -1.3); S.add(desk);
const dleg = box(1.7, 0.7, 0.05, mat('#9aa0aa')); dleg.position.set(BX, 0.37, -0.9); S.add(dleg);
const mon = box(0.8, 0.5, 0.05, mat('#22252c')); mon.position.set(BX + 0.25, 1.08, -1.05); mon.rotation.y = 0.15; S.add(mon);
const monG = box(0.74, 0.44, 0.01, new THREE.MeshBasicMaterial({ color: '#6aa8e8' })); monG.position.set(BX + 0.25, 1.08, -1.085); monG.rotation.y = 0.15; S.add(monG);
const chair = makeChair(); chair.position.set(BX - 0.1, 0, -2.25); chair.rotation.y = 0; S.add(chair);
const WORKER = suit(); S.add(WORKER); const sweatW = makeSweat(); WORKER.userData.head.add(sweatW);
const clockC = label('22:00', { w: 600, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.1 }); clockC.position.set(BX + 0.55, 2.5, -3.0); S.add(clockC);
const gym = label('ジム', { w: 400, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.75 }); gym.position.set(BX - 0.6, 2.3, -1.6); S.add(gym);
const papers = new THREE.Group(); for (let i = 0; i < 9; i++) { const p = box(0.32, 0.03, 0.42, mat('#f4f4ef')); p.position.set(BX - 0.55, 0.8 + i * 0.03, -1.45); p.rotation.y = (i * 0.37) % 0.3; papers.add(p); } papers.position.set(-0.1, 0, 0.1); S.add(papers);

// ---------- C：1日の帯（x=130） ----------
const CX = 130;
const STRIP = makeDayStrip({ w: 3.4, h: 1.35 }); STRIP.position.set(CX, 2.2, -1); S.add(STRIP);
const cfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -1); cfloor.renderOrder = -0.8; S.add(cfloor);

// ---------- D：3つの1分（x=190） ----------
const DX = 190;
const dfloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat('#3a3e4c', { depthWrite: false })); dfloor.rotation.x = -Math.PI / 2; dfloor.position.set(DX, 0.01, -1); dfloor.renderOrder = -0.8; S.add(dfloor);
const miniSt = makeStairs({ n: 6, rise: 0.17, run: 0.3, w: 0.8 }); miniSt.position.set(DX - 1.55, 0, -0.2); S.add(miniSt);
const D1 = suit(); S.add(D1); const D2 = suit({ jacket: '#3a4a5a' }); S.add(D2); const D3 = suit({ jacket: '#4a5060' }); S.add(D3);
const crate = box(0.55, 0.42, 0.42, mat('#c8a070')); S.add(crate);
const dl = [['階段ダッシュ', -1.55], ['早歩き', 0], ['重い荷物運び', 1.55]].map(([s, dx]) => { const l = label(s, { w: 700, size: 100, color: '#2a1a00', bg: 'rgba(255,214,90,.97)', sx: 0.95 }); l.position.set(DX + dx, dx === 0 ? 2.35 : 2.85, -0.6); S.add(l); return l; });

// ---------- E：なしなしなし（A の階段の下で） ----------
const NASHI = ['ジムなし', 'ウェアなし', '着替えなし'].map(s => { const l = label(s, { w: 700, size: 100, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.2 }); S.add(l); return l; });
const ANATA = label('運動はほぼゼロ', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.45 }); S.add(ANATA);

// ---------- F：研究の人たち（x=250） ----------
const FX = 250;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.01, -3); ffloor.renderOrder = -0.8; S.add(ffloor);
const CROWD = (() => { const n = 2000, cols = 56; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mat('#c8ccd8'), n); const M = new THREE.Matrix4(); const r = rng(53); const col = new THREE.Color(); for (let i = 0; i < n; i++) { M.makeTranslation(FX - 10 + (i % cols) * 0.36 + (r() - 0.5) * 0.08, 0.28, -2 - Math.floor(i / cols) * 0.36); m.setMatrixAt(i, M); m.setColorAt(i, col.set('#c8ccd8')); } S.add(m); return m; })();
const HOT = new Set(); { const r = rng(9); for (let i = 0; i < 2000; i++) if (r() < 0.5) HOT.add(i); }
let crowdKey = -1;
function crowdHot(k) { const kk = Math.round(k * 20); if (kk === crowdKey) return; crowdKey = kk; const c = new THREE.Color(), a = new THREE.Color('#c8ccd8'), b = new THREE.Color(ORANGE); for (let i = 0; i < 2000; i++) CROWD.setColorAt(i, HOT.has(i) ? c.copy(a).lerp(b, kk / 20) : a); CROWD.instanceColor.needsUpdate = true; }
const kansatsu = label('※観察研究（イギリス）', { w: 900, size: 80, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 1.8 }); S.add(kansatsu);

// ---------- G：手首の計測器（x=310） ----------
const GX = 310;
const ARM = new THREE.Group(); S.add(ARM); ARM.position.set(GX, 1.5, -1);
{ const fa = box(3.4, 0.62, 0.62, mat('#f1c9a5')); fa.position.x = -0.6; ARM.add(fa); const hd = box(0.8, 0.7, 0.75, mat('#f1c9a5')); hd.position.x = 1.45; ARM.add(hd); const sl = box(1.3, 0.8, 0.8, mat('#2e3442')); sl.position.x = -2.4; ARM.add(sl); const band = box(0.5, 0.66, 0.66, mat('#2a2e36')); band.position.x = 0.6; ARM.add(band); }
const devC = document.createElement('canvas'); devC.width = 512; devC.height = 384; const devT = new THREE.CanvasTexture(devC); devT.colorSpace = THREE.SRGBColorSpace; let devKey = -1;
function drawDev(k) {
  const kk = Math.round(k * 30); if (kk === devKey) return; devKey = kk; const g = devC.getContext('2d');
  g.fillStyle = '#0d1016'; g.fillRect(0, 0, 512, 384); g.strokeStyle = '#3a4050'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 300); g.lineTo(492, 300); g.stroke();
  g.strokeStyle = '#7dff8a'; g.lineWidth = 8; g.beginPath(); const n = Math.max(2, Math.floor(kk / 30 * 60));
  for (let i = 0; i < n; i++) { const x = 20 + i * 8; const sp = [14, 30, 46].some(c => Math.abs(i - c) < 2) ? 190 : 12 + ((i * 37) % 9) * 3; const y = 300 - sp; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke(); devT.needsUpdate = true;
}
const devScr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.48), new THREE.MeshBasicMaterial({ map: devT })); devScr.position.set(GX + 0.6, 1.5 + 0.395, -1); devScr.rotation.x = -Math.PI / 2; S.add(devScr);
const devBody = box(0.7, 0.08, 0.56, mat('#1b1e26')); devBody.position.set(GX + 0.6, 1.5 + 0.35, -1); S.add(devBody);

// ---------- H：死亡リスクの棒（x=370）・I：心臓と血管（x=430） ----------
function riskSet(X, title, v, colB) {
  const fl = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#2e3446', { depthWrite: false })); fl.rotation.x = -Math.PI / 2; fl.position.set(X, 0.02, -1); fl.renderOrder = -0.8; S.add(fl);
  const mk = (name, col, dx) => { const b = box(1.5, 1, 0.8, mat(col)); b.geometry.translate(0, 0.5, 0); b.position.set(X + dx, 0.3, -1); S.add(b); const n = label(name, { w: 700, size: 90, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.3 }); n.position.set(X + dx, 0.0, -0.4); S.add(n); return { b, n }; };
  const A = mk('全くしない人', '#8a909c', -1.2), B = mk('1日3回の人', colB, 1.2);
  const ttl = label(title, { w: 1100, size: 84, color: '#e8ecf4', sx: 2.2 }); ttl.position.set(X, 3.55, -1); S.add(ttl);
  const va = label('', { w: 600, size: 110, color: '#fff', stroke: 14, strokeColor: '#1a1a22', sx: 1.0 }); va.material.depthTest = false; va.renderOrder = 9; S.add(va);
  const vb = label('', { w: 900, size: 120, color: colB, stroke: 16, strokeColor: '#1a1a22', sx: 1.6 }); vb.material.depthTest = false; vb.renderOrder = 9; S.add(vb);
  const H = 2.4;
  function set(ka, kb) {
    const ha = Math.max(0.001, H * ka), hb = Math.max(0.001, H * (1 - (1 - v) * kb) * (ka > 0.99 ? 1 : ka));
    A.b.scale.y = ha; B.b.scale.y = hb; A.b.visible = ka > 0.01; B.b.visible = ka > 0.01;
    va.visible = ka > 0.9; va.position.set(X - 1.2, 0.3 + ha + 0.35, -0.6); va.userData.set('100');
    vb.visible = ka > 0.9; vb.position.set(X + 1.2, 0.3 + hb + 0.35, -0.6); vb.userData.set(kb > 0.95 ? `${title.includes('心臓') ? '48〜49' : '38〜40'}%低い` : String(Math.round(100 * (1 - (1 - v) * kb))));
  }
  return { set, X };
}
const RISK = riskSet(370, '死亡リスク（全くしない人を100）', 0.61, ORANGE);
const HEART = riskSet(430, '心臓や血管の病気で亡くなるリスク', 0.515, RED);
const kansatsuH = label('※観察研究（効果の証明ではない）', { w: 1300, size: 76, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 2.5 }); S.add(kansatsuH);

// ---------- J：6.9年（x=490） ----------
const JX = 490;
const jfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#3a3448', { depthWrite: false })); jfloor.rotation.x = -Math.PI / 2; jfloor.position.set(JX, 0.02, -1); jfloor.renderOrder = -0.8; S.add(jfloor);
const YEARS = Array.from({ length: 7 }, (_, i) => { const g = new THREE.Group(); g.position.set(JX - 3.0 + i * 1.0, 2.7, -1); S.add(g); const bg = box(0.86, 1.2, 0.12, mat('#2a2e3a')); g.add(bg); const fm = new THREE.MeshBasicMaterial({ color: '#7fd4ff' }); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 1.1), fm); f.geometry.translate(0.38, 0, 0); f.position.set(-0.38, 0, 0.07); g.add(f); const l = label(`${i + 1}年`, { w: 300, size: 90, color: '#fff', sx: 0.55 }); l.position.set(0, -0.95, 0.1); g.add(l); return { g, f }; });
function setYears(y) { YEARS.forEach((Y, i) => { const k = clamp(y - i); Y.f.scale.x = Math.max(0.001, k); Y.f.visible = k > 0.001; }); }
const FOLK = Array.from({ length: 9 }, (_, i) => { const p = makeMan({ shirt: ['#e05a4f', '#4f6a8f', '#6b7a5a'][i % 3] }); p.position.set(JX - 2.8 + i * 0.7, 0, 0.8); p.scale.setScalar(0.6); S.add(p); return p; });

// ---------- K：医師に相談（x=550） ----------
const KX = 550;
const kfloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat('#dfe6ec', { depthWrite: false })); kfloor.rotation.x = -Math.PI / 2; kfloor.position.set(KX, 0.02, -1); kfloor.renderOrder = -0.8; S.add(kfloor);
const kwall = box(12, 3.4, 0.2, mat('#f4f6f8')); kwall.position.set(KX, 1.7, -3.2); S.add(kwall);
const cross = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: '#3aa86a' }); cross.add(box(0.7, 0.22, 0.04, m), box(0.22, 0.7, 0.04, m)); } cross.position.set(KX + 1.6, 1.5, -3.08); S.add(cross);
const DOC = makeMan({ shirt: '#f4f4f2', pants: '#7a8494', hair: '#3a3330' }); DOC.position.set(KX + 0.8, 0, -1.4); DOC.rotation.y = -0.6; S.add(DOC);
const steth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16, Math.PI), mat('#2a2e36')); steth.position.set(0, 1.32, 0.15); steth.rotation.z = Math.PI; DOC.add(steth);
const PAT = suit({ old: true, hair: '#8a8a8a' }); PAT.position.set(KX - 0.8, 0, -1.2); PAT.rotation.y = 0.6; S.add(PAT);
const isha = label('持病がある人は', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); isha.position.set(KX, 2.75, -1.0); S.add(isha);
const isha2 = label('無理せず 医師に相談', { w: 1000, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.85 }); isha2.position.set(KX, 2.2, -1.0); S.add(isha2);

// ---------- 共通 ----------
const KNEE = [RUNNER, WORKER, D1, D2, D3, PAT, ...RIDERS];
const LABELS = [upLab, escLab, gym, ...NASHI, ANATA, kansatsu, kansatsuH, isha, isha2];
function reset() {
  KNEE.forEach(p => { fitReset(p); p.visible = true; });
  WORKER.position.set(BX - 0.1, 0, -2.1); D1.position.set(DX - 1.55, 0, -0.2); D2.position.set(DX, 0, -0.6); D3.position.set(DX + 1.55, 0, -0.6); PAT.position.set(KX - 0.8, 0, -1.2); PAT.rotation.y = 0.6;
  [DOC, ...FOLK].forEach(p => { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.position.y = 0; });
  LABELS.forEach(l => l.visible = false); sweatR.userData.set(0); sweatW.userData.set(0);
  WATCH.visible = watchRing.visible = false; WATCH.userData.set('0:59', RED);
  RIDERS.forEach((p, i) => { p.visible = false; }); sparkA.set(0); ESC.userData.flow(0);
  STRIP.userData.set(0); crowdHot(0); drawDev(0); setYears(0); RISK.set(0, 0); HEART.set(0, 0);
  hemi.intensity = 1.25; el.flash.style.opacity = 0; crate.visible = false;
}
// 階段の s 段目を駆け上がる人（ph は脚の位相）
function climb(p, s, ph, amp = 1) { const [y, z] = STAIRS.userData.at(s); p.position.set(0.35, y, z - RUN * 0.5); p.rotation.y = Math.PI; poseRun(p, ph, amp); p.position.y += Math.abs(Math.sin(ph)) * 0.05; p.rotation.order = 'YXZ'; }
function stairCam(u = 0, d = 0, ty = 2.25, tz = -2.2) { const k = lerp(6.8, 6.3, u) - d; look(0.3 + k, ty + 0.55 + 0.1 * k, tz, 0.3, ty + 0.55, tz, 50); }
// ストップウォッチはカメラの見ている所の左下に置く（カメラが動いても画面の同じ所）
function watchNear(tz, ty, s, col, dy = -1.15, dz = 0.8) { watchAt(1.75, ty + dy, tz + dz, s, col); }
function watchAt(x, y, z, s, col, ry = Math.PI / 2) { WATCH.visible = watchRing.visible = true; WATCH.position.set(x, y, z); WATCH.rotation.y = ry; watchRing.position.set(x, y + 0.42, z); watchRing.rotation.y = ry; WATCH.userData.set(s, col); }
function riders(t) { RIDERS.forEach((p, i) => { p.visible = true; const u = ((t * 0.05 + i / 3) % 1); const d = u * (N * RUN + 1.6) - 0.8; const y = d < 0 ? 0 : d > N * RUN ? TOPY : d * RISE / RUN; p.position.set(-2.2, y + 0.03, -d); p.rotation.y = Math.PI; }); }

function shot0(t) { // 0秒＝サムネ：駅の階段をスーツの男が駆け上がり、ストップウォッチが 1:00 で止まる
  reset(); lift(0); ESC.userData.flow(t); riders(t);
  const s = Math.min(N - 0.2, 5.5 + t * 1.6); climb(RUNNER, s, t * 11.5, t < 0.5 ? 1 : 0.9); const tz = STAIRS.userData.at(s)[1] - RUN * 0.5, ty = STAIRS.userData.at(s)[0] + 1.25;
  const stop = t >= 0.45; watchNear(tz, ty, stop ? '1:00' : '0:59', stop ? GOLD : RED);
  el.flash.style.opacity = stop && t < 0.57 ? 0.25 : 0; sweatR.userData.set(clamp((t - 1.0) / 0.5), t);
  stairCam(ease(clamp(t / 3)), 0, ty, tz);
  return S;
}
function officeCam(u = 0) { look(BX + lerp(1.0, 0.7, u), 2.3, lerp(3.4, 2.9, u), BX - 0.1, 1.35, -1.8, 50); }
function seated(p) { const U = p.userData; U.legs.forEach(l => l.rotation.x = -Math.PI / 2); U.knees.forEach(k => k.rotation.x = Math.PI / 2); p.position.set(BX - 0.1, -0.36, -2.1); p.rotation.y = 0; }
function sOffice(t, d) { // 運動する時間がない会社員の願いから。
  reset(); lift(150); seated(WORKER); WORKER.userData.arms.forEach(a => a.rotation.x = -1.2 + Math.sin(t * 12) * 0.05); WORKER.userData.head.rotation.x = 0.1;
  clockC.userData.set('22:00'); officeCam(ease(clamp(t / d))); return S;
}
function sGym(t, d) { // ジムなんて、行く時間がない。
  reset(); lift(150); seated(WORKER); WORKER.userData.head.rotation.y = Math.sin(t * 7) * 0.4; WORKER.rotation.x = 0; sweatW.userData.set(clamp(t / 0.6), t);
  pop(gym, t, 0.2); NASHI[0].visible = false;
  officeCam(1);
  if (t > 0.9) { gym.userData.set('ジム ✕'); }
  return S;
}
function sStrip(t, d) { // 毎日3回、生活の中で1分だけ全力を出す。
  reset(); lift(200); const k = clamp((t - 0.3) / (d - 0.8)) * 3; const n = Math.min(3, Math.floor(k) + 1); STRIP.userData.set(k > 0 ? n : 0, k > 0 ? clamp(k - n + 1) : 0);
  hudTime('1日3回'); look(CX, 2.3, 7.4, CX, 2.2, -1, 46); return S;
}
function sThree(t, d) { // 階段ダッシュ、早歩き、重い荷物運び。
  reset(); lift(150);
  { const s = (t * 2.8) % 6; const [y, z] = miniSt.userData.at(s); D1.position.set(DX - 1.55, y, -0.2 + z - 0.15); D1.rotation.y = Math.PI; poseRun(D1, t * 15); }
  { D2.position.set(DX + Math.sin(t * 1.2) * 0.2, 0, -0.6); D2.rotation.y = Math.PI / 2; poseFastWalk(D2, t * 12); }
  { crate.visible = true; D3.position.set(DX + 1.55, 0, -0.6); D3.rotation.y = -0.3; D3.userData.arms.forEach(a => a.rotation.set(-1.25, 0, 0)); D3.userData.legs[0].rotation.x = Math.sin(t * 8) * 0.25; D3.userData.legs[1].rotation.x = -Math.sin(t * 8) * 0.25; crate.position.set(DX + 1.55 - 0.13, 1.0, -0.6 + 0.48); crate.rotation.y = -0.3; }
  dl.forEach((l, i) => pop(l, t, 0.15 + i * 0.7, 0.3, 0.95));
  look(DX, 2.6, 9.4, DX, 1.6, -0.8, 46); return S;
}
function sAnata(t, d) { // 運動は、ほとんどしていないあなた。
  reset(); lift(150); RUNNER.position.set(0.35, 0, 1.4); RUNNER.rotation.y = 0.15; RUNNER.userData.head.rotation.x = 0.15; RUNNER.userData.arms[1].rotation.x = -0.2;
  ANATA.position.set(0.35, 2.3, 1.4); pop(ANATA, t, 0.5, 0.3);
  ESC.userData.flow(t); riders(t);
  look(0.9, 1.8, 6.2, -0.1, 1.55, 0.2, 46); return S;
}

function sNashi(t, d) { // ジムなし。ウェアなし。着替えもなし。
  reset(); lift(150); RUNNER.position.set(0.0, 0, 1.4); RUNNER.rotation.y = 0.05; ESC.userData.flow(t); riders(t);
  NASHI.forEach((l, i) => { l.position.set([-0.62, 0.62, 0][i], [2.75, 2.75, 2.2][i], 1.4); pop(l, t, 0.2 + i * (d - 0.8) / 3, 0.3, 0.88); });
  look(0.0, 1.9, 6.6, 0.0, 1.75, 0.2, 46); return S;
}
function sYabai(t, d) { // でも、この1分が思っていたよりヤバかった。
  reset(); lift(380); ESC.userData.flow(t + 1.3);
  climb(RUNNER, N - 0.2, 0, 0.3); RUNNER.rotation.y = Math.PI / 2; RUNNER.rotation.x = 0.18; RUNNER.userData.arms.forEach(a => a.rotation.set(-0.7, 0, 0)); RUNNER.userData.head.rotation.x = -0.15 + Math.sin(t * 9) * 0.06;
  const u = ease(clamp(t / d)); const tz = -N * RUN + RUN * 0.2 - RUN * 0.5, ty = TOPY + 1.25; watchAt(0.6, ty + 0.35, tz + 1.15, '1:00', GOLD); sweatR.userData.set(1, t);
  stairCam(u, 0, ty, tz); return S;
}
function studyCam(u = 0) { look(FX, lerp(5.4, 6.2, u), lerp(8.2, 9.4, u), FX, 0.2, -3.2, 52); }
function sStudy(t, d) { // 運動の習慣がない2万5,241人に、
  reset(); lift(330); studyCam(ease(clamp(t / d)) * 0.5); kansatsu.position.set(FX, 1.35, 0.3); kansatsu.visible = true;
  setTop('運動の習慣がない人（イギリス）', '25,241人', fade(t, 0.6, d - 0.1, 0.25), BLUE); return S;
}
function sDevice(t, d) { // 腕時計型の計測器をつけた研究。
  reset(); lift(200); drawDev(clamp(t / (d - 0.4)));
  const u = ease(clamp(t / d)); look(GX + lerp(0.2, 0.4, u), 1.5 + lerp(3.6, 3.0, u), -1 + lerp(3.4, 2.8, u), GX + 0.1, 1.6, -1, 48); return S;
}
function sThreeTimes(t, d) { // 1〜2分の全力の動きを、1日3回していた人たち。
  reset(); lift(330); crowdHot(clamp((t - 0.5) / 1.2)); studyCam(0.5 + ease(clamp(t / d)) * 0.5); kansatsu.position.set(FX, 1.35, 0.3); kansatsu.visible = true;
  setTop('1〜2分の全力の動き', '1日3回', fade(t, 0.8, d - 0.1, 0.25), ORANGE); return S;
}
function riskCam(X) { look(X, 2.4, 10.6, X, 1.9, -1, 46); }
function sCompare(t, d) { // 全くしない人と比べて、
  reset(); lift(300); RISK.set(easeOut(clamp((t - 0.2) / 1.2)), 0); riskCam(RISK.X); return S;
}
function sRisk(t, d) { // 死亡リスクが38〜40%低かった。
  reset(); lift(300); RISK.set(1, easeOut(clamp((t - 0.2) / 1.4))); riskCam(RISK.X); kansatsuH.position.set(RISK.X, 4.1, -1); kansatsuH.visible = true;
  setTop('死亡リスク', '38〜40%低い', fade(t, 1.2, d - 0.1, 0.25), ORANGE); return S;
}
function sHeart1(t, d) { // 心臓や血管の病気で亡くなるリスクは、
  reset(); lift(300); HEART.set(easeOut(clamp((t - 0.2) / 1.2)), 0); riskCam(HEART.X); return S;
}
function sHeart2(t, d) { // 48〜49%低かった。
  reset(); lift(300); HEART.set(1, easeOut(clamp((t - 0.1) / 1.2))); riskCam(HEART.X); kansatsuH.position.set(HEART.X, 4.1, -1); kansatsuH.visible = true;
  setTop('心臓や血管の病気で亡くなるリスク', '48〜49%低い', fade(t, 1.0, d - 0.1, 0.25), RED); return S;
}
function sYears(t, d) { // 平均6.9年、追いかけた結果だった。
  reset(); lift(250); const y = 6.9 * easeOut(clamp((t - 0.2) / (d - 1.0))); setYears(y);
  FOLK.forEach((p, i) => { const ph = t * 7 + i; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.4; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4; p.position.x = JX - 2.8 + i * 0.7 + t * 0.25; });
  look(JX, 2.6, 13.5, JX, 2.1, -1, 46);
  setTop('平均の追跡期間', `${y.toFixed(1)}年`, fade(t, 0.4, d - 0.1, 0.25), BLUE); return S;
}
function sKekka(t, d) { // 結果：1日3回の1分全力で、死亡リスクは約4割低い側へ。
  reset(); lift(380); ESC.userData.flow(t + 1.3);
  climb(RUNNER, N - 0.2, 0, 0.3); RUNNER.rotation.y = Math.PI / 2; RUNNER.userData.arms[0].rotation.set(0, 0, -2.5 + Math.sin(t * 8) * 0.2); RUNNER.userData.arms[1].rotation.set(0, 0, 2.5 - Math.sin(t * 8) * 0.2);
  sparkA.set(clamp((t - 0.3) / 3.5)); const tz = -N * RUN + RUN * 0.2 - RUN * 0.5, ty = TOPY + 1.25; watchAt(0.6, ty + 0.35, tz + 1.15, '1:00', GOLD);
  const u = ease(clamp(t / d)); stairCam(1 - u, -0.2, ty, tz);
  setTop('結果（観察研究）', '約4割 低い側へ', fade(t, 0.3, d - 0.1, 0.25), GREEN); return S;
}
function sIsha(t, d) { // ただし持病がある人は、無理せず医師に相談してから。
  reset(); lift(180); DOC.userData.arms[1].rotation.set(-0.9 + Math.sin(t * 3) * 0.1, 0, 0); PAT.userData.head.rotation.x = 0.1 * Math.sin(t * 2);
  pop(isha, t, 0.1, 0.3, 1.6); pop(isha2, t, 0.8, 0.3, 1.85);
  look(KX, 2.2, 7.0, KX, 1.55, -1.2, 50); return S;
}
function sAsk(t, d) { // 質問：今日、階段とエスカレーターどっちを使った？
  reset(); lift(150); ESC.userData.flow(t + 5); riders(t + 5);
  const s = Math.min(N - 0.2, 3.0 + t * 2.0); climb(RUNNER, s, t * 15, 1);
  upLab.position.set(0.3, TOPY + 1.0, -N * RUN + 0.6); escLab.position.set(-2.2, TOPY + 1.0, -N * RUN + 0.6); pop(upLab, t, 0.3, 0.3); pop(escLab, t, 0.6, 0.3);
  look(0.2, 2.9, 6.8, -0.9, 1.7, -2.4, 48); return S;
}


const NARR = { '1分': 'いっぷん', '3回': 'さんかい', '1日3回': 'いちにちさんかい', '2万5,241人': 'にまんごせんにひゃくよんじゅういちにん', '1〜2分': 'いちからにふん', '38〜40%': 'さんじゅうはちからよんじゅっパーセント', '48〜49%': 'よんじゅうはちからよんじゅうきゅうパーセント', '6.9年': 'ろくてんきゅうねん', '約4割': 'やくよんわり', '結果：': '結果、', '腕時計型': 'うでどけいがた', '計測器': 'けいそくき', '早歩き': 'はやあるき', '着替え': 'きがえ', '全力': 'ぜんりょく', '持病': 'じびょう' };
const P = planTimes([
  ['運動する時間がない<br>会社員の願いから。', sOffice],
  ['ジムなんて、<br>行く時間がない。', sGym],
  ['毎日3回、生活の中で<br>1分だけ全力を出す。', sStrip],
  ['階段ダッシュ、早歩き、<br>重い荷物運び。', sThree],
  ['運動は、ほとんど<br>していないあなた。', sAnata],
  ['ジムなし。ウェアなし。<br>着替えもなし。', sNashi],
  ['でも、この1分が思って<br>いたよりヤバかった。', sYabai],
  ['運動の習慣がない<br>2万5,241人に、', sStudy],
  ['腕時計型の計測器を<br>つけた研究。', sDevice],
  ['1〜2分の全力の動きを、<br>1日3回していた人たち。', sThreeTimes],
  ['全くしない人と比べて、', sCompare],
  ['死亡リスクが<br>38〜40%低かった。', sRisk],
  ['心臓や血管の病気で<br>亡くなるリスクは、', sHeart1],
  ['48〜49%低かった。', sHeart2],
  ['平均6.9年、<br>追いかけた結果だった。', sYears],
  ['結果：1日3回の1分全力で、<br>死亡リスクは約4割低い側へ。', sKekka],
  ['ただし持病がある人は、<br>無理せず医師に相談してから。', sIsha],
  ['今日、階段とエスカレーター<br>どっちを使った？', sAsk],
], { shot0, endCard, start: 2.9, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0653',
    v2: true,
    hookLine: '駅の階段をスーツの男が駆け上がって、ストップウォッチが 1:00 で止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日3回、1分だけ全力を出したら？',
    titleHtml: 'もしも毎日3回、<br>1分だけ全力を<br>出したら？',
    mood: 'hopeful', seed: 653, hits: [0.45, P.at(15), P.at(16)], risers: [P.at(6)],
    impacts: [P.at(7, 1.0), P.at(9, 1.0), P.at(11, 1.5), P.at(13, 1.2), P.at(14, 1.4), P.at(15, 0.3)],
    sfx: [[0.45, 'alarm'], [P.at(1, 0.9), 'bubble'], [P.at(2, 0.5), 'whoosh'], [P.at(3, 0.2), 'whoosh'], [P.at(5, 0.2), 'bubble'], [P.at(5, 1.2), 'bubble'], [P.at(5, 2.2), 'bubble'], [P.at(8, 0.4), 'meter', 0.4], [P.at(16, 0.2), 'bubble']],
    narr: NARR,
    ask: '今日、階段とエスカレーターどっちを使った？',
    caption: 'もしも毎日3回、1分だけ全力を出したら？\n\n運動する時間がない会社員の願いから。ジムなんて、行く時間がない。\n毎日3回、生活の中で1分だけ全力を出す。階段ダッシュ、早歩き、重い荷物運び。\n運動は、ほとんどしていないあなた。ジムなし。ウェアなし。着替えもなし。\nでも、この1分が思っていたよりヤバかった。\n運動の習慣がない2万5,241人に、腕時計型の計測器をつけた研究。1〜2分の全力の動きを、1日3回していた人たち。\n全くしない人と比べて、死亡リスクが38〜40%低かった。心臓や血管の病気で亡くなるリスクは、48〜49%低かった。\n平均6.9年、追いかけた結果だった。\n\n結果：1日3回の1分全力で、死亡リスクは約4割低い側へ。\nただし持病がある人は、無理せず医師に相談してから。\n\n今日、階段とエスカレーターどっちを使った？ コメントで教えて。\n\n※観察研究のため、1分全力そのものの効果を証明したものではありません\n出典：Stamatakis ほか Nature Medicine 2022（イギリス UK Biobank、運動の習慣がない25,241人を平均6.9年追跡。1〜2分の激しい生活の動きが1日3回の人は、ない人より全死亡・がん死亡が38〜40%、心血管の死亡が48〜49%低い）',
    hashtags: ['もしもラボ', '階段', '運動不足', '健康', '寿命'],
    endStats: [['死亡リスク（1日3回の人）', '38〜40%低い', '25,241人・平均6.9年'], ['心臓や血管の病気で亡くなるリスク', '48〜49%低い', '同じ研究'], ['1回の長さ', '1〜2分', '生活の中の全力の動き']],
    sources: '出典：Stamatakis ほか Nature Medicine 2022（UK Biobank・25,241人）<br>※観察研究',
  },
});
