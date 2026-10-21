import * as THREE from 'three';
import { rng, mat, box, canvasTex } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// GROCER: スーパーの青果・卵・お米の売り場（架空の店。ロゴなし）
// Layout (x right, z toward camera, 床 y=0): 野菜の平台 x -4.6..-0.4, z -0.6..1.4（手前に傾いた台）
//   卵の冷蔵ケース 奥の壁ぞい x 0.6..4.6, z -3.6（4段）/ お米の袋の山 x 5.6..7.4, z -1.5
//   吊り看板 やさい / たまご / お米（SIGNS.veg / egg / rice）
// API
//   grocer (Scene), setStock({veg, egg, rice})  各 0..1（その割合だけ商品が残る）
//   setSoldOut({veg, egg, rice})               true で 品切れ の札（SOLD.veg など）
//   tagsOn(on)                                  国産 の値札を出す／消す
//   setGrocerLight('day'|'dim')
// =====================================================
const grocer = new THREE.Scene();
grocer.background = new THREE.Color('#e6eaee');
grocer.fog = new THREE.Fog(0xe6eaee, 25, 60);
const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 1.5); grocer.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 12, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 }); grocer.add(key);

const floorTex = canvasTex(256, 256, (g) => { g.fillStyle = '#f2f1ec'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#d6d6d0'; g.lineWidth = 4; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(256, i * 128); g.stroke(); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(16, 16);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: floorTex })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; grocer.add(fl);
const wallM = mat('#e3e6e1');
const back = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 0.3), wallM); back.position.set(0, 3, -4.2); back.receiveShadow = true; grocer.add(back);
const band = box(40, 0.5, 0.05, mat('#5f9a6a')); band.position.set(0, 4.3, -4.02); grocer.add(band);
for (let i = 0; i < 6; i++) { const l = box(3, 0.06, 0.4, new THREE.MeshBasicMaterial({ color: '#ffffff' })); l.position.set(-8 + i * 3.6, 5.6, -1); grocer.add(l); }

const r = rng(41);
const items = { veg: [], egg: [], rice: [] };
// ---- vegetable table (tilted)
const VEG = new THREE.Group(); VEG.position.set(-2.5, 0, 0.4); grocer.add(VEG);
{
  const legs = box(4.4, 0.8, 2.2, mat('#7a5a40')); legs.position.y = 0.4; VEG.add(legs);
  const top = new THREE.Group(); top.position.y = 0.95; top.rotation.x = 0.28; VEG.add(top);
  const tray = box(4.4, 0.1, 2.2, mat('#5a4030')); top.add(tray);
  const lip = box(4.4, 0.2, 0.08, mat('#5a4030')); lip.position.set(0, 0.1, 1.1); top.add(lip);
  const kinds = [
    { c: '#a8cf72', mk: () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), mat('#a8cf72', { flatShading: true })), y: 0.2 },  // cabbage
    { c: '#e37a2f', mk: () => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 6), mat('#e37a2f')); m.rotation.z = Math.PI / 2; return m; }, y: 0.1 }, // carrot
    { c: '#d9413a', mk: () => new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat('#d9413a')), y: 0.12 }, // tomato
    { c: '#c9a067', mk: () => new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat('#c9a067')), y: 0.12 }, // onion
    { c: '#f1efe6', mk: () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7, 8), mat('#f1efe6')); m.rotation.z = Math.PI / 2; return m; }, y: 0.1 }, // daikon
  ];
  kinds.forEach((k, i) => {
    const x0 = -1.75 + i * 0.88;
    const bin = box(0.82, 0.06, 2.0, mat('#e9e3d6')); bin.position.set(x0, 0.08, 0); top.add(bin);
    for (let a = 0; a < 4; a++) for (let b = 0; b < 8; b++) {
      const m = k.mk(); m.castShadow = true; m.position.set(x0 - 0.27 + a * 0.18 + (r() - .5) * 0.04, k.y + (b % 2) * 0.05, -0.85 + b * 0.24); m.rotation.y = r() * 0.6; top.add(m); items.veg.push({ m, k: r() });
    }
  });
}
// ---- egg cooler (back wall)
const eggTex = canvasTex(256, 128, (g) => { g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { g.fillStyle = '#e9d3b0'; g.beginPath(); g.ellipse(28 + i * 50, 36 + j * 56, 20, 22, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(22 + i * 50, 28 + j * 56, 6, 7, 0, 0, 7); g.fill(); } });
const eggTop = new THREE.MeshLambertMaterial({ map: eggTex }), eggSide = mat('#f3f1ea');
const EGG = new THREE.Group(); EGG.position.set(2.6, 0, -3.55); grocer.add(EGG);
{
  const cm = mat('#d8dde2');
  const backP = box(4.4, 2.6, 0.08, mat('#cfd8de')); backP.position.set(0, 1.3, -0.45); EGG.add(backP);
  for (const sx of [-1, 1]) { const sp = box(0.1, 2.6, 0.9, cm); sp.position.set(sx * 2.15, 1.3, -0.05); EGG.add(sp); }
  const base = box(4.4, 0.3, 0.9, cm); base.position.set(0, 0.15, -0.05); EGG.add(base);
  const topc = box(4.4, 0.25, 1.0, mat('#c8ced4')); topc.position.set(0, 2.72, 0); EGG.add(topc);
  const glow = box(4.2, 0.04, 0.1, new THREE.MeshBasicMaterial({ color: '#ffffff' })); glow.position.set(0, 2.55, 0.42); EGG.add(glow);
  for (let s = 0; s < 4; s++) {
    const y = 0.45 + s * 0.55;
    const shelf = box(4.2, 0.04, 0.8, mat('#eef1f4')); shelf.position.set(0, y, -0.05); EGG.add(shelf);
    for (let k = 0; k < 11; k++) for (let st = 0; st < 2; st++) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.17), [eggSide, eggSide, eggTop, eggSide, eggSide, eggSide]);
      pack.position.set(-1.9 + k * 0.38, y + 0.07 + st * 0.095, 0.1 - st * 0.12); pack.rotation.x = 0.55; pack.castShadow = true; EGG.add(pack); items.egg.push({ m: pack, k: r() });
    }
  }
}
// ---- rice bags (pallet)
const riceTex = canvasTex(128, 192, (g) => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#4f8a5a'; g.fillRect(0, 120, 128, 30); g.fillStyle = '#2f3a33'; g.font = '900 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('お米', 64, 70); g.fillStyle = '#fff'; g.font = '800 22px "Noto Sans CJK JP", sans-serif'; g.fillText('5kg', 64, 143); });
const riceFace = new THREE.MeshLambertMaterial({ map: riceTex }), riceSideM = mat('#ece6d6');
const RICE = new THREE.Group(); RICE.position.set(6.5, 0, -1.4); grocer.add(RICE);
{
  const pal = box(2.2, 0.15, 1.6, mat('#a8865e')); pal.position.y = 0.08; RICE.add(pal);
  for (let lv = 0; lv < 5; lv++) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.7), [riceSideM, riceSideM, riceSideM, riceSideM, riceFace, riceSideM]);
    b.position.set(-0.78 + i * 0.52 + (r() - .5) * 0.03, 0.27 + lv * 0.21, -0.38 + j * 0.76); b.rotation.x = -Math.PI / 2; b.rotation.z = (r() - .5) * 0.06;
    b.castShadow = true; RICE.add(b); items.rice.push({ m: b, k: (4 - lv) / 5 + r() * 0.18 });
  }
}
// ---- signs and tags
const SIGNS = {
  veg: textSprite('やさい', { w: 512, h: 160, size: 96, bg: 'rgba(79,138,90,.95)', sx: 2.0 }),
  egg: textSprite('たまご', { w: 512, h: 160, size: 96, bg: 'rgba(214,150,58,.95)', sx: 2.0 }),
  rice: textSprite('お米', { w: 512, h: 160, size: 96, bg: 'rgba(95,120,150,.95)', sx: 1.8 }),
};
SIGNS.veg.position.set(-2.5, 3.4, 0.4); SIGNS.egg.position.set(2.6, 3.65, -3.4); SIGNS.rice.position.set(6.5, 2.9, -1.4);
Object.values(SIGNS).forEach(s => grocer.add(s));
const TAGS = [];
for (const [x, y, z] of [[-4.25, 1.25, 1.75], [-3.37, 1.25, 1.75], [-2.49, 1.25, 1.75], [-1.61, 1.25, 1.75], [-0.73, 1.25, 1.75], [1.0, 0.25, -2.95], [3.0, 0.25, -2.95], [6.5, 0.45, -0.45]]) {
  const t = textSprite('国産', { w: 256, h: 128, size: 76, bg: 'rgba(255,255,255,.96)', color: '#2f7a45', sx: 0.42 }); t.position.set(x, y, z); grocer.add(t); TAGS.push(t);
}
const mkSold = () => textSprite('品切れ', { w: 512, h: 160, size: 100, bg: 'rgba(214,58,52,.95)', sx: 1.5 });
const SOLD = { veg: mkSold(), egg: mkSold(), rice: mkSold() };
SOLD.veg.position.set(-2.5, 1.9, 1.0); SOLD.egg.position.set(2.6, 1.6, -2.8); SOLD.rice.position.set(6.5, 1.0, -0.5); SOLD.rice.scale.multiplyScalar(0.7);
Object.values(SOLD).forEach(s => { s.visible = false; grocer.add(s); });

function setStock({ veg = 1, egg = 1, rice = 1 } = {}) {
  for (const it of items.veg) it.m.visible = it.k < veg;
  for (const it of items.egg) it.m.visible = it.k < egg;
  for (const it of items.rice) it.m.visible = it.k < rice;
}
function setSoldOut({ veg = false, egg = false, rice = false } = {}) { SOLD.veg.visible = veg; SOLD.egg.visible = egg; SOLD.rice.visible = rice; }
function tagsOn(on) { TAGS.forEach(t => t.visible = on); }
function setGrocerLight(m) { const d = m === 'dim'; hemi.intensity = d ? 1.0 : 1.5; key.intensity = d ? 0.7 : 1.1; grocer.background.set(d ? '#c9ced3' : '#e6eaee'); grocer.fog.color.set(d ? '#c9ced3' : '#e6eaee'); }
setStock(); setSoldOut(); tagsOn(true);

export { grocer, setStock, setSoldOut, tagsOn, setGrocerLight, SIGNS, SOLD, TAGS, VEG as vegTable, EGG as eggCase, RICE as riceStack };
