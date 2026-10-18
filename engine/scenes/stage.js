import * as THREE from 'three';
import { rng, mat, box, canvasTex, randPerson } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// STAGE: a clean studio for data shots — 3D bar charts, coin stacks, crowds of people, big numbers.
// Floor at y=0, back panel at z=-12. Camera usually at (0, 6, 18) looking at (0, 3, 0).
// API
//   stage (Scene), setStageColor('#hex' bg)
//   makeBar({ color, w, d, label, x, z }) -> { g, setH(h, valueText) }   (labels are sprites under / above the bar)
//   makeCoins(x, z, n) -> { g, setN(k) }  (stack of k coins visible, max n)
//   makeCrowd(n, seed, {w, d, x, z}) -> { g, people[] }
//   makeLabel(text, opt) -> sprite (textSprite)
// =====================================================
const stage = new THREE.Scene();
stage.background = new THREE.Color('#14213a');
stage.fog = new THREE.Fog(0x14213a, 30, 80);
stage.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.25));
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(8, 20, 14); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); stage.add(key);
const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#1d2c4a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(40, 40);
const floorM = new THREE.MeshLambertMaterial({ map: floorTex });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; stage.add(floor);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.4, 0.3, 48), mat('#26385e')); disc.position.y = 0.15; disc.receiveShadow = true; stage.add(disc);

function makeLabel(text, opt = {}) { return textSprite(text, { size: 64, sx: 3.6, ...opt }); }
function makeBar({ color = '#4fa3d1', w = 2, d = 2, label = '', x = 0, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0.3, z); stage.add(g);
  const b = box(w, 1, d, mat(color)); b.geometry.translate(0, 0.5, 0); g.add(b);
  const cap = box(w * 1.02, 0.08, d * 1.02, mat('#ffffff', { transparent: true, opacity: 0.35 })); g.add(cap);
  let lab = null; if (label) { lab = makeLabel(label, { sx: 3.0, size: 60 }); lab.position.set(0, 0.9, d / 2 + 0.15); lab.renderOrder = 5; lab.material.depthTest = false; g.add(lab); }
  const val = makeLabel('', { sx: 3.4, size: 72, color: '#ffffff', stroke: 8 }); g.add(val);
  function setH(h, valueText) { const hh = Math.max(0.001, h); b.scale.y = hh; b.visible = h > 0.002; cap.position.y = hh; cap.visible = b.visible; val.position.y = Math.max(hh + 0.9, lab ? 2.3 : 0); val.visible = !!valueText; if (valueText) val.userData.set(valueText); }
  setH(1);
  return { g, bar: b, setH, label: lab, val, mat: b.material };
}
const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20);
const coinM = mat('#e8b84a');
function makeCoins(x, z, n = 30) {
  const g = new THREE.Group(); g.position.set(x, 0.3, z); stage.add(g);
  const r = rng(Math.floor(x * 13 + z * 7 + 99));
  const cs = []; for (let i = 0; i < n; i++) { const c = new THREE.Mesh(coinGeo, coinM); c.position.set((r() - .5) * 0.08, 0.06 + i * 0.125, (r() - .5) * 0.08); c.castShadow = true; g.add(c); cs.push(c); }
  return { g, setN(k) { cs.forEach((c, i) => c.visible = i < k); } };
}
function makeCrowd(n, seed = 1, { w = 10, d = 6, x = 0, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0.3, z); stage.add(g);
  const r = rng(seed); const people = [];
  const cols = Math.ceil(Math.sqrt(n * w / d)), rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) { const p = randPerson(r); const c = i % cols, ro = Math.floor(i / cols); p.position.set(-w / 2 + (c + 0.5) * w / cols + (r() - .5) * 0.3, 0, -d / 2 + (ro + 0.5) * d / rows + (r() - .5) * 0.3); p.rotation.y = (r() - .5) * 0.6; g.add(p); people.push(p); }
  return { g, people };
}
function setStageColor(c) { stage.background.set(c); stage.fog.color.set(c); }

export { stage, makeBar, makeCoins, makeCrowd, makeLabel, setStageColor, disc as stageDisc, floorM as stageFloorM };
