import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, canvasTex, randPerson, poseWalk } from '../lib.js';
import { city, setEnv, setStore, setStoreLights, setBurst, RX0, RZ0 } from '../city.js';
import { space, earth, latLon, faceLon, setEarthNight, spaceSun } from '../scenes/earth.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも地球の自転が止まったら？（blueprint no 36）
// 前提：自転が一瞬で止まり、空気（大気）はそれまでの速さで動き続けると仮定した思考実験
// 数字：
//  赤道の自転の速さ 時速約1,667km、赤道の海のふくらみ 約8km、止まると海は両極へ移り赤道に巨大な大陸、
//    1日の長さは1年と同じに（Esri ArcUser, Witold Fraczek「What Would Happen If Earth Stopped Spinning」2025年6月
//    https://www.esri.com/about/newsroom/arcuser/what-would-happen-if-earth-stopped-spinning）
//  東京（北緯35.7°）の速さ＝1,667×cos35.7° ≒ 時速1,354km ≒ 秒速約376m（計算）→ 地面が止まると、空気がその速さで吹く（計算）
//  日本の観測史上最大の瞬間風速 85.3m/s（1966年 宮古島、第2宮古島台風。気象庁 災害をもたらした気象事例
//    https://www.data.jma.go.jp/stats/data/bosai/report/1966/19660904/19660904.html）→ 376÷85.3 ≒ 約4.4倍（計算）
//  昼が続く長さ：1日＝1年なので、昼も夜も約半年（365÷2≒183日、計算）
//  世界人口 約82億人（2024年半ば、国連 World Population Prospects 2024 https://news.un.org/en/story/2024/07/1151971）
//  昼と夜の境目が動く速さ（赤道）：赤道一周 約40,075km÷365.25日 ≒ 1日約110km（計算）
//  1日の長さは100年あたり平均+1.8ミリ秒ずつ伸びている（Stephenson et al. 2016, Proc. R. Soc. A
//    https://pmc.ncbi.nlm.nih.gov/articles/PMC5247521/）

// ---------- space extras ----------
const glowTex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.18, 'rgba(255,236,170,1)'); gr.addColorStop(0.45, 'rgba(255,190,90,.35)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false })); space.add(sunSpr);
const SUN_DIR = new THREE.Vector3(-1, 0.16, -0.06).normalize();
// 昼側（熱い）・夜側（凍る）・境目（住める帯）を塗る外側の球（地球と一緒には回らない＝太陽の向きで決まる）
const zoneM = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { sd: { value: SUN_DIR.clone() }, k: { value: 0 }, band: { value: 0 }, phase: { value: 0 } },
  vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: `uniform vec3 sd; uniform float k; uniform float band; uniform float phase; varying vec3 vN;
  void main(){ float d = dot(vN, sd);
    float hot = smoothstep(0.08, 0.6, d) * k; float cold = smoothstep(-0.08, -0.6, d) * k; float shade = smoothstep(0.02, -0.35, d);
    float b = (1.0 - smoothstep(0.0, 0.2, abs(d))) * band;
    vec3 c = vec3(0.0); float a = shade * 0.55;
    c += vec3(1.0, 0.45, 0.12) * hot; a = max(a, hot * 0.62);
    c += vec3(0.85, 0.93, 1.0) * cold; a = max(a, cold * 0.78);
    float stripe = 0.75 + 0.25 * sin(vN.y * 40.0 + phase);
    c = mix(c, vec3(0.45, 1.0, 0.7) * stripe, b); a = max(a, b * 0.85);
    gl_FragColor = vec4(c, a); }`,
});
const zone = new THREE.Mesh(new THREE.SphereGeometry(10.08, 64, 48), zoneM); zone.renderOrder = 5; space.add(zone);
// 海が両極へ移る様子（イメージ）。地球と一緒に回るよう earth の子に
const oceanC = document.createElement('canvas'); oceanC.width = 512; oceanC.height = 256;
const oceanT = new THREE.CanvasTexture(oceanC); oceanT.colorSpace = THREE.SRGBColorSpace;
const ocean = new THREE.Mesh(new THREE.SphereGeometry(10.03, 64, 48), new THREE.MeshLambertMaterial({ map: oceanT, transparent: true, depthWrite: false })); earth.add(ocean);
let lastOK = -1;
function setOceans(k) { // k 0..1
  const q = Math.round(k * 60) / 60; if (q === lastOK) return; lastOK = q;
  const g = oceanC.getContext('2d'); g.clearRect(0, 0, 512, 256);
  if (q <= 0) { oceanT.needsUpdate = true; return; }
  const y = la => (90 - la) / 180 * 256;
  // 赤道の大陸（茶と緑）
  g.fillStyle = `rgba(176,150,96,${0.95 * Math.min(1, q * 1.6)})`;
  g.beginPath(); for (let x = 0; x <= 512; x += 8) { const w = 6 + 22 * q + 3 * Math.sin(x * 0.07) + 2 * Math.sin(x * 0.19); g.lineTo(x, y(w)); } for (let x = 512; x >= 0; x -= 8) { const w = 6 + 22 * q + 3 * Math.sin(x * 0.05 + 1) + 2 * Math.sin(x * 0.23); g.lineTo(x, y(-w)); } g.closePath(); g.fill();
  g.fillStyle = `rgba(110,160,90,${0.6 * Math.min(1, q * 1.6)})`;
  for (let i = 0; i < 40; i++) { const x = (i * 97) % 512, yy = y((((i * 37) % 30) - 15) * q); g.beginPath(); g.ellipse(x, yy, 14, 4, 0, 0, 7); g.fill(); }
  // 両極の海（深い青）
  g.fillStyle = `rgba(28,84,150,${0.92 * Math.min(1, q * 1.4)})`;
  const north = 88 - 46 * q, south = -(88 - 40 * q);
  g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= 512; x += 8) g.lineTo(x, y(north + 3 * Math.sin(x * 0.06))); g.lineTo(512, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0, 256); for (let x = 0; x <= 512; x += 8) g.lineTo(x, y(south + 3 * Math.sin(x * 0.08 + 2))); g.lineTo(512, 256); g.closePath(); g.fill();
  oceanT.needsUpdate = true;
}
const labN = textSprite('北の海', { w: 512, h: 128, size: 76, bg: 'rgba(20,40,80,.8)', sx: 4.4 }); labN.position.copy(latLon(62, 140, 11.2)); earth.add(labN);
const labE = textSprite('赤道の大陸', { w: 640, h: 128, size: 76, bg: 'rgba(90,70,30,.85)', sx: 5.4 }); labE.position.copy(latLon(0, 140, 11.2)); earth.add(labE);
const labS = textSprite('南の海', { w: 512, h: 128, size: 76, bg: 'rgba(20,40,80,.8)', sx: 4.4 }); labS.position.copy(latLon(-36, 150, 11.2)); earth.add(labS);
const pinJ = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a })); pinJ.position.copy(latLon(35.7, 139.7, 10.1)); earth.add(pinJ);
const arrow = textSprite('→ 1日約110km', { w: 768, h: 128, size: 76, bg: 'rgba(20,60,40,.85)', sx: 5.6 }); space.add(arrow);
function spaceBase({ rot = 0, sun = 1, zoneK = 0, band = 0, oceans = 0, labels = 0, pin = 0 } = {}) {
  earth.rotation.set(0.25, faceLon(139.7) + rot, 0);
  setEarthNight(0); spaceSun.position.copy(SUN_DIR).multiplyScalar(40);
  sunSpr.visible = sun > 0; sunSpr.position.copy(SUN_DIR).multiplyScalar(260); sunSpr.scale.setScalar(70); sunSpr.material.opacity = sun;
  zoneM.uniforms.k.value = zoneK; zoneM.uniforms.band.value = band; zone.visible = true;
  setOceans(oceans); ocean.visible = oceans > 0;
  [labN, labE].forEach(l => { l.visible = labels > 0.01; l.material.opacity = labels; }); labS.visible = false;
  pinJ.visible = pin > 0; arrow.visible = false;
}
const spaceCam = (t, d = 8, z0 = 58, z1 = 54) => { const u = ease(t / d); look(lerp(4, 2, u), lerp(6, 5, u), lerp(z0, z1, u), 0, 0, 0, 50); };

// ---------- city crossing ----------
const CX = RZ0, CZ = RX0;
const gWind = new THREE.Group(); city.add(gWind);
const walkers = [];
{
  const r = rng(36);
  for (let i = 0; i < 18; i++) {
    const p = randPerson(r); gWind.add(p);
    const horiz = r() < 0.5, s = r() < 0.5 ? 1 : -1, j = (r() - .5) * 1.6;
    const a = horiz ? [CX - 9, CZ + s * 6 + j] : [CX + s * 6 + j, CZ - 9], b = horiz ? [CX + 9, CZ + s * 6 + j] : [CX + s * 6 + j, CZ + 9];
    walkers.push({ p, a: r() < .5 ? a : b, b: r() < .5 ? b : a, o: r(), sp: 0.04 + r() * 0.02, ph: r() * 6 });
  }
}
// 揺れる木（まわりの木とは別に、角に置く）
const wTrees = [];
{
  const r = rng(7);
  for (const [dx, dz] of [[5.2, 5.4], [5.2, 9.5], [9.8, 5.2], [-5.2, 5.4], [5.2, -5.4], [13.5, 5.2]]) {
    const g = new THREE.Group(); g.position.set(CX + dx, 0.15, CZ + dz); gWind.add(g);
    const tr = box(0.24, 1.6, 0.24, mat('#6b4f3a')); tr.position.y = 0.8; g.add(tr);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 + r() * 0.3, 0), mat(r() < .5 ? '#4f8f4a' : '#3f7a44', { flatShading: true })); c.position.y = 2.3; c.castShadow = true; g.add(c);
    wTrees.push({ g, ph: r() * 6 });
  }
}
// 飛んでいく紙・葉・砂（横に流れる細長い粒）
const N_DEB = 420;
const debM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, vertexColors: false });
const deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.05, 0.05), debM, N_DEB); deb.frustumCulled = false; gWind.add(deb);
const debC = []; { const r = rng(99); const cols = ['#f4f1ea', '#e7d9b5', '#b7a27a', '#9fb98a', '#d8d2c4']; for (let i = 0; i < N_DEB; i++) { deb.setColorAt(i, new THREE.Color(cols[i % 5])); debC.push({ y: 0.2 + Math.pow(r(), 1.6) * 7, z: CZ - 10 + r() * 22, o: r() * 60, sp: 30 + r() * 30, len: 0.6 + r() * 2.2 }); } }
const dm = new THREE.Matrix4(), dq = new THREE.Quaternion(), dv = new THREE.Vector3(), ds = new THREE.Vector3();
function setDebris(t, k) {
  deb.visible = k > 0; if (!k) return;
  debC.forEach((d, i) => {
    const x = CX - 30 + ((d.o + t * d.sp) % 60);
    dv.set(x, d.y + Math.sin(t * 9 + i) * 0.15, d.z); ds.set(d.len * k, 1, 1); dm.compose(dv, dq, ds); deb.setMatrixAt(i, dm);
  });
  deb.instanceMatrix.needsUpdate = true;
}
function cityBase(T, { people = 1, wind = 0 } = {}) {
  setEnv('day', new THREE.Vector3(CX, 0, CZ)); setStore(1); setStoreLights(0.3); setBurst(0);
  walkers.forEach(w => {
    w.p.visible = people > 0;
    const u = (T * w.sp + w.o) % 1; const x = lerp(w.a[0], w.b[0], u), z = lerp(w.a[1], w.b[1], u);
    w.p.position.set(x, 0.15, z); w.p.rotation.y = Math.atan2(w.b[0] - w.a[0], w.b[1] - w.a[1]); poseWalk(w.p, T * 4.5 + w.ph, 1); w.p.position.y += 0.15;
  });
  wTrees.forEach(tr => { tr.g.rotation.z = -wind * (0.55 + 0.12 * Math.sin(T * 14 + tr.ph)); });
  setDebris(T, wind);
}
const cityCam = (t, d) => { const u = ease(t / d); look(CX + lerp(11, 12.5, u), lerp(5.2, 6.0, u), CZ + lerp(13, 14.5, u), CX + 1, 0.9, CZ + 1, 50); };

// ---------- stage: wind bars ----------
const barA = makeBar({ color: '#4fa3d1', w: 2.4, d: 2.4, label: '台風の最強記録', x: -2.6, z: 0, nameTop: true });
const barB = makeBar({ color: '#e0603a', w: 2.4, d: 2.4, label: '止まった地球の風', x: 2.6, z: 0, nameTop: true });
function barsOn(on) { barA.g.visible = on; barB.g.visible = on; }

const SUBS = [
  [2.6, 6.0, 'これは、止まる直前の<br>いつもの街。'],
  [6.2, 10.1, '地面は止まった。でも、<br>空気は止まらない。'],
  [10.1, 14, '東京では、秒速約376mの<br>風が吹く計算。'],
  [14.2, 18.1, '日本の観測史上最強の風は、<br>秒速85.3m。'],
  [18.1, 22, 'その約4.4倍の風が、<br>街を吹き抜ける。'],
  [22.2, 26.1, '太陽が、空の同じ場所から<br>動かなくなった。'],
  [26.1, 30, '1日の長さは、<br>1年と同じになる。'],
  [30.2, 34.6, '昼側は焼けつき、<br>夜側は凍りつく。'],
  [34.6, 39, '82億人が暮らせるのは、<br>昼と夜の境目だけ。'],
  [39.2, 43.6, '海は両極へ流れ、<br>北の低い土地をのみこむ。'],
  [43.6, 47.8, '赤道には、地球を一周する<br>巨大な大陸が現れる。'],
  [48.1, 53.8, '結果：82億人が、動く夕方を<br>追いかけて暮らすことに。'],
  [53.9, 56.1, '実は今も、1日は伸びている。'],
  [56.2, 59.4, '住むなら、ずっと昼？<br>ずっと夜？'],
];

const TS = 1.4; // stop
const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
function shot0(t) { // hook: spinning earth, countdown, stop
  const ang = Math.min(t, TS) * 0.9;
  spaceBase({ rot: -1.26 + ang, sun: 1, pin: 1 });
  el.flash.style.opacity = t >= TS ? 0.5 * Math.max(0, 1 - (t - TS) / 0.3) : 0;
  lift(220); look(2, 5, 52, 0, 0, 0, 50);
  el.title.style.opacity = 1;
  setHud('自転が止まるまで', cd(Math.max(0, TS - t)), 1, { mono: true, color: t < TS ? '#fff' : '#ff6b6b' });
  return space;
}
function shot1(t, T) { // everyday city
  cityBase(T, { people: 1, wind: 0 });
  lift(200); cityCam(t, 3.5);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return city;
}
function shot2(t, T) { // +1s: wind
  cityBase(T, { people: 0, wind: clamp(t / 0.6) });
  el.flash.style.opacity = 0.12 + 0.05 * Math.sin(T * 30);
  lift(200); cityCam(t + 3.5, 12);
  hudTime('+1秒');
  setTop('東京で吹く風（計算）', '秒速' + countUp(t, 376, 4.0, 1.3) + 'm', fade(t, 3.95, 8, 0.25), '#ff8a7a');
  return city;
}
function shot3(t) { // +1min: bars
  setStageColor('#14213a'); barsOn(true);
  const a = clamp((t - 0.3) / 1.2), b = clamp((t - 4.1) / 1.5);
  barA.setH(1.6 * ease(a), a > 0 ? (85.3 * ease(a)).toFixed(1) + 'm/s' : '');
  barB.setH(7.0 * ease(b), b > 0 ? Math.round(376 * ease(b)) + 'm/s' : '');
  const u = ease(t / 8);
  lift(300); look(lerp(-1, 1, u), lerp(7, 7.5, u), lerp(23, 22, u), 0, 4.2, 0, 50);
  hudTime('+1分');
  if (t < 4.0) setTop('観測史上最大の瞬間風速（1966年・宮古島）', countUp(t, 853, 0.3, 1.2) / 10 + 'm/s', fade(t, 0.15, 4.0, 0.2));
  else setTop('台風の最強記録と比べると（計算）', '約' + (countUp(t, 44, 4.2, 1.2) / 10).toFixed(1) + '倍', fade(t, 4.0, 8, 0.2), '#ff8a7a');
  return stage;
}
function shot4(t) { // +1 day: sun stops
  spaceBase({ rot: 0, sun: 1, pin: 1 });
  sunSpr.scale.setScalar(70 + 6 * Math.sin(t * 2));
  lift(330); spaceCam(t, 8);
  hudTime('+1日');
  setTop('昼がつづく長さ（計算）', '約' + countUp(t, 183, 4.0, 1.3) + '日', fade(t, 3.95, 8, 0.25), '#ffd27a');
  return space;
}
function shot5(t) { // +half year: hot/cold sides, band
  const k = clamp(t / 2.5);
  spaceBase({ rot: 0, sun: 1, zoneK: k, band: clamp((t - 4.3) / 1.0), pin: 1 });
  zoneM.uniforms.phase.value = t * 3;
  lift(330); spaceCam(t, 9.2, 56, 52);
  hudTime('+半年');
  setTop('世界の人口（2024年・国連）', '約' + countUp(t, 82, 4.4, 1.3) + '億人', fade(t, 4.35, 9.2, 0.25));
  return space;
}
function shot6(t) { // +years: oceans move to the poles
  spaceBase({ rot: 0.15, sun: 0.6, oceans: clamp(t / 6.5), labels: clamp((t - 4.4) / 0.6), pin: 0 });
  lift(330); spaceCam(t, 8.8, 54, 51);
  hudTime('+数年');
  setTop('赤道の海のふくらみ（Esri・2025年）', '約' + countUp(t, 8, 0.4, 1.2) + 'km', fade(t, 0.15, 8.8, 0.25));
  return space;
}
function shot7(t, T) { // result: band of twilight, people chase it
  spaceBase({ rot: 0.15, sun: 1, zoneK: 1, band: 1, oceans: 1, pin: 0 });
  zoneM.uniforms.phase.value = T * 3;
  arrow.visible = T < 53.85; arrow.position.set(3.5, -6.5, 9); arrow.material.opacity = 1;
  lift(330); spaceCam(t, 7.5, 54, 51);
  if (T < 53.85) setTop('昼と夜の境目が動く速さ（赤道・計算）', '1日約' + countUp(t, 110, 0.2, 1.2) + 'km', fade(t, 0.15, 5.75, 0.25), '#7ff0c8');
  else setTop('100年で伸びる1日の長さ（2016年の研究）', '+' + (countUp(T - 53.9, 18, 0.1, 0.9) / 10).toFixed(1) + 'ミリ秒', fade(T, 53.9, 56.1, 0.2), '#ffd27a');
  return space;
}
function shot8(t) { // loop: the hook framing, stopped earth with the result zones
  spaceBase({ rot: -1.26 + TS * 0.9, sun: 1, zoneK: 1, band: 1, oceans: 1, pin: 1 });
  zoneM.uniforms.phase.value = t * 3;
  lift(220); look(2, 5, 52, 0, 0, 0, 50);
  setHud('自転が止まるまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  if (t < 0.6) setTop('100年で伸びる1日の長さ（2016年の研究）', '+1.8ミリ秒', fade(t + 55.5, 53.9, 56.1, 0.2), '#ffd27a');
  return space;
}
function reset(f) { barsOn(f === shot3); gWind.visible = f === shot1 || f === shot2; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { reset(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0036',
    title: '地球の自転が止まったら？',
    titleHtml: '地球の自転が<br>止まったら？',
    mood: 'tension', seed: 36, hits: [1.4, 48.1], risers: [6.0], impacts: [10.1, 18.1, 26.1],
    sfx: [[1.4, 'whoosh'], [6.2, 'meter', 0.7], [30.4, 'drone']],
    narr: { '秒速約376m': 'びょうそく やく さんびゃくななじゅうろくメートル', '秒速85.3m': 'びょうそく はちじゅうごてんさんメートル', '約4.4倍': 'やく よんてんよんばい', '82億人': 'はちじゅうにおくにん' },
    ask: '住むなら、ずっと昼？ずっと夜？',
    caption: 'もしも地球の自転が、ある瞬間ぴたっと止まったら？\n地面は止まっても、空気は動き続ける。赤道の自転の速さは時速約1,667km。東京だと秒速約376mの風が吹く計算で、日本の観測史上最強の瞬間風速85.3m/s（1966年・宮古島）の約4.4倍。\n太陽は空の同じ場所から動かなくなり、1日の長さは1年と同じに。昼も夜も約半年ずつ続く（計算）。昼側は焼けつき、夜側は凍りつく。赤道で約8km盛り上がっていた海はやがて両極へ流れ、赤道には地球を一周する巨大な大陸が現れる（Esriのシミュレーション）。\n結果、約82億人が、ゆっくり動く昼と夜の境目（赤道で1日約110km・計算）を追いかけて暮らすことになる。\nちなみに現実の1日も、100年あたり平均1.8ミリ秒ずつ伸びている。\n\n住むなら、ずっと昼？ずっと夜？ コメントで教えて。\n\n出典：Esri ArcUser「What Would Happen If Earth Stopped Spinning」（2025年）、気象庁（1966年 宮古島の最大瞬間風速）、国連 World Population Prospects 2024、Stephenson et al. Proc. R. Soc. A（2016年）\n（計算）時速1,667km×cos35.7°、赤道一周40,075km÷365日。自転が一瞬で止まり、空気は動き続けると仮定した思考実験',
    hashtags: ['もしもラボ', '地球', '自転', '宇宙', '雑学'],
    endStats: [['東京で吹く風', '秒速約376m', '計算'], ['観測史上最強の風', '85.3m/s', '1966年'], ['昼がつづく長さ', '約半年', '計算'], ['世界の人口', '約82億人', '2024年'], ['境目が動く速さ（赤道）', '1日約110km', '計算']],
    sources: '出典：Esri ArcUser（2025年）、気象庁（1966年）、<br>国連 世界人口推計2024、Stephenson et al.（2016年）',
  },
});
