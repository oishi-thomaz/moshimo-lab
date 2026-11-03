import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, mat, box, makeQ } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, hudTime, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';

// もしも夫の育休に家事のノルマがあったら？（皮肉回・台本 S17・図星）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・はてなで燃える 取るだけ育休（育休中にゲームと昼寝の夫）の話
// 数字（裏取り済み）：育児休業の取得率 男性 50.9%（前回 40.5% から10.4ポイント上昇。調査の系列で最も高い）・女性 88.3%
//  厚生労働省「令和7年度 雇用均等基本調査」（2026年7月31日公表。2023年10月〜2024年9月に本人か配偶者が出産した人のうち、2025年10月1日までに育休を始めた人の割合）
//  https://www.mhlw.go.jp/toukei/list/dl/71-r07/02.pdf
//  ※台本の数字（男性 40.5%・女性 86.6%）は令和6年度の調査。新しい調査が出ていたので最新の数字に差し替えた（男性の 過去最高 は最新の数字でないと事実と違うため）

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff', PINK = '#ff7ab8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2436'); S.fog = new THREE.Fog(0x2a2436, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff4e6, 0x3a3040, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#1e1a28', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); }
function sit(p, y = -0.4) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = y; }
function makeBaby() { const g = new THREE.Group(); const b = box(0.34, 0.5, 0.28, mat('#fff3c0')); g.add(b); const h = box(0.26, 0.26, 0.24, mat('#f5d3b5')); h.position.y = 0.36; g.add(h); for (const s of [-1, 1]) { const e = box(0.04, 0.05, 0.02, mat('#121212')); e.position.set(s * 0.06, 0.38, 0.125); g.add(e); } return g; }

// ---------- A：リビング（原点） ----------
const room = makeRoom({ w: 11, d: 8, wall: '#efe6d8', floor: '#b48a5e' }); room.userData.rw.visible = false; S.add(room);
const sofa = new THREE.Group(); { const b = box(3.0, 0.5, 1.1, mat('#5a6b8a')); b.position.y = 0.4; sofa.add(b); const bk = box(3.0, 0.55, 0.3, mat('#4f5f7c')); bk.position.set(0, 0.85, -0.45); sofa.add(bk); for (const s of [-1, 1]) { const ar = box(0.3, 0.75, 1.1, mat('#4f5f7c')); ar.position.set(s * 1.5, 0.55, 0); sofa.add(ar); } } sofa.position.set(0, 0, 0.6); sofa.rotation.y = Math.PI; S.add(sofa);
const tvStand = box(2.4, 0.5, 0.6, mat('#3a3030')); tvStand.position.set(0, 0.25, -1.6); S.add(tvStand);
const tv = box(2.2, 1.3, 0.1, mat('#15161c')); tv.position.set(0, 1.25, -1.65); S.add(tv);
const scrC = document.createElement('canvas'); scrC.width = 256; scrC.height = 150; { const g = scrC.getContext('2d'); const gr = g.createLinearGradient(0, 0, 256, 150); gr.addColorStop(0, '#3a6ad0'); gr.addColorStop(1, '#8a3ad0'); g.fillStyle = gr; g.fillRect(0, 0, 256, 150); g.fillStyle = '#ffd23a'; for (let i = 0; i < 6; i++) g.fillRect(20 + i * 38, 100 - (i % 3) * 20, 22, 22); g.fillStyle = '#fff'; g.font = '900 30px sans-serif'; g.fillText('LV 99', 150, 36); }
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace;
const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.18), new THREE.MeshBasicMaterial({ map: scrT })); scr.position.set(0, 1.25, -1.59); S.add(scr);
const tvGlow = new THREE.PointLight(0x8a7aff, 6, 6, 1.6); tvGlow.position.set(0, 1.4, -0.9); S.add(tvGlow);
const HUS = makeMan({ shirt: '#8a9aa8', hair: '#1d1a19' }); S.add(HUS);
const pad = box(0.34, 0.08, 0.18, mat('#202228')); S.add(pad);
const NORMA = makeDoc({ title: '育休ノルマ', rows: ['ミルク', '夜泣き', '洗濯', '離乳食'], head: '#c8242c', w: 1.5, h: 1.85 }); S.add(NORMA);
const WIFE = makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }); S.add(WIFE);
const BABY = makeBaby(); S.add(BABY);
const WIVES = [makeWoman({ shirt: '#f2b8a0', hair: '#2a1e1a' }), makeWoman({ shirt: '#a8d0b0', hair: '#5a3a28' })]; WIVES.forEach(w => S.add(w));
const zzz = label('Zzz…', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,110,.92)', sx: 0.9 }); S.add(zzz);
const fuman = label('寝てるだけ', { w: 768, size: 120, color: '#fff', bg: 'rgba(200,60,90,.95)', sx: 1.5 }); S.add(fuman);
const HK = makeHanko(); HK.scale.setScalar(0.6); S.add(HK);
const TORI = makeMark('取消', { sx: 0.9 }); S.add(TORI);
const CHECKS = [0, 1, 2, 3].map(() => { const c = label('□', { w: 192, h: 192, size: 150, color: '#c8242c', sx: 0.22 }); S.add(c); return c; });
// キッチン（左奥）
const counter = box(2.4, 0.95, 0.7, mat('#d6dbe4')); counter.position.set(-3.6, 0.47, -3.2); S.add(counter);
const bottle = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 12), mat('#f4f4f8')); bottle.add(b); const n = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 10), mat('#f0c890')); n.position.y = 0.17; bottle.add(n); } bottle.position.set(-3.4, 1.08, -3.1); S.add(bottle);
const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 14), mat('#f0d070')); can.position.set(-3.9, 1.07, -3.1); S.add(can);
const QS = [0, 1, 2].map(() => { const q = makeQ(); S.add(q); return q; });
const laundry = []; for (let i = 0; i < 9; i++) { const l = box(0.5, 0.08, 0.36, mat(['#9fc7e8', '#ffffff', '#f2c14e', '#c9a8d8', '#9fdcae'][i % 5])); S.add(l); laundry.push(l); }
const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.12, 16), mat('#ffb060')); S.add(bowl);
const sentaku = label('洗濯物', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,110,200,.92)', sx: 1.0 }); S.add(sentaku);
const rinyu = label('離乳食', { w: 512, size: 110, color: '#fff', bg: 'rgba(220,120,40,.92)', sx: 1.0 }); S.add(rinyu);
const door = box(1.2, 2.3, 0.1, mat('#7a5a3a')); door.position.set(-4.2, 1.15, 1.6); door.rotation.y = Math.PI / 2; S.add(door);
const bag = box(0.44, 0.32, 0.12, mat('#2a2a30')); S.add(bag);
const modoru = label('会社に戻りたい…', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 1.9 }); S.add(modoru);
const mainichi = label('それ、毎日やってる', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,60,120,.95)', sx: 2.0 }); S.add(mainichi);
const hataraki = label('働いていた', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(hataraki);
const sparks = makeSparkles(160, 0.18, 0xffd27a); S.add(sparks.points); sparks.init([[0, 2.0, -0.4]], 2.0, 1.6);

// ---------- B：取得率のバー（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, 0); bfloor.renderOrder = -0.8; S.add(bfloor);
const barM = box(1.4, 1, 1.2, mat('#7fb0e8')); barM.geometry.translate(0, 0.5, 0); barM.position.set(BX - 1.3, 0, 0); S.add(barM);
const barF = box(1.4, 1, 1.2, mat('#ff8ab0')); barF.geometry.translate(0, 0.5, 0); barF.position.set(BX + 1.3, 0, 0); S.add(barF);
const lbM = label('男性', { size: 120, color: '#fff', bg: 'rgba(40,40,50,.85)', sx: 0.9 }); lbM.position.set(BX - 1.3, -0.25, 1.0); S.add(lbM);
const lbF = label('女性', { size: 120, color: '#fff', bg: 'rgba(40,40,50,.85)', sx: 0.9 }); lbF.position.set(BX + 1.3, -0.25, 1.0); S.add(lbF);
const vM = label('50.9%', { w: 768, size: 120, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.5 }); S.add(vM);
const vF = label('88.3%', { w: 768, size: 120, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.5 }); S.add(vF);
const saiko = label('過去最高', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(saiko);

// ---------- C：夜の寝室（x=110） ----------
const CX = 110;
const bed = makeRoom({ w: 8, d: 7, wall: '#3a3a5a', floor: '#5a4a3a' }); bed.position.set(CX, 0, 0); bed.userData.rw.visible = false; S.add(bed);
const futon = box(2.2, 0.3, 2.6, mat('#e8e8f0')); futon.position.set(CX - 0.6, 0.15, -1.0); S.add(futon);
const crib = new THREE.Group(); { const b = box(1.3, 0.1, 0.8, mat('#f0e0c0')); b.position.y = 0.6; crib.add(b); for (let i = 0; i < 7; i++) for (const z of [-0.4, 0.4]) { const s = box(0.05, 0.7, 0.05, mat('#e0c8a0')); s.position.set(-0.6 + i * 0.2, 0.75, z); crib.add(s); } } crib.position.set(CX + 1.6, 0, -1.6); S.add(crib);
const cribBaby = makeBaby(); cribBaby.rotation.x = -Math.PI / 2; cribBaby.position.set(CX + 1.6, 0.8, -1.6); S.add(cribBaby);
const clock = label('2:00', { w: 512, h: 192, size: 150, color: '#ff8a7a', bg: 'rgba(20,20,30,.92)', sx: 1.2 }); clock.position.set(CX - 0.4, 2.7, -3.3); S.add(clock);
const gyaa = label('オギャー', { w: 512, size: 120, color: '#fff', bg: 'rgba(230,80,80,.92)', sx: 1.1 }); S.add(gyaa);
const HUS2 = makeMan({ shirt: '#8a9aa8', hair: '#1d1a19' }); S.add(HUS2);
const lamp = new THREE.PointLight(0xffc98a, 8, 6, 1.6); lamp.position.set(CX + 0.8, 2.2, -0.6); S.add(lamp);

// ---------- D：会社（x=160） ----------
const DX = 160;
const office = makeRoom({ w: 9, d: 7, wall: '#e6e9ed', floor: '#7d8798' }); office.position.set(DX, 0, 0); office.userData.rw.visible = false; S.add(office);
const odesk = box(3.0, 0.75, 0.9, mat('#d8d2c6')); odesk.position.set(DX, 0.37, -1.6); S.add(odesk);
const MEN = [makeMan({ shirt: '#ffffff', hair: '#2a2421' }), makeMan({ shirt: '#e9e4da', hair: '#4a3426', bald: true })]; MEN.forEach(m => { const tie = box(0.08, 0.38, 0.02, mat('#2f4a7a')); tie.position.set(0, 1.24, 0.15); m.add(tie); S.add(m); });
const iina = label('育休、休めていいなあ', { w: 1024, size: 96, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 2.2 }); S.add(iina);
const yasumi = label('休み？', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 1.0 }); S.add(yasumi);

const PEOPLE = [HUS, WIFE, ...WIVES, HUS2, ...MEN];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  HUS.position.set(0.1, 0, 0.75); HUS.rotation.y = Math.PI; sit(HUS, -0.28); HUS.userData.arms.forEach(a => a.rotation.x = -1.1); HUS.userData.head.rotation.x = 0.05;
  pad.visible = true; pad.position.set(0.1, 0.92, 0.25); pad.rotation.set(0.4, 0, 0);
  WIFE.visible = false; BABY.visible = false; WIVES.forEach(w => w.visible = false); zzz.visible = fuman.visible = false;
  NORMA.visible = false; NORMA.rotation.set(0, 0, 0); HK.visible = false; TORI.visible = false; CHECKS.forEach(c => { c.visible = false; c.userData.set('□'); });
  QS.forEach(q => q.visible = false); laundry.forEach(l => l.visible = false); bowl.visible = false; sentaku.visible = rinyu.visible = false;
  bag.visible = false; modoru.visible = mainichi.visible = hataraki.visible = false; sparks.set(0);
  barM.scale.y = barF.scale.y = 0.001; vM.visible = vF.visible = saiko.visible = false;
  gyaa.visible = false; HUS2.position.set(CX - 0.6, 0, -1.0); iina.visible = yasumi.visible = false;
  MEN.forEach((m, i) => { m.position.set(DX - 0.8 + i * 1.6, 0, -0.8); m.rotation.y = i ? -0.5 : 0.5; });
  hemi.intensity = 1.15; S.background.set('#2a2436'); tvGlow.intensity = 6; el.flash.style.opacity = 0; setHud('', '', 0);
}
// 育休ノルマの紙：TVの画面に貼る
const NPOS = [0, 1.25, -1.52];
function normaOn(k = 1) { NORMA.visible = true; NORMA.position.set(NPOS[0], NPOS[1] + (1 - k) * 2.2, NPOS[2] + (1 - k) * 1.5); NORMA.rotation.z = (1 - k) * 0.6; NORMA.scale.setScalar(1 + (1 - k) * 0.4); }
function setChecks(arr) { CHECKS.forEach((c, i) => { c.visible = true; c.userData.set(arr[i] ? '☑' : '□'); c.position.set(0.55, 1.62 - i * 0.3 + 0.0, -1.45); c.position.y = 1.25 + 0.36 - i * 0.355; }); }
const TP = 0.45;
function livingCam(d = 0) { look(lerp(1.3, 1.15, d), 2.2, lerp(3.4, 3.1, d), -0.1, 1.42, -1.4, 52); }
function frontCam(d = 0) { look(lerp(3.5, 3.2, d), 2.7, lerp(-2.0, -1.7, d), -0.1, 0.85, 0.3, 52); }
function shot0(t) { // 0秒＝サムネ：ソファでゲームをする夫の前に、育休ノルマの紙がバン
  reset(); lift(0); const k = clamp((t - (TP - 0.25)) / 0.25);
  HUS.userData.arms.forEach(a => a.rotation.x = -1.1 + Math.sin(t * 14) * 0.05);
  if (t >= TP - 0.25) normaOn(easeOut(k));
  if (t > TP) { HUS.userData.head.rotation.x = -0.12; HUS.position.y = -0.4 + Math.max(0, 0.08 * Math.sin((t - TP) * 18) * Math.exp(-(t - TP) * 5)); }
  el.flash.style.opacity = t > TP && t < TP + 0.12 ? 0.35 : 0;
  livingCam(ease(clamp(t / 2.7)));
  return S;
}
function shot1(t) { // 妻たちの不満から生まれたルール
  reset(); lift(60); pad.visible = false; HUS.visible = false;
  [WIFE, ...WIVES].forEach((w, i) => { w.visible = true; w.position.set(-1.2 + i * 1.2, 0, -1.4); w.rotation.y = 0; w.userData.arms[0].rotation.set(-1.2, 0, 0.6); w.userData.arms[1].rotation.set(-1.2, 0, -0.6); w.userData.head.rotation.z = Math.sin(t * 2 + i) * 0.08; });
  fuman.position.set(0, 2.45, -1.3); pop(fuman, t, 0.5, 0.3, 1.4);
  look(0.0, 2.2, 3.6, 0.0, 1.5, -1.4, 52);
  return S;
}
function shot2(t) { // 育休中に寝てるだけの夫が多すぎる
  reset(); lift(60); pad.visible = false; HUS.rotation.set(0, Math.PI, -Math.PI / 2); HUS.position.set(0.95, 0.86, 0.6); HUS.userData.legs.forEach(l => l.rotation.x = 0);
  zzz.position.set(-0.4, 1.75, 0.4); pop(zzz, t, 0.3, 0.3, 0.9); zzz.position.y += Math.sin(t * 2) * 0.05;
  WIFE.visible = true; BABY.visible = true; WIFE.position.set(-1.9, 0, -0.5); WIFE.rotation.y = 0.9; WIFE.userData.arms.forEach(a => a.rotation.x = -1.2); BABY.position.set(-1.65, 1.05, -0.32); BABY.rotation.y = 0.9; WIFE.position.y = Math.abs(Math.sin(t * 4)) * 0.04;
  frontCam(clamp(t / 3));
  return S;
}
function docCam() { look(0.3, 1.5, 1.6, 0.05, 1.3, -1.5, 50); }
function shot3(t) { // 夫の育休に、家事と育児のノルマが付いた
  reset(); lift(0); HUS.visible = pad.visible = false; normaOn(1); setChecks([0, 0, 0, 0]); CHECKS.forEach((c, i) => c.visible = t > 0.3 + i * 0.25);
  docCam();
  setTop('新しいルール', '家事と育児のノルマ', fade(t, 0.15, 3.0, 0.25), GOLD);
  return S;
}
function shot4(t) { // できなければ、育休は取り消し
  reset(); lift(0); HUS.visible = pad.visible = false; normaOn(1); setChecks([0, 0, 0, 0]); HK.visible = t > 0.2 && t < 1.8;
  const hit = hankoSlam(HK, [0.1, 1.15, -1.2], t, 0.8, { from: 1.0, up: 1.0 }); HK.rotation.x = Math.PI / 2; HK.position.z = -1.2 + (HK.position.y - 1.15); HK.position.y = 1.15;
  if (hit) { TORI.visible = true; TORI.position.set(0.1, 1.15, -1.3); TORI.userData.size(0.75 * (t < 1.0 ? 1.3 - (t - 0.8) * 1.5 : 1)); }
  el.flash.style.opacity = t > 0.8 && t < 0.92 ? 0.3 : 0;
  docCam();
  return S;
}
function bars(t, showF) {
  const H = 0.048, u = easeOut(clamp((t - 0.2) / 1.2)); barM.scale.y = Math.max(0.001, 50.9 * H * (showF ? 1 : u)); vM.visible = true; vM.position.set(BX - 1.3, barM.scale.y + 0.45, 0.6);
  if (showF) { barF.scale.y = Math.max(0.001, 88.3 * H * u); vF.visible = t > 0.6; vF.position.set(BX + 1.3, barF.scale.y + 0.45, 0.6); }
  look(BX, 3.2, 9.6, BX, 2.6, 0, 52);
}
function shot5(t) { // 男性の育休の取得率は50.9%。過去最高
  reset(); lift(150); bars(t, false); saiko.position.set(BX - 1.3, barM.scale.y + 1.25, 0.6); pop(saiko, t, 1.6, 0.3, 1.1);
  setTop('男性の育休取得率（2025年度調査）', '50.9%', fade(t, 0.15, 3.6, 0.25), BLUE);
  return S;
}
function shot6(t) { // ところが初日、夫はミルクの作り方を知らない
  reset(); lift(60); pad.visible = false; poseReset(HUS); HUS.position.set(-3.5, 0, -2.2); HUS.rotation.y = Math.PI - 0.7; HUS.userData.arms[1].rotation.x = -0.9; HUS.userData.head.rotation.y = Math.sin(t * 2.5) * 0.5;
  QS.forEach((q, i) => { q.position.set(-3.9 + i * 0.4, 2.35 + (i % 2) * 0.2 + Math.sin(t * 3 + i) * 0.04, -2.1); q.visible = t > 0.6 + i * 0.35; });
  hudTime('1日目', fade(t, 0.1, 3.6, 0.2));
  look(-2.0, 2.1, 0.8, -3.6, 1.5, -2.6, 52);
  return S;
}
function shot7(t) { // 夜中の2時、3時、5時。泣き声のたびに起きる
  reset(); lift(60); S.background.set('#0e0c18'); hemi.intensity = 0.55;
  const ph = t < 1.3 ? 0 : t < 2.6 ? 1 : 2; clock.userData.set(['2:00', '3:00', '5:00'][ph]);
  const local = t - [0, 1.3, 2.6][ph];
  HUS2.rotation.set(0, 0, 0); HUS2.position.set(CX - 0.6, 0.3, -1.0); HUS2.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); HUS2.position.y = -0.55; HUS2.rotation.x = -lerp(1.3, 0, easeOut(clamp(local / 0.35)));
  gyaa.position.set(CX + 1.2, 1.85, -1.4); gyaa.visible = local < 0.8; gyaa.userData.size(1.1);
  look(CX + 0.4, 2.6, 4.0, CX + 0.4, 1.1, -1.3, 52);
  return S;
}
function shot8(t) { // 昼寝しようとすると、洗濯物と離乳食が待っている
  reset(); lift(60); pad.visible = false; HUS.rotation.set(0, Math.PI, -Math.PI / 2); HUS.position.set(0.95, 0.86, 0.6); HUS.userData.legs.forEach(l => l.rotation.x = 0);
  if (t > 1.2) { HUS.rotation.set(0, Math.PI, 0); HUS.position.set(0.1, -0.4, 0.75); sit(HUS); HUS.userData.head.rotation.x = 0.2; }
  const n = Math.floor(clamp((t - 1.3) / 1.0) * laundry.length); laundry.forEach((l, i) => { l.visible = i < n; l.position.set(-0.7 + (i % 3) * 0.12, 0.05 + i * 0.09, -0.4); l.rotation.y = i * 0.4; });
  bowl.visible = t > 2.2; bowl.position.set(0.6, 0.06, -0.4);
  sentaku.position.set(-0.45, 1.6, -0.4); pop(sentaku, t, 1.6, 0.25, 0.9); rinyu.position.set(0.7, 1.15, -0.4); pop(rinyu, t, 2.3, 0.25, 0.9);
  frontCam(0.5);
  return S;
}
function shot9(t) { // 3日目、夫は会社に戻りたいと言い出す
  reset(); lift(60); pad.visible = false; poseReset(HUS); HUS.position.set(-3.2, 0, 1.6); HUS.rotation.y = -Math.PI / 2 + 0.6; HUS.userData.head.rotation.x = 0.3; HUS.userData.arms[1].rotation.x = -0.2;
  bag.visible = true; bag.position.set(-3.2 + 0.0, 0.55, 1.6 + 0.0); bag.position.x += Math.sin(HUS.rotation.y + Math.PI / 2) * 0.33; bag.position.z += Math.cos(HUS.rotation.y + Math.PI / 2) * 0.33;
  modoru.position.set(-2.3, 2.45, 1.6); pop(modoru, t, 0.8, 0.3, 1.6);
  hudTime('3日目', fade(t, 0.1, 3.6, 0.2));
  look(0.2, 2.2, 4.6, -2.7, 1.5, 1.2, 52);
  return S;
}
function wifeCam() { look(0.9, 2.0, 2.0, 0.3, 1.55, -1.0, 52); }
function shot10(t) { // 妻は言う。それ、私は毎日やってるけど
  reset(); lift(0); pad.visible = false; HUS.position.set(-0.6, -0.4, 0.75); HUS.userData.head.rotation.y = -0.4;
  WIFE.visible = true; BABY.visible = true; WIFE.position.set(0.7, 0, -0.8); WIFE.rotation.y = -0.3; WIFE.userData.arms.forEach(a => a.rotation.x = -1.2); BABY.position.set(0.55, 1.05, -0.5); BABY.rotation.y = -0.3;
  mainichi.position.set(0.35, 2.25, -0.8); pop(mainichi, t, 0.6, 0.3, 1.3);
  wifeCam();
  return S;
}
function shot11(t) { // 女性の育休の取得率は88.3%
  reset(); lift(150); bars(t, true);
  setTop('女性の育休取得率（2025年度調査）', '88.3%', fade(t, 0.15, 3.0, 0.25), PINK);
  return S;
}
function shot12(t) { // 休んでいたんじゃない、働いていた
  reset(); lift(0); pad.visible = false; HUS.visible = false; WIFE.visible = true; BABY.visible = true; WIFE.position.set(0.3, 0, -0.8); WIFE.rotation.y = 0;
  WIFE.userData.arms.forEach((a, i) => a.rotation.x = -1.0 + Math.sin(t * 9 + i * 3) * 0.5); BABY.position.set(0.3, 1.05, -0.5);
  laundry.forEach((l, i) => { l.visible = i < 6; l.position.set(-0.9 + (i % 2) * 0.1, 0.05 + i * 0.09, -0.7); });
  bowl.visible = true; bowl.position.set(1.3, 0.1, -0.6);
  hataraki.position.set(0.3, 2.25, -0.8); pop(hataraki, t, 0.4, 0.3, 1.2); sparks.set(clamp((t - 0.4) / 2.6));
  look(0.4, 2.0, 2.3, 0.3, 1.45, -1.0, 52);
  return S;
}
function shot13(t) { // 結果：育休は休みじゃなかった
  reset(); lift(0); pad.visible = false; normaOn(1); setChecks([1, 1, 1, 1]); hemi.intensity = 0.95; tvGlow.intensity = 0;
  HUS.position.set(0.1, -0.4, 0.75); HUS.userData.head.rotation.x = 0.35; HUS.userData.arms.forEach(a => a.rotation.x = 0.1);
  const u = ease(clamp(t / 6.0)); look(lerp(1.15, 1.7, u), lerp(2.2, 2.7, u), lerp(3.1, 4.6, u), -0.1, 1.42, -1.4, 52);
  setTop('結果', '育休は仕事だった', fade(t, 0.15, 6.2, 0.25), RED);
  return S;
}
function shot14(t) { // 休みだと思っていたのは、本気で取ったことがない人だけ
  reset(); lift(60); S.background.set('#22242e');
  MEN.forEach((m, i) => { m.userData.head.rotation.z = Math.sin(t * 6 + i) * 0.08; m.userData.arms[i].rotation.x = -0.6; });
  iina.position.set(DX, 2.55, -0.7); pop(iina, t, 0.4, 0.3, 2.2);
  yasumi.position.set(DX, 1.95, -0.6); pop(yasumi, t, 3.2, 0.25, 0.8);
  look(DX, 2.2, 4.4, DX, 1.7, -1.0, 52);
  return S;
}
function shot15(t) { // 質問。最後は冒頭と同じ構図（ノルマは全部済み）
  reset(); lift(0); normaOn(1); setChecks([1, 1, 1, 1]); HUS.userData.head.rotation.x = -0.12;
  livingCam(0);
  return S;
}

const SUBS = [
  [3.1, 5.4, '妻たちの不満から<br>生まれたルール。'],
  [5.5, 8.2, '育休中に寝てるだけの<br>夫が多すぎる。'],
  [8.3, 11.9, '夫の育休に、家事と<br>育児のノルマが付いた。'],
  [12.0, 14.8, 'できなければ、<br>育休は取り消し。'],
  [14.9, 19.6, '男性の育休の取得率は<br>50.9%。過去最高。'],
  [19.7, 23.1, 'ところが初日、夫は<br>ミルクの作り方を知らない。'],
  [23.2, 27.8, '夜中の2時、3時、5時。<br>泣き声のたびに起きる。'],
  [27.9, 31.9, '昼寝しようとすると、洗濯物と<br>離乳食が待っている。'],
  [32.0, 35.3, '3日目、夫は<br>会社に戻りたいと言い出す。'],
  [35.4, 39.0, '妻は言う。<br>それ、私は毎日やってるけど。'],
  [39.1, 42.7, '女性の育休の<br>取得率は88.3%。'],
  [42.8, 45.6, '休んでいたんじゃない、<br>働いていた。'],
  [45.7, 49.5, '結果：育休は<br>休みじゃなかった。'],
  [49.6, 52.1, '取ってみて初めて<br>分かる仕事だった。'],
  [52.2, 54.0, '休みだと思っていたのは、'],
  [54.1, 57.1, '本気で取ったことがない<br>人だけだったのかもしれない。'],
  [57.2, 61.9, '夫の育休、ノルマは<br>要る？要らない？'],
];
const shots = [
  { a: 0.0, b: 3.1, f: shot0 }, { a: 3.1, b: 5.5, f: shot1 }, { a: 5.5, b: 8.3, f: shot2 }, { a: 8.3, b: 12.0, f: shot3 }, { a: 12.0, b: 14.9, f: shot4 },
  { a: 14.9, b: 19.7, f: shot5 }, { a: 19.7, b: 23.2, f: shot6 }, { a: 23.2, b: 27.9, f: shot7 }, { a: 27.9, b: 32.0, f: shot8 },
  { a: 32.0, b: 35.4, f: shot9 }, { a: 35.4, b: 39.1, f: shot10 }, { a: 39.1, b: 42.8, f: shot11 }, { a: 42.8, b: 45.7, f: shot12 },
  { a: 45.7, b: 52.2, f: shot13 }, { a: 52.2, b: 57.2, f: shot14 }, { a: 57.2, b: 62.2, f: shot15 }, { a: 62.2, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0641',
    v2: true,
    hookLine: 'ゲーム中の夫の前に、育休ノルマの紙がバン。',
    series: '図星',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも夫の育休に家事のノルマがあったら？',
    titleHtml: 'もしも夫の育休に<br>家事のノルマが<br>あったら？',
    mood: 'tension', seed: 641, hits: [0.45, 39.7, 46.1], risers: [36.6], impacts: [7.7, 11.5, 12.9, 20.0, 27.3, 33.4, 39.7],
    sfx: [[0.45, 'whoosh'], [5.4, 'bubble'], [11.5, 'poof'], [20.2, 'alarm'], [21.5, 'alarm'], [22.8, 'alarm'], [25.0, 'whoosh'], [31.0, 'whoosh'], [37.0, 'bubble'], [49.3, 'whoosh']],
    narr: { '育休': 'いくきゅう', '50.9%': 'ごじゅってんきゅうパーセント', '88.3%': 'はちじゅうはちてんさんパーセント', '2時、3時、5時': 'にじ、さんじ、ごじ', '3日目': 'みっかめ', '結果：': '結果、', '離乳食': 'りにゅうしょく', '本気': 'ほんき' },
    ask: '夫の育休、ノルマは要る？要らない？',
    caption: 'もしも夫の育休に、家事と育児のノルマがあったら？\n\n妻たちの不満から生まれたルール。育休中に寝てるだけの夫が多すぎる。\nできなければ育休は取り消し。男性の育休の取得率は50.9%で過去最高。\nところが初日、夫はミルクの作り方を知らない。夜中の2時、3時、5時。泣き声のたびに起きる。\n昼寝しようとすると、洗濯物と離乳食が待っている。3日目、夫は会社に戻りたいと言い出す。\n妻は言う。それ、私は毎日やってるけど。女性の育休の取得率は88.3%。休んでいたんじゃない、働いていた。\n\n結果：育休は休みじゃなかった。取ってみて初めて分かる仕事だった。\n休みだと思っていたのは、本気で取ったことがない人だけだったのかもしれない。\n\n夫の育休、ノルマは要る？要らない？ コメントで教えて。\n\n※風刺ネタです\n出典：厚生労働省「令和7年度 雇用均等基本調査」（育児休業の取得率 男性50.9%・女性88.3%）',
    hashtags: ['もしもラボ', 'もしも', '育休', '男性育休', 'ワンオペ'],
    endStats: [['男性の育休取得率', '50.9%', '2025年度調査'], ['女性の育休取得率', '88.3%', '2025年度調査'], ['育休は', '休みじゃない', '取ってみて分かる']],
    sources: '出典：厚生労働省「令和7年度 雇用均等基本調査」',
  },
});
