import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, randPerson, makePerson, SKIN, HAIR } from '../lib.js';
import { farm, setFarmEnv, setRice, setVeg, setWeeds, makeFarmer, farmerWork, makeTractor, PADDIES, FIELD } from '../scenes/farm.js';
import { grocer, setStock, setSoldOut, tagsOn, setGrocerLight, SIGNS } from '../scenes/grocer.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本中の農家が消えたら？（blueprint no 41）
// 数字（すべて農林水産省の一次資料で確認）：
//   基幹的農業従事者（個人経営体）103万6千人、5年前比 24.0%減、65歳以上 69.6%（2025年農林業センサス 結果の概要 2026/3/31）
//     https://www.maff.go.jp/j/press/tokei/census/260331.html ／ https://www.e-stat.go.jp/stat-search/files/data?sinfid=000040483733&ext=pdf
//   令和7年度（2025年度）食料自給率：カロリーベース37%、生産額ベース66%、1人1日供給熱量2,237kcal、国産供給熱量830kcal、
//     食料国産率（輸入飼料の畜産物も国産に数える）1,040kcal（46%）、うち魚介類の国産32kcal、必要な摂取熱量1,850kcal
//     重量ベース品目別自給率（概算）：米95%、野菜77%、鶏卵96%（農水省 2026/8/7 公表）
//     https://www.maff.go.jp/j/press/kanbo/anpo/260807.html （参考1 260807-3.pdf、参考2 食料需給表 260807-1.pdf）
//   単純計算：農家が消えると国産のうち農畜産物（1,040−32=1,008kcal）がなくなる → 2,237−1,008=1,229kcal（今の輸入量のまま）
//     1,229÷1,850＝66% → 必要な量の約3分の2

// ---------- farm cast ----------
const R = rng(4101);
const farmers = [];
const SPOTS = [[-10, -8.2], [-12.5, -10], [-8.2, -10.6], [-0.5, -9.5], [2.5, -7.5], [8.5, -11], [-7.5, -13.5], [6, 6.2], [10.5, 8.8], [12.5, 5.5]];
SPOTS.forEach(([x, z], i) => { const p = makeFarmer(R); p.position.set(x, 0, z); p.rotation.y = R() * 6.28; farm.add(p); farmers.push(p); });
const hats = SPOTS.map(([x, z], i) => {
  const g = new THREE.Group(); const sm = mat('#e3c77a');
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 14), sm); g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 12), sm); crown.position.y = 0.11; g.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 12), mat('#b8483a')); band.position.y = 0.04; g.add(band);
  g.position.set(x + 0.3, i < 7 ? 0.1 : 0.3, z + 0.2); g.rotation.set(0.25, R() * 6, 0.15); g.visible = false; farm.add(g); return g;
});
const tractor = makeTractor(); farm.add(tractor);
const TR0 = -18; // tractor runs along the x road at z=1.6
function setTractor(dist) { tractor.position.set(TR0 + dist, 0, 1.6); tractor.rotation.y = 0; tractor.userData.spin(dist); }
const fSpark = makeSparkles(500, 0.35); farm.add(fSpark.points);
function farmersOn(on, t) { farmers.forEach((p, i) => { p.visible = on; if (on) farmerWork(p, t, i * 1.3); }); }
function hatsOn(on) { hats.forEach(h => h.visible = on); }

// ---------- grocer cast ----------
const shoppers = [];
{ const r = rng(77); for (let i = 0; i < 4; i++) { const p = randPerson(r); grocer.add(p); shoppers.push(p); } }
shoppers[0].position.set(-4.4, 0, 2.3); shoppers[0].rotation.y = Math.PI - 0.5;
shoppers[1].position.set(-0.4, 0, 2.2); shoppers[1].rotation.y = Math.PI + 0.6;
shoppers[2].position.set(0.6, 0, -2.0); shoppers[2].rotation.y = Math.PI - 0.5;
shoppers[3].position.set(8.3, 0, -0.6); shoppers[3].rotation.y = -Math.PI / 2;
const gSpark = makeSparkles(300, 0.12); grocer.add(gSpark.points);
function shopperLook(t) { shoppers.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.9 + i * 2) * 0.5; p.userData.arms[1].rotation.x = -0.3 - Math.max(0, Math.sin(t * 0.7 + i)) * 0.6; }); }

// ---------- dining table (room kitchen) ----------
const MEAL = new THREE.Group(); room.add(MEAL); MEAL.visible = false;
{
  const tb = box(1.9, 0.06, 1.1, mat('#b08a63')); tb.position.set(0, 0.74, 0.3); MEAL.add(tb);
  for (const [x, z] of [[-0.85, -0.15], [0.85, -0.15], [-0.85, 0.75], [0.85, 0.75]]) { const l = box(0.07, 0.72, 0.07, mat('#8a6a48')); l.position.set(x, 0.36, z); MEAL.add(l); }
  const mat1 = box(0.8, 0.01, 0.5, mat('#e9dcc5')); mat1.position.set(0, 0.775, 0.45); MEAL.add(mat1);
}
const dish = (name, make, x, z, gone) => { const g = new THREE.Group(); make(g); g.position.set(x, 0.78, z); MEAL.add(g); let e = null; if (gone) { e = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 20), mat('#f6f4ef')); e.position.set(x, 0.79, z); MEAL.add(e); } return { name, g, gone, e }; };
const plate = (g, rad = 0.13, c = '#f6f4ef') => { const p = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.8, 0.02, 20), mat(c)); g.add(p); };
const bowl = (g, rad, c) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.6, rad * 0.9, 16), mat(c)); b.position.y = rad * 0.45; g.add(b); return b; };
const DISHES = [
  dish('ごはん', g => { bowl(g, 0.09, '#f6f4ef'); const s = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), mat('#ffffff')); s.scale.y = 0.6; s.position.y = 0.085; g.add(s); }, -0.22, 0.55, true),
  dish('みそ汁', g => { bowl(g, 0.085, '#7a3a2a'); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 14), mat('#b58a52')); s.position.y = 0.075; g.add(s); }, 0.22, 0.55, false),
  dish('焼き魚', g => { plate(g, 0.16); const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), mat('#b9824a')); f.scale.set(2.2, 0.6, 1); f.position.y = 0.03; g.add(f); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), mat('#8a5a2a')); tl.rotation.z = Math.PI / 2; tl.position.set(-0.16, 0.03, 0); g.add(tl); }, 0.0, 0.25, false),
  dish('卵焼き', g => { plate(g, 0.12); for (let i = 0; i < 3; i++) { const e = box(0.06, 0.05, 0.08, mat('#f2c84a')); e.position.set(-0.07 + i * 0.07, 0.035, 0); g.add(e); } }, -0.5, 0.25, true),
  dish('サラダ', g => { bowl(g, 0.11, '#e8eef2'); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), mat(i % 3 ? '#7fbf5a' : '#d9413a', { flatShading: true })); l.position.set(Math.cos(i) * 0.05, 0.1, Math.sin(i) * 0.05); g.add(l); } }, 0.5, 0.22, true),
  dish('肉', g => { plate(g, 0.14); for (let i = 0; i < 3; i++) { const m = box(0.09, 0.03, 0.06, mat('#8a4a32')); m.position.set(-0.08 + i * 0.08, 0.025, (i % 2) * 0.03); m.rotation.y = i * 0.4; g.add(m); } }, -0.45, -0.02, true),
  dish('パン', g => { plate(g, 0.11); const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#d9a35a')); b.scale.set(1.3, 0.8, 1); b.position.y = 0.04; g.add(b); }, 0.45, -0.02, false),
  dish('牛乳', g => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.14, 12), mat('#fbfbf7')); c.position.y = 0.07; g.add(c); }, 0.0, -0.05, true),
];
const mSpark = makeSparkles(260, 0.06); room.add(mSpark.points);
const family = [makePerson({ skin: SKIN[1], hair: HAIR[2], shirt: '#4f7a9a', pants: '#3b3f4a', scale: 1 }), makePerson({ skin: SKIN[0], hair: HAIR[0], shirt: '#d97a7a', pants: '#3b3f4a', long: true, scale: 0.95 })];
family.forEach((p, i) => { p.position.set(i ? 0.6 : -0.6, -0.45, -0.75); p.userData.legs.forEach(l => l.rotation.x = -1.4); MEAL.add(p); });
function meal(k) { DISHES.forEach(d => d.g.visible = !d.gone || k < 1); }

// ---------- stage bars (kcal) ----------
const bars = [
  makeBar({ color: '#4fa3d1', label: '今', x: -3.6, z: 0 }),
  makeBar({ color: '#8a94a3', label: '必要な量', x: 0, z: 0 }),
  makeBar({ color: '#e0603a', label: '農家が消えたら', x: 3.6, z: 0 }),
];
bars.forEach(b => { b.g.visible = false; });
const KC = 0.0026; // m per kcal

// ---------- text ----------
const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの田んぼの朝。'],
  [6.2, 10.1, '田んぼが止まる。<br>でもヤバいのは1年後。'],
  [10.1, 14, '7割は65歳以上の<br>ベテランだった。'],
  [14.2, 18.1, '野菜売り場から、<br>国産が消えていく。'],
  [18.1, 22, '野菜は重さで77%が国産。<br>次に消えるのは…'],
  [22.2, 26.1, '卵は96%が国産。<br>ケースがほぼ空に。'],
  [26.1, 30, '食べ物の金額では、<br>66%が国産。次は主食。'],
  [30.2, 34.6, '新米が、もう届かない。<br>お米は95%が国産。'],
  [34.6, 39, '田んぼは草におおわれ、<br>荒れ地に戻っていく。'],
  [39.2, 43.6, '1人が1日に食べる量は<br>2,237kcalあった。'],
  [43.6, 47.8, '農家の分が消え、<br>残るのは輸入と魚。'],
  [48.1, 53.8, '結果：1日に食べられるのは<br>必要な量の3分の2だけに。'],
  [53.9, 56.1, '農家は5年で24%減った。'],
  [56.2, 59.4, '国産で一番なくなると<br>困る食べ物は？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TP = 0.5; // v2：0.5秒で消える（冒頭で待たせない）
function farmBase(env = 'day') { setFarmEnv(env); setRice(0.45, 0); setVeg(1); setWeeds(0); hatsOn(false); fSpark.set(0); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(-4.6, -5.0, u), lerp(4.4, 4.2, u), lerp(0.6, 0.0, u), -10.2, 0.6, -9.6, 50); }
function shot0(t) { // hook: farmers working, countdown, vanish at 1.4
  lift(100); farmBase('day'); // v2：農家がタイトルの下に入るように少し下げる
  farmersOn(t < TP, t + 3); setTractor(t < TP ? 10 + t * 2.2 : 10 + TP * 2.2);
  if (t >= TP && !fSpark.ready) { fSpark.init(farmers.map(p => [p.position.x, 1.2, p.position.z]), 0.8, 1.6); fSpark.ready = true; }
  fSpark.set(t >= TP ? (t - TP) / 1.0 : 0); hatsOn(t >= TP);
  el.flash.style.opacity = t >= TP ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  setHud('農家が消えるまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return farm;
}
function shot1(t) { // everyday
  lift(330); farmBase('day');
  farmersOn(true, t + 5); setTractor(4 + t * 2.0);
  const u = ease(t / 3.5);
  look(lerp(5, 3, u), lerp(7.5, 7, u), lerp(9, 8, u), lerp(-2, -3, u), 0.3, -8, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return farm;
}
function shot2(t) { // +1日 empty farm
  lift(330); farmBase('day'); farmersOn(false); hatsOn(true); setTractor(13);
  const u = ease(t / 8);
  look(lerp(-2, 6, u), lerp(9, 7, u), lerp(14, 12, u), lerp(-2, 2, u), 0, -5, 50);
  hudTime('+1日');
  if (t < 4.1) setTop('基幹的農業従事者（2025年）', (countUp(t, 1036, 0.3, 1.4) / 10).toFixed(1) + '万人', fade(t, 0.15, 4.2, 0.1));
  else setTop('そのうち65歳以上（2025年）', (countUp(t, 696, 4.3, 1.2) / 10).toFixed(1) + '%', fade(t, 4.1, 8, 0.15), '#ffd27a');
  return farm;
}
function shot3(t) { // +1週間 vegetables vanish
  lift(260); setGrocerLight('day'); tagsOn(true); setSoldOut({});
  const k = lerp(1, 0.23, ease((t - 0.6) / 3.5));
  setStock({ veg: k, egg: 1, rice: 1 }); shopperLook(t);
  const u = ease(t / 8);
  look(lerp(-1.6, -2.6, u), lerp(4.4, 4.2, u), lerp(6.0, 5.4, u), -2.5, 0.9, 0.2, 50);
  hudTime('+1週間');
  setTop('野菜の自給率（重さ・2025年度）', countUp(t, 77, 4.0, 1.2) + '%', fade(t, 3.9, 8, 0.25), '#7ff0c8');
  return grocer;
}
function shot4(t) { // +1か月 eggs vanish, then money
  lift(240); setGrocerLight('day'); tagsOn(t < 3.2);
  const k = lerp(1, 0.04, ease((t - 0.4) / 2.6));
  setStock({ veg: 0.23, egg: k, rice: 1 }); setSoldOut({ egg: t > 3.2 }); shopperLook(t + 3);
  const u = ease(t / 8);
  look(lerp(3.6, 3.0, u), lerp(2.4, 2.3, u), lerp(1.6, 1.2, u), 2.4, 1.35, -3.7, 52);
  hudTime('+1か月');
  if (t < 4.0) setTop('卵の自給率（重さ・2025年度）', countUp(t, 96, 0.3, 1.4) + '%', fade(t, 0.15, 4.1, 0.1), '#ffd27a');
  else setTop('食料自給率（金額・2025年度）', countUp(t, 66, 4.2, 1.2) + '%', fade(t, 4.0, 8, 0.15), '#7ff0c8');
  return grocer;
}
function shot5(t) { // +半年 rice sold out
  lift(240); setGrocerLight('dim'); tagsOn(false);
  const k = lerp(1, 0.05, ease((t - 0.3) / 2.2));
  setStock({ veg: 0.23, egg: 0.04, rice: k }); setSoldOut({ egg: true, rice: t > 2.6 }); shopperLook(t + 6);
  const u = ease(t / 4.4);
  look(lerp(4.4, 4.9, u), lerp(2.4, 2.3, u), lerp(2.6, 2.2, u), 6.5, 0.8, -1.4, 50);
  hudTime('+半年');
  setTop('米の自給率（重さ・2025年度）', countUp(t, 95, 0.3, 1.4) + '%', fade(t, 0.15, 4.4, 0.2), '#ffd27a');
  return grocer;
}
function shot5b(t) { // +半年 paddies go wild
  lift(330); setFarmEnv('gray'); farmersOn(false); hatsOn(true); setTractor(13); setVeg(0); setRice(0.15, 0.3);
  setWeeds(clamp(0.1 + t / 3.5)); fSpark.set(0);
  const u = ease(t / 4.6);
  look(lerp(8, 4, u), lerp(8, 9, u), lerp(12, 15, u), lerp(1, -1, u), 0, -6, 50);
  hudTime('+半年');
  setTop('米の自給率（重さ・2025年度）', '95%', fade(t, 0, 4.6, 0.2), '#ffd27a');
  return farm;
}
function shot6(t) { // +1年 kcal bars
  lift(300); setStageColor('#14213a');
  bars.forEach(b => b.g.visible = true);
  const g1 = ease((t - 0.2) / 1.2), g2 = ease((t - 4.4) / 1.0), g3 = ease((t - 4.6) / 1.4);
  bars[0].setH(2237 * KC * g1, comma(2237 * g1) + 'kcal');
  bars[1].setH(1850 * KC * g2, t > 4.4 ? comma(1850 * g2) + 'kcal' : '');
  bars[2].setH(1229 * KC * g3, t > 4.6 ? comma(1229 * g3) + 'kcal' : '');
  const u = ease(t / 8.8);
  look(lerp(-1.0, 0.6, u), lerp(5.5, 5.2, u), lerp(21, 19.5, u), 0, 3.4, 0, 50);
  hudTime('+1年');
  if (t < 4.4) setTop('1人1日の供給熱量（2025年度）', comma(countUp(t, 2237, 0.3, 1.2)) + 'kcal', fade(t, 0.15, 4.5, 0.1));
  else setTop('農家が消えたあと（単純計算）', comma(countUp(t, 1229, 4.7, 1.4)) + 'kcal', fade(t, 4.4, 8.8, 0.15), '#ff8a7a');
  return stage;
}
function shot7(t) { // result: dinner table with domestic dishes vanishing
  lift(330); setRoom({ sets: ['kitchen'] }); setLight('evening', { ceil: 12, hemi: 0.95 }); MEAL.visible = true;
  const tv = 0.8; meal(t < tv ? 0 : 1);
  if (t >= tv && !mSpark.ready) { mSpark.init(DISHES.filter(d => d.gone).map(d => [d.g.position.x, 0.9, d.g.position.z]), 0.15, 0.4); mSpark.ready = true; }
  mSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  family.forEach((p, i) => { p.userData.head.rotation.x = 0.35; p.userData.arms[i].rotation.x = -0.9; });
  const u = ease(t / 7.5);
  look(lerp(-0.2, 0.2, u), lerp(2.9, 2.8, u), lerp(3.4, 3.1, u), 0, 1.0, -0.2, 50);
  setHud('今の輸入量のまま', '単純計算', fade(t, 0.1, 7.5, 0.2), { mono: true });
  setTop('1人1日の食べ物（必要な量は1,850kcal）', comma(countUp(t, 1229, 0.3, 1.3)) + 'kcal', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return room;
}
function shot8(t) { // loop: same composition as hook, result state (no farmers, weeds)
  lift(100); setFarmEnv('day'); setRice(0.15, 0.3); setVeg(0); setWeeds(1); farmersOn(false); hatsOn(true); setTractor(10 + TP * 2.2); fSpark.set(0);
  hookCam(t + 0.5, 4.5);
  setHud('農家が消えるまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return farm;
}
function resetAll(f) { bars.forEach(b => b.g.visible = f === shot6); MEAL.visible = f === shot7; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 34.6, f: shot5 }, { a: 34.6, b: 39.2, f: shot5b }, { a: 39.2, b: 48, f: shot6 },
  { a: 48, b: 55.5, f: shot7 }, { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { resetAll(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの田んぼの朝（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0041',
    v2: true,
    hookLine: '日本中の農家が、一斉に消えた。',
    title: '日本中の農家が消えたら？',
    titleHtml: '日本中の農家が<br>消えたら？',
    mood: 'tension', seed: 41, hits: [0.5, 48.1], risers: [6.0, 39.2], impacts: [44.0, 48.4],
    sfx: [[0.5, 'poof'], [14.8, 'whoosh'], [22.6, 'whoosh'], [32.6, 'alarm'], [48.8, 'poof'], [35.0, 'meter', 0.5]],
    narr: { '2,237kcal': 'にせんにひゃくさんじゅうななキロカロリー', '77%': 'ななじゅうななパーセント', '96%': 'きゅうじゅうろくパーセント', '66%': 'ろくじゅうろくパーセント', '95%': 'きゅうじゅうごパーセント', '24%': 'にじゅうよんパーセント', '田畑': 'たはた', '7割': 'ななわり', '3分の2': 'さんぶんのに', '新米': 'しんまい' },
    ask: '国産で一番なくなると困る食べ物は？',
    caption: 'もしも日本中の農家が一斉に消えたら？\n田んぼと畑を支える基幹的農業従事者は103万6千人（2025年）。そのうち69.6%が65歳以上で、5年で24%減った。\n国産の割合は、重さで野菜77%・卵96%・お米95%（2025年度）。食べ物の金額では66%が国産。\nいま1人が1日に食べる量（供給熱量）は2,237kcal。農家がつくる分が消えて、今の輸入量のままだと残るのは約1,229kcal（単純計算：輸入飼料で育てた国産の肉や卵も含めて、魚以外の国産分を引いた値）。生活に必要とされる1,850kcalの約3分の2しかない。\n結果、毎日の食事は必要な量の3分の2だけになる。\n\n国産で一番なくなると困る食べ物は？ コメントで教えて。\n\n出典：農林水産省「2025年農林業センサス 結果の概要（確定値）」（2026年3月）、農林水産省「令和7年度 食料自給率・食料需給表」（2026年8月）',
    hashtags: ['もしもラボ', '農家', '食料自給率', '日本の農業', '雑学'],
    endStats: [['基幹的農業従事者', '103.6万人', '2025年'], ['そのうち65歳以上', '69.6%', '2025年'], ['米の自給率（重さ）', '95%', '2025年度'], ['1人1日の供給熱量', '2,237kcal', '2025年度'], ['農家が消えたあと', '約1,229kcal', '単純計算']],
    sources: '出典：農林水産省 2025年農林業センサス（2026年）、<br>農林水産省 令和7年度食料自給率・食料需給表（2026年）',
  },
});
