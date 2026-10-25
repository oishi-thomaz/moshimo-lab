import * as THREE from 'three';
import { rng, mat, box, makeSky, canvasTex, randPerson } from '../lib.js';

// =====================================================
// BEACH: 夏の砂浜と海（波打つ海面・ゆるい坂の砂浜と海底・波打ちぎわの泡・パラソル・遠くの岬）
// 海面 y=seaLevel（初期0）、波打ちぎわは z=0。砂浜は +z（カメラ側）へゆるく上がる（坂 SLOPE=0.05）。海は -z。
// API
//   beach (Scene), setBeachEnv('day'|'dusk'), setSea(t, {level, amp})：波の動きと海面の高さ（level を上げると砂浜が沈む）
//   floorY(z)：砂浜・海底の高さ
//   makeSwimmers(n, seed, {x0,x1,z0,z1})：浜に並ぶ人（makePerson）。set(k, t, {wade})：k=0 は浜で待つ、1 で海へ入って腰まで浸かる
//   makeFarCrowd(n, seed, {x0,x1,z0,z1})：遠くまで続く人の群れ（InstancedMesh の小さな人形）。set(k, t) で浜→海へ
//   makeGauge()：海に立つ目盛りの柱（潮位計）。userData.setMark(y) で赤い線の高さ、userData.labels で目盛りの文字
//   PARASOLS：パラソル（波打ちぎわから順に沈む）
// =====================================================
const beach = new THREE.Scene();
const sky = makeSky(); beach.add(sky);
beach.fog = new THREE.Fog(0xcfe6f5, 80, 520);
const hemi = new THREE.HemisphereLight(0xffffff, 0x9a8a6a, 1.1); beach.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(25, 40, 30); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); sun.shadow.bias = -0.0005;
beach.add(sun);

const SLOPE = 0.05;
const floorY = (z) => z * SLOPE;
// sand + seabed: one sloped plane
const sandTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${150 + r() * 60},${120 + r() * 50},${70 + r() * 40},${r() * 0.25})`; g.fillRect(r() * w, r() * h, 2, 2); } });
sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.repeat.set(60, 30);
const sandM = new THREE.MeshLambertMaterial({ map: sandTex });
const sand = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), sandM); sand.rotation.x = -Math.PI / 2 - Math.atan(SLOPE); sand.position.set(0, 0, 0); sand.receiveShadow = true; beach.add(sand);
// wet sand band
const wetM = new THREE.MeshLambertMaterial({ color: '#c9b17e', transparent: true, opacity: 0.8 });
const wet = new THREE.Mesh(new THREE.PlaneGeometry(900, 3), wetM); wet.rotation.x = -Math.PI / 2 - Math.atan(SLOPE); beach.add(wet);

// sea surface with waves
const SEG = 90;
const seaGeo = new THREE.PlaneGeometry(900, 520, SEG, 60); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, 0, -250);
const seaBase = seaGeo.attributes.position.array.slice();
const seaM = new THREE.MeshLambertMaterial({ color: '#2f86b8', flatShading: true, transparent: true, opacity: 0.93 });
const sea = new THREE.Mesh(seaGeo, seaM); sea.receiveShadow = true; beach.add(sea);
const foamM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });
const foam = new THREE.Mesh(new THREE.PlaneGeometry(900, 0.9), foamM); foam.rotation.x = -Math.PI / 2; beach.add(foam);
let seaLevel = 0;
function setSea(t, o = {}) {
  seaLevel = o.level ?? 0; const amp = o.amp ?? 0.18;
  const p = seaGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = seaBase[i], z = seaBase[i + 2];
    p[i + 1] = seaLevel + Math.sin(x * 0.11 + t * 1.3) * amp * 0.6 + Math.sin(z * 0.23 + t * 1.9) * amp + Math.sin((x + z) * 0.05 - t * 0.7) * amp * 0.5;
  }
  seaGeo.attributes.position.needsUpdate = true; seaGeo.computeVertexNormals();
  const shoreZ = seaLevel / SLOPE + Math.sin(t * 1.2) * 0.6;
  foam.position.set(0, seaLevel + 0.03, shoreZ); wet.position.set(0, floorY(shoreZ + 1.4) + 0.02, shoreZ + 1.4);
}

// far headland and hills
{
  const hillM = mat('#5f8f5a', { flatShading: true }), rockM = mat('#8a8478', { flatShading: true });
  const r = rng(6);
  for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(30 + r() * 25, 18 + r() * 16, 6), hillM); h.position.set(-260 + i * 22, 0, -140 - r() * 40); beach.add(h); }
  const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(6, 0), rockM); rk.position.set(70, 0, -90); beach.add(rk);
}
// parasols along the beach (closer to sea first)
const PARASOLS = [];
{
  const r = rng(13); const cols = ['#e2574c', '#f2c14e', '#4fa3d1', '#7bc47f', '#f08ab0'];
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Group(); const x = -40 + (i % 13) * 6.5 + r() * 2, z = 4 + Math.floor(i / 13) * 7 + r() * 2.5;
    const pole = box(0.08, 2.4, 0.08, mat('#eeeeee')); pole.position.y = 1.2; g.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), mat(cols[i % cols.length], { flatShading: true })); top.position.y = 2.4; top.castShadow = true; g.add(top);
    const towel = box(0.9, 0.03, 1.8, mat(cols[(i + 2) % cols.length])); towel.position.set(0.9, 0.02, 0.3); g.add(towel);
    g.position.set(x, floorY(z), z); g.rotation.x = Math.atan(SLOPE) * 0; beach.add(g); PARASOLS.push({ g, z });
  }
}

// swimmers: near people (makePerson)
function makeSwimmers(n, seed, { x0 = -10, x1 = 10, z0 = 2, z1 = 8 } = {}) {
  const r = rng(seed); const list = [];
  for (let i = 0; i < n; i++) { const p = randPerson(r); beach.add(p); list.push({ p, x: x0 + r() * (x1 - x0), z: z0 + r() * (z1 - z0), d: r(), ph: r() * 9, dz: 6 + r() * 6 }); }
  function set(k, t, o = {}) {
    list.forEach((s, i) => {
      s.p.visible = k >= 0; if (!s.p.visible) return;
      const u = Math.max(0, Math.min(1, (k - s.d * 0.3) / 0.7));
      const z = s.z - u * (s.z + s.dz);
      const y = Math.max(floorY(z), floorY(z));
      s.p.position.set(s.x, y, z); s.p.rotation.y = Math.PI;
      const running = u > 0 && u < 1;
      const ph = t * 9 + s.ph;
      s.p.userData.legs.forEach((l, j) => l.rotation.x = running ? Math.sin(ph + j * Math.PI) * 0.7 : 0);
      s.p.userData.arms.forEach((a, j) => a.rotation.x = running ? -Math.sin(ph + j * Math.PI) * 0.6 : (u >= 1 ? -2.4 + Math.sin(t * 3 + i) * 0.3 : 0));
      if (!running && u < 1 && o.look) s.p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.5;
    });
  }
  return { list, set };
}
// far crowd: tiny instanced figures
function makeFarCrowd(n, seed, { x0 = -200, x1 = 200, z0 = 2, z1 = 20 } = {}) {
  const r = rng(seed);
  const geo = new THREE.CapsuleGeometry(0.22, 1.1, 2, 5); geo.translate(0, 0.77, 0);
  const m = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const inst = new THREE.InstancedMesh(geo, m, n); beach.add(inst);
  const cols = ['#e2574c', '#f2c14e', '#4fa3d1', '#7bc47f', '#f08ab0', '#ffffff', '#3b3f4a', '#c48a5a'];
  const P = []; const c = new THREE.Color();
  for (let i = 0; i < n; i++) { let x = x0 + r() * (x1 - x0); if (Math.abs(x) < 12) x += x < 0 ? -12 : 12; P.push([x, z0 + r() * (z1 - z0), r(), 6 + r() * 10]); c.set(cols[i % cols.length]); inst.setColorAt(i, c); }
  const o = new THREE.Object3D();
  function set(k, t) {
    inst.visible = k >= 0;
    P.forEach(([x, z0_, d, dz], i) => {
      const u = Math.max(0, Math.min(1, (k - d * 0.3) / 0.7)); const z = z0_ - u * (z0_ + dz);
      o.position.set(x, floorY(z) + (u > 0 && u < 1 ? Math.abs(Math.sin(t * 9 + i)) * 0.15 : 0), z); o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  }
  return { inst, set };
}
// tide gauge pole
function makeGauge() {
  const g = new THREE.Group();
  const tex = canvasTex(128, 1024, (c, w, h) => {
    c.fillStyle = '#f7f7f2'; c.fillRect(0, 0, w, h);
    for (let i = 0; i <= 40; i++) { const y = h - i * (h / 40); c.fillStyle = i % 2 ? '#e2574c' : '#1d2230'; c.fillRect(0, y - 3, i % 5 === 0 ? w : w * 0.55, 6); }
  });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), new THREE.MeshLambertMaterial({ map: tex })); pole.position.y = 0; g.add(pole); // spans -2..2
  const mark = box(0.75, 0.03, 0.56, new THREE.MeshBasicMaterial({ color: 0xff3b30 })); g.add(mark);
  g.userData.setMark = (y) => { mark.position.y = y; };
  return g;
}
const ENV = {
  day: { top: '#4f97e0', bot: '#dff1fb', fog: '#cfe6f5', hi: 1.15, si: 1.5, sc: '#fff4e0', sea: '#2f86b8' },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#e0b89c', hi: 0.95, si: 1.1, sc: '#ffc89a', sea: '#3a6f9a' },
};
function setBeachEnv(e) {
  const E = ENV[e]; sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  beach.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); seaM.color.set(E.sea);
}
setBeachEnv('day'); setSea(0);

export { beach, setBeachEnv, setSea, floorY, makeSwimmers, makeFarCrowd, makeGauge, PARASOLS, SLOPE };
