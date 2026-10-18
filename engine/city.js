import * as THREE from 'three';
import { W, H, RW, RH, canvas, renderer, rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, canvasTex, windowTextures, makeSky, SKIN, HAIR, SHIRT, PANTS, makePerson, poseWalk, randPerson, walkAlong, qTex, makeQ } from './lib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// =====================================================
// CITY
// =====================================================
const city = new THREE.Scene();
const sky = makeSky(); city.add(sky);
city.fog = new THREE.Fog(0xffffff, 60, 300);
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); city.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 });
sun.shadow.bias = -0.0005;
city.add(sun); city.add(sun.target);

const asphalt = mat('#4b515c');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), asphalt); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; city.add(ground);
const sidewalkM = mat('#c3c6cc'), lotM = mat('#5d636d'), lineM = mat('#e9ecef'), dirtM = mat('#7d7468');
const winMats = [];

// ---- static geometry batching (one draw call per material) ----
const STATIC = new Map();
function sbox(w, h, d, m, x, y, z, cast = false) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z);
  if (!STATIC.has(m)) STATIC.set(m, { gs: [], cast: false });
  const e = STATIC.get(m); e.gs.push(g); e.cast = e.cast || cast;
}
function sgeo(g, m, cast = true) {
  if (!STATIC.has(m)) STATIC.set(m, { gs: [], cast: false });
  const e = STATIC.get(m); e.gs.push(g); e.cast = e.cast || cast;
}
function flushStatic() {
  for (const [m, e] of STATIC) {
    const merged = mergeGeometries(e.gs.map(g => g.index ? g.toNonIndexed() : g));
    const mesh = new THREE.Mesh(merged, m); mesh.castShadow = e.cast; mesh.receiveShadow = true; city.add(mesh);
  }
}
const WALLS = ['#c9cfd9', '#b9c3d1', '#d8d2c8', '#aeb9c8', '#cfd6dc', '#bfb8ae'];
const BMATS = WALLS.map((wc, i) => {
  const { map, emi } = windowTextures(1000 + i * 77, wc);
  const m = new THREE.MeshLambertMaterial({ map, emissiveMap: emi, emissive: 0xffffff, emissiveIntensity: 0 });
  winMats.push(m); return m;
});
const GRID = 48, RX0 = 12.5, RZ0 = -18; // roads: along x at z = RX0 + k*GRID ; along z at x = RZ0 + k*GRID
const ROADW = 8;
function crosswalks(cx, cz) {
  for (let i = -3; i <= 3; i++) for (const side of [-1, 1]) {
    sbox(0.7, 0.02, 3.2, lineM, cx + i * 1.1, 0.02, cz + side * (ROADW / 2 + 2));
    sbox(3.2, 0.02, 0.7, lineM, cx + side * (ROADW / 2 + 2), 0.02, cz + i * 1.1);
  }
}
function centerLines(axis, fixed, from, to) {
  for (let v = from; v < to; v += 6) {
    if (axis === 'x') sbox(3, 0.02, 0.2, lineM, v, 0.02, fixed); else sbox(0.2, 0.02, 3, lineM, fixed, 0.02, v);
  }
}
function building(x, z, w, d, h, r, colorIdx) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // faces: +x,-x,+y,-y,+z,-z (4 verts each)
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f === 2 || f === 3) { uv.setXY(i, 0.003, 0.997); continue; }
    const len = (f < 2) ? d : w;
    uv.setXY(i, uv.getX(i) * len / 24, uv.getY(i) * h / 24);
  }
  g.translate(x, h / 2, z);
  sgeo(g, BMATS[colorIdx % BMATS.length], true);
}

// streetlights
const bulbM = new THREE.MeshBasicMaterial({ color: 0xfff2cf }), poleM = mat('#3b3f47'), trunkM = mat('#6b4f3a'), leafA = mat('#5f9a58', { flatShading: true }), leafB = mat('#6aa862', { flatShading: true });
const streetLights = [];
function streetLight(x, z, dir) {
  sbox(0.14, 5, 0.14, poleM, x, 2.5, z, true);
  sbox(0.1, 0.1, 1.4, poleM, x, 4.95, z + dir * 0.7);
  sbox(0.45, 0.12, 0.6, bulbM, x, 4.85, z + dir * 1.3);
  streetLights.push(new THREE.Vector3(x, 4.7, z + dir * 1.3));
}
function tree(x, z, r) {
  sbox(0.22, 1.4, 0.22, trunkM, x, 0.85, z, true);
  const c = new THREE.IcosahedronGeometry(1.0 + r() * 0.3, 0); c.translate(x, 2.3, z);
  sgeo(c, r() < .5 ? leafA : leafB, true);
}

// mini store markers for aerial shot
const storeGlows = [];
const glowTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.25, 'rgba(160,255,235,.75)'); gr.addColorStop(1, 'rgba(60,220,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
function miniStore(x, z, rot) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = rot;
  const body = box(8, 3.4, 6, mat('#eef0ee')); body.position.y = 1.7; grp.add(body);
  const gm = new THREE.MeshLambertMaterial({ color: 0x333333, emissive: 0xfff1cf, emissiveIntensity: 0 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(7, 2.2, 0.1), gm); glass.position.set(0, 1.3, 3.02); grp.add(glass);
  const band = box(8.1, 0.6, 0.2, mat('#1fb3a1', { emissive: 0x1fb3a1, emissiveIntensity: 0 })); band.position.set(0, 3.0, 3.05); grp.add(band);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  sp.scale.set(26, 26, 1); sp.position.set(0, 3, 4); grp.add(sp);
  city.add(grp);
  storeGlows.push({ grp, gm, band: band.material, sp, d: Math.hypot(x, z) });
}

// procedural city grid
{
  const r = rng(42);
  const N = 4;
  for (let i = -N; i <= N; i++) {
    // roads lines and sidewalks
    const zr = RX0 + i * GRID, xr = RZ0 + i * GRID;
    centerLines('x', zr, -N * GRID - 30, N * GRID + 30);
    centerLines('z', xr, -N * GRID - 30, N * GRID + 30);
  }
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) crosswalks(RZ0 + i * GRID, RX0 + j * GRID);
  let ci = 0;
  for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) {
    // block bounds
    const x0 = RZ0 + i * GRID + ROADW / 2, x1 = RZ0 + (i + 1) * GRID - ROADW / 2;
    const z0 = RX0 + j * GRID + ROADW / 2, z1 = RX0 + (j + 1) * GRID - ROADW / 2;
    sbox(x1 - x0, 0.15, z1 - z0, sidewalkM, (x0 + x1) / 2, 0.075, (z0 + z1) / 2);
    const isMain = (i === 0 && j === -1);
    const bx0 = x0 + 2, bx1 = x1 - 2, bz0 = z0 + 2, bz1 = z1 - 2;
    if (isMain) continue;
    // fill block with buildings along the perimeter
    const nx = 3, nz = 3;
    const cw = (bx1 - bx0) / nx, cd = (bz1 - bz0) / nz;
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
      if (a === 1 && b === 1 && r() < 0.6) continue;
      const w = cw - 1 - r() * 2, d = cd - 1 - r() * 2;
      const far = Math.hypot((x0 + x1) / 2, (z0 + z1) / 2);
      const h = 6 + r() * (far < 80 ? 22 : 30);
      building(bx0 + cw * (a + .5), bz0 + cd * (b + .5), w, d, h, r, ci++);
    }
    // a convenience store somewhere in many blocks (for aerial shot)
    if (r() < 0.75) {
      const corner = Math.floor(r() * 4);
      const sx = corner % 2 ? x1 - 7 : x0 + 7, sz = corner < 2 ? z1 - 0.5 : z0 + 0.5;
      // put on the outer sidewalk corner, facing road (approx)
      miniStore(sx, corner < 2 ? z1 + 0.0 : z0 - 0.0, corner < 2 ? 0 : Math.PI);
    }
  }
  // main block: x0=-14 .. x1=26, z0=-31.5 .. z1=8.5
  const r2 = rng(7);
  building(-8.5, -18, 9, 20, 18, r2, 1);
  building(3, -24, 12, 12, 26, r2, 2);
  building(14, -20, 10, 18, 14, r2, 3);
  building(22, -4, 6, 14, 11, r2, 4);
  building(-11.5, 1, 4, 9, 9, r2, 5);
  building(14.5, 2.5, 7, 6, 7, r2, 0);
  // street lights & trees on main roads
  for (let x = -60; x <= 60; x += 16) { if (Math.abs(x + 4) > 12) streetLight(x + 4, 7.3, 1); if (Math.abs(x - 4) > 12) streetLight(x - 4, 17.7, -1); }
  const rt = rng(99);
  for (let x = -50; x <= 50; x += 11) { if (Math.abs(x) > 10) tree(x, 7.6, rt); if (Math.abs(x + 5) > 12) tree(x + 5, 17.6, rt); }
}

// lot in front of store
const lot = box(18, 0.16, 8.6, lotM); lot.castShadow = false; lot.position.set(0, 0.08, 2.0); city.add(lot);
for (let i = -3; i <= 3; i++) sbox(0.12, 0.02, 4, lineM, i * 2.6, 0.17, 3.6);
flushStatic();
const dirt = box(12.4, 0.18, 8.4, dirtM); dirt.castShadow = false; dirt.position.set(0, 0.09, -4); dirt.visible = false; city.add(dirt);
const dirtStones = new THREE.Group(); { const r = rng(5); for (let i = 0; i < 40; i++) { const s = box(0.15 + r() * 0.25, 0.08, 0.15 + r() * 0.25, mat('#9a9186')); s.position.set(-5.8 + r() * 11.6, 0.2, -8 + r() * 8); dirtStones.add(s); } } dirtStones.visible = false; city.add(dirtStones);

// ---------- hero store ----------
const store = new THREE.Group(); store.position.set(0, 0, -4); city.add(store);
const storeLight = new THREE.PointLight(0xfff0d0, 0, 22, 1.6); storeLight.position.set(0, 3, 3); city.add(storeLight);
const glassTex = canvasTex(1024, 256, (g, w, h) => {
  g.fillStyle = '#fff7e2'; g.fillRect(0, 0, w, h);
  // ceiling lights
  for (let i = 0; i < 8; i++) { g.fillStyle = '#ffffff'; g.fillRect(40 + i * 125, 10, 80, 10); }
  // shelves
  const cols = ['#e46a5b', '#f2c14e', '#5fb38a', '#4f8fd1', '#c47ad1', '#f08a4b'];
  for (let s = 0; s < 4; s++) {
    const sx = 330 + s * 170;
    g.fillStyle = '#d9d2c2'; g.fillRect(sx, 95, 120, 150);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 7; k++) { g.fillStyle = cols[(s + row + k) % cols.length]; g.fillRect(sx + 6 + k * 16, 105 + row * 36, 12, 22); }
  }
  // counter
  g.fillStyle = '#b9b3a6'; g.fillRect(30, 160, 240, 96); g.fillStyle = '#8a8478'; g.fillRect(30, 160, 240, 10);
  // clerk silhouette
  g.fillStyle = '#3aa597'; g.fillRect(120, 110, 50, 56); g.fillStyle = '#f1c9a5'; g.fillRect(128, 72, 34, 38); g.fillStyle = '#222'; g.fillRect(126, 66, 38, 12);
  // ATM
  g.fillStyle = '#5c6575'; g.fillRect(900, 110, 80, 146); g.fillStyle = '#9fd6ff'; g.fillRect(912, 130, 56, 40);
  // mullions
  g.fillStyle = 'rgba(80,90,100,.85)'; for (let i = 0; i <= 6; i++) g.fillRect(i * (w / 6) - 4, 0, 8, h); g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  // door
  g.fillStyle = 'rgba(80,90,100,.85)'; g.fillRect(w / 2 - 70, 0, 6, h); g.fillRect(w / 2 + 64, 0, 6, h);
});
const glassM = new THREE.MeshLambertMaterial({ map: glassTex, emissiveMap: glassTex, emissive: 0xffffff, emissiveIntensity: 0.9 });
{
  const body = box(12, 4, 8, mat('#f4f5f2')); body.position.set(0, 2, 0); store.add(body);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.75), glassM); glass.position.set(0, 1.55, 4.01); store.add(glass);
  const signTex = canvasTex(1024, 96, (g, w, h) => {
    g.fillStyle = '#1fb3a1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f7c948'; g.fillRect(0, h - 18, w, 18);
    g.fillStyle = '#ffffff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillText('もしもマート', w / 2, 40);
  });
  const signM = new THREE.MeshLambertMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.95, 0.3), [mat('#1fb3a1'), mat('#1fb3a1'), mat('#1fb3a1'), mat('#1fb3a1'), signM, mat('#1fb3a1')]);
  band.position.set(0, 3.45, 4.05); store.add(band);
  const roof = box(12.4, 0.2, 8.4, mat('#d9dcdf')); roof.position.set(0, 4.05, 0); store.add(roof);
  const ac = box(1.4, 0.7, 1, mat('#b9bec4')); ac.position.set(3, 4.5, -2); store.add(ac);
  // pole sign
  const pole = box(0.25, 6.5, 0.25, mat('#8d939b')); pole.position.set(7.5, 3.25, 7.5); store.add(pole);
  const psTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1fb3a1'; g.fillRect(0, 0, w, h); g.fillStyle = '#f7c948'; g.fillRect(0, h - 40, w, 40);
    g.fillStyle = '#fff'; g.font = '900 110px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('24', w / 2, 100);
  });
  const psM = new THREE.MeshLambertMaterial({ map: psTex, emissiveMap: psTex, emissive: 0xffffff, emissiveIntensity: 0.6 });
  const ps = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.4), psM); ps.position.set(7.5, 6.6, 7.5); ps.castShadow = true; store.add(ps);
  store.userData.mats = [glassM, signM, psM];
}

// burst particles
const burst = new THREE.Group(); city.add(burst);
{
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), m);
    c.userData = { o: new THREE.Vector3(-6 + r() * 12, 0.2 + r() * 4, -8 + r() * 8), v: new THREE.Vector3((r() - .5) * 6, 2 + r() * 6, (r() - .5) * 6), s: 0.5 + r() };
    burst.add(c);
  }
  burst.visible = false;
}
function setBurst(u) { // u in [0,1]
  burst.visible = u > 0 && u < 1;
  for (const c of burst.children) {
    const { o, v, s } = c.userData;
    c.position.set(o.x + v.x * u, o.y + v.y * u - 2 * u * u, o.z + v.z * u);
    c.scale.setScalar(s * (1 - u));
    c.material.opacity = 1 - u;
    c.rotation.set(u * 6 * s, u * 4, 0);
  }
}
function setStore(k) { // k scale 0..1
  store.visible = k > 0.001;
  store.scale.set(k, k, k);
  dirt.visible = k < 0.999; dirtStones.visible = k < 0.5;
}

// ATM ghost
const ghostM = new THREE.LineBasicMaterial({ color: 0x8ff3ff, transparent: true, opacity: 0.8 });
const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 1.6, 0.7)), ghostM);
ghost.position.set(-1.6, 0.98, -0.8); ghost.visible = false; city.add(ghost);
const ghostFill = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x8ff3ff, transparent: true, opacity: 0.25, depthWrite: false })); ghostFill.position.copy(ghost.position); ghostFill.visible = false; city.add(ghostFill);
const ghostScr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 0.4, 0.05)), ghostM);
ghostScr.position.set(-1.6, 1.3, -0.43); ghostScr.visible = false; city.add(ghostScr);

// ---------- cars ----------
function makeCar(color) {
  const g = new THREE.Group();
  const b = box(4, 0.9, 1.8, mat(color)); b.position.y = 0.75; g.add(b);
  const c = box(2.2, 0.7, 1.6, mat('#dfe6ee')); c.position.set(-0.2, 1.5, 0); g.add(c);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), hl); l.position.set(2.01, 0.85, s * 0.6); g.add(l); }
  const tl = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), tl); l.position.set(-2.01, 0.85, s * 0.6); g.add(l); }
  for (const x of [-1.3, 1.3]) for (const s of [-1, 1]) { const w = box(0.7, 0.7, 0.25, mat('#1b1d22')); w.position.set(x, 0.35, s * 0.85); g.add(w); }
  city.add(g); return g;
}
const cars = [
  { c: makeCar('#d94b4b'), lane: 10.5, dir: 1, off: 0, sp: 9 },
  { c: makeCar('#f1f1f1'), lane: 14.5, dir: -1, off: 30, sp: 8 },
  { c: makeCar('#3b6fb6'), lane: 10.5, dir: 1, off: 55, sp: 10 },
  { c: makeCar('#2d2f36'), lane: 14.5, dir: -1, off: 80, sp: 9 },
];
const parked = [makeCar('#e7e3da'), makeCar('#566275')];
parked[0].position.set(-3.9, 0.16, 4.2); parked[0].rotation.y = Math.PI / 2;
parked[1].position.set(6.5, 0.16, 4.2); parked[1].rotation.y = -Math.PI / 2;
function updateCars(t, on = true) {
  for (const k of cars) {
    k.c.visible = on;
    const L = 160;
    let x = ((t * k.sp + k.off) % L) - L / 2;
    if (k.dir < 0) x = -x;
    k.c.position.set(x, 0, k.lane); k.c.rotation.y = k.dir > 0 ? 0 : Math.PI;
  }
}

// =====================================================
// camera & env
// =====================================================
const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);
const C = (h) => new THREE.Color(h);
const ENV = {
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#d9b49c', fn: 70, ff: 320, hs: '#ffe2c8', hg: '#4a4f5c', hi: 1.15, sc: '#ffc89a', si: 1.5, sp: [60, 22, 30], win: 0.25, bulb: 1, sl: 1 },
  night: { top: '#040a1a', bot: '#1a2850', fog: '#0f1830', fn: 50, ff: 260, hs: '#7d92cc', hg: '#141822', hi: 0.55, sc: '#9fb4ff', si: 0.35, sp: [-40, 40, 20], win: 1.0, bulb: 1, sl: 1.6 },
  dark: { top: '#02050e', bot: '#0d1630', fog: '#080e1e', fn: 30, ff: 200, hs: '#5a6c9c', hg: '#0d1018', hi: 0.38, sc: '#8fa4e8', si: 0.25, sp: [-40, 40, 20], win: 0.45, bulb: 1, sl: 1.3 },
};
const slLights = [];
for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xffe2b0, 0, 16, 1.4); city.add(l); slLights.push(l); }
function setEnv(e, focus) {
  const E = ENV[e];
  sky.material.uniforms.top.value.copy(C(E.top)); sky.material.uniforms.bot.value.copy(C(E.bot));
  city.fog.color.copy(C(E.fog)); city.fog.near = E.fn; city.fog.far = E.ff;
  hemi.color.copy(C(E.hs)); hemi.groundColor.copy(C(E.hg)); hemi.intensity = E.hi;
  sun.color.copy(C(E.sc)); sun.intensity = E.si;
  sun.position.set(focus.x + E.sp[0], E.sp[1], focus.z + E.sp[2]); sun.target.position.copy(focus);
  for (const m of winMats) m.emissiveIntensity = E.win;
  // nearest streetlights get real lights
  const sorted = streetLights.map(v => [v, v.distanceTo(focus)]).sort((a, b) => a[1] - b[1]);
  slLights.forEach((l, i) => { l.position.copy(sorted[i][0]); l.intensity = e === 'dusk' ? 6 : 22 * E.sl / 1.6; });
}
function setStoreLights(on) {
  for (const m of store.userData.mats) m.emissiveIntensity = on * (m === glassM ? 1.0 : 0.85);
  storeLight.intensity = on * 30;
}
function look(px, py, pz, tx, ty, tz, fov = 55) { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); cam.fov = fov; cam.updateProjectionMatrix(); }

export { BMATS, C, ENV, GRID, ROADW, RX0, RZ0, STATIC, WALLS, asphalt, building, bulbM, burst, cam, cars, centerLines, city, crosswalks, dirt, dirtM, dirtStones, flushStatic, ghost, ghostFill, ghostM, ghostScr, glassM, glassTex, glowTex, ground, hemi, leafA, leafB, lineM, look, lot, lotM, makeCar, miniStore, parked, poleM, sbox, setBurst, setEnv, setStore, setStoreLights, sgeo, sidewalkM, sky, slLights, store, storeGlows, storeLight, streetLight, streetLights, sun, tree, trunkM, updateCars, winMats };
