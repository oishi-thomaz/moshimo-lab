import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';


const W = 1080, H = 1920, RW = 720, RH = 1280;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(RW, RH, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------- utils ----------
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeBack = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fade = (t, a, b, f = 0.18) => clamp(Math.min((t - a) / f, (b - t) / f));
const mat = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const box = (w, h, d, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.castShadow = true; g.receiveShadow = true; return g; };
const comma = n => Math.round(n).toLocaleString('en-US');

// ---------- textures ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function windowTextures(seed, wallColor) {
  const r = rng(seed);
  const cols = 8, rows = 8, cw = 64, ch = 64;
  const lit = [];
  for (let i = 0; i < cols * rows; i++) lit.push(r() < 0.45 ? (r() < .5 ? '#ffd98a' : '#fff1c9') : null);
  const map = canvasTex(cols * cw, rows * ch, (g) => {
    g.fillStyle = wallColor; g.fillRect(0, 0, cols * cw, rows * ch);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      g.fillStyle = '#6c7a92'; g.fillRect(x * cw + 12, y * ch + 12, cw - 24, ch - 22);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * cw + 12, y * ch + 12, cw - 24, 6);
    }
  });
  const emi = canvasTex(cols * cw, rows * ch, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, cols * cw, rows * ch);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const l = lit[y * cols + x]; if (!l) continue;
      g.fillStyle = l; g.fillRect(x * cw + 12, y * ch + 12, cw - 24, ch - 22);
    }
  });
  for (const t of [map, emi]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return { map, emi };
}

// ---------- sky ----------
function makeSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bot,top,h),1.0);
#include <colorspace_fragment>
}`
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m);
  s.renderOrder = -1;
  return s;
}

// ---------- person ----------
const SKIN = ['#f1c9a5', '#e8b98f', '#d9a57c', '#f5d3b5'];
const HAIR = ['#1d1a19', '#2c2421', '#4a3426', '#6b4a33', '#9a9a9a', '#1a1a22'];
const SHIRT = ['#2f4a7a', '#e05a4f', '#3f8f6b', '#f2c14e', '#8e6bbf', '#e9e4da', '#4fa3d1', '#d97a3a', '#59606e', '#c94f7c', '#5d8c3a', '#2b2f3a'];
const PANTS = ['#2b3346', '#3b3f4a', '#5a4a3a', '#1f2430', '#6b7a8f', '#7a6a55'];

function makePerson(opt) {
  const g = new THREE.Group();
  const skin = mat(opt.skin), shirt = mat(opt.shirt), pants = mat(opt.pants), hair = mat(opt.hair), shoe = mat('#24262b'), black = mat('#121212'), white = mat('#ffffff');
  const legs = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.12, 0.86, 0);
    const legMat = opt.skirt ? skin : pants;
    const l = box(0.17, 0.78, 0.2, legMat); l.position.y = -0.39; p.add(l);
    const sh = box(0.19, 0.1, 0.3, shoe); sh.position.set(0, -0.81, 0.04); p.add(sh);
    g.add(p); legs.push(p);
  }
  if (opt.skirt) { const sk = box(0.52, 0.38, 0.34, pants); sk.position.y = 0.78; g.add(sk); }
  const torso = box(0.5, 0.62, 0.28, shirt); torso.position.y = 1.17; g.add(torso);
  if (opt.tie) { const tie = box(0.07, 0.4, 0.02, mat('#b23a3a')); tie.position.set(0, 1.24, 0.15); g.add(tie); const col = box(0.2, 0.08, 0.02, white); col.position.set(0, 1.45, 0.145); g.add(col); }
  const arms = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.32, 1.44, 0);
    const a = box(0.14, 0.56, 0.17, shirt); a.position.y = -0.28; p.add(a);
    const hnd = box(0.12, 0.12, 0.14, skin); hnd.position.y = -0.62; p.add(hnd);
    g.add(p); arms.push(p);
  }
  const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
  const hd = box(0.4, 0.42, 0.38, skin); hd.position.y = 0.24; head.add(hd);
  for (const s of [-1, 1]) {
    const e = box(0.055, 0.08, 0.02, black); e.position.set(s * 0.085, 0.27, 0.195); head.add(e);
    const sh = box(0.022, 0.026, 0.01, white); sh.position.set(s * 0.085 + 0.012, 0.295, 0.206); head.add(sh);
  }
  const top = box(0.43, 0.13, 0.41, hair); top.position.y = 0.48; head.add(top);
  const back = box(0.43, opt.long ? 0.62 : 0.3, 0.1, hair); back.position.set(0, opt.long ? 0.2 : 0.33, -0.17); head.add(back);
  if (opt.long) { for (const s of [-1, 1]) { const sd = box(0.06, 0.5, 0.34, hair); sd.position.set(s * 0.215, 0.22, -0.02); head.add(sd); } }
  else { for (const s of [-1, 1]) { const sd = box(0.04, 0.18, 0.3, hair); sd.position.set(s * 0.21, 0.38, -0.03); head.add(sd); } }
  const fringe = box(0.43, 0.08, 0.06, hair); fringe.position.set(0, 0.41, 0.18); head.add(fringe);
  if (opt.bald) { top.visible = false; fringe.visible = false; }
  g.userData = { legs, arms, head };
  g.scale.setScalar(opt.scale || 1);
  return g;
}
function poseWalk(p, phase, amp = 1) {
  const { legs, arms } = p.userData;
  const s = Math.sin(phase) * 0.55 * amp;
  legs[0].rotation.x = s; legs[1].rotation.x = -s;
  arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
  p.position.y = Math.abs(Math.cos(phase)) * 0.04 * amp;
}
function randPerson(r, extra = {}) {
  const female = r() < 0.5;
  return makePerson({
    skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)],
    shirt: SHIRT[Math.floor(r() * SHIRT.length)], pants: PANTS[Math.floor(r() * PANTS.length)],
    long: female && r() < 0.8, skirt: female && r() < 0.5, scale: 0.92 + r() * 0.14, ...extra
  });
}
// path walker: waypoints [[x,z,t],...]
function walkAlong(p, pts, t, speedPhase = 7.5) {
  let i = 0;
  while (i < pts.length - 2 && t > pts[i + 1][2]) i++;
  const a = pts[i], b = pts[i + 1];
  const u = clamp((t - a[2]) / (b[2] - a[2]));
  p.position.x = lerp(a[0], b[0], u); p.position.z = lerp(a[1], b[1], u);
  const moving = u > 0 && u < 1 && (a[0] !== b[0] || a[1] !== b[1]);
  if (moving) { p.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); poseWalk(p, t * speedPhase, 1); }
  else poseWalk(p, 0, 0);
  return moving;
}

// ---------- question bubble ----------
const qTex = canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 58, 50, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(50, 100); g.lineTo(64, 124); g.lineTo(76, 100); g.fill();
  g.fillStyle = '#e04848'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 62);
});
function makeQ() { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: qTex, transparent: true, depthTest: false })); s.scale.set(0.55, 0.55, 1); s.renderOrder = 10; return s; }


export { mergeGeometries, W, H, RW, RH, canvas, renderer, rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, canvasTex, windowTextures, makeSky, SKIN, HAIR, SHIRT, PANTS, makePerson, poseWalk, randPerson, walkAlong, qTex, makeQ };
