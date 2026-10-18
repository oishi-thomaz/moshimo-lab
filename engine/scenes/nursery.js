import * as THREE from 'three';
import { rng, mat, box, canvasTex, makePerson } from '../lib.js';

// =====================================================
// NURSERY: 病院の新生児室。透明なベビーコット（キャスター付き）が並び、くるまれた赤ちゃんが眠る。
// Room interior: x -4..4, z -3.5..3.5 (back wall z=-3.5), height 3.2. Camera usually at z 4..7, y 1.6..2.4.
// API
//   nursery (Scene)
//   COTS: [{ g, baby, card, x, z }]  — 3列×3台（x -1.25/0/1.25, z -2.5/-1.2/0.1）。baby.visible で赤ちゃんの有無
//   setBabies(fn(i) -> 0..1)          — 0 で空、1 でいる（0〜1 の間は小さく出入り）
//   nurse (makePerson, 看護師)        — nurse.visible / position を動かす
//   setNurseryLight('day'|'night')    — 夜は天井灯を落として窓を夜空に
//   nightLamp (PointLight)            — 夜の常夜灯
// =====================================================
const nursery = new THREE.Scene();
nursery.background = new THREE.Color('#dfe6ee');
const hemi = new THREE.HemisphereLight(0xffffff, 0x9a8f86, 1.15); nursery.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e6, 1.2); sun.position.set(-3, 6, 6); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 });
nursery.add(sun); nursery.add(sun.target);
const ceilL = new THREE.PointLight(0xfff6e8, 8, 14, 1.2); ceilL.position.set(0, 3.0, 0); nursery.add(ceilL);
const nightLamp = new THREE.PointLight(0xffc98a, 0, 8, 1.3); nightLamp.position.set(2.8, 1.2, -2.6); nursery.add(nightLamp);

// floor / walls
const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#eef0ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d4d9d6'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4, 6);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 14), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.position.z = 3.4; floor.receiveShadow = true; nursery.add(floor);
const wallM = mat('#f6efe6');
const back = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.4, 0.2), wallM); back.position.set(0, 1.7, -3.6); back.receiveShadow = true; nursery.add(back);
for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 14), wallM); w.position.set(s * 4.1, 1.7, 3.4); w.receiveShadow = true; nursery.add(w); }
// ceiling: a down-facing plane only (a camera above it, for high angles, sees straight through)
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 14), mat('#fbf8f2')); ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 3.4, 3.4); nursery.add(ceiling);
// pastel stripe on the back wall
const stripe = box(8.2, 0.35, 0.03, mat('#bfe0d6')); stripe.position.set(0, 1.05, -3.48); nursery.add(stripe);
const stripe2 = box(8.2, 0.08, 0.03, mat('#f4c6c6')); stripe2.position.set(0, 1.3, -3.48); nursery.add(stripe2);
// ceiling panels (emissive)
const panelM = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: 0xfff6e0, emissiveIntensity: 0.8 });
for (const z of [-1.6, 1.0]) for (const x of [-2, 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), panelM); p.rotation.x = Math.PI / 2; p.position.set(x, 3.38, z); nursery.add(p); }

// window (left part of back wall)
const daySky = canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#86bdea'); gr.addColorStop(1, '#dff0fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(80, 70, 40, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(190, 120, 30, 10, 0, 0, 7); g.fill(); });
const nightSky = canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#25335c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.7, 2, 2); } g.fillStyle = '#f4f1d8'; g.beginPath(); g.arc(70, 60, 16, 0, 7); g.fill(); });
const winM = new THREE.MeshBasicMaterial({ map: daySky });
const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), winM); win.position.set(-2.3, 2.25, -3.49); nursery.add(win);
const frameM = mat('#ffffff');
for (const [w, h, x, y] of [[2.4, 0.1, -2.3, 2.95], [2.4, 0.1, -2.3, 1.55], [0.1, 1.5, -3.45, 2.25], [0.1, 1.5, -1.15, 2.25], [0.06, 1.3, -2.3, 2.25]]) { const f = box(w, h, 0.08, frameM); f.position.set(x, y, -3.46); nursery.add(f); }
// sign 新生児室 + wall clock
const signTex = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 22); g.fill(); g.fillStyle = '#4f9c8a'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('新生児室', w / 2, h / 2 + 4); });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTex, transparent: true })); sign.position.set(1.6, 2.75, -3.48); nursery.add(sign);
const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), mat('#ffffff')); clockFace.position.set(3.1, 2.75, -3.48); nursery.add(clockFace);
const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 24), mat('#7fbfae')); clockRim.position.set(3.1, 2.75, -3.47); nursery.add(clockRim);
const hand1 = box(0.02, 0.17, 0.01, mat('#333')); hand1.geometry.translate(0, 0.08, 0); hand1.position.set(3.1, 2.75, -3.46); hand1.rotation.z = -0.9; nursery.add(hand1);
const hand2 = box(0.02, 0.12, 0.01, mat('#333')); hand2.geometry.translate(0, 0.06, 0); hand2.position.set(3.1, 2.75, -3.46); hand2.rotation.z = 2.1; nursery.add(hand2);
// shelf with towels on the right wall
const shelf = box(0.4, 1.3, 1.4, mat('#e6dccd')); shelf.position.set(3.85, 0.65, -1.6); nursery.add(shelf);
['#f4c6c6', '#bfe0d6', '#fff2b8', '#cfe0f5'].forEach((c, i) => { const t = box(0.3, 0.12, 0.3, mat(c)); t.position.set(3.85, 1.36, -2.1 + i * 0.34); nursery.add(t); });

// ---- cots
const SKIN = '#f6d2b8';
const WRAP = ['#f8c9cf', '#c6e2f5', '#fff0b3', '#cfeedd', '#e3d4f5', '#f8c9cf', '#c6e2f5', '#fff0b3', '#cfeedd'];
const tubM = new THREE.MeshLambertMaterial({ color: '#d9f0ff', transparent: true, opacity: 0.22, depthWrite: false });
const metal = mat('#c5ccd3');
function makeBaby(color, r) { // lying on its back, head toward -z, face up
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.26, 4, 10), mat(color)); body.rotation.x = Math.PI / 2; body.position.set(0, 0.11, 0.08); body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat(SKIN)); head.position.set(0, 0.12, -0.17); g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(color)); cap.position.set(0, 0.12, -0.19); cap.rotation.x = -1.35; g.add(cap);
  const eyeM = mat('#3a2a22');
  for (const s of [-1, 1]) { const e = box(0.035, 0.01, 0.012, eyeM); e.castShadow = false; e.position.set(s * 0.038, 0.222, -0.15); g.add(e); }
  const cheekM = new THREE.MeshBasicMaterial({ color: '#f5a0a8', transparent: true, opacity: 0.7 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), cheekM); c.position.set(s * 0.062, 0.212, -0.12); c.rotation.x = -Math.PI / 2 + 0.35; g.add(c); }
  // blanket fold
  const fold = box(0.26, 0.03, 0.06, mat('#ffffff')); fold.position.set(0, 0.2, -0.04); g.add(fold);
  g.rotation.y = (r() - 0.5) * 0.25;
  return g;
}
const COTS = [];
{
  const r = rng(21);
  let i = 0;
  for (const z of [-2.5, -1.2, 0.1]) for (const x of [-1.25, 0, 1.25]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); nursery.add(g);
    // cart
    const top = box(0.95, 0.06, 0.7, mat('#eceff2')); top.position.y = 0.62; g.add(top);
    for (const sx of [-1, 1]) { const leg = box(0.05, 0.58, 0.05, metal); leg.position.set(sx * 0.4, 0.31, 0); g.add(leg); const foot = box(0.05, 0.04, 0.6, metal); foot.position.set(sx * 0.4, 0.06, 0); g.add(foot); for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), mat('#555')); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.4, 0.04, sz * 0.27); g.add(w); } }
    const drawer = box(0.85, 0.18, 0.62, mat('#f3f5f7')); drawer.position.y = 0.48; g.add(drawer);
    // clear tub
    const tub = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 0.62), tubM); tub.position.y = 0.82; tub.renderOrder = 3; g.add(tub);
    const rimM = mat('#e3f3ff');
    for (const [w, d, rx, rz] of [[0.87, 0.025, 0, 0.31], [0.87, 0.025, 0, -0.31], [0.025, 0.64, 0.425, 0], [0.025, 0.64, -0.425, 0]]) { const rim = box(w, 0.025, d, rimM); rim.castShadow = false; rim.position.set(rx, 0.99, rz); g.add(rim); }
    const matr = box(0.78, 0.05, 0.56, mat('#ffffff')); matr.position.y = 0.68; g.add(matr);
    // name card on the front
    const card = box(0.22, 0.12, 0.01, mat(i % 2 ? '#a9d4f0' : '#f6b4c0')); card.position.set(0.2, 0.85, 0.32); card.castShadow = false; g.add(card);
    const baby = makeBaby(WRAP[i % WRAP.length], r); baby.position.y = 0.68; g.add(baby);
    COTS.push({ g, baby, card, x, z }); i++;
  }
}
function setBabies(fn) {
  COTS.forEach((c, i) => { const k = Math.max(0, Math.min(1, fn(i))); c.baby.visible = k > 0.01; c.baby.scale.setScalar(0.6 + 0.4 * k); });
}
// nurse
const nurse = makePerson({ skin: '#f1c9a5', hair: '#2c2421', shirt: '#f4b6c2', pants: '#f4b6c2', long: true });
nurse.position.set(-1.6, 0, -3.1); nursery.add(nurse);
nurse.traverse(o => { if (o.isMesh) o.castShadow = true; });

function setNurseryLight(mode) {
  if (mode === 'night') {
    winM.map = nightSky; nursery.background.set('#151b2a'); hemi.intensity = 0.55; hemi.color.set('#9fb0e0'); sun.intensity = 0.25; sun.color.set('#9fb4ff');
    ceilL.intensity = 3.5; panelM.emissiveIntensity = 0.15; nightLamp.intensity = 2.5;
  } else {
    winM.map = daySky; nursery.background.set('#dfe6ee'); hemi.intensity = 1.15; hemi.color.set('#ffffff'); sun.intensity = 1.2; sun.color.set('#fff4e6');
    ceilL.intensity = 8; panelM.emissiveIntensity = 0.8; nightLamp.intensity = 0;
  }
  winM.needsUpdate = true;
}
setNurseryLight('day');

export { nursery, COTS, setBabies, nurse, setNurseryLight, nightLamp };
