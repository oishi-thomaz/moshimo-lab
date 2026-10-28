import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makeQ, randPerson } from '../lib.js';
import { highway, setHighwayEnv, makeTruck, makeHwCar, laneX, WAREHOUSE, DOCKS, makeCratePile } from '../scenes/highway.js';
import { market, queues, shelfItems } from '../market.js';
import { town, setTownEnv } from '../scenes/town.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本中のトラックドライバーが消えたら？（blueprint no 35。0035 は別の動画で使用済みのため id 0535）
// 数字：
//  国内貨物の輸送トン数 2023年度（令和5年度）総計 4,233百万トン、うち自動車 3,890百万トン＝分担率 91.9%
//    （国土交通省 道路統計年報2025 15-1 輸送機関別輸送量 https://www.mlit.go.jp/road/toukei_chousa/road_db/pdf/2025/15-1.pdf）
//  総人口 2023年10月1日 1億2435万2千人（総務省 人口推計 https://www.stat.go.jp/data/jinsui/2023np/index.html）
//    → 1日あたり 38.9億トン÷365 ≒ 1,066万トン（単純計算）、1週間 ≒ 7,460万トン（単純計算）
//    → 1人1日あたり 38.9億トン÷1億2435万人÷365 ≒ 85.7kg ≒ 約86kg（単純計算）
//  1人1日あたりのごみ排出量 851g（環境省 一般廃棄物の排出及び処理状況等 令和5年度、2025年3月27日 https://www.env.go.jp/press/press_04470.html）
//  2030年度に輸送能力の34.1%が不足する可能性（持続可能な物流の実現に向けた検討会 2023年 https://www.mlit.go.jp/seisakutokatsu/freight/content/001611953.pdf）

// ---------- traffic ----------
let NOW = 0;
const TR = []; // {g, lane, off, sp, dir, truck}
{
  const r = rng(535);
  const cols = ['#e9ecef', '#f4f1ea', '#dfe3e8', '#c9d4de', '#e8e2d2'];
  const carCols = ['#d94b4b', '#3b6fb6', '#2d2f36', '#f1f1f1', '#7a8a99', '#e0b84a'];
  const lanes = [9.0, 5.6, 2.2, -2.2, -5.6, -9.0];
  lanes.forEach((z, li) => {
    const dir = z > 0 ? 1 : -1;
    for (let i = 0; i < 6; i++) {
      const truck = i % 2 === 0 || r() < 0.3;
      const kinds = ['box', 'box', 'tanker', 'flat'];
      const g = truck ? makeTruck({ kind: kinds[Math.floor(r() * 4)], color: cols[Math.floor(r() * cols.length)], cab: cols[Math.floor(r() * cols.length)] }) : makeHwCar(carCols[Math.floor(r() * carCols.length)]);
      g.position.z = z; g.rotation.y = dir > 0 ? 0 : Math.PI; highway.add(g);
      TR.push({ g, z, dir, off: i * 53 + r() * 18 + li * 9, sp: 22 + li % 3 * 2 + r() * 2, truck });
    }
  });
}
// 「ドライバーが消えた時刻」からの経過 ts（<0 なら走行中）。消えたあとは 1.6 秒でゆっくり止まる
function traffic(T, ts, { haz = 0 } = {}) {
  for (const v of TR) {
    let tt = T;
    if (ts >= 0) { const s = Math.min(ts, 1.6); tt = T + s - s * s / 3.2; } // T = 消えた瞬間の時刻（止まっている間は固定）
    v.g.position.x = laneX(tt, v.sp, v.off, v.dir, 320);
    if (v.truck) { v.g.userData.setDriver(ts < 0); v.g.userData.setHazard(ts >= 0 && haz > 0 && Math.floor(NOW * 2.4) % 2 === 0); v.g.userData.roll(tt * v.sp); }
  }
}
// hero truck for the hook / loop
const HERO = makeTruck({ kind: 'box', color: '#f4f1ea', cab: '#f4f1ea' }); HERO.position.set(0, 0, 9.0); highway.add(HERO);
const heroSpark = makeSparkles(220, 0.12); highway.add(heroSpark.points);
const heroCam = (hx, t, ty = 2.0) => look(hx + 10.5 + t * 0.3, 4.2, 9.0 + 12.5, hx + 3.0, ty, 9.0, 44);

// ---------- warehouse crates ----------
const piles = DOCKS.slice(1, 7).map((d, i) => { const p = makeCratePile(80, 20 + i, { cols: 5, rows: 4 }); p.position.set(WAREHOUSE.position.x + d.x - 2.0, 1.2, WAREHOUSE.position.z + d.z - 2.9); highway.add(p); return p; });
const dockTrucks = [0, 7].map((k) => { const t = makeTruck({ kind: 'box', color: '#e9ecef', driver: false }); t.rotation.y = -Math.PI / 2; t.position.set(WAREHOUSE.position.x + DOCKS[k].x, 0, WAREHOUSE.position.z - 9.5); highway.add(t); return t; });
const workers = [];
{ const r = rng(77); for (let i = 0; i < 5; i++) { const p = randPerson(r, { shirt: '#3f6aa0' }); p.position.set(WAREHOUSE.position.x - 14 + i * 6.5, 1.2, WAREHOUSE.position.z - 6.5); p.rotation.y = Math.PI + 0.4; highway.add(p); const q = makeQ(); q.position.set(0, 2.6, 0); p.add(q); workers.push({ p, q }); } }
function warehouseOn(on) { piles.forEach(p => p.visible = on); dockTrucks.forEach(t => t.visible = on); workers.forEach(w => w.p.visible = on); }

// ---------- supermarket ----------
const aisle = [];
function marketSet(t) {
  for (const s of shelfItems) s.it.visible = s.k < 0.1;
  queues.forEach((q, i) => { q.p.visible = false; });
}
const shoppers = [];
{ const r = rng(12); for (let i = 0; i < 4; i++) { const p = randPerson(r); market.add(p); const q = makeQ(); q.position.set(0, 2.5, 0); p.add(q); shoppers.push({ p, q }); } }
const SHOPPOS = [[-0.5, -7.5, 0.4], [0.6, -9, -0.5], [-0.3, -13, 0.6], [0.4, -16.5, -0.3]];

// ---------- town garbage ----------
const GARB = new THREE.Group(); town.add(GARB);
const bags = [];
{
  const r = rng(851);
  const bagCols = ['#eef0f2', '#e7ecef', '#f2e6a0', '#dfe6ea'];
  for (const [cx, cz] of [[5.6, 12], [-5.6, -12], [5.6, -27], [-5.6, 27]]) {
    const net = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), mat('#3f8f6b', { transparent: true, opacity: 0.55 })); net.rotation.x = -Math.PI / 2; net.position.set(cx, 0.15, cz); GARB.add(net);
    for (let i = 0; i < 60; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + r() * 0.12, 0), mat(bagCols[Math.floor(r() * 4)], { flatShading: true }));
      const a = r() * 6.28, d = Math.sqrt(r()) * (0.8 + i / 60 * 1.6);
      b.position.set(cx + Math.cos(a) * d * 1.2, 0.35 + (i % 4) * 0.12 + Math.max(0, 1.2 - d) * 0.5, cz + Math.sin(a) * d);
      b.scale.y = 0.85; b.rotation.set(r(), r(), r()); b.castShadow = true; GARB.add(b); bags.push({ b, k: i / 60 });
    }
  }
}
function setBags(k) { bags.forEach(x => x.b.visible = x.k < k); }
const gTruck = makeTruck({ kind: 'garbage', color: '#e9ecef', cab: '#e9ecef', driver: false }); gTruck.rotation.y = Math.PI / 2; gTruck.position.set(-1.8, 0, 4); town.add(gTruck);

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの朝の高速道路。'],
  [6.2, 10.1, '荷物が止まる。<br>でもヤバいのは3日後。'],
  [10.1, 14, '国内の荷物の9割以上は、<br>トラックが運んでいる。'],
  [14.2, 18.1, '倉庫の前に、出ていけない<br>荷物の山。その量は…'],
  [18.1, 22, '1日に運ぶはずだった荷物は、<br>約1,066万トン。'],
  [22.2, 26.1, 'スーパーには、<br>朝の便が届かない。'],
  [26.1, 30, '1人毎日約86kgの計算。<br>次に来なくなるのは…'],
  [30.2, 34.6, 'ごみ収集車も、<br>もう来ない。'],
  [34.6, 39, '家から出るごみは、<br>1人1日851g。'],
  [39.2, 43.6, '棚は空のまま、<br>ごみだけが増えていく。'],
  [43.6, 47.8, '1週間で止まった荷物は、<br>約7,460万トン。'],
  [48.1, 53.8, '結果：食べ物も日用品も<br>届かない暮らしになった。'],
  [53.9, 56.1, '2030年、現実でも34%不足。'],
  [56.2, 59.4, 'あなたが一番困る、<br>届かない物は？'],
];

const TV = 0.5; // driver vanish (hook)（v2：0.6秒以内に消える）
function shot0(t) { // hook: hero truck driving, driver vanishes
  setHighwayEnv('day');
  traffic(t + 30, -1);
  for (const v of TR) if (v.truck) v.g.userData.setDriver(t < TV); // v2：まわりのトラックの運転手も一斉に消える
  const hx = -20 + t * 9;
  HERO.position.x = hx; HERO.userData.roll(hx); HERO.userData.setDriver(t < TV); HERO.userData.setHazard(t > TV + 0.2 && Math.floor(t * 2.4) % 2 === 0);
  if (t >= TV && !heroSpark.ready) { const p = HERO.userData.cabPos.clone(); HERO.localToWorld(p); heroSpark.init([p.toArray()], 0.6, 1.2); heroSpark.ready = true; }
  heroSpark.set(t >= TV ? (t - TV) / 1.0 : 0);
  el.flash.style.opacity = t >= TV ? 0.5 * Math.max(0, 1 - (t - TV) / 0.3) : 0;
  lift(40); heroCam(hx, t, 3.1); // v2：運転席がタイトルの下に来るように
  return highway;
}
function shot1(t) { // everyday: wide view, all moving
  setHighwayEnv('day'); HERO.visible = false; heroSpark.set(0);
  traffic(t + 40, -1);
  const u = ease(t / 3.5);
  lift(260); look(lerp(-40, -30, u), lerp(16, 15, u), lerp(34, 32, u), 10, 0, 0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return highway;
}
function shot2(t) { // +1 min: drivers gone, everything stopped with hazards
  setHighwayEnv('day'); HERO.visible = false;
  traffic(44, Math.max(0, t - 0.0) + 0.0, { haz: 1 });
  const u = ease(t / 8);
  lift(300); look(lerp(-34, -20, u), lerp(22, 26, u), lerp(40, 36, u), lerp(12, 20, u), 0, 0, 50);
  hudTime('+1分');
  setTop('トラックが運ぶ国内の荷物（2023年度）', (countUp(t, 919, 4.0, 1.3) / 10).toFixed(1) + '%', fade(t, 3.95, 8, 0.25), '#ffd27a');
  return highway;
}
function shot3(t) { // +1h: warehouse, crates pile up
  setHighwayEnv('day'); HERO.visible = false; warehouseOn(true);
  traffic(44, 5, { haz: 1 });
  piles.forEach((p, i) => p.userData.setN(clamp(0.25 + t / 7 - i * 0.03)));
  workers.forEach((w, i) => { w.p.rotation.y = Math.PI + Math.sin(t * 0.8 + i) * 0.5; w.q.visible = t > 0.5 + i * 0.3; });
  const W = WAREHOUSE.position, u = ease(t / 8);
  lift(320); look(W.x + lerp(-16, -6, u), lerp(13, 11, u), W.z + lerp(-30, -27, u), W.x + 2, 2.5, W.z - 3, 50);
  hudTime('+1時間');
  setTop('1日に運ぶはずだった荷物（2023年度・単純計算）', comma(countUp(t, 1066, 4.0, 1.3)) + '万トン', fade(t, 3.95, 8, 0.25));
  return highway;
}
function shot4(t) { // +1 day: supermarket empty shelves
  marketSet(t);
  shoppers.forEach((s, i) => { const P = SHOPPOS[i]; s.p.visible = true; s.p.position.set(P[0], 0, P[1] + Math.sin(t * 0.5 + i) * 0.3); s.p.rotation.y = Math.PI / 2 * (i % 2 ? 1 : -1) + P[2]; s.q.visible = t > 0.4 + i * 0.4; });
  const u = ease(t / 8);
  lift(240); look(lerp(-0.4, 0.4, u), lerp(3.4, 3.1, u), lerp(3.5, 2.5, u), 0, 1.0, -12, 52);
  hudTime('+1日');
  setTop('1人1日あたりの荷物（2023年度・単純計算）', countUp(t, 86, 3.95, 1.2) + 'kg', fade(t, 3.9, 8, 0.25), '#ffd27a');
  return market;
}
function shot5(t) { // +3 days: garbage piles in town
  setTownEnv('day'); GARB.visible = true; gTruck.visible = true;
  setBags(clamp(0.35 + t / 9.2 * 0.65));
  gTruck.userData.setHazard(Math.floor(t * 2.4) % 2 === 0);
  const u = ease(t / 9.2);
  lift(300); look(lerp(-2, -1, u), lerp(7.5, 6.6, u), lerp(27, 24, u), 4.5, 0.6, 12, 50);
  hudTime('+3日');
  setTop('家から出るごみ 1人1日（2023年度）', countUp(t, 851, 4.4, 1.3) + 'g', fade(t, 4.35, 9.2, 0.25));
  return town;
}
function shot6(t) { // +1 week: dusk aerial of the stopped highway
  setHighwayEnv('dusk'); HERO.visible = false; warehouseOn(true); piles.forEach(p => p.userData.setN(1)); workers.forEach(w => w.p.visible = false);
  traffic(44, 10, { haz: 1 });
  const u = ease(t / 8.8);
  lift(300); look(lerp(-55, -40, u), lerp(40, 34, u), lerp(-62, -52, u), 15, 0, 2, 50);
  hudTime('+1週間');
  setTop('1週間で止まった荷物（2023年度・単純計算）', comma(countUp(t, 7460, 4.4, 1.4)) + '万トン', fade(t, 4.35, 8.8, 0.25), '#ff8a7a');
  return highway;
}
function shot7(t, T) { // result: ground view of stopped trucks at dusk
  setHighwayEnv('dusk'); HERO.visible = true; warehouseOn(false);
  traffic(44, 10, { haz: 1 });
  HERO.position.x = 6; HERO.userData.setDriver(false); HERO.userData.setHazard(Math.floor(t * 2.4) % 2 === 0);
  const u = ease(t / 7.5);
  lift(220); look(lerp(-8, -14, u), lerp(3.0, 4.2, u), lerp(16, 19, u), 12, 2.2, 6, 50);
  if (T < 53.85) setTop('届かなくなった荷物 1人1日（2023年度・単純計算）', countUp(t, 86, 0.2, 1.2) + 'kg', fade(t, 0.15, 5.75, 0.25), '#ffd27a');
  else setTop('2030年度の輸送力不足（政府の検討会・2023年試算）', (countUp(T - 53.9, 341, 0.1, 0.9) / 10).toFixed(1) + '%', fade(T, 53.9, 56.1, 0.2), '#ff8a7a');
  return highway;
}
function shot8(t) { // loop: same framing as the hook, empty cab, hazards
  setHighwayEnv('day'); HERO.visible = true; warehouseOn(false); heroSpark.set(0);
  traffic(44, 10, { haz: 1 });
  const hx = -20 + 0.6 * 9; HERO.position.x = hx; HERO.userData.setDriver(false); HERO.userData.setHazard(Math.floor(t * 2.4) % 2 === 0);
  lift(40); heroCam(hx, 0.3 + t * 0.2, 3.1);
  if (t < 0.6) setTop('2030年度の輸送力不足（政府の検討会・2023年試算）', '34.1%', fade(t + 55.5, 53.9, 56.1, 0.2), '#ff8a7a');
  return highway;
}
function reset(f) {
  HERO.visible = f === shot0 || f === shot7 || f === shot8;
  warehouseOn(f === shot3 || f === shot6);
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { NOW = T; reset(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの朝の高速道路（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0535',
    v2: true,
    hookLine: 'トラックのドライバーが、一斉に消えた。',
    title: '日本中のトラックドライバーが消えたら？',
    titleHtml: 'トラック運転手が<br>消えたら？', // v2：大きく出すので2行・1行9字以内に
    mood: 'tension', seed: 535, hits: [0.5, 48.1], risers: [6.0], impacts: [10.1, 26.1],
    sfx: [[0.5, 'poof'], [6.3, 'alarm'], [30.4, 'caw'], [39.4, 'meter', 0.5]],
    narr: { '1人1日851g': 'ひとり いちにち はっぴゃくごじゅういちグラム', '約86kg': 'やく はちじゅうろくキロ', '34%': 'さんじゅうよんパーセント', '2030年': 'にせんさんじゅうねん', '9割': 'きゅうわり' },
    ask: 'あなたが一番困る、届かない物は？',
    caption: 'もしも日本中のトラックドライバーが一斉に消えたら？\n国内の荷物の91.9%（2023年度・トン数）はトラックが運んでいる。運転する人がいなくなると、1日に約1,066万トンの荷物が止まる（単純計算）。1人あたりにすると毎日約86kg（単純計算）。\n倉庫の前には荷物が積み上がり、スーパーには朝の便が届かない。ごみ収集車も来なくなり、家から出る1人1日851gのごみがたまっていく。1週間で止まる荷物は約7,460万トン（単純計算）。\n結果、食べ物も日用品も届かない暮らしになる。そして現実でも、2030年度には輸送力の34.1%が足りなくなる可能性があると試算されている（物流の2024年問題）。\n\nあなたが一番困る、届かない物は？ コメントで教えて。\n\n出典：国土交通省 道路統計年報2025（輸送機関別輸送量 令和5年度）、総務省 人口推計（2023年10月1日）、環境省 一般廃棄物の排出及び処理状況等（令和5年度）、持続可能な物流の実現に向けた検討会（2023年）\n（単純計算）自動車の年間輸送量38.9億トン÷365日、÷総人口1億2435万人',
    hashtags: ['もしもラボ', 'トラックドライバー', '物流2024年問題', '物流', '雑学'],
    endStats: [['トラックが運ぶ国内の荷物', '91.9%', '2023年度'], ['1日に止まる荷物', '約1,066万トン', '単純計算'], ['1人1日あたりの荷物', '約86kg', '単純計算'], ['1人1日のごみ', '851g', '2023年度'], ['2030年度の輸送力不足', '34.1%', '2023年試算']],
    sources: '出典：国土交通省 道路統計年報2025（2023年度）、総務省 人口推計、<br>環境省（2023年度）、持続可能な物流の実現に向けた検討会（2023年）',
  },
});
