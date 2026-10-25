import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setScreen, props, sets, lamp, glow } from '../scenes/room.js';
import { japan, ll, CITY, setDots, setMapEnv } from '../scenes/japan.js';
import { makeTV, makeMicrowave, makeWasher, makeFridge, makeAircon, aLineup, setASlot, aLineupIdle } from '../scenes/appliances.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも1つ消えたら、生活が一番ヤバい家電はどれ？（blueprint no 721・ヤバい順シリーズ）
// 方針：順位は「消えたときの暮らしへのダメージ」。命に関わるか（死者・救急搬送の数）を一番重く見る。メーターは影響の大きさの順位（ほぼゼロ／小／中／大／危険）。
// 数字
//   テレビ：平日1日の利用時間（全年代13〜69歳）インターネット181.8分、テレビ（リアルタイム）154.7分
//     （総務省 情報通信政策研究所「令和6年度 情報通信メディアの利用時間と情報行動に関する調査」https://www.soumu.go.jp/menu_news/s-news/01iicp01_02000125.html）
//   電子レンジ：冷凍食品の国民1人当たり年間消費量 24.6kg（2025年。日本冷凍食品協会「令和7年 冷凍食品の生産・消費について（速報）」
//     https://www.reishokukyo.or.jp/wp-content/uploads/2026/04/pdf-data_21.pdf）
//   洗濯機：数字なし（手洗いになる、という言い切りだけ）
//   冷蔵庫：「冷蔵庫は10℃以下、冷凍庫は-15℃以下」「細菌の多くは、10℃では増殖がゆっくりとなり、-15℃では増殖が停止」
//     （厚生労働省「家庭でできる食中毒予防の6つのポイント」https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/shokuhin/syokuchu/01_00006.html）
//     食中毒 2025年 事件1,172件・患者24,727人（厚生労働省 令和7年食中毒統計 https://www.mhlw.go.jp/content/001757182.pdf）
//   エアコン：熱中症の救急搬送 2025年5〜9月 100,510人（調査開始以来最多）、発生場所は住居が最多 38,292人・38.1%
//     （消防庁「令和7年（5月〜9月）の熱中症による救急搬送状況」https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf）
//     東京23区 2025年夏の熱中症死亡 193人、うち屋内181人。屋内181人のうちエアコン設置あり・使用なし121人、設置なし23人（計144人＝79.6%→約8割・計算）
//     （東京都保健医療局 東京都監察医務院「令和7年夏の熱中症死亡者の状況（確定値）」https://www.hokeniryo.metro.tokyo.lg.jp/documents/d/hokeniryo/r7heatstroke-fixed-pdf）
//     熱中症による死亡数 2024年 2,160人（厚生労働省 人口動態統計（確定数）https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/dl/R06nenrei.pdf）

const GREEN = '#7ff0c8', RED = '#ff5a4f', GOLD = '#ffe08a', BLUE = '#7fd4ff';
const NAMES = ['テレビ', '電子レンジ', '洗濯機', '冷蔵庫', 'エアコン'];
const VANISH = [7.4, 19.6, 31.4, 43.6, 59.8];
const RISE = [14.8, 27.0, 39.2, 55.4, 79.6];
const LEVEL = [0.05, 0.25, 0.5, 0.8, 1.06];
const WORD = ['ほぼゼロ', '小', '中', '大', '危険'];
function lineupState(T) {
  for (let i = 0; i < 5; i++) {
    const show = T < VANISH[i] ? 1 : 0;
    const k = easeOut(clamp((T - RISE[i]) / (i === 4 ? 1.8 : 1.4)));
    setASlot(i, { show, meter: LEVEL[i] * k, word: k > 0.95 ? WORD[i] : '', glow: i === 4 && k > 0.9 ? 1 : 0, t: T });
  }
  aLineupIdle(T);
}
function lineCam(t, d, i = null) {
  const u = ease(clamp(t / d));
  if (i === null) look(lerp(-2.9, -2.4, u), lerp(3.3, 3.1, u), lerp(9.8, 9.2, u), 0.2, 1.3, -0.6, 50);
  else { const x = [-2.2, -1.1, 0, 1.1, 2.2][i]; look(lerp(x * 0.7, x * 0.55, u), lerp(2.7, 2.6, u), lerp(8.6, 8.0, u), x, 1.55, -0.5, 50); }
}

// ---------- room props ----------
const spark = makeSparkles(220, 0.08); room.add(spark.points);
function vanishFx(T, tv, pts, dur = 1.3) { if (spark.key !== tv) { spark.init(pts, 0.4, 0.8); spark.key = tv; } spark.set(T >= tv ? (T - tv) / dur : 0); }
const fridgeParts = sets.kitchen.children.filter(o => o.position.x > 2.0 && o.position.x < 3.2 && o.position.y > 0.3);
function kitchenFridge(v) { fridgeParts.forEach(o => o.visible = v); }
// TV is the living set's TV; hide all TV parts by position
const tvParts = sets.living.children.filter(o => Math.abs(o.position.x - 1.4) < 0.2 && o.position.z < -3.15 && o.position.y > 0.6);
function livingTV(v) { tvParts.forEach(o => o.visible = v); }
const watcher = makePerson({ skin: SKIN[2], hair: HAIR[1], shirt: '#e05a4f', pants: '#3b3f4a', scale: 1 }); room.add(watcher);
function sitSofa(p, t, look = 0) { p.visible = true; p.position.set(0.6, -0.15, 0.55); p.rotation.set(0, Math.PI, 0); p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => { a.rotation.x = -0.3; a.rotation.z = 0; }); p.userData.head.rotation.set(look, 0, 0); }
const phone = box(0.08, 0.15, 0.015, mat('#1b1d22')); const phoneScr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.13), new THREE.MeshBasicMaterial({ color: '#6fd3ff' })); phoneScr.position.z = -0.009; phoneScr.rotation.y = Math.PI; phone.add(phoneScr); watcher.userData.arms[1].add(phone); phone.position.set(0, -0.68, 0.06); phone.visible = false;
// kitchen microwave
const micro = makeMicrowave(); micro.position.set(-2.2, 0.945, -3.05); room.add(micro);
const cook = makePerson({ skin: SKIN[0], hair: HAIR[3], shirt: '#f2c14e', pants: '#2b3346', long: true, scale: 1 }); room.add(cook);
const frozen = box(0.22, 0.04, 0.16, mat('#4fa3d1')); cook.userData.arms[0].add(frozen); frozen.position.set(0, -0.66, 0.08);
// laundry corner
const LAUN = new THREE.Group(); room.add(LAUN);
const washer = makeWasher(); washer.position.set(-2.9, 0, -2.95); LAUN.add(washer);
const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.38, 14, 1, true), mat('#8fb4d8', { side: THREE.DoubleSide })); basket.position.set(-1.9, 0.19, -2.6); LAUN.add(basket);
const clothes = [];
{ const r = rng(7); const cols = ['#e05a4f', '#4fa3d1', '#f2c14e', '#f7f7f7', '#3f8f6b', '#8e6bbf', '#2b3346']; for (let i = 0; i < 22; i++) { const c = box(0.3 + r() * 0.2, 0.06, 0.24 + r() * 0.15, mat(cols[i % cols.length])); c.position.set(-1.9 + (r() - 0.5) * 0.5, 0.36 + (i % 6) * 0.05 + r() * 0.04, -2.6 + (r() - 0.5) * 0.5); c.rotation.y = r() * 3; LAUN.add(c); clothes.push(c); } }
const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.22, 18, 1, true), mat('#9aa6b4', { side: THREE.DoubleSide })); tub.position.set(-0.8, 0.11, -1.9); LAUN.add(tub);
const water = new THREE.Mesh(new THREE.CircleGeometry(0.4, 18), mat('#8fc6e8', { emissive: 0x1a4f7a, emissiveIntensity: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.set(-0.8, 0.18, -1.9); LAUN.add(water);
const washer2 = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#5d8c3a', pants: '#3b3f4a', scale: 1 }); LAUN.add(washer2);
// fridge food on the floor after the fridge vanishes
const FOOD = new THREE.Group(); room.add(FOOD);
const foodM = [];
{ const r = rng(3); const cols = ['#ffffff', '#e05a4f', '#6aa84f', '#f2c14e', '#e8b98f', '#c94f7c', '#f7f3ea']; for (let i = 0; i < 12; i++) { const m = mat(cols[i % cols.length]); const f = box(0.14 + r() * 0.1, 0.1 + r() * 0.16, 0.12 + r() * 0.08, m); f.position.set(2.3 + (r() - 0.5) * 0.7, 0.08, -2.9 + (r() - 0.5) * 0.5); f.position.y = f.geometry.parameters.height / 2; FOOD.add(f); foodM.push({ m, base: new THREE.Color(cols[i % cols.length]) }); } }
const flies = makeSparkles(30, 0.05, 0x333333); room.add(flies.points); flies.init([[2.3, 0.4, -2.8]], 0.5, 0.6);
function spoil(k) { foodM.forEach(({ m, base }) => m.color.copy(base).lerp(new THREE.Color('#6b5a3a'), k * 0.6)); }
// bedroom aircon + elderly person
const ac = makeAircon(); ac.position.set(0.6, 2.75, -3.5); room.add(ac);
const elder = makePerson({ skin: SKIN[0], hair: HAIR[4], shirt: '#c9b79c', pants: '#5a4a3a', scale: 0.97 }); room.add(elder);
const fan = new THREE.Group(); { const h = box(0.02, 0.18, 0.02, mat('#8a6a4c')); h.position.y = -0.09; fan.add(h); const f = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), mat('#f2f3f5', { side: THREE.DoubleSide })); f.position.y = -0.24; fan.add(f); } elder.userData.arms[1].add(fan); fan.position.set(0, -0.6, 0.06);
const sweat = makeSparkles(40, 0.04, 0xbfe6ff); room.add(sweat.points);
const coolAir = makeSparkles(80, 0.06, 0xbfefff); room.add(coolAir.points); coolAir.init([[0.6, 2.55, -3.2]], 0.6, 1.6);
function sitBed(p, t, fanK = 0) {
  p.visible = true; p.position.set(1.6, -0.2, -2.4); p.rotation.set(0, -0.3, 0);
  p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms[0].rotation.set(-0.25, 0, 0.12);
  p.userData.arms[1].rotation.set(-1.6 + Math.sin(t * 9) * 0.25 * fanK, 0, -0.5 * fanK); p.userData.head.rotation.set(0.1 * fanK, 0, 0);
}
function hideAll() {
  watcher.visible = false; cook.visible = false; micro.visible = false; LAUN.visible = false; FOOD.visible = false; ac.visible = false; elder.visible = false;
  flies.set(0); sweat.set(0); coolAir.set(0); spark.set(0); kitchenFridge(true); livingTV(true); phone.visible = false;
  props.sleeper.visible = false; props.phone.visible = false;
}

// ---------- map ----------
function mapHeat(t, k, zoomTokyo = false) {
  const tk = ll(...CITY.tokyo);
  setDots((i, x, z, q) => {
    const red = q < k * 0.6;
    const near = Math.hypot(x - tk.x, z - tk.z) < 6;
    if (zoomTokyo && !near) return { color: '#dfe8f0', s: 0.6 };
    const pulse = red ? Math.max(0, Math.sin(t * 4 + q * 20)) * 0.8 : 0;
    return { y: pulse, color: red ? '#ff5a4f' : '#dfe8f0' };
  });
}

const SUBS = [
  [2.6, 6.4, '5つの家電から、<br>1つだけ消してみる。'],
  [6.6, 10.5, 'まずはテレビ。<br>リビングから消えた。'],
  [10.6, 14.5, 'でもネットの時間は、<br>もうテレビより長い。'],
  [14.6, 18.4, 'ニュースも動画も、<br>スマホで見られる。'],
  [18.6, 22.5, '次は電子レンジ。<br>台所から消えた。'],
  [22.6, 26.6, '冷凍食品は、1人<br>年24.6kg食べている。'],
  [26.8, 30.6, 'でもフライパンや鍋で、<br>温め直せる。'],
  [30.8, 34.7, '3つ目は洗濯機。<br>洗濯物の山が残った。'],
  [34.8, 38.8, '手で洗って、しぼって。<br>毎日が力仕事に。'],
  [39.0, 42.8, '時間と体力は減るけど、<br>命には関わらない。'],
  [43.0, 46.9, '4つ目は冷蔵庫。<br>中身が床に残った。'],
  [47.0, 50.9, '細菌の多くは、10℃で<br>増えるのがゆっくりになる。'],
  [51.0, 54.9, '冷蔵庫がある今でも、<br>食中毒は年2.5万人。'],
  [55.0, 59.0, '夏は、その日のうちに<br>食べきるしかない。'],
  [59.2, 63.1, '最後はエアコン。<br>真夏の寝室から消えた。'],
  [63.2, 67.1, '去年の夏、熱中症で<br>運ばれたのは10万人。'],
  [67.2, 71.1, '一番多い場所は、<br>家の中だった。'],
  [71.2, 75.1, '東京23区では、家で<br>亡くなった181人のうち、'],
  [75.2, 79.1, '約8割がエアコンなし、<br>または使っていなかった。'],
  [79.3, 83.2, '全国では、熱中症で<br>年2,160人が亡くなる。'],
  [83.5, 89.2, '結果：一番ヤバいのはエアコン。<br>夏に命を落とす人が増える。'],
  [89.3, 91.5, 'テレビは消えても平気。'],
  [91.6, 94.8, '次にランキングして<br>ほしいものは？'],
];

function meterShot(i) {
  return function (t, T) {
    lift(260); lineupState(T); lineCam(t, 4.2, i);
    setTop(`${NAMES[i]}が消えたら・暮らしへのダメージ`, WORD[i], fade(t, 0.5, 4.2, 0.25), i < 1 ? GREEN : i < 3 ? GOLD : RED);
    return aLineup;
  };
}
function shot0(t, T) { lift(320); lineupState(T); lineCam(t, 2.5); el.title.style.opacity = 1; return aLineup; }
function shot1(t, T) { lift(320); lineupState(T); lineCam(t + 2.5, 6.4); el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5); return aLineup; }
function shotTV(t, T) { // living room TV vanishes; then the phone
  lift(240); hideAll();
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 8, hemi: 0.95 });
  setScreen((g, w, h) => { g.fillStyle = '#4fa3d1'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; g.fillRect(20, 100, 90, 40); g.fillStyle = '#ffffff'; g.fillRect(130, 30, 100, 12); });
  const gone = T >= VANISH[0]; livingTV(!gone);
  vanishFx(T, VANISH[0], [[1.4, 1.05, -3.2], [1.0, 1.0, -3.2], [1.8, 1.1, -3.2]]);
  sitSofa(watcher, t, gone && t > 3.5 ? 0.45 : 0);
  phone.visible = gone && t > 3.5; if (phone.visible) watcher.userData.arms[1].rotation.x = -1.3;
  const u = ease(t / 8);
  look(lerp(-1.6, -1.3, u), lerp(2.9, 2.8, u), lerp(3.6, 3.2, u), 1.1, 0.9, -1.5, 50);
  if (t < 4.0) setTop('消えた家電', 'テレビ', fade(t, 0.15, 4.0, 0.2));
  else if (t < 6.1) setTop('平日1日のテレビ視聴（2024年度）', (countUp(t - 4.0, 1547, 0.1, 1.0) / 10).toFixed(1) + '分', fade(t, 4.0, 6.1, 0.2), GOLD);
  else setTop('平日1日のネット利用（2024年度）', (countUp(t - 6.1, 1818, 0.1, 1.0) / 10).toFixed(1) + '分', fade(t, 6.1, 8, 0.2), GREEN);
  return room;
}
function kitchenBase() { setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 4, hemi: 1.05 }); }
function shotMicro(t, T) { // microwave vanishes; cook holds a frozen meal, then uses the pan
  lift(240); hideAll(); kitchenBase();
  const gone = T >= VANISH[1]; micro.visible = !gone;
  micro.userData.light.material.opacity = gone ? 0 : 0.8;
  vanishFx(T, VANISH[1], [[-2.2, 1.12, -3.0], [-2.0, 1.1, -3.0]]);
  cook.visible = true;
  const toPan = t > 8.2;
  cook.position.set(toPan ? 0.55 : -0.95, 0, toPan ? -2.35 : -2.1); cook.rotation.y = toPan ? Math.PI : Math.PI + 0.7;
  cook.userData.arms[0].rotation.x = -1.2; cook.userData.arms[1].rotation.x = toPan ? -1.1 : -0.2;
  frozen.visible = !toPan;
  cook.userData.head.rotation.y = gone && !toPan ? Math.sin(t * 2) * 0.5 : 0;
  const u = ease(t / 12);
  look(lerp(-3.3, -3.0, u), lerp(2.0, 2.0, u), lerp(-0.2, 0.2, u), lerp(-1.7, -0.6, u), 1.05, -2.9, 50);
  if (t < 4.1) setTop('消えた家電', '電子レンジ', fade(t, 0.15, 4.1, 0.2));
  else setTop('冷凍食品・1人あたり（2025年）', '年' + (countUp(t - 4.1, 246, 0.1, 1.2) / 10).toFixed(1) + 'kg', fade(t, 4.1, 8.2, 0.2), GOLD);
  return room;
}
function shotWash(t, T) { // washer vanishes; hand-washing in a tub
  lift(260); hideAll();
  setRoom({ sets: [] }); setLight('day', { ceil: 4, hemi: 1.05 }); LAUN.visible = true;
  const gone = T >= VANISH[2]; washer.visible = !gone; washer.userData.drum.rotation.z = T * 4;
  vanishFx(T, VANISH[2], [[-2.9, 0.5, -2.9], [-2.9, 0.9, -2.9]]);
  washer2.visible = true;
  if (!gone || t < 4) { washer2.position.set(-2.2, 0, -1.6); washer2.rotation.y = Math.PI + 0.4; washer2.userData.legs.forEach(l => l.rotation.x = 0); washer2.userData.arms.forEach(a => a.rotation.x = 0); washer2.userData.head.rotation.set(0, gone ? Math.sin(t * 2) * 0.5 : 0, 0); }
  else { // kneel at the tub, scrubbing
    washer2.position.set(-0.8, -0.42, -1.25); washer2.rotation.y = Math.PI;
    washer2.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); washer2.userData.arms.forEach((a, i) => a.rotation.x = -0.9 + Math.sin(t * 8 + i * 3) * 0.25); washer2.userData.head.rotation.set(0.5, 0, 0);
  }
  const u = ease(t / 12.2);
  look(lerp(1.4, 1.6, u), lerp(2.6, 2.5, u), lerp(2.2, 1.9, u), -1.6, 0.5, -2.3, 50);
  if (t < 4) setTop('消えた家電', '洗濯機', fade(t, 0.15, 4, 0.2));
  else setTop('洗濯機が消えたら', '毎日、手洗い', fade(t, 4, 8.2, 0.2), GOLD);
  return room;
}
function shotFridge(t, T) { // fridge vanishes; food left on the floor spoils
  lift(240); hideAll(); kitchenBase();
  const gone = T >= VANISH[3]; kitchenFridge(!gone); FOOD.visible = gone;
  vanishFx(T, VANISH[3], [[2.6, 0.6, -3.0], [2.6, 1.3, -3.0], [2.6, 1.9, -3.0]]);
  spoil(clamp((t - 6) / 6));
  if (t > 8) flies.set(((t - 8) % 1.6) / 1.6);
  const u = ease(t / 12);
  look(lerp(0.4, 0.8, u), lerp(1.9, 1.6, u), lerp(0.4, -0.4, u), 2.4, lerp(1.0, 0.35, u), -2.9, 50);
  if (t < 4.1) setTop('消えた家電', '冷蔵庫', fade(t, 0.15, 4.1, 0.2));
  else if (t < 8.1) setTop('冷蔵庫のめやす（厚生労働省）', countUp(t - 4.1, 10, 0.1, 1.0) + '℃以下', fade(t, 4.1, 8.1, 0.2), BLUE);
  else setTop('食中毒の患者（2025年）', comma(countUp(t - 8.1, 24727, 0.1, 1.3)) + '人', fade(t, 8.1, 12, 0.2), RED);
  return room;
}
function bedBase(hot) {
  setRoom({ sets: ['bed'] });
  if (hot) { setLight('day', { ceil: 0, hemi: 1.0, lamp: 3.0 }); lamp.color.set('#ff9a5a'); lamp.position.set(1.0, 2.0, -1.0); room.background.set('#e8b48a'); }
  else { setLight('day', { ceil: 2, hemi: 1.05 }); lamp.color.set('#ffc98a'); }
}
function shotAC(t, T) { // aircon vanishes; elderly person on the bed fans and sweats
  lift(330); hideAll();
  const gone = T >= VANISH[4];
  bedBase(gone && t > 1.5);
  ac.visible = !gone; ac.userData.flap.rotation.x = 0.4;
  if (!gone) coolAir.set((t % 1.6) / 1.6);
  vanishFx(T, VANISH[4], [[0.6, 2.75, -3.3], [0.3, 2.75, -3.3], [0.9, 2.75, -3.3]]);
  sitBed(elder, t, gone ? clamp((t - 1.5) / 1) : 0);
  if (gone && t > 2) { if (!sweat.ok) { sweat.init([[1.6, 1.85, -2.3]], 0.3, 0.6); sweat.ok = true; } sweat.set(((t - 2) % 1.3) / 1.3); }
  const u = ease(t / 4);
  look(lerp(-1.2, -0.9, u), lerp(2.2, 2.15, u), lerp(3.4, 3.0, u), 1.0, 1.55, -2.9, 50);
  setTop('消えた家電', 'エアコン', fade(t, 0.15, 4, 0.2));
  return room;
}
function shotMap(t, T) { // heatstroke transports across Japan
  hideAll(); setMapEnv('day'); mapHeat(t, easeOut(clamp(t / 4)));
  const u = ease(t / 8);
  look(lerp(-8, -4, u), lerp(290, 260, u), lerp(95, 80, u), -4, 0, -30, 50);
  if (t < 4) setTop('熱中症の救急搬送（2025年5〜9月）', comma(countUp(t, 100510, 0.2, 1.4)) + '人', fade(t, 0.15, 4, 0.2), RED);
  else setTop('発生場所で一番多い「住居」（2025年）', (countUp(t - 4, 381, 0.1, 1.0) / 10).toFixed(1) + '%', fade(t, 4, 8, 0.2), RED);
  return japan;
}
function shotTokyo(t, T) { // Tokyo 23 wards: indoor deaths
  hideAll(); setMapEnv('dusk'); mapHeat(t, 1, true);
  const tk = ll(...CITY.tokyo); const u = ease(t / 8);
  look(tk.x + lerp(14, 8, u), lerp(60, 34, u), tk.z + lerp(50, 32, u), tk.x, 0, tk.z - 2, 50);
  if (t < 4) setTop('家の中で亡くなった人（東京23区・2025年夏）', countUp(t, 181, 0.2, 1.2) + '人', fade(t, 0.15, 4, 0.2), RED);
  else setTop('うちエアコンなし・使わず（計算）', countUp(t - 4, 144, 0.05, 0.9) + '人（約8割）', fade(t, 4, 8, 0.2), RED);
  return japan;
}
function shotMeterAC(t, T) {
  lift(260); lineupState(T); lineCam(t, 4, 4);
  if (t < 0.3) setTop('', '', 0);
  setTop('熱中症の死者（全国・2024年）', comma(countUp(t, 2160, 0.3, 1.2)) + '人', fade(t, 0.15, 4, 0.2), RED);
  return aLineup;
}
function shotResult(t, T) {
  lift(320); lineupState(T); lineCam(t, 8);
  if (t < 5.8) setTop('生活が一番ヤバい家電', 'エアコン', fade(t, 0.3, 5.8, 0.2), RED);
  else setTop('熱中症の死者（全国・2024年）', '2,160人', fade(t, 5.8, 8, 0.2), RED);
  return aLineup;
}
function shotLoop(t, T) { lift(320); lineupState(T); lineCam(t, 3.7); return aLineup; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6.4, f: shot1 },
  { a: 6.4, b: 14.6, f: shotTV }, { a: 14.6, b: 18.4, f: meterShot(0) },
  { a: 18.4, b: 26.8, f: shotMicro }, { a: 26.8, b: 30.6, f: meterShot(1) },
  { a: 30.6, b: 38.9, f: shotWash }, { a: 38.9, b: 42.8, f: meterShot(2) },
  { a: 42.8, b: 55.0, f: shotFridge }, { a: 55.0, b: 59.0, f: meterShot(3) },
  { a: 59.0, b: 63.1, f: shotAC }, { a: 63.1, b: 71.1, f: shotMap }, { a: 71.1, b: 79.2, f: shotTokyo }, { a: 79.2, b: 83.3, f: shotMeterAC },
  { a: 83.3, b: 91.3, f: shotResult }, { a: 91.3, b: 94.9, f: shotLoop }, { a: 94.9, b: 99.9, f: endCard },
];
void glow; void makeTV; void makeFridge; void makeWasher;
runStory({
  shots, subs: SUBS, duration: 99.9,
  meta: {
    id: '0721',
    series: 'ヤバい順',
    hookType: 'H5', cat: '身近なもの・インフラ',
    title: '1つ消えたら、生活が一番ヤバい家電はどれ？',
    titleHtml: '<span style="font-size:.84em">1つ消えたら、生活が</span><br>一番ヤバい家電は？',
    mood: 'mystery', seed: 721, hits: [59.8, 83.5], risers: [59.0, 83.3],
    impacts: [22.7, 51.1, 63.3, 75.3, 79.5, 83.5],
    sfx: [[0.3, 'whoosh'], [7.4, 'poof'], [15.0, 'meter', 0.05], [19.6, 'poof'], [27.2, 'meter', 0.25], [31.4, 'poof'], [34.9, 'bubble'], [39.4, 'meter', 0.5],
      [43.6, 'poof'], [51.5, 'buzz'], [55.6, 'meter', 0.8], [59.8, 'poof'], [63.4, 'alarm'], [79.8, 'meter', 1.0]],
    narr: { '24.6kg': '24.6キロ', '10℃': '10度', '2.5万人': '2万5千人', '10万人': '10万人', '181人': '181人', '約8割': '約8割', '2,160人': '2160人' },
    ask: '次にランキングしてほしいものは？',
    caption: 'もしもテレビ、電子レンジ、洗濯機、冷蔵庫、エアコンのうち1つだけが消えたら、生活が一番ヤバいのはどれ？\n\nテレビ：平日1日のネット利用は181.8分で、テレビの154.7分より長い（2024年度）。ニュースも動画もスマホで見られる。ダメージはほぼゼロ。\n電子レンジ：冷凍食品は1人年24.6kg（2025年）。でもフライパンや鍋で温め直せる。\n洗濯機：全部手洗いになり、時間と体力は減る。でも命には関わらない。\n冷蔵庫：細菌の多くは10℃で増えるのがゆっくりになる（厚生労働省）。冷蔵庫がある今でも、食中毒の患者は年2万4,727人（2025年）。夏は、その日のうちに食べきるしかない。\nエアコン：2025年5〜9月の熱中症の救急搬送は10万510人で過去最多。発生場所で一番多いのは住居（38.1%）。東京23区では2025年夏、家の中で熱中症で亡くなった181人のうち、144人（約8割）がエアコンなし、または使っていなかった。全国では熱中症で年2,160人が亡くなっている（2024年）。\n\n結果：一番ヤバいのはエアコン。夏に命を落とす人が増える。\n※順位は、消えたときの暮らしへのダメージ（命に関わるかを一番重く見る）で決めた比較です。\n\n次にランキングしてほしいものは？ コメントで教えて。\n\n出典：総務省 令和6年度情報通信メディアの利用時間と情報行動に関する調査、日本冷凍食品協会（2025年）、厚生労働省 家庭でできる食中毒予防の6つのポイント・令和7年食中毒統計・人口動態統計、消防庁 令和7年の熱中症による救急搬送状況、東京都監察医務院 令和7年夏の熱中症死亡者の状況',
    hashtags: ['もしもラボ', '家電', 'ランキング', '熱中症', '雑学'],
    endStats: [['テレビ', 'ほぼゼロ', 'ネットの方が長い'], ['電子レンジ', '小', '鍋で温め直せる'], ['洗濯機', '中', '毎日手洗いに'], ['冷蔵庫', '大', '食中毒は今でも年2.5万人'], ['エアコン', '危険', '熱中症の死者 年2,160人']],
    sources: '出典：総務省（2024年度）、日本冷凍食品協会（2025年）、<br>厚生労働省、消防庁（2025年）、東京都監察医務院（2025年）',
  },
});
