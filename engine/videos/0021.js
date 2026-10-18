import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, comma } from '../lib.js';
import { room, setRoom, setLight, setScreen, props } from '../scenes/room.js';
import { japan, setDots, setMapEnv } from '../scenes/japan.js';
import { stage, makeBar, makeCoins, makeLabel } from '../scenes/stage.js';
import { makeCat, catPose, catWalk, catBreath, makeBowl, makeCatBed, makeToyBall } from '../scenes/pets.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本中の猫が消えたら？
// 数字（すべて ペットフード協会「令和7年（2025年）全国犬猫飼育実態調査」 https://petfood.or.jp/data-chart/ ）
//   猫の推計飼育頭数 8,847,225頭（約884.7万頭）・犬 6,820,317頭（約682万頭）（主要指標サマリー p.20-21, 25）
//   猫の飼育世帯率 8.42%（約12軒に1軒）。単身世帯 24,495,604世帯×6.05% ＋ 2人以上世帯 34,460,096世帯×10.11% ≒ 約497万世帯（推計・このファイルで計算）
//   猫1頭飼育者の1か月の支出総額（医療費等含む）9,998円、平均寿命 16.00歳、生涯必要経費 1,796,075円（猫 飼育・給餌実態と支出 p.78-79）
// 猫が消えたあとの生態系などの因果は確かな数字がないので扱わない。消えた猫は戻らない。

// ---------- living room ----------
const catA = makeCat({ coat: 'orange', scale: 1.15 }); catPose(catA, 'loaf'); catA.position.set(1.35, 1.05, 1.0); room.add(catA);
const catB = makeCat({ coat: 'gray', scale: 1.1 }); catPose(catB, 'sit'); catB.position.set(0.1, 0, 1.5); room.add(catB);
const bowl = makeBowl({ color: '#e2675a', food: 1 }); bowl.position.set(-1.45, 0, 2.45); room.add(bowl);
const water = makeBowl({ color: '#4fa3d1', food: 0 }); water.position.set(-1.85, 0, 2.7); room.add(water);
{ const wv = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), mat('#9fd4f5')); wv.rotation.x = -Math.PI / 2; wv.position.y = 0.06; water.add(wv); }
const bed = makeCatBed('#b9a3d6'); bed.position.set(-2.55, 0, 1.85); room.add(bed);
const ball = makeToyBall('#f2c14e'); ball.position.set(0.35, 0.05, 2.6); room.add(ball);
const roomCats = [catA, catB];
const spark = makeSparkles(260, 0.06); room.add(spark.points);
spark.init([[1.35, 1.25, 1.0], [0.1, 0.3, 1.5]], 0.45, 0.9);
function livingDay(mode = 'day') {
  setRoom({ sets: ['living'] }); props.sleeper.visible = false;
  if (mode === 'day') setLight('day', { ceil: 3, hemi: 1.15 });
  else setLight('evening', { ceil: 6, hemi: 1.2 });
  setScreen((g, w, h) => { g.fillStyle = '#26364d'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d5675'; g.fillRect(16, 110, w - 32, 30); });
}
function catsVisible(v) { roomCats.forEach(c => { c.visible = v; }); }

// ---------- map: households ----------
const CAT_RATE = 0.0842; // 猫の飼育世帯率 2025年
function houseDots(t) { // t: shot seconds
  const pop = easeOut(clamp((t - 0.6) / 1.2));   // cat homes light up orange
  const gone = clamp((t - 3.4) / 1.6);           // then turn empty gray
  setDots((i, x, z, q) => {
    if (q < CAT_RATE) {
      const k = clamp(gone * 1.4 - q * 4);
      return { color: k > 0.5 ? '#5d6675' : '#ff9a3c', s: lerp(1, 1.9, pop) * (1 - 0.35 * k), y: 0 };
    }
    return { color: '#e8edf3', s: 0.85 };
  });
}

// ---------- stage: cat vs dog bars ----------
const HK = 5.4 / 884.7; // height per 万頭
const barCat = makeBar({ color: '#ff9a3c', label: '猫（2025年）', x: -2.6, w: 2.4, d: 2.4 });
const barDog = makeBar({ color: '#4fa3d1', label: '犬（2025年）', x: 2.6, w: 2.4, d: 2.4 });
const barSpark = makeSparkles(260, 0.35); stage.add(barSpark.points);
barSpark.init([[-2.6, 2, 0], [-2.6, 4, 0], [-2.6, 6, 0], [-2.6, 7.4, 0]], 2.2, 3);
const barGroup = [barCat.g, barDog.g];
// ---------- stage: coins (1 coin = 1万円, 16 stacks = 16 years) ----------
const STACKS = 16, PER = [];
for (let i = 0; i < STACKS; i++) PER.push(i < 4 ? 12 : 11); // 合計180枚 ≒ 約180万円
const CX = i => -4.03 + (i % 8) * 1.15, CZ = i => (i < 8 ? -1.1 : 1.1);
const stacks = PER.map((n, i) => makeCoins(CX(i), CZ(i), n));
const coinLab = makeLabel('1枚＝1万円', { sx: 3.2, size: 60, color: '#ffe08a' }); coinLab.position.set(0, 3.2, 0); stage.add(coinLab);
const ageLab = makeLabel('', { sx: 3.0, size: 72 }); stage.add(ageLab);
const coinGroup = [...stacks.map(s => s.g), coinLab, ageLab];
function stageMode(m) { barGroup.forEach(g => { g.visible = m === 'bars'; }); coinGroup.forEach(g => { g.visible = m === 'coins'; }); }

const SUBS = [
  [2.6, 6.0, 'いつもの休日。<br>猫はソファでひと休み。'],
  [6.2, 10.1, '日本中の猫が、<br>一瞬で消えた。'],
  [10.1, 14, '飼われていた猫は、<br>約884万頭。'],
  [14.2, 18.1, '猫がいた家は、<br>約497万世帯（推計）。'],
  [18.1, 22, 'だいたい、<br>12軒に1軒の家。'],
  [22.2, 26.1, '実はペットの数は、<br>猫が1位だった。'],
  [26.1, 30, '猫が消えて、1位は<br>犬の682万頭に。'],
  [30.2, 34.6, 'エサの皿は、<br>手つかずのまま。'],
  [34.6, 39, '猫1頭の家の出費は、<br>月に9,998円だった。'],
  [39.2, 43.6, '猫の平均寿命は、<br>16.00歳。'],
  [43.6, 47.8, '一生でかかるお金は、<br>約180万円。'],
  [48.1, 52.6, '結果：猫884万頭が消え、<br>ペット1位は犬になった。'],
  [52.6, 55.4, '空っぽの猫ベッドが、<br>約497万世帯（推計）に。'],
  [55.6, 59.4, 'あなたは猫派？<br>それとも犬派？'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function shot0(t, T) { // hook: orange cat on the sofa back, countdown running
  livingDay(); catsVisible(true); catPose(catA, 'loaf'); catBreath(catA, T); spark.set(0);
  const u = ease(t / 2.5);
  look(lerp(2.3, 2.1, u), 1.75, lerp(4.3, 4.0, u), 1.35, 1.0, 0.9, 45);
  el.title.style.opacity = 1;
  setHud('日本中の猫が消えるまで', cd(6 - T), 1, { mono: true });
  return room;
}
function shot1(t, T) { // everyday: wide living room, two cats
  livingDay(); catsVisible(true); catPose(catA, 'loaf'); catBreath(catA, T); catPose(catB, 'sit'); catBreath(catB, T + 1); spark.set(0);
  const u = ease(t / 3.5);
  look(lerp(1.6, 1.1, u), lerp(3.15, 3.0, u), lerp(7.4, 7.0, u), 0.7, 0.3, 1.4, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('日本中の猫が消えるまで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  return room;
}
function shot2(t, T) { // +0s: cats vanish
  livingDay(); catPose(catA, 'loaf'); catPose(catB, 'sit');
  const gone = t > 0.35; catsVisible(!gone); spark.set(clamp((t - 0.3) / 1.6));
  el.flash.style.opacity = t < 0.35 ? 0 : 0.5 * clamp(1 - (t - 0.35) / 0.4);
  lift(90); const u = ease(t / 8);
  look(lerp(1.1, 0.5, u), lerp(3.0, 2.8, u), lerp(7.0, 6.4, u), 0.5, 0.3, 1.4, 50);
  hudTime('+0秒');
  setTop('日本の猫の数（2025年）', (countUp(t, 8847, 0.5) / 10).toFixed(1) + '万頭', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +1min: map of households, cat homes go dark
  setMapEnv('dusk'); houseDots(t);
  const u = ease(t / 8);
  lift(240); look(lerp(-10, -4, u), lerp(190, 170, u), lerp(70, 60, u), -6, 0, -10, 50);
  hudTime('+1分');
  setTop('猫を飼っていた世帯（2025年・推計）', '約' + countUp(t, 497) + '万世帯', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot4(t, T) { // +1day: cat bar collapses, dog becomes no.1
  lift(300); stageMode('bars');
  const k = 1 - easeOut(clamp((t - 1.0) / 1.4));
  barCat.setH(884.7 * HK * k, k > 0.01 ? (884.7 * k).toFixed(1) + '万頭' : '0頭');
  barDog.setH(682 * HK, '682万頭');
  barSpark.set(clamp((t - 1.0) / 1.8));
  const u = ease(t / 8);
  look(lerp(-1, 1, u), lerp(6.0, 5.6, u), lerp(20, 19, u), 0, 3.4, 0, 50);
  hudTime('+1日');
  if (t < 4.1) setTop('猫の飼育頭数（2025年）', (k * 884.7).toFixed(1) + '万頭', fade(t, 0.15, 4.1, 0.2), '#ffb46b');
  else setTop('犬の飼育頭数（2025年）', countUp(t - 4.1, 682, 0.1, 1.2) + '万頭', fade(t, 4.1, 8, 0.2), '#7fd4ff');
  return stage;
}
function shot5(t, T) { // +1week: untouched bowl, empty bed
  livingDay('evening'); catsVisible(false); spark.set(0);
  lift(320); const u = ease(t / 9.2);
  look(lerp(-0.6, -1.1, u), lerp(1.25, 1.1, u), lerp(4.8, 4.4, u), -1.9, 0.0, 2.1, 50);
  hudTime('+1週間');
  setTop('猫1頭の家の1か月の出費（2025年）', comma(countUp(t, 9998)) + '円', fade(t, 0.15, 9.2, 0.25));
  return room;
}
function shot6(t, T) { // +1year: lifetime cost as coin stacks (1 coin = 1万円)
  lift(330); stageMode('coins');
  const years = 16 * easeOut(clamp((t - 0.3) / 3.6));
  stacks.forEach((s, i) => { const k = clamp(years - i); s.setN(Math.round(PER[i] * k)); });
  const yr = Math.min(16, Math.floor(years + 0.001));
  ageLab.userData.set(yr + '歳'); ageLab.position.set(0, 2.75, -1.5);
  ageLab.visible = yr > 0;
  coinLab.position.set(0, 3.6, -1.5);
  const u = ease(t / 8.8);
  look(lerp(-1.0, 0, u), lerp(8.0, 8.5, u), lerp(19.5, 20.5, u), 0, 1.4, 0, 50);
  hudTime('+1年');
  if (t < 4.4) setTop('猫の平均寿命（2025年）', (countUp(t, 1600, 0.3, 3.6) / 100).toFixed(2) + '歳', fade(t, 0.15, 4.4, 0.2));
  else setTop('猫1頭の一生の出費（2025年）', comma(countUp(t - 4.4, 1796075, 0.1, 1.4)) + '円', fade(t, 4.4, 8.8, 0.2), '#ffe08a');
  return stage;
}
function shot7(t, T) { // result: the same living room, no cats
  livingDay('evening'); catsVisible(false); spark.set(0);
  lift(380); const u = ease(t / 7.5);
  look(lerp(0.0, 0.5, u), lerp(2.7, 2.9, u), lerp(6.6, 7.2, u), -1.3, 0.35, 1.7, 50);
  if (t < 4.5) setTop('消えた猫（2025年）', (countUp(t, 8847, 0.2, 1.2) / 10).toFixed(1) + '万頭', fade(t, 0.15, 4.5, 0.2));
  else setTop('猫を飼っていた世帯（推計）', '約497万世帯', fade(t, 4.5, 7.5, 0.2));
  return room;
}
function shot8(t, T) { // loop: same framing as the hook, but the sofa is empty
  livingDay(); catsVisible(false); spark.set(0);
  const u = ease(t / 4);
  look(lerp(2.4, 2.3, u), 1.75, lerp(4.45, 4.3, u), 1.35, 1.0, 0.9, 45);
  setHud('日本中の猫が消えるまで', '0:06.00', 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0021',
    title: '日本中の猫が消えたら？',
    titleHtml: '日本中の猫が<br>消えたら？',
    mood: 'emotional', seed: 21, hits: [6.3, 48.1], risers: [6.0],
    ask: 'あなたは猫派？犬派？',
    narr: { '16.00歳': '16歳', '9,998円': '9998円' },
    caption: 'もしも日本中の猫が一瞬で消えたら？\n日本で飼われている猫は約884.7万頭（2025年）。犬の682万頭より多く、ペットの数は猫が1位。猫がいた家は約497万世帯（推計）、だいたい12軒に1軒。猫1頭の家の出費は月9,998円、一生で約180万円。ペットフード協会の調査で計算してみた。\n\nあなたは猫派？犬派？ コメントで教えて。\n\n出典：一般社団法人ペットフード協会 令和7年（2025年）全国犬猫飼育実態調査',
    hashtags: ['もしもラボ', '猫', '猫のいる暮らし', 'ペット', '雑学'],
    endStats: [['日本の猫の数', '約884.7万頭', '2025年'], ['猫がいた世帯（推計）', '約497万世帯', '飼育率8.42%'], ['犬の数', '約682万頭', '2025年'], ['猫1頭の一生の出費', '約180万円', '平均寿命16.00歳']],
    sources: '出典：一般社団法人ペットフード協会<br>令和7年（2025年）全国犬猫飼育実態調査',
  },
});
