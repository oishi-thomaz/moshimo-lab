import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも男にもつわりが来たら？（皮肉回・台本 S56・図星／男と女のもしも）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。0635 もしも男にも生理が来たら？（インスタ 累計26.6万・平均の31.5倍）と同じ 立場の入れ替え
// 数字は使わない（つわりの割合・期間は出さない）。吐く絵は出さない（口をおさえる・トイレへ走るまで）。会社・駅・電車は架空

const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const GREEN_FACE = new THREE.Color('#b8d49a');
function suit(o = {}) { const p = makeSuit({ jacket: '#2e3442', tie: '#c8423a', ...o }); const face = p.userData.head.children[0]; p.userData.face = face; p.userData.skin0 = face.material.color.clone(); face.material = face.material.clone(); return p; }
function sick(p, k) { p.userData.face.material.color.copy(p.userData.skin0).lerp(GREEN_FACE, clamp(k)); }
// 口をおさえる（右手）
function mouth(p, k = 1, t = 0) { p.userData.arms[1].rotation.set(-2.55 * k, 0, -0.42 * k); p.userData.head.rotation.x = 0.18 * k + Math.sin(t * 25) * 0.01 * k; p.rotation.x = 0.06 * k; }
function strap(p, k = 1) { p.userData.arms[0].rotation.set(0, 0, -2.9 * k); }

// ---------- A：満員電車（原点）。架空の通勤電車の中 ----------
flat(3.2, 30, '#8a8a84', 0, 0, -0.85, 0.02);
const carWallL = box(0.1, 2.6, 30, mat('#d8dde2')); carWallL.position.set(-1.6, 1.3, 0); S.add(carWallL);
const carWallR = box(0.1, 2.6, 30, mat('#d8dde2')); carWallR.position.set(1.6, 1.3, 0); S.add(carWallR);
for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const w = box(0.02, 0.9, 1.6, new THREE.MeshBasicMaterial({ color: '#9fd0f0' })); w.position.set(sx * 1.54, 1.75, -10 + i * 4); S.add(w); const seat = box(0.5, 0.45, 3.2, mat('#3a6aa8')); seat.position.set(sx * 1.3, 0.22, -10 + i * 4 + 1.8); S.add(seat); }
const ceil = box(3.2, 0.1, 30, mat('#eef0f2')); ceil.position.set(0, 2.62, 0); S.add(ceil);
const rails = []; for (const x of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 30, 8), mat('#c8ccd4')); r.rotation.x = Math.PI / 2; r.position.set(x, 2.3, 0); S.add(r); rails.push(r); }
const STRAPS = []; for (const x of [-0.55, 0.55]) for (let i = 0; i < 24; i++) { const g = new THREE.Group(); const b = box(0.03, 0.22, 0.03, mat('#e8e8e8')); b.position.y = -0.11; g.add(b); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), mat('#f2f2f2')); ring.position.y = -0.28; g.add(ring); g.position.set(x, 2.3, -11 + i * 0.95); S.add(g); STRAPS.push(g); }
const RIDERS = []; { const r = rng(56); const jk = ['#2e3442', '#3a3f4e', '#4a4f60', '#2a2e38', '#56504a']; for (let i = 0; i < 10; i++) { const p = suit({ jacket: jk[i % 5], tie: ['#c8423a', '#3a6ab2', '#5a8a4a'][i % 3], old: i % 3 === 0, bald: i % 4 === 0, glasses: i % 5 === 2 }); const side = i % 2 ? 0.55 : -0.55; p.position.set(side + (side > 0 ? 0.0 : 0), 0, 3 - Math.floor(i / 2) * 1.05); p.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; p.userData.ph = r() * 6; S.add(p); RIDERS.push(p); } }
const WOMEN_A = [makeWoman({ shirt: '#e9b8c8' }), makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33' })]; WOMEN_A.forEach(p => S.add(p));
const UPS = RIDERS.slice(0, 6).map(() => { const l = label('うっ', { w: 384, size: 110, color: '#fff', bg: 'rgba(90,140,70,.96)', sx: 0.55 }); S.add(l); return l; });

// ---------- B：駅のベンチ（x=60） ----------
const BX = 60;
flat(12, 6, '#b9b4aa', BX, 0);
const edge = box(12, 0.06, 0.4, mat('#e8c23a')); edge.position.set(BX, 0.03, 2.4); S.add(edge);
const bench = new THREE.Group(); { const st = box(2.0, 0.1, 0.5, mat('#3a7ab8')); st.position.y = 0.46; bench.add(st); const bk = box(2.0, 0.45, 0.08, mat('#3a7ab8')); bk.position.set(0, 0.75, -0.24); bench.add(bk); for (const x of [-0.85, 0.85]) { const l = box(0.08, 0.46, 0.4, mat('#5a5e66')); l.position.set(x, 0.23, 0); bench.add(l); } } bench.position.set(BX, 0, 0); S.add(bench);
const pillar = box(0.5, 4, 0.5, mat('#d8d4cc')); pillar.position.set(BX - 2.2, 2, -0.6); S.add(pillar);
const stName = label('もしも台', { w: 640, size: 110, color: '#2a2a2a', bg: 'rgba(250,250,250,.97)', sx: 1.4 }); stName.position.set(BX + 2.2, 2.6, -0.8); S.add(stName);
const BUCHO = suit({ old: true, bald: true, glasses: true, jacket: '#3a3f4e' }); S.add(BUCHO); const sweatB = makeSweat(); BUCHO.userData.head.add(sweatB);
const byoki = label('つわりは病気じゃないだろ', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.6 }); S.add(byoki);
const kinou = label('昨日', { w: 400, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.7 }); S.add(kinou);
const ugokenai = label('動けない', { w: 600, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(ugokenai);

// ---------- C：台所（x=120）：炊飯器を開けたとたん、トイレへ ----------
const CX = 120;
flat(12, 10, '#d8d0c0', CX, 0);
const cWall = box(12, 3.2, 0.2, mat('#efe8da')); cWall.position.set(CX, 1.6, -2.4); S.add(cWall);
const counter = box(3.0, 0.9, 0.7, mat('#e8e4dc')); counter.position.set(CX - 0.8, 0.45, -1.9); S.add(counter);
const cooker = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.3, 20), mat('#f4f4f2')); b.position.y = 0.15; cooker.add(b); const lid = new THREE.Group(); const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20), mat('#d8dce2')); lm.position.set(0, 0, 0.26); lid.add(lm); lid.position.set(0, 0.31, -0.26); cooker.add(lid); cooker.userData.lid = lid; const rice = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), mat('#ffffff')); rice.position.y = 0.29; cooker.add(rice); } cooker.position.set(CX - 0.8, 0.9, -1.85); S.add(cooker);
const steam = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); S.add(m); return m; });
const toiletDoor = box(0.9, 2.1, 0.08, mat('#c9b48a')); toiletDoor.position.set(CX + 2.6, 1.05, -2.28); S.add(toiletDoor);
const toiletSign = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.9 }); toiletSign.position.set(CX + 2.6, 2.45, -2.1); S.add(toiletSign);
const OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(OTTO);
const OTTO_FACE = OTTO.userData.head.children[0]; OTTO_FACE.material = OTTO_FACE.material.clone(); const OTTO_SKIN = OTTO_FACE.material.color.clone();
const nioi = label('ごはんの匂い', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.3 }); S.add(nioi);

// ---------- D：給湯室（x=180）：コーヒーの匂いで早退 ----------
const DX = 180;
flat(10, 8, '#c8c4bc', DX, 0);
const dWall = box(10, 3.2, 0.2, mat('#e6e2da')); dWall.position.set(DX, 1.6, -2.0); S.add(dWall);
const dCounter = box(2.4, 0.9, 0.7, mat('#d8d8d4')); dCounter.position.set(DX, 0.45, -1.5); S.add(dCounter);
const coffee = new THREE.Group(); { const b = box(0.5, 0.65, 0.45, mat('#2a2a30')); b.position.y = 0.33; coffee.add(b); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 14), new THREE.MeshLambertMaterial({ color: '#5a3a22', transparent: true, opacity: 0.85 })); pot.position.set(0, 0.14, 0.12); coffee.add(pot); } coffee.position.set(DX - 0.4, 0.9, -1.5); S.add(coffee);
const kyuto = label('給湯室', { w: 512, size: 110, color: '#fff', bg: 'rgba(90,70,50,.95)', sx: 0.95 }); kyuto.position.set(DX - 1.6, 2.6, -1.8); S.add(kyuto);
const KACHO = suit({ jacket: '#3a4a5a', tie: '#3a6ab2' }); S.add(KACHO);
const bag = box(0.4, 0.3, 0.1, mat('#2a2018')); S.add(bag);
const soutai = label('早退', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(soutai);
const cnioi = label('コーヒーの匂い', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.35 }); S.add(cnioi);

// ---------- E：会議室（x=240） ----------
const EX = 240;
const MR = makeMeetingRoom(); MR.position.set(EX, 0, 0); S.add(MR);
const MSEATS = MR.userData.seats;
const MEN = [0, 1, 2, 3, 4].map(i => { const p = suit({ jacket: ['#2e3442', '#3a3f4e', '#4a4f60', '#2a2e38', '#56504a'][i], old: i === 2, bald: i === 2, glasses: i === 4 }); S.add(p); return p; });
const TSUMA = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }); S.add(TSUMA);
const UME = [0, 1, 2, 3, 4, 5].map(() => { const u = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat('#c8283a')); S.add(u); return u; });
const umeLab = label('梅干し', { w: 512, size: 110, color: '#fff', bg: 'rgba(200,40,58,.96)', sx: 0.95 }); S.add(umeLab);
const futsu = label('ふつうに働く', { w: 768, size: 100, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.3 }); S.add(futsu);
const owaranai = label('1日では終わらない', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.9 }); S.add(owaranai);
const atta = label('私のときにあったらよかった', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.5 }); S.add(atta);
const sweats = MEN.map(p => { const s = makeSweat(); p.userData.head.add(s); return s; });

// ---------- F：寝込む男たち（x=300）：布団が並ぶ ----------
const FX = 300;
flat(16, 10, '#c9b48a', FX, 0);
const fWall = box(16, 3.2, 0.2, mat('#efe6d6')); fWall.position.set(FX, 1.6, -3.0); S.add(fWall);
const FUTON = []; for (let i = 0; i < 4; i++) { const f = box(1.0, 0.18, 2.1, mat('#e8eef6')); f.position.set(FX - 3 + i * 2, 0.09, -0.6); S.add(f); const k = box(1.02, 0.22, 1.3, mat(['#7aa0d8', '#d88a7a', '#8ac08a', '#c8a0d8'][i])); k.position.set(FX - 3 + i * 2, 0.42, 0.1); k.scale.y = 0.6; S.add(k); const p = suit({ jacket: ['#2e3442', '#3a3f4e', '#4a4f60', '#2a2e38'][i], old: i === 1, bald: i === 1 }); p.rotation.x = -Math.PI / 2; p.position.set(FX - 3 + i * 2, 0.3, 0.6); S.add(p); FUTON.push(p); }
const nekomu = label('真っ先に寝込んだ', { w: 900, size: 100, color: '#fff', bg: 'rgba(90,140,70,.96)', sx: 2.0 }); nekomu.position.set(FX, 2.3, -1); S.add(nekomu);

// ---------- G：朝のオフィス（x=360）：男の席が空っぽ ----------
const GX = 360;
flat(14, 10, '#8a8a90', GX, 0);
const gWall = box(14, 3.2, 0.2, mat('#e6e2da')); gWall.position.set(GX, 1.6, -3.0); S.add(gWall);
const ISL = makeDeskIsland(3); ISL.position.set(GX, 0, -0.8); S.add(ISL);
const clockG = label('9:00', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.0 }); clockG.position.set(GX + 2.4, 2.5, -2.8); S.add(clockG);
const G_WOMAN = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }); S.add(G_WOMAN);
const kuuseki = label('男の席：からっぽ', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.9 }); kuuseki.position.set(GX, 2.4, -0.5); S.add(kuuseki);

const PEOPLE = [...RIDERS, ...WOMEN_A, BUCHO, OTTO, KACHO, ...MEN, TSUMA, G_WOMAN];
const LABELS = [...UPS, byoki, kinou, ugokenai, nioi, soutai, cnioi, umeLab, futsu, owaranai, atta, nekomu, kuuseki];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.visible = true; if (p.userData.face) sick(p, 0); });
  LABELS.forEach(l => l.visible = false); steam.forEach(m => m.visible = false); UME.forEach(u => u.visible = false); bag.visible = false; sweatB.userData.set(0); sweats.forEach(s => s.userData.set(0));
  RIDERS.forEach((p, i) => { const side = i % 2 ? 0.55 : -0.55; p.position.set(side, 0, 2.4 - Math.floor(i / 2) * 1.05); p.rotation.set(0, side > 0 ? -Math.PI / 2 + 0.75 : Math.PI / 2 - 0.75, 0); });
  WOMEN_A[0].position.set(-1.25, 0, 2.2); WOMEN_A[1].position.set(1.25, 0, 0.6); WOMEN_A.forEach(p => { p.rotation.y = 0; });
  OTTO_FACE.material.color.copy(OTTO_SKIN); cooker.userData.lid.rotation.x = 0;
  MEN.forEach((p, i) => { const s = MSEATS[i]; p.position.set(EX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  { const s = MSEATS[5]; TSUMA.position.set(EX + s.x, 0, s.z); TSUMA.rotation.y = s.ry; poseSit(TSUMA); }
  MR.userData.board.set(['定例会議']);
  { const s = ISL.userData.seats[1]; G_WOMAN.position.set(GX + s.x, 0, -0.8 + s.z); G_WOMAN.rotation.y = s.ry; poseSit(G_WOMAN); }
  el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sway(t) { RIDERS.forEach((p, i) => { p.rotation.z = Math.sin(t * 1.6 + p.userData.ph) * 0.02; }); }
const TP = 0.45;
function trainCam(u = 0) { look(lerp(0.15, 0.0, u), 2.25, lerp(6.9, 6.4, u), 0, 1.75, -0.5, 52); }
function trainPose(t, k) { RIDERS.forEach((p, i) => { strap(p, 1); mouth(p, k, t + i); sick(p, k * 0.9); }); }
function shot0(t) { // 0秒＝サムネ：満員電車のつり革の男たちが、0.45秒で一斉に口をおさえる
  reset(); lift(0); sway(t); const k = easeOut(clamp((t - TP) / 0.2)); trainPose(t, k);
  if (t > TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; UPS.forEach((l, i) => { const p = RIDERS[i]; say(l, t, TP + i * 0.06, p.position.x + (p.position.x > 0 ? 0.3 : -0.3), 1.95, p.position.z + 0.2, 0.45); }); }
  trainCam(ease(clamp(t / 3)));
  return S;
}
function benchPose(t) { BUCHO.position.set(BX, 0, 0.05); BUCHO.rotation.y = 0; poseSit(BUCHO); BUCHO.position.y += 0.06; BUCHO.rotation.x = 0.45; BUCHO.userData.head.rotation.x = 0.4; BUCHO.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); mouth(BUCHO, 1, t); BUCHO.rotation.x = 0.4; sick(BUCHO, 0.9); sweatB.userData.set(1, t); }
function sKinou(t) { // 昨日、つわりは病気じゃないだろ と言った部長。
  reset(); lift(150); BUCHO.position.set(BX, 0, 0.6); BUCHO.rotation.y = 0.2; BUCHO.userData.arms[1].rotation.set(-1.4, 0, 0.2); BUCHO.rotation.x = -0.08;
  say(kinou, t, 0.1, BX - 1.2, 2.6, 0.4, 0.7); say(byoki, t, 0.5, BX + 0.2, 2.35, 0.6, 2.1);
  hemi.intensity = 1.25; look(BX + 0.5, 1.8, 5.2, BX + 0.2, 1.5, 0.4, 50);
  return S;
}
function sBench(t) { // 駅のベンチで動けない。
  reset(); lift(150); benchPose(t);
  if (t > 0.8) say(ugokenai, t, 0.8, BX + 0.9, 2.1, 0.2, 0.95);
  const u = ease(clamp(t / 3)); look(BX + lerp(1.6, 1.0, u), 1.6, lerp(4.8, 4.2, u), BX, 1.0, 0, 50);
  return S;
}
function sFuman(t) { // 妻たちの不満から。
  reset(); lift(150); const W = WOMEN_A[0]; W.position.set(CX - 0.3, 0, -0.9); W.rotation.y = 0.3; OTTO.position.set(CX + 0.9, 0, -0.4); OTTO.rotation.y = -0.6; OTTO.userData.arms[1].rotation.set(-0.5, 0, 0.3); W.userData.arms[0].rotation.set(-0.6, 0, 0.5); W.userData.head.rotation.x = 0.2; W.rotation.x = 0.08;
  look(CX + 0.4, 1.8, 3.6, CX + 0.2, 1.4, -0.8, 50);
  return S;
}
function sKimochi(t) { // つらいと言っても、気の持ちようと言われてきた。
  reset(); lift(150); const W = WOMEN_A[0]; W.position.set(CX - 0.3, 0, -0.9); W.rotation.y = 0.3; W.rotation.x = 0.12; W.userData.head.rotation.x = 0.25; W.userData.arms[1].rotation.set(-2.5, 0, -0.4);
  OTTO.position.set(CX + 0.9, 0, -0.4); OTTO.rotation.y = -0.6; OTTO.userData.arms[1].rotation.set(-1.3, 0, 0.3);
  if (t > 0.6) say(kimochiLab, t, 0.6, CX + 0.6, 2.45, -0.4, 1.4);
  look(CX + 0.4, 1.8, 3.6, CX + 0.2, 1.4, -0.8, 50);
  return S;
}
const kimochiLab = label('気の持ちようだろ', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.8 }); S.add(kimochiLab); LABELS.push(kimochiLab);
function sDay1(t) { // 1日目。炊飯器を開けたとたん、
  reset(); lift(150); WOMEN_A.forEach(p => p.visible = false); OTTO.position.set(CX - 0.8, 0, -1.1); OTTO.rotation.y = Math.PI; OTTO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0));
  const k = easeOut(clamp((t - 0.5) / 0.4)); cooker.userData.lid.rotation.x = -1.6 * k;
  steam.forEach((m, i) => { m.visible = k > 0.5; const u = ((t * 0.7 + i * 0.2) % 1); m.position.set(CX - 0.8 + Math.sin(u * 5 + i) * 0.1, 1.3 + u * 1.0, -1.85); m.material.opacity = 0.5 * (1 - u); m.scale.setScalar(0.8 + u * 1.2); });
  if (t > 1.0) { OTTO_FACE.material.color.copy(OTTO_SKIN).lerp(GREEN_FACE, clamp((t - 1.0) / 0.5)); say(nioi, t, 1.0, CX - 0.2, 2.6, -1.6, 1.25); }
  setHud('1日目', '朝ごはん', 1);
  look(CX + 2.3, 2.2, 1.9, CX - 0.7, 1.2, -1.6, 50);
  return S;
}
function sToilet(t, d) { // 夫がトイレへ走る。
  reset(); lift(150); WOMEN_A.forEach(p => p.visible = false); cooker.userData.lid.rotation.x = -1.6; OTTO_FACE.material.color.copy(GREEN_FACE);
  const k = clamp(t / (d - 0.4)); OTTO.position.set(lerp(CX - 0.6, CX + 2.6, ease(k)), 0, lerp(-1.0, -1.8, k)); OTTO.rotation.y = Math.PI / 2 - 0.2; const ph = t * 12; OTTO.userData.legs[0].rotation.x = Math.sin(ph) * 0.8; OTTO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.8; OTTO.userData.arms[0].rotation.set(Math.sin(ph) * 0.8, 0, 0); mouth(OTTO, 1, t); OTTO.rotation.x = 0.2;
  setHud('1日目', '朝ごはん', 1);
  look(CX + 1.2, 2.0, 4.6, CX + 1.2, 1.3, -1.4, 50);
  return S;
}
function sDay3(t) { // 3日目。給湯室のコーヒーの匂いで、
  reset(); lift(150); KACHO.position.set(DX + 0.3, 0, -0.7); KACHO.rotation.y = Math.PI - 0.5; KACHO.userData.arms[0].rotation.set(-1.2, 0, 0);
  steam.forEach((m, i) => { m.visible = true; const u = ((t * 0.6 + i * 0.2) % 1); m.position.set(DX - 0.35 + Math.sin(u * 5 + i) * 0.08, 1.6 + u * 0.8, -1.4); m.material.opacity = 0.45 * (1 - u); m.scale.setScalar(0.6 + u); });
  if (t > 0.9) { mouth(KACHO, easeOut(clamp((t - 0.9) / 0.3)), t); sick(KACHO, clamp((t - 0.9) / 0.5)); say(cnioi, t, 0.9, DX + 0.6, 2.55, -1.0, 1.3); }
  setHud('3日目', '給湯室', 1);
  look(DX + 1.4, 1.9, 3.4, DX - 0.1, 1.4, -1.1, 50);
  return S;
}
function sSoutai(t, d) { // 課長が早退。
  reset(); lift(150); const k = clamp(t / (d - 0.3)); KACHO.position.set(lerp(DX + 0.3, DX + 3.2, ease(k)), 0, lerp(-0.7, 0.6, k)); KACHO.rotation.y = Math.PI / 2; const ph = t * 6; KACHO.userData.legs[0].rotation.x = Math.sin(ph) * 0.35; KACHO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.35; mouth(KACHO, 1, t); sick(KACHO, 0.9); KACHO.rotation.x = 0.15;
  bag.visible = true; bag.position.set(KACHO.position.x, 0.75, KACHO.position.z - 0.35);
  say(soutai, t, 0.3, DX + 1.0, 2.5, -0.6, 0.75);
  setHud('3日目', '給湯室', 1);
  look(DX + 1.2, 2.0, 4.6, DX + 1.2, 1.3, -0.6, 50);
  return S;
}
function meetCam(u = 0) { look(EX + 4.8 - u * 0.3, 2.9, 0.2 + u * 0.4, EX, 0.95, -0.6, 50); }
function umeAll(t, men = true) { MEN.forEach((p, i) => { if (!men) return; p.userData.arms[1].rotation.set(-2.2, 0, -0.35); p.userData.head.rotation.x = 0.15; sick(p, 0.6); const u = UME[i]; u.visible = true; const hp = new THREE.Vector3(0.04, 1.7, 0.24); p.localToWorld(hp); u.position.copy(hp); }); }
function sWeek(t) { // 1週間後。会議は全員、梅干しをなめながら。
  reset(); lift(150); MEN.forEach(p => p.updateMatrixWorld()); umeAll(t); MR.userData.board.set(['定例会議']);
  if (t > 0.8) say(umeLab, t, 0.8, EX - 0.4, 2.3, -0.6, 0.8);
  setHud('1週間後', '会議', 1); meetCam(ease(clamp(t / 3)));
  return S;
}
function sTsuma(t) { // その横で妻は、同じ梅干しをかじりながら普通に働いている。
  reset(); lift(150); MEN.forEach(p => p.updateMatrixWorld()); umeAll(t);
  TSUMA.userData.arms[0].rotation.set(-1.1, 0, 0); TSUMA.userData.arms[1].rotation.set(-1.0 - Math.abs(Math.sin(t * 5)) * 0.3, 0, 0); TSUMA.updateMatrixWorld(); { const hp = new THREE.Vector3(0.04, 1.7, 0.24); TSUMA.localToWorld(hp); UME[5].visible = true; UME[5].position.copy(hp); }
  if (t > 0.9) say(futsu, t, 0.9, TSUMA.position.x, 2.45, TSUMA.position.z, 1.25);
  const s = MSEATS[5]; look(EX + s.x - 1.6, 2.0, s.z - 2.8, EX + s.x, 1.1, s.z, 50);
  return S;
}
function sShiru(t) { // 男たちは知る。これが、1日では終わらない。
  reset(); lift(150); MEN.forEach(p => p.updateMatrixWorld()); umeAll(t); MEN.forEach((p, i) => { p.userData.head.rotation.x = 0.35; sweats[i].userData.set(1, t + i); });
  MR.userData.board.set(['つわり', '明日も続く'], { color: '#c8283a' });
  if (t > 0.6) say(owaranai, t, 0.6, EX + 0.6, 3.1, -3.0, 1.8);
  look(EX + 3.6, 2.5, 0.4, EX + 0.3, 1.6, -1.6, 50);
  return S;
}
function sHappyo(t) { // 会社は、つわりの休みを病気の休みと同じ扱いにすると発表。
  reset(); lift(150); MEN.forEach(p => p.updateMatrixWorld()); umeAll(t);
  MR.userData.board.set(['つわりの休み', '＝ 病気の休み'], { color: '#1a6a3a' }); if (t > 0.3 && t < 0.4) el.flash.style.opacity = 0.25;
  look(EX + 0.6, 2.3, 2.4, EX + 0.6, 2.0, -3.0, 50);
  return S;
}
function sAtta(t) { // 妻は言う。それ、私のときにあったらよかった。
  reset(); lift(150); MEN.forEach(p => p.updateMatrixWorld()); umeAll(t); MR.userData.board.set(['つわりの休み', '＝ 病気の休み'], { color: '#1a6a3a' });
  TSUMA.userData.head.rotation.y = -0.5; TSUMA.userData.arms[0].rotation.set(-1.1, 0, 0);
  if (t > 0.5) say(atta, t, 0.5, TSUMA.position.x - 0.2, 2.5, TSUMA.position.z, 2.3);
  const s = MSEATS[5]; look(EX + s.x - 1.2, 2.1, s.z - 3.2, EX + s.x - 0.4, 1.4, s.z, 50);
  return S;
}
function sKekka(t, d) { // 結果：つわりは病気じゃないと言っていた男ほど、真っ先に寝込んだ。
  reset(); lift(150); FUTON.forEach((p, i) => { sick(p, 0.8); p.userData.head.rotation.y = Math.sin(t * 1.3 + i) * 0.2; });
  if (t > 1.2) pop(nekomu, t, 1.2, 0.3, 2.0);
  const u = ease(clamp(t / d)); look(FX + lerp(0.5, 0, u), lerp(4.2, 5.0, u), lerp(4.4, 5.4, u), FX, 0.3, -1.0, 50);
  return S;
}
function sTokku(t, d) { // 気の持ちようで治るなら、男たちはとっくに出社していた
  reset(); lift(150); G_WOMAN.userData.arms.forEach(a => a.rotation.set(-1.2 + Math.sin(t * 9) * 0.05, 0, 0));
  if (t > 1.0) pop(kuuseki, t, 1.0, 0.3, 1.7);
  const u = ease(clamp(t / d)); look(GX + lerp(1.8, 1.2, u), 2.6, lerp(4.6, 4.0, u), GX, 1.0, -0.8, 50);
  return S;
}
function sKamo(t, d) { // のかもしれない…ではなく、ひと言の余韻（同じオフィス）
  reset(); lift(150); G_WOMAN.userData.arms.forEach(a => a.rotation.set(-1.2 + Math.sin(t * 9) * 0.05, 0, 0)); kuuseki.visible = true; kuuseki.userData.size(1.7);
  const u = ease(clamp(t / d)); look(GX + lerp(1.2, 0.6, u), lerp(2.6, 3.2, u), lerp(4.0, 5.2, u), GX, 1.0, -0.8, 50);
  return S;
}
function sAsk(t) { // つわりのとき、休みは取りやすかった？（冒頭と同じ構図）
  reset(); lift(0); sway(t); trainPose(t, 1); trainCam(0);
  return S;
}

const NARR = { '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '1日では': 'いちにちでは', '部長': 'ぶちょう', '課長': 'かちょう', '早退': 'そうたい', '給湯室': 'きゅうとうしつ', '炊飯器': 'すいはんき', '梅干し': 'うめぼし', '気の持ちよう': 'きのもちよう', '結果：': '結果、', '真っ先に': 'まっさきに', '寝込んだ': 'ねこんだ', '出社': 'しゅっしゃ', '匂い': 'におい', '扱い': 'あつかい', '妻': 'つま' };
const P = planTimes([
  ['昨日、つわりは病気<br>じゃないだろ と言った部長。', sKinou],
  ['駅のベンチで動けない。', sBench],
  ['妻たちの不満から。', sFuman],
  ['つらいと言っても、<br>気の持ちようと言われてきた。', sKimochi],
  ['1日目。炊飯器を<br>開けたとたん、', sDay1],
  ['夫がトイレへ走る。', sToilet],
  ['3日目。給湯室の<br>コーヒーの匂いで、', sDay3],
  ['課長が早退。', sSoutai],
  ['1週間後。会議は全員、<br>梅干しをなめながら。', sWeek],
  ['その横で妻は、同じ梅干しを<br>かじりながら普通に働いている。', sTsuma],
  ['男たちは知る。これが、<br>1日では終わらない。', sShiru],
  ['会社は、つわりの休みを<br>病気の休みと同じ扱いに', sHappyo],
  ['すると発表。', sHappyo],
  ['妻は言う。それ、私の<br>ときにあったらよかった。', sAtta],
  ['結果：つわりは病気じゃないと<br>言っていた男ほど、', sKekka],
  ['真っ先に寝込んだ。', (t, d) => sKekka(t + 2.5, d + 2.5)],
  ['気の持ちようで治るなら、<br>男たちはとっくに', sTokku],
  ['出社していた。', sKamo],
  ['つわりのとき、<br>休みは取りやすかった？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0663',
    v2: true,
    tt: 'main',
    hookLine: '満員電車のつり革の男たちが、一斉に口をおさえる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも男にもつわりが来たら？',
    titleHtml: 'もしも男にも<br>つわりが<br>来たら？',
    mood: 'tension', seed: 663, hits: [TP, P.at(14), P.at(16)], risers: [P.at(10)], impacts: [P.at(4, 1.0), P.at(7, 0.3), P.at(11, 0.3), P.at(15, 0.1)],
    sfx: [[TP, 'poof'], [P.at(1, 0.8), 'buzz'], [P.at(4, 0.5), 'whoosh'], [P.at(5, 0.1), 'whoosh'], [P.at(6, 0.9), 'buzz'], [P.at(7, 0.3), 'alarm'], [P.at(8, 0.8), 'bubble'], [P.at(10, 0.6), 'meter', 0.4], [P.at(11, 0.3), 'alarm'], [P.at(15, 0.1), 'poof']],
    narr: NARR,
    ask: 'つわりのとき、休みは取りやすかった？',
    caption: 'もしも男にもつわりが来たら？\n\n昨日、つわりは病気じゃないだろと言った部長。駅のベンチで動けない。\n妻たちの不満から。つらいと言っても、気の持ちようと言われてきた。\n1日目。炊飯器を開けたとたん、夫がトイレへ走る。\n3日目。給湯室のコーヒーの匂いで、課長が早退。\n1週間後。会議は全員、梅干しをなめながら。その横で妻は、同じ梅干しをかじりながら普通に働いている。\n男たちは知る。これが、1日では終わらない。\n会社は、つわりの休みを病気の休みと同じ扱いにすると発表。\n妻は言う。それ、私のときにあったらよかった。\n\n結果：つわりは病気じゃないと言っていた男ほど、真っ先に寝込んだ。\n気の持ちようで治るなら、男たちはとっくに出社していた。\n\nつわりのとき、休みは取りやすかった？ コメントで教えて。\n\n※風刺ネタです。男にもつわりが来るのは、もしもの設定です。登場する人物・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', 'つわり', '妊娠', '男と女'],
    endStats: [['男にも来たもの', 'つわり', 'もしもの設定'], ['真っ先に寝込んだのは', '病気じゃないと言った男', 'もしもの結果'], ['会社の発表', 'つわりの休み＝病気の休み', '1週間で']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
