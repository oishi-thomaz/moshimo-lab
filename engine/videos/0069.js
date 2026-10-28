import * as THREE from 'three';
import { clamp, lerp, ease, fade, comma } from '../lib.js';
import { beach, setBeachEnv, setSea, floorY, makeSwimmers, makeFarCrowd, makeGauge, PARASOLS } from '../scenes/beach.js';
import { space, earth, faceLon, setEarthNight } from '../scenes/earth.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも全人類が同時に海に入ったら？（blueprint no 69・日本人全員でシリーズ）
// 数字：
//  世界の人口 約82億人（2024年半ば、国連 World Population Prospects 2024／UN News 2024-07-11 https://news.un.org/en/story/2024/07/1151971）
//  大人の平均体重 62kg（2005年、Walpole ほか BMC Public Health 12:439, 2012／LSHTM 発表
//    https://www.lshtm.ac.uk/newsevents/news/2012/tacking_population_weight_crucial_for_food%20security.html）
//  → 全員が大人の平均体重として 82億×62kg＝約5.1億トン（単純計算）。体は水と同じ重さとして体積 約5.1億m³（単純計算）
//  東京ドームの容積 約124万m³（東京ドームシティ公式 https://www.tokyo-dome.co.jp/dome/about/）→ 約410杯分（単純計算）
//  海洋の面積 約3億6千万km²（環境省 海洋保全 https://www.env.go.jp/nature/biodic/kaiyo-hozen/guideline/02.html）
//  → 海面の上昇 5.1億m³÷3.6億km²＝約0.0014mm（単純計算）
//  世界の海面は1993年から約10cm上昇。氷床・氷河の融解と海水の熱膨張による（NASA 2025年3月13日
//    https://www.nasa.gov/missions/jason-cs-sentinel-6/sentinel-6-michael-freilich/nasa-analysis-shows-unexpected-amount-of-sea-level-rise-in-2024/）
//  → 10cm÷0.0014mm＝約7万倍（単純計算）
//  日本の砂浜は今世紀末（2081〜2100年）に RCP2.6 で62%、RCP4.5 で71%消失の予測
//    （国立環境研究所 気候変動適応センター「海岸侵食」インフォグラフィック、Udo & Takeda 2017
//    https://adaptation-platform.nies.go.jp/local/infographic/pdf/4_coasterosion.pdf）

const swim = makeSwimmers(44, 3, { x0: -9, x1: 9, z0: 3, z1: 12 });
const far = makeFarCrowd(2600, 5, { x0: -160, x1: 160, z0: 2, z1: 14 });
const gauge = makeGauge(); gauge.position.set(2.5, 0, -6); beach.add(gauge);
const jpMark = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd34d }));

const SUBS = [
  [2.6, 6.0, 'いつもの夏の海。<br>全人類が浜で待機中。'],
  [6.2, 10.1, '海はどこまで上がる？<br>でも本当の敵は別にいた。'],
  [10.1, 14, '全員が大人の平均体重<br>62kgだとすると…'],
  [14.2, 18.1, '重さは、<br>約5億1,000万トン。'],
  [18.1, 22, '体の体積は、東京ドーム<br>約410杯分。'],
  [22.2, 26.1, 'それが全部、<br>海に沈んだ。'],
  [26.1, 30, 'でも海の広さは、<br>3億6,000万km²。'],
  [30.2, 34.6, '海面が上がったのは、<br>わずか0.0014mm。'],
  [34.6, 39, '目では、まったく<br>わからない高さ。'],
  [39.2, 43.6, 'ところが海は、1993年から<br>もう10cm上がっている。'],
  [43.6, 47.8, '氷がとけて、温まった<br>海水がふくらんだから。'],
  [48.1, 53.8, '結果：人類より温暖化。<br>今世紀末、砂浜の6割が消える。'],
  [53.9, 56.1, '人類の体は、海の一滴。'],
  [56.2, 59.4, '次に全人類で<br>やってほしいことは？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
function shore(t, k = 0, o = {}) { setBeachEnv(o.env || 'day'); setSea(t, { level: o.level || 0, amp: o.amp ?? 0.18 }); swim.set(k, t, { look: true }); far.set(k, t); gauge.visible = !!o.gauge; PARASOLS.forEach(p => p.g.visible = o.para !== false); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(-1, 0, u), lerp(7.5, 7, u), lerp(26, 24, u), 0, 0.8, -12, 50); }
const TP = 0.5; // v2：0.5秒で全員が走り出す（冒頭で待たせない）
function shot0(t) { // hook: crowd on the sand, countdown hits 0 at 0.5s and everyone runs in
  shore(t, clamp((t - TP) / 4.5));
  hookCam(t);
  setHud('全人類が海に入るまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return beach;
}
function shot1(t) { // everyday: crowd waiting on the sand
  lift(120);
  shore(t + 2.5, 0);
  const u = ease(t / 3.5);
  look(lerp(9, 7, u), lerp(4.2, 3.8, u), lerp(22, 20.5, u), -1, 1.2, 4, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('全人類が海に入るまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return beach;
}
function shot2(t) { // +0秒: everyone runs into the sea
  lift(160);
  const k = clamp((t + 2.0) / 4.5); // v2：冒頭（0.5秒〜）で走り出した続き
  shore(t + 6, k);
  const u = ease(t / 8);
  look(lerp(4, 2, u), lerp(3, 7, u), lerp(16, 18, u), 0, lerp(1.2, 0, u), lerp(4, -4, u), 50);
  hudTime('+0秒');
  if (t < 4.1) setTop('世界の人口（2024年）', '約' + countUp(t, 82, 0.2, 1.2) + '億人', fade(t, 0.15, 4.1, 0.2));
  else setTop('大人の平均体重（2005年・世界）', countUp(t - 4.1, 62, 0.05, 1.0) + 'kg', fade(t, 4.1, 8, 0.2));
  return beach;
}
function shot3(t) { // +1秒: aerial, the sea filled with people
  shore(t + 14, 1);
  const u = ease(t / 8);
  look(lerp(-10, 10, u), lerp(42, 52, u), lerp(30, 34, u), 0, 0, -10, 50);
  hudTime('+1秒');
  if (t < 4.1) setTop('全員の重さ（単純計算）', '約' + (countUp(t, 51, 0.2, 1.3) / 10).toFixed(1) + '億トン', fade(t, 0.15, 4.1, 0.2));
  else setTop('全員の体積（単純計算）', '東京ドーム約' + countUp(t - 4.1, 410, 0.05, 1.3) + '杯分', fade(t, 4.1, 8, 0.2));
  return beach;
}
function shot4(t) { // +1分: globe, oceans
  if (!jpMark.parent) earth.add(jpMark);
  setEarthNight(0); earth.rotation.y = faceLon(-160) + 0.2 - t * 0.04;
  jpMark.visible = false;
  const u = ease(t / 8);
  look(0, lerp(4, 7, u), lerp(44, 50, u), 0, 2.5, 0, 45);
  hudTime('+1分');
  if (t < 4.1) setTop('全員の重さ（単純計算）', '約5.1億トン', fade(t, 0.15, 4.1, 0.2));
  else setTop('世界の海の面積', (countUp(t - 4.1, 36, 0.05, 1.3) / 10).toFixed(1) + '億km²', fade(t, 4.1, 8, 0.2), '#7fd4ff');
  return space;
}
function gaugeCam(t, d, y0, y1) { const u = ease(t / d); look(2.5 + lerp(-2.2, -1.8, u), lerp(y0, y1, u) + 0.6, -6 + lerp(4.6, 3.8, u), 2.5, lerp(y0, y1, u) + 0.25, -6, 45); }
function shot5(t) { // +10分: tide gauge, sea level barely moves
  lift(200);
  shore(t + 30, 1, { gauge: true, amp: 0.02 });
  gauge.userData.setMark(0.02);
  gaugeCam(t, 9.2, 0.1, 0.05);
  hudTime('+10分');
  setTop('上がった海面（単純計算）', (countUp(t, 14, 0.2, 1.4) / 10000).toFixed(4) + 'mm', fade(t, 0.15, 9.2, 0.25), '#7fd4ff');
  return beach;
}
function shot6(t) { // 1993→2025: real sea level rise 10cm on the gauge
  lift(200);
  const k = clamp((t - 0.5) / 3.5);
  shore(t + 40, 1, { gauge: true, level: k * 0.1, amp: 0.02 });
  gauge.userData.setMark(0.02 + k * 0.1);
  gaugeCam(t, 8.8, 0.05, 0.12);
  setHud('世界の海面', (1993 + Math.round(k * 32)) + '年', 1);
  if (t < 4.4) setTop('世界の海面の上昇（1993〜2025年）', '+' + countUp(t, 10, 0.5, 3.4) + 'cm', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('全人類が飛び込んだ分の（単純計算）', '約' + countUp(t - 4.4, 7, 0.05, 1.0) + '万倍', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return beach;
}
function shot7(t) { // result: the beach shrinks, parasols swallowed
  lift(120);
  const lv = lerp(0, 1.0, ease(clamp(t / 6)));
  shore(t + 50, -1, { level: lv, env: 'dusk' });
  PARASOLS.forEach(p => p.g.visible = floorY(p.z) + 1.6 > lv);
  const u = ease(t / 7.5);
  look(lerp(-4, -8, u), lerp(9, 12, u), lerp(34, 40, u), 0, 0.5, 2, 50);
  setTop('日本の砂浜（今世紀末の予測・RCP2.6）', countUp(t, 62, 0.2, 1.4) + '%が消える', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return beach;
}
function shot8(t) { // loop: crowd on the sand again, countdown
  shore(t + 60, 0);
  hookCam(t + 0.3, 4.5);
  setHud('全人類が海に入るまで', cd(TP), 1, { mono: true });
  return beach;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65,
  cut: [[2.5, 6.0]], // v2：浜で待つ いつもの夏（元の2.5〜6秒）を抜いて、走り出した直後から本題へ
  meta: {
    id: '0069',
    v2: true,
    hookLine: '全人類が、一斉に海へ飛び込んだ。',
    series: '日本人全員で',
    hookType: 'H1',
    cat: '全員が同時に・極端な数字',
    title: '全人類が同時に海に入ったら？',
    titleHtml: '全人類が同時に<br>海に入ったら？',
    mood: 'mystery', seed: 69, hits: [0.5, 48.1], risers: [2.5], impacts: [30.4, 43.8],
    sfx: [[0.5, 'whoosh'], [8.0, 'bubble'], [39.6, 'meter', 0.6]],
    narr: { '82億人': 'はちじゅうにおくにん', '62kg': '62キロ', '0.0014mm': 'れいてんれいれいいちよんミリ', '3億6,000万km²': '3億6000万平方キロメートル', '10cm': '10センチ', '5億1,000万トン': '5億1000万トン', '410杯分': '410ぱいぶん' },
    ask: '次に全人類でやってほしいことは？',
    caption: 'もしも全人類82億人が同時に海に飛び込んだら、海面はどれだけ上がる？\n全員が大人の平均体重62kgだとすると、重さは約5.1億トン。体を水と同じ重さとすると体積は東京ドーム約410杯分（単純計算）。\nでも海の広さは3億6,000万km²。上がる海面は、わずか0.0014mm（単純計算）。\nところが実際の海面は、氷がとけて温まった海水がふくらみ、1993年から約10cmも上がっている。全人類が飛び込んだ分の約7万倍。\n日本の砂浜は、今世紀末に6割以上が消えると予測されている。\n\n次に全人類でやってほしいことは？ コメントで教えて。\n\n出典：国連 World Population Prospects 2024、Walpole ほか BMC Public Health（2012年）、東京ドームシティ、環境省、NASA（2025年）、国立環境研究所 気候変動適応センター（Udo & Takeda 2017）',
    hashtags: ['もしもラボ', '全人類', '海面上昇', '雑学', 'もしも'],
    endStats: [['世界の人口', '約82億人', '2024年'], ['全員の重さ（単純計算）', '約5.1億トン', '大人62kgで'], ['上がる海面（単純計算）', '約0.0014mm', ''], ['実際の海面上昇', '約10cm', '1993〜2025年'], ['日本の砂浜の消失', '62%', '今世紀末の予測']],
    sources: '出典：国連（2024年）、BMC Public Health（2012年）、東京ドーム、<br>環境省、NASA（2025年）、国立環境研究所（2023年）',
  },
});
