import * as THREE from 'three';
import { rng, mat, canvasTex, makeSky, SKIN, SHIRT, HAIR } from '../lib.js';

// =====================================================
// CROWDFIELD：見渡すかぎりの平原に、人がぎっしり立つ「人の四角」（全人類が集まったら、など規模の比較用）
// 単位：world の中は 1 = 1m。setScale(s) で world 全体を s 倍（km 規模を撮るときは 0.1 など。カメラの far は 4000）
// API
//   crowdfield (Scene), world (Group), setScale(s)
//   setCrowd(areaM2) — 人の四角（正方形）の面積を m² で。中心は原点。近くの人は 1m²に2人の間隔で立つ人形（最大 70×70人）、その外は人の頭の模様の板
//   people（InstancedMesh）, setPeopleN(side) — 人形を side×side 人だけ出す
//   makePatch(color) -> Mesh（地面に置く正方形。setSize(m) で一辺）
//   setCrowdEnv('day'|'dusk'), crowdSky（cam の位置に動かす：crowdSky.position.copy(cam.position)）
// =====================================================
const crowdfield = new THREE.Scene();
const crowdSky = makeSky(); crowdfield.add(crowdSky);
crowdfield.fog = new THREE.Fog(0xcfe0ee, 400, 3800);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a7040, 1.1); crowdfield.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.5); sun.position.set(300, 500, 200); crowdfield.add(sun);
const world = new THREE.Group(); crowdfield.add(world);

// ground with field / town texture
const gTex = canvasTex(512, 512, (g, w, h) => {
  const r = rng(3); g.fillStyle = '#86ad5f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { const c = ['#7da358', '#93b866', '#a7c071', '#6f9850', '#b8b07a'][Math.floor(r() * 5)]; g.fillStyle = c; g.fillRect(r() * w, r() * h, 30 + r() * 90, 30 + r() * 90); }
  g.strokeStyle = 'rgba(200,190,160,.6)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(r() * w, 0); g.lineTo(r() * w, h); g.stroke(); g.beginPath(); g.moveTo(0, r() * h); g.lineTo(w, r() * h); g.stroke(); }
});
gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping; gTex.repeat.set(200, 200);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000), new THREE.MeshLambertMaterial({ map: gTex })); ground.rotation.x = -Math.PI / 2; world.add(ground);

// carpet of heads: 1 tile = 8 x 8 people at 0.707m
const SP = Math.SQRT1_2;
const cTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b0a498'; g.fillRect(0, 0, w, h); const r = rng(9);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const x = (i + 0.5) * 32 + (r() - .5) * 8, y = (j + 0.5) * 32 + (r() - .5) * 8;
    g.fillStyle = SHIRT[Math.floor(r() * SHIRT.length)]; g.beginPath(); g.ellipse(x, y + 3, 13, 9, 0, 0, 7); g.fill();
    g.fillStyle = HAIR[Math.floor(r() * HAIR.length)]; g.beginPath(); g.arc(x, y - 1, 6.5, 0, 7); g.fill();
  }
});
cTex.wrapS = cTex.wrapT = THREE.RepeatWrapping;
const carpet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: cTex, color: '#ffd0a0' })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.05; world.add(carpet);
const edge = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.52, 4, 1), new THREE.MeshBasicMaterial({ color: 0xffe08a, side: THREE.DoubleSide })); edge.rotation.x = -Math.PI / 2; edge.rotation.z = Math.PI / 4; edge.position.y = 0.08; world.add(edge);
function setCrowd(area) {
  const s = Math.sqrt(Math.max(area, 0.01)); carpet.scale.set(s, s, 1); carpet.visible = area > 0.01;
  cTex.repeat.set(s / (8 * SP), s / (8 * SP));
  edge.scale.set(s * Math.SQRT2, s * Math.SQRT2, 1); edge.visible = carpet.visible;
  edge.material.color.set(0xffe08a);
}

// people figures (instanced)
const MAXS = 70;
const bodyG = new THREE.BoxGeometry(0.42, 1.25, 0.26); bodyG.translate(0, 0.62, 0);
const headG = new THREE.BoxGeometry(0.24, 0.26, 0.24); headG.translate(0, 1.42, 0);
const people = new THREE.InstancedMesh(bodyG, new THREE.MeshLambertMaterial(), MAXS * MAXS);
const heads = new THREE.InstancedMesh(headG, new THREE.MeshLambertMaterial(), MAXS * MAXS);
{
  const r = rng(21); const m = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < MAXS * MAXS; i++) {
    const a = i % MAXS, b = Math.floor(i / MAXS);
    e.set(0, r() * 6.28, 0); q.setFromEuler(e); const sc = 0.92 + r() * 0.16;
    m.compose(new THREE.Vector3((a - (MAXS - 1) / 2) * SP + (r() - .5) * 0.12, 0, (b - (MAXS - 1) / 2) * SP + (r() - .5) * 0.12), q, new THREE.Vector3(sc, sc, sc));
    people.setMatrixAt(i, m); heads.setMatrixAt(i, m);
    people.setColorAt(i, c.set(SHIRT[Math.floor(r() * SHIRT.length)])); heads.setColorAt(i, c.set(r() < 0.75 ? HAIR[Math.floor(r() * HAIR.length)] : SKIN[0]));
  }
}
world.add(people); world.add(heads);
const BASE = []; // [x, z, rotY, scale] per figure
{ const m = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), e = new THREE.Euler();
  for (let i = 0; i < MAXS * MAXS; i++) { people.getMatrixAt(i, m); m.decompose(v, q, sc); e.setFromQuaternion(q); BASE.push([v.x, v.z, e.y, sc.x]); } }
// setPeopleN(side): figures only inside the central side x side square of people
let lastSide = -1;
function setPeopleN(side) {
  if (side === lastSide) return; lastSide = side;
  const half = side / 2, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  BASE.forEach(([x, z, ry, sc], i) => {
    const a = i % MAXS - (MAXS - 1) / 2, b = Math.floor(i / MAXS) - (MAXS - 1) / 2;
    const on = Math.max(Math.abs(a), Math.abs(b)) < half; const k = on ? sc : 0.0001;
    q.setFromEuler(e.set(0, ry, 0)); m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(k, k, k)); people.setMatrixAt(i, m); heads.setMatrixAt(i, m);
  });
  people.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
}

function makePatch(color = '#e2c15a') {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(color)); p.rotation.x = -Math.PI / 2; p.position.y = 0.04; world.add(p);
  p.userData.setSize = (m) => { p.scale.set(m, m, 1); p.visible = m > 0.001; };
  return p;
}

// 遠くから撮るとき（setScale が1未満）は模様を消して、人の群れの平均色にする（細かい模様のちらつき防止）
function setScale(s) { world.scale.setScalar(s); const far = s < 0.5; if ((carpet.material.map === null) !== far) { carpet.material.map = far ? null : cTex; carpet.material.color.set(far ? '#c4906c' : '#ffd0a0'); carpet.material.needsUpdate = true; } crowdfield.fog.near = 400; crowdfield.fog.far = 3800; }
const CENV = {
  day: { top: '#5c9fe0', bot: '#dff0fb', fog: '#cfe0ee', hi: 1.1, si: 1.5 },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#d9b49c', hi: 0.95, si: 1.1 },
};
function setCrowdEnv(e) { const E = CENV[e]; crowdSky.material.uniforms.top.value.set(E.top); crowdSky.material.uniforms.bot.value.set(E.bot); crowdfield.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; }
setCrowdEnv('day');

export { crowdfield, world, setScale, setCrowd, people, setPeopleN, makePatch, setCrowdEnv, crowdSky };
