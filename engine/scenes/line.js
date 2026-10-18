import * as THREE from 'three';
import { rng, mat, box, canvasTex, makeSky, randPerson, SKIN, HAIR, SHIRT, PANTS, clamp } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// LINE: 一本道にどこまでも続く人の行列（先頭は z=0、列は +z 方向へ。1人あたり SPACING m）。
// 先頭の FRONT 人は makePerson（顔あり）、その先は InstancedMesh、さらに先は細い帯（strip）で何kmでも伸ばせる。
// API
//   lineScene (Scene), SPACING, FRONT, NINST
//   setLine(count, {pop}) … 先頭から count 人を表示（pop=true で最後の1人が小さくふくらんで出る）
//   setLineEnv('day'|'dusk', {fogNear, fogFar}) … 空の色と霧（空撮では fogFar を大きく）
//   markers(on) … 10mごとの杭と 50m 看板、kmPosts(on) … 1kmごとの大きな看板（空撮用）
//   front … 先頭の札（Group）、people … 先頭 FRONT 人（makePerson の配列）
// =====================================================
const SPACING = 0.5, FRONT = 60, NINST = 3000;
const lineScene = new THREE.Scene();
const sky = makeSky(); lineScene.add(sky);
lineScene.fog = new THREE.Fog(0xdfe9f2, 60, 400);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a6a50, 1.15); lineScene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(-30, 50, -20); lineScene.add(sun);

// ground, road, sidewalk (long)
const grassM = mat('#93c47d'), roadM = mat('#555b66'), walkM = mat('#cfd2d6'), lineM = mat('#eef0f2');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), grassM); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, 5000); lineScene.add(ground);
const LEN = 30000;
const road = new THREE.Mesh(new THREE.PlaneGeometry(7, LEN), roadM); road.rotation.x = -Math.PI / 2; road.position.set(4.8, 0.0, LEN / 2 - 60); lineScene.add(road);
const walk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, LEN), walkM); walk.position.set(0, 0.06, LEN / 2 - 60); lineScene.add(walk);
{ // center dashes (near part only)
  const g = new THREE.BoxGeometry(0.15, 0.02, 2.5); const n = 400;
  const im = new THREE.InstancedMesh(g, lineM, n); const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(4.8, 0.02, -50 + i * 6); im.setMatrixAt(i, m4); }
  lineScene.add(im);
}
// trees along both sides (scale reference up to ~6km)
{
  const r = rng(31);
  const n = 900; const cone = new THREE.ConeGeometry(1.6, 4.2, 6); cone.translate(0, 3.6, 0);
  const trunk = new THREE.CylinderGeometry(0.22, 0.28, 1.6, 5); trunk.translate(0, 0.8, 0);
  const leafM = new THREE.MeshLambertMaterial({ color: '#4f8f4a', flatShading: true }), trunkM = mat('#7a5a3e');
  const a = new THREE.InstancedMesh(cone, leafM, n), b = new THREE.InstancedMesh(trunk, trunkM, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1; const z = -40 + Math.pow(r(), 1.3) * 6500;
    const x = side > 0 ? 11 + r() * 60 : -5 - r() * 60; const sc = 0.8 + r() * 0.7;
    p.set(x, 0, z); s.set(sc, sc, sc); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 3); m4.compose(p, q, s);
    a.setMatrixAt(i, m4); b.setMatrixAt(i, m4);
  }
  lineScene.add(a, b);
}

// ---- people ----
const people = [];
{
  const r = rng(7);
  for (let i = 0; i < FRONT; i++) {
    const p = randPerson(r); p.position.set((r() - .5) * 0.08, 0.12, i * SPACING); p.rotation.y = Math.PI; // face -z (toward the front)
    p.userData.base = p.scale.x; lineScene.add(p); people.push(p);
  }
}
// instanced people (no faces, seen from far): legs / torso / head / hair
const PARTS = [
  { g: new THREE.BoxGeometry(0.4, 0.86, 0.22), y: 0.43 + 0.12, pal: PANTS },
  { g: new THREE.BoxGeometry(0.5, 0.62, 0.28), y: 1.17 + 0.12, pal: SHIRT },
  { g: new THREE.BoxGeometry(0.4, 0.42, 0.38), y: 1.74 + 0.12, pal: SKIN },
  { g: new THREE.BoxGeometry(0.43, 0.2, 0.41), y: 1.96 + 0.12, pal: HAIR },
];
const inst = PARTS.map(P => {
  const im = new THREE.InstancedMesh(P.g, new THREE.MeshLambertMaterial({ color: '#ffffff' }), NINST);
  const r = rng(P.y * 1000 | 0); const m4 = new THREE.Matrix4(), c = new THREE.Color(); const rr = rng(11);
  for (let i = 0; i < NINST; i++) {
    const sc = 0.92 + rr() * 0.14;
    m4.makeScale(sc, sc, sc); m4.setPosition((rr() - .5) * 0.08, P.y * sc, (FRONT + i) * SPACING);
    im.setMatrixAt(i, m4); c.set(P.pal[Math.floor(r() * P.pal.length)]); im.setColorAt(i, c);
  }
  im.count = 0; im.frustumCulled = false; lineScene.add(im); return im;
});
// far strip (km scale)
const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.7, 1), new THREE.MeshLambertMaterial({ color: '#c46a5a' }));
strip.geometry.translate(0, 0.85 + 0.12, 0.5); strip.visible = false; lineScene.add(strip);
const STRIP0 = (FRONT + NINST) * SPACING;

function setLine(count, { pop = false } = {}) {
  const n = Math.max(0, count);
  for (let i = 0; i < FRONT; i++) {
    const p = people[i]; const k = clamp(n - i);
    p.visible = k > 0;
    if (p.visible) p.scale.setScalar(p.userData.base * (pop ? (k < 1 ? 0.3 + 0.7 * k : 1) : 1));
  }
  const ni = Math.floor(clamp(n - FRONT, 0, NINST)); inst.forEach(im => { im.count = ni; });
  const far = (n - FRONT - NINST) * SPACING;
  strip.visible = far > 0; if (far > 0) { strip.position.set(0, 0, STRIP0); strip.scale.z = far; }
}

// head-of-line sign
const front = new THREE.Group(); lineScene.add(front);
{
  const post = box(0.06, 1.4, 0.06, mat('#e9ecef')); post.position.set(-0.75, 0.82, -0.45); front.add(post);
  const t = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#e05a4f'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 18); g.fill(); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('先頭', w / 2, h / 2 + 4); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); board.position.set(-0.75, 1.6, -0.47); board.rotation.y = Math.PI; front.add(board);
  const board2 = board.clone(); board2.rotation.y = 0; board2.position.z = -0.48; front.add(board2);
}
// 10m stakes + 50m board
const marks = new THREE.Group(); lineScene.add(marks);
{
  for (let m = 10; m <= 100; m += 10) {
    const st = box(0.1, 0.6, 0.1, mat(m % 50 ? '#f2c14e' : '#e05a4f')); st.position.set(-1.45, 0.42, m); marks.add(st);
    if (m % 50 === 0) { const s = textSprite(m + 'm', { size: 80, sx: 4.5, bg: 'rgba(20,30,50,.75)', w: 384, h: 128 }); s.position.set(-2.4, 3.4, m); marks.add(s); }
  }
}
function markers(on) { marks.visible = on; }
// 1km boards (aerial)
const kms = new THREE.Group(); lineScene.add(kms);
for (let k = 1; k <= 6; k++) {
  const s = textSprite(k + 'km', { size: 84, sx: 1, bg: 'rgba(20,30,50,.8)', w: 384, h: 128, depthTest: false }); s.renderOrder = 6; s.position.set(-60, 30, k * 1000); s.userData.k = k; kms.add(s);
  const pole = box(1.5, 30, 1.5, mat('#f2c14e')); pole.position.set(-8, 15, k * 1000); kms.add(pole);
}
function kmPosts(on, scale = 160) { kms.visible = on; kms.children.forEach(c => { if (c.isSprite) c.scale.set(scale, scale / 3, 1); }); }
kmPosts(false);

const ENVS = { day: { top: '#7fb6e6', bot: '#e6f0f7', fog: '#dfe9f2', hi: 1.15, si: 1.2 }, dusk: { top: '#4a5f8f', bot: '#f2b48a', fog: '#e8c2a6', hi: 0.9, si: 0.9 } };
function setLineEnv(e = 'day', { fogNear = 60, fogFar = 400 } = {}) {
  const E = ENVS[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  lineScene.fog.color.set(E.fog); lineScene.fog.near = fogNear; lineScene.fog.far = fogFar;
  hemi.intensity = E.hi; sun.intensity = E.si;
}
setLineEnv('day');

export { lineScene, SPACING, FRONT, NINST, setLine, setLineEnv, markers, kmPosts, front, people, strip, sky as lineSky };
