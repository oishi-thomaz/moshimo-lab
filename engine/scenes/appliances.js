import * as THREE from 'three';
import { mat, box, canvasTex } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// APPLIANCES：ローポリの家電（ブランドなし）と、家電を並べる「ラインナップ」（ヤバい順の回用）
// どの家電も 床（または取り付け面）が原点、正面が +z。単位はメートル。
// API
//   makeTV()（.userData.screen：画面の Mesh。material.color で色を変える）
//   makeMicrowave()（.userData.door / .userData.light）
//   makeWasher()（.userData.drum：回転させる）
//   makeFridge()（.userData.doorTop / doorBot）
//   makeAircon()（壁掛け。原点は本体の背面の中心、.userData.flap / .userData.lamp）
//   aLineup (Scene), ASLOTS（5つの台座）, setASlot(i, { show, meter, word, glow, t }), aLineupIdle(t), setALabels([...5つの名前])
//     setASlot の meter は 0〜1.08（ダメージの大きさ）、word はメーターの上に出す言葉（ほぼゼロ／小／中／大／危険 など）
// =====================================================

const white = mat('#f2f3f5'), gray = mat('#c9cdd3'), dark = mat('#1c1f26'), glass = new THREE.MeshLambertMaterial({ color: '#2a3442', transparent: true, opacity: 0.85 });

function makeTV() {
  const g = new THREE.Group();
  const stand = box(0.5, 0.04, 0.25, dark); stand.position.y = 0.02; g.add(stand);
  const neck = box(0.08, 0.16, 0.06, dark); neck.position.y = 0.12; g.add(neck);
  const body = box(1.2, 0.72, 0.06, dark); body.position.y = 0.56; g.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.64), new THREE.MeshBasicMaterial({ color: '#4fa3d1' })); screen.position.set(0, 0.56, 0.032); g.add(screen);
  g.userData.screen = screen;
  return g;
}
function makeMicrowave() {
  const g = new THREE.Group();
  const body = box(0.56, 0.34, 0.4, white); body.position.y = 0.17; g.add(body);
  const door = box(0.38, 0.26, 0.02, glass); door.position.set(-0.07, 0.17, 0.205); g.add(door);
  const panel = box(0.12, 0.26, 0.02, gray); panel.position.set(0.2, 0.17, 0.205); g.add(panel);
  for (let i = 0; i < 3; i++) { const b = box(0.06, 0.03, 0.01, dark); b.position.set(0.2, 0.24 - i * 0.06, 0.218); g.add(b); }
  const light = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0 })); light.position.set(-0.07, 0.17, 0.217); g.add(light);
  g.userData.door = door; g.userData.light = light;
  return g;
}
function makeWasher() {
  const g = new THREE.Group();
  const body = box(0.64, 0.9, 0.62, white); body.position.y = 0.45; g.add(body);
  const top = box(0.64, 0.12, 0.62, gray); top.position.y = 0.96; g.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 28), gray); ring.position.set(0, 0.48, 0.315); g.add(ring);
  const drum = new THREE.Group(); drum.position.set(0, 0.48, 0.3); g.add(drum);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.19, 28), glass); drum.add(win);
  for (let i = 0; i < 3; i++) { const cl = box(0.1, 0.06, 0.01, mat(['#e05a4f', '#4fa3d1', '#f2c14e'][i])); cl.position.set(Math.cos(i * 2.1) * 0.08, Math.sin(i * 2.1) * 0.08, 0.005); drum.add(cl); }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), dark); knob.rotation.x = Math.PI / 2; knob.position.set(0.2, 0.96, 0.32); g.add(knob);
  g.userData.drum = drum;
  return g;
}
function makeFridge() {
  const g = new THREE.Group();
  const body = box(0.7, 1.8, 0.66, white); body.position.y = 0.9; g.add(body);
  const doorTop = box(0.7, 1.08, 0.04, mat('#e8eaee')); doorTop.position.set(0, 1.25, 0.35); g.add(doorTop);
  const doorBot = box(0.7, 0.66, 0.04, mat('#e8eaee')); doorBot.position.set(0, 0.36, 0.35); g.add(doorBot);
  for (const [y, h] of [[1.25, 0.36], [0.48, 0.22]]) { const hd = box(0.04, h, 0.04, gray); hd.position.set(-0.28, y, 0.39); g.add(hd); }
  g.userData.doorTop = doorTop; g.userData.doorBot = doorBot;
  return g;
}
function makeAircon() {
  const g = new THREE.Group();
  const body = box(0.9, 0.3, 0.24, white); body.position.set(0, 0, 0.12); g.add(body);
  const flap = box(0.8, 0.04, 0.06, gray); flap.position.set(0, -0.14, 0.24); g.add(flap);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.03), new THREE.MeshBasicMaterial({ color: '#7ff0c8' })); lamp.position.set(0.36, -0.04, 0.242); g.add(lamp);
  g.userData.flap = flap; g.userData.lamp = lamp;
  return g;
}

// ---------- lineup ----------
const aLineup = new THREE.Scene();
aLineup.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1324'); gr.addColorStop(0.6, '#16223b'); gr.addColorStop(1, '#0b1120'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
aLineup.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2238, 1.1));
const lkey = new THREE.DirectionalLight(0xffffff, 1.3); lkey.position.set(3, 8, 7); lkey.castShadow = true; lkey.shadow.mapSize.set(1024, 1024); Object.assign(lkey.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); aLineup.add(lkey);
const lfloor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), mat('#1b2846')); lfloor.rotation.x = -Math.PI / 2; lfloor.receiveShadow = true; aLineup.add(lfloor);
const SX = [-2.2, -1.1, 0, 1.1, 2.2];
const MH = 2.0;
const MAKERS = [makeTV, makeMicrowave, makeWasher, makeFridge, makeAircon];
const HERO_S = [0.85, 1.55, 1.2, 0.72, 1.0];
const HERO_Y = [0.33, 0.33, 0.33, 0.33, 0.95];
const ASLOTS = SX.map((x, i) => {
  const g = new THREE.Group(); g.position.set(x, 0, 0); aLineup.add(g);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.32, 28), mat('#2c3b5e')); ped.position.y = 0.16; ped.receiveShadow = true; ped.castShadow = true; g.add(ped);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 6, 32), mat('#7fd4ff', { emissive: 0x245a78, emissiveIntensity: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.33; g.add(rim);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.34, MH, 0.12), new THREE.MeshLambertMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.16 })); tube.position.set(0, 1.1 + MH / 2, -0.75); g.add(tube);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, MH, 0.12)), new THREE.LineBasicMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.5 })); frame.position.copy(tube.position); g.add(frame);
  const fillM = new THREE.MeshLambertMaterial({ color: '#7ff0c8', emissive: 0x1a4a3a, emissiveIntensity: 0.8 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.1), fillM); fill.geometry.translate(0, 0.5, 0); fill.position.set(0, 1.1, -0.75); fill.scale.y = 0.001; g.add(fill);
  const lab = textSprite('', { size: 60, sx: 1.0, w: 640, h: 128, stroke: 8 }); lab.position.set(0, 0.06, 0.78); lab.material.depthTest = false; lab.renderOrder = 5; g.add(lab);
  const word = textSprite('', { size: 72, sx: 0.95, w: 512, h: 128, stroke: 8 }); word.position.set(0, 1.1 + MH + 0.32, -0.75); word.visible = false; word.material.depthTest = false; word.renderOrder = 6; g.add(word);
  const hero = MAKERS[i]();
  hero.scale.setScalar(HERO_S[i]); hero.position.y = HERO_Y[i]; hero.rotation.y = -0.35;
  if (i === 4) { // aircon on a small post
    const post = box(0.06, 0.62, 0.06, mat('#8a93a6')); post.position.set(0, -0.32 / HERO_S[i], -0.02); hero.add(post); hero.rotation.y = -0.2;
  }
  hero.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.add(hero);
  return { g, ped, rim, fill, fillM, word, hero, heroScale: HERO_S[i], lab, curWord: '' };
});
function setALabels(names) { names.forEach((n, i) => { const s = ASLOTS[i]; s.lab.userData.set(n); s.lab.scale.set(n.length > 3 ? 1.3 : 1.0, (n.length > 3 ? 1.3 : 1.0) * 128 / 640, 1); }); }
setALabels(['テレビ', '電子レンジ', '洗濯機', '冷蔵庫', 'エアコン']);
const COLD = new THREE.Color('#7ff0c8'), MID = new THREE.Color('#ffd166'), HOT = new THREE.Color('#ff5a4f');
function setASlot(i, { show = 1, meter = 0, word = '', glow = 0, t = 0 } = {}) {
  const s = ASLOTS[i];
  s.hero.visible = show > 0.01;
  s.hero.scale.setScalar(s.heroScale * Math.max(0.001, show));
  s.fill.scale.y = Math.max(0.001, Math.min(1.08, meter)) * MH;
  const c = meter < 0.5 ? COLD.clone().lerp(MID, meter / 0.5) : MID.clone().lerp(HOT, Math.min(1, (meter - 0.5) / 0.5));
  s.fillM.color.copy(c); s.fillM.emissive.copy(c).multiplyScalar(0.35 + glow * 0.5 * (0.5 + 0.5 * Math.sin(t * 14)));
  if (word !== s.curWord) { s.word.userData.set(word); s.curWord = word; }
  s.word.visible = !!word; s.word.position.y = 1.1 + Math.max(0.05, Math.min(1.08, meter)) * MH + 0.35;
}
function aLineupIdle(t) { ASLOTS.forEach((s, i) => { if (s.hero.visible) s.hero.rotation.y = (i === 4 ? -0.2 : -0.35) + Math.sin(t * 0.6 + i) * 0.12; s.rim.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(t * 2 + i); }); }

export { makeTV, makeMicrowave, makeWasher, makeFridge, makeAircon, aLineup, ASLOTS, setASlot, aLineupIdle, setALabels };
