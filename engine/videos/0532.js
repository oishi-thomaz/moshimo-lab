import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { japan, ll, setMapEnv, LAND_Y } from '../scenes/japan.js';
import { crowdfield, world, setScale, setCrowd, setPeopleN, makePatch, setCrowdEnv, crowdSky } from '../scenes/crowdfield.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも地球の全人類が1か所に立ったら？（blueprint no 32。0032 は別の動画で使用済みのため id 0532）
// 数字：
//  世界人口 82億3,200万人（2025年、UNFPA World Population Dashboard＝国連 World Population Prospects 2024 にもとづく）
//  1m²に2人（1人0.5m²）で立つ条件の単純計算：100万人 0.5km²（約700m四方）、1億人 50km²（約7km四方）、82.32億人 4,116km²（約64km四方）
//  山梨県の面積 4,465.27km²（国土地理院 全国都道府県市区町村別面積調。山梨県の資料より）
//  世界の農地 48億ha＝4,800万km²、陸地の3分の1超（FAO Land statistics 2001–2023, 2023年）
//  1人あたりの農地 4,800万km² ÷ 82.32億人 ≒ 5,831m²（単純計算）→ 立つ広さ0.5m²の約1万1,700倍

// ---------- globe: everyone gathers to one point ----------
const J = latLon(35.6, 138.6, 10.12).normalize();
const LAND = [[40, -100], [35, -85], [50, -110], [20, -100], [-10, -60], [-20, -50], [0, -70], [-30, -60], [10, 20], [0, 25], [-10, 30], [20, 10], [10, 0], [-20, 25], [50, 10], [45, 30], [55, 40], [60, 90], [40, 100], [25, 80], [20, 105], [10, 105], [-25, 135], [35, 138], [0, 115], [28, 77], [23, 90], [31, 121], [-6, 107], [14, 121], [6, 3], [30, 31], [52, 0], [40, -4], [19, -99], [-23, -46], [40, -74], [34, -118], [55, 37], [37, 127]];
const NG = 420;
const gDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe08a }), NG); earth.add(gDots);
const gStart = [];
{ const r = rng(32); for (let i = 0; i < NG; i++) { const [la, lo] = LAND[i % LAND.length]; gStart.push(latLon(la + (r() - .5) * 14, lo + (r() - .5) * 18, 1).normalize()); } }
const _m = new THREE.Matrix4(), _v = new THREE.Vector3();
function slerpV(a, b, u, out) { const d = clamp(a.dot(b), -0.9999, 0.9999), om = Math.acos(d), s = Math.sin(om); return out.copy(a).multiplyScalar(Math.sin((1 - u) * om) / s).addScaledVector(b, Math.sin(u * om) / s); }
function gather(u) { // u 0 = spread, 1 = all at J
  for (let i = 0; i < NG; i++) { const k = clamp((u * 1.35 - (i % 7) * 0.05)); slerpV(gStart[i], J, ease(k), _v).normalize().multiplyScalar(10.12); _m.makeTranslation(_v.x, _v.y, _v.z); gDots.setMatrixAt(i, _m); }
  gDots.instanceMatrix.needsUpdate = true;
}
const jGlow = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true })); jGlow.position.copy(J).multiplyScalar(10.12); earth.add(jGlow);
const gSpark = makeSparkles(200, 0.45); earth.add(gSpark.points); gSpark.init([jGlow.position.toArray()], 0.2, 2.0);
// farmland patches (stylized: where most cropland / pasture is)
const FARM = [];
{
  const r = rng(8); const geo = new THREE.CircleGeometry(1, 7); const z = new THREE.Vector3(0, 0, 1);
  const zones = [[30, 48, -105, 25, 26], [-38, -15, -65, 20, 18], [-12, 0, -55, 15, 8], [45, 55, -5, 40, 26], [45, 54, 40, 40, 20], [20, 32, 72, 16, 18], [28, 42, 103, 18, 20], [8, 16, -15, 45, 22], [-30, -12, 18, 15, 10], [-35, -22, 120, 30, 16], [40, 50, 60, 40, 14], [-5, 10, 32, 10, 8]];
  for (const [la0, la1, lo0, span, n] of zones) for (let i = 0; i < n; i++) {
    const nrm = latLon(la0 + r() * (la1 - la0), lo0 + r() * span, 1).normalize();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: r() < 0.5 ? 0xe2c15a : 0xc9d46a, transparent: true, opacity: 0, depthWrite: false }));
    const s = 0.55 + r() * 0.5; m.scale.set(s, s, 1); m.position.copy(nrm).multiplyScalar(10.07); m.quaternion.setFromUnitVectors(z, nrm); earth.add(m); FARM.push({ m, k: r() });
  }
}
function farmVis(k) { for (const f of FARM) { f.m.visible = k > 0.001; f.m.material.opacity = 0.85 * clamp((k - f.k * 0.6) / 0.4); } }
function globeOff() { gDots.visible = false; jGlow.visible = false; gSpark.set(0); farmVis(0); }

// ---------- Japan map: Yamanashi outline + 64km square ----------
const YAMA = [[138.18, 35.45], [138.28, 35.75], [138.42, 35.92], [138.62, 35.97], [138.85, 35.92], [139.05, 35.88], [139.16, 35.72], [139.05, 35.6], [139.02, 35.45], [138.9, 35.37], [138.72, 35.32], [138.6, 35.2], [138.45, 35.17], [138.32, 35.3]];
const yPts = YAMA.map(([lo, la]) => ll(lo, la, LAND_Y + 0.35)); yPts.push(yPts[0].clone());
const yLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(yPts), new THREE.LineBasicMaterial({ color: 0xffffff })); japan.add(yLine);
const yFill = (() => { const sh = new THREE.Shape(YAMA.map(([lo, la]) => { const v = ll(lo, la); return new THREE.Vector2(v.x, -v.z); })); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = LAND_Y + 0.3; japan.add(m); return m; })();
const YC = ll(138.66, 35.6, LAND_Y + 0.45);
const SIDE = 64.2 / 11.1; // units (1 unit ≈ 11.1km)
const sq = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false })); sq.rotation.x = -Math.PI / 2; sq.position.copy(YC); sq.renderOrder = 6; japan.add(sq);
yLine.material.depthTest = false; yLine.renderOrder = 7;
const yLab = textSprite('山梨県', { w: 512, h: 160, size: 96, color: '#fff', stroke: 10, sx: 4.2 }); yLab.position.copy(ll(138.66, 36.25, LAND_Y + 1.2)); yLab.material.depthTest = false; yLab.renderOrder = 8; japan.add(yLab);
function mapOff(on) { yLine.visible = yFill.visible = sq.visible = yLab.visible = on; }

// ---------- crowdfield: one person vs farmland per person ----------
const me = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#e05a4f', pants: '#2b3346' }); world.add(me);
const myTile = makePatch('#ff6b5a'); myTile.position.y = 0.06;
const farm = makePatch('#d9b84e'); farm.position.y = 0.045;
const farmEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0xffffff })); farmEdge.rotation.x = -Math.PI / 2; farmEdge.position.y = 0.08; world.add(farmEdge);
// rows on the farmland
const rowsTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#d9b84e'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#b9983a'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 16, 128, 5); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
farm.material.map = rowsTex; farm.material.color.set('#ffffff'); farm.material.needsUpdate = true;
const cLab = textSprite('100万人', { w: 512, h: 160, size: 100, color: '#fff', stroke: 12, sx: 1 }); cLab.material.depthTest = false; cLab.renderOrder = 8; crowdfield.add(cLab);
function crowdLabel(txt, y, sx, op) { cLab.userData.set(txt); cLab.position.set(0, y, 0); cLab.scale.set(sx, sx * 160 / 512, 1); cLab.visible = op > 0.01; cLab.material.opacity = op; }
function soloOff(on) { me.visible = myTile.visible = farm.visible = farmEdge.visible = on; }
function setFarm(m) { farm.userData.setSize(m); farmEdge.scale.set(m, m, 1); farmEdge.visible = m > 0.01; rowsTex.repeat.set(m / 2, m / 2); }

// ---------- 起きる現象（ここから作り直し） ----------
// 熱：立っている人の代謝は約100W（ASHRAE 代謝量の表では立位 約70W/m²×体表面1.8m²≒126W。控えめに100Wで計算）
//   82.32億人×100W＝8,232億W＝823GW。原発1基100万kW（1GW）として約820基分
//   1m²に2人 → 1m²あたり約200W。地表が吸収する太陽の光は平均約163W/m²（NASA Earth Observatory「Earth's Energy Budget」）
// トイレ：成人の尿量は1日約1,000〜1,500mL → 1.2Lで計算。82.32億×1.2L＝約988万m³。東京ドームの容積124万m³ → 約8杯
// 重さ：世界の成人の平均体重62kg（Walpole et al. 2012, BMC Public Health）で全員を計算（子どもも含むので多めの見積もり）→ 約5.1億トン
//   地球の質量5.97×10^24kg（NASA）→ 約12兆分の1。重心のずれ 5.1e11×6,371km÷5.97e24 ≒ 0.00054mm
// 陸地：約1億4,890万km²（理科年表）→ 4,116km²は0.003%。残り99.997%は無人
import { stage, makeBar, makeLabel as stageLabel } from '../scenes/stage.js';
import { mat as smat } from '../lib.js';

const heatSpark = makeSparkles(500, 0.9, 0xff8a3a); crowdfield.add(heatSpark.points);
// stage: heat vs sunlight bars, and Tokyo Dome volumes
const bHeat = makeBar({ color: '#ff6a3a', label: '人の熱', x: -1.5, w: 1.8, d: 1.8, nameTop: true });
const bSun = makeBar({ color: '#ffd23f', label: '太陽の光', x: 1.5, w: 1.8, d: 1.8, nameTop: true });
const domes = [];
for (let i = 0; i < 8; i++) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), smat('#e8eef5'));
  d.position.set(-2.4 + (i % 4) * 1.6, 0.3, -0.6 + Math.floor(i / 4) * 1.9); stage.add(d); domes.push(d);
}
const domeLab = stageLabel('東京ドーム 約8杯', { sx: 4.2, size: 72, color: '#7fd4ff', stroke: 8, w: 768, h: 128 }); domeLab.position.set(0, 3.6, 0); stage.add(domeLab);
function stageMode(m) { [bHeat.g, bSun.g].forEach(o => { o.visible = m === 'bars'; }); domes.forEach(o => { o.visible = m === 'domes'; }); domeLab.visible = m === 'domes'; }
// globe label for the weight / center of mass
const shiftLab = textSprite('0.0005mm', { w: 512, h: 160, size: 100, color: '#ffd27a', stroke: 12, sx: 7 }); shiftLab.material.depthTest = false; shiftLab.renderOrder = 9; space.add(shiftLab);

const SUBS = [
  [2.6, 6.0, 'いつもは82億人が、<br>地球中に散らばっている。'],
  [6.2, 10.1, '1m²に2人、ぎゅっと<br>立ってもらおう。'],
  [10.1, 14, '100万人で、<br>だいたい700m四方。'],
  [14.2, 18.1, '1億人集まっても、<br>まだ7km四方。'],
  [18.1, 22, '空から見ると、<br>小さな四角にすぎない。'],
  [22.2, 26.1, '82億人全員で、<br>約64km四方。'],
  [26.1, 30, '山梨県1つ分の広さに、<br>すっぽり収まる。'],
  [30.2, 34.1, 'では、この四角の中で<br>何が起きる？'],
  [34.2, 38.1, '人は立っているだけで、<br>1人約100Wの熱を出す。'],
  [38.2, 42.1, '82億人で8,200億W。<br>原発約820基分。'],
  [42.2, 46.1, '1m²あたり約200W。<br>太陽の光（約160W）より強い。'],
  [46.2, 50.1, '四角の中は熱がこもり、<br>どんどん暑くなる。'],
  [50.2, 54.1, 'トイレは1人1日約1.2L。<br>全員で東京ドーム約8杯分。'],
  [54.2, 58.1, 'それが毎日、<br>この四角の中に出る。'],
  [58.2, 62.1, '全員の体重を足すと、<br>多めに見て約5億トン。'],
  [62.2, 66.1, '地球はかたむく？<br>重心のずれは0.0005mm。'],
  [66.2, 70.1, '地球の重さの、<br>約12兆分の1しかない。'],
  [70.2, 77.4, '結果：四角の中は太陽より熱い。<br>でも地球はびくともしない。'],
  [77.5, 80.1, 'そのとき陸地の99.997%は、<br>人が1人もいない。'],
  [80.2, 83.4, 'あなたなら真ん中と端、<br>どっちに立つ？'],
];

const POP = 82.32; // 億人
const okuStr = (v) => (v >= 1 ? (Math.floor(v) + '億' + (Math.round((v % 1) * 10000) ? comma(Math.round((v % 1) * 10000)) + '万' : '')) : comma(Math.round(v * 10000)) + '万') + '人';
function globeCam(t, lonOff = 0) { earth.rotation.y = faceLon(128 + lonOff) + t * 0.02; }
function shot0(t) { // hook: dots from every continent rush to one point
  setEarthNight(0.35); farmVis(0); gDots.visible = true; jGlow.visible = t > 1.3; jGlow.material.opacity = clamp((t - 1.3) / 0.3);
  const u = clamp(t / 1.5); gather(u);
  gSpark.set(t > 1.45 ? (t - 1.45) / 1.0 : 0);
  globeCam(t);
  look(0, 4, lerp(31, 29, ease(t / 2.5)), 0, 1.5, 0, 45);
  el.title.style.opacity = 1;
  setHud('集まった人', okuStr(POP * ease(u)), 1, { color: t > 1.5 ? '#ffd27a' : '#fff' });
  return space;
}
function shot1(t) { // everyday: people spread over the earth
  setEarthNight(0.35); gDots.visible = true; gather(0); jGlow.visible = false; gSpark.set(0); farmVis(0);
  earth.rotation.y = faceLon(60) - t * 0.06;
  look(0, 3, lerp(30, 28, ease(t / 3.5)), 0, 1, 0, 45);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return space;
}
function crowdShot(scale, area, n, fogN, fogF) {
  setScale(scale); setCrowd(area); setPeopleN(n); soloOff(false);
  crowdfield.fog.near = fogN; crowdfield.fog.far = fogF; setCrowdEnv('day');
}
function shot2(t) { // 1,000,000 people: camera lifts from the crowd
  crowdShot(1, 5e5, 70, 600, 3800);
  const u = ease(clamp((t - 0.3) / 7.4));
  const h = lerp(6, 520, Math.pow(u, 1.6)), z = lerp(26, 720, Math.pow(u, 1.4));
  look(0, h, z, 0, lerp(1, 0, u), lerp(-4, 0, u), 50); crowdSky.position.copy(cam.position);
  setHud('集まった人', '100万人', 1);
  crowdLabel('100万人', 120, 420, clamp((u - 0.55) / 0.2));
  setTop('100万人が立つ広さ（1m²に2人・単純計算）', (countUp(t, 50, 4.2, 1.2) / 100).toFixed(2) + 'km²', fade(t, 4.1, 8, 0.25));
  return crowdfield;
}
function shot3(t) { // 100,000,000 people
  crowdShot(0.1, 5e7, 0, 1500, 3900);
  const u = ease(t / 8);
  look(0, lerp(260, 1250, u), lerp(420, 1500, u), 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  setHud('集まった人', '1億人', 1);
  crowdLabel('1億人', 220, 700, clamp((t - 3.6) / 0.5));
  setTop('1億人が立つ広さ（単純計算）', countUp(t, 50, 0.3, 1.2) + 'km²', fade(t, 0.15, 8, 0.25));
  return crowdfield;
}
function shot4(t) { // 8.2 billion: square on the map inside Yamanashi
  lift(220);
  setMapEnv('day'); mapOff(true);
  const g = ease(clamp((t - 0.6) / 2.4)); sq.scale.set(SIDE * Math.max(0.02, g), SIDE * Math.max(0.02, g), 1);
  yLab.visible = t > 3.8; yLab.material.opacity = clamp((t - 3.8) / 0.4);
  const u = ease(t / 8);
  look(YC.x + lerp(4, 1.5, u), lerp(60, 17, u), YC.z + lerp(45, 13, u), YC.x, 0, YC.z - 0.5, 50);
  setHud('集まった人', '82億3,200万人', 1, { color: '#ffd27a' });
  setTop(t < 4.0 ? '82億人が立つ広さ（2025年・単純計算）' : '山梨県の面積（国土地理院）', t < 4.0 ? comma(countUp(t, 4116, 0.4, 1.6)) + 'km²' : '4,465km²', fade(t, 0.15, 8, 0.25), '#ffd27a');
  return japan;
}
function shotQ(t) { // the square on the map, pulsing: what happens inside?
  lift(220); setMapEnv('day'); mapOff(true); yLab.visible = true; yLab.material.opacity = 1;
  const p = 1 + Math.sin(t * 5) * 0.03; sq.scale.set(SIDE * p, SIDE * p, 1); sq.material.color.set('#ffc94a');
  look(YC.x + 1.5, 17, YC.z + 13, YC.x, 0, YC.z - 0.5, 50);
  setHud('集まった人', '82億3,200万人', 1, { color: '#ffd27a' });
  setTop('この四角の中で', '何が起きる？', fade(t, 0.15, 3.9, 0.25), '#ffd27a');
  return japan;
}
function shotHeat(t) { // crowd from low above, heat rising
  crowdShot(1, 5e5, 70, 300, 2200); setCrowdEnv(t > 12 ? 'dusk' : 'day');
  heatSpark.init(Array.from({ length: 30 }, (_, i) => [(i % 6 - 2.5) * 30, 2, (Math.floor(i / 6) - 2) * 30]), 40, 80);
  heatSpark.set(((t * 0.18) % 1) * 0.9 + 0.05);
  const u = ease(t / 16); look(lerp(10, 40, u), lerp(14, 70, u), lerp(30, 110, u), 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  setHud('', '', 0);
  if (t < 3.9) setTop('立っている人1人の熱（ASHRAE）', '約100W', fade(t, 0.15, 3.9, 0.25), '#ff8a5a');
  else if (t < 7.9) setTop('82億人で（原発1基100万kWとして）', '約820基分', fade(t, 3.9, 7.9, 0.25), '#ff8a5a');
  else if (t < 11.9) setTop('1m²あたり（太陽の光は約160W）', '約200W', fade(t, 7.9, 11.9, 0.25), '#ff8a5a');
  else setTop('四角の中', 'どんどん暑くなる', fade(t, 11.9, 16, 0.25), '#ff6a4a');
  return crowdfield;
}
function shotBars(t) { // 200 W/m² vs sunlight 163 W/m²
  lift(240); stageMode('bars'); const H = 4.4 / 200;
  stageMode('bars'); bHeat.setH(200 * H * ease(clamp((t - 0.2) / 1.2)), '約200W'); bSun.setH(163 * H * ease(clamp((t - 0.7) / 1.2)), '約160W');
  look(0, 4.4, 14.5, 0, 3.0, 0, 50);
  setTop('1m²あたり（太陽の光はNASA・地表の平均）', '人の熱が上', fade(t, 0.15, 3.9, 0.25), '#ff8a5a');
  return stage;
}
function shotDome(t) {
  lift(240); stageMode('domes');
  domes.forEach((d, i) => { const k = ease(clamp((t - 0.4 - i * 0.25) / 0.4)); d.scale.setScalar(Math.max(0.001, k)); d.visible = k > 0.01; });
  domeLab.visible = t > 2.6; domeLab.scale.set(4.2, 0.7, 1);
  const u = ease(t / 8); look(lerp(0, 0.4, u), lerp(7.5, 7.0, u), lerp(14, 13, u), 0, 1.4, 0, 50);
  if (t < 3.9) setTop('トイレ（1人1日約1.2Lで計算）', '1日 約988万m³', fade(t, 0.15, 3.9, 0.25), '#7fd4ff');
  else setTop('それが毎日', '四角の中に出る', fade(t, 3.9, 7.9, 0.25), '#7fd4ff');
  return stage;
}
function shotWeight(t) { // globe: everyone on one point, earth doesn't budge
  setEarthNight(0.2); farmVis(0); gDots.visible = true; gather(1); jGlow.visible = true; jGlow.material.opacity = 0.7 + 0.3 * Math.sin(t * 5); gSpark.set(0);
  earth.rotation.y = faceLon(138.6) + Math.sin(t * 0.6) * 0.15;
  const show = t > 4.0; shiftLab.visible = show && t < 8.0; shiftLab.position.set(0, 9.0, 4); shiftLab.scale.set(7, 7 * 160 / 512, 1);
  look(0, 3, lerp(33, 30, ease(t / 12)), 0, 1.5, 0, 45);
  setHud('', '', 0);
  if (t < 3.9) setTop('全員の体重（平均62kgで計算・多めの見積もり）', '約5億トン', fade(t, 0.15, 3.9, 0.25), '#ffd27a');
  else if (t < 7.9) setTop('地球の重心のずれ', '約0.0005mm', fade(t, 3.9, 7.9, 0.25), '#ffd27a');
  else setTop('地球の重さとくらべて', '約12兆分の1', fade(t, 7.9, 11.9, 0.25), '#ffd27a');
  return space;
}
function shotResult(t) { // map: the square glows hot red
  lift(240); setMapEnv('day'); mapOff(true); yLab.visible = true; yLab.material.opacity = 1;
  const p = 1 + Math.sin(t * 6) * 0.04; sq.scale.set(SIDE * p, SIDE * p, 1); sq.material.color.set('#ff5a3a');
  const u = ease(t / 7.2); look(YC.x + lerp(1.5, 3, u), lerp(17, 28, u), YC.z + lerp(13, 22, u), YC.x, 0, YC.z - 0.5, 50);
  setHud('', '', 0);
  if (t < 3.6) setTop('四角の中', '太陽の光より熱い', fade(t, 0.15, 3.6, 0.25), '#ff6a4a');
  else setTop('地球の重心', '0.0005mmしか動かない', fade(t, 3.6, 7.2, 0.25), '#ffd27a');
  return japan;
}
function shotEmpty(t) { // globe: one tiny point, rest empty
  setEarthNight(0); farmVis(0); gDots.visible = false; jGlow.visible = true; jGlow.material.opacity = 0.6 + 0.4 * Math.sin(t * 6); gSpark.set(0); shiftLab.visible = false;
  earth.rotation.y = faceLon(150) - t * 0.05;
  look(0, 2, lerp(32, 35, ease(t / 2.6)), 0, 1, 0, 45);
  setTop('人がいない陸地', '99.997%', fade(t, 0.15, 2.6, 0.25), '#7fd4ff');
  return space;
}
function shot8(t) { // loop: like the hook, everyone already at one point
  setEarthNight(0.35); farmVis(0); gDots.visible = true; gather(1); jGlow.visible = true; jGlow.material.opacity = 1; gSpark.set(0); shiftLab.visible = false;
  globeCam(t + 1.5);
  look(0, 4, lerp(29, 30.5, ease(t / 4)), 0, 1.5, 0, 45);
  setHud('集まった人', okuStr(POP), 1, { color: '#ffd27a' });
  return space;
}
function reset(f) { if (![shot4, shotQ, shotResult].includes(f)) mapOff(false); shiftLab.visible = false; heatSpark.set(0); stageMode(''); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 34, f: shotQ }, { a: 34, b: 42, f: (t, T) => shotHeat(t, T) }, { a: 42, b: 46, f: shotBars },
  { a: 46, b: 50, f: (t, T) => shotHeat(t + 12, T) }, { a: 50, b: 58, f: shotDome }, { a: 58, b: 70, f: shotWeight }, { a: 70, b: 77.4, f: shotResult },
  { a: 77.4, b: 80.1, f: shotEmpty }, { a: 80.1, b: 83.6, f: shot8 }, { a: 83.6, b: 88.6, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { reset(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 88.6,
  meta: {
    id: '0532',
    series: '日本人全員で',
    title: '全人類が1か所に立ったら？',
    titleHtml: '全人類が<br>1か所に立ったら？',
    mood: 'mystery', seed: 532, hits: [1.5, 70.2], risers: [22.0, 70.0], impacts: [26.3, 38.2, 42.2, 50.2, 58.2, 62.2, 70.2],
    sfx: [[0.2, 'whoosh'], [6.3, 'whoosh'], [14.3, 'whoosh'], [22.4, 'whoosh'], [30.4, 'drone'], [34.4, 'meter', 0.4], [38.4, 'meter', 0.8], [42.4, 'meter', 1.0], [46.4, 'alarm'], [50.6, 'bubble'], [58.4, 'whoosh'], [62.6, 'meter', 0.1], [77.6, 'whoosh']],
    narr: { '1m²': '1平方メートル', '700m': '700メートル', '7km': '7キロ', '64km': '64キロ', '1億人': 'いちおくにん', '100W': '100ワット', '8,200億W': '8200億ワット', '200W': '200ワット', '160W': '160ワット', '1.2L': '1.2リットル', '0.0005mm': '0.0005ミリ', '99.997%': '99.997パーセント' },
    ask: 'あなたなら真ん中と端、どっちに立つ？',
    caption: 'もしも地球の全人類82億人が、1か所に集まって立ったら？\n\n1m²に2人で立つと、100万人で約700m四方、1億人でも約7km四方。82億人全員で4,116km²、約64km四方（単純計算）。山梨県（4,465km²）1つにすっぽり収まる。\n\nでも、この四角の中では…\n・熱：人は立っているだけで1人約100Wの熱を出す。82億人で約8,200億W、原発約820基分（1基100万kWとして）\n・1m²あたり約200W。地面が受ける太陽の光（平均約160W）より強く、四角の中は熱がこもってどんどん暑くなる\n・トイレ：1人1日約1.2Lで、全員で東京ドーム約8杯分が毎日出る\n・重さ：全員の体重を足すと多めに見て約5億トン。それでも地球の重さの約12兆分の1。地球の重心は0.0005mmしかずれない\n\n結果：四角の中は太陽より熱い。でも地球はびくともしない。\nそのとき陸地の99.997%は、人が1人もいない。\n\nあなたなら真ん中と端、どっちに立つ？ コメントで教えて。\n\n※すべて単純計算です。\n\n出典：UNFPA 世界人口ダッシュボード（2025年）、国土地理院 全国都道府県市区町村別面積調、ASHRAE（人の代謝量）、NASA Earth Observatory「Earth’s Energy Budget」、東京ドーム公式（容積124万m³）、Walpole et al. 2012（BMC Public Health・世界の成人の平均体重62kg）、NASA（地球の質量）、理科年表（陸地面積）',
    hashtags: ['もしもラボ', '世界人口', '全人類', '雑学', 'もしも'],
    endStats: [['全員が立つ広さ', '4,116km²', '山梨県より少し小さい'], ['全員の熱', '約8,200億W', '原発約820基分'], ['1m²あたりの熱', '約200W', '太陽の光は約160W'], ['トイレ（1日）', '東京ドーム約8杯', '1人1.2L'], ['地球の重心のずれ', '約0.0005mm', '体重約5億トン']],
    sources: '出典：UNFPA（2025年）、国土地理院、ASHRAE、NASA、<br>東京ドーム、Walpole et al. 2012、理科年表',
  },
});
