import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade } from '../lib.js';
import { makeRiceBowl, makeOil, makeBread, makeSugar, makeSoy, fLineup, FSLOTS, setFoods, setFSlot, fLineupIdle } from '../scenes/foodlineup.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも1つ消えたら、日本人が一番困る食べ物はどれ？（blueprint no 722・ヤバい順シリーズ・v2）
// 順位の決め方：日本人1人1日あたりの供給熱量（その食べ物から毎日とっているカロリー）が大きい順。
// 数字：農林水産省「令和7年度食料自給率について」（食料需給表 令和7年度概算）https://www.maff.go.jp/j/zyukyu/zikyu_ritu/attach/pdf/012-20.pdf
//   1人1日あたり供給熱量（国産分）／品目別自給率（カロリーベース）
//   米 488kcal（470）96%／油脂類 312kcal（12）4%／小麦 310kcal（50）16%／砂糖類 178kcal（58）33%／大豆 80kcal（20）25%
//   合計 2,237kcal → 米の割合 488÷2,237＝21.8%（約2割・計算）、米÷油脂 488÷312＝約1.6倍（計算）、油脂−小麦＝2kcal
//   ※候補5つは、品目ごとの熱量が出ている品目から「食べ物そのもの」を選んだ（いも類・でん粉・野菜・果実・魚介類・畜産物などは候補外）

const GOLD = '#ffd27a', RED = '#ff7a6b', GREEN = '#9fd18a';
// slot: 0 油 / 1 大豆 / 2 米 / 3 砂糖 / 4 小麦
setFoods([makeOil, makeSoy, makeRiceBowl, makeSugar, makeBread], ['？', '？', '？', '？', '？'], [1.3, 1.35, 1.4, 1.35, 1.1]);
const KCAL = [312, 80, 488, 178, 310];
const NAME = ['油', '大豆', '米', '砂糖', '小麦'];
const RANK = [1, 3, 4, 0, 2]; // 5位から順に見せる slot
const RNUM = {}; RANK.forEach((s, i) => { RNUM[s] = 5 - i; });
const SX = [-2.2, -1.1, 0, 1.1, 2.2];
const sp0 = makeSparkles(160, 0.09), sp1 = makeSparkles(160, 0.09), sp2 = makeSparkles(160, 0.09);
for (const s of [sp0, sp1, sp2]) fLineup.add(s.points);
sp0.init([[SX[1], 0.7, 0]], 0.5, 1.4); sp1.init([[SX[2], 1.2, 0]], 0.6, 1.6); sp2.init([[SX[2], 0.8, 0]], 0.6, 1.5);
const spark = { set(u) { sp0.set(0); sp1.set(0); sp2.set(0); } };

function slots(revealed, T, focus = -1, opt = {}) { // revealed: 何個めくったか
  fLineupIdle(T);
  FSLOTS.forEach((s, i) => {
    const k = RANK.indexOf(i), rev = k >= 0 && k < revealed;
    const grow = rev ? (k === revealed - 1 && opt.growT != null ? ease(clamp(opt.growT / 1.4)) : 1) : 0;
    const show = opt.hide && opt.hide[i] != null ? opt.hide[i] : 1;
    setFSlot(i, { show, meter: KCAL[i] / 500 * grow, word: rev && grow > 0.95 ? KCAL[i] + 'kcal' : '', glow: i === focus ? 1 : 0, t: T, label: rev ? `${RNUM[i]}位 ${NAME[i]}` : '？' });
    s.lab.visible = !opt.solo; s.word.visible = s.word.visible && !(opt.solo && i !== focus);
  });
}
function wideCam(t, d, z0 = 11.6, z1 = 11.2) { const u = ease(clamp(t / d)); look(lerp(-0.3, 0.3, u), 2.4, lerp(z0, z1, u), 0, 1.25, 0, 50); }
function hookCam(t) { const u = ease(clamp(t / 2.6)); look(lerp(4.9, 4.6, u), lerp(2.5, 2.6, u), lerp(6.6, 7.1, u), -0.15, 0.9, -0.4, 50); }
function focusCam(i, t, d) { const x = SX[i], u = ease(clamp(t / d)); look(x + lerp(0.8, 0.4, u), 2.0, lerp(4.9, 4.4, u), x, 1.5, -0.3, 50); }

const SUBS = [
  [2.6, 6.1, '2位と3位の差は、<br>たったの2kcal。'],
  [6.2, 10.1, '5位は大豆。<br>1日80kcal。'],
  [10.2, 14.1, 'しかも国産は、<br>そのうち25%だけ。'],
  [14.2, 18.1, '4位は砂糖。<br>1日178kcal。'],
  [18.2, 22.1, 'でも本当にヤバいのは、<br>ここから。'],
  [22.2, 26.1, '3位は小麦。パンも麺も<br>合わせて1日310kcal。'],
  [26.2, 30.1, '国産は、<br>たった16%。'],
  [30.2, 34.1, '2位は、まさかの油。<br>1日312kcal。'],
  [34.2, 38.1, '小麦との差は、<br>たった2kcal。'],
  [38.2, 42.6, '国産の油は、<br>わずか4%。'],
  [42.7, 47.8, '1位は米。1日488kcal。<br>2位の約1.6倍。'],
  [48.1, 53.8, '結果：一番困るのは米。<br>毎日のカロリーの約2割が消える。'],
  [53.9, 56.1, 'でも米は96%が国産。'],
  [56.2, 59.4, '次にランキングして<br>ほしいものは？'],
];

const TP = 0.5;
function shot0(t, T) { // 0秒＝サムネ：5つの食べ物と「？」。0.5秒で1つが消える
  lift(330);
  const k = t - TP; const hide = { 1: k > 0 ? Math.max(0, 1 - k / 0.18) : 1 };
  spark.set(0); sp0.set(k > 0 ? k / 1.4 : 0);
  slots(0, T, -1, { hide, solo: true }); lift(200);
  el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.3) : 0;
  hookCam(t);
  setHud('1つ消えたら', '一番困るのは？', 1, { color: k > 0 ? '#ff8a7a' : '#fff' });
  return fLineup;
}
function shot1(t, T) { // 残り4つ、空いた台座
  lift(330); spark.set(0); slots(0, T, -1, { hide: { 1: 0 } }); wideCam(t + 2.6, 6.2);
  setHud('ランキング', '1日のカロリー順', 1, { color: GOLD });
  return fLineup;
}
const TOPS = [
  (t) => t < 4 ? setTop('大豆 1人1日あたり（2025年度）', countUp(t, 80) + 'kcal', fade(t, 0.15, 3.9, 0.25), GREEN) : setTop('大豆の国産の割合（カロリー）', '25%', fade(t, 4.0, 8, 0.25), RED),
  (t) => t < 4 ? setTop('砂糖 1人1日あたり（2025年度）', countUp(t, 178) + 'kcal', fade(t, 0.15, 3.9, 0.25), GOLD) : setTop('本当にヤバいのは', '上位3つ', fade(t, 4.0, 8, 0.25), RED),
  (t) => t < 4 ? setTop('小麦 1人1日あたり（2025年度）', countUp(t, 310) + 'kcal', fade(t, 0.15, 3.9, 0.25), GOLD) : setTop('小麦の国産の割合（カロリー）', '16%', fade(t, 4.0, 8, 0.25), RED),
  (t) => t < 4 ? setTop('油 1人1日あたり（2025年度）', countUp(t, 312) + 'kcal', fade(t, 0.15, 3.9, 0.25), RED) : t < 8 ? setTop('油と小麦の差', '2kcal', fade(t, 4.0, 7.9, 0.25), RED) : setTop('油の国産の割合（カロリー）', '4%', fade(t, 8.0, 12.4, 0.25), RED),
  (t) => t < 2.6 ? setTop('米 1人1日あたり（2025年度）', countUp(t, 488) + 'kcal', fade(t, 0.15, 2.5, 0.25), RED) : setTop('2位の油と比べて', '約1.6倍', fade(t, 2.6, 5.3, 0.25), RED),
];
function rankShot(n) { // n: 0=5位 … 4=1位
  return function (t, T) {
    lift(n < 4 ? 520 : 330); const s = RANK[n];
    spark.set(0); if (n === 4) sp1.set(clamp(t / 2));
    slots(n + 1, T, s, { growT: t - 0.2, solo: n < 4 });
    if (n === 4) wideCam(t, 5.3, 11.4, 11.0); else focusCam(s, t, n === 3 ? 12.4 : 8);
    setHud('ランキング', `${5 - n}位`, 1, { color: n === 4 ? RED : GOLD });
    TOPS[n](t);
    return fLineup;
  };
}
function shot7(t, T) { // 結果：米が消える
  lift(330);
  const k = t - 1.0; spark.set(0); sp2.set(k > 0 ? k / 1.5 : 0);
  slots(5, T, 2, { hide: { 2: k > 0 ? Math.max(0, 1 - k / 0.25) : 1 } });
  wideCam(t, 7.5, 11.2, 11.8);
  setHud('1位', '米', 1, { color: RED });
  if (t < 3.8) setTop('毎日のカロリーのうち米（2025年度）', '約2割（21.8%）', fade(t, 0.15, 3.8, 0.25), RED);
  else setTop('米の国産の割合（カロリー）', '96%', fade(t, 3.8, 7.5, 0.25), GREEN);
  return fLineup;
}
function shot8(t, T) { // ループ：冒頭と同じ「？」の5つ
  lift(200); spark.set(0); slots(0, T, -1, { solo: true }); hookCam(0);
  setHud('1つ消えたら', '一番困るのは？', 1);
  return fLineup;
}

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 6.2, f: shot1 }, { a: 6.2, b: 14.2, f: rankShot(0) }, { a: 14.2, b: 22.2, f: rankShot(1) },
  { a: 22.2, b: 30.2, f: rankShot(2) }, { a: 30.2, b: 42.7, f: rankShot(3) }, { a: 42.7, b: 48.0, f: rankShot(4) }, { a: 48.0, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.6, f: shot8 }, { a: 59.6, b: 64.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.6, camera: cam,
  meta: {
    id: '0722',
    v2: true,
    hookLine: '1つ消えたら、一番困る食べ物は？',
    series: 'ヤバい順',
    hookType: 'H5',
    cat: '身近なもの・インフラ',
    title: '1つ消えたら一番困る食べ物は？',
    titleHtml: '1つ消えたら一番<br>困る食べ物は？',
    mood: 'mystery', seed: 722, hits: [0.5, 6.2, 14.2, 22.2, 30.2, 42.7, 48.1], risers: [38.2], impacts: [8.0, 23.6, 34.4, 43.6],
    sfx: [[0.5, 'poof'], [49.0, 'poof']],
    narr: { '80kcal': 'はちじゅっキロカロリー', '178kcal': 'ひゃくななじゅうはちキロカロリー', '310kcal': 'さんびゃくじゅっキロカロリー', '312kcal': 'さんびゃくじゅうにキロカロリー', '488kcal': 'よんひゃくはちじゅうはちキロカロリー', '2kcal': 'にキロカロリー', '約1.6倍': 'やく1.6ばい', '25%': '25パーセント', '16%': '16パーセント', '4%': '4パーセント', '96%': '96パーセント', '約2割': 'やくにわり' },
    ask: '次にランキングしてほしいものは？',
    caption: 'もしも食べ物が1つ消えたら、日本人が一番困るのはどれ？ 1人が毎日その食べ物からとっているカロリーでランキング（2025年度）。\n5位 大豆：1日80kcal。国産はそのうち25%。\n4位 砂糖：1日178kcal。\n3位 小麦：パンも麺も合わせて1日310kcal。国産はたった16%。\n2位 油：1日312kcal。小麦との差はたった2kcal。国産の油はわずか4%。\n1位 米：1日488kcal。2位の約1.6倍。\n結果、一番困るのは米。毎日のカロリーの約2割（21.8%）が消える。でも米は96%が国産。\n\n次にランキングしてほしいものは？ コメントで教えて。\n\n※1人1日あたり供給熱量（令和7年度概算）。国産の割合はカロリーベースの品目別自給率。候補は品目別の熱量が出ている食べ物から5つ\n出典：農林水産省「令和7年度食料自給率について」（食料需給表）',
    hashtags: ['もしもラボ', 'ランキング', '食料自給率', 'お米', '雑学'],
    endStats: [['1位 米', '488kcal', '国産96%'], ['2位 油', '312kcal', '国産4%'], ['3位 小麦', '310kcal', '国産16%'], ['4位 砂糖', '178kcal', '国産33%'], ['5位 大豆', '80kcal', '国産25%']],
    sources: '出典：農林水産省「令和7年度食料自給率について」<br>（1人1日あたり供給熱量・2025年度概算）',
  },
});
