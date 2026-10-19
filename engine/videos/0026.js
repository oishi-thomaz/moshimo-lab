import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, comma, randPerson, makePerson, poseWalk, mat } from '../lib.js';
import { city, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill, RX0, RZ0 } from '../city.js';
import { space, earth, moon, faceLon, setEarthNight } from '../scenes/earth.js';
import { look, lift, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも重力が5秒消えたら？
// 前提：重力だけが5秒ゼロになり、地面（地球）はそのままの形で回り続けると仮定した計算。数字はすべて推計（標準重力を除く）
// 数字：標準重力 9.80665 m/s²（定義値。1901年 国際度量衡総会、CODATA 2018 / NASA Earth Fact Sheet にも記載）
//       地球 赤道半径 6,378.137km・恒星日 23.9345時間・公転の平均速度 29.78km/s・軌道長半径 1億4,959.8万km（NASA Earth Fact Sheet）
//       月 公転の平均速度 1.022km/s・軌道長半径 38.44万km（NASA Moon Fact Sheet）
//       東京の緯度 35.6581°（国立天文台 暦計算室 日の出入り 東京都）
// 計算（推計）：自転の角速度 ω=2π/86,164.2s。赤道の速さ 約465m/s、東京 約378m/s（時速約1,360km）
//       重力ゼロだと人はまっすぐ進み、地面は円を描くので、離れる距離＝½·ω²r·t²（r＝自転軸からの距離 約5,181km）
//       1秒 約1.4cm／3秒 約12cm／5秒 約34cm
//       地球：5秒で約149km進み、公転の道からのずれ ½·(v²/r)·t² ≒ 約7.4cm。月：5秒で約5.1km、ずれ 約3.4cm
const H = s => 0.5 * 0.027557 * s * s; // 地面から離れる距離（m）、s＝重力が消えてからの秒

// ---------- crossing crowd (fictional crossing) ----------
const CX = RZ0, CZ = RX0;
const gCross = new THREE.Group(); city.add(gCross); gCross.visible = false;
const peds = [];
{
  const r = rng(260);
  for (let i = 0; i < 34; i++) {
    const p = randPerson(r); gCross.add(p);
    const kind = Math.floor(r() * 4), j = (r() - .5) * 2.4, s = r() < .5 ? 1 : -1;
    let a, b;
    if (kind === 0) { const z = CZ + s * 6 + j * 0.6; a = [CX - 8.5, z]; b = [CX + 8.5, z]; }
    else if (kind === 1) { const x = CX + s * 6 + j * 0.6; a = [x, CZ - 8.5]; b = [x, CZ + 8.5]; }
    else if (kind === 2) { a = [CX - 7 + j, CZ - 7]; b = [CX + 7 + j, CZ + 7]; }
    else { a = [CX + 7 + j, CZ - 7]; b = [CX - 7 + j, CZ + 7]; }
    if (r() < .5) [a, b] = [b, a];
    peds.push({ p, a, b, sp: 0.035 + r() * 0.02, o: r(), ph: r() * 6, arm: 0.6 + r() * 0.8 });
  }
}
// hero (standing) + kid with a ball, near the camera
const hero = makePerson({ skin: '#f1c9a5', hair: '#2c2421', shirt: '#4fa3d1', pants: '#2b3346' }); gCross.add(hero);
const kid = makePerson({ skin: '#e8b98f', hair: '#1d1a19', shirt: '#f2c14e', pants: '#3b3f4a', scale: 0.7 }); gCross.add(kid);
const HERO = [CX + 3.2, CZ + 4.2], KID = [CX + 1.8, CZ + 4.6];
const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), mat('#e8673c', { flatShading: true })); ball.castShadow = true; gCross.add(ball);
// glow strip under the hero's shoes (the gap)
const gapM = new THREE.MeshBasicMaterial({ color: 0x8ff3ff, transparent: true, opacity: 0, depthWrite: false });
const gap = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), gapM); gap.rotation.x = -Math.PI / 2; gCross.add(gap);
// landing dust rings
const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const rings = [];
for (let i = 0; i < 36; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 20), ringM); m.rotation.x = -Math.PI / 2; gCross.add(m); rings.push(m); }

const pedAt = (w, T) => { const u = (T * w.sp + w.o) % 1; return [lerp(w.a[0], w.b[0], u), lerp(w.a[1], w.b[1], u)]; };
// h: lift in m, fl: 0..1 floating pose
function floatPose(p, fl, ph, T, arm = 1) {
  const { legs, arms } = p.userData;
  legs[0].rotation.x = lerp(legs[0].rotation.x, 0.25 + 0.08 * Math.sin(T * 1.3 + ph), fl);
  legs[1].rotation.x = lerp(legs[1].rotation.x, -0.15 + 0.08 * Math.sin(T * 1.1 + ph), fl);
  for (const [i, s] of [[0, -1], [1, 1]]) { arms[i].rotation.z = lerp(0, s * (0.5 + 0.35 * arm + 0.1 * Math.sin(T * 1.7 + ph + i)), fl); arms[i].rotation.x = lerp(arms[i].rotation.x, -0.3, fl); }
}
let HIDE = null; // [x, z, r]: hide passers-by near the camera
function crowd(T, h, fl) {
  for (const w of peds) {
    const [x, z] = pedAt(w, T);
    w.p.visible = !(HIDE && Math.hypot(x - HIDE[0], z - HIDE[1]) < HIDE[2]);
    w.p.position.set(x, 0.15, z); w.p.rotation.y = Math.atan2(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    poseWalk(w.p, fl > 0 ? w.ph : T * 4.5 + w.ph, 1 - fl);
    for (const a of w.p.userData.arms) a.rotation.z = 0;
    if (fl > 0) floatPose(w.p, fl, w.ph, T, w.arm);
    w.p.position.y = (fl > 0 ? 0 : w.p.position.y) + 0.15 + h;
  }
  hero.position.set(HERO[0], 0.15 + h, HERO[1]); hero.rotation.y = -0.6; poseWalk(hero, 0, 0);
  for (const a of hero.userData.arms) a.rotation.z = 0;
  if (fl > 0) floatPose(hero, fl, 1.3, T, 0.8);
  kid.position.set(KID[0], 0.15 + h, KID[1]); kid.rotation.y = 0.5; poseWalk(kid, 0, 0);
  for (const a of kid.userData.arms) a.rotation.z = 0;
  if (fl > 0) floatPose(kid, fl, 2.1, T, 1.2);
  gap.position.set(HERO[0], 0.152, HERO[1]); gapM.opacity = 0;
  for (const m of rings) m.visible = false;
}
// ball: tossed up and down before; with no gravity it keeps going up at the speed it had
const VB = 1.2;
function ballToss(T) { const u = (T % 1.0); ball.position.set(KID[0] + 0.25, 1.05 + 2.4 * u * (1 - u), KID[1] + 0.2); kid.userData.arms[1].rotation.x = -2.6; }
function ballFree(s, h) { ball.position.set(KID[0] + 0.25, 1.43 + h + VB * s, KID[1] + 0.2); kid.userData.arms[1].rotation.x = -2.6; }

function cityBase(hide = null) {
  HIDE = hide; gCross.visible = true; setEnv('day', new THREE.Vector3(CX, 0, CZ)); setStore(1); setStoreLights(0.3); setBurst(0);
  ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; updateCars(0, false);
}

// ---------- space: orbit lines ----------
const gOrbit = new THREE.Group(); space.add(gOrbit); gOrbit.visible = false;
const SUNC = new THREE.Vector3(-150, 0, 0), RO = 150;
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffd36a })); sunBall.position.copy(SUNC); gOrbit.add(sunBall);
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(0.4, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sunGlow.scale.set(170, 170, 1); sunGlow.position.copy(SUNC); gOrbit.add(sunGlow);
const arcM = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.9 });
const lineM = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.95 });
function arcTube(center, rad, a0, a1, r, m) {
  const pts = []; for (let i = 0; i <= 80; i++) { const a = lerp(a0, a1, i / 80); pts.push(new THREE.Vector3(center.x + rad * Math.cos(a), center.y, center.z + rad * Math.sin(a))); }
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, r, 8), m); return mesh;
}
function dashLine(from, dir, len, r, m, n = 26) {
  const g = new THREE.Group(); const d = dir.clone().normalize();
  for (let i = 0; i < n; i++) { const s = (i + 0.25) / n * len; const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len / n * 0.55, 8), m); seg.position.copy(from).addScaledVector(d, s); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); g.add(seg); }
  return g;
}
// earth orbit: earth at origin, sun at -x; the orbit passes through the origin, tangent = +z
const earthArc = arcTube(SUNC, RO, -0.02, 0.30, 0.55, arcM); gOrbit.add(earthArc);
const earthLine = dashLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), 45, 0.5, lineM, 14); gOrbit.add(earthLine);
const labArc = textSprite('公転の道', { color: '#7fd4ff', size: 64, sx: 16, stroke: 8 }); gOrbit.add(labArc);
const labLine = textSprite('まっすぐ', { color: '#ffd98a', size: 64, sx: 14, stroke: 8 }); gOrbit.add(labLine);
labArc.position.set(-17, 4, 26); labLine.position.set(10, 4, 30);
// moon orbit: moon at (0,0,-MR) around earth, tangent = +x
const gMoon = new THREE.Group(); space.add(gMoon); gMoon.visible = false;
const MR = 60;
const moonArc = arcTube(new THREE.Vector3(0, 0, 0), MR, -Math.PI / 2 - 0.05, -Math.PI / 2 + 0.8, 0.45, arcM); gMoon.add(moonArc);
const moonLine = dashLine(new THREE.Vector3(0, 0, -MR), new THREE.Vector3(1, 0, 0), 46, 0.42, lineM, 18); gMoon.add(moonLine);
const labMArc = textSprite('月の道', { color: '#7fd4ff', size: 64, sx: 24, stroke: 8 }); gMoon.add(labMArc);
const labMLine = textSprite('まっすぐ', { color: '#ffd98a', size: 64, sx: 24, stroke: 8 }); gMoon.add(labMLine);
labMArc.position.set(26, 5, -44); labMLine.position.set(30, 5, -70);
function spaceBase(which) {
  setEarthNight(0); gOrbit.visible = which === 'earth'; gMoon.visible = which === 'moon';
  moon.visible = which === 'moon'; moon.position.set(0, 0, -MR); moon.scale.setScalar(2.0);
}
// reveal a dashed line progressively
function reveal(g, u) { const n = g.children.length; g.children.forEach((c, i) => { c.visible = i < Math.round(n * u); }); }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの交差点。'],
  [6.2, 10.1, '重力が消えた。<br>でも、誰も飛ばされない。'],
  [10.1, 14, '地面も人も、自転で<br>同じ速さで動いているから。'],
  [14.2, 18.1, '人はまっすぐ進み、<br>地面は丸く回っていく。'],
  [18.1, 22, 'そのずれで、<br>足が少しずつ浮く。'],
  [22.2, 26.1, '3秒で約12cm。<br>足が地面を離れた。'],
  [26.1, 30, '投げたボールは、<br>落ちてこない。'],
  [30.2, 34.6, '太陽の重力も消えた。<br>地球は5秒で約149km進む。'],
  [34.6, 39, 'それでも公転の道から<br>ずれるのは約7.4cm。'],
  [39.2, 43.6, '月も5秒で、<br>約5.1km進む。'],
  [43.6, 47.8, '月の道からのずれは、<br>約3.4cm。'],
  [48.1, 52.6, '結果：5秒で地面から<br>離れたのは約34cm。'],
  [52.6, 55.4, '重力が戻ると、全員が<br>階段2段分から着地。'],
  [55.6, 59.4, '5秒の無重力、<br>体験してみたい？'],
];

const G0 = 1.2; // hook: gravity off
const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100 + 1e-6)).padStart(2, '0')}`;
function shot0(t, T) { // hook: preview (time-lapse) — people lift off, ball keeps rising
  cityBase([CX + 7.5, CZ + 8.5, 4.5]);
  const s = Math.max(0, (T - G0) * 4); const off = T >= G0;
  crowd(T, off ? H(s) * 1 : 0, off ? clamp((T - G0) / 0.3) : 0);
  if (off) ballFree(s, 0); else ballToss(T);
  lift(80); const u = ease(T / 2.5);
  look(CX + lerp(8.6, 8.2, u), lerp(2.0, 1.9, u), CZ + lerp(9.6, 9.2, u), CX + 1.2, 1.1, CZ + 2.2, 50);
  el.title.style.opacity = 1;
  el.flash.style.opacity = 0.35 * clamp(1 - Math.abs(T - G0) / 0.12);
  if (!off) setHud('重力が消えるまで', cd(G0 - T), 1, { mono: true });
  else setHud('重力', '0', 1, { color: '#ff8a7a' });
  return city;
}
function shot1(t, T) { // everyday
  cityBase(); crowd(T, 0, 0); ballToss(T);
  lift(240); const u = ease(t / 3.5);
  look(CX + lerp(14, 13, u), 6.2, CZ + lerp(16, 15, u), CX + 1, 0.8, CZ + 1, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  setTop('地球の標準重力（1901年に決めた値）', '9.80665m/s²', fade(t, 0.3, 3.5, 0.25));
  return city;
}
function shot2(t, T) { // +0s gravity off. nobody is thrown away
  cityBase();
  const s = t * 0.12; crowd(T, H(s), clamp(t / 0.6)); ballFree(s, 0);
  lift(240); const u = ease(t / 8);
  look(CX + lerp(13, 11, u), lerp(6.0, 5.0, u), CZ + lerp(15, 13, u), CX + 1, 0.9, CZ + 1, 50);
  el.flash.style.opacity = 0.35 * clamp(1 - t / 0.15);
  hudTime('+0秒');
  setTop('東京が自転で動く速さ（推計）', '秒速約' + countUp(t, 378, 0.3, 1.6) + 'm', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot3(t, T) { // +1s: shoes, a thin gap
  cityBase([HERO[0] + 1.5, HERO[1] + 2.0, 3.2]);
  const s = 1 + t * 0.06; crowd(T, H(s), 1); ballFree(s, 0);
  gapM.opacity = 0.55 * clamp((t - 0.6) / 1.2) * (0.8 + 0.2 * Math.sin(T * 5)); gap.position.y = 0.152;
  lift(300); const u = ease(t / 8);
  look(HERO[0] + lerp(3.0, 2.7, u), lerp(0.7, 0.8, u), HERO[1] + lerp(3.6, 3.3, u), HERO[0], 0.75, HERO[1], 40);
  hudTime('+1秒');
  setTop('1秒で地面から離れる距離（推計）', '約' + (countUp(t, 14, 0.3, 1.4) / 10).toFixed(1) + 'cm', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot4(t, T) { // +3s: everyone ~12cm up; the ball keeps going
  cityBase([CX + 7.0, CZ + 8.0, 4.5]);
  const s = 3 + t * 0.1; const h = H(s); crowd(T, h, 1); ballFree(s, 0);
  gapM.opacity = 0.35; gap.position.y = 0.152;
  const k = ease((t - 4) / 3); lift(lerp(260, 0, k)); const u = ease(t / 8);
  look(CX + lerp(8.6, 10.5, k), lerp(1.9, 3.2, k), CZ + lerp(9.6, 11.5, k), CX + 1.6, lerp(1.0, 4.0, k), CZ + 2.6, 50);
  hudTime('+3秒');
  setTop('3秒で地面から離れる距離（推計）', '約' + countUp(t, 12, 0.3, 1.4) + 'cm', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot5(t, T) { // earth orbit: straight vs curve
  spaceBase('earth'); earth.rotation.y = faceLon(139.7) + 0.4 + t * 0.01;
  const k = easeOut(clamp((t - 0.3) / 2.2)); reveal(earthLine, k);
  earthArc.geometry.setDrawRange(0, Math.floor(earthArc.geometry.index.count * k / 3) * 3);
  labArc.material.opacity = labLine.material.opacity = clamp((t - 2.2) / 0.5);
  lift(330); const u = ease(t / 9.2);
  look(lerp(16, 12, u), lerp(78, 72, u), lerp(112, 106, u), -6, 0, 22, 50);
  hudTime('+5秒');
  if (t < 4.4) setTop('地球が5秒で進む距離（推計）', '約' + countUp(t, 149, 0.3, 1.4) + 'km', fade(t, 0.15, 9.2, 0.25));
  else setTop('公転の道からのずれ（推計）', '約' + (countUp(t - 4.4, 74, 0.1, 1.2) / 10).toFixed(1) + 'cm', fade(t, 4.4, 9.2, 0.2), '#7fd4ff');
  return space;
}
function shot6(t, T) { // moon orbit
  spaceBase('moon'); earth.rotation.y = faceLon(139.7) + 0.6;
  const k = easeOut(clamp((t - 0.3) / 2.2)); reveal(moonLine, k);
  moonArc.geometry.setDrawRange(0, Math.floor(moonArc.geometry.index.count * k / 3) * 3);
  labMArc.material.opacity = labMLine.material.opacity = clamp((t - 2.2) / 0.5);
  lift(330); const u = ease(t / 8.8);
  look(lerp(21, 20, u), lerp(205, 195, u), lerp(-14, -16, u), 20, 0, -30, 50);
  hudTime('+5秒');
  if (t < 4.4) setTop('月が5秒で進む距離（推計）', '約' + (countUp(t, 51, 0.3, 1.4) / 10).toFixed(1) + 'km', fade(t, 0.15, 8.8, 0.25));
  else setTop('月の道からのずれ（推計）', '約' + (countUp(t - 4.4, 34, 0.1, 1.2) / 10).toFixed(1) + 'cm', fade(t, 4.4, 8.8, 0.2), '#7fd4ff');
  return space;
}
const LAND = 0.6;
function shot7(t, T) { // result: gravity back at +5s, everyone lands from ~34cm
  cityBase();
  const h0 = H(5); const fall = clamp((t - LAND) / 0.27);
  let h = t < LAND ? h0 : h0 * (1 - fall * fall);
  if (t > LAND + 0.27) h = Math.max(0, 0.05 * Math.sin((t - LAND - 0.27) * 14) * Math.exp(-(t - LAND - 0.27) * 9));
  crowd(T, h, t < LAND + 0.27 ? 1 : clamp(1 - (t - LAND - 0.27) / 0.3));
  ballFree(5, 0); ball.visible = false;
  const rk = clamp((t - LAND - 0.27) / 0.8);
  [...peds.map(w => w.p), hero, kid].forEach((p, i) => { const m = rings[i]; if (!m) return; m.visible = rk > 0 && rk < 1; m.position.set(p.position.x, 0.17, p.position.z); m.scale.setScalar(1 + rk * 2.5); });
  ringM.opacity = 0.7 * (1 - rk);
  el.flash.style.opacity = 0.25 * clamp(1 - Math.abs(t - LAND - 0.27) / 0.1);
  lift(240); const u = ease(t / 7.5);
  look(CX + lerp(11, 12.5, u), lerp(5.2, 6.0, u), CZ + lerp(13, 14.5, u), CX + 1, 0.9, CZ + 1, 50);
  setHud(t < LAND ? '重力が戻るまで' : '重力', t < LAND ? cd(LAND - t) : '9.8', 1, { mono: t < LAND });
  if (t < 4.5) setTop('5秒で地面から離れた距離（推計）', '約' + countUp(t, 34, 0.2, 1.2) + 'cm', fade(t, 0.15, 4.5, 0.2), '#ffd98a');
  else setTop('重力が戻って着地する高さ（推計）', '階段約2段分', fade(t, 4.5, 7.5, 0.2), '#ff8a7a');
  return city;
}
function shot8(t, T) { // loop: same framing as the hook, everyone on the ground
  cityBase([CX + 7.5, CZ + 8.5, 4.5]); crowd(T, 0, 0); ball.visible = false;
  lift(80); const u = ease(t / 4);
  look(CX + lerp(8.9, 8.6, u), lerp(2.1, 2.0, u), CZ + lerp(9.9, 9.6, u), CX + 1.2, 1.1, CZ + 2.2, 50);
  setHud('重力', '9.8', 1);
  return city;
}
function show(f) { return (t, T) => { ball.visible = true; return f(t, T); }; }

const shots = [
  { a: 0, b: 2.5, f: show(shot0) }, { a: 2.5, b: 6, f: show(shot1) }, { a: 6, b: 14, f: show(shot2) }, { a: 14, b: 22, f: show(shot3) },
  { a: 22, b: 30, f: show(shot4) }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0026',
    title: '重力が5秒消えたら？',
    titleHtml: '重力が<br>5秒消えたら？',
    mood: 'mystery', seed: 26, hits: [1.2, 6.0, 48.9], risers: [6.0],
    ask: '5秒の無重力、体験してみたい？',
    narr: { '12cm': '12センチ', '149km': '149キロ', '7.4cm': '7.4センチ', '5.1km': '5.1キロ', '3.4cm': '3.4センチ', '34cm': '34センチ' },
    caption: 'もしも重力が5秒だけ消えたら？\n東京の地面は自転で秒速約378m。それでも人は宇宙へ飛ばされず、5秒で地面から離れるのは約34cm（推計）。地球が公転の道からずれるのも約7.4cm、月は約3.4cm。NASAの公表値で計算してみた。\n\n結果：重力が戻った瞬間、全員が約34cm、だいたい階段2段分の高さからストンと着地する（推計）。（地面と地球はそのままの形で回り続けると仮定した計算）\n\n5秒の無重力、体験してみたい？ コメントで教えて。\n\n出典：NASA Earth Fact Sheet・Moon Fact Sheet、国立天文台 暦計算室（東京の緯度）、CODATA 2018（標準重力）',
    hashtags: ['もしもラボ', '重力', '無重力', '地球', '雑学'],
    endStats: [['地球の標準重力', '9.80665m/s²', '定義値'], ['東京の自転の速さ（推計）', '秒速約378m', ''], ['5秒で地面から離れる（推計）', '約34cm', ''], ['公転の道からのずれ（推計）', '約7.4cm', '5秒間']],
    sources: '出典：NASA Earth Fact Sheet・Moon Fact Sheet、<br>国立天文台 暦計算室（東京の緯度）、CODATA 2018（標準重力）',
  },
});
