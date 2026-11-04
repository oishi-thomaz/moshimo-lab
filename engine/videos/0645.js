import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { room, setRoom, setLight, setClock, props } from '../scenes/room.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, poseSlump } from '../scenes/office.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも毎日10時間寝るのを1か月続けたら？（台本 S23・人体の限界）
// 2026/11/03 ゆうと承認。元ネタ：なんJ・ガルちゃんで定期的に立つ 休みの日は昼まで寝る・寝だめは効く？ の話
// 数字（裏取り済み）：
//  厚生労働省「健康づくりのための睡眠ガイド2023」：成人は6時間以上を目安／高齢者は床上時間が8時間以上にならないように／
//   休日に平日より長く眠るのは、ふだんの睡眠が足りていないサイン
//  Tamakoshi A, Ohno Y; JACC Study Group. Sleep 2004;27(1):51-54：40〜79歳の約10.4万人を平均9.9年追跡。
//   睡眠7時間の人で死亡リスクが最も低く、短くても長くても高かった
// 棒グラフは研究の結果の 形 を見せるイメージ（高さは数字ではない）。画面にも（イメージ）と出す

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

// ---------- 寝室（room.js）にかけ時計を足す ----------
const clockC = document.createElement('canvas'); clockC.width = clockC.height = 512;
const clockT = new THREE.CanvasTexture(clockC); clockT.colorSpace = THREE.SRGBColorSpace;
let clockKey = '';
function drawClock(h, m, night) {
  const k = h.toFixed(3) + m.toFixed(2) + night; if (k === clockKey) return; clockKey = k;
  const g = clockC.getContext('2d'); g.clearRect(0, 0, 512, 512);
  g.fillStyle = '#2a2e3a'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  g.fillStyle = night ? '#e8ecf6' : '#ffffff'; g.beginPath(); g.arc(256, 256, 226, 0, 7); g.fill();
  g.fillStyle = '#2a2e3a'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 178, 256 - Math.cos(a) * 178); }
  const hand = (a, len, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.sin(a) * len, 256 - Math.cos(a) * len); g.stroke(); };
  hand(((h % 12) + m / 60) / 12 * Math.PI * 2, 112, 22, '#1a1d24');
  hand(m / 60 * Math.PI * 2, 168, 12, '#c8242c');
  g.fillStyle = '#1a1d24'; g.beginPath(); g.arc(256, 256, 16, 0, 7); g.fill();
  clockT.needsUpdate = true;
}
const wallClock = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshBasicMaterial({ map: clockT, transparent: true }));
wallClock.position.set(0.72, 2.15, -3.44); room.add(wallClock);
const sleepLab = label('10時間', { w: 512, size: 120, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.1 }); room.add(sleepLab);
const sukkiri = label('すっきり！', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); room.add(sukkiri);
const nanji = label('7時間前後', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); room.add(nanji);
const tokuja = label('多いほど得じゃない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 2.0 }); room.add(tokuja);
const zzz = label('Zzz…', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,110,.92)', sx: 0.8 }); room.add(zzz);
const sparkR = makeSparkles(120, 0.16, 0xfff2c0); room.add(sparkR.points); sparkR.init([[1.6, 2.4, -2.4]], 1.2, 0.8);
const sleeper = props.sleeper;

// ---------- 別の場所（S）：オフィス・カレンダー・グラフ ----------
const S = new THREE.Scene();
S.background = new THREE.Color('#232838'); S.fog = new THREE.Fog(0x232838, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#2c3242', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// A：夜のオフィス（原点）
const ofloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#5d6678', { depthWrite: false })); ofloor.rotation.x = -Math.PI / 2; ofloor.position.set(0, 0.01, 0); ofloor.renderOrder = -0.8; S.add(ofloor);
const owall = box(14, 3.6, 0.2, mat('#c9ced8')); owall.position.set(0, 1.8, -3.0); S.add(owall);
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.3, 0.05, new THREE.MeshBasicMaterial({ color: '#0e1830' })); w.position.set(-4 + i * 4, 2.0, -2.88); S.add(w); }
const odesk = box(1.6, 0.06, 0.8, mat('#e8e4dc')); odesk.position.set(0, 0.74, -0.3); S.add(odesk);
const odeskF = box(1.5, 0.7, 0.05, mat('#9aa0aa')); odeskF.position.set(0, 0.37, 0.08); S.add(odeskF);
const lap = box(0.6, 0.03, 0.4, mat('#30343e')); lap.position.set(0, 0.79, -0.25); S.add(lap);
const lapScr = box(0.6, 0.38, 0.02, mat('#30343e')); lapScr.position.set(0, 0.98, -0.47); lapScr.rotation.x = -0.25; S.add(lapScr);
const WK = makeSuit({ jacket: '#3a4050', tie: '#5a6a8a' }); S.add(WK);
const nemui = label('眠い…', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,110,.95)', sx: 1.0 }); S.add(nemui);
const negai = label('好きなだけ寝たい', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.0 }); S.add(negai);
const bubbleDots = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06 + i * 0.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); S.add(d); return d; });
const deskLamp = new THREE.PointLight(0xbfd6ff, 6, 6, 1.5); deskLamp.position.set(0, 1.6, 0); S.add(deskLamp);

// B：1か月のカレンダー（x=60）
const BX = 60;
const calC = document.createElement('canvas'); calC.width = 1024; calC.height = 900;
const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace; let calKey = -1;
function drawCal(n) {
  if (n === calKey) return; calKey = n; const g = calC.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 1024, 900); g.fillStyle = '#3480e6'; g.fillRect(0, 0, 1024, 150);
  g.fillStyle = '#fff'; g.font = '900 92px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('毎日10時間', 512, 78);
  for (let i = 0; i < 30; i++) {
    const cx = 74 + (i % 7) * 146, cy = 230 + Math.floor(i / 7) * 146;
    g.strokeStyle = '#c8ccd4'; g.lineWidth = 4; g.strokeRect(cx - 66, cy - 62, 132, 128);
    g.fillStyle = '#6a7080'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText(String(i + 1), cx - 30, cy - 34);
    if (i < n) { g.fillStyle = '#3480e6'; g.beginPath(); g.arc(cx + 8, cy + 14, 38, 0, 7); g.fill(); g.fillStyle = '#fbfaf5'; g.beginPath(); g.arc(cx + 24, cy + 4, 34, 0, 7); g.fill(); }
  }
  calT.needsUpdate = true;
}
const cal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0), new THREE.MeshBasicMaterial({ map: calT })); cal.position.set(BX, 2.2, -1); S.add(cal);
const calFrame = box(3.56, 3.16, 0.06, mat('#3a3e4a')); calFrame.position.set(BX, 2.2, -1.04); S.add(calFrame);

// C：平日と休日の睡眠（x=120）
const CX = 120;
const cfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#343a4c', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -1); cfloor.renderOrder = -0.8; S.add(cfloor);
function bar(x, color) { const b = box(1.0, 1, 1.0, mat(color)); b.geometry.translate(0, 0.5, 0); b.position.set(x, 0, -1); S.add(b); return b; }
const B_WEEK = bar(CX - 0.9, '#7a8aa8'), B_HOLI = bar(CX + 0.9, '#3480e6');
const labWeek = label('平日', { w: 384, size: 110, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 0.75 }); labWeek.position.set(CX - 0.9, 1.0, -0.4); S.add(labWeek);
const labHoli = label('休日', { w: 384, size: 110, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 0.75 }); labHoli.position.set(CX + 0.9, 1.0, -0.4); S.add(labHoli);
const aizu = label('足りていない合図', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 2.0 }); S.add(aizu);
// 寝不足のメーター
const gauge = new THREE.Group(); S.add(gauge);
const gBg = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.42), new THREE.MeshBasicMaterial({ color: '#1a1a22', transparent: true, opacity: 0.9, depthTest: false })); gBg.renderOrder = 8; gauge.add(gBg);
const gFillM = new THREE.MeshBasicMaterial({ color: '#ff6a5a', depthTest: false, transparent: true }); const gFill = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 0.3), gFillM); gFill.geometry.translate(1.43, 0, 0); gFill.position.set(-1.43, 0, 0.01); gFill.renderOrder = 9; gauge.add(gFill);
const gCap = label('たまった寝不足', { w: 768, h: 160, size: 96, color: '#fff', bg: 'rgba(30,30,40,.92)', sx: 1.5 }); gCap.position.set(0, 0.55, 0); gauge.add(gCap);
function setGauge(u) { gFill.scale.x = Math.max(0.001, u); gFillM.color.set(u > 0.5 ? '#ff6a5a' : u > 0.15 ? '#ffd27a' : '#9be86a'); }
const hatena = label('？', { w: 256, h: 256, size: 230, color: '#ffd27a', stroke: 18, strokeColor: '#2a1a00', sx: 0.9 }); S.add(hatena);

// D：24時間の円（x=180）
const DX = 180;
const pieSleep = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64, Math.PI / 2, -Math.PI * 2 * 10 / 24), new THREE.MeshBasicMaterial({ color: '#3480e6', side: THREE.DoubleSide }));
const pieAwake = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64, Math.PI / 2 - Math.PI * 2 * 10 / 24, -Math.PI * 2 * 14 / 24), new THREE.MeshBasicMaterial({ color: '#f2c14e', side: THREE.DoubleSide }));
const pieBack = new THREE.Mesh(new THREE.CircleGeometry(1.72, 64), new THREE.MeshBasicMaterial({ color: '#1a1d24' }));
[pieBack, pieSleep, pieAwake].forEach((m, i) => { m.position.set(DX, 2.1, -1 + i * 0.01); S.add(m); });
const labS10 = label('寝る 10時間', { w: 768, size: 100, color: '#fff', bg: 'rgba(30,60,130,.95)', sx: 1.5 }); S.add(labS10);
const labA14 = label('起きている 14時間', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.1 }); S.add(labA14);

// E：睡眠時間と死亡リスク（x=240。形のイメージ）
const EX = 240;
const efloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat('#343a4c', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -1); efloor.renderOrder = -0.8; S.add(efloor);
const HRS = [4, 5, 6, 7, 8, 9, 10];
const RISK = [1.5, 1.25, 1.1, 1.0, 1.12, 1.35, 1.6]; // 形のイメージ（U字）
const RB = HRS.map((h, i) => { const b = box(0.56, 1, 0.56, mat('#8a92a8')); b.geometry.translate(0, 0.5, 0); b.position.set(EX - 2.25 + i * 0.75, 0, -1); S.add(b); const l = label(h + '時間', { w: 384, size: 100, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 0.68 }); l.position.set(b.position.x, 0.3, -0.45); S.add(l); return { b, l }; });
const imgLab = label('死亡リスク（イメージ）', { w: 1024, size: 90, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.9 }); imgLab.position.set(EX, 3.4, -1); S.add(imgLab);
const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.4, 0.16), mat('#c9d0e0'), 400); S.add(crowd);
{ const m = new THREE.Matrix4(); for (let i = 0; i < 400; i++) { const x = EX - 4 + (i % 25) * 0.33, z = -3.2 + Math.floor(i / 25) * 0.33; m.makeTranslation(x, 0.2, z); crowd.setMatrixAt(i, m); } }
const tenman = label('約10万人を約10年', { w: 1024, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 2.0 }); S.add(tenman);

// F：国の睡眠ガイド（x=300）
const FX = 300;
const ffloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.02, -1); ffloor.renderOrder = -0.8; S.add(ffloor);
const GUIDE = makeDoc({ title: '睡眠ガイド2023', rows: ['成人', '高齢者'], head: '#3480e6', w: 2.0, h: 1.5 }); GUIDE.position.set(FX, 2.1, -1); S.add(GUIDE);

function reset() {
  WK.visible = true; poseClear(WK); WK.rotation.set(0, 0, 0);
  [nemui, negai, aizu, hatena, labS10, labA14, tenman].forEach(l => l.visible = false); bubbleDots.forEach(d => d.visible = false);
  gauge.visible = false; crowd.visible = false; imgLab.visible = true;
  RB.forEach((r, i) => { r.b.scale.y = 0.001; r.b.material.color.set('#8a92a8'); r.l.visible = true; });
  GUIDE.userData.fill(0, ''); GUIDE.userData.fill(1, '');
  [sleepLab, sukkiri, nanji, tokuja, zzz].forEach(l => l.visible = false); sparkR.set(0);
  sleeper.rotation.set(-Math.PI / 2, 0, 0); sleeper.position.set(1.6, 0.74, -1.0); poseClear(sleeper); sleeper.rotation.x = -Math.PI / 2; sleeper.position.y = 0.74;
  props.blanket.visible = true; el.flash.style.opacity = 0;
}
function bedroom(mode) { setRoom({ sets: ['bed'] }); setLight(mode, mode === 'night' ? { lamp: 3 } : {}); }
function bedCam(d = 0) { look(lerp(0.95, 1.0, d), 2.1, lerp(5.0, 5.4, d), 1.0, 1.95, -2.4, 52); }
function sitUp(k, t) { // ベッドの上で起き上がる（k 0..1）
  if (k <= 0) return; sleeper.rotation.set(-Math.PI / 2 * (1 - k), 0, 0);
  sleeper.position.set(1.6, lerp(0.74, -0.14, k), lerp(-1.0, -2.55, k)); sleeper.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 * k);
  sleeper.userData.arms[0].rotation.z = -2.7 * k + Math.sin(t * 3) * 0.1 * k; sleeper.userData.arms[1].rotation.z = 2.7 * k - Math.sin(t * 3) * 0.1 * k;
}
const T0 = 0.08, T1 = 0.55;
function shot0(t) { // 0秒＝サムネ：夜10時から朝8時まで、針がぐるっと回って止まる
  reset(); lift(0);
  const u = ease(clamp((t - T0) / (T1 - T0))); const total = 22 * 60 + u * 600; const hh = Math.floor(total / 60), mm = total - hh * 60;
  drawClock(hh, mm, u < 1); bedroom(u < 1 ? 'night' : 'day');
  setClock(`${String(hh % 24).padStart(2, '0')}:${String(Math.floor(mm)).padStart(2, '0')}`);
  if (t > T1) { sleepLab.position.set(0.72, 3.0, -3.2); pop(sleepLab, t, 1.9, 0.25, 0.95); el.flash.style.opacity = t < T1 + 0.12 ? 0.35 : 0; }
  zzz.position.set(0.9, 1.45, -2.6); zzz.visible = true; zzz.userData.size(0.7);
  bedCam(ease(clamp(t / 3.1)));
  return room;
}
function shot1(t) { // 寝不足の会社員の願いから。
  reset(); lift(120); poseSit(WK); WK.position.set(0, 0, -0.85); poseSlump(WK, 0.45 + Math.sin(t * 1.5) * 0.12);
  nemui.position.set(0.5, 2.2, -0.85); pop(nemui, t, 0.5, 0.3, 0.9);
  look(0.6, 2.0, 3.2, 0, 1.25, -0.6, 52);
  return S;
}
function shot2(t) { // 1回でいいから、毎日好きなだけ寝てみたい
  reset(); lift(120); poseSit(WK); WK.position.set(0, 0, -0.85); WK.userData.head.rotation.x = -0.35; WK.userData.arms.forEach(a => a.rotation.x = -0.9);
  bubbleDots.forEach((d, i) => { d.position.set(0.3 + i * 0.18, 1.95 + i * 0.2, -0.85); d.visible = t > 0.3 + i * 0.2; });
  negai.position.set(0.2, 2.65, -0.85); pop(negai, t, 0.9, 0.3, 1.75);
  look(0.6, 2.0, 3.6, 0, 1.5, -0.6, 52);
  return S;
}
function shot3(t) { // 毎日10時間寝る生活が、今日から1か月続く
  reset(); lift(150); drawCal(Math.floor(clamp((t - 0.4) / 2.4) * 30));
  look(BX, 2.2, 6.4, BX, 2.2, -1, 50);
  setTop('毎日の睡眠', '10時間 × 1か月', fade(t, 0.3, 3.3, 0.25), BLUE);
  return S;
}
function shot4(t) { // 1日目。起きた瞬間は最高。頭がすっきり
  reset(); lift(0); bedroom('day'); drawClock(8, 0, false); setClock('08:00');
  sitUp(easeOut(clamp((t - 0.2) / 0.9)), t); sparkR.set(t > 1.0 ? clamp((t - 1.0) / 2.2) : 0);
  sukkiri.position.set(1.6, 2.95, -2.6); pop(sukkiri, t, 1.0, 0.3, 1.2);
  bedCam(0.5);
  return room;
}
function shot5(t) { // 実は、休みの日に長く寝てしまうのは、
  reset(); lift(200); B_WEEK.scale.y = lerp(0.001, 1.4, easeOut(clamp((t - 0.2) / 0.7))); B_HOLI.scale.y = lerp(0.001, 2.4, easeOut(clamp((t - 0.7) / 0.9)));
  labWeek.position.y = B_WEEK.scale.y + 0.4; labHoli.position.y = B_HOLI.scale.y + 0.4;
  look(CX, 2.0, 6.6, CX, 1.5, -1, 50);
  return S;
}
function shot6(t) { // ふだんの睡眠が足りていない合図
  reset(); lift(200); B_WEEK.scale.y = 1.4; B_HOLI.scale.y = 2.4; labWeek.position.y = 1.8; labHoli.position.y = 2.8;
  B_WEEK.material.color.set(t > 0.8 && Math.floor(t * 4) % 2 ? '#e86a6a' : '#7a8aa8');
  aizu.position.set(CX - 0.6, 2.5, -0.3); pop(aizu, t, 0.6, 0.3, 1.7);
  look(CX, 2.0, 6.6, CX, 1.5, -1, 50);
  return S;
}
function shot7(t) { // 1週間。たまっていた寝不足が、少しずつ返ってくる
  reset(); lift(140); B_WEEK.visible = B_HOLI.visible = labWeek.visible = labHoli.visible = false;
  gauge.visible = true; gauge.position.set(CX, 1.8, -1); setGauge(lerp(1, 0.25, ease(clamp((t - 0.3) / 3.3))));
  look(CX, 2.0, 5.0, CX, 1.9, -1, 50);
  return S;
}
function shot8(t) { // でも本当に気になるのは、取り返したあと
  reset(); lift(140); B_WEEK.visible = B_HOLI.visible = labWeek.visible = labHoli.visible = false;
  gauge.visible = true; gauge.position.set(CX, 1.8, -1); setGauge(lerp(0.25, 0.0, ease(clamp(t / 1.2))));
  hatena.position.set(CX, 3.0, -1); pop(hatena, t, 1.2, 0.3, 0.9);
  look(CX, 2.0, 5.0, CX, 1.9, -1, 50);
  return S;
}
function shot9(t) { // 1日は24時間。10時間寝ると、起きている時間は14時間
  reset(); lift(150); B_WEEK.visible = B_HOLI.visible = labWeek.visible = labHoli.visible = true;
  const k = easeOut(clamp((t - 0.4) / 1.2)); pieSleep.scale.setScalar(Math.max(0.001, k)); pieAwake.scale.setScalar(Math.max(0.001, easeOut(clamp((t - 1.6) / 1.0))));
  labS10.position.set(DX + 0.9, 3.75, -0.9); pop(labS10, t, 0.9, 0.3, 1.35);
  labA14.position.set(DX - 0.4, 0.35, -0.9); pop(labA14, t, 2.2, 0.3, 1.9);
  look(DX, 2.1, 7.6, DX, 2.1, -1, 50);
  setTop('起きている時間', '14時間', fade(t, 2.3, 4.2, 0.25), GOLD);
  return S;
}
function riskBars(u, hi = -1) { RB.forEach((r, i) => { r.b.scale.y = Math.max(0.001, RISK[i] * 1.6 * u); if (hi === 3 && i === 3) r.b.material.color.set('#9be86a'); if (hi === 9 && (i === 0 || i === 6)) r.b.material.color.set('#ff5a5a'); if (hi === 9 && i === 3) r.b.material.color.set('#9be86a'); }); }
function shot10(t) { // 日本の約10万人を約10年追った研究で、
  reset(); lift(120); imgLab.visible = false; crowd.visible = true; RB.forEach(r => r.l.visible = false);
  tenman.position.set(EX, 2.7, -2.0); pop(tenman, t, 0.4, 0.3, 1.9);
  look(EX, 5.0, 4.8, EX, 0.6, -2.0, 52);
  return S;
}
function shot11(t) { // 一番死亡リスクが低かったのは7時間
  reset(); lift(330); riskBars(easeOut(clamp((t - 0.2) / 1.2)), t > 1.6 ? 3 : -1);
  look(EX, 2.2, 10.2, EX, 1.7, -1, 50);
  setTop('一番死亡リスクが低い', '7時間', fade(t, 1.6, 3.2, 0.25), GREEN);
  return S;
}
function shot12(t) { // 短すぎても、長すぎても、リスクは上がっていた
  reset(); lift(330); riskBars(1, t > 0.6 ? 9 : 3);
  look(EX, 2.2, 10.2, EX, 1.7, -1, 50);
  return S;
}
function shot13(t) { // 国の睡眠ガイドも、高齢者は
  reset(); lift(150); GUIDE.userData.fill(0, '6時間以上'); GUIDE.userData.fill(1, t > 1.0 ? '布団の中 8時間未満' : '');
  look(FX, 2.1, 3.9, FX, 2.1, -1, 50);
  return S;
}
function shot14(t) { // 布団の中の時間を8時間未満に、と言っている
  reset(); lift(150); GUIDE.userData.fill(0, '6時間以上'); GUIDE.userData.fill(1, '布団の中 8時間未満');
  look(FX, 2.1, 3.7, FX, 2.1, -1, 50);
  setTop('高齢者の布団の中の時間', '8時間未満', fade(t, 0.3, 2.9, 0.25), BLUE);
  return S;
}
function shot15(t) { // 結果：寝だめで取り返せるのは寝不足の分だけ。長生きの目安は7時間前後
  reset(); lift(0); bedroom('day'); const m = Math.min(60, t * 40); drawClock(6 + Math.floor(m / 60), m % 60, false); setClock('07:00');
  if (t > 1.5) { drawClock(7, 0, false); }
  sitUp(easeOut(clamp((t - 1.6) / 0.9)), t);
  nanji.position.set(0.72, 3.0, -3.2); pop(nanji, t, 1.5, 0.3, 1.1);
  bedCam(ease(clamp(t / 5.8)));
  setTop('結果', '目安は7時間前後', fade(t, 0.3, 5.6, 0.25), GREEN);
  return room;
}
function shot16(t) { // 眠りは、多いほど得というわけではなかった
  reset(); lift(0); bedroom('day'); drawClock(7, 0, false); setClock('07:00'); sitUp(1, t);
  tokuja.position.set(1.6, 2.95, -2.6); pop(tokuja, t, 0.4, 0.3, 1.7);
  bedCam(1);
  return room;
}
function shot17(t) { // 質問。最後は冒頭と同じ構図（朝8時で止まった時計）
  reset(); lift(0); bedroom('day'); drawClock(8, 0, false); setClock('08:00');
  sleepLab.position.set(0.72, 3.0, -3.2); sleepLab.visible = true; sleepLab.userData.size(0.95);
  zzz.position.set(0.9, 1.45, -2.6); zzz.visible = true; zzz.userData.size(0.7);
  bedCam(0);
  return room;
}

const SUBS = [
  [3.1, 5.4, '寝不足の会社員の<br>願いから。'],
  [5.5, 9.0, '1回でいいから、毎日<br>好きなだけ寝てみたい。'],
  [9.1, 12.4, '毎日10時間寝る生活が、<br>今日から1か月続く。'],
  [12.5, 15.6, '1日目。起きた瞬間は最高。<br>頭がすっきり。'],
  [15.7, 18.4, '実は、休みの日に<br>長く寝てしまうのは、'],
  [18.5, 21.4, 'ふだんの睡眠が<br>足りていない合図。'],
  [21.5, 25.4, '1週間。たまっていた寝不足が、<br>少しずつ返ってくる。'],
  [25.5, 28.4, 'でも本当に気になるのは、<br>取り返したあと。'],
  [28.5, 32.6, '1日は24時間。10時間寝ると、<br>起きている時間は14時間。'],
  [32.7, 35.6, '日本の約10万人を<br>約10年追った研究で、'],
  [35.7, 38.9, '一番死亡リスクが<br>低かったのは7時間。'],
  [39.0, 42.6, '短すぎても、長すぎても、<br>リスクは上がっていた。'],
  [42.7, 44.6, '国の睡眠ガイドも、<br>高齢者は'],
  [44.7, 48.0, '布団の中の時間を<br>8時間未満に、と言っている。'],
  [48.1, 51.1, '結果：寝だめで取り返せるのは<br>寝不足の分だけ。'],
  [51.2, 53.8, '長生きの目安は<br>7時間前後。'],
  [53.9, 57.0, '眠りは、多いほど得という<br>わけではなかった。'],
  [57.1, 61.3, 'あなたの平日の睡眠、<br>何時間？'],
];
const shots = [
  { a: 0, b: 3.1, f: shot0 }, { a: 3.1, b: 5.5, f: shot1 }, { a: 5.5, b: 9.1, f: shot2 }, { a: 9.1, b: 12.5, f: shot3 }, { a: 12.5, b: 15.7, f: shot4 },
  { a: 15.7, b: 18.5, f: shot5 }, { a: 18.5, b: 21.5, f: shot6 }, { a: 21.5, b: 25.5, f: shot7 }, { a: 25.5, b: 28.5, f: shot8 },
  { a: 28.5, b: 32.7, f: shot9 }, { a: 32.7, b: 35.7, f: shot10 }, { a: 35.7, b: 39.0, f: shot11 }, { a: 39.0, b: 42.7, f: shot12 },
  { a: 42.7, b: 44.7, f: shot13 }, { a: 44.7, b: 48.1, f: shot14 }, { a: 48.1, b: 53.9, f: shot15 }, { a: 53.9, b: 57.1, f: shot16 },
  { a: 57.1, b: 61.6, f: shot17 }, { a: 61.6, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0645',
    v2: true,
    hookLine: '夜10時から朝8時まで、時計の針がぐるっと回って止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日10時間寝るのを1か月続けたら？',
    titleHtml: 'もしも毎日10時間<br>寝るのを1か月<br>続けたら？',
    mood: 'mystery', seed: 645, hits: [0.55, 48.1, 53.9], risers: [25.5], impacts: [10.0, 30.9, 37.4, 40.0, 46.0, 49.6],
    sfx: [[0.1, 'whoosh'], [0.55, 'poof'], [13.3, 'bubble'], [19.0, 'alarm'], [22.0, 'meter', 0.4], [26.8, 'whoosh'], [33.2, 'whoosh'], [43.8, 'whoosh'], [49.7, 'bubble']],
    narr: { '10時間': 'じゅうじかん', '1か月': 'いっかげつ', '1回': 'いっかい', '1日目': 'いちにちめ', '1週間': 'いっしゅうかん', '24時間': 'にじゅうよじかん', '14時間': 'じゅうよじかん', '約10万人': 'やくじゅうまんにん', '約10年': 'やくじゅうねん', '7時間': 'しちじかん', '8時間未満': 'はちじかんみまん', '布団': 'ふとん', '結果：': '結果、', '寝だめ': 'ねだめ', '平日': 'へいじつ', '何時間': 'なんじかん', '長生き': 'ながいき' },
    ask: 'あなたの平日の睡眠、何時間？',
    caption: 'もしも毎日10時間寝るのを1か月続けたら？\n\n寝不足の会社員の願いから。1回でいいから、毎日好きなだけ寝てみたい。\n1日目。起きた瞬間は最高。頭がすっきり。\n実は、休みの日に長く寝てしまうのは、ふだんの睡眠が足りていない合図。\n1週間。たまっていた寝不足が、少しずつ返ってくる。でも本当に気になるのは、取り返したあと。\n1日は24時間。10時間寝ると、起きている時間は14時間。\n日本の約10万人を約10年追った研究で、一番死亡リスクが低かったのは7時間。短すぎても、長すぎても、リスクは上がっていた。\n国の睡眠ガイドも、高齢者は布団の中の時間を8時間未満に、と言っている。\n\n結果：寝だめで取り返せるのは寝不足の分だけ。長生きの目安は7時間前後。\n眠りは、多いほど得というわけではなかった。\n\nあなたの平日の睡眠、何時間？ コメントで教えて。\n\n※グラフの高さはイメージです\n出典：厚生労働省「健康づくりのための睡眠ガイド2023」、Tamakoshi ほか Sleep 2004（JACC Study。40〜79歳 約10.4万人を平均9.9年追跡）',
    hashtags: ['もしもラボ', '睡眠', '寝だめ', '睡眠時間', '健康'],
    endStats: [['一番死亡リスクが低かった睡眠', '7時間', '約10万人・約10年の研究'], ['大人の睡眠の目安', '6時間以上', '睡眠ガイド2023'], ['高齢者の布団の中の時間', '8時間未満', '睡眠ガイド2023']],
    sources: '出典：厚生労働省「健康づくりのための睡眠ガイド2023」、Tamakoshi ほか Sleep 2004（JACC Study）',
  },
});
