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

const SUBS = [
  [2.6, 6.0, 'いつもは82億人が、<br>地球中に散らばっている。'],
  [6.2, 10.1, '1m²に2人、ぎゅっと<br>立ってもらおう。'],
  [10.1, 14, '100万人で、<br>だいたい700m四方。'],
  [14.2, 18.1, '1億人集まっても、<br>まだ7km四方。'],
  [18.1, 22, '空から見ると、<br>小さな四角にすぎない。'],
  [22.2, 26.1, '82億人全員で、<br>約64km四方。'],
  [26.1, 30, '山梨県1つ分の広さに、<br>すっぽり収まる。'],
  [30.2, 34.6, 'でも82億人が、<br>毎日食べる分の畑は？'],
  [34.6, 39, '世界の農地は、<br>陸の3分の1を超える。'],
  [39.2, 43.6, '1人が立つのは0.5m²。<br>食べるには約5,800m²。'],
  [43.6, 47.8, '立つ場所の、<br>1万倍以上の畑がいる。'],
  [48.1, 53.8, '結果：立つのは山梨県1つ分。<br>食べるには陸の3分の1。'],
  [53.9, 56.1, '人は、畑の上で生きている。'],
  [56.2, 59.4, '地球、広いと思う？<br>狭いと思う？'],
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
function shot5(t) { // farmland on the globe
  setEarthNight(0); gDots.visible = false; gSpark.set(0);
  jGlow.visible = true; jGlow.material.opacity = 1;
  farmVis(clamp((t - 0.5) / 4));
  earth.rotation.y = faceLon(70) - t * 0.06;
  look(0, 3, lerp(34, 31, ease(t / 9)), 0, 1, 0, 45);
  setHud('', '', 0);
  setTop('世界の農地（2023年）', comma(countUp(t, 4800, 4.6, 1.4)) + '万km²', fade(t, 4.5, 9.2, 0.25), '#e2c15a');
  return space;
}
function shot6(t) { // one person on 0.5m², farmland grows to 76m square
  crowdShot(1, 0, 0, 300, 3000); soloOff(true); crowdLabel('あなた', 9, 16, clamp((t - 4.5) / 0.5));
  me.position.set(0, 0.06, 0); me.rotation.y = 0.4; me.userData.arms[0].rotation.x = 0; me.userData.head.rotation.y = Math.sin(t * 1.5) * 0.3;
  myTile.userData.setSize(Math.SQRT1_2);
  const g = ease(clamp((t - 2.0) / 3.5)); setFarm(lerp(0.71, Math.sqrt(5831), g));
  const u = ease(clamp(t / 8.8));
  look(lerp(2.2, 30, u), lerp(2.4, 95, Math.pow(u, 1.2)), lerp(3.4, 105, u), 0, lerp(0.8, 0, u), 0, 50); crowdSky.position.copy(cam.position);
  setHud('', '', 0);
  setTop(t < 2.2 ? '1人が立つ広さ（1m²に2人）' : '1人あたりの農地（単純計算）', t < 2.2 ? '0.5m²' : '約' + comma(countUp(t, 5831, 2.3, 2.6)) + 'm²', fade(t, 0.15, 8.8, 0.25), t < 2.2 ? '#ff8a7a' : '#e2c15a');
  return crowdfield;
}
function shot7(t) { // result: globe with farmland + the tiny gathering point
  setEarthNight(0); gDots.visible = false; gSpark.set(0); jGlow.visible = true; jGlow.material.opacity = 0.6 + 0.4 * Math.sin(t * 4);
  farmVis(1);
  earth.rotation.y = faceLon(110) - t * 0.04;
  look(0, 2, lerp(32, 36, ease(t / 7.5)), 0, 1, 0, 45);
  const a = t < 3.4;
  setTop(a ? '全人類が立つ広さ（単純計算）' : '世界の農地（2023年）', a ? '4,116km²' : '4,800万km²', fade(t, 0.15, 7.5, 0.25), a ? '#ffd27a' : '#e2c15a');
  return space;
}
function shot8(t) { // loop: like the hook, everyone already at one point
  setEarthNight(0.35); farmVis(0); gDots.visible = true; gather(1); jGlow.visible = true; jGlow.material.opacity = 1; gSpark.set(0);
  globeCam(t + 1.5);
  look(0, 4, lerp(29, 30.5, ease(t / 4)), 0, 1.5, 0, 45);
  setHud('集まった人', okuStr(POP), 1, { color: '#ffd27a' });
  return space;
}
function reset(f) { if (f !== shot4) mapOff(false); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { reset(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0532',
    title: '全人類が1か所に立ったら？',
    titleHtml: '全人類が<br>1か所に立ったら？',
    mood: 'mystery', seed: 532, hits: [1.5, 48.1], risers: [22.0], impacts: [26.3, 43.8],
    sfx: [[0.2, 'whoosh'], [6.3, 'whoosh'], [14.3, 'whoosh'], [22.4, 'whoosh']],
    narr: { '1m²': '1平方メートル', '0.5m²': '0.5平方メートル', '5,800m²': '5800平方メートル', '700m': '700メートル', '7km': '7キロ', '64km': '64キロ', '1億人': 'いちおくにん' },
    ask: '地球、広いと思う？狭いと思う？',
    caption: 'もしも地球の全人類82億人が、1か所に集まって立ったら？\n1m²に2人で立つと、100万人で約700m四方、1億人でも約7km四方。82億人全員でも4,116km²、約64km四方（単純計算）。山梨県（4,465km²）1つにすっぽり収まる。\nでも、82億人が食べるための世界の農地は4,800万km²で、陸地の3分の1を超える（2023年）。1人あたりにすると約5,800m²（単純計算）。立つ場所の1万倍以上の畑が、毎日の食事を支えている。\n結果、立つのは山梨県1つ分。食べるには陸の3分の1がいる。\n\n地球、広いと思う？狭いと思う？ コメントで教えて。\n\n出典：UNFPA 世界人口ダッシュボード（2025年、国連 World Population Prospects 2024）、国土地理院 全国都道府県市区町村別面積調、FAO Land statistics 2001–2023',
    hashtags: ['もしもラボ', '世界人口', '全人類', '雑学', 'もしも'],
    endStats: [['世界の人口', '82億3,200万人', '2025年'], ['全員が立つ広さ（1m²に2人）', '4,116km²', '単純計算'], ['山梨県の面積', '4,465km²', '国土地理院'], ['世界の農地', '4,800万km²', '2023年'], ['1人あたりの農地', '約5,800m²', '単純計算']],
    sources: '出典：UNFPA（2025年・国連 WPP 2024）、国土地理院、<br>FAO Land statistics（2023年）',
  },
});
