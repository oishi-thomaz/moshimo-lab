import * as THREE from 'three';
import { rng, canvasTex } from '../lib.js';

// =====================================================
// EARTH: stylized globe in space (radius 10) with stars, atmosphere glow, optional moon.
// API
//   space (Scene), earth (Group: rotate .rotation.y), globe (Mesh), moon (Mesh, hidden by default)
//   latLon(lat, lon, r=10.05) -> Vector3 in earth-local coords (add children to `earth`)
//   faceLon(lon, lat) -> earth.rotation to bring that place toward +z (camera side)
//   setEarthNight(k 0..1) — darken the day side, show city lights
// =====================================================
const R = 10;
const space = new THREE.Scene();
space.background = new THREE.Color('#03050b');
const amb = new THREE.AmbientLight(0x8899bb, 0.55); space.add(amb);
const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-30, 12, 25); space.add(sun);

// coarse continents (lon, lat) — stylized, not survey-accurate
const CONT = [
  [[-168, 66], [-140, 70], [-110, 72], [-85, 70], [-75, 62], [-62, 58], [-55, 50], [-66, 44], [-76, 35], [-81, 30], [-80, 25], [-90, 29], [-97, 26], [-97, 20], [-90, 16], [-83, 9], [-79, 8], [-86, 14], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 41], [-124, 48], [-133, 56], [-150, 60], [-165, 60]],
  [[-79, 8], [-75, 11], [-63, 10], [-50, 0], [-35, -6], [-39, -15], [-48, -26], [-58, -35], [-65, -42], [-68, -52], [-74, -50], [-73, -38], [-71, -25], [-76, -14], [-81, -5], [-78, 2]],
  [[-17, 21], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [42, -2], [40, -10], [35, -20], [32, -28], [20, -35], [15, -27], [12, -15], [9, -2], [9, 4], [-8, 4], [-17, 14]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 57], [5, 60], [10, 64], [20, 70], [30, 70], [45, 68], [60, 70], [80, 73], [100, 76], [130, 72], [160, 70], [180, 68], [178, 62], [160, 58], [155, 50], [140, 52], [135, 43], [128, 38], [127, 34], [121, 31], [122, 25], [110, 20], [108, 11], [104, 9], [100, 14], [98, 8], [103, 1], [98, 17], [92, 22], [88, 22], [80, 15], [77, 8], [73, 18], [67, 25], [57, 25], [52, 28], [48, 30], [56, 26], [57, 23], [52, 16], [43, 13], [35, 28], [35, 34], [27, 37], [26, 41], [20, 40], [18, 40], [12, 44], [8, 44], [3, 43]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [151, -34], [145, -39], [138, -35], [131, -31], [117, -35], [115, -33], [113, -26]],
  [[-180, -72], [-120, -73], [-60, -65], [0, -70], [60, -67], [120, -66], [180, -72], [180, -90], [-180, -90]],
  [[-60, 82], [-30, 83], [-20, 75], [-40, 65], [-50, 62], [-55, 70], [-70, 78]],
  [[130.9, 34.0], [135.5, 35.6], [139.9, 38.5], [141.4, 41.4], [141.9, 39.5], [140.8, 35.7], [138.8, 34.6], [135.8, 33.4], [131.5, 31.5], [129.7, 33.2]],
  [[140, 41.5], [145.6, 43.3], [142, 45.5], [140, 43]],
  [[-5, 50], [1, 51], [-1, 54], [-3, 58], [-6, 57], [-5, 53]],
  [[95, 5], [105, -6], [114, -8], [118, 0], [117, 7], [110, 2], [101, 2]],
  [[131, -1], [141, -3], [150, -10], [143, -9], [135, -4]],
  [[44, -12], [50, -15], [48, -25], [44, -24]],
  [[166, -46], [174, -41], [178, -38], [172, -34], [168, -44]],
];
const texW = 2048, texH = 1024;
const P = ([lo, la]) => [(lo + 180) / 360 * texW, (90 - la) / 180 * texH];
const dayTex = canvasTex(texW, texH, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a6aa3'); gr.addColorStop(0.5, '#1f5f9a'); gr.addColorStop(1, '#2a6aa3'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (const poly of CONT) {
    g.beginPath(); poly.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
    const la = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    g.fillStyle = la < -60 || la > 70 ? '#eef3f7' : Math.abs(la) < 25 ? '#6fae5e' : '#86b56a'; g.fill();
  }
  // deserts
  g.fillStyle = 'rgba(200,184,120,.45)';
  for (const [lo, la, rw, rh] of [[15, 23, 110, 45], [45, 24, 45, 25], [133, -25, 55, 28], [100, 42, 60, 18]]) { const [x, y] = P([lo, la]); g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill(); }
  // clouds
  const r = rng(3); g.fillStyle = 'rgba(255,255,255,.16)';
  for (let i = 0; i < 90; i++) { g.beginPath(); g.ellipse(r() * w, 80 + r() * (h - 160), 20 + r() * 50, 5 + r() * 8, 0, 0, 7); g.fill(); }
});
const lightTex = canvasTex(texW, texH, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const r = rng(9);
  const hubs = [[139.7, 35.7, 30], [135.5, 34.7, 18], [-74, 40.7, 22], [-118, 34, 16], [-87, 42, 12], [2.3, 48.9, 14], [-0.1, 51.5, 14], [13, 52, 10], [77, 28.6, 18], [72.8, 19, 16], [116, 40, 18], [121.5, 31.2, 20], [113, 23, 20], [-46.6, -23.5, 14], [31, 30, 10], [127, 37.5, 14], [151, -33.9, 8], [-99, 19.4, 14], [37.6, 55.7, 12], [28, -26, 8], [3.4, 6.5, 8], [106.8, -6.2, 14]];
  for (const [lo, la, n] of hubs) { const [x, y] = P([lo, la]); for (let i = 0; i < n * 6; i++) { const a = r() * 6.28, d = Math.pow(r(), 2) * n * 1.4; g.fillStyle = `rgba(255,${200 + r() * 40},${120 + r() * 60},${0.5 + r() * 0.5})`; g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 2, 2); } }
});
const globeM = new THREE.MeshLambertMaterial({ map: dayTex, emissiveMap: lightTex, emissive: 0xffffff, emissiveIntensity: 0 });
const earth = new THREE.Group(); space.add(earth);
const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), globeM); earth.add(globe);
// atmosphere
const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 48, 32), new THREE.ShaderMaterial({
  transparent: true, side: THREE.BackSide, depthWrite: false,
  uniforms: { c: { value: new THREE.Color('#6fb7ff') } },
  vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: 'uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.75 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.9); }'
}));
space.add(atm);
// stars
{
  const r = rng(1); const n = 1500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * 6.283, d = 900; const s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * d, u * d, Math.sin(a) * s * d], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  space.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false })));
}
const moon = new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 24), new THREE.MeshLambertMaterial({ color: '#c9c9c4' })); moon.position.set(40, 6, -60); moon.visible = false; space.add(moon);

// SphereGeometry u=0 at lon -180 seen from +x? three's sphere: u maps phi from 0..2PI starting at -x axis going toward +z...
// position(lat,lon) consistent with the texture mapping above:
function latLon(lat, lon, r = R * 1.005) {
  const phi = (lon + 180) * Math.PI / 180, th = (90 - lat) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
}
// rotation.y of `earth` that brings longitude `lon` to face +z
function faceLon(lon) { const v = latLon(0, lon, 1); return Math.atan2(-v.x, v.z); }
function setEarthNight(k) { globeM.emissiveIntensity = k * 1.1; sun.intensity = 2.0 * (1 - k * 0.85); amb.intensity = 0.55 * (1 - k * 0.6); }
// keep atmosphere centered
atm.position.copy(earth.position);

export { space, earth, globe, globeM, moon, latLon, faceLon, setEarthNight, sun as spaceSun, R as EARTH_R };
