import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #056 MIU404（ドラマ・日本・2020年・TBS 金曜ドラマ・全11話。Prime Video・Disney+（ほか Netflix）で見放題、
//   justwatch.com/jp/テレビ番組/miu404 で2026/11/4確認。Filmarks 4.3・レビュー80,786件 filmarks.com/dramas/8760/12513）
// 確かめた事実（Filmarks の第1話の紹介・ja.wikipedia.org/wiki/MIU404。2026/11/4）：
//   ・警視庁の働き方改革で機動捜査隊（機捜）が3部制から4部制に。臨時部隊として第4機捜が新設される
//   ・機捜は事件の初動捜査を担当。ドラマでは24時間というタイムリミットの中で事件解決を目指す
//   ・相棒は、とにかく足が速い破天荒な刑事と、対照的に落ち着いた理性的な刑事
//   ・第2話以降の車は、メロンパンの移動販売車を模した覆面車（まるごとメロンパン号）。MIU＝Mobile Investigative Unit、404はコールサイン
//   ・TBS系 金曜ドラマ、2020年6月26日〜9月4日、全11話、脚本 野木亜紀子（オリジナル）
// 構成（ヒント6段）：1 深夜の通報、真っ先に駆けつける刑事 → 2 新しくできた臨時の部隊、とにかく足が速い男 → 3 担当は最初の捜査だけ、期限は24時間
//   → 4 相棒は冷静な男、正反対のバディ → 5 2020年の日本のドラマ・全11話 → 6 決め手：メロンパンの移動販売車、機動捜査隊
// メロンパン・機捜・404・人物名・地名は6段目まで出さない。俳優・ロゴ・有名な場面の構図は使わない。人と車は汎用の3D

const S = quizStage({ bg: '#141a28', floor: '#22262e', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5656);

const IBU = { skin: '#eccaa8', hair: '#1a1614', shirt: '#3a3a40', pants: '#2a2a30' };
const SHI = { skin: '#efcfae', hair: '#2a2420', shirt: '#e8e8ec', pants: '#2a3044', tie: true };

function makeCar(color) { const g = new THREE.Group(); const b = box(1.7, 0.6, 3.8, mat(color)); b.position.y = 0.55; g.add(b); const t = box(1.5, 0.5, 1.9, mat(color)); t.position.set(0, 1.1, -0.2); g.add(t); const gl = box(1.52, 0.36, 1.7, mat('#3a4a5a')); gl.position.set(0, 1.12, -0.2); g.add(gl);
  for (const x of [-0.8, 0.8]) for (const z of [-1.25, 1.25]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), mat('#141414')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.3, z); g.add(w); }
  for (const x of [-0.55, 0.55]) { const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshBasicMaterial({ color: '#fff6d0' })); hl.position.set(x, 0.62, 1.91); g.add(hl); }
  return g; }

// ---------- 1段目. 深夜の大通り（x=0）。屋根に赤色灯を載せて走る車 ----------
{ const rd = box(10, 0.04, 60, mat('#26282e')); rd.position.set(0, 0.02, -20); qs.add(rd);
  for (let i = 0; i < 14; i++) { const ln = box(0.16, 0.02, 1.6, mat('#d8d4c8')); ln.position.set(0, 0.05, 6 - i * 4); qs.add(ln); }
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const h = 8 + R() * 12, wt = windowTextures(5600 + i + (s > 0 ? 10 : 0), '#3a4050'); wt.map.repeat.set(2, h / 2); wt.emi.repeat.set(2, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(4, h, 6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.6 })); b.position.set(s * 8, h / 2, -i * 8); qs.add(b); } }
const CAR1 = makeCar('#2a2e36'); CAR1.rotation.y = Math.PI; qs.add(CAR1);
const BEACON = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); BEACON.position.set(-0.3, 1.45, -0.2); CAR1.add(BEACON);
const BL = new THREE.PointLight(0xff2a2a, 0, 12, 1.2); BL.position.set(-0.3, 2.0, -0.2); CAR1.add(BL);
const tCall = tag('深夜の通報', { size: 76, w: 440, bg: '#e2483c', sx: 1.7 }); qs.add(tCall);
const tFirst = tag('現場に一番乗り', { size: 70, w: 500, bg: '#14161c', sx: 1.8 }); qs.add(tFirst);

// ---------- 2段目. 夜の歩道（x=40）。とにかく足が速い男 ----------
const RX = 40;
{ const fl = box(10, 0.04, 50, mat('#4a4c54')); fl.position.set(RX, 0.02, -16); qs.add(fl);
  for (let i = 0; i < 8; i++) { const lp = box(0.1, 4, 0.1, mat('#2a2a2e')); lp.position.set(RX + 3, 2, 4 - i * 6); qs.add(lp); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a8' })); bl.position.set(RX + 3, 4.1, 4 - i * 6); qs.add(bl); }
  for (let i = 0; i < 6; i++) { const h = 6 + R() * 6; const b = box(5, h, 6, mat(['#3a3e48', '#4a4450', '#343a44'][i % 3])); b.position.set(RX - 6, h / 2, -i * 7); qs.add(b); } }
const i2 = makePerson(IBU); i2.position.set(RX, 0, 0); qs.add(i2);
const s2 = makePerson(SHI); s2.position.set(RX, 0, 0); qs.add(s2);
const SPEED = []; for (let i = 0; i < 10; i++) { const l = box(0.03, 0.03, 1.2 + R(), new THREE.MeshBasicMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.6 })); l.userData = { x: (R() - 0.5) * 1.6, y: 0.6 + R() * 1.4, o: R() }; qs.add(l); SPEED.push(l); }
const tNew = tag('新しくできた臨時の部隊', { size: 58, w: 680, bg: '#14161c', sx: 1.5 }); qs.add(tNew);
const tFast = tag('とにかく足が速い', { size: 66, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.5 }); qs.add(tFast);

// ---------- 3段目. 夜の交差点を見下ろす（x=80）。最初の捜査だけ・24時間 ----------
const CX = 80;
{ const fl = box(30, 0.04, 30, mat('#2a2c32')); fl.position.set(CX, 0.02, -4); qs.add(fl);
  for (const r of [0, Math.PI / 2]) { const rd = box(6, 0.03, 30, mat('#33353c')); rd.position.set(CX, 0.04, -4); rd.rotation.y = r; qs.add(rd); }
  for (let i = 0; i < 6; i++) { const zb = box(0.5, 0.02, 2.4, mat('#d8d4c8')); zb.position.set(CX - 2.5 + i, 0.06, 0.6); qs.add(zb); }
  for (const [x, z] of [[-9, -12], [9, -12], [-9, 4], [9, 4]]) { const h = 10 + R() * 8, wt = windowTextures(5620 + x + z, '#3a4050'); wt.map.repeat.set(3, h / 2); wt.emi.repeat.set(3, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(8, h, 8), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.6 })); b.position.set(CX + x, h / 2, z); qs.add(b); } }
const CAR3 = makeCar('#2a2e36'); CAR3.position.set(CX + 1.2, 0, -2); qs.add(CAR3);
const B3 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); B3.position.set(-0.3, 1.45, -0.2); CAR3.add(B3);
const CLOCK = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(320, 120, (g, w, h) => { g.fillStyle = '#0e1016'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e2483c'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#ff5a4a'; g.font = 'bold 84px monospace'; g.textAlign = 'center'; g.fillText('24:00', w / 2, 92); }) })); CLOCK.position.set(CX, 3.9, -4); qs.add(CLOCK);
const tOnly = tag('担当は、最初の捜査だけ', { size: 58, w: 680, bg: '#14161c', sx: 5.2 }); tOnly.position.set(CX, 5.6, -4); qs.add(tOnly);
const t24 = tag('期限は24時間', { size: 70, w: 480, bg: '#e2483c', sx: 3.8 }); t24.position.set(CX, 6.4, -4); qs.add(t24);

// ---------- 4段目. 車の前で向き合うふたり（x=120）。正反対のバディ ----------
const BX = 120;
{ const fl = box(16, 0.04, 14, mat('#30323a')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  for (let i = 0; i < 5; i++) { const h = 8 + R() * 6; const wt = windowTextures(5640 + i, '#3a4050'); wt.map.repeat.set(2, h / 2); wt.emi.repeat.set(2, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(4, h, 4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.5 })); b.position.set(BX - 8 + i * 4, h / 2, -9); qs.add(b); } }
const i4 = makePerson(IBU); i4.position.set(BX - 0.8, 0, 0); i4.rotation.y = 0.5; qs.add(i4);
const s4 = makePerson(SHI); s4.position.set(BX + 0.8, 0, 0); s4.rotation.y = -0.5; qs.add(s4);
const NOTE = box(0.2, 0.28, 0.03, mat('#f4f2ea')); qs.add(NOTE);
const tCool = tag('相棒は、冷静な男', { size: 64, w: 560, bg: '#3a7ad8', sx: 1.9 }); tCool.position.set(BX, 2.65, 0); qs.add(tCool);
const tOpp = tag('正反対のバディ', { size: 70, w: 500, bg: '#e6b450', color: '#14161c', sx: 1.9 }); tOpp.position.set(BX, 2.65, 0); qs.add(tOpp);

// ---------- 5段目. テレビの前（x=160）。2020年の日本のドラマ・全11話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a24' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a3a5a'); gr.addColorStop(1, '#0e1220'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 11; i++) { g.beginPath(); g.arc(46 + (i % 6) * 84, 100 + Math.floor(i / 6) * 90, 22, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tJP = tag('2020年 日本のドラマ', { size: 62, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const t11 = tag('全11話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t11.position.set(TX, 4.6, -1.2); qs.add(t11);
const tCop = tag('金曜夜10時の刑事ドラマ', { size: 58, w: 680, bg: '#e2483c', sx: 3.0 }); tCop.position.set(TX, 3.75, -1.0); qs.add(tCop);

// ---------- 6段目. メロンパンの移動販売車（x=200） ----------
const MX = 200;
{ const fl = box(18, 0.04, 14, mat('#3a3c44')); fl.position.set(MX, 0.02, -3); qs.add(fl);
  for (let i = 0; i < 5; i++) { const h = 7 + R() * 6; const wt = windowTextures(5660 + i, '#3a4050'); wt.map.repeat.set(2, h / 2); wt.emi.repeat.set(2, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(4, h, 4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.5 })); b.position.set(MX - 8 + i * 4, h / 2, -9); qs.add(b); } }
const VAN = new THREE.Group(); VAN.position.set(MX, 0, -1.6); VAN.rotation.y = -0.5; qs.add(VAN);
{ const body = box(2.0, 2.0, 4.2, mat('#f4efe0')); body.position.y = 1.3; VAN.add(body); const cab = box(2.0, 1.4, 1.0, mat('#f4efe0')); cab.position.set(0, 1.0, 2.5); VAN.add(cab);
  const ws = box(1.8, 0.7, 0.04, mat('#3a4a5a')); ws.position.set(0, 1.3, 3.02); VAN.add(ws);
  const stripe = box(2.04, 0.3, 4.24, mat('#7ab84a')); stripe.position.y = 0.6; VAN.add(stripe);
  for (const x of [-0.95, 0.95]) for (const z of [-1.4, 2.4]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), mat('#141414')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); VAN.add(w); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.0), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); win.position.set(1.02, 1.6, -0.2); win.rotation.y = Math.PI / 2; VAN.add(win);
  const awn = box(0.6, 0.06, 2.6, mat('#7ab84a')); awn.position.set(1.3, 2.2, -0.2); awn.rotation.z = -0.3; VAN.add(awn);
  const bunTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#e8c860'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8902a'; g.lineWidth = 5; for (let i = -6; i < 12; i++) { g.beginPath(); g.moveTo(i * 26, 0); g.lineTo(i * 26 + 128, h); g.stroke(); g.beginPath(); g.moveTo(i * 26 + 128, 0); g.lineTo(i * 26, h); g.stroke(); } });
  const bun = new THREE.Mesh(new THREE.SphereGeometry(1.0, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ map: bunTex })); bun.scale.set(1, 0.55, 1.3); bun.position.set(0, 2.3, -0.4); VAN.add(bun);
  const bunB = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.95, 0.12, 28), mat('#d8b050')); bunB.scale.set(1, 1, 1.3); bunB.position.set(0, 2.32, -0.4); VAN.add(bunB); }
const VBEACON = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); VBEACON.position.set(-0.4, 2.2, 2.6); VAN.add(VBEACON);
const VBL = new THREE.PointLight(0xff2a2a, 0, 10, 1.2); VBL.position.set(-0.4, 2.6, 2.6); VAN.add(VBL);
const i6 = makePerson(IBU); i6.position.set(MX - 2.2, 0, 1.2); i6.rotation.y = 0.4; qs.add(i6);
const s6 = makePerson(SHI); s6.position.set(MX + 2.2, 0, 1.2); s6.rotation.y = -0.4; qs.add(s6);
const tMelon = tag('メロンパンの移動販売車', { size: 58, w: 680, bg: '#5a9a3a', sx: 3.6 }); tMelon.position.set(MX, 4.3, -1); qs.add(tMelon);
const tKiso = tag('ふたりは、機動捜査隊', { size: 60, w: 640, bg: '#14161c', sx: 3.2 }); tKiso.position.set(MX, 3.55, -0.6); qs.add(tKiso);

// ---------- shots ----------
const ALL = [tCall, tFirst, tNew, tFast, tOnly, t24, tCool, tOpp, tJP, t11, tCop, tMelon, tKiso];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BL.intensity = 0; VBL.intensity = 0; SPEED.forEach(l => l.visible = false); }
const blink = (t) => (Math.sin(t * 12) > 0 ? 1 : 0.15);

function shotRoad(t) { // 1段目 0〜9：深夜の通報。真っ先に駆けつける車（0秒目がサムネ）
  base(); S.aim(0, -4); lift(-40); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.6, '#05070e');
  const z = 2 - t * 2.2; CAR1.position.set(-1.2, 0, z);
  const b = blink(t); BEACON.material.color.set(b > 0.5 ? '#ff2a2a' : '#5a1010'); BL.intensity = 14 * b;
  tCall.position.set(-1.2, 2.4, z); tFirst.position.set(-1.2, 2.4, z);
  tCall.userData.pop(1); if (t > 4.6) tCall.visible = false;
  tFirst.userData.pop((t - 4.8) / 0.35);
  look(lerp(1.4, 1.0, ease(t / 9)), 2.2, z + 6.2, -1.2, 1.3, z - 1, 54);
  return qs;
}
function shotRun(t) { // 2段目 9〜17：新しくできた臨時の部隊。とにかく足が速い男
  base(); S.aim(RX, -8); lift(-40); S.hemi.intensity = 1.3; S.key.intensity = 1.3; S.darken(0.5, '#05070e');
  const zi = 2 - t * 3.0, zs = 3.2 - t * 2.4; i2.position.set(RX + 0.3, 0, zi); s2.position.set(RX - 0.8, 0, zs); i2.rotation.y = Math.PI; s2.rotation.y = Math.PI;
  poseWalk(i2, t * 11, 1.6); poseWalk(s2, t * 8, 1.0);
  SPEED.forEach(l => { l.visible = t > 4.2; const k = (t * 2 + l.userData.o) % 1; l.position.set(RX + 0.3 + l.userData.x, l.userData.y, zi + 1 + k * 2); l.material.opacity = 0.6 * (1 - k); });
  tNew.position.set(RX + 0.1, 2.5, zi + 0.4); tFast.position.set(RX + 0.3, 2.55, zi);
  tNew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNew.visible = false;
  tFast.userData.pop((t - 4.2) / 0.35);
  look(RX + 1.2, 1.9, zi + 4.6, RX, 1.3, zi - 1, 56);
  return qs;
}
function shotCross(t) { // 3段目 17〜25：担当は最初の捜査だけ。期限は24時間
  base(); S.aim(CX, -3); lift(-30); S.hemi.intensity = 0.8; S.darken(0.55, '#05070e');
  B3.material.color.set(blink(t) > 0.5 ? '#ff2a2a' : '#5a1010');
  CLOCK.visible = t > 4.0; CLOCK.scale.setScalar(1.7 * Math.max(0.01, ease((t - 4.0) / 0.4)));
  tOnly.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOnly.visible = false;
  t24.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2, 1, u), lerp(11, 10, u), lerp(9, 8, u), CX, 1.5, -3, 56);
  return qs;
}
function shotBuddy(t) { // 4段目 25〜33：相棒は冷静な男。正反対のバディ
  base(); S.aim(BX, -1); lift(-40); S.hemi.intensity = 1.0; S.darken(0.45, '#05070e');
  i4.userData.arms[1].rotation.x = -0.4 - Math.abs(Math.sin(t * 4)) * 0.8; i4.position.y = Math.abs(Math.sin(t * 5)) * 0.05; i4.userData.head.rotation.y = Math.sin(t * 2) * 0.3;
  s4.userData.arms[0].rotation.x = -1.1; NOTE.position.set(BX + 0.62, 1.25, 0.45); NOTE.rotation.y = -0.5; s4.userData.head.rotation.x = 0.25;
  tCool.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCool.visible = false;
  tOpp.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.3, 0, u), lerp(2.0, 1.9, u), lerp(5.2, 4.6, u), BX, 1.45, 0, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2020年の日本のドラマ。全11話。金曜夜10時の刑事ドラマ
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  t11.userData.pop((t - 4.2) / 0.35); tCop.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.8, 7.0, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotVan(t, quiz = 0) { // 6段目 42〜49（決め手）：メロンパンの移動販売車。ふたりは機動捜査隊
  base(); S.aim(MX, -1); lift(-30); S.hemi.intensity = 1.15; S.key.intensity = 1.3; S.darken(0.4, '#05070e');
  const b = blink(t); VBEACON.material.color.set(b > 0.5 ? '#ff2a2a' : '#5a1010'); VBL.intensity = 10 * b;
  i6.userData.head.rotation.y = 0.2; s6.userData.head.rotation.y = -0.2;
  if (!quiz) { tMelon.userData.pop((t - 0.4) / 0.35); tKiso.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(MX + lerp(0.6, 0.3, u), lerp(3.6, 3.4, u), lerp(9.0, 8.2, u), MX, 0.7, -1, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の移動販売車）
  shotVan(7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.15, 0.25, d); S.key.intensity = lerp(1.3, 0.2, d);
  S.spot.color.set(0xfff0c8); S.spot.position.set(MX, 7, 3); S.spot.target.position.set(MX, 1.5, -1.6); S.spot.intensity = lerp(0, 70, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(MX + lerp(1.2, 0.6, k), lerp(3.2, 3.0, k), lerp(7.4, 6.4, k), MX, 0.9, -1.6, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRoad },
  { a: 9, b: 17, f: shotRun },
  { a: 17, b: 25, f: shotCross },
  { a: 25, b: 33, f: shotBuddy },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotVan(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '深夜の通報。<br>真っ先に駆けつける車。'],
  [5.6, 9.0, '事件の現場に、<br>一番乗りする刑事たち。'],
  [9.2, 13.2, '新しくできた、<br>臨時の部隊。'],
  [13.2, 17.0, '組まされたのは、<br>とにかく足が速い男。'],
  [17.2, 21.0, '担当するのは、<br>事件の最初の捜査だけ。'],
  [21.0, 25.0, 'タイムリミットは、<br>24時間。'],
  [25.2, 29.0, '相棒は、冷静で<br>理屈っぽい男。'],
  [29.0, 33.0, '正反対のふたりが、<br>バディを組む。'],
  [33.2, 37.4, '2020年の日本のドラマ。<br>全11話。'],
  [37.4, 41.8, '金曜夜10時の、<br>刑事ドラマ。'],
  [42.2, 45.4, 'ふたりが乗るのは、<br>メロンパンの移動販売車。'],
  [45.4, 49.0, '所属は、<br>機動捜査隊。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、MIU404。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q056', v2: true, answer: 'MIU404',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 5656,
    hits: [5.6, 13.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.2, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '深夜': 'しんや', '通報': 'つうほう', '真っ先': 'まっさき', '駆けつける': 'かけつける', '車': 'くるま', '事件': 'じけん', '現場': 'げんば', '一番乗り': 'いちばんのり', '刑事': 'けいじ', '臨時': 'りんじ', '部隊': 'ぶたい', '組まされた': 'くまされた', '足が速い': 'あしがはやい', '男': 'おとこ', '担当': 'たんとう', '最初': 'さいしょ', '捜査': 'そうさ', '24時間': 'にじゅうよじかん', '相棒': 'あいぼう', '冷静': 'れいせい', '理屈っぽい': 'りくつっぽい', '正反対': 'せいはんたい', '2020年': 'にせんにじゅうねん', '日本': 'にほん', '全11話': 'ぜんじゅういちわ', '金曜夜10時': 'きんようよるじゅうじ', '移動販売車': 'いどうはんばいしゃ', '所属': 'しょぞく', '機動捜査隊': 'きどうそうさたい', 'MIU404': 'ミュウよんまるよん', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n深夜の通報。真っ先に駆けつける車。新しくできた、臨時の部隊。組まされたのは、とにかく足が速い男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ディズニープラス', 'ドラマ好き', '刑事ドラマ'],
  },
});
applyQuizCards({ answer: 'MIU404', info: 'Prime Video・Disney+｜日本・全11話', answerSize: 150 });
