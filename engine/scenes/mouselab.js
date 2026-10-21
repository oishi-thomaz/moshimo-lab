import * as THREE from 'three';
import { rng, clamp, mat, box, canvasTex, makePerson, SKIN, HAIR } from '../lib.js';

// =====================================================
// MOUSELAB：研究室（白い壁・実験台・マウスのケージ・棚のフラスコ・顕微鏡・白衣の研究者）と、ネズミの模型
// 座標：部屋 x -5..5, z -4..4（奥の壁 z=-4）、天井 3.2。実験台は z=-1.2 の横長（x -3.2..3.2、天板 y=0.92）。カメラは z 4〜7 から。
// API
//   lab (Scene), setLabLight('day'|'night')
//   makeRodent({ kind: 'rat'|'mouse', coat }) -> Group（長さ約1。.userData.anim(t, moving)）。scale で大きさ
//   CAGES: [{ g, mice: [Group] }]（実験台の上に6個）, setMice(k 0..1)（k の割合だけケージにマウスがいる）
//   researcher（白衣の makePerson。lab に追加済み）, microscope（Group）
// =====================================================

// ---------- rodent model ----------
function makeRodent({ kind = 'rat', coat } = {}) {
  const rat = kind === 'rat';
  const fur = mat(coat || (rat ? '#7d6e62' : '#f3f1ec')), pink = mat('#e8a0a8'), dark = mat('#141414');
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), fur); body.scale.set(1, 0.5, 0.52); body.position.y = 0.26; body.castShadow = true; g.add(body);
  const head = new THREE.Group(); head.position.set(0.45, 0.3, 0); g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 7), fur); skull.scale.set(1.15, 0.85, 0.85); skull.castShadow = true; head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 8), fur); snout.rotation.z = -Math.PI / 2; snout.position.set(0.26, -0.03, 0); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), pink); nose.position.set(0.4, -0.03, 0); head.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(rat ? 0.09 : 0.12, 10), pink); ear.material.side = THREE.DoubleSide;
    ear.position.set(-0.04, 0.17, s * 0.11); ear.rotation.y = s * 0.5 + Math.PI / 2; head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), rat ? dark : mat('#c0303a')); eye.position.set(0.14, 0.06, s * 0.11); head.add(eye);
  }
  // tail: a tube along a curve
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.45, 0.2, 0), new THREE.Vector3(-0.8, 0.1, 0.12), new THREE.Vector3(-1.1, 0.05, -0.05), new THREE.Vector3(-1.35, 0.06, 0.1)]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.035, 5), pink); g.add(tail);
  const legs = [];
  for (const sx of [-0.25, 0.25]) for (const s of [-1, 1]) { const l = box(0.08, 0.14, 0.08, pink); l.position.set(sx, 0.07, s * 0.17); g.add(l); legs.push(l); }
  g.userData.anim = (t, moving = 1) => {
    legs.forEach((l, i) => { l.position.y = 0.07 + Math.max(0, Math.sin(t * 28 + i * 1.7)) * 0.05 * moving; });
    body.position.y = 0.26 + Math.abs(Math.sin(t * 14)) * 0.03 * moving;
    head.rotation.y = Math.sin(t * 3.1) * 0.25 * (1 - moving * 0.6); head.rotation.z = Math.sin(t * 5.3) * 0.06;
    tail.rotation.y = Math.sin(t * 4) * 0.25;
  };
  return g;
}

// ---------- lab room ----------
const lab = new THREE.Scene();
lab.background = new THREE.Color('#dfe6ec');
const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa4ae, 1.15); lab.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 6, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 }); lab.add(key);
const ceilL = new THREE.PointLight(0xf4f8ff, 8, 14, 1.3); ceilL.position.set(0, 3.0, 0); lab.add(ceilL);

const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d7dde2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#bcc4cb'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(5, 5);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; lab.add(floor);
const wallM = mat('#f1f4f6');
const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallM); back.position.set(0, 1.6, -4); back.receiveShadow = true; lab.add(back);
for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 5, 1.6, 0); lab.add(w); }
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), mat('#f6f8fa', { side: THREE.BackSide })); ceiling.rotation.x = -Math.PI / 2; ceiling.position.set(0, 3.2, 0); lab.add(ceiling);
// ceiling light panels
for (const x of [-2.5, 0, 2.5]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff })); p.rotation.x = Math.PI / 2; p.position.set(x, 3.18, -0.5); lab.add(p); }
// window strip on back wall (sky)
const winTex = { day: canvasTex(256, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb6e6'); gr.addColorStop(1, '#d9ecf8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  night: canvasTex(256, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#22345e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) };
const winM = new THREE.MeshBasicMaterial({ map: winTex.day });
const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), winM); win.position.set(0, 2.25, -3.98); lab.add(win);
for (const x of [-3, -1, 1, 3]) { const f = box(0.08, 1.2, 0.05, mat('#c9d1d8')); f.position.set(x, 2.25, -3.95); lab.add(f); }
// back counter + shelves with flasks
const counter = box(9, 0.9, 0.7, mat('#e9edf0')); counter.position.set(0, 0.45, -3.6); lab.add(counter);
const ctop = box(9.1, 0.05, 0.75, mat('#3c4550')); ctop.position.set(0, 0.92, -3.6); lab.add(ctop);
const shelf = box(8, 0.05, 0.4, mat('#b9c2ca')); shelf.position.set(0, 1.55, -3.78); lab.add(shelf);
{
  const r = rng(12); const cols = ['#7fd3c0', '#f2c14e', '#9fb8ff', '#ff9a8a', '#c7f0a0'];
  const glass = new THREE.MeshLambertMaterial({ color: 0xdff2f8, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 16; i++) {
    const x = -3.8 + i * 0.5 + r() * 0.1, y = i % 2 ? 1.58 : 0.95;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 10), glass); f.position.set(x, y + 0.13, -3.7 + r() * 0.1); lab.add(f);
    const liq = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.11, 10), mat(cols[i % cols.length])); liq.position.set(f.position.x, y + 0.055, f.position.z); lab.add(liq);
  }
}
// main bench
const bench = box(6.6, 0.88, 1.3, mat('#e4e9ed')); bench.position.set(0, 0.44, -1.2); lab.add(bench);
const btop = box(6.7, 0.05, 1.35, mat('#2f3741')); btop.position.set(0, 0.905, -1.2); lab.add(btop);
// microscope
const microscope = new THREE.Group(); microscope.position.set(2.6, 0.93, -1.0); lab.add(microscope);
{ const k = mat('#e8ecef'), d = mat('#2a2f36'); const b = box(0.35, 0.06, 0.4, k); b.position.y = 0.03; microscope.add(b); const arm = box(0.08, 0.5, 0.1, k); arm.position.set(0, 0.28, -0.13); microscope.add(arm); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.32, 10), d); tube.position.set(0, 0.45, -0.03); tube.rotation.x = 0.35; microscope.add(tube); const st = box(0.22, 0.03, 0.2, d); st.position.set(0, 0.2, 0.02); microscope.add(st); }
// cages
const CAGES = [];
{
  const clear = new THREE.MeshLambertMaterial({ color: 0xe8f4fb, transparent: true, opacity: 0.32, depthWrite: false });
  const lidM = mat('#5d93c7'), bedM = mat('#e3cfa2'), tagM = mat('#ffffff');
  const r = rng(31);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.position.set(-2.55 + (i % 3) * 1.05 - (i < 3 ? 0 : 0), 0.93, i < 3 ? -1.45 : -0.85);
    if (i >= 3) g.position.x = -2.05 + (i - 3) * 1.05;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.5), clear); shell.position.y = 0.21; shell.renderOrder = 2; g.add(shell);
    const bed = box(0.86, 0.04, 0.46, bedM); bed.position.y = 0.03; g.add(bed);
    const lid = box(0.94, 0.05, 0.54, lidM); lid.position.y = 0.445; g.add(lid);
    for (let k = -3; k <= 3; k++) { const bar = box(0.012, 0.012, 0.52, mat('#9fb0bf')); bar.position.set(k * 0.12, 0.475, 0); g.add(bar); }
    const tag = box(0.2, 0.12, 0.01, tagM); tag.position.set(-0.28, 0.32, 0.255); g.add(tag);
    const mice = [];
    for (let j = 0; j < 2; j++) { const m = makeRodent({ kind: 'mouse' }); m.scale.setScalar(0.22); m.position.set(-0.2 + j * 0.32, 0.05, (r() - 0.5) * 0.15); m.rotation.y = r() * 6.28; g.add(m); mice.push(m); }
    lab.add(g); CAGES.push({ g, mice, k: i / 6 + r() * 0.1 });
  }
}
function setMice(k, t = 0) {
  CAGES.forEach((c, i) => c.mice.forEach((m, j) => {
    m.visible = (i * 2 + j) / 12 < k - 1e-6;
    if (m.visible) { m.position.x = -0.2 + j * 0.32 + Math.sin(t * 1.3 + i + j * 2) * 0.08; m.rotation.y = (i + j) * 1.7 + Math.sin(t * 0.9 + i) * 0.8; m.userData.anim(t + i, 0.3); }
  }));
}
// researcher (white coat)
const researcher = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#f7f8fa', pants: '#3b4250', scale: 1 });
{ const coat = box(0.56, 0.5, 0.32, mat('#f7f8fa')); coat.position.y = 0.72; researcher.add(coat); }
researcher.position.set(-0.6, 0, 0.1); researcher.rotation.y = Math.PI; lab.add(researcher);

function setLabLight(mode) {
  if (mode === 'night') { hemi.intensity = 0.55; key.intensity = 0.35; ceilL.intensity = 10; winM.map = winTex.night; lab.background.set('#1a2230'); }
  else { hemi.intensity = 1.15; key.intensity = 1.1; ceilL.intensity = 8; winM.map = winTex.day; lab.background.set('#dfe6ec'); }
  winM.needsUpdate = true;
}
setLabLight('day');

export { lab, setLabLight, makeRodent, CAGES, setMice, researcher, microscope };
