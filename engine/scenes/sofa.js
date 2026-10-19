import * as THREE from 'three';
import { rng, mat, box, canvasTex } from '../lib.js';

// =====================================================
// SOFA ROOM：白い壁、左に青グレーの横じまパネル、銀色の布をかけた黒いソファ、左に白いクッション、ベージュのカーペット
// 人物は出さない（顔のない灰色の人影だけ）。サムネ（ぼかしたタイル）が増えて積み上がる演出つき
// API
//   sofaRoom (Scene)
//   setFigure(op)            人影の濃さ 0..1（0で非表示）
//   setThumbs(fn)            fn(i, r) -> { x, y, z, ry, s, v } でサムネを置く（v=false で非表示）。r は i ごとの乱数3つ
//   THUMBS                   サムネの最大数
//   setRoomDark(k)           0=明るい部屋 1=暗転（サムネだけ光る）
// =====================================================
const sofaRoom = new THREE.Scene();
sofaRoom.background = new THREE.Color('#d9d9db');
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8478, 1.35); sofaRoom.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3, 6, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); sofaRoom.add(key);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35); fill.position.set(-5, 3, 2); sofaRoom.add(fill);

// floor: beige carpet
const carpet = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(80,60,40,.06)'; g.fillRect(r() * w, r() * h, 2, 2); } });
carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(6, 6);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshLambertMaterial({ map: carpet })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sofaRoom.add(floor);

// back wall (white) + side wall
const wallM = mat('#f6f6f6', { emissive: 0x2a2a2a });
const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallM); wall.position.set(0, 4, -1.9); wall.receiveShadow = true; sofaRoom.add(wall);
const side = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), mat('#e2e2e4')); side.rotation.y = Math.PI / 2; side.position.set(-4.6, 4, 2.5); sofaRoom.add(side);

// striped panel (blue-gray horizontal waves) on the left of the back wall
const stripes = canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = '#c9d3dc'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 12) {
    g.strokeStyle = (y / 12) % 2 ? '#7f93a8' : '#e9eef3'; g.lineWidth = 6;
    g.beginPath(); for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x / 70 + y / 40) * 3; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
  }
  // soft dark shape (shadow of a figure on the panel) like a fold in the fabric
  const gr = g.createRadialGradient(w * 0.55, h * 0.75, 10, w * 0.55, h * 0.75, 140); gr.addColorStop(0, 'rgba(60,75,95,.35)'); gr.addColorStop(1, 'rgba(60,75,95,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshLambertMaterial({ map: stripes })); panel.position.set(-2.9, 2.35, -1.88); sofaRoom.add(panel);

// sofa: dark frame
const SOFA = new THREE.Group(); SOFA.position.set(0, 0, -1.0); sofaRoom.add(SOFA);
const frameM = mat('#34373c');
const seat = box(3.6, 0.42, 1.1, frameM); seat.position.set(0, 0.36, 0.05); SOFA.add(seat);
const back = box(3.6, 0.9, 0.28, frameM); back.position.set(0, 0.95, -0.42); SOFA.add(back);
const armL = box(0.26, 0.62, 1.1, frameM); armL.position.set(-1.93, 0.52, 0.05); SOFA.add(armL);
const armR = box(0.26, 0.62, 1.1, frameM); armR.position.set(1.93, 0.52, 0.05); SOFA.add(armR);
for (const sx of [-1.7, 1.7]) for (const sz of [-0.35, 0.5]) { const l = box(0.08, 0.15, 0.08, mat('#1d1f22')); l.position.set(sx, 0.075, sz); SOFA.add(l); }
// silver drape (wrinkled shiny sheet) over the seat and back
const drapeM = new THREE.MeshStandardMaterial({ color: '#9aa0a8', metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide });
function drape(w, h, segW, segH, bend) {
  const g = new THREE.PlaneGeometry(w, h, segW, segH); const p = g.attributes.position; const r = rng(11 + segW);
  const waves = Array.from({ length: 7 }, () => [r() * 7 + 2, r() * 7 + 2, r() * 6.28, 0.008 + r() * 0.018]);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); let z = 0; for (const [a, b, ph, amp] of waves) z += Math.sin(x * a + y * b + ph) * amp; p.setZ(i, z + bend(x, y)); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, drapeM); m.castShadow = true; m.receiveShadow = true; return m;
}
// seat sheet: lies on the seat and falls over the front edge
const seatSheet = drape(3.3, 1.7, 60, 30, (x, y) => (y < -0.25 ? (y + 0.25) * (y + 0.25) * -2.2 : 0));
seatSheet.rotation.x = -Math.PI / 2; seatSheet.position.set(-0.1, 0.6, 0.2); SOFA.add(seatSheet);
// back sheet: draped over the backrest, hanging down the front of it
const backSheet = drape(3.0, 1.2, 50, 24, (x, y) => (y > 0.3 ? -(y - 0.3) * (y - 0.3) * 2.5 : 0));
backSheet.position.set(-0.2, 1.05, -0.26); SOFA.add(backSheet);
// arm sheet on the right arm
const armSheet = drape(0.7, 1.3, 16, 24, (x, y) => -Math.abs(x) * 0.3);
armSheet.rotation.x = -Math.PI / 2; armSheet.position.set(1.93, 0.86, 0.1); SOFA.add(armSheet);
// white cushion at the left
const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32, 6, 6, 4), mat('#efebe3'));
{ const p = cushion.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - 0.35 * (Math.abs(x) / 0.275) ** 2 * (Math.abs(y) / 0.375) ** 2; p.setZ(i, z * Math.max(0.4, 1 - 0.6 * (Math.abs(x) / 0.275) ** 4)); p.setX(i, x * k); } cushion.geometry.computeVertexNormals(); }
cushion.position.set(-1.55, 0.98, -0.12); cushion.rotation.set(-0.15, 0.25, 0.08); cushion.castShadow = true; SOFA.add(cushion);

// faceless gray figure (no features, no likeness)
const FIG = new THREE.Group(); sofaRoom.add(FIG); FIG.position.set(2.25, 0, 0.55);
const figM = new THREE.MeshLambertMaterial({ color: '#59616d', transparent: true, opacity: 1 });
{ const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.72, 6, 14), figM); body.position.y = 1.15; FIG.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), figM); head.position.y = 1.83; FIG.add(head);
  for (const sx of [-0.13, 0.13]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.62, 4, 10), figM); leg.position.set(sx, 0.42, 0); FIG.add(leg); }
  for (const sx of [-0.36, 0.36]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.6, 4, 10), figM); arm.position.set(sx, 1.2, 0); arm.rotation.z = sx > 0 ? 0.08 : -0.08; FIG.add(arm); } }
FIG.traverse(o => { if (o.isMesh) o.castShadow = true; });
function setFigure(op) { FIG.visible = op > 0.01; figM.opacity = op; figM.transparent = op < 0.99; }

// thumbnails: blurred colored tiles (contents unreadable on purpose)
const THUMBS = 1400;
const thumbTex = canvasTex(128, 72, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfd6e0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.filter = 'blur(6px)'; const r = rng(5);
  for (let i = 0; i < 6; i++) { g.fillStyle = `hsla(0,0%,${45 + r() * 45}%,.9)`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 26, 8 + r() * 18, 0, 0, 7); g.fill(); }
  g.filter = 'none'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(w - 30, h - 14, 26, 10); // the little duration badge
});
const thumbM = new THREE.MeshBasicMaterial({ map: thumbTex, side: THREE.DoubleSide, toneMapped: false });
const thumbs = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.48, 0.27), thumbM, THUMBS);
thumbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); thumbs.frustumCulled = false; sofaRoom.add(thumbs);
{ const r = rng(77); const c = new THREE.Color(); for (let i = 0; i < THUMBS; i++) { c.setHSL(r(), 0.55, 0.6 + r() * 0.25); thumbs.setColorAt(i, c); } thumbs.instanceColor.needsUpdate = true; }
const R3 = (() => { const r = rng(91); return Array.from({ length: THUMBS }, () => [r(), r(), r()]); })();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function setThumbs(fn) {
  let n = 0;
  for (let i = 0; i < THUMBS; i++) {
    const o = fn ? fn(i, R3[i]) : null;
    if (!o || o.v === false || !(o.s > 0)) { _m.makeScale(0, 0, 0); thumbs.setMatrixAt(i, _m); continue; }
    _p.set(o.x, o.y, o.z); _q.setFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0)); _s.setScalar(o.s);
    _m.compose(_p, _q, _s); thumbs.setMatrixAt(i, _m); n++;
  }
  thumbs.instanceMatrix.needsUpdate = true; thumbs.visible = n > 0;
}
const bgLight = new THREE.Color('#d9d9db'), bgDark = new THREE.Color('#0b0f17');
function setRoomDark(k) {
  sofaRoom.background.copy(bgLight).lerp(bgDark, k);
  hemi.intensity = 1.35 * (1 - k) + 0.05 * k; key.intensity = 1.25 * (1 - k); fill.intensity = 0.35 * (1 - k);
  [floor, wall, side, panel, SOFA].forEach(o => { o.visible = k < 0.98; });
}
setThumbs(null); setFigure(0);

export { sofaRoom, setFigure, setThumbs, THUMBS, setRoomDark, SOFA };
