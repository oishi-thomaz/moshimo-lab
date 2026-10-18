import * as THREE from 'three';
import { rng, mat, canvasTex, clamp } from '../lib.js';

// =====================================================
// JAPAN MAP: stylized low-poly Japan on a flat sea, seen from above.
// Coordinates: lon/lat -> x/z via ll(lon, lat). 1 unit ≈ 11km (k=10 per degree of latitude).
// API
//   japan (Scene), ll(lon,lat) -> Vector3 on land surface, CITY {tokyo:[lon,lat],...}
//   setMapEnv('day'|'night'|'dusk')
//   landM (land material; color can be tinted), dots: InstancedMesh of population dots (setDots(fn))
//   makeRing(color) -> mesh ring for ripples (scale it), addPin(lon,lat,color) -> group
// =====================================================
const K = 10, LON0 = 137, LAT0 = 36, CL = Math.cos(36 * Math.PI / 180);
const ll = (lon, lat, y = 0) => new THREE.Vector3((lon - LON0) * K * CL, y, -(lat - LAT0) * K);

const SHAPES = {
  honshu: [[130.9, 34.0], [131.4, 34.42], [132.0, 34.88], [132.6, 35.45], [133.3, 35.58], [134.2, 35.55], [135.2, 35.75], [135.7, 35.52], [136.0, 35.75], [136.1, 36.25], [136.7, 36.8], [136.75, 37.35], [137.3, 37.5], [137.0, 36.95], [137.6, 36.92], [138.25, 37.15], [139.0, 37.9], [139.55, 38.6], [139.85, 39.1], [140.0, 39.9], [139.9, 40.6], [140.3, 41.1], [140.6, 41.25], [140.9, 41.0], [141.2, 41.4], [141.45, 41.4], [141.4, 40.6], [141.85, 40.0], [142.05, 39.5], [141.6, 38.9], [141.5, 38.3], [141.0, 38.2], [140.95, 37.5], [140.9, 36.9], [140.6, 36.3], [140.85, 35.72], [140.4, 35.15], [139.85, 34.9], [139.8, 35.3], [139.75, 35.6], [139.65, 35.3], [139.6, 35.12], [139.15, 35.25], [139.1, 34.65], [138.85, 34.6], [138.8, 35.0], [138.4, 34.65], [137.6, 34.65], [137.0, 34.7], [136.9, 35.0], [136.6, 34.6], [136.9, 34.3], [136.3, 34.1], [135.85, 33.45], [135.1, 33.9], [135.3, 34.6], [134.6, 34.75], [133.9, 34.55], [133.3, 34.4], [132.5, 34.3], [131.9, 34.0], [131.0, 33.95]],
  shikoku: [[132.6, 33.95], [133.5, 34.3], [134.2, 34.35], [134.6, 34.2], [134.7, 33.85], [134.3, 33.25], [133.6, 33.5], [133.0, 32.75], [132.5, 33.0], [132.0, 33.35], [132.4, 33.55]],
  kyushu: [[130.9, 33.95], [131.6, 33.6], [131.9, 33.1], [131.8, 32.5], [131.45, 31.6], [131.1, 31.4], [130.7, 31.0], [130.6, 31.6], [130.2, 31.25], [130.15, 31.8], [130.6, 32.4], [130.15, 32.75], [129.75, 32.65], [129.65, 33.2], [130.0, 33.5], [130.4, 33.62]],
  hokkaido: [[140.0, 41.45], [140.7, 41.75], [141.0, 42.3], [141.6, 42.6], [142.3, 42.2], [143.3, 41.9], [143.5, 42.6], [144.4, 42.95], [145.6, 43.3], [145.2, 43.6], [145.3, 44.3], [144.3, 44.0], [143.3, 44.4], [142.4, 45.25], [141.95, 45.5], [141.6, 45.2], [141.8, 44.4], [141.4, 43.7], [141.0, 43.2], [140.4, 43.3], [140.0, 42.7], [139.8, 42.2]],
  okinawa: [[127.65, 26.08], [127.9, 26.4], [128.25, 26.8], [128.1, 26.85], [127.85, 26.6], [127.7, 26.35]],
};
const CITY = { sapporo: [141.35, 43.06], sendai: [140.87, 38.27], tokyo: [139.7, 35.68], nagoya: [136.9, 35.18], osaka: [135.5, 34.69], hiroshima: [132.46, 34.4], fukuoka: [130.4, 33.59], kochi: [133.53, 33.56], shizuoka: [138.38, 34.98], wakayama: [135.17, 34.23], miyazaki: [131.42, 31.91], naha: [127.68, 26.21], kagoshima: [130.56, 31.6], niigata: [139.02, 37.9], kanazawa: [136.65, 36.56] };

const japan = new THREE.Scene();
japan.background = new THREE.Color('#0d2f4f');
const hemi = new THREE.HemisphereLight(0xffffff, 0x3b5b7a, 1.2); japan.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(-60, 120, 80); japan.add(sun);
const seaM = new THREE.MeshLambertMaterial({ color: '#2b6c9e' });
const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), seaM); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.3; japan.add(sea);
// faint grid on sea
const gridTex = canvasTex(256, 256, (g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); });
gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(60, 60);
const grid = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false })); grid.rotation.x = -Math.PI / 2; grid.position.y = -0.28; japan.add(grid);

const landM = new THREE.MeshLambertMaterial({ color: '#7cc08a', flatShading: true });
const sideM = new THREE.MeshLambertMaterial({ color: '#4e8a5a' });
const landMeshes = [];
const polys = {};
for (const [name, pts] of Object.entries(SHAPES)) {
  const shape = new THREE.Shape(pts.map(([lo, la]) => { const v = ll(lo, la); return new THREE.Vector2(v.x, -v.z); }));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.35, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, [landM, sideM]); m.position.y = -0.3; japan.add(m); landMeshes.push(m);
  polys[name] = pts.map(([lo, la]) => { const v = ll(lo, la); return [v.x, v.z]; });
}
const LAND_Y = 1.2;
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c; } return c; }
const onLand = (x, z) => Object.values(polys).some(P => inPoly(x, z, P));

// mountains (low poly cones) along the spine
const mtM = new THREE.MeshLambertMaterial({ color: '#6aa874', flatShading: true });
{
  const r = rng(77);
  const spine = [[133.0, 35.0], [134.5, 35.2], [136.2, 35.7], [137.6, 36.2], [138.3, 36.0], [138.7, 35.4], [139.4, 36.7], [140.3, 37.6], [140.5, 39.0], [140.8, 40.2], [142.8, 43.5], [143.2, 43.0], [131.1, 32.8], [133.4, 33.7], [134.0, 33.9], [130.9, 32.1]];
  for (const [lo, la] of spine) for (let k = 0; k < 3; k++) {
    const v = ll(lo + (r() - .5) * 0.5, la + (r() - .5) * 0.4);
    if (!onLand(v.x, v.z)) continue;
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 + r() * 1.4, 1.6 + r() * 2.2, 5), mtM); c.position.set(v.x, LAND_Y + 0.6, v.z); c.rotation.y = r() * 3; japan.add(c);
  }
  // Fuji
  const f = ll(138.73, 35.36); const fuji = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 7), mtM); fuji.position.set(f.x, LAND_Y + 1.6, f.z); japan.add(fuji);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.5, 7), mat('#ffffff', { flatShading: true })); cap.position.set(f.x, LAND_Y + 3.1, f.z); japan.add(cap);
}

// population dots (instanced) — density weighted to big cities
const DOTS = 2400;
const dotGeo = new THREE.BoxGeometry(0.28, 0.5, 0.28); dotGeo.translate(0, 0.25, 0);
const dotM = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: 0xffd98a, emissiveIntensity: 0.2 });
const dots = new THREE.InstancedMesh(dotGeo, dotM, DOTS); dots.visible = false; japan.add(dots);
const dotPos = [];
{
  const r = rng(5);
  const cities = Object.values(CITY);
  const W = [10, 3, 30, 10, 18, 3, 6, 1, 2, 1, 1, 1.5, 1, 1.5, 1];
  const wsum = W.reduce((a, b) => a + b, 0);
  let n = 0, guard = 0;
  while (n < DOTS && guard++ < 200000) {
    let x, z;
    if (r() < 0.55) {
      let u = r() * wsum, i = 0; while (u > W[i]) { u -= W[i]; i++; }
      const c = ll(...cities[i]); const a = r() * 6.283, d = Math.pow(r(), 1.6) * 4.5;
      x = c.x + Math.cos(a) * d; z = c.z + Math.sin(a) * d;
    } else { x = -80 + r() * 160; z = -100 + r() * 210; }
    if (!onLand(x, z)) continue;
    dotPos.push([x, z, r()]); n++;
  }
  dots.count = dotPos.length;
}
const _m = new THREE.Matrix4(), _c = new THREE.Color();
// fn(i, x, z, rnd) -> {y, s, color?, hide?}
function setDots(fn) {
  dots.visible = true;
  for (let i = 0; i < dotPos.length; i++) {
    const [x, z, q] = dotPos[i];
    const o = fn(i, x, z, q) || {};
    const s = o.hide ? 0.0001 : (o.s ?? 1);
    _m.makeScale(s, s, s); _m.setPosition(x, LAND_Y + (o.y || 0), z); dots.setMatrixAt(i, _m);
    if (o.color) { _c.set(o.color); dots.setColorAt(i, _c); }
  }
  dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
}

function makeRing(color = '#ffffff', opacity = 0.8) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = LAND_Y + 0.2; japan.add(m); return m;
}
function addPin(lon, lat, color = '#ff5b4f') {
  const g = new THREE.Group(); const v = ll(lon, lat);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 6), mat('#f4f4f4')); st.position.y = 1.25; g.add(st);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 })); hd.position.y = 2.7; g.add(hd);
  g.position.set(v.x, LAND_Y, v.z); japan.add(g); return g;
}
const ENVS = {
  day: { bg: '#0d2f4f', sea: '#2b6c9e', land: '#7cc08a', side: '#4e8a5a', mt: '#6aa874', hi: 1.2, si: 1.3, dot: 0.2 },
  dusk: { bg: '#1b2440', sea: '#2a4f7a', land: '#8fb47c', side: '#567a50', mt: '#7aa070', hi: 0.9, si: 1.0, dot: 0.5 },
  night: { bg: '#050a16', sea: '#0c1b33', land: '#26364a', side: '#1a2636', mt: '#2c3e54', hi: 0.6, si: 0.35, dot: 1.2 },
};
function setMapEnv(e) {
  const E = ENVS[e]; japan.background.set(E.bg); seaM.color.set(E.sea); landM.color.set(E.land); sideM.color.set(E.side); mtM.color.set(E.mt);
  hemi.intensity = E.hi; sun.intensity = E.si; dotM.emissiveIntensity = E.dot;
}
setMapEnv('day');

export { japan, ll, CITY, setMapEnv, landM, seaM, dots, dotPos, setDots, makeRing, addPin, onLand, LAND_Y, K };
