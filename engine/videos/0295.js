import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, canvasTex, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setScreen, props, lamp, glow } from '../scenes/room.js';
import { look, lift, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも毎日20分昼寝をしたら？（blueprint no 295・人体の限界シリーズ）
// 数字
//   NASA の長距離便の実験：飛行中に40分の休みを取った組は、5.6分で眠りに落ち、平均25.8分眠った
//     （NASA Technical Memorandum 108839 / DOT/FAA/92/24「Crew Factors in Flight Operations IX: Effects of Planned Cockpit Rest on Crew Performance
//      and Alertness in Long-Haul Operations」1994年 https://ntrs.nasa.gov/citations/19950006379）
//   同じ報告書：飛行の最後の90分（着陸まで）に脳波・眼球運動に出た「一瞬の居眠り（microevents）」は、仮眠なしの組が平均6.37回、仮眠ありの組が2.90回
//     （合計120回 vs 34回。同報告書 本文）
//   国のめやす：日中に眠気があるときは、午後3時前までに30分以内の昼寝が効果的（厚生労働省「健康づくりのための睡眠ガイド2023」
//     https://kennet.mhlw.go.jp/tools/pdf/guide-sleep.pdf）
//   60分を超える昼寝：昼寝しない人より死亡リスク30%高い、心血管病34%高い（20以上の研究・31万3,651人の分析。ESC Congress 2020、欧州心臓病学会 発表）
//     https://escardio.org/The-ESC/Press-Office/Press-releases/Long-naps-may-be-bad-for-health

// ---------- you (napping at the home desk) ----------
const hero = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#4fa3d1', pants: '#3b3f4a', scale: 1 });
const pv = new THREE.Group(); pv.rotation.order = 'YXZ'; room.add(pv); pv.add(hero); hero.position.set(0, -0.86, 0);
const H = hero.userData;
const eyes = H.head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055);
function eyesShut(k) { eyes.forEach(e => e.scale.y = 1 - 0.85 * k); }
// k: 0 = sitting up, 1 = head down on the desk
function nap(k, t = 0) {
  pv.visible = true;
  pv.position.set(-2.6, 0.52, -2.15); pv.rotation.set(1.0 * k, Math.PI, 0);
  H.legs.forEach(l => l.rotation.x = -Math.PI / 2 + 1.0 * k);
  H.arms.forEach((a, i) => { a.rotation.x = lerp(-1.1, -2.45, k); a.rotation.z = (i ? -1 : 1) * 0.5 * k; });
  H.head.rotation.set(lerp(0.05, 0.45, k) + Math.sin(t * 0.7) * 0.02 * (1 - k), 0, (k > 0.5 ? 0.25 * k : 0));
  eyesShut(k);
}
function stretch(t) { // waking up: sit up and stretch the arms
  pv.position.set(-2.6, 0.52, -2.15); pv.rotation.set(-0.08, Math.PI, 0);
  H.legs.forEach(l => l.rotation.x = -Math.PI / 2 - 0.08);
  const k = clamp(t / 0.8);
  H.arms.forEach((a, i) => { a.rotation.x = lerp(-1.1, -2.9, k); a.rotation.z = (i ? -1 : 1) * 0.25 * k; });
  H.head.rotation.set(-0.2 * k, 0, 0); eyesShut(0);
}
function work(t) { nap(0, t); H.arms.forEach((a, i) => a.rotation.x = -1.1 + Math.sin(t * 9 + i * 2) * 0.06); }
// yawn: head tilts back a little
function drowsy(t) { nap(clamp(0.12 + Math.max(0, Math.sin(t * 1.3)) * 0.18), t); eyesShut(0.55); }

// wall clock + alarm phone on the desk
const clockSp = textSprite('14:00', { w: 512, h: 192, size: 120, bg: 'rgba(250,250,247,.96)', color: '#20242c', radius: 40, sx: 0.8 }); clockSp.position.set(-3.3, 0.98, -3.05); clockSp.scale.set(0.42, 0.42 * 192 / 512, 1); room.add(clockSp);
const phone = new THREE.Group();
{ const b = box(0.15, 0.02, 0.28, mat('#1b1d22')); phone.add(b); }
const phoneScr = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.25), new THREE.MeshBasicMaterial({ color: 0x6fd3ff })); phoneScr.rotation.x = -Math.PI / 2; phoneScr.position.y = 0.012; phone.add(phoneScr);
phone.position.set(-2.05, 0.79, -2.75); phone.rotation.y = 0.3; room.add(phone);
const ring = makeSparkles(40, 0.05, 0xfff2a8); room.add(ring.points); ring.init([[-2.05, 0.82, -2.75]], 0.05, 0.6);
const zzz = makeSparkles(50, 0.07, 0xbfd8ff); room.add(zzz.points); zzz.init([[-2.85, 1.3, -3.05]], 0.12, 1.0);
function screenDocs(g, w, h) { g.fillStyle = '#f4f6f9'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6fb0'; g.fillRect(0, 0, w, 18); const r = rng(5); for (let i = 0; i < 9; i++) { g.fillStyle = i % 4 === 0 ? '#5a6b80' : '#aab4c2'; g.fillRect(16, 30 + i * 13, 80 + r() * 150, 6); } }
setScreen(screenDocs);
function deskBase(light = 'day') {
  setRoom({ sets: ['desk', 'living'] }); props.tv.visible = true;
  if (light === 'day') setLight('day', { ceil: 3, hemi: 1.1 }); else setLight('evening', { ceil: 6, hemi: 0.95 });
  zzz.set(0); ring.set(0); clockSp.visible = false; phone.visible = true; phoneScr.material.color.set('#6fd3ff');
}
function deskCam(t, d, a, b) { // a,b: [px,py,pz,tx,ty,tz,fov]
  const u = ease(clamp(t / d));
  look(...a.slice(0, 6).map((v, i) => lerp(v, b[i], u)), lerp(a[6] || 50, b[6] || 50, u));
}
const CAM_SIDE = [-0.2, 2.0, 0.3, -2.6, 0.9, -2.6, 46];
const CAM_SIDE2 = [-0.5, 1.9, -0.1, -2.6, 0.9, -2.6, 46];

// ---------- cockpit (NASA long-haul flight) ----------
const cockpit = new THREE.Scene();
const skyDay = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f6fb8'); gr.addColorStop(0.6, '#8fc0ea'); gr.addColorStop(1, '#dfeefb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const skyDusk = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#24305e'); gr.addColorStop(0.55, '#c2708a'); gr.addColorStop(1, '#f7c08a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
cockpit.background = new THREE.Color('#10141c');
const cpHemi = new THREE.HemisphereLight(0xdfe8ff, 0x5a6070, 1.5); { const pl = new THREE.PointLight(0xfff2dc, 6, 8, 1.4); pl.position.set(0.8, 2.4, 1.2); cockpit.add(pl); } cockpit.add(cpHemi);
const cpKey = new THREE.DirectionalLight(0xffffff, 1.0); cpKey.position.set(0, 4, -6); cockpit.add(cpKey);
const skyM = new THREE.MeshBasicMaterial({ map: skyDay });
const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), skyM); skyPlane.position.set(0, 2.5, -9); cockpit.add(skyPlane);
const clouds = [];
{ const r = rng(9); for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + r() * 0.9, 0), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true, transparent: true, opacity: 0.92 })); c.scale.set(2.2, 0.55, 1); c.userData.o = [(r() - 0.5) * 30, -1.4 + r() * 1.6, -8.2 + r() * 1.5, 0.6 + r() * 0.8]; cockpit.add(c); clouds.push(c); } }
function moveClouds(t) { clouds.forEach(c => { const [x, y, z, s] = c.userData.o; c.position.set(((x - t * s * 2 + 60) % 30) - 15, y, z); }); }
const panelM = mat('#2a2f38'), frameM = mat('#3a404b');
const panel = box(4.2, 0.9, 1.2, panelM); panel.position.set(0, 0.45, -2.2); cockpit.add(panel);
const glare = box(4.2, 0.18, 0.5, frameM); glare.position.set(0, 0.98, -2.45); cockpit.add(glare);
// screens on the panel
for (const x of [-1.4, -0.5, 0.5, 1.4]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), new THREE.MeshBasicMaterial({ color: x < 0 ? 0x1f6f9a : 0x2a8f6a })); s.position.set(x, 0.62, -1.59); s.rotation.x = -0.35; cockpit.add(s); }
// windshield frame
for (const [w, h, x, y] of [[4.6, 0.14, 0, 2.55], [0.14, 1.7, -2.2, 1.7], [0.14, 1.7, 2.2, 1.7], [0.12, 1.6, 0, 1.75]]) { const b = box(w, h, 0.14, frameM); b.position.set(x, y, -2.75); cockpit.add(b); }
const roof = box(4.8, 0.12, 3.6, mat('#262b33')); roof.position.set(0, 2.66, -1.1); cockpit.add(roof);
for (const s of [-1, 1]) { const wl = box(0.12, 2.6, 3.6, mat('#2c313a')); wl.position.set(s * 2.35, 1.35, -1.1); cockpit.add(wl); }
{ const bw = box(4.8, 2.7, 0.12, mat('#3a3f4a')); bw.position.set(0, 1.35, 1.45); cockpit.add(bw); const door = box(0.8, 1.9, 0.04, mat('#4a505c')); door.position.set(0, 0.95, 1.38); cockpit.add(door); }
const cpFloor = box(4.8, 0.1, 4, mat('#1d2129')); cpFloor.position.set(0, -0.05, -1); cockpit.add(cpFloor);
const seats = [];
for (const s of [-1, 1]) {
  const g = new THREE.Group(); g.position.set(s * 0.95, 0, -0.2); cockpit.add(g);
  const sb = box(0.62, 0.14, 0.6, mat('#4b3a2f')); sb.position.y = 0.5; g.add(sb);
  const bk = box(0.62, 0.95, 0.14, mat('#4b3a2f')); bk.position.set(0, 1.0, 0.3); g.add(bk);
  seats.push(g);
}
const pilots = [];
for (const s of [-1, 1]) {
  const p = makePerson({ skin: SKIN[s < 0 ? 1 : 2], hair: HAIR[s < 0 ? 0 : 3], shirt: '#f3f4f6', pants: '#1f2430', tie: true, scale: 1 });
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; g.add(p); p.position.set(0, -0.86, 0); cockpit.add(g);
  const cap = box(0.44, 0.1, 0.46, mat('#1f2430')); cap.position.y = 0.52; p.userData.head.add(cap);
  pilots.push({ g, p });
}
// lean back (k=1 asleep)
function pilotPose(i, k, t) {
  const { g, p } = pilots[i]; const s = i ? 1 : -1;
  g.position.set(s * 0.95, 0.57, -0.25); g.rotation.set(-0.28 * k, Math.PI, 0);
  p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 - 0.28 * k);
  p.userData.arms.forEach(a => { a.rotation.x = lerp(-0.9, -0.2, k); a.rotation.z = 0; });
  p.userData.head.rotation.set(lerp(0, 0.25, k), 0, s * 0.25 * k + Math.sin(t * 0.5) * 0.02);
  p.userData.head.children.forEach(c => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055) c.scale.y = 1 - 0.85 * k; });
}
const cpZzz = makeSparkles(40, 0.06, 0xbfd8ff); cockpit.add(cpZzz.points); cpZzz.init([[0.95, 1.95, -0.25]], 0.1, 0.9);
// brain-wave strip (EEG-like line) as a sprite canvas
const eegC = document.createElement('canvas'); eegC.width = 1024; eegC.height = 256;
const eegTex = new THREE.CanvasTexture(eegC); eegTex.colorSpace = THREE.SRGBColorSpace;
const eeg = new THREE.Sprite(new THREE.SpriteMaterial({ map: eegTex, transparent: true, depthTest: false })); eeg.renderOrder = 8; eeg.scale.set(1.7, 0.425, 1); eeg.position.set(0, 2.15, -2.0); cockpit.add(eeg);
function drawEEG(t, n, col) { // n = spikes per strip
  const g = eegC.getContext('2d'); g.clearRect(0, 0, 1024, 256);
  g.fillStyle = 'rgba(10,14,22,.82)'; g.beginPath(); g.roundRect(6, 6, 1012, 244, 28); g.fill();
  g.strokeStyle = col; g.lineWidth = 6; g.beginPath();
  for (let x = 0; x <= 960; x += 4) {
    const xx = 32 + x; const ph = (x / 960) * 10 + t * 3;
    let y = 128 + Math.sin(ph * 6.1) * 14 + Math.sin(ph * 13.7) * 8;
    for (let k = 0; k < n; k++) { const c = (k + 0.5) / n * 960; const d = (x - c) / 18; y += Math.exp(-d * d) * (k % 2 ? -70 : 70); }
    x === 0 ? g.moveTo(xx, y) : g.lineTo(xx, y);
  }
  g.stroke(); eegTex.needsUpdate = true;
}
function cpCam(t, d, a, b) { const u = ease(clamp(t / d)); look(...a.slice(0, 6).map((v, i) => lerp(v, b[i], u)), lerp(a[6], b[6], u)); }

const SUBS = [
  [2.6, 6.0, '午後2時。お昼のあと、<br>まぶたが重い。'],
  [6.2, 10.1, '机に伏せて、<br>目を閉じる。'],
  [10.1, 14, '実験では、約6分で<br>眠りに落ちた。'],
  [14.2, 18.1, '20分でアラーム。<br>深く眠る前に起きる。'],
  [18.1, 22, '国のめやすは、<br>午後3時前に30分以内。'],
  [22.2, 26.1, 'NASAは長距離便の<br>パイロットで試した。'],
  [26.1, 30, '40分の休みで、<br>平均26分眠った。'],
  [30.2, 34.6, '着陸前に脳波に出る、<br>一瞬の居眠り。'],
  [34.6, 39, '仮眠なしは6.4回、<br>仮眠ありは2.9回。'],
  [39.2, 43.6, 'でも、寝すぎると<br>逆効果。'],
  [43.6, 47.8, '60分を超える昼寝は、<br>死亡リスクが3割高い。'],
  [48.1, 53.8, '結果：20分の昼寝で、<br>一瞬の居眠りが半分以下に。'],
  [53.9, 56.1, 'コツは30分以内。'],
  [56.2, 59.4, 'あなたの昼寝は、<br>いつも何分？'],
];
const fmtT = (sec) => { sec = Math.max(0, sec); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`; };
const BLUE = '#7fd4ff', GREEN = '#7ff0c8', RED = '#ff8a7a', GOLD = '#ffe08a';

function shot0(t) { // hook: you drop your head on the desk; the 20:00 timer starts
  lift(200);
  deskBase('day'); clockSp.userData.set('14:00');
  nap(easeOut(clamp((t - 0.3) / 0.9)), t);
  deskCam(t, 2.5, CAM_SIDE, CAM_SIDE2);
  el.title.style.opacity = 1;
  setHud('昼寝タイマー', fmtT(20 * 60 - Math.max(0, t - 1.2) * 60), 1, { mono: true });
  return room;
}
function shot1(t) { // everyday: drowsy after lunch
  lift(200);
  deskBase('day'); clockSp.userData.set('14:00');
  drowsy(t + 1);
  deskCam(t, 3.5, [0.1, 1.9, 0.0, -2.6, 1.0, -2.6, 46], [-0.3, 1.85, -0.3, -2.6, 1.0, -2.7, 46]);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return room;
}
function shot2(t) { // +5分: asleep
  lift(200);
  deskBase('day'); clockSp.userData.set('14:05');
  nap(1, t);
  zzz.set((t % 2.2) / 2.2);
  deskCam(t, 8, [-0.4, 2.1, 0.2, -2.6, 0.9, -2.7, 46], [-0.9, 1.9, -0.4, -2.6, 0.9, -2.75, 46]);
  setHud('昼寝', '+5分', 1);
  setTop('眠りに落ちるまで（NASA・1994年）', (countUp(t, 56, 4.2, 1.0) / 10).toFixed(1) + '分', fade(t, 4.1, 8, 0.25), BLUE);
  return room;
}
function shot3(t) { // +20分: alarm, wake up and stretch
  lift(200);
  deskBase('day'); clockSp.userData.set('14:20');
  const wake = 0.9;
  if (t < wake) nap(1, t); else stretch(t - wake);
  ring.set(t < 2.4 ? (t % 0.6) / 0.6 : 0);
  phoneScr.material.color.set(t < 2.4 && Math.floor(t * 6) % 2 ? '#ffe08a' : '#6fd3ff');
  deskCam(t, 8, [-0.6, 1.9, 0.4, -2.5, 1.05, -2.6, 48], [-0.3, 1.9, 0.1, -2.5, 1.1, -2.6, 48]);
  setHud('昼寝', '+20分', 1, { color: GREEN });
  if (t < 3.9) setTop('アラーム', fmtT(20 * 60 + t * 2), fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('国のめやす（午後3時前・2023年）', countUp(t - 3.9, 30, 0.1, 1.0) + '分以内', fade(t, 3.9, 8, 0.25), GREEN);
  return room;
}
function cockpitBase(dusk = false) {
  skyM.map = dusk ? skyDusk : skyDay; skyM.needsUpdate = true;
  cpHemi.intensity = dusk ? 1.2 : 1.5; cpKey.color.set(dusk ? '#ffc89a' : '#ffffff');
  eeg.visible = false; cpZzz.set(0);
}
function shot4(t) { // NASA: one pilot rests while the other flies
  lift(400);
  cockpitBase(false); moveClouds(t + 3);
  pilotPose(0, 0, t); pilotPose(1, easeOut(clamp((t - 0.5) / 1.5)), t);
  if (t > 2) cpZzz.set(((t - 2) % 2.2) / 2.2);
  cpCam(t, 8, [2.15, 2.3, -2.45, 0.1, 1.3, 0.1, 60], [2.0, 2.25, -2.3, 0.1, 1.3, 0.1, 60]);
  setHud('長距離便', '40分の休み', 1);
  setTop('眠った時間（平均・NASA・1994年）', (countUp(t, 258, 4.2, 1.3) / 10).toFixed(1) + '分', fade(t, 4.0, 8, 0.25), BLUE);
  return cockpit;
}
function shot5(t) { // descent at dusk: brain-wave lapses without nap vs with nap
  lift(60);
  cockpitBase(true); moveClouds(t + 20);
  pilotPose(0, 0, t); pilotPose(1, 0, t);
  eeg.visible = true;
  const noNap = t < 4.4;
  drawEEG(t, noNap ? 6 : 3, noNap ? '#ff8a7a' : '#7ff0c8');
  cpCam(t, 9.2, [0.1, 2.35, 1.25, 0, 1.55, -2.5, 58], [0.1, 2.3, 1.1, 0, 1.55, -2.5, 58]);
  setHud('着陸前', '90分', 1);
  if (noNap) setTop('一瞬の居眠り・仮眠なし（1人平均・1994年）', (countUp(t, 637, 0.7, 1.3) / 100).toFixed(2) + '回', fade(t, 0.6, 4.4, 0.2), RED);
  else setTop('一瞬の居眠り・仮眠あり（1人平均・1994年）', (countUp(t - 4.4, 290, 0.2, 1.2) / 100).toFixed(2) + '回', fade(t, 4.4, 9.2, 0.2), GREEN);
  return cockpit;
}
function shot6(t) { // too long: evening, still asleep, clock 15:30
  lift(200);
  deskBase('evening'); clockSp.userData.set(t < 3 ? '14:50' : '15:30');
  nap(1, t);
  zzz.set((t % 2.2) / 2.2);
  deskCam(t, 8.8, [-1.0, 2.1, 0.3, -2.6, 0.95, -2.8, 46], [-0.6, 2.0, -0.2, -2.7, 0.95, -2.8, 46]);
  setHud('昼寝', t < 3 ? '+50分' : '+90分', 1, { color: RED });
  setTop('60分を超える昼寝・死亡リスク（2020年）', '+' + countUp(t, 30, 4.6, 1.2) + '%', fade(t, 4.4, 8.8, 0.25), RED);
  return room;
}
function shot7(t) { // result: awake and working, sharp
  lift(200);
  deskBase('day'); clockSp.userData.set('14:20');
  work(t);
  deskCam(t, 7.5, [-0.1, 1.95, 0.0, -2.6, 1.05, -2.75, 46], [-0.4, 2.1, 0.5, -2.6, 1.05, -2.75, 48]);
  setHud('昼寝', '20分', 1, { color: GREEN });
  if (t < 4) setTop('一瞬の居眠り（着陸前90分・1994年）', '6.37回 → 2.90回', fade(t, 0.15, 4, 0.2), GREEN);
  else setTop('国のめやす（2023年）', '30分以内', fade(t, 4, 7.5, 0.2), GREEN);
  return room;
}
function shot8(t) { // loop: same as opening, head going down
  lift(200);
  deskBase('day'); clockSp.userData.set('14:00');
  nap(easeOut(clamp((t - 1.2) / 1.2)), t);
  deskCam(t, 4, [-0.4, 1.95, 0.0, -2.6, 0.9, -2.6, 46], CAM_SIDE);
  setHud('昼寝タイマー', '20:00', 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
void glow; void lamp; void comma;
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0295',
    series: '人体の限界',
    hookType: 'H4', cat: '体・健康',
    title: '毎日20分昼寝をしたら？',
    titleHtml: '毎日20分<br>昼寝をしたら？',
    mood: 'calm', seed: 295, hits: [14.4, 48.1], risers: [30.2], impacts: [10.6, 34.8, 43.8],
    sfx: [[14.3, 'alarm'], [22.3, 'whoosh'], [30.4, 'meter', 0.5], [39.3, 'meter', 0.7]],
    narr: { '6.4回': '6.4回', '2.9回': '2.9回', 'NASA': 'ナサ', '3割': 'さんわり' },
    ask: 'あなたの昼寝はいつも何分？',
    caption: 'もしも毎日20分、昼寝をしたら？\nNASAが長距離便のパイロットで試した実験では、飛行中に40分の休みを取った組は約6分で眠りに落ち、平均26分眠った。\n着陸前の90分に脳波に出た「一瞬の居眠り」は、仮眠なしの組が1人平均6.37回、仮眠ありの組は2.90回。半分以下に減った（1994年）。\n厚生労働省のめやすは、眠気があるときは午後3時前までに30分以内の昼寝。\nでも寝すぎは逆効果。60分を超える昼寝は、昼寝しない人より死亡リスクが30%高いという分析もある（2020年・約31万人）。\n\n結果：20分の昼寝で、一瞬の居眠りが半分以下に。コツは30分以内。\n\nあなたの昼寝はいつも何分？ コメントで教えて。\n\n出典：NASA Technical Memorandum 108839「Crew Factors in Flight Operations IX」（1994年）、厚生労働省「健康づくりのための睡眠ガイド2023」、欧州心臓病学会 ESC Congress 2020 発表',
    hashtags: ['もしもラボ', '昼寝', 'パワーナップ', '睡眠', '人体の限界'],
    endStats: [['眠りに落ちるまで', '5.6分', 'NASA 1994年'], ['眠った時間（平均）', '25.8分', 'NASA 1994年'], ['着陸前90分の一瞬の居眠り', '6.37回→2.90回', '1人平均'], ['国のめやす', '午後3時前に30分以内', '2023年'], ['60分超えの昼寝・死亡リスク', '+30%', '2020年']],
    sources: '出典：NASA TM-108839（1994年）、厚生労働省<br>健康づくりのための睡眠ガイド2023、ESC Congress 2020',
  },
});
