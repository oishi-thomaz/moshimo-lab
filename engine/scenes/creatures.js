import * as THREE from 'three';
import { rng, clamp, lerp, mat, box, canvasTex } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// CREATURES：生き物の模型と、生き物を並べる「ラインナップ」、海の中、顕微鏡の中
// API
//   makeCrow(), makeRoach(), makeBeeBig(), makePlankton(), makeBacterium(color), makeCow()   … どれも .userData.anim(t) で動く
//   lineup (Scene), SLOTS（5つの台座）, setSlot(i, { show, meter, word, glow }), lineupIdle(t)
//   sea (Scene), setSea({ plankton, fish, murk })
//   micro (Scene), setMicro({ bugs, t })
// =====================================================

// ---------- models ----------
const black = mat('#1d2129'), blue = mat('#2a3343');
function makeCrow() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), black); body.scale.set(1.35, 0.95, 0.9); body.position.y = 0.42; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), black); head.position.set(0.4, 0.66, 0); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 6), mat('#2b2f36')); beak.rotation.z = -Math.PI / 2; beak.position.set(0.66, 0.63, 0); g.add(beak);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat('#f2f2f2')); e.position.set(0.5, 0.71, s * 0.13); g.add(e); }
  const tail = box(0.36, 0.06, 0.22, black); tail.position.set(-0.48, 0.42, 0); tail.rotation.z = 0.35; g.add(tail);
  const wings = [];
  for (const s of [-1, 1]) { const w = box(0.5, 0.05, 0.22, blue); w.geometry.translate(0, 0, s * 0.11); w.position.set(-0.02, 0.5, s * 0.22); g.add(w); wings.push(w); }
  for (const s of [-1, 1]) { const l = box(0.04, 0.26, 0.04, mat('#3a3f48')); l.position.set(0.02, 0.13, s * 0.1); g.add(l); }
  g.userData.anim = (t, peck = 1) => { const p = Math.max(0, Math.sin(t * 6)) * peck; head.position.y = 0.66 - p * 0.18; head.position.x = 0.4 + p * 0.06; beak.position.set(0.66 + p * 0.06, 0.63 - p * 0.2, 0); beak.rotation.z = -Math.PI / 2 - p * 0.5; wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * Math.max(0, Math.sin(t * 2.3 + i)) * 0.15; }); };
  return g;
}
const roachBody = mat('#7a4428'), roachDark = mat('#3a2216'), roachLeg = mat('#4a2c1a');
function makeRoach() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), roachBody); b.scale.set(1, 0.28, 0.55); b.position.y = 0.14; g.add(b);
  const wingLine = box(0.85, 0.02, 0.02, roachDark); wingLine.position.set(-0.05, 0.285, 0); g.add(wingLine);
  const pro = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5), roachDark); pro.scale.set(0.9, 0.4, 1.25); pro.position.set(0.4, 0.16, 0); g.add(pro);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), roachDark); head.position.set(0.56, 0.12, 0); g.add(head);
  const ants = [];
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(0.6, 0.15, s * 0.05); const l = box(0.75, 0.018, 0.018, roachLeg); l.position.x = 0.37; a.add(l); a.rotation.y = -s * 0.35; a.rotation.z = 0.25; g.add(a); ants.push(a); }
  const legs = [];
  for (const s of [-1, 1]) for (const x of [-0.25, 0.05, 0.3]) { const p = new THREE.Group(); p.position.set(x, 0.1, s * 0.2); const l = box(0.04, 0.03, 0.42, roachLeg); l.position.z = s * 0.2; l.rotation.x = s * 0.45; p.add(l); p.rotation.y = x * 1.2 * s; g.add(p); legs.push({ p, s, x }); }
  g.userData.anim = (t, moving = 1) => { legs.forEach((L, i) => { L.p.rotation.y = L.x * 1.2 * L.s + Math.sin(t * 40 + i * 2.1) * 0.35 * moving; }); ants.forEach((a, i) => { a.rotation.y = (i ? 1 : -1) * -0.35 + Math.sin(t * 7 + i) * 0.12; }); };
  return g;
}
function makeBeeBig() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mat('#f2b632')); body.scale.set(1.45, 1, 1); g.add(body);
  for (const x of [-0.14, 0.06]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.296, 0.296, 0.09, 14), mat('#2a2218')); s.rotation.z = Math.PI / 2; s.position.x = x; s.scale.set(1, 1, 1); g.add(s); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat('#2a2218')); head.position.x = 0.46; g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat('#f4f4f4')); e.position.set(0.58, 0.07, s * 0.1); g.add(e); }
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), mat('#2a2218')); sting.rotation.z = Math.PI / 2; sting.position.x = -0.5; g.add(sting);
  const wingM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), wingM); w.scale.set(1, 0.55, 1); w.geometry.translate(0, 0.3 * s, 0); w.rotation.x = Math.PI / 2; w.position.set(0.05, 0.22, 0); g.add(w); wings.push(w); }
  g.userData.anim = (t) => { const a = Math.sin(t * 70) * 0.6; wings[0].rotation.x = Math.PI / 2 + a; wings[1].rotation.x = Math.PI / 2 - a; g.children[0].position.y = Math.sin(t * 3) * 0.02; };
  return g;
}
const planktonM = new THREE.MeshLambertMaterial({ color: '#7fe08a', emissive: 0x1f6b2a, emissiveIntensity: 0.6, transparent: true, opacity: 0.95 });
function makePlankton() { // diatom-like: a glassy green disc with ribs
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 24), planktonM); disc.rotation.x = Math.PI / 2; g.add(disc);
  for (let i = 0; i < 12; i++) { const r = box(0.04, 0.015, 0.42, mat('#c8ffcf')); r.geometry.translate(0, 0, 0.21); r.rotation.y = 0; const piv = new THREE.Group(); piv.rotation.z = i * Math.PI / 6; r.rotation.x = Math.PI / 2; r.position.z = 0.08; piv.add(r); g.add(piv); }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat('#e6ffb0', { emissive: 0x4a7a20, emissiveIntensity: 0.6 })); core.position.z = 0.09; g.add(core);
  g.userData.anim = (t) => { g.rotation.z = t * 0.5; g.position.y = Math.sin(t * 1.5) * 0.04; };
  return g;
}
function makeBacterium(color = '#b58cff') {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.35) });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 6, 12), m); body.rotation.z = Math.PI / 2; g.add(body);
  const tails = [];
  for (const s of [-1, 1]) { const tl = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 4, 14, Math.PI * 1.2), m); tl.position.set(-0.48, s * 0.05, 0); tl.rotation.z = s * 0.6; g.add(tl); tails.push(tl); }
  for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), mat('#ffffff', { transparent: true, opacity: 0.6 })); d.position.set(-0.2 + i * 0.1, 0.05 * Math.sin(i * 2), 0.15); g.add(d); }
  g.userData.anim = (t) => { tails.forEach((tl, i) => { tl.rotation.x = Math.sin(t * 9 + i * 2) * 0.6; }); g.rotation.z = Math.sin(t * 1.3) * 0.15; };
  return g;
}
function makeCow() {
  const g = new THREE.Group();
  const white = mat('#f2efe8'), blk = mat('#2b2a2a'), pink = mat('#e8a8a0');
  const body = box(1.5, 0.75, 0.75, white); body.position.y = 0.95; g.add(body);
  const p1 = box(0.5, 0.5, 0.77, blk); p1.position.set(-0.3, 1.02, 0); g.add(p1);
  const p2 = box(0.3, 0.3, 0.77, blk); p2.position.set(0.45, 1.1, 0); g.add(p2);
  const head = box(0.42, 0.42, 0.45, white); head.position.set(0.95, 1.15, 0); g.add(head);
  const nose = box(0.14, 0.22, 0.38, pink); nose.position.set(1.18, 1.05, 0); g.add(nose);
  for (const s of [-1, 1]) { const h = box(0.06, 0.14, 0.06, mat('#e6dcc0')); h.position.set(0.95, 1.42, s * 0.16); g.add(h); const e = box(0.04, 0.06, 0.06, blk); e.position.set(1.17, 1.24, s * 0.12); g.add(e); }
  const legs = [];
  for (const x of [-0.55, 0.55]) for (const s of [-1, 1]) { const l = box(0.18, 0.6, 0.18, white); l.position.set(x, 0.3, s * 0.26); g.add(l); legs.push(l); }
  const upper = g.children.filter(c => !legs.includes(c)); upper.forEach(c => { c.userData.y0 = c.position.y; });
  g.userData.setDown = (k) => { // 0 standing, 1 lying down (weak)
    legs.forEach(l => { l.scale.y = Math.max(0.05, 1 - k); l.position.y = 0.3 * (1 - k); });
    upper.forEach(c => { c.position.y = c.userData.y0 - 0.55 * k; });
    head.rotation.z = -0.35 * k;
  };
  g.userData.anim = (t) => { head.rotation.y = Math.sin(t * 0.8) * 0.1; };
  return g;
}

// ---------- lineup: 5 pedestals with damage meters ----------
const lineup = new THREE.Scene();
const bgTex = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1324'); gr.addColorStop(0.6, '#16223b'); gr.addColorStop(1, '#0b1120'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
lineup.background = bgTex;
lineup.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2238, 1.05));
const lkey = new THREE.DirectionalLight(0xffffff, 1.3); lkey.position.set(3, 8, 7); lkey.castShadow = true; lkey.shadow.mapSize.set(1024, 1024); Object.assign(lkey.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); lineup.add(lkey);
const lfloor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), mat('#1b2846')); lfloor.rotation.x = -Math.PI / 2; lfloor.receiveShadow = true; lineup.add(lfloor);
const NAMES = ['カラス', 'ゴキブリ', 'ハチ', '植物プランクトン', '細菌'];
const SX = [-2.2, -1.1, 0, 1.1, 2.2];
const MH = 2.0; // meter height
const SLOTS = NAMES.map((name, i) => {
  const g = new THREE.Group(); g.position.set(SX[i], 0, 0); lineup.add(g);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.32, 28), mat('#2c3b5e')); ped.position.y = 0.16; ped.receiveShadow = true; ped.castShadow = true; g.add(ped);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 6, 32), mat('#7fd4ff', { emissive: 0x245a78, emissiveIntensity: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.33; g.add(rim);
  // meter: glass tube behind
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.34, MH, 0.12), new THREE.MeshLambertMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.16 })); tube.position.set(0, 1.1 + MH / 2, -0.75); g.add(tube);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, MH, 0.12)), new THREE.LineBasicMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.5 })); frame.position.copy(tube.position); g.add(frame);
  const fillM = new THREE.MeshLambertMaterial({ color: '#7ff0c8', emissive: 0x1a4a3a, emissiveIntensity: 0.8 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.1), fillM); fill.geometry.translate(0, 0.5, 0); fill.position.set(0, 1.1, -0.75); fill.scale.y = 0.001; g.add(fill);
  const lab = textSprite(name, { size: 60, sx: name.length > 4 ? 1.35 : 1.0, w: 640, h: 128, stroke: 8 }); lab.position.set(0, 0.06, 0.78); lab.material.depthTest = false; lab.renderOrder = 5; g.add(lab);
  const word = textSprite('', { size: 72, sx: 0.95, w: 512, h: 128, stroke: 8 }); word.position.set(0, 1.1 + MH + 0.32, -0.75); word.visible = false; g.add(word);
  const hero = [makeCrow, makeRoach, makeBeeBig, makePlankton, () => makeBacterium('#b58cff')][i]();
  const heroScale = [1.15, 1.05, 1.1, 1.05, 1.05][i];
  hero.scale.setScalar(heroScale); hero.position.y = [0.32, 0.36, 0.95, 0.95, 0.95][i]; hero.rotation.y = i === 0 || i === 1 ? -0.6 : -0.3;
  hero.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.add(hero);
  return { g, ped, rim, fill, fillM, word, hero, heroScale, lab, curWord: '' };
});
const slotSpark = SLOTS.map((s, i) => { const sp = { pts: null }; return sp; });
const COLD = new THREE.Color('#7ff0c8'), MID = new THREE.Color('#ffd166'), HOT = new THREE.Color('#ff5a4f');
function setSlot(i, { show = 1, meter = 0, word = '', glow = 0, t = 0 } = {}) {
  const s = SLOTS[i];
  s.hero.visible = show > 0.01;
  s.hero.scale.setScalar(s.heroScale * Math.max(0.001, show));
  s.fill.scale.y = Math.max(0.001, Math.min(1.08, meter)) * MH;
  const c = meter < 0.5 ? COLD.clone().lerp(MID, meter / 0.5) : MID.clone().lerp(HOT, Math.min(1, (meter - 0.5) / 0.5));
  s.fillM.color.copy(c); s.fillM.emissive.copy(c).multiplyScalar(0.35 + glow * 0.5 * (0.5 + 0.5 * Math.sin(t * 14)));
  if (word !== s.curWord) { s.word.userData.set(word); s.curWord = word; }
  s.word.visible = !!word; s.word.position.y = 1.1 + Math.max(0.05, Math.min(1.08, meter)) * MH + 0.35;
}
function lineupIdle(t) { SLOTS.forEach((s, i) => { if (s.hero.visible) s.hero.userData.anim(t + i, i === 0 ? 0.4 : 0.2); s.rim.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(t * 2 + i); }); }

// ---------- sea ----------
const sea = new THREE.Scene();
sea.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2fa6c9'); gr.addColorStop(0.45, '#0f5f86'); gr.addColorStop(1, '#06223a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
sea.fog = new THREE.Fog(0x0d4f72, 6, 34);
const seaHemi = new THREE.HemisphereLight(0xbfefff, 0x0a2a3a, 1.2); sea.add(seaHemi);
const seaSun = new THREE.DirectionalLight(0xdff8ff, 0.9); seaSun.position.set(2, 10, 3); sea.add(seaSun);
const sand = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 30, 30), mat('#c9b48a')); sand.rotation.x = -Math.PI / 2; sand.position.y = -4; { const p = sand.geometry.attributes.position; const r = rng(4); for (let i = 0; i < p.count; i++) p.setZ(i, (r() - 0.5) * 0.4); sand.geometry.computeVertexNormals(); } sea.add(sand);
// light shafts
const rayM = new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 16), rayM); r.position.set(-6 + i * 2.2, 4, -6 + (i % 3) * 2); r.rotation.z = 0.25; sea.add(r); }
const PN = 1800;
const plank = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: '#9dff9a', transparent: true, opacity: 0.85, toneMapped: false }), PN);
plank.frustumCulled = false; sea.add(plank);
const PD = (() => { const r = rng(12); return Array.from({ length: PN }, () => [(r() - 0.5) * 22, -3.5 + r() * 9, -14 + r() * 18, r(), r()]); })();
// fish school
const fishM = mat('#d9e6ef'), fishTail = mat('#9fb6c6');
const FISH = [];
for (let i = 0; i < 70; i++) { const f = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), fishM); b.scale.set(1.8, 0.8, 0.5); f.add(b); const t = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 4), fishTail); t.rotation.z = Math.PI / 2; t.position.x = -0.38; f.add(t); sea.add(f); FISH.push(f); }
const FD = (() => { const r = rng(21); return FISH.map(() => [r() * 6.28, 2 + r() * 2.5, -1 + r() * 3, r()]); })();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function setSea({ plankton = 1, fish = 1, murk = 0, t = 0 } = {}) {
  for (let i = 0; i < PN; i++) {
    const d = PD[i]; const k = clamp(plankton * 1.25 - d[3] * 0.25);
    _p.set(d[0] + Math.sin(t * 0.3 + d[4] * 6) * 0.5, d[1] + Math.sin(t * 0.5 + d[3] * 6) * 0.3, d[2]);
    _s.setScalar(k); _q.setFromEuler(_e.set(t + d[3], t * 0.7, 0)); _m.compose(_p, _q, _s); plank.setMatrixAt(i, _m);
  }
  plank.instanceMatrix.needsUpdate = true; plank.visible = plankton > 0.01;
  FISH.forEach((f, i) => { const d = FD[i]; f.visible = d[3] < fish; const a = d[0] + t * (0.35 + d[3] * 0.1); f.position.set(Math.cos(a) * (3 + d[2]), d[1] - 1.5 + Math.sin(t + i) * 0.2, -5 + Math.sin(a) * (3 + d[2])); f.rotation.y = -a - Math.PI / 2; f.children[1].rotation.y = Math.sin(t * 12 + i) * 0.5; });
  const c = new THREE.Color('#0d4f72').lerp(new THREE.Color('#2a3a3a'), murk); sea.fog.color.copy(c); seaHemi.intensity = 1.2 - murk * 0.5;
}

// ---------- micro (microscope view) ----------
const micro = new THREE.Scene();
micro.background = new THREE.Color('#0a1a1f');
micro.add(new THREE.HemisphereLight(0xe0fff6, 0x0a1a1f, 1.3));
const mkey = new THREE.DirectionalLight(0xffffff, 0.8); mkey.position.set(2, 4, 6); micro.add(mkey);
const plate = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshLambertMaterial({ color: '#cfe8d8', transparent: true, opacity: 0.18 })); plate.position.z = -1.2; micro.add(plate);
const ring = new THREE.Mesh(new THREE.RingGeometry(5.9, 30, 64), new THREE.MeshBasicMaterial({ color: '#05090c' })); ring.position.z = 2.0; micro.add(ring);
const MCOL = ['#b58cff', '#7fd4ff', '#ffb46b', '#7ff0c8', '#ff8aa8'];
const BUGS = [];
{ const r = rng(33); for (let i = 0; i < 46; i++) { const b = makeBacterium(MCOL[i % MCOL.length]); const s = 0.5 + r() * 0.6; b.scale.setScalar(s); b.userData.d = [(r() - 0.5) * 9, (r() - 0.5) * 9, (r() - 0.5) * 1.5, r() * 6.28, r(), s]; micro.add(b); BUGS.push(b); } }
function setMicro({ bugs = 1, t = 0 } = {}) {
  BUGS.forEach(b => { const [x, y, z, a, q, s] = b.userData.d; const k = clamp(bugs * 1.3 - q * 0.3); b.visible = k > 0.01; b.scale.setScalar(s * Math.max(0.001, k)); const ang = a + t * (0.2 + q * 0.3); b.position.set(x + Math.cos(ang) * 0.6, y + Math.sin(ang * 1.3) * 0.6, z); b.rotation.z = ang + Math.PI / 2; b.userData.anim(t + q * 5); });
}

export { makeCrow, makeRoach, makeBeeBig, makePlankton, makeBacterium, makeCow, lineup, SLOTS, setSlot, lineupIdle, sea, setSea, micro, setMicro };
