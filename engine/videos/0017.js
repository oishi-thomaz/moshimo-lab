import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, comma } from '../lib.js';
import { nursery, COTS, setBabies, nurse, setNurseryLight } from '../scenes/nursery.js';
import { japan, ll, CITY, setDots, setMapEnv, makeRing } from '../scenes/japan.js';
import { stage, makeBar, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, makeSparkles, el } from '../story.js';
import { poseWalk } from '../lib.js';

// もしも1年間、赤ちゃんが1人も生まれなかったら？
// 数字：厚生労働省 令和7年(2025)人口動態統計（確定数）の概況（2026年9月30日公表）
//       出生数 67万1,270人／死亡数 158万9,533人／自然増減数 △91万8,263人
//       https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei25/index.html
// 推計：1日あたりの出生 671,270÷365≒1,839人、1か月 ≒5.6万人
//       出生ゼロなら1年の人口減 ＝ 死亡数 ≒159万人（出入国は含まない）、半年 ≒79万人

const BIRTH = 671270, DEATH = 1589533, NAT = 918263;
const PINK = '#ffb3c4';

// ---------- nursery sparkles (babies leaving) ----------
const spark = makeSparkles(160, 0.12, 0xffe4ec); nursery.add(spark.points);

// ---------- map: pink "birth" pulses ----------
const birthCities = ['tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'hiroshima', 'niigata', 'kagoshima'].map(c => ll(...CITY[c]));
const rings = birthCities.map(() => { const r = makeRing(PINK, 0.9); r.visible = false; return r; });
function pulses(t, amt) { // amt 0..1: how many births still happen
  rings.forEach((r, i) => { const k = (t * 0.6 + i * 0.17) % 1; r.visible = amt > 0.01; r.position.x = birthCities[i].x; r.position.z = birthCities[i].z; r.scale.setScalar(1 + k * 7); r.material.opacity = 0.9 * (1 - k) * amt; });
}
function mapDots(pinkAmt) { // a few pink dots = newborns; shrink away
  setDots((i, x, z, q) => q < 0.07 ? { color: PINK, s: Math.max(0.0001, pinkAmt) * 2.4, y: 0 } : { color: '#ffffff', s: 1 });
}

// ---------- stage: births vs deaths bars ----------
const SC = 2.0 / 1e6; // 1m = 38.5万人
const barB = makeBar({ color: PINK, w: 2.4, d: 2.4, x: -2.4, label: '生まれた人', nameTop: true });
const barD = makeBar({ color: '#8fa3bf', w: 2.4, d: 2.4, x: 2.4, label: '亡くなった人', nameTop: true });
const bars = [barB, barD];
// crowd (population)
const crowd = makeCrowd(90, 17, { w: 13, d: 7, z: -1 });
const crowdSpark = makeSparkles(120, 0.18, 0xdfe8ff); stage.add(crowdSpark.points);
function showBars(v) { bars.forEach(b => b.g.visible = v); }
function showCrowd(v) { crowd.g.visible = v; }

const SUBS = [
  [2.6, 6.0, 'いつもの新生児室。<br>今日も赤ちゃんが眠る。'],
  [6.2, 10.0, 'でも本当の衝撃は、<br>あとから来る数字。'],
  [10.1, 14.0, '本当なら1日に<br>約1,839人（推計）。'],
  [14.2, 18.0, '日本中で、<br>産声が聞こえない。'],
  [18.1, 22.0, '1か月で約5.6万人が<br>生まれない（推計）。'],
  [22.2, 26.0, 'でも、亡くなる人の数は<br>いつも通り。'],
  [26.1, 30.0, '2025年は1年で<br>約159万人が亡くなった。'],
  [30.2, 34.6, '減る一方で、増える人はゼロ。<br>半年後、どうなる？'],
  [34.6, 39.0, '半年で約79万人<br>減る計算（推計）。'],
  [39.2, 43.6, '1年で生まれるはずだった<br>赤ちゃんたち。'],
  [43.6, 47.8, '2025年の出生数は<br>67万1,270人。'],
  [48.1, 52.6, '結果：1年で日本の人口は<br>約159万人減った。'],
  [52.6, 55.4, '現実の2025年も、<br>約92万人の自然減。'],
  [55.6, 59.4, 'あなたは何人<br>きょうだい？'],
];

const cd = (left) => `0:${String(Math.max(0, Math.floor(left))).padStart(2, '0')}.${String(Math.floor((Math.max(0, left) % 1) * 100)).padStart(2, '0')}`;
const camHome = (u) => { lift(240); look(lerp(0.5, -0.2, u), lerp(5.2, 5.0, u), lerp(5.6, 5.3, u), 0, 0.5, -1.4, 55); };

const TP = 0.5; // v2：0.5秒でカウントダウンが0になり、生まれた赤ちゃん 0人 がドンと出る
function shot0(t, T) { // hook (v2): babies sleeping, countdown hits 0 at 0.5s
  setNurseryLight('day'); setBabies(() => 1); spark.set(0);
  nurse.visible = true; nurse.position.set(1.5, 0, -3.05); nurse.rotation.y = -0.4; poseWalk(nurse, 0, 0); // shot2 と同じ立ち位置（つながり）
  camHome(ease(t / 6)); lift(20); // v2：ベビーコットと看護師をタイトルの下に
  el.flash.style.opacity = t >= TP ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  setHud('赤ちゃんが生まれなくなるまで', cd(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  if (t >= TP) setTop('この日に生まれた赤ちゃん', '0人', 1, '#ff8a7a');
  return nursery;
}
function shot1(t, T) { // daily life, countdown reaches 0 at 3s
  setNurseryLight('day'); setBabies(() => 1); spark.set(0);
  const w = clamp((t - 0.6) / 2.9); nurse.visible = true; nurse.position.set(lerp(-3.0, 1.5, ease(w)), 0, -3.05); nurse.rotation.y = Math.PI / 2; poseWalk(nurse, t * 7, w < 0.98 ? 1 : 0);
  camHome(ease(T / 6));
  setHud('赤ちゃんが生まれなくなるまで', cd(3 - T), T < 3.4 ? 1 : clamp(1 - (T - 3.4) / 0.3), { mono: true });
  return nursery;
}
// babies go home one by one (no new ones come)
const LEAVE = [4, 0, 8, 2]; // cot indices that empty during +1日
function shot2(t, T) {
  setNurseryLight('day'); nurse.visible = true; nurse.position.set(1.5, 0, -3.05); nurse.rotation.y = -0.4; poseWalk(nurse, 0, 0);
  setBabies(i => { const k = LEAVE.indexOf(i); return k < 0 ? 1 : 1 - clamp((t - 1.2 - k * 1.3) / 0.5); });
  const kk = Math.floor(clamp((t - 1.2) / 1.3, 0, 3.99)); const tl = (t - 1.2 - kk * 1.3) / 0.9;
  if (t > 1.2 && tl < 1) { const c = COTS[LEAVE[kk]]; spark.init([[c.x, 0.9, c.z]], 0.3, 0.8); spark.set(clamp(tl)); } else spark.set(0);
  const u = ease(t / 8);
  lift(lerp(20, 240, ease(clamp(t / 1.5)))); look(lerp(-0.6, 0.4, u), lerp(4.9, 5.1, u), lerp(5.2, 4.9, u), 0, 0.5, -1.4, 55); // v2：冒頭（lift 20）からなめらかに
  hudTime('+1日');
  setTop('1日に生まれる赤ちゃん（2025年・推計）', '約' + comma(countUp(t, 1839)) + '人', fade(t, 0.15, 8, 0.25));
  return nursery;
}
function shot3(t, T) { // +1か月 map: pink newborn dots shrink, pulses stop
  lift(330); setMapEnv('day'); mapDots(1 - clamp((t - 2.6) / 2.6)); pulses(T, 1 - clamp((t - 2.6) / 2.4));
  const u = ease(t / 8);
  look(lerp(-6, -2, u), lerp(290, 270, u), lerp(92, 82, u), -4, 0, -30, 50);
  hudTime('+1か月');
  setTop('1か月に生まれる赤ちゃん（2025年・推計）', '約' + (countUp(t, 56) / 10).toFixed(1) + '万人', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot4(t, T) { // +3か月 bars: births drop to 0, deaths stay
  lift(300); showBars(true); showCrowd(false); crowdSpark.set(0);
  const kb = 1 - easeOut(clamp((t - 1.0) / 1.6));
  const gD = easeOut(clamp(t / 1.2));
  barB.setH(BIRTH * SC * Math.max(kb, 0.0001), kb > 0.02 ? Math.round(BIRTH * kb / 1e4) + '万人' : '0人');
  barD.setH(DEATH * SC * gD, gD > 0.15 ? Math.round(DEATH * gD / 1e4) + '万人' : '');
  const u = ease(t / 8);
  look(lerp(-2, 2, u), lerp(4.4, 4.2, u), lerp(18, 17, u), 0, 2.4, 0, 50);
  hudTime('+3か月');
  setTop('1年に亡くなった人（2025年）', (() => { const v = countUp(t, 1589533, 0.3, 1.6); return `${Math.floor(v / 10000)}万${comma(v % 10000)}人`; })(), fade(t, 0.15, 8, 0.25));
  return stage;
}
const GONE = [3, 8, 14, 22, 30, 41, 55, 67]; // crowd people who fade (symbolic)
function shot5(t, T) { // +6か月 crowd thins
  lift(260); showBars(false); showCrowd(true);
  crowd.people.forEach((p, i) => { const k = GONE.indexOf(i); p.visible = k < 0 || t < 0.8 + k * 0.9; });
  const k = Math.floor((t - 0.8) / 0.9); const tl = (t - 0.8 - k * 0.9) / 0.8;
  if (k >= 0 && k < GONE.length && tl < 1) { const p = crowd.people[GONE[k]]; crowdSpark.init([[p.position.x, 1.2, p.position.z - 1]], 0.5, 1.2); crowdSpark.set(clamp(tl)); } else crowdSpark.set(0);
  const u = ease(t / 8.8);
  look(lerp(-3, 3, u), lerp(7.5, 7, u), lerp(16, 15, u), 0, 1.2, -1, 50);
  hudTime('+6か月');
  setTop('半年で減る人口（推計）', '約' + countUp(t, 79) + '万人', fade(t, 0.15, 8.8, 0.25));
  return stage;
}
function shot6(t, T) { // +1年 map dusk: no pink at all
  lift(300); setMapEnv('dusk'); mapDots(0); pulses(T, 0);
  const tk = ll(...CITY.osaka); const u = ease(t / 8.8);
  look(tk.x + lerp(30, 5, u), lerp(130, 100, u), tk.z + lerp(75, 60, u), tk.x + 12, 0, tk.z - 8, 50);
  hudTime('+1年');
  setTop('生まれなかった赤ちゃん（2025年の出生数）', (() => { const v = countUp(t, BIRTH, 0.3, 1.6); return `${Math.floor(v / 10000)}万${comma(v % 10000)}人`; })(), fade(t, 0.15, 8.8, 0.25));
  return japan;
}
function shot7(t, T) { // result: empty nursery at night
  setNurseryLight('night'); setBabies(() => 0); spark.set(0); nurse.visible = false;
  const u = ease(t / 7.5);
  lift(240); look(lerp(0.6, 0, u), lerp(5.4, 5.1, u), lerp(6.0, 5.5, u), 0, 0.5, -1.4, 55);
  if (t < 4.5) setTop('出生ゼロの1年で減る人口（推計）', '約' + countUp(t, 159, 0.2, 1.4) + '万人', fade(t, 0.15, 4.5, 0.2));
  else setTop('実際の自然減（2025年）', '約' + countUp(t - 4.5, 92, 0.1, 1.0) + '万人', fade(t, 4.5, 7.5, 0.2), '#ffd0db');
  return nursery;
}
function shot8(t, T) { // loop: same framing as the hook, nursery stays empty
  setNurseryLight('day'); setBabies(() => 0); spark.set(0); nurse.visible = false;
  camHome(ease(t / 6) * 0.3);
  setHud('赤ちゃんが生まれなくなるまで', cd(TP), 1, { mono: true });
  return nursery;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65,
  cut: [[2.5, 6.0]], // v2：いつもの新生児室（元の2.5〜6秒）を抜いて、0人になった直後から本題へ
  meta: {
    id: '0017',
    v2: true,
    hookLine: '赤ちゃんが、1人も生まれなくなった。',
    title: '1年間、赤ちゃんが1人も生まれなかったら？',
    titleHtml: '1年間、赤ちゃんが<br>生まれなかったら？', // v2：タイトルは1行9字まで（大きく出すため）
    mood: 'emotional', seed: 17, hits: [0.5, 48.1], risers: [6.0],
    ask: 'あなたは何人きょうだい？',
    narr: { '1,839人': '1839人', '67万1,270人': '67万1270人' },
    caption: 'もしも1年間、日本で赤ちゃんが1人も生まれなかったら？\n2025年に生まれた赤ちゃんは67万1,270人（過去最少）。亡くなった人は158万9,533人。出生がゼロなら、1年で人口は約159万人減る計算（推計・出入国は含まない）。現実の2025年も、自然減は約92万人。厚生労働省の人口動態統計（確定数）で計算してみた。\n\nあなたは何人きょうだい？ コメントで教えて。\n\n出典：厚生労働省 令和7年(2025)人口動態統計（確定数）の概況',
    hashtags: ['もしもラボ', '少子化', '出生数', '人口減少', '赤ちゃん'],
    endStats: [['出生数', '67万1,270人', '2025年'], ['死亡数', '158万9,533人', '2025年'], ['出生ゼロの1年で減る人口（推計）', '約159万人', ''], ['実際の自然減', '約92万人', '2025年']],
    sources: '出典：厚生労働省 令和7年(2025)人口動態統計（確定数）の概況',
  },
});
