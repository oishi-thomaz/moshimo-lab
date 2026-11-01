import * as THREE from 'three';
import { rng, mat, box, makeSky, canvasTex } from '../lib.js';
import { addMountains } from './bear.js';

// =====================================================
// CEDAR：スギの人工林（山の斜面に並ぶスギ・手前の大きなスギ・林道）と花粉の雲
// 地面 y=0。林道は x=0 を z 方向。手前のスギ（HERO）は x -3..4, z -2..-8。森は z -10..-120 の斜面。
// API
//   cedar (Scene), setCedarEnv('day'|'haze'|'clear')  haze = 花粉で黄色くかすむ空
//   makeCedarTree(h, seed) → Group（雄花の茶色い粒つき。.userData.flowers で雄花の表示）
//   HERO（手前のスギの一覧）, setPollen(k, t)  花粉の粒の量 0..1 と流れ, puff(k, t) 手前のスギから吹き出す花粉
//   setForest(k)  森の木の量 0..1（伐採の演出用）
// =====================================================
const cedar = new THREE.Scene();
const sky = makeSky(); cedar.add(sky);
cedar.fog = new THREE.Fog(0xdfe8ee, 40, 260);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5a3a, 1.1); cedar.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.5); sun.position.set(20, 35, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 90 }); cedar.add(sun);
const groundM = mat('#6f8f4a');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; cedar.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 60), mat('#b9a27c')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 10); cedar.add(road);
addMountains(cedar, { z: -170, color: '#3f5f3e', far: '#7f97a8' });

const trunkM = mat('#6a4a34'), leafM = mat('#2f5a34', { flatShading: true }), leaf2M = mat('#3a6a3a', { flatShading: true }), flowerM = mat('#b8823a', { flatShading: true });
function makeCedarTree(h = 9, seed = 1) {
  const r = rng(seed); const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.025, h * 0.04, h * 0.5, 7), trunkM); tr.position.y = h * 0.25; tr.castShadow = true; g.add(tr);
  const fl = new THREE.Group(); g.add(fl);
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const k = i / (layers - 1); const rr = h * (0.2 - k * 0.13), hh = h * 0.28;
    const c = new THREE.Mesh(new THREE.ConeGeometry(rr, hh, 8), i % 2 ? leafM : leaf2M); c.position.y = h * 0.3 + k * h * 0.58; c.rotation.y = r() * 3; c.castShadow = true; g.add(c);
    for (let j = 0; j < 7; j++) { const a = r() * 6.28, d = rr * (0.55 + r() * 0.35); const f = box(h * 0.022, h * 0.022, h * 0.022, flowerM); f.position.set(Math.cos(a) * d, c.position.y - hh * 0.2 + r() * hh * 0.25, Math.sin(a) * d); fl.add(f); }
  }
  g.userData.flowers = (on) => { fl.visible = on; };
  return g;
}
// hero trees near the road
const HERO = [];
{ const P = [[-3.2, -3, 11], [3.6, -4.5, 12], [-5.5, -8, 13], [5.8, -9, 12.5], [-1.8, -11, 12], [2.0, -13, 13], [-7.5, -1, 10], [7.8, -2, 11]];
  P.forEach(([x, z, h], i) => { const t = makeCedarTree(h, 10 + i); t.position.set(x, 0, z); cedar.add(t); HERO.push(t); }); }
// forest: instanced cedars on the slopes
const FN = 1400;
const fCone = new THREE.ConeGeometry(1.3, 7, 7); fCone.translate(0, 6, 0);
const fTrunk = new THREE.CylinderGeometry(0.15, 0.22, 3, 5); fTrunk.translate(0, 1.5, 0);
const forestC = new THREE.InstancedMesh(fCone, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), FN);
const forestT = new THREE.InstancedMesh(fTrunk, trunkM, FN);
cedar.add(forestC); cedar.add(forestT);
const FD = [];
{ const r = rng(77), M = new THREE.Matrix4(), c = new THREE.Color(), c1 = new THREE.Color('#2c5232'), c2 = new THREE.Color('#41703f');
  for (let i = 0; i < FN; i++) {
    let x = -90 + r() * 180, z = -14 - r() * 110; if (Math.abs(x) < 3 && z > -40) x += x < 0 ? -4 : 4;
    const s = 0.8 + r() * 0.6, y = Math.max(0, (-z - 20) * 0.12) - 0.3;
    FD.push([x, y, z, s, r()]); M.makeScale(s, s, s); M.setPosition(x, y, z); forestC.setMatrixAt(i, M); forestT.setMatrixAt(i, M); forestC.setColorAt(i, c.copy(c1).lerp(c2, r()));
  } }
// slope under the forest
const slope = new THREE.Mesh(new THREE.PlaneGeometry(220, 140), mat('#557a42', { flatShading: true }));
slope.rotation.x = -Math.PI / 2 + 0.12; slope.position.set(0, 7.8, -85); cedar.add(slope);
let fk = -1;
function setForest(k) { if (k === fk) return; fk = k; const M = new THREE.Matrix4(); FD.forEach(([x, y, z, s, q], i) => { const ss = q < k ? s : 0.0001; M.makeScale(ss, ss, ss); M.setPosition(x, y, z); forestC.setMatrixAt(i, M); forestT.setMatrixAt(i, M); }); forestC.instanceMatrix.needsUpdate = true; forestT.instanceMatrix.needsUpdate = true; }
setForest(1);

// pollen: drifting yellow particles + puffs from the hero trees
const pollenTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,140,1)'); gr.addColorStop(0.4, 'rgba(240,210,90,.7)'); gr.addColorStop(1, 'rgba(230,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const PN = 2600;
const pPos = new Float32Array(PN * 3), pBase = [];
{ const r = rng(5); for (let i = 0; i < PN; i++) pBase.push([-14 + r() * 28, 0.5 + r() * 16, -30 + r() * 42, r() * 6.28, 0.5 + r()]); }
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ map: pollenTex, size: 0.42, color: 0xffe28a, transparent: true, depthWrite: false, opacity: 0.9 });
const pollen = new THREE.Points(pGeo, pMat); pollen.frustumCulled = false; cedar.add(pollen);
function setPollen(k, t = 0) {
  const n = Math.floor(PN * k); pollen.visible = n > 0; pGeo.setDrawRange(0, n); if (!n) return;
  for (let i = 0; i < n; i++) { const [x, y, z, ph, s] = pBase[i]; pPos[i * 3] = ((x + t * 0.9 * s + 14) % 28 + 28) % 28 - 14; pPos[i * 3 + 1] = y + Math.sin(t * 0.8 + ph) * 0.4; pPos[i * 3 + 2] = z + Math.cos(t * 0.6 + ph) * 0.5; }
  pGeo.attributes.position.needsUpdate = true;
}
// big translucent puffs (clouds of pollen) drifting off the hero trees
const puffM = new THREE.MeshBasicMaterial({ color: 0xf2d36a, transparent: true, opacity: 0.0, depthWrite: false });
const PUFFS = [];
{ const r = rng(9); HERO.forEach((h, i) => { for (let j = 0; j < 3; j++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), puffM); m.userData = { o: h.position.clone().add(new THREE.Vector3((r() - .5) * 2, 6 + r() * 4, (r() - .5) * 2)), ph: r() * 6.28, s: 1.2 + r() * 1.4 }; cedar.add(m); PUFFS.push(m); } }); }
function puff(k, t = 0) { puffM.opacity = 0.42 * k; PUFFS.forEach(m => { m.visible = k > 0.01; const u = ((t * 0.25 + m.userData.ph) % 1); m.position.copy(m.userData.o).add(new THREE.Vector3(u * 4, u * 1.5, u * 1.5)); m.scale.setScalar(m.userData.s * (0.6 + u * 1.2)); }); }

const ENVS = {
  day: { top: '#5c9fe0', bot: '#dff0fb', fog: '#d6e8f4', hi: 1.1, si: 1.5, g: '#6f8f4a' },
  haze: { top: '#b9b27a', bot: '#efe0a6', fog: '#e6d79a', hi: 1.0, si: 1.2, g: '#7a8a48' },
  clear: { top: '#3f8fe8', bot: '#e8f6ff', fog: '#e1eff9', hi: 1.15, si: 1.6, g: '#6f9a4a' },
};
function setCedarEnv(e) { const E = ENVS[e]; sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot); cedar.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; groundM.color.set(E.g); cedar.fog.near = e === 'haze' ? 20 : 40; cedar.fog.far = e === 'haze' ? 150 : 260; }
setCedarEnv('day'); setPollen(0); puff(0);

export { cedar, setCedarEnv, makeCedarTree, HERO, setPollen, puff, setForest };
