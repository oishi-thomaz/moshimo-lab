import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, comma } from '../lib.js';
import { room, setRoom, setLight, setScreen, props } from '../scenes/room.js';
import { japan, setDots, setMapEnv } from '../scenes/japan.js';
import { stage, makeBar, makeCoins, makeLabel } from '../scenes/stage.js';
import { makeCat, catPose, catWalk, catBreath, makeBowl, makeCatBed, makeToyBall } from '../scenes/pets.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本中の猫が消えたら？
// 流れ：猫が消える → 家族を失った家の数 → 消えるお金（経済） → 飼い主の財布は浮く → でも心の支えが消える → 結果（人間への影響を言い切る）
// 数字
//   ペットフード協会「令和7年（2025年）全国犬猫飼育実態調査」 https://petfood.or.jp/data-chart/
//     猫の推計飼育頭数 8,847,225頭（約884.7万頭）（主要指標サマリー p.20-21, 25）
//     猫の飼育世帯率 8.42%（約12軒に1軒）。単身世帯 24,495,604世帯×6.05% ＋ 2人以上世帯 34,460,096世帯×10.11% ≒ 約497万世帯（推計・このファイルで計算）
//     猫1頭飼育者の1か月の支出総額（医療費等含む）9,998円（猫 飼育・給餌実態と支出 p.78-79）
//     ペット飼育の効用 Q35（猫飼育者 n=967）：毎日の生活が楽しくなった 42.1%／心穏やかに過ごせる日が増えた 40.1%／寂しさを感じることが減った 27.0%（ペットの飼育効用 p.112）
//   宮本勝浩 関西大学名誉教授の推定「2026年のネコノミクス（ネコの経済効果）」約2兆9,488億円（2026年2月発表）。1日あたり 29,488÷365 ≒ 約81億円（このファイルで計算）
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

// ---------- stage: coins (1 coin = 100億円, 295枚 ≒ 2兆9,488億円) ----------
const STACKS = 16, PER = [];
for (let i = 0; i < STACKS; i++) PER.push(i < 7 ? 19 : 18); // 7×19 + 9×18 = 295枚
const CX = i => -4.03 + (i % 8) * 1.15, CZ = i => (i < 8 ? -1.1 : 1.1);
const stacks = PER.map((n, i) => makeCoins(CX(i), CZ(i), n));
const coinLab = makeLabel('1枚＝100億円', { sx: 3.2, size: 60, color: '#ffe08a' }); coinLab.position.set(0, 4.3, -1.5); stage.add(coinLab);
const coinSpark = makeSparkles(260, 0.3); stage.add(coinSpark.points);
coinSpark.init([[-2.3, 1.4, 0], [2.3, 1.4, 0], [0, 2.2, 0], [-3.5, 0.8, 0], [3.5, 0.8, 0]], 2.4, 2.4);
const coinGroup = [...stacks.map(s => s.g), coinLab, coinSpark.points];
// ---------- stage: what cats gave their owners (Q35, 猫飼育者) ----------
const HK = 5.4 / 42.1; // height per %
const FEEL = [['毎日が楽しく', 42.1, '#ff9a3c'], ['心おだやかに', 40.1, '#ffc46b'], ['寂しさが減った', 27.0, '#ff8a7a']];
const feelBars = FEEL.map(([label, , color], i) => makeBar({ color, label, x: -3.4 + i * 3.4, w: 2.2, d: 2.2 }));
const feelSpark = makeSparkles(260, 0.35); stage.add(feelSpark.points);
feelSpark.init([[-3.4, 2.5, 0], [0, 2.5, 0], [3.4, 2, 0], [-3.4, 4.5, 0], [0, 4.5, 0]], 2.0, 3);
const feelGroup = [...feelBars.map(b => b.g), feelSpark.points];
function stageMode(m) { coinGroup.forEach(g => { g.visible = m === 'coins'; }); feelGroup.forEach(g => { g.visible = m === 'feel'; }); }
const OKU = 29488; // 億円
const yen = v => { v = Math.round(v); return v >= 10000 ? `${Math.floor(v / 10000)}兆${comma(v % 10000)}億円` : `${comma(v)}億円`; };

const SUBS = [
  [2.6, 6.0, 'いつもの休日。<br>猫はソファでひと休み。'],
  [6.2, 10.1, '日本中の猫が、<br>一瞬で消えた。'],
  [10.1, 14, '家族だった猫、<br>約884万頭。'],
  [14.2, 18.1, '猫がいた家は、<br>約497万世帯（推計）。'],
  [18.1, 22, '12軒に1軒の家から、<br>家族がいなくなった。'],
  [22.2, 26.1, '猫が動かしていたお金は、<br>年に約2兆9,488億円。'],
  [26.1, 30, 'エサ、病院、グッズ、旅行。<br>1日約81億円が消える。'],
  [30.2, 34.6, '飼い主の出費は、<br>月9,998円浮く。'],
  [34.6, 39, 'でも、そのお金では<br>買えないものがあった。'],
  [39.2, 43.6, '猫の飼い主の42.1%が、<br>毎日が楽しくなったと回答。'],
  [43.6, 47.8, '27.0%は、寂しさが<br>減ったと答えていた。'],
  [48.1, 54.2, '結果：年約2.9兆円が消え、<br>497万世帯が家族を失った。'],
  [54.3, 56.2, '困るのは、<br>残された人間だった。'],
  [56.3, 59.4, 'あなたは猫に<br>救われたこと、ある？'],
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
function shot4(t, T) { // +1day: the money cats moved — 295 coins appear, then vanish
  lift(330); stageMode('coins');
  const up = easeOut(clamp((t - 0.2) / 2.4));
  const down = clamp((t - 4.2) / 2.2);
  stacks.forEach((s, i) => { const n = PER[i]; const k = Math.round(n * up) - Math.round(n * clamp(down * 1.25 - (i % 8) * 0.03)); s.setN(Math.max(0, k)); });
  coinSpark.set(clamp((t - 4.2) / 2.6));
  coinLab.visible = down < 0.6;
  const u = ease(t / 8);
  look(lerp(-1.0, 0, u), lerp(8.0, 8.6, u), lerp(19.5, 20.5, u), 0, 1.6, 0, 50);
  hudTime('+1日');
  if (t < 4.1) setTop('猫が動かすお金（年間・推計）', '約' + yen(countUp(t, OKU, 0.2, 2.4)), fade(t, 0.15, 4.1, 0.2), '#ffe08a');
  else setTop('1日あたり（推計）', '約' + countUp(t - 4.1, 81, 0.1, 1.0) + '億円', fade(t, 4.1, 8, 0.2), '#ffb46b');
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
function shot6(t, T) { // +1month: what cats gave their owners — bars rise, then drop away
  lift(330); stageMode('feel');
  const drop = easeOut(clamp((t - 7.0) / 1.2));
  FEEL.forEach(([, v], i) => {
    const k = easeOut(clamp((t - 0.3 - i * 0.35) / 1.4)) * (1 - drop);
    feelBars[i].setH(v * HK * k, k > 0.02 && drop < 0.05 ? (v * Math.min(1, k)).toFixed(1) + '%' : '');
    feelBars[i].label.visible = drop < 0.4;
  });
  feelSpark.set(clamp((t - 7.0) / 1.6));
  const u = ease(t / 8.8);
  look(lerp(-0.8, 0.8, u), lerp(6.2, 5.8, u), lerp(23, 22, u), 0, 3.0, 0, 50);
  hudTime('+1か月');
  if (t < 4.4) setTop('毎日の生活が楽しくなった（猫の飼い主）', (countUp(t, 421, 0.3, 1.4) / 10).toFixed(1) + '%', fade(t, 0.15, 4.4, 0.2), '#ffb46b');
  else setTop('寂しさを感じることが減った（猫の飼い主）', (countUp(t - 4.4, 270, 0.1, 1.2) / 10).toFixed(1) + '%', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return stage;
}
function shot7(t, T) { // result: the same living room, no cats
  livingDay('evening'); catsVisible(false); spark.set(0);
  lift(380); const u = ease(t / 7.5);
  look(lerp(0.0, 0.5, u), lerp(2.7, 2.9, u), lerp(6.6, 7.2, u), -1.3, 0.35, 1.7, 50);
  if (t < 6.2) setTop('消える経済効果（年間・推計）', '約' + yen(countUp(t, OKU, 0.2, 1.2)), fade(t, 0.15, 6.2, 0.2), '#ffe08a');
  else setTop('家族を失った世帯（推計）', '約497万世帯', fade(t, 6.2, 7.5, 0.2), '#ff9a3c');
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
    mood: 'emotional', seed: 21, hits: [6.3, 48.1], risers: [6.0, 46.0],
    impacts: [10.1, 22.2, 39.2, 48.1],
    ask: 'あなたは猫に救われたこと、ある？',
    narr: { '9,998円': '9998円', '2兆9,488億円': '2兆9488億円', '2.9兆円': '2.9兆円', '42.1%': '42.1パーセント', '27.0%': '27パーセント' },
    caption: 'もしも日本中の猫が一瞬で消えたら？\n\n消える猫は約884.7万頭（2025年）。猫がいた家は約497万世帯（推計）、だいたい12軒に1軒の家から家族がいなくなる。\n\n猫が動かしていたお金（ネコノミクス）は年に約2兆9,488億円（推計）。エサ、病院、グッズ、猫目当ての旅行。1日あたり約81億円の売上が消える。\n\n飼い主の出費は月9,998円浮く。でも猫の飼い主の42.1%は「毎日の生活が楽しくなった」、27.0%は「寂しさを感じることが減った」と答えていた。\n\n結果：年約2.9兆円が消え、497万世帯が家族を失う。困るのは猫じゃなく、残された人間だった。\n\nあなたは猫に救われたこと、ある？ コメントで教えて。\n\n出典：一般社団法人ペットフード協会 令和7年（2025年）全国犬猫飼育実態調査、宮本勝浩 関西大学名誉教授「2026年のネコノミクス」推定（2026年2月）',
    hashtags: ['もしもラボ', '猫', '猫のいる暮らし', 'ネコノミクス', '雑学'],
    endStats: [['消えた猫', '約884.7万頭', '2025年'], ['家族を失った世帯（推計）', '約497万世帯', '約12軒に1軒'], ['消える経済効果（推計）', '年約2兆9,488億円', '1日約81億円'], ['毎日が楽しくなった', '42.1%', '猫の飼い主の回答']],
    sources: '出典：ペットフード協会 2025年全国犬猫飼育実態調査、<br>宮本勝浩 関西大学名誉教授「2026年のネコノミクス」推定',
  },
});
