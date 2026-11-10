import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { makeSink, planTimes } from '../scenes/fitness.js';

// もしも職場で男にもメイクが義務だったら？（皮肉回・台本 S57・図星／男と女のもしも）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。0635 生理（インスタ 平均の31.5倍）と同じ 立場の入れ替え を、毎朝の身だしなみで
// 数字は使わない（メイクの時間・お金は出さない）。化粧品はブランドなしの架空の形。会社・電車は架空

const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
function man(o = {}) { const p = makeSuit({ jacket: '#2e3442', tie: '#c8423a', ...o }); const f = p.userData.head.children[0]; f.material = f.material.clone(); p.userData.face = f; p.userData.skin0 = f.material.color.clone();
  const shine = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); shine.position.set(0, 0.38, 0.196); shine.visible = false; p.userData.head.add(shine); p.userData.shine = shine; return p; }
const BEIGE = new THREE.Color('#f6d9bf');
function makeup(p, k) { p.userData.face.material.color.copy(p.userData.skin0).lerp(BEIGE, clamp(k)); }

// ---------- A：会社の入口（原点）：すっぴんの男が通れないゲート ----------
flat(16, 12, '#c8c4bc', 0, 0);
const lobbyWall = box(16, 4, 0.2, mat('#e6e2da')); lobbyWall.position.set(0, 2, -3.5); S.add(lobbyWall);
const coSign = label('もしも商事', { w: 768, size: 110, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 2.0 }); coSign.position.set(-3.6, 3.2, -3.3); S.add(coSign);
const GATE = new THREE.Group(); { for (const x of [-1.0, 1.0]) { const p = box(0.35, 1.1, 1.4, mat('#9aa0aa')); p.position.set(x, 0.55, 0); GATE.add(p); } const bar = box(1.7, 0.08, 0.08, mat('#d62a2a')); bar.position.set(0, 0.9, 0.3); GATE.add(bar); GATE.userData.bar = bar; const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff3030' })); lamp.position.set(-1.0, 1.2, 0.4); GATE.add(lamp); GATE.userData.lamp = lamp; } S.add(GATE);
const gateSign = label('すっぴんの男 通行不可', { w: 1024, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.4 }); S.add(gateSign);
const KACHO = man({ old: true, glasses: true, jacket: '#3a3f4e' }); S.add(KACHO); const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
const OL = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }); S.add(OL);
const OL2 = makeSuit({ woman: true, jacket: '#3a4256', hair: '#6b4a33' }); S.add(OL2);
const don = label('ドン', { w: 400, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(don);
const kinou = label('昨日', { w: 400, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.7 }); S.add(kinou);
const taicho = label('今日体調悪い？', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.6 }); S.add(taicho);
const tsukare = label('疲れてる？', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(tsukare);
const pi = label('ピー', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(pi);

// ---------- B：洗面所（x=60）：下地とファンデ ----------
const BX = 60;
flat(10, 8, '#d8d8d4', BX, 0);
const bWall = box(10, 3.2, 0.2, mat('#eef0f2')); bWall.position.set(BX, 1.6, -0.6); S.add(bWall);
const SINK = makeSink(); SINK.position.set(BX, 0, -0.2); S.add(SINK);
function cos(color, h = 0.22, r = 0.05) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), mat(color)); S.add(m); return m; }
const SHITAJI = cos('#f4e4d8'), FANDE = cos('#e8c4a4', 0.06, 0.09), BRUSH = box(0.03, 0.2, 0.03, mat('#2a2a30')); S.add(BRUSH);
const sLab = label('下地', { w: 400, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.6 }); S.add(sLab);
const fLab = label('ファンデ', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.8 }); S.add(fLab);
const dotchi = label('どっちが先？', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(dotchi);
const B_KACHO = man({ old: true, glasses: true, jacket: '#3a3f4e' }); S.add(B_KACHO);

// ---------- C：通勤電車（x=120）：マスクの内側がベージュ ----------
const CX = 120;
flat(3.2, 20, '#8a8a84', CX, 0, -0.85, 0.02);
for (const sx of [-1, 1]) { const w = box(0.1, 2.6, 20, mat('#d8dde2')); w.position.set(CX + sx * 1.6, 1.3, 0); S.add(w); for (let i = 0; i < 4; i++) { const win = box(0.02, 0.9, 1.6, new THREE.MeshBasicMaterial({ color: '#9fd0f0' })); win.position.set(CX + sx * 1.54, 1.75, -6 + i * 4); S.add(win); } }
const C_KACHO = man({ old: true, glasses: true, jacket: '#3a3f4e' }); S.add(C_KACHO);
const MASK = new THREE.Group(); { const m = box(0.3, 0.18, 0.04, mat('#f8f8f8')); MASK.add(m); } S.add(MASK);
const MASK_IN = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })); S.add(MASK_IN);
const BEIGE_SPOT = new THREE.Mesh(new THREE.CircleGeometry(0.12, 18), new THREE.MeshBasicMaterial({ color: '#e0b896' })); S.add(BEIGE_SPOT);
const beige = label('ベージュ', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(240,210,180,.97)', sx: 0.9 }); S.add(beige);
const RIDERS = [0, 1, 2].map(i => { const p = makeSuit({ jacket: ['#4a5060', '#5a4a3a', '#3a4a5a'][i], tie: '#3a6ab2' }); S.add(p); return p; });

// ---------- D：会議室（x=180） ----------
const DX = 180;
const MR = makeMeetingRoom(); MR.position.set(DX, 0, 0); S.add(MR);
const BUCHO = man({ old: true, bald: true, jacket: '#2a2e38' }); S.add(BUCHO);
const D_KACHO = man({ old: true, glasses: true, jacket: '#3a3f4e' }); S.add(D_KACHO); const sweatD = makeSweat(); D_KACHO.userData.head.add(sweatD);
const D_OTHERS = [man({ jacket: '#4a4f60' }), man({ jacket: '#56504a', glasses: true })]; D_OTHERS.forEach(p => S.add(p));
const sasayaku = label('疲れてる？', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); S.add(sasayaku);
const tekari = label('テカリ', { w: 400, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(tekari);
const kyuryo = label('この時間 給料0円', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.8 }); S.add(kyuryo);
const clockMorning = label('6:00〜7:00', { w: 768, size: 110, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.4 }); S.add(clockMorning);

// ---------- E：トイレの前（x=240）：化粧直しの男の行列 ----------
const EX = 240;
flat(14, 10, '#c8c4bc', EX, 0);
const eWall = box(14, 3.2, 0.2, mat('#e6e2da')); eWall.position.set(EX, 1.6, -2.2); S.add(eWall);
const tDoor = box(1.0, 2.1, 0.08, mat('#7aa0c8')); tDoor.position.set(EX - 3, 1.05, -2.08); S.add(tDoor);
const tSign = label('男子トイレ', { w: 640, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.1 }); tSign.position.set(EX - 3, 2.5, -1.9); S.add(tSign);
const QUEUE = []; for (let i = 0; i < 7; i++) { const p = man({ jacket: ['#2e3442', '#3a3f4e', '#4a4f60', '#2a2e38', '#56504a'][i % 5], old: i % 3 === 0, bald: i % 4 === 0, glasses: i % 3 === 1 }); S.add(p); QUEUE.push(p); }
const naoshi = label('化粧直し', { w: 600, size: 110, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.05 }); S.add(naoshi);
const clockE = label('17:00', { w: 512, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.95 }); clockE.position.set(EX + 2.6, 2.6, -2.0); S.add(clockE);

// ---------- F：会社の決まり（x=300）：メイクの義務がそっと消える ----------
const FX = 300;
flat(10, 8, '#c8a878', FX, 0);
const fWall = box(10, 3.6, 0.2, mat('#e6e2da')); fWall.position.set(FX, 1.8, -1.6); S.add(fWall);
const ruleC = document.createElement('canvas'); ruleC.width = 720; ruleC.height = 960; const ruleT = new THREE.CanvasTexture(ruleC); ruleT.colorSpace = THREE.SRGBColorSpace;
let ruleKey = ''; function drawRule(k) { const key = k.toFixed(2); if (key === ruleKey) return; ruleKey = key; const g = ruleC.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 720, 960); g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, 720, 130); g.fillStyle = '#fff'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('身だしなみの決まり', 360, 68);
  g.fillStyle = '#333'; g.font = '800 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; ['1. 清潔な服装', '2. 髪を整える', '3. メイクをする', '4. 爪を短く'].forEach((s, i) => { g.globalAlpha = i === 2 ? 1 - k : 1; g.fillText(s, 70, 260 + i * 150); }); g.globalAlpha = 1;
  if (k > 0 && k < 1) { g.strokeStyle = '#d62a2a'; g.lineWidth = 10; g.beginPath(); g.moveTo(60, 560); g.lineTo(60 + 560 * Math.min(1, k * 2), 560); g.stroke(); }
  ruleT.needsUpdate = true; }
const RULE = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: ruleT })); RULE.position.set(FX, 1.7, -1.48); S.add(RULE);
const sotto = label('そっと消える', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(sotto);
const F_OL = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }); S.add(F_OL);
const F_OL2 = makeSuit({ woman: true, jacket: '#3a4256', hair: '#6b4a33' }); S.add(F_OL2);
const watashi = label('え、私たちのも消えるの？', { w: 1024, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.2 }); S.add(watashi);
const sparkF = makeSparkles(120, 0.12, 0xffffff); S.add(sparkF.points); sparkF.init([[FX - 0.2, 1.4, -1.4]], 0.6, 0.6);
// 結果（男たちがメイクを落とす）とタダのサービス
const yametai = label('もうやめたい', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(yametai);
const tada = label('タダのサービス', { w: 768, size: 100, color: '#fff', bg: 'rgba(200,150,40,.97)', sx: 1.5 }); S.add(tada);

const PEOPLE = [KACHO, OL, OL2, B_KACHO, C_KACHO, ...RIDERS, BUCHO, D_KACHO, ...D_OTHERS, ...QUEUE, F_OL, F_OL2];
const LABELS = [gateSign, don, kinou, taicho, tsukare, pi, sLab, fLab, dotchi, beige, sasayaku, tekari, kyuryo, clockMorning, naoshi, sotto, watashi, yametai, tada];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; if (p.userData.face) { makeup(p, 0); p.userData.shine.visible = false; } });
  LABELS.forEach(l => l.visible = false); sweatK.userData.set(0); sweatD.userData.set(0); sparkF.set(0); drawRule(0);
  GATE.visible = true; GATE.position.set(0, 0, 0); GATE.scale.setScalar(1); GATE.userData.bar.rotation.z = 0;
  KACHO.position.set(0, 0, 1.6); KACHO.rotation.y = Math.PI; OL.position.set(-2.4, 0, -1.4); OL.rotation.y = 0.6; OL2.position.set(-3.1, 0, -1.0); OL2.rotation.y = 0.8;
  B_KACHO.position.set(BX, 0, 0.55); B_KACHO.rotation.y = Math.PI; SHITAJI.position.set(BX - 0.35, 0.97, -0.05); FANDE.position.set(BX + 0.35, 0.9, -0.05); BRUSH.visible = false;
  C_KACHO.position.set(CX + 0.4, 0, 0); C_KACHO.rotation.y = -Math.PI / 2; MASK.visible = MASK_IN.visible = BEIGE_SPOT.visible = false; RIDERS.forEach((p, i) => { p.position.set(CX + (i % 2 ? 0.5 : -0.5), 0, -1.4 - i * 1.0); p.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; });
  const st = MR.userData.seats; [BUCHO, D_KACHO, ...D_OTHERS].forEach((p, i) => { const s = st[[2, 0, 4, 5][i]]; p.position.set(DX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  MR.userData.board.set(['定例会議']);
  QUEUE.forEach((p, i) => { p.position.set(EX - 2.2 + i * 0.75, 0, -1.2); p.rotation.y = -Math.PI / 2; });
  F_OL.position.set(FX + 1.2, 0, 0.4); F_OL.rotation.y = -0.5; F_OL2.position.set(FX + 1.9, 0, 0.6); F_OL2.rotation.y = -0.6;
  el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.45;
function gateCam(u = 0) { look(lerp(0.9, 0.7, u), 1.6, lerp(-3.2, -3.0, u), 0, 1.95, 1.2, 50); }
function shot0(t) { // 0秒＝サムネ：会社の入口に、すっぴんの男が通れないゲートがドンと立つ
  reset(); lift(0); const k = easeOut(clamp(t / TP)); GATE.position.y = (1 - k) * 0.5; GATE.scale.setScalar(1 + (1 - k) * 0.1);
  KACHO.userData.head.rotation.x = t > TP ? -0.15 : 0;
  if (t > TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(don, t, TP, -0.85, 1.5, 0.6, 0.5); }
  gateSign.visible = true; gateSign.position.set(0, 2.2, 1.3); gateSign.userData.size(1.4);
  gateCam(ease(clamp(t / 3)));
  return S;
}
function sKinou(t) { // 昨日、女性社員に 今日体調悪い？ と聞いた課長。（回想）
  reset(); lift(100); GATE.visible = false; KACHO.position.set(-1.2, 0, -0.6); KACHO.rotation.y = -0.9; KACHO.userData.arms[1].rotation.set(-0.8, 0, 0.3); OL.position.set(-2.3, 0, -1.3); OL.rotation.y = 0.7; OL.userData.head.rotation.x = 0.2;
  say(kinou, t, 0.1, -3.0, 2.7, -1.0, 0.7); say(taicho, t, 0.5, -1.7, 2.35, -0.6, 1.25);
  look(-1.6, 1.8, 3.0, -1.7, 1.6, -1.0, 50);
  return S;
}
GATE.visible = true;
function sTomaru(t) { // ゲートで止められる。
  reset(); lift(100); GATE.visible = true; KACHO.position.set(0, 0, 0.9 - Math.min(t, 0.8) * 0.6); KACHO.rotation.y = Math.PI; KACHO.rotation.x = t > 0.8 ? -0.12 : 0; sweatK.userData.set(clamp((t - 1.0) / 0.4), t);
  GATE.userData.lamp.material.color.set(t > 0.8 && (t * 4) % 1 < 0.5 ? '#ff3030' : '#601010');
  if (t > 0.8) say(pi, t, 0.8, 1.2, 1.9, 0.4, 0.6);
  look(1.6, 1.8, -2.6, 0.0, 1.4, 0.6, 50);
  return S;
}
function sFuman(t) { // 女性社員の不満から。
  reset(); lift(100); GATE.visible = true; KACHO.visible = false; OL.position.set(-0.5, 0, 1.0); OL.rotation.y = 0.2; OL2.position.set(0.5, 0, 1.2); OL2.rotation.y = -0.2;
  look(0.2, 1.7, 4.4, 0, 1.5, 0.8, 50);
  return S;
}
function sTsukare(t) { // すっぴんで来ると、疲れてる？ と言われてきた。
  reset(); lift(100); GATE.visible = true; KACHO.position.set(1.0, 0, 1.2); KACHO.rotation.y = -1.2; KACHO.userData.arms[1].rotation.set(-1.1, 0, 0.2); OL.position.set(-0.4, 0, 1.0); OL.rotation.y = 1.0; OL.userData.head.rotation.x = 0.25; OL2.visible = false;
  say(tsukare, t, 0.5, 0.6, 2.4, 1.2, 0.95);
  look(0.3, 1.7, 4.4, 0.3, 1.5, 0.8, 50);
  return S;
}
function sinkCam(u = 0) { look(BX + lerp(2.5, 2.3, u), 1.9, lerp(2.4, 2.1, u), BX, 1.5, 0.1, 50); }
function sAsa(t) { // 朝6時。洗面所で課長が、
  reset(); lift(100); B_KACHO.userData.head.rotation.x = 0.1; setHud('朝', '6:00', 1); sinkCam(ease(clamp(t / 3)));
  // 鏡に映る顔（課長の向こうに）
  return S;
}
function sJunban(t) { // 下地とファンデの順番で迷う。
  reset(); lift(100); const k = Math.sin(t * 2.4); B_KACHO.userData.arms[1].rotation.set(-0.9, 0, -0.3 + k * 0.4); B_KACHO.userData.head.rotation.y = k * 0.3;
  say(sLab, t, 0.2, BX - 0.35, 1.25, -0.05, 0.4); say(fLab, t, 0.4, BX + 0.35, 1.2, -0.05, 0.5); if (t > 1.2) say(dotchi, t, 1.2, BX, 2.3, 0.5, 1.0);
  setHud('朝', '6:00', 1); look(BX + 2.4, 1.9, 2.2, BX, 1.4, 0.0, 50);
  return S;
}
function sTsukin(t) { // 通勤電車。
  reset(); lift(100); makeup(C_KACHO, 1); C_KACHO.userData.arms[0].rotation.set(0, 0, -2.9); MASK.visible = true; C_KACHO.updateMatrixWorld(); { const v = new THREE.Vector3(0, 1.66, 0.22); C_KACHO.localToWorld(v); MASK.position.copy(v); MASK.rotation.y = C_KACHO.rotation.y; }
  look(CX - 1.0, 1.75, 2.2, CX + 0.2, 1.6, -0.2, 50);
  return S;
}
function sMask(t) { // マスクの内側が、ファンデでベージュになる。
  reset(); lift(100); makeup(C_KACHO, 1); C_KACHO.userData.arms[1].rotation.set(-1.6, 0, -0.2); C_KACHO.userData.head.rotation.x = 0.35;
  MASK_IN.visible = true; MASK_IN.scale.setScalar(0.6); MASK_IN.position.set(CX - 0.2, 1.62, 0.0); MASK_IN.rotation.set(0, Math.PI / 2, 0); BEIGE_SPOT.visible = true; BEIGE_SPOT.position.set(CX - 0.21, 1.62, 0.0); BEIGE_SPOT.rotation.set(0, Math.PI / 2, 0); BEIGE_SPOT.scale.setScalar(0.6 * (0.4 + 0.6 * easeOut(clamp((t - 0.3) / 0.8))));
  if (t > 1.0) say(beige, t, 1.0, CX - 0.2, 2.05, 0.0, 0.6);
  look(CX - 1.3, 1.75, 1.3, CX - 0.1, 1.6, 0.0, 50);
  return S;
}
function meetCam(u = 0) { look(DX - 0.6 + u * 0.3, 2.0, 2.6, DX - 0.6, 1.1, -1.6, 50); }
function sKaigi(t) { // 午後の会議。テカった額を見て、
  reset(); lift(100); makeup(D_KACHO, 0.8); D_KACHO.userData.shine.visible = true; D_KACHO.userData.shine.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(t * 3)); BUCHO.userData.head.rotation.y = 0.6;
  if (t > 0.6) { const s = MR.userData.seats[0]; say(tekari, t, 0.6, DX + s.x, 2.15, s.z, 0.6); }
  setHud('午後', '会議', 1); meetCam(ease(clamp(t / 3)));
  return S;
}
function sSasayaku(t) { // 部長がささやく。疲れてる？
  reset(); lift(100); makeup(D_KACHO, 0.8); D_KACHO.userData.shine.visible = true; BUCHO.userData.head.rotation.y = -0.6; BUCHO.rotation.x = 0.1; sweatD.userData.set(clamp((t - 0.8) / 0.4), t);
  { const s = MR.userData.seats[2]; say(sasayaku, t, 0.4, DX + s.x, 2.2, s.z, 0.95); }
  setHud('午後', '会議', 1); meetCam(1);
  return S;
}
function sKyuryo(t) { // 男たちは知る。毎朝のこの時間に、給料は1円も出ていない。
  reset(); lift(100); makeup(B_KACHO, clamp(t / 2)); B_KACHO.userData.arms[1].rotation.set(-2.2, 0, -0.4 + Math.sin(t * 8) * 0.1); BRUSH.visible = true; B_KACHO.updateMatrixWorld(); { const v = new THREE.Vector3(0.1, 1.72, 0.3); B_KACHO.localToWorld(v); BRUSH.position.copy(v); }
  say(clockMorning, t, 0.2, BX - 0.2, 2.5, 0.2, 1.0); if (t > 1.0) say(kyuryo, t, 1.0, BX + 0.1, 2.15, 0.5, 1.35);
  look(BX + 2.4, 1.9, 2.2, BX, 1.6, 0.1, 50);
  return S;
}
function sGyoretsu(t, d) { // 夕方。化粧直しのトイレに、男の行列。
  reset(); lift(100); QUEUE.forEach((p, i) => { makeup(p, 0.7); p.userData.shine.visible = i % 2 === 0; p.userData.head.rotation.x = 0.1; });
  if (t > 0.8) say(naoshi, t, 0.8, EX - 0.6, 2.6, -1.2, 1.0);
  setHud('夕方', '17:00', 1); const u = ease(clamp(t / d)); look(EX + lerp(3.6, 3.0, u), 2.0, lerp(3.4, 3.0, u), EX - 0.4, 1.4, -1.2, 52);
  return S;
}
function sSotto(t, d) { // 1週間後。会社の決まりから、メイクの義務がそっと消える。
  reset(); lift(100); F_OL.visible = F_OL2.visible = false; drawRule(clamp((t - 0.6) / 1.4)); sparkF.set(clamp((t - 0.8) / 1.6));
  if (t > 1.8) say(sotto, t, 1.8, FX, 2.95, -1.3, 1.2);
  setHud('1週間後', '決まり', 1); look(FX, 1.8, 2.4, FX, 1.75, -1.5, 50);
  return S;
}
function sWatashi(t) { // 女性社員は言う。え、私たちのも消えるの？
  reset(); lift(100); drawRule(1); F_OL.userData.arms[1].rotation.set(-1.2, 0, 0.3); F_OL.userData.head.rotation.x = -0.1; F_OL2.userData.head.rotation.y = -0.4;
  say(watashi, t, 0.4, FX + 0.9, 2.4, 0.4, 1.7);
  look(FX + 0.8, 1.8, 3.6, FX + 0.8, 1.6, -0.2, 50);
  return S;
}
function sKekka(t, d) { // 結果：すっぴんに文句を言っていた男ほど、1週間でメイクをやめたがった。
  reset(); lift(100); GATE.visible = true; KACHO.position.set(0, 0, 1.2); KACHO.rotation.y = 0; makeup(KACHO, 1 - clamp(t / d)); KACHO.userData.arms.forEach(a => a.rotation.set(-1.9, 0, 0)); KACHO.userData.head.rotation.x = 0.2;
  if (t > 1.2) say(yametai, t, 1.2, 0, 2.6, 1.2, 1.2);
  const u = ease(clamp(t / d)); look(lerp(0.4, 1.0, u), 1.8, lerp(4.0, 5.0, u), 0, 1.6, 1.0, 50);
  return S;
}
function sTada(t, d) { // 女性社員の顔は、ずっと男がタダで見ていたサービス
  reset(); lift(100); GATE.visible = true; KACHO.visible = false; OL.position.set(-0.5, 0, 1.0); OL.rotation.y = 0.2; OL2.position.set(0.5, 0, 1.2); OL2.rotation.y = -0.2;
  if (t > 0.8) say(tada, t, 0.8, 0, 2.55, 1.1, 1.4);
  look(0.2, 1.7, 4.4, 0, 1.5, 0.8, 50);
  return S;
}
function sKamo(t, d) { // だったのかもしれない。
  reset(); lift(100); GATE.visible = true; KACHO.visible = false; OL.position.set(-0.5, 0, 1.0); OL.rotation.y = 0.2; OL2.position.set(0.5, 0, 1.2); OL2.rotation.y = -0.2; tada.visible = true; tada.position.set(0, 2.55, 1.1); tada.userData.size(1.4);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.6, u), 1.8, lerp(4.4, 5.4, u), 0, 1.5, 0.8, 50);
  return S;
}
function sAsk(t) { // 職場のすっぴん、あり？なし？（冒頭と同じ構図）
  reset(); lift(0); KACHO.rotation.y = Math.PI; gateSign.visible = true; gateSign.position.set(0, 2.2, 1.3); gateSign.userData.size(1.4); gateCam(0);
  return S;
}

const NARR = { '昨日': 'きのう', '課長': 'かちょう', '部長': 'ぶちょう', '朝6時': 'あさろくじ', '洗面所': 'せんめんじょ', '下地': 'したじ', '通勤電車': 'つうきんでんしゃ', '額': 'ひたい', '1円': 'いちえん', '化粧直し': 'けしょうなおし', '1週間後': 'いっしゅうかんご', '1週間で': 'いっしゅうかんで', '義務': 'ぎむ', '結果：': '結果、', '女性社員': 'じょせいしゃいん', '行列': 'ぎょうれつ', '今日': 'きょう' };
const P = planTimes([
  ['昨日、女性社員に<br>今日体調悪い？ と聞いた課長。', sKinou],
  ['ゲートで止められる。', sTomaru],
  ['女性社員の不満から。', sFuman],
  ['すっぴんで来ると、<br>疲れてる？ と言われてきた。', sTsukare],
  ['朝6時。洗面所で課長が、', sAsa],
  ['下地とファンデの順番で迷う。', sJunban],
  ['通勤電車。', sTsukin],
  ['マスクの内側が、<br>ファンデでベージュになる。', sMask],
  ['午後の会議。<br>テカった額を見て、', sKaigi],
  ['部長がささやく。疲れてる？', sSasayaku],
  ['男たちは知る。毎朝のこの<br>時間に、給料は1円も出ていない。', sKyuryo],
  ['夕方。化粧直しのトイレに、<br>男の行列。', sGyoretsu],
  ['1週間後。会社の決まりから、<br>メイクの義務がそっと消える。', sSotto],
  ['女性社員は言う。<br>え、私たちのも消えるの？', sWatashi],
  ['結果：すっぴんに文句を<br>言っていた男ほど、', sKekka],
  ['1週間でメイクを<br>やめたがった。', (t, d) => sKekka(t + 2.5, d + 2.5)],
  ['女性社員の顔は、ずっと男が<br>タダで見ていたサービス', sTada],
  ['だったのかもしれない。', sKamo],
  ['職場のすっぴん、<br>あり？なし？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0668',
    v2: true,
    tt: 'main',
    hookLine: '会社の入口に、すっぴんの男が通れないゲートがドンと立つ。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも職場で男にもメイクが義務だったら？',
    titleHtml: 'もしも職場で<br>男にもメイクが<br>義務だったら？',
    mood: 'tension', seed: 668, hits: [TP, P.at(14), P.at(16, 0.8)], risers: [P.at(10)], impacts: [P.at(1, 0.8), P.at(9, 0.4), P.at(10, 1.0), P.at(12, 1.8), P.at(16, 0.8)],
    sfx: [[TP, 'poof'], [P.at(1, 0.8), 'alarm'], [P.at(3, 0.5), 'bubble'], [P.at(5, 1.2), 'meter', 0.3], [P.at(7, 1.0), 'buzz'], [P.at(9, 0.4), 'bubble'], [P.at(10, 1.0), 'alarm'], [P.at(12, 1.8), 'poof'], [P.at(13, 0.4), 'bubble']],
    narr: NARR,
    ask: '職場のすっぴん、あり？なし？',
    caption: 'もしも職場で男にもメイクが義務だったら？\n\n昨日、女性社員に今日体調悪い？と聞いた課長。ゲートで止められる。\n女性社員の不満から。すっぴんで来ると、疲れてる？と言われてきた。\n朝6時。洗面所で課長が、下地とファンデの順番で迷う。\n通勤電車。マスクの内側が、ファンデでベージュになる。\n午後の会議。テカった額を見て、部長がささやく。疲れてる？\n男たちは知る。毎朝のこの時間に、給料は1円も出ていない。\n夕方。化粧直しのトイレに、男の行列。\n1週間後。会社の決まりから、メイクの義務がそっと消える。\n女性社員は言う。え、私たちのも消えるの？\n\n結果：すっぴんに文句を言っていた男ほど、1週間でメイクをやめたがった。\n女性社員の顔は、ずっと男がタダで見ていたサービスだったのかもしれない。\n\n職場のすっぴん、あり？なし？ コメントで教えて。\n\n※風刺ネタです。男にメイクが義務になるのは、もしもの設定です。登場する人物・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', 'メイク', 'すっぴん', '男と女'],
    endStats: [['男にも義務になったもの', 'メイク', 'もしもの設定'], ['1週間後', 'メイクの義務がそっと消えた', 'もしもの結果'], ['女性社員の顔の正体', 'タダのサービス', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
