import * as THREE from 'three';
import { renderer, clamp, easeOut, comma, canvasTex } from './lib.js';
import { LOGOS } from './logos.js';
import { setupCards, el, setSub, setTop, setHud, roll } from './overlay.js';

// =====================================================
// story: shared shot runner for one video
// =====================================================
// runStory({ shots: [{a,b,f}], subs, meta, cam, duration, dim: (f)=>bool })
// each shot f(t, T) returns the THREE.Scene to draw (or null for the end card).
// Every frame the overlay is reset (title/flash/top/hud hidden) before the shot runs,
// so a shot only turns on what it needs.
const cam = new THREE.PerspectiveCamera(55, 1080 / 1920, 0.05, 4000);
function look(px, py, pz, tx, ty, tz, fov = 55) { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); cam.fov = fov; cam.updateProjectionMatrix(); }

// count-up helper for the top stat: u in shot seconds
const countUp = (t, target, t0 = 0.3, dur = 1.4) => Math.round(roll(clamp((t - t0) / dur), target));
const hudTime = (lab, op = 1) => setHud('経過時間', lab, op);
const dimEl = () => document.getElementById('dim');

function endCard(t) {
  el.end.style.opacity = clamp(t / 0.5);
  return null;
}

function runStory({ shots, subs, meta, duration, camera = cam, dim = () => false }) {
  window.renderAt = function (T) {
    const s = shots.find(x => T >= x.a && T < x.b) || shots[shots.length - 1];
    el.end.style.opacity = 0; el.title.style.opacity = 0; el.flash.style.opacity = 0;
    setTop('', '', 0); setHud('', '', 0);
    dimEl().style.opacity = dim(s.f) ? 1 : 0;
    el.logo.style.visibility = 'visible';
    const scn = s.f(T - s.a, T);
    setSub(T, subs);
    if (scn) renderer.render(scn, camera);
    else { renderer.setClearColor(0x07090d, 1); renderer.clear(); }
    return true;
  };
  window.META = meta;
  window.DURATION = duration;
  setupCards(meta);
  document.querySelectorAll('.mk').forEach((m, i) => { m.innerHTML = LOGOS.flask().replace(/id="(\w+)"/g, `id="$1${i}"`).replace(/url\(#(\w+)\)/g, `url(#$1${i})`); });
  Promise.all([document.fonts.load('800 40px "M PLUS Rounded 1c"', 'もしもラボ'), document.fonts.load('600 20px Inter', 'MOSHIMO LAB')])
    .then(() => document.fonts.ready).then(() => { window.renderAt(0); window.READY = true; });
}

// big text label as a sprite (for boards / map labels). returns Sprite; set .userData.set(text)
function textSprite(text, opt = {}) {
  const w = opt.w || 512, h = opt.h || 128;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (s) => {
    const g = c.getContext('2d'); g.clearRect(0, 0, w, h);
    if (opt.bg) { g.fillStyle = opt.bg; const r = opt.radius ?? 18; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, r); g.fill(); }
    g.fillStyle = opt.color || '#fff'; g.font = `900 ${opt.size || 72}px "Noto Sans CJK JP", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (opt.stroke) { g.lineWidth = opt.stroke; g.strokeStyle = opt.strokeColor || 'rgba(0,0,0,.6)'; g.strokeText(s, w / 2, h / 2 + 4); }
    g.fillText(s, w / 2, h / 2 + 4); tex.needsUpdate = true;
  };
  draw(text);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: opt.depthTest ?? true }));
  sp.scale.set(opt.sx || 4, (opt.sx || 4) * h / w, 1);
  let cur = text; sp.userData.set = (s) => { if (s !== cur) { cur = s; draw(s); } };
  return sp;
}

// vanish sparkles: particles that burst from a list of points and fade. add .group to a scene.
const sparkTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,180,.8)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
function makeSparkles(n = 300, size = 0.25, color = 0xfff2c0) {
  const pos = new Float32Array(n * 3), base = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: sparkTex, size, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.visible = false;
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // origins: array of [x,y,z]; spread: random offset radius; speed: drift distance over u=0..1
  function init(origins, spread = 0.2, speed = 1) {
    for (let i = 0; i < n; i++) { const o = origins[i % origins.length]; base.set([o[0] + (r() - .5) * spread, o[1] + (r() - .5) * spread, o[2] + (r() - .5) * spread], i * 3); vel.set([(r() - .5) * speed, r() * speed, (r() - .5) * speed], i * 3); }
  }
  function set(u) {
    pts.visible = u > 0 && u < 1; if (!pts.visible) return;
    for (let i = 0; i < n * 3; i++) pos[i] = base[i] + vel[i] * u;
    g.attributes.position.needsUpdate = true; m.opacity = 1 - u;
  }
  return { points: pts, init, set, material: m };
}

export { makeSparkles, cam, look, countUp, hudTime, endCard, runStory, textSprite, setTop, setHud, el, comma, easeOut };
