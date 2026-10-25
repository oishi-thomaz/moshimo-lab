import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, canvasTex, makePerson, randPerson, SKIN, HAIR } from '../lib.js';
import { japan, ll, CITY, setDots, setMapEnv, makeRing, LAND_Y } from '../scenes/japan.js';
import { stage, setStageColor } from '../scenes/stage.js';
import { look, lift, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本人全員が1円ずつ出したら？（blueprint no 131・日本人全員でシリーズ）
// 数字
//   総人口 1億2,269万人（総務省統計局 人口推計 2026年10月1日現在 概算値 https://www.stat.go.jp/data/jinsui/new.html）
//     → 全員が1円ずつ＝1億2,269万円
//   一円アルミニウム貨幣：直径20.0mm・量目1.00g（財務省「通常貨幣一覧」https://www.mof.go.jp/policy/currency/coin/general_coin/list.htm）
//     → 重さ 1億2,269万g＝約123トン（単純計算）／1列に並べると 1億2,269万×2cm＝2,454km（単純計算）
//       比較：宗谷岬→札幌→函館→青森→仙台→東京→名古屋→大阪→広島→福岡→鹿児島 を直線で結ぶと約2,240km（大圏距離の合計・自分で計算）
//     → 1秒に1枚数えると 1億2,269万秒＝約3.9年（単純計算）
//   毎日1円を1年：1億2,269万円×365日＝約448億円（単純計算）
//   学校給食費 公立小学校 月額平均4,688円（年間の食材費を11か月で割った額。文部科学省「令和5年度学校給食費調査」
//     https://www.mext.go.jp/content/20240612-mxt-kenshoku-000036395-1.pdf）→ 年5万1,568円
//     → 448億円÷5万1,568円＝約87万人分（推計）

const POP = 12269; // 万人
const SILVER = '#c9cdd4';
// coin face texture: plain "1" (not the real design)
const faceTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(110, 100, 10, 128, 128, 128); gr.addColorStop(0, '#f2f4f7'); gr.addColorStop(1, '#a9aeb7');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  g.strokeStyle = 'rgba(80,86,96,.5)'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
  g.fillStyle = '#6d737e'; g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 128, 136);
});
faceTex.center.set(0.5, 0.5); faceTex.rotation = Math.PI / 2;
const edgeM = mat(SILVER), faceM = new THREE.MeshLambertMaterial({ map: faceTex });
function makeCoin(r = 0.5) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.16, 32), [edgeM, faceM, faceM]);
}

// ---------- stage props ----------
// hero coin (big, spinning)
const coinGrp = new THREE.Group(); stage.add(coinGrp);
const bigCoin = makeCoin(1.6); bigCoin.rotation.x = Math.PI / 2; bigCoin.castShadow = true; coinGrp.add(bigCoin);
const coinSpark = makeSparkles(120, 0.35, 0xffffff); stage.add(coinSpark.points); coinSpark.init([[0, 3.2, 0]], 1.8, 1.4);

// coin mountain (instanced), cone R=4.3, H=3.4 at full size
const PILE_N = 7000;
const pileGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12);
const pile = new THREE.InstancedMesh(pileGeo, new THREE.MeshLambertMaterial({ color: SILVER }), PILE_N); pile.castShadow = true; stage.add(pile);
const PILE = [];
{ const r = rng(31); for (let i = 0; i < PILE_N; i++) { const rr = 4.3 * Math.sqrt(r()); const a = r() * 6.283; const y = 3.4 * (1 - rr / 4.3); PILE.push([Math.cos(a) * rr, Math.max(0.02, y - r() * 0.12), Math.sin(a) * rr, r() * 3, r() * 3]); } PILE.sort((a, b) => a[1] - b[1]); }
const dm = new THREE.Object3D();
function setPile(k, x = 0, z = 0) { // k 0..1 grows the mountain (uniformly scaled)
  pile.visible = k > 0.001; if (!pile.visible) return;
  const s = Math.cbrt(k);
  PILE.forEach(([px, py, pz, ra, rb], i) => { dm.position.set(x + px * s, 0.3 + py * s, z + pz * s); dm.rotation.set(ra * 0.4, rb, rb * 0.3); dm.updateMatrix(); pile.setMatrixAt(i, dm.matrix); });
  pile.instanceMatrix.needsUpdate = true;
}
const scaleMan = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#e05a4f', pants: '#2b3346', scale: 1 }); scaleMan.position.set(3.4, 0.3, 4.6); scaleMan.rotation.y = 0.5; stage.add(scaleMan);

// counting desk
const COUNT = new THREE.Group(); COUNT.position.set(0, 0.3, 0); stage.add(COUNT);
const desk = box(2.6, 0.08, 1.2, mat('#b08a63')); desk.position.set(0, 0.78, 0); COUNT.add(desk);
for (const [x, z] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]]) { const l = box(0.08, 0.78, 0.08, mat('#6b5440')); l.position.set(x, 0.39, z); COUNT.add(l); }
const counter = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#3f8f6b', pants: '#3b3f4a', long: true, scale: 1 });
const counterPv = new THREE.Group(); counterPv.position.set(0, 0.52, -0.95); COUNT.add(counterPv); counterPv.add(counter); counter.position.y = -0.86;
counter.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
const chair = box(0.6, 0.08, 0.6, mat('#3c4a5e')); chair.position.set(0, 0.48, -1.0); COUNT.add(chair);
const stackGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), stackM = new THREE.MeshLambertMaterial({ color: SILVER });
const STACKS = [];
for (let a = 0; a < 8; a++) for (let b = 0; b < 3; b++) {
  const g = new THREE.Group(); g.position.set(-1.0 + a * 0.28, 0.83, -0.1 + b * 0.3); COUNT.add(g);
  const cs = []; for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(stackGeo, stackM); c.position.y = 0.01 + i * 0.021; g.add(c); cs.push(c); }
  STACKS.push(cs);
}
function setStacks(k) { const tot = STACKS.length * 18; let n = Math.floor(k * tot); STACKS.forEach(cs => cs.forEach(c => { c.visible = n-- > 0; })); }
const handCoin = makeCoin(0.11); COUNT.add(handCoin);

// school kids with lunch trays
const KIDS = new THREE.Group(); stage.add(KIDS);
const kids = [];
{
  const r = rng(12);
  for (let row = 0; row < 4; row++) for (let c = 0; c < 7; c++) {
    const p = randPerson(r, { scale: 0.62 + r() * 0.06 }); p.position.set(-4.2 + c * 1.4 + (row % 2) * 0.5, 0.3, -2.2 + row * 1.5); KIDS.add(p);
    p.userData.arms.forEach(a => { a.rotation.x = -1.25; });
    const tray = new THREE.Group(); tray.position.set(0, 0.98, 0.42); p.add(tray);
    tray.add(box(0.62, 0.03, 0.4, mat('#e9e4da')));
    const bowl = (col, x, z) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.07, 10), mat(col)); b.position.set(x, 0.05, z); tray.add(b); };
    bowl('#f7f3ea', -0.17, 0.06); bowl('#d98a3a', 0.0, 0.08); bowl('#6aa84f', 0.17, 0.06);
    const milk = box(0.07, 0.13, 0.07, mat('#ffffff')); milk.position.set(0.2, 0.08, -0.1); tray.add(milk);
    kids.push(p);
  }
}

// ---------- map: coin line along the archipelago ----------
const ROUTE = [[141.94, 45.52], [141.35, 43.06], [140.73, 41.77], [140.74, 40.82], [140.87, 38.27], [139.7, 35.68], [136.9, 35.18], [135.5, 34.69], [132.46, 34.4], [130.4, 33.59], [130.56, 31.6], [127.68, 26.21]];
const KM = [0, 278, 430, 535, 819, 1125, 1385, 1524, 1804, 2014, 2236, 2898]; // cumulative great-circle km
const LINE_KM = 2454;
const lineM = new THREE.MeshBasicMaterial({ color: '#f4f6fa' });
const segs = [];
for (let i = 1; i < ROUTE.length; i++) {
  const a = ll(...ROUTE[i - 1], LAND_Y + 0.6), b = ll(...ROUTE[i], LAND_Y + 0.6);
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.9), lineM); japan.add(m);
  segs.push({ m, a, b, k0: KM[i - 1], k1: KM[i] });
}
function setLine(km) {
  for (const s of segs) {
    const u = clamp((km - s.k0) / (s.k1 - s.k0));
    s.m.visible = u > 0;
    if (!s.m.visible) continue;
    const e = s.a.clone().lerp(s.b, u); const mid = s.a.clone().add(e).multiplyScalar(0.5); const len = s.a.distanceTo(e);
    s.m.position.copy(mid); s.m.scale.set(Math.max(0.01, len), 1, 1); s.m.rotation.y = -Math.atan2(e.z - s.a.z, e.x - s.a.x);
  }
}
function linePoint(km) { for (const s of segs) if (km <= s.k1) return s.a.clone().lerp(s.b, clamp((km - s.k0) / (s.k1 - s.k0))); return segs[segs.length - 1].b.clone(); }
const head = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); japan.add(head);
const rings = [];
for (const c of ['tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'hiroshima']) { const r = makeRing('#ffe08a', 0.8); const v = ll(...CITY[c]); r.position.x = v.x; r.position.z = v.z; r.visible = false; rings.push(r); }
function ringsAt(u) { rings.forEach((r, i) => { const k = clamp(u - i * 0.05); r.visible = k > 0 && k < 1; r.scale.setScalar(1 + k * 14); r.material.opacity = 0.8 * (1 - k); }); }
function mapDots(t, pulse = -1, col = '#ffffff') { setDots((i, x, z, q) => { const u = pulse < 0 ? -1 : (t - pulse - q * 0.6) / 0.6; const on = u > 0 && u < 1; return { y: on ? Math.sin(u * Math.PI) * 1.6 : 0, color: on ? '#ffe08a' : col }; }); }
function mapBase(env = 'day') { setMapEnv(env); setLine(0); head.visible = false; ringsAt(0); }

const SUBS = [
  [2.6, 6.0, '財布に眠る、<br>1円玉1枚。'],
  [6.2, 10.1, '日本中の全員が、<br>いっせいに1円を出す。'],
  [10.1, 14, '集まったのは、<br>1億2,269万円。'],
  [14.2, 18.1, '1円玉は1枚1g。<br>全部積み上げると、'],
  [18.1, 22, '重さは約123トン。<br>銀色の山ができた。'],
  [22.2, 26.1, '1列に並べると、'],
  [26.1, 30, '2,454km。北海道から<br>鹿児島を越える。'],
  [30.2, 34.6, '1秒に1枚、<br>休まず数えても、'],
  [34.6, 39, '数え終わるまで、<br>約3.9年かかる。'],
  [39.2, 43.6, 'これを毎日、<br>1年続けたら？'],
  [43.6, 47.8, '集まるのは、<br>約448億円。'],
  [48.1, 53.8, '結果：1人1日1円で、<br>小学生87万人の給食1年分。'],
  [53.9, 56.1, '1円も、全員なら大金。'],
  [56.2, 59.4, '次に日本人全員で<br>やってほしいのは？'],
];
const GOLD = '#ffe08a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';
const okuMan = (v) => `${Math.floor(v / 10000)}億${comma(v % 10000)}万`;
const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function mapCam(t, d, a, b) { const u = ease(clamp(t / d)); look(...a.map((v, i) => lerp(v, b[i], u)), 50); }
const MAP_WIDE = [-8, 300, 95, -4, 0, -30], MAP_WIDE2 = [-4, 285, 85, -4, 0, -30];

function stageBase() { setStageColor('#14213a'); bigCoin.visible = false; coinSpark.set(0); setPile(0); scaleMan.visible = false; COUNT.visible = false; KIDS.visible = false; }

function shot0(t) { // hook: map + countdown
  mapBase('day'); mapDots(t);
  mapCam(t, 2.6, MAP_WIDE, MAP_WIDE2);
  el.title.style.opacity = 1;
  setHud('全員が1円を出すまで', cd(Math.max(0, 2.5 - t)), 1, { mono: true });
  return japan;
}
function shot1(t) { // a single 1-yen coin
  lift(380);
  stageBase(); bigCoin.visible = true; coinGrp.position.set(0, 3.2 + Math.sin(t * 2) * 0.1, 0); coinGrp.rotation.set(0, Math.sin(t * 1.2) * 0.45, 0);
  const u = ease(t / 3.5);
  look(lerp(0.8, 0.3, u), lerp(4.2, 4.0, u), lerp(9.5, 8.6, u), 0, 3.2, 0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('全員が1円を出すまで', '0:00.00', 1, { mono: true });
  return stage;
}
function shot2(t) { // everyone puts in 1 yen: map pulses
  mapBase('day'); mapDots(t, 0.3); ringsAt(clamp((t - 0.3) / 3));
  const tk = ll(...CITY.tokyo);
  mapCam(t, 8, [-6, 240, 80, -4, 0, -25], [tk.x + 20, 90, tk.z + 70, tk.x - 4, 0, tk.z - 4]);
  setHud('全員が出した', '+0秒', 1);
  setTop('集まったお金（2026年10月の人口）', okuMan(countUp(t, POP, 4.15, 1.3)) + '円', fade(t, 4.1, 8, 0.25), GOLD);
  return japan;
}
function shot3(t) { // coin mountain grows
  lift(300);
  stageBase(); scaleMan.visible = true;
  const k = easeOut(clamp((t - 0.3) / 6));
  setPile(k);
  const u = ease(t / 8);
  look(lerp(9, 11, u), lerp(3.5, 5.0, u), lerp(11, 13, u), 0.5, lerp(0.9, 1.5, u), 0, 50);
  setHud('1円玉', '1枚1.00g', 1);
  setTop('1円玉の重さの合計（単純計算）', '約' + countUp(t, 123, 4.0, 1.3) + 'トン', fade(t, 3.9, 8, 0.25), BLUE);
  return stage;
}
function shot4(t) { // coins in a line along Japan
  mapBase('day'); mapDots(t, -1, '#dfe8f0');
  const km = LINE_KM * easeOut(clamp((t - 0.4) / 5.0));
  setLine(km); head.visible = km > 1; head.position.copy(linePoint(km)); head.position.y += 0.4;
  mapCam(t, 8, [-30, 330, 120, -10, 0, -20], [-40, 360, 110, -14, 0, -10]);
  setHud('並べる1円玉', '1億2,269万枚', 1);
  setTop('1列に並べた長さ（直径2cm・単純計算）', comma(Math.round(km)) + 'km', fade(t, 3.9, 8, 0.25), GOLD);
  return japan;
}
function shot5(t) { // counting one by one
  lift(320);
  stageBase(); COUNT.visible = true;
  setStacks(clamp(t / 9.2));
  const ph = (t * 1.5) % 1;
  handCoin.position.set(lerp(0.5, -0.6 + (Math.floor(t * 1.5) % 8) * 0.28, ph), 0.95 + Math.sin(ph * Math.PI) * 0.25, lerp(0.35, 0.1, ph));
  counter.userData.arms[0].rotation.x = -1.0 - Math.sin(ph * Math.PI) * 0.35; counter.userData.arms[1].rotation.x = -0.9;
  counter.userData.head.rotation.x = 0.35;
  const u = ease(t / 9.2);
  look(lerp(3.6, 3.0, u), lerp(3.0, 2.8, u), lerp(4.6, 4.0, u), 0, 1.15, -0.4, 50);
  setHud('数えた枚数', comma(Math.floor(t)) + '枚', 1, { mono: true });
  setTop('全部数え終わるまで（1秒1枚・単純計算）', '約' + (countUp(t, 39, 4.6, 1.3) / 10).toFixed(1) + '年', fade(t, 4.4, 9.2, 0.25), BLUE);
  return stage;
}
function shot6(t) { // every day for a year: map pulses daily (dusk)
  mapBase('dusk');
  const day = Math.floor(t * 40);
  mapDots(t, (Math.floor(t * 1.6)) / 1.6);
  mapCam(t, 8.8, [-12, 260, 90, -4, 0, -26], [-6, 230, 70, -4, 0, -22]);
  setHud('経過', '+' + Math.min(365, day) + '日', 1);
  setTop('毎日1円を1年（単純計算）', '約' + countUp(t, 448, 4.4, 1.3) + '億円', fade(t, 4.2, 8.8, 0.25), GOLD);
  return japan;
}
function shot7(t) { // result: kids with lunch trays
  lift(280);
  stageBase(); KIDS.visible = true;
  kids.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.3 + i) * 0.25; p.position.y = 0.3 + Math.abs(Math.sin(t * 3 + i)) * 0.02; });
  const u = ease(t / 7.5);
  look(lerp(1.5, 0.5, u), lerp(4.5, 5.2, u), lerp(9.5, 11, u), 0, 0.9, -0.5, 50);
  setHud('1人1日1円', '1年', 1, { color: GREEN });
  if (t < 4) setTop('小学校の給食1年分（2023年度の給食費で推計）', '約' + countUp(t, 87, 0.3, 1.3) + '万人分', fade(t, 0.15, 4, 0.2), GREEN);
  else setTop('毎日1円を1年（単純計算）', '約448億円', fade(t, 4, 7.5, 0.2), GOLD);
  return stage;
}
function shot8(t) { // loop to the opening map
  mapBase('day'); mapDots(t);
  mapCam(t, 4, [-10, 306, 98, -4, 0, -30], MAP_WIDE);
  setHud('全員が1円を出すまで', '0:03.00', 1, { mono: true });
  return japan;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
void box; void makeSparkles;
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0131',
    series: '日本人全員で',
    hookType: 'H1', cat: '全員が同時に・極端な数字',
    title: '日本人全員が1円ずつ出したら？',
    titleHtml: '日本人全員が<br>1円ずつ出したら？',
    mood: 'hopeful', seed: 131, hits: [6.3, 48.1], risers: [39.2], impacts: [10.2, 18.2, 26.2, 43.7],
    sfx: [[2.5, 'whoosh'], [6.4, 'meter', 0.3], [22.3, 'whoosh'], [34.7, 'meter', 0.5]],
    narr: { '1億2,269万円': '1億2269万円', '123トン': '123トン', '2,454km': '2454キロ', '3.9年': '3.9年', '448億円': '448億円', '87万人': '87万人', '1g': '1グラム' },
    ask: '次に日本人全員でやってほしいのは？',
    caption: 'もしも日本人全員が1円ずつ出したら？\n日本の人口は1億2,269万人（2026年10月の概算）。全員が1円玉を1枚出すと、1億2,269万円。\n1円玉は1枚1.00g・直径2cm。全部集めると重さは約123トン、1列に並べると2,454km（単純計算）。北海道の北の端から鹿児島までを直線で結んでも約2,240kmなので、それを越える長さ。\n1秒に1枚、休まず数えても、数え終わるまで約3.9年（単純計算）。\nこれを毎日1年続けると、約448億円（単純計算）。公立小学校の給食費は月平均4,688円（2023年度、年額を11か月で割った額）なので、小学生約87万人の給食1年分になる（推計）。\n\n結果：1人1日1円で、小学生87万人の給食1年分。1円も、全員なら大金。\n\n次に日本人全員でやってほしいのは？ コメントで教えて。\n\n出典：総務省統計局 人口推計（2026年10月1日現在 概算値）、財務省 通常貨幣一覧、文部科学省 令和5年度学校給食費調査',
    hashtags: ['もしもラボ', '1円', '日本人全員で', '雑学', 'お金'],
    endStats: [['日本の総人口', '1億2,269万人', '2026年10月'], ['全員の1円の重さ（単純計算）', '約123トン', '1枚1.00g'], ['1列に並べると（単純計算）', '2,454km', '直径2cm'], ['毎日1円を1年（単純計算）', '約448億円', ''], ['小学校の給食1年分（推計）', '約87万人分', '2023年度']],
    sources: '出典：総務省 人口推計（2026年10月概算）、財務省 通常貨幣一覧、<br>文部科学省 令和5年度学校給食費調査',
  },
});
