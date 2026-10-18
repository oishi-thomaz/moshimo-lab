import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, comma } from '../lib.js';
import { field, setFieldEnv, makeBug, setFlowers, setFruit, setBlossom } from '../scenes/field.js';
import { market, shelfItems, queues } from '../market.js';
import { stage, makeBar } from '../scenes/stage.js';
import { look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしもミツバチが地球から消えたら？
// 数字：日本の蜂群数 23万6千群・飼育戸数12,061戸（農林水産省 養蜂をめぐる情勢 令和7年3月、令和6年）
//       施設いちご 3,283haのうち2,741ha（約8割）でミツバチを利用（同資料）
//       世界の主な食料作物の4分の3以上が動物の受粉に頼る・受粉に頼る作物は世界の生産量の35%（IPBES 2016）
//       日本の送粉サービス 約4,700億円・うちセイヨウミツバチ 約1,000億円・野生の送粉者 約3,300億円（農業環境技術研究所 2013年時点）

const bees = [];
{ const r = rng(5); for (let i = 0; i < 34; i++) { const b = makeBug('bee'); b.scale.setScalar(0.9); field.add(b); bees.push({ b, cx: -6 + r() * 12, cz: -3 + r() * 6, rr: 0.4 + r() * 1.4, h: 0.6 + r() * 0.9, s: 0.8 + r() * 1.4, ph: r() * 6 }); } }
const berryBees = [];
{ const r = rng(9); for (let i = 0; i < 14; i++) { const b = makeBug('bee'); b.scale.setScalar(0.9); field.add(b); berryBees.push({ b, cx: 5 + r() * 8, cz: 1 + r() * 6.5, rr: 0.3 + r() * 0.8, h: 0.6 + r() * 0.4, s: 1 + r(), ph: r() * 6 }); } }
const spark = makeSparkles(400, 0.12); field.add(spark.points);
spark.init(bees.concat(berryBees).map(x => [x.cx, x.h, x.cz]), 1.6, 1.5);
function beesAt(t, on) {
  for (const x of bees.concat(berryBees)) {
    x.b.visible = on; if (!on) continue;
    const a = x.ph + t * x.s;
    x.b.position.set(x.cx + Math.cos(a) * x.rr, x.h + Math.sin(t * 3 + x.ph) * 0.15, x.cz + Math.sin(a) * x.rr);
    x.b.rotation.y = -a - Math.PI / 2; x.b.userData.flap(t + x.ph);
  }
}
const bars = [makeBar({ color: '#7cc08a', label: '受粉の働き全体', x: -2.2, nameTop: true, headerY: 5.3 }), makeBar({ color: '#f2b632', label: 'ミツバチの分', x: 2.2, nameTop: true, headerY: 5.3 })];

const SUBS = [
  [2.6, 6.0, '花から花へ。<br>いつもの春の畑。'],
  [6.2, 10.1, '日本で飼われている<br>ミツバチ23万6千群が消えた。'],
  [10.1, 14, '花粉を運ぶ者が、<br>いなくなった。'],
  [14.2, 18.1, '+1か月。いちごが<br>実をつけない。'],
  [18.1, 22, 'ハウスのいちごの約8割は、<br>ミツバチが受粉させていた。'],
  [22.2, 26.1, '+半年。果物が<br>実らなくなっていく。'],
  [26.1, 30, '主な作物の4分の3以上が、<br>ハチなどの受粉に頼る。'],
  [30.2, 34.6, '+1年。スーパーから<br>果物と野菜が減る。'],
  [34.6, 39, '受粉に頼る作物は、<br>世界の生産量の35%。'],
  [39.2, 43.6, '日本の畑で、受粉の働きは<br>年約4,700億円分。'],
  [43.6, 47.8, 'そのうち、ミツバチの分が<br>約1,000億円。'],
  [48.1, 52.6, '結果：日本だけでも、年約<br>1,000億円分の実りが消えた。'],
  [52.6, 55.4, 'それでも野生の虫たちが、<br>約3,300億円分を支えている。'],
  [55.6, 59.4, '春の畑のブーンという音は、<br>実りの音だった。'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function shot0(t, T) { // hook: countdown over the meadow
  setFieldEnv('day'); setFlowers(1); setFruit(1); setBlossom(false); beesAt(T, true); spark.set(0);
  const u = ease(t / 2.6);
  look(lerp(1.5, 1.0, u), 1.6, lerp(7.5, 6.8, u), -0.5, 1.4, 2.0, 50);
  el.title.style.opacity = 1;
  setHud('ミツバチ消滅まで', cd(6 - T), 1, { mono: true });
  return field;
}
function shot1(t, T) { // everyday: bees on strawberries & flowers (countdown continues)
  setFieldEnv('day'); setFlowers(1); setFruit(1); beesAt(T, true); spark.set(0);
  const u = ease(t / 3.5);
  look(lerp(4, 6, u), lerp(2.2, 2.0, u), lerp(12, 11, u), 8.5, 0.6, 3.5, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('ミツバチ消滅まで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  return field;
}
function shot2(t, T) { // +1s vanish
  setFieldEnv('day'); setFlowers(1); setFruit(1); beesAt(T, t < 0.05); spark.set(clamp(t / 1.6));
  el.flash.style.opacity = 0.5 * Math.max(0, 1 - t / 0.3);
  const u = ease(t / 8);
  look(lerp(0, -1.5, u), lerp(4.5, 5.5, u), lerp(15, 17, u), 0, 0.8, 2, 50);
  hudTime('+1秒');
  const v = countUp(t, 236);
  setTop('日本で飼われているミツバチ（2024年）', `${v >= 10 ? Math.floor(v / 10) + '万' : ''}${v % 10 ? (v % 10) + '千' : ''}群`, fade(t, 0.15, 8, 0.25));
  return field;
}
function shot3(t, T) { // +1 month strawberries vanish
  setFieldEnv('day'); setFlowers(1); setFruit(1 - clamp((t - 1) / 5)); beesAt(T, false); spark.set(0);
  const u = ease(t / 8);
  look(lerp(5, 6.5, u), lerp(2.4, 2.1, u), lerp(11.5, 10.5, u), 9, 0.4, 3.8, 50);
  hudTime('+1か月');
  setTop('ミツバチで受粉する施設いちご（農水省）', '約' + countUp(t, 8) + '割', fade(t, 0.15, 8, 0.25));
  return field;
}
function shot4(t, T) { // +half year orchard without fruit
  setFieldEnv('day'); setFlowers(0.6); setBlossom(t < 2.2); setFruit(t < 2.2 ? 0 : 0); beesAt(T, false); spark.set(0);
  const u = ease(t / 8);
  look(lerp(-1.5, -2.5, u), lerp(3.4, 3.1, u), lerp(5.5, 4.5, u), -10, 2.2, -7.5, 50);
  hudTime('+半年');
  setTop('動物の受粉に頼る主な作物（IPBES 2016年）', countUp(t, 4) + '分の3以上', fade(t, 0.15, 8, 0.25));
  return field;
}
function shot5(t, T) { // +1 year supermarket shelves thin out
  for (const s of shelfItems) s.it.visible = s.k > 0.35 + clamp(t / 6) * 0.3;
  for (const q of queues) q.p.visible = false;
  const u = ease(t / 9);
  look(lerp(-6, -4, u), lerp(4, 3.5, u), lerp(6, 4, u), -9, 1.2, -12, 50);
  hudTime('+1年');
  setTop('受粉に頼る作物の生産量（IPBES 2016年）', '世界の' + countUp(t, 35) + '%', fade(t, 0.15, 9, 0.25));
  return market;
}
function shot6(t, T) { // value bars
  const g = easeOut(clamp(t / 1.4)), g2 = easeOut(clamp((t - 4.4) / 1.2));
  bars[0].setH(4700 / 1000 * 0.85 * g, comma(Math.round(4700 * g)) + '億円'); bars[1].setH(1000 / 1000 * 0.85 * g2, g2 > 0.01 ? comma(Math.round(1000 * g2)) + '億円' : '');
  bars[1].g.visible = true;
  const u = ease(t / 8.6);
  look(lerp(-0.4, 0.4, u), 4.4, lerp(16.5, 16, u), 0, 4.4, 0, 50);
  setTop('日本の農業の受粉の働き（2013年）', '約' + comma(countUp(t, 4700)) + '億円', fade(t, 0.15, 8.6, 0.25));
  return stage;
}
function shot7(t, T) { // result: grey, quiet field
  setFieldEnv('gray'); setFlowers(0.35); setFruit(0); setBlossom(false); beesAt(T, false); spark.set(0);
  const u = ease(t / 7.5);
  look(lerp(2, 4, u), lerp(6, 12, u), lerp(17, 24, u), 0, 0.5, 0, 50);
  setTop('失われたミツバチの受粉（日本・2013年）', '約' + comma(countUp(t, 1000, 0.2, 1.2)) + '億円', fade(t, 0.15, 7.5, 0.25), '#ffd27a');
  return field;
}
function shot8(t, T) { // loop: meadow with bees again
  setFieldEnv('day'); setFlowers(1); setFruit(1); setBlossom(false); beesAt(T, true); spark.set(0);
  const u = ease(t / 4);
  look(lerp(1.9, 1.7, u), 1.6, lerp(8.0, 7.8, u), -0.5, 1.4, 2.0, 50);
  setHud('ミツバチ消滅まで', '0:06.00', 1, { mono: true });
  return field;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot5,
  meta: {
    id: '0007',
    title: 'ミツバチが地球から消えたら？',
    titleHtml: 'ミツバチが<br>地球から消えたら？',
    mood: 'tension', seed: 8, hits: [6.0, 48.1], risers: [6.0],
    caption: 'もしもミツバチが地球から消えたら、いちごや果物はどうなる？\n日本で飼われているミツバチは23万6千群。世界の主な作物の4分の3以上がハチなどの受粉に頼っています。農林水産省とIPBESのデータでシミュレーション。\n\n出典：農林水産省 養蜂をめぐる情勢（令和7年3月）、IPBES 送粉者評価報告書（2016年）、農業環境技術研究所「日本の農業における送粉サービスの経済価値評価」（2013年時点）',
    hashtags: ['もしもラボ', 'ミツバチ', '受粉', '農業', '雑学'],
    endStats: [['日本のミツバチ', '23万6千群', '2024年'], ['ミツバチで受粉する施設いちご', '約8割', '農水省'], ['受粉に頼る主な作物', '4分の3以上', 'IPBES 2016年'], ['ミツバチの受粉の価値（日本）', '約1,000億円', '2013年']],
    sources: '出典：農林水産省 養蜂をめぐる情勢（令和7年3月）、IPBES（2016年）、<br>農業環境技術研究所 送粉サービスの経済価値評価（2013年時点）',
  },
});
